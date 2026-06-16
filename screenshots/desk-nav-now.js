/* Snapshot current desktop nav (right rail) at 1440x900, idle + a synthetic
   pointer near the right edge to provoke the magnetic peek. */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(__dirname, 'desk', 'now-0-idle.png') });

  // provoke the right rail magnet
  await page.mouse.move(1430, 450);
  await page.waitForTimeout(500);
  await page.mouse.move(1410, 450);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(__dirname, 'desk', 'now-1-peek.png') });

  // report what nav elements exist
  const info = await page.evaluate(() => {
    const dn = document.querySelector('.dotnav');
    const dnr = dn && dn.getBoundingClientRect();
    return {
      dotnavExists: !!dn,
      dotnavBtns: dn ? dn.children.length : 0,
      dotnavRect: dnr ? { right: Math.round(window.innerWidth - dnr.right), top: Math.round(dnr.top), w: Math.round(dnr.width), h: Math.round(dnr.height) } : null,
      dotnavVisible: dn ? getComputedStyle(dn).display !== 'none' : false,
      phase: window.LanternPhases ? window.LanternPhases.get() : 'no-LP',
      hasLP: !!window.LanternPhases,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
