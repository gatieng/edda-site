/**
 * who-we-are.js
 * -----------------------------------------------------------------------------
 * Two enhancements on the Who We Are page:
 *
 *   1. Horizontal parallax on the team photo strip. The track translates left
 *      as the visitor scrolls, while the hero is in view. Driven by scroll
 *      position (passive listener, requestAnimationFrame).
 *
 *   2. Count-up animation on the three stat numbers (years / experts /
 *      customers) once the stats section enters the viewport.
 *
 * Accessibility (RGAA 13.1):
 *   - `prefers-reduced-motion: reduce` disables both the parallax and the
 *     count-up; the final numbers are shown immediately.
 * -----------------------------------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ----- 1. Horizontal parallax on the team strip -------------------------
  const track = document.querySelector('[data-parallax-track]');
  const hero = document.querySelector('.wwa-hero');
  if (track && hero && !reduced) {
    // Distance (px) the track will travel between hero-top and hero-bottom.
    // Capped so very tall tracks don't shoot off to infinity.
    const MAX_OFFSET = 480;

    let ticking = false;
    const update = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        // 0 when hero-top hits the viewport top, 1 when hero is fully scrolled past.
        const total = rect.height + window.innerHeight;
        const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / total));
        const offset = -progress * MAX_OFFSET;
        track.style.transform = `translate3d(${offset}px, 0, 0)`;
        ticking = false;
      });
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // ----- 2. Count-up on stats ---------------------------------------------
  // ----- 3. Timeline parallax entrance ------------------------------------
  const timelineItems = document.querySelectorAll('[data-timeline-item]');
  if (timelineItems.length > 0) {
    if (reduced || typeof IntersectionObserver !== 'function') {
      timelineItems.forEach((el) => el.classList.add('is-in'));
    } else {
      const tlObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            tlObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.25, rootMargin: '0px 0px -10% 0px' });
      timelineItems.forEach((el) => tlObserver.observe(el));
    }
  }

  const counters = document.querySelectorAll('[data-count-to]');
  if (counters.length === 0) return;

  if (reduced || typeof IntersectionObserver !== 'function') {
    counters.forEach((el) => {
      el.textContent = el.getAttribute('data-count-to');
    });
    return;
  }

  // Reset to 0 until they animate in
  counters.forEach((el) => { el.textContent = '0'; });

  const animate = (el) => {
    const target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = String(target);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animate(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach((el) => io.observe(el));
});
