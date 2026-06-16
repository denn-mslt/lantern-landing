const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(2500);
  // crop top area (topbar pill) + hero install button region
  await page.screenshot({ path: 'chrome-live-hero.png', clip: { x: 0, y: 0, width: 1440, height: 760 } });
  await page.evaluate(() => window.LanternPhases && window.LanternPhases.jump(7));
  await page.waitForTimeout(2600);
  await page.screenshot({ path: 'chrome-live-cta.png', clip: { x: 360, y: 250, width: 720, height: 420 } });
  console.log('errors:', errs.length, errs.slice(0,3));
  await browser.close();
})();
