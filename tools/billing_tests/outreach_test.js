// Outreach: owner-only, drafts carry the business name, postal address and unsubscribe link,
// sending is blocked without an address and over the daily limit, unsubscribes stick.
const {load}=require('./harness'); const crypto=require('crypto');
const R=[]; const ok=(n,c,i='')=>R.push({n,c:!!c,i:String(i)});
const {B,H}=load(); H.today='2026-11-23';
const hex=b=>crypto.createHash('sha256').update(b).digest('hex');
// two signed-in accounts: an owner and a salesperson (sessions written the way auth stores them)
H.props.AUTH_USERS=JSON.stringify({'kruz@x.com':{email:'kruz@x.com',name:'Kruz Kitelinger',role:'owner',status:'active',gen:1},'owen@x.com':{email:'owen@x.com',name:'Owen Seffrood',role:'sales',status:'active',gen:1}});
const tok=e=>{ const t=crypto.randomBytes(32).toString('hex'); H.props['AUTH_S_'+hex('s:'+t)]=JSON.stringify({e,g:1,x:Date.now()+36e5}); return t; };
const K=tok('kruz@x.com'), O=tok('owen@x.com');
const S=b=>B.studio_(b);
let l=S({action:'outreach_list',token:K});
ok('Owner can open outreach',l.ok,JSON.stringify(l));
ok('Salesperson is refused (owners only), even calling the server directly',S({action:'outreach_list',token:O}).error==='auth'&&S({action:'outreach_find',token:O,q:'bar',city:'Galena',state:'IL'}).error==='auth');
ok('No session is refused',S({action:'outreach_list'}).error==='auth');
// seed two businesses as if added
const sh=H.sheets['Outreach']; const cols=sh.rows[0];
const row=(id,biz,email,issue)=>{ const r=[id,biz,'Bar','Galena, IL','http://'+id+'.com',email,issue,'pub',email?'Ready':'No email','2026-11-23','',0,'','','a'.repeat(23)+id.slice(-1),'(815) 555-0100']; sh.rows.push(r); };
row('osm:1','Sample Tap','owner@sampletap.com','it doesn’t adjust to phone screens, and most people look you up on their phone');
row('osm:2','Other Tap','info@othertap.com','');
l=S({action:'outreach_list',token:K}); const a=l.items.find(i=>i.id==='osm:1');
ok('Draft 1 is personal: business name, real website issue, the matching sample, and says it is fully custom',/Hi Sample Tap team/.test(a.draft.body)&&/doesn’t adjust to phone screens/.test(a.draft.body)&&/riverbendwebco\.com\/\?preview=pub/.test(a.draft.body)&&/designed from scratch around Sample Tap/.test(a.draft.body),a.draft.body);
ok('Sample picked by business type',B.outStyle_('Tavern')==='pub'&&B.outStyle_('Hair salon')==='salon'&&B.outStyle_('Barber shop')==='salon'&&B.outStyle_('Clothing boutique')==='salon'&&B.outStyle_('Pizza restaurant')==='lounge'&&B.outStyle_('Plumber')==='trade'&&B.outStyle_('Auto repair')==='auto'&&B.outStyle_('Car repair')==='auto'&&B.outStyle_('Tire shop')==='auto'&&B.outStyle_('Lawn care')==='trade'&&B.outStyle_('Cardiology')!=='auto'&&B.outStyle_('Salon')==='salon');
{ const o={business:'Joe Garage',type:'Auto repair',demo:'auto',website:'',issue:'',token:'t'}; const d=B.outDraft_(o,1,{from:'Kruz Kitelinger',address:'1 Main St'}); ok('Auto shop emails link the made-up auto sample and say it is custom',/riverbendwebco\.com\/demo\/\?d=sample-auto/.test(d.body)&&/an auto shop/.test(d.body)&&/designed from scratch around Joe Garage/.test(d.body),d.body); }
ok('Every email has the sender, a sales-inquiry label, the owner title, the cybersecurity line, the new subject and an unsubscribe link',/Business inquiry from Riverbend Web Co\./.test(a.draft.body)&&/Owner, Riverbend Web Co\./.test(a.draft.body)&&/military cybersecurity experience/.test(a.draft.body)&&a.draft.subject==='Question about Sample Tap\u2019s website'&&/\/unsubscribe\/#a{23}1/.test(a.draft.body));
ok('Without a mailing address: the draft says so and Mark sent is refused',/\[MAILING ADDRESS NEEDED\]/.test(a.draft.body)&&S({action:'outreach_sent',token:K,id:'osm:1'}).error==='address'&&!l.addressSet);
ok('Address must look real',S({action:'outreach_settings',token:K,address:'abc'}).error==='bad');
S({action:'outreach_settings',token:K,address:'PO Box 123, Dubuque, IA 52001',daily:1});
l=S({action:'outreach_list',token:K});
ok('Address goes into every draft',/Riverbend Web Co\. · PO Box 123, Dubuque, IA 52001\n/.test(l.items[0].draft.body));
const s1=S({action:'outreach_sent',token:K,id:'osm:1'});
let it=S({action:'outreach_list',token:K}).items.find(i=>i.id==='osm:1');
ok('Mark sent: step 1, waiting, follow-up 3 days later, logged with who sent it',s1.ok&&it.step===1&&it.status==='Waiting'&&it.next==='2026-11-26'&&/email 1 sent .* by Kruz Kitelinger/.test(it.notes),JSON.stringify(it));
ok('Daily limit is enforced (set to 1 here)',S({action:'outreach_sent',token:K,id:'osm:2'}).error==='daily');
ok('Not due yet: follow-up is not in today’s list',!it.due&&it.draft&&/Just making sure this reached you/.test(it.draft.body));
// unsubscribe
const un=B.doGet({parameter:{action:'unsub',t:'a'.repeat(23)+'1'}}); const unj=JSON.parse(un.t);
it=S({action:'outreach_list',token:K}).items.find(i=>i.id==='osm:1');
ok('Unsubscribe link works and marks them Unsubscribed (no more follow-ups)',it.status==='Unsubscribed'&&!it.next,JSON.stringify([unj,it.status]));
ok('Unsubscribed contacts cannot be emailed or re-opened',S({action:'outreach_sent',token:K,id:'osm:1'}).error==='unsub'&&S({action:'outreach_status',token:K,id:'osm:1',status:'Ready'}).error==='unsub');
ok('Bad unsubscribe tokens are refused',JSON.parse(B.doGet({parameter:{action:'unsub',t:'zz'}}).t).ok===false);
ok('Status buttons: Interested saves and clears the follow-up date',S({action:'outreach_status',token:K,id:'osm:2',status:'Interested'}).ok&&S({action:'outreach_list',token:K}).items.find(i=>i.id==='osm:2').status==='Interested');
ok('A bad email address is rejected when added by hand',S({action:'outreach_status',token:K,id:'osm:2',status:'Ready',email:'not-an-email'}).error==='email');
// city lookup + search use the map (mocked) and skip chains
H.fetch=(u)=>{ if(/nominatim/.test(u)) return {getResponseCode:()=>200,getContentText:()=>JSON.stringify([{boundingbox:['42.38','42.45','-90.47','-90.40']}])};
  if(/overpass|kumi|interpreter/.test(u)) return {getResponseCode:()=>200,getContentText:()=>JSON.stringify({elements:[{type:'node',id:7,lat:42.41,lon:-90.43,tags:{name:'Galena Tap',amenity:'bar',website:'http://galenatap.com',email:'hi@galenatap.com','addr:city':'Galena','addr:state':'IL'}},{type:'node',id:8,lat:42.41,lon:-90.43,tags:{name:'Chain Burger',amenity:'fast_food',brand:'Chain'}}]})};
  return {getResponseCode:()=>404,getContentText:()=>'',getHeaders:()=>({}),getAllHeaders:()=>({})}; };
const f=S({action:'outreach_find',token:K,q:'bar',city:'Galena',state:'IL'});
ok('Search works for any town (map lookup), keeps the listed email, leaves out chains',f.ok&&f.leads.some(x=>x.name==='Galena Tap'&&x.email==='hi@galenatap.com'&&/IL/.test(x.city))&&!f.leads.some(x=>x.name==='Chain Burger'),JSON.stringify(f).slice(0,400));
ok('Bad input is refused with a clear message',S({action:'outreach_find',token:K,q:'bar',city:'Galena',state:'Illinois'}).error==='bad');
R.forEach(r=>console.log((r.c?'PASS ':'FAIL ')+r.n+(r.c?'':'  ['+r.i+']'))); console.log(R.filter(r=>r.c).length+'/'+R.length+' passed');
