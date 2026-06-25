/* ============================================================
   Lantern Landing — CTA CHARGE (final screen, main.html)
   Ported from lantern-v3-act3.js ("Everywhere" dock), retargeted:
   the six feature mini-cards pop in around the install button and
   wire INTO it — every wire lands at the same moment, the button
   "ignites" (persistent glow + one pop + a streak preview), and
   pulses keep feeding it for as long as the screen is up.
   The previews echo the visitor's own session: their chosen gloss
   language and the words they saved in the hero demos.
   Pure decoration — pointer-events stay off, the button keeps
   every click. Needs the lantern-v3.js globals (ICON) and the
   .dk-card / .ev-wires styles from lantern-v3.css.
   ============================================================ */
(function () {
  const section = document.getElementById('ev-close'); if (!section) return;
  const wrap = section.querySelector('.d1-wrap');
  const btn = document.getElementById('close-cta');
  if (!wrap || !btn) return;

  const SVGNS = 'http://www.w3.org/2000/svg';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* each dock card wears the SAME mark as its own hero screen, so the last
     screen reads as a recap of the journey — not the nav rail's variants */
  /* translate = the "languages" glyph (A + character strokes) from the screen-3
     translate card header (#hero-tpanel .tc-glyph) */
  const TRANSLATE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>';
  /* discuss = the double speech-bubble from the screen-4 "Discuss this article"
     fab (#hero-disc-fab) */
  const DISCUSS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>';
  /* exercises = the bolt from the Practice "Turn into exercises" button (#hx-toggle) */
  const BOLT = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>';
  /* immerse = the horizontal swap-arrows from the "Read in your language" fab
     (#hero-imm-fab) — the whole page swaps to your language */
  const IMMERSE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8h18"/><path d="M17 4l4 4-4 4"/><path d="M21 16H3"/><path d="M7 12l-4 4 4 4"/></svg>';
  /* simplify reduces to the essence — a bare orange dot, like the screen-2 simp-dot */
  const DOT = '<svg viewBox="0 0 24 24" fill="#ef8e1c"><circle cx="12" cy="12" r="6"/></svg>';

  /* ---- the visitor's own session feeds the previews ---- */
  function userLang() {
    try { var l = localStorage.getItem('lantern.gloss'); return (l && l !== 'en') ? l : 'fr'; }
    catch (e) { return 'fr'; }
  }
  function gloss(w, fallback) {
    const hl = document.querySelector('#hero .hl[data-w="' + w + '"]');
    return (hl && (hl.getAttribute('data-tr-' + userLang()) || hl.getAttribute('data-tr'))) || fallback;
  }

  /* six features = six callbacks to the hero demos; row → port height on the button */
  function buildFeats() {
    return [
      { n: 'Save',      c: '#ef8e1c', ic: ICON.bk,    x: 87, y: 82, s: 'r', row: 2,
        prev: '<span class="dkw"><b>genre</b><i>/ˈʒɒn.rə/</i><em class="cefr-b b-green">A2</em></span><span class="dkok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>saved</span>' },
      { n: 'Simplify',  c: '#ef8e1c', ic: DOT, bare: true, x: 87, y: 18, s: 'r', row: 0,
        prev: '<span class="dksm"><s>commercial dominance</s><span class="ar">→</span><b>massive success</b></span>' },
      { n: 'Translate', c: '#3b6fd4', ic: TRANSLATE,  x: 11, y: 50, s: 'l', row: 1,
        prev: '<span class="dktr"><span class="s">devoted</span><span class="ar">→</span><span class="t">' + gloss('devoted', 'відданий') + '</span></span>' },
      { n: 'Discuss',   c: '#3a3a3a', ic: DISCUSS,    x: 89, y: 50, s: 'r', row: 1,
        prev: '<span class="dkq">Cross-genre run — real or hype?</span><span class="dka">Real — she kept every crowd.</span>' },
      { n: 'Exercises', c: '#d4503b', ic: BOLT,       x: 13, y: 82, s: 'l', row: 2,
        prev: '<span class="dkcz">a cultural <span class="gap">phenomenon</span></span>' },
      { n: 'Immerse',   c: '#7b46cf', ic: IMMERSE,    x: 13, y: 18, s: 'l', row: 0,
        prev: '<span class="dkim">a <b>' + gloss('genre', 'жанр') + '</b>-defining run of pure <b>' + gloss('devoted', 'відданість') + '</b></span>' }
    ];
  }

  /* ---- dock scaffold — self-built, so main.html only adds one script tag ---- */
  const dock = document.createElement('div');
  dock.className = 'cta-dock';
  const wires = document.createElementNS(SVGNS, 'svg');
  wires.setAttribute('class', 'ev-wires');
  dock.appendChild(wires);
  wrap.appendChild(dock);

  let FEATS = [], cards = [], armed = false, pulseCleanups = [], heatLevel = 0;

  /* ---- prep the install button: the streak mechanic is gone, so the button
     is the whole CTA. Rename it ("Add to Chrome" — the recognised install
     idiom, matching the topbar + hero buttons) and give it the warm-touch
     layer the wire beads trace into. ---- */
  function restructure() {
    const track = section.querySelector('.d1-track');
    if (!track || track.dataset.echoed) return;
    track.dataset.echoed = '1';
    const t = btn.querySelector('span:not(.d1-chrome):not(.d1-arrow)');
    if (t) t.textContent = 'Add to Chrome';
    /* the layer that hosts the warm touches, clipped to the pill */
    if (!btn.querySelector('.d1-warm')) {
      const warm = document.createElement('span');
      warm.className = 'd1-warm';
      btn.insertBefore(warm, btn.firstChild);
    }
    try { window.dispatchEvent(new Event('resize')); } catch (e) {}   /* re-measure section height */
  }
  /* close.js registers its DOMContentLoaded init first (script order), so the
     cells exist by the time this runs */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', restructure);
  else restructure();

  /* the card's inner markup — shared so the finale's flip-clone backs (built in
     lantern-everywhere.js via the public API) are byte-identical to the real
     dock cards, making the hand-off at the end of the flip seamless */
  function cardInnerHTML(f) {
    return '<div class="dk-in"><div class="dk-top"><span class="dk-ic' + (f.bare ? ' dk-bare' : '') + '">' + f.ic + '</span><span class="dk-name">' + f.n + '</span></div><div class="dk-prev">' + f.prev + '</div></div>';
  }

  function buildCards() {
    FEATS = buildFeats();
    FEATS.forEach(function (f, k) {
      const c = document.createElement('div');
      c.className = 'dk-card ' + f.s;
      c.dataset.feat = f.n.toLowerCase();
      c.style.setProperty('--fc', f.c);
      c.style.setProperty('--x', f.x + '%');
      c.style.setProperty('--y', f.y + '%');
      /* gentle drift, landing-style: each card orbits a tiny ellipse with its
         own period + a negative delay so the six are all out of phase (never a
         synchronised bob). Amplitudes are small — it should breathe, not sway. */
      c.style.setProperty('--ax', ((4 + (k % 3)) * 0.6).toFixed(1) + 'px');
      c.style.setProperty('--ay', ((5 + ((k + 1) % 3)) * 0.6).toFixed(1) + 'px');
      c.style.setProperty('--fd', (7.5 + k * 0.6).toFixed(1) + 's');
      c.style.setProperty('--fdelay', (-k * 1.3).toFixed(1) + 's');
      c.innerHTML = cardInnerHTML(f);
      dock.appendChild(c);
      cards.push(c);
    });
  }

  /* the heat ramp: ink → amber, lerped in JS so each of the 10 bead arrivals
     advances the button's background by exactly one even step (the CSS
     background-color transition blurs the steps into a continuous warming) */
  const INK = [26, 23, 20], AMBER = [239, 142, 28];
  function heatColor(h) {
    const r = Math.round(INK[0] + (AMBER[0] - INK[0]) * h);
    const g = Math.round(INK[1] + (AMBER[1] - INK[1]) * h);
    const b = Math.round(INK[2] + (AMBER[2] - INK[2]) * h);
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  /* a bead landing = (a) a glowing trace that CONTINUES the bead's flight
     inside the pill before fading, (b) one even step of heat on the button */
  function warmTouch(target, tx, ty, dx, dy, step) {
    const warm = target.querySelector('.d1-warm');
    if (warm) {
      const t = document.createElement('span');
      t.className = 'd1-touch';
      t.style.left = tx.toFixed(1) + 'px';
      t.style.top = ty.toFixed(1) + 'px';
      t.style.setProperty('--dx', (dx || 0).toFixed(1) + 'px');
      t.style.setProperty('--dy', (dy || 0).toFixed(1) + 'px');
      warm.appendChild(t);
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 700);
    }
    const h = Math.min(1, (target.__heat || 0) + (step || 1 / 25));   /* per-target heat accumulator */
    target.__heat = h;
    target.style.backgroundColor = heatColor(h);
    if (h >= 1) target.classList.add('blazing');       /* amber glow shadow */
  }

  /* leaves the card at once (linear term → no nub crawling out), then whips
     into the button at peak speed (cubic term → no crawl at the rim either).
     Pure t³ stalled at the card; pure ease-out stalled at the button. */
  function easeBead(t) { return 0.3 * t + 0.7 * t * t * t; }

  /* recompute a wire's path from the LIVE positions of its card and the
     button — the cards float (CSS) and the button lifts on hover, so the wire
     is rebuilt every frame to stay glued to both ends. Stores the new length
     on the item for the bead's distance mapping. */
  const ROWY = [0.26, 0.5, 0.74];
  function syncGeom(it, dr, bb) {
    const r = it.c.getBoundingClientRect();
    const ex = (it.left ? r.right : r.left) - dr.left;
    const ey = r.top - dr.top + r.height / 2;
    /* dives 30px UNDER the button's rim so the bead sinks into the light */
    const px = (it.left ? bb.left + 30 : bb.right - 30) - dr.left;
    const py = bb.top - dr.top + bb.height * it.rowFrac;
    const mx = ex + (px - ex) * 0.5;
    it.path.setAttribute('d', 'M ' + ex.toFixed(1) + ' ' + ey.toFixed(1) + ' C ' + mx.toFixed(1) + ' ' + ey.toFixed(1) + ' ' + mx.toFixed(1) + ' ' + py.toFixed(1) + ' ' + px.toFixed(1) + ' ' + py.toFixed(1));
    it.len = it.path.getTotalLength();
  }

  /* mobile geometry: the dock is a vertical 3-col grid, so wires run from each
     card's edge that FACES the button (bottom edge for the top row, top edge for
     the bottom row) and curve into the button's near rim — a vertical cubic. */
  function syncGeomM(it, dr, bb) {
    const r = it.c.getBoundingClientRect();
    const ex = r.left + r.width / 2 - dr.left;          /* card centre x */
    const ey = (it.above ? r.bottom : r.top) - dr.top;  /* card edge facing the button */
    /* enter the button directly above/below the card centre, clamped inside the
       pill — keeps wires straight (no crossing) for any column count, 2-col or 3 */
    const px = Math.max(bb.left + 12, Math.min(bb.right - 12, r.left + r.width / 2)) - dr.left;
    const py = (it.above ? bb.top + 8 : bb.bottom - 8) - dr.top;   /* dive 8px under the rim */
    const my = ey + (py - ey) * 0.5;
    it.path.setAttribute('d', 'M ' + ex.toFixed(1) + ' ' + ey.toFixed(1) + ' C ' + ex.toFixed(1) + ' ' + my.toFixed(1) + ' ' + px.toFixed(1) + ' ' + my.toFixed(1) + ' ' + px.toFixed(1) + ' ' + py.toFixed(1));
    it.len = it.path.getTotalLength();
  }

  /* ---- the bead engine: one rAF loop drives every bead along its path ----
     SMIL + setTimeout could never sync the trace to the touch: the bead
     decelerates on its easing curve while timers fire on wall-clock guesses,
     and setInterval drifts further every cycle. Here we KNOW the bead's
     position each frame — the same frame it slips under the button's rim we
     spawn the trace. Zero delay by construction. The first pass also drags
     the wire's dash-front at exactly the bead's position, so the line is
     literally drawn by its bead. */
  function startBeads(items, target) {
    if (RM || !items.length) return;
    const beads = items.map(function (it) {
      const c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('r', '2.6'); c.setAttribute('fill', it.col); c.setAttribute('class', 'wpulse');
      c.setAttribute('opacity', '0');
      wires.appendChild(c);
      return { it: it, c: c, crossed: false, drawn: !it.draw };
    });
    const t0 = performance.now();
    let raf = 0;
    function frame(now) {
      const ts = (now - t0) / 1000;
      const dr = dock.getBoundingClientRect();
      const bb = target.getBoundingClientRect();
      const bx0 = bb.left - dr.left, bx1 = bb.right - dr.left;
      const by0 = bb.top - dr.top, by1 = bb.bottom - dr.top;
      beads.forEach(function (b) {
        const it = b.it;
        it.sync(it, dr, bb);                 /* keep the wire glued to its card + the live button */
        let t = (ts - it.delay) / it.dur;
        if (t < 0) { b.c.setAttribute('opacity', '0'); return; }   /* not departed yet */
        if (t >= 1) {
          t -= Math.floor(t);
          if (!b.drawn) { it.path.style.strokeDasharray = 'none'; b.drawn = true; }
        }
        const dist = easeBead(t) * it.len;
        if (!b.drawn) {                      /* first pass: the bead draws its wire */
          it.path.style.strokeDasharray = it.len;
          it.path.style.strokeDashoffset = Math.max(0, it.len - dist);
          if (dist >= it.len - 0.5) { it.path.style.strokeDasharray = 'none'; b.drawn = true; }
        }
        const p = it.path.getPointAtLength(dist);
        const under = p.x >= bx0 && p.x <= bx1 && p.y >= by0 && p.y <= by1;
        if (under) {                         /* slipped under the pill — hand off to the trace */
          if (!b.crossed) {
            b.crossed = true;
            warmTouch(target, it.touch[0], it.touch[1], it.touch[2], it.touch[3], it.step);
          }
          b.c.setAttribute('opacity', '0');
        } else {
          b.crossed = false;
          b.c.setAttribute('cx', p.x.toFixed(1)); b.c.setAttribute('cy', p.y.toFixed(1));
          b.c.setAttribute('opacity', t < 0.1 ? (t * 9.5).toFixed(2) : '.95');
        }
      });
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    pulseCleanups.push(function () {
      cancelAnimationFrame(raf);
      beads.forEach(function (b) { if (b.c.parentNode) b.c.parentNode.removeChild(b.c); });
    });
  }

  /* ---- wires: card ports → the button's flanks; pulses flow card → button ---- */
  function drawWires(animate) {
    pulseCleanups.forEach(function (fn) { fn(); }); pulseCleanups = [];
    wires.innerHTML = '';
    if (innerWidth < 980) return;
    const dr = dock.getBoundingClientRect();
    if (!dr.width || !dr.height) return;
    wires.setAttribute('viewBox', '0 0 ' + dr.width + ' ' + dr.height);
    const bb = btn.getBoundingClientRect();
    const items = cards.map(function (c, k) {
      const left = FEATS[k].s === 'l';
      const ry = ROWY[FEATS[k].row];
      const path = document.createElementNS(SVGNS, 'path');
      path.setAttribute('stroke', FEATS[k].c);
      path.setAttribute('class', 'wire');
      wires.appendChild(path);
      const it = {
        c: c, left: left, rowFrac: ry, path: path, col: FEATS[k].c, sync: syncGeom,
        /* trace coords are button-relative (clipped to the pill), so they don't
           need the live geometry: [x, y, dx, dy] */
        touch: [left ? 1 : bb.width - 1, bb.height * ry, left ? 52 : -52, (ry - 0.5) * 14],
        dur: 1.7 + Math.random() * 1.8,      /* this wire's bead period, 1.7–3.5s */
        delay: animate ? 0.07 + k * 0.07 : 0.3 + k * 0.12,
        draw: !!animate                      /* first pass draws the wire (skip on resize) */
      };
      syncGeom(it, dr, bb);                  /* initial geometry so the path renders this frame */
      if (animate) {
        path.style.strokeDasharray = it.len;
        path.style.strokeDashoffset = it.len;   /* hidden until its bead draws it */
      } else {
        path.style.strokeDasharray = 'none';
      }
      return it;
    });
    startBeads(items, btn);                   /* no static origin dot — the bead itself slides out of the card */
  }

  /* ---- mobile wires: vertical geometry, six cards → the share button ---- */
  function drawWiresMobile(target, animate) {
    pulseCleanups.forEach(function (fn) { fn(); }); pulseCleanups = [];
    wires.innerHTML = '';
    const dr = dock.getBoundingClientRect();
    if (!dr.width || !dr.height) return;
    wires.setAttribute('viewBox', '0 0 ' + dr.width + ' ' + dr.height);
    const bb = target.getBoundingClientRect();
    const bcy = bb.top + bb.height / 2;
    const COLBX = [0.24, 0.5, 0.76];          /* entry spread by grid column */
    const items = cards.map(function (c, k) {
      const r = c.getBoundingClientRect();
      const above = (r.top + r.height / 2) < bcy;
      const bx = COLBX[k % 3];
      const path = document.createElementNS(SVGNS, 'path');
      path.setAttribute('stroke', FEATS[k].c);
      path.setAttribute('class', 'wire');
      wires.appendChild(path);
      const it = {
        c: c, above: above, bx: bx, path: path, col: FEATS[k].c, sync: syncGeomM,
        /* button-relative trace coords [x, y, dx, dy] — the bead continues
           INTO the pill, drifting away from the rim it entered through */
        touch: [bb.width * bx, above ? 7 : bb.height - 7, 0, above ? 16 : -16],
        dur: 1.5 + Math.random() * 1.4,       /* 1.5–2.9s */
        delay: animate ? 0.10 + k * 0.06 : 0.2 + k * 0.10,
        draw: !!animate,
        step: 1 / 12                          /* 6 wires → fully amber in ~2 passes */
      };
      syncGeomM(it, dr, bb);
      if (animate) {
        path.style.strokeDasharray = it.len;
        path.style.strokeDashoffset = it.len;
      } else {
        path.style.strokeDasharray = 'none';
      }
      return it;
    });
    startBeads(items, target);
  }

  /* ---- ignition: wires land → the button lights and stays lit. The heat ramp
     (bead arrivals → ink→amber background) does the visible warming; this just
     flags the charged state. ---- */
  function charge() {
    btn.classList.add('charged');
  }

  /* ---- the sequence: cards pop in + wires draw with their beads → ignition ---- */
  function arm() {
    if (armed) return; armed = true;
    buildCards();
    if (RM) {
      cards.forEach(function (c) { c.classList.add('in'); });
      drawWires(false);
      charge();
      return;
    }
    cards.forEach(function (c, k) {
      setTimeout(function () { c.classList.add('in'); }, 100 + k * 60);
    });
    setTimeout(function () { drawWires(true); }, 220);
    setTimeout(charge, 220 + 1800);
  }

  /* ---- docked entry: the finale's flip-clones already delivered the cards to
     their slots, so skip the pop-in — snap the real cards in (no fade) exactly
     where the clones land, then draw wires + beads + ignite ---- */
  function armDocked() {
    if (armed) return; armed = true;
    buildCards();
    cards.forEach(function (c) { c.classList.add('snap', 'in'); });   /* instant, no stagger/fade */
    drawWires(true);
    setTimeout(charge, 1600);
  }

  /* ---- mobile: same mechanic as desktop, vertical layout. The dock is a 3-col
     grid; the six cards wire DOWN/UP into the share button, beads flow along the
     wires, and each arrival warms the button one step ink → amber. ---- */
  let mShareBtn = null;
  /* build + position the mobile dock (cards, the relocated button row, the foot),
     WITHOUT revealing the cards or drawing wires — shared by the plain build and
     the finale→CTA flip, which needs the slots measured before it reveals them.
     layout "b" (council 7/7): the button + note sit ISOLATED at the TOP, the six
     pills form a clean 3×2 grid below, and the email link + reassurance drop to
     the very bottom — clear of the wires, which run UP into the button */
  function mLayout() {
    buildCards();
    const mcta = section.querySelector('.m-close-cta');
    if (mcta) {
      dock.insertBefore(mcta, cards[0] || null);          /* note + button = top row */
      const foot = document.createElement('div');
      foot.className = 'm-cta-foot';
      const email = mcta.querySelector('.m-email-link');
      const hint = mcta.querySelector('.m-hero-hint');
      if (email) foot.appendChild(email);
      if (hint) foot.appendChild(hint);
      /* the page footer (with its Privacy link) is hidden on mobile, and the CTA is
         the terminal screen a phone visitor lands on — so carry Privacy here too */
      var priv = document.createElement('a');
      priv.className = 'm-priv-link';
      priv.href = '/privacy';
      priv.textContent = 'Privacy';
      foot.appendChild(priv);
      /* foot lives OUTSIDE the dock, as a sibling in close-wrap, so close-wrap's
         space-between spreads 3 zones: title (top) · dock note+button+cards (middle) ·
         foot free+privacy (bottom, between the last card and the scrubber). */
      if (foot.childNodes.length) (dock.parentNode || dock).appendChild(foot);
      /* owner: the "You're on mobile…" note rides WITH the h1, not the button cluster —
         pull it out of m-close-cta and dock it right under the title at the top. */
      var mNote = mcta.querySelector('.m-close-note');
      var mH1 = section.querySelector('.d1-headline.m-only');
      if (mNote && mH1 && mH1.parentNode) mH1.parentNode.insertBefore(mNote, mH1.nextSibling);
    }
    mShareBtn = mcta && mcta.querySelector('.m-share-btn');
    /* the warm-touch layer the bead traces live in (clipped to the pill) */
    if (mShareBtn && !mShareBtn.querySelector('.d1-warm')) {
      const warm = document.createElement('span');
      warm.className = 'd1-warm';
      mShareBtn.insertBefore(warm, mShareBtn.firstChild);
    }
  }
  function buildMobile() {
    if (armed || innerWidth > 920) return; armed = true;
    mLayout();
    cards.forEach(function (c) { c.classList.add('snap', 'in'); });   /* no stagger on mobile */
    if (!mShareBtn) return;
    if (RM) { mShareBtn.style.backgroundColor = heatColor(1); mShareBtn.classList.add('blazing'); return; }
    /* let the grid settle (cards land), then draw the wires + beads */
    setTimeout(function () { if (mShareBtn) drawWiresMobile(mShareBtn, true); }, 260);
  }
  /* finale flip (mobile): lay the dock out with the cards HELD hidden, then hand
     back each slot's measured centre + markup so the flip-clones can fly there. */
  function slotsMobile() {
    if (innerWidth > 920) return [];
    if (!armed) {
      armed = true;
      mLayout();
      cards.forEach(function (c) { c.classList.add('snap'); c.style.visibility = 'hidden'; });
    }
    void dock.offsetHeight;                                /* commit the grid layout before measuring */
    return cards.map(function (c, k) {
      const r = c.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: r.width,
               side: FEATS[k].s, color: FEATS[k].c, html: cardInnerHTML(FEATS[k]) };
    });
  }
  /* the clones have landed on the slots — reveal the real cards in place, then
     draw the wires + beads (no streak charge: the day cells are hidden on mobile) */
  function armDockedMobile() {
    cards.forEach(function (c) { c.style.visibility = ''; c.classList.add('in'); });
    if (RM) { if (mShareBtn) { mShareBtn.style.backgroundColor = heatColor(1); mShareBtn.classList.add('blazing'); } return; }
    if (mShareBtn) drawWiresMobile(mShareBtn, true);
  }

  const obs = new IntersectionObserver(function (es, o) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      o.disconnect();
      arm();
    });
  }, { threshold: 0.45 });
  /* one-screen model (main.html): #ev-close is a fixed phase overlay, not a scroll
     section — it always intersects, so the scroll-in auto-arm would fire at load.
     Only auto-arm when it's a real scroll section; otherwise the phase engine
     drives ignition via LanternCharge.armDocked() at the flip. */
  if (section.hasAttribute('data-sect')) obs.observe(section);

  addEventListener('resize', function () {
    if (!armed) return;
    if (mShareBtn && innerWidth <= 920) drawWiresMobile(mShareBtn, false);
    else if (innerWidth >= 980) drawWires(false);
  });

  /* ---- public hooks for the finale→CTA flip transition (lantern-everywhere.js).
     Only meaningful on desktop where the dock exists. ---- */
  window.LanternCharge = {
    /* the finale takes over: stop the scroll-in auto-arm so it can't double-fire */
    takeOver: function () { obs.disconnect(); },
    /* viewport-space target centres for the six dock slots, plus the markup +
       side each flip-clone should morph into. Order matches FEATS. */
    slots: function () {
      if (innerWidth < 980) return [];
      const dr = dock.getBoundingClientRect();
      return buildFeats().map(function (f) {
        return {
          cx: dr.left + dr.width * f.x / 100,
          cy: dr.top + dr.height * f.y / 100,
          side: f.s, color: f.c, name: f.n,
          html: cardInnerHTML(f)
        };
      });
    },
    /* called when the clones have landed — reveal the real cards + ignite */
    armDocked: armDocked,
    /* mobile: build the vertical dock (no flip, no beads) */
    buildMobile: buildMobile,
    /* mobile finale→CTA flip: measure the dock slots (cards held hidden) and,
       once the flip-clones land, reveal the real cards + draw the wires */
    slotsMobile: slotsMobile,
    armDockedMobile: armDockedMobile,
    armed: function () { return armed; }
  };
})();
