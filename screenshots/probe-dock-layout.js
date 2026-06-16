/* Dump the mobile DISCUSS dock's children boxes — is the composer visible? clipped? */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const URL = 'file:///C:/Landing%20Lantern/index.html';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.waitForTimeout(2600);
  await page.evaluate(() => window.LanternPhases.jump(3));
  await page.waitForTimeout(9000); // let the whole chat play
  const info = await page.evaluate(() => {
    const dock = document.getElementById('hero-dock');
    const cs = getComputedStyle(dock);
    const r = el => { const b = el.getBoundingClientRect(); return { tag: el.className, top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height), vis: getComputedStyle(el).display !== 'none' && b.height > 0 }; };
    const foot = dock.querySelector('.cw-foot');
    const comp = dock.querySelector('.cw-composer');
    const input = dock.querySelector('.cw-composer input');
    return {
      vh: window.innerHeight,
      dock: { top: Math.round(dock.getBoundingClientRect().top), bottom: Math.round(dock.getBoundingClientRect().bottom), maxH: cs.maxHeight, overflow: cs.overflow },
      children: Array.from(dock.children).map(r),
      footInView: foot ? (foot.getBoundingClientRect().bottom <= dock.getBoundingClientRect().bottom + 1) : null,
      composer: comp ? r(comp) : null,
      inputPlaceholder: input ? input.getAttribute('placeholder') : null,
      inputVisible: input ? (input.getBoundingClientRect().height > 0 && input.getBoundingClientRect().bottom <= window.innerHeight) : null
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
