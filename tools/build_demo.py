"""Builds demo/index.html from the demo designs in index.html (CSS + icons)
and tools/demo_template.js. Run: python3 tools/build_demo.py"""
import re, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'index.html').read_text()
lines = src.split('\n')

def block(start_marker, end_marker):
    s = next(i for i, l in enumerate(lines) if l.startswith(start_marker))
    e = next(i for i, l in enumerate(lines) if i > s and l.startswith(end_marker))
    return '\n'.join(lines[s:e])

demo_css = block('/* ===== Shared demo helpers ===== */', '/* Pricing */')
icon_css = '\n'.join(l for l in lines if re.match(r'^\.(ico|stars-svg|socials \.ico|tr-badges \.ico|pub-hh \.ico)\b', l))
sprite = re.search(r'<svg width="0" height="0" style="position:absolute" aria-hidden="true">[\s\S]*?</svg>\s*(?=<)', src).group(0)
js = (root / 'tools' / 'demo_template.js').read_text()

extra = r'''
:root{--navy:#0F172A;--line:#E2E8F0;--slate:#64748B;--mist:#F1F5F9;--font-h:-apple-system,BlinkMacSystemFont,"SF Pro Display","Inter","Segoe UI",system-ui,sans-serif;--font-b:-apple-system,BlinkMacSystemFont,"SF Pro Text","Inter","Segoe UI",system-ui,sans-serif}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:var(--font-b);line-height:1.6;-webkit-font-smoothing:antialiased;padding-bottom:64px;background:#0d0d0f}
body.t-trade{background:#fff}
a{color:inherit}
button,input,select,textarea{font:inherit}
img{max-width:100%}
.demo{display:block}
/* page-width layout for the modal designs */
.pub-wrap>*,.lg-sec>*,.tr-sec>*{max-width:1180px;margin-left:auto;margin-right:auto}
.pub-hero{min-height:min(78vh,640px)}
.lg-hero{min-height:min(78vh,620px)}
.lg-photos{grid-template-rows:clamp(150px,18vw,240px) clamp(150px,18vw,240px)}
/* no pills */
.live,.sauces span,.tapfilter button,.lg-nav .rsv,.lg-tabs button,.area .towns span{border-radius:6px!important}
.tr-svc,.proj,.spot-card,.panel,.menu-list,.menu-photo,.note-card,.chef,.area{border-radius:12px}
/* real links styled like the demo buttons */
a.pub-call,a.pub-dir{border:0;border-radius:10px;padding:13px 20px;font-weight:800;display:flex;align-items:center;gap:8px;font-size:.95rem;text-decoration:none;transition:transform .15s}
a.pub-call:hover,a.pub-dir:hover{transform:translateY(-1px)}
a.tr-phone{text-decoration:none;display:inline-flex;align-items:center;gap:6px}
/* keep nav, footer and hero content in a centered column on wide screens */
.pub-nav,.pub-foot,.lg-nav,.lg-foot,.tr-top,.tr-nav,.tr-foot,.pub-hero,.lg-hero,.tr-hero{padding-left:max(24px,calc((100vw - 1180px)/2))!important;padding-right:max(24px,calc((100vw - 1180px)/2))!important}
.pub-hero .in,.lg-hero .in{margin-left:0}
.tr-stats{padding-left:max(0px,calc((100vw - 1180px)/2));padding-right:max(0px,calc((100vw - 1180px)/2))}
.pub-logo-img{height:44px;width:auto;max-width:170px;object-fit:contain;display:block}
.lg-logo-img{height:46px;width:auto;max-width:180px;object-fit:contain}
.tr-logo-img{height:40px;width:auto;max-width:170px;object-fit:contain}
.lineup-grid.one{grid-template-columns:1fr}
.tr-svcs{grid-template-columns:repeat(auto-fit,minmax(260px,1fr))!important}
.about-txt{color:#E7E5E4;line-height:1.7;white-space:pre-line;position:relative}
.muted{color:#A8A29E}
.socials a{display:inline-grid;place-items:center}
.mapbox .map-go{position:absolute;right:10px;bottom:10px;background:var(--gold);color:#1a1205;font-weight:800;font-size:.8rem;padding:7px 12px;border-radius:6px;text-decoration:none}
.note-d{color:#A8A29E;font-size:.9rem;margin-top:6px}
.lg-foot a{color:inherit;text-decoration:none}
.lg-ok,.tr-ok{display:none}
/* loading + Riverbend preview bar */
.state{min-height:100vh;display:grid;place-items:center;text-align:center;padding:30px;background:#0F172A;color:#E2E8F0}
.state h1{font-size:1.4rem;margin:12px 0 6px}.state p{color:#94A3B8}
.spin{width:28px;height:28px;border:3px solid rgba(255,255,255,.2);border-top-color:#60A5FA;border-radius:50%;animation:sp .8s linear infinite;margin:0 auto}
@keyframes sp{to{transform:rotate(360deg)}}
.rb-bar{position:fixed;left:0;right:0;bottom:0;z-index:60;background:#0F172A;color:#E2E8F0;border-top:1px solid rgba(96,165,250,.3);font-family:var(--font-b);padding-bottom:env(safe-area-inset-bottom)}
.rb-in{max-width:1180px;margin:0 auto;padding:0 20px;display:flex;align-items:center;gap:14px;height:64px}
.rb-bar .t{font-size:.86rem;line-height:1.35;flex:1;min-width:0}.rb-bar .t b{color:#fff}.rb-bar .t span{color:#94A3B8}
.rb-bar .go{height:40px;padding:0 16px;border-radius:8px;background:#0052CC;color:#fff;font-weight:700;font-size:.88rem;text-decoration:none;display:inline-flex;align-items:center;white-space:nowrap}
@media (max-width:640px){.rb-bar .t span{display:none}.pub-nav,.pub-foot,.lg-nav,.lg-foot,.tr-top,.tr-nav,.tr-foot,.pub-hero,.lg-hero,.tr-hero{padding-left:18px!important;padding-right:18px!important}}
'''

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src https://script.google.com https://script.googleusercontent.com; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'">
<title>Website Preview | Riverbend Web Co.</title>
<link rel="icon" href="data:,">
<!-- Generated by tools/build_demo.py from the demo designs in index.html. Do not edit by hand. -->
<style>
{demo_css}
{icon_css}
{extra}
</style>
</head>
<body>
{sprite}
<div id="root"><div class="state"><div><div class="spin"></div><h1>Loading preview</h1><p>One moment</p></div></div></div>
<script>
{js}
</script>
</body>
</html>
'''
(root / 'demo' / 'index.html').write_text(html)
print('built demo/index.html', len(html)//1024, 'KB')
