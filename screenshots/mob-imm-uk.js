/* IMMERSE worst-case: set gloss language to Ukrainian (longest) and check overflow. */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('lantern.gloss', 'uk'); } catch(e){} });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(3500);
  await page.evaluate(() => window.LanternPhases && window.LanternPhases.jump(3));
  await page.waitForTimeout(3200);
  const info = await page.evaluate(() => {
    const pg = document.querySelector('#hero .browser .page');
    const surf = document.querySelector('#hero .imm-surface');
    const cs = pg ? getComputedStyle(pg) : null;
    const pr = pg ? pg.getBoundingClientRect() : null;
    const sr = surf ? surf.getBoundingClientRect() : null;
    return {
      pageOverflow: cs ? cs.overflow : null, pageMinH: cs ? cs.minHeight : null,
      pageH: pr ? Math.round(pr.height) : null, pageBottom: pr ? Math.round(pr.bottom) : null,
      surfBottom: sr ? Math.round(sr.bottom) : null,
      overflowPx: (sr && pr) ? Math.round(sr.bottom - pr.bottom) : null
    };
  });
  console.log('IMM uk @360:', JSON.stringify(info));
  await page.screenshot({ path: path.join(__dirname, 'mob-verify', 'p3-immerse-uk360.png') });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
