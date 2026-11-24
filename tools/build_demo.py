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

/* Osteria: light porcelain sections for a brighter, more luxurious feel */
.os-light{background:#FAF9F7;color:#2A1F1A;--mut:#6B5E52}
.os-light.os-white{background:#FFFFFF}
.os-light h2,.os-light .os-brand{color:#1E1612}
.os-light .os-eyebrow{color:#8C6A2F}
.os-light .os-sprig{color:#B8924A}
.os-light .os-about,.os-light p{color:#4A3F37}
.os-light .os-link{color:#7A1F2B;border-bottom-color:rgba(122,31,43,.4)}
.os-light .os-story-pic{box-shadow:24px 24px 0 #7A1F2B}
.os-light .os-tabs{border-bottom-color:#E7E1D8}
.os-light .os-tabs button{color:#8A7E72}
.os-light .os-tabs button.on{color:#1E1612;border-bottom-color:#B8924A}
.os-light .os-item-top b{color:#1E1612}
.os-light .os-price{color:#7A1F2B}
.os-light .os-dots{border-bottom-color:rgba(184,146,74,.55)}
.os-light .os-item p{color:#6B5E52}
.os-light .os-item-pic{border-color:#E2D4B8;box-shadow:0 6px 18px rgba(30,22,18,.12)}
.os-light .os-rev{background:#fff;border-color:#ECE6DC;box-shadow:0 14px 40px rgba(30,22,18,.06)}
.os-light .os-rev blockquote{color:#2A1F1A}
.os-light .os-rev figcaption{color:#8C6A2F}
.os-light .os-info-c{background:#FFFFFF;border-color:#ECE6DC;box-shadow:0 18px 44px rgba(30,22,18,.07)}
.os-light .os-info-c small{color:#8C6A2F}
.os-light .os-info-c p,.os-light .os-info-c p a{color:#1E1612}
.os-light .os-ico{color:#B8924A;border-color:#E2D4B8}
.os-light .os-arrow{color:#7A1F2B}
.os-light .os-hrs{color:#4A3F37}
.os-light .os-hrs>div.on{color:#7A1F2B}
.os-light .os-map{border-color:#ECE6DC;box-shadow:0 20px 50px rgba(30,22,18,.1)}
.os-light .socials a{color:#B8924A;border-color:#E2D4B8}
.os .os-btn.gold{box-shadow:0 10px 24px rgba(201,163,91,.25)}

/* Osteria: cozy candlelit luxury (warm browns, amber glow, fine grain) */
body.t-os{background:#1F1611}
.os{--esp:#1F1611;--esp2:#2A1E17;--gold:#D4AE6A;--gold2:#EBCB8E;--ivory:#F5EBDD;--mut:#C7B49C;background:#1F1611;position:relative}
.os::before{content:"";position:fixed;inset:0;pointer-events:none;z-index:50;opacity:.07;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.os-sec{position:relative;overflow:hidden}
.os-sec>.os-wrap{position:relative;z-index:1}
.os-story,.os-gal,.os-visit{background:radial-gradient(ellipse 60% 70% at 15% 20%,rgba(214,150,70,.12),rgba(0,0,0,0) 70%),#2A1E17}
.os-menu,.os-revs{background:radial-gradient(ellipse 55% 60% at 85% 15%,rgba(214,150,70,.1),rgba(0,0,0,0) 70%),radial-gradient(ellipse 50% 50% at 10% 90%,rgba(122,31,43,.18),rgba(0,0,0,0) 70%),#1F1611}
.os-reserve{background:radial-gradient(ellipse 60% 80% at 80% 50%,rgba(214,150,70,.14),rgba(0,0,0,0) 70%),linear-gradient(135deg,#4A1620,#2A1E17 65%)}
.os-nav{background:rgba(31,22,17,.82);border-bottom-color:rgba(212,174,106,.25)}
.os h2{color:#FFF6EA}
.os-hero h1{text-shadow:0 8px 50px rgba(60,30,10,.6)}
.os-story-pic{border-radius:18px;box-shadow:0 30px 70px rgba(0,0,0,.45),0 0 0 1px rgba(212,174,106,.25)}
.os-about,.os-res-in p{color:#E8DCCB}
.os-item{padding:16px 18px;border-radius:14px;transition:background .25s}
.os-item:hover{background:rgba(212,174,106,.06)}
.os-item-top b,.os-addr,.os-info-c p,.os-info-c p a{color:#FFF6EA}
.os-item p,.os-hrs{color:#CDBBA3}
.os-ph{border-radius:14px}
.os-rev{border-radius:16px;background:rgba(255,240,220,.04);border-color:rgba(212,174,106,.22)}
.os-card{border-radius:18px;background:rgba(31,22,17,.72);box-shadow:0 30px 70px rgba(0,0,0,.35)}
.os-info-c{border-radius:18px;background:linear-gradient(180deg,rgba(255,240,220,.06),rgba(255,240,220,.02));border-color:rgba(212,174,106,.22);box-shadow:0 24px 60px rgba(0,0,0,.25)}
.os-map{border-radius:18px;border-color:rgba(212,174,106,.25);box-shadow:0 30px 70px rgba(0,0,0,.35)}
.os-map iframe{filter:invert(.88) hue-rotate(180deg) sepia(.35) saturate(.55) brightness(.92) contrast(.92)}
.os-map-card{border-radius:14px;background:rgba(31,22,17,.9)}
.os-btn{border-radius:10px}
.os .os-btn.gold{background:linear-gradient(180deg,#E3C27E,#C9A35B);border-color:#D4AE6A;box-shadow:0 10px 28px rgba(212,174,106,.28)}
.os-form input,.os-form textarea{border-bottom-color:rgba(245,235,221,.3)}
.os-form button{border-radius:10px;background:linear-gradient(180deg,#E3C27E,#C9A35B)}
.os-foot{background:#1A120E}

/* Osteria: simplified palette, one brown, gold, cream */
.os-story,.os-gal,.os-visit,.os-menu,.os-revs,.os-reserve,.os-foot{background:#1F1611}
.os-sec+.os-sec{border-top:1px solid rgba(212,174,106,.14)}
.os-story-pic{box-shadow:0 30px 70px rgba(0,0,0,.45),0 0 0 1px rgba(212,174,106,.25)}
.os-card{background:#241A14}
.os-info-c,.os-rev{background:#241A14;border-color:rgba(212,174,106,.18)}
.os-map-card{background:#1F1611}
.os::before{opacity:.05}

/* ===== OSTERIA v2: fine dining, script wordmark, cream pages ===== */
.o2{--cream:#FBF5EC;--ink:#2B1A12;--brown:#21140E;--rust:#8A5536;--mut:#6E5A4B;--line:#D9C9B3;--script:'Allura',cursive;--serif:'Lora',Georgia,serif;--disp:'Cormorant Garamond',Georgia,serif;background:var(--cream);color:var(--ink);font-family:var(--font-b)}
body.t-o2{background:#FBF5EC}
.o2-w{max-width:1180px;margin:0 auto;padding:0 32px}
.o2-narrow{max-width:820px;text-align:center}
.o2-hero{position:relative;height:100vh;min-height:620px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;color:#FBF5EC;overflow:hidden;background:#21140E}
.o2-hero-bg{position:absolute;inset:-3%;background-size:cover;background-position:center;animation:o2Drift 18s ease-in-out infinite alternate}
@keyframes o2Drift{from{transform:scale(1.04) translate(0,0)}to{transform:scale(1.12) translate(-1.5%,-1%)}}
.o2-hero-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,11,7,.55) 0%,rgba(20,11,7,.28) 35%,rgba(20,11,7,.35) 65%,rgba(20,11,7,.8) 100%)}
.o2-hnav{position:relative;z-index:2;width:100%;max-width:1180px;display:grid;grid-template-columns:repeat(4,1fr);padding:26px 32px 0}
.o2-hnav button{background:none;border:0;color:#FBF5EC;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px;transition:opacity .2s}
.o2-hnav button:hover{opacity:.75}
.o2-hnav i{font-family:var(--script);font-style:normal;font-size:2.05rem;line-height:1}
.o2-hnav small{font-size:.66rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
.o2-hero-c{position:relative;z-index:2;text-align:center;padding:0 20px 70px}
.o2-mark{font-family:var(--script);font-weight:400;font-size:clamp(5rem,15vw,11.5rem);line-height:.9;margin:0;color:#FBF5EC;text-shadow:0 6px 40px rgba(0,0,0,.45)}
.o2-sub{font-family:var(--serif);font-size:clamp(.95rem,1.6vw,1.2rem);letter-spacing:.22em;text-transform:uppercase;margin-top:26px}
.o2-open{margin-top:14px;font-size:.85rem;letter-spacing:.12em;opacity:.85}
.o2-bar{position:fixed;top:0;left:0;right:0;z-index:40;background:rgba(251,245,236,.96);backdrop-filter:blur(10px);box-shadow:0 1px 0 #E7DAC8;transform:translateY(-100%);transition:transform .35s ease}
.o2-bar.on{transform:none}
.o2-bar-in{max-width:1180px;margin:0 auto;padding:10px 32px;display:flex;align-items:center;gap:30px}
.o2-bar-mark{background:none;border:0;cursor:pointer;font-family:var(--script);font-size:2.4rem;color:var(--ink);line-height:1}
.o2-bar-nav{display:flex;gap:30px;margin-left:auto}
.o2-bar-nav button{background:none;border:0;cursor:pointer;font-size:.72rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--ink)}
.o2-bar-nav button:hover{color:var(--rust)}
.o2-pill{background:var(--ink);color:#FBF5EC;border:0;border-radius:4px;padding:10px 18px;font-size:.7rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;cursor:pointer}
.o2-intro{padding:120px 0 70px}
.o2 h2{font-family:var(--serif);font-weight:400;font-size:clamp(2rem,4vw,2.9rem);line-height:1.15;color:var(--ink);margin:0 0 24px}
.o2-lead{font-family:var(--font-b);font-size:1.12rem;line-height:1.85;color:var(--mut);white-space:pre-line}
.o2-ul{display:inline-block;margin-top:26px;background:none;border:0;padding:0 0 2px;border-bottom:1px solid currentColor;color:var(--rust);font-family:var(--serif);font-size:1.15rem;font-weight:500;cursor:pointer;text-decoration:none}
.o2-ul.light{color:#F0D9B5}
.o2-trio{display:grid;grid-template-columns:1fr 2fr 1fr;gap:18px;padding-top:30px;padding-bottom:70px}
.o2-ph{border:0;padding:0;cursor:zoom-in;background-size:cover;background-position:center;border-radius:3px}
.o2-trio .o2-ph{height:420px}
.o2-rule{border:0;height:5px;border-top:1px solid #BFAE98;border-bottom:1px solid #BFAE98;margin:0}
.o2-sec{padding:100px 0}
.o2-two{display:grid;grid-template-columns:180px 1fr;gap:40px;margin-bottom:60px}
.o2-label{display:block;font-size:.7rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--mut);padding-top:10px}
.o2-big{font-family:var(--serif);font-size:clamp(1.35rem,2.4vw,1.85rem);line-height:1.55;color:var(--ink);max-width:760px}
.o2-menu-split{display:grid;grid-template-columns:1fr 1.05fr;gap:60px;align-items:start}
.o2-menu-pic{position:sticky;top:90px;aspect-ratio:4/5;background-size:cover;background-position:center;border-radius:3px}
.o2-menu-box{max-width:1080px}
.o2-tabs{display:flex;justify-content:center;flex-wrap:wrap;gap:6px 30px;border-bottom:1px solid var(--line);margin-bottom:40px}
.o2-tab{background:none;border:0;cursor:pointer;padding:14px 2px;font-family:var(--disp);font-size:1.3rem;font-weight:500;letter-spacing:.04em;color:var(--mut);border-bottom:2px solid transparent;margin-bottom:-1px;transition:color .2s,border-color .2s}
.o2-tab:hover{color:var(--ink)}
.o2-tab.on{color:var(--rust);border-bottom-color:var(--rust)}
.o2-panel{opacity:0;transform:translateY(8px);transition:opacity .35s ease,transform .35s ease}
.o2-panel.in{opacity:1;transform:none}
.o2-panel-h{text-align:center;margin-bottom:30px}
.o2-panel-h i{display:block;font-family:var(--script);font-style:normal;font-size:1.9rem;line-height:1;color:var(--ink)}
.o2-panel-h h3{font-family:var(--serif);font-weight:400;font-size:clamp(2rem,3.4vw,2.6rem);color:var(--rust);margin:0}
.o2-items{display:grid;grid-template-columns:1fr 1fr;gap:26px 60px}
.o2-it-top{display:flex;gap:10px;align-items:baseline}
.o2-it-top b{font-family:var(--serif);font-weight:500;font-size:1.12rem;color:var(--ink)}
.o2-dots{flex:1;border-bottom:1px dotted #BFAE97;transform:translateY(-4px);min-width:20px}
.o2-it-top span:last-child:not(.o2-dots){font-family:var(--serif);color:var(--rust);white-space:nowrap}
.o2-it p{color:var(--mut);font-size:.93rem;line-height:1.55;margin-top:4px}
@media (max-width:760px){.o2-tabs{flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;gap:24px;scrollbar-width:none;margin:0 -20px 30px;padding:0 20px}.o2-tabs::-webkit-scrollbar{display:none}.o2-tab{white-space:nowrap;font-size:1.15rem}.o2-items{grid-template-columns:1fr;gap:20px}}
.o2-gal{padding-top:40px}
.o2-grid{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:260px;gap:16px}
.o2-grid .g0{grid-column:span 2;grid-row:span 2}
.o2-revs{display:grid;grid-template-columns:repeat(3,1fr);gap:36px}
.o2-revs blockquote{font-family:var(--serif);font-style:italic;font-size:1.2rem;line-height:1.6;color:var(--ink)}
.o2-revs figcaption{margin-top:14px;font-size:.72rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--mut)}
.o2-src{text-align:center;color:var(--mut);font-size:.82rem;margin-top:24px}
.o2-res{position:relative;padding:120px 0;background:#21140E;color:#FBF5EC;overflow:hidden}
.o2-res-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:.22}
.o2-res-in{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}
.o2-script{display:block;font-family:var(--script);font-style:normal;font-size:2.6rem;line-height:1;color:#F0D9B5}
.o2-res h2{color:#FBF5EC;margin-top:4px}
.o2-res p{color:#E3D3BD;line-height:1.8}
.o2-card{background:#FBF5EC;color:var(--ink);border-radius:4px;padding:34px;box-shadow:0 30px 70px rgba(0,0,0,.35)}
.o2-form{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.o2-form .full{grid-column:1/-1}
.o2-form label{display:block;font-size:.66rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--mut);margin-bottom:6px}
.o2-form input,.o2-form textarea,.o2-form select{width:100%;background:transparent;border:0;border-bottom:1px solid #CDBBA3;color:var(--ink);padding:9px 2px;outline:none;font-family:var(--serif);font-size:1rem}
.o2-form input:focus,.o2-form textarea:focus{border-bottom-color:var(--rust)}
.o2-form button{min-height:50px;background:var(--ink);color:#FBF5EC;border:0;border-radius:4px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;font-size:.74rem;cursor:pointer;margin-top:8px}
.o2-form button:hover{background:var(--rust)}
.o2-ok{display:none}.o2-ok h3{font-family:var(--serif);font-weight:400;font-size:1.7rem;margin-bottom:8px}.o2-ok p{color:var(--mut)}
.o2-visit{display:grid;grid-template-columns:.8fr 1.2fr;gap:60px;align-items:start}
.o2-info{display:grid;gap:30px}
.o2-hrs{display:grid;gap:8px;margin-top:10px;max-width:340px}
.o2-hrs>div{display:flex;justify-content:space-between;font-family:var(--serif);font-size:1.05rem;color:var(--ink)}
.o2-hrs>div.on{color:var(--rust)}
.o2-phone{display:block;margin-top:8px;font-family:var(--serif);font-size:1.6rem;color:var(--ink);text-decoration:none}
.o2-map{position:relative;aspect-ratio:4/3;border-radius:3px;overflow:hidden;background:#EFE4D4}
.o2-map iframe{position:absolute;inset:0;width:100%;height:100%;border:0;filter:sepia(.3) saturate(.75) contrast(.95)}
.o2-foot{background:#21140E;color:#E3D3BD;padding:80px 0 40px}
.o2-foot-in{display:grid;gap:36px;justify-items:center;text-align:center}
.o2-foot-mark{font-family:var(--script);font-size:4.2rem;line-height:1;color:#FBF5EC}
.o2-foot-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:50px;width:100%;max-width:900px}
.o2-foot-cols small{display:block;font-size:.66rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#B59E82;margin-bottom:10px}
.o2-foot-cols p,.o2-foot-cols a{font-family:var(--serif);font-size:1.05rem;color:#FBF5EC;text-decoration:none}
.o2-foot-nav{display:flex;flex-direction:column;gap:6px;align-items:center}
.o2-foot-nav button{background:none;border:0;color:#FBF5EC;font-family:var(--serif);font-size:1.05rem;cursor:pointer}
.o2-foot .socials{display:flex;gap:10px}.o2-foot .socials a{width:40px;height:40px;border:1px solid rgba(251,245,236,.35);border-radius:50%;color:#FBF5EC}
.o2-copy{color:#8F7A63;font-size:.8rem}
@media (max-width:860px){.o2-hnav{grid-template-columns:repeat(2,1fr);gap:8px;padding-top:16px}.o2-hnav i{font-size:1.6rem}.o2-bar-nav{display:none}.o2-bar-in{justify-content:space-between}.o2-pill{margin-left:auto}.o2-w{padding:0 20px}.o2-intro{padding:80px 0 40px}.o2-trio{grid-template-columns:1fr 1fr}.o2-trio .o2-ph{height:200px}.o2-trio .t1{grid-column:1/-1;order:-1;height:260px}.o2-two{grid-template-columns:1fr;gap:10px;margin-bottom:36px}.o2-sec{padding:70px 0}.o2-menu-split,.o2-res-in,.o2-visit{grid-template-columns:1fr;gap:36px}.o2-menu-pic{position:relative;top:0;aspect-ratio:16/10}.o2-grid{grid-template-columns:1fr 1fr;grid-auto-rows:160px}.o2-revs{grid-template-columns:1fr}.o2-form{grid-template-columns:1fr}.o2-foot-cols{grid-template-columns:1fr;gap:26px}}
/* Osteria v2: menu photo stays put (no sticky scroll) */
.o2-menu-pic{position:relative;top:0;border-radius:4px;box-shadow:0 24px 50px rgba(43,26,18,.18)}
/* Osteria v2: hero name centered */
.o2-hero{justify-content:center}
.o2-hnav{position:absolute;top:0;left:50%;transform:translateX(-50%)}
.o2-hero-c{padding:0 20px}

/* ===== CLOUD: vape / smoke shop retail ===== */
.cl-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:scaleX(-1);filter:brightness(.72) contrast(1.15) grayscale(1);mix-blend-mode:screen;opacity:1;transition:opacity 1.6s ease-in-out}
.cl-vid.off{opacity:0}
.cl-blow{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.cl-blow-l{position:absolute;inset:-10% -10% -10% -20%;-webkit-mask-image:radial-gradient(ellipse 60% 55% at 62% 50%,#000 35%,rgba(0,0,0,0) 78%);mask-image:radial-gradient(ellipse 60% 55% at 62% 50%,#000 35%,rgba(0,0,0,0) 78%);background-size:cover;background-position:70% 50%;mix-blend-mode:screen;transform-origin:15% 60%;opacity:0;animation:clBlow 9s cubic-bezier(.25,.6,.3,1) infinite;will-change:transform,opacity,filter}
.cl-blow-l.b1{animation-delay:-3s;background-position:60% 40%}
.cl-blow-l.b2{animation-delay:-6s;background-position:80% 60%;transform:scaleY(-1)}
@keyframes clBlow{0%{opacity:0;transform:translateX(-18%) scale(.75);filter:blur(6px)}18%{opacity:.95;filter:blur(0)}65%{opacity:.75}100%{opacity:0;transform:translateX(14%) translateY(-6%) scale(1.35);filter:blur(10px)}}
.cl-blow-l.b2{animation-name:clBlow2}
@keyframes clBlow2{0%{opacity:0;transform:scaleY(-1) translateX(-18%) scale(.75);filter:blur(6px)}18%{opacity:.8;filter:blur(0)}65%{opacity:.6}100%{opacity:0;transform:scaleY(-1) translateX(14%) translateY(6%) scale(1.35);filter:blur(10px)}}
.cl-hero.blowing::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,5,6,.85) 0%,rgba(5,5,6,.45) 40%,rgba(5,5,6,0) 70%);pointer-events:none}
.cl-hero.blowing .cl-hero-c,.cl-hero.blowing .cl-hero-logo{position:relative;z-index:2}
@media (prefers-reduced-motion:reduce){.cl-blow-l{animation:none;opacity:.9;transform:none}.cl-blow-l.b1,.cl-blow-l.b2{display:none}}
.cl-smoke{position:absolute;inset:0;pointer-events:none}
.cl-smoke svg{width:100%;height:100%;display:block}
.cl-wisps path{stroke-dasharray:1400;animation:clWisp linear infinite}
@keyframes clWisp{0%{stroke-dashoffset:1400;opacity:0}15%{opacity:1}70%{opacity:.9}100%{stroke-dashoffset:-1400;opacity:0}}
.cl-hero.smoke .cl-hero-c{position:relative;z-index:1}
.cl-hero.smoke::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,11,14,.75) 0%,rgba(10,11,14,.25) 45%,rgba(10,11,14,0) 70%);pointer-events:none}
.cl-hero.smoke .cl-hero-c,.cl-hero.smoke .cl-hero-logo{z-index:2}
.cl-brand{display:flex;align-items:center;gap:12px}
.cl-hero{justify-content:space-between;gap:30px}
.cl-hero-logo{position:relative;z-index:1;height:min(400px,78%);max-height:400px;width:auto;max-width:38%;object-fit:contain;margin-right:56px;filter:drop-shadow(0 18px 40px rgba(0,0,0,.55))}
@media (max-width:860px){.cl-hero{flex-direction:column-reverse;justify-content:center;align-items:flex-start}.cl-hero-logo{height:170px;max-width:60%;margin:36px 0 0 24px}.cl-hero-c{padding-top:16px}}
.cl-carry{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px;margin-bottom:60px}
.cl-carry-c{position:relative;border:1px solid #E6E6EA;border-radius:6px;padding:26px 22px;background:#fff;overflow:hidden;transition:border-color .2s,box-shadow .2s}
.cl-carry-c:hover{border-color:#B3121B;box-shadow:0 14px 34px rgba(17,17,20,.08)}
.cl-carry-ico{display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:#F6E7E8;color:#B3121B;margin-bottom:16px}
.cl-carry-ico svg{width:36px;height:36px}
.cl-carry-c{text-align:left}
.cl-carry-c.pic{padding:0}
.cl-carry-pic{aspect-ratio:4/3;background-size:cover;background-position:center;transition:transform .4s ease}
.cl-carry-c.pic:hover .cl-carry-pic{transform:scale(1.04)}
.cl-carry-c.pic .cl-carry-t{padding:18px 20px 20px;position:relative;background:#fff}
.cl-carry-n{display:block;font-family:'Montserrat',sans-serif;font-weight:800;color:#C9C9CF;font-size:.9rem;margin-bottom:10px}
.cl-carry-c b{display:block;font-family:'Montserrat',sans-serif;font-weight:900;font-style:italic;text-transform:uppercase;font-size:1.5rem;line-height:1.05;color:#111114}
.cl-carry-c small{display:block;margin-top:8px;color:#5E6068;font-size:.84rem}
body.t-cl{background:#fff}
.cl,.cl-age{--red:#B3121B;--ink:#111114;--mut:#5E6068;--line:#E6E6EA;--soft:#F5F5F7;--m:'Montserrat',Inter,sans-serif;background:#fff;color:var(--ink);font-family:var(--font-b)}
.cl-w{max-width:1240px;margin:0 auto;padding:0 24px}
.cl-warn{border:2px solid #111;background:#fff;color:#111;text-align:center;font-family:var(--m);font-weight:600;font-size:.86rem;padding:10px 14px;margin:8px}
.cl-head{position:sticky;top:0;z-index:30;background:#fff;border-bottom:1px solid var(--line)}
.cl-head-in{display:flex;align-items:center;justify-content:space-between;padding-top:16px;padding-bottom:14px}
.cl-name{font-family:var(--m);font-weight:900;font-style:italic;font-size:1.7rem;letter-spacing:-.01em;text-transform:uppercase;color:var(--ink)}
.cl-name.light{color:#fff}
.cl-logo{height:52px;width:auto;max-width:120px;object-fit:contain}
.cl-head-ic{display:flex;gap:18px;align-items:center}
.cl-head-ic a,.cl-ic-btn{color:var(--ink);background:none;border:0;cursor:pointer;padding:0;display:inline-flex}
.cl-ico{display:inline-grid;place-items:center}
.cl-ico svg{width:22px;height:22px}
.cl-cats{display:flex;gap:6px 26px;flex-wrap:wrap;padding-bottom:12px;padding-top:2px;border-top:1px solid var(--line);padding-top:12px}
.cl-cats button{background:none;border:0;cursor:pointer;font-family:var(--m);font-weight:700;font-size:.84rem;text-transform:uppercase;color:#2A2B30;padding:4px 0;border-bottom:2px solid transparent}
.cl-cats button:hover,.cl-cats button.on{color:var(--ink);border-bottom-color:var(--red)}
.cl-hero-wrap{padding-top:18px}
.cl-hero{min-height:500px;border-radius:6px;background-size:cover;background-position:center;display:flex;align-items:center;overflow:hidden;position:relative}

.cl-hero-c{padding:60px 56px;max-width:640px;color:#fff}
.cl-hero-c small{display:inline-block;font-family:var(--m);font-weight:700;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;background:var(--red);padding:6px 12px;border-radius:3px}
.cl-hero-c h1{font-family:var(--m);font-weight:900;font-style:italic;text-transform:uppercase;font-size:clamp(2.6rem,6vw,4.6rem);line-height:.98;letter-spacing:-.02em;margin:18px 0 26px;text-shadow:0 4px 30px rgba(0,0,0,.4)}
.cl-hero-btns{display:flex;gap:12px;flex-wrap:wrap}
.cl-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:50px;padding:0 24px;border-radius:4px;font-family:var(--m);font-weight:800;font-size:.86rem;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;cursor:pointer;border:2px solid transparent;transition:transform .15s,background .15s}
.cl-btn:hover{transform:translateY(-1px)}
.cl-btn .cl-ico svg{width:16px;height:16px}
.cl-btn.white{background:#fff;color:var(--ink)}
.cl-btn.ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.7)}
.cl-btn.red{background:var(--red);color:#fff}
.cl-btn.red:hover{background:#930E16}
.cl-btn.line{background:#fff;color:var(--ink);border-color:var(--ink)}
.cl-btn.sm{min-height:42px;padding:0 18px;font-size:.76rem}
.cl-open{display:flex;align-items:center;gap:8px;margin-top:22px;font-weight:600;opacity:.9}
.cl-open .cl-ico svg{width:18px;height:18px}
.cl-perks{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:18px;background:linear-gradient(135deg,#050506 0%,#111216 100%);border-radius:6px;overflow:hidden;position:relative}
.cl-perks::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:var(--red)}
.cl-perk{display:flex;gap:16px;align-items:center;padding:26px 24px;color:#fff;text-decoration:none;transition:background .2s}
.cl-perk+.cl-perk{border-left:1px solid rgba(255,255,255,.08)}
a.cl-perk:hover{background:rgba(255,255,255,.04)}
.cl-perk-i{flex:none;width:44px;height:44px;border-radius:4px;background:var(--red);color:#fff;display:flex;align-items:center;justify-content:center}
.cl-perk-i .cl-ico{width:22px;height:22px}
.cl-perk b{display:block;font-family:var(--m);font-weight:900;font-style:italic;font-size:1rem;letter-spacing:.01em;text-transform:uppercase;color:#fff}
.cl-perk div>span{display:block;color:rgba(255,255,255,.66);font-size:.88rem;margin-top:3px;line-height:1.4}
a.cl-perk:hover div>span{color:#fff}
.cl-tiles{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:18px}
.cl-tile{min-height:320px;border-radius:6px;background-size:cover;background-position:center;display:flex;align-items:flex-end;padding:30px;color:#fff}
.cl-tile b{display:block;font-family:var(--m);font-weight:900;font-style:italic;text-transform:uppercase;font-size:2rem;line-height:1}
.cl-tile span{display:block;margin:8px 0 16px;opacity:.9}
.cl-sec{padding:70px 0}
.cl-h{font-family:var(--m);font-weight:800;text-transform:uppercase;text-align:center;font-size:clamp(1.6rem,3vw,2.1rem);letter-spacing:.02em;margin:0 0 34px}
.cl-h.left{text-align:left;margin-bottom:16px}
.cl-row{display:grid;grid-auto-flow:column;grid-auto-columns:calc((100% - 72px)/4);gap:24px;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:14px}
.cl-prod{scroll-snap-align:start;border:1px solid var(--line);border-radius:6px;padding:16px;display:flex;flex-direction:column;gap:6px;background:#fff;transition:box-shadow .2s,border-color .2s}
.cl-prod:hover{border-color:#cfcfd5;box-shadow:0 14px 34px rgba(17,17,20,.08)}
.cl-prod-pic{aspect-ratio:1;border-radius:4px;background:var(--soft);display:grid;place-items:center;overflow:hidden;margin-bottom:6px}
.cl-prod-pic img{width:100%;height:100%;object-fit:cover}
.cl-prod-pic span{font-family:var(--m);font-weight:900;font-style:italic;text-transform:uppercase;color:#C9C9CF;font-size:1.1rem;text-align:center;padding:10px}
.cl-prod small{font-family:var(--m);font-weight:700;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--red)}
.cl-prod b{font-family:var(--m);font-weight:700;font-size:1rem;line-height:1.3}
.cl-prod p{color:var(--mut);font-size:.86rem;line-height:1.45}
.cl-price{margin-top:auto;font-family:var(--m);font-weight:800;font-size:1.1rem}
.cl-note{text-align:center;color:var(--mut);font-size:.88rem;margin-top:18px}
.cl-empty{text-align:center;max-width:640px}
.cl-empty p{color:var(--mut);margin-bottom:22px;line-height:1.7}
.cl-gal{background:var(--soft)}
.cl-grid{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:220px;gap:14px}
.cl-ph{border:0;padding:0;border-radius:6px;background-size:cover;background-position:center;cursor:zoom-in}
.cl-rev-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.cl-rev-grid figure{border:1px solid var(--line);border-radius:6px;padding:24px;margin:0}
.cl-stars{color:var(--red);letter-spacing:2px;margin-bottom:10px}
.cl-rev-grid blockquote{line-height:1.6}
.cl-rev-grid figcaption{margin-top:12px;font-family:var(--m);font-weight:700;font-size:.82rem;text-transform:uppercase}
.cl-visit{border-top:1px solid var(--line)}
.cl-visit-in{display:grid;grid-template-columns:.9fr 1.1fr;gap:50px;align-items:center}
.cl-addr{font-size:1.1rem;font-weight:600;margin-bottom:18px}
.cl-hrs{display:grid;gap:8px;max-width:380px;margin-bottom:26px}
.cl-hrs>div{display:flex;justify-content:space-between;border-bottom:1px solid var(--line);padding-bottom:8px;font-size:.95rem}
.cl-hrs>div.on{color:var(--red);font-weight:700}
.cl-map{position:relative;aspect-ratio:4/3;border-radius:6px;overflow:hidden;border:1px solid var(--line)}
.cl-map iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
.cl-foot{background:#111114;color:#C9CAD1;padding:56px 0 24px}
.cl-foot-in{display:grid;grid-template-columns:1.2fr .8fr 1fr;gap:40px}
.cl-foot-in p{margin-top:8px;font-size:.92rem}
.cl-foot-in a{color:#C9CAD1;text-decoration:none}
.cl-foot-in b{display:block;font-family:var(--m);font-weight:800;text-transform:uppercase;color:#fff;font-size:.86rem;margin-bottom:12px}
.cl-foot-in button{display:block;background:none;border:0;color:#C9CAD1;padding:4px 0;cursor:pointer;text-align:left;font-size:.92rem}
.cl-foot-in button:hover{color:#fff}
.cl-foot .socials{display:flex;gap:10px;margin-top:16px}.cl-foot .socials a{width:38px;height:38px;border:1px solid #3A3B42;border-radius:50%;color:#fff}
.cl-copy{margin-top:40px;padding-top:18px;border-top:1px solid #26272D;font-size:.8rem;color:#80828C}
.cl-age{font-family:Inter,sans-serif;color:#111114;position:fixed;inset:0;z-index:120;background:rgba(17,17,20,.55);backdrop-filter:blur(3px);display:grid;place-items:center;padding:16px}
.cl-age-card{width:100%;max-width:520px;background:#fff;border-radius:4px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.35)}
.cl-age-top{background:var(--red);color:#fff;text-align:center;font-family:var(--m);font-weight:700;text-transform:uppercase;letter-spacing:.08em;font-size:.84rem;padding:12px}
.cl-age-b{padding:26px 28px;text-align:center}
.cl-age-name{display:block;font-family:var(--m);font-weight:900;font-style:italic;text-transform:uppercase;font-size:1.6rem;margin-bottom:12px}
.cl-age-b p{color:var(--mut);font-size:.92rem;line-height:1.6;margin-bottom:8px}
.cl-age-btns{display:flex;gap:12px;justify-content:center;margin-top:18px}
.cl-age-no{color:var(--red)!important;font-weight:600;margin-top:12px}
@media (max-width:860px){.cl-cats{flex-wrap:nowrap;overflow-x:auto;gap:22px}.cl-cats button{white-space:nowrap}.cl-hero{min-height:440px}.cl-hero-c{padding:44px 24px}.cl-perks{grid-template-columns:1fr 1fr}.cl-perk:nth-child(3){border-left:0}.cl-perk:nth-child(n+3){border-top:1px solid rgba(255,255,255,.08)}.cl-tiles{grid-template-columns:1fr}.cl-row{grid-auto-columns:72%}.cl-grid{grid-template-columns:1fr 1fr;grid-auto-rows:150px}.cl-rev-grid{grid-template-columns:1fr}.cl-visit-in{grid-template-columns:1fr}.cl-foot-in{grid-template-columns:1fr}.cl-name{font-size:1.3rem}}
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
@media (max-width:860px){.os-links{display:none}.os-nav-in .os-btn{margin-left:auto}.os-sec{padding:76px 0}.os-story-in,.os-res-in,.os-visit-in{grid-template-columns:1fr;gap:36px}.os-story-pic{box-shadow:0 20px 50px rgba(0,0,0,.45)}.os-menu-list{grid-template-columns:1fr}.os-grid{grid-template-columns:repeat(2,1fr);grid-auto-rows:150px}.os-rev-grid{grid-template-columns:1fr}.os-form{grid-template-columns:1fr}.os-brand{font-size:1.35rem}}

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
/* ===== Zephyr (windows & doors) ===== */
body.t-zp{background:#fff}
.zp{--cu:#A52C49;--cu2:#86223A;--cul:#D63A5C;--navy:#130F84;--navy2:#0D0A5E;--ink:#12112A;--char:#0E0C3D;--mut:#5D5F73;--line:#E3E4EE;--soft:#F4F5FA;--f:'Outfit',Inter,sans-serif;font-family:var(--f);color:var(--ink);background:#fff}
.zp-w{max-width:1240px;margin:0 auto;padding:0 32px}
.zp-ico{display:inline-grid;place-items:center}.zp-ico svg{width:22px;height:22px}
.zp-nav{position:sticky;top:0;z-index:50;background:#fff;border-bottom:1px solid var(--line);transition:box-shadow .3s}
.zp-nav.solid{box-shadow:0 6px 24px rgba(19,15,132,.08)}
.zp-nav-in{display:flex;align-items:center;justify-content:space-between;gap:24px;height:84px}
.zp-brand{display:flex;align-items:center;gap:12px;color:var(--navy);font-weight:600;font-size:1.3rem;text-decoration:none}
.zp-brand img{height:56px;width:auto;object-fit:contain;display:block}
.zp-mark{display:flex;gap:3px;height:28px}.zp-mark i{width:11px;border:2.5px solid var(--navy);border-radius:2px}.zp-mark i:last-child{border-color:var(--cu);background:var(--cu)}
.zp-links{display:flex;gap:36px}.zp-links a{color:var(--ink);text-decoration:none;font-size:1rem;font-weight:500;padding:6px 0;border-bottom:2px solid transparent;transition:color .2s,border-color .2s}.zp-links a:hover{color:var(--navy);border-bottom-color:var(--cu)}
.zp-call{display:inline-flex;align-items:center;gap:10px;background:var(--navy);color:#fff;text-decoration:none;font-weight:600;font-size:1rem;padding:12px 20px;border-radius:4px;transition:background .2s}.zp-call:hover{background:var(--cu)}.zp-call .zp-ico svg{width:18px;height:18px}
.zp-mnav{display:none}
.zp-btn{display:inline-flex;align-items:center;gap:12px;background:var(--navy);color:#fff;text-decoration:none;font-weight:500;font-size:.92rem;letter-spacing:.04em;text-transform:uppercase;padding:6px 6px 6px 22px;border-radius:4px;transition:background .2s}
.zp-btn:hover{background:var(--cu)}
.zp-btn-i{width:36px;height:36px;border-radius:3px;background:rgba(255,255,255,.16);display:grid;place-items:center}.zp-btn-i .zp-ico svg{width:17px;height:17px}
.zp-btn.sm{font-size:.8rem;padding-left:16px}.zp-btn.sm .zp-btn-i{width:30px;height:30px}
.zp-quick{grid-column:1;grid-row:3;display:flex;gap:12px;flex-wrap:wrap}
.zp-quick a{display:inline-flex;align-items:center;gap:9px;color:#fff;text-decoration:none;font-weight:500;padding:13px 20px;border-radius:4px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.35);backdrop-filter:blur(6px);transition:background .2s}
.zp-quick a:first-child{background:var(--cu);border-color:var(--cu)}.zp-quick a:hover{background:rgba(255,255,255,.24)}.zp-quick a:first-child:hover{background:var(--cu2)}.zp-quick .zp-ico svg{width:18px;height:18px}
.zp-hero{position:relative;min-height:max(600px,calc(100vh - 84px));display:flex;color:#fff;overflow:hidden}
.zp-hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;transform:scale(1.04);animation:zpZoom 14s ease-out forwards}
@keyframes zpZoom{to{transform:scale(1)}}
.zp-hero-in{position:relative;width:100%;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto 1fr auto;padding-top:70px;padding-bottom:60px;gap:28px}
.zp-hero-p{grid-column:1;max-width:400px;font-size:1.05rem;line-height:1.7;color:rgba(255,255,255,.85);font-weight:300}
.zp-h1{grid-column:2;grid-row:2/4;align-self:end;justify-self:end;text-align:right;margin:0;font-weight:500;text-transform:uppercase;line-height:.95;letter-spacing:-.02em;font-size:clamp(3.4rem,8.4vw,7.6rem)}
.zp-h1 span{display:block}.zp-h1 .cu{color:var(--cul)}.zp-h1 .thin{font-weight:200}
.zp-card{grid-column:1;grid-row:2;align-self:end;border-top:4px solid var(--cu);background:#F7F4F0;color:var(--ink);padding:30px 32px;border-radius:4px;max-width:340px;box-shadow:0 30px 60px rgba(0,0,0,.3)}
.zp-card small{display:block;color:var(--cu);font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;font-weight:500}
.zp-card b{display:block;font-size:1.5rem;font-weight:500;line-height:1.2;margin:8px 0 16px}
.zp-card a{display:inline-flex;align-items:center;gap:6px;color:var(--ink);font-weight:500;font-size:.85rem;letter-spacing:.06em;text-transform:uppercase;text-decoration:none;border-bottom:1px solid var(--cu);padding-bottom:3px}
.zp-card a .zp-ico{color:var(--cu)}.zp-card a .zp-ico svg{width:16px;height:16px}
.zp-sec{padding:110px 0}.zp-soft{background:var(--soft)}
.zp-label{display:flex;align-items:center;gap:14px;font-size:.78rem;letter-spacing:.18em;text-transform:uppercase;font-weight:500;color:var(--ink);margin-bottom:18px}
.zp-line{position:relative;width:56px;height:1px;background:var(--ink)}.zp-line::after{content:"";position:absolute;right:0;top:-3px;width:7px;height:7px;border-top:1px solid var(--ink);border-right:1px solid var(--ink);transform:rotate(45deg)}
.zp-h2{font-weight:400;font-size:clamp(2.1rem,4vw,3.3rem);line-height:1.08;letter-spacing:-.02em;margin:0 0 20px}
.zp-about{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
.zp-about-pic{position:relative}
.zp-about-img{aspect-ratio:4/5;background-size:cover;background-position:center;border-radius:4px}
.zp-about-pic::before{content:"";position:absolute;left:-18px;bottom:-18px;width:45%;height:45%;background:var(--cu);border-radius:4px;z-index:-1}
.zp-about{position:relative;z-index:0}
.zp-badge{position:absolute;right:-24px;top:40px;background:var(--char);color:#fff;padding:22px 24px;border-radius:4px;max-width:170px}
.zp-badge b{display:block;font-size:2.4rem;font-weight:300;color:var(--cul);line-height:1;margin-top:6px}.zp-badge span{display:block;font-size:.82rem;color:rgba(255,255,255,.75);line-height:1.4}
.zp-about-t>p{color:var(--mut);font-size:1.05rem;line-height:1.75;font-weight:300}
.zp-ticks{list-style:none;padding:0;margin:26px 0 32px;display:grid;grid-template-columns:1fr 1fr;gap:14px 24px}
.zp-ticks li{display:flex;align-items:center;gap:10px;font-weight:500}.zp-ticks .zp-ico{color:var(--cu)}
.zp-row{display:flex;align-items:center;gap:26px;flex-wrap:wrap}
.zp-tel{display:inline-flex;align-items:center;gap:10px;color:var(--ink);text-decoration:none;font-weight:500;font-size:1.05rem}.zp-tel .zp-ico{color:var(--cu)}
.zp-head{max-width:640px;margin-bottom:46px}
.zp-bento{display:grid;grid-template-columns:1.25fr 1fr 1fr;grid-template-rows:240px 240px;gap:18px}
.zp-b{border-radius:4px;padding:30px;display:flex;flex-direction:column;justify-content:flex-end;gap:8px}
.zp-b b{font-size:1.3rem;font-weight:500}.zp-b p{font-size:.95rem;line-height:1.6;font-weight:300;margin:0}
.zp-b>.zp-ico{margin-bottom:auto;width:48px;height:48px;border-radius:4px}
.zp-b-pic{grid-row:span 2;background-size:cover;background-position:center}
.zp-b-txt{background:#fff;border:1px solid var(--line)}.zp-b-txt>.zp-ico{background:var(--soft);color:var(--cu)}.zp-b-txt p{color:var(--mut)}
.zp-b-cu{background:var(--navy);color:#fff}.zp-b-cu>.zp-ico{background:rgba(255,255,255,.16)}.zp-b-cu p{color:rgba(255,255,255,.88)}
.zp-b-dark{background:var(--char);color:#fff;justify-content:center}.zp-b-dark small{color:var(--cul);font-size:.76rem;letter-spacing:.16em;text-transform:uppercase;font-weight:500}
.zp-b-dark p{display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.75);margin-bottom:10px}.zp-b-dark p .zp-ico svg{width:17px;height:17px}.zp-b-dark .zp-btn{align-self:flex-start}
.zp-prod{display:grid;grid-template-columns:.8fr 1.2fr;gap:70px;align-items:start}
.zp-prod-l{position:sticky;top:120px}.zp-prod-l>p{color:var(--mut);line-height:1.7;font-weight:300;margin-bottom:28px}
.zp-prod-g{display:grid;grid-template-columns:1fr 1fr;gap:22px}
.zp-p{border-radius:4px;overflow:hidden;background:var(--char);display:flex;flex-direction:column}.zp-p:last-child:nth-child(odd){grid-column:span 2}.zp-p:last-child:nth-child(odd) .zp-p-img{aspect-ratio:21/8}
.zp-p-img{aspect-ratio:4/3;background-size:cover;background-position:center;transition:transform .6s ease}
.zp-p:hover .zp-p-img{transform:scale(1.05)}
.zp-p-bar{flex:1;position:relative;background:var(--navy);border-top:4px solid var(--cu);color:#fff;padding:18px 20px;display:flex;justify-content:space-between;align-items:center;gap:14px}
.zp-p-bar small{font-size:.74rem;opacity:.75;letter-spacing:.1em}.zp-p-bar b{display:block;font-weight:500;font-size:1.12rem}.zp-p-bar p{font-size:.85rem;margin:4px 0 0;opacity:.88;line-height:1.45;font-weight:300}
.zp-p-go{flex:none;width:38px;height:38px;border-radius:4px;background:#fff;color:var(--navy);display:grid;place-items:center}.zp-p-go svg{width:16px;height:16px}
.zp-revs{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.zp-rev{margin:0;background:#fff;border:1px solid var(--line);border-radius:4px;padding:30px}
.zp-stars{color:var(--cu);letter-spacing:3px;margin-bottom:14px}.zp-rev blockquote{margin:0 0 18px;line-height:1.7;font-weight:300}.zp-rev figcaption{font-weight:600}
.zp-visit{background:var(--char);color:#fff;padding:110px 0}
.zp-visit .zp-label{color:#fff}.zp-visit .zp-line,.zp-visit .zp-line::after{background:#fff;border-color:#fff}.zp-visit .zp-line::after{background:none}
.zp-visit-in{display:grid;grid-template-columns:1fr 1.2fr;gap:60px;align-items:center}
.zp-li{display:flex;align-items:center;gap:14px;color:#fff;text-decoration:none;font-size:1.1rem;padding:16px 0;border-bottom:1px solid rgba(255,255,255,.12)}
.zp-li .zp-ico{width:44px;height:44px;border-radius:4px;background:var(--cu)}
.zp-hours{margin-top:24px;display:grid;gap:8px}
.zp-hours div{display:flex;justify-content:space-between;color:rgba(255,255,255,.7);font-weight:300;font-size:.95rem}.zp-hours .today{color:#fff;font-weight:500}.zp-hours .today span:first-child{color:var(--cul)}
.zp-map{aspect-ratio:4/3;border-radius:4px;overflow:hidden}.zp-map iframe{width:100%;height:100%;border:0}
.zp-foot{background:#fff;border-top:1px solid var(--line);color:var(--mut);color:rgba(255,255,255,.6);padding:40px 0 110px}
.zp-foot-logo img{height:48px;width:auto;display:block}.zp-foot-logo b{color:var(--navy)}.zp-foot-in{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap}.zp-foot p{margin:0;font-weight:300}
@media (max-width:900px){
.zp-w{padding:0 20px}.zp-links{display:none}.zp-nav-in{height:64px;gap:12px}.zp-brand img{height:42px}.zp-call{padding:10px 14px;font-size:.9rem}.zp-call span{display:none}.zp-call::after{content:'Call';}.zp-mnav{display:flex;gap:4px;overflow-x:auto;scrollbar-width:none;padding:0 14px;border-top:1px solid var(--line)}.zp-mnav::-webkit-scrollbar{display:none}.zp-mnav a{flex:none;color:var(--ink);text-decoration:none;font-weight:500;font-size:.92rem;padding:12px 10px}.zp-quick{grid-row:4}.zp-quick{gap:8px}.zp-quick a{flex:1;justify-content:center;padding:12px 6px;font-size:.9rem;white-space:nowrap;gap:6px}.zp-nav .zp-btn-i{width:30px;height:30px}
.zp-hero{min-height:auto}.zp-hero-in{grid-template-columns:1fr;padding-top:36px;padding-bottom:36px;gap:22px}
.zp-hero-p{grid-row:1}.zp-h1{grid-column:1;grid-row:2;justify-self:start;text-align:left;margin-top:30px}.zp-card{grid-row:3;max-width:none}
.zp-sec,.zp-visit{padding:72px 0}
.zp-about,.zp-prod,.zp-visit-in{grid-template-columns:1fr;gap:44px}.zp-badge{right:12px}.zp-about-pic::before{left:-10px;bottom:-10px}
.zp-prod-l{position:static}
.zp-bento{grid-template-columns:1fr;grid-template-rows:none}.zp-b{min-height:200px}.zp-b-pic{grid-row:auto;min-height:260px}
.zp-prod-g,.zp-revs{grid-template-columns:1fr}.zp-p:last-child:nth-child(odd){grid-column:auto}.zp-p-img,.zp-p:last-child:nth-child(odd) .zp-p-img{aspect-ratio:16/9}.zp-ticks{grid-template-columns:1fr}
}
/* ===== Mutual Wheel (truck parts) ===== */
body.t-mw{background:#fff}
.mw,.mw-modal{--red:#D32027;--red2:#B0181E;--blue:#1F5FD1;--blue2:#184CAB;--ink:#111317;--dark:#15171C;--dark2:#0C0D10;--mut:#5C616B;--line:#E2E4E8;--soft:#F3F4F6;--hd:'Oswald','Bebas Neue',Impact,sans-serif;font-family:Inter,system-ui,sans-serif;color:var(--ink);}.mw{background:#fff}
.mw-w{max-width:1200px;margin:0 auto;padding:0 28px}
.mw-ico{display:inline-grid;place-items:center}.mw-ico svg{width:24px;height:24px}
.mw h1,.mw h2,.mw h3{font-family:var(--hd);text-transform:uppercase;font-weight:600;letter-spacing:.01em;margin:0}
.mw-nav{position:sticky;top:0;z-index:50;background:var(--dark2);border-bottom:1px solid rgba(255,255,255,.08)}
.mw-nav-in{display:flex;align-items:center;justify-content:space-between;gap:20px;height:78px}
.mw-brand{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none}.mw-brand img{height:48px;width:auto}
.mw-brand>.mw-ico{color:var(--red)}.mw-brand>.mw-ico svg{width:40px;height:40px}
.mw-wm b{display:block;font-family:var(--hd);text-transform:uppercase;font-size:1.55rem;line-height:1;letter-spacing:.02em}.mw-wm small{display:block;color:var(--red);font-family:var(--hd);text-transform:uppercase;letter-spacing:.18em;font-size:.68rem;margin-top:3px}
.mw-mb{display:none!important}.mw-btn .mw-ico svg{width:17px;height:17px}.mw-links{display:flex;gap:24px}.mw-links a{white-space:nowrap;color:rgba(255,255,255,.8);text-decoration:none;font-family:var(--hd);text-transform:uppercase;letter-spacing:.06em;font-size:.92rem;padding:6px 0;border-bottom:2px solid transparent}.mw-links a:hover{color:#fff;border-bottom-color:var(--red)}
.mw-nav-r{display:flex;align-items:center;gap:16px}
.mw-tel{white-space:nowrap;display:flex;align-items:center;gap:8px;color:#fff;text-decoration:none;font-family:var(--hd);font-size:1.15rem;letter-spacing:.03em}.mw-tel .mw-ico{color:var(--red)}.mw-tel .mw-ico svg{width:20px;height:20px}
.mw-mnav{display:none}
.mw-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:15px 26px;border-radius:3px;font-family:var(--hd);text-transform:uppercase;letter-spacing:.06em;font-size:1rem;text-decoration:none;border:2px solid transparent;cursor:pointer;transition:background .2s,transform .15s}
.mw-btn:hover{transform:translateY(-1px)}.mw-btn.red{background:var(--red);color:#fff}.mw-btn.red:hover{background:var(--red2)}.mw-btn.blue{background:var(--blue);color:#fff}.mw-btn.blue:hover{background:var(--blue2)}
.mw-btn.line{border-color:var(--ink);color:var(--ink);background:#fff}.mw-btn.line:hover{background:var(--ink);color:#fff}.mw-btn.sm{padding:10px 16px;font-size:.85rem}
.mw-hero{position:relative;background:var(--dark2);color:#fff;padding-bottom:0}
.mw-hero-bg{position:absolute;inset:0;background-size:cover;background-position:center right}
.mw-hero-in{position:relative;padding-top:110px;padding-bottom:70px}
.mw-hero-t{max-width:620px}
.mw-kick{display:block;color:var(--red);font-family:var(--hd);text-transform:uppercase;letter-spacing:.16em;font-size:.85rem;margin-bottom:14px}
.mw-hero h1{font-size:clamp(2.6rem,5.6vw,4.4rem);line-height:1.02}.mw-hero h1 span{color:#4C8DFF}
.mw-rule{display:block;width:90px;height:4px;background:var(--blue);margin:22px 0}
.mw-hero p{font-size:1.08rem;line-height:1.65;color:rgba(255,255,255,.82);max-width:520px}
.mw-cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:28px}
.mw-strip{position:relative;display:grid;grid-template-columns:repeat(4,1fr);background:var(--dark);border:1px solid rgba(255,255,255,.1);transform:translateY(50%);box-shadow:0 20px 40px rgba(0,0,0,.25)}
.mw-strip>div{display:flex;align-items:center;gap:14px;padding:22px 24px;color:#fff}.mw-strip>div+div{border-left:1px solid rgba(255,255,255,.1)}
.mw-strip .mw-ico{color:var(--red)}.mw-strip .mw-ico svg{width:30px;height:30px}
.mw-strip b{display:block;font-family:var(--hd);text-transform:uppercase;letter-spacing:.04em;font-size:1.05rem;font-weight:500}.mw-strip small{display:block;color:rgba(255,255,255,.6);font-size:.82rem}
.mw-sec{padding:96px 0}.mw-soft{background:var(--soft)}
#mw-services{padding-top:150px}
.mw-head{display:flex;align-items:center;gap:22px;margin-bottom:40px}.mw-head::before,.mw-head::after{content:"";flex:1;height:1px;background:var(--line)}
.mw-head h2{font-size:clamp(1.9rem,3.4vw,2.6rem);text-align:center}.mw-head h2 span{color:var(--red)}
.mw-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.mw-card{min-height:250px;padding:26px;color:#fff;background-size:cover;background-position:center;display:flex;flex-direction:column;justify-content:flex-end;gap:6px;border-radius:3px;border-bottom:4px solid var(--red);transition:transform .25s}
.mw-card:hover{transform:translateY(-4px)}
.mw-card .mw-ico{margin-bottom:auto;color:var(--red);background:rgba(12,13,16,.7);width:52px;height:52px;border-radius:3px}.mw-card .mw-ico svg{width:28px;height:28px}
.mw-card b{font-family:var(--hd);text-transform:uppercase;font-size:1.35rem;font-weight:500;letter-spacing:.03em}.mw-card p{margin:0;font-size:.92rem;line-height:1.5;color:rgba(255,255,255,.82)}
.mw-card{font:inherit;text-align:left;cursor:pointer;border-top:0;border-left:0;border-right:0;width:100%}
.mw-card:first-child{grid-column:span 2}
.mw-btn{white-space:nowrap}
.mw-card:focus-visible{outline:3px solid var(--blue);outline-offset:3px}
.mw-more{display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-family:var(--hd);text-transform:uppercase;letter-spacing:.06em;font-size:.82rem;color:#fff;opacity:.85}
.mw-more .mw-ico{width:auto!important;height:auto!important;background:none!important;margin:0!important;color:var(--red)}.mw-more .mw-ico svg{width:16px!important;height:16px!important}
.mw-card:hover .mw-more{opacity:1}.mw-card:hover .mw-more .mw-ico{transform:translateX(3px)}
.mw-modal{position:fixed;inset:0;z-index:200;background:rgba(8,9,12,.72);backdrop-filter:blur(4px);display:grid;place-items:center;padding:18px;animation:mwFade .2s ease}
@keyframes mwFade{from{opacity:0}}
.mw-modal-card{position:relative;width:100%;max-width:720px;max-height:calc(100vh - 36px);overflow:auto;background:#fff;border-radius:4px;box-shadow:0 30px 80px rgba(0,0,0,.45);font-family:Inter,system-ui,sans-serif;color:#111317}
.mw-modal-top{min-height:200px;background-size:cover;background-position:center;color:#fff;padding:26px 30px;display:flex;flex-direction:column;justify-content:flex-end;gap:10px;border-bottom:4px solid #D32027}
.mw-modal-top .mw-ico{color:#D32027;background:rgba(12,13,16,.7);width:52px;height:52px;border-radius:3px}.mw-modal-top .mw-ico svg{width:28px;height:28px}
.mw-modal-top h3{font-family:'Oswald',Impact,sans-serif;text-transform:uppercase;font-weight:600;font-size:2rem;margin:0;letter-spacing:.01em}
.mw-modal-x{position:absolute;top:14px;right:14px;width:42px;height:42px;border-radius:3px;border:0;background:rgba(12,13,16,.75);color:#fff;cursor:pointer;display:grid;place-items:center}.mw-modal-x .mw-ico svg{width:22px;height:22px}
.mw-modal-b{padding:26px 30px 30px}
.mw-modal-intro{font-size:1.05rem;font-weight:600;margin:0 0 18px;line-height:1.5}.mw-modal-g{font-family:'Oswald',Impact,sans-serif;text-transform:uppercase;letter-spacing:.06em;font-size:1rem;font-weight:600;color:#D32027;margin:6px 0 4px}
.mw-modal-list{list-style:none;padding:0;margin:0 0 24px;display:grid;grid-template-columns:1fr 1fr;gap:10px 24px}
.mw-modal-list li{display:flex;align-items:center;gap:10px;font-size:.98rem;padding:8px 0;border-bottom:1px solid #E2E4E8}.mw-modal-list .mw-ico{color:#1F5FD1}.mw-modal-list .mw-ico svg{width:18px;height:18px}
.mw-modal-list.long{grid-template-columns:1fr 1fr 1fr}.mw-modal-cta{display:flex;gap:12px;flex-wrap:wrap;position:sticky;bottom:0;background:#fff;padding:14px 0 0;margin-bottom:-6px;box-shadow:0 -14px 14px -10px rgba(255,255,255,1)}.mw-modal-cta .mw-btn{flex:1}
.mw-center{text-align:center;margin-top:34px}
.mw-why{display:grid;grid-template-columns:repeat(6,1fr)}
.mw-why>div{text-align:center;padding:10px 14px}.mw-why>div+div{border-left:1px solid var(--line)}
.mw-why .mw-ico{color:var(--ink);margin-bottom:12px}.mw-why .mw-ico svg{width:40px;height:40px;stroke-width:1.4}
.mw-why b{display:block;font-family:var(--hd);text-transform:uppercase;font-weight:500;letter-spacing:.04em;font-size:.98rem}
.mw-req{display:grid;grid-template-columns:.8fr 1fr 1.2fr;background:var(--dark2);color:#fff;border-radius:3px;overflow:hidden}
.mw-req-pic{background-size:cover;background-position:center;min-height:100%}
.mw-req-t{padding:40px 30px}.mw-req-t h2{font-size:2.2rem;line-height:1.05}.mw-req-t h2 span{color:#4C8DFF}
.mw-req-t p{color:rgba(255,255,255,.75);line-height:1.6}
.mw-req-t ul{list-style:none;padding:0;margin:18px 0 0;display:grid;gap:10px}.mw-req-t li{display:flex;gap:10px;align-items:center;font-size:.95rem}.mw-req-t li .mw-ico{color:#4C8DFF}.mw-req-t li .mw-ico svg{width:18px;height:18px}
.mw-form{padding:40px 34px;display:grid;grid-template-columns:1fr 1fr;gap:12px;align-content:center}
.mw-form input,.mw-form select,.mw-form textarea{width:100%;background:#1C1F25;border:1px solid #2C3038;color:#fff;padding:14px;border-radius:3px;font:inherit;font-size:.95rem}
.mw-form select{color:rgba(255,255,255,.75)}.mw-form textarea{grid-column:span 2;resize:vertical}
.mw-form input:focus,.mw-form select:focus,.mw-form textarea:focus{outline:2px solid var(--blue);border-color:transparent}
.mw-form button{grid-column:span 2;font-size:1.05rem;padding:16px}.mw-form-msg{grid-column:span 2;margin:0;color:#9CC0FF;font-size:.92rem;min-height:1em}
.mw-hist{display:grid;grid-template-columns:.8fr 1.2fr;gap:60px;align-items:center}
.mw-hist-big{background:var(--dark2);color:#fff;padding:50px 40px;border-left:6px solid var(--red);border-radius:3px}
.mw-hist-big b{display:block;font-family:var(--hd);font-size:clamp(4.5rem,9vw,7rem);line-height:1;color:var(--red);font-weight:600}.mw-hist-big span{display:block;font-family:var(--hd);text-transform:uppercase;letter-spacing:.06em;font-size:1.2rem;margin-top:10px;line-height:1.3}
.mw-hist-t h2{font-size:clamp(1.9rem,3.4vw,2.6rem);margin-bottom:16px}.mw-hist-t h2 span{color:var(--red)}.mw-hist-t p{color:var(--mut);line-height:1.75;font-size:1.02rem}
.mw-badges{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:24px}
.mw-badges>div{display:flex;gap:12px;align-items:center;background:#fff;border:1px solid var(--line);padding:16px;border-radius:3px}.mw-badges .mw-ico{color:var(--blue)}.mw-badges .mw-ico svg{width:34px;height:34px}
.mw-badges b{display:block;font-family:var(--hd);text-transform:uppercase;font-weight:500;letter-spacing:.04em}.mw-badges span{font-size:.88rem;color:var(--mut)}
.mw-hist-photo{margin:0;position:relative;border-radius:3px;overflow:hidden;border-left:6px solid var(--red);background:var(--dark2)}
.mw-hist-photo img{display:block;width:100%;height:auto;filter:contrast(1.05)}
.mw-hist-photo figcaption{background:var(--dark2);color:#fff;padding:20px 24px;display:flex;align-items:center;gap:18px}
.mw-hist-photo b{font-family:var(--hd);font-size:3.2rem;line-height:1;color:var(--red);font-weight:600}.mw-hist-photo span{font-family:var(--hd);text-transform:uppercase;letter-spacing:.05em;font-size:1rem;line-height:1.3}
.mw-tl-c figure{max-width:none}.mw-tl-c img{width:auto!important;max-width:100%!important;max-height:280px;filter:contrast(1.05);box-shadow:0 10px 30px rgba(0,0,0,.15)}
.mw-mini{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0 26px}
.mw-mini>div{background:#fff;border:1px solid var(--line);border-top:3px solid var(--red);padding:12px 14px;border-radius:3px}
.mw-mini b{display:block;font-family:var(--hd);font-size:1.5rem;font-weight:600;color:var(--ink);line-height:1}.mw-mini span{display:block;font-size:.82rem;color:var(--mut);margin-top:4px}
.mw-hpage{position:fixed;inset:0;z-index:150;background:#fff;overflow-y:auto;-webkit-overflow-scrolling:touch}
.mw-hpage[hidden]{display:none}
.mw-hp-bar{position:sticky;top:0;z-index:2;background:var(--dark2);color:#fff}
.mw-hp-bar-in{display:flex;justify-content:space-between;align-items:center;height:60px;gap:12px}
.mw-hp-bar-in span{font-family:var(--hd);text-transform:uppercase;letter-spacing:.06em;color:rgba(255,255,255,.7)}
.mw-hp-back{display:inline-flex;align-items:center;gap:8px;background:none;border:0;color:#fff;cursor:pointer;font-family:var(--hd);text-transform:uppercase;letter-spacing:.06em;font-size:1rem}
.mw-hp-back .mw-ico{transform:rotate(180deg);color:var(--red)}
.mw-hp-hero{background:var(--dark);color:#fff;padding:70px 0 60px;border-bottom:4px solid var(--red)}
.mw-hp-hero h1{font-size:clamp(2.4rem,5vw,4rem);line-height:1.02}.mw-hp-hero h1 span{color:#4C8DFF}.mw-hp-hero p{color:rgba(255,255,255,.78);max-width:560px;line-height:1.6;font-size:1.05rem;margin-top:14px}
.mw-tl{position:relative;margin-top:60px;margin-bottom:30px;max-width:960px}
.mw-tl::before{content:"";position:absolute;left:192px;top:8px;bottom:40px;width:2px;background:var(--line)}
.mw-tl-i{display:grid;grid-template-columns:150px 1fr;gap:58px;padding-bottom:44px;position:relative}
.mw-tl-i::before{content:"";position:absolute;left:157px;top:12px;width:14px;height:14px;border-radius:50%;background:var(--red);box-shadow:0 0 0 5px #fff}
.mw-tl-y{font-family:var(--hd);font-size:1.7rem;font-weight:600;color:var(--red);text-align:right;line-height:1.2;white-space:nowrap}
.mw-tl-c h3{font-size:1.45rem;margin-bottom:8px}.mw-tl-c p{color:var(--mut);line-height:1.75;margin:0}
.mw-tl-c figure{margin:16px 0 0}.mw-tl-c img{width:100%;max-width:460px;border-radius:3px;display:block}.mw-tl-c figcaption{font-size:.85rem;color:var(--mut);margin-top:6px}
.mw-hp-end{display:flex;gap:12px;flex-wrap:wrap;padding-bottom:110px;max-width:900px}
.mw-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;counter-reset:s}
.mw-step{text-align:center;position:relative}.mw-step:not(:last-child)::after{content:"";position:absolute;top:36px;right:-18px;width:12px;height:12px;border-top:2px solid #B9BEC7;border-right:2px solid #B9BEC7;transform:rotate(45deg)}
.mw-step-i{position:relative;display:inline-grid;place-items:center;width:74px;height:74px;border:2px solid var(--blue);border-radius:50%;color:var(--blue);margin-bottom:14px}.mw-step-i .mw-ico svg{width:30px;height:30px}
.mw-step-i em{position:absolute;top:-4px;right:-4px;width:26px;height:26px;border-radius:50%;background:var(--red);color:#fff;font-style:normal;font-family:var(--hd);display:grid;place-items:center;font-size:.9rem}
.mw-step b{display:block;font-family:var(--hd);text-transform:uppercase;font-weight:500;letter-spacing:.04em;font-size:1.05rem}.mw-step p{color:var(--mut);font-size:.92rem;margin:6px 0 0}
.mw-visit{background:var(--dark);color:#fff;padding:96px 0}
.mw-visit-in{display:grid;grid-template-columns:1fr 1.2fr;gap:50px;align-items:stretch}
.mw-store h2{font-size:clamp(2rem,3.6vw,2.8rem);margin-bottom:20px}.mw-store h2 span{color:var(--red)}
.mw-li{display:flex;align-items:center;gap:12px;color:#fff;text-decoration:none;padding:10px 0;font-size:1.02rem}.mw-li .mw-ico{color:var(--red)}.mw-li .mw-ico svg{width:20px;height:20px}
.mw-hrs{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-top:16px}
.mw-hrs div{background:#1E2128;padding:10px 4px;text-align:center;border-radius:3px;font-size:.78rem;color:rgba(255,255,255,.7)}.mw-hrs span{display:block}.mw-hrs span:first-child{font-family:var(--hd);text-transform:uppercase;letter-spacing:.06em;font-size:.9rem;color:#fff;margin-bottom:4px}
.mw-hrs .on{background:var(--red);color:#fff}
.mw-mgr{color:rgba(255,255,255,.6);font-size:.92rem;margin-top:16px}
.mw-map{min-height:360px;border-radius:3px;overflow:hidden}.mw-map iframe{width:100%;height:100%;min-height:360px;border:0}
.mw-locs-h{font-size:clamp(1.8rem,3.2vw,2.4rem);margin:0 0 20px}.mw-locs{margin-bottom:56px}
.mw-locs{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.mw-loc{background:#1E2128;padding:16px;border-radius:3px;border-top:3px solid #2C3038}.mw-loc.on{border-top-color:var(--red)}
.mw-loc b{display:block;font-family:var(--hd);text-transform:uppercase;letter-spacing:.04em;font-weight:500;font-size:1.05rem}.mw-loc span,.mw-loc a{display:block;color:rgba(255,255,255,.65);font-size:.88rem;margin-top:3px;text-decoration:none}.mw-loc a:hover{color:#fff}
.mw-foot{background:var(--dark2);color:rgba(255,255,255,.65);padding-top:56px}
.mw-foot-in{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:40px;padding-bottom:40px}
.mw-foot-in>div>b{display:block;font-family:var(--hd);text-transform:uppercase;letter-spacing:.06em;color:#fff;margin-bottom:12px;font-weight:500}
.mw-foot-in span,.mw-foot-in a{display:block;font-size:.9rem;margin-bottom:6px;color:rgba(255,255,255,.65);text-decoration:none}.mw-foot-in p{font-size:.9rem;line-height:1.6}
.mw-foot-bar{background:var(--blue);color:#fff;padding:14px 0 90px;font-size:.85rem}
@media (max-width:980px){
.mw-w{padding:0 18px}.mw-links,.mw-tel,.mw-dk{display:none!important}.mw-mb{display:inline-flex!important}.mw-brand{white-space:nowrap}.mw-nav-in{height:64px}.mw-wm b{font-size:1.25rem}.mw-brand>.mw-ico svg{width:32px;height:32px}
.mw-mnav{display:flex;gap:18px;overflow-x:auto;scrollbar-width:none;padding:0 18px;border-top:1px solid rgba(255,255,255,.08)}.mw-mnav::-webkit-scrollbar{display:none}
.mw-mnav a{flex:none;color:rgba(255,255,255,.85);text-decoration:none;font-family:var(--hd);text-transform:uppercase;letter-spacing:.05em;font-size:.88rem;padding:11px 0}
.mw-hero-in{padding-top:56px;padding-bottom:30px}.mw-cta .mw-btn{flex:1 1 100%}
.mw-strip{grid-template-columns:1fr 1fr;transform:none;margin-bottom:0}.mw-strip>div{padding:16px 14px}.mw-strip>div:nth-child(3){border-left:0}.mw-strip>div:nth-child(n+3){border-top:1px solid rgba(255,255,255,.1)}
.mw-hero{padding-bottom:24px}#mw-services{padding-top:64px}.mw-sec,.mw-visit{padding:64px 0}
.mw-grid{grid-template-columns:1fr;gap:10px}.mw-card{min-height:0;display:grid;grid-template-columns:52px 1fr;column-gap:14px;align-items:center;padding:16px;border-bottom-width:3px}.mw-card .mw-ico{grid-row:span 3;margin:0}.mw-card:first-child{grid-column:auto}.mw-modal-list.long{grid-template-columns:1fr}.mw-modal-cta .mw-btn{padding:13px}.mw-more{margin-top:4px;font-size:.76rem}.mw-modal{padding:0;align-items:end}.mw-modal-card{max-height:92vh;border-radius:6px 6px 0 0}.mw-modal-top{min-height:150px;padding:20px}.mw-modal-top h3{font-size:1.6rem}.mw-modal-b{padding:20px 20px 26px}.mw-modal-list{grid-template-columns:1fr;gap:0}.mw-modal-cta{flex-direction:column}.mw-card b{font-size:1.15rem}.mw-card p{font-size:.86rem}.mw-strip b{font-size:.92rem}
.mw-why{grid-template-columns:1fr 1fr}.mw-why>div{border-left:0!important;border-top:1px solid var(--line);padding:18px 8px}
.mw-req{grid-template-columns:1fr}.mw-req-pic{min-height:160px}.mw-req-t,.mw-form{padding:26px 20px}.mw-form{grid-template-columns:1fr}.mw-form textarea,.mw-form button,.mw-form-msg{grid-column:auto}
.mw-hist,.mw-visit-in,.mw-foot-in{grid-template-columns:1fr;gap:30px}.mw-mini{grid-template-columns:1fr 1fr}.mw-tl{margin-top:36px}.mw-tl::before{left:25px}.mw-tl-i{grid-template-columns:1fr;gap:6px;padding-left:34px}.mw-tl-i::before{left:0}.mw-tl-y{text-align:left;font-size:1.5rem}.mw-hp-hero{padding:44px 0 40px}.mw-hp-bar-in span{display:none}.mw-badges{grid-template-columns:1fr}
.mw-steps{grid-template-columns:1fr;gap:20px}.mw-step{display:grid;grid-template-columns:74px 1fr;column-gap:16px;text-align:left;align-items:center}.mw-step-i{grid-row:span 2;margin:0}.mw-step:not(:last-child)::after{display:none}.mw-step p{margin:0}
.mw-hrs{grid-template-columns:repeat(4,1fr)}.mw-locs{grid-template-columns:1fr 1fr}.mw-head{gap:12px}
}
/* ===== Realty: luxury look (serif, full-bleed homes, image tiles) ===== */
.rt.lux{--serif:'Cormorant Garamond',Georgia,serif;--sans:'Montserrat',Inter,sans-serif;font-family:var(--sans);color:#1A1A1A}
.lux .rt-nav-in{min-height:92px}
.lux .rt-brand b{font-family:var(--serif);font-weight:600;font-size:1.7rem;letter-spacing:.06em;text-transform:uppercase}
.lux .rt-brand span{font-size:.6rem;letter-spacing:.3em}
.lux .rt-links button,.lux .rt-links a{white-space:nowrap;font-family:var(--sans);text-transform:uppercase;letter-spacing:.2em;font-size:.7rem;font-weight:600}
.lux .rt-navcall{border-radius:0;letter-spacing:.12em;font-size:.78rem;font-weight:600;padding:11px 18px}
.lux .rt-btn{border-radius:0;font-family:var(--sans);text-transform:uppercase;letter-spacing:.22em;font-size:.72rem;font-weight:600;padding:17px 30px}
.lux .rt-btn.solid{background:#fff;color:#111;border-color:#fff}.lux .rt-btn.solid:hover{background:transparent;color:#fff}
.lux .rt-btn.dark{background:#111;border-color:#111}.lux .rt-btn.dark:hover{background:transparent;color:#111}
.lux .rt-btn.outline{border-color:#111;border-width:1px}
.lux .rt-btn.line{border-width:1px}
.lux .rt-hero{min-height:100vh;padding:150px 0 130px;justify-content:center;text-align:center;background:#111}
.rt-hero-bg{position:absolute;inset:0}.rt-hero-bg img{width:100%;height:100%;object-fit:cover;transform:scale(1.06);animation:rtZoom 18s ease-out forwards}
@keyframes rtZoom{to{transform:scale(1)}}
.rt-hero-bg:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.55) 0%,rgba(0,0,0,.35) 45%,rgba(0,0,0,.6) 100%)}
.lux .rt-hero-in{display:flex;flex-direction:column;align-items:center}
.rt-hero-kick{font-size:.68rem;letter-spacing:.38em;text-transform:uppercase;font-weight:600;opacity:.85;margin-bottom:22px}
.lux .rt-hero h1{font-family:var(--serif);font-weight:500;text-transform:uppercase;letter-spacing:.08em;font-size:clamp(2.6rem,6.4vw,5.4rem);line-height:1;max-width:none}
.lux .rt-sub{font-size:.72rem;letter-spacing:.32em;text-transform:uppercase;opacity:.85;margin-top:18px}
.lux .rt-lead{font-family:var(--serif);font-style:italic;font-size:clamp(1.25rem,2.2vw,1.6rem);max-width:640px;margin:22px auto 0;opacity:.95;line-height:1.4}
.lux .rt-langs{justify-content:center}
.lux .rt-hero-btns{justify-content:center;margin-top:38px}
.rt-scroll{position:absolute;left:50%;bottom:34px;transform:translateX(-50%) rotate(90deg);width:46px;height:46px;border:1px solid rgba(255,255,255,.6);background:transparent;color:#fff;display:grid;place-items:center;cursor:pointer;border-radius:50%;animation:rtBob 2.4s ease-in-out infinite}
@keyframes rtBob{50%{bottom:24px}}
.rt-intro{padding:110px 0 70px;text-align:center}
.rt-intro-in{max-width:780px;margin:0 auto}
.lux .rt-intro h2{font-family:var(--serif);font-weight:500;font-size:clamp(2.2rem,4.4vw,3.4rem);line-height:1.1}
.rt-intro p{margin-top:20px;color:#5A5A5A;font-size:1.05rem;line-height:1.8}
.rt-orn{display:block;width:70px;height:1px;background:#111;margin:34px auto 0;position:relative}.rt-orn:after{content:"";position:absolute;left:50%;top:-4px;width:8px;height:8px;background:#fff;border:1px solid #111;transform:translateX(-50%) rotate(45deg)}
.lux .rt-cards-sec{margin-top:0;padding-bottom:40px}
.lux .rt-cards{gap:14px}
.lux .rt-card{position:relative;padding:0;min-height:460px;border:0;border-radius:0;box-shadow:none;overflow:hidden;color:#fff;cursor:pointer;text-align:left;background:#111;display:block;font:inherit}
.rt-card-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .8s ease}
.lux .rt-card:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.05) 30%,rgba(0,0,0,.78) 100%);transition:background .4s}
.lux .rt-card:hover .rt-card-img{transform:scale(1.06)}.lux .rt-card:hover:after{background:linear-gradient(180deg,rgba(0,0,0,.2) 0%,rgba(0,0,0,.85) 100%)}
.rt-card-in{position:absolute;left:0;right:0;bottom:0;z-index:1;padding:34px 30px}
.lux .rt-card h3{font-family:var(--serif);font-weight:500;font-size:2rem;text-transform:uppercase;letter-spacing:.06em;line-height:1.05}
.lux .rt-card p{color:rgba(255,255,255,.85);font-size:.92rem;line-height:1.6;margin-top:12px;max-height:0;opacity:0;overflow:hidden;transition:max-height .5s,opacity .5s}
.lux .rt-card:hover p,.lux .rt-card:focus-visible p{max-height:120px;opacity:1}
.rt-card-go{display:inline-flex;align-items:center;gap:10px;margin-top:16px;font-size:.68rem;letter-spacing:.26em;text-transform:uppercase;font-weight:600;border-bottom:1px solid rgba(255,255,255,.6);padding-bottom:6px}
.lux .rt-card:focus-visible{outline:2px solid #111;outline-offset:3px}
.lux .rt-kick{font-family:var(--sans);font-size:.66rem;letter-spacing:.34em;color:#777;display:flex;align-items:center;gap:14px}
.lux .rt-intro .rt-kick{justify-content:center}
.lux .rt-kick:before{content:"";width:36px;height:1px;background:currentColor}
.lux .rt-intro .rt-kick:after{content:"";width:36px;height:1px;background:currentColor}
.lux .rt-head h2,.lux .rt-about h2,.lux .rt-contact h2,.lux .rt-value h2,.lux .rt-guide h3,.lux .rt-facts-g h2{font-family:var(--serif);font-weight:500;letter-spacing:.01em;line-height:1.08}
.lux .rt-head h2{font-size:clamp(2.2rem,4.4vw,3.4rem)}
.lux .rt-sec{padding:110px 0}
.lux .rt-fact b,.lux .rt-why h3,.lux .rt-before h3,.lux .rt-lang h3,.lux .rt-calc-big,.lux .rt-sold-i b{font-family:var(--serif);font-weight:500}
.lux .rt-fact b{font-size:2.6rem}.lux .rt-why h3{font-size:1.6rem}
.lux .rt-navcall{white-space:nowrap}
.lux .rt-sec.gray{background:#F5F5F4}
.lux .rt-about-ph{border-radius:0;box-shadow:24px 24px 0 #F0EFED}
.lux .rt-about-t{font-size:1.04rem;color:#4A4A4A}
.lux .rt-steps h3,.lux .rt-tool .rt-sp-top b,.lux .rt-card-top h3{font-family:var(--serif);font-weight:600}
.lux .rt-steps li b{font-family:var(--serif);font-weight:500}
.lux .rt-tool,.lux .rt-sp,.lux input,.lux select,.lux textarea{border-radius:0!important}
.lux .rt-tg button{border-radius:0}
.lux .rt-area{border-radius:0;background:linear-gradient(160deg,#262626 0%,#0E0E0E 100%)}
.lux .rt-area b{font-family:var(--serif);font-weight:500;letter-spacing:.02em}
.lux .rt-area-n{font-family:var(--serif);font-weight:500}
.lux .rt-rev{border-radius:0}.lux .rt-rev blockquote{font-family:var(--serif);font-size:1.25rem;font-style:italic;line-height:1.5}
.lux .rt-soc{border-radius:0}
.lux .rt-foot-b b{font-family:var(--serif);font-weight:500;text-transform:uppercase;letter-spacing:.08em;font-size:1.6rem}
.lux .rt-foot h4{font-family:var(--sans);font-size:.7rem;letter-spacing:.26em;text-transform:uppercase}
.lux .rt-fab{border-radius:0;letter-spacing:.14em;text-transform:uppercase;font-size:.72rem}
@media (max-width:860px){
.lux .rt-hero{min-height:92vh;padding:130px 0 120px}.lux .rt-hero h1{letter-spacing:.04em}.lux .rt-hero-btns{flex-direction:column;width:100%;max-width:340px}.lux .rt-hero-btns .rt-btn{width:100%}
.rt-intro{padding:70px 0 40px}.lux .rt-card{min-height:300px}.lux .rt-card p{max-height:none;opacity:1}.lux .rt-sec{padding:72px 0}.lux .rt-brand b{font-size:1.3rem}
}

/* ===== SPIRITED: cinematic luxury lounge (editorial, parallax, layered reveals) ===== */
body.t-sp{background:#0E0C0D}
.sp{--bk:#0E0C0D;--ch:#161314;--ch2:#1D1919;--iv:#F3EDE4;--iv2:#D9D1C6;--mut:#A79E94;--gold:#C8A96A;--gold2:#E3CB97;--bronze:#8C6A3F;--line:rgba(200,169,106,.22);--disp:'Cormorant Garamond',Georgia,serif;--script:'Allura',cursive;--sans:'Montserrat',Inter,sans-serif;background:var(--bk);color:var(--iv);font-family:var(--sans);font-weight:400;position:relative;overflow-x:clip}
.sp a{text-decoration:none;color:inherit}
.sp button{font:inherit;background-color:transparent;border:0;color:inherit;cursor:pointer}
.sp-w{max-width:1240px;margin:0 auto;padding:0 40px}
.sp h1,.sp h2,.sp h3{font-family:var(--disp);font-weight:400;letter-spacing:-.005em}
.sp h2 em,.sp h1 em{font-style:italic;color:var(--gold2)}
.sp-kick{display:block;font-size:.66rem;font-weight:600;letter-spacing:.38em;text-transform:uppercase;color:var(--gold)}
.sp-script{display:block;font-family:var(--script);font-style:normal;font-size:2.6rem;color:var(--gold2);line-height:1}
.sp-btn{display:inline-flex;align-items:center;justify-content:center;height:52px;padding:0 32px;border-radius:1px;font-size:.7rem;font-weight:600;letter-spacing:.26em;text-transform:uppercase;transition:background .5s,color .5s,border-color .5s,letter-spacing .5s;white-space:nowrap}
.sp-btn.gold{background:var(--gold);color:#14100a}.sp-btn.gold:hover{background:var(--gold2);letter-spacing:.3em}
.sp-btn.line{border:1px solid rgba(243,237,228,.45);color:var(--iv)}.sp-btn.line:hover{border-color:var(--gold2);color:var(--gold2);letter-spacing:.3em}
.sp-btn.sm{height:40px;padding:0 22px;font-size:.64rem}
.sp-btn.wide{width:100%;grid-column:1/-1;margin-top:8px}
.sp-ul{display:inline-block;font-family:var(--disp);font-style:italic;font-size:1.3rem;color:var(--gold2);border-bottom:1px solid var(--line);padding-bottom:4px;transition:border-color .4s}.sp-ul:hover{border-color:var(--gold2)}
/* reveals */
.sp-rv{opacity:0;transform:translateY(34px);transition:opacity 1.2s cubic-bezier(.2,.7,.2,1),transform 1.2s cubic-bezier(.2,.7,.2,1)}.sp-rv.on{opacity:1;transform:none}
.sp-rv:nth-child(2){transition-delay:.1s}.sp-rv:nth-child(3){transition-delay:.2s}.sp-rv:nth-child(4){transition-delay:.3s}
.sp-pic{position:relative;overflow:hidden}.sp-pic-i{position:absolute;inset:-6%;background-size:cover;background-position:center;transition:transform 1.6s cubic-bezier(.2,.7,.2,1)}
.sp-mask{clip-path:inset(14% 8% 14% 8%);transition:clip-path 1.6s cubic-bezier(.7,0,.2,1)}.sp-mask .sp-pic-i{transform:scale(1.18)}
.sp-mask.on{clip-path:inset(0 0 0 0)}.sp-mask.on .sp-pic-i{transform:scale(1)}
/* smoke canvas (hero wisp) */
.sp-smoke{position:fixed;inset:0;width:100vw;height:100vh;z-index:25;pointer-events:none}
/* header */
.sp-head{position:fixed;top:0;left:0;right:0;z-index:40;transition:background .5s,box-shadow .5s,backdrop-filter .5s}
.sp-head.solid{background:rgba(14,12,13,.9);backdrop-filter:blur(10px);box-shadow:0 1px 0 var(--line)}
.sp-head-in{max-width:1360px;margin:0 auto;padding:0 40px;height:86px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:30px}
.sp-head-logo img{height:50px;width:auto;display:block}
.sp-head-nav{display:flex;gap:38px}
.sp-head-nav button{position:relative;font-size:.68rem!important;font-weight:500;letter-spacing:.28em;text-transform:uppercase;color:var(--iv);padding:10px 0}
.sp-head-nav button::after{content:"";position:absolute;left:50%;right:50%;bottom:3px;height:1px;background:var(--gold);transition:left .4s,right .4s}
.sp-head-nav button:hover{color:var(--gold2)}.sp-head-nav button:hover::after{left:0;right:0}
.sp-head-r{display:flex;align-items:center;justify-content:flex-end;gap:24px}
.sp-head-tel{font-size:.74rem;letter-spacing:.12em;color:var(--iv2)}.sp-head-tel:hover{color:var(--gold2)}
.sp-head-m{display:none}
/* 1. hero */
.sp-hero{position:relative;height:100vh;height:100svh;min-height:660px;overflow:hidden;background:#060506}
.sp-load{position:absolute;top:0;left:0;height:1px;width:0;background:var(--gold);z-index:5;animation:spLoad 2.4s cubic-bezier(.6,0,.2,1) forwards}
.sp-hero.lit .sp-load{animation:spLoad 1.2s cubic-bezier(.6,0,.2,1) forwards,spLoadOut .8s 1.3s forwards}
@keyframes spLoad{to{width:100%}}@keyframes spLoadOut{to{opacity:0}}
.sp-stage{position:absolute;left:50%;top:50%;width:max(100vw,calc(max(660px,100svh) * 1.3345 * 1.08));aspect-ratio:750/562;transform:translate(-50%,-50%) scale(1.08);animation:spIn 16s cubic-bezier(.2,.6,.2,1) forwards}
@keyframes spIn{to{transform:translate(-50%,-50%) scale(1)}}
.sp-l{position:absolute;inset:0;background-size:100% 100%}
.sp-l.base{filter:brightness(.1) saturate(.25)}
.sp-l.glass,.sp-l.blue,.sp-l.all{opacity:0}
.sp-l.glass{-webkit-mask-image:linear-gradient(90deg,#000 0%,#000 7%,transparent 14%,transparent 84%,#000 90%,#000 100%);mask-image:linear-gradient(90deg,#000 0%,#000 7%,transparent 14%,transparent 84%,#000 90%,#000 100%);filter:saturate(1.1) brightness(1)}
.sp-l.blue{-webkit-mask-image:radial-gradient(ellipse 42% 30% at 50% 38%,#000 55%,transparent 100%),linear-gradient(0deg,#000 0%,#000 8%,transparent 16%);mask-image:radial-gradient(ellipse 42% 30% at 50% 38%,#000 55%,transparent 100%),linear-gradient(0deg,#000 0%,#000 8%,transparent 16%);filter:saturate(.95) brightness(.95)}
.sp-l.all{filter:brightness(.78) saturate(.85)}
.sp-hero.lit .sp-l.glass{animation:spGlow 2.6s .4s ease forwards}
.sp-hero.lit .sp-l.blue{animation:spNeon 2.8s 1.6s linear forwards}
.sp-hero.lit .sp-l.all{animation:spFill 3.2s 3s ease forwards}
@keyframes spGlow{to{opacity:1}}
@keyframes spNeon{0%{opacity:0}7%{opacity:.6}10%{opacity:.08}15%{opacity:.75}19%{opacity:.25}26%{opacity:.9}40%,100%{opacity:1}}
@keyframes spFill{to{opacity:.75}}
.sp-hero-shade{position:absolute;inset:0;background:radial-gradient(ellipse 70% 60% at 50% 60%,rgba(8,6,7,.55) 0%,rgba(8,6,7,.25) 60%,rgba(8,6,7,.6) 100%),linear-gradient(0deg,#0E0C0D 0%,rgba(14,12,13,0) 34%),linear-gradient(180deg,rgba(14,12,13,.75) 0%,rgba(14,12,13,0) 22%)}
.sp-hero-c{position:absolute;z-index:3;left:0;right:0;top:50%;transform:translateY(-40%);display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 24px}
.sp-hero-c>*{opacity:0;transform:translateY(18px);transition:opacity 1.6s cubic-bezier(.2,.7,.2,1),transform 1.6s cubic-bezier(.2,.7,.2,1)}
.sp-hero.lit .sp-hero-c>*{opacity:1;transform:none}
.sp-hero.lit .sp-hero-c>:nth-child(1){transition-delay:3.4s}.sp-hero.lit .sp-hero-c>:nth-child(2){transition-delay:3.7s}.sp-hero.lit .sp-hero-c>:nth-child(3){transition-delay:4s}.sp-hero.lit .sp-hero-c>:nth-child(4){transition-delay:4.3s}
.sp-hero-logo{width:min(150px,36vw);height:auto;filter:drop-shadow(0 6px 24px rgba(0,0,0,.8))}
.sp-hero h1{font-size:clamp(2.9rem,7.2vw,6.4rem);line-height:.98;margin:26px 0 18px;color:var(--iv);text-shadow:0 4px 40px rgba(0,0,0,.6);max-width:14ch}
.sp-hero-sub{font-size:1rem;letter-spacing:.06em;color:var(--iv2);max-width:440px;line-height:1.7}
.sp-hero-btns{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:34px}
.sp-cue{position:absolute;z-index:3;left:50%;bottom:30px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:10px;font-size:.58rem;letter-spacing:.4em;text-transform:uppercase;color:var(--mut)}
.sp-cue i{display:block;width:1px;height:44px;background:linear-gradient(var(--gold),transparent);animation:spCue 2.6s ease-in-out infinite}
@keyframes spCue{0%{transform:scaleY(0);transform-origin:top}50%{transform:scaleY(1);transform-origin:top}51%{transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom}}
/* section headings */
.sp-head2{margin-bottom:60px}.sp-head2.center{text-align:center}
.sp-head2 h2,.sp-story h2,.sp-res h2,.sp-ev h2,.sp-visit h2,.sp-sig-intro h2{font-size:clamp(2.6rem,5vw,4.6rem);line-height:1.02;margin-top:18px}
.sp-head2 p{color:var(--mut);margin-top:18px;font-size:1rem}.sp-head2 p b{font-family:var(--disp);font-weight:500;font-size:1.25rem;color:var(--iv)}
/* 2. story */
.sp-story{padding:160px 0 150px;background:var(--bk)}
.sp-story-g{display:grid;grid-template-columns:1fr 1fr;gap:90px;align-items:center}
.sp-story-t p{color:var(--iv2);line-height:1.95;font-size:1.02rem;margin-top:22px;max-width:470px}
.sp-story-t h2{margin-bottom:12px}
.sp-story-p{position:relative;padding:0 0 90px 60px}
.sp-pic.tall{aspect-ratio:4/5}
.sp-story-p2{position:absolute;left:0;bottom:0;width:46%;box-shadow:0 30px 60px -20px rgba(0,0,0,.8);border:6px solid var(--bk)}.sp-story-p2 .sp-pic{aspect-ratio:3/4}
/* 3. signature pours */
.sp-sig{position:relative;background:var(--ch)}
.sp-sig-pin{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden;display:flex;align-items:center}
.sp-track{display:flex;gap:34px;padding:0 6vw;will-change:transform;align-items:center}
.sp-sig-intro{flex:0 0 min(420px,80vw);padding-right:30px}.sp-sig-intro p{color:var(--mut);line-height:1.9;margin-top:20px}
.sp-card{flex:0 0 clamp(300px,30vw,440px);opacity:0;transform:translateY(40px);transition:opacity 1.2s,transform 1.2s cubic-bezier(.2,.7,.2,1)}.sp-card.on{opacity:1;transform:none}
.sp-card:nth-child(odd){margin-top:80px}
.sp-card .sp-pic{aspect-ratio:4/5}.sp-card:hover .sp-pic-i{transform:scale(1.05)}
.sp-card-t{padding-top:22px}.sp-card-t small{font-size:.62rem;letter-spacing:.34em;text-transform:uppercase;color:var(--gold)}.sp-card-t h3{font-size:2rem;margin:8px 0 6px}.sp-card-t p{color:var(--mut);font-size:.92rem;line-height:1.7}
/* 4. gallery */
.sp-gal{padding:150px 0 130px}
.sp-stack{display:grid;grid-template-columns:repeat(12,1fr);grid-auto-rows:clamp(70px,7vw,100px);gap:22px}
.sp-gt{position:relative;overflow:hidden;display:block}.sp-gt .sp-pic-i{transition:transform 1.6s cubic-bezier(.2,.7,.2,1),filter .6s}.sp-gt:hover .sp-pic-i{transform:scale(1.04)!important;filter:brightness(1.08)}
.sp-gt.a{grid-column:1/8;grid-row:1/8}.sp-gt.b{grid-column:8/13;grid-row:2/6}.sp-gt.c{grid-column:9/13;grid-row:6/11}.sp-gt.d{grid-column:2/6;grid-row:8/13}.sp-gt.e{grid-column:6/9;grid-row:9/14}
.sp-gal-more{text-align:center;margin-top:60px}
/* 5. menu */
.sp-menu{padding:140px 0;background:var(--ch);border-top:1px solid var(--line)}
.sp-mps{display:grid;grid-template-columns:repeat(3,1fr);gap:56px}
.sp-mps.four{grid-template-columns:repeat(2,1fr);gap:56px 80px;max-width:1040px;margin:0 auto}
.sp-it.sp-sn{display:block}.sp-sn-top{display:flex;align-items:baseline;gap:12px}.sp-sn p{color:var(--mut);font-size:.86rem;line-height:1.6;margin-top:4px}
.sp-mp h3{font-size:1.9rem;color:var(--gold2);padding-bottom:16px;border-bottom:1px solid var(--line);margin-bottom:8px}
.sp-it{display:flex;align-items:baseline;gap:12px;padding:13px 0;border-bottom:1px solid rgba(200,169,106,.1)}
.sp-it b{font-family:var(--disp);font-weight:500;font-size:1.22rem;color:var(--iv)}.sp-it em{font-style:normal;color:var(--gold);margin:0 .34em}
.sp-dots{flex:1;border-bottom:1px dotted rgba(200,169,106,.28);transform:translateY(-4px)}
.sp-pr{font-family:var(--disp);font-size:1.2rem;color:var(--gold2)}
.sp-center{text-align:center;margin-top:64px}
.sp-full{display:grid;grid-template-rows:0fr;transition:grid-template-rows .9s cubic-bezier(.2,.7,.2,1)}.sp-full.open{grid-template-rows:1fr}
.sp-full-in{overflow:hidden}.sp-full.open .sp-full-in{padding-top:70px}
.sp-tabs{display:flex;justify-content:center;gap:4px 38px;flex-wrap:wrap;border-bottom:1px solid var(--line);margin-bottom:44px}
.sp-tab{font-family:var(--disp)!important;font-size:1.3rem;color:var(--mut)!important;padding:8px 2px 14px!important;margin-bottom:-1px;border-bottom:1px solid transparent!important;transition:color .4s}
.sp-tab.on{color:var(--gold2)!important;border-bottom-color:var(--gold)!important}.sp-tab:hover{color:var(--iv)!important}
.sp-panel{opacity:0;transform:translateY(10px);transition:opacity .6s,transform .6s}.sp-panel.in{opacity:1;transform:none}
.sp-panel-h{text-align:center;margin-bottom:34px}.sp-panel-h i{font-family:var(--script);font-style:normal;font-size:2.3rem;color:var(--gold2)}.sp-panel-h h3{font-size:2.4rem}
.sp-grp+.sp-grp{margin-top:36px}.sp-grp>.sp-kick{text-align:center;margin-bottom:10px}
.sp-items{display:grid;grid-template-columns:1fr 1fr;gap:0 60px;max-width:960px;margin:0 auto}
/* 6. reservation */
.sp-res{padding:150px 0;background:linear-gradient(180deg,var(--bk),#120F10)}
.sp-res-g{display:grid;grid-template-columns:minmax(260px,.8fr) 1.2fr;gap:60px;align-items:center}.sp-res-g>*,.sp-form>*,.sp-visit-g>*,.sp-story-g>*{min-width:0}.sp-fl input,.sp-fl select{width:100%;min-width:0}
.sp-res-t p{color:var(--iv2);line-height:1.9;margin:22px 0 28px;max-width:420px}
.sp-res-card{position:relative;background:var(--ch2);border:1px solid var(--line);padding:46px}
.sp-form{display:grid;grid-template-columns:1fr 1fr;gap:22px 24px}
.sp-fl{display:flex;flex-direction:column;gap:8px}.sp-fl.wide{grid-column:1/-1}
.sp-fl span{font-size:.6rem;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:var(--gold)}
.sp-fl input,.sp-fl select{appearance:none;-webkit-appearance:none;background:transparent;border:0;border-bottom:1px solid rgba(243,237,228,.25);color:var(--iv);font:inherit;font-size:16px;padding:10px 0;border-radius:0;color-scheme:dark;transition:border-color .4s}
.sp-fl select{background-image:linear-gradient(45deg,transparent 50%,var(--gold) 50%),linear-gradient(135deg,var(--gold) 50%,transparent 50%);background-position:calc(100% - 10px) 55%,calc(100% - 5px) 55%;background-size:5px 5px;background-repeat:no-repeat;padding-right:24px}
.sp-fl select option{background:#1D1919;color:var(--iv)}
.sp-fl input:focus,.sp-fl select:focus{outline:0;border-color:var(--gold2)}
.sp-fl input::placeholder{color:#6f675f}
.sp-ok{display:none;text-align:center;padding:30px 10px}.sp-ok h3{font-size:2.2rem;margin:8px 0 12px}.sp-ok p{color:var(--mut);line-height:1.8}
.sp-res-card.done .sp-form{display:none}.sp-res-card.done .sp-ok{display:block}
/* 7. events */
.sp-ev{position:relative;padding:190px 0;overflow:hidden}
.sp-ev-bg{position:absolute;inset:-14% 0;background-size:cover;background-position:center;filter:brightness(.5) saturate(.85)}
.sp-ev-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(14,12,13,.95) 0%,rgba(14,12,13,.7) 45%,rgba(14,12,13,.2) 100%)}
.sp-ev-in{position:relative;z-index:1}.sp-ev-in p{color:var(--iv2);line-height:1.95;max-width:500px;margin-top:22px}
.sp-ev-btns{display:flex;gap:14px;flex-wrap:wrap;margin-top:36px}
/* 8. visit */
.sp-visit{padding:150px 0;background:var(--bk)}
.sp-visit-g{display:grid;grid-template-columns:1fr 1.15fr;gap:80px;align-items:center}
.sp-visit h2{font-size:clamp(2.2rem,3.8vw,3.4rem)}
.sp-hrs{margin-top:36px;max-width:420px}.sp-hrs div{display:flex;justify-content:space-between;gap:20px;padding:13px 0;border-bottom:1px solid rgba(200,169,106,.14);font-family:var(--disp);font-size:1.22rem}.sp-hrs div.on{color:var(--gold2)}
.sp-contact{display:flex;flex-direction:column;gap:6px;margin-top:28px;color:var(--iv2)}.sp-contact a:hover{color:var(--gold2)}
.sp-map{aspect-ratio:5/4;overflow:hidden;border:1px solid var(--line)}.sp-map iframe{width:100%;height:100%;border:0;filter:grayscale(.3) sepia(.08)}
/* 9. footer */
.sp-foot{padding:90px 0 40px;border-top:1px solid var(--line);text-align:center;background:#0A0809}
.sp-foot-logo{width:110px;height:auto;margin:0 auto 34px;display:block}
.sp-foot-nav{display:flex;justify-content:center;gap:10px 34px;flex-wrap:wrap}.sp-foot-nav button{font-size:.64rem!important;letter-spacing:.3em;text-transform:uppercase;color:var(--iv2)}.sp-foot-nav button:hover{color:var(--gold2)}
.sp-foot-soc{display:flex;justify-content:center;gap:26px;margin-top:22px}.sp-foot-soc a{font-family:var(--disp);font-style:italic;font-size:1.15rem;color:var(--gold2)}
.sp-copy{margin-top:46px;font-size:.72rem;letter-spacing:.06em;color:#756C64}
@media (max-width:1100px){.sp-head-tel{display:none}.sp-head-nav{gap:26px}}
@media (max-width:900px){
 .sp-w{padding:0 24px}
 .sp-head-in{height:64px;padding:0 18px;grid-template-columns:auto 1fr;gap:12px}.sp-head-logo img{height:40px}.sp-head-nav{display:none}
 .sp-head-m{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid var(--line);background:rgba(14,12,13,.88);backdrop-filter:blur(8px)}
 .sp-head-m button{padding:12px 4px;font-size:.62rem!important;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:var(--iv)}.sp-head-m button+button{border-left:1px solid var(--line)}
 .sp-hero-c{top:auto;bottom:92px;transform:none}.sp-hero h1{font-size:2.9rem;margin:18px 0 12px}.sp-hero-sub{font-size:.92rem}.sp-hero-btns{margin-top:24px;gap:10px}.sp-hero .sp-btn{height:48px;padding:0 22px}.sp-cue{display:none}
 .sp-story{padding:100px 0}.sp-story-g{grid-template-columns:1fr;gap:56px}.sp-story-p{padding:0 0 70px 40px}
 .sp-sig{height:auto!important}.sp-sig-pin{position:static;height:auto;padding:100px 0;display:block}
 .sp-track{transform:none!important;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-left:24px;padding:0 24px 10px;gap:18px;scrollbar-width:none;align-items:flex-start}.sp-track::-webkit-scrollbar{display:none}
 .sp-sig-intro{flex:0 0 78vw;scroll-snap-align:start}.sp-card{flex:0 0 74vw;scroll-snap-align:start}.sp-card:nth-child(odd){margin-top:0}
 .sp-gal{padding:100px 0}.sp-stack{grid-template-columns:1fr 1fr;grid-auto-rows:auto;gap:10px}.sp-gt{aspect-ratio:3/4;translate:none!important}.sp-gt.a{grid-column:1/-1;grid-row:auto;aspect-ratio:4/3}.sp-gt.b,.sp-gt.c,.sp-gt.d,.sp-gt.e{grid-column:auto;grid-row:auto}.sp-gt.e{display:none}
 .sp-menu{padding:100px 0}.sp-mps,.sp-mps.four{grid-template-columns:1fr;gap:44px}.sp-items{grid-template-columns:1fr}.sp-it b{font-size:1.12rem}
 .sp-tabs{gap:2px 22px;flex-wrap:nowrap;overflow-x:auto;justify-content:flex-start;scrollbar-width:none}.sp-tab{font-size:1.15rem;white-space:nowrap}
 .sp-res{padding:100px 0}.sp-res-g{grid-template-columns:1fr;gap:44px}.sp-res-card{padding:28px 22px}.sp-form{grid-template-columns:1fr 1fr;gap:20px 16px}
 .sp-ev{padding:120px 0}.sp-ev-shade{background:linear-gradient(0deg,rgba(14,12,13,.92),rgba(14,12,13,.6))}
 .sp-visit{padding:100px 0}.sp-visit-g{grid-template-columns:1fr;gap:44px}
 .sp-foot{padding:70px 0 100px}}
@media (prefers-reduced-motion:reduce){.sp-stage{animation:none}.sp-l.glass,.sp-l.blue{opacity:1;animation:none!important}.sp-l.all{opacity:.75;animation:none!important}.sp-hero-c>*{opacity:1;transform:none;transition:none}.sp-rv,.sp-card{opacity:1;transform:none;transition:none}.sp-mask{clip-path:none;transition:none}}
/* ===== Mountaintop Stoneworks ===== */
body.t-mt{background:#111}
.mt{--y:#F2D513;--y2:#D9BE00;--ink:#F3F1EC;--bg:#111111;--bg2:#1A1A1A;--card:#202020;--line:rgba(255,255,255,.1);--mut:#A7A39A;--stone:#ECE9E3;--f:'Outfit',Inter,sans-serif;font-family:var(--f);color:var(--ink);background:var(--bg)}
.mt-w{max-width:1220px;margin:0 auto;padding:0 28px}
.mt-i{display:inline-grid;place-items:center}.mt-i svg{width:20px;height:20px}.mt-i.big svg{width:30px;height:30px}
.mt h1,.mt h2,.mt h3{margin:0;font-weight:600;letter-spacing:-.02em}
.mt-kick{display:inline-flex;align-items:center;gap:12px;color:var(--y);font-size:.74rem;font-weight:600;letter-spacing:.24em;text-transform:uppercase}
.mt-kick:before{content:"";width:28px;height:2px;background:var(--y)}
.mt-nav{position:sticky;top:0;z-index:50;background:rgba(17,17,17,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.mt-nav-in{display:flex;align-items:center;gap:26px;height:80px}
.mt-logo img{height:52px;width:auto;display:block}
.mt-links{display:flex;gap:28px;margin-left:auto}.mt-links a{color:#D7D3CB;text-decoration:none;font-size:.95rem;font-weight:500;padding:6px 0;border-bottom:2px solid transparent}.mt-links a:hover{color:#fff;border-bottom-color:var(--y)}
.mt-mlinks{display:none}.mt-btn-m{display:none}
.mt-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:15px 26px;border-radius:4px;font-weight:600;font-size:.98rem;text-decoration:none;white-space:nowrap;transition:background .2s,transform .15s,color .2s;border:1.5px solid transparent}
.mt-btn:hover{transform:translateY(-2px)}
.mt-btn.y{background:var(--y);color:#111}.mt-btn.y:hover{background:#fff}
.mt-btn.ghost{border-color:rgba(255,255,255,.45);color:#fff}.mt-btn.ghost:hover{background:#fff;color:#111}
.mt-btn.sm{padding:11px 18px;font-size:.92rem}
.mt-hero{position:relative;min-height:calc(100vh - 80px);display:flex;flex-direction:column;justify-content:center;overflow:hidden;background:#000}
.mt-slides,.mt-slide{position:absolute;inset:0}
.mt-slide{background-size:cover;background-position:center;opacity:0;transform:scale(1.08);transition:opacity 1.6s ease,transform 7s ease}
.mt-slide.on{opacity:1;transform:scale(1)}
.mt-slides:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(10,10,10,.92) 0%,rgba(10,10,10,.7) 45%,rgba(10,10,10,.25) 100%),linear-gradient(0deg,rgba(10,10,10,.9) 0%,transparent 35%)}
.mt-hero-in{position:relative;padding-top:80px;padding-bottom:40px}
.mt-hero h1{font-size:clamp(3rem,8vw,6.8rem);line-height:.95;letter-spacing:-.04em;font-weight:700;margin:20px 0 22px;max-width:900px}
.mt-hero h1 em{font-style:normal;color:var(--y)}
.mt-lead{font-size:1.18rem;line-height:1.7;color:#D7D3CB;max-width:600px;font-weight:300}
.mt-cta{display:flex;gap:12px;flex-wrap:wrap;margin-top:32px}
.mt-strip{position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-bottom:40px;border-top:1px solid var(--line)}
.mt-strip>div{display:flex;gap:14px;align-items:center;padding:22px 18px 0 0}
.mt-strip .mt-i{width:44px;height:44px;border:1px solid rgba(242,213,19,.4);color:var(--y);border-radius:4px;flex:none}
.mt-strip b{display:block;font-weight:600}.mt-strip small{display:block;color:var(--mut);font-size:.86rem}
.mt-sec{padding:110px 0;background:var(--stone);color:#151515}
.mt-sec.mt-dark{background:var(--bg);color:var(--ink)}
.mt-sec:not(.mt-dark) .mt-kick{color:#8A7400}.mt-sec:not(.mt-dark) .mt-kick:before{background:#B89D00}
.mt-head{max-width:720px;margin-bottom:46px}
.mt-head h2{font-size:clamp(2.3rem,4.6vw,3.6rem);line-height:1.04;margin:14px 0 14px}
.mt-head p{color:#5E5A53;font-size:1.06rem;line-height:1.7}.mt-dark .mt-head p{color:var(--mut)}
.mt-vgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.mt-v{background:#fff;padding:36px 32px;border-top:3px solid var(--y);box-shadow:0 20px 40px rgba(0,0,0,.06)}
.mt-v .mt-i{color:#111;background:var(--y);width:60px;height:60px;border-radius:4px;margin-bottom:22px}
.mt-v h3{font-size:1.6rem;margin-bottom:10px}.mt-v p{color:#5E5A53;line-height:1.7}
.mt-v blockquote{margin:16px 0 0;padding:14px 16px;background:#F7F5EF;border-left:3px solid var(--y);font-style:italic;color:#2A2824;font-size:.95rem;line-height:1.55}
.mt-ftabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:28px}
.mt-ftabs button{font:inherit;font-weight:600;font-size:.9rem;padding:10px 18px;border-radius:4px;border:1px solid var(--line);background:transparent;color:#D7D3CB;cursor:pointer}
.mt-ftabs button.on{background:var(--y);border-color:var(--y);color:#111}
.mt-sgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.mt-s{background:var(--card);border:1px solid var(--line);border-radius:6px;overflow:hidden;transition:transform .25s,border-color .25s}
.mt-s:hover{transform:translateY(-4px);border-color:rgba(242,213,19,.5)}
.mt-s-sw{height:150px}
.sw0{background:linear-gradient(135deg,#f4f2ee 0%,#e7e3dc 40%,#f7f6f3 60%,#dcd7ce 100%)}
.sw1{background:radial-gradient(circle at 20% 30%,#5a5550 2px,transparent 3px) 0 0/14px 14px,radial-gradient(circle at 70% 60%,#9b948a 2px,transparent 3px) 0 0/18px 18px,linear-gradient(135deg,#2c2a28,#4a4642)}
.sw2{background:linear-gradient(115deg,transparent 40%,rgba(120,120,128,.55) 42%,transparent 45%),linear-gradient(160deg,transparent 60%,rgba(150,150,158,.45) 62%,transparent 64%),#f5f4f1}
.sw3{background:linear-gradient(100deg,transparent 30%,rgba(170,160,150,.5) 33%,transparent 37%),linear-gradient(170deg,#efece6,#d9d3c9)}
.sw4{background:linear-gradient(135deg,#3b3d40,#55585c 50%,#2e3033)}
.sw5{background:radial-gradient(ellipse at 30% 40%,#5d6a66,transparent 60%),linear-gradient(135deg,#3c4542,#2a302e)}
.sw6{background:repeating-linear-gradient(175deg,#d9c8a9 0 6px,#e6d8bd 6px 14px,#cdb995 14px 17px)}
.sw7{background:radial-gradient(circle at 30% 30%,#e9dfcc,#d6c7ab)}
.sw8{background:radial-gradient(ellipse at 20% 30%,#f6e7c8,transparent 50%),radial-gradient(ellipse at 80% 70%,#e9cfa6,transparent 50%),linear-gradient(135deg,#f3e2c4,#dfc196)}
.sw9{background:linear-gradient(120deg,transparent 45%,rgba(200,180,150,.6) 48%,transparent 52%),#efe8dc}
.mt-s-b{padding:20px 20px 22px}
.mt-s-top{display:flex;justify-content:space-between;align-items:center;gap:10px}
.mt-s h3{font-size:1.3rem}
.mt-tag{font-size:.66rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:4px 8px;border-radius:3px}
.mt-tag.natural{background:rgba(242,213,19,.15);color:var(--y)}.mt-tag.engineered{background:rgba(130,170,255,.15);color:#A9C3FF}.mt-tag.fabricated{background:rgba(160,230,190,.15);color:#A6E5C1}
.mt-s p{color:var(--mut);font-size:.92rem;line-height:1.6;margin:10px 0 14px}
.mt-chips{display:flex;flex-wrap:wrap;gap:6px}.mt-chips span{font-size:.74rem;color:#D7D3CB;border:1px solid var(--line);padding:4px 8px;border-radius:3px}
.mt-brands{margin-top:24px;color:var(--mut)}.mt-brands b{color:#fff}
.mt-why{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}
.mt-why-ph{aspect-ratio:4/5;background-size:cover;background-position:center;border-radius:4px;box-shadow:24px 24px 0 var(--y)}
.mt-why h2{font-size:clamp(2rem,3.6vw,2.9rem);line-height:1.1;margin:14px 0 26px}
.mt-why-l{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:1fr 1fr;gap:14px}
.mt-why-l li{display:flex;align-items:center;gap:12px;font-weight:500;background:#fff;padding:16px;border-radius:4px}
.mt-why-l .mt-i{color:#111;background:var(--y);width:38px;height:38px;border-radius:4px;flex:none}
.mt-pgrid{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:240px;gap:12px}
.mt-p{position:relative;padding:0;border:0;overflow:hidden;cursor:zoom-in;border-radius:4px;background:#222}
.mt-p.p0{grid-column:span 2;grid-row:span 2}.mt-p.p3{grid-row:span 2}
.mt-p img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .8s}
.mt-p:hover img{transform:scale(1.06)}
.mt-p span{position:absolute;left:0;right:0;bottom:0;padding:30px 16px 14px;background:linear-gradient(0deg,rgba(0,0,0,.8),transparent);color:#fff;font-weight:500;text-align:left;font:inherit}
.mt-lb{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.92);display:grid;place-items:center;padding:20px}
.mt-lb[hidden]{display:none}
.mt-lb figure{margin:0;max-width:1100px}.mt-lb img{max-width:100%;max-height:82vh;display:block;border-radius:4px}.mt-lb figcaption{color:#fff;margin-top:10px;font-family:'Outfit',sans-serif}
.mt-lb-x{position:absolute;top:16px;right:16px;width:46px;height:46px;border-radius:4px;border:0;background:var(--y,#F2D513);background:#F2D513;color:#111;cursor:pointer;display:grid;place-items:center}
.mt-steps{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(4,1fr);gap:18px;counter-reset:s}
.mt-steps li{position:relative;background:#fff;padding:30px 26px;border-radius:4px;overflow:hidden}
.mt-step-n{position:absolute;right:16px;top:8px;font-size:3.6rem;font-weight:700;color:rgba(0,0,0,.06);letter-spacing:-.04em}
.mt-steps .mt-i{color:#111;background:var(--y);width:56px;height:56px;border-radius:4px;margin-bottom:18px}
.mt-steps h3{font-size:1.25rem;margin-bottom:8px}.mt-steps p{color:#5E5A53;line-height:1.6;font-size:.95rem}
.mt-center{text-align:center;margin-top:40px}
.mt-revs .mt-head{margin-bottom:34px}
.mt-rrow{overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent);mask-image:linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)}
.mt-rtrack{display:flex;width:max-content;animation:mtRoll 60s linear infinite}
.mt-rrow:hover .mt-rtrack{animation-play-state:paused}
@keyframes mtRoll{to{transform:translateX(-50%)}}
.mt-r{flex:0 0 360px;margin:0 16px 0 0;background:var(--card);border:1px solid var(--line);border-radius:6px;padding:28px}
.mt-stars{display:flex;gap:2px;color:var(--y);margin-bottom:14px}.mt-stars .mt-i svg{width:17px;height:17px;fill:currentColor}
.mt-r blockquote{margin:0 0 16px;font-size:1.15rem;line-height:1.5;font-weight:500}
.mt-r figcaption{color:var(--mut);font-size:.9rem}
.mt-team{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.mt-tm{display:grid;grid-template-columns:60px 1fr;column-gap:16px;align-items:center;background:#fff;padding:20px;border-radius:4px}
.mt-av{grid-row:span 2;width:60px;height:60px;border-radius:50%;background:#111;color:var(--y);display:grid;place-items:center;font-weight:700;font-size:1.1rem;letter-spacing:.04em}
.mt-tm b{font-size:1.1rem}.mt-tm small{color:#6B665E}
.mt-visit{display:grid;grid-template-columns:1fr 1.1fr;gap:56px;align-items:center}
.mt-visit h2{font-size:clamp(2.2rem,4.4vw,3.4rem);line-height:1.05;margin:14px 0 22px}
.mt-li{display:flex;align-items:center;gap:12px;color:#fff;text-decoration:none;padding:10px 0;font-size:1.06rem}.mt-li .mt-i{color:var(--y)}
.mt-hrs{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:18px 0 26px}
.mt-hrs div{background:var(--card);border:1px solid var(--line);border-radius:4px;padding:10px 4px;text-align:center}
.mt-hrs span{display:block;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:var(--mut)}
.mt-hrs b{display:block;font-size:.76rem;font-weight:600;margin-top:4px;line-height:1.3}
.mt-hrs .on{background:var(--y);border-color:var(--y)}.mt-hrs .on span,.mt-hrs .on b{color:#111}
.mt-soc{display:flex;gap:10px;margin-top:22px}.mt-soc a{width:44px;height:44px;display:grid;place-items:center;border:1px solid var(--line);border-radius:4px;color:#fff}.mt-soc a:hover{background:var(--y);color:#111}
.mt-map{aspect-ratio:4/3;border-radius:6px;overflow:hidden;border:1px solid var(--line)}.mt-map iframe{width:100%;height:100%;border:0;filter:grayscale(.6) contrast(1.05)}
.mt-foot{background:#0A0A0A;border-top:3px solid var(--y);padding:40px 0 110px}
.mt-foot-in{display:flex;align-items:center;gap:28px;flex-wrap:wrap}.mt-foot img{height:56px}.mt-foot p{margin:0;color:var(--mut);flex:1;min-width:220px}.mt-foot small{color:var(--mut)}
@media (max-width:980px){
.mt-w{padding:0 20px}.mt-links{display:none}.mt-nav-in{height:66px}.mt-logo img{height:40px}.mt-nav .mt-btn{margin-left:auto}.mt-nav .mt-btn-t{display:none}.mt-nav .mt-btn-m{display:inline}.mt-mlinks{gap:14px!important}.mt-mlinks a{font-size:.86rem!important}
.mt-mlinks{display:flex;gap:18px;overflow-x:auto;scrollbar-width:none;padding:0 20px;border-top:1px solid var(--line)}.mt-mlinks::-webkit-scrollbar{display:none}.mt-mlinks a{flex:none;color:#D7D3CB;text-decoration:none;font-weight:500;padding:11px 0;font-size:.92rem}
.mt-hero{min-height:0}.mt-hero-in{padding-top:56px}.mt-slides:after{background:linear-gradient(0deg,rgba(10,10,10,.95) 10%,rgba(10,10,10,.55) 100%)}
.mt-cta .mt-btn{flex:1 1 100%}.mt-strip{grid-template-columns:1fr 1fr;gap:4px 10px}.mt-strip>div{padding:16px 0 0}
.mt-sec{padding:72px 0}.mt-vgrid,.mt-why,.mt-steps,.mt-team,.mt-visit{grid-template-columns:1fr;gap:16px}.mt-why{gap:40px}.mt-why-ph{aspect-ratio:4/3;box-shadow:12px 12px 0 var(--y)}
.mt-why-l{grid-template-columns:1fr}.mt-pgrid{grid-template-columns:1fr 1fr;grid-auto-rows:160px}.mt-p.p0{grid-column:span 2}.mt-p.p3{grid-row:auto}
.mt-r{flex-basis:290px}.mt-hrs{grid-template-columns:repeat(4,1fr)}
}
/* ===== Mountaintop: warm, welcoming light theme ===== */
.mt{--y:#F2D513;--gold:#9A7B00;--cream:#F8F4EC;--sand:#EFE8DB;--wink:#2A231C;background:var(--cream)}
.mt h2 em{font-family:'Fraunces',Georgia,serif;font-style:italic;font-weight:500;color:var(--gold)}
.mt-nav{background:rgba(38,31,24,.94)}
.mt-btn{border-radius:12px}
.mt-hero{background:#2A231C}
.mt-slides:after{background:linear-gradient(90deg,rgba(38,30,22,.88) 0%,rgba(38,30,22,.6) 48%,rgba(38,30,22,.15) 100%),linear-gradient(0deg,rgba(38,30,22,.85) 0%,transparent 40%)}
.mt-hero h1 em{font-family:'Fraunces',Georgia,serif;font-style:italic;font-weight:500}
.mt-strip{border-top:0;gap:12px;grid-template-columns:repeat(4,1fr)}
.mt-strip>div{background:rgba(255,255,255,.1);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.16);border-radius:16px;padding:16px 18px}
.mt-strip .mt-i{border-radius:12px;background:var(--y);color:#2A231C;border:0}
.mt-sec{background:var(--cream);color:var(--wink)}
.mt-sec.mt-dark{background:var(--sand);color:var(--wink)}
.mt .mt-kick{color:var(--gold)}.mt .mt-kick:before{background:var(--y);height:3px;border-radius:2px}
.mt-dark .mt-head p,.mt-head p{color:#6E655A}
.mt-v,.mt-why-l li,.mt-steps li,.mt-tm{border-radius:20px;box-shadow:0 14px 34px rgba(60,45,20,.08);border:0}
.mt-v{border-top:0;position:relative;overflow:hidden}.mt-v:before{content:"";position:absolute;left:0;right:0;top:0;height:5px;background:var(--y)}
.mt-v .mt-i,.mt-why-l .mt-i,.mt-steps .mt-i{border-radius:14px}
.mt-v blockquote{border-radius:12px;background:var(--cream)}
.mt-ftabs button{border-radius:12px;background:#fff;border:1px solid #E4DCCB;color:var(--wink)}
.mt-ftabs button.on{background:var(--wink);border-color:var(--wink);color:#fff}
.mt-s{background:#fff;border:0;border-radius:20px;box-shadow:0 14px 34px rgba(60,45,20,.08)}
.mt-s:hover{border-color:transparent;box-shadow:0 22px 44px rgba(60,45,20,.14)}
.mt-s h3{color:var(--wink)}.mt-s p{color:#6E655A}
.mt-chips span{color:#5A5248;border-color:#E9E1D2;background:var(--cream);border-radius:8px}
.mt-tag{border-radius:8px}.mt-tag.natural{background:#FFF6C2;color:#7A6200}.mt-tag.engineered{background:#E4ECFF;color:#2E4CA0}.mt-tag.fabricated{background:#DFF5E8;color:#1E6B42}
.mt-brands{color:#6E655A}.mt-brands b{color:var(--wink)}
.mt-why-ph{border-radius:24px;box-shadow:18px 18px 0 var(--y)}
.mt-p{border-radius:18px}
.mt-r{background:#fff;border:0;border-radius:20px;box-shadow:0 14px 30px rgba(60,45,20,.08)}
.mt-r blockquote{color:var(--wink)}.mt-r figcaption{color:#7A7064}
.mt-stars{color:#E0B800}
.mt-rrow{-webkit-mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent);mask-image:linear-gradient(90deg,transparent,#000 5%,#000 95%,transparent);padding:10px 0 24px}
.mt-av{background:var(--y);color:var(--wink)}
.mt-visit{background:#fff;border-radius:28px;padding:44px;box-shadow:0 20px 50px rgba(60,45,20,.1)}
.mt-li{color:var(--wink)}.mt-li .mt-i{color:var(--gold)}
.mt-hrs div{background:var(--cream);border:0;border-radius:12px}.mt-hrs span{color:#7A7064}.mt-hrs b{color:var(--wink)}
.mt-hrs .on{background:var(--y)}
.mt-visit .mt-btn.ghost{border-color:#D9CFBC;color:var(--wink)}.mt-visit .mt-btn.ghost:hover{background:var(--wink);color:#fff}
.mt-soc a{border-color:#E4DCCB;color:var(--wink);border-radius:12px}
.mt-map{border:0;border-radius:20px}.mt-map iframe{filter:none}
.mt-foot{background:#2A231C;border-top:4px solid var(--y)}
.mt-hero .mt-kick{color:var(--y)}
.mt-welcome{background:var(--y);color:#2A231C;text-align:center;padding:14px 20px;font-weight:600}
.mt-welcome a{color:#2A231C;font-weight:700}
@media (max-width:980px){.mt-strip{grid-template-columns:1fr 1fr;gap:10px}.mt-strip>div{padding:12px;gap:10px}.mt-strip .mt-i{width:36px;height:36px}.mt-strip b{font-size:.9rem;line-height:1.25}.mt-strip small{font-size:.76rem}.mt-visit{padding:24px 18px;border-radius:20px}}
/* ===== Mountaintop v2: modern monochrome ===== */
body.t-mt{background:#fff}
.m2{--ink:#0F1011;--ink2:#1B1D1F;--mut:#6B6E73;--line:#E6E6E3;--gray:#F4F4F2;--f:'Outfit',Inter,sans-serif;font-family:var(--f);color:var(--ink);background:#fff;-webkit-font-smoothing:antialiased}
.m2-w{max-width:1320px;margin:0 auto;padding:0 40px}
.m2 h1,.m2 h2,.m2 h3{margin:0;font-weight:500;letter-spacing:-.035em;line-height:1.02}
.m2 h2{font-size:clamp(2.2rem,4.6vw,4rem)}
.m2-eyebrow{margin:0 0 18px;font-size:.78rem;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--mut)}
.m2-eyebrow.light{color:rgba(255,255,255,.75)}
.m2 .mt-i svg{width:18px;height:18px}
.m2-nav{position:sticky;top:0;z-index:60;background:rgba(255,255,255,.88);backdrop-filter:saturate(160%) blur(14px);border-bottom:1px solid var(--line)}
.m2-nav-in{display:flex;align-items:center;gap:30px;height:76px}
.m2-logo img{height:44px;width:auto;display:block}
.m2-links{display:flex;gap:26px;margin-left:auto}.m2-links a{color:var(--ink);text-decoration:none;font-size:.95rem;font-weight:500;opacity:.75;transition:opacity .2s}.m2-links a:hover{opacity:1}
.m2-mlinks,.m2-show-s{display:none}
.m2-btn{display:inline-flex;align-items:center;gap:10px;padding:16px 26px;border-radius:999px;font-weight:500;font-size:.98rem;text-decoration:none;border:1px solid transparent;cursor:pointer;white-space:nowrap;transition:transform .2s,background .2s,color .2s}
.m2-btn:hover{transform:translateY(-2px)}
.m2-btn.dark{background:var(--ink);color:#fff}.m2-btn.dark:hover{background:#333}
.m2-btn.light{background:#fff;color:var(--ink)}
.m2-btn.ghost{border-color:rgba(255,255,255,.5);color:#fff}.m2-btn.ghost:hover{background:rgba(255,255,255,.12)}
.m2-btn.sm{padding:11px 18px;font-size:.92rem}
.m2-btn .mt-i{transition:transform .2s}.m2-btn:hover .mt-i{transform:translateX(3px)}
.m2-hero{position:relative;height:calc(100vh - 76px);min-height:620px;max-height:960px;color:#fff;overflow:hidden;background:#111}
.ab{--red:#D62B2B;--red-d:#AE1F1F;--ink:#141417;--char:#1B1B1F;--mut:#62646B;--light:#F4F4F5;--line:#E4E4E7;--green:#0E5A3B;background:#fff;color:var(--ink);font-family:'Outfit','Inter',system-ui,sans-serif;padding-bottom:80px;overflow-x:hidden}
.ab *{box-sizing:border-box}.ab svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none}
.ab-w{width:min(1200px,100% - 40px);margin:0 auto}
.ab-nav{position:sticky;top:0;z-index:60;background:rgba(18,18,21,.97);backdrop-filter:blur(8px);color:#fff}
.ab-nav-top{display:flex;align-items:center;gap:28px;height:74px}
.ab-brand{display:flex;align-items:center;gap:12px;color:#fff;text-decoration:none}.ab-brand img{height:58px;width:auto;border-radius:6px}.ab-brand.has-logo .ab-brand-t{display:none}.ab-hero.shop{background-position:center 40%}.ab-svc.n10{grid-template-columns:repeat(5,1fr)}.ab-svc.n12{grid-template-columns:repeat(4,1fr)}
.ab-logo{display:flex;align-items:center;gap:2px;background:var(--red);border-radius:10px;padding:6px 10px;font-weight:800;font-size:1.3rem;letter-spacing:-.02em}.ab-logo i{font-style:normal;font-weight:500;opacity:.85;margin:0 2px}
.ab-brand-t b{display:block;font-size:.95rem;text-transform:uppercase;letter-spacing:.02em}.ab-brand-t small{display:block;font-size:.76rem;color:rgba(255,255,255,.6)}
.ab-nav-info{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font-size:.86rem;margin-left:auto}.ab-nav-info svg{color:var(--red)}.ab-nav-info small{display:block;color:rgba(255,255,255,.55);font-size:.76rem}
.ab-nav-tel{color:#fff;text-decoration:none;text-align:right}.ab-nav-tel small{display:block;font-size:.74rem;color:rgba(255,255,255,.55)}.ab-nav-tel b{font-size:1.2rem;letter-spacing:.01em}
.ab-burger{display:none;border:0;background:rgba(255,255,255,.08);color:#fff;border-radius:8px;padding:8px;cursor:pointer}.ab-burger svg{width:24px;height:24px}
.ab-nav-links{display:flex;justify-content:space-between;border-top:1px solid rgba(255,255,255,.08);height:46px;align-items:center}.ab-nav-links a{color:rgba(255,255,255,.8);text-decoration:none;font-size:.9rem;font-weight:500}.ab-nav-links a:hover{color:#fff}
.ab-menu{display:flex;flex-direction:column;padding:6px 20px 18px}.ab-menu[hidden]{display:none}.ab-menu a{color:#fff;text-decoration:none;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.08)}.ab-menu .ab-btn{margin-top:12px;align-self:flex-start;border:0}
.ab-btn{display:inline-flex;align-items:center;gap:9px;background:var(--red);color:#fff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:8px;border:2px solid var(--red);transition:background .2s}.ab-btn:hover{background:var(--red-d);border-color:var(--red-d)}
.ab-btn.ghost{background:transparent;border-color:rgba(255,255,255,.55)}.ab-btn.ghost:hover{background:#fff;color:var(--ink);border-color:#fff}.ab-btn.ghost.dk{color:var(--ink);border-color:var(--ink)}.ab-btn.ghost.dk:hover{background:var(--ink);color:#fff}
.ab-row{display:flex;flex-wrap:wrap;gap:12px}
.ab-hero{background-size:cover;background-position:center;color:#fff;padding:70px 0 0;position:relative}
.ab-hero:after{content:"";position:absolute;left:0;right:0;bottom:0;height:150px;background:#fff}
.ab-hero-in{position:relative;z-index:1;max-width:1200px}
.ab-hrev{position:absolute;right:0;top:0;width:340px;height:206px;margin:0;padding:20px 22px;border-radius:16px;background:rgba(18,18,21,.55);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);color:#fff;box-shadow:0 20px 50px rgba(0,0,0,.35);display:flex;flex-direction:column}
.ab-hrev-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.ab-hrev-h small{font-size:.74rem;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.65);font-weight:600}
.ab-hrev p{margin:0 0 10px;line-height:1.5;font-size:.98rem;flex:1}.ab-hrev figcaption b{font-size:.9rem;color:#FF8A8A}
.ab-hrev .in{animation:abIn .5s ease both}
@media(max-width:1100px){.ab-hrev{position:static;width:auto;max-width:520px;min-height:0;height:178px;margin-bottom:26px}}
@media(max-width:760px){.ab-hrev{height:190px;padding:16px 18px}.ab-hrev p{font-size:.92rem}}
.ab-kick{color:#FF8A8A;font-weight:600;text-transform:uppercase;letter-spacing:.14em;font-size:.8rem;margin:0 0 14px}
.ab-hero h1{font-size:clamp(2.6rem,6vw,4.6rem);line-height:1;font-weight:800;text-transform:uppercase;letter-spacing:-.01em;margin:0 0 18px}.ab-hero h1 span{display:block;color:var(--red)}
.ab-lead{max-width:560px;font-size:1.08rem;line-height:1.65;color:rgba(255,255,255,.85);margin:0 0 24px}
.ab-bul{list-style:none;padding:0;margin:0 0 30px;display:grid;grid-template-columns:repeat(2,minmax(0,280px));gap:12px 30px}.ab-bul li{display:flex;align-items:center;gap:10px;font-size:.95rem}.ab-bul li>span{width:24px;height:24px;border-radius:50%;background:var(--red);display:grid;place-items:center}.ab-bul svg{width:13px;height:13px;stroke-width:3}
.ab-cards{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:56px}
.ab-card{position:relative;min-height:330px;border-radius:16px;background-size:cover;background-position:center;display:flex;align-items:flex-end;color:#fff;text-decoration:none;overflow:hidden;box-shadow:0 24px 50px rgba(0,0,0,.3);transition:transform .3s}.ab-card:hover{transform:translateY(-6px)}
.ab-card-t{padding:24px}.ab-card h3{font-size:1.3rem;font-weight:800;text-transform:uppercase;margin:0 0 8px}.ab-card p{font-size:.9rem;line-height:1.5;color:rgba(255,255,255,.82);margin:0 0 12px}.ab-card-t>span{display:inline-flex;align-items:center;gap:6px;color:#FF7B7B;font-weight:600;font-size:.9rem}
.ab-sec{padding:96px 0}.ab-sec.tight{padding:40px 0}.ab-light{background:var(--light)}
.ab-h2{font-size:clamp(1.7rem,3.2vw,2.5rem);font-weight:800;text-transform:uppercase;line-height:1.12;margin:0 0 16px}.ab-h2.c{text-align:center;margin-bottom:56px}
.ab-mut{color:var(--mut);line-height:1.7;margin:0 0 24px}
.ab-about{max-width:980px}.ab-about-p p{color:#3F4148;line-height:1.75;margin:0 0 14px}
.ab-why{display:grid;grid-template-columns:1.1fr 1fr;gap:60px;align-items:center}
.ab-feats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.ab-feat{position:relative;aspect-ratio:1/1.05;border-radius:14px;background-size:cover;background-position:center;color:#fff;display:flex;flex-direction:column;justify-content:flex-end;gap:8px;padding:14px;overflow:hidden;box-shadow:0 10px 24px rgba(0,0,0,.12)}.ab-feat span{width:34px;height:34px;border-radius:9px;background:var(--red);display:grid;place-items:center}.ab-feat svg{width:18px;height:18px}.ab-feat b{font-size:.92rem;font-weight:600;line-height:1.3}
.ab-why-pic{position:relative;display:grid;place-items:center}.ab-circle{width:100%;aspect-ratio:4/4.4;border-radius:20px;background-size:cover;background-position:center;box-shadow:0 30px 60px rgba(0,0,0,.18)}.ab-ring{position:absolute;width:min(480px,108%);aspect-ratio:1;border-radius:50%;border:3px solid var(--red);border-left-color:transparent;border-bottom-color:transparent;transform:rotate(20deg)}
.ab-cta{display:grid;grid-template-columns:1fr 1.1fr;border-radius:18px;overflow:hidden;background:var(--green);color:#fff;box-shadow:0 24px 50px rgba(14,90,59,.25)}.ab-cta-img{min-height:300px;background-size:cover;background-position:center}
.ab-cta-t{padding:48px 46px;display:flex;flex-direction:column;justify-content:center}.ab-cta-t h2{font-size:clamp(1.6rem,2.8vw,2.3rem);font-weight:800;text-transform:uppercase;line-height:1.1;margin:0 0 12px}.ab-cta-t p{color:rgba(255,255,255,.85);margin:0 0 22px;line-height:1.6}
.ab-cta-tel{color:#fff;text-decoration:none;font-size:clamp(1.6rem,2.6vw,2.2rem);font-weight:700;letter-spacing:.01em}.ab-cta-tel:hover{text-decoration:underline}
.ab-head{max-width:720px;margin-bottom:34px}
.ab-svc{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.ab-svc-i{background:#fff;border-radius:14px;overflow:hidden;display:flex;flex-direction:column;text-decoration:none;color:var(--ink);box-shadow:0 6px 20px rgba(0,0,0,.06);transition:transform .25s,box-shadow .25s}.ab-svc-i:hover{transform:translateY(-4px);box-shadow:0 16px 34px rgba(0,0,0,.12)}.ab-svc-img{aspect-ratio:4/3;background-size:cover;background-position:center;transition:transform .5s}.ab-svc-i:hover .ab-svc-img{transform:scale(1.05)}.ab-svc-b{position:relative;background:#fff;display:flex;align-items:center;gap:10px;padding:14px 16px;border-top:3px solid var(--red)}.ab-svc-b span{color:var(--red);font-weight:800;font-size:.82rem}.ab-svc-b b{font-size:1rem;font-weight:600;flex:1;line-height:1.25}.ab-svc-b svg{color:var(--red);transition:transform .2s}.ab-svc-i:hover .ab-svc-b svg{transform:translateX(4px)}
.ab-dark{background-size:cover;background-position:center;color:#fff}
.ab-tl{list-style:none;padding:0;margin:0 auto;max-width:760px;position:relative}.ab-tl:before{content:"";position:absolute;left:50%;top:0;bottom:0;width:2px;background:var(--red);transform:translateX(-50%)}
.ab-tl li{position:relative;display:flex;gap:18px;width:50%;padding:0 46px 40px 0;text-align:right;flex-direction:row-reverse}.ab-tl li.r{margin-left:50%;padding:0 0 40px 46px;text-align:left;flex-direction:row}
.ab-tl li>span{position:absolute;right:-21px;top:-4px;width:42px;height:42px;border-radius:50%;background:var(--red);display:grid;place-items:center;font-weight:800;font-size:.9rem;box-shadow:0 0 0 6px rgba(214,43,43,.2)}.ab-tl li.r>span{left:-21px;right:auto}
.ab-tl b{display:block;text-transform:uppercase;font-weight:700;margin-bottom:4px}.ab-tl p{margin:0;color:rgba(255,255,255,.7);font-size:.92rem;line-height:1.5}
.ab-creds{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.ab-cred{background:var(--light);border-radius:16px;padding:26px 22px;border-top:4px solid var(--red);display:flex;flex-direction:column;gap:6px}.ab-cred>span{width:46px;height:46px;border-radius:12px;background:#fff;color:var(--red);display:grid;place-items:center;margin-bottom:8px}.ab-cred>span svg{width:22px;height:22px}.ab-cred small{text-transform:uppercase;letter-spacing:.12em;font-size:.72rem;color:var(--mut);font-weight:600}.ab-cred b{font-size:1.15rem;font-weight:700}.ab-cred p{margin:4px 0 0;color:#4A4C52;line-height:1.55;font-size:.92rem}
.ab-tags{list-style:none;padding:0;margin:8px 0 0;display:flex;flex-wrap:wrap;gap:6px}.ab-tags li{background:#fff;border:1px solid var(--line);border-radius:6px;padding:5px 9px;font-size:.82rem;font-weight:500}
.ab-foot-x{display:flex;flex-wrap:wrap;gap:8px 18px;border-top:1px solid rgba(255,255,255,.1);margin-top:34px;padding-top:20px;font-size:.82rem;color:rgba(255,255,255,.55)}
@media(max-width:980px){.ab-creds{grid-template-columns:1fr 1fr}}@media(max-width:560px){.ab-creds{grid-template-columns:1fr}}
.ab-faq{display:grid;grid-template-columns:.8fr 1.2fr;gap:50px;align-items:start}.ab-faq-h{position:sticky;top:140px}
.ab-faq-l{display:grid;gap:10px}.ab-q{background:#fff;border-radius:12px;border:1px solid var(--line);overflow:hidden}.ab-q[open]{border-color:var(--red)}
.ab-q summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:16px;padding:18px 20px;font-weight:600;font-size:1.02rem}.ab-q summary::-webkit-details-marker{display:none}.ab-q summary span{flex:1}
.ab-q summary i{flex:none;width:30px;height:30px;border-radius:50%;background:#FDECEC;color:var(--red);display:grid;place-items:center;transition:transform .25s}.ab-q summary i svg{width:15px;height:15px;transform:rotate(90deg)}.ab-q[open] summary i{transform:rotate(180deg)}
.ab-q p{margin:0;padding:0 20px 20px;color:#4A4C52;line-height:1.7}
@media(max-width:860px){.ab-faq{grid-template-columns:1fr;gap:24px}.ab-faq-h{position:static}.ab-q summary{padding:16px;font-size:.96rem}.ab-q p{padding:0 16px 16px}}
.ab-what{display:grid;gap:22px}.ab-wr{display:grid;grid-template-columns:1fr 1.15fr;background:var(--light);border-radius:18px;overflow:hidden}.ab-wr.flip .ab-wr-img{order:2}
.ab-wr-img{min-height:320px;background-size:cover;background-position:center}.ab-wr-t{padding:40px 42px;display:flex;flex-direction:column;justify-content:center}
.ab-wr-i{width:48px;height:48px;border-radius:12px;background:var(--red);color:#fff;display:grid;place-items:center;margin-bottom:16px}.ab-wr-i svg{width:24px;height:24px}
.ab-wr h3{font-size:1.5rem;font-weight:800;text-transform:uppercase;margin:0 0 12px}.ab-wr p{color:#44464D;line-height:1.75;margin:0 0 18px}
.ab-link{display:inline-flex;align-items:center;gap:7px;color:var(--red);font-weight:700;text-decoration:none;margin-right:18px}.ab-link:hover{text-decoration:underline}
.ab-also{margin-top:22px;background:#fff;border-radius:14px;padding:18px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}.ab-also b{text-transform:uppercase;font-size:.85rem}.ab-also .ab-tags{margin:0}.ab-also .ab-tags li{background:var(--light);border-color:transparent}
@media(max-width:860px){.ab-wr,.ab-wr.flip{grid-template-columns:1fr}.ab-wr.flip .ab-wr-img{order:0}.ab-wr-img{min-height:220px}.ab-wr-t{padding:26px 22px}.ab-wr h3{font-size:1.25rem}}
.ab-sales{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}.ab-sales-pic{min-height:420px;border-radius:18px;background-size:cover;background-position:center;box-shadow:0 24px 50px rgba(0,0,0,.15)}
.ab-checks{list-style:none;padding:0;margin:0 0 28px;display:grid;gap:12px}.ab-checks li{display:flex;align-items:center;gap:10px;font-weight:500}.ab-checks li>span{width:24px;height:24px;border-radius:50%;background:var(--red);color:#fff;display:grid;place-items:center}.ab-checks svg{width:13px;height:13px;stroke-width:3}
.ab-rev-wrap{display:flex;align-items:center;gap:14px}.ab-revs{flex:1;display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.ab-rev{margin:0;background:#fff;border-radius:16px;padding:26px;display:flex;flex-direction:column;gap:12px;animation:abIn .5s ease both}.ab-rev-h{display:flex;justify-content:space-between;align-items:center}.ab-rev-h b{text-transform:uppercase;font-size:.82rem}.ab-rev-h svg{color:var(--red);fill:var(--red);stroke:none;width:24px;height:24px}.ab-rev blockquote{margin:0;color:#3F4148;line-height:1.6;flex:1}.ab-rev figcaption{font-weight:700;font-size:.92rem;display:flex;align-items:center;gap:10px}.ab-rev figcaption small{display:block;font-weight:500;color:var(--mut);font-size:.78rem}.ab-av{width:38px;height:38px;border-radius:50%;background:#FDECEC;color:var(--red);display:grid;place-items:center;font-weight:800}.ab-stars{display:flex;gap:2px}.ab-stars svg{width:17px;height:17px;fill:#F5B301;stroke:#F5B301}
@keyframes abIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.ab-arr{flex:none;width:44px;height:44px;border-radius:50%;border:1px solid var(--line);background:#fff;color:var(--red);cursor:pointer;display:grid;place-items:center}.ab-arr:not(.n) svg{transform:rotate(180deg)}
.ab-contact{display:grid;grid-template-columns:1fr 1.2fr;gap:50px;align-items:start}.ab-ci{display:grid;gap:18px}.ab-ci>a,.ab-ci>div{display:flex;gap:14px;color:var(--ink);text-decoration:none}.ab-ci svg{color:var(--red);margin-top:3px}.ab-ci small{display:block;color:var(--mut);font-size:.8rem}.ab-ci span{font-weight:600}
.ab-hours{margin-top:6px;min-width:260px}.ab-hours>div{display:flex;justify-content:space-between;gap:20px;font-weight:400;font-size:.92rem;padding:3px 0}.ab-hours .today{color:var(--red);font-weight:600}
.ab-map{border-radius:18px;overflow:hidden;min-height:420px;background:var(--light)}.ab-map iframe{width:100%;height:100%;min-height:420px;border:0;display:block}
.ab-foot{background:var(--char);color:#fff;padding:56px 0 30px}.ab-foot-in{display:grid;grid-template-columns:1.4fr 1fr 1fr;gap:40px}.ab-foot-in>div{display:flex;flex-direction:column;gap:9px;font-size:.92rem}.ab-foot-in b{text-transform:uppercase;font-size:.85rem;margin-bottom:6px}.ab-foot-in a,.ab-foot-in span,.ab-foot-in small{color:rgba(255,255,255,.65);text-decoration:none}.ab-foot-in a:hover{color:#fff}.ab-foot .ab-brand{margin-bottom:10px}
@media(max-width:980px){.ab-svc.n10,.ab-svc.n12{grid-template-columns:repeat(2,1fr)}.ab-hide-s{display:none}.ab-nav-links{display:none}.ab-burger{display:block}.ab-nav-tel{margin-left:auto}.ab-svc{grid-template-columns:repeat(2,1fr)}.ab-why{grid-template-columns:1fr}.ab-why-pic{order:-1}}
@media(max-width:760px){.ab-nav-top{height:64px;gap:12px}.ab-brand img{height:46px}.ab-brand-t small{display:none}.ab-brand-t b{font-size:.8rem}.ab-nav-tel small{display:none}.ab-nav-tel b{font-size:.95rem}
.ab-hero{padding-top:44px}.ab-hero:after{height:90px}.ab-bul{grid-template-columns:1fr}.ab-cards{grid-template-columns:1fr;gap:14px;margin-top:40px}.ab-card{min-height:240px}
.ab-sec{padding:64px 0}.ab-feats{grid-template-columns:1fr 1fr}.ab-circle{aspect-ratio:4/3}.ab-feats{grid-template-columns:1fr 1fr}
.ab-cta{grid-template-columns:1fr}.ab-cta-img{min-height:200px}.ab-cta-t{padding:30px 24px}
.ab-svc,.ab-svc.n10,.ab-svc.n12{grid-template-columns:1fr 1fr;gap:10px}.ab-svc-b{padding:10px 12px;gap:6px}.ab-svc-b b{font-size:.88rem}.ab-svc-b svg{display:none}
.ab-tl:before{left:20px}.ab-tl li,.ab-tl li.r{width:auto;margin-left:0;padding:0 0 30px 64px;text-align:left;flex-direction:row}.ab-tl li>span,.ab-tl li.r>span{left:0;right:auto}
.ab-sales{grid-template-columns:1fr;gap:30px}.ab-sales-pic{min-height:260px;order:-1}.ab-revs{grid-template-columns:1fr}.ab-arr{display:none}
.ab-contact{grid-template-columns:1fr;gap:30px}.ab-map,.ab-map iframe{min-height:300px}.ab-foot-in{grid-template-columns:1fr 1fr}.ab-foot-in>div:first-child{grid-column:1/-1}}
.st{--g:#0C6B33;--g-d:#06401F;--lime:#B9E26B;--lime-d:#A3D14E;--ink:#0F1A12;--mut:#5E6B62;--soft:#F3F6F1;--line:#E3E9E2;background:#fff;color:var(--ink);font-family:'Outfit','Inter',system-ui,sans-serif;padding-bottom:80px;overflow-x:hidden}
.st *{box-sizing:border-box}.st svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none}
.st-w{width:min(1200px,100% - 40px);margin:0 auto}
.st h1,.st h2,.st h3{font-family:'Outfit',sans-serif;letter-spacing:-.02em;margin:0}
.st-nav{position:sticky;top:0;z-index:60;box-shadow:0 1px 0 var(--line)}
.st-strip{background:var(--g);color:#E3F2DE;font-size:.82rem}.st-strip-in{display:flex;align-items:center;gap:26px;min-height:38px;flex-wrap:wrap}.st-strip span,.st-strip a{display:inline-flex;align-items:center;gap:7px;color:inherit;text-decoration:none}.st-strip svg{width:14px;height:14px;color:var(--lime)}.st-strip-r{margin-left:auto;gap:16px!important}
.st-bar{background:rgba(255,255,255,.97);backdrop-filter:blur(8px)}.st-bar-in{display:flex;align-items:center;gap:30px;height:76px}
.st-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink);font-weight:700;font-size:1.3rem;letter-spacing:-.02em}.st-brand img{height:46px;width:auto}
.st-mark{width:42px;height:42px;border-radius:50%;background:var(--g);color:#fff;display:grid;place-items:center}.st-mark svg{width:22px;height:22px}.st-mark.sm{width:38px;height:38px;background:var(--soft);color:var(--g)}
.st-links{display:flex;gap:30px;margin-left:auto}.st-links a{color:var(--ink);text-decoration:none;font-weight:500;font-size:.98rem}.st-links a:hover{color:var(--g)}
.st-call{display:flex;align-items:center;gap:12px;text-decoration:none;color:var(--ink);margin-left:10px}.st-call-i{width:46px;height:46px;border-radius:50%;background:var(--lime);display:grid;place-items:center;color:var(--g-d)}.st-call small{display:block;font-size:.78rem;color:var(--mut)}.st-call b{font-size:1.12rem}
.st-burger{display:none;margin-left:auto;border:0;background:var(--soft);border-radius:10px;padding:9px;cursor:pointer;color:var(--ink)}.st-burger svg{width:24px;height:24px}
.st-menu{display:flex;flex-direction:column;background:#fff;padding:10px 20px 18px;border-top:1px solid var(--line)}.st-menu[hidden]{display:none}.st-menu a{color:var(--ink);text-decoration:none;padding:12px 0;font-weight:500;border-bottom:1px solid var(--line)}.st-menu .st-btn{margin-top:12px;border:0;align-self:flex-start}
.st-btn{display:inline-flex;align-items:stretch;gap:6px;text-decoration:none;font-weight:600;color:var(--g-d)}.st-btn span{background:var(--lime);padding:13px 22px;border-radius:8px;transition:background .2s}.st-btn i{width:46px;background:var(--lime);border-radius:8px;display:grid;place-items:center;transition:transform .2s,background .2s}.st-btn:hover span,.st-btn:hover i{background:var(--lime-d)}.st-btn:hover i{transform:rotate(45deg)}.st-btn.sm span{padding:11px 20px}.st-btn.sm i{width:42px}
.st-kick{display:flex;align-items:center;gap:10px;color:var(--g);font-weight:600;font-size:.9rem;margin:0 0 14px}.st-kick i{width:26px;height:2px;background:linear-gradient(90deg,var(--g) 0 60%,transparent 60% 70%,var(--g) 70%);display:block}
.st-hero{position:relative;background:radial-gradient(circle at 12% 30%,rgba(185,226,107,.18),transparent 40%),radial-gradient(circle at 88% 85%,rgba(12,107,51,.08),transparent 45%),#FAFCF8;overflow:hidden}
.st-hero:before{content:"";position:absolute;inset:0;opacity:.35;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'%3E%3Cg fill='none' stroke='%23CFE3C6' stroke-width='1.2'%3E%3Cpath d='M30 120c0-30 18-52 50-56-3 33-22 52-50 56z'/%3E%3Cpath d='M30 120 66 80'/%3E%3Ccircle cx='125' cy='35' r='14'/%3E%3Ccircle cx='125' cy='35' r='24'/%3E%3C/g%3E%3C/svg%3E")}
.st-hero-in{position:relative;display:grid;grid-template-columns:1.05fr 1fr;gap:50px;align-items:center;padding:60px 0 70px}
.st-hero h1{font-size:clamp(2.6rem,5.2vw,4.4rem);line-height:1.04;font-weight:700;margin-bottom:18px}.st-hero h1 span{color:var(--g)}
.st-hero-t>p:not(.st-kick){font-size:1.08rem;line-height:1.65;color:var(--mut);max-width:520px;margin:0 0 28px}
.st-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.st-mini{display:flex;gap:16px;margin-top:38px}.st-mini-card{position:relative;width:190px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;box-shadow:0 10px 30px rgba(12,60,30,.06)}.st-mini-card b{font-size:.98rem;margin-top:6px}.st-mini-card>a{color:var(--g);font-weight:600;text-decoration:none;font-size:.95rem}.st-mini-go{margin-top:6px;width:34px;height:34px;border-radius:50%;border:1px solid var(--ink);display:grid;place-items:center;color:var(--ink)!important}.st-mini-go svg{width:15px;height:15px}
.st-mini-pic{width:150px;border-radius:18px;background-size:cover;background-position:center}
.st-hero-pic{position:relative}.st-hero-img.trailer{aspect-ratio:1448/1086;border-radius:28px;background-position:center}.st-hero-img.sharp{filter:url(#st-sharp) contrast(1.06) saturate(1.08)}.st-hero-img{aspect-ratio:4/4.6;border-radius:220px 220px 28px 28px;background-size:cover;background-position:center;box-shadow:0 30px 60px rgba(6,58,28,.18)}
.st-badge{position:absolute;left:-26px;bottom:44px;display:flex;align-items:center;gap:12px;background:#fff;border-radius:16px;padding:14px 18px 14px 14px;box-shadow:0 16px 40px rgba(6,58,28,.16)}.st-badge b{display:block}.st-badge small{color:var(--mut)}
.st-roll-s{padding:34px 0 30px;border-bottom:1px solid var(--line)}.st-roll-h{text-align:center;font-weight:600;font-size:1.05rem;margin:0 0 18px}
.st-roll{overflow:hidden;-webkit-mask:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);mask:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)}
.st-roll-t{display:flex;width:max-content;animation:stRoll 28s linear infinite}.st-roll-t span{display:inline-flex;align-items:center;gap:10px;margin-right:56px;font-weight:600;font-size:1.25rem;color:#56645A;white-space:nowrap}.st-roll-t svg{width:24px;height:24px;color:var(--g)}
@keyframes stRoll{to{transform:translateX(-50%)}}
.st-sec{padding:100px 0}.st-soft{background:var(--soft)}
.st-about{position:relative;overflow:hidden;padding:120px 0 220px}
.st-about-in{position:relative;z-index:2;max-width:760px;text-align:center;display:flex;flex-direction:column;align-items:center}
.st-big{font-size:clamp(1.6rem,3vw,2.4rem);line-height:1.3;font-weight:600;margin-bottom:20px}.st-big span{color:#A5ADA7}
.st-about-p{color:var(--mut);line-height:1.7;margin:0 0 26px}
.st-about-tiles{position:absolute;inset:0;pointer-events:none}.st-tile{position:absolute;border-radius:16px;background-size:cover;background-position:center;box-shadow:0 14px 34px rgba(6,58,28,.14)}
.st-tile.t0{width:130px;height:150px;left:4%;top:90px}.st-tile.t1{width:120px;height:130px;left:14%;bottom:60px}.st-tile.t2{width:130px;height:140px;left:31%;bottom:24px}.st-tile.t3{width:120px;height:130px;right:31%;bottom:30px}.st-tile.t4{width:130px;height:150px;right:14%;bottom:70px}.st-tile.t5{width:130px;height:150px;right:4%;top:80px}
.st-head{text-align:center;display:flex;flex-direction:column;align-items:center;margin-bottom:44px}.st-head h2,.st-contact h2,.st-cta h2{font-size:clamp(1.9rem,3.4vw,2.8rem);font-weight:700;line-height:1.12}
.st-hero{background-size:cover;background-position:center;color:#fff;padding-bottom:40px}.st-hero:before{display:none}
.st-hinfo{position:relative;padding-top:22px}.st-hinfo-in{display:flex;flex-wrap:wrap;gap:10px}.st-hinfo-in>*{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:8px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(8px);color:#fff;text-decoration:none;font-size:.86rem}.st-hinfo-in svg{width:15px;height:15px;color:var(--lime)}.st-hinfo-in .st-strip-r{margin-left:auto}
.st-hero .st-hero-in{padding:46px 0 40px}
.st-kick.light{color:var(--lime)}.st-kick.light svg{width:18px;height:18px}
.st-hero h1{color:#fff}.st-hero h1 span{color:var(--lime)}
.st-badge{color:var(--ink)}.st-hero .st-hero-t>p.st-lead{font-size:1.1rem;line-height:1.65;color:rgba(255,255,255,.88);max-width:540px;margin:0 0 28px}
.st-ghost.light{color:#fff;border-color:rgba(255,255,255,.6)}.st-ghost.light:hover{background:#fff;color:var(--g-d)}
.st-hero .st-trust li{color:#fff}.st-hero .st-trust li>span{background:var(--lime);color:var(--g-d)}
.st-hero .st-hero-img{box-shadow:0 30px 70px rgba(0,0,0,.45);border:4px solid rgba(255,255,255,.12)}
.st-hero .st-finder{margin-top:0;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;align-items:center;gap:18px;padding:14px 18px;box-shadow:none}.st-hero .st-finder small{color:#fff;margin:0;flex:none;font-size:.92rem}
.st-hero .st-chips button{background:rgba(255,255,255,.95);border-color:transparent}.st-hero .st-chips button:hover{background:var(--lime);color:var(--g-d)}
@media(max-width:760px){.st-hinfo{padding-top:16px}.st-hinfo-in>*{font-size:.78rem;padding:7px 11px}.st-hinfo-in .st-hide-s{display:none}.st-hinfo-in .st-strip-r{margin-left:0}
.st-hero .st-hero-in{padding:26px 0 30px}.st-hero .st-finder{flex-direction:column;align-items:flex-start;gap:10px}}
.st-mark.img{background:#fff;border:1px solid var(--line);overflow:hidden}.st-mark.img img{width:30px;height:30px;object-fit:contain}
.st-ghost.lg{display:inline-flex;align-items:center;gap:8px;padding:12px 18px;font-size:.98rem}
.st-trust{list-style:none;padding:0;margin:22px 0 0;display:flex;flex-wrap:wrap;gap:10px 22px}.st-trust li{display:flex;align-items:center;gap:8px;font-weight:600;font-size:.92rem}.st-trust li>span{width:22px;height:22px;border-radius:50%;background:var(--g);color:#fff;display:grid;place-items:center}.st-trust svg{width:13px;height:13px;stroke-width:3}
.st-finder{margin-top:30px;background:#fff;border:1px solid var(--line);border-radius:18px;padding:16px 18px;box-shadow:0 10px 30px rgba(12,60,30,.06)}.st-finder small{display:block;font-weight:600;color:var(--mut);margin-bottom:10px}
.st-chips{display:flex;flex-wrap:wrap;gap:8px}.st-chips button{font:inherit;font-size:.86rem;font-weight:500;border:1px solid var(--line);background:var(--soft);color:var(--ink);border-radius:8px;padding:7px 12px;cursor:pointer;transition:background .2s,color .2s,border-color .2s}.st-chips button:hover{background:var(--g);color:#fff;border-color:var(--g)}
.st-tabs{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:-14px 0 30px}.st-tabs button{font:inherit;font-weight:600;font-size:.92rem;border:1px solid var(--line);background:#fff;color:var(--ink);border-radius:8px;padding:10px 16px;cursor:pointer}.st-tabs button.on{background:var(--g);border-color:var(--g);color:#fff}
.st-card{cursor:pointer;outline:none}.st-card[hidden]{display:none}.st-card:focus-visible{box-shadow:0 0 0 3px var(--lime)}.st-card:hover .st-sq{background:var(--lime);border-color:var(--lime)}
.st-head .st-mut{margin:12px 0 0}
.st-sheet{position:fixed;inset:0;z-index:300;background:rgba(6,30,15,.6);backdrop-filter:blur(6px);display:grid;place-items:center;padding:20px}.st-sheet[hidden]{display:none}
.st-sheet-card{position:relative;width:min(860px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:22px;display:grid;grid-template-columns:1fr 1fr}
.st-sheet-img{min-height:360px;background-size:cover;background-position:center}.st-sheet-b{padding:38px 34px;display:flex;flex-direction:column;align-items:flex-start}.st-sheet-b h3{font-size:1.9rem;font-weight:700;margin:4px 0 12px}.st-sheet-b p{color:var(--mut);line-height:1.7;margin:0 0 20px}.st-sheet-b .st-note{color:var(--g);font-weight:600;margin-top:-8px}
.st-sheet-b button.st-btn{border:0;background:none;padding:0;font:inherit;font-weight:600;cursor:pointer}
.st-x{position:absolute;top:12px;right:12px;z-index:2;width:40px;height:40px;border-radius:50%;border:0;background:#fff;font-size:1.6rem;line-height:1;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.15)}
.st-area{display:grid;grid-template-columns:1fr 1.1fr;gap:50px;align-items:center}.st-area h2{font-size:clamp(1.9rem,3.4vw,2.8rem);font-weight:700;line-height:1.12;margin-bottom:14px}
.st-counties{display:grid;gap:12px;margin-bottom:20px}.st-counties>div{display:flex;align-items:center;gap:14px;background:var(--soft);border-radius:14px;padding:14px 16px}.st-counties b{display:block}.st-counties small{color:var(--mut)}.st-counties .st-li-i{background:#fff}
.st-mut.sm{font-size:.95rem}.st-mut a{color:var(--g);font-weight:600}
.st-area-map{border-radius:22px;overflow:hidden;min-height:420px;background:var(--soft)}.st-area-map iframe{width:100%;height:100%;min-height:420px;border:0;display:block}
.st-row.c{justify-content:center}
@media(max-width:760px){.st-sheet{padding:0;align-items:end}.st-sheet-card{grid-template-columns:1fr;border-radius:22px 22px 0 0;max-height:92vh}.st-sheet-img{min-height:220px}.st-sheet-b{padding:24px 20px 30px}.st-sheet-b h3{font-size:1.6rem}
.st-tabs{justify-content:flex-start;flex-wrap:nowrap;overflow-x:auto;margin:-10px -20px 22px;padding:0 20px;scrollbar-width:none}.st-tabs::-webkit-scrollbar{display:none}.st-tabs button{flex:none}
.st-area{grid-template-columns:1fr;gap:30px}.st-area-map,.st-area-map iframe{min-height:300px}.st-finder{padding:14px}.st-ghost.lg{padding:11px 14px}}
.st-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}.st-cards.c3{grid-template-columns:repeat(3,1fr)}.st-more{text-align:center;font-size:clamp(1.6rem,2.6vw,2.2rem);font-weight:700;margin:44px 0 0;color:var(--ink)}.st-more a{display:block;margin-top:8px;font-size:1rem;font-weight:600;color:var(--g)}
.st-card{background:#fff;border-radius:18px;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 10px 30px rgba(6,58,28,.05);transition:transform .3s,box-shadow .3s}.st-card:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(6,58,28,.1)}
.st-card-img{aspect-ratio:4/3.3;background-size:cover;background-position:center;margin:10px 10px 0;border-radius:12px}
.st-card-b{padding:18px 18px 20px;display:flex;flex-direction:column;flex:1}.st-tag{align-self:flex-start;background:var(--g);color:#fff;font-size:.72rem;font-weight:600;padding:4px 10px;border-radius:5px;margin-bottom:12px}.st-card h3{font-size:1.2rem;font-weight:700;margin-bottom:8px}.st-card p{color:var(--mut);font-size:.92rem;line-height:1.55;margin:0 0 18px;flex:1}
.st-ghost{border:1px solid var(--ink);border-radius:8px;padding:9px 16px;color:var(--ink);text-decoration:none;font-weight:600;font-size:.88rem}.st-ghost:hover{background:var(--ink);color:#fff}
.st-sq{width:40px;height:40px;border-radius:8px;border:1px solid var(--ink);display:grid;place-items:center;color:var(--ink)}.st-sq.light{border:0;background:var(--lime);color:var(--g-d);width:46px;height:46px}
.st-band{background-size:cover;background-position:center;color:#fff;padding:70px 0}.st-band-in{display:flex;align-items:center;justify-content:space-between;gap:40px;flex-wrap:wrap}.st-band h2{font-size:clamp(1.8rem,3vw,2.5rem);font-weight:700;line-height:1.1}
.st-facts{display:flex;gap:56px;flex-wrap:wrap}.st-facts b{display:block;font-size:clamp(1.6rem,2.6vw,2.3rem);font-weight:700;color:var(--lime);letter-spacing:-.02em}.st-facts span{color:rgba(255,255,255,.8);font-size:.95rem}
.st-contact{display:grid;grid-template-columns:1fr 1.05fr;gap:60px;align-items:start}.st-contact-t h2{margin-bottom:14px}.st-mut{color:var(--mut);line-height:1.65;margin:0 0 26px}
.st-li{display:flex;align-items:center;gap:14px;text-decoration:none;color:var(--ink);margin-bottom:18px}.st-li-i{width:48px;height:48px;border-radius:50%;background:var(--soft);display:grid;place-items:center;color:var(--g)}.st-li small{display:block;color:var(--mut);font-size:.8rem}.st-li span:last-child{font-weight:600}
.st-hours{margin-top:10px;border-top:1px solid var(--line)}.st-hours>div{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line);font-size:.94rem}.st-hours>div span:last-child{color:var(--mut)}.st-hours .today{color:var(--g);font-weight:600}.st-hours .today span:last-child{color:var(--g)}
.st-form{background:var(--g);color:#fff;border-radius:22px;padding:34px;display:flex;flex-direction:column;gap:14px;box-shadow:0 24px 50px rgba(6,58,28,.2)}.st-form h3{font-size:1.35rem;font-weight:700;margin-bottom:4px}
.st-form label{display:flex;flex-direction:column;gap:6px;font-size:.84rem;font-weight:500}.st-f2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.st-form input,.st-form select,.st-form textarea{font:inherit;font-size:.95rem;border:0;border-radius:8px;padding:12px 14px;background:#fff;color:var(--ink);width:100%}.st-form textarea{resize:vertical}
.st-submit{flex:1;border:0;border-radius:8px;background:var(--lime);color:var(--g-d);font:inherit;font-weight:700;padding:13px;cursor:pointer}.st-submit:hover{background:var(--lime-d)}.st-form-note{margin:0;background:rgba(255,255,255,.12);border-radius:8px;padding:12px 14px;font-size:.9rem}
.st-revs{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}.st-rev{margin:0;background:#fff;border-radius:18px;padding:28px}.st-stars{display:flex;gap:2px;color:#E8B400;margin-bottom:12px}.st-stars svg{fill:#F5C518;stroke:#F5C518}.st-rev blockquote{margin:0 0 14px;line-height:1.6}.st-rev figcaption{font-weight:700}
.st-cta{text-align:center}.st-mosaic{position:relative;height:230px;max-width:900px;margin:0 auto 10px}.st-m{position:absolute;border-radius:12px;background-size:cover;background-position:center;box-shadow:0 10px 26px rgba(6,58,28,.14)}
.st-m.m0{width:84px;height:100px;left:0;top:110px}.st-m.m1{width:90px;height:100px;left:12%;top:40px}.st-m.m2{width:96px;height:110px;left:27%;top:90px}.st-m.m3{width:100px;height:110px;left:40%;top:0}.st-m.m4{width:96px;height:110px;right:40%;top:120px;display:none}.st-m.m5{width:96px;height:100px;right:24%;top:30px}.st-m.m6{width:90px;height:110px;right:11%;top:110px}.st-m.m7{width:84px;height:100px;right:0;top:20px}
.st-cta-t{max-width:620px;margin:0 auto;display:flex;flex-direction:column;align-items:center}.st-cta-t h2{margin-bottom:14px}
.st-foot{background:var(--soft);padding:70px 0 26px;border-top:1px solid var(--line)}.st-foot-in{display:grid;grid-template-columns:1.4fr 1fr 1fr 1.2fr;gap:40px}.st-foot-in>div{display:flex;flex-direction:column;gap:10px;font-size:.92rem}.st-foot-in b{font-size:1rem;margin-bottom:4px}.st-foot-in a,.st-foot-in span{color:var(--mut);text-decoration:none}.st-foot-in a:hover{color:var(--g)}.st-foot-b p{color:var(--mut);line-height:1.6;margin:6px 0 0}
.st-foot-c{border-top:1px solid var(--line);margin-top:40px;padding-top:20px;font-size:.85rem;color:var(--mut)}
@media(max-width:1060px){.st-links{display:none}.st-burger{display:block}.st-call{margin-left:auto}.st-cards,.st-cards.c3{grid-template-columns:repeat(2,1fr)}}
@media(max-width:760px){
.st-hide-s,.st-strip-r{display:none!important}.st-strip-in{min-height:34px;gap:14px;font-size:.76rem}.st-bar-in{height:66px;gap:12px}.st-brand{font-size:1.1rem}.st-call b,.st-call small{display:none}.st-call-i{width:42px;height:42px}.st-burger{margin-left:0}
.st-hero-in{grid-template-columns:1fr;gap:34px;padding:36px 0 46px}.st-hero-pic{order:-1}.st-hero-img{aspect-ratio:4/3.6;border-radius:160px 160px 24px 24px}.st-badge{left:12px;bottom:14px;padding:10px 14px 10px 10px}.st-hero-img.trailer+.st-badge{bottom:-22px;left:auto;right:12px}.st-hero-in{row-gap:44px}.st-badge .st-mark{width:36px;height:36px}
.st-mini{margin-top:28px}.st-mini-card{flex:1;width:auto}.st-mini-pic{width:42%}
.st-sec{padding:70px 0}.st-about{padding:60px 0 70px}.st-about-tiles{position:static;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;width:min(1200px,100% - 40px);margin:0 auto 34px}.st-tile{position:static!important;width:auto!important;height:110px!important}.st-tile:nth-child(n+4){display:none}
.st-cards,.st-cards.c3{grid-template-columns:1fr}.st-card-img{aspect-ratio:16/10}.st-hero .st-kick i{display:none}.st-band-in{flex-direction:column;align-items:flex-start}.st-facts{gap:26px}.st-contact{grid-template-columns:1fr;gap:36px}.st-form{padding:24px 20px}.st-f2{grid-template-columns:1fr}
.st-mosaic{height:120px}.st-m{width:64px!important;height:72px!important}.st-m.m0{top:44px}.st-m.m1{top:6px}.st-m.m2{top:40px}.st-m.m3{top:0}.st-m.m5{top:10px}.st-m.m6{top:46px}.st-m.m7{top:4px}
.st-foot-in{grid-template-columns:1fr 1fr;gap:28px}.st-foot-b{grid-column:1/-1}
}
.hc{--blue:#1F6BEB;--blue-d:#1556C4;--ink:#0E1420;--mut:#6B7280;--bg:#F1F2F4;--card:#fff;--line:#E5E7EB;background:var(--bg);color:var(--ink);font-family:'Inter',system-ui,sans-serif;min-height:100vh;padding-bottom:90px}
.hc *{box-sizing:border-box}.hc svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none}
.hc-w{width:min(1240px,100% - 32px);margin:0 auto}
.hc-nav{position:sticky;top:0;z-index:50;padding:12px 0 0;background:linear-gradient(var(--bg) 70%,rgba(241,242,244,0))}
.hc-bar{display:flex;align-items:center;gap:24px;background:#0B0F17;color:#fff;border-radius:18px;padding:10px 10px 10px 22px}
.hc-brand{display:flex;align-items:center;gap:10px;color:#fff;text-decoration:none;font-weight:700;letter-spacing:-.01em;font-size:1.05rem;text-transform:uppercase}.hc-brand img{height:34px;width:auto;border-radius:6px;background:#fff}
.hc-links{display:flex;gap:26px;margin-left:auto}.hc-links a{color:rgba(255,255,255,.82);text-decoration:none;font-size:.92rem}.hc-links a:hover{color:#fff}
.hc-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--blue);color:#fff;text-decoration:none;font-weight:600;font-size:.95rem;padding:13px 24px;border-radius:999px;border:0;cursor:pointer;transition:background .2s,transform .2s}.hc-btn:hover{background:var(--blue-d);transform:translateY(-1px)}.hc-btn.sm{padding:10px 20px;font-size:.88rem}
.hc-burger{display:none;margin-left:auto;background:transparent;border:0;color:#fff;padding:8px;cursor:pointer}.hc-burger svg{width:24px;height:24px}
.hc-menu{display:flex;flex-direction:column;gap:4px;background:#0B0F17;border-radius:18px;margin-top:8px;padding:12px}.hc-menu[hidden]{display:none}.hc-menu a{color:#fff;text-decoration:none;padding:12px 10px;font-size:1rem}.hc-menu .hc-btn{margin-top:6px;color:#fff}
.hc-hero-s{padding-top:14px;position:relative}
.hc-hero{height:min(640px,calc(100vh - 110px));min-height:500px;border-radius:24px;background-size:cover;background-position:center 30%}
.hc-hero-in{position:absolute;inset:14px 16px 0;width:min(1240px,100% - 32px);margin:0 auto;display:flex;align-items:flex-end;justify-content:space-between;gap:30px;padding:0 48px 48px;color:#fff;pointer-events:none}.hc-hero-in>*{pointer-events:auto}
.hc-hero-t{max-width:560px}.hc-hero h1,.hc-hero-t h1{font-size:clamp(2.4rem,5.4vw,4.4rem);line-height:1.02;letter-spacing:-.035em;font-weight:500;margin:0 0 16px}
.hc-hero-t p{font-size:1.05rem;line-height:1.6;color:rgba(255,255,255,.86);margin:0 0 26px;max-width:440px}
.hc-hero-cta{display:flex;align-items:center;gap:22px;flex-wrap:wrap}.hc-link{color:var(--ink);font-weight:600;text-decoration:underline;text-underline-offset:4px;font-size:.95rem}.hc-link.light{color:#fff}
.hc-hero-rev{width:290px;max-width:100%;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.25);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-radius:18px;padding:16px 18px}.hc-hero-rev p{margin:8px 0 6px;font-size:.9rem;line-height:1.45;min-height:5.8em}.hc-hero-rev .in{animation:hcIn .5s ease both}.hc-hero-rev small{color:rgba(255,255,255,.75)}
.hc-open{display:flex;align-items:center;gap:8px;font-size:.8rem;text-transform:uppercase;letter-spacing:.12em}.hc-hero-rev .hc-open+p{font-size:1.4rem;font-weight:600;margin:6px 0 2px}
.hc-stars{display:flex;gap:2px;color:#FBBF24}.hc-stars svg{width:16px;height:16px;fill:#FBBF24;stroke:#FBBF24}
.hc-sec{padding:14px 0 0}.hc-sec.tight{padding-top:14px}
.hc-card{background:var(--card);border-radius:22px;padding:40px}
.hc-chip{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);border-radius:999px;padding:6px 13px;font-size:.78rem;font-weight:500;margin-bottom:18px;background:#fff;color:var(--ink)}.hc-chip svg{width:14px;height:14px}.hc-chip.on{background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.3);color:#fff}
.hc h2{font-size:clamp(1.8rem,3.2vw,2.6rem);line-height:1.12;letter-spacing:-.03em;font-weight:500;margin:0 0 14px}
.hc-mut{color:var(--mut);line-height:1.65;margin:0}
.hc-about{display:grid;grid-template-columns:1fr 1fr;gap:14px}.hc-about-t{display:flex;flex-direction:column;align-items:flex-start}
.hc-ticks{list-style:none;padding:0;margin:22px 0 28px;display:grid;gap:12px}.hc-ticks li{display:flex;align-items:center;gap:10px;font-weight:500;font-size:.95rem}.hc-ticks svg{color:#fff;fill:var(--blue);stroke:#fff;width:20px;height:20px}
.hc-about-pic{border-radius:22px;background-size:cover;background-position:center;min-height:460px}
.hc-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.hc-stat{display:flex;flex-direction:column;justify-content:space-between;gap:40px;padding:30px}.hc-stat>b{font-size:clamp(1.8rem,3vw,2.5rem);font-weight:500;letter-spacing:-.03em}.hc-stat strong{display:block;margin-bottom:8px;font-weight:600}.hc-stat p{font-size:.9rem}
.hc-head{margin-bottom:14px}.hc-head h2{max-width:720px}.hc-head p{max-width:640px}
.hc-svcs{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.hc-svcs.n1{grid-template-columns:1fr}.hc-svcs.n2{grid-template-columns:1fr 1fr}
.hc-svc{position:relative;min-height:400px;border-radius:22px;background-size:cover;background-position:center;display:flex;align-items:flex-end;color:#fff;overflow:hidden}
.hc-svc-t{padding:26px}.hc-svc h3{font-size:1.4rem;font-weight:600;letter-spacing:-.02em;margin:0 0 8px}.hc-svc p{font-size:.92rem;line-height:1.55;color:rgba(255,255,255,.85);margin:0 0 18px}
.hc-blue{background:var(--blue);color:#fff;border-radius:22px;padding:48px;display:grid;grid-template-columns:1fr 1.25fr;gap:48px;align-items:center}
.hc-blue-h p{color:rgba(255,255,255,.82);line-height:1.6;margin:0}
.hc-steps{display:grid;grid-template-columns:1fr 1fr;gap:34px 30px}.hc-step{display:flex;gap:16px}.hc-step>span{font-size:2.1rem;font-weight:300;letter-spacing:-.03em;line-height:1}.hc-step b{display:block;font-size:1.08rem;margin:2px 0 6px}.hc-step p{margin:0;color:rgba(255,255,255,.82);font-size:.92rem;line-height:1.55}
.hc-rgrid{display:grid;grid-template-columns:.8fr 1.2fr;gap:14px}.hc-rhead{display:flex;flex-direction:column;align-items:flex-start}
.hc-rctl{display:flex;gap:10px;margin-top:auto;padding-top:26px}.hc-rarr{width:48px;height:48px;border-radius:50%;border:1px solid var(--line);background:#fff;display:grid;place-items:center;cursor:pointer;color:var(--ink);transition:background .2s,color .2s}.hc-rarr:hover{background:var(--blue);color:#fff;border-color:var(--blue)}.hc-rarr.back svg{transform:rotate(180deg)}
.hc-rshow{margin:0;display:flex;flex-direction:column;gap:20px;min-height:380px}
.hc-rshow blockquote{margin:0;font-size:clamp(1.1rem,1.9vw,1.45rem);line-height:1.5;letter-spacing:-.01em;flex:1}
.hc-rshow .in{animation:hcIn .6s ease both}@keyframes hcIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.hc-rshow figcaption{display:flex;align-items:center;gap:12px}.hc-rshow figcaption b{display:block}.hc-rshow figcaption small{color:var(--mut)}
.hc-av.lg{width:46px;height:46px;font-size:1.1rem}
.hc-fb{display:inline-flex;align-items:center;gap:8px;font-size:.85rem;font-weight:600;color:var(--ink)}.hc-fb.light{color:#fff}.hc-fb-i{width:22px;height:22px;border-radius:50%;background:#1877F2;color:#fff;display:grid;place-items:center;font:700 .85rem/1 Arial,sans-serif}
.hc-rfoot{display:flex;align-items:center;gap:18px}.hc-rdots{display:flex;gap:6px;flex-wrap:wrap}.hc-rdots button{width:9px;height:9px;border-radius:50%;border:0;padding:0;background:#D1D5DB;cursor:pointer;transition:background .2s,width .2s}.hc-rdots button.on{background:var(--blue);width:24px;border-radius:5px}
.hc-rtrack{flex:1;height:3px;background:#EEF0F3;border-radius:2px;overflow:hidden}.hc-rbar{display:block;height:100%;width:100%;background:var(--blue);transform-origin:left;animation:hcBar 3s linear both}@keyframes hcBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@media(max-width:980px){.hc-rgrid{grid-template-columns:1fr}.hc-rshow{min-height:470px}.hc-rctl{padding-top:16px}}
.hc-revs{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}.hc-rev{margin:0;padding:30px;display:flex;flex-direction:column;gap:14px}.hc-rev blockquote{margin:0;line-height:1.6;flex:1}.hc-rev figcaption{display:flex;align-items:center;gap:10px;font-weight:600}
.hc-av{width:36px;height:36px;border-radius:50%;background:#E8F0FE;color:var(--blue);display:grid;place-items:center;font-weight:700}
.hc-contact{display:grid;grid-template-columns:1fr 1.1fr;gap:14px}.hc-ct{display:flex;flex-direction:column;align-items:flex-start}
.hc-li{display:flex;align-items:center;gap:10px;color:var(--ink);text-decoration:none;font-weight:500;margin-bottom:12px}.hc-li svg{color:var(--blue)}
.hc-hours{width:100%;margin:12px 0 26px;border-top:1px solid var(--line)}.hc-hours>div{display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line);font-size:.95rem}.hc-hours>div span:last-child{color:var(--mut)}.hc-hours .today{font-weight:600;color:var(--blue)}.hc-hours .today span:last-child{color:var(--blue)}
.hc-map{padding:0;overflow:hidden;min-height:420px;background-size:cover;background-position:center}.hc-map iframe{width:100%;height:100%;min-height:420px;border:0;display:block}
.hc-foot{margin-top:14px}.hc-foot-in{background:#0B0F17;color:#fff;border-radius:22px;padding:34px 40px;display:flex;flex-wrap:wrap;align-items:center;gap:20px 30px}.hc-foot-in b{font-size:1.1rem;text-transform:uppercase}.hc-foot nav{display:flex;flex-wrap:wrap;gap:20px;margin-left:auto}.hc-foot nav a{color:rgba(255,255,255,.75);text-decoration:none;font-size:.9rem}.hc-foot small{flex-basis:100%;color:rgba(255,255,255,.5)}
@media(max-width:980px){
.hc-links,.hc-hide-s{display:none}.hc-burger{display:block}.hc-bar{padding:8px 8px 8px 18px}
.hc-hero{height:auto;min-height:600px}.hc-hero-in{flex-direction:column;align-items:flex-start;justify-content:flex-end;padding:0 22px 26px;inset:14px 16px 0}
.hc-hero-rev{max-width:none;width:100%}
.hc-card{padding:28px 22px}.hc-about,.hc-contact{grid-template-columns:1fr}.hc-about-pic{min-height:300px}
.hc-stats,.hc-revs{grid-template-columns:1fr}.hc-stat{gap:18px;padding:24px 22px}
.hc-svcs,.hc-svcs.n2{grid-template-columns:1fr}.hc-svc{min-height:340px}
.hc-blue{grid-template-columns:1fr;padding:30px 22px;gap:28px}.hc-steps{grid-template-columns:1fr;gap:24px}
.hc-map,.hc-map iframe{min-height:300px}.hc-foot-in{padding:28px 22px}.hc-foot nav{margin-left:0}
}
.m2-hrev-wrap{position:absolute;left:0;right:0;top:36px;z-index:2;pointer-events:none}.m2-hrev-wrap .m2-w{display:flex;justify-content:flex-end}
.m2-hrev{pointer-events:auto;margin:0;width:min(380px,100%);min-height:200px;display:flex;flex-direction:column;padding:22px 24px 20px;border-radius:20px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(16px) saturate(140%);-webkit-backdrop-filter:blur(16px) saturate(140%);color:#fff;box-shadow:0 20px 50px rgba(0,0,0,.25)}
.m2-hrev-k{display:flex;align-items:center;gap:10px;margin:0 0 10px;font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;font-weight:600;color:rgba(255,255,255,.75)}
.m2-hrev-q{font-size:2.2rem;line-height:.6;height:16px;letter-spacing:0;color:#fff;font-family:Georgia,serif}
.m2-hrev blockquote{margin:0;font-size:1.18rem;line-height:1.45;letter-spacing:-.01em;font-weight:500;flex:1}
.m2-hrev cite{display:block;margin-top:12px;font-style:normal;font-size:.88rem;color:rgba(255,255,255,.72)}
.m2-hrev blockquote.in,.m2-hrev cite.in{animation:m2HqIn .7s ease both}
@keyframes m2HqIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.m2-hrev-dots{display:flex;gap:6px;margin-top:14px}.m2-hrev-dots i{width:16px;height:3px;border-radius:2px;background:rgba(255,255,255,.3);transition:background .3s,width .3s}.m2-hrev-dots i.on{width:28px;background:#fff}
.m2-hero-media,.m2-slide{position:absolute;inset:0}
.m2-slide{background-size:cover;background-position:center;opacity:0;transform:scale(1.06);transition:opacity 1.8s ease,transform 8s ease}
.m2-slide.on{opacity:1;transform:scale(1)}
.m2-hero-media:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.78) 0%,rgba(0,0,0,.25) 55%,rgba(0,0,0,.35) 100%)}
.m2-hero-in{position:relative;height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:56px}
.m2-hero h1{font-size:clamp(3.4rem,10vw,9.5rem);line-height:.9;letter-spacing:-.055em;font-weight:500}
.m2-hero-row{display:flex;justify-content:space-between;align-items:flex-end;gap:40px;margin-top:34px;padding-top:28px;border-top:1px solid rgba(255,255,255,.25)}
.m2-hero-row p{max-width:460px;font-size:1.08rem;line-height:1.6;color:rgba(255,255,255,.85);margin:0}
.m2-cta{display:flex;gap:10px;flex-wrap:wrap}
.m2-stats{border-bottom:1px solid var(--line)}
.m2-stats-in{display:grid;grid-template-columns:repeat(4,1fr)}
.m2-stats-in>div{padding:34px 0 34px 28px;border-left:1px solid var(--line)}.m2-stats-in>div:first-child{border-left:0;padding-left:0}
.m2-stats b{display:block;font-size:2.6rem;font-weight:500;letter-spacing:-.04em;line-height:1}.m2-stats span{color:var(--mut);font-size:.92rem}
.m2-sec{padding:130px 0}
.m2-gray{background:var(--gray)}
.m2-dark{background:var(--ink);color:#fff}
.m2-statement{font-size:clamp(1.9rem,3.6vw,3.2rem)!important;line-height:1.15!important;max-width:1100px;color:var(--ink)}
.m2-statement span{color:var(--mut)}
.m2-vals{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:80px}
.m2-val{border-top:1px solid var(--ink);padding-top:22px}
.m2-val small{font-size:.8rem;color:var(--mut);font-weight:600}
.m2-val h3{font-size:1.7rem;margin:10px 0 10px}.m2-val p{color:var(--mut);line-height:1.65;margin:0}
.m2-head{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;margin-bottom:48px;flex-wrap:wrap}
.m2-head h2{max-width:760px}
.m2-head-r{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.m2-chips{display:flex;gap:6px;background:#fff;padding:5px;border-radius:999px;border:1px solid var(--line)}
.m2-chips button{font:inherit;font-size:.9rem;font-weight:500;padding:9px 16px;border:0;border-radius:999px;background:transparent;color:var(--mut);cursor:pointer}
.m2-chips button.on{background:var(--ink);color:#fff}
.m2-arrows{display:flex;gap:8px}
.m2-arrows button,.m2-rnav button{width:48px;height:48px;border-radius:50%;border:1px solid #CFCFCB;background:#fff;color:var(--ink);cursor:pointer;display:grid;place-items:center}
.m2-arrows button:first-child .mt-i,.m2-rnav button:first-child .mt-i{transform:rotate(180deg)}
.m2-arrows button:hover,.m2-rnav button:hover{background:var(--ink);color:#fff;border-color:var(--ink)}
.m2-rail{display:flex;gap:18px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:0 max(40px,calc((100vw - 1320px)/2 + 40px)) 6px}
.m2-rail::-webkit-scrollbar{display:none}
.m2-tile{flex:0 0 300px;scroll-snap-align:start;padding:0;border:0;background:none;text-align:left;cursor:pointer;font:inherit;color:var(--ink)}
.m2-tile-ph{display:block;aspect-ratio:3/4;border-radius:22px;background-size:cover;background-position:center;transition:transform .5s ease,box-shadow .5s}
.m2-tile:hover .m2-tile-ph{transform:translateY(-6px);box-shadow:0 26px 50px rgba(0,0,0,.18)}
.m2-tile-c{display:block;padding:16px 4px 0}
.m2-tile small{display:block;font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;color:var(--mut);font-weight:600}
.m2-tile b{display:block;font-size:1.45rem;font-weight:500;letter-spacing:-.02em;margin-top:4px}
.m2-tile em{display:inline-flex;align-items:center;gap:6px;font-style:normal;font-size:.88rem;color:var(--mut);margin-top:6px}
.m2-note{color:var(--mut);margin:30px 0 0}
.m2-rail.roll{overflow:hidden;scroll-snap-type:none;padding:0 0 10px;-webkit-mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent);mask-image:linear-gradient(90deg,transparent,#000 4%,#000 96%,transparent)}
.m2-track{display:flex;width:max-content;animation:m2Roll 60s linear infinite;padding-top:8px}
.m2-track .m2-tile{margin-right:18px}
@keyframes m2Roll{to{transform:translateX(-50%)}}
.m2-slide{background-position:center 60%}
.m2-sheet{position:fixed;inset:0;z-index:200;background:rgba(10,10,10,.55);backdrop-filter:blur(6px);display:grid;place-items:center;padding:20px}
.m2-sheet[hidden],.m2-lb[hidden]{display:none}
.m2-sheet-card{display:grid;grid-template-columns:1fr 1fr;width:min(940px,100%);background:#fff;border-radius:26px;overflow:hidden;max-height:90vh}
.m2-sheet-ph{min-height:420px}
.m2-sheet-b{position:relative;padding:48px 40px;display:flex;flex-direction:column;justify-content:center;font-family:'Outfit',sans-serif;color:#0F1011}
.m2-sheet-b h3{font-size:2.6rem;font-weight:500;letter-spacing:-.04em;margin:0 0 14px}
.m2-sheet-b p{color:#6B6E73;line-height:1.7;margin:0 0 18px}.m2-sheet-b .m2-eyebrow{margin-bottom:8px}
.m2-tags{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:28px}.m2-tags span{font-size:.86rem;padding:7px 12px;border-radius:999px;background:#F4F4F2}
.m2-sheet-b .m2-btn{align-self:flex-start}
.m2-x{position:absolute;top:18px;right:18px;width:44px;height:44px;border-radius:50%;border:0;background:#F4F4F2;color:#0F1011;cursor:pointer;display:grid;place-items:center}
.m2-bento{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:190px;gap:16px}
.m2-b{background:var(--gray);border-radius:22px;padding:26px;display:flex;flex-direction:column;justify-content:space-between}
.m2-b .mt-i{width:46px;height:46px;border-radius:50%;background:#fff}.m2-b b{font-size:1.25rem;font-weight:500;letter-spacing:-.02em;line-height:1.2}
.m2-b.big{grid-column:span 2;grid-row:span 2;background-size:cover;background-position:center;justify-content:flex-end;color:#fff;position:relative;overflow:hidden}
.m2-b.big:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,.6),transparent 50%)}
.m2-b.big span{position:relative;z-index:1;font-weight:500}
.m2-work{display:grid;grid-template-columns:repeat(12,1fr);grid-auto-rows:220px;gap:16px}
.m2-wk{position:relative;padding:0;border:0;border-radius:22px;overflow:hidden;background:#222;cursor:zoom-in;grid-column:span 4}
.m2-wk.w0{grid-column:span 7;grid-row:span 2}.m2-wk.w1{grid-column:span 5;grid-row:span 2}.m2-wk.w2,.m2-wk.w3,.m2-wk.w4,.m2-wk.w5{grid-column:span 3}
.m2{overflow-x:clip}
.m2-bento .m2-b:nth-last-child(-n+2){grid-column:span 2}
.m2-wk img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 1s}.m2-wk:hover img{transform:scale(1.05)}
.m2-wk span{position:absolute;left:18px;bottom:16px;background:rgba(255,255,255,.92);color:#0F1011;font:500 .86rem 'Outfit',sans-serif;padding:8px 14px;border-radius:999px}
.m2-wctl{display:flex;gap:8px}
.m2-wctl button{width:52px;height:52px;border-radius:50%;border:1px solid rgba(255,255,255,.3);background:transparent;color:#fff;cursor:pointer;display:grid;place-items:center;transition:background .2s,color .2s}
.m2-wctl button:hover{background:#fff;color:#0F1011}.m2-wctl button:first-child .mt-i{transform:rotate(180deg)}
.m2-wstage{position:relative;border-radius:28px;overflow:hidden;background:#1B1D1F}
.m2-wmain{display:block;position:relative;width:100%;aspect-ratio:21/9;border:0;padding:0;background:none;cursor:zoom-in}
.m2-ws{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transform:scale(1.08);transition:opacity 1.1s ease,transform 6s ease-out}
.m2-ws.on{opacity:1;transform:scale(1)}
.m2-wcap{position:absolute;left:24px;bottom:24px;display:flex;align-items:center;gap:16px;padding:16px 22px 18px;border-radius:18px;background:rgba(15,16,17,.55);backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.14);color:#fff;overflow:hidden;min-width:min(420px,calc(100% - 48px))}
.m2-wnum{font-size:2.2rem;font-weight:500;letter-spacing:-.04em;line-height:1}
.m2-wcap small{display:block;font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;opacity:.65}
.m2-wcap b{display:block;font-size:1.15rem;font-weight:500;margin-top:3px}
.m2-wtot{margin-left:auto;opacity:.6;font-size:.9rem}
.m2-wbar{position:absolute;left:0;bottom:0;height:3px;width:100%;background:#fff;transform-origin:left;transform:scaleX(0)}
.m2-wbar.run{animation:m2Bar 5s linear forwards}
@keyframes m2Bar{to{transform:scaleX(1)}}
.m2-wthumbs{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-top:14px}
.m2-wt{padding:0;border:0;border-radius:14px;overflow:hidden;aspect-ratio:16/10;background:#1B1D1F;cursor:pointer;opacity:.45;transition:opacity .3s,transform .3s;outline:2px solid transparent;outline-offset:3px}
.m2-wt img{width:100%;height:100%;object-fit:cover;display:block}
.m2-wt:hover{opacity:.8}.m2-wt.on{opacity:1;outline-color:#fff}
.m2-lb{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.92);display:grid;place-items:center;padding:20px}
.m2-lb figure{margin:0}.m2-lb img{max-width:100%;max-height:82vh;border-radius:16px;display:block}.m2-lb figcaption{color:#fff;margin-top:12px;font-family:'Outfit',sans-serif}
.m2-steps{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:1px solid var(--ink)}
.m2-steps li{padding:30px 28px 0 0}
.m2-steps span{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:50%;background:var(--ink);color:#fff;font-weight:500;font-size:.9rem;margin-top:-52px;box-shadow:0 0 0 8px #fff}
.m2-steps h3{font-size:1.4rem;margin:22px 0 10px}.m2-steps p{color:var(--mut);line-height:1.65;margin:0}
.m2-rev{text-align:center;max-width:980px}
.m2-stars{display:flex;justify-content:center;gap:4px;color:var(--ink);margin-bottom:26px}.m2-stars svg{fill:currentColor;width:18px!important;height:18px!important}
.m2-rev blockquote{margin:0;font-size:clamp(1.9rem,4vw,3.4rem);font-weight:500;letter-spacing:-.035em;line-height:1.12;min-height:2.3em}
.m2-rev blockquote.in{animation:m2In .6s ease}
@keyframes m2In{from{opacity:0;transform:translateY(12px)}}
.m2-rev cite{display:block;font-style:normal;color:var(--mut);margin-top:22px}
.m2-rnav{display:flex;justify-content:center;align-items:center;gap:20px;margin-top:34px}.m2-rc{font-size:.9rem;color:var(--mut);min-width:64px}
.m2-crew{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.m2-mem{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;background:var(--gray);border-radius:22px;overflow:hidden;transition:transform .35s,box-shadow .35s}
.m2-mem:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(0,0,0,.08)}
.m2-mem:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
.m2-mem-ph{position:relative;aspect-ratio:4/4.4;background:linear-gradient(160deg,#E9E9E6,#D7D8D4);display:grid;place-items:center;overflow:hidden}
.m2-mem-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 20%;filter:grayscale(1);transition:filter .5s,transform .6s}
.m2-mem:hover .m2-mem-ph img{filter:none;transform:scale(1.03)}
.m2-ini{font-size:3.4rem;font-weight:500;letter-spacing:-.04em;color:#9A9C9F}
.m2-mem-t{padding:20px 22px 6px;display:flex;flex-direction:column;gap:4px}.m2-mem-t b{font-size:1.3rem;font-weight:500;letter-spacing:-.02em}.m2-mem-t span{color:var(--mut);font-size:.95rem}
.m2-mem-more{display:flex;align-items:center;gap:8px;padding:10px 22px 22px;font-weight:500;font-size:.92rem}.m2-mem-more svg{width:16px;height:16px;transition:transform .3s}.m2-mem:hover .m2-mem-more svg{transform:translateX(4px)}
.m2-bio{position:fixed;inset:0;z-index:210;background:rgba(10,10,10,.55);backdrop-filter:blur(6px);display:grid;place-items:center;padding:20px}.m2-bio[hidden]{display:none}
.m2-bio-card{position:relative;display:grid;grid-template-columns:.9fr 1.1fr;width:min(920px,100%);background:#fff;border-radius:26px;overflow:hidden;max-height:90vh}
.m2-bio-ph{position:relative;overflow:hidden;background:linear-gradient(160deg,#E9E9E6,#D7D8D4);display:grid;place-items:center;min-height:420px}.m2-bio-ph img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 20%}
.m2-bio-b{padding:48px 40px;overflow:auto;display:flex;flex-direction:column}.m2-bio-b h3{font-size:2.4rem;font-weight:500;letter-spacing:-.04em;margin:0 0 16px}.m2-bio-b p{color:#4A4D52;line-height:1.75;margin:0 0 16px}.m2-bio-b .m2-eyebrow{margin-bottom:8px;color:var(--mut)}.m2-bio-b .m2-btn{align-self:flex-start;margin-top:8px}
.m2-bio-card .m2-x{position:absolute;top:14px;right:14px;z-index:2}
@media(max-width:900px){.m2-crew{grid-template-columns:repeat(2,1fr);gap:14px}.m2-mem-t{padding:14px 14px 4px}.m2-mem-t b{font-size:1.05rem}.m2-mem-t span{font-size:.82rem}.m2-mem-more{padding:8px 14px 16px;font-size:.82rem}.m2-mem-ph img{filter:none}
.m2-bio{padding:0;align-items:end}.m2-bio-card{grid-template-columns:1fr;border-radius:24px 24px 0 0;max-height:92vh;overflow:auto}.m2-bio-ph{min-height:0;height:min(48vh,340px)}.m2-bio-b{padding:26px 22px 34px;overflow:visible}.m2-bio-b h3{font-size:1.9rem}}
.m2-team{display:grid;grid-template-columns:1fr 1.3fr;gap:60px;align-items:start}
.m2-team ul{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.m2-team li{display:flex;justify-content:space-between;align-items:baseline;gap:20px;padding:22px 0;border-bottom:1px solid var(--line)}
.m2-team li b{font-size:1.35rem;font-weight:500;letter-spacing:-.02em}.m2-team li span{color:var(--mut);text-align:right}
.m2-visit{display:grid;grid-template-columns:1fr 1fr;background:var(--ink);color:#fff;min-height:640px}
.m2-visit-t{padding:110px max(40px,calc((100vw - 1320px)/2 + 40px));padding-right:60px;display:flex;flex-direction:column;justify-content:center}
.m2-visit h2{margin-bottom:30px}
.m2-li{display:flex;align-items:center;gap:12px;color:#fff;text-decoration:none;font-size:1.1rem;padding:8px 0}
.m2-hrs{list-style:none;margin:24px 0 32px;padding:0;max-width:380px}
.m2-hrs li{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.12);color:rgba(255,255,255,.7)}
.m2-hrs li.on{color:#fff;font-weight:600}
.m2-soc{display:flex;gap:10px;margin-top:28px}.m2-soc a{width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.25);display:grid;place-items:center;color:#fff}.m2-soc a:hover{background:#fff;color:#0F1011}
.m2-map iframe{width:100%;height:100%;min-height:420px;border:0;display:block;filter:grayscale(1) contrast(1.05)}
.m2-foot{padding:44px 0 110px;border-top:1px solid var(--line)}
.m2-foot-in{display:flex;align-items:center;gap:30px;flex-wrap:wrap}.m2-foot img{height:40px}
.m2-foot nav{display:flex;gap:22px;margin-left:auto}.m2-foot nav a{color:var(--ink);text-decoration:none;font-size:.92rem}
.m2-foot small{flex-basis:100%;color:var(--mut)}
@media (max-width:980px){
.m2-w{padding:0 20px}.m2-links,.m2-hide-s{display:none}.m2-show-s{display:inline}.m2-nav-in{height:64px}.m2-logo img{height:36px}.m2-nav .m2-btn{margin-left:auto}
.m2-mlinks{display:flex;justify-content:space-between;gap:clamp(4px,1.5vw,6px);padding-left:clamp(12px,5vw,20px)!important;padding-right:clamp(12px,5vw,20px)!important;overflow-x:auto;scrollbar-width:none;padding:0 20px;border-top:1px solid var(--line)}.m2-mlinks::-webkit-scrollbar{display:none}.m2-mlinks a{flex:none;color:var(--ink);text-decoration:none;font-weight:500;font-size:clamp(.66rem,3.3vw,.84rem);letter-spacing:-.01em;padding:11px 0;white-space:nowrap}
.m2-hero{height:auto;min-height:0}.m2-hero-in{padding-top:228px;padding-bottom:30px}.m2-hrev-wrap{top:18px}.m2-hrev-wrap .m2-w{justify-content:stretch}.m2-hrev{width:100%;min-height:0;height:186px;padding:18px 20px 16px}.m2-hrev blockquote{font-size:1.02rem;overflow:hidden}.m2-hero-row{flex-direction:column;align-items:flex-start;gap:22px}.m2-cta .m2-btn{flex:1 1 100%;justify-content:center}
.m2-stats-in{grid-template-columns:1fr 1fr}.m2-stats-in>div{padding:22px 0 22px 16px}.m2-stats-in>div:nth-child(3){border-left:0;padding-left:0}.m2-stats-in>div:nth-child(n+3){border-top:1px solid var(--line)}.m2-stats b{font-size:2rem}
.m2-sec{padding:80px 0}.m2-vals{grid-template-columns:1fr;gap:28px;margin-top:44px}
.m2-arrows{display:none}.m2-tile{flex-basis:62vw}.m2-track .m2-tile{margin-right:12px}
.m2-sheet{padding:0;align-items:end}.m2-sheet-card{grid-template-columns:1fr;border-radius:24px 24px 0 0}.m2-sheet-ph{min-height:220px}.m2-sheet-b{padding:28px 22px 34px}.m2-sheet-b h3{font-size:2rem}
.m2-bento{grid-template-columns:1fr 1fr;grid-auto-rows:150px;gap:10px}.m2-bento .m2-b:nth-last-child(-n+2){grid-column:auto}.m2-b{padding:18px;border-radius:18px}.m2-b b{font-size:1rem}
.m2-work{grid-template-columns:1fr 1fr;grid-auto-rows:170px;gap:10px}.m2-wk,.m2-wk.w0,.m2-wk.w1,.m2-wk.w2,.m2-wk.w3,.m2-wk.w4,.m2-wk.w5{grid-column:span 1;grid-row:span 1}.m2-wk.w0{grid-column:span 2;grid-row:span 2}
.m2-wmain{aspect-ratio:4/3}.m2-wstage{border-radius:20px}.m2-wcap{left:12px;right:12px;bottom:12px;min-width:0;padding:12px 14px 14px;gap:12px}.m2-wnum{font-size:1.6rem}.m2-wcap b{font-size:1rem;margin:0}.m2-wcap small{display:none}.m2-wtot{white-space:nowrap}.m2-wthumbs{grid-template-columns:repeat(6,1fr);gap:6px}.m2-wt{border-radius:8px}.m2-wctl{display:none}
.m2-steps{grid-template-columns:1fr;border-top:0;border-left:1px solid var(--ink);margin-left:22px}.m2-steps li{padding:0 0 34px 34px}.m2-steps span{margin:0 0 0 -57px;float:left}.m2-steps h3{margin-top:8px}
.m2-team{grid-template-columns:1fr;gap:30px}.m2-team li{flex-direction:column;gap:2px}.m2-team li span{text-align:left}
.m2-visit{grid-template-columns:1fr}.m2-visit-t{padding:70px 20px}.m2-map iframe{min-height:320px}
.m2-foot nav{margin-left:0;flex-wrap:wrap}
}
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
.mp-pick{margin-top:24px;border:1px solid rgba(255,255,255,.25);border-radius:6px;padding:18px 20px;max-width:520px}
.mp-pick-h{font-size:.72rem;letter-spacing:.18em;text-transform:uppercase;font-weight:700;opacity:.8;margin-bottom:10px}
.mp-pick ul{list-style:none;margin:0;padding:0}
.mp-pick li{display:flex;justify-content:space-between;gap:16px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.14);font-size:.95rem}
.mp-pick-t{display:flex;justify-content:space-between;gap:16px;padding-top:12px;font-weight:700}
.mp-pick-t b{font-size:1.15rem}
.mp-pick-n{font-size:.85rem!important;margin-top:10px!important;opacity:.85}
.mp-pick-go{margin-top:14px;background:none;border:0;padding:0;color:inherit;font:inherit;font-weight:700;text-decoration:underline;text-underline-offset:4px;cursor:pointer}
.mk-play{display:grid;gap:22px}
.mk-pl{border:1px solid #E2E8F0;border-radius:6px;padding:26px 26px 22px;background:#fff}
.mk-pl.pick{border-color:#0F172A;box-shadow:inset 4px 0 0 #0F172A}
.mk-pl-h{display:flex;justify-content:space-between;gap:20px;align-items:flex-start;padding-bottom:16px;border-bottom:1px solid #E2E8F0}
.mk-pl-h h3{font-size:1.3rem;font-weight:800;letter-spacing:-.02em;line-height:1.2}
.mk-pl-h p{color:#475569;margin-top:6px;font-size:.95rem;max-width:640px}
.mk-tag{display:inline-block;font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;font-weight:700;background:#0F172A;color:#fff;padding:5px 9px;border-radius:3px;margin-bottom:10px}
.mk-pl-p{font-size:1.5rem;font-weight:800;letter-spacing:-.03em;white-space:nowrap}
.mk-pl-g{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding-top:18px}
.mk-pc h4{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:#64748B;margin-bottom:10px}
.mk-pc ul{list-style:none;margin:0;padding:0;display:grid;gap:9px}
.mk-pc li{font-size:.92rem;line-height:1.5;color:#1E293B;padding-left:16px;position:relative}
.mk-pc li:before{content:"";position:absolute;left:0;top:.6em;width:6px;height:6px;background:#0F172A}
.mk-pc.ex li{font-style:italic;color:#334155}
.mk-pc.ex li:before{background:none;border:1px solid #0F172A}
.mk-play-n{margin-top:16px;font-size:.88rem;color:#475569;max-width:760px}
.mk-realty .mk-pl.pick{border-color:#000;box-shadow:inset 4px 0 0 #000}
.mk-realty .mk-tag{background:#000}
@media (max-width:900px){.mk-pl-g{grid-template-columns:1fr}.mk-pl-h{flex-direction:column}}
/* realty: black and white, matches the realtor site */
.mk-realty .mp-bar{border-bottom:1px solid #E2E2E2}
.mk-realty .mp-brand{color:#000}
.mk-realty .mp-back{color:#000;text-decoration:underline;text-underline-offset:4px}
.mk-realty .mp-cover{background:#000;padding:60px 0 56px}
.mk-realty .mp-cover .mp-in{grid-template-columns:1.25fr .85fr;grid-template-rows:auto auto;gap:28px 56px;align-items:start}
.mk-realty .mp-cover-l{grid-column:1;grid-row:1}
.mk-realty .mp-meta{grid-column:1;grid-row:2;display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 24px;margin:0;border-top-color:rgba(255,255,255,.2)}
.mk-realty .mp-meta div{border-bottom-color:rgba(255,255,255,.2)}
.mk-realty .mp-meta dt{color:#9A9A9A}
.mk-realty .mp-eyebrow{color:#BDBDBD;font-family:inherit;text-transform:uppercase;letter-spacing:.24em;font-size:.72rem}
.mk-realty .mp-cover h1{color:#fff;font-weight:800;font-size:clamp(2rem,4.2vw,3.2rem)}
.mk-realty .mp-cover p{color:#CFCFCF}
.mk-realty .mp-photo{grid-column:2;grid-row:1/span 2;background:#111;border:0;outline:1px solid rgba(255,255,255,.25);outline-offset:10px;border-radius:4px;box-shadow:none}
.mk-realty .mp-photo .ph{height:auto;aspect-ratio:1;background-position:50% 20%;border-radius:4px}
.mk-realty .mp-photo figcaption{color:#BDBDBD;padding:12px 2px 0}
.mk-realty .mp-label{border-top:2px solid #000;color:#000}
.mk-realty .mp-label span,.mk-realty .mo-num{color:#6B6B6B}
.mk-realty .mo-body h3,.mk-realty .mo-price b{color:#000}
.mk-realty .mo-ex{background:#F4F4F4;border-left-color:#000}
.mk-realty .mo-ex span{color:#000}
.mk-realty .mo-more li::before{background:#000}
@media (max-width:860px){.mk-realty .mp-cover .mp-in{grid-template-columns:1fr}.mk-realty .mp-photo{grid-column:1;grid-row:auto;max-width:300px;order:-1;margin:10px}.mk-realty .mp-meta{grid-row:auto;grid-template-columns:1fr}}
.mk-sunshine{font-family:ui-rounded,"SF Pro Rounded",-apple-system,system-ui,sans-serif;color:#1B2A41}
.mk-sunshine .mp-bar{border-bottom:3px solid #FFC93C}
.mk-sunshine .mp-brand{color:#1F5FAF}
.mk-sunshine .mp-back{color:#1F5FAF;font-weight:800}
.mk-sunshine .mp-cover{background:radial-gradient(circle at 88% 12%,rgba(255,201,60,.55),transparent 34%),linear-gradient(180deg,#FFF6D6,#FFFFFF);color:#1B2A41;padding:60px 0 64px}
.mk-sunshine .mp-cover .mp-in{grid-template-columns:1.2fr .9fr;grid-template-rows:auto auto;gap:28px 56px;align-items:start}
.mk-sunshine .mp-cover-l{grid-column:1;grid-row:1}
.mk-sunshine .mp-eyebrow{color:#F7742B;font-family:inherit;text-transform:uppercase;letter-spacing:.18em;font-weight:800;font-size:.76rem}
.mk-sunshine .mp-cover h1{color:#1B2A41;font-weight:800;font-size:clamp(2rem,4.2vw,3.2rem)}
.mk-sunshine .mp-cover p{color:#4A5568}
.mk-sunshine .mp-meta{grid-column:1;grid-row:2;display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 24px;margin:0;border-top-color:#E3E9F2}
.mk-sunshine .mp-meta div{border-bottom-color:#E3E9F2}
.mk-sunshine .mp-meta dt{color:#5A6578}
.mk-sunshine .mp-pick{background:#fff;border:2px solid #FFC93C;border-radius:18px;box-shadow:0 8px 0 #FFB020,0 24px 40px rgba(31,95,175,.10);color:#1B2A41}
.mk-sunshine .mp-pick-h{color:#1F5FAF;opacity:1}
.mk-sunshine .mp-pick li{border-bottom-color:#EEF2F7}
.mk-sunshine .mp-pick-t b{color:#1F5FAF;font-size:1.3rem}
.mk-sunshine .mp-pick-go{color:#1F5FAF}
.mk-sunshine .mp-photo{grid-column:2;grid-row:1/span 2;margin:0;background:#fff;border:6px solid #fff;border-radius:22px;box-shadow:0 30px 60px rgba(31,95,175,.2);transform:rotate(1.5deg);overflow:hidden}
.mk-sunshine .mp-photo .ph{height:auto;aspect-ratio:4/3;border-radius:16px}
.mk-sunshine .mp-photo figcaption{color:#5A6578;padding:10px 6px 4px;font-weight:700;font-size:.85rem}
.mk-sunshine .mp-label{border-top:3px solid #FFC93C;color:#1B2A41;font-weight:800}
.mk-sunshine .mp-label span,.mk-sunshine .mo-num{color:#F7742B;font-weight:800}
.mk-sunshine .mo-body h3,.mk-sunshine .mo-price b{color:#1B2A41}
.mk-sunshine .mo-price b{color:#1F5FAF}
.mk-sunshine .mo-ex{background:#FFF6D6;border-left-color:#FFC93C;border-radius:0 12px 12px 0}
.mk-sunshine .mo-ex span{color:#F7742B}
.mk-sunshine .mo-more li::before{background:#FFB020}
.mk-sunshine .mk-pl{border:2px solid #E3E9F2;border-radius:20px}
.mk-sunshine .mk-pl.pick{border-color:#FFC93C;box-shadow:0 8px 0 #FFE08A}
.mk-sunshine .mk-tag{background:#1F5FAF;border-radius:8px}
.mk-sunshine .mk-pl-p{color:#1F5FAF}
.mk-sunshine .mk-pc.month{background:#EEF6FF;border-radius:14px;padding:14px}
.mk-sunshine .mk-pc.ex{background:#FFF6D6;border-radius:14px;padding:14px}
.mk-sunshine .mk-pc h4{color:#F7742B}
.mk-sunshine .mk-play{gap:14px}
.mk-sunshine .mk-pl{padding:18px 22px}
.mk-sunshine .mk-pl-h{padding-bottom:12px;align-items:center}
.mk-sunshine .mk-pl-h h3{font-size:1.15rem}
.mk-sunshine .mk-pl-h p{margin-top:2px;font-size:.9rem}
.mk-sunshine .mk-tag{margin-bottom:6px;font-size:.62rem;padding:4px 8px;white-space:nowrap}
.mk-sunshine .mk-pl-p{font-size:1.2rem}
.mk-sunshine .mk-pl-g{grid-template-columns:1fr;padding-top:14px}
.mk-sunshine .mk-pc.month{background:none;padding:0}
.mk-sunshine .mk-pc.month h4{display:none}
.mk-sunshine .mk-pc.month ul{grid-template-columns:repeat(4,1fr);gap:10px}
.mk-sunshine .mk-pc.month li{background:#EEF6FF;border-radius:12px;padding:10px 12px;font-size:.88rem;line-height:1.4}
.mk-sunshine .mk-pl.pick .mk-pc.month li{background:#FFF6D6}
.mk-sunshine .mk-pc.month li:before{display:none}
.mk-sunshine .mk-pc.month li b{display:block;font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:#F7742B;margin-bottom:3px}
.mk-sunshine .mk-pc.do{margin-bottom:12px}
.mk-sunshine .mk-pc.do h4{display:none}
.mk-sunshine .mk-pc.do ul{display:flex;flex-wrap:wrap;gap:6px 22px}
.mk-sunshine .mk-pc.do li{font-size:.92rem;font-weight:600;padding-left:16px}
.mk-sunshine .mk-pc.do li:before{background:#FFB020;border-radius:50%;width:7px;height:7px;top:.55em}
.mk-sunshine .mk-pl-g{gap:0}
@media (max-width:760px){.mk-sunshine .mk-pc.month ul{grid-template-columns:1fr 1fr}.mk-sunshine .mk-pl-h{display:grid;grid-template-columns:1fr auto;gap:10px;text-align:left;align-items:start;justify-items:start}.mk-sunshine .mk-pl-p{font-size:1.05rem}}
@media (max-width:860px){.mk-sunshine .mp-cover .mp-in{grid-template-columns:1fr}.mk-sunshine .mp-photo{grid-column:1;grid-row:auto;order:-1;transform:none}.mk-sunshine .mp-meta{grid-row:auto;grid-template-columns:1fr}}
.mp-pick li b{white-space:nowrap}
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
/* ===== FADE BABE: dark, cinematic barbershop ===== */
.fd{--ink:#0a0a0a;--rd:#C8202C;--rd2:#E23A46;--soft:#F3F4F6;--ln:#E2E4E8;--hf:'Playfair Display','Abril Fatface',Georgia,serif;--bd:'Archivo',system-ui,sans-serif;background:#fff;color:var(--ink);font-family:var(--bd);font-weight:500;line-height:1.6}
.fd *{box-sizing:border-box}
.fd h1,.fd h2,.fd h3{font-family:var(--hf);font-weight:700;line-height:1.1;margin:0}
.fd-wrap{max-width:1160px;margin:0 auto;padding:0 24px}
.fd-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 24px;border-radius:6px;border:1.5px solid var(--ink);font-family:var(--bd);font-weight:700;font-size:.95rem;letter-spacing:.02em;text-decoration:none;cursor:pointer;transition:background .15s,color .15s,border-color .15s}
.fd-btn.red{background:var(--rd);border-color:var(--rd);color:#fff}.fd-btn.red:hover{background:var(--rd2);border-color:var(--rd2)}
.fd-btn.ghost{background:transparent;border-color:rgba(255,255,255,.7);color:#fff}.fd-btn.ghost:hover{background:#fff;color:var(--ink)}
.fd-btn.light{background:#fff;border-color:#fff;color:var(--ink)}.fd-btn.light:hover{background:var(--ink);border-color:#fff;color:#fff}
.fd-btn.line{background:#fff;color:var(--ink)}.fd-btn.line:hover{background:var(--ink);color:#fff}
.fd-btn.sm{min-height:40px;padding:0 16px;font-size:.9rem}.fd-btn .ico{width:16px;height:16px}
.fd-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}
.fd-mk{display:inline-flex;align-items:center;justify-content:center;flex:none;border-radius:50%;overflow:hidden;background:#222;color:#fff;font-family:var(--hf)}
.fd-mk img{display:block;width:100%;height:100%;object-fit:cover}.fd-mk.sm{width:42px;height:42px;border:2px solid #fff}
.fd-kick{display:inline-block;font-weight:700;font-size:.78rem;letter-spacing:.22em;text-transform:uppercase;color:var(--rd2);margin-bottom:14px}.fd-kick.dark{color:var(--rd)}
.fd-nav{position:sticky;top:0;z-index:30;background:#0a0a0a;border-bottom:1px solid rgba(255,255,255,.14)}
.fd-nav-in{max-width:1160px;margin:0 auto;padding:10px 24px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px}
.fd-links{display:flex;gap:2px}.fd-links button,.fd-mlinks button{background:none;border:0;font:600 .88rem var(--bd);letter-spacing:.08em;text-transform:uppercase;color:#fff;padding:10px 12px;cursor:pointer;border-bottom:2px solid transparent}
.fd-links button:hover,.fd-mlinks button:hover{border-bottom-color:var(--rd2)}
.fd-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:#fff}.fd-brand b{font-family:var(--hf);font-weight:700;font-size:1.5rem;white-space:nowrap}
.fd-nav-r{display:flex;align-items:center;justify-content:flex-end;gap:12px}
.fd-mlinks{display:none}
.fd-st{display:inline-flex;align-items:center;gap:8px;font-size:.8rem;font-weight:700;border:1px solid rgba(255,255,255,.4);border-radius:6px;padding:5px 10px;white-space:nowrap;color:#fff}
.fd-st:empty{display:none}.fd-st i{width:9px;height:9px;border-radius:50%;background:#9CA3AF;flex:none}.fd-st.open i{background:#22C55E}.fd-st.soon i{background:#F59E0B}.fd-st.closed i{background:var(--rd2)}
.fd-st em{font-style:normal;font-weight:500;color:#D1D5DB}
.fd-hero{position:relative;background:#0a0a0a;color:#fff;overflow:hidden}
.fd-hero-ph{position:absolute;top:0;right:0;bottom:0;width:64%;background-size:cover;background-position:center 25%}
.fd-hero-ph::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,#0a0a0a 0%,rgba(10,10,10,.82) 22%,rgba(10,10,10,.2) 62%,rgba(10,10,10,0) 100%),linear-gradient(0deg,#0a0a0a 0%,rgba(10,10,10,0) 30%)}
.fd-hero-in{position:relative;z-index:2;padding-top:96px;padding-bottom:64px;min-height:560px;display:flex;align-items:center}
.fd-hero-t{max-width:560px}
.fd-hero h1{font-size:clamp(2.6rem,6vw,4.7rem);color:#fff;letter-spacing:-.01em}
.fd-lead{font-size:1.1rem;color:#D1D5DB;margin:20px 0 0;max-width:40ch}
.fd-quick{position:relative;z-index:2;display:grid;grid-template-columns:repeat(6,1fr);border-top:1px solid rgba(255,255,255,.2);margin-top:0}
.fd-quick button{display:flex;flex-direction:column;align-items:center;gap:10px;padding:22px 8px 26px;background:none;border:0;color:#fff;cursor:pointer;font:700 .74rem var(--bd);letter-spacing:.16em;text-transform:uppercase;border-bottom:3px solid transparent;text-align:center}
.fd-quick button:hover{background:rgba(255,255,255,.06);border-bottom-color:var(--rd2)}
.fd-ic svg{width:34px;height:34px;display:block}
.fd-brands{background:#fff;padding:54px 0 46px;text-align:center}
.fd-bq{font-family:var(--hf);font-style:italic;font-weight:500;font-size:1.15rem;color:#374151;max-width:56ch;margin:0 auto 24px}
.fd-bn{display:flex;flex-wrap:wrap;justify-content:center;gap:14px 54px}
.fd-bn span{font-family:var(--hf);font-weight:700;font-size:clamp(1.3rem,3vw,1.9rem);color:#9CA3AF;letter-spacing:.03em}
.fd-sec{padding:84px 0}
.fd-light{background:#fff}
.fd-dark{background:#0a0a0a;color:#fff}
.fd-sec h2{font-size:clamp(2rem,4.4vw,3.1rem)}.fd-dark h2{color:#fff}
.fd-sub{margin:10px 0 0;color:#6B7280}.fd-dark .fd-sub{color:#D1D5DB}
.fd-ab-grid{display:grid;grid-template-columns:1fr 1.05fr;gap:64px;align-items:center}
.fd-ab-ph{position:relative;aspect-ratio:1/1.05}
.fd-ab-a,.fd-ab-b{position:absolute;background-size:cover;background-position:center;border-radius:4px}
.fd-ab-a{left:0;top:0;width:62%;height:86%}
.fd-ab-b{right:0;bottom:0;width:52%;height:62%;border:8px solid #fff}
.fd-ab-box{position:absolute;left:44%;top:46%;transform:translate(-50%,-50%);z-index:3;background:var(--rd);color:#fff;padding:20px 24px;text-align:center;min-width:150px;box-shadow:0 14px 30px rgba(0,0,0,.25)}
.fd-ab-box b{display:block;font-family:var(--hf);font-size:2.4rem;line-height:1}.fd-ab-box span{display:block;font-size:.72rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;margin-top:6px}
.fd-ab-t h2{margin-bottom:18px;max-width:16ch}.fd-ab-t p{margin:0 0 14px;color:#4B5563;font-size:1.05rem;max-width:54ch}
.fd-stats{margin:26px 0 4px;display:flex;gap:40px;flex-wrap:wrap}
.fd-stats dd{margin:0;font-family:var(--hf);font-weight:700;font-size:2.3rem;line-height:1;color:var(--ink)}
.fd-stats dt{font-size:.74rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#6B7280;margin-top:6px;max-width:16ch}
.fd-services{background:#0a0a0a;color:#fff;padding-top:84px}
.fd-sv-h{padding-bottom:36px}.fd-sv-h h2{color:#fff}.fd-sv-h p{margin:10px 0 0;color:#D1D5DB}
.fd-split{display:grid;grid-template-columns:1fr 1fr;min-height:540px;background:#0a0a0a;transition:grid-template-columns .5s ease}
.fd-split[data-open="a"]{grid-template-columns:2.3fr 1fr}.fd-split[data-open="b"]{grid-template-columns:1fr 2.3fr}
.fd-pn{position:relative;overflow:hidden;color:#fff;display:flex;align-items:flex-end;min-width:0}
.fd-pn+.fd-pn{border-left:6px solid #0a0a0a}
.fd-pn-bg{position:absolute;inset:0;background-size:cover;background-position:center 20%;transition:transform .6s}
.fd-pn:hover .fd-pn-bg{transform:scale(1.03)}
.fd-pn::after{content:'';position:absolute;inset:0;pointer-events:none}
.fd-pn.a::after{background:linear-gradient(180deg,rgba(10,10,10,0) 20%,rgba(10,10,10,.92) 68%,#0a0a0a 100%)}
.fd-pn.b::after{background:linear-gradient(180deg,rgba(200,32,44,0) 20%,rgba(200,32,44,.9) 68%,#C8202C 100%)}
.fd-pn.a.on::after{background:linear-gradient(180deg,rgba(10,10,10,.62) 0%,rgba(10,10,10,.94) 55%,#0a0a0a 100%)}
.fd-pn.b.on::after{background:linear-gradient(180deg,rgba(150,20,30,.7) 0%,rgba(200,32,44,.95) 55%,#C8202C 100%)}
.fd-pn-in{position:relative;z-index:2;width:100%;padding:36px 34px 38px}
.fd-pn-n{display:block;font:700 .8rem var(--bd);letter-spacing:.2em;margin-bottom:8px;opacity:.9}
.fd-pn h2{font-size:clamp(2rem,4.2vw,3rem);color:#fff}
.fd-pn-d{margin:10px 0 20px;font-size:1.05rem;max-width:34ch;color:#F3F4F6}
.fd-pn-more{margin-top:22px;padding-top:20px;border-top:1px solid rgba(255,255,255,.5)}
.fd-pn-ul{list-style:none;margin:0 0 6px;padding:0;columns:2;column-gap:28px}.fd-pn-ul li{padding:6px 0 6px 20px;position:relative;font-weight:600;break-inside:avoid}
.fd-pn-ul li::before{content:'';position:absolute;left:0;top:16px;width:10px;height:2px;background:#fff}
.fd-pn.a .fd-pn-ul li::before{background:var(--rd2)}
.fd-pn-sub{margin-top:14px}.fd-pn-sub h3{font-size:1.2rem;color:#fff;margin-bottom:2px}.fd-pn-sub p{margin:0 0 4px;color:#F3F4F6}
.fd-pn-thumbs{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:18px 0 20px}
.fd-pn-thumbs button{padding:0;border:2px solid #fff;border-radius:4px;overflow:hidden;aspect-ratio:1;cursor:pointer;background:#222}
.fd-pn-thumbs span{display:block;width:100%;height:100%;background-size:cover;background-position:center}
.fd-split[data-open="a"] .fd-pn.b .fd-pn-d,.fd-split[data-open="b"] .fd-pn.a .fd-pn-d{display:none}
.fd-gal-h{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:34px}
.fd-pause{min-height:42px;padding:0 18px;border:1.5px solid rgba(255,255,255,.7);border-radius:6px;background:transparent;color:#fff;font:700 .85rem var(--bd);letter-spacing:.08em;text-transform:uppercase;cursor:pointer}.fd-pause:hover{background:#fff;color:var(--ink)}
.fd-marq{overflow:hidden}
.fd-marq-track{display:flex;width:max-content;animation:fdmarq 56s linear infinite}
.fd-marq:hover .fd-marq-track,.fd-marq:focus-within .fd-marq-track,.fd-marq.paused .fd-marq-track{animation-play-state:paused}
@keyframes fdmarq{to{transform:translateX(-50%)}}
.fd-slide{flex:none;width:min(320px,70vw);margin:0 20px 0 0}
.fd-slide button{display:block;width:100%;padding:0;border:0;border-radius:4px;overflow:hidden;aspect-ratio:4/5;cursor:pointer;background:#222}
.fd-slide button span{display:block;width:100%;height:100%;background-size:cover;background-position:center;transition:transform .35s}.fd-slide button:hover span{transform:scale(1.05)}
.fd-slide figcaption{margin:14px 2px 0;font-weight:600;letter-spacing:.1em;text-transform:uppercase;font-size:.76rem;color:#D1D5DB}
.fd-follow{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-start;gap:12px 28px;margin-top:44px;padding:22px 24px;border:1px solid rgba(255,255,255,.35);border-radius:6px}
.fd-follow b{font-family:var(--hf);font-weight:700;font-size:1.3rem}.fd-follow .fd-cta{margin:0}
.fd-pole{height:12px;background:repeating-linear-gradient(-45deg,var(--rd) 0 16px,#fff 16px 32px,#2b2b2b 32px 48px)}
.fd-band{background:var(--rd);color:#fff}
.fd-band .fd-wrap{padding-top:30px;padding-bottom:34px}
.fd-band-k{display:block;text-align:center;font:700 .95rem var(--hf);letter-spacing:.24em;text-transform:uppercase;color:#FFD9DC;margin-bottom:18px}
.fd-band-in{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:0}
.fd-band-in li{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;padding:6px 18px;border-left:2px solid rgba(255,255,255,.35)}
.fd-band-in li:first-child{border-left:0}
.fd-pk-i{display:grid;place-items:center;width:76px;height:76px;border:3px solid #fff;border-radius:50%}
.fd-band-in span:not(.fd-pk-i){font-family:var(--hf);font-weight:700;font-size:clamp(1.3rem,3.2vw,2.1rem);line-height:1.05}
@media (max-width:640px){.fd-band-in{grid-template-columns:1fr;gap:14px}.fd-band-in li{flex-direction:row;text-align:left;border-left:0;gap:16px;padding:4px 6px}.fd-pk-i{width:60px;height:60px;flex:none}.fd-pk-i svg{width:34px;height:34px}}
.fd-faq-grid{display:grid;grid-template-columns:1.5fr 1fr;gap:56px;align-items:start}
.fd-faq h2{margin-bottom:26px}
.fd-qa details{border-top:1px solid var(--ln)}.fd-qa details:last-child{border-bottom:1px solid var(--ln)}
.fd-qa summary{cursor:pointer;list-style:none;padding:18px 40px 18px 0;font-weight:700;font-size:1.05rem;position:relative}
.fd-qa summary::-webkit-details-marker{display:none}
.fd-qa summary::after{content:'+';position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:1.5rem;font-weight:400;color:var(--rd)}
.fd-qa details[open] summary::after{content:'\2212'}
.fd-qa p{margin:0 0 18px;color:#4B5563;max-width:60ch}
.fd-ask{position:relative;border-radius:6px;overflow:hidden;min-height:440px;display:flex;align-items:flex-end;color:#fff;background:#0a0a0a}
.fd-ask-ph{position:absolute;inset:0;background-size:cover;background-position:center}
.fd-ask::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,10,10,.15),rgba(10,10,10,.92) 78%)}
.fd-ask-in{position:relative;z-index:2;padding:28px}.fd-ask-in h3{font-size:1.7rem;color:#fff}.fd-ask-in p{margin:8px 0 18px;color:#E5E7EB}
.fd-visit{position:relative;background:#0a0a0a}
.fd-map{height:560px}.fd-map iframe{display:block;width:100%;height:100%;border:0;filter:grayscale(.5) contrast(1.05)}
.fd-vwrap{position:relative;margin-top:-250px;padding-bottom:56px}
.fd-vcard{background:#fff;border-radius:6px;padding:30px 30px 28px;box-shadow:0 24px 60px rgba(0,0,0,.45)}
.fd-vcard h2{font-size:clamp(1.8rem,4vw,2.5rem);margin-bottom:18px}
.fd-week{display:grid;grid-template-columns:repeat(7,1fr);gap:10px}
.fd-day{border:1px solid #D1D5DB;border-radius:6px;padding:12px 6px;text-align:center;display:flex;flex-direction:column;gap:2px;min-width:0}
.fd-day small{font-weight:700;letter-spacing:.14em;font-size:.72rem;color:#6B7280}.fd-day b{font-size:1.02rem;font-weight:700}.fd-day span{font-weight:600;font-size:1rem}
.fd-day.appt{background:var(--soft);border-style:dashed}.fd-day.appt b,.fd-day.appt span{font-size:.9rem;font-weight:600}
.fd-day.today{background:var(--rd);border-color:var(--rd);color:#fff}.fd-day.today small{color:#fff}
.fd-vrow{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px 24px;margin-top:22px}
.fd-addr{margin:0;font-size:1.12rem}.fd-addr b{display:block}.fd-vrow .fd-cta{margin:0}
.fd-note{color:#4B5563;margin:14px 0 0}.fd-vcard .socials{margin:14px 0 0}.fd-vcard .socials a{color:var(--ink)}
.fd-foot{background:#0a0a0a;color:#fff;padding:30px 0 22px;border-top:1px solid rgba(255,255,255,.14)}
.fd-foot-in{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.fd-foot .socials a{color:#fff}.fd-legal{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:18px;font-size:.84rem;color:#9CA3AF}
.fd .socials{display:flex;gap:10px;margin-left:auto}
@media (prefers-reduced-motion:reduce){.fd-split,.fd-pn-bg{transition:none}.fd-marq{overflow-x:auto}.fd-marq-track{animation:none}.fd-pause{display:none}}
@media (max-width:980px){
 .fd-ab-grid,.fd-faq-grid{grid-template-columns:1fr;gap:40px}.fd-ab-ph{max-width:520px}
 .fd-quick{grid-template-columns:repeat(3,1fr)}
}
@media (max-width:900px){
 .fd-nav-in{grid-template-columns:1fr auto;gap:10px}.fd-links{display:none}.fd-brand{order:-1}.fd-nav .fd-st{display:none}
 .fd-mlinks{display:flex;gap:2px;overflow-x:auto;padding:0 12px;border-top:1px solid rgba(255,255,255,.14)}.fd-mlinks button{padding:9px 10px;white-space:nowrap;font-size:.8rem}
 .fd-hero-ph{width:100%;opacity:.55}.fd-hero-ph::after{background:linear-gradient(0deg,#0a0a0a 0%,rgba(10,10,10,.55) 60%,rgba(10,10,10,.2) 100%)}
 .fd-hero-in{min-height:0;padding-top:64px;padding-bottom:44px}
 .fd-split,.fd-split[data-open="a"],.fd-split[data-open="b"]{grid-template-columns:1fr;min-height:0}
 .fd-pn{min-height:340px}.fd-pn+.fd-pn{border-left:0;border-top:6px solid #0a0a0a}.fd-pn-in{padding:28px 22px 30px}.fd-pn-ul{columns:1}
 .fd-map{height:340px}.fd-vwrap{margin-top:0;padding-top:20px}
}
@media (max-width:620px){
 .fd-sec{padding:58px 0}.fd-services{padding-top:58px}.fd-wrap{padding:0 20px}
 .fd-brand b{font-size:1.25rem}.fd-hero h1{font-size:2.5rem}
 .fd-quick{grid-template-columns:repeat(2,1fr)}.fd-quick button{flex-direction:row;justify-content:flex-start;gap:12px;padding:16px 10px;text-align:left}.fd-ic svg{width:28px;height:28px}
 .fd-week{grid-template-columns:repeat(4,1fr)}.fd-vcard{padding:22px 18px}
 .fd-gal-h{flex-direction:column;align-items:flex-start}.fd-follow{flex-direction:column;align-items:flex-start}
 .fd-ab-box{left:46%;padding:14px 16px;min-width:120px}.fd-ab-box b{font-size:1.9rem}
 .fd-stats{gap:26px}.fd-faq-grid{gap:32px}
}
/* ---- Fade Babe marketing page ---- */
.mk-fade .mp-bar{border-bottom:4px solid #121212}
.mk-fade .mp-brand{color:#121212}
.mk-fade .mp-back{color:#C8202C}
.mk-fade .mp-cover{background:#121212;border-bottom:6px solid #C8202C;padding:44px 0 40px}
.mk-fade .mp-cover .mp-in{grid-template-columns:1.3fr 1fr;grid-template-rows:auto auto;gap:26px 48px;align-items:center}
.mk-fade .mp-cover-l{grid-column:1;grid-row:1}
.mk-fade .mp-wlogo{width:112px;height:112px;border-radius:50%;margin-bottom:22px;display:block;border:3px solid #fff}
.mk-fade .mp-eyebrow{color:#E23A46}
.mk-fade .mp-cover h1{color:#fff}
.mk-fade .mp-cover p{color:#D4D4D8}
.mk-fade .mp-meta{grid-column:1;grid-row:2;display:grid;grid-template-columns:1fr 1fr;gap:0 24px;margin:0}
.mk-fade .mp-meta dt{color:#A1A1AA}
.mk-fade .mp-photo{grid-column:2;grid-row:1/span 2;margin:0}
.mk-fade .mp-photo .ph{aspect-ratio:4/5;max-height:430px;width:100%;background-size:cover;background-position:center;border-radius:6px;border:3px solid #fff;box-shadow:8px 8px 0 #C8202C}
.mk-fade .mp-photo figcaption{color:#A1A1AA;font-size:.8rem;margin-top:12px}
.mk-fade .mp-label{border-top-color:#121212;color:#121212}
.mk-fade .mp-label span,.mk-fade .mo-num{color:#C8202C}
.mk-fade .mo-body h3,.mk-fade .mo-price b{color:#121212}
.mk-fade .mo-more li::before{background:#C8202C}
.mk-fade .mo-ex{background:#F3F4F6;border-left-color:#C8202C}
.mk-fade .mo-ex span{color:#C8202C}
@media (max-width:860px){.mk-fade .mp-cover .mp-in{grid-template-columns:1fr}.mk-fade .mp-photo{grid-column:1;grid-row:auto}.mk-fade .mp-photo .ph{aspect-ratio:4/3}.mk-fade .mp-meta{grid-template-columns:1fr}.mk-fade .mo-item{grid-template-columns:36px 1fr}.mk-fade .mo-price{grid-column:2;text-align:left}}
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
/* ===== WELBORN: bright painter's-tape layout (blue, black, white) ===== */
.wb{--ink:#0B0F14;--bl:#3981F0;--bd:#1B5FD6;--mist:#EEF3FA;--ln:#D9E1EC;--hf:'Barlow Condensed','Arial Narrow','Roboto Condensed',sans-serif;--bf:'Barlow',system-ui,sans-serif;background:#fff;color:var(--ink);font-family:var(--bf);font-weight:500;line-height:1.6}
.wb *{box-sizing:border-box}
.wb h1,.wb h2,.wb h3{font-family:var(--hf);font-weight:800;line-height:.98;margin:0;text-transform:uppercase;letter-spacing:.005em}
.wb :where(p){margin:0 0 14px}
.wb-wrap{max-width:1180px;margin:0 auto;padding:0 24px}.wb-wide{max-width:1360px}
.wb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:50px;padding:0 24px;border-radius:3px;border:2px solid var(--ink);font-family:var(--bf);font-weight:700;font-size:.98rem;letter-spacing:.02em;text-decoration:none;cursor:pointer;transition:background .15s,color .15s,border-color .15s}
.wb-btn.blue{background:var(--bd);border-color:var(--bd);color:#fff}.wb-btn.blue:hover{background:var(--ink);border-color:var(--ink)}
.wb-btn.line{background:transparent;color:var(--ink)}.wb-btn.line:hover{background:var(--ink);color:#fff}
.wb-btn.light{background:#fff;border-color:#fff;color:var(--ink)}.wb-btn.light:hover{background:var(--bl);border-color:var(--bl)}
.wb-btn.ghostl{background:transparent;border-color:rgba(255,255,255,.6);color:#fff}.wb-btn.ghostl:hover{background:#fff;color:var(--ink)}
.wb-btn.sm{min-height:42px;padding:0 18px;font-size:.92rem}.wb-btn .ico{width:16px;height:16px}
.wb-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}
.wb-tape{display:inline-block;background:var(--bl);color:var(--ink);font:700 .9rem/1 var(--hf);letter-spacing:.16em;text-transform:uppercase;padding:9px 22px;clip-path:polygon(0 0,100% 0,97% 50%,100% 100%,0 100%,3% 50%);margin-bottom:20px;transform:rotate(-1.5deg)}
.wb-tape.light{background:#fff}
.wb-logo{display:block;width:auto}.wb-logo.sm{height:58px}.wb-logo-t{font:800 1.4rem var(--hf);text-transform:uppercase}
.wb-top{background:var(--ink);color:#CBD5E1;font-size:.85rem;font-weight:600;letter-spacing:.04em}
.wb-top-in{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-top:8px;padding-bottom:8px}
.wb-top a{color:#fff;text-decoration:none;font-weight:700}
.wb-nav{position:sticky;top:0;z-index:30;background:#fff;border-bottom:3px solid var(--bl)}
.wb-nav-in{display:flex;align-items:center;gap:24px;padding-top:8px;padding-bottom:8px}
.wb-brand{display:block;flex:none}
.wb-links{display:flex;gap:4px;margin-left:auto}
.wb-links button,.wb-mlinks button{background:none;border:0;font:700 1.05rem var(--hf);letter-spacing:.1em;text-transform:uppercase;color:var(--ink);padding:10px 12px;cursor:pointer;border-bottom:3px solid transparent}
.wb-links button:hover,.wb-mlinks button:hover{border-bottom-color:var(--bl)}
.wb-mlinks{display:none}
.wb-brand-m{display:none}
.wb-hero{padding:60px 0 84px;background:linear-gradient(180deg,#fff,#F6F9FE)}
.wb-hero-g{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center}
.wb-hero h1{font-size:clamp(3rem,7.4vw,6rem);line-height:.92;margin-bottom:26px}
.wb-stroke{background:linear-gradient(var(--bl),var(--bl)) no-repeat 0 90%/0% .36em;-webkit-box-decoration-break:clone;box-decoration-break:clone;padding:0 .08em;margin:0 -.08em;animation:wbstroke .9s .5s cubic-bezier(.6,0,.2,1) forwards}
@keyframes wbstroke{to{background-size:100% .36em}}
.wb-lead{font-size:1.25rem;max-width:44ch;color:#334155}
.wb-trust{list-style:none;margin:38px 0 0;padding:20px 0 0;border-top:2px solid var(--ink);display:flex;flex-wrap:wrap;gap:12px 36px}
.wb-trust b{display:block;font:800 2.1rem/1 var(--hf);text-transform:uppercase}.wb-trust span{font-size:.8rem;letter-spacing:.1em;text-transform:uppercase;color:#475569;font-weight:700}
.wb-hero-ph{position:relative;height:640px}
.wb-hp{position:absolute;overflow:hidden;border-radius:3px;background:#CBD5E1}
.wb-hp span{display:block;width:100%;height:100%;background-size:cover;background-position:center}
.wb-hp-a{right:0;top:0;width:70%;height:86%;box-shadow:14px 14px 0 var(--bl)}
.wb-hp-b{left:0;bottom:0;width:46%;height:42%;border:8px solid #fff;box-shadow:0 16px 34px rgba(11,15,20,.28)}
.wb-hp-c{left:0;top:7%;width:27%;height:29%;border:6px solid #fff;box-shadow:0 12px 26px rgba(11,15,20,.22)}
.wb-roll{position:absolute;inset:0;background:var(--bl);animation:wbroll 1.1s .25s cubic-bezier(.7,0,.2,1) forwards}
@keyframes wbroll{to{transform:translateX(102%)}}
.wb-corner{position:absolute;right:-22px;bottom:18px;width:84px;height:84px;border:7px solid var(--ink);transform:rotate(45deg);z-index:-1}
.wb-band{background:var(--bl);color:var(--ink);padding:16px 0}
.wb-band-in{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:8px 22px}
.wb-band-in span{font:800 1.35rem/1 var(--hf);text-transform:uppercase;letter-spacing:.08em}
.wb-band-in i{width:9px;height:9px;background:var(--ink);transform:rotate(45deg);flex:none}
.wb-sec{padding:88px 0}.wb-mist{background:var(--mist)}.wb-ink{background:var(--ink);color:#fff}
.wb-sh{margin-bottom:42px;max-width:660px}.wb-sh h2,.wb-ab-g h2,.wb-faq-g h2{font-size:clamp(2.6rem,5.2vw,4rem)}
.wb-sh p{margin-top:14px;color:#475569;font-size:1.1rem}
.wb-hero-g>*,.wb-ab-g>*,.wb-faq-g>*,.wb-ct-g>*,.wb-chips>*,.wb-revs>*{min-width:0}
.wb-facts dd{overflow-wrap:anywhere}
.wb-chips{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}
.wb-chip{background:#fff;border:1px solid var(--ln);border-radius:3px;overflow:hidden;box-shadow:0 10px 24px rgba(11,15,20,.08);transition:transform .25s,box-shadow .25s;display:flex;flex-direction:column}
.wb-chip:hover{transform:translateY(-6px);box-shadow:0 18px 34px rgba(11,15,20,.14)}
.wb-chip-top{position:relative;padding:22px 22px 20px;min-height:218px;color:#fff;display:flex;flex-direction:column;justify-content:space-between}
.wb-art{position:absolute;right:16px;top:14px;width:150px;height:120px;transition:transform .3s}.wb-art svg{display:block;width:100%;height:100%}
.wb-chip:hover .wb-art{transform:translateY(-4px) rotate(-2deg)}
.wb-chip-top b{font:700 1.15rem var(--hf);letter-spacing:.14em}.wb-chip-top h3{font-size:2.1rem}
.wb-chip-body{padding:20px 22px 22px;flex:1;display:flex;flex-direction:column}
.wb-chip-body p{color:#475569;font-size:.98rem}
.wb-chip-body ul{list-style:none;margin:0;padding:0}
.wb-chip-body li{position:relative;padding:7px 0 7px 20px;font-weight:600}
.wb-chip-body li::before{content:'';position:absolute;left:0;top:15px;width:8px;height:8px;background:var(--bl)}
.wb-chip-call{display:block;margin-top:auto;padding-top:16px;border-top:2px dashed var(--ln);font-weight:700;color:var(--bd);text-decoration:none}
.wb-chip-body ul+.wb-chip-call{margin-top:18px}
.wb-work h2{color:#fff;font-size:clamp(2.6rem,5.2vw,4rem)}
.wb-work-h{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;margin-bottom:34px}
.wb-sub{color:#CBD5E1;max-width:52ch;margin-top:14px;font-size:1.05rem}
.wb-ctl{display:flex;align-items:center;gap:10px}
.wb-cnt{font:700 1.3rem var(--hf);letter-spacing:.1em;color:#94A3B8;margin-right:10px}
.wb-arw,.wb-pause{min-height:48px;border:2px solid #fff;border-radius:3px;background:transparent;color:#fff;cursor:pointer;font-family:var(--bf);font-weight:700}
.wb-arw{width:48px;font-size:1.9rem;line-height:1}.wb-pause{padding:0 18px;font-size:.92rem;margin-left:6px}
.wb-arw:hover,.wb-pause:hover{background:var(--bl);border-color:var(--bl);color:var(--ink)}
.wb-view{overflow:hidden;outline-offset:6px}.wb-view:focus-visible{outline:3px solid var(--bl)}
.wb-track{display:flex;will-change:transform}
.wb-slide{flex:none;margin:0;padding:0 8px;position:relative}
.wb-slide>button{display:block;width:100%;padding:0;border:0;background:none;cursor:zoom-in;border-radius:3px;overflow:hidden}
.wb-ph{display:block;aspect-ratio:4/5;background-size:cover;background-position:center;background-color:#1E293B}
.wb-slide figcaption{position:absolute;left:8px;right:8px;bottom:0;padding:70px 22px 20px;background:linear-gradient(180deg,rgba(11,15,20,0),rgba(11,15,20,.88));pointer-events:none;border-radius:0 0 3px 3px}
.wb-slide em{display:inline-block;font:700 .9rem/1 var(--hf);font-style:normal;letter-spacing:.14em;text-transform:uppercase;background:var(--bl);color:var(--ink);padding:6px 14px;clip-path:polygon(0 0,100% 0,96% 50%,100% 100%,0 100%,4% 50%)}
.wb-slide b{display:block;margin-top:9px;font-size:1.08rem;font-weight:600;color:#fff}
.wb-dots{display:flex;justify-content:center;gap:6px;margin-top:26px;flex-wrap:wrap}
.wb-dots button{width:34px;height:22px;border:0;background:none;padding:0;cursor:pointer;position:relative}
.wb-dots button::before{content:'';position:absolute;left:0;right:0;top:8px;height:6px;border-radius:2px;background:#334155;transition:background .2s}
.wb-dots button.on::before{background:var(--bl)}
.wb-follow{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-start;gap:14px 28px;margin-top:40px;padding:22px 24px;border:1px solid rgba(255,255,255,.3);border-radius:3px}
.wb-follow b{font:800 1.6rem var(--hf);text-transform:uppercase;letter-spacing:.04em}
.wb-revs{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.wb-rev{margin:0;background:#fff;border:1px solid var(--ln);border-top:6px solid var(--bl);padding:30px 26px 26px;box-shadow:0 10px 24px rgba(11,15,20,.06);border-radius:3px}
.wb-rev blockquote{margin:0;font-size:1.22rem;font-weight:600;line-height:1.5}
.wb-rev blockquote::before{content:'\201C';display:block;font:800 4.2rem/.6 var(--hf);color:var(--bl);margin-bottom:12px}
.wb-rev figcaption{margin-top:20px;display:flex;gap:10px;align-items:baseline}.wb-rev figcaption b{font:800 1.3rem var(--hf);text-transform:uppercase;letter-spacing:.06em}.wb-rev figcaption span{color:#64748B;font-size:.88rem}
.wb-ab-g{display:grid;grid-template-columns:1.1fr .9fr;gap:64px;align-items:center}
.wb-ab-g p{font-size:1.1rem;color:#334155;max-width:56ch}.wb-ab-g h2{margin-bottom:22px}
.wb-facts{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:0}
.wb-facts div{background:#fff;border-left:7px solid var(--bl);padding:20px 22px;border-radius:3px;box-shadow:0 8px 20px rgba(11,15,20,.06)}
.wb-facts dd{margin:0;font:800 2.8rem/1 var(--hf);text-transform:uppercase}.wb-facts dt{margin-top:6px;font-size:.8rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#475569}
.wb-faq-g{display:grid;grid-template-columns:1fr 1.7fr;gap:56px;align-items:start}
.wb-qa details{border-top:2px solid var(--ink)}.wb-qa details:last-child{border-bottom:2px solid var(--ink)}
.wb-qa summary{cursor:pointer;list-style:none;padding:20px 44px 20px 0;font-weight:700;font-size:1.12rem;position:relative}
.wb-qa summary::-webkit-details-marker{display:none}
.wb-qa summary::after{content:'+';position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:1.7rem;font-weight:500;color:var(--bd)}
.wb-qa details[open] summary::after{content:'\2212'}
.wb-qa p{margin:0 0 20px;color:#475569;max-width:62ch}
.wb-contact{background:var(--bl);padding:84px 0}
.wb-ct-g{display:grid;grid-template-columns:1fr 1fr;gap:0;box-shadow:16px 16px 0 var(--ink)}
.wb-ct-card{background:var(--ink);color:#fff;padding:52px 48px}
.wb-ct-card h2{font-size:clamp(2.4rem,4.6vw,3.6rem);color:#fff;margin-bottom:16px}
.wb-ct-card p{color:#CBD5E1;font-size:1.08rem}
.wb-phone{display:inline-block;margin:10px 0 6px;font:800 clamp(2.6rem,6vw,3.8rem)/1 var(--hf);color:#fff;text-decoration:none;border-bottom:5px solid var(--bl)}
.wb .wb-note{margin-top:24px;font-size:.92rem;color:#94A3B8}
.wb-map{min-height:460px;background:#CBD5E1}.wb-map iframe{display:block;width:100%;height:100%;min-height:460px;border:0}
.wb .socials{display:flex;gap:10px;margin-top:20px}.wb .socials a{display:grid;place-items:center;width:44px;height:44px;border:1.5px solid rgba(255,255,255,.5);color:#fff;border-radius:3px}.wb .socials a:hover{background:var(--bl);border-color:var(--bl);color:var(--ink)}
.wb-foot{background:var(--ink);color:#CBD5E1;padding:26px 0 22px}
.wb-foot-in{display:flex;align-items:center;gap:16px;flex-wrap:wrap}.wb-foot-in .socials{margin:0 0 0 auto}
.wb-plate{display:inline-flex;background:#fff;padding:6px 12px;border-radius:3px}.wb-plate .wb-logo.sm{height:34px}
.wb-legalw{margin-top:18px}.wb-legal{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding-top:14px;border-top:1px solid #1F2937;font-size:.85rem;color:#94A3B8}
@media (max-width:1000px){.wb-chips{grid-template-columns:repeat(2,1fr)}.wb-revs{grid-template-columns:1fr}}
@media (max-width:900px){
 .wb-links{display:none}.wb-nav-in .wb-btn{margin-left:auto}
 .wb-mlinks{display:flex;justify-content:space-between;gap:0;padding:0 10px 4px;border-top:1px solid var(--ln)}.wb-mlinks button{white-space:nowrap;padding:9px 2px;font-size:clamp(.6rem,2.85vw,.82rem);letter-spacing:.03em}
 .wb-brand .wb-logo{display:none}.wb-brand,.wb-brand:hover{text-decoration:none}.wb-nav-in{gap:10px}.wb-brand-m{display:flex;align-items:center;gap:8px;min-width:0}.wb-ic{height:50px;width:auto;display:block;flex:none}.wb-bn{display:flex;flex-direction:column;line-height:1}.wb-bn b{font:800 clamp(1.25rem,6vw,1.7rem) var(--hf);text-transform:uppercase;color:var(--bd);letter-spacing:.01em}.wb-bn i{font:700 clamp(.5rem,2.4vw,.68rem) var(--hf);font-style:normal;text-transform:uppercase;letter-spacing:.1em;white-space:nowrap;color:var(--ink);margin-top:3px}
 .wb-hero{padding:36px 0 60px}.wb-hero-g,.wb-ab-g,.wb-faq-g,.wb-ct-g{grid-template-columns:1fr}.wb-hero-g,.wb-faq-g{gap:36px}.wb-ab-g{gap:36px}
 .wb-hero-ph{height:460px}.wb-corner{display:none}
 .wb-sec{padding:60px 0}.wb-contact{padding:56px 0}.wb-ct-card{padding:36px 26px}.wb-ct-g{box-shadow:10px 10px 0 var(--ink)}
}
@media (max-width:560px){
 .wb-wrap{padding:0 18px}.wb-logo.sm{height:50px}.wb-top-in span{display:none}.wb-top-in{justify-content:center}
 .wb-chips{grid-template-columns:1fr}.wb-facts{grid-template-columns:1fr 1fr;gap:12px}.wb-facts div{padding:16px 14px}.wb-facts dd{font-size:1.9rem}
 .wb-hero-ph{height:400px}.wb-logo.sm{height:40px}.wb-work-h{align-items:flex-start}
 .wb-follow b{font-size:1.4rem}.wb-ct-card{padding:30px 22px}
}
@media (prefers-reduced-motion:reduce){.wb-art{transition:none}.wb-stroke{animation:none;background-size:100% .36em}.wb-roll{display:none}.wb-chip{transition:none}}
/* ---- Welborn fix-it finder ---- */
.wb-finder{padding-top:72px}
.wb-fsteps{list-style:none;display:grid;grid-template-columns:repeat(3,1fr);gap:0;margin:0 0 12px;padding:0;counter-reset:none}
.wb-fsteps li{display:flex;align-items:center;gap:12px;padding:14px 18px;background:#fff;border:1px solid var(--ln);border-top:5px solid var(--ln);color:#64748B;font-weight:700}
.wb-fsteps li b{display:grid;place-items:center;width:32px;height:32px;border-radius:3px;background:var(--ln);color:var(--ink);font:800 1.15rem var(--hf);flex:none}
.wb-fsteps li.now{border-top-color:var(--bl);color:var(--ink)}.wb-fsteps li.now b{background:var(--bl)}
.wb-fsteps li.done{border-top-color:var(--ink);color:var(--ink)}.wb-fsteps li.done b{background:var(--ink);color:#fff}
.wb-fhint{margin:0 0 26px;font-weight:700;color:var(--bd);font-size:1.05rem;min-height:1.6em}
.wb-fblock{margin-bottom:28px;transition:opacity .25s}.wb-fblock.dim{opacity:.45}
.wb-fblock>h3{display:flex;align-items:center;gap:12px;font-size:1.7rem;margin-bottom:16px}
.wb-fblock>h3 span{display:grid;place-items:center;width:34px;height:34px;background:var(--ink);color:#fff;border-radius:3px;font-size:1.2rem}
.wb-fps{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.wb-fp{display:flex;align-items:center;gap:16px;text-align:left;background:#fff;border:2px solid var(--ln);border-radius:3px;padding:16px 18px;font:700 1.05rem var(--bf);color:var(--ink);cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s}
.wb-fp:hover{border-color:var(--bl);transform:translateY(-2px)}
.wb-fp.on{border-color:var(--ink);box-shadow:6px 6px 0 var(--bl)}
.wb-fic{flex:none;display:grid;place-items:center;width:52px;height:52px;background:var(--mist);color:var(--bd);border-radius:3px}.wb-fic svg{width:34px;height:34px}
.wb-fp.on .wb-fic{background:var(--bl);color:var(--ink)}
.wb-frs{display:flex;flex-wrap:wrap;gap:10px}
.wb-fr{background:#fff;border:2px solid var(--ln);border-radius:3px;padding:12px 18px;min-height:48px;font:700 1rem var(--bf);color:var(--ink);cursor:pointer;transition:border-color .15s,background .15s}
.wb-fr:hover{border-color:var(--bl)}.wb-fr.on{background:var(--ink);border-color:var(--ink);color:#fff}
.wb-fblock.dim .wb-fr{cursor:default}
.wb-fres{display:grid;grid-template-columns:1.1fr 1fr;gap:0;margin-top:8px;background:var(--ink);color:#fff;border-radius:3px;box-shadow:12px 12px 0 var(--bl)}
.wb-fres[hidden]{display:none}
.wb-fres-l{padding:34px 34px 30px}.wb-fres-r{padding:34px;border-left:1px solid #1F2937}
.wb-fres h3{font-size:clamp(2.2rem,4.4vw,3.2rem);color:#fff;margin-bottom:14px}
.wb-fres p{color:#CBD5E1;max-width:52ch}.wb-fres p b{color:#fff}
.wb-ftip{color:#94A3B8!important;font-size:.95rem}
.wb-fnext{font:800 1.3rem var(--hf)!important;text-transform:uppercase;letter-spacing:.1em;color:#fff!important}
.wb-fres .wb-cta{margin-top:12px}
.wb-fres .wb-btn.line{border-color:#fff;color:#fff}.wb-fres .wb-btn.line:hover{background:#fff;color:var(--ink)}
.wb-fcopied{display:block;margin-top:12px;font-size:.92rem;color:#7FB0FF;min-height:1.2em}
.wb-fsub{margin:0 0 4px}.wb-fmore{display:flex;flex-wrap:wrap;gap:4px 22px;margin-top:14px}
.wb-fcopy,.wb-freset{background:none;border:0;padding:8px 0;color:#CBD5E1;font:600 .95rem var(--bf);text-decoration:underline;cursor:pointer}.wb-fcopy:hover,.wb-freset:hover{color:#fff}
.wb-fdemo{margin-top:18px!important;font-size:.85rem;color:#94A3B8!important;border-top:1px dashed #334155;padding-top:14px}
@media (max-width:900px){.wb-fps{grid-template-columns:repeat(2,1fr)}.wb-fres{grid-template-columns:1fr}.wb-fres-r{border-left:0;border-top:1px solid #1F2937}.wb-fres{box-shadow:8px 8px 0 var(--bl)}}
@media (max-width:560px){.wb-fsteps{grid-template-columns:1fr}.wb-fsteps li{padding:10px 14px}.wb-fps{grid-template-columns:1fr}.wb-fres-l,.wb-fres-r{padding:26px 22px}.wb-finder{padding-top:52px}}
/* ---- Big Bill's: chalkboard deli ---- */
.bb{--bk:#0F1914;--bk2:#182720;--mu:#F5B800;--md:#C99700;--tm:#D8372B;--ch:#EAF0EC;--ln:#E3E7E4;--hf:'Alfa Slab One','Rockwell',Georgia,serif;--bf:'Work Sans',system-ui,sans-serif;background:#fff;color:#14201A;font-family:var(--bf);font-weight:500;line-height:1.6}
.bb *{box-sizing:border-box}.bb h1,.bb h2,.bb h3,.bb p,.bb ul{margin:0}.bb ul{padding:0;list-style:none}.bb button{font-family:inherit}
.bb-wrap{max-width:1140px;margin:0 auto;padding:0 24px;min-width:0}
.bb-top{background:var(--tm);color:#fff;font-size:.85rem;font-weight:700;letter-spacing:.05em}.bb-top-in{display:flex;justify-content:space-between;gap:12px;padding-top:8px;padding-bottom:8px}.bb-top a{color:#fff;text-decoration:none}
.bb-nav{position:sticky;top:0;z-index:30;background:var(--bk);border-bottom:4px solid var(--mu)}
.bb-nav-in{display:flex;align-items:center;gap:24px;padding-top:10px;padding-bottom:10px}
.bb-brand{display:block;flex:none;text-decoration:none}.bb-logo{display:block;height:64px;width:auto;background:#fff;padding:5px 10px;border-radius:4px}
.bb-word{display:flex;flex-direction:column;line-height:1}.bb-word b{font:400 1.7rem var(--hf);color:var(--mu);letter-spacing:.01em}.bb-word i{font:700 .62rem var(--bf);font-style:normal;color:var(--ch);letter-spacing:.2em;text-transform:uppercase;margin-top:4px}
.bb-links{display:flex;gap:4px;margin-left:auto}.bb-links button,.bb-mlinks button{background:none;border:0;color:var(--ch);font:700 .92rem var(--bf);letter-spacing:.08em;text-transform:uppercase;padding:10px 12px;cursor:pointer;border-bottom:3px solid transparent}.bb-links button:hover,.bb-mlinks button:hover{border-bottom-color:var(--mu);color:#fff}
.bb-mlinks{display:none}
.bb-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:12px 22px;border-radius:6px;font:800 1rem var(--bf);text-decoration:none;cursor:pointer;border:2px solid transparent;line-height:1.1}
.bb-btn.mu{background:var(--mu);color:#14201A}.bb-btn.mu:hover{background:#FFC91F}.bb-btn.sm{min-height:42px;padding:8px 18px}.bb-btn.ghost,.bb-btn.line{background:transparent;color:var(--ch);border-color:rgba(234,240,236,.55)}.bb-btn.ghost:hover,.bb-btn.line:hover{border-color:var(--mu);color:var(--mu)}
.bb-tag{display:inline-block;background:var(--mu);color:#14201A;font:800 .78rem var(--bf);letter-spacing:.18em;text-transform:uppercase;padding:6px 14px;border-radius:3px;transform:rotate(-1.5deg)}
/* hero: chalkboard */
.bb-hero{background:radial-gradient(1200px 500px at 70% 0%,#1E3329 0%,var(--bk) 62%);color:var(--ch);padding:64px 0 70px;position:relative;overflow:hidden}
.bb-hero::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(115deg,rgba(255,255,255,.025) 0 2px,transparent 2px 9px);pointer-events:none}
.bb-hero-g{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center;position:relative;z-index:1}
.bb-hero h1{font:400 clamp(2.6rem,6.4vw,5rem)/1.02 var(--hf);color:#fff;margin:20px 0 16px}.bb-hero h1 em{font-style:normal;color:var(--mu)}
.bb-lead{font-size:1.2rem;max-width:34em;color:#C9D6CF}.bb-cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:26px}.bb-open{margin-top:22px;font-size:.98rem;color:#C9D6CF}.bb-open b{color:var(--mu)}
.bb-heroart{position:relative;display:flex;align-items:flex-end;justify-content:center;gap:0;min-height:340px}.bb-stack{width:76%;height:auto;filter:drop-shadow(0 24px 24px rgba(0,0,0,.45))}.bb-mug{flex:none;width:22%;max-width:120px;margin-left:-2%;margin-bottom:6px;filter:drop-shadow(0 12px 12px rgba(0,0,0,.4))}
.bb-stack .bbl,.bb-live .bbl{animation:bbDrop .5s cubic-bezier(.2,.8,.3,1) both;animation-delay:calc(var(--i)*55ms)}
@keyframes bbDrop{0%{transform:translateY(-90px);opacity:0}55%{opacity:1}70%{transform:translateY(7px)}85%{transform:translateY(-3px)}100%{transform:none;opacity:1}}
.bbst{animation:bbUp 2.8s ease-in-out infinite;transform-box:fill-box}@keyframes bbUp{0%{opacity:0;transform:translateY(8px)}35%{opacity:.75}100%{opacity:0;transform:translateY(-14px)}}
.bb-steam{animation:bbSteam 3.2s ease-in-out infinite}@keyframes bbSteam{0%,100%{transform:translateY(0);opacity:.35}50%{transform:translateY(-6px);opacity:.8}}
@media (prefers-reduced-motion:reduce){.bb-stack .bbl,.bb-live .bbl,.bb-steam,.bbst{animation:none}.bbst{opacity:.5}}
.bb-band{background:var(--mu);color:#14201A}.bb-band-in{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px 22px;padding-top:14px;padding-bottom:14px;font:400 1.15rem var(--hf);letter-spacing:.03em}.bb-band-in i{width:9px;height:9px;background:var(--tm);transform:rotate(45deg);flex:none}
.bb-sec{padding:76px 0}.bb-sh{margin-bottom:34px;max-width:46em}.bb-sh h2{font:400 clamp(2rem,4.4vw,3.1rem)/1.08 var(--hf);margin:16px 0 10px}.bb-sh p{color:#4A5A52;font-size:1.08rem}.bb-sh.light h2{color:#fff}.bb-sh.light p{color:#C9D6CF}
/* builder */
.bb-build{background:linear-gradient(180deg,#F4F7F5,#E9EFEC)}
.bb-bg{display:grid;grid-template-columns:1.1fr .9fr;gap:30px;align-items:start}
.bb-bench{background:#fff;border:3px solid var(--bk);border-radius:12px;padding:20px;box-shadow:8px 8px 0 var(--bk)}
.bb-mini{display:none}
.bb-tabs{list-style:none;margin:0 0 18px;padding:0;display:flex;gap:6px;overflow:hidden}
.bb-tabs li{flex:1 1 0;min-width:0}
.bb-tabs button{width:100%;display:flex;flex-direction:column;align-items:center;gap:5px;background:none;border:0;border-bottom:4px solid #D5DDD8;padding:6px 2px 8px;font:800 .78rem var(--bf);letter-spacing:.06em;text-transform:uppercase;color:#6B7A72;cursor:pointer}
.bb-tabs button span{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#E3E9E5;color:#14201A;font:400 .85rem var(--hf)}
.bb-tabs button.on{border-bottom-color:var(--mu);color:#14201A}.bb-tabs button.on span{background:var(--bk);color:var(--mu)}
.bb-tabs button.done span{background:var(--tm);color:#fff}.bb-tabs button.done{border-bottom-color:var(--tm)}
.bb-panel h3{font:400 clamp(1.4rem,2.6vw,1.9rem)/1.1 var(--hf);margin-bottom:14px;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px}.bb-panel h3 small{font:600 .85rem var(--bf);color:#6B7A72}
.bb-tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
.bb-tile{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;padding:14px 6px 12px;background:#fff;border:2px solid #D5DDD8;border-radius:10px;cursor:pointer;font-family:var(--bf);color:#14201A;transition:transform .15s,box-shadow .15s,border-color .15s}
.bb-tile:hover{transform:translateY(-3px);border-color:var(--bk);box-shadow:0 6px 0 rgba(15,25,20,.12)}
.bb-ti{display:grid;place-items:center;width:78px;height:78px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,#E7EDE9)}.bb-ti svg{width:60px;height:60px}
.bb-tile b{font:800 .95rem/1.15 var(--bf);text-align:center}.bb-tp{font:700 .8rem var(--bf);font-style:normal;color:#5C6B63;background:#EEF2EF;border-radius:20px;padding:2px 10px}.bb-tile.on .bb-tp{background:var(--mu);color:#14201A}
.bb-ck{position:absolute;top:8px;right:8px;display:none;place-items:center;width:24px;height:24px;border-radius:50%;background:var(--tm);color:#fff;font-style:normal;font-weight:800;font-size:.85rem}
.bb-tile.on{background:var(--bk);border-color:var(--bk);color:#fff;box-shadow:0 5px 0 var(--mu);transform:translateY(-2px)}.bb-tile.on .bb-ti{background:radial-gradient(circle at 35% 30%,#fff,#DCE5DF)}.bb-tile.on .bb-ck{display:grid}
.bb-tile:focus-visible,.bb-tabs button:focus-visible{outline:3px solid var(--mu);outline-offset:2px}
.bb-bnav{display:flex;justify-content:space-between;gap:12px;margin-top:20px}.bb-bnav .bb-btn{min-width:130px}.bb-bnav .bb-btn.dark{color:#14201A;border-color:#14201A}.bb-bnav .bb-btn.dark:hover{background:#14201A;color:#fff}
/* the stage */
.bb-stage{position:sticky;top:96px;background:radial-gradient(500px 300px at 50% 18%,#26403A 0%,var(--bk) 70%);color:var(--ch);border-radius:12px;padding:20px 22px 24px;box-shadow:8px 8px 0 var(--mu);border:3px solid var(--bk)}
.bb-st-h{display:flex;justify-content:space-between;align-items:center;font:800 .8rem var(--bf);letter-spacing:.2em;text-transform:uppercase;color:var(--mu);border-bottom:2px dashed rgba(234,240,236,.3);padding-bottom:10px}.bb-st-h i{font-style:normal;color:#9FB3A9;letter-spacing:.14em}
.bb-plate{position:relative;margin:14px 0 6px;padding-top:6px}
.bb-art{height:290px;display:flex;align-items:flex-end;justify-content:center;position:relative;z-index:2;margin-bottom:-14px}
.bb-live{display:block;width:100%;height:100%;filter:drop-shadow(0 10px 8px rgba(0,0,0,.35))}
.bb-cutb{height:30px;border-radius:40px/16px;background:repeating-linear-gradient(92deg,rgba(0,0,0,.07) 0 2px,transparent 2px 9px),linear-gradient(180deg,#C48B52,#94622F);box-shadow:0 12px 0 #5E3D1C,0 18px 20px rgba(0,0,0,.45),inset 0 3px 0 rgba(255,255,255,.28);position:relative;z-index:1}
.bb-stage h3{font:400 1.6rem var(--hf);color:#fff;text-align:center;margin:24px 0 10px}
.bb-tk-l{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 8px;margin-bottom:16px}.bb-tk-l li{padding:4px 12px;border:1.5px solid rgba(234,240,236,.35);border-radius:20px;font:700 .85rem var(--bf);color:#D4E0D9;background:rgba(255,255,255,.05)}
.bb-price{margin:14px 0 16px;border-top:2px dashed rgba(234,240,236,.3);padding-top:12px}.bb-price ul{display:grid;gap:4px;margin-bottom:8px}.bb-price li{display:flex;justify-content:space-between;gap:12px;font-weight:600;font-size:.95rem;color:#C9D6CF}.bb-price li b{font-weight:700;color:#fff}.bb-total{display:flex;justify-content:space-between;align-items:baseline;border-top:2px solid rgba(234,240,236,.3);padding-top:10px}.bb-total span{font:800 .85rem var(--bf);letter-spacing:.16em;text-transform:uppercase;color:var(--mu)}.bb-total b{font:400 2rem var(--hf);color:#fff}
.bb-tk-a{display:flex;flex-wrap:wrap;gap:10px}.bb-tk-a .bb-btn{flex:1 1 150px}
.bb-copy{background:none;border:0;color:#C9D6CF;text-decoration:underline;font:700 .95rem var(--bf);padding:10px 0;cursor:pointer;flex:1 1 100%;text-align:left}.bb-copy:hover{color:#fff}
.bb-copied{display:block;min-height:1.2em;color:var(--mu);font-weight:700;font-size:.9rem}
.bb-fine{margin-top:10px;font-size:.82rem;color:#9FB3A9;border-top:1px dashed rgba(234,240,236,.25);padding-top:12px}
/* ---- Big Bill's extras ---- */
.bb-dot{display:inline-block;width:11px;height:11px;border-radius:50%;background:#9A9F9C;margin-right:8px;vertical-align:baseline}.bb-dot.on{background:#3DDC6B;box-shadow:0 0 0 4px rgba(61,220,107,.25);animation:bbPulse 2s infinite}
@keyframes bbPulse{50%{box-shadow:0 0 0 8px rgba(61,220,107,0)}}
.bb-open.dark{color:#14201A;margin:0 0 10px}.bb-open.dark b{color:#14201A}
.bb-daily{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px;background:var(--bk);color:var(--ch);border-radius:10px;padding:14px 20px;margin:-8px 0 26px;box-shadow:6px 6px 0 var(--mu)}
.bb-daily>div{flex:1 1 260px;display:flex;flex-direction:column;gap:2px}.bb-daily b{font:400 1.25rem var(--hf);color:#fff}.bb-daily span:not(.bb-tag){font-size:.92rem;color:#B9C8BF}
.bb-presets,.bb-diet{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:12px}
.bb-presets>span,.bb-diet>span{font:800 .75rem var(--bf);letter-spacing:.16em;text-transform:uppercase;color:#6B7A72;margin-right:2px}
.bb-presets button{background:#F4F7F5;border:2px solid #CBD5CF;border-radius:20px;padding:7px 14px;font:700 .85rem var(--bf);color:#14201A;cursor:pointer}.bb-presets button:hover{border-color:var(--bk);background:#fff}
.bb-presets button.sur{background:var(--mu);border-color:var(--mu)}.bb-presets button.sur:hover{background:#FFC91F}
.bb-diet{margin-bottom:16px}.bb-diet button{background:#fff;border:2px solid #CBD5CF;border-radius:6px;padding:6px 12px;font:700 .82rem var(--bf);color:#14201A;cursor:pointer}.bb-diet button.on{background:var(--bk);border-color:var(--bk);color:#fff}
.bb-presets button:focus-visible,.bb-diet button:focus-visible,.bb-kc:focus-visible,.bb-nm:focus-visible,.bb-fld select:focus-visible,.bb-fld input:focus-visible,.bb-fld textarea:focus-visible,.bb-art:focus-visible{outline:3px solid var(--mu);outline-offset:2px}
.bb-panel h4{font:800 .8rem var(--bf);letter-spacing:.16em;text-transform:uppercase;color:#6B7A72;margin:14px 0 10px}
.bb-tile.off{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none}.bb-tile.off:hover{transform:none;border-color:#D5DDD8;box-shadow:none}
.bb-dnote{margin-top:14px;font-size:.8rem;color:#6B7A72}
.bb-tabs button{font-size:.7rem;letter-spacing:.03em}
.bb-art{cursor:zoom-in;overflow:visible}.bb-plate.zoom{overflow:hidden;border-radius:10px}.bb-plate.zoom .bb-art{cursor:zoom-out}.bb-plate.zoom .bb-live{transform:scale(1.7);transform-origin:50% 66%}.bb-live{transition:transform .35s cubic-bezier(.3,.8,.3,1)}
.bb-zh{display:block;text-align:center;font:600 .76rem var(--bf);letter-spacing:.08em;color:#8FA399;margin-top:12px}
.bb-nm{display:block;width:100%;margin:6px 0 14px;background:rgba(255,255,255,.07);border:2px dashed rgba(234,240,236,.35);border-radius:8px;padding:9px 12px;color:#fff;font:700 .95rem var(--bf);text-align:center}.bb-nm::placeholder{color:#8FA399}
.bb-stage h3{margin:10px 0 4px}
.bb-tk-s{display:flex;flex-wrap:wrap;gap:4px 18px;flex:1 1 100%}.bb-tk-s .bb-copy{flex:0 0 auto}
.bb-saved{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;margin-top:8px}.bb-saved b{font:800 .72rem var(--bf);letter-spacing:.14em;text-transform:uppercase;color:var(--mu);flex:1 1 100%}
.bb-sv{display:inline-flex;border:1.5px solid rgba(234,240,236,.35);border-radius:20px;overflow:hidden}.bb-sv button{background:rgba(255,255,255,.06);border:0;color:#fff;font:700 .82rem var(--bf);padding:6px 12px;cursor:pointer}.bb-sv .x{padding:6px 10px;color:#9FB3A9;border-left:1px solid rgba(234,240,236,.25)}
/* coffee */
.bb-coffee{background:radial-gradient(900px 400px at 20% 0%,#1E3329 0%,var(--bk) 60%);color:var(--ch)}
.bb-kwrap{display:grid;grid-template-columns:1.2fr .8fr;gap:28px;align-items:start}
.bb-kg{display:grid;gap:14px}.bb-kgrp{background:rgba(255,255,255,.05);border:1.5px solid rgba(234,240,236,.2);border-radius:10px;padding:14px 16px}.bb-kgrp h4{font:800 .78rem var(--bf);letter-spacing:.16em;text-transform:uppercase;color:var(--mu);margin:0 0 10px}
.bb-kchips{display:flex;flex-wrap:wrap;gap:8px}.bb-kc{min-height:44px;background:transparent;border:2px solid rgba(234,240,236,.35);border-radius:6px;padding:8px 16px;color:var(--ch);font:700 .92rem var(--bf);cursor:pointer}.bb-kc i{font-style:normal;font-weight:600;color:#9FB3A9;font-size:.82rem}
.bb-kc:hover{border-color:var(--mu)}.bb-kc.on{background:var(--mu);border-color:var(--mu);color:#14201A}.bb-kc.on i{color:#4A3A00}.bb-kc:disabled{opacity:.35;cursor:not-allowed}
.bb-kcard,.bb-gcard{position:sticky;top:96px;background:#fff;color:#14201A;border:3px solid var(--bk);border-radius:12px;padding:20px 22px 24px;box-shadow:8px 8px 0 var(--mu)}
.bb-kcard .bb-st-h,.bb-gcard .bb-st-h{color:var(--tm);border-bottom-color:#D5DDD8}.bb-kcard .bb-st-h i,.bb-gcard .bb-st-h i{color:#6B7A72}
.bb-cupbox{height:230px;overflow:hidden;display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,#2A4036,var(--bk));border-radius:8px;margin:14px 0 10px}.bb-cupsvg{height:100%;max-height:100%;width:auto;display:block;overflow:hidden}
.bb-kcard h3{font:400 1.5rem var(--hf);text-align:center;text-transform:capitalize;margin:6px 0 10px}
.bb-kcard ul{display:grid;gap:4px;margin-bottom:8px}.bb-kcard li{display:flex;justify-content:space-between;gap:12px;font-weight:600;color:#3B4A42}.bb-kcard li b{color:#14201A}
.bb-kcard .bb-total{border-top-color:#D5DDD8;margin-bottom:14px}.bb-kcard .bb-total b,.bb-gcard .bb-total b{color:#14201A}.bb-kcard .bb-total span{color:var(--tm)}
.bb-kcard .bb-btn.line,.bb-gcard .bb-btn.line{color:#14201A;border-color:#14201A}.bb-kcard .bb-btn.line:hover,.bb-gcard .bb-btn.line:hover{background:#14201A;color:#fff}
.bb-kcard .bb-copied,.bb-gcard .bb-copied{color:var(--tm)}.bb-kcard .bb-fine,.bb-gcard .bb-fine{color:#6B7A72;border-top-color:#D5DDD8}.bb-gcard .bb-copy{color:#14201A}
/* groups */
.bb-groups{background:#F4F7F5}.bb-gwrap{display:grid;grid-template-columns:1.1fr .9fr;gap:28px;align-items:start}
.bb-gform{display:grid;grid-template-columns:1fr 1fr;gap:16px;background:#fff;border:3px solid var(--bk);border-radius:12px;padding:22px;box-shadow:8px 8px 0 var(--bk)}
.bb-fld{display:flex;flex-direction:column;gap:6px;min-width:0}.bb-fld.wide{grid-column:1/-1}.bb-fld span{font:800 .78rem var(--bf);letter-spacing:.14em;text-transform:uppercase;color:#4A5A52}
.bb-fld select,.bb-fld input,.bb-fld textarea{width:100%;min-height:46px;border:2px solid #CBD5CF;border-radius:6px;padding:10px 12px;font:600 1rem var(--bf);color:#14201A;background:#fff}.bb-fld textarea{resize:vertical}
.bb-gsum{font:600 1.02rem/1.55 var(--bf);padding:14px 4px 16px;color:#14201A}
.bb-gcard{position:static}
@media (max-width:1000px){.bb-kwrap,.bb-gwrap{grid-template-columns:1fr}.bb-kcard{position:static}}
@media (max-width:640px){.bb-gform{grid-template-columns:1fr;padding:16px}.bb-presets button{font-size:.8rem;padding:7px 11px}.bb-daily{padding:14px 16px}.bb-tabs{gap:2px}.bb-tabs button{font-size:.54rem;letter-spacing:0}.bb-tabs button span{width:24px;height:24px;font-size:.75rem}.bb-cupbox{height:200px}}
/* gallery */
.bb-gal{background:var(--bk);color:#fff}
.bb-gal .bb-kick{color:var(--mu)}
.bb-gh{display:flex;justify-content:space-between;align-items:end;gap:20px;margin-bottom:22px}
.bb-gh h2{font:400 clamp(1.8rem,4vw,2.7rem)/1.1 var(--hf);margin-top:8px}
.bb-garr{display:flex;gap:8px}
.bb-garr button{width:48px;height:48px;border-radius:4px;border:2px solid var(--mu);background:transparent;color:var(--mu);font:700 1.8rem/1 var(--bf);cursor:pointer}
.bb-garr button:hover{background:var(--mu);color:var(--bk)}
.bb-gtrack{display:flex;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding-bottom:4px;-webkit-overflow-scrolling:touch}
.bb-gtrack::-webkit-scrollbar{display:none}
.bb-gi{flex:0 0 calc((100% - 28px)/3);scroll-snap-align:start;margin:0;position:relative}
.bb-gi button{display:block;width:100%;padding:0;border:0;background:#000;cursor:zoom-in;border-radius:6px;overflow:hidden}
.bb-gi img{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;transition:transform .5s}
.bb-gi button:hover img{transform:scale(1.04)}
.bb-gi figcaption{font:600 .88rem var(--bf);color:#D3DCD6;padding-top:10px}
.bb-lb{position:fixed;inset:0;z-index:90;background:rgba(5,10,7,.94);display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;cursor:zoom-out}
.bb-lb.on{display:flex}
.bb-lb img{max-width:min(94vw,1100px);max-height:80vh;border-radius:6px}
.bb-lb p{color:#fff;font:600 1rem var(--bf)}
.bb-lbx{position:absolute;top:16px;right:16px;background:var(--mu);color:var(--bk);border:0;border-radius:4px;padding:10px 16px;font:700 .9rem var(--bf);cursor:pointer}
@media (max-width:820px){.bb-gi{flex-basis:78%}.bb-garr button{width:44px;height:44px}}
/* menu board */
.bb-menu{background:var(--bk);color:var(--ch)}
.bb-board{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;border:10px solid #6B4A2B;border-radius:4px;padding:30px;background:var(--bk2);box-shadow:inset 0 0 0 2px rgba(255,255,255,.08)}
.bb-col h3{font:400 1.45rem var(--hf);color:var(--mu);border-bottom:2px dashed rgba(234,240,236,.3);padding-bottom:8px;margin-bottom:10px}.bb-cn{font-size:.88rem;color:#9FB3A9;margin-bottom:8px}.bb-col li{padding:5px 0 5px 18px;position:relative;font-weight:600}.bb-col li::before{content:"";position:absolute;left:0;top:.9em;width:7px;height:7px;background:var(--tm);transform:rotate(45deg)}
.bb-facts{background:var(--tm);color:#fff}.bb-facts ul{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;padding:30px 0}.bb-facts li{text-align:center}.bb-facts b{display:block;font:400 clamp(1.5rem,3.4vw,2.4rem)/1.05 var(--hf)}.bb-facts span{font:700 .82rem var(--bf);letter-spacing:.14em;text-transform:uppercase;color:#FFE3DF}
.bb-why{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.bb-wc{border:2px solid var(--bk);border-radius:8px;padding:22px 20px;background:#fff;box-shadow:6px 6px 0 var(--mu)}.bb-wc b{font:400 1rem var(--hf);color:var(--tm)}.bb-wc h3{font:400 1.3rem/1.15 var(--hf);margin:8px 0}.bb-wc p{color:#4A5A52;font-size:.98rem}
.bb-visit{background:#F4F7F5}.bb-visit-g{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start}.bb-visit h2{font:400 clamp(2rem,4.4vw,3rem)/1.08 var(--hf);margin:16px 0 12px}.bb-visit p{color:#4A5A52}.bb-addr{font-weight:700;color:#14201A!important;margin-bottom:12px}
.bb-hrs{margin:14px 0 4px;max-width:380px}.bb-hrs div{display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-bottom:1px solid var(--ln);font-weight:600}.bb-hrs .on{color:var(--tm);font-weight:800}
.bb-visit .bb-btn.line{color:#14201A;border-color:#14201A}.bb-visit .bb-btn.line:hover{background:#14201A;color:#fff}
.bb-visit .socials a{background:var(--bk);color:#fff}
.bb-map{border:4px solid var(--bk);border-radius:6px;overflow:hidden;box-shadow:8px 8px 0 var(--mu);min-height:340px}.bb-map iframe{display:block;width:100%;height:100%;min-height:340px;border:0}
.bb-foot{background:var(--bk);color:#C9D6CF;padding:26px 0 24px;font-size:.92rem}.bb-foot-in{display:flex;flex-wrap:wrap;align-items:center;gap:8px 22px}.bb-foot b{font:400 1.15rem var(--hf);color:var(--mu)}.bb-foot a{color:#fff}.bb-foot em{margin-left:auto;font-style:normal;color:#8FA399}
@media (max-width:1000px){.bb-bg{grid-template-columns:1fr}.bb-stage{position:static}.bb-bench{box-shadow:6px 6px 0 var(--bk)}.bb-mini{display:flex;align-items:center;gap:12px;position:sticky;top:104px;z-index:5;background:var(--bk);color:#fff;border-radius:8px;padding:6px 14px;box-shadow:0 6px 0 var(--mu)}.bb-minisvg{height:84px;width:120px;flex:none}.bb-mini{margin:-6px -6px 14px;box-shadow:none;border-radius:8px}.bb-mini b{font:400 1.05rem/1.15 var(--hf);color:var(--mu);flex:1}.bb-mini em{font:400 1.3rem var(--hf);font-style:normal;color:#fff}.bb-board{grid-template-columns:1fr 1fr}.bb-why{grid-template-columns:1fr 1fr}}
@media (max-width:900px){
 .bb-links{display:none}.bb-nav-in .bb-btn{margin-left:auto}.bb-nav-in{gap:10px}
 .bb-mlinks{display:flex;justify-content:space-between;padding:0 10px 4px;border-top:1px solid rgba(234,240,236,.15)}.bb-mlinks button{white-space:nowrap;padding:9px 4px;font-size:clamp(.66rem,3.1vw,.86rem);letter-spacing:.05em}
 .bb-hero{padding:40px 0 46px}.bb-hero-g,.bb-visit-g{grid-template-columns:1fr}.bb-hero-g{gap:20px}.bb-heroart{min-height:0}.bb-sec{padding:54px 0}.bb-word b{font-size:1.4rem}.bb-word i{font-size:.52rem;letter-spacing:.14em}.bb-logo{height:46px}
}
@media (max-width:640px){.bb-wrap{padding:0 18px}.bb-top-in span{display:none}.bb-top-in{justify-content:center}.bb-board{grid-template-columns:1fr;padding:20px;border-width:8px}.bb-why{grid-template-columns:1fr}.bb-facts ul{grid-template-columns:1fr 1fr}.bb-foot em{margin-left:0}.bb-cta .bb-btn{flex:1 1 100%}.bb-mug{width:24%}.bb-tiles{gap:8px}.bb-ti{width:64px;height:64px}.bb-ti svg{width:48px;height:48px}.bb-tile b{font-size:.84rem}.bb-tabs button{font-size:.62rem;letter-spacing:.02em}.bb-bench{padding:14px}.bb-art{height:230px}}
/* ---- Welborn marketing page ---- */
.mk-bigbill .mp-bar{border-bottom:4px solid #0F1914}
.mk-bigbill .mp-brand{color:#0F1914}
.mk-bigbill .mp-back{color:#B07A00}
.mk-bigbill .mp-cover{background:#0F1914;border-bottom:6px solid #F5B800;padding:44px 0 40px}
.mk-bigbill .mp-cover .mp-in{grid-template-columns:1.2fr 1fr;grid-template-rows:auto auto;gap:26px 48px;align-items:center}
.mk-bigbill .mp-cover-l{grid-column:1;grid-row:1}
.mk-bigbill .mp-wlogo{width:min(250px,70%);height:auto;margin-bottom:22px;display:block;background:#fff;padding:10px 16px;border-radius:4px}
.mk-bigbill .mp-word{font-family:'Alfa Slab One','Rockwell',Georgia,serif;color:#F5B800;font-size:clamp(2.2rem,4.6vw,3.4rem);line-height:1.05;margin-bottom:16px;text-shadow:none}
.mk-bigbill .mp-eyebrow{color:#F5B800}
.mk-bigbill .mp-cover h1{color:#fff}
.mk-bigbill .mp-cover p{color:#D3DCD6}
.mk-bigbill .mp-meta{grid-column:1;grid-row:2;display:grid;grid-template-columns:1fr 1fr;gap:0 24px;margin:0}
.mk-bigbill .mp-meta dt{color:#9FB0A6}
.mk-bigbill .mp-photo{grid-column:2;grid-row:1/span 2;margin:0}
.mp-bbfig{background:radial-gradient(circle at 50% 35%,#2A4036,#0F1914)!important;border:3px solid #F5B800!important;outline:0!important;border-radius:10px;padding:18px 14px 12px;box-shadow:8px 8px 0 #F5B800}
.mp-bbart{height:300px;display:grid;place-items:end center}
.mp-bbart svg{width:100%;height:100%;display:block}
.mp-bbfig figcaption{color:#F5B800!important;text-align:center;font-weight:700;letter-spacing:.04em;padding-top:10px;font-size:.85rem}
.mk-bigbill .mp-label{border-top-color:#0F1914;color:#0F1914}
.mk-bigbill .mp-label span,.mk-bigbill .mo-num{color:#B07A00}
.mk-bigbill .mo-body h3,.mk-bigbill .mo-price b{color:#0F1914}
.mk-bigbill .mo-more li::before{background:#F5B800}
.mk-bigbill .mo-ex{background:#F2F5F2;border-left-color:#F5B800}
.mk-bigbill .mo-ex span{color:#B07A00}
@media (max-width:860px){.mk-bigbill .mp-cover .mp-in{grid-template-columns:1fr}.mk-bigbill .mp-photo{grid-column:1;grid-row:auto}.mp-bbart{height:240px}.mk-bigbill .mp-meta{grid-template-columns:1fr}.mk-bigbill .mo-item{grid-template-columns:36px 1fr}.mk-bigbill .mo-price{grid-column:2;text-align:left}}
@media (prefers-reduced-motion:reduce){.mp-bbart .bbl{animation:none!important}}
.mk-welborn .mp-bar{border-bottom:4px solid #0B0F14}
.mk-welborn .mp-brand{color:#0B0F14}
.mk-welborn .mp-back{color:#1B5FD6}
.mk-welborn .mp-cover{background:#0B0F14;border-bottom:6px solid #3981F0;padding:44px 0 40px}
.mk-welborn .mp-cover .mp-in{grid-template-columns:1.3fr 1fr;grid-template-rows:auto auto;gap:26px 48px;align-items:center}
.mk-welborn .mp-cover-l{grid-column:1;grid-row:1}
.mk-welborn .mp-wlogo{width:250px;height:auto;margin-bottom:22px;display:block;background:#fff;padding:12px 18px;border-radius:4px}
.mk-welborn .mp-eyebrow{color:#7FB0FF}
.mk-welborn .mp-cover h1{color:#fff}
.mk-welborn .mp-cover p{color:#D4D4D8}
.mk-welborn .mp-meta{grid-column:1;grid-row:2;display:grid;grid-template-columns:1fr 1fr;gap:0 24px;margin:0}
.mk-welborn .mp-meta dt{color:#A1A1AA}
.mk-welborn .mp-photo{grid-column:2;grid-row:1/span 2;margin:0}
.mk-welborn .mp-photo .ph{aspect-ratio:4/5;max-height:430px;width:100%;background-size:cover;background-position:center;border-radius:6px;border:3px solid #fff;box-shadow:8px 8px 0 #3981F0}
.mk-welborn .mp-photo figcaption{color:#A1A1AA;font-size:.8rem;margin-top:12px}
.mk-welborn .mp-photo .ph{background-image:url(https://riverbendwebco.com/demo/info/welborn-painting/logo.png)!important;background-color:#fff;background-size:contain;background-repeat:no-repeat;background-position:center;aspect-ratio:4/3;max-height:none;padding:24px;background-origin:content-box}
.mk-welborn .mp-label{border-top-color:#0B0F14;color:#0B0F14}
.mk-welborn .mp-label span,.mk-welborn .mo-num{color:#1B5FD6}
.mk-welborn .mo-body h3,.mk-welborn .mo-price b{color:#0B0F14}
.mk-welborn .mo-more li::before{background:#1B5FD6}
.mk-welborn .mo-ex{background:#EEF3FA;border-left-color:#1B5FD6}
.mk-welborn .mo-ex span{color:#1B5FD6}
@media (max-width:860px){.mk-welborn .mp-cover .mp-in{grid-template-columns:1fr}.mk-welborn .mp-photo{grid-column:1;grid-row:auto}.mk-welborn .mp-photo .ph{aspect-ratio:4/3}.mk-welborn .mp-meta{grid-template-columns:1fr}.mk-welborn .mo-item{grid-template-columns:36px 1fr}.mk-welborn .mo-price{grid-column:2;text-align:left}}

/* ===== SUNSHINE (family diner) ===== */
body.t-sn{background:#FFFFFF}
.sn{--y:#FFC93C;--y2:#FFB020;--o:#F7742B;--b:#1F5FAF;--b2:#174A8A;--ink:#1B2A41;--mut:#5A6578;--sky:#EEF6FF;--sun:#FFF6D6;--ln:#E3E9F2;color:var(--ink);background:#fff;font-family:ui-rounded,"SF Pro Rounded",var(--font-b);overflow-x:hidden}
.sn-wrap{max-width:1160px;margin:0 auto;padding:0 24px}
.sn h1,.sn h2,.sn h3{font-family:ui-rounded,"SF Pro Rounded",var(--font-h);letter-spacing:-.015em;line-height:1.1;color:var(--ink)}
.sn-top{background:var(--b2);color:#fff;font-size:.88rem}
.sn-top-in{display:flex;justify-content:space-between;align-items:center;gap:16px;min-height:40px}
.sn-top-r{display:flex;gap:18px;opacity:.9}
.sn-live{display:inline-flex;align-items:center;gap:8px;font-weight:700}
.sn-live i{width:9px;height:9px;border-radius:50%;background:#FF8A7A;box-shadow:0 0 0 3px rgba(255,138,122,.25)}
.sn-live.on i{background:#4ADE80;box-shadow:0 0 0 3px rgba(74,222,128,.3);animation:snPulse 2s infinite}
@keyframes snPulse{50%{box-shadow:0 0 0 7px rgba(74,222,128,0)}}
.sn-nav{position:sticky;top:0;z-index:30;background:rgba(255,255,255,.94);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-bottom:1px solid var(--ln)}
.sn-nav-in{display:flex;align-items:center;justify-content:space-between;gap:20px;min-height:72px}
.sn-brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--ink)}
.sn-logo{color:var(--y2);display:inline-flex;animation:snSpin 30s linear infinite}
@keyframes snSpin{to{transform:rotate(360deg)}}
.sn-brand span{display:flex;flex-direction:column;line-height:1}
.sn-brand b{font-size:1.5rem;font-weight:800;color:var(--b)}
.sn-brand small{font-size:.72rem;letter-spacing:.16em;text-transform:uppercase;color:var(--mut);margin-top:4px}
.sn-links{display:flex;gap:4px}
.sn-links button,.sn-mlinks button{background:none;border:0;cursor:pointer;font:inherit;font-weight:700;color:var(--ink);padding:8px 14px;border-radius:10px}
.sn-links button:hover{background:var(--sun);color:var(--b2)}
.sn-mlinks{display:none}
.sn-btn{display:inline-flex;align-items:center;gap:9px;text-decoration:none;font:inherit;font-weight:800;border-radius:12px;padding:14px 22px;border:2px solid transparent;cursor:pointer;transition:transform .15s,box-shadow .15s,background .15s}
.sn-btn:hover{transform:translateY(-2px)}
.sn-btn.sun{background:var(--y);color:var(--ink);box-shadow:0 6px 0 var(--y2)}
.sn-btn.sun:hover{box-shadow:0 8px 0 var(--y2)}
.sn-btn.blue{background:var(--b);color:#fff;box-shadow:0 6px 0 var(--b2)}
.sn-btn.line{border-color:var(--b);color:var(--b);background:#fff}
.sn-btn.sm{padding:10px 16px;font-size:.92rem}
.sn-bi{display:inline-flex}
.sn-hero{background:linear-gradient(180deg,#FFF9E6 0%,#FFFFFF 85%);padding:56px 0 64px;position:relative}
.sn-hero:before{content:"";position:absolute;inset:auto 0 0 0;height:60px;background:radial-gradient(ellipse at 50% 100%,rgba(255,201,60,.18),transparent 70%)}
.sn-hero-g{display:grid;grid-template-columns:1.05fr 1fr;gap:48px;align-items:center;position:relative}
.sn-kick{display:inline-flex;align-items:center;gap:8px;font-size:.8rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--o)}
.sn-hero h1{font-size:clamp(2.8rem,5.6vw,4.4rem);font-weight:800;margin:14px 0 16px}
.sn-hero h1 em{font-style:normal;color:var(--b);position:relative}
.sn-hero h1 em:after{content:"";position:absolute;left:0;right:0;bottom:.06em;height:.22em;background:var(--y);z-index:-1;border-radius:6px}
.sn-lead{font-size:1.2rem;color:var(--mut);max-width:520px;line-height:1.6}
.sn-cta{display:flex;flex-wrap:wrap;gap:14px;margin-top:28px}
.sn-rate{display:flex;align-items:center;gap:10px;margin-top:28px;font-size:.95rem;color:var(--mut)}
.sn-rate b{font-size:1.2rem;color:var(--ink)}
.sn-stars{display:inline-flex;gap:2px;color:var(--y2)}
.sn-st{display:inline-flex}
.sn-art{filter:drop-shadow(0 30px 40px rgba(31,95,175,.18))}
.sn-art svg{display:block;width:100%;height:auto;border-radius:18px}
.sn-rays{transform-origin:420px 74px;transform-box:view-box;animation:snSpin 40s linear infinite}
.sn-sun{animation:snRise 1.6s cubic-bezier(.2,.8,.2,1) both}
@keyframes snRise{from{transform:translateY(70px);opacity:.3}}
.sn-steam path{animation:snSteam 2.6s ease-in-out infinite}.sn-steam path+path{animation-delay:.6s}
@keyframes snSteam{0%{opacity:0;transform:translateY(6px)}40%{opacity:1}100%{opacity:0;transform:translateY(-10px)}}
.sn-marq{background:var(--b);color:#fff;overflow:hidden;padding:14px 0;transform:rotate(-1deg);margin:8px -10px 0}
.sn-marq-in{display:flex;gap:36px;width:max-content;animation:snMarq 32s linear infinite;font-weight:800;font-size:1.05rem}
.sn-marq-in span{display:inline-flex;align-items:center;gap:10px;white-space:nowrap}
.sn-mi{color:var(--y);display:inline-flex}
@keyframes snMarq{to{transform:translateX(-50%)}}
.sn-sec{padding:96px 0}
.sn-sec.sky{background:var(--sky)}
.sn-sec.sun{background:var(--sun)}
.sn-head{max-width:680px;margin-bottom:42px}
.sn-head h2,.sn-story h2,.sn-visit h2{font-size:clamp(2rem,4vw,3rem);font-weight:800;margin-top:10px}
.sn-head p{color:var(--mut);font-size:1.08rem;margin-top:12px}
.sn-favs{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.sn-fav{background:#fff;border:2px solid var(--ln);border-radius:20px;padding:28px;transition:transform .2s,border-color .2s,box-shadow .2s}
.sn-fav:hover{transform:translateY(-4px) rotate(-.4deg);border-color:var(--y);box-shadow:0 18px 40px rgba(255,176,32,.18)}
.sn-fav-ic{width:68px;height:68px;border-radius:18px;display:grid;place-items:center;margin-bottom:18px}
.sn-fav-ic.c0{background:var(--sun);color:var(--o)}.sn-fav-ic.c1{background:var(--sky);color:var(--b)}.sn-fav-ic.c2{background:#FFEDE3;color:var(--o)}
.sn-fav h3{font-size:1.35rem;font-weight:800}
.sn-fav p{color:var(--mut);margin-top:8px;line-height:1.6}
.sn-fav blockquote{margin:16px 0 0;padding:12px 14px;background:var(--sky);border-radius:12px;font-size:.92rem;color:var(--b2);font-style:italic}
.sn-deals{padding:0 0 10px}
.sn-deals-g{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.sn-deal{display:flex;justify-content:space-between;align-items:center;gap:18px;background:var(--y);border-radius:20px;padding:26px 30px;position:relative;overflow:hidden}
.sn-deal:after{content:"";position:absolute;right:-30px;top:-30px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.25)}
.sn-deal small{font-size:.75rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--b2)}
.sn-deal h3{font-size:1.5rem;font-weight:800;margin:4px 0 6px}
.sn-deal p{color:#3E3A2E}
.sn-deal-p{font-size:2.2rem;font-weight:900;color:var(--b2);position:relative;z-index:1;white-space:nowrap}
.sn-menu-box{background:#fff;border-radius:22px;padding:26px;box-shadow:0 20px 50px rgba(31,95,175,.10)}
.sn-tabs{display:flex;flex-wrap:wrap;gap:8px;padding-bottom:18px;border-bottom:2px dashed var(--ln)}
.sn-tabs button{border:2px solid var(--ln);background:#fff;border-radius:12px;padding:10px 16px;font:inherit;font-weight:800;color:var(--mut);cursor:pointer}
.sn-tabs button:hover{border-color:var(--y)}
.sn-tabs button[aria-selected="true"]{background:var(--b);border-color:var(--b);color:#fff}
.sn-menu{list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:6px 40px;margin:0;padding:18px 0 0}
.sn-menu li{padding:14px 0;border-bottom:1px solid var(--ln)}
.sn-mi-t{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
.sn-mi-t b{font-size:1.08rem}
.sn-dots{flex:1;border-bottom:2px dotted #C9D3E1;min-width:20px;transform:translateY(-4px)}
.sn-price{font-weight:900;color:var(--b)}
.sn-menu p{color:var(--mut);font-size:.94rem;margin-top:4px}
.sn-badge{display:inline-flex;align-items:center;gap:4px;font-size:.7rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;background:#FFEDE3;color:var(--o);padding:4px 8px;border-radius:8px}
.sn-bh{display:inline-flex}
.sn-menu-foot{display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;margin-top:22px}
.sn-menu-foot .sn-cta{margin-top:0}
.sn-note{color:var(--mut);font-size:.9rem;max-width:520px}
.sn-story{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:start}
.sn-story-p{color:var(--mut);font-size:1.08rem;line-height:1.75;margin-top:16px}
.sn-family{display:flex;gap:16px;align-items:flex-start;margin-top:26px;background:var(--sun);border-radius:18px;padding:22px}
.sn-fh{color:var(--o);display:inline-flex;flex:0 0 auto}
.sn-family p{font-weight:700;line-height:1.6}
.sn-time{list-style:none;margin:0;padding:0 0 0 28px;position:relative}
.sn-time:before{content:"";position:absolute;left:9px;top:6px;bottom:6px;width:3px;background:linear-gradient(var(--y),var(--b));border-radius:3px}
.sn-time li{position:relative;padding:0 0 26px}
.sn-time li:before{content:"";position:absolute;left:-26px;top:4px;width:15px;height:15px;border-radius:50%;background:#fff;border:3px solid var(--b)}
.sn-time li.hi:before{background:var(--y);border-color:var(--y2);width:19px;height:19px;left:-28px;top:2px}
.sn-time b{display:block;font-size:1.2rem;font-weight:900;color:var(--b)}
.sn-time span{color:var(--mut)}
.sn-time li.hi span{color:var(--ink);font-weight:700}
.sn-revs{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.sn-rev{background:#fff;border-radius:20px;padding:26px;margin:0;box-shadow:0 10px 30px rgba(255,176,32,.12)}
.sn-rev blockquote{margin:12px 0 14px;line-height:1.65;font-size:1.02rem}
.sn-rev figcaption{font-weight:800;color:var(--b2)}
.sn-rev small{font-weight:600;color:var(--mut)}
.sn-notes{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.sn-notes li{display:flex;gap:14px;align-items:center;background:var(--sky);border-radius:16px;padding:18px 20px;font-weight:700}
.sn-notes .sn-ic{color:var(--b);display:inline-flex;flex:0 0 auto}
.sn-visit{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:start}
.sn-contact{list-style:none;margin:24px 0 0;padding:0;display:grid;gap:16px}
.sn-contact li{display:flex;gap:14px;align-items:flex-start}
.sn-contact .sn-ic{color:var(--o);display:inline-flex;margin-top:2px}
.sn-contact small{display:block;font-size:.75rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--mut)}
.sn-contact a{color:var(--ink);font-weight:800;font-size:1.1rem;text-decoration:none}
.sn-contact a:hover{color:var(--b)}
.sn-contact span{display:block;color:var(--mut);font-size:.92rem}
.sn-hours-card{background:#fff;border-radius:22px;padding:28px;box-shadow:0 20px 50px rgba(31,95,175,.10)}
.sn-hours-card h3{display:flex;align-items:center;gap:10px;font-size:1.3rem;font-weight:800;margin-bottom:12px}
.sn-hours-card h3 .sn-ic{color:var(--o);display:inline-flex}
.sn-hours{list-style:none;margin:0;padding:0}
.sn-hours li{display:flex;justify-content:space-between;padding:10px 12px;border-radius:10px}
.sn-hours li.today{background:var(--y);font-weight:800}
.sn-hours-card .sn-live{margin-top:14px;color:var(--b2)}
.sn-west{grid-column:1/-1;background:var(--b);color:#fff;border-radius:22px;padding:26px 30px;display:grid;grid-template-columns:auto 1fr auto;gap:6px 24px;align-items:center}
.sn-west small{grid-column:1/-1;font-size:.75rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--y)}
.sn-west h3{color:#fff;font-size:1.3rem;font-weight:800}
.sn-west p{color:#DCE8F8}
.sn-west a{color:#fff;font-weight:800;text-decoration:none;background:rgba(255,255,255,.14);padding:10px 16px;border-radius:12px}
.sn-foot{background:var(--ink);color:#C9D3E1;padding:50px 0 40px}
.sn-foot-in{display:grid;grid-template-columns:1.3fr 1fr 1fr;gap:30px}
.sn-foot .sn-brand b{color:#fff}.sn-foot .sn-brand small{color:#9FB0C6}
.sn-foot b{color:#fff}
.sn-foot p{margin-top:10px;line-height:1.6}
.sn-foot a{color:var(--y);font-weight:800;text-decoration:none}
.sn .rv-in{opacity:0;transform:translateY(20px);transition:opacity .6s,transform .6s}.sn .rv-on{opacity:1;transform:none}
.sn-photo{position:relative;margin:0}
.sn-photo img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:24px;border:6px solid #fff;box-shadow:0 30px 60px rgba(31,95,175,.22);transform:rotate(1.2deg)}
.sn-sticker{position:absolute;left:-22px;bottom:-22px;width:124px;height:124px;border-radius:50%;background:var(--y);box-shadow:0 10px 0 var(--y2),0 18px 30px rgba(0,0,0,.12);display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(-8deg);color:var(--ink);text-align:center}
.sn-sticker b{font-size:1.5rem;font-weight:900;line-height:1}
.sn-sticker small{font-size:.6rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;margin-top:3px}
.sn-sk-ic{color:var(--o);display:inline-flex;animation:snSpin 20s linear infinite}
.sn-gal{display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:220px;gap:16px}
.sn-g{position:relative;margin:0;overflow:hidden;border-radius:20px;background:var(--sky)}
.sn-g img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s}
.sn-g:hover img{transform:scale(1.05)}
.sn-g figcaption{position:absolute;left:12px;bottom:12px;right:12px;background:rgba(255,255,255,.94);color:var(--ink);font-weight:800;font-size:.88rem;padding:8px 12px;border-radius:10px;width:max-content;max-width:calc(100% - 24px)}
.sn-g.g0{grid-column:span 2;grid-row:span 2}
.sn-g.g3,.sn-g.g4,.sn-g.g5{grid-column:span 2}
.sn-story-img{margin:22px 0 0}
.sn-story-img img{display:block;width:100%;max-width:400px;aspect-ratio:4/3;object-fit:cover;object-position:50% 30%;border-radius:20px;transform:rotate(-1.5deg);border:5px solid #fff;box-shadow:0 16px 36px rgba(31,95,175,.16)}
@media (max-width:960px){.sn-gal{grid-template-columns:1fr 1fr;grid-auto-rows:190px}.sn-photo{max-width:600px}}
@media (max-width:760px){.sn-gal{grid-auto-rows:160px;gap:10px}.sn-g.g0{grid-column:span 2;grid-row:span 1}.sn-g.g3{grid-column:span 2}.sn-g.g4,.sn-g.g5{grid-column:span 1}.sn-sticker{width:96px;height:96px;left:-6px;bottom:-16px}.sn-sticker b{font-size:1.2rem}.sn-photo img{transform:none}}
.sn-favsec{position:relative;overflow:hidden;background:radial-gradient(circle at 92% 8%,rgba(255,201,60,.22),transparent 28%),radial-gradient(circle at 4% 92%,rgba(31,95,175,.08),transparent 30%)}
.sn-fav.has-art{padding:0;overflow:hidden;display:flex;flex-direction:column}
.sn-fav-b{padding:22px 26px 26px}
.sn-fav-art{position:relative;height:200px;display:flex;align-items:center;justify-content:center;background-image:radial-gradient(rgba(27,42,65,.08) 1.6px,transparent 1.8px);background-size:16px 16px;border-bottom:2px solid var(--ln)}
.sn-fav-art.c0{background-color:#FFF2C4}.sn-fav-art.c1{background-color:#E2EFFF}.sn-fav-art.c2{background-color:#FFE6D8}
.sn-fav-art:before{content:"";position:absolute;width:210px;height:210px;border-radius:50%;background:rgba(255,255,255,.55)}
.sn-art-svg{position:relative;width:250px;transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.sn-art-svg svg{display:block;width:100%;height:auto;overflow:visible}
.sn-fav:hover .sn-art-svg{transform:scale(1.06) rotate(-3deg)}
.sn-fav-no{position:absolute;top:14px;left:16px;font-weight:900;font-size:.85rem;letter-spacing:.08em;color:var(--b2);background:#fff;border:2px solid var(--ink);border-radius:10px;padding:3px 8px;z-index:1}
.sn [hidden]{display:none!important}
.sn.big{zoom:1.15}
.sn-big{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,.14);color:#fff;border:1px solid rgba(255,255,255,.35);border-radius:9px;padding:4px 10px;font:inherit;font-size:.85rem;font-weight:700;cursor:pointer;margin-left:18px}
.sn-big b{font-size:1rem;color:var(--y)}
.sn-big[aria-pressed="true"]{background:var(--y);color:var(--ink);border-color:var(--y)}.sn-big[aria-pressed="true"] b{color:var(--ink)}
.sn-top-in>.sn-top-r{margin-left:auto}
.sn-pk{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.sn-pk h2{font-size:clamp(2rem,4vw,3rem);font-weight:800;margin-top:10px}
.sn-pk-sub{color:var(--mut);font-size:1.08rem;margin:10px 0 22px}
.sn-pk-l{display:block;margin:18px 0 10px;font-size:1rem}
.sn-pk-o{display:flex;flex-wrap:wrap;gap:10px}
.sn-pk-o button{display:inline-flex;align-items:center;gap:10px;background:#fff;border:2px solid var(--ln);border-radius:14px;padding:12px 16px;font:inherit;font-weight:800;color:var(--ink);cursor:pointer;transition:transform .15s,border-color .15s}
.sn-pk-o button .sn-ic{color:var(--o)}
.sn-pk-o button:hover{border-color:var(--y);transform:translateY(-2px)}
.sn-pk-o button[aria-pressed="true"]{background:var(--y);border-color:var(--y2);box-shadow:0 4px 0 var(--y2)}
.sn-pk-wait{background:#fff;border:3px dashed #C9D8EC;border-radius:24px;min-height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;color:var(--mut);text-align:center;padding:30px}
.sn-pk-wait .sn-ic{color:var(--b)}
.sn-pk-card{background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(31,95,175,.14);animation:snPop .4s cubic-bezier(.2,.8,.2,1)}
@keyframes snPop{from{transform:scale(.94) rotate(-1deg);opacity:0}}
.sn-pk-art{background:#FFF2C4 radial-gradient(rgba(27,42,65,.08) 1.6px,transparent 1.8px);background-size:16px 16px;display:flex;justify-content:center;padding:18px 0 6px}
.sn-pk-card>div:last-child{padding:22px 26px 26px}
.sn-pk-card small{font-size:.75rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--o)}
.sn-pk-card h3{font-size:1.7rem;font-weight:800;margin:4px 0 6px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.sn-pk-p{font-size:1.1rem;background:var(--b);color:#fff;border-radius:9px;padding:3px 10px}
.sn-pk-card p{color:var(--mut);line-height:1.6}
.sn-pk-card .sn-cta{margin-top:16px}
.sn-deals-w{display:grid;grid-template-columns:1fr 1.3fr;gap:20px;align-items:stretch}
.sn-deals-w .sn-deals-g{grid-template-columns:1fr;gap:16px}
.sn-sec.sky+.sn-deals{padding-top:56px}
.sn-chalk{background:#5B3A1E;border-radius:22px;padding:14px;box-shadow:0 18px 40px rgba(27,42,65,.18)}
.sn-chalk-in{position:relative;height:100%;background:#24302C radial-gradient(ellipse at 30% 20%,rgba(255,255,255,.08),transparent 60%);border-radius:12px;padding:24px 26px;color:#F4F1E8;font-family:"Chalkboard SE","Bradley Hand","Segoe Print",ui-rounded,cursive}
.sn-chalk small{font-size:.8rem;letter-spacing:.16em;text-transform:uppercase;color:var(--y)}
.sn-chalk h3{color:#fff;font-family:inherit;font-size:1.6rem;margin:6px 0 14px;border-bottom:2px dashed rgba(255,255,255,.35);padding-bottom:12px}
.sn-chalk ul{list-style:none;margin:0;padding:0;display:grid;gap:10px;font-size:1.15rem}
.sn-chalk li:before{content:"\2605";color:var(--y);margin-right:10px}
.sn-chalk-sun{position:absolute;right:18px;top:18px;color:var(--y);display:inline-flex;animation:snSpin 24s linear infinite}
.sn-tn-g{display:grid;grid-template-columns:.8fr 1.2fr;gap:48px;align-items:center}
.sn-tn h2{font-size:clamp(2rem,4vw,3rem);font-weight:800;margin-top:10px}
.sn-tn .sn-note{margin-top:14px}
.sn-tn-box{position:relative;aspect-ratio:4/3;border-radius:22px;overflow:hidden;box-shadow:0 24px 50px rgba(31,95,175,.18);border:6px solid #fff;user-select:none}
.sn-tn-box>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.sn-tn-then{position:absolute;inset:0;clip-path:inset(0 calc(100% - var(--p)) 0 0);filter:sepia(.85) saturate(.8) contrast(.95)}
.sn-tn-then svg{width:100%;height:100%;border-radius:0}
.sn-tn-then .sn-rays,.sn-tn-then .sn-sun{animation:none}
.sn-tn-bar{position:absolute;top:0;bottom:0;left:var(--p);width:4px;margin-left:-2px;background:#fff;pointer-events:none}
.sn-tn-bar i{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:46px;height:46px;border-radius:50%;background:var(--y);border:3px solid #fff;display:grid;place-items:center;font-style:normal;font-weight:900;color:var(--ink);box-shadow:0 6px 16px rgba(0,0,0,.2)}
.sn-tn-tag{position:absolute;bottom:14px;background:rgba(27,42,65,.82);color:#fff;font-size:.8rem;font-weight:800;padding:6px 10px;border-radius:9px;pointer-events:none}
.sn-tn-tag.l{left:14px}.sn-tn-tag.r{right:14px}
.sn-tn-box input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:ew-resize;margin:0}
.sn-fam{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.sn-fm{background:#fff;border-radius:22px;padding:30px 26px;text-align:center;box-shadow:0 10px 30px rgba(255,176,32,.14)}
.sn-fm-av{width:112px;height:112px;margin:0 auto 18px;border-radius:50%;display:grid;place-items:center;border:5px solid #fff;box-shadow:0 0 0 4px var(--y),0 12px 24px rgba(27,42,65,.12);overflow:hidden}
.sn-fm-av img{width:100%;height:100%;object-fit:cover}
.sn-fm-av span{font-size:1.6rem;font-weight:900;color:#fff}
.sn-fm-av.c0{background:linear-gradient(135deg,var(--o),var(--y2))}.sn-fm-av.c1{background:linear-gradient(135deg,var(--b),#5B9BE6)}.sn-fm-av.c2{background:linear-gradient(135deg,#2E9D6A,#7ACB8F)}
.sn-fm small{font-size:.75rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--o)}
.sn-fm h3{font-size:1.35rem;font-weight:800;margin:6px 0 8px}
.sn-fm p{color:var(--mut);line-height:1.6}
.sn-grp{display:grid;grid-template-columns:.9fr 1.1fr;gap:48px;align-items:start}
.sn-grp h2{font-size:clamp(2rem,4vw,3rem);font-weight:800;margin-top:10px}
.sn-grp-l{list-style:none;margin:20px 0;padding:0;display:grid;gap:10px}
.sn-grp-l li{display:flex;align-items:center;gap:10px;font-weight:800}
.sn-grp-l .sn-ic{color:var(--y2)}
.sn-grp .sn-note a{color:var(--b);font-weight:800}
.sn-form{background:#fff;border:2px solid var(--ln);border-radius:24px;padding:28px;display:grid;gap:16px;box-shadow:0 20px 50px rgba(31,95,175,.08)}
.sn-f-g{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.sn-f{display:grid;gap:6px}
.sn-f span{font-weight:800;font-size:.9rem}
.sn-f input,.sn-f select,.sn-f textarea{font:inherit;border:2px solid var(--ln);border-radius:12px;padding:12px 14px;background:#fff;color:var(--ink);width:100%;box-sizing:border-box}
.sn-f input:focus,.sn-f select:focus,.sn-f textarea:focus{outline:none;border-color:var(--b);box-shadow:0 0 0 4px rgba(31,95,175,.12)}
.sn-f-err{color:#C0392B;font-weight:700;min-height:1px;margin:0}
.sn-form .sn-btn{justify-self:start}
.sn-f-done{background:var(--sun);border-radius:24px;padding:36px;text-align:center;animation:snPop .4s}
.sn-f-done .sn-ic{color:var(--o)}
.sn-f-done h3{font-size:1.6rem;font-weight:800;margin:10px 0 6px}
.sn-f-done p{line-height:1.6}
.sn-f-done small{display:block;margin-top:14px;color:var(--mut)}
.sn-map{grid-column:1/-1;display:grid;grid-template-columns:.8fr 1.2fr;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(31,95,175,.10)}
.sn-map-side{padding:28px;display:flex;flex-direction:column;gap:14px}
.sn-map-k{font-size:.75rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--o)}
.sn-map-tabs{display:flex;gap:8px}
.sn-map-tabs button{flex:1;border:2px solid var(--ln);background:#fff;border-radius:12px;padding:10px;font:inherit;font-weight:800;color:var(--mut);cursor:pointer}
.sn-map-tabs button[aria-selected="true"]{background:var(--b);border-color:var(--b);color:#fff}
.sn-map-info{display:grid;gap:10px}
.sn-map-info h3{font-size:1.3rem;font-weight:800}
.sn-map-info p{display:flex;align-items:center;gap:10px;margin:0}
.sn-map-info p .sn-ic{color:var(--o)}
.sn-map-info a{color:var(--ink);font-weight:800;text-decoration:none}
.sn-map-info .sn-btn{justify-self:start;color:#fff;margin-top:6px}
.sn-map-f{min-height:340px;background:var(--sky)}
.sn-map-f iframe{width:100%;height:100%;min-height:340px;border:0;display:block}
@media (max-width:960px){.sn-pk,.sn-tn-g,.sn-grp,.sn-deals-w,.sn-map{grid-template-columns:1fr}.sn-fam{grid-template-columns:1fr 1fr}}
@media (max-width:760px){.sn-fam,.sn-f-g{grid-template-columns:1fr}.sn-big span{display:none}.sn-pk-wait{min-height:200px}.sn-form{padding:20px}.sn-form .sn-btn{justify-self:stretch;justify-content:center}}
/* --- Sunshine v2: bolder, shorter --- */
.sn-kick{gap:10px}
.sn-kick:before{content:"";width:12px;height:12px;border-radius:50%;background:var(--y);box-shadow:0 0 0 4px rgba(255,201,60,.35);flex:0 0 auto}
.sn-head h2 em,.sn h2 em{font-style:normal;color:var(--b)}
.sn-hero{background:var(--y);padding:56px 0 90px;overflow:hidden;position:relative}
.sn-hero:before{display:none}
.sn-burst{position:absolute;right:-30vw;top:50%;width:110vw;height:110vw;max-width:1500px;max-height:1500px;transform:translateY(-50%);background:repeating-conic-gradient(rgba(255,255,255,.28) 0 8deg,transparent 8deg 20deg);border-radius:50%;animation:snSpin 90s linear infinite;-webkit-mask:radial-gradient(circle,#000 25%,transparent 68%);mask:radial-gradient(circle,#000 25%,transparent 68%)}
.sn-hero .sn-kick{color:var(--b2)}
.sn-hero .sn-kick:before{background:#fff;box-shadow:0 0 0 4px rgba(255,255,255,.45)}
.sn-hero h1{font-size:clamp(3rem,6.6vw,5.4rem);line-height:.98;text-shadow:0 3px 0 rgba(255,255,255,.35)}
.sn-hero h1 em:after{background:#fff;opacity:.85}
.sn-hero .sn-lead{color:#3A3424;font-weight:500}
.sn-btn.ink{background:var(--ink);color:#fff;box-shadow:0 6px 0 #0B1424}
.sn-btn.white{background:#fff;color:var(--b2);box-shadow:0 6px 0 rgba(27,42,65,.18)}
.sn-hero-v{position:relative}
.sn-hero .sn-photo img{border-width:8px;transform:rotate(2deg);box-shadow:0 30px 60px rgba(120,70,0,.28)}
.sn-hero .sn-sticker{left:-26px;bottom:-30px;background:var(--b);color:#fff;box-shadow:0 10px 0 var(--b2),0 18px 30px rgba(0,0,0,.18)}
.sn-hero .sn-sticker .sn-sk-ic{color:var(--y)}
.sn-rbadge,.sn-hbadge{position:absolute;display:grid;grid-template-columns:auto 1fr;column-gap:10px;align-items:center;background:#fff;border-radius:16px;padding:12px 16px;box-shadow:0 14px 30px rgba(27,42,65,.18);animation:snBob 5s ease-in-out infinite}
.sn-rbadge{top:-18px;right:-14px;grid-template-columns:1fr}
.sn-rbadge b,.sn-hbadge b{font-weight:900;font-size:1.02rem}
.sn-rbadge small,.sn-hbadge small{font-size:.78rem;color:var(--mut);font-weight:700}
.sn-hbadge{left:-34px;top:38%;animation-delay:-2.5s}
.sn-hbadge .sn-ic{grid-row:span 2;color:var(--o);background:#FFEDE3;border-radius:12px;width:40px;height:40px;display:grid;place-items:center}
@keyframes snBob{50%{transform:translateY(-8px)}}
.sn-marq{margin-top:-34px;position:relative;z-index:2}
.sn-wv{position:relative}
.sn-wv:before{content:"";position:absolute;left:0;right:0;top:-29px;height:30px;background:inherit;-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 30'%3E%3Cpath d='M0 30 V18 Q30 0 60 18 T120 18 V30Z'/%3E%3C/svg%3E") repeat-x bottom/120px 30px;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 30'%3E%3Cpath d='M0 30 V18 Q30 0 60 18 T120 18 V30Z'/%3E%3C/svg%3E") repeat-x bottom/120px 30px}
.sn-sec{padding:84px 0}
.sn-pick{padding:70px 0 90px;background:#fff radial-gradient(rgba(31,95,175,.10) 1.6px,transparent 1.8px);background-size:18px 18px}
.sn-pk{background:var(--b);border-radius:30px;padding:44px;color:#fff;box-shadow:0 12px 0 var(--b2),0 30px 60px rgba(31,95,175,.25);position:relative;overflow:hidden}
.sn-pk:after{content:"";position:absolute;right:-90px;top:-90px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,var(--y) 0 38%,rgba(255,201,60,.25) 39% 60%,transparent 61%);pointer-events:none}
.sn-pk h2{color:#fff}
.sn-pk .sn-kick{color:var(--y)}
.sn-pk-sub{color:#DCE8F8}
.sn-pk-l{color:#fff}
.sn-pk-o button{border-color:transparent}
.sn-pk-wait{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.35);color:#DCE8F8}
.sn-pk-wait .sn-ic{color:var(--y)}
.sn-pk-card{position:relative;z-index:1;color:var(--ink)}
.sn-spec{display:grid;grid-template-columns:1.2fr 1fr 1fr;gap:18px;margin:0 0 26px}
.sn-spec .sn-chalk{padding:10px}
.sn-spec .sn-chalk-in{padding:18px 20px}
.sn-spec .sn-chalk h3{font-size:1.3rem;margin:4px 0 10px;padding-bottom:8px}
.sn-spec .sn-chalk ul{font-size:1.02rem;gap:6px}
.sn-spec .sn-deal{display:block;padding:22px 24px;transform:rotate(-1deg)}
.sn-spec .sn-deal.d1{transform:rotate(1deg);background:#FF8A3D}
.sn-spec .sn-deal.d1 small{color:#fff}.sn-spec .sn-deal.d1 h3,.sn-spec .sn-deal.d1 .sn-deal-p{color:#fff}.sn-spec .sn-deal.d1 p{color:#FFF1E6}
.sn-spec .sn-deal-p{display:block;margin-top:8px;font-size:2rem}
.sn-spec .sn-deal h3{font-size:1.3rem}
.sn-mosaic{columns:3;column-gap:18px}
.sn-mosaic>figure{break-inside:avoid;margin:0 0 18px;display:block}
.sn-mo-ph{position:relative;border-radius:20px;overflow:hidden;border:5px solid #fff;box-shadow:0 12px 30px rgba(120,70,0,.14)}
.sn-mo-ph img{display:block;width:100%;height:auto}
.sn-mo-ph figcaption{position:absolute;left:10px;bottom:10px;background:rgba(255,255,255,.95);font-weight:800;font-size:.84rem;padding:6px 10px;border-radius:9px}
.sn-mo-rv{background:#fff;border-radius:20px;padding:22px;box-shadow:0 12px 30px rgba(120,70,0,.10)}
.sn-mo-rv.c1{background:var(--b);color:#fff}.sn-mo-rv.c1 figcaption{color:var(--y)}.sn-mo-rv.c1 small{color:#C9DBF2}.sn-mo-rv.c1 .sn-stars{color:var(--y)}
.sn-mo-rv.c2{background:var(--ink);color:#fff}.sn-mo-rv.c2 figcaption{color:var(--y)}.sn-mo-rv.c2 small{color:#9FB0C6}
.sn-mo-rv blockquote{margin:10px 0 12px;font-size:1.08rem;line-height:1.55;font-weight:600}
.sn-mo-rv figcaption{font-weight:800;color:var(--b2)}
.sn-mo-rv small{font-weight:600;color:var(--mut)}
.sn-story{grid-template-columns:1fr 1.05fr;gap:56px;align-items:center}
.sn-story>*,.sn-visit>*,.sn-pk>*{min-width:0}
.sn-story-p+.sn-story-p{margin-top:10px}
.sn-story-v .sn-note{margin-top:12px}
.sn-fam2{display:grid;gap:12px;margin-top:24px}
.sn-fm2{display:flex;gap:14px;align-items:center;background:var(--sun);border-radius:16px;padding:12px 16px}
.sn-fm2 .sn-fm-av{width:56px;height:56px;margin:0;border-width:3px;box-shadow:0 0 0 3px var(--y);flex:0 0 auto}
.sn-fm2 .sn-fm-av span{font-size:.95rem}
.sn-fm2 small{display:block;font-size:.68rem;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--o)}
.sn-fm2 b{font-size:1.02rem}
.sn-fm2 p{color:var(--mut);font-size:.88rem;line-height:1.45;margin-top:2px}
.sn-tl{list-style:none;margin:48px 0 0;padding:28px 0 0;display:grid;grid-template-columns:repeat(8,1fr);gap:14px;position:relative}
.sn-tl:before{content:"";position:absolute;left:0;right:0;top:9px;height:4px;border-radius:4px;background:linear-gradient(90deg,var(--y),var(--o),var(--b))}
.sn-tl li{position:relative;font-size:.86rem;color:var(--mut);line-height:1.45}
.sn-tl li:before{content:"";position:absolute;left:0;top:-26px;width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid var(--b)}
.sn-tl li.hi:before{background:var(--y);border-color:var(--o);width:18px;height:18px;top:-28px}
.sn-tl b{display:block;font-size:1.15rem;font-weight:900;color:var(--b);margin-bottom:2px}
.sn-tl li.hi span{color:var(--ink);font-weight:700}
.sn-gk{margin-top:26px}
.sn-gk>b{display:block;font-size:.78rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--o);margin-bottom:10px}
.sn-notes2{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:8px 18px}
.sn-notes2 li{display:flex;gap:10px;align-items:flex-start;font-size:.92rem;font-weight:600;line-height:1.4}
.sn-notes2 .sn-ic{color:var(--b);flex:0 0 auto;margin-top:1px}
.sn-grp2{grid-column:1/-1;background:#fff;border-radius:22px;border:2px solid var(--y);box-shadow:0 8px 0 var(--y2)}
.sn-grp2 summary{list-style:none;display:flex;align-items:center;gap:14px;padding:20px 24px;cursor:pointer}
.sn-grp2 summary::-webkit-details-marker{display:none}
.sn-grp2 summary>.sn-ic{color:var(--o)}
.sn-grp2 summary>span:not(.sn-ic){flex:1}
.sn-grp2 summary b{display:block;font-size:1.12rem}
.sn-grp2 summary small{color:var(--mut);font-weight:600}
.sn-grp-plus{font-style:normal;font-weight:900;font-size:1.6rem;color:var(--b);width:40px;height:40px;border-radius:12px;background:var(--sky);display:grid;place-items:center;transition:transform .2s}
.sn-grp2[open] .sn-grp-plus{transform:rotate(45deg)}
.sn-grp-in{padding:0 24px 24px}
.sn-grp-in .sn-form{border:0;box-shadow:none;padding:0}
.sn-visit{row-gap:28px}
@media (max-width:960px){.sn-spec{grid-template-columns:1fr 1fr}.sn-spec .sn-chalk{grid-column:1/-1}.sn-mosaic{columns:2}.sn-tl{grid-template-columns:repeat(4,1fr);row-gap:30px}.sn-tl:before{display:none}.sn-hbadge{left:-10px}}
@media (max-width:760px){
.sn-hero{padding:30px 0 80px}.sn-hero h1{font-size:2.9rem}.sn-hero-v{margin-top:16px}.sn-rbadge{right:-4px;top:-14px;padding:9px 12px}.sn-hbadge{display:none}.sn-hero .sn-sticker{left:-6px;bottom:-22px}
.sn-sec{padding:60px 0}.sn-pick{padding:44px 0 60px}.sn-pk{padding:26px 20px;border-radius:24px}
.sn-favs,.sn-mosaic,.sn-tl,.sn-fam2{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scroll-padding-inline:24px;gap:14px;margin-left:-24px;margin-right:-24px;padding-left:24px;padding-right:24px;padding-bottom:10px;columns:auto;scrollbar-width:none}
.sn-favs::-webkit-scrollbar,.sn-mosaic::-webkit-scrollbar,.sn-tl::-webkit-scrollbar,.sn-fam2::-webkit-scrollbar{display:none}
.sn-fam2>*{flex:0 0 84%;scroll-snap-align:start}.sn-fam2{align-items:stretch}
.sn-favs>*,.sn-mosaic>*{flex:0 0 82%;scroll-snap-align:start;margin:0}
.sn-mosaic>.sn-mo-ph img{height:100%;object-fit:cover}
.sn-tl{padding-top:30px}.sn-tl:before{display:block;left:24px;right:auto;width:1100px}.sn-tl li{flex:0 0 58%;scroll-snap-align:start}
.sn-spec{grid-template-columns:1fr}.sn-spec .sn-deal,.sn-spec .sn-deal.d1{transform:none}
.sn-notes2{grid-template-columns:1fr}.sn-grp2 summary{padding:16px}.sn-grp-in{padding:0 16px 18px}
.sn-swipe{display:block}
}
@media (prefers-reduced-motion:reduce){.sn *{animation:none!important;transition:none!important}}
@media (max-width:960px){.sn-hero-g,.sn-story,.sn-visit{grid-template-columns:1fr}.sn-favs,.sn-revs{grid-template-columns:1fr 1fr}.sn-menu{grid-template-columns:1fr}.sn-art{max-width:560px}}
@media (max-width:760px){.sn-links,.sn-nav .sn-btn,.sn-top-r{display:none}.sn-mlinks{display:flex;overflow-x:auto;gap:2px;padding:0 14px 10px}.sn-mlinks button{white-space:nowrap}
.sn-sec{padding:64px 0}.sn-hero{padding-top:32px}.sn-favs,.sn-revs,.sn-notes{grid-template-columns:1fr}.sn-west{grid-template-columns:1fr}.sn-foot-in{grid-template-columns:1fr}.sn-menu-box{padding:18px}.sn-cta .sn-btn{flex:1 1 auto;justify-content:center}}
/* ===== Sunshine: bold blue & butter look (Flipwink style) ===== */
.sn.fw{--y:#FBE08A;--y2:#F5CF5C;--o:#1E3A9C;--b:#1E3A9C;--b2:#16307F;--ink:#16307F;--mut:#3B4F8F;--sky:#FFF6DE;--sun:#FBE08A;--ln:#E9DDB4;--cream:#FFF6DE;background:var(--cream);color:var(--ink);font-family:'Rubik',ui-rounded,sans-serif}
.sn.fw h1,.sn.fw h2,.sn.fw h3{font-family:'Rubik',ui-rounded,sans-serif;font-weight:800;letter-spacing:-.035em;color:var(--b)}
.sn.fw h2{font-size:clamp(2.3rem,5vw,3.8rem);line-height:.98}
.sn.fw .sn-kick{color:var(--b);font-weight:700;letter-spacing:.16em;font-size:.74rem}
.sn.fw .sn-kick:before{content:"";width:7px;height:7px;border-radius:50%;background:var(--b)}
.sn.fw .sn-kick>svg,.sn.fw .sn-kick .sn-ki{display:none}
.sn.fw .sn-top{background:var(--b);text-transform:uppercase;letter-spacing:.12em;font-size:.72rem;font-weight:700}
.sn.fw .sn-nav{background:var(--cream);border-bottom:2px solid var(--b)}
.sn.fw .sn-brand b{font-weight:800;font-size:1.7rem;letter-spacing:-.04em;color:var(--b)}
.sn.fw .sn-brand small{color:var(--b);font-weight:700;letter-spacing:.14em}
.sn.fw .sn-logo{color:var(--b)}
.sn.fw .sn-links button{color:var(--b);font-weight:700}
.sn.fw .sn-nav-in{justify-content:flex-start}.sn.fw .sn-nav-in .sn-links{margin-left:auto;margin-right:18px;gap:8px}
.sn.fw .sn-btn{border-radius:14px;font-weight:700;box-shadow:none}
.sn.fw .sn-btn.sun,.sn.fw .sn-btn.ink,.sn.fw .sn-btn.blue{background:var(--b);color:#fff;border-color:var(--b)}
.sn.fw .sn-btn.sun:hover,.sn.fw .sn-btn.ink:hover,.sn.fw .sn-btn.blue:hover{background:var(--b2)}
.sn.fw .sn-btn.white,.sn.fw .sn-btn.line{background:transparent;color:var(--b);border:2px solid var(--b)}
.sn.fw .sn-btn.white:hover,.sn.fw .sn-btn.line:hover{background:var(--b);color:#fff}
/* hero: yellow text panel + photo on blue */
.sn.fw .sn-hero{background:var(--b);padding:0;overflow:hidden}
.sn.fw .sn-burst{display:none}
.sn.fw .sn-hero .sn-wrap.sn-hero-g{max-width:none;padding:0;gap:0;grid-template-columns:1fr 1.15fr;align-items:stretch;min-height:0}
.sn.fw .sn-hero-t{background:var(--y);padding:36px 48px 36px max(28px,calc((100vw - 1160px)/2 + 24px));display:flex;flex-direction:column;justify-content:center;border-right:2px solid var(--b)}
.sn.fw .sn-hero h1{font-size:clamp(2.4rem,4.4vw,4rem);line-height:.92;letter-spacing:-.05em;color:var(--b)}
.sn.fw .sn-hero h1 em{font-style:normal;color:var(--b)}
.sn.fw .sn-lead{color:var(--b);font-weight:500;font-size:1.15rem}
.sn.fw .sn-hero-v{display:flex;align-items:center;justify-content:center;padding:28px 40px}
.sn.fw .sn-photo{max-width:520px!important}.sn.fw .sn-photo img{max-height:340px;object-fit:cover}
.sn.fw .sn-hero .sn-cta{margin-top:20px}.sn.fw .sn-lead{margin-top:10px}
.sn.fw .sn-hbadge{display:none}
.sn.fw .sn-sticker{width:96px;height:96px}
.sn.fw .sn-photo{border:0;transform:none;box-shadow:0 26px 50px rgba(0,0,0,.28);border-radius:22px;overflow:hidden;max-width:620px;width:100%}
.sn.fw .sn-photo img{border-radius:22px;border:0;display:block;width:100%}
.sn.fw .sn-photo:before,.sn.fw .sn-photo:after{display:none}
.sn.fw .sn-sticker{background:var(--y);color:var(--b);box-shadow:none;border:2px solid var(--b);transform:rotate(-12deg);left:auto;right:18px;top:18px;bottom:auto;width:118px;height:118px}
.sn.fw .sn-sticker b,.sn.fw .sn-sticker small,.sn.fw .sn-sk-ic{color:var(--b)}
.sn.fw .sn-rbadge,.sn.fw .sn-hbadge{background:var(--cream);color:var(--b);border:2px solid var(--b);box-shadow:none;border-radius:14px}
.sn.fw .sn-rbadge b,.sn.fw .sn-hbadge b{color:var(--b)}
.sn.fw .sn-stars,.sn.fw .sn-st{color:var(--b)!important;fill:var(--b)}
/* checkerboard strip */
.sn-chk{height:18px;background:conic-gradient(var(--b) 25%,var(--cream) 0 50%,var(--b) 0 75%,var(--cream) 0) 0 0/18px 18px}
.sn.fw .sn-marq{background:var(--y);color:var(--b);transform:none;margin:0;border-bottom:2px solid var(--b);padding:14px 0}
.sn.fw .sn-marq-in{font-weight:800;text-transform:uppercase;letter-spacing:.04em}
.sn.fw .sn-mi{color:var(--b)}
/* sections */
.sn.fw .sn-sec{background:var(--cream)}
.sn.fw .sn-sec.sky,.sn.fw .sn-sec.sun{background:var(--y)}
.sn.fw .sn-wv:before,.sn.fw .sn-wv:after{display:none!important}
.sn.fw .sn-favsec{background:var(--cream)}
.sn.fw .sn-head p,.sn.fw p{color:var(--mut)}
.sn.fw .sn-pk{background:var(--b);border-radius:26px;box-shadow:none;border:0}
.sn.fw .sn-pk h2,.sn.fw .sn-pk .sn-kick,.sn.fw .sn-pk-sub,.sn.fw .sn-pk-l{color:#fff}
.sn.fw .sn-pk .sn-kick:before{background:var(--y)}
.sn.fw .sn-pk-o button{border-radius:14px;border:2px solid #fff;background:transparent;color:#fff;box-shadow:none}
.sn.fw .sn-pk-o button[aria-pressed="true"]{background:var(--y);color:var(--b);border-color:var(--y)}
.sn.fw .sn-pk-res>*{border-radius:20px}
.sn.fw .sn-pk-wait,.sn.fw .sn-pk-card{background:var(--cream);color:var(--b);border:0}
.sn.fw .sn-pk-card h3,.sn.fw .sn-pk-card small,.sn.fw .sn-pk-wait p{color:var(--b)}
.sn.fw .sn-deal{background:var(--cream);border:2px solid var(--b);color:var(--b);border-radius:22px}
.sn.fw .sn-deal.d1{background:var(--b);color:#fff}.sn.fw .sn-deal.d1 *{color:#fff!important}
.sn.fw .sn-deal:before,.sn.fw .sn-deal:after{display:none}
.sn.fw .sn-deal small{color:var(--b);letter-spacing:.14em;font-weight:700}
.sn.fw .sn-deal-p{color:var(--b);font-weight:800}
.sn.fw .sn-chalk{background:var(--b);box-shadow:none}
.sn.fw .sn-menu-box{background:var(--cream);border:2px solid var(--b);border-radius:24px;box-shadow:none}
.sn.fw .sn-tabs button{border-radius:12px;color:var(--b);border:2px solid var(--b);background:transparent;font-weight:700}
.sn.fw .sn-tabs button[aria-selected="true"]{background:var(--b);color:#fff}
.sn.fw .sn-menu b,.sn.fw .sn-price{color:var(--b);font-weight:700}
.sn.fw .sn-dots{border-color:rgba(30,58,156,.35)}
.sn.fw .sn-badge{background:var(--y);color:var(--b)}
.sn.fw .sn-fav{background:#fff;border:2px solid var(--b);border-radius:24px;box-shadow:none;overflow:hidden}
.sn.fw .sn-fav:hover{transform:translateY(-4px);box-shadow:6px 6px 0 var(--b)}
.sn.fw .sn-fav-art{border-bottom:2px solid var(--b)}
.sn.fw .sn-fav-art.c0{background-color:var(--y)}.sn.fw .sn-fav-art.c1{background-color:#DCE4FA}.sn.fw .sn-fav-art.c2{background-color:var(--cream)}
.sn.fw .sn-fav-no{border-color:var(--b);color:var(--b)}
.sn.fw .sn-fav blockquote{color:var(--b);border-left-color:var(--b)}
.sn.fw .sn-mo-rv{background:var(--cream);border:2px solid var(--b);border-radius:22px;box-shadow:none}
.sn.fw .sn-mo-rv.c1{background:var(--b)}.sn.fw .sn-mo-rv.c1 *{color:#fff!important}
.sn.fw .sn-mo-rv blockquote,.sn.fw .sn-mo-rv figcaption{color:var(--b)}
.sn.fw .sn-mo-ph{border-radius:22px;border:2px solid var(--b);overflow:hidden;box-shadow:none}
.sn.fw .sn-tl li b{color:var(--b);font-weight:800}
.sn.fw .sn-tl li.hi b{background:var(--y)}
.sn.fw .sn-hours-card,.sn.fw .sn-map,.sn.fw .sn-grp2,.sn.fw .sn-gk{background:var(--cream);border:2px solid var(--b);border-radius:22px;box-shadow:none}
.sn.fw .sn-gk{padding:22px 24px}
.sn-roll{overflow:hidden!important;scroll-snap-type:none!important;display:block!important;padding-left:0!important;padding-right:0!important}
.sn-roll-t{display:flex;gap:0;width:max-content;animation:snRoll 40s linear infinite}
.sn-roll-t>*{flex:0 0 min(82vw,330px)!important;margin:0 14px 0 0!important}
.sn-fam2.sn-roll .sn-roll-t>*{flex-basis:min(84vw,330px)!important}
@keyframes snRoll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
.sn.fw .sn-chalk h3,.sn.fw .sn-chalk small,.sn.fw .sn-chalk li{color:#fff!important}
.sn.fw .sn-sticker{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:10px}
.sn.fw .sn-sticker b{font-size:1.25rem;line-height:1}.sn.fw .sn-sticker small{font-size:.5rem;letter-spacing:.04em;line-height:1.1;margin-top:2px;max-width:72px}
.sn.fw .sn-sticker .sn-sk-ic svg{width:22px;height:22px}
.sn.fw .sn-pk:before,.sn.fw .sn-pk:after,.sn.fw .sn-pk-q:before,.sn.fw .sn-pk-q:after{display:none!important}
.sn.fw .sn-pk-o button svg,.sn.fw .sn-pk-o button .sn-ic{color:currentColor}
.sn.fw .sn-hero .sn-cta .sn-btn{width:auto!important;flex:0 0 auto}
@media (max-width:860px){.sn.fw .sn-hero .sn-cta .sn-btn{width:auto!important;flex:1 1 40%;font-size:.84rem;white-space:nowrap;padding:12px 10px!important;gap:6px}.sn.fw .sn-hero .sn-cta .sn-btn:last-child{flex-basis:100%}.sn.fw .sn-hero h1{font-size:2.3rem}.sn.fw .sn-lead{font-size:1rem}}
.sn.fw .sn-photo,.sn.fw .sn-photo img{transform:none!important;rotate:0deg}
.sn.fw .sn-hero-v{position:relative}
.sn.fw .sn-sticker{right:28px;top:22px}
.sn.fw .sn-rbadge{right:auto;left:28px;top:22px}
.sn.fw .sn-hero .sn-cta{flex-direction:row;flex-wrap:wrap}
.sn.fw .sn-hours li.today{background:var(--y);color:var(--b)}
.sn.fw .sn-contact svg,.sn.fw .sn-notes2 svg,.sn.fw .sn-hours-card h3 svg{color:var(--b)}
.sn.fw .sn-map-tabs button[aria-selected="true"]{background:var(--b);color:#fff}
/* big footer band */
.sn-bigfoot{display:none}
.sn.fw .sn-bigfoot{display:block;background:var(--b);color:#fff;padding:34px 0}
.sn.fw .sn-bigfoot-in{display:flex;align-items:center;gap:26px;flex-wrap:wrap}
.sn.fw .sn-bigfoot b{font-family:'Rubik',sans-serif;font-weight:800;font-size:clamp(2.6rem,6vw,4.4rem);letter-spacing:-.05em;line-height:1}
.sn.fw .sn-bigfoot span{font-weight:600;font-size:1.15rem;padding-left:26px;border-left:2px solid rgba(255,255,255,.4)}
.sn.fw .sn-foot{background:var(--b2);color:#DCE4FA}
.sn.fw .sn-foot .sn-brand b,.sn.fw .sn-foot .sn-brand small,.sn.fw .sn-foot .sn-logo{color:#fff}
.sn.fw .sn-foot p{color:#C9D3F0}
@media (max-width:860px){
.sn.fw .sn-hero .sn-wrap.sn-hero-g{grid-template-columns:1fr;min-height:0}
.sn.fw .sn-hero-t{padding:26px 20px 24px;border-right:0;border-bottom:2px solid var(--b)}
.sn.fw .sn-hero-v{padding:18px 18px 22px}.sn.fw .sn-photo img{max-height:220px}.sn.fw .sn-hero .sn-cta{gap:10px}.sn.fw .sn-hero .sn-cta .sn-btn{padding:12px 16px}
.sn.fw .sn-sticker{width:84px;height:84px;right:6px;top:6px}.sn.fw .sn-sticker b{font-size:1.05rem}.sn.fw .sn-sticker small{font-size:.44rem;max-width:62px}.sn.fw .sn-sticker .sn-sk-ic svg{width:18px;height:18px}
.sn.fw .sn-mlinks{justify-content:space-between;gap:0;padding:0 8px 10px;overflow:visible}.sn.fw .sn-mlinks button{padding:8px 6px;font-size:.88rem}
.sn.fw .sn-bigfoot span{padding-left:0;border-left:0}
}
/* ===== REALTY (real estate agent): modern black and white ===== */
body.t-rt{background:#fff}
.rt{--k:#0A0A0A;--k2:#141414;--g:#F4F4F4;--g2:#E6E6E6;--m:#6B6B6B;--ln:#E2E2E2;color:var(--k);background:#fff;font-family:var(--font-b);overflow-x:hidden}
.rt-wrap{max-width:1200px;margin:0 auto;padding:0 28px;position:relative}
.rt h1,.rt h2,.rt h3,.rt h4{font-family:var(--font-h);letter-spacing:-.02em;line-height:1.08;color:inherit}
.rt-nav{position:absolute;top:0;left:0;right:0;z-index:30;color:#fff}
.rt-nav.solid{position:fixed;background:rgba(10,10,10,.92);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
.rt-nav-in{display:flex;align-items:center;justify-content:space-between;gap:24px;min-height:82px}
.rt-brand{display:flex;flex-direction:column;text-decoration:none;color:#fff;line-height:1.15}
.rt-brand b{font-size:1.35rem;font-weight:800;letter-spacing:.01em}
.rt-brand span{font-size:.62rem;letter-spacing:.22em;text-transform:uppercase;opacity:.75;margin-top:5px}
.rt-links{display:flex;gap:4px;align-items:center}
.rt-links a,.rt-links button,.rt-mlinks button{background:none;border:0;cursor:pointer;color:inherit;font-weight:600;font-size:.94rem;padding:8px 14px;text-decoration:none;opacity:.9}
.rt-links a:hover,.rt-links button:hover{opacity:1;text-decoration:underline;text-underline-offset:6px}
.rt-navcall{color:#fff;text-decoration:none;font-weight:700;font-size:.92rem;border:1px solid rgba(255,255,255,.5);padding:9px 14px;border-radius:4px}
.rt-navcall:hover{background:#fff;color:#000}
.rt-mlinks{display:none}
.rt-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;font-weight:700;font-size:.95rem;border-radius:4px;padding:14px 28px;border:1.5px solid transparent;cursor:pointer;transition:background .2s,color .2s,transform .2s;letter-spacing:.01em}
.rt-btn:hover{transform:translateY(-1px)}
.rt-btn.solid{background:#fff;color:#000;min-width:150px}.rt-btn.solid:hover{background:#000;color:#fff;border-color:#fff}
.rt-btn.dark{background:#000;color:#fff}.rt-btn.dark:hover{background:#2A2A2A}
.rt-btn.outline{border-color:#000;color:#000;background:#fff}.rt-btn.outline:hover{background:#000;color:#fff}
/* hero */
.rt-hero{position:relative;background:#000;color:#fff;min-height:min(86vh,760px);display:flex;align-items:center;padding:130px 0 170px;overflow:hidden}
.rt-hero-ph{position:absolute;right:0;top:0;bottom:0;width:min(56%,760px)}
.rt-hero-ph img{width:100%;height:100%;object-fit:cover;object-position:60% 22%;filter:grayscale(1)}
.rt-hero-ph:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#000 0%,rgba(0,0,0,.55) 22%,rgba(0,0,0,0) 50%),linear-gradient(0deg,#000 0%,rgba(0,0,0,0) 28%),linear-gradient(180deg,rgba(0,0,0,.6) 0%,rgba(0,0,0,0) 18%)}
.rt-hero-in{position:relative;z-index:1;width:100%}
.rt-hero h1{font-size:clamp(3rem,8vw,6.4rem);font-weight:800;max-width:760px}
.rt-sub{margin-top:18px;font-size:.82rem;letter-spacing:.28em;text-transform:uppercase;opacity:.8}
.rt-lead{margin-top:22px;font-size:1.15rem;max-width:520px;color:#CFCFCF}
.rt-hero-btns{display:flex;flex-wrap:wrap;gap:14px;margin-top:34px}
/* overlapping cards */
.rt-cards-sec{position:relative;z-index:2;margin-top:-110px}
.rt-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.rt-card{background:#fff;padding:34px 30px;box-shadow:0 24px 60px rgba(0,0,0,.14);display:flex;flex-direction:column;justify-content:space-between;gap:26px;border-radius:4px}
.rt-card-top{display:flex;gap:18px;align-items:flex-start}
.rt-cic{flex:0 0 52px;height:52px;border-radius:50%;background:#000;color:#fff;display:grid;place-items:center}
.rt-card h3{font-size:1.35rem;font-weight:800}
.rt-card p{margin-top:10px;color:var(--m);font-size:.96rem;line-height:1.6}
.rt-card .rt-btn{align-self:flex-start}
/* facts row */
.rt-facts-sec{padding:90px 0 40px}
.rt-facts-g{display:grid;grid-template-columns:1.1fr repeat(4,1fr);gap:24px;align-items:center}
.rt-facts-g h2{font-size:clamp(1.8rem,3vw,2.4rem);font-weight:800}
.rt-fact{border-left:1px solid var(--ln);padding-left:22px}
.rt-fact b{display:block;font-family:var(--font-h);font-size:clamp(1.5rem,2.6vw,2.2rem);font-weight:800;letter-spacing:-.02em;line-height:1.1}
.rt-fact span{display:block;margin-top:6px;color:var(--m);font-size:.9rem}
/* sections */
.rt-sec{padding:100px 0}
.rt-sec.gray{background:var(--g)}
.rt-sec.dark{background:#000;color:#fff}
.rt-head{max-width:760px;margin-bottom:46px}
.rt-kick{display:block;font-size:.74rem;font-weight:700;letter-spacing:.26em;text-transform:uppercase;color:var(--m);margin-bottom:12px}
.rt-head h2,.rt-about h2,.rt-contact h2{font-size:clamp(2rem,4.2vw,3.2rem);font-weight:800}
.rt-head p{margin-top:16px;color:var(--m);font-size:1.06rem;max-width:620px}
.rt-row{margin-top:36px}
.rt-about{display:grid;grid-template-columns:1.2fr .8fr;gap:70px;align-items:center}
.rt-about-t{margin-top:22px;font-size:1.08rem;color:#3A3A3A;line-height:1.75;white-space:pre-line}
.rt-about-ph{width:100%;aspect-ratio:4/5;object-fit:cover;object-position:58% 20%;filter:grayscale(1);border-radius:4px}
.rt-steps{list-style:none;display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:1px solid var(--k)}
.rt-steps li{padding:28px 26px 10px 0}
.rt-steps li+li{padding-left:26px;border-left:1px solid var(--ln)}
.rt-steps b{font-family:var(--font-h);font-size:.85rem;letter-spacing:.14em;color:var(--m)}
.rt-steps h3{font-size:1.3rem;font-weight:800;margin:10px 0 8px}
.rt-steps p{color:var(--m);font-size:.96rem;line-height:1.6}
.rt-sec.gray .rt-steps li+li{border-left-color:var(--g2)}
.rt-areas{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.rt-area{position:relative;min-height:260px;display:flex;align-items:flex-end;padding:26px;text-decoration:none;color:#fff;background:linear-gradient(160deg,#2B2B2B 0%,#111 60%,#000 100%);border:1px solid #262626;border-radius:4px;overflow:hidden;transition:transform .25s,border-color .25s}
.rt-area:hover{transform:translateY(-4px);border-color:#fff}
.rt-area-n{position:absolute;top:18px;right:22px;font-family:var(--font-h);font-size:3.2rem;font-weight:800;color:rgba(255,255,255,.08);line-height:1}
.rt-area small{display:block;font-size:.8rem;opacity:.7}
.rt-area b{display:block;font-family:var(--font-h);font-size:1.7rem;font-weight:800;letter-spacing:-.02em;margin:2px 0 8px}
.rt-area em{font-style:normal;font-size:.86rem;display:inline-flex;align-items:center;gap:6px;opacity:.85}
.rt-socs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.rt-soc{display:flex;flex-direction:column;gap:6px;padding:30px;border:1px solid var(--ln);border-radius:4px;text-decoration:none;color:#000;background:#fff;transition:background .2s,color .2s,transform .2s}
a.rt-soc:hover{background:#000;color:#fff;transform:translateY(-3px)}
.rt-sic{width:56px;height:56px;border-radius:50%;background:#000;color:#fff;display:grid;place-items:center;margin-bottom:14px}
.rt-sic .ico,.rt-sic svg{width:24px!important;height:24px!important}
a.rt-soc:hover .rt-sic{background:#fff;color:#000}
.rt-soc b{font-size:1.25rem;font-weight:800}
.rt-soc span:last-child{color:var(--m);font-size:.92rem}
.rt-contact{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:start}
.rt-cl{list-style:none;margin-top:30px;border-top:1px solid #CFCFCF}
.rt-cl li{padding:16px 0;border-bottom:1px solid #CFCFCF}
.rt-cl small{display:block;font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:var(--m)}
.rt-cl a{color:#000;text-decoration:none;font-weight:700;font-size:1.08rem}
.rt-cl a:hover{text-decoration:underline}
.rt-contact h2{font-size:clamp(1.7rem,3vw,2.4rem)}
.rt-cp{margin:14px 0 24px;color:var(--m)}
.rt-form{display:grid;gap:12px}
.rt-f2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.rt-form input,.rt-form textarea{width:100%;border:1px solid #CFCFCF;background:#fff;border-radius:4px;padding:14px 16px;font-size:.98rem;color:#000;outline:none;transition:border-color .2s}
.rt-form input:focus,.rt-form textarea:focus{border-color:#000}
.rt-form .rt-btn{justify-self:start;min-width:140px}
.rt-foot{background:#000;color:#BDBDBD;padding:70px 0 34px;font-size:.92rem}
.rt-foot-g{display:grid;grid-template-columns:1.4fr 1fr 1fr 1.2fr;gap:30px;padding-bottom:40px;border-bottom:1px solid #262626}
.rt-foot-b b{display:block;color:#fff;font-family:var(--font-h);font-size:1.4rem;font-weight:800}
.rt-foot-b span{display:block;margin-top:6px;font-size:.66rem;letter-spacing:.2em;text-transform:uppercase}
.rt-foot h4{color:#fff;font-size:.95rem;margin-bottom:14px}
.rt-foot ul{list-style:none;display:grid;gap:8px}
.rt-foot a,.rt-foot button{color:#BDBDBD;text-decoration:none;background:none;border:0;padding:0;cursor:pointer;font:inherit;text-align:left}
.rt-foot a:hover,.rt-foot button:hover{color:#fff}
.rt-legal{margin-top:24px;font-size:.78rem;color:#7A7A7A}
.rt .rv-in{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease}.rt .rv-on{opacity:1;transform:none}
@media (prefers-reduced-motion:reduce){.rt *{transition:none!important}}
@media (max-width:1020px){.rt-facts-g{grid-template-columns:repeat(2,1fr)}.rt-facts-g h2{grid-column:1/-1}.rt-steps{grid-template-columns:repeat(2,1fr)}.rt-steps li:nth-child(3){padding-left:0;border-left:0}.rt-areas{grid-template-columns:repeat(2,1fr)}.rt-foot-g{grid-template-columns:1fr 1fr}}
@media (max-width:860px){.rt-links,.rt-navcall{display:none}.rt-nav{position:absolute}.rt-mlinks{display:flex;overflow-x:auto;padding:0 18px 10px;color:#fff}
.rt-hero{min-height:0;padding:330px 0 150px;align-items:flex-end}.rt-hero-ph{width:100%;bottom:auto;height:520px}.rt-hero-ph img{object-position:58% 15%}.rt-hero-ph:after{background:linear-gradient(0deg,#000 8%,rgba(0,0,0,.25) 55%,rgba(0,0,0,.55) 100%)}
.rt-cards{grid-template-columns:1fr}.rt-cards-sec{margin-top:-80px}.rt-sec{padding:70px 0}.rt-about,.rt-contact{grid-template-columns:1fr;gap:40px}.rt-about-ph{max-width:340px}.rt-socs{grid-template-columns:1fr}}
@media (max-width:560px){.rt-wrap{padding:0 20px}.rt-steps{grid-template-columns:1fr}.rt-steps li,.rt-steps li+li{padding:22px 0;border-left:0;border-bottom:1px solid var(--ln)}.rt-areas{grid-template-columns:1fr}.rt-area{min-height:170px}.rt-f2{grid-template-columns:1fr}.rt-hero-btns .rt-btn{flex:1;min-width:0;padding:14px 10px}.rt-foot-g{grid-template-columns:1fr}.rt-brand span{display:none}.rt-facts-g{grid-template-columns:1fr 1fr}}
/* realty: tools, guides, proof, languages */
.rt [hidden]{display:none!important}
.rt-mlinks button{white-space:nowrap;flex:0 0 auto}
.rt-langs{display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px;margin-top:22px;font-size:.95rem}
.rt-langs span{font-size:.7rem;letter-spacing:.24em;text-transform:uppercase;opacity:.65}
.rt-langs b{font-weight:600;padding:6px 12px;border:1px solid rgba(255,255,255,.35);border-radius:4px}
.rt-why{display:grid;grid-template-columns:1.3fr 1fr;gap:28px;margin-top:70px}
.rt-before,.rt-lang{border:1px solid var(--ln);border-radius:4px;padding:32px}
.rt-why h3{font-size:1.35rem;font-weight:800;margin-bottom:16px}
.rt-before ul{list-style:none;display:grid;gap:14px}
.rt-before li{display:grid;grid-template-columns:auto 1fr;gap:4px 14px;padding-bottom:14px;border-bottom:1px solid var(--ln)}
.rt-before li:last-child{border-bottom:0;padding-bottom:0}
.rt-before li:before{content:"";grid-row:span 2;width:10px;height:10px;margin-top:7px;background:#000}
.rt-before li b{font-weight:700}
.rt-before li span{color:var(--m);font-size:.95rem}
.rt-lang{background:#000;color:#fff;border-color:#000}
.rt-lang p{color:#BDBDBD;margin-bottom:18px}
.rt-lang ul{list-style:none;display:grid;gap:10px}
.rt-lang li{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:12px 0;border-top:1px solid #2A2A2A}
.rt-lang li b{font-size:1.25rem;font-weight:700}
.rt-lang li span{font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:#9A9A9A}
.rt-tools{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:56px;align-items:start;scroll-margin-top:100px}
.rt-tool{background:#fff;border:1px solid var(--ln);border-radius:4px;padding:30px;box-shadow:0 18px 50px rgba(0,0,0,.06);scroll-margin-top:100px}
.rt-sec.gray .rt-tool{border-color:var(--g2)}
.rt-sp-top{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:12px}
.rt-sp-top b{font-family:var(--font-h);font-size:1.3rem;font-weight:800;letter-spacing:-.01em}
.rt-sp-n{font-size:.75rem;letter-spacing:.16em;text-transform:uppercase;color:var(--m);white-space:nowrap}
.rt-sp-bar{height:3px;background:var(--g2);margin-bottom:22px}
.rt-sp-bar i{display:block;height:100%;background:#000;transition:width .35s ease}
.rt-q{font-weight:700;margin:4px 0 12px}
.rt-sp-p .rt-tg+.rt-q{margin-top:22px}
.rt-tg{display:flex;flex-wrap:wrap;gap:8px}
.rt-tg button{border:1px solid #CFCFCF;background:#fff;color:#000;border-radius:4px;padding:11px 15px;font-weight:600;font-size:.92rem;cursor:pointer;transition:background .15s,color .15s,border-color .15s}
.rt-tg button:hover{border-color:#000}
.rt-tg button[aria-pressed="true"]{background:#000;color:#fff;border-color:#000}
.rt-fg{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:6px}
.rt-fl{display:grid;gap:6px;font-size:.8rem;font-weight:600;color:#3A3A3A}
.rt-fl.wide{grid-column:1/-1}
.rt-fl input,.rt-fl select,.rt-fl textarea{width:100%;border:1px solid #CFCFCF;background:#fff;border-radius:4px;padding:12px 14px;font-size:.98rem;color:#000;font-weight:400}
.rt-fl input:focus,.rt-fl select:focus,.rt-fl textarea:focus{outline:none;border-color:#000}
.rt-sp-p>.rt-fl{margin-top:12px}
.rt-err{color:#000;font-weight:700;font-size:.88rem;min-height:1.2em;margin-top:12px}
.rt-sp-nav{display:flex;justify-content:space-between;gap:12px;margin-top:10px}
.rt-sp-nav .rt-btn{min-width:120px}
.rt-sp-nav .rt-btn.dark{margin-left:auto}
.rt-done{padding:20px 0}
.rt-done b{display:block;font-family:var(--font-h);font-size:1.3rem;font-weight:800;margin-bottom:8px}
.rt-done p{color:var(--m)}
.rt-calc .rt-calc-out{margin:22px 0 12px;padding:22px;background:#000;color:#fff;border-radius:4px}
.rt-calc-out small{font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:#9A9A9A}
.rt-calc-big{display:block;font-family:var(--font-h);font-size:clamp(2rem,4vw,2.8rem);font-weight:800;letter-spacing:-.02em;margin:4px 0 14px}
.rt-calc-out dl{display:grid;gap:6px;border-top:1px solid #2A2A2A;padding-top:12px}
.rt-calc-out dl div{display:flex;justify-content:space-between;gap:12px;font-size:.92rem;color:#CFCFCF}
.rt-calc-out dd{color:#fff;font-weight:700}
.rt-fine{font-size:.8rem;color:var(--m);margin-bottom:18px}
.rt-guide{display:grid;grid-template-columns:1.3fr 1fr;gap:40px;align-items:center;margin-top:24px;background:#000;color:#fff;border-radius:4px;padding:44px}
.rt-guide .rt-kick{color:#9A9A9A}
.rt-guide h3{font-size:clamp(1.5rem,2.6vw,2rem);font-weight:800;margin-bottom:10px}
.rt-guide p{color:#BDBDBD}
.rt-guide ol{margin:16px 0 0 20px;display:grid;gap:6px;color:#E6E6E6}
.rt-guide-f{display:grid;gap:12px}
.rt-guide-f .rt-fl{color:#BDBDBD}
.rt-guide-f .rt-fl input{background:#111;border-color:#333;color:#fff}
.rt-guide-f .rt-fl input:focus{border-color:#fff}
.rt-done-line{color:#E6E6E6;font-size:.9rem}
.rt-value{display:grid;grid-template-columns:.9fr 1.1fr;gap:56px;align-items:start;margin-top:70px;scroll-margin-top:100px}
.rt-value h2{font-size:clamp(1.8rem,3.4vw,2.6rem);font-weight:800}
.rt-checks{list-style:none;display:grid;gap:10px;margin-top:8px}
.rt-checks li{display:flex;gap:12px;align-items:center;font-weight:600}
.rt-checks li:before{content:"";width:18px;height:18px;flex:0 0 18px;background:#000 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3'%3E%3Cpath d='M5 12l5 5L19 7'/%3E%3C/svg%3E") center/12px no-repeat;border-radius:50%}
.rt-mt{margin-top:80px}
.rt-sold{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
.rt-sold-i{position:relative;display:grid;gap:4px}
.rt-sold-i img,.rt-sold-ph{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:4px;background:var(--g);filter:grayscale(1)}
.rt-sold-tag{position:absolute;top:12px;left:12px;background:#000;color:#fff;font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;padding:6px 10px;border-radius:3px}
.rt-sold-i b{margin-top:8px}.rt-sold-i small{color:var(--m)}
.rt-revs{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}
.rt-rev{border:1px solid var(--ln);border-radius:4px;padding:26px;margin:0}
.rt-stars{letter-spacing:3px;margin-bottom:10px}
.rt-rev blockquote{margin:0;color:#3A3A3A;line-height:1.65}
.rt-rev figcaption{margin-top:14px;font-weight:700}
button.rt-area{font:inherit;text-align:left;cursor:pointer;width:100%}
.rt-area[aria-expanded="true"]{border-color:#fff;background:linear-gradient(160deg,#3A3A3A 0%,#1A1A1A 60%,#000 100%)}
.rt-ag{margin-top:18px;border:1px solid #333;border-radius:4px;padding:34px;background:#0B0B0B}
.rt-ag-in{display:grid;grid-template-columns:1.1fr 1fr;gap:20px 40px}
.rt-ag small{font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:#9A9A9A}
.rt-ag h3{font-size:2rem;font-weight:800;margin:4px 0 10px}
.rt-ag p{color:#BDBDBD;line-height:1.7}
.rt-ag ul{list-style:none;display:grid;gap:10px;align-content:start}
.rt-ag li{padding:12px 0 12px 22px;border-bottom:1px solid #222;position:relative;color:#E6E6E6}
.rt-ag li:before{content:"";position:absolute;left:0;top:19px;width:8px;height:8px;background:#fff}
.rt-ag-btns{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:12px}
.rt-btn.line{border-color:rgba(255,255,255,.6);color:#fff;background:transparent}.rt-btn.line:hover{background:#fff;color:#000}
/* ===== Realty: brand palette, pages and compliance ===== */
.rt.lux{--navy:#1B365D;--navy2:#132744;--gold:#C5A059;--gold2:#AE8A45;--off:#F8F9FA;--kwred:#CE011F;background:#fff;color:#1E2833}
.rt.lux .rt-sec.gray{background:var(--off)}
.rt.lux .rt-sec.navy{background:var(--navy);color:#fff}
.rt.lux .rt-sec.navy .rt-kick{color:var(--gold)}.rt.lux .rt-sec.navy .rt-cp,.rt.lux .rt-sec.navy .rt-checks li{color:rgba(255,255,255,.82)}
.rt.lux .rt-sec.navy .rt-tool{background:#fff;color:#1E2833}
.rt.lux .rt-btn.gold{background:var(--gold);color:#13213A;border:1px solid var(--gold)}.rt.lux .rt-btn.gold:hover{background:var(--gold2);border-color:var(--gold2)}
.rt.lux .rt-btn.dark{background:var(--navy);border-color:var(--navy);color:#fff}.rt.lux .rt-btn.dark:hover{background:transparent;color:var(--navy)}
.rt.lux .rt-btn.outline{border-color:var(--navy);color:var(--navy)}.rt.lux .rt-btn.outline:hover{background:var(--navy);color:#fff}
.rt.lux .rt-kick{color:var(--gold2)}
.rt.lux .rt-nav,.rt.lux .rt-nav.solid{position:sticky;top:0;background:var(--navy);box-shadow:0 6px 24px rgba(10,20,40,.18);backdrop-filter:none}
.rt.lux .rt-nav-in{min-height:84px;gap:18px}
.rt.lux .rt-brand{flex-direction:row;align-items:center;gap:12px}
.rt-mono{width:46px;height:46px;display:grid;place-items:center;border:1.5px solid var(--gold);color:var(--gold);font-family:'Cormorant Garamond',Georgia,serif;font-size:1.35rem;font-weight:600;letter-spacing:.04em;flex:none}
.rt-mylogo{height:52px;width:auto}
.rt-brand-t b{display:block;font-family:'Cormorant Garamond',Georgia,serif;font-size:1.5rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;line-height:1}
.rt-brand-t span{display:block;font-family:'Montserrat',sans-serif;font-size:.74rem;letter-spacing:.06em;color:#E6EAF1;margin-top:5px;text-transform:none}
.rt.lux .rt-links{gap:18px}.rt.lux .rt-links a{color:#E6EAF1;text-decoration:none;font-size:.68rem;letter-spacing:.18em;text-transform:uppercase;font-weight:600;padding:6px 0;border-bottom:1px solid transparent}
.rt.lux .rt-links a:hover,.rt.lux .rt-links a.on{color:#fff;border-bottom-color:var(--gold)}
.rt-nav-r{display:flex;align-items:center;gap:14px}
.rt-kw{display:inline-flex;align-items:center;background:#fff;padding:8px 12px}
.rt-kw{padding:8px 14px!important;flex:none}.rt-kw img{height:40px;width:auto!important;max-width:none!important;display:block;flex:none}.rt-kw.nav img{width:88px!important;height:auto}.rt-kw.foot{padding:14px 18px!important}.rt-kw.foot img{height:58px}
.rt-kw.ph{background:transparent;border:1.5px dashed rgba(255,255,255,.55);flex-direction:column;align-items:flex-start;justify-content:center;min-width:150px;min-height:52px}
.rt-kw.ph b{color:#fff;font-family:'Montserrat',sans-serif;font-size:.68rem;font-weight:700;letter-spacing:.02em;line-height:1.2}
.rt-kw.ph small{color:rgba(255,255,255,.6);font-size:.56rem;letter-spacing:.08em;text-transform:uppercase;margin-top:3px}
.rt-ph{color:#E9C98A;font-style:italic}
.rt-clogo{height:44px;width:auto;display:block}
.rt-pair b{color:#fff}
.rt.lux .rt-brand .rt-brand-t b{font-size:1.32rem;letter-spacing:.02em}
.rt.lux .rt-links{gap:16px}.rt.lux .rt-links a{font-size:.62rem;letter-spacing:.14em}
.rt.lux .rt-kw.nav.ph{min-width:0;max-width:none;padding:6px 12px!important}.rt.lux .rt-cta{padding:13px 14px;font-size:.62rem;letter-spacing:.14em}.rt.lux .rt-nav-r{gap:10px}
@media (max-width:1200px){.rt.lux .rt-cta-l{display:none}}
@media (max-width:980px){.rt.lux .rt-brand .rt-brand-t b{font-size:.98rem}.rt.lux .rt-brand .rt-brand-t span{font-size:.6rem}.rt.lux .rt-kw.nav.ph{max-width:104px;padding:4px 6px!important}.rt.lux .rt-kw.nav.ph b{font-size:.56rem}}
.rt-idxblock{margin-top:22px;padding:18px 20px;border:1px dashed rgba(255,255,255,.25)}
.rt-idxblock b{display:block;color:#fff;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;margin-bottom:6px}
.rt-idxblock p{font-size:.78rem;line-height:1.6;color:#AEB8C5;margin:0}
.rt-kw-t{font-family:'Montserrat',sans-serif;font-weight:800;color:var(--kwred);font-size:.7rem;letter-spacing:.02em;line-height:1.15;max-width:132px}
.rt.lux .rt-cta{padding:14px 18px;font-size:.66rem;white-space:nowrap}
.rt.lux .rt-mlinks{display:none}
.rt.lux .rt-hero{min-height:calc((100vh - 84px)*.7);padding:44px 0 44px;background:var(--navy2)}
.rt.lux .rt-hero .rt-langs{display:none}.rt.lux .rt-hero .rt-lead{margin-top:14px}.rt.lux .rt-hsearch{margin-top:22px}.rt.lux .rt-hero-btns{margin-top:18px}.rt-hero-kick{margin-bottom:14px}
.rt.lux .rt-hero-bg:after{background:linear-gradient(180deg,rgba(19,39,68,.62) 0%,rgba(19,39,68,.38) 50%,rgba(19,39,68,.72) 100%)}
.rt.lux .rt-hero h1{font-size:clamp(2.8rem,7vw,5.6rem)}
.rt-hero-firm{font-family:'Montserrat',sans-serif;font-size:clamp(1rem,1.6vw,1.2rem);font-weight:600;letter-spacing:.08em;margin-top:14px;color:#fff}
.rt.lux .rt-hero-kick{color:var(--gold)}
.rt-hsearch{display:flex;width:100%;max-width:760px;margin:30px auto 0;background:#fff;box-shadow:0 20px 50px rgba(0,0,0,.3)}
.rt-hsearch input,.rt-hsearch select{border:0!important;font:inherit;font-size:1rem;padding:18px 20px;color:#1E2833;background:#fff;min-width:0}
.rt-hsearch input{flex:1}.rt-hsearch select{border-left:1px solid #E1E5EB!important;color:#4A5563}
.rt-hsearch .rt-btn{padding:0 28px;border:0}
.rt.lux .rt-hero-btns{margin-top:22px}
.rt-intro-in2{display:grid;grid-template-columns:.75fr 1.25fr;gap:60px;align-items:center;text-align:left}
.rt-intro-ph{width:100%;aspect-ratio:4/5;object-fit:cover;object-position:58% 20%;box-shadow:22px 22px 0 var(--off)}
.rt.lux .rt-intro h2{font-size:clamp(2.4rem,4.4vw,3.4rem)}
.rt.lux .rt-intro .rt-kick{justify-content:flex-start}.rt.lux .rt-intro .rt-kick:after{display:none}
.rt.lux .rt-intro p{color:#4A5563}
.rt-firm-line{font-family:'Montserrat',sans-serif!important;font-weight:600;letter-spacing:.06em;color:var(--navy)!important;margin-top:8px!important;font-size:1rem!important;font-style:normal!important}
.rt.lux .rt-sec.navy .rt-firm-line,.rt-pghead .rt-firm-line{color:var(--gold)!important}
.rt.lux .rt-card:after{background:linear-gradient(180deg,rgba(19,39,68,.05) 30%,rgba(19,39,68,.85) 100%)}
.rt-lgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.rt-lcard{text-decoration:none;color:inherit;background:#fff;border:1px solid #E6E9EE}.rt-lph{position:relative;aspect-ratio:4/3;overflow:hidden}.rt-lph img{width:100%;height:100%;object-fit:cover}
.rt-lph span{position:absolute;top:12px;left:12px;background:var(--navy);color:#fff;font-size:.66rem;letter-spacing:.16em;text-transform:uppercase;padding:6px 10px}
.rt-lb{padding:18px}.rt-lb b{display:block;font-family:'Cormorant Garamond',serif;font-size:1.6rem}.rt-lb span,.rt-lb small{display:block;color:#5A6472;font-size:.9rem}
.rt-lempty{display:flex;justify-content:space-between;align-items:center;gap:30px;flex-wrap:wrap;background:#fff;border:1px solid #E1E5EB;border-left:4px solid var(--gold);padding:30px 34px}
.rt-lempty b{font-family:'Cormorant Garamond',serif;font-size:1.7rem;font-weight:600;color:var(--navy)}.rt-lempty p{color:#5A6472;max-width:560px;margin-top:6px;line-height:1.6}
.rt-hv-in,.rt-consult{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.rt.lux .rt-hv{background:linear-gradient(90deg,var(--off) 0 50%,#fff 50%)}
.rt-hv-f{display:grid;gap:12px}
.rt-consult-f{display:grid;gap:12px}.rt-consult-f input[type=date]{min-height:48px}
.rt.lux .rt-sec.navy .rt-consult h2{color:#fff}
.rt-pghead{background:var(--navy);color:#fff;padding:70px 0 56px;border-bottom:3px solid var(--gold)}
.rt-pghead h1{font-family:'Cormorant Garamond',serif;font-weight:500;font-size:clamp(2.4rem,5vw,3.8rem);line-height:1.05;margin-top:8px}
.rt-pghead p{color:rgba(255,255,255,.8);max-width:640px;margin-top:12px;line-height:1.6}
.rt.lux .rt-pghead .rt-kick{color:var(--gold)}
.rt-srch{display:grid;grid-template-columns:380px 1fr;gap:24px;align-items:stretch}
.rt-sfilters{display:grid;gap:12px;align-content:start}
.rt-smap{min-height:520px;border:1px solid #E1E5EB}.rt-smap iframe{width:100%;height:100%;min-height:520px;border:0}
.rt-alert{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;margin-top:40px;background:var(--off);padding:36px;border-top:3px solid var(--gold)}
.rt-alert h3{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:1.9rem;margin-top:6px;color:var(--navy)}.rt-alert p{color:#5A6472;margin-top:8px;line-height:1.6}
.rt-alert-f{display:grid;gap:12px}
.rt-stats{display:flex;justify-content:space-between;align-items:center;gap:30px;flex-wrap:wrap}
.rt-legalpg{max-width:820px}.rt-legalpg p{line-height:1.8;color:#3E4855;margin-bottom:16px}
.rt.lux .rt-foot{background:var(--navy2);color:#C9D1DC}
.rt-foot-firm{display:block;color:#fff!important;font-weight:600;letter-spacing:.04em!important;text-transform:none!important;font-size:.92rem!important;margin:6px 0 14px}
.rt.lux .rt-foot-g{border-bottom-color:rgba(255,255,255,.12)}
.rt.lux .rt-foot a{color:#C9D1DC}.rt.lux .rt-foot a:hover{color:var(--gold)}
.rt-comply{display:flex;justify-content:space-between;gap:30px;align-items:center;padding-top:26px;flex-wrap:wrap}
.rt-comply-t p{font-size:.8rem;line-height:1.7;color:#AEB8C5;margin:0}.rt-comply-t b{color:#fff}
.rt-comply-t a{color:#C9D1DC;text-decoration:underline}
.rt-comply-l{display:flex;align-items:center;gap:18px}
.rt-eho{display:flex;align-items:center;gap:8px;color:#fff}.rt-eho small{font-size:.58rem;font-weight:700;letter-spacing:.06em;line-height:1.2}
.rt-realtor{display:flex;flex-direction:column;align-items:center;color:#fff}.rt-realtor b{width:38px;height:38px;display:grid;place-items:center;border:2px solid #fff;font-family:Georgia,serif;font-size:1.4rem}.rt-realtor small{font-size:.58rem;font-weight:700;margin-top:3px}
/* ===== Realty home layout (reference: Luxury Presence style) ===== */
.rt-apanels{display:grid;grid-template-columns:1fr 1fr}
.rt-apanel{position:relative;min-height:0;aspect-ratio:16/9;display:flex;align-items:flex-end;overflow:hidden;color:#fff}
.rt-apanel img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 1.2s ease}
.rt-apanel:hover img{transform:scale(1.05)}
.rt-apanel:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(19,39,68,.1) 20%,rgba(19,39,68,.85) 100%)}
.rt-apanel-in{position:relative;z-index:1;padding:50px 48px;max-width:560px}
.rt-apanel h2{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:clamp(2.4rem,4vw,3.6rem);text-transform:uppercase;letter-spacing:.08em;line-height:1}
.rt-apanel p{margin:14px 0 22px;line-height:1.7;color:rgba(255,255,255,.88)}
.rt-who{position:relative;padding:150px 0;color:#fff;text-align:center;overflow:hidden}
.rt-who-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.rt-who:after{content:"";position:absolute;inset:0;background:rgba(19,39,68,.72)}
.rt-who-in{position:relative;z-index:1;max-width:780px}
.rt.lux .rt-who .rt-kick{justify-content:center;color:var(--gold)}.rt.lux .rt-who .rt-kick:after{content:"";width:36px;height:1px;background:currentColor}
.rt-who h2{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:clamp(2.4rem,4.6vw,3.8rem);line-height:1.08;margin:6px 0 18px}
.rt-who p{color:rgba(255,255,255,.88);line-height:1.8;font-size:1.05rem}
.rt.lux .rt-who .rt-firm-line{color:var(--gold)!important;margin:16px 0 26px!important}
.rt-ftabs{display:flex;align-items:center;gap:28px;border-bottom:1px solid #DDE2E9;margin:-20px 0 30px}
.rt-ftabs button{background:none;border:0;padding:12px 0;font-family:'Montserrat',sans-serif;font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;font-weight:600;color:#6B7684;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}
.rt-ftabs button.on{color:var(--navy);border-bottom-color:var(--gold)}
.rt-viewall{margin-left:auto;font-size:.7rem;letter-spacing:.22em;text-transform:uppercase;font-weight:600;color:var(--navy);text-decoration:none;border-bottom:1px solid var(--gold);padding-bottom:4px}
.rt-best{padding:100px 0 60px}
.rt-best-h{text-align:center;margin-bottom:44px}.rt.lux .rt-best-h .rt-kick{justify-content:center}.rt.lux .rt-best-h .rt-kick:after{content:"";width:36px;height:1px;background:currentColor}
.rt-best-h h2{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:clamp(2.2rem,4.4vw,3.4rem);line-height:1.1}
.rt-mguides{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.rt-mguide{position:relative;min-height:360px;display:flex;align-items:flex-end;color:#fff;text-decoration:none;overflow:hidden}
.rt-mguide img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform .9s}
.rt-mguide:hover img{transform:scale(1.06)}
.rt-mguide:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(19,39,68,0) 35%,rgba(19,39,68,.85) 100%)}
.rt-mguide>div{position:relative;z-index:1;padding:28px}
.rt-mguide h3{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:2rem;text-transform:uppercase;letter-spacing:.06em}
.rt-mguide span{display:inline-flex;align-items:center;gap:8px;margin-top:8px;font-size:.66rem;letter-spacing:.24em;text-transform:uppercase;font-weight:600;border-bottom:1px solid var(--gold);padding-bottom:4px}
.rt-bio{display:grid;grid-template-columns:.8fr 1.2fr;gap:70px;align-items:center}
.rt-bio-ph{width:100%;aspect-ratio:4/5;object-fit:cover;object-position:58% 20%;box-shadow:-22px 22px 0 var(--off)}
.rt.lux .rt-bio h2{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:clamp(2.2rem,4vw,3.2rem);line-height:1.08}
.rt-bio-t{margin:18px 0 6px;color:#4A5563;line-height:1.8}
.rt-trust{list-style:none;padding:0;margin:20px 0 30px;display:grid;gap:14px}
.rt-trust li{border-left:2px solid var(--gold);padding-left:16px}.rt-trust b{display:block;font-family:'Cormorant Garamond',Georgia,serif;font-size:1.35rem;font-weight:600;color:var(--navy)}.rt-trust span{color:#5A6472;font-size:.95rem}
.rt-alerts{background:var(--navy);color:#fff;padding:60px 0}
.rt-alerts-in{display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
.rt-alerts h2{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:clamp(1.9rem,3.4vw,2.6rem)}.rt-alerts p{color:rgba(255,255,255,.78);margin-top:8px}
.rt-alerts-f{display:flex;flex-wrap:wrap;gap:0}.rt-alerts-f input{flex:1;min-width:200px;border:0;padding:17px 18px;font:inherit}.rt-alerts-f .rt-done-line{flex-basis:100%;color:var(--gold)}
.rt-work{background:var(--off);padding:110px 0;text-align:center}
.rt-work-in{max-width:760px}.rt.lux .rt-work .rt-kick{justify-content:center}.rt.lux .rt-work .rt-kick:after{content:"";width:36px;height:1px;background:currentColor}
.rt-work h2{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:clamp(2.4rem,4.6vw,3.6rem);color:var(--navy)}
.rt-work p{color:#5A6472;margin:14px 0 30px;line-height:1.7}.rt-work .rt-row{justify-content:center}
.rt-work .rt-btn.line{border-color:var(--navy);color:var(--navy)}.rt-work .rt-btn.line:hover{background:var(--navy);color:#fff}
.rt.lux .rt-best .rt-cards-sec{padding-bottom:0}
@media (max-width:860px){
.rt-apanels{grid-template-columns:1fr}.rt-apanel{aspect-ratio:auto;display:block;background:var(--navy)}.rt-apanel img{position:relative;display:block;height:auto;aspect-ratio:16/9}.rt-apanel:after{display:none}.rt-apanel-in{padding:24px 20px 34px}.rt-apanel:hover img{transform:none}
.rt-who{padding:90px 0}.rt-bio{grid-template-columns:1fr;gap:34px}.rt-bio-ph{max-width:320px}
.rt-alerts-in{grid-template-columns:1fr;gap:20px}.rt-mguide{min-height:260px}.rt-best{padding:70px 0 40px}.rt-work{padding:70px 0}
.rt-ftabs{gap:18px}
}
.rt.lux .rt-about-ph,.rt.lux .rt-bio-ph,.rt.lux .rt-intro-ph,.rt.lux img{filter:none!important}
.rt-consent{display:flex;gap:10px;align-items:flex-start;font-size:.78rem;line-height:1.5;color:#4A5563;margin:4px 0 2px;cursor:pointer}
.rt-consent input{width:18px!important;height:18px;min-height:0!important;margin-top:2px;flex:none;accent-color:var(--navy)}
.rt-unsub{flex-basis:100%;font-size:.78rem;color:rgba(255,255,255,.7);margin:8px 0 0}.rt-unsub a{color:var(--gold)}.rt-unsub.dark{color:#5A6472}.rt-unsub.dark a{color:var(--navy)}
.rt.lux .rt-kw.ph{background:#fff;border:0;padding:8px 14px!important;min-height:0}
.rt.lux .rt-kw.ph b{color:#1A1A1A;font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.rt.lux .rt-kw.ph small{color:#555;font-size:.62rem;font-weight:600;letter-spacing:.24em;text-transform:uppercase;margin-top:2px}
.rt.lux p.rt-idxblock{margin:20px 0 0;padding:14px 0 0;border:0;border-top:1px solid rgba(255,255,255,.1);font-size:.74rem;color:#93A0B2;line-height:1.6}
.rt-legalpg h2{font-family:'Cormorant Garamond',Georgia,serif;font-weight:600;font-size:1.6rem;color:var(--navy);margin:28px 0 8px}
.rt-legalpg ul{margin:0 0 16px 20px;color:#3E4855;line-height:1.8}.rt-legal-upd{font-size:.8rem;color:#8A94A3!important;text-transform:uppercase;letter-spacing:.12em}
.rt.lux .rt-kw:not(.ph){background:transparent;padding:0!important}
.rt.lux .rt-kw.nav:not(.ph) img{height:38px;width:auto!important}
.rt.lux .rt-kw.foot:not(.ph) img{height:52px;width:auto!important}
@media (max-width:980px){.rt.lux .rt-kw.nav:not(.ph) img{height:26px;width:auto!important}}
.rt.lux .rt-foot-g{grid-template-columns:1.3fr 1fr 1.2fr}
.rt.lux .rt-foot-b b{font-size:1.5rem;line-height:1.15}
.rt.lux p.rt-idxblock{border:0;padding:0;margin:6px 0 0}
.rt-legal-links{margin-top:10px!important}
@media (max-width:860px){.rt-work .rt-row{flex-direction:column;align-items:center}.rt-work .rt-row .rt-btn{width:100%;max-width:320px}.rt.lux footer.rt-foot .rt-foot-g{grid-template-columns:1fr;gap:28px}.rt.lux .rt-foot-b b{font-size:1.3rem}.rt.lux .rt-comply{padding-bottom:70px}}
.rt.lux .rt-row{display:flex;flex-wrap:wrap;gap:12px}
.rt-lempty .rt-row{gap:14px}
.rt-hero-bg.lights{overflow:hidden}
.rt-hero-bg.lights .rt-lfill,.rt-hero-bg.lights .rt-lfit{position:absolute;inset:0}
.rt-hero-bg.lights img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 22%;transform:none;animation:none}
.rt-hero-bg.lights .rt-lfill{display:none}
.rt-hero-bg.lights .rt-lfit{animation:rtZoom 18s ease-out forwards;transform:scale(1.04)}
.rt-hero-bg.lights img.on{opacity:0;animation:rtLights 2.6s ease-in-out .5s forwards}
@keyframes rtLights{from{opacity:0}to{opacity:1}}
@media (prefers-reduced-motion:reduce){.rt-hero-bg.lights img.on{animation:none;opacity:1}.rt-hero-bg.lights .rt-lfit{animation:none;transform:none}}
@media (max-width:860px){
.rt-hero-bg.lights .rt-lfill{display:none}
.rt-hero-bg.lights .rt-lfit{inset:0;top:0;height:auto;aspect-ratio:auto;transform:none;animation:none;-webkit-mask-image:none;mask-image:none}
.rt-hero-bg.lights .rt-lfit img{object-fit:cover;object-position:42% 40%}
}
}
.rt.lux .rt-best .rt-card{min-height:0!important;height:auto;aspect-ratio:auto;display:block;align-self:stretch}
.rt.lux .rt-best .rt-cards{align-items:stretch}.rt.lux .rt-best .rt-card{display:flex!important;flex-direction:column}.rt.lux .rt-best .rt-card-in{flex:1}
.rt.lux .rt-best .rt-card-img{position:relative;inset:auto;display:block;width:100%;height:auto}
.rt.lux .rt-best .rt-card-in{position:relative;padding:20px 22px 22px;background:var(--navy)}.rt.lux .rt-best .rt-card h3{font-size:1.5rem}
.rt.lux .rt-best .rt-card:after{display:none}
.rt.lux .rt-best .rt-card p{max-height:none;opacity:1;margin-top:8px}
.rt.lux .rt-best .rt-card:hover .rt-card-img{transform:none}
.rt.lux .rt-best .rt-card{min-height:0!important;background:var(--navy)}
@media (max-width:860px){.rt.lux .rt-best .rt-card{min-height:0}}
.rt-foot-b .rt-kw.foot{display:inline-flex;margin-top:4px;width:auto}
.rt.lux .rt-hv h2,.rt.lux .rt-consult h2,.rt.lux .rt-stats h2{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:clamp(2.2rem,4vw,3.2rem);line-height:1.08}
.rt-brand-t b{white-space:nowrap}
.rt.lux .rt-brand .rt-mono{display:grid;font-size:1.3rem;letter-spacing:.04em;opacity:1;margin:0;text-transform:none}.rt.lux .rt-brand .rt-brand-t{display:block;letter-spacing:0;opacity:1;margin:0;font-size:inherit;text-transform:none}
.rt.lux .rt-brand .rt-brand-t span{display:block;letter-spacing:.04em;opacity:1;font-size:.74rem}
@media (max-width:980px){
.rt.lux .rt-links,.rt.lux .rt-cta{display:none}.rt-kw.nav{padding:5px 8px!important}.rt-kw.nav img{width:66px!important}.rt-kw.nav.ph{min-width:0;min-height:40px;max-width:120px}.rt-kw.nav.ph small{font-size:.5rem!important;letter-spacing:.16em!important}.rt.lux .rt-kw.nav.ph b{font-size:.6rem!important}
.rt.lux .rt-mlinks a.rt-mcta{background:var(--gold);color:#13213A;padding:8px 12px;margin:6px 0;align-self:center;border:0}
.rt.lux .rt-nav-in{min-height:64px}.rt-mono{width:38px;height:38px;font-size:1.1rem}.rt-brand-t b{font-size:1.15rem}.rt.lux .rt-brand .rt-brand-t span{font-size:.62rem}
.rt.lux .rt-cta{padding:11px 12px;font-size:.62rem}
.rt.lux .rt-mlinks{display:flex;gap:20px;overflow-x:auto;scrollbar-width:none;padding:0 18px;border-top:1px solid rgba(255,255,255,.12)}.rt.lux .rt-mlinks::-webkit-scrollbar{display:none}
.rt.lux .rt-mlinks a{flex:none;color:#E6EAF1;text-decoration:none;font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;font-weight:600;padding:12px 0;border-bottom:2px solid transparent}.rt.lux .rt-mlinks a.on{border-bottom-color:var(--gold);color:#fff}
.rt.lux .rt-hero{min-height:0;padding:30px 0 32px}.rt.lux .rt-hero .rt-lead{font-size:1.1rem;margin-top:10px}.rt.lux .rt-hero-btns{flex-direction:row!important;max-width:none!important;gap:8px}.rt.lux .rt-hero-btns .rt-btn{flex:1;padding:13px 8px;font-size:.6rem;letter-spacing:.12em}.rt-hero-kick{font-size:.6rem;letter-spacing:.24em}
.rt-hsearch{flex-wrap:wrap}.rt-hsearch input{flex:1 1 100%;border-bottom:1px solid #E1E5EB!important}.rt-hsearch select{flex:1;border-left:0!important}.rt-hsearch .rt-btn{flex:1;padding:16px}
.rt-intro-in2,.rt-hv-in,.rt-consult,.rt-srch,.rt-alert{grid-template-columns:1fr;gap:30px}.rt-intro-ph{max-width:300px}.rt.lux .rt-hv{background:var(--off)}
.rt-lgrid{grid-template-columns:1fr}.rt-smap,.rt-smap iframe{min-height:320px}.rt-alert{padding:24px}.rt-pghead{padding:44px 0 36px}
.rt-comply{flex-direction:column;align-items:flex-start}
}

.rt-fab{position:fixed;right:16px;bottom:84px;z-index:40;display:none;align-items:center;gap:8px;background:#000;color:#fff;text-decoration:none;font-weight:700;padding:14px 18px;border-radius:4px;box-shadow:0 10px 30px rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.25);opacity:0;transform:translateY(12px);transition:opacity .25s,transform .25s;pointer-events:none}
.rt-fab.on{opacity:1;transform:none;pointer-events:auto}
@media (max-width:1020px){.rt-tools,.rt-value,.rt-guide,.rt-why{grid-template-columns:1fr}.rt-sold{grid-template-columns:repeat(2,1fr)}.rt-revs{grid-template-columns:1fr}.rt-ag-in{grid-template-columns:1fr}}
@media (max-width:860px){.rt-fab{display:inline-flex}.rt-guide{padding:30px}.rt-tool{padding:24px}.rt-why{margin-top:50px}}
@media (max-width:560px){.rt-fg{grid-template-columns:1fr}.rt-sold{grid-template-columns:1fr}.rt-ag{padding:24px}.rt-ag h3{font-size:1.6rem}.rt-sp-top{flex-direction:column;gap:4px}}
'''

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://script.google.com https://script.googleusercontent.com; form-action 'none'; base-uri 'none'; object-src 'none'; media-src https://assets.mixkit.co; frame-src https://www.google.com https://maps.google.com">
<title>Website Preview | Riverbend Web Co.</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Alfa+Slab+One&family=Pacifico&family=Work+Sans:wght@400;600;700;800&family=Archivo:wght@400;600;800&family=Fredoka:wght@500;600&family=Nunito:wght@600;700;800&family=Bebas+Neue&family=Bitter:wght@500;700;800&family=Rye&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Allura&family=Fraunces:ital,wght@1,400;1,500&family=Rubik:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&family=Outfit:wght@200;300;400;500;600&family=Montserrat:ital,wght@0,500;0,600;0,700;0,800;1,800;1,900&family=Lora:ital,wght@0,400;0,500;1,400&family=Playfair+Display:ital,wght@0,600;0,700;1,500&family=Barlow:wght@500;600;700&family=Barlow+Condensed:wght@600;700;800&display=swap" rel="stylesheet">
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
