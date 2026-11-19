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
function scrollTo(id){ const t=document.getElementById(id); if(!t) return; const nav=document.querySelector('.pub-nav,.lg-nav,.tr-nav,.hl-nav,.dn-nav,.by-nav,.bz-nav,.fd-nav,.wb-nav,.bb-nav'); const y=t.getBoundingClientRect().top+scrollY-((nav?nav.offsetHeight:0)+8); window.scrollTo({top:y,behavior:'smooth'}); }
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
  if(C.variant==='cloud'){ clAge(C); document.body.className='t-cl'; const pg=cloudShop(C); root.replaceChildren(pg,rbBar(C)); reveal(pg); return; }
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
  const links=[['w-top','Trailhead'],['w-events','Specials'],C.x.feature?['w-feature','Trail Boss']:null,C.items.length?['w-menu','Menu']:null,C.own.length>=3?['w-gal','Photos']:null,['w-camp','Our Story'],C.reviews.length?['w-reviews','Reviews']:null,['w-visit','Find Us']].filter(Boolean);
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
    hint.textContent=stage===0?'Start here: tap the problem that looks most like yours.':stage===1?'Good. Now tap the room it is in.':'Here is your match. Send it to Tyler with one tap.';
    if(stage<2){ result.hidden=true; result.replaceChildren(); return; }
    const svc=(room==='Store or office'&&prob.svc!=='Drywall')?prob.svc+' and Commercial':prob.svc;
    const summary='Hi, I found you on your website. Problem: '+prob.t+'. Room: '+room+'. Can I get an estimate? My name is ';
    const copied=h('span',{class:'wb-fcopied',role:'status'});
    const enc=encodeURIComponent(summary);
    const textBtn=C.tel?h('a',{class:'wb-btn blue',href:C.tel.replace(/^tel:/,'sms:')+'?&body='+enc},ico('chat',16,''),'Text Tyler'):null;
    const mailBtn=C.email?h('a',{class:'wb-btn line',href:'mailto:'+C.email+'?subject='+encodeURIComponent('Estimate request: '+prob.t)+'&body='+enc},'Email Tyler'):null;
    const copy=h('button',{type:'button',class:'wb-fcopy',onclick:()=>{ const done=()=>{ copied.textContent='Copied. Paste it into your message.'; }; try{ navigator.clipboard.writeText(summary).then(done,()=>{ copied.textContent='Copy not available. Please type it in your message.'; }); }catch(e){ copied.textContent='Copy not available. Please type it in your message.'; } }},'Copy my request to paste');
    result.hidden=false;
    result.replaceChildren(
      h('div',{class:'wb-fres-l'},h('span',{class:'wb-tape light'},'Your match'),h('h3',null,svc),h('p',null,h('b',null,'You picked: '),prob.t+' in '+room.toLowerCase()+'.'),h('p',null,prob.why),(room==='Store or office')?h('p',null,'We also do commercial work, including storefronts and offices.'):null,h('p',{class:'wb-ftip'},'Tip: add a photo of the problem when you message. It helps.')),
      h('div',{class:'wb-fres-r'},h('p',{class:'wb-fnext'},'Send it to Tyler'),h('p',{class:'wb-fsub'},'Text is the fastest. Your picks are filled in for you.'),
        h('div',{class:'wb-cta'},textBtn,fbBtn('line','Message on Facebook'),mailBtn),
        h('div',{class:'wb-fmore'},copy,h('button',{type:'button',class:'wb-freset',onclick:()=>{ prob=null; room=null; render(); }},'Start over')),copied,
        h('p',{class:'wb-fdemo'},'In the finished site, you can also attach photos here and send straight to Tyler.')));
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
      C.fb?h('div',{class:'wb-wrap'},h('div',{class:'wb-follow'},h('b',null,'See more jobs on Facebook'),fbBtn('blue','Welborn on Facebook'))):null);
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
  heat:[['Toasted'],['Cold']]};
const BB_PRICE_DEF={meat:{'Corned beef':9.5,'Roast beef':9.5,'Turkey':9,'Chicken salad':8.75,'Veggie':8},bread:{'Pretzel roll':1,'Croissant':1,'Bagel':.75,'Wheat':0,'White':0},cheese:{'Swiss':.75,'Cheddar':.75,'Provolone':.75,'No cheese':0},tops:{'Lettuce':0,'Tomato':0,'Onion':0,'Pickles':0,'Sauerkraut':.5,'Peppers':.5},sauce:{},heat:{}};
let BB_UID=0;
function bbSvg(s,cls){
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
    const dl='<path d="M36 '+y+'q-1 12 5 16 4-8 8-16z" fill="'+grad(c,.1,.2)+'"/><path d="M264 '+y+'q1 11 -5 15 -4-8 -8-15z" fill="'+grad(c,.1,.2)+'"/><path d="M142 '+y+'q4 9 10 11 4-6 6-11z" fill="'+grad(c,.1,.2)+'"/>';
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
    L('<path d="M42 '+y+'V'+(yy+30)+'Q42 '+yy+' 150 '+yy+'Q258 '+yy+' 258 '+(yy+30)+'V'+y+'z" fill="'+hgrad(bc)+'"/><path d="M42 '+y+'V'+(yy+30)+'Q42 '+yy+' 150 '+yy+'Q258 '+yy+' 258 '+(yy+30)+'V'+y+'z" fill="'+grad(bc,.2,.3)+'" opacity=".55"/>'+ex+'<path d="M64 '+(yy+20)+'Q100 '+(yy+4)+' 160 '+(yy+4)+'" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".3"/><path d="M42 '+y+'h216" stroke="'+dk(bc,.4)+'" stroke-width="3" opacity=".5"/>',h2);
  }
  const top=y, vb=Math.min(top-12,150);
  return '<svg class="'+(cls||'')+'" viewBox="0 '+vb+' '+W+' '+(268-vb)+'" role="img" aria-label="Your sandwich" preserveAspectRatio="xMidYMax meet"><defs>'+defs.join('')+'<radialGradient id="'+id+'sh"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs><ellipse cx="150" cy="255" rx="130" ry="9" fill="url(#'+id+'sh)"/>'+out.join('')+'</svg>';
}
function bbShade(c,t){ const v=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)); const k=t>0?255:0, a=Math.abs(t); return '#'+v.map(x=>Math.round(x+(k-x)*a).toString(16).padStart(2,'0')).join(''); }
function bbIcon(g,n){
  const o=(BB_OPT[g].find(q=>q[0]===n)||[])[1]||'#999', D=t=>bbShade(o,-t), Lg=t=>bbShade(o,t);
  const wrap=b=>'<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true">'+b+'</svg>';
  const hl=(d,w)=>'<path d="'+d+'" fill="none" stroke="#fff" stroke-width="'+(w||3)+'" stroke-linecap="round" opacity=".4"/>';
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
function bigbill(C){
  const name=C.name||"Big Bill's Sandwich Shop and Coffee Bar";
  const A=k=>Array.isArray(C.x[k])?C.x[k]:[];
  const facts=A('facts').filter(f=>f&&f.k&&f.v).slice(0,4);
  const menu=A('menu').filter(m=>m&&m.g&&m.t).slice(0,6).map(m=>({g:String(m.g),n:m.n?String(m.n):'',t:String(m.t).split('|').map(t=>t.trim()).filter(Boolean)}));
  const why=A('why').filter(w=>w&&w.k&&w.t).slice(0,4);
  const heads=String(C.x.headline||'Big sandwiches.|Real coffee.').split('|');
  const call=(cls,label)=>C.tel?h('a',{class:'bb-btn '+cls,href:C.tel},ico('phone',16,''),label||('Call '+C.phoneTxt)):null;
  const fbBtn=(cls,label)=>C.fb?h('a',{class:'bb-btn '+cls,href:C.fb,target:'_blank',rel:'noopener'},ico('i-fb',16,''),label||'Message on Facebook'):null;
  const links=[['b-build','Build one'],menu.length?['b-menu','Menu']:null,why.length?['b-why','Why Bill’s']:null,['b-visit','Visit']].filter(Boolean);
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
  const hero=h('section',{class:'bb-hero',id:'b-top'},h('div',{class:'bb-wrap bb-hero-g'},
    h('div',{class:'bb-hero-t'},
      h('span',{class:'bb-tag'},C.cat||'Sandwich shop and coffee bar'),
      h('h1',null,h('span',null,heads[0]),heads[1]?[h('br'),h('em',null,heads[1])]:null),
      h('p',{class:'bb-lead'},C.tag||''),
      h('div',{class:'bb-cta'},h('button',{type:'button',class:'bb-btn mu',onclick:()=>scrollTo('b-build')},'Build your sandwich'),call('ghost')),
      C.today?h('p',{class:'bb-open'},h('b',null,'Open today '),C.today):h('p',{class:'bb-open'},'Closed Tuesdays')),
    art));
  const band=h('section',{class:'bb-band','aria-hidden':'true'},h('div',{class:'bb-wrap bb-band-in'},A('band').filter(t=>typeof t==='string'&&t).slice(0,8).map((t,i)=>[i?h('i'):null,h('span',null,t)])));

  /* the builder: a stage with the sandwich on a board, and a one-step-at-a-time workbench */
  const S={bread:DEF.bread,meat:DEF.meat,cheese:DEF.cheese,tops:DEF.tops.slice(),sauce:DEF.sauce,heat:DEF.heat};
  const STEPS=[['bread','Bread','Pick a bread',false],['meat','Meat','Pick a meat',false],['cheese','Cheese','Add cheese',false],['tops','Toppings','Pile on the toppings',true],['sauce','Spread','Choose a spread',false],['heat','Finish','Toasted or cold?',false]];
  let step=0;
  const PR=(()=>{ const o={}; Object.keys(BB_PRICE_DEF).forEach(g=>{ o[g]=Object.assign({},BB_PRICE_DEF[g]); const x=C.x.prices&&typeof C.x.prices==='object'?C.x.prices[g]:null; if(x&&typeof x==='object') Object.keys(x).forEach(k=>{ if(typeof x[k]==='number'&&x[k]>=0&&x[k]<100) o[g][k]=x[k]; }); }); return o; })();
  const money=n=>'$'+n.toFixed(2);
  const pOf=(g,v)=>(PR[g]&&PR[g][v])||0;
  const lines=()=>{ const L=[[S.meat+' sandwich',pOf('meat',S.meat)]]; if(pOf('bread',S.bread)) L.push([S.bread,pOf('bread',S.bread)]); if(S.cheese!=='No cheese'&&pOf('cheese',S.cheese)) L.push([S.cheese+' cheese',pOf('cheese',S.cheese)]); S.tops.forEach(t=>{ if(pOf('tops',t)) L.push([t,pOf('tops',t)]); }); return L; };
  const total=()=>lines().reduce((a,l)=>a+l[1],0);
  const tag=(g,v)=>{ const p=pOf(g,v); if(g==='meat') return money(p); if(g==='sauce'||g==='heat') return 'Free'; return p?'+'+money(p):'Free'; };
  const phrase=()=>{ const b=S.bread.toLowerCase(); const parts=[S.meat+' on '+(/roll|bagel|croissant/.test(b)?'a '+b:b)];
    if(S.cheese!=='No cheese') parts.push(S.cheese.toLowerCase()); S.tops.forEach(t=>parts.push(t.toLowerCase())); if(S.sauce) parts.push(S.sauce.toLowerCase()); parts.push(S.heat.toLowerCase()); return parts; };
  const sname=()=>'The '+S.meat+' '+(S.bread==='Pretzel roll'?'Pretzel':S.bread==='Croissant'?'Croissant':S.bread==='Bagel'?'Bagel':'Stack');
  const mini=h('div',{class:'bb-mini','aria-hidden':'true'});
  const tabs=h('ol',{class:'bb-tabs'});
  const panel=h('div',{class:'bb-panel'}), navb=h('div',{class:'bb-bnav'});
  const stage=h('aside',{class:'bb-stage'}), notice=h('span',{class:'bb-copied',role:'status'});
  const pick=(g,v,multi)=>{ if(multi){ const i=S.tops.indexOf(v); if(i>=0) S.tops.splice(i,1); else S.tops.push(v); } else S[g]=v; draw(); };
  const drawBench=()=>{
    tabs.replaceChildren(...STEPS.map((s,i)=>h('li',null,h('button',{type:'button',class:(i===step?'on ':'')+(i<step?'done':''),'aria-current':i===step?'step':null,onclick:()=>{ step=i; drawBench(); }},h('span',null,i<step?'\u2713':String(i+1)),s[1]))));
    const [g,,title,multi]=STEPS[step];
    panel.replaceChildren(h('h3',null,title,multi?h('small',null,'pick as many as you like'):null),
      h('div',{class:'bb-tiles',role:multi?'group':'radiogroup','aria-label':title},BB_OPT[g].map(o=>{ const on=g==='tops'?S.tops.includes(o[0]):S[g]===o[0];
        const t=h('button',{type:'button',class:'bb-tile'+(on?' on':''),role:multi?'checkbox':'radio','aria-checked':String(on),onclick:()=>pick(g,o[0],multi)},h('span',{class:'bb-ti'}),h('b',null,o[0]),h('em',{class:'bb-tp'},tag(g,o[0])),h('i',{class:'bb-ck','aria-hidden':'true'},'\u2713'));
        t.firstChild.innerHTML=bbIcon(g,o[0]); return t; })));
    navb.replaceChildren(
      step>0?h('button',{type:'button',class:'bb-btn line dark',onclick:()=>{ step--; drawBench(); }},'Back'):h('span'),
      step<STEPS.length-1?h('button',{type:'button',class:'bb-btn mu',onclick:()=>{ step++; drawBench(); }},'Next: '+STEPS[step+1][1]):h('button',{type:'button',class:'bb-btn mu',onclick:()=>{ stage.scrollIntoView({behavior:'smooth',block:'center'}); }},'See my ticket'));
  };
  const draw=()=>{
    const summary="Hi, I'd like to order: "+phrase().join(', ')+". Estimated "+money(total())+" before tax. My name is ";
    notice.textContent='';
    mini.innerHTML=bbSvg(S,'bb-minisvg')+'<b></b><em></em>'; mini.children[1].textContent=sname(); mini.children[2].textContent=money(total());
    const art=h('div',{class:'bb-art'}); art.innerHTML=bbSvg(S,'bb-live');
    stage.replaceChildren(h('div',{class:'bb-st-h'},h('span',null,'Your sandwich'),h('i',null,'Sample')),
      h('div',{class:'bb-plate'},art,h('div',{class:'bb-cutb','aria-hidden':'true'})),
      h('h3',null,sname()),h('ul',{class:'bb-tk-l'},phrase().map(t=>h('li',null,t.charAt(0).toUpperCase()+t.slice(1)))),
      h('div',{class:'bb-price'},h('ul',null,lines().map(l=>h('li',null,h('span',null,l[0]),h('b',null,money(l[1]))))),h('div',{class:'bb-total'},h('span',null,'Your total'),h('b',null,money(total())))),
      h('div',{class:'bb-tk-a'},call('mu','Call it in'),fbBtn('line','Message us'),
        h('button',{type:'button',class:'bb-copy',onclick:()=>{ const ok=()=>{ notice.textContent='Copied. Paste it into your message.'; }; try{ navigator.clipboard.writeText(summary).then(ok,()=>{ notice.textContent='Copy not available. Read it out when you call.'; }); }catch(e){ notice.textContent='Copy not available. Read it out when you call.'; } }},'Copy my order')),notice,
      h('p',{class:'bb-fine'},'Sample builder with sample prices, before tax. Real menu prices and ingredients are set with the owner. In the finished site, this sends your order straight to the counter.'));
    drawBench();
  };
  const build=h('section',{class:'bb-sec bb-build',id:'b-build'},h('div',{class:'bb-wrap'},
    h('div',{class:'bb-sh'},h('span',{class:'bb-tag'},'Build your own'),h('h2',null,C.x.buildTitle?String(C.x.buildTitle):'Stack your own sandwich'),h('p',null,'Pick one step at a time. Your sandwich builds on the board while you choose, then call it in or message it to the shop.')),
    h('div',{class:'bb-bg'},h('div',{class:'bb-bench'},mini,tabs,panel,navb),stage)));
  draw();

  /* menu board */
  const board=menu.length?h('section',{class:'bb-sec bb-menu',id:'b-menu'},h('div',{class:'bb-wrap'},
    h('div',{class:'bb-sh light'},h('span',{class:'bb-tag'},'On the board'),h('h2',null,C.x.menuTitle?String(C.x.menuTitle):'What people order'),h('p',null,C.x.menuSub?String(C.x.menuSub):'Favorites customers mention. Ask at the counter for today’s full menu and prices.')),
    h('div',{class:'bb-board'},menu.map(m=>h('article',{class:'bb-col'},h('h3',null,m.g),m.n?h('p',{class:'bb-cn'},m.n):null,h('ul',null,m.t.map(t=>h('li',null,t)))))))):null;

  const whyEl=why.length?h('section',{class:'bb-sec',id:'b-why'},h('div',{class:'bb-wrap'},
    h('div',{class:'bb-sh'},h('span',{class:'bb-tag'},'Why Bill’s'),h('h2',null,C.x.whyTitle?String(C.x.whyTitle):'Why people keep coming back'),C.x.whySub?h('p',null,String(C.x.whySub)):null),
    h('div',{class:'bb-why'},why.map((w,i)=>h('article',{class:'bb-wc'},h('b',null,String(i+1).padStart(2,'0')),h('h3',null,String(w.k)),h('p',null,String(w.t))))))):null;
  const stats=facts.length?h('section',{class:'bb-facts'},h('div',{class:'bb-wrap'},h('ul',null,facts.map(f=>h('li',null,h('b',null,String(f.v)),h('span',null,String(f.k))))))):null;

  const addrTxt=[C.addr,C.city].filter(Boolean).join(', ');
  const mapQ=encodeURIComponent([C.name,C.addr,C.city].filter(Boolean).join(', '));
  const visit=h('section',{class:'bb-sec bb-visit',id:'b-visit'},h('div',{class:'bb-wrap bb-visit-g'},
    h('div',null,h('span',{class:'bb-tag'},'Visit'),h('h2',null,C.x.visitTitle?String(C.x.visitTitle):'Come on in'),
      C.x.visitText?h('p',null,String(C.x.visitText)):null,
      addrTxt?h('p',{class:'bb-addr'},addrTxt):null,
      C.hasHours?h('div',{class:'bb-hrs'},osHours(C).map(r=>h('div',{class:r.today?'on':null},h('span',null,r.days),h('span',null,r.v)))):null,
      h('div',{class:'bb-cta'},call('mu'),C.maps?h('a',{class:'bb-btn line',href:C.maps,target:'_blank',rel:'noopener'},ico('pin',16,''),'Get directions'):null),
      socials(C)),
    addrTxt?h('div',{class:'bb-map'},h('iframe',{src:'https://www.google.com/maps?q='+mapQ+'&output=embed',title:'Map to '+C.name,loading:'lazy',referrerpolicy:'no-referrer-when-downgrade'})):null));
  const foot=h('footer',{class:'bb-foot'},h('div',{class:'bb-wrap bb-foot-in'},h('b',null,name),addrTxt?h('span',null,addrTxt):null,C.tel?h('a',{href:C.tel},C.phoneTxt):null,h('em',null,'© '+new Date().getFullYear()+' '+name)));
  return h('div',{class:'demo bb on'},top,nav,hero,band,build,board,stats,whyEl,visit,foot);
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
/* ===================== MARKETING PLAN (Riverbend offer for a demo's business) ===================== */
const MK_SOCIAL=[
  {id:'soc1',more:["3 posts a week, shared to both your Facebook and Instagram pages", "We write the captions and make the graphics for your specials, events and drawings", "We use photos you send us from your phone, cropped and touched up", "Posts go out on a set schedule, timed for when your customers are online", "You see and approve the month's plan before anything posts", "A short report each month: reach, new followers and your best posts"],name:'Social Starter',price:90,per:'mo',what:'We run your Facebook and Instagram: 3 posts a week in total, shared to both pages, about your food, specials and events. Plus a short monthly report.',idea:C=>C.specials[0]?'Posts every week for '+C.specials[0].title+', with photos.':''},
  {id:'soc2',more:["Everything in Social Starter", "Weekly stories for the day's special, live music and last-minute news", "2 short Reels a month, edited from video clips you send us", "We answer comments and messages for you and flag anything that needs you", "Reminder posts before events like live music and your monthly drawing"],name:'Social Growth',price:199,per:'mo',what:'The same 3 posts a week, plus weekly stories, 2 short Reels a month, and we answer comments and messages for you.',idea:C=>{ const f=pickFavs(C)[0]; return f?'A short Reel of your '+f.name+' to show people what they are missing.':''; }}
];
const MK=[
  {id:'club',more:["A sign-up form on your website, plus a QR code you can post at the bar", "We write and send your specials and event news to everyone on the list", "Text or email, whichever your customers prefer", "Opt-in only, with an easy way to unsubscribe", "A monthly count of how many people have joined"],name:'Email or text club for specials',price:25,per:'mo',what:'Guests sign up on your site, and we send your specials and events to them for you.',idea:C=>C.specials[0]?'A text to your club before '+C.specials[0].title+(C.specials[0].when?' ('+C.specials[0].when+')':'')+'.':''},
  {id:'qr',more:["Table tents designed to match your logo and colors", "The QR code opens your live website menu, so price changes never mean reprinting", "Links to your specials and your Facebook page in the same scan", "Print-ready files you can take to any printer"],name:'QR menu and table tents',price:60,per:'one-time',what:'Table tents with a QR code that opens your menu, specials and social pages.',idea:()=>''},
  {id:'order',name:'Online ordering or reservations setup',price:150,per:'one-time',label:'one-time setup fee',more:["Carry-out ordering right from your website, with orders sent to you by email or text", "Or we connect DoorDash, Grubhub and Uber Eats so they show up on your site", "Reservations or call-ahead requests instead, if that fits you better", "We set it up, test it and walk your staff through it"],what:'We connect online ordering, carry-out or reservations to your website. One-time $150 setup fee.',idea:()=>'We can connect apps like DoorDash, Grubhub and Uber Eats, so customers can order from your website.'}
];
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
        (()=>{ const om=C.x.mkMore&&typeof C.x.mkMore==='object'&&Array.isArray(C.x.mkMore[m.id])?C.x.mkMore[m.id].filter(t=>typeof t==='string'):null; const L=om||m.more; return C.mkMore&&L?h('ul',{class:'mo-more'},L.map(t=>h('li',null,t))):null; })(),
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
        okUrl(C.x.mkLogo)?h('img',{class:'mp-wlogo',src:okUrl(C.x.mkLogo),alt:C.name}):null,
        typeof C.x.mkWord==='string'&&C.x.mkWord?h('div',{class:'mp-word'},C.x.mkWord):null,
        h('div',{class:'mp-eyebrow'},'Marketing proposal'),
        h('h1',null,'Social media and local marketing for '+(C.name||'your business')),
        h('p',null,'A simple monthly plan to keep '+(C.name||'your business')+' in front of local customers on Facebook and Instagram.')),
      h('dl',{class:'mp-meta'},
        h('div',null,h('dt',null,'Prepared for'),h('dd',null,C.name||'')),
        h('div',null,h('dt',null,'Prepared by'),h('dd',null,'Riverbend Web Co., Dubuque')),
        h('div',null,h('dt',null,'Date'),h('dd',null,today)),
        soc.length?h('div',null,h('dt',null,'Pages we would manage'),h('dd',null,soc.map((a,i)=>[i?', ':'',a]))):null),
      C.logo?h('img',{class:'mp-logo',src:C.logo,alt:C.name}):null,
      okUrl(C.x.mkPhoto)?h('figure',{class:'mp-photo'},bg(h('div',{class:'ph'}),okUrl(C.x.mkPhoto)),typeof C.x.mkCap==='string'&&C.x.mkCap?h('figcaption',null,C.x.mkCap):null):null)),
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

function rbBar(C){
  return h('div',{class:'rb-bar'},h('div',{class:'rb-in'},
    h('div',{class:'t'},h('b',null,'Website preview for '+(C.name||'your business')),h('em',{class:'rb-tag'},'Demo · sample content'),h('br'),h('span',null,'Designed by Riverbend Web Co., Dubuque. $0 down, you own your domain.')),
    h('a',{class:'go',href:'https://riverbendwebco.com/#contact',target:'_blank',rel:'noopener'},'Make it yours')));
}
})();
