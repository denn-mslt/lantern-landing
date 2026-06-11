/* ============================================================
   Lantern Landing v3 — THE CLOSE: "Day one"
   The install button IS day one of a reading streak. It sits at the head
   of a row of future day-cells (2..10) that fade toward a "→". Hover or
   focus the button and the streak lights up amber, one day at a time —
   "your streak starts the second you install". On touch (no hover) the
   streak lights once as the row scrolls into view and stays lit.
   Ported from the Day-one design handoff. Self-builds the button content
   and the day cells; fully guarded for reduced motion.
   ============================================================ */
(function () {
  var CHROME =
    '<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">' +
    '<circle cx="24" cy="24" r="22" fill="#fff"/>' +
    '<path d="M24 6 A18 18 0 0 1 39.6 15 L24 15 A9 9 0 0 0 16.2 19.5 Z" fill="#ea4335"/>' +
    '<path d="M39.6 15 A18 18 0 0 1 31.8 39.3 L24 24 A9 9 0 0 0 24 15 Z" fill="#fbbc04"/>' +
    '<path d="M8.4 15 A18 18 0 0 0 24 42 L31.8 28.5 A9 9 0 0 1 16.2 28.5 Z" fill="#34a853"/>' +
    '<path d="M24 6 A18 18 0 0 0 8.4 15 L16.2 28.5 A9 9 0 0 1 16.2 19.5 Z" fill="#4285f4"/>' +
    '<circle cx="24" cy="24" r="9.5" fill="#fff"/>' +
    '<circle cx="24" cy="24" r="7.5" fill="#1a73e8"/>' +
    '</svg>';
  var ARROW =
    '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" ' +
    'stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h13M12 6l6 6-6 6"/></svg>';

  function init() {
    var wrap = document.querySelector('.d1-wrap');
    if (!wrap || wrap.dataset.built) return;
    wrap.dataset.built = '1';

    var reduced   = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var hoverable = matchMedia('(hover: hover)').matches;

    // ---- build the install button content (chrome mark + label + arrow) ----
    var btn = wrap.querySelector('[data-cta]');
    if (btn && !btn.childElementCount) {
      var c = document.createElement('span'); c.className = 'd1-chrome'; c.innerHTML = CHROME;
      var t = document.createElement('span'); t.textContent = 'Add Lantern to Chrome';
      var a = document.createElement('span'); a.className = 'd1-arrow'; a.innerHTML = ARROW;
      btn.append(c, t, a);
    }

    // ---- build the future day cells (2..10) + the trailing arrow ----
    var track = wrap.querySelector('.d1-track');
    var futures = [];
    if (track) {
      for (var d = 2; d <= 10; d++) {
        var cell = document.createElement('span');
        cell.className = 'd1-daycell future';
        cell.textContent = d;
        cell.style.opacity = (1 - (d - 2) * 0.085).toFixed(2);
        track.appendChild(cell);
        futures.push(cell);
      }
      var more = document.createElement('span'); more.className = 'd1-more'; more.textContent = '→';
      track.appendChild(more);
    }
    try { window.dispatchEvent(new Event('resize')); } catch (e) {}   // re-measure section height

    if (!btn || !futures.length) return;

    // ---- the cascade: light the streak growing, one day at a time ----
    var timers = [];
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }
    function lightUp(stagger) {
      clearTimers();
      futures.forEach(function (f, i) {
        if (stagger) timers.push(setTimeout(function () { f.classList.add('lit'); }, 80 + i * 70));
        else f.classList.add('lit');
      });
    }
    function lightDown() { clearTimers(); futures.forEach(function (f) { f.classList.remove('lit'); }); }

    if (hoverable) {
      btn.addEventListener('mouseenter', function () { lightUp(!reduced); });
      btn.addEventListener('mouseleave', lightDown);
      btn.addEventListener('focus', function () { lightUp(!reduced); });
      btn.addEventListener('blur', lightDown);
    } else if ('IntersectionObserver' in window) {
      // touch: the streak starts as the row lands, and stays lit
      new IntersectionObserver(function (ents, obs) {
        ents.forEach(function (en) { if (en.isIntersecting) { lightUp(!reduced); obs.disconnect(); } });
      }, { threshold: 0.55 }).observe(track);
    } else {
      lightUp(false);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
