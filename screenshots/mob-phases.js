/* Mobile phase walk: load main.html at 390x844, advance through all 7 phases
   via wheel events, screenshot each. */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  const page = await ctx.newPage();
  await page.goto('file:///C:/Landing%20Lantern/main.html');
  await page.waitForTimeout(3000);

  const out = (n) => path.join(__dirname, 'mob', n);
  const names = ['p1-hero', 'p2-save', 'p3-translate', 'p4-chat', 'p5-practice', 'p6-everywhere', 'p7-cta'];

  await page.screenshot({ path: out('0-' + names[0] + '.png') });
  for (let i = 1; i < 7; i++) {
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(4200);          // wheelLock + entry animations
    await page.screenshot({ path: out(i + '-' + names[i] + '.png') });
  }
  // CTA needs extra time: arm() -> cards stagger -> charge at ~2s
  await page.waitForTimeout(3000);
  await page.screenshot({ path: out('7-cta-charged.png') });

  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
