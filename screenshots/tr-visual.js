/* Visual check of the riser beat: rest → lifted EN → UK hold → settled. */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

async function shoot(viewport, label, isMobile) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: isMobile, isMobile });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log(label, 'PAGEERROR:', e.message));
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.LanternPhases.jump(2));
  const out = n => path.join(__dirname, 'mob', 'riser-' + label + '-' + n + '.png');
  await page.waitForTimeout(1500);                 // just before lift (fires ~1600+200)
  await page.screenshot({ path: out('0-rest') });
  await page.waitForTimeout(700);                  // mid/end of lift
  await page.screenshot({ path: out('1-lift') });
  await page.waitForTimeout(1200);                 // UK text held on card
  await page.screenshot({ path: out('2-uk') });
  await page.waitForTimeout(3500);                 // settled back
  await page.screenshot({ path: out('3-settle') });
  await browser.close();
}

(async () => {
  await shoot({ width: 390, height: 844 }, 'mob', true);
  await shoot({ width: 1440, height: 900 }, 'desk', false);
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
