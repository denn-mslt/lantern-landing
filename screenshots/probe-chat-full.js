/* Capture the fully-played mobile chat + measure whether cw-body overflows
   (content cut / forced internal scroll). iPhone, Android, short phone. */
const path = require('path');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const URL = 'file:///C:/Landing%20Lantern/index.html';
const OUT = path.join(__dirname, 'audit');

async function run(label, viewport) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.waitForTimeout(2600);
  await page.evaluate(() => window.LanternPhases.jump(3));
  // poll until the bot answer has streamed (cw-bot present with text) or timeout
  let played = false;
  for (let i = 0; i < 18; i++) {
    await page.waitForTimeout(700);
    const st = await page.evaluate(() => {
      const bot = document.querySelector('#dock-body .cw-bot');
      const body = document.getElementById('dock-body');
      return {
        phase: window.LanternPhases.get(),
        botLen: bot ? bot.textContent.trim().length : 0,
        overflow: body ? (body.scrollHeight - body.clientHeight) : 0,
        scrollTop: body ? body.scrollTop : 0
      };
    });
    if (st.phase !== 3) { console.log(`[${label}] phase left to ${st.phase} at i=${i}`); break; }
    if (st.botLen > 40) { played = true; console.log(`[${label}] bot streamed, overflow=${st.overflow}px scrollTop=${st.scrollTop}`); break; }
  }
  await page.screenshot({ path: path.join(OUT, `chatfull-${label}.png`) });
  await browser.close();
  console.log(`[${label}] played=${played}`);
}

(async () => {
  await run('iphone', { width: 390, height: 844 });
  await run('android', { width: 360, height: 800 });
  await run('short', { width: 360, height: 640 });
  console.log('DONE');
})().catch(e => { console.error(e); process.exit(1); });
