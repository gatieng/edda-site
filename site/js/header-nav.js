/**
 * header-nav.js
 * -----------------------------------------------------------------------------
 * Mobile navigation pattern inspired by the French government's design system
 * (DSFR / https://www.systeme-de-design.gouv.fr).
 * Implements the WAI-ARIA "dialog" pattern for the fullscreen mobile menu.
 *
 * Accessibility (RAWeb / RGAA in parentheses):
 *   - The trigger button exposes aria-expanded / aria-controls /
 *     aria-haspopup="dialog" (RGAA 7.1).
 *   - At open time the panel receives role="dialog" + aria-modal="true" +
 *     aria-labelledby="nav-title" (RGAA 7.1, 12.1).
 *   - Focus moves into the dialog (Close button) on open, and is restored
 *     to the previously focused element on close (RGAA 7.1, 10.7).
 *   - Escape closes the dialog (RGAA 7.1).
 *   - Tab / Shift+Tab are trapped between the Close button and the menu
 *     links (RGAA 7.1).
 *   - Resizing back to desktop while open closes the dialog cleanly
 *     (RGAA 10.4).
 * -----------------------------------------------------------------------------
 */
(function () {
  'use strict';

  // Run as soon as the DOM is ready. Works both when the script is loaded
  // with `defer` (DOM already parsed) and when included inline elsewhere.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    // Randomise the "open positions" badge (8–12) on each load.
    const openRoles = 8 + Math.floor(Math.random() * 5);
    document.querySelectorAll('.nav-badge').forEach((b) => {
      b.textContent = String(openRoles);
      b.setAttribute('aria-label', openRoles + ' open positions');
    });

    const toggle = document.querySelector('.nav-toggle');
    const nav = document.getElementById('primary-nav');
    const closeBtn = nav && nav.querySelector('.nav-close');
    if (!toggle || !nav || !closeBtn) return;

    // -- Mobile-only Contact entry ------------------------------------------
    // The desktop pill has a Contact CTA on the right. On mobile the pill is
    // reduced to brand + burger (CSS), and the Contact link is mirrored into
    // the menu list so it's still reachable from the dialog.
    const headerCta = document.querySelector('.header-pill > .header-cta');
    const navList = nav.querySelector('nav > ul');
    if (headerCta && navList && !navList.querySelector('.header-nav__mobile-contact')) {
      const li = document.createElement('li');
      li.className = 'header-nav__mobile-contact';
      const a = document.createElement('a');
      a.href = headerCta.getAttribute('href') || '#';
      a.textContent = headerCta.textContent.trim() || 'Contact';
      if (headerCta.getAttribute('aria-current')) {
        a.setAttribute('aria-current', headerCta.getAttribute('aria-current'));
      }
      li.appendChild(a);
      navList.appendChild(li);
    }

    // -- Submenu (dropdown) logic --------------------------------------------
    const submenuItems = nav.querySelectorAll('.has-submenu');

    // Polite live region used to announce submenu state changes to screen
    // readers. Needed because focus often leaves the toggle button at the
    // moment the panel closes (e.g. Tab off the last submenu link), so the
    // button's own aria-expanded change is never spoken (RGAA 7.1, 9.4).
    let submenuStatus = document.getElementById('submenu-status');
    if (!submenuStatus) {
      submenuStatus = document.createElement('div');
      submenuStatus.id = 'submenu-status';
      submenuStatus.className = 'sr-only';
      submenuStatus.setAttribute('role', 'status');
      submenuStatus.setAttribute('aria-live', 'polite');
      document.body.appendChild(submenuStatus);
    }
    const announceSubmenu = (item, open) => {
      const btn = item.querySelector('.header-nav__submenu-toggle');
      const label = btn ? btn.textContent.trim().replace(/\s+/g, ' ') : 'Submenu';
      // Clear first so repeated identical messages are re-announced.
      submenuStatus.textContent = '';
      window.requestAnimationFrame(() => {
        submenuStatus.textContent = open
          ? label + ' submenu expanded'
          : label + ' submenu collapsed';
      });
    };

    /**
     * Toggle a single submenu's visible/focusable state.
     * `inert` removes the closed panel's links from the tab sequence so
     * keyboard users don't land on invisible items inside a collapsed
     * submenu (RGAA 7.1, 10.7).
     */
    const setSubmenuOpen = (item, open) => {
      const btn = item.querySelector('.header-nav__submenu-toggle');
      const panel = item.querySelector('.header-nav__submenu');
      item.classList.toggle('is-open', open);
      if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (panel) {
        if (open) panel.removeAttribute('inert');
        else panel.setAttribute('inert', '');
      }
      announceSubmenu(item, open);
    };

    const closeAllSubmenus = (except) => {
      submenuItems.forEach((item) => {
        if (item === except) return;
        if (!item.classList.contains('is-open')) return;
        setSubmenuOpen(item, false);
      });
    };

    submenuItems.forEach((item) => {
      const btn = item.querySelector('.header-nav__submenu-toggle');
      const panel = item.querySelector('.header-nav__submenu');
      if (!btn || btn.dataset.submenuInit === 'true') return;
      btn.dataset.submenuInit = 'true';

      // Initial state: closed submenus are inert so Tab skips over them.
      if (panel && !item.classList.contains('is-open')) {
        panel.setAttribute('inert', '');
      }

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const willOpen = !item.classList.contains('is-open');
        closeAllSubmenus(item);
        setSubmenuOpen(item, willOpen);
      });

      // Close submenu only when keyboard focus has truly left the item.
      // `e.relatedTarget` is unreliable during Tab (some browsers report it
      // as null mid-transition, which would close the panel while the user
      // is still tabbing INTO it). Defer the check and read the settled
      // document.activeElement instead (RGAA 7.1, 10.7).
      item.addEventListener('focusout', () => {
        if (!item.classList.contains('is-open')) return;
        setTimeout(() => {
          if (!item.classList.contains('is-open')) return;
          if (item.contains(document.activeElement)) return;
          setSubmenuOpen(item, false);
        }, 0);
      });
    });

    document.addEventListener('click', (e) => {
      submenuItems.forEach((item) => {
        if (item.classList.contains('is-open') && !item.contains(e.target)) {
          setSubmenuOpen(item, false);
        }
      });
    });
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      submenuItems.forEach((item) => {
        if (!item.classList.contains('is-open')) return;
        const t = item.querySelector('.header-nav__submenu-toggle');
        setSubmenuOpen(item, false);
        if (t) t.focus();
      });
    });

    // Tag the trigger so a second script include can't double-bind handlers.
    if (toggle.dataset.navInit === 'true') return;
    toggle.dataset.navInit = 'true';

    // Breakpoint mirrored from css/styles.css.
    const MOBILE_QUERY = '(max-width: 900px)';
    const mql = window.matchMedia(MOBILE_QUERY);

    const isOpen = () => document.body.classList.contains('nav-open');
    const isMobile = () => mql.matches;

    /**
     * Focusable elements inside the dialog, in tab order.
     * The Close button is always the first trap target so the cycle loops
     * back to it after the last link.
     */
    const getTrapTargets = () => {
      const selector =
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
      return Array.from(nav.querySelectorAll(selector)).filter(
        (el) =>
          (el.offsetParent !== null || el === closeBtn) &&
          // Skip anything inside a closed submenu (panel has [inert]).
          el.closest('[inert]') === null
      );
    };

    // Element that had focus before the dialog opened (restored on close).
    let lastFocused = null;

    /** Open the dialog (mobile only, no-op otherwise). */
    const openMenu = () => {
      if (!isMobile() || isOpen()) return;
      lastFocused = document.activeElement;

      toggle.setAttribute('aria-expanded', 'true');
      nav.setAttribute('role', 'dialog');
      nav.setAttribute('aria-modal', 'true');
      nav.setAttribute('aria-labelledby', 'nav-title');
      document.body.classList.add('nav-open');

      // Defer focus to next frame so the dialog is visible before focusing.
      requestAnimationFrame(() => closeBtn.focus());
    };

    /**
     * Close the dialog.
     * `restoreFocus` is true by default; pass false when the focus target is
     * already moving elsewhere (e.g. a navigation link was activated).
     */
    const closeMenu = (options) => {
      if (!isOpen()) return;
      const restoreFocus = !options || options.restoreFocus !== false;

      toggle.setAttribute('aria-expanded', 'false');
      nav.removeAttribute('role');
      nav.removeAttribute('aria-modal');
      nav.removeAttribute('aria-labelledby');
      document.body.classList.remove('nav-open');

      if (restoreFocus) {
        const target =
          lastFocused && document.contains(lastFocused) ? lastFocused : toggle;
        if (target && typeof target.focus === 'function') target.focus();
      }
    };

    // -- Event wiring -------------------------------------------------------

    toggle.addEventListener('click', () => {
      if (isOpen()) closeMenu();
      else openMenu();
    });

    closeBtn.addEventListener('click', () => closeMenu());

    // Clicking a link inside the dialog dismisses it; the browser is about
    // to move focus to the anchor target — don't restore previous focus.
    nav.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (link) closeMenu({ restoreFocus: false });
    });

    // Escape closes; Tab is trapped within the dialog.
    document.addEventListener('keydown', (e) => {
      if (!isOpen()) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }

      if (e.key !== 'Tab') return;

      const targets = getTrapTargets();
      if (targets.length === 0) return;

      const first = targets[0];
      const last = targets[targets.length - 1];
      const active = document.activeElement;

      // Forward Tab from last → first (loops back to Close button)
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
      // Backward Shift+Tab from first → last
      else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
      // If focus has escaped the trap, pull it back to the first target.
      else if (!targets.includes(active)) {
        e.preventDefault();
        first.focus();
      }
    });

    // Tidy up if the viewport crosses back to desktop while open.
    // Older Safari uses `addListener`; modern engines use `addEventListener`.
    const onMqlChange = (e) => {
      if (!e.matches && isOpen()) closeMenu({ restoreFocus: false });
    };
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', onMqlChange);
    } else if (typeof mql.addListener === 'function') {
      mql.addListener(onMqlChange);
    }
  }
})();
