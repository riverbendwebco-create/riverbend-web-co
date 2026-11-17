/**
 * Riverbend Web Co. backend loader (Google Apps Script)
 *
 * Paste this ONCE. It loads the real backend code from
 * https://riverbendwebco.com/apps-script/backend.js, so updates pushed to
 * GitHub go live automatically (within about 5 minutes). No more pasting
 * or redeploying.
 *
 * One-time setup:
 *   1. Paste this file over everything in Code.gs and press Ctrl+S.
 *   2. Pick "authorize" in the function dropdown, click Run, then Allow.
 *   3. Deploy > Manage deployments > pencil > New version > Deploy.
 */

var BACKEND_URL = 'https://riverbendwebco.com/apps-script/backend.js';

function doPost(e) { return backend_().doPost(e); }
function doGet(e) { return backend_().doGet(e); }

var RB_ = null;
function backend_() {
  if (RB_) return RB_;
  var cache = CacheService.getScriptCache();
  var code = cache.get('rb_backend');
  if (!code) {
    try {
      var r = UrlFetchApp.fetch(BACKEND_URL + '?t=' + Date.now(), { muteHttpExceptions: true, followRedirects: true });
      var body = r.getResponseCode() === 200 ? r.getContentText() : '';
      if (body.indexOf('RIVERBEND_BACKEND') > -1) {
        code = body;
        cache.put('rb_backend', code, 300);          // refresh every 5 minutes
        cache.put('rb_backend_backup', code, 21600); // keep a 6-hour backup
      }
    } catch (err) { console.error(err); }
    if (!code) code = cache.get('rb_backend_backup');
    if (!code) throw new Error('Backend code could not be loaded from ' + BACKEND_URL);
  }
  RB_ = new Function(code + '\nreturn { doPost: doPost, doGet: doGet };')();
  return RB_;
}

/* Force an immediate refresh (optional). */
function refreshBackend() {
  CacheService.getScriptCache().removeAll(['rb_backend']);
  RB_ = null; backend_();
  Logger.log('Backend refreshed from ' + BACKEND_URL);
}

/* Run once to grant permissions. */
function authorize() {
  scopes_(false);
  refreshBackend();
  Logger.log('All set. Updates now load automatically.');
}

/* Lists every Google service the backend uses so Google asks for permission
   once. Never called with true. */
function scopes_(run) {
  if (!run) return;
  MailApp.sendEmail('', '', '');
  DriveApp.getRootFolder(); DriveApp.createFolder(''); DriveApp.getFileById('');
  SpreadsheetApp.openById(''); SpreadsheetApp.create('');
  UrlFetchApp.fetch('');
  LockService.getScriptLock();
  PropertiesService.getScriptProperties();
  Utilities.getUuid();
}
