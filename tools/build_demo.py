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
