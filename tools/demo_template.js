(function(){
'use strict';
const API='https://script.google.com/macros/s/AKfycbwkosfcFSHGXy8EUaAFZ7Q-SFDFllV_k4n8qBABRxoj2hv59RspTU9APLQabwP_ohaW/exec';
const DAYS=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
const SHORT=['MON','TUE','WED','THU','FRI','SAT','SUN'];
const STOCK={
  pub:{hero:'1535958636474-b021ee887b13',pool:['1711130953835-7bcb75b163db','1713973724182-0fe31a59b445','1624855600799-ac8e8bddd1da','1608039755401-742074f0548d','1586793783658-261cddf883ef','1567696911980-2eed69a46042']},
  lounge:{hero:'1551632436-cbf8dd35adfa',pool:['1414235077428-338989a2e8c0','1514362545857-3bc16c4c7d1b','1663530761401-15eefb544889','1560053608-13721e0d69e8','1609951651556-5334e2706168','1467003909585-2f8a72700288','1500217052183-bc01eee1a74e','1657313666513-70770d329ef4','1774989423979-6a7bf5add3f0']},
  trade:{hero:'1632759145351-1d592919f522',pool:['1635424824849-1b09bdcc55b1','1576446470246-499c738d1c8e','1594233078955-e1f73a02ebb2']}
};
const root=document.getElementById('root');
const U=id=>'https://images.unsplash.com/photo-'+id+'?auto=format&fit=crop&w=1400&q=70';

/* ---------- safe DOM helpers (all text goes in as text) ---------- */
function h(tag,props,...kids){
  const n=document.createElement(tag);
  if(props) for(const k in props){ const v=props[k]; if(v==null||v===false) continue;
    if(k==='class') n.className=v; else if(k==='text') n.textContent=v; else if(k==='style') n.setAttribute('style',v);
    else if(k.slice(0,2)==='on') n.addEventListener(k.slice(2),v); else n.setAttribute(k,v); }
  kids.flat(9).forEach(c=>{ if(c==null||c===false) return; n.append(c.nodeType?c:document.createTextNode(String(c))); });
  return n;
}
function ico(id,size,cls){ const s=document.createElementNS('http://www.w3.org/2000/svg','svg'); s.setAttribute('class',cls||'ico'); if(size){s.setAttribute('width',size);s.setAttribute('height',size);} s.setAttribute('aria-hidden','true'); const u=document.createElementNS('http://www.w3.org/2000/svg','use'); u.setAttribute('href','#'+id); s.append(u); return s; }
const cssUrl=u=>'url("'+String(u).replace(/["\\\n\r]/g,'')+'")';
function bg(el,src,ov){ el.style.backgroundImage=(ov?ov+',':'')+(src?cssUrl(src)+',':'')+'radial-gradient(circle at 50% 40%,#44403c,#1c1917 70%)'; return el; }
const okImg=v=>/^data:image\/(png|jpeg|webp|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(v||'')?v:'';
const okUrl=u=>/^https:\/\/[^\s"'<>]+$/i.test(u||'')?u:'';
const hex=(v,d)=>/^#[0-9a-fA-F]{6}$/.test(v||'')?v:d;
const todayIx=()=>(new Date().getDay()+6)%7;
function sentences(t){ return String(t||'').split(/(?<=[.!?])\s+/).filter(Boolean); }
function short(t,n){ t=String(t||''); if(t.length<=n) return t; const s=sentences(t); let o=''; for(const x of s){ if((o+' '+x).trim().length>n) break; o=(o+' '+x).trim(); } return o||t.slice(0,n).replace(/\s+\S*$/,'')+'…'; }
function groups(items,fallback){ const g=[],m={}; items.forEach(i=>{ const k=i.group||fallback; if(!m[k]){m[k]=[];g.push(k);} m[k].push(i); }); return {names:g,map:m}; }
function scrollTo(id){ const t=document.getElementById(id); if(!t) return; const nav=document.querySelector('.pub-nav,.lg-nav,.tr-nav'); const y=t.getBoundingClientRect().top+scrollY-((nav?nav.offsetHeight:0)+8); window.scrollTo({top:y,behavior:'smooth'}); }
const jump=(id,label,cls)=>h('button',{type:'button',class:cls||null,onclick:()=>scrollTo(id)},label);

function fail(t,m){ root.replaceChildren(h('div',{class:'state'},h('div',null,h('h1',{text:t}),h('p',{text:m})))); }
const slug=new URLSearchParams(location.search).get('d')||'';
if(!/^[a-z0-9-]{3,80}$/.test(slug)){ fail('Preview not found','Check the link and try again.'); return; }
fetch(API+'?action=demo&slug='+encodeURIComponent(slug)).then(r=>r.json()).then(r=>{
  if(!r||!r.ok){ fail('Preview not found','This preview may have been removed.'); return; }
  build(r.demo);
}).catch(()=>fail('Couldn’t load this preview','Check your connection and refresh.'));

function build(d){
  const style=['pub','lounge','trade'].includes(d.style)?d.style:'pub';
  document.title=(d.name||'Preview')+' | Website preview';
  document.body.classList.add('t-'+style);
  const C={
    name:d.name||'', cat:d.category||'', city:d.city||'', addr:d.address||'', about:d.about||'', tag:d.tagline||'',
    phone:d.phone||'', email:/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email||'')?d.email:'',
    logo:okImg(d.logo), hours:(d.hours||[]).slice(0,7),
    items:(d.items||[]).filter(i=>i&&i.name), specials:(d.specials||[]).filter(i=>i&&i.title),
    fb:okUrl((d.social||{}).facebook), ig:okUrl((d.social||{}).instagram)
  };
  while(C.hours.length<7) C.hours.push('');
  C.hasHours=C.hours.some(Boolean);
  const digits=C.phone.replace(/\D/g,'');
  C.tel=digits.length>=10?'tel:+1'+digits.slice(-10):'';
  C.phoneTxt=digits.length>=10?'('+digits.slice(-10,-7)+') '+digits.slice(-7,-4)+'-'+digits.slice(-4):C.phone;
  C.maps=(C.addr||C.city)?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([C.name,C.addr,C.city].filter(Boolean).join(', ')):'';
  C.today=C.hours[todayIx()]||'';
  C.daysOpen=C.hours.filter(x=>x&&!/closed/i.test(x)).length;
  const own=(d.photos||[]).map(okUrl).filter(Boolean);
  const hero=okImg(d.hero)||own[0]||U(/^[0-9a-f-]{8,40}$/.test(d.heroPreset||'')?d.heroPreset:STOCK[style].hero);
  const pool=own.filter(u=>u!==hero).concat(STOCK[style].pool.map(U));
  C.own=own; C.hero=hero; C.pic=i=>pool.length?pool[i%pool.length]:hero;

  const p=hex((d.colors||{}).primary,''), a=hex((d.colors||{}).accent,'');
  const page=style==='pub'?pub(C):style==='lounge'?lounge(C):trade(C);
  if(style==='pub'&&p) page.style.setProperty('--gold',p),page.style.setProperty('--gold-2',p);
  if(style==='lounge'&&p) page.style.setProperty('--brass',p);
  if(style==='trade'){ if(p) page.style.setProperty('--tb',p); if(a) page.style.setProperty('--tg',a); }
  root.replaceChildren(page,rbBar(C));
}

function hoursRows(C,cls){ return C.hasHours?DAYS.map((day,i)=>h('div',{class:i===todayIx()?'today':null},h('span',null,day),h('span',null,C.hours[i]||'Closed'))):[]; }
function socials(C){ return (C.fb||C.ig)?h('div',{class:'socials','aria-label':'Social links'},C.fb?h('a',{href:C.fb,target:'_blank',rel:'noopener',title:'Facebook'},ico('i-fb',17)):null,C.ig?h('a',{href:C.ig,target:'_blank',rel:'noopener',title:'Instagram'},ico('i-ig',17)):null):null; }
function dayOf(w){ const m=String(w||'').toLowerCase().match(/(mon|tue|wed|thu|fri|sat|sun)/); return m?['mon','tue','wed','thu','fri','sat','sun'].indexOf(m[1]):-1; }

/* ===================== PUB (Lock & Dam Tap design) ===================== */
function pub(C){
  const G=groups(C.items,'Menu');
  const lines=sentences(C.tag).slice(0,3); const head=lines.length?lines:[C.name];
  const h2=h('h2',null,head.map((l,i)=>i===head.length-1&&head.length>1?h('span',null,l):[l,i<head.length-1?h('br'):null]));
  const stats=[ C.items.length?[String(C.items.length),'Menu Items']:null, C.daysOpen?[String(C.daysOpen),'Days a Week']:null, C.today&&!/closed/i.test(C.today)?['Open','Today '+C.today]:null, C.city?[C.city.split(',')[0],'Location']:null ].filter(Boolean).slice(0,4);
  const first=C.specials[0];
  const nav=h('div',{class:'pub-nav'},
    h('div',{class:'pub-logo'},C.logo?h('img',{src:C.logo,alt:C.name,class:'pub-logo-img'}):C.name,!C.logo?h('small',null,[C.cat,C.city.split(',')[0]].filter(Boolean).join(' · ')):null),
    h('div',{class:'pub-links'},C.items.length?jump('p-menu','Menu'):null,C.specials.length?jump('p-events','Specials'):null,jump('p-hours','Hours & Location')),
    C.today?h('span',{class:'live'},h('i'),/closed/i.test(C.today)?'Closed today':'Open today · '+C.today):null);
  const hh=first?h('div',{class:'pub-hh'},ico('i-beer',16),' '+[first.title,first.when,first.detail].filter(Boolean).join(' · ')):null;
  const heroEl=bg(h('section',{class:'pub-hero ph'},h('div',{class:'in'},
    (C.cat||C.city)?h('span',{class:'pub-kicker'},C.cat||C.city):null, h2,
    C.about?h('p',null,short(C.about,170)):null,
    h('div',{class:'pub-actions'},
      C.tel?h('a',{class:'pub-call',href:C.tel},ico('phone',18,''),'Tap to Call'):null,
      C.maps?h('a',{class:'pub-dir',href:C.maps,target:'_blank',rel:'noopener'},ico('map',18,''),'Get Directions'):null),
    stats.length?h('div',{class:'pub-stats'},stats.map(([b,t])=>h('div',null,h('b',null,b),t))):null)),
    C.hero,'linear-gradient(90deg,rgba(8,8,10,.94) 0%,rgba(8,8,10,.72) 45%,rgba(8,8,10,.25) 100%)');

  const spot=C.specials.length?h('section',{class:'pub-wrap',id:'p-events'},
    h('div',{class:'pub-h'},h('h3',null,'This Week’s Spotlight'),h('p',null,'Don’t miss these.')),
    h('div',{class:'spot'},C.specials.slice(0,4).map((s,i)=>bg(h('div',{class:'spot-card ph'},
      h('span',{class:'tag'+(i%2?' gold':'')},s.when||'Special'),h('h4',null,s.title),
      s.detail?h('div',{class:'deal'},s.detail.split(/\s*[,;·]\s*/).filter(Boolean).slice(0,3).map(x=>h('span',null,x))):null),
      C.pic(i),'linear-gradient(0deg,rgba(8,8,10,.92) 8%,rgba(8,8,10,.25) 70%)')))):null;

  let menu=null;
  if(C.items.length){
    const photo=h('div',{class:'menu-photo ph',id:'pubMenuPhoto'},h('span',{id:'pubMenuCap'}));
    const list=h('div',{class:'menu-list',id:'pubMenuList'});
    const show=(k,ix)=>{ const its=G.map[k]; bg(photo,C.pic(ix+2),'linear-gradient(0deg,rgba(13,13,15,.85) 5%,rgba(13,13,15,.15) 60%)'); photo.firstChild.textContent=its[0].name;
      list.replaceChildren(...its.map(i=>h('div',{class:'mi'},h('div',null,h('b',null,i.name),i.desc?h('small',null,i.desc):null),i.price?h('span',{class:'p'},i.price):null))); };
    const tabs=G.names.length>1?h('div',{class:'menu-tabs',role:'tablist'},G.names.slice(0,6).map((k,ix)=>{ const b=h('button',{type:'button',class:ix?null:'on'},k); b.addEventListener('click',()=>{ tabs.querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); show(k,ix); }); return b; })):null;
    show(G.names[0],0);
    menu=h('section',{class:'pub-wrap',id:'p-menu',style:'padding-top:8px'},
      h('div',{class:'pub-h'},h('h3',null,'Food & Drinks'),C.hasHours&&C.today?h('p',null,'Open today '+C.today):null),
      tabs,h('div',{class:'menu-grid'},photo,list));
  }

  const lineup=(C.specials.length||C.about)?h('section',{class:'pub-wrap',style:'padding-top:8px'},
    h('div',{class:'pub-h'},h('h3',null,C.specials.length?'Weekly Lineup':'Our Story'),h('p',null,C.specials.length?'Something going on every week.':'')),
    h('div',{class:'lineup-grid'+(C.specials.length?'':' one')},
      C.specials.length?h('div',{class:'panel'},h('h4',null,'Every Week at '+C.name),
        C.specials.slice(0,7).map(s=>{ const di=dayOf(s.when); return h('div',{class:'ev'},h('div',{class:'d'},h('b',null,di>=0?SHORT[di]:'★'),h('small',null,String(s.when||'').replace(/^[A-Za-z]+day(s)?,?\s*/,'').slice(0,14))),h('div',null,h('strong',null,s.title),s.detail?h('span',null,s.detail):null),di===todayIx()?h('span',{class:'now'},'TONIGHT'):null); })):null,
      C.about?bg(h('div',{class:'panel taps-panel ph',id:'p-about'},h('h4',null,'About '+C.name),h('p',{class:'about-txt'},C.about)),C.pic(1),'linear-gradient(rgba(21,21,24,.93),rgba(21,21,24,.88))'):null)):null;

  const street=(C.addr.match(/\d+\s+(.+)/)||[])[1]||'MAIN ST';
  const foot=h('footer',{class:'pub-foot',id:'p-hours'},
    h('div',null,h('h5',null,'Hours'),C.hasHours?h('div',{class:'hours'},hoursRows(C)):h('p',{class:'muted'},'Call for hours')),
    h('div',null,h('h5',null,'Find Us'),h('address',null,h('strong',{style:'color:#fff'},C.name),C.addr?[h('br'),C.addr]:null,C.city?[h('br'),C.city]:null,C.phoneTxt?[h('br'),h('a',{href:C.tel||null,style:'color:var(--gold-2);font-weight:700;text-decoration:none'},C.phoneTxt)]:null),socials(C)),
    h('div',null,h('h5',null,'Map'),mapBox(street.toUpperCase().slice(0,22),C.maps)),
    h('div',{class:'pub-legal'},h('span',null,'© '+new Date().getFullYear()+' '+C.name),h('span',null,'Site by Riverbend Web Co.')));
  return h('div',{class:'demo pub on'},nav,hh,heroEl,spot,menu,lineup,foot);
}
function mapBox(label,href){
  const NS='http://www.w3.org/2000/svg', s=document.createElementNS(NS,'svg'); s.setAttribute('viewBox','0 0 320 170'); s.setAttribute('aria-hidden','true');
  s.innerHTML='<rect width="320" height="170" fill="#1a1a1e"/><g stroke="#2c2c32" stroke-width="7"><path d="M0 40h250M0 95h240M0 145h230M60 0v170M130 0v170M200 0v170"/></g><g stroke="#3a3a42" stroke-width="2"><path d="M0 68h245M0 120h235M95 0v170M165 0v170"/></g><path d="M262 0 C 240 50, 290 90, 262 170 L320 170 L320 0Z" fill="#1e3a5f"/><circle cx="130" cy="95" r="18" fill="rgba(232,163,61,.2)"/><path d="M130 72c-8 0-14 6-14 14 0 10 14 22 14 22s14-12 14-22c0-8-6-14-14-14z" fill="var(--gold)"/><circle cx="130" cy="86" r="5" fill="#1a1205"/>';
  const t=document.createElementNS(NS,'text'); t.setAttribute('x','66'); t.setAttribute('y','91'); t.setAttribute('fill','#6b6b74'); t.setAttribute('font-size','8'); t.setAttribute('font-family','sans-serif'); t.textContent=label; s.append(t);
  return h('div',{class:'mapbox'},s,href?h('a',{href,target:'_blank',rel:'noopener',class:'map-go'},'Directions →'):null);
}

/* ===================== LOUNGE (Ember & Oak design) ===================== */
function lounge(C){
  const G=groups(C.items,'Menu');
  const drinkKey=G.names.find(k=>/drink|cocktail|bar|beer|wine|spirit|tap/i.test(k));
  const favs=C.items.filter(i=>i.desc).slice(0,3); if(favs.length<3) C.items.forEach(i=>{ if(favs.length<3&&favs.indexOf(i)<0) favs.push(i); });
  const nav=h('div',{class:'lg-nav'},
    C.logo?h('img',{src:C.logo,alt:C.name,class:'lg-logo-img'}):h('span',{class:'lg-logo'},C.name),
    h('nav',null,C.items.length?jump('l-menu','Menu'):null,drinkKey?jump('l-bar','Bar'):null,C.specials.length?jump('l-events','Events'):null,jump('l-events','Book an Event','rsv')));
  const heroEl=bg(h('section',{class:'lg-hero ph'},h('div',{class:'in'},
    h('span',{class:'lg-eyebrow'},[C.cat,C.city.split(',')[0]].filter(Boolean).join(' · ')),
    h('h2',null,C.tag||C.name),C.about?h('p',null,short(C.about,200)):null)),
    C.hero,'linear-gradient(0deg,rgba(12,10,9,.96) 8%,rgba(12,10,9,.35) 60%,rgba(12,10,9,.55))');
  const photos=h('div',{class:'lg-photos'},[0,1,2,3,4].map(i=>bg(h('div',{class:'ph'}),C.pic(i))));
  const chef=favs.length?h('section',{class:'lg-sec'},h('div',{class:'chef'},bg(h('div',{class:'ph'}),C.pic(5)),
    h('div',{class:'chef-body'},h('span',{class:'lg-eyebrow'},'House Favorites'),h('h3',null,'What our guests come back for'),C.about?h('p',null,short(C.about,180)):null,
      h('div',{class:'season'},favs.map(i=>h('div',null,h('span',null,h('b',null,i.name),i.desc?h('small',null,i.desc):null),i.price?h('span',{class:'p'},i.price):null)))))):null;
  let menu=null;
  if(C.items.length){
    const list=h('div',{class:'lg-menu',id:'lgMenu'});
    const show=k=>list.replaceChildren(...G.map[k].map(i=>h('div',{class:'lg-item'},h('div',null,h('b',null,i.name),i.desc?h('small',null,i.desc):null),h('span',{class:'dots'}),i.price?h('span',{class:'p'},i.price):null)));
    const tabs=G.names.length>1?h('div',{class:'lg-tabs',role:'tablist'},G.names.slice(0,6).map((k,ix)=>{ const b=h('button',{type:'button',class:ix?null:'on'},k); b.addEventListener('click',()=>{ tabs.querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); show(k); }); return b; })):null;
    show(G.names[0]);
    menu=h('section',{class:'lg-sec',id:'l-menu',style:'padding-top:8px'},h('h3',null,'The Menu'),C.today?h('p',{class:'lg-sub'},'Open today '+C.today):null,tabs,list);
  }
  const bar=drinkKey?h('section',{class:'lg-sec',id:'l-bar',style:'border-top:1px solid #292524'},h('h3',null,'Behind the Bar'),h('p',{class:'lg-sub'},'A few of our favorites'),
    h('div',{class:'notes'},G.map[drinkKey].slice(0,3).map((i,ix)=>h('div',{class:'note-card'},bg(h('div',{class:'ph'}),C.pic(6+ix)),h('div',{class:'b'},h('h4',null,i.name),i.price?h('div',{class:'spirit'},i.price):null,i.desc?h('p',{class:'note-d'},i.desc):null))))):null;
  const ok=h('div',{class:'lg-ok'},h('h4',null,'Thank you, your request is in.'),h('p',{style:'color:#A8A29E'},'This is a preview. On your live site, requests go straight to your inbox.'));
  const form=bookingForm(C,'lg-form',ok,[['Your Name','text','Jane Smith'],['Phone or Email','text','(563) 555-0100'],['Event Date','date',''],['Guests','text','20']]);
  const events=h('section',{class:'lg-sec',id:'l-events',style:'border-top:1px solid #292524'},h('h3',null,C.specials.length?'Events & Private Parties':'Private Events & Parties'),
    h('p',{class:'lg-sub'},'Birthdays, rehearsal dinners, holiday parties. Tell us about your evening.'),
    h('div',{class:'events-wrap'},h('div',null,bg(h('div',{class:'ph'}),C.pic(8)),C.specials.length?h('ul',{class:'ev-perks'},C.specials.slice(0,5).map(s=>h('li',null,[s.title,s.when].filter(Boolean).join(' · ')))):null),h('div',null,form,ok)));
  const foot=h('div',{class:'lg-foot'},h('span',null,h('b',null,C.name),[C.addr,C.city].filter(Boolean).length?' · '+[C.addr,C.city].filter(Boolean).join(', '):''),C.today?h('span',null,'Today '+C.today):null,C.phoneTxt?h('a',{href:C.tel||null},C.phoneTxt):null,socials(C));
  return h('div',{class:'demo lounge on'},nav,heroEl,photos,chef,menu,bar,events,foot);
}
function bookingForm(C,cls,ok,fields,selectOpts){
  const f=h('form',{class:cls},fields.map(([l,t,ph],i)=>h('div',{class:i>1&&fields.length%2?'':null},h('label',null,l),h('input',{type:t,placeholder:ph||null,required:i<2?'':null,'aria-label':l}))),
    selectOpts?h('div',{class:'full'},h('label',null,'Service'),h('select',null,selectOpts.map(o=>h('option',null,o)))):null,
    h('div',{class:'full'},h('label',null,'Details'),h('textarea',{rows:'3',placeholder:'Tell us what you need'})),
    h('button',{class:'full',type:'submit'},'Send Request'));
  f.addEventListener('submit',e=>{ e.preventDefault();
    if(C.email){ const v=[...f.querySelectorAll('input,select,textarea')].map(x=>(x.getAttribute('aria-label')||x.previousSibling&&x.previousSibling.textContent||'')+': '+x.value).join('\n'); location.href='mailto:'+C.email+'?subject='+encodeURIComponent('Request from website')+'&body='+encodeURIComponent(v); }
    f.style.display='none'; ok.style.display='block'; });
  return f;
}

/* ===================== TRADE (Bluff City Pro design) ===================== */
function trade(C){
  const G=groups(C.items,'');
  const svcNames=G.names.filter(Boolean).length?G.names.filter(Boolean):C.items.map(i=>i.name);
  const top=h('div',{class:'tr-top'},h('span',null,ico('i-clock',13),' '+(C.city?'Serving '+C.city+' and the surrounding area':'Locally owned and operated')),C.phoneTxt?h('span',null,'Call us: ',h('b',null,C.phoneTxt)):null);
  const nav=h('div',{class:'tr-nav'},h('span',{class:'tr-logo'},C.logo?h('img',{src:C.logo,alt:C.name,class:'tr-logo-img'}):[ico('roof',22,''),C.name]),
    h('div',{class:'r'},C.phoneTxt?h('a',{class:'tr-phone',href:C.tel||null},ico('phone',15),' '+C.phoneTxt):null,h('button',{class:'tr-cta',type:'button',onclick:()=>scrollTo('t-form')},'Free Estimate')));
  const ok=h('div',{class:'tr-ok'},h('div',{class:'chk'},ico('check',28,'')),h('strong',{style:'font-size:1.1rem'},'Request received!'),h('p',{style:'color:#64748B;font-size:.9rem;margin-top:4px'},'This is a preview. On your live site, estimate requests go straight to your phone and inbox.'));
  const form=h('form',null,h('h4',null,'Request a Free Estimate'),h('p',{class:'s'},'Tell us about the job and we’ll get back to you.'),
    h('input',{required:'',placeholder:'Your name','aria-label':'Your name'}),h('input',{required:'',placeholder:'Phone number','aria-label':'Phone number',inputmode:'tel'}),h('input',{placeholder:'Street address or town','aria-label':'Address'}),
    svcNames.length?h('select',{'aria-label':'Service needed'},svcNames.slice(0,8).map(o=>h('option',null,o)),h('option',null,'Something else')):null,
    h('button',{type:'submit'},'Get My Free Estimate →'));
  form.addEventListener('submit',e=>{ e.preventDefault(); if(C.email){ const v=[...form.querySelectorAll('input,select')].map(x=>x.getAttribute('aria-label')+': '+x.value).join('\n'); location.href='mailto:'+C.email+'?subject='+encodeURIComponent('Estimate request')+'&body='+encodeURIComponent(v); } form.style.display='none'; ok.style.display='block'; });
  const badges=[C.cat?['i-badge',C.cat]:null,C.city?['pin','Serving '+C.city.split(',')[0]]:null,C.today?['i-clock',/closed/i.test(C.today)?'Closed today':'Open today '+C.today]:null].filter(Boolean);
  const heroEl=bg(h('section',{class:'tr-hero ph'},h('div',null,h('h2',null,C.tag||C.name),C.about?h('p',null,short(C.about,190)):null,
      badges.length?h('div',{class:'tr-badges'},badges.map(([i,t])=>h('span',null,ico(i,15),' '+t))):null),
    h('div',{class:'tr-form',id:'t-form'},form,ok)),C.hero,'linear-gradient(90deg,rgba(15,23,42,.92) 0%,rgba(15,23,42,.75) 55%,rgba(30,64,175,.45) 100%)');
  const stats=[C.items.length?[String(svcNames.length),'Services']:null,C.daysOpen?[String(C.daysOpen),'Days a week']:null,C.phoneTxt?['Call',C.phoneTxt]:null,C.city?[C.city.split(',')[0],'Home base']:null].filter(Boolean);
  const statsEl=stats.length?h('div',{class:'tr-stats'},stats.map(([b,s])=>h('div',null,h('b',null,b),h('small',null,s)))):null;
  const area=C.city?h('section',{class:'tr-sec'},h('div',{class:'area'},h('strong',null,ico('pin',20,''),'Serving '+C.city+' and the surrounding area'),C.hasHours?h('div',{class:'towns'},DAYS.map((d0,i)=>C.hours[i]?h('span',null,d0.slice(0,3)+' '+C.hours[i]):null)):null)):null;
  let svcs=null;
  if(C.items.length){
    const named=G.names.filter(Boolean);
    const cards=named.length?named.map(k=>h('div',{class:'tr-svc'},h('div',{class:'ic'},ico('roof',20,'')),h('b',null,k),h('ul',null,G.map[k].slice(0,6).map(i=>h('li',null,i.name+(i.price?' · '+i.price:'')))))):
      C.items.slice(0,9).map(i=>h('div',{class:'tr-svc'},h('div',{class:'ic'},ico('check',20,'')),h('b',null,i.name),(i.desc||i.price)?h('ul',null,i.desc?h('li',null,i.desc):null,i.price?h('li',null,i.price):null):null));
    svcs=h('section',{class:'tr-sec',style:'padding-top:4px'},h('h3',null,'Our Services'),h('p',{class:'lead2'},'One call covers it.'),h('div',{class:'tr-svcs'},cards));
  }
  const projects=C.own.length?h('section',{class:'tr-sec',style:'padding-top:4px'},h('h3',null,'Our Work'),h('p',{class:'lead2'},'Real photos from real jobs.'),
    h('div',{class:'projects'},C.own.slice(0,6).map(u=>h('div',{class:'proj'},bg(h('div',{class:'ph'},C.cat?h('em',null,C.cat):null),u),h('div',{class:'b'},h('b',null,C.name),C.city?h('small',null,C.city):null))))):null;
  const offers=C.specials.length?h('section',{class:'tr-sec',style:'padding-top:4px'},h('h3',null,'Current Offers'),h('p',{class:'lead2'},'Ask about these when you call.'),
    h('div',{class:'tr-svcs'},C.specials.slice(0,3).map(s=>h('div',{class:'tr-svc'},h('div',{class:'ic'},ico('star',20,'')),h('b',null,s.title),h('ul',null,s.when?h('li',null,s.when):null,s.detail?h('li',null,s.detail):null))))):null;
  const foot=h('div',{class:'tr-foot'},
    h('div',null,h('h5',null,C.name),[C.addr,C.city].filter(Boolean).join(', '),C.phoneTxt?[h('br'),C.phoneTxt]:null),
    C.hasHours?h('div',null,h('h5',null,'Hours'),DAYS.map((d0,i)=>C.hours[i]?[d0.slice(0,3)+' '+C.hours[i],h('br')]:null)):null,
    (C.email||C.fb||C.ig)?h('div',null,h('h5',null,'Get in Touch'),C.email?[C.email,h('br')]:null,socials(C)):null);
  return h('div',{class:'demo trade on'},top,nav,heroEl,statsEl,area,svcs,offers,projects,foot);
}

function rbBar(C){
  return h('div',{class:'rb-bar'},h('div',{class:'rb-in'},
    h('div',{class:'t'},h('b',null,'Website preview for '+(C.name||'your business')),h('br'),h('span',null,'Designed by Riverbend Web Co., Dubuque. $0 down, you own your domain.')),
    h('a',{class:'go',href:'https://riverbendwebco.com/#contact',target:'_blank',rel:'noopener'},'Make it yours')));
}
})();
