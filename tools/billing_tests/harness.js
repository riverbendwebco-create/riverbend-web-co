const fs=require('fs'), crypto=require('crypto');
function load(){
  const H={today:'2026-11-16', mails:[], props:{}, cache:{}, sheets:{}, sq:{payments:{},cards:{},customers:{},refunds:[],disputes:[],idem:{},declineCards:new Set(),loseNextResponse:false,calls:0}};
  function Range(sh,r,c,nr,nc){ nr=nr||1; nc=nc||1; return {
    getValues(){ const o=[]; for(let i=0;i<nr;i++){const row=[];for(let j=0;j<nc;j++) row.push(((sh.rows[r-1+i]||[])[c-1+j])??''); o.push(row);} return o; },
    getValue(){ return this.getValues()[0][0]; },
    setValues(v){ for(let i=0;i<nr;i++){ sh.rows[r-1+i]=sh.rows[r-1+i]||[]; for(let j=0;j<nc;j++) sh.rows[r-1+i][c-1+j]=v[i][j]; } return this; },
    setFontWeight(){return this}, setBackground(){return this}, setFontColor(){return this} }; }
  function Sheet(name){ const sh={name,rows:[], appendRow(r){sh.rows.push(r.slice())}, getLastRow(){return sh.rows.length}, getRange(r,c,nr,nc){return Range(sh,r,c,nr,nc)}, setFrozenRows(){}, hideColumns(){}, setName(n){sh.name=n;return sh} }; return sh; }
  const SS={ getSheetByName(n){return H.sheets[n]||null}, insertSheet(n){return H.sheets[n]=Sheet(n)}, getUrl(){return 'https://sheet'}, getSheets(){return Object.values(H.sheets)} };
  ['Signed Agreements','Preview Requests'].forEach(n=>H.sheets[n]=Sheet(n));
  const g={
    PropertiesService:{getScriptProperties:()=>({getProperty:k=>H.props[k]??null,setProperty:(k,v)=>{H.props[k]=String(v)},deleteProperty:k=>{delete H.props[k]}})},
    CacheService:{getScriptCache:()=>({get:k=>H.cache[k]??null,put:(k,v)=>{H.cache[k]=String(v)},remove:k=>{delete H.cache[k]},removeAll(){}})},
    LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){},waitLock(){}})},
    Utilities:{ getUuid:()=>crypto.randomUUID(), sleep(){},
      formatDate:(d,tz,f)=> f==='yyyy-MM-dd'?H.today: f==='yyyyMMdd'?H.today.replace(/-/g,''):String(d),
      computeDigest:(alg,v)=>Array.from(crypto.createHash('sha256').update(String(v)).digest()).map(b=>b>127?b-256:b),
      DigestAlgorithm:{SHA_256:1,MD5:2}, Charset:{UTF_8:1},
      base64Decode:s=>Array.from(Buffer.from(s,'base64')), newBlob:(b,t,n)=>({b,t,n,getDataAsString:()=>Buffer.from(b).toString()}),
      base64EncodeWebSafe:s=>Buffer.from(String(s)).toString('base64url'), base64DecodeWebSafe:s=>Array.from(Buffer.from(s,'base64url')) },
    MailApp:{sendEmail:o=>H.mails.push(o)},
    ContentService:{createTextOutput:t=>({t,setMimeType(){return this},text:t}),MimeType:{JSON:1}},
    DriveApp:{}, SpreadsheetApp:{}, UrlFetchApp:{fetch:()=>{throw new Error('no network in tests')}}, Logger:{log(){}}, console
  };
  const code=fs.readFileSync(require('path').join(__dirname,'../../apps-script/backend.js'),'utf8')+`
  function ss_(){ return __SS; } function applySeeds_(){}
  return {doPost,doGet,studio_,pay_,billing_,prorate_,finalMonth_,billTick_,billGet_,billAll_,billView_,billLaunch_,billCancel_,billWebhook_,billCreateFromAgreement_,billCounts_,billByKey_,setFake:f=>{SQ_FAKE=f}, botAuthed_, BOTS};`;
  const B=new Function(...Object.keys(g),'__SS',code)(...Object.values(g),SS);
  // fake Square
  const S=H.sq; let n=0; const id=p=>p+(++n).toString().padStart(6,'0');
  B.setFake((method,path,body,env)=>{
    S.calls++;
    if(body&&body.idempotency_key&&S.idem[path+body.idempotency_key]){ return JSON.parse(JSON.stringify(S.idem[path+body.idempotency_key])); }
    let res;
    if(path==='/v2/locations') res={ok:true,locations:[{id:'LOC1',status:'ACTIVE'}]};
    else if(path==='/v2/customers'&&method==='post') res={ok:true,customer:{id:id('CUST')}};
    else if(path==='/v2/cards'&&method==='post'){ if(/declined/.test(body.source_id)) res={ok:false,status:400,errors:[{code:'CARD_DECLINED',detail:'Card declined.'}]}; else { const c={id:id('ccof:'),card_brand:'VISA',last_4:'1111',exp_month:12,exp_year:2030}; S.cards[c.id]=c; res={ok:true,card:c}; } }
    else if(/\/v2\/cards\/.*\/disable/.test(path)) res={ok:true};
    else if(path==='/v2/payments'&&method==='post'){
      const declined=S.declineCards.has(body.source_id)||/declined/.test(body.source_id);
      const p={id:id('PAY'),status:declined?'FAILED':'COMPLETED',amount_money:body.amount_money,source:body.source_id,reference_id:body.reference_id,receipt_url:'https://squareup.com/receipt/x'};
      if(!declined) S.payments[p.id]=p;
      res=declined?{ok:false,status:400,payment:p,errors:[{code:'CARD_DECLINED',detail:'Card declined.'}]}:{ok:true,payment:p};
      if(body.idempotency_key) S.idem[path+body.idempotency_key]=res;
      if(S.loseNextResponse){ S.loseNextResponse=false; return {ok:false,status:0,network:true,errors:[{code:'NETWORK'}]}; }
      return JSON.parse(JSON.stringify(res));
    }
    else if(path.startsWith('/v2/payments/')){ const p=S.payments[path.split('/')[3]]; res=p?{ok:true,payment:p}:{ok:false,status:404,errors:[{code:'NOT_FOUND'}]}; }
    else if(path.startsWith('/v2/refunds')&&method==='get') res={ok:true,refunds:S.refunds};
    else if(path==='/v2/refunds') { const r={id:id('RF'),payment_id:body.payment_id,status:'COMPLETED',amount_money:body.amount_money}; S.refunds.push(r); S.payments[body.payment_id].refunded_money=body.amount_money; res={ok:true,refund:r}; }
    else if(path==='/v2/disputes') res={ok:true,disputes:S.disputes};
    else res={ok:false,status:404,errors:[{code:'UNHANDLED',detail:method+' '+path}]};
    if(body&&body.idempotency_key) S.idem[path+body.idempotency_key]=res;
    return JSON.parse(JSON.stringify(res));
  });
  H.props.SQUARE_TOKEN_SANDBOX='x'; H.props.SQUARE_APP_SANDBOX='sandbox-sq0idp-test';
  return {B,H};
}
module.exports={load};
