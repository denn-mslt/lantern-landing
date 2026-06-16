const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(2600);
  const g = await page.evaluate(() => {
    const h1 = document.querySelector('#hero .hero-copy h1');
    const cs = getComputedStyle(h1);
    return { display: cs.display, whiteSpace: cs.whiteSpace, webkitLineClamp: cs.webkitLineClamp,
      boxOrient: cs.webkitBoxOrient, html: h1.innerHTML, childCount: h1.childNodes.length,
      children: [...h1.children].map(c=>c.tagName+'.'+c.className) };
  });
  console.log(JSON.stringify(g, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
