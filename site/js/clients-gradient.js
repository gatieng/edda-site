/**
 * clients-gradient.js
 * -----------------------------------------------------------------------------
 * Mouse-follow blob for the animated gradient background in #clients.
 * Inspired by https://github.com/baunov/gradients-bg.
 *
 * The follow blob ("lava lamp") smoothly shifts toward the colour of whichever
 * sector card the cursor is over (Finance, Industry, …) and eases back to the
 * brand violet otherwise.
 *
 * Accessibility (RGAA 13.1):
 *   - The entire .gradient-bg container is `aria-hidden="true"` (decorative).
 *   - Pointer tracking is disabled when `prefers-reduced-motion: reduce`.
 * -----------------------------------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const section = document.getElementById('clients');
  const bubble = section && section.querySelector('.interactive');
  if (!section || !bubble) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const DEFAULT_COLOR = [140, 100, 255];

  let curX = 0, curY = 0, tgX = 0, tgY = 0;
  let active = false;

  // Smoothly-lerped blob colour.
  let curC = DEFAULT_COLOR.slice();
  let tgC = DEFAULT_COLOR.slice();

  // Resolve each sector card's target colour from its heading.
  const cards = Array.from(section.querySelectorAll('.sector-card'));
  const cardColors = new Map();
  cards.forEach((card) => {
    const head = card.querySelector('h3');
    let rgb = DEFAULT_COLOR;
    if (head) {
      const m = getComputedStyle(head).color.match(/\d+/g);
      if (m && m.length >= 3) {
        rgb = m.slice(0, 3).map((v) => +v);
      }
    }
    cardColors.set(card, rgb);
  });

  function move() {
    curX += (tgX - curX) / 20;
    curY += (tgY - curY) / 20;
    for (let i = 0; i < 3; i++) curC[i] += (tgC[i] - curC[i]) / 30;
    bubble.style.transform =
      `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`;
    section.style.setProperty('--color-interactive',
      `${Math.round(curC[0])}, ${Math.round(curC[1])}, ${Math.round(curC[2])}`);
    if (active) requestAnimationFrame(move);
  }

  section.addEventListener('pointerenter', () => {
    if (active) return;
    active = true;
    move();
  });

  section.addEventListener('pointerleave', () => {
    active = false;
    tgX = 0;
    tgY = 0;
    tgC = DEFAULT_COLOR.slice();
    section.classList.remove('is-sector-tint');
  });

  section.addEventListener('pointermove', (e) => {
    const rect = section.getBoundingClientRect();
    tgX = e.clientX - rect.left - rect.width / 2;
    tgY = e.clientY - rect.top - rect.height / 2;
    const card = e.target.closest && e.target.closest('.sector-card');
    tgC = (card && cardColors.get(card)) || DEFAULT_COLOR.slice();
    section.classList.toggle('is-sector-tint', !!card);
  });

  const cta = section.querySelector('.clients-cta');
  if (cta) {
    cta.addEventListener('pointerenter', () => {
      section.classList.add('is-cta-hover');
    });
    cta.addEventListener('pointerleave', () => {
      section.classList.remove('is-cta-hover');
    });
  }
});
