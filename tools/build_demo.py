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
.wx-book{margin-top:14px}
.wx-toplink{background:none;border:0;color:#fff;font:inherit;font-size:.8rem;text-decoration:underline;text-underline-offset:3px;cursor:pointer;opacity:.9}
.wx-book+.wx-book{margin-left:8px}
.wx-lb{position:fixed;inset:0;z-index:100;background:rgba(15,12,10,.86);display:grid;place-items:center;padding:20px}
.wx-lb .in{background:#fff;border-radius:12px;max-width:min(720px,100%);width:100%;overflow:hidden}
.wx-lb .bar{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid #E2E8F0;font-family:Bitter,Georgia,serif}
.wx-lb .bar span{color:#64748B;font-size:.85rem;margin-left:auto}
.wx-lb button{height:38px;padding:0 14px;border-radius:8px;border:1px solid #CBD5E1;background:#fff;font-weight:700;cursor:pointer}
.wx-lb img{display:block;width:100%;max-height:70vh;object-fit:contain;background:#111}
.wx-lb .nav{display:flex;justify-content:space-between;padding:12px 16px}
.wx-spicy{white-space:nowrap;font-weight:700;color:#9A3412}
.wx-heat{width:15px;height:15px;color:#C2410C;vertical-align:-2px;margin-left:3px}
.wx-favsec{position:relative}
.wx-jump{position:absolute;top:28px;right:max(24px,calc((100vw - 1180px)/2));display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 14px;border-radius:8px;border:1px solid var(--wline);background:#fff;color:var(--wbd);font-family:var(--ws);font-weight:700;font-size:.85rem;cursor:pointer;box-shadow:0 8px 20px -14px rgba(42,33,28,.5)}
.wx-jump:hover{border-color:var(--wb)}
.wx-jump span{font-size:1rem;line-height:1}
@media (max-width:640px){.wx-jump{top:14px;right:14px;height:32px;padding:0 10px;font-size:.78rem}}
.wx-strip{position:relative}
.wx-strip button.ph{border:0;padding:0;cursor:zoom-in;transition:filter .2s}
.wx-strip button.ph:hover{filter:brightness(1.12)}
.wx-more{position:absolute;right:16px;bottom:16px;height:38px;padding:0 14px;border-radius:8px;border:0;background:rgba(20,16,14,.78);color:#fff;font-weight:700;font-size:.88rem;cursor:pointer}
/* ----- Variant: Trail (outdoorsy, dusty, trail riders) ----- */
.v-trail{--wn:#2F4A35;--wr:#B5521B;--wink:#23201C;--wline:#D3DCCF;--wsoft:#EEF3EC;--wd:'Alfa Slab One',Georgia,serif;background:#F7F9F5}
.v-trail{--wa:#D98A4E;--wa2:#F2B27C;--wb:#2F4A35;--wbd:#1F2E22}
.v-trail .wx-band{background:linear-gradient(135deg,#2F4A35 0%,#3B5A40 55%,#1F2E22 100%)!important}
.v-trail .wx-foot{background:#1F2E22!important;border-top:6px solid #B5521B!important}
.v-trail .wx-stamp{background:#B5521B!important}
.v-trail .wx-top{background:#2F4A35;letter-spacing:.06em}
.v-trail .wx-nav{border-bottom:4px solid #B5521B}
.v-trail .wx-hero{border-bottom:0;min-height:min(86vh,720px)}
.v-trail .wx-hero::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:46px;background:#F7F9F5;clip-path:polygon(0 70%,8% 40%,16% 62%,27% 22%,38% 58%,49% 30%,60% 64%,71% 26%,82% 56%,91% 34%,100% 60%,100% 100%,0 100%)}
.v-trail .wx-hero h1 .last{border-bottom-color:#E08A4C}
.v-trail .wx-soft{background:#EEF3EC url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%232F4A35' stroke-opacity='.07' stroke-width='1.5'%3E%3Cpath d='M-10 60 Q60 20 120 60 T250 60'/%3E%3Cpath d='M-10 90 Q60 50 120 90 T250 90'/%3E%3Cpath d='M-10 150 Q60 110 120 150 T250 150'/%3E%3Cpath d='M-10 190 Q60 150 120 190 T250 190'/%3E%3C/g%3E%3C/svg%3E")}
.v-trail .wx-sp,.v-trail .wx-fav,.v-trail .wx-mlist,.v-trail .wx-card{border-radius:6px}
.v-trail .wx-band{background:#2F4A35}
.v-trail #w-menu{position:relative;overflow:hidden}
.tw-utv{position:absolute;right:max(18px,calc((100vw - 1180px)/2 - 10px));top:30px;width:clamp(130px,19vw,250px);color:#B5521B;pointer-events:none}
.tw-utv svg{display:block;width:100%;height:auto}
.tw{padding:70px max(24px,calc((100vw - 1180px)/2)) 60px;background:#F7F9F5}
.tw-head{text-align:center;margin-bottom:26px}
.tw-head small{display:block;font-family:var(--ws);font-weight:800;text-transform:uppercase;letter-spacing:.2em;font-size:.8rem;color:var(--wr)}
.tw-head h2{font-family:var(--wd);font-weight:400;font-size:clamp(2.4rem,6vw,4.2rem);color:var(--wn);line-height:1;text-transform:uppercase;margin-top:6px}
.tw-stage{position:relative}
.tw-slide{display:grid;grid-template-columns:1.1fr .9fr;min-height:clamp(380px,42vw,500px);border-radius:8px;overflow:hidden;color:#fff;box-shadow:0 30px 60px -36px rgba(35,32,28,.7);background:#2F4A35 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260' viewBox='0 0 260 260'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='.06' stroke-width='1.5'%3E%3Cpath d='M-10 50 Q70 10 130 50 T270 50'/%3E%3Cpath d='M-10 85 Q70 45 130 85 T270 85'/%3E%3Cpath d='M-10 120 Q70 80 130 120 T270 120'/%3E%3Cpath d='M-10 170 Q70 130 130 170 T270 170'/%3E%3Cpath d='M-10 215 Q70 175 130 215 T270 215'/%3E%3C/g%3E%3C/svg%3E")}
.tw-in{grid-column:1;grid-row:1;align-self:center;padding:40px clamp(24px,4.5vw,56px);max-width:620px}
.tw-pic{grid-column:2;grid-row:1;background-size:cover;background-position:center;position:relative;min-height:260px}
.tw-pic span{position:absolute;right:14px;bottom:10px;font-family:var(--wd);font-size:clamp(3rem,7vw,5.5rem);line-height:1;color:rgba(255,255,255,.9);text-shadow:0 4px 24px rgba(0,0,0,.5)}
.tw-day{font-family:var(--wd);font-size:clamp(1.1rem,2.2vw,1.5rem);letter-spacing:.14em;color:#F2B27C;display:flex;align-items:center;gap:12px}
.tw-day em{font-style:normal;font-family:var(--ws);font-weight:800;font-size:.78rem;letter-spacing:.12em;background:#B5521B;color:#fff;padding:5px 10px;border-radius:4px}
.tw-slide h3{font-family:var(--wd);font-weight:400;font-size:clamp(2.4rem,6vw,4.6rem);line-height:.98;text-transform:uppercase;margin:10px 0 16px;text-shadow:0 6px 30px rgba(0,0,0,.4)}
.tw-time{display:inline-flex;align-items:center;gap:8px;font-family:var(--ws);font-weight:800;font-size:1.2rem;background:rgba(255,255,255,.14);border:2px solid rgba(255,255,255,.5);padding:8px 14px;border-radius:6px;margin-bottom:14px}
.tw-time svg{color:#F2B27C}
.tw-slide p{font-size:1.12rem;line-height:1.6;color:rgba(255,255,255,.92);margin-bottom:10px;max-width:540px}
.tw-slide small{display:block;color:rgba(255,255,255,.72);font-size:.9rem;margin-bottom:18px}
.tw-arrow{position:absolute;top:50%;transform:translateY(-50%);width:48px;height:48px;border-radius:6px;border:0;background:rgba(255,255,255,.92);color:#2F4A35;font-size:2rem;line-height:1;cursor:pointer;box-shadow:0 10px 20px -10px rgba(0,0,0,.5)}
.tw-arrow.l{left:-18px}.tw-arrow.r{right:-18px}
.tw-tabs{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-top:14px}
.tw-tabs button{background:#fff;border:2px solid #D3DCCF;border-radius:6px;padding:10px 10px 12px;cursor:pointer;text-align:left;transition:border-color .2s,background .2s}
.tw-tabs button b{display:block;font-family:var(--wd);font-weight:400;font-size:1.15rem;color:#2F4A35}
.tw-tabs button span{display:block;font-size:.8rem;font-weight:700;color:#5B6B5C;line-height:1.3;margin-top:2px}
.tw-tabs button.on{background:#2F4A35;border-color:#2F4A35}
.tw-tabs button.on b{color:#F2B27C}.tw-tabs button.on span{color:#fff}
.tw-banner{margin-top:18px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px 18px;background:#B5521B;color:#fff;border-radius:6px;padding:18px 22px;text-align:center}
.tw-banner b{font-family:var(--wd);font-weight:400;font-size:clamp(1.4rem,3vw,2rem);text-transform:uppercase}
.tw-banner span{font-weight:700;font-size:1.02rem}
.tw-ride{display:grid;grid-template-columns:1.1fr 1fr;background:#2F4A35;color:#fff}
.tw-ride .ph{min-height:440px;background-size:cover;background-position:center}
.tw-ride .b{padding:60px clamp(24px,5vw,64px);display:flex;flex-direction:column;justify-content:center}
.tw-ride small{font-family:var(--ws);font-weight:800;text-transform:uppercase;letter-spacing:.2em;font-size:.78rem;color:#F2B27C}
.tw-ride h2{font-family:var(--wd);font-weight:400;font-size:clamp(2rem,4.4vw,3.2rem);line-height:1.02;text-transform:uppercase;margin:8px 0 14px}
.tw-ride p{font-size:1.06rem;line-height:1.7;color:rgba(255,255,255,.88)}
.tw-ride ul{list-style:none;margin:16px 0 24px;display:grid;gap:8px}
.tw-ride li{display:flex;gap:10px;align-items:center;font-weight:700}
.tw-ride li svg{color:#F2B27C;flex:none}
.tw-ride .wx-line{background:transparent;color:#fff;border-color:rgba(255,255,255,.7)}
@media (max-width:860px){.tw-arrow{display:none}.tw-ride{grid-template-columns:1fr}.tw-ride .ph{min-height:240px}.tw-tabs{grid-template-columns:repeat(4,1fr)}.tw-tabs button span{display:none}.tw-utv{top:12px;width:96px;opacity:.85}.tw-slide{grid-template-columns:1fr}.tw-pic{grid-row:1;grid-column:1;min-height:230px}.tw-in{grid-row:2;padding:24px 20px 26px}}
.v-trail .ph:not(.wx-hero){filter:saturate(1.02) brightness(1.02)}
.v-trail .tw-pic{filter:none}
.v-trail .wx-strip{grid-template-columns:repeat(4,1fr);height:auto;position:relative}
.v-trail .wx-strip .ph{height:clamp(150px,19vw,250px);border:0;cursor:pointer}
@media (max-width:640px){.v-trail .wx-strip{grid-template-columns:repeat(2,1fr)}.v-trail .wx-strip .ph{height:150px}}
.v-trail .wx-top{background:#2F4A35!important}
.v-trail .wx-nav{border-bottom:4px solid #B5521B!important}
.tf{padding:20px max(24px,calc((100vw - 1180px)/2)) 70px;background:#F7F9F5}
.tf-top{display:grid;grid-template-columns:1fr 1fr;gap:0;background:#fff;border:1px solid #D3DCCF;border-radius:8px;overflow:hidden;box-shadow:0 26px 50px -36px rgba(35,32,28,.6)}
.tf-pic{min-height:440px;background-size:cover;background-position:center;position:relative}
.tf-pic span{position:absolute;left:16px;top:16px;background:#B5521B;color:#fff;font-family:var(--ws);font-weight:800;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;padding:8px 12px;border-radius:4px}
.tf-b{padding:44px clamp(24px,4vw,52px);display:flex;flex-direction:column;justify-content:center}
.tf-b small{font-family:var(--ws);font-weight:800;text-transform:uppercase;letter-spacing:.2em;font-size:.78rem;color:#B5521B}
.tf-b h2{font-family:var(--wd);font-weight:400;font-size:clamp(2.6rem,6vw,4.4rem);line-height:.98;color:#2F4A35;text-transform:uppercase;margin:8px 0 16px}
.tf-q{font-size:1.14rem;line-height:1.65;color:#23201C}
.tf-src{font-size:.86rem;color:#5B6B5C;margin:10px 0 22px}
.tf-how{margin-top:18px;background:#2F4A35;color:#fff;border-radius:8px;padding:34px clamp(22px,4vw,48px)}
.tf-how h3{font-family:var(--wd);font-weight:400;font-size:clamp(1.6rem,3.4vw,2.3rem);text-transform:uppercase;line-height:1.05}
.tf-sub{color:rgba(255,255,255,.82);margin-top:6px}
.tf-how ol{list-style:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin:22px 0 18px;padding:0}
.tf-how li{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.18);border-radius:6px;padding:16px;display:flex;gap:12px;align-items:flex-start;line-height:1.5;font-size:.96rem}
.tf-how li b{flex:none;width:34px;height:34px;border-radius:6px;background:#B5521B;color:#fff;font-family:var(--wd);font-weight:400;font-size:1.1rem;display:flex;align-items:center;justify-content:center}
.tf-note{color:#F2B27C;font-weight:700;margin-bottom:16px}
.tf-how .wx-line{background:transparent;color:#fff;border-color:rgba(255,255,255,.7)}
@media (max-width:860px){.tf-top{grid-template-columns:1fr}.tf-pic{min-height:280px}}
/* Trail: SVG section backgrounds */
.v-trail .tw{background:#F7F9F5 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1440' height='260' viewBox='0 0 1440 260'%3E%3Cpath d='M0 170 C180 120 320 150 480 130 S800 90 980 140 S1280 110 1440 150 V260 H0Z' fill='%232F4A35' fill-opacity='.06'/%3E%3Cg fill='%232F4A35' fill-opacity='.08'%3E%3Cpath d='M466 164 L474 200 L459 200Z'/%3E%3Cpath d='M937 167 L944 200 L930 200Z'/%3E%3Cpath d='M772 155 L781 200 L762 200Z'/%3E%3Cpath d='M84 150 L94 200 L73 200Z'/%3E%3Cpath d='M54 153 L64 200 L44 200Z'/%3E%3Cpath d='M101 166 L108 200 L94 200Z'/%3E%3Cpath d='M611 137 L625 200 L598 200Z'/%3E%3Cpath d='M178 161 L186 200 L170 200Z'/%3E%3Cpath d='M904 132 L918 200 L889 200Z'/%3E%3Cpath d='M831 154 L841 200 L821 200Z'/%3E%3Cpath d='M1406 168 L1412 200 L1399 200Z'/%3E%3Cpath d='M1236 158 L1245 200 L1227 200Z'/%3E%3Cpath d='M208 165 L215 200 L200 200Z'/%3E%3Cpath d='M444 137 L457 200 L431 200Z'/%3E%3Cpath d='M260 147 L271 200 L249 200Z'/%3E%3Cpath d='M920 155 L929 200 L911 200Z'/%3E%3Cpath d='M789 167 L796 200 L782 200Z'/%3E%3Cpath d='M86 162 L94 200 L78 200Z'/%3E%3Cpath d='M980 153 L990 200 L970 200Z'/%3E%3Cpath d='M452 147 L464 200 L441 200Z'/%3E%3Cpath d='M653 158 L661 200 L644 200Z'/%3E%3Cpath d='M1144 142 L1156 200 L1132 200Z'/%3E%3Cpath d='M351 147 L363 200 L340 200Z'/%3E%3Cpath d='M756 135 L770 200 L743 200Z'/%3E%3Cpath d='M1050 158 L1059 200 L1042 200Z'/%3E%3Cpath d='M1411 165 L1419 200 L1404 200Z'/%3E%3Cpath d='M602 140 L615 200 L589 200Z'/%3E%3Cpath d='M219 150 L229 200 L208 200Z'/%3E%3Cpath d='M56 143 L68 200 L45 200Z'/%3E%3Cpath d='M1101 147 L1112 200 L1090 200Z'/%3E%3Cpath d='M1261 157 L1270 200 L1252 200Z'/%3E%3Cpath d='M1001 146 L1013 200 L990 200Z'/%3E%3Cpath d='M835 152 L845 200 L825 200Z'/%3E%3Cpath d='M1210 132 L1224 200 L1195 200Z'/%3E%3Cpath d='M683 143 L695 200 L671 200Z'/%3E%3Cpath d='M87 142 L100 200 L75 200Z'/%3E%3Cpath d='M932 130 L947 200 L917 200Z'/%3E%3Cpath d='M1184 159 L1192 200 L1175 200Z'/%3E%3Cpath d='M556 143 L567 200 L544 200Z'/%3E%3Cpath d='M32 152 L43 200 L22 200Z'/%3E%3Cpath d='M242 165 L249 200 L235 200Z'/%3E%3Cpath d='M85 139 L98 200 L72 200Z'/%3E%3Cpath d='M186 160 L195 200 L178 200Z'/%3E%3Cpath d='M563 135 L577 200 L549 200Z'/%3E%3Cpath d='M116 152 L126 200 L106 200Z'/%3E%3Cpath d='M791 135 L805 200 L777 200Z'/%3E%3Cpath d='M1180 135 L1193 200 L1166 200Z'/%3E%3Cpath d='M401 153 L411 200 L391 200Z'/%3E%3Cpath d='M517 135 L530 200 L503 200Z'/%3E%3Cpath d='M1379 164 L1387 200 L1372 200Z'/%3E%3Cpath d='M254 161 L262 200 L246 200Z'/%3E%3Cpath d='M336 151 L346 200 L326 200Z'/%3E%3Cpath d='M848 159 L857 200 L840 200Z'/%3E%3Cpath d='M6 153 L16 200 L-4 200Z'/%3E%3Cpath d='M532 147 L543 200 L521 200Z'/%3E%3Cpath d='M1372 142 L1385 200 L1360 200Z'/%3E%3Cpath d='M742 145 L754 200 L731 200Z'/%3E%3Cpath d='M974 168 L980 200 L967 200Z'/%3E%3Cpath d='M1295 139 L1308 200 L1282 200Z'/%3E%3Cpath d='M1259 138 L1272 200 L1246 200Z'/%3E%3C/g%3E%3Cpath d='M0 210 C220 180 420 205 640 190 S1060 170 1240 200 S1380 195 1440 190 V260 H0Z' fill='%232F4A35' fill-opacity='.09'/%3E%3C/svg%3E") center bottom/1440px auto repeat-x;padding-bottom:110px}
.v-trail .tf{background:#F7F9F5 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220'%3E%3Cg fill='%23B5521B' fill-opacity='.035' transform='rotate(-24 110 110)'%3E%3Crect x='-60' y='60' width='8' height='22' rx='2'/%3E%3Crect x='-60' y='138' width='8' height='22' rx='2'/%3E%3Crect x='-42' y='60' width='8' height='22' rx='2'/%3E%3Crect x='-42' y='138' width='8' height='22' rx='2'/%3E%3Crect x='-24' y='60' width='8' height='22' rx='2'/%3E%3Crect x='-24' y='138' width='8' height='22' rx='2'/%3E%3Crect x='-6' y='60' width='8' height='22' rx='2'/%3E%3Crect x='-6' y='138' width='8' height='22' rx='2'/%3E%3Crect x='12' y='60' width='8' height='22' rx='2'/%3E%3Crect x='12' y='138' width='8' height='22' rx='2'/%3E%3Crect x='30' y='60' width='8' height='22' rx='2'/%3E%3Crect x='30' y='138' width='8' height='22' rx='2'/%3E%3Crect x='48' y='60' width='8' height='22' rx='2'/%3E%3Crect x='48' y='138' width='8' height='22' rx='2'/%3E%3Crect x='66' y='60' width='8' height='22' rx='2'/%3E%3Crect x='66' y='138' width='8' height='22' rx='2'/%3E%3Crect x='84' y='60' width='8' height='22' rx='2'/%3E%3Crect x='84' y='138' width='8' height='22' rx='2'/%3E%3Crect x='102' y='60' width='8' height='22' rx='2'/%3E%3Crect x='102' y='138' width='8' height='22' rx='2'/%3E%3Crect x='120' y='60' width='8' height='22' rx='2'/%3E%3Crect x='120' y='138' width='8' height='22' rx='2'/%3E%3Crect x='138' y='60' width='8' height='22' rx='2'/%3E%3Crect x='138' y='138' width='8' height='22' rx='2'/%3E%3Crect x='156' y='60' width='8' height='22' rx='2'/%3E%3Crect x='156' y='138' width='8' height='22' rx='2'/%3E%3Crect x='174' y='60' width='8' height='22' rx='2'/%3E%3Crect x='174' y='138' width='8' height='22' rx='2'/%3E%3Crect x='192' y='60' width='8' height='22' rx='2'/%3E%3Crect x='192' y='138' width='8' height='22' rx='2'/%3E%3Crect x='210' y='60' width='8' height='22' rx='2'/%3E%3Crect x='210' y='138' width='8' height='22' rx='2'/%3E%3Crect x='228' y='60' width='8' height='22' rx='2'/%3E%3Crect x='228' y='138' width='8' height='22' rx='2'/%3E%3Crect x='246' y='60' width='8' height='22' rx='2'/%3E%3Crect x='246' y='138' width='8' height='22' rx='2'/%3E%3Crect x='264' y='60' width='8' height='22' rx='2'/%3E%3Crect x='264' y='138' width='8' height='22' rx='2'/%3E%3Crect x='282' y='60' width='8' height='22' rx='2'/%3E%3Crect x='282' y='138' width='8' height='22' rx='2'/%3E%3C/g%3E%3C/svg%3E") 0 0/220px 220px}
.v-trail .wx-favsec{background:#F7F9F5 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Cg fill='%23000' fill-opacity='0'%3E%3C/g%3E%3Cg fill='%232F4A35' fill-opacity='.05'%3E%3Cpath d='M40 120 L58 160 L22 160Z'/%3E%3Cpath d='M40 100 L54 132 L26 132Z'/%3E%3Crect x='37' y='160' width='6' height='10'/%3E%3Cpath d='M210 250 L232 296 L188 296Z'/%3E%3Cpath d='M210 228 L227 266 L193 266Z'/%3E%3Cpath d='M250 40 L262 66 L238 66Z'/%3E%3C/g%3E%3Cg fill='none' stroke='%23B5521B' stroke-opacity='.08' stroke-width='2'%3E%3Cpath d='M120 210 q10 -14 20 0 q10 14 20 0'/%3E%3C/g%3E%3C/svg%3E") 0 0/300px 300px}
.v-trail #w-menu{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Cg fill='%23000' fill-opacity='0'%3E%3C/g%3E%3Cg fill='%232F4A35' fill-opacity='.05'%3E%3Cpath d='M40 120 L58 160 L22 160Z'/%3E%3Cpath d='M40 100 L54 132 L26 132Z'/%3E%3Crect x='37' y='160' width='6' height='10'/%3E%3Cpath d='M210 250 L232 296 L188 296Z'/%3E%3Cpath d='M210 228 L227 266 L193 266Z'/%3E%3Cpath d='M250 40 L262 66 L238 66Z'/%3E%3C/g%3E%3Cg fill='none' stroke='%23B5521B' stroke-opacity='.08' stroke-width='2'%3E%3Cpath d='M120 210 q10 -14 20 0 q10 14 20 0'/%3E%3C/g%3E%3C/svg%3E"),url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240' viewBox='0 0 240 240'%3E%3Cg fill='none' stroke='%232F4A35' stroke-opacity='.07' stroke-width='1.5'%3E%3Cpath d='M-10 60 Q60 20 120 60 T250 60'/%3E%3Cpath d='M-10 90 Q60 50 120 90 T250 90'/%3E%3Cpath d='M-10 150 Q60 110 120 150 T250 150'/%3E%3Cpath d='M-10 190 Q60 150 120 190 T250 190'/%3E%3C/g%3E%3C/svg%3E");background-size:420px 420px,240px 240px;background-color:#EEF3EC}
.v-trail .tw-ride .b{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='900' height='440' viewBox='0 0 900 440' preserveAspectRatio='xMidYMax slice'%3E%3Cg fill='%23fff' fill-opacity='.35'%3E%3Ccircle cx='353' cy='86' r='1'/%3E%3Ccircle cx='433' cy='86' r='1'/%3E%3Ccircle cx='61' cy='50' r='1'/%3E%3Ccircle cx='99' cy='124' r='1'/%3E%3Ccircle cx='0' cy='39' r='1'/%3E%3Ccircle cx='854' cy='127' r='1'/%3E%3Ccircle cx='787' cy='127' r='1'/%3E%3Ccircle cx='571' cy='192' r='1.5'/%3E%3Ccircle cx='427' cy='32' r='2'/%3E%3Ccircle cx='894' cy='99' r='2'/%3E%3Ccircle cx='281' cy='37' r='1.5'/%3E%3Ccircle cx='666' cy='101' r='1'/%3E%3Ccircle cx='465' cy='49' r='1.5'/%3E%3Ccircle cx='132' cy='113' r='1'/%3E%3Ccircle cx='682' cy='67' r='1'/%3E%3Ccircle cx='627' cy='60' r='1.5'/%3E%3Ccircle cx='817' cy='78' r='1'/%3E%3Ccircle cx='479' cy='158' r='1.5'/%3E%3Ccircle cx='573' cy='127' r='1'/%3E%3Ccircle cx='725' cy='165' r='1'/%3E%3Ccircle cx='180' cy='104' r='1'/%3E%3Ccircle cx='891' cy='160' r='2'/%3E%3Ccircle cx='233' cy='142' r='1.5'/%3E%3Ccircle cx='403' cy='188' r='1.5'/%3E%3Ccircle cx='860' cy='79' r='1'/%3E%3Ccircle cx='92' cy='99' r='1.5'/%3E%3Ccircle cx='184' cy='129' r='1'/%3E%3Ccircle cx='432' cy='134' r='1'/%3E%3Ccircle cx='751' cy='33' r='2'/%3E%3Ccircle cx='704' cy='153' r='2'/%3E%3Ccircle cx='800' cy='92' r='1.5'/%3E%3Ccircle cx='78' cy='190' r='2'/%3E%3Ccircle cx='417' cy='151' r='1'/%3E%3Ccircle cx='652' cy='42' r='1'/%3E%3Ccircle cx='25' cy='122' r='2'/%3E%3Ccircle cx='726' cy='38' r='2'/%3E%3Ccircle cx='592' cy='77' r='1'/%3E%3Ccircle cx='19' cy='162' r='1'/%3E%3Ccircle cx='474' cy='187' r='2'/%3E%3Ccircle cx='888' cy='47' r='1'/%3E%3C/g%3E%3Cpath d='M0 330 L90 270 L150 300 L240 220 L330 290 L420 240 L520 300 L610 230 L700 280 L790 250 L900 300 V440 H0Z' fill='%231F2E22' fill-opacity='.55'/%3E%3Cg fill='%2316231A' fill-opacity='.7'%3E%3Cpath d='M25 389 L36 440 L15 440Z'/%3E%3Cpath d='M451 362 L467 440 L435 440Z'/%3E%3Cpath d='M293 373 L308 440 L279 440Z'/%3E%3Cpath d='M751 397 L760 440 L742 440Z'/%3E%3Cpath d='M666 355 L684 440 L648 440Z'/%3E%3Cpath d='M596 359 L613 440 L579 440Z'/%3E%3Cpath d='M465 359 L482 440 L448 440Z'/%3E%3Cpath d='M790 393 L800 440 L781 440Z'/%3E%3Cpath d='M137 374 L150 440 L123 440Z'/%3E%3Cpath d='M786 361 L802 440 L769 440Z'/%3E%3Cpath d='M548 361 L564 440 L531 440Z'/%3E%3Cpath d='M135 393 L145 440 L125 440Z'/%3E%3Cpath d='M557 394 L567 440 L548 440Z'/%3E%3Cpath d='M56 366 L71 440 L40 440Z'/%3E%3Cpath d='M478 376 L491 440 L464 440Z'/%3E%3Cpath d='M699 356 L717 440 L681 440Z'/%3E%3Cpath d='M51 390 L62 440 L41 440Z'/%3E%3Cpath d='M38 395 L47 440 L29 440Z'/%3E%3Cpath d='M407 399 L416 440 L398 440Z'/%3E%3Cpath d='M805 397 L814 440 L796 440Z'/%3E%3Cpath d='M293 351 L312 440 L274 440Z'/%3E%3Cpath d='M546 390 L556 440 L535 440Z'/%3E%3Cpath d='M249 375 L263 440 L236 440Z'/%3E%3Cpath d='M727 375 L740 440 L713 440Z'/%3E%3Cpath d='M223 374 L237 440 L209 440Z'/%3E%3Cpath d='M788 354 L807 440 L770 440Z'/%3E%3Cpath d='M831 355 L848 440 L813 440Z'/%3E%3Cpath d='M182 378 L195 440 L169 440Z'/%3E%3Cpath d='M375 380 L387 440 L362 440Z'/%3E%3Cpath d='M284 366 L300 440 L269 440Z'/%3E%3Cpath d='M386 389 L396 440 L375 440Z'/%3E%3Cpath d='M273 394 L282 440 L263 440Z'/%3E%3Cpath d='M699 353 L718 440 L681 440Z'/%3E%3Cpath d='M579 382 L591 440 L567 440Z'/%3E%3Cpath d='M228 393 L238 440 L218 440Z'/%3E%3Cpath d='M421 363 L437 440 L405 440Z'/%3E%3Cpath d='M85 356 L102 440 L67 440Z'/%3E%3Cpath d='M147 367 L162 440 L131 440Z'/%3E%3Cpath d='M201 365 L217 440 L186 440Z'/%3E%3Cpath d='M895 380 L907 440 L882 440Z'/%3E%3Cpath d='M379 382 L391 440 L367 440Z'/%3E%3Cpath d='M83 382 L95 440 L71 440Z'/%3E%3Cpath d='M304 377 L317 440 L291 440Z'/%3E%3Cpath d='M633 381 L645 440 L620 440Z'/%3E%3Cpath d='M466 385 L477 440 L454 440Z'/%3E%3C/g%3E%3C/svg%3E") center bottom/cover no-repeat}
.v-trail .wx-band{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1440' height='520' viewBox='0 0 1440 520' preserveAspectRatio='xMidYMax slice'%3E%3Ccircle cx='1260' cy='90' r='34' fill='%23F2B27C' fill-opacity='.12'/%3E%3Cg fill='%231F2E22' fill-opacity='.45'%3E%3Cpath d='M1384 451 L1398 520 L1369 520Z'/%3E%3Cpath d='M1323 442 L1339 520 L1306 520Z'/%3E%3Cpath d='M1262 453 L1276 520 L1248 520Z'/%3E%3Cpath d='M392 388 L419 520 L364 520Z'/%3E%3Cpath d='M261 400 L287 520 L236 520Z'/%3E%3Cpath d='M1180 392 L1207 520 L1154 520Z'/%3E%3Cpath d='M973 384 L1002 520 L945 520Z'/%3E%3Cpath d='M585 417 L606 520 L563 520Z'/%3E%3Cpath d='M741 420 L762 520 L720 520Z'/%3E%3Cpath d='M471 438 L488 520 L454 520Z'/%3E%3Cpath d='M1151 445 L1167 520 L1136 520Z'/%3E%3Cpath d='M1289 438 L1306 520 L1272 520Z'/%3E%3Cpath d='M24 453 L38 520 L10 520Z'/%3E%3Cpath d='M375 411 L398 520 L352 520Z'/%3E%3Cpath d='M320 439 L337 520 L303 520Z'/%3E%3Cpath d='M175 459 L188 520 L162 520Z'/%3E%3Cpath d='M1432 427 L1451 520 L1412 520Z'/%3E%3Cpath d='M1318 410 L1341 520 L1295 520Z'/%3E%3Cpath d='M62 403 L87 520 L38 520Z'/%3E%3Cpath d='M1351 382 L1380 520 L1322 520Z'/%3E%3Cpath d='M377 446 L393 520 L361 520Z'/%3E%3Cpath d='M1342 410 L1366 520 L1319 520Z'/%3E%3Cpath d='M765 444 L781 520 L749 520Z'/%3E%3Cpath d='M642 406 L666 520 L618 520Z'/%3E%3Cpath d='M390 396 L416 520 L363 520Z'/%3E%3Cpath d='M1432 457 L1445 520 L1419 520Z'/%3E%3Cpath d='M27 420 L48 520 L5 520Z'/%3E%3Cpath d='M1408 419 L1430 520 L1387 520Z'/%3E%3Cpath d='M354 424 L374 520 L334 520Z'/%3E%3Cpath d='M948 408 L972 520 L924 520Z'/%3E%3Cpath d='M945 416 L967 520 L924 520Z'/%3E%3Cpath d='M1280 382 L1309 520 L1251 520Z'/%3E%3Cpath d='M443 443 L459 520 L427 520Z'/%3E%3Cpath d='M331 444 L347 520 L315 520Z'/%3E%3Cpath d='M1270 402 L1295 520 L1245 520Z'/%3E%3Cpath d='M201 381 L230 520 L172 520Z'/%3E%3Cpath d='M1414 393 L1441 520 L1387 520Z'/%3E%3Cpath d='M21 410 L44 520 L-3 520Z'/%3E%3Cpath d='M1267 426 L1287 520 L1247 520Z'/%3E%3Cpath d='M80 407 L104 520 L56 520Z'/%3E%3Cpath d='M548 420 L570 520 L527 520Z'/%3E%3Cpath d='M1398 412 L1421 520 L1375 520Z'/%3E%3Cpath d='M997 456 L1011 520 L984 520Z'/%3E%3Cpath d='M267 438 L284 520 L250 520Z'/%3E%3Cpath d='M5 431 L24 520 L-14 520Z'/%3E%3Cpath d='M474 381 L503 520 L445 520Z'/%3E%3Cpath d='M466 457 L479 520 L453 520Z'/%3E%3Cpath d='M1271 443 L1287 520 L1254 520Z'/%3E%3Cpath d='M263 433 L282 520 L245 520Z'/%3E%3Cpath d='M121 438 L138 520 L104 520Z'/%3E%3Cpath d='M945 440 L961 520 L928 520Z'/%3E%3Cpath d='M1118 453 L1132 520 L1104 520Z'/%3E%3Cpath d='M1177 448 L1192 520 L1162 520Z'/%3E%3Cpath d='M845 428 L864 520 L826 520Z'/%3E%3Cpath d='M431 410 L455 520 L408 520Z'/%3E%3Cpath d='M122 383 L150 520 L93 520Z'/%3E%3Cpath d='M1229 448 L1244 520 L1213 520Z'/%3E%3Cpath d='M1286 397 L1311 520 L1260 520Z'/%3E%3Cpath d='M859 399 L884 520 L834 520Z'/%3E%3Cpath d='M1038 420 L1059 520 L1017 520Z'/%3E%3Cpath d='M409 411 L432 520 L386 520Z'/%3E%3Cpath d='M208 394 L235 520 L182 520Z'/%3E%3Cpath d='M1030 419 L1051 520 L1008 520Z'/%3E%3Cpath d='M618 404 L642 520 L594 520Z'/%3E%3Cpath d='M728 387 L756 520 L700 520Z'/%3E%3Cpath d='M1084 415 L1106 520 L1062 520Z'/%3E%3Cpath d='M1171 459 L1183 520 L1158 520Z'/%3E%3Cpath d='M989 396 L1015 520 L963 520Z'/%3E%3Cpath d='M1024 384 L1053 520 L995 520Z'/%3E%3Cpath d='M926 453 L940 520 L912 520Z'/%3E%3Cpath d='M60 409 L84 520 L37 520Z'/%3E%3Cpath d='M1382 430 L1401 520 L1363 520Z'/%3E%3Cpath d='M650 456 L663 520 L637 520Z'/%3E%3Cpath d='M27 417 L49 520 L6 520Z'/%3E%3Cpath d='M352 439 L369 520 L335 520Z'/%3E%3Cpath d='M658 454 L672 520 L644 520Z'/%3E%3Cpath d='M1343 388 L1370 520 L1315 520Z'/%3E%3Cpath d='M132 418 L154 520 L111 520Z'/%3E%3Cpath d='M1074 422 L1094 520 L1053 520Z'/%3E%3Cpath d='M1165 392 L1192 520 L1138 520Z'/%3E%3C/g%3E%3Cg fill='%2316231A' fill-opacity='.55'%3E%3Cpath d='M338 452 L352 520 L324 520Z'/%3E%3Cpath d='M332 458 L345 520 L319 520Z'/%3E%3Cpath d='M663 448 L678 520 L648 520Z'/%3E%3Cpath d='M111 444 L126 520 L95 520Z'/%3E%3Cpath d='M414 488 L421 520 L407 520Z'/%3E%3Cpath d='M911 480 L920 520 L903 520Z'/%3E%3Cpath d='M864 473 L873 520 L854 520Z'/%3E%3Cpath d='M938 455 L952 520 L925 520Z'/%3E%3Cpath d='M894 483 L902 520 L887 520Z'/%3E%3Cpath d='M695 466 L706 520 L683 520Z'/%3E%3Cpath d='M1400 485 L1408 520 L1393 520Z'/%3E%3Cpath d='M313 466 L325 520 L302 520Z'/%3E%3Cpath d='M1021 476 L1030 520 L1011 520Z'/%3E%3Cpath d='M671 452 L685 520 L657 520Z'/%3E%3Cpath d='M1430 463 L1442 520 L1418 520Z'/%3E%3Cpath d='M449 486 L456 520 L442 520Z'/%3E%3Cpath d='M681 476 L690 520 L672 520Z'/%3E%3Cpath d='M110 465 L122 520 L98 520Z'/%3E%3Cpath d='M1432 440 L1449 520 L1416 520Z'/%3E%3Cpath d='M557 444 L573 520 L541 520Z'/%3E%3Cpath d='M1340 486 L1347 520 L1333 520Z'/%3E%3Cpath d='M130 453 L144 520 L116 520Z'/%3E%3Cpath d='M377 472 L387 520 L367 520Z'/%3E%3Cpath d='M869 458 L882 520 L856 520Z'/%3E%3Cpath d='M403 484 L410 520 L395 520Z'/%3E%3Cpath d='M526 465 L537 520 L514 520Z'/%3E%3Cpath d='M1262 470 L1272 520 L1251 520Z'/%3E%3Cpath d='M229 443 L245 520 L213 520Z'/%3E%3Cpath d='M981 470 L992 520 L971 520Z'/%3E%3Cpath d='M1047 469 L1058 520 L1036 520Z'/%3E%3Cpath d='M542 484 L549 520 L534 520Z'/%3E%3Cpath d='M477 474 L487 520 L467 520Z'/%3E%3Cpath d='M487 470 L498 520 L477 520Z'/%3E%3Cpath d='M1353 480 L1362 520 L1345 520Z'/%3E%3Cpath d='M17 453 L31 520 L3 520Z'/%3E%3Cpath d='M365 487 L372 520 L358 520Z'/%3E%3Cpath d='M562 447 L577 520 L546 520Z'/%3E%3Cpath d='M110 444 L126 520 L94 520Z'/%3E%3Cpath d='M1088 447 L1103 520 L1073 520Z'/%3E%3Cpath d='M404 487 L411 520 L397 520Z'/%3E%3Cpath d='M953 458 L966 520 L940 520Z'/%3E%3Cpath d='M214 441 L231 520 L198 520Z'/%3E%3Cpath d='M628 474 L638 520 L619 520Z'/%3E%3Cpath d='M1113 451 L1128 520 L1099 520Z'/%3E%3Cpath d='M616 489 L623 520 L609 520Z'/%3E%3Cpath d='M1097 470 L1107 520 L1086 520Z'/%3E%3Cpath d='M1261 462 L1273 520 L1249 520Z'/%3E%3Cpath d='M293 486 L300 520 L286 520Z'/%3E%3Cpath d='M1344 469 L1355 520 L1334 520Z'/%3E%3Cpath d='M885 483 L893 520 L878 520Z'/%3E%3C/g%3E%3C/svg%3E") center bottom/cover no-repeat,linear-gradient(135deg,#2F4A35 0%,#3B5A40 55%,#1F2E22 100%)!important}
.v-trail #w-reviews{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='420' viewBox='0 0 420 420'%3E%3Cg fill='none' stroke='%232F4A35' stroke-opacity='.08' stroke-width='2'%3E%3Ccircle cx='210' cy='210' r='170'/%3E%3Ccircle cx='210' cy='210' r='130'/%3E%3Ccircle cx='210' cy='210' r='14'/%3E%3C/g%3E%3Cg fill='%232F4A35' fill-opacity='.07'%3E%3Cpath d='M210 40 L226 210 L210 380 L194 210Z'/%3E%3Cpath d='M40 210 L210 194 L380 210 L210 226Z'/%3E%3C/g%3E%3Cg fill='%23B5521B' fill-opacity='.12'%3E%3Cpath d='M210 40 L226 210 L194 210Z'/%3E%3C/g%3E%3C/svg%3E") right -90px top -60px/420px 420px no-repeat,url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='420' viewBox='0 0 420 420'%3E%3Cg fill='none' stroke='%232F4A35' stroke-opacity='.08' stroke-width='2'%3E%3Ccircle cx='210' cy='210' r='170'/%3E%3Ccircle cx='210' cy='210' r='130'/%3E%3Ccircle cx='210' cy='210' r='14'/%3E%3C/g%3E%3Cg fill='%232F4A35' fill-opacity='.07'%3E%3Cpath d='M210 40 L226 210 L210 380 L194 210Z'/%3E%3Cpath d='M40 210 L210 194 L380 210 L210 226Z'/%3E%3C/g%3E%3Cg fill='%23B5521B' fill-opacity='.12'%3E%3Cpath d='M210 40 L226 210 L194 210Z'/%3E%3C/g%3E%3C/svg%3E") left -140px bottom -140px/360px 360px no-repeat,#EEF3EC}
.v-trail #w-visit{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1440' height='600' viewBox='0 0 1440 600' preserveAspectRatio='none'%3E%3Cpath d='M-20 520 C200 440 300 560 520 470 S860 330 1040 420 S1320 300 1460 240' fill='none' stroke='%23B5521B' stroke-opacity='.18' stroke-width='4' stroke-dasharray='14 12' stroke-linecap='round'/%3E%3Cpath d='M-20 120 C240 160 420 60 700 110 S1180 60 1460 100' fill='none' stroke='%232F4A35' stroke-opacity='.09' stroke-width='3' stroke-dasharray='10 10'/%3E%3C/svg%3E") center/100% 100% no-repeat,#F7F9F5}
.v-trail .wx-foot{position:relative;margin-top:60px}
.v-trail .wx-foot::before{content:"";position:absolute;left:0;right:0;top:-60px;height:60px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1440' height='90' viewBox='0 0 1440 90' preserveAspectRatio='none'%3E%3Cg fill='%231F2E22' fill-opacity='.9'%3E%3Cpath d='M1252 36 L1263 90 L1241 90Z'/%3E%3Cpath d='M1313 32 L1325 90 L1301 90Z'/%3E%3Cpath d='M246 39 L257 90 L235 90Z'/%3E%3Cpath d='M406 47 L415 90 L397 90Z'/%3E%3Cpath d='M1064 27 L1077 90 L1051 90Z'/%3E%3Cpath d='M585 48 L594 90 L576 90Z'/%3E%3Cpath d='M696 27 L709 90 L682 90Z'/%3E%3Cpath d='M172 28 L185 90 L159 90Z'/%3E%3Cpath d='M108 35 L120 90 L97 90Z'/%3E%3Cpath d='M1169 32 L1181 90 L1157 90Z'/%3E%3Cpath d='M652 43 L662 90 L643 90Z'/%3E%3Cpath d='M1093 39 L1104 90 L1083 90Z'/%3E%3Cpath d='M789 48 L798 90 L780 90Z'/%3E%3Cpath d='M252 32 L264 90 L239 90Z'/%3E%3Cpath d='M460 42 L470 90 L450 90Z'/%3E%3Cpath d='M1165 50 L1174 90 L1157 90Z'/%3E%3Cpath d='M29 16 L44 90 L13 90Z'/%3E%3Cpath d='M551 23 L565 90 L537 90Z'/%3E%3Cpath d='M302 46 L312 90 L293 90Z'/%3E%3Cpath d='M1083 35 L1095 90 L1072 90Z'/%3E%3Cpath d='M827 42 L837 90 L817 90Z'/%3E%3Cpath d='M989 34 L1001 90 L977 90Z'/%3E%3Cpath d='M1138 18 L1153 90 L1123 90Z'/%3E%3Cpath d='M133 15 L149 90 L118 90Z'/%3E%3Cpath d='M554 28 L567 90 L541 90Z'/%3E%3Cpath d='M622 44 L631 90 L612 90Z'/%3E%3Cpath d='M1173 12 L1189 90 L1156 90Z'/%3E%3Cpath d='M183 39 L194 90 L172 90Z'/%3E%3Cpath d='M1100 20 L1114 90 L1085 90Z'/%3E%3Cpath d='M1394 36 L1406 90 L1383 90Z'/%3E%3Cpath d='M105 13 L121 90 L89 90Z'/%3E%3Cpath d='M1337 34 L1348 90 L1325 90Z'/%3E%3Cpath d='M674 38 L685 90 L663 90Z'/%3E%3Cpath d='M1128 49 L1136 90 L1119 90Z'/%3E%3Cpath d='M219 11 L235 90 L202 90Z'/%3E%3Cpath d='M157 19 L172 90 L142 90Z'/%3E%3Cpath d='M1009 18 L1025 90 L994 90Z'/%3E%3Cpath d='M1289 56 L1296 90 L1281 90Z'/%3E%3Cpath d='M1119 60 L1125 90 L1112 90Z'/%3E%3Cpath d='M181 32 L193 90 L169 90Z'/%3E%3Cpath d='M54 24 L68 90 L40 90Z'/%3E%3Cpath d='M1386 29 L1399 90 L1373 90Z'/%3E%3Cpath d='M761 38 L772 90 L750 90Z'/%3E%3Cpath d='M1100 55 L1107 90 L1093 90Z'/%3E%3Cpath d='M433 13 L449 90 L416 90Z'/%3E%3Cpath d='M276 47 L285 90 L267 90Z'/%3E%3Cpath d='M1138 60 L1145 90 L1132 90Z'/%3E%3Cpath d='M774 10 L791 90 L757 90Z'/%3E%3Cpath d='M401 44 L411 90 L392 90Z'/%3E%3Cpath d='M1209 48 L1218 90 L1200 90Z'/%3E%3Cpath d='M758 33 L770 90 L746 90Z'/%3E%3Cpath d='M42 39 L53 90 L32 90Z'/%3E%3Cpath d='M935 57 L942 90 L929 90Z'/%3E%3Cpath d='M280 16 L295 90 L264 90Z'/%3E%3Cpath d='M932 56 L939 90 L925 90Z'/%3E%3Cpath d='M328 39 L339 90 L317 90Z'/%3E%3Cpath d='M533 35 L545 90 L522 90Z'/%3E%3Cpath d='M1002 24 L1016 90 L988 90Z'/%3E%3Cpath d='M522 40 L532 90 L511 90Z'/%3E%3Cpath d='M10 45 L19 90 L0 90Z'/%3E%3Cpath d='M1217 57 L1224 90 L1210 90Z'/%3E%3Cpath d='M714 50 L722 90 L705 90Z'/%3E%3Cpath d='M1103 50 L1111 90 L1094 90Z'/%3E%3Cpath d='M670 47 L679 90 L661 90Z'/%3E%3Cpath d='M1281 55 L1288 90 L1273 90Z'/%3E%3Cpath d='M898 29 L911 90 L885 90Z'/%3E%3Cpath d='M1291 36 L1302 90 L1280 90Z'/%3E%3Cpath d='M1311 57 L1318 90 L1304 90Z'/%3E%3Cpath d='M857 14 L872 90 L841 90Z'/%3E%3Cpath d='M78 59 L85 90 L72 90Z'/%3E%3Cpath d='M858 39 L869 90 L848 90Z'/%3E%3Cpath d='M1022 51 L1030 90 L1014 90Z'/%3E%3Cpath d='M647 24 L661 90 L634 90Z'/%3E%3Cpath d='M452 54 L460 90 L445 90Z'/%3E%3Cpath d='M114 52 L122 90 L106 90Z'/%3E%3Cpath d='M275 27 L288 90 L261 90Z'/%3E%3Cpath d='M756 37 L767 90 L744 90Z'/%3E%3Cpath d='M449 24 L463 90 L435 90Z'/%3E%3Cpath d='M1208 11 L1225 90 L1192 90Z'/%3E%3Cpath d='M637 55 L645 90 L630 90Z'/%3E%3Cpath d='M113 56 L120 90 L106 90Z'/%3E%3Cpath d='M605 16 L621 90 L589 90Z'/%3E%3Cpath d='M808 22 L822 90 L794 90Z'/%3E%3Cpath d='M547 22 L562 90 L533 90Z'/%3E%3Cpath d='M445 20 L459 90 L430 90Z'/%3E%3Cpath d='M126 25 L140 90 L113 90Z'/%3E%3Cpath d='M282 33 L294 90 L270 90Z'/%3E%3Cpath d='M643 44 L652 90 L633 90Z'/%3E%3Cpath d='M1062 36 L1073 90 L1050 90Z'/%3E%3Cpath d='M910 48 L918 90 L901 90Z'/%3E%3C/g%3E%3C/svg%3E") center bottom/100% 100% no-repeat}
.v-trail .wx-hero::before{content:"";position:absolute;left:0;right:0;bottom:30px;height:110px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1440' height='140' viewBox='0 0 1440 140' preserveAspectRatio='none'%3E%3Cg fill='%231F2E22' fill-opacity='.55'%3E%3Cpath d='M901 72 L915 140 L886 140Z'/%3E%3Cpath d='M541 68 L556 140 L526 140Z'/%3E%3Cpath d='M1157 96 L1166 140 L1147 140Z'/%3E%3Cpath d='M281 96 L290 140 L271 140Z'/%3E%3Cpath d='M872 75 L886 140 L858 140Z'/%3E%3Cpath d='M482 33 L505 140 L460 140Z'/%3E%3Cpath d='M63 48 L82 140 L43 140Z'/%3E%3Cpath d='M993 35 L1015 140 L971 140Z'/%3E%3Cpath d='M428 49 L447 140 L409 140Z'/%3E%3Cpath d='M858 44 L878 140 L837 140Z'/%3E%3Cpath d='M1363 95 L1372 140 L1354 140Z'/%3E%3Cpath d='M1189 92 L1199 140 L1179 140Z'/%3E%3Cpath d='M1030 67 L1046 140 L1015 140Z'/%3E%3Cpath d='M1118 45 L1138 140 L1098 140Z'/%3E%3Cpath d='M1316 43 L1336 140 L1295 140Z'/%3E%3Cpath d='M191 65 L207 140 L175 140Z'/%3E%3Cpath d='M13 35 L35 140 L-10 140Z'/%3E%3Cpath d='M437 52 L455 140 L418 140Z'/%3E%3Cpath d='M218 83 L230 140 L206 140Z'/%3E%3Cpath d='M1240 68 L1255 140 L1225 140Z'/%3E%3Cpath d='M1129 58 L1146 140 L1112 140Z'/%3E%3Cpath d='M737 73 L751 140 L723 140Z'/%3E%3Cpath d='M230 71 L245 140 L216 140Z'/%3E%3Cpath d='M935 66 L951 140 L920 140Z'/%3E%3Cpath d='M784 89 L795 140 L773 140Z'/%3E%3Cpath d='M614 93 L624 140 L604 140Z'/%3E%3Cpath d='M104 56 L121 140 L86 140Z'/%3E%3Cpath d='M300 71 L315 140 L285 140Z'/%3E%3Cpath d='M1423 32 L1446 140 L1401 140Z'/%3E%3Cpath d='M249 91 L260 140 L239 140Z'/%3E%3Cpath d='M664 38 L685 140 L642 140Z'/%3E%3Cpath d='M338 62 L355 140 L322 140Z'/%3E%3Cpath d='M1114 47 L1134 140 L1095 140Z'/%3E%3Cpath d='M1123 79 L1136 140 L1110 140Z'/%3E%3Cpath d='M402 81 L415 140 L390 140Z'/%3E%3Cpath d='M366 82 L378 140 L354 140Z'/%3E%3Cpath d='M633 87 L644 140 L622 140Z'/%3E%3Cpath d='M339 80 L352 140 L327 140Z'/%3E%3Cpath d='M1307 87 L1318 140 L1296 140Z'/%3E%3Cpath d='M93 82 L105 140 L81 140Z'/%3E%3Cpath d='M354 63 L370 140 L338 140Z'/%3E%3Cpath d='M935 93 L945 140 L926 140Z'/%3E%3Cpath d='M668 97 L677 140 L659 140Z'/%3E%3Cpath d='M6 38 L28 140 L-15 140Z'/%3E%3Cpath d='M333 69 L348 140 L318 140Z'/%3E%3Cpath d='M538 39 L560 140 L517 140Z'/%3E%3Cpath d='M335 96 L345 140 L326 140Z'/%3E%3Cpath d='M865 42 L885 140 L844 140Z'/%3E%3Cpath d='M280 95 L289 140 L270 140Z'/%3E%3Cpath d='M738 88 L749 140 L727 140Z'/%3E%3Cpath d='M868 46 L888 140 L849 140Z'/%3E%3Cpath d='M957 100 L966 140 L949 140Z'/%3E%3Cpath d='M918 50 L937 140 L899 140Z'/%3E%3Cpath d='M504 97 L513 140 L495 140Z'/%3E%3Cpath d='M490 97 L499 140 L481 140Z'/%3E%3Cpath d='M1440 97 L1449 140 L1431 140Z'/%3E%3Cpath d='M1054 36 L1076 140 L1033 140Z'/%3E%3Cpath d='M1173 43 L1194 140 L1153 140Z'/%3E%3Cpath d='M589 74 L603 140 L575 140Z'/%3E%3Cpath d='M894 95 L904 140 L885 140Z'/%3E%3Cpath d='M45 65 L61 140 L30 140Z'/%3E%3Cpath d='M696 71 L711 140 L682 140Z'/%3E%3Cpath d='M1146 54 L1164 140 L1128 140Z'/%3E%3Cpath d='M223 63 L239 140 L206 140Z'/%3E%3Cpath d='M940 72 L955 140 L926 140Z'/%3E%3Cpath d='M390 31 L413 140 L368 140Z'/%3E%3Cpath d='M962 71 L976 140 L947 140Z'/%3E%3Cpath d='M74 48 L93 140 L55 140Z'/%3E%3Cpath d='M1273 71 L1287 140 L1258 140Z'/%3E%3Cpath d='M26 46 L46 140 L7 140Z'/%3E%3Cpath d='M1155 55 L1173 140 L1137 140Z'/%3E%3Cpath d='M563 72 L577 140 L548 140Z'/%3E%3Cpath d='M1356 70 L1371 140 L1342 140Z'/%3E%3Cpath d='M225 92 L236 140 L215 140Z'/%3E%3Cpath d='M130 60 L147 140 L113 140Z'/%3E%3Cpath d='M525 46 L545 140 L505 140Z'/%3E%3Cpath d='M187 96 L196 140 L178 140Z'/%3E%3Cpath d='M205 44 L225 140 L185 140Z'/%3E%3Cpath d='M571 60 L588 140 L554 140Z'/%3E%3Cpath d='M1335 48 L1354 140 L1316 140Z'/%3E%3Cpath d='M247 76 L261 140 L234 140Z'/%3E%3Cpath d='M233 88 L244 140 L222 140Z'/%3E%3Cpath d='M97 73 L111 140 L83 140Z'/%3E%3Cpath d='M1085 45 L1105 140 L1065 140Z'/%3E%3Cpath d='M1159 79 L1172 140 L1146 140Z'/%3E%3Cpath d='M1206 97 L1215 140 L1197 140Z'/%3E%3Cpath d='M1314 78 L1327 140 L1301 140Z'/%3E%3Cpath d='M875 55 L893 140 L857 140Z'/%3E%3Cpath d='M124 50 L143 140 L105 140Z'/%3E%3Cpath d='M991 38 L1013 140 L970 140Z'/%3E%3Cpath d='M922 40 L943 140 L901 140Z'/%3E%3Cpath d='M894 57 L912 140 L877 140Z'/%3E%3Cpath d='M282 67 L298 140 L267 140Z'/%3E%3Cpath d='M814 97 L823 140 L805 140Z'/%3E%3Cpath d='M1352 89 L1362 140 L1341 140Z'/%3E%3Cpath d='M517 90 L528 140 L507 140Z'/%3E%3Cpath d='M1398 43 L1418 140 L1377 140Z'/%3E%3Cpath d='M277 38 L299 140 L256 140Z'/%3E%3Cpath d='M1213 53 L1231 140 L1195 140Z'/%3E%3Cpath d='M962 77 L975 140 L949 140Z'/%3E%3Cpath d='M561 68 L576 140 L546 140Z'/%3E%3Cpath d='M1223 46 L1242 140 L1203 140Z'/%3E%3Cpath d='M935 78 L948 140 L922 140Z'/%3E%3Cpath d='M359 73 L373 140 L345 140Z'/%3E%3Cpath d='M529 65 L545 140 L513 140Z'/%3E%3Cpath d='M257 100 L266 140 L249 140Z'/%3E%3Cpath d='M1420 67 L1435 140 L1405 140Z'/%3E%3Cpath d='M643 57 L661 140 L626 140Z'/%3E%3Cpath d='M1179 41 L1200 140 L1159 140Z'/%3E%3Cpath d='M1167 72 L1181 140 L1153 140Z'/%3E%3C/g%3E%3C/svg%3E") center bottom/100% 100% no-repeat;pointer-events:none;z-index:0}
.v-trail .wx-hero .in{position:relative;z-index:1}
/* ===== Marketing proposal page ===== */
body.t-mk{background:#fff;padding-bottom:0}
.mp{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,"Segoe UI",system-ui,sans-serif;color:#0F172A;-webkit-font-smoothing:antialiased}
.mp-in{max-width:1120px;margin:0 auto;padding:0 28px}
.mp-bar{border-bottom:1px solid #E2E8F0;background:#fff;position:sticky;top:0;z-index:5}
.mp-bar .mp-in{display:flex;align-items:center;justify-content:space-between;height:60px}
.mp-brand{font-weight:700;letter-spacing:-.01em;color:#0F172A}
.mp-back{font-size:.9rem;font-weight:600;color:#0052CC;text-decoration:none}
.mp-back:hover{text-decoration:underline;text-underline-offset:3px}
.mp-cover{background:#0F172A;color:#fff;padding:64px 0 56px}
.mp-cover .mp-in{display:grid;grid-template-columns:1.5fr 1fr auto;gap:48px;align-items:start}
.mp-eyebrow{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.78rem;color:#60A5FA;letter-spacing:.04em;margin-bottom:16px}
.mp-cover h1{font-size:clamp(1.9rem,3.8vw,2.9rem);font-weight:700;letter-spacing:-.03em;line-height:1.08}
.mp-cover p{color:#CBD5E1;margin-top:16px;line-height:1.6;max-width:520px}
.mp-meta{margin:6px 0 0;border-top:1px solid rgba(255,255,255,.14)}
.mp-meta div{padding:12px 0;border-bottom:1px solid rgba(255,255,255,.14)}
.mp-meta dt{font-size:.72rem;color:#94A3B8;text-transform:uppercase;letter-spacing:.08em;font-weight:600}
.mp-meta dd{margin:3px 0 0;font-weight:600}
.mp-meta a{color:#fff;text-underline-offset:3px}
.mp-logo{height:96px;width:auto;background:#fff;border-radius:10px;padding:8px}
.mp-body{display:grid;grid-template-columns:1fr 340px;gap:48px;padding-top:56px;padding-bottom:80px;align-items:start}
.mp-label{display:flex;gap:12px;align-items:baseline;font-size:1.25rem;font-weight:700;letter-spacing:-.02em;padding-top:18px;border-top:1px solid #0F172A}
.mp-label span{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.8rem;color:#0052CC;font-weight:500}
.mp-sub{color:#64748B;margin:6px 0 20px;font-size:.95rem}
.mp-main section+section{margin-top:52px}
.mp-plans{display:grid;grid-template-columns:repeat(3,1fr);border:1px solid #E2E8F0;border-radius:12px;overflow:hidden}
.mp-plan{padding:22px 20px 24px;cursor:pointer;border-left:1px solid #E2E8F0;background:#fff;transition:background .15s;position:relative}
.mp-plan:first-child{border-left:0}
.mp-plan.on{background:#F8FAFC;box-shadow:inset 0 3px 0 #0052CC}
.mp-plan-top{display:flex;gap:10px;align-items:center}
.mp-plan-top input{accent-color:#0052CC;width:17px;height:17px;margin:0}
.mp-plan-name{font-weight:700}
.mp-plan-price{margin:16px 0 4px;display:flex;align-items:baseline;gap:6px}
.mp-plan-price b{font-size:2.2rem;font-weight:700;letter-spacing:-.04em}
.mp-plan-price span{color:#64748B;font-size:.9rem}
.mp-plan-what{color:#475569;font-size:.9rem;line-height:1.55;margin-top:10px}
.mp-plan-idea{font-size:.85rem;color:#0F172A;line-height:1.5;margin-top:14px;padding-top:12px;border-top:1px solid #E2E8F0}
.mp-plan-idea::before{content:"For you: ";font-weight:700;color:#0052CC}
.mp-plan.none .mp-plan-what{margin-top:16px}
.mp-rows{border-top:1px solid #E2E8F0}
.mp-row{display:flex;gap:24px;justify-content:space-between;align-items:flex-start;padding:20px 0;border-bottom:1px solid #E2E8F0;cursor:pointer}
.mp-row-b b{font-weight:700}
.mp-row-b p{color:#475569;font-size:.9rem;line-height:1.55;margin-top:4px;max-width:560px}
.mp-row-b .mp-row-idea{color:#0F172A;font-size:.85rem}
.mp-row-b .mp-row-idea::before{content:"For you: ";font-weight:700;color:#0052CC}
.mp-row-r{display:flex;align-items:center;gap:18px;flex:none}
.mp-row-price{text-align:right;font-weight:700;font-size:1.05rem}
.mp-row-price small{display:block;font-weight:500;color:#64748B;font-size:.78rem}
.mp-switch{appearance:none;-webkit-appearance:none;width:42px;height:24px;border-radius:12px;background:#CBD5E1;position:relative;cursor:pointer;transition:background .15s;margin:0;flex:none}
.mp-switch::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .15s;box-shadow:0 1px 3px rgba(15,23,42,.3)}
.mp-switch:checked{background:#0052CC}
.mp-switch:checked::after{transform:translateX(18px)}
.mp-switch:focus-visible{outline:2px solid #60A5FA;outline-offset:2px}
.mp-side{position:sticky;top:84px}
.mp-sum{border:1px solid #E2E8F0;border-radius:12px;padding:0 22px 22px;background:#fff;box-shadow:0 24px 48px -36px rgba(15,23,42,.45)}
.mp-sum .mp-label{border-top:0;padding-top:20px;margin-bottom:14px}
.mp-lines div{display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid #F1F5F9;font-size:.9rem}
.mp-lines div span:last-child{font-weight:600;white-space:nowrap}
.mp-empty{color:#94A3B8;font-size:.9rem;padding:8px 0}
.mp-tot{margin:16px 0 18px}
.mp-tot div{display:flex;justify-content:space-between;align-items:baseline;padding:4px 0}
.mp-tot span{color:#64748B;font-size:.85rem}
.mp-tot div:first-child b{font-size:1.9rem;letter-spacing:-.03em}
.mp-tot div:last-child b{font-size:1.05rem}
.mp-btn{display:flex;align-items:center;justify-content:center;height:48px;border-radius:10px;background:#0052CC;color:#fff;font-weight:700;text-decoration:none;border:1px solid #0052CC;cursor:pointer;font-size:.95rem;width:100%;font-family:inherit}
.mp-btn:hover{background:#0047B3}
.mp-ghost{background:#fff;color:#0F172A;border-color:#CBD5E1;margin-top:10px}.mp-ghost:hover{background:#F8FAFC}
.mk-trail .mp-cover{background:#2F4A35 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260' viewBox='0 0 260 260'%3E%3Cg fill='none' stroke='%23ffffff' stroke-opacity='.05' stroke-width='1.5'%3E%3Cpath d='M-10 50 Q70 10 130 50 T270 50'/%3E%3Cpath d='M-10 95 Q70 55 130 95 T270 95'/%3E%3Cpath d='M-10 150 Q70 110 130 150 T270 150'/%3E%3Cpath d='M-10 205 Q70 165 130 205 T270 205'/%3E%3C/g%3E%3C/svg%3E");border-bottom:5px solid #B5521B}
.mk-trail .mp-eyebrow{color:#F2B27C}
.mk-trail .mp-cover p{color:#DCE5D8}
.mk-trail .mp-meta dt{color:#B9C8B4}
.mk-trail .mp-back{color:#B5521B}
.mk-trail .mp-label{border-top-color:#2F4A35;color:#23201C}
.mk-trail .mp-label span,.mk-trail .mo-num{color:#B5521B}
.mk-trail .mo-body h3{color:#2F4A35}
.mk-trail .mo-price b{color:#23201C}
.mk-trail .mo-ex{background:#EEF3EC;border-left-color:#B5521B}
.mk-trail .mo-ex span{color:#B5521B}
.mp-fine{color:#94A3B8;font-size:.78rem;line-height:1.5;margin-top:14px}
.mo{padding-top:56px;padding-bottom:80px}
.mo section+section{margin-top:60px}
.mo-list{border-top:1px solid #E2E8F0}
.mo-item{display:grid;grid-template-columns:56px 1fr auto;gap:28px;align-items:start;padding:36px 0;border-bottom:1px solid #E2E8F0}
.mo-num{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#0052CC;font-size:.9rem;padding-top:12px}
.mo-body h3{font-size:clamp(1.7rem,3.2vw,2.4rem);font-weight:700;letter-spacing:-.03em;line-height:1.08}
.mo-what{color:#334155;font-size:1.08rem;line-height:1.65;margin-top:12px;max-width:600px}
.mo-ex{margin-top:18px;padding:14px 18px;background:#F8FAFC;border-left:3px solid #0052CC;border-radius:0 10px 10px 0;max-width:600px}
.mo-ex span{display:block;font-size:.74rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#0052CC;margin-bottom:4px}
.mo-ex p{color:#0F172A;line-height:1.55}
.mo-price{text-align:right;padding-top:6px;white-space:nowrap}
.mo-price b{display:block;font-size:2.4rem;font-weight:700;letter-spacing:-.04em;line-height:1}
.mo-price span{display:block;color:#64748B;font-size:.9rem;margin-top:6px}
.mo-fine{margin-top:32px;font-size:.85rem}
@media (max-width:700px){.mo-item{grid-template-columns:1fr;gap:10px;padding:28px 0}.mo-num{padding-top:0}.mo-price{text-align:left;padding-top:8px}.mo-price b{font-size:2rem}}
@media (max-width:980px){.mp-cover .mp-in{grid-template-columns:1fr}.mp-logo{display:none}.mp-body{grid-template-columns:1fr}.mp-side{position:static}}
@media (max-width:700px){.mp-in{padding:0 18px}.mp-cover{padding:44px 0 36px}.mp-plans{grid-template-columns:1fr}.mp-plan{border-left:0;border-top:1px solid #E2E8F0}.mp-plan:first-child{border-top:0}.mp-plan.on{box-shadow:inset 3px 0 0 #0052CC}.mp-row{flex-direction:column;gap:12px}.mp-row-r{width:100%;justify-content:space-between}.mp-row-price{text-align:left}}
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
