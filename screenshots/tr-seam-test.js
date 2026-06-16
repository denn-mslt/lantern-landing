/* Seamlessness probe: sample the lifted card's height + the 2nd paragraph's
   top every 80ms through the translate beat — a seam shows as a jump >12px
   between consecutive samples. Run for mobile and desktop viewports. */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

async function probe(viewport, label, isMobile) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, hasTouch: isMobile, isMobile });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log(label, 'PAGEERROR:', e.message));
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.LanternPhases.jump(2));
  await page.waitForTimeout(800);

  // sample through the whole beat: lift at +1600, swap, hold 2200, swap back, settle
  const samples = await page.evaluate(() => new Promise(res => {
    const out = [];
    const sel = document.querySelector('#hero .tr-page .sel');
    const para2 = document.querySelectorAll('#hero .tr-page p')[1] || sel.parentElement.nextElementSibling;
    const t0 = performance.now();
    const iv = setInterval(() => {
      const r = sel.getBoundingClientRect();
      const p = para2 ? para2.getBoundingClientRect().top : 0;
      out.push([Math.round(performance.now() - t0), Math.round(r.height), Math.round(p)]);
      if (performance.now() - t0 > 7000) { clearInterval(iv); res(out); }
    }, 80);
  }));

  let maxJump = 0, at = 0;
  for (let i = 1; i < samples.length; i++) {
    const dh = Math.abs(samples[i][1] - samples[i - 1][1]);
    const dp = Math.abs(samples[i][2] - samples[i - 1][2]);
    const j = Math.max(dh, dp);
    if (j > maxJump) { maxJump = j; at = samples[i][0]; }
  }
  console.log(label + ': max per-frame jump = ' + maxJump + 'px at t+' + at + 'ms ' +
    (maxJump <= 14 ? '(smooth)' : '(SEAM!)'));
  await browser.close();
}

(async () => {
  await probe({ width: 390, height: 844 }, 'mobile ', true);
  await probe({ width: 1440, height: 900 }, 'desktop', false);
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
