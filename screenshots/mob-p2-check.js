const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const OUT = path.join(__dirname, 'mob-analyze');
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.LanternPhases && window.LanternPhases.jump(1));
  await page.waitForTimeout(2600);
  await page.screenshot({ path: path.join(OUT, '02-p1-strip.png') });
  const strip = await page.evaluate(() => [...document.querySelectorAll('#wd-stack .wd-card')].map(c => ({ w: (c.querySelector('.wd-w')||{}).textContent, tr: (c.querySelector('.wd-tr')||{}).textContent })));
  console.log('STRIP:', JSON.stringify(strip));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
