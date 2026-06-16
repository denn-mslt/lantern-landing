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
  /* official Google Chrome mark (Feb-2022 brand SVG): gradient spokes + precise
     path coords so the red/green/yellow segments tile seamlessly. The old hand
     -trimmed flat-colour version left thin "scratch" gaps radiating from the hub.
     Gradient IDs are namespaced (chr-*) so they can't clash with page ids. */
  var CHROME =
    '<svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">' +
    '<defs>' +
    '<linearGradient id="chr-a" x1="3.2173" y1="15" x2="44.7812" y2="15" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d93025"/><stop offset="1" stop-color="#ea4335"/></linearGradient>' +
    '<linearGradient id="chr-b" x1="20.7219" y1="47.6791" x2="41.5039" y2="11.6837" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fcc934"/><stop offset="1" stop-color="#fbbc04"/></linearGradient>' +
    '<linearGradient id="chr-c" x1="26.5981" y1="46.5015" x2="5.8161" y2="10.506" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1e8e3e"/><stop offset="1" stop-color="#34a853"/></linearGradient>' +
    '</defs>' +
    '<circle cx="24" cy="23.9947" r="12" fill="#fff"/>' +
    '<path d="M24,12H44.7812a23.9939,23.9939,0,0,0-41.5639.0029L13.6079,30l.0093-.0024A11.9852,11.9852,0,0,1,24,12Z" fill="url(#chr-a)"/>' +
    '<circle cx="24" cy="24" r="9.5" fill="#1a73e8"/>' +
    '<path d="M34.3913,30.0029,24.0007,48A23.994,23.994,0,0,0,44.78,12.0031H23.9989l-.0025.0093A11.985,11.985,0,0,1,34.3913,30.0029Z" fill="url(#chr-b)"/>' +
    '<path d="M13.6086,30.0031,3.218,12.006A23.994,23.994,0,0,0,24.0025,48L34.3931,30.0029l-.0067-.0068a11.9852,11.9852,0,0,1-20.7778.007Z" fill="url(#chr-c)"/>' +
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
