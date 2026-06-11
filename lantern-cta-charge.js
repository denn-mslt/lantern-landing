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
  const GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18z"/></svg>';
  const CHAT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.5A8 8 0 1 1 21 12z"/></svg>';

  /* ---- the visitor's own session feeds the previews ---- */
  function userLang() {
    try { var l = localStorage.getItem('lantern.gloss'); return (l && l !== 'en') ? l : 'uk'; }
    catch (e) { return 'uk'; }
  }
  function gloss(w, fallback) {
    const hl = document.querySelector('#hero .hl[data-w="' + w + '"]');
    return (hl && (hl.getAttribute('data-tr-' + userLang()) || hl.getAttribute('data-tr'))) || fallback;
  }

  /* six features = six callbacks to the hero demos; row → port height on the button */
  function buildFeats() {
    return [
      { n: 'Save',      c: '#ef8e1c', ic: ICON.bk,    x: 13, y: 18, s: 'l', row: 0,
        prev: '<span class="dkw"><b>route</b><i>/ruːt/</i><em class="cefr-b b-blue">B1</em></span><span class="dkok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>saved</span>' },
      { n: 'Simplify',  c: '#2f9e5f', ic: ICON.spark, x: 87, y: 18, s: 'r', row: 0,
        prev: '<span class="dksm"><s>exhaustive survey</s><span class="ar">→</span><b>studied with care</b></span>' },
      { n: 'Translate', c: '#3b6fd4', ic: GLOBE,      x: 11, y: 50, s: 'l', row: 1,
        prev: '<span class="dktr"><span class="s">the coast</span><span class="ar">→</span><span class="t">' + gloss('coast', 'узбережжя') + '</span></span>' },
      { n: 'Discuss',   c: '#7a6f9c', ic: CHAT,       x: 89, y: 50, s: 'r', row: 1,
        prev: '<span class="dkq">Why seven years?</span><span class="dka">The coast gave the crews no shelter…</span>' },
      { n: 'Exercises', c: '#d4503b', ic: ICON.ck,    x: 13, y: 82, s: 'l', row: 2,
        prev: '<span class="dkcz">one <span class="gap">remote</span> island</span>' },
      { n: 'Practice',  c: '#bd6e0c', ic: ICON.flame, x: 87, y: 82, s: 'r', row: 2,
        prev: '<span class="dkfc"><span class="f">route</span><span class="b">' + gloss('route', 'маршрут') + '</span></span>' }
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

  /* ---- merge the two mechanics: the streak becomes the button's echo ----
     close.js builds the days INSIDE .d1-track (button + cells in one row,
     which pushes the button off-centre and collides with the right wires).
     Move days 2..10 into their own compact row UNDER the button: input
     (features) → heart (centred button) → output (the streak below). */
  function restructure() {
    const track = section.querySelector('.d1-track');
    if (!track || track.dataset.echoed) return;
    track.dataset.echoed = '1';
    const echo = document.createElement('div');
    echo.className = 'd1-echo';
    /* name the row and anchor it: "your streak" + day 1 — otherwise the
       detached cells read as unexplained pills starting at "2" */
    const lab = document.createElement('span');
    lab.className = 'd1-echo-lab';
    lab.textContent = 'your streak';
    echo.appendChild(lab);
    const day1 = document.createElement('span');
    day1.className = 'd1-daycell day1';
    day1.textContent = '1';
    echo.appendChild(day1);
    /* days 2..10 go in their own wrapper so the whole promise can collapse in
       one motion when it recedes; the trailing "→" arrow is dropped — it
       pointed at nothing */
    const futures = document.createElement('span');
    futures.className = 'd1-futures';
    track.querySelectorAll('.d1-daycell').forEach(function (n) { futures.appendChild(n); });
    echo.appendChild(futures);
    const arrow = track.querySelector('.d1-more');
    if (arrow) arrow.remove();
    /* main-only: shorter label, bigger presence — "Add to Chrome" is the
       recognised install idiom (and matches the topbar + hero buttons);
       "Lantern" is already everywhere around it. close.js stays untouched
       because index.html shares it. */
    const t = btn.querySelector('span:not(.d1-chrome):not(.d1-arrow)');
    if (t) t.textContent = 'Add to Chrome';
    /* the layer that hosts the warm touches, clipped to the pill */
    if (!btn.querySelector('.d1-warm')) {
      const warm = document.createElement('span');
      warm.className = 'd1-warm';
      btn.insertBefore(warm, btn.firstChild);
    }
    track.parentNode.insertBefore(echo, track.nextSibling);
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
    return '<div class="dk-in"><div class="dk-top"><span class="dk-ic">' + f.ic + '</span><span class="dk-name">' + f.n + '</span></div><div class="dk-prev">' + f.prev + '</div></div>';
  }

  function buildCards() {
    FEATS = buildFeats();
    FEATS.forEach(function (f, k) {
      const c = document.createElement('div');
      c.className = 'dk-card ' + f.s;
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
  function warmTouch(tx, ty, fromLeft, dvy) {
    const warm = btn.querySelector('.d1-warm');
    if (warm) {
      const t = document.createElement('span');
      t.className = 'd1-touch';
      t.style.left = tx.toFixed(1) + 'px';
      t.style.top = ty.toFixed(1) + 'px';
      t.style.setProperty('--dx', (fromLeft ? 52 : -52) + 'px');
      t.style.setProperty('--dy', (dvy || 0).toFixed(1) + 'px');
      warm.appendChild(t);
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 700);
    }
    heatLevel = Math.min(1, heatLevel + 1 / 25);       /* 25 arrivals → fully amber */
    btn.style.backgroundColor = heatColor(heatLevel);
    if (heatLevel >= 1) btn.classList.add('blazing');  /* amber glow shadow */
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

  /* ---- the bead engine: one rAF loop drives every bead along its path ----
     SMIL + setTimeout could never sync the trace to the touch: the bead
     decelerates on its easing curve while timers fire on wall-clock guesses,
     and setInterval drifts further every cycle. Here we KNOW the bead's
     position each frame — the same frame it slips under the button's rim we
     spawn the trace. Zero delay by construction. The first pass also drags
     the wire's dash-front at exactly the bead's position, so the line is
     literally drawn by its bead. */
  function startBeads(items) {
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
      const bb = btn.getBoundingClientRect();
      const bx0 = bb.left - dr.left, bx1 = bb.right - dr.left;
      const by0 = bb.top - dr.top, by1 = bb.bottom - dr.top;
      beads.forEach(function (b) {
        const it = b.it;
        syncGeom(it, dr, bb);                /* keep the wire glued to its floating card + the live button */
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
            warmTouch(it.touch[0], it.touch[1], it.touch[2], it.touch[3]);
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
        c: c, left: left, rowFrac: ry, path: path, col: FEATS[k].c,
        /* trace coords are button-relative (clipped to the pill), so they don't
           need the live geometry: [x, y, fromLeft, verticalDrift] */
        touch: [left ? 1 : bb.width - 1, bb.height * ry, left, (ry - 0.5) * 14],
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
    startBeads(items);                       /* no static origin dot — the bead itself slides out of the card */
  }

  /* ---- ignition: wires land → the button lights and stays lit ---- */
  function charge() {
    btn.classList.add('charged');
    /* the charge spills into the streak: day 1 lights and STAYS lit (day one
       is this click) */
    const day1 = section.querySelector('.d1-daycell.day1');
    if (day1) setTimeout(function () { day1.classList.add('lit'); }, RM ? 0 : 70);
    if (RM) return;                          /* reduced motion: just the lit day 1, no wave */
    /* days 2..10 light in a wave — the promise — then the whole row recedes,
       leaving only day 1 as the anchor (no leftover numbers, no arrow) */
    const echo = section.querySelector('.d1-echo');
    const futures = section.querySelectorAll('.d1-daycell.future');
    futures.forEach(function (f, i) {
      setTimeout(function () { f.classList.add('lit'); }, 200 + i * 70);
    });
    setTimeout(function () { if (echo) echo.classList.add('faded'); }, 200 + futures.length * 70 + 900);
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

  addEventListener('resize', function () { if (armed) drawWires(false); });

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
    armed: function () { return armed; }
  };
})();
