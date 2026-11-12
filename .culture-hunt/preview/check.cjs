const { chromium } = require('C:/Users/Admin/AppData/Local/npm-cache/_npx/420ff84f11983ee5/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({headless:true, executablePath:"C:/Users/Admin/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe"});
 const page = await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3000/?lang=en',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Get started',exact:true}).waitFor();
 await page.screenshot({path:'.culture-hunt/preview/desktop.png'});
 for(let i=0;i<5;i++) await page.getByRole('button',{name:'Zoom in',exact:true}).click();
 assert.equal(await page.locator('.travel-zoom output').innerText(),'150%');
 assert.equal(await page.getByRole('button',{name:'Zoom in',exact:true}).isDisabled(),true);
 await page.getByRole('button',{name:'Zoom out',exact:true}).click();
 assert.equal(await page.locator('.travel-zoom output').innerText(),'140%');
 await page.getByRole('button',{name:'Reset image zoom'}).click();
 assert.equal(await page.locator('.travel-zoom output').innerText(),'100%');
 await page.getByRole('button',{name:'Get started',exact:true}).click();
 await page.getByRole('dialog').waitFor();
 console.log('Dialog buttons:',await page.getByRole('dialog').getByRole('button').allTextContents());
 await page.keyboard.press('Escape');
 await page.getByRole('dialog').waitFor({state:'detached'});
 for(const width of [390,320,768]) {
  await page.setViewportSize({width,height:844});
  await page.screenshot({path:`.culture-hunt/preview/mobile-${width}.png`});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow at ${width}`);
 }
 await page.setViewportSize({width:1440,height:900});
 await page.getByRole('button',{name:'Get started',exact:true}).click();
 await page.getByRole('dialog').getByRole('button',{name:/guest/i}).click();
 await page.waitForURL(/play=1/);
 console.log('Guest route:',page.url());
 await page.goto('http://localhost:3000/?lang=vi',{waitUntil:'networkidle'});
 await page.screenshot({path:'.culture-hunt/preview/vietnamese.png'});
 console.log('Heading:',await page.locator('h1').innerText());
 assert.deepEqual(errors,[]);
 await browser.close();
 console.log('PASS: zoom controls, entry dialog, guest flow, responsive layouts, bilingual rendering; no page errors');
})().catch(e=>{console.error(e);process.exit(1)});


