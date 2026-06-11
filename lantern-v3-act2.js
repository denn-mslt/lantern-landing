/* ============================================================
   Lantern Landing v3 — ACT II
   Scene 4: In-page exercises   ·   Scene 5: Practice deck
   ============================================================ */

/* ---------- 04 IN-PAGE EXERCISES ---------- */
(function () {
  const section = $('#exercises'); if (!section) return;
  const stage = $('#ex-stage'), browser = $('#ex-browser'), fab = $('#ex-toggle'), status = $('#ex-status');
  const hud = $('#ex-hud'), cue = $('#ex-cue'), countEl = $('#ex-count'), prog = $('#ex-prog');
  const stepEls = $$('.sv-step', $('#ex-steps')), cap = $('#ex-cap');
  const scrollCue = $('.sv-scrollcue', section);
  const targets = $$('.exw', browser);
  const TOTAL = targets.length;
  let enablePromise = null, solved = 0, guide = null, userTook = false;
  prog.innerHTML = targets.map(() => '<i></i>').join('');
  function setStep(n, c) { stepEls.forEach(s => { const k = +s.dataset.s; s.classList.toggle('done', k < n); s.classList.toggle('on', k === n); }); if (c !== undefined) cap.textContent = c; }
  function userActed() { guide && guide.cancel(); userTook = true; }
  function showScroll() { if (scrollCue) scrollCue.classList.add('show'); }
  // pulse every still-empty gap so the reader sees what's theirs to fill
  function pulseRest() { targets.forEach(t => { if (!t.dataset.done) t.classList.add('cur'); }); }

  function buildGap(exw) {
    const a = exw.dataset.a, opts = exw.dataset.o.split('|');
    const word = exw.textContent.trim();                  // the live word — stays visible until it morphs
    exw.classList.add('inqgap'); exw.dataset.answer = a;
    exw.innerHTML = '<span class="gt"><span class="ghost">' + a + '</span><span class="lex">' + word + '</span><span class="ln"></span></span><span class="menu">' + opts.map(o => '<button>' + o + '</button>').join('') + '</span>';
    const gt = $('.gt', exw), menu = $('.menu', exw);
    gt.tabIndex = 0; gt.setAttribute('role', 'button');
    gt.addEventListener('click', e => { e.stopPropagation(); if (exw.dataset.done || !exw.classList.contains('formed')) return; userActed(); targets.forEach(g => { if (g !== exw) g.classList.remove('open'); }); exw.classList.toggle('open'); });
    menu.querySelectorAll('button').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation(); if (exw.dataset.done) return; userActed();
      if (b.textContent.trim() === a) { exw.classList.remove('open'); solve(exw); }
      else { b.classList.add('wrong'); exw.classList.add('wrong'); setTimeout(() => { b.classList.remove('wrong'); exw.classList.remove('wrong'); }, 450); }
    }));
  }
  // the natural transform: the live word melts into a quiet fill-in slot, in place
  function formGap(exw) { exw.classList.add('formed'); }

  // complete state reuses the SAME hud structure (cue + count + bars) — only colour/text change,
  // so the progress bar never resizes
  function markComplete() {
    hud.classList.add('done');
    cue.innerHTML = '<span class="hud-tick">' + ICON.ck + '</span>The whole read — practiced.';
    countEl.innerHTML = '<b>' + TOTAL + '</b> / ' + TOTAL;
    setStep(3, 'Every gap filled — practice, hidden in the page.');
    showScroll();
  }
  function solve(exw) {
    if (exw.dataset.done) return; exw.dataset.done = '1'; exw.classList.remove('cur', 'open');
    solved++; const i = targets.indexOf(exw); if (prog.children[i]) prog.children[i].classList.add('on');
    countEl.innerHTML = '<b>' + solved + '</b> / ' + TOTAL;
    const m = $('.menu', exw); if (m) m.remove();
    // the answer (already the word held in .lex) fades back in as clean prose — no text swap, no shift
    exw.classList.add('done', 'flash'); setTimeout(() => exw.classList.remove('flash'), 760);
    if (solved === TOTAL) markComplete();
    else cue.textContent = 'Nice — keep filling the gaps as you read';
  }
  document.addEventListener('click', () => targets.forEach(g => g.classList.remove('open')));

  async function enable() {
    if (enablePromise) return enablePromise;
    enablePromise = (async () => {
      fab.classList.remove('beckon'); hud.classList.add('hud-go');     // activator crossfades to the tracker
      status.classList.add('on');
      cue.textContent = 'Turning the page into practice…';
      ['route', 'survey', 'rugged', 'exposed', 'storms', 'coast'].forEach(w => { if (!Shelf.has(w)) Shelf.add(w); });
      targets.forEach(buildGap);                                     // words still read normally
      await wait(360);
      // one word at a time, left → right, each MELTS into a slot — never a mass disappearance.
      // saved words get their card delivered from the deck first; grammar gaps just settle.
      for (const t of targets) {
        if (t.classList.contains('key')) {
          flyShelfCardTo(t.dataset.answer, $('.gt', t).getBoundingClientRect(), { scale: 0.46, settle: 0 });
          await wait(230);                                           // the card reaches the word…
          formGap(t);                                                // …and the word melts into a gap
          await wait(160);
        } else {
          formGap(t);
          await wait(200);
        }
      }
      countEl.innerHTML = '<b>0</b> / ' + TOTAL;
      cue.textContent = 'Tap a gap and choose the right word';
      setStep(2, 'Now: tap a gap and pick the right word');
    })();
    return enablePromise;
  }
  fab.addEventListener('click', () => { userActed(); enable(); });

  async function runDemo() {
    Shelf.reveal();
    setStep(1, 'Watch — turn exercises on');
    fab.classList.add('beckon');
    guide = makeCursorGuide(stage);
    await guide.run(fab, { label: 'Turn on exercises', onTap: () => enable(), hold: 480 });
    if (userTook) return;
    await enable();                                               // wait for every card to fly in
    if (userTook) return;
    await wait(360);
    // the cursor solves the FIRST gap to set the pattern, then hands off
    const demo = targets[0];                                       // "route"
    if (demo && !demo.dataset.done) {
      const g2 = makeCursorGuide(stage);
      await g2.run($('.gt', demo), { label: 'Tap a gap', onTap: () => { targets.forEach(g => g.classList.remove('open')); demo.classList.add('open'); }, hold: 560, stay: true });
      if (userTook) return;
      await wait(420);
      const ok = [...demo.querySelectorAll('.menu button')].find(b => b.textContent.trim() === demo.dataset.answer);
      if (ok) { await g2.run(ok, { label: 'Pick the answer', onTap: () => { demo.classList.remove('open'); solve(demo); }, hold: 480 }); }
      else g2.finish();
    }
    if (userTook) return;
    await wait(550);
    // hand off: every remaining gap pulses, and the scroll-on hint appears like the other scenes
    pulseRest();
    setStep(2, 'Your turn — fill the rest of the gaps');
    cue.textContent = 'Your turn — tap a glowing gap and pick the word';
    showScroll();
  }

  new IntersectionObserver((es, o) => { es.forEach(e => { if (e.isIntersecting) { o.disconnect(); if (window.__noAuto) return; setTimeout(() => { if (!userTook) runDemo(); }, 350); } }); }, { threshold: 0.5 }).observe(section);
})();

/* ---------- 05 PRACTICE DECK ---------- */
(function () {
  const section = $('#practice'); if (!section) return;
  const stage = $('#pr-stage'), panel = $('#pr-panel'), deck = $('#pr-deck');
  const stepEls = $$('.sv-step', $('#pr-steps')), cap = $('#pr-cap');
  const scrollCue = $('.sv-scrollcue', section);
  let guide = null, userTook = false, started = false, formPromise = null;
  function setStep(n, c) { stepEls.forEach(s => { const k = +s.dataset.s; s.classList.toggle('done', k < n); s.classList.toggle('on', k === n); }); if (c !== undefined) cap.textContent = c; }
  function userActed() { guide && guide.cancel(); userTook = true; }
  function showScroll() { if (scrollCue) scrollCue.classList.add('show'); }

  const Q = [
    { t: '', label: 'Pick the meaning', w: 'survey', opts: ['обстеження', 'парад', 'шторм', 'міст'], a: 0 },
    { t: 'word', label: 'Pick the word', w: 'узбережжя', opts: ['route', 'coast', 'storm', 'bridge'], a: 1 },
    { t: 'gap', label: 'Fill the gap', w: 'Strong ___ closed the road.', opts: ['storms', 'bridges', 'surveys', 'routes'], a: 0 },
    { t: '', label: 'Pick the meaning', w: 'rugged', opts: ['скелястий', 'гладкий', 'теплий', 'вузький'], a: 0 },
    { t: 'word', label: 'Pick the word', w: 'відкритий негоді', opts: ['exposed', 'remote', 'gentle', 'hidden'], a: 0 },
  ];
  const POS = ['p0', 'p1', 'p2'];
  const ckBig = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" width="30" height="30"><path d="M20 6 9 17l-5-5"/></svg>';
  let front = 0, nodes = [], firstTry = 0;

  /* ----- the extension side-panel intro: today's set, ready to start ----- */
  // the saved words that will be dealt in and become today's quiz cards
  const PWORDS = ['survey', 'coast', 'storms'];
  panel.innerHTML =
    '<div class="pr-eyebrow">Today\u2019s set</div>' +
    '<div class="pr-headline">' + Q.length + ' words from<br>your shelf.</div>' +
    '<div class="pr-sub">Spaced so the words you met yesterday come back today \u2014 meaning, word, and audio.</div>' +
    '<div class="pr-meta">' +
      '<div class="pr-meta-row"><span class="d"></span>Built from the words you saved</div>' +
      '<div class="pr-meta-row"><span class="d"></span>About two minutes</div>' +
    '</div>' +
    '<button class="prp-go" id="pr-start" type="button"><span class="lmark"></span>Start today\u2019s set</button>';
  const startBtn = $('#pr-start', panel);
  // landing poses that mirror the deck stack EXACTLY — including z-depth, so that under
  // the stack's perspective each word card projects to the identical screen position as
  // the quiz card it dissolves into (otherwise the back card visibly jumps on reveal)
  const LAND = [{ x: 0, y: 0, z: 0, r: 0, s: 1 }, { x: 15, y: -11, z: -40, r: 4.6, s: .97 }, { x: -18, y: -6, z: -80, r: -6, s: .945 }];
  // the saved-word face, built as an OPAQUE OVERLAY that is a CHILD of the real quiz card.
  // it covers the question while the card is dealt in, then fades off in place to reveal it —
  // one single card per slot (no separate stack that could "reappear")
  function wordOverlay(lemma) {
    const d = DICT[lemma] || genDef(lemma);
    const ov = el('wq-overlay'); ov.dataset.w = lemma;
    ov.innerHTML = '<div class="wq-i">' +
      '<div class="wq-top"><span class="wq-tag">saved word</span><span class="cefr-b ' + d.cls + '">' + d.lvl + '</span></div>' +
      '<div class="wq-mid"><div class="wq-w">' + d.w + '</div>' +
      (d.ph ? '<div class="wq-ph">' + d.ph + '</div>' : '') + (d.tr ? '<div class="wq-tr">' + d.tr + '</div>' : '') + '</div>' +
      '<div class="wq-foot"><span class="wq-spk">' + ICON.spk + '</span><span class="wq-saved">' + ICON.ck + ' On your shelf</span></div>' +
      '</div>';
    return ov;
  }
  // prep a real quiz card to be dealt in: set its landed pose vars (matching its p-pose)
  function dealSetup(card, idx) {
    const pose = LAND[idx] || LAND[0];
    card.style.setProperty('--lx', pose.x + 'px'); card.style.setProperty('--ly', pose.y + 'px');
    card.style.setProperty('--lz', pose.z + 'px');
    card.style.setProperty('--lr', pose.r + 'deg'); card.style.setProperty('--ls', pose.s);
  }

  function makeCard(idx, pos) {
    if (idx >= Q.length) { const c = el('qcard ' + pos); c.dataset.summary = '1'; return c; }
    const q = Q[idx], c = el('qcard ' + pos);
    const lblCls = { '': '', word: 'word', gap: 'gap' }[q.t] || '';
    const prompt = '<span class="pw' + (q.t === 'gap' ? ' gap' : '') + '">' + q.w + '</span>';
    c.innerHTML = '<div class="qtop"><span class="qlabel ' + lblCls + '">' + q.label + '</span></div>' +
      '<div class="qw">' + prompt + '</div><div class="qhint">Choose the right one</div>' +
      '<div class="opts">' + q.opts.map((o, i) => '<button class="qopt" data-i="' + i + '"><span>' + o + '</span><span class="num">' + (i + 1) + '</span></button>').join('') + '</div>';
    return c;
  }
  function fillSummary(node) {
    const acc = Math.round(firstTry / Q.length * 100);
    node.innerHTML = '<div class="qsummary"><div class="qs-burst">' + ckBig + '</div><h4>That\'s the set.</h4>' +
      '<div class="qs-row"><div class="st"><b>' + acc + '%</b><span>FIRST TRY</span></div><div class="st"><b>' + Q.length + '</b><span>REVIEWED</span></div></div>' +
      '<div class="qs-note">A fresh set is built from your shelf every day.</div></div>';
  }
  function bindTop(node, idx) {
    if (idx >= Q.length) { if (node.dataset.summary) fillSummary(node); return; }
    const q = Q[idx];
    $$('.qopt', node).forEach((opt, i) => opt.addEventListener('click', () => { userActed(); answer(node, q, i); }));
  }
  function answer(node, q, i) {
    if (node.dataset.lock) return;
    const opts = $$('.qopt', node);
    if (i === q.a) { node.dataset.lock = '1'; node.classList.remove('pulse'); opts[i].classList.add('right'); node.classList.add('correct'); if (!node.dataset.missed) firstTry++; if (prog.children[front]) prog.children[front].classList.add('on'); setTimeout(advance, 720); }
    else { node.dataset.missed = '1'; opts[i].classList.add('wrong'); setTimeout(() => opts[i].classList.remove('wrong'), 450); opts[q.a].classList.add('reveal'); }
  }
  function refresh() { nowEl.textContent = Math.min(front + 1, Q.length); [...prog.children].forEach((s, i) => s.classList.toggle('cur', i === front)); }
  function build() { stack.innerHTML = ''; nodes = []; for (let k = 0; k < 3; k++) { const n = makeCard(front + k, POS[k]); stack.appendChild(n); nodes.push(n); } bindTop(nodes[0], front); refresh(); }
  function advance() {
    const gone = nodes[0]; gone.className = 'qcard gone';
    setTimeout(() => {
      gone.remove(); front++; nodes.shift();
      nodes.forEach((n, k) => n.className = 'qcard ' + POS[k]);
      const n = makeCard(front + 2, 'p2'); stack.appendChild(n); nodes.push(n);
      bindTop(nodes[0], front); refresh();
      if (front >= Q.length) { setStep(3, 'Done — a fresh set waits tomorrow, built from your words.'); showScroll(); }
      else if (front >= 1 && !userTook) setStep(2, 'Your turn — finish the set');
    }, 520);
  }

  deck.innerHTML = '<div class="sess"><div class="sess-streak"><span class="flame">' + ICON.flame + '</span><span><b>From your shelf</b></span></div><div class="sess-count"><b id="pr-now">1</b> / ' + Q.length + '</div></div>' +
    '<div class="sess-prog" id="pr-prog">' + Q.map(() => '<i></i>').join('') + '</div>' +
    '<div class="stack" id="pr-stack"></div>';
  const stack = $('#pr-stack', deck), prog = $('#pr-prog', deck), nowEl = $('#pr-now', deck);
  build();
  stack.classList.add('hold');                      // quiz cards wait, hidden, until dealt-in

  // on Start: the intro modal dismisses, then today's cards are DEALT in showing their saved-word
  // face. Each card is a single real quiz card with a word-face overlay; the overlay fades off in
  // place to reveal the question — the card itself never moves or re-appears.
  function startPractice() {
    if (started) return formPromise || wait(0); started = true;
    startBtn.classList.remove('beckon');
    stage.classList.add('started');                 // intro container fades out first
    if (REDUCED) { stage.classList.add('live'); stack.classList.remove('hold'); return formPromise = wait(0); }
    const fade = 540;                               // let the modal fully animate out before any card
    const dealEnd = 2 * 120 + 600 + 160;
    setTimeout(() => {
      stack.classList.remove('hold');               // cards become opacity-eligible; overlays hide the questions
      stage.classList.add('live');                  // the deck chrome (header + progress) appears
      [2, 1, 0].forEach((k, step) => {              // back card first, front card lands last
        const card = nodes[k]; if (!card) return;
        dealSetup(card, k);
        card.appendChild(wordOverlay(PWORDS[k]));    // the saved-word face, covering this card
        card.style.animationDelay = (step * 120) + 'ms';
        card.classList.add('pr-deal');               // fly it in from the shelf
      });
      setTimeout(() => {                             // landed — each word face fades off IN PLACE,
        nodes.forEach((card, k) => {                 // revealing the question it always was
          card.classList.remove('pr-deal'); card.style.animationDelay = '';
          const ov = card.querySelector('.wq-overlay');
          if (ov) { ov.classList.add('out'); setTimeout(() => ov.remove(), 420); }
        });
      }, dealEnd);
    }, fade);
    return formPromise = wait(fade + dealEnd + 420);
  }
  // Starting the set is NOT "taking over" — clicking Start just begins; the cursor still
  // demonstrates solving the first card. Only answering a quiz card yourself ends the demo.
  startBtn.addEventListener('click', () => { startPractice(); });

  // the cursor demonstrates solving the first card — shared by autoplay AND a manual Start click,
  // so the demo plays whether or not the viewer taps Start themselves
  async function demoSolveFirst() {
    if (userTook) return;
    await wait(260);
    const top = nodes[0]; if (!top) return;
    const ok = $$('.qopt', top)[Q[front].a];
    if (ok) await guide.run(ok, { label: 'Pick the meaning', onTap: () => answer(top, Q[front], Q[front].a), hold: 680 });
    if (userTook) return;
    await wait(1000);                                  // first card flies off; the next is now on top
    if (userTook) return;
    guide && guide.finish();
    const next = nodes[0];                             // pulse the next card for the reader
    if (next && !next.dataset.summary) next.classList.add('pulse');
    setStep(2, 'Your turn — finish the set');
    showScroll();
  }

  async function runDemo() {
    if (window.Shelf) Shelf.reveal();
    if (REDUCED) { await startPractice(); setStep(2, 'Take the set — built from your shelf'); showScroll(); return; }
    setStep(1, 'Watch — open today\u2019s practice');
    guide = makeCursorGuide(stage);
    if (!started) {                                    // hands-off viewer: the cursor taps Start itself
      startBtn.classList.add('beckon');
      // stay:true keeps the SAME cursor alive through the deck-forming wait, so it can go on
      // to solve the first card (without stay, run() calls finish() and the cursor dies here)
      await guide.run(startBtn, { label: 'Start today\u2019s set', onTap: () => { startPractice(); }, hold: 540, stay: true });
    }
    if (userTook) return;
    await startPractice();                             // awaits the REAL deal timing (whoever started it)
    if (userTook) return;
    await demoSolveFirst();                            // …then the cursor solves the first card
  }

  new IntersectionObserver((es, o) => { es.forEach(e => { if (e.isIntersecting) { o.disconnect(); if (window.__noAuto) return; setTimeout(() => { if (!userTook) runDemo(); }, 400); } }); }, { threshold: 0.5 }).observe(section);
})();
