/* Probe the mobile Discuss(visual 6) -> Everywhere(visual 7) transition.
   Confirms whether the phenomenon flying-card morph runs on mobile, and
   measures the #ev wall layout (page count + slot geometry). */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const OUT = path.join(__dirname, 'mob-67');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE.ERR:', m.text()); });
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(3000);

  const api = await page.evaluate(() => ({
    hasLP: !!window.LanternPhases,
    keys: window.LanternPhases ? Object.keys(window.LanternPhases) : [],
    hasLE: !!(window.LanternEverywhere),
    leKeys: window.LanternEverywhere ? Object.keys(window.LanternEverywhere) : [],
    innerWidth: window.innerWidth
  }));
  console.log('API:', JSON.stringify(api));

  // Jump to DISCUSS (visual pos 5 -> internal 4) and let it settle.
  await page.evaluate(() => window.LanternPhases.jump(5));
  await page.waitForTimeout(2500);
  console.log('phase after jump(5):', await page.evaluate(() => window.LanternPhases.get()));
  await page.screenshot({ path: path.join(OUT, '00-discuss.png') });

  // measure the phenomenon card existence
  const phInfo = await page.evaluate(() => {
    var ph = window.Shelf ? window.Shelf.cardEl('phenomenon') : null;
    var r = ph ? ph.getBoundingClientRect() : null;
    return { hasShelf: !!window.Shelf, phExists: !!ph, phBox: r ? { w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left), top: Math.round(r.top) } : null };
  });
  console.log('PH:', JSON.stringify(phInfo));

  // Now STEP forward to Everywhere (internal 6). Capture frames during transition.
  await page.evaluate(() => window.LanternPhases.step(1));
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(180);
    await page.screenshot({ path: path.join(OUT, `t-${String(i).padStart(2,'0')}.png`) });
  }
  await page.waitForTimeout(800);
  console.log('phase after step:', await page.evaluate(() => window.LanternPhases.get()));
  await page.screenshot({ path: path.join(OUT, '90-after.png') });

  // measure the #ev wall pages (slots) on mobile
  const wall = await page.evaluate(() => {
    var ev = document.getElementById('finale');
    if (!ev) return { ev: false };
    var pages = Array.from(ev.querySelectorAll('.pg'));
    return {
      ev: true,
      pageCount: pages.length,
      slots: pages.map(function (p) { var r = p.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), left: Math.round(r.left), top: Math.round(r.top) }; })
    };
  });
  console.log('WALL:', JSON.stringify(wall, null, 2));

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
