const {load}=require('./harness');
const {B,H}=load(); let pass=0,fail=0; const ok=(n,c,i='')=>{c?pass++:fail++; console.log((c?'PASS ':'FAIL ')+n+(c?'':' '+i));};
H.props.SQUARE_ENV='production'; H.props.SQUARE_TOKEN_PRODUCTION='x';
const CUST=[{id:'C1',email_address:'joe@bar.com'}], CARDS={C1:[]}, PAYS=[];
B.setFake((m,path,body)=>{
  if(path==='/v2/customers/search'){ const f=body.query.filter; return {ok:true,customers:CUST.filter(c=>f.email_address?c.email_address===f.email_address.exact:false)}; }
  if(path.startsWith('/v2/cards?')){ const id=decodeURIComponent(path.split('customer_id=')[1].split('&')[0]); return {ok:true,cards:CARDS[id]||[]}; }
  if(path.startsWith('/v2/payments?')) return {ok:true,payments:PAYS};
  if(path==='/v2/locations') return {ok:true,locations:[{id:'L',status:'ACTIVE'}]};
  if(path.startsWith('/v2/refunds')||path.startsWith('/v2/disputes')) return {ok:true};
  return {ok:false,errors:[{code:'X',detail:path}]};
});
H.today='2026-11-23'; H.cache={};
B.doPost({postData:{contents:JSON.stringify({kind:'agreement',fields:{'Plan Key':'custom-once','Plan':'x','Business':"Joe's Bar",'Owner':'Joe','Phone':'5635550100','Email':'joe@bar.com','Signed':'x'}})}});
const a=B.billAll_().find(x=>x.business==="Joe's Bar");
let r=B.billing_({action:'billing_findcard',id:a.id});
ok('No card yet: tells the salesman what to do',r.ok&&!r.found&&/Save Card/.test(r.detail));
CARDS.C1.push({id:'ccof:1',card_brand:'VISA',last_4:'4242',exp_month:1,exp_year:2029,created_at:'2026-11-23T10:00:00Z'});
PAYS.push({id:'P1',status:'COMPLETED',customer_id:'C1',amount_money:{amount:99900},created_at:'2026-11-23T10:00:00Z'});
r=B.billing_({action:'billing_findcard',id:a.id});
const b=B.billGet_(a.id);
ok('Finds the card saved in the Square app',r.found&&b.sq.cardId==='ccof:1'&&b.sq.last4==='4242');
ok('Sees the $999 setup fee rung up in the Square app',b.setupPaid&&b.charges.find(c=>c.kind==='setup').paymentId==='P1');
ok('Account moves to Building, owner emailed',b.status==='building'&&H.mails.some(m=>/Payment set up in the Square app/.test(m.subject)));
// daily job finds it automatically
H.cache={}; B.doPost({postData:{contents:JSON.stringify({kind:'agreement',fields:{'Plan Key':'starter-zero','Plan':'x','Business':'Zed Co','Owner':'Z','Phone':'5635550111','Email':'zed@co.com','Signed':'x'}})}});
CUST.push({id:'C2',email_address:'zed@co.com'}); CARDS.C2=[{id:'ccof:2',card_brand:'MASTERCARD',last_4:'1111',created_at:'2026-11-23T11:00:00Z'}];
B.billTick_();
ok('Daily job picks up a $0-down card saved in the Square app',B.billAll_().find(x=>x.business==='Zed Co').status==='building');
const z=B.billAll_().find(x=>x.business==='Zed Co'); H.today='2026-11-25'; const l=B.billLaunch_(z.id,'2026-11-25',true);
console.log(pass+'/'+(pass+fail)+' passed');
