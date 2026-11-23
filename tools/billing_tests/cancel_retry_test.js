// Cancellation mid-month after a paid month, and retries of launch/final charges.
const {load}=require('./harness');
const R=[]; const ok=(n,c,i='')=>R.push({n,c:!!c,i:String(i)});
const usd=c=>'$'+(c/100).toFixed(2);
function setup(plan,launch,signDay){ const {B,H}=load(); H.today=signDay; H.cache={};
  B.doPost({postData:{contents:JSON.stringify({kind:'agreement',fields:{'Plan Key':plan,'Plan':plan,'Business':'Biz','Owner':'O','Phone':'5635550100','Email':'o@b.co','Signed':'x'}})}});
  const a=B.billAll_()[0]; H.cache={}; B.pay_({action:'pay_card',key:a.payKey.split('#')[1],consent:true,source:'cnon:card-nonce-ok'});
  H.today=launch; B.billLaunch_(a.id,launch,true); return {B,H,id:a.id}; }
function days(B,H,from,to){ let d=from; while(d<=to){ H.today=d; B.billTick_(); const t=new Date(d+'T12:00:00Z'); t.setUTCDate(t.getUTCDate()+1); d=t.toISOString().slice(0,10);} }
const paidCharges=a=>a.charges.filter(c=>c.status==='paid'&&c.kind!=='setup');
const squareCharges=H=>Object.values(H.sq.payments).length;

// Q1a. Pay Upfront Custom ($75), launched Oct 10, Nov 1 paid by Square, notice Nov 15 -> effective Dec 15
{ const {B,H,id}=setup('custom-once','2026-10-10','2026-10-05');
  days(B,H,'2026-10-11','2026-11-15'); let a=B.billGet_(id);
  ok('Nov 1: regular $75 charged once by the Square subscription',paidCharges(a).filter(c=>c.period==='2026-11').length===1&&paidCharges(a).find(c=>c.period==='2026-11').amount===7500);
  const pv=B.billCancel_(id,'2026-11-15',false).preview;
  ok('Notice Nov 15 -> service ends Dec 15; final charge Dec 1 = $75 x 15/31 = $36.29',pv.effective==='2026-12-15'&&pv.finalAmount===3629,pv.text);
  B.billCancel_(id,'2026-11-15',true); days(B,H,'2026-11-16','2027-02-05'); a=B.billGet_(id);
  ok('Square subscription canceled before December (the day after the notice)',a.sq.subCanceled&&Object.values(H.sq.subs)[0].canceled_date==='2026-12-01');
  const per=p=>paidCharges(a).filter(c=>c.period===p);
  ok('November stays the one $75 charge (service was provided all of November; no credit owed)',per('2026-11').length===1);
  ok('December: exactly one charge, the $36.29 final prorated charge, no Square $75 invoice',per('2026-12').length===1&&per('2026-12')[0].kind==='final'&&per('2026-12')[0].amount===3629,JSON.stringify(per('2026-12')));
  ok('Nothing charged after Dec 15; billing ended',!paidCharges(a).some(c=>c.period>'2026-12')&&a.status==='ended');
}
// Q1b. Notice given ON the 1st (Dec 1) -> effective Dec 31 (same month already paid in full by Square)
{ const {B,H,id}=setup('custom-once','2026-10-10','2026-10-05');
  days(B,H,'2026-10-11','2026-12-01'); B.billCancel_(id,'2026-12-01',true); days(B,H,'2026-12-01','2027-02-03'); const a=B.billGet_(id);
  const dec=paidCharges(a).filter(c=>c.period==='2026-12');
  ok('Notice on the 1st: December paid once ($75, covers through Dec 31), no extra final charge, nothing in January',dec.length===1&&dec[0].amount===7500&&!paidCharges(a).some(c=>c.period>'2026-12'),JSON.stringify(dec));
}
// Q1c. Notice recorded late (owner records Dec 3 a notice dated Nov 1) -> effective Dec 1, but Square already billed December in full
{ const {B,H,id}=setup('custom-once','2026-10-10','2026-10-05');
  days(B,H,'2026-10-11','2026-12-03'); B.billCancel_(id,'2026-11-01',true); days(B,H,'2026-12-04','2027-01-03'); const a=B.billGet_(id);
  const dec=paidCharges(a).filter(c=>c.period==='2026-12');
  ok('LATE-RECORDED NOTICE: December was already charged $75 for 1 day of service ($2.42 owed): no automatic credit',dec.length===1&&dec[0].amount===7500,'gap: owner must refund the difference by hand');
}
// Q1d. $0 Down after the 12 payments: same notice rules as Pay Upfront
{ const {B,H,id}=setup('starter-zero','2026-11-16','2026-11-10');
  days(B,H,'2026-11-17','2027-11-20'); let a=B.billGet_(id); ok('$0 Down: 12 full payments made',B.billCounts_(a).full===12);
  const pv=B.billCancel_(id,'2027-11-20',false).preview; B.billCancel_(id,'2027-11-20',true); days(B,H,'2027-11-21','2028-01-05'); a=B.billGet_(id);
  const dec=paidCharges(a).filter(c=>c.period==='2027-12');
  ok('After the commitment: notice Nov 20 -> final Dec 1 charge $109 x 20/31 = $70.32, nothing after',pv.mode==='notice'&&dec.length===1&&dec[0].amount===7032&&!paidCharges(a).some(c=>c.period>'2027-12'),JSON.stringify(dec));
}
// Q2. Retries of a failed launch charge
function launchFail(retrySucceedsOn){ const {B,H}=load(); H.today='2026-11-10'; H.cache={};
  B.doPost({postData:{contents:JSON.stringify({kind:'agreement',fields:{'Plan Key':'premium-zero','Plan':'x','Business':'Biz','Owner':'O','Phone':'5635550100','Email':'o@b.co','Signed':'x'}})}});
  const a0=B.billAll_()[0]; H.cache={}; B.pay_({action:'pay_card',key:a0.payKey.split('#')[1],consent:true,source:'cnon:card-nonce-ok'});
  const card=B.billGet_(a0.id).sq.cardId; H.sq.declineCards.add(card);
  const attempts=[]; const orig=H.sq; // count Square charge attempts for this card
  H.today='2026-11-18'; B.billLaunch_(a0.id,'2026-11-18',true);
  let d='2026-11-19'; for(let i=0;i<10;i++){ H.today=d; if(d===retrySucceedsOn) H.sq.declineCards.delete(card); B.billTick_(); const t=new Date(d+'T12:00:00Z'); t.setUTCDate(t.getUTCDate()+1); d=t.toISOString().slice(0,10);} 
  const a=B.billGet_(a0.id), pc=a.charges.find(c=>c.kind==='prorated');
  return {a,pc,keys:Object.keys(H.sq.idem).filter(k=>k.startsWith('/v2/payments')&&k.includes('prorated')),paid:Object.values(H.sq.payments).filter(p=>p.amount_money.amount===pc.amount)}; }
{ const r=launchFail(null);
  ok('Launch charge keeps failing: tried at launch, then once on day 2 (Nov 20) and once on day 4 (Nov 22), then never again',r.keys.length===3&&r.pc.attempts===3&&r.pc.status==='failed',r.keys.join(' | '));
  ok('Each attempt uses its own Square idempotency key (rb-<account>-prorated-1, -2, -3)',r.keys.every((k,i)=>k.endsWith('-prorated-'+(i+1))));
}
{ const r=launchFail('2026-11-20');
  ok('Retry succeeds on day 2: exactly one successful charge, no day-4 retry, account current',r.paid.length===1&&r.pc.status==='paid'&&r.keys.length===2&&B_ok(r));
}
function B_ok(r){ return !r.a.charges.some(c=>c.status==='failed'); }
{ const {B,H}=load(); H.today='2026-11-10'; H.cache={};
  B.doPost({postData:{contents:JSON.stringify({kind:'agreement',fields:{'Plan Key':'custom-zero','Plan':'x','Business':'Biz','Owner':'O','Phone':'5635550100','Email':'o@b.co','Signed':'x'}})}});
  const a0=B.billAll_()[0]; H.cache={}; B.pay_({action:'pay_card',key:a0.payKey.split('#')[1],consent:true,source:'cnon:card-nonce-ok'});
  const card=B.billGet_(a0.id).sq.cardId; H.sq.declineCards.add(card); H.today='2026-11-18'; B.billLaunch_(a0.id,'2026-11-18',true);
  H.sq.declineCards.delete(card); H.sq.loseNextResponse=true; H.today='2026-11-20'; B.billTick_();
  let a=B.billGet_(a0.id); const st1=a.charges.find(c=>c.kind==='prorated').status;
  H.today='2026-11-21'; B.billTick_(); a=B.billGet_(a0.id); const pc=a.charges.find(c=>c.kind==='prorated');
  ok('Retry where Square charged but the answer was lost: next check resends the SAME key, Square returns the same payment, one charge total',st1==='unknown'&&pc.status==='paid'&&Object.values(H.sq.payments).filter(p=>p.amount_money.amount===pc.amount).length===1);
  // client updates card while a retry is pending: still one charge
  H.today='2026-11-22'; B.billTick_(); a=B.billGet_(a0.id);
  ok('Paid charge is never retried again',a.charges.filter(c=>c.kind==='prorated').length===1&&Object.values(H.sq.payments).filter(p=>p.amount_money.amount===pc.amount).length===1);
}
{ // card updated by the client during the retry window: one charge, then no retry
  const {B,H}=load(); H.today='2026-11-10'; H.cache={};
  B.doPost({postData:{contents:JSON.stringify({kind:'agreement',fields:{'Plan Key':'starter-zero','Plan':'x','Business':'Biz','Owner':'O','Phone':'5635550100','Email':'o@b.co','Signed':'x'}})}});
  const a0=B.billAll_()[0]; const key=a0.payKey.split('#')[1]; H.cache={}; B.pay_({action:'pay_card',key,consent:true,source:'cnon:card-nonce-ok'});
  const card=B.billGet_(a0.id).sq.cardId; H.sq.declineCards.add(card); H.today='2026-11-18'; B.billLaunch_(a0.id,'2026-11-18',true);
  H.today='2026-11-19'; H.cache={}; B.pay_({action:'pay_card',key,consent:true,source:'cnon:card-nonce-ok'});
  days(B,H,'2026-11-20','2026-11-25'); const a=B.billGet_(a0.id), pc=a.charges.find(c=>c.kind==='prorated');
  ok('Client updates the card on day 1: launch charge paid once with the new card, no later retries',pc.status==='paid'&&Object.values(H.sq.payments).filter(p=>p.amount_money.amount===pc.amount).length===1);
}
// Q2b. Failed FINAL prorated charge: same retry rule
{ const {B,H,id}=setup('custom-once','2026-10-10','2026-10-05');
  days(B,H,'2026-10-11','2026-11-15'); B.billCancel_(id,'2026-11-15',true); days(B,H,'2026-11-16','2026-11-30');
  const card=B.billGet_(id).sq.cardId; H.sq.declineCards.add(card); days(B,H,'2026-12-01','2026-12-03'); H.sq.declineCards.delete(card); days(B,H,'2026-12-04','2026-12-20');
  const a=B.billGet_(id), f=a.charges.find(c=>c.kind==='final');
  ok('Final prorated charge fails Dec 1, retry Dec 3 fails, retry Dec 5 succeeds: one $36.29 charge total',f.status==='paid'&&f.attempts===3&&Object.values(H.sq.payments).filter(p=>p.amount_money.amount===3629).length===1,JSON.stringify(f));
}
R.forEach(r=>console.log((r.c?'PASS ':'FAIL ')+r.n+(r.i&&!r.c?'  ['+r.i+']':'')+(r.c&&/LATE|gap/.test(r.n+r.i)?'  ['+r.i+']':''))); console.log(R.filter(r=>r.c).length+'/'+R.length+' passed');
