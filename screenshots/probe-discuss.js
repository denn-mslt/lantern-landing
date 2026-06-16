/* Isolate the DISCUSS phase: fresh load, jump straight to phase 3, poll the
   phase value over time, and screenshot. Mobile + desktop side by side. */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

const URL = 'file:///C:/Landing%20Lantern/index.html';
const OUT = path.join(__dirname, 'audit');
fs.mkdirSync(OUT, { recursive: true });

async function probe(label, viewport, mobile) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: mobile, isMobile: mobile });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log(`[${label}] PAGEERROR:`, e.message));
  await page.goto(URL);
  await page.waitForTimeout(2600);

  await page.evaluate(() => window.LanternPhases.jump(3));
  const trail = [];
  for (let i = 0; i < 14; i++) {
    await page.waitForTimeout(700);
    const s = await page.evaluate(() => ({
      phase: window.LanternPhases.get(),
      p4: document.body.classList.contains('hero-p4'),
      dockShown: !!document.querySelector('#hero-dock.show'),
      pageOpacity: getComputedStyle(document.querySelector('#hero .browser .page')).opacity,
      bodyMsgs: document.querySelectorAll('#dock-body .dk-b, #dock-body .cw-user, #dock-body .cw-bot').length
    }));
    trail.push(`t+${((i + 1) * 0.7).toFixed(1)}s ph=${s.phase} p4=${s.p4?1:0} dock=${s.dockShown?1:0} op=${s.pageOpacity} msgs=${s.bodyMsgs}`);
    if (i === 4) await page.screenshot({ path: path.join(OUT, `probe-${label}-a.png`) });
    if (i === 9) await page.screenshot({ path: path.join(OUT, `probe-${label}-b.png`) });
  }
  await page.screenshot({ path: path.join(OUT, `probe-${label}-c.png`) });
  console.log(`[${label}]\n  ` + trail.join('\n  '));
  await browser.close();
}

(async () => {
  await probe('m', { width: 390, height: 844 }, true);
  await probe('d', { width: 1440, height: 900 }, false);
  console.log('DONE');
})().catch(e => { console.error(e); process.exit(1); });
