// Captures real screenshots of riverbendwebco.com pages (2x) into ads/shots/.
import { chromium } from 'playwright';
import fs from 'fs';
fs.mkdirSync('ads/shots',{recursive:true});
const D='https://riverbendwebco.com/demo/?d=';
const jobs=[
 ['home-desk','https://riverbendwebco.com/',1440,900],
 ['bar-desk',D+'sample-bar',1440,900],['bar-mob',D+'sample-bar',390,844],
 ['rest-desk',D+'sample-restaurant',1440,900],['rest-mob',D+'sample-restaurant',390,844],
 ['trade-desk',D+'sample-trade',1440,900],['trade-mob',D+'sample-trade',390,844],
 ['auto-desk',D+'sample-auto',1440,900],['auto-mob',D+'sample-auto',390,844],
 ['realty-mob',D+'sample-realtor',390,844],
 ['cypher','https://cypher-llc.com/',1440,900],['ghost','https://ghostplatform.ai/',1440,900],
 ['chefnerd','https://chefnerdai.com/',1440,900],['tinyapp','https://tinyappcode.com/',1440,900],
];
const hide=`.rb-bar,#rbChat,.rba-fab,[class*="cookie"]{display:none!important}.rv,.reveal,[data-reveal]{opacity:1!important;transform:none!important}`;
const browser=await chromium.launch();
for(const [name,url,w,h] of jobs){
  const ctx=await browser.newContext({viewport:{width:w,height:h},deviceScaleFactor:2,isMobile:w<500,hasTouch:w<500,userAgent:w<500?'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1':undefined});
  const p=await ctx.newPage();
  try{
    await p.goto(url,{waitUntil:'networkidle',timeout:60000});
    await p.addStyleTag({content:hide});
    await p.evaluate(()=>document.fonts.ready);
    await p.waitForTimeout(4500);
    await p.screenshot({path:`ads/shots/${name}.png`});
    console.log('shot',name);
  }catch(e){ console.log('FAIL',name,e.message); }
  await ctx.close();
}
await browser.close();
