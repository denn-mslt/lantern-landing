/* Reproduce: on mobile, screen 1 -> 2 advances too easily / automatically.
   Drives index.html in a mobile context and checks how little input it
   takes to leave the hero (phase 0). */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: true,
    isMobile: true
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(2500);

  const phase = () => page.evaluate(() => window.LanternPhases.get());
  const sy = () => page.evaluate(() => window.scrollY);
  console.log('initial phase=', await phase(), 'scrollY=', await sy(), 'crank=', await page.evaluate(()=>!!window.__mCrank));

  // 1) tiny native scroll (accidental brush) — does the phase leave 0?
  await page.evaluate(() => window.scrollBy(0, 80));
  await page.waitForTimeout(1500);
  console.log('after scrollBy(80): phase=', await phase(), 'scrollY=', await sy());

  // reset
  await page.evaluate(() => window.scrollTo(0,0));
  await page.waitForTimeout(800);

  // 2) small finger swipe ~60px
  const cx = 195;
  await page.touchscreen.tap(cx, 500).catch(()=>{});
  async function swipe(dist, steps, dt) {
    const y0 = 600;
    await page.evaluate(({x,y}) => {
      const t = new Touch({identifier:1, target:document.body, clientX:x, clientY:y});
      document.body.dispatchEvent(new TouchEvent('touchstart',{touches:[t],changedTouches:[t],bubbles:true}));
    }, {x:cx, y:y0});
    for (let i=1;i<=steps;i++){
      const y = y0 - dist*i/steps;
      await page.evaluate(({x,y}) => {
        const t = new Touch({identifier:1, target:document.body, clientX:x, clientY:y});
        document.body.dispatchEvent(new TouchEvent('touchmove',{touches:[t],changedTouches:[t],bubbles:true}));
      }, {x:cx, y});
      await page.waitForTimeout(dt);
    }
    const yEnd = y0 - dist;
    await page.evaluate(({x,y}) => {
      const t = new Touch({identifier:1, target:document.body, clientX:x, clientY:y});
      document.body.dispatchEvent(new TouchEvent('touchend',{touches:[],changedTouches:[t],bubbles:true}));
    }, {x:cx, y:yEnd});
  }

  for (const d of [35, 45, 60, 90, 150]) {
    await page.evaluate(() => { if (window.LanternPhases && window.LanternPhases.jump) window.LanternPhases.jump(0); window.scrollTo(0,0); });
    await page.waitForTimeout(900);
    const before = await phase();
    await swipe(d, 6, 20);
    await page.waitForTimeout(1400);
    console.log(`swipe ${d}px: phase ${before} -> ${await phase()} (scrollY=${await sy()})`);
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
