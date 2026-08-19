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
   5. gère le défilement automatique, le clavier et `prefers-reduced-motion`.
   ============================================================ */

(function () {
  'use strict';

  var AUTOPLAY_MS = 5500;
  var MIN_DURATION = 360;   // ms, saut entre deux onglets voisins
  var MAX_EXTRA = 340;      // ms ajoutées au maximum pour un saut d'un bord à l'autre
  var PX_PER_MS = 0.34;     // pente mesurée sur la référence

  var root = document.querySelector('[data-hero-tabs]');
  if (!root) return;

  var track = root.querySelector('[data-hero-track]');
  var pill = root.querySelector('[data-hero-pill]');
  var pillLabel = root.querySelector('[data-hero-pill-label]');
  var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
  var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
  var layers = Array.prototype.slice.call(root.querySelectorAll('[data-hero-bg]'));

  if (!track || !pill || tabs.length === 0 || tabs.length !== slides.length) return;

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var current = Math.max(0, tabs.findIndex(function (t) {
    return t.getAttribute('aria-selected') === 'true';
  }));

  var travelTimer = null;
  var leaveTimer = null;
  var autoplayTimer = null;
  var autoplayStopped = false;
  var paused = false;
  var visible = true;

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
    positionPill(current, 0);
    pill.classList.add('is-ready');
  }

  /* --- Changement d'onglet ---------------------------------- */

  function goTo(index, fromUser) {
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
    }, Math.max(0, duration - 60));

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
    }, 700);

    // Fond
    layers.forEach(function (layer, i) {
      layer.classList.toggle('is-active', i === index);
    });

    // Sur mobile la barre défile : on garde l'onglet actif visible.
    if (track.scrollWidth > track.clientWidth) {
      var tab = tabs[index];
      var target = tab.offsetLeft - (track.clientWidth - tab.offsetWidth) / 2;
      track.scrollTo({ left: Math.max(0, target), behavior: reduceMotion.matches ? 'auto' : 'smooth' });
    }

    if (fromUser) stopAutoplay();
  }

  /* --- Défilement automatique -------------------------------- */

  function tick() {
    if (paused || !visible || autoplayStopped) return;
    goTo(current + 1, false);
  }

  function startAutoplay() {
    if (autoplayStopped || reduceMotion.matches || autoplayTimer) return;
    autoplayTimer = setInterval(tick, AUTOPLAY_MS);
  }

  function stopAutoplay() {
    autoplayStopped = true;
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }

  /* --- Écouteurs -------------------------------------------- */

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      goTo(i, true);
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
    goTo(next, true);
    tabs[current].focus();
  });

  // Pause au survol et au focus : on ne change pas le contenu sous le
  // curseur ou sous le clavier de l'utilisateur.
  root.addEventListener('pointerenter', function () { paused = true; });
  root.addEventListener('pointerleave', function () { paused = false; });
  root.addEventListener('focusin', function () { paused = true; });
  root.addEventListener('focusout', function () { paused = false; });

  document.addEventListener('visibilitychange', function () {
    visible = !document.hidden;
  });

  // Inutile d'animer une hero sortie de l'écran.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting && !document.hidden;
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
      if (reduceMotion.matches) stopAutoplay();
    });
  }

  /* --- Démarrage -------------------------------------------- */

  // Les polices modifient la largeur des libellés : on remesure après
  // leur chargement, sinon l'indicateur est décalé au premier rendu.
  measure();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measure);
  }
  window.addEventListener('load', scheduleMeasure);

  startAutoplay();

  // Préchargement discret des autres fonds, une fois la page chargée,
  // pour que le premier changement d'onglet ne montre pas un trou.
  window.addEventListener('load', function () {
    layers.forEach(function (layer, i) {
      if (i === current) return;
      var url = layer.getAttribute('data-hero-bg');
      if (url) new Image().src = url;
    });
  });
})();
