/* ============================================================
   Lantern Landing v3 — Everywhere screen
   Replaces lantern-v3-act3.js; same section id (#finale).
   ============================================================ */
(function () {
  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ev      = document.getElementById('finale');
  if (!ev) return;
  var pages   = Array.from(ev.querySelectorAll('.pg'));
  var cue     = ev.querySelector('.ev-cue');
  var flame   = document.getElementById('flame');
  var ctaSect = document.getElementById('ev-close');
  var ctaBtn  = document.getElementById('close-cta') || document.querySelector('[data-cta]');
  var revealed = false, flaming = false;

  /* hide the persistent word deck while this screen is on stage */
  new IntersectionObserver(function (es) {
    es.forEach(function (e) { document.body.classList.toggle('ev-active', e.isIntersecting); });
  }, { threshold: 0.4 }).observe(ev);

  /* ── ONE window splits into the wall ──
        Continuity, not a new screen: the six cards start perfectly stacked on a
        single centred footprint, so only the top one shows — it reads as one
        browser window. After a beat it divides: every card flies out and shrinks
        to its slot. One window → six pages. ── */
  function reveal() {
    if (revealed) return;
    revealed = true;
    if (REDUCED) { pages.forEach(function (p) { p.classList.add('in'); }); if (cue) cue.classList.add('in'); return; }

    var wall = ev.querySelector('.ev-wall');
    var n = pages.length;

    /* freeze the bob so the stacked window is rock-steady while we measure + split */
    ev.classList.add('ev-splitting');

    /* measure each card's true resting slot (neutralise the base translateY/scale) */
    pages.forEach(function (p) { p.style.transition = 'none'; p.style.transform = 'none'; p.style.opacity = '1'; });
    void wall.offsetWidth;
    var wr  = wall.getBoundingClientRect();
    var mcx = wr.left + wr.width / 2, mcy = wr.top + wr.height / 2;
    var S   = 1.6;                                   // the single window ≈ 1.6× a card

    /* collapse every card onto one centred footprint → looks like a single window */
    var inits = pages.map(function (p) {
      var r  = p.getBoundingClientRect();
      var tx = mcx - (r.left + r.width  / 2);
      var ty = mcy - (r.top  + r.height / 2);
      return 'translate(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px) scale(' + S + ')';
    });
    pages.forEach(function (p, k) {
      p.style.transform = inits[k];
      p.parentNode.style.zIndex = String(20 + (n - k));   // first card on top = the visible window
    });
    void wall.offsetWidth;                                 // commit the joined-window frame (no flash)

    /* hold the single window, then split: each card flies + shrinks to its slot.
       tight stagger + long travel → reads as one window dividing, not a deal */
    var HOLD = 360, STEP = 64, DEAL = 700;
    pages.forEach(function (p, k) {
      setTimeout(function () {
        p.style.transition = 'transform ' + DEAL + 'ms cubic-bezier(.22,.7,.24,1)';
        p.classList.add('in');
        p.style.transform = '';                            // → resting slot; animates the shrink+fly out
      }, HOLD + k * STEP);
    });

    var done = HOLD + (n - 1) * STEP + DEAL;
    setTimeout(function () {
      pages.forEach(function (p) { p.style.transition = ''; p.style.opacity = ''; p.parentNode.style.zIndex = ''; });
      ev.classList.remove('ev-splitting');                 // bob resumes
      // startSimplifyCascade();                           // auto-cascade disabled: hover only down to your level
    }, done + 80);
    setTimeout(function () { if (cue) cue.classList.add('in'); }, HOLD + n * STEP + 240);
  }
  /* Auto-reveal only in the SCROLL model (index.html: #finale is a real section).
     In the one-screen model (main.html) #finale is a fixed overlay that always
     intersects the viewport — the auto-reveal would fire at load and consume the
     window-split before you ever reach Practice. There, morphFromWindow (phase
     5→6) owns the reveal: it IS the one-window-into-six split. */
  if (ev.hasAttribute('data-sect')) {
    new IntersectionObserver(function (es, obs) {
      if (es[0].isIntersecting) { reveal(); obs.disconnect(); }
    }, { threshold: 0.3 }).observe(ev);
    if (ev.getBoundingClientRect().top < innerHeight * 0.95) reveal();
  }

  /* ── CROSS-SCREEN MORPHS — fast, three beats ──
        Practice ⇄ Everywhere:
        1. CORNERS: the window's content washes to blank, corners soften, hairline
           cracks split it into six pieces — all in one quick breath.
        2. STRETCH: still in formation, every piece stretches out to mini-browser
           size and the media article surfaces on it.
        3. GO: the six pages scatter to their slots.
        UP runs the film backwards: gather → shrink to tiles, articles wash off →
        corners square, the slab dresses back into the browser window. ── */
  var morphing = false;
  var GAP = 3;                                       /* crack half-gap, px */

  /* one shard = a fixed white piece clipping three layers:
     the window's own pixels (washes out) → blank white cover → the article (surfaces) */
  function buildShard(srcWin, sr, pg, cardW, col, row, tw, th, z) {
    var wrap = document.createElement('div');
    wrap.className = 'ev-shard';
    wrap.style.cssText = 'position:fixed;left:0;top:0;overflow:hidden;pointer-events:none;background:#fff;will-change:transform,width,height;z-index:' + z;
    var win = srcWin.cloneNode(true);
    /* this tile's slice of the live window (inline size: outside #hero the base
       .browser max-width cap would shrink it) */
    win.style.cssText += ';position:absolute;left:' + (-col * tw).toFixed(1) + 'px;top:' + (-row * th).toFixed(1) + 'px;' +
      'width:' + sr.width + 'px;height:' + sr.height + 'px;max-width:none;margin:0;transform:none;box-shadow:none';
    var cover = document.createElement('div');
    cover.style.cssText = 'position:absolute;inset:0;background:#fff;opacity:0';
    var card = pg.cloneNode(true);
    card.classList.add('in');
    card.style.cssText += ';position:absolute;left:0;top:0;width:' + cardW + 'px;margin:0;transform:none;box-shadow:none;opacity:0';
    wrap.appendChild(win); wrap.appendChild(cover); wrap.appendChild(card);
    document.body.appendChild(wrap);
    return { wrap: wrap, win: win, cover: cover, card: card };
  }
  function setShard(it, x, y, w, h, rad, shAlpha, coverOp, cardOp) {
    it.wrap.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    it.wrap.style.width  = w.toFixed(1) + 'px';
    it.wrap.style.height = h.toFixed(1) + 'px';
    it.wrap.style.borderRadius = rad.toFixed(1) + 'px';
    it.wrap.style.boxShadow = '0 22px 46px -26px rgba(26,23,20,' + shAlpha.toFixed(3) + ')';
    it.cover.style.opacity = coverOp.toFixed(3);
    it.card.style.opacity  = cardOp.toFixed(3);
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* ONE continuous timeline per shard — corners, stretch and flight are
     segments of a single path under a single global ease, so the motion never
     stops between beats: it breathes in, flows and settles. s runs 0 (window)
     → 1 (wall); the reverse direction just evaluates the same film at 1−s. */
  var SEG1 = 0.10, SEG2 = 0.30;                      /* path shares: crack / stretch / flight */
  function shardAt(it, s) {
    var x, y, w, h, u;
    if (s < SEG1) {                                  /* corners + crack open */
      u = s / SEG1;
      x = it.tx + (it.cx - it.tx) * u; y = it.ty + (it.cy - it.ty) * u;
      w = it.tw + (it.cw - it.tw) * u; h = it.th + (it.ch - it.th) * u;
    } else if (s < SEG1 + SEG2) {                    /* stretch to mini-browser size */
      u = (s - SEG1) / SEG2;
      x = it.cx + (it.mx - it.cx) * u; y = it.cy + (it.my - it.cy) * u;
      w = it.cw + (it.sw - it.cw) * u; h = it.ch + (it.sh - it.ch) * u;
    } else {                                         /* flight to the slot */
      u = (s - SEG1 - SEG2) / (1 - SEG1 - SEG2);
      x = it.mx + (it.sx - it.mx) * u; y = it.my + (it.sy - it.my) * u;
      w = it.sw; h = it.sh;
    }
    setShard(it, x, y, w, h,
      16  * clamp01(s / 0.35),                       /* corners soften early */
      0.5 * clamp01(s / 0.35),                       /* shadow lifts with them */
      clamp01(s / 0.10),                             /* content washes out in the first beat */
      clamp01((s - 0.16) / 0.24));                   /* the article surfaces as it stretches */
  }
  function runShatter(items, TOTAL, fwd, onDone) {
    var t0 = performance.now();
    function frame(now) {
      var live = false;
      items.forEach(function (it) {
        var t = (now - t0 - it.dly) / TOTAL;
        if (t < 0) { live = true; return; }
        var p = Math.min(t, 1);
        if (p < 1) live = true;
        var e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;   /* easeInOutCubic — the CTA curve */
        shardAt(it, fwd ? e : 1 - e);
      });
      if (live) { requestAnimationFrame(frame); return; }
      onDone();
    }
    requestAnimationFrame(frame);
  }

  /* scaffold: measure, build six shards, hide the live originals (same frame —
     the assembled shards are pixel-identical to the window / the wall) */
  function buildShatter(srcWin, fwd) {
    var sr = srcWin.getBoundingClientRect();
    var tw = sr.width / 3, th = sr.height / 2;
    /* PAUSE the wall's bob (hold the current value — NOT reset, so no jump) so the
       slot we measure now == where the real card sits at hand-off. Resumed, from
       the same phase, when the morph ends → the bob carries on without a skip. */
    pages.forEach(function (p) { if (p.parentNode) p.parentNode.style.animationPlayState = 'paused'; p.style.transition = 'none'; p.style.transform = 'none'; });
    void ev.offsetWidth;
    var cardW = pages[0].getBoundingClientRect().width;
    var items = pages.map(function (pg, i) {
      var col = i % 3, row = (i / 3) | 0;
      var r  = pg.getBoundingClientRect();
      var it = buildShard(srcWin, sr, pg, cardW, col, row, tw, th, 1200 + i);
      /* exact tile → cracked tile → mid (card-sized, centred on its tile) → slot */
      it.tx = sr.left + col * tw; it.ty = sr.top + row * th; it.tw = tw; it.th = th;
      it.cx = it.tx + GAP; it.cy = it.ty + GAP; it.cw = tw - 2 * GAP; it.ch = th - 2 * GAP;
      it.sw = r.width; it.sh = r.height;
      it.mx = it.tx + tw / 2 - r.width / 2; it.my = it.ty + th / 2 - r.height / 2;
      it.sx = r.left; it.sy = r.top;
      /* gathering runs in reverse order: first-out is last-home */
      it.dly = (fwd ? i : (pages.length - 1 - i)) * 70;
      if (fwd) setShard(it, it.tx, it.ty, tw, th, 0, 0, 0, 0);            /* == the window */
      else     setShard(it, it.sx, it.sy, it.sw, it.sh, 16, 0.5, 1, 1);   /* == the wall cards */
      return it;
    });
    srcWin.style.visibility = 'hidden';
    pages.forEach(function (p) { p.style.visibility = 'hidden'; });
    return items;
  }

  /* Practice → Everywhere: wash out → crack → tear into the six articles */
  function morphFromWindow(srcWin) {
    if (morphing) return;                            /* in flight — let it finish */
    if (REDUCED || innerWidth < 980 || pages.length !== 6 || !srcWin || revealed) {
      revealed = true;
      pages.forEach(function (p) { p.classList.add('in'); p.style.visibility = ''; });
      if (cue) cue.classList.add('in');
      return;
    }
    morphing = true; revealed = true;
    var items = buildShatter(srcWin, true);
    runShatter(items, 1250, true, function () {
      /* same frame: reveal the real cards exactly where the shards landed and
         resume the bob from its paused phase → no skip, no jump.
         transition is on TRANSFORM only — so opacity still snaps in (no fade),
         but if the cursor is over a card the .pg.in:hover scale(1.05) eases in
         instead of popping the size the instant the piece hands off. */
      pages.forEach(function (p) {
        p.style.transition = 'transform .32s cubic-bezier(.22,.61,.36,1),box-shadow .32s ease,border-color .32s ease';
        p.classList.add('in'); p.style.visibility = ''; p.style.transform = ''; p.style.opacity = '';
        if (p.parentNode) p.parentNode.style.animationPlayState = '';
      });
      items.forEach(function (it) { it.wrap.remove(); });
      srcWin.style.visibility = '';
      if (cue) cue.classList.add('in');
      requestAnimationFrame(function () { pages.forEach(function (p) { p.style.transition = ''; }); });
      morphing = false;
      // startSimplifyCascade();                        /* auto-cascade disabled: hover onlyes down to your level */
    });
  }

  /* Everywhere → Practice: the articles wash off the flying pieces, the cracks
     close, the blank slab dresses back into the window. done() fires when the
     window is whole; the shards keep masking until the hero has faded back in,
     then the shatter is re-armed (it plays again on the next scroll down). */
  function morphToWindow(srcWin, done) {
    if (morphing) return;                            /* in flight — let it finish */
    if (REDUCED || innerWidth < 980 || pages.length !== 6 || !srcWin || !revealed) {
      revealed = false;
      if (done) done();
      return;
    }
    morphing = true;
    var items = buildShatter(srcWin, false);
    runShatter(items, 1250, false, function () {
      if (done) done();                              /* caller restores the hero phase (ph-ev off, toP5) */
      /* the caller's path unhides the wall (backToWall) — re-hide it for the overlay fade-out */
      pages.forEach(function (p) { p.style.visibility = 'hidden'; });
      setTimeout(function () {                       /* hero has faded back in under the closed window */
        srcWin.style.visibility = '';
        items.forEach(function (it) { it.wrap.remove(); });
        pages.forEach(function (p) { p.style.visibility = ''; p.style.transition = ''; p.classList.remove('in'); if (p.parentNode) p.parentNode.style.animationPlayState = ''; });
        if (cue) cue.classList.remove('in');
        revealed = false; morphing = false;          /* re-armed: it plays again next time */
      }, 620);
    });
  }
  window.LanternEverywhere = {
    morphFromWindow: morphFromWindow, morphToWindow: morphToWindow,
    toCTA: toCTA, backToWall: backToWall,
    busy: function () { return morphing; }
  };

  /* ── lock stack height so rewrite never grows the card ── */
  function reserveHeights() {
    pages.forEach(function (pg) {
      var stack = pg.querySelector('.pg-stack');
      var easy  = pg.querySelector('.t-easy');
      var txt   = easy.getAttribute('data-text') || '';
      var done  = pg.dataset.done;
      if (!done) easy.textContent = txt;
      stack.style.minHeight = '0px';
      stack.style.minHeight = stack.offsetHeight + 'px';
      if (!done) easy.textContent = '';
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(reserveHeights);
  setTimeout(reserveHeights, 400);
  var rzT;
  addEventListener('resize', function () { clearTimeout(rzT); rzT = setTimeout(reserveHeights, 150); });

  /* ── hover → typewrite the plain text in, amber tint fades in (once per card) ── */
  /* the reading-level badge ticks from its hard level (C1/C2) down to your
     level (the data-easy A2/B1/B2) as the card simplifies */
  function morphBadge(pg) {
    var badge = pg.querySelector('.pg-cefr');
    if (!badge) return;
    var lv = badge.getAttribute('data-easy');
    if (lv) badge.textContent = lv;
    badge.classList.remove('morph'); void badge.offsetWidth; badge.classList.add('morph');
  }
  function rewriteCard(pg) {
    if (pg.dataset.done) return;
    pg.dataset.done = '1';
    var easy = pg.querySelector('.t-easy');
    var txt  = easy.getAttribute('data-text') || '';
    if (REDUCED) { easy.textContent = txt; pg.classList.add('rewritten'); morphBadge(pg); return; }
    pg.classList.add('rewriting');
    morphBadge(pg);
    easy.classList.add('typing');
    easy.textContent = '';
    var dur = Math.min(900, 240 + txt.length * 10), t0 = performance.now();
    var shown = -1;
    function type(now) {
      var p = Math.min((now - t0) / dur, 1);
      var n = Math.floor(p * txt.length);
      if (n !== shown) { easy.textContent = txt.slice(0, n); shown = n; }
      if (p < 1) { requestAnimationFrame(type); return; }
      easy.textContent = txt;
      easy.classList.remove('typing');
      pg.classList.add('rewritten');
    }
    requestAnimationFrame(type);
  }

  /* ── chaotic auto-simplify: once the six cards have landed, each one rewrites
     itself (text + level badge C1/C2 → A2/B1/B2) at its own staggered, jittered
     beat — so the whole wall ripples down to your level, never in lockstep ── */
  var cascaded = false;
  function startSimplifyCascade() {
    if (cascaded) return; cascaded = true;
    pages.forEach(function (p, k) {
      var delay = 650 + k * 320 + Math.floor(Math.random() * 1000);   // staggered + jittered
      setTimeout(function () { rewriteCard(p); }, delay);
    });
  }

  /* ── hover: nudge neighbours away from the focused card ── */
  var hovered = null;
  function layout() {
    pages.forEach(function (pg) {
      if (!hovered || pg === hovered) { pg.style.transform = ''; return; }
      var a = hovered.getBoundingClientRect(), b = pg.getBoundingClientRect();
      var dx = (b.left + b.width  / 2) - (a.left + a.width  / 2);
      var dy = (b.top  + b.height / 2) - (a.top  + a.height / 2);
      var d  = Math.hypot(dx, dy) || 1, push = 18;
      pg.style.transform = 'translate(' + (dx / d * push).toFixed(1) + 'px,' + (dy / d * push).toFixed(1) + 'px)';
    });
  }
  pages.forEach(function (pg) {
    pg.addEventListener('mouseenter', function () { rewriteCard(pg); if (!REDUCED) { hovered = pg; layout(); } });
    pg.addEventListener('mouseleave', function () { if (hovered === pg) { hovered = null; layout(); } });
    pg.addEventListener('focusin',   function () { rewriteCard(pg); });
  });

  /* ── advance to the CTA (phase 6): the six article cards FLY from the wall and
        FLIP into the feature mini-cards docked around the install button — in
        place, no scroll. #ev-close (ph-cta) is an overlay in this same viewport;
        the fixed flip-clones mask the overlay swap. ──
        finale order: bbc, reddit, wiki, arxiv, atlantic, youtube
        → dock slots: Save, Translate, Simplify, Exercises, Discuss, Immerse */
  var FLIP_MAP = [0, 2, 1, 4, 3, 5];
  var docked = false;

  function hideWall() { pages.forEach(function (p) { p.style.visibility = 'hidden'; }); }
  function backToWall() { document.body.classList.remove('ph-cta'); pages.forEach(function (p) { p.style.visibility = ''; }); }

  function toCTA() {
    if (flaming || morphing) return;
    var LC = window.LanternCharge;
    /* phones (≤920): the SAME card-flip as desktop, vertical layout. The wall's
       six articles flip over and become the dock pills around the share button.
       The 921–979 tablet gap keeps the plain "Add to Chrome" (no dock grid). */
    if (innerWidth < 980) {
      var built = !!(LC && LC.armed && LC.armed());
      /* the flip only the FIRST time, and only when arriving from the live wall
         (a scrubber tap can jump straight here from any phase — then the wall was
         never split, so there's nothing to flip: fall back to the plain dock) */
      if (!REDUCED && innerWidth <= 920 && LC && LC.slotsMobile && pages.length === 6 && revealed && !built) {
        toCTAmobile(LC); return;
      }
      document.body.classList.add('ph-cta');
      if (innerWidth <= 920 && LC) {
        if (!built && LC.buildMobile) LC.buildMobile();   /* direct arrival → plain dock */
        hideWall();                                       /* show the docked cards, hide any wall */
      }
      return;
    }
    if (REDUCED || !LC || pages.length !== 6) {
      document.body.classList.add('ph-cta');
      return;
    }
    /* already played once → just swap the overlay back in, no re-flip */
    if (docked) { document.body.classList.add('ph-cta'); hideWall(); return; }
    docked = true; flaming = true;
    LC.takeOver();                                   /* stop the auto-arm */

    /* clone each article at its current wall spot — fixed survives the overlay swap */
    var clones = pages.map(function (pg) {
      var r = pg.getBoundingClientRect();
      var wrap  = document.createElement('div'); wrap.className = 'flip-clone';
      var rot   = document.createElement('div'); rot.className = 'fc-rot';
      var front = document.createElement('div'); front.className = 'fc-front';
      var back  = document.createElement('div'); back.className = 'fc-back';
      var pgc = pg.cloneNode(true); pgc.style.transform = ''; pgc.style.opacity = '';
      front.appendChild(pgc);
      rot.appendChild(front); rot.appendChild(back);
      wrap.appendChild(rot);
      document.body.appendChild(wrap);
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      wrap.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      return { wrap: wrap, rot: rot, back: back, cx: cx, cy: cy, tx: cx, ty: cy };
    });
    hideWall();                                      /* no double under clones */

    document.body.classList.add('ph-cta');           /* swap overlays in place; clones mask it */

    requestAnimationFrame(function () {
      var slots = LC.slots();
      if (slots.length !== 6) {                       /* safety: bail to a clean docked state */
        clones.forEach(function (c) { c.wrap.remove(); });
        LC.armDocked(); flaming = false; return;
      }
      clones.forEach(function (c, i) {
        var s = slots[FLIP_MAP[i]];
        c.back.innerHTML = '<div class="dk-card snap in ' + s.side + '" style="width:198px;--fc:' + s.color + '">' + s.html + '</div>';
        c.tx = s.cx; c.ty = s.cy;
      });

      var DUR = 820, t0 = performance.now();
      function step(now) {
        var p = Math.min((now - t0) / DUR, 1);
        var e2 = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;   /* easeInOutCubic */
        clones.forEach(function (c) {
          c.wrap.style.transform = 'translate(' + (c.cx + (c.tx - c.cx) * e2) + 'px,' + (c.cy + (c.ty - c.cy) * e2) + 'px)';
          c.rot.style.transform  = 'rotateY(' + (180 * e2) + 'deg)';
        });
        if (p < 1) { requestAnimationFrame(step); return; }
        LC.armDocked();                               /* real cards take the slots, wires + beads fire */
        clones.forEach(function (c) { c.wrap.remove(); });
        flaming = false;
      }
      requestAnimationFrame(step);
    });
  }

  /* ── mobile twin of the flip: same mechanic, vertical dock ──
        The wall is a 2-col grid; the dock is a 3-col grid around the share
        button. We clone each article at its wall spot, build the dock with its
        cards held hidden, measure the slots, then fly + flip every clone onto
        its slot. On land the real cards reveal in place and the wires fire. ── */
  function toCTAmobile(LC) {
    docked = true; flaming = true;
    if (LC.takeOver) LC.takeOver();

    var clones = pages.map(function (pg) {
      var r = pg.getBoundingClientRect();
      var wrap  = document.createElement('div'); wrap.className = 'flip-clone m-flip';
      var rot   = document.createElement('div'); rot.className = 'fc-rot';
      var front = document.createElement('div'); front.className = 'fc-front';
      var back  = document.createElement('div'); back.className = 'fc-back';
      var pgc = pg.cloneNode(true); pgc.style.transform = ''; pgc.style.opacity = '';
      front.appendChild(pgc);
      rot.appendChild(front); rot.appendChild(back);
      wrap.appendChild(rot);
      document.body.appendChild(wrap);
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      wrap.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      return { wrap: wrap, rot: rot, back: back, cx: cx, cy: cy, tx: cx, ty: cy };
    });
    hideWall();
    document.body.classList.add('ph-cta');

    requestAnimationFrame(function () {
      var slots = LC.slotsMobile();
      if (!slots || slots.length !== 6) {                 /* safety: snap to a clean docked state */
        clones.forEach(function (c) { c.wrap.remove(); });
        if (LC.armDockedMobile) LC.armDockedMobile();
        flaming = false; return;
      }
      clones.forEach(function (c, i) {
        var s = slots[FLIP_MAP[i]];
        c.back.innerHTML = '<div class="dk-card snap in ' + s.side + '" style="width:' + s.w.toFixed(1) + 'px;--fc:' + s.color + '">' + s.html + '</div>';
        c.tx = s.cx; c.ty = s.cy;
      });

      var DUR = 760, t0 = performance.now();
      function step(now) {
        var p = Math.min((now - t0) / DUR, 1);
        var e2 = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;   /* easeInOutCubic */
        clones.forEach(function (c) {
          c.wrap.style.transform = 'translate(' + (c.cx + (c.tx - c.cx) * e2) + 'px,' + (c.cy + (c.ty - c.cy) * e2) + 'px)';
          c.rot.style.transform  = 'rotateY(' + (180 * e2) + 'deg)';
        });
        if (p < 1) { requestAnimationFrame(step); return; }
        if (LC.armDockedMobile) LC.armDockedMobile();     /* real cards reveal, wires + beads fire */
        clones.forEach(function (c) { c.wrap.remove(); });
        flaming = false;
      }
      requestAnimationFrame(step);
    });
  }
  ev.addEventListener('click', function () { toCTA(); });
})();
