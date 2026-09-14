/**
 * header-scroll.js
 * -----------------------------------------------------------------------------
 * Hides the floating header pill once the visitor scrolls past the hero zone
 * (boundary = top of the #services section). The pill slides back into view
 * whenever the visitor scrolls upwards, or whenever the viewport returns to
 * the hero zone.
 *
 * Accessibility notes (RAWeb / RGAA):
 *   - The header is only visually hidden; its content remains in the DOM, so
 *     the skip-links and screen-reader access are unaffected (RGAA 13.1).
 *   - The transition honours `prefers-reduced-motion: reduce`, handled in CSS.
 *   - The mobile dialog forces the header back into view, so it is never
 *     possible to lose access to the menu while the dialog is open (RGAA 7.1).
 * -----------------------------------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const header = document.querySelector('.site-header');
  const trigger = document.getElementById('services');
  if (!header) return;

  // Minimum vertical movement (in px) before a direction change is honoured.
  // Prevents the header from flickering on tiny scroll wobbles (trackpads).
  const HIDE_THRESHOLD = 6;

  // Extra room above the trigger so the pill starts hiding slightly before
  // the section reaches the viewport top.
  const TRIGGER_BUFFER = 80;

  // Fallback for pages that don't have a #services anchor (sub-pages).
  // Hide once we are past the first section, which is roughly viewport height.
  const FALLBACK_TRIGGER = () => Math.max(window.innerHeight * 0.6, 480);

  let lastY = window.scrollY;
  let triggerTop = 0;

  /** Recomputes the absolute Y of the trigger section. */
  const measure = () => {
    triggerTop = trigger
      ? trigger.getBoundingClientRect().top + window.scrollY
      : FALLBACK_TRIGGER();
  };
  measure();

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const y = window.scrollY;
      const delta = y - lastY;
      const inHeroZone = y < triggerTop - TRIGGER_BUFFER;
      const navOpen = document.body.classList.contains('nav-open');

      // 1. Hero zone or open dialog: header always visible.
      if (inHeroZone || navOpen) {
        header.classList.remove('is-hidden');
      }
      // 2. Past the hero zone, scrolling down past the threshold: hide.
      else if (delta > HIDE_THRESHOLD) {
        header.classList.add('is-hidden');
      }
      // 3. Scrolling up past the threshold: reveal.
      else if (delta < -HIDE_THRESHOLD) {
        header.classList.remove('is-hidden');
      }

      lastY = y;
      ticking = false;
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });

  // Recompute trigger position when layout may have changed.
  window.addEventListener('resize', () => {
    measure();
    onScroll();
  });
  window.addEventListener('load', measure);
});
