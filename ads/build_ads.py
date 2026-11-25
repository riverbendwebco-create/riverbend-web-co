# Generates the 15 Riverbend ad pages (ads/adNN.html). Rendered to PNG by ads/render.mjs on GitHub Actions.
import os
D=os.path.dirname(os.path.abspath(__file__))
ARROW='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
def CHECK(c='#60A5FA'): return f'<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="{c}" opacity=".16"/><path d="M12 20.5l5.5 5.5L28.5 14" fill="none" stroke="{c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
LOCK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
def head(theme):
    logo='assets/logo-white.png' if theme=='dark' else 'assets/logo-color.png'
    return f'<div class="top"><div class="brand"><img src="{logo}" alt=""><b>Riverbend Web Co.</b></div><div class="tag">Dubuque, Iowa</div></div>'
def foot(cta='Get a free mockup'):
    return f'<div class="foot"><div class="url"><small>Visit</small>riverbendwebco.com</div><div class="cta">{cta} {ARROW}</div></div>'
def page(n,theme,body,cta='Get a free mockup',extra_css=''):
    html=f'''<!DOCTYPE html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lexend:wght@500;600;700;800&display=block" rel="stylesheet">
<link rel="stylesheet" href="ads.css"><style>{extra_css}</style></head>
<body><div class="ad {theme}">{head(theme)}{body}{foot(cta)}</div></body></html>'''
    open(os.path.join(D,f'ad{n:02d}.html'),'w').write(html)
def browser(shot,url,style,cls=''):
    return f'<div class="browser {cls}" style="{style}"><div class="bar"><i></i><i></i><i></i><span>{url}</span></div><img class="shot" src="shots/{shot}.png" alt=""></div>'
def phone(shot,style): return f'<div class="phone" style="{style}"><img src="shots/{shot}.png" alt=""></div>'

# 01 brand hero
page(1,'dark','''<div class="kicker">Custom websites</div>
<h1>Websites built by <em>cybersecurity experts.</em></h1>
<p class="sub">100% custom design from a veteran-owned team in Dubuque.</p>
<div class="laptop" style="left:150px;right:150px;bottom:205px"><div class="scr"><img src="shots/home-desk.png" alt=""></div><div class="base"></div></div>''')

# 02 no templates
page(2,'light','''<div class="kicker">100% custom</div>
<h1>No templates.<br>No per-page pricing.</h1>
<p class="sub">Every site is designed from scratch around your business.</p>
'''+browser('rest-desk','Sample design · restaurant','left:60px;width:600px;top:640px;transform:rotate(-4deg)')
   +browser('auto-desk','Sample design · auto shop','right:50px;width:600px;top:610px;transform:rotate(3deg)')
   +browser('trade-desk','Sample design · trades','left:220px;width:640px;top:780px;z-index:2')
   +'<p class="note" style="position:absolute;left:84px;bottom:172px">Sample designs</p>')

# 03 $0 down
rows=''.join(f'''<div class="prow{' hot' if h else ''}"><div><b>{n}</b><span>{d}</span></div><div class="pr">${p}<small>/mo</small></div></div>''' for n,d,p,h in [
 ('Starter','Everything you need to get online','109',False),('Custom','Built for businesses ready to grow','179',True),('Premium','Our highest level of service','349',False)])
page(3,'dark',f'''<div class="kicker">Simple pricing</div>
<h1>Launch your website for <em>$0 down.</em></h1>
<div class="plist">{rows}</div>
<p class="note" style="margin-top:26px;position:relative">12-month agreement. Nothing is charged until your website launches.</p>''','See the plans',
'''.plist{display:flex;flex-direction:column;gap:16px;margin-top:54px;position:relative}
.prow{display:flex;justify-content:space-between;align-items:center;padding:30px 36px;border-radius:22px;background:rgba(255,255,255,.05);border:1px solid rgba(148,163,184,.2)}
.prow b{display:block;font-family:Lexend;font-size:38px;font-weight:700}.prow span{display:block;font-size:22px;opacity:.6;margin-top:4px}
.pr{font-family:Lexend;font-weight:700;font-size:66px;letter-spacing:-.03em}.pr small{font-size:26px;opacity:.6;margin-left:4px;letter-spacing:0}
.prow.hot{background:linear-gradient(120deg,rgba(29,78,216,.55),rgba(0,82,204,.25));border-color:#60A5FA;box-shadow:0 30px 60px -30px rgba(29,78,216,.8)}''')

# 04 pay upfront
rows=''.join(f'''<div class="urow"><b>{n}</b><div><span>${s}</span><em>setup</em></div><i>+</i><div><span>${m}</span><em>per month</em></div></div>''' for n,s,m in [('Starter','499','50'),('Custom','999','75'),('Premium','2,499','100')])
page(4,'light',f'''<div class="kicker">Pay upfront</div>
<h1>Lower monthly rate.<br>No annual commitment.</h1>
<p class="sub">Pay the build once, then stay month-to-month.</p>
<div class="ulist">{rows}</div>''','Compare plans',
'''.ulist{display:flex;flex-direction:column;gap:14px;margin-top:56px}
.urow{display:grid;grid-template-columns:1.1fr 1fr 40px 1fr;align-items:center;padding:28px 34px;border-radius:22px;background:#fff;border:1px solid #E2E8F0;box-shadow:0 26px 50px -40px rgba(15,23,42,.4)}
.urow b{font-family:Lexend;font-size:34px}.urow span{display:block;font-family:Lexend;font-weight:700;font-size:50px;letter-spacing:-.03em;color:#0052CC}.urow em{font-style:normal;font-size:20px;color:#64748B}.urow i{font-style:normal;font-size:36px;color:#94A3B8;text-align:center}''')

# 05 security built in
page(5,'dark',f'''<div class="kicker">Cybersecurity</div>
<h1>Security isn't an add-on.<br><em>It's how we build.</em></h1>
<ul class="chk">
<li>{CHECK()}<span>Military cybersecurity experience<small>behind every site we build</small></span></li>
<li>{CHECK()}<span>SSL setup on every website<small>the padlock your customers look for</small></span></li>
<li>{CHECK()}<span>Security and maintenance<small>included in every plan</small></span></li>
</ul>
<div class="lockbig">{LOCK}</div>''','Talk to us',
'''.lockbig{position:absolute;right:60px;bottom:190px;width:330px;height:330px;color:rgba(96,165,250,.13)}.lockbig svg{width:100%;height:100%;stroke-width:1.2}''')

# 06 our systems
lines=[('Two-factor sign-in','with an authenticator app'),('Passwords hashed 600,000 times','PBKDF2-SHA256, never stored in plain text'),('Card numbers never stored','payments run through Square'),('Every permission checked on the server','not just hidden buttons')]
items=''.join(f'<div class="tl"><i>{CHECK("#34D399")}</i><div><b>{a}</b><span>{b}</span></div></div>' for a,b in lines)
page(6,'dark',f'''<div class="kicker">How we work</div>
<h1 class="sm">We lock down our own systems <em>first.</em></h1>
<div class="term"><div class="tbar"><i></i><i></i><i></i><span>riverbend · security checklist</span></div>{items}</div>
<p class="sub" style="font-size:27px;margin-top:30px">That's the standard we bring to your website.</p>''','Talk to us',
'''.term{position:relative;margin-top:50px;border-radius:22px;background:#0A101C;border:1px solid rgba(148,163,184,.22);overflow:hidden;box-shadow:0 40px 80px -40px rgba(0,0,0,.9)}
.tbar{display:flex;align-items:center;gap:9px;height:48px;padding:0 20px;background:#111A2B;border-bottom:1px solid rgba(148,163,184,.16)}.tbar i{width:13px;height:13px;border-radius:50%;background:#334155}.tbar span{margin-left:12px;font:500 17px ui-monospace,Menlo,monospace;color:#94A3B8}
.tl{display:flex;gap:22px;align-items:center;padding:24px 30px;border-bottom:1px solid rgba(148,163,184,.1)}.tl:last-child{border:0}.tl i svg{width:42px;height:42px}
.tl b{display:block;font-size:29px;font-weight:600}.tl span{display:block;font:400 19px ui-monospace,Menlo,monospace;color:#7DD3FC;margin-top:5px}''')

# 07 payments
page(7,'light',f'''<div class="kicker">Payment integrations</div>
<h1 class="sm">Take payments on your website, securely.</h1>
<p class="sub">Square-powered checkout, saved cards and automatic monthly billing, built right into your site.</p>
<div class="pay">
 <div class="pay-h"><b>Checkout</b><span>{LOCK} Secure</span></div>
 <div class="pay-l"><span>Monthly membership</span><b>$49.00</b></div>
 <div class="pay-l"><span>Billed on the 1st</span><b>Automatic</b></div>
 <div class="pay-card"><div class="pc-num">Card number</div><div class="pc-row"><div>MM / YY</div><div>CVC</div></div></div>
 <div class="pay-btn">Pay $49.00</div>
 <p class="pay-n">Example layout. Card details are handled by Square, never stored on your site.</p>
</div>''','Add payments',
'''.pay{position:absolute;left:170px;right:170px;top:640px;border-radius:28px;background:#fff;padding:36px 40px;border:1px solid #E2E8F0;box-shadow:0 50px 90px -50px rgba(15,23,42,.55)}
.pay-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:22px}.pay-h b{font-family:Lexend;font-size:34px}.pay-h span{display:flex;gap:8px;align-items:center;font-weight:700;font-size:20px;color:#16A34A}.pay-h svg{width:22px;height:22px}
.pay-l{display:flex;justify-content:space-between;padding:16px 0;border-bottom:1px solid #EEF2F7;font-size:24px;color:#475569}.pay-l b{color:#0F172A}
.pay-card{margin-top:24px;border:2px solid #CBD5E1;border-radius:16px;overflow:hidden;font-size:22px;color:#94A3B8}.pc-num{padding:20px 22px;border-bottom:2px solid #E2E8F0}.pc-row{display:grid;grid-template-columns:1fr 1fr}.pc-row div{padding:20px 22px}.pc-row div+div{border-left:2px solid #E2E8F0}
.pay-btn{margin-top:22px;height:72px;border-radius:16px;background:#0F172A;color:#fff;font-weight:700;font-size:26px;display:grid;place-items:center}
.pay-n{margin-top:14px;font-size:17px;color:#94A3B8;text-align:center}''')

# 08 works while you sleep
notes=[('New party request','40 guests · Saturday','11:42 PM','#60A5FA'),('Quote request','Interior painting · 3 rooms','6:05 AM','#34D399'),('Booking request','Table for 6 · Friday 7 PM','9:18 PM','#F5C26B')]
nn=''.join(f'<div class="nt" style="--c:{c};margin-left:{i*36}px"><i></i><div><b>{a}</b><span>{b}</span></div><em>{t}</em></div>' for i,(a,b,t,c) in enumerate(notes))
page(8,'dark',f'''<div class="kicker">Forms that work 24/7</div>
<h1>Your website should work while you <em>sleep.</em></h1>
<p class="sub">Booking and quote requests go straight to your phone, even at midnight.</p>
<div class="nstack">{nn}</div>''','Get a free mockup',
'''.nstack{position:relative;margin-top:60px;display:flex;flex-direction:column;gap:18px}
.nt{display:flex;align-items:center;gap:22px;width:760px;padding:26px 30px;border-radius:24px;background:rgba(255,255,255,.08);border:1px solid rgba(148,163,184,.22);backdrop-filter:blur(8px);box-shadow:0 30px 60px -40px rgba(0,0,0,.9)}
.nt i{flex:0 0 18px;height:18px;border-radius:50%;background:var(--c);box-shadow:0 0 0 7px color-mix(in srgb,var(--c) 22%,transparent)}
.nt div{flex:1}.nt b{display:block;font-size:30px;font-weight:700}.nt span{display:block;font-size:23px;opacity:.65;margin-top:3px}.nt em{font-style:normal;font-size:21px;opacity:.55;font-weight:600}''')

# 09 automate the busywork
tiles=[('E-signed agreements','Signed online, PDF copy emailed to both sides'),('Automatic billing','Charged on the 1st, receipts sent for you'),('Website chat assistant','Answers common questions any time'),('Lead tracking','New inquiries organized in one place')]
tt=''.join(f'<div class="at"><span>{i+1:02d}</span><b>{a}</b><p>{b}</p></div>' for i,(a,b) in enumerate(tiles))
page(9,'light',f'''<div class="kicker">Business automation</div>
<h1>Automate the <em>busywork.</em></h1>
<p class="sub">We built these systems to run our own business. We can build them for yours.</p>
<div class="agrid">{tt}</div>''','See what we build',
'''.agrid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-top:52px}
.at{padding:32px 30px;border-radius:24px;background:#fff;border:1px solid #E2E8F0;box-shadow:0 26px 50px -40px rgba(15,23,42,.45)}
.at span{display:inline-grid;place-items:center;width:52px;height:52px;border-radius:14px;background:#E8F0FE;color:#0052CC;font-family:Lexend;font-weight:700;font-size:21px;margin-bottom:20px}
.at b{display:block;font-family:Lexend;font-size:31px;letter-spacing:-.02em;line-height:1.15}.at p{margin-top:10px;font-size:22px;color:#64748B;line-height:1.4}''')

# 10 redesign
page(10,'dark','''<div class="kicker">Website redesigns</div>
<h1 class="sm">Your website is your first impression. <em>Make it count.</em></h1>
<p class="sub">Modern design, built for phones, set up for Google.</p>
'''+browser('bar-desk','Sample design · tavern','left:84px;width:760px;top:660px')+phone('bar-mob','right:84px;width:250px;top:600px'),'Get a free mockup')

# 11 google maps
page(11,'light',f'''<div class="kicker">Local search</div>
<h1>Get found on <em>Google Maps.</em></h1>
<p class="sub">Google Business Profile setup comes with every plan, along with your SEO foundation.</p>
'''+phone('trade-mob','left:110px;width:300px;top:600px')+f'''
<div class="pin"><svg viewBox="0 0 24 24" fill="#0052CC"><path d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12z"/><circle cx="12" cy="10" r="2.6" fill="#fff"/></svg></div>
<ul class="gchk">{''.join(f'<li>{CHECK("#0052CC")}<span>{t}</span></li>' for t in ['Hours customers can trust','One-tap call and directions','Your website linked right on your listing'])}</ul>''','Get found',
'''.pin{position:absolute;left:470px;top:640px;width:110px;height:110px;filter:drop-shadow(0 20px 26px rgba(0,82,204,.45))}.pin svg{width:100%;height:100%}
.gchk{position:absolute;left:470px;right:84px;top:800px;display:flex;flex-direction:column;gap:22px}.gchk li{list-style:none;display:flex;gap:18px;align-items:center;font-size:30px;font-weight:600;line-height:1.25}.gchk svg{flex:0 0 42px;height:42px}''')

# 12 mobile
page(12,'dark','''<div class="kicker">Mobile-friendly</div>
<h1 class="sm">Built for the phone in your <em>customer's hand.</em></h1>
'''+phone('rest-mob','left:70px;width:290px;top:560px;transform:rotate(-5deg)')+phone('auto-mob','left:395px;width:290px;top:520px;z-index:2')+phone('realty-mob','right:70px;width:290px;top:560px;transform:rotate(5deg)')
 +'<p class="note" style="position:absolute;left:84px;bottom:172px;z-index:3">Sample designs</p>','Get a free mockup')

# 13 ownership
page(13,'light',f'''<div class="kicker">You own it</div>
<h1>Your domain.<br>Your website.</h1>
<p class="sub">You own your domain from day one, and your custom website once it's paid off.</p>
<div class="addr"><span class="lk">{LOCK}</span><b>yourbusiness</b><em>.com</em></div>
<div class="own">{''.join(f'<div><b>{a}</b><span>{b}</span></div>' for a,b in [('Day one','Your domain is yours'),('Paid off','The site is yours'),('Always','Your content, your photos')])}</div>''','Get started',
'''.addr{margin-top:70px;display:flex;align-items:center;gap:20px;height:120px;padding:0 40px;border-radius:26px;background:#fff;border:2px solid #CBD5E1;box-shadow:0 40px 80px -50px rgba(15,23,42,.6);font-family:Lexend;font-size:58px;letter-spacing:-.03em}
.addr .lk{display:grid;place-items:center;width:64px;height:64px;border-radius:16px;background:#DCFCE7;color:#16A34A}.addr .lk svg{width:34px;height:34px}.addr b{font-weight:700}.addr em{font-style:normal;color:#0052CC;font-weight:700}
.own{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:22px}.own div{padding:26px;border-radius:20px;background:#fff;border:1px solid #E2E8F0}.own b{display:block;font-family:Lexend;font-size:28px;color:#0052CC}.own span{display:block;font-size:21px;color:#475569;margin-top:6px}''')

# 14 local
page(14,'dark',f'''<div class="kicker">Veteran-owned · Local</div>
<h1>Real people. Right here in <em>Dubuque.</em></h1>
<p class="sub">Meet us for coffee, call or text, and talk to the people who actually build your site.</p>
<div class="badges">{''.join(f'<div><b>{a}</b><span>{b}</span></div>' for a,b in [('Veteran-owned','Military cybersecurity background'),('Local support','Dubuque and the Tri-State'),('24/7 emergencies','On our Premium plan')])}</div>
<div class="phone-n"><span>Call or text</span><b>(608) 306-0135</b></div>
<img class="wm" src="assets/logo-white.png" alt="">''','Say hello',
'''.badges{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:56px}.badges div{padding:28px 26px;border-radius:22px;background:rgba(255,255,255,.05);border:1px solid rgba(148,163,184,.22)}
.badges b{display:block;font-family:Lexend;font-size:28px;color:#fff}.badges span{display:block;font-size:20px;opacity:.6;margin-top:8px;line-height:1.35}
.phone-n{position:relative;margin-top:44px}.phone-n span{display:block;font-size:20px;letter-spacing:.16em;text-transform:uppercase;font-weight:700;color:#60A5FA}.phone-n b{display:block;font-family:Lexend;font-size:84px;letter-spacing:-.03em;margin-top:6px}
.wm{position:absolute;right:-90px;bottom:120px;width:560px;opacity:.06}''')

# 15 portfolio
page(15,'dark','''<div class="kicker">Our work</div>
<h1 class="xs">From defense contractors to <em>restaurant software.</em></h1>
<div class="pgrid">'''+''.join(f'<div class="pg"><div class="browser" style="position:relative"><div class="bar"><i></i><i></i><i></i><span>{u}</span></div><img class="shot" src="shots/{s}.png" alt=""></div><b>{u}</b></div>' for s,u in [('cypher','cypher-llc.com'),('ghost','ghostplatform.ai'),('chefnerd','chefnerdai.com'),('tinyapp','tinyappcode.com')])+'</div>','See our work',
'''.pgrid{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:26px 24px;margin-top:50px}.pg b{display:block;margin-top:14px;font-size:21px;font-weight:600;opacity:.75}.pg .browser .bar{height:30px}.pg .browser .bar span{font-size:12px;height:18px}.pg .browser .bar i{width:9px;height:9px}''')
print('ads written')
