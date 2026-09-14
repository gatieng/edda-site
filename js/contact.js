/**
 * contact.js
 * -----------------------------------------------------------------------------
 * Client-side validation + friendly status messaging for the contact form.
 * The actual submission will be wired to a backend later; here we just block
 * invalid inputs, show inline errors and confirm to the user.
 *
 * Accessibility (RGAA / RAWeb):
 *   - Each invalid field flips aria-invalid and surfaces a message in a
 *     polite live region (aria-live="polite") tied to it via aria-describedby.
 *   - The first invalid field receives focus.
 *   - The status line under the submit button is a polite live region so
 *     screen readers announce success / pending submissions.
 * -----------------------------------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const form = document.querySelector('.contact-form');
  if (!form) return;

  const status = form.querySelector('#cf-status');

  /** Field-level validation map */
  const rules = {
    'cf-name': (v) => v.trim().length >= 2 || 'Please enter your full name.',
    'cf-email': (v) => /^\S+@\S+\.\S+$/.test(v) || 'Please enter a valid email address.',
    'cf-message': (v) => v.trim().length >= 10 || 'Tell us a bit more (at least 10 characters).',
  };

  const setError = (field, msg) => {
    const wrap = field.closest('.contact-field');
    const err = wrap && wrap.querySelector('.contact-field__error');
    if (!wrap) return;
    if (msg) {
      wrap.classList.add('is-invalid');
      field.setAttribute('aria-invalid', 'true');
      if (err) err.textContent = msg;
    } else {
      wrap.classList.remove('is-invalid');
      field.removeAttribute('aria-invalid');
      if (err) err.textContent = '';
    }
  };

  // Validate on blur for nicer per-field UX
  Object.keys(rules).forEach((id) => {
    const f = document.getElementById(id);
    if (!f) return;
    f.addEventListener('blur', () => {
      const result = rules[id](f.value);
      setError(f, result === true ? null : result);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let firstInvalid = null;
    Object.keys(rules).forEach((id) => {
      const f = document.getElementById(id);
      if (!f) return;
      const result = rules[id](f.value);
      const msg = result === true ? null : result;
      setError(f, msg);
      if (msg && !firstInvalid) firstInvalid = f;
    });

    // Consent checkbox
    const consent = document.getElementById('cf-consent');
    if (consent && !consent.checked) {
      consent.setAttribute('aria-invalid', 'true');
      if (!firstInvalid) firstInvalid = consent;
    } else if (consent) {
      consent.removeAttribute('aria-invalid');
    }

    if (firstInvalid) {
      if (status) {
        status.textContent = 'Please review the highlighted fields above.';
        status.classList.remove('is-success');
        status.classList.add('is-error');
      }
      firstInvalid.focus();
      return;
    }

    // Backend is not wired up — show a friendly placeholder confirmation.
    if (status) {
      status.classList.remove('is-error');
      status.classList.add('is-success');
      status.textContent = 'Thanks! Your message is queued — we\'ll be in touch within one business day.';
    }
    form.reset();
  });
});
