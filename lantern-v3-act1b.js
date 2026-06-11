/* ============================================================
   Lantern Landing v3 — ACT I (cont.)
   Scene 2: Translate (in place)   ·   Scene 3: Discuss (chat)
   ============================================================ */

/* ---------- 02 TRANSLATE ---------- */
(function () {
  const section = $('#translate'); if (!section) return;
  const stage = $('#tr-stage'), panel = $('#tr-panel');
  const trSrc = $('#tr-src'), trTgt = $('#tr-tgt'), trLang = $('#tr-lang'), trLangL = $('#tr-langL'), trSwap = $('#tr-swap');
  const stepEls = $$('.sv-step', $('#tr-steps')), cap = $('#tr-cap');

  const TR = {
    s1: { src: "La route serpente le long d'une côte exposée, reliant des îles isolées par de longs ponts bas.", uk: "Дорога звивається вздовж відкритого узбережжя, з'єднуючи віддалені острови довгими низькими мостами.", es: "La carretera serpentea a lo largo de una costa expuesta, conectando islas remotas con largos puentes bajos." },
    s2: { src: "Chaque automne, les tempêtes projettent les vagues par-dessus la chaussée.", uk: "Щоосені шторми перекидають хвилі через дорожнє полотно.", es: "Cada otoño, las tormentas lanzan las olas por encima de la calzada." },
    s3: { src: "Les ingénieurs ont mis sept ans à bâtir cet ouvrage, contre vents et marées.", uk: "Інженери будували цю споруду сім років, попри вітри та припливи.", es: "Los ingenieros tardaron siete años en construir esta obra, contra viento y marea." },
  };

  let st = { sent: null, lang: 'uk', flip: false }, guide = null, userTook = false, finished = false, trDoneT = null;
  function setStep(n, c) { stepEls.forEach(s => { const k = +s.dataset.s; s.classList.toggle('done', k < n); s.classList.toggle('on', k === n); }); if (c !== undefined) cap.textContent = c; }
  // once the reader has translated a line themselves, settle the scene as complete (so the
  // scroll-down hint can appear) — guarded so exploring more lines won't un-complete it
  function scheduleTrDone() { if (finished) return; clearTimeout(trDoneT); trDoneT = setTimeout(() => { finished = true; setStep(3, 'Read any line in your language — now scroll on.'); }, 1700); }

  function applyHeight(instant) {
    const prev = panel.style.height; panel.style.height = 'auto';
    const target = panel.offsetHeight;
    if (instant) panel.style.height = target + 'px';
    else { panel.style.height = prev || target + 'px'; panel.getBoundingClientRect(); requestAnimationFrame(() => { panel.style.height = target + 'px'; }); }
  }
  function waveReveal(elm, text) {
    const words = String(text).split(' ');
    elm.innerHTML = words.map((w, i) => '<span class="tw" style="animation-delay:' + (i * 55) + 'ms">' + w + '</span>').join(' ');
  }
  function render(instant) {
    const d = TR[st.sent]; if (!d) return;
    const lang = st.lang.toUpperCase(), french = d.src, foreign = d[st.lang];
    trSrc.textContent = st.flip ? foreign : french;
    trLangL.textContent = st.flip ? lang : 'FR';
    trLang.textContent = st.flip ? 'FR' : lang;
    waveReveal(trTgt, st.flip ? french : foreign);
    applyHeight(instant);
  }
  function openTr(sel) {
    const fresh = !panel.classList.contains('show');
    $$('.sel', section).forEach(x => x.classList.remove('on')); sel.classList.add('on'); st.sent = sel.dataset.tr;
    if (fresh) panel.classList.add('noh');
    panel.classList.add('show'); render(fresh);
    if (fresh) requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.remove('noh')));
    if (!finished) setStep(2, 'Swap the direction, or pick another line — try it yourself');
  }
  function closeTr() { panel.classList.remove('show'); $$('.sel', section).forEach(x => x.classList.remove('on')); st.sent = null; }
  function clearInvite() { $$('.sel', section).forEach(x => x.classList.remove('cand-pulse')); }

  $$('.sel', section).forEach(s => s.addEventListener('click', () => { guide && guide.cancel(); clearInvite(); userTook = true; openTr(s); scheduleTrDone(); }));
  $('#tr-close').addEventListener('click', closeTr);
  trSwap.addEventListener('click', () => { st.flip = !st.flip; trSwap.classList.remove('spin'); void trSwap.offsetWidth; trSwap.classList.add('spin'); render(); });
  $$('.tspk', panel).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); b.classList.remove('playing'); void b.offsetWidth; b.classList.add('playing'); }));

  // glide the cursor along the translation like a reader's eye — just the first line
  // or two (a skim, not every line), with a smooth eased sweep
  async function readAcross(elm) {
    if (!guide || guide.dead) return;
    const spans = $$('.tw', elm); if (!spans.length) return;
    const sr = stage.getBoundingClientRect(), lines = [];
    spans.forEach(s => {
      const r = s.getBoundingClientRect();
      let L = lines.find(l => Math.abs(l.top - r.top) < 6);
      if (!L) lines.push({ top: r.top, left: r.left, right: r.right, h: r.height });
      else { L.left = Math.min(L.left, r.left); L.right = Math.max(L.right, r.right); }
    });
    const n = Math.min(lines.length, 2);   // skim the first line, ease into the second — then stop
    for (let i = 0; i < n; i++) {
      if (userTook || guide.dead) return;
      const L = lines[i], y = L.top - sr.top + L.h * 0.62, last = i === n - 1;
      // soft drop onto the start of the line (quick) then a slow, eased read across
      await guide.glide(L.left - sr.left + 6, y, { hold: 110, dur: 380 });
      if (userTook || guide.dead) return;
      const endX = last ? L.left + (L.right - L.left) * 0.62 : L.right - 6;   // trail off mid-line on the last pass
      await guide.glide(endX - sr.left, y, { hold: last ? 360 : 220, dur: last ? 900 : 720 });
    }
  }

  async function runDemo() {
    setStep(1, 'Watch — Lantern translates the line, in place');
    const t = $('.sel[data-tr="s1"]', section); if (!t) return;
    guide = makeCursorGuide(stage);
    await guide.run(t, { label: 'Click a sentence', onTap: () => { if (!st.sent) openTr(t); }, hold: 700, stay: true });
    if (userTook || guide.dead) return;
    await wait(720);                       // let the translation wave settle in
    if (userTook || guide.dead) return;
    await readAcross(trTgt);               // cursor reads the translation, line by line
    if (userTook || guide.dead) return;
    await wait(240);
    await guide.run($('#tr-close'), { label: 'Done reading', onTap: closeTr, hold: 460 });  // cursor closes the panel
    if (userTook) return;
    await wait(540);                       // let the panel slide away
    if (userTook) return;
    const next = $('.sel[data-tr="s2"]', section) || section.querySelector('.sel:not(.on)');
    if (next) next.classList.add('cand-pulse');   // invite the reader to do the next line
    setStep(2, 'Your turn — click a highlighted line to translate it');
  }

  new IntersectionObserver((es, o) => { es.forEach(e => { if (e.isIntersecting) { o.disconnect(); if (window.__noAuto) return; setTimeout(() => { if (!userTook) runDemo(); }, 350); } }); }, { threshold: 0.5 }).observe(section);
})();

/* ---------- 03 DISCUSS — read the page, get stuck, ask it ---------- */
(function () {
  const section = $('#discuss'); if (!section) return;
  const stage = $('#disc-stage'), article = $('#disc-article'), artP = $('#disc-art-p');
  const confuse = $('#disc-confuse'), fab = $('#disc-fab'), think = $('#disc-think');
  const chat = $('#disc-chat'), body = $('#disc-body'), sugg = $('#disc-sugg'), cap = $('#disc-cap');
  const cue = $('.sv-scrollcue', section);

  // saved words woven back into answers, marked [[lemma]] or [[lemma|Display]]
  const QA = [
    { q: 'What does “exposed” mean here?', a: "It means open and unprotected — the [[coast]] has nothing to block the wind or waves, so the sea hits the road head-on." },
    { q: 'Why was it so hard to build?', a: "Relentless [[storms]] kept battering the [[exposed]] rock, halting the work again and again — seven years in all." },
    { q: 'Sum it up in one line.', a: "A dramatic Norwegian [[coast]] road that hops between remote islands, built against constant [[storms]]." },
  ];

  let guide = null, userTook = false, asked = 0, busy = false, swapped = false, greeted = false;

  const stepEls = $$('.sv-step', $('#disc-steps'));
  function setStep(n) { stepEls.forEach(s => { const k = +s.dataset.s; s.classList.toggle('done', k < n); s.classList.toggle('on', k === n); }); }
  function allStepsDone() { stepEls.forEach(s => { s.classList.add('done'); s.classList.remove('on'); }); }
  function setCap(t) { if (t !== undefined) cap.textContent = t; }
  function showScroll() { if (cue) cue.classList.add('show'); }

  /* ---- chat plumbing ---- */
  function userMsg(text) { const u = el('cw-user'); u.textContent = text; body.appendChild(u); body.scrollTop = body.scrollHeight; }

  // split an answer into text / bold / saved-word segments
  function parseAnswer(text) {
    const segs = [], re = /\*\*(.+?)\*\*|\[\[([a-zA-Z]+)(?:\|([^\]]+))?\]\]/g; let m, last = 0;
    while ((m = re.exec(text))) {
      if (m.index > last) segs.push({ t: 'text', s: text.slice(last, m.index) });
      if (m[1] != null) segs.push({ t: 'bold', s: m[1] });
      else { const lemma = m[2].toLowerCase(); segs.push({ t: 'saved', lemma, s: m[3] || (DICT[lemma] ? DICT[lemma].w : m[2]) }); }
      last = re.lastIndex;
    }
    if (last < text.length) segs.push({ t: 'text', s: text.slice(last) });
    return segs;
  }

  // Build the whole answer as hidden word-spans up front (no layout jump as it streams),
  // then reveal them one by one with the same soft blur-up used by the simplify scene.
  async function streamBot(text) {
    const scroll = () => { body.scrollTop = body.scrollHeight; };
    const bot = el('cw-bot');
    bot.innerHTML = '<span class="cw-typing"><i></i><i></i><i></i></span>';
    body.appendChild(bot); scroll();
    await wait(560);
    bot.innerHTML = '';
    // pin to the bottom ONCE, now that the (still-hidden) message reserves its full height —
    // words then fade in place with no further scrolling, so the text never drifts.
    scroll();

    const queue = [];   // ordered reveal steps: { el, saved?, lemma? }
    const addWord = (host, w) => { const s = el('cw-w', 'span'); s.textContent = w; host.appendChild(s); queue.push({ el: s }); };
    for (const seg of parseAnswer(text)) {
      if (seg.t === 'saved') {
        const sp = el('cw-saved', 'span'); sp.dataset.w = seg.lemma; sp.textContent = seg.s;
        bot.appendChild(sp); queue.push({ el: sp, saved: true, lemma: seg.lemma });
      } else {
        const host = seg.t === 'bold' ? el('', 'strong') : bot;
        if (host !== bot) bot.appendChild(host);
        seg.s.split(/(\s+)/).forEach(w => { if (w === '') return; /^\s+$/.test(w) ? host.appendChild(document.createTextNode(w)) : addWord(host, w); });
      }
    }
    scroll();   // account for the now-built height before the reveal begins

    for (const step of queue) {
      if (step.saved && window.Shelf && Shelf.has(step.lemma)) {
        await flyShelfCardTo(step.lemma, step.el.getBoundingClientRect(), { scale: 0.5, settle: 0 });
        step.el.classList.add('on'); await wait(150);
      } else {
        step.el.classList.add('on'); await wait(step.saved ? 90 : 46);
      }
    }
  }

  /* ---- saved-word popup (tap a woven word to look it up) ---- */
  const popup = $('#disc-popup'); let popupOpen = false;
  function closePopup() { if (!popup) return; popup.classList.remove('show'); popupOpen = false; }
  function openPopup(lemma, anchor) {
    if (!popup) return;
    const d = DICT[lemma] || genDef(lemma);
    popup.innerHTML =
      '<div class="top"><div class="wl"><div class="w">' + d.w + '</div>' + (d.ph ? '<div class="ph">' + d.ph + '</div>' : '') + '</div>' +
      '<div class="ctrls"><span class="spk">' + ICON.spk + '</span><span class="cefr-b ' + (d.cls || 'b-green') + '">' + d.lvl + '</span><button class="close" aria-label="close">✕</button></div></div>' +
      '<hr />' + (d.syn ? '<div class="syn">' + d.syn + '</div>' : '') + '<div class="def">' + d.def + '</div>' + (d.ex ? '<div class="ex">' + boldEx(d.ex) + '</div>' : '') +
      (d.tr ? '<div class="popup-tr"><span class="popup-tr-lbl">UK</span>' + d.tr + '</div>' : '');
    const sr = stage.getBoundingClientRect(), wr = anchor.getBoundingClientRect();
    const left = clampv(wr.left - sr.left - 8, 8, Math.max(8, sr.width - 300));
    popup.style.left = left + 'px';
    popup.style.transformOrigin = 'top left';
    popup.style.top = (wr.bottom - sr.top + 9) + 'px';
    popup.classList.remove('show');
    requestAnimationFrame(() => {
      const ph = popup.offsetHeight;
      if (wr.bottom - sr.top + 9 + ph > sr.height - 6) {
        popup.style.transformOrigin = 'bottom left';
        popup.style.top = Math.max(6, wr.top - sr.top - ph - 9) + 'px';
      }
      popup.classList.add('show'); popupOpen = true;
    });
  }
  if (body) body.addEventListener('click', e => { const sp = e.target.closest('.cw-saved'); if (!sp) return; e.stopPropagation(); openPopup(sp.dataset.w, sp); });
  if (body) body.addEventListener('scroll', () => { if (popupOpen) closePopup(); }, { passive: true });
  if (popup) popup.addEventListener('click', e => {
    e.stopPropagation();
    if (e.target.closest('.close')) { closePopup(); return; }
    const spk = e.target.closest('.spk'); if (spk) { spk.classList.remove('playing'); void spk.offsetWidth; spk.classList.add('playing'); }
  });
  document.addEventListener('click', e => { if (!popupOpen) return; if (popup.contains(e.target) || e.target.closest('.cw-saved')) return; closePopup(); });

  async function ask(i) {
    if (busy) return;
    busy = true;
    userMsg(QA[i].q);
    await wait(280);
    await streamBot(QA[i].a);
    asked++; busy = false;
    allStepsDone();
    setCap('Lantern answers from the page you’re reading — in any language.');
    showScroll();
  }

  /* ---- article: zoom + reader's-eye sweep + thought bubble ---- */
  function zoomTo(target, scale) {
    const br = article.getBoundingClientRect(), tr = target.getBoundingClientRect();
    const ox = clampv(((tr.left + tr.width / 2) - br.left) / br.width * 100, 0, 100);
    const oy = clampv(((tr.top + tr.height / 2) - br.top) / br.height * 100, 0, 100);
    article.style.transformOrigin = ox + '% ' + oy + '%';
    article.style.transform = 'scale(' + scale + ')';
  }
  function zoomReset() { article.style.transform = ''; }

  // a calm reader's-eye sweep: ease the cursor steadily left→right along each line,
  // then drift diagonally down to the next — ease-in-out throughout so it never snaps.
  async function readAcross() {
    if (!guide || guide.dead) return;
    const sr = stage.getBoundingClientRect();
    const rng = document.createRange(); rng.selectNodeContents(artP);
    const lines = [...rng.getClientRects()].filter(r => r.width > 24);
    const n = Math.min(lines.length, 3);
    const EASE = 'cubic-bezier(.42,0,.58,1)';   // smooth, near-linear ease-in-out
    for (let i = 0; i < n; i++) {
      if (userTook || guide.dead) return;
      const L = lines[i], y = L.top - sr.top + L.height * 0.6, last = i === n - 1;
      const x0 = L.left - sr.left + 8;
      const x1 = (last ? L.left + (L.right - L.left) * 0.6 : L.right - 8) - sr.left;
      // glide to the start of the line — gentle, no hard stop
      await guide.glide(x0, y, { label: i === 0 ? 'Reading…' : undefined, hold: 40, dur: i === 0 ? 520 : 340, ease: EASE });
      if (userTook || guide.dead) return;
      // sweep across the line at a steady reading pace (longer line → longer sweep)
      const span = Math.max(0.4, (x1 - x0) / Math.max(1, L.width));
      await guide.glide(x1, y, { hold: last ? 220 : 90, dur: Math.round((last ? 1000 : 760) * (last ? 1 : 0.7 + span * 0.4)), ease: EASE });
    }
  }

  function showThink() {
    const sr = stage.getBoundingClientRect(), tr = confuse.getBoundingClientRect();
    think.style.left = clampv(tr.left - sr.left + 4, 8, sr.width - 232) + 'px';
    think.style.top = Math.max(6, tr.top - sr.top - 54) + 'px';
    think.classList.add('show');
  }
  function hideThink() { think.classList.remove('show'); }

  /* ---- the swap: article → chat ---- */
  async function swapToChat() {
    if (swapped) return; swapped = true;
    hideThink(); article.classList.remove('focus'); zoomReset();
    await wait(140);
    article.classList.add('hide');
    await wait(160);
    chat.classList.add('show');
    setStep(2);
    await wait(560);
  }
  async function greet() {
    if (greeted) return; greeted = true;
    await streamBot("I've read the whole article. Ask me anything about it.");
  }

  // ensure the shelf holds the words the answers weave back in (the persistent "thread")
  function seedShelf() {
    if (!window.Shelf) return;
    ['coast', 'exposed', 'storms'].forEach(w => { if (!Shelf.has(w)) Shelf.add(w); });
  }

  // user clicks the ask button themselves → jump to chat
  fab.addEventListener('click', async () => {
    if (swapped) return;
    userTook = true; guide && guide.cancel();
    await swapToChat();
    await greet();
    await wait(700);
    await ask(0);
  });

  async function runDemo() {
    seedShelf();
    if (REDUCED) {
      await swapToChat(); await greet();
      await wait(700);
      await ask(0);
      return;
    }
    setCap('Watch — reading along the page…');
    guide = makeCursorGuide(stage);
    await readAcross();
    if (userTook) return;
    await wait(160);
    // zoom into the dense phrase and let the reader's confusion surface
    article.classList.add('focus');
    zoomTo(confuse, 1.2);
    const sr = stage.getBoundingClientRect(), cr = confuse.getBoundingClientRect();
    await guide.glide(cr.left - sr.left + cr.width * 0.42, cr.top - sr.top + cr.height * 0.6, { hold: 480, dur: 600 });
    if (userTook) return;
    showThink();
    setCap('Stuck on a sentence? Just ask the page.');
    await wait(1550);
    if (userTook) return;
    hideThink();
    await wait(260);
    zoomReset(); article.classList.remove('focus');
    await wait(420);
    if (userTook) return;
    // tap the ask button → open the chat
    fab.classList.add('beckon');
    await guide.run(fab, { label: 'Ask this page', onTap: () => fab.classList.remove('beckon'), hold: 320, stay: true });
    if (userTook) return;
    await swapToChat();
    if (userTook) return;
    await greet();
    if (userTook) return;
    await wait(800);
    setCap('Watch — Lantern answers from the page');
    await ask(0);
    // ask() handles the streamed answer and the scroll cue
  }

  new IntersectionObserver((es, o) => { es.forEach(e => { if (e.isIntersecting) { o.disconnect(); if (window.__noAuto) return; setTimeout(() => { if (!userTook) runDemo(); }, 380); } }); }, { threshold: 0.5 }).observe(section);
})();
