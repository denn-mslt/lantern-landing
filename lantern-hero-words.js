/* ============================================================
   Hero — "save a word" interaction + language personalizer.

   New visitor: onboarding card appears — picks language →
   cursor demo plays with translations in that language.

   Returning visitor (saved lang in localStorage): auto-demo.
   ============================================================ */
(function () {
  var SUP = ['es', 'fr', 'de', 'uk', 'pt'];
  var ENDONYM = { es: 'Español', fr: 'Français', de: 'Deutsch', uk: 'Українська', pt: 'Português', en: 'English' };
  var STORE = 'lantern.gloss';

  function saved() { try { return localStorage.getItem(STORE); } catch (e) { return null; } }
  function persist(v) { try { localStorage.setItem(STORE, v); } catch (e) {} }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* default gloss language is French unless the visitor has explicitly picked another
     (which is persisted). Mirrors index.html's userLang() so the gloss popups, the
     immersion flip and the translate card all open in the same language. */
  function resolveLang() {
    var s = saved();
    return (s && s !== 'en') ? s : 'fr';
  }

  var LANG = resolveLang();
  function glossFor(word) { return word.dataset['tr' + cap(LANG)] || word.dataset.trEn || word.dataset.tr || ''; }

  function init() {
    var hero = document.getElementById('hero');
    var browser = hero && hero.querySelector('.browser');
    if (!hero || !browser) return;
    var MOBILE = window.innerWidth < 1000;

    var words = Array.prototype.slice.call(browser.querySelectorAll('.hl'));
    if (!words.length) return;
    var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* The "My vocab" deck cards are built from DICT, but the four hero words
       (genre·devoted·phenomenon·legacy) live only as inline .hl data — so the deck
       fell back to genDef and every card read A2 / green / no gloss, mismatching the
       floating word-cards (B2·B2·B2·C1, in colour, with a translation). Seed DICT from
       the .hl data so each deck card matches the hero's first state and carries the
       gloss in the chosen language. Re-run on language change to refresh both DICT and
       any card already on the rail. */
    function registerGloss() {
      if (typeof DICT === 'undefined') return;
      words.forEach(function (word) {
        var lemma = word.dataset.w; if (!lemma) return;
        var base = DICT[lemma] || (typeof genDef === 'function' ? genDef(lemma) : {});
        DICT[lemma] = Object.assign({}, base, {
          w: word.dataset.w,
          cls: 'b-' + (word.dataset.cls || 'green'),
          lvl: word.dataset.cefr || base.lvl || '',
          tr: glossFor(word)
        });
        var dc = window.Shelf && window.Shelf.cardEl && window.Shelf.cardEl(lemma);
        if (dc) { var t = dc.querySelector('.wd-tr'); if (t) t.textContent = glossFor(word); }
      });
    }
    registerGloss();

    /* mobile rest slots are COLUMN-major (TL, BL, TR, BR) so the save order
       route·coast·rugged·remote lands left-column then right-column — when they
       later morph straight down into the left→right vocab strip, none of the
       flight paths cross (row-major made coast & rugged swap sides mid-air). */
    var slots = MOBILE ? [
      { xp: 0.02,  yp: 8,   rot: 2  },
      { xp: 0.255, yp: 13,  rot: -2 },
      { xp: 0.49,  yp: 6,   rot: 3  },
      { xp: 0.62,  yp: 11,  rot: -2 }
    ] : [
      { xp: 0.820, yp: 0.150, rot: 7 },
      { xp: 0.862, yp: 0.470, rot: -6 },
      { xp: 0.800, yp: 0.780, rot: 5 },
      { xp: 0.770, yp: 0.625, rot: -4 }
    ];
    var slotI = 0;
    var rested = [];

    function slotTop(slot) {
      if (!MOBILE) return slot.yp * hero.offsetHeight;
      var hr = hero.getBoundingClientRect(), br = browser.getBoundingClientRect();
      return (br.bottom - hr.top) + slot.yp;
    }

    var CARD_DURS = ['4.2s', '5.1s', '4.7s'];
    var CARD_DELS = ['0s', '-1.5s', '-0.8s'];

    // resolve card fields: .hl words carry rich inline data-* (incl. per-language gloss);
    // tokenized .word spans fall back to the shared DICT / genDef exposed on window.
    function wordMeta(word) {
      if (word.dataset.cls) {
        return { w: word.dataset.w, c: word.dataset.cls, cefr: word.dataset.cefr || '', ph: word.dataset.ph || '', gloss: glossFor(word) };
      }
      var lemma = word.dataset.w;
      var d = DICT[lemma] || genDef(lemma);
      return { w: d.w || lemma, c: (d.cls || 'b-green').replace(/^b-/, ''), cefr: d.lvl || '', ph: d.ph || '', gloss: d.tr || '' };
    }

    function buildCard(word, slot) {
      var idx = rested.length;
      var m = wordMeta(word);
      var c = m.c || 'blue';
      var card = document.createElement('div');
      card.className = 'hw-card';
      card.style.setProperty('--cbdur', CARD_DURS[idx % CARD_DURS.length]);
      card.style.setProperty('--cbdel', CARD_DELS[idx % CARD_DELS.length]);
      var longWord = m.w.length > 8;
      var wfs = longWord ? 24 : 27;
      var cardW = MOBILE ? 140 : (longWord ? 248 : 186);
      card.innerHTML =
        '<div class="wordcard" style="--rot:' + slot.rot + 'deg;width:' + cardW + 'px">' +
          '<div class="wtop"><span class="w" style="font-size:' + wfs + 'px">' + m.w + '</span>' +
          '<span class="cefr-b b-' + c + '">' + m.cefr + '</span></div>' +
          '<div class="tr t-' + c + '">' + m.gloss + '</div></div>';
      card.style.left = (slot.xp * hero.offsetWidth) + 'px';
      card.style.top = slotTop(slot) + 'px';
      hero.appendChild(card);
      rested.push({ card: card, word: word });
      return card;
    }

    function flyCard(word) {
      if (word.dataset.flown) return;
      word.dataset.flown = '1';
      setTimeout(function () { doFly(word); }, 320);
    }
    function doFly(word) {
      var slot = slots[slotI % slots.length]; slotI++;
      var sx = slot.xp * hero.offsetWidth, sy = slotTop(slot);
      var card = buildCard(word, slot);
      var cw = card.offsetWidth, ch = card.offsetHeight;
      var hr = hero.getBoundingClientRect(), wr = word.getBoundingClientRect();
      var dx = (wr.left + wr.width / 2 - hr.left) - (sx + cw / 2);
      var dy = (wr.top + wr.height / 2 - hr.top) - (sy + ch / 2);
      card.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(.34)';
      card.getBoundingClientRect();
      requestAnimationFrame(function () {
        card.style.opacity = '1';
        card.style.transform = 'translate(0px,0px) scale(1)';
      });
      setTimeout(function () { card.classList.add('rested'); }, 950);
      word.classList.remove('picking');
      markSaved(word);
    }
    function restCard(word) {
      if (word.dataset.flown) return;
      word.dataset.flown = '1';
      var slot = slots[slotI % slots.length]; slotI++;
      var card = buildCard(word, slot);
      card.style.opacity = '1';
      card.classList.add('rested');
      markSaved(word);
    }

    // ---- as the reader scrolls off the hero, the big floating cards fold neatly
    //      into the "My vocab" deck (each glides to its deck slot and shrinks in) ----
    var folded = false;
    /* cursor-demo state, so a scroll mid-demo can snap it to its end instantly */
    var demoCursor = null, demoTimers = [], onboardEl = null, demoDone = false;
    function foldCardsToDeck(force) {
      finalizeDemo();                 /* cursor away + snap any un-picked word to its card before folding */
      if (folded || !rested.length) return;
      if (!window.Shelf) return;
      if (!force && window.innerWidth < 1200) return;   // scroll path: deck docks on wide viewports only
      folded = true;
      if (!MOBILE) document.body.classList.add('vocab-on');    // desktop: reveal the hero-docked deck (mobile uses the P2 strip)
      /* TRUE MORPH via the View Transitions API when supported: the browser tweens
         each floating card straight into its deck card — size, position AND a
         content crossfade — in one pass, no manual scale/flip. The root is
         EXCLUDED (:root{view-transition-name:none}) so only the cards are
         snapshotted; the rest of the page keeps animating live underneath instead
         of being frozen behind a full-page snapshot. */
      if (!REDUCED && !MOBILE && typeof document.startViewTransition === 'function') { foldViaViewTransition(); return; }
      /* fallback (Firefox / reduced-motion): the FLIP fly-and-crossfade.
         pass 1 — add ALL deck slots first and capture from-rects while the hero
         layout is intact.  This is critical on mobile where the deck is a flex
         row: measuring to-rect after only the first Shelf.add() gives width =
         entire deck width, so sc = deck/card > 1 → cards GROW instead of shrink. */
      var items = [];
      rested.forEach(function (rc, i) {
        var card = rc.card, lemma = rc.word.dataset.w;
        if (REDUCED) { if (!window.Shelf.has(lemma)) window.Shelf.add(lemma); if (card.parentNode) card.parentNode.removeChild(card); return; }
        var from = card.getBoundingClientRect();
        if (window.Shelf.has(lemma)) { if (card.parentNode) card.parentNode.removeChild(card); return; }
        var deckCard = window.Shelf.add(lemma, { preset: true });   // reserve its deck slot, invisible
        items.push({ card: card, from: from, deckCard: deckCard, delay: i * 80 });
      });
      /* pass 2 — all deck cards are now in the flex row → measure final to-rects,
         then lift each hero card to fixed coords and animate it to its slot. */
      items.forEach(function (item) {
        var card = item.card, from = item.from, deckCard = item.deckCard, delay = item.delay;
        var to = deckCard.getBoundingClientRect();
        if (to.width < 2 || from.width < 2) { deckCard.classList.add('in'); if (card.parentNode) card.parentNode.removeChild(card); return; }
        // lift the card out of the (scrolling) hero into fixed coords, then glide + shrink to the slot
        card.classList.remove('rested');
        card.style.transition = 'none';
        card.style.animation = 'none';
        card.style.position = 'fixed';
        card.style.margin = '0';
        card.style.left = from.left + 'px';
        card.style.top = from.top + 'px';
        card.style.zIndex = '95';
        card.style.transformOrigin = 'top left';
        document.body.appendChild(card);
        card.getBoundingClientRect();                          // commit the fixed start position
        var sc = to.width / from.width;
        var tx = (to.left - from.left).toFixed(1), ty = (to.top - from.top).toFixed(1);
        /* two-rAF pattern: rAF-1 applies the transition property so the browser
           records the current transform as the "from" state; rAF-2 changes the
           transform so the transition fires reliably in all browsers. */
        requestAnimationFrame(function () {
          card.style.transition = 'transform .62s cubic-bezier(.4,0,.2,1) ' + delay + 'ms, opacity .38s ease ' + (delay + 340) + 'ms';
          requestAnimationFrame(function () {
            card.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + sc.toFixed(3) + ')';
          });
        });
        setTimeout(function () { deckCard.classList.add('in'); }, delay + 500);   // real deck card fades up under it
        setTimeout(function () { card.style.opacity = '0'; }, delay + 460);
        setTimeout(function () { if (card.parentNode) card.parentNode.removeChild(card); }, delay + 820);
      });
    }

    /* ---- true morph: View Transitions ---- the browser snapshots each named
       floating card and its deck card and tweens between them (box + content).
       Root is excluded so the page animates live underneath, not frozen. */
    function foldViaViewTransition() {
      var plan = rested.map(function (rc, i) {
        var lemma = rc.word.dataset.w, name = 'ltw-' + lemma;
        rc.card.classList.remove('rested');             // stop the idle bob → a stable snapshot
        rc.card.style.animation = 'none';
        rc.card.style.viewTransitionName = name;
        return { card: rc.card, lemma: lemma, name: name, i: i };
      });

      /* scope the transition to the cards only, stagger each, and don't capture
         the root (so the live phase morph keeps playing behind the cards) */
      var st = document.getElementById('lt-vt-style');
      if (!st) { st = document.createElement('style'); st.id = 'lt-vt-style'; document.head.appendChild(st); }
      st.textContent =
        ':root{view-transition-name:none}' +
        '::view-transition-group(*){animation-duration:.6s;animation-timing-function:cubic-bezier(.33,0,.2,1)}' +
        plan.map(function (p) { return '::view-transition-group(' + p.name + '){animation-delay:' + (p.i * 65) + 'ms}'; }).join('');

      function cleanup() {
        plan.forEach(function (p) {
          var dc = window.Shelf.cardEl ? window.Shelf.cardEl(p.lemma) : null;
          if (dc) { dc.style.viewTransitionName = ''; dc.style.transition = ''; }
        });
        if (st && st.parentNode) st.parentNode.removeChild(st);
      }

      var vt;
      try {
        vt = document.startViewTransition(function () {
          plan.forEach(function (p) {
            var deckCard = window.Shelf.add(p.lemma, { preset: true });   // build (or fetch) the destination card
            if (deckCard) {
              deckCard.classList.remove('preset');
              deckCard.classList.add('in');
              deckCard.style.transition = 'none';                        // settle it instantly for the NEW snapshot
              deckCard.style.viewTransitionName = p.name;                // same name → morph target
            }
            if (p.card.parentNode) p.card.parentNode.removeChild(p.card); // floating card is gone in the NEW state
          });
          if (window.Shelf.reveal) window.Shelf.reveal();
        });
      } catch (e) { cleanup(); return; }
      vt.finished.then(cleanup, cleanup);
    }

    var foldRAF = 0;
    window.addEventListener('scroll', function () {
      if (folded || !rested.length) return;
      if (foldRAF) return;
      foldRAF = requestAnimationFrame(function () {
        foldRAF = 0;
        if (window.scrollY > hero.offsetHeight * 0.32) foldCardsToDeck();
      });
    }, { passive: true });

    /* mobile drives navigation by phase, not scroll: index.html's toP2() calls
       this so the screen-1 word cards MORPH (one continuous FLIP each) into the
       vocab strip — same card flying + shrinking to its deck slot, then the real
       deck card takes over underneath. No cross-fade, no blink. */
    window.HeroWords = {
      foldToDeck: function () { foldCardsToDeck(true); },
      finishDemo: finalizeDemo,            /* snap the cursor demo to its end-state (cursor gone, all 4 saved) */
      pending: function () { return !folded && rested.length > 0; }
    };

    // Save action — one button, two outcomes by screen:
    //   hero (P1)        → the word floats out as a big word-card
    //   any later screen → it flies straight into the "My vocab" deck
    function markSaved(w) { w.classList.add(w.classList.contains('hl') ? 'saved' : 'is-saved'); }
    function doSave(w) {
      var onHero = !document.body.classList.contains('hero-p2') &&
                   !document.body.classList.contains('hero-p3');
      if (onHero) { flyCard(w); return; }
      var lemma = w.dataset.w;
      if (window.Shelf && window.Shelf.has(lemma)) return;   // already in the deck
      if (window.flyWordToShelf) { window.flyWordToShelf(w.getBoundingClientRect(), lemma); markSaved(w); }
    }

    // ---- word popup: the lookup card from index.html's reading scenes
    //      (meaning · sound · CEFR · gloss · Save). Reuses the shared .popup styles. ----
    var popup = document.createElement('div');
    popup.className = 'popup hw-popup';
    popup.style.position = 'fixed';
    popup.style.zIndex = '300';
    document.body.appendChild(popup);
    var openWordEl = null;

    function renderPopup(lemma) {
      var d = DICT[lemma] || genDef(lemma);
      var saved = (window.Shelf && window.Shelf.has(lemma)) || (openWordEl && openWordEl.dataset.flown === '1');
      popup.innerHTML =
        '<div class="top"><div class="wl"><div class="w">' + d.w + '</div>' + (d.ph ? '<div class="ph">' + d.ph + '</div>' : '') + '</div>' +
        '<div class="ctrls"><span class="spk">' + ICON.spk + '</span><span class="cefr-b ' + d.cls + '">' + d.lvl + '</span><button class="close" aria-label="close">✕</button></div></div>' +
        (function(){ var tr = d['tr'+cap(LANG)] || d.trEn || d.tr || ''; return (tr && tr !== '···') ? '<div class="popup-tr"><span class="popup-tr-lbl">'+LANG.toUpperCase()+'</span>' + tr + '</div>' : ''; }()) +
        '<div class="save"><button class="savebtn ' + (saved ? 'saved' : '') + '" data-k="' + lemma + '"><span class="bk">' + ICON.bk + '</span><span class="ck">' + ICON.ck + '</span><span class="lbl">' + (saved ? 'Saved to deck' : 'Save word') + '</span></button></div>';
    }
    function placePopup(w) {
      var wr = w.getBoundingClientRect();
      popup.style.left = clampv(wr.left, 8, window.innerWidth - 294) + 'px';
      popup.style.transformOrigin = 'top left';
      popup.style.top = (wr.bottom + 10) + 'px';
      var ph = popup.offsetHeight;                       // flip above the word if it would spill off-screen
      if (wr.bottom + 10 + ph > window.innerHeight - 8) {
        popup.style.transformOrigin = 'bottom left';
        popup.style.top = Math.max(8, wr.top - ph - 10) + 'px';
      }
    }
    function openWord(w) {
      var lemma = w.dataset.w;
      var switching = openWordEl && openWordEl !== w && popup.classList.contains('show');
      if (openWordEl) openWordEl.classList.remove('active');
      openWordEl = w; w.classList.add('active');
      if (switching) {
        popup.classList.remove('show');
        setTimeout(function () { renderPopup(lemma); placePopup(w); requestAnimationFrame(function () { popup.classList.add('show'); }); }, 160);
      } else {
        renderPopup(lemma); placePopup(w);
        requestAnimationFrame(function () { popup.classList.add('show'); });
      }
    }
    function closePopup() { popup.classList.remove('show'); if (openWordEl) { openWordEl.classList.remove('active'); openWordEl = null; } }

    popup.addEventListener('click', function (e) {
      e.stopPropagation();
      if (e.target.closest('.close')) { closePopup(); return; }
      var spk = e.target.closest('.spk');
      if (spk) { spk.classList.remove('playing'); void spk.offsetWidth; spk.classList.add('playing'); return; }
      var btn = e.target.closest('.savebtn'); if (!btn) return;
      var lemma = btn.dataset.k;
      if (window.Shelf && window.Shelf.has(lemma)) return;
      if (openWordEl) doSave(openWordEl);
      btn.classList.add('saved');
      var lbl = btn.querySelector('.lbl'); if (lbl) lbl.textContent = 'Saved to deck';
      setTimeout(closePopup, 360);
    });
    document.addEventListener('click', function (e) {
      if (!popup.classList.contains('show')) return;
      if (popup.contains(e.target) || e.target.closest('.word') || e.target.closest('.hl')) return;
      closePopup();
    });

    function wireWord(w) {
      w.style.cursor = 'pointer';
      w.setAttribute('role', 'button');
      w.setAttribute('tabindex', '0');
      w.addEventListener('click', function (e) {
        e.stopPropagation();
        (openWordEl === w && popup.classList.contains('show')) ? closePopup() : openWord(w);
      });
      w.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWord(w); }
        else if (e.key === 'Escape') closePopup();
      });
    }

    // ---- make EVERY word in the article tappable (like index.html's reading scenes),
    //      not only the highlighted ones. Plain-text runs become .word spans; the .hl
    //      spans are left intact (the demo + their per-language gloss depend on them). ----
    function tokenizeWords(container) {
      if (!container) return [];
      var made = [];
      Array.prototype.slice.call(container.childNodes).forEach(function (node) {
        if (node.nodeType !== 3) return;                       // keep elements (.hl, the dot button) as-is
        var frag = document.createDocumentFragment();
        node.nodeValue.split(/(\s+)/).forEach(function (tok) {
          if (tok === '') return;
          if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
          var m = tok.match(/^([A-Za-z’'-]+)(.*)$/);      // word core + trailing punctuation
          if (!m) { frag.appendChild(document.createTextNode(tok)); return; }
          var s = document.createElement('span');
          s.className = 'word';
          s.dataset.w = m[1].toLowerCase();
          s.textContent = m[1];
          frag.appendChild(s);
          made.push(s);
          if (m[2]) frag.appendChild(document.createTextNode(m[2]));
        });
        container.replaceChild(frag, node);
      });
      return made;
    }

    var firstHl   = browser.querySelector('.hl');
    var mainPara  = firstHl ? firstHl.closest('p') : null;     // the article body paragraph
    var simpBody  = browser.querySelector('#hero-simp-body');  // the dense paragraph revealed in P2
    var extraWords = tokenizeWords(mainPara).concat(tokenizeWords(simpBody));

    words.concat(extraWords).forEach(wireWord);

    // ---- "Glosses in [XX]" secondary pill — appears after onboarding ----
    function buildPill() {
      var wrap = document.createElement('div');
      wrap.className = 'hw-lang';

      var order = SUP.slice();
      order.sort(function (a, b) { return (a === LANG ? -1 : 0) - (b === LANG ? -1 : 0); });
      var menu = order.map(function (code) {
        return '<button type="button" data-l="' + code + '" class="' + (code === LANG ? 'on' : '') + '">' +
          '<span>' + ENDONYM[code] + '</span><span class="code">' + code.toUpperCase() + '</span></button>';
      }).join('');

      wrap.innerHTML =
        '<span class="hw-lang-label">Glosses in</span>' +
        '<button type="button" class="hw-lang-pill" aria-haspopup="true">' +
          '<span class="hwl-code">' + LANG.toUpperCase() + '</span>' +
          '<svg class="hwl-car" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M6 9l6 6 6-6"/></svg></button>' +
        '<div class="hw-lang-menu">' + menu +
          '<div class="hw-lang-note">The article stays English — Lantern explains it in your language.</div></div>';
      var topbar = document.getElementById('topbar');
      var ctaPill = topbar && topbar.querySelector('.pill');
      if (ctaPill) topbar.insertBefore(wrap, ctaPill); else hero.appendChild(wrap);

      var pill = wrap.querySelector('.hw-lang-pill');
      var codeEl = wrap.querySelector('.hwl-code');
      pill.addEventListener('click', function (e) {
        e.stopPropagation();
        wrap.classList.toggle('open');
        wrap.classList.remove('pulse');
      });
      document.addEventListener('click', function () { wrap.classList.remove('open'); });
      Array.prototype.forEach.call(wrap.querySelectorAll('.hw-lang-menu button'), function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          changeLang(b.dataset.l);
          wrap.classList.remove('open');
        });
      });

      function changeLang(code) {
        if (code === LANG) return;
        LANG = code; persist(LANG);
        registerGloss();                       // refresh DICT + any live deck card to the new language
        codeEl.textContent = LANG.toUpperCase();
        Array.prototype.forEach.call(wrap.querySelectorAll('.hw-lang-menu button'), function (b) {
          b.classList.toggle('on', b.dataset.l === LANG);
        });
        rested.forEach(function (rc, i) {
          setTimeout(function () {
            var tr = rc.card.querySelector('.tr'); if (!tr) return;
            tr.style.opacity = '0';
            setTimeout(function () { tr.textContent = glossFor(rc.word); tr.style.opacity = '1'; }, 170);
          }, i * 120);
        });
        /* let the page react — Immersion re-renders the article into the new language live */
        try { window.dispatchEvent(new CustomEvent('lantern:gloss', { detail: code })); } catch (e) {}
      }
    }

    // ---- cursor demo ----
    function makeCursor() {
      var c = document.createElement('div');
      c.className = 'hw-cursor';
      c.innerHTML =
        '<span class="hwc-ico"><svg viewBox="0 0 24 24" width="25" height="25">' +
        '<path d="M3 2 L3 18.6 L7.3 14.6 L10.3 21 L13 19.8 L10 13.5 L16.2 13.5 Z" ' +
        'fill="#1a1714" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg></span>' +
        '<span class="hwc-ring"></span>';
      hero.appendChild(c);
      return c;
    }
    function cursorXY(word) {
      var hr = hero.getBoundingClientRect(), wr = word.getBoundingClientRect();
      return { x: wr.left + wr.width * 0.6 - hr.left, y: wr.top + wr.height * 0.62 - hr.top };
    }
    function placeCursor(c, word) {
      var p = cursorXY(word);
      c.style.transition = 'none';
      c.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)';
      void c.offsetWidth;
      c.style.transition = '';
    }
    function moveCursor(c, word) {
      var p = cursorXY(word);
      c.style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px)';
      c.classList.add('show');
    }
    function tap(c) { c.classList.remove('tap'); void c.offsetWidth; c.classList.add('tap'); }

    function demo() {
      if (demoDone) return;                  /* visitor already scrolled away → end-state is set */
      var c = MOBILE ? null : makeCursor();
      demoCursor = c;
      if (!MOBILE) placeCursor(c, words[0]);
      var t = MOBILE ? 300 : 450;
      words.forEach(function (w) {
        (function (word, start) {
          if (MOBILE) {
            demoTimers.push(setTimeout(function () { flyCard(word); }, start));
          } else {
            demoTimers.push(setTimeout(function () { moveCursor(c, word); }, start));
            demoTimers.push(setTimeout(function () { tap(c); flyCard(word); }, start + 600));
          }
        })(w, t);
        t += MOBILE ? 950 : 1450;
      });
      if (!MOBILE) demoTimers.push(setTimeout(function () { c.classList.add('gone'); }, t + 350));
      /* demo done → raise the hero's "Next: Save & Simplify" cue (desktop only;
         the pill is hidden under 920px, and showHomeNext no-ops off phase 0) */
      if (!MOBILE) demoTimers.push(setTimeout(function () {
        if (window._heroShowHomeNext) window._heroShowHomeNext();
      }, t + 650));
    }

    /* snap the cursor demo straight to its end-state — used when the visitor
       scrolls away before it finishes: cancel the pending cursor steps, fade the
       cursor out now, and rest a card for every word the cursor never reached, so
       the next screen shows all four saved words instead of a creeping cursor. */
    function finalizeDemo() {
      if (demoDone) return;
      demoDone = true;
      demoTimers.forEach(function (id) { clearTimeout(id); });
      demoTimers = [];
      if (demoCursor) {
        var dc = demoCursor; demoCursor = null;
        dc.classList.add('gone');
        setTimeout(function () { if (dc.parentNode) dc.parentNode.removeChild(dc); }, 420);
      }
      if (onboardEl) {                       /* scrolled past the onboarding prompt → dismiss it too */
        var ob = onboardEl; onboardEl = null;
        ob.classList.add('gone');
        setTimeout(function () { if (ob.parentNode) ob.parentNode.removeChild(ob); }, 420);
      }
      words.forEach(function (w) { if (!w.dataset.flown) restCard(w); });
    }

    // ---- onboarding card (new visitors only) ----
    function buildOnboard() {
      var LANGS = [
        { code: 'es', label: 'Español' },
        { code: 'fr', label: 'Français' },
        { code: 'de', label: 'Deutsch' },
        { code: 'uk', label: 'Українська' },
        { code: 'pt', label: 'Português' }
      ];

      var ob = document.createElement('div');
      ob.className = 'hw-onboard';
      ob.innerHTML =
        '<div class="hw-ob-title">See Lantern save a word</div>' +
        '<div class="hw-ob-sub">Pick your language — we\'ll show the translation</div>' +
        '<div class="hw-ob-langs">' +
        LANGS.map(function (l) {
          return '<button type="button" class="hw-ob-btn" data-lang="' + l.code + '">' + l.label + '</button>';
        }).join('') +
        '</div>' +
        '<button type="button" class="hw-ob-skip">or watch without translation</button>';
      hero.appendChild(ob);
      onboardEl = ob;

      function startDemo(code) {
        LANG = code;
        if (code !== 'en') persist(code);
        registerGloss();                       // seed the deck's gloss in the language just picked
        onboardEl = null;
        ob.classList.add('gone');
        setTimeout(function () { if (ob.parentNode) ob.parentNode.removeChild(ob); }, 600);
        buildPill();
        setTimeout(demo, 500);
      }

      Array.prototype.forEach.call(ob.querySelectorAll('.hw-ob-btn'), function (btn) {
        btn.addEventListener('click', function () { startDemo(btn.dataset.lang); });
      });
      ob.querySelector('.hw-ob-skip').addEventListener('click', function () {
        startDemo('en');
      });
    }

    // ---- cards scatter away from the "Send to yourself" button on hover/touch ----
    function attachScatter() {
      if (!MOBILE) return;
      var btn = hero.querySelector('.m-share-btn');
      if (!btn) return;
      function scatter(on) {
        if (!rested.length) return;
        var br = btn.getBoundingClientRect();
        var bcx = br.left + br.width / 2, bcy = br.top + br.height / 2;
        rested.forEach(function (rc) {
          var card = rc.card;
          if (on) {
            var cr = card.getBoundingClientRect();
            var dx = (cr.left + cr.width / 2) - bcx, dy = (cr.top + cr.height / 2) - bcy;
            var dist = Math.sqrt(dx * dx + dy * dy) || 1;
            var PUSH = 36;
            card.style.transition = 'transform 0.28s cubic-bezier(.2,.85,.25,1)';
            card.style.transform = 'translate(' + ((dx / dist * PUSH).toFixed(1)) + 'px,' + ((dy / dist * PUSH).toFixed(1)) + 'px)';
          } else {
            card.style.transition = 'transform 0.4s cubic-bezier(.4,0,.2,1)';
            card.style.transform = '';
          }
        });
      }
      btn.addEventListener('touchstart',  function () { scatter(true); },  { passive: true });
      btn.addEventListener('touchend',    function () { setTimeout(function () { scatter(false); }, 350); }, { passive: true });
      btn.addEventListener('touchcancel', function () { scatter(false); }, { passive: true });
      btn.addEventListener('mouseenter',  function () { scatter(true); });
      btn.addEventListener('mouseleave',  function () { scatter(false); });
    }

    // ---- reduced motion: static cards, no demo ----
    if (REDUCED) { words.forEach(restCard); return; }

    // mobile → static cards immediately, no auto-demo
    if (MOBILE) {
      words.forEach(restCard);
      buildPill();
      attachScatter();
      return;
    }

    /* desktop has no document scroll — leaving the hero is a body-class change.
       The instant we go past phase 1 (hero-p2…p5 appears), snap the cursor demo
       to its end: cursor fades out, every un-picked word rests its card. foldToDeck
       also finalizes, but this also catches a scroll in the first instant — before
       any card has flown, when pending() is still false and foldToDeck isn't called. */
    var pastHeroObs = new MutationObserver(function () {
      if (demoDone) { pastHeroObs.disconnect(); return; }
      if (/\bhero-p[2-5]\b/.test(document.body.className)) finalizeDemo();
    });
    pastHeroObs.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // returning visitor → auto-demo; new visitor → onboarding prompt
    if (saved()) {
      buildPill();
      if (window.whenFontsReady) window.whenFontsReady(function () { setTimeout(demo, 750); });
      else setTimeout(demo, 1600);
    } else {
      buildOnboard();
    }
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
