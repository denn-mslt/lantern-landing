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
  var N = 7;                       /* phases 0..6 */
  var DWELL = 1150;                /* min ms between phase steps — the speed cap */
  var NAMES = ['HOME', 'SIMPLIFY', 'TRANSLATE', 'DISCUSS', 'PRACTICE', 'EVERYWHERE', 'INSTALL'];

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
    var lastStep = 0;
    var dragging = false;

    function pct(p) { return (p / (N - 1) * 100) + '%'; }

    function render() {
      var cur = LP.get();
      if (!dragging) {
        ball.style.left = pct(cur);
        fill.style.width = pct(cur);
      }
      ticks.forEach(function (t, i) { t.classList.toggle('passed', i <= cur); });
      var chasing = (cur !== target);
      scrub.classList.toggle('chasing', chasing);
      if (chasing) goal.style.left = pct(target);
    }

    /* chase engine: walk one phase toward the goal, never faster than DWELL */
    var rafId = 0;
    function chase() {
      rafId = 0;
      var cur = LP.get();
      if (cur === target) { render(); return; }
      var now = performance.now();
      if (now - lastStep >= DWELL && !LP.busy()) {
        if (LP.step(cur < target ? 1 : -1)) lastStep = now;
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
    function setTarget(f) {
      var t = Math.round(f * (N - 1));
      if (t !== target) {
        target = t;
        if (cap && NAMES[t]) cap.textContent = '0' + (t + 1) + ' · ' + NAMES[t];
      }
    }

    var pointerDownX = 0, pointerDownY = 0, wasDrag = false;
    scrub.addEventListener('pointerdown', function (e) {
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
        LP.jump(target);
        render();
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
      if (dragging) return;
      if (!rafId && LP.get() !== target) target = LP.get();
      render();
    }, 300);

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
