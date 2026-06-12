/* ============================================================
   Lantern Landing v3 — engine
   Shared infrastructure for the three-act story:
   - damped scroll → section transitions + parallax + reveals
   - backdrop hue morph, dot nav, nav solidify
   - WordShelf: the persistent "thread" — a docked shelf of saved
     words that cards fly out of, into every scene
   - cursorGuide: the reusable show-don't-tell coachmark
   - shared dictionary + tiny DOM helpers
   ============================================================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const el = (cls, tag = 'div') => { const n = document.createElement(tag); n.className = cls; return n; };
const clampv = (v, a, b) => Math.max(a, Math.min(b, v));
const wait = ms => new Promise(r => setTimeout(r, ms));
const raf2 = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const ICON = {
  spk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="15" height="15"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>',
  bk: '<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M6 2h12a1 1 0 0 1 1 1v18l-7-5-7 5V3a1 1 0 0 1 1-1z"/></svg>',
  ck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="15" height="15"><path d="M20 6 9 17l-5-5"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2zM19 14l.8 2.6L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.4L19 14z"/></svg>',
  flame: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 23a7 7 0 0 0 7-7c0-2.1-1-4-2.6-5.6-.3 1.3-1.3 2.1-2.3 2.1.9-2.3.3-4.8-1.9-6.8-1-.9-2.2-1.5-2.6-2.7-.4 1.9-.3 3.4-1.1 5-.6 1.3-1.6 2.2-2.3 3.5A7.8 7.8 0 0 0 5 16a7 7 0 0 0 7 7z"/></svg>',
};

/* ============ shared dictionary ============
   one source of truth for every word that can be saved across scenes.
   w: lemma · ph: phonetic · tr: native gloss · lvl/cls: CEFR + colour class
   def/ex: popup body · syn: synonyms                                      */
const DICT = {
  route:    { w:'route',    ph:'/ruːt/',         tr:'маршрут',     lvl:'B1', cls:'b-blue',   syn:'path · course', def:'A way taken to get from one place to another.', ex:'The coastal **route** hugs the cliffs for miles.' },
  coast:    { w:'coast',    ph:'/kəʊst/',        tr:'узбережжя',   lvl:'B1', cls:'b-green',  syn:'shore · seaside', def:'The land beside or near the sea.', ex:'They drove the whole length of the **coast**.' },
  winding:  { w:'winding',  ph:'/ˈwaɪn.dɪŋ/',    tr:'звивистий',   lvl:'B2', cls:'b-red',    syn:'twisting · curving', def:'Following a bending, curving course rather than a straight one.', ex:'A **winding** road climbed into the hills.' },
  exposed:  { w:'exposed',  ph:'/ɪkˈspəʊzd/',    tr:'відкритий',   lvl:'B2', cls:'b-red',    syn:'open · unsheltered', def:'Not protected from the weather, wind or danger.', ex:'The bridge crosses an **exposed** stretch of water.' },
  survey:   { w:'survey',   ph:'/ˈsɜː.veɪ/',     tr:'обстеження',  lvl:'B2', cls:'b-violet', syn:'study · inspection', def:'A careful examination or measurement of an area.', ex:'Engineers ran a **survey** before any building began.' },
  remote:   { w:'remote',   ph:'/rɪˈməʊt/',      tr:'віддалений',  lvl:'B1', cls:'b-blue',   syn:'distant · isolated', def:'Far away from towns or other people.', ex:'A handful of **remote** islands dot the bay.' },
  rugged:   { w:'rugged',   ph:'/ˈrʌɡ.ɪd/',      tr:'скелястий',   lvl:'B2', cls:'b-red',    syn:'rough · rocky', def:'Having a rough, uneven and often rocky surface.', ex:'The **rugged** shoreline is battered by storms.' },
  spell:    { w:'spell',    ph:'/spel/',         tr:'період',      lvl:'B1', cls:'b-blue',   syn:'period · stretch', def:'A short period of a particular kind of weather or activity.', ex:'A calm **spell** let the work go on.' },
  // popup-only extras (read but not part of the marquee save set)
  bridges:  { w:'bridge',   ph:'/brɪdʒ/',        tr:'міст',        lvl:'A2', cls:'b-green',  syn:'span · crossing', def:'A structure built over a road, river or gap so people can cross.', ex:'Low **bridges** hop from island to island.' },
  island:   { w:'island',   ph:'/ˈaɪ.lənd/',     tr:'острів',      lvl:'A2', cls:'b-green',  syn:'isle', def:'A piece of land surrounded by water.', ex:'A scatter of small **islands** lies offshore.' },
  islands:  { w:'island',   ph:'/ˈaɪ.lənd/',     tr:'острів',      lvl:'A2', cls:'b-green',  syn:'isle', def:'A piece of land surrounded by water.', ex:'A scatter of small **islands** lies offshore.' },
  storms:   { w:'storm',    ph:'/stɔːm/',        tr:'шторм',       lvl:'A2', cls:'b-green',  syn:'tempest · gale', def:'Very bad weather with strong wind and rain.', ex:'Winter **storms** close the road for days.' },
  // full PARA0 coverage — so any saved word carries a transcription
  threads:  { w:'thread',   ph:'/θred/',         tr:'пролягає',    lvl:'B2', cls:'b-red',    syn:'wind · weave', def:'To move or pass carefully through a narrow space.', ex:'The road **threads** between the rocks.' },
  along:    { w:'along',    ph:'/əˈlɒŋ/',        tr:'уздовж',      lvl:'A2', cls:'b-green',  syn:'beside', def:'Moving in a line next to something long.', ex:'They walked **along** the shore.' },
  stretch:  { w:'stretch',  ph:'/stretʃ/',       tr:'ділянка',     lvl:'B1', cls:'b-blue',   syn:'expanse · span', def:'A continuous area of land or water.', ex:'A wild **stretch** of coast.' },
  norwegian:{ w:'Norwegian',ph:'/nɔːˈwiːdʒən/',  tr:'норвезький',  lvl:'B1', cls:'b-blue',   syn:'', def:'Belonging to Norway.', ex:'The **Norwegian** coast is rugged.' },
  linking:  { w:'link',     ph:'/ˈlɪŋkɪŋ/',      tr:'зʼєднує',     lvl:'A2', cls:'b-green',  syn:'joining · connecting', def:'Joining two or more things together.', ex:'A bridge **linking** the islands.' },
  scatter:  { w:'scatter',  ph:'/ˈskætə/',       tr:'розсип',      lvl:'B2', cls:'b-red',    syn:'sprinkle · spread', def:'A small, spread-out number of things.', ex:'A **scatter** of islands.' },
  chain:    { w:'chain',    ph:'/tʃeɪn/',        tr:'низка',       lvl:'A2', cls:'b-green',  syn:'series · string', def:'A connected series of things.', ex:'A **chain** of low bridges.' },
  length:   { w:'length',   ph:'/leŋθ/',         tr:'довжина',     lvl:'A2', cls:'b-green',  syn:'extent', def:'How long something is from end to end.', ex:'The full **length** of the road.' },
  float:    { w:'float',    ph:'/fləʊt/',        tr:'ширяти',      lvl:'A2', cls:'b-green',  syn:'drift · hover', def:'To rest or move on the surface of water or air.', ex:'It seems to **float** above the sea.' },
  open:     { w:'open',     ph:'/ˈəʊpən/',       tr:'відкритий',   lvl:'A1', cls:'b-green',  syn:'clear', def:'Not closed or covered; wide and free.', ex:'The **open** sea stretched out.' },
  sea:      { w:'sea',      ph:'/siː/',          tr:'море',        lvl:'A1', cls:'b-green',  syn:'ocean', def:'The salt water that covers most of the Earth.', ex:'Above the open **sea**.' },
  road:     { w:'road',     ph:'/rəʊd/',         tr:'дорога',      lvl:'A1', cls:'b-green',  syn:'route · way', def:'A wide path for cars and traffic.', ex:'The Atlantic **Road**.' },
  atlantic: { w:'Atlantic', ph:'/ətˈlæntɪk/',    tr:'Атлантичний', lvl:'B1', cls:'b-blue',   syn:'', def:'The ocean between Europe/Africa and the Americas.', ex:'The **Atlantic** Road.' },
};
const FALLBACK_PH = { the:'/ðə/', an:'/ən/', a:'/ə/', of:'/əv/', by:'/baɪ/', for:'/fɔː/', its:'/ɪts/', to:'/tuː/', low:'/ləʊ/', much:'/mʌtʃ/', just:'/dʒʌst/', above:'/əˈbʌv/', seems:'/siːmz/' };
const genDef = w => ({ w, ph:(FALLBACK_PH[w] || ''), tr:'···', lvl:'A2', cls:'b-green', syn:'', def:'Tap to see this word at your level — its meaning, pronunciation and examples.', ex:'' });
const boldEx = s => s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

/* ============ guided ghost cursor (shared coachmark) ============
   Stays visible across chained steps when you pass { stay:true }; call
   finish() to dismiss. Reused as ONE persistent cursor through a demo.   */
function makeCursorGuide(stage) {
  if (REDUCED) return { run() {}, cancel() {}, finish() {}, get dead() { return true; } };
  if (getComputedStyle(stage).position === 'static') stage.style.position = 'relative';
  const cur = el('gcursor');
  cur.innerHTML = '<svg class="gc-ptr" viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l15 8.5-6.2 1.6L16.5 20l-2.8 1-3-6.6L5 18z"/></svg><span class="gc-label"></span>';
  const ripple = el('gc-ripple'), lbl = $('.gc-label', cur);
  stage.append(ripple, cur);
  const TIPX = 5, TIPY = 4;
  let timers = [], dead = false, shown = false;
  const w = ms => new Promise(r => timers.push(setTimeout(r, ms)));
  const place = (x, y) => { cur.style.setProperty('--gx', (x - TIPX) + 'px'); cur.style.setProperty('--gy', (y - TIPY) + 'px'); };
  function point(t) {
    const sr = stage.getBoundingClientRect(), r = t.getBoundingClientRect();
    return { x: r.left - sr.left + Math.min(r.width / 2, 52), y: r.top - sr.top + r.height * 0.62 };
  }
  function finish() {
    if (dead) return; dead = true; timers.forEach(clearTimeout); timers = [];
    cur.classList.add('dim'); cur.classList.remove('show', 'tap');
    setTimeout(() => { cur.remove(); ripple.remove(); }, 450);
  }
  async function run(target, { label = '', onTap, startX, startY, hold = 620, stay = false } = {}) {
    if (!target || dead) return;
    cur.style.transitionDuration = '';     // restore the default glide easing for taps
    cur.style.transitionTimingFunction = '';
    const sr = stage.getBoundingClientRect(), tp = point(target);
    lbl.textContent = label;
    if (!shown) {
      place(startX != null ? startX : sr.width * 0.46, startY != null ? startY : Math.min(sr.height - 24, tp.y + 96));
      await w(320); if (dead) return;
      cur.classList.add('show'); shown = true;
      await w(460); if (dead) return;
    } else {
      lbl.classList.remove('hide');
      await w(260); if (dead) return;     // brief beat before gliding to the next target
    }
    place(tp.x, tp.y);
    await w(980); if (dead) return;        // let the cursor fully arrive (≥ transition) before tapping
    cur.classList.add('tap');
    ripple.style.setProperty('--rx', tp.x + 'px'); ripple.style.setProperty('--ry', tp.y + 'px');
    ripple.classList.remove('go'); void ripple.offsetWidth; ripple.classList.add('go');
    onTap && onTap();
    await w(200); if (dead) return;
    cur.classList.remove('tap');
    await w(hold); if (dead) return;
    if (stay) { return; }   // keep the cursor on screen for the next step
    finish();
  }
  /* low-level: drift the cursor to a stage-relative point (used for the "reading" sweep) */
  async function glide(x, y, { label, hold = 600, dur, ease } = {}) {
    if (dead) return;
    if (dur != null) cur.style.transitionDuration = dur + 'ms';
    if (ease != null) cur.style.transitionTimingFunction = ease;
    if (label) { lbl.textContent = label; lbl.classList.remove('hide'); }
    else { lbl.classList.add('hide'); }
    if (!shown) { place(x, y); await w(320); if (dead) return; cur.classList.add('show'); shown = true; await w(300); if (dead) return; }
    place(x, y);
    await w(hold);
  }
  return { run, glide, cancel: finish, finish, get dead() { return dead; } };
}

/* ============================================================
   WordDeck — the persistent thread, as a levitating DECK
   Docks to the right edge as a compact stacked deck. NEVER shifts
   the page. Words fly INTO it on save; cards fly OUT into scenes.
   ============================================================ */
const Shelf = (function () {
  const root = el('worddeck'); root.id = 'worddeck';
  root.innerHTML = '<div class="wd-label">My vocab</div><div class="wd-stack" id="wd-stack"></div>';
  document.body.appendChild(root);
  const stackEl = $('#wd-stack', root);
  const words = [];
  let shown = false;

  function reveal() { if (shown) return; shown = true; root.classList.add('show'); }
  function has(w) { return words.some(x => x.w === w); }
  function cardEl(w) { return $('.wd-card[data-w="' + (w || '') + '"]', stackEl); }
  function layout() {}

  const DEMO_PROGS = [0.38, 0.70, 0.55, 0.85, 0.22, 0.62];
  const MAXV = 6;   // most recent cards kept on the rail; older ones collapse away
  function add(lemma, opts) {
    opts = opts || {};
    if (has(lemma)) return cardEl(lemma);
    const d = DICT[lemma] || genDef(lemma);
    words.push({ w: lemma, ...d });
    const prog = DEMO_PROGS[words.length % DEMO_PROGS.length];
    const r = 10, circ = +(2 * Math.PI * r).toFixed(2);
    const ring = '<svg class="wd-prog" viewBox="0 0 26 26" aria-hidden="true">' +
      '<circle cx="13" cy="13" r="' + r + '" fill="none" stroke="rgba(26,23,20,.1)" stroke-width="2.2"/>' +
      '<circle cx="13" cy="13" r="' + r + '" fill="none" stroke="#F07010" stroke-width="2.2" ' +
      'stroke-dasharray="' + circ + '" stroke-dashoffset="' + (circ * (1 - prog)).toFixed(2) + '" ' +
      'stroke-linecap="round" transform="rotate(-90 13 13)"/>' +
      '</svg>';
    const card = el('wd-card ' + (d.cls || 'b-green')); card.dataset.w = lemma;
    const trCls = 't-' + (d.cls || 'b-green').replace(/^b-/, '');
    card.innerHTML =
      ring +
      '<span class="wd-w">' + d.w + '</span>' +
      '<span class="wd-row"><span class="wd-ph">' + (d.ph || '') + '</span><span class="cefr-b ' + d.cls + '">' + d.lvl + '</span></span>' +
      '<span class="wd-tr ' + trCls + '">' + (d.tr || '') + '</span>';
    stackEl.appendChild(card);
    reveal();
    if (opts.preset) {
      card.classList.add('preset');                 // invisible, holds its slot; caller fades it in
    } else {
      requestAnimationFrame(() => card.classList.add('in'));
    }
    trim();
    return card;
  }
  // keep the rail bounded: collapse the oldest cards smoothly (no jump) past MAXV
  function trim() {
    const cards = [...stackEl.querySelectorAll('.wd-card:not(.collapsing)')];
    let extra = cards.length - MAXV;
    for (let i = 0; i < extra; i++) {
      const c = cards[i];
      c.classList.add('collapsing');
      c.classList.remove('in');
      requestAnimationFrame(() => c.classList.add('gone'));
      setTimeout(() => c.remove(), 460);
    }
  }
  function rectOf() { const c = stackEl.lastElementChild; return (c || stackEl).getBoundingClientRect(); }
  function bump() { root.classList.remove('bump'); void root.offsetWidth; root.classList.add('bump'); }

  return { root, words, has, add, cardEl, rectOf, reveal, bump, stackEl, get shown() { return shown; } };
})();
window.Shelf = Shelf;

/* the saved word flies from the page and FORMS into a card as it travels to the deck.
   The destination card is reserved (invisible) up front so the ghost lands exactly on it
   and the real card fades up in place — one seamless motion, and the rail never jumps. */
function flyWordToShelf(srcRect, lemma, onDone) {
  if (Shelf.has(lemma)) { onDone && onDone(); return; }
  Shelf.reveal();
  if (REDUCED || !srcRect) { Shelf.add(lemma); onDone && onDone(); return; }
  const d = DICT[lemma] || genDef(lemma);
  const card = Shelf.add(lemma, { preset: true });          // holds its final slot, invisible
  // if the deck rail is hidden (narrow viewport), there's nowhere to fly — just settle the card
  if (card.getBoundingClientRect().width < 2) { card.classList.add('in'); onDone && onDone(); return; }
  const ghost = el('fly-word ' + (d.cls || 'b-green'));
  ghost.innerHTML = '<span class="fw-w">' + d.w + '</span><span class="fw-meta">' + (d.ph ? '<span class="fw-ph">' + d.ph + '</span>' : '<span></span>') + '<span class="cefr-b ' + d.cls + '">' + d.lvl + '</span></span>';
  // start exactly over the word, sized like the word (text state)
  ghost.style.left = srcRect.left + 'px';
  ghost.style.top = (srcRect.top - 2) + 'px';
  ghost.style.width = Math.ceil(srcRect.width) + 'px';
  document.body.appendChild(ghost);
  void ghost.offsetWidth;                                   // commit the text-state layout
  requestAnimationFrame(() => {
    const tr = card.getBoundingClientRect();
    // the ghost is anchored at the word's top-left and morphs into a 150px card IN PLACE,
    // so aligning top-left → top-left makes the formed ghost overlay the destination card
    // exactly (centre-based maths fails here because the ghost's width changes mid-flight)
    const tx = tr.left - srcRect.left;
    const ty = tr.top - (srcRect.top - 2);
    ghost.classList.add('formed');                          // morph text → full card
    ghost.style.width = '150px';
    ghost.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px)';
  });
  setTimeout(() => { card.classList.add('in'); }, 600);     // real card fades up under the arriving ghost
  setTimeout(() => { ghost.style.opacity = '0'; onDone && onDone(); }, 660);
  setTimeout(() => { ghost.remove(); }, 920);
}
window.flyWordToShelf = flyWordToShelf;

/* fly a clone of a deck card OUT to a target rect inside a scene */
function flyShelfCardTo(lemma, toRect, { scale = 1, settle = 300 } = {}) {
  return new Promise(resolve => {
    const from = Shelf.rectOf();
    if (REDUCED || !from || !toRect) { resolve(); return; }
    const d = DICT[lemma] || genDef(lemma);
    const ghost = el('fly-card out ' + (d.cls || 'b-green'));
    ghost.innerHTML = '<span class="wd-w">' + d.w + '</span><span class="wd-row">' + (d.ph ? '<span class="wd-ph">' + d.ph + '</span>' : '<span></span>') + '<span class="cefr-b ' + d.cls + '">' + d.lvl + '</span></span>';
    ghost.style.left = from.left + 'px'; ghost.style.top = from.top + 'px';
    document.body.appendChild(ghost);
    Shelf.bump();
    requestAnimationFrame(() => {
      const tx = toRect.left + toRect.width / 2 - (from.left + from.width / 2);
      const ty = toRect.top + toRect.height / 2 - (from.top + from.height / 2);
      ghost.style.transform = 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + scale + ')';
      ghost.style.opacity = '0';
    });
    setTimeout(() => { ghost.remove(); resolve(); }, 540 + settle);
  });
}
window.flyShelfCardTo = flyShelfCardTo;

/* ============ nav lives in the hero only (no scroll-solidify) ============ */
const topbar = $('#topbar');

/* ============ damped scroll → section transitions + parallax + reveals ============ */
const sects = $$('section[data-sect], .hero');
const speedEls = sects.map(s => $$('[data-speed]', s));
const txEls = sects.map(s => $('.wrap', s) || s);
const bg = $('#bg');
const COL = {
  hero:[251,176,59], act1:[233,150,70], save:[150,182,170], translate:[108,150,214], discuss:[120,162,196],
  act2:[140,196,152], exercises:[236,172,110], practice:[245,186,96],
  act3:[150,158,196], finale:[251,176,59], close:[251,176,59]
};
const colArr = sects.map(s => COL[s.id] || [196,193,186]);
const lerp = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

const TX = { on: !REDUCED, intensity: 1 };

let offs = [], hs = [], targetY = scrollY, curY = scrollY;
let mx = 0, my = 0, tmx = 0, tmy = 0;
function measure() { offs = sects.map(s => s.offsetTop); hs = sects.map(s => s.offsetHeight); }
addEventListener('scroll', () => { targetY = scrollY; }, { passive: true });
addEventListener('resize', () => { measure(); });
addEventListener('pointermove', e => { tmx = e.clientX / innerWidth - 0.5; tmy = e.clientY / innerHeight - 0.5; }, { passive: true });

function txTransform(s, d, ad) {
  if (!TX.on) return '';
  const I = TX.intensity, tx = s.dataset.tx || 'rise';
  if (tx === 'right')  return `translate3d(${(d * 78 * I).toFixed(1)}px,0,0)`;
  if (tx === 'left')   return `translate3d(${(-d * 78 * I).toFixed(1)}px,0,0)`;
  if (tx === 'zoom')   return `translate3d(0,${(d * 22 * I).toFixed(1)}px,0) scale(${(1 - ad * 0.05 * I).toFixed(3)})`;
  if (tx === 'settle') return `translate3d(0,${(d * 34 * I).toFixed(1)}px,0) scale(${(1 - ad * 0.025 * I).toFixed(3)})`;
  return `translate3d(0,${(d * 50 * I).toFixed(1)}px,0)`;
}

function loop() {
  curY += (targetY - curY) * 0.12;
  if (Math.abs(targetY - curY) < 0.2) curY = targetY;
  if (TX.on) { mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05; }
  /* crank mode (mobile): scroll position is the phase dial, not a camera move —
     the hero must hold still, so the parallax sees a permanent scrollY of 0 */
  const vh = innerHeight, vc = (window.__mCrank ? 0 : curY) + vh / 2;
  sects.forEach((s, i) => {
    const d = (offs[i] + hs[i] / 2 - vc) / vh;
    const ad = Math.min(Math.abs(d), 1);
    if (TX.on) {
      if (window.__mCrank) {
        /* crank mode: phases are controlled by classes, not parallax —
           skip opacity fade (hero section is 480vh+ tall so its center is
           far from vc and would otherwise render at ~0.38 opacity) */
        s.style.opacity = ''; txEls[i].style.transform = '';
        speedEls[i].forEach(e => e.style.transform = '');
      } else {
        s.style.opacity = (1 - ad * 0.62).toFixed(3); txEls[i].style.transform = txTransform(s, d, ad);
        speedEls[i].forEach(e => {
          const sp = parseFloat(e.dataset.speed) || 0;
          const isFloat = e.classList.contains('float');
          const moX = isFloat ? mx * sp * 300 : 0;
          const moY = isFloat ? my * sp * 200 : 0;
          e.style.transform = `translate3d(${moX.toFixed(1)}px,${(d * -sp * 220 + moY).toFixed(1)}px,0)`;
        });
      }
    } else {
      s.style.opacity = ''; txEls[i].style.transform = '';
      speedEls[i].forEach(e => e.style.transform = '');
    }
  });
  let i = 0; while (i < sects.length - 1 && vc > offs[i + 1] + hs[i + 1] / 2) i++;
  document.body.classList.toggle('at-hero', i === 0);
  document.body.classList.toggle('at-close', !!(sects[i] && (sects[i].id === 'close' || sects[i].id === 'ev-close')));
  const c0 = offs[i] + hs[i] / 2, c1 = (offs[i + 1] || offs[i]) + (hs[i + 1] || hs[i]) / 2;
  const t = clampv((vc - c0) / ((c1 - c0) || 1), 0, 1);
  const c = lerp(colArr[i], colArr[Math.min(i + 1, colArr.length - 1)], t);
  bg.style.background = `radial-gradient(120% 85% at 76% 8%, rgba(${c[0]},${c[1]},${c[2]},.22), transparent 56%), radial-gradient(110% 95% at 14% 96%, rgba(${c[0]},${c[1]},${c[2]},.13), transparent 60%), var(--paper)`;
  requestAnimationFrame(loop);
}

/* ---- one-shot reveals ---- */
function splitLines(h) {
  if (h.dataset.split) return; h.dataset.split = '1';
  h.innerHTML = h.innerHTML.split(/<br[^>]*>/i).map(p => `<span class="ln"><span class="i">${p}</span></span>`).join('');
}
function wireReveals() {
  $$('.reveal-lines').forEach(splitLines);
  $$('.feat-copy').forEach(c => c.setAttribute('data-reveal', 'up'));
  $$('.feat-grid').forEach(g => { const st = $('.feat-stage', g); if (st) st.setAttribute('data-reveal', g.classList.contains('flip') ? 'left' : 'right'); });
  if (REDUCED) return;
  const revealEls = $$('.reveal-lines,[data-reveal]');
  function revealCheck() {
    const h = innerHeight;
    for (const e of revealEls) {
      const r = e.getBoundingClientRect();
      e.classList.toggle('seen', r.top < h * 0.9 && r.bottom > h * 0.08);
    }
  }
  addEventListener('scroll', revealCheck, { passive: true });
  addEventListener('resize', revealCheck);
  window.__revealCheck = revealCheck;
  const startReveals = () => { document.body.classList.add('tx-ready'); revealCheck(); requestAnimationFrame(revealCheck); setTimeout(revealCheck, 120); };
  window.whenFontsReady ? window.whenFontsReady(startReveals) : startReveals();
}

/* ---- Tweaks hooks ---- */
window.LX = {
  setTransitions(mode) { TX.on = mode !== 'off'; TX.intensity = mode === 'gentle' ? 0.5 : 1; document.body.classList.toggle('tx-off', mode === 'off'); },
  setPalette(name) { document.body.classList.remove('theme-dusk', 'theme-slate'); if (name === 'dusk') document.body.classList.add('theme-dusk'); if (name === 'slate') document.body.classList.add('theme-slate'); },
  setGrain(on) { document.body.classList.toggle('grain-on', !!on); },
  setSnap(on) { pager.enabled = !!on && !REDUCED; },
};

measure(); wireReveals(); loop();

/* ============ section pager — wheel/key threshold snap (full-screen fixation) ============ */
document.documentElement.style.scrollBehavior = 'auto';
const pager = { i: 0, enabled: !REDUCED };
let pagerAnim = 0, pagerLock = 0;
function pagerTarget(k) {
  const s = sects[k], max = Math.max(0, document.documentElement.scrollHeight - innerHeight);
  return clampv(Math.round(s.offsetTop + s.offsetHeight / 2 - innerHeight / 2), 0, max);
}
function pagerNearest() {
  const mid = scrollY + innerHeight / 2; let best = 0, bd = Infinity;
  sects.forEach((s, k) => { const dd = Math.abs(s.offsetTop + s.offsetHeight / 2 - mid); if (dd < bd) { bd = dd; best = k; } });
  return best;
}
function pagerGo(k) {
  k = clampv(k, 0, sects.length - 1); pager.i = k;
  const y = pagerTarget(k), start = scrollY, dist = y - start, t0 = performance.now(), dur = 760;
  cancelAnimationFrame(pagerAnim);
  pagerLock = t0 + dur + 150;
  const ease = p => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  (function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    window.scrollTo(0, start + dist * ease(p)); setDot(k);
    if (p < 1) pagerAnim = requestAnimationFrame(step);
  })(t0);
}
let wheelAcc = 0, wheelClr = 0;
addEventListener('wheel', e => {
  if (!pager.enabled) return;
  // let a scrollable chat body consume the wheel instead of paging the story
  const sc = e.target.closest && e.target.closest('.cw-body');
  if (sc && sc.scrollHeight > sc.clientHeight + 1) {
    const atTop = sc.scrollTop <= 0, atBot = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 1;
    if (!((atTop && e.deltaY < 0) || (atBot && e.deltaY > 0))) return;  // scroll inside it
  }
  if (innerWidth < 920) return;
  if (performance.now() < pagerLock) return;
  e.preventDefault();
  wheelAcc += e.deltaY;
  clearTimeout(wheelClr); wheelClr = setTimeout(() => wheelAcc = 0, 200);
  const TH = 24;
  if (wheelAcc > TH) { wheelAcc = 0; pagerGo(pager.i + 1); }
  else if (wheelAcc < -TH) { wheelAcc = 0; pagerGo(pager.i - 1); }
}, { passive: false });
addEventListener('keydown', e => {
  if (!pager.enabled || e.metaKey || e.ctrlKey || e.altKey) return;
  const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
  if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); pagerGo(pager.i + 1); }
  else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); pagerGo(pager.i - 1); }
  else if (e.key === 'Home') { e.preventDefault(); pagerGo(0); }
  else if (e.key === 'End') { e.preventDefault(); pagerGo(sects.length - 1); }
}, { passive: false });
window.pagerGo = pagerGo;

/* ============ dot nav — magnetic icon rail ============
   Rest: quiet dots. As the cursor nears the rail it "comes to meet" you — the
   whole chain leans toward the pointer and the nearest dots swell into labelled
   icons (dock-style magnet). Names below; labels read out for screen readers. */
const NAV_LABEL = { hero:'Home', save:'Save', translate:'Translate', discuss:'Discuss', exercises:'Exercises', practice:'Practice', finale:'Everywhere', 'ev-close':'Get Lantern', close:'Get Lantern' };
const NAV_ICON = {
  hero:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/></svg>',
  save:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  translate: '<svg viewBox="0 0 24 24"><path d="M1 12l6-6v4h10V6l6 6-6 6v-4H7v4z"/></svg>',
  discuss:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8 8 0 0 1-11.5 7.1L4 20l1.4-4.9A8 8 0 1 1 21 11.5z"/></svg>',
  exercises: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3.5h6V6H9z"/><path d="M8.5 13l2.2 2.2L15.5 10.5"/></svg>',
  practice:  '<svg viewBox="0 0 24 24"><path d="M12 2l2.4 7h7.6l-6.1 4.5 2.3 7.5L12 16.5l-6.2 4.5 2.3-7.5L2 9h7.6z"/></svg>',
  finale:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18 14 14 0 0 1 0-18z"/></svg>',
  'ev-close':'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 23a7 7 0 0 0 7-7c0-2.1-1-4-2.6-5.6-.3 1.3-1.3 2.1-2.3 2.1.9-2.3.3-4.8-1.9-6.8-1-.9-2.2-1.5-2.6-2.7-.4 1.9-.3 3.4-1.1 5-.6 1.3-1.6 2.2-2.3 3.5A7.8 7.8 0 0 0 5 16a7 7 0 0 0 7 7z"/></svg>',
};
const dotNav = el('dotnav');
dotNav.innerHTML = sects.map((s, i) => {
  const label = NAV_LABEL[s.id] || s.dataset.screenLabel || s.id, ic = NAV_ICON[s.id] || '';
  return `<button class="dn" data-i="${i}" aria-label="${label}"><span class="dn-mark"><span class="dn-dot"></span><span class="dn-ico">${ic}</span></span><span class="dn-label">${label}</span></button>`;
}).join('');
document.body.appendChild(dotNav);
const dotBtns = [...dotNav.children];
function setDot(a) { dotBtns.forEach((d, i) => d.classList.toggle('on', i === a)); }
dotNav.addEventListener('click', e => { const b = e.target.closest('button'); if (b) pagerGo(+b.dataset.i); });
addEventListener('scroll', () => { if (performance.now() > pagerLock) pager.i = pagerNearest(); setDot(pager.i); }, { passive: true });
setDot(0);
addEventListener('load', () => { pager.i = pagerNearest(); setDot(pager.i); });

/* the magnet: chain leans toward the cursor; nearest dots swell + name themselves,
   with a soft tick as the focus ratchets from one item to the next. */
if (!REDUCED) {
  const NEAR_PX = 250, FALL_PX = 132;
  let navRAF = 0, lastFocus = -1, actx = null;
  function unlockAudio() {
    try { const AC = window.AudioContext || window.webkitAudioContext; if (AC && !actx) actx = new AC(); if (actx && actx.state === 'suspended') actx.resume(); } catch (e) {}
  }
  addEventListener('pointerdown', unlockAudio);
  addEventListener('keydown', unlockAudio);
  function tick() {
    if (!actx || actx.state !== 'running') return;
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine'; o.frequency.value = 60;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);
    o.connect(g); g.connect(actx.destination);
    o.start(t); o.stop(t + 0.03);
  }
  function navMagnet(cx, cy) {
    if (innerWidth < 880) { dotNav.classList.remove('peek'); lastFocus = -1; return; }
    const r = dotNav.getBoundingClientRect();
    if (!r.width) return;
    const near = clampv(1 - (cx - r.left) / NEAR_PX, 0, 1);
    dotNav.classList.toggle('peek', near > 0.02);
    let fi = -1, fm = 0.5;
    for (let i = 0; i < dotBtns.length; i++) {
      const b = dotBtns[i], br = b.getBoundingClientRect();
      const m = near * clampv(1 - Math.abs(cy - (br.top + br.height / 2)) / FALL_PX, 0, 1);
      b.style.setProperty('--near', near.toFixed(3));
      b.style.setProperty('--m', m.toFixed(3));
      if (m > fm) { fm = m; fi = i; }
    }
    if (near <= 0.02) lastFocus = -1;
    else if (fi !== lastFocus) { if (fi >= 0) tick(); lastFocus = fi; }
  }
  addEventListener('pointermove', e => {
    if (e.pointerType === 'touch') return;
    const cx = e.clientX, cy = e.clientY;
    if (navRAF) return;
    navRAF = requestAnimationFrame(() => { navRAF = 0; navMagnet(cx, cy); });
  }, { passive: true });
}

/* ============ hero word-card hover tilt ============ */
$$('.hero .wordcard').forEach(card => {
  const rot = card.style.getPropertyValue('--rot') || '0deg';
  card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    card.style.transition = 'transform .1s ease-out, box-shadow .3s';
    card.style.transform = `rotate(${rot}) rotateY(${(px * 15).toFixed(1)}deg) rotateX(${(-py * 15).toFixed(1)}deg)`;
  });
  card.addEventListener('pointerleave', () => { card.style.transition = 'transform .5s cubic-bezier(.2,.7,.2,1), box-shadow .3s'; card.style.transform = `rotate(${rot})`; });
});

/* ============ hero — "tap a word" coachmark (taps 3 words, like scene 2) ============
   The article opens as plain text; once the hero settles, the shared ghost cursor
   glides in and taps route → coast → rugged, each lighting up as it lands. */
(function () {
  return; // disabled — hero word-tap demo is handled by lantern-hero-words.js (custom fly-out cards)
  const stage = $('.hero-stage');
  const words = stage ? $$('.hl', stage) : [];
  if (!stage || !words.length) return;                 // older hero / nothing to tap → skip
  const hidden = () => getComputedStyle(stage).display === 'none';
  const saveAll = () => words.forEach(w => { w.classList.remove('picking'); w.classList.add('saved'); });
  if (REDUCED) { saveAll(); return; }                  // reduced motion → final saved state, no cursor
  let ran = false;
  function play() {
    if (ran) return;
    if (hidden()) { saveAll(); return; }                // mobile (stage hidden) → just show them saved
    ran = true;
    const guide = makeCursorGuide(stage);
    (async () => {
      await wait(260);
      for (let i = 0; i < words.length; i++) {
        if (guide.dead) return;
        const w = words[i], last = i === words.length - 1;
        w.classList.add('picking');                      // amber: the cursor is selecting this word
        await guide.run(w, {
          label: 'Tap a word',
          onTap: () => { w.classList.remove('picking'); w.classList.add('saved'); },  // green: saved
          hold: last ? 520 : 340,
          stay: !last,
        });
      }
    })();
  }
  const kick = () => setTimeout(play, 1100);            // let the hero settle (fonts + reveal) first
  window.whenFontsReady ? window.whenFontsReady(kick) : kick();
})();

/* re-measure once fonts settle (line heights shift) */
window.whenFontsReady && window.whenFontsReady(() => { measure(); });
addEventListener('load', () => { measure(); window.__revealCheck && window.__revealCheck(); });

/* ============ scroll-down hint — fades in once a scene's steps are all complete ============ */
$$('.sv-scrollcue').forEach(cue => {
  const sec = cue.closest('section');
  cue.addEventListener('click', () => { const i = sects.indexOf(sec); if (i >= 0 && window.pagerGo) pagerGo(i + 1); });
});
$$('.sv-steps').forEach(steps => {
  const sec = steps.closest('section'); if (!sec) return;
  const cue = $('.sv-scrollcue', sec); if (!cue) return;
  const check = () => { const all = $$('.sv-step', steps); if (all.length && all.every(s => s.classList.contains('done'))) cue.classList.add('show'); };
  new MutationObserver(check).observe(steps, { subtree: true, attributes: true, attributeFilter: ['class'] });
  check();
});
