/* Same as mob-analyze but with Ukrainian glosses (the user's language) to confirm
   the longer Cyrillic translations still fit the small two-row cards. */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const OUT = path.join(__dirname, 'mob-analyze');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => { try { localStorage.setItem('lantern.gloss', 'uk'); } catch (e) {} });
  const page = await ctx.newPage();
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(OUT, '01-home-uk.png') });

  const cards = await page.evaluate(() => [...document.querySelectorAll('.hw-card')].map(c => {
    const wc = c.querySelector('.wordcard'), w = c.querySelector('.w'), tr = c.querySelector('.tr');
    const r = c.getBoundingClientRect();
    return { word: w && w.textContent, tr: tr && tr.textContent, cardW: wc && wc.style.width,
      box: { w: Math.round(r.width), left: Math.round(r.left) },
      trOverflow: tr ? (tr.scrollWidth > tr.clientWidth + 1) : null };
  }));
  console.log('UK CARDS:', JSON.stringify(cards, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
