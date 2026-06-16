/* Check phase 4 (PRACTICE) lands and holds — direct jump and discuss->practice. */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const URL = 'file:///C:/Landing%20Lantern/index.html';

async function poll(page, label, ms, every) {
  const out = [];
  let last = -99;
  for (let t = 0; t < ms; t += every) {
    await page.waitForTimeout(every);
    const s = await page.evaluate(() => ({ p: window.LanternPhases.get(), p4: document.body.classList.contains('hero-p4'), p5: document.body.classList.contains('hero-p5') }));
    const tag = `${s.p}${s.p4?'D':''}${s.p5?'P':''}`;
    if (tag !== last) { out.push(`+${t+every}ms ${tag}`); last = tag; }
  }
  console.log(`[${label}] ` + out.join('  '));
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto(URL);
  await page.waitForTimeout(2600);

  // A) direct jump to PRACTICE
  await page.evaluate(() => window.LanternPhases.jump(4));
  await poll(page, 'direct-jump-4', 3500, 350);

  // reset home, then sequential 3 -> 4 (the audit path)
  await page.evaluate(() => window.LanternPhases.jump(0));
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.LanternPhases.jump(3));
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.LanternPhases.jump(4));
  await poll(page, 'seq-3-to-4', 3500, 350);

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
