const {load}=require('./harness');
const R=[]; const ok=(name,pass,info='')=>R.push({name,pass:!!pass,info:String(info)});
const usd=c=>'$'+(c/100).toFixed(2);
function sign(B,H,plan,biz){
  H.cache={};
  const r=B.doPost({postData:{contents:JSON.stringify({kind:'agreement',fields:{'Plan Key':plan,'Plan':plan,'Business':biz,'Owner':'Pat Owner','Phone':'(563) 555-0100','Email':'pat@example.com','Signed':'Nov 10, 2026'}})}});
  const j=JSON.parse(r.text); const acct=B.billAll_().filter(a=>a.business===biz)[0];
  return {resp:j, acct, key:acct.payKey.split('#')[1]};
}
function pay(B,H,key,source='cnon:card-nonce-ok'){ H.cache={}; return B.pay_({action:'pay_card',key,consent:true,source}); }
function tickRange(B,H,from,to,id){ let d=from; const out=[]; while(d<=to){ H.today=d; out.push(B.billTick_('',null)); const t=new Date(d+'T12:00:00Z'); t.setUTCDate(t.getUTCDate()+1); d=t.toISOString().slice(0,10);} return out; }

/* 1. Proration table */
{ const {B}=load();
  const dates=[['2026-11-01','Nov 1'],['2026-11-16','Nov 16'],['2026-11-30','Nov 30'],['2027-02-15','Feb 15 (normal year)'],['2028-02-15','Feb 15 (leap year)'],['2026-12-31','Dec 31']];
  const prices=[['Starter $0 down',10900],['Starter upfront',5000],['Custom $0 down',17900],['Custom upfront',7500],['Premium $0 down',34900],['Premium upfront',10000]];
  const table=[]; dates.forEach(([d,l])=>{ const row=[l]; prices.forEach(([n,p])=>{ const x=B.prorate_(p,d); row.push(usd(x.amount)+(x.full?' (full)':'')); }); table.push(row); });
  require('fs').writeFileSync(require('os').tmpdir()+'/rb-prorate.json',JSON.stringify({dates,prices,table}));
  const exp={'2026-11-16':[5450,2500,8950,3750,17450,5000],'2026-11-01':[10900,5000,17900,7500,34900,10000],'2026-11-30':[363,167,597,250,1163,333],'2027-02-15':[5450,2500,8950,3750,17450,5000],'2028-02-15':[5638,2586,9259,3879,18052,5172],'2026-12-31':[352,161,577,242,1126,323]};
  Object.entries(exp).forEach(([d,v])=>{ const got=prices.map(([n,p])=>B.prorate_(p,d).amount); ok('Proration '+d+': '+got.map(usd).join(', '),JSON.stringify(got)===JSON.stringify(v),'expected '+v.map(usd).join(', ')); });
}

/* 2. Six options: signing + payment setup */
{ const {B,H}=load(); H.today='2026-11-10';
  const plans=[['starter-zero',0,10900],['starter-once',49900,5000],['custom-zero',0,17900],['custom-once',99900,7500],['premium-zero',0,34900],['premium-once',249900,10000]];
  plans.forEach(([k,setup,mo])=>{
    const s=sign(B,H,k,'Biz '+k);
    ok(k+': agreement creates billing account, nothing charged at signing',s.acct.status==='awaiting_card'&&s.acct.charges.length===0&&s.acct.monthly===mo&&s.acct.setup===setup);
    ok(k+': payment link is NOT shown to the client while in test mode',s.resp.ok&&s.resp.pay==='');
    H.cache={}; const info=B.pay_({action:'pay_info',key:s.key});
    ok(k+': payment page shows schedule and consent',info.ok&&info.info.lines.length>=2&&/authorize/.test(info.info.consent)&&info.info.setupDue===setup,info.info&&info.info.lines[0]);
    const before=Object.keys(H.sq.payments).length;
    const r=pay(B,H,s.key); const a=B.billGet_(s.acct.id); const made=Object.values(H.sq.payments).slice(before);
    if(setup) ok(k+': setup fee '+usd(setup)+' charged right after card authorization',r.ok&&made.length===1&&made[0].amount_money.amount===setup&&a.setupPaid&&a.status==='building');
    else ok(k+': $0 down card saved, $0 charged',r.ok&&made.length===0&&a.status==='building'&&a.sq.cardId);
  });
  H.cache={}; ok('Payment page rejects a wrong link',B.pay_({action:'pay_info',key:'0'.repeat(48)}).error==='notfound');
  H.cache={}; const s2=sign(B,H,'starter-zero','No consent'); H.cache={};
  ok('Card is not saved without the consent checkbox',B.pay_({action:'pay_card',key:s2.key,consent:false,source:'cnon:card-nonce-ok'}).error==='consent');
  const s3=sign(B,H,'custom-once','Declined setup'); const r3=pay(B,H,s3.key,'cnon:card-nonce-declined');
  ok('Declined card at setup: client sees an error, nothing charged, account still waiting',!r3.ok&&B.billGet_(s3.acct.id).status==='awaiting_card');
  ok('Raw card numbers never stored (only Square IDs)',!JSON.stringify(B.billAll_()).match(/\b4111|\d{13,19}\b/));
}

/* 3. Launch activation, duplicate clicks, launch date rules */
{ const {B,H}=load(); H.today='2026-11-10';
  const s=sign(B,H,'starter-zero','Launch Co'); pay(B,H,s.key);
  H.today='2026-11-16';
  const pv=B.billLaunch_(s.acct.id,'2026-11-16',false);
  ok('Go Live confirmation shows customer, package, date, prorated amount, first full date, monthly rate',pv.preview.business==='Launch Co'&&pv.preview.packageName==='Starter'&&pv.preview.launch==='2026-11-16'&&pv.preview.amount===5450&&pv.preview.firstFull==='2026-12-01'&&pv.preview.monthly===10900,JSON.stringify(pv.preview));
  ok('Preview charges nothing',Object.keys(H.sq.payments).length===0);
  ok('Launch date in the future is refused',B.billLaunch_(s.acct.id,'2026-11-20',true).error==='future');
  ok('Launch date in an earlier month is refused',B.billLaunch_(s.acct.id,'2026-10-31',true).error==='month');
  const a1=B.billLaunch_(s.acct.id,'2026-11-16',true), a2=B.billLaunch_(s.acct.id,'2026-11-16',true), a3=B.billLaunch_(s.acct.id,'2026-11-16',true);
  const pays=Object.values(H.sq.payments);
  ok('Website Live: $54.50 prorated charge on Nov 16',a1.charged.amount===5450&&a1.charged.status==='paid');
  ok('Duplicate Go Live clicks: still exactly one charge',pays.length===1&&a2.already&&a3.already);
  const v=B.billView_(B.billGet_(s.acct.id));
  ok('Dashboard after launch: next bill Dec 1 $109, 0 of 12, 12 remaining',v.nextDate==='2026-12-01'&&v.nextAmount===10900&&v.fullPaid===0&&v.remaining===12,v.nextText);
  ok('Customer receipt sent for launch payment',H.mails.some(m=>/Receipt: \$54\.50/.test(m.subject)));
  ok('Test-mode customer emails go only to Riverbend',H.mails.filter(m=>/\[TEST to/.test(m.subject)).every(m=>m.to==='riverbendwebco@gmail.com'));
  const noCard=sign(B,H,'custom-zero','No card yet');
  ok('Cannot activate billing before the client sets up payment',B.billLaunch_(noCard.acct.id,'2026-11-16',true).error==='nocard');
  const up=sign(B,H,'starter-once','Upfront Co'); pay(B,H,up.key);
  const u1=B.billLaunch_(up.acct.id,'2026-11-16',true);
  ok('Starter upfront launch Nov 16: $25.00, then $50 Dec 1',u1.charged.amount===2500&&B.billView_(B.billGet_(up.acct.id)).nextAmount===5000);
}

/* 4. Launch on the 1st */
{ const {B,H}=load(); H.today='2026-11-20';
  const s=sign(B,H,'premium-zero','First Day Co'); pay(B,H,s.key);
  H.today='2026-12-01'; const r=B.billLaunch_(s.acct.id,'2026-12-01',true);
  const a=B.billGet_(s.acct.id);
  ok('Launch on Dec 1: full $349 once, no separate prorated charge',r.charged.amount===34900&&a.charges.length===1&&a.charges[0].kind==='full');
  ok('Launch-on-1st charge counts as full payment 1 of 12',B.billCounts_(a).full===1);
  tickRange(B,H,'2026-12-01','2027-01-02');
  ok('No second charge on Dec 1; next charge Jan 1',B.billGet_(s.acct.id).charges.map(c=>c.period).join()==='2026-12,2027-01');
}

/* 5. Full 12-payment cycle, renewals, ownership */
{ const {B,H}=load(); H.today='2026-11-10';
  const s=sign(B,H,'starter-zero','Twelve Co'); pay(B,H,s.key);
  H.today='2026-11-16'; B.billLaunch_(s.acct.id,'2026-11-16',true);
  tickRange(B,H,'2026-11-16','2027-12-05');
  const a=B.billGet_(s.acct.id), full=a.charges.filter(c=>c.kind==='full');
  ok('Monthly charges only on the 1st: Dec 1, 2026 through Dec 1, 2027',full.every(c=>c.due.endsWith('-01'))&&full[0].due==='2026-12-01'&&full[11].due==='2027-11-01',full.map(c=>c.due).join(' '));
  ok('Exactly one charge per month (13 full by Dec 2027), prorated tracked separately',full.length===13&&a.charges.filter(c=>c.kind==='prorated').length===1);
  H.today='2027-10-15'; // check midpoint view via counts
  const v=B.billView_(a,'2027-12-05');
  ok('After payment #12 (Nov 1, 2027): ownership eligible, continues month-to-month',v.ownershipEligible&&v.fullPaid===13&&v.remaining===0&&a.status==='active',v.ownership);
  const b=JSON.parse(JSON.stringify(a)); b.charges=b.charges.filter(c=>c.due<='2027-10-01');
  ok('After 11 full payments: not eligible yet ("1 more")',!B.billView_(b).ownershipEligible&&/1 more full payment/.test(B.billView_(b).ownership),B.billView_(b).ownership);
  ok('Receipts say "payment N of 12"',H.mails.some(m=>/Full monthly payment 12 of 12/.test(m.body||'')));
}

/* 6. Failed monthly payment: reminders, grace, past due, suspension approval, card update */
{ const {B,H}=load(); H.today='2026-11-10';
  const s=sign(B,H,'custom-zero','Decline Co'); pay(B,H,s.key);
  H.today='2026-11-16'; B.billLaunch_(s.acct.id,'2026-11-16',true);
  const a0=B.billGet_(s.acct.id); H.sq.declineCards.add(a0.sq.cardId);
  H.mails.length=0;
  const log=[]; let d='2026-12-01';
  for(let i=0;i<16;i++){ H.today=d; const m0=H.mails.length; B.billTick_(); const a=B.billGet_(s.acct.id); log.push(d.slice(8)+': '+H.mails.slice(m0).map(m=>m.subject.replace(/\[TEST[^\]]*\] /,'')).join(' | ')+' => '+B.billView_(a).payStatus); const t=new Date(d+'T12:00:00Z'); t.setUTCDate(t.getUTCDate()+1); d=t.toISOString().slice(0,10); }
  require('fs').writeFileSync(require('os').tmpdir()+'/rb-dunning.txt',log.join('\n'));
  const a=B.billGet_(s.acct.id), ch=a.charges.find(c=>c.period==='2026-12');
  ok('Dec 1 failure: client notified right away',/did not go through/.test(log[0]));
  ok('Dec 3: retry + reminder',ch.attempts>=2&&/Reminder/.test(log[2]));
  ok('Dec 5: retry, grace period ends',ch.attempts===3);
  ok('Dec 6: marked past due, no late fee added',/past due/.test(log[5])&&B.billView_(a).pastDue===17900);
  ok('Dec 10: final suspension warning',/Final notice/.test(log[9]));
  ok('Dec 15: suspension needs owner approval (nothing automatic)',/approval/.test(log[14])&&a.flags.suspendEligible&&!a.flags.suspended);
  ok('Failed payment does not count toward 12',B.billCounts_(a).full===0);
  ok('No duplicate emails on days without a stage',log[1].split('=>')[0].trim()==='02:'&&log[3].split('=>')[0].trim()==='04:');
  H.sq.declineCards.clear(); H.today='2026-12-16';
  const r=pay(B,H,s.key); const a2=B.billGet_(s.acct.id);
  ok('Client updates card: balance charged once, account current, counts as payment 1',r.ok&&B.billView_(a2).payStatus==='Current'&&B.billCounts_(a2).full===1&&!a2.flags.suspendEligible);
}

/* 7. Failed launch payment uses the launch date */
{ const {B,H}=load(); H.today='2026-11-10';
  const s=sign(B,H,'premium-once','Launch Fail'); pay(B,H,s.key);
  const a0=B.billGet_(s.acct.id); H.sq.declineCards.add(a0.sq.cardId); H.mails.length=0;
  H.today='2026-11-18'; const r=B.billLaunch_(s.acct.id,'2026-11-18',true);
  ok('Failed launch payment: marked unpaid, owner and client notified immediately',r.charged.status==='failed'&&H.mails.some(m=>/Billing: Payment failed/.test(m.subject))&&H.mails.some(m=>/did not go through/.test(m.subject)));
  tickRange(B,H,'2026-11-19','2026-11-24');
  const a=B.billGet_(s.acct.id), ch=a.charges[1];
  ok('Launch-payment reminders follow its real due date (Nov 18: reminder Nov 20, past due Nov 23)',ch.notices.remind&&ch.notices.pastdue&&B.billView_(a).payStatus==='Past due');
}

/* 8. Lost Square response: no double charge */
{ const {B,H}=load(); H.today='2026-11-10';
  const s=sign(B,H,'starter-zero','Network Co'); pay(B,H,s.key);
  H.sq.loseNextResponse=true; H.today='2026-11-16'; const r=B.billLaunch_(s.acct.id,'2026-11-16',true);
  ok('Square answer lost: charge marked "unknown", not failed',r.charged.status==='unknown');
  H.today='2026-11-17'; B.billTick_();
  const a=B.billGet_(s.acct.id);
  ok('Next check resends the same request: Square returns the original payment, one charge total',a.charges[0].status==='paid'&&Object.keys(H.sq.payments).length===1);
}

/* 9. Refunds and disputes stop counting; webhooks are only a nudge */
{ const {B,H}=load(); H.today='2026-11-10';
  const s=sign(B,H,'starter-zero','Refund Co'); pay(B,H,s.key); H.today='2026-11-16'; B.billLaunch_(s.acct.id,'2026-11-16',true);
  tickRange(B,H,'2026-12-01','2027-01-01');
  let a=B.billGet_(s.acct.id); ok('Two full payments counted',B.billCounts_(a).full===2);
  const p1=a.charges.find(c=>c.period==='2026-12').paymentId;
  H.sq.refunds.push({payment_id:p1,status:'COMPLETED',amount_money:{amount:10900}});
  H.today='2027-01-02'; B.billTick_(); a=B.billGet_(s.acct.id);
  ok('Refunded payment no longer counts (daily check catches it even with no webhook)',B.billCounts_(a).full===1);
  const p2=a.charges.find(c=>c.period==='2027-01').paymentId;
  H.sq.disputes.push({state:'EVIDENCE_REQUIRED',disputed_payment:{payment_id:p2}}); B.billTick_(); a=B.billGet_(s.acct.id);
  ok('Disputed (chargeback) payment no longer counts',B.billCounts_(a).full===0);
  const before=JSON.stringify(B.billAll_());
  B.billWebhook_({type:'payment.updated',event_id:'e',merchant_id:'m',data:{object:{payment:{id:'FAKEPAYMENT123',status:'COMPLETED'}}}});
  ok('Fake webhook for an unknown payment changes nothing',JSON.stringify(B.billAll_())===before);
}

/* 10. Cancellations */
{ const {B,H}=load(); H.today='2026-11-10';
  const s=sign(B,H,'starter-once','Cancel Up'); pay(B,H,s.key); H.today='2026-11-16'; B.billLaunch_(s.acct.id,'2026-11-16',true);
  tickRange(B,H,'2026-11-17','2026-11-20');
  const pv=B.billCancel_(s.acct.id,'2026-11-20',false);
  ok('Upfront cancel notice Nov 20: effective Dec 20, final Dec 1 charge $32.26 (20 of 31 days)',pv.preview.effective==='2026-12-20'&&pv.preview.finalAmount===3226,pv.preview.text);
  B.billCancel_(s.acct.id,'2026-11-20',true); tickRange(B,H,'2026-11-21','2027-02-03');
  const a=B.billGet_(s.acct.id);
  ok('Final prorated charge on Dec 1, nothing after, billing ended',a.charges.map(c=>c.kind+':'+c.amount).join()==='setup:49900,prorated:2500,final:3226'&&a.status==='ended');
  const z=sign(B,H,'premium-zero','Cancel Zero'); H.today='2027-02-03'; pay(B,H,z.key); B.billLaunch_(z.acct.id,'2027-02-03',true);
  tickRange(B,H,'2027-02-04','2027-04-02');
  const n0=Object.keys(H.sq.payments).length;
  const zp=B.billCancel_(z.acct.id,'2027-04-02',false);
  ok('$0-down early cancel: shows 10 remaining ($3,490.00) for owner review',zp.preview.mode==='review'&&zp.preview.remaining===10&&zp.preview.remainingAmount===349000,zp.preview.text);
  B.billCancel_(z.acct.id,'2027-04-02',true);
  ok('Early cancel never charges the remaining balance automatically',Object.keys(H.sq.payments).length===n0&&H.mails.some(m=>/Cancellation request needs review/.test(m.subject)));
  tickRange(B,H,'2027-04-03','2027-05-01');
  ok('Billing keeps running monthly until an owner decides',B.billGet_(z.acct.id).charges.some(c=>c.period==='2027-05'));
  ok('End billing needs the typed confirmation',B.billing_({action:'billing_end',id:z.acct.id,confirmText:'yes'}).error==='confirm'&&B.billing_({action:'billing_end',id:z.acct.id,confirmText:'END BILLING'}).ok);
  tickRange(B,H,'2027-06-01','2027-06-01');
  ok('Ended account is not charged again',!B.billGet_(z.acct.id).charges.some(c=>c.period==='2027-06'));
}

/* 11. Access control */
{ const {B,H}=load();
  ok('Billing actions need the owner password',B.studio_({action:'billing_list',token:'a'.repeat(64)}).error==='auth');
  H.cache['bot_'+'b'.repeat(64)]='leads';
  ok('Lead robot cannot touch billing',B.studio_({action:'billing_tick',token:'b'.repeat(64)}).error==='auth');
  H.cache['bot_'+'c'.repeat(64)]='billing';
  ok('Billing robot can run the daily billing check',B.studio_({action:'billing_tick',token:'c'.repeat(64)}).ok);
  ok('Billing robot cannot list or change accounts',B.studio_({action:'billing_list',token:'c'.repeat(64)}).error==='auth'&&B.studio_({action:'billing_launch',token:'c'.repeat(64)}).error==='auth');
  ok('Going live needs the typed confirmation and production keys',B.billing_({action:'billing_settings',mode:'production',confirmText:'GO LIVE'}).error==='notready'&&B.billing_({action:'billing_settings',mode:'production'}).error==='confirm');
}
const pass=R.filter(r=>r.pass).length;
R.forEach(r=>console.log((r.pass?'PASS ':'FAIL ')+r.name+(r.pass?'':'  ['+r.info+']')));
console.log(pass+'/'+R.length+' passed');
require('fs').writeFileSync(require('os').tmpdir()+'/rb-results.json',JSON.stringify(R));
