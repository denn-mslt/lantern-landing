/* Verify adaptive window height on mobile screens 1-6.
   Jumps each visual phase, screenshots, and reports whether the active
   content layer is clipped (overflows the window) and the window height. */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const OUT = path.join(__dirname, 'mob-fit');
fs.mkdirSync(OUT, { recursive: true });

const SCREENS = [
  { vis: 0, name: 'home' },
  { vis: 1, name: 'simplify' },
  { vis: 2, name: 'translate' },
  { vis: 3, name: 'immerse' },
  { vis: 4, name: 'practice' },   /* visual 4 = Practice */
  { vis: 5, name: 'discuss' },    /* visual 5 = Discuss */
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(3000);

  for (const s of SCREENS) {
    await page.evaluate(v => window.LanternPhases.jump(v), s.vis);
    await page.waitForTimeout(6500);  /* let scripted scene + 1s morph fully settle */
    const m = await page.evaluate(() => {
      const b = document.body.classList;
      const pg = document.querySelector('#hero .browser .page');
      const sel = b.contains('hero-imm') ? '.imm-page'
                : b.contains('hero-p5')  ? '.ex-page'
                : b.contains('hero-p3')  ? '.tr-page'
                : b.contains('hero-p4')  ? '(discuss)'
                : '.page-en';
      const L = sel.startsWith('.') ? document.querySelector('#hero .browser .page ' + sel) : null;
      const pr = pg.getBoundingClientRect();
      const lr = L ? L.getBoundingClientRect() : null;
      return {
        layer: sel,
        pageMinH: pg.style.minHeight || getComputedStyle(pg).minHeight,
        pageH: Math.round(pr.height),
        pageTop: Math.round(pr.top), pageBot: Math.round(pr.bottom),
        layerScroll: L ? L.scrollHeight : null,
        layerTop: lr ? Math.round(lr.top) : null,
        layerBot: lr ? Math.round(lr.bottom) : null,
        clippedTop: lr ? Math.round(pr.top - lr.top) : null,   /* >0 = content cut at top */
        clippedBot: lr ? Math.round(lr.bottom - pr.bottom) : null, /* >0 = content cut at bottom */
        vh: window.innerHeight,
      };
    });
    console.log(s.name.toUpperCase().padEnd(10), JSON.stringify(m));
    await page.screenshot({ path: path.join(OUT, s.vis + '-' + s.name + '.png') });
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
