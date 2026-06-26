/* ============================================================
   M13 MENUISERIES — Interactions
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Header : état au scroll + back-to-top ---------- */
  const header = document.getElementById('header');
  const backToTop = document.getElementById('backToTop');

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 60);
    backToTop.classList.toggle('show', y > 600);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  function closeMenu() {
    navToggle.classList.remove('open');
    navMenu.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  navToggle.addEventListener('click', function () {
    const open = navMenu.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  navMenu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  /* ---------- Reveal au scroll (avec léger décalage) ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          const siblings = Array.prototype.slice.call(
            el.parentElement.querySelectorAll(':scope > .reveal')
          );
          const idx = siblings.indexOf(el);
          el.style.transitionDelay = (idx > 0 ? Math.min(idx * 90, 360) : 0) + 'ms';
          el.classList.add('in');
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Compteurs animés ---------- */
  const counters = document.querySelectorAll('.counter');
  function animateCounter(el) {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1600;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target).toString();
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.dataset.target; });
  }

  /* ---------- Comparateur avant / après ---------- */
  const baSlider = document.getElementById('baSlider');
  if (baSlider) {
    const afterWrap = baSlider.querySelector('.ba-after-wrap');
    const handle = document.getElementById('baHandle');
    let dragging = false;

    function setPos(clientX) {
      const rect = baSlider.getBoundingClientRect();
      let pos = ((clientX - rect.left) / rect.width) * 100;
      pos = Math.max(2, Math.min(98, pos));
      afterWrap.style.clipPath = 'inset(0 0 0 ' + pos + '%)';
      handle.style.left = pos + '%';
    }
    function startDrag(e) {
      dragging = true;
      baSlider.style.cursor = 'grabbing';
      setPos(e.touches ? e.touches[0].clientX : e.clientX);
    }
    function moveDrag(e) {
      if (!dragging) return;
      setPos(e.touches ? e.touches[0].clientX : e.clientX);
    }
    function endDrag() {
      dragging = false;
      baSlider.style.cursor = 'ew-resize';
    }
    baSlider.addEventListener('mousedown', startDrag);
    window.addEventListener('mousemove', moveDrag);
    window.addEventListener('mouseup', endDrag);
    baSlider.addEventListener('touchstart', startDrag, { passive: true });
    window.addEventListener('touchmove', moveDrag, { passive: true });
    window.addEventListener('touchend', endDrag);
  }

  /* ---------- FAQ accordéon ---------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    const btn = item.querySelector('.faq-q');
    const ans = item.querySelector('.faq-a');
    btn.addEventListener('click', function () {
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (o) {
        o.classList.remove('open');
        o.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
        o.querySelector('.faq-a').style.maxHeight = null;
      });
      if (!open) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        ans.style.maxHeight = ans.scrollHeight + 'px';
      }
    });
  });

  /* ---------- Formulaire de devis (démo) ---------- */
  const form = document.getElementById('devisForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const nom = form.querySelector('#nom');
      const tel = form.querySelector('#tel');
      if (!nom.value.trim() || !tel.value.trim()) {
        (nom.value.trim() ? tel : nom).focus();
        return;
      }
      const success = document.getElementById('formSuccess');
      form.querySelectorAll('.field, .form-note, button[type="submit"]').forEach(function (el) {
        el.style.display = 'none';
      });
      success.hidden = false;
    });
  }
})();
