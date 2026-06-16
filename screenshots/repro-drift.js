/* Reproduce the phase-drift bug: do sequential jumps like a fast swipe and
   watch whether the phase silently drifts back (scroll-runway feedback). */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const URL = 'file:///C:/Landing%20Lantern/index.html';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto(URL);
  await page.waitForTimeout(2600);

  // install a phase + scroll logger
  await page.evaluate(() => {
    window.__log = [];
    let last = -1;
    setInterval(() => {
      const p = window.LanternPhases.get();
      const y = Math.round(window.scrollY);
      if (p !== last) { window.__log.push(`ph ${last}->${p} @scrollY=${y} t=${Math.round(performance.now())}`); last = p; }
    }, 50);
    let lastY = -1;
    window.addEventListener('scroll', () => {
      const y = Math.round(window.scrollY);
      if (Math.abs(y - lastY) > 30) { window.__log.push(`scroll y=${y} t=${Math.round(performance.now())}`); lastY = y; }
    }, { passive: true });
  });

  // mimic the audit: jump 0,1,2,3 with 900ms between (like fast stepping)
  for (let p = 0; p <= 3; p++) {
    await page.evaluate(n => window.LanternPhases.jump(n), p);
    await page.waitForTimeout(900);
  }
  await page.waitForTimeout(2500);
  const end = await page.evaluate(() => ({
    phase: window.LanternPhases.get(),
    caption: (document.getElementById('m-phase-caption') || {}).textContent,
    p4: document.body.classList.contains('hero-p4'),
    log: window.__log
  }));
  console.log('END phase=', end.phase, 'caption=', end.caption, 'p4=', end.p4);
  console.log('LOG:\n  ' + end.log.join('\n  '));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
