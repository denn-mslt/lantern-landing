/* Full mobile walk after all upgrades: P1 demo, P2 auto-simplify, P3 inline
   translate, P4 chat, P5 autoplay, P5->P6 burst, P6->P7 collapse + wires. */
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
  await page.goto('file:///C:/Landing%20Lantern/main.html');
  const out = (n) => path.join(__dirname, 'mob', 'final-' + n + '.png');

  await page.waitForTimeout(6500);                       // P1 demo plays fully
  await page.screenshot({ path: out('p1') });

  const adv = async (ms) => { await page.mouse.wheel(0, 400); await page.waitForTimeout(ms); };

  await adv(7500);                                       // P2 + auto simplify full
  await page.screenshot({ path: out('p2') });
  await adv(4600);                                       // P3 lift + translated hold
  await page.screenshot({ path: out('p3') });
  await adv(5000);                                       // P4 chat
  await page.screenshot({ path: out('p4') });
  await adv(6000);                                       // P5 autoplay (mid)
  await page.screenshot({ path: out('p5-mid') });
  await page.waitForTimeout(5500);                       // success window passed
  await adv(900);                                        // P6 burst mid-flight
  await page.screenshot({ path: out('p6-burst') });
  await page.waitForTimeout(2200);
  await page.screenshot({ path: out('p6') });
  await adv(450);                                        // P6->P7 collapse mid
  await page.screenshot({ path: out('p7-collapse') });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: out('p7-armed') });
  await page.waitForTimeout(6000);                       // beads fed the button
  await page.screenshot({ path: out('p7-charged') });
  console.log('final phase:', await page.evaluate(() => window.LanternPhases.get()));

  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
