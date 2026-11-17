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

    var mail = kind === 'agreement' ? agreementEmail_(f, file, driveUrl, sheetUrl) : leadEmail_(f, file, driveUrl, sheetUrl);
    var reply = /@/.test(f['Phone or Email'] || f['Email'] || '') ? (f['Phone or Email'] || f['Email']) : '';
    var opts = { to: OWNER_EMAIL, subject: mail.subject, htmlBody: mail.html, body: mail.text, name: 'Riverbend Website' };
    if (reply && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(reply)) opts.replyTo = reply;
    if (file) {
      opts.attachments = [file.blob];
      if (file.previewable) opts.inlineImages = { preview: file.blob };
    }
    MailApp.sendEmail(opts);
    return json_({ ok: true });
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: 'server' });
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'demo') {
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

function agreementEmail_(f, file, driveUrl, sheetUrl) {
  var actions = [];
  if (/@/.test(f['Email'] || '')) actions.push(btn_('mailto:' + f['Email'] + '?subject=' + encodeURIComponent('Welcome to Riverbend Web Co.'), 'Email ' + first_(f['Owner']), true));
  var d = (f['Phone'] || '').replace(/\D/g, '');
  if (d.length >= 10) actions.push(btn_('tel:+1' + d.slice(-10), 'Call', !actions.length));
  if (sheetUrl) actions.push(btn_(sheetUrl, 'Open lead sheet', false));
  var rows = [
    ['Plan', f['Plan']],
    ['Business', f['Business']],
    ['Owner', f['Owner']],
    ['Phone', f['Phone']],
    ['Email', f['Email']],
    ['Signed', f['Signed']],
    ['Signature', (f['Signature'] || '') + (driveUrl ? ' &nbsp;<a href="' + driveUrl + '" style="color:#0052CC;text-decoration:none;font-weight:600">View in Drive</a>' : '')]
  ];
  var html = layout_({
    label: 'Signed service agreement',
    title: f['Business'],
    sub: (f['Plan'] || '') + ' &middot; signed by ' + f['Owner'],
    actions: actions,
    rows: rows,
    image: file && file.previewable ? { cid: 'preview', caption: 'Signature' } : null,
    steps: [
      'Send the welcome email and onboarding checklist.',
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
    ss.getSheetByName('Signed Agreements').appendRow([new Date(), safe(f['Plan']), safe(f['Business']), safe(f['Owner']), safe(f['Phone']), safe(f['Email']), safe(f['Signed']), fileUrl]);
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

var DEMO_STYLES = ['pub', 'lounge', 'trade'];
var DEMO_STATUS = ['Draft', 'Ready', 'Pitched', 'Won', 'Lost'];
var DEMO_IMG_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
var DEMO_MAX_IMG = 2 * 1024 * 1024;
var TOKEN_TTL = 6 * 60 * 60; // 6 hours

function studio_(d) {
  if (d.action === 'login') return login_(String(d.password || ''));
  if (!authed_(d.token)) return { ok: false, error: 'auth' };
  switch (d.action) {
    case 'list': return { ok: true, demos: listDemos_() };
    case 'get': return getDemo_(String(d.slug || ''), true);
    case 'save': return saveDemo_(d);
    case 'delete': return deleteDemo_(String(d.slug || ''));
    case 'scan': return scanSite_(String(d.url || ''));
    case 'logout': CacheService.getScriptCache().remove('tok_' + d.token); return { ok: true };
  }
  return { ok: false, error: 'unknown' };
}

function login_(pw) {
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('rb_fail') || 0);
  if (fails >= 8) return { ok: false, error: 'locked' };
  var real = PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD');
  if (!real) { ensurePassword_(); return { ok: false, error: 'nopassword' }; }
  if (!pw || !sameHash_(pw, real)) {
    cache.put('rb_fail', String(fails + 1), 900); // lock for 15 min after 8 misses
    Utilities.sleep(600);
    return { ok: false, error: 'badpassword' };
  }
  cache.remove('rb_fail');
  var token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  cache.put('tok_' + token, '1', TOKEN_TTL);
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
  if (!cache.get('tok_' + token)) return false;
  cache.put('tok_' + token, '1', TOKEN_TTL); // sliding session
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
  return sh.getRange(2, 1, last - 1, 6).getValues().map(function (r) {
    return { slug: r[0], name: r[1], style: r[2], city: r[3], status: r[4], updated: r[5] ? new Date(r[5]).toISOString() : '' };
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
    items: arr(s.items).slice(0, 60).map(function (i) { return { group: t(i.group, 40), name: t(i.name, 80), price: t(i.price, 20), desc: t(i.desc, 240) }; }).filter(function (i) { return i.name; }),
    specials: arr(s.specials).slice(0, 12).map(function (i) { return { title: t(i.title, 80), when: t(i.when, 60), detail: t(i.detail, 240) }; }).filter(function (i) { return i.title; }),
    colors: { primary: color((s.colors || {}).primary, ''), accent: color((s.colors || {}).accent, '') },
    heroPreset: /^[0-9a-f-]{8,40}$/.test(String(s.heroPreset || '')) ? String(s.heroPreset) : '',
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
  var extra = navLinks_(first.html, first.url, host).slice(0, 4);
  extra.forEach(function (u) { var p = fetchPage_(u); if (p) pages.push(p); });

  var out = { name: '', category: '', tagline: '', about: '', address: '', city: '', phone: '', email: '',
    hours: ['', '', '', '', '', '', ''], items: [], social: { facebook: '', instagram: '' }, style: '', website: first.url };
  var types = [];
  pages.forEach(function (pg) { fromJsonLd_(pg.html, out, types); });
  pages.forEach(function (pg) { fromHtml_(pg, out); });
  if (out.items.length < 5) pages.forEach(function (pg) { if (out.items.length < 60) menuFromText_(pg.html, out); });
  if (!out.hours.some(String)) pages.forEach(function (pg) { if (!out.hours.some(String)) hoursFromText_(textOf_(pg.html), out); });
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
  var want = /(menu|food|drink|about|contact|hours|location|visit|services|our-story|find-us)/i;
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
  if (!out.name) out.name = clip_(meta('og:site_name') || String(pg.title || '').split(/\s[|\u2013\u2014-]\s/)[0], 80);
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
  var re = new RegExp(D + '(?:\\s*(?:-|\u2013|\u2014|&|and|to|thru|through)\\s*' + D + ')?\\s*[:.]?\\s*(?:' + T + '\\s*(?:-|\u2013|\u2014|to)\\s*' + T + '|(closed))', 'gi');
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
