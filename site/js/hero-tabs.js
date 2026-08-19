/* ============================================================
   Hero à onglets glissants — logique d'interaction.

   Ce que fait ce script :
   1. positionne et dimensionne l'indicateur blanc sur l'onglet actif
      (mesure réelle du bouton, donc insensible à la longueur des
      libellés et au nombre d'onglets) ;
   2. adapte la durée du glissement à la distance parcourue — sur la
      référence, un saut 4× plus long ne dure que ~1,8× plus longtemps ;
   3. masque le libellé de l'indicateur pendant le trajet ;
   4. calcule pour chaque slide son décalage horizontal (`--shift`) afin
      que le texte se place au-dessus de son onglet ;
   5. applique la palette de formes animées de la practice active, par
      alternance de deux champs A/B croisés en fondu ;
   6. fait défiler automatiquement, et FIGE ce défilement au clic sur un
      onglet — un nouveau clic sur l'onglet déjà actif le relance.
   ============================================================ */

(function () {
  'use strict';

  var AUTOPLAY_MS = 4200;   // intervalle entre deux onglets
  var FIRST_DELAY_MS = 900; // le carrousel démarre presque tout de suite
  var MIN_DURATION = 210;   // ms, saut entre deux onglets voisins
  var MAX_EXTRA = 190;      // ms ajoutées au maximum pour un saut d'un bord à l'autre
  var PX_PER_MS = 0.19;     // pente mesurée sur la référence, resserrée à la demande

  var root = document.querySelector('[data-hero-tabs]');
  if (!root) return;

  var track = root.querySelector('[data-hero-track]');
  var pill = root.querySelector('[data-hero-pill]');
  var pillLabel = root.querySelector('[data-hero-pill-label]');
  var progress = root.querySelector('[data-hero-progress]');
  var status = root.querySelector('[data-hero-status]');
  var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
  var fields = Array.prototype.slice.call(root.querySelectorAll('[data-hero-field]'));

  if (!track || !pill || tabs.length === 0 || tabs.length !== slides.length) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var current = Math.max(0, tabs.findIndex(function (t) {
    return t.getAttribute('aria-selected') === 'true';
  }));

  var activeField = 0;
  var travelTimer = null;
  var leaveTimer = null;
  var remeasureTimer = null;

  /* --- Formes animées --------------------------------------- */

  // Bascule sur le champ inactif après lui avoir donné la palette de
  // l'onglet visé, puis le fait apparaître en fondu par-dessus l'autre.
  function applyPalette(index, immediate) {
    if (fields.length < 2) return;
    var target = immediate ? activeField : 1 - activeField;
    var el = fields[target];

    el.className = el.className.replace(/\bpal-\d+\b/g, '').trim();
    el.classList.add('pal-' + (index + 1));

    if (immediate) {
      el.classList.add('is-active');
      return;
    }

    // Forcer un recalcul de style pour que la palette soit en place avant
    // que le fondu ne démarre, sinon on voit l'ancienne couleur monter.
    void el.offsetWidth;
    el.classList.add('is-active');
    fields[activeField].classList.remove('is-active');
    activeField = target;
  }

  /* --- Mesures ---------------------------------------------- */

  // Place l'indicateur sur l'onglet `index`. `duration` à 0 = sans animation.
  function positionPill(index, duration) {
    var tab = tabs[index];
    pill.style.transitionDuration = duration > 0 ? duration + 'ms' : '0ms';
    pill.style.width = tab.offsetWidth + 'px';
    pill.style.transform = 'translate3d(' + tab.offsetLeft + 'px, 0, 0)';
    if (pillLabel) pillLabel.textContent = tab.textContent.trim();
  }

  // Recalcule le décalage horizontal de chaque slide depuis la position
  // réelle de son onglet, puis repositionne l'indicateur sans animation.
  function measure() {
    var total = track.scrollWidth || 1;
    tabs.forEach(function (tab, i) {
      var ratio = (tab.offsetLeft + tab.offsetWidth / 2) / total;
      ratio = Math.min(1, Math.max(0, ratio));
      slides[i].style.setProperty('--shift', ratio.toFixed(4));
      slides[i].setAttribute('data-align', ratio > 0.52 ? 'end' : 'start');
    });
    // Une remesure pendant un déplacement le ferait sauter : on attend la
    // fin du trajet avant de repositionner l'indicateur.
    if (pill.classList.contains('is-travelling')) {
      clearTimeout(remeasureTimer);
      remeasureTimer = setTimeout(measure, 300);
      return;
    }
    positionPill(current, 0);
    pill.classList.add('is-ready');
  }

  /* --- Changement d'onglet ---------------------------------- */

  function goTo(index) {
    index = (index + tabs.length) % tabs.length;
    if (index === current) return;

    var previous = current;
    current = index;

    var distance = Math.abs(tabs[index].offsetLeft - tabs[previous].offsetLeft);
    var duration = reduceMotion.matches
      ? 1
      : MIN_DURATION + Math.min(MAX_EXTRA, distance * PX_PER_MS);

    // L'indicateur voyage « vide » : on cache son libellé, on le déplace,
    // puis on le laisse réapparaître juste avant l'arrivée.
    pill.classList.add('is-travelling');
    positionPill(index, duration);
    clearTimeout(travelTimer);
    travelTimer = setTimeout(function () {
      pill.classList.remove('is-travelling');
    }, Math.max(0, duration - 40));

    // Onglets
    tabs.forEach(function (tab, i) {
      var on = i === index;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.setAttribute('tabindex', on ? '0' : '-1');
    });

    // Slides : l'ancienne monte et se floute, la nouvelle vient du bas.
    clearTimeout(leaveTimer);
    slides.forEach(function (slide) {
      slide.classList.remove('is-leaving');
    });
    slides[previous].classList.remove('is-active');
    slides[previous].classList.add('is-leaving');
    slides[index].classList.add('is-active');
    leaveTimer = setTimeout(function () {
      slides[previous].classList.remove('is-leaving');
    }, 460);

    applyPalette(index, false);

    // Sur mobile la barre défile : on garde l'onglet actif visible.
    if (track.scrollWidth > track.clientWidth) {
      var tab = tabs[index];
      var target = tab.offsetLeft - (track.clientWidth - tab.offsetWidth) / 2;
      track.scrollTo({ left: Math.max(0, target), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }
  }

  /* --- Défilement automatique et gel ------------------------- */
  /* Trois états possibles :
       - "running"           : le minuteur tourne, la barre de progression avance
       - "running" + paused  : suspendu temporairement (survol, focus, onglet
                               d'arrière-plan, hero hors écran) — reprend seul
       - "frozen"            : figé par l'utilisateur, ne reprend que sur clic
     Le minuteur mémorise le temps restant pour rester synchrone avec la
     barre de progression, elle-même mise en pause par CSS. */

  var frozen = false;
  var timer = null;
  var startedAt = 0;
  var remaining = AUTOPLAY_MS;

  var pausedBy = { pointer: false, focus: false, hidden: false, offscreen: false };

  function isPaused() {
    return pausedBy.pointer || pausedBy.focus || pausedBy.hidden || pausedBy.offscreen;
  }

  function autoplayPossible() {
    return !frozen && !reduceMotion.matches && tabs.length > 1;
  }

  function restartProgress() {
    if (!progress) return;
    progress.style.animation = 'none';
    void progress.offsetWidth;      // reflow : rejoue l'animation CSS
    progress.style.animation = '';
  }

  function clearTimer() {
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function schedule(delay) {
    clearTimer();
    if (!autoplayPossible() || isPaused()) return;
    startedAt = performance.now();
    remaining = delay;
    timer = setTimeout(function () {
      goTo(current + 1);
      remaining = AUTOPLAY_MS;
      restartProgress();
      schedule(AUTOPLAY_MS);
    }, delay);
  }

  function syncState() {
    root.setAttribute('data-autoplay', frozen ? 'frozen' : 'running');
    root.classList.toggle('is-paused', isPaused());
  }

  function pause() {
    if (!timer) { syncState(); return; }
    // Mémorise le temps restant pour reprendre là où on s'est arrêté.
    remaining = Math.max(0, remaining - (performance.now() - startedAt));
    clearTimer();
    syncState();
  }

  function resume() {
    syncState();
    if (isPaused() || !autoplayPossible()) return;
    schedule(remaining > 0 ? remaining : AUTOPLAY_MS);
  }

  function setPaused(key, value) {
    if (pausedBy[key] === value) return;
    pausedBy[key] = value;
    if (value) pause(); else resume();
  }

  function freeze() {
    if (frozen) return;
    frozen = true;
    clearTimer();
    syncState();
    announce('Automatic rotation paused. Select the current tab again to resume.');
  }

  function unfreeze() {
    if (!frozen) return;
    frozen = false;
    remaining = AUTOPLAY_MS;
    restartProgress();
    syncState();
    schedule(AUTOPLAY_MS);
    announce('Automatic rotation resumed.');
  }

  function announce(message) {
    if (status) status.textContent = message;
  }

  /* --- Écouteurs -------------------------------------------- */

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      // Cliquer l'onglet déjà actif sert d'interrupteur : gel / reprise.
      if (i === current) {
        if (frozen) unfreeze(); else freeze();
        return;
      }
      goTo(i);
      freeze();
    });
  });

  // Navigation clavier standard d'un `tablist` horizontal.
  track.addEventListener('keydown', function (event) {
    var next = null;
    switch (event.key) {
      case 'ArrowRight': next = current + 1; break;
      case 'ArrowLeft':  next = current - 1; break;
      case 'Home':       next = 0; break;
      case 'End':        next = tabs.length - 1; break;
      default: return;
    }
    event.preventDefault();
    goTo(next);
    freeze();
    tabs[current].focus();
  });

  // Pauses temporaires : on ne change pas le contenu sous le curseur ni
  // sous le clavier de l'utilisateur.
  root.addEventListener('pointerenter', function () { setPaused('pointer', true); });
  root.addEventListener('pointerleave', function () { setPaused('pointer', false); });
  root.addEventListener('focusin', function () { setPaused('focus', true); });
  root.addEventListener('focusout', function () { setPaused('focus', false); });

  document.addEventListener('visibilitychange', function () {
    setPaused('hidden', document.hidden);
  });

  // Inutile d'animer une hero sortie de l'écran.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      setPaused('offscreen', !entries[0].isIntersecting);
    }, { threshold: 0.25 }).observe(root);
  }

  var resizeRaf = null;
  function scheduleMeasure() {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(measure);
  }

  if ('ResizeObserver' in window) {
    new ResizeObserver(scheduleMeasure).observe(track);
  } else {
    window.addEventListener('resize', scheduleMeasure);
  }

  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener('change', function () {
      if (reduceMotion.matches) { clearTimer(); syncState(); }
      else resume();
    });
  }

  /* --- Démarrage -------------------------------------------- */

  root.style.setProperty('--autoplay-ms', AUTOPLAY_MS + 'ms');
  applyPalette(current, true);

  // Les polices modifient la largeur des libellés : on remesure après
  // leur chargement, sinon l'indicateur est décalé au premier rendu.
  measure();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure);
  }
  window.addEventListener('load', scheduleMeasure);

  syncState();
  restartProgress();
  schedule(FIRST_DELAY_MS);
})();
