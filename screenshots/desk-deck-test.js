/* Verify the desktop bottom deck @1440x900: side rail gone, deck present,
   PLAY auto-walks phases, click-to-jump and arrow keys drive phases. */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERR:', e.message));
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(1500);

  const out = (n) => path.join(__dirname, 'desk', n);
  const phase = () => page.evaluate(() => window.LanternPhases.get());
  const cap = () => page.$eval('#d-cap', el => el.textContent.trim());

  const setup = await page.evaluate(() => ({
    deck: !!document.getElementById('d-deck'),
    deckVisible: document.getElementById('d-deck') ? getComputedStyle(document.getElementById('d-deck')).display !== 'none' : false,
    railVisible: document.querySelector('.m-dotnav') ? getComputedStyle(document.querySelector('.m-dotnav')).display !== 'none' : false,
    play: !!document.getElementById('d-play'),
    ticks: document.querySelectorAll('#d-deck .d-tick').length,
    role: document.getElementById('d-scrub').getAttribute('role'),
  }));
  console.log('setup:', JSON.stringify(setup));
  console.log('idle:', await cap(), '| phase', await phase());
  await page.screenshot({ path: out('deck-0-idle.png') });

  // PLAY
  await page.click('#d-play');
  console.log('playing class:', await page.$eval('#d-play', el => el.classList.contains('playing')));
  await page.waitForTimeout(2600);
  console.log('mid:', await cap(), '| phase', await phase());
  await page.screenshot({ path: out('deck-1-playing.png') });
  await page.waitForTimeout(7000);
  console.log('late:', await cap(), '| phase', await phase(), '| playing:', await page.$eval('#d-play', el => el.classList.contains('playing')));
  await page.screenshot({ path: out('deck-2-late.png') });

  // click-to-jump: click near the left of the track (HOME) to walk back
  const box = await page.$eval('#d-scrub .d-track', el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top + r.height / 2, w: r.width }; });
  await page.mouse.click(box.x + box.w * 0.33, box.y);   // ~phase 2 (TRANSLATE)
  await page.waitForTimeout(4500);
  console.log('after click ~0.33:', await cap(), '| phase', await phase());

  // keyboard: focus slider, ArrowRight twice
  await page.focus('#d-scrub');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1500);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(1500);
  console.log('after 2x ArrowRight:', await cap(), '| phase', await phase(), '| valuetext', await page.$eval('#d-scrub', el => el.getAttribute('aria-valuetext')));

  // interrupt test: start play, then user wheel should hand control back
  await page.click('#d-play');
  await page.waitForTimeout(1400);
  const beforeWheel = await phase();
  await page.mouse.move(720, 450);
  await page.mouse.wheel(0, 300);          // user takes the wheel
  await page.waitForTimeout(1800);
  console.log('interrupt: playingClass=', await page.$eval('#d-play', el => el.classList.contains('playing')), '| phase moved', beforeWheel, '->', await phase());

  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
