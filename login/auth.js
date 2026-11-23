/* Shared sign-in helper for Riverbend pages (login, sales, studio, leads, billing). */
(function () {
  'use strict';
  var API = 'https://script.google.com/macros/s/AKfycbwkosfcFSHGXy8EUaAFZ7Q-SFDFllV_k4n8qBABRxoj2hv59RspTU9APLQabwP_ohaW/exec';
  function token() { try { return localStorage.getItem('rbAuth') || sessionStorage.getItem('rbAuth') || ''; } catch (e) { return ''; } }
  function save(t, trusted) { try { clear(); (trusted ? localStorage : sessionStorage).setItem('rbAuth', t); } catch (e) {} }
  function clear() { try { localStorage.removeItem('rbAuth'); sessionStorage.removeItem('rbAuth'); } catch (e) {} }
  function call(body) {
    var b = Object.assign({ token: token() }, body);
    return fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(b) })
      .then(function (r) { return r.json(); }).catch(function () { return { ok: false, error: 'network' }; });
  }
  /* PBKDF2-SHA256, 600,000 rounds (OWASP 2023+), with the account's unique salt. Only the result is sent. */
  function derive(password, salt) {
    var enc = new TextEncoder();
    return crypto.subtle.importKey('raw', enc.encode(password.normalize('NFKC')), 'PBKDF2', false, ['deriveBits'])
      .then(function (k) { return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode('riverbend:' + salt), iterations: 600000 }, k, 256); })
      .then(function (bits) { return Array.from(new Uint8Array(bits)).map(function (x) { return ('0' + x.toString(16)).slice(-2); }).join(''); });
  }
  function requireLogin(path) { location.href = '/login/?next=' + encodeURIComponent(path || location.pathname); }
  window.RBAuth = { token: token, save: save, clear: clear, call: call, derive: derive, requireLogin: requireLogin, API: API };
})();
