/* Final check:
   (A) Desktop — the pill is pre-sized to "invented", so the made→invented flip does
       NOT resize the box (W_made == W_invented).
   (B) Mobile (3 widths) — the ribbon fits the viewport, the flip is width-stable, and
       it doesn't collide with nav/vocab; no Next pill on mobile (crank is the nav) so
       it simply fades after the dwell. No JS errors anywhere. */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const OUT = path.join(__dirname, 'simp-ribbon');
fs.mkdirSync(OUT, { recursive: true });

const measure = () => {
  const opa = el => el ? parseFloat(getComputedStyle(el).opacity) : null;
  const r = el => { if (!el) return null; const q = el.getBoundingClientRect(); return { top: Math.round(q.top), bottom: Math.round(q.bottom), left: Math.round(q.left), right: Math.round(q.right), w: Math.round(q.width) }; };
  const rib = document.getElementById('hero-simp-ribbon');
  const pill = rib && rib.querySelector('.sc-h');
  return {
    ribOpacity: opa(rib), pillRect: r(pill), text: pill && pill.textContent.replace(/\s+/g, ' ').trim(),
    brRect: r(document.querySelector('#hero .browser')),
    deckRect: r(document.getElementById('worddeck')),
    navRect: r(document.querySelector('.m-navcluster')),
    vw: window.innerWidth,
  };
};

async function playSimplify(page) {
  await page.evaluate(() => { if (window.LanternPhases) window.LanternPhases.jump(1); });
  await page.waitForTimeout(1300);
  await page.evaluate(() => { const d = document.getElementById('hero-simp-dot'); if (d) d.click(); });
}

(async () => {
  const browser = await chromium.launch();

  // ---------- (A) DESKTOP: pill width stability across the verb flip ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1520, height: 800 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('PAGEERROR[desk]:', e.message));
    await ctx.addInitScript(() => { try { localStorage.setItem('lantern.gloss', 'uk'); } catch (e) {} });
    await page.goto('file:///C:/Landing%20Lantern/index.html');
    await page.waitForTimeout(2400);
    await playSimplify(page);
    let madeW = null, invW = null, madeSeen = false;
    for (let t = 0; t <= 7000; t += 150) {
      await page.waitForTimeout(150);
      const m = await page.evaluate(measure);
      if (m.ribOpacity > 0.5 && !madeSeen && /\bmade\b/.test(m.text)) { madeSeen = true; madeW = m.pillRect.w; }
      if (/\binvented\b/.test(m.text)) { invW = m.pillRect.w; break; }
    }
    console.log(`DESKTOP pill width: made=${madeW} invented=${invW} -> jump=${madeW != null && invW != null ? Math.abs(invW - madeW) : 'n/a'}px (want ~0)`);
    await ctx.close();
  }

  // ---------- (B) MOBILE: fit + flip stability + collisions ----------
  for (const [W, H, tag] of [[390, 844, 'iph14'], [360, 640, '360'], [412, 915, 'pixel7']]) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log(`PAGEERROR[${tag}]:`, e.message));
    await ctx.addInitScript(() => { try { localStorage.setItem('lantern.gloss', 'uk'); } catch (e) {} });
    await page.goto('file:///C:/Landing%20Lantern/index.html');
    await page.waitForTimeout(2700);
    await playSimplify(page);
    let madeW = null, invW = null, snap = null, shotMade = false, shotInv = false;
    for (let t = 0; t <= 7000; t += 150) {
      await page.waitForTimeout(150);
      const m = await page.evaluate(measure);
      if (m.ribOpacity > 0.5 && /\bmade\b/.test(m.text)) {
        madeW = m.pillRect.w; snap = m;
        if (!shotMade) { shotMade = true; await page.screenshot({ path: path.join(OUT, `final-m-${tag}.png`) }); }
      }
      if (/\binvented\b/.test(m.text)) {
        invW = m.pillRect.w;
        if (!shotInv) { shotInv = true; await page.screenshot({ path: path.join(OUT, `final-m-${tag}-inv.png`) }); }
        break;
      }
    }
    if (snap) {
      const offscreen = snap.pillRect.left < 2 || snap.pillRect.right > W - 2;
      const intoDeck = (snap.deckRect) ? Math.max(0, snap.pillRect.bottom - snap.deckRect.top) : 'n/a';
      const intoNav = (snap.navRect) ? Math.max(0, snap.pillRect.bottom - snap.navRect.top) : 'n/a';
      console.log(`${tag} (${W}px): pill=${JSON.stringify(snap.pillRect)} jump=${invW != null ? Math.abs(invW - madeW) : '?'}px offscreenX=${offscreen} intoDeck=${intoDeck} intoNav=${intoNav}`);
    } else {
      console.log(`${tag}: FAIL ribbon never visible`);
    }
    await ctx.close();
  }

  await browser.close();
  console.log('done ->', OUT);
})().catch(e => { console.error(e); process.exit(1); });
