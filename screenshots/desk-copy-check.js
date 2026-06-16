/* Desktop sanity: subs + Practice article must show FULL original copy inline. */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1520, height: 800 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  const out = (n) => path.join(__dirname, 'copychk', 'desk-' + n + '.png');

  await page.waitForTimeout(5000);
  await page.screenshot({ path: out('1-home') });

  // verify the .m-hide prose is present (inline) on desktop
  const exText = await page.evaluate(() => {
    var p = document.querySelectorAll('#hero .ex-page p');
    return p.length ? p[p.length - 1].textContent : '(none)';
  });
  console.log('DESKTOP ex-page para2:', exText);

  const subs = await page.evaluate(() => Array.prototype.map.call(
    document.querySelectorAll('[data-m]'), function (n) { return n.textContent; }));
  console.log('DESKTOP subs:', JSON.stringify(subs, null, 1));

  await browser.close();
  console.log('done');
})().catch(e => { console.error(e); process.exit(1); });
