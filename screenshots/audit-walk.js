/* Audit walk — capture every phase on iPhone / Android / desktop from index.html.
   Focus: the DISCUSS chat (phase 3) on phones, where the reported problem is. */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

const URL = 'file:///C:/Landing%20Lantern/index.html';
const OUT = path.join(__dirname, 'audit');
fs.mkdirSync(OUT, { recursive: true });

const NAMES = ['home', 'simplify', 'translate', 'discuss', 'practice', 'everywhere', 'install'];

async function walk(label, viewport, mobile) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    hasTouch: mobile,
    isMobile: mobile
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log(`[${label}] PAGEERROR:`, e.message));
  await page.goto(URL);
  await page.waitForTimeout(2600);

  for (let p = 0; p < 7; p++) {
    await page.evaluate(n => window.LanternPhases && window.LanternPhases.jump(n), p);
    // discuss + practice need time to play their scripted scenes
    const settle = (p === 3) ? 1800 : (p === 4 ? 1400 : 900);
    await page.waitForTimeout(settle);
    await page.screenshot({ path: path.join(OUT, `${label}-${p}-${NAMES[p]}.png`) });
    // for DISCUSS, grab a couple more frames as the chat streams in
    if (p === 3) {
      await page.waitForTimeout(2200);
      await page.screenshot({ path: path.join(OUT, `${label}-3-discuss-mid.png`) });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(OUT, `${label}-3-discuss-late.png`) });
      // measure overlap between the chat dock and the bottom nav cluster
      const m = await page.evaluate(() => {
        const dock = document.getElementById('hero-dock');
        const nav = document.querySelector('.m-navcluster');
        const body = document.querySelector('#hero .browser .page');
        const r = el => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), left: Math.round(b.left), right: Math.round(b.right), h: Math.round(b.height) }; };
        return { vh: window.innerHeight, dock: r(dock), nav: r(nav), page: r(body) };
      });
      console.log(`[${label}] discuss metrics:`, JSON.stringify(m));
    }
  }
  await browser.close();
  console.log(`[${label}] done`);
}

(async () => {
  await walk('iphone', { width: 390, height: 844 }, true);   // iPhone 14/15
  await walk('android', { width: 360, height: 800 }, true);  // common Android
  await walk('small', { width: 360, height: 640 }, true);    // short / older phone
  await walk('desktop', { width: 1440, height: 900 }, false);
  console.log('ALL DONE');
})().catch(e => { console.error(e); process.exit(1); });
