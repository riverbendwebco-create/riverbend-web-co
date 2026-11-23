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

// ===== Cancellation refunds (owner approval) =====
const R2=[]; const ok2=(n,c,i='')=>R2.push({n,c:!!c,i:String(i)});
const props=(a)=>a.refunds||[];
function upfront(){ return setup('custom-once','2026-10-10','2026-10-05'); }
// normal cancellation: no refund proposed, no customer charge after effective date
{ const {B,H,id}=upfront(); days(B,H,'2026-10-11','2026-11-15'); B.billCancel_(id,'2026-11-15',true); days(B,H,'2026-11-16','2027-01-05'); const a=B.billGet_(id);
  ok2('Normal notice (Nov 15, effective Dec 15): no refund proposed, $36.29 final, nothing after Dec 15',props(a).length===0&&!paidCharges(a).some(c=>c.period>'2026-12')&&paidCharges(a).filter(c=>c.period==='2026-12').length===1); }
// late-recorded notice: Dec 3 records notice dated Nov 1 -> effective Dec 1, December $75 collected for 1 day
{ const {B,H,id}=upfront(); days(B,H,'2026-10-11','2026-12-03'); H.mails.length=0;
  const pv=B.billCancel_(id,'2026-11-01',false).preview;
  ok2('Preview warns: refund of $72.58 will be proposed for owner approval',pv.refund===7258&&/owner approval/.test(pv.text),pv.text);
  B.billCancel_(id,'2026-11-01',true); let a=B.billGet_(id); const f=props(a)[0];
  ok2('Late notice: one proposal, Dec payment $75, 1 of 31 days used = $2.42 owed, refund $72.58',props(a).length===1&&f.paid===7500&&f.days===1&&f.owed===242&&f.amount===7258&&f.status==='proposed',JSON.stringify(f));
  const m=H.mails.find(x=>/Refund needs approval/.test(x.subject));
  ok2('Owners emailed with customer, cancellation dates, payments collected and proposed refund',m&&/Customer: Biz/.test(m.body)&&/December 1, 2026/.test(m.body)&&/Payments collected/.test(m.body)&&/\$72\.58/.test(m.body),m&&m.subject);
  days(B,H,'2026-12-04','2026-12-10'); a=B.billGet_(id);
  ok2('Daily job never refunds by itself and does not propose it twice',props(a).length===1&&props(a)[0].status==='proposed'&&H.sq.refunds.length===0&&H.mails.filter(x=>/Refund needs approval/.test(x.subject)).length===1);
  ok2('Approval needs the typed confirmation',B.billRefund_(id,f.id,true,'yes','kruz').error==='confirm'&&H.sq.refunds.length===0);
  H.sq.loseNextResponse=true; let r=B.billRefund_(id,f.id,true,'REFUND','kruz@riverbendwebco.com');
  ok2('Square answer lost: refund stays "sending", not marked done',!r.ok&&B.billGet_(id).refunds[0].status==='sending');
  r=B.billRefund_(id,f.id,true,'REFUND','kruz@riverbendwebco.com');
  ok2('Approve again: same idempotency key, Square returns the same refund (one refund total)',r.ok&&H.sq.refunds.length===1&&H.sq.refunds[0].amount_money.amount===7258);
  r=B.billRefund_(id,f.id,true,'REFUND','rayaldally@gmail.com');
  ok2('Second owner approving the same refund: nothing sent again',r.ok&&r.already&&H.sq.refunds.length===1);
  days(B,H,'2026-12-11','2027-02-03'); a=B.billGet_(id);
  ok2('After the refund: no new proposal, nothing charged after Dec 1, billing ended',props(a).length===1&&props(a)[0].status==='done'&&!paidCharges(a).some(c=>c.period>'2026-12')&&a.status==='ended'&&H.sq.refunds.length===1); }
// very late: recorded Jan 5 for a notice dated Nov 1 -> Dec and Jan both collected in full
{ const {B,H,id}=upfront(); days(B,H,'2026-10-11','2027-01-05'); B.billCancel_(id,'2026-11-01',true); days(B,H,'2027-01-06','2027-02-05'); const a=B.billGet_(id), rf=props(a);
  const dec=rf.find(x=>x.period==='2026-12'), jan=rf.find(x=>x.period==='2027-01');
  ok2('Very late notice: Dec refund $72.58 and full Jan refund $75.00 proposed; no Feb charge',rf.length===2&&dec.amount===7258&&jan.amount===7500&&jan.owed===0&&!paidCharges(a).some(c=>c.period>'2027-01'),JSON.stringify(rf)); }
// month-end: notice Dec 1 -> effective Dec 31 (the regular December payment covers exactly through Dec 31)
{ const {B,H,id}=upfront(); days(B,H,'2026-10-11','2026-12-01'); B.billCancel_(id,'2026-12-01',true); days(B,H,'2026-12-02','2027-02-03'); const a=B.billGet_(id);
  ok2('Month-end: notice Dec 1, effective Dec 31: no refund, one $75 December payment, nothing in January',props(a).length===0&&paidCharges(a).filter(c=>c.period==='2026-12').length===1&&!paidCharges(a).some(c=>c.period>'2026-12')); }
// month-end: notice Jan 29 -> effective Feb 28 (last day of February)
{ const {B,H,id}=upfront(); days(B,H,'2026-10-11','2027-01-29'); B.billCancel_(id,'2027-01-29',true); days(B,H,'2027-01-30','2027-04-03'); const a=B.billGet_(id), feb=paidCharges(a).filter(c=>c.period==='2027-02');
  ok2('Month-end: notice Jan 29, effective Feb 28: February billed once at the full $75 (all 28 days), no refund, nothing in March',props(a).length===0&&feb.length===1&&feb[0].amount===7500&&!paidCharges(a).some(c=>c.period>'2027-02'),JSON.stringify(feb)); }
// 31-day month: notice Dec 1 recorded on Dec 1, plus Jan 31 effective from Jan 1 notice
{ const {B,H,id}=upfront(); days(B,H,'2026-10-11','2026-12-02'); B.billCancel_(id,'2026-12-02',true); days(B,H,'2026-12-03','2027-02-03'); const a=B.billGet_(id), jan=paidCharges(a).filter(c=>c.period==='2027-01');
  ok2('Notice Dec 2, effective Jan 1: final Jan 1 charge $75 x 1/31 = $2.42 only, no refund',props(a).length===0&&jan.length===1&&jan[0].amount===242&&jan[0].kind==='final',JSON.stringify(jan)); }
// Square bills the 1st before our job sees the cancel (race): we wait a day and never double charge
{ const {B,H,id}=upfront(); days(B,H,'2026-10-11','2026-12-01'); B.billCancel_(id,'2026-12-01',true); const a=B.billGet_(id);
  ok2('Notice on the 1st: our job makes no extra December charge (Square\'s December payment covers it)',paidCharges(a).filter(c=>c.period==='2026-12').length===1&&!a.charges.some(c=>c.kind==='final')); }
// $0 Down inside the commitment: no automatic refund logic, owner review only
{ const {B,H,id}=setup('starter-zero','2026-11-16','2026-11-10'); days(B,H,'2026-11-17','2027-02-05'); B.billCancel_(id,'2027-02-05',true); const a=B.billGet_(id);
  ok2('$0 Down during the commitment: owner review, no refund proposal, nothing charged automatically for the balance',a.cancel.mode==='review'&&props(a).length===0); }
{ const {B,H,id}=upfront(); H.props.AUTH_USERS=JSON.stringify({'kruz@riverbendwebco.com':{email:'kruz@riverbendwebco.com',role:'owner',status:'active'},'rayaldally@gmail.com':{email:'rayaldally@gmail.com',role:'owner',status:'active'},'owen@riverbendwebco.com':{email:'owen@riverbendwebco.com',role:'sales',status:'active'}});
  days(B,H,'2026-10-11','2026-12-03'); H.mails.length=0; B.billCancel_(id,'2026-11-01',true); const m=H.mails.find(x=>/Refund needs approval/.test(x.subject));
  ok2('Refund email goes to Kruz, Rayald and riverbendwebco@gmail.com, never to the salesperson',m&&/kruz@riverbendwebco\.com/.test(m.to)&&/rayaldally@gmail\.com/.test(m.to)&&/riverbendwebco@gmail\.com/.test(m.to)&&!/owen/.test(m.to),m&&m.to); }
R2.forEach(r=>console.log((r.c?'PASS ':'FAIL ')+r.n+(r.i&&!r.c?'  ['+r.i+']':''))); console.log(R2.filter(r=>r.c).length+'/'+R2.length+' refund checks passed');
