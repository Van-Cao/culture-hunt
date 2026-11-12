const { chromium }=require('C:/Users/Admin/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Users/Admin/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 for(const [index,id] of [[0,'palace'],[1,'hcmus']]) {
  await page.goto('http://localhost:3000/?lang=en',{waitUntil:'networkidle'});
  await page.locator('.intro-place-image').nth(index).click();
  await page.getByRole('dialog').getByRole('button',{name:/guest/i}).click();
  await page.waitForURL(new RegExp('place='+id));
  console.log('Destination OK:',id);
 }
 await page.goto('http://localhost:3000/?lang=en',{waitUntil:'networkidle'});
 await page.evaluate(()=>window.scrollTo(0,400));
 assert.equal(await page.locator('.travel-hero-scene').evaluate(e=>getComputedStyle(e).transform),'none');
 await browser.close(); console.log('PASS: both destination flows and reduced-motion scroll');
})().catch(e=>{console.error(e);process.exit(1)});
