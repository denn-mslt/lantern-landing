/* ============================================================
   Lantern Landing — mobile phase SCRUBBER (main.html)
   A timeline bar above the footer: drag the amber bead anywhere
   and the demo PLAYS every phase on the way there — speed-capped,
   one phase per DWELL ms, so a full-track fling still shows the
   whole story. The bead is the truth (current phase); a hollow
   ring marks your goal while the demo catches up. Tap a spot on
   the track = same thing without the drag.
   Needs window.LanternPhases (main.html inline) + .m-scrub styles.
   ============================================================ */
(function () {
  var N = 8;                       /* phases 0..7 */
  var DWELL = 1150;                /* manual drag/tap speed cap between phase steps */
  var BREATH = 600;               /* PLAY: beat after a scene finishes before the next */
  var MAX_SCENE = 18000;          /* PLAY: safety cap so a stuck scene can't hang the reel */
  var NAMES = ['HOME', 'SIMPLIFY', 'TRANSLATE', 'IMMERSE', 'DISCUSS', 'PRACTICE', 'EVERYWHERE', 'INSTALL'];

  function init() {
    var scrub = document.getElementById('m-scrub');
    var LP = window.LanternPhases;
    if (!scrub || !LP) return;
    if (window.innerWidth > 920) return;          /* mobile-only, init-time gate */

    var track = scrub.querySelector('.m-scrub-track');
    var fill  = scrub.querySelector('.m-scrub-fill');
    var ball  = scrub.querySelector('.m-scrub-ball');
    var cap   = document.getElementById('m-phase-caption');
    if (!track || !fill || !ball) return;

    /* notches + the goal ring */
    var ticks = [];
    for (var i = 0; i < N; i++) {
      var t = document.createElement('div');
      t.className = 'm-scrub-tick';
      t.style.left = (i / (N - 1) * 100) + '%';
      track.appendChild(t);
      ticks.push(t);
    }
    var goal = document.createElement('div');
    goal.className = 'm-scrub-goal';
    track.appendChild(goal);
    track.appendChild(ball);                       /* keep the bead on top */

    var target = LP.get();                         /* where the user pointed */
    var expected = LP.get();                       /* the phase the scrubber last set itself — any other value means someone else (auto-advance, swipe, programmatic) moved the phase, so adopt it instead of walking back (mirrors lantern-deck.js) */
    var lastStep = 0;
    var lastBusy = 0;                              /* last moment a scene was performing — BREATH measured from here */
    var dragging = false;
    var playing = false;                           /* PLAY owns the chase + drives the runway */
    var selfStep = false;                          /* true while the scrubber itself drives a phase move — tells notifyPhase to ignore it */

    /* the scrubber's own moves go through these so notifyPhase (fired from the
       phase controller's setDots) can tell a scrubber-driven step apart from an
       outside one (scene auto-advance, programmatic jump). */
    function lpStep(dir) { selfStep = true; try { return LP.step(dir); } finally { selfStep = false; } }
    function lpJump(n)   { selfStep = true; try { return LP.jump(n);   } finally { selfStep = false; } }

    function pct(p) { return (p / (N - 1) * 100) + '%'; }

    function render() {
      var vis = LP.pos();
      if (!dragging) {
        ball.style.left = pct(vis);
        fill.style.width = pct(vis);
      }
      ticks.forEach(function (t, i) { t.classList.toggle('passed', i <= vis); });
      var chasing = (vis !== target);
      scrub.classList.toggle('chasing', chasing);
      if (chasing) goal.style.left = pct(target);
    }

    /* keep the scroll runway (and so the bead's resting scroll position) under
       the current phase while PLAY drives — without letting that programmatic
       scroll feed back in and re-drive phases */
    function syncRunway(p) {
      if (window.LanternCrank && window.LanternCrank.syncTo) {
        window.LanternCrank.suppress(900);
        window.LanternCrank.syncTo(p);
      }
    }

    /* chase engine — two cadences:
       - PLAY forward = cinema: step only once the phase's scripted scene has
         played out (LP.actionPlaying() clears), then a BREATH; a safety cap
         steps anyway if a scene forgets to release.
       - drag / tap / rewind = snappy: DWELL-capped, only gated by busy(). */
    var rafId = 0;
    function chase() {
      rafId = 0;
      var cur = LP.get();
      var vis = LP.pos();
      /* a phase change the scrubber didn't make = a swipe or programmatic jump
         took the wheel → adopt it as the goal instead of walking back. */
      if (!dragging && cur !== expected) {
        if (playing) stopPlay();
        target = vis; expected = cur;
        render();
        return;
      }
      if (vis === target) { render(); if (playing) stopPlay(); return; }
      var now = performance.now(), dir = vis < target ? 1 : -1, ready;
      if (playing && dir > 0) {
        if (now - lastStep >= MAX_SCENE) ready = true;       /* safety cap fires even mid-scene */
        else if (LP.busy() || LP.actionPlaying()) { lastBusy = now; ready = false; }
        else ready = (now - lastBusy >= BREATH);
      } else {
        ready = (now - lastStep >= DWELL) && !LP.busy();
      }
      if (ready && lpStep(dir)) {
        lastStep = now; lastBusy = now;
        expected = LP.get();   /* the scrubber owns this move — record it so the guard above doesn't mistake it for an outside change */
        /* NB: don't scroll the runway here — a leaked scroll event would feed
           back through the crank handler and reset target to the current
           phase, silently halting the reel. The bead shows the phase; the
           runway is re-synced only when PLAY stops (chase no longer running). */
        render();
      }
      rafId = requestAnimationFrame(chase);
    }
    function kick() { if (!rafId) rafId = requestAnimationFrame(chase); }

    /* finger → fraction of the track */
    function frac(e) {
      var r = track.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width;
      return Math.max(0, Math.min(1, x));
    }
    var VIS_PHASE = [0,1,2,3,5,4,6,7]; /* visual pos → internal phase (4↔5 swap) */
    function setTarget(f) {
      var t = Math.round(f * (N - 1));
      if (t !== target) {
        target = t;
        if (cap && NAMES[VIS_PHASE[t]]) cap.textContent = '0' + (t + 1) + ' · ' + NAMES[VIS_PHASE[t]];
      }
    }

    var pointerDownX = 0, pointerDownY = 0, wasDrag = false;
    scrub.addEventListener('pointerdown', function (e) {
      stopPlay();                                  /* grabbing the bead = take control */
      dragging = true; wasDrag = false;
      pointerDownX = e.clientX; pointerDownY = e.clientY;
      scrub.classList.add('drag');
      try { scrub.setPointerCapture(e.pointerId); } catch (err) {}
      var f = frac(e);
      ball.style.left = (f * 100) + '%';
      fill.style.width = (f * 100) + '%';
      setTarget(f);
      kick();
      e.preventDefault();
    });
    scrub.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      if (Math.abs(e.clientX - pointerDownX) > 4 || Math.abs(e.clientY - pointerDownY) > 4) wasDrag = true;
      var f = frac(e);
      ball.style.left = (f * 100) + '%';
      fill.style.width = (f * 100) + '%';
      setTarget(f);
      kick();
    });
    function release() {
      if (!dragging) return;
      dragging = false;
      scrub.classList.remove('drag');
      /* tap (no movement) → jump directly; drag → let chase walk there */
      if (!wasDrag && LP.jump) {
        lpJump(target);
        expected = LP.get();
        render();
        syncRunway(target);   /* snap the runway under the new phase + suppress feedback, exactly like a swipe — without this the lagging scrollY is read back and drifts the phase */
      } else {
        render();
        kick();
      }
    }
    scrub.addEventListener('pointerup', release);
    scrub.addEventListener('pointercancel', release);

    /* phases also move by swipe/tap — keep the bead in sync. When no chase is
       in flight, any phase drift came from outside: adopt it as the new goal
       (a swipe mid-chase keeps the chase goal — it'll converge anyway). */
    setInterval(function () {
      if (dragging || rafId) return;
      var cur = LP.get(), vis = LP.pos();
      if (vis !== target || cur !== expected) { target = vis; expected = cur; }
      render();
    }, 300);

    /* ── CRANK: native scroll = the barrel-organ handle. The runway (#m-crank)
       gives the page real scroll height; finger position along it = goal phase;
       the same chase engine walks the story there, speed-capped — a full-track
       fling still plays every beat on the way. ── */
    var playBtn = document.getElementById('m-playbtn');
    function crankRange() { return Math.max(1, document.documentElement.scrollHeight - window.innerHeight); }

    var crank = document.getElementById('m-crank');
    var crankSuppressUntil = 0;
    /* programmatic scroll: snapping the runway under a phase fires a BURST of
       scroll events (mobile momentum + smoothing), not one. The old single-shot
       `progScroll` flag swallowed only the FIRST; the rest were read back as a
       finger drag and silently re-targeted the phase — that's the 3→2 drift that
       broke the chat (the runway lagged a phase behind, then pulled it back). A
       time window swallows the whole burst. */
    function progScrollTo(y) {
      crankSuppressUntil = Math.max(crankSuppressUntil, performance.now() + 1000);
      window.scrollTo(0, y);
    }
    if (crank) {
      window.__mCrank = true;        /* tells index.html: drive phases here, not via discrete wheel */
      var lastScrollTs = 0;
      window.addEventListener('scroll', function () {
        if (performance.now() < crankSuppressUntil) return;   /* programmatic snap or a discrete swipe — ignore its momentum */
        lastScrollTs = performance.now();
        setTarget(Math.max(0, Math.min(1, window.scrollY / crankRange())));
        kick();
      }, { passive: true });
      /* a swipe is ~half a flick but a phase is ~80vh of runway, so flicks rarely
         cross a boundary. index.html's touch handler steps the phase directly and
         then calls these to snap the runway to it + swallow the leftover momentum. */
      window.LanternCrank = {
        syncTo: function (p) {
          var y = Math.round(Math.max(0, Math.min(N - 1, p)) / (N - 1) * crankRange());
          progScrollTo(y);
        },
        suppress: function (ms) { crankSuppressUntil = Math.max(crankSuppressUntil, performance.now() + (ms || 650)); },
        /* the phase controller calls this synchronously on EVERY phase change
           (via setDots). It closes the race that broke the chat: when a scene
           auto-advances (discuss→practice) or a programmatic jump moves the
           phase, the runway is still parked at the OLD phase; a stray scroll read
           that stale position back and walked the phase straight back into the
           chat. Anchoring the runway here — synchronously, before any scroll can
           fire — kills that. Scrubber-driven moves (selfStep) and active
           drag/PLAY are skipped: the scrubber already owns target there. */
        notifyPhase: function (p) {
          if (selfStep || dragging || playing) return;
          var vis = LP.pos();
          target = vis; expected = p;               /* target=visual, expected=internal — avoids swap mismatch on Practice/Discuss */
          if (performance.now() - lastScrollTs < 700) { render(); return; }  /* user is scrolling the crank — it owns the runway */
          render();
          syncRunway(vis);
        }
      };
      /* phase moved some other way (track tap, CTA back, auto-advance) → quietly
         bring the scroll position along so the next flick continues from the
         right spot. Guarded by the suppression window so it never fights a snap
         already in flight. */
      setInterval(function () {
        if (dragging || playing) return;
        if (performance.now() - lastScrollTs < 700) return;
        if (performance.now() < crankSuppressUntil) return;
        var want = target / (N - 1) * crankRange();
        if (Math.abs(window.scrollY - want) > 8) progScrollTo(want);
      }, 350);
    }

    /* ── PLAY = cinema: the chase engine walks the whole story, but each screen
       waits for its scripted scene to finish (LP.actionPlaying clears) before
       the next — so it reads like a film, not a flick-book. The runway scrolls
       to follow. Any real touch / wheel / key / drag hands control back and
       freezes on the current screen — manual always wins. ── */
    function setPlayUI(on) {
      if (!playBtn) return;
      playBtn.classList.toggle('playing', on);
      playBtn.setAttribute('aria-label', on ? 'Stop' : 'Play the story');
    }
    function stopPlay() {
      if (!playing) return;
      playing = false; window.LanternPlaying = false;
      target = LP.pos(); expected = LP.get();      /* freeze on this screen (target=visual, expected=internal) */
      setPlayUI(false);
      render();
      syncRunway(LP.pos());                       /* chase is idle now → safe to bring the runway along */
    }
    function startPlay() {
      var cur = LP.get();
      expected = cur;
      target = (cur >= N - 1) ? 0 : N - 1;         /* at the end → rewind home; else play to the end */
      lastStep = lastBusy = performance.now();     /* first screen gets its full beat */
      playing = true; window.LanternPlaying = true;
      setPlayUI(true);
      render();
      kick();
    }
    if (playBtn) {
      playBtn.addEventListener('click', function () { if (playing) stopPlay(); else startPlay(); });
      var userInterrupt = function (e) {
        if (!playing) return;
        if (e && e.target && e.target.closest && e.target.closest('.m-playbtn, .m-advance')) return;
        stopPlay();
      };
      window.addEventListener('touchstart', userInterrupt, { passive: true });
      window.addEventListener('wheel', userInterrupt, { passive: true });
      window.addEventListener('keydown', userInterrupt);
    }

    /* advance arrow — the single onward control on the scrubber row: step to the next
       screen (loops home at the end). The phase change notifies LanternCrank, which
       brings the scroll runway along so the next flick continues from the right spot. */
    var advBtn = document.getElementById('m-advance');
    if (advBtn) {
      advBtn.addEventListener('click', function () {
        if (playing) stopPlay();
        if (LP.pos() >= N - 1) { if (LP.jump) LP.jump(0); }
        else if (LP.step) LP.step(1);
        target = LP.pos(); expected = LP.get();
        render();
      });
    }

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
