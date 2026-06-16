/* Desktop "one screen" FIT audit.
   Walks the hero through every phase + the finale + the close screen at three
   desktop viewports, and for each screen measures whether anything is clipped by
   the viewport (top<0 / bottom>innerHeight), whether hero content collides with
   the fixed bottom deck, and whether the browser .page article text overflows its
   own (overflow:hidden) frame. Screenshots each screen.

   Run:  node screenshots/desk-fit-audit.js  [outDir]
   Default outDir = fit-before ; pass fit-after for the post-change capture.   */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

const URL = 'file:///C:/Landing%20Lantern/index.html';
const OUT = path.join(__dirname, process.argv[2] || 'fit-before');
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { label: 'u1520x800',  width: 1520, height: 800,  dsf: 1.25 }, // the user's real screen (1920x1200 @125%)
  { label: 's1280x720',  width: 1280, height: 720,  dsf: 1 },    // 16:9 laptop @150% — the tight floor
  { label: 'w1920x1080', width: 1920, height: 1080, dsf: 1 },    // big monitor — the comfortable ceiling
];

// hero content (exclude the fixed bottom deck — measured separately as a collision target)
const HERO_SELS = [
  '.hero-copy', '.hero-copy-p2', '.hero-copy-p3', '.hero-copy-imm',
  '.hero-copy-p4', '.hero-copy-p5', '.hero-copy-simp',
  '.hero-stage', '#hero .browser', '#hero-dock', '#hero-tpanel', '.scroll-cue',
];

function measureFn() {
  return (sellist) => {
    const vh = window.innerHeight, vw = window.innerWidth;
    const vis = el => {
      if (!el) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05) return false;
      const r = el.getBoundingClientRect();
      return r.height > 2 && r.width > 2 && r.bottom > -50 && r.top < vh + 50 && r.right > 0 && r.left < vw;
    };
    const box = el => { const b = el.getBoundingClientRect(); return { t: Math.round(b.top), b: Math.round(b.bottom), h: Math.round(b.height) }; };
    const items = {};
    let maxB = 0, minT = vh;
    sellist.forEach(s => {
      document.querySelectorAll(s).forEach(el => {
        if (!vis(el)) return;
        const bx = box(el);
        items[s] = bx;
        if (bx.b > maxB) maxB = bx.b;
        if (bx.t < minT) minT = bx.t;
      });
    });
    const deck = document.getElementById('d-deck');
    const deckTop = (deck && getComputedStyle(deck).display !== 'none') ? Math.round(deck.getBoundingClientRect().top) : vh;
    const pageEl = document.querySelector('#hero .browser .page');
    const pageOverflow = pageEl ? Math.max(0, pageEl.scrollHeight - pageEl.clientHeight) : 0;
    return {
      vh, vw, maxB, minT,
      clipBelow: Math.max(0, maxB - vh),
      clipAbove: Math.max(0, -minT),
      deckTop,
      deckCollision: Math.max(0, maxB - deckTop),
      pageOverflow,
      items,
    };
  };
}

async function run(vp) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dsf });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log(`[${vp.label}] PAGEERR:`, e.message));
  await page.goto(URL);
  await page.waitForTimeout(2600);

  const cap = async () => { try { return (await page.$eval('#d-cap', el => el.textContent.trim())) || ''; } catch { return ''; } };
  const flags = [];

  for (let p = 0; p < 8; p++) {
    await page.evaluate(n => window.LanternPhases && window.LanternPhases.jump(n), p);
    const settle = p === 3 || p === 4 ? 2600 : 1400;
    await page.waitForTimeout(settle);
    const actual = await page.evaluate(() => window.LanternPhases ? window.LanternPhases.get() : -1);
    const label = (await cap()).replace(/\s+/g, ' ').slice(0, 22) || `p${p}`;
    const m = await page.evaluate(measureFn(), HERO_SELS);
    const tag = `${vp.label} · phase ${actual} (${label})`;
    // pageOverflow = the mock browser's article naturally extending past its
    // overflow:hidden frame — by design, NOT a fit bug; logged but not flagged.
    const bad = m.clipBelow > 2 || m.clipAbove > 4 || m.deckCollision > 2;
    console.log(`${bad ? 'XX' : 'ok'} ${tag} :: vh=${m.vh} contentBottom=${m.maxB} clipBelow=${m.clipBelow} clipAbove=${m.clipAbove} deckTop=${m.deckTop} deckCollision=${m.deckCollision} pageOverflow=${m.pageOverflow}`);
    if (bad) flags.push(`${tag}  clipBelow=${m.clipBelow} deckCollision=${m.deckCollision} pageOverflow=${m.pageOverflow}`);
    await page.screenshot({ path: path.join(OUT, `${vp.label}-h${p}-${label.replace(/[^a-z0-9]+/gi, '_')}.png`) });
    if (actual >= 6 && p > actual) break; // phases exhausted
  }

  // finale + close — scroll them into view
  for (const id of ['finale', 'ev-close']) {
    await page.evaluate(i => { const el = document.getElementById(i); if (el) el.scrollIntoView({ block: 'start' }); }, id);
    await page.waitForTimeout(1500);
    const m = await page.evaluate((i) => {
      const el = document.getElementById(i);
      const vh = window.innerHeight;
      if (!el) return { missing: true, vh };
      const inner = el.querySelector('.ev-wall, .close-wrap, .ev-title, h2, h1');
      const b = el.getBoundingClientRect();
      const overflow = Math.max(0, el.scrollHeight - vh);
      return { vh, secTop: Math.round(b.top), secH: Math.round(el.offsetHeight), overflow };
    }, id);
    const bad = m.overflow > 2;
    console.log(`${bad ? 'XX' : 'ok'} ${vp.label} · ${id} :: vh=${m.vh} secH=${m.secH} overflow(beyond 1 screen)=${m.overflow}`);
    if (bad) flags.push(`${vp.label} · ${id}  overflow=${m.overflow}`);
    await page.screenshot({ path: path.join(OUT, `${vp.label}-z-${id}.png`) });
  }

  await browser.close();
  return flags;
}

(async () => {
  const filter = process.argv[3];
  const vps = filter ? VIEWPORTS.filter(v => v.label.includes(filter)) : VIEWPORTS;
  const all = [];
  for (const vp of vps) {
    console.log(`\n=== ${vp.label} (${vp.width}x${vp.height} dsf${vp.dsf}) ===`);
    const f = await run(vp);
    all.push(...f);
  }
  console.log(`\n===== SUMMARY: ${all.length} clipped/overflow screens =====`);
  all.forEach(f => console.log('  XX ' + f));
  console.log(`\nScreenshots -> ${OUT}`);
})().catch(e => { console.error(e); process.exit(1); });
