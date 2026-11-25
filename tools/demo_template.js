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
STOCK.western={hero:'1759373247456-49cc5f02b408',pool:['1786206570633-c0907e1003a6','1759373203258-fb412835de5a','1759373247456-49cc5f02b408']};
/* Food photos matched to menu words, so an item never shows the wrong dish */
const FOOD=[
  [/onion ring/i,'1639024471283-03518883512d'],
  [/wing/i,'1567620832903-9fc6debc209f'],
  [/nacho|salsa|quesadilla|tortilla/i,'1768252688649-13d169feadc0'],
  [/\bcod\b|fish|walleye|shrimp|seafood/i,'1764397557799-258db31fe6a4'],
  [/chicken (strip|tender|sandwich|finger)|strips|tenders|dixon chicken/i,'1760533536289-9e4106eaf62e'],
  [/\bribs?\b|\brack\b|brisket|bbq|barbe?cue|smoked/i,'1761712826031-6456b87bd811'],
  [/burger|patty melt/i,'1508736793122-f516e3ba5569'],
  [/pulled pork|cuban|pork|sandwich|reuben|b\.?l\.?t|club|grilled cheese|melt|sub\b|hoagie/i,'1761712826051-b873907fb5d3'],
  [/fries|tots|potato|basket/i,'1565708409704-dd6416e94c20']
];
const foodPic=t=>{ for(const [re,id] of FOOD) if(re.test(t||'')) return id; return ''; };
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
function scrollTo(id){ const t=document.getElementById(id); if(!t) return; const nav=document.querySelector('.sp-head,.m2-nav,.mt-nav,.rt-nav,.mw-nav,.zp-nav,.hc-nav,.st-nav,.ab-nav,.pub-nav,.lg-nav,.tr-nav,.hl-nav,.dn-nav,.by-nav,.bz-nav,.fd-nav,.wb-nav,.bb-nav,.bw-nav,.bl-nav,.rd-nav'); const y=t.getBoundingClientRect().top+scrollY-((nav?nav.offsetHeight:0)+8); window.scrollTo({top:y,behavior:'smooth'}); }
const jump=(id,label,cls)=>h('button',{type:'button',class:cls||null,onclick:()=>scrollTo(id)},label);

function fail(t,m){ root.replaceChildren(h('div',{class:'state'},h('div',null,h('h1',{text:t}),h('p',{text:m})))); }
const slug=new URLSearchParams(location.search).get('d')||'';
if(!/^[a-z0-9-]{3,80}$/.test(slug)){ fail('Preview not found','Check the link and try again.'); return; }
const fromApi=s=>fetch(API+'?action=demo&slug='+encodeURIComponent(s)).then(r=>r.json()).then(r=>r&&r.ok?r.demo:null);
const CLK='rbCloud:'+slug; let clBuilt='';
try{ const c=localStorage.getItem(CLK); if(c){ const cd=JSON.parse(c); if(cd&&cd.variant==='cloud'){ clAge({name:cd.name||''}); build(cd); clBuilt=c; } } }catch(e){}
fetch('data/'+slug+'.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null).then(local=>{
  if(!local) return fromApi(slug);
  if(!local.base||!/^[a-z0-9-]{3,80}$/.test(local.base)) return local;
  return fromApi(local.base).then(b=>Object.assign({},b||{},local));
}).then(d=>{
  if(!d){ if(!clBuilt) fail('Preview not found','This preview may have been removed.'); return; }
  let js=''; try{ js=JSON.stringify(d); }catch(e){}
  if(d.variant==='cloud'){ try{ localStorage.setItem(CLK,js); }catch(e){} } else { try{ localStorage.removeItem(CLK); }catch(e){} }
  if(clBuilt&&js===clBuilt) return;
  build(d);
}).catch(()=>{ if(!clBuilt) fail('Couldn’t load this preview','Check your connection and refresh.'); });

function build(d){
  const style=['pub','lounge','trade','western'].includes(d.style)?d.style:'pub';
  document.title=(d.name||'Preview')+' | Website preview';
  document.body.classList.add('t-'+style);
  const C={
    variant:d.variant||'', mkMore:d.mkMore===true||!!(d.x&&d.x.mkMore&&typeof d.x.mkMore==='object'), bg:(d.bg&&typeof d.bg==='object')?d.bg:((d.x&&d.x.bg&&typeof d.x.bg==='object')?d.x.bg:{}), mkHide:(Array.isArray(d.mkHide)?d.mkHide:[]).filter(v=>typeof v==='string'), x:(d.x&&typeof d.x==='object')?d.x:{}, reviews:(d.reviews||[]).filter(r=>r&&r.text&&r.name).slice(0,12), reviewsSource:d.reviewsSource||'', reviewLink:okUrl(d.reviewLink), storyPic:okUrl(d.storyPhoto), name:d.name||'', cat:d.category||'', city:d.city||'', addr:d.address||'', about:d.about||'', tag:d.tagline||'',
    phone:d.phone||'', email:/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email||'')?d.email:'',
    logo:okImg(d.logo), hours:(d.hours||[]).slice(0,7),
    items:(d.items||[]).filter(i=>i&&i.name).map(i=>Object.assign({},i,{photo:okUrl(i.photo)})), specials:(d.specials||[]).filter(i=>i&&i.title).map(i=>Object.assign({},i,{photos:(i.photos||[]).map(okUrl).filter(Boolean).slice(0,8)})),
    fb:okUrl(String((d.social||{}).facebook||'').replace(/^http:\/\//i,'https://')), ig:okUrl(String((d.social||{}).instagram||'').replace(/^http:\/\//i,'https://'))
  };
  if(C.x.hideLogo===true) C.logo='';
  C.items=cleanItems(C.items,C);
  while(C.hours.length<7) C.hours.push('');
  C.hasHours=C.hours.some(Boolean);
  const digits=C.phone.replace(/\D/g,'');
  C.tel=digits.length>=10?'tel:+1'+digits.slice(-10):'';
  C.phoneTxt=digits.length>=10?'('+digits.slice(-10,-7)+') '+digits.slice(-7,-4)+'-'+digits.slice(-4):C.phone;
  C.maps=(C.addr||C.city)?'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([C.name,C.addr,C.city].filter(Boolean).join(', ')):'';
  C.today=C.hours[todayIx()]||'';
  C.daysOpen=C.hours.filter(x=>x&&!/closed/i.test(x)).length;
  const own=(d.photos||[]).map(okUrl).filter(Boolean);
  const preset=/^[0-9a-f-]{8,40}$/.test(d.heroPreset||'')?d.heroPreset:'';
  const hero=okImg(d.hero)||okUrl(d.heroUrl)||(style==='western'&&preset?U(preset):'')||own[0]||U(preset||STOCK[style].hero);
  const pool=own.filter(u=>u!==hero).concat(STOCK[style].pool.map(U));
  C.own=own; C.hero=hero; C.pic=i=>pool.length?pool[i%pool.length]:hero;

  const p=hex((d.colors||{}).primary,''), a=hex((d.colors||{}).accent,'');
  C.itemPic=i=>i.photo||(foodPic(i.name)?U(foodPic(i.name)):'')||(foodPic(i.group)?U(foodPic(i.group)):'');
  C.groupPic=(g,its)=>{ const own=its.find(i=>i.photo); if(own) return own.photo; const k=foodPic(g)||foodPic((its.find(i=>foodPic(i.name))||{}).name); return k?U(k):''; };
  C.venue=i=>{ const v=C.own.concat(STOCK.western.pool.map(U)); return v[i%v.length]; };
  if(style==='western'){ C.navy=hexOnLight(p)||'#1D2B53'; C.red=hexOnLight(a)||'#B22234'; }
  if(new URLSearchParams(location.search).get('view')==='marketing'){ document.title='Marketing plan for '+(C.name||'your business')+' | Riverbend Web Co.'; document.body.className='t-mk'; root.replaceChildren(marketing(C)); return; }
  if(C.variant==='sunshine'){ document.body.className='t-sn'; const pg=sunshine(C); root.replaceChildren(pg,rbBar(C)); reveal(pg); return; }
  if(C.variant==='rollin'){ document.body.className='t-ri'; const cat=new URLSearchParams(location.search).get('view')==='catering'; const pg=cat?rollinCatering(C):rollin(C); root.replaceChildren(pg,rbBar(C)); reveal(pg); if(cat){ document.title="Catering | "+(C.name||''); scrollTo(0,0); } else if(location.hash){ const el=document.getElementById(location.hash.slice(1)); if(el) setTimeout(()=>el.scrollIntoView(),60); } return; }
  if(C.variant==='roadside'&&new URLSearchParams(location.search).get('view')==='portal'){ document.body.className='t-pt'; document.title=(C.name||'')+' | Member portal concept'; root.replaceChildren(rdPortal(C)); return; }
  if(C.variant==='roadside'){ document.body.className='t-rd'; const pg=roadside(C); root.replaceChildren(pg,rbBar(C)); reveal(pg); rdNav(pg); return; }
  if(C.variant==='realty'){ document.body.className='t-rt'; const pg=realty(C); root.replaceChildren(pg,rbBar(C)); reveal(pg); return; }
  if(C.variant==='cloud'){ clAge(C); document.body.className='t-cl'; const pg=cloudShop(C); root.replaceChildren(pg,rbBar(C)); reveal(pg); return; }
  if(/^zephyr\b/i.test(C.name)) C.variant='zephyr';
  if(/^spirited\b/i.test(C.name)){ document.body.className='t-sp'; const pg=spirited(C); root.replaceChildren(pg,rbBar(C)); reveal(pg); return; }
  if(/^mountain\s?top\b/i.test(C.name)){ document.body.className='t-mt'; const pg=mountaintop2(C); root.replaceChildren(pg,rbBar(C)); reveal(pg); return; }
  if(/^mutual wheel\b/i.test(C.name)) C.variant='mutual';
  if(/^a\s*(&|and|n)\s*b\s+auto/i.test(C.name)||C.variant==='abauto'){ document.body.className='t-ab'; const pg=abAuto(C); root.replaceChildren(pg,rbBar(C)); reveal(pg); return; }
  if(/^shade\s?tree\b/i.test(C.name)||C.variant==='shadetree'){ document.body.className='t-st'; const pg=shadeTree(C); root.replaceChildren(pg,rbBar(C)); reveal(pg); stRoll(pg); return; }
  if(/^(the\s+)?cleaning\s+mom+a\b/i.test(C.name)||C.variant==='homy'){ document.body.className='t-hc'; const pg=homy(C); root.replaceChildren(pg,rbBar(C)); reveal(pg); return; }
  if(C.variant==='mutual'){ document.body.className='t-mw'; const pg=mutual(C); root.replaceChildren(pg,rbBar(C)); reveal(pg); return; }
  if(C.variant==='bloom'){ document.body.className='t-bl'; const pg=bloomTattoo(C); root.replaceChildren(pg,rbBar(C)); reveal(pg); return; }
  if(C.variant==='becwar'){ document.body.className='t-bw'; const pg=becwar(C); root.replaceChildren(pg,rbBar(C)); reveal(pg); return; }
  if(C.variant==='zephyr'){ document.body.className='t-zp'; const pg=zephyr(C); root.replaceChildren(pg,rbBar(C)); reveal(pg); zpNav(); return; }
  if(C.variant==='osteria'){ document.body.className='t-o2'; const pg=osteria2(C); root.replaceChildren(pg,rbBar(C)); reveal(pg); o2Bar(pg); osIntro(C); return; }
  const page=style==='pub'?pub(C):style==='lounge'?lounge(C):style==='western'?western(C):trade(C);
  if(style==='pub'&&p&&readableOnDark(p)) page.style.setProperty('--gold',p),page.style.setProperty('--gold-2',p);
  if(style==='lounge'&&p&&readableOnDark(p)) page.style.setProperty('--brass',p);
  if(style==='trade'){ if(p) page.style.setProperty('--tb',p); if(a) page.style.setProperty('--tg',a); }
  root.replaceChildren(page,rbBar(C));
  reveal(page);
}

/* Drop menu lines that are really the business name or address (common when menus are read from pictures) */
function cleanItems(items,C){
  const norm=t=>String(t||'').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
  const nameW=norm(C.name).split(' ').filter(w=>w.length>2);
  const num=(C.addr.match(/^\s*(\d+)/)||[])[1];
  const isJunk=i=>{ const n=norm(i.name), all=n+' '+norm(i.desc);
    if(num&&new RegExp('\\b'+num+'\\s+[a-z]').test(all)&&/\b(st|street|ave|avenue|rd|road|blvd|dr|drive|ia|iowa)\b/.test(all)) return true;
    if(n&&n.split(' ').every(w=>nameW.includes(w))) return true;
    return false; };
  const fixCase=g=>g&&/^([a-z]\.){2,}$/i.test(g.replace(/\s/g,''))?g.toUpperCase():g;
  const bizGroup=g=>{ const n=norm(g); return n&&n.split(' ').every(w=>nameW.includes(w)); };
  return items.filter(i=>!isJunk(i)).map(i=>Object.assign({},i,{group:bizGroup(i.group)?'Menu':fixCase(i.group)}));
}
/* Colors that are too dark to read on a dark page fall back to the design default */
function lum(hx){ const n=parseInt(hx.slice(1),16); const f=c=>{c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4);}; return .2126*f(n>>16&255)+.7152*f(n>>8&255)+.0722*f(n&255); }
function readableOnDark(hx){ return hx&&((lum(hx)+.05)/(.0045+.05))>=5.5?hx:''; }
function hexOnLight(hx){ return hx&&((1.05)/(lum(hx)+.05))>=4.5?hx:''; }
function dayRange(hours){ const open=hours.map(x=>!!x&&!/closed/i.test(x)); const n=open.filter(Boolean).length; if(!n) return ''; if(n===7) return '7 days'; const S=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const first=open.indexOf(true), last=open.lastIndexOf(true); if(open.slice(first,last+1).every(Boolean)) return first===last?S[first]:S[first]+' to '+S[last]; return n+' days'; }
/* Scroll-linked fade and slide for each section */
function reveal(page){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window)) return;
  const els=page.querySelectorAll('.rv'); els.forEach(e=>e.classList.add('rv-in'));
  const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('rv-on'); io.unobserve(e.target);} }),{rootMargin:'0px 0px -8% 0px'});
  els.forEach(e=>io.observe(e));
}

function hoursRows(C,cls){ return C.hasHours?DAYS.map((day,i)=>h('div',{class:i===todayIx()?'today':null},h('span',null,day),h('span',null,C.hours[i]||'Closed'))):[]; }
function socials(C){ return (C.fb||C.ig)?h('div',{class:'socials','aria-label':'Social links'},C.fb?h('a',{href:C.fb,target:'_blank',rel:'noopener',title:'Facebook'},ico('i-fb',17)):null,C.ig?h('a',{href:C.ig,target:'_blank',rel:'noopener',title:'Instagram'},ico('i-ig',17)):null):null; }
function dayOf(w){ const m=String(w||'').toLowerCase().match(/(mon|tue|wed|thu|fri|sat|sun)/); return m?['mon','tue','wed','thu','fri','sat','sun'].indexOf(m[1]):-1; }

/* ===================== PUB (Lock & Dam Tap design) ===================== */
/* Three standout items, from different sections where possible, preferring ones with a matching photo */
function pickFavs(C){
  const cand=C.items.filter(i=>i.desc&&i.desc.length>30).sort((x,y)=>(!!C.itemPic(y)-!!C.itemPic(x))||(y.desc.length-x.desc.length));
  const out=[], seen=new Set();
  cand.forEach(i=>{ if(out.length<3&&!seen.has(i.group)){ out.push(i); seen.add(i.group); } });
  cand.forEach(i=>{ if(out.length<3&&out.indexOf(i)<0) out.push(i); });
  return out;
}
function splitAbout(about,max){ const ss=sentences(about); if(ss.length<3) return ['',about]; let o='',k=0; for(const x of ss){ if((o+' '+x).trim().length>max) break; o=(o+' '+x).trim(); k++; } if(!k||k>=ss.length) return ['',about]; return [o,ss.slice(k).join(' ')]; }
function pub(C){
  const G=groups(C.items,'Menu');
  const lines=sentences(C.tag).slice(0,3); const head=lines.length?lines:[C.name];
  const h2=h('h2',null,head.map((l,i)=>i===head.length-1&&head.length>1?h('span',null,l):[l,i<head.length-1?h('br'):null]));
  const [heroTxt,storyTxt]=splitAbout(C.about,170);
  const range=dayRange(C.hours);
  const nextOpen=(()=>{ for(let k=1;k<=7;k++){ const ix=(todayIx()+k)%7, v=C.hours[ix]; if(v&&!/closed/i.test(v)) return [k===1?'Tomorrow':DAYS[ix].slice(0,3),'Opens '+String(v).split(/\s*(?:-|to|\u2013)\s*/)[0]]; } return null; })();
  const stats=[ range?[range,'Open']:null, C.hasHours?(C.today&&!/closed/i.test(C.today)?['Open today',C.today]:nextOpen):null, C.city?[C.city.split(',')[0],C.city.split(',')[1]?C.city.split(',')[1].trim():'Location']:null ].filter(Boolean);
  const first=C.specials[0];
  const nav=h('div',{class:'pub-nav'},
    h('div',{class:'pub-logo'},C.logo?h('img',{src:C.logo,alt:C.name,class:'pub-logo-img'}):C.name,!C.logo?h('small',null,[C.cat,C.city.split(',')[0]].filter(Boolean).join(' · ')):null),
    h('div',{class:'pub-links'},C.items.length?jump('p-menu','Menu'):null,C.specials.length?jump('p-events','Specials'):null,C.about?jump('p-about','Our Story'):null,jump('p-hours','Hours & Location')),
    C.today?h('span',{class:'live'+(/closed/i.test(C.today)?' off':'')},h('i'),/closed/i.test(C.today)?'Closed today':'Open today · '+C.today):null);
  const hh=first?h('div',{class:'pub-hh'},ico('i-beer',16),' '+[first.title,first.when].filter(Boolean).join(' · ')):null;
  const heroEl=bg(h('section',{class:'pub-hero ph'},h('div',{class:'in'},
    (C.cat||C.city)?h('span',{class:'pub-kicker'},C.cat||C.city):null, h2,
    heroTxt?h('p',null,heroTxt):null,
    h('div',{class:'pub-actions'},
      C.tel?h('a',{class:'pub-call',href:C.tel},ico('phone',18,''),'Tap to Call'):null,
      C.items.length?h('button',{type:'button',class:'pub-dir',onclick:()=>scrollTo('p-menu')},'See the Menu'):null,
      C.maps?h('a',{class:'pub-dir',href:C.maps,target:'_blank',rel:'noopener'},ico('map',18,''),'Directions'):null),
    stats.length?h('div',{class:'pub-stats'},stats.map(([b,t])=>h('div',null,h('b',null,b),t))):null)),
    C.hero,'linear-gradient(90deg,rgba(8,8,10,.94) 0%,rgba(8,8,10,.74) 45%,rgba(8,8,10,.3) 100%)');

  const spot=C.specials.length?h('section',{class:'pub-wrap rv',id:'p-events'},
    h('div',{class:'pub-h'},h('h3',null,'This Week’s Spotlight'),h('p',null,'Don’t miss these.')),
    h('div',{class:'spot'+(C.specials.length===1?' one':'')},C.specials.slice(0,4).map((s,i)=>bg(h('div',{class:'spot-card ph'},
      h('span',{class:'tag'+(i%2?' gold':'')},s.when||'Special'),h('h4',null,s.title),
      s.detail?h('p',null,s.detail):null),
      C.pic(i),'linear-gradient(0deg,rgba(8,8,10,.94) 10%,rgba(8,8,10,.3) 72%)')))):null;

  /* House favorites: the items with the best descriptions, shown big with photos */
  const favs=pickFavs(C);
  const favEl=favs.length===3?h('section',{class:'pub-wrap rv',id:'p-favs'},
    h('div',{class:'pub-h'},h('h3',null,'House Favorites'),h('p',null,'What regulars order.')),
    h('div',{class:'favs'},favs.map((i,ix)=>h('article',{class:'fav'},
      bg(h('div',{class:'fav-ph ph'},i.price?h('span',{class:'fav-pr'},i.price):null),C.itemPic(i)||C.venue(ix),'linear-gradient(0deg,rgba(13,13,15,.55),rgba(13,13,15,0) 55%)'),
      h('div',{class:'fav-b'},i.group&&i.group!=='Menu'?h('small',null,i.group):null,h('h4',null,i.name),h('p',null,heat(short(i.desc,220)))))))):null;

  let menu=null;
  if(C.items.length){
    const photo=h('div',{class:'menu-photo ph',id:'pubMenuPhoto'},h('span',{id:'pubMenuCap'}));
    const list=h('div',{class:'menu-list',id:'pubMenuList'});
    const show=(k,ix)=>{ const its=G.map[k]; bg(photo,C.groupPic(k,its)||C.venue(ix),'linear-gradient(0deg,rgba(13,13,15,.85) 5%,rgba(13,13,15,.15) 60%)'); photo.firstChild.textContent=k!=='Menu'?k:its[0].name;
      list.replaceChildren(...its.map(i=>h('div',{class:'mi'},h('div',null,h('b',null,i.name),i.desc?h('small',null,i.desc):null),i.price?h('span',{class:'p'},i.price):null))); };
    const tabs=G.names.length>1?h('div',{class:'menu-tabs',role:'tablist'},G.names.slice(0,8).map((k,ix)=>{ const b=h('button',{type:'button',class:ix?null:'on'},k); b.addEventListener('click',()=>{ tabs.querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); show(k,ix); }); return b; })):null;
    show(G.names[0],0);
    menu=h('section',{class:'pub-wrap rv',id:'p-menu',style:'padding-top:8px'},
      h('div',{class:'pub-h'},h('h3',null,'Food & Drinks'),C.hasHours&&C.today&&!/closed/i.test(C.today)?h('p',null,'Open today '+C.today):null),
      tabs,h('div',{class:'menu-grid'},photo,list));
  }

  const strip=h('div',{class:'pub-strip rv','aria-hidden':'true'},[6,7,8,9].map(i=>bg(h('div',{class:'ph'}),C.pic(i))));

  const story=storyTxt||C.about;
  const storyEl=C.about?h('section',{class:'pub-wrap rv',id:'p-about'},h('div',{class:'story'},
      bg(h('div',{class:'story-ph ph'}),C.pic(1)),
      h('div',{class:'story-b'},h('span',{class:'pub-kicker'},'Our Story'),h('h3',null,'Welcome to '+C.name),h('p',{class:'about-txt'},story),
        h('div',{class:'pub-actions'},C.tel?h('a',{class:'pub-call',href:C.tel},ico('phone',18,''),C.phoneTxt):null,C.email?h('a',{class:'pub-dir',href:'mailto:'+C.email},'Email us'):null,socials(C))))):null;

  const lineup=C.specials.length>2?h('section',{class:'pub-wrap rv',style:'padding-top:8px'},
    h('div',{class:'pub-h'},h('h3',null,'Weekly Lineup'),h('p',null,'Plan your week around these.')),
    h('div',{class:'panel'},h('h4',null,'Every Week at '+C.name),
        C.specials.slice(0,7).map(s=>{ const di=dayOf(s.when); return h('div',{class:'ev'},h('div',{class:'d'},h('b',null,di>=0?SHORT[di]:ico('star',18,'')),h('small',null,(String(s.when||'').match(/\d{1,2}(:\d{2})?\s*[ap]\.?m\.?/i)||[''])[0])),h('div',null,h('strong',null,s.title),s.detail?h('span',null,s.detail):null),di===todayIx()?h('span',{class:'now'},'TONIGHT'):null); }))):null;

  const street=(C.addr.match(/\d+\s+(.+)/)||[])[1]||'MAIN ST';
  const foot=h('footer',{class:'pub-foot',id:'p-hours'},
    h('div',null,h('h5',null,'Hours'),C.hasHours?h('div',{class:'hours'},hoursRows(C)):h('p',{class:'muted'},'Call for hours')),
    h('div',null,h('h5',null,'Find Us'),h('address',null,h('strong',{style:'color:#fff'},C.name),C.addr?[h('br'),C.addr]:null,C.city?[h('br'),C.city]:null,C.phoneTxt?[h('br'),h('a',{href:C.tel||null,style:'color:var(--gold-2);font-weight:700;text-decoration:none'},C.phoneTxt)]:null),socials(C)),
    h('div',null,h('h5',null,'Map'),mapBox(street.toUpperCase().slice(0,22),C.maps)),
    h('div',{class:'pub-legal'},h('span',null,'© '+new Date().getFullYear()+' '+C.name),h('span',null,'Site by Riverbend Web Co.')));
  return h('div',{class:'demo pub on'},nav,hh,heroEl,spot,favEl,menu,strip,lineup,storyEl,foot);
}
/* ===================== WESTERN (saloon, light) ===================== */
function stars(n,cls){ return h('span',{class:cls||'wx-stars','aria-hidden':'true'},Array.from({length:n||3},()=>ico('star',14,''))); }
function western(C){
  if(C.variant==='diner') return diner(C);
  if(C.variant==='bayou') return bayou(C);
  if(C.variant==='buz') return buz(C);
  if(C.variant==='fade') return fade(C);
  if(C.variant==='welborn') return welborn(C);
  if(C.variant==='bigbill') return bigbill(C);
  if(C.variant==='trail'&&Array.isArray(C.x.week)&&C.x.week.length) return trailhead(C);
  const G=groups(C.items,'Menu');
  const lines=sentences(C.tag).slice(0,3); const head=lines.length?lines:[C.name];
  const [heroTxt,storyTxt]=splitAbout(C.about,170);
  const range=dayRange(C.hours);
  const nextOpen=(()=>{ for(let k=1;k<=7;k++){ const ix=(todayIx()+k)%7, v=C.hours[ix]; if(v&&!/closed/i.test(v)) return [k===1?'Tomorrow':DAYS[ix],'Opens '+String(v).split(/\s*(?:-|to|–)\s*/)[0]]; } return null; })();
  const openNow=C.today&&!/closed/i.test(C.today);
  const first=C.specials[0];
  const city=C.city.split(',')[0];

  const top=first?h('div',{class:'wx-top'},stars(1),h('span',null,[first.title,first.when].filter(Boolean).join(' · ')),
    first.photos.length?h('button',{type:'button',class:'wx-toplink',onclick:()=>gallery(first.photos,first.title)},'See the '+(/rib/i.test(first.title)?'ribs':'photos')):null,stars(1)):null;
  const nav=h('header',{class:'wx-nav'},
    h('a',{class:'wx-brand',href:'#',onclick:e=>{e.preventDefault();scrollTo('w-top');}},C.logo?h('img',{src:C.logo,alt:C.name}):h('b',null,C.name)),
    h('nav',{class:'wx-links'},C.items.length?jump('w-menu','Menu'):null,C.specials.length?jump('w-events','Specials'):null,C.about?jump('w-story','Our Story'):null,C.reviews.length?jump('w-reviews','Reviews'):null,jump('w-visit','Hours & Location')),
    C.tel?h('a',{class:'wx-btn wx-red wx-sm',href:C.tel},ico('phone',16,''),'Call'):null);

  const heroEl=bg(h('section',{class:'wx-hero ph',id:'w-top'},h('div',{class:'in'},
    h('div',{class:'wx-kick'},stars(3),h('span',null,[C.cat,city].filter(Boolean).join(' · '))),
    h('h1',null,head.map((l,i)=>h('span',{class:i===head.length-1&&head.length>1?'last':null},l))),
    heroTxt?h('p',null,heroTxt):null,
    h('div',{class:'wx-acts'},
      C.tel?h('a',{class:'wx-btn wx-red',href:C.tel},ico('phone',18,''),C.phoneTxt||'Call'):null,
      C.items.length?h('button',{type:'button',class:'wx-btn wx-ghost',onclick:()=>scrollTo('w-menu')},'See the Menu'):null,
      C.maps?h('a',{class:'wx-btn wx-ghost',href:C.maps,target:'_blank',rel:'noopener'},ico('map',18,''),'Directions'):null),
    C.reviews.length?heroReview(C):null)),
    C.hero,C.variant==='trail'?'linear-gradient(90deg,rgba(31,46,34,.86) 0%,rgba(31,46,34,.55) 42%,rgba(31,46,34,0) 78%),linear-gradient(0deg,rgba(181,82,27,.18),rgba(0,0,0,0) 40%)':C.variant==='ranch'?'linear-gradient(0deg,rgba(24,18,14,.94) 0%,rgba(24,18,14,.62) 50%,rgba(24,18,14,.3) 100%)':C.variant==='americana'?'linear-gradient(90deg,'+rgba(C.navy,.94)+' 0%,rgba(30,24,20,.78) 50%,rgba(30,24,20,.35) 100%)':'linear-gradient(90deg,'+rgba(C.navy,.92)+' 0%,rgba(36,26,20,.78) 46%,rgba(36,26,20,.32) 100%),radial-gradient(circle at 78% 30%,rgba(217,160,100,.14),rgba(0,0,0,0) 55%)');

  const head2=(id,kick,title,sub)=>h('div',{class:'wx-h'},h('div',{class:'wx-orn'},h('i'),stars(3),h('i')),kick?h('small',null,kick):null,h('h2',null,title),sub?h('p',null,sub):null);

  const spot=C.specials.length?h('section',{class:'wx-sec rv',id:'w-events'},head2('w-events','This week',(C.specials.length>1?'Specials & Events':C.specials[0].title)),
    h('div',{class:'wx-specials'},C.specials.slice(0,4).map(s=>{ const di=dayOf(s.when); return h('article',{class:'wx-sp'},
      h('div',{class:'wx-stamp'},h('b',null,di>=0?SHORT[di]:ico('star',20,'')),h('small',null,s.when||'Special')),
      h('div',null,h('h3',null,s.title),s.detail?h('p',null,s.detail):null,
        s.photos.length?h('button',{type:'button',class:'wx-btn wx-line wx-sm wx-book',onclick:()=>gallery(s.photos,s.title)},ico('star',14,''),'See the '+(/rib/i.test(s.title)?'ribs':'photos')):null,
        (C.tel&&/private|party|parties|event|book|reserv|rent|catering/i.test(s.title+' '+(s.when||'')))?h('a',{class:'wx-btn wx-red wx-sm wx-book',href:C.tel},ico('phone',16,''),'Call to book: '+C.phoneTxt):null)); }))):null;

  const favs=pickFavs(C);
  const favEl=favs.length===3?h('section',{class:'wx-sec rv wx-favsec',id:'w-favs'},
    C.items.length?h('button',{type:'button',class:'wx-jump',onclick:()=>scrollTo('w-menu')},'Full menu',h('span',{'aria-hidden':'true'},'↓')):null,
    head2('','Off the menu','House Favorites','What regulars order.'),
    h('div',{class:'wx-favs'},favs.map((i,ix)=>h('article',{class:'wx-fav'},
      bg(h('div',{class:'ph'},i.price?h('span',{class:'wx-pr'},i.price):null),C.itemPic(i)||C.venue(ix)),
      h('div',{class:'b'},i.group&&i.group!=='Menu'?h('small',null,i.group):null,h('h3',null,i.name),h('p',null,heat(short(i.desc,220)))))))):null;

  const revEl=C.reviews.length?h('section',{class:'wx-sec wx-soft rv',id:'w-reviews'},head2('','What guests say','Reviews',C.reviewsSource||null),
    h('div',{class:'wx-revs'},C.reviews.map((r,ix)=>h('figure',{class:'wx-rev'+(ix>=6?' more':'')},h('div',{class:'st','aria-label':(r.stars||5)+' stars'},stars(r.stars||5)),h('blockquote',null,'“'+r.text+'”'),h('figcaption',null,r.name)))),
    h('div',{class:'wx-acts wx-center'},C.reviews.length>6?h('button',{type:'button',class:'wx-btn wx-line wx-sm',onclick:e=>{ document.querySelectorAll('.wx-rev.more').forEach(x=>x.classList.remove('more')); e.currentTarget.remove(); }},'Show more reviews'):null,
      C.reviewLink?h('a',{class:'wx-btn wx-line wx-sm',href:C.reviewLink,target:'_blank',rel:'noopener'},'See them on Google'):null)):null;

  let menu=null;
  if(C.items.length){
    const photo=h('div',{class:'wx-mphoto ph'},h('span'));
    const list=h('div',{class:'wx-mlist'});
    const show=(k,ix)=>{ const its=G.map[k]; bg(photo,C.groupPic(k,its)||C.venue(ix),'linear-gradient(0deg,rgba(40,24,14,.8) 0%,rgba(0,0,0,0) 50%)'); photo.firstChild.textContent=k!=='Menu'?k:C.name;
      list.replaceChildren(...its.map(i=>h('div',{class:'wx-mi'},h('div',{class:'t'},h('b',null,i.name),h('i'),i.price?h('span',null,i.price):null),i.desc?h('p',null,heat(i.desc)):null))); };
    const tabs=G.names.length>1?h('div',{class:'wx-tabs',role:'tablist'},G.names.slice(0,8).map((k,ix)=>{ const b=h('button',{type:'button',class:ix?null:'on'},k); b.addEventListener('click',()=>{ tabs.querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); show(k,ix); }); return b; })):null;
    show(G.names[0],0);
    menu=h('section',{class:'wx-sec wx-soft rv',id:'w-menu'},head2('','Food & drinks','The Menu',openNow?'Kitchen and bar open today '+C.today:null),tabs,h('div',{class:'wx-mgrid'},photo,list));
  }

  const nStrip=C.variant==='trail'?8:4;
  const strip=C.own.length>=2?h('div',{class:'wx-strip rv'},C.own.slice(0,nStrip).map((u,ix)=>bg(h('button',{type:'button',class:'ph','aria-label':'Open photo gallery',onclick:()=>gallery(C.own,'Inside '+C.name,ix)}),u)),
    C.own.length>nStrip?h('button',{type:'button',class:'wx-more',onclick:()=>gallery(C.own,'Inside '+C.name,nStrip)},'See all '+C.own.length+' photos'):null):null;

  const storyEl=C.about?h('section',{class:'wx-band rv',id:'w-story'},h('div',{class:'wx-story'},
    bg(h('div',{class:'ph'}),C.storyPic||C.own[4]||C.own[0]||C.venue(1)),
    h('div',{class:'b'},h('div',{class:'wx-kick'},stars(3),h('span',null,'Our Story')),h('h2',null,'Welcome to '+C.name),h('p',null,storyTxt||C.about),
      h('div',{class:'wx-acts'},C.tel?h('a',{class:'wx-btn wx-red',href:C.tel},ico('phone',18,''),C.phoneTxt):null,C.email?h('a',{class:'wx-btn wx-ghost',href:'mailto:'+C.email},'Email us'):null)))):null;

  const street=(C.addr.match(/\d+\s+(.+)/)||[])[1]||'MAIN ST';
  const visit=h('section',{class:'wx-sec rv',id:'w-visit'},head2('','Come on in','Hours & Location'),
    h('div',{class:'wx-visit'},
      h('div',{class:'wx-card'},h('h3',null,'Hours'),C.hasHours?h('div',{class:'wx-hours'},DAYS.map((day,i)=>h('div',{class:i===todayIx()?'today':null},h('span',null,day),h('span',null,C.hours[i]||'Closed')))):h('p',null,'Call for hours')),
      h('div',{class:'wx-card'},h('h3',null,'Find Us'),h('address',null,h('b',null,C.name),C.addr?[h('br'),C.addr]:null,C.city?[h('br'),C.city]:null),
        h('div',{class:'wx-acts'},C.tel?h('a',{class:'wx-btn wx-red wx-sm',href:C.tel},ico('phone',16,''),C.phoneTxt):null,C.maps?h('a',{class:'wx-btn wx-line wx-sm',href:C.maps,target:'_blank',rel:'noopener'},ico('map',16,''),'Directions'):null),
        socials(C)),
      h('div',{class:'wx-card wx-map'},mapBox(street.toUpperCase().slice(0,22),C.maps))));

  const foot=h('footer',{class:'wx-foot'},h('div',{class:'in'},
    C.logo?h('img',{src:C.logo,alt:C.name}):h('b',null,C.name),
    h('span',null,'© '+new Date().getFullYear()+' '+C.name+(C.addr?' · '+[C.addr,C.city].filter(Boolean).join(', '):'')),
    h('span',null,'Site by Riverbend Web Co.')));
  if(C.variant==='trail'&&menu) menu.append(utvArt());
  const trail=C.variant==='trail'&&Array.isArray(C.x.week)&&C.x.week.length;
  const page=trail?h('div',{class:'demo western on'},top,nav,heroEl,trailWeek(C),trailFeature(C),favEl,menu,trailRide(C),strip,storyEl,revEl,visit,foot)
    :h('div',{class:'demo western on'},top,nav,heroEl,favEl,menu,spot,strip,storyEl,revEl,visit,foot);
  page.style.setProperty('--wn',C.navy); page.style.setProperty('--wr',C.red);
  if(/^[a-z]{3,20}$/.test(C.variant||'')) page.classList.add('v-'+C.variant);
  Object.keys(C.bg).forEach(k=>{ if(/^[a-z]{2,12}$/.test(k)&&okUrl(C.bg[k])) page.style.setProperty('--bg-'+k,cssUrl(C.bg[k])); });
  return page;
}
/* ===================== TRAIL (outdoorsy variant of western) ===================== */
/* Day-by-day specials slideshow: big words, a photo per day, opens on today's special */
function trailWeek(C){
  const days=C.x.week.filter(w=>w&&typeof w==='object'&&w.title).slice(0,8);
  const ix0=(()=>{ for(let k=0;k<7;k++){ const d=(todayIx()+k)%7; const f=days.findIndex(w=>dayOf(w.day)===d); if(f>=0) return f; } return 0; })();
  let i=ix0, timer=null;
  const slide=h('div',{class:'tw-slide'});
  const tabs=h('div',{class:'tw-tabs',role:'tablist'});
  const paint=()=>{ const w=days[i], di=dayOf(w.day);
    slide.replaceChildren(bg(h('div',{class:'tw-pic ph'},h('span',null,String(w.day||'').slice(0,3).toUpperCase())),okUrl(w.photo)||C.venue(i)),h('div',{class:'tw-in'},
      h('div',{class:'tw-day'},String(w.day||'').toUpperCase(),di===todayIx()?h('em',null,'Today'):null),
      h('h3',null,w.title),
      w.time?h('div',{class:'tw-time'},ico('star',16,''),w.time):null,
      w.detail?h('p',null,w.detail):null,
      w.note?h('small',null,w.note):null,
      C.tel?h('a',{class:'wx-btn wx-red wx-sm',href:C.tel},ico('phone',16,''),'Call ahead: '+C.phoneTxt):null));
    tabs.querySelectorAll('button').forEach((b,k)=>b.classList.toggle('on',k===i)); };
  days.forEach((w,k)=>tabs.append(h('button',{type:'button',onclick:()=>{ i=k; paint(); stop(); }},h('b',null,String(w.day||'').slice(0,3).toUpperCase()),h('span',null,w.short||w.title))));
  const go=d=>{ i=(i+d+days.length)%days.length; paint(); };
  const stop=()=>{ if(timer){ clearInterval(timer); timer=null; } };
  paint();
  if(days.length>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches) timer=setInterval(()=>go(1),6500);
  const b=C.x.banner&&typeof C.x.banner==='object'&&C.x.banner.title?C.x.banner:null;
  return h('section',{class:'tw rv',id:'w-events'},
    h('div',{class:'tw-head'},h('small',null,'Every day is a reason to ride in'),h('h2',null,'Weekly Specials')),
    h('div',{class:'tw-stage'},slide,
      days.length>1?h('button',{type:'button',class:'tw-arrow l','aria-label':'Previous special',onclick:()=>{go(-1);stop();}},'‹'):null,
      days.length>1?h('button',{type:'button',class:'tw-arrow r','aria-label':'Next special',onclick:()=>{go(1);stop();}},'›'):null),
    tabs,
    b?h('div',{class:'tw-banner'},h('b',null,b.title),b.detail?h('span',null,b.detail):null):null);
}
/* Signature burger feature with how-the-contest-works steps */
function trailFeature(C){
  const f=C.x.feature&&typeof C.x.feature==='object'&&C.x.feature.title?C.x.feature:null; if(!f) return null;
  const steps=Array.isArray(f.steps)?f.steps.filter(x=>typeof x==='string').slice(0,8):[];
  return h('section',{class:'tf rv',id:'w-feature'},
    h('div',{class:'tf-top'},
      bg(h('div',{class:'tf-pic ph'},f.badge?h('span',null,f.badge):null),okUrl(f.photo)||C.hero),
      h('div',{class:'tf-b'},f.kick?h('small',null,f.kick):null,h('h2',null,f.title),f.desc?h('p',{class:'tf-q'},'“'+f.desc+'”'):null,
        f.source?h('div',{class:'tf-src'},f.source):null,
        h('div',{class:'wx-acts'},C.tel?h('a',{class:'wx-btn wx-red',href:C.tel},ico('phone',18,''),'Order: '+C.phoneTxt):null))),
    steps.length?h('div',{class:'tf-how'},h('h3',null,f.howTitle||'How it works'),f.howSub?h('p',{class:'tf-sub'},f.howSub):null,
      h('ol',null,steps.map((t,k)=>h('li',null,h('b',null,String(k+1)),h('span',null,t)))),
      f.note?h('p',{class:'tf-note'},f.note):null,
      okUrl(f.link)?h('a',{class:'wx-btn wx-line wx-sm',href:f.link,target:'_blank',rel:'noopener'},f.linkText||'Contest details'):null):null);
}
/* Trail riders band */
function trailRide(C){
  const r=C.x.ride&&typeof C.x.ride==='object'&&C.x.ride.title?C.x.ride:null; if(!r) return null;
  const pts=Array.isArray(r.points)?r.points.filter(x=>typeof x==='string').slice(0,5):[];
  return h('section',{class:'tw-ride rv',id:'w-ride'},
    bg(h('div',{class:'ph'}),okUrl(r.photo)||C.hero),
    h('div',{class:'b'},h('small',null,r.kick||'Trail riders welcome'),h('h2',null,r.title),r.text?h('p',null,r.text):null,
      pts.length?h('ul',null,pts.map(t=>h('li',null,ico('star',14,''),t))):null,
      h('div',{class:'wx-acts'},C.maps?h('a',{class:'wx-btn wx-red',href:C.maps,target:'_blank',rel:'noopener'},ico('map',18,''),'Directions'):null,
        C.items.length?h('button',{type:'button',class:'wx-btn wx-line',onclick:()=>scrollTo('w-menu')},'See the Menu'):null)));
}
/* Hand-drawn side-view UTV with a dust trail, tucked in the menu corner */
const UTV='<svg viewBox="0 0 260 140" aria-hidden="true"><g fill="#C9B79A" opacity=".55"><circle cx="18" cy="112" r="12"/><circle cx="36" cy="100" r="16"/><circle cx="8" cy="96" r="9"/><circle cx="52" cy="116" r="10"/></g><g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M92 74 L104 30 L176 30 L196 70"/><path d="M128 30 L122 72"/></g><path d="M64 78 Q66 70 76 70 L206 70 Q222 70 228 84 L232 96 L60 96 Z" fill="currentColor"/><path d="M196 70 L214 52 L226 56 L214 72 Z" fill="currentColor"/><rect x="150" y="78" width="40" height="8" rx="3" fill="#fff" opacity=".35"/><g><circle cx="94" cy="102" r="26" fill="#23201C"/><circle cx="94" cy="102" r="11" fill="#9AA59A"/><circle cx="202" cy="102" r="26" fill="#23201C"/><circle cx="202" cy="102" r="11" fill="#9AA59A"/></g><g stroke="#23201C" stroke-width="4" stroke-dasharray="4 6"><circle cx="94" cy="102" r="28" fill="none"/><circle cx="202" cy="102" r="28" fill="none"/></g><path d="M8 132 H252" stroke="#C9B79A" stroke-width="3" stroke-dasharray="10 8" stroke-linecap="round"/></svg>';
function utvArt(){ const d=h('div',{class:'tw-utv'}); d.innerHTML=UTV; return d; }
/* ===================== TRAILHEAD (own layout for trail demos) ===================== */
function trailhead(C){
  const G=groups(C.items,'Menu');
  const [heroTxt,storyTxt]=splitAbout(C.about,170);
  const openNow=C.today&&!/closed/i.test(C.today);
  const city=C.city.split(',')[0];
  const ride=C.x.ride&&typeof C.x.ride==='object'?C.x.ride:{};
  const pts=Array.isArray(ride.points)?ride.points.filter(x=>typeof x==='string').slice(0,5):[];
  const first=C.specials[0];
  const sec=(id,cls,...k)=>h('section',{class:'hl-sec rv '+(cls||''),id},...k);
  let secN=0;
  const head=(kick,title,sub)=>{ secN++; return h('div',{class:'hl-head'},h('span',{class:'hl-num'},String(secN).padStart(2,'0')),h('div',null,kick?h('small',null,kick):null,h('h2',null,title),sub?h('p',null,sub):null)); };

  const top=first?h('div',{class:'hl-ann'},h('span',null,first.title),first.when?h('b',null,first.when):null):null;
  const links=[['w-top','Trailhead'],['w-events','Specials'],C.x.feature?['w-feature',(C.x.feature.nav||'Trail Boss')]:null,C.items.length?['w-menu','Menu']:null,C.own.length>=3?['w-gal','Photos']:null,['w-camp','Our Story'],C.reviews.length?['w-reviews','Reviews']:null,['w-visit','Find Us']].filter(Boolean);
  const stopBtns=[];
  const side=h('aside',{class:'hl-side'},
    h('a',{class:'hl-side-logo',href:'#',onclick:e=>{e.preventDefault();scrollTo('w-top');}},C.logo?h('img',{src:C.logo,alt:C.name}):h('b',null,C.name)),
    h('div',{class:'hl-side-lbl'},'Trail map'),
    h('nav',{class:'hl-stops'},links.map(([id,l])=>{ const bt=h('button',{type:'button','data-id':id,onclick:()=>scrollTo(id)},h('i'),l); stopBtns.push(bt); return bt; })),
    h('div',{class:'hl-side-foot'},
      C.today?h('div',{class:'hl-side-today'},h('small',null,'Today'),h('b',null,openNow?C.today:'Closed')):null,
      C.tel?h('a',{class:'hl-btn hl-rust',href:C.tel},ico('phone',16,''),C.phoneTxt):null));
  const nav=h('header',{class:'hl-nav'},h('div',{class:'hl-nav-in'},
    h('a',{class:'hl-brand',href:'#',onclick:e=>{e.preventDefault();scrollTo('w-top');}},C.logo?h('img',{src:C.logo,alt:C.name}):h('b',null,C.name)),
    C.tel?h('a',{class:'hl-btn hl-rust hl-sm',href:C.tel},ico('phone',16,''),'Call'):null),
    h('nav',{class:'hl-mstops'},links.slice(1).map(([id,l])=>h('button',{type:'button',onclick:()=>scrollTo(id)},l))));

  const rv=C.reviews[0];
  const hero=bg(h('section',{class:'hl-hero ph',id:'w-top'},
      h('span',{class:'hl-pin'},ico('pin',16,''),[city,(C.city.split(',')[1]||'').trim()].filter(Boolean).join(', ')),
      h('div',{class:'hl-hero-t'},
        h('div',{class:'hl-kick'},[C.cat,city].filter(Boolean).join(' / ')),
        h('h1',null,C.name),
        h('p',{class:'hl-slogan'},C.tag),
        heroTxt?h('p',null,heroTxt):null,
        h('div',{class:'hl-acts'},C.tel?h('a',{class:'hl-btn hl-rust',href:C.tel},ico('phone',18,''),C.phoneTxt):null,
          C.items.length?h('button',{type:'button',class:'hl-btn hl-line-w',onclick:()=>scrollTo('w-menu')},'See the menu'):null)),
      rv?heroRevRotate(C):null),
    C.hero,'linear-gradient(0deg,rgba(8,10,10,.92) 0%,rgba(8,10,10,.55) 45%,rgba(8,10,10,.12) 100%)');
  const strip=h('div',{class:'hl-strip'},
    h('div',null,h('small',null,'Today'),h('b',null,C.today?(openNow?'Open '+C.today:'Closed today'):'Call for hours')),
    (C.addr||C.city)?h('div',null,h('small',null,'Find us'),h('b',null,[C.addr,city].filter(Boolean).join(', '))):null,
    pts[0]?h('div',null,h('small',null,'Ride in'),h('b',null,pts[0])):null,
    C.phoneTxt?h('div',null,h('small',null,'Call'),h('b',null,C.phoneTxt)):null);

  /* weekly specials: day rail on the left, big stage on the right */
  const days=C.x.week.filter(w=>w&&typeof w==='object'&&w.title).slice(0,8);
  let wi=(()=>{ for(let k=0;k<7;k++){ const d=(todayIx()+k)%7; const f=days.findIndex(w=>dayOf(w.day)===d); if(f>=0) return f; } return 0; })(), timer=null;
  const stage=h('div',{class:'hl-stage'}), rail=h('div',{class:'hl-rail',role:'tablist'});
  const stop=()=>{ if(timer){clearInterval(timer);timer=null;} };
  const paint=()=>{ const w=days[wi], di=dayOf(w.day);
    stage.replaceChildren(
      bg(h('div',{class:'hl-stage-p ph'},h('b',null,String(w.day||'').toUpperCase()),di===todayIx()?h('em',null,'Today'):null),okUrl(w.photo)||C.venue(wi)),
      h('div',{class:'hl-stage-t'},h('h3',null,w.title),w.time?h('div',{class:'hl-time'},ico('i-clock',16,''),w.time):null,
        w.detail?h('p',null,w.detail):null,w.note?h('small',null,w.note):null,
        h('div',{class:'hl-acts'},C.tel?h('a',{class:'hl-btn hl-rust hl-sm',href:C.tel},ico('phone',16,''),'Call ahead'):null,
          days.length>1?h('button',{type:'button',class:'hl-btn hl-line hl-sm',onclick:()=>{wi=(wi+1)%days.length;paint();stop();}},'Next special'):null)));
    rail.querySelectorAll('button').forEach((b,k)=>b.classList.toggle('on',k===wi)); };
  days.forEach((w,k)=>rail.append(h('button',{type:'button',onclick:()=>{wi=k;paint();stop();}},h('b',null,String(w.day||'').slice(0,3).toUpperCase()),h('span',null,w.short||w.title),w.time?h('small',null,w.time):null)));
  paint();
  if(days.length>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches) timer=setInterval(()=>{wi=(wi+1)%days.length;paint();},7000);
  const b=C.x.banner&&typeof C.x.banner==='object'&&C.x.banner.title?C.x.banner:null;
  const week=sec('w-events','hl-week',head('Every day is a reason to ride in','This week at the Holler'.replace('the Holler',C.name.replace(/^The /,'the '))),
    h('div',{class:'hl-weekgrid'},rail,stage),
    b?h('div',{class:'hl-banner'},h('span',null,'Once a month'),h('b',null,b.title),b.detail?h('p',null,b.detail):null):null);

  /* signature burger: poster plus a trail of numbered steps */
  const f=C.x.feature&&typeof C.x.feature==='object'&&C.x.feature.title?C.x.feature:null;
  const steps=f&&Array.isArray(f.steps)?f.steps.filter(x=>typeof x==='string').slice(0,8):[];
  const boss=f?sec('w-feature','hl-boss',
    h('div',{class:'hl-poster'},
      h('div',{class:'hl-poster-t'},f.badge?h('span',{class:'hl-tag'},f.badge):null,f.kick?h('small',null,f.kick):null,h('h2',null,f.title),
        f.desc?h('p',null,f.desc):null,f.source?h('em',null,f.source):null,
        C.tel?h('a',{class:'hl-btn hl-rust',href:C.tel},ico('phone',18,''),'Order: '+C.phoneTxt):null),
      bg(h('div',{class:'hl-poster-p ph'}),okUrl(f.photo)||C.hero)),
    steps.length?h('div',{class:'hl-steps'},h('h3',null,f.howTitle||'How it works'),f.howSub?h('p',null,f.howSub):null,
      h('ol',null,steps.map((t,k)=>h('li',null,h('b',null,String(k+1)),h('span',null,t)))),
      h('div',{class:'hl-acts'},f.note?h('p',{class:'hl-note'},f.note):null,okUrl(f.link)?h('a',{class:'hl-btn hl-line hl-sm',href:f.link,target:'_blank',rel:'noopener'},f.linkText||'Contest rules'):null)):null):null;

  /* menu: category chips, rider picks, then a two-column board */
  let menu=null;
  if(C.items.length){
    const board=h('div',{class:'hl-board2'});
    const show=k=>{ board.replaceChildren(...G.map[k].map(i=>h('div',{class:'hl-mi'+(i.photo?' has':'')},
      i.photo?bg(h('div',{class:'hl-mi-p ph'}),i.photo):null,
      h('div',{class:'hl-mi-t'},h('div',{class:'r'},h('b',null,i.name),i.price?h('span',null,i.price):null),i.desc?h('p',null,heat(i.desc)):null)))); };
    const chips=h('div',{class:'hl-chips'},G.names.slice(0,8).map((k,ix)=>{ const bt=h('button',{type:'button',class:ix?null:'on'},k); bt.addEventListener('click',()=>{ chips.querySelectorAll('button').forEach(x=>x.classList.remove('on')); bt.classList.add('on'); show(k); }); return bt; }));
    show(G.names[0]);
    const picks=pickFavs(C);
    menu=sec('w-menu','hl-menu',utvArt(),head('Food and drinks','The Menu',openNow?'Kitchen and bar open today '+C.today:null),
      picks.length?h('div',{class:'hl-picks'},h('small',null,'Rider picks'),picks.map((i,ix)=>h('article',null,bg(h('div',{class:'ph'}),C.itemPic(i)||C.venue(ix)),h('div',null,h('b',null,i.name),i.group&&i.group!=='Menu'?h('span',null,i.group):null)))):null,
      chips,board);
  }

  /* photo mosaic */
  const gal=C.own.length>=3?sec('w-gal','hl-gal',head(C.x.galKick||'Straight from the Holler','Photos'),
    h('div',{class:'hl-mosaic'},C.own.slice(0,8).map((u,ix)=>bg(h('button',{type:'button',class:'ph','aria-label':'Open photo gallery',onclick:()=>gallery(C.own,'Photos from '+C.name,ix)}),u)),
      C.own.length>8?h('button',{type:'button',class:'hl-all',onclick:()=>gallery(C.own,'Photos from '+C.name,8)},'See all '+C.own.length+' photos'):null)):null;

  /* story and trail riders side by side */
  const camp=sec('w-camp','hl-camp',
    h('div',{class:'hl-story'},bg(h('div',{class:'ph'}),C.storyPic||C.own[0]||C.hero),
      h('div',{class:'b'},h('small',null,'Our story'),h('h2',null,'Welcome to '+C.name),h('p',null,storyTxt||C.about),
        C.tel?h('a',{class:'hl-btn hl-rust hl-sm',href:C.tel},ico('phone',16,''),C.phoneTxt):null)),
    ride.title?h('div',{class:'hl-ride'},bg(h('div',{class:'ph'}),okUrl(ride.photo)||C.hero),
      h('div',{class:'b'},h('small',null,ride.kick||'Trail riders welcome'),h('h2',null,ride.title),ride.text?h('p',null,ride.text):null,
        pts.length?h('ul',null,pts.map(t=>h('li',null,ico('check',14,''),t))):null,
        C.maps?h('a',{class:'hl-btn hl-line-w hl-sm',href:C.maps,target:'_blank',rel:'noopener'},ico('map',16,''),'Directions'):null)):null);

  /* reviews as a swipeable row */
  const revs=C.reviews.length?sec('w-reviews','hl-revs',
    h('div',{class:'hl-revs-h'},head('What riders and regulars say','Reviews'),C.reviewsSource?h('div',{class:'hl-score'},stars(5),h('span',null,C.reviewsSource)):null),
    h('div',{class:'hl-revrow'},C.reviews.map(r=>h('figure',null,h('i',{'aria-hidden':'true'},'“'),h('blockquote',null,r.text),h('figcaption',null,stars(r.stars||5),r.name)))),
    C.reviewLink?h('div',{class:'hl-acts hl-c'},h('a',{class:'hl-btn hl-line hl-sm',href:C.reviewLink,target:'_blank',rel:'noopener'},'Read them on Google')):null):null;

  /* trailhead info board */
  const street=(C.addr.match(/\d+\s+(.+)/)||[])[1]||'MAIN ST';
  const visit=sec('w-visit','hl-visit',head('Plan your stop','Find Us'),
    h('div',{class:'hl-vgrid'},
      h('div',{class:'hl-sign'},h('div',{class:'hl-sign-h'},'Hours'),C.hasHours?h('div',{class:'hl-hrs'},DAYS.map((day,i)=>h('div',{class:i===todayIx()?'today':null},h('span',null,day),h('span',null,C.hours[i]||'Closed')))):h('p',null,'Call for hours')),
      h('div',{class:'hl-find'},h('h3',null,C.name),h('address',null,C.addr,h('br'),C.city),
        pts.length?h('p',null,pts[0]):null,
        h('div',{class:'hl-acts'},C.tel?h('a',{class:'hl-btn hl-rust hl-sm',href:C.tel},ico('phone',16,''),C.phoneTxt):null,C.maps?h('a',{class:'hl-btn hl-line hl-sm',href:C.maps,target:'_blank',rel:'noopener'},ico('map',16,''),'Directions'):null),
        socials(C)),
      h('div',{class:'hl-map wx-map'},mapBox(street.toUpperCase().slice(0,22),C.maps))));

  const foot=h('footer',{class:'hl-foot'},h('div',{class:'in'},C.logo?h('img',{src:C.logo,alt:C.name}):h('b',null,C.name),
    h('span',null,'© '+new Date().getFullYear()+' '+C.name+(C.addr?' · '+[C.addr,C.city].filter(Boolean).join(', '):'')),h('span',null,'Site by Riverbend Web Co.')));
  const main=h('div',{class:'hl-main'},top,nav,hero,strip,week,boss,menu,gal,camp,revs,visit,foot);
  const page=h('div',{class:'demo western on v-trail hl'},side,main);
  if('IntersectionObserver' in window) setTimeout(()=>{ const io=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) stopBtns.forEach(b=>b.classList.toggle('on',b.dataset.id===e.target.id)); }),{rootMargin:'-45% 0px -50% 0px'}); links.forEach(([id])=>{ const el=document.getElementById(id); if(el) io.observe(el); }); },0);
  Object.keys(C.bg).forEach(k=>{ if(/^[a-z]{2,12}$/.test(k)&&okUrl(C.bg[k])) page.style.setProperty('--bg-'+k,cssUrl(C.bg[k])); });
  return page;
}
/* Trailhead hero review: cycles through every review with a fade and dots */
function heroRevRotate(C){
  const list=C.reviews.slice(0,8); let i=0, t=null;
  const q=h('blockquote',null,'“'+short(list[0].text,120)+'”'), who=h('figcaption',null,list[0].name);
  const show=k=>{ i=k; card.classList.add('fade'); setTimeout(()=>{ q.textContent='“'+short(list[i].text,120)+'”'; who.textContent=list[i].name; if(dots) dots.querySelectorAll('button').forEach((b,n)=>b.classList.toggle('on',n===i)); card.classList.remove('fade'); },350); };
  const restart=()=>{ if(t) clearInterval(t); if(list.length>1) t=setInterval(()=>show((i+1)%list.length),6000); };
  const dots=list.length>1?h('div',{class:'hl-dots'},list.map((r,k)=>h('button',{type:'button','aria-label':'Show review '+(k+1),class:k?null:'on',onclick:()=>{ show(k); restart(); }}))):null;
  const card=h('figure',{class:'hl-hero-rev'},h('div',{class:'st'},stars(5)),q,who,dots);
  restart();
  return card;
}
/* ===================== BAYOU (Fat Tuesday's: dim bar, Mardi Gras confetti, party gator) ===================== */
const BY_GATOR="<svg viewBox=\"-40 0 470 200\" aria-hidden=\"true\"><defs>  <linearGradient id=\"gb\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#5f7d3e\"/><stop offset=\".3\" stop-color=\"#40602e\"/><stop offset=\".7\" stop-color=\"#25391d\"/><stop offset=\"1\" stop-color=\"#121d0f\"/></linearGradient>  <linearGradient id=\"gk\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#8aa862\"/><stop offset=\"1\" stop-color=\"#3b5a2b\"/></linearGradient>  <linearGradient id=\"gj\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#b2ab72\" stop-opacity=\"0\"/><stop offset=\".25\" stop-color=\"#b2ab72\" stop-opacity=\".5\"/><stop offset=\"1\" stop-color=\"#b2ab72\" stop-opacity=\".5\"/></linearGradient><linearGradient id=\"gl\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop offset=\"0\" stop-color=\"#d6d097\" stop-opacity=\"0\"/><stop offset=\".6\" stop-color=\"#b9b27a\" stop-opacity=\".35\"/><stop offset=\"1\" stop-color=\"#a39d62\" stop-opacity=\".7\"/></linearGradient>  <radialGradient id=\"ge\" cx=\".4\" cy=\".35\" r=\".7\"><stop offset=\"0\" stop-color=\"#ffe27a\"/><stop offset=\".6\" stop-color=\"#d9a21b\"/><stop offset=\"1\" stop-color=\"#8c5d0b\"/></radialGradient>  <pattern id=\"gs\" width=\"8\" height=\"6\" patternUnits=\"userSpaceOnUse\"><path d=\"M0 6 Q4 .6 8 6\" fill=\"none\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".55\"/><path d=\"M-4 3 Q0 -2 4 3\" fill=\"none\" stroke=\"#0f1a0b\" stroke-width=\".5\" opacity=\".3\"/></pattern>  <clipPath id=\"gc\"><path d=\"M10 134 C30 128 56 110 94 97 C130 89 170 86 205 88 C232 90 252 95 270 99 C300 103 340 104 378 106 C396 107 411 112 412 119 C412 127 405 133 392 133 C352 136 312 137 280 141 C254 145 238 155 205 155 C160 155 120 152 90 149 C60 146 30 141 10 134Z\"/></clipPath>  <filter id=\"gsh\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"140%\"><feGaussianBlur stdDeviation=\"4\"/></filter></defs>  <ellipse cx=\"190\" cy=\"172\" rx=\"215\" ry=\"9\" fill=\"#000\" opacity=\".5\" filter=\"url(#gsh)\"/>  <!-- legs -->  <path d=\"M84 146 C80 154 74 158 64 160 L60 164 L68 166 L66 170 L78 169 L86 166 L98 163 C100 156 102 150 104 145Z\" fill=\"#25391d\" stroke=\"#0f1a0b\" stroke-width=\"1.300\" stroke-linejoin=\"round\"/>  <path d=\"M64 160 l-6 4 M69 165 l-5 5 M78 168 l-1 6\" stroke=\"#e3dcc0\" stroke-width=\"1.500\" stroke-linecap=\"round\"/>  <path d=\"M206 150 C202 158 196 162 186 164 L182 168 L190 170 L188 174 L200 173 L208 170 L222 167 C224 160 226 154 228 148Z\" fill=\"#2c4522\" stroke=\"#0f1a0b\" stroke-width=\"1.300\" stroke-linejoin=\"round\"/>  <path d=\"M186 164 l-6 4 M191 169 l-5 5 M200 172 l-1 6\" stroke=\"#e3dcc0\" stroke-width=\"1.500\" stroke-linecap=\"round\"/>  <!-- tail -->  <path d=\"M14 133 C-4 138 -22 146 -38 160 C-24 156 -6 152 14 144Z\" fill=\"#25391d\" stroke=\"#0f1a0b\" stroke-width=\"1.200\" stroke-linejoin=\"round\"/>  <!-- body -->  <path d=\"M10 134 C30 128 56 110 94 97 C130 89 170 86 205 88 C232 90 252 95 270 99 C300 103 340 104 378 106 C396 107 411 112 412 119 C412 127 405 133 392 133 C352 136 312 137 280 141 C254 145 238 155 205 155 C160 155 120 152 90 149 C60 146 30 141 10 134Z\" fill=\"url(#gb)\" stroke=\"#0f1a0b\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/>  <g clip-path=\"url(#gc)\">    <rect x=\"0\" y=\"118\" width=\"430\" height=\"42\" fill=\"url(#gl)\"/>    <rect x=\"0\" y=\"80\" width=\"430\" height=\"90\" fill=\"url(#gs)\"/>    <path d=\"M30 118 C80 100 170 92 260 99 C330 104 380 105 410 112\" fill=\"none\" stroke=\"#a9c47c\" stroke-width=\"2.4\" opacity=\".4\"/>    <path d=\"M40 124 C90 108 170 100 255 106\" fill=\"none\" stroke=\"#0f1a0b\" stroke-width=\"7\" opacity=\".12\"/>  </g>  <g><path transform=\"translate(49.0 123.1)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(59.5 117.3)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(70.0 113.7)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(80.5 110.2)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(91.0 106.7)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(101.5 104.1)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(112.0 102.5)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(122.5 100.8)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(133.0 99.1)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(143.5 97.8)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(154.0 97.4)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(164.5 96.9)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(175.0 96.4)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(185.5 96.0)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(196.0 97.1)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(206.5 98.2)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(217.0 99.2)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(227.5 100.4)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(238.0 102.1)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/><path transform=\"translate(248.5 103.8)\" d=\"M-4 1 L-2.4 -3.4 Q0 -5 2.4 -3.4 L4 1 Q0 2.8 -4 1Z\" fill=\"#2c4521\" stroke=\"#0f1a0b\" stroke-width=\".8\" opacity=\".85\"/></g><g><g transform=\"translate(44.0 118.4) rotate(-29.1)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(54.5 112.6) rotate(-29.1)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(65.0 107.8) rotate(-18.4)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(75.5 104.3) rotate(-18.4)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(86.0 100.8) rotate(-18.4)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(96.5 97.4) rotate(-13.2)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(107.0 95.8) rotate(-9.0)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(117.5 94.1) rotate(-9.0)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(128.0 92.4) rotate(-9.0)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(138.5 90.7) rotate(-7.0)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(149.0 90.1) rotate(-2.5)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(159.5 89.6) rotate(-2.5)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(170.0 89.2) rotate(-2.5)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(180.5 88.7) rotate(-2.5)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(191.0 89.1) rotate(5.7)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(201.5 90.2) rotate(5.7)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(212.0 91.2) rotate(5.7)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(222.5 92.3) rotate(6.4)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(233.0 93.8) rotate(9.2)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(243.5 95.5) rotate(9.2)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g><g transform=\"translate(254.0 97.2) rotate(9.2)\"><path d=\"M-4.6 1.2 L-2.6 -4.2 Q0 -6.2 2.6 -4.2 L4.6 1.2 Q0 3.2 -4.6 1.2Z\" fill=\"url(#gk)\" stroke=\"#0f1a0b\" stroke-width=\".9\"/><path d=\"M0 -4.6 L0 1.4\" stroke=\"#0f1a0b\" stroke-width=\".7\" opacity=\".6\"/></g></g>  <!-- lower jaw -->  <path d=\"M283 118 C300 123 340 123.500 405 124.500 L405 128 C411 126 412 122 412 119 C412 127 405 133 392 133 C352 136 312 137 280 141 C282 132 283 124 283 118Z\" fill=\"url(#gj)\"/>  <!-- mouth -->  <path d=\"M283 116 C300 121 340 121.600 405 122.400\" fill=\"none\" stroke=\"#0e1409\" stroke-width=\"2.2\" stroke-linecap=\"round\"/>  <g><path d=\"M298.4 121.0 L300.0 126.8 L301.6 121.0Z\" fill=\"#f1ead2\" stroke=\"#8d8564\" stroke-width=\".35\"/><path d=\"M306.0 121.1 L307.6 124.3 L309.2 121.1Z\" fill=\"#f1ead2\" stroke=\"#8d8564\" stroke-width=\".35\"/><path d=\"M313.6 121.2 L315.2 124.4 L316.8 121.2Z\" fill=\"#f1ead2\" stroke=\"#8d8564\" stroke-width=\".35\"/><path d=\"M321.2 121.3 L322.8 126.3 L324.4 121.3Z\" fill=\"#f1ead2\" stroke=\"#8d8564\" stroke-width=\".35\"/><path d=\"M328.8 121.4 L330.4 124.6 L332.0 121.4Z\" fill=\"#f1ead2\" stroke=\"#8d8564\" stroke-width=\".35\"/><path d=\"M336.4 121.5 L338.0 125.5 L339.6 121.5Z\" fill=\"#f1ead2\" stroke=\"#8d8564\" stroke-width=\".35\"/><path d=\"M344.0 121.5 L345.6 126.5 L347.2 121.5Z\" fill=\"#f1ead2\" stroke=\"#8d8564\" stroke-width=\".35\"/><path d=\"M351.6 121.6 L353.2 124.8 L354.8 121.6Z\" fill=\"#f1ead2\" stroke=\"#8d8564\" stroke-width=\".35\"/><path d=\"M359.2 121.7 L360.8 124.9 L362.4 121.7Z\" fill=\"#f1ead2\" stroke=\"#8d8564\" stroke-width=\".35\"/><path d=\"M366.8 121.8 L368.4 126.8 L370.0 121.8Z\" fill=\"#f1ead2\" stroke=\"#8d8564\" stroke-width=\".35\"/><path d=\"M374.4 121.9 L376.0 125.9 L377.6 121.9Z\" fill=\"#f1ead2\" stroke=\"#8d8564\" stroke-width=\".35\"/><path d=\"M382.0 122.0 L383.6 125.2 L385.2 122.0Z\" fill=\"#f1ead2\" stroke=\"#8d8564\" stroke-width=\".35\"/><path d=\"M389.6 122.1 L391.2 127.1 L392.8 122.1Z\" fill=\"#f1ead2\" stroke=\"#8d8564\" stroke-width=\".35\"/><path d=\"M397.2 122.2 L398.8 125.4 L400.4 122.2Z\" fill=\"#f1ead2\" stroke=\"#8d8564\" stroke-width=\".35\"/></g><g><path d=\"M302.4 122.2 L303.8 119.6 L305.2 122.2Z\" fill=\"#e8e0c4\" stroke=\"#8d8564\" stroke-width=\".3\"/><path d=\"M310.0 122.3 L311.4 118.3 L312.8 122.3Z\" fill=\"#e8e0c4\" stroke=\"#8d8564\" stroke-width=\".3\"/><path d=\"M317.6 122.4 L319.0 119.8 L320.4 122.4Z\" fill=\"#e8e0c4\" stroke=\"#8d8564\" stroke-width=\".3\"/><path d=\"M325.2 122.5 L326.6 119.9 L328.0 122.5Z\" fill=\"#e8e0c4\" stroke=\"#8d8564\" stroke-width=\".3\"/><path d=\"M332.8 122.6 L334.2 120.0 L335.6 122.6Z\" fill=\"#e8e0c4\" stroke=\"#8d8564\" stroke-width=\".3\"/><path d=\"M340.4 122.7 L341.8 118.7 L343.2 122.7Z\" fill=\"#e8e0c4\" stroke=\"#8d8564\" stroke-width=\".3\"/><path d=\"M348.0 122.7 L349.4 120.1 L350.8 122.7Z\" fill=\"#e8e0c4\" stroke=\"#8d8564\" stroke-width=\".3\"/><path d=\"M355.6 122.8 L357.0 120.2 L358.4 122.8Z\" fill=\"#e8e0c4\" stroke=\"#8d8564\" stroke-width=\".3\"/><path d=\"M363.2 122.9 L364.6 120.3 L366.0 122.9Z\" fill=\"#e8e0c4\" stroke=\"#8d8564\" stroke-width=\".3\"/><path d=\"M370.8 123.0 L372.2 119.0 L373.6 123.0Z\" fill=\"#e8e0c4\" stroke=\"#8d8564\" stroke-width=\".3\"/><path d=\"M378.4 123.1 L379.8 120.5 L381.2 123.1Z\" fill=\"#e8e0c4\" stroke=\"#8d8564\" stroke-width=\".3\"/><path d=\"M386.0 123.2 L387.4 120.6 L388.8 123.2Z\" fill=\"#e8e0c4\" stroke=\"#8d8564\" stroke-width=\".3\"/><path d=\"M393.6 123.3 L395.0 120.7 L396.4 123.3Z\" fill=\"#e8e0c4\" stroke=\"#8d8564\" stroke-width=\".3\"/><path d=\"M401.2 123.4 L402.6 119.4 L404.0 123.4Z\" fill=\"#e8e0c4\" stroke=\"#8d8564\" stroke-width=\".3\"/></g>  <!-- nostril bump -->  <ellipse cx=\"400\" cy=\"108.500\" rx=\"6.500\" ry=\"4.200\" fill=\"#35542a\" stroke=\"#0f1a0b\" stroke-width=\"1.100\"/><ellipse cx=\"401\" cy=\"108\" rx=\"2.200\" ry=\"1.300\" fill=\"#0b1007\"/>  <!-- eye ridge and eye -->  <path d=\"M268 100 C272 88 292 86 300 98 C292 96 280 97 268 100Z\" fill=\"#40603101\" />  <ellipse cx=\"285\" cy=\"95.500\" rx=\"14\" ry=\"8.200\" fill=\"#3a5a2b\" stroke=\"#0f1a0b\" stroke-width=\"1.300\"/>  <ellipse cx=\"285\" cy=\"94.800\" rx=\"8.600\" ry=\"5.600\" fill=\"url(#ge)\" stroke=\"#0f1a0b\" stroke-width=\"1\"/>  <ellipse cx=\"285.500\" cy=\"94.800\" rx=\"1.700\" ry=\"5.100\" fill=\"#050703\"/>  <ellipse cx=\"282.500\" cy=\"92.300\" rx=\"2.200\" ry=\"1.300\" fill=\"#fff\" opacity=\".85\"/>  <path d=\"M276 92 Q285 86 294 92\" fill=\"none\" stroke=\"#0f1a0b\" stroke-width=\"1.600\" stroke-linecap=\"round\"/>  <!-- brow ridge texture -->  <path d=\"M300 99 C320 102 345 103 372 105\" fill=\"none\" stroke=\"#0f1a0b\" stroke-width=\".9\" opacity=\".5\"/>  <!-- beads -->  <path d=\"M236 93 Q262 150 252 136\" fill=\"none\" stroke=\"#120d17\" stroke-width=\"1.200\" opacity=\".0\"/>  <g><circle cx=\"233.9\" cy=\"95.4\" r=\"4.1\" fill=\"#F2C230\" stroke=\"#120d17\" stroke-width=\".9\"/><circle cx=\"232.6\" cy=\"94.1\" r=\"1.2\" fill=\"#fff\" opacity=\".7\"/><circle cx=\"232.3\" cy=\"104.3\" r=\"4.1\" fill=\"#9B4FCF\" stroke=\"#120d17\" stroke-width=\".9\"/><circle cx=\"231.0\" cy=\"103.0\" r=\"1.2\" fill=\"#fff\" opacity=\".7\"/><circle cx=\"231.7\" cy=\"113.4\" r=\"4.1\" fill=\"#3DBB5A\" stroke=\"#120d17\" stroke-width=\".9\"/><circle cx=\"230.4\" cy=\"112.1\" r=\"1.2\" fill=\"#fff\" opacity=\".7\"/><circle cx=\"232.5\" cy=\"122.6\" r=\"4.1\" fill=\"#F2C230\" stroke=\"#120d17\" stroke-width=\".9\"/><circle cx=\"231.2\" cy=\"121.3\" r=\"1.2\" fill=\"#fff\" opacity=\".7\"/><circle cx=\"235.9\" cy=\"130.9\" r=\"4.1\" fill=\"#9B4FCF\" stroke=\"#120d17\" stroke-width=\".9\"/><circle cx=\"234.6\" cy=\"129.6\" r=\"1.2\" fill=\"#fff\" opacity=\".7\"/><circle cx=\"242.8\" cy=\"137.0\" r=\"4.1\" fill=\"#3DBB5A\" stroke=\"#120d17\" stroke-width=\".9\"/><circle cx=\"241.5\" cy=\"135.7\" r=\"1.2\" fill=\"#fff\" opacity=\".7\"/><circle cx=\"251.6\" cy=\"139.3\" r=\"4.1\" fill=\"#F2C230\" stroke=\"#120d17\" stroke-width=\".9\"/><circle cx=\"250.3\" cy=\"138.0\" r=\"1.2\" fill=\"#fff\" opacity=\".7\"/><circle cx=\"260.9\" cy=\"139.1\" r=\"4.1\" fill=\"#9B4FCF\" stroke=\"#120d17\" stroke-width=\".9\"/><circle cx=\"259.6\" cy=\"137.8\" r=\"1.2\" fill=\"#fff\" opacity=\".7\"/><circle cx=\"270.0\" cy=\"137.5\" r=\"4.1\" fill=\"#3DBB5A\" stroke=\"#120d17\" stroke-width=\".9\"/><circle cx=\"268.7\" cy=\"136.2\" r=\"1.2\" fill=\"#fff\" opacity=\".7\"/></g>  </svg>";
/* static SVG confetti: no motion, and it hugs the edges of its box so it never sits behind text */
function byConfetti(n,band,op){
  const d=h('div',{class:'by-confetti','aria-hidden':'true'}); let seed=n*7919+13; const rnd=()=>{ seed=(seed*16807)%2147483647; return seed/2147483647; };
  const cols=['#F2C230','#9B4FCF','#3DBB5A','#F2C230','#E8E2F0']; let g='';
  for(let i=0;i<n;i++){ const x=rnd()*100, y=rnd()*100, c=cols[i%cols.length], r=Math.round(rnd()*360);
    if(x>band&&x<100-band&&y>band&&y<100-band){ i--; continue; }
    if(i%3===0) g+='<circle cx="'+x.toFixed(1)+'%" cy="'+y.toFixed(1)+'%" r="'+(2.2+rnd()*1.6).toFixed(1)+'" fill="'+c+'"/>';
    else if(i%3===1) g+='<rect x="'+x.toFixed(1)+'%" y="'+y.toFixed(1)+'%" width="7" height="11" rx="1.5" fill="'+c+'" style="transform:rotate('+r+'deg);transform-box:fill-box;transform-origin:center"/>';
    else g+='<rect x="'+x.toFixed(1)+'%" y="'+y.toFixed(1)+'%" width="3" height="17" rx="1.5" fill="'+c+'" style="transform:rotate('+r+'deg);transform-box:fill-box;transform-origin:center"/>'; }
  d.innerHTML='<svg width="100%" height="100%" aria-hidden="true" opacity="'+(op||.9)+'">'+g+'</svg>'; return d; }
/* gold fleur-de-lis ornament for section headings */
const BY_FLEUR='<svg viewBox="0 0 120 28" aria-hidden="true"><defs><linearGradient id="fl1" x1="0" x2="1"><stop offset="0" stop-color="#F2C230" stop-opacity="0"/><stop offset="1" stop-color="#F2C230" stop-opacity=".85"/></linearGradient><linearGradient id="fl2" x1="1" x2="0"><stop offset="0" stop-color="#F2C230" stop-opacity="0"/><stop offset="1" stop-color="#F2C230" stop-opacity=".85"/></linearGradient></defs>'+
 '<rect x="2" y="13.200" width="42" height="1.600" fill="url(#fl1)"/><rect x="76" y="13.200" width="42" height="1.600" fill="url(#fl2)"/>'+
 '<g fill="#F2C230" stroke="#8a6a0c" stroke-width=".6" stroke-linejoin="round"><path d="M60 1.500C64.500 6.500 65.500 12 60 20C54.500 12 55.500 6.500 60 1.500Z"/><path d="M57 14.500C51 8 43.500 9.500 44 15.500C44.500 20.500 50.500 21.500 54.500 18.500C51.500 18.500 49.500 16.500 50.500 14.500C52.500 13.500 55 13.500 57 14.500Z"/><path d="M63 14.500C69 8 76.500 9.500 76 15.500C75.500 20.500 69.500 21.500 65.500 18.500C68.500 18.500 70.500 16.500 69.500 14.500C67.500 13.500 65 13.500 63 14.500Z"/><rect x="54.500" y="19" width="11" height="2.600" rx="1.200"/><path d="M60 21.500L60 26M55.500 26.500Q60 22.500 64.500 26.500Q60 25 55.500 26.500Z"/></g></svg>';
function byOrn(){ const d=h('span',{class:'by-orn','aria-hidden':'true'}); d.innerHTML=BY_FLEUR; return d; }
function nextFatTuesday(){ const now=new Date(); for(let y=now.getFullYear();y<now.getFullYear()+3;y++){ const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),hh=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-hh-k)%7,m=Math.floor((a+11*hh+22*l)/451),mo=Math.floor((hh+l-7*m+114)/31),da=((hh+l-7*m+114)%31)+1; const easter=new Date(y,mo-1,da); const ft=new Date(easter); ft.setDate(ft.getDate()-47); ft.setHours(15,0,0,0); if(ft>now) return ft; } return null; }
/* ---- Bayou helpers: live hours, status pill, weekly specials ---- */
const BY_TZ='America/Chicago';
function byNow(){
  try{ const p=new Intl.DateTimeFormat('en-US',{timeZone:BY_TZ,weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()); const g=t=>(p.find(x=>x.type===t)||{}).value;
    const d=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(g('weekday')); return {d:d<0?todayIx():d,m:(+g('hour'))*60+(+g('minute'))}; }
  catch(e){ const n=new Date(); return {d:todayIx(),m:n.getHours()*60+n.getMinutes()}; }
}
function byParse(s){
  const m=String(s||'').match(/(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?\s*(?:-|\u2013|\u2014|to)\s*(\d{1,2})(?::(\d{2}))?\s*([ap])\.?m\.?/i); if(!m) return null;
  const t=(hh,mi,ap)=>((+hh%12)+(/p/i.test(ap)?12:0))*60+(+(mi||0));
  const o=t(m[1],m[2],m[3]); let c=t(m[4],m[5],m[6]); if(c<=o) c+=1440; return {o,c};
}
function byFmt(min){ min=((min%1440)+1440)%1440; let hh=Math.floor(min/60); const mm=min%60, ap=hh>=12?'PM':'AM'; hh=hh%12||12; return hh+':'+String(mm).padStart(2,'0')+' '+ap; }
const byRange=p=>byFmt(p.o)+' – '+byFmt(p.c);
function byStatus(C){
  const n=byNow(), cur=byParse(C.hours[n.d]), prev=byParse(C.hours[(n.d+6)%7]);
  if(prev&&prev.c>1440&&n.m<prev.c-1440) return {state:'open',label:'Open now',hrs:'Until '+byFmt(prev.c)};
  if(cur&&n.m>=cur.o&&n.m<cur.c) return {state:'open',label:'Open now',hrs:'Today '+byRange(cur)};
  if(cur&&n.m<cur.o) return {state:'soon',label:'Opens today',hrs:'Today '+byRange(cur)};
  for(let k=1;k<=7;k++){ const d=(n.d+k)%7, p=byParse(C.hours[d]); if(p) return {state:'closed',label:cur?'Closed now':'Closed today',hrs:'Opens '+(k===1?'tomorrow':DAYS[d])+' '+byFmt(p.o)}; }
  return C.today&&!/closed/i.test(C.today)?{state:'open',label:'Open today',hrs:C.today}:{state:'unknown',label:'',hrs:''};
}
function byWeekly(C){
  const w=Array.isArray(C.x.weekly)?C.x.weekly:[]; if(w.length<7) return [];
  const pair=o=>({t:String((o||{}).t||''),d:String((o||{}).d||'')});
  return w.slice(0,7).map(x=>({food:pair((x||{}).food),drink:pair((x||{}).drink),strip:String((x||{}).strip||'')}));
}
function byPill(C){
  const el=h('div',{class:'by-pill'});
  const paint=()=>{ const s=byStatus(C);
    el.replaceChildren(
      s.label?h('span',{class:'st '+s.state},h('i'),h('b',null,s.label),s.hrs?h('span',{class:'hr'},s.hrs):null):null,
      (s.label&&C.addr)?h('span',{class:'sep','aria-hidden':'true'}):null,
      C.addr?h(C.maps?'a':'span',{class:'ad',href:C.maps||null,target:C.maps?'_blank':null,rel:C.maps?'noopener':null,'aria-label':C.maps?('Open '+C.addr+' in Google Maps'):null},ico('pin',14,''),C.addr):null); };
  paint(); setInterval(paint,60000); return el;
}
function byVip(){
  let mode='email';
  const input=h('input',{type:'email',id:'vip-c',name:'contact',autocomplete:'email',inputmode:'email',placeholder:'you@email.com',maxlength:'120',required:'required','aria-describedby':'vip-msg'});
  const label=h('label',{for:'vip-c'},'Email address');
  const fine=h('p',{class:'fine'},'Event updates and drink deals only. Unsubscribe any time.');
  const msg=h('p',{class:'msg',id:'vip-msg',role:'status','aria-live':'polite'});
  const consent=h('input',{type:'checkbox',id:'vip-ok',required:'required'});
  const seg=h('div',{class:'by-seg',role:'group','aria-label':'How should we reach you'});
  const mk=(k,txt)=>{ const b=h('button',{type:'button',class:k===mode?'on':null,'aria-pressed':k===mode?'true':'false',onclick:()=>set(k)},txt); b.dataset.k=k; return b; };
  seg.append(mk('email','Email'),mk('sms','Text'));
  function set(k){ mode=k; seg.querySelectorAll('button').forEach(b=>{ const on=b.dataset.k===k; b.classList.toggle('on',on); b.setAttribute('aria-pressed',on?'true':'false'); });
    input.value=''; msg.textContent=''; msg.className='msg';
    if(k==='sms'){ input.type='tel'; input.setAttribute('inputmode','tel'); input.setAttribute('autocomplete','tel'); input.placeholder='563-555-0123'; label.textContent='Mobile number'; fine.textContent='By joining you agree to get recurring texts about events and drink deals. Msg and data rates may apply. Reply STOP to opt out.'; }
    else{ input.type='email'; input.setAttribute('inputmode','email'); input.setAttribute('autocomplete','email'); input.placeholder='you@email.com'; label.textContent='Email address'; fine.textContent='Event updates and drink deals only. Unsubscribe any time.'; } }
  const form=h('form',{class:'by-vip-f',novalidate:'novalidate',onsubmit:e=>{ e.preventDefault();
    const v=String(input.value||'').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,120);
    const ok=mode==='email'?/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v):(()=>{ const d=v.replace(/\D/g,''); return d.length===10||(d.length===11&&d[0]==='1'); })();
    if(!ok){ msg.className='msg err'; msg.textContent=mode==='email'?'Please enter a valid email address.':'Please enter a 10 digit mobile number.'; input.focus(); return; }
    if(!consent.checked){ msg.className='msg err'; msg.textContent='Please check the box to join the list.'; consent.focus(); return; }
    msg.className='msg info'; msg.textContent='Preview only: this form is not connected yet, so nothing was sent. On the live site, signups go straight to the owner’s list.'; }},
    h('span',{class:'by-kick'},'How should we reach you?'),seg,
    h('div',{class:'by-fld'},label,input),
    h('label',{class:'by-chk',for:'vip-ok'},consent,h('span',null,'Yes, send me Mardi Gras updates and drink deals.')),
    fine,
    h('button',{type:'submit',class:'by-btn by-gold by-full'},'Join the VIP List'),msg);
  return form;
}
function bayou(C){
  const G=groups(C.items,'Menu');
  const name=C.name, logo=okUrl(C.x.logo);
  const sec=(id,cls,...k)=>h('section',{class:'by-sec rv '+(cls||''),id},...k);
  const head=(kick,title,sub)=>h('div',{class:'by-head'},byOrn(),h('span',{class:'by-kick'},kick),h('h2',null,title),sub?h('p',null,sub):null);
  const wk=byWeekly(C), orderUrl=okUrl(C.x.order);

  /* hero: live status pill, special strip, 50/50 button row */
  let stripEl=null;
  if(wk.length){
    const n=byNow(); let ix=n.d, tonight=true;
    if(!byParse(C.hours[n.d])){ tonight=false; for(let k=1;k<=7;k++){ const d=(n.d+k)%7; if(byParse(C.hours[d])||!C.hasHours){ ix=d; break; } } }
    else { const st=byStatus(C); tonight=st.state!=='closed'; }
    const w=wk[ix];
    if(w&&w.strip) stripEl=h('button',{type:'button',class:'by-strip',onclick:()=>scrollTo('b-drinks')},
      h('span',{class:'k'},ico('i-flame',18,''),tonight?'Tonight’s Special':DAYS[ix]+'’s Special'),h('b',null,w.strip),ico('arrow',18,''));
  }
  const hero=h('section',{class:'by-hero',id:'b-top'},
    h('div',{class:'by-bulbs t','aria-hidden':'true'}),
    h('div',{class:'by-hero-in'},
      h('div',{class:'by-hero-t'},
        h('span',{class:'by-kick'},'University Ave · Dubuque · Since the 90s'),
        byPill(C),
        logo?h('img',{class:'by-logo',src:logo,alt:name}):h('h1',null,name),
        h('h1',{class:'by-sr'},name),
        h('p',{class:'by-tag'},C.tag),
        h('div',{class:'by-hero-acts'},stripEl,
          h('div',{class:'by-row2'},
            h('button',{type:'button',class:'by-btn by-line',onclick:()=>scrollTo('b-menu')},'The Menu'),
            orderUrl?h('a',{class:'by-btn by-gold',href:orderUrl,target:'_blank',rel:'noopener'},'Order Carry Out'):(C.tel?h('a',{class:'by-btn by-gold',href:C.tel},'Call to Order'):null)))),
      h('div',{class:'by-hero-pic'},bg(h('div',{class:'ph'}),C.hero),byConfetti(34,16,.9),h('span',{class:'by-gator'})))
  );
  hero.querySelector('.by-gator').innerHTML=BY_GATOR;

  const ticker=(Array.isArray(C.x.ticker)?C.x.ticker:[]).filter(t=>typeof t==='string');
  const tick=ticker.length?h('div',{class:'by-ticker','aria-label':'Specials'},h('div',{class:'by-ticker-in'},[...ticker,...ticker].map(t=>h('span',null,t)))):null;

  /* 7 day food and drink specials switcher */
  let weekEl=null;
  if(wk.length){
    let cur=byNow().d; const today=cur;
    const panel=h('div',{class:'by-day',role:'tabpanel',id:'by-wp'});
    const tabs=h('div',{class:'by-wtabs',role:'tablist','aria-label':'Specials by day'},DAYS.map((d,i)=>{
      const b=h('button',{type:'button',role:'tab',id:'by-wt'+i,'aria-controls':'by-wp',class:'c'+(i%3),onclick:()=>set(i)},h('span',{class:'f'},d),h('span',{class:'s'},SHORT[i]),i===today?h('em',null,'Today'):null); return b; }));
    function set(i){ cur=i;
      tabs.querySelectorAll('button').forEach((b,k)=>{ b.classList.toggle('on',k===i); b.setAttribute('aria-selected',k===i?'true':'false'); b.tabIndex=k===i?0:-1; });
      const w=wk[i], hp=byParse(C.hours[i]);
      panel.setAttribute('aria-labelledby','by-wt'+i);
      panel.replaceChildren(
        h('div',{class:'by-day-h'},h('b',null,DAYS[i]),h('span',null,hp?('Open '+byRange(hp)):(C.hours[i]||'Closed'))),
        h('div',{class:'by-day-g'},
          h('div',{class:'by-dc food'},h('small',null,'Food special'),h('h3',null,w.food.t),h('p',null,w.food.d)),
          h('div',{class:'by-dc drink'},h('small',null,'Drink special'),h('h3',null,w.drink.t),h('p',null,w.drink.d)))); }
    tabs.addEventListener('keydown',e=>{ const k={ArrowRight:1,ArrowLeft:-1}[e.key]; if(!k) return; e.preventDefault(); const nx=(cur+k+7)%7; set(nx); tabs.children[nx].focus(); });
    set(cur); weekEl=h('div',{class:'by-week'},tabs,panel);
  }
  const nights=(Array.isArray(C.x.nights)?C.x.nights:[]).filter(n=>n&&n.day&&!(weekEl&&/friday/i.test(n.day)));
  const drinks=(weekEl||nights.length)?sec('b-drinks','by-drinks',head('Throw me something, mister',weekEl?'Food and Drink Specials':'Drink Nights and Specials',C.x.nightsNote||null),
    weekEl,
    nights.length?h('div',{class:'by-always'},weekEl?h('span',{class:'by-kick'},'Always on the board'):null,
      h('div',{class:'by-coins'},nights.map((n,ix)=>h('div',{class:'by-coin c'+(ix%3),tabindex:'0'},
        h('div',{class:'f'},h('small',null,n.day),h('b',null,n.title),n.price?h('em',null,n.price):null),
        h('div',{class:'b'},h('b',null,n.title),h('p',null,n.text||'')))))):null,
    C.tel?h('div',{class:'by-acts by-c'},h('a',{class:'by-btn by-gold',href:C.tel},ico('phone',18,''),'Call for tonight\'s special')):null):null;

  const favs=(Array.isArray(C.x.favs)?C.x.favs:[]).filter(f=>f&&f.name&&okUrl(f.photo));
  const favEl=favs.length?sec('b-favs','by-favs',head('Straight from the kitchen','House Favorites','Real plates from real nights at Fats.'),
    h('div',{class:'by-throws'},favs.map((f,ix)=>{ const it=C.items.find(i=>i.name===f.name)||{};
      return h('figure',{class:'by-throw',style:'--d:'+(ix%2?14:0)+'px'},
        bg(h('div',{class:'ph'}),okUrl(f.photo)),
        h('figcaption',null,h('div',{class:'r'},h('b',null,f.name),it.price?h('span',null,it.price):null),it.desc?h('p',null,it.desc):(f.note?h('p',null,f.note):null))); }))):null;

  let menu=null;
  if(C.items.length){
    const body=h('div',{class:'by-menu-b'});
    const show=k=>body.replaceChildren(...G.map[k].map(i=>h('div',{class:'by-mi'},h('div',{class:'r'},h('b',null,heat(i.name)),h('i'),h('span',null,i.price||'Ask')),i.desc?h('p',null,heat(i.desc)):null)));
    const tabs=h('div',{class:'by-tabs'},G.names.map((k,ix)=>{ const b=h('button',{type:'button',class:(ix?'':'on ')+'c'+(ix%3)},k); b.addEventListener('click',()=>{ tabs.querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); show(k); }); return b; }));
    const st=Math.max(0,G.names.findIndex(k=>G.map[k].length>3)); tabs.querySelectorAll('button').forEach((x,i)=>x.classList.toggle('on',i===st)); show(G.names[st]);
    menu=sec('b-menu','by-menu',head('Down South and up the street','The Menu','Gumbo, po\' boys, burgers and late night bites. Prices from their ordering menu.'),tabs,body,
      orderUrl?h('div',{class:'by-acts by-c'},h('a',{class:'by-btn by-gold',href:orderUrl,target:'_blank',rel:'noopener'},'Order Carry Out')):null);
  }

  const ft=nextFatTuesday();
  let mardi=null;
  if(ft&&C.x.mardi){
    const nums=['days','hours','mins'].map(k=>h('div',null,h('b',{'data-k':k},'0'),h('small',null,k)));
    const tickCd=()=>{ const ms=Math.max(0,ft-new Date()); const v={days:Math.floor(ms/864e5),hours:Math.floor(ms/36e5)%24,mins:Math.floor(ms/6e4)%60}; nums.forEach(n=>{ const b=n.querySelector('b'); b.textContent=v[b.dataset.k]; }); };
    tickCd(); setInterval(tickCd,30000);
    mardi=sec('b-mardi','by-mardi',byConfetti(26,8,.5),
      h('div',{class:'by-mardi-in'},
        h('div',null,h('span',{class:'by-kick'},'The biggest night of the year'),h('h2',null,'Fat Tuesday at Fat Tuesday\'s'),
          h('p',null,C.x.mardi),
          h('p',{class:'by-date'},ft.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}))),
        h('div',{class:'by-cd'},nums)));
  }

  /* Mardi Gras and VIP list signup */
  const vip=sec('b-vip','by-vip',
    h('div',{class:'by-vip-in'},
      h('div',null,h('span',{class:'by-kick'},'Mardi Gras and VIP list'),h('h2',null,'Get on the list.'),
        h('p',null,'Be first to hear about the Fat Tuesday party, the Friday special and the week’s drink deals. No spam, just the good stuff.'),
        h('ul',null,h('li',null,ico('check',16,''),'Mardi Gras party news before anyone else'),h('li',null,ico('check',16,''),'Weekly drink and food deals'),h('li',null,ico('check',16,''),'Choose email or text'))),
      byVip()));

  const photos=C.own.slice(0,12);
  const caps=Array.isArray(C.x.caps)?C.x.caps:[];
  const gal=photos.length?sec('b-photos','by-photos',head('Around the bar','Photos'),
    h('div',{class:'by-grid'},photos.map((u,ix)=>h('button',{type:'button',class:'by-ph g'+(ix%7),'aria-label':'Open photo',onclick:()=>gallery(photos,name,ix)},bg(h('div',{class:'ph'}),u),caps[ix]?h('span',null,caps[ix]):null)))):null;

  /* reviews: three real guest reviews, preferring ones about gumbo, po' boys and Mardi Gras */
  const rank=r=>(/gumbo/i.test(r.text)?4:0)+(/po.?boy/i.test(r.text)?4:0)+(/mardi/i.test(r.text)?4:0)+(/fat tuesday/i.test(r.text)?2:0);
  const picks=C.reviews.map((r,i)=>[r,i]).sort((a,b)=>rank(b[0])-rank(a[0])||a[1]-b[1]).slice(0,3).map(x=>x[0]);
  const score=(String(C.reviewsSource||'').match(/\d\.\d/)||[''])[0];
  const revs=picks.length?sec('b-revs','by-revs',head('Word on University Ave','Reviews',null),
    h('div',{class:'by-rsum'},score?h('b',null,score):null,stars(5),h('span',null,String(C.reviewsSource||'').replace(/^\d\.\d\s*stars?\s*/i,''))),
    h('div',{class:'by-quotes'},picks.map((r,ix)=>h('figure',{class:'by-q c'+(ix%3)},stars(r.stars||5),h('blockquote',null,'“'+r.text+'”'),h('figcaption',null,r.name,h('small',null,'Google review'))))),
    (C.reviewLink||C.maps)?h('div',{class:'by-acts by-c'},h('a',{class:'by-btn by-line',href:C.reviewLink||C.maps,target:'_blank',rel:'noopener'},'Read more reviews on Google')):null):null;

  /* footer location card: kitchen vs bar hours, phone, address, socials, map */
  const nowD=byNow().d;
  const hrsRow=(d,v,on)=>h('div',{class:on?'today':null},h('span',null,d),h('span',null,v));
  const barHrs=h('div',{class:'by-hrs'},DAYS.map((d,i)=>{ const p=byParse(C.hours[i]); return hrsRow(d,p?byRange(p):(C.hours[i]||'Closed'),i===nowD); }));
  const kit=Array.isArray(C.x.kitchen)&&C.x.kitchen.length===7?C.x.kitchen:null;
  const kitHrs=h('div',{class:'by-hrs'},kit?DAYS.map((d,i)=>hrsRow(d,kit[i]||'Closed',i===nowD)):[hrsRow('Late night menu','Until close',false)]);
  const kNote=typeof C.x.kitchenNote==='string'&&C.x.kitchenNote?h('p',{class:'by-hnote'},C.x.kitchenNote):null;
  const d10=C.phone.replace(/\D/g,'').slice(-10), phoneDash=d10.length===10?d10.slice(0,3)+'-'+d10.slice(3,6)+'-'+d10.slice(6):C.phoneTxt;
  const addrFull=[C.addr,C.city].filter(Boolean).join(', ');
  const visit=sec('b-visit','by-visit',
    h('div',{class:'by-loc'},
      h('div',{class:'by-loc-top'},h('span',{class:'by-kick'},'Pull up a stool'),h('h2',null,'Hours & Location')),
      h('div',{class:'by-loc-grid'},
        h('div',{class:'by-loc-info'},h('h3',null,name),
          addrFull?h(C.maps?'a':'span',{class:'by-addr',href:C.maps||null,target:C.maps?'_blank':null,rel:C.maps?'noopener':null},ico('pin',20,''),h('span',null,addrFull)):null,
          C.tel?h('a',{class:'by-bigtel',href:C.tel},ico('phone',22,''),phoneDash):null,
          h('div',{class:'by-acts'},C.maps?h('a',{class:'by-btn by-gold',href:C.maps,target:'_blank',rel:'noopener'},ico('map',18,''),'Get Directions'):null,orderUrl?h('a',{class:'by-btn by-line',href:orderUrl,target:'_blank',rel:'noopener'},'Order Carry Out'):null),
          (C.fb||C.ig)?h('div',{class:'by-soc'},C.fb?h('a',{href:C.fb,target:'_blank',rel:'noopener'},ico('i-fb',18,''),'Facebook'):null,C.ig?h('a',{href:C.ig,target:'_blank',rel:'noopener'},ico('i-ig',18,''),'Instagram'):null):null),
        h('div',{class:'by-loc-hrs'},
          h('div',{class:'by-hcard kit'},h('div',{class:'by-hcard-h'},h('b',null,'Kitchen Hours')),kitHrs,kNote),
          h('div',{class:'by-hcard bar'},h('div',{class:'by-hcard-h'},h('b',null,'Bar Hours'),h('span',null,'Open til 2')),barHrs)),
        h('div',{class:'by-map wx-map'},mapBox('UNIVERSITY AVE',C.maps,true)))));

  const foot=h('footer',{class:'by-foot'},h('div',{class:'by-bulbs','aria-hidden':'true'}),h('div',{class:'in'},logo?h('img',{src:logo,alt:''}):h('b',null,name),
    h('span',null,'© '+new Date().getFullYear()+' '+name+' · '+[C.addr,C.city].filter(Boolean).join(', ')),h('span',null,'Site by Riverbend Web Co.')));

  /* nav last, so it only links to sections that exist */
  const has={'b-drinks':!!drinks,'b-menu':!!menu,'b-revs':!!revs,'b-visit':true};
  const links=[['b-drinks','Specials'],['b-menu','Menu'],[mardi?'b-mardi':'b-vip','Mardi Gras'],['b-revs','Reviews'],['b-visit','Hours & Map']].filter(([id])=>has[id]!==false);
  const lk=([id,l])=>h('button',{type:'button',class:id==='b-visit'?'hm':null,onclick:()=>scrollTo(id)},l);
  const nav=h('header',{class:'by-nav'},h('div',{class:'by-nav-in'},
    h('a',{class:'by-brand',href:'#',onclick:e=>{e.preventDefault();scrollTo('b-top');}},logo?h('img',{src:logo,alt:name}):h('b',null,name)),
    h('nav',{class:'by-links'},links.map(lk)),
    C.tel?h('a',{class:'by-btn by-gold by-sm',href:C.tel},ico('phone',16,''),h('span',null,C.phoneTxt)):null),
    h('nav',{class:'by-mtabs','aria-label':'Sections'},links.map(lk)));
  return h('div',{class:'demo western on by'},nav,hero,tick,drinks,favEl,menu,gal,revs,mardi,vip,visit,foot);
}
/* ===================== DINER (Dottie's: counter, stools, guest checks) ===================== */
/* ===================== BUZ (coffee + energy: bright, playful, easy menu) ===================== */
let bzN=0;
const BZ_CAT={'Hot':'#FF7A59','Iced':'#4CC3FF','Tea':'#3DDBA5','Energy':'#FF4FA3','Blended Drinks':'#B69CFF'};
const BZ_KIND={'Hot':'hot','Iced':'iced','Tea':'mug','Energy':'iced','Blended Drinks':'blend'};
const BZ_FALL=['#FF7A59','#4CC3FF','#3DDBA5','#FF4FA3','#B69CFF','#FFD23F'];
const bzHex=v=>/^[0-9a-fA-F]{6}$/.test(v||'')?'#'+v:'';
function bzCup(kind,c1,c2,energy){
  const g='bz'+(++bzN), ink='#111', sk='rgba(17,17,17,.55)';
  const sticker=y=>'<circle cx="50" cy="'+y+'" r="11" fill="#fff" stroke="rgba(17,17,17,.3)" stroke-width=".8"/><text x="50" y="'+(y+3.7)+'" text-anchor="middle" font-family="Archivo,Arial Black,sans-serif" font-weight="800" font-size="10" letter-spacing="-.5" fill="#111">BUZ</text>';
  const defs='<defs><linearGradient id="'+g+'d" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+c1+'"/><stop offset="1" stop-color="'+c2+'"/></linearGradient>'+
    '<linearGradient id="'+g+'g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".1"/><stop offset=".25" stop-color="#fff" stop-opacity=".5"/><stop offset=".6" stop-color="#fff" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></linearGradient>'+
    '<linearGradient id="'+g+'p" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff"/><stop offset=".55" stop-color="#f1f1f4"/><stop offset="1" stop-color="#cfcfd6"/></linearGradient>'+
    '<linearGradient id="'+g+'c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#e4e0e6"/></linearGradient></defs>';
  const shadow='<ellipse cx="50" cy="132" rx="30" ry="4" fill="#000" opacity=".16"/>';
  const cube=(x,y,r)=>'<rect x="'+x+'" y="'+y+'" width="13" height="13" rx="3" fill="#fff" fill-opacity=".38" stroke="#fff" stroke-opacity=".85" stroke-width="1" transform="rotate('+r+' '+(x+6.5)+' '+(y+6.5)+')"/>';
  let b='';
  if(kind==='hot'||kind==='mug'){
    const body='M24 46 L76 46 L70 124 Q69.5 128 65 128 L35 128 Q30.5 128 30 124Z';
    b=shadow+'<path d="'+body+'" fill="url(#'+g+'p)" stroke="'+sk+'" stroke-width="1.4" stroke-linejoin="round"/>'+
      '<path d="M25.4 68 L74.6 68 L72.4 104 L27.6 104Z" fill="'+c1+'"/><path d="M25.4 68 L74.6 68 L72.4 104 L27.6 104Z" fill="url(#'+g+'g)"/>'+sticker(86)+
      '<path d="M19 40 Q19 33 27 33 L73 33 Q81 33 81 40 L80 47 L20 47Z" fill="#202024" stroke="#000" stroke-width="1"/><path d="M24 38 Q50 35 76 38" fill="none" stroke="#fff" stroke-opacity=".28" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="62" cy="36" rx="5" ry="1.6" fill="#000" opacity=".6"/>'+
      '<path d="M40 24 Q36 17 41 10 M50 24 Q46 16 51 8 M60 24 Q56 17 61 10" fill="none" stroke="#9aa0a6" stroke-width="2" stroke-linecap="round" opacity=".5"/>';
    if(kind==='mug') b+='<path d="M52 36 Q64 28 72 20" fill="none" stroke="#6b6b70" stroke-width="1"/><rect x="68" y="12" width="14" height="10" rx="1.5" fill="#fff" stroke="'+sk+'" stroke-width="1" transform="rotate(20 75 17)"/>';
  } else if(kind==='blend'){
    const body='M21 64 L79 64 L72 124 Q71.5 128.5 66 128.5 L34 128.5 Q28.5 128.5 28 124Z';
    b=shadow+'<clipPath id="'+g+'k"><path d="'+body+'"/></clipPath><g clip-path="url(#'+g+'k)"><rect x="0" y="66" width="100" height="70" fill="url(#'+g+'d)"/><ellipse cx="50" cy="66" rx="30" ry="3" fill="#fff" opacity=".35"/><path d="M26 80 Q40 74 50 84 T74 80" fill="none" stroke="'+c2+'" stroke-width="3" opacity=".5"/><rect x="24" y="68" width="6" height="64" fill="#fff" opacity=".3"/></g>'+
      '<path d="'+body+'" fill="url(#'+g+'g)" stroke="'+sk+'" stroke-width="1.5" stroke-linejoin="round"/>'+sticker(100)+
      '<path d="M22 64 Q19 30 50 27 Q81 30 78 64Z" fill="#fff" fill-opacity=".14" stroke="'+sk+'" stroke-width="1.3"/>'+
      '<path d="M26 62 Q23 44 36 40 Q40 32 52 33 Q66 34 66 42 Q76 46 74 62Z" fill="url(#'+g+'c)" stroke="rgba(17,17,17,.18)" stroke-width="1"/><path d="M32 50 Q50 40 70 52 M30 58 Q50 48 72 60" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>'+
      '<path d="M30 46 Q44 52 58 44 T72 54" fill="none" stroke="'+c2+'" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>'+
      '<path d="M54 42 L62 6" stroke="#1f1f1f" stroke-width="5" stroke-linecap="round"/><path d="M53 40 L60 12" stroke="#fff" stroke-opacity=".3" stroke-width="1.2" stroke-linecap="round"/>';
  } else {
    const body='M22 42 L78 42 L71.5 122 Q71 127 65 127 L35 127 Q29 127 28.5 122Z';
    b=shadow+'<clipPath id="'+g+'k"><path d="'+body+'"/></clipPath><g clip-path="url(#'+g+'k)"><rect x="0" y="60" width="100" height="72" fill="url(#'+g+'d)"/><ellipse cx="50" cy="60" rx="30" ry="3.2" fill="#fff" opacity=".4"/>'+cube(31,54,-14)+cube(52,60,12)+cube(36,80,8)+cube(54,92,-10)+
      (energy?'<g fill="#fff" fill-opacity=".7"><circle cx="36" cy="70" r="1.4"/><circle cx="62" cy="76" r="1.8"/><circle cx="46" cy="98" r="1.5"/><circle cx="60" cy="108" r="1.3"/><circle cx="40" cy="112" r="1.7"/><circle cx="66" cy="94" r="1.2"/><circle cx="33" cy="94" r="1.1"/></g>':'')+
      '<rect x="24" y="46" width="6" height="84" fill="#fff" opacity=".32"/></g>'+
      '<path d="'+body+'" fill="url(#'+g+'g)" stroke="'+sk+'" stroke-width="1.5" stroke-linejoin="round"/>'+sticker(98)+
      '<path d="M19 42 Q19 35 26 35 L74 35 Q81 35 81 42Z" fill="#fff" fill-opacity=".7" stroke="'+sk+'" stroke-width="1.3"/><ellipse cx="50" cy="42" rx="31" ry="4" fill="#fff" fill-opacity=".55" stroke="'+sk+'" stroke-width="1.2"/>'+
      '<path d="M57 38 L67 5" stroke="#1f1f1f" stroke-width="5" stroke-linecap="round"/><path d="M56 36 L64 10" stroke="#fff" stroke-opacity=".3" stroke-width="1.2" stroke-linecap="round"/>'+
      (energy?'<g transform="translate(76 22)"><circle r="11" fill="#FFD23F" stroke="'+ink+'" stroke-width="1.6"/><path d="M2 -8 L-5 2 L0 2 L-2 8 L5 -2 L0 -2Z" fill="'+ink+'"/></g>':'');
  }
  return '<svg viewBox="0 0 100 140" aria-hidden="true">'+defs+b+'</svg>';
}
function bzArt(kind,c1,c2,cls,energy){ const d=h('div',{class:cls||'bz-art','aria-hidden':'true'}); d.innerHTML=bzCup(kind,c1,c2,energy); return d; }
function bzMark(C,cls){
  const lu=okUrl(C.x.logoUrl);
  if(C.logo||lu) return h('span',{class:cls+' img'},h('img',{src:C.logo||lu,alt:C.name}));
  const d=h('span',{class:cls,role:'img','aria-label':C.name+' logo'});
  d.innerHTML='<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="56" fill="#fff" stroke="#111" stroke-width="6"/><text x="60" y="76" text-anchor="middle" font-family="Archivo,Arial Black,sans-serif" font-weight="800" font-size="46" letter-spacing="-2" fill="#111">BUZ</text></svg>';
  return d;
}
function bzSizes(s){ return String(s||'').split('|').map(p=>p.trim()).filter(Boolean).map(p=>{ const m=p.match(/^(.*?)\s*(\$[\d.,]+)\s*$/); return m?[m[1],m[2]]:['',p]; }); }
function bzLightbox(list,caps,start){
  let i=start; const prev=document.activeElement;
  const img=h('img',{alt:''}), cap=h('p',{class:'bz-lb-cap'}), cnt=h('span',{class:'bz-lb-n'});
  const ov=h('div',{class:'bz-lb',role:'dialog','aria-modal':'true','aria-label':'Photo gallery'});
  const show=n=>{ i=(n+list.length)%list.length; img.src=list[i]; img.alt=caps[i]||'Photo'; cap.textContent=caps[i]||''; cnt.textContent=(i+1)+' / '+list.length; };
  const key=e=>{ if(e.key==='Escape') close(); else if(e.key==='ArrowRight') show(i+1); else if(e.key==='ArrowLeft') show(i-1); };
  const close=()=>{ ov.remove(); document.removeEventListener('keydown',key); document.body.style.overflow=''; if(prev&&prev.focus) prev.focus(); };
  const x=h('button',{type:'button',class:'bz-lb-x','aria-label':'Close',onclick:close},'Close');
  const pv=h('button',{type:'button',class:'bz-lb-a l','aria-label':'Previous photo',onclick:()=>show(i-1)},'\u2039');
  const nx=h('button',{type:'button',class:'bz-lb-a r','aria-label':'Next photo',onclick:()=>show(i+1)},'\u203A');
  let sx=null; ov.addEventListener('touchstart',e=>{ sx=e.touches[0].clientX; },{passive:true});
  ov.addEventListener('touchend',e=>{ if(sx==null) return; const dx=e.changedTouches[0].clientX-sx; sx=null; if(Math.abs(dx)>50) show(i+(dx<0?1:-1)); });
  ov.addEventListener('click',e=>{ if(e.target===ov||e.target.classList.contains('bz-lb-stage')) close(); });
  ov.append(x,h('div',{class:'bz-lb-stage'},pv,img,nx),h('div',{class:'bz-lb-bar'},cap,cnt));
  document.body.append(ov); document.body.style.overflow='hidden'; document.addEventListener('keydown',key); show(i); x.focus();
}
function buz(C){
  const raw=Array.isArray(C.x.menu)&&C.x.menu.length?C.x.menu.map(m=>({cat:String(m.cat||'Menu'),n:String(m.n||''),s:String(m.s||''),c:String(m.c||''),note:String(m.note||'')})):C.items.map(i=>({cat:i.group||'Menu',n:i.name,s:i.price?String(i.price):'',c:'',note:i.desc||''}));
  const menu=raw.filter(m=>m.n);
  const cats=[]; menu.forEach(m=>{ if(!cats.includes(m.cat)) cats.push(m.cat); });
  const catC=(k,i)=>BZ_CAT[k]||BZ_FALL[(i||0)%BZ_FALL.length];
  const catK=k=>BZ_KIND[k]||'iced';
  const name=C.name||'BUZ';
  const st=byStatus(C);

  /* nav */
  const stEl=h('span',{class:'bz-st'});
  const paint=()=>{ const s=byStatus(C); stEl.className='bz-st '+(s.state||''); stEl.replaceChildren(...(s.label?[h('i'),h('b',null,s.label),s.hrs?h('em',null,s.hrs):null].filter(Boolean):[])); };
  paint(); setInterval(paint,60000);
  const links=[C.specials.length?['z-seasonal','Seasonal']:null,menu.length?['z-menu','Menu']:null,menu.some(m=>bzSizes(m.s).length)?['z-build','Build']:null,C.own.length?['z-gallery','Gallery']:null,['z-about','About'],['z-visit','Visit']].filter(Boolean);
  const nav=h('header',{class:'bz-nav'},h('div',{class:'bz-nav-in'},
    h('a',{class:'bz-brand',href:'#',onclick:e=>{e.preventDefault();scrollTo('z-top');}},bzMark(C,'bz-mk sm'),h('b',null,name)),
    h('nav',{class:'bz-links'},links.map(([id,l])=>h('button',{type:'button',onclick:()=>scrollTo(id)},l))),
    stEl,
    C.maps?h('a',{class:'bz-btn ink sm',href:C.maps,target:'_blank',rel:'noopener'},ico('pin',15,''),h('span',null,'Directions')):null),
    h('nav',{class:'bz-mlinks','aria-label':'Sections'},links.map(([id,l])=>h('button',{type:'button',onclick:()=>scrollTo(id)},l))));

  /* hero */
  const heroCups=[['hot','#FF7A59','#C2410C'],['iced','#4CC3FF','#2563EB'],['blend','#B69CFF','#7C3AED'],['mug','#3DDBA5','#059669']];
  const hero=h('section',{class:'bz-hero',id:'z-top'},
    h('div',{class:'bz-hero-in'},
      h('div',{class:'bz-hero-t'},
        bzMark(C,'bz-mk lg'),
        h('h1',null,C.tag||('Coffee and energy in downtown Dubuque.')),
        C.about?h('p',null,short(C.about,170)):null,
        h('div',{class:'bz-cta'},
          menu.length?h('button',{type:'button',class:'bz-btn ink',onclick:()=>scrollTo('z-menu')},'See the menu'):null,
          C.maps?h('a',{class:'bz-btn line',href:C.maps,target:'_blank',rel:'noopener'},ico('pin',16,''),'Get directions'):null)),
      C.own.length>=3?h('div',{class:'bz-hero-art ph3'},C.own.slice(0,3).map((u,i)=>h('button',{type:'button',class:'bz-hp p'+i,'aria-label':'Open photo',onclick:()=>scrollTo('z-gallery')},bg(h('span'),u)))):h('div',{class:'bz-hero-art','aria-hidden':'true'},heroCups.map(([k,a,b],i)=>bzArt(k,a,b,'bz-hc c'+i)))));

  /* quick info */
  const tiles=[
    C.hasHours?h('div',{class:'bz-tile t1'},h('small',null,'Today'),h('b',null,st.hrs?st.hrs.replace(/^Today /,''):(C.today||'See hours')),h('span',null,st.label||'')):null,
    C.addr?h('a',{class:'bz-tile t2',href:C.maps||null,target:C.maps?'_blank':null,rel:'noopener'},h('small',null,'Find us'),h('b',null,C.addr),h('span',null,C.city||'')):null,
    C.phoneTxt?h('a',{class:'bz-tile t3',href:C.tel||null},h('small',null,'Call'),h('b',null,C.phoneTxt),h('span',null,'Walk-up counter')):null
  ].filter(Boolean);
  const info=tiles.length?h('section',{class:'bz-info'},h('div',{class:'bz-wrap bz-tiles'},tiles)):null;

  /* menu */
  let menuEl=null;
  if(menu.length){
    let cur='All', q='';
    const grid=h('div',{class:'bz-grid'}), empty=h('p',{class:'bz-empty',hidden:''},'No drinks match that search.');
    const tabs=h('div',{class:'bz-tabs',role:'group','aria-label':'Menu categories'});
    const search=h('input',{type:'search',class:'bz-search',placeholder:'Search drinks',autocomplete:'off','aria-label':'Search drinks'});
    const card=(m)=>{ const i=cats.indexOf(m.cat), col=catC(m.cat,i); const cc=m.c.split(',').map(bzHex);
      return h('article',{class:'bz-card',style:'--cc:'+col},
        bzArt(catK(m.cat),cc[0]||col,cc[1]||cc[0]||col,'bz-art',m.cat==='Energy'),
        h('div',{class:'bz-card-b'},h('span',{class:'bz-cat'},m.cat),h('h4',null,m.n),m.note?h('p',null,m.note):null,
          h('ul',{class:'bz-sz'},bzSizes(m.s).map(([a,b])=>h('li',null,a?h('span',null,a):null,h('b',null,b)))))); };
    const draw=()=>{ const t=q.trim().toLowerCase();
      const list=menu.filter(m=>(cur==='All'||m.cat===cur)&&(!t||m.n.toLowerCase().includes(t)||m.cat.toLowerCase().includes(t)));
      grid.replaceChildren(...list.map(card)); empty.hidden=list.length>0;
      [...tabs.children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.k===cur))); };
    ['All',...cats].forEach((k,i)=>{ const b=h('button',{type:'button',class:'bz-tab','data-k':k,style:'--cc:'+(k==='All'?'#111':catC(k,i-1)),onclick:()=>{cur=k;draw();}},h('i'),k); tabs.append(b); });
    search.addEventListener('input',()=>{ q=search.value; draw(); });
    draw();
    const tags=Array.isArray(C.x.tags)?C.x.tags.filter(t=>typeof t==='string').slice(0,12):[];
    menuEl=h('section',{class:'bz-sec bz-menu',id:'z-menu'},h('div',{class:'bz-wrap'},
      h('h2',null,'The Menu'),h('p',{class:'bz-sub'},'Pick a category or search. Every drink shows its sizes and prices.'),
      h('div',{class:'bz-bar'},tabs,search),grid,empty,
      tags.length?h('div',{class:'bz-also'},h('h3',null,'Also at the window'),h('div',{class:'bz-tags'},tags.map((t,i)=>h('span',{style:'--cc:'+BZ_FALL[i%BZ_FALL.length]},t)))):null));
  }

  /* seasonal and limited drinks (uses the Studio's Specials & events) */
  const seasonal=C.specials.length?h('section',{class:'bz-sec bz-season',id:'z-seasonal'},h('div',{class:'bz-wrap'},
    h('h2',null,'Seasonal & limited drinks'),h('p',{class:'bz-sub'},'These come and go. Ask what is on at the window.'),
    h('div',{class:'bz-sgrid'},C.specials.slice(0,8).map((s,i)=>h('article',{class:'bz-scard',style:'--cc:'+BZ_FALL[i%BZ_FALL.length]},
      s.photos[0]?bg(h('div',{class:'bz-sph'}),s.photos[0]):bzArt('iced',BZ_FALL[i%BZ_FALL.length],'#111','bz-sph art'),
      h('div',{class:'bz-sb'},s.when?h('span',{class:'bz-cat'},s.when):null,h('h3',null,s.title),s.detail?h('p',null,s.detail):null)))))):null;

  /* build your BUZ */
  let builder=null;
  const bItems=menu.filter(m=>bzSizes(m.s).length);
  if(bItems.length){
    const flavors=(Array.isArray(C.x.flavors)?C.x.flavors:[]).filter(t=>typeof t==='string').slice(0,14).map(t=>{ const [n,c]=t.split('|'); const cc=(c||'').split(',').map(bzHex); return {n:n.trim(),a:cc[0]||'',b:cc[1]||cc[0]||''}; }).filter(f=>f.n);
    const milks=(Array.isArray(C.x.milks)?C.x.milks:['Regular milk','Alternative milk']).filter(t=>typeof t==='string').slice(0,6);
    const S={d:0,s:0,f:-1,m:0};
    const out=h('div',{class:'bz-bout'}); const rows=h('div',{class:'bz-bsteps'});
    const chips=(label,opts,get,set)=>{ const row=h('div',{class:'bz-brow'},h('h3',null,label),h('div',{class:'bz-chips',role:'group','aria-label':label},opts.map((o,i)=>h('button',{type:'button',class:'bz-chip','aria-pressed':String(get()===i),onclick:()=>{ set(i); draw(); }},o)))); return row; };
    const dRow=()=>{ const wrap=h('div',{class:'bz-brow'},h('h3',null,'1. Pick a drink'));
      cats.forEach((cat,ci)=>{ const idx=bItems.map((m,i)=>m.cat===cat?i:-1).filter(i=>i>=0); if(!idx.length) return;
        wrap.append(h('div',{class:'bz-grp',style:'--cc:'+catC(cat,ci)},h('span',{class:'bz-gl'},h('i'),cat==='Energy'?'Energy drinks':cat),
          h('div',{class:'bz-chips',role:'group','aria-label':cat},idx.map(i=>h('button',{type:'button',class:'bz-chip','aria-pressed':String(S.d===i),onclick:()=>{ S.d=i; S.s=0; draw(); }},bItems[i].n))))); });
      return wrap; };
    const draw=()=>{
      const it=bItems[S.d], sz=bzSizes(it.s); if(S.s>=sz.length) S.s=0;
      const isEn=it.cat==='Energy', noMilk=isEn||/^hot tea$/i.test(it.n), noFlav=isEn;
      const ci=cats.indexOf(it.cat), col=catC(it.cat,ci), cc=it.c.split(',').map(bzHex);
      const fl=(!noFlav&&S.f>=0)?flavors[S.f]:null;
      const c1=(fl&&fl.a)||cc[0]||col, c2=(fl&&fl.b)||cc[1]||cc[0]||col;
      const line1=(sz[S.s][0]?sz[S.s][0]+' ':'')+it.n;
      const line2=[fl?fl.n:null,noMilk?null:milks[S.m]].filter(Boolean).join(' \u00B7 ');
      const txt=['My BUZ order:',line1,isEn?'Energy drink':'',line2,'Menu price '+sz[S.s][1]].filter(Boolean).join('\n');
      const copy=h('button',{type:'button',class:'bz-btn ink'},'Copy my order'); const note=h('p',{class:'bz-bnote','aria-live':'polite'},isEn?'Menu price shown.':'Menu price shown. Ask at the window about flavor and milk.');
      copy.addEventListener('click',()=>{ const done=()=>{ note.textContent='Copied. Show it at the window.'; }; try{ navigator.clipboard.writeText(txt).then(done,()=>{ note.textContent='Show this order at the window.'; }); }catch(e){ note.textContent='Show this order at the window.'; } });
      out.replaceChildren(bzArt(catK(it.cat),c1,c2,'bz-bcup',isEn),h('div',{class:'bz-bres'},h('span',{class:'bz-cat',style:'--cc:'+col},isEn?'Energy drink':it.cat),h('small',null,'Your BUZ'),h('b',null,line1),line2?h('span',null,line2):null,isEn?h('span',{class:'bz-bsub'},'Made with zero-sugar, zero-calorie Bang Energy'):null,h('strong',null,sz[S.s][1]),copy,note));
      let n=2; const lab=t=>(n++)+'. '+t;
      rows.replaceChildren(...[dRow(),
        chips(lab('Pick a size'),sz.map(p=>(p[0]||'Regular')+'  '+p[1]),()=>S.s,i=>{S.s=i;}),
        (!noFlav&&flavors.length)?chips(lab('Pick a flavor'),['No flavor',...flavors.map(f=>f.n)],()=>S.f+1,i=>{S.f=i-1;}):null,
        noMilk?null:chips(lab('Pick a milk'),milks,()=>S.m,i=>{S.m=i;})].filter(Boolean));
    };
    draw();
    builder=h('section',{class:'bz-sec bz-build',id:'z-build'},h('div',{class:'bz-wrap'},h('h2',null,'Build your BUZ'),h('p',{class:'bz-sub'},'Mix a drink, see your price, then show it at the window.'),h('div',{class:'bz-bgrid'},rows,out)));
  }

  /* gift cards */
  const gift=(C.x.gift&&typeof C.x.gift==='object'&&C.x.gift.title)?h('section',{class:'bz-gift'},h('div',{class:'bz-wrap bz-gift-in'},
    okUrl(C.x.gift.photo)?bg(h('div',{class:'bz-gph'}),C.x.gift.photo):null,
    h('div',null,h('h2',null,String(C.x.gift.title)),C.x.gift.text?h('p',null,String(C.x.gift.text)):null))):null;

  /* walk from campus */
  const camps=(Array.isArray(C.x.campuses)?C.x.campuses:[]).filter(c=>c&&c.n&&c.q).slice(0,5);
  const walk=(camps.length&&C.addr)?h('section',{class:'bz-sec bz-walk'},h('div',{class:'bz-wrap'},h('h2',null,'Walking over from campus?'),h('p',{class:'bz-sub'},'Tap your school for walking directions to the window.'),
    h('div',{class:'bz-camps'},camps.map((c,i)=>h('a',{class:'bz-camp',style:'--cc:'+BZ_FALL[(i+2)%BZ_FALL.length],href:'https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(String(c.q))+'&destination='+encodeURIComponent([C.addr,C.city].filter(Boolean).join(', '))+'&travelmode=walking',target:'_blank',rel:'noopener'},ico('pin',18,''),h('b',null,String(c.n)),h('span',null,'Walking directions')))))):null;

  /* follow */
  const follow=(C.fb||C.ig)?h('div',{class:'bz-follow'},h('b',null,'Follow BUZ for new drinks'),h('div',{class:'bz-cta'},C.ig?h('a',{class:'bz-btn ink',href:C.ig,target:'_blank',rel:'noopener'},ico('i-ig',18,''),'Instagram'):null,C.fb?h('a',{class:'bz-btn line',href:C.fb,target:'_blank',rel:'noopener'},ico('i-fb',18,''),'Facebook'):null)):null;

  /* energy band */
  const eng=menu.filter(m=>m.cat==='Energy');
  const band=C.x.bandTitle?h('section',{class:'bz-band'},h('div',{class:'bz-wrap bz-band-in'},
    h('div',null,h('h2',null,C.x.bandTitle),C.x.bandText?h('p',null,String(C.x.bandText)):null),
    eng.length?h('div',{class:'bz-cans','aria-hidden':'true'},eng.slice(0,3).map(m=>bzArt('iced',bzHex(m.c.split(',')[0])||'#FF4FA3',bzHex(m.c.split(',')[1])||'#2563EB','bz-bc',true))):null)):null;

  /* about */
  const facts=Array.isArray(C.x.facts)?C.x.facts.filter(f=>f&&f.k&&f.v).slice(0,6):[];
  const about=h('section',{class:'bz-sec',id:'z-about'},h('div',{class:'bz-wrap bz-about'},
    h('div',null,h('h2',null,'About '+name),C.about?C.about.split(/\n+/).map(t=>h('p',null,t)):null),
    facts.length?h('dl',{class:'bz-facts'},facts.map((f,i)=>h('div',{style:'--cc:'+BZ_FALL[i%BZ_FALL.length]},h('dt',null,String(f.k)),h('dd',null,String(f.v))))):null));

  /* gallery (only if the owner has real photos) */
  const caps=Array.isArray(C.x.caps)?C.x.caps.map(t=>typeof t==='string'?t:''):[];
  const gal=C.own.length?h('section',{class:'bz-sec bz-gal',id:'z-gallery'},h('div',{class:'bz-wrap'},h('h2',null,'Gallery'),h('p',{class:'bz-sub'},'Tap a photo to see it full size.'),
    h('div',{class:'bz-photos'},C.own.slice(0,12).map((u,i)=>h('button',{type:'button',class:'bz-gt'+(i===0?' big':''),'aria-label':'Open photo '+(i+1)+(caps[i]?': '+caps[i]:''),onclick:()=>bzLightbox(C.own.slice(0,12),caps,i)},bg(h('span',{class:'bz-ph'}),u),caps[i]?h('em',null,caps[i]):null))),follow)):null;

  /* visit */
  const visit=h('section',{class:'bz-sec bz-visit',id:'z-visit'},h('div',{class:'bz-wrap bz-vgrid'},
    C.hasHours?h('div',{class:'bz-card2 hrs'},h('h3',null,'Hours'),h('div',{class:'bz-hrs'},hoursRows(C))):null,
    h('div',{class:'bz-card2 loc'},h('h3',null,'Find us'),
      h('p',{class:'bz-addr'},C.addr?h('b',null,C.addr):null,C.city?h('span',null,C.city):null),
      C.x.note?h('p',{class:'bz-note'},String(C.x.note)):null,
      h('div',{class:'bz-cta'},C.maps?h('a',{class:'bz-btn ink',href:C.maps,target:'_blank',rel:'noopener'},ico('pin',16,''),'Get directions'):null,C.tel?h('a',{class:'bz-btn line',href:C.tel},ico('phone',16,''),C.phoneTxt):null),
      socials(C))));

  const foot=h('footer',{class:'bz-foot'},h('div',{class:'bz-wrap bz-foot-in'},bzMark(C,'bz-mk sm'),h('span',null,h('b',null,name),[C.addr,C.city].filter(Boolean).length?' · '+[C.addr,C.city].filter(Boolean).join(', '):''),socials(C)));
  return h('div',{class:'demo bz on'},nav,hero,info,seasonal,menuEl,builder,band,gal,gift,walk,about,visit,foot);
}

/* ===================== FADE BABE (barbershop + hair studio) ===================== */
function fdStatus(C){
  const n=byNow(), t=String(C.hours[n.d]||'');
  if(/appoint/i.test(t)) return {state:'soon',label:'By appointment today',hrs:'Call to book'};
  return byStatus(C);
}
function fdMark(C,cls){
  const u=okUrl(C.x.logoUrl);
  return h('span',{class:'fd-mk '+(cls||'')},u?h('img',{src:u,alt:''}):h('b',null,String(C.name||'F').slice(0,1)));
}
const FD_ICONS={
 scissors:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M8.5 7.5L21 19M8.5 16.5L21 5"/>',
 clipper:'<path d="M8 3h8v5l-1.5 2v11h-5V10L8 8z"/><path d="M10.5 6h3"/>',
 beard:'<path d="M2 10c3-3 6-2.5 10 .5 4-3 7-3.5 10-.5-1 5.5-5 7-10 3.5-5 3.5-9 2-10-3.5z"/>',
 drop:'<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>',
 spark:'<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',
 eye:'<path d="M2 12c3-5 7-7 10-7s7 2 10 7c-3 5-7 7-10 7s-7-2-10-7z"/><circle cx="12" cy="12" r="3"/>'
};
function fdIcon(k){ const s=h('span',{class:'fd-ic','aria-hidden':'true'}); s.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+(FD_ICONS[k]||FD_ICONS.scissors)+'</svg>'; return s; }
function fade(C){
  const name=C.name||'Fade Babe';
  const svc=(Array.isArray(C.x.svc)?C.x.svc:[]).filter(s=>s&&s.g&&s.t).slice(0,4).map(s=>({g:String(s.g),d:s.d?String(s.d):'',t:String(s.t).split('|').map(t=>t.trim()).filter(Boolean)}));
  const perks=(Array.isArray(C.x.perks)?C.x.perks:[]).filter(p=>p&&p.t).slice(0,4);
  const prods=(Array.isArray(C.x.prods)?C.x.prods:[]).filter(t=>typeof t==='string').slice(0,8);
  const stats=(Array.isArray(C.x.stats)?C.x.stats:[]).filter(f=>f&&f.k&&f.v).slice(0,4);
  const faq=(Array.isArray(C.x.faq)?C.x.faq:[]).filter(f=>f&&f.q&&f.a).slice(0,8);
  const quick=(Array.isArray(C.x.quick)?C.x.quick:[]).filter(q=>q&&q.n).slice(0,6);
  const caps=Array.isArray(C.x.caps)?C.x.caps.map(t=>typeof t==='string'?t:''):[];
  const own=C.own, pick=n=>(Number.isInteger(n)&&own[n])?own[n]:'';
  const heroI=Number.isInteger(C.x.hero)?C.x.hero:0;
  const aboutI=(Array.isArray(C.x.ab)?C.x.ab:[]).filter(n=>Number.isInteger(n)&&own[n]).slice(0,2);
  const st=fdStatus(C);
  let openPanel=null;

  const stEl=h('span',{class:'fd-st'});
  const paint=()=>{ const s=fdStatus(C); stEl.className='fd-st '+(s.state||''); stEl.replaceChildren(...(s.label?[h('i'),h('b',null,s.label),s.hrs?h('em',null,s.hrs):null].filter(Boolean):[])); };
  paint(); setInterval(paint,60000);
  const links=[svc.length?['f-split','Services']:null,own.length?['f-gallery','Work']:null,['f-about','About'],faq.length?['f-faq','FAQ']:null,['f-visit','Visit']].filter(Boolean);
  const nav=h('header',{class:'fd-nav'},h('div',{class:'fd-nav-in'},
    h('nav',{class:'fd-links'},links.map(([id,l])=>h('button',{type:'button',onclick:()=>scrollTo(id)},l))),
    h('a',{class:'fd-brand',href:'#',onclick:e=>{e.preventDefault();scrollTo('f-top');}},fdMark(C,'sm'),h('b',null,name)),
    h('div',{class:'fd-nav-r'},stEl,C.tel?h('a',{class:'fd-btn red sm',href:C.tel},ico('phone',15,''),h('span',null,'Call')):null)),
    h('nav',{class:'fd-mlinks','aria-label':'Sections'},links.map(([id,l])=>h('button',{type:'button',onclick:()=>scrollTo(id)},l))));

  /* hero: one big photo, serif headline, service icon row */
  const hero=h('section',{class:'fd-hero',id:'f-top'},
    bg(h('div',{class:'fd-hero-ph','aria-hidden':'true'}),pick(heroI)),
    h('div',{class:'fd-wrap fd-hero-in'},
      h('div',{class:'fd-hero-t'},
        h('span',{class:'fd-kick'},C.category||'Barbershop and hair studio'),
        h('h1',null,C.x.headline?String(C.x.headline):name),
        h('p',{class:'fd-lead'},C.tag||''),
        h('div',{class:'fd-cta'},
          C.tel?h('a',{class:'fd-btn red',href:C.tel},ico('phone',16,''),'Call '+C.phoneTxt):null,
          C.maps?h('a',{class:'fd-btn ghost',href:C.maps,target:'_blank',rel:'noopener'},ico('pin',16,''),'Get directions'):null))),
    quick.length?h('div',{class:'fd-wrap'},h('div',{class:'fd-quick',role:'list'},quick.map(q=>h('button',{type:'button',role:'listitem',onclick:()=>{ scrollTo('f-split'); if(openPanel&&(q.p==='a'||q.p==='b')) openPanel(q.p); }},fdIcon(q.i),h('span',null,String(q.n)))))):null);

  /* brands row */
  const brands=prods.length?h('section',{class:'fd-brands'},h('div',{class:'fd-wrap'},
    h('p',{class:'fd-bq'},'Products we use and carry.'+(C.x.prodNote?' '+String(C.x.prodNote):'')),
    h('div',{class:'fd-bn'},prods.map(t=>h('span',null,t))))):null;

  /* about with overlapping photos and stats */
  const paras=String(C.about||'').split(/\n+/).filter(Boolean);
  const about=h('section',{class:'fd-sec fd-light fd-about3',id:'f-about'},h('div',{class:'fd-wrap fd-ab-grid'},
    aboutI.length?h('div',{class:'fd-ab-ph'},
      bg(h('div',{class:'fd-ab-a'}),own[aboutI[0]]),
      aboutI[1]?bg(h('div',{class:'fd-ab-b'}),own[aboutI[1]]):null,
      stats[0]?h('div',{class:'fd-ab-box'},h('b',null,String(stats[0].v)),h('span',null,String(stats[0].k))):null):null,
    h('div',{class:'fd-ab-t'},
      h('span',{class:'fd-kick dark'},'About us'),
      h('h2',null,C.x.aboutTitle?String(C.x.aboutTitle):('About '+name)),
      paras.map(t=>h('p',null,t)),
      stats.length>1?h('dl',{class:'fd-stats'},stats.slice(1).map(f=>h('div',null,h('dd',null,String(f.v)),h('dt',null,String(f.k))))):null,
      h('div',{class:'fd-cta'},C.tel?h('a',{class:'fd-btn red',href:C.tel},ico('phone',16,''),'Call '+C.phoneTxt):null))));

  /* services: split-screen barbershop | hair studio */
  const idxA=Array.isArray(C.x.pa)?C.x.pa.filter(n=>Number.isInteger(n)&&own[n]):own.map((u,i)=>i).filter(i=>i%2===0);
  const idxB=Array.isArray(C.x.pb)?C.x.pb.filter(n=>Number.isInteger(n)&&own[n]):own.map((u,i)=>i).filter(i=>i%2===1);
  const sideDefs=svc.length>=2?[{k:'a',g:svc.slice(0,1),idx:idxA},{k:'b',g:svc.slice(1),idx:idxB}]:[];
  let split=null;
  if(sideDefs.length){
    const els=[];
    const setOpen=k=>{ split.dataset.open=k||''; els.forEach(e=>{ const on=e.k===k; e.btn.setAttribute('aria-expanded',String(on)); e.btn.textContent=on?'Close':e.label; e.more.hidden=!on; e.pn.classList.toggle('on',on); }); };
    openPanel=k=>setOpen(k);
    const panel=(d,i)=>{ const main=d.g[0], more=d.g.slice(1);
      const id='fd-more-'+d.k, label=d.k==='a'?'See barbershop services':'See studio services';
      const btn=h('button',{type:'button',class:'fd-btn '+(d.k==='a'?'red':'light'),'aria-expanded':'false','aria-controls':id},label);
      const moreEl=h('div',{class:'fd-pn-more',id,hidden:''},
        h('ul',{class:'fd-pn-ul'},main.t.map(t=>h('li',null,t))),
        more.map(m=>h('div',{class:'fd-pn-sub'},h('h3',null,m.g),m.d?h('p',null,m.d):null,h('ul',{class:'fd-pn-ul'},m.t.map(t=>h('li',null,t))))),
        d.idx.length?h('div',{class:'fd-pn-thumbs'},d.idx.slice(0,4).map(n=>h('button',{type:'button','aria-label':'Open photo: '+(caps[n]||('photo '+(n+1))),onclick:()=>bzLightbox(own.slice(0,12),caps,n)},bg(h('span'),own[n])))):null,
        C.tel?h('a',{class:'fd-btn '+(d.k==='a'?'red':'light'),href:C.tel},ico('phone',16,''),'Call '+C.phoneTxt):null);
      const pn=h('article',{class:'fd-pn '+d.k},
        bg(h('div',{class:'fd-pn-bg','aria-hidden':'true'}),own[d.idx[0]]),
        h('div',{class:'fd-pn-in'},h('span',{class:'fd-pn-n'},'0'+(i+1)),h('h2',null,main.g),main.d?h('p',{class:'fd-pn-d'},main.d):null,btn,moreEl));
      const rec={k:d.k,btn,more:moreEl,pn,label};
      btn.addEventListener('click',()=>setOpen(split.dataset.open===d.k?'':d.k));
      els.push(rec); return pn; };
    split=h('section',{class:'fd-split',id:'f-split','data-open':''},sideDefs.map(panel));
  }
  const services=split?h('div',{class:'fd-services'},
    h('div',{class:'fd-wrap fd-sv-h'},h('span',{class:'fd-kick'},'What we do'),h('h2',null,'Pick your chair'),h('p',null,'Call or stop in for pricing and to book.')),split):null;

  /* moving gallery: slides drift by themselves, pause on hover or with the button */
  let gal=null;
  if(own.length){
    const all=own.slice(0,12).map((u,i)=>i);
    const early=[heroI,...aboutI,...sideDefs.map(d=>d.idx[0])];
    const ordered=all.filter(i=>!early.includes(i)).concat(all.filter(i=>early.includes(i)));
    const list=ordered.map(i=>own[i]), gcaps=ordered.map(i=>caps[i]||'');
    const slide=(i,clone)=>h('figure',{class:'fd-slide','aria-hidden':clone?'true':null},
      h('button',{type:'button',tabindex:clone?'-1':null,'aria-label':'Open photo '+(i+1)+(gcaps[i]?': '+gcaps[i]:''),onclick:()=>bzLightbox(list,gcaps,i)},bg(h('span'),list[i])),
      gcaps[i]?h('figcaption',null,gcaps[i]):null);
    const idxs=list.map((u,i)=>i);
    const track=h('div',{class:'fd-marq-track'},idxs.map(i=>slide(i,false)),idxs.map(i=>slide(i,true)));
    track.style.animationDuration=Math.max(30,list.length*7)+'s';
    const marq=h('div',{class:'fd-marq'},track);
    const pbtn=h('button',{type:'button',class:'fd-pause','aria-pressed':'false'},'Pause');
    pbtn.addEventListener('click',()=>{ const on=!marq.classList.contains('paused'); marq.classList.toggle('paused',on); pbtn.setAttribute('aria-pressed',String(on)); pbtn.textContent=on?'Play':'Pause'; });
    gal=h('section',{class:'fd-sec fd-dark fd-gal',id:'f-gallery'},
      h('div',{class:'fd-wrap fd-gal-h'},h('div',null,h('span',{class:'fd-kick'},'Recent work'),h('h2',null,'The work'),h('p',{class:'fd-sub'},'Cuts and color from the chair. Tap a photo to see it full size.')),pbtn),
      marq,
      (C.fb||C.ig)?h('div',{class:'fd-wrap'},h('div',{class:'fd-follow'},h('b',null,'See more on social'),h('div',{class:'fd-cta'},C.ig?h('a',{class:'fd-btn red',href:C.ig,target:'_blank',rel:'noopener'},ico('i-ig',18,''),'Instagram'):null,C.fb?h('a',{class:'fd-btn ghost',href:C.fb,target:'_blank',rel:'noopener'},ico('i-fb',18,''),'Facebook'):null))):null);
  }

  /* perks band */
  const pole=()=>h('div',{class:'fd-pole','aria-hidden':'true'});
  const FD_PK={
    coffee:'<path d="M8 22h26v14a10 10 0 0 1-10 10h-6A10 10 0 0 1 8 36z"/><path d="M34 26h4a6 6 0 0 1 0 12h-4"/><path d="M15 6c-3 4 3 5 0 10M22 6c-3 4 3 5 0 10M29 6c-3 4 3 5 0 10"/>',
    beer:'<path d="M10 14h24v28a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4z"/><path d="M34 20h5a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4h-5"/><path d="M10 14c0-5 5-7 8-5 3-4 10-3 11 2 3 0 5 1 5 3"/><path d="M18 22v18M26 22v18"/>',
    tv:'<rect x="4" y="8" width="40" height="28" rx="3"/><path d="M16 44h16M24 36v8"/><path d="M10 14h12"/>',
    star:'<path d="m24 6 5.4 11 12.1 1.7-8.8 8.5 2.1 12-10.8-5.7-10.8 5.7 2.1-12-8.8-8.5L18.6 17z"/>'};
  const pkIco=t=>{ const k=/coffee|tea|cafe/i.test(t)?'coffee':/beer|drink|bar/i.test(t)?'beer':/tv|screen|game|sport/i.test(t)?'tv':'star'; const s=h('span',{class:'fd-pk-i','aria-hidden':'true'}); s.innerHTML='<svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">'+FD_PK[k]+'</svg>'; return s; };
  const band=perks.length?h('section',{class:'fd-band',id:'f-shop'},pole(),
    h('div',{class:'fd-wrap'},h('span',{class:'fd-band-k'},'While you wait'),
      h('ul',{class:'fd-band-in'},perks.map(p=>h('li',null,pkIco(String(p.t)),h('span',null,String(p.t)))))),pole()):null;

  /* FAQ */
  const faqEl=faq.length?h('section',{class:'fd-sec fd-light fd-faq',id:'f-faq'},h('div',{class:'fd-wrap fd-faq-grid'},
    h('div',null,h('span',{class:'fd-kick dark'},'Good to know'),h('h2',null,'Frequently asked questions'),
      h('div',{class:'fd-qa'},faq.map((f,i)=>h('details',i===0?{open:''}:null,h('summary',null,String(f.q)),h('p',null,String(f.a)))))),
    h('aside',{class:'fd-ask'},
      bg(h('div',{class:'fd-ask-ph','aria-hidden':'true'}),pick(Number.isInteger(C.x.faqPh)?C.x.faqPh:5)),
      h('div',{class:'fd-ask-in'},h('h3',null,'Have a question?'),h('p',null,'Call or stop by and we will help you out.'),
        C.tel?h('a',{class:'fd-btn red',href:C.tel},ico('phone',16,''),C.phoneTxt):null)))):null;

  /* visit: week strip over a real map */
  const mapQ=encodeURIComponent([C.name,C.addr,C.city].filter(Boolean).join(', '));
  const short=v=>{ const t=String(v||'').trim(); if(!t) return ['Closed','']; if(/appoint/i.test(t)) return ['By','appt.']; const m=t.match(/(\d{1,2}(?::\d{2})?\s*[ap]m)\s*(?:-|to|–)\s*(\d{1,2}(?::\d{2})?\s*[ap]m)/i); return m?[m[1].replace(/\s/g,''),m[2].replace(/\s/g,'')]:[t,'']; };
  const visit=h('section',{class:'fd-visit',id:'f-visit'},
    C.addr?h('div',{class:'fd-map'},h('iframe',{src:'https://www.google.com/maps?q='+mapQ+'&output=embed',title:'Map to '+name,loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'})):null,
    h('div',{class:'fd-wrap fd-vwrap'},h('div',{class:'fd-vcard'},
      h('h2',null,'Visit'),
      C.hasHours?h('div',{class:'fd-week',role:'list','aria-label':'Weekly hours'},DAYS.map((day,i)=>{ const [o,c]=short(C.hours[i]); return h('div',{class:'fd-day'+(i===todayIx()?' today':'')+(/appoint/i.test(String(C.hours[i]||''))?' appt':''),role:'listitem'},h('small',null,SHORT[i]),h('b',null,o),c?h('span',null,c):null); })):null,
      h('div',{class:'fd-vrow'},
        h('p',{class:'fd-addr'},C.addr?h('b',null,C.addr):null,C.city?h('span',null,C.city):null),
        h('div',{class:'fd-cta'},C.maps?h('a',{class:'fd-btn red',href:C.maps,target:'_blank',rel:'noopener'},ico('pin',16,''),'Directions'):null,C.tel?h('a',{class:'fd-btn line',href:C.tel},ico('phone',16,''),C.phoneTxt):null)),
      C.x.note?h('p',{class:'fd-note'},String(C.x.note)):null,
      socials(C))));

  const foot=h('footer',{class:'fd-foot'},h('div',{class:'fd-wrap fd-foot-in'},fdMark(C,'sm'),h('span',null,h('b',null,name),[C.addr,C.city].filter(Boolean).length?' · '+[C.addr,C.city].filter(Boolean).join(', '):''),socials(C)),
    h('div',{class:'fd-wrap fd-legal'},h('span',null,'© '+new Date().getFullYear()+' '+name),h('span',null,'Site by Riverbend Web Co.')));
  return h('div',{class:'demo fd on'},nav,hero,brands,about,services,gal,band,faqEl,visit,foot);
}

/* ===================== WELBORN (painting + drywall contractor) ===================== */
const WB_ART={
 drywall:'<svg viewBox="0 0 120 96" stroke="#fff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none"><g fill="rgba(255,255,255,.16)"><path d="M14 70l62-12 30 10-62 12z"/><path d="M14 70v8l30 10v-8M44 80l62-12v8L44 88"/></g><g fill="rgba(255,255,255,.3)"><path d="M14 52l62-12 30 10-62 12z"/><path d="M14 52v8l30 10v-8M44 62l62-12v8L44 70"/></g><g fill="#fff"><path d="M14 34l62-12 30 10-62 12z"/><path d="M14 34v8l30 10v-8M44 44l62-12v8L44 52"/></g></svg>',
 repair:'<svg viewBox="0 0 120 96" stroke="#fff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none"><rect x="8" y="8" width="104" height="80" fill="rgba(255,255,255,.14)"/><path d="M30 8l10 18-12 14 14 16-8 16-6 16"/><rect x="62" y="28" width="38" height="36" fill="#fff" stroke="none"/><path d="M62 28h38v36H62z" stroke-dasharray="5 4"/><path d="M58 76h40l6-8H64z" fill="rgba(255,255,255,.3)"/><path d="M104 68l8-8"/></svg>',
 paint:'<svg viewBox="0 0 120 96" stroke="#fff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none"><rect x="8" y="8" width="104" height="80" fill="rgba(255,255,255,.14)"/><rect x="8" y="44" width="62" height="44" fill="rgba(255,255,255,.4)" stroke="none"/><rect x="26" y="10" width="76" height="24" rx="5" fill="#fff" stroke="none"/><path d="M102 22h8v26H58v10"/><rect x="52" y="56" width="12" height="30" rx="3" fill="#fff" stroke="none"/></svg>',
 shop:'<svg viewBox="0 0 120 96" stroke="#fff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" fill="none"><rect x="12" y="8" width="96" height="16" fill="rgba(255,255,255,.2)"/><path d="M8 26h104l-8 16H16z" fill="#fff" stroke="none"/><path d="M36 26l-4 16M60 26v16M84 26l4 16" stroke="rgba(0,0,0,.35)" stroke-width="3"/><rect x="14" y="46" width="92" height="42" fill="rgba(255,255,255,.12)"/><rect x="22" y="53" width="34" height="35" fill="rgba(255,255,255,.2)"/><rect x="68" y="53" width="28" height="35" fill="#fff" stroke="none"/><circle cx="73" cy="72" r="2" fill="#0B0F14" stroke="none"/></svg>'
};
const WB_ART_ORDER=['drywall','repair','paint','shop'];
const WB_FIND_ICO={
 crack:'<rect x="6" y="6" width="36" height="36"/><path d="M20 6l5 9-6 7 7 8-4 12"/>',
 water:'<path d="M24 6c8 10 12 16 12 22a12 12 0 0 1-24 0c0-6 4-12 12-22z"/><path d="M18 30a6 6 0 0 0 6 6"/>',
 hole:'<rect x="6" y="6" width="36" height="36"/><circle cx="24" cy="24" r="8" stroke-dasharray="4 3"/><path d="M12 38l6-6M36 12l-4 4"/>',
 peel:'<path d="M6 6h24l12 12v24H6z"/><path d="M30 6v12h12"/><path d="M14 30h14M14 37h20"/>',
 color:'<rect x="8" y="8" width="30" height="12" rx="3"/><path d="M38 14h4v12H22v6"/><rect x="19" y="32" width="6" height="12" rx="2"/>',
 walls:'<path d="M6 32l20-5 16 5-20 5z"/><path d="M6 24l20-5 16 5-20 5z"/><path d="M6 16l20-5 16 5-20 5z"/>'
};
const WB_PROBLEMS=[
 {k:'crack',t:'Cracks or seams',svc:'Repairs',why:'Cracks and taped seams are fixed as a drywall repair.'},
 {k:'water',t:'Water stain or damage',svc:'Repairs',why:'Stains and damaged ceilings are a repair job. Customers have had ceilings fixed after water damage, including vaulted ceilings.'},
 {k:'hole',t:'Holes or dents',svc:'Repairs',why:'Holes and dents are patched and finished as a drywall repair.'},
 {k:'peel',t:'Peeling or worn paint',svc:'Interior paint',why:'Peeling or worn paint is an interior painting job.'},
 {k:'color',t:'Fresh coat or new color',svc:'Interior paint',why:'A fresh coat or new color is an interior painting job, including trim and ceilings.'},
 {k:'walls',t:'New walls or a remodel',svc:'Drywall',why:'New walls are hung, taped and finished as drywall work, and can be painted by the same crew.'}
];
const WB_ROOMS=['Living room','Kitchen','Bedroom','Bathroom','Stairs or hallway','Garage or basement','High or vaulted ceiling','Store or office'];
function wbFinder(C,call,fbBtn){
  let prob=null, room=null;
  const intro=[['1','Tap the problem'],['2','Tap the room'],['3','Get your match']];
  const steps=intro.map(([n,t])=>h('li',null,h('b',null,n),h('span',null,t)));
  const stepsEl=h('ol',{class:'wb-fsteps','aria-label':'How it works'},steps);
  const hint=h('p',{class:'wb-fhint','aria-live':'polite'});
  const pBtns=WB_PROBLEMS.map(p=>{ const ic=h('span',{class:'wb-fic','aria-hidden':'true'}); ic.innerHTML='<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">'+WB_FIND_ICO[p.k]+'</svg>';
    const b=h('button',{type:'button',class:'wb-fp','aria-pressed':'false',onclick:()=>{ prob=p; render(); }},ic,h('span',null,p.t)); b._p=p; return b; });
  const rBtns=WB_ROOMS.map(r=>{ const b=h('button',{type:'button',class:'wb-fr','aria-pressed':'false',onclick:()=>{ room=r; render(); }},r); b._r=r; return b; });
  const result=h('div',{class:'wb-fres',hidden:'','aria-live':'polite'});
  const p2=h('div',{class:'wb-fblock'},h('h3',null,h('span',null,'2'),'Which room?'),h('div',{class:'wb-frs'},rBtns));
  function render(){
    pBtns.forEach(b=>{ const on=prob&&b._p===prob; b.classList.toggle('on',!!on); b.setAttribute('aria-pressed',String(!!on)); });
    rBtns.forEach(b=>{ const on=room===b._r; b.classList.toggle('on',on); b.setAttribute('aria-pressed',String(on)); });
    p2.classList.toggle('dim',!prob);
    const stage=!prob?0:!room?1:2;
    steps.forEach((li,i)=>{ li.classList.toggle('now',i===stage); li.classList.toggle('done',i<stage); });
    hint.textContent=stage===0?'Start here: tap the problem that looks most like yours.':stage===1?'Good. Now tap the room it is in.':'Here is your match. Send it to '+(C.x.owner||'Tyler')+' with one tap.';
    if(stage<2){ result.hidden=true; result.replaceChildren(); return; }
    const svc=(room==='Store or office'&&prob.svc!=='Drywall')?prob.svc+' and Commercial':prob.svc;
    const summary='Hi, I found you on your website. Problem: '+prob.t+'. Room: '+room+'. Can I get an estimate? My name is ';
    const copied=h('span',{class:'wb-fcopied',role:'status'});
    const enc=encodeURIComponent(summary);
    const textBtn=C.tel?h('a',{class:'wb-btn blue',href:C.tel.replace(/^tel:/,'sms:')+'?&body='+enc},ico('chat',16,''),'Text '+(C.x.owner||'Tyler')):null;
    const mailBtn=C.email?h('a',{class:'wb-btn line',href:'mailto:'+C.email+'?subject='+encodeURIComponent('Estimate request: '+prob.t)+'&body='+enc},'Email '+(C.x.owner||'Tyler')):null;
    const copy=h('button',{type:'button',class:'wb-fcopy',onclick:()=>{ const done=()=>{ copied.textContent='Copied. Paste it into your message.'; }; try{ navigator.clipboard.writeText(summary).then(done,()=>{ copied.textContent='Copy not available. Please type it in your message.'; }); }catch(e){ copied.textContent='Copy not available. Please type it in your message.'; } }},'Copy my request to paste');
    result.hidden=false;
    result.replaceChildren(
      h('div',{class:'wb-fres-l'},h('span',{class:'wb-tape light'},'Your match'),h('h3',null,svc),h('p',null,h('b',null,'You picked: '),prob.t+' in '+room.toLowerCase()+'.'),h('p',null,prob.why),(room==='Store or office')?h('p',null,'We also do commercial work, including storefronts and offices.'):null,h('p',{class:'wb-ftip'},'Tip: add a photo of the problem when you message. It helps.')),
      h('div',{class:'wb-fres-r'},h('p',{class:'wb-fnext'},'Send it to '+(C.x.owner||'Tyler')),h('p',{class:'wb-fsub'},'Text is the fastest. Your picks are filled in for you.'),
        h('div',{class:'wb-cta'},textBtn,fbBtn('line','Message on Facebook'),mailBtn),
        h('div',{class:'wb-fmore'},copy,h('button',{type:'button',class:'wb-freset',onclick:()=>{ prob=null; room=null; render(); }},'Start over')),copied,
        h('p',{class:'wb-fdemo'},'In the finished site, you can also attach photos here and send straight to '+(C.x.owner||'Tyler')+'.')));
    if(stage===2&&!matchMedia('(prefers-reduced-motion: reduce)').matches) result.scrollIntoView({block:'nearest',behavior:'smooth'});
  }
  const sec=h('section',{class:'wb-sec wb-mist wb-finder',id:'w-finder'},h('div',{class:'wb-wrap'},
    h('div',{class:'wb-sh'},h('span',{class:'wb-tape'},'Fix-it finder'),h('h2',null,'What needs fixing?'),h('p',null,'Answer two quick questions and we will show you the right service. It takes about ten seconds.')),
    stepsEl,hint,
    h('div',{class:'wb-fblock'},h('h3',null,h('span',null,'1'),'What is the problem?'),h('div',{class:'wb-fps'},pBtns)),
    p2,result));
  render();
  return sec;
}
function wbLogo(C,cls){ const u=okUrl(C.x.logoUrl); return u?h('img',{class:'wb-logo '+(cls||''),src:u,alt:C.name||'Logo'}):h('b',{class:'wb-logo-t'},C.name||''); }
function welborn(C){
  const name=C.name||'Welborn Painting & Drywall';
  const A=k=>Array.isArray(C.x[k])?C.x[k]:[];
  const svc=A('svc').filter(s=>s&&s.g&&s.t).slice(0,4).map(s=>({g:String(s.g),d:s.d?String(s.d):'',t:String(s.t).split('|').map(t=>t.trim()).filter(Boolean)}));
  const stats=A('stats').filter(f=>f&&f.k&&f.v).slice(0,4);
  const revs=A('rev').filter(r=>r&&r.t&&r.n).slice(0,3);
  const faq=A('faq').filter(f=>f&&f.q&&f.a).slice(0,8);
  const caps=A('caps').map(t=>typeof t==='string'?t:'');
  const tags=A('tags').map(t=>typeof t==='string'?t:'');
  const own=C.own;
  const heroIx=A('hero').filter(n=>Number.isInteger(n)&&own[n]).slice(0,3);
  const headParts=String(C.x.headline||'Smooth walls.|Clean lines.').split('|');
  const links=[C.x.finder===false?null:['w-finder','Fix-it finder'],svc.length?['w-services','Services']:null,own.length?['w-work','Our work']:null,revs.length?['w-reviews','Reviews']:null,faq.length?['w-faq','FAQ']:null,['w-contact','Contact']].filter(Boolean);
  const call=(cls,label)=>C.tel?h('a',{class:'wb-btn '+cls,href:C.tel},ico('phone',16,''),label||('Call '+C.phoneTxt)):null;
  const fbBtn=(cls,label)=>C.fb?h('a',{class:'wb-btn '+cls,href:C.fb,target:'_blank',rel:'noopener'},ico('i-fb',16,''),label||'Message us on Facebook'):null;

  const top=h('div',{class:'wb-top'},h('div',{class:'wb-wrap wb-top-in'},
    h('span',null,String(C.x.strip||'Licensed and insured · Residential and commercial')),
    C.tel?h('a',{href:C.tel},C.phoneTxt):null));
  const nav=h('header',{class:'wb-nav'},h('div',{class:'wb-wrap wb-nav-in'},
    h('a',{class:'wb-brand',href:'#',onclick:e=>{e.preventDefault();scrollTo('w-top');},'aria-label':name},wbLogo(C,'sm'),(()=>{ const u=okUrl(C.x.logoUrl); const ic=u&&/logo\.png$/.test(u)?u.replace(/logo\.png$/,'icon.png'):''; return ic?h('span',{class:'wb-brand-m'},h('img',{class:'wb-ic',src:ic,alt:''}),h('span',{class:'wb-bn'},h('b',null,'Welborn'),h('i',null,'Painting & Drywall'))):null; })()),
    h('nav',{class:'wb-links'},links.map(([id,l])=>h('button',{type:'button',onclick:()=>scrollTo(id)},l))),
    call('blue sm','Call')),
    h('nav',{class:'wb-mlinks','aria-label':'Sections'},links.map(([id,l])=>h('button',{type:'button',onclick:()=>scrollTo(id)},l))));

  /* hero: headline with a painted stroke, photo collage with a roller wipe */
  const hero=h('section',{class:'wb-hero',id:'w-top'},h('div',{class:'wb-wrap wb-hero-g'},
    h('div',{class:'wb-hero-t'},
      h('span',{class:'wb-tape'},C.cat||'Painting and drywall'),
      h('h1',null,h('span',null,headParts[0]),headParts[1]?[h('br'),h('span',{class:'wb-stroke'},headParts[1])]:null),
      h('p',{class:'wb-lead'},C.tag||''),
      h('div',{class:'wb-cta'},call('blue'),fbBtn('line')),
      stats.length?h('ul',{class:'wb-trust'},stats.slice(0,3).map(s=>h('li',null,h('b',null,String(s.v)),h('span',null,String(s.k))))):null),
    heroIx.length?h('div',{class:'wb-hero-ph','aria-hidden':'true'},
      h('div',{class:'wb-hp wb-hp-a'},bg(h('span'),own[heroIx[0]]),h('i',{class:'wb-roll'})),
      heroIx[1]!=null?h('div',{class:'wb-hp wb-hp-b'},bg(h('span'),own[heroIx[1]])):null,
      heroIx[2]!=null?h('div',{class:'wb-hp wb-hp-c'},bg(h('span'),own[heroIx[2]])):null,
      h('div',{class:'wb-corner'})):null));

  const finder=C.x.finder===false?null:wbFinder(C,call,fbBtn);

  /* band */
  const words=A('band').filter(t=>typeof t==='string'&&t).slice(0,9);
  const band=words.length?h('section',{class:'wb-band','aria-hidden':'true'},h('div',{class:'wb-wrap wb-band-in'},words.map((t,i)=>[i?h('i'):null,h('span',null,t)]))):null;

  /* services: paint chip cards */
  const chipCols=['#3981F0','#0B0F14','#6B7A90','#1B5FD6'];
  const services=svc.length?h('section',{class:'wb-sec wb-mist',id:'w-services'},h('div',{class:'wb-wrap'},
    h('div',{class:'wb-sh'},h('span',{class:'wb-tape'},'What we do'),h('h2',null,C.x.svcTitle?String(C.x.svcTitle):'Pick your finish'),C.x.svcSub?h('p',null,String(C.x.svcSub)):null),
    h('div',{class:'wb-chips'},svc.map((s,i)=>h('article',{class:'wb-chip'},
      h('div',{class:'wb-chip-top',style:'background:'+chipCols[i%chipCols.length]},(()=>{ const a=h('span',{class:'wb-art','aria-hidden':'true'}); a.innerHTML=WB_ART[WB_ART_ORDER[i%4]]; return a; })(),h('b',null,String(i+1).padStart(2,'0')),h('h3',null,s.g)),
      h('div',{class:'wb-chip-body'},s.d?h('p',null,s.d):null,h('ul',null,s.t.map(t=>h('li',null,t))),C.tel?h('a',{class:'wb-chip-call',href:C.tel},'Call for an estimate'):null)))))):null;

  /* work: gallery that slides on its own */
  let work=null;
  if(own.length){
    const all=own.slice(0,12).map((u,i)=>i);
    const ordered=all.filter(i=>!heroIx.includes(i)).concat(all.filter(i=>heroIx.includes(i)));
    const list=ordered.map(i=>own[i]), gcaps=ordered.map(i=>caps[i]||''), gtags=ordered.map(i=>tags[i]||'');
    const n=list.length, EX=3;
    const slide=(i,clone)=>h('figure',{class:'wb-slide','aria-hidden':clone?'true':null},
      h('button',{type:'button',tabindex:clone?'-1':null,'aria-label':'Open photo '+(i+1)+(gcaps[i]?': '+gcaps[i]:''),onclick:()=>bzLightbox(list,gcaps,i)},bg(h('span',{class:'wb-ph'}),list[i])),
      (gtags[i]||gcaps[i])?h('figcaption',null,gtags[i]?h('em',null,gtags[i]):null,gcaps[i]?h('b',null,gcaps[i]):null):null);
    const track=h('div',{class:'wb-track'});
    for(let i=0;i<n;i++) track.append(slide(i,false));
    for(let i=0;i<EX;i++) track.append(slide(i%n,true));
    const view=h('div',{class:'wb-view',tabindex:'0','aria-label':'Photo slider'},track);
    const cnt=h('span',{class:'wb-cnt'});
    const dots=h('div',{class:'wb-dots'},list.map((u,i)=>h('button',{type:'button','aria-label':'Show photo '+(i+1),onclick:()=>{ go(i); user(); }})));
    let idx=0, per=3, paused=matchMedia('(prefers-reduced-motion: reduce)').matches, hold=false, timer=null;
    const place=()=>{ track.style.transform='translateX(-'+(idx*100/(n+EX))+'%)'; const a=((idx%n)+n)%n; cnt.textContent=String(a+1).padStart(2,'0')+' / '+String(n).padStart(2,'0'); [...dots.children].forEach((d,i)=>d.classList.toggle('on',i===a)); };
    const size=()=>{ per=innerWidth<700?1:innerWidth<1060?2:3; track.style.width=((n+EX)*100/per)+'%'; [...track.children].forEach(s=>s.style.flexBasis=(100/(n+EX))+'%'); };
    const anim=on=>{ track.style.transition=on?'transform .8s cubic-bezier(.65,0,.3,1)':'none'; };
    function go(i){ anim(true); idx=i; place(); }
    track.addEventListener('transitionend',e=>{ if(e.target!==track) return; if(idx>=n){ anim(false); idx-=n; place(); void track.offsetWidth; } });
    const next=()=>go(idx+1);
    const prev=()=>{ if(idx<=0){ anim(false); idx=n; place(); void track.offsetWidth; } go(idx-1); };
    const pbtn=h('button',{type:'button',class:'wb-pause','aria-pressed':String(paused)},paused?'Play':'Pause');
    const setPaused=v=>{ paused=v; pbtn.setAttribute('aria-pressed',String(v)); pbtn.textContent=v?'Play':'Pause'; };
    const user=()=>{ if(!paused) restart(); };
    const restart=()=>{ clearInterval(timer); timer=setInterval(()=>{ if(!paused&&!hold&&!document.hidden) next(); },3800); };
    pbtn.addEventListener('click',()=>setPaused(!paused));
    view.addEventListener('mouseenter',()=>{ hold=true; }); view.addEventListener('mouseleave',()=>{ hold=false; });
    view.addEventListener('focusin',()=>{ hold=true; }); view.addEventListener('focusout',()=>{ hold=false; });
    let sx=null; view.addEventListener('touchstart',e=>{ sx=e.touches[0].clientX; hold=true; },{passive:true});
    view.addEventListener('touchend',e=>{ hold=false; if(sx==null) return; const dx=e.changedTouches[0].clientX-sx; sx=null; if(Math.abs(dx)>45){ dx<0?next():prev(); user(); } });
    view.addEventListener('keydown',e=>{ if(e.key==='ArrowRight'){ next(); user(); } else if(e.key==='ArrowLeft'){ prev(); user(); } });
    size(); place(); addEventListener('resize',size); restart();
    work=h('section',{class:'wb-sec wb-ink wb-work',id:'w-work'},
      h('div',{class:'wb-wrap wb-work-h'},
        h('div',null,h('span',{class:'wb-tape'},'Recent jobs'),h('h2',null,C.x.workTitle?String(C.x.workTitle):'Our work'),h('p',{class:'wb-sub'},C.x.workSub?String(C.x.workSub):'Photos from our jobs. They change on their own, or use the arrows. Tap a photo to see it full size.')),
        h('div',{class:'wb-ctl'},cnt,h('button',{type:'button',class:'wb-arw','aria-label':'Previous photo',onclick:()=>{ prev(); user(); }},'‹'),h('button',{type:'button',class:'wb-arw','aria-label':'Next photo',onclick:()=>{ next(); user(); }},'›'),pbtn)),
      h('div',{class:'wb-wrap wb-wide'},view),
      h('div',{class:'wb-wrap'},dots),
      C.fb?h('div',{class:'wb-wrap'},h('div',{class:'wb-follow'},h('b',null,'See more jobs on Facebook'),fbBtn('blue',(C.x.short||'Welborn')+' on Facebook'))):null);
  }

  /* reviews */
  const reviews=revs.length?h('section',{class:'wb-sec',id:'w-reviews'},h('div',{class:'wb-wrap'},
    h('div',{class:'wb-sh'},h('span',{class:'wb-tape'},'Customer reviews'),h('h2',null,C.x.revTitle?String(C.x.revTitle):'What customers say'),C.x.revNote?h('p',null,String(C.x.revNote)):null),
    h('div',{class:'wb-revs'},revs.map(r=>h('figure',{class:'wb-rev'},h('blockquote',null,String(r.t)),h('figcaption',null,h('b',null,String(r.n)),r.w?h('span',null,String(r.w)):null)))))):null;

  /* about + stats */
  const paras=String(C.about||'').split(/\n+/).filter(Boolean);
  const about=h('section',{class:'wb-sec wb-mist wb-about',id:'w-about'},h('div',{class:'wb-wrap wb-ab-g'},
    h('div',null,h('span',{class:'wb-tape'},'About'),h('h2',null,C.x.aboutTitle?String(C.x.aboutTitle):('About '+name)),paras.map(t=>h('p',null,t)),h('div',{class:'wb-cta'},call('blue'),fbBtn('line'))),
    stats.length?h('dl',{class:'wb-facts'},stats.map(f=>h('div',null,h('dd',null,String(f.v)),h('dt',null,String(f.k))))):null));

  /* faq */
  const faqEl=faq.length?h('section',{class:'wb-sec',id:'w-faq'},h('div',{class:'wb-wrap wb-faq-g'},
    h('div',null,h('span',{class:'wb-tape'},'Good to know'),h('h2',null,'Common questions')),
    h('div',{class:'wb-qa'},faq.map((f,i)=>h('details',i===0?{open:''}:null,h('summary',null,String(f.q)),h('p',null,String(f.a))))))):null;

  /* contact */
  const mapQ=encodeURIComponent([C.name,C.addr,C.city].filter(Boolean).join(', '));
  const contact=h('section',{class:'wb-contact',id:'w-contact'},
    h('div',{class:'wb-wrap wb-ct-g'},
      h('div',{class:'wb-ct-card'},
        h('span',{class:'wb-tape light'},'Get an estimate'),
        h('h2',null,C.x.ctTitle?String(C.x.ctTitle):'Tell us about your walls.'),
        h('p',null,C.x.ctText?String(C.x.ctText):'Call or message us about your project.'),
        C.tel?h('a',{class:'wb-phone',href:C.tel},C.phoneTxt):null,
        h('div',{class:'wb-cta'},fbBtn('light'),C.maps?h('a',{class:'wb-btn ghostl',href:C.maps,target:'_blank',rel:'noopener'},ico('pin',16,''),'Map'):null),
        C.x.note?h('p',{class:'wb-note'},String(C.x.note)):null,
        socials(C)),
      (C.city||C.addr)?h('div',{class:'wb-map'},h('iframe',{src:'https://www.google.com/maps?q='+mapQ+'&output=embed',title:'Map of '+(C.city||name),loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'})):null));

  const foot=h('footer',{class:'wb-foot'},h('div',{class:'wb-wrap wb-foot-in'},h('span',{class:'wb-plate'},wbLogo(C,'sm')),h('span',null,[C.cat,C.city].filter(Boolean).join(' · ')),socials(C)),
    h('div',{class:'wb-wrap wb-legalw'},h('div',{class:'wb-legal'},h('span',null,'© '+new Date().getFullYear()+' '+name),h('span',null,'Site by Riverbend Web Co.'))));
  return h('div',{class:'demo wb on'},top,nav,hero,finder,band,services,work,reviews,about,faqEl,contact,foot);
}

/* ===================== BIG BILL'S: chalkboard deli with a sandwich builder ===================== */
const BB_OPT={
  bread:[['Pretzel roll','#8A4B22'],['Croissant','#E2A33B'],['Bagel','#C98F4E'],['Wheat','#A8733A'],['White','#F0D9A6']],
  meat:[['Corned beef','#C45A68'],['Roast beef','#9A3B33'],['Turkey','#E9B9A2'],['Chicken salad','#F3E6B5'],['Veggie','']],
  cheese:[['Swiss','#F6D45E'],['Cheddar','#F0A238'],['Provolone','#FFF0B5'],['No cheese','']],
  tops:[['Lettuce','#5BAE4C'],['Tomato','#E0432F'],['Onion','#B67BC9'],['Pickles','#7FA53A'],['Sauerkraut','#E4EAB8'],['Peppers','#D63A2A']],
  sauce:[['Mustard','#E8B400'],['Mayo','#FFFEF2'],['Horseradish','#EEF1E4'],['Thousand Island','#F08A5D'],['Honey mustard','#E9A81A']],
  heat:[['Toasted'],['Cold']],
  side:[['Homemade chips','#F2C14E'],['Tomato soup','#D2462B'],['Corned beef & cabbage soup','#E9D9A6'],['No side','']],
  drink:[['Coffee','#6B3F1D'],['Latte','#B07844'],['Cold brew','#4A2A14'],['No drink','']]};
const BB_PRICE_DEF={meat:{'Corned beef':9.5,'Roast beef':9.5,'Turkey':9,'Chicken salad':8.75,'Veggie':8},bread:{'Pretzel roll':1,'Croissant':1,'Bagel':.75,'Wheat':0,'White':0},cheese:{'Swiss':.75,'Cheddar':.75,'Provolone':.75,'No cheese':0},tops:{'Lettuce':0,'Tomato':0,'Onion':0,'Pickles':0,'Sauerkraut':.5,'Peppers':.5},sauce:{},heat:{},side:{'Homemade chips':1.75,'Tomato soup':3.5,'Corned beef & cabbage soup':4.25,'No side':0},drink:{'Coffee':2.5,'Latte':4.25,'Cold brew':3.75,'No drink':0}};
let BB_UID=0;
function bbSvg(s,cls,wide){
  const id='bb'+(++BB_UID)+'_', W=300, defs=[]; let y=252, n=0; const out=[];
  const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
  const rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const hx=a=>'#'+a.map(v=>clamp(v).toString(16).padStart(2,'0')).join('');
  const mix=(a,b,t)=>{ const A=rgb(a),B=rgb(b); return hx(A.map((v,i)=>v+(B[i]-v)*t)); };
  const lt=(c,t)=>mix(c,'#ffffff',t), dk=(c,t)=>mix(c,'#000000',t);
  let gi=0;
  const grad=(c,a,b)=>{ const g=id+'g'+(gi++); defs.push('<linearGradient id="'+g+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+lt(c,a==null?.22:a)+'"/><stop offset=".55" stop-color="'+c+'"/><stop offset="1" stop-color="'+dk(c,b==null?.24:b)+'"/></linearGradient>'); return 'url(#'+g+')'; };
  const hgrad=(c)=>{ const g=id+'g'+(gi++); defs.push('<linearGradient id="'+g+'" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="'+dk(c,.18)+'"/><stop offset=".3" stop-color="'+lt(c,.12)+'"/><stop offset=".7" stop-color="'+c+'"/><stop offset="1" stop-color="'+dk(c,.2)+'"/></linearGradient>'); return 'url(#'+g+')'; };
  let rs=7; const rnd=()=>{ rs=(rs*9301+49297)%233280; return rs/233280; };
  const col=(g,nm)=>{ const f=BB_OPT[g].find(o=>o[0]===nm); return f?f[1]:'#999'; };
  const wave=(x0,x1,yy,amp,k,ph,steps)=>{ const P=[]; steps=steps||44; for(let i=0;i<=steps;i++){ const t=i/steps; P.push([x0+(x1-x0)*t,yy+amp*Math.sin(ph+t*Math.PI*2*k)]); } return P; };
  const pts=P=>P.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' L');
  const band=(yy,hh,amp,k,ph,x0,x1)=>{ const T=wave(x0,x1,yy,amp,k,ph), B=wave(x0,x1,yy+hh,amp,k,ph+1.7).reverse(); return {d:'M'+pts(T)+' Q'+(x1+7)+','+(yy+hh/2)+' '+B[0][0]+','+B[0][1]+' L'+pts(B)+' Q'+(x0-7)+','+(yy+hh/2)+' '+T[0][0]+','+T[0][1]+'Z', top:'M'+pts(T), bot:'M'+pts(B.slice().reverse())}; };
  const L=(inner,h2)=>{ out.push('<g class="bbl" style="--i:'+(n++)+'">'+inner+'</g>'); y-=h2; };
  const shine=(top)=>'<path d="'+top+'" fill="none" stroke="#fff" stroke-width="1.6" opacity=".38" stroke-linecap="round"/>';
  const toasted=s.heat==='Toasted';
  const bc0=col('bread',s.bread), bc=toasted?mix(bc0,'#8A4B12',.22):bc0;
  const sliced=(s.bread==='Wheat'||s.bread==='White'), crumb=s.bread==='White'?'#FBF1D6':'#D9B27A';
  /* heel */
  if(sliced){
    const h2=22, yy=y-h2; L('<rect x="44" y="'+yy+'" width="212" height="'+h2+'" rx="7" fill="'+grad(dk(bc,.25),.1,.3)+'"/><rect x="49" y="'+(yy+3)+'" width="202" height="'+(h2-7)+'" rx="4" fill="'+(toasted?mix(crumb,'#B07A2E',.45):crumb)+'"/><g fill="'+dk(crumb,.18)+'" opacity=".35">'+Array.from({length:14},()=>'<circle cx="'+(56+rnd()*188).toFixed(0)+'" cy="'+(yy+5+rnd()*(h2-10)).toFixed(0)+'" r="'+(0.8+rnd()*1.2).toFixed(1)+'"/>').join('')+'</g>',h2);
  } else {
    const h2=30, yy=y-h2; let ex='';
    if(s.bread==='Croissant') ex='<g fill="none" stroke="'+dk(bc,.3)+'" stroke-width="2" opacity=".55">'+[70,100,130,160,190,220].map(x=>'<path d="M'+x+' '+(yy+2)+' q-6 '+(h2/2)+' 4 '+(h2-4)+'"/>').join('')+'</g>';
    L('<path d="M42 '+yy+'h216v'+(h2-16)+'q0 '+16+' -18 16H60q-18 0-18-16z" fill="'+grad(dk(bc,.12),.12,.3)+'"/>'+ex+'<path d="M52 '+(yy+h2-10)+'h196" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".16"/><path d="M42 '+yy+'h216" stroke="'+dk(bc,.35)+'" stroke-width="3" opacity=".5"/>',h2);
  }
  /* spread */
  if(s.sauce){ const c=col('sauce',s.sauce), b=band(y-8,7,1.6,5,.4,38,262); const drips=[62,118,188,236].map((x,i)=>'<path d="M'+x+' '+(y-3)+'q3 '+(7+i%2*5)+' 6 0z" fill="'+grad(c,.1,.15)+'"/>').join('');
    L('<path d="'+b.d+'" fill="'+grad(c,.3,.2)+'"/>'+drips+shine(b.top),6); }
  /* meat */
  if(s.meat==='Veggie'){
    const h2=14, b=band(y-h2,h2,2,6,1,40,260); const av='#8DBE4F';
    let cuc=''; for(let i=0;i<6;i++){ const cx=66+i*34; cuc+='<ellipse cx="'+cx+'" cy="'+(y-h2-3)+'" rx="17" ry="6.5" fill="'+grad('#5E9B3A',.1,.3)+'"/><ellipse cx="'+cx+'" cy="'+(y-h2-4)+'" rx="12" ry="3.6" fill="#CFE6A0" opacity=".8"/>'; }
    L('<path d="'+b.d+'" fill="'+grad(av,.2,.28)+'"/><path d="'+b.top+'" stroke="#3F6B26" stroke-width="2.5" fill="none" opacity=".5"/>'+cuc,h2+4);
  } else if(s.meat==='Chicken salad'){
    const h2=28, yy=y-h2, c=col('meat',s.meat); let bump='<path d="M44 '+y+'Q34 '+(y-h2/2)+' 44 '+(yy+12)+'';
    for(let x=44;x<256;x+=17.6) bump+=' q8.8 -'+(10+rnd()*6).toFixed(0)+' 17.6 0';
    bump+=' Q266 '+(y-h2/2)+' 256 '+y+'z" fill="'+grad(c,.2,.26)+'"/>';
    let chunks=''; for(let i=0;i<34;i++){ const r=rnd(), cx=48+rnd()*204, cy=yy+10+rnd()*(h2-8), t=r<.5?['#FFFBEA',.9]:r<.75?['#D9BF7A',.8]:r<.88?['#8FBF5A',.9]:['#B02A3A',.95]; chunks+=t[0]==='#8FBF5A'?'<rect x="'+cx.toFixed(0)+'" y="'+cy.toFixed(0)+'" width="6" height="3" rx="1" fill="'+t[0]+'" opacity="'+t[1]+'"/>':'<ellipse cx="'+cx.toFixed(0)+'" cy="'+cy.toFixed(0)+'" rx="'+(3+rnd()*3).toFixed(1)+'" ry="'+(2+rnd()*2).toFixed(1)+'" fill="'+t[0]+'" opacity="'+t[1]+'"/>'; }
    L(bump+chunks,h2-4);
  } else {
    const nm=s.meat, c=col('meat',nm), amp=nm==='Turkey'?4:3, k=nm==='Turkey'?4:3, h2=15;
    let g='';
    [[y-h2-8,0.2],[y-h2+2,1.9]].forEach(([yy,ph],i)=>{ const b=band(yy,h2,amp,k,ph,36+i*4,264-i*4); g+='<path d="'+b.d+'" fill="'+grad(i?dk(c,.08):c,.2,.28)+'"/><path d="'+b.d+'" fill="none" stroke="'+dk(c,.4)+'" stroke-width="1.8" opacity=".55"/>'+shine(b.top);
      if(nm==='Corned beef') g+='<g fill="none" stroke="#FFD9DF" stroke-width="1.8" stroke-linecap="round" opacity=".55">'+[0,1,2,3].map(j=>'<path d="M'+(56+j*52+i*20)+' '+(yy+5+j%2*4)+' q12 -5 26 2"/>').join('')+'</g>';
      if(nm==='Roast beef') g+='<path d="M44 '+(yy+h2)+'H256" stroke="#5A2620" stroke-width="3" opacity=".35"/><g fill="#C46A5E" opacity=".35">'+[70,120,180,230].map(x=>'<ellipse cx="'+x+'" cy="'+(yy+6)+'" rx="12" ry="2.5"/>').join('')+'</g>';
      if(nm==='Turkey') g+='<g fill="none" stroke="#fff" stroke-width="1.4" opacity=".4">'+[0,1,2,3,4].map(j=>'<path d="M'+(50+j*44)+' '+(yy+4)+' q8 6 0 11"/>').join('')+'</g>'; });
    L(g,h2+9);
  }
  /* cheese */
  if(s.cheese!=='No cheese'){ const c=col('cheese',s.cheese), h2=8, b=band(y-h2,h2,0.8,2,.6,36,264);
    const m2=toasted?9:0, gg=grad(c,.1,.2);
    const dl='<path d="M36 '+y+'q-1 '+(12+m2)+' 5 '+(16+m2)+' 4-8 8-16z" fill="'+gg+'"/><path d="M264 '+y+'q1 '+(11+m2)+' -5 '+(15+m2)+' -4-8 -8-15z" fill="'+gg+'"/><path d="M142 '+y+'q4 '+(9+m2)+' 10 '+(11+m2)+' 4-6 6-11z" fill="'+gg+'"/>'+(toasted?'<path d="M96 '+y+'q3 '+(10+m2)+' 8 '+(8+m2)+' 3-6 4-8zM204 '+y+'q3 '+(12+m2)+' 8 '+(9+m2)+' 3-6 4-9z" fill="'+gg+'"/>':'');
    let holes=''; if(s.cheese==='Swiss') holes='<g fill="'+dk(c,.28)+'" opacity=".75">'+[[78,4.5],[130,3.5],[190,5],[232,3.5]].map(p=>'<ellipse cx="'+p[0]+'" cy="'+(y-4)+'" rx="'+p[1]+'" ry="'+(p[1]*.8)+'"/>').join('')+'</g>';
    L('<path d="'+b.d+'" fill="'+grad(c,.3,.22)+'"/>'+dl+holes+shine(b.top),h2-1); }
  /* toppings in the order picked */
  s.tops.forEach(t=>{ const c=col('tops',t);
    if(t==='Lettuce'){ const h2=16; const b1=band(y-h2-3,h2,5,7,0,34,266), b2=band(y-h2+2,h2-4,4,6,2.2,38,262);
      L('<path d="'+b1.d+'" fill="'+grad(dk(c,.15),.1,.3)+'"/><path d="'+b2.d+'" fill="'+grad(lt(c,.1),.3,.2)+'"/><g fill="none" stroke="#E8F7C8" stroke-width="1.3" opacity=".55">'+[60,110,160,210].map(x=>'<path d="M'+x+' '+(y-h2+4)+' q5 5 2 10"/>').join('')+'</g>'+shine(b2.top),h2-2);
    } else if(t==='Tomato'){ const h2=13; let g=''; for(let i=0;i<4;i++){ const x=46+i*48+(i%2)*4, yy=y-h2+(i%2?1:-1); g+='<rect x="'+x+'" y="'+yy+'" width="56" height="'+h2+'" rx="6.5" fill="'+grad(c,.18,.3)+'"/><rect x="'+(x+3)+'" y="'+(yy+3)+'" width="50" height="'+(h2-6)+'" rx="3.5" fill="#F26A4F" opacity=".7"/><g fill="#FFE7A8" opacity=".9"><ellipse cx="'+(x+16)+'" cy="'+(yy+h2/2)+'" rx="2.4" ry="1.4"/><ellipse cx="'+(x+30)+'" cy="'+(yy+h2/2+.5)+'" rx="2.4" ry="1.4"/><ellipse cx="'+(x+43)+'" cy="'+(yy+h2/2)+'" rx="2.4" ry="1.4"/></g>'; } L(g,h2);
    } else if(t==='Onion'){ const h2=9; let g='<path d="'+band(y-h2,h2,1,5,0,44,256).d+'" fill="'+grad('#E9D3F0',.3,.2)+'"/>'; g+='<g fill="none" stroke="'+dk(c,.05)+'" stroke-width="1.8" opacity=".85">'+[56,92,128,164,200,232].map((x,i)=>'<path d="M'+x+' '+(y-h2+1)+' q'+(8+i%2*3)+' -'+(7+i%3*2)+' '+(18)+' 2"/>').join('')+'</g>'; L(g,h2-1);
    } else if(t==='Pickles'){ const h2=13; let g=''; for(let i=0;i<7;i++){ const cx=58+i*31, yy=y-h2/2+(i%2?-1:1); g+='<ellipse cx="'+cx+'" cy="'+yy+'" rx="17" ry="'+(h2/2)+'" fill="'+grad('#5B8A22',.05,.3)+'"/><ellipse cx="'+cx+'" cy="'+(yy-.5)+'" rx="13.5" ry="'+(h2/2-2)+'" fill="#B7D366"/><ellipse cx="'+cx+'" cy="'+(yy-.5)+'" rx="7" ry="2" fill="#E6F2B8" opacity=".8"/>'; } L(g,h2-1);
    } else if(t==='Sauerkraut'){ const h2=14, b=band(y-h2,h2,3,6,.8,40,260); let g='<path d="'+b.d+'" fill="'+grad('#DDE59E',.2,.25)+'"/><g fill="none" stroke="#F3F7C8" stroke-width="2" stroke-linecap="round" opacity=".9">'; for(let i=0;i<14;i++){ const x=48+i*15.5; g+='<path d="M'+x+' '+(y-h2+3+(i%3)*3)+' q6 -4 12 1 t10 -1"/>'; } g+='</g><path d="'+b.bot+'" stroke="#A9B35C" stroke-width="1.6" fill="none" opacity=".6"/>'; L(g,h2-2);
    } else if(t==='Peppers'){ const h2=12; let g=''; for(let i=0;i<7;i++){ const x=50+i*30, cc=i%2?'#3F9B3F':'#D63A2A'; g+='<path d="M'+x+' '+(y-1)+'q10 -'+(h2+2)+' 26 0l-7 0q-6 -'+(h2-5)+' -12 0z" fill="'+grad(cc,.2,.3)+'" transform="rotate('+((i%3)-1)*4+' '+(x+13)+' '+y+')"/>'; } L(g,h2-5);
    }
  });
  /* top */
  if(sliced){ const h2=34, yy=y-h2; L('<path d="M44 '+y+'V'+(yy+16)+'q0 -16 20 -16h172q20 0 20 16V'+y+'z" fill="'+grad(dk(bc,.25),.12,.3)+'"/><rect x="50" y="'+(yy+6)+'" width="200" height="'+(h2-9)+'" rx="6" fill="'+(toasted?mix(crumb,'#B07A2E',.45):crumb)+'"/><path d="M60 '+(yy+4)+'q90 -6 180 0" stroke="#fff" stroke-width="3" opacity=".3" fill="none" stroke-linecap="round"/><g fill="'+dk(crumb,.18)+'" opacity=".35">'+Array.from({length:16},()=>'<circle cx="'+(58+rnd()*184).toFixed(0)+'" cy="'+(yy+9+rnd()*(h2-18)).toFixed(0)+'" r="'+(0.8+rnd()*1.2).toFixed(1)+'"/>').join('')+'</g>',h2);
  } else {
    const h2=52, yy=y-h2; let ex='';
    if(s.bread==='Pretzel roll') ex='<g fill="none" stroke="'+lt(bc,.28)+'" stroke-width="3" stroke-linecap="round" opacity=".75"><path d="M105 '+(yy+14)+'l14 16M140 '+(yy+9)+'l14 20M176 '+(yy+14)+'l14 16"/></g><g fill="#fff" opacity=".92">'+Array.from({length:22},()=>{ const px=82+rnd()*136, py=yy+10+rnd()*28; return '<rect x="'+px.toFixed(0)+'" y="'+py.toFixed(0)+'" width="'+(3+rnd()*2).toFixed(1)+'" height="2.2" rx=".8" transform="rotate('+(rnd()*90).toFixed(0)+' '+px.toFixed(0)+' '+py.toFixed(0)+')"/>'; }).join('')+'</g>';
    if(s.bread==='Croissant') ex='<g fill="none" stroke="'+dk(bc,.32)+'" stroke-width="2.2" opacity=".6">'+[72,100,128,156,184,212].map(x=>'<path d="M'+x+' '+(yy+h2-2)+' q-'+(10+(x%3)*2)+' -'+(h2-12)+' '+(x<150?12:-4)+' -'+(h2-6)+'"/>').join('')+'</g><g fill="none" stroke="'+lt(bc,.35)+'" stroke-width="2" opacity=".5">'+[86,114,142,170,198].map(x=>'<path d="M'+x+' '+(yy+h2-3)+' q-8 -'+(h2-16)+' 4 -'+(h2-10)+'"/>').join('')+'</g>';
    if(s.bread==='Bagel') ex='<g fill="#FFF4D2">'+Array.from({length:26},()=>{ const px=84+rnd()*132, py=yy+12+rnd()*26; return '<ellipse cx="'+px.toFixed(0)+'" cy="'+py.toFixed(0)+'" rx="3.2" ry="1.6" transform="rotate('+(rnd()*180).toFixed(0)+' '+px.toFixed(0)+' '+py.toFixed(0)+')"/>'; }).join('')+'</g>';
    const grill=toasted?'<g stroke="#3B1D08" stroke-width="4.5" stroke-linecap="round" opacity=".38"><path d="M92 '+(yy+30)+'l22 -20M122 '+(yy+30)+'l24 -22M154 '+(yy+30)+'l24 -22M186 '+(yy+30)+'l22 -20"/></g>':'';
    L('<path d="M42 '+y+'V'+(yy+30)+'Q42 '+yy+' 150 '+yy+'Q258 '+yy+' 258 '+(yy+30)+'V'+y+'z" fill="'+hgrad(bc)+'"/><path d="M42 '+y+'V'+(yy+30)+'Q42 '+yy+' 150 '+yy+'Q258 '+yy+' 258 '+(yy+30)+'V'+y+'z" fill="'+grad(bc,.2,.3)+'" opacity=".55"/>'+ex+grill+'<path d="M64 '+(yy+20)+'Q100 '+(yy+4)+' 160 '+(yy+4)+'" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".3"/><path d="M42 '+y+'h216" stroke="'+dk(bc,.4)+'" stroke-width="3" opacity=".5"/>',h2);
  }
  const top=y, vb=Math.min(top-52,140), X0=wide?-62:-16, WW=wide?424:332;
  const sh=id+'sh', cl=id+'cl', cr=id+'cr';
  const stackG=out.join('');
  const paper='<g><path d="M6 249L294 249L306 266L-6 266Z" fill="#F3F5F0" opacity=".96"/><path d="M6 249L294 249L306 266L-6 266Z" fill="none" stroke="#C9D1CB" stroke-width="1.4"/><path d="M40 252L34 264M120 252L116 264M200 252L206 264M262 252L270 264" stroke="#D3DAD5" stroke-width="1.2"/><path d="M-6 266L306 266" stroke="#9FA9A3" stroke-width="2" opacity=".5"/></g>';
  let crumbs='<g fill="#B9803F" opacity=".75">'; for(let i=0;i<12;i++){ crumbs+='<ellipse cx="'+(10+rnd()*280).toFixed(0)+'" cy="'+(252+rnd()*11).toFixed(0)+'" rx="'+(1+rnd()*1.6).toFixed(1)+'" ry="'+(0.8+rnd()).toFixed(1)+'"/>'; } crumbs+='</g>';
  const pickle='<g transform="rotate(-5 190 258)"><rect x="150" y="252" width="66" height="12" rx="6" fill="'+grad('#5B8A22',.05,.3)+'"/><rect x="156" y="254" width="54" height="3" rx="1.5" fill="#B7D366" opacity=".8"/><g fill="#9DBB4A">'+[162,172,182,192,202].map((x,i)=>'<circle cx="'+x+'" cy="'+(259+(i%2))+'" r="1.4"/>').join('')+'</g></g>';
  const toothY=top+4;
  const pick='<g transform="rotate(-7 118 '+toothY+')"><rect x="116.8" y="'+(toothY-44)+'" width="2.4" height="58" rx="1.2" fill="#E8C98B" stroke="#B88A3A" stroke-width=".6"/><path d="M119.2 '+(toothY-44)+'h38l-6 6.5 6 6.5h-38z" fill="#F5B800"/><path d="M119.2 '+(toothY-44)+'h7v13h-7z" fill="#D8372B"/><text x="128.5" y="'+(toothY-34)+'" font-family="Arial,sans-serif" font-size="6.6" font-weight="800" fill="#14201A">BILL’S</text></g>';
  let steam=''; if(toasted){ steam='<g class="bbsteam" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round">'+[80,150,214].map((x,i)=>'<path class="bbst" style="animation-delay:'+(i*0.6)+'s" d="M'+x+' '+(top-4)+'c-9 -9 9 -15 0 -26c-8 -9 8 -14 2 -24"/>').join('')+'</g>'; }
  const half=(cp,tr)=>'<g'+(tr?' transform="'+tr+'"':'')+'><g clip-path="url(#'+cp+')">'+stackG+'</g></g>';
  const cut=half(cl,'')+half(cr,'translate(9 0) rotate(1.8 230 252)');
  const clips='<clipPath id="'+cl+'"><path d="M-200 -200H168L136 330H-200Z"/></clipPath><clipPath id="'+cr+'"><path d="M168 -200H500V330H136Z"/></clipPath>';
  const slots=wide?bbDrink(s.drink)+bbSide(s.side):'';
  return '<svg class="'+(cls||'')+'" viewBox="'+X0+' '+vb+' '+WW+' '+(272-vb)+'" role="img" aria-label="Your sandwich" preserveAspectRatio="xMidYMax meet"><defs>'+defs.join('')+clips+'<radialGradient id="'+sh+'"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><ellipse cx="150" cy="262" rx="150" ry="9" fill="url(#'+sh+')"/>'+paper+crumbs+slots+cut+pickle+pick+steam+'</svg>';
}
function bbDrink(k){
  if(!k||k==='No drink') return '';
  const st='<g class="bbsteam" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path class="bbst" d="M-34 196c-6 -7 6 -11 0 -19"/><path class="bbst" style="animation-delay:.5s" d="M-22 196c-6 -7 6 -11 0 -19"/></g>';
  if(k==='Coffee') return '<g transform="translate(-52 0)"><path d="M0 214h44v20a18 18 0 0 1-18 18H18a18 18 0 0 1-18-18z" fill="#fff" stroke="#C9D1CB" stroke-width="1.5"/><path d="M44 222h6a9 9 0 0 1 0 18h-8" fill="none" stroke="#fff" stroke-width="5"/><path d="M4 218h36v7H4z" fill="#3A2312"/><rect x="2" y="238" width="40" height="5" fill="#F5B800" opacity=".9"/></g>'+st.replace(/-34/g,'-30').replace(/-22/g,'-18').replace(/196/g,'210').replace(/177/g,'191');
  if(k==='Latte') return '<g transform="translate(-54 0)"><path d="M0 206h46l-3 40a8 8 0 0 1-8 7H11a8 8 0 0 1-8-7z" fill="#EFE7DA" opacity=".95" stroke="#C9D1CB" stroke-width="1.5"/><path d="M4 210h38l-1.5 14h-35z" fill="#F7F1E6"/><path d="M23 222c-6 -4 -9 -9 -4 -11 3-1 4 1 4 3 0-2 1-4 4-3 5 2 2 7 -4 11z" fill="#7A4A22"/><path d="M5 226h36l-2 18a6 6 0 0 1-6 5H13a6 6 0 0 1-6-5z" fill="#B07844"/></g>';
  return '<g transform="translate(-52 0)"><path d="M2 204h44l-5 46a5 5 0 0 1-5 4H12a5 5 0 0 1-5-4z" fill="#CFE4F2" opacity=".55" stroke="#9FB9CA" stroke-width="1.5"/><path d="M6 216h36l-3 33a4 4 0 0 1-4 3H13a4 4 0 0 1-4-3z" fill="#4A2A14"/><g fill="#EAF6FF" opacity=".75"><rect x="12" y="220" width="9" height="9" rx="2" transform="rotate(12 16 224)"/><rect x="26" y="226" width="10" height="9" rx="2" transform="rotate(-10 30 230)"/><rect x="16" y="236" width="9" height="8" rx="2"/></g><rect x="0" y="200" width="48" height="6" rx="3" fill="#E8EEF2" stroke="#9FB9CA"/><path d="M30 202L36 176" stroke="#D8372B" stroke-width="3" stroke-linecap="round"/></g>';
}
function bbSide(k){
  if(!k||k==='No side') return '';
  if(k==='Homemade chips') return '<g transform="translate(300 0)"><path d="M0 232h60l-8 22H8z" fill="#D8372B"/><path d="M10 232l-4-10M30 232l-2-12M50 232l4-11" stroke="#D8372B" stroke-width="2"/><g stroke="#B9791C" stroke-width="1"><ellipse cx="14" cy="222" rx="13" ry="7" fill="#F2C14E" transform="rotate(-20 14 222)"/><ellipse cx="32" cy="216" rx="14" ry="7" fill="#F5CE66" transform="rotate(12 32 216)"/><ellipse cx="48" cy="223" rx="12" ry="7" fill="#EFB83C" transform="rotate(25 48 223)"/><ellipse cx="26" cy="228" rx="12" ry="6" fill="#F5CE66" transform="rotate(-6 26 228)"/></g><path d="M0 232h60" stroke="#fff" stroke-width="2" opacity=".5"/></g>';
  const tom=k==='Tomato soup'; const broth=tom?'#D2462B':'#E9D9A6';
  return '<g transform="translate(298 0)"><g class="bbsteam" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"><path class="bbst" d="M20 214c-6 -7 6 -11 0 -19"/><path class="bbst" style="animation-delay:.5s" d="M34 214c-6 -7 6 -11 0 -19"/></g><path d="M0 222h64a32 32 0 0 1-32 32A32 32 0 0 1 0 222z" fill="#fff" stroke="#C9D1CB" stroke-width="1.5"/><ellipse cx="32" cy="222" rx="30" ry="6" fill="'+broth+'"/>'+(tom?'<path d="M20 221q12 -4 24 0" stroke="#FFD9C8" stroke-width="2" fill="none" opacity=".8"/>':'<g><rect x="16" y="219" width="6" height="4" rx="1.5" fill="#C45A68"/><rect x="30" y="221" width="6" height="4" rx="1.5" fill="#C45A68"/><rect x="40" y="219" width="7" height="3" rx="1.5" fill="#8FBF5A"/></g>')+'<rect x="6" y="238" width="52" height="4" fill="#F5B800" opacity=".9"/></g>';
}
function bbShade(c,t){ const v=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)); const k=t>0?255:0, a=Math.abs(t); return '#'+v.map(x=>Math.round(x+(k-x)*a).toString(16).padStart(2,'0')).join(''); }
function bbIcon(g,n){
  const o=(BB_OPT[g].find(q=>q[0]===n)||[])[1]||'#999', D=t=>bbShade(o,-t), Lg=t=>bbShade(o,t);
  const wrap=b=>'<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">'+b+'</svg>';
  const hl=(d,w)=>'<path d="'+d+'" fill="none" stroke="#fff" stroke-width="'+(w||3)+'" stroke-linecap="round" opacity=".4"/>';
  if(g==='side'){
    if(n==='Homemade chips') return wrap('<path d="M8 36h48l-6 20H14z" fill="#D8372B"/><path d="M8 36h48" stroke="#fff" stroke-width="3" opacity=".6"/><g stroke="#B9791C" stroke-width="1.2"><ellipse cx="20" cy="30" rx="12" ry="7" fill="#F2C14E" transform="rotate(-20 20 30)"/><ellipse cx="38" cy="24" rx="13" ry="7" fill="#F7D069" transform="rotate(14 38 24)"/><ellipse cx="46" cy="33" rx="11" ry="6.5" fill="#EFB83C" transform="rotate(25 46 33)"/><ellipse cx="30" cy="36" rx="12" ry="6" fill="#F7D069"/></g>');
    if(n==='No side') return wrap('<circle cx="32" cy="32" r="20" fill="none" stroke="#9AA8A0" stroke-width="4"/><path d="M18 46L46 18" stroke="#9AA8A0" stroke-width="4" stroke-linecap="round"/>');
    const tom=n==='Tomato soup', br=tom?'#D2462B':'#E9D9A6';
    return wrap('<g fill="none" stroke="#9AA8A0" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M24 16c-5 -6 5 -9 0 -14"/><path d="M38 16c-5 -6 5 -9 0 -14"/></g><path d="M6 28h52a26 26 0 0 1-26 26A26 26 0 0 1 6 28z" fill="#fff" stroke="#C9D1CB" stroke-width="2"/><ellipse cx="32" cy="28" rx="26" ry="6" fill="'+br+'"/>'+(tom?'<path d="M18 27q14 -5 28 0" stroke="#FFD9C8" stroke-width="2.4" fill="none"/>':'<rect x="16" y="25" width="7" height="5" rx="2" fill="#C45A68"/><rect x="30" y="27" width="7" height="4" rx="2" fill="#C45A68"/><rect x="42" y="25" width="8" height="4" rx="2" fill="#8FBF5A"/>')+'<rect x="10" y="40" width="44" height="4" fill="#F5B800"/>');
  }
  if(g==='drink'){
    if(n==='No drink') return wrap('<circle cx="32" cy="32" r="20" fill="none" stroke="#9AA8A0" stroke-width="4"/><path d="M18 46L46 18" stroke="#9AA8A0" stroke-width="4" stroke-linecap="round"/>');
    if(n==='Coffee') return wrap('<g fill="none" stroke="#9AA8A0" stroke-width="3" stroke-linecap="round" opacity=".8"><path d="M22 14c-5 -6 5 -9 0 -13"/><path d="M34 14c-5 -6 5 -9 0 -13"/></g><path d="M8 22h38v18a16 16 0 0 1-16 16H24A16 16 0 0 1 8 40z" fill="#fff" stroke="#C9D1CB" stroke-width="2"/><path d="M46 28h5a8 8 0 0 1 0 16h-7" fill="none" stroke="#fff" stroke-width="5"/><path d="M46 28h5a8 8 0 0 1 0 16h-7" fill="none" stroke="#C9D1CB" stroke-width="1.4"/><path d="M11 26h32v6H11z" fill="#3A2312"/><rect x="9" y="46" width="36" height="4" fill="#F5B800"/>');
    if(n==='Latte') return wrap('<path d="M8 14h40l-4 36a8 8 0 0 1-8 7H20a8 8 0 0 1-8-7z" fill="#EFE7DA" stroke="#C9D1CB" stroke-width="2"/><path d="M12 18h32l-2 12H14z" fill="#F7F1E6"/><path d="M28 28c-7 -4 -10 -9 -5 -11 3-1 5 1 5 3 0-2 2-4 5-3 5 2 2 7 -5 11z" fill="#7A4A22"/><path d="M13 32h30l-2 18a6 6 0 0 1-6 5H21a6 6 0 0 1-6-5z" fill="#B07844"/><path d="M48 22h4a7 7 0 0 1 0 14h-5" fill="none" stroke="#EFE7DA" stroke-width="4"/>');
    return wrap('<path d="M32 4L40 34" stroke="#D8372B" stroke-width="3.4" stroke-linecap="round"/><path d="M12 22h36l-5 34a4 4 0 0 1-4 3H21a4 4 0 0 1-4-3z" fill="#CFE4F2" opacity=".7" stroke="#9FB9CA" stroke-width="2"/><path d="M15 30h30l-3 25H18z" fill="#4A2A14"/><g fill="#EAF6FF" opacity=".8"><rect x="19" y="34" width="10" height="10" rx="2" transform="rotate(12 24 39)"/><rect x="31" y="40" width="11" height="10" rx="2" transform="rotate(-10 36 45)"/></g><rect x="10" y="18" width="40" height="6" rx="3" fill="#E8EEF2" stroke="#9FB9CA" stroke-width="1.6"/>');
  }
  if(g==='bread'){
    if(n==='Pretzel roll') return wrap('<path d="M7 46V34Q7 13 32 13Q57 13 57 34V46Q57 52 51 52H13Q7 52 7 46Z" fill="'+o+'"/><path d="M7 44h50" stroke="'+D(.35)+'" stroke-width="3" opacity=".5"/>'+hl('M14 32Q22 20 36 19',4)+'<g fill="#fff">'+[[24,28],[34,24],[43,30],[30,34],[46,38],[20,38]].map(p=>'<rect x="'+p[0]+'" y="'+p[1]+'" width="4" height="2.4" rx="1" transform="rotate('+(p[0]*7%90)+' '+p[0]+' '+p[1]+')"/>').join('')+'</g>');
    if(n==='Croissant') return wrap('<path d="M4 42Q6 18 32 14Q58 18 60 42Q52 32 46 40Q39 28 32 38Q25 28 18 40Q12 32 4 42Z" fill="'+o+'"/><g fill="none" stroke="'+D(.32)+'" stroke-width="2" opacity=".7"><path d="M18 40Q18 26 24 18"/><path d="M26 36Q26 24 29 16"/><path d="M38 36Q38 24 35 16"/><path d="M46 40Q46 26 40 18"/></g>'+hl('M10 34Q14 24 24 19',3));
    if(n==='Bagel') return wrap('<path fill-rule="evenodd" d="M32 8a24 24 0 1 0 .01 0ZM32 24a8 8 0 1 1-.01 0Z" fill="'+o+'"/><circle cx="32" cy="32" r="8" fill="none" stroke="'+D(.3)+'" stroke-width="2" opacity=".6"/>'+hl('M14 24Q20 14 32 12',3)+'<g fill="#FFF4D2">'+[[16,34],[20,46],[44,46],[48,32],[40,14],[22,18],[30,52],[50,40]].map(p=>'<ellipse cx="'+p[0]+'" cy="'+p[1]+'" rx="2.8" ry="1.4" transform="rotate('+(p[0]*11%180)+' '+p[0]+' '+p[1]+')"/>').join('')+'</g>');
    const crumb=n==='White'?'#FBF1D6':'#D9B27A';
    return wrap('<path d="M10 56V28Q4 26 6 16Q8 6 22 6H42Q56 6 58 16Q60 26 54 28V56Z" fill="'+D(.28)+'"/><path d="M15 52V27Q11 25 12 18Q14 11 23 11H41Q50 11 52 18Q53 25 49 27V52Z" fill="'+crumb+'"/><g fill="'+bbShade(crumb,-.2)+'" opacity=".4"><circle cx="26" cy="22" r="1.2"/><circle cx="38" cy="30" r="1.3"/><circle cx="30" cy="40" r="1.2"/><circle cx="42" cy="44" r="1"/><circle cx="22" cy="36" r="1"/></g>');
  }
  if(g==='meat'){
    if(n==='Chicken salad') return wrap('<path d="M6 48Q4 32 18 28Q20 14 34 18Q50 14 52 30Q62 36 58 48Z" fill="'+o+'"/><path d="M6 48h52" stroke="'+D(.3)+'" stroke-width="3" opacity=".4"/><g>'+[[18,38,'#fff'],[28,30,'#D9BF7A'],[38,40,'#fff'],[46,34,'#B02A3A'],[24,44,'#B02A3A'],[34,26,'#8FBF5A'],[48,44,'#D9BF7A'],[14,44,'#8FBF5A']].map(p=>'<ellipse cx="'+p[0]+'" cy="'+p[1]+'" rx="4" ry="2.6" fill="'+p[2]+'" opacity=".92"/>').join('')+'</g>');
    if(n==='Veggie') return wrap('<path d="M32 6C48 12 54 30 46 46Q40 58 32 58Q24 58 18 46C10 30 16 12 32 6Z" fill="#3F6B26"/><path d="M32 11C44 16 48 30 42 43Q38 53 32 53Q26 53 22 43C16 30 20 16 32 11Z" fill="#B7D366"/><circle cx="32" cy="40" r="9" fill="#7A4A22"/><circle cx="29" cy="37" r="2.6" fill="#fff" opacity=".35"/>');
    const fat=n==='Corned beef'?'<g fill="none" stroke="#FFD9DF" stroke-width="2" stroke-linecap="round" opacity=".7"><path d="M14 30q6 -4 12 0"/><path d="M30 38q8 -5 14 0"/><path d="M40 28q5 -3 10 0"/></g>':n==='Turkey'?'<g fill="none" stroke="#fff" stroke-width="1.8" opacity=".5"><path d="M18 26q5 6 0 14"/><path d="M34 24q5 6 0 16"/><path d="M48 26q5 6 0 14"/></g>':'<path d="M8 42Q18 52 30 44T58 42" fill="none" stroke="'+D(.45)+'" stroke-width="3" opacity=".45"/>';
    return wrap('<path d="M5 28Q15 14 27 26T49 26T60 24V42Q50 56 38 44T16 44T5 44Z" fill="'+o+'"/><path d="M5 28Q15 14 27 26T49 26T60 24V42Q50 56 38 44T16 44T5 44Z" fill="none" stroke="'+D(.4)+'" stroke-width="2" opacity=".6"/>'+fat+hl('M10 28Q16 20 25 27',2.5));
  }
  if(g==='cheese'){
    if(n==='No cheese') return wrap('<circle cx="32" cy="32" r="20" fill="none" stroke="#9AA8A0" stroke-width="4"/><path d="M18 46L46 18" stroke="#9AA8A0" stroke-width="4" stroke-linecap="round"/>');
    const holes=n==='Swiss'?'<g fill="'+D(.28)+'" opacity=".75"><ellipse cx="24" cy="26" rx="4.5" ry="3.6"/><ellipse cx="40" cy="36" rx="3.5" ry="3"/><ellipse cx="26" cy="42" rx="2.6" ry="2.2"/></g>':'';
    return wrap('<path d="M8 20L52 14L58 40L14 50Z" fill="'+o+'"/><path d="M8 20L52 14L58 40L14 50Z" fill="none" stroke="'+D(.3)+'" stroke-width="2"/><path d="M52 14L58 40L46 36Z" fill="'+D(.16)+'" opacity=".7"/>'+holes+hl('M12 22L50 17',2.5));
  }
  if(g==='tops'){
    if(n==='Lettuce') return wrap('<path d="M8 40Q4 30 12 24Q10 14 22 14Q28 6 38 12Q52 10 52 24Q62 30 54 40Q58 52 44 52Q34 60 24 52Q10 54 8 40Z" fill="'+o+'"/><path d="M32 52Q30 34 34 18M32 40Q22 34 18 28M32 34Q42 28 46 22" fill="none" stroke="#E8F7C8" stroke-width="2.2" stroke-linecap="round" opacity=".75"/>');
    if(n==='Tomato') return wrap('<circle cx="32" cy="32" r="24" fill="'+D(.12)+'"/><circle cx="32" cy="32" r="20" fill="'+bbShade(o,.2)+'"/><circle cx="32" cy="32" r="5" fill="#F9C9B8"/><g fill="#FFE7A8">'+[[22,24],[42,24],[22,42],[42,42],[32,17],[32,47]].map(p=>'<ellipse cx="'+p[0]+'" cy="'+p[1]+'" rx="4" ry="2.6"/>').join('')+'</g>'+hl('M16 24Q20 14 30 11',3));
    if(n==='Onion') return wrap('<ellipse cx="32" cy="32" rx="24" ry="22" fill="#E9D3F0" stroke="'+o+'" stroke-width="3"/><ellipse cx="32" cy="32" rx="17" ry="15" fill="none" stroke="'+o+'" stroke-width="2.6"/><ellipse cx="32" cy="32" rx="10" ry="8" fill="none" stroke="'+o+'" stroke-width="2.4"/><ellipse cx="32" cy="32" rx="3.4" ry="2.4" fill="'+o+'"/>');
    if(n==='Pickles') return wrap('<circle cx="32" cy="32" r="24" fill="#4F7A1E"/><circle cx="32" cy="32" r="19" fill="#B7D366"/><circle cx="32" cy="32" r="9" fill="#DDEBA6"/><g fill="#FFF8C9">'+[[32,24],[24,34],[40,34],[32,41],[27,28],[38,28]].map(p=>'<ellipse cx="'+p[0]+'" cy="'+p[1]+'" rx="2" ry="1.3"/>').join('')+'</g>');
    if(n==='Sauerkraut') return wrap('<g fill="none" stroke-linecap="round"><path d="M8 20Q20 10 30 20T56 18" stroke="#E4EAB8" stroke-width="6"/><path d="M6 32Q18 22 30 32T58 30" stroke="#D3DB9A" stroke-width="6"/><path d="M8 44Q20 34 32 44T56 42" stroke="#E4EAB8" stroke-width="6"/><path d="M12 54Q24 46 34 54T54 52" stroke="#C9D186" stroke-width="5"/></g>');
    return wrap('<circle cx="32" cy="32" r="22" fill="none" stroke="#D63A2A" stroke-width="9"/><circle cx="32" cy="32" r="22" fill="none" stroke="#fff" stroke-width="2" opacity=".25" stroke-dasharray="30 120"/><circle cx="32" cy="32" r="9" fill="none" stroke="#3F9B3F" stroke-width="5"/>');
  }
  if(g==='sauce'){
    return wrap('<path d="M25 26h14l4 8v20Q43 58 39 58H25Q21 58 21 54V34Z" fill="'+o+'" stroke="'+D(.35)+'" stroke-width="2"/><path d="M28 26V14l2-6h4l2 6v12" fill="'+D(.2)+'" stroke="'+D(.45)+'" stroke-width="2" stroke-linejoin="round"/><rect x="24" y="36" width="16" height="12" rx="2" fill="#fff" opacity=".55"/>'+hl('M25 38v12',2.5));
  }
  if(n==='Toasted') return wrap('<path d="M32 4C36 16 50 22 50 38A18 18 0 0 1 14 38C14 30 20 26 22 18C26 22 28 24 28 28C32 22 32 12 32 4Z" fill="#F5792A"/><path d="M32 30C34 36 42 38 42 46A10 10 0 0 1 22 46C22 42 26 40 28 36C30 38 30 38 30 40C32 38 32 34 32 30Z" fill="#FFC93B"/>');
  return wrap('<g stroke="#5AA9E6" stroke-width="4" stroke-linecap="round" fill="none"><path d="M32 6V58M9.5 19L54.5 45M9.5 45L54.5 19"/><path d="M26 10l6 5 6-5M26 54l6-5 6 5M8 25l8 1-2 8M56 39l-8-1 2-8M8 39l8-1-2-8M56 25l-8 1 2 8" stroke-width="3"/></g>');
}
function bbStatus(C){
  try{
    const f=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
    const g=t=>(f.find(p=>p.type===t)||{}).value;
    const di={Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6}[g('weekday')]; const now=(+g('hour')%24)*60+(+g('minute'));
    const DN=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    const rx=/(\d{1,2})(?::(\d\d))?\s*(am|pm)\s*(?:-|–|to)\s*(\d{1,2})(?::(\d\d))?\s*(am|pm)/i;
    const par=s=>{ const m=rx.exec(s||''); if(!m) return null; const cv=(h2,mi,ap)=>((+h2%12)+(/pm/i.test(ap)?12:0))*60+(+mi||0); return [cv(m[1],m[2],m[3]),cv(m[4],m[5],m[6])]; };
    const fm=t=>{ const h2=Math.floor(t/60), m=t%60, ap=h2>=12?'pm':'am', hh=h2%12||12; return hh+(m?':'+String(m).padStart(2,'0'):'')+' '+ap; };
    const td=par(C.hours[di]);
    if(td&&now>=td[0]&&now<td[1]) return {open:true,text:'Open now',sub:'until '+fm(td[1])+(now<11*60?' · breakfast served until 11 am':'')};
    if(td&&now<td[0]) return {open:false,text:'Opens today',sub:'at '+fm(td[0])};
    for(let k=1;k<=7;k++){ const d=(di+k)%7, t=par(C.hours[d]); if(t) return {open:false,text:'Closed now',sub:'opens '+(k===1?'tomorrow':DN[d])+' at '+fm(t[0])}; }
  }catch(e){}
  return null;
}
function bbCup(K){
  const sc={Small:.86,Medium:1,Large:1.14}[K.size]||1, iced=K.served==='Iced';
  const base=K.drink==='Cold brew'?'#2B170A':'#3A2312';
  const milky=K.milk!=='No milk'; const liq=K.drink==='Latte'?(milky?'#B07844':base):(milky?'#7A4A22':base);
  const fl={Vanilla:'#F6E7B4',Caramel:'#C98A2B',Hazelnut:'#8A5A2B'}[K.flavor];
  let o='<svg viewBox="0 -14 220 244" class="bb-cupsvg" role="img" aria-label="Your coffee"><ellipse cx="110" cy="214" rx="78" ry="8" fill="#000" opacity=".3"/><g transform="translate(110 214) scale('+sc+') translate(-110 -214)">';
  if(iced){
    o+='<path d="M66 40h88l-9 164a8 8 0 0 1-8 7H83a8 8 0 0 1-8-7z" fill="#CFE4F2" opacity=".5" stroke="#9FB9CA" stroke-width="3"/><path d="M71 78h78l-7 126a6 6 0 0 1-6 5H84a6 6 0 0 1-6-5z" fill="'+liq+'"/>'+
      '<g fill="#EAF6FF" opacity=".78"><rect x="84" y="84" width="26" height="24" rx="5" transform="rotate(10 97 96)"/><rect x="112" y="98" width="28" height="24" rx="5" transform="rotate(-8 126 110)"/><rect x="88" y="124" width="24" height="22" rx="5" transform="rotate(6 100 135)"/></g>'+(fl?'<path d="M72 80q20 10 38 0t38 0" stroke="'+fl+'" stroke-width="6" fill="none" stroke-linecap="round" opacity=".9"/>':'')+
      '<rect x="60" y="30" width="100" height="14" rx="7" fill="#E8EEF2" stroke="#9FB9CA" stroke-width="2.4"/><path d="M118 34L136 -2" stroke="#D8372B" stroke-width="7" stroke-linecap="round"/><path d="M84 56l4 70" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".4"/>';
  } else {
    o+='<g class="bbsteam" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"><path class="bbst" d="M84 62c-9 -10 9 -17 0 -28"/><path class="bbst" style="animation-delay:.5s" d="M112 58c-9 -10 9 -17 0 -28"/><path class="bbst" style="animation-delay:1s" d="M140 62c-9 -10 9 -17 0 -28"/></g>'+
      '<path d="M56 84h100v52a46 46 0 0 1-46 46h-8a46 46 0 0 1-46-46z" fill="#fff" stroke="#C9D1CB" stroke-width="3"/><path d="M156 100h12a22 22 0 0 1 0 44h-18" fill="none" stroke="#fff" stroke-width="12"/><path d="M156 100h12a22 22 0 0 1 0 44h-18" fill="none" stroke="#C9D1CB" stroke-width="3"/>'+
      '<ellipse cx="106" cy="88" rx="46" ry="9" fill="'+liq+'"/>'+(K.drink==='Latte'&&milky?'<path d="M106 92c-14 -8 -20 -16 -9 -19 6 -2 9 2 9 6 0 -4 3 -8 9 -6 11 3 5 11 -9 19z" fill="#F7F1E6"/>':'')+(fl?'<path d="M70 88q18 -9 36 0t36 0" stroke="'+fl+'" stroke-width="5" fill="none" stroke-linecap="round"/>':'')+
      '<rect x="58" y="150" width="96" height="9" fill="#F5B800" opacity=".95"/>';
  }
  return o+'</g></svg>';
}
function bigbill(C){
  const name=C.name||"Big Bill's Sandwich Shop and Coffee Bar";
  const A=k=>Array.isArray(C.x[k])?C.x[k]:[];
  const facts=A('facts').filter(f=>f&&f.k&&f.v).slice(0,4);
  const menu=A('menu').filter(m=>m&&m.g&&m.t).slice(0,6).map(m=>({g:String(m.g),n:m.n?String(m.n):'',t:String(m.t).split('|').map(t=>t.trim()).filter(Boolean)}));
  const why=A('why').filter(w=>w&&w.k&&w.t).slice(0,4);
  const heads=String(C.x.headline||'Big sandwiches.|Real coffee.').split('|');
  const call=(cls,label)=>C.tel?h('a',{class:'bb-btn '+cls,href:C.tel},ico('phone',16,''),label||('Call '+C.phoneTxt)):null;
  const fbBtn=(cls,label)=>C.fb?h('a',{class:'bb-btn '+cls,href:C.fb,target:'_blank',rel:'noopener'},ico('i-fb',16,''),label||'Message on Facebook'):null;
  const links=[['b-build','Build one'],['b-coffee','Coffee'],menu.length?['b-menu','Menu']:null,['b-group','Groups'],['b-visit','Visit']].filter(Boolean);
  const logoU=okUrl(C.x.logoUrl);
  const mark=()=>logoU?h('img',{class:'bb-logo',src:logoU,alt:name}):h('span',{class:'bb-word'},h('b',null,'Big Bill’s'),h('i',null,'Sandwich Shop & Coffee Bar'));
  const top=h('div',{class:'bb-top'},h('div',{class:'bb-wrap bb-top-in'},h('span',null,String(C.x.strip||'Breakfast and lunch in downtown Galena')),C.tel?h('a',{href:C.tel},C.phoneTxt):null));
  const nav=h('header',{class:'bb-nav'},h('div',{class:'bb-wrap bb-nav-in'},
    h('a',{class:'bb-brand',href:'#',onclick:e=>{e.preventDefault();scrollTo('b-top');},'aria-label':name},mark()),
    h('nav',{class:'bb-links'},links.map(([id,l])=>h('button',{type:'button',onclick:()=>scrollTo(id)},l))),
    call('mu sm','Call')),
    h('nav',{class:'bb-mlinks','aria-label':'Sections'},links.map(([id,l])=>h('button',{type:'button',onclick:()=>scrollTo(id)},l))));
  const DEF={bread:'Pretzel roll',meat:'Corned beef',cheese:'Swiss',tops:['Lettuce','Pickles'],sauce:'Mustard',heat:'Toasted'};
  const art=h('div',{class:'bb-heroart','aria-hidden':'true'});
  art.innerHTML=bbSvg(DEF,'bb-stack')+'<svg class="bb-mug" viewBox="0 0 120 120"><path class="bb-steam" d="M40 28c-8 8 8 10 0 20M60 24c-8 8 8 10 0 20M80 28c-8 8 8 10 0 20" fill="none" stroke="#EAF0EC" stroke-width="4" stroke-linecap="round" opacity=".7"/><path d="M24 56h72v28a26 26 0 0 1-26 26H50a26 26 0 0 1-26-26z" fill="#F5B800"/><path d="M96 64h8a14 14 0 0 1 0 28h-10" fill="none" stroke="#F5B800" stroke-width="8"/><rect x="24" y="56" width="72" height="9" fill="#000" opacity=".12"/></svg>';
  const st=bbStatus(C);
  const hero=h('section',{class:'bb-hero',id:'b-top'},h('div',{class:'bb-wrap bb-hero-g'},
    h('div',{class:'bb-hero-t'},
      h('span',{class:'bb-tag'},C.cat||'Sandwich shop and coffee bar'),
      h('h1',null,h('span',null,heads[0]),heads[1]?[h('br'),h('em',null,heads[1])]:null),
      h('p',{class:'bb-lead'},C.tag||''),
      h('div',{class:'bb-cta'},h('button',{type:'button',class:'bb-btn mu',onclick:()=>scrollTo('b-build')},'Build your sandwich'),call('ghost')),
      st?h('p',{class:'bb-open'},h('span',{class:'bb-dot'+(st.open?' on':'')}),h('b',null,st.text),' '+st.sub):(C.today?h('p',{class:'bb-open'},h('b',null,'Open today '),C.today):null)),
    art));
  const band=h('section',{class:'bb-band','aria-hidden':'true'},h('div',{class:'bb-wrap bb-band-in'},A('band').filter(t=>typeof t==='string'&&t).slice(0,8).map((t,i)=>[i?h('i'):null,h('span',null,t)])));

  /* ===== the sandwich station ===== */
  const money=n=>'$'+n.toFixed(2);
  const PR=(()=>{ const o={}; Object.keys(BB_PRICE_DEF).forEach(g=>{ o[g]=Object.assign({},BB_PRICE_DEF[g]); const x=C.x.prices&&typeof C.x.prices==='object'?C.x.prices[g]:null; if(x&&typeof x==='object') Object.keys(x).forEach(k=>{ if(typeof x[k]==='number'&&x[k]>=0&&x[k]<100) o[g][k]=x[k]; }); }); return o; })();
  const pOf=(g,v)=>(PR[g]&&PR[g][v])||0;
  const S={bread:DEF.bread,meat:DEF.meat,cheese:DEF.cheese,tops:DEF.tops.slice(),sauce:DEF.sauce,heat:DEF.heat,side:'No side',drink:'No drink'};
  const STEPS=[['bread','Bread','Pick a bread',false],['meat','Meat','Pick a meat',false],['cheese','Cheese','Add cheese',false],['tops','Toppings','Pile on the toppings',true],['sauce','Spread','Choose a spread',false],['heat','Finish','Toasted or cold?',false],['combo','Combo','Make it a combo',false]];
  let step=0, diet='all', custom='', zoom=false;
  const NONVEG={meat:['Corned beef','Roast beef','Turkey','Chicken salad'],side:['Corned beef & cabbage soup']};
  const NONVEGAN={cheese:['Swiss','Cheddar','Provolone'],sauce:['Mayo','Honey mustard','Thousand Island','Horseradish'],bread:['Croissant'],drink:['Latte'],side:['Tomato soup','Corned beef & cabbage soup'],meat:NONVEG.meat};
  const okD=(g,v)=>diet==='all'||!((NONVEG[g]||[]).includes(v)||(diet==='vegan'&&(NONVEGAN[g]||[]).includes(v)));
  const fix=()=>{ ['bread','meat','cheese','sauce','side','drink'].forEach(g=>{ if(!okD(g,S[g])){ const fb={meat:'Veggie',cheese:'No cheese',side:'No side',drink:'No drink'}[g]; const f=fb||(BB_OPT[g].map(o=>o[0]).find(v=>okD(g,v))||''); S[g]=f; } }); S.tops=S.tops.filter(t=>okD('tops',t)); };
  const lines=()=>{ const L=[[S.meat+' sandwich',pOf('meat',S.meat)]]; if(pOf('bread',S.bread)) L.push([S.bread,pOf('bread',S.bread)]); if(S.cheese!=='No cheese'&&pOf('cheese',S.cheese)) L.push([S.cheese+' cheese',pOf('cheese',S.cheese)]); S.tops.forEach(t=>{ if(pOf('tops',t)) L.push([t,pOf('tops',t)]); }); if(S.side!=='No side') L.push([S.side,pOf('side',S.side)]); if(S.drink!=='No drink') L.push([S.drink,pOf('drink',S.drink)]); return L; };
  const total=()=>lines().reduce((a,l)=>a+l[1],0);
  const tag=(g,v)=>{ const p=pOf(g,v); if(g==='meat') return money(p); if(g==='sauce'||g==='heat') return 'Free'; if(v==='No side'||v==='No drink') return 'No charge'; return p?(g==='side'||g==='drink'?money(p):'+'+money(p)):'Free'; };
  const phrase=()=>{ const b=S.bread.toLowerCase(); const parts=[S.meat+' on '+(/roll|bagel|croissant/.test(b)?'a '+b:b)];
    if(S.cheese!=='No cheese') parts.push(S.cheese.toLowerCase()); S.tops.forEach(t=>parts.push(t.toLowerCase())); if(S.sauce) parts.push(S.sauce.toLowerCase()); parts.push(S.heat.toLowerCase()); if(S.side!=='No side') parts.push('with '+S.side.toLowerCase()); if(S.drink!=='No drink') parts.push('and a '+S.drink.toLowerCase()); return parts; };
  const auto=()=>'The '+S.meat+' '+(S.bread==='Pretzel roll'?'Pretzel':S.bread==='Croissant'?'Croissant':S.bread==='Bagel'?'Bagel':'Stack');
  const sname=()=>custom||auto();
  const PRESETS=[['reuben','Reuben-style',{bread:'Wheat',meat:'Corned beef',cheese:'Swiss',tops:['Sauerkraut'],sauce:'Thousand Island',heat:'Toasted'}],['roast','Roast and cheddar',{bread:'Pretzel roll',meat:'Roast beef',cheese:'Cheddar',tops:['Onion','Lettuce'],sauce:'Horseradish',heat:'Toasted'}],['chicken','Chicken salad croissant',{bread:'Croissant',meat:'Chicken salad',cheese:'Provolone',tops:['Lettuce','Tomato'],sauce:'Mayo',heat:'Cold'}],['garden','Garden veggie',{bread:'Bagel',meat:'Veggie',cheese:'Provolone',tops:['Lettuce','Tomato','Onion','Peppers','Pickles'],sauce:'Honey mustard',heat:'Cold'}]];
  const applyP=o=>{ Object.assign(S,o); S.tops=o.tops.slice(); custom=''; nameIn.value=''; fix(); draw(); };
  const rand=a=>a[Math.floor(Math.random()*a.length)];
  const surprise=()=>{ const pk=g=>rand(BB_OPT[g].map(o=>o[0]).filter(v=>okD(g,v))); S.bread=pk('bread'); S.meat=pk('meat'); S.cheese=pk('cheese'); S.sauce=pk('sauce'); S.heat=rand(['Toasted','Cold']); const t=BB_OPT.tops.map(o=>o[0]).filter(v=>okD('tops',v)).sort(()=>Math.random()-.5); S.tops=t.slice(0,2+Math.floor(Math.random()*3)); custom=''; nameIn.value=''; draw(); };
  /* saved sandwiches */
  const validS=s=>s&&typeof s==='object'&&['bread','meat','cheese','sauce','heat','side','drink'].every(g=>BB_OPT[g].some(o=>o[0]===s[g]))&&Array.isArray(s.tops);
  let saved=[]; try{ saved=JSON.parse(localStorage.getItem('bbSaved')||'[]').filter(v=>v&&typeof v.n==='string'&&validS(v.s)).slice(0,5); }catch(e){ saved=[]; }
  const persist=()=>{ try{ localStorage.setItem('bbSaved',JSON.stringify(saved)); }catch(e){} };
  const notice=h('span',{class:'bb-copied',role:'status'});
  const savedRow=h('div',{class:'bb-saved'});
  const renderSaved=()=>{ savedRow.replaceChildren(...(saved.length?[h('b',null,'My saved sandwiches')].concat(saved.map((v,i)=>h('span',{class:'bb-sv'},h('button',{type:'button',onclick:()=>{ Object.assign(S,v.s); S.tops=v.s.tops.filter(t=>BB_OPT.tops.some(o=>o[0]===t)); custom=v.n; nameIn.value=v.n; draw(); }},v.n),h('button',{type:'button','aria-label':'Delete '+v.n,class:'x',onclick:()=>{ saved.splice(i,1); persist(); renderSaved(); }},'×')))):[])); };
  /* persistent stage pieces */
  const mini=h('div',{class:'bb-mini','aria-hidden':'true'});
  const tabs=h('ol',{class:'bb-tabs'}), panel=h('div',{class:'bb-panel'}), navb=h('div',{class:'bb-bnav'});
  const stage=h('aside',{class:'bb-stage'});
  const artBox=h('div',{class:'bb-art',role:'button',tabindex:'0','aria-label':'Zoom in or out on your sandwich',onclick:()=>{ zoom=!zoom; plate.classList.toggle('zoom',zoom); },onkeydown:e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); zoom=!zoom; plate.classList.toggle('zoom',zoom); } }});
  const plate=h('div',{class:'bb-plate'},artBox,h('div',{class:'bb-cutb','aria-hidden':'true'}));
  const nameH=h('h3'); const nameIn=h('input',{class:'bb-nm',type:'text',maxlength:'28',placeholder:'Name your sandwich','aria-label':'Name your sandwich',oninput:e=>{ custom=e.target.value.trim(); nameH.textContent=sname(); mini.children[1]&&(mini.children[1].textContent=sname()); }});
  const chipsUl=h('ul',{class:'bb-tk-l'}), priceBox=h('div',{class:'bb-price'});
  const summary=()=>"Hi, I'd like to order a "+sname()+": "+phrase().join(', ')+". Estimated "+money(total())+" before tax. My name is ";
  const flash=t=>{ notice.textContent=t; };
  const copyText=(t,ok)=>{ try{ navigator.clipboard.writeText(t).then(()=>flash(ok),()=>flash('Copy not available here.')); }catch(e){ flash('Copy not available here.'); } };
  const actions=h('div',{class:'bb-tk-a'},call('mu','Call it in'),fbBtn('line','Message us'),
    h('div',{class:'bb-tk-s'},
      h('button',{type:'button',class:'bb-copy',onclick:()=>copyText(summary(),'Copied. Paste it into your message.')},'Copy my order'),
      h('button',{type:'button',class:'bb-copy',onclick:()=>{ saved.unshift({n:sname(),s:JSON.parse(JSON.stringify(S))}); saved=saved.slice(0,5); persist(); renderSaved(); flash('Saved on this device.'); }},'Save for next time'),
      h('button',{type:'button',class:'bb-copy',onclick:()=>{ const t='I built “'+sname()+'” at '+name+': '+phrase().join(', ')+' ('+money(total())+' est.)'; if(navigator.share){ navigator.share({title:sname(),text:t,url:location.href}).catch(()=>{}); } else copyText(t+' '+location.href,'Copied. Paste it to share.'); }},'Share it')));
  stage.append(h('div',{class:'bb-st-h'},h('span',null,'Your sandwich'),h('i',null,'Sample')),plate,h('span',{class:'bb-zh'},'Tap the sandwich to zoom'),nameH,nameIn,chipsUl,priceBox,actions,notice,savedRow,
    h('p',{class:'bb-fine'},'Sample builder with sample prices, before tax. Real menu prices and ingredients are set with the owner. Ask the shop about allergens. In the finished site, this sends your order straight to the counter.'));
  const pick=(g,v,multi)=>{ if(multi){ const i=S.tops.indexOf(v); if(i>=0) S.tops.splice(i,1); else S.tops.push(v); } else S[g]=v; if(!multi&&custom==='') nameIn.value=''; draw(); };
  const tile=(g,o,multi)=>{ const on=multi?S.tops.includes(o[0]):S[g]===o[0], dis=!okD(g,o[0]);
    const t=h('button',{type:'button',class:'bb-tile'+(on?' on':'')+(dis?' off':''),role:multi?'checkbox':'radio','aria-checked':String(on),'aria-disabled':dis?'true':null,disabled:dis?'':null,onclick:()=>pick(g,o[0],multi)},h('span',{class:'bb-ti'}),h('b',null,o[0]),h('em',{class:'bb-tp'},dis?(diet==='vegan'?'Not vegan':'Not vegetarian'):tag(g,o[0])),h('i',{class:'bb-ck','aria-hidden':'true'},'✓'));
    t.firstChild.innerHTML=bbIcon(g,o[0]); return t; };
  const dietBar=h('div',{class:'bb-diet',role:'group','aria-label':'Diet filter'},h('span',null,'Show'),...[['all','Everything'],['veg','Vegetarian'],['vegan','Vegan']].map(([k,l])=>h('button',{type:'button','data-d':k,onclick:()=>{ diet=k; fix(); draw(); }},l)));
  const presetBar=h('div',{class:'bb-presets'},h('span',null,'Try one'),...PRESETS.map(p=>h('button',{type:'button',onclick:()=>applyP(p[2])},p[1])),h('button',{type:'button',class:'sur',onclick:surprise},'Surprise me'));
  const drawBench=()=>{
    dietBar.querySelectorAll('button').forEach(b=>{ const k=b.dataset.d==='veg'?'veg':b.dataset.d; b.classList.toggle('on',k===diet); b.setAttribute('aria-pressed',String(k===diet)); });
    tabs.replaceChildren(...STEPS.map((s,i)=>h('li',null,h('button',{type:'button',class:(i===step?'on ':'')+(i<step?'done':''),'aria-current':i===step?'step':null,onclick:()=>{ step=i; drawBench(); }},h('span',null,i<step?'✓':String(i+1)),s[1]))));
    const [g,,title,multi]=STEPS[step];
    if(g==='combo') panel.replaceChildren(h('h3',null,title,h('small',null,'optional')),h('h4',null,'Add a side'),h('div',{class:'bb-tiles',role:'radiogroup','aria-label':'Side'},BB_OPT.side.map(o=>tile('side',o,false))),h('h4',null,'Add a drink'),h('div',{class:'bb-tiles',role:'radiogroup','aria-label':'Drink'},BB_OPT.drink.map(o=>tile('drink',o,false))));
    else panel.replaceChildren(h('h3',null,title,multi?h('small',null,'pick as many as you like'):null),h('div',{class:'bb-tiles',role:multi?'group':'radiogroup','aria-label':title},BB_OPT[g].map(o=>tile(g,o,multi))));
    navb.replaceChildren(
      step>0?h('button',{type:'button',class:'bb-btn line dark',onclick:()=>{ step--; drawBench(); }},'Back'):h('span'),
      step<STEPS.length-1?h('button',{type:'button',class:'bb-btn mu',onclick:()=>{ step++; drawBench(); }},'Next: '+STEPS[step+1][1]):h('button',{type:'button',class:'bb-btn mu',onclick:()=>{ stage.scrollIntoView({behavior:'smooth',block:'center'}); }},'See my ticket'));
  };
  const draw=()=>{
    artBox.innerHTML=bbSvg(S,'bb-live',true); plate.classList.toggle('zoom',zoom);
    nameH.textContent=sname();
    chipsUl.replaceChildren(...phrase().map(t=>h('li',null,t.charAt(0).toUpperCase()+t.slice(1))));
    priceBox.replaceChildren(h('ul',null,lines().map(l=>h('li',null,h('span',null,l[0]),h('b',null,money(l[1]))))),h('div',{class:'bb-total'},h('span',null,'Your total'),h('b',null,money(total()))));
    mini.innerHTML=bbSvg(S,'bb-minisvg')+'<b></b><em></em>'; mini.children[1].textContent=sname(); mini.children[2].textContent=money(total());
    flash(''); drawBench();
  };
  const dly=C.x.daily&&typeof C.x.daily==='object'&&C.x.daily.name?C.x.daily:null;
  const dP=dly?PRESETS.find(p=>p[0]===dly.preset):null;
  const dailyEl=dly?h('div',{class:'bb-daily'},h('span',{class:'bb-tag'},'Sandwich of the day'),h('div',null,h('b',null,String(dly.name)),dly.text?h('span',null,String(dly.text)):null),dP?h('button',{type:'button',class:'bb-btn mu sm',onclick:()=>{ applyP(dP[2]); stage.scrollIntoView({behavior:'smooth',block:'center'}); }},'Build it'):null):null;
  const build=h('section',{class:'bb-sec bb-build',id:'b-build'},h('div',{class:'bb-wrap'},
    h('div',{class:'bb-sh'},h('span',{class:'bb-tag'},'Build your own'),h('h2',null,C.x.buildTitle?String(C.x.buildTitle):'Stack your own sandwich'),h('p',null,'Pick one step at a time, or grab a favorite below. Your sandwich builds on the board while you choose, then call it in or message it to the shop.')),
    dailyEl,
    h('div',{class:'bb-bg'},h('div',{class:'bb-bench'},mini,presetBar,dietBar,tabs,panel,navb,h('p',{class:'bb-dnote'},'Favorites are our ideas, not the shop’s recipes. Diet filter is a sample; always ask the shop about ingredients.')),stage)));
  renderSaved(); draw();

  /* ===== coffee builder ===== */
  const KP={drink:{'Drip coffee':2.5,'Latte':4.25,'Cold brew':3.75},size:{Small:0,Medium:.5,Large:1},milk:{'No milk':0,'Whole':0,'2%':0,'Oat':.6,'Almond':.6},flavor:{None:0,Vanilla:.5,Caramel:.5,Hazelnut:.5},served:{Hot:0,Iced:0}};
  const K={drink:'Latte',size:'Medium',milk:'Whole',flavor:'None',served:'Hot'};
  const kfix=()=>{ if(K.drink==='Cold brew') K.served='Iced'; };
  const kTotal=()=>Object.keys(KP).reduce((a,g)=>a+(KP[g][K[g]]||0),0);
  const kText=()=>K.size+' '+K.served.toLowerCase()+' '+K.drink.toLowerCase()+(K.milk!=='No milk'?' with '+K.milk.toLowerCase()+' milk':'')+(K.flavor!=='None'?', '+K.flavor.toLowerCase()+' syrup':'');
  const kCupBox=h('div',{class:'bb-cupbox'}), kLines=h('ul',null), kTot=h('div',{class:'bb-total'}), kNote=h('span',{class:'bb-copied',role:'status'});
  const kGroups=h('div',{class:'bb-kg'}), kH=h('h3');
  const kDraw=()=>{ kfix();
    kGroups.replaceChildren(...[['drink','Drink'],['size','Size'],['milk','Milk'],['flavor','Flavor'],['served','Served']].map(([g,t])=>h('div',{class:'bb-kgrp'},h('h4',null,t),h('div',{class:'bb-kchips',role:'radiogroup','aria-label':t},Object.keys(KP[g]).map(v=>{ const dis=g==='served'&&K.drink==='Cold brew'&&v==='Hot'; return h('button',{type:'button',class:'bb-kc'+(K[g]===v?' on':''),role:'radio','aria-checked':String(K[g]===v),disabled:dis?'':null,onclick:()=>{ K[g]=v; kDraw(); }},v,KP[g][v]?h('i',null,' +'+money(KP[g][v])):(g==='drink'?h('i',null,' '+money(KP.drink[v])):null)); })))));
    kCupBox.innerHTML=bbCup(K); kNote.textContent=''; kH.textContent='Your '+K.drink.toLowerCase();
    kLines.replaceChildren(...[[K.size+' '+K.drink,KP.drink[K.drink]+KP.size[K.size]]].concat(K.milk!=='No milk'&&KP.milk[K.milk]?[[K.milk+' milk',KP.milk[K.milk]]]:[]).concat(K.flavor!=='None'?[[K.flavor+' syrup',KP.flavor[K.flavor]]]:[]).map(l=>h('li',null,h('span',null,l[0]),h('b',null,money(l[1])))));
    kTot.replaceChildren(h('span',null,'Your total'),h('b',null,money(kTotal())));
  };
  const coffee=h('section',{class:'bb-sec bb-coffee',id:'b-coffee'},h('div',{class:'bb-wrap'},
    h('div',{class:'bb-sh light'},h('span',{class:'bb-tag'},'Coffee bar'),h('h2',null,'Build your coffee'),h('p',null,'Lattes and cold brew are on the menu. Mix yours, see the price, then show it at the counter.')),
    h('div',{class:'bb-kwrap'},kGroups,h('aside',{class:'bb-kcard'},h('div',{class:'bb-st-h'},h('span',null,'Your coffee'),h('i',null,'Sample')),kCupBox,kH,kLines,kTot,
      h('div',{class:'bb-tk-a'},call('mu','Call it in'),h('button',{type:'button',class:'bb-btn line',onclick:()=>{ try{ navigator.clipboard.writeText("Hi, I'd like a "+kText()+". Estimated "+money(kTotal())+" before tax. My name is ").then(()=>{ kNote.textContent='Copied. Paste it into your message.'; },()=>{ kNote.textContent='Copy not available here.'; }); }catch(e){ kNote.textContent='Copy not available here.'; } }},'Copy my order')),kNote,
      h('p',{class:'bb-fine'},'Sample options and prices. Ask the shop what is on the coffee menu today.')))));
  kDraw();

  /* ===== menu board ===== */
  const board=menu.length?h('section',{class:'bb-sec bb-menu',id:'b-menu'},h('div',{class:'bb-wrap'},
    h('div',{class:'bb-sh light'},h('span',{class:'bb-tag'},'On the board'),h('h2',null,C.x.menuTitle?String(C.x.menuTitle):'What people order'),h('p',null,C.x.menuSub?String(C.x.menuSub):'Favorites customers mention. Ask at the counter for today’s full menu and prices.')),
    h('div',{class:'bb-board'},menu.map(m=>h('article',{class:'bb-col'},h('h3',null,m.g),m.n?h('p',{class:'bb-cn'},m.n):null,h('ul',null,m.t.map(t=>h('li',null,t)))))))):null;

  /* ===== group orders ===== */
  const G={size:'6 to 10',kind:'Box lunches',when:'',notes:''};
  const gSum=()=>"Hi, I'd like to ask about "+G.kind.toLowerCase()+" for "+G.size+" people"+(G.when?' on '+G.when:'')+(G.notes?'. '+G.notes:'')+'. My name is ';
  const gNote=h('span',{class:'bb-copied',role:'status'}), gOut=h('p',{class:'bb-gsum'});
  const gUpd=()=>{ gOut.textContent=gSum(); gNote.textContent=''; };
  const sel=(label,key,opts)=>h('label',{class:'bb-fld'},h('span',null,label),(()=>{ const s=h('select',{onchange:e=>{ G[key]=e.target.value; gUpd(); }},opts.map(o=>h('option',{value:o,selected:o===G[key]?'':null},o))); return s; })());
  const gForm=h('div',{class:'bb-gform'},
    sel('How many people','size',['1 to 5','6 to 10','11 to 20','21 to 40','More than 40']),
    sel('What do you need','kind',['Box lunches','Sandwich platters','Breakfast for a group','Coffee for a crowd','Picnic lunches']),
    h('label',{class:'bb-fld'},h('span',null,'Day you need it'),h('input',{type:'date',onchange:e=>{ G.when=e.target.value; gUpd(); }})),
    h('label',{class:'bb-fld wide'},h('span',null,'Anything else'),h('textarea',{rows:'2',maxlength:'160',placeholder:'Pickup time, allergies, tour group, office lunch',oninput:e=>{ G.notes=e.target.value.trim(); gUpd(); }})));
  const groups=h('section',{class:'bb-sec bb-groups',id:'b-group'},h('div',{class:'bb-wrap'},
    h('div',{class:'bb-sh'},h('span',{class:'bb-tag'},'Groups'),h('h2',null,'Feeding a crowd?'),h('p',null,'Planning a tour group, office lunch, picnic or party? Tell us what you need and the shop will confirm what is possible.')),
    h('div',{class:'bb-gwrap'},gForm,h('aside',{class:'bb-gcard'},h('div',{class:'bb-st-h'},h('span',null,'Your request'),h('i',null,'Sample')),gOut,
      h('div',{class:'bb-tk-a'},call('mu','Call to ask'),fbBtn('line','Message us'),h('button',{type:'button',class:'bb-copy',onclick:()=>{ try{ navigator.clipboard.writeText(gSum()).then(()=>{ gNote.textContent='Copied. Paste it into your message.'; },()=>{ gNote.textContent='Copy not available here.'; }); }catch(e){ gNote.textContent='Copy not available here.'; } }},'Copy my request')),gNote,
      h('p',{class:'bb-fine'},'Group orders are a sample feature. The owner decides what the shop offers. In the finished site, this sends your request straight to the shop.')))));
  gUpd();

  const whyEl=why.length?h('section',{class:'bb-sec',id:'b-why'},h('div',{class:'bb-wrap'},
    h('div',{class:'bb-sh'},h('span',{class:'bb-tag'},'Why Bill’s'),h('h2',null,C.x.whyTitle?String(C.x.whyTitle):'Why people keep coming back'),C.x.whySub?h('p',null,String(C.x.whySub)):null),
    h('div',{class:'bb-why'},why.map((w,i)=>h('article',{class:'bb-wc'},h('b',null,String(i+1).padStart(2,'0')),h('h3',null,String(w.k)),h('p',null,String(w.t))))))):null;
  const stats=facts.length?h('section',{class:'bb-facts'},h('div',{class:'bb-wrap'},h('ul',null,facts.map(f=>h('li',null,h('b',null,String(f.v)),h('span',null,String(f.k))))))):null;
  const addrTxt=[C.addr,C.city].filter(Boolean).join(', ');
  const mapQ=encodeURIComponent([C.name,C.addr,C.city].filter(Boolean).join(', '));
  const gpics=A('gallery').map(g=>g&&okUrl(g.u)?{u:okUrl(g.u),c:String(g.c||'')}:null).filter(Boolean).slice(0,10);
  let gal=null;
  if(gpics.length>1){
    const track=h('div',{class:'bb-gtrack',tabindex:'0','aria-label':'Photos from the shop'}), step=()=>{ const f=track.firstElementChild; return f?f.getBoundingClientRect().width+14:300; };
    const lb=h('div',{class:'bb-lb',role:'dialog','aria-label':'Photo'},h('button',{type:'button',class:'bb-lbx','aria-label':'Close photo'},'Close'),h('img',{alt:''}),h('p',null,''));
    const closeLb=()=>{ lb.classList.remove('on'); };
    lb.addEventListener('click',closeLb); document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeLb(); });
    gpics.forEach(g=>{ const im=h('img',{src:g.u,alt:g.c||'Photo from '+name,loading:'lazy'});
      track.append(h('figure',{class:'bb-gi'},h('button',{type:'button','aria-label':'Enlarge photo: '+(g.c||'photo'),onclick:()=>{ lb.querySelector('img').src=g.u; lb.querySelector('img').alt=g.c||''; lb.querySelector('p').textContent=g.c; lb.classList.add('on'); }},im),g.c?h('figcaption',null,g.c):null)); });
    const go=d=>{ const max=track.scrollWidth-track.clientWidth; if(d>0&&track.scrollLeft>=max-4) track.scrollTo({left:0,behavior:'smooth'}); else if(d<0&&track.scrollLeft<=4) track.scrollTo({left:max,behavior:'smooth'}); else track.scrollBy({left:d*step(),behavior:'smooth'}); };
    let hold=false; const stop=()=>{ hold=true; };
    ['mouseenter','focusin','touchstart','pointerdown'].forEach(ev=>track.addEventListener(ev,stop,{passive:true}));
    if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)){ const tm=setInterval(()=>{ if(!track.isConnected){ clearInterval(tm); return; } if(!hold) go(1); },4200); }
    gal=h('section',{class:'bb-sec bb-gal',id:'b-gallery'},h('div',{class:'bb-wrap'},
      h('div',{class:'bb-gh'},h('div',null,h('span',{class:'bb-tag'},'Around the shop'),h('h2',null,'Fresh out of the kitchen')),
        h('div',{class:'bb-garr'},h('button',{type:'button','aria-label':'Previous photo',onclick:()=>{ stop(); go(-1); }},'\u2039'),h('button',{type:'button','aria-label':'Next photo',onclick:()=>{ stop(); go(1); }},'\u203A'))),
      track),lb);
  }
  const visit=h('section',{class:'bb-sec bb-visit',id:'b-visit'},h('div',{class:'bb-wrap bb-visit-g'},
    h('div',null,h('span',{class:'bb-tag'},'Visit'),h('h2',null,C.x.visitTitle?String(C.x.visitTitle):'Come on in'),
      st?h('p',{class:'bb-open dark'},h('span',{class:'bb-dot'+(st.open?' on':'')}),h('b',null,st.text),' '+st.sub):null,
      C.x.visitText?h('p',null,String(C.x.visitText)):null,
      addrTxt?h('p',{class:'bb-addr'},addrTxt):null,
      C.hasHours?h('div',{class:'bb-hrs'},osHours(C).map(r=>h('div',{class:r.today?'on':null},h('span',null,r.days),h('span',null,r.v)))):null,
      h('div',{class:'bb-cta'},call('mu'),C.maps?h('a',{class:'bb-btn line',href:C.maps,target:'_blank',rel:'noopener'},ico('pin',16,''),'Get directions'):null),
      socials(C)),
    addrTxt?h('div',{class:'bb-map'},h('iframe',{src:'https://www.google.com/maps?q='+mapQ+'&output=embed',title:'Map to '+C.name,loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'})):null));
  const foot=h('footer',{class:'bb-foot'},h('div',{class:'bb-wrap bb-foot-in'},h('b',null,name),addrTxt?h('span',null,addrTxt):null,C.tel?h('a',{href:C.tel},C.phoneTxt):null,h('em',null,'© '+new Date().getFullYear()+' '+name)));
  return h('div',{class:'demo bb on'},top,nav,hero,band,build,coffee,board,gal,groups,stats,whyEl,visit,foot);
}

const DN_ICON={
 gift:'<svg viewBox="0 0 64 64"><rect x="10" y="26" width="44" height="30" rx="3" fill="#fff" stroke="currentColor" stroke-width="3"/><rect x="6" y="18" width="52" height="10" rx="2" fill="#fff" stroke="currentColor" stroke-width="3"/><path d="M32 18v38" stroke="currentColor" stroke-width="5"/><path d="M32 18c-6-10-18-10-14-2 2 4 10 2 14 2zM32 18c6-10 18-10 14-2-2 4-10 2-14 2z" fill="none" stroke="currentColor" stroke-width="3"/><text x="44" y="48" font-size="14" font-weight="800" fill="currentColor" font-family="sans-serif">?</text></svg>',
 gravy:'<svg viewBox="0 0 64 64"><path d="M8 32h40c0 10-8 16-20 16S8 42 8 32z" fill="#fff" stroke="currentColor" stroke-width="3"/><path d="M48 34c6-1 9-5 10-10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M16 52h24" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M14 32c4-4 8 2 12-2s8 2 12-2 6 2 8 0" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M22 22c-2-4 2-6 0-10M30 22c-2-4 2-6 0-10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".6"/></svg>',
 flame:'<svg viewBox="0 0 64 64"><path d="M32 6c4 12 16 16 16 32a16 16 0 0 1-32 0c0-8 4-12 6-16 2 6 4 8 6 8-2-10 2-18 4-24z" fill="#fff" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M32 30c3 6 8 8 8 14a8 8 0 0 1-16 0c0-4 4-8 8-14z" fill="currentColor" opacity=".25"/><path d="M10 58h44" stroke="currentColor" stroke-width="3" stroke-dasharray="6 4"/></svg>',
 swirl:'<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#fff" stroke="currentColor" stroke-width="3"/><path d="M32 32c0-3 4-3 4 0s-4 7-8 6-6-6-4-10 8-7 13-5 8 9 5 14-10 9-16 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M14 22c4-2 6 2 10 0M40 48c4-2 6 2 10 0" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" opacity=".5"/></svg>',
 steam:'<svg viewBox="0 0 64 64"><ellipse cx="32" cy="46" rx="26" ry="8" fill="#fff" stroke="currentColor" stroke-width="3"/><path d="M14 44c4-8 32-8 36 0" fill="currentColor" opacity=".25"/><path d="M22 30c-3-5 3-7 0-12M32 30c-3-5 3-7 0-12M42 30c-3-5 3-7 0-12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>',
 cup:'<svg viewBox="0 0 64 64"><path d="M12 26h34v14a14 14 0 0 1-14 14h-6a14 14 0 0 1-14-14z" fill="#fff" stroke="currentColor" stroke-width="3"/><path d="M46 30h4a6 6 0 0 1 0 12h-4" fill="none" stroke="currentColor" stroke-width="3"/><path d="M22 20c-2-4 2-6 0-10M32 20c-2-4 2-6 0-10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M8 58h44" stroke="currentColor" stroke-width="3"/></svg>',
 potato:'<svg viewBox="0 0 64 64"><path d="M10 40c0-12 14-22 28-20s18 10 16 20-14 14-26 12S10 50 10 40z" fill="#fff" stroke="currentColor" stroke-width="3"/><path d="M18 38l8-4M28 44l10-6M36 32l10-2M20 46l6-2" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>'
};
function dnIcon(k){ const d=h('span',{class:'dn-ico'}); d.innerHTML=DN_ICON[k]||DN_ICON.cup; return d; }
/* counter with chrome stools that spin */
function dnCounter(){
  const n=7, w=760, gap=w/n; let st='';
  for(let i=0;i<n;i++){ const x=gap*i+gap/2; st+='<g class="stool" style="animation-delay:'+(i*.35)+'s"><rect x="'+(x-3)+'" y="150" width="6" height="58" fill="url(#chr)"/><ellipse cx="'+x+'" cy="210" rx="22" ry="6" fill="url(#chr)"/><ellipse cx="'+x+'" cy="146" rx="30" ry="10" fill="#8E1620"/><ellipse cx="'+x+'" cy="141" rx="30" ry="10" fill="#C42633"/><ellipse cx="'+(x-8)+'" cy="138" rx="10" ry="3" fill="#fff" opacity=".35"/><rect x="'+(x-31)+'" y="141" width="62" height="5" fill="url(#chr)"/></g>'; }
  const d=h('div',{class:'dn-counter','aria-hidden':'true'});
  d.innerHTML='<svg viewBox="0 40 760 180" preserveAspectRatio="xMidYMax meet"><defs><linearGradient id="chr" x1="0" x2="1"><stop offset="0" stop-color="#8A9097"/><stop offset=".45" stop-color="#F4F6F8"/><stop offset="1" stop-color="#7B8188"/></linearGradient><pattern id="chk" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#1E1A1A"/><rect x="10" y="10" width="10" height="10" fill="#1E1A1A"/><rect x="10" width="10" height="10" fill="#fff"/><rect y="10" width="10" height="10" fill="#fff"/></pattern></defs><rect x="0" y="40" width="760" height="14" rx="4" fill="url(#chr)"/><rect x="0" y="54" width="760" height="58" fill="#B3202A"/><rect x="0" y="62" width="760" height="4" fill="#fff" opacity=".25"/><rect x="0" y="104" width="760" height="8" fill="url(#chr)"/><rect x="0" y="112" width="760" height="8" fill="url(#chk)"/>'+st+'</svg>';
  return d;
}
function diner(C){
  const G=groups(C.items,'Menu');
  const city=C.city.split(',')[0];
  const openNow=C.today&&!/closed/i.test(C.today);
  const sec=(id,cls,...k)=>h('section',{class:'dn-sec rv '+(cls||''),id},...k);
  const head=(script,title,sub)=>h('div',{class:'dn-head'},h('span',{class:'dn-script'},script),h('h2',null,title),sub?h('p',null,sub):null);

  const name=C.name.replace(/^Dotties\b/,"Dottie's");
  const lk=([id,l])=>h('button',{type:'button',onclick:()=>scrollTo(id)},l);
  const nav=h('header',{class:'dn-nav'},h('div',{class:'dn-nav-in'},
    h('nav',{class:'dn-links l'},[['d-special','Daily Special'],['d-favs','Favorites'],['d-menu','Menu']].map(lk)),
    h('a',{class:'dn-logo',href:'#',onclick:e=>{e.preventDefault();scrollTo('d-top');}},name),
    h('nav',{class:'dn-links r'},[['d-snaps','Snapshots'],['d-revs','Reviews'],['d-visit','Hours']].map(lk)),
    C.tel?h('a',{class:'dn-mcall',href:C.tel,'aria-label':'Call '+C.phoneTxt},ico('phone',18,'')):null),
    h('nav',{class:'dn-mtabs','aria-label':'Sections'},[['d-special','Special'],['d-favs','Favorites'],['d-menu','Menu'],['d-snaps','Photos'],['d-revs','Reviews'],['d-visit','Hours']].map(lk)));

  const bell=h('span',{class:'dn-bellart','aria-hidden':'true'}); bell.innerHTML='<svg viewBox="0 0 120 90"><defs><linearGradient id="bchr" x1="0" x2="1"><stop offset="0" stop-color="#7B8188"/><stop offset=".4" stop-color="#FAFBFC"/><stop offset="1" stop-color="#6E747B"/></linearGradient></defs><rect x="54" y="4" width="12" height="8" rx="3" fill="url(#bchr)"/><rect x="58" y="10" width="4" height="10" fill="#6E747B"/><path d="M18 72a42 42 0 0 1 84 0z" fill="url(#bchr)"/><path d="M34 52c4-12 14-20 26-22" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/><rect x="8" y="72" width="104" height="14" rx="4" fill="#1E1A1A"/><rect x="8" y="72" width="104" height="4" fill="#3A3434"/></svg>';
  const tent=h('button',{type:'button',class:'dn-tent',onclick:()=>scrollTo('d-menu')},h('span',{class:'f'},h('span',{class:'t'},'Menu'),h('span',{class:'s'},'Breakfast and lunch'),h('span',{class:'g'},'Read it ',h('b',null,'→'))));
  const callEl=C.tel?h('a',{class:'dn-bell',href:C.tel},bell,h('span',{class:'dn-bell-t'},h('small',null,'Ring the counter'),h('b',null,C.phoneTxt))):null;
  const sign=h('div',{class:'dn-mini'},h('small',null,openNow?'Open today':'Closed today'),h('b',null,openNow?C.today:'See you Tuesday'),h('span',null,'Hours ↓'));
  sign.addEventListener('click',()=>scrollTo('d-visit'));
  const hero=h('section',{class:'dn-hero',id:'d-top'},
    h('div',{class:'dn-marquee'},
      h('div',{class:'dn-neon'},h('span',null,'Meals'),h('i'),h('span',null,'Lunches')),
      h('h1',null,name),
      h('p',{class:'dn-tag'},C.tag)),
    h('div',{class:'dn-bar'},h('div',{class:'dn-props'},tent,callEl,sign),dnCounter(),
      h('span',{class:'dn-hint'},'Hover a stool, they still spin')),
    h('div',{class:'dn-booth'},
      h('i',{class:'dn-seat l'}),
      h('div',{class:'dn-table'},
        h('div',{class:'dn-window'},bg(h('div',{class:'ph'}),C.storyPic||C.hero),h('span',null,(C.addr||'')+' · '+city)),
        h('div',{class:'dn-booth-t'},h('span',{class:'dn-script'},'Pull up a stool'),
          h('h2',null,'Breakfast and lunch on Central Avenue'),
          h('p',null,C.about.replace(C.tag,'').trim()))),
      h('i',{class:'dn-seat r'})));

  const sp=C.x.special&&typeof C.x.special==='object'?C.x.special:{};
  const special=sec('d-special','dn-board-sec',
    h('div',{class:'dn-board'},h('div',{class:'dn-board-in'},
      h('small',null,'Today at '+name),h('b',null,sp.title||'Daily Special'),
      h('span',null,sp.line1||'Ask your server'),h('span',null,sp.line2||'or check the board'))),
    h('div',{class:'dn-board-t'},head('Stop in and try our','Daily Special'),h('p',null,sp.text||'There is a special on the board every morning.'),
      C.tel?h('a',{class:'dn-btn dn-red',href:C.tel},ico('phone',18,''),'Call for today\'s special'):null));

  const favs=(Array.isArray(C.x.favs)?C.x.favs:[]).filter(f=>f&&f.name).slice(0,6);
  const memphis=h('div',{class:'dn-memphis','aria-hidden':'true'}); memphis.innerHTML='<i class="m1"></i><i class="m2"></i><i class="m3"></i><i class="m4"></i><i class="m5"></i><i class="m6"></i>';
  const favEl=favs.length?sec('d-favs','dn-favs-sec',memphis,head('Order up','House Favorites','The plates regulars come back for.'),
    h('div',{class:'dn-checks'},favs.map((f,ix)=>{ const it=C.items.find(i=>i.name===f.name)||{};
      return h('article',{class:'dn-check'},
        h('div',{class:'dn-check-h'},h('span',null,'Guest check'),h('span',null,'No. '+(1041+ix))),
        h('div',{class:'dn-check-b'},dnIcon(f.icon),h('div',null,h('h3',null,f.name),f.quip?h('em',null,f.quip):null,it.desc?h('p',null,it.desc):null)),
        h('div',{class:'dn-check-f'},h('span',null,'Total'),h('b',null,it.price||'Ask'))); }))):null;

  let menu=null;
  if(C.items.length){
    const page=h('div',{class:'dn-page'});
    const favN=(Array.isArray(C.x.favs)?C.x.favs:[]).map(f=>f&&f.name);
    const show=k=>{ page.replaceChildren(h('div',{class:'dn-page-h'},h('small',null,'Dottie\'s Cafe · '+(G.names.indexOf(k)+1)+' of '+G.names.length),h('h3',null,k)),...G.map[k].map(i=>{ const fav=favN.indexOf(i.name)>=0; return h('div',{class:'dn-mi'+(fav?' hfav':'')},h('div',{class:'r'},h('b',null,i.name,fav?h('em',{class:'dn-star'},'House favorite'):null),h('i'),i.price?h('span',null,i.price):h('span',{class:'ask'},'Ask')),i.desc?h('p',null,i.desc):null); }),h('div',{class:'dn-page-f'},'Bottomless coffee · Breakfast served all day')); };
    const tabs=h('div',{class:'dn-tabs'},G.names.map((k,ix)=>{ const b=h('button',{type:'button',class:ix?null:'on'},k); b.addEventListener('click',()=>{ tabs.querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); show(k); }); return b; }));
    show(G.names[0]);
    menu=sec('d-menu','dn-menu',head('Breakfast and lunch','The Menu','Big portions, old-fashioned prices.'),h('div',{class:'dn-book'},tabs,page));
  }

  const snaps=C.own.length?sec('d-snaps','dn-snaps',head('Around the cafe','Snapshots'),
    h('div',{class:'dn-polas'},C.own.slice(0,12).map((u,ix)=>{ const cap=(C.x.caps||[])[ix]||''; const big=C.x.hd===true?C.own.map(v=>v.replace(/(\.jpe?g)$/i,'-hd$1')):C.own; return h('button',{type:'button',class:'dn-pola',style:'--r:'+([-3,2,-1.5,3,-2.5,1.5,-2,2.5,-1][ix%9])+'deg','aria-label':'Open photo',onclick:()=>gallery(big,'Dottie\'s Cafe',ix)},bg(h('div',{class:'ph'}),u),cap?h('span',null,cap):null); }))):null;

  const story=sec('d-story','dn-story',bg(h('div',{class:'ph'}),C.storyPic||C.own[0]||C.hero),
    h('div',{class:'b'},h('span',{class:'dn-script'},'Our story'),h('h2',null,'A hometown counter on Central Avenue'),h('p',null,C.about),
      C.tel?h('a',{class:'dn-btn dn-red dn-sm',href:C.tel},ico('phone',16,''),C.phoneTxt):null));

  const revs=C.reviews.length?sec('d-revs','dn-revs',head('Overheard at the counter','Reviews',C.reviewsSource||null),
    h('div',{class:'dn-napkins'},C.reviews.slice(0,6).map(r=>h('figure',{class:'dn-napkin'},stars(r.stars||5),h('blockquote',null,'“'+r.text+'”'),h('figcaption',null,r.name)))),
    C.reviewLink?h('div',{class:'dn-acts dn-c'},h('a',{class:'dn-btn dn-line dn-sm',href:C.reviewLink,target:'_blank',rel:'noopener'},'Read more on Google')):null):null;

  const street=(C.addr.match(/\d+\s+(.+)/)||[])[1]||'MAIN ST';
  const visit=sec('d-visit','dn-visit',head('Come on in','Hours and Location'),
    h('div',{class:'dn-vgrid'},
      h('div',{class:'dn-sign'},h('div',{class:'dn-sign-h'},'OPEN'),h('div',{class:'dn-hrs'},DAYS.map((day,i)=>h('div',{class:i===todayIx()?'today':null},h('span',null,day),h('span',null,C.hours[i]||'Closed'))))),
      h('div',{class:'dn-find'},h('h3',null,name),h('address',null,C.addr,h('br'),C.city),
        (C.x.notes||[]).length?h('ul',null,C.x.notes.slice(0,5).map(t=>h('li',null,t))):null,
        h('div',{class:'dn-acts'},C.tel?h('a',{class:'dn-btn dn-red dn-sm',href:C.tel},ico('phone',16,''),C.phoneTxt):null,C.maps?h('a',{class:'dn-btn dn-line dn-sm',href:C.maps,target:'_blank',rel:'noopener'},ico('map',16,''),'Directions'):null)),
      h('div',{class:'dn-map wx-map'},mapBox(street.toUpperCase().slice(0,22),C.maps))));

  const foot=h('footer',{class:'dn-foot'},h('i',{class:'dn-checker'}),h('div',{class:'in'},h('b',null,name),
    h('span',null,'© '+new Date().getFullYear()+' '+name+' · '+[C.addr,C.city].filter(Boolean).join(', ')),h('span',null,'Site by Riverbend Web Co.')));
  return h('div',{class:'demo western on dn'},nav,hero,special,favEl,menu,snaps,revs,visit,foot);
}
/* Hero review card: best review first, gently rotates through the top three */
function heroReview(C){
  const top=C.reviews.slice(0,3); let i=0;
  const q=h('blockquote',null,'“'+short(top[0].text,150)+'”'), who=h('span',null,top[0].name);
  const card=h('div',{class:'wx-hrev'},h('div',{class:'row'},stars(5),h('small',null,'Guest reviews')),q,h('div',{class:'row'},who,h('button',{type:'button',onclick:()=>scrollTo('w-reviews')},'Read more reviews')));
  if(top.length>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(()=>{ i=(i+1)%top.length; card.classList.add('fade'); setTimeout(()=>{ q.textContent='“'+short(top[i].text,150)+'”'; who.textContent=top[i].name; card.classList.remove('fade'); },350); },7000);
  return card;
}
/* Simple photo viewer for a special's pictures */
function gallery(list,title,start){
  let i=start||0; const im=h('img',{alt:title,src:list[i]});
  const go=d=>{ i=(i+d+list.length)%list.length; im.src=list[i]; cnt.textContent=(i+1)+' / '+list.length; };
  const cnt=h('span',null,(i+1)+' / '+list.length);
  const close=()=>{ box.remove(); document.removeEventListener('keydown',key); };
  const key=e=>{ if(e.key==='Escape') close(); if(e.key==='ArrowRight') go(1); if(e.key==='ArrowLeft') go(-1); };
  const box=h('div',{class:'wx-lb'+(document.querySelector('.dn')?' wx-lb-big':''),role:'dialog','aria-label':title,onclick:e=>{ if(e.target===box) close(); }},
    h('div',{class:'in'},h('div',{class:'bar'},h('b',null,title),cnt,h('button',{type:'button','aria-label':'Close',onclick:close},'Close')),im,
      list.length>1?h('div',{class:'nav'},h('button',{type:'button',onclick:()=>go(-1)},'Previous'),h('button',{type:'button',onclick:()=>go(1)},'Next')):null));
  document.addEventListener('keydown',key); document.body.append(box);
}
/* Text with a small chili icon after the word "spicy" */
const CHILI='<svg class="wx-heat" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 3.5c.6 1.2.4 2.4-.4 3.3 2.7.5 4.4 2.6 4.1 5.6-.5 5-5.7 8.6-12.7 8.6-.9 0-1.3-1-.6-1.6 3.3-2.6 4.4-5.2 4.9-8.2.3-2 1.6-3.4 3.4-3.9-.2-.9-.6-1.7-1.3-2.3" fill="currentColor"/><path d="M14 6.8c.6-.9 1.6-1.4 2.7-1.3" fill="none" stroke="#3F6212" stroke-width="2" stroke-linecap="round"/></svg>';
function heat(text){
  const parts=String(text||'').split(/(spicy\s+\S+?)(?=[\s,.;:!]|$)/i);
  if(parts.length<2) return text;
  const out=[]; parts.forEach((p,ix)=>{ if(!p) return; if(ix%2){ const w=h('span',{class:'wx-spicy',title:'Spicy'},p); const i=document.createElement('span'); i.innerHTML=CHILI; w.append(i.firstChild); out.push(w); } else out.push(p); });
  return out;
}
function rgba(hx,a){ const n=parseInt(hx.slice(1),16); return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')'; }

/* ===================== OSTERIA (fine Italian: candlelit, wine and gold, plating intro) ===================== */
function osSvg(markup,cls){ const d=h('div',{class:cls,'aria-hidden':'true'}); d.innerHTML=markup; return d; }
const OS_SPRIG_OLD='<svg viewBox="0 0 120 24"><path d="M2 12h116" stroke="currentColor" stroke-width="1"/><g fill="currentColor"><ellipse cx="30" cy="7" rx="7" ry="2.6" transform="rotate(-25 30 7)"/><ellipse cx="44" cy="17" rx="7" ry="2.6" transform="rotate(25 44 17)"/><ellipse cx="58" cy="7" rx="7" ry="2.6" transform="rotate(-25 58 7)"/><ellipse cx="72" cy="17" rx="7" ry="2.6" transform="rotate(25 72 17)"/><ellipse cx="86" cy="7" rx="7" ry="2.6" transform="rotate(-25 86 7)"/><circle cx="98" cy="13" r="3"/></g></svg>';
const OS_INTRO_PHOTO='1645112411341-6c4fd023714a'; /* real fettuccine Alfredo (Unsplash) */
const OS_SPRIG='<svg viewBox="0 0 120 8"><path d="M0 4h50M70 4h50" stroke="currentColor" stroke-width="1"/><rect x="56" y="0" width="8" height="8" transform="rotate(45 60 4)" fill="none" stroke="currentColor" stroke-width="1"/></svg>';
const OS_ICO={
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h3l1.5 4.5-2 1.2a11 11 0 0 0 6.8 6.8l1.2-2L20 16v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
};
function osIco(k){ const d=h('span',{class:'os-ico','aria-hidden':'true'}); d.innerHTML=OS_ICO[k]; return d; }
function osHours(C){
  const S=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], out=[]; let i=0;
  while(i<7){ const v=(C.hours[i]||'').trim()||'Closed'; let j=i; while(j+1<7&&((C.hours[j+1]||'').trim()||'Closed')===v) j++;
    out.push({days:i===j?S[i]:(j===i+1?S[i]+' & '+S[j]:S[i]+' to '+S[j]),v,today:todayIx()>=i&&todayIx()<=j}); i=j+1; }
  return out;
}
function osIntro(C){
  try{ if(sessionStorage.getItem('osIntro_'+C.name)) return; }catch(e){}
  if(matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const pic=C.x&&typeof C.x.introPhoto==='string'&&/^https:\/\//.test(C.x.introPhoto)?C.x.introPhoto:U(OS_INTRO_PHOTO).replace('w=1400','w=2000');
  const photo=h('div',{class:'os-intro-pic'}); photo.style.backgroundImage=cssUrl(pic);
  const box=h('div',{class:'os-intro',role:'presentation'},photo,
    h('div',{class:'os-steam2','aria-hidden':'true'},h('i'),h('i'),h('i')),
    h('div',{class:'os-intro-txt'},h('span',{class:'os-eyebrow'},'Benvenuti'),h('b',null,C.name||''),osSvg(OS_SPRIG,'os-sprig')));
  const done=()=>{ if(!box.isConnected||box.classList.contains('out')) return; box.classList.add('out'); document.documentElement.classList.remove('os-lock'); setTimeout(()=>box.remove(),300); try{ sessionStorage.setItem('osIntro_'+C.name,'1'); }catch(e){} };
  box.addEventListener('click',done);
  document.documentElement.classList.add('os-lock');
  document.body.append(box);
  const img=new Image(); let started=false;
  const go=()=>{ if(started) return; started=true; box.classList.add('go'); setTimeout(done,1500); };
  img.onload=go; img.onerror=()=>done(); img.src=pic;
  setTimeout(()=>{ if(!started) done(); },1800); /* slow connection: skip straight to the site */
}
function osteria(C){
  const G=groups(C.items,'Menu');
  const nav=h('header',{class:'os-nav'},h('div',{class:'os-nav-in'},
    C.logo?h('img',{src:C.logo,alt:C.name,class:'os-logo'}):h('span',{class:'os-brand'},C.name),
    h('nav',{class:'os-links'},C.items.length?jump('os-menu','Menu'):null,C.own.length>1?jump('os-gallery','Gallery'):null,jump('os-visit','Visit')),
    jump('os-reserve','Reserve a Table','os-btn gold sm')));
  const city=C.city.split(',')[0];
  const hero=bg(h('section',{class:'os-hero'},h('div',{class:'os-hero-in'},
    h('span',{class:'os-eyebrow'},[C.cat||'Italian Kitchen',city].filter(Boolean).join(' · ')),
    h('h1',null,C.name),
    C.tag?h('p',{class:'os-tag'},C.tag):null,
    osSvg(OS_SPRIG,'os-sprig'),
    h('div',{class:'os-cta'},jump('os-reserve','Reserve a Table','os-btn gold'),C.items.length?jump('os-menu','View the Menu','os-btn ghost'):null),
    C.today?h('p',{class:'os-today'},'Open today · '+C.today):null)),
    C.hero,'linear-gradient(180deg,rgba(31,22,17,.4) 0%,rgba(31,22,17,.55) 55%,rgba(31,22,17,1) 100%),radial-gradient(circle at 50% 35%,rgba(201,163,91,.16),rgba(0,0,0,0) 60%)');
  const story=C.about?h('section',{class:'os-sec os-story'},h('div',{class:'os-wrap os-story-in'},
    bg(h('div',{class:'os-story-pic rv'}),C.storyPic||C.pic(1)),
    h('div',{class:'rv'},h('span',{class:'os-eyebrow'},'La Nostra Storia'),h('h2',null,'Welcome to the table'),
      h('p',{class:'os-about'},C.about),C.phoneTxt?h('a',{class:'os-link',href:C.tel||null},'Call '+C.phoneTxt):null))):null;
  let menu=null;
  if(C.items.length){
    const list=h('div',{class:'os-menu-list'});
    const show=k=>list.replaceChildren(...G.map[k].map(i=>h('div',{class:'os-item'},
      C.itemPic(i)&&i.photo?bg(h('div',{class:'os-item-pic'}),i.photo):null,
      h('div',{class:'os-item-b'},h('div',{class:'os-item-top'},h('b',null,i.name),h('span',{class:'os-dots'}),i.price?h('span',{class:'os-price'},i.price):null),i.desc?h('p',null,i.desc):null))));
    const tabs=G.names.length>1?h('div',{class:'os-tabs',role:'tablist'},G.names.map((k,ix)=>{ const b=h('button',{type:'button',class:ix?null:'on'},k); b.addEventListener('click',()=>{ tabs.querySelectorAll('button').forEach(x=>x.classList.remove('on')); b.classList.add('on'); show(k); }); return b; })):null;
    show(G.names[0]);
    menu=h('section',{class:'os-sec os-menu',id:'os-menu'},h('div',{class:'os-wrap'},
      h('div',{class:'os-head rv'},h('span',{class:'os-eyebrow'},'Il Menu'),h('h2',null,'From our kitchen'),osSvg(OS_SPRIG,'os-sprig')),tabs,list));
  }
  const pics=C.own.length?C.own.slice(0,7):[];
  const gal=pics.length>1?h('section',{class:'os-sec os-gal',id:'os-gallery'},h('div',{class:'os-wrap'},
    h('div',{class:'os-head rv'},h('span',{class:'os-eyebrow'},'La Sala'),h('h2',null,'A look inside')),
    h('div',{class:'os-grid'},pics.map((u,i)=>{ const t=bg(h('button',{type:'button',class:'os-ph g'+i,'aria-label':'Open photo '+(i+1)}),u); t.addEventListener('click',()=>gallery(pics,C.name,i)); return t; })))):null;
  const revs=C.reviews.length?h('section',{class:'os-sec os-revs'},h('div',{class:'os-wrap'},
    h('div',{class:'os-head rv'},h('span',{class:'os-eyebrow'},'Dicono di Noi'),h('h2',null,'What guests say')),
    h('div',{class:'os-rev-grid'},C.reviews.slice(0,3).map(r=>h('figure',{class:'os-rev rv'},h('blockquote',null,'“'+short(r.text,260)+'”'),h('figcaption',null,r.name)))),
    C.reviewsSource?h('p',{class:'os-src'},C.reviewsSource):null)):null;
  const ok=h('div',{class:'os-ok'},h('h3',null,'Grazie! Your request is in.'),h('p',null,'This is a preview. On your live site, reservation requests go straight to your inbox.'));
  const form=bookingForm(C,'os-form',ok,[['Your Name','text','Jane Smith'],['Phone or Email','text','(563) 555-0100'],['Date','date',''],['Guests','text','2']]);
  const reserve=h('section',{class:'os-sec os-reserve',id:'os-reserve'},h('div',{class:'os-wrap os-res-in'},
    h('div',{class:'rv'},h('span',{class:'os-eyebrow'},'Prenota'),h('h2',null,'Reserve your table'),h('p',null,'Date night, family dinner or a celebration. Tell us when and we will have your table ready.'),
      C.phoneTxt?h('a',{class:'os-btn gold',href:C.tel||null},'Or call '+C.phoneTxt):null),
    h('div',{class:'os-card rv'},form,ok)));
  const addrTxt=[C.addr,C.city].filter(Boolean).join(', ');
  const mapQ=encodeURIComponent([C.name,C.addr,C.city].filter(Boolean).join(', '));
  const cards=h('div',{class:'os-info'},
    addrTxt?h('div',{class:'os-info-c rv'},osIco('pin'),h('small',null,'Address'),h('p',null,addrTxt),C.maps?h('a',{class:'os-arrow',href:C.maps,target:'_blank',rel:'noopener'},'Get directions',osIco('arrow')):null):null,
    C.phoneTxt?h('div',{class:'os-info-c rv'},osIco('phone'),h('small',null,'Reservations'),h('p',null,h('a',{href:C.tel||null},C.phoneTxt)),jump('os-reserve',h('span',null,'Book online'),'os-arrow')):null,
    C.hasHours?h('div',{class:'os-info-c rv'},osIco('clock'),h('small',null,'Hours'),h('div',{class:'os-hrs'},osHours(C).map(r=>h('div',{class:r.today?'on':null},h('span',null,r.days),h('span',null,r.v))))):null);
  const map=addrTxt?h('div',{class:'os-map rv'},
    h('iframe',{src:'https://www.google.com/maps?q='+mapQ+'&output=embed',title:'Map to '+C.name,loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'}),
    h('div',{class:'os-map-card'},h('b',null,C.name),h('span',null,addrTxt),C.maps?h('a',{class:'os-btn gold sm',href:C.maps,target:'_blank',rel:'noopener'},'Directions'):null)):null;
  const visit=h('section',{class:'os-sec os-visit',id:'os-visit'},h('div',{class:'os-wrap'},
    h('div',{class:'os-head rv'},h('span',{class:'os-eyebrow'},'Vieni a Trovarci'),h('h2',null,'Visit us')),cards,map));
  const foot=h('footer',{class:'os-foot'},h('div',{class:'os-wrap os-foot-in'},
    h('div',null,h('span',{class:'os-brand'},C.name),addrTxt?h('small',null,addrTxt):null),
    h('nav',{class:'os-foot-nav'},C.items.length?jump('os-menu','Menu'):null,jump('os-reserve','Reservations'),jump('os-visit','Visit')),
    socials(C)),
    h('div',{class:'os-wrap os-foot-b'},h('small',null,'\u00A9 '+new Date().getFullYear()+' '+C.name),C.phoneTxt?h('a',{href:C.tel||null},C.phoneTxt):null));
  return h('div',{class:'demo os'},nav,hero,story,menu,gal,revs,reserve,visit,foot);
}

/* ===================== OSTERIA v2 (fine dining: script wordmark, cream pages, serif type) ===================== */
function o2Bar(pg){
  const bar=pg.querySelector('.o2-bar'), hero=pg.querySelector('.o2-hero');
  if(!bar||!hero||!('IntersectionObserver' in window)) return;
  new IntersectionObserver(es=>es.forEach(e=>bar.classList.toggle('on',!e.isIntersecting)),{rootMargin:'-80px 0px 0px 0px'}).observe(hero);
}
function osteria2(C){
  const city=C.city.split(',')[0];
  const addrTxt=[C.addr,C.city].filter(Boolean).join(', ');
  const mapQ=encodeURIComponent([C.name,C.addr,C.city].filter(Boolean).join(', '));
  const G=groups(C.items,'Menu');
  const pics=C.own.slice();
  const items=[C.items.length?['Food & Drink','Our Menu','o2-menu']:null,pics.length>1?['Take a Look','Gallery','o2-gal']:null,['Find a Table','Reservations','o2-res'],['Come Visit','Location','o2-visit']].filter(Boolean);
  const heroNav=h('nav',{class:'o2-hnav'},items.map(([sc,sub,id])=>jump(id,[h('i',null,sc),h('small',null,sub)])));
  const hero=h('section',{class:'o2-hero'},bg(h('div',{class:'o2-hero-bg'}),C.hero),h('div',{class:'o2-hero-shade'}),heroNav,
    h('div',{class:'o2-hero-c'},h('h1',{class:'o2-mark'},C.name),h('p',{class:'o2-sub'},[C.cat||'Italian Restaurant',city].filter(Boolean).join(' · ')),
      C.today?h('p',{class:'o2-open'},'Open today '+C.today):null));
  const bar=h('header',{class:'o2-bar'},h('div',{class:'o2-bar-in'},jump('o2-top',C.name,'o2-bar-mark'),
    h('nav',{class:'o2-bar-nav'},items.map(([,sub,id])=>jump(id,sub))),jump('o2-res','Reserve','o2-pill')));
  const paras=String(C.about||'').split(/\n\s*\n/).map(t=>t.trim()).filter(Boolean);
  const intro=h('section',{class:'o2-intro',id:'o2-top'},h('div',{class:'o2-w o2-narrow rv'},
    h('h2',null,C.tag||('Welcome to '+C.name+'.')),paras[0]?h('p',{class:'o2-lead'},paras[0]):null,
    C.items.length?jump('o2-menu','Explore the menu','o2-ul'):null));
  const trio=pics.length>=3?h('div',{class:'o2-w o2-trio rv'},[pics[1]||pics[0],pics[0],pics[2]].map((u,i)=>{ const b=bg(h('button',{type:'button',class:'o2-ph t'+i,'aria-label':'Open photo'}),u); b.addEventListener('click',()=>gallery(pics,C.name,0)); return b; })):null;
  const rule=()=>h('div',{class:'o2-w'},h('hr',{class:'o2-rule'}));
  let menu=null;
  if(C.items.length){
    const leads=['Start with','Enjoy','Savor','Share','Save room for','Sip on','Try our'];
    const tabs=h('div',{class:'o2-tabs',role:'tablist'});
    const panel=h('div',{class:'o2-panel',role:'tabpanel'});
    const show=(k,ix)=>{
      const lead=/dessert|dolci|sweet/i.test(k)?'Save room for':/drink|wine|cocktail|bar|beer/i.test(k)?'Sip on':leads[ix%5];
      [...tabs.children].forEach((t,j)=>{ t.classList.toggle('on',j===ix); t.setAttribute('aria-selected',j===ix?'true':'false'); });
      panel.classList.remove('in');
      panel.replaceChildren(h('div',{class:'o2-panel-h'},h('i',null,lead),h('h3',null,k)),
        h('div',{class:'o2-items'},G.map[k].map(i=>h('div',{class:'o2-it'},h('div',{class:'o2-it-top'},h('b',null,i.name),h('span',{class:'o2-dots','aria-hidden':'true'}),i.price?h('span',null,i.price):null),i.desc?h('p',null,i.desc):null))));
      requestAnimationFrame(()=>panel.classList.add('in'));
    };
    G.names.forEach((k,ix)=>{ const t=h('button',{type:'button',role:'tab',class:'o2-tab'},k); t.addEventListener('click',()=>{ show(k,ix); if(tabs.scrollWidth>tabs.clientWidth) t.scrollIntoView({block:'nearest',inline:'center',behavior:'smooth'}); }); tabs.append(t); });
    show(G.names[0],0);
    menu=h('section',{class:'o2-sec',id:'o2-menu'},
      h('div',{class:'o2-w o2-two rv'},h('small',{class:'o2-label'},'Our Menu'),h('p',{class:'o2-big'},paras[1]||('From handmade pasta to the last sweet bite, here is what '+C.name+' is serving.'))),
      h('div',{class:'o2-w o2-menu-box rv'},G.names.length>1?tabs:null,panel));
  }
  const gal=pics.length>1?h('section',{class:'o2-sec o2-gal',id:'o2-gal'},
    h('div',{class:'o2-w o2-two rv'},h('small',{class:'o2-label'},'Gallery'),h('p',{class:'o2-big'},'A look inside '+C.name+'.')),
    h('div',{class:'o2-w o2-grid'},pics.slice(0,6).map((u,i)=>{ const b=bg(h('button',{type:'button',class:'o2-ph g'+i,'aria-label':'Open photo '+(i+1)}),u); b.addEventListener('click',()=>gallery(pics,C.name,i)); return b; }))):null;
  const revs=C.reviews.length?h('section',{class:'o2-sec'},h('div',{class:'o2-w o2-revs'},C.reviews.slice(0,3).map(r=>h('figure',{class:'rv'},h('blockquote',null,'“'+short(r.text,220)+'”'),h('figcaption',null,r.name)))),
    C.reviewsSource?h('p',{class:'o2-src'},C.reviewsSource):null):null;
  const ok=h('div',{class:'o2-ok'},h('h3',null,'Grazie, your request is in.'),h('p',null,'This is a preview. On your live site, reservation requests go straight to your inbox.'));
  const form=bookingForm(C,'o2-form',ok,[['Your Name','text','Jane Smith'],['Phone or Email','text','(563) 555-0100'],['Date','date',''],['Guests','text','2']]);
  const res=h('section',{class:'o2-res',id:'o2-res'},pics.length?bg(h('div',{class:'o2-res-bg'}),pics[2]||pics[0]):null,h('div',{class:'o2-w o2-res-in'},
    h('div',{class:'rv'},h('i',{class:'o2-script'},'Find a Table'),h('h2',null,'Reserve your evening'),h('p',null,'Date night, family dinner or a celebration. Send a request and we will have your table ready.'),
      C.phoneTxt?h('a',{class:'o2-ul light',href:C.tel||null},'Or call '+C.phoneTxt):null),
    h('div',{class:'o2-card rv'},form,ok)));
  const visit=h('section',{class:'o2-sec',id:'o2-visit'},
    h('div',{class:'o2-w o2-two rv'},h('small',{class:'o2-label'},'Location'),h('p',{class:'o2-big'},addrTxt?('Find us at '+addrTxt+'.'):'Come see us.')),
    h('div',{class:'o2-w o2-visit'},
      h('div',{class:'o2-info rv'},
        C.hasHours?h('div',null,h('small',{class:'o2-label'},'Hours'),h('div',{class:'o2-hrs'},osHours(C).map(r=>h('div',{class:r.today?'on':null},h('span',null,r.days),h('span',null,r.v))))):null,
        C.phoneTxt?h('div',null,h('small',{class:'o2-label'},'Call'),h('a',{class:'o2-phone',href:C.tel||null},C.phoneTxt)):null,
        C.maps?h('a',{class:'o2-ul',href:C.maps,target:'_blank',rel:'noopener'},'Get directions'):null),
      addrTxt?h('div',{class:'o2-map rv'},h('iframe',{src:'https://www.google.com/maps?q='+mapQ+'&output=embed',title:'Map to '+C.name,loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'})):null));
  const foot=h('footer',{class:'o2-foot'},h('div',{class:'o2-w o2-foot-in'},
    h('span',{class:'o2-foot-mark'},C.name),
    h('div',{class:'o2-foot-cols'},
      addrTxt?h('div',null,h('small',null,'Visit'),h('p',null,addrTxt)):null,
      C.phoneTxt?h('div',null,h('small',null,'Call'),h('p',null,h('a',{href:C.tel||null},C.phoneTxt))):null,
      h('div',null,h('small',null,'Explore'),h('div',{class:'o2-foot-nav'},items.map(([,sub,id])=>jump(id,sub))))),
    socials(C),h('small',{class:'o2-copy'},'© '+new Date().getFullYear()+' '+C.name)));
  return h('div',{class:'demo o2'},hero,bar,intro,trio,rule(),menu,gal,revs,res,visit,foot);
}

/* ===================== CLOUD (vape / smoke shop retail, clean e-commerce look) ===================== */
/* ===================== ZEPHYR (windows & doors, copper on charcoal) ===================== */
const ZP_ICO={
  win:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18M4 12h16"/></svg>',
  door:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17"/><path d="M3 21h18"/><circle cx="14.5" cy="12" r=".9" fill="currentColor"/></svg>',
  glass:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="1"/><path d="M8 14l6-6M10 17l7-7"/></svg>',
  mirror:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="10" rx="6" ry="7.5"/><path d="M12 17.5V21M8.5 21h7M9.5 7.5l2-2"/></svg>',
  shop:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M4 21V9h16v12M4 9l2-5h12l2 5"/><path d="M10 21v-6h4v6"/></svg>',
  home:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7"/><path d="M5 10v11h14V10"/><rect x="10" y="13" width="4" height="4"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M8 7h9v9"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  menu:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
};
function zpIco(k){ const d=h('span',{class:'zp-ico','aria-hidden':'true'}); d.innerHTML=ZP_ICO[k]||ZP_ICO.win; return d; }
function zpIcoFor(n){ n=String(n||'').toLowerCase(); return /mirror/.test(n)?'mirror':/glass/.test(n)?'glass':/commercial|store|business/.test(n)?'shop':/door/.test(n)?'door':/home|residential/.test(n)?'home':'win'; }
/* ===================== BECWAR (tile showroom) ===================== */
const BW_MAT=[
  {id:'carrara',n:'White marble look',c:'#ECEFF0',k:'marble',gl:1,j:.04},
  {id:'slate',n:'Charcoal slate look',c:'#3B4146',k:'slate',j:.07},
  {id:'concrete',n:'Soft gray concrete look',c:'#A2A7A8',k:'concrete',j:.05},
  {id:'oak',n:'Warm oak wood look',c:'#B58657',k:'wood',j:.09},
  {id:'white',n:'Glossy white',c:'#F4F6F6',k:'glaze',gl:1,j:.04},
  {id:'sage',n:'Sage glaze',c:'#8CA48E',k:'glaze',gl:1,j:.06},
  {id:'navy',n:'Deep blue glaze',c:'#26405E',k:'glaze',gl:1,j:.06},
  {id:'terra',n:'Terracotta',c:'#B65D39',k:'terra',j:.09},
  {id:'black',n:'Matte black',c:'#1F2224',k:'matte',j:.05},
  {id:'mist',n:'Blue gray glaze',c:'#7B95A7',k:'glaze',gl:1,j:.06}];
const BW_LAY=[['grid','Grid'],['brick','Brick'],['stack','Stacked'],['herring','Herringbone'],['diag','Diagonal']];
const BW_GROUT=[['white','White','#F1F3F3'],['light','Light gray','#B9BFC2'],['char','Charcoal','#454A4E'],['match','Matches tile','']];
const BW_SIZE=[['s','Small'],['m','Medium'],['l','Large']];
const BW_SURF=[['wall','Shower wall'],['back','Backsplash'],['floor','Floor']];
function bwRng(seed){ let s=(seed|0)||1; return ()=>{ s=(Math.imul(s,1664525)+1013904223)|0; return ((s>>>8)&0xffff)/0xffff; }; }
function bwShade(hex,t){ const n=parseInt(hex.slice(1),16); let r=n>>16,g=(n>>8)&255,b=n&255; const f=t<0?0:255, a=Math.abs(t); const c=v=>Math.max(0,Math.min(255,Math.round(v+(f-v)*a))).toString(16).padStart(2,'0'); return '#'+c(r)+c(g)+c(b); }
/* ---------- realistic tile engine (procedural textures + perspective room) ---------- */
const BWN=(()=>{ const P=new Uint8Array(512); let s=90210; const r=()=>{ s=(Math.imul(s,1664525)+1013904223)|0; return (s>>>8)&255; };
  const a=[]; for(let i=0;i<256;i++) a.push(i); for(let i=255;i>0;i--){ const j=r()%(i+1); const t=a[i]; a[i]=a[j]; a[j]=t; } for(let i=0;i<512;i++) P[i]=a[i&255];
  const val=(x,y)=>{ const xi=Math.floor(x), yi=Math.floor(y), xf=x-xi, yf=y-yi, X=xi&255, Y=yi&255, u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
    const g=(i,j)=>P[P[(X+i)&255]+((Y+j)&255)]/255; return (g(0,0)*(1-u)+g(1,0)*u)*(1-v)+(g(0,1)*(1-u)+g(1,1)*u)*v; };
  const fbm=(x,y,o)=>{ let amp=.5,f=1,t=0,n=0; for(let i=0;i<o;i++){ t+=amp*val(x*f,y*f); n+=amp; amp*=.5; f*=2.03; } return t/n; };
  return {val,fbm}; })();
const bwHex=h=>{ const n=parseInt(h.slice(1),16); return [n>>16,(n>>8)&255,n&255]; };
const BW_SLABS={}, BW_SS=320;
function bwCv(w,h){ const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(w)); c.height=Math.max(1,Math.round(h)); return c; }
function bwSlab(m){
  if(BW_SLABS[m.id]) return BW_SLABS[m.id];
  const S=BW_SS, c=bwCv(S,S), x=c.getContext('2d'), im=x.createImageData(S,S), d=im.data, B=bwHex(m.c), F=BWN.fbm, rr=bwRng(m.id.length*977+m.c.charCodeAt(2));
  for(let y=0;y<S;y++){ for(let px=0;px<S;px++){ const nx=px/S, ny=y/S; let r=B[0],g=B[1],b=B[2], L=0;
    if(m.k==='marble'){ const cl=F(nx*3,ny*3,4); L=(cl-.5)*.1;
      const wx=F(nx*2,ny*2,3), wy=F(nx*2+7,ny*2+3,3), n=F(nx*3+wx*1.9,ny*3+wy*1.9,4), n2=F(nx*5+wy*2.2+11,ny*5+wx*2.2,3);
      const v=Math.min(.8,Math.pow(1-Math.abs(n-.5)*2,24)*.8+Math.pow(1-Math.abs(n2-.5)*2,40)*.4);
      r+=(150-r)*v; g+=(160-g)*v; b+=(170-b)*v; }
    else if(m.k==='slate'){ const cl=F(nx*4,ny*7,4), st=F(nx*1.5,ny*16,3); L=(cl-.5)*.42+(st-.5)*.3; }
    else if(m.k==='concrete'){ const lo=F(nx*2,ny*2,5), mid=F(nx*14,ny*14,3); L=(lo-.5)*.28+(mid-.5)*.16; if(rr()>.994) L-=.22; }
    else if(m.k==='wood'){ const warp=F(nx*1.5,ny*5,3)*7, ring=Math.sin((ny*26+warp)*6.2832)*.5+.5, fine=F(nx*3,ny*46,3); L=(fine-.5)*.34+(ring-.5)*.14; const gdk=Math.pow(ring,7)*.4; r+=(104-r)*gdk; g+=(64-g)*gdk; b+=(34-b)*gdk; if(F(nx*9,ny*3,2)>.74){ L-=.1; } }
    else if(m.k==='terra'){ L=(F(nx*5,ny*5,4)-.5)*.4+(F(nx*22,ny*22,2)-.5)*.14; if(rr()>.99) L-=.2; }
    else if(m.k==='matte'){ L=(F(nx*6,ny*6,3)-.5)*.1; if(rr()>.993) L+=.12; }
    else { L=(F(nx*3,ny*3,3)-.5)*.07; }
    const f=1+L; const o=(y*S+px)*4; d[o]=Math.max(0,Math.min(255,r*f)); d[o+1]=Math.max(0,Math.min(255,g*f)); d[o+2]=Math.max(0,Math.min(255,b*f)); d[o+3]=255; } }
  x.putImageData(im,0,0); BW_SLABS[m.id]=c; return c;
}
const BW_DIM={grid:{s:.1,m:.305,l:.61},brick:{s:.075,m:.1,l:.15},stack:{s:.075,m:.1,l:.15},herring:{s:.05,m:.075,l:.1},diag:{s:.15,m:.305,l:.61}};
function bwBuildTex(m,lay,sz,gk,gw,Wm,Hm,ppm,seed){
  const W=Math.round(Wm*ppm), H=Math.round(Hm*ppm), c=bwCv(W,H), x=c.getContext('2d'), slab=bwSlab(m), S=BW_SS, wood=m.k==='wood';
  const gcol=(BW_GROUT.find(g=>g[0]===gk)||BW_GROUT[1])[2]||bwShade(m.c,-.3), gp=(gw==='wide'?.009:.0045)*ppm, rng=bwRng((seed||1)*7919+m.id.length*131+lay.length*17);
  x.fillStyle=gcol; x.fillRect(0,0,W,H);
  const tile=(tx,ty,tw,th,vert,cull)=>{
    const X=tx+gp/2, Y=ty+gp/2, w=tw-gp, hh=th-gp; if(w<=1||hh<=1) return; if(cull&&(X>W||Y>H||X+w<0||Y+hh<0)) return;
    x.save(); x.shadowColor='rgba(0,0,0,.5)'; x.shadowBlur=gp*1.3+1; x.shadowOffsetY=gp*.3; x.fillStyle=m.c; x.fillRect(X,Y,w,hh); x.restore();
    x.save(); x.beginPath(); x.rect(X,Y,w,hh); x.clip();
    const L1=vert?hh:w, L2=vert?w:hh, sw=Math.min(S,L1), sh=Math.min(S,L2), sx=rng()*(S-sw), sy=rng()*(S-sh);
    if(vert){ x.translate(X+w/2,Y+hh/2); x.rotate(Math.PI/2); x.drawImage(slab,sx,sy,sw,sh,-hh/2,-w/2,hh,w); }
    else x.drawImage(slab,sx,sy,sw,sh,X,Y,w,hh);
    x.restore(); x.save(); x.beginPath(); x.rect(X,Y,w,hh); x.clip();
    const j=(rng()-.5)*(m.j||.05); x.fillStyle=j>0?'rgba(255,255,255,'+j+')':'rgba(0,0,0,'+(-j)+')'; x.fillRect(X,Y,w,hh);
    if(m.gl){ const g=x.createLinearGradient(X,Y,X+w*.8,Y+hh*.9); g.addColorStop(0,'rgba(255,255,255,.22)'); g.addColorStop(.45,'rgba(255,255,255,0)'); g.addColorStop(1,'rgba(0,0,0,.07)'); x.fillStyle=g; x.fillRect(X,Y,w,hh); }
    x.restore();
    const lw=Math.max(1,ppm/320); x.lineWidth=lw; x.strokeStyle=m.gl?'rgba(255,255,255,.4)':'rgba(255,255,255,.16)'; x.beginPath(); x.moveTo(X+lw/2,Y+hh); x.lineTo(X+lw/2,Y+lw/2); x.lineTo(X+w,Y+lw/2); x.stroke();
    x.strokeStyle='rgba(0,0,0,.26)'; x.beginPath(); x.moveTo(X+w-lw/2,Y); x.lineTo(X+w-lw/2,Y+hh-lw/2); x.lineTo(X,Y+hh-lw/2); x.stroke();
  };
  const D=(BW_DIM[lay]||BW_DIM.grid)[sz]||.3;
  if(lay==='diag'){ x.save(); x.translate(W/2,H/2); x.rotate(-Math.PI/4); const ts=D*ppm, R=Math.hypot(W,H)/2+ts, n=Math.ceil(R/ts);
    for(let j=-n;j<=n;j++) for(let i=-n;i<=n;i++) tile(i*ts-ts/2,j*ts-ts/2,ts,ts,false,false); x.restore(); }
  else if(lay==='herring'){ const L=wood?5:2, q=(wood?D*1.3:D)*ppm, Wq=W/q, Hq=H/q, off=wood?[-5,-4]:[-3,-2], a0=2*L, b0=-(2*L-1);
    for(let j=-(L+3);j<=Hq+L+3;j++){ const base=b0*j, i0=Math.ceil((-3*L-base)/a0), i1=Math.floor((Wq+3*L-base)/a0);
      for(let i=i0;i<=i1;i++){ const ox=i*a0+base, oy=j; tile(ox*q,oy*q,L*q,q,false,true); tile((ox+off[0])*q,(oy+off[1])*q,q,L*q,true,true); } } }
  else { let tw,th,shift,rowsJ=false;
    if(wood){ th=D*1.4*ppm; tw=th*6; } else if(lay==='grid'){ tw=th=D*ppm; } else { th=D*ppm; tw=th*2; }
    for(let r=0,y=0;y<H+th;r++,y+=th){ const o=wood?(lay==='stack'?0:rng()*tw):(lay==='brick'?(r%2)*tw/2:0);
      for(let xx=-o-(o?tw:0);xx<W+tw;xx+=tw) tile(xx,y,tw,th,false,true); } }
  return c;
}
const BW_TEXC={};
function bwTex(kind,d,Wm,Hm,ppm){ const key=kind+JSON.stringify(d)+ppm; if(BW_TEXC[key]) return BW_TEXC[key]; const keys=Object.keys(BW_TEXC); if(keys.length>14) delete BW_TEXC[keys[0]];
  return (BW_TEXC[key]=bwBuildTex(bwMat(d.m),d.l,d.s,d.g,d.w,Wm,Hm,ppm,kind.length)); }
const BW_G={ch:1.35,RW:1.5,RH:2.4,Zb:4,Zn:1.6,f:520,cx:480,cy:276};
function bwGeo(k){ const g=BW_G, f=g.f*k, cx=g.cx*k, cy=g.cy*k, P=(X,Y,Z)=>[cx+f*X/Z,cy-f*(Y-g.ch)/Z]; return {k,f,cx,cy,P,g}; }
let BW_NOISE=null;
function bwNoise(){ if(BW_NOISE) return BW_NOISE; const c=bwCv(160,160), x=c.getContext('2d'), im=x.createImageData(160,160), r=bwRng(4242); for(let i=0;i<160*160;i++){ const v=Math.round(r()*255); im.data[i*4]=im.data[i*4+1]=im.data[i*4+2]=v; im.data[i*4+3]=255; } x.putImageData(im,0,0); return (BW_NOISE=c); }
function bwPoly(ctx,pts){ ctx.beginPath(); pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1])); ctx.closePath(); }
function bwIn(pts,x,y){ let o=false; for(let i=0,j=pts.length-1;i<pts.length;j=i++){ if(((pts[i][1]>y)!==(pts[j][1]>y))&&(x<(pts[j][0]-pts[i][0])*(y-pts[i][1])/(pts[j][1]-pts[i][1])+pts[i][0])) o=!o; } return o; }
function bwZones(){ const G=bwGeo(1), P=G.P, g=G.g, Zn=1.3;
  return {wall:[[P(-g.RW,g.RH,g.Zb),P(-g.RW,0,g.Zb),P(-g.RW,0,Zn),P(-g.RW,g.RH,Zn)],[P(-g.RW,g.RH,g.Zb),P(-.55,g.RH,g.Zb),P(-.55,0,g.Zb),P(-g.RW,0,g.Zb)]],
    back:[[P(-.4,1.5,g.Zb),P(1.4,1.5,g.Zb),P(1.4,.92,g.Zb),P(-.4,.92,g.Zb)]],
    floor:[[P(-g.RW,0,g.Zb),P(g.RW,0,g.Zb),P(g.RW,0,Zn),P(-g.RW,0,Zn)]]}; }
function bwRoom(cv,D,light,T){
  const k=cv.width/960, W=cv.width, H=cv.height, ctx=cv.getContext('2d'), G=bwGeo(k), P=G.P, f=G.f, cx=G.cx, cy=G.cy, g=G.g, ch=g.ch, RW=g.RW, RH=g.RH, Zb=g.Zb, Zn=g.Zn;
  const fm=bwMat(D.floor.m), wm=bwMat(D.wall.m), bm=bwMat(D.back.m), warm=light==='warm';
  ctx.setTransform(1,0,0,1,0,0); ctx.imageSmoothingEnabled=true; ctx.imageSmoothingQuality='high'; ctx.clearRect(0,0,W,H);
  const B0=P(-RW,RH,Zb), B1=P(RW,0,Zb), bx0=B0[0], by0=B0[1], bx1=B1[0], by1=B1[1], Z1=1.3;
  const lin=(x0,y0,x1,y1,stops)=>{ const gr=ctx.createLinearGradient(x0,y0,x1,y1); stops.forEach(s=>gr.addColorStop(s[0],s[1])); return gr; };
  const rad=(x0,y0,r0,x1,y1,r1,stops)=>{ const gr=ctx.createRadialGradient(x0,y0,r0,x1,y1,r1); stops.forEach(s=>gr.addColorStop(s[0],s[1])); return gr; };
  const paint=warm?['#D8D2CC','#E4DED8']:['#D3DBDF','#E1E8EB'];
  /* ceiling */
  bwPoly(ctx,[P(-RW,RH,Zb),P(RW,RH,Zb),P(RW,RH,Z1),P(-RW,RH,Z1)]); ctx.fillStyle=lin(0,0,0,by0,[[0,'#C9D1D5'],[1,'#EEF2F4']]); ctx.fill();
  [[-.7,2.5],[.7,2.5],[-.7,3.4],[.7,3.4]].forEach(a=>{ const c=P(a[0],RH,a[1]), rx=.09*f/a[1], gl=ctx.createRadialGradient(c[0],c[1],0,c[0],c[1],rx*5); gl.addColorStop(0,warm?'rgba(255,225,170,.55)':'rgba(255,255,255,.4)'); gl.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle=gl; ctx.fillRect(c[0]-rx*5,c[1]-rx*5,rx*10,rx*10); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(c[0],c[1],rx,rx*.3,0,0,7); ctx.fill(); });
  /* right wall (paint, window) */
  bwPoly(ctx,[P(RW,RH,Zb),P(RW,RH,Z1),P(RW,0,Z1),P(RW,0,Zb)]); ctx.fillStyle=lin(W,0,bx1,0,[[0,paint[0]],[1,paint[1]]]); ctx.fill();
  const win=[P(RW,2.15,3.5),P(RW,2.15,2.6),P(RW,1.2,2.6),P(RW,1.2,3.5)];
  bwPoly(ctx,win); ctx.fillStyle='#F8FBFC'; ctx.fill(); bwPoly(ctx,win); ctx.fillStyle=lin(win[0][0],win[0][1],win[2][0],win[2][1],[[0,warm?'#2B3A52':'#EAF6FD'],[1,warm?'#1B2538':'#BFE0F2']]); ctx.fill();
  ctx.strokeStyle='#F4F6F7'; ctx.lineWidth=5*k; bwPoly(ctx,win); ctx.stroke(); ctx.lineWidth=2.5*k; ctx.beginPath(); const mp=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2], t1=mp(win[0],win[1]), t2=mp(win[3],win[2]); ctx.moveTo(t1[0],t1[1]); ctx.lineTo(t2[0],t2[1]); ctx.stroke();
  bwPoly(ctx,[P(RW,.12,Zb),P(RW,.12,Z1),P(RW,0,Z1),P(RW,0,Zb)]); ctx.fillStyle='#F2F4F5'; ctx.fill();
  /* back wall paint */
  ctx.fillStyle=lin(0,by0,0,by1,[[0,paint[1]],[1,paint[0]]]); ctx.fillRect(bx0,by0,bx1-bx0,by1-by0);
  /* shower wall: left wall columns */
  const wt=T.wall, ppmW=wt.width/3.35, thW=wt.height;
  for(let x=0;x<bx0;x++){ const Z=f*RW/(cx-x-.5), top=cy-f*(RH-ch)/Z, bot=cy+f*ch/Z, s=Math.max(0,Z-Zn), dz=Z*Z/(f*RW), sw=Math.max(1,dz*ppmW), sx=Math.min(Math.max(0,s*ppmW-sw/2),wt.width-sw); ctx.drawImage(wt,sx,0,sw,thW,x,top,1.4,bot-top); }
  const xs=P(-.55,0,Zb)[0]; ctx.drawImage(wt,2.4*ppmW,0,.95*ppmW,thW,bx0,by0,xs-bx0,by1-by0);
  /* backsplash */
  const bt=T.back, bp0=P(-.4,1.5,Zb), bp1=P(1.4,.92,Zb); ctx.drawImage(bt,0,0,bt.width,bt.height,bp0[0],bp0[1],bp1[0]-bp0[0],bp1[1]-bp0[1]);
  ctx.fillStyle='rgba(0,0,0,.12)'; ctx.fillRect(bp0[0],bp0[1],bp1[0]-bp0[0],2.5*k);
  /* floor scanlines */
  const ft=T.floor, ppmF=ft.width/3, y0=Math.ceil(by1);
  for(let y=y0;y<H;y++){ const Z=f*ch/(y+.5-cy), xl=Math.max(0,cx-f*RW/Z), xr=Math.min(W,cx+f*RW/Z), dz=Z*Z/(f*ch), sh=Math.max(1,dz*ppmF), v=Math.min(Math.max(0,(Zb-Z)*ppmF-sh/2),ft.height-sh);
    const u0=Math.max(0,((xl-cx)*Z/f+RW)*ppmF), u1=Math.min(ft.width,((xr-cx)*Z/f+RW)*ppmF); if(u1>u0&&xr>xl) ctx.drawImage(ft,u0,v,u1-u0,sh,xl,y,xr-xl,1.4); }
  /* niche + shower fittings (frontal at back wall) */
  { const n0=P(-1.4,1.72,Zb), n1=P(-1.08,1.22,Zb), nw=n1[0]-n0[0], nh=n1[1]-n0[1];
    ctx.save(); ctx.beginPath(); ctx.rect(n0[0],n0[1],nw,nh); ctx.clip(); ctx.drawImage(wt,(2.4+.1)*ppmW,0,.32*ppmW,thW*.2,n0[0],n0[1],nw,nh); ctx.fillStyle='rgba(0,0,0,.4)'; ctx.fillRect(n0[0],n0[1],nw,nh);
    ctx.fillStyle=lin(0,n0[1],0,n0[1]+nh*.45,[[0,'rgba(0,0,0,.6)'],[1,'rgba(0,0,0,0)']]); ctx.fillRect(n0[0],n0[1],nw,nh); ctx.fillStyle=lin(n0[0],0,n0[0]+nw*.3,0,[[0,'rgba(0,0,0,.5)'],[1,'rgba(0,0,0,0)']]); ctx.fillRect(n0[0],n0[1],nw,nh); ctx.restore();
    ctx.fillStyle='rgba(255,255,255,.6)'; ctx.fillRect(n0[0]-1*k,n1[1]-1*k,nw+2*k,2.5*k); ctx.strokeStyle='rgba(0,0,0,.35)'; ctx.lineWidth=1.2*k; ctx.strokeRect(n0[0],n0[1],nw,nh);
    [[.22,.1,'#F4F6F7'],[.6,.075,'#5FA5AC']].forEach(b=>{ const bw=nw*.2, bh=nh*(.4+b[1]*3), bx=n0[0]+nw*b[0], by=n1[1]-bh-1.5*k; ctx.fillStyle=b[2]; ctx.beginPath(); ctx.roundRect?ctx.roundRect(bx,by,bw,bh,3*k):ctx.rect(bx,by,bw,bh); ctx.fill(); ctx.fillStyle='#8B969C'; ctx.fillRect(bx+bw*.3,by-5*k,bw*.4,5*k); ctx.fillStyle='rgba(255,255,255,.4)'; ctx.fillRect(bx+bw*.15,by+3*k,bw*.15,bh*.6); }); }
  { const v=P(-1,1.12,Zb), r=.05*f/Zb, gr=rad(v[0]-r*.3,v[1]-r*.3,r*.1,v[0],v[1],r,[[0,'#fff'],[.6,'#C5CED3'],[1,'#8F9BA1']]); ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(v[0],v[1],r,0,7); ctx.fill(); ctx.fillStyle='#98A4AA'; ctx.fillRect(v[0]-r*.15,v[1]-r*1.5,r*.3,r*3); }
  { const a=P(-1,2.08,3.98), b=P(-1,2.08,3.62), hd=P(-1,2.04,3.6), rx=.1*f/3.6; ctx.strokeStyle='#C7D0D5'; ctx.lineWidth=.028*f/3.8; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(a[0],a[1]); ctx.lineTo(b[0],b[1]); ctx.stroke(); ctx.lineCap='butt';
    ctx.fillStyle=rad(hd[0]-rx*.3,hd[1]-rx*.1,rx*.1,hd[0],hd[1],rx,[[0,'#fff'],[1,'#9BA7AD']]); ctx.beginPath(); ctx.ellipse(hd[0],hd[1],rx,rx*.28,0,0,7); ctx.fill(); }
  /* mirror and light bar */
  { const m0=P(0,2.18,Zb), m1=P(1,1.58,Zb), mw=m1[0]-m0[0], mh=m1[1]-m0[1]; ctx.fillStyle='rgba(0,0,0,.18)'; ctx.fillRect(m0[0]-2*k,m0[1]+3*k,mw+4*k,mh+4*k);
    ctx.fillStyle=lin(m0[0],m0[1],m1[0],m1[1],[[0,warm?'#E8DFD3':'#E9F3F7'],[.55,warm?'#CFC6BC':'#C6D6DD'],[1,warm?'#B9B0A7':'#AFC2CB']]); ctx.fillRect(m0[0],m0[1],mw,mh);
    ctx.fillStyle='rgba(255,255,255,.38)'; bwPoly(ctx,[[m0[0]+mw*.12,m0[1]],[m0[0]+mw*.3,m0[1]],[m0[0]+mw*.1,m1[1]],[m0[0]-mw*.08,m1[1]]]); ctx.fill(); bwPoly(ctx,[[m0[0]+mw*.4,m0[1]],[m0[0]+mw*.46,m0[1]],[m0[0]+mw*.26,m1[1]],[m0[0]+mw*.2,m1[1]]]); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.75)'; ctx.lineWidth=1.6*k; ctx.strokeRect(m0[0]+.8*k,m0[1]+.8*k,mw-1.6*k,mh-1.6*k);
    const l0=P(.12,2.3,Zb), l1=P(.88,2.25,Zb); ctx.fillStyle=lin(0,l1[1],0,l1[1]+60*k,[[0,warm?'rgba(255,214,150,.55)':'rgba(255,255,255,.4)'],[1,'rgba(255,255,255,0)']]); ctx.fillRect(l0[0],l1[1],l1[0]-l0[0],60*k); ctx.fillStyle='#D5DCE0'; ctx.fillRect(l0[0],l0[1],l1[0]-l0[0],l1[1]-l0[1]); ctx.fillStyle='#FFF7E0'; ctx.fillRect(l0[0]+2*k,l1[1]-3*k,l1[0]-l0[0]-4*k,3*k); }
  /* reflections on floor: back wall + shower wall */
  const gloss=fm.gl?.3:(fm.k==='wood'?.12:.06);
  const reflect=(sx,sy,sw,sh,axis,alpha,fade)=>{ if(sh<2||sw<2) return; const rc=bwCv(sw,sh), rx=rc.getContext('2d'); rx.translate(0,sh); rx.scale(1,-1); rx.drawImage(cv,sx,sy,sw,sh,0,0,sw,sh); rx.setTransform(1,0,0,1,0,0); rx.globalCompositeOperation='destination-in'; const gr=rx.createLinearGradient(0,0,0,sh); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(Math.min(1,fade/sh),'rgba(0,0,0,0)'); gr.addColorStop(1,'rgba(0,0,0,0)'); rx.fillStyle=gr; rx.fillRect(0,0,sw,sh);
    ctx.save(); bwPoly(ctx,[P(-RW,0,Zb),P(RW,0,Zb),P(RW,0,Z1),P(-RW,0,Z1)]); ctx.clip(); ctx.globalAlpha=alpha; ctx.drawImage(rc,sx,axis); ctx.restore(); };
  reflect(Math.round(bx0),Math.round(by0),Math.round(bx1-bx0),Math.round(by1-by0),by1,gloss,150*k);
  /* vanity cabinet and counter */
  { const Zf=3.45, c0=P(-.4,.88,Zf), c1=P(1.4,.1,Zf), kk=P(1.4,0,3.55), tk0=P(-.4,.1,3.55);
    ctx.save(); ctx.shadowColor='rgba(0,0,0,.5)'; ctx.shadowBlur=16*k; ctx.shadowOffsetY=9*k; ctx.fillStyle='#2B424C'; ctx.fillRect(c0[0],c0[1],c1[0]-c0[0],c1[1]-c0[1]); ctx.restore();
    ctx.fillStyle='#1B2A31'; ctx.fillRect(c0[0]+3*k,c1[1],c1[0]-c0[0]-6*k,kk[1]-c1[1]);
    ctx.fillStyle=lin(0,c0[1],0,c1[1],[[0,'#41606C'],[1,'#2F4852']]); ctx.fillRect(c0[0],c0[1],c1[0]-c0[0],c1[1]-c0[1]);
    const cw=c1[0]-c0[0], ch2=c1[1]-c0[1], dw=cw/2; for(let i=0;i<2;i++){ const dx=c0[0]+i*dw; ctx.strokeStyle='rgba(0,0,0,.45)'; ctx.lineWidth=1.6*k; ctx.strokeRect(dx+1*k,c0[1]+1*k,dw-2*k,ch2-2*k); ctx.strokeStyle='rgba(255,255,255,.14)'; ctx.lineWidth=1.2*k; ctx.strokeRect(dx+dw*.08,c0[1]+ch2*.1,dw*.84,ch2*.8);
      ctx.fillStyle='#D9E0E4'; const hx=i?dx+dw*.12:dx+dw*.88; ctx.fillRect(hx-1.5*k,c0[1]+ch2*.12,3*k,ch2*.22); }
    ctx.fillStyle=lin(c0[0],0,c1[0],0,[[0,'rgba(0,0,0,.25)'],[.5,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.3)']]); ctx.fillRect(c0[0],c0[1],cw,ch2);
    const ct=[P(-.42,.92,Zb),P(1.42,.92,Zb),P(1.42,.92,3.4),P(-.42,.92,3.4)]; bwPoly(ctx,ct); ctx.fillStyle=lin(0,ct[0][1],0,ct[2][1],[[0,'#E9EDEF'],[1,'#FAFBFB']]); ctx.fill();
    const ce=P(-.42,.92,3.4), cf=P(1.42,.88,3.4); ctx.fillStyle='#DDE3E6'; ctx.fillRect(ce[0],ce[1],cf[0]-ce[0],cf[1]-ce[1]); ctx.fillStyle='rgba(255,255,255,.7)'; ctx.fillRect(ce[0],ce[1],cf[0]-ce[0],1.2*k);
    const sp=[]; for(let t=0;t<40;t++){ const a=t/40*6.2832; sp.push(P(.5+.36*Math.cos(a),.92,3.74+.2*Math.sin(a))); } bwPoly(ctx,sp); ctx.fillStyle=lin(0,sp[10][1],0,sp[30][1],[[0,'#B9C3C8'],[1,'#EDF1F2']]); ctx.fill(); ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=1.4*k; ctx.stroke();
    const dn=P(.5,.92,3.78); ctx.fillStyle='#8F9BA1'; ctx.beginPath(); ctx.ellipse(dn[0],dn[1],4*k,1.6*k,0,0,7); ctx.fill();
    const fb=P(.5,.92,3.93), ft2=P(.5,1.14,3.93), fs=P(.5,1.12,3.72); ctx.strokeStyle='#BAC4C9'; ctx.lineCap='round'; ctx.lineWidth=.03*f/3.9; ctx.beginPath(); ctx.moveTo(fb[0],fb[1]); ctx.lineTo(ft2[0],ft2[1]); ctx.lineTo(fs[0],fs[1]); ctx.stroke(); ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=1.2*k; ctx.beginPath(); ctx.moveTo(fb[0]-1.5*k,fb[1]); ctx.lineTo(ft2[0]-1.5*k,ft2[1]); ctx.stroke(); ctx.lineCap='butt';
    [.38,.62].forEach(X=>{ const h0=P(X,.92,3.9), h1=P(X,1.0,3.9); ctx.fillStyle='#C9D2D7'; ctx.fillRect(h0[0]-3*k,h1[1],6*k,h0[1]-h1[1]); });
    { const so=P(1.17,.92,3.8), so2=P(1.17,1.1,3.8), r=.035*f/3.8; ctx.fillStyle='#F4F6F6'; ctx.beginPath(); ctx.roundRect?ctx.roundRect(so[0]-r,so2[1],r*2,so[1]-so2[1],r*.6):ctx.rect(so[0]-r,so2[1],r*2,so[1]-so2[1]); ctx.fill(); ctx.fillStyle='#98A4AA'; ctx.fillRect(so[0]-r*.3,so2[1]-6*k,r*.6,6*k); }
    { const pl=P(-.22,.92,3.8), pr=.05*f/3.8; ctx.fillStyle='#C25B33'; ctx.fillRect(pl[0]-pr,pl[1]-pr*1.2,pr*2,pr*1.2); ['#3F7A4A','#4F9158','#2E6A3C'].forEach((c,i)=>{ ctx.fillStyle=c; ctx.beginPath(); ctx.ellipse(pl[0]+(i-1)*pr*.6,pl[1]-pr*(2+i*.3),pr*.55,pr*1.1,(i-1)*.5,0,7); ctx.fill(); }); }
    reflect(Math.round(c0[0]-8*k),Math.round(c0[1]-70*k),Math.round(cw+16*k),Math.round(c1[1]-c0[1]+70*k),c1[1],gloss*.8,110*k); }
  /* shower glass */
  { const gl=[P(-.55,2.05,Zb),P(-.55,2.05,2.5),P(-.55,0,2.5),P(-.55,0,Zb)]; bwPoly(ctx,gl); ctx.fillStyle=lin(gl[0][0],0,gl[1][0],0,[[0,'rgba(225,240,246,.16)'],[1,'rgba(225,240,246,.07)']]); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.2)'; bwPoly(ctx,[P(-.55,1.9,3.3),P(-.55,1.9,3.0),P(-.55,.4,3.0),P(-.55,.4,3.3)]); ctx.fill(); bwPoly(ctx,[P(-.55,1.9,2.85),P(-.55,1.9,2.78),P(-.55,.4,2.78),P(-.55,.4,2.85)]); ctx.fill();
    ctx.strokeStyle='#C4CED3'; ctx.lineWidth=3.2*k; ctx.beginPath(); ctx.moveTo(gl[1][0],gl[1][1]); ctx.lineTo(gl[2][0],gl[2][1]); ctx.moveTo(gl[0][0],gl[0][1]); ctx.lineTo(gl[1][0],gl[1][1]); ctx.stroke(); ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=1*k; ctx.beginPath(); ctx.moveTo(gl[1][0]+1.5*k,gl[1][1]); ctx.lineTo(gl[2][0]+1.5*k,gl[2][1]); ctx.stroke();
    const h0=P(-.55,1.5,2.62), h1=P(-.55,.95,2.62); ctx.strokeStyle='#DCE3E6'; ctx.lineWidth=4*k; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(h0[0],h0[1]); ctx.lineTo(h1[0],h1[1]); ctx.stroke(); ctx.lineCap='butt'; }
  /* lighting: shading on tile walls, corners, floor */
  ctx.save(); bwPoly(ctx,[P(-RW,RH,Zb),P(-RW,0,Zb),P(-RW,0,Z1),P(-RW,RH,Z1)]); ctx.clip(); ctx.fillStyle=lin(0,0,bx0,0,[[0,'rgba(0,0,0,.22)'],[1,'rgba(0,0,0,.03)']]); ctx.fillRect(0,0,bx0+2,H); ctx.fillStyle=lin(0,by0-120*k,0,by0+40*k,[[0,'rgba(0,0,0,.2)'],[1,'rgba(0,0,0,0)']]); ctx.fillRect(0,0,bx0+2,by0+40*k); ctx.restore();
  ctx.fillStyle=lin(bx0-2*k,0,bx0+26*k,0,[[0,'rgba(0,0,0,.22)'],[1,'rgba(0,0,0,0)']]); ctx.fillRect(bx0,by0,30*k,by1-by0);
  ctx.fillStyle=lin(0,by0,0,by0+40*k,[[0,'rgba(0,0,0,.2)'],[1,'rgba(0,0,0,0)']]); ctx.fillRect(bx0,by0,bx1-bx0,40*k);
  ctx.save(); bwPoly(ctx,[P(RW,RH,Zb),P(RW,RH,Z1),P(RW,0,Z1),P(RW,0,Zb)]); ctx.clip(); ctx.fillStyle=lin(bx1,0,W,0,[[0,'rgba(0,0,0,.05)'],[1,'rgba(0,0,0,.26)']]); ctx.fillRect(bx1,0,W-bx1,H); ctx.restore();
  ctx.save(); bwPoly(ctx,[P(-RW,0,Zb),P(RW,0,Zb),P(RW,0,Z1),P(-RW,0,Z1)]); ctx.clip();
  ctx.fillStyle=lin(0,by1,0,H,[[0,'rgba(0,0,0,.28)'],[.35,'rgba(0,0,0,.05)'],[1,'rgba(0,0,0,0)']]); ctx.fillRect(0,by1,W,H-by1);
  ctx.fillStyle=lin(0,0,bx0+(0-bx0)*0,0,[[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,0)']]);
  ctx.fillStyle=rad(cx,by1+(H-by1)*.55,0,cx,by1+(H-by1)*.55,W*.62,[[0,warm?'rgba(255,232,190,.22)':'rgba(255,255,255,.2)'],[1,'rgba(255,255,255,0)']]); ctx.globalCompositeOperation='screen'; ctx.fillRect(0,by1,W,H-by1); ctx.globalCompositeOperation='source-over';
  if(!warm){ ctx.globalCompositeOperation='screen'; const wp=[P(RW,0,2.5),P(RW,0,3.5),P(.1,0,3.95),P(.1,0,3.0)]; bwPoly(ctx,wp); ctx.fillStyle=rad(P(RW,0,3)[0],P(RW,0,3)[1],0,P(RW,0,3)[0],P(RW,0,3)[1],f*1.2/3,[[0,'rgba(255,255,255,.3)'],[1,'rgba(255,255,255,0)']]); ctx.fill(); ctx.globalCompositeOperation='source-over'; }
  ctx.restore();
  /* light colour, vignette, grain */
  if(warm){ ctx.globalCompositeOperation='multiply'; ctx.fillStyle='rgba(255,208,150,.5)'; ctx.fillRect(0,0,W,H); ctx.globalCompositeOperation='source-over'; }
  else { ctx.globalCompositeOperation='screen'; ctx.fillStyle='rgba(215,232,255,.07)'; ctx.fillRect(0,0,W,H); ctx.globalCompositeOperation='source-over'; }
  ctx.fillStyle=rad(cx,cy*.9,H*.35,cx,cy*.9,W*.78,[[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,.3)']]); ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='overlay'; ctx.globalAlpha=.06; ctx.fillStyle=ctx.createPattern(bwNoise(),'repeat'); ctx.fillRect(0,0,W,H); ctx.globalAlpha=1; ctx.globalCompositeOperation='source-over';
}
function bwClose(cv,tex,light){ const ctx=cv.getContext('2d'), W=cv.width, H=cv.height; ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,W,H); ctx.imageSmoothingQuality='high'; ctx.drawImage(tex,0,0,tex.width,tex.height,0,0,W,H);
  const g=ctx.createRadialGradient(W*.5,H*.45,H*.25,W*.5,H*.5,W*.75); g.addColorStop(0,'rgba(255,255,255,.08)'); g.addColorStop(1,'rgba(0,0,0,.3)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  if(light==='warm'){ ctx.globalCompositeOperation='multiply'; ctx.fillStyle='rgba(255,208,150,.5)'; ctx.fillRect(0,0,W,H); ctx.globalCompositeOperation='source-over'; } }

const BW_PRESETS=[
  ['Spa',{wall:{m:'carrara',l:'brick',s:'m',g:'light',w:'fine'},back:{m:'carrara',l:'brick',s:'s',g:'light',w:'fine'},floor:{m:'slate',l:'grid',s:'m',g:'char',w:'fine'}}],
  ['Modern dark',{wall:{m:'black',l:'stack',s:'m',g:'char',w:'fine'},back:{m:'slate',l:'stack',s:'m',g:'char',w:'fine'},floor:{m:'concrete',l:'grid',s:'l',g:'light',w:'fine'}}],
  ['Farmhouse',{wall:{m:'white',l:'brick',s:'m',g:'light',w:'fine'},back:{m:'sage',l:'brick',s:'s',g:'white',w:'fine'},floor:{m:'oak',l:'herring',s:'m',g:'match',w:'fine'}}],
  ['Bold color',{wall:{m:'navy',l:'brick',s:'m',g:'white',w:'fine'},back:{m:'terra',l:'herring',s:'s',g:'char',w:'fine'},floor:{m:'white',l:'diag',s:'m',g:'light',w:'fine'}}]];
const bwMat=id=>BW_MAT.find(m=>m.id===id)||BW_MAT[0];
const bwLay=id=>(BW_LAY.find(l=>l[0]===id)||BW_LAY[0])[1].toLowerCase();
function bwNow(){ const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Chicago',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date()); const g=t=>(p.find(x=>x.type===t)||{}).value; return {wd:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].indexOf(g('weekday')),min:((+g('hour'))%24)*60+(+g('minute'))}; }
function bwRange(s){ const m=[...String(s||'').matchAll(/(\d{1,2})(?::(\d\d))?\s*(am|pm)/gi)]; if(m.length<2) return null; const f=a=>{ let hh=(+a[1])%12; if(/pm/i.test(a[3])) hh+=12; return hh*60+(+a[2]||0); }; return [f(m[0]),f(m[1])]; }
function bwFmt(min){ const hh=Math.floor(min/60), mm=min%60, h12=hh%12||12; return h12+(mm?':'+String(mm).padStart(2,'0'):'')+' '+(hh>=12?'pm':'am'); }
function bwStatus(C){ if(!C.hasHours) return null; const n=bwNow(), r=bwRange(C.hours[n.wd]);
  if(r&&n.min>=r[0]&&n.min<r[1]) return {open:true,text:'Open now',sub:'until '+bwFmt(r[1])};
  for(let k=0;k<=7;k++){ const ix=(n.wd+k)%7, rr=bwRange(C.hours[ix]); if(rr&&(k>0||n.min<rr[0])) return {open:false,text:'Closed now',sub:'opens '+(k===0?'today':k===1?'tomorrow':DAYS[ix])+' at '+bwFmt(rr[0])}; }
  return null; }

function becwar(C){
  const name=C.name||'Becwar Tile & Marble', x=C.x, num=v=>{ const n=parseFloat(v); return isFinite(n)&&n>0?n:0; };
  const digits=C.phone.replace(/\D/g,'').slice(-10);
  const smsHref=body=>digits.length===10?'sms:+1'+digits+(/iPhone|iPad|iPod/i.test(navigator.userAgent)?'&':'?')+'body='+encodeURIComponent(body):'';
  const heads=String(x.headline||'See your tile|before it’s set.').split('|');
  const st=bwStatus(C), addrTxt=[C.addr,C.city].filter(Boolean).join(', ');
  const call=(cls,label)=>C.tel?h('a',{class:'bw-btn '+cls,href:C.tel},ico('phone',16,''),label||('Call '+C.phoneTxt)):null;
  const links=[['w-design','Design a room'],['w-calc','How much tile'],['w-pick','Tile picker'],['w-care','Care tips'],['w-visit','Visit']];
  const markSvg=()=>{ const s=document.createElementNS('http://www.w3.org/2000/svg','svg'); s.setAttribute('viewBox','0 0 28 28'); s.setAttribute('class','bw-tilemark'); s.innerHTML='<rect x="1" y="1" width="12" height="12" fill="#0F5F66"/><rect x="15" y="1" width="12" height="12" fill="#C25B33"/><rect x="1" y="15" width="12" height="12" fill="#10222B"/><rect x="15" y="15" width="12" height="12" fill="#9AB3BC"/>'; return s; };
  const brand=h('a',{class:'bw-brand',href:'#',onclick:e=>{ e.preventDefault(); scrollTo('w-top'); },'aria-label':name},markSvg(),h('span',{class:'bw-wm'},h('b',null,'Becwar'),h('i',null,'Tile & Marble')));
  const nav=h('header',{class:'bw-nav'},h('div',{class:'bw-wrap bw-nav-in'},brand,
    call('ink sm','Call')));
  const top=h('div',{class:'bw-top'},h('div',{class:'bw-wrap bw-top-in'},
    st?h('span',{class:'bw-st'},h('i',{class:'bw-dot'+(st.open?' on':'')}),h('b',null,st.text),' '+st.sub):null));

  /* hero swatch board */
  const boardCells=[['carrara','herring','m'],['navy','brick','m'],['terra','grid','m'],['oak','herring','m'],['sage','brick','s'],['slate','diag','m'],['white','stack','m'],['mist','grid','s'],['black','brick','m']];
  const bcv=h('canvas',{role:'img','aria-label':'Tile swatch board with nine sample finishes and layouts'}), board=h('div',{class:'bw-board'},bcv);
  setTimeout(()=>{ const dpr=Math.min(window.devicePixelRatio||1,2); bcv.width=600*dpr; bcv.height=450*dpr; const bx=bcv.getContext('2d'); bx.scale(dpr,dpr); bx.fillStyle='#E7ECEE'; bx.fillRect(0,0,600,450);
    boardCells.forEach((c,i)=>setTimeout(()=>{ if(!bcv.isConnected) return; const m=bwMat(c[0]), X=(i%3)*200, Y=Math.floor(i/3)*150, tx=bwBuildTex(m,c[1],c[2],i%2?'light':'char','fine',.6,.45,560,i+1);
      bx.save(); bx.beginPath(); bx.rect(X+4,Y+4,192,142); bx.clip(); bx.drawImage(tx,0,0,tx.width,tx.height,X+4,Y+4,192,142); bx.fillStyle='rgba(16,34,43,.86)'; bx.fillRect(X+4,Y+120,192,26); bx.fillStyle='#fff'; bx.font='700 11px Manrope,sans-serif'; bx.fillText(m.n+' / '+bwLay(c[1]),X+12,Y+137); bx.restore(); },i*110)); },80);
  const hero=h('section',{class:'bw-hero',id:'w-top'},h('div',{class:'bw-wrap bw-hero-g'},
    h('div',{class:'bw-hero-t'},
      h('span',{class:'bw-kick'},[C.cat||'Tile store and installation',(C.city||'Dubuque, IA')].join(' \u00B7 ')),
      h('h1',null,heads[0],heads[1]?[h('br'),h('em',null,heads[1])]:null),
      h('p',{class:'bw-lead'},C.tag||'Becwar Tile & Marble sells and installs tile in Dubuque. Try layouts, work out how much you need and ask for an estimate, all from your phone.'),
      h('div',{class:'bw-cta'},call('ink')),
      h('ul',{class:'bw-facts'},h('li',null,'American Olean and Marazzi dealer'),h('li',null,'Showers, floors and backsplashes'),h('li',null,'Right on Central Ave in Dubuque'))),
    h('div',{class:'bw-need'},h('span',{class:'bw-needhd'},'What are you looking for?'),h('span',{class:'bw-needsub'},'Tap one to jump right there'),h('div',{class:'bw-needg'},
        [['w-design','Design a room','See tile in a room'],['w-calc','How much tile','Work out the amount'],['w-pick','Tile picker','Find a starting point'],['w-care','Care tips','Grout, stone, floors'],['w-est','Get an estimate','Send us the details'],['w-visit','Visit the store','Hours and directions']].map(([id,l,s])=>h('button',{type:'button',onclick:()=>scrollTo(id)},h('b',null,l),h('small',null,s),h('i',{class:'bw-arr','aria-hidden':'true'},ico('arrow')))))),
    board));

  /* ---------- visualizer ---------- */
  const D={cur:'wall',wall:{m:'carrara',l:'brick',s:'m',g:'light',w:'fine'},back:{m:'white',l:'brick',s:'s',g:'light',w:'fine'},floor:{m:'slate',l:'grid',s:'m',g:'char',w:'fine'},touched:false};
  const V={mode:'room',light:'day',ready:false,pulse:false}, thumbs={};
  const cvs=h('canvas',{class:'bw-cv',role:'img','aria-label':'Bathroom with a tiled shower wall, vanity backsplash and tiled floor, shown in perspective'});
  const ZONE_TAG=[['wall','Shower wall',4,14],['back','Backsplash',50,41],['floor','Floor',44,90]];
  const tagBtns=ZONE_TAG.map(([s,l,x,y])=>h('button',{type:'button',class:'bw-tagb',style:'left:'+x+'%;top:'+y+'%',onclick:()=>select(s)},l));
  const loadEl=h('div',{class:'bw-load'},'Building your room...');
  const sceneBox=h('div',{class:'bw-scene'},cvs,...tagBtns,loadEl), controls=h('div',{class:'bw-ctl'}), sumEl=h('p',{class:'bw-sum'});
  const designText=()=>BW_SURF.map(([s,l])=>{ const d=D[s], m=bwMat(d.m); return l.toLowerCase()+': '+m.n.toLowerCase()+', '+bwLay(d.l)+' layout, '+(BW_GROUT.find(g=>g[0]===d.g)||BW_GROUT[1])[1].toLowerCase()+' grout'; }).join('; ');
  const paintTags=()=>tagBtns.forEach((b,i)=>{ b.classList.toggle('on',ZONE_TAG[i][0]===D.cur); b.style.display=V.mode==='close'?'none':''; });
  const draw=()=>{ sumEl.textContent='Your design: '+designText()+'.'; paintTags(); if(!V.ready) return;
    const dpr=Math.min(window.devicePixelRatio||1,1.5), w=Math.round(960*dpr), hh=Math.round(600*dpr); if(cvs.width!==w){ cvs.width=w; cvs.height=hh; }
    const T={wall:bwTex('wall',D.wall,3.35,2.4,330),back:bwTex('back',D.back,1.8,.58,330),floor:bwTex('floor',D.floor,3,1.95,330)};
    if(V.mode==='close'){ const d=D[D.cur]; bwClose(cvs,bwTex('close'+D.cur,d,1.07,.67,900),V.light); } else bwRoom(cvs,D,V.light,T);
    if(V.pulse&&V.mode==='room'){ const k=cvs.width/960, x=cvs.getContext('2d'), Z=bwZones()[D.cur]; x.save(); x.setLineDash([10*k,7*k]); x.lineWidth=3*k; x.strokeStyle='#E5703F'; Z.forEach(p=>{ bwPoly(x,p.map(q=>[q[0]*k,q[1]*k])); x.stroke(); }); x.restore(); }
    loadEl.style.display='none'; };
  const pulse=()=>{ V.pulse=true; clearTimeout(V.pt); V.pt=setTimeout(()=>{ V.pulse=false; draw(); },1300); };
  const redraw=()=>{ if(V.raf) cancelAnimationFrame(V.raf); V.raf=requestAnimationFrame(()=>{ V.raf=0; draw(); }); };
  const select=s=>{ D.cur=s; pulse(); build(); };
  cvs.addEventListener('click',e=>{ const r=cvs.getBoundingClientRect(), x=(e.clientX-r.left)/r.width*960, y=(e.clientY-r.top)/r.height*600, Z=bwZones(); for(const s of ['back','wall','floor']){ if(Z[s].some(p=>bwIn(p,x,y))){ select(s); return; } } });
  const seg=(items,cur,fn,cls)=>h('div',{class:'bw-seg '+(cls||'')},items.map(([id,l])=>h('button',{type:'button',class:id===cur?'on':null,'aria-pressed':id===cur?'true':'false',onclick:()=>fn(id)},l)));
  const tools=h('div',{class:'bw-tools'});
  const paintTools=()=>tools.replaceChildren(seg([['room','Room view'],['close','Close-up']],V.mode,id=>{ V.mode=id; paintTools(); paintTags(); draw(); }),seg([['day','Daylight'],['warm','Warm light']],V.light,id=>{ V.light=id; paintTools(); draw(); }));
  paintTools();
  const swBg=m=>thumbs[m.id]?'background:url('+thumbs[m.id]+') center/cover':'background:'+m.c;
  const build=()=>{ const d=D[D.cur];
    controls.replaceChildren(
      h('div',{class:'bw-grp'},h('span',{class:'bw-lbl'},'1. Choose a surface'),seg(BW_SURF,D.cur,id=>{ select(id); })),
      h('div',{class:'bw-grp'},h('span',{class:'bw-lbl'},'2. Tile finish ',h('em',null,bwMat(d.m).n)),
        h('div',{class:'bw-sw'},BW_MAT.map(m=>h('button',{type:'button',class:m.id===d.m?'on':null,title:m.n,'aria-label':m.n,'aria-pressed':m.id===d.m?'true':'false',style:swBg(m),onclick:()=>{ d.m=m.id; D.touched=true; build(); }})))),
      h('div',{class:'bw-grp'},h('span',{class:'bw-lbl'},'3. Layout'),seg(BW_LAY,d.l,id=>{ d.l=id; D.touched=true; build(); },'wrap')),
      h('div',{class:'bw-grp bw-two'},h('div',null,h('span',{class:'bw-lbl'},'Tile size'),seg(BW_SIZE,d.s,id=>{ d.s=id; D.touched=true; build(); })),h('div',null,h('span',{class:'bw-lbl'},'Grout lines'),seg([['fine','Fine'],['wide','Wide']],d.w,id=>{ d.w=id; D.touched=true; build(); }))),
      h('div',{class:'bw-grp'},h('span',{class:'bw-lbl'},'Grout color'),h('div',{class:'bw-gr'},BW_GROUT.map(g=>h('button',{type:'button',class:g[0]===d.g?'on':null,'aria-pressed':g[0]===d.g?'true':'false',onclick:()=>{ d.g=g[0]; D.touched=true; build(); }},h('i',{style:'background:'+(g[2]||bwShade(bwMat(d.m).c,-.22))}),g[1]))))
    ); sumEl.textContent='Your design: '+designText()+'.'; paintTags(); if(V.ready){ loadEl.style.display='block'; redraw(); } };
  const applyPreset=p=>{ BW_SURF.forEach(([s])=>{ D[s]=Object.assign({},p[s]); }); D.touched=true; build(); };
  const shuffle=()=>{ const R=a=>a[Math.floor(Math.random()*a.length)]; BW_SURF.forEach(([s])=>{ D[s]={m:R(BW_MAT).id,l:R(BW_LAY)[0],s:R(BW_SIZE)[0],g:R(BW_GROUT)[0],w:'fine'}; }); D.touched=true; build(); };
  const presets=h('div',{class:'bw-pre'},h('span',null,'Start from'),BW_PRESETS.map(p=>h('button',{type:'button',onclick:()=>applyPreset(p[1])},p[0])),h('button',{type:'button',class:'sur',onclick:shuffle},'Surprise me'));
  const design=h('section',{class:'bw-sec',id:'w-design'},h('div',{class:'bw-wrap'},
    h('div',{class:'bw-head'},h('span',{class:'bw-kick'},'Room visualizer'),h('h2',null,'See the real thing in a real room.'),h('p',null,'Pick a surface, then a finish, layout and grout, and the room redraws with life-like tile. Switch to the close-up to see the grain, shine and grout, or flip the lighting. Finishes shown are samples. Real colors, sizes and styles are in the showroom.')),
    presets,
    h('div',{class:'bw-lab'},h('div',{class:'bw-stage'},tools,sceneBox,sumEl,h('div',{class:'bw-cta2'},h('button',{type:'button',class:'bw-btn ink',onclick:()=>scrollTo('w-est')},'Ask about this design'))),controls)));
  build();
  const startRoom=()=>{ if(V.ready) return; V.ready=true; setTimeout(()=>{ draw(); BW_MAT.forEach((m,i)=>setTimeout(()=>{ const s=bwSlab(m), t=bwCv(72,72); t.getContext('2d').drawImage(s,50,50,170,170,0,0,72,72); thumbs[m.id]=t.toDataURL('image/jpeg',.82); if(i===BW_MAT.length-1) build(); },300+i*70)); },30); };
  if('IntersectionObserver' in window){ const io=new IntersectionObserver(es=>{ if(es.some(e=>e.isIntersecting)){ io.disconnect(); startRoom(); } },{rootMargin:'500px 0px'}); setTimeout(()=>io.observe(design),0); } else setTimeout(startRoom,300);

  /* ---------- calculator ---------- */
  const SIZES=[['3 x 6 inch subway',3,6],['4 x 4 inch',4,4],['6 x 6 inch',6,6],['12 x 12 inch',12,12],['12 x 24 inch',12,24],['24 x 24 inch',24,24]];
  const WASTE=[['Straight or grid',10],['Brick or offset',10],['Diagonal',15],['Herringbone',15]];
  const CAL={used:false,text:''};
  const inL=h('input',{type:'number',inputmode:'decimal',min:'0',step:'0.5',value:'8','aria-label':'Length in feet'}), inW=h('input',{type:'number',inputmode:'decimal',min:'0',step:'0.5',value:'5','aria-label':'Width or height in feet'}), inO=h('input',{type:'number',inputmode:'decimal',min:'0',step:'1',value:'0','aria-label':'Openings in square feet'});
  const selS=h('select',{'aria-label':'Tile size'},SIZES.map((s,i)=>h('option',{value:String(i),selected:i===3?'':null},s[0]))), selW=h('select',{'aria-label':'Layout'},WASTE.map((s,i)=>h('option',{value:String(i)},s[0]+' ('+s[1]+'% extra)')));
  const out=h('div',{class:'bw-out'});
  const calc=()=>{ const area=Math.max(0,num(inL.value)*num(inW.value)-(parseFloat(inO.value)||0)), sz=SIZES[+selS.value], wp=WASTE[+selW.value], order=Math.ceil(area*(1+wp[1]/100)), tiles=Math.ceil(order*144/(sz[1]*sz[2]));
    CAL.used=area>0; CAL.text=area>0?'I measured about '+area.toFixed(1).replace(/\.0$/,'')+' sq ft and figure on ordering about '+order+' sq ft ('+tiles+' tiles of '+sz[0]+', '+wp[0].toLowerCase()+' layout).':'';
    out.replaceChildren(h('div',{class:'bw-big'},h('b',null,String(order)),h('span',null,'sq ft to order')),
      h('dl',null,h('div',null,h('dt',null,'Area to tile'),h('dd',null,area.toFixed(1).replace(/\.0$/,'')+' sq ft')),h('div',null,h('dt',null,'Extra for cuts'),h('dd',null,wp[1]+'%')),h('div',null,h('dt',null,'About this many tiles'),h('dd',null,String(tiles))))); };
  [inL,inW,inO,selS,selW].forEach(e=>{ e.addEventListener('input',calc); e.addEventListener('change',calc); });
  const ex=h('div',{class:'bw-ex'},h('span',null,'Example sizes'),[['Bathroom floor',8,5],['Kitchen backsplash',12,1.5],['Shower wall',7,5],['Entry floor',6,4]].map(([l,a,b])=>h('button',{type:'button',onclick:()=>{ inL.value=a; inW.value=b; calc(); }},l+' '+a+' x '+b)));
  const calcSec=h('section',{class:'bw-sec bw-alt',id:'w-calc'},h('div',{class:'bw-wrap bw-2c'},
    h('div',{class:'bw-head'},h('span',{class:'bw-kick'},'Tile calculator'),h('h2',null,'How much tile do I need?'),h('p',null,'Measure length and width in feet, subtract any tub, window or door openings, and add extra for cuts and breakage. Most jobs need 10 to 15 percent more than the exact area.'),ex,
      h('p',{class:'bw-note'},'Tile is sold in boxes with a set coverage. Bring this number to the store and we can match it to the box.')),
    h('div',{class:'bw-card'},h('div',{class:'bw-fl'},h('label',null,h('span',null,'Length (ft)'),inL),h('label',null,h('span',null,'Width or height (ft)'),inW),h('label',null,h('span',null,'Openings to subtract (sq ft)'),inO),h('label',null,h('span',null,'Tile size'),selS),h('label',{class:'full'},h('span',null,'Layout'),selW)),out)));
  calc();

  /* ---------- picker ---------- */
  const Q1=[['shower','Shower or tub wall'],['bathfloor','Bathroom floor'],['kitchenfloor','Kitchen floor'],['backsplash','Backsplash'],['entry','Entry or mudroom floor']];
  const Q2=[['easy','Easy to keep clean'],['stone','A natural stone look'],['budget','Keeping cost down'],['bold','A bold, standout look']];
  const PK={a:'',b:''};
  const REC={
    shower:['Glazed ceramic or porcelain wall tile','Both stand up to constant water. Ceramic is easy to cut and often costs less. Porcelain is denser and tougher. For the shower floor itself, small tiles have more grout lines, which gives your feet more grip.',['Ask which tile is made for wet areas and which grout and sealer to use.','Ask about a shower floor tile with a good slip rating.']],
    bathfloor:['Porcelain floor tile with a textured finish','Porcelain absorbs very little water and wears well, and a matte or textured surface is less slippery when wet.',['Ask for the slip rating (called DCOF) on any bathroom floor tile.','Ask about heated floor options that work under tile.']],
    kitchenfloor:['Porcelain floor tile, large format or wood look','Porcelain handles heavy foot traffic, spills and dropped pans. Large tiles mean fewer grout lines to clean.',['Ask how flat your subfloor needs to be for large tiles.','Ask about darker grout that hides everyday dirt.']],
    backsplash:['Glazed ceramic tile, often a subway or small format','A glazed surface wipes clean after splatter, and the walls are not walked on, so softer wall tile works well here.',['Ask how many sq ft you need: most backsplashes are small, so extra tile is cheap insurance.','Ask about grout color: it changes the look as much as the tile does.']],
    entry:['Porcelain tile rated for heavy traffic','Entries get grit, salt and wet boots. Porcelain resists scratches and water, and a textured finish helps with traction.',['Ask about slip rating, especially for winter months.','Ask about a darker or patterned tile that hides tracked-in dirt.']]};
  const MOD={easy:'Because easy cleaning matters most: choose a glazed or sealed surface and a grout color a little darker than white. Natural stone and light cement grout need more upkeep.',stone:'For a natural stone look: you can choose real marble or stone, which needs sealing and gentle cleaners, or porcelain that looks like stone with far less upkeep. Ask to see both side by side.',budget:'To keep cost down: ceramic is usually the lower-cost choice, and a simple straight layout takes less labor and wastes less tile than herringbone or diagonal.',bold:'For a bold look: color and pattern do the work. A herringbone or diagonal layout, or a deep glaze color, changes a room more than the price of the tile suggests. Plan for about 15 percent extra for those layouts.'};
  const res=h('div',{class:'bw-res','aria-live':'polite'});
  const showRes=()=>{ if(!PK.a||!PK.b){ res.replaceChildren(h('p',{class:'bw-hint'},'Choose one answer in each row to see a suggestion.')); return; } const r=REC[PK.a];
    res.replaceChildren(h('span',{class:'bw-lbl'},'A good place to start'),h('h3',null,r[0]),h('p',null,r[1]),h('p',null,MOD[PK.b]),h('ul',null,r[2].map(t=>h('li',null,ico('check',14,''),t))),h('p',{class:'bw-note'},'This is general guidance, not a product recommendation. Stop in to see what is on the shelf and ask about your room.')); };
  const qrow=(items,key)=>{ const wrap=h('div',{class:'bw-seg wrap'}); const paint=()=>wrap.replaceChildren(...items.map(([id,l])=>h('button',{type:'button',class:PK[key]===id?'on':null,'aria-pressed':PK[key]===id?'true':'false',onclick:()=>{ PK[key]=id; paint(); showRes(); }},l))); paint(); return wrap; };
  showRes();
  const pick=h('section',{class:'bw-sec',id:'w-pick'},h('div',{class:'bw-wrap bw-2c'},
    h('div',{class:'bw-head'},h('span',{class:'bw-kick'},'Tile picker'),h('h2',null,'Not sure what kind of tile?'),h('p',null,'Answer two quick questions and get a starting point, plus what to ask when you come in.')),
    h('div',{class:'bw-card'},h('span',{class:'bw-lbl'},'Where is the tile going?'),qrow(Q1,'a'),h('span',{class:'bw-lbl',style:'margin-top:18px'},'What matters most?'),qrow(Q2,'b'),res)));

  /* ---------- services + brands ---------- */
  const SV=[['Custom showers','Walls, floors and niches planned and tiled for a shower that fits your space.'],['Kitchen and bathroom floors','Ceramic and porcelain floor tile, sold and installed.'],['Backsplashes','Tile for behind the stove, sink or bar.'],['Natural stone','Marble and stone floors, listed in directories, with care that fits the material. Ask what is in stock.'],['Tile removal','Old tile taken out before new tile goes down.'],['Grout repair','Cracked or stained grout repaired, so tile you already have looks fresh.']];
  const svc=h('section',{class:'bw-sec bw-alt',id:'w-svc'},h('div',{class:'bw-wrap'},
    h('div',{class:'bw-head'},h('span',{class:'bw-kick'},'What we do'),h('h2',null,'Tile sales and installation.')),
    h('div',{class:'bw-svc'},SV.map((s,i)=>h('article',{class:'bw-sc'},h('b',null,String(i+1).padStart(2,'0')),h('h3',null,s[0]),h('p',null,s[1])))),
    h('div',{class:'bw-brands'},h('span',null,'Brands we carry'),h('ul',null,['American Olean','Marazzi','Florida Tile'].map(t=>h('li',null,t))),h('p',null,'American Olean and Marazzi per the Marazzi dealer page. Ask which lines are in stock.'))));

  /* ---------- care ---------- */
  const CARE=[['Grout',['Cement grout is porous. Seal it after it cures and again every year or two, depending on the traffic.','Clean with a pH-neutral cleaner and a soft brush. Harsh scrubbing wears grout down.','Cracked or crumbling grout lets water behind the tile. Have it repaired early.']],
    ['Marble and stone',['Seal natural stone and keep it sealed. Spills such as wine, coffee and oil can stain it.','Use a stone-safe, pH-neutral cleaner. Vinegar, lemon and many bathroom sprays can dull marble.','Put mats at doors to catch grit, which scratches stone.']],
    ['Shower tile',['Squeegee or wipe walls after use to slow soap scum and mildew.','Run the fan or crack a window to dry the room.','Watch the caulk at corners and where the tile meets the tub. Replace it when it cracks or peels.']],
    ['Floors',['Sweep or vacuum first. Grit does more damage than foot traffic.','Mop with a neutral cleaner. Too much soap leaves a film that dulls the surface and holds dirt.','Felt pads under furniture keep chairs from scratching the tile.']]];
  const careBody=h('div',{class:'bw-cb'}), careTabs=h('div',{class:'bw-seg wrap'});
  let careIx=0; const paintCare=()=>{ careTabs.replaceChildren(...CARE.map((c,i)=>h('button',{type:'button',class:i===careIx?'on':null,'aria-pressed':i===careIx?'true':'false',onclick:()=>{ careIx=i; paintCare(); }},c[0]))); careBody.replaceChildren(h('ul',null,CARE[careIx][1].map(t=>h('li',null,ico('check',14,''),t)))); }; paintCare();
  const care=h('section',{class:'bw-sec',id:'w-care'},h('div',{class:'bw-wrap bw-2c'},
    h('div',{class:'bw-head'},h('span',{class:'bw-kick'},'Care tips'),h('h2',null,'Keep it looking new.'),h('p',null,'Short, general tips for common tile. Different tile and sealers have their own rules, so ask us about yours.')),
    h('div',{class:'bw-card'},careTabs,careBody)));

  /* ---------- estimate ---------- */
  const PJ=['Shower','Floor','Backsplash','Tile removal','Grout repair','Something else'], pj={}, ES={size:'',when:''};
  const nameIn=h('input',{type:'text',placeholder:'Your name','aria-label':'Your name',autocomplete:'name'}), noteIn=h('textarea',{rows:'3',placeholder:'Anything else we should know','aria-label':'Notes'});
  const msgEl=h('pre',{class:'bw-msg'}), actions=h('div',{class:'bw-act'}), cpOk=h('span',{class:'bw-ok',role:'status'});
  const buildMsg=()=>{ const sel=PJ.filter(p=>pj[p]).map(p=>p.toLowerCase()); let t='Hi, I’d like to ask about an estimate for '+(sel.length?sel.join(', '):'a tile project')+(ES.size?', about '+ES.size:'')+(ES.when?'. Timing: '+ES.when.toLowerCase():'')+'.';
    if(D.touched) t+=' I tried a design on your website. '+designText().replace(/^./,c=>c.toUpperCase())+'.'; if(CAL.used) t+=' '+CAL.text; if(noteIn.value.trim()) t+=' '+noteIn.value.trim(); t+=' '+(nameIn.value.trim()?'My name is '+nameIn.value.trim()+'.':'Thanks!'); return t; };
  const paintEst=()=>{ const t=buildMsg(); msgEl.textContent=t; const s=smsHref(t);
    actions.replaceChildren(...[call('ink'),s?h('a',{class:'bw-btn line',href:s},'Text this message'):null,h('button',{type:'button',class:'bw-btn line',onclick:()=>{ const done=()=>{ cpOk.textContent='Copied. Paste it into a text or email.'; }; if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(buildMsg()).then(done,()=>{ cpOk.textContent='Select the message above to copy it.'; }); else cpOk.textContent='Select the message above to copy it.'; }},'Copy message'),C.email?h('a',{class:'bw-btn line',href:'mailto:'+C.email+'?subject='+encodeURIComponent('Estimate request')+'&body='+encodeURIComponent(t)},'Email it'):null].filter(Boolean)); };
  const chips=h('div',{class:'bw-seg wrap'}), paintChips=()=>chips.replaceChildren(...PJ.map(p=>h('button',{type:'button',class:pj[p]?'on':null,'aria-pressed':pj[p]?'true':'false',onclick:()=>{ pj[p]=!pj[p]; paintChips(); paintEst(); }},p)));
  const sizeSel=h('select',{'aria-label':'Project size',onchange:e=>{ ES.size=e.target.value; paintEst(); }},h('option',{value:''},'Not sure yet'),['under 50 sq ft','50 to 150 sq ft','over 150 sq ft'].map(o=>h('option',{value:o},o)));
  const whenSel=h('select',{'aria-label':'Timing',onchange:e=>{ ES.when=e.target.value; paintEst(); }},h('option',{value:''},'Not sure yet'),['As soon as possible','In the next 1 to 3 months','Just planning'].map(o=>h('option',{value:o},o)));
  [nameIn,noteIn].forEach(e=>e.addEventListener('input',paintEst)); paintChips(); paintEst();
  const est=h('section',{class:'bw-sec bw-dark',id:'w-est'},h('div',{class:'bw-wrap bw-2c'},
    h('div',{class:'bw-head'},h('span',{class:'bw-kick'},'Ask for an estimate'),h('h2',null,'Send us the details in one tap.'),h('p',null,'Tell us about the job. If you tried a design or ran the calculator above, those choices go into the message too. Then call, text or copy it.')),
    h('div',{class:'bw-card'},h('span',{class:'bw-lbl'},'What is the project?'),chips,h('div',{class:'bw-fl'},h('label',null,h('span',null,'About how big?'),sizeSel),h('label',null,h('span',null,'When?'),whenSel),h('label',null,h('span',null,'Name'),nameIn),h('label',{class:'full'},h('span',null,'Notes'),noteIn)),
      h('span',{class:'bw-lbl'},'Your message'),msgEl,actions,cpOk,h('p',{class:'bw-note'},'This preview does not send anything by itself. Your phone opens the call or text for you to review and send.'))));

  /* ---------- visit ---------- */
  const visit=h('section',{class:'bw-sec',id:'w-visit'},h('div',{class:'bw-wrap bw-2c'},
    h('div',{class:'bw-head'},h('span',{class:'bw-kick'},'Visit the store'),h('h2',null,'Come see it in person.'),
      addrTxt?h('p',{class:'bw-addr'},ico('pin',18,''),addrTxt):null,C.tel?h('p',{class:'bw-addr'},ico('phone',18,''),h('a',{href:C.tel},C.phoneTxt)):null,
      h('div',{class:'bw-cta'},call('ink'),C.maps?h('a',{class:'bw-btn line',href:C.maps,target:'_blank',rel:'noopener'},'Get directions'):null),
      h('p',{class:'bw-note'},'Bring photos and measurements of your space, and a sample of any tile you want to match.')),
    h('div',{class:'bw-card bw-hrs'},h('span',{class:'bw-lbl'},'Store hours'),hoursRows(C),h('p',{class:'bw-note'},'Hours are as listed online. Call to confirm before you drive over.'))));
  const foot=h('footer',{class:'bw-foot'},h('div',{class:'bw-wrap bw-foot-in'},h('b',null,name),addrTxt?h('span',null,addrTxt):null,C.tel?h('a',{href:C.tel},C.phoneTxt):null,h('em',null,'© '+new Date().getFullYear()+' '+name)));
  return h('div',{class:'demo bw on'},top,nav,hero,design,calcSec,pick,svc,care,est,visit,foot);
}

/* ===== Bloom Tattoo (dark tattoo studio demo) ===== */
const BLA={
  flower:(n,len,w)=>{ let s=''; for(let i=0;i<n;i++){ s+='<path d="M100 100C'+(100-w)+' '+(100-len*.45)+' '+(100-w*.6)+' '+(100-len)+' 100 '+(100-len)+'C'+(100+w*.6)+' '+(100-len)+' '+(100+w)+' '+(100-len*.45)+' 100 100Z" transform="rotate('+(i*360/n)+' 100 100)"/>'; } for(let i=0;i<n;i++){ s+='<path d="M100 100L100 '+(100-len*.62)+'" transform="rotate('+(i*360/n)+' 100 100)" style="opacity:.55"/>'; } return s+'<circle cx="100" cy="100" r="9"/><circle cx="100" cy="100" r="3" class="f"/>'; },
  rose:()=>{ let d='',t=0; for(let i=0;i<=110;i++){ t=i*.1; const r=2+t*4.6, x=100+r*Math.cos(t*1.0), y=88+r*Math.sin(t)*.88; d+=(i?'L':'M')+x.toFixed(1)+' '+y.toFixed(1); }
    return '<path d="'+d+'"/><path d="M42 84C34 128 72 158 100 158C128 158 166 128 158 84"/><path d="M58 70C46 108 74 134 100 134"/><path d="M142 70C154 108 126 134 100 134"/><path d="M100 158C100 172 98 184 104 196"/><path d="M101 176C82 176 70 166 66 154C84 154 98 160 101 176Z"/><path d="M103 186C122 184 134 174 138 162C120 162 106 170 103 186Z"/>'; },
  moth:()=>{ const wing='<path d="M100 92C70 40 14 44 20 98C24 124 70 116 100 102"/><path d="M100 104C74 112 40 146 62 178C86 180 100 146 100 112"/><path d="M52 84C44 90 44 98 52 100"/><path d="M40 70C34 80 34 88 40 92" style="opacity:.6"/><circle cx="66" cy="152" r="4"/>'; return wing+'<g transform="translate(200 0) scale(-1 1)">'+wing+'</g><path d="M100 78L100 150" style="stroke-width:5"/><circle cx="100" cy="76" r="5"/><path d="M96 70C88 52 80 46 70 44"/><path d="M104 70C112 52 120 46 130 44"/>'; },
  dagger:()=>'<path d="M100 14L111 112L100 122L89 112Z"/><path d="M100 22L100 112" style="opacity:.55"/><path d="M66 120C84 134 116 134 134 120"/><path d="M66 120C62 114 62 110 68 108"/><path d="M134 120C138 114 138 110 132 108"/><rect x="95" y="130" width="10" height="34" rx="2"/><path d="M95 140L105 146M95 150L105 156" style="opacity:.6"/><circle cx="100" cy="174" r="8"/><path d="M100 182C100 190 92 196 82 196M100 182C100 190 108 196 118 196" style="opacity:.7"/>',
  snake:()=>'<path d="M54 36C150 30 156 86 102 96C50 106 46 154 146 164" style="stroke-width:7"/><path d="M54 36C150 30 156 86 102 96C50 106 46 154 146 164" style="stroke-width:1.5;stroke:var(--bl-bg,#0c0c0d);opacity:.8"/><path d="M54 36C42 32 36 40 40 48C44 54 54 50 54 36Z"/><circle cx="46" cy="40" r="1.8" class="f"/><path d="M40 52L34 60M40 52L46 60" style="stroke-width:1.5"/><path d="M146 164L156 168L146 172" style="stroke-width:3"/>',
  orn:()=>{ let s='<circle cx="100" cy="100" r="62"/><circle cx="100" cy="100" r="54" style="opacity:.5"/><circle cx="100" cy="100" r="30"/>'; for(let i=0;i<24;i++){ s+='<path d="M100 '+(i%2?36:26)+'L100 '+(i%2?42:38)+'" transform="rotate('+(i*15)+' 100 100)"/>'; } for(let i=0;i<12;i++){ s+='<path d="M100 70C108 78 108 90 100 98C92 90 92 78 100 70Z" transform="rotate('+(i*30)+' 100 100)" style="opacity:.8"/>'; } return s+'<circle cx="100" cy="100" r="5" class="f"/>'; },
  sphere:()=>{ let s=0x9e3779b9; const rnd=()=>{ s=(s+0x6D2B79F5)|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; let o=''; for(let i=0;i<1100;i++){ const a=rnd()*6.283, r=Math.sqrt(rnd())*68, x=r*Math.cos(a), y=r*Math.sin(a); const nz=Math.sqrt(Math.max(0,1-(x*x+y*y)/4624)), lit=Math.max(0,(-x*.5-y*.55)/68*.9+nz*.55); if(rnd()>Math.pow(1-lit,1.6)*1.05) continue; o+='<circle cx="'+(100+x).toFixed(1)+'" cy="'+(100+y).toFixed(1)+'" r="'+(0.7+rnd()*.9).toFixed(2)+'" class="f"/>'; } return o; },
  rosebud:()=>'<path d="M100 150C70 140 62 104 80 82C92 68 108 68 120 82C138 104 130 140 100 150Z"/><path d="M82 90C94 100 106 100 118 90"/><path d="M90 78C98 84 104 84 112 78"/><path d="M100 150L100 190"/><path d="M100 172C82 172 70 164 66 152C84 152 98 158 100 172Z"/><path d="M100 182C118 180 130 172 134 160C118 160 104 166 100 182Z"/><path d="M70 96C58 86 56 72 64 62M130 96C142 86 144 72 136 62" style="opacity:.7"/>'
};
function blSvg(markup,cls){ const s=document.createElementNS('http://www.w3.org/2000/svg','svg'); s.setAttribute('viewBox','0 0 200 200'); s.setAttribute('class','bl-art'+(cls?' '+cls:'')); s.setAttribute('aria-hidden','true'); s.innerHTML=markup; return s; }

function bloomTattoo(C){
  const x=C.x, name=C.name||'Bloom Tattoo', addrTxt=[C.addr,C.city].filter(Boolean).join(', ');
  const book=/^https:\/\/[^\s"'<>]+$/.test(x.bookUrl||'')?x.bookUrl:'';
  const digits=C.phone.replace(/\D/g,'').slice(-10);
  const smsHref=body=>digits.length===10?'sms:+1'+digits+(/iPhone|iPad|iPod/i.test(navigator.userAgent)?'&':'?')+'body='+encodeURIComponent(body):'';
  const st=bwStatus(C), heads=String(x.headline||'Custom ink,|made together.').split('|');
  const bookBtn=(cls,label)=>book?h('a',{class:'bl-btn '+cls,href:book,target:'_blank',rel:'noopener'},label||'Book on Vagaro',ico('arrow',16,'')):null;
  const callBtn=(cls,label)=>C.tel?h('a',{class:'bl-btn '+cls,href:C.tel},ico('phone',16,''),label||('Call '+C.phoneTxt)):null;
  const go=id=>()=>scrollTo(id);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hd=(n,t,p)=>h('div',{class:'bl-head rv'},h('span',{class:'bl-num'},n),h('h2',null,t),p?h('p',null,p):null);
  const sec=(id,cls,...kids)=>h('section',{class:'bl-sec '+(cls||''),id},h('div',{class:'bl-wrap'},kids));
  const ART=[['rose','Rose','Illustrative color'],['flower','Bloom','Ornamental'],['rosebud','Rosebud','Illustrative color'],['moth','Butterfly','Neo-traditional'],['dagger','Dagger','Neo-traditional'],['snake','Snake','Neo-traditional'],['orn','Sun ornament','Ornamental']];
  const artM=k=>k==='flower'?BLA.flower(7,76,30):BLA[k]();

  /* ---- top, nav ---- */
  const top=h('div',{class:'bl-top'},h('div',{class:'bl-wrap bl-top-in'},st?h('span',{class:'bl-st'},h('i',{class:'bl-dot'+(st.open?' on':'')}),h('b',null,st.text),' '+st.sub):null,h('span',{class:'bl-age'},'18+ only')));
  const nav=h('header',{class:'bl-nav'},h('div',{class:'bl-wrap bl-nav-in'},
    h('a',{class:'bl-brand',href:'#',onclick:e=>{ e.preventDefault(); scrollTo('b-top'); }},blSvg(BLA.flower(6,44,22),'bl-mk'),h('b',null,'BLOOM'),h('i',null,'TATTOO')),
    h('nav',{class:'bl-links'},[['b-gal','Gallery'],['b-try','Try it on'],['b-care','Healing'],['b-faq','FAQ'],['b-visit','Visit']].map(([id,l])=>h('button',{type:'button',onclick:go(id)},l))),
    h('div',{class:'bl-nav-r'},callBtn('ghost sm','Call'),bookBtn('hot sm','Book'))));

  /* ---- cover: flash wall ---- */
  const wall=[['rose',4,8,150,-12,'w'],['dagger',66,2,120,9,'o'],['moth',78,40,150,-8,'w'],['snake',40,52,110,14,'o'],['flower',2,54,130,10,'o'],['orn',86,76,100,-14,'w']];
  const coll=h('div',{class:'bl-coll','aria-hidden':'true'},wall.map(([k,l,t,w,r,c],i)=>h('div',{class:'bl-fl '+c,style:'left:'+l+'%;top:'+t+'%;width:'+w+'px;transform:rotate('+r+'deg);animation-delay:'+(i*.35)+'s'},blSvg(artM(k)))));
  const hero=h('section',{class:'bl-hero',id:'b-top'},coll,h('div',{class:'bl-wrap bl-hero-in'},
    h('span',{class:'bl-kick'},[C.cat||'Tattoo studio',(C.city||'Dubuque, IA')].join(' / ')),
    h('h1',null,h('span',null,heads[0]),heads[1]?h('span',{class:'ol'},heads[1]):null),
    h('p',{class:'bl-lead'},C.tag||'Josh Clicquennoi works with you on the design, from first idea to finished piece.'),
    h('div',{class:'bl-cta'},bookBtn('hot'),callBtn('ghost'))));
  const MQ=['Black and grey realism','Neo-traditional','Illustrative color','Ornamental','Custom designs','Dubuque, Iowa'];
  const mqItems=()=>MQ.map(t=>h('span',null,t));
  const marquee=h('div',{class:'bl-mq','aria-hidden':'true'},h('div',{class:'bl-mq-in'},mqItems(),mqItems(),mqItems(),mqItems()));

  /* ---- gallery slideshow (auto-advancing) ---- */
  const real=(Array.isArray(x.gallery)?x.gallery:[]).filter(u=>typeof u==='string'&&/^https:\/\/[^\s"'<>]+$/.test(u)).slice(0,12);
  const SAMPLE=[['rose','Illustrative color','Rose study','#1b1b1d'],['moth','Neo-traditional','Butterfly study','#241108'],['dagger','Neo-traditional','Dagger','#1b1b1d'],['sphere','Black and grey realism','Soft shading','#101112'],['orn','Ornamental','Sun ornament','#241108'],['snake','Illustrative color','Coiled snake','#1b1b1d']];
  const slides=real.length?real.map((u,i)=>({img:u,cap:'Work by Josh Clicquennoi',sub:'Photo '+(i+1)})):SAMPLE.map(([k,sty,t,bgc])=>({art:k,cap:t,sub:sty,bg:bgc}));
  const stage=h('div',{class:'bl-stage',tabindex:'0','aria-roledescription':'carousel','aria-label':'Tattoo gallery'});
  const slEls=slides.map((s,i)=>{ const el=h('figure',{class:'bl-slide'+(i===0?' on':''),'aria-hidden':i===0?'false':'true',style:s.bg?'background:'+s.bg:null},
      s.img?h('img',{src:s.img,alt:'Tattoo by Josh Clicquennoi, photo '+(i+1),loading:i?'lazy':'eager'}):blSvg(BLA[s.art](),'bl-slart'),
      h('figcaption',null,h('b',null,s.cap),h('span',null,s.sub))); stage.append(el); return el; });
  const bar=h('i',{class:'bl-bar'}), count=h('span',{class:'bl-count'},'01 / '+String(slides.length).padStart(2,'0'));
  let cur=0, paused=false, tick=null, inView=true; const ms=4600;
  const dots=slides.map((s,i)=>h('button',{type:'button',class:'bl-dot2'+(i===0?' on':''),'aria-label':'Show slide '+(i+1),onclick:()=>{ show(i); restart(); }}));
  function show(i){ cur=(i+slides.length)%slides.length; slEls.forEach((e,k)=>{ e.classList.toggle('on',k===cur); e.setAttribute('aria-hidden',k===cur?'false':'true'); }); dots.forEach((d,k)=>d.classList.toggle('on',k===cur)); count.textContent=String(cur+1).padStart(2,'0')+' / '+String(slides.length).padStart(2,'0'); }
  function restart(){ bar.style.animation='none'; void bar.offsetWidth; bar.style.animation=''; clearTimeout(tick); if(!paused&&!reduce&&inView) tick=setTimeout(next,ms); }
  function next(){ if(!stage.isConnected) return; show(cur+1); restart(); }
  const pause=v=>{ paused=v; stage.parentNode&&stage.parentNode.classList.toggle('paused',v||reduce); if(v) clearTimeout(tick); else restart(); };
  stage.addEventListener('mouseenter',()=>pause(true)); stage.addEventListener('mouseleave',()=>pause(false)); stage.addEventListener('focusin',()=>pause(true)); stage.addEventListener('focusout',()=>pause(false));
  stage.addEventListener('keydown',e=>{ if(e.key==='ArrowRight'){ show(cur+1); restart(); } if(e.key==='ArrowLeft'){ show(cur-1); restart(); } });
  let sx=null; stage.addEventListener('touchstart',e=>{ sx=e.touches[0].clientX; },{passive:true}); stage.addEventListener('touchend',e=>{ if(sx==null) return; const dx=e.changedTouches[0].clientX-sx; if(Math.abs(dx)>40){ show(cur+(dx<0?1:-1)); restart(); } sx=null; },{passive:true});
  setTimeout(()=>{ if('IntersectionObserver' in window){ new IntersectionObserver(es=>es.forEach(e=>{ inView=e.isIntersecting; if(inView) restart(); else clearTimeout(tick); })).observe(stage); } restart(); },200);
  const galBox=h('div',{class:'bl-gal rv'+(reduce?' paused':'')},stage,h('div',{class:'bl-gbar'},h('button',{type:'button',class:'bl-nb','aria-label':'Previous slide',onclick:()=>{ show(cur-1); restart(); }},ico('arrow',18,'')),h('div',{class:'bl-dots'},dots),count,h('button',{type:'button',class:'bl-nb nxt','aria-label':'Next slide',onclick:()=>{ show(cur+1); restart(); }},ico('arrow',18,''))),h('span',{class:'bl-track'},bar));
  const gal=sec('b-gal','bl-dk',hd('01','The work, rolling.','Moves on its own. Hover or tap to hold a slide.'),galBox,
    real.length?null:h('p',{class:'bl-note'},'Sample flash art for the preview, not Bloom Tattoo’s tattoos. Josh’s real photos replace these once the shop sends them.'));

  /* ---- styles: four panels ---- */
  const STY=[
    {k:'Black and grey realism',a:'sphere',d:'Smooth shading and fine detail in black and grey ink. Josh’s main emphasis, done large.'},
    {k:'Neo-traditional',a:'dagger',d:'Bold outlines and rich color with more depth and detail than old-school flash.'},
    {k:'Illustrative color',a:'rose',d:'Line and color that read like an illustration, with room for custom ideas.'},
    {k:'Ornamental',a:'orn',d:'Patterns, symmetry and decorative detail that follow the body.'}];
  const styles=sec('b-styles','bl-lt',hd('02','Four ways Josh works.','Simple sample drawings, not finished tattoos.'),
    h('div',{class:'bl-sty'},STY.map((s,i)=>h('div',{class:'bl-sc rv'},h('span',{class:'bl-n'},'0'+(i+1)),h('div',{class:'bl-sa'},blSvg(BLA[s.a](),'bl-draw2')),h('h3',null,s.k),h('p',null,s.d)))));

  /* ---- artist ---- */
  const stats=Array.isArray(x.stats)&&x.stats.length?x.stats:[['11+','years tattooing'],['5.0','on Google, about 120 reviews'],['18+','studio, no children'],['1:1','design work with you']];
  const artist=sec('b-artist','bl-hot',h('div',{class:'bl-2c'},
    h('div',{class:'rv'},h('span',{class:'bl-num'},'03'),h('h2',null,'Josh Clicquennoi'),
      h('p',null,'Josh has been tattooing for over eleven years, most of them in Dubuque. He believes in a collaborative approach: he works with you on the creative side so the tattoo ends up as good as it can be.'),
      h('p',null,'His main emphasis is large-scale black and grey realism, along with neo-traditional, illustrative color and ornamental work.'),bookBtn('blk')),
    h('div',{class:'bl-stats rv'},stats.slice(0,4).map(([n,l])=>h('div',null,h('b',null,n),h('span',null,l))))));

  /* ---- TRY IT ON: body visualizer ---- */
  const SKIN=['#F3D9C6','#E2B089','#B98760','#8B5D3F','#5A3A29'], INK=[['Black','#0b0b0c'],['Red','#C0182C'],['Teal','#0B7F86'],['Purple','#6B2D91']];
  const LV=['','Usually milder','Moderate','Often intense'];
  const UPI=6.06;
  const ZF=[['Neck',100,60,1.6,0,2],['Chest',100,98,5.5,0,3],['Shoulder',72,84,3.6,-25,1,1],['Upper arm',53,116,4.6,15,1,1],['Ribs',77,150,4.4,90,3,1],['Forearm',41,186,5.2,10,1,1],['Hand',34,236,2.2,0,3,1],['Thigh',81,262,8,0,1,1],['Calf',79,356,6,0,1,1],['Ankle and foot',78,404,2.6,0,3,1]];
  const ZB=[['Neck',100,60,1.6,0,2],['Upper back',100,108,7,0,1],['Shoulder blade',77,100,4,-15,1,1],['Spine',100,158,8,0,3],['Lower back',100,200,5,0,2],['Back of upper arm',53,116,4.6,15,1,1],['Back of forearm',41,186,5.2,10,2,1],['Back of thigh',81,262,8,0,2,1],['Calf',79,356,6,0,1,1],['Ankle and foot',78,404,2.6,0,3,1]];
  const expand=Z=>{ const o=[]; Z.forEach(([n,px,py,s,r,l,m])=>{ o.push({n,x:px,y:py,s,r,l}); if(m) o.push({n,x:200-px,y:py,s,r:-r,l}); }); return o; };
  const ZS={front:expand(ZF),back:expand(ZB)};
  const T={view:'front',art:'rose',ink:0,skin:1,size:ZS.front[3].s,rot:ZS.front[3].r,x:ZS.front[3].x,y:ZS.front[3].y};
  const NS='http://www.w3.org/2000/svg';
  const bodySvg=h('div',{class:'bl-fig'}); const svg=document.createElementNS(NS,'svg'); svg.setAttribute('viewBox','0 0 200 440'); svg.setAttribute('class','bl-body'); svg.setAttribute('role','img'); svg.setAttribute('aria-label','Body outline. Drag the design to place it.'); bodySvg.append(svg);
  const limbs=[[62,80,46,150,20],[46,150,36,222,17],[82,218,80,308,34],[80,308,79,400,24],[100,56,100,72,16]];
  const bodyMarkup=skin=>{ const mir=([a,b,c,d,w])=>[[a,b,c,d,w],[200-a,b,200-c,d,w]]; const L=limbs.flatMap(mir); const torso='M64 74Q100 63 136 74L132 130Q128 160 131 190L137 222Q100 237 63 222L69 190Q72 160 68 130Z';
    const ell=[[100,34,17,21],[34,236,8,12],[166,236,8,12],[76,418,14,7],[124,418,14,7]];
    let e='<g stroke="rgba(0,0,0,.45)" stroke-linecap="round" fill="rgba(0,0,0,.45)">'+L.map(([a,b,c,d,w])=>'<path d="M'+a+' '+b+'L'+c+' '+d+'" stroke-width="'+(w+3)+'" fill="none"/>').join('')+'<path d="'+torso+'" stroke-width="3" stroke-linejoin="round"/>'+ell.map(([cx,cy,rx,ry])=>'<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+(rx+1.5)+'" ry="'+(ry+1.5)+'" stroke="none"/>').join('')+'</g>';
    let s='<g stroke="'+skin+'" stroke-linecap="round" fill="'+skin+'">'+L.map(([a,b,c,d,w])=>'<path d="M'+a+' '+b+'L'+c+' '+d+'" stroke-width="'+w+'" fill="none"/>').join('')+'<path d="'+torso+'" stroke-width="1" stroke-linejoin="round"/>'+ell.map(([cx,cy,rx,ry])=>'<ellipse cx="'+cx+'" cy="'+cy+'" rx="'+rx+'" ry="'+ry+'" stroke="none"/>').join('')+'</g>';
    return e+s; };
  const bodyG=document.createElementNS(NS,'g'), detG=document.createElementNS(NS,'g'), dotG=document.createElementNS(NS,'g'), tatG=document.createElementNS(NS,'g');
  svg.append(bodyG,detG,dotG,tatG);
  const detail=()=>{ detG.innerHTML=T.view==='back'?'<path d="M100 76L100 214" stroke="rgba(0,0,0,.28)" stroke-width="1.4" stroke-dasharray="2 4" fill="none"/><path d="M78 88Q92 112 98 100M122 88Q108 112 102 100" stroke="rgba(0,0,0,.22)" fill="none"/>':'<circle cx="100" cy="190" r="1.8" fill="rgba(0,0,0,.35)"/><path d="M84 112Q100 124 116 112" stroke="rgba(0,0,0,.2)" fill="none"/>'; };
  const readName=h('b',null,''), readMeta=h('span',null,''), meter=h('span',{class:'bl-meter'},h('i'),h('i'),h('i'));
  const nearest=()=>{ let b=null,d=1e9; ZS[T.view].forEach(z=>{ const q=Math.hypot(z.x-T.x,z.y-T.y); if(q<d){ d=q; b=z; } }); return {z:b,d}; };
  const side=()=>(T.x<100)===(T.view==='front')?'right':'left';
  const placeText=()=>{ const n=nearest(); if(n.d>34) return 'Between spots'; const zn=n.z.n, lat=/^(Neck|Chest|Spine|Upper back|Lower back)$/.test(zn)?'':(side()+' '); return (lat+zn).replace(/^./,c=>c.toUpperCase()); };
  const artName=()=>(ART.find(a=>a[0]===T.art)||ART[0])[1];
  const sizeTxt=()=>{ const v=T.size; return (Math.round(v*2)/2).toString()+' in'; };
  const drawTat=()=>{ const sc=T.size*UPI/160, k=T.art, ink=INK[T.ink][1]; tatG.setAttribute('class','bl-tat'); tatG.style.setProperty('--ink',ink);
    tatG.innerHTML='<g transform="translate('+T.x.toFixed(1)+' '+T.y.toFixed(1)+') rotate('+T.rot+') scale('+sc.toFixed(4)+') translate(-100 -100)"><rect x="0" y="0" width="200" height="200" fill="transparent" style="cursor:grab"/>'+artM(k)+'</g>'; };
  const paintRead=()=>{ const n=nearest(); readName.textContent=artName()+' on '+placeText().toLowerCase(); readMeta.textContent='About '+sizeTxt()+' tall'+(n.d<=34?'. '+LV[n.z.l]+' area for most people':''); meter.className='bl-meter l'+(n.d<=34?n.z.l:0); msgPre.textContent=msg(); };
  const msg=()=>{ const n=nearest(), where=n.d<=34?placeText().toLowerCase():'(not sure yet)'; return 'Hi Josh, I’d like to book a tattoo at Bloom Tattoo.\nIdea: '+artName().toLowerCase()+' design, about '+sizeTxt()+', '+INK[T.ink][0].toLowerCase()+' ink\nPlacement: '+where+'\nI am 18 or older.'; };
  const msgPre=h('pre',{class:'bl-msg'}), mActs=h('div',{class:'bl-cta'});
  const drawDots=()=>{ dotG.innerHTML=ZS[T.view].map((z,i)=>'<circle class="bl-zd" cx="'+z.x+'" cy="'+z.y+'" r="4.2" data-i="'+i+'"/>').join(''); };
  dotG.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('circle'); if(!t) return; const z=ZS[T.view][+t.getAttribute('data-i')]; T.x=z.x; T.y=z.y; T.rot=z.r; T.size=z.s; syncCtl(); full(); });
  function pt(ev){ const p=svg.createSVGPoint(); p.x=ev.clientX; p.y=ev.clientY; const m=svg.getScreenCTM(); return m?p.matrixTransform(m.inverse()):{x:T.x,y:T.y}; }
  let drag=null;
  tatG.addEventListener('pointerdown',e=>{ const q=pt(e); drag={dx:T.x-q.x,dy:T.y-q.y}; try{ tatG.setPointerCapture(e.pointerId); }catch(_){} tatG.classList.add('drag'); e.preventDefault(); });
  tatG.addEventListener('pointermove',e=>{ if(!drag) return; const q=pt(e); T.x=Math.max(8,Math.min(192,q.x+drag.dx)); T.y=Math.max(14,Math.min(430,q.y+drag.dy)); drawTat(); paintRead(); });
  const endDrag=()=>{ drag=null; tatG.classList.remove('drag'); }; tatG.addEventListener('pointerup',endDrag); tatG.addEventListener('pointercancel',endDrag);
  function full(){ bodyG.innerHTML=bodyMarkup(SKIN[T.skin]); detail(); drawDots(); drawTat(); paintRead(); paintActs(); paintHeal(); }
  function paintActs(){ const m=msg(), sms=smsHref(m); mActs.replaceChildren(...[sms?h('a',{class:'bl-btn hot',href:sms},'Text this idea'):null,h('button',{type:'button',class:'bl-btn ghost',onclick:e=>{ const b=e.currentTarget; (navigator.clipboard?navigator.clipboard.writeText(msg()):Promise.reject()).then(()=>{ b.textContent='Copied'; setTimeout(()=>b.textContent='Copy',1600); }).catch(()=>{ const r=document.createRange(); r.selectNodeContents(msgPre); const s=getSelection(); s.removeAllRanges(); s.addRange(r); }); }},'Copy'),bookBtn('ghost','Book on Vagaro')].filter(Boolean)); }
  const syncCtl=()=>{ sizeIn.value=T.size; rotIn.value=T.rot; sizeOut.textContent=sizeTxt(); };
  const sizeOut=h('b',null,''), rotOut=h('b',null,'');
  const sizeIn=h('input',{type:'range',min:'1',max:'16',step:'0.5',value:String(T.size),'aria-label':'Size in inches',oninput:e=>{ T.size=+e.target.value; sizeOut.textContent=sizeTxt(); drawTat(); paintRead(); paintActs(); }});
  const rotIn=h('input',{type:'range',min:'-180',max:'180',step:'5',value:String(T.rot),'aria-label':'Rotation',oninput:e=>{ T.rot=+e.target.value; drawTat(); }});
  const designs=h('div',{class:'bl-des'},ART.map(([k,n])=>h('button',{type:'button',class:k===T.art?'on':'','aria-label':n,title:n,onclick:e=>{ T.art=k; designs.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===e.currentTarget)); drawTat(); paintRead(); paintActs(); }},blSvg(artM(k)))));
  const inkRow=h('div',{class:'bl-sw'},INK.map(([n,c],i)=>h('button',{type:'button',class:i===T.ink?'on':'','aria-label':n+' ink',style:'--c:'+c,onclick:e=>{ T.ink=i; inkRow.querySelectorAll('button').forEach((b,k)=>b.classList.toggle('on',k===i)); drawTat(); paintRead(); paintActs(); }})));
  const skinRow=h('div',{class:'bl-sw'},SKIN.map((c,i)=>h('button',{type:'button',class:i===T.skin?'on':'','aria-label':'Skin tone '+(i+1),style:'--c:'+c,onclick:e=>{ T.skin=i; skinRow.querySelectorAll('button').forEach((b,k)=>b.classList.toggle('on',k===i)); bodyG.innerHTML=bodyMarkup(SKIN[i]); paintHeal(); }})));
  const viewRow=h('div',{class:'bl-seg'},['front','back'].map(v=>h('button',{type:'button',class:v===T.view?'on':'',onclick:e=>{ T.view=v; const z=ZS[v][v==='front'?3:5]; T.x=z.x; T.y=z.y; T.rot=z.r; T.size=z.s; viewRow.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===e.currentTarget)); syncCtl(); full(); }},v==='front'?'Front':'Back')));
  const ctl=(l,...k)=>h('div',{class:'bl-ctl'},h('span',{class:'bl-lbl'},l),k);
  const tryIt=sec('b-try','bl-dk',hd('04','Try it on.','Pick a design, then drag it onto the body or tap a dot. Resize it, turn it and see roughly how big it will sit. Sample art only.'),
    h('div',{class:'bl-lab rv'},
      h('div',{class:'bl-stage2'},bodySvg,h('p',{class:'bl-hint'},'Drag the design. Tap a dot to jump to a spot.')),
      h('div',{class:'bl-panel'},
        ctl('Design',designs),
        h('div',{class:'bl-two'},ctl('Size',sizeIn,h('span',{class:'bl-ro'},sizeOut,' tall')),ctl('Turn',rotIn)),
        h('div',{class:'bl-two'},ctl('Ink',inkRow),ctl('Skin tone',skinRow)),
        ctl('View',viewRow),
        h('div',{class:'bl-read'},readName,readMeta,meter),
        h('span',{class:'bl-lbl'},'Send it to Josh'),msgPre,mActs,
        h('p',{class:'bl-note'},'Sizes are approximate, based on an average adult. How a spot feels is a general guide, and everyone is different.'))));

  /* ---- healing slider ---- */
  const HS=[[0,2,'Fresh','Covered the way your artist tells you. The skin is red and tender, like a sunburn.','Wash gently with mild, fragrance-free soap and pat dry.'],[3,6,'Settling in','Redness fades. It may start to feel tight.','Wash a couple of times a day and use a thin layer of unscented moisturizer. Do not scrub.'],[7,14,'Flaking','Light flaking and itching. The art can look cloudy under the peel.','Do not pick or scratch. Keep moisturizing lightly.'],[15,28,'Settled','The surface looks smooth and the lines sharpen up. Deeper healing keeps going.','Skip soaking in pools, baths and hot tubs until fully healed. Keep it out of direct sun.']];
  const healBox=h('div',{class:'bl-skin'},h('div',{class:'bl-skin-art'}),h('div',{class:'bl-red'}),h('div',{class:'bl-flk'}));
  const healArt=blSvg(BLA.rosebud(),'bl-hart'); healBox.querySelector('.bl-skin-art').append(healArt);
  const dayOut=h('b',null,'Day 0'), stOut=h('h3',null,''), whatOut=h('p',null,''), tipOut=h('p',{class:'bl-tip'},'');
  const flk=healBox.querySelector('.bl-flk'); flk.innerHTML=Array.from({length:26},(_,i)=>'<i style="left:'+((i*37)%92+3)+'%;top:'+((i*53)%86+6)+'%;width:'+(4+(i*7)%9)+'px;height:'+(3+(i*5)%6)+'px;transform:rotate('+(i*41%90)+'deg)"></i>').join('');
  function paintHeal(){ const d=+dayIn.value, s=HS.find(a=>d>=a[0]&&d<=a[1])||HS[3]; dayOut.textContent='Day '+d; stOut.textContent=s[2]; whatOut.textContent=s[3]; tipOut.textContent=s[4];
    healBox.style.background=SKIN[T.skin]; healBox.style.setProperty('--ink',INK[T.ink][1]);
    const red=Math.max(0,1-d/7)*.55, flake=d<4?0:d<=14?Math.min(1,(d-3)/4)*(d>10?Math.max(0,(15-d)/5):1):0, cloud=d<3?1:d<=14?1-.5*Math.min(1,(d-2)/5)*(d>10?Math.max(0,(15-d)/5):1):1;
    healBox.querySelector('.bl-red').style.opacity=red; flk.style.opacity=flake; healBox.querySelector('.bl-skin-art').style.opacity=cloud.toFixed(2); healBox.querySelector('.bl-skin-art').style.filter=d>=3&&d<=14?'blur('+(1.2*(d>10?Math.max(0,(15-d)/5):1)).toFixed(1)+'px)':'none'; }
  const dayIn=h('input',{type:'range',min:'0',max:'28',step:'1',value:'0','aria-label':'Days since your appointment',oninput:paintHeal});
  const care=sec('b-care','bl-lt',hd('05','Watch it heal.','Slide through the first four weeks. General guidance for most tattoos. Always follow the instructions Josh gives you, since they come first.'),
    h('div',{class:'bl-heal rv'},healBox,h('div',{class:'bl-hr'},h('div',{class:'bl-day'},dayOut),dayIn,h('div',{class:'bl-ticks'},h('span',null,'Day 0'),h('span',null,'Week 1'),h('span',null,'Week 2'),h('span',null,'Week 4')),stOut,whatOut,tipOut)));

  /* ---- before you go ---- */
  const pdate=h('input',{type:'datetime-local',id:'bl-dt','aria-label':'Appointment date and time'}), pout=h('div',{class:'bl-out'},'Pick your appointment time to see your deadline.');
  pdate.addEventListener('input',()=>{ const v=pdate.value; if(!v){ pout.textContent='Pick your appointment time to see your deadline.'; return; } const d=new Date(v); if(isNaN(d)) return; const dl=new Date(d.getTime()-72*3600*1000), f=o=>o.toLocaleString('en-US',{weekday:'long',month:'long',day:'numeric',hour:'numeric',minute:'2-digit'}); const left=dl.getTime()-Date.now(), tot=d.getTime()-Date.now(); const pct=tot>0?Math.max(0,Math.min(100,(left/tot)*100)):0;
    pout.replaceChildren(h('span',{class:'bl-lbl'},'Last chance to keep your deposit'),h('b',null,f(dl)),h('span',{class:'bl-tbar'},h('i',{style:'width:'+(100-pct)+'%'}),h('em',{style:'left:'+(100-pct)+'%'})),h('small',null,left<0?'That time has passed. Changes now would forfeit the deposit, so call the shop.':'Rescheduling or canceling after this time forfeits the deposit (72 hours before your appointment).')); });
  const PREP=['Moisturize your skin before and after','Arrive well rested','Eat a meal beforehand','Wear comfortable clothing that gives access to the spot'];
  const prog=h('b',{class:'bl-prog'},'0 of '+PREP.length+' ready'), pbar=h('i',{class:'bl-pfill'});
  const checks=PREP.map(t=>h('label',{class:'bl-chk'},h('input',{type:'checkbox',onchange:()=>{ const n=checks.filter(c=>c.querySelector('input').checked).length; prog.textContent=n+' of '+PREP.length+' ready'+(n===PREP.length?'. You’re set.':''); pbar.style.width=(n/PREP.length*100)+'%'; }}),h('span',null,t)));
  const prep=sec('b-prep','bl-dk',hd('06','Before you go.'),
    h('div',{class:'bl-2c bl-tools'},
      h('div',{class:'bl-card rv'},h('h3',null,'Deposit deadline'),h('p',{class:'bl-sm'},'Changes need 3 days’ notice to keep your deposit.'),h('label',{class:'bl-lbl',for:'bl-dt'},'Appointment date and time'),pdate,pout),
      h('div',{class:'bl-card rv'},h('h3',null,'Prep checklist'),h('p',{class:'bl-sm'},'From the shop’s own tips.'),checks,h('span',{class:'bl-ptrack'},pbar),prog)));

  /* ---- faq ---- */
  const FAQ=[['Can I reschedule my appointment?','Changes need 3 days’ notice to keep your deposit. If you cancel or reschedule within 72 hours of your appointment, the deposit is forfeited.'],['What payment options are there?','Cash is accepted, along with debit and credit cards from Visa, MasterCard, Discover and American Express.'],['Can I bring someone for support?','Yes. You’re welcome to bring a guest or two, and there is seating for them.'],['Is Bloom Tattoo LGBTQIA+ friendly?','Yes. The studio is an inclusive, nonjudgmental space.'],['Are children allowed in the studio?','No. Clients must be 18 to get tattooed, and everyone who enters the studio must be an adult.'],['How can I prepare for my appointment?','Moisturize before and after, arrive well rested, eat a meal beforehand and wear comfortable clothing that gives access to the area.']];
  const faq=sec('b-faq','bl-lt',hd('07','Good to know.'),h('div',{class:'bl-faq rv'},FAQ.map(([q,a])=>h('details',null,h('summary',null,q),h('p',null,a)))));

  /* ---- visit ---- */
  const visit=sec('b-visit','bl-hot',hd('08','Come meet Josh.'),
    h('div',{class:'bl-2c'},
      h('div',{class:'bl-card inv rv'},h('span',{class:'bl-lbl'},'Bloom Tattoo'),addrTxt?h('p',{class:'bl-addr'},ico('pin',18,''),addrTxt):null,C.tel?h('p',{class:'bl-addr'},ico('phone',18,''),h('a',{href:C.tel},C.phoneTxt)):null,
        h('div',{class:'bl-cta'},bookBtn('hot'),C.maps?h('a',{class:'bl-btn ghost',href:C.maps,target:'_blank',rel:'noopener'},'Get directions'):null),h('p',{class:'bl-note'},'18 and over only. Bring a photo ID.')),
      h('div',{class:'bl-card inv bl-hrs rv'},h('span',{class:'bl-lbl'},'Studio hours'),hoursRows(C),h('p',{class:'bl-note'},'Hours are as listed online. Work is by appointment, so call to confirm.'))));
  const foot=h('footer',{class:'bl-foot'},h('div',{class:'bl-wrap bl-foot-in'},h('b',null,'BLOOM TATTOO'),addrTxt?h('span',null,addrTxt):null,C.tel?h('a',{href:C.tel},C.phoneTxt):null,h('em',null,'© '+new Date().getFullYear()+' '+name)));
  const pg=h('div',{class:'demo bl on'},top,nav,hero,marquee,gal,styles,artist,tryIt,care,prep,faq,visit,foot);
  full(); syncCtl(); paintHeal();
  return pg;
}

function zephyr(C){
  const x=C.x, name=C.name, ok=u=>typeof u==='string'&&/^https:\/\/[^\s"'<>]+$/.test(u)?u:'';
  const Z=id=>'https://images.unsplash.com/photo-'+id+'?auto=format&fit=crop&w=1600&q=72';
  const heroPic=ok(x.heroPhoto)||Z('1662624919582-007c57fdc3dd');
  const aboutPic=ok(x.aboutPhoto)||Z('1724660583307-e7b0c5c5fcd9');
  const addrTxt=[C.addr,C.city].filter(Boolean).join(', ');
  const ZD=i=>'https://images.unsplash.com/photo-'+i+'?auto=format&fit=crop&w=1000&q=72';
  const zDef=/^zephyr\b/i.test(name)?[{n:'Home Windows',d:'New and replacement windows for every room.',img:ZD('1514994792087-578fe80d0ff9')},{n:'Entry Doors',d:'Front and side doors that look sharp and seal tight.',img:ZD('1762012591496-e9f42d84fa1e')},{n:'Patio & Glass Doors',d:'Let the light in and step outside.',img:ZD('1702724758750-9ff8d50f02e5')},{n:'Commercial Windows & Doors',d:'Glass and doors for storefronts and offices.',img:ZD('1520362143485-8f69eee01289')},{n:'Replacement Glass & Mirrors',d:'Broken panes and custom mirrors cut to size.',img:ZD('1613244288805-020d7d11c655')}]:null;
  if(zDef&&!x.since) x.since='1951';
  const svc=(Array.isArray(x.services)&&x.services.length?x.services:zDef?zDef:C.items.slice(0,6).map(i=>({n:i.name,d:i.desc||'',img:i.photo}))).filter(s=>s&&s.n).slice(0,6);
  const lines=Array.isArray(x.heroLines)&&x.heroLines.length===3?x.heroLines:['Windows','Doors','& Glass'];
  const since=/^(18|19|20)\d\d$/.test(String(x.since||''))?String(x.since):'';
  const jumpA=(id,t)=>h('a',{href:'#'+id,onclick:e=>{e.preventDefault();scrollTo(id);}},t);
  const cta=C.tel?h('a',{class:'zp-btn',href:C.tel},'Get a Quote',h('span',{class:'zp-btn-i'},zpIco('arrow'))):h('a',{class:'zp-btn',href:'#zp-visit',onclick:e=>{e.preventDefault();scrollTo('zp-visit');}},'Contact Us',h('span',{class:'zp-btn-i'},zpIco('arrow')));
  const isZ=/^zephyr\b/i.test(name); const logoSrc=ok(x.logoUrl)||(isZ?'https://riverbendwebco.com/demo/img/zephyr-logo.png':'')||C.logo; const brand=h('a',{class:'zp-brand',href:'#',onclick:e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});}},logoSrc?h('img',{src:logoSrc,alt:name}):h('span',{class:'zp-mark','aria-hidden':'true'},h('i'),h('i')),logoSrc?null:h('span',null,name));
  const links=()=>[svc.length?jumpA('zp-products','Products'):null,jumpA('zp-solutions','Services'),jumpA('zp-about','About'),jumpA('zp-visit','Hours & Location')];
  const callBtn=C.tel?h('a',{class:'zp-call',href:C.tel},zpIco('phone'),h('span',null,C.phoneTxt)):null;
  const nav=h('header',{class:'zp-nav'},h('div',{class:'zp-w zp-nav-in'},brand,h('nav',{class:'zp-links'},links()),callBtn),
    h('nav',{class:'zp-mnav','aria-label':'Sections'},links()));
  const card=h('div',{class:'zp-card rv'},h('small',null,since?'Dubuque, since '+since:(C.city||'Local')),h('b',null,'Your local window & door shop'),
    C.tel?h('a',{href:C.tel},'Call for a free quote',zpIco('arrow')):null);
  const hero=h('section',{class:'zp-hero'},
    bg(h('div',{class:'zp-hero-bg'}),heroPic,'linear-gradient(90deg,rgba(10,8,60,.78) 0%,rgba(10,8,60,.35) 55%,rgba(10,8,60,.55) 100%)'),
    h('div',{class:'zp-w zp-hero-in'},
      h('p',{class:'zp-hero-p'},C.tag||('Residential and commercial windows and doors for homes and businesses around '+(C.city?C.city.split(',')[0]:'town')+'.')),
      h('h1',{class:'zp-h1'},h('span',null,lines[0]),h('span',{class:'cu'},lines[1]),h('span',{class:'thin'},lines[2])),
      h('div',{class:'zp-quick'},C.tel?h('a',{href:C.tel},zpIco('phone'),'Call us'):null,C.maps?h('a',{href:C.maps,target:'_blank',rel:'noopener'},zpIco('pin'),'Directions'):null,svc.length?h('a',{href:'#zp-products',onclick:e=>{e.preventDefault();scrollTo('zp-products');}},zpIco('win'),'Products'):null),
      card));
  const label=t=>h('div',{class:'zp-label'},h('span',{class:'zp-line','aria-hidden':'true'}),t);
  const about=h('section',{class:'zp-sec',id:'zp-about'},h('div',{class:'zp-w zp-about'},
    h('div',{class:'zp-about-pic rv'},bg(h('div',{class:'zp-about-img'}),aboutPic),since?h('div',{class:'zp-badge'},h('span',null,'Serving '+(C.city?C.city.split(',')[0]:'our town')+' since'),h('b',null,since)):null),
    h('div',{class:'zp-about-t rv'},label('About Us'),h('h2',{class:'zp-h2'},x.aboutTitle||'Windows and doors, built and installed right.'),
      h('p',null,C.about||(name+' helps homeowners and businesses choose, order and install the right windows and doors, with replacement glass and mirrors cut to fit.')),
      svc.length?h('ul',{class:'zp-ticks'},svc.slice(0,4).map(s=>h('li',null,zpIco(zpIcoFor(s.n)),s.n))):null,
      h('div',{class:'zp-row'},cta.cloneNode(true),C.tel?h('a',{class:'zp-tel',href:C.tel},zpIco('phone'),C.phoneTxt):null))));
  const today=C.today;
  const sol=h('section',{class:'zp-sec zp-soft',id:'zp-solutions'},h('div',{class:'zp-w'},
    h('div',{class:'zp-head rv'},label('What We Do'),h('h2',{class:'zp-h2'},'Window & door solutions for home and business')),
    h('div',{class:'zp-bento'},
      bg(h('div',{class:'zp-b zp-b-pic rv'}),ok((svc[0]||{}).img)||heroPic,'linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(10,8,60,.75) 100%)'),
      h('div',{class:'zp-b zp-b-txt rv'},zpIco('home'),h('b',null,'For your home'),h('p',null,'New and replacement windows and doors, sized for your house and installed by a local crew.')),
      h('div',{class:'zp-b zp-b-cu rv'},zpIco('shop'),h('b',null,'For your business'),h('p',null,'Commercial windows, doors and glass for storefronts and offices.')),
      h('div',{class:'zp-b zp-b-txt rv'},zpIco('glass'),h('b',null,'Glass & mirrors'),h('p',null,'Broken pane or a new bathroom mirror? Bring the size and we will cut it to fit.')),
      h('div',{class:'zp-b zp-b-dark rv'},h('small',null,'Visit the showroom'),h('b',null,addrTxt||C.city||name),today?h('p',null,zpIco('clock'),'Open today '+today):null,
        C.maps?h('a',{class:'zp-btn sm',href:C.maps,target:'_blank',rel:'noopener'},'Directions',h('span',{class:'zp-btn-i'},zpIco('arrow'))):null))));
  const prod=svc.length?h('section',{class:'zp-sec',id:'zp-products'},h('div',{class:'zp-w zp-prod'},
    h('div',{class:'zp-prod-l rv'},label('Products'),h('h2',{class:'zp-h2'},'What we install'),h('p',null,'Stop in to see samples, or call and tell us what you need. We will help you pick the right fit.'),cta.cloneNode(true)),
    h('div',{class:'zp-prod-g'},svc.map((s,i)=>h('div',{class:'zp-p rv'},bg(h('div',{class:'zp-p-img'}),ok(s.img)||aboutPic),
      h('div',{class:'zp-p-bar'},h('div',null,h('small',null,String(i+1).padStart(2,'0')),h('b',null,s.n),s.d?h('p',null,s.d):null),h('span',{class:'zp-p-go'},zpIco('arrow')))))))):null;
  const revs=C.reviews.length?h('section',{class:'zp-sec zp-soft'},h('div',{class:'zp-w'},h('div',{class:'zp-head rv'},label('Reviews'),h('h2',{class:'zp-h2'},'What customers say')),
    h('div',{class:'zp-revs'},C.reviews.slice(0,3).map(r=>h('figure',{class:'zp-rev rv'},h('div',{class:'zp-stars','aria-label':'5 stars'},'★★★★★'),h('blockquote',null,short(r.text,240)),h('figcaption',null,r.name)))))):null;
  const mapQ=encodeURIComponent([name,addrTxt].filter(Boolean).join(', '));
  const visit=h('section',{class:'zp-visit',id:'zp-visit'},h('div',{class:'zp-w zp-visit-in'},
    h('div',{class:'zp-visit-t rv'},label('Contact'),h('h2',{class:'zp-h2'},'Come see us'),
      addrTxt?h('a',{class:'zp-li',href:C.maps||'#',target:'_blank',rel:'noopener'},zpIco('pin'),h('span',null,addrTxt)):null,
      C.tel?h('a',{class:'zp-li',href:C.tel},zpIco('phone'),h('span',null,C.phoneTxt)):null,
      C.hasHours?h('div',{class:'zp-hours'},hoursRows(C)):null),
    addrTxt?h('div',{class:'zp-map rv'},h('iframe',{src:'https://www.google.com/maps?q='+mapQ+'&output=embed',title:'Map to '+name,loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'})):null));
  const foot=h('footer',{class:'zp-foot'},h('div',{class:'zp-w zp-foot-in'},h('div',{class:'zp-foot-logo'},logoSrc?h('img',{src:logoSrc,alt:name}):h('b',null,name)),h('p',null,'Residential & commercial windows and doors'+(C.city?' in '+C.city:'')+'.'),h('small',null,'© '+new Date().getFullYear()+' '+name)));
  return h('div',{class:'zp'},nav,hero,about,sol,prod,revs,visit,foot);
}
function zpNav(){ const n=document.querySelector('.zp-nav'); if(!n) return; const f=()=>n.classList.toggle('solid',scrollY>10); addEventListener('scroll',f,{passive:true}); f(); }

/* ===================== HOMY (home cleaning, bright white cards + royal blue) ===================== */
const HC_U=id=>'https://images.unsplash.com/photo-'+id+'?auto=format&fit=crop&w=1400&q=72';
function hcI(n){ const P={
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',check:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  pin:'<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',spark:'<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  home:'<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/>',star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>'};
  const s=document.createElementNS('http://www.w3.org/2000/svg','svg'); s.setAttribute('viewBox','0 0 24 24'); s.setAttribute('aria-hidden','true'); s.innerHTML=P[n]||''; return s; }
const CM_REVIEWS=[
  ['Cleaning Momma goes out of her way to make your space sparkle! Very fair pricing, dependable, and communicative. Truly appreciate the move-out clean she provided for us. Will definitely use her company again.','Catherine Griffin'],
  ['Elizabeth never disappoints! We’ve been booking with her for nearly 2 years now and we can’t imagine using anyone else. She’s been incredibly flexible with scheduling, is very thorough with her work, and is very reasonably priced. I highly recommend Elizabeth!','Amanda Elizabeth'],
  ['Great communication, excellent work, and affordable! So glad that I’ve found her! Highly recommend!','Sarah Olive Ira'],
  ['Elizabeth did an amazing job. Everything was cleaned well and we came home to a very clean house. I have a large house and she spent all day cleaning it. I would highly recommend her to anyone. She is also very reasonable in her pricing. I am very pleased with her work.','Katelyn Vaughan'],
  ['Great cleaning person, friendly, hard working and great job.','Gretchen McCracken Nealon'],
  ['Very professional. I highly recommend.','Nelly Farge'],
  ['I have pleasure to count with the services of Cleaning Momma for more than 6 months and she’s consistently do a great job in my house. In addition, she has great rates and a range of options that allows me to select only the services that I need. I recommend her services 100%','Yomara Delgado'],
  ['I used Cleaning Momma on Sat for the first time, Liz is amazing! When I got home later I was so impressed with the way my home looked. It was a Christmas morning feeling for me. Liz is so nice and very professional. I highly recommend Cleaning Momma and will be using her in the future!','Staci Anderson'],
  ['She does a thorough job and had a satisfaction promise. I hired her to come clean while I was in labor. My home looked fantastic when we got home and I was able to just relax. She forgot to clean the inside of my fridge and when I pointed it out, she apologized a million times and was over first thing in the morning to clean it. While she was back over she redid what dishes we used and even re cleaned my stove top and counters.','Heather Stone']];
function homy(C){
  const x=C.x||{}, name=C.name, ok=u=>typeof u==='string'&&/^https:\/\/[^\s"'<>]+$/.test(u)?u:'';
  if(/cleaning\s+mom+a/i.test(name)&&!/frederick/i.test(C.city+' '+C.addr)){ C.city='Frederick, MD'; C.addr=''; C.maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name+', Frederick, MD'); }
  if(/cleaning\s+mom+a/i.test(name)){ if(/dubuque|iowa\b|\bIA\b/i.test(C.tag)) C.tag=''; if(/dubuque|iowa\b|\bIA\b/i.test(C.about)) C.about=''; }
  const town=C.city?C.city.split(',')[0]:'your area';
  const isCM=/cleaning\s+mom+a/i.test(name);
  if(isCM) C.reviews=CM_REVIEWS.map(([text,n])=>({text,name:n}));
  if(isCM){ C.hours=['8am - 6pm','8am - 6pm','9am - 5pm','8am - 12pm','8am - 6pm','8am - 5pm','8am - 5pm']; C.hasHours=true; C.today=C.hours[todayIx()]; C.daysOpen=7; }
  const heroPic=ok(x.heroPhoto)||HC_U('1758273705627-937374bfa978');
  const aboutPic=ok(x.aboutPhoto)||HC_U('1758273238415-01ec03d9ef27');
  const defs=[{n:'Home Cleaning',d:'Regular or one-time cleaning that keeps your home fresh and tidy, on your schedule.',img:HC_U('1646980241033-cd7abda2ee88')},
    {n:'Deep Cleaning',d:'A top-to-bottom clean for the spots that get missed: baseboards, furniture, floors and more.',img:HC_U('1686178827149-6d55c72d81df')},
    {n:'Move-In & Move-Out',d:'Start fresh in a new place or leave the old one spotless.',img:HC_U('1647381518264-97ff1835026f')}];
  const extra=[HC_U('1740657254989-42fe9c3b8cce'),HC_U('1563453392212-326f5e854473'),HC_U('1581578731548-c64695cc6952')];
  const svc=(Array.isArray(x.services)&&x.services.length?x.services:C.items.length?C.items.slice(0,6).map(i=>({n:i.name,d:i.desc||'',img:i.photo})):defs).filter(v=>v&&v.n).slice(0,6)
    .map((v,i)=>Object.assign({},v,{img:ok(v.img)||(defs[i]||{}).img||extra[i%extra.length]}));
  const go=id=>e=>{ e.preventDefault(); menu.hidden=true; scrollTo(id); };
  const A=(id,t)=>h('a',{href:'#'+id,onclick:go(id)},t);
  const links=()=>[A('hc-top','Home'),A('hc-about','About'),A('hc-services','Services'),A('hc-how','How It Works'),C.reviews.length?A('hc-reviews','Reviews'):null,A('hc-contact','Hours')];
  const book=(cls,t)=>C.tel?h('a',{class:'hc-btn '+(cls||''),href:C.tel},t||'Book Now'):h('a',{class:'hc-btn '+(cls||''),href:'#hc-contact',onclick:go('hc-contact')},t||'Book Now');
  const logo=ok(x.logoUrl)||C.logo;
  const menu=h('nav',{class:'hc-menu',hidden:true},links(),book('','Call to Book'));
  const nav=h('header',{class:'hc-nav'},h('div',{class:'hc-w'},h('div',{class:'hc-bar'},
    h('a',{class:'hc-brand',href:'#',onclick:go('hc-top')},logo?h('img',{src:logo,alt:name}):null,h('span',null,name)),
    h('nav',{class:'hc-links'},links()),
    C.tel?h('a',{class:'hc-btn sm hc-hide-s',href:C.tel},'Contact Us'):null,
    h('button',{type:'button',class:'hc-burger','aria-label':'Menu',onclick:()=>{menu.hidden=!menu.hidden;}},hcI('menu'))),menu));
  const chip=(t,ic)=>h('span',{class:'hc-chip'},hcI(ic||'spark'),t);
  const rv=C.reviews;
  const heroRev=()=>{ let k=0; const p=h('p',{class:'in'}), sm=h('small',{class:'in'});
    const put=()=>{ const r=rv[k%rv.length]; [p,sm].forEach(e=>{e.classList.remove('in'); void e.offsetWidth; e.classList.add('in');}); p.textContent='“'+short(r.text,115)+'”'; sm.textContent=r.name; };
    put(); const t=setInterval(()=>{ if(!p.isConnected){clearInterval(t);return;} k++; put(); },3000);
    return h('div',{class:'hc-hero-rev'},isCM?h('span',{class:'hc-fb light'},h('span',{class:'hc-fb-i'},'f'),'100% recommend · 15 reviews'):h('div',{class:'hc-stars'},[0,1,2,3,4].map(()=>hcI('star'))),p,sm); };
  const hero=h('section',{class:'hc-hero-s',id:'hc-top'},h('div',{class:'hc-w'},
    bg(h('div',{class:'hc-hero'}),heroPic,'linear-gradient(90deg,rgba(8,14,30,.72) 0%,rgba(8,14,30,.35) 55%,rgba(8,14,30,.1) 100%)'),
    h('div',{class:'hc-hero-in'},
      h('div',{class:'hc-hero-t'},
        h('h1',null,x.headline||'Home cleaning you can count on'),
        h('p',null,C.tag||('Enjoy a spotless home with friendly, trusted cleaners in '+town+'. Flexible, careful and on time.')),
        h('div',{class:'hc-hero-cta'},book('','Book Now'),h('a',{class:'hc-link light',href:'#hc-services',onclick:go('hc-services')},'See Our Services'))),
      rv.length?heroRev():
        (C.today?h('div',{class:'hc-hero-rev'},h('b',{class:'hc-open'},hcI('clock'),'Open today'),h('p',null,C.today),h('small',null,town)):null))));
  const about=h('section',{class:'hc-sec',id:'hc-about'},h('div',{class:'hc-w hc-about'},
    h('div',{class:'hc-card hc-about-t rv'},chip('About Us','home'),
      h('h2',null,x.aboutTitle||'Bringing freshness, comfort and care to every home'),
      h('p',{class:'hc-mut'},C.about?short(C.about,420):(name+' goes beyond a quick surface clean. We take care of your home the way we would our own, so you can come back to a space that feels fresh.')),
      h('ul',{class:'hc-ticks'},svc.slice(0,4).map(v=>h('li',null,hcI('check'),v.n))),
      book('sm','Get in Touch')),
    bg(h('div',{class:'hc-about-pic rv'}),aboutPic)));
  const stats=[[dayRange(C.hours)||'Every week',C.daysOpen?'Open '+(C.daysOpen===7?'seven days a week':C.daysOpen+' days a week'):'Open all week','Weekdays and weekends, so you can book a time that works for you.'],
    [town,'Local to '+town,'A '+town+' cleaning team that knows the area and treats your home with care.'],
    [C.today?C.today.replace(/\s*-\s*/,' to '):'Call us',C.today?'Open today':'Book a cleaning',C.tel?'Call '+C.phoneTxt+' to set up your cleaning.':'Reach out to set up your cleaning.']];
  const statRow=h('section',{class:'hc-sec tight'},h('div',{class:'hc-w hc-stats'},stats.map(([a,b,c])=>h('div',{class:'hc-card hc-stat rv'},h('b',null,a),h('div',null,h('strong',null,b),h('p',{class:'hc-mut'},c))))));
  const services=h('section',{class:'hc-sec',id:'hc-services'},h('div',{class:'hc-w'},
    h('div',{class:'hc-card hc-head rv'},chip('Service'),h('h2',null,'Home and office cleaning you can trust'),h('p',{class:'hc-mut'},'From cozy apartments to busy offices, we clean every space with the same attention to detail.')),
    h('div',{class:'hc-svcs n'+Math.min(svc.length,3)},svc.map(v=>bg(h('article',{class:'hc-svc rv'},h('div',{class:'hc-svc-t'},h('h3',null,v.n),v.d?h('p',null,v.d):null,book('sm','Book Now'))),v.img,'linear-gradient(180deg,rgba(8,14,30,0) 35%,rgba(8,14,30,.82) 100%)')))));
  const steps=[['Reach out','Call or message us and tell us about your home and the kind of clean you need.'],['Confirm & prepare','We set a day and time that works for you and bring all the supplies.'],['We clean','Our team gets to work and makes your space shine, top to bottom.'],['Relax & enjoy','Sit back and enjoy the comfort of a freshly cleaned home.']];
  const how=h('section',{class:'hc-sec',id:'hc-how'},h('div',{class:'hc-w'},h('div',{class:'hc-blue rv'},
    h('div',{class:'hc-blue-h'},h('span',{class:'hc-chip on'},hcI('spark'),'How It Works'),h('h2',null,'Simple steps to a cleaner home'),h('p',null,'Quick, easy and reliable, from booking to enjoying your spotless home.')),
    h('div',{class:'hc-steps'},steps.map(([t,d],i)=>h('div',{class:'hc-step'},h('span',null,String(i+1).padStart(2,'0')),h('div',null,h('b',null,t),h('p',null,d))))))));
  let reviews=null;
  if(rv.length){
    let ri=0; const N=rv.length;
    const q=h('blockquote',{class:'in'}), who=h('b',{class:'in'}), av=h('span',{class:'hc-av lg'});
    const bar=h('i',{class:'hc-rbar'});
    const dots=rv.map((_,i)=>h('button',{type:'button','aria-label':'Review '+(i+1),onclick:()=>{show(i);restart();}}));
    const show=i=>{ ri=(i+N)%N; const r=rv[ri]; [q,who].forEach(e=>{e.classList.remove('in'); void e.offsetWidth; e.classList.add('in');}); q.textContent='“'+r.text+'”'; who.textContent=r.name; av.textContent=r.name.trim()[0]; dots.forEach((d,j)=>d.classList.toggle('on',j===ri)); bar.style.animation='none'; void bar.offsetWidth; bar.style.animation=''; };
    let t=null; const restart=()=>{ clearInterval(t); t=setInterval(()=>{ if(!q.isConnected){clearInterval(t);return;} show(ri+1); },3000); };
    const arrowBtn=(d,lab)=>h('button',{type:'button',class:'hc-rarr'+(d<0?' back':''),'aria-label':lab,onclick:()=>{show(ri+d);restart();}},hcI('arrow'));
    reviews=h('section',{class:'hc-sec',id:'hc-reviews'},h('div',{class:'hc-w hc-rgrid'},
      h('div',{class:'hc-card hc-rhead rv'},chip('Reviews','star'),h('h2',null,'What our customers say'),
        h('p',{class:'hc-mut'},isCM?'100% of reviewers recommend Cleaning Momma on Facebook (15 reviews).':'Real words from people who trust '+name+' with their homes.'),
        h('div',{class:'hc-rctl'},arrowBtn(-1,'Previous review'),arrowBtn(1,'Next review'))),
      h('figure',{class:'hc-card hc-rshow rv','aria-live':'polite'},
        isCM?h('span',{class:'hc-fb'},h('span',{class:'hc-fb-i'},'f'),'Recommends Cleaning Momma'):h('div',{class:'hc-stars'},[0,1,2,3,4].map(()=>hcI('star'))),
        q,h('figcaption',null,av,h('div',null,who,h('small',null,isCM?'Facebook review':'Customer review'))),
        h('div',{class:'hc-rfoot'},h('div',{class:'hc-rdots'},dots),h('span',{class:'hc-rtrack'},bar)))));
    show(0); restart();
  }
  const addrTxt=[C.addr,C.city].filter(Boolean).join(', ');
  const mapQ=encodeURIComponent([name,addrTxt].filter(Boolean).join(', '));
  const contact=h('section',{class:'hc-sec',id:'hc-contact'},h('div',{class:'hc-w hc-contact'},
    h('div',{class:'hc-card hc-ct rv'},chip('Hours & Contact','clock'),h('h2',null,'Ready for a cleaner home?'),
      C.tel?h('a',{class:'hc-li',href:C.tel},hcI('phone'),C.phoneTxt):null,
      addrTxt?h('a',{class:'hc-li',href:C.maps,target:'_blank',rel:'noopener'},hcI('pin'),addrTxt):null,
      C.hasHours?h('div',{class:'hc-hours'},hoursRows(C)):null,
      book('','Book Your Cleaning')),
    addrTxt?h('div',{class:'hc-card hc-map rv'},h('iframe',{src:'https://www.google.com/maps?q='+mapQ+'&output=embed',title:'Map to '+name,loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'})):bg(h('div',{class:'hc-card hc-map rv'}),extra[0])));
  const foot=h('footer',{class:'hc-foot'},h('div',{class:'hc-w hc-foot-in'},h('b',null,name),h('nav',null,links()),h('small',null,'© '+new Date().getFullYear()+' '+name+(C.city?' · '+C.city:''))));
  return h('div',{class:'hc'},nav,hero,about,statRow,services,how,reviews,contact,foot);
}

/* ===================== SHADE TREE (tree service, green + lime, light) ===================== */
const ST_U=(id,w)=>'https://images.unsplash.com/photo-'+id+'?auto=format&fit=crop&w='+(w||1200)+'&q=72';
function stI(n){ const P={
  arrow:'<path d="M7 17 17 7M8 7h9v9"/>',phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  pin:'<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  tree:'<path d="M12 22v-6"/><path d="M12 16c-4.4 0-7-2.3-7-5.5 0-2 1.2-3.5 2.8-4.2C8.4 4 10 2.5 12 2.5s3.6 1.5 4.2 3.8c1.6.7 2.8 2.2 2.8 4.2 0 3.2-2.6 5.5-7 5.5z"/>',leaf:'<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19 13 11"/>',check:'<path d="m5 12 4 4 10-10"/>',star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>'};
  const s=document.createElementNS('http://www.w3.org/2000/svg','svg'); s.setAttribute('viewBox','0 0 24 24'); s.setAttribute('aria-hidden','true'); s.innerHTML=P[n]||''; return s; }
function stRoll(pg){ const t=pg.querySelector('.st-roll-t'); if(!t) return; [...t.children].forEach(c=>t.appendChild(c.cloneNode(true))); }
function stSharp(){ const d=document.createElement('div'); d.setAttribute('aria-hidden','true'); d.style.cssText='position:absolute;width:0;height:0;overflow:hidden';
  d.innerHTML='<svg width="0" height="0"><filter id="st-sharp" color-interpolation-filters="sRGB"><feConvolveMatrix order="3" preserveAlpha="true" kernelMatrix="0 -0.6 0 -0.6 3.4 -0.6 0 -0.6 0"/></filter></svg>'; return d; }
function shadeTree(C){
  const x=C.x||{}, name=C.name, ok=u=>typeof u==='string'&&/^https:\/\/[^\s"'<>]+$/.test(u)?u:'';
  const isST=/^shade\s?tree\b/i.test(name);
  if(isST){ C.addr='5710 Bartonsville Rd'; C.city='Frederick, MD 21704'; C.phone='3017481110'; C.tel='tel:+13017481110'; C.phoneTxt='(301) 748-1110'; C.email='charlie@shadetreelawnscaping.com';
    C.hours=['7:30am - 7:30pm','7:30am - 7:30pm','7:30am - 7:30pm','7:30am - 7:30pm','7:30am - 7:30pm','7:30am - 7:30pm','Closed']; C.hasHours=true; C.today=C.hours[todayIx()]; C.daysOpen=6;
    C.maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('Shade Tree Services, 5710 Bartonsville Rd, Frederick, MD 21704'); }
  const town=C.city?C.city.split(',')[0]:'your area';
  const WP=f=>'https://shadetreelawnscaping.com/wp-content/uploads/2021/03/'+f+'?w=1200';
  const P={hero:ST_U('1765064519883-651c506ec70d',1400),saw:ST_U('1781642945922-b9452456d658'),prune:ST_U('1754321902809-5c21cbc67228'),ladder:ST_U('1754321871548-61bdbc6f1506'),cut:ST_U('1684332666088-f35b252b5aca'),climb:ST_U('1626828476637-5bd713ef9f22'),helmet:ST_U('1588878309774-4b3f42a19a8f'),trim:ST_U('1754321889123-0485c7fea5f1'),sit:ST_U('1669065054992-3151b15aab08'),branch:ST_U('1765064520296-1e56ebb82e17'),arb:ST_U('1754322449185-31f56117ed87')};
  const heroPic=isST?'https://riverbendwebco.com/demo/img/st-trailer.jpg':(ok(x.heroPhoto)||C.own[0]||P.hero);
  const defs=[{n:'Tree Removal',d:'Safe removal of dead, damaged or unwanted trees, near houses, fences and power lines.',img:P.saw},
    {n:'Trimming & Pruning',d:'Shape your trees, clear your roof and keep branches healthy and strong.',img:P.prune},
    {n:'Stump Grinding',d:'Grind old stumps down so you can mow, plant or build right over the spot.',img:P.cut},
    {n:'Storm Cleanup',d:'Downed limbs and leaning trees taken care of after the storm passes.',img:P.trim}];
  const STS=isST?[
    {n:'Tree Removal',t:'Tree & Land',d:'Tree removal is hazardous work best left to the experts. Our crew is trained, experienced, and ready to get to work.',img:WP('bucket-1.jpg')},
    {n:'Stump Removal',t:'Tree & Land',d:'There is no need to wait years for those unsightly tree stumps to decompose, give us a call today.',img:WP('pict0130-1.jpg')},
    {n:'Lot Clearing',t:'Tree & Land',d:'Residential and commercial lot clearing doesn’t need to cost a fortune. We offer the best prices in our service area.',img:WP('lot-clearing-1.jpg')},
    {n:'Lawn Care',t:'Lawn & Landscape',d:'Mowing, trimming, mulching, aeration, seeding: we do it all. No job is too big or small.',img:WP('estimate_1140x430.jpg')},
    {n:'Landscaping',t:'Lawn & Landscape',d:'We offer a variety of landscaping and hardscaping services. Not sure where to start? We can help!',img:WP('pict0021-1.jpg')},
    {n:'Power Washing',t:'Property',d:'Got green? Our power washing services remove mold, mildew, algae, and moss growing on your sidewalk, deck, brick, or siding.',img:WP('power-washing-edited.jpg')},
    {n:'Snow Removal',t:'Commercial',d:'Keep your business on schedule with Shade Tree’s commercial snow removal services.',img:ST_U('1623265296891-8d9cd8856839')},
    {n:'Grounds Management',t:'Commercial',d:'Let our crew handle the mowing, trimming, and seeding to keep your business looking sharp.',img:WP('dscn0413_jpg-1.jpg')},
    {n:'Firewood',t:'Firewood',d:'Our seasoned firewood is available for purchase in small amounts or by the cord (4’H x 8’W x 4’D or 128 cubic ft.).',img:WP('firewood.jpg')}]:null;
  const svc=(STS?STS:Array.isArray(x.services)&&x.services.length?x.services:C.items.length?C.items.slice(0,9).map(i=>({n:i.name,d:i.desc||'',img:i.photo})):defs).filter(v=>v&&v.n)
    .map((v,i)=>Object.assign({},v,{t:v.t||'Service',img:ok(v.img)||(defs[i]||{}).img||[P.ladder,P.climb,P.branch,P.arb][i%4]}));
  const go=id=>e=>{ if(e) e.preventDefault(); menu.hidden=true; scrollTo(id); };
  const A=(id,t)=>h('a',{href:'#'+id,onclick:go(id)},t);
  const links=()=>[A('st-top','Home'),A('st-services','Services'),A('st-about','About'),isST?A('st-area','Service Area'):null,C.reviews.length?A('st-reviews','Reviews'):null,A('st-contact','Contact')];
  const btn=(t,href,cls,ic)=>h('a',{class:'st-btn '+(cls||''),href:href||(C.tel||'#st-contact'),onclick:href&&href[0]==='#'?go(href.slice(1)):(href||C.tel?null:go('st-contact'))},h('span',null,t),h('i',null,stI(ic||'arrow')));
  const logo=isST?'https://shadetreelawnscaping.com/wp-content/uploads/2021/03/cropped-icons8-tms-tree-100.png':(ok(x.logoUrl)||C.logo);
  const brand=()=>h('a',{class:'st-brand',href:'#',onclick:go('st-top')},logo?h('span',{class:'st-mark img'},h('img',{src:logo,alt:'',onerror:function(){this.replaceWith(stI('tree'));}})):h('span',{class:'st-mark'},stI('tree')),h('span',null,name));
  const addrTxt=[C.addr,C.city].filter(Boolean).join(', ');
  /* estimate form, filled from service sheets */
  const sel=h('select',{name:'s'},h('option',{value:''},'Choose a service'),svc.map(v=>h('option',null,v.n)));
  const ask=n=>{ sheet.hidden=true; document.body.style.overflow=''; if(n) sel.value=n; scrollTo('st-contact'); setTimeout(()=>{ const i=form.querySelector('input'); if(i) i.focus({preventScroll:true}); },600); };
  const sheet=h('div',{class:'st-sheet',hidden:true,role:'dialog','aria-modal':'true'});
  const closeSheet=()=>{ sheet.hidden=true; document.body.style.overflow=''; };
  sheet.addEventListener('click',e=>{ if(e.target===sheet) closeSheet(); });
  addEventListener('keydown',e=>{ if(e.key==='Escape'&&!sheet.hidden) closeSheet(); });
  const openSvc=v=>{ sheet.replaceChildren(h('div',{class:'st-sheet-card'},
      h('button',{type:'button',class:'st-x','aria-label':'Close',onclick:closeSheet},'×'),
      bg(h('div',{class:'st-sheet-img'}),v.img),
      h('div',{class:'st-sheet-b'},h('span',{class:'st-tag'},v.t),h('h3',null,v.n),h('p',null,v.d),
        isST&&v.t==='Commercial'?h('p',{class:'st-note'},'For businesses and commercial properties.'):null,
        h('div',{class:'st-row'},h('button',{type:'button',class:'st-btn',onclick:()=>ask(v.n)},h('span',null,'Request an Estimate'),h('i',null,stI('arrow'))),
          C.tel?h('a',{class:'st-ghost',href:C.tel},'Call '+C.phoneTxt):null)))); sheet.hidden=false; document.body.style.overflow='hidden'; };
  const strip=h('div',{class:'st-w st-hinfo'},h('div',{class:'st-hinfo-in'},
    addrTxt?h('a',{href:C.maps||'#',target:'_blank',rel:'noopener'},stI('pin'),addrTxt):null,C.email?h('a',{class:'st-hide-s',href:'mailto:'+C.email},stI('mail'),C.email):null,
    C.today?h('span',{class:'st-strip-r'},stI('clock'),/closed/i.test(C.today)?'Closed today':'Open today '+C.today.replace(' - ',' to ')):null));
  const menu=h('nav',{class:'st-menu',hidden:true},links(),C.tel?h('a',{class:'st-btn',href:C.tel},h('span',null,'Call '+C.phoneTxt),h('i',null,stI('phone'))):null);
  const nav=h('header',{class:'st-nav'},h('div',{class:'st-bar'},h('div',{class:'st-w st-bar-in'},brand(),h('nav',{class:'st-links'},links()),
    C.tel?h('a',{class:'st-call',href:C.tel},h('span',{class:'st-call-i'},stI('phone')),h('span',null,h('small',null,'Call Now'),h('b',null,C.phoneTxt))):null,
    h('button',{type:'button',class:'st-burger','aria-label':'Menu',onclick:()=>{menu.hidden=!menu.hidden;}},stI('menu'))),menu));
  const kick=t=>h('p',{class:'st-kick'},h('i'),t,h('i'));
  const trust=isST?['Serving since 1991','Licensed and bonded','Residential & commercial']:[];
  const heroBg=ST_U('1690777056106-bf26e55b67ce',2200);
  const hero=bg(h('section',{class:'st-hero',id:'st-top'}),heroBg,'linear-gradient(100deg,rgba(4,38,18,.95) 0%,rgba(4,38,18,.86) 42%,rgba(4,38,18,.55) 100%)');
  hero.append(strip,h('div',{class:'st-w st-hero-in'},
    h('div',{class:'st-hero-t'},h('p',{class:'st-kick light'},stI('leaf'),isST?'Grounds management, tree removal & landscaping':'Tree care for '+town+' homes and businesses'),
      h('h1',null,x.headline?x.headline:['Smart Tree Care, ',h('span',null,'Stunning Results')]),
      h('p',{class:'st-lead'},C.tag||(isST?'Serving Frederick, Washington and Carroll County homes and businesses since 1991, from tree and stump removal to lawn care, landscaping and snow removal.':name+' keeps your trees healthy, safe and looking their best, from careful trimming to complete removals and cleanup.')),
      h('div',{class:'st-row'},btn('Get an Estimate','#st-contact'),C.tel?h('a',{class:'st-ghost lg light',href:C.tel},stI('phone'),C.phoneTxt):null),
      trust.length?h('ul',{class:'st-trust'},trust.map(t=>h('li',null,h('span',null,stI('check')),t))):null),
    h('div',{class:'st-hero-pic'},stSharp(),bg(h('div',{class:'st-hero-img'+(heroPic===P.hero||isST?'':' sharp')+(isST?' trailer':'')}),heroPic),
      h('div',{class:'st-badge'},h('span',{class:'st-mark'},stI('tree')),h('div',null,h('b',null,isST?'Since 1991':'Local crew'),h('small',null,isST?'Licensed and bonded':'Serving '+town))))),
    h('div',{class:'st-w'},h('div',{class:'st-finder'},h('small',null,'What do you need help with?'),h('div',{class:'st-chips'},svc.map(v=>h('button',{type:'button',onclick:()=>openSvc(v)},v.n))))));
  const roll=h('section',{class:'st-roll-s'},h('div',{class:'st-w'},h('p',{class:'st-roll-h'},isST?'Serving Frederick, Washington and Carroll County, MD':'Tree services in '+town+' and nearby')),
    h('div',{class:'st-roll'},h('div',{class:'st-roll-t'},svc.concat(svc.length<6?svc:[]).map(v=>h('span',null,stI('leaf'),v.n)))));
  /* services with filter tabs */
  const cats=['All'].concat([...new Set(svc.map(v=>v.t))]);
  const cards=svc.map(v=>{ const c=h('article',{class:'st-card',tabindex:'0',role:'button','aria-label':v.n,onclick:()=>openSvc(v),onkeydown:e=>{ if(e.key==='Enter') openSvc(v); }},bg(h('div',{class:'st-card-img'}),v.img),
      h('div',{class:'st-card-b'},h('span',{class:'st-tag'},v.t),h('h3',null,v.n),v.d?h('p',null,short(v.d,160)):null,
        h('div',{class:'st-row'},h('span',{class:'st-ghost'},'Learn More'),h('span',{class:'st-sq'},stI('arrow'))))); c.dataset.t=v.t; return c; });
  const tabs=cats.length>2?h('div',{class:'st-tabs',role:'tablist'},cats.map((t,i)=>h('button',{type:'button',class:i?null:'on',onclick:e=>{ tabs.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===e.currentTarget)); cards.forEach(c=>{ c.hidden=!(t==='All'||c.dataset.t===t); }); }},t))):null;
  const services=h('section',{class:'st-sec st-soft',id:'st-services'},h('div',{class:'st-w'},
    h('div',{class:'st-head'},kick('Our Services'),h('h2',null,isST?'Tree, lawn and property care, all in one crew':'Complete tree care, from the roots up'),h('p',{class:'st-mut'},'Tap any service to learn more or request an estimate.')),
    tabs,h('div',{class:'st-cards'+(svc.length>4?' c3':'')},cards),
    isST?h('p',{class:'st-more'},'And more! ',h('a',{href:'#st-contact',onclick:go('st-contact')},'Ask us about your project')):null));
  const tiles=isST?[WP('bucket-1.jpg'),WP('img_1818.jpg'),WP('lot-clearing-1.jpg'),WP('pict0021-1.jpg'),WP('pict0130-1.jpg'),WP('estimate_1140x430.jpg')]:[P.climb,P.prune,P.helmet,P.sit,P.branch,P.arb];
  const about=h('section',{class:'st-sec st-about',id:'st-about'},
    h('div',{class:'st-about-tiles','aria-hidden':'true'},tiles.map((u,i)=>bg(h('div',{class:'st-tile t'+i}),u))),
    h('div',{class:'st-w st-about-in rv'},kick('About Our Company'),
      isST?h('h2',{class:'st-big'},'Since 1991, Shade Tree Services has been ',h('span',null,'taking care of trees, lawns and grounds for homes and businesses across Frederick, Washington and Carroll County.')):
        h('h2',{class:'st-big'},'At '+name+', we believe every yard deserves ',h('span',null,'trees that are healthy, safe and beautiful. We bring careful, professional tree care to every job.')),
      isST?h('p',{class:'st-about-p'},'Licensed and bonded, with one crew for tree removal, lot clearing, lawn care, landscaping, power washing, commercial snow removal and grounds management.'):(C.about?h('p',{class:'st-about-p'},short(C.about,360)):null),
      btn('Talk to Our Crew','#st-contact','sm')));
  const facts=isST?[['1991','Serving since'],['Licensed','and bonded'],['3 counties','Frederick, Washington & Carroll']]:[C.hasHours&&C.daysOpen?[dayRange(C.hours),'Open '+(C.daysOpen===7?'seven days a week':C.daysOpen+' days a week')]:[svc.length+' services','From one local crew'],[town,'Local and nearby'],[C.tel?C.phoneTxt:'Call us','Call for an estimate']];
  const band=bg(h('section',{class:'st-band'}),isST?WP('bucket-1.jpg'):P.hero,'linear-gradient(90deg,rgba(6,58,28,.94),rgba(6,58,28,.86))');
  band.append(h('div',{class:'st-w st-band-in'},h('h2',null,isST?'Property care':'Tree care',h('br'),'you can count on'),h('div',{class:'st-facts'},facts.map(([a,b])=>h('div',null,h('b',null,a),h('span',null,b))))));
  const area=isST?h('section',{class:'st-sec',id:'st-area'},h('div',{class:'st-w st-area'},
    h('div',{class:'st-area-t'},kick('Service Area'),h('h2',null,'Proudly serving Frederick and nearby counties'),h('p',{class:'st-mut'},'Residential and commercial customers in Frederick County, Washington County, Carroll County and the surrounding area.'),
      h('div',{class:'st-counties'},[['Frederick County','Home base on Bartonsville Rd'],['Washington County','Residential & commercial'],['Carroll County','Residential & commercial']].map(([a,b])=>h('div',null,h('span',{class:'st-li-i'},stI('pin')),h('div',null,h('b',null,a),h('small',null,b))))),
      h('p',{class:'st-mut sm'},'Not sure if we come to you? Call ',h('a',{href:C.tel},C.phoneTxt),' and ask.')),
    h('div',{class:'st-area-map'},h('iframe',{src:'https://www.google.com/maps?q='+encodeURIComponent('5710 Bartonsville Rd, Frederick, MD 21704')+'&z=9&output=embed',title:'Shade Tree Services service area',loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'})))):null;
  const note=h('p',{class:'st-form-note',hidden:true});
  const form=h('form',{class:'st-form',onsubmit:e=>{ e.preventDefault(); const f=new FormData(e.target); const body=['Name: '+f.get('n'),'Phone: '+f.get('p'),'Email: '+f.get('e'),'Service: '+(f.get('s')||'Not sure'),'',f.get('m')].join('\n');
      if(C.email){ location.href='mailto:'+C.email+'?subject='+encodeURIComponent('Estimate request from '+(f.get('n')||'the website'))+'&body='+encodeURIComponent(body); }
      note.hidden=false; note.textContent=C.email?'Thanks! Your email app will open with your request filled in. Prefer to talk? Call '+C.phoneTxt+'.':(C.tel?'Thanks! This is a demo, so for now call '+C.phoneTxt+'.':'Thanks! This is a demo form.'); }},
    h('h3',null,'Request an Estimate'),
    h('div',{class:'st-f2'},h('label',null,'Your name',h('input',{name:'n',required:true,placeholder:'Full name',autocomplete:'name'})),h('label',null,'Phone',h('input',{name:'p',type:'tel',placeholder:'(301) 555-5555',autocomplete:'tel'}))),
    h('div',{class:'st-f2'},h('label',null,'Email',h('input',{name:'e',type:'email',placeholder:'you@email.com',autocomplete:'email'})),h('label',null,'Service',sel)),
    h('label',null,'Tell us about your project',h('textarea',{name:'m',rows:4,placeholder:'What you need done, where, and anything we should know'})),
    h('div',{class:'st-row'},h('button',{type:'submit',class:'st-submit'},'Send Request'),h('span',{class:'st-sq light'},stI('arrow'))),note);
  const contact=h('section',{class:'st-sec st-soft',id:'st-contact'},h('div',{class:'st-w st-contact'},
    h('div',{class:'st-contact-t'},kick('Get in Touch'),h('h2',null,isST?'Ready to get your project started?':'Talk to tree pros who care about your yard'),
      h('p',{class:'st-mut'},'Tell us what you need and we will help you plan the right work for your property and your budget.'),
      addrTxt?h('a',{class:'st-li',href:C.maps,target:'_blank',rel:'noopener'},h('span',{class:'st-li-i'},stI('pin')),h('span',null,h('small',null,'Location'),addrTxt)):null,
      C.tel?h('a',{class:'st-li',href:C.tel},h('span',{class:'st-li-i'},stI('phone')),h('span',null,h('small',null,'Phone'),C.phoneTxt)):null,
      C.email?h('a',{class:'st-li',href:'mailto:'+C.email},h('span',{class:'st-li-i'},stI('mail')),h('span',null,h('small',null,'Email'),C.email)):null,
      C.hasHours?h('div',{class:'st-hours'},hoursRows(C).map(r=>{ r.lastChild.textContent=r.lastChild.textContent.replace(' - ',' to '); return r; })):null),
    form));
  const rv=C.reviews;
  const reviews=rv.length?h('section',{class:'st-sec',id:'st-reviews'},h('div',{class:'st-w'},h('div',{class:'st-head'},kick('Reviews'),h('h2',null,'What our customers say')),
    h('div',{class:'st-revs'},rv.slice(0,3).map(r=>h('figure',{class:'st-rev'},h('div',{class:'st-stars'},[0,1,2,3,4].slice(0,r.stars||5).map(()=>stI('star'))),h('blockquote',null,short(r.text,260)),h('figcaption',null,r.name)))))):null;
  const mos=isST?[WP('bucket-1.jpg'),WP('pict0130-1.jpg'),WP('img_1818.jpg'),WP('lot-clearing-1.jpg'),WP('power-washing-edited.jpg'),WP('pict0021-1.jpg'),WP('dscn0413_jpg-1.jpg'),WP('firewood.jpg')]:[P.climb,P.prune,P.helmet,P.sit,P.branch,P.arb,P.saw,P.ladder];
  const cta=h('section',{class:'st-sec st-cta'},h('div',{class:'st-w'},
    h('div',{class:'st-mosaic','aria-hidden':'true'},mos.map((u,i)=>bg(h('div',{class:'st-m m'+i}),u))),
    h('div',{class:'st-cta-t rv'},h('h2',null,isST?'Let’s make your property the best on the block':'Let’s make your trees the best on the block'),h('p',{class:'st-mut'},'Call '+name+' and we will take it from here.'),
      h('div',{class:'st-row c'},btn('Get an Estimate','#st-contact'),C.tel?h('a',{class:'st-ghost lg',href:C.tel},stI('phone'),C.phoneTxt):null))));
  const foot=h('footer',{class:'st-foot'},h('div',{class:'st-w st-foot-in'},
    h('div',{class:'st-foot-b'},brand(),h('p',null,isST?'Grounds management, tree removal and landscaping services in Frederick, Washington and Carroll County, MD. Licensed and bonded. Serving since 1991.':name+' is your local partner for tree care'+(C.city?' in '+C.city:'')+'.')),
    h('div',null,h('b',null,'Quick Links'),links()),
    h('div',null,h('b',null,'Our Services'),svc.slice(0,9).map(v=>h('a',{href:'#st-services',onclick:e=>{e.preventDefault();openSvc(v);}},v.n))),
    h('div',null,h('b',null,'Contact'),addrTxt?h('a',{href:C.maps,target:'_blank',rel:'noopener'},addrTxt):null,C.tel?h('a',{href:C.tel},C.phoneTxt):null,C.email?h('a',{href:'mailto:'+C.email},C.email):null,isST?h('span',null,'Mon to Sat, 7:30am to 7:30pm'):null)),
    h('div',{class:'st-w st-foot-c'},'© '+new Date().getFullYear()+' '+name+'. All rights reserved.'));
  return h('div',{class:'st'},nav,hero,roll,services,about,band,area,contact,reviews,cta,foot,sheet);
}
/* ===================== SPIRITED (dark, gold, high-end cocktail lounge) ===================== */
/* Page-wide smoke: a WebGL shader of domain-warped noise (the same technique used for film-style smoke), drifting up and moving with the scroll */
function spSmoke(canvas){
  const gl=canvas.getContext('webgl',{premultipliedAlpha:true,alpha:true,antialias:false}); if(!gl){ canvas.remove(); return; }
  const vs='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const fs=`precision mediump float;uniform vec2 R;uniform float T;uniform float S;uniform float K;
  float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
  float fb(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<6;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}
  void main(){vec2 uv=gl_FragCoord.xy/R;vec2 p=vec2(uv.x*R.x/R.y,uv.y)*2.2;p.y-=S*.0009;
    vec2 q=vec2(fb(p+vec2(0.,T*.035)),fb(p+vec2(5.2,1.3)-T*.025));
    vec2 r=vec2(fb(p+3.2*q+vec2(1.7,9.2)+T*.02),fb(p+3.2*q+vec2(8.3,2.8)-vec2(0.,T*.06)));
    float f=fb(p+3.6*r);
    float d=smoothstep(.42,1.,f)*(.55+.45*smoothstep(.0,.9,length(q)));
    float edge=.55+.45*(1.-uv.y)+.35*pow(abs(uv.x-.5)*2.,2.);
    vec2 cc=(uv-vec2(.5,.42))*vec2(1.3,1.);float clear=1.-.7*exp(-dot(cc,cc)*9.);float a=clamp(d*K*edge*clear,0.,.32);
    vec3 c=mix(vec3(.80,.80,.84),vec3(1.,.97,.93),f);
    gl_FragColor=vec4(c*a,a);}`;
  const sh=(t,src)=>{ const o=gl.createShader(t); gl.shaderSource(o,src); gl.compileShader(o); return o; };
  const pr=gl.createProgram(); gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){ canvas.remove(); return; }
  gl.useProgram(pr); const buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const uR=gl.getUniformLocation(pr,'R'), uT=gl.getUniformLocation(pr,'T'), uS=gl.getUniformLocation(pr,'S'), uK=gl.getUniformLocation(pr,'K');
  const Q=.5; const size=()=>{ canvas.width=Math.round(innerWidth*Q); canvas.height=Math.round(innerHeight*Q); gl.viewport(0,0,canvas.width,canvas.height); };
  size(); addEventListener('resize',size);
  const t0=performance.now(); let k=0;
  const frame=t=>{ if(!document.hidden){ const y=scrollY, hero=innerHeight; const want=y<hero?.3*(1-y/hero):0; k+=(want-k)*.06;
      if(k<.005){ gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT); requestAnimationFrame(frame); return; } gl.uniform2f(uR,canvas.width,canvas.height); gl.uniform1f(uT,(t-t0)/1000); gl.uniform1f(uS,y*Q); gl.uniform1f(uK,k); gl.drawArrays(gl.TRIANGLES,0,3); }
    requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
}
function spirited(C){
  const name=C.name||'Spirited', logo='https://riverbendwebco.com/demo/img/spirited-logo.png';
  const SQ='https://images.squarespace-cdn.com/content/v1/60257bd276d0063ec3a7ae51/';
  const P={bar:'495f1370-6f8f-43be-b655-a8ae9212bce8/20260115_171715.jpg',lounge:'ef93a310-c6c0-408a-bf2e-5979b6591ccf/IMG_7514.jpg',purple:'6373e125-9d08-459d-9443-a52ba851ad88/IMG_7665.jpg',mirror:'2b2b92c6-613a-4a4a-8f43-e0e3b82ae7d9/20260217_220738.jpg',tarot:'de671884-38a4-4a62-b915-f4b75ac79664/IMG_7668.jpg',mint:'01da055a-00a8-455b-85a4-b3e7f5230278/IMG_7666.jpg',candles:'529fb986-abce-48c8-b784-a82267295213/20260221_185157.jpg',pink:'fcedf314-57c7-44e9-a473-fe7d345b6f83/IMG_7667.jpg',tiki:'f97d7422-70da-4ce2-81ff-cf0724a5b929/20260210_182320.jpg',pour:'5887d2f2-fb7f-46f8-bbbc-a0e9cb16ebee/IMG_7648.jpg',velvet:'ff902b2b-2fe9-485e-a406-d0b0394e6643/IMG_7686.jpg'};
  const ph=(k,w)=>SQ+P[k]+'?format='+(w||1500)+'w';
  const sb=/south bend/i.test(C.city||'');
  const addr=(C.addr||'')+(sb&&/105 E Jefferson/i.test(C.addr||'')?', Suite 100':''), city=sb?'South Bend, IN 46601':(C.city||'');
  const town=sb?'South Bend':city.split(',')[0];
  const maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name+', '+[C.addr,city].filter(Boolean).join(', '));
  const dash=v=>String(v||'').replace(/\s*-\s*/,' – ');
  const J=(id,label,cls)=>jump(id,label,cls);
  const pic=(k,cls,w)=>{ const d=h('div',{class:'sp-pic '+(cls||'')},h('div',{class:'sp-pic-i'})); d.firstChild.style.backgroundImage=cssUrl(ph(k,w)); return d; };
  /* ----- menu data ----- */
  const secs=[]; let cur=null;
  C.items.forEach(i=>{ const n=String(i.name||'').trim(); if(!n) return;
    if(n===n.toUpperCase()&&/[A-Z]/.test(n)&&!/\|/.test(n)&&n.length<16){ cur={t:n.charAt(0)+n.slice(1).toLowerCase(),items:[]}; secs.push(cur); return; }
    if(!cur){ cur={t:'Cocktails',items:[]}; secs.push(cur); } cur.items.push(i); });
  const pick=keys=>secs.filter(x=>keys.includes(x.t));
  const TABS=[['Cocktails','Sip on',['Cocktails']],['Spirit-Free','Zero-proof',['Zero-proof']],['Wine & Bubbles','Raise a glass',['Sparkling','Pink','White','Red','Bottle']],['Beer & Seltzer','Keep it easy',['Craft']]]
    .map(([t,lead,keys])=>[t,lead,pick(keys)]).filter(([,,g])=>g.some(x=>x.items.length));
  const label={Sparkling:'Sparkling',Pink:'Rosé',White:'White',Red:'Red',Bottle:'By the bottle',Craft:'Cans & draft'};
  const nm=i=>String(i.name).split('|').map(x=>x.trim()).filter(Boolean);
  const row=i=>h('div',{class:'sp-it'},h('b',null,nm(i).map((p,k)=>[k?h('em',null,'·'):null,p])),h('span',{class:'sp-dots','aria-hidden':'true'}),h('span',{class:'sp-pr'},i.price||''));
  const SN=(Array.isArray(C.x.snacks)?C.x.snacks:[]).filter(x=>x&&x.n).slice(0,20);
  const srow=x=>h('div',{class:'sp-it sp-sn'},h('div',{class:'sp-sn-top'},h('b',null,String(x.n)),h('span',{class:'sp-dots','aria-hidden':'true'}),h('span',{class:'sp-pr'},String(x.p||'').replace(/\s*\|\s*/g,' / '))),x.d?h('p',null,String(x.d).split('|').map(t=>t.trim()).join(' \u00b7 ')):null);
  if(SN.length) TABS.splice(1,0,['Snacks','Something to share',[{t:'Snacks',items:SN,snack:true}]]);
  const known=DAYS.map((d,i)=>[d,C.hours[i],i]).filter(([,v])=>v);
  const groupH=[]; known.forEach(([d,v,i])=>{ const last=groupH[groupH.length-1]; if(last&&last.v===v){ last.to=d; last.ix.push(i); } else groupH.push({from:d,to:'',v,ix:[i]}); });

  /* ===== header ===== */
  const LINKS=[['sp-story','Story'],['sp-menu','Menu'],['sp-gal','Gallery'],['sp-events','Events'],['sp-visit','Visit']];
  const head=h('header',{class:'sp-head'},h('div',{class:'sp-head-in'},
    h('a',{class:'sp-head-logo',href:'#',onclick:e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});}},h('img',{src:logo,alt:name})),
    h('nav',{class:'sp-head-nav'},LINKS.map(([id,t])=>J(id,t))),
    h('div',{class:'sp-head-r'},C.tel?h('a',{class:'sp-head-tel',href:C.tel},C.phoneTxt):null,J('sp-reserve','Reserve','sp-btn gold sm'))),
    h('nav',{class:'sp-head-m'},[['sp-menu','Menu'],['sp-gal','Gallery'],['sp-visit','Visit']].map(([id,t])=>J(id,t))));
  addEventListener('scroll',()=>head.classList.toggle('solid',scrollY>30),{passive:true});

  /* ===== 1. hero: the bar lights come on ===== */
  const L=cls=>{ const d=h('div',{class:'sp-l '+cls}); d.style.backgroundImage=cssUrl(ph('bar',2500)); return d; };
  const stage=h('div',{class:'sp-stage','data-par':'.18'},L('base'),L('glass'),L('blue'),L('all'));
  const hero=h('section',{class:'sp-hero'},h('div',{class:'sp-load'}),stage,h('div',{class:'sp-hero-shade'}),
    h('div',{class:'sp-hero-c'},h('img',{class:'sp-hero-logo',src:logo,alt:name}),
      h('h1',null,'An evening, poured slowly.'),
      h('p',{class:'sp-hero-sub'},'A candlelit cocktail lounge in downtown '+town+'.'),
      h('div',{class:'sp-hero-btns'},J('sp-menu','View Menu','sp-btn gold'),J('sp-reserve','Reserve a Table','sp-btn line'))),
    h('div',{class:'sp-cue','aria-hidden':'true'},h('span',null,'Scroll'),h('i')));
  const pre=new Image(); pre.onload=()=>hero.classList.add('lit'); pre.src=ph('bar',2500); setTimeout(()=>hero.classList.add('lit'),3000);

  /* ===== 2. story ===== */
  const story=h('section',{class:'sp-story',id:'sp-story'},h('div',{class:'sp-w sp-story-g'},
    h('div',{class:'sp-story-t'},h('span',{class:'sp-kick sp-rv'},'The Experience'),
      h('h2',{class:'sp-rv'},'Low light. Velvet seats. ',h('em',null,'A drink made only for you.')),
      h('p',{class:'sp-rv'},'Spirited is a cocktail lounge on Jefferson Boulevard, dressed in gold mirrors, stained glass and deep green velvet. Every drink is built by hand, from smoked bourbon to bright, spirit-free sours, with small plates made for sharing.'),
      h('p',{class:'sp-rv'},'Come early for a quiet first round, or stay late into the weekend. Either way, the night takes its time.')),
    h('div',{class:'sp-story-p'},pic('lounge','tall sp-mask','1500'),h('div',{class:'sp-story-p2','data-par':'-.12'},pic('mirror','sp-mask','1000')))));

  /* ===== 3. signature pours (horizontal on desktop) ===== */
  const SIG=[['purple','01','The Art of the Garnish','Dried citrus, fresh herbs and flowers, set by hand.'],['tarot','02','Read the Cards','Every glass arrives with a little mystery.'],['tiki','03','Tropical, Elevated','Rum, pineapple and island fruit, shaken bright.'],['mint','04','Silk & Foam','Velvet-textured sours, finished with fresh mint.'],['pink','05','Long & Sparkling','Tall, bright and built to linger.']];
  const track=h('div',{class:'sp-track'},h('div',{class:'sp-sig-intro'},h('span',{class:'sp-kick'},'Signature Pours'),h('h2',null,'Crafted with ',h('em',null,'intention.')),h('p',null,'Small details, done properly. A few of the drinks that make an evening here.')),
    SIG.map(([k,n,t,d])=>h('article',{class:'sp-card'},pic(k,'',1200),h('div',{class:'sp-card-t'},h('small',null,'No. '+n),h('h3',null,t),h('p',null,d)))));
  const sig=h('section',{class:'sp-sig',id:'sp-sig'},h('div',{class:'sp-sig-pin'},track));
  const smokeDrink=C.items.find(i=>/smoke/i.test(i.name||''));

  /* ===== 4. atmosphere gallery ===== */
  const GAL=['velvet','candles','pour','mirror','tarot','pink','lounge','purple','tiki','mint'];
  const pics=GAL.map(k=>ph(k,1600));
  const gtile=(k,cls,par)=>{ const b=h('button',{type:'button',class:'sp-gt '+cls,'aria-label':'Open photo','data-par':par||null},h('div',{class:'sp-pic-i'})); b.firstChild.style.backgroundImage=cssUrl(ph(k,1200)); b.addEventListener('click',()=>gallery(pics,name,GAL.indexOf(k))); return b; };
  const gal=h('section',{class:'sp-gal',id:'sp-gal'},h('div',{class:'sp-w'},
    h('div',{class:'sp-head2 sp-rv'},h('span',{class:'sp-kick'},'Atmosphere'),h('h2',null,'Step inside.')),
    h('div',{class:'sp-stack'},gtile('velvet','a sp-mask'),gtile('candles','b sp-mask','-.1'),gtile('pour','c sp-mask','.08'),gtile('mirror','d sp-mask'),gtile('tarot','e sp-mask','-.08')),
    h('div',{class:'sp-gal-more sp-rv'},h('button',{type:'button',class:'sp-ul',onclick:()=>gallery(pics,name,0)},'View all '+pics.length+' photos'))));

  /* ===== 5. menu preview, with the full menu one tap away ===== */
  const prev=(t,keys,n)=>{ const its=pick(keys).flatMap(x=>x.items).slice(0,n); return its.length?h('div',{class:'sp-mp sp-rv'},h('h3',null,t),h('div',null,its.map(row))):null; };
  const tabs=h('div',{class:'sp-tabs',role:'tablist'}), panel=h('div',{class:'sp-panel',role:'tabpanel'});
  const show=k=>{ [...tabs.children].forEach((t,j)=>{ t.classList.toggle('on',j===k); t.setAttribute('aria-selected',j===k?'true':'false'); });
    const [t,lead,g]=TABS[k]; panel.classList.remove('in');
    panel.replaceChildren(h('div',{class:'sp-panel-h'},h('i',null,lead),h('h3',null,t)),
      ...g.filter(x=>x.items.length).map(x=>h('div',{class:'sp-grp'},g.length>1?h('small',{class:'sp-kick'},label[x.t]||x.t):null,h('div',{class:'sp-items'},x.items.map(x.snack?srow:row)))));
    requestAnimationFrame(()=>panel.classList.add('in')); };
  TABS.forEach(([t],k)=>{ const b=h('button',{type:'button',role:'tab',class:'sp-tab'},t); b.addEventListener('click',()=>show(k)); tabs.append(b); });
  if(TABS.length) show(0);
  const full=h('div',{class:'sp-full'},h('div',{class:'sp-full-in'},tabs,panel));
  const openBtn=h('button',{type:'button',class:'sp-btn line'},'Explore the full menu');
  openBtn.addEventListener('click',()=>{ const on=full.classList.toggle('open'); openBtn.textContent=on?'Close the full menu':'Explore the full menu'; if(on) setTimeout(()=>full.scrollIntoView({behavior:'smooth',block:'start'}),60); });
  const menu=h('section',{class:'sp-menu',id:'sp-menu'},h('div',{class:'sp-w'},
    h('div',{class:'sp-head2 center sp-rv'},h('span',{class:'sp-kick'},'The Menu'),h('h2',null,SN.length?'Cocktails, bubbles ':'Spirits, bubbles ',h('em',null,SN.length?'& small bites.':'& spirit-free.')),
      smokeDrink?h('p',null,'Start with the house favorite: ',h('b',null,nm(smokeDrink).join(' · ')),' ',h('span',{class:'sp-pr'},smokeDrink.price||'')):null),
    h('div',{class:'sp-mps'+(SN.length?' four':'')},prev('Cocktails',['Cocktails'],5),SN.length?h('div',{class:'sp-mp sp-rv'},h('h3',null,'Snacks'),h('div',null,SN.slice(0,4).map(srow))):null,prev('Spirit-Free',['Zero-proof'],3),prev('Wine & Bubbles',['Sparkling','Pink','White','Red'],5)),
    h('div',{class:'sp-center sp-rv'},openBtn),full));

  /* ===== 6. reservation ===== */
  const times=[]; for(let m=16*60;m<=22*60+30;m+=30){ const hh=Math.floor(m/60), mm=m%60; times.push(((hh+11)%12+1)+':'+(mm?'30':'00')+' PM'); }
  const today=new Date(); const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const fl=(l,el,wide)=>h('label',{class:'sp-fl'+(wide?' wide':'')},h('span',null,l),el);
  const ok=h('div',{class:'sp-ok'},h('i',{class:'sp-script'},'Thank you'),h('h3',null,'Your request is in.'),h('p',null,'We will confirm your table by text or call. (This is a preview: on your live site, requests go straight to your inbox.)'));
  const form=h('form',{class:'sp-form'},
    fl('Date',h('input',{type:'date',required:true,value:iso(today),min:iso(today)})),
    fl('Time',h('select',{required:true},times.map(t=>h('option',t==='7:00 PM'?{selected:true}:null,t)))),
    fl('Guests',h('select',null,['1','2','3','4','5','6','7','8'].map(n=>h('option',n==='2'?{selected:true}:null,n+(n==='1'?' guest':' guests'))),h('option',null,'9+ (we will call you)'))),
    fl('Occasion',h('select',null,['None','Date night','Birthday','Anniversary','Celebration','Business'].map(o=>h('option',null,o)))),
    fl('Name',h('input',{required:true,placeholder:'Full name',autocomplete:'name'})),
    fl('Phone',h('input',{required:true,type:'tel',placeholder:'(574) 555-0100',autocomplete:'tel'})),
    fl('Notes',h('input',{placeholder:'Anything we should know?'}),true),
    h('button',{type:'submit',class:'sp-btn gold wide'},'Request My Table'));
  form.addEventListener('submit',e=>{ e.preventDefault(); form.closest('.sp-res-card').classList.add('done'); });
  const reserve=h('section',{class:'sp-res',id:'sp-reserve'},h('div',{class:'sp-w sp-res-g'},
    h('div',{class:'sp-res-t'},h('span',{class:'sp-kick sp-rv'},'Reservations'),h('h2',{class:'sp-rv'},'Save your ',h('em',null,'seat.')),
      h('p',{class:'sp-rv'},'Tell us when you are coming and we will have your table ready. For parties of nine or more, give us a call.'),
      C.tel?h('a',{class:'sp-ul sp-rv',href:C.tel},'Or call '+C.phoneTxt):null),
    h('div',{class:'sp-res-card sp-rv'},form,ok)));

  /* ===== 7. private events & catering ===== */
  const evbg=h('div',{class:'sp-ev-bg','data-par':'.14'}); evbg.style.backgroundImage=cssUrl(ph('candles',2000));
  const events=h('section',{class:'sp-ev',id:'sp-events'},evbg,h('div',{class:'sp-ev-shade'}),h('div',{class:'sp-w sp-ev-in'},
    h('span',{class:'sp-kick sp-rv'},'Private Events & Catering'),h('h2',{class:'sp-rv'},'Make the night ',h('em',null,'yours.')),
    h('p',{class:'sp-rv'},'Birthdays, rehearsal dinners, company evenings. Talk with us about hosting your gathering at Spirited, or bring our bar to your event with catering. Gift cards are available for the cocktail lover in your life.'),
    h('div',{class:'sp-ev-btns sp-rv'},C.email?h('a',{class:'sp-btn gold',href:'mailto:'+C.email+'?subject='+encodeURIComponent('Private event inquiry')},'Plan an Event'):null,C.email?h('a',{class:'sp-btn line',href:'mailto:'+C.email+'?subject='+encodeURIComponent('Gift cards')},'Gift Cards'):null)));

  /* ===== 8. visit ===== */
  const visit=h('section',{class:'sp-visit',id:'sp-visit'},h('div',{class:'sp-w sp-visit-g'},
    h('div',{class:'sp-visit-t'},h('span',{class:'sp-kick sp-rv'},'Visit'),h('h2',{class:'sp-rv'},addr,h('br'),h('em',null,city)),
      groupH.length?h('div',{class:'sp-hrs sp-rv'},groupH.map(g=>h('div',{class:g.ix.includes(todayIx())?'on':null},h('span',null,g.from+(g.to?' – '+g.to:'')),h('span',null,dash(g.v))))):null,
      h('div',{class:'sp-contact sp-rv'},C.tel?h('a',{href:C.tel},C.phoneTxt):null,C.email?h('a',{href:'mailto:'+C.email},C.email):null),
      h('div',{class:'sp-ev-btns sp-rv'},h('a',{class:'sp-btn gold',href:maps,target:'_blank',rel:'noopener'},'Get Directions'),J('sp-reserve','Reserve','sp-btn line'))),
    h('div',{class:'sp-map sp-rv'},h('iframe',{src:'https://www.google.com/maps?q='+encodeURIComponent(name+', '+[C.addr,city].join(', '))+'&output=embed',title:'Map to '+name,loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'}))));

  /* ===== 9. footer ===== */
  const foot=h('footer',{class:'sp-foot'},h('div',{class:'sp-w'},
    h('img',{src:logo,alt:name,class:'sp-foot-logo'}),
    h('nav',{class:'sp-foot-nav'},LINKS.map(([id,t])=>J(id,t)),J('sp-reserve','Reserve')),
    h('div',{class:'sp-foot-soc'},C.ig?h('a',{href:C.ig,target:'_blank',rel:'noopener'},'Instagram'):null,C.fb?h('a',{href:C.fb,target:'_blank',rel:'noopener'},'Facebook'):null),
    h('p',{class:'sp-copy'},addr+', '+city+' · © '+new Date().getFullYear()+' '+name+' · Please drink responsibly.')));

  const smoke=h('canvas',{class:'sp-smoke','aria-hidden':'true'});
  const calm=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!calm) setTimeout(()=>spSmoke(smoke),50); else smoke.remove();
  const page=h('div',{class:'sp'},head,hero,story,sig,gal,menu,reserve,events,visit,foot,smoke);

  /* ----- motion: reveals, parallax, the pinned horizontal pours ----- */
  setTimeout(()=>{
    const io='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target); } }),{threshold:.12,rootMargin:'0px 0px -6% 0px'}):null;
    page.querySelectorAll('.sp-rv,.sp-mask,.sp-card').forEach(el=>io?io.observe(el):el.classList.add('on'));
    const par=[...page.querySelectorAll('[data-par]')]; let tick=false;
    const wide=()=>innerWidth>900;
    const run=()=>{ tick=false; const vh=innerHeight;
      if(!calm) par.forEach(el=>{ const r=el.parentElement.getBoundingClientRect(); const c=(r.top+r.height/2-vh/2); el.style.translate='0 '+(c*parseFloat(el.dataset.par)).toFixed(1)+'px'; });
      if(wide()){ const r=sig.getBoundingClientRect(), max=track.scrollWidth-innerWidth; sig.style.height=(vh+Math.max(0,max))+'px';
        const t=Math.min(1,Math.max(0,-r.top/Math.max(1,max))); track.style.transform='translate3d('+(-t*max).toFixed(1)+'px,0,0)'; }
      else { sig.style.height=''; track.style.transform=''; } };
    const ask=()=>{ if(!tick){ tick=true; requestAnimationFrame(run); } };
    addEventListener('scroll',ask,{passive:true}); addEventListener('resize',ask); run();
  },30);
  return page;
}

/* ===================== A & B AUTOMOTIVE (red / charcoal / green, auto service + sales) ===================== */
const AB_U=(id,w)=>'https://images.unsplash.com/photo-'+id+'?auto=format&fit=crop&w='+(w||1200)+'&q=72';
function abI(n){ const P={
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',check:'<path d="m5 12 4 4 10-10"/>',phone:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  pin:'<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  wrench:'<path d="M14.7 6.3a4 4 0 0 0 5 5L22 14l-8 8-2.3-2.3a4 4 0 0 0-5-5L4 12l8-8z" transform="scale(.9) translate(1 1)"/>',
  car:'<path d="M5 17h14M3 17v-4l2-5h14l2 5v4"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/><path d="M5 12h14"/>',
  tire:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M12 3v5.5M12 15.5V21M3 12h5.5M15.5 12H21"/>',
  shield:'<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',tag:'<path d="M3 12V3h9l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/>',chat:'<path d="M4 5h16v11H8l-4 4z"/>',
  gauge:'<path d="M4 18a9 9 0 1 1 16 0"/><path d="m12 13 4-4"/>',hand:'<path d="M7 11V5a2 2 0 0 1 4 0v5M11 10V4a2 2 0 0 1 4 0v6M15 10V6a2 2 0 0 1 4 0v8a7 7 0 0 1-14 0v-3a2 2 0 0 1 4 0"/>',menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',star:'<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',quote:'<path d="M5 18c2-1 3-3 3-6H5V6h6v6c0 4-2 6-6 6zM14 18c2-1 3-3 3-6h-3V6h6v6c0 4-2 6-6 6z"/>'};
  const s=document.createElementNS('http://www.w3.org/2000/svg','svg'); s.setAttribute('viewBox','0 0 24 24'); s.setAttribute('aria-hidden','true'); s.innerHTML=P[n]||''; return s; }
const AB_SVC={"CV & drivetrain repair": "1769218403508-90c67335aab5", "Suspension": "1760836395763-25ea44ae8145", "Tires": "1764015805414-df7de89d405b", "Batteries": "1765211003026-f7666ea3a948", "Engine diagnostics": "1625047509248-ec889cbff17f", "Electrical": "1632733711679-529326f6db12", "A/C": "1773962375418-9f13f00553e7", "Tune-ups": "1782885044133-27c4df887d96", "Brakes": "1747330038945-fb39f6e4b73c", "Exhaust": "1764869427739-cc4bbc7f62fa", "Inspections": "1792010025571-58898f12dc49", "Oil & filter change": "1771340742493-52fbd5476ccb"};
function abAuto(C){
  const x=C.x||{}, name=C.name, ok=u=>typeof u==='string'&&/^https:\/\/[^\s"'<>]+$/.test(u)?u:'';
  if(/^a\s*(&|and|n)\s*b\s+auto/i.test(C.name)){
    C.addr='10512 Key W Dr'; C.city='Dubuque, IA 52003'; C.phone='5635833575'; C.tel='tel:+15635833575'; C.phoneTxt='(563) 583-3575';
    C.hours=['8am - 5pm','8am - 5pm','8am - 5pm','8am - 5pm','8am - 5pm','By appointment','By appointment']; C.hasHours=true; C.today=C.hours[todayIx()]; C.daysOpen=5;
    C.maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('A & B Automotive Center & Sales, 10512 Key W Dr, Dubuque, IA 52003');
    C.reviewsSource='Google';
    C.reviews=[
      {name:'Travis Busch',stars:5,text:'Adam and TJ are awesome. I have taken countless vehicles to them and they are fair and honest.'},
      {name:'Ben Schueller',stars:5,text:'Diagnosed my truck same day I took it in then did not even charge me also gave me a ride home highly recommend'},
      {name:'Matty',stars:5,text:'TJ and Adam at A&B Auto are the real deal. Great prices, great service, and always a straightforward diagnosis with quality work.'},
      {name:'Ken Mills',stars:5,text:'Adam and TJ have always done a get job and I have never gotten sticker shock when getting a bill. They do awesome work at a reasonable price. I\u2019ve had these gentlemen in the last five years work on over 9 of my cars.'},
      {name:'Rick Baumhover',stars:5,text:'Adam and TJ do AWESOME FAST WORK And are very pleasant and very affordable, will definitely have ALL my business from now on; can\u2019t go wrong with these guys. Totally 5 stars out of 5.'},
      {name:'Tam Alan',stars:5,text:'The guys at A&B are friendly and professional. There seems to be nothing that is beyond their car knowledge. They have been my first call for some years now and, my adult children also continue to take their vehicles to A&B. We all feel that the job is done right the first time, and priced competitively.'},
      {name:'Allen Langguth',stars:5,text:'We were on a family road trip to Dubuque when our check oil pressure light came on. A nice gentlemen stopped and told us to go to A & B Auto and ask for Adam. Adam was very nice and very helpful. He checked us over and gave us pointers and got us on the road. Thank you to the gentlemen who stopped and thank you to Adam!'}];
  }
  const town=C.city?C.city.split(',')[0]:'';
  const P={heroBg:AB_U('1517524206127-48bbd363f3d7',2200),repair:AB_U('1771340012378-3c86cb649193'),tire:AB_U('1645445522156-9ac06bc7a767'),sales:AB_U('1794208709613-1750c1a0483e'),
    shop:AB_U('1517524206127-48bbd363f3d7',1000),grease:AB_U('1619642751034-765dfdf7c58e'),lot:AB_U('1794208635374-9574f0527c12'),engine:AB_U('1486262715619-67b85e0b08d3',2000),oil:AB_U('1771340742493-52fbd5476ccb')};
  const go=id=>e=>{ if(e) e.preventDefault(); menu.hidden=true; scrollTo(id); };
  const A=(id,t)=>h('a',{href:'#'+id,onclick:go(id)},t);
  const items=C.items.slice(0,8);
  const links=()=>[/^a\s*(&|and|n)\s*b\s+auto/i.test(name)?A('ab-what','What We Do'):null,A('ab-service','Service'),A('ab-sales','Vehicle Sales'),A('ab-about','About'),/^a\s*(&|and|n)\s*b\s+auto/i.test(name)?A('ab-creds','Areas Served'):null,A('ab-how','How It Works'),C.reviews.length?A('ab-reviews','Reviews'):null,/^a\s*(&|and|n)\s*b\s+auto/i.test(name)?A('ab-faq','FAQ'):null,A('ab-contact','Contact')];
  const isAB=/^a\s*(&|and|n)\s*b\s+auto/i.test(name);
  const logo=isAB?'https://riverbendwebco.com/demo/img/ab-logo.png':(ok(x.logoUrl)||C.logo);
  const brand=h('a',{class:'ab-brand'+(logo?' has-logo':''),href:'#',onclick:e=>{e.preventDefault();scrollTo('ab-top');}},logo?h('img',{src:logo,alt:name}):isAB?h('span',{class:'ab-logo'},h('b',null,'A'),h('i',null,'&'),h('b',null,'B')):h('span',{class:'ab-logo'},h('b',null,(name.match(/\b[A-Za-z]/g)||['A']).slice(0,2).join('').toUpperCase())),
    h('span',{class:'ab-brand-t'},h('b',null,isAB?'Automotive Center':name.replace(/\s+(auto(motive)?\s+)?(center|centre)$/i,'')||name),h('small',null,isAB?'Service & Sales':'Auto Service & Sales')));
  const addrTxt=[C.addr,C.city].filter(Boolean).join(', ');
  const menu=h('nav',{class:'ab-menu',hidden:true},links(),C.tel?h('a',{class:'ab-btn',href:C.tel},abI('phone'),C.phoneTxt):null);
  const nav=h('header',{class:'ab-nav'},h('div',{class:'ab-w ab-nav-top'},brand,
      addrTxt?h('a',{class:'ab-nav-info ab-hide-s',href:C.maps,target:'_blank',rel:'noopener'},abI('pin'),h('span',null,addrTxt,h('small',null,C.today?(/closed/i.test(C.today)?'Closed today':/appointment/i.test(C.today)?'Today: by appointment':'Open today '+C.today):'Auto service and vehicle sales'))):null,
      C.tel?h('a',{class:'ab-nav-tel',href:C.tel},h('small',null,'Call the shop'),h('b',null,C.phoneTxt)):null,
      h('button',{type:'button',class:'ab-burger','aria-label':'Menu',onclick:()=>{menu.hidden=!menu.hidden;}},abI('menu'))),
    h('div',{class:'ab-w ab-nav-links'},links()),menu);
  const cards=isAB?[
    {id:'ab-what',t:'Auto Repair & Maintenance',d:'Oil changes, brakes, alignments, electrical diagnostics and engine repairs for foreign and domestic vehicles.',img:P.repair},
    {id:'ab-what',t:'Tires & Towing',d:'Tire sales, installation, balancing and repair, plus towing when your vehicle leaves you stranded.',img:AB_U('1730514785075-b065c757b653')},
    {id:'ab-sales',t:'Used Car Sales',d:'Quality pre-owned cars, trucks and SUVs to fit a variety of needs and budgets.',img:P.sales}]:[
    {id:'ab-service',t:'Auto Repair',d:'Diagnostics and repairs for cars, trucks and SUVs, done right by people who care about your vehicle.',img:P.repair},
    {id:'ab-service',t:'Tires & Brakes',d:'Keep your vehicle stopping and rolling safely, season after season.',img:P.tire},
    {id:'ab-sales',t:'Vehicle Sales',d:'Pre-owned cars, trucks and SUVs. Ask what is on the lot.',img:P.sales}];
  const bullets=isAB?['ASE Certified','Foreign and domestic repairs','Tires and towing','Quality pre-owned vehicles']:['Repairs for cars, trucks and SUVs','Pre-owned vehicles for sale','Maintenance and tires','Local, family-friendly shop'];
  const hero=bg(h('section',{class:'ab-hero'+(isAB?' shop':''),id:'ab-top'}),isAB?'https://riverbendwebco.com/demo/img/ab-shop2.jpg':(ok(x.heroPhoto)||P.heroBg),'linear-gradient(90deg,rgba(14,14,16,.9) 0%,rgba(14,14,16,.66) 50%,rgba(14,14,16,.3) 100%)');
  const hrev=(()=>{ const rv=C.reviews; if(!rv.length) return null; let k=0; const q=h('p',{class:'in'}), nm=h('b',{class:'in'});
    const put=()=>{ const r=rv[k%rv.length]; [q,nm].forEach(e=>{e.classList.remove('in'); void e.offsetWidth; e.classList.add('in');}); q.textContent='\u201C'+short(r.text,140)+'\u201D'; nm.textContent=r.name; };
    put(); const t=setInterval(()=>{ if(!q.isConnected){clearInterval(t);return;} k++; put(); },3000);
    return h('figure',{class:'ab-hrev','aria-live':'polite'},h('div',{class:'ab-hrev-h'},h('span',{class:'ab-stars'},[0,1,2,3,4].map(()=>abI('star'))),h('small',null,C.reviewsSource?C.reviewsSource+' reviews':'Reviews')),q,h('figcaption',null,nm)); })();
  hero.append(h('div',{class:'ab-w ab-hero-in'},
    hrev,
    h('p',{class:'ab-kick'},town?'Auto service & sales in '+town:'Auto service & vehicle sales'),
    h('h1',null,x.headline||'Automotive Center',h('span',null,'& Sales')),
    h('p',{class:'ab-lead'},C.tag||('From routine maintenance to major repairs, and quality pre-owned vehicles when it is time for something new. '+name+' keeps you on the road.')),
    h('ul',{class:'ab-bul'},bullets.map(b=>h('li',null,h('span',null,abI('check')),b))),
    h('div',{class:'ab-row'},C.tel?h('a',{class:'ab-btn',href:C.tel},abI('phone'),'Schedule Service'):h('a',{class:'ab-btn',href:'#ab-contact',onclick:go('ab-contact')},'Schedule Service'),h('a',{class:'ab-btn ghost',href:'#ab-sales',onclick:go('ab-sales')},'Shop Vehicles',abI('arrow')))),
    h('div',{class:'ab-w ab-cards'},cards.map(c=>bg(h('a',{class:'ab-card',href:'#'+c.id,onclick:go(c.id)},h('div',{class:'ab-card-t'},h('h3',null,c.t),h('p',null,c.d),h('span',null,'Learn more ',abI('arrow')))),c.img,'linear-gradient(180deg,rgba(10,10,12,0) 30%,rgba(10,10,12,.9) 100%)'))));
  const about=h('section',{class:'ab-sec ab-light',id:'ab-about'},h('div',{class:'ab-w ab-about rv'},
    h('h2',{class:'ab-h2'},name),
    h('div',{class:'ab-about-p'},(C.about?String(C.about).split(/\n+/).filter(Boolean):[name+' is a full-service automotive center and vehicle sales lot'+(town?' in '+town:'')+'. We take care of the vehicle you drive and help you find your next one.','Stop in for maintenance, a repair or a test drive, or give us a call with any questions.']).map(t=>h('p',null,t)))));
  const WHAT=isAB?[
    ['Used Car Sales & Inventory','tag',P.sales,'Looking for a dependable used vehicle? At A & B Automotive Center & Sales, we offer a regularly updated inventory of quality pre-owned cars, trucks, and SUVs to fit a variety of needs and budgets. Every vehicle is carefully selected and backed by the knowledge of an experienced automotive team, giving you added confidence in your purchase. Whether you’re searching for a first vehicle, a reliable commuter, or an upgrade for your family, we’re here to help you find the right fit.','#ab-sales','See vehicle sales'],
    ['Auto Repair & Maintenance','wrench',P.repair,'Keep your vehicle performing at its best with our comprehensive automotive repair and maintenance services. Our skilled technicians work on both foreign and domestic vehicles, providing everything from oil changes, brake repairs, alignments, and front-end work to electrical diagnostics and engine repairs. We focus on quality workmanship, honest recommendations, and dependable service to help extend the life of your vehicle and keep you safely on the road.','#ab-service','See all services'],
    ['Specialty Vehicle & RV Services','gauge',AB_U('1636761358757-0a616eb9e17e'),'In addition to traditional automotive repair, we specialize in servicing motorcycles, campers, RVs, and small engines. From routine maintenance and seasonal winterizing to more advanced repairs, our team has the expertise and equipment to keep your recreational and specialty vehicles operating reliably year-round. No matter what you drive or ride, we deliver the same attention to detail and professional care.',null,null],
    ['Tires & Towing','tire',AB_U('1730514785075-b065c757b653'),'Whether you need new tires, tire repairs, or emergency roadside assistance, A & B Automotive Center & Sales has you covered. We offer tire sales, installation, balancing, and repair services to help maximize safety and performance. If your vehicle leaves you stranded, our reliable towing service is available to get you and your vehicle where you need to be quickly and safely.',null,null],
    ['Flexible Scheduling','clock','https://riverbendwebco.com/demo/img/ab-shop2.jpg','We know it can be difficult to fit vehicle service into a busy schedule, which is why we offer flexible appointment options, including Saturdays and Sundays by appointment. Our goal is to make maintaining and repairing your vehicle as convenient as possible, providing service when it works best for you.',null,null]]:[];
  const what=WHAT.length?h('section',{class:'ab-sec',id:'ab-what'},h('div',{class:'ab-w'},
    h('div',{class:'ab-head rv'},h('h2',{class:'ab-h2'},'What we do'),h('p',{class:'ab-mut'},'Used car sales, full auto repair, specialty vehicles, tires and towing, all from one local shop.')),
    h('div',{class:'ab-what'},WHAT.map(([t,ic,img,d,href,lab],i)=>h('article',{class:'ab-wr rv'+(i%2?' flip':'')},bg(h('div',{class:'ab-wr-img'}),img),
      h('div',{class:'ab-wr-t'},h('span',{class:'ab-wr-i'},abI(ic)),h('h3',null,t),h('p',null,d),
        h('div',{class:'ab-row'},href?h('a',{class:'ab-link',href:href,onclick:go(href.slice(1))},lab,abI('arrow')):null,C.tel?h('a',{class:'ab-link',href:C.tel},'Call '+C.phoneTxt,abI('phone')):null))))))):null;
  const feats=[['wrench','Repairs and maintenance','1615906655593-ad0386982a0f'],['tire','Tires and brakes','1760317890314-e964ffd7e6a6'],['car','Cars, trucks and SUVs','1792010025571-58898f12dc49'],['tag','Pre-owned vehicle sales','1794208709613-1750c1a0483e'],[isAB?'clock':'chat',isAB?'Saturday and Sunday appointments':'Call or stop in with questions','1792793176006-a7b35e29c7e1'],['hand','Friendly, local service',isAB?'SHOP':'1517524206127-48bbd363f3d7']];
  const why=h('section',{class:'ab-sec'},h('div',{class:'ab-w ab-why'},
    h('div',{class:'ab-why-t rv'},h('h2',{class:'ab-h2'},'Why drivers choose ',h('br'),name),h('p',{class:'ab-mut'},'One stop for keeping your vehicle running and finding your next one, with people who treat you like a neighbor.'),
      h('div',{class:'ab-feats'},feats.map(([i,t,ph])=>bg(h('div',{class:'ab-feat'},h('span',null,abI(i)),h('b',null,t)),ph==='SHOP'?'https://riverbendwebco.com/demo/img/ab-shop2.jpg':AB_U(ph,600),'linear-gradient(180deg,rgba(10,10,12,.05) 20%,rgba(10,10,12,.85) 100%)')))),
    h('div',{class:'ab-why-pic rv'},bg(h('div',{class:'ab-circle'}),isAB?'https://riverbendwebco.com/demo/img/ab-shop2.jpg':(ok(x.aboutPhoto)||C.own[0]||P.shop)))));
  const AREAS=['Dubuque, IA','Epworth, IA','Asbury, IA','Maquoketa, IA','Bellevue, IA','East Dubuque, IL','Galena, IL','Platteville, WI'];
  const creds=isAB?h('section',{class:'ab-sec',id:'ab-creds'},h('div',{class:'ab-w'},
    h('div',{class:'ab-head rv'},h('h2',{class:'ab-h2'},'Certified, trusted and local'),h('p',{class:'ab-mut'},'ASE Certified service, the parts and products you need, and a shop that serves the whole tri-state area.')),
    h('div',{class:'ab-creds'},
      h('div',{class:'ab-cred rv'},h('span',null,abI('shield')),h('small',null,'Certifications'),h('b',null,'ASE Certified'),h('p',null,'Repairs handled by ASE Certified service.')),
      h('div',{class:'ab-cred rv'},h('span',null,abI('hand')),h('small',null,'Associations'),h('b',null,'NFIB & BBB'),h('p',null,'Member of the National Federation of Independent Business (NFIB) and the BBB.')),
      h('div',{class:'ab-cred rv'},h('span',null,abI('tire')),h('small',null,'Products'),h('b',null,'Parts & accessories'),h('ul',{class:'ab-tags'},['Tires','Wheels','Wiper blades','Suspension','Truck accessories'].map(t=>h('li',null,t)))),
      h('div',{class:'ab-cred rv'},h('span',null,abI('pin')),h('small',null,'Areas served'),h('b',null,'Iowa, Illinois & Wisconsin'),h('ul',{class:'ab-tags'},AREAS.map(t=>h('li',null,t))))))):null;
  const svcList=isAB?['CV & drivetrain repair','Suspension','Tires','Batteries','Engine diagnostics','Electrical','A/C','Tune-ups','Brakes','Exhaust','Inspections','Oil & filter change']:items.length?items.map(i=>i.name):['Diagnostics & check engine','Brakes','Tires & alignment','Oil changes & maintenance','Suspension & steering','Heating & A/C','Batteries & electrical','Engine & transmission'];
  const service=h('section',{class:'ab-sec ab-light',id:'ab-service'},h('div',{class:'ab-w'},
    h('div',{class:'ab-head rv'},h('h2',{class:'ab-h2'},'Service & Repair'),h('p',{class:'ab-mut'},'Bring it in for anything from a check engine light to new tires. Call ahead and we will get you on the schedule.')),
    h('div',{class:'ab-svc'+(svcList.length===10?' n10':'')+(svcList.length===12?' n12':'')},svcList.map((t,i)=>{ const ph=AB_SVC[t]||(items[i]&&items[i].photo)||''; return h('a',{class:'ab-svc-i rv',href:C.tel||'#ab-contact',onclick:C.tel?null:go('ab-contact')},ph?bg(h('div',{class:'ab-svc-img'}),/^https/.test(ph)?ph:AB_U(ph,700)):null,h('div',{class:'ab-svc-b'},h('span',null,String(i+1).padStart(2,'0')),h('b',null,t),abI('arrow'))); })),isAB?h('div',{class:'ab-also rv'},h('b',null,'We also handle'),h('ul',{class:'ab-tags'},['Alignments','Front-end work','Transmission work','Tire repair & balancing','Towing','Motorcycles','Campers & RVs','Small engines','Seasonal winterizing','Foreign & domestic vehicles'].map(t=>h('li',null,t)))):null));
  const ctaBand=(id,img,title,sub)=>h('section',{class:'ab-sec tight',id:id||null},h('div',{class:'ab-w'},h('div',{class:'ab-cta rv'},bg(h('div',{class:'ab-cta-img'}),img),
    h('div',{class:'ab-cta-t'},h('h2',null,title),h('p',null,sub),C.tel?h('a',{class:'ab-cta-tel',href:C.tel},C.phoneTxt):h('a',{class:'ab-btn',href:'#ab-contact',onclick:go('ab-contact')},'Contact us')))));
  const cta1=ctaBand(null,P.grease,'Schedule your service','Save time. Call the shop and we will set up a time that works for you.');
  const steps=[['Call or stop in','Tell us what is going on with your vehicle.'],['Inspection','We look it over and find the real problem.'],['Estimate','We go over the work and the cost with you.'],['Repair','Our techs fix it with quality parts.'],['Quality check','We test it to make sure it is right.'],['Back on the road','Pick up your vehicle and get going.']];
  const how=bg(h('section',{class:'ab-sec ab-dark',id:'ab-how'}),P.engine,'linear-gradient(rgba(10,10,12,.9),rgba(10,10,12,.94))');
  how.append(h('div',{class:'ab-w'},h('h2',{class:'ab-h2 c'},'How we work'),h('ol',{class:'ab-tl'},steps.map(([t,d],i)=>h('li',{class:'rv '+(i%2?'r':'l')},h('span',null,String(i+1).padStart(2,'0')),h('div',null,h('b',null,t),h('p',null,d)))))));
  const sales=h('section',{class:'ab-sec',id:'ab-sales'},h('div',{class:'ab-w ab-sales'},
    h('div',{class:'ab-sales-t rv'},h('h2',{class:'ab-h2'},'Vehicle Sales'),h('p',{class:'ab-mut'},isAB?'Looking for a dependable used vehicle? We offer a regularly updated inventory of quality pre-owned cars, trucks, and SUVs to fit a variety of needs and budgets. Every vehicle is carefully selected and backed by the knowledge of an experienced automotive team.':'Looking for your next car, truck or SUV? Ask about the vehicles on our lot right now. Stop in to look around or call to ask what is available.'),
      h('ul',{class:'ab-checks'},(isAB?['Cars, trucks and SUVs','Carefully selected by an experienced team','A first car, a commuter or a family upgrade']:['Pre-owned cars, trucks and SUVs','Ask what is on the lot today','Test drives welcome']).map(t=>h('li',null,h('span',null,abI('check')),t))),
      h('div',{class:'ab-row'},C.tel?h('a',{class:'ab-btn',href:C.tel},abI('phone'),'Ask About Inventory'):null,C.fb?h('a',{class:'ab-btn ghost dk',href:C.fb,target:'_blank',rel:'noopener'},'See vehicles on Facebook'):null)),
    bg(h('div',{class:'ab-sales-pic rv'}),P.lot)));
  const cta2=ctaBand(null,P.sales,'Find your next vehicle','Call to ask what is on the lot, or come by for a test drive.');
  const rv=C.reviews; let reviews=null;
  if(rv.length){ let ri=0; const per=()=>innerWidth<760?1:3;
    const track=h('div',{class:'ab-revs'});
    const draw=()=>{ const n=per(); track.replaceChildren(...Array.from({length:Math.min(n,rv.length)},(_,k)=>rv[(ri+k)%rv.length]).map(r=>h('figure',{class:'ab-rev'},h('div',{class:'ab-rev-h'},h('span',{class:'ab-stars','aria-label':(r.stars||5)+' stars'},[0,1,2,3,4].slice(0,r.stars||5).map(()=>abI('star'))),abI('quote')),h('blockquote',null,short(r.text,260)),h('figcaption',null,h('span',{class:'ab-av'},r.name.trim()[0]),h('span',null,r.name,h('small',null,C.reviewsSource?C.reviewsSource+' review':'Customer review')))))); };
    draw(); let rt=setInterval(()=>{ if(!track.isConnected) return; ri=(ri+1)%rv.length; draw(); },5000); const restart=()=>{ clearInterval(rt); rt=setInterval(()=>{ if(!track.isConnected) return; ri=(ri+1)%rv.length; draw(); },5000); };
    reviews=h('section',{class:'ab-sec ab-light',id:'ab-reviews'},h('div',{class:'ab-w'},h('h2',{class:'ab-h2'},'Customer reviews'),h('p',{class:'ab-mut'},C.reviewsSource==='Google'?'5-star reviews from drivers on Google.':'What drivers say about '+name+'.'),
      h('div',{class:'ab-rev-wrap'},h('button',{type:'button',class:'ab-arr','aria-label':'Previous',onclick:()=>{ri=(ri-1+rv.length)%rv.length;draw();restart();}},abI('arrow')),track,h('button',{type:'button',class:'ab-arr n','aria-label':'Next',onclick:()=>{ri=(ri+1)%rv.length;draw();restart();}},abI('arrow'))))); }
  const FAQ=isAB?[
    ['What automotive services do you offer?','At A & B Automotive Center Inc., we provide a full range of auto repair and maintenance services, including engine diagnostics, brake repair, oil changes, tire services, transmission work, and more. Our goal is to keep your vehicle running safely and efficiently, no matter the issue.'],
    ['Do you sell pre-owned vehicles?','Yes, we have a selection of high-quality pre-owned vehicles for sale. All our vehicles are inspected thoroughly to ensure they meet safety and performance standards.'],
    ['Can I bring my car in without an appointment?','While we welcome walk-ins, scheduling an appointment ensures faster service and reduces your wait time.'],
    ['What payment methods do you accept?','We accept various payment methods including cash, major credit cards, debit cards and personal checks.'],
    ['Will you work with my insurance company?','Absolutely! We have experience working with all major insurance companies and can assist you with the claims process to ensure a smooth experience.'],
    ['Do you work on all makes and models?','Yes, our experienced technicians are trained to work on a wide variety of makes and models, both domestic and foreign. No matter what you drive, we can provide reliable service tailored to your vehicle’s needs.'],
    ['How can I view your current vehicle inventory?','To see what vehicles are currently available, give us a call at (563) 583-3575 or stop by the lot at 10512 Key W Dr. We\u2019re happy to go over the details, photos and pricing on any vehicle in stock.'],
    ['Do you inspect the vehicles you sell?','Yes. As a full-service automotive repair shop, we carefully evaluate our vehicles and use our automotive expertise to help provide dependable transportation options for our customers.'],
    ['Can I schedule service appointments on weekends?','Yes. We offer Saturday and Sunday appointments to help accommodate busy schedules. Weekend appointments are available by appointment.']]:(Array.isArray(x.faq)?x.faq.filter(q=>Array.isArray(q)&&q.length===2).slice(0,8):[]);
  const faqSec=FAQ.length?h('section',{class:'ab-sec ab-light',id:'ab-faq'},h('div',{class:'ab-w ab-faq'},
    h('div',{class:'ab-faq-h rv'},h('h2',{class:'ab-h2'},'Frequently asked questions'),h('p',{class:'ab-mut'},'Quick answers about service, payment and vehicle sales. Still have a question? Give us a call.'),
      C.tel?h('a',{class:'ab-btn',href:C.tel},abI('phone'),C.phoneTxt):null),
    h('div',{class:'ab-faq-l'},FAQ.map(([q,a],i)=>h('details',{class:'ab-q',open:i===0?true:null},h('summary',null,h('span',null,q),h('i',null,abI('arrow'))),h('p',null,a)))))):null;
  const mapQ=encodeURIComponent([name,addrTxt].filter(Boolean).join(', '));
  const contact=h('section',{class:'ab-sec',id:'ab-contact'},h('div',{class:'ab-w ab-contact'},
    h('div',{class:'rv'},h('h2',{class:'ab-h2'},'Come see us'),h('p',{class:'ab-mut'},'Stop in for service or a test drive.'),
      h('div',{class:'ab-ci'},
        addrTxt?h('a',{href:C.maps,target:'_blank',rel:'noopener'},abI('pin'),h('span',null,h('small',null,'Address'),addrTxt)):null,
        C.tel?h('a',{href:C.tel},abI('phone'),h('span',null,h('small',null,'Phone'),C.phoneTxt)):null,
        C.email?h('a',{href:'mailto:'+C.email},abI('mail'),h('span',null,h('small',null,'Email'),C.email)):null,
        C.hasHours?h('div',null,abI('clock'),h('span',null,h('small',null,'Hours'),h('div',{class:'ab-hours'},hoursRows(C)))):null)),
    x.sample?null:h('div',{class:'ab-map rv'},(addrTxt||C.city)?h('iframe',{src:'https://www.google.com/maps?q='+mapQ+'&output=embed',title:'Map to '+name,loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'}):null)));
  const foot=h('footer',{class:'ab-foot'},h('div',{class:'ab-w ab-foot-in'},
    h('div',null,brand.cloneNode(true),h('small',null,'© '+new Date().getFullYear()+' '+name)),
    h('div',null,h('b',null,'Contact'),C.tel?h('a',{href:C.tel},C.phoneTxt):null,addrTxt?h('span',null,addrTxt):null,C.email?h('a',{href:'mailto:'+C.email},C.email):null),
    h('div',null,h('b',null,'Company'),links())),isAB?h('div',{class:'ab-w ab-foot-x'},h('span',null,'ASE Certified'),h('span',null,'NFIB member'),h('span',null,'BBB'),h('span',null,'Serving '+AREAS.join(' \u00b7 '))):null);
  return h('div',{class:'ab'},nav,hero,about,what,why,creds,cta1,service,how,sales,cta2,reviews,faqSec,contact,foot);
}

/* ===================== MUTUAL WHEEL (truck parts & service, red/blue on charcoal) ===================== */
const MW_U=id=>'https://images.unsplash.com/photo-'+id+'?auto=format&fit=crop&w=1200&q=72';
const MW_DATA={
  addr:'30 Jones St', city:'Dubuque, IA', phone:'5635560800', tollfree:'(800) 798-0080', manager:'Mark Bale',
  hours:['8am - 5pm','8am - 5pm','8am - 5pm','8am - 5pm','8am - 5pm','8am - 12pm','Closed'],
  hero:MW_U('1592805144716-feeccccef5ac'),
  services:[
    {i:'pickup',n:'Light Truck Accessories',d:'Hood shields, running boards, tonneau covers, light bars, hitches and much more for your pickup.',img:MW_U('1772817337500-e6fca46864a8'),
      intro:'See Mutual Wheel Co. for all your light truck accessories!',
      list:['Hood shields','Running boards','Spoilers','Tonneau covers','Light bars','Bed rails','Lens covers','Custom floor covers','Tool boxes','Truck racks','Visors','Mud flaps','Tailgate protectors','Grill guards','Polyurethane suspension bushings','Grill covers','Hitches','And much, much more']},
    {i:'parts',n:'Truck Parts & Accessories',d:'Retail and wholesale parts, accessories and tools for light, medium and heavy-duty trucks.',img:MW_U('1767341372150-b9521fec39a3'),
      intro:'A full-service parts department for all of your truck parts, accessories and tool needs.',
      list:['Retail and wholesale parts sales','Light, medium and heavy-duty trucks','Truck and trailer parts','Tools and shop supplies','Large inventory on hand','Knowledgeable counter staff']},
    {i:'brake',n:'Brakes & Brake Relining',d:'Air and hydraulic brakes, plus relining, drums and rotors from our machine shop.',img:MW_U('1619642751034-765dfdf7c58e'),
      intro:'Air and hydraulic brake service in our drive-in bays, and complete brake relining in our Moline machine shop. Some machine shop services are also available in Dubuque.',
      groups:[['Drive-In Service',['Air brakes','Hydraulic brakes']],
        ['Machine Shop',['Reline brake shoes (all types)','Reline brake bands (industrial)','Turn brake drums & rotors','Countersink & rivet brake lining to fit any shoe or band','Arc grind brake lining to fit drum diameter','Bond brake lining on shoes','Top Performance lined brake shoes, made in Moline']]]},
    {i:'frame',n:'Alignment, Frame & Axles',d:'Total truck and trailer alignment, frame correction, wheels and axles.',img:MW_U('1727893119356-1702fe921cf9'),
      intro:'Drive-in service at our Dubuque, Davenport, Milan and Monmouth locations.',
      groups:[['Drive-In Service',['Total truck & trailer alignment','Total frame & suspension correction & repair','Wheels & axles','Wheel balancing']],['Machine Shop',['Straighten axles']]]},
    {i:'spring',n:'Springs & Suspension',d:'Leaf and air springs, leaf spring rebuilding and U-bolt bending.',img:MW_U('1615906655593-ad0386982a0f'),
      intro:'Spring and suspension work in our drive-in bays, with rebuilding done in our machine shop.',
      groups:[['Drive-In Service',['Leaf springs','Air springs','Frame & suspension correction']],['Machine Shop',['Complete leaf spring rebuilding & repairing','U-bolt bending','Hydraulic press work']]]},
    {i:'driveline',n:'Driveline',d:'Driveline service and complete driveline remanufacturing.',img:MW_U('1727893304219-063d142ce6f3'),
      intro:'Driveline repair in our drive-in bays and complete remanufacturing in our machine shop.',
      groups:[['Drive-In Service',['Driveline service & repair']],['Machine Shop',['Complete driveline remanufacturing']]]},
    {i:'trailer',n:'Truck & Trailer Repair',d:'Complete truck and trailer service: exhaust, fifth wheels, lights, landing gear and doors.',img:MW_U('1701637657912-9e23e32155d1'),
      intro:'Complete truck & trailer service facilities. Our Dubuque location has a fully equipped chassis repair shop for trucks large and small.',
      groups:[['Drive-In Service',['Exhaust systems','Fifth wheels','Lights','Landing gear','Overhead doors']]]},
    {i:'gear',n:'Machine Shop Service',d:'Brake relining, drums and rotors, axles, driveline and spring rebuilding.',img:MW_U('1760310936486-4dd450aab2a8'),
      intro:'Available at our central warehouse in Moline, Illinois. Some services are also available at our Dubuque, Davenport, East Peoria, Monmouth and Milan locations.',
      list:['Reline brake shoes (all types)','Reline brake bands (industrial)','Turn brake drums & rotors','Countersink & rivet brake lining to fit any shoe or band','Arc grind brake lining to fit drum diameter','Bond brake lining on shoes','Hydraulic press work','Straighten axles','Complete driveline remanufacturing','Complete leaf spring rebuilding & repairing','U-bolt bending']}],
  locs:[['Dubuque, IA','30 Jones St','(563) 556-0800'],['Cedar Rapids, IA','340 Waconia Ct SW','(319) 366-1081'],['Waterloo, IA','2277 Laporte Rd','(319) 234-1231'],['Davenport, IA','',''],
    ['Moline, IL','2345 4th Ave',''],['Milan, IL','3215 1st Ave E','(309) 757-1234'],['East Peoria, IL','606 N Main St','(309) 694-6211'],['Monmouth, IL','1350 S Main St','(309) 734-8581'],
    ['Bloomington, IL','15 Quest Dr','(309) 827-3080'],['Quincy, IL','1910 N 43rd St','(217) 228-3360'],['Rockford, IL','','']]
};
const MW_ICO={
  spring:'<path d="M12 2v3M12 19v3M7 5h10l-10 3.5h10l-10 3.5h10l-10 3.5h10"/>',
  driveline:'<path d="M3 12h18"/><rect x="2" y="9" width="4" height="6" rx="1"/><rect x="18" y="9" width="4" height="6" rx="1"/><path d="M9 9.5l2 5M13 9.5l2 5"/>',
  trailer:'<path d="M2 5h14v10H2zM16 15h5"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="11" cy="17.5" r="1.8"/><path d="M18 15v4"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
  pickup:'<path d="M2 15V11l2-4h7v4h9l2 2v2z"/><path d="M6 7v4"/><circle cx="6.5" cy="16.5" r="1.8"/><circle cx="17.5" cy="16.5" r="1.8"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  parts:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  wrench:'<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5z"/>',
  brake:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3"/><path d="M12 3.5a8.5 8.5 0 0 1 8 5.5"/><path d="M5.2 17.4l2.3-1.6M16.5 16l2.3 1.6"/>',
  air:'<path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h8"/>',
  frame:'<path d="M3 7h18M3 17h18M6 7v10M18 7v10M10 7l-4 10M14 7l4 10"/>',
  tools:'<path d="M3 21l7-7M14 4l6 6-3 3-6-6zM8 3l2 2-5 5-2-2z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', shield:'<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  pin:'<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>', phone:'<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  truck:'<path d="M2 6h11v10H2zM13 9h4l4 4v3h-8z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>', boxes:'<path d="M3 10h8v10H3zM13 10h8v10h-8zM8 3h8v7H8z"/>',
  users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3 3 0 0 1 0 6M18 14c2 .7 3 2.8 3 6"/>', home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v11h14V10"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>', arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>', chat:'<path d="M4 5h16v11H9l-5 4z"/>', search:'<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  wheel:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.6"/><path d="M12 3v6.4M12 14.6V21M3 12h6.4M14.6 12H21M5.6 5.6l4.6 4.6M13.8 13.8l4.6 4.6M18.4 5.6l-4.6 4.6M10.2 13.8l-4.6 4.6"/>'
};
function mwIco(k){ const s=h('span',{class:'mw-ico','aria-hidden':'true'}); s.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'+(MW_ICO[k]||MW_ICO.wheel)+'</svg>'; return s; }
function mutual(C){
  const D=MW_DATA, x=C.x, name=C.name||'Mutual Wheel Company';
  const ok=u=>typeof u==='string'&&/^https:\/\/[^\s"'<>]+$/.test(u)?u:'';
  const addr=C.addr||D.addr, city=C.city||D.city, addrTxt=addr+', '+city;
  const digits=(C.phone||D.phone).replace(/\D/g,'').slice(-10), tel='tel:+1'+digits, phoneTxt='('+digits.slice(0,3)+') '+digits.slice(3,6)+'-'+digits.slice(6);
  const hours=C.hasHours?C.hours:D.hours, today=hours[todayIx()]||'';
  const maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name+', '+addrTxt);
  const svc=Array.isArray(x.services)&&x.services.length?x.services:D.services;
  const go=(id)=>e=>{e.preventDefault();scrollTo(id);};
  const A=(id,t)=>h('a',{href:'#'+id,onclick:go(id)},t);
  const logo=ok(x.logoUrl)||C.logo;
  const brand=h('a',{class:'mw-brand',href:'#',onclick:e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});}},
    logo?h('img',{src:logo,alt:name}):[mwIco('wheel'),h('span',{class:'mw-wm'},h('b',null,'Mutual Wheel'),h('small',null,'The Truck Experts'))]);
  const links=()=>[A('mw-services','Services'),A('mw-why','Why Us'),A('mw-request','Request a Part'),h('a',{href:'#history',onclick:e=>openHist(e)},'History'),A('mw-visit','Locations')];
  const nav=h('header',{class:'mw-nav'},h('div',{class:'mw-w mw-nav-in'},brand,h('nav',{class:'mw-links'},links()),
    h('div',{class:'mw-nav-r'},h('a',{class:'mw-tel',href:tel},mwIco('phone'),phoneTxt),h('a',{class:'mw-btn red sm mw-dk',href:'#mw-request',onclick:go('mw-request')},'Request a Part'),h('a',{class:'mw-btn red sm mw-mb',href:tel},mwIco('phone'),'Call'))),
    h('nav',{class:'mw-mnav'},links()));
  const strip=[['clock','Since 1893','Family owned'],['shield','ASE Certified','Service technicians'],['truck','Light to Heavy-Duty','Trucks of every size'],['pin','11 Locations','Iowa & Illinois']];
  const hero=h('section',{class:'mw-hero'},bg(h('div',{class:'mw-hero-bg'}),ok(x.heroPhoto)||D.hero,'linear-gradient(90deg,rgba(12,13,16,.94) 0%,rgba(12,13,16,.78) 45%,rgba(12,13,16,.25) 100%)'),
    h('div',{class:'mw-w mw-hero-in'},
      h('div',{class:'mw-hero-t'},h('small',{class:'mw-kick'},'Servicing the Quad Cities since 1893 · Truck Parts & Service'),
        h('h1',null,'Truck Parts, Accessories', h('br'),'& Service ',h('span',null,'You Can Trust')),h('i',{class:'mw-rule'}),
        h('p',null,'Your one-stop source for light, medium and heavy-duty truck parts, accessories and service. Retail and wholesale parts plus a fully equipped chassis repair shop.'),
        h('div',{class:'mw-cta'},h('a',{class:'mw-btn red',href:tel},'Call the Parts Counter'),h('a',{class:'mw-btn blue',href:'#mw-request',onclick:go('mw-request')},'Request a Part or Repair')))),
    h('div',{class:'mw-w'},h('div',{class:'mw-strip'},strip.map(([i,a,b])=>h('div',null,mwIco(i),h('span',null,h('b',null,a),h('small',null,b)))))));
  const head=(a,b,id)=>h('div',{class:'mw-head rv'},h('h2',null,a+' ',h('span',null,b)));
  const services=h('section',{class:'mw-sec',id:'mw-services'},h('div',{class:'mw-w'},head('Our Truck','Services'),
    h('div',{class:'mw-grid'},svc.map(s=>{ const c=bg(h('button',{type:'button',class:'mw-card rv','aria-haspopup':'dialog'},mwIco(s.i||'wrench'),h('b',null,s.n),h('p',null,s.d),h('span',{class:'mw-more'},'See what we offer',mwIco('arrow'))),ok(s.img),'linear-gradient(180deg,rgba(12,13,16,.35) 0%,rgba(12,13,16,.92) 100%)'); c.addEventListener('click',()=>openSvc(s)); return c; })),
    h('div',{class:'mw-center'},h('a',{class:'mw-btn line',href:tel},'Call about any part'))));
  const why=[['boxes','Large Inventory'],['users','Knowledgeable Staff'],['shield','ASE Certified Techs'],['parts','Retail & Wholesale'],['brake','Brake Shoes Made In-House'],['home','Family Owned Since 1940']];
  const whyS=h('section',{class:'mw-sec mw-soft',id:'mw-why'},h('div',{class:'mw-w'},head('Why Truckers','Choose Us'),
    h('div',{class:'mw-why'},why.map(([i,t])=>h('div',{class:'rv'},mwIco(i),h('b',null,t))))));
  const openSvc=s=>{
    const close=()=>{ m.remove(); document.documentElement.classList.remove('os-lock'); removeEventListener('keydown',esc); };
    const esc=e=>{ if(e.key==='Escape') close(); };
    const m=h('div',{class:'mw-modal',role:'dialog','aria-modal':'true','aria-label':s.n},
      h('div',{class:'mw-modal-card'},
        bg(h('div',{class:'mw-modal-top'},mwIco(s.i||'wrench'),h('h3',null,s.n)),ok(s.img),'linear-gradient(180deg,rgba(12,13,16,.25) 0%,rgba(12,13,16,.9) 100%)'),
        h('button',{type:'button',class:'mw-modal-x','aria-label':'Close',onclick:()=>close()},mwIco('x')),
        h('div',{class:'mw-modal-b'},h('p',{class:'mw-modal-intro'},s.intro||s.d),
          (s.groups||[[null,s.list||[]]]).map(([gt,items])=>[gt?h('h4',{class:'mw-modal-g'},gt):null,h('ul',{class:'mw-modal-list'+(items.length>10?' long':'')},items.map(t=>h('li',null,mwIco('check'),t)))]),
          h('div',{class:'mw-modal-cta'},h('a',{class:'mw-btn red',href:tel},mwIco('phone'),'Call '+phoneTxt),
            h('button',{type:'button',class:'mw-btn blue',onclick:()=>{ close(); const sl=form.elements.need; sl.value=s.n; scrollTo('mw-request'); setTimeout(()=>form.elements.name.focus({preventScroll:true}),700); }},'Request This')))));
    m.addEventListener('click',e=>{ if(e.target===m) close(); });
    addEventListener('keydown',esc); document.documentElement.classList.add('os-lock'); document.body.append(m); m.querySelector('.mw-modal-x').focus();
  };
  const f=(n,ph,type)=>h('input',{name:n,placeholder:ph,type:type||'text','aria-label':ph});
  const sel=(n,ph,opts)=>h('select',{name:n,'aria-label':ph},h('option',{value:''},ph),opts.map(o=>h('option',null,o)));
  const form=h('form',{class:'mw-form',novalidate:true},f('name','Name'),f('phone','Phone','tel'),f('truck','Truck make & year'),
    sel('need','What do you need?',svc.map(x=>x.n).concat(['Something else'])),
    h('textarea',{name:'note',placeholder:'Part number or what is going on (optional)','aria-label':'Details',rows:3}),
    h('button',{type:'submit',class:'mw-btn red'},'Send My Request'),h('p',{class:'mw-form-msg',role:'status'}));
  form.addEventListener('submit',e=>{ e.preventDefault(); const v=k=>(form.elements[k].value||'').trim(); const msg=form.querySelector('.mw-form-msg');
    if(!v('name')||!v('phone')){ msg.textContent='Please add your name and phone number.'; return; }
    const body='Hi '+name+', this is '+v('name')+' ('+v('phone')+'). '+(v('need')?'I need: '+v('need')+'. ':'')+(v('truck')?'Truck: '+v('truck')+'. ':'')+v('note');
    if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){ location.href='sms:+1'+digits+(/iPhone|iPad|iPod/i.test(navigator.userAgent)?'&':'?')+'body='+encodeURIComponent(body); msg.textContent='Opening your text messages...'; }
    else msg.textContent='Thanks! Call us at '+phoneTxt+' and mention your request, or text it to the same number.'; });
  const req=h('section',{class:'mw-sec',id:'mw-request'},h('div',{class:'mw-w'},h('div',{class:'mw-req rv'},
    bg(h('div',{class:'mw-req-pic'}),MW_U('1701637657912-9e23e32155d1')),
    h('div',{class:'mw-req-t'},h('h2',null,'Need a Part ',h('span',null,'Today?')),h('p',null,'Tell us what you need and we will check stock and call you back.'),
      h('ul',null,['Retail and wholesale pricing','Parts for light, medium and heavy-duty trucks','Knowledgeable counter staff','Chassis repair shop on site'].map(t=>h('li',null,mwIco('check'),t)))),
    form)));
  const openHist=e=>{ if(e) e.preventDefault(); if(location.hash!=='#history') location.hash='history'; else showHist(); };
  const hist=h('section',{class:'mw-sec mw-soft',id:'mw-history'},h('div',{class:'mw-w mw-hist'},
    h('figure',{class:'mw-hist-photo rv'},h('img',{src:'https://riverbendwebco.com/demo/img/mw-1893-building.jpg',alt:'The Mutual Wheel Company building in 1893',loading:'lazy'}),h('figcaption',null,h('span',null,'Serving the transportation industry for over 130 years'))),
    h('div',{class:'mw-hist-t rv'},h('h2',null,'Built on ',h('span',null,'130+ Years')),
      h('p',null,'In 1893, eleven Quad City carriage makers joined forces to build their own wooden wheels and take on the big wheel trust. By 1900 Mutual Wheel was one of the largest wheel makers in the world. When steel wheels and the Depression arrived, the company changed with the times and became a truck parts and service business. The Engstrom family has owned it since 1940, and it has served Dubuque since 1966.'),
      h('div',{class:'mw-mini'},[['1893','Founded in Moline'],['1932','Parts & drive-in service'],['1940','Engstrom family'],['1966','Dubuque opens']].map(([y,t])=>h('div',null,h('b',null,y),h('span',null,t)))),
      h('a',{class:'mw-btn red',href:'#history',onclick:openHist},'Read Our Full History',mwIco('arrow')))));
  const HIST=[
    ['1893','Eleven Carriage Makers Join Forces','Eleven Quad City carriage manufacturers formed the Mutual Wheel Company in Moline so they could build their own wooden-spoked wheels and stand up to the American Wheel Trust. The Trust even sent a spy to the founding meeting, but he did not get in. The company opened at 729 Third Avenue with a $40,000 investment and a goal of 30,000 sets of wheels a year, with George McMaster as its first general manager.'],
    ['1900','The World\u2019s Largest Wheel Maker','The Quad Cities became known as \u201cLittle Detroit,\u201d and Mutual Wheel built the wooden wheels for many of the area\u2019s early motor vehicles. By 1900 the company had 500 to 600 employees, produced 100,000 sets of wheels a year, ran branch stock plants in the southern timber districts and claimed the title of largest vehicle wheel maker in the world.'],
    ['1932','A New Direction','Steel automobile wheels arrived in 1927, and the Great Depression followed. In 1932 the company stopped making wooden wheels and moved into distributing auto and truck parts with drive-in service. The change was led by Elmer Engstrom, who had joined the company in 1917 as a timekeeper.'],
    ['1940','The Engstrom Family Takes the Wheel','Elmer Engstrom bought the company in 1940 with George Wood. During World War II the Rock Island Arsenal was a key customer. In 1948 Elmer bought out Wood\u2019s shares, and he and his wife Helen became sole owners, making Mutual Wheel a family business.'],
    ['1950s','Growing with the Trucking Industry','A new Moline facility opened at 2345 4th Avenue in 1950 and was expanded in 1955, 1960, 1967 and 1970. After Elmer passed away in 1951, Helen, their son Donald and his wife June ran the company. Mutual Wheel became a major wholesale distributor of wheels, truck equipment and power brakes and added a full brake service garage.'],
    ['1966','New Branches, Including Dubuque','Branches opened in Monmouth (1954), Dubuque (1966), East Peoria (1973) and Milan (1977). In 1968 the company became a family corporation.'],
    ['1980','One Central Warehouse','Mutual Wheel moved to a central warehouse in Moline, expanded to 50,000 square feet, with trucks delivering to every branch twice a week. Moline is also home to the remanufacturing and machine shop operations.'],
    ['1989','The Next Generation','Donald retired, and his sons Dave, Rich and Bob took over together as the \u201cOffice of the President,\u201d with Dave leading sales, Rich purchasing and Bob administration. New branches followed in Bloomington, Rockford, Cedar Rapids and Waterloo.'],
    ['Today','11 Locations, Still Family Owned','Mutual Wheel now runs 11 locations in Iowa and Illinois, carrying parts from a wide range of truck and trailer manufacturers and serving customers for more than 130 years.']];
  const HI='https://riverbendwebco.com/demo/img/';
  const hpics={'1893':{src:HI+'mw-1893-building.jpg',cap:'The Mutual Wheel Company building, 1893'},'1932':{src:HI+'mw-eh-engstrom.jpg',cap:'E.H. (Elmer) Engstrom'},'1950s':{src:HI+'mw-don-june.jpg',cap:'Don and June Engstrom'},'1989':{src:HI+'mw-engstrom-brothers.jpg',cap:'Bob, Dave and Rich Engstrom'}};
  const hpage=h('div',{class:'mw-hpage',role:'dialog','aria-modal':'true','aria-label':'Our History',hidden:true},
    h('div',{class:'mw-hp-bar'},h('div',{class:'mw-w mw-hp-bar-in'},h('button',{type:'button',class:'mw-hp-back',onclick:()=>history.back()},mwIco('arrow'),'Back to home'),h('span',null,name))),
    h('header',{class:'mw-hp-hero'},h('div',{class:'mw-w'},h('small',{class:'mw-kick'},'Our History'),h('h1',null,'Over 130 Years ',h('span',null,'on the Road')),
      h('p',null,'From wooden carriage wheels in 1893 to truck parts and service today, here is how Mutual Wheel got here.'))),
    h('div',{class:'mw-w mw-tl'},HIST.map(([y,t,d],i)=>h('article',{class:'mw-tl-i'},h('div',{class:'mw-tl-y'},y),h('div',{class:'mw-tl-c'},h('h3',null,t),h('p',null,d),
      hpics[y]?h('figure',null,h('img',{src:hpics[y].src,alt:hpics[y].cap,loading:'lazy'})):null)))),
    h('div',{class:'mw-w mw-hp-end'},h('a',{class:'mw-btn red',href:tel},mwIco('phone'),'Call '+phoneTxt),h('button',{type:'button',class:'mw-btn blue',onclick:()=>history.back()},'Back to home')));
  const showHist=()=>{ const on=location.hash==='#history'; hpage.hidden=!on; document.documentElement.classList.toggle('os-lock',on); if(on){ hpage.scrollTop=0; hpage.querySelector('.mw-hp-back').focus({preventScroll:true}); } };
  addEventListener('hashchange',showHist); setTimeout(showHist,0);
  const steps=[['phone','Call or Send a Request','Tell us the part or the problem.'],['search','We Check Stock','Our counter finds the right part.'],['truck','Pick Up or Drop Off','Grab your part or bring the truck in.'],['check','Back on the Road','Get rolling again fast.']];
  const how=h('section',{class:'mw-sec'},h('div',{class:'mw-w'},head('How It','Works'),h('div',{class:'mw-steps'},steps.map(([i,t,d],n)=>h('div',{class:'mw-step rv'},h('span',{class:'mw-step-i'},mwIco(i),h('em',null,String(n+1))),h('b',null,t),h('p',null,d))))));
  const DAYS3=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const visit=h('section',{class:'mw-visit',id:'mw-visit'},h('div',{class:'mw-w'},
    h('h3',{class:'mw-locs-h'},'All 11 Locations'),
    h('div',{class:'mw-locs'},D.locs.map(([c,a,p])=>h('div',{class:'mw-loc'+(c.startsWith('Dubuque')?' on':'')},h('b',null,c),a?h('span',null,a):null,p?h('a',{href:'tel:+1'+p.replace(/\D/g,'')},p):null))),
    h('div',{class:'mw-visit-in'},
      h('div',{class:'mw-store rv'},h('small',{class:'mw-kick'},'Your local store'),h('h2',null,'Mutual Wheel ',h('span',null,'Dubuque')),
        h('a',{class:'mw-li',href:maps,target:'_blank',rel:'noopener'},mwIco('pin'),addrTxt),h('a',{class:'mw-li',href:tel},mwIco('phone'),phoneTxt),
        h('div',{class:'mw-li'},mwIco('phone'),'Toll free '+D.tollfree),today?h('div',{class:'mw-li'},mwIco('clock'),'Open today '+today):null,
        h('div',{class:'mw-hrs'},DAYS3.map((d,i)=>h('div',{class:i===todayIx()?'on':null},h('span',null,d),h('span',null,hours[i]||'Closed')))),
        h('p',{class:'mw-mgr'},'Store Manager: '+D.manager)),
      h('div',{class:'mw-map rv'},h('iframe',{src:'https://www.google.com/maps?q='+encodeURIComponent(name+', '+addrTxt)+'&output=embed',title:'Map to '+name,loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'})))));
  const foot=h('footer',{class:'mw-foot'},h('div',{class:'mw-w mw-foot-in'},
    h('div',null,h('div',{class:'mw-brand on-dark'},logo?h('img',{src:logo,alt:name}):[mwIco('wheel'),h('span',{class:'mw-wm'},h('b',null,'Mutual Wheel'),h('small',null,'The Truck Experts'))]),h('p',null,'Truck parts, accessories and service since 1893.')),
    h('div',null,h('b',null,'Services'),svc.slice(0,6).map(s=>h('span',null,s.n))),
    h('div',null,h('b',null,'Dubuque Store'),h('span',null,addrTxt),h('a',{href:tel},phoneTxt),h('span',null,'Mon-Fri '+hours[0]),h('span',null,'Sat '+hours[5]))),
    h('div',{class:'mw-foot-bar'},h('div',{class:'mw-w'},'© '+new Date().getFullYear()+' '+name)));
  return h('div',{class:'mw'},nav,hero,services,whyS,req,hist,how,visit,foot,hpage);
}

/* ===================== MOUNTAINTOP (stone countertops: charcoal, stone and logo yellow) ===================== */
const MT_SITE='https://mountaintopstone.com/wp-content/uploads/2019/03/';
const MT={
  phone:'5635849499', addr:'400 Harrison St', city:'Dubuque, IA 52003',
  hours:['9am - 5pm','9am - 5pm','9am - 5pm','9am - 5pm','9am - 5pm','9am - 1pm','Closed'],
  social:{facebook:'https://www.facebook.com/mountaintopstoneworks/',instagram:'https://www.instagram.com/mountaintopstone/',youtube:'https://www.youtube.com/channel/UC5WbFxtX9yYdlWPbmOvzBqg'},
  projects:[['Saturnia-Kitchen-1.jpg','Beautiful Kitchen Counter'],['Kitchen1.jpg','Full Kitchen Project'],['Kitchen02.jpg','Multilevel Kitchen Counter'],['100_4264_14x11.jpg','Bathroom Sink, Marble Light'],['BathCopper.jpg','Bathroom Sink, Copper'],['Bath_02.jpg','Bathroom Unique Design']],
  surfaces:[
    ['Quartz','Engineered','Low maintenance and durable, with consistent color and texture. Can mimic softer stones or come in colors not found in nature.',['No sealing','Non-porous','Avoid high heat']],
    ['Granite','Natural','Very hard and durable, in a huge range of colors and patterns. Great for kitchens, baths, hearths and outdoor use.',['Very durable','Some types need sealing']],
    ['Marble','Natural','Prized for its veining. Softer than granite and stains more easily, so it needs a little more care. Beautiful anywhere in the home.',['Classic veining','Needs care']],
    ['Quartzite','Natural','Formed from sandstone. The look of marble with the durability of granite.',['Marble look','Granite strength','Needs sealing']],
    ['Sintered Stone','Fabricated','Made from natural minerals like clay and feldspar. Resists scratches, heat, UV and water, and is food safe.',['Heat & scratch resistant','50%+ recycled']],
    ['Soapstone','Natural','Durable with low absorbency, so stains soak in slowly. Darkens with age and can be refinished.',['Seal or oil','Can be refinished']],
    ['Travertine','Natural','Durable, with creamy beige and brown tones. Slabs and tiles for counters, floors and backsplashes.',['Slabs & tiles']],
    ['Limestone','Natural','A soft stone in beige and tan tones. Best in low-traffic areas.',['Needs sealing','Low traffic']],
    ['Onyx','Natural','Rare and translucent, with swirling pastel patterns. Stunning for accent walls and bars.',['Accent surface','Translucent']],
    ['Venetian Marble','Engineered','Recycled natural stone pressed and heated. A marble look at a lower cost, tougher than cultured marble.',['Marble look','Budget friendly']]],
  team:[
    ['Eric Christensen','Owner / CEO','https://mountaintopstone.com/wp-content/uploads/2019/04/ChristensenEric.png',['Eric has multiple roles. His knowledge of stone fabrication, stone equipment and installation techniques keeps him on the mechanical side of the business more often. But his knowledge of geology and stone applications allows him to help as an adviser in sales and design as well. Along with his business partner Bob, he helps run the day to day of Mountaintop Stoneworks, Inc.','Eric moved to Dubuque, Iowa from California in 1994, working in the tile and masonry industry. He started Mountaintop Stoneworks Inc. with Bob in 1998. He is the father of three daughters, and enjoys the outdoors and playing music with his band.']],
    ['Robert Breitbach','Owner / CFO','',['Bob says his role is "all of the above," but he mainly handles the administration side: payroll, accounts payable and receivable, vendors, insurance and everything else it takes to keep the business running.','Bob and his wife Cathy have been self-employed for more than forty years, starting in flooring, then adding decorating and later stone fabrication. They have six children and twelve grandchildren.']],
    ['Rick Carner II','Production Manager','https://mountaintopstone.com/wp-content/uploads/2019/04/CarnerRick.png',['Rick brings art to the saw. He is amazing at the layout process and will be happy to get you involved in choosing the best sections of the material you choose. Rick has a good eye for grain and flow in stone and makes sure each piece runs together smoothly. When seams are involved, he is a good person to have on your team.','Rick grew up locally. He enjoys working on his home and spending time with his girlfriend Jessica.']],
    ['Randy Barton','Project Manager','https://riverbendwebco.com/demo/img/mt-randy.jpg',[]],
    ['Andrew Kartman','CNC Programmer / Operator','https://mountaintopstone.com/wp-content/uploads/2019/04/KartmanAndrew.png',['Andrew programs and runs the CNC equipment that cuts your stone with precision. He first joined Mountaintop through a college internship and is continuing his studies in manufacturing process management.','Andrew grew up in Dubuque, Iowa. Outside of work he enjoys working on cars and spending time with his family and his girlfriend Skyler.']],
    ['Wally Dirks','Installer / Fabrication Specialist','https://riverbendwebco.com/demo/img/mt-wally.jpg',['Wally has been installing for some time now and is familiar with most situations that can come up. He is also very proficient in the shop as a fabricator, which makes him well rounded.','Wally grew up locally. He has three children and two grandchildren. When he isn\'t fabricating and installing, he enjoys precious time with his family.']]],
  reviews:[['Thank you all for providing such a wonderful experience from beginning to end!','Ginny and Guy'],['Everyone was timely, considerate, and knowledgeable.','Cal and Jennifer'],['The flushing of the granite with the sink was perfect!','Tony and Pat'],['Will definitely refer business your way.','Bill and Julie'],['Not one single problem at all.','Mountaintop customer'],['I have found them very easy to work with, they answer all my questions.','Mountaintop customer'],['Good representatives for your company.','Mountaintop customer'],['It is beautiful!!','Mountaintop customer']]
};
const MT_PH={Granite:'granite',Marble:'marble',Quartzite:'quartzite',Soapstone:'soapstone',Travertine:'travertine',Limestone:'limestone',Onyx:'onyx'};
const MT_I={
  phone:'<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
  pin:'<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>',
  gem:'<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l3 18M15 3l-3 18"/>', hand:'<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4.5a1.5 1.5 0 0 1 3 0V11M14 10.5V6a1.5 1.5 0 0 1 3 0v8a7 7 0 0 1-7 7h-.5A6.5 6.5 0 0 1 4 15.2V12a1.5 1.5 0 0 1 3 0v1"/>',
  heart:'<path d="M12 20s-8-4.6-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.4-8 11-8 11z"/>', pencil:'<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
  cpu:'<rect x="6" y="6" width="12" height="12" rx="1"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>', users:'<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3 3 0 0 1 0 6M18 14c2 .7 3 2.8 3 6"/>',
  boxes:'<path d="M3 10h8v10H3zM13 10h8v10h-8zM8 3h8v7H8z"/>', store:'<path d="M3 21h18M4 21V9h16v12M4 9l2-5h12l2 5"/><path d="M10 21v-6h4v6"/>', check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  ruler:'<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>', star:'<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.2L12 17.4 6.5 20.3l1-6.2L3 9.7l6.2-.9z"/>',
  fb:'<path d="M14 8h3V4h-3c-2.8 0-4 1.8-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8.5c0-.3.2-.5.5-.5z"/>', ig:'<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/>', yt:'<rect x="2.5" y="5.5" width="19" height="13" rx="3.5"/><path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor"/>'
};
function mtI(k,cls){ const s=h('span',{class:'mt-i'+(cls?' '+cls:''),'aria-hidden':'true'}); s.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(MT_I[k]||'')+'</svg>'; return s; }
function mountaintop(C){
  const name=C.name||'Mountaintop Stoneworks', x=C.x||{};
  const digits=(C.phone||MT.phone).replace(/\D/g,'').slice(-10), tel='tel:+1'+digits, phoneTxt=digits.slice(0,3)+'-'+digits.slice(3,6)+'-'+digits.slice(6);
  const addr=C.addr||MT.addr, city=/52003/.test(C.city||'')?C.city:MT.city, full=addr+', '+city;
  const hours=C.hasHours?C.hours:MT.hours, today=hours[todayIx()]||'Closed';
  const maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name+', '+full);
  const logo='https://riverbendwebco.com/demo/img/mountaintop-logo.png';
  const P=i=>MT_SITE+MT.projects[i][0];
  const go=id=>e=>{ e.preventDefault(); scrollTo(id); };
  const A=(id,t)=>h('a',{href:'#'+id,onclick:go(id)},t);
  const links=()=>[A('mt-surfaces','Surfaces'),A('mt-projects','Projects'),A('mt-process','Process'),A('mt-reviews','Reviews'),A('mt-team','Team'),A('mt-visit','Visit')];
  const nav=h('header',{class:'mt-nav'},h('div',{class:'mt-w mt-nav-in'},
    h('a',{class:'mt-logo',href:'#',onclick:e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});}},h('img',{src:logo,alt:name})),
    h('nav',{class:'mt-links'},links()),
    h('a',{class:'mt-btn y sm',href:tel},mtI('phone'),h('span',{class:'mt-btn-t'},phoneTxt),h('span',{class:'mt-btn-m'},'Call'))),
    h('nav',{class:'mt-mlinks'},links()));
  /* hero */
  const slides=[0,1,2].map(i=>h('div',{class:'mt-slide'+(i===0?' on':''),style:'background-image:url("'+P(i)+'")'}));
  const hero=h('section',{class:'mt-hero'},h('div',{class:'mt-slides','aria-hidden':'true'},slides),
    h('div',{class:'mt-w mt-hero-in'},
      h('span',{class:'mt-kick'},'Welcome to Mountaintop · Dubuque, Iowa'),
      h('h1',null,'Bring the outdoors ',h('em',null,'in.')),
      h('p',{class:'mt-lead'},'Where beautiful surfaces are crafted from nature. Granite, quartz, marble and more, designed, fabricated and installed by our own local craftsmen.'),
      h('div',{class:'mt-cta'},h('a',{class:'mt-btn y',href:maps,target:'_blank',rel:'noopener'},'Come in today',mtI('arrow')),h('a',{class:'mt-btn ghost',href:'#mt-process',onclick:go('mt-process')},'Get started'))),
    h('div',{class:'mt-w mt-strip'},[['store','Local showroom',addr],['clock','Open today',today],['gem','10 surface types','Natural & engineered'],['boxes','Large local inventory','Slabs in stock']].map(([i,a,b])=>h('div',null,mtI(i),h('span',null,h('b',null,a),h('small',null,b))))));
  let si=0; const st=setInterval(()=>{ if(!hero.isConnected){clearInterval(st);return;} slides[si].classList.remove('on'); si=(si+1)%slides.length; slides[si].classList.add('on'); },6000);
  /* values */
  const head=(k,t,p)=>h('div',{class:'mt-head rv'},h('span',{class:'mt-kick'},k),h('h2',null,t),p?h('p',null,p):null);
  const values=h('section',{class:'mt-sec mt-values'},h('div',{class:'mt-w'},
    head('The Mountaintop difference',h('span',null,'Quality. Craftsmanship. ',h('em',null,'Passion.')),'Three principles behind every project, carried out through a proven process that treats each one as your own unique vision.'),
    h('div',{class:'mt-vgrid'},[
      ['gem','Quality','Our reputation is built on doing it right, and it defines how we treat every customer project.','“Quality means doing it right when no one is looking.” — Henry Ford'],
      ['hand','Craftsmanship','A craftsman loves detail, and detail is how a project’s success is measured. Our team of craftsmen creates your vision.',''],
      ['heart','Passion','We want to make your dream a reality, and nothing beats seeing your joy when your vision comes to life.','']].map(([i,t,d,q])=>h('div',{class:'mt-v rv'},mtI(i,'big'),h('h3',null,t),h('p',null,d),q?h('blockquote',null,q):null)))));
  /* surfaces with filter */
  const sgrid=h('div',{class:'mt-sgrid'});
  const drawS=f=>{ sgrid.replaceChildren(...MT.surfaces.filter(s=>f==='All'||s[1]===f).map(([n,t,d,tags],i)=>h('article',{class:'mt-s rv rv-on'},
    h('div',{class:'mt-s-sw sw'+(MT.surfaces.findIndex(z=>z[0]===n)%10),'aria-hidden':'true',style:MT_PH[n]?'background:url("https://riverbendwebco.com/demo/img/mt-'+MT_PH[n]+'.jpg") '+(n==='Granite'?'center 18%':'center')+'/cover':null}),h('div',{class:'mt-s-b'},h('div',{class:'mt-s-top'},h('h3',null,n),h('span',{class:'mt-tag '+t.toLowerCase()},t)),h('p',null,d),h('div',{class:'mt-chips'},tags.map(c=>h('span',null,c))))))); };
  const ftabs=h('div',{class:'mt-ftabs',role:'tablist'},['All','Natural','Engineered','Fabricated'].map((f,i)=>{ const b=h('button',{type:'button',role:'tab',class:i?'':'on','aria-selected':i?'false':'true'},f); b.onclick=()=>{ ftabs.querySelectorAll('button').forEach(z=>{z.classList.toggle('on',z===b);z.setAttribute('aria-selected',z===b?'true':'false');}); drawS(f); }; return b; }));
  drawS('All');
  const surfaces=h('section',{class:'mt-sec mt-dark',id:'mt-surfaces'},h('div',{class:'mt-w'},
    head('Surface types',h('span',null,'Find your ',h('em',null,'perfect'),' surface'),'From timeless granite to low-maintenance quartz, see and touch every option in our showroom.'),
    ftabs,sgrid,h('p',{class:'mt-brands'},'Quartz brands we carry: ',h('b',null,'Technistone'),' and ',h('b',null,'Caesarstone'),'.')));
  /* why */
  const why=h('section',{class:'mt-sec'},h('div',{class:'mt-w mt-why'},
    h('div',{class:'mt-why-ph rv',style:'background-image:url("'+P(1)+'")'}),
    h('div',{class:'rv'},h('span',{class:'mt-kick'},'Why Mountaintop'),h('h2',null,'Our passion is bringing the beauty of natural surfaces into your space.'),
      h('ul',{class:'mt-why-l'},[['pencil','Expert design'],['cpu','Advanced state-of-the-art technology'],['users','Experienced, highly trained staff'],['boxes','Large local inventory'],['store','Convenient local showroom'],['ruler','Professional project process']].map(([i,t])=>h('li',null,mtI(i),t))))));
  /* projects + lightbox */
  const lb=h('div',{class:'mt-lb',hidden:true,role:'dialog','aria-modal':'true','aria-label':'Project photo'});
  const openLb=i=>{ const [f,c]=MT.projects[i]; lb.replaceChildren(h('button',{type:'button',class:'mt-lb-x','aria-label':'Close',onclick:()=>{lb.hidden=true;}},mtI('x')),h('figure',null,h('img',{src:MT_SITE+f,alt:c}),h('figcaption',null,c))); lb.hidden=false; };
  lb.addEventListener('click',e=>{ if(e.target===lb) lb.hidden=true; }); addEventListener('keydown',e=>{ if(e.key==='Escape') lb.hidden=true; });
  const projects=h('section',{class:'mt-sec mt-dark',id:'mt-projects'},h('div',{class:'mt-w'},head('Our projects',h('span',null,'See our ',h('em',null,'work')),'Kitchens, baths and one-of-a-kind designs from right here in the Dubuque area.'),
    h('div',{class:'mt-pgrid'},MT.projects.map(([f,c],i)=>h('button',{type:'button',class:'mt-p rv p'+i,onclick:()=>openLb(i)},h('img',{src:MT_SITE+f,alt:c,loading:'lazy'}),h('span',null,c))))));
  /* process */
  const steps=[['store','Visit the showroom','See slabs and samples in person and pick the surface that fits your space and budget.'],['ruler','Measure & template','We measure your space precisely so every edge and seam fits just right.'],['cpu','Precision fabrication','Your stone is cut on our state-of-the-art CNC equipment by experienced craftsmen.'],['check','Professional install','Our installers set your surfaces with care and leave you a space you will love.']];
  const process=h('section',{class:'mt-sec',id:'mt-process'},h('div',{class:'mt-w'},head('The Mountaintop process',h('span',null,'Create your ',h('em',null,'stunning'),' space'),'A proven process that treats every project as your unique vision.'),
    h('ol',{class:'mt-steps'},steps.map(([i,t,d],n)=>h('li',{class:'rv'},h('span',{class:'mt-step-n'},String(n+1).padStart(2,'0')),mtI(i,'big'),h('h3',null,t),h('p',null,d)))),
    h('div',{class:'mt-center'},h('a',{class:'mt-btn y',href:tel},mtI('phone'),'Get started: '+phoneTxt))));
  /* reviews marquee */
  const rv=MT.reviews.map(([q,n])=>h('figure',{class:'mt-r'},h('div',{class:'mt-stars','aria-label':'5 stars'},[0,1,2,3,4].map(()=>mtI('star'))),h('blockquote',null,q),h('figcaption',null,n)));
  const rtrack=h('div',{class:'mt-rtrack'},rv,rv.map(n=>{ const c=n.cloneNode(true); c.setAttribute('aria-hidden','true'); return c; }));
  const reviews=h('section',{class:'mt-sec mt-dark mt-revs',id:'mt-reviews'},h('div',{class:'mt-w'},head('Testimonials',h('span',null,'What our clients are ',h('em',null,'saying')))),h('div',{class:'mt-rrow'},rtrack));
  /* team */
  const team=h('section',{class:'mt-sec',id:'mt-team'},h('div',{class:'mt-w'},head('Our team',h('span',null,'Meet the ',h('em',null,'craftsmen'))),
    h('div',{class:'mt-team'},MT.team.map(([n,r])=>h('div',{class:'mt-tm rv'},h('span',{class:'mt-av'},n.split(' ').map(w=>w[0]).slice(0,2).join('')),h('b',null,n),h('small',null,r))))));
  /* visit */
  const D3=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const visit=h('section',{class:'mt-sec mt-dark',id:'mt-visit'},h('div',{class:'mt-w mt-visit'},
    h('div',{class:'rv'},h('span',{class:'mt-kick'},'Ready to get started?'),h('h2',null,'Come see the stone ',h('em',null,'in person.')),
      h('a',{class:'mt-li',href:maps,target:'_blank',rel:'noopener'},mtI('pin'),full),h('a',{class:'mt-li',href:tel},mtI('phone'),phoneTxt),
      h('div',{class:'mt-hrs'},D3.map((d,i)=>h('div',{class:i===todayIx()?'on':null},h('span',null,d),h('b',null,hours[i]||'Closed')))),
      h('div',{class:'mt-cta'},h('a',{class:'mt-btn y',href:maps,target:'_blank',rel:'noopener'},mtI('pin'),'Get directions'),h('a',{class:'mt-btn ghost',href:tel},mtI('phone'),'Call us')),
      h('div',{class:'mt-soc'},h('a',{href:MT.social.facebook,target:'_blank',rel:'noopener','aria-label':'Facebook'},mtI('fb')),h('a',{href:MT.social.instagram,target:'_blank',rel:'noopener','aria-label':'Instagram'},mtI('ig')),h('a',{href:MT.social.youtube,target:'_blank',rel:'noopener','aria-label':'YouTube'},mtI('yt')))),
    h('div',{class:'mt-map rv'},h('iframe',{src:'https://www.google.com/maps?q='+encodeURIComponent(name+', '+full)+'&output=embed',title:'Map to '+name,loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'}))));
  const foot=h('footer',{class:'mt-foot'},h('div',{class:'mt-w mt-foot-in'},h('img',{src:logo,alt:name}),h('p',null,'Bring the outdoors IN. Countertops and stone surfaces at '+full+'.'),h('small',null,'© '+new Date().getFullYear()+' Mountaintop Stoneworks, Inc.')));
  return h('div',{class:'mt'},nav,h('div',{class:'mt-welcome'},'Stop by our Dubuque showroom and see every slab in person. ',h('a',{href:tel},'Call '+phoneTxt)),hero,values,surfaces,why,projects,process,reviews,team,visit,foot,lb);
}

function mountaintop2(C){
  const name=C.name||'Mountaintop Stoneworks';
  const digits=(C.phone||MT.phone).replace(/\D/g,'').slice(-10), tel='tel:+1'+digits, phoneTxt=digits.slice(0,3)+'-'+digits.slice(3,6)+'-'+digits.slice(6);
  const addr=C.addr||MT.addr, city=/52003/.test(C.city||'')?C.city:MT.city, full=addr+', '+city;
  const hours=C.hasHours?C.hours:MT.hours, today=hours[todayIx()]||'Closed';
  const maps='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(name+', '+full);
  const logo='https://riverbendwebco.com/demo/img/mountaintop-logo.png';
  const P=i=>MT_SITE+MT.projects[i][0];
  const SP=n=>MT_PH[n]?'https://riverbendwebco.com/demo/img/mt-'+MT_PH[n]+'.jpg':'';
  const go=id=>e=>{ e.preventDefault(); scrollTo(id); };
  const A=(id,t)=>h('a',{href:'#'+id,onclick:go(id)},t);
  const links=()=>[A('m2-surfaces','Surfaces'),A('m2-work','Our Work'),A('m2-process','Process'),A('m2-team','Our Team'),A('m2-about','About'),A('m2-visit','Contact')];
  const arrow=()=>mtI('arrow');
  /* nav */
  const nav=h('header',{class:'m2-nav'},h('div',{class:'m2-w m2-nav-in'},
    h('a',{class:'m2-logo',href:'#',onclick:e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});}},h('img',{src:logo,alt:name})),
    h('nav',{class:'m2-links'},links()),
    h('a',{class:'m2-btn dark sm',href:tel},mtI('phone'),h('span',{class:'m2-hide-s'},phoneTxt),h('span',{class:'m2-show-s'},'Call'))),
    h('nav',{class:'m2-mlinks'},links()));
  /* hero */
  const slides=[h('div',{class:'m2-slide on',style:'background-image:url("https://riverbendwebco.com/demo/img/mt-hero.jpg")'})];
  const HR=MT.reviews; let hi=0;
  const hq=h('blockquote',{class:'in'},HR[0][0]), hn=h('cite',null,HR[0][1]);
  const hdots=HR.map((_,i)=>h('i',{class:i?null:'on'}));
  const showHq=i=>{ hdots[hi].classList.remove('on'); hi=(i+HR.length)%HR.length; hdots[hi].classList.add('on'); hq.classList.remove('in'); hn.classList.remove('in'); void hq.offsetWidth; hq.textContent=HR[hi][0]; hn.textContent=HR[hi][1]; hq.classList.add('in'); hn.classList.add('in'); };
  const ht=setInterval(()=>{ if(!hq.isConnected){clearInterval(ht);return;} showHq(hi+1); },5000);
  const hrev=h('div',{class:'m2-hrev-wrap'},h('div',{class:'m2-w'},h('figure',{class:'m2-hrev','aria-live':'polite'},
    h('p',{class:'m2-hrev-k'},h('span',{class:'m2-hrev-q'},'\u201C'),'What our clients say'),hq,hn,h('div',{class:'m2-hrev-dots'},hdots))));
  const hero=h('section',{class:'m2-hero'},h('div',{class:'m2-hero-media'},slides),hrev,
    h('div',{class:'m2-w m2-hero-in'},
      h('p',{class:'m2-eyebrow light'},'Countertops & stone surfaces · Dubuque, Iowa'),
      h('h1',null,'Bring the',h('br'),'outdoors in.'),
      h('div',{class:'m2-hero-row'},
        h('p',null,'Where beautiful surfaces are crafted from nature. Designed, fabricated and installed by our own local craftsmen.'),
        h('div',{class:'m2-cta'},h('a',{class:'m2-btn light',href:'#m2-surfaces',onclick:go('m2-surfaces')},'Explore surfaces',arrow()),h('a',{class:'m2-btn ghost',href:maps,target:'_blank',rel:'noopener'},'Visit the showroom')))));
  const stats=h('section',{class:'m2-stats'},h('div',{class:'m2-w m2-stats-in'},[['10','Surface types'],['6','Craftsmen on our team'],['CNC','Precision fabrication'],['1','Local showroom to see it all']].map(([a,b])=>h('div',null,h('b',null,a),h('span',null,b)))));
  /* intro statement */
  const intro=h('section',{class:'m2-sec'},h('div',{class:'m2-w m2-intro rv'},
    h('p',{class:'m2-eyebrow'},'The Mountaintop difference'),
    h('h2',{class:'m2-statement'},'Quality, craftsmanship and passion, carried out through a proven process that treats every project as ',h('span',null,'your unique vision.')),
    h('div',{class:'m2-vals'},[['Quality','“Quality means doing it right when no one is looking.” Henry Ford'],['Craftsmanship','A craftsman loves detail, and detail is how a project’s success is measured.'],['Passion','We want to make your dream a reality, and love seeing your joy when it comes to life.']].map(([t,d],i)=>h('div',{class:'m2-val'},h('small',null,'0'+(i+1)),h('h3',null,t),h('p',null,d))))));
  /* surfaces: big photo tiles + detail sheet */
  const sheet=h('div',{class:'m2-sheet',hidden:true,role:'dialog','aria-modal':'true'});
  const openS=sv=>{ const [n,t,d,tags]=sv; const ph=SP(n); const i=MT.surfaces.indexOf(sv);
    sheet.replaceChildren(h('div',{class:'m2-sheet-card'},
      h('div',{class:'m2-sheet-ph sw'+i,style:ph?'background:url("'+ph+'") center/cover':null}),
      h('div',{class:'m2-sheet-b'},h('button',{type:'button',class:'m2-x','aria-label':'Close',onclick:()=>{sheet.hidden=true;}},mtI('x')),
        h('p',{class:'m2-eyebrow'},t),h('h3',null,n),h('p',null,d),h('div',{class:'m2-tags'},tags.map(x=>h('span',null,x))),
        h('a',{class:'m2-btn dark',href:tel},mtI('phone'),'Ask about '+n)))); sheet.hidden=false; };
  sheet.addEventListener('click',e=>{ if(e.target===sheet) sheet.hidden=true; }); addEventListener('keydown',e=>{ if(e.key==='Escape') sheet.hidden=true; });
  const rail=h('div',{class:'m2-rail roll'}), track=h('div',{class:'m2-track'}); rail.append(track);
  const mkTiles=f=>MT.surfaces.filter(s=>f==='All'||s[1]===f).map(sv=>{ const [n,t]=sv; const ph=SP(n); const i=MT.surfaces.indexOf(sv);
    return h('button',{type:'button',class:'m2-tile',onclick:()=>openS(sv)},h('span',{class:'m2-tile-ph sw'+i,style:ph?'background-image:url("'+ph+'")':null}),h('span',{class:'m2-tile-c'},h('small',null,t),h('b',null,n),h('em',null,'View details',arrow()))); });
  const drawS=f=>{ const a=mkTiles(f), b=mkTiles(f); b.forEach(t=>{ t.setAttribute('aria-hidden','true'); t.tabIndex=-1; }); track.replaceChildren(...a,...b); track.style.animationDuration=(a.length*2.6)+'s'; };
  const chips=h('div',{class:'m2-chips',role:'tablist'},['All','Natural','Engineered','Fabricated'].map((f,i)=>{ const b=h('button',{type:'button',class:i?'':'on'},f); b.onclick=()=>{ chips.querySelectorAll('button').forEach(z=>z.classList.toggle('on',z===b)); drawS(f); }; return b; }));
  drawS('All');
  const railNav=d=>()=>rail.scrollBy({left:d*rail.clientWidth*.8,behavior:'smooth'});
  const surfaces=h('section',{class:'m2-sec m2-gray',id:'m2-surfaces'},h('div',{class:'m2-w'},
    h('div',{class:'m2-head'},h('div',null,h('p',{class:'m2-eyebrow'},'Surface types'),h('h2',null,'Find your surface.')),
      h('div',{class:'m2-head-r'},chips))),
    rail,h('div',{class:'m2-w'},h('p',{class:'m2-note'},'Quartz brands we carry: Technistone and Caesarstone. Tap any surface to learn more.')));
  /* why bento */
  const why=h('section',{class:'m2-sec',id:'m2-about'},h('div',{class:'m2-w'},
    h('div',{class:'m2-head'},h('div',null,h('p',{class:'m2-eyebrow'},'Why Mountaintop'),h('h2',null,'Our passion is bringing natural surfaces into your space.'))),
    h('div',{class:'m2-bento'},
      h('div',{class:'m2-b big',style:'background-image:url("'+P(1)+'")'},h('span',null,'Full kitchen project')),
      [['pencil','Expert design'],['cpu','Advanced state-of-the-art technology'],['users','Experienced, highly trained staff'],['boxes','Large local inventory'],['store','Convenient local showroom'],['ruler','Professional project process']].map(([i,t])=>h('div',{class:'m2-b rv'},mtI(i),h('b',null,t))))));
  /* work */
  const lb=h('div',{class:'m2-lb',hidden:true,role:'dialog','aria-modal':'true'});
  const openLb=i=>{ lb.replaceChildren(h('button',{type:'button',class:'m2-x',onclick:()=>{lb.hidden=true;},'aria-label':'Close'},mtI('x')),h('figure',null,h('img',{src:P(i),alt:MT.projects[i][1]}),h('figcaption',null,MT.projects[i][1]))); lb.hidden=false; };
  lb.addEventListener('click',e=>{ if(e.target===lb) lb.hidden=true; });
  const N=MT.projects.length; let wi=0, wt=0;
  const wSlides=MT.projects.map(([f,c],i)=>h('div',{class:'m2-ws'+(i?'':' on'),style:'background-image:url("'+MT_SITE+f+'")'}));
  const wCap=h('b',null,MT.projects[0][1]), wNum=h('span',{class:'m2-wnum'},'01'), wBar=h('i',{class:'m2-wbar'});
  const thumbs=MT.projects.map(([f,c],i)=>h('button',{type:'button',class:'m2-wt'+(i?'':' on'),'aria-label':'Show '+c,onclick:()=>showW(i,true)},h('img',{src:MT_SITE+f,alt:'',loading:'lazy'})));
  const showW=(i,user)=>{ wSlides[wi].classList.remove('on'); thumbs[wi].classList.remove('on'); wi=(i+N)%N; wSlides[wi].classList.add('on'); thumbs[wi].classList.add('on');
    wCap.textContent=MT.projects[wi][1]; wNum.textContent=String(wi+1).padStart(2,'0'); wBar.classList.remove('run'); void wBar.offsetWidth; wBar.classList.add('run');
    if(user){ clearInterval(wt); wt=setInterval(tickW,5000); } };
  const tickW=()=>{ if(!wCap.isConnected){ clearInterval(wt); return; } showW(wi+1); };
  wt=setInterval(tickW,5000); requestAnimationFrame(()=>wBar.classList.add('run'));
  const work=h('section',{class:'m2-sec m2-dark',id:'m2-work'},h('div',{class:'m2-w'},
    h('div',{class:'m2-head'},h('div',null,h('p',{class:'m2-eyebrow light'},'Our work'),h('h2',null,'Kitchens and baths across the Dubuque area.')),
      h('div',{class:'m2-wctl'},h('button',{type:'button','aria-label':'Previous project',onclick:()=>showW(wi-1,true)},mtI('arrow')),h('button',{type:'button','aria-label':'Next project',onclick:()=>showW(wi+1,true)},mtI('arrow')))),
    h('div',{class:'m2-wstage'},h('button',{type:'button',class:'m2-wmain','aria-label':'Open photo',onclick:()=>openLb(wi)},wSlides),
      h('div',{class:'m2-wcap'},wNum,h('div',null,h('small',null,'Project '+'\u00b7 Mountaintop Stoneworks'),wCap),h('span',{class:'m2-wtot'},'/ '+String(N).padStart(2,'0')),wBar)),
    h('div',{class:'m2-wthumbs'},thumbs)));
  /* process */
  const steps=[['Visit the showroom','See slabs and samples in person and choose the surface that fits your space and budget.'],['Measure & template','We measure your space precisely so every edge and seam fits.'],['Precision fabrication','Your stone is cut on our CNC equipment by experienced craftsmen.'],['Professional install','Our installers set your surfaces with care and clean up after.']];
  const process=h('section',{class:'m2-sec',id:'m2-process'},h('div',{class:'m2-w'},
    h('div',{class:'m2-head'},h('div',null,h('p',{class:'m2-eyebrow'},'The Mountaintop process'),h('h2',null,'From slab to stunning in four steps.'))),
    h('ol',{class:'m2-steps'},steps.map(([t,d],i)=>h('li',{class:'rv'},h('span',null,'0'+(i+1)),h('h3',null,t),h('p',null,d))))));
  /* reviews slider */
  const R=MT.reviews; let ri=0;
  const rq=h('blockquote',null,R[0][0]), rn=h('cite',null,R[0][1]), rc=h('span',{class:'m2-rc'},'01 / '+String(R.length).padStart(2,'0'));
  const showR=d=>{ ri=(ri+d+R.length)%R.length; rq.classList.remove('in'); void rq.offsetWidth; rq.textContent=R[ri][0]; rn.textContent=R[ri][1]; rc.textContent=String(ri+1).padStart(2,'0')+' / '+String(R.length).padStart(2,'0'); rq.classList.add('in'); };
  const rt=setInterval(()=>{ if(!rq.isConnected){clearInterval(rt);return;} showR(1); },6000);
  const reviews=h('section',{class:'m2-sec m2-gray'},h('div',{class:'m2-w m2-rev'},
    h('p',{class:'m2-eyebrow'},'What our clients say'),h('div',{class:'m2-stars'},[0,1,2,3,4].map(()=>mtI('star'))),rq,rn,
    h('div',{class:'m2-rnav'},h('button',{type:'button','aria-label':'Previous review',onclick:()=>showR(-1)},mtI('arrow')),rc,h('button',{type:'button','aria-label':'Next review',onclick:()=>showR(1)},mtI('arrow')))));
  /* team */
  const bio=h('div',{class:'m2-bio',hidden:true,role:'dialog','aria-modal':'true'});
  const ini=n=>n.split(' ').map(w=>w[0]).slice(0,2).join('');
  const face=(m,cls)=>m[2]?h('div',{class:cls},h('img',{src:m[2],alt:m[0],loading:'lazy',onerror:function(){this.replaceWith(h('span',{class:'m2-ini'},ini(m[0])));}})):h('div',{class:cls},h('span',{class:'m2-ini'},ini(m[0])));
  const openBio=m=>{ bio.replaceChildren(h('div',{class:'m2-bio-card'},
      h('button',{type:'button',class:'m2-x',onclick:()=>{bio.hidden=true;},'aria-label':'Close'},mtI('x')),
      face(m,'m2-bio-ph'),
      h('div',{class:'m2-bio-b'},h('p',{class:'m2-eyebrow'},m[1]),h('h3',null,m[0]),
        ...(m[3].length?m[3].map(t=>h('p',null,t)):[h('p',null,'Full bio coming soon.')]),
        h('a',{class:'m2-btn dark',href:tel},'Call the shop',arrow())))); bio.hidden=false; };
  bio.addEventListener('click',e=>{ if(e.target===bio) bio.hidden=true; });
  const team=h('section',{class:'m2-sec',id:'m2-team'},h('div',{class:'m2-w'},
    h('div',{class:'m2-head'},h('div',null,h('p',{class:'m2-eyebrow'},'Our team'),h('h2',null,'The craftsmen behind your counters.'))),
    h('div',{class:'m2-crew'},MT.team.map(m=>h('button',{type:'button',class:'m2-mem rv',onclick:()=>openBio(m)},
      face(m,'m2-mem-ph'),
      h('div',{class:'m2-mem-t'},h('b',null,m[0]),h('span',null,m[1])),
      h('span',{class:'m2-mem-more'},m[3].length?'Read full bio':'View profile',arrow()))))));
  /* visit */
  const D3=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const visit=h('section',{class:'m2-visit',id:'m2-visit'},
    h('div',{class:'m2-visit-t'},h('p',{class:'m2-eyebrow light'},'Ready to get started?'),h('h2',null,'Come see the stone in person.'),
      h('a',{class:'m2-li',href:maps,target:'_blank',rel:'noopener'},mtI('pin'),full),h('a',{class:'m2-li',href:tel},mtI('phone'),phoneTxt),
      h('ul',{class:'m2-hrs'},D3.map((d,i)=>h('li',{class:i===todayIx()?'on':null},h('span',null,d),h('span',null,hours[i]||'Closed')))),
      h('div',{class:'m2-cta'},h('a',{class:'m2-btn light',href:maps,target:'_blank',rel:'noopener'},'Get directions',arrow()),h('a',{class:'m2-btn ghost',href:tel},'Call us')),
      h('div',{class:'m2-soc'},h('a',{href:MT.social.facebook,target:'_blank',rel:'noopener','aria-label':'Facebook'},mtI('fb')),h('a',{href:MT.social.instagram,target:'_blank',rel:'noopener','aria-label':'Instagram'},mtI('ig')),h('a',{href:MT.social.youtube,target:'_blank',rel:'noopener','aria-label':'YouTube'},mtI('yt')))),
    h('div',{class:'m2-map'},h('iframe',{src:'https://www.google.com/maps?q='+encodeURIComponent(name+', '+full)+'&output=embed',title:'Map to '+name,loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'})));
  const foot=h('footer',{class:'m2-foot'},h('div',{class:'m2-w m2-foot-in'},h('img',{src:logo,alt:name}),h('nav',null,links()),h('small',null,'© '+new Date().getFullYear()+' Mountaintop Stoneworks, Inc. · '+full)));
  return h('div',{class:'m2'},nav,hero,stats,intro,surfaces,why,work,process,team,visit,foot,sheet,lb,bio);
}

const CL_ICO={
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  phone:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h3l1.5 4.5-2 1.2a11 11 0 0 0 6.8 6.8l1.2-2L20 16v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
  pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  bag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  id:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10h4M14 14h4"/></svg>',
  arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>'
};
const CL_CAT={
  vape:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="14" width="16" height="30" rx="5"/><path d="M20 14V8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/><path d="M22 6V3h4v3"/><circle cx="24" cy="34" r="2.5"/><path d="M20 22h8"/></svg>',
  cigar:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 30l28-12a5 5 0 0 1 4 9.2L10 39"/><path d="M6 30a5 5 0 0 0 4 9"/><path d="M26 21.5l3 7"/><path d="M30 19.8l3 7"/><path d="M39 14c0-3 3-3 3-6M43 17c0-2 2-2 2-4"/></svg>',
  cigarette:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="27" width="36" height="7" rx="1.5"/><path d="M30 27v7"/><path d="M40 27h4v7h-4"/><path d="M36 21c0-3 3-3 3-6s-3-3-3-6M42 22c0-2 2-2 2-4"/></svg>',
  beverage:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 9h18l-1 3H16z"/><path d="M16 12c-1 2-2 4-2 7v20a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4V19c0-3-1-5-2-7"/><path d="M14 22h20M14 34h20"/><path d="M22 6h4"/></svg>',
  other:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 16h28l-2 26H12z"/><path d="M18 16v-3a6 6 0 0 1 12 0v3"/></svg>'
};
function clCatIco(k){ const t=String(k).toLowerCase(); const key=/vape|disposable|pod|device|e-?liquid|juice|mod/.test(t)?'vape':/cigar(?!ette)/.test(t)?'cigar':/cigarette|tobacco|smoke/.test(t)?'cigarette':/beverage|drink|soda|energy|water/.test(t)?'beverage':'other'; const d=h('span',{class:'cl-carry-ico','aria-hidden':'true'}); d.innerHTML=CL_CAT[key]; return d; }
function clIco(k){ const d=h('span',{class:'cl-ico','aria-hidden':'true'}); d.innerHTML=CL_ICO[k]; return d; }
let clAgeOk=false;
function clAge(C){
  if(clAgeOk) return;
  const ex=document.querySelector('.cl-age'); if(ex){ const n=ex.querySelector('.cl-age-name'); if(n&&C.name) n.textContent=C.name; return; }
  const box=h('div',{class:'cl-age',role:'dialog','aria-modal':'true','aria-label':'Age verification'});
  const yes=h('button',{type:'button',class:'cl-btn red'},'Yes, I am 21 or older');
  const no=h('button',{type:'button',class:'cl-btn line'},'No');
  const msg=h('p',{class:'cl-age-no'});
  box.append(h('div',{class:'cl-age-card'},h('div',{class:'cl-age-top'},'Age Verification'),h('div',{class:'cl-age-b'},
    h('b',{class:'cl-age-name'},C.name),h('p',null,'Products sold at '+C.name+' are age-restricted and intended for adults of legal smoking age only.'),
    h('p',null,'By entering, you confirm you are 21 years of age or older.'),h('div',{class:'cl-age-btns'},yes,no),msg)));
  yes.addEventListener('click',()=>{ clAgeOk=true; box.remove(); document.documentElement.classList.remove('os-lock'); });
  no.addEventListener('click',()=>{ msg.textContent='Sorry, you must be 21 or older to view this site.'; });
  document.documentElement.classList.add('os-lock');
  document.body.append(box);
}

function clSmoke(){
  const W=[
    ['M862 318 C 880 250 950 230 990 170 S 1080 70 1190 40 S 1330 10 1420 -10',90,.22,0],
    ['M862 318 C 840 240 900 190 960 150 S 1010 60 980 -10',70,.18,1.2],
    ['M862 318 C 900 280 990 290 1060 250 S 1200 190 1300 200 S 1400 170 1460 140',80,.16,2.1],
    ['M862 318 C 870 270 920 250 950 210 S 1000 150 1050 120 S 1130 60 1150 0',44,.32,.6],
    ['M862 318 C 860 285 890 260 915 240 S 960 200 1000 190 S 1080 160 1120 120',26,.42,1.6],
    ['M862 318 C 880 290 930 285 975 270 S 1050 250 1100 230',18,.5,.3]
  ].map(([d,w,o,del],i)=>'<path d="'+d+'" stroke="url(#clSw)" stroke-width="'+w+'" stroke-linecap="round" fill="none" opacity="'+o+'" style="animation-delay:-'+del+'s;animation-duration:'+(9+i*1.7)+'s"/>').join('');
  const d=h('div',{class:'cl-smoke','aria-hidden':'true'});
  d.innerHTML='<svg viewBox="0 0 1400 620" preserveAspectRatio="xMidYMid slice">'+
   '<defs><linearGradient id="clSw" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".5" stop-color="#DDE2EA" stop-opacity=".55"/><stop offset="1" stop-color="#C9CFDA" stop-opacity="0"/></linearGradient>'+
   '<filter id="clSf" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.022" numOctaves="3" seed="4"><animate attributeName="baseFrequency" dur="20s" values="0.006 0.022;0.009 0.017;0.006 0.022" repeatCount="indefinite"/></feTurbulence><feDisplacementMap in="SourceGraphic" scale="70" xChannelSelector="R" yChannelSelector="G"/><feGaussianBlur stdDeviation="5"/></filter>'+
   '<filter id="clSb"><feGaussianBlur stdDeviation="18"/></filter>'+
   '<linearGradient id="clPod" x1="0" x2="1"><stop offset="0" stop-color="#08090B"/><stop offset=".42" stop-color="#2E3138"/><stop offset=".52" stop-color="#6A6F7A"/><stop offset=".62" stop-color="#2A2D33"/><stop offset="1" stop-color="#0C0D10"/></linearGradient>'+
   '<linearGradient id="clTip" x1="0" x2="1"><stop offset="0" stop-color="#121317"/><stop offset=".5" stop-color="#555A64"/><stop offset="1" stop-color="#101114"/></linearGradient>'+
   '<radialGradient id="clLed"><stop offset="0" stop-color="#FF4A52"/><stop offset="1" stop-color="#B3121B" stop-opacity="0"/></radialGradient></defs>'+
   '<ellipse cx="1000" cy="200" rx="260" ry="120" fill="#C9CFDA" opacity=".07" filter="url(#clSb)"/>'+
   '<g class="cl-wisps" filter="url(#clSf)">'+W+'</g>'+
   '<g transform="translate(720 640) rotate(26)"><rect x="-40" y="-300" width="80" height="290" rx="26" fill="url(#clPod)"/><rect x="-26" y="-366" width="52" height="76" rx="16" fill="url(#clTip)"/><rect x="-12" y="-382" width="24" height="20" rx="7" fill="#0A0B0D"/><rect x="-35" y="-290" width="5" height="268" rx="2.5" fill="#fff" opacity=".1"/><circle cx="0" cy="-70" r="20" fill="url(#clLed)"><animate attributeName="opacity" dur="2.4s" values=".55;1;.55" repeatCount="indefinite"/></circle><circle cx="0" cy="-70" r="4.5" fill="#FF7A80"/></g>'+
   '</svg>';
  return d;
}
function cloudShop(C){
  const city=C.city.split(',')[0];
  const addrTxt=[C.addr,C.city].filter(Boolean).join(', ');
  const mapQ=encodeURIComponent([C.name,C.addr,C.city].filter(Boolean).join(', '));
  const G=groups(C.items,'In Store');
  const pics=C.own.concat((Array.isArray(C.x.extraPhotos)?C.x.extraPhotos:[]).filter(u=>typeof u==='string'&&/^https:\/\//.test(u)));
  const xc=Array.isArray(C.x.cats)?C.x.cats.filter(v=>typeof v==='string'&&v.trim()).slice(0,8):[];
  const cats=C.items.length?G.names:xc;
  const logo=C.logo||(typeof C.x.logoUrl==='string'&&/^https:\/\//.test(C.x.logoUrl)?C.x.logoUrl:'');
  const warn=h('div',{class:'cl-warn'},'WARNING: This product contains nicotine. Nicotine is an addictive chemical.');
  const head=h('header',{class:'cl-head'},h('div',{class:'cl-w cl-head-in'},
    h('div',{class:'cl-brand'},logo?h('img',{src:logo,alt:'',class:'cl-logo'}):null,h('span',{class:'cl-name'},C.name)),
    h('div',{class:'cl-head-ic'},C.tel?h('a',{href:C.tel,'aria-label':'Call'},clIco('phone')):null,C.maps?h('a',{href:C.maps,target:'_blank',rel:'noopener','aria-label':'Directions'},clIco('pin')):null)),
    h('nav',{class:'cl-w cl-cats'},jump('cl-shop','New In','on'),cats.slice(0,8).map(k=>jump('cl-shop',k)),jump('cl-visit','Hours'),jump('cl-visit','Location')));
  const smoke=!!C.x.heroSmoke;
  const hp=(typeof C.x.heroPhoto==='string'&&/^https:\/\//.test(C.x.heroPhoto))?C.x.heroPhoto:'';
  const hv=(typeof C.x.heroVideo==='string'&&/^https:\/\/assets\.mixkit\.co\/videos\/\d+\/\d+-720\.mp4$/.test(C.x.heroVideo))?C.x.heroVideo:'';
  const blow=!smoke&&(!!hv||(!!hp&&C.x.heroBlow!==false));
  const vidLayer=()=>{ const w=h('div',{class:'cl-blow','aria-hidden':'true'});
    const rate=+C.x.heroVideoRate||0.8, seg=+C.x.heroVideoSeg||7, xf=1.6;
    const mk=()=>{ const v=h('video',{class:'cl-vid',muted:'',playsinline:'',preload:'auto'}); v.muted=true; v.src=hv; v.playbackRate=rate; v.addEventListener('loadedmetadata',()=>{ v.playbackRate=rate; }); return v; };
    const A=mk(), B=mk(); B.classList.add('off'); w.append(A,B);
    let cur=A, nxt=B, busy=false;
    const tick=()=>{ if(!busy&&cur.currentTime>=seg-xf*rate){ busy=true; nxt.currentTime=0; nxt.playbackRate=rate; nxt.play().catch(()=>{}); nxt.classList.remove('off'); cur.classList.add('off'); const old=cur; setTimeout(()=>{ old.pause(); busy=false; },xf*1000+100); cur=nxt; nxt=old; } };
    [A,B].forEach(v=>v.addEventListener('timeupdate',()=>{ if(v===cur) tick(); }));
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){ A.addEventListener('loadeddata',()=>{ A.currentTime=1.2; },{once:true}); }
    else { A.autoplay=true; A.play().catch(()=>{}); }
    return w; };
  const blowLayers=()=>{ const w=h('div',{class:'cl-blow','aria-hidden':'true'}); [0,1,2].forEach(i=>{ const l=h('div',{class:'cl-blow-l b'+i}); l.style.backgroundImage=cssUrl(hp); w.append(l); }); return w; };
  const hero=h('section',{class:'cl-w cl-hero-wrap'},bg(h('div',{class:'cl-hero'+(smoke?' smoke':'')+(blow?' blowing':'')},smoke?clSmoke():(blow?(hv?vidLayer():blowLayers()):null),h('div',{class:'cl-hero-c'},
    h('small',null,[C.cat||'Vape & Smoke Shop',city].filter(Boolean).join(' · ')),
    h('h1',null,C.tag||('Your local cloud shop in '+city)),
    h('div',{class:'cl-hero-btns'},C.maps?h('a',{class:'cl-btn white',href:C.maps,target:'_blank',rel:'noopener'},'Get Directions',clIco('arrow')):null,C.tel?h('a',{class:'cl-btn ghost',href:C.tel},'Call '+C.phoneTxt):null),
    C.today?h('p',{class:'cl-open'},clIco('clock'),'Open today '+C.today):null),logo?h('img',{src:logo,alt:C.name+' logo',class:'cl-hero-logo'}):null),(smoke||blow)?null:(hp||C.hero),(smoke||blow)?'linear-gradient(135deg,#050506 0%,#0B0C0E 100%)':'linear-gradient(90deg,rgba(10,10,12,.88) 0%,rgba(10,10,12,.55) 50%,rgba(10,10,12,.15) 100%)'));
  const perks=h('section',{class:'cl-w'},h('div',{class:'cl-perks'},[
    ['id','21+ only','Bring a valid ID'],['pin','Walk right in',addrTxt||('In '+city)],['clock','Hours today',C.today||'Call for hours'],['phone','Questions?',C.phoneTxt||'Stop in and ask']
  ].map(([i,t,d])=>{ const href=i==='pin'?C.maps:i==='phone'?C.tel:''; const a=href?{class:'cl-perk',href}:{class:'cl-perk'}; if(href&&i==='pin'){a.target='_blank';a.rel='noopener';} return h(href?'a':'div',a,h('span',{class:'cl-perk-i'},clIco(i)),h('div',null,h('b',null,t),h('span',null,d))); })));
  const tiles=pics.length>=2?h('section',{class:'cl-w cl-tiles'},[pics[1],pics[2]||pics[0]].map((u,i)=>bg(h('div',{class:'cl-tile rv'},h('div',null,h('b',null,i?'Stop in today':'Shop in store'),h('span',null,i?(C.today?'Open today '+C.today:'See our hours below'):'Friendly staff, real advice'),i?jump('cl-visit','Hours & Directions','cl-btn white sm'):jump('cl-shop','See What’s In','cl-btn white sm'))),u,'linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(0,0,0,.75) 100%)'))):null;
  let shop=null;
  if(C.items.length){
    const row=h('div',{class:'cl-row'},C.items.slice(0,16).map(i=>h('div',{class:'cl-prod rv'},
      h('div',{class:'cl-prod-pic'},i.photo?h('img',{src:i.photo,alt:i.name,loading:'lazy'}):h('span',null,(i.group||C.name).slice(0,18))),
      h('small',null,i.group||''),h('b',null,i.name),i.desc?h('p',null,short(i.desc,70)):null,i.price?h('span',{class:'cl-price'},i.price):null)));
    shop=h('section',{class:'cl-sec',id:'cl-shop'},h('div',{class:'cl-w'},h('h2',{class:'cl-h'},'Trending In Store'),row,
      h('p',{class:'cl-note'},'Stock changes often. Call ahead to check if your favorite is in.')));
  } else {
    shop=h('section',{class:'cl-sec',id:'cl-shop'},xc.length?h('div',{class:'cl-w'},h('h2',{class:'cl-h'},'What We Carry'),h('div',{class:'cl-carry'},xc.map((k,i)=>(()=>{ const cp=C.x.catPhotos&&typeof C.x.catPhotos==='object'?C.x.catPhotos[k]:''; const ok=typeof cp==='string'&&/^https:\/\//.test(cp); return h('div',{class:'cl-carry-c rv'+(ok?' pic':'')},ok?(()=>{ const el=bg(h('div',{class:'cl-carry-pic'}),cp); const ps=C.x.catPos&&C.x.catPos[k]; if(typeof ps==='string'&&/^[\d.]+% [\d.]+%( [\d.]+%)?$/.test(ps)){ const q=ps.split(' '); el.style.backgroundPosition=q[0]+' '+q[1]; if(q[2]) el.style.backgroundSize=q[2]; } return el; })():clCatIco(k),h('div',{class:'cl-carry-t'},h('b',null,k),h('small',null,'In store now'))); })()))):null,h('div',{class:'cl-w cl-empty'},h('h2',{class:'cl-h'},xc.length?'Ask What\u2019s In Stock':'Shop In Store'),
      h('p',null,'New products come in all the time. Stop in, or call and ask what is in stock today.'),C.tel?h('a',{class:'cl-btn red',href:C.tel},'Call '+C.phoneTxt):null));
  }
  const gal=pics.length>3?h('section',{class:'cl-sec cl-gal'},h('div',{class:'cl-w'},h('h2',{class:'cl-h'},'Inside the Shop'),
    h('div',{class:'cl-grid'},pics.slice(0,8).map((u,i)=>{ const b=bg(h('button',{type:'button',class:'cl-ph','aria-label':'Open photo '+(i+1)}),u); b.addEventListener('click',()=>gallery(pics,C.name,i)); return b; })))):null;
  const revs=C.reviews.length?h('section',{class:'cl-sec cl-revs'},h('div',{class:'cl-w'},h('h2',{class:'cl-h'},'What Customers Say'),
    h('div',{class:'cl-rev-grid'},C.reviews.slice(0,3).map(r=>h('figure',{class:'rv'},h('div',{class:'cl-stars'},'★★★★★'),h('blockquote',null,short(r.text,200)),h('figcaption',null,r.name)))),
    C.reviewsSource?h('p',{class:'cl-note'},C.reviewsSource):null)):null;
  const visit=h('section',{class:'cl-sec cl-visit',id:'cl-visit'},h('div',{class:'cl-w cl-visit-in'},
    h('div',null,h('h2',{class:'cl-h left'},'Visit '+C.name),addrTxt?h('p',{class:'cl-addr'},addrTxt):null,
      C.hasHours?h('div',{class:'cl-hrs'},osHours(C).map(r=>h('div',{class:r.today?'on':null},h('span',null,r.days),h('span',null,r.v)))):null,
      h('div',{class:'cl-hero-btns'},C.maps?h('a',{class:'cl-btn red',href:C.maps,target:'_blank',rel:'noopener'},'Get Directions'):null,C.tel?h('a',{class:'cl-btn line',href:C.tel},'Call '+C.phoneTxt):null)),
    addrTxt?h('div',{class:'cl-map'},h('iframe',{src:'https://www.google.com/maps?q='+mapQ+'&output=embed',title:'Map to '+C.name,loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'})):null));
  const foot=h('footer',{class:'cl-foot'},h('div',{class:'cl-w cl-foot-in'},
    h('div',null,h('span',{class:'cl-name light'},C.name),addrTxt?h('p',null,addrTxt):null,C.phoneTxt?h('p',null,h('a',{href:C.tel||null},C.phoneTxt)):null,socials(C)),
    h('div',null,h('b',null,'Shop'),cats.slice(0,6).map(k=>jump('cl-shop',k)),jump('cl-visit','Hours & Location')),
    h('div',{class:'cl-legal'},h('b',null,'21+ Only'),h('p',null,'You must be 21 or older to purchase. Valid ID required. Products may contain nicotine, an addictive chemical.'))),
    h('div',{class:'cl-w cl-copy'},'© '+new Date().getFullYear()+' '+C.name));
  return h('div',{class:'demo cl'},warn,head,hero,perks,tiles,shop,gal,revs,visit,foot);
}
/* ===================== SUNSHINE (family diner: rising sun, blue awning, big plates) ===================== */
const SN_IC={
  sun:'<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  egg:'<path d="M5 13c0-4 3-6 6-6 4 0 8 2 8 6s-3 6-7 6-7-2-7-6z"/><circle cx="12" cy="12.5" r="2.6" fill="currentColor" stroke="none"/>',
  cakes:'<ellipse cx="12" cy="8" rx="8" ry="2.6"/><path d="M4 8v2.6c0 1.4 3.6 2.6 8 2.6s8-1.2 8-2.6V8M4 11v2.6c0 1.4 3.6 2.6 8 2.6s8-1.2 8-2.6V11M4 14v2.6c0 1.4 3.6 2.6 8 2.6s8-1.2 8-2.6V14"/><path d="M11 6.6h2.4v1.4H11z" fill="currentColor"/>',
  cup:'<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3.5c-.8 1 .8 2-.1 3M12 3.5c-.8 1 .8 2-.1 3"/>',
  pan:'<circle cx="10" cy="13" r="6.5"/><path d="M16 10.5l6-3"/><circle cx="9" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="1.2" fill="currentColor" stroke="none"/>',
  wrap:'<path d="M6 20l3-15c2-2 6-2 8 0l-3 15"/><path d="M8 13c2 1 5 1 7 0M9 9c1.6.8 4 .8 5.6 0"/>',
  gravy:'<path d="M3 13h18a9 6 0 0 1-18 0z"/><path d="M7 10c1-2 3-2 4 0M13 9c1-2 3-2 4 0"/>',
  plate:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/>',
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="currentColor"/>',
  heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  pin:'<path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  phone:'<path d="M5 4h3.5l1.5 4-2 1.3a10 10 0 0 0 4.7 4.7L14 12l4 1.5V17a2 2 0 0 1-2 2A13 13 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  bag:'<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'
};
function snIc(k,n,cls){ const s=h('span',{class:cls||'sn-ic','aria-hidden':'true'}); s.innerHTML='<svg viewBox="0 0 24 24" width="'+(n||22)+'" height="'+(n||22)+'" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(SN_IC[k]||SN_IC.plate)+'</svg>'; return s; }
/* illustrated plates for the guest favorite cards */
const SN_INK='#1B2A41';
const snPlate='<ellipse cx="130" cy="116" rx="110" ry="46" fill="#1B2A41" opacity=".12"/><ellipse cx="130" cy="108" rx="110" ry="46" fill="#fff" stroke="#1B2A41" stroke-width="3"/><ellipse cx="130" cy="108" rx="86" ry="34" fill="#EEF3F9"/>';
const snEgg=(x,y,s)=>'<g transform="translate('+x+' '+y+') scale('+(s||1)+')"><path d="M-30 2 Q-34 -18 -12 -20 Q0 -30 16 -20 Q34 -16 30 2 Q26 18 4 16 Q-24 22 -30 2Z" fill="#fff" stroke="#1B2A41" stroke-width="3"/><circle cx="0" cy="-2" r="11" fill="#FFB020" stroke="#1B2A41" stroke-width="2.5"/><circle cx="-3" cy="-5" r="3" fill="#FFE7A3"/></g>';
const snSteam='<g class="sn-steam" fill="none" stroke="#9FB6D6" stroke-width="4" stroke-linecap="round"><path d="M110 40 q-8 -10 0 -20 q8 -10 0 -20"/><path d="M135 36 q-8 -10 0 -20 q8 -10 0 -20"/><path d="M160 40 q-8 -10 0 -20 q8 -10 0 -20"/></g>';
const SN_ART={
  omelet:snPlate+'<path d="M58 112 Q58 66 130 62 Q202 66 202 112 Q130 128 58 112Z" fill="#FFD54A" stroke="#1B2A41" stroke-width="3"/><g fill="#F2B632"><ellipse cx="100" cy="86" rx="10" ry="5"/><ellipse cx="150" cy="80" rx="8" ry="4"/><ellipse cx="170" cy="98" rx="9" ry="4"/></g><g fill="#A0522D" stroke="#1B2A41" stroke-width="2"><path d="M70 110 q8 10 20 6 l-4 -8z"/><path d="M98 116 q10 8 22 4 l-6 -8z"/><path d="M140 118 q12 4 22 -4 l-10 -4z"/><path d="M172 112 q10 0 16 -8 l-10 -2z"/></g><g fill="#5FA052"><circle cx="118" cy="74" r="2.5"/><circle cx="132" cy="88" r="2.5"/><circle cx="160" cy="88" r="2.5"/></g><ellipse cx="218" cy="62" rx="28" ry="12" fill="#fff" stroke="#1B2A41" stroke-width="3"/><path d="M190 62 q0 18 28 18 q28 0 28 -18" fill="#7FB3E8" stroke="#1B2A41" stroke-width="3"/><ellipse cx="218" cy="61" rx="22" ry="8" fill="#F7F7EE"/><g fill="#5FA052"><circle cx="210" cy="60" r="2"/><circle cx="222" cy="58" r="2"/><circle cx="226" cy="63" r="2"/></g>',
  hash:snPlate+'<path d="M64 112 Q70 68 130 64 Q190 68 196 112 Q130 128 64 112Z" fill="#C8743F" stroke="#1B2A41" stroke-width="3"/><g stroke="#1B2A41" stroke-width="2"><rect x="80" y="92" width="14" height="12" rx="3" fill="#8B3A1E"/><rect x="104" y="100" width="13" height="11" rx="3" fill="#E9A45E"/><rect x="160" y="96" width="14" height="12" rx="3" fill="#8B3A1E"/><rect x="176" y="86" width="12" height="11" rx="3" fill="#E9A45E"/><rect x="88" y="76" width="12" height="11" rx="3" fill="#E9A45E"/><rect x="146" y="106" width="12" height="10" rx="3" fill="#8B3A1E"/></g>'+snEgg(132,82,1.1)+'<g fill="#5FA052"><circle cx="112" cy="70" r="2.5"/><circle cx="160" cy="76" r="2.5"/></g>',
  gravy:snPlate+'<rect x="62" y="62" width="68" height="52" rx="18" fill="#E9A14B" stroke="#1B2A41" stroke-width="3"/><rect x="126" y="58" width="72" height="56" rx="18" fill="#E9A14B" stroke="#1B2A41" stroke-width="3"/><g transform="translate(130 80) scale(.7) translate(-130 -86)"><path d="M60 90 Q66 58 100 62 Q120 50 150 58 Q196 54 200 86 Q206 100 192 104 Q186 116 172 108 Q160 122 146 110 Q128 124 116 110 Q100 122 90 108 Q72 116 70 102 Q56 100 60 90Z" fill="#F4EEE2" stroke="#1B2A41" stroke-width="3"/><g fill="#A0522D"><circle cx="96" cy="80" r="4"/><circle cx="130" cy="74" r="5"/><circle cx="164" cy="82" r="4"/><circle cx="112" cy="96" r="3.5"/><circle cx="178" cy="94" r="3.5"/></g><g fill="#55606F"><circle cx="104" cy="70" r="1.6"/><circle cx="146" cy="70" r="1.6"/><circle cx="122" cy="88" r="1.6"/><circle cx="154" cy="96" r="1.6"/><circle cx="84" cy="92" r="1.6"/><circle cx="186" cy="80" r="1.6"/></g></g><g fill="#F6C46A"><rect x="76" y="70" width="18" height="6" rx="3"/><rect x="170" y="66" width="16" height="6" rx="3"/></g>',
  cakes:snPlate+'<ellipse cx="130" cy="104" rx="70" ry="18" fill="#D98E3A" stroke="#1B2A41" stroke-width="3"/><ellipse cx="130" cy="92" rx="70" ry="18" fill="#D98E3A" stroke="#1B2A41" stroke-width="3"/><ellipse cx="130" cy="80" rx="70" ry="18" fill="#D98E3A" stroke="#1B2A41" stroke-width="3"/><ellipse cx="130" cy="76" rx="66" ry="15" fill="#F6C46A"/><path d="M84 78 Q100 70 130 70 Q170 70 178 80 Q176 92 168 96 Q164 86 156 86 Q150 100 142 88 Q130 84 112 88 Q104 98 98 86 Q90 86 84 78Z" fill="#9A4A12" opacity=".85"/><rect x="118" y="60" width="22" height="14" rx="3" fill="#FFF1A8" stroke="#1B2A41" stroke-width="2.5" transform="rotate(-8 129 67)"/><g stroke="#1B2A41" stroke-width="2"><rect x="92" y="66" width="12" height="10" rx="3" fill="#F7DFA6"/><rect x="152" y="64" width="12" height="10" rx="3" fill="#F7DFA6"/><rect x="164" y="74" width="11" height="9" rx="3" fill="#F7DFA6"/></g><g fill="#D9443B"><rect x="92" y="66" width="12" height="3" rx="1.5"/><rect x="152" y="64" width="12" height="3" rx="1.5"/><rect x="164" y="74" width="11" height="3" rx="1.5"/></g>',
  two:snPlate+snEgg(88,94,.95)+snEgg(122,78,.95)+'<ellipse cx="170" cy="86" rx="28" ry="12" fill="#D98E3A" stroke="#1B2A41" stroke-width="3"/><ellipse cx="170" cy="83" rx="26" ry="10" fill="#F6C46A"/><ellipse cx="186" cy="104" rx="28" ry="12" fill="#D98E3A" stroke="#1B2A41" stroke-width="3"/><ellipse cx="186" cy="101" rx="26" ry="10" fill="#F6C46A"/><g fill="none" stroke-linecap="round"><path d="M80 120 q12 -8 24 0 t24 0 t20 0" stroke="#1B2A41" stroke-width="12"/><path d="M80 120 q12 -8 24 0 t24 0 t20 0" stroke="#C6452E" stroke-width="8"/><path d="M80 120 q12 -8 24 0 t24 0 t20 0" stroke="#F3A08C" stroke-width="2"/><path d="M86 132 q12 -8 24 0 t24 0 t20 0" stroke="#1B2A41" stroke-width="12"/><path d="M86 132 q12 -8 24 0 t24 0 t20 0" stroke="#C6452E" stroke-width="8"/><path d="M86 132 q12 -8 24 0 t24 0 t20 0" stroke="#F3A08C" stroke-width="2"/></g>',
  skillet:'<ellipse cx="124" cy="116" rx="104" ry="44" fill="#1B2A41" opacity=".12"/><rect x="206" y="94" width="50" height="14" rx="7" fill="#2B2F3A" stroke="#1B2A41" stroke-width="3" transform="rotate(-10 206 101)"/><ellipse cx="122" cy="106" rx="98" ry="44" fill="#2B2F3A" stroke="#1B2A41" stroke-width="3"/><ellipse cx="122" cy="102" rx="84" ry="35" fill="#40454F"/><g stroke="#1B2A41" stroke-width="2"><rect x="56" y="94" width="14" height="12" rx="3" fill="#F0B65A"/><rect x="74" y="80" width="14" height="12" rx="3" fill="#F0B65A"/><rect x="160" y="88" width="14" height="12" rx="3" fill="#F0B65A"/><rect x="176" y="104" width="13" height="11" rx="3" fill="#F0B65A"/><rect x="92" y="110" width="12" height="10" rx="3" fill="#F0B65A"/><rect x="66" y="108" width="10" height="9" rx="2" fill="#4CAF50"/><rect x="150" y="110" width="10" height="9" rx="2" fill="#E5533D"/><rect x="170" y="80" width="10" height="9" rx="2" fill="#4CAF50"/><rect x="84" y="98" width="9" height="8" rx="2" fill="#E5533D"/><circle cx="146" cy="78" r="6" fill="#A0522D"/><circle cx="188" cy="94" r="5" fill="#A0522D"/><circle cx="108" cy="80" r="5" fill="#A0522D"/></g><path d="M86 86 Q100 74 126 80 Q150 74 166 90 Q160 108 140 112 Q120 120 100 110 Q84 104 86 86Z" fill="#FFC93C" opacity=".9"/>'+snEgg(124,94,1)
};
function snArtKey(f){ const n=String(f.n||''); return f.a||(/gyro|omelet/i.test(n)?'omelet':/2x2/i.test(n)?'two':/hash/i.test(n)?'hash':/gravy|biscuit/i.test(n)?'gravy':/pancake|cake/i.test(n)?'cakes':/skillet/i.test(n)?'skillet':''); }
function snArt(f){ const k=snArtKey(f)||(/gyro|omelet/i.test(f.n)?'omelet':/2x2/i.test(f.n)?'two':/hash/i.test(f.n)?'hash':/gravy|biscuit/i.test(f.n)?'gravy':/pancake|cake/i.test(f.n)?'cakes':/skillet/i.test(f.n)?'skillet':'');
  if(!SN_ART[k]) return null; const d=h('div',{class:'sn-art-svg','aria-hidden':'true'}); d.innerHTML='<svg viewBox="0 -24 260 184">'+snSteam+SN_ART[k]+'</svg>'; return d; }
/* the curved corner building at 4th and Central, with the blue awning and a rising sun */
function snBuilding(name){
  const d=h('div',{class:'sn-art','aria-hidden':'true'});
  const word=String(name||'Sunshine').split(/\s+/)[0].toUpperCase().slice(0,10).replace(/[^A-Z]/g,'');
  let rays=''; for(let i=0;i<16;i++){ rays+='<rect x="417" y="-12" width="6" height="30" rx="3" transform="rotate('+(i*22.5)+' 420 74)"/>'; }
  let scal=''; for(let i=0;i<14;i++){ const x=60+i*30; scal+='<path d="M'+x+' 262 q15 16 30 0" fill="'+(i%2?'#1F5FAF':'#FFFFFF')+'" stroke="#174A8A" stroke-width="2"/>'; }
  let win=''; [[92,120],[162,120],[300,120],[370,120]].forEach(([x,y])=>{ win+='<rect x="'+x+'" y="'+y+'" width="52" height="64" rx="4" fill="#BFE0FF" stroke="#174A8A" stroke-width="3"/><path d="M'+(x+26)+' '+y+'v64M'+x+' '+(y+32)+'h52" stroke="#174A8A" stroke-width="2"/>'; });
  d.innerHTML='<svg viewBox="0 0 520 440"><defs><radialGradient id="snSky" cx="50%" cy="38%" r="65%"><stop offset="0" stop-color="#FFF4C2"/><stop offset=".55" stop-color="#FFE08A"/><stop offset="1" stop-color="#FFC24A"/></radialGradient></defs>'+
   '<rect x="0" y="0" width="520" height="440" rx="18" fill="url(#snSky)"/>'+
   '<g class="sn-rays" fill="#FFB020" opacity=".55">'+rays+'</g>'+
   '<circle class="sn-sun" cx="420" cy="74" r="52" fill="#FFB020"/><circle class="sn-sun" cx="420" cy="74" r="40" fill="#FFD45C"/><g fill="#FFFFFF" opacity=".9"><ellipse cx="110" cy="52" rx="38" ry="14"/><ellipse cx="138" cy="44" rx="24" ry="14"/><ellipse cx="230" cy="34" rx="28" ry="10"/></g>'+
   '<path d="M40 330 L40 96 Q260 52 480 96 L480 330 Z" fill="#F7F9FC" stroke="#174A8A" stroke-width="4"/>'+
   '<path d="M40 210 Q260 172 480 210" fill="none" stroke="#D8E3F2" stroke-width="3"/>'+win+
   '<rect x="122" y="70" width="276" height="44" rx="8" fill="#1F5FAF"/><text x="260" y="101" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-weight="800" font-size="26" letter-spacing="5" fill="#FFFFFF">'+word+'</text>'+
   '<path d="M50 238 Q260 200 470 238 L486 262 Q260 222 34 262 Z" fill="#1F5FAF" stroke="#174A8A" stroke-width="2"/>'+scal+
   '<rect x="226" y="276" width="70" height="54" rx="4" fill="#174A8A"/><rect x="236" y="284" width="22" height="40" rx="2" fill="#BFE0FF"/><rect x="264" y="284" width="22" height="40" rx="2" fill="#BFE0FF"/>'+
   '<rect x="78" y="284" width="110" height="40" rx="4" fill="#BFE0FF" stroke="#174A8A" stroke-width="3"/><rect x="334" y="284" width="110" height="40" rx="4" fill="#BFE0FF" stroke="#174A8A" stroke-width="3"/>'+
   '<text x="133" y="310" text-anchor="middle" font-family="ui-rounded,system-ui,sans-serif" font-weight="700" font-size="13" fill="#174A8A">OPEN 6AM</text>'+
   '<rect x="0" y="330" width="520" height="110" fill="#9DB4CF"/><rect x="0" y="330" width="520" height="14" fill="#C8D6E6"/>'+
   '<path d="M0 392h520" stroke="#FFFFFF" stroke-width="5" stroke-dasharray="26 22"/>'+
   '<g class="sn-steam" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round"><path d="M455 300c-6-8 6-12 0-20"/><path d="M468 302c-6-8 6-12 0-20"/></g>'+
   '<rect x="440" y="306" width="40" height="30" rx="6" fill="#FFFFFF" stroke="#174A8A" stroke-width="3"/><path d="M480 314h6a6 6 0 0 1 0 12h-6" fill="none" stroke="#174A8A" stroke-width="3"/>'+
   '</svg>';
  return d;
}
function snParse(t){ const m=String(t||'').toLowerCase().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*[-to]+\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/); if(!m) return null; const f=(H,M,ap)=>((+H%12)+(ap==='pm'?12:0))*60+(+M||0); return [f(m[1],m[2],m[3]),f(m[4],m[5],m[6])]; }
function snStatus(C){ const now=new Date(), d=todayIx(), mins=now.getHours()*60+now.getMinutes(); const r=snParse(C.hours[d]); const nice=t=>String(t||'').replace(/:00/g,'');
  if(r&&mins>=r[0]&&mins<r[1]) return {open:true,t:'Open now until '+nice(String(C.hours[d]).split(/-|to/)[1]||'').trim()};
  if(r&&mins<r[0]) return {open:false,t:'Opens today at '+nice(String(C.hours[d]).split(/-|to/)[0]).trim()};
  for(let i=1;i<=7;i++){ const k=(d+i)%7, q=snParse(C.hours[k]); if(q) return {open:false,t:'Opens '+(i===1?'tomorrow':DAYS[k])+' at '+nice(String(C.hours[k]).split(/-|to/)[0]).trim()}; }
  return null; }
function sunshine(C){
  const name=C.name||'Sunshine Family Restaurant';
  const A=k=>Array.isArray(C.x[k])?C.x[k]:[], S=v=>typeof v==='string'?v:'';
  const favs=A('favs').filter(f=>f&&S(f.n)).slice(0,6);
  const favNames=favs.map(f=>S(f.n).toLowerCase());
  const deals=A('deals').filter(f=>f&&S(f.t)).slice(0,3);
  const story=A('story').filter(f=>f&&S(f.y)&&S(f.t)).slice(0,10);
  const revs=A('rev').filter(r=>r&&S(r.t)&&S(r.n)).slice(0,6);
  const notes=A('notes').filter(n=>typeof n==='string').slice(0,8);
  const rating=C.x.rating&&typeof C.x.rating==='object'?C.x.rating:null;
  const order=okUrl(C.x.orderUrl);
  const west=C.x.west&&typeof C.x.west==='object'&&S(C.x.west.n)?C.x.west:null;
  const st=snStatus(C);
  const call=(cls,label)=>C.tel?h('a',{class:'sn-btn '+cls,href:C.tel},snIc('phone',18,'sn-bi'),label||'Call '+C.phoneTxt):null;
  const orderBtn=(cls,label)=>order?h('a',{class:'sn-btn '+cls,href:order,target:'_blank',rel:'noopener'},snIc('bag',18,'sn-bi'),label||'Order for delivery'):null;
  const links=[['s-menu','Menu'],favs.length?['s-favs','Favorites']:null,A('rev').length?['s-reviews','Reviews']:null,A('story').length?['s-story','Our story']:null,['s-visit','Visit']].filter(Boolean);


  /* --- big text toggle (remembered per browser) --- */
  let big=false; try{ big=localStorage.getItem('sn-big')==='1'; }catch(e){}
  const bigBtn=h('button',{type:'button',class:'sn-big',title:'Make the text bigger or smaller','aria-pressed':big?'true':'false',onclick:()=>{ big=!big; root0.classList.toggle('big',big); bigBtn.setAttribute('aria-pressed',big?'true':'false'); bigBtn.lastChild.textContent=big?'Normal text':'Larger text'; try{ localStorage.setItem('sn-big',big?'1':'0'); }catch(e){} }},h('b',null,'Aa'),h('span',null,big?'Normal text':'Larger text'));

  /* --- what should I order? --- */
  const byArt=k=>favs.find(f=>snArtKey(f)===k);
  const PICKS={'sweet-light':['cakes'],'sweet-hungry':['cakes','two'],'sweet-starving':['two','cakes'],
    'savory-light':['gravy','omelet'],'savory-hungry':['omelet','hash','gravy'],'savory-starving':['skillet','hash'],
    'both-light':['deal0','cakes'],'both-hungry':['deal0','two'],'both-starving':['two','skillet']};
  let pT='',pH='',pN=0;
  const pRes=h('div',{class:'sn-pk-res','aria-live':'polite'});
  const pickOpts=(arr,cur,set)=>h('div',{class:'sn-pk-o'},arr.map(([v,l,ic])=>{ const b=h('button',{type:'button','aria-pressed':'false',onclick:()=>{ b.parentNode.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false')); set(v); pN=0; showPick(); }},snIc(ic,26),h('span',null,l)); return b; }));
  const showPick=()=>{ if(!pT||!pH){ pRes.replaceChildren(h('div',{class:'sn-pk-wait'},snIc('plate',40),h('p',null,'Pick both and we will find your plate.'))); return; }
    const list=(PICKS[pT+'-'+pH]||[]).map(k=>{ if(k==='deal0'&&deals[0]) return {n:S(deals[0].t),d:S(deals[0].d),p:S(deals[0].p),a:'two'}; const f=byArt(k); return f?{n:S(f.n),d:S(f.d),a:k}:null; }).filter(Boolean);
    if(!list.length){ pRes.replaceChildren(h('p',null,'Ask your server, they know the menu best.')); return; }
    const it=list[pN%list.length]; const art=snArt({n:it.n,a:it.a});
    pRes.replaceChildren(h('div',{class:'sn-pk-card'},art?h('div',{class:'sn-pk-art'},art):null,h('div',null,h('small',null,'You should try'),h('h3',null,it.n,it.p?h('span',{class:'sn-pk-p'},it.p):null),h('p',null,it.d),
      h('div',{class:'sn-cta'},list.length>1?h('button',{type:'button',class:'sn-btn line sm',onclick:()=>{ pN++; showPick(); }},'Something else'):null,h('button',{type:'button',class:'sn-btn sun sm',onclick:()=>scrollTo('s-menu')},'See the menu'))))); };
  showPick();
  const pickSec=favs.length?h('section',{class:'sn-sec sn-pick',id:'s-pick'},h('div',{class:'sn-wrap'},h('div',{class:'sn-pk rv'},
    h('div',{class:'sn-pk-q'},h('span',{class:'sn-kick'},'Can\u2019t decide?'),h('h2',null,'What should I order?'),h('p',{class:'sn-pk-sub'},'Two quick taps and we will point you to a plate guests love.'),
      h('b',{class:'sn-pk-l'},'1. What are you in the mood for?'),pickOpts([['sweet','Sweet','cakes'],['savory','Savory','egg'],['both','A bit of both','plate']],pT,v=>pT=v),
      h('b',{class:'sn-pk-l'},'2. How hungry are you?'),pickOpts([['light','A little','cup'],['hungry','Pretty hungry','pan'],['starving','Starving','star']],pH,v=>pH=v)),
    h('div',null,pRes)))):null;

  /* --- chalkboard --- */
  const now=new Date(), dayName=DAYS[todayIx()];
  const tPick=favs.length?favs[(now.getDate()+todayIx())%favs.length]:null;
  const chalkLines=(S(C.x.today)?S(C.x.today).split('|'):[tPick?'Today’s pick: '+S(tPick.n):'',deals[0]?S(deals[0].t)+' '+S(deals[0].p):'','Hot coffee from 6am']).map(t=>t.trim()).filter(Boolean).slice(0,5);
  const chalk=h('div',{class:'sn-chalk rv'},h('div',{class:'sn-chalk-in'},h('small',null,'Today at '+name.split(/\s+/)[0]),h('h3',null,dayName+', '+now.toLocaleDateString('en-US',{month:'long',day:'numeric'})),
    h('ul',null,chalkLines.map(t=>h('li',null,t))),h('span',{class:'sn-chalk-sun'},snIc('sun',30))));

  /* --- then and now --- */
  const nowImg=okUrl(C.x.heroImg);
  let tnBox=null;
  const TH=C.x.then&&typeof C.x.then==='object'?C.x.then:{}; const thN=S(TH.n)||S(C.x.thenName), thL=S(TH.l)||S(C.x.thenLabel), thT=S(TH.t)||S(C.x.thenText);
  if(nowImg&&thN){
    const then=snBuilding(thN); then.classList.add('sn-tn-then'); then.innerHTML=then.innerHTML.replace('OPEN 6AM',S(C.x.thenSign)||'EST. 1942').replace('<svg viewBox="0 0 520 440">','<svg viewBox="0 30 520 390" preserveAspectRatio="xMidYMid slice">');
    const wrap=h('div',{class:'sn-tn-box',style:'--p:62%'},h('img',{src:nowImg,alt:'Today',loading:'lazy'}),then,h('span',{class:'sn-tn-bar'},h('i',null,'‹ ›')),
      h('span',{class:'sn-tn-tag l'},thL||'Then'),h('span',{class:'sn-tn-tag r'},'Today'));
    const rng=h('input',{type:'range',min:'0',max:'100',value:'62','aria-label':'Slide between then and now',oninput:e=>wrap.style.setProperty('--p',e.target.value+'%')});
    wrap.append(rng);
    tnBox=wrap;
  }

  /* --- meet the family --- */
  const fam=A('fam').filter(f=>f&&S(f.n)).slice(0,3);
  const famRow=fam.length?h('div',{class:'sn-fam2'},fam.map((f,i)=>h('div',{class:'sn-fm2'},h('div',{class:'sn-fm-av c'+i},okUrl(f.img)?h('img',{src:okUrl(f.img),alt:S(f.n)}):h('span',null,S(f.ini)||S(f.n).slice(0,1))),
    h('div',null,h('small',null,S(f.r)),h('b',null,S(f.n)),h('p',null,S(f.d)))))):null;

  /* --- groups heads-up --- */
  const gIn=(lab,el)=>h('label',{class:'sn-f'},h('span',null,lab),el);
  const gName=h('input',{type:'text',autocomplete:'name',required:'required'}), gPhone=h('input',{type:'tel',autocomplete:'tel',required:'required'});
  const gSize=h('select',{required:'required'},h('option',{value:''},'Choose'),['6 to 9','10 to 14','15 to 24','25 or more'].map(v=>h('option',{value:v},v)));
  const gDay=h('input',{type:'date',required:'required'}), gTime=h('select',null,['6:00am','7:00am','8:00am','9:00am','10:00am','11:00am','12:00pm','1:00pm'].map(v=>h('option',{value:v},v)));
  const gNote=h('textarea',{rows:'3',placeholder:'Birthday, team breakfast, after church, high chairs needed...'});
  const gErr=h('p',{class:'sn-f-err','aria-live':'polite'}), gDone=h('div',{class:'sn-f-done',hidden:'hidden'});
  const gForm=h('form',{class:'sn-form',novalidate:'novalidate',onsubmit:e=>{ e.preventDefault(); const bad=[gName,gPhone,gSize,gDay].find(x=>!String(x.value).trim()); if(bad){ gErr.textContent='Please fill in your name, phone, group size and day.'; bad.focus(); return; }
      gErr.textContent=''; gDone.replaceChildren(snIc('heart',30),h('h3',null,'Thanks, '+gName.value.trim().split(/\s+/)[0]+'!'),h('p',null,'Your group of '+gSize.value+' on '+new Date(gDay.value+'T12:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})+' around '+gTime.value+' is on its way to the kitchen.'),h('small',null,'Demo preview: on the live site this note goes straight to the restaurant.')); gForm.hidden=true; gDone.hidden=false; }},
    h('div',{class:'sn-f-g'},gIn('Your name',gName),gIn('Phone',gPhone),gIn('Group size',gSize),gIn('Day',gDay),gIn('About what time?',gTime)),gIn('Anything we should know?',gNote),gErr,h('button',{type:'submit',class:'sn-btn sun'},'Send the heads-up'));
  const grpBox=h('details',{class:'sn-grp2'},h('summary',null,snIc('star',20),h('span',null,h('b',null,'Coming with a group of 6 or more?'),h('small',null,'Teams, birthdays, reunions and church groups. Give us a heads-up.')),h('i',{class:'sn-grp-plus','aria-hidden':'true'},'+')),
    h('div',{class:'sn-grp-in'},gForm,gDone));

  /* --- map with both locations --- */
  const locs=[{n:S(C.x.mainLabel)||'Downtown',t:name,a:[C.addr,C.city].filter(Boolean).join(', '),h:C.daysOpen===7&&C.hours.every(x=>x===C.hours[0])?'Every day, '+C.hours[0]:'',p:C.phoneTxt,tel:C.tel,extra:S(C.x.corner)}];
  if(west) locs.push({n:'West',t:S(west.n),a:S(west.a),h:S(west.h),p:S(west.p),tel:S(west.p)?'tel:+1'+S(west.p).replace(/\D/g,'').slice(-10):'',extra:''});
  const mapFrame=h('iframe',{title:'Map',loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'});
  const mapInfo=h('div',{class:'sn-map-info'}), mapTabs=h('div',{class:'sn-map-tabs',role:'tablist'});
  const showLoc=i=>{ const L=locs[i]; mapTabs.querySelectorAll('button').forEach((b,j)=>b.setAttribute('aria-selected',j===i?'true':'false'));
    mapFrame.src='https://www.google.com/maps?q='+encodeURIComponent(L.t+', '+L.a)+'&output=embed';
    mapInfo.replaceChildren(h('h3',null,L.t),h('p',null,snIc('pin',18),L.a),L.extra?h('p',{class:'sn-note'},L.extra):null,L.h?h('p',null,snIc('clock',18),L.h):null,L.p?h('p',null,snIc('phone',18),h('a',{href:L.tel},L.p)):null,
      h('a',{class:'sn-btn blue sm',href:'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(L.t+', '+L.a),target:'_blank',rel:'noopener'},snIc('pin',16,'sn-bi'),'Directions')); };
  locs.forEach((L,i)=>mapTabs.append(h('button',{type:'button',role:'tab',onclick:()=>showLoc(i)},L.n)));
  showLoc(0);
  const mapBox=h('div',{class:'sn-map rv'},h('div',{class:'sn-map-side'},locs.length>1?h('small',{class:'sn-map-k'},'Two locations, one warm welcome'):null,locs.length>1?mapTabs:null,mapInfo),h('div',{class:'sn-map-f'},mapFrame));

  const top=h('div',{class:'sn-top'},h('div',{class:'sn-wrap sn-top-in'},
    st?h('span',{class:'sn-live '+(st.open?'on':'')},h('i'),st.t):h('span',null,''),
    h('span',{class:'sn-top-r'},C.daysOpen===7?'Open 7 days a week':'',C.addr?h('span',null,C.addr+', '+C.city):null),bigBtn));
  const nav=h('header',{class:'sn-nav'},h('div',{class:'sn-wrap sn-nav-in'},
    h('a',{class:'sn-brand',href:'#',onclick:e=>{e.preventDefault();scrollTo('s-top');}},snIc('sun',34,'sn-logo'),h('span',null,h('b',null,name.split(/\s+/)[0]),h('small',null,name.split(/\s+/).slice(1).join(' ')))),
    h('nav',{class:'sn-links'},links.map(([id,l])=>h('button',{type:'button',onclick:()=>scrollTo(id)},l))),
    call('sun sm','Call us')),
    h('nav',{class:'sn-mlinks','aria-label':'Sections'},links.map(([id,l])=>h('button',{type:'button',onclick:()=>scrollTo(id)},l))));

  const hero=h('section',{class:'sn-hero',id:'s-top'},h('div',{class:'sn-burst','aria-hidden':'true'}),h('div',{class:'sn-wrap sn-hero-g'},
    h('div',{class:'sn-hero-t'},
      h('span',{class:'sn-kick'},S(C.x.kicker)||(C.cat||'Family restaurant')+' · '+(C.city||'')),
      h('h1',null,...String(S(C.x.headline)||'Good morning, '+(String(C.city).split(',')[0]||'neighbor')+'.').split('|').map((t,i)=>i?[h('br'),h('em',null,t)]:t)),
      h('p',{class:'sn-lead'},C.tag||''),
      h('div',{class:'sn-cta'},h('button',{type:'button',class:'sn-btn ink',onclick:()=>scrollTo('s-pick')},snIc('plate',18,'sn-bi'),'See the menu'),call('blue'),orderBtn('white'))),
    h('div',{class:'sn-hero-v'},
      okUrl(C.x.heroImg)?h('figure',{class:'sn-photo'},h('img',{src:okUrl(C.x.heroImg),alt:name,loading:'eager'})):snBuilding(name),
      S(C.x.since)?h('span',{class:'sn-sticker'},snIc('sun',30,'sn-sk-ic'),h('b',null,S(C.x.since)),h('small',null,'Family owned')):null,
      rating?h('span',{class:'sn-rbadge'},h('span',{class:'sn-stars'},[0,1,2,3,4].map(()=>snIc('star',14,'sn-st'))),h('b',null,String(rating.v||'')+' on Google'),h('small',null,Number(rating.n||0).toLocaleString('en-US')+' reviews')):null,
      h('span',{class:'sn-hbadge'},snIc('cup',20),h('b',null,'Coffee on at 6am'),h('small',null,C.daysOpen===7?'Every day of the week':'')))));

  const marquee=favs.length?h('div',{class:'sn-marq','aria-hidden':'true'},h('div',{class:'sn-marq-in'},[0,1].map(()=>favs.map(f=>h('span',null,snIc('sun',16,'sn-mi'),S(f.n)))))):null;

  const favSec=favs.length?h('section',{class:'sn-sec sn-favsec',id:'s-favs'},h('div',{class:'sn-wrap'},
    h('div',{class:'sn-head rv'},h('span',{class:'sn-kick'},'Guest favorites'),h('h2',null,S(C.x.favTitle)||'What everybody orders'),h('p',null,S(C.x.favSub)||'The plates guests talk about most in their reviews.')),
    h('div',{class:'sn-favs'},favs.map((f,i)=>{ const pic=snArt({n:S(f.n),a:S(f.a)});
      return h('article',{class:'sn-fav rv'+(pic?' has-art':'')},
        pic?h('div',{class:'sn-fav-art c'+(i%3)},h('span',{class:'sn-fav-no'},String(i+1).padStart(2,'0')),pic):h('div',{class:'sn-fav-ic c'+(i%3)},snIc(S(f.i)||'plate',34)),
        h('div',{class:'sn-fav-b'},h('h3',null,S(f.n)),h('p',null,S(f.d)),S(f.q)?h('blockquote',null,'“'+S(f.q)+'”'):null)); })))):null;

  const specials=h('div',{class:'sn-spec'},chalk,deals.map((dl,i)=>h('div',{class:'sn-deal rv d'+i},h('small',null,S(dl.k)||'Special'),h('h3',null,S(dl.t)),h('p',null,S(dl.d)),S(dl.p)?h('b',{class:'sn-deal-p'},S(dl.p)):null)));

  /* menu with tabs */
  const G=groups(C.items,'Menu');
  const panes=h('div',{class:'sn-panes'});
  const tabs=h('div',{class:'sn-tabs',role:'tablist'});
  const showTab=k=>{ tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-selected',b.dataset.k===k?'true':'false'));
    panes.replaceChildren(h('ul',{class:'sn-menu'},G.map[k].map(it=>{ const fav=favNames.some(n=>n&&it.name.toLowerCase().indexOf(n)>=0);
      return h('li',{class:fav?'sn-fv':null},h('div',{class:'sn-mi-t'},h('b',null,it.name),fav?h('span',{class:'sn-badge'},snIc('heart',12,'sn-bh'),'Guest favorite'):null,h('i',{class:'sn-dots'}),it.price?h('span',{class:'sn-price'},it.price):null),it.desc?h('p',null,it.desc):null); }))); };
  G.names.forEach(k=>tabs.append(h('button',{type:'button',role:'tab','data-k':k,onclick:()=>showTab(k)},k)));
  if(G.names.length) showTab(G.names[0]);
  const menuSec=h('section',{class:'sn-sec sky sn-wv',id:'s-menu'},h('div',{class:'sn-wrap'},
    h('div',{class:'sn-head rv'},h('span',{class:'sn-kick'},'The menu'),h('h2',null,S(C.x.menuTitle)||'Breakfast and lunch, every day'),h('p',null,S(C.x.menuSub)||'Home-style cooking and big portions.')),
    specials,
    h('div',{class:'sn-menu-box rv'},tabs,panes),
    h('div',{class:'sn-menu-foot'},S(C.x.menuNote)?h('p',{class:'sn-note'},S(C.x.menuNote)):null,h('div',{class:'sn-cta'},call('blue','Call ahead for takeout'),orderBtn('line')))));

  const gal=A('gallery').filter(g=>typeof g==='string').map(g=>{const [u,c]=g.split('|');return {u:okUrl((u||'').trim()),c:(c||'').trim()};}).filter(g=>g.u).slice(0,8);

  const storySec=story.length?h('section',{class:'sn-sec',id:'s-story'},h('div',{class:'sn-wrap'},
    h('div',{class:'sn-story'},
      h('div',{class:'sn-story-t rv'},h('span',{class:'sn-kick'},'Our story'),h('h2',null,S(C.x.storyTitle)||'A corner with a story'),h('p',{class:'sn-story-p'},S(C.x.storyText)||C.about),thT?h('p',{class:'sn-story-p'},thT):null,famRow),
      tnBox?h('div',{class:'sn-story-v rv'},tnBox,h('p',{class:'sn-note'},'Slide to compare. The \u201cthen\u201d side is an illustration.')):null),
    h('ol',{class:'sn-tl rv'},story.map(e=>h('li',{class:S(e.hi)?'hi':null},h('b',null,S(e.y)),h('span',null,S(e.t))))))):null;

  const mos=[]; const nI=Math.max(gal.length,revs.length);
  for(let i=0;i<nI;i++){ if(gal[i]) mos.push(h('figure',{class:'sn-mo-ph rv'},h('img',{src:gal[i].u,alt:gal[i].c||name,loading:'lazy'}),gal[i].c?h('figcaption',null,gal[i].c):null));
    const r=revs[i]; if(r) mos.push(h('figure',{class:'sn-mo-rv rv c'+(i%3)},h('span',{class:'sn-stars'},[0,1,2,3,4].map(()=>snIc('star',15,'sn-st'))),h('blockquote',null,'\u201c'+S(r.t)+'\u201d'),h('figcaption',null,S(r.n),S(r.s)?h('small',null,' on '+S(r.s)):null))); }
  const revSec=mos.length?h('section',{class:'sn-sec sun sn-wv',id:'s-reviews'},h('div',{class:'sn-wrap'},
    h('div',{class:'sn-head rv'},h('span',{class:'sn-kick'},'Photos and reviews'),h('h2',null,S(C.x.revTitle)||'Neighbors love it here'),rating?h('p',null,String(rating.v)+' stars from '+Number(rating.n).toLocaleString('en-US')+' '+(S(rating.src)||'reviews')+'. Big plates, hot coffee and a room full of neighbors.'):null),
    h('div',{class:'sn-mosaic'},mos))):null;


  const hoursList=h('ul',{class:'sn-hours'},DAYS.map((d,i)=>h('li',{class:i===todayIx()?'today':null},h('span',null,d),h('b',null,C.hours[i]||'Closed'))));
  const visit=h('section',{class:'sn-sec sky sn-wv',id:'s-visit'},h('div',{class:'sn-wrap sn-visit'},
    h('div',{class:'rv'},h('span',{class:'sn-kick'},'Come on in'),h('h2',null,'Visit us'),
      h('ul',{class:'sn-contact'},
        C.addr?h('li',null,snIc('pin',22),h('div',null,h('small',null,'Address'),h('a',{href:C.maps,target:'_blank',rel:'noopener'},C.addr+', '+C.city),S(C.x.corner)?h('span',null,S(C.x.corner)):null)):null,
        C.tel?h('li',null,snIc('phone',22),h('div',null,h('small',null,'Phone'),h('a',{href:C.tel},C.phoneTxt))):null,
        order?h('li',null,snIc('bag',22),h('div',null,h('small',null,'Delivery'),h('a',{href:order,target:'_blank',rel:'noopener'},S(C.x.orderLabel)||'Order online'))):null),
      h('div',{class:'sn-cta'},C.maps?h('a',{class:'sn-btn blue',href:C.maps,target:'_blank',rel:'noopener'},snIc('pin',18,'sn-bi'),'Get directions'):null,call('line')),
      notes.length?h('div',{class:'sn-gk'},h('b',null,S(C.x.notesTitle)||'Good to know'),h('ul',{class:'sn-notes2'},notes.map((n,i)=>h('li',null,snIc(['plate','heart','clock','sun','egg','cup','pin','star'][i%8],18),n)))):null),
    h('div',{class:'sn-hours-card rv'},h('h3',null,snIc('clock',22),'Hours'),hoursList,st?h('p',{class:'sn-live '+(st.open?'on':'')},h('i'),st.t):null),
    grpBox,
    mapBox));

  const foot=h('footer',{class:'sn-foot'},h('div',{class:'sn-wrap sn-foot-in'},
    h('div',null,h('div',{class:'sn-brand'},snIc('sun',30,'sn-logo'),h('span',null,h('b',null,name.split(/\s+/)[0]),h('small',null,name.split(/\s+/).slice(1).join(' ')))),h('p',null,S(C.x.footLine)||'')),
    h('div',null,h('b',null,'Hours'),h('p',null,C.daysOpen===7&&C.hours.every(x=>x===C.hours[0])?'Every day, '+C.hours[0]:DAYS.map((d,i)=>d.slice(0,3)+' '+(C.hours[i]||'Closed')).join(' · '))),
    h('div',null,h('b',null,'Find us'),h('p',null,[C.addr,C.city].filter(Boolean).join(', ')),C.tel?h('a',{href:C.tel},C.phoneTxt):null)));

  const chk=()=>h('div',{class:'sn-chk','aria-hidden':'true'});
  const bigFoot=h('div',{class:'sn-bigfoot'},h('div',{class:'sn-wrap sn-bigfoot-in'},h('b',null,name.split(/\s+/)[0]+'!'),h('span',null,'See you at breakfast.')));
  const root0=h('div',{class:'sn fw'+(big?' big':'')},top,nav,hero,chk(),marquee,pickSec,menuSec,favSec,revSec,storySec,visit,chk(),bigFoot,foot);
  /* phones: horizontal rows roll like the dish ticker (CSS transform, same speed); a touch pauses them */
  const autoRow=sel=>{ const el=root0.querySelector(sel); if(!el||!matchMedia('(max-width: 860px)').matches||matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const kids=[...el.children]; if(kids.length<2) return;
    const track=h('div',{class:'sn-roll-t'}); kids.forEach(k=>track.append(k)); kids.forEach(k=>{ const c=k.cloneNode(true); c.setAttribute('aria-hidden','true'); c.classList.add('rv-on'); track.append(c); });
    el.classList.add('sn-roll'); el.append(track);
    requestAnimationFrame(()=>{ const half=track.scrollWidth/2; track.style.animationDuration=Math.max(12,half/48)+'s'; });
    let t=0; const hold=()=>{ track.style.animationPlayState='paused'; clearTimeout(t); t=setTimeout(()=>{ track.style.animationPlayState='running'; },3000); };
    ['touchstart','pointerdown'].forEach(ev=>el.addEventListener(ev,hold,{passive:true})); };
  setTimeout(()=>['.sn-favs','.sn-mosaic','.sn-fam2'].forEach(autoRow),400);
  return root0;
}
/* ===================== REALTY (real estate agent: buy, sell, home value, follow) ===================== */
const RT_SVG={
  mail:'<path d="M3 6h18v12H3z"/><path d="M3 7l9 6 9-6"/>',
  tiktok:'<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.4 2.6 2.2 4.4 5 4.6"/>',
  home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  sign:'<path d="M5 21V4"/><path d="M5 6h13v7H5"/><path d="M9 13v3M15 13v3"/>',
  value:'<path d="M4 20h16"/><path d="M6 16l4-5 3 3 5-7"/><path d="M15 7h3v3"/>',
  search:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'
};
function rtIco(k,size){ const s=h('span',{class:'rt-ic','aria-hidden':'true'}); s.innerHTML='<svg viewBox="0 0 24 24" width="'+(size||22)+'" height="'+(size||22)+'" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(RT_SVG[k]||'')+'</svg>'; return s; }
function realty(C){
  const name=C.name||'Your Name';
  const first=name.split(/\s+/)[0];
  const firm=typeof C.x.brokerage==='string'?C.x.brokerage:'';
  const areaTxt=(typeof C.x.areaName==='string'&&C.x.areaName?C.x.areaName.replace(/-area$/i,''):(C.city||'').split(',')[0])||'local';
  const person=(typeof C.x.legalName==='string'&&C.x.legalName)||name.replace(/\s+Real Estate$/i,'');
  const office=(typeof C.x.officeCity==='string'&&C.x.officeCity)||'Asbury, IA';
  const licStates=(typeof C.x.licStates==='string'&&C.x.licStates)||'Iowa';
  const licMore=typeof C.x.licensedStates==='string'?C.x.licensedStates:'';
  const offAddr=typeof C.x.officeAddr==='string'?C.x.officeAddr:'', offPhone=typeof C.x.officePhone==='string'?C.x.officePhone:'';
  const ehoLogo=okUrl(C.x.ehoLogo), realtorLogo=okUrl(C.x.realtorLogo), idxText=typeof C.x.idxDisclaimer==='string'?C.x.idxDisclaimer:'';
  const licNo=(String(C.x.license||'').match(/#\s*([A-Z0-9-]+)/)||[])[1]||'';
  const kwLogo=okUrl(C.x.kwLogo)||(/^keller williams legacy group$/i.test(firm)?'https://riverbendwebco.com/demo/img/kw-legacy-logo.png':'');
  /* official Market Center DBA logo goes in x.kwLogo (file from KW Connect, unmodified); until then a labeled placeholder */
  const kwMark=(cls)=>h('span',{class:'rt-kw '+(cls||'')+(kwLogo?'':' ph'),},kwLogo?h('img',{src:kwLogo,alt:firm||'Keller Williams'}):(()=>{ const f=firm||'Keller Williams Legacy Group'; const m=f.match(/^(Keller Williams)\s+(.+)$/i); return m?[h('b',null,m[1]),h('small',null,m[2])]:[h('b',null,f)]; })());
  const pTitle=person+', REALTOR\u00ae';
  const photo=(u=>/\/gill-[\w-]*-bw\.jpg$/.test(u)?'https://riverbendwebco.com/demo/img/gill-4k-color.jpg':u)(okUrl(C.x.photo));
  const site=okUrl(C.x.searchUrl)||'';
  const digits=C.phone.replace(/\D/g,'').slice(-10);
  const sms=digits.length===10?'sms:+1'+digits:'';
  const mail=(subj,body)=>C.email?'mailto:'+C.email+'?subject='+encodeURIComponent(subj||'')+(body?'&body='+encodeURIComponent(body):''):'';
  /* every form opens the visitor's own email app (or texts) with the details filled in */
  const send=(subj,lines)=>{ const body=lines.filter(Boolean).join('\n'); const u=mail(subj,body)||(sms?sms+'?&body='+encodeURIComponent(subj+'\n'+body):''); if(u) location.href=u; };
  const F=(C.x.follow&&typeof C.x.follow==='object')?C.x.follow:{};
  const A=k=>Array.isArray(C.x[k])?C.x[k]:[];
  const S=v=>typeof v==='string'?v:'';
  const facts=A('facts').filter(f=>f&&f.v&&f.k).slice(0,4);
  const guides=A('areaGuide').filter(g=>g&&S(g.n)).slice(0,8);
  const areas=guides.length?guides.map(g=>S(g.n)):A('areas').filter(a=>typeof a==='string').slice(0,8);
  const before=A('before').filter(b=>b&&S(b.t)).slice(0,4);
  const langs=A('langs').filter(l=>l&&S(l.n)).slice(0,4);
  const sold=A('sold').filter(x=>x&&S(x.a)).slice(0,8);
  const guide=A('guide').filter(x=>typeof x==='string').slice(0,8);
  const links=[['r-buy','Buy'],['r-sell','Sell'],['r-value','Home Value'],['r-areas','Areas'],['r-about','About'],['r-contact','Contact']].filter(([id])=>id!=='r-areas'||areas.length);
  const go=id=>()=>routeTo(id);
  function routeTo(id){ const t=document.getElementById(id); const pg=t&&t.closest('.rt-pg'); const want=pg?pg.dataset.pg:''; if(curPage()!==want){ pendingScroll=id; location.hash=want?want:'home'; } else if(t) scrollTo(id); }
  let pendingScroll=''; const PAGES=['search','buyers','sellers','neighborhoods','about','privacy','terms','idx']; const curPage=()=>{ const hsh=location.hash.slice(1); return PAGES.includes(hsh)?hsh:''; };
  const btn=(cls,href,label,ext,onclick)=>href?h('a',Object.assign({class:'rt-btn '+cls,href},ext?{target:'_blank',rel:'noopener'}:{}),label):h('button',{type:'button',class:'rt-btn '+cls,onclick},label);
  const svg=(k,n)=>{ const d=h('span',{class:'rt-cic','aria-hidden':'true'}); d.innerHTML='<svg viewBox="0 0 24 24" width="'+(n||22)+'" height="'+(n||22)+'" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(RT_SVG[k]||'')+'</svg>'; return d; };
  const head=(kick,title,sub,cls)=>h('div',{class:'rt-head rv '+(cls||'')},kick?h('span',{class:'rt-kick'},kick):null,h('h2',null,title),sub?h('p',null,sub):null);
  const money=n=>'$'+Math.round(n).toLocaleString('en-US');

  /* ---------- small form helpers ---------- */
  const field=(label,el,wide)=>h('label',{class:'rt-fl'+(wide?' wide':'')},h('span',null,label),el);
  const inp=(type,ph,req,extra)=>h('input',Object.assign({type,placeholder:ph||''},req?{required:true}:{},extra||{}));
  const sel=(opts,extra)=>h('select',extra||null,opts.map(o=>h('option',{value:o},o)));
  const toggles=(list,multi)=>{ const box=h('div',{class:'rt-tg'}); list.forEach(t=>{ const b=h('button',{type:'button','aria-pressed':'false'},t); b.onclick=()=>{ if(!multi) box.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')==='true'?'false':'true'); }; box.append(b); }); box.val=()=>[...box.querySelectorAll('[aria-pressed="true"]')].map(b=>b.textContent).join(', '); return box; };
  /* TCPA consent: unchecked, required, right above the submit button on every form that collects a phone number */
  const consent=()=>h('label',{class:'rt-consent'},h('input',{type:'checkbox',required:true,'data-consent':'1'}),h('span',null,'By checking this box and submitting, you agree to receive calls and text messages from '+((typeof C.x.legalName==='string'&&C.x.legalName)||name.replace(/\s+Real Estate$/i,''))+' with '+(firm||'Keller Williams Legacy Group')+' regarding your real estate inquiry. Msg & data rates may apply. Reply STOP to opt out.'));
  const consentOk=f=>{ const c=f.querySelector('[data-consent]'); return !c||c.checked; };
  /* a form shown one step at a time, with a progress bar */
  const stepper=(title,panels,onDone,doneMsg)=>{
    let i=0; const bar=h('i'); const count=h('span',{class:'rt-sp-n'}); const err=h('p',{class:'rt-err',role:'alert'});
    const back=h('button',{type:'button',class:'rt-btn outline'},'Back'), next=h('button',{type:'submit',class:'rt-btn dark'},'Next');
    const done=h('div',{class:'rt-done',hidden:true},h('b',null,'Thanks, your message is ready to send.'),h('p',null,doneMsg));
    const show=()=>{ panels.forEach((p,k)=>p.hidden=k!==i); bar.style.width=((i+1)/panels.length*100)+'%'; count.textContent='Step '+(i+1)+' of '+panels.length; back.hidden=i===0; next.textContent=i===panels.length-1?'Send':'Next'; err.textContent=''; };
    const form=h('form',{class:'rt-sp',novalidate:true,onsubmit:e=>{ e.preventDefault(); const bad=[...panels[i].querySelectorAll('[required]')].find(x=>x.type==='checkbox'?!x.checked:!String(x.value).trim()); if(bad){ err.textContent=bad.type==='checkbox'?'Please check the consent box to continue.':'Please fill in the required fields.'; bad.focus(); return; } if(i<panels.length-1){ i++; show(); return; } onDone(); form.hidden=true; done.hidden=false; }},
      h('div',{class:'rt-sp-top'},h('b',null,title),count),h('div',{class:'rt-sp-bar'},bar),...panels,err,h('div',{class:'rt-sp-nav'},back,next));
    back.onclick=()=>{ if(i>0){ i--; show(); } };
    show(); return h('div',{class:'rt-tool rv'},form,done);
  };

  /* ---------- top ---------- */
  const NAVL=[['home','Home'],['search','Search'],['buyers','Buyers'],['sellers','Sellers'],['neighborhoods','Neighborhoods'],['about','About & Contact']];
  const navA=([k,l])=>h('a',{href:'#'+k,'data-nav':k},l);
  const nav=h('header',{class:'rt-nav solid'},h('div',{class:'rt-wrap rt-nav-in'},
    h('a',{class:'rt-brand',href:'#home'},h('span',{class:'rt-brand-t'},h('b',null,pTitle),h('span',null,firm))),
    h('nav',{class:'rt-links'},NAVL.map(navA)),
    h('div',{class:'rt-nav-r'},kwMark('nav'),h('a',{class:'rt-btn gold rt-cta',href:'#about','data-go':'r-consult',onclick:e=>{e.preventDefault();routeTo('r-consult');}},h('span',{class:'rt-cta-l'},'Schedule a '),'Consultation'))),
    h('nav',{class:'rt-mlinks','aria-label':'Pages'},h('a',{class:'rt-mcta',href:'#about',onclick:e=>{e.preventDefault();routeTo('r-consult');}},'Schedule a Consultation'),NAVL.map(navA)));
  const AREA_IMG={dubuque:'https://riverbendwebco.com/demo/img/gill-dubuque.jpg',asbury:'https://riverbendwebco.com/demo/img/gill-asbury.jpg',peosta:'https://riverbendwebco.com/demo/img/gill-peosta.jpg',dyersville:'https://riverbendwebco.com/demo/img/gill-dyersville.jpg'};
  const areaImg=(n,fb)=>AREA_IMG[String(n||'').toLowerCase().trim()]||fb;
  const heroHome=okUrl(C.x.heroHome)||AREA_IMG.dubuque;
  const heroFallback='https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1800&q=75';
  const hImg=h('img',{src:heroHome,alt:''}); hImg.onerror=()=>{ if(hImg.src!==heroFallback) hImg.src=heroFallback; };
  const hq=h('input',{type:'search',placeholder:'City, ZIP, address or MLS #','aria-label':'Search homes'});
  const htype=h('select',{'aria-label':'Property type'},['Any type','House','Condo / Townhome','Multi-family','Land / Acreage','Farm'].map(o=>h('option',null,o)));
  const hero=h('section',{class:'rt-hero',id:'r-top'},
    heroHome===AREA_IMG.dubuque?h('div',{class:'rt-hero-bg lights','aria-hidden':'true'},
      h('div',{class:'rt-lfill'},h('img',{src:AREA_IMG.dubuque.replace('.jpg','-off.jpg'),alt:''}),h('img',{class:'on',src:AREA_IMG.dubuque,alt:''})),
      h('div',{class:'rt-lfit'},h('img',{src:AREA_IMG.dubuque.replace('.jpg','-off.jpg'),alt:''}),h('img',{class:'on',src:AREA_IMG.dubuque,alt:''}))):h('div',{class:'rt-hero-bg','aria-hidden':'true'},hImg),
    h('div',{class:'rt-wrap rt-hero-in'},
      h('span',{class:'rt-hero-kick'},'Serving '+(S(C.x.areaName)?S(C.x.areaName).replace(/-area$/i,''):C.city||'the area')+' and surrounding communities'),
      h('h1',null,person),
      h('div',{class:'rt-hero-firm'},'REALTOR\u00ae  \u00b7  '+firm),
      C.tag?h('p',{class:'rt-lead'},C.tag):null,
      h('form',{class:'rt-hsearch',onsubmit:e=>{ e.preventDefault(); sQ.value=hq.value; if(htype.value!=='Any type') sType.value=htype.value; location.hash='search'; }},hq,htype,h('button',{type:'submit',class:'rt-btn gold'},'Search Homes')),
      langs.length?h('div',{class:'rt-langs'},h('span',null,'Speaks'),langs.map(l=>h('b',{lang:S(l.code)||null},S(l.native)||S(l.n)))):null,
      h('div',{class:'rt-hero-btns'},btn('line',null,'What Is My Home Worth?',false,go('r-value')),btn('line',null,'Schedule a Consultation',false,go('r-consult')))));
  const card=(k,t,p,label,href,ext,onclick,img)=>{ const c=h('button',{type:'button',class:'rt-card',onclick},h('img',{class:'rt-card-img',src:img,alt:'',loading:'lazy'}),h('div',{class:'rt-card-in'},h('h3',null,t),h('p',null,p),h('span',{class:'rt-card-go'},label,ico('arrow',14,'')))); return c; };
  const intro=h('section',{class:'rt-intro',id:'r-intro'},h('div',{class:'rt-wrap rt-intro-in2'},
    photo?h('img',{class:'rt-intro-ph rv',src:photo,alt:person+', '+firm}):null,
    h('div',{class:'rv'},h('span',{class:'rt-kick'},'Meet your REALTOR®'),h('h2',null,person),h('p',{class:'rt-firm-line'},firm),
      h('p',null,String(C.about||'').split('\n')[0]),
      h('div',{class:'rt-row'},h('a',{class:'rt-btn dark',href:'#about'},'More About '+first),btn('outline',null,'Schedule a Consultation',false,go('r-consult'))))));
  const cards=h('section',{class:'rt-cards-sec'},h('div',{class:'rt-wrap rt-cards'},
    card('home','Buy with '+first,'From first-time buyers to move-up buyers and downsizers, '+first+' guides you through every step.','Search Homes',null,false,()=>{location.hash='search';},'https://riverbendwebco.com/demo/img/gill-buy.jpg'),
    card('sign','Sell with '+first,'A clear plan to price, prepare and market your home, so it sells with less stress.','Sell My Home',null,false,go('r-sell'),'https://riverbendwebco.com/demo/img/gill-sell.jpg'),
    card('value','What is my home worth?','Get a free, no-pressure estimate of what your home could sell for in today’s market.','Get My Estimate',null,false,go('r-value'),'https://riverbendwebco.com/demo/img/gill-value.jpg')));

  const factsRow=facts.length?h('section',{class:'rt-facts-sec'},h('div',{class:'rt-wrap rt-facts-g'},
    h('h2',null,'Why ',h('br'),first),facts.map(f=>h('div',{class:'rt-fact rv'},h('b',null,String(f.v)),h('span',null,String(f.k)))))):null;

  /* ---------- about: story, background, languages ---------- */
  const about=h('section',{class:'rt-sec',id:'r-about'},h('div',{class:'rt-wrap'},
    h('div',{class:'rt-about'},
      h('div',{class:'rv'},h('span',{class:'rt-kick'},'About '+first),h('h2',null,'Work with a dedicated REALTOR® today.'),
        h('p',{class:'rt-about-t'},C.about||''),
        h('div',{class:'rt-row'},btn('dark',null,'Start Your Journey Today',false,go('r-contact')))),
      photo?h('img',{class:'rt-about-ph rv',src:photo,alt:name}):null),
    (before.length||langs.length)?h('div',{class:'rt-why'},
      before.length?h('div',{class:'rt-before rv'},h('h3',null,S(C.x.beforeTitle)||'Before real estate'),h('ul',null,before.map(b=>h('li',null,h('b',null,S(b.t)),S(b.d)?h('span',null,S(b.d)):null)))):null,
      langs.length?h('div',{class:'rt-lang rv'},h('h3',null,'Speaks your language'),h('p',null,first+' can work with you in '+langs.map(l=>S(l.n)).join(', ').replace(/, ([^,]*)$/,' or $1')+'.'),
        h('ul',null,langs.map(l=>h('li',null,h('b',{lang:S(l.code)||null},S(l.hello)||S(l.native)||S(l.n)),h('span',null,S(l.n)))))):null):null));

  /* ---------- buyers: steps, search questionnaire, payment calculator, guide ---------- */
  const steps=list=>h('ol',{class:'rt-steps'},list.map((t,i)=>h('li',{class:'rv'},h('b',null,String(i+1).padStart(2,'0')),h('h3',null,t[0]),h('p',null,t[1]))));
  const qTowns=toggles(areas.length?areas.concat(['Not sure yet']):['Not sure yet'],true);
  const qPrice=sel(['Under $200,000','$200,000 to $300,000','$300,000 to $400,000','$400,000 to $550,000','Over $550,000','Not sure yet']);
  const qBeds=sel(['Any','2+','3+','4+','5+']), qBaths=sel(['Any','1+','2+','3+']);
  const qWhen=toggles(['As soon as possible','1 to 3 months','3 to 6 months','Just looking'],false);
  const qLoan=toggles(['Yes','Not yet','Paying cash'],false);
  const qName=inp('text','Your name',true,{autocomplete:'name'}), qPhone=inp('tel','Best phone',true,{autocomplete:'tel'}), qMail=inp('email','Email (optional)',false,{autocomplete:'email'}), qNote=h('textarea',{rows:'3',placeholder:'Must-haves, like a garage, yard or first-floor bedroom'});
  const search=stepper('Start my home search',[
    h('div',{class:'rt-sp-p'},h('p',{class:'rt-q'},'Where would you like to live?'),qTowns),
    h('div',{class:'rt-sp-p'},h('p',{class:'rt-q'},'What are you looking for?'),h('div',{class:'rt-fg'},field('Price range',qPrice,true),field('Bedrooms',qBeds),field('Bathrooms',qBaths)),field('Anything else?',qNote,true)),
    h('div',{class:'rt-sp-p'},h('p',{class:'rt-q'},'When would you like to move?'),qWhen,h('p',{class:'rt-q'},'Are you pre-approved for a loan?'),qLoan),
    h('div',{class:'rt-sp-p'},h('p',{class:'rt-q'},'Where should '+first+' send matching homes?'),h('div',{class:'rt-fg'},field('Name',qName),field('Phone',qPhone),field('Email',qMail,true)),consent())],
    ()=>send('Home search request from '+qName.value,['I am looking for a home.','Towns: '+(qTowns.val()||'Not sure'),'Price range: '+qPrice.value,'Bedrooms: '+qBeds.value+'  Bathrooms: '+qBaths.value,'Moving: '+(qWhen.val()||'Not sure'),'Pre-approved: '+(qLoan.val()||'Not sure'),qNote.value?'Notes: '+qNote.value:'','',qName.value,qPhone.value,qMail.value]),
    first+' will reach out with homes that match what you are looking for.');
  search.id='r-search';

  const cPrice=inp('number','',false,{value:'300000',min:'0',step:'1000',inputmode:'numeric'}), cDown=inp('number','',false,{value:'10',min:'0',max:'100',step:'1',inputmode:'decimal'}), cRate=inp('number','',false,{value:'6.5',min:'0',max:'20',step:'0.125',inputmode:'decimal'}), cTerm=sel(['30 years','20 years','15 years']), cTax=inp('number','',false,{placeholder:'0',min:'0',step:'100',inputmode:'numeric'}), cIns=inp('number','',false,{placeholder:'0',min:'0',step:'100',inputmode:'numeric'});
  const oTotal=h('b',{class:'rt-calc-big'}), oPI=h('span'), oTI=h('span'), oLoan=h('span');
  const calc=()=>{ const P=Math.max(0,+cPrice.value||0), d=Math.min(100,Math.max(0,+cDown.value||0)), L=P*(1-d/100), r=(+cRate.value||0)/1200, n=parseInt(cTerm.value,10)*12; const pi=r?L*r/(1-Math.pow(1+r,-n)):L/n; const ti=((+cTax.value||0)+(+cIns.value||0))/12; oTotal.textContent=money(pi+ti)+'/mo'; oPI.textContent=money(pi); oTI.textContent=money(ti); oLoan.textContent=money(L); };
  [cPrice,cDown,cRate,cTerm,cTax,cIns].forEach(x=>{ x.addEventListener('input',calc); x.addEventListener('change',calc); });
  const calcBox=h('div',{class:'rt-tool rt-calc rv'},
    h('div',{class:'rt-sp-top'},h('b',null,'Estimate your monthly payment')),
    h('div',{class:'rt-fg'},field('Home price ($)',cPrice,true),field('Down payment (%)',cDown),field('Interest rate (%)',cRate),field('Loan term',cTerm),field('Property tax per year ($)',cTax),field('Insurance per year ($)',cIns)),
    h('div',{class:'rt-calc-out'},h('small',null,'Estimated payment'),oTotal,h('dl',null,h('div',null,h('dt',null,'Loan amount'),h('dd',null,oLoan)),h('div',null,h('dt',null,'Principal and interest'),h('dd',null,oPI)),h('div',null,h('dt',null,'Taxes and insurance'),h('dd',null,oTI)))),
    h('p',{class:'rt-fine'},'Estimate only. The rate shown is an example, not a quote. Rates change daily, so talk to a lender for real numbers.'),
    btn('dark',null,'Talk to '+first+' about buying',false,go('r-search')));
  calc();

  const gName=inp('text','Your name',true,{autocomplete:'name'}), gMail=inp('email','Email',true,{autocomplete:'email'});
  const gDone=h('p',{class:'rt-done-line',hidden:true},'Thanks. Your request is ready to send, and '+first+' will email you the guide.');
  const guideBox=guide.length?h('div',{class:'rt-guide rv'},
    h('div',null,h('span',{class:'rt-kick'},'Free download'),h('h3',null,S(C.x.guideTitle)||'The First-Time Home Buyer Guide'),h('p',null,'A simple guide to buying your first home in the '+(S(C.x.areaName)||'local')+' market. Inside:'),h('ol',null,guide.map(t=>h('li',null,t)))),
    h('form',{class:'rt-guide-f',onsubmit:e=>{ e.preventDefault(); if(!gName.value.trim()||!gMail.value.trim()) return; send('Please send me the first-time buyer guide',['Hi '+first+', please email me your first-time home buyer guide.','',gName.value,gMail.value]); gDone.hidden=false; }},
      field('Name',gName,true),field('Email',gMail,true),h('button',{type:'submit',class:'rt-btn solid'},'Send Me the Guide'),gDone)):null;

  const buy=h('section',{class:'rt-sec',id:'r-buy'},h('div',{class:'rt-wrap'},
    head('For buyers','A clear path from first showing to closing day.'),
    steps([['Plan','Talk through your budget, timeline and must-haves, and get connected with a lender if you need one.'],['Search','See homes that match what you want, and tour the ones worth your time.'],['Offer','Write a strong offer, negotiate the details and get through inspection and appraisal.'],['Close','Sign, get your keys and move in.']]),
    h('div',{class:'rt-tools'},search,calcBox),
    guideBox,
    site?h('div',{class:'rt-row'},btn('outline',site,'Browse All Homes for Sale',true)):null));

  /* ---------- sellers: steps + home value form ---------- */
  const vAddr=inp('text','Street address',true,{autocomplete:'street-address'}), vCity=inp('text','City',true,{autocomplete:'address-level2'});
  const vType=toggles(['House','Townhome','Condo','Land or lot','Other'],false);
  const vBeds=sel(['1','2','3','4','5+']), vBaths=sel(['1','1.5','2','2.5','3+']), vSq=inp('number','About how many square feet?',false,{min:'0',inputmode:'numeric'});
  const vCond=toggles(['Move-in ready','Needs a few updates','Needs work'],false);
  const vWhen=toggles(['Within 3 months','3 to 6 months','6 to 12 months','Just curious'],false);
  const vName=inp('text','Your name',true,{autocomplete:'name'}), vPhone=inp('tel','Best phone',true,{autocomplete:'tel'}), vMail=inp('email','Email (optional)',false,{autocomplete:'email'});
  const value=stepper('What is my home worth?',[
    h('div',{class:'rt-sp-p'},h('p',{class:'rt-q'},'Which home?'),h('div',{class:'rt-fg'},field('Address',vAddr,true),field('City',vCity,true)),h('p',{class:'rt-q'},'Type of home'),vType),
    h('div',{class:'rt-sp-p'},h('p',{class:'rt-q'},'Tell '+first+' a little about it'),h('div',{class:'rt-fg'},field('Bedrooms',vBeds),field('Bathrooms',vBaths),field('Square feet',vSq,true)),h('p',{class:'rt-q'},'Condition'),vCond),
    h('div',{class:'rt-sp-p'},h('p',{class:'rt-q'},'When might you sell?'),vWhen,h('div',{class:'rt-fg'},field('Name',vName),field('Phone',vPhone),field('Email',vMail,true)),consent())],
    ()=>send('Home value request: '+vAddr.value,['Please send me a free estimate of what my home is worth.','Address: '+vAddr.value+', '+vCity.value,'Type: '+(vType.val()||'Not given'),'Bedrooms: '+vBeds.value+'  Bathrooms: '+vBaths.value+(vSq.value?'  About '+vSq.value+' sq ft':''),'Condition: '+(vCond.val()||'Not given'),'Selling: '+(vWhen.val()||'Not sure'),'',vName.value,vPhone.value,vMail.value]),
    first+' will look at recent sales near you and get back to you with an estimate.');
  const sell=h('section',{class:'rt-sec gray',id:'r-sell'},h('div',{class:'rt-wrap'},
    head('For sellers','Get your home ready, priced right and in front of buyers.'),
    steps([['Price','Review recent sales nearby to set a price that brings in buyers.'],['Prepare','Simple fixes and staging tips that help your home show well.'],['Market','Photos, listing and social media posts to put your home in front of local buyers.'],['Close','Review offers, negotiate and handle the paperwork through closing.']]),
    h('div',{class:'rt-value',id:'r-value-s'},
      h('div',{class:'rv'},h('span',{class:'rt-kick'},'Free home value'),h('h2',null,'What is your home worth?'),h('p',{class:'rt-cp'},'Answer a few quick questions. '+first+' will compare your home with recent sales nearby and send you a free estimate. No pressure and no obligation.'),
        h('ul',{class:'rt-checks'},['Takes about a minute','Based on real local sales','Free, with no obligation to list'].map(t=>h('li',null,t)))),
      value)));

  /* ---------- proof: just sold and reviews, shown only when there are real ones ---------- */
  const revs=C.reviews.slice(0,6);
  const proof=(sold.length||revs.length)?h('section',{class:'rt-sec',id:'r-proof'},h('div',{class:'rt-wrap'},
    sold.length?[head('Recent results','Just sold'),h('div',{class:'rt-sold'},sold.map(x=>h('div',{class:'rt-sold-i rv'},okUrl(x.p)?h('img',{src:okUrl(x.p),alt:'',loading:'lazy'}):h('div',{class:'rt-sold-ph'}),h('span',{class:'rt-sold-tag'},S(x.s)||'Sold'),h('b',null,S(x.a)),S(x.d)?h('small',null,S(x.d)):null)))]:null,
    revs.length?[head('Reviews','What clients say',C.reviewsSource||'',sold.length?'rt-mt':''),h('div',{class:'rt-revs'},revs.map(r=>h('figure',{class:'rt-rev rv'},h('div',{class:'rt-stars','aria-label':r.stars+' out of 5 stars'},'★'.repeat(r.stars||5)),h('blockquote',null,r.text),h('figcaption',null,r.name))))]:null)):null;

  /* ---------- areas with short guides ---------- */
  const panel=h('div',{class:'rt-ag',hidden:true,'aria-live':'polite'});
  const openGuide=(g,tile)=>{ const was=tile.getAttribute('aria-expanded')==='true'; areasWrap.querySelectorAll('.rt-area').forEach(t=>t.setAttribute('aria-expanded','false')); if(was){ panel.hidden=true; return; } tile.setAttribute('aria-expanded','true');
    const pts=S(g.p).split('|').map(t=>t.trim()).filter(Boolean);
    panel.replaceChildren(h('div',{class:'rt-ag-in'},h('div',null,h('small',null,'Area guide'),h('h3',null,S(g.n)),h('p',null,S(g.t))),pts.length?h('ul',null,pts.map(t=>h('li',null,t))):null,
      h('div',{class:'rt-ag-btns'},site?btn('solid',site,'See Homes in '+S(g.n),true):null,btn('line',null,'Ask '+first+' about '+S(g.n),false,()=>send('Question about '+S(g.n),['Hi '+first+', I have a question about living in '+S(g.n)+'.',''])))));
    panel.hidden=false; panel.scrollIntoView({behavior:'smooth',block:'nearest'}); };
  const areasWrap=h('div',{class:'rt-areas'},areas.map((a,i)=>{ const g=guides[i]; const t=h(g?'button':(site?'a':'div'),Object.assign({class:'rt-area rv'},g?{type:'button','aria-expanded':'false'}:(site?{href:site,target:'_blank',rel:'noopener'}:{})),
      h('span',{class:'rt-area-n','aria-hidden':'true'},String(i+1).padStart(2,'0')),
      h('div',null,h('small',null,'Explore'),h('b',null,a),h('em',null,g?'Area guide ':'Search Listings ',ico('arrow',13,''))));
    const ai=areaImg(a,''); if(ai){ t.style.backgroundImage='linear-gradient(180deg,rgba(19,39,68,.15) 20%,rgba(19,39,68,.88) 100%),url("'+ai+'")'; t.style.backgroundSize='cover'; t.style.backgroundPosition='center'; t.classList.add('has-img'); }
    if(g) t.onclick=()=>openGuide(g,t); return t; }));
  const areasSec=areas.length?h('section',{class:'rt-sec dark',id:'r-areas'},h('div',{class:'rt-wrap'},
    head('Neighborhoods','Search Listings By Area',guides.length?'Tap a town for a quick guide and homes for sale.':''),areasWrap,panel)):null;

  /* ---------- follow ---------- */
  const socIc=k=>k==='tt'?(()=>{ const d=h('span',{class:'rt-sic'}); d.innerHTML='<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+RT_SVG.tiktok+'</svg>'; return d; })():h('span',{class:'rt-sic'},ico(k==='fb'?'i-fb':'i-ig',26,''));
  const tile=(k,label,url,handle)=>{ const u=okUrl(url); const kids=[socIc(k),h('b',null,label),h('span',null,u?(typeof handle==='string'&&handle?handle:'Follow '+first):'Link coming soon')];
    return u?h('a',{class:'rt-soc rv',href:u,target:'_blank',rel:'noopener'},kids):h('div',{class:'rt-soc rv off'},kids); };
  const follow=h('section',{class:'rt-sec gray',id:'r-follow'},h('div',{class:'rt-wrap'},
    head('Follow along','New listings, open houses and local market updates','Follow '+first+' for homes as they hit the market, open house times and quick tips for buyers and sellers.'),
    h('div',{class:'rt-socs'},tile('fb','Facebook',F.facebook,F.facebookName),tile('ig','Instagram',F.instagram,F.instagramName),tile('tt','TikTok',F.tiktok,F.tiktokName))));

  /* ---------- contact ---------- */
  const fName=inp('text','First Name *',true,{autocomplete:'given-name'}), lName=inp('text','Last Name',false,{autocomplete:'family-name'}), fMail=inp('email','Email',false,{autocomplete:'email'}), fPhone=inp('tel','Phone *',true,{autocomplete:'tel'}), fMsg=h('textarea',{rows:'4',placeholder:'Message'});
  const cErr=h('p',{class:'rt-err',role:'alert'});
  const form=h('form',{class:'rt-form',onsubmit:e=>{ e.preventDefault(); if(!consentOk(form)){ cErr.textContent='Please check the consent box to send.'; return; } cErr.textContent=''; send('Website message from '+(fName.value||'a visitor'),[fMsg.value,'',[fName.value,lName.value].join(' ').trim(),fPhone.value,fMail.value]); }},
    h('div',{class:'rt-f2'},fName,lName),h('div',{class:'rt-f2'},fMail,fPhone),fMsg,consent(),cErr,h('button',{type:'submit',class:'rt-btn dark'},'Send'));
  const contact=h('section',{class:'rt-sec',id:'r-contact'},h('div',{class:'rt-wrap rt-contact'},
    h('div',{class:'rv'},h('span',{class:'rt-kick'},'Contact'),h('h2',null,'Your '+(S(C.x.areaName)||'local')+' REALTOR® for buying and selling'),
      h('ul',{class:'rt-cl'},
        C.tel?h('li',null,h('small',null,'Call or text'),h('a',{href:C.tel},C.phoneTxt)):null,
        C.email?h('li',null,h('small',null,'Email'),h('a',{href:mail('')},C.email)):null,
        (C.addr||C.city)?h('li',null,h('small',null,'Office'),h('a',{href:C.maps,target:'_blank',rel:'noopener'},[firm,C.addr,C.city].filter(Boolean).join(', '))):null)),
    h('div',{class:'rv'},h('h2',null,'Connect with '+first),h('p',{class:'rt-cp'},'Questions about buying, selling or what your home is worth? Send a message and '+first+' will get back to you.'),form)));

  /* ---------- consultation booking form (ends the buyer and seller pages, and About) ---------- */
  const consult=(id,topic)=>{ const n=inp('text','Your name *',true,{autocomplete:'name'}), ph=inp('tel','Phone *',true,{autocomplete:'tel'}), em=inp('email','Email',false,{autocomplete:'email'});
    const tp=sel(['Buying a home','Selling a home','Buying and selling','What is my home worth?','Something else']); if(topic) tp.value=topic;
    const dt=inp('date','',false); const tm=sel(['Any time','Morning','Afternoon','Evening']); const how=sel(['In person','Phone call','Video call']); const msg=h('textarea',{rows:'3',placeholder:'Anything '+first+' should know?'});
    const ok=h('p',{class:'rt-done-line',hidden:true},'Thanks! Your request is ready to send, and '+first+' will confirm a time with you.');
    const f=h('form',{class:'rt-consult-f',novalidate:true,onsubmit:e=>{ e.preventDefault(); if(!n.value.trim()||!ph.value.trim()){ ok.hidden=false; ok.textContent='Please add your name and phone number.'; return; } if(!consentOk(f)){ ok.hidden=false; ok.textContent='Please check the consent box to send.'; return; } send('Consultation request from '+n.value,['I would like to schedule a consultation.','Topic: '+tp.value,'Preferred day: '+(dt.value||'Flexible')+', '+tm.value,'Meet by: '+how.value,msg.value?'Notes: '+msg.value:'','',n.value,ph.value,em.value]); ok.hidden=false; ok.textContent='Thanks! Your request is ready to send, and '+first+' will confirm a time with you.'; }},
      h('div',{class:'rt-fg'},field('Name',n),field('Phone',ph),field('Email',em,true),field('What can '+first+' help with?',tp,true),field('Preferred day',dt),field('Time of day',tm),field('Meet by',how,true),field('Notes',msg,true)),
      consent(),h('button',{type:'submit',class:'rt-btn gold'},'Request My Consultation'),ok);
    return h('section',{class:'rt-sec navy',id},h('div',{class:'rt-wrap rt-consult'},
      h('div',{class:'rv'},h('span',{class:'rt-kick'},'Free consultation'),h('h2',null,'Schedule a consultation with '+first),
        h('p',{class:'rt-cp'},'Pick a day and time that works for you. No pressure, just clear answers about your next move.'),
        h('ul',{class:'rt-checks'},['30 minutes, in person or by phone','A plan for your timeline and budget','Free, with no obligation'].map(t=>h('li',null,t)))),
      h('div',{class:'rt-tool rv'},f))); };

  /* ---------- home: quick home value form ---------- */
  const qa=inp('text','Property address *',true,{autocomplete:'street-address'}), qn=inp('text','Name *',true,{autocomplete:'name'}), qe=inp('email','Email',false,{autocomplete:'email'}), qp=inp('tel','Phone *',true,{autocomplete:'tel'});
  const qok=h('p',{class:'rt-done-line',hidden:true});
  const homeValue=h('section',{class:'rt-sec rt-hv',id:'r-value'},h('div',{class:'rt-wrap rt-hv-in'},
    h('div',{class:'rv'},h('span',{class:'rt-kick'},'Home valuation'),h('h2',null,'What’s my home worth?'),
      h('p',{class:'rt-cp'},first+' will compare your home with recent sales nearby and send you a free, no-obligation estimate.'),
      h('ul',{class:'rt-checks'},['Based on real local sales','Tips to sell for more','Expert advice, not a robot number'].map(t=>h('li',null,t)))),
    h('form',{class:'rt-tool rt-hv-f rv',novalidate:true,onsubmit:e=>{ e.preventDefault(); if(!qa.value.trim()||!qn.value.trim()||!qp.value.trim()){ qok.hidden=false; qok.textContent='Please add the address, your name and phone.'; return; } if(!consentOk(e.target)){ qok.hidden=false; qok.textContent='Please check the consent box to send.'; return; } send('Home value request: '+qa.value,['Please send me a free estimate of what my home is worth.','Address: '+qa.value,'',qn.value,qp.value,qe.value]); qok.hidden=false; qok.textContent='Thanks! '+first+' will get back to you with your estimate.'; }},
      h('div',{class:'rt-sp-top'},h('b',null,'Get your free home valuation')),field('Address',qa,true),h('div',{class:'rt-fg'},field('Name',qn),field('Phone',qp),field('Email',qe,true)),consent(),h('button',{type:'submit',class:'rt-btn gold'},'Get My Home Value'),qok)));

  /* ---------- home: featured listings (live MLS listings once IDX is connected) ---------- */
  const LST=A('listings').filter(l=>l&&S(l.a)&&okUrl(l.p)).slice(0,6);
  const featured=h('section',{class:'rt-sec gray',id:'r-featured'},h('div',{class:'rt-wrap'},
    head('Featured listings','Homes for sale in the '+areaTxt+' area'),
    h('div',{class:'rt-ftabs',role:'tablist'},['For Sale','Sold'].map((t,i)=>{ const b=h('button',{type:'button',role:'tab',class:i?'':'on','aria-selected':i?'false':'true'},t); b.onclick=()=>{ b.parentNode.querySelectorAll('button').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-selected',x===b?'true':'false');}); }; return b; }),h('a',{class:'rt-viewall',href:'#search'},'View All')),
    LST.length?h('div',{class:'rt-lgrid'},LST.map(l=>h('a',{class:'rt-lcard rv',href:okUrl(l.u)||site||'#search',target:okUrl(l.u)||site?'_blank':null,rel:'noopener'},h('div',{class:'rt-lph'},h('img',{src:okUrl(l.p),alt:S(l.a),loading:'lazy'}),h('span',null,S(l.s)||'For Sale')),h('div',{class:'rt-lb'},h('b',null,S(l.price)),h('span',null,S(l.a)),S(l.d)?h('small',null,S(l.d)):null))))
      :h('div',{class:'rt-lempty rv'},h('div',null,h('b',null,'Live MLS listings'),h('p',null,'New listings, price changes and open houses from the MLS show here automatically once the IDX feed is connected.')),
        h('div',{class:'rt-row'},h('a',{class:'rt-btn dark',href:'#search'},'Search All Homes'),site?btn('outline',site,'Browse All Listings',true):null))));

  /* ---------- search page: filters, map, saved search alerts ---------- */
  const sQ=inp('search','City, ZIP, address or MLS #',false), sMin=sel(['No min','$100,000','$150,000','$200,000','$250,000','$300,000','$400,000','$500,000','$750,000']), sMax=sel(['No max','$150,000','$200,000','$250,000','$300,000','$400,000','$500,000','$750,000','$1,000,000+']);
  const sBeds=sel(['Any','1+','2+','3+','4+','5+']), sBaths=sel(['Any','1+','2+','3+','4+']), sType=sel(['Any type','House','Condo / Townhome','Multi-family','Land / Acreage','Farm']), sAcre=sel(['Any','1/4+ acre','1+ acre','5+ acres','10+ acres','40+ acres']);
  const filters=()=>['Where: '+(sQ.value||'Anywhere'),'Price: '+sMin.value+' to '+sMax.value,'Beds: '+sBeds.value+'  Baths: '+sBaths.value,'Type: '+sType.value,'Acreage: '+sAcre.value];
  const aN=inp('text','Name *',true), aE=inp('email','Email *',true), aF=sel(['Instantly','Daily','Weekly']); const aOk=h('p',{class:'rt-done-line',hidden:true});
  const mapQ=encodeURIComponent((S(C.x.areaName)||C.city||'Dubuque, IA').replace(/-area$/i,'')+' Iowa');
  const searchPage=h('section',{class:'rt-sec',id:'r-findhomes'},h('div',{class:'rt-wrap'},
    h('div',{class:'rt-srch'},
      h('form',{class:'rt-tool rt-sfilters',onsubmit:e=>{ e.preventDefault(); if(site) window.open(site,'_blank','noopener'); }},
        h('div',{class:'rt-sp-top'},h('b',null,'Filter homes')),field('Location',sQ,true),
        h('div',{class:'rt-fg'},field('Min price',sMin),field('Max price',sMax),field('Beds',sBeds),field('Baths',sBaths),field('Property type',sType,true),field('Acreage / land',sAcre,true)),
        h('button',{type:'submit',class:'rt-btn gold'},'Show Matching Homes'),
),
      h('div',{class:'rt-smap'},h('iframe',{src:'https://www.google.com/maps?q='+mapQ+'&z=11&output=embed',title:'Map of the search area',loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'}))),
    h('div',{class:'rt-alert rv'},h('div',null,h('span',{class:'rt-kick'},'Saved search'),h('h3',null,'Get new listings before anyone else'),h('p',null,'Save this search and '+first+' will send you new homes that match, price drops and open houses.')),
      h('form',{class:'rt-alert-f',novalidate:true,onsubmit:e=>{ e.preventDefault(); if(!aN.value.trim()||!aE.value.trim()){ aOk.hidden=false; aOk.textContent='Please add your name and email.'; return; } send('Saved search and listing alerts for '+aN.value,['Please send me listing alerts ('+aF.value.toLowerCase()+') for this search:'].concat(filters(),['',aN.value,aE.value])); aOk.hidden=false; aOk.textContent='Saved! You will start getting matching homes by email.'; }},
        h('div',{class:'rt-fg'},field('Name',aN),field('Email',aE),field('How often',aF,true)),h('button',{type:'submit',class:'rt-btn dark'},'Save Search & Get Alerts'),h('p',{class:'rt-unsub dark'},'Unsubscribe at any time. ',h('a',{href:'#privacy'},'View our Privacy Policy'),'.'),aOk))));

  /* ---------- legal pages ---------- */
  const legalPage=(title,secs)=>h('section',{class:'rt-sec'},h('div',{class:'rt-wrap rt-legalpg'},h('p',{class:'rt-legal-upd'},'Last updated: '+new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'})),
    secs.map(([hd,...ps])=>[hd?h('h2',null,hd):null,ps.map(t=>Array.isArray(t)?h('ul',null,t.map(x=>h('li',null,x))):h('p',null,t))])));
  const today=new Date().getFullYear();
  const who=person+', REALTOR®, with '+firm;
  const where=firm+', '+[offAddr,office].filter(Boolean).join(', ');
  const reach=[C.phoneTxt,C.email].filter(Boolean).join(' or ');
  const privacy=legalPage('Privacy Policy',[
    [null,'This Privacy Policy explains how '+who+' ("we," "us") collects, uses and protects information when you use this website. By using the site, you agree to this policy.'],
    ['Information we collect','When you fill out a form on this site (home valuation, consultation, home search, property alerts or contact), we collect the information you enter, such as:',['Your name, email address and phone number','Property details, such as an address you want valued','Your home search preferences, timeline and any notes you send'],'We may also collect basic technical information automatically, such as browser type, pages visited and general location, through cookies and similar tools.'],
    ['How we use your information',['To respond to your inquiry and provide the real estate services you request','To send home valuations, listing alerts, market updates and other information you ask for','To schedule and confirm consultations and showings','To improve this website and our services','To comply with legal, licensing and brokerage requirements']],
    ['Calls and text messages','If you check the consent box on a form, you agree to receive calls and text messages from '+person+' with '+firm+' about your real estate inquiry, which may include automated messages. Consent is not a condition of buying or selling property. Msg & data rates may apply. Reply STOP to opt out at any time, or HELP for help.'],
    ['Email','You can unsubscribe from marketing emails at any time by using the unsubscribe link in any email or by contacting us. We will honor your request promptly.'],
    ['How we share information','We do not sell your personal information. We may share it only:',['With '+firm+' and its affiliated Keller Williams Realty systems used to manage client relationships and transactions','With service providers who help us operate this site or send messages, who may use it only for that purpose','With other parties to your transaction (for example, a lender, title company or inspector) when you ask us to','When required by law, regulation or a valid legal request']],
    ['Third-party services','This site may use third-party tools such as maps, listing (IDX) data providers and analytics. Those providers have their own privacy policies, and we are not responsible for their practices.'],
    ['Cookies','We may use cookies to remember your preferences and understand how visitors use the site. You can turn off cookies in your browser settings, though some features may not work as intended.'],
    ['Data security','We use reasonable safeguards to protect your information, but no method of transmission over the internet is completely secure.'],
    ['Children','This site is not intended for children under 13, and we do not knowingly collect information from them.'],
    ['Your choices','You may ask us to update or delete the information you have given us, or to stop contacting you, by reaching out at '+(reach||'the contact information below')+'.'],
    ['Changes to this policy','We may update this policy from time to time. Changes take effect when posted on this page.'],
    ['Contact',who+'. Office: '+where+'.'+(reach?' Reach us at '+reach+'.':'')]]);
  const terms=legalPage('Terms of Use',[
    [null,'These Terms of Use apply to your use of this website, operated by '+who+'. By using the site, you agree to these terms.'],
    ['Information only','Content on this site, including home value estimates, payment calculators and market information, is for general information only. It is not an appraisal and is not legal, tax, mortgage or financial advice. Estimates are not guaranteed.'],
    ['Listing information','Property listings and data are deemed reliable but not guaranteed and should be independently verified. Listings may be sold, withdrawn or changed without notice. Square footage, acreage, school and tax information should be confirmed.'],
    ['No agency relationship','Using this website, sending a form or receiving information does not create an agency or brokerage relationship. A brokerage relationship with '+firm+' begins only when you sign a written agreement as required by Iowa law.'],
    ['Brokerage','Each Office Is Independently Owned and Operated. '+person+' is licensed to practice real estate in the State of Iowa.'],
    ['Fair housing','We are committed to the letter and spirit of the federal Fair Housing Act and the Iowa Civil Rights Act. We do not discriminate on the basis of race, color, religion, sex, disability, familial status, national origin, sexual orientation, gender identity or any other protected class.'],
    ['Acceptable use','You agree not to copy, scrape or resell listing data, interfere with the site, or use it for any unlawful purpose. IDX listing data may be used only for your personal, non-commercial use.'],
    ['Third-party links','This site may link to other websites, such as listing search tools or maps. We are not responsible for the content or practices of those sites.'],
    ['Limitation of liability','To the extent allowed by law, '+person+' and '+firm+' are not liable for any loss arising from your use of this site or reliance on its content.'],
    ['Governing law','These terms are governed by the laws of the State of Iowa.'],
    ['Contact','Questions about these terms? Contact '+who+', '+where+'.']]);
  const idx=legalPage('MLS / IDX Disclaimer',[
    [null,'IDX/MLS listing data and attribution provided by the East Central Iowa Association of REALTORS® (ECIAAR). Information deemed reliable but not guaranteed.'],
    ['About this data','Listing information on this site comes from the Internet Data Exchange (IDX) program of the MLS. Listings held by brokerage firms other than '+firm+' are marked with the name of the listing brokerage.'],
    ['Personal use only','IDX information is provided exclusively for consumers’ personal, non-commercial use and may not be used for any purpose other than to identify prospective properties consumers may be interested in purchasing.'],
    ['Accuracy','All information, including square footage, lot size, school districts and taxes, should be independently verified. Data is updated regularly, but listings may change or no longer be available.'],
    ['Copyright','© '+today+' East Central Iowa Association of REALTORS®. All rights reserved.']]);

  /* ---------- footer on every page: brokerage, licensing and fair housing ---------- */
  const eho=()=>{ const d=h('span',{class:'rt-eho',role:'img','aria-label':'Equal Housing Opportunity'}); d.innerHTML='<svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M6 22L24 8l18 14"/><path d="M11 19v21h26V19"/><path d="M17 26h14M17 32h14" stroke-width="3"/></svg><small>EQUAL HOUSING<br>OPPORTUNITY</small>'; return d; };
  const col=(t,items)=>h('div',null,h('h4',null,t),h('ul',null,items.filter(Boolean)));
  const li=(href,label)=>h('li',null,h('a',{href},label));
  const foot=h('footer',{class:'rt-foot'},h('div',{class:'rt-wrap'},
    h('div',{class:'rt-foot-g'},
      h('div',{class:'rt-foot-b'},h('b',null,pTitle),h('span',{class:'rt-foot-firm'},firm),kwMark('foot')),
      col('Explore',[li('#search','Search homes'),li('#buyers','Buyer guide'),li('#sellers','Seller guide'),li('#neighborhoods','Neighborhoods'),li('#about','About & contact')]),
      col('Contact',[C.tel?h('li',null,'Direct: ',h('a',{href:C.tel},C.phoneTxt)):null,offPhone?h('li',null,'Office: ',h('a',{href:'tel:+1'+offPhone.replace(/\D/g,'').slice(-10)},offPhone)):h('li',{class:'rt-offphone','data-slot':'officePhone',hidden:true}),C.email?h('li',null,h('a',{href:mail('')},C.email)):null,h('li',null,[offAddr,office].filter(Boolean).join(', '))])),
    h('div',{class:'rt-comply'},
      h('div',{class:'rt-comply-t'},
        /* Licensing line. To add Illinois or Wisconsin later, set x.licensedStates (for example "Illinois and Wisconsin") and it appends here. */
        h('p',null,'Each Office Is Independently Owned and Operated. Licensed to practice real estate in the State of Iowa'+(licMore?' and the State of '+licMore:'')+'.'+(licNo?' Iowa license #'+licNo+'.':'')),
        h('p',{class:'rt-idxblock',id:'r-idx-note'},idxText||'IDX/MLS listing data and attribution provided by the East Central Iowa Association of REALTORS\u00ae (ECIAAR). Information deemed reliable but not guaranteed.'),
        h('p',{class:'rt-legal-links'},'\u00a9 '+today+' All rights reserved.  ',h('a',{href:'#privacy'},'Privacy Policy'),'  \u00b7  ',h('a',{href:'#terms'},'Terms of Use'),'  \u00b7  ',h('a',{href:'#idx'},'MLS / IDX Disclaimer'))),
      h('div',{class:'rt-comply-l'},ehoLogo?h('img',{class:'rt-clogo',src:ehoLogo,alt:'Equal Housing Opportunity'}):eho(),realtorLogo?h('img',{class:'rt-clogo',src:realtorLogo,alt:'REALTOR\u00ae'}):h('span',{class:'rt-realtor',role:'img','aria-label':'REALTOR'},h('b',null,'R'),h('small',null,'REALTOR\u00ae'))))));

  /* text button that stays on screen on phones */
  const fab=sms?h('a',{class:'rt-fab',href:sms+'?&body='+encodeURIComponent('Hi '+first+', I found you on your website. ')},ico('chat',18,''),'Text '+first):null;

  /* ---------- pages ---------- */
  const pgHead=(kick,title,sub)=>h('header',{class:'rt-pghead'},h('div',{class:'rt-wrap'},h('span',{class:'rt-kick'},kick),h('h1',null,title),sub?h('p',null,sub):null,title.indexOf(person)>=0?h('p',{class:'rt-firm-line'},firm):null));
  const PG=(id,...kids)=>h('div',{class:'rt-pg','data-pg':id,hidden:true},...kids);
  /* ---------- home sections laid out like the reference site ---------- */
  const IMGS=['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1800&q=75','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1800&q=75','https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1800&q=75','https://images.unsplash.com/photo-1758448756207-54505680d130?auto=format&fit=crop&w=1800&q=75','https://images.unsplash.com/photo-1706808849777-96e0d7be3bb7?auto=format&fit=crop&w=1800&q=75','https://images.unsplash.com/photo-1761013320045-d29e4f10bcbc?auto=format&fit=crop&w=1800&q=75'];
  const G2=guides.length?guides:areas.map(n=>({n,t:''}));
  const areaPanels=G2.length?h('section',{class:'rt-apanels'},G2.slice(0,2).map((g,i)=>{ const im=h('img',{src:areaImg(g.n,IMGS[i]),alt:'',loading:'lazy'}); im.onerror=()=>{ im.src=IMGS[2]; };
    return h('div',{class:'rt-apanel'},im,h('div',{class:'rt-apanel-in rv'},h('h2',null,S(g.n)),S(g.t)?h('p',null,S(g.t)):null,h('a',{class:'rt-btn line',href:'#search',onclick:()=>{ sQ.value=S(g.n)+', IA'; }},'Search Homes in '+S(g.n)))); })):null;
  const whoBand=h('section',{class:'rt-who'},h('img',{class:'rt-who-bg',src:IMGS[3],alt:'',loading:'lazy'}),h('div',{class:'rt-wrap rt-who-in rv'},
    h('span',{class:'rt-kick'},'Who I am'),h('h2',null,'Local. Honest. On your side.'),h('p',null,String(C.about||'').split('\n').slice(-1)[0]),h('a',{class:'rt-btn solid',href:'#about'},'Meet '+first)));
  const bestHead=h('div',{class:'rt-wrap rt-best-h rv'},h('span',{class:'rt-kick'},'Simply the best'),h('h2',null,'The right home is closer than you think.'));
  const guidesHome=G2.length?h('section',{class:'rt-sec gray'},h('div',{class:'rt-wrap'},head('Neighborhoods','Our local market guides'),
    h('div',{class:'rt-mguides'},G2.slice(0,4).map((g,i)=>h('a',{class:'rt-mguide rv',href:'#neighborhoods'},h('img',{src:areaImg(g.n,IMGS[(i+2)%6]),alt:'',loading:'lazy'}),h('div',null,h('h3',null,S(g.n)),h('span',null,'Learn More',ico('arrow',13,'')))))))):null;
  const trust=h('section',{class:'rt-sec'},h('div',{class:'rt-wrap rt-bio'},photo?h('img',{class:'rt-bio-ph rv',src:photo,alt:pTitle+', '+firm}):null,
    h('div',{class:'rv'},h('span',{class:'rt-kick'},'REALTOR\u00ae'),h('h2',null,pTitle),h('p',{class:'rt-firm-line'},firm),h('p',{class:'rt-bio-t'},String(C.about||'').split('\n')[0]),
      h('ul',{class:'rt-trust'},[['Trusted agent','Clear answers and honest advice at every step.'],['Local expert','Lives in the '+areaTxt+' area and knows the neighborhoods.'],['Prompt response','Calls, texts and emails answered fast.']].map(([t,d])=>h('li',null,h('b',null,t),h('span',null,d)))),
      btn('dark',null,'Schedule a Consultation',false,go('r-consult')))));
  const alN=inp('email','Email address *',true), alOk=h('p',{class:'rt-done-line',hidden:true});
  const alerts=h('section',{class:'rt-alerts'},h('div',{class:'rt-wrap rt-alerts-in rv'},h('div',null,h('h2',null,'Sign up for property alerts & more'),h('p',null,'Get new listings, open houses and market updates from '+first+'.')),
    h('form',{class:'rt-alerts-f',novalidate:true,onsubmit:e=>{ e.preventDefault(); if(!alN.value.trim()){ alOk.hidden=false; alOk.textContent='Please add your email.'; return; } send('Property alerts sign-up',['Please send me property alerts and market updates.','',alN.value]); alOk.hidden=false; alOk.textContent='Thank you! You are on the list.'; }},alN,h('button',{type:'submit',class:'rt-btn gold'},'Submit'),h('p',{class:'rt-unsub'},'Unsubscribe at any time. ',h('a',{href:'#privacy'},'View our Privacy Policy'),'.'),alOk)));
  const workWith=h('section',{class:'rt-work'},h('div',{class:'rt-wrap rt-work-in rv'},h('span',{class:'rt-kick'},'Work with us'),h('h2',null,'Ready to make your move?'),h('p',null,'Whether you are buying, selling or just curious about the market, '+first+' is here to help.'),
    h('div',{class:'rt-row'},h('a',{class:'rt-btn gold',href:'#about'},'Contact Us'),btn('line',null,'Schedule a Consultation',false,go('r-consult')))));
  const homePg=h('div',{class:'rt-pg','data-pg':''},hero,trust,areaPanels,featured,h('section',{class:'rt-best'},bestHead,cards),guidesHome,proof,homeValue,alerts,workWith);
  const pages=[homePg,
    PG('search',pgHead('Property search','Search homes for sale','Filter by price, beds, baths, property type and acreage, then save your search to get new listings first.'),searchPage),
    PG('buyers',pgHead('Buyer guide','Buying a home in the '+areaTxt+' area','Step by step, from pre-approval to closing day.'),buy,consult('r-consult-b','Buying a home')),
    PG('sellers',pgHead('Seller guide','Selling your home in the '+areaTxt+' area','How we price, prepare and market your home, start to finish.'),sell,consult('r-consult-s','Selling a home')),
    PG('neighborhoods',pgHead('Neighborhood guides','Find your community','Lifestyle highlights for the towns '+first+' knows best. Ask for the latest market report for any area.'),areasSec,h('section',{class:'rt-sec gray'},h('div',{class:'rt-wrap rt-stats'},h('div',null,h('span',{class:'rt-kick'},'Market stats'),h('h2',null,'Want the numbers for your neighborhood?'),h('p',{class:'rt-cp'},'Median sale price, days on market and homes for sale change every month. '+first+' will send you a free, up-to-date market report for any area.')),btn('gold',null,'Request a Market Report',false,()=>send('Market report request',['Hi '+first+', please send me the latest market report for my area.','Area: ','']))))),
    PG('about',pgHead('About & contact','Meet '+person),about,factsRow?factsRow.cloneNode(true):null,follow,contact,consult('r-consult','')),
    PG('privacy',pgHead('Legal','Privacy Policy'),privacy),PG('terms',pgHead('Legal','Terms of Use'),terms),PG('idx',pgHead('Legal','MLS / IDX Disclaimer'),idx)];
  const page=h('div',{class:'rt lux'},nav,h('main',{class:'rt-main'},pages),foot,fab);
  const route=()=>{ const cur=curPage(); pages.forEach(p=>p.hidden=p.dataset.pg!==cur); nav.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('on',(a.dataset.nav==='home'?'':a.dataset.nav)===cur));
    if(pendingScroll){ const id=pendingScroll; pendingScroll=''; requestAnimationFrame(()=>scrollTo(id)); } else window.scrollTo(0,0);
    page.querySelectorAll('.rt-pg:not([hidden]) .rv').forEach(e=>e.classList.add('rv-on')); };
  addEventListener('hashchange',route); setTimeout(route,0);
  const onScroll=()=>{ if(!nav.isConnected){ removeEventListener('scroll',onScroll); return; } if(fab) fab.classList.toggle('on',scrollY>400); };
  addEventListener('scroll',onScroll,{passive:true});
  return page;
}
/* ===================== MARKETING PLAN (Riverbend offer for a demo's business) ===================== */
/* Website plans: keep in step with the Pricing section of index.html */
const MK_WEB=[
  {id:'web1',name:'Starter',price:109,per:'mo',label:'per month, $0 down (12-month agreement). Or $499 upfront + $50/mo, save $209',what:'Everything you need to get your business online. 100% custom, no per-page pricing. $0 down at $109 a month with a 12-month agreement, or $499 upfront then $50 a month, month-to-month.',more:["Fully custom website, pages based on your business needs","Mobile-friendly design, hosting and SSL","SEO foundation and Google Business Profile setup","Website security and maintenance","1 website update per month, done within 3 business days","Standard email support"],idea:()=>''},
  {id:'web2',name:'Custom (most popular)',price:179,per:'mo',label:'per month, $0 down (12-month agreement). Or $999 upfront + $75/mo, save $249',what:'Built for businesses ready to grow. $0 down at $179 a month with a 12-month agreement, or $999 upfront then $75 a month, month-to-month.',more:["Everything in Starter","3 website updates per month, done within 2 business days","Priority business-hours support","Ongoing SEO and local search optimization","Google Business Profile assistance","Analytics and a quarterly performance review","Select new features: forms, galleries, booking, menus and integrations"],idea:()=>''},
  {id:'web3',name:'Premium (24/7 support)',price:349,per:'mo',label:'per month, $0 down (12-month agreement). Or $2,499 upfront + $100/mo, save $489',what:'Our highest level of service, with 24/7 support availability from a real local person. $0 down at $349 a month with a 12-month agreement, or $2,499 upfront then $100 a month, month-to-month.',more:["Everything in Custom","Unlimited website updates, routine ones within 1 business day","24/7 support availability: critical emergencies get priority attention around the clock","Major redesigns, custom features and new functionality, planned with you","Advanced ongoing SEO management","Monthly performance reports and strategy consultation","Dedicated account contact"],idea:()=>''}
];
const MK_SOCIAL=[
  {id:'soc1',more:["3 posts a week, shared to both your Facebook and Instagram pages", "We write the captions and make the graphics for your specials, events and drawings", "We use photos you send us from your phone, cropped and touched up", "Posts go out on a set schedule, timed for when your customers are online", "You see and approve the month's plan before anything posts", "A short report each month: reach, new followers and your best posts"],name:'Social Starter',price:90,per:'mo',what:'We run your Facebook and Instagram: 3 posts a week in total, shared to both pages, about your food, specials and events. Plus a short monthly report.',idea:C=>C.specials[0]?'Posts every week for '+C.specials[0].title+', with photos.':''},
  {id:'soc2',more:["Everything in Social Starter", "Weekly stories for the day's special, live music and last-minute news", "2 short Reels a month, edited from video clips you send us", "We answer comments and messages for you and flag anything that needs you", "Reminder posts before events like live music and your monthly drawing"],name:'Social Growth',price:199,per:'mo',what:'The same 3 posts a week, plus weekly stories, 2 short Reels a month, and we answer comments and messages for you.',idea:C=>{ const f=pickFavs(C)[0]; return f?'A short Reel of your '+f.name+' to show people what they are missing.':''; }}
];
const MK=[
  {id:'club',more:["A sign-up form on your website, plus a QR code you can post at the bar", "We write and send your specials and event news to everyone on the list", "Text or email, whichever your customers prefer", "Opt-in only, with an easy way to unsubscribe", "A monthly count of how many people have joined"],name:'Email or text club for specials',price:25,per:'mo',what:'Guests sign up on your site, and we send your specials and events to them for you.',idea:C=>C.specials[0]?'A text to your club before '+C.specials[0].title+(C.specials[0].when?' ('+C.specials[0].when+')':'')+'.':''},
  {id:'qr',more:["Table tents designed to match your logo and colors", "The QR code opens your live website menu, so price changes never mean reprinting", "Links to your specials and your Facebook page in the same scan", "Print-ready files you can take to any printer"],name:'QR menu and table tents',price:60,per:'one-time',what:'Table tents with a QR code that opens your menu, specials and social pages.',idea:()=>''},
  {id:'order',name:'Online ordering or reservations setup',price:150,per:'one-time',label:'one-time setup fee',more:["Carry-out ordering right from your website, with orders sent to you by email or text", "Or we connect DoorDash, Grubhub and Uber Eats so they show up on your site", "Reservations or call-ahead requests instead, if that fits you better", "We set it up, test it and walk your staff through it"],what:'We connect online ordering, carry-out or reservations to your website. One-time $150 setup fee.',idea:()=>'We can connect apps like DoorDash, Grubhub and Uber Eats, so customers can order from your website.'}
];
function bbMkArt(){
  const L=[['Corned beef on wheat',{bread:'Wheat',meat:'Corned beef',cheese:'Swiss',tops:['Sauerkraut'],sauce:'Thousand Island',heat:'Toasted'}],
    ['Roast beef on a pretzel roll',{bread:'Pretzel roll',meat:'Roast beef',cheese:'Cheddar',tops:['Onion','Lettuce'],sauce:'Horseradish',heat:'Toasted'}],
    ['Chicken salad croissant',{bread:'Croissant',meat:'Chicken salad',cheese:'Provolone',tops:['Lettuce','Tomato'],sauce:'Mayo',heat:'Cold',side:'Homemade chips'}],
    ['Garden veggie on a bagel',{bread:'Bagel',meat:'Veggie',cheese:'Provolone',tops:['Lettuce','Tomato','Onion','Peppers','Pickles'],sauce:'Honey mustard',heat:'Cold',drink:'Cold brew'}]];
  const art=h('div',{class:'mp-bbart'}), cap=h('figcaption',null,''); let i=0;
  const show=()=>{ if(!art.isConnected&&i>0){ clearInterval(t); return; } const e=L[i%L.length]; art.innerHTML=bbSvg(Object.assign({side:'No side',drink:'No drink'},e[1]),'bb-stack',false); cap.textContent='Now building: '+e[0]; i++; };
  const t=setInterval(show,4600); show();
  return h('figure',{class:'mp-photo mp-bbfig'},art,cap);
}
/* Service businesses (cleaning, tree care, auto, real estate...) get service wording instead of bar/restaurant wording */
function mkIsService(C){ if(document.body.classList.contains('t-trade')) return true;
  if(['realty','zephyr','mutual','homy','shadetree','abauto','cloud'].indexOf(C.variant)>=0) return true;
  return /clean|maid|tree|lawn|landscap|auto|motor|repair|mechanic|tire|realt|real estate|stone|granite|counter|window|door|glass|wheel|truck|salon|barber|plumb|electric|roof|hvac|heating|construct|contract|paint|pest|pool|moving|storage|vape|smoke|insur|law|dental|clinic|fitness|gym/i.test((C.name||'')+' '+(C.cat||'')); }
function mkServiceItem(m,C){ const t={
  club:{name:'Email or text list for reminders and deals',what:'Customers sign up on your site, and we send your seasonal reminders, deals and news to them for you.',more:['A sign-up form on your website, plus a QR code for your counter, truck or invoices','We write and send your reminders, deals and news to everyone on the list','Text or email, whichever your customers prefer','Opt-in only, with an easy way to unsubscribe','A monthly count of how many people have joined'],idea:'A reminder text before your busy season, with a link to book or call.'},
  qr:{name:'QR signs and review cards',what:'Counter signs, cards or stickers with a QR code that opens your website, booking page or Google reviews.',more:['Designed to match your logo and colors','The QR code opens your live website, so changes never mean reprinting','One scan to leave a Google review or book a job','Print-ready files you can take to any printer'],idea:''},
  order:{name:'Online booking or quote requests setup',what:'We connect online booking, appointment requests or a quote form to your website. One-time $150 setup fee.',more:['A booking or quote request form on your website, sent to you by email or text','Or we connect the scheduling app you already use','Customers can send photos of the job with their request','We set it up, test it and walk you through it'],idea:'Customers can request an estimate or book a time right from your website, any time of day.'}}[m.id];
  if(!t) return m; return Object.assign({},m,{name:t.name,what:t.what,more:t.more,idea:()=>t.idea}); }
function marketing(C){
  const money=n=>'$'+n.toLocaleString('en-US');
  const unit=m=>m.label||(m.per==='mo'?'per month':'one-time');
  const today=new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const ovr=(k,id)=>{ const o=C.x[k]; return o&&typeof o==='object'&&typeof o[id]==='string'?o[id]:''; };
  const offer=(m,ix,kind)=>{ const ov=C.x.mkIdeas&&typeof C.x.mkIdeas==='object'?C.x.mkIdeas[m.id]:''; const idea=(typeof ov==='string'&&ov)||m.idea(C);
    return h('article',{class:'mo-item mo-'+kind},
      h('div',{class:'mo-num'},String(ix+1).padStart(2,'0')),
      h('div',{class:'mo-body'},
        h('h3',null,ovr('mkName',m.id)||m.name),
        h('p',{class:'mo-what'},ovr('mkWhat',m.id)||m.what),
        (()=>{ const om=C.x.mkMore&&typeof C.x.mkMore==='object'&&Array.isArray(C.x.mkMore[m.id])?C.x.mkMore[m.id].filter(t=>typeof t==='string'):null; const OLDP=[['Everything in Essentials, no setup fee','Everything included in Starter'],['Everything in Growth','Everything included in Custom'],['You own the site files once setup is paid','You own the site files once setup is paid upfront'],['Unlimited updates within 24 hours','3 website updates per month, priority business-hours support'],['Same-day updates','Unlimited updates and 24/7 support availability'],['2 small updates a month, handled by us','1 website update per month'],['Custom 3-page mobile-ready website','Fully custom website, no per-page pricing'],['Weekly Google posts and photo updates','Advanced ongoing SEO management'],['Quarterly design refresh','Monthly strategy consultation'],['Local SEO tune-ups and a yearly design refresh','Local SEO tune-ups']]; const fixOld=t=>{ for(const [x,y] of OLDP) if(t===x) return y; return t; }; const L=om?(/^web/.test(m.id)?om.map(fixOld):om):m.more; return (C.mkMore||m.always)&&L?h('ul',{class:'mo-more'},L.map(t=>h('li',null,t))):null; })(),
        idea?h('div',{class:'mo-ex'},h('span',null,'Example for '+C.name),h('p',null,idea)):null),
      h('div',{class:'mo-price'},h('b',null,money(m.price)),h('span',null,unit(m)))); };
  const soc=[C.fb?h('a',{href:C.fb,target:'_blank',rel:'noopener'},'Facebook'):null,C.ig?h('a',{href:C.ig,target:'_blank',rel:'noopener'},'Instagram'):null].filter(Boolean);
  const hide=(Array.isArray(C.x.mkHide)?C.x.mkHide.filter(x=>typeof x==='string'):[]).concat(C.mkHide);
  const SVC=mkIsService(C);
  const svcWeb=m=>!SVC?m:Object.assign({},m,{what:m.what.replace('For busy businesses that want','For businesses that want'),more:m.more.map(t=>t.replace('Monthly event and specials promo banner','Monthly promo banner for your deals and seasonal services').replace('Weekly specials and events banners','Weekly deals and seasonal promo banners').replace('Review requests: QR table cards and a text link','Review requests: QR cards and a text link').replace('Menu or services setup','Services and pricing setup'))});
  const svcSoc=m=>!SVC?m:Object.assign({},m,{more:m.more.map(t=>t.replace('your specials, events and drawings','your services, jobs and deals').replace("the day's special, live music and last-minute news",'jobs in progress, before-and-afters and openings in your schedule').replace('Reminder posts before events like live music and your monthly drawing','Reminder posts before your busy seasons and deals')),what:m.what.replace(/about your food, specials and events/,'about your work, services and deals')});
  const adds=MK.filter(m=>hide.indexOf(m.id)<0).map(m=>SVC?mkServiceItem(m,C):m), plans=MK_SOCIAL.filter(m=>hide.indexOf(m.id)<0).map(svcSoc);
  const webs=MK_WEB.filter(m=>hide.indexOf(m.id)<0).map(svcWeb); let sn=0; const num=()=>String(++sn).padStart(2,'0');
  /* optional recommended package, priced from the live plan list so totals stay right */
  const pickBox=()=>{ const ids=Array.isArray(C.x.mkPick)?C.x.mkPick.filter(x=>typeof x==='string'):[]; const all=MK_WEB.concat(MK_SOCIAL,MK); const items=ids.map(id=>all.find(m=>m.id===id)).filter(Boolean); if(!items.length) return null;
    const mo=items.filter(m=>m.per==='mo').reduce((a,m)=>a+m.price,0), once=items.filter(m=>m.per!=='mo').reduce((a,m)=>a+m.price,0);
    return h('div',{class:'mp-pick'},h('div',{class:'mp-pick-h'},typeof C.x.mkPickTitle==='string'&&C.x.mkPickTitle?C.x.mkPickTitle:'Recommended starting plan'),
      h('ul',null,items.map(m=>h('li',null,h('span',null,ovr('mkName',m.id)||m.name),h('b',null,money(m.price)+(m.per==='mo'?'/mo':' one-time'))))),
      h('div',{class:'mp-pick-t'},h('span',null,'Total'),h('b',null,(mo?money(mo)+'/mo':'')+(mo&&once?' + ':'')+(once?money(once)+' one-time':''))),
      typeof C.x.mkPickNote==='string'&&C.x.mkPickNote?h('p',{class:'mp-pick-n'},C.x.mkPickNote):null,
      playList().length?h('button',{type:'button',class:'mp-pick-go',onclick:()=>{ const t=document.getElementById('mk-play'); if(t) t.scrollIntoView({behavior:'smooth'}); }},'See what we will do for each package'):null); };
  /* plan-by-plan playbook: what we do, a sample month and real examples */
  const playList=()=>(Array.isArray(C.x.mkPlay)?C.x.mkPlay:[]).filter(p=>p&&typeof p.id==='string'&&typeof p.t==='string');
  const playSec=()=>{ const list=playList(); if(!list.length) return null; const all=MK_WEB.concat(MK_SOCIAL,MK); const picks=Array.isArray(C.x.mkPick)?C.x.mkPick:[];
    const L=v=>typeof v==='string'?v.split('|').map(t=>t.trim()).filter(Boolean):[];
    const col=(title,items,cls)=>items.length?h('div',{class:'mk-pc '+(cls||'')},h('h4',null,title),h('ul',null,items.map(t=>{ const m=t.match(/^([^:]{2,24}):\s*(.+)$/); return h('li',null,m&&cls==='month'?[h('b',null,m[1]),' ',m[2]]:t); }))):null;
    return h('section',{id:'mk-play'},
      h('div',{class:'mp-label'},h('span',null,num()),typeof C.x.mkPlayTitle==='string'&&C.x.mkPlayTitle?C.x.mkPlayTitle:'What we will do for you'),
      h('p',{class:'mp-sub'},typeof C.x.mkPlaySub==='string'&&C.x.mkPlaySub?C.x.mkPlaySub:'Plan by plan: what comes with each package, what a month looks like and real examples.'),
      h('div',{class:'mk-play'},list.map(p=>{ const m=all.find(x=>x.id===p.id); const price=m?money(m.price)+(m.per==='mo'?'/mo':' one-time'):'';
        return h('article',{class:'mk-pl'+(picks.indexOf(p.id)>=0?' pick':'')},
          h('div',{class:'mk-pl-h'},h('div',null,picks.indexOf(p.id)>=0?h('span',{class:'mk-tag'},'In the recommended plan'):null,h('h3',null,p.t),typeof p.w==='string'&&p.w?h('p',null,p.w):null),price?h('b',{class:'mk-pl-p'},price):null),
          h('div',{class:'mk-pl-g'},col('What we do',L(p.d),'do'),col('A sample month',L(p.m),'month'),col('Real examples',L(p.e),'ex'))); })),
      typeof C.x.mkPlayNote==='string'&&C.x.mkPlayNote?h('p',{class:'mk-play-n'},C.x.mkPlayNote):null); };
  return h('div',{class:'mp'+(/^[a-z]{3,20}$/.test(C.variant||'')?' mk-'+C.variant:'')},
    h('header',{class:'mp-bar'},h('div',{class:'mp-in'},
      h('span',{class:'mp-brand'},'Riverbend Web Co.'),
      h('a',{class:'mp-back',href:'?d='+encodeURIComponent(slug)},'View website demo'))),
    h('section',{class:'mp-cover'},h('div',{class:'mp-in'},
      h('div',{class:'mp-cover-l'},
        okUrl(C.x.mkLogo)?h('img',{class:'mp-wlogo',src:okUrl(C.x.mkLogo),alt:C.name}):null,
        typeof C.x.mkWord==='string'&&C.x.mkWord?h('div',{class:'mp-word'},C.x.mkWord):null,
        h('div',{class:'mp-eyebrow'},'Marketing proposal'),
        h('h1',null,(typeof C.x.mkTitle==='string'&&C.x.mkTitle)||'Website and local marketing for '+(C.name||'your business')),
        h('p',null,(typeof C.x.mkLead==='string'&&C.x.mkLead)||'Your own website first, then a simple monthly plan to keep '+(C.name||'your business')+' in front of local customers on Google, Facebook and Instagram.'),
        pickBox()),
      h('dl',{class:'mp-meta'},
        h('div',null,h('dt',null,'Prepared for'),h('dd',null,C.name||'')),
        h('div',null,h('dt',null,'Prepared by'),h('dd',null,'Riverbend Web Co., Dubuque')),
        h('div',null,h('dt',null,'Date'),h('dd',null,today)),
        soc.length?h('div',null,h('dt',null,'Pages we would manage'),h('dd',null,soc.map((a,i)=>[i?', ':'',a]))):null),
      C.logo?h('img',{class:'mp-logo',src:C.logo,alt:C.name}):null,
      C.variant==='bigbill'?bbMkArt():null,
      okUrl(C.x.mkPhoto)?h('figure',{class:'mp-photo'},bg(h('div',{class:'ph'}),okUrl(C.x.mkPhoto)),typeof C.x.mkCap==='string'&&C.x.mkCap?h('figcaption',null,C.x.mkCap):null):null)),
    h('main',{class:'mp-in mo'},
      playSec(),
      webs.length?h('section',null,
        h('div',{class:'mp-label'},h('span',null,num()),'Website plans'),
        h('p',{class:'mp-sub'},'Hosting, security and a real person handling updates come with every plan. Choose one.'),
        h('div',{class:'mo-list'},webs.map((m,i)=>offer(m,i,'plan')))):null,
      h('section',null,
        h('div',{class:'mp-label'},h('span',null,num()),'Social media management'),
        h('p',{class:'mp-sub'},'Monthly plans. Choose one.'),
        h('div',{class:'mo-list'},plans.map((m,i)=>offer(m,i,'plan')))),
      h('section',null,
        h('div',{class:'mp-label'},h('span',null,num()),'Add-ons'),
        h('p',{class:'mp-sub'},'Add any of these to a plan.'),
        h('div',{class:'mo-list'},adds.map((m,i)=>offer(m,i,'add')))),
      h('p',{class:'mp-fine mo-fine'},'Prices are for Riverbend Web Co. services. Marketing plans and add-ons can be added to any website plan. Every term is in the service agreement.')));
}
function mapBox(label,href,fill){
  const NS='http://www.w3.org/2000/svg', s=document.createElementNS(NS,'svg'); s.setAttribute('viewBox','0 0 320 170'); s.setAttribute('aria-hidden','true'); if(fill) s.setAttribute('preserveAspectRatio','xMidYMid slice');
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

/* ---------- Roadside membership (D&D Wrecker Roadside): public tour of the member app ---------- */
const RD_I={
 tow:['M3 6h11v9H3z','M14 9h4l3 3v3h-7','M7 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z'],
 jump:['M3 8h15v8H3z','M18 11h2v2h-2'],
 tire:['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z','M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
 key:['M15.5 3a5.5 5.5 0 1 1-4.9 8L3 18.6V21h3v-2h2v-2h2l1.4-1.4','M16.5 7.5h.01'],
 fuel:['M4 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16','M3 21h12','M4 10h10','M14 13h2a2 2 0 0 1 2 2v2a1.5 1.5 0 0 0 3 0V9l-3-3'],
 winch:['M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4z','M12 8v13','M5 13H3a9 9 0 0 0 18 0h-2','M9 11h6'],
 warn:['M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z','M12 9v4','M12 17h.01'],
 batt:['M3 7h16v10H3z','M19 10h2v4h-2','M7 10v4M11 10v4M15 10v4'],
 phone:['M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z'],
 shield:['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z','m9 12 2 2 4-4'],
 check:['M20 6 9 17l-5-5'],
 pin:['M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12z','M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
 wrench:['M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z'],
 bag:['M3 7h18v13H3z','M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2','M3 12h18'],
 gift:['M3 8h18v4H3z','M5 12v9h14v-9','M12 8v13','M12 8c-2-3-6-3-6-.5S12 8 12 8zm0 0c2-3 6-3 6-.5S12 8 12 8z'],
 tag:['M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z','M7.5 7.5h.01'],
 card:['M2 5h20v14H2z','M2 10h20'],
 home:['M3 11 12 3l9 8','M5 10v10h14V10'],
 user:['M20 21a8 8 0 0 0-16 0','M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10z'],
 star:['M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z'],
 arrow:['M5 12h14','m13 6 6 6-6 6'],
 ne:['M7 17 17 7','M8 7h9v9'],
 plus:['M12 5v14','M5 12h14'],
 bolt:['M13 2 4 14h7l-1 8 9-12h-7z'],
 crown:['M3 7l4.5 4L12 5l4.5 6L21 7l-2 12H5z']};
function rdI(k,size){ const s=document.createElementNS('http://www.w3.org/2000/svg','svg'); s.setAttribute('viewBox','0 0 24 24'); s.setAttribute('width',size||22); s.setAttribute('height',size||22); s.setAttribute('aria-hidden','true'); s.setAttribute('fill','none'); s.setAttribute('stroke','currentColor'); s.setAttribute('stroke-width','1.9'); s.setAttribute('stroke-linecap','round'); s.setAttribute('stroke-linejoin','round');
  (RD_I[k]||[]).forEach(d=>{ const p=document.createElementNS('http://www.w3.org/2000/svg','path'); p.setAttribute('d',d); s.append(p); }); return s; }
function roadside(C){
  const X=C.x, dq='?d='+encodeURIComponent(new URLSearchParams(location.search).get('d')||''), join=dq+'&view=portal&screen=join', site=dq+'&view=portal&screen=login';
  const logo=/^img\/[a-z0-9._-]+$/.test(X.logo||'')?X.logo:'';
  const P=X.pics||{}, pic=(k,w)=>/^img\/[a-z0-9._-]+$/.test(P[k]||'')?P[k]:/^[0-9]{10,13}-[0-9a-f]{12}$/.test(P[k]||'')?'https://images.unsplash.com/photo-'+P[k]+'?auto=format&fit=crop&w='+(w||1400)+'&q=72':'';
  if(!document.getElementById('rdFonts')){ document.head.append(h('link',{id:'rdFonts',rel:'stylesheet',href:'https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@600;700;800&family=DM+Sans:wght@400;500;700&display=swap'})); }
  const ext=(href,txt,cls,arrow)=>h('a',/^https?:/.test(href)?{class:cls,href,target:'_blank',rel:'noopener'}:{class:cls,href},txt,arrow?rdI('ne',16):null);
  const svcs=(X.services||[]).filter(s=>Array.isArray(s)&&RD_I[s[0]]);
  const plans=(X.plans||[]).filter(p=>p&&p.name);
  const perks=(X.perks||[]).filter(p=>Array.isArray(p)&&p[0]);
  const cats=[...new Set(perks.map(p=>p[1]).filter(Boolean))];
  const faq=(X.faq||[]).filter(f=>Array.isArray(f)&&f[0]&&f[1]);
  const telOf=t=>{ const d=String(t||'').replace(/\D/g,''); return d.length>=10?'tel:+1'+d.slice(-10):''; };
  const kick=t=>h('p',{class:'rd-kick'},t);
  const tow=Math.max(...plans.map(p=>{ const m=(p.feat||[]).map(f=>f[0]).join(' ').match(/up to (\d+) miles/i); return m?+m[1]:0; }),0);

  const nav=h('header',{class:'rd-nav'},h('div',{class:'rd-haz'}),h('div',{class:'rd-w rd-nav-in'},
    h('a',{class:'rd-brand',href:'#top',onclick:e=>{e.preventDefault();scrollTo('top');}},logo?h('span',{class:'rd-logo'},h('img',{src:logo,alt:C.name+' logo'})):rdI('tow',26),h('b',null,'D&D Roadside')),
    h('nav',{class:'rd-links','aria-label':'Sections'},[['rd-svc','Services'],['rd-plans','Plans'],['rd-perks','Perks'],['rd-faq','FAQ'],['rd-req','Contact']].map(([id,t])=>h('button',{type:'button',onclick:()=>scrollTo(id)},t))),
    h('div',{class:'rd-nav-cta'},ext(site,h('span',null,rdI('user',17),'Sign in'),'rd-login'),ext(join,'Join now','rd-btn y'))));

  const hero=h('section',{class:'rd-hero',id:'top'},h('div',{class:'rd-w rd-hero-in'},
    C.tel?h('a',{class:'rd-phone rv',href:C.tel},h('i',null,rdI('phone',16)),C.phoneTxt):null,
    h('h1',{class:'rv'},'Roadside help',h('br'),'24/7 membership'),
    X.area?h('p',{class:'rd-area rv'},X.area):null,
    h('p',{class:'rd-lead rv'},'Towing, jump starts, lockouts, flat tires, fuel delivery and more from D&D Wrecker Service in '+(C.city||'Dubuque, IA')+'. Coverage starts immediately.'),
    h('div',{class:'rd-hero-b rv'},ext(join,'Become a member','rd-btn',true),h('button',{type:'button',class:'rd-btn ghost',onclick:()=>scrollTo('rd-plans')},'See plans'))),
    pic('hero')?h('div',{class:'rd-w'},h('div',{class:'rd-hero-pic rv'+(/^img\//.test(P.hero||'')?' own':'')},h('img',{src:pic('hero',2000),alt:/^img\//.test(P.hero||'')?'D&D Wrecker Service logo and tow trucks at the shop':'Tow truck loading a vehicle',loading:'eager'}))):null);

  const strip=h('section',{class:'rd-strip'},h('div',{class:'rd-w rd-strip-in'},plans.map((p,i)=>h('button',{type:'button',class:'rd-tier rv'+(i?' d'+i:''),onclick:()=>scrollTo('rd-plans')},
    h('span',{class:'rd-tier-i'},rdI(i===0?'shield':i===1?'star':'crown',34)),h('b',null,p.name),h('span',null,'$'+p.mo+' / month'))),
    h('div',{class:'rd-tier note rv d3'},h('span',{class:'rd-tier-i'},rdI('gift',34)),h('b',null,'Annual'),h('span',null,'1 month free'))));

  let cur=0, timer=null;
  const shot=h('div',{class:'rd-svc-pic rd-svc-brand'},logo?h('img',{class:'rd-svc-logo',src:logo,alt:''}):null,svcs.map((s,i)=>h('div',{class:'rd-svc-card'+(i?'':' on')},h('span',{class:'rd-svc-ic'},rdI(s[0],64)),h('b',null,s[1]),h('p',null,s[2]),C.tel?h('a',{href:C.tel,class:'rd-btn y'},rdI('phone',16),'Call '+C.phoneTxt):null)));
  const rows=svcs.map((s,i)=>h('button',{type:'button',class:'rd-row'+(i?'':' on'),onmouseenter:()=>sel(i),onfocus:()=>sel(i),onclick:()=>sel(i)},
    h('em',null,String(i+1).padStart(2,'0')),h('span',null,h('b',null,s[1]),h('small',null,s[2])),h('i',null,rdI('ne',15))));
  function sel(i){ cur=i; rows.forEach((r,j)=>r.classList.toggle('on',j===i)); [...shot.querySelectorAll('.rd-svc-card')].forEach((m,j)=>m.classList.toggle('on',j===i)); }
  const svc=h('section',{class:'rd-sec',id:'rd-svc'},h('div',{class:'rd-w'},
    h('h2',{class:'rd-big rv'},'Roadside services with towing, jump starts, lockouts and fuel delivery'),
    h('div',{class:'rd-svc-g'},h('div',{class:'rd-rows rv'},rows),h('div',{class:'rv d1'},shot))));
  const io=new IntersectionObserver(es=>es.forEach(e=>{ clearInterval(timer); if(e.isIntersecting&&!matchMedia('(prefers-reduced-motion: reduce)').matches) timer=setInterval(()=>sel((cur+1)%svcs.length),3800); }),{threshold:.3}); io.observe(svc);

  const feats=[['phone','24/7 hotline','Prefer to talk? Dispatchers are standing by day and night.'],['bolt','Coverage starts now','Sign up and you are covered immediately. Upgrade anytime.'],['tow','Free tows included','A free tow every 3 or 6 months, depending on your plan.'],['tag','Local member perks','Discounts at '+perks.length+' partner businesses around the Tri-State.']];
  const featSec=h('section',{class:'rd-feats'},h('div',{class:'rd-w rd-feats-in'},feats.map((f,i)=>h('div',{class:'rd-feat rv'+(i?' d'+i:'')},h('span',null,rdI(f[0],40)),h('b',null,f[1]),h('p',null,f[2])))));

  const band=h('section',{class:'rd-band'},pic('band')?h('img',{src:pic('band',2200),alt:'D&D Wrecker Service tow trucks at the shop',loading:'lazy'}):null,h('div',{class:'rd-w rd-band-in'},
    h('h2',{class:'rv'},'Roadside help',h('br'),'when you need it'),
    C.tel?h('a',{class:'rd-play rv',href:C.tel},h('i',null,rdI('phone',26)),h('span',null,'Call the 24/7 Roadside Hotline',h('b',null,C.phoneTxt))):null));

  const stats=[['24/7','Hotline availability'],[String(svcs.length),'Roadside services'],[tow?tow+' mi':'','Towing on Pro'],[String(perks.length),'Partner discounts']].filter(s=>s[0]);
  const about=h('section',{class:'rd-sec'},h('div',{class:'rd-w rd-about'},
    h('div',{class:'rd-about-t rv'},h('h2',null,'One membership covers the road ',h('span',null,'towing, jump starts, lockouts, flat tires, winch outs and fuel delivery'))),
    h('div',{class:'rd-stats'},stats.map((s,i)=>h('div',{class:'rd-stat rv'+(i?' d'+i:'')},h('b',null,s[0]),h('span',null,s[1]))))),
    ['jump','tire','fuel','batt'].some(k=>pic(k))&&h('div',{class:'rd-w rd-photos'},['jump','tire','fuel','batt'].filter(k=>pic(k)).map((k,i)=>h('div',{class:'rv'+(i?' d'+i:'')},h('img',{src:pic(k,700),alt:(svcs.find(s=>s[0]===k)||[,''])[1],loading:'lazy'})))));



  const F=X.fleet&&typeof X.fleet==='object'?X.fleet:null;
  const okLocal=v=>/^img\/[a-z0-9._-]+$/.test(v||'');
  const fleetSec=F?h('section',{class:'rd-sec rd-fleet'},h('div',{class:'rd-w rd-fleet-in'},
    h('div',{class:'rd-fleet-t rv'},kick(F.kick||''),h('h2',{class:'rd-h2'},F.title||''),h('p',null,F.text||''),
      h('div',{class:'rd-duty'},(F.duty||[]).map(t=>h('span',null,rdI('tow',18),t))),
      h('ul',{class:'rd-fleet-l'},(F.list||[]).map(t=>h('li',null,rdI('check',16),t))),
      F.tag?h('p',{class:'rd-fleet-tag'},F.tag):null),
    h('div',{class:'rd-tiles'},(F.tiles||[]).filter(t=>Array.isArray(t)&&okLocal(t[0])).map((t,i)=>h('figure',{class:'rv'+(i?' d'+i:'')},h('img',{src:t[0],alt:t[1]||'',loading:'lazy'})))))):null;

  let annual=false;
  const grid=h('div',{class:'rd-plans'});
  const renderPlans=()=>grid.replaceChildren(...plans.map(p=>h('article',{class:'rd-plan'+(p.rec?' rec':'')},
    h('div',{class:'rd-plan-h'},h('small',null,p.name+' plan'),p.rec?h('em',null,'Recommended'):annual?h('em',{class:'g'},'1 month free'):null),
    h('div',{class:'rd-price'},h('b',null,'$'+(annual?p.yrMo:p.mo)),h('span',null,annual?'/ mo, billed yearly':'/ month')),
    h('p',{class:'rd-tax'},annual&&p.yr?'$'+p.yr+' per year · ':'',p.sub||'',' · includes 5.5% sales tax'),
    h('ul',null,(p.feat||[]).map(f=>h('li',null,rdI('check',16),h('span',null,f[0],f[1]?h('small',null,f[1]):null)))),
    ext(join+'&plan='+encodeURIComponent(p.name),'Get started','rd-btn full',true))));
  const tg=(a,label)=>h('button',{type:'button',class:'rd-tg'+(a===annual?' on':''),'aria-pressed':String(a===annual),onclick:e=>{ annual=a; [...e.currentTarget.parentNode.children].forEach(b=>{ const on=b===e.currentTarget; b.classList.toggle('on',on); b.setAttribute('aria-pressed',String(on)); }); renderPlans(); }},label);
  renderPlans();
  const plansSec=h('section',{class:'rd-sec rd-pricing'+(pic('plansBg')?' photo':''),id:'rd-plans',style:pic('plansBg')?'--rdbg:'+cssUrl(pic('plansBg')):null},h('div',{class:'rd-w'},
    h('div',{class:'rd-price-h'},h('div',{class:'rv'},kick('Membership pricing'),h('h2',{class:'rd-h2'},'Flexible plans for roadside help and towing'),h('p',null,'Every plan auto-renews and coverage starts immediately. Pay by card or PayPal, monthly or yearly.')),
      h('div',{class:'rd-toggle rv d1',role:'group','aria-label':'Billing period'},tg(false,'Monthly'),tg(true,'Annual · 1 month free'))),
    grid));

  let cat='';
  const list=h('div',{class:'rd-perks'});
  const renderPerks=()=>list.replaceChildren(...perks.filter(p=>!cat||p[1]===cat).map(p=>{ const t=telOf(p[3]);
    return h('div',{class:'rd-perk'},h('div',{class:'rd-perk-h'},h('em',null,p[4]),h('small',null,p[1])),h('b',null,p[0]),
      p[2]?h('span',null,rdI('pin',15),p[2]):null,t?h('a',{href:t},rdI('phone',15),p[3]):null); }));
  renderPerks();
  const perkSec=h('section',{class:'rd-sec rd-perksec',id:'rd-perks'},h('div',{class:'rd-w'},
    h('div',{class:'rd-perk-top'},h('div',{class:'rv'},kick('Member perks'),h('h2',{class:'rd-h2'},'Save at '+perks.length+' local partners')),
      h('div',{class:'rd-chips rv d1',role:'group','aria-label':'Filter partners'},['All'].concat(cats).map((c,i)=>h('button',{type:'button',class:i?null:'on',onclick:e=>{ cat=i?c:''; [...e.currentTarget.parentNode.children].forEach(b=>b.classList.toggle('on',b===e.currentTarget)); renderPerks(); }},c)))),
    list));

  const refer=h('section',{class:'rd-refer'},h('div',{class:'rd-w rd-refer-in rv'},h('span',{class:'rd-refer-i'},rdI('gift',40)),
    h('div',null,h('h2',null,'Cover the whole family'),h('p',null,'Refer a family member and they get 25% off every month for as long as they stay subscribed. Every member gets a referral code, link and QR code to share.')),
    ext(join,'Join and share','rd-btn',true)));

  const purl='?d='+encodeURIComponent(new URLSearchParams(location.search).get('d')||'')+'&view=portal';
  const portalSec=h('section',{class:'rd-portal'},h('div',{class:'rd-w rd-portal-in'},
    h('div',{class:'rd-portal-t rv'},h('p',{class:'rd-kick'},'Member portal'),h('h2',{class:'rd-h2'},'Your membership, in your pocket'),
      h('p',null,'Request help in a few taps, track your driver, check your free tows and show your member pass at partner shops.'),
      h('ul',null,['Branded membership card and member pass','Coverage meters for tows, jump starts and lockouts','Step-by-step requests with live driver tracking','Perks, plans and family referrals in one place'].map(t=>h('li',null,rdI('check',16),t))),
      h('a',{class:'rd-btn y',href:purl},'Open the member portal',rdI('ne',16))),
    h('a',{class:'rd-phone-mock rv d1',href:purl,'aria-label':'Open the member portal'},h('div',{class:'rd-pm-scr'},
      h('small',null,'Good evening, Alex'),h('div',{class:'rd-pm-card'},h('span',null,'PLUS'),logo?h('img',{src:logo,alt:''}):null,h('em',null,h('i'),'Active')),
      h('div',{class:'rd-pm-tiles'},svcs.slice(0,8).map(s=>h('span',null,rdI(s[0],18)))),
      h('div',{class:'rd-pm-hot'},rdI('phone',14),'24/7 Hotline')))));
  const faqSec=faq.length?h('section',{class:'rd-sec',id:'rd-faq'},h('div',{class:'rd-w rd-faq'},
    h('div',{class:'rd-center rv'},kick('Useful information'),h('h2',{class:'rd-h2'},'Frequently asked questions')),
    h('div',{class:'rd-qs rv'},faq.map((f,i)=>{ const it=h('div',{class:'rd-q'+(i?'':' open')},h('button',{type:'button','aria-expanded':String(!i),onclick:()=>{ const o=!it.classList.contains('open'); it.classList.toggle('open',o); it.firstChild.setAttribute('aria-expanded',String(o)); }},h('span',null,f[0]),h('i',null,rdI('plus',14))),h('div',{class:'rd-a'},h('div',null,h('p',null,f[1])))); return it; })))):null;

  const req=h('section',{class:'rd-req',id:'rd-req'},h('div',{class:'rd-req-l'},h('div',{class:'rd-req-in rv'},
    h('h2',{class:'rd-h2'},'Request roadside help online'),
    h('ol',{class:'rd-steps'},[['Pick the service','Towing, jump start, flat tire, lockout, fuel, winch out, accident or new battery.'],['Share your location','Type an address or landmark, or use your current location.'],['Choose priority and time','Standard or urgent, ASAP or scheduled for later.']].map((s,i)=>h('li',null,h('em',null,String(i+1)),h('span',null,h('b',null,s[0]),h('small',null,s[1]))))),
    h('div',{class:'rd-hero-b'},ext(join,'Become a member','rd-btn y full',true),C.tel?h('a',{class:'rd-btn full',href:C.tel},'Call '+C.phoneTxt):null),
    h('p',{class:'rd-small'},'Online requests are for members in the D&D app. Anyone can call the hotline.'))),
    pic('req')?h('div',{class:'rd-req-p',style:'--rdbg:'+cssUrl(pic('req',1400))},h('img',{src:pic('req',1400),alt:'D&D Wrecker Service logo',loading:'lazy'})):null);

  const foot=h('footer',{class:'rd-foot'},h('div',{class:'rd-haz'}),h('div',{class:'rd-w'},
    h('div',{class:'rd-foot-top'},C.tel?h('a',{class:'rd-foot-ph',href:C.tel},h('i',null,rdI('phone',26)),C.phoneTxt):null,h('div',{class:'rd-foot-locs'},(Array.isArray(X.locs)&&X.locs.length?X.locs:[[C.city||'Dubuque, IA',C.phoneTxt]]).map(l=>h('div',{class:'rd-foot-ad'},h('small',null,rdI('pin',14),String(l[0]||'')),telOf(l[1])?h('a',{href:telOf(l[1])},String(l[1])):null)))),
    h('div',{class:'rd-foot-g'},
      h('div',null,h('a',{class:'rd-brand',href:'#top'},logo?h('span',{class:'rd-logo'},h('img',{src:logo,alt:''})):null,h('b',null,'D&D Roadside')),h('p',null,'Roadside membership from D&D Wrecker Service, serving Iowa, Illinois and Wisconsin. Help is one call or one tap away.')),
      h('div',null,h('h4',null,'Explore'),h('ul',null,[['rd-svc','Services'],['rd-plans','Plans'],['rd-perks','Perks'],['rd-faq','FAQ']].map(([id,t])=>h('li',null,h('button',{type:'button',onclick:()=>scrollTo(id)},t))))),
      h('div',null,h('h4',null,'Members'),h('ul',null,h('li',null,ext(join,'Create an account')),h('li',null,ext(site,'Sign in')),h('li',null,ext('https://ddroadside.com/','ddroadside.com')))),
      h('div',null,h('h4',null,'Contact'),h('ul',null,(Array.isArray(X.locs)?X.locs:[]).map(l=>telOf(l[1])?h('li',null,h('a',{href:telOf(l[1])},l[0]+': '+l[1])):null),h('li',null,h('span',null,'24/7 Roadside Hotline')),X.area?h('li',null,h('span',null,X.area)):null))),
    h('div',{class:'rd-foot-b'},h('span',null,'© '+new Date().getFullYear()+' D&D Wrecker Roadside'),h('span',null,C.city||''))));

  const mbar=h('div',{class:'rd-mbar'},C.tel?h('a',{href:C.tel,class:'rd-btn'},rdI('phone',17),'Call'):null,ext(join,'Join now','rd-btn y'));
  return h('div',{class:'rd'},nav,h('main',null,hero,strip,svc,featSec,band,about,fleetSec,plansSec,perkSec,refer,portalSec,faqSec,req),foot,mbar);
}
/* ---------- D&D member portal concept (?view=portal): sample account, nothing is sent ---------- */
Object.assign(RD_I,{bell:['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9','M10.3 21a1.94 1.94 0 0 0 3.4 0'],clock:['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z','M12 7v5l3 2'],car:['M5 17h14v-5l-2-5H7l-2 5z','M5 12h14','M7.5 17v2M16.5 17v2','M8 14.5h.01M16 14.5h.01'],map:['M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z','M9 4v14M15 6v14'],qr:['M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z','M14 14h2v2h-2zM18 14h2M14 18h2M18 18h2v2'],copy:['M9 9h11v11H9z','M5 15H4V4h11v1'],back:['M15 18l-6-6 6-6'],route:['M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z','M6 15V9a4 4 0 0 1 4-4h4M18 9v6a4 4 0 0 1-4 4h-4']});
function rdPortal(C){
  const X=C.x, dq='?d='+encodeURIComponent(new URLSearchParams(location.search).get('d')||''), join=dq+'&view=portal&screen=join';
  const logo=/^img\/[a-z0-9._-]+$/.test(X.logo||'')?X.logo:'';
  const svcs=(X.services||[]).filter(s=>Array.isArray(s)&&RD_I[s[0]]);
  const plans=(X.plans||[]).filter(p=>p&&p.name);
  const perks=(X.perks||[]).filter(p=>Array.isArray(p)&&p[0]);
  const plus=plans.find(p=>p.name===new URLSearchParams(location.search).get('plan'))||plans.find(p=>p.name==='Plus')||plans[0]||{name:'Plus'};
  const tone={tow:'#FF5A6E',jump:'#FFC53D',tire:'#FF8A3D',key:'#A78BFA',fuel:'#34D399',winch:'#38BDF8',warn:'#F87171',batt:'#4ADE80'};
  if(!document.getElementById('rdFonts')) document.head.append(h('link',{id:'rdFonts',rel:'stylesheet',href:'https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@600;700;800&family=DM+Sans:wght@400;500;700&display=swap'}));


  const qs=new URLSearchParams(location.search), screen=qs.get('screen');
  if(screen==='join'||screen==='login'){
    let mode=screen, annual=false, pick=(plans.find(p=>p.name===qs.get('plan'))||plus).name;
    const box=h('div',{class:'pt-auth-card'});
    const toast=h('div',{class:'pt-toast',role:'status'});
    const enter=msg=>{ toast.textContent=msg; toast.classList.add('on'); setTimeout(()=>{ history.replaceState(null,'',dq+'&view=portal'+(mode==='join'?'&plan='+encodeURIComponent(pick):'')); root.replaceChildren(rdPortal(C)); },1100); };
    const draw=()=>{ const join2=mode==='join';
      const tabs2=h('div',{class:'pt-seg'},[['login','Log in'],['join','Sign up']].map(([k,t])=>h('button',{type:'button',class:mode===k?'on':'',onclick:()=>{ mode=k; draw(); }},t)));
      const planPick=join2?h('div',{class:'pt-ppick'},h('div',{class:'pt-ppick-h'},h('b',null,'Choose your plan'),h('div',{class:'pt-seg sm'},[[false,'Monthly'],[true,'Annual']].map(([a,t])=>h('button',{type:'button',class:annual===a?'on':'',onclick:()=>{ annual=a; draw(); }},t)))),
        h('div',{class:'pt-pgrid'},plans.map(p=>h('button',{type:'button',class:'pt-popt'+(pick===p.name?' on':''),onclick:()=>{ pick=p.name; draw(); }},p.rec?h('em',null,'Popular'):null,h('b',null,p.name),h('span',null,'$'+(annual?p.yrMo:p.mo)),h('small',null,annual?'/mo, billed yearly':'/month')))),
        annual?h('p',{class:'pt-small'},'Annual plans include 1 month free.'):null):null;
      const fld=(lbl,type,ph,ac)=>h('label',{class:'pt-lbl'},lbl,h('div',{class:'pt-inp'},rdI(type==='email'?'user':'key',18),h('input',{type,placeholder:ph,autocomplete:ac,required:true})));
      const form=h('form',{class:'pt-aform',novalidate:true,onsubmit:e=>{ e.preventDefault(); enter(join2?'Demo account created. Welcome to D&D Roadside!':'Signed in to the demo portal.'); }},
        h('button',{type:'button',class:'pt-google',onclick:()=>enter('Signed in to the demo portal.')},h('b',null,'G'),'Continue with Google'),h('div',{class:'pt-or'},h('span',null,'or')),
        fld('Email','email','you@example.com','off'),fld('Password','password',join2?'Create a password':'Your password','new-password'),join2?fld('Confirm password','password','Repeat your password','new-password'):null,
        planPick,h('button',{type:'submit',class:'pt-cta'},join2?'Create account':'Log in',rdI('arrow',18)),
        h('p',{class:'pt-small'},'Demo only: nothing you type is saved or sent.'),
        h('p',{class:'pt-switch'},join2?'Already a member? ':'New to D&D Roadside? ',h('button',{type:'button',onclick:()=>{ mode=join2?'login':'join'; draw(); }},join2?'Log in':'Create an account')));
      box.replaceChildren(h('h1',null,join2?'Become a member':'Welcome back'),h('p',{class:'pt-sub'},join2?'Roadside help 24/7. Coverage starts immediately.':'Log in to request help and manage your membership.'),tabs2,form); };
    draw();
    const hero=/^img\//.test((X.pics||{}).hero||'')?X.pics.hero:'';
    return h('div',{class:'pt pt-authp'},h('div',{class:'pt-ribbon'},h('span',null,'Member portal concept for D&D Wrecker Roadside · demo sign-in'),h('a',{href:dq},'Back to website')),
      h('div',{class:'pt-auth'},h('div',{class:'pt-auth-art',style:hero?'--rdbg:'+cssUrl(hero):null},h('div',{class:'pt-auth-art-in'},logo?h('img',{src:logo,alt:'D&D Wrecker Service'}):null,h('h2',null,'Roadside help,',h('br'),'one tap away'),
          h('ul',null,['Request towing, jump starts and more in seconds','Track your driver live','Free tows and member perks included'].map(t=>h('li',null,rdI('check',16),t))),
          C.tel?h('a',{href:C.tel,class:'pt-auth-call'},rdI('phone',16),'24/7 Hotline '+C.phoneTxt):null)),h('div',{class:'pt-auth-r'},box)),toast);
  }

  const hr=new Date().getHours(), greet=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening';
  const renew=new Date(Date.now()+200*864e5).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const view=h('div',{class:'pt-view'});
  const tabs=[['home','home','Home'],['request','plus','Request'],['history','clock','History'],['perks','tag','Perks'],['plans','card','Plans'],['refer','gift','Refer'],['profile','user','Profile']];
  const navBtns={};
  const mkNav=cls=>h('nav',{class:cls,'aria-label':'Portal'},tabs.map(([k,ic,t])=>{ const b=h('button',{type:'button','data-k':k,onclick:()=>go(k)},rdI(ic,20),h('span',null,t)); (navBtns[k]=navBtns[k]||[]).push(b); return b; }));
  const side=h('aside',{class:'pt-side'},h('div',{class:'pt-brand'},logo?h('img',{src:logo,alt:'D&D Wrecker Service'}):null,h('div',null,h('b',null,'D&D Roadside'),h('small',null,'Member portal'))),mkNav('pt-snav'),
    h('a',{class:'pt-side-call',href:C.tel||'#'},h('i',null,rdI('phone',18)),h('span',null,h('small',null,'24/7 Hotline'),h('b',null,C.phoneTxt||''))));
  const tabbar=mkNav('pt-tabs');
  function go(k,arg){ Object.values(navBtns).flat().forEach(b=>b.classList.toggle('on',b.dataset.k===k)); view.replaceChildren(PAGES[k](arg)); view.scrollTop=0; window.scrollTo({top:0,left:0,behavior:'instant'}); view.animate&&view.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:350,easing:'ease-out'}); }
  const head=(t,sub)=>h('div',{class:'pt-head'},h('div',null,sub?h('small',null,sub):null,h('h1',null,t)),h('div',{class:'pt-head-r'},h('button',{type:'button',class:'pt-icbtn','aria-label':'Notifications'},rdI('bell',20),h('i')),h('span',{class:'pt-av'},'AS')));

  // membership card with tilt and flip
  function card(){
    const inner=h('div',{class:'pt-card-in'},
      h('div',{class:'pt-card-f'},h('div',{class:'pt-card-top'},h('div',null,h('small',null,'MEMBERSHIP'),h('b',null,plus.name.toUpperCase())),logo?h('img',{src:logo,alt:''}):null),
        h('div',{class:'pt-chip'}),
        h('div',{class:'pt-card-bot'},h('div',null,h('small',null,'MEMBER'),h('b',null,'Alex Sample'),h('em',null,'Renews '+renew)),h('div',{class:'pt-st'},h('small',null,'STATUS'),h('b',null,h('i'),'Active'))),
        h('span',{class:'pt-flip-hint'},rdI('qr',14),'Tap for member pass')),
      h('div',{class:'pt-card-b'},h('div',{class:'pt-qr'},qr()),h('div',null,h('small',null,'MEMBER PASS'),h('b',null,'Show at partner shops'),h('p',null,'Your discount applies at all '+perks.length+' partners.'),h('em',null,'Sample pass'))));
    const el=h('div',{class:'pt-card',tabindex:'0',role:'button','aria-label':'Membership card, tap to flip',onclick:()=>{ if(matchMedia('(max-width:820px)').matches) return; el.classList.toggle('flip'); },onkeydown:e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); el.classList.toggle('flip'); } },
      onmousemove:e=>{ const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5; el.style.setProperty('--rx',(-y*10)+'deg'); el.style.setProperty('--ry',(x*14)+'deg'); el.style.setProperty('--gx',(x*100+50)+'%'); },
      onmouseleave:()=>{ el.style.setProperty('--rx','0deg'); el.style.setProperty('--ry','0deg'); }},inner);
    return el;
  }
  function qr(){ const s=document.createElementNS('http://www.w3.org/2000/svg','svg'); s.setAttribute('viewBox','0 0 25 25'); s.setAttribute('aria-hidden','true'); let seed=7; const rnd=()=>{ seed=(seed*9301+49297)%233280; return seed/233280; };
    const add=(x,y,w,hh)=>{ const r=document.createElementNS('http://www.w3.org/2000/svg','rect'); r.setAttribute('x',x); r.setAttribute('y',y); r.setAttribute('width',w); r.setAttribute('height',hh); s.append(r); };
    for(let y=0;y<25;y++) for(let x=0;x<25;x++){ const f=(x<8&&y<8)||(x>16&&y<8)||(x<8&&y>16); if(!f&&rnd()>.52) add(x,y,1,1); }
    [[0,0],[17,0],[0,17]].forEach(([a,b])=>{ add(a,b,7,1);add(a,b+6,7,1);add(a,b,1,7);add(a+6,b,1,7);add(a+2,b+2,3,3); }); return s; }
  function ring(val,max,label,sub,color){ const R=26,Cc=2*Math.PI*R,s=document.createElementNS('http://www.w3.org/2000/svg','svg'); s.setAttribute('viewBox','0 0 64 64'); s.setAttribute('aria-hidden','true');
    const c1=document.createElementNS('http://www.w3.org/2000/svg','circle'); [['cx',32],['cy',32],['r',R],['class','bg']].forEach(a=>c1.setAttribute(...a));
    const c2=c1.cloneNode(); c2.setAttribute('class','fg'); c2.style.stroke=color; c2.style.strokeDasharray=Cc; c2.style.strokeDashoffset=Cc; s.append(c1,c2);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ c2.style.strokeDashoffset=Cc*(1-val/max); }));
    return h('div',{class:'pt-ring'},h('div',{class:'pt-ring-g'},s,h('b',null,String(val),h('small',null,'/'+max))),h('div',null,h('b',null,label),h('small',null,sub))); }
  const tile=(s,i)=>h('button',{type:'button',class:'pt-tile',style:'--c:'+(tone[s[0]]||'#5B9BFF')+';animation-delay:'+(i*45)+'ms',onclick:()=>go('request',s[0])},h('span',null,rdI(s[0],26)),h('b',null,s[1]));
  const hotline=()=>h('div',{class:'pt-hot'},h('div',null,h('small',null,'24/7 ROADSIDE HOTLINE'),h('b',null,'Prefer to talk?'),h('p',null,'Dispatchers are standing by day and night.')),C.tel?h('a',{href:C.tel,class:'pt-hot-btn'},h('i',null,rdI('phone',22)),C.phoneTxt):null);
  const hist=[['jump','Jump Start','Completed','Dubuque, IA','Oct 28'],['key','Lockout','Completed','Dubuque, IA','Sep 14'],['tow','Towing','Completed','Hazel Green, WI','Aug 02']];
  const histRow=r=>h('div',{class:'pt-hrow'},h('span',{class:'pt-hic',style:'--c:'+tone[r[0]]},rdI(r[0],20)),h('div',null,h('b',null,r[1]),h('small',null,r[3]+' · '+r[4])),h('em',null,h('i'),r[2]));

  const PAGES={
    home:()=>h('div',{class:'pt-page'},head(greet+', Alex','Welcome back'),
      h('div',{class:'pt-grid'},
        h('div',{class:'pt-col'},card(),
          h('div',{class:'pt-panel'},h('div',{class:'pt-ph'},h('h2',null,'Your coverage'),h('button',{type:'button',onclick:()=>go('plans')},'Plan details')),
            h('div',{class:'pt-rings'},ring(1,1,'Free tow','Every 3 months · up to 15 mi','#5B9BFF'),ring(1,1,'Jump start','Resets monthly','#FFC53D'),ring(1,1,'Lockout','Resets monthly','#A78BFA')))),
        h('div',{class:'pt-col'},
          h('div',{class:'pt-panel'},h('div',{class:'pt-ph'},h('h2',null,'Request assistance'),h('small',null,'Tap a service')),h('div',{class:'pt-tiles'},svcs.map(tile))),
          hotline(),
          h('div',{class:'pt-panel'},h('div',{class:'pt-ph'},h('h2',null,'Recent requests'),h('button',{type:'button',onclick:()=>go('history')},'View all')),histRow(hist[0])),
          h('div',{class:'pt-panel'},h('div',{class:'pt-ph'},h('h2',null,'Member perks'),h('button',{type:'button',onclick:()=>go('perks')},'All '+perks.length)),
            h('div',{class:'pt-hscroll'},perks.slice(0,6).map(p=>h('div',{class:'pt-pmini'},h('em',null,p[4]),h('b',null,p[0]),h('small',null,p[1])))))))),
    request:pre=>{ const st={svc:pre||'',loc:'',det:'',pri:'Standard',when:'ASAP'}; let step=pre?1:0;
      const wrap=h('div',{class:'pt-page'}); const labels=['Service','Location','Priority','Review'];
      const draw=()=>{ const bar=h('div',{class:'pt-steps'},labels.map((l,i)=>h('div',{class:i<step?'done':i===step?'on':''},h('i',null,i<step?rdI('check',14):String(i+1)),h('span',null,l))));
        const sv=svcs.find(s=>s[0]===st.svc);
        const nav=(ok,label,fn)=>h('div',{class:'pt-fnav'},step?h('button',{type:'button',class:'pt-ghost',onclick:()=>{ step--; draw(); }},rdI('back',18),'Back'):null,h('button',{type:'button',class:'pt-cta',disabled:!ok,onclick:fn||(()=>{ step++; draw(); })},label||'Continue',rdI('arrow',18)));
        let body;
        if(step===0) body=[h('h2',{class:'pt-q'},'What do you need help with?'),h('div',{class:'pt-opts'},svcs.map(s=>h('button',{type:'button',class:'pt-opt'+(st.svc===s[0]?' on':''),style:'--c:'+tone[s[0]],onclick:()=>{ st.svc=s[0]; step=1; draw(); }},h('span',null,rdI(s[0],24)),h('div',null,h('b',null,s[1]),h('small',null,s[2])))))];
        else if(step===1){ const inp=h('input',{type:'text',placeholder:'Address or nearest landmark',value:st.loc,oninput:e=>{ st.loc=e.target.value; ctas.querySelector('.pt-cta').disabled=!st.loc.trim(); }});
          const ctas=nav(!!st.loc.trim());
          body=[h('div',{class:'pt-sel',style:'--c:'+tone[st.svc]},h('span',null,rdI(st.svc,22)),h('div',null,h('b',null,sv?sv[1]:''),h('button',{type:'button',onclick:()=>{ step=0; draw(); }},'Change'))),
            h('div',{class:'pt-map'},mapSvg(!!st.loc),h('span',{class:'pt-pin'+(st.loc?' drop':'')},rdI('pin',30))),
            h('label',{class:'pt-lbl'},'Your location',h('div',{class:'pt-inp'},rdI('pin',18),inp)),
            h('button',{type:'button',class:'pt-link',onclick:()=>{ st.loc='Current location (sample): US-20 near Dubuque, IA'; draw(); }},rdI('route',16),'Use my current location'),
            h('label',{class:'pt-lbl'},'Details (optional)',h('textarea',{rows:3,placeholder:'e.g. On the shoulder of US-61 southbound, flat front-right tire',oninput:e=>{ st.det=e.target.value; }},st.det)),ctas]; return paint(bar,body,true); }
        else if(step===2){ const pick=(k,v)=>{ st[k]=v; draw(); };
          body=[h('h2',{class:'pt-q'},'How urgent is it?'),h('div',{class:'pt-two'},[['Standard','Safe spot, no rush'],['Urgent','Safety risk or highway']].map(o=>h('button',{type:'button',class:'pt-big'+(st.pri===o[0]?' on':'')+(o[0]==='Urgent'?' urg':''),onclick:()=>pick('pri',o[0])},h('b',null,o[0]),h('small',null,o[1])))),
            h('h2',{class:'pt-q'},'When do you need us?'),h('div',{class:'pt-two'},[['ASAP','Dispatch now'],['Schedule','Pick a future time']].map(o=>h('button',{type:'button',class:'pt-big'+(st.when===o[0]?' on':''),onclick:()=>pick('when',o[0])},h('b',null,o[0]),h('small',null,o[1])))),
            st.when==='Schedule'?h('label',{class:'pt-lbl'},'Date and time',h('div',{class:'pt-inp'},rdI('clock',18),h('input',{type:'datetime-local'}))):null,nav(true)]; }
        else body=[h('h2',{class:'pt-q'},'Review your request'),h('div',{class:'pt-review'},[['Service',sv?sv[1]:''],['Location',st.loc],['Details',st.det||'None'],['Priority',st.pri],['When',st.when],['Covered by',plus.name+' membership']].map(r=>h('div',null,h('small',null,r[0]),h('b',null,r[1])))),
          h('p',{class:'pt-note'},'Concept demo: no truck is dispatched from this page.'),nav(true,'Request help',()=>{ wrap.replaceChildren(tracker(sv,st)); })];
        paint(bar,body); };
      const paint=(bar,body)=>{ wrap.replaceChildren(head('Request assistance','Step '+(step+1)+' of 4'),bar,h('div',{class:'pt-form'},body)); return wrap; };
      draw(); return wrap; },
    history:()=>h('div',{class:'pt-page'},head('History','Your requests'),h('div',{class:'pt-panel'},hist.map(histRow))),
    perks:()=>{ const list=h('div',{class:'pt-perks'}); const cats=['All',...new Set(perks.map(p=>p[1]))]; const show=c=>list.replaceChildren(...perks.filter(p=>c==='All'||p[1]===c).map((p,i)=>h('div',{class:'pt-perk',style:'animation-delay:'+(i*35)+'ms'},h('em',null,p[4]),h('b',null,p[0]),h('small',null,p[1]),p[2]?h('span',null,rdI('pin',14),p[2]):null,p[3]?h('a',{href:'tel:+1'+p[3].replace(/\D/g,'').slice(-10)},rdI('phone',14),p[3]):null)));
      const chips=h('div',{class:'pt-chips'},cats.map((c,i)=>h('button',{type:'button',class:i?'':'on',onclick:e=>{ [...chips.children].forEach(b=>b.classList.toggle('on',b===e.currentTarget)); show(c); }},c))); show('All');
      return h('div',{class:'pt-page'},head('Member perks',perks.length+' discounts unlocked'),h('div',{class:'pt-perk-hero'},rdI('tag',28),h('div',null,h('b',null,'Show your member pass'),h('small',null,'Flip your card on the Home tab at checkout.'))),chips,list); },
    plans:()=>h('div',{class:'pt-page'},head('Your plan','Membership'),h('div',{class:'pt-plans'},plans.map(p=>h('div',{class:'pt-plan'+(p===plus?' cur':'')},p===plus?h('em',null,'Current plan'):null,h('b',null,p.name),h('div',{class:'pt-price'},'$'+p.mo,h('small',null,'/mo')),h('ul',null,(p.feat||[]).map(f=>h('li',null,rdI('check',15),f[0]))),
      p===plus?h('span',{class:'pt-cur'},'You are on this plan'):h('a',{class:'pt-cta',href:join+'&plan='+encodeURIComponent(p.name)},plans.indexOf(p)>plans.indexOf(plus)?'Upgrade':'Switch',rdI('arrow',16)))))),
    refer:()=>h('div',{class:'pt-page'},head('Refer a friend','Share D&D'),h('div',{class:'pt-ref'},h('span',{class:'pt-ref-i'},rdI('gift',30)),h('small',null,'YOUR REFERRAL CODE'),h('b',null,'SAMPLE'),h('p',null,'Friends get covered, you earn rewards.')),
      h('div',{class:'pt-panel pt-fam'},h('div',{class:'pt-ph'},h('h2',null,'Refer a family member')),h('p',null,'They get 25% off every month for as long as they stay subscribed.'),
        h('div',{class:'pt-copy'},h('span',null,'ddroadside.com/register?ref=SAMPLE'),h('button',{type:'button',onclick:e=>{ try{ navigator.clipboard.writeText('ddroadside.com/register?ref=SAMPLE'); }catch(_){} e.currentTarget.textContent='Copied'; }},rdI('copy',15),'Copy')))),
    profile:()=>h('div',{class:'pt-page'},head('Profile','Account'),h('div',{class:'pt-panel pt-prof'},h('span',{class:'pt-av lg'},'AS'),h('div',null,h('b',null,'Alex Sample'),h('small',null,plus.name+' member · sample account'))),
      h('div',{class:'pt-panel'},h('div',{class:'pt-ph'},h('h2',null,'Vehicles')),h('div',{class:'pt-hrow'},h('span',{class:'pt-hic',style:'--c:#5B9BFF'},rdI('car',20)),h('div',null,h('b',null,'Sample vehicle'),h('small',null,'Add year, make and model')),h('em',{class:'pt-tag'},'Primary'))),
      h('div',{class:'pt-panel'},['Text me when my driver is on the way','Email receipts','Perk alerts'].map((t,i)=>h('label',{class:'pt-tog'},h('span',null,t),h('input',{type:'checkbox',checked:i<2?true:null}),h('i')))))
  };
  function mapSvg(on){ const s=document.createElementNS('http://www.w3.org/2000/svg','svg'); s.setAttribute('viewBox','0 0 400 180'); s.setAttribute('preserveAspectRatio','xMidYMid slice'); s.setAttribute('aria-hidden','true');
    ['M-10 120 C80 100 140 140 220 110 S360 60 420 80','M60 -10 L90 200','M250 -10 C240 60 270 120 260 200','M-10 40 L420 55','M150 -10 L170 200'].forEach((d,i)=>{ const p=document.createElementNS('http://www.w3.org/2000/svg','path'); p.setAttribute('d',d); p.setAttribute('class',i?'rd2':'rd1'); s.append(p); });
    const river=document.createElementNS('http://www.w3.org/2000/svg','path'); river.setAttribute('d','M330 -10 C300 50 360 110 320 200'); river.setAttribute('class','rv1'); s.prepend(river); return s; }
  function tracker(sv,st){ const steps=['Request received','Dispatcher assigned','Driver en route','Arrived'];
    const ul=h('ol',{class:'pt-tl'},steps.map((t,i)=>h('li',{class:i<2?'done':i===2?'on':''},h('i',null,i<2?rdI('check',13):''),h('span',null,t))));
    const eta=h('b',null,'18'); const truck=h('span',{class:'pt-truck'},rdI('tow',22));
    const box=h('div',{class:'pt-page'},head('Help is on the way','Request #DD-SAMPLE'),
      h('div',{class:'pt-track'},h('div',{class:'pt-tmap'},mapSvg(true),h('span',{class:'pt-pin drop'},rdI('pin',30)),truck,h('div',{class:'pt-eta'},h('small',null,'ETA'),eta,h('small',null,'min'))),
        h('div',{class:'pt-tside'},h('div',{class:'pt-sel',style:'--c:'+tone[sv?sv[0]:'tow']},h('span',null,rdI(sv?sv[0]:'tow',22)),h('div',null,h('b',null,sv?sv[1]:''),h('small',null,st.pri+' · '+st.when))),ul,
          h('div',{class:'pt-driver'},h('span',{class:'pt-av'},rdI('tow',18)),h('div',null,h('b',null,'Your D&D driver'),h('small',null,'Driver details appear here')),C.tel?h('a',{href:C.tel,'aria-label':'Call'},rdI('phone',18)):null),
          h('p',{class:'pt-note'},'Concept demo: this tracker is a simulation. No truck was dispatched.'),h('button',{type:'button',class:'pt-ghost',onclick:()=>go('home')},'Back to home'))));
    requestAnimationFrame(()=>{ const mp=box.querySelector('.pt-tmap'); if(!mp) return; const W=mp.clientWidth,H=mp.clientHeight,px=W*.72,py=H*.52-12;
      truck.style.offsetPath=`path('M 30 ${H-40} C ${W*.25} ${H*.9} ${W*.35} ${H*.55} ${W*.5} ${H*.62} S ${px-40} ${py+20} ${px-24} ${py}')`; });
    let m=18; const t=setInterval(()=>{ if(!box.isConnected){ clearInterval(t); return; } m=Math.max(1,m-1); eta.textContent=String(m); },2500);
    return box; }
  const top=h('div',{class:'pt-ribbon'},h('span',null,'Member portal concept for D&D Wrecker Roadside · sample account'),h('a',{href:'?d='+encodeURIComponent(new URLSearchParams(location.search).get('d')||'')},'Back to website'));
  const app=h('div',{class:'pt'},top,h('div',{class:'pt-shell'},side,h('main',{class:'pt-main'},view)),tabbar);
  let tc=document.querySelector('meta[name="theme-color"]'); if(!tc){ tc=h('meta',{name:'theme-color'}); document.head.append(tc); } tc.setAttribute('content','#060B16');
  go('home'); return app;
}
function rdNav(pg){ const n=pg.querySelector('.rd-nav'); const f=()=>n.classList.toggle('sc',scrollY>20); addEventListener('scroll',f,{passive:true}); f(); }

/* Rollin' contact links (from their sign: Instagram, TikTok, phone, email, hashtag) */
const RI_ICO={ig:['M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4z','M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','M17.5 6.5h.01'],tt:['M14 3v11.5a3.5 3.5 0 1 1-3-3.46','M14 3c.5 2.6 2.4 4.4 5 4.6'],ph:['M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z'],em:['M3 5h18v14H3z','m3 6 9 7 9-7'],hs:['M5 9h14M5 15h14M10 3 8 21M16 3l-2 18']};
function riIco(k){ const s=document.createElementNS('http://www.w3.org/2000/svg','svg'); s.setAttribute('viewBox','0 0 24 24'); s.setAttribute('aria-hidden','true'); s.setAttribute('fill','none'); s.setAttribute('stroke','currentColor'); s.setAttribute('stroke-width','1.9'); s.setAttribute('stroke-linecap','round'); s.setAttribute('stroke-linejoin','round'); (RI_ICO[k]||[]).forEach(d=>{ const p=document.createElementNS('http://www.w3.org/2000/svg','path'); p.setAttribute('d',d); s.append(p); }); return s; }
function riFoot(C){ const K=(C.x||{}).contact||{}; const links=[C.tel?['ph',C.tel,C.phoneTxt]:null,C.email?['em','mailto:'+C.email,'Email']:null,Array.isArray(K.instagram)?['ig',okUrl(K.instagram[1]),'Instagram']:null,Array.isArray(K.tiktok)?['tt',okUrl(K.tiktok[1]),'TikTok']:null].filter(l=>l&&l[1]);
  return h('footer',{class:'ri-foot'},h('div',{class:'ri-w ri-foot-in'},h('span',null,"© "+new Date().getFullYear()+" Rollin' Icecream"+(K.hashtag?' · '+K.hashtag:'')),h('div',{class:'ri-foot-l'},links.map(l=>h('a',Object.assign({href:l[1],'aria-label':l[2]},/^https?:/.test(l[1])?{target:'_blank',rel:'noopener'}:{}),riIco(l[0]),h('span',null,l[2])))))); }
function riContact(C,cls){ const K=(C.x||{}).contact||{}; const em=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(C.email||'')?C.email:'';
  const row=(k,label,val,href,ext)=>h('a',Object.assign({class:'ri-ct',href},ext?{target:'_blank',rel:'noopener'}:{}),h('i',null,riIco(k)),h('span',null,h('small',null,label),h('b',null,val)));
  return h('div',{class:'ri-contact '+(cls||'')},
    C.tel?row('ph','Call or text',C.phoneTxt,C.tel):null,
    em?row('em','Email',em,'mailto:'+em):null,
    Array.isArray(K.instagram)&&okUrl(K.instagram[1])?row('ig','Instagram',K.instagram[0],okUrl(K.instagram[1]),true):null,
    Array.isArray(K.tiktok)&&okUrl(K.tiktok[1])?row('tt','TikTok',K.tiktok[0],okUrl(K.tiktok[1]),true):null,
    K.hashtag?h('div',{class:'ri-ct'},h('i',null,riIco('hs')),h('span',null,h('small',null,'Tag your rolls'),h('b',null,K.hashtag))):null); }
/* ---------- Rollin' Icecream: factory-tour style (inspired by the Haagen-Dazs Factory Tour) ---------- */
function rollin(C){
  const X=C.x||{}, P=X.pics||{};
  const u=(id,w)=>/^img\/[a-z0-9._-]+$/.test(id||'')?id:/^[0-9]{10,13}-[0-9a-f]{12}$/.test(id||'')?'https://images.unsplash.com/photo-'+id+'?auto=format&fit=crop&w='+(w||900)+'&q=82':'';
  const logo=/^img\/[a-z0-9._-]+$/.test(X.logo||'')?X.logo:'';
  if(!document.getElementById('riFonts')) document.head.append(h('link',{id:'riFonts',rel:'stylesheet',href:'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,600..900,100&family=DM+Sans:wght@400;500;700&display=swap'}));
  const steps=(X.steps||[]).filter(s=>Array.isArray(s)&&s[0]);
  const why=(X.why||[]).filter(s=>Array.isArray(s)&&s[0]);
  const go=id=>scrollTo(id);
  const sprink=n=>{ const cols=['#F6A6C1','#C8B6F0','#9EE3CF','#FFE08A','#FFF1E0']; return Array.from({length:n},(_,i)=>h('i',{class:'ri-sp',style:'left:'+((i*37)%100)+'%;top:'+((i*53+11)%100)+'%;background:'+cols[i%5]+';--d:'+(6+i%5)+'s;--r:'+(i*47%180)+'deg'})); };

  const nav=h('header',{class:'ri-nav'},h('div',{class:'ri-w ri-nav-in'},
    h('a',{class:'ri-brand',href:'#top',onclick:e=>{e.preventDefault();go('top');}},logo?h('img',{src:logo,alt:"Rollin' Icecream logo"}):null,h('b',null,"Rollin' Icecream")),
    h('nav',{class:'ri-links'},[['ri-tour','The roll tour'],['ri-why','Why rolled'],['ri-gal','Fresh off the plate']].map(([id,t])=>h('button',{type:'button',onclick:()=>go(id)},t)),h('a',{href:'?d='+encodeURIComponent(new URLSearchParams(location.search).get('d')||'')+'&view=catering'},'Catering'),h('button',{type:'button',onclick:()=>go('ri-end')},'Contact')),
    h('div',{class:'ri-nav-r'},h('a',{class:'ri-btn ri-cat-btn',href:'?d='+encodeURIComponent(new URLSearchParams(location.search).get('d')||'')+'&view=catering'},'Catering'),h('button',{type:'button',class:'ri-btn ri-ct-btn',onclick:()=>go('ri-end')},'Contact'),h('button',{type:'button',class:'ri-btn',onclick:()=>go('ri-end')},'Come roll with us'))));

  // hero: logo in a spinning ring, giant outlined title, floating cups
  const ringTxt='FRESH ROLLED ICE CREAM · MADE TO ORDER · '+(C.city||'MARYLAND').toUpperCase()+' · ';
  const ring=h('div',{class:'ri-ring','aria-hidden':'true'},ringTxt.repeat(2).split('').map((ch,i,a)=>h('span',{style:'transform:rotate('+(i*360/a.length)+'deg)'},ch)));
  const floats=['hero1','hero2','hero3','hero4','hero5'].map((k,i)=>u(P[k],500)?h('div',{class:'ri-fl f'+i,'data-depth':String([.6,.35,.5,.25,.45][i])},h('img',{src:u(P[k],500),alt:'',loading:'eager'})):null);
  const hero=h('section',{class:'ri-hero',id:'top'},h('div',{class:'ri-sprinkles'},sprink(26)),
    h('h1',{class:'ri-outline','aria-label':"Rollin' Icecream"},h('span',null,"ROLLIN'"),h('span',null,'ICECREAM')),
    h('div',{class:'ri-stage'},floats,h('div',{class:'ri-center'},ring,logo?h('img',{class:'ri-logo',src:logo,alt:"Rollin' Icecream"}):null)),
    h('div',{class:'ri-hero-t'},h('p',{class:'ri-script'},'rolled right in front of you'),h('p',{class:'ri-lead'},'Sweet cream poured on an ice-cold plate, chopped, spread thin and rolled up fresh, one cup at a time.'),
      h('div',{class:'ri-hero-b'},h('button',{type:'button',class:'ri-btn lg',onclick:()=>go('ri-tour')},'Take the roll tour'),h('button',{type:'button',class:'ri-btn ghost lg',onclick:()=>go('ri-gal')},'See the rolls'))),
    h('button',{type:'button',class:'ri-scroll',onclick:()=>go('ri-tour'),'aria-label':'Scroll down'},h('i')));
  const marq=h('div',{class:'ri-marq','aria-hidden':'true'},h('div',null,Array.from({length:2},()=>h('span',null,['Rolled fresh','Made to order','Watch it happen','One cup at a time','Mix-ins in every bite'].map(t=>h('b',null,t,h('i'))))))); 

  // roll tour: sticky steps with a big circular photo
  const imgs=steps.map((s,i)=>u(P['s'+(i+1)],1400));
  const big=h('div',{class:'ri-disc'},imgs.map((src,i)=>src?h('img',{src,alt:steps[i][0],class:i?null:'on',loading:'lazy'}):h('span')),h('svg',{}));
  const prog=document.createElementNS('http://www.w3.org/2000/svg','svg'); prog.setAttribute('viewBox','0 0 100 100'); prog.setAttribute('class','ri-prog');
  const pc=document.createElementNS('http://www.w3.org/2000/svg','circle'); [['cx',50],['cy',50],['r',48]].forEach(a=>pc.setAttribute(...a)); prog.append(pc); big.lastChild.replaceWith(prog);
  const num=h('b',{class:'ri-num'},'01');
  const rows=steps.map((s,i)=>h('li',{class:'ri-step'+(i?'':' on')},h('em',null,String(i+1).padStart(2,'0')),h('div',null,h('h3',null,s[0]),h('p',null,s[1]))));
  const tour=h('section',{class:'ri-tour',id:'ri-tour',style:'--n:'+steps.length},h('div',{class:'ri-tour-pin'},h('div',{class:'ri-w ri-tour-in'},
    h('div',{class:'ri-tour-l'},h('p',{class:'ri-kick'},'The roll tour'),h('h2',{class:'ri-h2'},'From pour to cup in '+(['zero','one','two','three','four','five','six','seven','eight'][steps.length]||steps.length)+' steps'),h('ol',{class:'ri-steps'},rows)),
    h('div',{class:'ri-tour-r'},big,num))));
  let curStep=-1;
  const tourTick=()=>{ const r=tour.getBoundingClientRect(); const tot=tour.offsetHeight-innerHeight; const p=Math.min(1,Math.max(0,-r.top/Math.max(1,tot))); const k=Math.min(steps.length-1,Math.floor(p*steps.length*0.999));
    pc.style.strokeDashoffset=String(302*(1-p));
    if(k!==curStep){ curStep=k; rows.forEach((el,j)=>{ el.classList.toggle('on',j===k); el.classList.toggle('done',j<k); }); [...big.querySelectorAll('img')].forEach((m,j)=>m.classList.toggle('on',j===k)); num.textContent=String(k+1).padStart(2,'0'); } };

  const whySec=h('section',{class:'ri-why',id:'ri-why'},h('div',{class:'ri-w'},h('div',{class:'ri-center-h rv'},h('p',{class:'ri-kick'},'Why rolled'),h('h2',{class:'ri-h2'},'Not scooped. Rolled.')),
    h('div',{class:'ri-cards'},why.map((w,i)=>h('div',{class:'ri-card rv'+(i?' d'+i:'')},h('span',null,String(i+1).padStart(2,'0')),h('h3',null,w[0]),h('p',null,w[1]))))));

  const gal=(P.g||[]).map(id=>u(id,1000)).filter(Boolean);
  const shot=(src,i,dup)=>h('figure',{class:'ri-shot',style:'--t:'+((i%2)?'3deg':'-3deg'),'aria-hidden':dup?'true':null},h('img',{src,alt:dup?'':'Rolled ice cream',draggable:'false'}));
  const track=h('div',{class:'ri-track'},gal.map((src,i)=>shot(src,i,false)),gal.map((src,i)=>shot(src,i,true)));
  // endless auto-scroll; pauses on hover, drag or touch
  let dn=false,sx=0,sl=0,hold=false,resume=0,pos=0,last=0;
  const half=()=>{ const k=track.children; return k.length>gal.length? k[gal.length].offsetLeft-k[0].offsetLeft : 0; };
  const wrap=()=>{ const H=half(); if(H>0){ if(track.scrollLeft>=H) track.scrollLeft-=H; else if(track.scrollLeft<0) track.scrollLeft+=H; } };
  track.addEventListener('pointerdown',e=>{ dn=true; sx=e.clientX; sl=track.scrollLeft; track.classList.add('drag'); });
  addEventListener('pointerup',()=>{ if(dn){ dn=false; track.classList.remove('drag'); resume=performance.now()+1500; pos=track.scrollLeft; } });
  track.addEventListener('pointermove',e=>{ if(dn){ track.scrollLeft=sl-(e.clientX-sx); wrap(); } });
  track.addEventListener('mouseenter',()=>{ hold=true; }); track.addEventListener('mouseleave',()=>{ hold=false; pos=track.scrollLeft; });
  track.addEventListener('touchstart',()=>{ resume=performance.now()+3000; },{passive:true});
  track.addEventListener('scroll',()=>{ if(dn||performance.now()<resume) pos=track.scrollLeft; },{passive:true});
  const calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const glide=t=>{ const dt=Math.min(50,t-(last||t)); last=t;
    if(!calm&&!dn&&!hold&&t>resume&&track.isConnected){ const r=track.getBoundingClientRect(); if(r.bottom>0&&r.top<innerHeight){ pos+=dt*0.045; const H=half(); if(H>0&&pos>=H) pos-=H; track.scrollLeft=pos; } }
    requestAnimationFrame(glide); };
  requestAnimationFrame(glide);
  const galSec=h('section',{class:'ri-gal',id:'ri-gal'},h('div',{class:'ri-w ri-gal-h rv'},h('div',null,h('p',{class:'ri-kick'},'Fresh off the plate'),h('h2',{class:'ri-h2'},'Every cup is a little different')),h('p',{class:'ri-small'},'Hover to pause, drag to look around')),track);

  const end=h('section',{class:'ri-end',id:'ri-end'},h('div',{class:'ri-sprinkles'},sprink(18)),
    h('h2',{class:'ri-outline sm'},h('span',null,'SEE YOU AT'),h('span',null,'THE PLATE')),
    h('div',{class:'ri-end-c rv'},logo?h('img',{src:logo,alt:''}):null,h('p',{class:'ri-script'},"come roll with us"),h('h3',{class:'ri-book'},((X.contact||{}).book)||'Book us for your next event!'),
      h('div',{class:'ri-end-b'},h('a',{class:'ri-btn lg',href:'?d='+encodeURIComponent(new URLSearchParams(location.search).get('d')||'')+'&view=catering'},'Plan your event'),C.tel?h('a',{class:'ri-btn ghost lg',href:C.tel},'Call '+C.phoneTxt):null),
      riContact(C,'dark')));
  const foot=riFoot(C);

  const root2=h('div',{class:'ri'},nav,h('main',null,hero,marq,tour,whySec,galSec,end),foot);
  // mouse parallax for floating cups + scroll effects
  const fl=()=>[...root2.querySelectorAll('.ri-fl')];
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
    addEventListener('pointermove',e=>{ const x=e.clientX/innerWidth-.5,y=e.clientY/innerHeight-.5; fl().forEach(f=>{ const d=+f.dataset.depth; f.style.setProperty('--mx',(x*60*d)+'px'); f.style.setProperty('--my',(y*60*d)+'px'); }); },{passive:true});
  }
  let tk=false; const onS=()=>{ tk=false; tourTick(); const y=scrollY; root2.querySelector('.ri-nav').classList.toggle('sc',y>30); const o=root2.querySelector('.ri-hero .ri-outline'); if(o) o.style.transform='translateY('+(y*.25)+'px)'; fl().forEach(f=>f.style.setProperty('--sy',(-y*(+f.dataset.depth)*.5)+'px')); };
  addEventListener('scroll',()=>{ if(!tk){ tk=true; requestAnimationFrame(onS); } },{passive:true}); requestAnimationFrame(onS);
  return root2;
}
/* ---------- Rollin' catering inquiry page (?view=catering); demo form, nothing is sent ---------- */
function rollinCatering(C){
  const X=C.x||{}, P=X.pics||{};
  const dq='?d='+encodeURIComponent(new URLSearchParams(location.search).get('d')||'');
  const u=id=>/^img\/[a-z0-9._-]+$/.test(id||'')?id:/^[0-9]{10,13}-[0-9a-f]{12}$/.test(id||'')?'https://images.unsplash.com/photo-'+id+'?auto=format&fit=crop&w=900&q=82':'';
  const logo=/^img\/[a-z0-9._-]+$/.test(X.logo||'')?X.logo:'';
  if(!document.getElementById('riFonts')) document.head.append(h('link',{id:'riFonts',rel:'stylesheet',href:'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,600..900,100&family=DM+Sans:wght@400;500;700&display=swap'}));
  const nav=h('header',{class:'ri-nav sc'},h('div',{class:'ri-w ri-nav-in'},
    h('a',{class:'ri-brand',href:dq},logo?h('img',{src:logo,alt:"Rollin' Icecream logo"}):null,h('b',null,"Rollin' Icecream")),
    h('nav',{class:'ri-links'},[['ri-tour','The roll tour'],['ri-why','Why rolled'],['ri-gal','Fresh off the plate']].map(([id,t])=>h('a',{href:dq+'#'+id},t)),h('a',{href:dq+'&view=catering',class:'on','aria-current':'page'},'Catering'),h('a',{href:dq+'#ri-end'},'Contact')),
    h('div',{class:'ri-nav-r'},h('a',{class:'ri-btn ri-cat-btn',href:dq+'&view=catering'},'Catering'),h('a',{class:'ri-btn ri-ct-btn',href:dq+'#ri-end'},'Contact'),h('a',{class:'ri-btn ghost',href:dq},'Back to home'))));
  const floats=['hero1','hero2','hero3','hero4'].map((k,i)=>u(P[k])?h('div',{class:'ri-fl c'+i},h('img',{src:u(P[k]),alt:''})):null);
  const hero=h('section',{class:'ri-chero'},floats,h('h1',{class:'ri-outline ri-cout','aria-hidden':'true'},h('span',null,'CATERING')),
    h('div',{class:'ri-chero-t'},h('p',{class:'ri-script'},'bring the roll to your event'),h('h2',{class:'ri-h2'},'Rolled ice cream, made right in front of your guests'),
      h('p',{class:'ri-lead'},'Birthdays, weddings, school events, office parties and festivals. Tell us about your event and we will follow up with options and a quote.'),(C.x&&C.x.contact&&C.x.contact.book)?h('p',{class:'ri-script sm'},C.x.contact.book):null,
      h('a',{class:'ri-btn lg',href:'#ri-form',onclick:e=>{ e.preventDefault(); scrollTo('ri-form'); }},'Start your inquiry')));
  const how=h('div',{class:'ri-chow'},[['Tell us about it','Date, place, guest count and the kind of event.'],['We follow up','We reach out with options, flavors and a quote.'],['We roll it fresh','Every cup is rolled to order for your guests.']].map((s,i)=>h('div',{class:'ri-chow-i rv'+(i?' d'+i:'')},h('span',null,String(i+1).padStart(2,'0')),h('div',null,h('h3',null,s[0]),h('p',null,s[1])))));
  // form
  const types=['Birthday','Wedding','School','Corporate','Festival','Other'];
  let type='';
  const typeBox=h('div',{class:'ri-chips',role:'radiogroup','aria-label':'Event type'},types.map(t=>h('button',{type:'button',role:'radio','aria-checked':'false',onclick:e=>{ type=t; [...typeBox.children].forEach(b=>{ const on=b===e.currentTarget; b.classList.toggle('on',on); b.setAttribute('aria-checked',String(on)); }); }},t)));
  const fld=(lbl,type2,name,ph,req,extra)=>h('label',{class:'ri-f'},h('span',null,lbl,req?h('em',null,' *'):null),h('input',Object.assign({type:type2,name,placeholder:ph||'',required:req||null},extra||{})));
  const guests=h('input',{type:'range',min:'10',max:'500',step:'10',value:'50',name:'guests',oninput:e=>{ gOut.textContent=e.target.value+(e.target.value==='500'?'+':''); }});
  const gOut=h('b',null,'50');
  const msg=h('p',{class:'ri-ferr',role:'alert'});
  const form=h('form',{class:'ri-form',novalidate:true,onsubmit:e=>{ e.preventDefault(); const f=e.currentTarget; const bad=[...f.querySelectorAll('input[required]')].filter(i=>!i.value.trim()||!i.checkValidity());
      f.querySelectorAll('.ri-f').forEach(l=>l.classList.remove('bad')); bad.forEach(i=>i.closest('.ri-f').classList.add('bad'));
      if(bad.length){ msg.textContent='Please fill in the highlighted fields.'; bad[0].focus(); return; }
      msg.textContent=''; card.replaceChildren(done()); card.scrollIntoView({behavior:'smooth',block:'center'}); }},
    h('div',{class:'ri-frow'},fld('Your name','text','name','First and last name',true,{autocomplete:'name'}),fld('Phone','tel','phone','(555) 555-5555',true,{autocomplete:'tel'})),
    fld('Email','email','email','you@example.com',true,{autocomplete:'email'}),
    h('div',{class:'ri-f'},h('span',null,'Type of event'),typeBox),
    h('div',{class:'ri-frow'},fld('Event date','date','date','',true),fld('Start time','time','time','',false)),
    fld('Event location','text','where','City or venue',true),
    h('label',{class:'ri-f'},h('span',null,'About how many guests? ',gOut),guests,h('div',{class:'ri-range-l'},h('small',null,'10'),h('small',null,'500+'))),
    h('label',{class:'ri-f'},h('span',null,'Anything else?'),h('textarea',{name:'notes',rows:4,placeholder:'Indoor or outdoor, flavors you love, dietary needs, budget...'})),
    msg,h('button',{type:'submit',class:'ri-btn lg ri-fsend'},'Send inquiry'),
    h('p',{class:'ri-fnote'},'Demo: this form does not send anything yet.'));
  const done=()=>h('div',{class:'ri-done'},logo?h('img',{src:logo,alt:''}):null,h('h3',null,'Thanks, we got it!'),h('p',null,"In the live site, your inquiry goes straight to Rollin' Icecream and they reach out to plan your event."),h('p',{class:'ri-fnote'},'Demo: nothing was sent.'),h('a',{class:'ri-btn lg',href:dq},'Back to home'));
  const card=h('div',{class:'ri-fcard rv',id:'ri-form'},h('h2',null,'Catering inquiry'),h('p',{class:'ri-fsub'},'Takes about a minute.'),form);
  const body=h('section',{class:'ri-cbody'},h('div',{class:'ri-w ri-cgrid'},h('div',{class:'ri-cleft'},h('p',{class:'ri-kick'},'How it works'),h('h2',{class:'ri-h2'},'Three easy steps'),how,
      h('div',{class:'ri-cdirect rv'},h('h3',null,'Rather talk it through?'),h('p',null,'Call, text or message us anytime.'),riContact(C,'light')),
      h('div',{class:'ri-cphotos'},['hero2','hero3'].map(k=>u(P[k])?h('div',{class:'rv'},h('img',{src:u(P[k]),alt:'Rolled ice cream',loading:'lazy'})):null))),card));
  const foot=riFoot(C);
  return h('div',{class:'ri ri-catpage'},nav,h('main',null,hero,body),foot);
}
function rbBar(C){
  if(C.x&&C.x.sample) return h('div',{class:'rb-bar'},h('div',{class:'rb-in'},
    h('div',{class:'t'},h('b',null,'Sample website'),h('em',{class:'rb-tag'},'Made-up business'),h('br'),h('span',null,'Every Riverbend site is custom-built around your business: your name, photos, colors, services and features.')),
    h('a',{class:'go',href:'https://riverbendwebco.com/#contact',target:'_blank',rel:'noopener'},'Make it yours')));
  return h('div',{class:'rb-bar'},h('div',{class:'rb-in'},
    h('div',{class:'t'},h('b',null,'Website preview for '+(C.name||'your business')),h('em',{class:'rb-tag'},'Demo · sample content'),h('br'),h('span',null,'Designed by Riverbend Web Co., Dubuque. $0 down, you own your domain.')),
    h('a',{class:'go',href:'https://riverbendwebco.com/#contact',target:'_blank',rel:'noopener'},'Make it yours')));
}
})();
