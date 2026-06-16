/* TRANSLATE: the browser frame must not move while the sentence lifts. */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2, hasTouch: true, isMobile: true
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(2000);

  await page.evaluate(() => window.LanternPhases.jump(2));
  await page.waitForTimeout(1200);
  const before = await page.locator('#hero .browser').boundingBox();

  // mobTranslate fires at 1600ms after phase entry; sample during the lift
  await page.waitForTimeout(1600);
  const during = await page.locator('#hero .browser').boundingBox();
  const trActive = await page.evaluate(() => document.getElementById('hero').classList.contains('tr-active'));
  console.log('tr-active:', trActive);
  console.log('before:', JSON.stringify(before));
  console.log('during:', JSON.stringify(during));
  const moved = Math.abs(before.x - during.x) + Math.abs(before.y - during.y) +
                Math.abs(before.width - during.width) + Math.abs(before.height - during.height);
  console.log(moved < 2 ? 'OK — frame held still' : 'MOVED by ' + moved.toFixed(1) + 'px');
  await page.screenshot({ path: path.join(__dirname, 'mob', 'tr-still.png') });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
