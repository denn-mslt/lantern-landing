/* Mobile parity for the Simplify payoff ribbon: it must appear under the browser
   without colliding with the vocab strip / nav cluster, and produce no JS errors.
   (No Next pill on mobile — it's display:none; the crank is the nav.) */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const OUT = path.join(__dirname, 'simp-ribbon');
fs.mkdirSync(OUT, { recursive: true });

const DEVICES = [[390, 844, 'iph14'], [360, 640, '360x640']];

(async () => {
  const browser = await chromium.launch();
  for (const [W, H, tag] of DEVICES) {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log(`PAGEERROR[${tag}]:`, e.message));
    await ctx.addInitScript(() => { try { localStorage.setItem('lantern.gloss', 'uk'); } catch (e) {} });
    await page.goto('file:///C:/Landing%20Lantern/index.html');
    await page.waitForTimeout(2800);
    await page.evaluate(() => { if (window.LanternPhases) window.LanternPhases.jump(1); });
    await page.waitForTimeout(1400);
    await page.evaluate(() => { const d = document.getElementById('hero-simp-dot'); if (d) d.click(); });

    let seen = false;
    for (let t = 0; t <= 6000; t += 250) {
      await page.waitForTimeout(250);
      const g = await page.evaluate(() => {
        const opa = el => el ? parseFloat(getComputedStyle(el).opacity) : null;
        const r = el => { if (!el) return null; const q = el.getBoundingClientRect(); return { top: Math.round(q.top), bottom: Math.round(q.bottom), left: Math.round(q.left), right: Math.round(q.right) }; };
        const rib = document.getElementById('hero-simp-ribbon');
        const ov = (a, c) => (a && c) ? Math.max(0, Math.round(a.bottom - c.top)) : 0;
        return {
          ribOpacity: opa(rib), ribRect: r(rib),
          brRect: r(document.querySelector('#hero .browser')),
          deckRect: r(document.getElementById('worddeck')),
          navRect: r(document.querySelector('.m-navcluster')),
          vw: window.innerWidth,
        };
      });
      if (g.ribOpacity > 0.5 && !seen) {
        seen = true;
        const ribIntoDeck = (g.ribRect && g.deckRect) ? Math.max(0, g.ribRect.bottom - g.deckRect.top) : 'n/a';
        const ribIntoNav = (g.ribRect && g.navRect) ? Math.max(0, g.ribRect.bottom - g.navRect.top) : 'n/a';
        const offRight = g.ribRect ? (g.ribRect.right > g.vw || g.ribRect.left < 0) : 'n/a';
        console.log(`${tag} RIBBON @${t}ms: ribRect=${JSON.stringify(g.ribRect)} brBottom=${g.brRect && g.brRect.bottom} ribIntoDeck=${ribIntoDeck} ribIntoNav=${ribIntoNav} offscreenX=${offRight}`);
        await page.screenshot({ path: path.join(OUT, `m-ribbon-${tag}.png`) });
      }
    }
    if (!seen) console.log(`${tag} FAIL: ribbon never visible`);
    await ctx.close();
  }
  await browser.close();
  console.log('done ->', OUT);
})().catch(e => { console.error(e); process.exit(1); });
