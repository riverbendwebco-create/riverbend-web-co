/**
 * Riverbend Web Co. form handler (Google Apps Script)
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

function doGet() {
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
  var un = unesc_;
  var safe = function (s) { s = un(s); return /^[=+\-@]/.test(s) ? "'" + s : s; }; // block spreadsheet formula injection
  if (kind === 'agreement') {
    ss.getSheetByName('Signed Agreements').appendRow([new Date(), safe(f['Plan']), safe(f['Business']), safe(f['Owner']), safe(f['Phone']), safe(f['Email']), safe(f['Signed']), fileUrl]);
  } else {
    ss.getSheetByName('Preview Requests').appendRow([new Date(), safe(f['Business Name']), safe(f['Contact Name']), safe(f['Phone or Email']), safe(f['Business Type']), safe(f['Plan Interest']), fileUrl, 'New']);
  }
  return ss.getUrl();
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
