/* Capture the ribbon→Next MORPH (View Transitions) on desktop: a burst of frames
   across the morph window should show one pill resizing from the wide white ribbon
   into the compact "Next: Translate" pill — not two separate elements crossfading. */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const OUT = path.join(__dirname, 'simp-ribbon', 'morph');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1520, height: 800 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await ctx.addInitScript(() => { try { localStorage.setItem('lantern.gloss', 'uk'); } catch (e) {} });
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  // slow the morph WAY down (probe-only) so the burst captures it mid-flight
  await page.addStyleTag({ content: '::view-transition-group(simp-morph),::view-transition-old(simp-morph),::view-transition-new(simp-morph){animation-duration:2.4s !important}' });
  await page.waitForTimeout(2500);
  await page.evaluate(() => { if (window.LanternPhases) window.LanternPhases.jump(1); });
  await page.waitForTimeout(1400);
  await page.evaluate(() => { const d = document.getElementById('hero-simp-dot'); if (d) d.click(); });

  // poll for the morph kickoff (the injected #simp-morph-style), then burst-capture
  let armed = false;
  for (let t = 0; t < 9000; t += 30) {
    armed = await page.evaluate(() => !!document.getElementById('simp-morph-style'));
    if (armed) break;
    await page.waitForTimeout(30);
  }
  console.log('morph armed:', armed);
  for (let i = 0; i < 14; i++) {
    await page.screenshot({ path: path.join(OUT, `f${String(i).padStart(2, '0')}.png`), clip: { x: 300, y: 520, width: 900, height: 280 }, animations: 'allow' });
    await page.waitForTimeout(170);
  }
  await page.waitForTimeout(1200);
  const fin = await page.evaluate(() => {
    const opa = el => el ? parseFloat(getComputedStyle(el).opacity) : null;
    const nx = document.getElementById('hero-simp-next');
    const rib = document.getElementById('hero-simp-ribbon');
    const styleLeft = document.getElementById('simp-morph-style');
    return {
      nextShow: nx ? nx.classList.contains('show') : null, nextOpacity: opa(nx), nextText: nx && nx.textContent.replace(/\s+/g, ' ').trim(),
      ribOpacity: opa(rib), ribName: rib && rib.style.viewTransitionName, nextName: nx && nx.style.viewTransitionName,
      styleCleanedUp: !styleLeft,
    };
  });
  console.log('FINAL:', JSON.stringify(fin));
  await ctx.close();
  await browser.close();
  console.log('frames ->', OUT);
})().catch(e => { console.error(e); process.exit(1); });
