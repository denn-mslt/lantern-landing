/* Capture mobile HOME (P0) hero word-cards + measure them, to redesign the
   floating cards: small from the start, 2 rows (EN word / translation). */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const OUT = path.join(__dirname, 'mob-analyze');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(3500);

  // HOME screen as it loads
  await page.screenshot({ path: path.join(OUT, '00-home.png') });

  // measure each floating card + its inner pieces
  const cards = await page.evaluate(() => {
    return [...document.querySelectorAll('.hw-card')].map(c => {
      const wc = c.querySelector('.wordcard');
      const w  = c.querySelector('.w');
      const tr = c.querySelector('.tr');
      const cs = wc ? getComputedStyle(wc) : null;
      const r  = c.getBoundingClientRect();
      return {
        word: w ? w.textContent : null,
        tr: tr ? tr.textContent : null,
        cardW: wc ? wc.style.width : null,
        wFont: w ? getComputedStyle(w).fontSize : null,
        trFont: tr ? getComputedStyle(tr).fontSize : null,
        box: { w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left), top: Math.round(r.top) },
        display: getComputedStyle(c).display
      };
    });
  });
  console.log('CARDS:', JSON.stringify(cards, null, 2));

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
