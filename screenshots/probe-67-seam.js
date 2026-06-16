/* Probe the EVERYWHERE(6) -> INSTALL/CTA(7) seam on mobile.
   Drive to phase 6 the natural way (advance through phases), let the wall
   settle, then trigger toCTA and shoot frames every 60ms across the morph. */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE.ERR:', m.text()); });
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(1500);

  // walk to EVERYWHERE (internal phase 6) and let the wall reveal + cascade settle
  await page.evaluate(() => window.LanternPhases.jump(6));
  await page.waitForTimeout(2500);
  console.log('at phase', await page.evaluate(() => window.LanternPhases.get()));

  // sample the dock/install button + a wall page top through the morph to CTA
  const samples = await page.evaluate(() => new Promise(res => {
    const out = [];
    const t0 = performance.now();
    let fired = false;
    const iv = setInterval(() => {
      const t = Math.round(performance.now() - t0);
      if (!fired && t > 300) { fired = true; window.LanternPhases.step(1); }
      const btn = document.querySelector('#close-cta') || document.querySelector('.d1-install');
      const br = btn ? btn.getBoundingClientRect() : null;
      const body = document.body.className;
      out.push({ t, btnTop: br ? Math.round(br.top) : null, btnH: br ? Math.round(br.height) : null, phcta: /ph-cta/.test(body), phev: /ph-ev/.test(body) });
      if (t > 3000) { clearInterval(iv); res(out); }
    }, 60);
  }));
  samples.forEach(s => console.log(JSON.stringify(s)));

  // a few stills across the morph
  await page.evaluate(() => window.LanternPhases.jump(6));
  await page.waitForTimeout(2200);
  await page.screenshot({ path: 'C:/Landing Lantern/screenshots/seam67-A-wall.png' });
  await page.evaluate(() => window.LanternPhases.step(1));
  let acc = 0;
  for (const ms of [80, 120, 200, 200, 400, 700]) {
    await page.waitForTimeout(ms); acc += ms;
    await page.screenshot({ path: `C:/Landing Lantern/screenshots/seam67-cta-${acc}.png` });
  }
  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
