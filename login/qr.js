/* Minimal QR Code generator (byte mode, error correction M, versions 1-15).
   Follows the QR Code specification (ISO/IEC 18004) as in Project Nayuki's reference
   implementation. Used only to show the authenticator setup code on /login. */
(function (root) {
  'use strict';
  var ECC = [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24];
  var BLK = [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10];
  function rawModules(v) { var r = (16 * v + 128) * v + 64; if (v >= 2) { var n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; } return r; }
  function dataCap(v) { return Math.floor(rawModules(v) / 8) - ECC[v] * BLK[v]; }
  function mul(x, y) { var z = 0; for (var i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 255; }
  function divisor(d) { var r = []; for (var i = 0; i < d - 1; i++) r.push(0); r.push(1); var root = 1; for (i = 0; i < d; i++) { for (var j = 0; j < r.length; j++) { r[j] = mul(r[j], root); if (j + 1 < r.length) r[j] ^= r[j + 1]; } root = mul(root, 2); } return r; }
  function remainder(data, div) { var r = div.map(function () { return 0; }); data.forEach(function (b) { var f = b ^ r.shift(); r.push(0); div.forEach(function (c, i) { r[i] ^= mul(c, f); }); }); return r; }
  function utf8(s) { return Array.from(unescape(encodeURIComponent(s))).map(function (c) { return c.charCodeAt(0); }); }
  function encode(text) {
    var bytes = utf8(text), v;
    for (v = 1; v <= 15; v++) if (4 + (v < 10 ? 8 : 16) + bytes.length * 8 <= dataCap(v) * 8) break;
    if (v > 15) throw new Error('too long');
    var bits = [], put = function (val, n) { for (var i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
    put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(function (b) { put(b, 8); });
    var cap = dataCap(v) * 8;
    put(0, Math.min(4, cap - bits.length)); put(0, (8 - bits.length % 8) % 8);
    for (var pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8);
    var data = []; for (var i = 0; i < bits.length; i += 8) { var b = 0; for (var j = 0; j < 8; j++) b = (b << 1) | bits[i + j]; data.push(b); }
    // error correction and interleaving
    var nb = BLK[v], el = ECC[v], raw = Math.floor(rawModules(v) / 8), ns = nb - raw % nb, sl = Math.floor(raw / nb), div = divisor(el), blocks = [], k = 0;
    for (i = 0; i < nb; i++) { var dat = data.slice(k, k + sl - el + (i < ns ? 0 : 1)); k += dat.length; var ec = remainder(dat, div); if (i < ns) dat.push(0); blocks.push(dat.concat(ec)); }
    var all = []; for (i = 0; i < blocks[0].length; i++) for (j = 0; j < nb; j++) if (i !== sl - el || j >= ns) all.push(blocks[j][i]);
    // matrix
    var size = v * 4 + 17, m = [], fn = [];
    for (i = 0; i < size; i++) { m.push(new Array(size).fill(false)); fn.push(new Array(size).fill(false)); }
    var set = function (x, y, d) { m[y][x] = d; fn[y][x] = true; };
    for (i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    [[3, 3], [size - 4, 3], [3, size - 4]].forEach(function (c) { for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) { var d = Math.max(Math.abs(dx), Math.abs(dy)), x = c[0] + dx, y = c[1] + dy; if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, d !== 2 && d !== 4); } });
    var pos = [];
    if (v > 1) { var na = Math.floor(v / 7) + 2, step = Math.ceil((v * 4 + 4) / (na * 2 - 2)) * 2; pos = [6]; for (var p = size - 7; pos.length < na; p -= step) pos.splice(1, 0, p); }
    pos.forEach(function (a, ia) { pos.forEach(function (bb, ib) { if ((ia === 0 && ib === 0) || (ia === 0 && ib === pos.length - 1) || (ia === pos.length - 1 && ib === 0)) return; for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) set(a + dx, bb + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }); });
    var fmt = function (mask) {
      var dd = (0 << 3) | mask, r = dd; for (var t = 0; t < 10; t++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      var fb = ((dd << 10) | r) ^ 0x5412, g = function (n) { return ((fb >>> n) & 1) !== 0; };
      for (t = 0; t <= 5; t++) set(8, t, g(t)); set(8, 7, g(6)); set(8, 8, g(7)); set(7, 8, g(8)); for (t = 9; t < 15; t++) set(14 - t, 8, g(t));
      for (t = 0; t < 8; t++) set(size - 1 - t, 8, g(t)); for (t = 8; t < 15; t++) set(8, size - 15 + t, g(t)); set(8, size - 8, true);
    };
    fmt(0);
    if (v >= 7) { var r2 = v; for (i = 0; i < 12; i++) r2 = (r2 << 1) ^ ((r2 >>> 11) * 0x1F25); var vb = (v << 12) | r2; for (i = 0; i < 18; i++) { var bt = ((vb >>> i) & 1) !== 0, aa = size - 11 + i % 3, bb2 = Math.floor(i / 3); set(aa, bb2, bt); set(bb2, aa, bt); } }
    var bi = 0;
    for (var right = size - 1; right >= 1; right -= 2) { if (right === 6) right = 5; for (var vert = 0; vert < size; vert++) for (j = 0; j < 2; j++) { var x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert; if (!fn[y][x] && bi < all.length * 8) { m[y][x] = ((all[bi >>> 3] >>> (7 - (bi & 7))) & 1) !== 0; bi++; } } }
    for (var y2 = 0; y2 < size; y2++) for (var x2 = 0; x2 < size; x2++) if (!fn[y2][x2] && (x2 + y2) % 2 === 0) m[y2][x2] = !m[y2][x2];
    fmt(0);
    return m;
  }
  function svg(text, px) {
    var m = encode(text), n = m.length, q = 4, s = n + q * 2, d = '';
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (m[y][x]) d += 'M' + (x + q) + ',' + (y + q) + 'h1v1h-1z';
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + ' ' + s + '" width="' + (px || 200) + '" height="' + (px || 200) + '" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="' + s + '" height="' + s + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }
  root.RBQR = { encode: encode, svg: svg };
})(typeof window !== 'undefined' ? window : module.exports);
