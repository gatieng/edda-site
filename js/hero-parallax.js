/* ============================================================
   Hero parallax — gentle vertical drift of the background orbs
   as the page scrolls. Theme: indigo aurora (brand-aligned).
   Disabled when the user prefers reduced motion.
   ============================================================ */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var root = document.querySelector('[data-parallax-root]');
  if (!root) return;

  var orbs = Array.prototype.slice.call(root.querySelectorAll('[data-parallax-speed]'));
  if (!orbs.length) return;

  var ticking = false;

  function update() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    for (var i = 0; i < orbs.length; i++) {
      var speed = parseFloat(orbs[i].getAttribute('data-parallax-speed')) || 0.1;
      orbs[i].style.transform = 'translate3d(0,' + (y * speed).toFixed(1) + 'px,0)';
    }
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
})();
