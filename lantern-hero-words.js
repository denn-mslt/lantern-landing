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

  function resolveLang() {
    var s = saved();
    if (s) return s;
    var navs = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < navs.length; i++) {
      var l = (navs[i] || '').slice(0, 2).toLowerCase();
      if (SUP.indexOf(l) >= 0) return l;
    }
    return 'en';
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

    var slots = MOBILE ? [
      { xp: 0.04, yp: 8,  rot: -5 },
      { xp: 0.20, yp: 18, rot: 2  },
      { xp: 0.36, yp: 10, rot: -2 },
      { xp: 0.52, yp: 22, rot: 6  }
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
      card.innerHTML =
        '<div class="wordcard" style="--rot:' + slot.rot + 'deg;width:' + (MOBILE ? 120 : 186) + 'px">' +
          '<div class="wtop"><span class="w">' + m.w + '</span>' +
          '<span class="cefr-b b-' + c + '">' + m.cefr + '</span></div>' +
          '<div class="ph">' + m.ph + '</div>' +
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
      card.style.transform = 'none';
      markSaved(word);
    }

    // ---- as the reader scrolls off the hero, the big floating cards fold neatly
    //      into the "My vocab" deck (each glides to its deck slot and shrinks in) ----
    var folded = false;
    function foldCardsToDeck() {
      if (folded || !rested.length) return;
      if (!window.Shelf || window.innerWidth < 1200) return;   // deck only docks on wide viewports
      folded = true;
      document.body.classList.add('vocab-on');                 // reveal the deck on the hero
      rested.forEach(function (rc, i) {
        var card = rc.card, lemma = rc.word.dataset.w, delay = i * 80;
        if (REDUCED) { if (!window.Shelf.has(lemma)) window.Shelf.add(lemma); if (card.parentNode) card.parentNode.removeChild(card); return; }
        var from = card.getBoundingClientRect();
        if (window.Shelf.has(lemma)) { if (card.parentNode) card.parentNode.removeChild(card); return; }
        var deckCard = window.Shelf.add(lemma, { preset: true });   // reserve its deck slot, invisible
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
        card.getBoundingClientRect();                          // commit the fixed start
        var sc = to.width / from.width;
        requestAnimationFrame(function () {
          card.style.transition = 'transform .62s cubic-bezier(.4,0,.2,1) ' + delay + 'ms, opacity .38s ease ' + (delay + 340) + 'ms';
          card.style.transform = 'translate(' + (to.left - from.left).toFixed(1) + 'px,' + (to.top - from.top).toFixed(1) + 'px) scale(' + sc.toFixed(3) + ')';
        });
        setTimeout(function () { deckCard.classList.add('in'); }, delay + 480);   // real deck card fades up under it
        setTimeout(function () { card.style.opacity = '0'; }, delay + 440);
        setTimeout(function () { if (card.parentNode) card.parentNode.removeChild(card); }, delay + 800);
      });
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
        '<hr />' + (d.syn ? '<div class="syn">' + d.syn + '</div>' : '') + '<div class="def">' + d.def + '</div>' + (d.ex ? '<div class="ex">' + boldEx(d.ex) + '</div>' : '') +
        (d.tr ? '<div class="popup-tr"><span class="popup-tr-lbl">UK</span>' + d.tr + '</div>' : '') +
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
      var c = MOBILE ? null : makeCursor();
      if (!MOBILE) placeCursor(c, words[0]);
      var t = MOBILE ? 300 : 450;
      words.forEach(function (w) {
        (function (word, start) {
          if (MOBILE) {
            setTimeout(function () { flyCard(word); }, start);
          } else {
            setTimeout(function () { moveCursor(c, word); }, start);
            setTimeout(function () { tap(c); flyCard(word); }, start + 600);
          }
        })(w, t);
        t += MOBILE ? 950 : 1450;
      });
      if (!MOBILE) setTimeout(function () { c.classList.add('gone'); }, t + 350);
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

      function startDemo(code) {
        LANG = code;
        if (code !== 'en') persist(code);
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

    // ---- reduced motion: static cards, no demo ----
    if (REDUCED) { words.forEach(restCard); return; }

    // mobile → skip onboarding card, just demo directly
    if (MOBILE) {
      buildPill();
      if (window.whenFontsReady) window.whenFontsReady(function () { setTimeout(demo, 900); });
      else setTimeout(demo, 1800);
      return;
    }

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
