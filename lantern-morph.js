/* ============================================================
   Hero → "Save & simplify" browser morph.
   One browser appears to travel from the hero stage into the
   section-1 demo slot as you scroll. Everything else (hero copy,
   word cards, sidebar) fades with the section; the browser stays
   crisp and repositions. A fixed "ghost" clone does the travel,
   cross-fading with the real hero browser at the start and the
   real #sv-browser (driven by act1.js) at the end.

   Uses a DAMPED scroll value (matching the site's smooth engine)
   so the travel glides even though the page uses scroll-snap.
   Isolated: only toggles opacity on the two real browsers.
   ============================================================ */
(function () {
  function init() {
    var heroBrowser = document.querySelector('#hero .browser');
    var dest = document.getElementById('sv-browser');
    var hero = document.getElementById('hero');
    var save = document.getElementById('save');
    if (!heroBrowser || !dest || !hero || !save) return;

    var mqSmall = window.matchMedia('(max-width:920px)');
    var mqMotion = window.matchMedia('(prefers-reduced-motion:reduce)');

    // fixed ghost = clone of the hero browser's look
    var ghost = document.createElement('div');
    ghost.className = 'morph-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    var clone = heroBrowser.cloneNode(true);
    clone.style.transform = 'none';
    clone.style.margin = '0';
    clone.style.width = '100%';
    ghost.appendChild(clone);
    document.body.appendChild(ghost);

    // document-space layout position (ignores CSS transforms: bob, parallax, rise/zoom)
    function docPos(el) {
      var x = 0, y = 0, n = el;
      var w = el.offsetWidth, h = el.offsetHeight;
      while (n) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      return { left: x, top: y, width: w, height: h };
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
    function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

    var hs, ds, c0, c1, live = true;
    function measure() {
      live = !mqSmall.matches && !mqMotion.matches;
      hs = docPos(heroBrowser);
      ds = docPos(dest);
      ghost.style.width = hs.width + 'px';
      c0 = hero.offsetTop + hero.offsetHeight / 2;
      c1 = save.offsetTop + save.offsetHeight / 2;
    }

    function render(scroll) {
      if (!live) { ghost.style.opacity = '0'; heroBrowser.style.opacity = ''; dest.style.opacity = ''; return; }
      var vc = scroll + window.innerHeight / 2;
      var p = clamp((vc - c0) / ((c1 - c0) || 1), 0, 1);
      var e = ease(p);
      var L = lerp(hs.left, ds.left, e) - window.scrollX;
      var T = lerp(hs.top, ds.top, e) - scroll;
      var rot = lerp(1.5, 0, e);
      var sc = lerp(1, ds.width / hs.width, e);
      ghost.style.transform = 'translate(' + L.toFixed(1) + 'px,' + T.toFixed(1) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';

      // cross-fades: hero browser -> ghost (first 8%), ghost -> real demo browser (last 14%)
      var fin = clamp(p / 0.08, 0, 1);
      var fout = clamp((1 - p) / 0.14, 0, 1);
      ghost.style.opacity = Math.min(fin, fout).toFixed(3);
      heroBrowser.style.opacity = (1 - fin).toFixed(3);
      dest.style.opacity = (1 - fout).toFixed(3);
    }

    // damped scroll loop (same feel as the site's engine) so snap doesn't make it blink
    var cur = window.scrollY, running = false;
    function tick() {
      cur += (window.scrollY - cur) * 0.12;
      if (Math.abs(window.scrollY - cur) < 0.4) cur = window.scrollY;
      render(cur);
      if (cur !== window.scrollY) requestAnimationFrame(tick);
      else running = false;
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(tick); } }

    measure(); render(window.scrollY); cur = window.scrollY;
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', function () { measure(); cur = window.scrollY; render(cur); });
    if (window.whenFontsReady) window.whenFontsReady(function () { measure(); render(cur); });
    setTimeout(function () { measure(); render(window.scrollY); }, 600);
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
