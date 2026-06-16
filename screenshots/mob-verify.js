/* Verify all mobile blocker fixes on index.html: page errors (smart-quote break),
   stray Next pills hidden, Translate card placement, IMMERSE no-overflow, EVERYWHERE
   auto-simplify cascade (badges tick), CTA Privacy link. */
const path = require('path');
const fs = require('fs');
const { chromium } = require(path.join(process.env.APPDATA, 'npm', 'node_modules', 'playwright'));
const OUT = path.join(__dirname, 'mob-verify');
fs.mkdirSync(OUT, { recursive: true });

const errors = [];
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', e => { errors.push(e.message); console.log('PAGEERROR:', e.message); });
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE-ERR:', m.text()); });
  await page.goto('file:///C:/Landing%20Lantern/index.html');
  await page.waitForTimeout(3500);
  console.log('LP:', await page.evaluate(() => typeof window.LanternPhases), '| Shelf:', await page.evaluate(() => typeof window.Shelf));

  const jump = async (n, wait) => { await page.evaluate(p => window.LanternPhases && window.LanternPhases.jump(p), n); await page.waitForTimeout(wait || 2600); };
  const vis = (sel) => page.evaluate(s => { const e = document.querySelector(s); if (!e) return 'absent'; const cs = getComputedStyle(e); return cs.display === 'none' ? 'hidden' : (cs.opacity === '0' ? 'opacity0' : 'VISIBLE'); }, sel);

  // P1 SIMPLIFY — simp-next pill must be hidden; vocab strip clean
  await jump(1);
  console.log('P1 simp-next:', await vis('#hero-simp-next'));
  await page.screenshot({ path: path.join(OUT, 'p1-simplify.png') });

  // P2 TRANSLATE — card on screen, tc-next hidden, card not overlapping strip
  await jump(2);
  console.log('P2 tc-next:', await vis('#hero-tc-next'));
  const tc = await page.evaluate(() => { const c = document.getElementById('hero-tpanel'); if (!c) return null; const r = c.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) }; });
  console.log('P2 tcard box:', JSON.stringify(tc), '(strip top ~686; card bottom should be < ~686)');
  await page.screenshot({ path: path.join(OUT, 'p2-translate.png') });

  // P3 IMMERSE — flip to gloss; check page does not overflow the frame
  await jump(3, 3000);
  const imm = await page.evaluate(() => {
    const pg = document.querySelector('#hero .browser .page'); const surf = document.querySelector('#hero .imm-surface');
    if (!pg) return null; const pr = pg.getBoundingClientRect(); const sr = surf ? surf.getBoundingClientRect() : null;
    return { pageH: Math.round(pr.height), pageBottom: Math.round(pr.bottom), surfBottom: sr ? Math.round(sr.bottom) : null, overflow: sr ? (sr.bottom > pr.bottom + 2) : null };
  });
  console.log('P3 immerse:', JSON.stringify(imm));
  await page.screenshot({ path: path.join(OUT, 'p3-immerse.png') });

  // P6 EVERYWHERE — capture before + after the auto cascade; badges should tick down
  await jump(6, 600);
  const badgesBefore = await page.evaluate(() => [...document.querySelectorAll('.pg .pg-cefr')].map(b => b.textContent.trim()));
  await page.screenshot({ path: path.join(OUT, 'p6-ev-before.png') });
  await page.waitForTimeout(3800);   // let the staggered cascade finish
  const badgesAfter = await page.evaluate(() => [...document.querySelectorAll('.pg .pg-cefr')].map(b => b.textContent.trim()));
  console.log('P6 badges before:', JSON.stringify(badgesBefore));
  console.log('P6 badges after: ', JSON.stringify(badgesAfter));
  await page.screenshot({ path: path.join(OUT, 'p6-ev-after.png') });

  // P7 CTA — Privacy link reachable
  await jump(7, 3000);
  const priv = await page.evaluate(() => { const a = document.querySelector('.m-priv-link'); if (!a) return 'absent'; const r = a.getBoundingClientRect(); return { href: a.getAttribute('href'), text: a.textContent, onScreen: r.top >= 0 && r.bottom <= innerHeight && r.width > 0 }; });
  console.log('P7 privacy:', JSON.stringify(priv));
  await page.screenshot({ path: path.join(OUT, 'p7-cta.png') });

  console.log('\n=== PAGE ERRORS:', errors.length, '===');
  await browser.close();
  process.exit(errors.length ? 2 : 0);
})().catch(e => { console.error(e); process.exit(1); });
