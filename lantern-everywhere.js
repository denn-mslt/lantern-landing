/* ============================================================
   Lantern Landing v3 — Everywhere screen
   Replaces lantern-v3-act3.js; same section id (#finale).
   ============================================================ */
(function () {
  var REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ev      = document.getElementById('finale');
  if (!ev) return;
  var pages   = Array.from(ev.querySelectorAll('.pg'));
  /* seed each level badge's data-lv from its starting (hard) level so the
     per-level colour applies before any simplify; morphBadge updates it later */
  pages.forEach(function (pg) {
    var b = pg.querySelector('.pg-cefr');
    if (b && !b.getAttribute('data-lv')) b.setAttribute('data-lv', (b.textContent || '').trim());
  });
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

  /* ── bob hand-off ────────────────────────────────────────────────────────
     pgbob now begins + ends each loop at the card's flow position (keyframe 0%
     == identity, a zero-velocity ease-in-out stop). So a card the morph lands
     ON its exact slot can hand straight into the float with no seam:
       parkBob   — forward morphs: the wall is still hidden, so reset the float
                   to identity (== where the shards land + are measured). Invisible.
       holdBob   — reverse morph: the wall is on screen, so just freeze the
                   current phase (resetting here would pop the visible cards).
       startBob  — hand-off: RESTART pgbob from phase 0. It eases up off the rest
                   the shard settled on — no positional pop, no velocity yank. */
  function parkBob(p)  { var f = p.parentNode; if (f) f.style.animation = 'none'; }
  function holdBob(p)  { var f = p.parentNode; if (f) f.style.animationPlayState = 'paused'; }
  function startBob(p) { var f = p.parentNode; if (f) { f.style.animation = ''; f.style.animationPlayState = ''; } }

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
    /* Park the wall's bob so the slot we measure now == where the card lands.
       Forward (into the wall, hidden): reset to identity so the hand-off can
       restart the float from phase 0 and ease up off the rest with no seam.
       Reverse (off the visible wall): only freeze the current phase — resetting
       would pop the on-screen cards. */
    pages.forEach(function (p) { (fwd ? parkBob : holdBob)(p); p.style.transition = 'none'; p.style.transform = 'none'; });
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
      /* touch can't hover, so the signature "the whole web simplifies to your
         level" moment runs itself on phones: each card ripples its CEFR badge
         down (C1/C2 -> A2/B1/B2) + tints, staggered, once the wall has landed. */
      if (innerWidth <= 920 && !REDUCED) setTimeout(startSimplifyCascade, 480);
      return;
    }
    morphing = true; revealed = true;
    var items = buildShatter(srcWin, true);
    runShatter(items, 1250, true, function () {
      /* same frame: reveal the real cards exactly where the shards landed, then
         restart the float from rest (startBob) → it eases up off the slot, no
         seam where the shard's dead stop hands to the drift.
         transition is on TRANSFORM only — so opacity still snaps in (no fade),
         but if the cursor is over a card the .pg.in:hover scale(1.05) eases in
         instead of popping the size the instant the piece hands off. */
      pages.forEach(function (p) {
        p.style.transition = 'transform .32s cubic-bezier(.22,.61,.36,1),box-shadow .32s ease,border-color .32s ease';
        p.classList.add('in'); p.style.visibility = ''; p.style.transform = ''; p.style.opacity = '';
        startBob(p);                                      /* restart pgbob from rest → seamless */
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
        pages.forEach(function (p) { p.style.visibility = ''; p.style.transition = ''; p.classList.remove('in'); startBob(p); });
        if (cue) cue.classList.remove('in');
        revealed = false; morphing = false;          /* re-armed: it plays again next time */
      }, 620);
    });
  }
  /* Discuss → Everywhere: the chat panel itself CRACKS into six pieces and each
     piece flies to a card slot — the same shatter morphFromWindow runs, but
     seeded from the chat panel instead of the browser window. The chat body
     STAYS VISIBLE on the six shards through the crack + stretch; the article
     only surfaces (opaque card crossfading up, no blank-white phase) during the
     stretch, so it reads as "the chat divides and each piece becomes a page" —
     never "the chat disappears". dockClone + dr captured BEFORE leaveDiscuss(). */
  var DSEG1 = 0.16, DSEG2 = 0.30;                    /* crack / stretch / flight shares */

  function buildDockShard(dockClone, dr, pg, col, row, tw, th, z) {
    var wrap = document.createElement('div');
    wrap.className = 'ev-shard';
    /* no border: under the global *{box-sizing:border-box} a 1px border would
       inset the sliced chat by 1px per tile and the seams wouldn't line up. The
       GAP between tiles + the shadow lift carry the "cracked into six" read. */
    wrap.style.cssText = 'position:fixed;left:0;top:0;box-sizing:border-box;overflow:hidden;pointer-events:none;background:#fff;will-change:transform,width,height;z-index:' + z;
    /* the chat panel, sliced: this tile shows its (col,row) quadrant of the chat */
    var chat = dockClone.cloneNode(true);
    chat.removeAttribute('id');
    chat.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
    chat.style.cssText = 'position:absolute;left:' + (-col * tw).toFixed(1) + 'px;top:' + (-row * th).toFixed(1) + 'px;' +
      'width:' + dr.width.toFixed(1) + 'px;height:' + dr.height.toFixed(1) + 'px;margin:0;transform:none;opacity:1;transition:none;' +
      'background:#fff;display:flex;flex-direction:column;overflow:hidden;border-radius:0;box-shadow:none';
    /* the article card that this piece becomes — fades up opaque over the chat */
    var card = pg.cloneNode(true);
    card.classList.add('in');
    card.style.cssText += ';position:absolute;left:0;top:0;width:' + pg.getBoundingClientRect().width.toFixed(1) + 'px;margin:0;transform:none;box-shadow:none;opacity:0';
    wrap.appendChild(chat); wrap.appendChild(card);
    document.body.appendChild(wrap);
    return { wrap: wrap, chat: chat, card: card };
  }
  function setDockShard(it, x, y, w, h, rad, shAlpha, cardOp) {
    it.wrap.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    it.wrap.style.width  = w.toFixed(1) + 'px';
    it.wrap.style.height = h.toFixed(1) + 'px';
    it.wrap.style.borderRadius = rad.toFixed(1) + 'px';
    it.wrap.style.boxShadow = '0 22px 46px -26px rgba(26,23,20,' + shAlpha.toFixed(3) + ')';
    it.card.style.opacity = cardOp.toFixed(3);
  }
  function dockShardAt(it, s) {
    var x, y, w, h, u;
    if (s < DSEG1) {                                 /* crack: the chat splits into six tiles */
      u = s / DSEG1;
      x = it.tx + (it.cx - it.tx) * u; y = it.ty + (it.cy - it.ty) * u;
      w = it.tw + (it.cw - it.tw) * u; h = it.th + (it.ch - it.th) * u;
    } else if (s < DSEG1 + DSEG2) {                  /* stretch: each tile grows to card size */
      u = (s - DSEG1) / DSEG2;
      x = it.cx + (it.mx - it.cx) * u; y = it.cy + (it.my - it.cy) * u;
      w = it.cw + (it.sw - it.cw) * u; h = it.ch + (it.sh - it.ch) * u;
    } else {                                         /* flight: pieces scatter to their slots */
      u = (s - DSEG1 - DSEG2) / (1 - DSEG1 - DSEG2);
      x = it.mx + (it.sx - it.mx) * u; y = it.my + (it.sy - it.my) * u;
      w = it.sw; h = it.sh;
    }
    /* corners round + shadow lift as it leaves the panel; the article card
       crossfades up DURING the stretch (chat stays solid underneath until the
       opaque card fully covers it — no blank-white frame, no early vanish) */
    setDockShard(it, x, y, w, h,
      16 * clamp01((s - DSEG1) / DSEG2),
      0.5 * clamp01(s / 0.30),
      clamp01((s - DSEG1 - 0.04) / (DSEG2 - 0.02)));
  }

  function morphFromDock(dockClone, dr, srcWin) {
    if (morphing) return;
    if (REDUCED || innerWidth < 980 || pages.length !== 6 || revealed) {
      revealed = true;
      pages.forEach(function (p) { p.classList.add('in'); p.style.visibility = ''; });
      if (cue) cue.classList.add('in');
      return;
    }
    morphing = true; revealed = true;
    /* the browser window stays as-is — it fades out with the hero (ph-ev). Only
       the chat is morphed; force-hiding the window here would pop it away. */

    /* park bob at identity, measure each card's true resting slot, hide originals */
    pages.forEach(function (p) {
      parkBob(p);
      p.style.transition = 'none'; p.style.transform = 'none';
    });
    void ev.offsetWidth;

    var tw = dr.width / 3, th = dr.height / 2;
    var items = pages.map(function (pg, i) {
      var col = i % 3, row = (i / 3) | 0;
      var r  = pg.getBoundingClientRect();
      var it = buildDockShard(dockClone, dr, pg, col, row, tw, th, 1200 + i);
      it.tx = dr.left + col * tw; it.ty = dr.top + row * th; it.tw = tw; it.th = th;
      it.cx = it.tx + GAP; it.cy = it.ty + GAP; it.cw = tw - 2 * GAP; it.ch = th - 2 * GAP;
      it.sw = r.width; it.sh = r.height;
      it.mx = it.tx + tw / 2 - r.width / 2; it.my = it.ty + th / 2 - r.height / 2;
      it.sx = r.left; it.sy = r.top;
      it.dly = 0;                                    /* all six crack + split in lockstep — a clean division, not a cascade */
      setDockShard(it, it.tx, it.ty, tw, th, 0, 0, 0);   /* == the whole chat, joined */
      return it;
    });
    pages.forEach(function (p) { p.style.visibility = 'hidden'; });

    /* one global ease over all shards (same easeInOutCubic the other morphs use);
       per-shard stagger via it.dly. dockShardAt drives crack→stretch→flight. */
    var TOTAL = 1250, t0 = performance.now();
    function frame(now) {
      var live = false;
      items.forEach(function (it) {
        var t = (now - t0 - it.dly) / TOTAL;
        if (t < 0) { live = true; return; }
        var pp = Math.min(t, 1);
        if (pp < 1) live = true;
        var e = pp < .5 ? 4 * pp * pp * pp : 1 - Math.pow(-2 * pp + 2, 3) / 2;
        dockShardAt(it, e);
      });
      if (live) { requestAnimationFrame(frame); return; }
      /* shards landed on the slots — swap in the real cards at the same geometry
         and remove the shards in one frame (no pop), resume the bob */
      pages.forEach(function (p) {
        p.style.transition = 'transform .32s cubic-bezier(.22,.61,.36,1),box-shadow .32s ease,border-color .32s ease';
        p.classList.add('in'); p.style.visibility = ''; p.style.transform = ''; p.style.opacity = '';
        startBob(p);                                      /* restart pgbob from rest → seamless */
      });
      items.forEach(function (it) { it.wrap.remove(); });
      if (cue) cue.classList.add('in');
      requestAnimationFrame(function () { pages.forEach(function (p) { p.style.transition = ''; }); });
      morphing = false;
    }
    requestAnimationFrame(frame);
  }

  /* ── Discuss → Everywhere (council verdict B, 9/9): the MASTERED "phenomenon"
        vocab card is the hinge. index.html grows a clone of it centre-stage, holds
        on a "Mastered" stamp, then hands the grown clone here — it CRACKS into the
        six article pages: the word you mastered opens up the whole web.
        Seeded from a transform-scaled card (scale k), so each shard clones the card
        WITH its scale preserved — the assembled shards are pixel-identical to the
        held clone (no reflow pop), exactly like the window/dock morphs. ── */
  var CARD_RAD = 16;                                  /* corner radius the grown card + shards + final pages all share */
  function buildCardShard(srcCard, cardW, cardH, k, col, row, tw, th, pgW, pg, z) {
    var wrap = document.createElement('div');
    wrap.className = 'ev-shard';
    /* NO white background: the tile is transparent, so when the card's own pixels
       fade out there's a near-transparent beat (the frosted scene shows through)
       before the media surfaces — "card stuff disappears → media appears", no
       white wash. SQUARE inner/article (border-radius:0) + the wrap's rounded
       clip = clean rounded corners, no white wedge. */
    wrap.style.cssText = 'position:fixed;left:0;top:0;overflow:hidden;pointer-events:none;will-change:transform,width,height,opacity;z-index:' + z;
    var inner = srcCard.cloneNode(true);
    inner.classList.remove('ring-pop', 'in');
    inner.style.cssText += ';position:absolute;left:' + (-col * tw).toFixed(1) + 'px;top:' + (-row * th).toFixed(1) + 'px;' +
      'width:' + cardW + 'px;height:' + cardH + 'px;margin:0;border-radius:0;transform-origin:0 0;transform:scale(' + k.toFixed(4) + ');box-shadow:none;transition:none;opacity:1';
    var card = pg.cloneNode(true);
    card.classList.add('in');
    card.style.cssText += ';position:absolute;left:0;top:0;width:' + pgW + 'px;margin:0;border-radius:0;transform:none;box-shadow:none;opacity:0';
    wrap.appendChild(inner); wrap.appendChild(card);
    document.body.appendChild(wrap);
    return { wrap: wrap, win: inner, card: card };
  }
  /* CONSTANT corner radius (no square-flash, no white corners). The card's own
     pixels fade OUT first; after a near-transparent beat the media (article + its
     text) eases IN — every step a smooth crossfade, no white. */
  function cardShardAt(it, s) {
    var x, y, w, h, u;
    if (s < SEG1) { u = s / SEG1; x = it.tx + (it.cx - it.tx) * u; y = it.ty + (it.cy - it.ty) * u; w = it.tw + (it.cw - it.tw) * u; h = it.th + (it.ch - it.th) * u; }
    else if (s < SEG1 + SEG2) { u = (s - SEG1) / SEG2; x = it.cx + (it.mx - it.cx) * u; y = it.cy + (it.my - it.cy) * u; w = it.cw + (it.sw - it.cw) * u; h = it.ch + (it.sh - it.ch) * u; }
    else { u = (s - SEG1 - SEG2) / (1 - SEG1 - SEG2); x = it.mx + (it.sx - it.mx) * u; y = it.my + (it.sy - it.my) * u; w = it.sw; h = it.sh; }
    var inOp = 1 - clamp01(s / 0.10);                 /* the card SHEDS its colours/text/ring almost at once */
    var caOp = clamp01((s - 0.28) / 0.42);            /* media then surfaces on the flying pieces */
    it.wrap.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
    it.wrap.style.width  = w.toFixed(1) + 'px';
    it.wrap.style.height = h.toFixed(1) + 'px';
    /* OUTER corners (the assembled card's silhouette) ease r0→16; INTERNAL corners
       stay SQUARE through the crack, so the six tiles read as ONE card splitting along
       straight lines — not six rounded pills — then round to 16 as they become cards */
    var Ro = it.r0 + (CARD_RAD - it.r0) * clamp01(s / 0.5);
    var Ri = CARD_RAD * clamp01((s - 0.30) / 0.5);
    it.wrap.style.borderRadius = (it.cTL ? Ro : Ri).toFixed(1) + 'px ' + (it.cTR ? Ro : Ri).toFixed(1) + 'px ' + (it.cBR ? Ro : Ri).toFixed(1) + 'px ' + (it.cBL ? Ro : Ri).toFixed(1) + 'px';
    it.wrap.style.boxShadow = '0 22px 46px -26px rgba(26,23,20,' + (0.5 * Math.max(inOp, caOp)).toFixed(3) + ')';
    it.win.style.opacity  = inOp.toFixed(3);
    it.card.style.opacity = caOp.toFixed(3);
  }
  function morphFromCard(srcCard) {
    if (morphing) return;
    if (REDUCED || pages.length !== 6 || !srcCard || revealed) {
      revealed = true;
      pages.forEach(function (p) { p.classList.add('in'); p.style.visibility = ''; });
      if (cue) cue.classList.add('in');
      if (srcCard && srcCard.parentNode) srcCard.parentNode.removeChild(srcCard);
      return;
    }
    morphing = true; revealed = true;

    /* the crack follows the wall's OWN grid: desktop lays the six pages 3-across ×
       2-down, mobile stacks them 2-across × 3-down. Reading cols/rows off the live
       layout (not a fixed 3×2) keeps every shard landing on a real slot. */
    var COLS = (innerWidth < 980) ? 2 : 3, ROWS = pages.length / COLS;
    var cr = srcCard.getBoundingClientRect();             /* the grown (scaled) footprint */
    var cardW = srcCard.offsetWidth, cardH = srcCard.offsetHeight;   /* natural, pre-scale */
    var k  = cr.width / cardW;
    var tw = cr.width / COLS, th = cr.height / ROWS;
    /* the held card's ON-SCREEN corner radius (its css radius scaled by k) — the
       shards start here so the corners match the soft floating card exactly */
    var R0 = (parseFloat(getComputedStyle(srcCard).borderTopLeftRadius) || 15) * k;

    /* park bob at identity, measure each card's resting slot, then hide originals */
    pages.forEach(function (p) { parkBob(p); p.style.transition = 'none'; p.style.transform = 'none'; });
    void ev.offsetWidth;
    var pgW = pages[0].getBoundingClientRect().width;
    var items = pages.map(function (pg, i) {
      var col = i % COLS, row = (i / COLS) | 0;
      var r  = pg.getBoundingClientRect();
      var it = buildCardShard(srcCard, cardW, cardH, k, col, row, tw, th, pgW, pg, 1200 + i);
      it.tx = cr.left + col * tw; it.ty = cr.top + row * th; it.tw = tw; it.th = th;
      it.cx = it.tx + GAP; it.cy = it.ty + GAP; it.cw = tw - 2 * GAP; it.ch = th - 2 * GAP;
      it.sw = r.width; it.sh = r.height;
      it.mx = it.tx + tw / 2 - r.width / 2; it.my = it.ty + th / 2 - r.height / 2;
      it.sx = r.left; it.sy = r.top;
      it.dly = i * 22;                                     /* very tight stagger — reads as ONE card splitting */
      it.r0 = R0;                                          /* soft held-card corner radius to start from */
      it.cTL = (col === 0 && row === 0); it.cTR = (col === COLS - 1 && row === 0);   /* which corners are the card's OUTER silhouette */
      it.cBR = (col === COLS - 1 && row === ROWS - 1); it.cBL = (col === 0 && row === ROWS - 1);
      cardShardAt(it, 0);                                  /* joined == the grown card (content shown, media hidden) */
      return it;
    });
    srcCard.style.visibility = 'hidden';
    pages.forEach(function (p) { p.style.visibility = 'hidden'; });

    /* fast divide (1000ms) — the de-style + crack happen quick, then the pieces fly */
    var TOTAL = 1000, t0 = performance.now();
    function frame(now) {
      var live = false;
      items.forEach(function (it) {
        var t = (now - t0 - it.dly) / TOTAL;
        if (t < 0) { live = true; return; }
        var p = Math.min(t, 1);
        if (p < 1) live = true;
        var e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        cardShardAt(it, e);
      });
      if (live) { requestAnimationFrame(frame); return; }
      /* the shards have landed on the slots. Reveal the real pages with a gentle
         opacity fade (text eases in, not a snap), and keep the shards one beat
         longer so the page fades up UNDER them — no flicker at the hand-off. */
      pages.forEach(function (p) {
        p.style.transition = 'opacity .4s ease,transform .32s cubic-bezier(.22,.61,.36,1),box-shadow .32s ease,border-color .32s ease';
        p.style.visibility = ''; p.style.transform = ''; p.style.opacity = '';
        p.classList.add('in');                            /* opacity 0 → 1, eased */
        startBob(p);                                      /* restart pgbob from rest → seamless */
      });
      if (srcCard.parentNode) srcCard.parentNode.removeChild(srcCard);   /* drop the grown clone */
      if (cue) cue.classList.add('in');
      setTimeout(function () { items.forEach(function (it) { it.wrap.remove(); }); }, 200);   /* pages already part-faded */
      setTimeout(function () { pages.forEach(function (p) { p.style.transition = ''; }); morphing = false; }, 460);
    }
    requestAnimationFrame(frame);
  }

  window.LanternEverywhere = {
    morphFromWindow: morphFromWindow, morphToWindow: morphToWindow,
    morphFromDock: morphFromDock, morphFromCard: morphFromCard,
    toCTA: toCTA, backToWall: backToWall,
    presentWall: presentWall, presentCTA: presentCTA,
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
    if (lv) { badge.textContent = lv; badge.setAttribute('data-lv', lv); }   /* recolour to the new level */
    badge.classList.remove('morph'); void badge.offsetWidth; badge.classList.add('morph');
  }
  var simplifiedCount = 0;
  function rewriteCard(pg) {
    if (pg.dataset.done) return;
    pg.dataset.done = '1';
    /* once enough of the wall has been simplified, the "click anywhere" cue grows
       + darkens to pull the eye to the next step */
    if (++simplifiedCount >= 4 && cue) cue.classList.add('lit');
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
    /* touch parity for the hover-simplify: tapping a card rewrites it to your level */
    pg.addEventListener('pointerup', function (e) { if (e.pointerType === 'touch') rewriteCard(pg); });
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

  /* ── static presenters for a scrubber CLICK (jump) — no shatter/flip morph ──
     A click can land on Everywhere/CTA from any phase, where the predecessor
     morph has no valid source (the window/wall was never split) and would
     shatter the wrong content. These drop the wall / dock straight into their
     resting state, so the jump lands clean instead of replaying a stale morph. */
  function presentWall() {
    morphing = false; revealed = true;
    pages.forEach(function (p) {
      p.classList.add('in'); p.style.transition = '';
      p.style.visibility = ''; p.style.transform = ''; p.style.opacity = '';
      startBob(p);
    });
    if (cue) cue.classList.add('in');
    /* mobile jump straight onto the wall still gets the auto-simplify ripple */
    if (innerWidth <= 920 && !REDUCED) setTimeout(startSimplifyCascade, 360);
  }
  function presentCTA() {
    presentWall();                                  /* the wall sits under the dock */
    var LC = window.LanternCharge;
    document.body.classList.add('ph-cta');
    if (innerWidth <= 920) { if (LC && LC.buildMobile && !(LC.armed && LC.armed())) LC.buildMobile(); }
    else if (LC && LC.armDocked && !(LC.armed && LC.armed())) LC.armDocked();
    docked = true;
    hideWall();
  }

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
    document.body.classList.add('ph-cta');   /* m-cta-flip (the chrome-fade stagger) is armed by the toCTA caller BEFORE ph-cta, so its timing wins the transition start */

    requestAnimationFrame(function () {
      var slots = LC.slotsMobile();
      if (!slots || slots.length !== 6) {                 /* safety: snap to a clean docked state */
        clones.forEach(function (c) { c.wrap.remove(); });
        if (LC.armDockedMobile) LC.armDockedMobile();
        document.body.classList.remove('m-cta-flip');
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
        document.body.classList.remove('m-cta-flip');     /* flip landed → restore the plain fade for back-nav */
        flaming = false;
      }
      requestAnimationFrame(step);
    });
  }
  ev.addEventListener('click', function () { toCTA(); });
})();
