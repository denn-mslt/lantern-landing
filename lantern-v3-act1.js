/* ============================================================
   Lantern Landing v3 — ACT I
   Scene 1: Save & Simplify  (the marquee)
   ============================================================ */
(function () {
  const section = $('#save');
  if (!section) return;
  const stage = $('#sv-stage'), browser = $('#sv-browser'), pageEl = $('#sv-page');
  const popup = $('#sv-popup'), vct = $('#sv-ct'), vbadge = $('#sv-badge'), hint = $('#sv-hint');
  const simpPara = $('#sv-simp'), simpDot = $('#sv-dot'), simpBody = $('#sv-simp-body');

  /* ---- the article ---- */
  const PARA0 = "The Atlantic Road threads along an exposed stretch of Norwegian coast, linking a scatter of remote islands by a chain of low bridges. For much of its winding length the route seems to float just above the open sea.";
  const ORIGINAL = "Before construction, engineers undertook a meticulous survey of the storm-battered archipelago, where relentless gales repeatedly stalled the work and left the rock underfoot treacherous.";
  // {lemma} or {lemma|surface} = words that fly in from the deck as saved cards
  // (surface lets us keep the natural form, e.g. {islands|islands}, while the card matches the lemma)
  const SIMPLE_TPL = "Before they built it, engineers made a careful {survey} of these {rugged} {islands|islands}. A long {spell} of {storms|storms} kept stopping the work and made the wet {coast} dangerous to walk on.";
  const CANDIDATES = ['route', 'remote', 'winding', 'bridges'];

  /* ---- tokenize tappable paragraphs into .word spans ---- */
  function tokenize(container, text) {
    container.textContent = '';
    text.split(/(\s+)/).forEach(tok => {
      if (/^\s*$/.test(tok)) { container.appendChild(document.createTextNode(tok)); return; }
      const m = tok.match(/^([A-Za-z'’-]+)(.*)$/);
      if (m) {
        const s = el('word', 'span'); s.dataset.w = m[1].toLowerCase(); s.textContent = m[1];
        if (Shelf.has(s.dataset.w)) s.classList.add('is-saved');
        if (CANDIDATES.includes(s.dataset.w)) s.classList.add('cand');
        container.appendChild(s);
        if (m[2]) container.appendChild(document.createTextNode(m[2]));
      } else container.appendChild(document.createTextNode(tok));
    });
  }
  tokenize($('#sv-p0'), PARA0);
  tokenize(simpBody, ORIGINAL);

  /* ---- popup ---- */
  let openWordEl = null;
  function renderPopup(key) {
    const d = DICT[key] || genDef(key), saved = Shelf.has(key);
    popup.innerHTML =
      '<div class="top"><div class="wl"><div class="w">' + d.w + '</div>' + (d.ph ? '<div class="ph">' + d.ph + '</div>' : '') + '</div>' +
      '<div class="ctrls"><span class="spk">' + ICON.spk + '</span><span class="cefr-b ' + d.cls + '">' + d.lvl + '</span><button class="close" aria-label="close">✕</button></div></div>' +
      '<hr />' + (d.syn ? '<div class="syn">' + d.syn + '</div>' : '') + '<div class="def">' + d.def + '</div>' + (d.ex ? '<div class="ex">' + boldEx(d.ex) + '</div>' : '') +
      (d.tr ? '<div class="popup-tr"><span class="popup-tr-lbl">UK</span>' + d.tr + '</div>' : '') +
      '<div class="save"><button class="savebtn ' + (saved ? 'saved' : '') + '" data-k="' + key + '"><span class="bk">' + ICON.bk + '</span><span class="ck">' + ICON.ck + '</span><span class="lbl">' + (saved ? 'Saved to deck' : 'Save word') + '</span></button></div>';
  }
  function placePopup(w) {
    const sr = stage.getBoundingClientRect(), wr = w.getBoundingClientRect();
    popup.style.left = Math.max(8, Math.min(wr.left - sr.left, sr.width - 300)) + 'px';
    popup.style.top = (wr.bottom - sr.top + 10) + 'px';
  }
  function openWord(w) {
    if (w.closest('.simplified')) return;
    const switching = openWordEl && openWordEl !== w && popup.classList.contains('show');
    if (switching) {
      popup.classList.remove('show'); openWordEl.classList.remove('active');
      openWordEl = w; w.classList.add('active');
      setTimeout(() => { renderPopup(w.dataset.w); placePopup(w); requestAnimationFrame(() => popup.classList.add('show')); }, 180);
      return;
    }
    if (openWordEl) openWordEl.classList.remove('active');
    openWordEl = w; w.classList.add('active'); renderPopup(w.dataset.w); placePopup(w);
    requestAnimationFrame(() => popup.classList.add('show'));
  }
  function closePopup() { popup.classList.remove('show'); if (openWordEl) { openWordEl.classList.remove('active'); openWordEl = null; } }

  let guide = null;
  pageEl.addEventListener('click', e => {
    const w = e.target.closest('.word'); if (!w) return;
    userActed();
    openWordEl === w ? closePopup() : openWord(w);
  });
  popup.addEventListener('click', e => {
    e.stopPropagation();
    if (e.target.closest('.close')) { closePopup(); return; }
    const spk = e.target.closest('.spk');
    if (spk) { spk.classList.remove('playing'); void spk.offsetWidth; spk.classList.add('playing'); return; }
    const btn = e.target.closest('.savebtn'); if (!btn) return;
    const k = btn.dataset.k;
    if (Shelf.has(k)) return;
    saveWord(k, openWordEl);
  });
  document.addEventListener('click', e => {
    if (!popup.classList.contains('show')) return;
    if (popup.contains(e.target) || e.target.closest('.word')) return;
    closePopup();
  });

  /* ---- ONE save path — used by demo, manual click, and seeding ---- */
  let saveCount = 0;
  function saveWord(lemma, srcEl) {
    if (Shelf.has(lemma)) return;
    const src = srcEl || $('.word[data-w="' + lemma + '"]', pageEl);
    const rect = src ? src.getBoundingClientRect() : null;
    $$('.word[data-w="' + lemma + '"]', pageEl).forEach(x => { x.classList.add('is-saved'); x.classList.remove('cand'); });
    // settle the popup's save button into its calm saved state (icon → check, label, blocked)
    const sbtn = $('.savebtn', popup);
    if (sbtn) { sbtn.classList.add('saved'); const lbl = $('.lbl', sbtn); if (lbl) lbl.textContent = 'Saved to deck'; }
    flyWordToShelf(rect, lemma, () => { vct.textContent = Shelf.words.length; vbadge.classList.add('bump'); setTimeout(() => vbadge.classList.remove('bump'), 450); });
    setTimeout(closePopup, 360); // let the press read before the popup closes
    saveCount++;
    maybeAdvance();
  }

  /* ---- camera zoom ---- */
  function zoomTo(target, scale) {
    const br = browser.getBoundingClientRect(), tr = target.getBoundingClientRect();
    const ox = clampv(((tr.left + tr.width / 2) - br.left) / br.width * 100, 0, 100);
    const oy = clampv(((tr.top + tr.height / 2) - br.top) / br.height * 100, 0, 100);
    browser.style.transformOrigin = ox + '% ' + oy + '%';
    browser.style.transform = 'scale(' + scale + ')';
    browser.classList.add('zoomed');
  }
  function zoomReset() { browser.style.transform = ''; browser.classList.remove('zoomed'); }

  /* ---- simplify: stream + weave saved cards, ZERO layout jump ---- */
  function buildSimpleTokens() {
    return SIMPLE_TPL.split(/(\s+)/).map(tok => {
      if (/^\s*$/.test(tok)) return { ws: tok };
      const m = tok.match(/^\{([a-z]+)(?:\|([^}]+))?\}(.*)$/);
      if (m) { const lemma = m[1], surface = m[2] || (DICT[lemma] ? DICT[lemma].w : lemma); return { text: surface + m[3], lemma, saved: Shelf.has(lemma) }; }
      return { text: tok };
    });
  }
  /* ---- simplify ⇄ original: a smooth, reversible rewrite, no layout jump ---- */
  let simplified = false, swapping = false;

  function originalTokens() {
    return ORIGINAL.split(/(\s+)/).map(tok => /^\s*$/.test(tok) ? { ws: tok } : { text: tok });
  }
  function buildSpans(tokens) {
    simpBody.innerHTML = '';
    tokens.forEach(t => {
      if (t.ws !== undefined) { simpBody.appendChild(document.createTextNode(t.ws)); return; }
      const s = el('simp-w' + (t.saved ? ' saved' : ''), 'span');
      s.textContent = t.text; if (t.lemma) s.dataset.w = t.lemma;
      simpBody.appendChild(s);
    });
    return [...simpBody.querySelectorAll('.simp-w')];
  }

  /* ---- pin ONLY the page body so the article container never resizes on simplify/revert ----
     the paragraph itself is left at its natural height in each state, so the orange dot
     (centred on the paragraph) always sits dead-centre of the actual text. The paragraph is
     the LAST element in the page, so its height change only adjusts trailing space the page
     lock absorbs. offsetHeight (not getBoundingClientRect) dodges the scroll-engine transform. */
  let pageLockH = 0;
  function lockSimpHeight() {
    if (!simpPara.offsetWidth || swapping) return;
    pageEl.style.minHeight = '';
    let pAlt = 0;
    if (!simplified) {
      // dry-run the simplified rendering in place, measure the page, then restore — synchronous, no paint
      const html = simpBody.innerHTML;
      buildSpans(buildSimpleTokens());
      simpBody.querySelectorAll('.simp-w').forEach(s => s.classList.add('on'));
      simpPara.classList.add('simplified');
      pAlt = pageEl.offsetHeight;
      simpPara.classList.remove('simplified');
      simpBody.innerHTML = html;
    }
    const pNow = pageEl.offsetHeight;
    pageLockH = Math.max(pageLockH, pNow, pAlt);
    // +6px guard absorbs sub-pixel reflow; lands inside the page's 32px bottom padding (invisible)
    pageEl.style.minHeight = (pageLockH + 6) + 'px';
  }
  // crossfade current text → new tokens. sv-para height is locked (in doSimplify)
  // so the dot and the zoomed browser never jump when the text length changes.
  async function swapBody(tokens, { stream }) {
    if (swapping) return; swapping = true;
    simpBody.classList.add('fade');                       // fade current text out
    await wait(250);
    const spans = buildSpans(tokens);                     // new spans (each opacity 0)
    simpBody.classList.remove('fade');
    if (stream) {
      for (const s of spans) {
        if (s.classList.contains('saved') && Shelf.has(s.dataset.w)) {
          await flyShelfCardTo(s.dataset.w, s.getBoundingClientRect(), { scale: 0.5, settle: 0 });
          s.classList.add('on'); await wait(200);
        } else { s.classList.add('on'); await wait(58); }
      }
    } else {
      spans.forEach((s, i) => setTimeout(() => s.classList.add('on'), i * 9));
      await wait(spans.length * 9 + 240);
    }
    swapping = false;
  }

  /* ---- motion "same-block settle": the BEFORE ghosts in place BEHIND the live
     rewrite, a reading-level badge ticks C1 → B1, and the AFTER reweaves word by
     word — so you clearly see ONE paragraph getting simpler, at your level ---- */
  let levelEl = null;
  function ensureLevel() {
    if (levelEl) return levelEl;
    levelEl = el('simp-level');
    levelEl.innerHTML =
      '<span class="sl-cap">now at your level</span>' +
      '<span class="sl-chip before">C1</span>' +
      '<span class="sl-arrow">→</span>' +
      '<span class="sl-chip after">B1</span>';
    simpPara.appendChild(levelEl);
    return levelEl;
  }
  function makeGhost(html) {
    const g = el('simp-ghost');
    g.innerHTML = html;
    g.style.left = simpBody.offsetLeft + 'px';
    g.style.top = simpBody.offsetTop + 'px';
    g.style.width = simpBody.offsetWidth + 'px';
    simpPara.appendChild(g);
    return g;
  }
  function startSweep() {
    const sweep = el('simp-sweep');
    simpBody.appendChild(sweep);
    requestAnimationFrame(() => sweep.classList.add('go'));
    setTimeout(() => { if (sweep.parentNode) sweep.remove(); }, 1300);
  }

  async function doSimplify() {
    if (simplified || swapping) return;
    simplified = true;
    lockSimpHeight();                                     // pins paragraph + page body (no jump) — before swapping
    swapping = true;
    simpDot.style.animation = 'none';
    simpPara.classList.add('simplified');                 // dot → square + soft wash

    // ghost the current BEFORE in place, behind the live layer (same box)
    const ghost = makeGhost(simpBody.innerHTML);
    requestAnimationFrame(() => ghost.classList.add('settle'));   // desaturate + blur + lift + fade to ~14%

    // level badge enters showing C1 — the original, hard level
    const lvl = ensureLevel(); lvl.classList.remove('rolled', 'pulse'); lvl.classList.add('show');

    // fade the live BEFORE out (the ghost carries it now) and build the hidden AFTER
    simpBody.classList.add('fade');
    await wait(300);
    const spans = buildSpans(buildSimpleTokens());
    simpBody.classList.remove('fade');

    // a deliberate hold so the eye registers it's the SAME block
    await wait(540);

    // badge ticks C1 → B1 with a green pulse + "now at your level"
    lvl.classList.add('rolled', 'pulse');
    setTimeout(() => lvl.classList.remove('pulse'), 760);
    await wait(360);

    // reweave the AFTER word by word (calm ~90ms), one light sweep,
    // saved words burst in as deck cards snapping into their slots
    startSweep();
    for (const s of spans) {
      s.classList.add('on');
      if (s.classList.contains('saved') && Shelf.has(s.dataset.w)) {
        flyShelfCardTo(s.dataset.w, s.getBoundingClientRect(), { scale: 0.5, settle: 0 });
      }
      await wait(90);
    }

    // settle — let the ghost dissolve away
    await wait(240);
    ghost.classList.add('gone');
    setTimeout(() => { if (ghost.parentNode) ghost.remove(); }, 480);
    swapping = false;
  }
  async function doRevert() {
    if (!simplified || swapping) return; simplified = false;
    simpPara.classList.remove('simplified');              // square → circle, wash fades out
    simpDot.style.animation = '';
    if (levelEl) levelEl.classList.remove('show', 'rolled', 'pulse');
    $$('.simp-ghost', simpPara).forEach(g => g.remove());
    await swapBody(originalTokens(), { stream: false });
  }
  const streamSimplify = doSimplify;   // alias for callers that await the rewrite

  // make sure the simplify beat has saved words to weave back in
  function ensureSeed() {
    // the woven words must already be in the deck so they can fly back in as cards
    ['survey', 'rugged', 'islands', 'spell', 'storms', 'coast'].forEach(w => { if (!Shelf.has(w)) saveWord(w, $('.word[data-w="' + w + '"]', $('#sv-p0'))); });
  }

  /* ---- choreography + step communication ---- */
  const stepEls = $$('.sv-step', $('#sv-steps')), cap = $('#sv-cap');
  let capTimer = null;
  function setCap(t) {
    if (t === undefined) return;
    clearTimeout(capTimer); cap.style.opacity = '0';
    capTimer = setTimeout(() => { cap.textContent = t; cap.style.opacity = '1'; }, 170);
  }
  cap.textContent = 'Tap a word, save it, then simplify the paragraph';
  function lock(on) { stage.classList.toggle('locked', !!on); }
  function setStep(n, capText) {
    stepEls.forEach(s => { const k = +s.dataset.s; s.classList.toggle('done', k < n); s.classList.toggle('on', k === n); });
    setCap(capText);
  }
  function allDone(capText) { stepEls.forEach(s => { s.classList.add('done'); s.classList.remove('on'); }); setCap(capText); }
  let phase = 'idle', advanced = false, userTook = false, tour = null;
  function userActed() { if (tour) tour.finish(); userTook = true; }

  function maybeAdvance() {
    // simplify stays locked until the USER saves a word (demo saved one to teach)
    if (phase === 'invite' && saveCount >= 2 && !advanced) { advanced = true; pageEl.classList.remove('invite'); setTimeout(runSimplifyBeat, 850); }
  }

  function word(w) { return $('.word[data-w="' + w + '"]', $('#sv-p0')); }

  async function runSaveBeat() {
    phase = 'demo';
    lock(true);
    setStep(1, 'Watch — tap a word to look it up');
    // teach with a word that isn't already in the deck (the hero may have flown a few in),
    // so the "save" beat always shows a real card lifting off — falls back to 'coast'
    const dw = ['coast', 'exposed', 'winding', 'remote'].find(w => !Shelf.has(w) && word(w)) || 'coast';
    const t1 = word(dw); if (!t1) return;
    tour = makeCursorGuide(stage);
    await tour.run(t1, { label: 'Tap a word', onTap: () => { if (!popup.classList.contains('show')) openWord(t1); }, hold: 560, stay: true });
    if (userTook) return;
    setStep(2, 'Save it — the card flies to your collection');
    const sb1 = $('.savebtn', popup);
    await tour.run(sb1, { label: 'Save word', onTap: () => { if (!Shelf.has(dw)) saveWord(dw, t1); }, hold: 520, stay: true });
    if (userTook) return;
    await wait(380);
    tour.finish(); tour = null; closePopup();
    // hand to the reader — the simplify beat stays locked until THEY save a word
    phase = 'invite';
    lock(false);
    pageEl.classList.add('invite');
    setStep(2, 'Your turn — tap a glowing word and save it');
    setCap('Save a word, then simplify the dense paragraph');
    // long safety net for fully passive viewers; the real path is a user save
    setTimeout(() => { if (phase === 'invite' && !advanced) { advanced = true; pageEl.classList.remove('invite'); runSimplifyBeat(); } }, 15000);
  }

  async function runSimplifyBeat() {
    phase = 'seed';
    lock(true);
    closePopup();
    pageEl.classList.remove('invite');
    setStep(3, 'Now — simplify a dense paragraph to your level');
    ensureSeed();
    await wait(750);
    zoomTo(simpPara, 1.16);
    await wait(660);
    setCap('Tap the orange dot to rewrite it at your level');
    simpDot.classList.add('beckon');
    tour = makeCursorGuide(stage);
    let done;
    // cursor taps the dot and leaves immediately so it never overlaps the rewrite
    await tour.run(simpDot, { label: 'Simplify', startX: stage.getBoundingClientRect().width * 0.55, onTap: () => { simpDot.classList.remove('beckon'); if (tour) { tour.finish(); tour = null; } done = doSimplify(); }, hold: 120, stay: false });
    if (!done && !simplified) done = doSimplify();
    await done;
    await wait(500);
    zoomReset();
    await wait(380);
    allDone('Done — tap the square to flip back. Every paragraph has its own dot →');
    lock(false);
    phase = 'done';
  }

  // reader can toggle simplify ⇄ original themselves
  simpDot.addEventListener('click', () => {
    userActed(); simpDot.classList.remove('beckon');
    if (swapping) return;
    if (!simplified) { closePopup(); setStep(3); doSimplify().then(() => allDone('Nice — tap the square to flip back →')); }
    else { doRevert(); }
  });

  vct.textContent = Shelf.words.length;

  // pin the paragraph height up front (after fonts settle) and keep it pinned on resize
  window.whenFontsReady ? window.whenFontsReady(lockSimpHeight) : lockSimpHeight();
  let __svRT; addEventListener('resize', () => { clearTimeout(__svRT); __svRT = setTimeout(lockSimpHeight, 200); });

  new IntersectionObserver((es, o) => {
    es.forEach(e => { if (e.isIntersecting) { o.disconnect(); if (window.__noAuto) return; setTimeout(() => { if (!userTook) runSaveBeat(); }, 350); } });
  }, { threshold: 0.5 }).observe(section);
})();
