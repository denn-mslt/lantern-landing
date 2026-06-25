/* ============================================================
   Lantern Landing — DESKTOP left chapter-index rail
   (council verdict "The Wick", 7-persona vote)

   The bottom media-player retires; navigation becomes a LEFT
   vertical table-of-contents: all 8 chapters stacked top->bottom,
   threaded by an amber "wick" whose lit bead rides to the current
   screen. PLAY auto-walks the whole story; click any chapter to
   jump; arrow keys walk it. Driven entirely through
   window.LanternPhases — the desktop page is ONE screen (no
   document scroll), every phase is a morph in place, so the rail
   just reads and drives phases.

   Why a named list (6/7): the owner's complaint is "people don't
   realize they can move." A hidden bead conceals the other screens;
   showing all 8 named chapters makes the depth self-evident.
   ============================================================ */
(function () {
  var N = 8;
  /* NAMES indexed by INTERNAL phase; VIS_PHASE maps visual pos -> internal
     phase (Practice/Discuss swapped), matching LanternPhases.pos()/jump(). */
  var NAMES = ['HOME', 'SIMPLIFY', 'TRANSLATE', 'IMMERSE', 'DISCUSS', 'PRACTICE', 'EVERYWHERE', 'INSTALL'];
  var VIS_PHASE = [0, 1, 2, 3, 5, 4, 6, 7];
  var DWELL = 1150;                 /* manual walk speed cap per phase */
  var BREATH = 600;                 /* PLAY: beat after a scene finishes before the next */
  var MAX_SCENE = 18000;            /* PLAY: safety cap so a stuck scene can't hang the reel */

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function visName(vis) { return NAMES[VIS_PHASE[vis]] || NAMES[vis]; }

  function init() {
    if (window.innerWidth <= 920) return;        /* desktop only; mobile uses .m-navcluster */
    var LP = window.LanternPhases;
    if (!LP) return;

    var deck = document.createElement('div');
    deck.id = 'd-deck';

    var rows = '';
    for (var i = 0; i < N; i++) {
      rows +=
        '<button class="d-chap" type="button" data-vis="' + i + '" ' +
                'aria-label="Go to screen ' + (i + 1) + ': ' + visName(i) + '">' +
          '<i class="d-chap-num">' + pad(i + 1) + '</i>' +
          '<span class="d-chap-name">' + visName(i) + '</span>' +
        '</button>';
    }

    deck.innerHTML =
      '<div class="d-head">' +
        '<button class="d-playbtn" id="d-play" type="button" aria-label="Play the story">' +
          '<svg class="ic-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>' +
          '<svg class="ic-stop" viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2"/></svg>' +
        '</button>' +
        '<div class="d-count" aria-hidden="true"><span class="d-cn" id="d-cn">01</span><span>/ ' + pad(N) + '</span></div>' +
      '</div>' +
      '<nav class="d-rail" id="d-rail" aria-label="Story chapters">' +
        '<div class="d-wick" aria-hidden="true"></div>' +
        '<div class="d-wick-fill" id="d-fill" aria-hidden="true"></div>' +
        '<div class="d-bead" id="d-bead" aria-hidden="true"></div>' +
        rows +
        /* council (unanimous, 7/7): first-timers don't know the page is scrollytelling.
           A bobbing down-chevron — sat on the wick just under the lit bead — tells them
           the story keeps going down. No label: the arrow says it. Shown on HOME, fades
           once they go. */
        '<div class="d-hint" id="d-hint" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>' +
        '</div>' +
      '</nav>' +
      '<div class="d-live" id="d-live" aria-live="polite" ' +
           'style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap"></div>';
    document.body.appendChild(deck);

    var chaps   = [].slice.call(deck.querySelectorAll('.d-chap'));
    var fillEl  = deck.querySelector('#d-fill');
    var beadEl  = deck.querySelector('#d-bead');
    var cnEl    = deck.querySelector('#d-cn');
    var playBtn = deck.querySelector('#d-play');
    var hint    = deck.querySelector('#d-hint');
    var live    = deck.querySelector('#d-live');
    var rail    = deck.querySelector('#d-rail');

    var target   = LP.pos();          /* where the user pointed (visual pos) */
    var expected = LP.get();          /* the internal phase the rail last set itself */
    var lastStep = 0, lastBusy = 0;
    var playing  = false, rafId = 0;
    var lastVis  = -1;

    /* place the lit bead at the active row's centre + fill the wick down to it.
       Measured in px from real geometry, so gaps/clamps never drift it. */
    function positionBead() {
      var vis = LP.pos();
      var c = chaps[vis]; if (!c) return;
      var top = c.offsetTop + c.offsetHeight / 2;   /* relative to .d-rail */
      beadEl.style.top = top + 'px';
      fillEl.style.height = Math.max(0, top - 6) + 'px';
      /* park the Scroll cue just under the active row, in the empty name column */
      if (hint) hint.style.top = (c.offsetTop + c.offsetHeight + 6) + 'px';
    }

    function render() {
      var vis = LP.pos();
      for (var i = 0; i < chaps.length; i++) {
        chaps[i].classList.toggle('on', i === vis);
        chaps[i].classList.toggle('passed', i < vis);
      }
      positionBead();

      /* odometer counter — the number rolls up on every change */
      var txt = pad(vis + 1);
      if (cnEl.textContent !== txt) {
        cnEl.textContent = txt;
        cnEl.classList.remove('roll'); void cnEl.offsetWidth; cnEl.classList.add('roll');
      }

      if (hint) hint.classList.toggle('show', LP.get() === 0);

      if (vis !== lastVis) {
        lastVis = vis;
        if (live) live.textContent = 'Screen ' + (vis + 1) + ' of ' + N + ': ' + visName(vis);
      }
    }

    /* one walk engine for PLAY / keyboard, two cadences:
       - PLAY forward = cinema: step only once the phase's scripted scene has
         played out (actionPlaying clears), then a BREATH; a safety cap steps
         anyway if a scene forgets to release.
       - keyboard / rewind = snappy: DWELL-capped, gated only by busy(). */
    function walk() {
      rafId = 0;
      var cur = LP.get();
      var vis = LP.pos();

      /* a phase change the rail didn't make = the user took the wheel → hand
         control straight back. Manual always wins. */
      if (cur !== expected) {
        if (playing) stopPlay();
        target = vis; expected = cur; render(); return;
      }
      if (vis === target) { render(); if (playing) stopPlay(); return; }

      var now = performance.now(), dir = vis < target ? 1 : -1, ready;
      if (playing && dir > 0) {
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
    function setTarget(p) { target = Math.max(0, Math.min(N - 1, p)); }

    /* ── click a chapter → jump straight there (no story walk-through) ── */
    chaps.forEach(function (c) {
      c.addEventListener('click', function () {
        stopPlay();
        var p = parseInt(c.getAttribute('data-vis'), 10);
        if (LP.jump) { LP.jump(p); target = LP.pos(); expected = LP.get(); render(); }
      });
    });

    /* ── keyboard: Up/Down (and Left/Right) walk the story; owns its arrows ── */
    rail.addEventListener('keydown', function (e) {
      var vis = LP.pos(), handled = true;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') setTarget(vis + 1);
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') setTarget(vis - 1);
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
      var cur = LP.pos();
      setTarget(cur >= N - 1 ? 0 : N - 1);       /* at the end → rewind home; else play to the end */
      expected = LP.get();
      lastStep = lastBusy = performance.now();    /* give the first screen its full beat */
      playing = true; window.LanternPlaying = true; setPlayUI(true); kick();
    }
    playBtn.addEventListener('click', function (e) {
      if (playing) { stopPlay(); target = LP.pos(); expected = LP.get(); render(); }
      else startPlay();
      if (e.detail) playBtn.blur();               /* drop the lingering ring on mouse activation */
    });

    /* stay in sync if the phase moves by some other path while the rail is idle */
    setInterval(function () {
      if (rafId) return;
      var cur = LP.get(), vis = LP.pos();
      if (vis !== target || cur !== expected) { target = vis; expected = cur; }
      render();
    }, 300);

    window.addEventListener('resize', positionBead);

    render();
    requestAnimationFrame(positionBead);          /* geometry final → place the bead precisely */
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
