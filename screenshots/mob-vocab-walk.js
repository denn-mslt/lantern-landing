/* Mobile VOCAB walk on index.html: jump each hero phase, screenshot the
   #worddeck (My vocab) state + log its box/size, then a "many words" run to
   reproduce the "too big" overflow. */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

const OUT = path.join(__dirname, 'mob-vocab');
fs.mkdirSync(OUT, { recursive: true });
const PHASES = ['0-home', '1-simplify', '2-translate', '3-immerse', '4-discuss', '5-practice'];

async function deckInfo(page) {
  return page.evaluate(() => {
    const d = document.getElementById('worddeck');
    if (!d) return { exists: false };
    const r = d.getBoundingClientRect();
    const cs = getComputedStyle(d);
    const cards = [...d.querySelectorAll('.wd-card')];
    return {
      exists: true,
      shown: d.classList.contains('show'),
      box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      pos: cs.position, display: cs.display,
      cardCount: cards.length,
      cardSizes: cards.slice(0, 12).map(c => { const cr = c.getBoundingClientRect(); return Math.round(cr.width) + 'x' + Math.round(cr.height); }),
      bodyClasses: [...document.body.classList].filter(c => /hero-|ph-|vocab|at-/.test(c)),
      vw: innerWidth, vh: innerHeight
    };
  });
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(3500);

  const LP = await page.evaluate(() => typeof window.LanternPhases);
  console.log('LanternPhases:', LP, '| __mCrank:', await page.evaluate(() => window.__mCrank));

  for (let i = 0; i < PHASES.length; i++) {
    await page.evaluate((n) => { if (window.LanternPhases && window.LanternPhases.jump) window.LanternPhases.jump(n); }, i);
    await page.waitForTimeout(2600);
    const info = await deckInfo(page);
    console.log('--- phase', PHASES[i], JSON.stringify(info));
    await page.screenshot({ path: path.join(OUT, 'p' + PHASES[i] + '.png') });
  }

  // "TOO BIG" reproduction: go to P2 and stuff the shelf with many words.
  await page.evaluate(() => { if (window.LanternPhases) window.LanternPhases.jump(1); });
  await page.waitForTimeout(1500);
  const added = await page.evaluate(() => {
    if (!window.Shelf) return 'no Shelf';
    const pool = ['genre','devoted','phenomenon','legacy','immersion','vocabulary','fluency','context','sentence','meaning','translate','remember','practice','review','progress'];
    let n = 0;
    pool.forEach(w => { try { if (!window.Shelf.has(w)) { window.Shelf.add(w); n++; } } catch(e){} });
    if (window.Shelf.reveal) window.Shelf.reveal();
    return 'added ' + n + ' words';
  });
  console.log('STUFF:', added);
  await page.waitForTimeout(2000);
  console.log('--- P2 STUFFED', JSON.stringify(await deckInfo(page)));
  await page.screenshot({ path: path.join(OUT, 'p2-stuffed.png') });

  // and in a later phase (P4 discuss) with many words -> top-right rail overflow
  await page.evaluate(() => { if (window.LanternPhases) window.LanternPhases.jump(4); });
  await page.waitForTimeout(2200);
  console.log('--- P4 STUFFED', JSON.stringify(await deckInfo(page)));
  await page.screenshot({ path: path.join(OUT, 'p4-stuffed.png') });

  await browser.close();
  console.log('done ->', OUT);
})().catch(e => { console.error(e); process.exit(1); });
