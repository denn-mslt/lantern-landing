/* ============================================================
   Feature-zone browser morph  (sections 2 → 3 → 4 → 5)
   Mirrors the hero→save technique from lantern-morph.js:
   a fixed ghost clone interpolates between the browser rects of
   adjacent feature sections while the pager scrolls between them.
   ============================================================ */
(function () {
  function init() {
    var mqSmall  = window.matchMedia('(max-width:920px)');
    var mqMotion = window.matchMedia('(prefers-reduced-motion:reduce)');

    var browsers = [
      document.getElementById('sv-browser'),
      document.querySelector('#translate .browser'),
      document.querySelector('#discuss .disc-stage'),  // disc-stage carries the personality transform
      document.getElementById('ex-browser'),
    ];
    var sects = [
      document.getElementById('save'),
      document.getElementById('translate'),
      document.getElementById('discuss'),
      document.getElementById('exercises'),
    ];

    if (browsers.some(function (b) { return !b; }) ||
        sects.some(function (s)    { return !s; })) return;

    /* ghost — a clean clone of the save browser used as the travelling shell */
    var ghost = document.createElement('div');
    ghost.className = 'morph-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    var clone = browsers[0].cloneNode(true);
    clone.style.cssText = 'transform:none;margin:0;width:100%';
    clone.removeAttribute('id');
    ghost.appendChild(clone);
    document.body.appendChild(ghost);

    function docPos(el) {
      /* layout position via offsetParent chain (scroll-driven JS transforms don't affect this) */
      var x = 0, y = 0, n = el, w = el.offsetWidth, h = el.offsetHeight;
      while (n) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
      /* add the element's own CSS personality transform so the ghost targets the visual position */
      try {
        var mat = window.getComputedStyle(el).transform;
        if (mat && mat !== 'none') { var dm = new DOMMatrix(mat); x += dm.m41; y += dm.m42; }
      } catch (e) {}
      return { left: x, top: y, width: w, height: h };
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function ease(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; }

    var live = false, bPos = [], sCenters = [];

    function measure() {
      live = !mqSmall.matches && !mqMotion.matches;
      bPos     = browsers.map(docPos);
      sCenters = sects.map(function (s) { return s.offsetTop + s.offsetHeight / 2; });
      ghost.style.width = bPos[0].width + 'px';
    }

    function render(scroll) {
      if (!live) {
        ghost.style.opacity = '0';
        browsers.forEach(function (b) { b.style.opacity = ''; });
        return;
      }
      var vc = scroll + window.innerHeight / 2;
      var n = bPos.length, seg = -1, t = 0;
      for (var i = 0; i < n - 1; i++) {
        if (vc >= sCenters[i] && vc <= sCenters[i + 1]) {
          seg = i;
          t = clamp((vc - sCenters[i]) / (sCenters[i + 1] - sCenters[i]), 0, 1);
          break;
        }
      }
      if (seg < 0) {
        ghost.style.opacity = '0';
        browsers.forEach(function (b) { b.style.opacity = ''; });
        return;
      }

      var e    = ease(t);
      var from = bPos[seg], to = bPos[seg + 1];
      var L    = lerp(from.left, to.left, e) - window.scrollX;
      var T    = lerp(from.top,  to.top,  e) - scroll;
      var sc   = lerp(1, to.width / from.width, e);
      /* gentle arc: browser "lifts" a fraction at mid-travel */
      var arc  = Math.sin(Math.PI * e) * 12;
      /* subtle rotation that peaks mid-flight */
      var rot  = Math.sin(Math.PI * e) * 0.7;

      ghost.style.width     = from.width + 'px';
      ghost.style.transform =
        'translate(' + L.toFixed(1) + 'px,' + (T - arc).toFixed(1) + 'px)' +
        ' rotate(' + rot.toFixed(2) + 'deg)' +
        ' scale('  + sc.toFixed(4) + ')';

      /* cross-fade: ghost fades in at start of travel, out at end */
      var FADE   = 0.13;
      var fadeIn  = clamp(t / FADE, 0, 1);
      var fadeOut = clamp((1 - t) / FADE, 0, 1);
      ghost.style.opacity = Math.min(fadeIn, fadeOut).toFixed(3);

      browsers.forEach(function (b, k) {
        if (k === seg)     b.style.opacity = (1 - fadeIn ).toFixed(3);
        else if (k === seg + 1) b.style.opacity = (1 - fadeOut).toFixed(3);
        else               b.style.opacity = '';
      });
    }

    /* damped scroll loop — same feel as the site engine */
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
