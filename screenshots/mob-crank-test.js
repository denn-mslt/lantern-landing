/* Crank test: native scroll winds the story. Scroll down in steps, watch
   phases advance; scroll back up, watch them unwind. */
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
  await page.waitForTimeout(2500);

  const out = (n) => path.join(__dirname, 'mob', 'crank-' + n + '.png');

  const info = await page.evaluate(() => ({
    crank: !!window.__mCrank,
    docH: document.documentElement.scrollHeight,
    innerH: window.innerHeight,
    phase: window.LanternPhases.get()
  }));
  console.log('init:', JSON.stringify(info));
  await page.screenshot({ path: out('0-idle') });

  // scroll to the end in one fling — chase should walk every phase
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  for (let i = 0; i < 9; i++) {
    await page.waitForTimeout(1500);
    const st = await page.evaluate(() => ({ y: Math.round(window.scrollY), ph: window.LanternPhases.get() }));
    console.log('t+' + ((i + 1) * 1.5).toFixed(1) + 's', JSON.stringify(st));
  }
  await page.screenshot({ path: out('1-end') });

  // unwind: scroll back to ~1/3 (phase 2)
  await page.evaluate(() => window.scrollTo(0, (document.documentElement.scrollHeight - window.innerHeight) / 3));
  await page.waitForTimeout(6000);
  const back = await page.evaluate(() => ({ y: Math.round(window.scrollY), ph: window.LanternPhases.get() }));
  console.log('after unwind:', JSON.stringify(back));
  await page.screenshot({ path: out('2-unwind') });

  // scroll fully to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(6000);
  console.log('at top phase:', await page.evaluate(() => window.LanternPhases.get()));
  await page.screenshot({ path: out('3-top') });

  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
