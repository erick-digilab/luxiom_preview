/* Luxiom · luxiom.cl — comportamiento (sin dependencias) */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Ancho de la barra de scroll (para alinear el contenido en pantallas > 1440px) */
  function sbw() { root.style.setProperty('--sbw', Math.max(0, window.innerWidth - root.clientWidth) + 'px'); }
  sbw(); window.addEventListener('resize', sbw);

  /* ---------- Cabecera: sombra al hacer scroll + menú móvil ---------- */
  var header = d.querySelector('.site-header');
  var toggle = d.querySelector('.nav-toggle');
  var menu = d.getElementById('menu');

  function setMenu(open) {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  toggle.addEventListener('click', function () { setMenu(!header.classList.contains('is-open')); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  d.addEventListener('click', function (e) { if (!header.contains(e.target)) setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1080) setMenu(false); });

  /* ---------- Parallax suave del hero ---------- */
  var heroImg = d.querySelector('.hero-media img');
  var ticking = false;
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    if (heroImg && !reduce && !ticking) {
      ticking = true;
      requestAnimationFrame(function () {
        heroImg.style.setProperty('--py', (Math.min(window.scrollY, 600) * 0.04).toFixed(1) + 'px');
        ticking = false;
      });
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Contadores (cifras del socio fundador) ---------- */
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  var counters = [].slice.call(d.querySelectorAll('[data-count]'));
  function setCount(el, v) { el.textContent = (el.getAttribute('data-prefix') || '') + fmt(v) + (el.getAttribute('data-suffix') || ''); }
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count')), t0 = null, dur = 1400;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      setCount(el, target * e);
      if (p < 1) requestAnimationFrame(step); else setCount(el, target);
    }
    requestAnimationFrame(step);
  }

  /* Al imprimir (o si algo falla) mostrar siempre las cifras finales */
  function finalCounts() { counters.forEach(function (el) { setCount(el, parseFloat(el.getAttribute('data-count'))); }); }
  window.addEventListener('beforeprint', finalCounts);

  /* ---------- Revelado + diagrama + contadores al entrar en pantalla ---------- */
  var reveals = [].slice.call(d.querySelectorAll('.reveal, .hub'));
  if (!('IntersectionObserver' in window) || reduce) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    counters.forEach(function (el) { setCount(el, 0); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        [].forEach.call(en.target.querySelectorAll('[data-count]'), runCount);
        if (en.target.hasAttribute('data-count')) runCount(en.target);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
    counters.forEach(function (el) { if (!el.closest('.reveal')) io.observe(el); });
  }

  /* ---------- Pausar el movimiento del diagrama cuando no está en pantalla ---------- */
  var hubs = [].slice.call(d.querySelectorAll('.hub'));
  if ('IntersectionObserver' in window) {
    var live = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { en.target.classList.toggle('is-live', en.isIntersecting); });
    }, { rootMargin: '120px 0px' });
    hubs.forEach(function (h) { live.observe(h); });
  } else {
    hubs.forEach(function (h) { h.classList.add('is-live'); });
  }

  /* ---------- Resaltar la sección activa en el menú ---------- */
  var linkFor = {
    quienes: 'quienes', diagnostico: 'quienes', hacemos: 'hacemos',
    sectores: 'sectores', trabajamos: 'trabajamos', experiencia: 'experiencia'
  };
  var links = {};
  [].forEach.call(d.querySelectorAll('.nav-links a[href^="#"]'), function (a) { links[a.getAttribute('href').slice(1)] = a; });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var key = linkFor[en.target.id];
        Object.keys(links).forEach(function (k) {
          if (k === key) links[k].setAttribute('aria-current', 'true'); else links[k].removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    [].forEach.call(d.querySelectorAll('main section[id]'), function (s) { spy.observe(s); });
  }
})();
