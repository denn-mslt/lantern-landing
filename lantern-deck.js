/* ============================================================
   Lantern Landing — DESKTOP bottom deck  (council verdict B)
   The side dot-rail retires; navigation moves to a bottom
   media-player: caption + scrubber + PLAY, driven entirely
   through window.LanternPhases. The desktop page is ONE screen
   (no document scroll) — every phase is a morph in place — so
   the deck just reads and drives phases, no scroll to sync.

   Mouse-native: grab the bead, click anywhere on the track to
   walk there, real focusable role="slider" with arrow keys.
   PLAY walks the whole story; any phase change the deck didn't
   make (a user wheel via the inline handler) hands control back
   — detected by an "expected phase" guard, so we never fight the
   inline wheel handler (which stopImmediatePropagation()s).
   ============================================================ */
(function () {
  var N = 7;
  var NAMES = ['HOME', 'SIMPLIFY', 'TRANSLATE', 'DISCUSS', 'PRACTICE', 'EVERYWHERE', 'INSTALL'];
  var DWELL = 1150;                 /* manual drag/keyboard speed cap per phase */
  var BREATH = 600;                 /* PLAY: beat after a scene finishes before the next — reads as cinema */
  var MAX_SCENE = 18000;            /* PLAY: safety cap so a scene that forgets to clear can't hang the reel */

  function init() {
    if (window.innerWidth <= 920) return;        /* desktop only; mobile uses .m-navcluster */
    var LP = window.LanternPhases;
    if (!LP) return;

    var deck = document.createElement('div');
    deck.id = 'd-deck';
    deck.innerHTML =
      '<div class="d-deck-cap" id="d-cap" aria-live="polite">01 · HOME</div>' +
      '<div class="d-deck-row">' +
        '<button class="d-playbtn" id="d-play" type="button" aria-label="Play the story">' +
          '<svg class="ic-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>' +
          '<svg class="ic-stop" viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2"/></svg>' +
        '</button>' +
        '<div class="d-scrub" id="d-scrub" role="slider" tabindex="0" aria-label="Story phase" ' +
             'aria-valuemin="1" aria-valuemax="7" aria-valuenow="1" aria-valuetext="01 · HOME">' +
          '<div class="d-track">' +
            '<div class="d-fill"></div>' +
            '<div class="d-goal"></div>' +
            '<div class="d-ball"></div>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(deck);

    var scrub   = deck.querySelector('#d-scrub');
    var track   = deck.querySelector('.d-track');
    var fill    = deck.querySelector('.d-fill');
    var ball    = deck.querySelector('.d-ball');
    var goal    = deck.querySelector('.d-goal');
    var cap     = deck.querySelector('#d-cap');
    var playBtn = deck.querySelector('#d-play');

    var ticks = [];
    for (var i = 0; i < N; i++) {
      var t = document.createElement('div');
      t.className = 'd-tick';
      t.style.left = (i / (N - 1) * 100) + '%';
      track.appendChild(t);
      ticks.push(t);
    }
    track.appendChild(goal);
    track.appendChild(ball);            /* keep bead + goal on top of the ticks */

    var target   = LP.get();            /* where the user pointed */
    var expected = LP.get();            /* the phase the deck last set itself */
    var lastStep = 0;
    var lastBusy = 0;                   /* last moment a scene was still performing — BREATH is measured from here */
    var dragging = false;
    var playing  = false;
    var rafId    = 0;

    function pct(p)   { return (p / (N - 1) * 100) + '%'; }
    function label(p) { return ('0' + (p + 1)) + ' · ' + NAMES[p]; }

    function render() {
      var cur = LP.get();
      if (!dragging) { ball.style.left = pct(cur); fill.style.width = pct(cur); }
      ticks.forEach(function (t, i) { t.classList.toggle('passed', i <= cur); });
      var chasing = (cur !== target);
      scrub.classList.toggle('chasing', chasing);
      if (chasing) goal.style.left = pct(target);
      cap.textContent = label(cur);
      scrub.setAttribute('aria-valuenow', cur + 1);
      scrub.setAttribute('aria-valuetext', label(cur));
    }

    /* one walk engine for drag / click / keyboard / play, but two cadences:
       - PLAY forward = cinema: step only once the current phase's scripted
         scene has played to the end (LP.actionPlaying() clears), then a BREATH;
         a safety cap steps anyway if a scene forgets to release.
       - manual drag / keyboard / rewind = snappy: DWELL-capped, only gated by
         busy() (a window-split / dock morph in flight must not be cut). */
    function walk() {
      rafId = 0;
      var cur = LP.get();

      /* a phase change the deck didn't make = the user took the wheel → hand
         control straight back (scenes no longer self-advance under PLAY, so any
         unexpected move is a real gesture). Manual always wins. */
      if (!dragging && cur !== expected) {
        if (playing) stopPlay();
        target = cur; expected = cur;
        render();
        return;
      }

      if (cur === target) { render(); if (playing) stopPlay(); return; }

      var now = performance.now(), dir = cur < target ? 1 : -1, ready;
      if (playing && dir > 0) {
        /* PLAY forward: while the scene performs, keep resetting the breath
           clock; step a BREATH after it releases. The safety cap fires even
           mid-scene, so a scene that forgets to release can't hang the reel. */
        if (now - lastStep >= MAX_SCENE) ready = true;
        else if (LP.busy() || LP.actionPlaying()) { lastBusy = now; ready = false; }
        else ready = (now - lastBusy >= BREATH);
      } else {
        ready = (now - lastStep >= DWELL) && !LP.busy();
      }
      if (ready && LP.step(dir)) { lastStep = now; lastBusy = now; expected = LP.get(); render(); }

      rafId = requestAnimationFrame(walk);
    }
    function kick() { if (!rafId) rafId = requestAnimationFrame(walk); }

    function setTarget(p) {
      p = Math.max(0, Math.min(N - 1, p));
      if (p !== target) { target = p; cap.textContent = label(p); }
    }

    function frac(e) {
      var r = track.getBoundingClientRect();
      return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    }
    function phaseAt(e) { return Math.round(frac(e) * (N - 1)); }

    /* ── drag / click on the track (mouse-native) ── */
    var downX = 0, moved = false;
    scrub.addEventListener('pointerdown', function (e) {
      stopPlay();
      dragging = true; downX = e.clientX; moved = false;
      scrub.classList.add('drag');
      try { scrub.setPointerCapture(e.pointerId); } catch (err) {}
      var f = frac(e);
      ball.style.left = (f * 100) + '%'; fill.style.width = (f * 100) + '%';
      setTarget(phaseAt(e)); kick();
      scrub.focus();
      e.preventDefault();
    });
    scrub.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      if (Math.abs(e.clientX - downX) > 3) moved = true;
      var f = frac(e);
      ball.style.left = (f * 100) + '%'; fill.style.width = (f * 100) + '%';
      setTarget(phaseAt(e)); kick();
    });
    function release(e) {
      if (!dragging) return;
      dragging = false; scrub.classList.remove('drag');
      if (!moved && LP.jump) {
        /* click (no drag): jump directly — no story walk-through */
        LP.jump(target); expected = target; render();
      } else {
        render(); kick();              /* drag: walk the story to target */
      }
    }
    scrub.addEventListener('pointerup', release);
    scrub.addEventListener('pointercancel', release);

    /* ── keyboard (a real slider; owns its arrows so the page pager can't eat them) ── */
    scrub.addEventListener('keydown', function (e) {
      var cur = LP.get(), handled = true;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setTarget(cur + 1);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setTarget(cur - 1);
      else if (e.key === 'Home') setTarget(0);
      else if (e.key === 'End') setTarget(N - 1);
      else handled = false;
      if (handled) { stopPlay(); kick(); e.preventDefault(); e.stopPropagation(); }
    });

    /* ── PLAY ── */
    function setPlayUI(on) {
      playBtn.classList.toggle('playing', on);
      playBtn.setAttribute('aria-label', on ? 'Stop' : 'Play the story');
    }
    function stopPlay() { if (playing) { playing = false; window.LanternPlaying = false; setPlayUI(false); } }
    function startPlay() {
      var cur = LP.get();
      setTarget(cur >= N - 1 ? 0 : N - 1);   /* at the end → rewind home; else play to the end */
      expected = cur;
      lastStep = lastBusy = performance.now();   /* give the first screen its full beat, not an instant cut */
      playing = true; window.LanternPlaying = true; setPlayUI(true); kick();
    }
    playBtn.addEventListener('click', function () {
      if (playing) { stopPlay(); target = LP.get(); expected = LP.get(); render(); }   /* stop = freeze on this screen */
      else startPlay();
    });

    /* stay in sync if the phase moves by some other path while the deck is idle */
    setInterval(function () {
      if (dragging || rafId) return;
      var cur = LP.get();
      if (cur !== target || cur !== expected) { target = cur; expected = cur; }
      render();
    }, 300);

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
