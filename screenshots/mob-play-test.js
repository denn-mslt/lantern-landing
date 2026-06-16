/* Verify the mobile PLAY button: load index.html @390x844, shoot the idle
   bar, tap play, then shoot a couple frames to confirm phases auto-advance,
   and confirm a touch interrupts playback. */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2, hasTouch: true, isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR:', e.message));
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(1500);

  const out = (n) => path.join(__dirname, 'play', n);
  const cap = () => page.$eval('#m-phase-caption', el => el.textContent.trim());

  console.log('idle caption:', await cap());
  await page.screenshot({ path: out('0-idle.png') });

  // tap play
  await page.click('#m-playbtn');
  console.log('btn playing class:', await page.$eval('#m-playbtn', el => el.classList.contains('playing')));
  await page.waitForTimeout(2500);
  console.log('mid caption:', await cap());
  await page.screenshot({ path: out('1-playing.png') });

  await page.waitForTimeout(4000);
  console.log('late caption:', await cap());
  await page.screenshot({ path: out('2-late.png') });

  // wait for it to finish, then verify icon reverted + we reached INSTALL
  await page.waitForTimeout(4000);
  console.log('end caption:', await cap(), '| still playing:', await page.$eval('#m-playbtn', el => el.classList.contains('playing')));

  // restart + interrupt test
  await page.click('#m-playbtn');
  await page.waitForTimeout(1200);
  const before = await cap();
  await page.touchscreen.tap(195, 420);     // a touch anywhere = take control
  await page.waitForTimeout(400);
  console.log('interrupt: playingClass=', await page.$eval('#m-playbtn', el => el.classList.contains('playing')), '| caption~', before);

  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
