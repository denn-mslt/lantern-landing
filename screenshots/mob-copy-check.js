/* Mobile copy + Practice-overflow check against index.html (the live single file).
   Navigates by clicking the (hidden on mobile, but DOM-present) phase dots. */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  const out = (n) => path.join(__dirname, 'copychk', n + '.png');

  const go = (id) => page.evaluate((i) => {
    var el = document.getElementById(i);
    if (el) el.click();
  }, id);

  await page.waitForTimeout(6500);
  await page.screenshot({ path: out('1-home') });

  await go('m-dot-2'); await page.waitForTimeout(6500); await page.screenshot({ path: out('2-simplify') });
  await go('m-dot-3'); await page.waitForTimeout(2500); await page.screenshot({ path: out('3-translate') });
  await go('m-dot-imm'); await page.waitForTimeout(2500); await page.screenshot({ path: out('4-immerse') });
  await go('m-dot-5'); await page.waitForTimeout(2000); await page.screenshot({ path: out('5-practice') });
  await page.waitForTimeout(7000); await page.screenshot({ path: out('5-practice-late') });
  await go('m-dot-4'); await page.waitForTimeout(5500); await page.screenshot({ path: out('6-discuss') });

  console.log('phase:', await page.evaluate(() => window.LanternPhases && window.LanternPhases.get()));
  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
