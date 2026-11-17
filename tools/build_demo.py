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
.rb-bar .rb-tag{font-style:normal;margin-left:10px;font-size:.7rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#93C5FD;border:1px solid rgba(147,197,253,.4);padding:2px 6px;border-radius:4px;vertical-align:1px}
/* richer pub layout */
.pub .live.off{background:rgba(220,38,38,.12);border-color:rgba(220,38,38,.45);color:#FCA5A5}.pub .live.off i{background:#DC2626;animation:none}
.pub-hero{min-height:min(82vh,680px)}
.pub-hero h2{font-size:clamp(2.6rem,7vw,4.6rem)}
.pub-hero .pub-dir{cursor:pointer}
.pub-stats div{min-width:110px}
.spot.one{grid-template-columns:1fr}
.favs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.fav{background:#151518;border:1px solid #2a2a2f;border-radius:12px;overflow:hidden;display:flex;flex-direction:column;transition:transform .25s,border-color .25s}
.fav:hover{transform:translateY(-4px);border-color:color-mix(in srgb,var(--gold) 60%,transparent)}
.fav-ph{height:210px;position:relative;background-size:cover;background-position:center}
.fav-pr{position:absolute;right:12px;top:12px;background:var(--gold);color:#1a1205;font-family:var(--font-h);font-weight:900;font-size:1rem;padding:6px 10px;border-radius:6px}
.fav-b{padding:18px 20px 22px}
.fav-b small{display:block;color:var(--gold-2);font-size:.7rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:6px}
.fav-b h4{font-family:var(--font-h);font-weight:900;text-transform:uppercase;font-size:1.3rem;line-height:1.05;color:#fff}
.fav-b p{color:#A8A29E;font-size:.9rem;margin-top:8px;line-height:1.55}
.pub-strip{display:grid;grid-template-columns:1.3fr 1fr 1fr 1.3fr;gap:6px;height:clamp(150px,20vw,240px);margin:10px 0 0}
.pub-strip .ph{background-size:cover;background-position:center;filter:saturate(1.05)}
.story{display:grid;grid-template-columns:1fr 1.1fr;gap:0;background:#151518;border:1px solid #2a2a2f;border-radius:12px;overflow:hidden}
.story-ph{min-height:360px;background-size:cover;background-position:center}
.story-b{padding:38px 40px;display:flex;flex-direction:column;justify-content:center}
.story-b h3{font-family:var(--font-h);font-weight:900;text-transform:uppercase;font-size:clamp(1.6rem,3vw,2.2rem);line-height:1;margin-bottom:14px;color:#fff}
.story-b .pub-kicker{align-self:flex-start}
.story-b .about-txt{font-size:1.02rem}
.story-b .pub-actions{margin-top:22px;align-items:center}
.story-b .socials{display:flex;gap:8px}
.story-b .socials a{width:44px;height:44px;border:1px solid #3a3a40;border-radius:10px;color:#D6D3D1}
.rv-in{opacity:0;transform:translateY(28px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1)}
.rv-in.rv-on{opacity:1;transform:none}
@media (max-width:860px){.favs{grid-template-columns:1fr}.story{grid-template-columns:1fr}.story-ph{min-height:220px}.story-b{padding:26px 22px}.pub-strip{grid-template-columns:1fr 1fr;height:auto}.pub-strip .ph{height:130px}.pub-links{display:none}.fav-ph{height:160px}}
/* ===== Western saloon (light) ===== */
body.t-western{background:#fff}
.western{--wn:#1D2B53;--wr:#B22234;--wink:#0F172A;--wline:#E2E8F0;--wsoft:#F8FAFC;--wd:'Rye',Georgia,serif;--ws:'Bitter',Georgia,serif;background:#fff;color:var(--wink);font-family:var(--font-b)}
.western button{font:inherit}
.wx-stars{display:inline-flex;gap:5px;color:var(--wr)}
.wx-stars svg{width:14px;height:14px}
.wx-top{background:var(--wr);color:#fff;text-align:center;font-family:var(--ws);font-weight:700;font-size:.86rem;letter-spacing:.08em;text-transform:uppercase;padding:9px 16px;display:flex;justify-content:center;align-items:center;gap:12px}
.wx-top .wx-stars{color:#fff}
.wx-nav{position:sticky;top:0;z-index:20;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);border-bottom:3px solid var(--wn);display:flex;align-items:center;gap:22px;padding:10px max(24px,calc((100vw - 1180px)/2))}
.wx-brand img{height:56px;width:auto;max-width:180px;object-fit:contain;display:block}
.wx-brand b{font-family:var(--wd);font-size:1.4rem;color:var(--wn);font-weight:400}
.wx-links{display:flex;gap:22px;margin-left:auto}
.wx-links button{background:none;border:0;cursor:pointer;font-family:var(--ws);font-weight:700;font-size:.92rem;color:var(--wn);padding:6px 0;border-bottom:2px solid transparent;text-transform:uppercase;letter-spacing:.04em}
.wx-links button:hover{border-color:var(--wr);color:var(--wr)}
.wx-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:50px;padding:0 22px;border-radius:10px;font-weight:800;font-size:.98rem;text-decoration:none;border:2px solid transparent;cursor:pointer;white-space:nowrap;transition:transform .15s,background .15s}
.wx-btn:hover{transform:translateY(-2px)}
.wx-btn svg{flex:none}
.wx-sm{height:42px;padding:0 16px;font-size:.9rem}
.wx-red{background:var(--wr);color:#fff;box-shadow:0 12px 26px -14px var(--wr)}
.wx-ghost{background:rgba(255,255,255,.08);color:#fff;border-color:rgba(255,255,255,.65)}
.wx-ghost:hover{background:#fff;color:var(--wn)}
.wx-line{background:#fff;color:var(--wn);border-color:var(--wn)}
.wx-hero{position:relative;min-height:min(84vh,700px);display:flex;align-items:center;background-size:cover;background-position:center;padding:70px max(24px,calc((100vw - 1180px)/2));border-bottom:6px solid var(--wr)}
.wx-hero .in{max-width:640px;color:#fff}
.wx-kick{display:flex;align-items:center;gap:12px;font-family:var(--ws);font-weight:700;text-transform:uppercase;letter-spacing:.16em;font-size:.8rem;margin-bottom:18px}
.wx-hero .wx-kick .wx-stars{color:#fff}
.wx-hero h1{font-family:var(--wd);font-weight:400;font-size:clamp(2.6rem,6.4vw,4.6rem);line-height:1.02;letter-spacing:.01em;text-shadow:0 4px 30px rgba(0,0,0,.35)}
.wx-hero h1 span{display:block}
.wx-hero h1 .last{display:inline-block;margin-top:6px;padding-bottom:6px;border-bottom:5px solid var(--wr)}
.wx-hero p{font-size:1.1rem;line-height:1.6;color:rgba(255,255,255,.9);margin:20px 0 26px;max-width:520px}
.wx-acts{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.wx-ticket{display:flex;margin-top:30px;background:#fff;color:var(--wink);border-radius:10px;overflow:hidden;max-width:560px;box-shadow:0 24px 50px -24px rgba(0,0,0,.6)}
.wx-ticket div{flex:1;padding:12px 16px;border-left:2px dashed var(--wline)}
.wx-ticket div:first-child{border-left:0}
.wx-ticket small{display:block;font-size:.7rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--wr)}
.wx-ticket b{font-family:var(--ws);font-size:1.02rem;color:var(--wn)}
.wx-sec{padding:76px max(24px,calc((100vw - 1180px)/2))}
.wx-soft{background:var(--wsoft);border-top:1px solid var(--wline);border-bottom:1px solid var(--wline)}
.wx-h{text-align:center;margin-bottom:34px}
.wx-orn{display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:12px}
.wx-orn i{display:block;width:70px;height:2px;background:var(--wn);opacity:.35}
.wx-h small{display:block;font-family:var(--ws);font-weight:700;text-transform:uppercase;letter-spacing:.18em;font-size:.76rem;color:var(--wr);margin-bottom:6px}
.wx-h h2{font-family:var(--wd);font-weight:400;font-size:clamp(2rem,4vw,2.9rem);color:var(--wn);line-height:1.05}
.wx-h p{color:#475569;margin-top:8px}
.wx-specials{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:18px}
.wx-sp{display:flex;gap:18px;align-items:flex-start;background:#fff;border:2px solid var(--wn);border-radius:12px;padding:22px;box-shadow:6px 6px 0 var(--wn)}
.wx-stamp{flex:none;width:86px;text-align:center;background:var(--wr);color:#fff;border-radius:10px;padding:10px 6px}
.wx-stamp b{display:block;font-family:var(--wd);font-weight:400;font-size:1.5rem;line-height:1}
.wx-stamp b svg{width:22px;height:22px}
.wx-stamp small{display:block;font-size:.66rem;font-weight:700;line-height:1.3;margin-top:6px;text-transform:uppercase;letter-spacing:.04em}
.wx-sp h3{font-family:var(--wd);font-weight:400;font-size:1.45rem;color:var(--wn);margin-bottom:6px}
.wx-sp p{color:#334155;line-height:1.55}
.wx-favs{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.wx-fav{background:#fff;border:1px solid var(--wline);border-radius:12px;overflow:hidden;box-shadow:0 18px 40px -30px rgba(15,23,42,.5);transition:transform .25s}
.wx-fav:hover{transform:translateY(-4px)}
.wx-fav .ph{height:220px;background-size:cover;background-position:center;position:relative}
.wx-pr{position:absolute;right:12px;top:12px;background:var(--wr);color:#fff;font-family:var(--ws);font-weight:800;padding:6px 10px;border-radius:6px}
.wx-fav .b{padding:18px 20px 22px;border-top:4px solid var(--wn)}
.wx-fav small{display:block;color:var(--wr);font-size:.72rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:4px}
.wx-fav h3{font-family:var(--wd);font-weight:400;font-size:1.4rem;color:var(--wn)}
.wx-fav p{color:#475569;font-size:.92rem;line-height:1.55;margin-top:6px}
.wx-tabs{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-bottom:24px}
.wx-tabs button{height:42px;padding:0 18px;border-radius:8px;border:2px solid var(--wn);background:#fff;color:var(--wn);font-family:var(--ws);font-weight:700;cursor:pointer}
.wx-tabs button.on{background:var(--wn);color:#fff}
.wx-mgrid{display:grid;grid-template-columns:.9fr 1.1fr;gap:22px;align-items:stretch}
.wx-mphoto{border-radius:12px;min-height:340px;background-size:cover;background-position:center;position:relative;overflow:hidden;border:1px solid var(--wline)}
.wx-mphoto span{position:absolute;left:18px;bottom:16px;color:#fff;font-family:var(--wd);font-size:1.6rem}
.wx-mlist{background:#fff;border:1px solid var(--wline);border-radius:12px;padding:8px 24px}
.wx-mi{padding:15px 0;border-bottom:1px dashed #CBD5E1}
.wx-mi:last-child{border-bottom:0}
.wx-mi .t{display:flex;align-items:baseline;gap:10px}
.wx-mi b{font-family:var(--ws);font-size:1.06rem;color:var(--wink)}
.wx-mi i{flex:1;border-bottom:2px dotted #CBD5E1;transform:translateY(-4px)}
.wx-mi .t span{font-family:var(--ws);font-weight:800;color:var(--wr)}
.wx-mi p{color:#64748B;font-size:.92rem;margin-top:4px;line-height:1.5}
.wx-strip{display:grid;grid-template-columns:1.3fr 1fr 1fr 1.3fr;gap:6px;height:clamp(160px,20vw,250px)}
.wx-strip .ph{background-size:cover;background-position:center}
.wx-band{background:var(--wn);color:#fff;padding:76px max(24px,calc((100vw - 1180px)/2))}
.wx-story{display:grid;grid-template-columns:1fr 1.1fr;gap:44px;align-items:center}
.wx-story .ph{min-height:380px;border-radius:12px;background-size:cover;background-position:center;border:6px solid #fff;box-shadow:12px 12px 0 var(--wr)}
.wx-story .wx-stars{color:#fff}
.wx-story h2{font-family:var(--wd);font-weight:400;font-size:clamp(2rem,3.6vw,2.8rem);line-height:1.05;margin-bottom:16px}
.wx-story p{font-size:1.06rem;line-height:1.75;color:rgba(255,255,255,.88);margin-bottom:24px}
.wx-visit{display:grid;grid-template-columns:1fr 1fr 1.1fr;gap:18px}
.wx-card{background:#fff;border:1px solid var(--wline);border-radius:12px;padding:24px;border-top:5px solid var(--wn)}
.wx-card h3{font-family:var(--wd);font-weight:400;font-size:1.5rem;color:var(--wn);margin-bottom:12px}
.wx-hours div{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--wline);font-size:.95rem}
.wx-hours div:last-child{border-bottom:0}
.wx-hours .today{font-weight:800;color:var(--wr)}
.wx-card address{font-style:normal;line-height:1.7;color:#334155;margin-bottom:16px}
.wx-card address b{color:var(--wink)}
.wx-card .socials{display:flex;gap:8px;margin-top:14px}
.wx-card .socials a{width:42px;height:42px;border:1px solid var(--wline);border-radius:10px;color:var(--wn)}
.wx-map{padding:0;overflow:hidden;border-top:5px solid var(--wr)}
.wx-map .mapbox{height:100%;min-height:240px;position:relative}
.wx-map svg{width:100%;height:100%;display:block}
.wx-map rect{fill:#EEF2F7}.wx-map g[stroke="#2c2c32"]{stroke:#fff}.wx-map g[stroke="#3a3a42"]{stroke:#DCE3EC}.wx-map path[fill="#1e3a5f"]{fill:#BFD3EE}.wx-map path[fill="var(--gold)"]{fill:var(--wr)}.wx-map circle[fill="rgba(232,163,61,.2)"]{fill:rgba(178,34,52,.18)}
.wx-map .map-go{background:var(--wr);color:#fff}
.wx-foot{background:#0F1B33;color:#CBD5E1;border-top:6px solid var(--wr)}
.wx-foot .in{display:flex;align-items:center;gap:20px;flex-wrap:wrap;padding:28px max(24px,calc((100vw - 1180px)/2));font-size:.88rem}
.wx-foot img{height:48px;width:auto;background:#fff;border-radius:8px;padding:4px}
.wx-foot span:last-child{margin-left:auto;color:#94A3B8}
@media (max-width:900px){.wx-links{display:none}.wx-nav .wx-btn{margin-left:auto}.wx-favs,.wx-visit{grid-template-columns:1fr}.wx-mgrid,.wx-story{grid-template-columns:1fr}.wx-mphoto{min-height:220px}.wx-story .ph{min-height:240px}.wx-strip{grid-template-columns:1fr 1fr;height:auto}.wx-strip .ph{height:140px}}
@media (max-width:640px){.wx-hero{padding:52px 18px;min-height:0}.wx-sec,.wx-band{padding:56px 18px}.wx-ticket{flex-direction:column}.wx-ticket div{border-left:0;border-top:2px dashed var(--wline)}.wx-ticket div:first-child{border-top:0}.wx-acts .wx-btn{flex:1 1 auto}.wx-brand img{height:46px}.wx-top{font-size:.74rem}.wx-sp{flex-direction:column}.wx-foot span:last-child{margin-left:0}}
/* ===== Western warmth (amber, leather, firelight) ===== */
.western{--wa:#D9963A;--wa2:#F2C27A;--wb:#6B3F26;--wbd:#2E1C12}
.western .ph:not(.wx-hero){filter:saturate(1.08) sepia(.1)}
.western .wx-stars{color:var(--wa)}
.wx-top{background:linear-gradient(90deg,var(--wr),#C2412D 50%,var(--wr))}
.wx-top .wx-stars,.wx-hero .wx-kick .wx-stars,.wx-story .wx-stars{color:var(--wa2)!important}
.wx-nav{border-bottom:3px solid var(--wb);box-shadow:0 2px 0 var(--wa)}
.wx-hero{border-bottom:6px solid var(--wa)}
.wx-hero h1 .last{border-bottom-color:var(--wa)}
.wx-ticket small{color:var(--wb)!important}
.wx-orn i{background:var(--wa)!important;opacity:.7!important}
.wx-h small{color:var(--wb)!important}
.wx-soft{background:linear-gradient(180deg,#FFFFFF,#F8FAFC)}
.wx-sp{box-shadow:6px 6px 0 var(--wb)!important;border-color:var(--wb)!important}
.wx-stamp{background:linear-gradient(160deg,var(--wr),#8E1B26)!important}
.wx-fav{box-shadow:0 22px 44px -30px rgba(107,63,38,.55)!important}
.wx-fav .b{border-top:4px solid var(--wa)!important}
.wx-fav small,.wx-mi .t span{color:var(--wr)}
.wx-tabs button{border-color:var(--wb)!important;color:var(--wbd)!important}
.wx-tabs button.on{background:var(--wb)!important;color:#fff!important}
.wx-mi i{border-bottom-color:rgba(217,150,58,.55)!important}
.wx-band{background:radial-gradient(circle at 15% 20%,rgba(232,160,72,.22),rgba(0,0,0,0) 45%),linear-gradient(135deg,var(--wn) 0%,#2B2236 55%,var(--wbd) 100%)!important}
.wx-story .ph{box-shadow:12px 12px 0 var(--wa)!important}
.wx-card{border-top-color:var(--wb)!important}
.wx-map{border-top-color:var(--wa)!important}
.wx-hours .today{color:var(--wb)!important}
.wx-foot{background:linear-gradient(90deg,#1A1420,var(--wbd))!important;border-top:6px solid var(--wa)!important}
.wx-red{box-shadow:0 12px 26px -12px rgba(194,65,45,.75)!important}
/* ----- Variant: Americana (bold college bar) ----- */
.v-americana{--wd:'Alfa Slab One',Georgia,serif}
.v-americana .wx-top{background:repeating-linear-gradient(90deg,var(--wr) 0 26px,#fff 26px 34px,var(--wn) 34px 60px,#fff 60px 68px);padding:12px}
.v-americana .wx-top span{background:var(--wn);color:#fff;padding:4px 12px;border-radius:6px}
.v-americana .wx-hero h1,.v-americana .wx-h h2,.v-americana .wx-sp h3,.v-americana .wx-fav h3,.v-americana .wx-story h2,.v-americana .wx-card h3{text-transform:uppercase;letter-spacing:.01em}
.v-americana .wx-hero{border-bottom:10px solid var(--wr);box-shadow:inset 0 -10px 0 #fff}
.v-americana .wx-hero h1 .last{color:#fff;background:var(--wr);border:0;padding:2px 14px 6px;border-radius:8px;margin-top:10px}
.v-americana .wx-sp{border:3px solid var(--wn)!important;box-shadow:8px 8px 0 var(--wr)!important}
.v-americana .wx-fav .b{border-top:6px solid var(--wr)!important}
.v-americana .wx-tabs button{border-color:var(--wn)!important;color:var(--wn)!important;text-transform:uppercase;font-size:.84rem}
.v-americana .wx-tabs button.on{background:var(--wr)!important;border-color:var(--wr)!important;color:#fff!important}
.v-americana .wx-band{background:linear-gradient(135deg,var(--wn),#13203F)!important;border-top:10px solid var(--wr);border-bottom:10px solid var(--wr)}
.v-americana .wx-story .ph{box-shadow:12px 12px 0 var(--wr)!important}
.v-americana .wx-stars{color:var(--wr)}.v-americana .wx-hero .wx-stars,.v-americana .wx-story .wx-stars{color:#fff!important}
.v-americana .wx-orn i{background:var(--wn)!important}
.v-americana .wx-foot{background:var(--wn)!important;border-top:8px solid var(--wr)!important}
/* ----- Variant: Ranch (clean, modern, warm) ----- */
.v-ranch{--wd:'Bitter',Georgia,serif}
.v-ranch .wx-top{background:var(--wn)}
.v-ranch .wx-nav{border-bottom:1px solid var(--wline);box-shadow:none}
.v-ranch .wx-hero{justify-content:center;text-align:center;align-items:flex-end;min-height:min(88vh,760px);border-bottom:0;padding-bottom:90px}
.v-ranch .wx-hero .in{max-width:760px;margin:0 auto}
.v-ranch .wx-hero h1{font-weight:800;letter-spacing:-.02em;font-size:clamp(2.6rem,6vw,4.4rem)}
.v-ranch .wx-hero h1 span{display:inline}.v-ranch .wx-hero h1 span+span{margin-left:.25em}
.v-ranch .wx-hero h1 .last{border:0;color:var(--wa2);padding:0;margin:0 0 0 .25em}
.v-ranch .wx-hero p{margin-left:auto;margin-right:auto}
.v-ranch .wx-kick,.v-ranch .wx-acts{justify-content:center}
.v-ranch .wx-ticket{margin:30px auto 0;text-align:left}
.v-ranch .wx-h h2,.v-ranch .wx-sp h3,.v-ranch .wx-fav h3,.v-ranch .wx-story h2,.v-ranch .wx-card h3{font-weight:800;letter-spacing:-.02em}
.v-ranch .wx-sp{border:1px solid var(--wline)!important;box-shadow:0 20px 44px -30px rgba(107,63,38,.5)!important}
.v-ranch .wx-tabs button{border:1px solid var(--wline)!important;color:var(--wbd)!important;font-weight:700}
.v-ranch .wx-tabs button.on{background:var(--wbd)!important;border-color:var(--wbd)!important;color:#fff!important}
.v-ranch .wx-fav .b{border-top:0!important}
.v-ranch .wx-band{background:#fff!important;color:var(--wink);border-top:1px solid var(--wline);border-bottom:1px solid var(--wline)}
.v-ranch .wx-band h2{color:var(--wn)}.v-ranch .wx-band p{color:#475569}
.v-ranch .wx-band .wx-kick{color:var(--wb)}
.v-ranch .wx-band .wx-ghost{color:var(--wn);border-color:var(--wn)}
.v-ranch .wx-story .ph{border:0;box-shadow:none!important;border-radius:12px}
.v-ranch .wx-card{border-top:1px solid var(--wline)!important}
.v-ranch .wx-foot{background:var(--wn)!important;border-top:0!important}
.v-ranch .wx-hero{background-position:center 60%}
/* ----- Calm tone for all western styles: dim-bar mood, colors kept but muted ----- */
.western{--wa:#B98A55;--wa2:#D9B48A;--wb:#5A4234;--wbd:#2A211C}
.western .ph:not(.wx-hero){filter:saturate(.88) sepia(.12) brightness(.96)}
.western .wx-red{box-shadow:none!important}
.western .wx-btn:hover{transform:none}
.wx-top{background:var(--wn)!important;font-weight:600;letter-spacing:.12em;opacity:.97}
.wx-top .wx-stars{color:var(--wa2)!important}
.wx-nav{border-bottom:1px solid var(--wline)!important;box-shadow:none!important}
.wx-hero{border-bottom:3px solid var(--wb)!important}
.wx-hero h1 .last{border-bottom-width:3px!important}
.wx-sp{border:1px solid var(--wline)!important;box-shadow:0 16px 36px -28px rgba(42,33,28,.6)!important}
.wx-stamp{background:var(--wr)!important}
.wx-fav{box-shadow:0 16px 36px -30px rgba(42,33,28,.55)!important}
.wx-fav .b{border-top:2px solid var(--wa)!important}
.wx-fav:hover{transform:none}
.wx-band{background:linear-gradient(135deg,#252B3A 0%,var(--wbd) 100%)!important;border:0!important}
.wx-story .ph{border:0!important;box-shadow:none!important}
.wx-card{border-top:2px solid var(--wb)!important}
.wx-map{border-top:2px solid var(--wa)!important}
.wx-foot{background:#1B1A1F!important;border-top:2px solid var(--wb)!important}
/* Americana layout without the flag look */
.v-americana .wx-top{background:var(--wn)!important;padding:9px 16px}
.v-americana .wx-top span{background:none;padding:0}
.v-americana .wx-hero{box-shadow:none;border-bottom:3px solid var(--wb)!important}
.v-americana .wx-hero h1 .last{background:rgba(255,255,255,.08);color:var(--wa2);border:1px solid rgba(217,180,138,.35)!important;padding:2px 14px 6px}
.v-americana .wx-sp{border:1px solid var(--wline)!important;box-shadow:0 16px 36px -28px rgba(42,33,28,.6)!important}
.v-americana .wx-fav .b{border-top:2px solid var(--wa)!important}
.v-americana .wx-tabs button.on{background:var(--wbd)!important;border-color:var(--wbd)!important}
.v-americana .wx-band{border:0!important}
.v-americana .wx-stars{color:var(--wa)}
.v-americana .wx-foot{background:#1B1A1F!important;border-top:2px solid var(--wb)!important}
/* Reviews */
.wx-hrev{margin-top:30px;max-width:540px;background:rgba(20,16,14,.55);border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:18px 20px;backdrop-filter:blur(6px);transition:opacity .35s}
.wx-hrev.fade{opacity:.15}
.wx-hrev .row{display:flex;align-items:center;gap:12px;justify-content:space-between}
.wx-hrev .row small{font-size:.72rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7)}
.wx-hrev .wx-stars{color:var(--wa2)!important}
.wx-hrev blockquote{margin:10px 0;font-family:var(--ws);font-size:1.02rem;line-height:1.55;color:#fff}
.wx-hrev .row span{font-weight:700;color:rgba(255,255,255,.85);font-size:.9rem}
.wx-hrev button{background:none;border:0;color:var(--wa2);font-weight:700;cursor:pointer;font-size:.9rem;text-decoration:underline;text-underline-offset:3px;padding:0}
.v-ranch .wx-hrev{margin:30px auto 0;text-align:left}
.wx-revs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.wx-rev{margin:0;background:#fff;border:1px solid var(--wline);border-radius:12px;padding:22px}
.wx-rev.more{display:none}
.wx-rev .st .wx-stars{color:var(--wa)!important}
.wx-rev blockquote{margin:10px 0 12px;font-family:var(--ws);line-height:1.6;color:var(--wink)}
.wx-rev figcaption{font-weight:700;color:var(--wb);font-size:.9rem}
.wx-center{justify-content:center;margin-top:24px}
@media (max-width:900px){.wx-revs{grid-template-columns:1fr}}
@media (max-width:640px){.rb-bar .t span{display:none}.pub-nav,.pub-foot,.lg-nav,.lg-foot,.tr-top,.tr-nav,.tr-foot,.pub-hero,.lg-hero,.tr-hero{padding-left:18px!important;padding-right:18px!important}}
'''

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://script.google.com https://script.googleusercontent.com; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'">
<title>Website Preview | Riverbend Web Co.</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Bitter:wght@500;700;800&family=Rye&display=swap" rel="stylesheet">
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
