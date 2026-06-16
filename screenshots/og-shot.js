/* Capture the hero (phase HOME) for the OG card, then downscale to 1200x630.
   Run after any hero copy change so og-image.png stays in sync with the page. */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

const URL = 'file:///C:/Landing%20Lantern/index.html';
const RAW = path.join(__dirname, 'og-raw.png');

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1520, height: 798 },   // 1.905 ≈ OG 1200x630
    deviceScaleFactor: 2
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto(URL);
  await page.waitForTimeout(2800);            // fonts + reveal
  // new-visitor onboarding: pick PT so the "save a word" demo plays + cards rest
  const picked = await page.evaluate(() => {
    const b = document.querySelector('.hw-onboard .hw-ob-btn[data-lang="pt"]');
    if (b) { b.click(); return true; }
    return false;                              // already past onboarding
  });
  console.log('picked PT:', picked);
  await page.waitForTimeout(9000);            // demo plays four saves, cards fly + settle
  await page.screenshot({ path: RAW });
  console.log('raw hero captured ->', RAW);
  await browser.close();
})();
