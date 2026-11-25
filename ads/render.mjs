// Renders ads/adNN.html to ads/out/riverbend-ad-NN.png at 2160x2700 (1080x1350 @2x).
import { chromium } from 'playwright';
import fs from 'fs'; import path from 'path';
fs.mkdirSync('ads/out',{recursive:true});
const browser=await chromium.launch();
const ctx=await browser.newContext({viewport:{width:1080,height:1350},deviceScaleFactor:2});
const p=await ctx.newPage();
for(const f of fs.readdirSync('ads').filter(f=>/^ad\d+\.html$/.test(f)).sort()){
  await p.goto('file://'+path.resolve('ads',f),{waitUntil:'networkidle'});
  await p.evaluate(()=>document.fonts.ready);
  await p.waitForTimeout(800);
  const n=f.match(/\d+/)[0];
  await p.screenshot({path:`ads/out/riverbend-ad-${n}.png`});
  console.log('rendered',f);
}
await browser.close();
