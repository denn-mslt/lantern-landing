/* Scrubber test: drag the bead to the far right, watch the chase walk
   through every phase at capped speed. */
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
  await page.goto('file:///C:/Landing%20Lantern/main.html');
  await page.waitForTimeout(3000);

  const out = (n) => path.join(__dirname, 'mob', 'scrub-' + n + '.png');

  // locate the track
  const box = await page.locator('.m-scrub-track').boundingBox();
  console.log('track box:', box);
  const y = box.y + box.height / 2;

  await page.screenshot({ path: out('0-idle') });

  // drag from left end to right end
  await page.mouse.move(box.x + 4, y);
  await page.mouse.down();
  await page.waitForTimeout(150);
  for (let i = 1; i <= 10; i++) {
    await page.mouse.move(box.x + (box.width * i / 10), y);
    await page.waitForTimeout(60);
  }
  await page.screenshot({ path: out('1-dragging') });
  await page.mouse.up();

  // watch the chase: phase should advance ~1 per 1.15s
  for (let i = 0; i < 8; i++) {
    await page.waitForTimeout(1500);
    const ph = await page.evaluate(() => window.LanternPhases.get());
    console.log('t+' + ((i + 1) * 1.5).toFixed(1) + 's phase=' + ph);
    if (i === 2 || i === 4) await page.screenshot({ path: out('2-chase-' + i) });
  }
  await page.waitForTimeout(2500);
  await page.screenshot({ path: out('3-final') });
  console.log('final phase:', await page.evaluate(() => window.LanternPhases.get()));

  // drag back to the middle (TRANSLATE, phase 2) — backward chase
  const box2 = await page.locator('.m-scrub-track').boundingBox();
  await page.mouse.move(box2.x + box2.width, y);
  await page.mouse.down();
  await page.mouse.move(box2.x + box2.width / 3, y, { steps: 8 });
  await page.mouse.up();
  await page.waitForTimeout(7000);
  console.log('after back-drag phase:', await page.evaluate(() => window.LanternPhases.get()));
  await page.screenshot({ path: out('4-back') });

  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
