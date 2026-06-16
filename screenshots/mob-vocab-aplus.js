/* Prototype the council's A+ vocab strip at runtime (inject CSS only, no file
   edits): fixed 88px cards + overflow-x scroll + edge-fade + gesture isolation.
   Proves 10 words no longer clip. */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const OUT = path.join(__dirname, 'mob-vocab');
fs.mkdirSync(OUT, { recursive: true });

const APLUS_CSS = `
  body.hero-p2 #wd-stack{
    overflow-x:auto !important; flex-wrap:nowrap !important; justify-content:flex-start !important;
    -webkit-mask:linear-gradient(90deg,#000 88%,transparent) !important;
            mask:linear-gradient(90deg,#000 88%,transparent) !important;
    touch-action:pan-x; overscroll-behavior-x:contain; scrollbar-width:none;
  }
  body.hero-p2 #wd-stack::-webkit-scrollbar{ display:none; }
  body.hero-p2 #worddeck .wd-card{ flex:0 0 auto !important; min-width:84px !important; width:84px !important; }
`;

async function stuff(page, n) {
  return page.evaluate((pool) => {
    if (!window.Shelf) return 0;
    let added = 0;
    pool.forEach(w => { try { if (!window.Shelf.has(w)) { window.Shelf.add(w); added++; } } catch(e){} });
    if (window.Shelf.reveal) window.Shelf.reveal();
    return added;
  }, ['genre','devoted','phenomenon','legacy','immersion','vocabulary','fluency','context','sentence','meaning','remember','progress']);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(3500);
  await page.evaluate(() => { if (window.LanternPhases) window.LanternPhases.jump(1); });
  await page.waitForTimeout(1800);

  // BEFORE (current flex:1 clip) with many words
  await stuff(page, 12);
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => [...document.querySelectorAll('#worddeck .wd-card')].map(c => Math.round(c.getBoundingClientRect().width)));
  console.log('BEFORE widths:', JSON.stringify(before));
  await page.screenshot({ path: path.join(OUT, 'aplus-0-before.png') });

  // AFTER: inject A+ CSS, auto-scroll the strip to the end
  await page.addStyleTag({ content: APLUS_CSS });
  await page.waitForTimeout(400);
  await page.evaluate(() => { const s = document.getElementById('wd-stack'); if (s) s.scrollLeft = 0; });
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => {
    const s = document.getElementById('wd-stack');
    return { widths: [...document.querySelectorAll('#worddeck .wd-card')].map(c => Math.round(c.getBoundingClientRect().width)), scrollW: s ? s.scrollWidth : 0, clientW: s ? s.clientWidth : 0 };
  });
  console.log('AFTER:', JSON.stringify(after));
  await page.screenshot({ path: path.join(OUT, 'aplus-1-start.png') });

  // scrolled to end (newest card revealed)
  await page.evaluate(() => { const s = document.getElementById('wd-stack'); if (s) s.scrollLeft = s.scrollWidth; });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, 'aplus-2-scrolled.png') });

  await browser.close();
  console.log('done ->', OUT);
})().catch(e => { console.error(e); process.exit(1); });
