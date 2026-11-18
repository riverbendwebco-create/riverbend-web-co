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
function scrollTo(id){ const t=document.getElementById(id); if(!t) return; const nav=document.querySelector('.pub-nav,.lg-nav,.tr-nav,.hl-nav'); const y=t.getBoundingClientRect().top+scrollY-((nav?nav.offsetHeight:0)+8); window.scrollTo({top:y,behavior:'smooth'}); }
const jump=(id,label,cls)=>h('button',{type:'button',class:cls||null,onclick:()=>scrollTo(id)},label);

function fail(t,m){ root.replaceChildren(h('div',{class:'state'},h('div',null,h('h1',{text:t}),h('p',{text:m})))); }
const slug=new URLSearchParams(location.search).get('d')||'';
if(!/^[a-z0-9-]{3,80}$/.test(slug)){ fail('Preview not found','Check the link and try again.'); return; }
const fromApi=s=>fetch(API+'?action=demo&slug='+encodeURIComponent(s)).then(r=>r.json()).then(r=>r&&r.ok?r.demo:null);
fetch('data/'+slug+'.json',{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null).then(local=>{
  if(!local) return fromApi(slug);
  if(!local.base||!/^[a-z0-9-]{3,80}$/.test(local.base)) return local;
  return fromApi(local.base).then(b=>Object.assign({},b||{},local));
}).then(d=>{
  if(!d){ fail('Preview not found','This preview may have been removed.'); return; }
  build(d);
}).catch(()=>fail('Couldn’t load this preview','Check your connection and refresh.'));

function build(d){
  const style=['pub','lounge','trade','western'].includes(d.style)?d.style:'pub';
  document.title=(d.name||'Preview')+' | Website preview';
  document.body.classList.add('t-'+style);
  const C={
    variant:d.variant||'', bg:(d.bg&&typeof d.bg==='object')?d.bg:((d.x&&d.x.bg&&typeof d.x.bg==='object')?d.x.bg:{}), mkHide:(Array.isArray(d.mkHide)?d.mkHide:[]).filter(v=>typeof v==='string'), x:(d.x&&typeof d.x==='object')?d.x:{}, reviews:(d.reviews||[]).filter(r=>r&&r.text&&r.name).slice(0,12), reviewsSource:d.reviewsSource||'', reviewLink:okUrl(d.reviewLink), storyPic:okUrl(d.storyPhoto), name:d.name||'', cat:d.category||'', city:d.city||'', addr:d.address||'', about:d.about||'', tag:d.tagline||'',
    phone:d.phone||'', email:/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email||'')?d.email:'',
    logo:okImg(d.logo), hours:(d.hours||[]).slice(0,7),
    items:(d.items||[]).filter(i=>i&&i.name).map(i=>Object.assign({},i,{photo:okUrl(i.photo)})), specials:(d.specials||[]).filter(i=>i&&i.title).map(i=>Object.assign({},i,{photos:(i.photos||[]).map(okUrl).filter(Boolean).slice(0,8)})),
    fb:okUrl(String((d.social||{}).facebook||'').replace(/^http:\/\//i,'https://')), ig:okUrl(String((d.social||{}).instagram||'').replace(/^http:\/\//i,'https://'))
  };
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
  const head=(kick,title,sub)=>h('div',{class:'hl-head'},kick?h('small',null,kick):null,h('h2',null,title),sub?h('p',null,sub):null);

  const top=first?h('div',{class:'hl-ann'},h('span',null,first.title),first.when?h('b',null,first.when):null):null;
  const links=[['w-events','Specials'],C.x.feature?['w-feature','Trail Boss']:null,C.items.length?['w-menu','Menu']:null,['w-camp','Our Story'],C.reviews.length?['w-reviews','Reviews']:null,['w-visit','Find Us']].filter(Boolean);
  const nav=h('header',{class:'hl-nav'},h('div',{class:'hl-nav-in'},
    h('a',{class:'hl-brand',href:'#',onclick:e=>{e.preventDefault();scrollTo('w-top');}},C.logo?h('img',{src:C.logo,alt:C.name}):h('b',null,C.name)),
    h('nav',{class:'hl-links'},links.map(([id,l],i)=>h('button',{type:'button',onclick:()=>scrollTo(id)},h('i',null,String(i+1).padStart(2,'0')),l))),
    C.tel?h('a',{class:'hl-btn hl-rust hl-sm',href:C.tel},ico('phone',16,''),'Call'):null));

  const rv=C.reviews[0];
  const hero=h('section',{class:'hl-hero',id:'w-top'},
    h('div',{class:'hl-hero-t'},
      h('div',{class:'hl-kick'},h('span',null,'Trailhead'),[C.cat,city].filter(Boolean).join(' · ')),
      h('h1',null,C.tag||C.name),
      heroTxt?h('p',null,heroTxt):null,
      h('div',{class:'hl-acts'},C.tel?h('a',{class:'hl-btn hl-rust',href:C.tel},ico('phone',18,''),C.phoneTxt):null,
        C.items.length?h('button',{type:'button',class:'hl-btn hl-line',onclick:()=>scrollTo('w-menu')},'See the menu'):null),
      h('dl',{class:'hl-board'},
        h('div',null,h('dt',null,'Today'),h('dd',null,C.today?(openNow?'Open '+C.today:'Closed today'):'Call for hours')),
        (C.addr||C.city)?h('div',null,h('dt',null,'Find us'),h('dd',null,[C.addr,city].filter(Boolean).join(', '))):null,
        pts[0]?h('div',null,h('dt',null,'Ride in'),h('dd',null,pts[0])):null)),
    bg(h('div',{class:'hl-hero-p ph'},
      h('span',{class:'hl-pin'},ico('pin',16,''),[city,(C.city.split(',')[1]||'').trim()].filter(Boolean).join(', ')),
      rv?h('figure',{class:'hl-hero-rev'},h('div',{class:'st'},stars(5)),h('blockquote',null,'“'+short(rv.text,120)+'”'),h('figcaption',null,rv.name)):null),C.hero));

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
  const week=sec('w-events','hl-week',head('Every day is a reason to ride in','This Week at '+C.name.replace(/^The /,'the ')),
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
  const gal=C.own.length>=3?sec('w-gal','hl-gal',head('Straight from the Holler','Photos'),
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
  const page=h('div',{class:'demo western on v-trail hl'},top,nav,hero,week,boss,menu,gal,camp,revs,visit,foot);
  Object.keys(C.bg).forEach(k=>{ if(/^[a-z]{2,12}$/.test(k)&&okUrl(C.bg[k])) page.style.setProperty('--bg-'+k,cssUrl(C.bg[k])); });
  return page;
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
  const box=h('div',{class:'wx-lb',role:'dialog','aria-label':title,onclick:e=>{ if(e.target===box) close(); }},
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
/* ===================== MARKETING PLAN (Riverbend offer for a demo's business) ===================== */
const MK_SOCIAL=[
  {id:'soc1',name:'Social Starter',price:90,per:'mo',what:'We run your Facebook and Instagram: 3 posts a week in total, shared to both pages, about your food, specials and events. Plus a short monthly report.',idea:C=>C.specials[0]?'Posts every week for '+C.specials[0].title+', with photos.':''},
  {id:'soc2',name:'Social Growth',price:199,per:'mo',what:'The same 3 posts a week, plus weekly stories, 2 short Reels a month, and we answer comments and messages for you.',idea:C=>{ const f=pickFavs(C)[0]; return f?'A short Reel of your '+f.name+' to show people what they are missing.':''; }}
];
const MK=[
  {id:'club',name:'Email or text club for specials',price:25,per:'mo',what:'Guests sign up on your site, and we send your specials and events to them for you.',idea:C=>C.specials[0]?'A text to your club before '+C.specials[0].title+(C.specials[0].when?' ('+C.specials[0].when+')':'')+'.':''},
  {id:'qr',name:'QR menu and table tents',price:60,per:'one-time',what:'Table tents with a QR code that opens your menu, specials and social pages.',idea:()=>''},
  {id:'order',name:'Online ordering or reservations setup',price:150,per:'one-time',label:'one-time setup fee',what:'We connect online ordering, carry-out or reservations to your website. One-time $150 setup fee.',idea:()=>'We can connect apps like DoorDash, Grubhub and Uber Eats, so customers can order from your website.'}
];
function marketing(C){
  const money=n=>'$'+n.toLocaleString('en-US');
  const unit=m=>m.label||(m.per==='mo'?'per month':'one-time');
  const today=new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const offer=(m,ix,kind)=>{ const idea=m.idea(C);
    return h('article',{class:'mo-item mo-'+kind},
      h('div',{class:'mo-num'},String(ix+1).padStart(2,'0')),
      h('div',{class:'mo-body'},
        h('h3',null,m.name),
        h('p',{class:'mo-what'},m.what),
        idea?h('div',{class:'mo-ex'},h('span',null,'Example for '+C.name),h('p',null,idea)):null),
      h('div',{class:'mo-price'},h('b',null,money(m.price)),h('span',null,unit(m)))); };
  const soc=[C.fb?h('a',{href:C.fb,target:'_blank',rel:'noopener'},'Facebook'):null,C.ig?h('a',{href:C.ig,target:'_blank',rel:'noopener'},'Instagram'):null].filter(Boolean);
  const hide=(Array.isArray(C.x.mkHide)?C.x.mkHide.filter(x=>typeof x==='string'):[]).concat(C.mkHide);
  const adds=MK.filter(m=>hide.indexOf(m.id)<0), plans=MK_SOCIAL.filter(m=>hide.indexOf(m.id)<0);
  return h('div',{class:'mp'+(/^[a-z]{3,20}$/.test(C.variant||'')?' mk-'+C.variant:'')},
    h('header',{class:'mp-bar'},h('div',{class:'mp-in'},
      h('span',{class:'mp-brand'},'Riverbend Web Co.'),
      h('a',{class:'mp-back',href:'?d='+encodeURIComponent(slug)},'View website demo'))),
    h('section',{class:'mp-cover'},h('div',{class:'mp-in'},
      h('div',{class:'mp-cover-l'},
        h('div',{class:'mp-eyebrow'},'Marketing proposal'),
        h('h1',null,'Social media and local marketing for '+(C.name||'your business')),
        h('p',null,'A simple monthly plan to keep '+(C.name||'your business')+' in front of local customers on Facebook and Instagram.')),
      h('dl',{class:'mp-meta'},
        h('div',null,h('dt',null,'Prepared for'),h('dd',null,C.name||'')),
        h('div',null,h('dt',null,'Prepared by'),h('dd',null,'Riverbend Web Co., Dubuque')),
        h('div',null,h('dt',null,'Date'),h('dd',null,today)),
        soc.length?h('div',null,h('dt',null,'Pages we would manage'),h('dd',null,soc.map((a,i)=>[i?', ':'',a]))):null),
      C.logo?h('img',{class:'mp-logo',src:C.logo,alt:C.name}):null)),
    h('main',{class:'mp-in mo'},
      h('section',null,
        h('div',{class:'mp-label'},h('span',null,'01'),'Social media management'),
        h('p',{class:'mp-sub'},'Monthly plans. Choose one.'),
        h('div',{class:'mo-list'},plans.map((m,i)=>offer(m,i,'plan')))),
      h('section',null,
        h('div',{class:'mp-label'},h('span',null,'02'),'Add-ons'),
        h('p',{class:'mp-sub'},'Add any of these to a plan.'),
        h('div',{class:'mo-list'},adds.map((m,i)=>offer(m,i,'add')))),
      h('p',{class:'mp-fine mo-fine'},'Prices are for Riverbend Web Co. services and can be added to any website plan. Ask us about terms.')));
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
    h('div',{class:'t'},h('b',null,'Website preview for '+(C.name||'your business')),h('em',{class:'rb-tag'},'Demo · sample content'),h('br'),h('span',null,'Designed by Riverbend Web Co., Dubuque. $0 down, you own your domain.')),
    h('a',{class:'go',href:'https://riverbendwebco.com/#contact',target:'_blank',rel:'noopener'},'Make it yours')));
}
})();
