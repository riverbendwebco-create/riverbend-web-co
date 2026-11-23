/** RIVERBEND_BACKEND
 * Riverbend Web Co. form handler (Google Apps Script)
 * Loaded by apps-script/Code.gs from riverbendwebco.com. Edit this file and push; it goes live within 5 minutes.
 *
 * Receives the Free Preview form and signed Service Agreements from
 * riverbendwebco.com, then:
 *   1. Sends a clean, branded email to the owner (Reply goes to the customer)
 *   2. Saves any uploaded logo / signature to Google Drive
 *   3. Logs every submission to a Google Sheet
 *
 * Setup: see apps-script/SETUP.md
 */

var OWNER_EMAIL = 'riverbendwebco@gmail.com';
var SITE = 'riverbendwebco.com';
var MAX_FILE_BYTES = 5 * 1024 * 1024;
var ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf'];

/* ---------- Web endpoint ---------- */

function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (data.type && data.event_id && data.merchant_id) return json_(billWebhook_(data)); // Square webhook (nudge only)
    if (data.action && /^pay_/.test(String(data.action))) return json_(pay_(data)); // client payment page (private link)
    if (data.action && /^auth_/.test(String(data.action))) return json_(auth_(data)); // sign-in (individual accounts)
    if (data.action) return json_(studio_(data)); // Demo Studio (password protected)
    if (data._honey) return json_({ ok: true }); // bot trap: pretend success
    if (!throttle_()) return json_({ ok: false, error: 'busy' });

    var kind = data.kind === 'agreement' ? 'agreement' : 'lead';
    var f = clean_(data.fields || {});
    if (kind === 'lead' && (!f['Business Name'] || !f['Contact Name'] || !f['Phone or Email'])) {
      return json_({ ok: false, error: 'missing' });
    }

    var file = decodeFile_(data.file, kind === 'agreement' ? 'signature' : 'logo', f['Business Name'] || f['Business']);
    var driveUrl = '';
    if (file) {
      var saved = folder_(kind === 'agreement' ? 'Signatures' : 'Logos').createFile(file.blob);
      driveUrl = saved.getUrl();
    }
    var sheetUrl = log_(kind, f, driveUrl);
    var bill = null;
    var signer = kind === 'agreement' && data.token ? authSession_(String(data.token)) : null;
    if (kind === 'agreement') { try { bill = billCreateFromAgreement_(f, signer); } catch (eb) { console.error(eb); } }

    var pdf = null;
    if (kind === 'agreement') { try { pdf = agreementPdf_(f, file); } catch (ep) { console.error(ep); } }
    var mail = kind === 'agreement' ? agreementEmail_(f, file, driveUrl, sheetUrl, bill) : leadEmail_(f, file, driveUrl, sheetUrl);
    var reply = /@/.test(f['Phone or Email'] || f['Email'] || '') ? (f['Phone or Email'] || f['Email']) : '';
    var opts = { to: OWNER_EMAIL, subject: mail.subject, htmlBody: mail.html, body: mail.text, name: 'Riverbend Website' };
    if (reply && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(reply)) opts.replyTo = reply;
    if (file) {
      opts.attachments = [file.blob];
      if (file.previewable) opts.inlineImages = { preview: file.blob };
    }
    if (pdf) opts.attachments = (opts.attachments || []).concat([pdf]);
    MailApp.sendEmail(opts);
    if (kind === 'agreement' && pdf) { try { agreementToClient_(f, pdf); } catch (ec) { console.error(ec); } }
    // The client only gets the payment link on screen once Square is live (owner approved).
    // Practice runs: a business named "TEST ..." gets the payment button in test mode too.
    var showPay = bill && (bill.account.env === 'production' || /^test\b/i.test(bill.account.business));
    return json_({ ok: true, pay: showPay ? billPayUrl_(bill.key) : '' });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'version') return json_({ ok: true, billing: BILL_VERSION });
  if (p.action === 'demo') {
    try { applySeeds_(); } catch (e0) { console.error(e0); }
    try { return json_(publicDemo_(String(p.slug || ''))); } catch (err) { console.error(err); return json_({ ok: false, error: 'server' }); }
  }
  return ContentService.createTextOutput('Riverbend form handler is running.');
}

/* ---------- Email templates ---------- */

function leadEmail_(f, file, driveUrl, sheetUrl) {
  var reach = f['Phone or Email'] || '';
  var isEmail = /@/.test(reach);
  var digits = reach.replace(/\D/g, '');
  var actions = [];
  if (isEmail) actions.push(btn_('mailto:' + reach + '?subject=' + encodeURIComponent('Your free website preview from Riverbend Web Co.'), 'Email ' + first_(f['Contact Name']), true));
  else if (digits.length >= 10) {
    actions.push(btn_('tel:+1' + digits.slice(-10), 'Call ' + first_(f['Contact Name']), true));
    actions.push(btn_('sms:+1' + digits.slice(-10), 'Text', false));
  }
  if (sheetUrl) actions.push(btn_(sheetUrl, 'Open lead sheet', false));

  var rows = [
    ['Business', f['Business Name']],
    ['Contact', f['Contact Name']],
    [isEmail ? 'Email' : 'Phone', reach],
    ['Business type', f['Business Type']],
    ['Plan interest', f['Plan Interest']],
    ['Logo', file ? (file.name + (driveUrl ? ' &nbsp;<a href="' + driveUrl + '" style="color:#0052CC;text-decoration:none;font-weight:600">View in Drive</a>' : '')) : '<span style="color:#94A3B8">Not provided</span>']
  ];
  var steps = [
    'Reply within one business day.',
    'Build their free preview with their name and info on it.',
    'Send the preview and set up a quick chat.'
  ];
  var html = layout_({
    label: 'New free preview request',
    title: f['Business Name'],
    sub: f['Contact Name'] + ' &middot; ' + now_(),
    actions: actions,
    rows: rows,
    image: file && file.previewable ? { cid: 'preview', caption: 'Their logo' } : null,
    steps: steps
  });
  return {
    subject: unesc_('New lead: ' + f['Business Name'] + (f['Business Type'] ? ' (' + f['Business Type'] + ')' : '')),
    html: html,
    text: unesc_('New free preview request\n\n' + plain_(rows))
  };
}

function agreementEmail_(f, file, driveUrl, sheetUrl, bill) {
  var actions = [];
  if (/@/.test(f['Email'] || '')) actions.push(btn_('mailto:' + f['Email'] + '?subject=' + encodeURIComponent('Welcome to Riverbend Web Co.'), 'Email ' + first_(f['Owner']), true));
  var d = (f['Phone'] || '').replace(/\D/g, '');
  if (d.length >= 10) actions.push(btn_('tel:+1' + d.slice(-10), 'Call', !actions.length));
  if (sheetUrl) actions.push(btn_(sheetUrl, 'Open lead sheet', false));
  var scope = Object.keys(f).filter(function (k) { return /^Scope: /.test(k) && f[k]; }).map(function (k) { return [k.replace(/^Scope: /, 'Scope: '), f[k]]; });
  var rows = [
    ['Plan', f['Plan']],
    ['Business', f['Business']],
    ['Owner', f['Owner']],
    ['Phone', f['Phone']],
    ['Email', f['Email']],
    ['Signed', f['Signed']],
    ['Signature', (f['Signature'] || '') + (driveUrl ? ' &nbsp;<a href="' + driveUrl + '" style="color:#0052CC;text-decoration:none;font-weight:600">View in Drive</a>' : '')]
  ];
  rows = rows.concat(scope);
  if (bill) rows.push(['Payment setup', '<a href="' + billPayUrl_(bill.key) + '" style="color:#0052CC;text-decoration:none;font-weight:600">Client payment link</a>' + (bill.account.env === 'production' ? '' : ' (TEST MODE: Square sandbox, not shown to the client yet)')]);
  var html = layout_({
    label: 'Signed service agreement',
    title: f['Business'],
    sub: (f['Plan'] || '') + ' &middot; signed by ' + f['Owner'],
    actions: actions,
    rows: rows,
    image: file && file.previewable ? { cid: 'preview', caption: 'Signature' } : null,
    steps: [
      'The client sets up payment with the secure Square link (the setup fee is charged then if paying upfront). You get an email when it is done. Do not start development before that.',
      'Confirm the project scope in writing.',
      'Collect logo, hours, menu or services and photos within 5 days.',
      'Build the preview, get approval, and launch.'
    ],
    accent: '#16A34A'
  });
  return { subject: unesc_('Signed agreement: ' + f['Business'] + ' (' + (f['Plan'] || '') + ')'), html: html, text: 'Signed service agreement\n\n' + plain_(rows) };
}

function layout_(o) {
  var accent = o.accent || '#0052CC';
  var font = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
  var rowsHtml = o.rows.filter(function (r) { return r[1]; }).map(function (r, i) {
    return '<tr><td style="' + font + 'padding:13px 0;border-top:' + (i ? '1px solid #EEF2F6' : '0') + ';color:#64748B;font-size:13px;width:130px;vertical-align:top">' + r[0] + '</td>' +
      '<td style="' + font + 'padding:13px 0;border-top:' + (i ? '1px solid #EEF2F6' : '0') + ';color:#0F172A;font-size:15px;font-weight:600;vertical-align:top">' + r[1] + '</td></tr>';
  }).join('');
  var actionsHtml = o.actions.length ? '<tr><td style="padding:0 32px 8px">' + o.actions.join('') + '</td></tr>' : '';
  var imageHtml = o.image ? '<tr><td style="padding:8px 32px 0"><div style="' + font + 'font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748B;margin-bottom:8px">' + o.image.caption + '</div>' +
    '<div style="border:1px solid #E2E8F0;border-radius:10px;padding:18px;text-align:center;background:#F8FAFC"><img src="cid:' + o.image.cid + '" alt="' + o.image.caption + '" style="max-width:100%;max-height:160px"></div></td></tr>' : '';
  var stepsHtml = o.steps.map(function (s, i) {
    return '<tr><td style="' + font + 'width:26px;vertical-align:top;padding:4px 0"><div style="width:20px;height:20px;border-radius:6px;background:' + accent + ';color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:20px">' + (i + 1) + '</div></td>' +
      '<td style="' + font + 'font-size:14px;color:#334155;padding:4px 0 4px 6px">' + s + '</td></tr>';
  }).join('');

  return '<!doctype html><html><body style="margin:0;padding:0;background:#F1F5F9">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9"><tr><td align="center" style="padding:28px 12px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;border:1px solid #E2E8F0">' +
    // header
    '<tr><td style="background:#0F172A;padding:18px 32px"><table role="presentation" width="100%"><tr>' +
    '<td style="' + font + 'color:#FFFFFF;font-size:15px;font-weight:800;letter-spacing:.02em">Riverbend <span style="color:#60A5FA">Web Co.</span></td>' +
    '<td align="right" style="' + font + 'color:#94A3B8;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase">' + SITE + '</td></tr></table></td></tr>' +
    '<tr><td style="height:4px;background:' + accent + ';line-height:4px;font-size:0">&nbsp;</td></tr>' +
    // title
    '<tr><td style="padding:30px 32px 6px">' +
    '<div style="' + font + 'font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:' + accent + '">' + o.label + '</div>' +
    '<div style="' + font + 'font-size:28px;line-height:1.2;font-weight:800;color:#0F172A;margin-top:8px">' + o.title + '</div>' +
    '<div style="' + font + 'font-size:14px;color:#64748B;margin-top:6px">' + o.sub + '</div></td></tr>' +
    '<tr><td style="height:18px"></td></tr>' +
    actionsHtml +
    // details
    '<tr><td style="padding:12px 32px 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + rowsHtml + '</table></td></tr>' +
    imageHtml +
    // next steps
    '<tr><td style="padding:22px 32px 30px"><div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;padding:16px 18px">' +
    '<div style="' + font + 'font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748B;margin-bottom:8px">Next steps</div>' +
    '<table role="presentation" cellpadding="0" cellspacing="0">' + stepsHtml + '</table></div></td></tr>' +
    '</table>' +
    '<div style="' + font + 'font-size:12px;color:#94A3B8;margin-top:14px">Sent automatically from the form on ' + SITE + '. Hit Reply to answer the customer directly.</div>' +
    '</td></tr></table></body></html>';
}

function btn_(href, label, primary) {
  var font = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
  return '<a href="' + href + '" style="' + font + 'display:inline-block;margin:0 8px 8px 0;padding:11px 18px;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;' +
    (primary ? 'background:#0052CC;color:#FFFFFF;border:1px solid #0052CC' : 'background:#FFFFFF;color:#0F172A;border:1px solid #CBD5E1') + '">' + label + '</a>';
}

/* ---------- Helpers ---------- */

function clean_(obj) {
  var out = {};
  Object.keys(obj).slice(0, 30).forEach(function (k) {
    var key = String(k).slice(0, 40);
    out[key] = esc_(String(obj[k] == null ? '' : obj[k]).replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, 500));
  });
  return out;
}

function esc_(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function decodeFile_(file, prefix, biz) {
  if (!file || !file.data) return null;
  var type = String(file.type || '').toLowerCase();
  if (ALLOWED_TYPES.indexOf(type) < 0) return null;
  var bytes = Utilities.base64Decode(String(file.data).replace(/^data:[^,]*,/, ''));
  if (!bytes.length || bytes.length > MAX_FILE_BYTES) return null;
  var ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg', 'application/pdf': 'pdf' }[type];
  var safeBiz = String(biz || 'business').replace(/&[a-z#0-9]+;/gi, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'business';
  var name = prefix + '-' + safeBiz + '.' + ext;
  return { blob: Utilities.newBlob(bytes, type, name), name: name, previewable: /^image\/(png|jpeg|webp)$/.test(type) };
}

function folder_(sub) {
  var props = PropertiesService.getScriptProperties();
  var rootId = props.getProperty('ROOT_FOLDER');
  var root;
  try { root = rootId ? DriveApp.getFolderById(rootId) : null; } catch (e) { root = null; }
  if (!root) { root = DriveApp.createFolder('Riverbend Leads'); props.setProperty('ROOT_FOLDER', root.getId()); }
  var it = root.getFoldersByName(sub);
  return it.hasNext() ? it.next() : root.createFolder(sub);
}

function log_(kind, f, fileUrl) {
  var ss = ss_();
  var un = unesc_;
  var safe = function (s) { s = un(s); return /^[=+\-@]/.test(s) ? "'" + s : s; }; // block spreadsheet formula injection
  if (kind === 'agreement') {
    ss.getSheetByName('Signed Agreements').appendRow([new Date(), safe(f['Plan']), safe(f['Business']), safe(f['Owner']), safe(f['Phone']), safe(f['Email']), safe(f['Signed']), fileUrl, safe(Object.keys(f).filter(function (k) { return /^Scope: /.test(k) && f[k]; }).map(function (k) { return k.replace(/^Scope: /, '') + ': ' + f[k]; }).join(' | ').slice(0, 5000))]);
  } else {
    ss.getSheetByName('Preview Requests').appendRow([new Date(), safe(f['Business Name']), safe(f['Contact Name']), safe(f['Phone or Email']), safe(f['Business Type']), safe(f['Plan Interest']), fileUrl, 'New']);
  }
  return ss.getUrl();
}

function ss_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  var ss;
  try { ss = id ? SpreadsheetApp.openById(id) : null; } catch (e) { ss = null; }
  if (!ss) {
    ss = SpreadsheetApp.create('Riverbend Leads');
    props.setProperty('SHEET_ID', ss.getId());
    DriveApp.getFileById(ss.getId()).moveTo(folder_root_());
    var a = ss.getSheets()[0].setName('Preview Requests');
    a.appendRow(['Received', 'Business', 'Contact', 'Phone or Email', 'Business Type', 'Plan Interest', 'Logo', 'Status']);
    var b = ss.insertSheet('Signed Agreements');
    b.appendRow(['Received', 'Plan', 'Business', 'Owner', 'Phone', 'Email', 'Signed', 'Signature']);
    [a, b].forEach(function (s) { s.setFrozenRows(1); s.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#0F172A').setFontColor('#FFFFFF'); });
  }
  return ss;
}

function folder_root_() {
  folder_('Logos');
  return DriveApp.getFolderById(PropertiesService.getScriptProperties().getProperty('ROOT_FOLDER'));
}

function throttle_() {
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get('rb_count') || 0);
  if (n > 30) return false; // max ~30 submissions per 10 minutes
  cache.put('rb_count', String(n + 1), 600);
  return true;
}

function unesc_(s) { return String(s || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'); }
function first_(name) { return String(name || '').split(' ')[0] || 'them'; }
function now_() { return Utilities.formatDate(new Date(), 'America/Chicago', "EEE, MMM d 'at' h:mm a"); }
function plain_(rows) { return rows.filter(function (r) { return r[1]; }).map(function (r) { return r[0] + ': ' + String(r[1]).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' '); }).join('\n'); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* Run this once from the editor to grant permissions and send yourself a sample email. */
function sendTestEmail() {
  var e = { postData: { contents: JSON.stringify({ kind: 'lead', fields: { 'Business Name': 'Donut Brothers (test)', 'Contact Name': 'Test Customer', 'Phone or Email': '(563) 555-0123', 'Business Type': 'Bar/Restaurant', 'Plan Interest': 'Growth' } }) } };
  Logger.log(doPost(e).getContent());
}

/* =====================================================================
 * DEMO STUDIO
 * Password-protected admin (riverbendwebco.com/studio) that saves demo
 * websites for prospects, and a public endpoint that serves one demo by
 * its link (riverbendwebco.com/demo/?d=slug). Private fields (contact,
 * notes, status) are never sent to the public demo page.
 *
 * Password: Apps Script > Project Settings > Script Properties >
 *   Property ADMIN_PASSWORD = your password
 * ===================================================================== */

var DEMO_STYLES = ['pub', 'lounge', 'trade', 'western'];
var DEMO_STATUS = ['Draft', 'Ready', 'Pitched', 'Won', 'Lost'];
var DEMO_IMG_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
var DEMO_MAX_IMG = 2 * 1024 * 1024;
var TOKEN_TTL = 6 * 60 * 60; // 6 hours

/* One-time demo updates made outside the Studio live in demo/data/seeds.json
   (data only, so the design team can ship them without touching this file).
   Each seed runs once per key, goes through normalizeDemo_, keeps the logo,
   status and notes, and then the Studio owns the demo again.
   Seed fields: key, slug, data, optional patch (merge into the saved demo)
   and dropHero (remove an uploaded hero image). */
var SEEDS_URL = 'https://riverbendwebco.com/demo/data/seeds.json';
function demoSeeds_() {
  var cache = CacheService.getScriptCache();
  var raw = cache.get('demo_seeds');
  if (raw == null) {
    try {
      var r = UrlFetchApp.fetch(SEEDS_URL + '?t=' + Date.now(), { muteHttpExceptions: true, followRedirects: true });
      raw = r.getResponseCode() === 200 ? r.getContentText() : '[]';
    } catch (e) { raw = '[]'; }
    if (raw.length < 90000) cache.put('demo_seeds', raw, 300);
  }
  var list;
  try { list = JSON.parse(raw); } catch (e) { return []; }
  if (!Array.isArray(list)) return [];
  return list.filter(function (sd) {
    return sd && /^[a-z0-9-]{1,60}$/.test(String(sd.key)) && (/^[a-z0-9-]{3,80}$/.test(String(sd.slug)) || (!sd.slug && sd.patch && /^[\w &'.-]{3,80}$/.test(String(sd.matchName || '')))) &&
      sd.data && typeof sd.data === 'object' && !Array.isArray(sd.data);
  }).slice(0, 60);
}
function applySeeds_() {
  var props = PropertiesService.getScriptProperties();
  demoSeeds_().forEach(function (sd) {
    if (props.getProperty('seed_' + sd.key)) return;
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) return;
    try {
      if (props.getProperty('seed_' + sd.key)) return;
      var sh = demoSheet_();
      var rows = [];
      if (sd.slug) { var r0 = findRow_(sh, sd.slug); if (r0) rows.push(r0); }
      else if (sd.matchName && sd.patch) {
        /* patch every demo whose business name matches (used when the slug is not known) */
        var want = String(sd.matchName).toLowerCase().replace(/[^a-z0-9]/g, ''), last = sh.getLastRow();
        if (want && last >= 2) sh.getRange(2, 1, last - 1, 2).getValues().forEach(function (v, i) {
          if (String(v[1]).toLowerCase().replace(/[^a-z0-9]/g, '') === want) rows.push(i + 2);
        });
      }
      rows.forEach(function (row) {
        var slug = String(sh.getRange(row, 1).getValue());
        var prev = JSON.parse(sh.getRange(row, 7).getValue() || '{}');
        var src = JSON.parse(JSON.stringify(sd.data));
        if (sd.patch) { var base = JSON.parse(JSON.stringify(prev)); Object.keys(src).forEach(function (k) { base[k] = src[k]; }); src = base; }
        src.private = prev.private || {};
        var demo = normalizeDemo_(src);
        demo.logoId = prev.logoId || '';
        demo.heroId = prev.heroId || '';
        if (sd.dropHero && demo.heroId) { trash_(demo.heroId); demo.heroId = ''; }
        demo.updated = new Date().toISOString();
        var safe = function (v) { v = String(v || ''); return /^[=+\-@]/.test(v) ? "'" + v : v; };
        sh.getRange(row, 1, 1, 7).setValues([[slug, safe(demo.name), demo.style, safe(demo.city), demo.private.status, new Date(), JSON.stringify(demo)]]);
      });
      props.setProperty('seed_' + sd.key, new Date().toISOString());
    } catch (e) { console.error(e); } finally { lock.releaseLock(); }
  });
}

function studio_(d) {
  try { applySeeds_(); } catch (e) { console.error(e); }
  if (d.action === 'login') return login_(String(d.password || ''));
  if (d.action === 'bot_login') return botLogin_(String(d.jwt || ''));
  // Billing has its own owner-only login (not the Studio password).
  var me = authSession_(d.token), legacy = authLegacyOn_();
  if (d.action === 'billing_login') return legacy ? billLogin_(String(d.password || '')) : { ok: false, error: 'disabled' };
  if (d.action === 'billing_reset') return legacy ? billPwReset_() : { ok: false, error: 'disabled' };
  if (/^team_/.test(String(d.action))) { if (!me || me.role !== 'owner') return { ok: false, error: 'auth' }; return team_(d, me); }
  if (d.action === 'sales_customers') { if (!me) return { ok: false, error: 'auth' }; return salesCustomers_(me); }
  if (/^billing_/.test(String(d.action))) {
    // Owners only (server-side). Salespeople are refused even if they call this directly.
    if (!(me && me.role === 'owner') && !(legacy && billAuthed_(d.token)) && !botAuthed_(d.token, d.action)) return { ok: false, error: 'auth' };
    d._who = me ? me.email : (botAuthed_(d.token, d.action) ? 'daily job' : 'shared billing password');
    // Payment settings, live Square changes and test tools need an individual owner account.
    if (!me && !botAuthed_(d.token, d.action) && BILL_OWNER_ONLY[d.action]) { var den = { ok: false, error: 'account', detail: 'Sign in with your own owner account (riverbendwebco.com/login) for payment settings.' }; billAudit_(d, den); return den; }
    if (d.action === 'billing_logout') { CacheService.getScriptCache().remove('btok_' + d.token); return { ok: true }; }
    var res;
    try { res = billing_(d); } catch (eb) { console.error(eb); res = { ok: false, error: 'server', detail: String(eb).slice(0, 200) }; }
    billAudit_(d, res);
    return res;
  }
  if (me) { if (me.role !== 'owner' && !AUTH_SALES_OK[d.action]) return { ok: false, error: 'auth' }; }
  else if (!(legacy && authed_(d.token)) && !botAuthed_(d.token, d.action)) return { ok: false, error: 'auth' };
  if (me && me.role === 'sales' && /^leads_/.test(d.action)) return leadsForRep_(d, me);
  switch (d.action) {
    case 'list': return { ok: true, demos: listDemos_() };
    case 'get': return getDemo_(String(d.slug || ''), true);
    case 'save': return saveDemo_(d);
    case 'delete': return deleteDemo_(String(d.slug || ''));
    case 'status': return setDemoStatus_(String(d.slug || ''), String(d.status || ''));
    case 'scan': return scanSite_(String(d.url || ''));
    case 'image': return grabImage_(String(d.url || ''));
    case 'logout': CacheService.getScriptCache().remove('tok_' + d.token); return { ok: true };
    case 'leads_status': return leadsStatus_();
    case 'leads_key': return leadsSetKey_(String(d.key || ''));
    case 'leads_find': return leadsFind_(d);
    case 'leads_verify': return leadsVerify_(d);
    case 'leads_saved': return { ok: true, leads: leadsSaved_() };
    case 'leads_save': return leadsSave_(d.lead || {});
    case 'leads_update': return leadsUpdate_(String(d.id || ''), d);
    case 'leads_demo': return leadsDemo_(d.lead || {});
  }
  return { ok: false, error: 'unknown' };
}

/* Studio password. Only a salted SHA-256 hash lives here (this file is public).
   To change it: pick a long random password, set STUDIO_PW_HASH to
   sha256(STUDIO_PW_SALT + password) in hex, and bump STUDIO_PW_GEN so
   everyone signed in with the old password is signed out.
   Leave STUDIO_PW_HASH empty to fall back to Script Properties > ADMIN_PASSWORD. */
var STUDIO_PW_SALT = 'c3ec4cc852cac2e771470ef8de7a11a6';
var STUDIO_PW_HASH = '983a93265453b7a91d8ce828b405a35ac9909bc9d7a45a272e340d416288d0d8';
var STUDIO_PW_GEN = '3';

/* Daily lead finder robot (.github/workflows/daily-leads.yml).
   It has no password: GitHub gives the running job a signed ID token (OIDC), and we
   check GitHub's signature and that it is our own daily-leads workflow on main.
   The robot can only find, check and save leads. */
var BOT_REPO = 'riverbendwebco-create/riverbend-web-co';
var BOTS = {
  leads: { workflow: BOT_REPO + '/.github/workflows/daily-leads.yml@refs/heads/main', aud: 'riverbend-leads', actions: { leads_find: 1, leads_verify: 1, leads_saved: 1, leads_save: 1 } },
  billing: { workflow: BOT_REPO + '/.github/workflows/daily-billing.yml@refs/heads/main', aud: 'riverbend-billing', actions: { billing_tick: 1 } }
};
var GH_OIDC = 'https://token.actions.githubusercontent.com';

function b64uBytes_(s) { s = String(s); while (s.length % 4) s += '='; return Utilities.base64DecodeWebSafe(s); }
function bytesHex_(b) { return b.map(function (x) { return ('0' + (x & 255).toString(16)).slice(-2); }).join(''); }
function modPow_(b, e, m) {
  var r = BigInt(1), zero = BigInt(0), one = BigInt(1);
  b = b % m;
  while (e > zero) { if ((e & one) === one) r = (r * b) % m; e = e >> one; b = (b * b) % m; }
  return r;
}
function rsaVerify_(n64, e64, data, sig64) {
  var nHex = bytesHex_(b64uBytes_(n64)).replace(/^(00)+/, '');
  var k = Math.ceil(nHex.length / 2);
  var n = BigInt('0x' + nHex), e = BigInt('0x' + bytesHex_(b64uBytes_(e64)));
  var sigHex = bytesHex_(b64uBytes_(sig64));
  if (sigHex.length / 2 !== k) return false;
  var m = modPow_(BigInt('0x' + sigHex), e, n).toString(16);
  while (m.length < k * 2) m = '0' + m;
  var hash = bytesHex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, data, Utilities.Charset.UTF_8));
  var tail = '003031300d060960864801650304020105000420' + hash;
  var want = '0001' + new Array(k * 2 - 4 - tail.length + 1).join('f') + tail;
  return sameHex_(m, want);
}
function ghKeys_(force) {
  var cache = CacheService.getScriptCache();
  var hit = !force && cache.get('gh_jwks');
  if (hit) return JSON.parse(hit);
  var r = UrlFetchApp.fetch(GH_OIDC + '/.well-known/jwks', { muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return { keys: [] };
  var t = r.getContentText();
  if (t.length < 90000) cache.put('gh_jwks', t, 6 * 60 * 60);
  return JSON.parse(t);
}
function botLogin_(jwt) {
  var p = jwt.split('.');
  if (p.length !== 3) return { ok: false, error: 'auth' };
  try {
    var head = JSON.parse(Utilities.newBlob(b64uBytes_(p[0])).getDataAsString());
    var c = JSON.parse(Utilities.newBlob(b64uBytes_(p[1])).getDataAsString());
    if (head.alg !== 'RS256') return { ok: false, error: 'auth' };
    var now = Date.now() / 1000;
    var bot = Object.keys(BOTS).filter(function (k) { return BOTS[k].workflow === c.workflow_ref && BOTS[k].aud === c.aud; })[0];
    if (!bot || c.iss !== GH_OIDC || c.repository !== BOT_REPO || c.ref !== 'refs/heads/main' || !(c.exp > now) || !(c.iat < now + 120)
      || ['schedule', 'workflow_dispatch', 'push'].indexOf(c.event_name) < 0) return { ok: false, error: 'auth' };
    var find = function (ks) { return (ks.keys || []).filter(function (k) { return k.kid === head.kid && k.kty === 'RSA'; })[0]; };
    var key = find(ghKeys_(false)) || find(ghKeys_(true));
    if (!key || !rsaVerify_(key.n, key.e, p[0] + '.' + p[1], p[2])) return { ok: false, error: 'auth' };
  } catch (e) { return { ok: false, error: 'auth' }; }
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put('bot_' + token, bot, 3600);
  return { ok: true, token: token };
}
function botAuthed_(token, action) {
  if (!token || !/^[a-f0-9]{64}$/.test(String(token))) return false;
  var bot = CacheService.getScriptCache().get('bot_' + token);
  return !!(bot && BOTS[bot] && BOTS[bot].actions[action]);
}

function sha256Hex_(v) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, v, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}
function sameHex_(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function login_(pw) {
  if (!authLegacyOn_()) return { ok: false, error: 'disabled' };
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('rb_fail') || 0);
  if (fails >= 8) return { ok: false, error: 'locked' };
  var ok = false;
  if (STUDIO_PW_HASH) {
    ok = !!pw && sameHex_(sha256Hex_(STUDIO_PW_SALT + pw), STUDIO_PW_HASH);
  } else {
    var real = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
    if (!real) { ensurePassword_(); return { ok: false, error: 'nopassword' }; }
    ok = !!pw && sameHash_(pw, real);
  }
  if (!ok) {
    cache.put('rb_fail', String(fails + 1), 900); // lock for 15 min after 8 misses
    Utilities.sleep(600);
    return { ok: false, error: 'badpassword' };
  }
  cache.remove('rb_fail');
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  cache.put('tok_' + token, STUDIO_PW_GEN, TOKEN_TTL);
  return { ok: true, token: token };
}

function sameHash_(a, b) {
  var x = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, a, Utilities.Charset.UTF_8);
  var y = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, b, Utilities.Charset.UTF_8);
  var diff = 0;
  for (var i = 0; i < x.length; i++) diff |= (x[i] ^ y[i]);
  return diff === 0;
}

function authed_(token) {
  if (!token || !/^[a-f0-9]{64}$/.test(String(token))) return false;
  var cache = CacheService.getScriptCache();
  if (cache.get('tok_' + token) !== STUDIO_PW_GEN) return false; // old sessions end when the password changes
  cache.put('tok_' + token, STUDIO_PW_GEN, TOKEN_TTL); // sliding session
  return true;
}

function demoSheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName('Demos');
  if (!sh) {
    sh = ss.insertSheet('Demos');
    sh.appendRow(['Slug', 'Business', 'Style', 'City', 'Status', 'Updated', 'Data (do not edit)']);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#0F172A').setFontColor('#FFFFFF');
  }
  return sh;
}

function findRow_(sh, slug) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var slugs = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < slugs.length; i++) if (slugs[i][0] === slug) return i + 2;
  return 0;
}

function listDemos_() {
  var sh = demoSheet_();
  var last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, 7).getValues().map(function (r) {
    var cat = ''; try { cat = String((JSON.parse(r[6] || '{}') || {}).category || '').slice(0, 60); } catch (e) {}
    return { slug: r[0], name: r[1], style: r[2], city: r[3], status: r[4], updated: r[5] ? new Date(r[5]).toISOString() : '', category: cat };
  }).filter(function (r) { return r.slug; }).sort(function (a, b) { return a.updated < b.updated ? 1 : -1; });
}

function getDemo_(slug, withPrivate) {
  if (!/^[a-z0-9-]{3,80}$/.test(slug)) return { ok: false, error: 'notfound' };
  var sh = demoSheet_();
  var row = findRow_(sh, slug);
  if (!row) return { ok: false, error: 'notfound' };
  var demo = JSON.parse(sh.getRange(row, 7).getValue() || '{}');
  demo.slug = slug;
  if (!withPrivate) delete demo.private;
  demo.logo = imgData_(demo.logoId);
  demo.hero = imgData_(demo.heroId);
  delete demo.logoId; delete demo.heroId;
  return { ok: true, demo: demo };
}

function publicDemo_(slug) {
  var r = getDemo_(slug, false);
  if (r.ok) delete r.demo.updated;
  return r;
}

function saveDemo_(d) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sh = demoSheet_();
    var src = d.demo || {};
    var slug = String(d.slug || '');
    var row = slug ? findRow_(sh, slug) : 0;
    var prev = row ? JSON.parse(sh.getRange(row, 7).getValue() || '{}') : {};
    var demo = normalizeDemo_(src);
    if (!demo.name) return { ok: false, error: 'name' };

    ['reviews', 'reviewsSource', 'reviewLink', 'heroUrl', 'storyPhoto', 'variant', 'x'].forEach(function (k) { if (src[k] === undefined && prev[k] !== undefined) demo[k] = prev[k]; });
    if (d.hero || d.removeHero) demo.heroUrl = '';
    demo.logoId = prev.logoId || '';
    demo.heroId = prev.heroId || '';
    if (d.removeLogo) { trash_(demo.logoId); demo.logoId = ''; }
    if (d.removeHero) { trash_(demo.heroId); demo.heroId = ''; }
    if (d.logo) { var l = saveImg_(d.logo, 'logo', demo.name); if (l) { trash_(demo.logoId); demo.logoId = l; } }
    if (d.hero) { var h = saveImg_(d.hero, 'hero', demo.name); if (h) { trash_(demo.heroId); demo.heroId = h; } }

    if (!row) {
      slug = slugify_(demo.name) + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 5);
      sh.appendRow([slug]);
      row = sh.getLastRow();
    }
    demo.updated = new Date().toISOString();
    var safe = function (s) { s = String(s || ''); return /^[=+\-@]/.test(s) ? "'" + s : s; };
    sh.getRange(row, 1, 1, 7).setValues([[slug, safe(demo.name), demo.style, safe(demo.city), demo.private.status, new Date(), JSON.stringify(demo)]]);
    return { ok: true, slug: slug };
  } finally {
    lock.releaseLock();
  }
}

/* Quick status change from the Studio card buttons (Ready, Pitched, Won, Lost). Only the status changes. */
function setDemoStatus_(slug, status) {
  if (DEMO_STATUS.indexOf(status) < 0) return { ok: false, error: 'status' };
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sh = demoSheet_();
    var row = findRow_(sh, slug);
    if (!row) return { ok: false, error: 'notfound' };
    var demo = JSON.parse(sh.getRange(row, 7).getValue() || '{}');
    demo.private = demo.private || {};
    demo.private.status = status;
    demo.updated = new Date().toISOString();
    sh.getRange(row, 5, 1, 3).setValues([[status, new Date(), JSON.stringify(demo)]]);
    return { ok: true, slug: slug, status: status };
  } finally {
    lock.releaseLock();
  }
}

function deleteDemo_(slug) {
  var sh = demoSheet_();
  var row = findRow_(sh, slug);
  if (!row) return { ok: false, error: 'notfound' };
  var demo = JSON.parse(sh.getRange(row, 7).getValue() || '{}');
  trash_(demo.logoId); trash_(demo.heroId);
  sh.deleteRow(row);
  return { ok: true };
}

function normalizeDemo_(s) {
  var t = function (v, max, multi) {
    v = String(v == null ? '' : v);
    v = multi ? v.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ') : v.replace(/[\u0000-\u001F\u007F]/g, ' ');
    return v.trim().slice(0, max);
  };
  var url = function (v) { v = t(v, 300); return /^https?:\/\/[^\s"'<>]+$/i.test(v) ? v : ''; };
  var color = function (v, dflt) { v = t(v, 7); return /^#[0-9a-fA-F]{6}$/.test(v) ? v : dflt; };
  var arr = function (v) { return Array.isArray(v) ? v : []; };
  var extra = function (v, depth) {
    if (v == null) return undefined;
    if (typeof v === 'string') return t(v, 600, true);
    if (typeof v === 'number') return isFinite(v) ? v : undefined;
    if (typeof v === 'boolean') return v;
    if (depth >= 3 || typeof v !== 'object') return undefined;
    if (Array.isArray(v)) return v.slice(0, 40).map(function (i) { return extra(i, depth + 1); }).filter(function (i) { return i !== undefined; });
    var o = {};
    Object.keys(v).slice(0, 40).forEach(function (k) { if (/^[A-Za-z][A-Za-z0-9_]{0,30}$/.test(k)) { var e = extra(v[k], depth + 1); if (e !== undefined) o[k] = e; } });
    return o;
  };
  var x = s.x && typeof s.x === 'object' && !Array.isArray(s.x) ? extra(s.x, 0) : {};
  if (JSON.stringify(x).length > 20000) x = {};
  var style = DEMO_STYLES.indexOf(s.style) >= 0 ? s.style : 'pub';
  var p = s.private || {};
  var hours = arr(s.hours).slice(0, 7).map(function (h) { return t(h, 60); });
  while (hours.length < 7) hours.push('');
  return {
    name: t(s.name, 80),
    style: style,
    category: t(s.category, 60),
    tagline: t(s.tagline, 120),
    about: t(s.about, 1200, true),
    address: t(s.address, 120),
    city: t(s.city, 60),
    phone: t(s.phone, 30),
    email: t(s.email, 100),
    website: url(s.website),
    hours: hours,
    items: arr(s.items).slice(0, 60).map(function (i) { var o = { group: t(i.group, 40), name: t(i.name, 80), price: t(i.price, 20), desc: t(i.desc, 240) }; var ph = t(i.photo, 400); if (/^https:\/\/[^\s"'<>]+$/i.test(ph)) o.photo = ph; return o; }).filter(function (i) { return i.name; }),
    specials: arr(s.specials).slice(0, 12).map(function (i) { var o = { title: t(i.title, 80), when: t(i.when, 60), detail: t(i.detail, 240) }; var ph = arr(i.photos).slice(0, 8).map(function (u) { return url(u); }).filter(function (u) { return /^https:/i.test(u); }); if (ph.length) o.photos = ph; return o; }).filter(function (i) { return i.title; }),
    reviews: arr(s.reviews).slice(0, 12).map(function (r) { return { text: t(r.text, 600), name: t(r.name, 60), stars: Math.max(1, Math.min(5, parseInt(r.stars, 10) || 5)) }; }).filter(function (r) { return r.text && r.name; }),
    reviewsSource: t(s.reviewsSource, 120),
    reviewLink: url(s.reviewLink),
    heroUrl: /^https:/i.test(url(s.heroUrl)) ? url(s.heroUrl) : '',
    storyPhoto: /^https:/i.test(url(s.storyPhoto)) ? url(s.storyPhoto) : '',
    variant: /^[a-z0-9-]{1,30}$/.test(String(s.variant || '')) ? String(s.variant) : '',
    x: x,
    colors: { primary: color((s.colors || {}).primary, ''), accent: color((s.colors || {}).accent, '') },
    heroPreset: /^[0-9a-f-]{8,40}$/.test(String(s.heroPreset || '')) ? String(s.heroPreset) : '',
    photos: arr(s.photos).slice(0, 12).map(function (u) { u = t(u, 400); return /^https:\/\/[^\s"'<>]+\.(png|jpe?g|webp)(\?[^\s"'<>]*)?$/i.test(u) ? u : ''; }).filter(Boolean),
    social: { facebook: url((s.social || {}).facebook), instagram: url((s.social || {}).instagram) },
    private: {
      contact: t(p.contact, 80),
      contactPhone: t(p.contactPhone, 40),
      notes: t(p.notes, 2000, true),
      status: DEMO_STATUS.indexOf(p.status) >= 0 ? p.status : 'Draft'
    }
  };
}

function saveImg_(file, kind, name) {
  if (!file || !file.data) return '';
  var type = String(file.type || '').toLowerCase();
  if (DEMO_IMG_TYPES.indexOf(type) < 0) return '';
  if (kind === 'hero' && type === 'image/svg+xml') return '';
  var bytes = Utilities.base64Decode(String(file.data).replace(/^data:[^,]*,/, ''));
  if (!bytes.length || bytes.length > DEMO_MAX_IMG) return '';
  var ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/svg+xml': 'svg' }[type];
  var f = folder_('Demo Images').createFile(Utilities.newBlob(bytes, type, kind + '-' + slugify_(name) + '.' + ext));
  return f.getId();
}

function imgData_(id) {
  if (!id) return '';
  try {
    var blob = DriveApp.getFileById(id).getBlob();
    return 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(blob.getBytes());
  } catch (e) { return ''; }
}

function trash_(id) { if (id) { try { DriveApp.getFileById(id).setTrashed(true); } catch (e) {} } }

function slugify_(s) {
  return String(s || 'demo').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'demo';
}

/* First run: create a strong Studio password and email it to the owner.
   Change it anytime in Project Settings > Script Properties > ADMIN_PASSWORD. */
function ensurePassword_() {
  var props = PropertiesService.getScriptProperties();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (props.getProperty('ADMIN_PASSWORD')) return;
    var words = ['River', 'Bluff', 'Lock', 'Dam', 'Main', 'Shot', 'Tower', 'Bridge', 'Harbor', 'Cable', 'Eagle', 'Point', 'Oak', 'Ember', 'Tap', 'Crew'];
    var pick = function () { return words[Math.floor(Math.random() * words.length)]; };
    var pw = pick() + '-' + pick() + '-' + pick() + '-' + (1000 + Math.floor(Math.random() * 9000));
    props.setProperty('ADMIN_PASSWORD', pw);
    MailApp.sendEmail({
      to: OWNER_EMAIL, name: 'Riverbend Website', subject: 'Your Demo Studio password',
      htmlBody: '<div style="font-family:Arial,sans-serif;font-size:15px;color:#0F172A">' +
        '<p>Your Riverbend Demo Studio is ready.</p>' +
        '<p><b>Link:</b> <a href="https://riverbendwebco.com/studio/">riverbendwebco.com/studio</a><br>' +
        '<b>Password:</b> <span style="font-family:monospace;font-size:17px;background:#F1F5F9;padding:3px 6px;border-radius:4px">' + pw + '</span></p>' +
        '<p>Share both with your design team. To change the password, open the script in Apps Script, go to Project Settings, Script Properties, ADMIN_PASSWORD.</p></div>'
    });
  } finally { lock.releaseLock(); }
}

/* Optional: run this once from the editor to get the password emailed right away. */
function setupStudio() { ensurePassword_(); Logger.log('Password emailed to ' + OWNER_EMAIL); }

/* =====================================================================
 * WEBSITE READER (Studio chat assistant)
 * Reads a business website and pulls out what it can: name, phone,
 * email, address, hours, menu or services with prices, about text and
 * social links. Uses structured data first, then page text.
 * ===================================================================== */

var DAY_KEYS = ['mo', 'tu', 'we', 'th', 'fr', 'sa', 'su'];

function scanSite_(raw) {
  var url = normUrl_(raw);
  if (!url) return { ok: false, error: 'badurl' };
  var first = fetchPage_(url);
  if (!first) return { ok: false, error: 'unreachable' };
  var pages = [first];
  var host = hostOf_(first.url);
  var origin = (first.url.match(/^https?:\/\/[^\/]+/i) || [''])[0];
  var home = origin + '/';
  if (first.url.replace(/[?#].*$/, '') !== home) { var hp = fetchPage_(home); if (hp) pages.push(hp); }
  var links = navLinks_(first.html + ' ' + (pages[1] ? pages[1].html : ''), first.url, host).filter(function (u) { return u.replace(/\/$/, '') !== first.url.replace(/\/$/, '') && u !== home; });
  var gal = links.filter(function (u) { return /gallery|photos|pictures/i.test(u); }).slice(0, 1);
  var extra = gal.concat(links.filter(function (u) { return gal.indexOf(u) < 0; })).slice(0, 5);
  extra.forEach(function (u) { var p = fetchPage_(u); if (p) pages.push(p); });

  var out = { name: '', category: '', tagline: '', about: '', address: '', city: '', phone: '', email: '',
    hours: ['', '', '', '', '', '', ''], items: [], social: { facebook: '', instagram: '' }, style: '', website: first.url };
  var types = [];
  pages.forEach(function (pg) { fromJsonLd_(pg.html, out, types); });
  pages.forEach(function (pg) { fromHtml_(pg, out); });
  if (out.items.length < 5) pages.forEach(function (pg) { if (out.items.length < 60) menuFromText_(pg.html, out); });
  var media = [];
  pages.forEach(function (pg) { menuMedia_(pg.html, pg.url, media); });
  var pics = media.filter(function (m) { return !/\.pdf(\?|$)/i.test(m); }), pdfs = media.filter(function (m) { return /\.pdf(\?|$)/i.test(m); });
  out.menuFiles = media.slice(0, 6);
  var photos = [];
  pages.forEach(function (pg) { sitePhotos_(pg.html, pg.url, photos, media); });
  out.photos = photos.slice(0, 30);
  out.menuRead = 0;
  if (out.items.length < 5 && media.length) {
    var queue = (pics.length ? pics : pdfs).slice(0, 3), before = out.items.length;
    queue.forEach(function (u) { var txt = ocr_(u); if (txt) { out.menuRead++; menuFromLines_(txt.split(/\r?\n/), out); } });
    out.menuFromPictures = out.items.length - before;
  }
  if (!out.hours.some(String)) pages.forEach(function (pg) { hoursFromText_(embeddedText_(pg.html), out); });
  if (out.hours.filter(String).length < 7) pages.forEach(function (pg) { hoursFromText_(textOf_(pg.html), out); });
  out.phone = fmtPhone_(out.phone);
  out.style = styleFromTypes_(types) || guessStyle_(out.name + ' ' + out.category + ' ' + out.about + ' ' + pages.map(function (p) { return p.title; }).join(' '));
  out.items = out.items.slice(0, 60);
  var count = ['name', 'phone', 'email', 'address', 'about'].filter(function (k) { return out[k]; }).length + (out.hours.some(String) ? 1 : 0) + (out.items.length ? 1 : 0);
  return { ok: true, found: out, pages: pages.map(function (p) { return p.url; }), score: count };
}

function normUrl_(u) {
  u = String(u || '').trim();
  if (!u) return '';
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u.replace(/^\/+/, '');
  if (!/^https?:\/\/[a-z0-9.-]+\.[a-z]{2,}(:\d+)?(\/[^\s"'<>]*)?$/i.test(u)) return '';
  if (/^https?:\/\/(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.)/i.test(u)) return '';
  if (/^https?:\/\/[^\/]+$/i.test(u)) u += '/';
  return u;
}
function hostOf_(u) { var m = String(u).match(/^https?:\/\/([^\/:?#]+)/i); return m ? m[1].toLowerCase().replace(/^www\./, '') : ''; }

function fetchPage_(url) {
  try {
    var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true, validateHttpsCertificates: true,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RiverbendDemoStudio/1.0; +https://riverbendwebco.com)' } });
    if (r.getResponseCode() >= 400) return null;
    var ct = String((r.getHeaders() || {})['Content-Type'] || (r.getHeaders() || {})['content-type'] || '');
    if (ct && !/html|xml|text/i.test(ct)) return null;
    var html = r.getContentText().slice(0, 1500000);
    var t = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
    return { url: url, html: html, title: decode_(t).trim() };
  } catch (e) { return null; }
}

function navLinks_(html, base, host) {
  var want = /(menu|food|drink|about|contact|hours|location|visit|services|our-story|find-us|gallery|photos|pictures)/i;
  var seen = {}, out = [];
  var re = /<a\b[^>]*href\s*=\s*["']([^"'#]+)["'][^>]*>/gi, m;
  while ((m = re.exec(html)) && out.length < 12) {
    var abs = absUrl_(m[1], base);
    if (!abs || hostOf_(abs) !== host) continue;
    var path = abs.replace(/^https?:\/\/[^\/]+/i, '');
    if (!want.test(path) || /\.(pdf|jpe?g|png|gif|zip)$/i.test(path)) continue;
    var key = abs.replace(/\/$/, '');
    if (seen[key] || key === base.replace(/\/$/, '')) continue;
    seen[key] = 1; out.push(abs);
  }
  return out;
}
function absUrl_(h, base) {
  h = decode_(h).trim();
  if (/^(mailto|tel|javascript|data):/i.test(h)) return '';
  if (/^https?:\/\//i.test(h)) return h;
  var origin = (base.match(/^https?:\/\/[^\/]+/i) || [''])[0];
  if (h.indexOf('//') === 0) return 'https:' + h;
  if (h.charAt(0) === '/') return origin + h;
  return base.replace(/[^\/]*$/, '') + h;
}

function fromJsonLd_(html, out, types) {
  var re = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, m;
  while ((m = re.exec(html))) {
    var data; try { data = JSON.parse(m[1].trim()); } catch (e) { continue; }
    walkLd_(data, function (o) {
      var t = [].concat(o['@type'] || []).join(' ');
      var biz = /(LocalBusiness|Restaurant|BarOrPub|FoodEstablishment|CafeOrCoffeeShop|Bakery|Winery|Brewery|Store|Contractor|Service|Plumber|Electrician|Roofing|HVAC|Locksmith|AutoRepair|Organization)/i.test(t) || o.telephone || o.address;
      if (!biz || /WebSite|WebPage|BreadcrumbList|ImageObject/i.test(t)) return;
      types.push(t);
      if (!out.name && o.name) out.name = clip_(o.name, 80);
      if (!out.phone && o.telephone) out.phone = clip_(o.telephone, 30);
      if (!out.email && o.email) out.email = clip_(String(o.email).replace(/^mailto:/i, ''), 100);
      if (!out.about && o.description) out.about = clip_(o.description, 1200);
      if (!out.category && t) out.category = humanType_(t);
      var a = [].concat(o.address || [])[0];
      if (a && typeof a === 'object' && !out.address) {
        out.address = clip_(a.streetAddress || '', 120);
        out.city = clip_([a.addressLocality, a.addressRegion].filter(Boolean).join(', '), 60);
      } else if (typeof a === 'string' && !out.address) splitAddr_(a, out);
      [].concat(o.sameAs || []).forEach(function (u) { socialOf_(String(u), out); });
      ldHours_(o, out);
      ldMenu_(o.hasMenu, out);
    });
  }
}
function walkLd_(d, fn) {
  if (!d || typeof d !== 'object') return;
  if (Array.isArray(d)) { d.forEach(function (x) { walkLd_(x, fn); }); return; }
  fn(d);
  if (d['@graph']) walkLd_(d['@graph'], fn);
}
function ldHours_(o, out) {
  if (out.hours.some(String)) return;
  [].concat(o.openingHoursSpecification || []).forEach(function (s) {
    if (!s || !s.dayOfWeek) return;
    var range = s.opens && s.closes ? fmtTime_(s.opens) + ' - ' + fmtTime_(s.closes) : 'Closed';
    if (s.opens === '00:00' && s.closes === '00:00') range = 'Closed';
    [].concat(s.dayOfWeek).forEach(function (d) { var i = dayIx_(String(d).replace(/^.*\//, '')); if (i >= 0) out.hours[i] = range; });
  });
  [].concat(o.openingHours || []).forEach(function (s) { hoursFromText_(String(s).replace(/(\d\d:\d\d)-(\d\d:\d\d)/g, function (_, a, b) { return fmtTime_(a) + ' - ' + fmtTime_(b); }), out); });
}
function ldMenu_(m, out) {
  if (!m || typeof m !== 'object') return;
  [].concat(m).forEach(function (menu) {
    [].concat(menu.hasMenuSection || []).forEach(function (sec) {
      [].concat(sec.hasMenuItem || []).forEach(function (it) { pushItem_(out, sec.name, it.name, priceOf_(it.offers), it.description); });
    });
    [].concat(menu.hasMenuItem || []).forEach(function (it) { pushItem_(out, '', it.name, priceOf_(it.offers), it.description); });
  });
}
function priceOf_(o) { o = [].concat(o || [])[0]; if (!o || o.price == null) return ''; var p = String(o.price); return /^\d/.test(p) ? '$' + p.replace(/\.00$/, '') : p; }

function fromHtml_(pg, out) {
  var h = pg.html, meta = function (n) { var r = new RegExp('<meta[^>]+(?:property|name)\\s*=\\s*["\']' + n + '["\'][^>]*content\\s*=\\s*["\']([^"\']*)["\']', 'i'); var m = h.match(r) || h.match(new RegExp('<meta[^>]+content\\s*=\\s*["\']([^"\']*)["\'][^>]*(?:property|name)\\s*=\\s*["\']' + n + '["\']', 'i')); return m ? decode_(m[1]).trim() : ''; };
  if (!out.name) out.name = clip_(meta('og:site_name') || bizFromTitle_(pg.title), 80);
  var desc = meta('description') || meta('og:description');
  if (!out.about && desc.length > 40) out.about = clip_(desc, 1200);
  if (!out.tagline && desc) { var first = desc.split(/(?<=[.!])\s/)[0]; if (first.length <= 110) out.tagline = first; }
  var m, re = /href\s*=\s*["']([^"']+)["']/gi;
  while ((m = re.exec(h))) {
    var u = decode_(m[1]);
    if (!out.phone && /^tel:/i.test(u)) out.phone = clip_(u.replace(/^tel:/i, '').replace(/^\+?1(?=\d{10}$)/, ''), 30);
    else if (!out.email && /^mailto:/i.test(u)) out.email = clip_(u.replace(/^mailto:/i, '').split('?')[0], 100);
    else socialOf_(u, out);
  }
  var text = textOf_(h);
  if (!out.phone) { var ph = text.match(/\(?\b\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}\b/); if (ph) out.phone = ph[0]; }
  if (!out.email) { var em = text.match(/[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/); if (em && !/(example|sentry|wix|squarespace)\./i.test(em[0])) out.email = em[0]; }
  if (!out.address) {
    var ad = text.match(/\b\d{1,5}\s+(?:[NSEW]\.?\s+)?[A-Z0-9][\w.'\- ]{1,40}?\s(?:St|Street|Ave|Avenue|Rd|Road|Blvd|Boulevard|Dr|Drive|Ln|Lane|Way|Hwy|Highway|Ct|Court|Pl|Place|Pkwy|Parkway|Sq|Square)\b\.?(?:,?\s*(?:Suite|Ste|Unit|#)\s*[\w\-]+)?(?:,?\s*[A-Z][a-zA-Z .]+,\s*[A-Z]{2}(?:\s+\d{5})?)?/);
    if (ad) splitAddr_(ad[0], out);
  }
  if (!out.about) {
    var ps = h.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
    for (var i = 0; i < ps.length; i++) { var t = textOf_(ps[i]).replace(/\s+/g, ' ').trim(); if (t.length > 120 && !/cookie|javascript|copyright/i.test(t)) { out.about = clip_(t, 1200); break; } }
  }
}
function splitAddr_(a, out) {
  a = String(a).replace(/\s+/g, ' ').trim();
  var m = a.match(/^(.*?),\s*([A-Za-z .]+,\s*[A-Z]{2})(?:\s+\d{5})?$/);
  if (m) { out.address = clip_(m[1], 120); if (!out.city) out.city = clip_(m[2], 60); }
  else out.address = clip_(a, 120);
}
function socialOf_(u, out) {
  if (!out.social.facebook && /^https?:\/\/(www\.|m\.)?facebook\.com\/(?!sharer|share|dialog|plugins|tr\b)[^\s"'?#]+/i.test(u)) out.social.facebook = u.split('?')[0];
  if (!out.social.instagram && /^https?:\/\/(www\.)?instagram\.com\/(?!p\/|explore)[^\s"'?#]+/i.test(u)) out.social.instagram = u.split('?')[0];
}

function textOf_(html) {
  return decode_(String(html)
    .replace(/<(script|style|noscript|svg|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(h[1-4])[^>]*>/gi, '\n\u00A7H ')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/td|\/th|\/section|\/article|\/dd|\/dt|li|p|div|tr)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[ \t\u00A0]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{2,}/g, '\n').trim();
}
function decode_(s) {
  return String(s || '').replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(+n); }).replace(/&#x([0-9a-f]+);/gi, function (_, n) { return String.fromCharCode(parseInt(n, 16)); })
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;|&rsquo;/g, "'").replace(/&ndash;|&mdash;/g, '-');
}
function clip_(s, n) { return String(s == null ? '' : s).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n); }

function menuFromText_(html, out) {
  var lines = textOf_(html).split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
  var group = '', price = /(?:^|\s)\$\s?(\d{1,3}(?:\.\d{2})?)(?:\s*\/\s*\$?\d{1,3}(?:\.\d{2})?)?\s*$/;
  for (var i = 0; i < lines.length && out.items.length < 60; i++) {
    var l = lines[i];
    if (l.indexOf('\u00A7H ') === 0) { var g = l.slice(3).trim(); if (g.length <= 40 && !price.test(g)) group = g; continue; }
    var m = l.match(price);
    if (!m) continue;
    var name = l.slice(0, m.index).replace(/[\s.\u2026\-|:]+$/, '').trim(), desc = '';
    if (!name || /^\$/.test(name)) { var prev = (lines[i - 1] || '').replace(/^\u00A7H /, ''); if (prev && prev.length <= 80 && !price.test(prev)) name = prev; }
    if (!name || name.length > 80 || /total|subtotal|tax|shipping|cart|gift card/i.test(name)) continue;
    var next = lines[i + 1] || '';
    if (next && next.indexOf('\u00A7H ') !== 0 && !price.test(next) && next.length > 15 && next.length <= 240) desc = next;
    pushItem_(out, group, name, '$' + m[1].replace(/\.00$/, ''), desc);
  }
}
function pushItem_(out, group, name, price, desc) {
  name = clip_(name, 80); if (!name) return;
  if (out.items.some(function (x) { return x.name.toLowerCase() === name.toLowerCase(); })) return;
  out.items.push({ group: clip_(group, 40), name: name, price: clip_(price, 20), desc: clip_(desc, 240) });
}

function hoursFromText_(text, out) {
  var D = '(mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:r|rs|rsday|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)';
  var T = '(\\d{1,2}(?::\\d{2})?\\s*(?:a\\.?m\\.?|p\\.?m\\.?)?|noon|midnight)';
  var re = new RegExp(D + '(?:\\s*(?:-|\u2013|\u2014|&|and|to|thru|through)\\s*' + D + ')?\\s*(?:[:.,]|from)?\\s*(?:' + T + '\\s*(?:-|\u2013|\u2014|to|until|till)\\s*' + T + '|(closed))', 'gi');
  var m, hit = false;
  while ((m = re.exec(text))) {
    var a = dayIx_(m[1]), b = m[2] ? dayIx_(m[2]) : a;
    if (a < 0 || b < 0) continue;
    var val = m[5] ? 'Closed' : cleanTime_(m[3]) + ' - ' + cleanTime_(m[4]);
    for (var i = a, n = 0; n < 7; i = (i + 1) % 7, n++) { if (!out.hours[i]) out.hours[i] = val; if (i === b) break; }
    hit = true;
  }
  return hit;
}
function dayIx_(d) { return DAY_KEYS.indexOf(String(d || '').toLowerCase().slice(0, 2)); }
function cleanTime_(t) { t = String(t).toLowerCase().replace(/\./g, '').replace(/\s+/g, ''); return t.replace(/:00(?=[ap]m|$)/, ''); }
function fmtTime_(hhmm) {
  var m = String(hhmm).match(/^(\d{1,2}):(\d{2})/); if (!m) return String(hhmm);
  var h = +m[1], mm = m[2], ap = h >= 12 && h < 24 ? 'pm' : 'am'; h = h % 12 || 12;
  return h + (mm === '00' ? '' : ':' + mm) + ap;
}
function humanType_(t) {
  var x = String(t).split(/\s+/).filter(function (w) { return !/^(LocalBusiness|Organization|Thing|Place)$/.test(w); })[0] || '';
  var named = { BarOrPub: 'Bar & Grill', CafeOrCoffeeShop: 'Coffee Shop', FoodEstablishment: 'Restaurant', HomeAndConstructionBusiness: 'Home Services', AutoRepair: 'Auto Repair', HVACBusiness: 'Heating & Cooling', RoofingContractor: 'Roofing' };
  return named[x] || x.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}
function styleFromTypes_(types) {
  var t = types.join(' ');
  if (/(Contractor|Plumber|Electrician|Roofing|HVAC|Locksmith|AutoRepair|HomeAndConstruction|MovingCompany|HousePainter|GeneralContractor)/.test(t)) return 'trade';
  if (/(BarOrPub|Brewery|SportsActivityLocation)/.test(t)) return 'pub';
  if (/(Winery|NightClub)/.test(t)) return 'lounge';
  return '';
}
function fmtPhone_(p) {
  var d = String(p || '').replace(/\D/g, '');
  if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
  return d.length === 10 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6) : String(p || '');
}
function guessStyle_(s) {
  s = String(s).toLowerCase();
  if (/(roof|plumb|hvac|heating|cooling|electric|contract|construct|landscap|lawn|repair|auto|mechanic|clean|paint|remodel|concrete|garage door|pest|tree service|towing|handyman|install)/.test(s)) return 'trade';
  if (/(lounge|cocktail|supper|bistro|fine dining|wine bar|steakhouse|tasting|speakeasy|chophouse)/.test(s)) return 'lounge';
  return 'pub';
}

/* Run once from the editor after updating, to allow website reading. */
function authorizeWebsiteReader() {
  var r = UrlFetchApp.fetch('https://riverbendwebco.com/', { muteHttpExceptions: true });
  Logger.log('Website reader ready (' + r.getResponseCode() + ')');
}

/* ---------- Menus posted as pictures or PDFs ---------- */

function menuMedia_(html, base, list) {
  // Any URL in the page source (tags, meta tags, scripts, JSON) that looks like a menu file.
  var any = /(?:https?:)?[^\s"'()<>,;]*menu[^\s"'()<>,;]*\.(?:png|jpe?g|webp|pdf)(?:\?[^\s"'()<>]*)?/gi, mm;
  while ((mm = any.exec(html)) && list.length < 8) {
    var raw = mm[0].replace(/\\\//g, '/').replace(/^[^h\/]*(?=https?:|\/)/i, '');
    var u0 = absUrl_(raw, base);
    if (!u0 || /lazy-load-placeholder|logo|thumb|-\d+x\d+\./i.test(u0)) continue;
    var key = u0.replace(/\?.*$/, '');
    if (!list.some(function (x) { return x.replace(/\?.*$/, '') === key; })) list.push(u0);
  }
  var re = /<(a|img)\b[^>]*>/gi, m;
  while ((m = re.exec(html)) && list.length < 8) {
    var tag = m[0];
    var src = (tag.match(/\b(?:href|data-src|data-lazy-src|src)\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
    var hrefs = [];
    ['href', 'data-src', 'data-lazy-src', 'src', 'data-full'].forEach(function (a) { var x = tag.match(new RegExp('\\b' + a + '\\s*=\\s*["\']([^"\']+)["\']', 'i')); if (x) hrefs.push(x[1]); });
    var alt = (tag.match(/\balt\s*=\s*["']([^"']*)["']/i) || [])[1] || '';
    hrefs.forEach(function (h) {
      var u = absUrl_(h, base);
      if (!u || !/\.(png|jpe?g|webp|pdf)(\?|$)/i.test(u)) return;
      if (!/menu/i.test(u) && !/menu/i.test(alt)) return;
      if (/lazy-load-placeholder|logo/i.test(u)) return;
      if (list.indexOf(u) < 0) list.push(u);
    });
  }
}

/* Uses Google Drive's built-in text recognition (OCR): uploads the file as a
   temporary Google Doc, reads the text, then deletes it. */
function ocr_(url) {
  var id = '';
  try {
    var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true });
    if (r.getResponseCode() >= 400) return '';
    var blob = r.getBlob();
    var type = String(blob.getContentType() || '').toLowerCase();
    if (!/^(image\/(png|jpe?g|webp)|application\/pdf)/.test(type)) {
      type = /\.pdf(\?|$)/i.test(url) ? 'application/pdf' : /\.png(\?|$)/i.test(url) ? 'image/png' : 'image/jpeg';
    }
    var bytes = blob.getBytes();
    if (!bytes.length || bytes.length > 10 * 1024 * 1024) return '';
    var token = ScriptApp.getOAuthToken();
    var boundary = 'rb' + Utilities.getUuid().replace(/-/g, '');
    var meta = JSON.stringify({ name: 'riverbend-ocr-temp', mimeType: 'application/vnd.google-apps.document' });
    var head = '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + meta + '\r\n--' + boundary + '\r\nContent-Type: ' + type + '\r\n\r\n';
    var tail = '\r\n--' + boundary + '--';
    var payload = Utilities.newBlob(head).getBytes().concat(bytes).concat(Utilities.newBlob(tail).getBytes());
    var up = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&ocrLanguage=en&fields=id', {
      method: 'post', contentType: 'multipart/related; boundary=' + boundary, payload: payload,
      headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
    if (up.getResponseCode() >= 300) { console.error('OCR upload failed: ' + up.getContentText().slice(0, 300)); return ''; }
    id = JSON.parse(up.getContentText()).id;
    var ex = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + id + '/export?mimeType=text/plain', {
      headers: { Authorization: 'Bearer ' + token }, muteHttpExceptions: true });
    return ex.getResponseCode() < 300 ? ex.getContentText() : '';
  } catch (e) {
    console.error(e);
    return '';
  } finally {
    if (id) { try { UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + id, { method: 'delete', headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true }); } catch (e2) {} }
  }
}

/* Turns recognized menu text into items. Handles prices on the same line,
   prices on the next line, and columns where names and prices come out as
   separate lists. */
function menuFromLines_(rawLines, out) {
  var P = /\$\s?\d{1,3}(?:[.,]\d{2})?/;
  var PONLY = /^\s*\$?\s?\d{1,3}[.,]\d{2}\s*$|^\s*\$\s?\d{1,3}\s*$/;
  var lines = rawLines.map(function (l) { return clip_(l.replace(/[\u2022\u00B7|]+/g, ' '), 200); }).filter(function (l) { return l && l.length > 1; });
  var group = '', pendingNames = [], pendingDesc = {};
  // Lines that are the business name, its address or fine print (common on menu pictures), never menu items
  var bizWords = String(out.name || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function (w) { return w.length > 2; });
  var isNoise = function (l) {
    var t = l.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t) return true;
    if (/^\d{1,5} [a-z0-9 ]*\b(st|street|ave|avenue|rd|road|blvd|dr|drive|hwy|highway|ln|lane|way|ct|court|pl|place)\b/.test(t)) return true;
    if (/\b(ia|iowa|il|wi)\b \d{5}\b/.test(t) || /\b(www|http|consuming raw|foodborne|gratuity|prices subject)\b/.test(t)) return true;
    if (bizWords.length && t.split(' ').every(function (w) { return bizWords.indexOf(w) >= 0; })) return true;
    return false;
  };
  var isHeading = function (l) { return l.length >= 3 && l.length <= 32 && !P.test(l) && /[A-Z]/.test(l) && l === l.toUpperCase() && !/^\d/.test(l) && !isNoise(l); };
  var looksName = function (l) { return l.length >= 3 && l.length <= 48 && !P.test(l) && /^[A-Z0-9'"(]/.test(l) && l.split(' ').length <= 7 && !/[.!?]$/.test(l) && !/^(served|choose|our|your|enjoy|add|homemade|other|with|on|and|topped|includes|comes)\b/i.test(l); };
  var fmt = function (p) { p = p.replace(/\s/g, '').replace(',', '.'); if (p.charAt(0) !== '$') p = '$' + p; return p.replace(/\.00$/, ''); };
  var flush = function () { pendingNames = []; };
  var last = null;
  var push = function (g, n, pr, d) {
    n = n.replace(/\s*\*+\s*$/, '').trim();
    if (n.split(' ').length > 5 && /[.!]$/.test(n)) { d = (n + ' ' + (d || '')).trim(); n = g || n; }
    var before = out.items.length;
    pushItem_(out, g, n, pr, d);
    if (out.items.length > before) last = out.items[out.items.length - 1];
  };
  for (var i = 0; i < lines.length && out.items.length < 60; i++) {
    var l = lines[i];
    if (/[a-z]{2}/i.test(l) && isNoise(l.replace(P, ''))) continue;
    if (isHeading(l)) { group = l.replace(/[*\s]+$/, '').toLowerCase().replace(/(^|[\s(\-\/])(\w)/g, function (_, a, c) { return a + c.toUpperCase(); }); flush(); continue; }
    if (PONLY.test(l)) {
      if (pendingNames.length) { var nm = pendingNames.shift(); push(nm.g, nm.n, fmt(l), nm.d || ''); }
      continue;
    }
    var m = l.match(P);
    if (m) {
      var name = l.slice(0, m.index).replace(/[\s.\u2026\-:]+$/, '').trim();
      var after = l.slice(m.index + m[0].length).trim();
      if (!name && pendingNames.length) { var pn = pendingNames.shift(); push(pn.g, pn.n, fmt(m[0]), pn.d || ''); continue; }
      if (!name || name.length > 60) continue;
      var desc = '';
      var nx = lines[i + 1] || '';
      if (nx && !P.test(nx) && !isHeading(nx) && (nx.length > 24 || /^[a-z(]/.test(nx) || /,/.test(nx))) { desc = nx; i++; }
      if (after && after.length > 10) desc = (after + ' ' + desc).trim();
      push(group, name, fmt(m[0]), desc);
      flush();
      continue;
    }
    var descLike = l.length > 24 || /^[a-z(]/.test(l) || /,/.test(l);
    if (looksName(l) && !(descLike && last && !last.desc && !pendingNames.length)) { pendingNames.push({ g: group, n: l, d: '' }); continue; }
    if (pendingNames.length && l.length > 10) pendingNames[pendingNames.length - 1].d = clip_((pendingNames[pendingNames.length - 1].d + ' ' + l).trim(), 240);
    else if (last && !last.desc && l.length > 10) last.desc = clip_(l, 240);
  }
}

function bizFromTitle_(t) {
  var parts = String(t || '').split(/\s[|\u2013\u2014\-:]\s/).map(function (x) { return x.trim(); }).filter(Boolean);
  var generic = /^(home|homepage|welcome|food|menu|menus|our menu|drinks|bar|about|about us|contact|contact us|events|hours|gallery|testimonials|services|location|locations|order online)$/i;
  var good = parts.filter(function (x) { return !generic.test(x); });
  return (good[0] || parts[0] || '');
}

/* Text that a site injects with JavaScript (HTML inside script strings),
   e.g. hours added by jQuery after the page loads. */
function embeddedText_(html) {
  var out = [], sre = /<script\b[^>]*>([\s\S]*?)<\/script>/gi, m;
  while ((m = sre.exec(html))) {
    var js = m[1];
    if (!/(mon|tues|wednes|thurs|fri|satur|sun)day/i.test(js) || js.indexOf('<') < 0) continue;
    var str = /(["'])((?:\\.|(?!\1).){10,4000}?)\1/g, q;
    while ((q = str.exec(js))) {
      var v = q[2];
      if (/</.test(v) && /(mon|tues|wednes|thurs|fri|satur|sun)day/i.test(v)) out.push(textOf_(v.replace(/\\(["'\/])/g, '$1')));
    }
  }
  return out.join('\n');
}

/* ---------- Photos from their website ---------- */

function sitePhotos_(html, base, list, skip) {
  var re = /[^\s"'()<>,;]+\.(?:png|jpe?g|webp)(?:\?[^\s"'()<>]*)?/gi, m;
  var bad = /(logo|icon|favicon|sprite|placeholder|lazy|badge|avatar|emoji|spinner|loader|pixel|blank|spacer|arrow|button|menu|social|facebook|instagram|twitter|google|yelp|tripadvisor|payment|visa|mastercard|cms_websites\/img|wp-includes|\/plugins\/)/i;
  while ((m = re.exec(html)) && list.length < 40) {
    var raw = m[0].replace(/\\\//g, '/').replace(/&amp;/g, '&').replace(/^[^h\/]*(?=https?:|\/)/i, '');
    var u = absUrl_(raw, base);
    if (!u || bad.test(u.replace(/\?.*$/, ''))) continue;
    if (/[-_](\d{2,3})x(\d{2,3})\.(png|jpe?g|webp)$/i.test(u)) continue; // tiny WordPress thumbnails
    var path = u.replace(/\?.*$/, '');
    if ((skip || []).some(function (x) { return x.replace(/\?.*$/, '') === path; })) continue;
    var hit = null;
    for (var i = 0; i < list.length; i++) if (list[i].url === path) { hit = list[i]; break; }
    var isThumb = /[?&](w|width|h|height)=\d{2,3}\b/i.test(u);
    if (hit) { if (isThumb && hit.thumb === hit.url) hit.thumb = u; continue; }
    list.push({ url: path, thumb: isThumb ? u : path });
  }
}

function grabImage_(raw) {
  var url = normUrl_(raw);
  if (!url) return { ok: false, error: 'badurl' };
  try {
    var r = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RiverbendDemoStudio/1.0; +https://riverbendwebco.com)' } });
    if (r.getResponseCode() >= 400) return { ok: false, error: 'unreachable' };
    var blob = r.getBlob();
    var type = String(blob.getContentType() || '').toLowerCase().split(';')[0];
    if (!/^image\/(png|jpeg|webp)$/.test(type)) {
      if (/\.png(\?|$)/i.test(url)) type = 'image/png';
      else if (/\.webp(\?|$)/i.test(url)) type = 'image/webp';
      else if (/\.jpe?g(\?|$)/i.test(url)) type = 'image/jpeg';
      else return { ok: false, error: 'notimage' };
    }
    var bytes = blob.getBytes();
    if (!bytes.length || bytes.length > 12 * 1024 * 1024) return { ok: false, error: 'toobig' };
    return { ok: true, type: type, data: Utilities.base64Encode(bytes) };
  } catch (e) { return { ok: false, error: 'unreachable' }; }
}

/* ===================== riverbendwebcoleads =====================
   Chat portal at /leads. Finds local businesses on Google (Places API, New),
   flags the ones with no website, only a social page, or a weak site, saves
   them to the "Prospects" tab of the Riverbend Leads sheet, and builds a
   Studio demo from any lead. The Google key lives in Script Properties
   (PLACES_KEY) and is never sent back to the browser. */
var LEADS_CENTER = { latitude: 42.5006, longitude: -90.6646 };
var LEADS_DAILY_CAP = 300;
var LEADS_STAGES = ['New', 'Contacted', 'Demo built', 'Pitched', 'Won', 'Lost'];
var LEADS_FIELDS = 'places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.primaryType,places.primaryTypeDisplayName,places.googleMapsUri,places.businessStatus,places.regularOpeningHours,places.location,nextPageToken';
var LEADS_SOCIAL = /(^|\.)(facebook\.com|fb\.com|fb\.me|instagram\.com|linktr\.ee|yelp\.com|tiktok\.com|x\.com|twitter\.com|google\.com|goo\.gl|g\.page|business\.site|doordash\.com|grubhub\.com|ubereats\.com|toasttab\.com|order\.online|menufy\.com|slicelife\.com|beyondmenu\.com|allmenus\.com|tripadvisor\.com|nextdoor\.com|angi\.com|homeadvisor\.com|thumbtack\.com|bbb\.org|houzz\.com|booksy\.com|vagaro\.com|styleseat\.com)$/i;
var LEADS_FREE = /(^|\.)(wixsite\.com|godaddysites\.com|weebly\.com|weeblysite\.com|carrd\.co|square\.site|mystrikingly\.com|webflow\.io|wordpress\.com|blogspot\.com|site123\.me|jimdosite\.com)$/i;
var LEADS_HEADERS = ['Saved', 'Place ID', 'Business', 'Type', 'Phone', 'Address', 'Website', 'Lead', 'Rating', 'Reviews', 'Stage', 'Notes', 'Demo', 'Google Maps'];

function leadsKey_() { return PropertiesService.getScriptProperties().getProperty('PLACES_KEY') || ''; }
function leadsDay_() { return 'leadsCalls_' + Utilities.formatDate(new Date(), 'America/Chicago', 'yyyyMMdd'); }
function leadsUsed_() { return Number(PropertiesService.getScriptProperties().getProperty(leadsDay_()) || 0); }
function leadsBump_() { var p = PropertiesService.getScriptProperties(); p.setProperty(leadsDay_(), String(leadsUsed_() + 1)); }

function leadsStatus_() {
  return { ok: true, hasKey: !!leadsKey_(), free: !leadsKey_(), usedToday: leadsUsed_(), cap: LEADS_DAILY_CAP, stages: LEADS_STAGES };
}

function leadsSetKey_(key) {
  key = key.trim();
  if (!/^AIza[0-9A-Za-z_\-]{30,45}$/.test(key)) return { ok: false, error: 'badkey', message: 'That does not look like a Google API key. It starts with AIza.' };
  var r = leadsCall_(key, { textQuery: 'coffee in Dubuque, IA', pageSize: 1 }, 'places.id');
  if (!r.ok) return r;
  PropertiesService.getScriptProperties().setProperty('PLACES_KEY', key);
  return { ok: true };
}

function leadsCall_(key, body, mask) {
  if (leadsUsed_() >= LEADS_DAILY_CAP) return { ok: false, error: 'cap', message: 'Daily search limit reached (' + LEADS_DAILY_CAP + '). It resets at midnight.' };
  var res;
  try {
    res = UrlFetchApp.fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'post', contentType: 'application/json', muteHttpExceptions: true,
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': mask || LEADS_FIELDS },
      payload: JSON.stringify(body)
    });
  } catch (e) { return { ok: false, error: 'google', message: 'Could not reach Google. Try again in a minute.' }; }
  leadsBump_();
  var j = {};
  try { j = JSON.parse(res.getContentText() || '{}'); } catch (e) {}
  if (res.getResponseCode() >= 400) {
    var m = (j.error && j.error.message) || ('Google returned ' + res.getResponseCode());
    if (/billing/i.test(m)) m = 'Google says billing is not turned on for this key yet. Add a card in Google Cloud > Billing, then try again.';
    else if (/not been used|disabled|not enabled/i.test(m)) m = 'The Places API (New) is not turned on for this key yet. Enable it in Google Cloud, wait a minute, then try again.';
    else if (/API key not valid|invalid/i.test(m)) m = 'Google says that key is not valid. Copy it again from Google Cloud > Credentials.';
    return { ok: false, error: 'google', message: m };
  }
  return { ok: true, data: j };
}

function leadsFind_(d) {
  var key = leadsKey_();
  if (!key) return leadsFindFree_(d);
  var q = clip_(d.q, 80), city = clip_(d.city || 'Dubuque, IA', 40);
  if (!q) return { ok: false, error: 'empty' };
  var text = q + ' in ' + city;
  var near = /dubuque/i.test(city) || !d.city;
  var cacheKey = 'lq_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, text.toLowerCase())).slice(0, 22);
  var cache = CacheService.getScriptCache();
  var places = null, hit = cache.get(cacheKey);
  if (hit) { try { places = JSON.parse(hit); } catch (e) {} }
  if (!places) {
    places = [];
    var token = '', pages = 0;
    do {
      var body = { textQuery: text, pageSize: 20 };
      if (near) body.locationBias = { circle: { center: LEADS_CENTER, radius: 25000 } };
      if (token) body.pageToken = token;
      var r = leadsCall_(key, body);
      if (!r.ok) { if (places.length) break; return r; }
      places = places.concat(r.data.places || []);
      token = r.data.nextPageToken || '';
      pages++;
      if (token) Utilities.sleep(300);
    } while (token && pages < 3);
    var json = JSON.stringify(places);
    if (json.length < 95000) cache.put(cacheKey, json, 6 * 60 * 60);
  }

  var leads = places.filter(function (p) { return !p.businessStatus || p.businessStatus === 'OPERATIONAL'; }).map(leadFromPlace_);
  if (near) leads = leads.filter(function (l) { return l.km < 0 || l.km <= 32; });
  leadsCheckSites_(leads, d.check !== false);
  var saved = {};
  leadsSaved_().forEach(function (s) { saved[s.id] = s.stage || 'New'; });
  leads.forEach(function (l) { if (saved[l.id]) l.saved = saved[l.id]; });
  var rank = { none: 0, social: 1, weak: 2, chain: 4, site: 3 };
  leads.sort(function (a, b) { return (rank[a.kind] - rank[b.kind]) || (b.reviews - a.reviews); });
  var counts = { total: leads.length, none: 0, social: 0, weak: 0, site: 0, chain: 0 };
  leads.forEach(function (l) { counts[l.kind]++; });
  return { ok: true, query: text, leads: leads, counts: counts, usedToday: leadsUsed_(), cap: LEADS_DAILY_CAP };
}

function leadFromPlace_(p) {
  var full = String(p.formattedAddress || '');
  var parts = full.split(',').map(function (x) { return x.trim(); });
  var city = parts.length >= 3 ? parts[parts.length - 3] + ', ' + String(parts[parts.length - 2]).split(' ')[0] : '';
  var hours = ((p.regularOpeningHours || {}).weekdayDescriptions || []).map(function (w) {
    return String(w).replace(/^[A-Za-z]+:\s*/, '').replace(/[\u2013\u2014]/g, '-').replace(/[\u2009\u202f\u00a0]/g, ' ').replace(/\s+/g, ' ').trim();
  });
  return {
    id: String(p.id || ''), name: clip_((p.displayName || {}).text, 120), type: clip_((p.primaryTypeDisplayName || {}).text, 60),
    ptype: String(p.primaryType || ''), phone: clip_(p.nationalPhoneNumber, 30), website: clip_(p.websiteUri, 300),
    address: parts[0] || '', city: city, full: full, rating: Number(p.rating || 0), reviews: Number(p.userRatingCount || 0),
    maps: clip_(p.googleMapsUri, 300), hours: hours.length === 7 ? hours : [], kind: 'site', issues: [],
    km: p.location ? leadsKm_(p.location.latitude, p.location.longitude) : -1
  };
}
function leadsKm_(lat, lng) {
  var R = 6371, t = Math.PI / 180, a = LEADS_CENTER.latitude * t, b = Number(lat) * t;
  var x = Math.sin((b - a) / 2), y = Math.sin((Number(lng) - LEADS_CENTER.longitude) * t / 2);
  return Math.round(2 * R * Math.asin(Math.sqrt(x * x + Math.cos(a) * Math.cos(b) * y * y)));
}

function leadsSiteKey_(u) { return 'sc1_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, String(u))).slice(0, 22); }

function leadsCheckSites_(leads, deep) {
  var year = new Date().getFullYear();
  var cache = CacheService.getScriptCache();
  var toCheck = [];
  leads.forEach(function (l) {
    var host = hostOf_(l.website);
    if (!l.website) { l.kind = 'none'; l.issues.push(l.source === 'free' ? (l.unverified ? 'No website listed on the map (search check was busy, double check)' : 'No website found on the map or in a web search') : 'No website on Google'); return; }
    if (LEADS_SOCIAL.test(host)) { l.kind = 'social'; l.issues.push('Only a ' + leadsSiteName_(host) + ' page, no real website'); return; }
    if (/\/(locations?|stores?|restaurants?)\//i.test(l.website) || /\/location\b/i.test(l.website)) { l.kind = 'chain'; l.issues.push('Chain or franchise location'); return; }
    if (LEADS_FREE.test(host)) { l.kind = 'weak'; l.issues.push('Free builder site (' + host + ')'); }
    if (/^http:\/\//i.test(l.website)) l.httpOnly = true;
    var hit = cache.get(leadsSiteKey_(l.website));
    if (hit) { try { var o = JSON.parse(hit); l.website = o.w || l.website; if (o.b) l.blocked = true; (o.i || []).forEach(function (x) { l.issues.push(x); }); return; } catch (e) {} }
    toCheck.push(l);
  });
  if (!deep) { toCheck.forEach(function (l) { l.pending = true; }); }
  else if (toCheck.length) {
    var batch = toCheck.slice(0, 30);
    var orig = batch.map(function (l) { return l.website; });
    var reqs = batch.map(function (l) {
      return { url: l.httpOnly ? l.website.replace(/^http:/i, 'https:') : l.website, muteHttpExceptions: true, followRedirects: true, validateHttpsCertificates: true,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RiverbendLeads/1.0; +https://riverbendwebco.com)' } };
    });
    var res = [];
    try { res = UrlFetchApp.fetchAll(reqs); } catch (e) { res = leadsFetchEach_(reqs); }
    batch.forEach(function (l, i) {
      var pre = l.issues.length;
      leadsSiteOne_(l, res[i], year);
      if (res[i]) cache.put(leadsSiteKey_(orig[i]), JSON.stringify({ w: l.website, i: l.issues.slice(pre), b: !!l.blocked }), 24 * 60 * 60);
    });
  }
  leads.forEach(function (l) { if (l.kind === 'site' && l.issues.length) l.kind = 'weak'; });
}

function leadsSiteOne_(l, r, year) {
  if (!r) { if (l.httpOnly) l.issues.push('No secure https version'); return; }
  var code = r.getResponseCode();
  if (code === 401 || code === 403 || code === 429 || code === 503) { l.blocked = true; return; }
  if (code >= 400) {
    var home = (l.website.match(/^https?:\/\/[^\/]+/i) || [''])[0] + '/';
    var hr = null; if (home !== l.website) { try { hr = UrlFetchApp.fetch(home, { muteHttpExceptions: true, followRedirects: true }); } catch (x) {} }
    if (hr && hr.getResponseCode() < 400) { l.website = home; return; }
    if (hr && [401, 403, 429, 503].indexOf(hr.getResponseCode()) >= 0) { l.blocked = true; return; }
    l.issues.push('Website is down or broken (error ' + code + ')'); return;
  }
  if (l.httpOnly) l.website = l.website.replace(/^http:/i, 'https:');
  var html = '';
  try { html = r.getContentText().slice(0, 400000); } catch (e) { return; }
  if (!/<meta[^>]+name=["']?viewport/i.test(html)) l.issues.push('Not built for phones');
  var ys = [], m, re = /(?:&copy;|©|copyright)\s*(?:&nbsp;|\s)*(?:(?:19|20)\d{2}\s*(?:-|&ndash;|–)\s*)?((?:19|20)\d{2})/gi;
  while ((m = re.exec(html))) ys.push(Number(m[1]));
  if (ys.length) { var y = Math.max.apply(null, ys); if (y <= year - 3) l.issues.push('Not updated since ' + y); }
  if (/wix\.com|wixstatic|godaddy|websitebuilder|weebly|squarespace-cdn|jimdo|site123/i.test(html) && l.kind !== 'weak') l.builder = true;
  if (html.length < 3000 && !/<script/i.test(html)) l.issues.push('Almost empty page');
}

function leadsSiteName_(host) {
  var m = { 'facebook.com': 'Facebook', 'fb.com': 'Facebook', 'fb.me': 'Facebook', 'instagram.com': 'Instagram', 'linktr.ee': 'Linktree', 'yelp.com': 'Yelp',
    'business.site': 'old Google', 'google.com': 'Google', 'g.page': 'Google', 'toasttab.com': 'online ordering', 'order.online': 'online ordering', 'doordash.com': 'DoorDash',
    'grubhub.com': 'Grubhub', 'ubereats.com': 'Uber Eats', 'menufy.com': 'online ordering', 'slicelife.com': 'online ordering' };
  var k = Object.keys(m).filter(function (x) { return host === x || host.slice(-x.length - 1) === '.' + x; })[0];
  return k ? m[k] : host;
}

function leadsSheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName('Prospects');
  if (!sh) {
    sh = ss.insertSheet('Prospects');
    sh.appendRow(LEADS_HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, LEADS_HEADERS.length).setFontWeight('bold');
  }
  return sh;
}

function leadsSaved_() {
  var sh = leadsSheet_();
  var n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, LEADS_HEADERS.length).getValues().map(function (r) {
    return { saved: r[0] ? Utilities.formatDate(new Date(r[0]), 'America/Chicago', 'MMM d') : '', id: String(r[1]), name: String(r[2]), type: String(r[3]),
      phone: String(r[4]), address: String(r[5]), website: String(r[6]), lead: String(r[7]), rating: Number(r[8] || 0), reviews: Number(r[9] || 0),
      stage: String(r[10] || 'New'), notes: String(r[11] || ''), demo: String(r[12] || ''), maps: String(r[13] || '') };
  }).filter(function (x) { return x.id; }).reverse();
}

function leadsRow_(sh, id) {
  var n = sh.getLastRow();
  if (n < 2 || !id) return 0;
  var ids = sh.getRange(2, 2, n - 1, 1).getValues();
  for (var i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return i + 2;
  return 0;
}

function leadsSave_(l) {
  var id = clip_(l.id, 200);
  if (!id || !clip_(l.name, 120)) return { ok: false, error: 'bad' };
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var sh = leadsSheet_();
    if (leadsRow_(sh, id)) return { ok: true, already: true };
    var safe = function (s) { s = String(s || ''); return /^[=+\-@]/.test(s) ? "'" + s : s; };
    var address = [clip_(l.address, 160), clip_(l.city, 60)].filter(String).join(', ');
    sh.appendRow([new Date(), id, safe(clip_(l.name, 120)), safe(clip_(l.type, 60)), safe(clip_(l.phone, 30)), safe(address),
      safe(clip_(l.website, 300)), safe(clip_((l.issues || []).join('; '), 300)), Number(l.rating || 0), Number(l.reviews || 0), 'New', safe(clip_(l.note || '', 200)), '', safe(clip_(l.maps, 300))]);
    return { ok: true };
  } finally { lock.releaseLock(); }
}

function leadsUpdate_(id, d) {
  var sh = leadsSheet_();
  var row = leadsRow_(sh, id);
  if (!row) return { ok: false, error: 'notfound' };
  if (d.stage !== undefined) { if (LEADS_STAGES.indexOf(String(d.stage)) < 0) return { ok: false, error: 'stage' }; sh.getRange(row, 11).setValue(String(d.stage)); }
  if (d.notes !== undefined) { var n = clip_(d.notes, 500); sh.getRange(row, 12).setValue(/^[=+\-@]/.test(n) ? "'" + n : n); }
  if (d.remove) sh.deleteRow(row);
  return { ok: true };
}

function leadsDemo_(l) {
  var name = clip_(l.name, 120);
  if (!name) return { ok: false, error: 'bad' };
  var host = hostOf_(l.website || '');
  var demo = { name: name, category: clip_(l.type, 60), address: clip_(l.address, 160), city: clip_(l.city, 60) || 'Dubuque, IA',
    phone: fmtPhone_(l.phone), hours: (l.hours || []).slice(0, 7), items: [], specials: [], photos: [], social: { facebook: '', instagram: '' },
    website: l.website || '', style: '', private: { status: 'Draft', contact: '', contactPhone: '', notes: 'Found with riverbendwebcoleads. ' + (l.issues || []).join('; ') + (l.maps ? ' Google: ' + l.maps : '') } };
  if (/facebook\.com|fb\.com/i.test(host)) demo.social.facebook = l.website;
  if (/instagram\.com/i.test(host)) demo.social.instagram = l.website;
  var scanned = false;
  if (l.website && !LEADS_SOCIAL.test(host)) {
    var s = scanSite_(l.website);
    if (s.ok) {
      var f = s.found; scanned = true;
      ['tagline', 'about', 'email'].forEach(function (k) { if (f[k]) demo[k] = f[k]; });
      if (f.items && f.items.length) demo.items = f.items;
      if (f.hours && f.hours.some(String) && !demo.hours.some(String)) demo.hours = f.hours;
      if (f.photos && f.photos.length) demo.photos = f.photos.slice(0, 12);
      if (f.social) { if (f.social.facebook) demo.social.facebook = f.social.facebook; if (f.social.instagram) demo.social.instagram = f.social.instagram; }
      if (f.style) demo.style = f.style;
    }
  }
  if (!demo.style) {
    var t = (name + ' ' + (l.type || '') + ' ' + (l.ptype || '')).toLowerCase();
    demo.style = /(bbq|barbecue|barbeque|saloon|smokehouse|steak|country|western|honky)/.test(t) ? 'western' : guessStyle_(t);
  }
  var r = saveDemo_({ demo: demo });
  if (!r.ok) return r;
  var sh = leadsSheet_(), row = leadsRow_(sh, clip_(l.id, 200));
  if (!row) { leadsSave_(l); row = leadsRow_(sh, clip_(l.id, 200)); }
  if (row) { sh.getRange(row, 13).setValue(r.slug); if (String(sh.getRange(row, 11).getValue() || 'New') === 'New') sh.getRange(row, 11).setValue('Demo built'); }
  return { ok: true, slug: r.slug, scanned: scanned, items: demo.items.length, photos: demo.photos.length };
}


/* ---------- Free lead source (no key, no card) ----------
   Business list: OpenStreetMap through public Overpass servers (cached 24 h).
   Website check: OSM website tag, then a free DuckDuckGo search for the
   business name. A lead is only called "no website" when neither finds one. */
var OSM_BBOX = '42.43,-90.82,42.60,-90.58';
var OSM_WIDE = '42.06,-91.26,42.94,-90.06'; /* about 30 miles around Dubuque */
var OSM_TOWNS = { 'east dubuque': '42.47,-90.66,42.51,-90.61', 'galena': '42.39,-90.46,42.44,-90.40', 'asbury': '42.50,-90.79,42.53,-90.73',
  'peosta': '42.43,-90.87,42.47,-90.82', 'dyersville': '42.46,-91.15,42.50,-91.10', 'epworth': '42.43,-90.95,42.46,-90.91', 'cascade': '42.28,-91.03,42.31,-90.99',
  'platteville': '42.71,-90.51,42.76,-90.44', 'bellevue': '42.24,-90.44,42.28,-90.40', 'farley': '42.43,-91.02,42.45,-90.99', 'maquoketa': '42.05,-90.69,42.09,-90.64' };
var OSM_CATS = [
  [/bar|pub|tavern|tap|saloon|lounge/, 'nwr["amenity"~"^(bar|pub|biergarten|nightclub)$"]'],
  [/brewer|winer|distill/, 'nwr["craft"~"^(brewery|winery|distillery)$"];nwr["industrial"="brewery"];nwr["shop"="wine"]'],
  [/pizza/, 'nwr["cuisine"~"pizza"]'],
  [/mexican|taco/, 'nwr["cuisine"~"mexican|tex-mex|taco"]'],
  [/asian|chinese|thai|sushi|japanese/, 'nwr["cuisine"~"chinese|thai|japanese|sushi|asian|vietnamese|korean"]'],
  [/bbq|barbecue|smokehouse/, 'nwr["cuisine"~"bbq|barbecue"]'],
  [/coffee|cafe/, 'nwr["amenity"="cafe"];nwr["shop"="coffee"]'],
  [/baker|donut/, 'nwr["shop"~"^(bakery|pastry|confectionery)$"];nwr["cuisine"~"donut"]'],
  [/food truck/, 'nwr["amenity"="fast_food"]["food_truck"="yes"]'],
  [/restaurant|diner|grill|eater|food/, 'nwr["amenity"~"^(restaurant|fast_food)$"]'],
  [/car wash/, 'nwr["amenity"="car_wash"]'],
  [/auto body/, 'nwr["shop"="car_repair"]["service"~"body"];nwr["craft"="car_painter"]'],
  [/auto|mechanic|tire|oil/, 'nwr["shop"~"^(car_repair|tyres|car_parts)$"]'],
  [/plumb/, 'nwr["craft"="plumber"]'],
  [/electric/, 'nwr["craft"="electrician"]'],
  [/roof/, 'nwr["craft"="roofer"]'],
  [/hvac|heating/, 'nwr["craft"~"^(hvac|heating_engineer)$"]'],
  [/contractor|construction|remodel|builder/, 'nwr["craft"~"^(builder|carpenter|tiler|plasterer|stonemason|window_construction|floorer)$"];nwr["office"="construction_company"]'],
  [/landscap|lawn|tree/, 'nwr["craft"~"^(gardener|landscaper)$"];nwr["shop"="garden_centre"]'],
  [/clean/, 'nwr["shop"~"^(dry_cleaning|laundry)$"];nwr["craft"="cleaning"]'],
  [/paint/, 'nwr["craft"="painter"]'],
  [/concrete|paving|asphalt/, 'nwr["craft"~"^(stonemason|paver)$"]'],
  [/handym/, 'nwr["craft"="handyman"]'],
  [/pest/, 'nwr["craft"="pest_control"]'],
  [/tow/, 'nwr["shop"="car_repair"]["service:vehicle:towing"="yes"]'],
  [/mover/, 'nwr["office"="moving_company"]'],
  [/barber/, 'nwr["shop"="hairdresser"]["hairdresser"="barber"];nwr["shop"="hairdresser"]["name"~"[Bb]arber"]'],
  [/hair|salon/, 'nwr["shop"="hairdresser"]'],
  [/nail/, 'nwr["shop"="beauty"]["beauty"~"nails"];nwr["shop"="beauty"]["name"~"[Nn]ail"]'],
  [/tattoo/, 'nwr["shop"="tattoo"]'],
  [/spa|massage/, 'nwr["shop"~"^(massage|beauty)$"];nwr["leisure"="spa"]'],
  [/gym|fitness/, 'nwr["leisure"~"^(fitness_centre|sports_centre)$"]'],
  [/dentist/, 'nwr["amenity"="dentist"]'],
  [/chiropract/, 'nwr["healthcare"="chiropractor"];nwr["healthcare:speciality"="chiropractic"]'],
  [/veterinar/, 'nwr["amenity"="veterinary"]'],
  [/boutique|cloth/, 'nwr["shop"~"^(clothes|boutique|shoes|fashion_accessories)$"]'],
  [/florist/, 'nwr["shop"="florist"]'],
  [/gift|antique/, 'nwr["shop"~"^(gift|antiques|second_hand|craft)$"]'],
  [/real estate/, 'nwr["office"="estate_agent"]'],
  [/insurance/, 'nwr["office"="insurance"]'],
  [/lawyer/, 'nwr["office"="lawyer"]'],
  [/daycare/, 'nwr["amenity"~"^(childcare|kindergarten)$"]'],
  [/church/, 'nwr["amenity"="place_of_worship"]'],
  [/photograph/, 'nwr["craft"="photographer"];nwr["shop"="photo"]'],
  [/pet groom/, 'nwr["shop"="pet_grooming"]']
];
var OSM_SERVERS = ['https://maps.mail.ru/osm/tools/overpass/api/interpreter', 'https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter'];
var DIRECTORY_HOSTS = /(^|\.)(facebook\.com|instagram\.com|yelp\.com|tripadvisor\.com|mapquest\.com|yellowpages\.com|bbb\.org|google\.com|apple\.com|foursquare\.com|restaurantji\.com|menupix\.com|allmenus\.com|zomato\.com|opentable\.com|doordash\.com|grubhub\.com|ubereats\.com|toasttab\.com|linkedin\.com|wikipedia\.org|nextdoor\.com|angi\.com|homeadvisor\.com|thumbtack\.com|houzz\.com|manta\.com|chamberofcommerce\.com|dexknows\.com|superpages\.com|loc8nearme\.com|wanderlog\.com|traveldubuque\.com|dubuquechamber\.com|tiktok\.com|x\.com|twitter\.com|youtube\.com|pinterest\.com|indeed\.com|glassdoor\.com|zillow\.com|realtor\.com|booksy\.com|vagaro\.com|styleseat\.com|groupon\.com|untappd\.com|menuweb\.menu|sirved\.com|beerandbrewing\.com|duckduckgo\.com|bing\.com|kwwl\.com|telegraphherald\.com|thonline\.com|patch\.com|cityofdubuque\.org|birdeye\.com|waze\.com|roadtrippers\.com|top-rated\.online|nicelocal\.com|cybo\.com|opendi\.us|n49\.com|brownbook\.net|hotfrog\.com|merchantcircle\.com|citysearch\.com|local\.com|showmelocal\.com|usarestaurants\.info|restaurantguru\.com|menuwithprice\.com|wheree\.com|restaurantmenu\.us|menupages\.com|happycow\.net|mapcarta\.com|yably\.com|pubcrawlers\.com|barsandpubs\.us|postmates\.com|seamless\.com|slicelife\.com|beyondmenu\.com|menufy\.com)$/i;

function leadsFindFree_(d) {
  var raw = clip_(d.q, 80).toLowerCase(), cityIn = clip_(d.city || '', 40).toLowerCase();
  if (!raw) return { ok: false, error: 'empty' };
  var town = cityIn.split(',')[0].trim();
  var wide = !!d.wide;
  var bbox = wide ? OSM_WIDE : (OSM_TOWNS[town] || OSM_BBOX);
  var cityLabel = wide ? 'Dubuque area' : (OSM_TOWNS[town] ? d.city : 'Dubuque, IA');
  var sel = '';
  for (var i = 0; i < OSM_CATS.length; i++) if (OSM_CATS[i][0].test(raw)) { sel = OSM_CATS[i][1]; break; }
  if (!sel) { var safeName = raw.replace(/[^a-z0-9 &'-]/g, '').trim(); if (!safeName) return { ok: false, error: 'empty' }; sel = 'nwr["name"~"' + safeName + '",i]'; }
  var parts = sel.split(';').map(function (x) { return x.trim() + '["name"](' + bbox + ');'; }).join('');
  var q = '[out:json][timeout:45];(' + parts + ');out tags center 200;';
  var cache = CacheService.getScriptCache();
  var ck = 'osm_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, q)).slice(0, 22);
  var els = null, hit = cache.get(ck);
  if (hit) { try { els = JSON.parse(hit); } catch (e) {} }
  if (!els) {
    for (var s = 0; s < OSM_SERVERS.length && !els; s++) {
      try {
        var r = UrlFetchApp.fetch(OSM_SERVERS[s], { method: 'post', payload: { data: q }, muteHttpExceptions: true,
          headers: { 'User-Agent': 'RiverbendLeads/1.0 (riverbendwebco.com)' } });
        var t = r.getContentText();
        if (r.getResponseCode() === 200 && /^\s*\{/.test(t)) els = (JSON.parse(t).elements || []).map(function (e) { return { id: e.type + '/' + e.id, tags: e.tags || {}, lat: e.lat || (e.center || {}).lat, lon: e.lon || (e.center || {}).lon }; });
      } catch (e) {}
    }
    if (!els) return { ok: false, error: 'busy', message: 'The free map service is busy right now. Try again in a minute.' };
    var json = JSON.stringify(els);
    if (json.length < 95000) cache.put(ck, json, 24 * 60 * 60);
  }
  var seen = {};
  var leads = els.filter(function (e) {
    var n = String(e.tags.name || '').toLowerCase();
    if (!n || seen[n]) return false; seen[n] = 1;
    if (wide && e.lat && leadsKm_(e.lat, e.lon) > 49) return false;
    return !e.tags['disused:amenity'] && !e.tags['disused:shop'];
  }).slice(0, wide ? 250 : 60).map(function (e) {
    var tg = e.tags;
    var addr = [tg['addr:housenumber'], tg['addr:street']].filter(String).join(' ');
    var web = tg.website || tg['contact:website'] || tg.url || '';
    if (web && !/^https?:\/\//i.test(web)) web = 'https://' + web;
    var fb = tg['contact:facebook'] || tg.facebook || '';
    var city = tg['addr:city'] ? tg['addr:city'] + ', ' + (tg['addr:state'] || 'IA') : cityLabel;
    var type = humanTag_(tg);
    return { id: 'osm:' + e.id, name: clip_(tg.name, 120), type: type, ptype: tg.amenity || tg.shop || tg.craft || tg.office || '',
      phone: fmtPhone_(tg.phone || tg['contact:phone'] || ''), website: clip_(web || fb, 300), address: clip_(addr, 160), city: city,
      full: [addr, city].filter(String).join(', '), rating: 0, reviews: 0, brand: !!(tg.brand || tg['brand:wikidata']),
      maps: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(tg.name + ' ' + (addr || '') + ' ' + city),
      hours: [], kind: 'site', issues: [], source: 'free',
      oh: !!tg.opening_hours, em: !!(tg.email || tg['contact:email']), so: !!(fb || tg['contact:instagram'] || tg.instagram) };
  });
  var fast = !!d.fast;
  leadsVerifyFree_(leads, fast);
  leadsCheckSites_(leads, !fast && d.check !== false);
  leadsFinish_(leads);
  var saved = {};
  leadsSaved_().forEach(function (x) { saved[x.id] = x.stage || 'New'; });
  leads.forEach(function (l) { if (saved[l.id]) l.saved = saved[l.id]; });
  var rank = { none: 0, social: 1, weak: 2, site: 3, chain: 4 };
  leads.sort(function (a, b) { return (rank[a.kind] - rank[b.kind]) || a.name.localeCompare(b.name); });
  var counts = { total: leads.length, none: 0, social: 0, weak: 0, site: 0, chain: 0 };
  leads.forEach(function (l) { counts[l.kind]++; });
  return { ok: true, free: true, query: raw + ' in ' + cityLabel, leads: leads, counts: counts };
}

function humanTag_(tg) {
  var v = tg.cuisine && (tg.amenity === 'restaurant' || tg.amenity === 'fast_food') ? String(tg.cuisine).split(';')[0] + ' restaurant' : (tg.amenity || tg.shop || tg.craft || tg.office || tg.leisure || tg.healthcare || '');
  v = String(v).replace(/_/g, ' ');
  return v ? v.charAt(0).toUpperCase() + v.slice(1) : '';
}

function leadsFinish_(leads) {
  leads.forEach(function (l) {
    if (l.brand) { l.kind = 'chain'; l.issues = ['Chain or franchise location']; l.pending = false; l.searchPending = false; }
    if (l.searchPending) { l.pending = true; l.issues = ['Checking for a website...']; }
    if (l.found) l.issues.unshift('Website found: ' + hostOf_(l.website));
  });
}

/* Second step of a fast search: check up to 8 leads at a time while the list is already on screen. */
function leadsVerify_(d) {
  var list = (d.leads || []).slice(0, 8).map(function (l) {
    return { id: clip_(l.id, 200), name: clip_(l.name, 120), type: clip_(l.type, 60), ptype: clip_(l.ptype, 40), phone: clip_(l.phone, 40),
      website: l.searchPending ? '' : clip_(l.website, 300), address: clip_(l.address, 160), city: clip_(l.city, 60), full: clip_(l.full, 220),
      rating: Number(l.rating) || 0, reviews: Number(l.reviews) || 0, brand: !!l.brand, maps: clip_(l.maps, 400), hours: [],
      found: !!l.found && !l.searchPending, kind: 'site', issues: [], source: 'free', oh: !!l.oh, em: !!l.em, so: !!l.so };
  }).filter(function (l) { return l.id && l.name; });
  leadsVerifyFree_(list, false, 22000);
  leadsCheckSites_(list, true);
  leadsFinish_(list);
  return { ok: true, leads: list };
}

/* For leads with no website on the map, search the web for one.
   Small batches so the free search does not rate-limit us. */
function leadsVerifyFree_(leads, cacheOnly, budget) {
  var need = leads.filter(function (l) { return !l.website && !l.brand; });
  var cache = CacheService.getScriptCache();
  var keyOf = function (l) { return 'ws3_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, l.name + '|' + l.city)).slice(0, 20); };
  var todo = [];
  need.forEach(function (l) {
    var c = cache.get(keyOf(l));
    if (c === null) todo.push(l); else { l.checked = true; if (c) { l.website = c; l.found = true; } }
  });
  if (cacheOnly) { todo.forEach(function (l) { l.searchPending = true; }); return; }
  var ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
  var start = Date.now();
  todo = guessDomains_(todo, ua, cache, keyOf);
  var ends = ['https://lite.duckduckgo.com/lite/?q=', 'https://html.duckduckgo.com/html/?q='], e = 0, misses = 0;
  for (var i = 0; i < todo.length && Date.now() - start < (budget || 45000) && misses < 3; i += 4) {
    var batch = todo.slice(i, i + 4);
    var reqs = batch.map(function (l) {
      return { url: ends[e % 2] + encodeURIComponent('"' + l.name + '" ' + l.city.split(',')[0]), muteHttpExceptions: true, followRedirects: true,
        headers: { 'User-Agent': ua, 'Accept-Language': 'en-US,en' } };
    });
    e++;
    var res;
    try { res = UrlFetchApp.fetchAll(reqs); } catch (x) { res = leadsFetchEach_(reqs); }
    var got = 0;
    batch.forEach(function (l, j) {
      var r = res[j];
      if (!r || r.getResponseCode() !== 200) return;
      var html = r.getContentText();
      if (/anomaly|challenge-form|captcha/i.test(html) || html.length < 2000) return;
      got++;
      l.checked = true;
      var site = siteFromResults_(html, l.name);
      if (site) { l.website = site; l.found = true; }
      cache.put(keyOf(l), site || '', 7 * 24 * 60 * 60);
    });
    if (!got) { misses++; Utilities.sleep(1500); } else { misses = 0; Utilities.sleep(250); }
  }
  leads.forEach(function (l) { if (!l.website && !l.checked && !l.brand) l.unverified = true; });
}

function siteFromResults_(html, name) {
  var words = String(name).toLowerCase().replace(/&/g, ' and ').replace(/'s\b/g, 's').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/)
    .filter(function (w) { return w.length > 2 && !/^(the|and|bar|grill|restaurant|inc|llc|company|shop|dubuque|of|pub|tap|cafe|co)$/.test(w); });
  if (!words.length) words = String(name).toLowerCase().replace(/[^a-z0-9]/g, '').length > 3 ? [String(name).toLowerCase().replace(/[^a-z0-9]/g, '')] : [];
  var re = /href="([^"]+)"/g, m, seen = {}, n = 0;
  while ((m = re.exec(html)) && n < 12) {
    var u = m[1].replace(/&amp;/g, '&');
    var g = u.match(/[?&]uddg=([^&]+)/);
    if (g) { try { u = decodeURIComponent(g[1]); } catch (x) { continue; } }
    if (!/^https?:\/\//i.test(u)) continue;
    var host = hostOf_(u);
    if (!host || seen[host] || /duckduckgo\.com|w3\.org/i.test(host)) continue;
    seen[host] = 1; n++;
    if (DIRECTORY_HOSTS.test(host) || LEADS_SOCIAL.test(host)) continue;
    var hostWord = host.split('.').slice(0, -1).join('').replace(/[^a-z0-9]/g, '');
    if (words.some(function (w) { return hostWord.indexOf(w) >= 0; })) return 'https://' + host + '/';
  }
  return '';
}


function leadsFetchEach_(reqs) {
  return reqs.map(function (q) { try { return UrlFetchApp.fetch(q.url, q); } catch (e) { return null; } });
}

/* Try the web addresses local businesses usually use: name.com, namedbq.com, namedubuque.com.
   All names are looked up at once through Google DNS, then only the ones that exist are opened, also at once. */
function domainPlan_(name, city) {
  var base = String(name).toLowerCase().replace(/&/g, 'and').replace(/'s\b/g, 's').replace(/[^a-z0-9 ]/g, '').trim();
  var noThe = base.replace(/^the\s+/, '');
  var slug = noThe.replace(/\s+/g, ''), slugThe = base.replace(/\s+/g, '');
  if (slug.length < 4) return null;
  var town = String(city || 'Dubuque').split(',')[0].toLowerCase().replace(/[^a-z]/g, '');
  var short = town === 'dubuque' ? 'dbq' : '';
  var oneWord = noThe.split(/\s+/).length < 2;
  var cands = [oneWord ? '' : slug + '.com', oneWord ? '' : slugThe + '.com', short ? slug + short + '.com' : '', slug + town + '.com', short ? slugThe + short + '.com' : '', slugThe + town + '.com']
    .filter(function (x, i, a) { return x && a.indexOf(x) === i; });
  var words = noThe.split(/\s+/).filter(function (w) { return w.length > 2 && !/^(and|bar|grill|restaurant|pub|tap|cafe|inc|llc|company)$/.test(w); });
  if (!words.length) words = [slug];
  return { cands: cands, words: words, town: town };
}

function domainMatch_(plan, cand, r) {
  if (!r) return false;
  var code = r.getResponseCode();
  if (code === 403 || code === 401) return /(dbq|dubuque)\.com$/.test(cand);
  if (code >= 400) return false;
  var html = String(r.getContentText()).slice(0, 200000).toLowerCase();
  if (/domain (is )?for sale|buy this domain|parked free|this domain may be for sale|godaddy\.com\/domainsearch|sedoparking|hugedomains|dan\.com/.test(html)) return false;
  var title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || '';
  var hay = title + ' ' + html.slice(0, 60000), w = plan.words, t = plan.town;
  var hits = w.filter(function (x) { return hay.indexOf(x) >= 0; }).length;
  return hits >= Math.max(1, Math.ceil(w.length * 0.6)) && hay.indexOf(w[0]) >= 0 && (!t || hay.indexOf(t) >= 0 || hay.indexOf('iowa') >= 0 || hay.indexOf(', ia') >= 0 || hay.indexOf('563') >= 0);
}

function guessDomains_(todo, ua, cache, keyOf) {
  var plans = todo.map(function (l) { return domainPlan_(l.name, l.city); });
  var all = [];
  plans.forEach(function (p, i) { if (p) p.cands.forEach(function (c) { all.push([i, c]); }); });
  if (!all.length) return todo;
  var dns = [];
  try { dns = UrlFetchApp.fetchAll(all.map(function (k) { return { url: 'https://dns.google/resolve?type=A&name=' + k[1], muteHttpExceptions: true }; })); } catch (e) { dns = []; }
  var live = all.filter(function (k, j) {
    var r = dns[j]; if (!r) return true;
    try { var o = JSON.parse(r.getContentText()); return o.Status === 0 && (o.Answer || []).length > 0; } catch (e) { return true; }
  });
  var found = {};
  if (live.length) {
    var reqs = live.map(function (k) { return { url: 'https://' + k[1] + '/', muteHttpExceptions: true, followRedirects: true, validateHttpsCertificates: false, headers: { 'User-Agent': ua } }; });
    var res; try { res = UrlFetchApp.fetchAll(reqs); } catch (x) { res = leadsFetchEach_(reqs); }
    live.forEach(function (k, j) { if (!found[k[0]] && domainMatch_(plans[k[0]], k[1], res[j])) found[k[0]] = 'https://' + k[1] + '/'; });
  }
  return todo.filter(function (l, i) {
    if (!found[i]) return true;
    l.website = found[i]; l.found = true; l.checked = true; cache.put(keyOf(l), found[i], 7 * 24 * 60 * 60); return false;
  });
}

/* =====================================================================
   BILLING (Square)
   How it works:
   - Signing the agreement creates a billing account (status "Awaiting payment setup").
   - The client opens their private /pay/ link, sees the schedule, and saves a card with
     Square's secure card form. Riverbend never sees card numbers; we keep only Square's
     customer and card IDs. Pay-upfront clients are charged the setup fee right then.
   - An owner clicks "Website Live - Activate Billing" in /billing/. That charges the
     prorated launch payment once (duplicate clicks and retries cannot double charge).
   - The daily billing job (.github/workflows/daily-billing.yml) charges the 1st of each
     month, retries failures on the 3rd and 5th, sends the agreement's reminders and flags
     past-due accounts. It never touches a website, hosting or a domain.
   - Test mode (Square sandbox) is the default. Customer emails in test mode go only to
     Riverbend. Going live needs an owner to switch modes in /billing/ settings.
   ===================================================================== */

var BILL_TIERS = {
  starter: { n: 'Starter', zero: 10900, care: 5000, once: 49900 },
  custom: { n: 'Custom', zero: 17900, care: 7500, once: 99900 },
  premium: { n: 'Premium', zero: 34900, care: 10000, once: 249900 }
};
var BILL_TZ = 'America/Chicago';
var BILL_HEADERS = ['ID', 'Business', 'Owner', 'Email', 'Phone', 'Package', 'Payment option', 'Setup fee', 'Monthly', 'Status', 'Launch date', 'Next bill', 'Full payments', 'Mode', 'Updated', 'Pay key', 'Data (do not edit)'];
var SQ_VERSION = '2025-01-23';
var BILL_VERSION = '2026-11-23k';
// Everything that charges, changes money or payment settings needs an individual owner account.
// The old shared billing password can only view billing until owners turn it off.
var BILL_OWNER_ONLY = { billing_settings: 1, billing_catalog: 1, billing_plans: 1, billing_postest: 1, billing_selftest: 1, billing_paylink: 1, billing_manual: 1, billing_end: 1, billing_setup_inperson: 1,
  billing_launch: 1, billing_retry: 1, billing_cancel: 1, billing_refund: 1, billing_flag: 1, billing_findcard: 1, billing_tick: 1 };
var BILL_CONSENT_V = '2026-11-22';

/* ---------- dates and money ---------- */
function billToday_() { return Utilities.formatDate(new Date(), BILL_TZ, 'yyyy-MM-dd'); }
function ymd_(s) { var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); return m ? { y: +m[1], m: +m[2], d: +m[3] } : null; }
function dim_(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }               // m is 1-12
function iso_(y, m, d) { var t = new Date(Date.UTC(y, m - 1, d)); return t.toISOString().slice(0, 10); }
function addDays_(s, n) { var a = ymd_(s); return iso_(a.y, a.m, a.d + n); }
function dayDiff_(a, b) { var x = ymd_(a), y = ymd_(b); return Math.round((Date.UTC(y.y, y.m - 1, y.d) - Date.UTC(x.y, x.m - 1, x.d)) / 864e5); }
function firstNext_(s) { var a = ymd_(s); return iso_(a.y, a.m + 1, 1); }
function period_(s) { return String(s).slice(0, 7); }
function usdC_(c) { c = Math.round(Number(c) || 0); return '$' + (c / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function longDate_(s) { var a = ymd_(s); if (!a) return ''; return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][a.m - 1] + ' ' + a.d + ', ' + a.y; }

/* Prorated launch charge: monthly / days in month x days remaining including launch day,
   rounded to the cent. Launch on the 1st = the full month. Amounts in cents. */
function prorate_(monthlyCents, launch) {
  var a = ymd_(launch), dim = dim_(a.y, a.m), rem = dim - a.d + 1;
  if (a.d === 1) return { amount: monthlyCents, dim: dim, rem: dim, full: true };
  return { amount: Math.round(monthlyCents * rem / dim), dim: dim, rem: rem, full: false };
}
/* Final month for a cancellation: charge days 1 through the effective date. */
function finalMonth_(monthlyCents, effective) {
  var a = ymd_(effective), dim = dim_(a.y, a.m);
  return { amount: a.d === dim ? monthlyCents : Math.round(monthlyCents * a.d / dim), days: a.d, dim: dim };
}

/* ---------- storage ---------- */
function billSheet_() {
  var ss = ss_();
  var sh = ss.getSheetByName('Billing');
  if (!sh) {
    sh = ss.insertSheet('Billing');
    sh.appendRow(BILL_HEADERS); sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, BILL_HEADERS.length).setFontWeight('bold').setBackground('#0F172A').setFontColor('#FFFFFF');
    sh.hideColumns(16, 2);
  }
  return sh;
}
function billLedger_(acct, ch, note) {
  try {
    var ss = ss_();
    var sh = ss.getSheetByName('Billing Ledger');
    if (!sh) {
      sh = ss.insertSheet('Billing Ledger');
      sh.appendRow(['Time', 'Account', 'Business', 'Type', 'Period', 'Due', 'Amount', 'Status', 'Square payment', 'Attempt', 'Note', 'Mode']);
      sh.setFrozenRows(1); sh.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#0F172A').setFontColor('#FFFFFF');
    }
    var safe = function (s) { s = String(s == null ? '' : s); return /^[=+\-@]/.test(s) ? "'" + s : s; };
    sh.appendRow([new Date(), acct.id, safe(acct.business), ch.kind, ch.period || '', ch.due, ch.amount / 100, ch.status, ch.paymentId || '', ch.attempts || 0, safe(note || ch.error || ''), acct.env]);
  } catch (e) { console.error(e); }
}
function billAll_() {
  var sh = billSheet_(), n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 17, n - 1, 1).getValues().map(function (r, i) {
    try { var a = JSON.parse(r[0]); a._row = i + 2; return a; } catch (e) { return null; }
  }).filter(Boolean);
}
function billGet_(id) { return billAll_().filter(function (a) { return a.id === id; })[0] || null; }
function billByKey_(key) {
  if (!/^[a-f0-9]{48}$/.test(String(key || ''))) return null;
  var h = sha256Hex_('pay:' + key), sh = billSheet_(), n = sh.getLastRow();
  if (n < 2) return null;
  var keys = sh.getRange(2, 16, n - 1, 1).getValues();
  for (var i = 0; i < keys.length; i++) if (keys[i][0] && sameHex_(String(keys[i][0]), h)) return billGet_(String(sh.getRange(i + 2, 1).getValue()));
  return null;
}
function billSave_(a) {
  var sh = billSheet_();
  a.updated = new Date().toISOString();
  var v = billView_(a);
  var safe = function (s) { s = String(s == null ? '' : s); return /^[=+\-@]/.test(s) ? "'" + s : s; };
  var copy = JSON.parse(JSON.stringify(a)); delete copy._row;
  var row = [a.id, safe(a.business), safe(a.owner), safe(a.email), safe(a.phone), v.packageName, v.optionName, a.setup / 100, a.monthly / 100, v.statusText,
    a.launch || '', v.nextDate || '', a.pay === 'zero' ? v.fullPaid + ' of 12' : String(v.fullPaid), a.env === 'production' ? 'Live' : 'Test', new Date(), a.payHash, JSON.stringify(copy)];
  if (!a._row) {
    var found = billGet_(a.id);
    if (found) a._row = found._row;
  }
  if (a._row) sh.getRange(a._row, 1, 1, row.length).setValues([row]);
  else { sh.appendRow(row); a._row = sh.getLastRow(); }
  return a;
}
function billLog_(a, msg) { a.log = a.log || []; a.log.push({ t: new Date().toISOString(), m: String(msg).slice(0, 300) }); if (a.log.length > 120) a.log = a.log.slice(-120); }

/* ---------- Square ---------- */
function sqEnv_() { return PropertiesService.getScriptProperties().getProperty('SQUARE_ENV') === 'production' ? 'production' : 'sandbox'; }
/* Application IDs are public (they appear in the payment page); access tokens are secret and live only in Script Properties. */
var SQ_APP_IDS = { sandbox: 'sandbox-sq0idb-2tEEA0lrBti3HxT7KjIobg', production: 'sq0idp-44LaryylblBhPEjQ7tjeAg' };
function sqProp_(k, env) { env = env || sqEnv_(); return PropertiesService.getScriptProperties().getProperty('SQUARE_' + k + '_' + env.toUpperCase()) || (k === 'APP' ? SQ_APP_IDS[env] : '') || ''; }
function sqBase_(env) { return (env || sqEnv_()) === 'production' ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com'; }
var SQ_FAKE = null; // tests only
function sq_(method, path, body, env, tokOverride) {
  env = env || sqEnv_();
  if (SQ_FAKE) return SQ_FAKE(method, path, body, env, tokOverride);
  var tok = tokOverride || sqProp_('TOKEN', env);
  if (!tok) return { ok: false, status: 0, errors: [{ code: 'NO_TOKEN', detail: 'Square is not connected yet.' }] };
  var opts = { method: method, muteHttpExceptions: true, contentType: 'application/json', headers: { Authorization: 'Bearer ' + tok, 'Square-Version': SQ_VERSION } };
  if (body) opts.payload = JSON.stringify(body);
  var r;
  try { r = UrlFetchApp.fetch(sqBase_(env) + path, opts); }
  catch (e) { return { ok: false, status: 0, network: true, errors: [{ code: 'NETWORK', detail: String(e).slice(0, 200) }] }; }
  var code = r.getResponseCode(), j = {};
  try { j = JSON.parse(r.getContentText() || '{}'); } catch (e) { j = {}; }
  j.ok = code >= 200 && code < 300 && !(j.errors && j.errors.length);
  j.status = code;
  if (code >= 500 || code === 429) j.network = true; // outcome unknown: retry later with the same idempotency key
  return j;
}
function sqErr_(r) { var e = (r && r.errors && r.errors[0]) || {}; return (e.code || 'ERROR') + (e.detail ? ': ' + e.detail : ''); }
function sqLocation_(env) {
  env = env || sqEnv_();
  var loc = sqProp_('LOCATION', env);
  if (loc) return loc;
  var r = sq_('get', '/v2/locations', null, env);
  var l = (r.locations || []).filter(function (x) { return x.status === 'ACTIVE'; })[0];
  if (l) { PropertiesService.getScriptProperties().setProperty('SQUARE_LOCATION_' + env.toUpperCase(), l.id); return l.id; }
  return '';
}

/* ---------- account creation (called when an agreement is signed) ---------- */
function billPlanKey_(k) {
  var m = String(k || '').match(/^(starter|custom|premium)-(zero|once)$/);
  return m ? { tier: m[1], pay: m[2] } : null;
}
function billCreateFromAgreement_(f, signer) {
  var pk = billPlanKey_(unesc_(f['Plan Key'] || ''));
  if (!pk) return null;
  var T = BILL_TIERS[pk.tier];
  var key = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, 48);
  var a = {
    id: 'rb' + Utilities.getUuid().replace(/-/g, '').slice(0, 10),
    created: new Date().toISOString(), env: sqEnv_(),
    business: unesc_(f['Business'] || '').slice(0, 120), owner: unesc_(f['Owner'] || '').slice(0, 120),
    email: unesc_(f['Email'] || '').slice(0, 160), phone: unesc_(f['Phone'] || '').slice(0, 40),
    tier: pk.tier, pay: pk.pay, monthly: pk.pay === 'zero' ? T.zero : T.care, setup: pk.pay === 'once' ? T.once : 0,
    agreement: { signed: unesc_(f['Signed'] || ''), plan: unesc_(f['Plan'] || '') },
    payHash: sha256Hex_('pay:' + key), payKey: billPayUrl_(key), status: 'awaiting_card', setupPaid: false,
    sq: {}, launch: '', charges: [], cancel: null, flags: {}, log: [], engine: 'sub', rep: signer ? signer.email : ''
  };
  billLog_(a, 'Agreement signed. Waiting for the client to set up payment.');
  billSave_(a);
  return { account: a, key: key };
}
function billPayUrl_(key) { return 'https://' + SITE + '/pay/#' + key; }

/* ---------- charging ---------- */
function billFindCharge_(a, key) { return (a.charges || []).filter(function (c) { return c.key === key; })[0] || null; }
function billDesc_(a, ch) {
  var T = BILL_TIERS[a.tier];
  var what = { setup: 'Website setup fee', prorated: 'Prorated launch payment', full: 'Monthly website service', final: 'Final prorated monthly service', balance: 'Balance' }[ch.kind] || 'Payment';
  return 'Riverbend Web Co. ' + T.n + ': ' + what + (ch.period ? ' (' + ch.period + ')' : '');
}
/* Charges the saved card. Returns the charge. Square's idempotency key is tied to the
   account, the charge and the attempt number, so a repeated request can never charge twice. */
function billCharge_(a, ch, opts) {
  opts = opts || {};
  if (ch.status === 'paid' || ch.status === 'pending') return ch;
  if (!a.sq.cardId && !opts.source) { ch.status = 'failed'; ch.error = 'NO_CARD: no saved payment method'; return ch; }
  if (ch.status === 'failed' && !opts.sameAttempt) ch.attempts = (ch.attempts || 0) + 1;
  if (!ch.attempts) ch.attempts = 1;
  var loc = sqLocation_(a.env);
  var body = {
    idempotency_key: ('rb-' + a.id + '-' + ch.key + '-' + ch.attempts).slice(0, 45),
    source_id: opts.source || a.sq.cardId, amount_money: { amount: ch.amount, currency: 'USD' },
    autocomplete: true, reference_id: a.id, note: billDesc_(a, ch).slice(0, 500)
  };
  if (a.sq.customerId) body.customer_id = a.sq.customerId;
  if (loc) body.location_id = loc;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.email) && a.env === 'production') body.buyer_email_address = a.email;
  ch.lastTry = new Date().toISOString();
  var r = sq_('post', '/v2/payments', body, a.env);
  var p = r.payment || {};
  if (r.ok && p.status === 'COMPLETED') { ch.status = 'paid'; ch.paymentId = p.id; ch.paidAt = new Date().toISOString(); ch.receipt = p.receipt_url || ''; ch.error = ''; }
  else if (r.ok && (p.status === 'APPROVED' || p.status === 'PENDING')) { ch.status = 'pending'; ch.paymentId = p.id; }
  else if (r.network) { ch.status = 'unknown'; ch.error = 'Square did not answer. Will check again with the same request.'; }
  else { ch.status = 'failed'; ch.paymentId = p.id || ch.paymentId || ''; ch.error = sqErr_(r); }
  billLedger_(a, ch);
  billLog_(a, billDesc_(a, ch) + ' ' + usdC_(ch.amount) + ': ' + ch.status + (ch.error ? ' (' + ch.error + ')' : ''));
  return ch;
}
function billAfterCharge_(a, ch, why) {
  if (ch.status === 'paid') {
    if (!ch.invoiceId) billMailCustomer_(a, 'receipt', ch);
    if (ch.kind === 'setup') a.setupPaid = true;
    var stillOwed = (a.charges || []).filter(function (c) { return c.status === 'failed' && c.kind !== 'setup'; }).length;
    if (!stillOwed && a.flags.suspended) { a.flags.suspended = false; billMailOwner_(a, 'Balance paid: restore services', 'The overdue balance is paid. Restore any suspended services within 1 business day.'); }
    if (!stillOwed) { a.flags.suspendEligible = false; a.flags.termReview = false; }
  } else if (ch.status === 'failed' && ch.kind !== 'setup') {
    ch.notices = ch.notices || {};
    if (!ch.notices.d0) { ch.notices.d0 = 1; billMailCustomer_(a, 'failed', ch); }
    billMailOwner_(a, 'Payment failed: ' + a.business, billDesc_(a, ch) + ' of ' + usdC_(ch.amount) + ' did not go through (' + (ch.error || 'declined') + ').' + (why ? ' ' + why : '') + ' The client was emailed a secure link to update their card.');
  }
}

/* Ownership and counts */
function billCounts_(a) {
  var counted = function (c) { return c.status === 'paid' && !c.refunded && !c.disputed; };
  var full = (a.charges || []).filter(function (c) { return c.kind === 'full' && counted(c); }).length;
  var pro = (a.charges || []).filter(function (c) { return c.kind === 'prorated'; })[0];
  var launchOk = !!a.launch && (!pro || counted(pro));
  return { full: full, launchOk: launchOk };
}
function billOwnership_(a) {
  var c = billCounts_(a);
  if (a.pay === 'once') return a.setupPaid ? { eligible: true, text: 'Eligible (setup fee paid)' } : { eligible: false, text: 'After the setup fee is paid' };
  if (!a.launch) return { eligible: false, text: 'After launch payment + 12 full payments' };
  if (c.full >= 12 && c.launchOk) return { eligible: true, text: 'Eligible (launch payment + 12 full payments paid)' };
  return { eligible: false, text: 'After ' + Math.max(0, 12 - c.full) + ' more full payment' + (12 - c.full === 1 ? '' : 's') + (c.launchOk ? '' : ' and the launch payment') };
}

/* Next bill date and amount */
function billNext_(a, today) {
  today = today || billToday_();
  if (a.status === 'ended' || a.status === 'awaiting_card' || a.status === 'building' || !a.launch) return { date: '', amount: 0, text: a.status === 'ended' ? 'None (billing ended)' : 'Starts when the website goes live' };
  var billed = {};
  (a.charges || []).forEach(function (c) { if ((c.kind === 'full' || c.kind === 'final' || c.kind === 'prorated') && c.period) billed[c.period] = 1; });
  var d = billed[period_(today)] ? firstNext_(today) : (today.slice(8) === '01' ? today : firstNext_(today));
  if (billed[period_(d)]) d = firstNext_(d);
  if (a.cancel && a.cancel.effective && a.cancel.mode === 'notice') {
    if (a.cancel.effective < d) return { date: '', amount: 0, text: 'None (cancellation effective ' + longDate_(a.cancel.effective) + ')' };
    if (period_(a.cancel.effective) === period_(d)) { var f = finalMonth_(a.monthly, a.cancel.effective); return { date: d, amount: f.amount, text: usdC_(f.amount) + ' on ' + longDate_(d) + ' (final, prorated through ' + longDate_(a.cancel.effective) + ')' }; }
  }
  if (a.flags.paused) return { date: '', amount: 0, text: 'Paused by an owner' };
  return { date: d, amount: a.monthly, text: usdC_(a.monthly) + ' on ' + longDate_(d) };
}

var BILL_STATUS = { awaiting_card: 'Awaiting payment setup', building: 'Building (card on file)', active: 'Active', canceling: 'Canceling (notice given)', ended: 'Ended' };
function billView_(a, today) {
  today = today || billToday_();
  var T = BILL_TIERS[a.tier], c = billCounts_(a), nx = billNext_(a, today), own = billOwnership_(a);
  var failed = (a.charges || []).filter(function (x) { return x.status === 'failed' && x.kind !== 'setup'; });
  var pastDue = failed.reduce(function (s, x) { return s + x.amount; }, 0);
  var oldest = failed.map(function (x) { return x.due; }).sort()[0] || '';
  var late = oldest ? dayDiff_(oldest, today) : 0;
  var payStatus = !failed.length ? ((a.charges || []).some(function (x) { return x.status === 'unknown' || x.status === 'pending'; }) ? 'Waiting on Square' : 'Current')
    : a.flags.termReview ? 'Over 30 days past due: owner review' : a.flags.suspended ? 'Past due: non-essential services suspended' : a.flags.suspendEligible ? 'Past due: suspension needs owner approval'
    : late >= 5 ? 'Past due' : 'Payment failed: grace period (ends ' + longDate_(addDays_(oldest, 4)) + ')';
  var pro = (a.charges || []).filter(function (x) { return x.kind === 'prorated' || (x.kind === 'full' && x.launch); })[0];
  var statusText = BILL_STATUS[a.status] || a.status;
  if (a.flags.paused && a.status !== 'ended') statusText += ' (paused)';
  if (a.cancel && a.cancel.mode === 'review') statusText += ' (cancellation request: owner review)';
  return {
    id: a.id, business: a.business, owner: a.owner, email: a.email, phone: a.phone, env: a.env,
    packageName: T.n, tier: a.tier, pay: a.pay, optionName: a.pay === 'zero' ? '$0 Down' : 'Pay Upfront',
    setup: a.setup, setupPaid: !!a.setupPaid, monthly: a.monthly, launch: a.launch,
    firstCharge: pro ? { amount: pro.amount, status: pro.status, kind: pro.kind } : null,
    nextDate: nx.date, nextAmount: nx.amount, nextText: nx.text,
    payStatus: payStatus, pastDue: pastDue, pastDueSince: oldest,
    fullPaid: c.full, remaining: a.pay === 'zero' ? Math.max(0, 12 - c.full) : null,
    agreement: 'Signed' + (a.agreement && a.agreement.signed ? ' ' + a.agreement.signed : ''),
    ownership: own.text, ownershipEligible: own.eligible, status: a.status, statusText: statusText,
    card: a.sq.cardId ? (a.sq.brand || 'Card') + ' ending ' + (a.sq.last4 || '????') : '', flags: a.flags, cancel: a.cancel, refunds: (a.refunds || []).filter(function (r) { return r.status !== 'void'; }).map(function (r) { return { id: r.id, period: r.period, paid: r.paid, owed: r.owed, days: r.days, dim: r.dim, amount: r.amount, effective: r.effective, status: r.status, error: r.error || '', approvedBy: r.approvedBy || '' }; }),
    subscription: a.engine !== 'sub' ? 'Riverbend schedule' : a.sq.subId ? 'Square subscription ' + (a.sq.subStatus || '') + (a.sq.subStart ? ', billing on the 1st from ' + longDate_(a.sq.subStart) : '') + (a.sq.subCanceled ? ' (ending)' : '') : (a.launch ? 'Square subscription not created yet' : 'Created at launch'),
    charges: (a.charges || []).map(function (x) { return { kind: x.kind, period: x.period, due: x.due, amount: x.amount, status: x.status, invoice: !!x.invoiceId, refunded: !!x.refunded, disputed: !!x.disputed, attempts: x.attempts || 0, error: x.error || '', manual: !!x.manual }; }),
    log: (a.log || []).slice(-40), created: a.created
  };
}

/* ---------- client payment page (/pay/) ---------- */
function pay_(d) {
  if (!throttle_()) return { ok: false, error: 'busy' };
  var a = billByKey_(String(d.key || ''));
  if (!a) return { ok: false, error: 'notfound' };
  if (d.action === 'pay_info') return { ok: true, info: payInfo_(a) };
  if (d.action === 'pay_card') return payCard_(a, d);
  if (d.action === 'pay_pos') return payPos_(a);
  if (d.action === 'pay_pos_done') return payPosDone_(a);
  return { ok: false, error: 'unknown' };
}
function payInfo_(a) {
  var v = billView_(a), T = BILL_TIERS[a.tier];
  var lines = [];
  if (a.pay === 'once') lines.push(a.setupPaid ? 'Setup fee of ' + usdC_(a.setup) + ': paid' : 'Today: ' + usdC_(a.setup) + ' one-time website setup fee');
  else lines.push('Today: $0. Nothing is charged at signing.');
  if (!a.launch) {
    lines.push('When your website launches: a prorated ' + usdC_(a.monthly) + ' monthly charge for the rest of that month (' + usdC_(a.monthly) + ' ÷ days in the month × days remaining, counting launch day). A launch on the 1st is charged the full ' + usdC_(a.monthly) + ' once.');
    lines.push(a.pay === 'zero' ? 'Then ' + usdC_(a.monthly) + ' on the 1st of each month: 12 full monthly payments, then month-to-month until you cancel with 30 days’ written notice.'
      : 'Then ' + usdC_(a.monthly) + ' on the 1st of each month, month-to-month. Cancel anytime with 30 days’ written notice.');
  } else {
    lines.push('Website launched ' + longDate_(a.launch) + '.');
    if (v.nextText) lines.push('Next payment: ' + v.nextText + '.');
    if (a.pay === 'zero') lines.push(v.fullPaid + ' of 12 full monthly payments made.');
  }
  return {
    business: a.business, packageName: T.n, optionName: v.optionName, monthly: a.monthly, setup: a.setup, setupDue: a.pay === 'once' && !a.setupPaid ? a.setup : 0,
    pastDue: (a.charges || []).filter(function (c) { return c.status === 'failed' && c.kind !== 'setup' && !c.invoiceId; }).reduce(function (t, c) { return t + c.amount; }, 0),
    invoices: (a.charges || []).filter(function (c) { return c.status === 'failed' && c.invoiceUrl; }).map(function (c) { return { amount: c.amount, period: c.period, url: c.invoiceUrl }; }),
    card: v.card, status: a.status, lines: lines, test: a.env !== 'production',
    appId: sqProp_('APP', a.env), locationId: sqLocation_(a.env), consent: payConsent_(a)
  };
}
function payConsent_(a) {
  return 'I authorize Riverbend Web Co. to save this card securely with Square and charge it ' +
    (a.pay === 'once' && !a.setupPaid ? 'the ' + usdC_(a.setup) + ' setup fee today, ' : '') +
    'the prorated launch payment when my website goes live, and ' + usdC_(a.monthly) + ' on the 1st of each month as described in my signed service agreement' +
    (a.pay === 'zero' ? ' (12 full monthly payments, then month-to-month)' : ' (month-to-month)') +
    ', plus any past-due balance, until my service ends under the agreement’s cancellation terms. Payments renew automatically. I can cancel with 30 days’ written notice as the agreement describes.';
}
function payCard_(a, d) {
  if (a.status === 'ended') return { ok: false, error: 'ended' };
  if (d.consent !== true) return { ok: false, error: 'consent' };
  var source = String(d.source || '');
  if (!/^[A-Za-z0-9:_\-]{8,400}$/.test(source)) return { ok: false, error: 'card' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { ok: false, error: 'busy' };
  try {
    a = billGet_(a.id);
    // 1. Square customer
    if (!a.sq.customerId) {
      var c = sq_('post', '/v2/customers', {
        idempotency_key: ('rb-cust-' + a.id).slice(0, 45), company_name: a.business.slice(0, 100), given_name: a.owner.slice(0, 100),
        email_address: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.email) ? a.email : undefined, reference_id: a.id
      }, a.env);
      if (!c.ok || !c.customer) return { ok: false, error: 'square', detail: sqErr_(c) };
      a.sq.customerId = c.customer.id;
    }
    // 2. Save the card (Square stores it; we keep only its ID)
    var body = { idempotency_key: ('rb-card-' + a.id + '-' + Utilities.getUuid().slice(0, 8)), source_id: source, card: { customer_id: a.sq.customerId, reference_id: a.id } };
    if (d.verification && /^[A-Za-z0-9:_\-]{8,800}$/.test(String(d.verification))) body.verification_token = String(d.verification);
    var r = sq_('post', '/v2/cards', body, a.env);
    if (!r.ok || !r.card) { billLog_(a, 'Card was not saved: ' + sqErr_(r)); billSave_(a); return { ok: false, error: 'declined', detail: sqErr_(r) }; }
    var old = a.sq.cardId;
    a.sq.cardId = r.card.id; a.sq.brand = String(r.card.card_brand || '').replace(/_/g, ' '); a.sq.last4 = r.card.last_4 || ''; a.sq.exp = (r.card.exp_month || '') + '/' + (r.card.exp_year || '');
    a.consent = { at: new Date().toISOString(), v: BILL_CONSENT_V, text: payConsent_(a) };
    if (old && old !== a.sq.cardId) sq_('post', '/v2/cards/' + encodeURIComponent(old) + '/disable', {}, a.env);
    billLog_(a, 'Card saved: ' + a.sq.brand + ' ending ' + a.sq.last4 + '.');
    var results = [];
    // 3. Setup fee (pay upfront)
    if (a.pay === 'once' && !a.setupPaid) {
      var ch = billFindCharge_(a, 'setup');
      if (!ch) { ch = { key: 'setup', kind: 'setup', due: billToday_(), amount: a.setup, status: 'new', attempts: 0 }; a.charges.push(ch); }
      billCharge_(a, ch);
      if (ch.status === 'paid') { a.setupPaid = true; billMailCustomer_(a, 'receipt', ch); }
      results.push({ kind: 'setup', amount: ch.amount, status: ch.status });
      if (ch.status !== 'paid') { billSave_(a); return { ok: false, error: ch.status === 'failed' ? 'declined' : 'pending', detail: ch.error, info: payInfo_(a) }; }
    }
    // 4. Past-due balance (card update after a failure)
    if (a.sq.subId) billSubSetCard_(a);
    (a.charges || []).filter(function (x) { return x.status === 'failed' && x.kind !== 'setup' && !x.invoiceId; }).forEach(function (x) {
      billCharge_(a, x); billAfterCharge_(a, x, 'Charged after the client updated their card.');
      results.push({ kind: x.kind, amount: x.amount, status: x.status });
    });
    if (a.status === 'awaiting_card' && (a.pay === 'zero' || a.setupPaid)) {
      a.status = 'building';
      billMailOwner_(a, 'Payment set up: ' + a.business, (a.pay === 'once' ? 'Setup fee of ' + usdC_(a.setup) + ' paid. ' : 'No charge at signing ($0 down). ') + 'Card on file: ' + a.sq.brand + ' ending ' + a.sq.last4 + '. Development can start. Click "Website Live - Activate Billing" in riverbendwebco.com/billing when the site launches.');
    }
    billSave_(a);
    return { ok: true, results: results, info: payInfo_(a) };
  } finally { lock.releaseLock(); }
}

/* ---------- emails ---------- */
function billTestMode_(a) { return a.env !== 'production'; }
function billMailCustomer_(a, kind, ch) {
  var to = a.email;
  if (a.flags && a.flags.selftest) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to || '')) return;
  var T = BILL_TIERS[a.tier], v = billView_(a), font = "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;";
  var subj, head, body = [];
  if (kind === 'receipt') {
    subj = 'Receipt: ' + usdC_(ch.amount) + ' to Riverbend Web Co.';
    head = 'Payment received. Thank you!';
    body.push(billDesc_(a, ch).replace('Riverbend Web Co. ', '') + ': <b>' + usdC_(ch.amount) + '</b>');
    body.push('Paid with ' + (a.sq.brand || 'card') + ' ending ' + (a.sq.last4 || '') + ' on ' + longDate_(billToday_()) + '.');
    if (ch.kind === 'full' && a.pay === 'zero') body.push('Full monthly payment ' + Math.min(v.fullPaid, 12) + ' of 12' + (v.fullPaid >= 12 ? '. Your 12-payment commitment is complete, and billing continues month-to-month.' : '.'));
    if (v.nextText && ch.kind !== 'setup') body.push('Next payment: ' + v.nextText + '.');
    if (ch.kind === 'setup') body.push('Next, we build your website. Your monthly service starts when it launches, with a prorated first payment.');
    if (ch.receipt) body.push('<a href="' + ch.receipt + '" style="color:#0052CC">View your Square receipt</a>');
  } else if (kind === 'failed' || kind === 'remind' || kind === 'pastdue' || kind === 'final') {
    var due = longDate_(ch.due), amt = usdC_(v.pastDue || ch.amount);
    subj = { failed: 'Your payment to Riverbend Web Co. did not go through', remind: 'Reminder: payment to Riverbend Web Co. is still due', pastdue: 'Your Riverbend Web Co. account is past due', final: 'Final notice before services are paused' }[kind];
    head = { failed: 'We could not process your payment', remind: 'Friendly reminder', pastdue: 'Your account is past due', final: 'Final notice' }[kind];
    body.push(billDesc_(a, ch).replace('Riverbend Web Co. ', '') + ' of <b>' + usdC_(ch.amount) + '</b> was due ' + due + '.' + (v.pastDue > ch.amount ? ' Total past due: <b>' + amt + '</b>.' : ''));
    if (kind === 'failed') body.push((ch.invoiceUrl ? 'Please pay the open invoice using the secure Square link below' : 'Please update your card using the secure link below') + '. You have until ' + longDate_(addDays_(ch.due, 4)) + ' with no interruption.');
    if (ch.invoiceUrl && a.payKey) body.push('To change the card used for future monthly payments: <a href="' + a.payKey + '" style="color:#0052CC">update your card</a>.');
    if (kind === 'remind') body.push('Your grace period ends ' + longDate_(addDays_(ch.due, 4)) + '. Updating your card takes a minute.');
    if (kind === 'pastdue') body.push('Your account is now past due. There is no late fee. If the balance stays unpaid, ongoing maintenance, routine updates and non-emergency support may be suspended. Your website stays online and your domain is always yours.');
    if (kind === 'final') body.push('If the balance is not paid by ' + longDate_(addDays_(ch.due, 14)) + ', Riverbend may suspend non-essential ongoing services (maintenance, routine updates and non-emergency support) until it is paid. Your website is not taken offline automatically and your domain is never withheld.');
    body.push('Need a payment arrangement? Just reply or call (608) 306-0135.');
  } else return;
  var link = kind !== 'receipt' ? ((ch && ch.invoiceUrl) || a.payKey || '') : '';
  var html = '<!doctype html><html><body style="margin:0;background:#F1F5F9"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9"><tr><td align="center" style="padding:26px 12px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border:1px solid #E2E8F0;border-radius:12px;overflow:hidden">' +
    '<tr><td style="background:#0F172A;padding:16px 28px;' + font + 'color:#fff;font-size:15px;font-weight:800">Riverbend <span style="color:#60A5FA">Web Co.</span></td></tr>' +
    '<tr><td style="padding:26px 28px 8px;' + font + 'font-size:22px;font-weight:800;color:#0F172A">' + head + '</td></tr>' +
    '<tr><td style="padding:0 28px 6px;' + font + 'font-size:14px;color:#64748B">' + esc_(a.business) + ' &middot; ' + T.n + ' (' + v.optionName + ')</td></tr>' +
    body.map(function (p) { return '<tr><td style="padding:10px 28px 0;' + font + 'font-size:15px;line-height:1.55;color:#1E293B">' + p + '</td></tr>'; }).join('') +
    (link ? '<tr><td style="padding:18px 28px 0"><a href="' + link + '" style="' + font + 'display:inline-block;background:#0052CC;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 20px;border-radius:8px">' + (ch && ch.invoiceUrl ? 'Pay this invoice' : 'Update payment method') + '</a></td></tr>' : '') +
    '<tr><td style="padding:22px 28px 26px;' + font + 'font-size:12px;color:#94A3B8">Riverbend Web Co. &middot; Dubuque, Iowa &middot; (608) 306-0135 &middot; riverbendwebco@gmail.com<br>Monthly payments are billed on the 1st as described in your service agreement.</td></tr>' +
    '</table></td></tr></table></body></html>';
  var text = head + '\n\n' + body.map(function (p) { return p.replace(/<[^>]+>/g, ''); }).join('\n') + (link ? '\n\nUpdate payment method: ' + link : '');
  var test = billTestMode_(a);
  try {
    MailApp.sendEmail({ to: test ? OWNER_EMAIL : to, subject: (test ? '[TEST to ' + to + '] ' : '') + subj, htmlBody: html, body: text, name: 'Riverbend Web Co.', replyTo: OWNER_EMAIL });
  } catch (e) { console.error(e); }
}
function billMailOwner_(a, subject, msg) {
  if (a.flags && a.flags.selftest) return;
  try {
    var url = 'https://' + SITE + '/billing/#' + a.id;
    MailApp.sendEmail({ to: OWNER_EMAIL, subject: (billTestMode_(a) ? '[TEST] ' : '') + 'Billing: ' + subject, name: 'Riverbend Billing',
      body: msg + '\n\n' + a.business + ' (' + BILL_TIERS[a.tier].n + ', ' + (a.pay === 'zero' ? '$0 Down' : 'Pay Upfront') + ')\nOpen billing: ' + url });
  } catch (e) { console.error(e); }
}

/* ---------- owner actions (/billing/) ---------- */
function billing_(d) {
  switch (d.action) {
    case 'billing_list': return { ok: true, accounts: billAll_().filter(function (a) { return !(a.flags && a.flags.selftest) || d.all; }).map(function (a) { return billView_(a); }), settings: billSettings_(), today: billToday_() };
    case 'billing_get': var g = billGet_(String(d.id || '')); return g ? { ok: true, account: billView_(g) } : { ok: false, error: 'notfound' };
    case 'billing_paylink': return billPaylink_(String(d.id || ''));
    case 'billing_launch': return billLaunch_(String(d.id || ''), String(d.date || ''), d.confirm === true);
    case 'billing_retry': return billRetry_(String(d.id || ''));
    case 'billing_manual': return billManualPaid_(String(d.id || ''), String(d.note || ''));
    case 'billing_cancel': return billCancel_(String(d.id || ''), String(d.date || ''), d.confirm === true);
    case 'billing_refund': return billRefund_(String(d.id || ''), String(d.refundId || ''), d.confirm === true, String(d.confirmText || ''), d._who);
    case 'billing_end': return billEnd_(String(d.id || ''), String(d.confirmText || ''));
    case 'billing_flag': return billFlag_(String(d.id || ''), String(d.flag || ''), !!d.value);
    case 'billing_settings': return billSetSettings_(d);
    case 'billing_tick': return billTick_(d.date && sqEnv_() === 'sandbox' ? String(d.date) : '');
    case 'billing_selftest': return billSelfTest_();
    case 'billing_catalog': return billCatalog_(d.apply === true);
    case 'billing_findcard': return billFindCardAction_(String(d.id || ''));
    case 'billing_postest': return billPosTest_();
    case 'billing_verify': return billVerify_();
    case 'billing_plans': return billPlansCheck_();
    case 'billing_setup_inperson': return billSetupInPerson_(String(d.id || ''), String(d.note || ''));
  }
  return { ok: false, error: 'unknown' };
}
function billSettings_() {
  var env = sqEnv_();
  var s = { env: env };
  ['sandbox', 'production'].forEach(function (e) { s[e] = { token: !!sqProp_('TOKEN', e), appId: sqProp_('APP', e), location: sqProp_('LOCATION', e) }; });
  s.lastTick = PropertiesService.getScriptProperties().getProperty('BILL_LAST_TICK') || '';
  return s;
}
function billSetSettings_(d) {
  var p = PropertiesService.getScriptProperties(), env = d.target === 'production' ? 'production' : 'sandbox', E = env.toUpperCase();
  if (typeof d.sqToken === 'string' && d.sqToken.trim()) {
    var t = d.sqToken.trim();
    if (!/^[A-Za-z0-9_\-]{20,200}$/.test(t)) return { ok: false, error: 'badtoken' };
    var hint = t.slice(0, 4) + '... (' + t.length + ' characters)';
    var r = sq_('get', '/v2/locations', null, env, t);
    var other = env === 'sandbox' ? 'production' : 'sandbox';
    if (!r.ok && r.status === 401) {
      // Pasted in the wrong box? Check the key against the other Square environment.
      var r2 = sq_('get', '/v2/locations', null, other, t);
      if (r2.ok) { env = other; E = env.toUpperCase(); r = r2; }
    }
    if (!r.ok) return { ok: false, error: 'square', detail: sqErr_(r) + ' [key received: ' + hint + ']' };
    p.setProperty('SQUARE_TOKEN_' + E, t);
    p.deleteProperty('SQUARE_LOCATION_' + E); sqLocation_(env);
    if (env !== (d.target === 'production' ? 'production' : 'sandbox')) return { ok: true, moved: env, settings: billSettings_() };
  }
  if (typeof d.appId === 'string' && d.appId.trim()) {
    var app = d.appId.trim();
    if (!/^(sandbox-)?sq0id[a-z]-[A-Za-z0-9_\-]{10,60}$/.test(app)) return { ok: false, error: 'badapp' };
    if ((env === 'sandbox') !== /^sandbox-/.test(app)) return { ok: false, error: 'appenv' };
    p.setProperty('SQUARE_APP_' + E, app);
  }
  if (typeof d.location === 'string' && /^[A-Z0-9]{6,40}$/.test(d.location.trim())) p.setProperty('SQUARE_LOCATION_' + E, d.location.trim());
  if (d.mode === 'production') {
    if (String(d.confirmText || '') !== 'GO LIVE') return { ok: false, error: 'confirm' };
    if (!sqProp_('TOKEN', 'production') || !sqProp_('APP', 'production')) return { ok: false, error: 'notready' };
    p.setProperty('SQUARE_ENV', 'production');
  } else if (d.mode === 'sandbox') p.setProperty('SQUARE_ENV', 'sandbox');
  return { ok: true, settings: billSettings_() };
}
function billPaylink_(id) {
  var a = billGet_(id); if (!a) return { ok: false, error: 'notfound' };
  var key = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, 48);
  a.payHash = sha256Hex_('pay:' + key); a.payKey = billPayUrl_(key);
  billLog_(a, 'New secure payment link created (the old link no longer works).');
  billSave_(a);
  return { ok: true, url: a.payKey };
}
function billLaunch_(id, date, confirm) {
  var today = billToday_();
  date = date || today;
  if (!ymd_(date)) return { ok: false, error: 'date' };
  if (date > today) return { ok: false, error: 'future', detail: 'The launch date cannot be in the future. Click this on the day the site goes live.' };
  if (period_(date) !== period_(today)) return { ok: false, error: 'month', detail: 'The launch date must be in the current month.' };
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(25000)) return { ok: false, error: 'busy' };
  try {
    var a = billGet_(id);
    if (!a) return { ok: false, error: 'notfound' };
    if (a.launch) return { ok: true, already: true, account: billView_(a), detail: 'Billing was already activated on ' + longDate_(a.launch) + '. Nothing was charged again.' };
    if (a.flags && a.flags.postest) return { ok: false, error: 'test', detail: 'This is the $1 Square app test account. It is never launched.' };
    if (a.status === 'awaiting_card') return { ok: false, error: 'nocard', detail: 'The client has not set up payment yet' + (a.pay === 'once' ? ' or paid the setup fee' : '') + '.' };
    if (a.status !== 'building') return { ok: false, error: 'status' };
    var p = prorate_(a.monthly, date);
    var preview = {
      business: a.business, owner: a.owner, packageName: BILL_TIERS[a.tier].n, optionName: a.pay === 'zero' ? '$0 Down' : 'Pay Upfront', launch: date,
      amount: p.amount, full: p.full, math: p.full ? 'Launch on the 1st: full month' + (a.pay === 'zero' ? ', counts as full payment 1 of 12' : '') : usdC_(a.monthly) + ' ÷ ' + p.dim + ' days × ' + p.rem + ' days',
      firstFull: firstNext_(date), monthly: a.monthly, card: (a.sq.brand || 'Card') + ' ending ' + (a.sq.last4 || '')
    };
    if (!confirm) return { ok: true, preview: preview };
    // Record the launch first, then charge: a second click finds a.launch set and stops above.
    a.launch = date; a.status = 'active';
    if (a.engine === 'sub') {
      // Square subscription bills the 1st. Launch on the 1st: it starts today and Square charges the full month now.
      // Otherwise we charge the exact prorated amount ourselves and the subscription starts on the next 1st.
      billLog_(a, 'Website marked live ' + longDate_(date) + '. Billing activated.');
      var pch = null;
      if (!p.full) { pch = { key: 'prorated', kind: 'prorated', period: period_(date), due: date, amount: p.amount, status: 'new', attempts: 0 }; a.charges.push(pch); }
      billSave_(a);
      if (pch) { billCharge_(a, pch); billAfterCharge_(a, pch, 'This was the launch payment: it was due today (' + longDate_(date) + '), and reminders follow from that date.'); }
      var sr = billSubCreate_(a, p.full ? date : firstNext_(date));
      if (p.full) { Utilities.sleep(2500); billSubSync_(a, billToday_()); }
      billSave_(a);
      var fc = pch || (a.charges || []).filter(function (c) { return c.invoiceId; })[0] || { amount: a.monthly, status: 'pending' };
      return { ok: true, charged: { amount: fc.amount, status: fc.status, error: (fc.error || '') + (sr.ok ? '' : ' Subscription not created yet: ' + sr.detail + ' (the daily check retries).') }, account: billView_(a) };
    }
    var ch = p.full ? { key: 'full-' + period_(date), kind: 'full', launch: true, period: period_(date), due: date, amount: a.monthly, status: 'new', attempts: 0 }
      : { key: 'prorated', kind: 'prorated', period: period_(date), due: date, amount: p.amount, status: 'new', attempts: 0 };
    a.charges.push(ch);
    billLog_(a, 'Website marked live ' + longDate_(date) + '. Billing activated.');
    billSave_(a);
    billCharge_(a, ch);
    billAfterCharge_(a, ch, 'This was the launch payment: it was due today (' + longDate_(date) + '), and reminders follow from that date.');
    billSave_(a);
    return { ok: true, charged: { amount: ch.amount, status: ch.status, error: ch.error || '' }, account: billView_(a) };
  } finally { lock.releaseLock(); }
}
function billRetry_(id) {
  var lock = LockService.getScriptLock(); if (!lock.tryLock(25000)) return { ok: false, error: 'busy' };
  try {
    var a = billGet_(id); if (!a) return { ok: false, error: 'notfound' };
    var out = [];
    (a.charges || []).filter(function (c) { return (c.status === 'failed' || c.status === 'unknown') && !c.invoiceId; }).forEach(function (c) {
      billCharge_(a, c, { sameAttempt: c.status === 'unknown' }); billAfterCharge_(a, c, 'Retried by an owner.'); out.push({ kind: c.kind, amount: c.amount, status: c.status, error: c.error || '' });
    });
    billSave_(a);
    return { ok: true, results: out, account: billView_(a) };
  } finally { lock.releaseLock(); }
}
function billManualPaid_(id, note) {
  var a = billGet_(id); if (!a) return { ok: false, error: 'notfound' };
  if ((a.charges || []).some(function (x) { return x.status === 'failed' && x.invoiceId; }) && !(a.charges || []).some(function (x) { return x.status === 'failed' && !x.invoiceId && x.kind !== 'setup'; }))
    return { ok: false, error: 'invoice', detail: 'This is a Square subscription invoice. Mark it paid in Square (Dashboard > Invoices > the invoice > Mark as paid) so Square stops collecting it; the dashboard updates on the next check.' };
  var c = (a.charges || []).filter(function (x) { return x.status === 'failed' && x.kind !== 'setup' && !x.invoiceId; }).sort(function (x, y) { return x.due < y.due ? -1 : 1; })[0];
  if (!c) return { ok: false, error: 'nothing' };
  c.status = 'paid'; c.manual = true; c.paidAt = new Date().toISOString(); c.error = '';
  billLedger_(a, c, 'Recorded by an owner as paid outside Square: ' + note.slice(0, 200));
  billLog_(a, 'Owner recorded ' + usdC_(c.amount) + ' (' + c.kind + ' ' + (c.period || '') + ') as paid outside Square. ' + note.slice(0, 200));
  billAfterCharge_(a, c);
  billSave_(a);
  return { ok: true, account: billView_(a) };
}
function billCancel_(id, notice, confirm) {
  var a = billGet_(id); if (!a) return { ok: false, error: 'notfound' };
  notice = notice || billToday_();
  if (!ymd_(notice)) return { ok: false, error: 'date' };
  var c = billCounts_(a);
  var inCommit = a.pay === 'zero' && c.full < 12;
  if (inCommit) {
    var left = 12 - c.full;
    var res = { mode: 'review', notice: notice, remaining: left, remainingAmount: left * a.monthly, text: 'Early cancellation during the $0-down commitment: ' + left + ' full payment' + (left === 1 ? '' : 's') + ' (' + usdC_(left * a.monthly) + ') remain under the agreement. Nothing is charged automatically. Billing keeps running monthly until an owner reviews it and decides (keep monthly billing, agree on a payoff with written notice to the client, or end billing).' };
    if (!confirm) return { ok: true, preview: res };
    a.cancel = { mode: 'review', notice: notice, at: new Date().toISOString() };
    billLog_(a, 'Cancellation request received ' + longDate_(notice) + ' (during commitment). Owner review needed.');
    billMailOwner_(a, 'Cancellation request needs review', res.text);
    billSave_(a); return { ok: true, account: billView_(a) };
  }
  var eff = addDays_(notice, 30), fm = finalMonth_(a.monthly, eff);
  var r2 = { mode: 'notice', notice: notice, effective: eff, finalAmount: fm.amount, text: '30 days’ notice: service ends ' + longDate_(eff) + '. Final charge on ' + longDate_(iso_(ymd_(eff).y, ymd_(eff).m, 1)) + ': ' + usdC_(fm.amount) + ' (' + fm.days + ' of ' + fm.dim + ' days). Nothing is charged after that.' };
  if (!confirm) {
    var tmp = JSON.parse(JSON.stringify(a)); tmp.cancel = { mode: 'notice', notice: notice, effective: eff };
    var owed = billRefundDue_(tmp), tot = owed.reduce(function (t, x) { return t + x.amount; }, 0);
    if (tot) { r2.refund = tot; r2.text += ' Square already collected ' + usdC_(tot) + ' for days after ' + longDate_(eff) + '. A refund of ' + usdC_(tot) + ' will be proposed for owner approval; nothing is refunded automatically.'; }
    return { ok: true, preview: r2 };
  }
  a.cancel = { mode: 'notice', notice: notice, effective: eff, at: new Date().toISOString() };
  if (a.launch) a.status = 'canceling';
  billLog_(a, 'Cancellation notice ' + longDate_(notice) + '. Effective ' + longDate_(eff) + '.');
  billRefundCheck_(a);
  billSave_(a); return { ok: true, account: billView_(a) };
}
/* ---------- Cancellation refunds (owner approval required) ----------
   If a payment already collected covers days after the cancellation's effective date (for
   example a notice recorded late, after Square billed the month in full), we work out exactly
   what was overpaid, per payment, and propose a refund. Nothing is refunded until an owner
   approves it. Each payment can have only one refund proposal, and the Square refund uses a
   fixed idempotency key, so the same refund can never be issued twice. */
function billRefundDue_(a) {
  var eff = a.cancel && a.cancel.mode === 'notice' && a.cancel.effective; if (!eff) return [];
  var e = ymd_(eff), pe = period_(eff), out = [];
  (a.charges || []).forEach(function (c) {
    if (c.status !== 'paid' || c.disputed || c.kind === 'setup' || !c.period || c.period < pe) return;
    var y = +c.period.slice(0, 4), m = +c.period.slice(5, 7), dim = dim_(y, m);
    var from = c.kind === 'prorated' && a.launch && period_(a.launch) === c.period ? ymd_(a.launch).d : 1;
    var covered = dim - from + 1, used = c.period > pe ? 0 : Math.max(0, Math.min(e.d, dim) - from + 1);
    if (used >= covered) return; // the payment covers no day after the effective date
    var owed = used ? Math.round(a.monthly * used / dim) : 0;
    var before = typeof c.refunded === 'number' ? c.refunded : 0, ours = (a.refunds || []).filter(function (r) { return r.chargeKey === c.key && r.status === 'done'; })[0];
    if (c.refunded === true && !ours) return; // refunded in Square by hand (amount unknown): owner already handled it
    if (ours) before = Math.max(before, ours.amount);
    var amt = Math.max(0, c.amount - owed - before);
    if (amt > 0) out.push({ key: c.key, paymentId: c.paymentId || '', period: c.period, paid: c.amount, owed: owed, days: used, covered: covered, dim: dim, amount: amt });
  });
  return out;
}
function billRefundCheck_(a) {
  if (!a.cancel || a.cancel.mode !== 'notice') return false;
  a.refunds = a.refunds || [];
  var due = billRefundDue_(a), changed = false, added = [];
  due.forEach(function (d) {
    var id = 'rf-' + d.key, r = a.refunds.filter(function (x) { return x.id === id; })[0];
    if (r && r.status !== 'proposed') return; // approved, sending or done: never proposed again
    if (r) { if (r.amount !== d.amount) { r.amount = d.amount; r.owed = d.owed; r.days = d.days; changed = true; } return; }
    r = { id: id, chargeKey: d.key, paymentId: d.paymentId, period: d.period, paid: d.paid, owed: d.owed, days: d.days, dim: d.dim, amount: d.amount, effective: a.cancel.effective, notice: a.cancel.notice, status: 'proposed', created: new Date().toISOString() };
    a.refunds.push(r); added.push(r); changed = true;
  });
  a.refunds.forEach(function (r) { if (r.status === 'proposed' && !due.some(function (d) { return 'rf-' + d.key === r.id; })) { r.status = 'void'; changed = true; billLog_(a, 'Refund proposal for ' + r.period + ' no longer applies and was withdrawn.'); } });
  if (added.length) {
    var tot = added.reduce(function (t, x) { return t + x.amount; }, 0);
    billLog_(a, 'Refund proposed (owner approval needed): ' + added.map(function (x) { return usdC_(x.amount) + ' of the ' + usdC_(x.paid) + ' ' + x.period + ' payment'; }).join('; ') + '. Service ended ' + longDate_(a.cancel.effective) + '.');
    billMailOwners_(a, 'Refund needs approval: ' + usdC_(tot), billRefundText_(a, added));
  }
  return changed;
}
function billRefundText_(a, list) {
  var paid = (a.charges || []).filter(function (c) { return c.status === 'paid' && c.kind !== 'setup'; }).slice(-4);
  return 'Customer: ' + a.business + ' (' + a.owner + ', ' + a.email + ')\n' +
    'Cancellation notice received: ' + longDate_(a.cancel.notice) + '\nCancellation effective (last day of service): ' + longDate_(a.cancel.effective) + '\n\n' +
    'Payments collected (most recent):\n' + paid.map(function (c) { return '  ' + c.period + '  ' + usdC_(c.amount) + (c.refunded ? ' (refunded ' + (typeof c.refunded === 'number' ? usdC_(c.refunded) : '') + ')' : ''); }).join('\n') + '\n\n' +
    'Proposed refund:\n' + list.map(function (x) { return '  ' + usdC_(x.amount) + ' from the ' + x.period + ' payment of ' + usdC_(x.paid) + ': service used ' + x.days + ' of ' + x.dim + ' days = ' + usdC_(x.owed) + ' owed'; }).join('\n') +
    '\n\nNothing has been refunded. An owner must approve it in /billing (open the account, "Approve refund"). Approved refunds go back to the card through Square.';
}
function billMailOwners_(a, subject, msg) {
  if (a.flags && a.flags.selftest) return;
  var to = [OWNER_EMAIL], u = authUsers_();
  Object.keys(u).forEach(function (k) { var x = u[k]; if (x.role === 'owner' && x.status === 'active' && x.email && to.indexOf(x.email) < 0) to.push(x.email); });
  try {
    MailApp.sendEmail({ to: to.join(','), subject: (billTestMode_(a) ? '[TEST] ' : '') + 'Billing: ' + subject, name: 'Riverbend Billing',
      body: msg + '\n\nOpen billing: https://' + SITE + '/billing/#' + a.id });
  } catch (e) { console.error(e); }
}
function billRefund_(id, rid, confirm, confirmText, who) {
  var lock = LockService.getScriptLock(); if (!lock.tryLock(30000)) return { ok: false, error: 'busy' };
  try {
    var a = billGet_(id); if (!a) return { ok: false, error: 'notfound' };
    var r = (a.refunds || []).filter(function (x) { return x.id === rid; })[0]; if (!r) return { ok: false, error: 'notfound' };
    if (r.status === 'done') return { ok: true, already: true, detail: 'This refund was already issued (' + usdC_(r.amount) + ', Square refund ' + r.sqRefundId + '). Nothing was sent again.', account: billView_(a) };
    if (r.status !== 'proposed' && r.status !== 'sending' && r.status !== 'failed') return { ok: false, error: 'state', detail: 'This refund proposal is ' + r.status + '.' };
    if (r.status === 'proposed') { var cur = billRefundDue_(a).filter(function (d) { return 'rf-' + d.key === r.id; })[0];
      if (!cur || cur.amount !== r.amount) { billRefundCheck_(a); billSave_(a); return { ok: false, error: 'changed', detail: 'The amount owed changed. Review the updated proposal.', account: billView_(a) }; } }
    var c = billFindCharge_(a, r.chargeKey);
    if (!c || !(c.paymentId || r.paymentId)) return { ok: false, error: 'nopayment', detail: 'Square has no payment ID for this charge. Refund it in the Square Dashboard, then record it.' };
    var info = { business: a.business, period: r.period, paid: r.paid, amount: r.amount, effective: r.effective };
    if (!confirm) return { ok: true, preview: info };
    if (confirmText !== 'REFUND') return { ok: false, error: 'confirm' };
    r.status = 'sending'; r.approvedBy = who || ''; r.approvedAt = new Date().toISOString(); r.key = r.key || 'rbrf-' + sha256Hex_(a.id + '|' + r.id).slice(0, 32);
    billSave_(a); // saved before calling Square: a retry reuses the same key, so Square cannot refund twice
    var res = sq_('post', '/v2/refunds', { idempotency_key: r.key, payment_id: c.paymentId || r.paymentId, amount_money: { amount: r.amount, currency: 'USD' }, reason: 'Cancellation effective ' + r.effective + ': service days after that date' }, a.env);
    if (res.ok && res.refund) {
      r.status = 'done'; r.sqRefundId = res.refund.id; r.doneAt = new Date().toISOString();
      c.refunded = (typeof c.refunded === 'number' ? c.refunded : 0) + r.amount;
      billLedger_(a, c, 'Refunded ' + usdC_(r.amount));
      billLog_(a, 'Refund of ' + usdC_(r.amount) + ' on the ' + r.period + ' payment issued through Square (approved by ' + (who || 'an owner') + ').');
      billMailOwners_(a, 'Refund issued: ' + usdC_(r.amount), usdC_(r.amount) + ' was refunded to ' + a.business + "'s card for the days after " + longDate_(r.effective) + ' (approved by ' + (who || 'an owner') + ').');
    } else if (res.network) { r.error = 'No answer from Square. Press Approve again: the same refund request is resent and Square will not refund twice.'; }
    else { r.status = 'failed'; r.error = sqErr_(res); billLog_(a, 'Refund of ' + usdC_(r.amount) + ' failed: ' + r.error); }
    billSave_(a);
    return { ok: r.status === 'done', error: r.status === 'done' ? undefined : 'square', detail: r.status === 'done' ? 'Refunded ' + usdC_(r.amount) + '.' : r.error, account: billView_(a) };
  } finally { lock.releaseLock(); }
}
function billEnd_(id, confirmText) {
  if (confirmText !== 'END BILLING') return { ok: false, error: 'confirm' };
  var a = billGet_(id); if (!a) return { ok: false, error: 'notfound' };
  a.status = 'ended'; billLog_(a, 'Billing ended by an owner. No further automatic charges.');
  if (a.sq.subId && !a.sq.subCanceled) billSubCancel_(a, 'Billing ended by an owner.');
  billSave_(a); return { ok: true, account: billView_(a) };
}
function billFlag_(id, flag, value) {
  var allowed = { paused: 'Billing paused', suspended: 'Non-essential services suspended (owner approved)', noReminders: 'Reminders paused (payment arrangement)' };
  if (!allowed[flag]) return { ok: false, error: 'flag' };
  var a = billGet_(id); if (!a) return { ok: false, error: 'notfound' };
  a.flags[flag] = value; billLog_(a, allowed[flag] + ': ' + (value ? 'on' : 'off') + ' (by an owner).');
  if (flag === 'paused' && a.sq.subId && !a.sq.subCanceled) { var pr = sq_('post', '/v2/subscriptions/' + encodeURIComponent(a.sq.subId) + (value ? '/pause' : '/resume'), value ? {} : { resume_change_timing: 'IMMEDIATE' }, a.env); billLog_(a, 'Square subscription ' + (value ? 'pause' : 'resume') + ': ' + (pr.ok ? 'done' : sqErr_(pr))); }
  billSave_(a); return { ok: true, account: billView_(a) };
}

/* ---------- daily job ---------- */
var BILL_STAGES = [[2, 'remind', true], [4, 'grace', true], [5, 'pastdue', false], [9, 'final', false], [14, 'suspend', false], [30, 'term', false]];
function billTick_(asOf, onlyId) {
  var today = asOf && ymd_(asOf) ? asOf : billToday_();
  var lock = LockService.getScriptLock(); if (!lock.tryLock(60000)) return { ok: false, error: 'busy' };
  var sum = { date: today, env: sqEnv_(), charged: 0, paid: 0, failed: 0, reminders: 0, flagged: 0, refunds: 0, errors: 0 };
  try {
    if (!onlyId) billReconcile_(sum);
    billAll_().forEach(function (a) {
      if (a.env !== sqEnv_() || (onlyId && a.id !== onlyId)) return;
      try {
        var changed = billTickOne_(a, today, sum);
        if (changed) billSave_(a);
      } catch (e) { sum.errors++; console.error(e); }
    });
    if (!onlyId) { try { var vf = billVerify_(); var bad = (vf.accounts || []).filter(function (x) { return !x.ok; }); sum.subProblems = bad.length;
      if (bad.length) MailApp.sendEmail({ to: OWNER_EMAIL, subject: 'Billing: check ' + bad.length + ' Square subscription' + (bad.length > 1 ? 's' : ''), name: 'Riverbend Billing', body: bad.map(function (x) { return x.business + ': ' + x.problems.join('; '); }).join('\n') + '\n\nOpen https://' + SITE + '/billing' }); } catch (ev) { console.error(ev); } }
    if (!onlyId) PropertiesService.getScriptProperties().setProperty('BILL_LAST_TICK', new Date().toISOString() + ' ' + JSON.stringify(sum));
  } finally { lock.releaseLock(); }
  return { ok: true, summary: sum };
}
function billTickOne_(a, today, sum) {
  var changed = false;
  if (a.status === 'awaiting_card' && a.env === 'production') { try { if (billFindSquareCard_(a).changed) changed = true; } catch (e) { console.error(e); } }
  // A. Check charges whose result we did not get (network) or that Square is still processing.
  (a.charges || []).forEach(function (c) {
    if (c.status === 'unknown') { billCharge_(a, c, { sameAttempt: true }); billAfterCharge_(a, c); changed = true; }
    else if (c.status === 'pending' && c.paymentId) {
      var r = sq_('get', '/v2/payments/' + encodeURIComponent(c.paymentId), null, a.env);
      var st = r.payment && r.payment.status;
      if (st === 'COMPLETED') { c.status = 'paid'; c.paidAt = new Date().toISOString(); billLedger_(a, c, 'Cleared'); billAfterCharge_(a, c); changed = true; }
      else if (st === 'FAILED' || st === 'CANCELED') { c.status = 'failed'; c.error = st; billLedger_(a, c); billAfterCharge_(a, c); changed = true; }
    }
  });
  // B (subscriptions). Square charges the 1st; we read its invoices, make sure the subscription exists,
  // and end it before a cancellation's final month (that month is charged prorated below).
  if (a.engine === 'sub' && a.launch && a.status !== 'ended') {
    if (!a.sq.subId) { if (billSubCreate_(a, today.slice(8) === '01' ? today : firstNext_(today)).ok) changed = true; }
    if (a.sq.subId && billSubSync_(a, today)) changed = true;
    if (a.cancel && a.cancel.mode === 'notice' && a.cancel.effective && !a.sq.subCanceled && period_(a.cancel.effective) <= period_(firstNext_(today))) { billSubCancel_(a, 'Cancellation notice: subscription ends before the final (prorated) month.'); changed = true; }
  }
  if (a.cancel && a.cancel.mode === 'notice' && billRefundCheck_(a)) changed = true;
  // B. Monthly charge on (or after) the 1st (our own charge; for subscriptions only the final prorated month).
  if ((a.status === 'active' || a.status === 'canceling') && a.launch && !a.flags.paused && !(a.engine === 'sub' && !(a.cancel && a.cancel.mode === 'notice' && a.cancel.effective && period_(a.cancel.effective) === period_(today)))) {
    var per = period_(today);
    var have = (a.charges || []).some(function (c) { return c.period === per && (c.kind === 'full' || c.kind === 'final' || c.kind === 'prorated'); });
    if (!have && a.launch < per + '-01') {
      var ch = null;
      if (a.cancel && a.cancel.mode === 'notice' && a.cancel.effective) {
        if (a.cancel.effective < per + '-01') { a.status = 'ended'; billLog_(a, 'Cancellation took effect ' + longDate_(a.cancel.effective) + '. Billing ended.'); changed = true; }
        else if (period_(a.cancel.effective) === per && a.engine === 'sub' && today === per + '-01' && !(a.sq.subCancelDate && a.sq.subCancelDate <= today)) { /* Square may still bill this month: wait a day, read its invoice, then decide (no double charge). */ }
        else if (period_(a.cancel.effective) === per) { var fm = finalMonth_(a.monthly, a.cancel.effective); ch = { key: 'final-' + per, kind: 'final', period: per, due: per + '-01', amount: fm.amount, status: 'new', attempts: 0 }; }
      }
      if (!ch && a.status !== 'ended' && a.engine !== 'sub') ch = { key: 'full-' + per, kind: 'full', period: per, due: per + '-01', amount: a.monthly, status: 'new', attempts: 0 };
      if (ch) {
        a.charges.push(ch); billSave_(a); // save first so a crash cannot lead to a second charge
        billCharge_(a, ch); billAfterCharge_(a, ch); sum.charged++; if (ch.status === 'paid') sum.paid++; if (ch.status === 'failed') sum.failed++;
        changed = true;
      }
    }
    if (a.status === 'canceling' && a.cancel && a.cancel.effective && today > a.cancel.effective && !(a.charges || []).some(function (c) { return c.status === 'failed'; })) {
      a.status = 'ended'; billLog_(a, 'Cancellation took effect ' + longDate_(a.cancel.effective) + '. Billing ended.'); changed = true;
    }
  }
  // C. Failed payments: retries on day 2 and 4 (the 3rd and 5th), reminders and flags.
  (a.charges || []).filter(function (c) { return c.status === 'failed' && c.kind !== 'setup'; }).forEach(function (c) {
    var days = dayDiff_(c.due, today);
    c.notices = c.notices || {};
    var due = BILL_STAGES.filter(function (s) { return days >= s[0] && !c.notices[s[1]]; });
    if (!due.length) return;
    var top = due[due.length - 1];
    due.forEach(function (s) { c.notices[s[1]] = 1; });
    changed = true;
    if (top[2] && a.sq.cardId && days <= 5 && !c.invoiceId) {
      billCharge_(a, c);
      if (c.status === 'paid') { billAfterCharge_(a, c); sum.paid++; return; }
    }
    if (a.flags.noReminders) return;
    if (top[1] === 'remind' || top[1] === 'grace') { billMailCustomer_(a, 'remind', c); sum.reminders++; }
    else if (top[1] === 'pastdue') { billMailCustomer_(a, 'pastdue', c); billMailOwner_(a, 'Account past due', usdC_(c.amount) + ' due ' + longDate_(c.due) + ' is now past due. No late fee is added.'); sum.reminders++; }
    else if (top[1] === 'final') { billMailCustomer_(a, 'final', c); sum.reminders++; }
    else if (top[1] === 'suspend') { a.flags.suspendEligible = true; sum.flagged++; billMailOwner_(a, 'Eligible for suspension: approval needed', 'Payment due ' + longDate_(c.due) + ' is ' + days + ' days past due. Non-essential services (maintenance, routine updates, non-emergency support) may be suspended, but only if an owner approves it in /billing. Do not take the website offline or touch the domain.'); }
    else if (top[1] === 'term') { a.flags.termReview = true; sum.flagged++; billMailOwner_(a, '30 days past due: review', 'Payment due ' + longDate_(c.due) + ' is 30 days past due. Under the agreement Riverbend may begin termination only after written notice and a chance to resolve the balance. Nothing happens automatically.'); }
  });
  return changed;
}
/* Refunds and disputes: re-read from Square so refunded or disputed payments stop counting. */
function billReconcile_(sum) {
  var props = PropertiesService.getScriptProperties();
  var since = props.getProperty('BILL_REFUND_SYNC_' + sqEnv_().toUpperCase()) || new Date(Date.now() - 40 * 864e5).toISOString();
  var all = billAll_(), byPay = {};
  all.forEach(function (a) { (a.charges || []).forEach(function (c) { if (c.paymentId) byPay[c.paymentId] = { a: a, c: c }; }); });
  var touched = {};
  var r = sq_('get', '/v2/refunds?begin_time=' + encodeURIComponent(since) + '&limit=100');
  (r.refunds || []).forEach(function (f) {
    var hit = byPay[f.payment_id];
    if (hit && (f.status === 'COMPLETED' || f.status === 'PENDING') && !hit.c.refunded) {
      hit.c.refunded = (f.amount_money || {}).amount || true; billLog_(hit.a, 'Refund of ' + usdC_((f.amount_money || {}).amount) + ' on ' + hit.c.kind + ' ' + (hit.c.period || '') + ' (no longer counts toward the 12 payments).');
      billLedger_(hit.a, hit.c, 'Refunded'); touched[hit.a.id] = hit.a; sum.refunds++;
    }
  });
  var dsp = sq_('get', '/v2/disputes');
  (dsp.disputes || []).forEach(function (x) {
    var pid = x.disputed_payment && x.disputed_payment.payment_id, hit = byPay[pid];
    if (hit && x.state !== 'WON' && !hit.c.disputed) { hit.c.disputed = true; billLog_(hit.a, 'Payment disputed (chargeback). It does not count toward the 12 payments.'); billMailOwner_(hit.a, 'Payment disputed', 'A ' + usdC_(hit.c.amount) + ' payment was disputed by the cardholder. Check Square > Disputes.'); touched[hit.a.id] = hit.a; }
    if (hit && x.state === 'WON' && hit.c.disputed) { hit.c.disputed = false; touched[hit.a.id] = hit.a; }
  });
  Object.keys(touched).forEach(function (k) { billSave_(touched[k]); });
  if (r.ok) props.setProperty('BILL_REFUND_SYNC_' + sqEnv_().toUpperCase(), new Date(Date.now() - 864e5).toISOString());
}
/* Square webhooks are only a nudge: we never trust the message itself, we re-read the
   payment from Square. (Apps Script cannot read the signature header.) The daily job
   catches anything a missed webhook would have told us. */
function billWebhook_(data) {
  try {
    var o = (data.data && data.data.object) || {};
    var inv = o.invoice || {}, subId = inv.subscription_id || (o.subscription && o.subscription.id) || '';
    if (subId) {
      billAll_().filter(function (x) { return x.sq && x.sq.subId === subId; }).forEach(function (x) { if (billSubSync_(x, billToday_())) billSave_(x); });
      return { ok: true };
    }
    var pid = (o.payment && o.payment.id) || (o.refund && o.refund.payment_id) || '';
    if (!/^[A-Za-z0-9]{10,64}$/.test(pid)) return { ok: true };
    var all = billAll_();
    for (var i = 0; i < all.length; i++) {
      var a = all[i], c = (a.charges || []).filter(function (x) { return x.paymentId === pid; })[0];
      if (!c) continue;
      var r = sq_('get', '/v2/payments/' + pid, null, a.env), p = r.payment || {};
      var changed = false;
      if (p.status === 'COMPLETED' && c.status === 'pending') { c.status = 'paid'; c.paidAt = new Date().toISOString(); billAfterCharge_(a, c); changed = true; }
      if ((p.status === 'FAILED' || p.status === 'CANCELED') && c.status !== 'failed') { c.status = 'failed'; c.error = p.status; billAfterCharge_(a, c); changed = true; }
      if (p.refunded_money && p.refunded_money.amount > 0 && !c.refunded) { c.refunded = p.refunded_money.amount; billLog_(a, 'Refund recorded from Square.'); changed = true; }
      if (changed) billSave_(a);
    }
  } catch (e) { console.error(e); }
  return { ok: true };
}

/* ---------- sandbox self-test (test mode only, uses Square's test cards) ---------- */
function billSelfTest_() {
  if (sqEnv_() !== 'sandbox') return { ok: false, error: 'live' };
  if (!sqProp_('TOKEN', 'sandbox')) return { ok: false, error: 'notoken' };
  var out = [], ok = function (name, pass, info) { out.push({ test: name, pass: !!pass, info: info || '' }); };
  var mk = function (plan) {
    var r = billCreateFromAgreement_({ 'Plan Key': plan, 'Business': 'Sandbox Test ' + plan, 'Owner': 'Test Owner', 'Email': OWNER_EMAIL, 'Phone': '(608) 306-0135', 'Signed': 'self-test', 'Plan': plan });
    r.account.flags.selftest = true; billSave_(r.account);
    return r;
  };
  // 1. Pay upfront: card + setup fee
  var u = mk('starter-once');
  var r1 = payCard_(u.account, { consent: true, source: 'cnon:card-nonce-ok' });
  var A = billGet_(u.account.id);
  ok('Upfront: card saved through Square', !!A.sq.cardId, A.sq.brand + ' ' + A.sq.last4);
  ok('Upfront: $499.00 setup fee charged at signing', A.setupPaid && billFindCharge_(A, 'setup').status === 'paid', r1.ok ? '' : r1.detail);
  // 2. $0 down: card, nothing charged
  var z = mk('custom-zero');
  payCard_(z.account, { consent: true, source: 'cnon:card-nonce-ok' });
  var Z = billGet_(z.account.id);
  ok('$0 down: card saved, nothing charged at signing', !!Z.sq.cardId && Z.charges.length === 0 && Z.status === 'building');
  // 3. Launch: prorated charge, duplicate click
  var l1 = billLaunch_(Z.id, billToday_(), true), l2 = billLaunch_(Z.id, billToday_(), true);
  Z = billGet_(Z.id);
  var pr = prorate_(Z.monthly, billToday_());
  ok('Launch: one charge of ' + usdC_(pr.amount) + ' for ' + billToday_(), Z.charges.length === 1 && Z.charges[0].amount === pr.amount && Z.charges[0].status === 'paid', l1.charged && l1.charged.status);
  ok('Launch: second click charged nothing', l2.already === true && Z.charges.length === 1);
  // 4. Square subscription created at launch: starts on the next 1st, right price, card on file
  var sub = Z.sq.subId ? sq_('get', '/v2/subscriptions/' + encodeURIComponent(Z.sq.subId)).subscription : null;
  ok('Square subscription created at launch, billed on the 1st from ' + firstNext_(billToday_()), sub && sub.start_date === firstNext_(billToday_()) && sub.card_id === Z.sq.cardId, sub ? sub.status + ' ' + sub.start_date : 'missing');
  var plans = billPlans_('sandbox'), vr = sub ? sq_('get', '/v2/catalog/object/' + encodeURIComponent(sub.plan_variation_id)).object : null;
  var ph = vr && vr.subscription_plan_variation_data && vr.subscription_plan_variation_data.phases[0];
  ok('Subscription plan: $179.00 monthly, billing day 1, no Square proration', ph && ph.cadence === 'MONTHLY' && ((ph.pricing && ph.pricing.price_money) || ph.recurring_price_money || {}).amount === 17900 && vr.subscription_plan_variation_data.monthly_billing_anchor_date === 1, JSON.stringify(ph || {}).slice(0, 160));
  // 5. A subscription that starts today (launch on the 1st): Square charges the full month right away
  var f = mk('premium-zero');
  payCard_(f.account, { consent: true, source: 'cnon:card-nonce-ok' });
  var F = billGet_(f.account.id);
  F.launch = billToday_(); F.status = 'active'; billSubCreate_(F, billToday_()); billSave_(F);
  var paidNow = false;
  for (var w = 0; w < 6 && !paidNow; w++) { Utilities.sleep(4000); billSubSync_(F, billToday_()); paidNow = (F.charges || []).some(function (c) { return c.invoiceId && c.status === 'paid'; }); }
  billSave_(F);
  ok('Square subscription charged the full $349.00 on its start date and it counts as payment 1 of 12', paidNow && billCounts_(F).full === 1, JSON.stringify((F.charges || []).map(function (c) { return [c.amount, c.status]; })));
  // 6. Declined card is recorded as failed (our own charges: setup fee and prorated launch payment)
  var dcl = { key: 'test-decline', kind: 'full', period: 'test', due: billToday_(), amount: 100, status: 'new', attempts: 0 };
  billCharge_(Z, dcl, { source: 'cnon:card-nonce-declined' });
  ok('Declined card is recorded as failed', dcl.status === 'failed', dcl.error);
  // 7. Refund of a subscription payment stops it from counting
  var pc = (F.charges || []).filter(function (c) { return c.invoiceId && c.paymentId; })[0];
  if (pc) {
    var rf = sq_('post', '/v2/refunds', { idempotency_key: 'rb-test-refund-' + F.id, payment_id: pc.paymentId, amount_money: { amount: pc.amount, currency: 'USD' }, reason: 'Sandbox self-test' });
    ok('Refund of the subscription payment sent to Square sandbox', rf.ok, rf.ok ? '' : sqErr_(rf));
    var gone = false;
    for (var w2 = 0; w2 < 5 && !gone; w2++) { Utilities.sleep(3000); billSubSync_(F, billToday_()); billSave_(F); billReconcile_({ refunds: 0 }); F = billGet_(F.id); gone = billCounts_(F).full === 0; }
    ok('Refunded subscription payment no longer counts toward 12', gone);
  } else ok('Refund of the subscription payment sent to Square sandbox', false, 'no payment id on the invoice');
  // 8. Ending billing cancels the Square subscription
  F.status = 'ended'; billSubCancel_(F, 'Self-test.'); billSave_(F);
  ok('Ending billing cancels the Square subscription', F.sq.subCanceled);
  if (Z.sq.subId && !Z.sq.subCanceled) billSubCancel_(Z, 'Self-test.');
  Z.status = 'ended'; billSave_(Z);
  // clean up: end the test accounts
  [A.id, Z.id, f.account.id].forEach(function (id) { var x = billGet_(id); x.status = 'ended'; x.flags.selftest = true; billLog_(x, 'Sandbox self-test account (ended).'); billSave_(x); });
  return { ok: true, results: out };
}

/* ---------- Square item library (for in-person sales in the Square app) ----------
   billing_catalog: preview (apply:false) or apply the item library changes on the LIVE
   Square account: add the 9 current plan items, hide the old plans from every location
   (past sales keep their history), and match add-on prices to the website. */
var CAT_NEW = [
  ['Starter Website ($0 Down) - Monthly', 10900, 'Starter, $0 down: monthly payment ($109). Normally billed automatically on the 1st; use only for a same-day or manual monthly payment.'],
  ['Starter Website (Pay Upfront) - Setup Fee', 49900, 'Starter, pay upfront: one-time website setup fee ($499). Then $50/mo.'],
  ['Starter Website (Pay Upfront) - Monthly', 5000, 'Starter, pay upfront: monthly service ($50). Normally billed automatically on the 1st.'],
  ['Custom Website ($0 Down) - Monthly', 17900, 'Custom, $0 down: monthly payment ($179). Normally billed automatically on the 1st.'],
  ['Custom Website (Pay Upfront) - Setup Fee', 99900, 'Custom, pay upfront: one-time website setup fee ($999). Then $75/mo.'],
  ['Custom Website (Pay Upfront) - Monthly', 7500, 'Custom, pay upfront: monthly service ($75). Normally billed automatically on the 1st.'],
  ['Premium Website ($0 Down) - Monthly', 34900, 'Premium, $0 down: monthly payment ($349). Normally billed automatically on the 1st.'],
  ['Premium Website (Pay Upfront) - Setup Fee', 249900, 'Premium, pay upfront: one-time website setup fee ($2,499). Then $100/mo.'],
  ['Premium Website (Pay Upfront) - Monthly', 10000, 'Premium, pay upfront: monthly service ($100). Normally billed automatically on the 1st.']
];
var CAT_OLD = /^(Essentials Plan|Essentials Website Setup|Growth Plan|Partner Plan)\b/i;
var CAT_PRICE = [[/^Marketing: QR Menu and Table Tents/i, 7500], [/^Marketing: Email or Text Club/i, 4900], [/^Marketing: Google Business Profile/i, 9900], [/^Marketing: Online Ordering or Reservations Setup/i, 15000]];
function billCatalog_(apply) {
  var env = 'production';
  if (!sqProp_('TOKEN', env)) return { ok: false, error: 'notoken', detail: 'Save the live access token under Live keys first. Saving it does not turn on live payments.' };
  var items = [], cursor = '', guard = 0;
  do {
    var r = sq_('get', '/v2/catalog/list?types=ITEM' + (cursor ? '&cursor=' + encodeURIComponent(cursor) : ''), null, env);
    if (!r.ok) return { ok: false, error: 'square', detail: sqErr_(r) };
    items = items.concat(r.objects || []); cursor = r.cursor || '';
  } while (cursor && ++guard < 20);
  var names = {}; items.forEach(function (o) { names[(o.item_data && o.item_data.name || '').toLowerCase()] = o; });
  var plan = { add: [], hide: [], price: [] }, upserts = [];
  CAT_NEW.forEach(function (n, i) {
    var have = names[n[0].toLowerCase()];
    if (have && !have.item_data.is_archived && have.present_at_all_locations !== false) return;
    plan.add.push(n[0] + ' ' + usdC_(n[1]));
    if (have) { have.item_data.is_archived = false; have.present_at_all_locations = true; upserts.push(have); return; }
    upserts.push({ type: 'ITEM', id: '#rbnew' + i, present_at_all_locations: true, item_data: { name: n[0], description: n[2], variations: [
      { type: 'ITEM_VARIATION', id: '#rbnewv' + i, present_at_all_locations: true, item_variation_data: { name: 'Regular', pricing_type: 'FIXED_PRICING', price_money: { amount: n[1], currency: 'USD' } } }] } });
  });
  items.forEach(function (o) {
    var d = o.item_data || {}, nm = d.name || '';
    if (CAT_OLD.test(nm) && !(d.is_archived) && o.present_at_all_locations !== false) {
      plan.hide.push(nm);
      d.is_archived = true; o.present_at_all_locations = false; o.present_at_location_ids = [];
      (d.variations || []).forEach(function (v) { v.present_at_all_locations = false; v.present_at_location_ids = []; });
      upserts.push(o);
    }
    CAT_PRICE.forEach(function (cp) {
      if (!cp[0].test(nm)) return;
      var changed = false;
      (d.variations || []).forEach(function (v) {
        var vd = v.item_variation_data || {};
        if (vd.price_money && vd.price_money.amount !== cp[1]) { plan.price.push(nm + ': ' + usdC_(vd.price_money.amount) + ' to ' + usdC_(cp[1])); vd.price_money = { amount: cp[1], currency: 'USD' }; changed = true; }
      });
      if (changed && upserts.indexOf(o) < 0) upserts.push(o);
    });
  });
  if (!apply) return { ok: true, plan: plan };
  if (!upserts.length) return { ok: true, plan: plan, done: true };
  upserts.forEach(function (o) { delete o.updated_at; delete o.created_at; (o.item_data && o.item_data.variations || []).forEach(function (v) { delete v.updated_at; delete v.created_at; delete v.item_data; }); });
  var res = sq_('post', '/v2/catalog/batch-upsert', { idempotency_key: Utilities.getUuid(), batches: [{ objects: upserts }] }, env);
  if (!res.ok && /is_archived/i.test(sqErr_(res))) { // older API: hide from all locations without the archive flag
    upserts.forEach(function (o) { if (o.item_data) delete o.item_data.is_archived; });
    res = sq_('post', '/v2/catalog/batch-upsert', { idempotency_key: Utilities.getUuid(), batches: [{ objects: upserts }] }, env);
  }
  if (!res.ok) return { ok: false, error: 'square', detail: sqErr_(res), plan: plan };
  return { ok: true, plan: plan, done: true };
}
/* A setup fee taken in person (Square app, cash, check). The client's /pay page then only
   saves their card for the monthly billing and does not charge the setup fee again. */
function billSetupInPerson_(id, note) {
  var a = billGet_(id); if (!a) return { ok: false, error: 'notfound' };
  if (a.pay !== 'once') return { ok: false, error: 'nosetup' };
  if (a.setupPaid) return { ok: true, account: billView_(a), detail: 'Already paid.' };
  var ch = billFindCharge_(a, 'setup');
  if (!ch) { ch = { key: 'setup', kind: 'setup', due: billToday_(), amount: a.setup, status: 'new', attempts: 0 }; a.charges.push(ch); }
  ch.status = 'paid'; ch.manual = true; ch.paidAt = new Date().toISOString(); ch.error = '';
  a.setupPaid = true;
  billLedger_(a, ch, 'Setup fee taken in person: ' + note.slice(0, 200));
  billLog_(a, 'Setup fee ' + usdC_(a.setup) + ' recorded as paid in person (' + note.slice(0, 200) + '). The payment link now only saves the card.');
  if (a.status === 'awaiting_card' && a.sq.cardId) a.status = 'building';
  billSave_(a);
  return { ok: true, account: billView_(a) };
}

/* ---------- Cards saved in the Square app (in-person sales) ----------
   If the salesman charges the setup fee in the Square app and taps "Save card on file"
   to a customer with the same email (or phone) as the signed agreement, we find that
   card and use it for the monthly billing, and mark the setup fee paid. Runs daily and
   from the "Find card in Square" button. Live mode only (the Square app is live). */
function billDigits_(p) { return String(p || '').replace(/\D/g, '').slice(-10); }
function billFindSquareCard_(a) {
  if (a.env !== 'production' || a.status === 'ended') return { ok: false, error: 'notlive', detail: 'Only for live accounts (the Square app uses your live Square account).' };
  var found = null, cust = null;
  var tryQuery = function (filter) {
    var r = sq_('post', '/v2/customers/search', { limit: 20, query: { filter: filter } }, a.env);
    return (r.customers || []);
  };
  var list = [];
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.email)) list = tryQuery({ email_address: { exact: a.email } });
  if (!list.length && billDigits_(a.phone).length === 10) list = tryQuery({ phone_number: { exact: '+1' + billDigits_(a.phone) } });
  if (a.sq.customerId && !list.some(function (c) { return c.id === a.sq.customerId; })) list.push({ id: a.sq.customerId });
  list.forEach(function (c) {
    var r = sq_('get', '/v2/cards?customer_id=' + encodeURIComponent(c.id) + '&sort_order=DESC', null, a.env);
    (r.cards || []).filter(function (k) { return k.enabled !== false; }).forEach(function (k) {
      if (!found || (k.created_at || '') > (found.created_at || '')) { found = k; cust = c.id; }
    });
  });
  var changed = false;
  if (found && found.id !== a.sq.cardId) {
    a.sq.customerId = cust; a.sq.cardId = found.id; a.sq.brand = String(found.card_brand || '').replace(/_/g, ' '); a.sq.last4 = found.last_4 || ''; a.sq.exp = (found.exp_month || '') + '/' + (found.exp_year || '');
    a.sq.source = 'square-app';
    billLog_(a, 'Card saved in the Square app found: ' + a.sq.brand + ' ending ' + a.sq.last4 + '. It will be used for monthly billing.');
    changed = true;
  }
  // Setup fee rung up in the Square app: a completed payment of the setup amount from this customer.
  if (a.pay === 'once' && !a.setupPaid && a.sq.customerId) {
    var since = new Date(new Date(a.created).getTime() - 2 * 864e5).toISOString();
    var pr = sq_('get', '/v2/payments?begin_time=' + encodeURIComponent(since) + '&limit=100', null, a.env);
    var hit = (pr.payments || []).filter(function (p) { return p.status === 'COMPLETED' && p.customer_id === a.sq.customerId && p.amount_money && p.amount_money.amount >= a.setup && !(p.refunded_money && p.refunded_money.amount); })[0];
    if (hit) {
      var ch = billFindCharge_(a, 'setup');
      if (!ch) { ch = { key: 'setup', kind: 'setup', due: String(hit.created_at || '').slice(0, 10) || billToday_(), amount: a.setup, status: 'new', attempts: 0 }; a.charges.push(ch); }
      ch.status = 'paid'; ch.paymentId = hit.id; ch.paidAt = hit.created_at || new Date().toISOString(); ch.error = ''; ch.inPerson = true;
      a.setupPaid = true; billLedger_(a, ch, 'Setup fee paid in the Square app'); billLog_(a, 'Setup fee ' + usdC_(a.setup) + ' paid in the Square app.');
      changed = true;
    }
  }
  if (a.status === 'awaiting_card' && a.sq.cardId && (a.pay === 'zero' || a.setupPaid)) {
    a.status = 'building'; changed = true;
    billMailOwner_(a, 'Payment set up in the Square app: ' + a.business, (a.pay === 'once' ? 'Setup fee paid. ' : '') + 'Card on file: ' + a.sq.brand + ' ending ' + a.sq.last4 + '. Development can start. Click "Website Live - Activate Billing" in riverbendwebco.com/billing when the site launches.');
  }
  return { ok: true, changed: changed, found: !!found, setupPaid: !!a.setupPaid };
}
function billFindCardAction_(id) {
  var a = billGet_(id); if (!a) return { ok: false, error: 'notfound' };
  var r = billFindSquareCard_(a);
  if (!r.ok) return r;
  if (r.changed) billSave_(a);
  return { ok: true, found: r.found, setupPaid: r.setupPaid, account: billView_(a), detail: r.found ? 'Found the card saved in the Square app.' : 'No saved card found yet. In the Square app, add the customer with the same email or phone as the agreement and tap Save Card.' };
}

/* ---------- Charge in the Square app (Point of Sale API, phones and tablets) ----------
   The /pay page opens the Square app with the amount, a note and the client's Square
   customer already filled in. After the tap and "Save card", Square returns to
   /pay/done/, which calls pay_pos_done: we find the payment and the saved card for this
   customer (billFindSquareCard_). Live Square account only (no sandbox for this API). */
var POS_CALLBACK = 'https://' + SITE + '/pay/done/';
function billEnsureCustomer_(a) {
  if (a.sq.customerId) return a.sq.customerId;
  var found = [];
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.email)) found = sq_('post', '/v2/customers/search', { limit: 5, query: { filter: { email_address: { exact: a.email } } } }, a.env).customers || [];
  if (found.length) { a.sq.customerId = found[0].id; return a.sq.customerId; }
  var c = sq_('post', '/v2/customers', { idempotency_key: ('rb-cust-' + a.id).slice(0, 45), company_name: a.business.slice(0, 100), given_name: a.owner.slice(0, 100),
    email_address: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(a.email) ? a.email : undefined, phone_number: billDigits_(a.phone).length === 10 ? '+1' + billDigits_(a.phone) : undefined, reference_id: a.id }, a.env);
  if (c.ok && c.customer) a.sq.customerId = c.customer.id;
  return a.sq.customerId || '';
}
function payPos_(a) {
  if (a.env !== 'production') return { ok: false, error: 'test', detail: 'The Square app only works in live mode.' };
  if (a.status === 'ended') return { ok: false, error: 'ended' };
  var v = billView_(a), due = (a.pay === 'once' && !a.setupPaid ? a.setup : 0) + v.pastDue;
  if (!due) return { ok: false, error: 'nothingdue', detail: 'Nothing is due today, so there is nothing to charge in the Square app. Use the card form on this page to save the card.' };
  var cust = billEnsureCustomer_(a);
  if (!cust) return { ok: false, error: 'square', detail: 'Could not create the Square customer.' };
  a.posStarted = new Date().toISOString(); billLog_(a, 'Opened the Square app to charge ' + usdC_(due) + '.'); billSave_(a);
  var T = BILL_TIERS[a.tier];
  return { ok: true, pos: { clientId: SQ_APP_IDS.production, customerId: cust, amount: due, locationId: sqLocation_('production'), callback: POS_CALLBACK,
    note: (a.flags.postest ? 'TEST $1 ' : '') + T.n + ' Website (' + (a.pay === 'zero' ? '$0 Down' : 'Pay Upfront') + ') - ' + (a.pay === 'once' && !a.setupPaid ? 'Setup Fee' : 'Past-due balance') + ' - ' + a.business } };
}
function payPosDone_(a) {
  var lock = LockService.getScriptLock(); if (!lock.tryLock(20000)) return { ok: false, error: 'busy' };
  try {
    a = billGet_(a.id);
    var r = billFindSquareCard_(a);
    // a past-due balance paid in the app: mark the oldest failed charges paid up to the amount found
    if (r.changed) billSave_(a);
    return { ok: true, setupPaid: !!a.setupPaid, card: a.sq.cardId ? (a.sq.brand || 'Card') + ' ending ' + (a.sq.last4 || '') : '', info: payInfo_(a) };
  } finally { lock.releaseLock(); }
}
/* $1 live test of the Square app checkout. The account is live but flagged as a test:
   it has a $1.00 "setup fee", is never launched and never billed monthly. */
function billPosTest_() {
  if (!sqProp_('TOKEN', 'production')) return { ok: false, error: 'notoken', detail: 'Save the live access token first.' };
  var key = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, '').slice(0, 48);
  var a = {
    id: 'rb' + Utilities.getUuid().replace(/-/g, '').slice(0, 10), created: new Date().toISOString(), env: 'production',
    business: 'TEST Square App $1', owner: 'Kruz Kitelinger', email: OWNER_EMAIL, phone: '(608) 306-0135',
    tier: 'starter', pay: 'once', monthly: 5000, setup: 100, agreement: { signed: 'test', plan: 'Square app $1 test' },
    payHash: sha256Hex_('pay:' + key), payKey: billPayUrl_(key), status: 'awaiting_card', setupPaid: false,
    sq: {}, launch: '', charges: [], cancel: null, flags: { postest: true, paused: true }, log: []
  };
  billLog_(a, '$1 live test of the Square app checkout. Never launched or billed monthly. Refund the $1 in Square afterward.');
  billSave_(a);
  return { ok: true, url: billPayUrl_(key), id: a.id };
}

/* ---------- Square subscriptions (monthly charges on the 1st) ----------
   One Square subscription plan, "Riverbend Website Service", with a variation per package and
   payment option: MONTHLY, STATIC price, billed on the 1st, no Square proration (we charge the
   exact prorated launch amount ourselves and start the subscription on the next 1st). */
var SUB_KEYS = ['starter-zero', 'starter-once', 'custom-zero', 'custom-once', 'premium-zero', 'premium-once'];
function billPlans_(env) {
  var P = PropertiesService.getScriptProperties(), k = 'SQUARE_PLANS_' + env.toUpperCase();
  var have = {}; try { have = JSON.parse(P.getProperty(k) || '{}'); } catch (e) { have = {}; }
  if (SUB_KEYS.every(function (x) { return have[x]; })) return have;
  var plan = have._plan;
  if (!plan) {
    var r = sq_('post', '/v2/catalog/object', { idempotency_key: Utilities.getUuid(), object: { type: 'SUBSCRIPTION_PLAN', id: '#rbplan', subscription_plan_data: { name: 'Riverbend Website Service' } } }, env);
    if (!r.ok || !r.catalog_object) return { _error: sqErr_(r) };
    plan = have._plan = r.catalog_object.id; P.setProperty(k, JSON.stringify(have));
  }
  var objs = [];
  SUB_KEYS.forEach(function (key, i) {
    if (have[key]) return;
    var t = key.split('-'), T = BILL_TIERS[t[0]], amt = t[1] === 'zero' ? T.zero : T.care;
    objs.push({ type: 'SUBSCRIPTION_PLAN_VARIATION', id: '#rbvar' + i, subscription_plan_variation_data: {
      name: T.n + ' Website (' + (t[1] === 'zero' ? '$0 Down' : 'Pay Upfront') + ') - Monthly', subscription_plan_id: plan, monthly_billing_anchor_date: 1, can_prorate: false,
      phases: [{ cadence: 'MONTHLY', ordinal: 0, pricing: { type: 'STATIC', price_money: { amount: amt, currency: 'USD' } } }] } });
  });
  var b = sq_('post', '/v2/catalog/batch-upsert', { idempotency_key: Utilities.getUuid(), batches: [{ objects: objs }] }, env);
  if (!b.ok) return { _error: sqErr_(b) };
  (b.id_mappings || []).forEach(function (m) { var i = +String(m.client_object_id).replace('#rbvar', ''); var key = SUB_KEYS.filter(function (x, j) { return j === i; })[0]; if (key) have[key] = m.object_id; });
  P.setProperty(k, JSON.stringify(have));
  return have;
}
function billSubCreate_(a, start) {
  if (a.sq.subId) return { ok: true };
  if (!a.sq.cardId || !a.sq.customerId) return { ok: false, detail: 'no saved card' };
  var plans = billPlans_(a.env);
  var varId = plans[a.tier + '-' + a.pay];
  if (!varId) { billLog_(a, 'Square subscription plan missing: ' + (plans._error || '')); return { ok: false, detail: plans._error || 'plan missing' }; }
  a.sq.subTries = (a.sq.subTries || 0) + 1;
  var r = sq_('post', '/v2/subscriptions', { idempotency_key: ('rb-sub-' + a.id + '-' + a.sq.subTries).slice(0, 45), location_id: sqLocation_(a.env), plan_variation_id: varId,
    customer_id: a.sq.customerId, card_id: a.sq.cardId, start_date: start, timezone: BILL_TZ, source: { name: 'Riverbend Billing' } }, a.env);
  if (!r.ok || !r.subscription) {
    if (r.network) a.sq.subTries--; // same key next time: Square returns the first result
    billLog_(a, 'Square subscription not created: ' + sqErr_(r));
    billMailOwner_(a, 'Subscription not created: ' + a.business, 'Square did not create the monthly subscription (' + sqErr_(r) + '). The daily check retries automatically.');
    return { ok: false, detail: sqErr_(r) };
  }
  var sub = r.subscription;
  a.sq.subId = sub.id; a.sq.subStatus = sub.status; a.sq.subStart = sub.start_date || start;
  billLog_(a, 'Square subscription created: ' + usdC_(a.monthly) + ' on the 1st, first charge ' + longDate_(a.sq.subStart) + ' (' + sub.status + ').');
  if (sub.start_date && sub.start_date !== start) billMailOwner_(a, 'Check subscription start date', 'Asked Square to start the subscription on ' + start + ' but Square stored ' + sub.start_date + '. Check it in Square > Subscriptions.');
  return { ok: true };
}
function billSubCancel_(a, why) {
  var r = sq_('post', '/v2/subscriptions/' + encodeURIComponent(a.sq.subId) + '/cancel', {}, a.env);
  if (r.ok || /already/i.test(sqErr_(r))) { a.sq.subCanceled = true; a.sq.subCancelDate = (r.subscription && r.subscription.canceled_date) || ''; }
  billLog_(a, 'Square subscription cancel: ' + (r.ok ? 'done' + (a.sq.subCancelDate ? ', last billed period ends ' + longDate_(a.sq.subCancelDate) : '') : sqErr_(r)) + '. ' + (why || ''));
  return r.ok;
}
function billSubSetCard_(a) {
  var g = sq_('get', '/v2/subscriptions/' + encodeURIComponent(a.sq.subId), null, a.env);
  var r = sq_('put', '/v2/subscriptions/' + encodeURIComponent(a.sq.subId), { subscription: { card_id: a.sq.cardId, version: g.subscription && g.subscription.version } }, a.env);
  billLog_(a, 'Square subscription card updated: ' + (r.ok ? a.sq.brand + ' ending ' + a.sq.last4 : sqErr_(r)) + '. Open invoices are paid from Square\'s invoice link.');
}
/* Read the subscription's invoices from Square and mirror them as charges (paid, failed, refunded). */
function billSubSync_(a, today) {
  var changed = false, loc = sqLocation_(a.env);
  var g = sq_('get', '/v2/subscriptions/' + encodeURIComponent(a.sq.subId), null, a.env);
  if (g.subscription) { if (a.sq.subStatus !== g.subscription.status) { a.sq.subStatus = g.subscription.status; changed = true; } }
  var r = sq_('post', '/v2/invoices/search', { limit: 100, query: { filter: { location_ids: [loc], customer_ids: [a.sq.customerId] }, sort: { field: 'INVOICE_SORT_DATE', order: 'DESC' } } }, a.env);
  (r.invoices || []).filter(function (v) { return v.subscription_id === a.sq.subId; }).forEach(function (v) {
    var pr = (v.payment_requests || [])[0] || {}, due = pr.due_date || String(v.created_at || today).slice(0, 10);
    var amt = (pr.computed_amount_money || {}).amount || a.monthly, done = (pr.total_completed_amount_money || {}).amount || 0;
    var st = v.status === 'PAID' || v.status === 'REFUNDED' || v.status === 'PARTIALLY_REFUNDED' || (done && done >= amt) ? 'paid'
      : v.status === 'CANCELED' ? 'canceled' : (v.status === 'FAILED' || (v.status === 'UNPAID' && due <= today)) ? 'failed' : 'pending';
    var key = 'inv-' + v.id, c = billFindCharge_(a, key);
    if (!c) { c = { key: key, kind: 'full', period: due.slice(0, 7), due: due, amount: amt, status: 'new', attempts: 1, invoiceId: v.id }; a.charges.push(c); changed = true; }
    c.invoiceUrl = v.public_url || c.invoiceUrl || '';
    var refunded = v.status === 'REFUNDED' || v.status === 'PARTIALLY_REFUNDED';
    if (refunded && !c.refunded) { c.refunded = true; billLog_(a, 'Refund on the ' + c.period + ' payment (no longer counts toward the 12).'); changed = true; }
    if (c.status !== st) {
      var was = c.status; c.status = st; changed = true;
      if (st === 'paid') {
        c.paidAt = new Date().toISOString(); c.error = '';
        if (!c.paymentId && v.order_id) { var o = sq_('get', '/v2/orders/' + encodeURIComponent(v.order_id), null, a.env); var tn = ((o.order || {}).tenders || [])[0]; if (tn) c.paymentId = tn.payment_id || tn.id; }
        billLedger_(a, c, 'Square subscription invoice paid'); billLog_(a, 'Monthly payment ' + usdC_(c.amount) + ' (' + c.period + ') paid through the Square subscription.');
        billAfterCharge_(a, c);
      } else if (st === 'failed') {
        c.error = 'Square could not charge the card; Square emailed the client an invoice to pay.';
        billLedger_(a, c); billLog_(a, 'Monthly payment ' + usdC_(c.amount) + ' (' + c.period + ') failed. Square emailed the invoice.');
        c.notices = c.notices || {}; c.notices.d0 = 1;
        billMailCustomer_(a, 'failed', c); // agreement: client emailed right away (Square also emails its invoice)
        billMailOwner_(a, 'Payment failed: ' + a.business, 'The ' + usdC_(c.amount) + ' monthly payment due ' + longDate_(due) + ' did not go through. Square emailed the client an invoice to pay' + (c.invoiceUrl ? ' (' + c.invoiceUrl + ')' : '') + '. Reminders follow the agreement schedule.');
      } else if (was === 'new') billLedger_(a, c, 'Square subscription invoice ' + v.status);
    }
  });
  return changed;
}

/* ---------- Signed agreement PDF (emailed to the client and to Riverbend) ----------
   The agreement wording lives in apps-script/agreement.html (same text as the website and the
   lawyer PDF). We fill in the client's plan, details, scope and signature and convert to PDF. */
var AGREEMENT_URL = 'https://' + SITE + '/apps-script/agreement.html';
function agreementTemplate_() {
  var c = CacheService.getScriptCache(), t = c.get('rb_agreement_tpl');
  if (t) return t;
  var r = UrlFetchApp.fetch(AGREEMENT_URL + '?t=' + Date.now(), { muteHttpExceptions: true });
  t = r.getResponseCode() === 200 ? r.getContentText() : '';
  if (t.indexOf('{{SIGNATURES}}') < 0) throw new Error('agreement template missing');
  if (t.length < 95000) c.put('rb_agreement_tpl', t, 3600);
  return t;
}
function agreementPdf_(f, file) {
  var e = function (k) { return String(f[k] || ''); }; // already HTML-escaped by clean_
  var row = function (k, v) { return v ? '<tr><td>' + k + '</td><td>' + v + '</td></tr>' : ''; };
  var pk = billPlanKey_(unesc_(e('Plan Key')));
  var sched = 'Not selected';
  if (pk) {
    var T = BILL_TIERS[pk.tier], mo = pk.pay === 'zero' ? T.zero : T.care;
    sched = pk.pay === 'zero'
      ? '$0 at signing. At launch, a prorated charge of ' + usdC_(mo) + ' ÷ days in that month × days remaining (counting launch day); a launch on the 1st is charged ' + usdC_(mo) + ' once. Then 12 full monthly payments of ' + usdC_(mo) + ' on the 1st of each month beginning the 1st after launch, then month-to-month.'
      : usdC_(T.once) + ' setup fee at signing. At launch, a prorated charge of ' + usdC_(mo) + ' ÷ days in that month × days remaining (counting launch day); a launch on the 1st is charged ' + usdC_(mo) + ' once. Then ' + usdC_(mo) + ' on the 1st of each month, month-to-month.';
  }
  var scope = Object.keys(f).filter(function (k) { return /^Scope: /.test(k) && f[k]; }).map(function (k) { return row(k.replace(/^Scope: /, ''), e(k)); }).join('');
  var sigImg = file && file.blob && /^image\/(png|jpeg)$/.test(file.blob.getContentType()) ? '<img src="data:' + file.blob.getContentType() + ';base64,' + Utilities.base64Encode(file.blob.getBytes()) + '" alt="Signature">' : '';
  var html = agreementTemplate_()
    .replace('{{DATE}}', e('Signed'))
    .replace('{{PLAN}}', e('Plan'))
    .replace('{{SCHEDULE}}', sched)
    .replace('{{SCOPE}}', scope ? '<table class="kv">' + scope + '</table>' : '<p>No scope details were entered at signing.</p>')
    .replace('{{CLIENT}}', '<table class="kv">' + row('Business', e('Business')) + row('Owner / manager', e('Owner')) + row('Phone', e('Phone')) + row('Email', e('Email')) + '</table>')
    .replace('{{SIGNATURES}}', '<table class="kv sig">' + row('Client signature', (sigImg || '') + '<div>' + e('Signature') + '</div>') + row('Signed by', e('Owner') + ' for ' + e('Business')) + row('Signed electronically', e('Signed') + ' on ' + SITE) + row('Riverbend Web Co.', 'Kruz Kitelinger and Rayald Ally, Co-Owners') + '</table>');
  var name = 'Riverbend-Service-Agreement-' + (unesc_(e('Business')).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'Client') + '.pdf';
  var pdf = Utilities.newBlob(html, 'text/html', 'agreement.html').getAs('application/pdf').setName(name);
  try { folder_('Signed Agreements').createFile(pdf.copyBlob().setName(name)); } catch (e2) { console.error(e2); }
  return pdf;
}
function agreementToClient_(f, pdf) {
  var to = unesc_(String(f['Email'] || '')), biz = unesc_(String(f['Business'] || ''));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(to)) return;
  var test = /^test\b/i.test(biz);
  MailApp.sendEmail({ to: test ? OWNER_EMAIL : to, subject: (test ? '[TEST to ' + to + '] ' : '') + 'Your signed Riverbend Web Co. service agreement', name: 'Riverbend Web Co.', replyTo: OWNER_EMAIL,
    body: 'Hi ' + first_(unesc_(String(f['Owner'] || ''))) + ',\n\nThank you for choosing Riverbend Web Co. Your signed service agreement is attached as a PDF for your records.\n\nPlan: ' + unesc_(String(f['Plan'] || '')) + '\nSigned: ' + unesc_(String(f['Signed'] || '')) + '\n\nQuestions? Call or text (608) 306-0135 or reply to this email.\n\nRiverbend Web Co.\nDubuque, Iowa',
    attachments: [pdf] });
}

/* ---------- Owner-only billing login (separate from the Studio password) ----------
   The password is generated on the server and emailed only to the owner inbox. Only a salted
   hash is stored (Script Properties). "Email me a new password" on /billing replaces it. */
var BILL_TOKEN_TTL = 2 * 60 * 60;
function billPwReset_() {
  var c = CacheService.getScriptCache();
  if (c.get('rb_bpw_reset')) return { ok: false, error: 'wait', detail: 'A new password was emailed in the last 10 minutes. Check ' + OWNER_EMAIL + '.' };
  c.put('rb_bpw_reset', '1', 600);
  var words = ['river', 'bluff', 'harbor', 'maple', 'cedar', 'granite', 'prairie', 'lantern', 'anchor', 'summit', 'willow', 'copper', 'meadow', 'falcon', 'timber', 'canyon'];
  var b = Utilities.getUuid().replace(/-/g, '');
  var pick = function (i) { return words[parseInt(b.substr(i * 2, 2), 16) % words.length]; };
  var pw = pick(0) + '-' + pick(1) + '-' + pick(2) + '-' + parseInt(b.substr(8, 4), 16) % 9000 + 1000 + '-' + pick(3);
  var salt = Utilities.getUuid().replace(/-/g, '');
  var P = PropertiesService.getScriptProperties();
  P.setProperty('BILLING_PW_SALT', salt); P.setProperty('BILLING_PW_HASH', sha256Hex_(salt + pw));
  P.setProperty('BILLING_PW_GEN', String(Number(P.getProperty('BILLING_PW_GEN') || 0) + 1)); // signs out old sessions
  MailApp.sendEmail({ to: OWNER_EMAIL, subject: 'Your Riverbend billing password', name: 'Riverbend Billing',
    body: 'Billing dashboard password (owners only, not the Studio password):\n\n' + pw + '\n\nLog in at https://' + SITE + '/billing\nKeep it private. To change it, click "Email me a new password" on the login page.' });
  billAudit_({ action: 'billing_password_emailed' }, { ok: true });
  return { ok: true, detail: 'A new billing password was emailed to ' + OWNER_EMAIL + '.' };
}
function billLogin_(pw) {
  var c = CacheService.getScriptCache(), P = PropertiesService.getScriptProperties();
  var fails = Number(c.get('rb_bfail') || 0);
  if (fails >= 6) return { ok: false, error: 'locked' };
  var hash = P.getProperty('BILLING_PW_HASH');
  if (!hash) return { ok: false, error: 'nopassword', detail: 'No billing password yet. Click "Email me a new password".' };
  var ok = !!pw && sameHex_(sha256Hex_(P.getProperty('BILLING_PW_SALT') + pw), hash);
  billAudit_({ action: 'billing_login' }, { ok: ok });
  if (!ok) { c.put('rb_bfail', String(fails + 1), 900); Utilities.sleep(600); return { ok: false, error: 'badpassword' }; }
  c.remove('rb_bfail');
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  c.put('btok_' + token, P.getProperty('BILLING_PW_GEN') || '1', BILL_TOKEN_TTL);
  return { ok: true, token: token };
}
function billAuthed_(token) {
  if (!token || !/^[a-f0-9]{64}$/.test(String(token))) return false;
  var c = CacheService.getScriptCache(), v = c.get('btok_' + token);
  if (!v || v !== (PropertiesService.getScriptProperties().getProperty('BILLING_PW_GEN') || '1')) return false;
  c.put('btok_' + token, v, BILL_TOKEN_TTL);
  return true;
}
/* Activity log: every billing action that changes something, plus logins (never passwords or keys). */
var BILL_READONLY = { billing_list: 1, billing_get: 1, billing_verify: 1, billing_logout: 1 };
function billAudit_(d, res) {
  if (BILL_READONLY[d.action]) return;
  try {
    var ss = ss_(), sh = ss.getSheetByName('Billing Activity');
    if (!sh) { sh = ss.insertSheet('Billing Activity'); sh.appendRow(['Time', 'Action', 'Account', 'Details', 'Result']); sh.setFrozenRows(1); sh.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#0F172A').setFontColor('#FFFFFF'); }
    var det = ['date', 'flag', 'value', 'mode', 'target', 'apply', 'confirm', 'note'].filter(function (k) { return d[k] !== undefined && d[k] !== ''; }).map(function (k) { return k + '=' + String(d[k]).slice(0, 80); });
    if (d.sqToken) det.push('Square key saved (not logged)');
    var who = d.action === 'billing_tick' && d.token && CacheService.getScriptCache().get('bot_' + d.token) ? 'daily job' : '';
    if (d._who && !who) who = d._who;
    sh.appendRow([new Date(), d.action + (who ? ' (' + who + ')' : ''), String(d.id || ''), det.join(', '), res && res.ok ? 'ok' : 'error: ' + ((res && (res.error || res.detail)) || '')]);
  } catch (e) { console.error(e); }
}
/* ---------- Subscription check: price, card, billing day, no extra charges ---------- */
function billVerify_() {
  var out = [], vars = {};
  billAll_().forEach(function (a) {
    if (a.engine !== 'sub' || !a.launch || a.flags.selftest || a.flags.postest) return;
    var probs = [], T = BILL_TIERS[a.tier], want = a.pay === 'zero' ? T.zero : T.care;
    if (want !== a.monthly) probs.push('account monthly ' + usdC_(a.monthly) + ' does not match the ' + T.n + ' price ' + usdC_(want));
    if (a.status !== 'ended' && !a.sq.subId) probs.push('no Square subscription');
    if (a.sq.subId) {
      var sub = sq_('get', '/v2/subscriptions/' + encodeURIComponent(a.sq.subId), null, a.env).subscription;
      if (!sub) probs.push('Square subscription not found');
      else {
        if (!vars[sub.plan_variation_id]) vars[sub.plan_variation_id] = sq_('get', '/v2/catalog/object/' + encodeURIComponent(sub.plan_variation_id), null, a.env).object || {};
        var vd = vars[sub.plan_variation_id].subscription_plan_variation_data || {}, ph = (vd.phases || [])[0] || {};
        var price = sub.price_override_money ? sub.price_override_money.amount : ((ph.pricing || {}).price_money || (ph.pricing || {}).price || ph.recurring_price_money || {}).amount;
        if (price !== want) probs.push('Square price ' + usdC_(price) + ', expected ' + usdC_(want));
        if (ph.cadence !== 'MONTHLY') probs.push('not monthly');
        if ((sub.monthly_billing_anchor_date || vd.monthly_billing_anchor_date) !== 1) probs.push('billing day is not the 1st');
        if (String(sub.start_date || '').slice(8) !== '01' && sub.start_date !== a.launch) probs.push('starts ' + sub.start_date + ', not on a 1st');
        if (a.status !== 'ended' && !a.sq.subCanceled && ['ACTIVE', 'PENDING'].indexOf(sub.status) < 0) probs.push('Square status ' + sub.status);
        if (sub.card_id !== a.sq.cardId) probs.push('Square subscription uses a different card than the one on file');
        var card = sub.card_id ? sq_('get', '/v2/cards/' + encodeURIComponent(sub.card_id), null, a.env).card : null;
        if (!card || card.enabled === false) probs.push('saved card missing or disabled');
      }
    }
    var per = {};
    (a.charges || []).forEach(function (c) { if (c.status === 'paid' && !c.refunded && c.kind !== 'setup' && c.period) per[c.period] = (per[c.period] || 0) + 1; });
    Object.keys(per).forEach(function (k) { if (per[k] > 1) probs.push('more than one payment for ' + k); });
    (a.charges || []).forEach(function (c) { if (c.invoiceId && c.amount !== want && c.status !== 'canceled') probs.push('Square invoice for ' + c.period + ' is ' + usdC_(c.amount)); });
    out.push({ id: a.id, business: a.business, ok: !probs.length, problems: probs });
  });
  return { ok: true, accounts: out };
}

/* =====================================================================
   ACCOUNTS: individual logins with roles (owner, sales)
   - Passwords: the browser stretches the password with PBKDF2-SHA256 (600,000 rounds, WebCrypto)
     using a unique random per-user salt; the server then stores SHA-256(unique server salt +
     that result). The plain password never leaves the device; only salted hashes are stored.
   - Owners must use an authenticator app (TOTP, RFC 6238) plus 8 one-time recovery codes.
   - Sessions: random 256-bit tokens; only their SHA-256 is stored (Script Properties) with an
     expiry (12 hours, or 30 days on a trusted device). Password reset or role change ends them.
   - Setup and reset links: random one-time tokens, stored hashed, 72 h / 1 h expiry.
   - Every action is checked here on the server against the role (AUTH_PERMS).
   - Users live in Script Properties (AUTH_USERS), readable only by the script owner.
   ===================================================================== */
var AUTH_ROLES = { owner: 'Owner', sales: 'Salesperson' };
var AUTH_SESSION_MS = 12 * 3600 * 1000, AUTH_TRUST_MS = 30 * 864e5, AUTH_SETUP_MS = 72 * 3600 * 1000, AUTH_RESET_MS = 3600 * 1000;
/* Emails allowed to self-start setup (stored as SHA-256 so the public file has no addresses).
   auth_bootstrap emails each one a setup link if the account does not exist yet. */
var AUTH_SEED = [
  { h: 'abe61860f06efe26034fedaca85afba9e3341e07ca8d2d90980960ba4ba9d818', n: 'Kruz Kitelinger', r: 'owner' },
  { h: 'd0b3e44b09b0f60236fe183a733e85fa4fbd3fa0c38333314cfdf1ac8fd94665', n: 'Rayald Ally', r: 'owner' },
  { h: 'faa43f33df3c63840f5072e806cb39b91db17dc4984acf0cf7447b08c9ce04dd', n: 'Owen Seffrood', r: 'sales' }
];
var AUTH_SALES_OK = { list: 1, get: 1, save: 1, delete: 1, status: 1, scan: 1, image: 1, logout: 1,
  leads_status: 1, leads_find: 1, leads_verify: 1, leads_saved: 1, leads_save: 1, leads_update: 1, leads_demo: 1, sales_customers: 1 };

function authProps_() { return PropertiesService.getScriptProperties(); }
function authUsers_() { try { return JSON.parse(authProps_().getProperty('AUTH_USERS') || '{}'); } catch (e) { return {}; } }
function authSaveUsers_(u) { authProps_().setProperty('AUTH_USERS', JSON.stringify(u)); }
function authRand_() { return (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g, ''); }
function authKey_() { var p = authProps_(), k = p.getProperty('AUTH_KEY'); if (!k) { k = authRand_(); p.setProperty('AUTH_KEY', k); } return k; }
function authEmail_(e) { e = String(e || '').trim().toLowerCase(); return /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,}$/.test(e) ? e : ''; }
function authLegacyOn_() { return authProps_().getProperty('AUTH_LEGACY_OFF') !== '1'; }
function authHex_(s) { return /^[a-f0-9]{64}$/.test(String(s || '')); }

/* ---- sessions ---- */
function authNewSession_(u, trusted) {
  var t = authRand_(), now = Date.now();
  authProps_().setProperty('AUTH_S_' + sha256Hex_('s:' + t), JSON.stringify({ e: u.email, x: now + (trusted ? AUTH_TRUST_MS : AUTH_SESSION_MS), g: u.gen || 1, t: !!trusted }));
  authCleanSessions_();
  return t;
}
function authSession_(token) {
  if (!authHex_(token)) return null;
  var k = 'AUTH_S_' + sha256Hex_('s:' + token), raw = authProps_().getProperty(k);
  if (!raw) return null;
  var s; try { s = JSON.parse(raw); } catch (e) { return null; }
  var u = authUsers_()[s.e];
  if (!u || u.status !== 'active' || (u.gen || 1) !== s.g || s.x < Date.now()) { authProps_().deleteProperty(k); return null; }
  return u;
}
function authCleanSessions_() {
  var p = authProps_(), all = p.getProperties(), now = Date.now();
  Object.keys(all).forEach(function (k) { if (k.indexOf('AUTH_S_') === 0) { try { if (JSON.parse(all[k]).x < now) p.deleteProperty(k); } catch (e) { p.deleteProperty(k); } } });
}
function authEndSessions_(u) { u.gen = (u.gen || 1) + 1; }

/* ---- TOTP (RFC 6238, SHA-1, 6 digits, 30 s) ---- */
var B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function b32enc_(bytes) { var bits = '', out = ''; bytes.forEach(function (b) { bits += ('00000000' + (b & 255).toString(2)).slice(-8); }); for (var i = 0; i + 5 <= bits.length; i += 5) out += B32[parseInt(bits.substr(i, 5), 2)]; return out; }
function b32dec_(s) { var bits = ''; String(s).replace(/=+$/, '').toUpperCase().split('').forEach(function (c) { var v = B32.indexOf(c); if (v >= 0) bits += ('00000' + v.toString(2)).slice(-5); }); var out = []; for (var i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.substr(i, 8), 2) > 127 ? parseInt(bits.substr(i, 8), 2) - 256 : parseInt(bits.substr(i, 8), 2)); return out; }
function totpAt_(secret, counter) {
  var msg = []; for (var i = 7; i >= 0; i--) { var b = Math.floor(counter / Math.pow(256, i)) % 256; msg.push(b > 127 ? b - 256 : b); }
  var h = Utilities.computeHmacSignature(Utilities.MacAlgorithm.HMAC_SHA_1, msg, b32dec_(secret)).map(function (x) { return x & 255; });
  var o = h[19] & 15, n = ((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return ('000000' + (n % 1000000)).slice(-6);
}
function totpCheck_(u, code) {
  code = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(code) || !u.totp) return false;
  var now = Math.floor(Date.now() / 30000);
  for (var w = -1; w <= 1; w++) if (now + w > (u.totpLast || 0) && totpAt_(u.totp, now + w) === code) { u.totpLast = now + w; return true; }
  return false;
}

/* ---- public actions ---- */
function auth_(d) {
  var c = CacheService.getScriptCache(), n = Number(c.get('auth_rate') || 0);
  if (n > 120) return { ok: false, error: 'busy' }; c.put('auth_rate', String(n + 1), 60);
  switch (d.action) {
    case 'auth_config': return { ok: true, legacy: authLegacyOn_(), roles: AUTH_ROLES };
    case 'auth_prelogin': return authPrelogin_(d);
    case 'auth_login': return authLogin_(d);
    case 'auth_mfa_enroll': return authMfaEnroll_(d);
    case 'auth_me': var u = authSession_(d.token); return u ? { ok: true, user: authPublic_(u), legacy: authLegacyOn_() } : { ok: false, error: 'auth' };
    case 'auth_logout': if (authHex_(d.token)) authProps_().deleteProperty('AUTH_S_' + sha256Hex_('s:' + d.token)); return { ok: true };
    case 'auth_logout_all': var lu = authSession_(d.token); if (!lu) return { ok: false, error: 'auth' }; var us = authUsers_(); authEndSessions_(us[lu.email]); authSaveUsers_(us); authLog_(lu, 'signed out on all devices'); return { ok: true };
    case 'auth_link_info': return authLinkInfo_(d);
    case 'auth_set_password': return authSetPassword_(d);
    case 'auth_reset_request': return authResetRequest_(d);
    case 'auth_bootstrap': return authBootstrap_(d);
  }
  return { ok: false, error: 'unknown' };
}
function authPublic_(u) { return { email: u.email, name: u.name, role: u.role, roleName: AUTH_ROLES[u.role], mfa: !!u.totpOn }; }
function authPrelogin_(d) {
  var e = authEmail_(d.email), u = e && authUsers_()[e];
  // Unknown emails get a stable fake salt so the answer does not reveal who has an account.
  return { ok: true, salt: u && u.cSalt ? u.cSalt : sha256Hex_('fake:' + authKey_() + ':' + e).slice(0, 32) };
}
function authLogin_(d) {
  var e = authEmail_(d.email), users = authUsers_(), u = users[e];
  var c = CacheService.getScriptCache(), fk = 'auth_fail_' + sha256Hex_(e || 'x').slice(0, 16), fails = Number(c.get(fk) || 0);
  if (fails >= 6) return { ok: false, error: 'locked' };
  var good = u && u.status === 'active' && u.hash && authHex_(d.dk) && sameHex_(sha256Hex_(u.sSalt + d.dk), u.hash);
  if (!good) { c.put(fk, String(fails + 1), 900); Utilities.sleep(500); if (u) authLog_(u, 'failed sign-in (password)'); return { ok: false, error: 'badlogin' }; }
  if (u.role === 'owner') {
    if (!u.totpOn) {
      // First owner sign-in: set up the authenticator before any session is created.
      if (!u.totpPending) { u.totpPending = b32enc_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, authRand_()).slice(0, 20)); authSaveUsers_(users); }
      var pt = authRand_(); c.put('auth_pend_' + sha256Hex_(pt), e, 900);
      return { ok: true, step: 'mfa_enroll', pending: pt, secret: u.totpPending, uri: 'otpauth://totp/' + encodeURIComponent('Riverbend Web Co.:' + u.email) + '?secret=' + u.totpPending + '&issuer=' + encodeURIComponent('Riverbend Web Co.') + '&algorithm=SHA1&digits=6&period=30' };
    }
    var mfaOk = false;
    if (d.code) mfaOk = totpCheck_(u, d.code);
    else if (d.recovery) {
      var rc = String(d.recovery).toLowerCase().replace(/[^a-z0-9]/g, ''), hit = (u.recovery || []).indexOf(sha256Hex_(u.rSalt + 'rc:' + rc));
      if (hit >= 0) { u.recovery.splice(hit, 1); mfaOk = true; authLog_(u, 'used a recovery code (' + u.recovery.length + ' left)'); }
    } else return { ok: true, step: 'mfa' };
    if (!mfaOk) { c.put(fk, String(fails + 1), 900); authSaveUsers_(users); authLog_(u, 'failed sign-in (code)'); return { ok: false, error: 'badcode' }; }
  }
  c.remove(fk);
  u.lastLogin = new Date().toISOString(); authSaveUsers_(users);
  authLog_(u, 'signed in' + (d.trust ? ' (trusted device, 30 days)' : ''));
  return { ok: true, token: authNewSession_(u, !!d.trust), user: authPublic_(u), trusted: !!d.trust };
}
function authMfaEnroll_(d) {
  var c = CacheService.getScriptCache(), pk = 'auth_pend_' + sha256Hex_(String(d.pending || '')), e = c.get(pk);
  if (!e) return { ok: false, error: 'expired' };
  var users = authUsers_(), u = users[e];
  if (!u || !u.totpPending) return { ok: false, error: 'expired' };
  u.totp = u.totpPending;
  if (!totpCheck_(u, d.code)) { delete u.totp; return { ok: false, error: 'badcode' }; }
  u.totpOn = true; delete u.totpPending; c.remove(pk);
  var codes = [], hashes = []; u.rSalt = authRand_().slice(0, 32);
  for (var i = 0; i < 8; i++) { var r = authRand_().slice(0, 10); codes.push(r.slice(0, 5) + '-' + r.slice(5)); hashes.push(sha256Hex_(u.rSalt + 'rc:' + r)); }
  u.recovery = hashes; u.lastLogin = new Date().toISOString(); authSaveUsers_(users);
  authLog_(u, 'set up two-step sign-in');
  return { ok: true, token: authNewSession_(u, !!d.trust), user: authPublic_(u), recovery: codes };
}
function authFindLink_(kind, token) {
  if (!authHex_(token)) return null;
  var h = sha256Hex_(kind + ':' + token), users = authUsers_();
  for (var e in users) { var u = users[e]; if (u[kind + 'Hash'] && sameHex_(u[kind + 'Hash'], h) && u[kind + 'Exp'] > Date.now() && u.status !== 'disabled') return { users: users, u: u }; }
  return null;
}
function authLinkInfo_(d) {
  var kind = d.kind === 'reset' ? 'reset' : 'setup', f = authFindLink_(kind, d.link);
  if (!f) return { ok: false, error: 'expired' };
  return { ok: true, email: f.u.email, name: f.u.name, role: AUTH_ROLES[f.u.role], salt: authRand_().slice(0, 32), owner: f.u.role === 'owner' };
}
function authSetPassword_(d) {
  var kind = d.kind === 'reset' ? 'reset' : 'setup', f = authFindLink_(kind, d.link);
  if (!f) return { ok: false, error: 'expired' };
  if (!authHex_(d.dk) || !/^[a-f0-9]{32}$/.test(String(d.salt || ''))) return { ok: false, error: 'bad' };
  var u = f.u;
  u.cSalt = d.salt; u.sSalt = authRand_().slice(0, 32); u.hash = sha256Hex_(u.sSalt + d.dk);
  delete u[kind + 'Hash']; delete u[kind + 'Exp'];
  u.status = 'active'; authEndSessions_(u);
  authSaveUsers_(f.users);
  authLog_(u, kind === 'reset' ? 'reset password' : 'created password');
  return { ok: true, email: u.email };
}
function authSendLink_(u, kind) {
  var t = authRand_();
  u[kind + 'Hash'] = sha256Hex_(kind + ':' + t); u[kind + 'Exp'] = Date.now() + (kind === 'reset' ? AUTH_RESET_MS : AUTH_SETUP_MS);
  var url = 'https://' + SITE + '/login/#' + kind + '=' + t;
  MailApp.sendEmail({ to: u.email, name: 'Riverbend Web Co.', subject: kind === 'reset' ? 'Reset your Riverbend password' : 'Set up your Riverbend account',
    body: 'Hi ' + first_(u.name) + ',\n\n' + (kind === 'reset' ? 'Use this link to choose a new password. It works once and expires in 1 hour:' : 'You have a Riverbend Web Co. ' + AUTH_ROLES[u.role] + ' account. Use this link to choose your password. It works once and expires in 72 hours:') +
      '\n\n' + url + '\n\n' + (kind === 'reset' ? 'If you did not ask for this, ignore this email. Your password stays the same.' : 'Riverbend will never email you a password.') + '\n\nRiverbend Web Co.' });
}
function authResetRequest_(d) {
  var e = authEmail_(d.email), users = authUsers_(), u = users[e], c = CacheService.getScriptCache();
  if (u && u.status === 'active' && !c.get('auth_rr_' + sha256Hex_(e))) {
    c.put('auth_rr_' + sha256Hex_(e), '1', 300);
    authSendLink_(u, 'reset'); authSaveUsers_(users); authLog_(u, 'password reset requested');
  }
  return { ok: true }; // same answer whether or not the email has an account
}
/* First-time setup: the caller supplies email addresses; only those whose SHA-256 is listed in
   AUTH_SEED (with the name and role an owner approved) get a setup link, once each. The public
   file never contains the addresses, and nobody can add an unlisted person or change a role. */
function authBootstrap_(d) {
  var users = authUsers_(), sent = 0, keys = authProps_().getProperty('AUTH_SEED_DONE') || '';
  var given = [].concat(d.emails || []).map(authEmail_).filter(String);
  AUTH_SEED.forEach(function (s) {
    if (keys.indexOf(s.h) >= 0) return;
    var e = given.filter(function (x) { return sha256Hex_(x) === s.h; })[0];
    if (!e || users[e]) return;
    users[e] = { email: e, name: s.n, role: s.r, status: 'invited', created: new Date().toISOString(), gen: 1 };
    authSendLink_(users[e], 'setup'); sent++;
    keys += s.h + ',';
  });
  authSaveUsers_(users); authProps_().setProperty('AUTH_SEED_DONE', keys);
  return { ok: true, sent: sent };
}

/* ---- owner-only account management ---- */
function team_(d, me) {
  var users = authUsers_(), e = authEmail_(d.email), u = users[e];
  switch (d.action) {
    case 'team_list': return { ok: true, users: Object.keys(users).map(function (k) { var x = users[k]; return { email: x.email, name: x.name, role: x.role, roleName: AUTH_ROLES[x.role], status: x.status, mfa: !!x.totpOn, lastLogin: x.lastLogin || '', recoveryLeft: (x.recovery || []).length }; }), commission: authCommission_(), legacy: authLegacyOn_() };
    case 'team_invite':
      if (!e || !AUTH_ROLES[d.role] || !clip_(d.name, 80)) return { ok: false, error: 'bad' };
      if (u) return { ok: false, error: 'exists' };
      users[e] = { email: e, name: clip_(d.name, 80), role: d.role, status: 'invited', created: new Date().toISOString(), gen: 1, invitedBy: me.email };
      authSendLink_(users[e], 'setup'); authSaveUsers_(users); authLog_(me, 'invited ' + e + ' as ' + AUTH_ROLES[d.role]);
      return { ok: true };
    case 'team_resend':
      if (!u || u.status === 'disabled') return { ok: false, error: 'notfound' };
      authSendLink_(u, u.status === 'invited' ? 'setup' : 'reset'); authSaveUsers_(users); authLog_(me, 'sent a ' + (u.status === 'invited' ? 'setup' : 'reset') + ' link to ' + e);
      return { ok: true };
    case 'team_disable':
      if (!u || e === me.email) return { ok: false, error: 'self' };
      u.status = d.on ? 'disabled' : (u.hash ? 'active' : 'invited'); authEndSessions_(u); authSaveUsers_(users); authLog_(me, (d.on ? 'disabled ' : 'enabled ') + e);
      return { ok: true };
    case 'team_mfa_reset':
      if (!u || e === me.email) return { ok: false, error: 'self' };
      u.totpOn = false; delete u.totp; delete u.totpPending; u.recovery = []; authEndSessions_(u); authSaveUsers_(users); authLog_(me, 'reset two-step sign-in for ' + e);
      return { ok: true };
    case 'team_role':
      if (!u || e === me.email || !AUTH_ROLES[d.role]) return { ok: false, error: 'bad' };
      u.role = d.role; authEndSessions_(u); authSaveUsers_(users); authLog_(me, 'changed role of ' + e + ' to ' + AUTH_ROLES[d.role]);
      return { ok: true };
    case 'team_commission':
      var cm = { flat: Math.max(0, Math.round(Number(d.flat || 0) * 100)), setupPct: Math.max(0, Math.min(100, Number(d.setupPct || 0))), monthlyPct: Math.max(0, Math.min(100, Number(d.monthlyPct || 0))), months: Math.max(0, Math.min(120, Math.round(Number(d.months || 12)))) };
      authProps_().setProperty('AUTH_COMMISSION', JSON.stringify(cm)); authLog_(me, 'changed commission settings: ' + JSON.stringify(cm));
      return { ok: true, commission: cm };
    case 'team_legacy_off':
      var owners = Object.keys(users).map(function (k) { return users[k]; }).filter(function (x) { return x.role === 'owner' && x.status === 'active' && x.totpOn && x.lastLogin; });
      if (owners.length < 2) return { ok: false, error: 'owners', detail: 'Both owner accounts must be set up (password and authenticator) and signed in once first.' };
      authProps_().setProperty('AUTH_LEGACY_OFF', '1'); authLog_(me, 'turned off the old shared Studio and billing passwords');
      return { ok: true };
  }
  return { ok: false, error: 'unknown' };
}
function authCommission_() { try { return JSON.parse(authProps_().getProperty('AUTH_COMMISSION') || ''); } catch (e) { return { flat: 0, setupPct: 0, monthlyPct: 0, months: 12 }; } }
function authLog_(u, what) {
  try {
    var ss = ss_(), sh = ss.getSheetByName('Billing Activity');
    if (!sh) { sh = ss.insertSheet('Billing Activity'); sh.appendRow(['Time', 'Action', 'Account', 'Details', 'Result']); sh.setFrozenRows(1); }
    sh.appendRow([new Date(), 'account', '', (u && u.email ? u.email + ': ' : '') + what, 'ok']);
  } catch (e) { console.error(e); }
}

/* ---- salesperson view: own customers, progress and commission (no company totals) ---- */
function salesCustomers_(me) {
  var cm = authCommission_();
  var list = billAll_().filter(function (a) { return !(a.flags && (a.flags.selftest || a.flags.postest)) && (me.role === 'owner' || a.rep === me.email); });
  var progress = function (a) {
    if (a.status === 'ended') return 'Ended';
    if (a.status === 'awaiting_card') return 'Signed: waiting for payment setup';
    if (a.status === 'building') return 'Payment set up: website in progress';
    return 'Website live';
  };
  var rows = list.map(function (a) {
    var counted = function (c) { return c.status === 'paid' && !c.refunded && !c.disputed; };
    var monthly = (a.charges || []).filter(function (c) { return (c.kind === 'full' || c.kind === 'prorated' || c.kind === 'final') && counted(c); });
    var monthsPaid = monthly.filter(function (c) { return c.kind === 'full'; }).length;
    var monthlySum = monthly.filter(function (c, i) { return c.kind !== 'full' || i < (cm.months || 0) + 1; }).reduce(function (s, c) { return s + c.amount; }, 0);
    var com = (a.status !== 'awaiting_card' ? cm.flat : 0) + (a.setupPaid ? Math.round(a.setup * cm.setupPct / 100) : 0) + Math.round(monthlySum * cm.monthlyPct / 100);
    return { id: a.id, business: a.business, contact: a.owner, phone: a.phone, email: a.email, packageName: BILL_TIERS[a.tier].n, optionName: a.pay === 'zero' ? '$0 Down' : 'Pay Upfront',
      signed: (a.agreement && a.agreement.signed) || String(a.created || '').slice(0, 10), progress: progress(a), launch: a.launch || '', monthsPaid: monthsPaid, commission: com, rep: me.role === 'owner' ? (a.rep || '') : undefined, test: a.env !== 'production' };
  });
  return { ok: true, customers: rows, commission: cm, totalCommission: rows.reduce(function (s, r) { return s + r.commission; }, 0) };
}

/* Leads for a salesperson: unassigned leads plus their own; saving or updating a lead assigns it to them. */
function leadsRepCol_(sh) { if (String(sh.getRange(1, 15).getValue()) !== 'Rep') sh.getRange(1, 15).setValue('Rep'); return 15; }
function leadsForRep_(d, me) {
  var sh = leadsSheet_(), col = leadsRepCol_(sh);
  var repOf = function (id) { var r = leadsRow_(sh, id); return r ? String(sh.getRange(r, col).getValue() || '') : null; };
  switch (d.action) {
    case 'leads_saved':
      var n = sh.getLastRow(), reps = {};
      if (n >= 2) sh.getRange(2, 1, n - 1, col).getValues().forEach(function (r) { reps[String(r[1])] = String(r[col - 1] || ''); });
      return { ok: true, leads: leadsSaved_().filter(function (l) { return !reps[l.id] || reps[l.id] === me.email; }) };
    case 'leads_save':
      var res = leadsSave_(d.lead || {}); var row = leadsRow_(sh, clip_((d.lead || {}).id, 200));
      if (row && !String(sh.getRange(row, col).getValue() || '')) sh.getRange(row, col).setValue(me.email);
      return res;
    case 'leads_update':
      var who = repOf(String(d.id || ''));
      if (who === null) return { ok: false, error: 'notfound' };
      if (who && who !== me.email) return { ok: false, error: 'auth' };
      if (!d.remove) sh.getRange(leadsRow_(sh, String(d.id)), col).setValue(me.email);
      return leadsUpdate_(String(d.id || ''), d);
    case 'leads_status': return leadsStatus_();
    case 'leads_find': return leadsFind_(d);
    case 'leads_verify': return leadsVerify_(d);
    case 'leads_demo': return leadsDemo_(d.lead || {});
  }
  return { ok: false, error: 'auth' };
}

/* Live Square check (no charges): makes sure the "Riverbend Website Service" subscription plans exist
   in the current mode's Square account and reads them back: price, monthly, billing day 1, no proration. */
function billPlansCheck_() {
  var env = 'production', out = [];
  if (!sqProp_('TOKEN', env)) return { ok: false, error: 'notoken' };
  var plans = billPlans_(env);
  if (plans._error) return { ok: false, error: 'square', detail: plans._error };
  SUB_KEYS.forEach(function (k) {
    var t = k.split('-'), T = BILL_TIERS[t[0]], want = t[1] === 'zero' ? T.zero : T.care;
    var o = sq_('get', '/v2/catalog/object/' + encodeURIComponent(plans[k]), null, env).object || {}, vd = o.subscription_plan_variation_data || {}, ph = (vd.phases || [])[0] || {};
    var price = ((ph.pricing || {}).price_money || (ph.pricing || {}).price || ph.recurring_price_money || {}).amount;
    out.push({ plan: vd.name || k, price: price, ok: price === want && ph.cadence === 'MONTHLY' && vd.monthly_billing_anchor_date === 1 && vd.can_prorate !== true, billingDay: vd.monthly_billing_anchor_date, cadence: ph.cadence, prorate: !!vd.can_prorate });
  });
  var loc = sq_('get', '/v2/locations/' + encodeURIComponent(sqLocation_(env)), null, env).location || {};
  return { ok: true, env: env, location: { id: loc.id, name: loc.name, status: loc.status, currency: loc.currency, country: loc.country, cardProcessing: (loc.capabilities || []).indexOf('CREDIT_CARD_PROCESSING') >= 0 }, plans: out };
}
