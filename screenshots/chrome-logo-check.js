const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const CUR =
  '<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">' +
  '<circle cx="24" cy="24" r="12" fill="#fff"/>' +
  '<path d="M24 12h20.78A23.993 23.993 0 0 0 3.217 12.003L13.608 30l.009-.002A11.985 11.985 0 0 1 24 12z" fill="#EA4335"/>' +
  '<circle cx="24" cy="24" r="9.5" fill="#1a73e8"/>' +
  '<path d="M34.39 30.003 24.001 48A23.994 23.994 0 0 0 44.78 12.003H23.999l-.003.009A11.985 11.985 0 0 1 34.39 30.003z" fill="#FBBC04"/>' +
  '<path d="M13.609 30.003 3.218 12.006A23.994 23.994 0 0 0 24.003 48L34.393 30.003l-.007-.007a11.985 11.985 0 0 1-20.778.007z" fill="#34A853"/>' +
  '</svg>';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 400, height: 200 }, deviceScaleFactor: 4 });
  await page.setContent('<body style="margin:0;display:flex;gap:30px;align-items:center;background:#f2efe9;padding:30px"><div style="width:120px;height:120px">'+CUR+'</div><div style="width:48px;height:48px">'+CUR+'</div></body>');
  await page.screenshot({ path: 'chrome-cur.png' });
  await browser.close();
})();
