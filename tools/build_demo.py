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
/* ===== OSTERIA (fine Italian) ===== */
body.t-os{background:#140E0B}
html.os-lock,html.os-lock body{overflow:hidden}
.os{--esp:#140E0B;--esp2:#1E1612;--wine:#7A1F2B;--gold:#C9A35B;--gold2:#E2C48A;--ivory:#F4EEE2;--mut:#B9AC99;--serif:'Cormorant Garamond',Georgia,serif;color:var(--ivory);background:var(--esp);font-family:var(--font-b)}
.os-wrap{max-width:1140px;margin:0 auto;padding:0 24px}
.os-eyebrow{display:block;font-family:var(--font-b);font-size:.74rem;font-weight:600;letter-spacing:.32em;text-transform:uppercase;color:var(--gold)}
.os h1,.os h2,.os-brand{font-family:var(--serif);font-weight:600;letter-spacing:.01em}
.os h2{font-size:clamp(2.1rem,4.4vw,3.2rem);line-height:1.05;margin:10px 0 14px;color:#fff}
.os-sprig{color:var(--gold);width:120px;margin:14px auto 0;opacity:.9}
.os-sprig svg{display:block;width:100%;height:auto}
.os-nav{position:sticky;top:0;z-index:30;background:rgba(20,14,11,.86);backdrop-filter:blur(10px);border-bottom:1px solid rgba(201,163,91,.22)}
.os-nav-in{max-width:1140px;margin:0 auto;padding:12px 24px;display:flex;align-items:center;gap:26px}
.os-brand{font-size:1.65rem;color:#fff}
.os-logo{height:46px;width:auto;max-width:190px;object-fit:contain}
.os-links{display:flex;gap:24px;margin-left:auto}
.os-links button{background:none;border:0;color:var(--ivory);font-size:.82rem;letter-spacing:.18em;text-transform:uppercase;cursor:pointer;padding:6px 0;border-bottom:1px solid transparent}
.os-links button:hover{border-bottom-color:var(--gold);color:var(--gold2)}
.os-btn{display:inline-flex;align-items:center;justify-content:center;min-height:50px;padding:0 26px;border-radius:2px;font-size:.8rem;font-weight:600;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;cursor:pointer;transition:background .2s,color .2s,transform .2s}
.os-btn.gold{background:var(--gold);color:#1B130E;border:1px solid var(--gold)}
.os-btn.gold:hover{background:var(--gold2);transform:translateY(-1px)}
.os-btn.ghost{background:transparent;color:var(--ivory);border:1px solid rgba(244,238,226,.55)}
.os-btn.ghost:hover{border-color:var(--gold);color:var(--gold2)}
.os-btn.sm{min-height:40px;padding:0 16px;font-size:.7rem}
.os-hero{min-height:min(92vh,820px);display:grid;place-items:center;text-align:center;background-size:cover;background-position:center;padding:120px 24px 90px}
.os-hero-in{max-width:820px}
.os-hero h1{font-size:clamp(3.4rem,10vw,7.4rem);line-height:.92;margin:18px 0 10px;color:#fff;text-shadow:0 6px 40px rgba(0,0,0,.5)}
.os-tag{font-family:var(--serif);font-style:italic;font-size:clamp(1.25rem,2.6vw,1.75rem);color:var(--ivory)}
.os-cta{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:30px}
.os-today{margin-top:22px;color:var(--mut);font-size:.88rem;letter-spacing:.08em}
.os-sec{padding:110px 0}
.os-head{text-align:center;margin-bottom:44px}
.os-story{background:var(--esp2)}
.os-story-in{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}
.os-story-pic{aspect-ratio:4/5;background-size:cover;background-position:center;border-radius:2px;box-shadow:24px 24px 0 rgba(122,31,43,.55)}
.os-about{color:#DDD3C3;font-size:1.06rem;line-height:1.85;white-space:pre-line;margin-bottom:22px}
.os-link{color:var(--gold2);text-decoration:none;border-bottom:1px solid rgba(201,163,91,.5);font-weight:600;letter-spacing:.06em}
.os-tabs{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 26px;margin-bottom:40px;border-bottom:1px solid rgba(201,163,91,.2)}
.os-tabs button{background:none;border:0;color:var(--mut);font-family:var(--serif);font-size:1.35rem;padding:8px 2px 12px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.os-tabs button.on{color:#fff;border-bottom-color:var(--gold)}
.os-menu-list{display:grid;grid-template-columns:1fr 1fr;gap:30px 64px}
.os-item{display:flex;gap:16px;align-items:flex-start}
.os-item-pic{flex:none;width:74px;height:74px;border-radius:50%;background-size:cover;background-position:center;border:1px solid rgba(201,163,91,.5)}
.os-item-b{flex:1;min-width:0}
.os-item-top{display:flex;align-items:baseline;gap:10px}
.os-item-top b{font-family:var(--serif);font-size:1.4rem;font-weight:600;color:#fff}
.os-dots{flex:1;border-bottom:1px dotted rgba(201,163,91,.45);transform:translateY(-5px)}
.os-price{font-family:var(--serif);font-size:1.3rem;color:var(--gold2)}
.os-item p{color:var(--mut);font-size:.93rem;line-height:1.6;margin-top:4px}
.os-gal{background:var(--esp2)}
.os-grid{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:210px;gap:12px}
.os-ph{border:0;padding:0;cursor:zoom-in;background-size:cover;background-position:center;border-radius:2px;transition:filter .3s,transform .3s;filter:saturate(.95) brightness(.92)}
.os-ph:hover{filter:none;transform:scale(1.01)}
.os-ph.g0{grid-column:span 2;grid-row:span 2}
.os-rev-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.os-rev{border:1px solid rgba(201,163,91,.28);padding:30px;border-radius:2px;background:rgba(255,255,255,.02)}
.os-rev blockquote{font-family:var(--serif);font-style:italic;font-size:1.25rem;line-height:1.5;color:var(--ivory)}
.os-rev figcaption{margin-top:16px;color:var(--gold);font-size:.78rem;letter-spacing:.2em;text-transform:uppercase}
.os-src{text-align:center;color:var(--mut);font-size:.82rem;margin-top:18px}
.os-reserve{background:linear-gradient(135deg,#3A0F16,#1E1612 60%)}
.os-res-in{display:grid;grid-template-columns:1fr 1.1fr;gap:60px;align-items:center}
.os-res-in p{color:#DDD3C3;line-height:1.8;margin-bottom:24px}
.os-card{background:rgba(20,14,11,.7);border:1px solid rgba(201,163,91,.35);padding:30px;border-radius:2px}
.os-form{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.os-form .full{grid-column:1/-1}
.os-form label{display:block;font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:6px}
.os-form input,.os-form textarea,.os-form select{width:100%;background:transparent;border:0;border-bottom:1px solid rgba(244,238,226,.35);color:var(--ivory);padding:10px 2px;outline:none}
.os-form input:focus,.os-form textarea:focus{border-bottom-color:var(--gold)}
.os-form button{min-height:50px;background:var(--gold);color:#1B130E;border:0;border-radius:2px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;font-size:.8rem;cursor:pointer;margin-top:8px}
.os-ok{display:none}.os-ok h3{font-family:var(--serif);font-size:1.8rem;color:#fff;margin-bottom:8px}.os-ok p{color:var(--mut)}
.os-visit-in{display:grid;grid-template-columns:1fr 1.2fr;gap:60px;align-items:center}
.os-addr{font-family:var(--serif);font-size:1.5rem;color:#fff;margin-bottom:8px}
.os-hours{margin:22px 0;display:grid;gap:6px;max-width:380px}
.os-hours>div{display:flex;justify-content:space-between;border-bottom:1px solid rgba(201,163,91,.15);padding:6px 0;color:#DDD3C3;font-size:.93rem}
.os-hours .today{color:var(--gold2);font-weight:600}
.os .mapbox{position:relative;border-radius:2px;overflow:hidden;border:1px solid rgba(201,163,91,.3);aspect-ratio:16/10}
.os .mapbox svg{display:block;width:100%;height:100%}
.os .mapbox .map-go{background:var(--gold);color:#1B130E}
.os .socials{display:flex;gap:10px}.os .socials a{width:40px;height:40px;border:1px solid rgba(201,163,91,.45);border-radius:50%;color:var(--gold)}
.os-foot{padding:54px 0 70px;text-align:center;border-top:1px solid rgba(201,163,91,.2)}
.os-foot small{display:block;color:var(--mut);margin-top:12px}

/* Osteria: modern visit section, real map, footer */
.os-sprig{width:120px}
.os-ico{display:inline-grid;place-items:center;width:44px;height:44px;border:1px solid rgba(201,163,91,.4);border-radius:50%;color:var(--gold)}
.os-ico svg{width:20px;height:20px}
.os-info{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:22px}
.os-info-c{background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.01));border:1px solid rgba(201,163,91,.2);border-radius:14px;padding:26px 24px;display:flex;flex-direction:column;gap:10px}
.os-info-c small{font-size:.7rem;letter-spacing:.24em;text-transform:uppercase;color:var(--gold);margin-top:6px}
.os-info-c p{font-family:var(--serif);font-size:1.45rem;line-height:1.3;color:#fff}
.os-info-c p a{color:#fff;text-decoration:none}
.os-arrow{display:inline-flex;align-items:center;gap:8px;margin-top:auto;padding-top:6px;background:none;border:0;color:var(--gold2);font-size:.78rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;cursor:pointer}
.os-arrow .os-ico{width:auto;height:auto;border:0;border-radius:0}
.os-arrow .os-ico svg{width:16px;height:16px;transition:transform .2s}
.os-arrow:hover .os-ico svg{transform:translateX(3px)}
.os-hrs{display:grid;gap:7px;font-size:.92rem;color:#DDD3C3}
.os-hrs>div{display:flex;justify-content:space-between;gap:14px}
.os-hrs>div.on{color:var(--gold2);font-weight:600}
.os-map{position:relative;height:420px;border-radius:14px;overflow:hidden;border:1px solid rgba(201,163,91,.2);background:#1A1411}
.os-map iframe{position:absolute;inset:0;width:100%;height:100%;border:0;filter:invert(.9) hue-rotate(180deg) saturate(.35) brightness(.88) contrast(.95)}
.os-map-card{position:absolute;right:18px;top:18px;max-width:300px;background:rgba(20,14,11,.9);backdrop-filter:blur(8px);border:1px solid rgba(201,163,91,.3);border-radius:12px;padding:18px 20px;display:flex;flex-direction:column;gap:6px}
.os-map-card b{font-family:var(--serif);font-size:1.35rem;color:#fff}
.os-map-card span{color:var(--mut);font-size:.9rem;margin-bottom:8px}
.os-map-card .os-btn{align-self:flex-start;border-radius:8px}
.os-foot{padding:56px 0 30px;text-align:left;border-top:1px solid rgba(201,163,91,.18);background:#0E0A08}
.os-foot-in{display:flex;align-items:center;justify-content:space-between;gap:30px;flex-wrap:wrap}
.os-foot-in small{display:block;color:var(--mut);margin-top:6px;font-size:.88rem}
.os-foot-nav{display:flex;gap:28px}
.os-foot-nav button{background:none;border:0;color:var(--ivory);font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;cursor:pointer}
.os-foot-nav button:hover{color:var(--gold2)}
.os-foot-b{display:flex;justify-content:space-between;margin-top:36px;padding-top:22px;border-top:1px solid rgba(255,255,255,.06);color:var(--mut);font-size:.82rem}
.os-foot-b a{color:var(--mut);text-decoration:none}
@media (max-width:860px){.os-info{grid-template-columns:1fr}.os-map{height:340px}.os-map{height:auto;display:flex;flex-direction:column}.os-map iframe{position:relative;height:300px}.os-map-card{position:relative;right:auto;top:auto;max-width:none;border-radius:0;border:0;border-top:1px solid rgba(201,163,91,.3)}.os-foot-in{flex-direction:column;align-items:flex-start}.os-foot-nav{gap:18px;flex-wrap:wrap}}
/* Intro: real plated fettuccine Alfredo, slow push-in, then fade into the site */
.os-intro{position:fixed;inset:0;z-index:100;overflow:hidden;background:#0E0907;display:grid;place-items:center;transition:opacity .3s ease,visibility .3s;cursor:pointer}
.os-intro.out{opacity:0;visibility:hidden}
.os-intro-pic{position:absolute;inset:-4%;background-size:cover;background-position:center 58%;opacity:0;transform:scale(1.14);filter:brightness(.8) contrast(1.1) saturate(1.1) sepia(.12)}
.os-intro.go .os-intro-pic{animation:osPush 2.9s cubic-bezier(.2,.6,.2,1) forwards}
@keyframes osPush{0%{opacity:0;transform:scale(1.14)}18%{opacity:1}100%{opacity:1;transform:scale(1.0)}}
.os-intro::after{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 55%,rgba(14,9,7,0) 0%,rgba(14,9,7,.18) 50%,rgba(14,9,7,.85) 100%),linear-gradient(180deg,rgba(40,20,10,.12),rgba(14,9,7,.4));pointer-events:none}
.os-steam2{position:absolute;left:50%;top:38%;width:240px;height:220px;transform:translateX(-50%);z-index:1;pointer-events:none}
.os-steam2 i{position:absolute;bottom:0;width:70px;height:150px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(255,250,240,.22),rgba(255,250,240,0) 70%);filter:blur(14px);opacity:0}
.os-steam2 i:nth-child(1){left:30px}.os-steam2 i:nth-child(2){left:90px}.os-steam2 i:nth-child(3){left:150px}
.os-intro.go .os-steam2 i{animation:osWisp 2.4s ease-out .3s forwards}
.os-intro.go .os-steam2 i:nth-child(2){animation-delay:.6s}.os-intro.go .os-steam2 i:nth-child(3){animation-delay:.9s}
@keyframes osWisp{0%{opacity:0;transform:translateY(30px) scaleX(.8)}40%{opacity:1}100%{opacity:0;transform:translateY(-90px) scaleX(1.3)}}
.os-intro-txt{position:relative;z-index:2;text-align:center;opacity:0;padding:0 20px}
.os-intro.go .os-intro-txt{animation:osTxt .8s cubic-bezier(.2,.7,.2,1) .25s forwards}
.os-intro-txt b{display:block;font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:clamp(3rem,9vw,6rem);line-height:1;color:#fff;margin-top:8px;text-shadow:0 4px 30px rgba(0,0,0,.6)}
.os-intro-txt .os-eyebrow{color:#E2C48A}
.os-intro .os-sprig{color:#C9A35B}
@keyframes osTxt{from{opacity:0;transform:translateY(16px);filter:blur(4px)}to{opacity:1;transform:none;filter:none}}
@media (max-width:860px){.os-links{display:none}.os-nav-in .os-btn{margin-left:auto}.os-sec{padding:76px 0}.os-story-in,.os-res-in,.os-visit-in{grid-template-columns:1fr;gap:36px}.os-story-pic{box-shadow:12px 12px 0 rgba(122,31,43,.55)}.os-menu-list{grid-template-columns:1fr}.os-grid{grid-template-columns:repeat(2,1fr);grid-auto-rows:150px}.os-rev-grid{grid-template-columns:1fr}.os-form{grid-template-columns:1fr}.os-brand{font-size:1.35rem}}

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
.wx-lb-big{padding:12px}.wx-lb-big .in{max-width:min(1500px,100%);border-radius:6px}.wx-lb-big img{max-height:calc(100vh - 150px)}
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
/* Trail: real photo section backgrounds (set per demo through --bg-* vars) */
.v-trail .tw{background:linear-gradient(rgba(247,249,245,.8),rgba(247,249,245,.86)),var(--bg-specials,none) center/cover fixed,#F7F9F5}
.v-trail .tf{background:linear-gradient(rgba(247,249,245,.84),rgba(247,249,245,.9)),var(--bg-feature,none) center/cover,#F7F9F5}
.v-trail .wx-favsec{background:linear-gradient(rgba(247,249,245,.82),rgba(247,249,245,.88)),var(--bg-favs,none) center/cover,#F7F9F5}
.v-trail #w-menu{background:linear-gradient(rgba(238,243,236,.82),rgba(238,243,236,.88)),var(--bg-menu,none) center/cover fixed,#EEF3EC}
.v-trail .tw-ride .b{background:linear-gradient(rgba(31,46,34,.78),rgba(31,46,34,.86)),var(--bg-ride,none) center/cover,#2F4A35}
.v-trail .wx-band{background:linear-gradient(135deg,rgba(47,74,53,.82),rgba(31,46,34,.88)),var(--bg-story,none) center/cover fixed,#2F4A35!important}
.v-trail #w-reviews{background:linear-gradient(rgba(238,243,236,.82),rgba(238,243,236,.88)),var(--bg-reviews,none) center/cover fixed,#EEF3EC}
.v-trail #w-visit{background:linear-gradient(rgba(247,249,245,.8),rgba(247,249,245,.86)),var(--bg-visit,none) center/cover,#F7F9F5}
.v-trail .wx-foot{background:linear-gradient(rgba(31,46,34,.9),rgba(31,46,34,.95)),var(--bg-foot,none) center/cover,#1F2E22!important}
@media (max-width:860px){.v-trail .tw,.v-trail #w-menu,.v-trail .wx-band,.v-trail #w-reviews{background-attachment:scroll}}
.v-trail .tw-slide{background:#2F4A35}
/* ===== Trailhead layout (trail demos): sidebar trail map, condensed signage type, sharp blocks ===== */
.hl{--hd:'Bebas Neue',Impact,sans-serif;--hb:'Archivo',system-ui,sans-serif;--g:#121616;--gd:#0A0C0C;--r:#9FD4D0;--rt:#24706C;--o:#C8E6E3;--paper:#F2F6F6;--sage:#E1ECEB;--ink:#101313;background:var(--paper);color:var(--ink);font-family:var(--hb);display:grid;grid-template-columns:250px 1fr;min-height:100vh}
.hl .ph{background-size:cover;background-position:center}
.hl{--wr:#24706C;--wn:#0A0C0C;--wa:#9FD4D0;--wa2:#C8E6E3}
.hl .wx-stars{color:var(--rt)}
.hl-side .wx-stars,.hl-score .wx-stars,.hl-boss .wx-stars{color:var(--r)}
.hl h1,.hl h2,.hl h3{font-family:var(--hd);font-weight:400;letter-spacing:.02em;text-transform:uppercase}
/* sidebar */
.hl-side{position:sticky;top:0;height:100vh;background:var(--gd);color:#fff;display:flex;flex-direction:column;padding:26px 22px 90px;border-right:6px solid var(--r);z-index:30}
.hl-side-logo img{width:100%;max-width:170px;background:#fff;padding:6px;display:block}
.hl-side-logo{text-decoration:none}
.hl-side-logo b{font-family:var(--hd);font-size:2rem;color:#fff;font-weight:400;line-height:1}
.hl-side-lbl{margin:30px 0 12px;font-size:.72rem;font-weight:800;letter-spacing:.24em;text-transform:uppercase;color:var(--o)}
.hl-stops{display:flex;flex-direction:column;position:relative;padding-left:4px}
.hl-stops::before{content:"";position:absolute;left:11px;top:14px;bottom:14px;border-left:2px dashed rgba(159,212,208,.45)}
.hl-stops button{position:relative;display:flex;align-items:center;gap:14px;background:none;border:0;color:#C4D4D3;font-family:var(--hd);font-size:1.35rem;letter-spacing:.06em;text-align:left;padding:7px 0;cursor:pointer}
.hl-stops button i{width:16px;height:16px;border:3px solid var(--o);background:var(--gd);border-radius:50%;flex:none;z-index:1}
.hl-stops button:hover,.hl-stops button.on{color:#fff}
.hl-stops button.on i{background:var(--r);border-color:#fff;transform:scale(1.2)}
.hl-side-foot{margin-top:auto;display:flex;flex-direction:column;gap:12px}
.hl-side-today{border:1px solid rgba(255,255,255,.2);padding:10px 12px}
.hl-side-today small{display:block;font-size:.7rem;letter-spacing:.2em;text-transform:uppercase;color:var(--o);font-weight:800}
.hl-side-today b{font-family:var(--hd);font-size:1.4rem;letter-spacing:.04em}
.hl-main{min-width:0}
.hl-nav{display:none}
/* buttons */
.hl-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:50px;padding:0 22px;border-radius:0;font-family:var(--hb);font-weight:800;font-size:.95rem;letter-spacing:.04em;text-transform:uppercase;text-decoration:none;border:2px solid transparent;cursor:pointer}
.hl-sm{height:42px;padding:0 16px;font-size:.84rem}
.hl-rust{background:var(--r);color:var(--gd)}.hl-rust:hover{background:#C2E6E3}
.hl-line{background:transparent;color:var(--g);border-color:var(--g)}.hl-line:hover{background:var(--g);color:#fff}
.hl-line-w{background:transparent;color:#fff;border-color:#fff}.hl-line-w:hover{background:#fff;color:var(--gd)}
.hl-acts{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.hl-c{justify-content:center;margin-top:26px}
/* announcement + hero */
.hl-ann{background:var(--o);color:var(--gd);display:flex;justify-content:center;gap:14px;flex-wrap:wrap;padding:8px 16px;font-family:var(--hd);font-size:1.15rem;letter-spacing:.08em}
.hl-hero{position:relative;min-height:min(88vh,760px);display:flex;align-items:flex-end;justify-content:space-between;gap:30px;padding:60px clamp(24px,5vw,64px) 48px;color:#fff}
.hl-pin{position:absolute;top:22px;right:22px;background:var(--r);color:var(--gd);font-weight:800;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;padding:8px 12px;display:flex;gap:6px;align-items:center}
.hl-hero-t{max-width:720px}
.hl-kick{font-size:.8rem;font-weight:800;letter-spacing:.24em;text-transform:uppercase;color:var(--o)}
.hl-hero h1{font-size:clamp(4rem,11vw,9.5rem);line-height:.82;margin:12px 0 6px}
.hl-slogan{font-family:var(--hd);font-size:clamp(1.5rem,3vw,2.3rem);letter-spacing:.04em;color:var(--o);margin-bottom:12px}
.hl-hero-t>p:not(.hl-slogan){font-size:1.06rem;line-height:1.6;color:rgba(255,255,255,.88);max-width:540px;margin-bottom:22px}
.hl-hero-rev{max-width:300px;margin:0;background:rgba(255,255,255,.95);color:var(--ink);padding:18px 20px;border-left:6px solid var(--r);flex:none}
.hl-hero-rev .st{color:var(--rt)}
.hl-hero-rev blockquote{font-size:.98rem;line-height:1.5;margin:8px 0}
.hl-hero-rev figcaption{font-weight:800;font-size:.85rem;color:var(--g)}
.hl-hero-rev blockquote,.hl-hero-rev figcaption{transition:opacity .35s}
.hl-hero-rev.fade blockquote,.hl-hero-rev.fade figcaption{opacity:0}
.hl-hero-rev blockquote{min-height:4.5em}
.hl-dots{display:flex;gap:6px;margin-top:12px}
.hl-dots button{width:22px;height:5px;border:0;background:#D3E0DF;cursor:pointer;padding:0}
.hl-dots button.on{background:var(--r)}
.hl-strip{display:grid;grid-template-columns:repeat(4,1fr);background:var(--g);color:#fff}
.hl-strip div{padding:18px 22px;border-left:1px solid rgba(255,255,255,.18)}
.hl-strip div:first-child{border-left:0}
.hl-strip small{display:block;font-size:.7rem;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--o)}
.hl-strip b{font-family:var(--hd);font-size:1.4rem;letter-spacing:.04em;font-weight:400}
/* sections */
.hl-sec{padding:90px clamp(24px,5vw,72px);position:relative}
.hl-head{display:flex;gap:22px;align-items:flex-start;margin-bottom:36px;border-top:3px solid var(--ink);padding-top:18px}
.hl-num{font-family:var(--hd);font-size:5rem;line-height:.8;color:transparent;-webkit-text-stroke:2px var(--rt)}
.hl-head small{display:block;font-size:.76rem;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--rt)}
.hl-head h2{font-size:clamp(2.6rem,6vw,4.6rem);line-height:.9;color:var(--g);margin-top:4px}
.hl-head p{color:#4C5959;margin-top:8px}
/* specials */
.hl-week{background:linear-gradient(rgba(242,246,246,.84),rgba(242,246,246,.9)),var(--bg-specials,none) center/cover fixed,var(--paper)}
.hl-weekgrid{display:grid;grid-template-columns:1fr;gap:0}
.hl-rail{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:0;border:2px solid var(--gd);border-bottom:0}
.hl-rail button{background:#fff;border:0;border-left:2px solid var(--gd);padding:14px 12px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:2px}
.hl-rail button:first-child{border-left:0}
.hl-rail b{font-family:var(--hd);font-size:1.9rem;line-height:1;color:var(--g);letter-spacing:.04em}
.hl-rail span{font-weight:800;font-size:.84rem}
.hl-rail small{font-size:.74rem;color:#4C5959}
.hl-rail button.on{background:var(--r)}
.hl-rail button.on b,.hl-rail button.on span,.hl-rail button.on small{color:var(--gd)}
.hl-stage{display:grid;grid-template-columns:1.1fr 1fr;border:2px solid var(--gd);background:var(--gd);color:#fff;min-height:420px}
.hl-stage-p{position:relative;min-height:320px;overflow:hidden}
.hl-stage-p b{position:absolute;left:18px;bottom:6px;font-family:var(--hd);font-weight:400;font-size:clamp(3rem,6vw,5.6rem);line-height:1;color:#fff;text-shadow:0 4px 24px rgba(0,0,0,.6)}
.hl-stage-p em{position:absolute;right:0;top:18px;font-style:normal;background:var(--o);color:var(--gd);font-weight:800;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;padding:7px 12px}
.hl-stage-t{padding:40px clamp(22px,3.5vw,44px);display:flex;flex-direction:column;justify-content:center}
.hl-stage-t h3{font-size:clamp(3rem,6.4vw,5.4rem);line-height:.88;color:#fff}
.hl-time{display:inline-flex;align-items:center;gap:8px;margin-top:14px;font-family:var(--hd);font-size:1.5rem;letter-spacing:.06em;color:var(--o)}
.hl-stage-t p{font-size:1.06rem;line-height:1.6;color:#D2DDDC;margin:12px 0 4px}
.hl-stage-t small{display:block;color:#A2B6B4;margin-bottom:10px}
.hl-stage-t .hl-acts{margin-top:16px}
.hl-stage-t .hl-line{color:#fff;border-color:#fff}
.hl-banner{margin-top:26px;display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 22px;background:var(--gd);color:#fff;padding:22px 28px;outline:2px dashed rgba(159,212,208,.6);outline-offset:-10px}
.hl-banner span{font-size:.74rem;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--r)}
.hl-banner b{color:var(--o)}
.hl-banner b{font-family:var(--hd);font-weight:400;font-size:clamp(2rem,4.6vw,3.4rem);line-height:1;letter-spacing:.03em}
.hl-banner p{font-weight:700}
/* trail boss */
.hl-boss{background:var(--gd);color:#fff}
.hl-boss::before{content:"";position:absolute;inset:0;background:linear-gradient(rgba(10,12,12,.9),rgba(10,12,12,.95)),var(--bg-feature,none) center/cover}
.hl-boss>*{position:relative}
.hl-poster{display:grid;grid-template-columns:1fr 1fr;gap:0;border:2px solid var(--o)}
.hl-poster-t{padding:44px clamp(22px,4vw,52px);display:flex;flex-direction:column;align-items:flex-start;justify-content:center}
.hl-tag{background:var(--o);color:var(--gd);font-weight:800;font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;padding:7px 12px;margin-bottom:16px}
.hl-poster-t small{font-size:.78rem;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--o)}
.hl-poster-t h2{font-size:clamp(4rem,10vw,8rem);line-height:.82;margin:8px 0 18px}
.hl-poster-t p{font-size:1.1rem;line-height:1.7;color:#D2DDDC}
.hl-poster-t em{font-style:normal;color:#A2B6B4;font-size:.88rem;margin:10px 0 22px}
.hl-poster-p{min-height:500px;border-left:2px solid var(--o);background-color:#0E1410;background-size:contain!important;background-repeat:no-repeat!important;background-position:center!important}
.hl-steps{margin-top:60px}
.hl-steps h3{font-size:clamp(2rem,4vw,3rem);color:#fff}
.hl-steps>p{color:#A2B6B4;margin-top:4px}
.hl-steps ol{list-style:none;padding:0;margin:28px 0 22px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0;border-top:2px solid rgba(159,212,208,.5)}
.hl-steps li{padding:20px 18px 6px 0;margin-right:18px;display:flex;flex-direction:column;gap:10px;font-size:.94rem;line-height:1.5;color:#D2DDDC}
.hl-steps li b{font-family:var(--hd);font-weight:400;font-size:3.4rem;line-height:.8;color:var(--o)}
.hl-note{color:var(--o);font-weight:700;margin-right:12px}
.hl-boss .hl-line{color:#fff;border-color:#fff}
/* menu */
.hl-menu{background:linear-gradient(rgba(225,236,235,.86),rgba(225,236,235,.92)),var(--bg-menu,none) center/cover fixed,var(--sage);overflow:hidden}
.hl-menu .tw-utv{top:84px;right:clamp(24px,5vw,72px);color:var(--rt)}
.hl-picks{display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin-bottom:30px;border:2px solid var(--gd);background:#fff}
.hl-picks>small{grid-column:1/-1;background:var(--gd);color:var(--o);font-size:.74rem;font-weight:800;letter-spacing:.22em;text-transform:uppercase;padding:9px 14px}
.hl-picks article{display:flex;flex-direction:column;border-left:2px solid var(--gd)}
.hl-picks article:nth-child(2){border-left:0}
.hl-picks .ph{height:180px}
.hl-picks article>div:last-child{padding:12px 14px}
.hl-picks b{display:block;font-family:var(--hd);font-size:1.6rem;letter-spacing:.04em;font-weight:400}
.hl-picks span{font-size:.74rem;font-weight:800;color:var(--rt);text-transform:uppercase;letter-spacing:.14em}
.hl-chips{display:flex;flex-wrap:wrap;gap:0;margin-bottom:6px;border:2px solid var(--gd);width:max-content;max-width:100%}
.hl-chips button{background:#fff;border:0;border-left:2px solid var(--gd);font-family:var(--hd);font-size:1.3rem;letter-spacing:.05em;color:var(--g);padding:8px 16px;cursor:pointer}
.hl-chips button:first-child{border-left:0}
.hl-chips button.on{background:var(--g);color:#fff}
.hl-board2{display:grid;grid-template-columns:1fr 1fr;gap:0 44px;background:#fff;border:2px solid var(--gd);padding:8px 28px}
.hl-mi{display:flex;gap:14px;align-items:center;padding:15px 0;border-bottom:1px solid #D3E0DF}
.hl-mi-p{width:58px;height:58px;flex:none}
.hl-mi-t{flex:1}
.hl-mi .r{display:flex;justify-content:space-between;gap:12px;align-items:baseline}
.hl-mi b{font-weight:800;font-size:1.02rem}
.hl-mi .r span{font-family:var(--hd);color:var(--rt);font-size:1.45rem;letter-spacing:.04em}
.hl-mi p{color:#4C5959;font-size:.9rem;line-height:1.5;margin-top:2px}
/* photos */
.hl-gal{background:var(--paper)}
.hl-mosaic{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:clamp(130px,14vw,210px);gap:6px;position:relative}
.hl-mosaic .ph{border:0;cursor:pointer;filter:saturate(1.05)}
.hl-mosaic .ph:first-child{grid-column:span 2;grid-row:span 2}
.hl-mosaic .ph:nth-child(8){grid-column:span 2}
.hl-all{position:absolute;right:12px;bottom:12px;background:var(--r);color:var(--gd);border:0;padding:12px 16px;font-family:var(--hb);font-weight:800;text-transform:uppercase;letter-spacing:.06em;cursor:pointer}
/* story + ride */
.hl-camp{display:grid;grid-template-columns:1.2fr 1fr;gap:0;background:linear-gradient(rgba(242,246,246,.84),rgba(242,246,246,.9)),var(--bg-story,none) center/cover fixed,var(--paper)}
.hl-story{display:grid;grid-template-columns:1fr 1fr;background:#fff;border:2px solid var(--gd)}
.hl-story .ph{min-height:360px}
.hl-story .b,.hl-ride .b{padding:32px 28px;display:flex;flex-direction:column;justify-content:center;gap:12px;align-items:flex-start}
.hl-camp small{font-size:.74rem;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:var(--rt)}
.hl-camp h2{font-size:clamp(2.2rem,3.6vw,3.2rem);line-height:.9;color:var(--g)}
.hl-story p{color:#384444;line-height:1.65}
.hl-ride{background:var(--g);color:#fff;border:2px solid var(--gd);border-left:0;display:grid;grid-template-rows:180px 1fr}
.hl-ride small{color:var(--o)}.hl-ride h2{color:#fff}
.hl-ride p{color:#D2DDDC;line-height:1.6}
.hl-ride ul{list-style:none;padding:0;display:grid;gap:7px}
.hl-ride li{display:flex;gap:9px;align-items:center;font-weight:700;font-size:.93rem}
.hl-ride li svg{color:var(--o);flex:none}
/* reviews */
.hl-revs{background:linear-gradient(rgba(225,236,235,.86),rgba(225,236,235,.92)),var(--bg-reviews,none) center/cover fixed,var(--sage)}
.hl-revs-h{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;flex-wrap:wrap}
.hl-revs-h .hl-head{flex:1}
.hl-score{display:flex;flex-direction:column;align-items:flex-start;gap:4px;background:var(--gd);color:#fff;padding:14px 18px;font-weight:700;margin-bottom:30px}
.hl-score .wx-stars{color:var(--o)}
.hl-revrow{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(300px,1fr);gap:0;overflow-x:auto;scroll-snap-type:x mandatory;border:2px solid var(--gd);background:#fff}
.hl-revrow figure{scroll-snap-align:start;margin:0;padding:26px 24px 22px;border-left:2px solid var(--gd);position:relative}
.hl-revrow figure:first-child{border-left:0}
.hl-revrow i{display:block;font-family:var(--hd);font-style:normal;font-size:4rem;line-height:.6;color:var(--rt);margin-bottom:6px}
.hl-revrow blockquote{font-size:.98rem;line-height:1.6;margin-bottom:14px}
.hl-revrow figcaption{display:flex;flex-direction:column;gap:6px;font-weight:800;color:var(--g)}
.hl-revrow figcaption .wx-stars{color:var(--rt)}
/* visit */
.hl-visit{background:linear-gradient(rgba(242,246,246,.82),rgba(242,246,246,.88)),var(--bg-visit,none) center/cover,var(--paper)}
.hl-vgrid{display:grid;grid-template-columns:1fr 1fr 1.1fr;gap:0;border:2px solid var(--gd);background:#fff}
.hl-sign{background:var(--gd);color:#fff;padding:0 0 16px}
.hl-sign-h{font-family:var(--hd);font-size:2rem;letter-spacing:.06em;padding:16px 22px 10px;color:var(--o)}
.hl-hrs div{display:flex;justify-content:space-between;padding:7px 22px;font-size:.94rem}
.hl-hrs .today{background:var(--r);color:var(--gd);font-weight:800}
.hl-find{padding:26px;display:flex;flex-direction:column;gap:12px;align-items:flex-start;border-right:2px solid var(--gd)}
.hl-find h3{font-size:2.2rem;color:var(--g);line-height:.9}
.hl-find address{font-style:normal;line-height:1.6;color:#384444}
.hl-find>p{color:var(--rt);font-weight:800}
.hl-find .socials{display:flex;gap:8px}
.hl-find .socials a{width:42px;height:42px;border:2px solid var(--gd);display:flex;align-items:center;justify-content:center;color:var(--g)}
.hl-map{display:flex;border:0!important;border-radius:0!important}
.hl-map .mapbox{flex:1}
.hl .wx-map .map-go{background:var(--gd);color:#fff;border-radius:0}
.hl-foot{background:var(--gd);color:#C4D4D3;padding:26px clamp(24px,5vw,72px);border-top:6px solid var(--r)}
.hl-foot .in{display:flex;gap:18px;align-items:center;flex-wrap:wrap;font-size:.88rem}
.hl-foot img{height:44px;background:#fff;padding:3px}
.hl-foot b{font-family:var(--hd);font-size:1.4rem;color:#fff;font-weight:400}
.hl-foot span:last-child{margin-left:auto}
@media (max-width:1100px){.hl-stage{grid-template-columns:1fr}.hl-camp{grid-template-columns:1fr}.hl-ride{border-left:2px solid var(--gd);border-top:0}.hl-strip{grid-template-columns:1fr 1fr}.hl-strip div:nth-child(3){border-left:0}}
@media (max-width:900px){.hl{grid-template-columns:1fr}.hl-side{display:none}.hl-nav{display:block;position:sticky;top:0;z-index:20;background:var(--gd);border-bottom:4px solid var(--r)}
 .hl-nav-in{display:flex;align-items:center;justify-content:space-between;padding:10px 16px}.hl-brand img{height:46px;background:#fff;padding:3px}.hl-brand b{font-family:var(--hd);font-size:1.6rem;color:#fff;font-weight:400}
 .hl-mstops{display:flex;overflow-x:auto;gap:0;border-top:1px solid rgba(255,255,255,.12)}.hl-mstops button{flex:none;background:none;border:0;color:#E6EDE3;font-family:var(--hd);font-size:1.15rem;letter-spacing:.06em;padding:9px 14px;cursor:pointer}
 .hl-hero{flex-direction:column;align-items:flex-start;min-height:0;padding:90px 20px 28px}.hl-hero-rev{max-width:none}.hl-strip{grid-template-columns:1fr}.hl-strip div{border-left:0;border-top:1px solid rgba(255,255,255,.18)}
 .hl-sec{padding:60px 18px}.hl-num{font-size:3.4rem}.hl-poster{grid-template-columns:1fr}.hl-poster-p{min-height:300px;border-left:0;border-top:2px solid var(--o);order:-1}.hl-picks{grid-template-columns:1fr}.hl-picks article{border-left:0;border-top:2px solid var(--gd)}.hl-picks .ph{height:150px}
 .hl-board2{grid-template-columns:1fr;padding:6px 16px}.hl-mosaic{grid-template-columns:1fr 1fr}.hl-story{grid-template-columns:1fr}.hl-story .ph{min-height:230px}.hl-vgrid{grid-template-columns:1fr}.hl-find{border-right:0;border-bottom:2px solid var(--gd)}.hl-map .mapbox{min-height:220px}
 .hl-week,.hl-menu,.hl-camp,.hl-revs{background-attachment:scroll}.hl-menu .tw-utv{top:30px;width:90px}.hl-rail{grid-template-columns:repeat(4,1fr)}.hl-rail button:nth-child(5){border-left:0}.hl-rail button:nth-child(n+5){border-top:2px solid var(--gd)}.hl-foot span:last-child{margin-left:0}.hl-chips{width:auto}}
/* ===== Diner layout (Dottie's) ===== */
.dn{--red:#B3202A;--red2:#8E1620;--ink:#1E1A1A;--mint:#DDF1EA;--chrome:#C9CED3;--muted:#5E5757;--ds:'Pacifico',cursive;--db:'Work Sans',system-ui,sans-serif;background:#fff;color:var(--ink);font-family:var(--db)}
.dn .ph{background-size:cover;background-position:center}
.dn h1,.dn h2,.dn h3{font-family:var(--db);font-weight:800;letter-spacing:-.01em}
.dn-script{font-family:var(--ds);color:var(--red);font-size:1.5rem;line-height:1.2;display:block}
.dn-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:50px;padding:0 22px;border-radius:8px;font-family:var(--db);font-weight:700;font-size:.98rem;text-decoration:none;border:2px solid transparent;cursor:pointer}
.dn-sm{height:42px;padding:0 16px;font-size:.9rem}
.dn-red{background:var(--red);color:#fff;box-shadow:0 4px 0 var(--red2)}.dn-red:hover{transform:translateY(1px);box-shadow:0 3px 0 var(--red2)}
.dn-line{background:#fff;color:var(--red);border-color:var(--red)}.dn-line:hover{background:var(--red);color:#fff}
.dn-acts{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.dn-c{justify-content:center;margin-top:24px}
.dn-nav{position:sticky;top:0;z-index:20;background:#fff;border-bottom:4px solid var(--red);box-shadow:0 6px 0 -2px var(--chrome)}
.dn-nav-in{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;padding:10px 24px}
.dn-logo{font-family:var(--ds);font-size:2rem;color:var(--red);text-decoration:none;line-height:1;text-align:center}
.dn-links{display:flex;gap:4px}.dn-links.l{justify-content:flex-end}.dn-links.r{justify-content:flex-start}
.dn-links button{background:none;border:0;font-family:var(--db);font-weight:700;font-size:.92rem;color:var(--ink);padding:8px 12px;border-radius:6px;cursor:pointer}
.dn-links button:hover{background:var(--mint)}
.dn-mcall{display:none}
.dn-mtabs{display:none}
.dn-hero{background:linear-gradient(#fff 0,#fff 58%,var(--mint) 58%);padding:46px 24px 0;overflow:hidden}
.dn-marquee{text-align:center;max-width:900px;margin:0 auto}
.dn-neon{display:inline-flex;align-items:center;gap:12px;margin-bottom:6px}
.dn-neon i{width:40px;height:2px;background:#2E7D5B;box-shadow:0 0 8px rgba(46,125,91,.6)}
.dn-neon span{border:2px solid #2E7D5B;color:#2E7D5B;font-weight:800;font-size:.82rem;letter-spacing:.1em;text-transform:uppercase;padding:5px 10px;border-radius:6px;background:#fff;box-shadow:0 0 0 3px #DDF1EA,0 0 16px rgba(46,125,91,.35)}
.dn-hero h1{font-family:var(--ds);font-weight:400;color:var(--red);font-size:clamp(3.6rem,10vw,7.6rem);line-height:1.05;letter-spacing:0;text-shadow:3px 3px 0 #fff,6px 6px 0 rgba(179,32,42,.18)}
.dn-tag{font-weight:800;font-size:1.25rem;margin-top:4px}
.dn-bar{max-width:1000px;margin:34px auto 0;position:relative}
.dn-props{display:flex;justify-content:space-between;align-items:flex-end;padding:0 4%;gap:14px;position:relative;z-index:2;margin-bottom:-2px}
.dn-tent{background:none;border:0;padding:0;cursor:pointer;font-family:var(--db);filter:drop-shadow(0 0 1px rgba(30,26,26,.45)) drop-shadow(0 10px 8px rgba(30,26,26,.18));transition:transform .2s}
.dn-tent .f{position:relative;width:170px;height:150px;clip-path:polygon(12% 0,88% 0,100% 100%,0 100%);background:linear-gradient(var(--red) 0 30%,#fff 30% 95%,#D9DCE0 95%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px}
.dn-tent .t{font-family:var(--ds);color:#fff;font-size:1.9rem;line-height:1;margin-top:-26px;margin-bottom:22px}
.dn-tent .s{font-weight:700;font-size:.84rem;color:var(--ink)}
.dn-tent .g{font-weight:800;font-size:.82rem;color:var(--red);text-transform:uppercase;letter-spacing:.08em;margin-top:6px}
.dn-tent:hover{transform:translateY(-6px) rotate(-2deg)}
.dn-bell{display:flex;flex-direction:column;align-items:center;text-decoration:none;color:var(--ink)}
.dn-bell-t{order:-1;background:var(--red);color:#fff;border-radius:8px;padding:10px 18px;text-align:center;margin-bottom:12px;position:relative;box-shadow:0 4px 0 var(--red2)}
.dn-bell-t:after{content:"";position:absolute;left:50%;bottom:-9px;margin-left:-9px;border:9px solid transparent;border-bottom:0;border-top-color:var(--red)}
.dn-bell-t small{display:block;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;opacity:.85;font-weight:700}
.dn-bell-t b{font-size:1.25rem}
.dn-bellart{width:130px;display:block;transform-origin:50% 90%}
.dn-bellart svg{display:block;width:100%}
.dn-bell:hover .dn-bellart{animation:dnding .5s ease-in-out 2}
@keyframes dnding{25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}
.dn-mini{background:#1E1A1A;color:#fff;border:6px solid var(--chrome);border-radius:6px;padding:12px 16px;font-family:'Courier New',monospace;text-transform:uppercase;letter-spacing:.12em;text-align:center;cursor:pointer;display:flex;flex-direction:column;gap:4px;min-width:170px;box-shadow:inset 0 0 0 2px #000}
.dn-mini small{color:#F2C230;font-size:.72rem}
.dn-mini b{font-size:1rem}
.dn-mini span{font-size:.7rem;opacity:.7}
.dn-counter svg{display:block;width:100%;height:auto}
.dn-hint{display:block;text-align:center;font-family:var(--ds);color:var(--red);font-size:1rem;margin-top:4px}
.dn .stool{transform-box:fill-box;transform-origin:center;animation:dnspin 1.1s ease-in-out 1;cursor:pointer}
.dn .stool:hover{animation:dnspin 1s ease-in-out infinite}
@keyframes dnspin{0%{transform:scaleX(1)}25%{transform:scaleX(.15)}50%{transform:scaleX(-1)}75%{transform:scaleX(.15)}100%{transform:scaleX(1)}}
.dn-booth{background:var(--mint);margin:0 -24px;padding:50px 24px 80px;display:grid;grid-template-columns:90px minmax(0,1000px) 90px;justify-content:center;gap:0;align-items:stretch}
.dn-seat{display:block;background:repeating-linear-gradient(90deg,#B3202A 0 16px,#8E1620 16px 18px);border-radius:40px 40px 6px 6px;box-shadow:inset 0 10px 0 rgba(255,255,255,.18),0 18px 24px -18px rgba(0,0,0,.6);margin:30px 0}
.dn-seat.l{border-radius:40px 6px 6px 40px}.dn-seat.r{border-radius:6px 40px 40px 6px}
.dn-table{background:#fff;border-radius:6px;display:grid;grid-template-columns:1fr 1fr;box-shadow:0 26px 40px -30px rgba(30,26,26,.7);border-top:10px solid var(--chrome);overflow:hidden}
.dn-window{position:relative;min-height:380px}
.dn-window .ph{position:absolute;inset:0}
.dn-window span{position:absolute;left:14px;bottom:14px;background:#fff;color:var(--ink);font-weight:700;font-size:.85rem;padding:6px 10px;border-radius:4px}
.dn-booth-t{padding:40px clamp(22px,4vw,48px);display:flex;flex-direction:column;justify-content:center;gap:12px}
.dn-booth-t h2{font-size:clamp(1.8rem,3.4vw,2.6rem);line-height:1.08}
.dn-booth-t p{color:var(--muted);line-height:1.7}
.dn-sec{padding:80px max(24px,calc((100vw - 1180px)/2));position:relative}
.dn-head{text-align:center;margin-bottom:34px}
.dn-head h2{font-size:clamp(2.2rem,4.6vw,3.4rem);line-height:1.05}
.dn-head p{color:var(--muted);margin-top:8px}
.dn-board-sec{display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:center;background:#fff}
.dn-board-sec .dn-head{text-align:left;margin-bottom:12px}
.dn-board{background:#5B3A28;padding:16px;border-radius:10px;box-shadow:0 24px 40px -26px rgba(30,26,26,.7)}
.dn-board-in{background:repeating-linear-gradient(0deg,#1C1C1C 0 6px,#232323 6px 12px);border-radius:4px;padding:30px 24px;display:flex;flex-direction:column;align-items:center;gap:10px;font-family:'Courier New',monospace;color:#fff;text-transform:uppercase;letter-spacing:.14em;text-align:center}
.dn-board-in small{color:#F2C230;font-size:.85rem}
.dn-board-in b{font-size:clamp(1.6rem,3.6vw,2.4rem);font-weight:700}
.dn-board-in span{font-size:1rem;opacity:.9}
.dn-board-t p{color:var(--muted);line-height:1.65;margin-bottom:20px;font-size:1.06rem}
.dn-favs-sec{overflow:hidden;background-color:#1E1A1A;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cg fill='none' stroke-linecap='round' stroke-width='4'%3E%3Cpath d='M40 30v24M28 42h24M32 34l16 16M48 34L32 50' stroke='%23DDF1EA'/%3E%3Cpath d='M200 150v20M190 160h20' stroke='%23FF4D5A'/%3E%3Cpath d='M120 220q10-14 20 0t20 0' stroke='%232E7D5B'/%3E%3C/g%3E%3Ccircle cx='170' cy='60' r='3' fill='%23F2C230'/%3E%3Ccircle cx='70' cy='170' r='3' fill='%23FF4D5A'/%3E%3C/svg%3E"),linear-gradient(rgba(221,241,234,.08) 2px,transparent 2px),linear-gradient(90deg,rgba(221,241,234,.08) 2px,transparent 2px);background-size:260px 260px,48px 48px,48px 48px}
.dn-favs-sec:after{content:"";position:absolute;left:-10%;right:-10%;bottom:0;height:46%;background-image:linear-gradient(#FF4D5A 2px,transparent 2px),linear-gradient(90deg,#FF4D5A 2px,transparent 2px);background-size:60px 40px;transform:perspective(420px) rotateX(62deg);transform-origin:bottom;opacity:.35;pointer-events:none;-webkit-mask-image:linear-gradient(transparent,#000 70%);mask-image:linear-gradient(transparent,#000 70%)}
.dn-favs-sec .dn-script{color:#FF8A92;text-shadow:0 0 12px rgba(255,77,90,.7)}
.dn-favs-sec .dn-head h2{background:#B3202A!important;box-shadow:8px 8px 0 #DDF1EA!important}
.dn-favs-sec:before{content:"";position:absolute;left:0;right:0;top:0;height:16px;background:repeating-linear-gradient(90deg,#B3202A 0 28px,#1E1A1A 28px 56px,#fff 56px 84px)}
.dn-favs-sec .dn-head,.dn-favs-sec .dn-checks{position:relative;z-index:1}
.dn-favs-sec .dn-head h2{display:inline-block;background:#1E1A1A;color:#fff;padding:6px 22px 10px;transform:skew(-8deg);box-shadow:8px 8px 0 #B3202A}
.dn-favs-sec .dn-head p{background:#fff;display:inline-block;padding:4px 12px;margin-top:16px;border:2px solid #1E1A1A;color:#1E1A1A;font-weight:600}
.dn-memphis i{position:absolute;display:block;z-index:0}
.dn-memphis .m1{width:120px;height:120px;border-radius:50%;background:repeating-radial-gradient(circle,#B3202A 0 6px,transparent 6px 14px);left:-30px;top:60px;opacity:.85}
.dn-memphis .m2{width:0;height:0;border-left:70px solid transparent;border-right:70px solid transparent;border-bottom:120px solid #DDF1EA;right:4%;top:40px;transform:rotate(18deg)}
.dn-memphis .m3{width:180px;height:26px;background:repeating-linear-gradient(45deg,#2E7D5B 0 8px,transparent 8px 16px);left:8%;bottom:40px;transform:rotate(-12deg)}
.dn-memphis .m4{width:90px;height:90px;border:10px solid #B3202A;border-radius:50%;right:-20px;bottom:90px}
.dn-memphis .m5{width:46px;height:46px;background:#F2C230;left:14%;top:auto;bottom:120px;transform:rotate(30deg);box-shadow:6px 6px 0 #1E1A1A}
.dn-memphis .m6{width:150px;height:150px;background:radial-gradient(#DDF1EA 2.5px,transparent 3px) 0 0/16px 16px;right:20%;bottom:-40px}
.dn-favs-sec .dn-check{border:3px solid #fff;border-radius:0;box-shadow:10px 10px 0 #DDF1EA;transition:transform .15s,box-shadow .15s}
.dn-favs-sec .dn-check:nth-child(3n+2){box-shadow:10px 10px 0 #FF4D5A}
.dn-favs-sec .dn-check:nth-child(3n){box-shadow:10px 10px 0 #F2C230}
.dn-favs-sec .dn-check:hover{transform:translate(-4px,-4px) rotate(-1deg)}
.dn-favs-sec .dn-check-h{background:#1E1A1A}
.dn-favs-sec .dn-check:nth-child(3n+2) .dn-check-h{background:#B3202A}
.dn-checks{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px}
.dn-check{background:#F4FBF7;border:1px solid #9CC9B3;border-radius:4px;box-shadow:0 14px 26px -18px rgba(30,26,26,.5);display:flex;flex-direction:column;background-image:repeating-linear-gradient(#F4FBF7 0 27px,#C9E4D7 27px 28px)}
.dn-check-h{display:flex;justify-content:space-between;background:#2E7D5B;color:#fff;font-weight:700;font-size:.78rem;letter-spacing:.12em;text-transform:uppercase;padding:8px 14px}
.dn-check-b{display:flex;gap:14px;padding:16px 16px 6px;flex:1}
.dn-ico{width:64px;height:64px;flex:none;color:var(--red)}
.dn-ico svg{width:100%;height:100%;display:block}
.dn-check h3{font-size:1.25rem}
.dn-check em{display:block;font-family:var(--ds);font-style:normal;color:var(--red);font-size:1.02rem;margin:2px 0 6px}
.dn-check p{color:var(--muted);font-size:.9rem;line-height:1.5}
.dn-check-f{display:flex;justify-content:space-between;align-items:baseline;border-top:2px dashed #9CC9B3;padding:10px 16px;font-weight:700;color:#2E7D5B;text-transform:uppercase;font-size:.8rem;letter-spacing:.1em}
.dn-check-f b{font-size:1.4rem;color:var(--ink);letter-spacing:0}
.dn-menu{background:#fff}
.dn-book{display:grid;grid-template-columns:240px 1fr;gap:0;border:3px solid var(--red);border-radius:12px;overflow:hidden;box-shadow:0 26px 50px -34px rgba(30,26,26,.7)}
.dn-tabs{background:var(--red);display:flex;flex-direction:column;padding:14px 0}
.dn-tabs button{background:none;border:0;color:#FFE4E6;font-family:var(--db);font-weight:700;font-size:1rem;text-align:left;padding:12px 22px;cursor:pointer;border-left:6px solid transparent}
.dn-tabs button.on{background:#fff;color:var(--red);border-left-color:var(--ink)}
.dn-page{padding:26px 34px;column-count:2;column-gap:40px;min-height:360px}
.dn-page h3{column-span:all;font-family:var(--ds);font-weight:400;color:var(--red);font-size:2rem;margin-bottom:12px}
.dn-mi{break-inside:avoid;padding:10px 0;border-bottom:1px solid #EEE}
.dn-mi .r{display:flex;align-items:baseline;gap:8px}
.dn-mi b{font-weight:700}
.dn-mi i{flex:1;border-bottom:2px dotted #D6D0D0;transform:translateY(-4px)}
.dn-mi span{font-weight:800;color:var(--red)}
.dn-mi p{color:var(--muted);font-size:.88rem;margin-top:2px;line-height:1.45}
.dn-snaps{background:var(--ink)}
.dn-snaps .dn-head h2{color:#fff}.dn-snaps .dn-script{color:#FF8A92}
.dn-polas{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:26px 22px}
.dn-pola{background:#fff;border:0;padding:10px 10px 12px;transform:rotate(var(--r));box-shadow:0 14px 24px -12px rgba(0,0,0,.7);cursor:pointer;transition:transform .2s;text-align:left}
.dn-pola:hover{transform:rotate(0) scale(1.03)}
.dn-pola .ph{height:200px}
.dn-pola span{display:block;font-family:var(--ds);color:var(--ink);font-size:.98rem;margin-top:8px}
.dn-story{display:grid;grid-template-columns:1fr 1fr;gap:0;padding:0;background:var(--mint)}
.dn-story>.ph{min-height:440px}
.dn-story .b{padding:60px clamp(24px,5vw,64px);display:flex;flex-direction:column;justify-content:center;gap:14px;align-items:flex-start}
.dn-story h2{font-size:clamp(2rem,3.8vw,2.9rem);line-height:1.05}
.dn-story p{color:#3F3A3A;line-height:1.7}
.dn-revs{background:#fff}
.dn-napkins{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.dn-napkin{margin:0;background:#fff;padding:24px;border:1px solid #EEE;border-radius:4px;box-shadow:0 12px 24px -18px rgba(30,26,26,.5);background-image:radial-gradient(circle at 100% 100%,transparent 18px,#fff 19px),radial-gradient(circle at 92% 88%,rgba(140,90,60,.18) 0 22px,transparent 23px)}
.dn-napkin .wx-stars{color:#F2A900}
.dn-napkin blockquote{line-height:1.6;margin:10px 0 12px}
.dn-napkin figcaption{font-family:var(--ds);color:var(--red);font-size:1.05rem}
.dn-visit{background:var(--mint)}
.dn-vgrid{display:grid;grid-template-columns:1fr 1fr 1.1fr;gap:20px;align-items:stretch}
.dn-sign{background:var(--ink);color:#fff;border-radius:12px;padding:20px 0;border:4px solid var(--chrome)}
.dn-sign-h{font-weight:800;font-size:2.2rem;letter-spacing:.2em;text-align:center;color:#FF4D5A;text-shadow:0 0 12px rgba(255,77,90,.8);margin-bottom:10px}
.dn-hrs div{display:flex;justify-content:space-between;padding:7px 24px;font-size:.95rem}
.dn-hrs .today{background:var(--red);font-weight:800}
.dn-find{background:#fff;border-radius:12px;padding:26px;display:flex;flex-direction:column;gap:12px;align-items:flex-start}
.dn-find h3{font-family:var(--ds);font-weight:400;color:var(--red);font-size:2rem}
.dn-find address{font-style:normal;line-height:1.6}
.dn-find ul{padding-left:18px;color:var(--muted);line-height:1.7}
.dn-map{background:#fff;border-radius:12px;overflow:hidden;display:flex;border-top:5px solid var(--red)!important}
.dn-map .mapbox{flex:1;min-height:240px}
.dn .wx-map .map-go{background:var(--red);color:#fff}
.dn-foot{background:var(--ink);color:#D8D2D2}
.dn-checker{display:block;height:20px;background:conic-gradient(var(--ink) 25%,#fff 0 50%,var(--ink) 0 75%,#fff 0) 0 0/20px 20px}
.dn-foot .in{max-width:1180px;margin:0 auto;display:flex;gap:18px;align-items:center;flex-wrap:wrap;padding:26px 24px;font-size:.9rem}
.dn-foot b{font-family:var(--ds);font-weight:400;font-size:1.6rem;color:#fff}
.dn-foot span:last-child{margin-left:auto}
@media (max-width:900px){.dn-links{display:none}.dn-mtabs{display:flex;gap:6px;overflow-x:auto;padding:8px 14px 10px;border-top:1px solid #EEE;scrollbar-width:none;-webkit-overflow-scrolling:touch}.dn-mtabs::-webkit-scrollbar{display:none}.dn-mtabs button{flex:none;background:#fff;border:2px solid #1E1A1A;font-family:var(--db);font-weight:700;font-size:.85rem;color:#1E1A1A;padding:7px 12px;border-radius:6px;box-shadow:3px 3px 0 #B3202A}.dn-mtabs button:active{transform:translate(2px,2px);box-shadow:1px 1px 0 #B3202A}.dn-nav-in{grid-template-columns:1fr auto}.dn-memphis .m1,.dn-memphis .m2,.dn-memphis .m5,.dn-memphis .m6{display:none}.dn-favs-sec .dn-check{box-shadow:6px 6px 0 #DDF1EA}.dn-logo{text-align:left;font-size:1.7rem}.dn-mcall{display:inline-flex;width:44px;height:44px;align-items:center;justify-content:center;border-radius:8px;background:var(--red);color:#fff;justify-self:end}.dn-hero{padding-top:28px;background:linear-gradient(#fff 0,#fff 50%,var(--mint) 50%)}.dn-props{padding:0 2%;gap:8px}.dn-tent .f{width:104px;height:112px}.dn-tent .t{font-size:1.4rem;margin-top:-18px;margin-bottom:14px}.dn-tent .s{font-size:.7rem}.dn-tent .g{font-size:.68rem}.dn-bellart{width:84px}.dn-bell-t{padding:7px 8px;margin-bottom:9px}.dn-bell-t small{font-size:.58rem;letter-spacing:.06em}.dn-bell-t b{font-size:.74rem;white-space:nowrap}.dn-mini{min-width:0;padding:8px 6px;font-size:.8rem;border-width:4px;width:104px}.dn-mini b{font-size:.74rem}.dn-booth{grid-template-columns:1fr;padding:34px 18px 56px;margin:0 -24px}.dn-seat{display:none}.dn-table{grid-template-columns:1fr}.dn-window{min-height:260px}.dn-board-sec{grid-template-columns:1fr}.dn-book{grid-template-columns:1fr}.dn-tabs{flex-direction:row;overflow-x:auto;padding:0}.dn-tabs button{flex:none;border-left:0;border-bottom:4px solid transparent}.dn-tabs button.on{border-bottom-color:var(--ink)}.dn-page{column-count:1;padding:20px}.dn-story{grid-template-columns:1fr}.dn-story>.ph{min-height:260px}.dn-vgrid{grid-template-columns:1fr}.dn-sec{padding:60px 18px}.dn-foot span:last-child{margin-left:0}}
@media (prefers-reduced-motion:reduce){.dn .stool{animation:none}}
/* ===== Bayou layout (Fat Tuesday's) ===== */
.by{--bg:#120d17;--bg2:#1c1424;--card:#241a2e;--gold:#F2C230;--gold2:#c99a12;--pur:#7B3FB0;--pur2:#9B4FCF;--grn:#2E9E4A;--grn2:#3DBB5A;--tx:#EDE6F2;--mut:#B3A6C0;--dh:'Abril Fatface',Georgia,serif;--db:'Work Sans',system-ui,sans-serif;background:var(--bg);color:var(--tx);font-family:var(--db)}
.by .ph{background-size:cover;background-position:center}
.by h1,.by h2,.by h3{font-family:var(--dh);font-weight:400;letter-spacing:.01em}
.by-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.by-kick{display:block;font-weight:800;font-size:.78rem;letter-spacing:.2em;text-transform:uppercase;color:var(--grn2);margin-bottom:8px}
.by-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:50px;padding:0 22px;border-radius:8px;font-family:var(--db);font-weight:800;font-size:.96rem;text-decoration:none;border:2px solid transparent;cursor:pointer;transition:transform .15s,box-shadow .15s}
.by-sm{height:42px;padding:0 16px;font-size:.88rem}
.by-gold{background:var(--gold);color:#1a1020;box-shadow:0 0 0 0 rgba(242,194,48,.5),0 6px 20px -6px rgba(242,194,48,.6)}
.by-gold:hover{transform:translateY(-2px);box-shadow:0 0 0 4px rgba(242,194,48,.18),0 10px 26px -6px rgba(242,194,48,.7)}
.by-line{background:transparent;color:var(--tx);border-color:rgba(237,230,242,.35)}
.by-line:hover{border-color:var(--pur2);background:rgba(123,63,176,.2)}
.by-acts{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.by-c{justify-content:center;margin-top:30px}
.by-nav{position:sticky;top:0;z-index:20;background:rgba(18,13,23,.92);backdrop-filter:blur(8px);border-bottom:1px solid rgba(242,194,48,.25)}
.by-nav-in{max-width:1200px;margin:0 auto;display:flex;align-items:center;gap:18px;padding:8px 24px}
.by-brand img{height:52px;display:block;filter:drop-shadow(0 0 10px rgba(242,194,48,.25))}
.by-brand b{font-family:var(--dh);color:var(--gold);font-size:1.6rem}
.by-links{display:flex;gap:2px;margin-left:auto}
.by-links button,.by-mtabs button{background:none;border:0;color:var(--tx);font-family:var(--db);font-weight:700;font-size:.9rem;padding:8px 12px;border-radius:6px;cursor:pointer}
.by-links button:hover{color:var(--gold);background:rgba(255,255,255,.05)}
.by-mtabs{display:none}
.by-hero{position:relative;overflow:hidden;padding:70px 24px 80px;background:radial-gradient(ellipse at 20% 30%,rgba(123,63,176,.35),transparent 55%),radial-gradient(ellipse at 85% 80%,rgba(46,158,74,.22),transparent 50%),var(--bg)}
.by-bulbs{height:30px;background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='30' viewBox='0 0 120 30'%3E%3Cpath d='M0 4 Q60 34 120 4' fill='none' stroke='%23F2C230' stroke-width='.9' opacity='.6'/%3E%3Ccircle cx='0.3' cy='4.1' r='3.4' fill='%23F2C230' stroke='%23120d17' stroke-width='.8'/%3E%3Ccircle cx='-0.7' cy='3.1' r='.9' fill='white' opacity='.7'/%3E%3Ccircle cx='10.5' cy='8.8' r='3.4' fill='%239B4FCF' stroke='%23120d17' stroke-width='.8'/%3E%3Ccircle cx='9.5' cy='7.8' r='.9' fill='white' opacity='.7'/%3E%3Ccircle cx='21.3' cy='12.8' r='3.4' fill='%233DBB5A' stroke='%23120d17' stroke-width='.8'/%3E%3Ccircle cx='20.3' cy='11.8' r='.9' fill='white' opacity='.7'/%3E%3Ccircle cx='32.4' cy='15.8' r='3.4' fill='%23F2C230' stroke='%23120d17' stroke-width='.8'/%3E%3Ccircle cx='31.4' cy='14.8' r='.9' fill='white' opacity='.7'/%3E%3Ccircle cx='43.8' cy='17.9' r='3.4' fill='%239B4FCF' stroke='%23120d17' stroke-width='.8'/%3E%3Ccircle cx='42.8' cy='16.9' r='.9' fill='white' opacity='.7'/%3E%3Ccircle cx='55.2' cy='18.9' r='3.4' fill='%233DBB5A' stroke='%23120d17' stroke-width='.8'/%3E%3Ccircle cx='54.2' cy='17.9' r='.9' fill='white' opacity='.7'/%3E%3Ccircle cx='66.6' cy='18.8' r='3.4' fill='%23F2C230' stroke='%23120d17' stroke-width='.8'/%3E%3Ccircle cx='65.6' cy='17.8' r='.9' fill='white' opacity='.7'/%3E%3Ccircle cx='78.3' cy='17.6' r='3.4' fill='%239B4FCF' stroke='%23120d17' stroke-width='.8'/%3E%3Ccircle cx='77.3' cy='16.6' r='.9' fill='white' opacity='.7'/%3E%3Ccircle cx='89.4' cy='15.4' r='3.4' fill='%233DBB5A' stroke='%23120d17' stroke-width='.8'/%3E%3Ccircle cx='88.4' cy='14.4' r='.9' fill='white' opacity='.7'/%3E%3Ccircle cx='100.5' cy='12.2' r='3.4' fill='%23F2C230' stroke='%23120d17' stroke-width='.8'/%3E%3Ccircle cx='99.5' cy='11.2' r='.9' fill='white' opacity='.7'/%3E%3Ccircle cx='111.3' cy='8.0' r='3.4' fill='%239B4FCF' stroke='%23120d17' stroke-width='.8'/%3E%3Ccircle cx='110.3' cy='7.0' r='.9' fill='white' opacity='.7'/%3E%3C/svg%3E") 0 0/120px 30px repeat-x}
.by-bulbs.t{position:absolute;left:0;right:0;top:4px}

.by-confetti{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0}
.by-confetti svg{position:absolute;inset:0;width:100%;height:100%;display:block}

.by-hero-in{position:relative;z-index:1;max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:50px;align-items:center}
.by-logo{width:min(440px,100%);display:block;filter:drop-shadow(0 8px 30px rgba(155,79,207,.45));margin:4px 0 6px}
.by-tag{font-size:1.25rem;color:var(--tx);margin:6px 0 24px;max-width:520px;line-height:1.5}
.by-open{display:flex;align-items:center;gap:10px;color:var(--mut);margin-top:22px;font-weight:600}
.by-open i{width:10px;height:10px;border-radius:50%;background:#6b5d77}
.by-open i.on{background:var(--grn2);box-shadow:0 0 10px var(--grn2)}
.by-hero-pic{position:relative;height:clamp(340px,40vw,500px)}
.by-hero-pic .ph{position:absolute;inset:0;border-radius:14px;border:3px solid var(--gold);box-shadow:0 0 0 8px rgba(123,63,176,.35),0 30px 60px -20px #000;filter:saturate(1.05) brightness(.92)}
.by-gator{position:absolute;left:-52px;bottom:-62px;width:min(420px,80%);z-index:2;filter:drop-shadow(0 10px 14px rgba(0,0,0,.55))}
.by-gator svg{display:block;width:100%}

.by-ticker{overflow:hidden;background:linear-gradient(90deg,var(--pur),#5a2585);border-top:2px solid var(--gold);border-bottom:2px solid var(--gold)}
.by-ticker-in{display:flex;width:max-content;animation:bytick 40s linear infinite}
.by-ticker span{white-space:nowrap;padding:12px 28px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:.88rem;color:#fff}
.by-ticker span:after{content:"";display:inline-block;width:8px;height:8px;background:var(--gold);transform:rotate(45deg);margin-left:56px;vertical-align:middle}
@keyframes bytick{to{transform:translateX(-50%)}}
.by-sec{padding:84px max(24px,calc((100vw - 1200px)/2));position:relative}
.by-head{text-align:center;margin-bottom:38px}
.by-orn{display:block;width:120px;height:28px;margin:0 auto 8px}
.by-orn svg{display:block;width:100%;height:100%}
.by-head h2{font-size:clamp(2.2rem,4.8vw,3.4rem);line-height:1.05;color:var(--gold);text-shadow:0 0 24px rgba(242,194,48,.25)}
.by-head p{color:var(--mut);margin-top:10px}
.by-drinks{background:var(--bg2)}
.by-coins{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:26px;justify-items:center}
.by-coin{width:210px;height:210px;perspective:900px;position:relative;cursor:pointer;outline:none}
.by-coin .f,.by-coin .b{position:absolute;inset:0;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;backface-visibility:hidden;transition:transform .6s}
.by-coin .f{background:radial-gradient(circle at 35% 30%,#ffe28a,var(--gold) 45%,var(--gold2));color:#2a1a05;box-shadow:inset 0 0 0 8px rgba(0,0,0,.12),inset 0 0 0 11px rgba(255,255,255,.35),0 14px 30px -10px #000}
.by-coin.c1 .f{background:radial-gradient(circle at 35% 30%,#c79bf0,var(--pur2) 45%,#552083);color:#fff}
.by-coin.c2 .f{background:radial-gradient(circle at 35% 30%,#8fe6a3,var(--grn) 45%,#1c6b30);color:#fff}
.by-coin .f small{font-weight:800;letter-spacing:.18em;text-transform:uppercase;font-size:.72rem}
.by-coin .f b{font-family:var(--dh);font-weight:400;font-size:1.35rem;line-height:1.1;margin:6px 0}
.by-coin .f em{font-style:normal;font-weight:800;font-size:1.05rem}
.by-coin .b{transform:rotateY(180deg);background:var(--card);border:3px solid var(--gold);color:var(--tx)}
.by-coin .b b{color:var(--gold);font-family:var(--dh);font-weight:400;font-size:1.05rem;margin-bottom:6px}
.by-coin .b p{font-size:.82rem;line-height:1.45;color:var(--mut)}
.by-coin:hover .f,.by-coin:focus .f{transform:rotateY(180deg)}
.by-coin:hover .b,.by-coin:focus .b{transform:rotateY(360deg)}
.by-favs{background:var(--bg);overflow:hidden}

.by-throws{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:28px;position:relative}
.by-throw{margin:0;background:var(--card);border-radius:14px;overflow:hidden;margin-top:var(--d);border:1px solid rgba(242,194,48,.25);box-shadow:0 20px 40px -24px #000;position:relative;transition:transform .2s}
.by-throw:hover{transform:translateY(-6px) rotate(-.6deg)}
.by-throw .ph{height:240px;filter:brightness(.95)}

.by-throw figcaption{padding:16px 18px 20px}
.by-throw .r{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.by-throw b{font-family:var(--dh);font-weight:400;font-size:1.3rem;color:#fff}
.by-throw .r span{color:var(--gold);font-weight:800;font-size:1.1rem}
.by-throw p{color:var(--mut);font-size:.9rem;line-height:1.5;margin-top:6px}
.by-menu{background:var(--bg2)}
.by-tabs{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:26px}
.by-tabs button{background:transparent;color:var(--tx);border:2px solid rgba(237,230,242,.2);border-radius:8px;padding:9px 16px;font-family:var(--db);font-weight:700;cursor:pointer}
.by-tabs button.c0.on{background:var(--gold);border-color:var(--gold);color:#1a1020}
.by-tabs button.c1.on{background:var(--pur);border-color:var(--pur2);color:#fff}
.by-tabs button.c2.on{background:var(--grn);border-color:var(--grn2);color:#fff}
.by-menu-b{max-width:980px;margin:0 auto;column-count:2;column-gap:46px;background:var(--card);border-radius:14px;padding:30px 36px;border:1px solid rgba(242,194,48,.18)}
.by-mi{break-inside:avoid;padding:11px 0;border-bottom:1px dashed rgba(237,230,242,.12)}
.by-mi .r{display:flex;align-items:baseline;gap:8px}
.by-mi b{font-weight:700;color:#fff}
.by-mi i{flex:1;border-bottom:2px dotted rgba(242,194,48,.35);transform:translateY(-4px)}
.by-mi span{color:var(--gold);font-weight:800}
.by-mi p{color:var(--mut);font-size:.88rem;margin-top:3px;line-height:1.45}
.by .wx-heat{width:14px;height:14px;color:#e2453c;vertical-align:-2px;margin-left:3px}
.by-mardi{overflow:hidden;background:linear-gradient(120deg,#3a1658,#1c1424 50%,#14361f)}
.by-mardi-in{position:relative;z-index:1;display:grid;grid-template-columns:1.2fr 1fr;gap:40px;align-items:center}
.by-mardi h2{font-size:clamp(2.3rem,5vw,3.6rem);color:var(--gold);line-height:1.05;margin-bottom:14px}
.by-mardi p{color:var(--tx);line-height:1.7;max-width:540px}
.by-date{font-weight:800;color:var(--grn2)!important;margin-top:12px;letter-spacing:.04em}
.by-cd{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.by-cd div{background:rgba(0,0,0,.35);border:2px solid var(--gold);border-radius:14px;text-align:center;padding:22px 8px}
.by-cd b{display:block;font-family:var(--dh);font-weight:400;font-size:clamp(2.4rem,5vw,3.6rem);color:#fff;line-height:1}
.by-cd small{color:var(--gold);font-weight:800;text-transform:uppercase;letter-spacing:.16em;font-size:.72rem}
.by-photos{background:var(--bg)}
.by-grid{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:190px;gap:12px}
.by-ph{position:relative;border:0;padding:0;border-radius:10px;overflow:hidden;cursor:pointer;background:var(--card)}
.by-ph .ph{position:absolute;inset:0;transition:transform .4s,filter .4s;filter:brightness(.85)}
.by-ph:hover .ph{transform:scale(1.06);filter:brightness(1)}
.by-ph.g0{grid-column:span 2;grid-row:span 2}.by-ph.g4{grid-row:span 2}
.by-ph span{position:absolute;left:10px;bottom:10px;right:10px;background:rgba(18,13,23,.85);color:var(--tx);font-size:.8rem;font-weight:600;padding:5px 9px;border-radius:6px;text-align:left}
.by-revs{background:var(--bg2)}
.by-quotes{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.by-q{margin:0;background:var(--card);border-radius:14px;padding:24px;border-top:4px solid var(--gold)}
.by-q.c1{border-top-color:var(--pur2)}.by-q.c2{border-top-color:var(--grn2)}
.by-q .wx-stars{color:var(--gold)}
.by-q blockquote{margin:10px 0 12px;line-height:1.6;color:var(--tx)}
.by-q figcaption{color:var(--gold);font-weight:800;font-size:.9rem}
.by-visit{background:var(--bg)}
.by-vgrid{display:grid;grid-template-columns:1fr 1fr 1.1fr;gap:20px}
.by-neon{background:#0b080e;border-radius:14px;padding:20px 0;border:2px solid #2a2033}
.by-neon-h{display:flex;justify-content:center;gap:12px;font-family:var(--dh);font-size:2.3rem;margin-bottom:12px}
.by-neon-h{color:#ff7ad9;text-shadow:0 0 6px #ff7ad9,0 0 18px #c23ea8}
.by-hrs div{display:flex;justify-content:space-between;padding:7px 24px;font-size:.95rem;color:var(--mut)}
.by-hrs .today{background:rgba(123,63,176,.35);color:#fff;font-weight:800}
.by-find{background:var(--card);border-radius:14px;padding:26px;display:flex;flex-direction:column;gap:12px;align-items:flex-start}
.by-find h3{color:var(--gold);font-size:1.8rem}
.by-find address{font-style:normal;line-height:1.6}
.by-find ul{padding-left:18px;color:var(--mut);line-height:1.7}
.by-soc{display:flex;gap:16px}.by-soc a{color:var(--grn2);font-weight:700}
.by-map{border-radius:14px;overflow:hidden;display:flex;border:2px solid var(--pur)}
.by-map .mapbox{flex:1;min-height:240px}
.by .wx-map .map-go{background:var(--gold);color:#1a1020}
.by-foot{background:#0b080e;color:var(--mut)}
.by-foot .in{max-width:1200px;margin:0 auto;display:flex;gap:18px;align-items:center;flex-wrap:wrap;padding:24px;font-size:.9rem}
.by-foot img{height:46px}
.by-foot span:last-child{margin-left:auto}
@media (max-width:900px){.by-links,.by-nav-in .by-btn span{display:none}.by-nav-in .by-btn{margin-left:auto;padding:0 12px}.by-mtabs{display:flex;gap:6px;overflow-x:auto;padding:6px 14px 10px;scrollbar-width:none}.by-mtabs::-webkit-scrollbar{display:none}.by-mtabs button{flex:none;border:1px solid rgba(242,194,48,.4);font-size:.82rem;padding:6px 11px}.by-brand img{height:42px}.by-hero{padding:46px 18px 70px}.by-hero-in{grid-template-columns:1fr;gap:36px}.by-hero-pic{height:300px;margin:0 10px}.by-gator{left:-14px;bottom:-40px;width:min(300px,88%)}.by-sec{padding:64px 18px}.by-menu-b{column-count:1;padding:20px}.by-mardi-in{grid-template-columns:1fr}.by-grid{grid-template-columns:repeat(2,1fr);grid-auto-rows:150px}.by-ph.g4{grid-row:auto}.by-vgrid{grid-template-columns:1fr}.by-coin{width:170px;height:170px}.by-coin .f b{font-size:1.1rem}.by-coins{grid-template-columns:repeat(2,1fr);gap:14px}.by-foot span:last-child{margin-left:0}}
@media (prefers-reduced-motion:reduce){.by-confetti,.by-bulbs.t,.by-gator,.by-ticker-in{animation:none}.by-confetti{display:none}}
/* ===== Bayou v2: status pill, hero CTAs, specials switcher, VIP list, location card ===== */


.by-hero-pic .by-confetti{z-index:1;border-radius:14px}
.by-hero-t{position:relative;z-index:3}
.by-pill{display:inline-flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin:0 0 14px;padding:9px 14px;border-radius:10px;background:rgba(36,26,46,.92);border:1px solid rgba(242,194,48,.4);font-size:.88rem;font-weight:600;color:var(--tx);max-width:100%;line-height:1.3}
.by-pill .st{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap}
.by-pill .st i{width:9px;height:9px;border-radius:50%;background:#6b5d77;flex:none}
.by-pill .st.open i{background:var(--grn2);box-shadow:0 0 10px var(--grn2)}
.by-pill .st.soon i{background:var(--gold);box-shadow:0 0 10px rgba(242,194,48,.7)}
.by-pill .st.closed i{background:#e2453c;box-shadow:0 0 8px rgba(226,69,60,.6)}
.by-pill .st b{font-weight:800;color:#fff}
.by-pill .sep{width:1px;height:14px;background:rgba(237,230,242,.3)}
.by-pill .ad{display:inline-flex;align-items:center;gap:6px;color:var(--gold);text-decoration:none;font-weight:700}
.by-pill a.ad:hover{text-decoration:underline}
.by-pill .ad .ico{width:14px;height:14px;flex:none}
.by-hero-acts{display:flex;flex-direction:column;gap:12px;max-width:520px}
.by-strip{display:flex;align-items:center;gap:12px;width:100%;text-align:left;min-height:54px;padding:10px 16px;border-radius:10px;cursor:pointer;color:var(--tx);font-family:var(--db);background:linear-gradient(90deg,rgba(123,63,176,.55),rgba(46,158,74,.3));border:2px solid var(--gold);transition:transform .15s,box-shadow .15s}
.by-strip:hover{transform:translateY(-2px);box-shadow:0 10px 26px -10px rgba(242,194,48,.55)}
.by-strip .k{display:inline-flex;align-items:center;gap:7px;flex:none;font-weight:800;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
.by-strip .k .ico{width:18px;height:18px;color:var(--gold)}
.by-strip b{flex:1;min-width:0;font-weight:700;font-size:.98rem;line-height:1.3;color:#fff}
.by-strip>.ico{width:18px;height:18px;flex:none;color:var(--gold)}
.by-row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.by-row2 .by-btn{width:100%;padding:0 10px;white-space:nowrap}
.by-links button.hm{color:var(--gold)}
/* specials switcher */
.by-week{max-width:980px;margin:0 auto 56px}
.by-wtabs{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:16px}
.by-wtabs button{background:transparent;color:var(--tx);border:2px solid rgba(237,230,242,.2);border-radius:10px;padding:10px 4px;font-family:var(--db);font-weight:800;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;min-height:58px}
.by-wtabs button:hover{border-color:var(--pur2)}
.by-wtabs .f{font-size:.92rem}
.by-wtabs .s{display:none;font-size:.82rem;letter-spacing:.06em}
.by-wtabs em{font-style:normal;font-size:.6rem;letter-spacing:.14em;text-transform:uppercase;color:var(--grn2);font-weight:800}
.by-wtabs button.on.c0{background:var(--gold);border-color:var(--gold);color:#1a1020}
.by-wtabs button.on.c1{background:var(--pur);border-color:var(--pur2);color:#fff}
.by-wtabs button.on.c2{background:var(--grn);border-color:var(--grn2);color:#fff}
.by-wtabs button.on em{color:inherit}
.by-day{background:var(--card);border:1px solid rgba(242,194,48,.3);border-radius:14px;overflow:hidden}
.by-day-h{display:flex;justify-content:space-between;gap:12px;align-items:baseline;flex-wrap:wrap;padding:16px 24px;background:rgba(0,0,0,.25);border-bottom:1px solid rgba(242,194,48,.2)}
.by-day-h b{font-family:var(--dh);font-weight:400;font-size:1.5rem;color:var(--gold)}
.by-day-h span{color:var(--mut);font-weight:700}
.by-day-g{display:grid;grid-template-columns:1fr 1fr}
.by-dc{padding:26px 24px}
.by-dc+.by-dc{border-left:1px solid rgba(237,230,242,.12)}
.by-dc small{display:block;font-weight:800;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;margin-bottom:8px}
.by-dc.food small{color:var(--gold)}.by-dc.drink small{color:var(--grn2)}
.by-dc h3{font-size:1.5rem;color:#fff;margin-bottom:8px;line-height:1.15}
.by-dc p{color:var(--mut);line-height:1.6}
.by-always>.by-kick{text-align:center;margin-bottom:24px}

/* reviews */
.by-rsum{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;margin:-14px 0 28px;color:var(--mut);font-weight:600}
.by-rsum b{font-family:var(--dh);font-weight:400;font-size:2.4rem;color:var(--gold);line-height:1}
.by-rsum .wx-stars{color:var(--gold)}
.by-quotes{grid-template-columns:repeat(3,1fr)}
.by-q figcaption small{display:block;color:var(--mut);font-weight:600;font-size:.78rem;margin-top:2px}
/* VIP list */
.by-vip{background:var(--bg)}
.by-vip-in{max-width:1040px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:center;background:linear-gradient(135deg,#2a1640,#1c1424 55%,#12301c);border:2px solid var(--gold);border-radius:18px;padding:44px}
.by-vip h2{font-size:clamp(2.2rem,4.6vw,3.2rem);color:var(--gold);line-height:1.05;margin-bottom:12px}
.by-vip p{color:var(--tx);line-height:1.65}
.by-vip ul{list-style:none;margin-top:16px;display:grid;gap:8px;color:var(--mut)}
.by-vip li{display:flex;align-items:center;gap:10px}
.by-vip li .ico{width:16px;height:16px;color:var(--grn2);flex:none}
.by-vip-f{background:rgba(0,0,0,.35);border:1px solid rgba(237,230,242,.16);border-radius:14px;padding:24px;display:flex;flex-direction:column;gap:14px}
.by-vip-f .by-kick{margin:0}
.by-seg{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.by-seg button{height:44px;border-radius:8px;border:2px solid rgba(237,230,242,.25);background:transparent;color:var(--tx);font-family:var(--db);font-weight:800;cursor:pointer}
.by-seg button.on{background:var(--pur);border-color:var(--pur2);color:#fff}
.by-fld{display:flex;flex-direction:column;gap:6px}
.by-fld label{font-weight:700;font-size:.86rem;color:var(--tx)}
.by-fld input{height:50px;border-radius:8px;border:2px solid rgba(237,230,242,.25);background:#120d17;color:#fff;padding:0 14px;font-size:1rem}
.by-fld input:focus,.by-seg button:focus-visible,.by-chk input:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.by-chk{display:flex;gap:10px;align-items:flex-start;font-size:.92rem;color:var(--tx);cursor:pointer}
.by-chk input{width:20px;height:20px;margin-top:2px;accent-color:var(--grn);flex:none}
.by-vip-f .fine{font-size:.78rem;color:var(--mut);line-height:1.5}
.by-full{width:100%}
.by-vip-f .msg{font-size:.88rem;font-weight:700;line-height:1.45;min-height:0}
.by-vip-f .msg.err{color:#ff9a93}
.by-vip-f .msg.info{color:#cfe9d4;background:rgba(46,158,74,.18);border:1px solid rgba(61,187,90,.45);padding:10px 12px;border-radius:8px}
/* footer location card */
.by-visit{background:var(--bg2)}
.by-loc{max-width:1200px;margin:0 auto;border:2px solid var(--gold);border-radius:18px;overflow:hidden;background:var(--card);box-shadow:0 0 0 8px rgba(123,63,176,.25),0 30px 60px -30px #000}
.by-loc-top{padding:26px 32px 22px;background:linear-gradient(90deg,#4b1d73,#2a1640 60%,#14361f);border-bottom:2px solid var(--gold)}
.by-loc-top .by-kick{margin-bottom:4px}
.by-loc-top h2{font-size:clamp(2rem,4vw,2.9rem);color:var(--gold);line-height:1.05}
.by-loc-grid{display:grid;grid-template-columns:1fr 1.15fr 1fr;gap:0}
.by-loc-grid>*{padding:28px 30px}
.by-loc-grid>*+*{border-left:1px solid rgba(237,230,242,.12)}
.by-loc-info{display:flex;flex-direction:column;gap:16px;align-items:flex-start}
.by-loc-info h3{font-size:1.9rem;color:#fff}
.by-addr{display:flex;gap:10px;align-items:flex-start;color:var(--tx);font-weight:600;font-size:1.05rem;line-height:1.45;text-decoration:none}
.by-addr .ico{width:20px;height:20px;color:var(--gold);flex:none;margin-top:2px}
a.by-addr:hover span{text-decoration:underline}
.by-bigtel{display:inline-flex;align-items:center;gap:10px;color:var(--gold);font-family:var(--dh);font-size:clamp(1.7rem,3vw,2.2rem);text-decoration:none;line-height:1.1}
.by-bigtel .ico{width:24px;height:24px;flex:none}
.by-bigtel:hover{text-decoration:underline}
.by-soc{display:flex;gap:10px;flex-wrap:wrap}
.by-soc a{display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 14px;border:2px solid rgba(237,230,242,.25);border-radius:8px;color:var(--tx);font-weight:700;text-decoration:none}
.by-soc a:hover{border-color:var(--grn2);color:var(--grn2)}
.by-soc a .ico{width:18px;height:18px}
.by-loc-hrs{display:flex;flex-direction:column;gap:16px}
.by-loc-hrs>.by-hcard{padding:0}
.by-hcard{background:#0b080e;border-radius:12px;border:2px solid #2a2033;overflow:hidden;padding-bottom:6px}
.by-hcard.kit{border-color:rgba(61,187,90,.6)}
.by-hcard.bar{border-color:rgba(155,79,207,.7)}
.by-hcard-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px;padding:12px 18px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;font-size:.8rem}
.by-hcard.kit .by-hcard-h{background:rgba(46,158,74,.25);color:var(--grn2)}
.by-hcard.bar .by-hcard-h{background:rgba(123,63,176,.3);color:#d7b4f3}
.by-hcard-h span{color:#ff7ad9;text-shadow:0 0 8px #c23ea8}
.by-hcard .by-hrs div{padding:6px 18px}
.by-hnote{padding:6px 18px 10px;font-size:.78rem;color:var(--mut);line-height:1.45}
.by-loc-grid .by-map{border:0!important;border-radius:0;padding:0;align-items:stretch;border-left:1px solid rgba(237,230,242,.12)!important}
.by-loc-grid .by-map .mapbox{min-height:300px;position:relative}
.by-loc-grid .by-map .mapbox svg{width:100%;height:100%;display:block}
@media (max-width:1000px){.by-loc-grid{grid-template-columns:1fr 1fr}.by-loc-grid .by-map{grid-column:1/-1;border-left:0;border-top:1px solid rgba(237,230,242,.12)}.by-loc-grid>.by-loc-hrs{border-left:1px solid rgba(237,230,242,.12)}}
@media (max-width:900px){
  .by-mtabs{justify-content:space-between;gap:4px;padding:6px 10px 10px}
  .by-mtabs button{flex:1 0 auto;white-space:nowrap;text-align:center;font-size:.8rem;padding:7px 6px}
  .by-mtabs button.hm{background:var(--gold);border-color:var(--gold);color:#1a1020}
  .by-quotes{grid-template-columns:1fr}
  .by-vip-in{grid-template-columns:1fr;padding:26px 20px;gap:28px}
  .by-day-g{grid-template-columns:1fr}
  .by-dc+.by-dc{border-left:0;border-top:1px solid rgba(237,230,242,.12)}
  .by-dc{padding:22px 20px}
  .by-day-h{padding:14px 20px}
  .by-wtabs{gap:5px}
  .by-wtabs .f{display:none}.by-wtabs .s{display:block}
  .by-wtabs button{padding:8px 0;min-height:54px}
  .by-wtabs em{font-size:.5rem;letter-spacing:.08em}
  .by-loc-top{padding:22px 20px 18px}
  .by-loc-grid{grid-template-columns:1fr}
  .by-loc-grid>*{padding:22px 20px}
  .by-loc-grid>*+*,.by-loc-grid>.by-loc-hrs{border-left:0;border-top:1px solid rgba(237,230,242,.12)}
  .by-loc-grid .by-map{padding:0}
  .by-loc-grid .by-map .mapbox{min-height:240px}
}
@media (max-width:600px){
  .by-pill .sep{display:none}
  .by-hero .by-kick{letter-spacing:.1em;font-size:.68rem}
  .by-strip{display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center}
  .by-strip .k{grid-column:1/-1}
  .by-pill{font-size:.84rem}
}
@media (prefers-reduced-motion:reduce){.by-strip,.by-btn{transition:none}}
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
.mk-trail .mp-cover{background:#000;border-bottom:5px solid #9FD4D0;padding:40px 0 36px}
.mk-trail .mp-cover .mp-in{grid-template-columns:1.25fr 1fr;grid-template-rows:auto auto;gap:22px 40px;align-items:center}
.mk-trail .mp-cover-l{grid-column:1;grid-row:1}
.mk-trail .mp-meta{grid-column:1;grid-row:2;display:grid;grid-template-columns:1fr 1fr;gap:0 24px;margin:0}
.mk-trail .mp-logo{grid-column:2;grid-row:1/span 2;justify-self:center;width:100%;max-width:400px;height:auto;background:none;padding:0;border-radius:0}
.mk-trail .mp-cover h1{color:#fff}
.mo-more{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:7px;max-width:600px}
.mo-more li{position:relative;padding-left:22px;color:#334155;line-height:1.5}
.mo-more li::before{content:"";position:absolute;left:2px;top:.55em;width:9px;height:9px;background:#0052CC}
.mk-trail .mo-more li::before{background:#24706C}
@media (max-width:860px){.mk-trail .mp-cover .mp-in{grid-template-columns:1fr}.mk-trail .mp-logo{grid-column:1;grid-row:1;max-width:220px}.mk-trail .mp-cover-l{grid-row:2}.mk-trail .mp-meta{grid-row:3;grid-template-columns:1fr}}
.mk-trail .mp-eyebrow{color:#9FD4D0}
.mk-trail .mp-cover p{color:#D2DDDC}
.mk-trail .mp-meta dt{color:#A2B6B4}
.mk-trail .mp-back{color:#24706C}
.mk-trail .mp-label{border-top-color:#0A0C0C;color:#101313}
.mk-trail .mp-label span,.mk-trail .mo-num{color:#24706C}
.mk-trail .mo-body h3{color:#101313}
.mk-trail .mo-price b{color:#101313}
.mk-trail .mo-ex{background:#E8F3F2;border-left-color:#24706C}
.mk-trail .mo-ex span{color:#24706C}
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

/* Menu v2: tufted red vinyl cover, index tabs, laminated page */
.dn-book{border:0!important;border-radius:16px!important;padding:18px;gap:0!important;background-color:#B3202A;background-image:radial-gradient(circle at 50% 50%,#7A121B 0 3px,rgba(255,255,255,.18) 4px,transparent 6px),linear-gradient(45deg,rgba(0,0,0,.12) 25%,transparent 25% 75%,rgba(0,0,0,.12) 75%),linear-gradient(45deg,rgba(0,0,0,.12) 25%,transparent 25% 75%,rgba(0,0,0,.12) 75%);background-size:44px 44px,44px 44px,44px 44px;background-position:22px 22px,0 0,22px 22px;box-shadow:inset 0 0 0 4px #C9CED3,inset 0 0 0 7px #8E1620,0 30px 50px -30px rgba(30,26,26,.8)!important}
.dn-tabs{background:none!important;padding:10px 0!important;gap:8px}
.dn-tabs button{background:#fff!important;color:#1E1A1A!important;border:0!important;border-radius:8px 0 0 8px;margin-left:10px;padding:12px 16px!important;box-shadow:inset 6px 0 0 #2E7D5B,0 3px 0 rgba(0,0,0,.25);transition:transform .15s,margin .15s}
.dn-tabs button:nth-child(3n+2){box-shadow:inset 6px 0 0 #1E1A1A,0 3px 0 rgba(0,0,0,.25)}
.dn-tabs button:nth-child(3n){box-shadow:inset 6px 0 0 #F2C230,0 3px 0 rgba(0,0,0,.25)}
.dn-tabs button:hover{transform:translateX(-4px)}
.dn-tabs button.on{margin-left:0;background:#1E1A1A!important;color:#fff!important;box-shadow:inset 6px 0 0 #FF4D5A!important}
.dn-page{position:relative;background:#fff;border-radius:6px;background-image:linear-gradient(90deg,transparent 46px,rgba(179,32,42,.35) 46px 48px,transparent 48px),repeating-linear-gradient(#fff 0 33px,#E3F2EC 33px 34px);box-shadow:0 0 0 6px rgba(255,255,255,.35),inset 0 0 40px rgba(46,125,91,.06);padding:26px 34px 26px 66px!important;overflow:hidden}
.dn-page:after{content:"";position:absolute;right:-30px;bottom:-30px;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,transparent 58%,rgba(110,70,40,.16) 60%,rgba(110,70,40,.08) 66%,transparent 70%);pointer-events:none}
.dn-page-h{column-span:all;border-bottom:3px double #1E1A1A;margin-bottom:12px;padding-bottom:6px}
.dn-page-h small{display:block;font-weight:800;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:#2E7D5B}
.dn-page-h h3{margin:0!important}
.dn-mi{border-bottom:0!important}
.dn-mi span{display:inline-grid;place-items:center;min-width:62px;height:30px;padding:0 8px;background:#B3202A;color:#fff!important;border-radius:4px;font-size:.92rem;transform:rotate(-2deg);box-shadow:2px 2px 0 #1E1A1A}
.dn-mi span.ask{background:#fff;color:#B3202A!important;border:2px dashed #B3202A;box-shadow:none}
.dn-mi.hfav{border:0!important;background:linear-gradient(90deg,rgba(242,194,48,.22),transparent);margin:0 -10px;padding:10px!important;border-radius:4px}
.dn-star{display:inline-block;font-style:normal;font-size:.62rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;background:#1E1A1A;color:#F2C230;padding:3px 7px;margin-left:8px;border-radius:3px;vertical-align:middle;transform:rotate(-3deg)}
.dn-page-f{column-span:all;margin-top:18px;text-align:center;font-family:var(--ds);color:#B3202A;font-size:1.15rem}
@media (max-width:900px){.dn-book{padding:12px}.dn-tabs{gap:6px;padding:0 0 10px!important}.dn-tabs button{margin-left:0;border-radius:8px 8px 0 0}.dn-tabs button.on{margin-left:0}.dn-page{padding:20px 16px 20px 30px!important;background-image:linear-gradient(90deg,transparent 18px,rgba(179,32,42,.35) 18px 20px,transparent 20px),repeating-linear-gradient(#fff 0 33px,#E3F2EC 33px 34px)}}
@media (max-width:700px){.mo-item{grid-template-columns:1fr;gap:10px;padding:28px 0}.mo-num{padding-top:0}.mo-price{text-align:left;padding-top:8px}.mo-price b{font-size:2rem}}

/* Marketing page: bayou skin (Fat Tuesday's) */
.mp-wlogo{display:block;width:min(320px,80%);margin-bottom:16px;filter:drop-shadow(0 6px 18px rgba(155,79,207,.45))}
.mk-bayou .mp-bar{background:#120d17;border-bottom:3px solid #F2C230}
.mk-bayou .mp-brand{color:#EDE6F2}
.mk-bayou .mp-back{color:#F2C230}
.mk-bayou .mp-cover{background:radial-gradient(ellipse at 15% 20%,rgba(123,63,176,.45),transparent 55%),radial-gradient(ellipse at 90% 90%,rgba(46,158,74,.25),transparent 50%),#120d17;position:relative;padding:52px 0 60px}
.mk-bayou .mp-cover:after{content:"";position:absolute;left:0;right:0;bottom:0;height:6px;background:repeating-linear-gradient(90deg,#7B3FB0 0 40px,#F2C230 40px 80px,#2E9E4A 80px 120px)}
.mk-bayou .mp-cover .mp-in{grid-template-columns:1.2fr 1fr;grid-template-rows:auto auto;gap:24px 48px;align-items:start}
.mk-bayou .mp-cover-l{grid-column:1;grid-row:1}
.mk-bayou .mp-meta{grid-column:1;grid-row:2;display:grid;grid-template-columns:1fr 1fr;gap:0 24px;margin:0;border-top-color:rgba(242,194,48,.3)}
.mk-bayou .mp-meta div{border-bottom-color:rgba(242,194,48,.2)}
.mk-bayou .mp-meta dt{color:#B3A6C0}
.mk-bayou .mp-meta a{color:#F2C230}
.mk-bayou .mp-eyebrow{color:#3DBB5A;font-weight:700}
.mk-bayou .mp-cover h1{color:#fff}
.mk-bayou .mp-cover p{color:#D8CFE0}
.mk-bayou .mp-photo{outline-color:#F2C230;border-color:#241a2e;background:#241a2e}
.mk-bayou .mp-photo figcaption{color:#B3A6C0}
.mk-bayou .mp-label{border-top:3px solid #7B3FB0}
.mk-bayou .mp-label span,.mk-bayou .mo-num{color:#7B3FB0}
.mk-bayou .mo-ex{background:#F5EFFA;border-left-color:#7B3FB0}
.mk-bayou .mo-ex span{color:#6B2D8E}
.mk-bayou .mo-more li::before{background:#2E9E4A}
.mk-bayou .mo-price b{color:#6B2D8E}
@media (max-width:860px){.mk-bayou .mp-cover .mp-in{grid-template-columns:1fr}.mk-bayou .mp-photo{grid-column:1;grid-row:auto}.mk-bayou .mp-meta{grid-template-columns:1fr}}

/* Marketing page: diner skin (Dottie's) */
.mk-diner .mp-bar{border-bottom:4px solid #B3202A}
.mk-diner .mp-back{color:#B3202A}
.mk-diner .mp-cover{background:#fff;color:#1E1A1A;position:relative;padding:48px 0 64px}
.mk-diner .mp-cover:after{content:"";position:absolute;left:0;right:0;bottom:0;height:14px;background:conic-gradient(#1E1A1A 25%,#fff 0 50%,#1E1A1A 0 75%,#fff 0) 0 0/14px 14px}
.mk-diner .mp-cover .mp-in{grid-template-columns:1.2fr 1fr;grid-template-rows:auto auto;gap:26px 48px;align-items:start}
.mk-diner .mp-cover-l{grid-column:1;grid-row:1}
.mk-diner .mp-meta{grid-column:1;grid-row:2;display:grid;grid-template-columns:1fr 1fr;gap:0 24px;margin:0;border-top-color:#D7D2D2}
.mk-diner .mp-meta div{border-bottom-color:#D7D2D2}
.mk-diner .mp-meta dt{color:#6B6363}
.mk-diner .mp-meta a{color:#B3202A}
.mp-word{font-family:'Pacifico',cursive;color:#B3202A;font-size:clamp(2.6rem,5.4vw,4rem);line-height:1.1;margin-bottom:14px;text-shadow:3px 3px 0 rgba(179,32,42,.14)}
.mk-diner .mp-eyebrow{color:#2E7D5B;font-weight:700}
.mk-diner .mp-cover h1{color:#1E1A1A}
.mk-diner .mp-cover p{color:#4A4444}
.mp-photo{grid-column:2;grid-row:1/span 2;margin:0;background:#fff;border:10px solid #fff;outline:3px solid #C9CED3;border-radius:10px;box-shadow:0 30px 50px -30px rgba(30,26,26,.6)}
.mp-photo .ph{height:380px;background-size:cover;background-position:center;border-radius:2px}
.mp-photo figcaption{font-size:.82rem;color:#6B6363;padding-top:8px}
.mk-diner .mp-label{border-top:3px solid #B3202A;color:#1E1A1A}
.mk-diner .mp-label span,.mk-diner .mo-num{color:#B3202A}
.mk-diner .mo-body h3{color:#1E1A1A}
.mk-diner .mo-ex{background:#EEF8F4;border-left-color:#2E7D5B}
.mk-diner .mo-ex span{color:#2E7D5B}
.mk-diner .mo-more li::before{background:#B3202A}
.mk-diner .mo-price b{color:#B3202A}
@media (max-width:860px){.mk-diner .mp-cover .mp-in{grid-template-columns:1fr}.mp-photo{grid-column:1;grid-row:auto}.mp-photo .ph{height:240px}.mk-diner .mp-meta{grid-template-columns:1fr}}
@media (max-width:980px){.mp-cover .mp-in{grid-template-columns:1fr}.mp-logo{display:none}.mp-body{grid-template-columns:1fr}.mp-side{position:static}}
@media (max-width:700px){.mp-in{padding:0 18px}.mp-cover{padding:44px 0 36px}.mp-plans{grid-template-columns:1fr}.mp-plan{border-left:0;border-top:1px solid #E2E8F0}.mp-plan:first-child{border-top:0}.mp-plan.on{box-shadow:inset 3px 0 0 #0052CC}.mp-row{flex-direction:column;gap:12px}.mp-row-r{width:100%;justify-content:space-between}.mp-row-price{text-align:left}}
@media (max-width:640px){.rb-bar .t span{display:none}.pub-nav,.pub-foot,.lg-nav,.lg-foot,.tr-top,.tr-nav,.tr-foot,.pub-hero,.lg-hero,.tr-hero{padding-left:18px!important;padding-right:18px!important}}
/* BUZ marketing proposal: black and hot pink */
.mk-buz .mp-bar{border-bottom:3px solid #111}
.mk-buz .mp-brand{color:#111}
.mk-buz .mp-back{color:#C2125F}
.mk-buz .mp-cover{background:#111;border-bottom:5px solid #FF4FA3;padding:44px 0 40px}
.mk-buz .mp-cover .mp-in{grid-template-columns:1.3fr 1fr;grid-template-rows:auto auto;gap:26px 48px;align-items:center}
.mk-buz .mp-cover-l{grid-column:1;grid-row:1}
.mk-buz .mp-wlogo{width:112px;height:112px;border-radius:50%;margin-bottom:22px;display:block}
.mk-buz .mp-eyebrow{color:#FF4FA3}
.mk-buz .mp-cover h1{color:#fff}
.mk-buz .mp-cover p{color:#D4D4D8}
.mk-buz .mp-meta{grid-column:1;grid-row:2;display:grid;grid-template-columns:1fr 1fr;gap:0 24px;margin:0}
.mk-buz .mp-meta dt{color:#A1A1AA}
.mk-buz .mp-photo{grid-column:2;grid-row:1/span 2;margin:0}
.mk-buz .mp-photo .ph{aspect-ratio:4/5;max-height:430px;width:100%;background-size:cover;background-position:center;border-radius:12px;border:3px solid #fff;box-shadow:8px 8px 0 #FF4FA3}
.mk-buz .mp-photo figcaption{color:#A1A1AA;font-size:.8rem;margin-top:12px}
.mk-buz .mp-label{border-top-color:#111;color:#111}
.mk-buz .mp-label span,.mk-buz .mo-num{color:#C2125F}
.mk-buz .mo-body h3,.mk-buz .mo-price b{color:#111}
.mk-buz .mo-more li::before{background:#FF4FA3}
.mk-buz .mo-ex{background:#FFF1F8;border-left-color:#FF4FA3}
.mk-buz .mo-ex span{color:#C2125F}
@media (max-width:860px){.mk-buz .mp-cover .mp-in{grid-template-columns:1fr}.mk-buz .mp-photo{grid-column:1;grid-row:auto}.mk-buz .mp-photo .ph{aspect-ratio:4/3}.mk-buz .mp-meta{grid-template-columns:1fr}.mk-buz .mo-item{grid-template-columns:36px 1fr}.mk-buz .mo-price{grid-column:2;text-align:left}}
/* ===== BUZ: bright, playful coffee + energy ===== */
.bz{--ink:#111;--pk:#FF4FA3;--lv:#B69CFF;--mt:#3DDBA5;--sk:#4CC3FF;--sn:#FFD23F;--co:#FF7A59;--soft:#FFF5FA;--bf:'Fredoka','Nunito',system-ui,sans-serif;--bb:'Nunito',system-ui,sans-serif;background:#fff;color:var(--ink);font-family:var(--bb);font-weight:600;line-height:1.55}
.bz *{box-sizing:border-box}
.bz h1,.bz h2,.bz h3,.bz h4{font-family:var(--bf);font-weight:600;line-height:1.1;margin:0;color:var(--ink)}
.bz-wrap{max-width:1120px;margin:0 auto;padding:0 22px}
.bz-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 22px;border-radius:10px;border:3px solid var(--ink);font-family:var(--bf);font-weight:600;font-size:1.02rem;text-decoration:none;cursor:pointer;transition:transform .15s,box-shadow .15s}
.bz-btn.ink{background:var(--ink);color:#fff;box-shadow:4px 4px 0 var(--pk)}
.bz-btn.line{background:#fff;color:var(--ink);box-shadow:4px 4px 0 var(--sk)}
.bz-btn:hover{transform:translate(-2px,-2px)}
.bz-btn.sm{min-height:40px;padding:0 14px;font-size:.92rem;box-shadow:3px 3px 0 var(--pk)}
.bz-btn .ico{width:16px;height:16px}
.bz-cta{display:flex;flex-wrap:wrap;gap:14px;margin-top:22px}
.bz-mk{display:inline-block;flex:none}.bz-mk svg,.bz-mk img{display:block;width:100%;height:100%}.bz-mk.img img{object-fit:cover;border-radius:50%;border:4px solid var(--ink);background:#fff}
.bz-mk.lg{width:132px;height:132px;margin-bottom:22px}.bz-mk.sm{width:44px;height:44px}
.bz-nav{position:sticky;top:0;z-index:30;background:#fff;border-bottom:3px solid var(--ink)}
.bz-nav-in{max-width:1120px;margin:0 auto;padding:10px 22px;display:flex;align-items:center;gap:18px}
.bz-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink)}.bz-brand b{font-family:var(--bf);font-size:1.25rem;font-weight:600;white-space:nowrap}
.bz-links{display:flex;gap:6px;margin-left:auto}
.bz-links button,.bz-mlinks button{white-space:nowrap;background:none;border:0;cursor:pointer;font-family:var(--bf);font-weight:500;font-size:1rem;color:var(--ink);padding:8px 12px;border-radius:8px}
.bz-links button:hover{background:var(--soft)}
.bz-st{display:inline-flex;align-items:center;gap:8px;font-size:.86rem;font-weight:800;border:2px solid var(--ink);border-radius:8px;padding:5px 10px;background:#fff;white-space:nowrap}
.bz-st:empty{display:none}.bz-st i{width:10px;height:10px;border-radius:50%;background:#9CA3AF;flex:none}.bz-st.open i{background:#16A34A}.bz-st.soon i{background:var(--sn)}.bz-st.closed i{background:var(--pk)}
.bz-st em{font-style:normal;font-weight:600;color:#444}
.bz-mlinks{display:none}
.bz-hero{position:relative;overflow:hidden;background:var(--soft);border-bottom:3px solid var(--ink)}
.bz-hero::before,.bz-hero::after{content:'';position:absolute;border-radius:50%;z-index:0}
.bz-hero::before{width:420px;height:420px;background:var(--lv);opacity:.28;right:-120px;top:-140px}
.bz-hero::after{width:300px;height:300px;background:var(--sk);opacity:.25;left:-110px;bottom:-130px}
.bz-hero-in{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:56px 22px 64px;display:grid;grid-template-columns:1.1fr .9fr;gap:30px;align-items:center}
.bz-hero h1{font-size:clamp(2.2rem,5vw,3.7rem);max-width:15ch}
.bz-hero-t p{font-size:1.15rem;max-width:46ch;margin:16px 0 0;color:#333}
.bz-hero-art{position:relative;height:340px}
.bz-hc{position:absolute;width:132px;filter:drop-shadow(5px 6px 0 rgba(17,17,17,.14))}
.bz-hc svg{display:block;width:100%;height:auto}
.bz-hc.c0{left:4%;top:34px;transform:rotate(-8deg)}.bz-hc.c1{left:32%;top:0;width:150px;transform:rotate(4deg)}.bz-hc.c2{right:6%;top:46px;transform:rotate(9deg)}.bz-hc.c3{left:24%;top:170px;width:120px;transform:rotate(-4deg)}
.bz-info{background:#fff;padding:28px 0 8px}
.bz-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.bz-tile{display:block;text-decoration:none;color:var(--ink);border:3px solid var(--ink);border-radius:12px;padding:16px 18px;box-shadow:5px 5px 0 var(--ink)}
.bz-tile small{display:block;font-family:var(--bf);font-weight:500;font-size:.84rem;letter-spacing:.08em;text-transform:uppercase}.bz-tile b{display:block;font-family:var(--bf);font-weight:600;font-size:1.3rem;line-height:1.2;margin:4px 0 2px}.bz-tile span{font-size:.92rem;font-weight:700;color:#222}
.bz-tile.t1{background:var(--sn)}.bz-tile.t2{background:var(--mt)}.bz-tile.t3{background:var(--sk)}
.bz-sec{padding:60px 0}
.bz-sec h2{font-size:clamp(1.9rem,4vw,2.7rem)}
.bz-sub{margin:10px 0 0;font-size:1.05rem;color:#444}
.bz-bar{display:flex;flex-wrap:wrap;gap:14px;align-items:center;margin:26px 0 24px}
.bz-tabs{display:flex;flex-wrap:wrap;gap:10px}
.bz-tab{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 16px;border:3px solid var(--ink);border-radius:10px;background:#fff;font-family:var(--bf);font-weight:500;font-size:1rem;cursor:pointer;color:var(--ink)}
.bz-tab i{width:14px;height:14px;border-radius:50%;background:var(--cc);border:2px solid var(--ink)}
.bz-tab[aria-pressed="true"]{background:var(--cc);box-shadow:3px 3px 0 var(--ink)}.bz-tab[aria-pressed="true"]:first-child{color:#fff}.bz-tab[aria-pressed="true"] i{background:#fff}
.bz-search{margin-left:auto;min-height:44px;width:min(260px,100%);border:3px solid var(--ink);border-radius:10px;padding:0 14px;font:600 1rem var(--bb);color:var(--ink);background:#fff}
.bz-search:focus-visible,.bz-btn:focus-visible,.bz-tab:focus-visible,.bz-links button:focus-visible{outline:3px solid var(--pk);outline-offset:2px}
.bz-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.bz-card{display:grid;grid-template-columns:92px 1fr;gap:14px;align-items:center;border:3px solid var(--ink);border-radius:12px;padding:14px;background:#fff;box-shadow:5px 5px 0 var(--cc)}
.bz-art{width:92px}.bz-art svg{display:block;width:100%;height:auto}
.bz-cat{display:inline-block;font-family:var(--bf);font-weight:500;font-size:.74rem;letter-spacing:.08em;text-transform:uppercase;background:var(--cc);border:2px solid var(--ink);border-radius:6px;padding:1px 8px}
.bz-card h4{font-size:1.3rem;margin:7px 0 6px}
.bz-card p{margin:0 0 6px;font-size:.92rem;color:#444}
.bz-sz{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:6px}
.bz-sz li{display:inline-flex;gap:6px;align-items:baseline;border:2px solid var(--ink);border-radius:8px;padding:2px 9px;font-size:.88rem;background:#fff}.bz-sz span{color:#444}.bz-sz b{font-family:var(--bf);font-weight:600}
.bz-empty{margin:18px 0 0;font-size:1.05rem}
.bz-also{margin-top:40px}.bz-also h3{font-size:1.4rem;margin-bottom:14px}
.bz-tags{display:flex;flex-wrap:wrap;gap:10px}.bz-tags span{background:var(--cc);border:3px solid var(--ink);border-radius:10px;padding:8px 14px;font-family:var(--bf);font-weight:500}
.bz-band{background:var(--pk);border-top:3px solid var(--ink);border-bottom:3px solid var(--ink);padding:48px 0;color:var(--ink)}
.bz-band-in{display:grid;grid-template-columns:1.2fr .8fr;gap:24px;align-items:center}
.bz-band h2{font-size:clamp(1.9rem,4.4vw,3rem);color:var(--ink)}.bz-band p{margin:12px 0 0;font-size:1.1rem;max-width:48ch;color:var(--ink)}
.bz-cans{display:flex;gap:10px;justify-content:center}.bz-bc{width:104px;filter:drop-shadow(4px 5px 0 rgba(17,17,17,.2))}.bz-bc:nth-child(2){transform:translateY(14px) rotate(5deg)}.bz-bc:nth-child(1){transform:rotate(-6deg)}.bz-bc svg{display:block;width:100%}
.bz-about{display:grid;grid-template-columns:1.1fr .9fr;gap:36px;align-items:start}
.bz-about p{margin:14px 0 0;font-size:1.08rem;max-width:56ch}
.bz-facts{margin:0;display:grid;gap:12px}.bz-facts div{border:3px solid var(--ink);border-radius:12px;padding:12px 16px;background:#fff;box-shadow:5px 5px 0 var(--cc)}
.bz-facts dt{font-family:var(--bf);font-weight:500;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;color:#444}.bz-facts dd{margin:2px 0 0;font-family:var(--bf);font-weight:600;font-size:1.2rem}
.bz-gal{background:#fff}
.bz-photos{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-flow:dense;gap:14px;margin-top:24px}
.bz-gt{position:relative;display:block;padding:0;border:3px solid var(--ink);border-radius:12px;overflow:hidden;background:#fff;cursor:pointer;aspect-ratio:1;box-shadow:5px 5px 0 var(--sk)}
.bz-gt:nth-child(4n+2){box-shadow:5px 5px 0 var(--pk)}.bz-gt:nth-child(4n+3){box-shadow:5px 5px 0 var(--mt)}.bz-gt:nth-child(4n){box-shadow:5px 5px 0 var(--sn)}
.bz-gt.big{grid-column:span 2;grid-row:span 2}
.bz-ph{position:absolute;inset:0;background-size:cover;background-position:center;transition:transform .3s}
.bz-gt:hover .bz-ph{transform:scale(1.04)}
.bz-gt em{position:absolute;left:0;right:0;bottom:0;padding:18px 10px 8px;font-style:normal;font-family:var(--bf);font-weight:500;font-size:.88rem;line-height:1.2;color:#fff;background:linear-gradient(0deg,rgba(17,17,17,.78),rgba(17,17,17,0));text-align:left}
.bz-gt:focus-visible{outline:3px solid var(--pk);outline-offset:3px}
.bz-hero-art.ph3{height:380px}
.bz-hp{position:absolute;display:block;padding:0;border:3px solid var(--ink);border-radius:12px;overflow:hidden;background:#fff;cursor:pointer;box-shadow:6px 6px 0 var(--ink)}
.bz-hp span{display:block;width:100%;height:100%;background-size:cover;background-position:center}
.bz-hp.p0{left:2%;top:40px;width:46%;aspect-ratio:3/4;transform:rotate(-5deg);box-shadow:6px 6px 0 var(--pk)}
.bz-hp.p1{right:0;top:0;width:44%;aspect-ratio:1;transform:rotate(4deg);box-shadow:6px 6px 0 var(--sk)}
.bz-hp.p2{right:6%;top:200px;width:42%;aspect-ratio:1;transform:rotate(-3deg);box-shadow:6px 6px 0 var(--mt)}
.bz-lb{position:fixed;inset:0;z-index:100;background:rgba(17,17,17,.94);display:flex;flex-direction:column;color:#fff}
.bz-lb-x{align-self:flex-end;margin:14px;min-height:44px;padding:0 18px;border:3px solid #fff;border-radius:10px;background:transparent;color:#fff;font:600 1rem var(--bf);cursor:pointer}
.bz-lb-stage{position:relative;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:0 12px}
.bz-lb-stage img{max-width:100%;max-height:100%;object-fit:contain;border-radius:10px;border:3px solid #fff;background:#222}
.bz-lb-a{position:absolute;top:50%;margin-top:-26px;z-index:2;width:52px;height:52px;background:rgba(17,17,17,.7)!important;border:3px solid #fff;border-radius:10px;color:#fff;font:600 2rem/1 var(--bf);cursor:pointer}
.bz-lb-a.l{left:18px}.bz-lb-a.r{right:18px}.bz-lb-a:hover,.bz-lb-x:hover{background:var(--pk);border-color:var(--pk);color:#111}
.bz-lb-bar{display:flex;justify-content:space-between;gap:14px;padding:14px 20px 22px;font-family:var(--bf);font-weight:500}
.bz-lb-cap{margin:0;font-size:1.05rem}.bz-lb-n{opacity:.8}
.bz-season{background:var(--soft);border-top:3px solid var(--ink)}
.bz-sgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:24px}
.bz-scard{border:3px solid var(--ink);border-radius:12px;overflow:hidden;background:#fff;box-shadow:5px 5px 0 var(--cc)}
.bz-sph{aspect-ratio:4/3;background-size:cover;background-position:center;border-bottom:3px solid var(--ink)}.bz-sph.art{display:grid;place-items:center;background:var(--soft)}.bz-sph.art svg{width:90px}
.bz-sb{padding:14px 16px 18px}.bz-sb h3{font-size:1.3rem;margin:8px 0 4px}.bz-sb p{margin:0;font-size:.95rem;color:#444}
.bz-build{border-top:3px solid var(--ink)}
.bz-bgrid{display:grid;grid-template-columns:1.25fr .75fr;gap:26px;margin-top:24px;align-items:start}
.bz-brow{margin-bottom:20px}.bz-brow h3{font-size:1.1rem;margin-bottom:10px}
.bz-chips{display:flex;flex-wrap:wrap;gap:8px}
.bz-grp{margin-bottom:12px}.bz-gl{display:inline-flex;align-items:center;gap:8px;font-family:var(--bf);font-weight:500;font-size:.8rem;letter-spacing:.08em;text-transform:uppercase;margin-bottom:6px}.bz-gl i{width:12px;height:12px;border-radius:50%;background:var(--cc);border:2px solid var(--ink)}
.bz-bsub{font-size:.88rem!important;color:#444!important}.bz-bres span.bz-cat{display:inline-block;margin-bottom:6px;font-size:.74rem;color:var(--ink)}
.bz-chip{min-height:42px;padding:0 14px;border:3px solid var(--ink);border-radius:10px;background:#fff;color:var(--ink);font:600 .98rem var(--bf);cursor:pointer;white-space:pre}
.bz-chip[aria-pressed="true"]{background:var(--ink);color:#fff;box-shadow:3px 3px 0 var(--pk)}
.bz-chip:focus-visible,.bz-camp:focus-visible,.bz-btn:focus-visible{outline:3px solid var(--pk);outline-offset:2px}
.bz-bout{position:sticky;top:96px;display:grid;justify-items:center;gap:8px;border:3px solid var(--ink);border-radius:12px;padding:22px;background:var(--soft);box-shadow:6px 6px 0 var(--lv);text-align:center}
.bz-bcup{width:130px}.bz-bcup svg{display:block;width:100%;height:auto}
.bz-bres small{display:block;font-family:var(--bf);font-weight:500;letter-spacing:.08em;text-transform:uppercase;font-size:.8rem}
.bz-bres b{display:block;font-family:var(--bf);font-weight:600;font-size:1.4rem;line-height:1.2;margin-top:4px}.bz-bres span{display:block;font-size:1rem;color:#333;margin-top:2px}
.bz-bres strong{display:block;font-family:var(--bf);font-weight:600;font-size:2.2rem;margin:8px 0 12px}
.bz-bnote{margin:10px 0 0;font-size:.88rem;color:#444}
.bz-gift{background:var(--lv);border-top:3px solid var(--ink);border-bottom:3px solid var(--ink);padding:40px 0}
.bz-gift-in{display:grid;grid-template-columns:240px 1fr;gap:28px;align-items:center}
.bz-gph{aspect-ratio:1;border:3px solid var(--ink);border-radius:12px;background-size:cover;background-position:center;box-shadow:6px 6px 0 var(--ink)}
.bz-gift h2{font-size:clamp(1.8rem,4vw,2.5rem)}.bz-gift p{margin:10px 0 0;font-size:1.1rem;max-width:46ch}
.bz-walk{background:#fff}
.bz-camps{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:22px}
.bz-camp{display:grid;grid-template-columns:auto 1fr;column-gap:12px;align-items:center;text-decoration:none;color:var(--ink);border:3px solid var(--ink);border-radius:12px;padding:16px 18px;background:var(--cc);box-shadow:5px 5px 0 var(--ink)}
.bz-camp .ico{width:22px;height:22px;grid-row:span 2}.bz-camp b{font-family:var(--bf);font-weight:600;font-size:1.2rem}.bz-camp span{font-size:.9rem;font-weight:700}
.bz-follow{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;margin-top:26px;border:3px solid var(--ink);border-radius:12px;padding:16px 20px;background:var(--sn)}.bz-follow b{font-family:var(--bf);font-weight:600;font-size:1.3rem}.bz-follow .bz-cta{margin:0}

.bz-visit{background:var(--soft);border-top:3px solid var(--ink)}
.bz-vgrid{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.bz-card2{border:3px solid var(--ink);border-radius:12px;padding:24px;background:#fff;box-shadow:6px 6px 0 var(--ink)}.bz-card2.hrs{box-shadow:6px 6px 0 var(--sn)}.bz-card2.loc{box-shadow:6px 6px 0 var(--mt)}
.bz-card2 h3{font-size:1.6rem;margin-bottom:14px}
.bz-hrs div{display:flex;justify-content:space-between;gap:14px;padding:9px 10px;border-bottom:2px dashed #D4D4D8;font-size:1.02rem}.bz-hrs div:last-child{border-bottom:0}.bz-hrs .today{background:var(--sn);border-radius:8px;border-bottom-color:transparent;font-weight:800}
.bz-addr b{display:block;font-family:var(--bf);font-weight:600;font-size:1.4rem}.bz-addr span{display:block;font-size:1.05rem;color:#333}
.bz-addr{margin:0}.bz-note{margin:12px 0 0;font-size:1rem;background:var(--soft);border:2px solid var(--ink);border-radius:8px;padding:8px 12px}
.bz .socials{display:flex;gap:10px;margin-top:18px}.bz .socials a{display:grid;place-items:center;width:44px;height:44px;border:3px solid var(--ink);border-radius:10px;background:#fff;color:var(--ink)}.bz .socials a:hover{background:var(--pk)}
.bz-foot{background:var(--ink);color:#fff;padding:22px 0}.bz-foot-in{display:flex;align-items:center;gap:14px;flex-wrap:wrap}.bz-foot b{font-family:var(--bf);font-weight:600}.bz-foot .socials{margin:0 0 0 auto}.bz-foot .socials a{border-color:#fff;background:transparent;color:#fff}.bz-foot .bz-mk svg circle{stroke:#fff}
@media (max-width:900px){.bz-sgrid,.bz-camps{grid-template-columns:repeat(2,1fr)}.bz-bgrid{grid-template-columns:1fr}.bz-bout{position:static}.bz-gift-in{grid-template-columns:1fr}.bz-gph{max-width:240px}.bz-photos{grid-template-columns:repeat(3,1fr)}.bz-hero-art.ph3{height:320px;max-width:420px}.bz-hero-in,.bz-band-in,.bz-about,.bz-vgrid{grid-template-columns:1fr}.bz-grid{grid-template-columns:repeat(2,1fr)}.bz-hero-art{height:270px;max-width:420px}.bz-tiles{grid-template-columns:1fr}.bz-links{display:none}.bz-nav-in .bz-btn.sm{margin-left:auto}.bz-mlinks{display:flex;gap:6px;overflow-x:auto;padding:0 14px 8px}.bz-mlinks button{white-space:nowrap;border:2px solid var(--ink)}}
@media (max-width:620px){.bz-sgrid,.bz-camps{grid-template-columns:1fr}.bz-photos{grid-template-columns:repeat(2,1fr);gap:10px}.bz-hero-art.ph3{height:260px}.bz-hp.p2{top:140px}.bz-lb-a{width:42px;height:42px;margin-top:-21px}.bz-lb-a.l{left:10px}.bz-lb-a.r{right:10px}.bz-lb-stage{padding:0 6px}.bz-grid{grid-template-columns:1fr}.bz-sec{padding:44px 0}.bz-hero-in{padding:36px 18px 44px}.bz-wrap{padding:0 18px}.bz-mk.lg{width:104px;height:104px}.bz-hero-art{height:230px}.bz-hc{width:100px}.bz-hc.c1{width:116px}.bz-hc.c3{width:92px;top:132px}.bz-st{display:none}.bz-brand b{font-size:1.05rem}.bz-search{margin-left:0;width:100%}.bz-photos{grid-template-columns:repeat(2,1fr)}.bz-cans{justify-content:flex-start}.bz-nav-in{padding:8px 14px;gap:10px}.bz-btn.sm span{display:none}.bz-btn.sm{padding:0 12px}}
@media (prefers-reduced-motion:reduce){.bz-btn{transition:none}}
'''

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://script.google.com https://script.googleusercontent.com; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src https://www.google.com https://maps.google.com">
<title>Website Preview | Riverbend Web Co.</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Alfa+Slab+One&family=Pacifico&family=Work+Sans:wght@400;600;700;800&family=Archivo:wght@400;600;800&family=Fredoka:wght@500;600&family=Nunito:wght@600;700;800&family=Bebas+Neue&family=Bitter:wght@500;700;800&family=Rye&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&display=swap" rel="stylesheet">
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
