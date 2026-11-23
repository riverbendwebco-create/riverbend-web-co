const {load}=require('./harness'); const crypto=require('crypto');
const R=[]; const ok=(n,c,i='')=>R.push({n,c:!!c,i:String(i)});
const {B,H}=load(); H.today='2026-11-23';
const call=b=>{ H.cache.auth_rate='0'; return B.doPost({postData:{contents:JSON.stringify(b)}}); }, J=r=>JSON.parse(r.text);
const A=b=>J(call(b)), S=b=>B.studio_(b);
const dk=(pw,salt)=>crypto.pbkdf2Sync(pw,salt,1000,32,'sha256').toString('hex'); // browser uses 600,000 rounds
const B32='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; const b32=s=>{let bits='';for(const c of s) bits+=B32.indexOf(c).toString(2).padStart(5,'0'); const o=[]; for(let i=0;i+8<=bits.length;i+=8) o.push(parseInt(bits.substr(i,8),2)); return Buffer.from(o); };
const totp=(sec,off=0)=>{ const c=Math.floor(Date.now()/30000)+off, m=Buffer.alloc(8); m.writeBigUInt64BE(BigInt(c)); const h=crypto.createHmac('sha1',b32(sec)).update(m).digest(), o=h[19]&15; return String(((h.readUInt32BE(o)&0x7fffffff)%1000000)).padStart(6,'0'); };
// owner invites (bootstrap a first owner directly)
const users={}; users['kruz@x.com']={email:'kruz@x.com',name:'Kruz Kitelinger',role:'owner',status:'invited',gen:1}; H.props.AUTH_USERS=JSON.stringify(users);
// setup link: simulate team invite flow by using the internal sender through a resend after making an owner session later; for the first owner write a setup token like authSendLink_ does
const link=crypto.randomBytes(32).toString('hex'); const u0=JSON.parse(H.props.AUTH_USERS); u0['kruz@x.com'].setupHash=crypto.createHash('sha256').update('setup:'+link).digest('hex'); u0['kruz@x.com'].setupExp=Date.now()+1e6; H.props.AUTH_USERS=JSON.stringify(u0);
let r=A({action:'auth_link_info',kind:'setup',link}); ok('Setup link shows who it is for',r.ok&&r.email==='kruz@x.com'&&r.owner);
const salt=r.salt; r=A({action:'auth_set_password',kind:'setup',link,salt,dk:dk('Correct-Horse-9',salt)});
ok('Owner sets their own password from the setup link',r.ok);
ok('Setup link works only once',!A({action:'auth_set_password',kind:'setup',link,salt,dk:dk('x',salt)}).ok);
const stored=JSON.parse(H.props.AUTH_USERS)['kruz@x.com'];
ok('Stored: unique salts and a hash only (no password, no reversible data)',stored.hash&&stored.sSalt&&stored.cSalt===salt&&!JSON.stringify(stored).includes('Correct-Horse'));
r=A({action:'auth_prelogin',email:'kruz@x.com'}); ok('Prelogin returns the account salt',r.salt===salt);
const fake=A({action:'auth_prelogin',email:'nobody@x.com'}); ok('Unknown email gets a believable salt (does not reveal accounts)',/^[a-f0-9]{32}$/.test(fake.salt)&&fake.salt===A({action:'auth_prelogin',email:'nobody@x.com'}).salt);
ok('Wrong password refused',A({action:'auth_login',email:'kruz@x.com',dk:dk('wrong',salt)}).error==='badlogin');
r=A({action:'auth_login',email:'kruz@x.com',dk:dk('Correct-Horse-9',salt)});
ok('Owner first sign-in must set up the authenticator (no session yet)',r.ok&&r.step==='mfa_enroll'&&!r.token&&/^otpauth:\/\/totp\//.test(r.uri));
ok('Wrong authenticator code refused at setup',A({action:'auth_mfa_enroll',pending:r.pending,code:'000000'}).error==='badcode');
const sec=r.secret; let e=A({action:'auth_mfa_enroll',pending:r.pending,code:totp(sec),trust:true});
ok('Authenticator set up: session created, 8 recovery codes shown once',e.ok&&e.token&&e.recovery.length===8&&e.user.role==='owner');
const kruzTok=e.token, rec=e.recovery;
ok('Recovery codes stored only as hashes',!JSON.stringify(JSON.parse(H.props.AUTH_USERS)).includes(rec[0].replace('-','')));
H.cache={};
r=A({action:'auth_login',email:'kruz@x.com',dk:dk('Correct-Horse-9',salt)}); ok('Later sign-in asks for the code',r.step==='mfa');
ok('Same code cannot be reused (replay blocked)',A({action:'auth_login',email:'kruz@x.com',dk:dk('Correct-Horse-9',salt),code:totp(sec)}).error==='badcode');
ok('Next code works',A({action:'auth_login',email:'kruz@x.com',dk:dk('Correct-Horse-9',salt),code:totp(sec,1)}).ok);
H.cache={}; r=A({action:'auth_login',email:'kruz@x.com',dk:dk('Correct-Horse-9',salt),recovery:rec[0]});
ok('Recovery code works once',r.ok&&r.token&&A({action:'auth_login',email:'kruz@x.com',dk:dk('Correct-Horse-9',salt),recovery:rec[0]}).error==='badcode');
const sess=Object.keys(H.props).filter(k=>k.startsWith('AUTH_S_'));
ok('Sessions stored as hashes of the token, with expiry',sess.length>=1&&!sess.some(k=>k.includes(kruzTok))&&JSON.parse(H.props[sess[0]]).x>Date.now());
ok('Trusted device session lasts about 30 days',sess.map(k=>JSON.parse(H.props[k])).some(x=>x.t&&x.x-Date.now()>29*864e5));
// lockout
H.cache={}; for(let i=0;i<6;i++) A({action:'auth_login',email:'kruz@x.com',dk:dk('bad'+i,salt)});
ok('Account locks for 15 minutes after 6 wrong tries',A({action:'auth_login',email:'kruz@x.com',dk:dk('Correct-Horse-9',salt)}).error==='locked');
H.cache={};
// owner invites Rayald and Owen
ok('Owner invites a second owner',S({action:'team_invite',token:kruzTok,email:'rayald@x.com',name:'Rayald Ally',role:'owner'}).ok);
ok('Owner invites a salesperson',S({action:'team_invite',token:kruzTok,email:'owen@x.com',name:'Owen Seffrood',role:'sales'}).ok);
const inv=H.mails.filter(m=>/Set up your Riverbend account/.test(m.subject));
ok('Invites are setup links, never passwords',inv.length===2&&inv.every(m=>/\/login\/#setup=[a-f0-9]{64}/.test(m.body)&&!/password:/i.test(m.body)));
const owenLink=inv.find(m=>m.to==='owen@x.com').body.match(/setup=([a-f0-9]{64})/)[1];
r=A({action:'auth_link_info',kind:'setup',link:owenLink}); A({action:'auth_set_password',kind:'setup',link:owenLink,salt:r.salt,dk:dk('Owen-Pass-123',r.salt)});
r=A({action:'auth_login',email:'owen@x.com',dk:dk('Owen-Pass-123',r.salt)});
ok('Salesperson signs in with password only',r.ok&&r.token&&r.user.role==='sales');
const owenTok=r.token;
// permissions: Owen calling owner endpoints directly
const owner=['billing_list','billing_get','billing_launch','billing_settings','billing_retry','billing_manual','billing_end','billing_cancel','billing_refund','billing_flag','billing_catalog','billing_postest','billing_selftest','billing_verify','billing_tick','billing_paylink','billing_findcard','billing_setup_inperson','team_list','team_invite','team_role','team_commission','team_legacy_off','team_mfa_reset','leads_key'];
const leaked=owner.filter(a=>{ const x=S({action:a,token:owenTok,id:'x',email:'owen@x.com',role:'owner'}); return !x||x.error!=='auth'; });
ok('Owen is refused on all '+owner.length+' owner-only endpoints (billing, Square settings, refunds, team, roles, Places key)',leaked.length===0,leaked.join());
ok('Owen cannot make himself an owner',JSON.parse(H.props.AUTH_USERS)['owen@x.com'].role==='sales');
ok('Owen can use the Studio',S({action:'list',token:owenTok}).ok);
ok('Owner can use billing',S({action:'billing_list',token:kruzTok}).ok);
// customers tagged to the signed-in rep; Owen sees only his
H.cache={}; B.doPost({postData:{contents:JSON.stringify({kind:'agreement',token:owenTok,fields:{'Plan Key':'starter-once','Plan':'x','Business':'Owen Client','Owner':'A','Phone':'5635550100','Email':'a@b.co','Signed':'x'}})}});
H.cache={}; B.doPost({postData:{contents:JSON.stringify({kind:'agreement',fields:{'Plan Key':'custom-zero','Plan':'x','Business':'Web Client','Owner':'B','Phone':'5635550101','Email':'b@b.co','Signed':'x'}})}});
H.cache={}; B.doPost({postData:{contents:JSON.stringify({kind:'agreement',fields:{'Plan Key':'custom-zero','Plan':'x','Business':'Fake Rep','Owner':'C','Phone':'5635550102','Email':'c@b.co','Signed':'x','rep':'owen@x.com'}})}});
let sc=S({action:'sales_customers',token:owenTok});
ok('Customer signed while Owen is logged in is assigned to Owen; others are not visible to him',sc.ok&&sc.customers.length===1&&sc.customers[0].business==='Owen Client');
ok('A form field cannot assign a customer to a rep',!B.billAll_().find(a=>a.business==='Fake Rep').rep);
ok('Owen sees progress but no company totals',sc.customers[0].progress&&sc.customers[0].rep===undefined&&sc.totalCommission===0&&sc.mrr===undefined);
S({action:'team_commission',token:kruzTok,bStarter:25,bCustom:50,bPremium:75,setupPct:0,monthlyPct:10,months:0});
const oc=B.billAll_().find(a=>a.business==='Owen Client'); H.cache={}; B.pay_({action:'pay_card',key:oc.payKey.split('#')[1],consent:true,source:'cnon:card-nonce-ok'});
sc=S({action:'sales_customers',token:owenTok});
ok('Commission before launch: card saved but website not live = $0 (bonus waits for launch)',sc.customers[0].commission===0,JSON.stringify(sc.customers[0]));
{ const a0=B.billAll_().find(a=>a.business==='Owen Client'); const t=a0.tier, mo=a0.monthly, bonus={starter:2500,custom:5000,premium:7500}[t];
  H.today='2026-11-18'; B.billLaunch_(a0.id,'2026-11-18',true); const pr=B.billGet_(a0.id).charges.find(c=>c.kind==='prorated').amount;
  sc=S({action:'sales_customers',token:owenTok});
  ok('Website live: '+t+' bonus $'+bonus/100+' + 10% of the prorated launch payment',sc.customers[0].commission===bonus+Math.round(pr*0.10),JSON.stringify(sc.customers[0]));
  let d='2026-11-19'; for(let i=0;i<460;i++){ H.today=d; B.billTick_(); const x=new Date(d+'T12:00:00Z'); x.setUTCDate(x.getUTCDate()+1); d=x.toISOString().slice(0,10);} 
  const a1=B.billGet_(a0.id), full=a1.charges.filter(c=>c.kind==='full'&&c.status==='paid').reduce((s,c)=>s+c.amount,0), n=a1.charges.filter(c=>c.kind==='full'&&c.status==='paid').length;
  sc=S({action:'sales_customers',token:owenTok});
  ok('10% keeps paying past 12 months while the customer stays ('+n+' monthly payments)',n>12&&sc.customers[0].commission===bonus+Math.round((pr+full)*0.10),JSON.stringify(sc.customers[0])); }
ok('Owners see every customer and its rep',S({action:'sales_customers',token:kruzTok}).customers.length===3);
// leads: Owen sees unassigned + his own; cannot edit another rep's lead
B.studio_({action:'leads_save',token:owenTok,lead:{id:'L1',name:'Joe Bar'}}); B.studio_({action:'leads_save',token:kruzTok,lead:{id:'L2',name:'Owner Lead'}});
const sh=H.sheets['Prospects']; const r2=sh.rows.findIndex(x=>x[1]==='L2'); sh.rows[r2][14]='rayald@x.com';
const ls=B.studio_({action:'leads_saved',token:owenTok});
ok('Owen sees his leads and unassigned leads, not other people\'s',ls.ok&&ls.leads.map(l=>l.id).join()==='L1',ls.leads&&ls.leads.map(l=>l.id).join());
ok('Owen cannot change another person\'s lead',B.studio_({action:'leads_update',token:owenTok,id:'L2',stage:'Won'}).error==='auth');
// password reset: link, not password; ends sessions; owner still needs the code
{ S({action:'team_invite',token:kruzTok,email:'newrep@x.com',name:'New Rep',role:'sales'}); H.mails.length=0; H.cache={};
  A({action:'auth_reset_request',email:'newrep@x.com'}); const m=H.mails.find(x=>x.to==='newrep@x.com');
  ok('Forgot password on an account never set up sends a fresh setup link',m&&/Set up your Riverbend account/.test(m.subject)&&/#setup=[a-f0-9]{64}/.test(m.body));
  const l=m.body.match(/setup=([a-f0-9]{64})/)[1]; let q=A({action:'auth_link_info',kind:'setup',link:l}); const sv=A({action:'auth_set_password',kind:'setup',link:l,salt:q.salt,dk:dk('Blue-Truck-77',q.salt)});
  q=A({action:'auth_login',email:'newrep@x.com',dk:dk('Blue-Truck-77',q.salt)});
  ok('...and the salesperson can then create a password and sign in',sv.ok&&q.ok&&q.token); }
H.mails.length=0; A({action:'auth_reset_request',email:'kruz@x.com'}); A({action:'auth_reset_request',email:'nobody@x.com'});
const rm=H.mails.filter(m=>/Reset your Riverbend password/.test(m.subject));
ok('Reset sends a 1-hour link only to real accounts (same reply for unknown emails)',rm.length===1&&/#reset=[a-f0-9]{64}/.test(rm[0].body));
const rl=rm[0].body.match(/reset=([a-f0-9]{64})/)[1]; r=A({action:'auth_link_info',kind:'reset',link:rl}); const ns=r.salt;
A({action:'auth_set_password',kind:'reset',link:rl,salt:ns,dk:dk('New-Pass-4567',ns)});
ok('Reset ends all existing sessions',S({action:'billing_list',token:kruzTok}).error==='auth');
H.cache={}; r=A({action:'auth_login',email:'kruz@x.com',dk:dk('New-Pass-4567',ns)});
ok('After a reset, an owner still needs the authenticator code',r.step==='mfa');
ok('Old password no longer works',A({action:'auth_login',email:'kruz@x.com',dk:dk('Correct-Horse-9',salt)}).error==='badlogin');
// legacy shared passwords: off only when both owners are fully set up
H.cache={}; { const uu=JSON.parse(H.props.AUTH_USERS); uu['kruz@x.com'].totpLast=0; H.props.AUTH_USERS=JSON.stringify(uu); } const k2=A({action:'auth_login',email:'kruz@x.com',dk:dk('New-Pass-4567',ns),code:totp(sec)}).token;
ok('Old shared passwords cannot be turned off until both owners are set up',S({action:'team_legacy_off',token:k2}).error==='owners');
const us=JSON.parse(H.props.AUTH_USERS); us['rayald@x.com'].status='active'; us['rayald@x.com'].totpOn=true; us['rayald@x.com'].lastLogin='x'; H.props.AUTH_USERS=JSON.stringify(us);
ok('Then an owner turns them off',S({action:'team_legacy_off',token:k2}).ok);
H.cache['tok_'+'e'.repeat(64)]='3'; H.cache['btok_'+'f'.repeat(64)]=H.props.BILLING_PW_GEN||'1';
ok('After that, old Studio and billing sessions and passwords are refused',S({action:'list',token:'e'.repeat(64)}).error==='auth'&&S({action:'billing_list',token:'f'.repeat(64)}).error==='auth'&&S({action:'login',password:'x'}).error==='disabled'&&S({action:'billing_login',password:'x'}).error==='disabled');
ok('Owner can reset the other owner\'s authenticator (lost phone recovery)',S({action:'team_mfa_reset',token:k2,email:'rayald@x.com'}).ok&&!JSON.parse(H.props.AUTH_USERS)['rayald@x.com'].totpOn);
ok('An owner cannot remove their own access by mistake',S({action:'team_disable',token:k2,email:'kruz@x.com',on:true}).error==='self');
ok('Disabling Owen ends his access immediately',S({action:'team_disable',token:k2,email:'owen@x.com',on:true}).ok&&S({action:'list',token:owenTok}).error==='auth');
const act=H.sheets['Billing Activity'].rows.map(x=>x.join(' ')).join('\n');
ok('Activity log has sign-ins, invites, resets and role changes, with who did it',/kruz@x.com: signed in/.test(act)&&/invited owen@x.com/.test(act)&&/reset password/.test(act)&&/disabled owen@x.com/.test(act)&&!/Correct-Horse|New-Pass/.test(act));
R.forEach(r=>console.log((r.c?'PASS ':'FAIL ')+r.n+(r.c?'':'  ['+r.i+']'))); console.log(R.filter(r=>r.c).length+'/'+R.length+' passed');
