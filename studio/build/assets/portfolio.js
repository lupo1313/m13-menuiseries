/* M13 — Portfolio : comparateur avant/après + galerie (sans bibliothèque).
   Ne concerne que les cartes .js-portfolio[data-portfolio] ; les autres gardent la lightbox actuelle. */
(function () {
  'use strict';
  var items = document.querySelectorAll('.js-portfolio[data-portfolio]');
  if (!items.length) return;

  var ICON_SWAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6"/></svg>';
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]; }); };

  var modal = document.createElement('div');
  modal.className = 'lightbox pf-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'pfTitle');
  modal.innerHTML =
    '<button class="lb-close" type="button" aria-label="Fermer">&times;</button>' +
    '<button class="lb-nav lb-prev" type="button" aria-label="Photo précédente"><i class="fa-solid fa-chevron-left" aria-hidden="true"></i></button>' +
    '<div class="pf-wrap">' +
      '<div class="pf-head"><h2 class="pf-title" id="pfTitle"></h2><p class="pf-meta"></p></div>' +
      '<div class="pf-stage"></div>' +
      '<div class="pf-foot"><span class="pf-count" aria-live="polite"></span><span class="pf-hint"></span></div>' +
    '</div>' +
    '<button class="lb-nav lb-next" type="button" aria-label="Photo suivante"><i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>';
  document.body.appendChild(modal);
  var $ = function (s) { return modal.querySelector(s); };
  var stage = $('.pf-stage'), count = $('.pf-count'), hint = $('.pf-hint'), prev = $('.lb-prev'), next = $('.lb-next'), closeBtn = $('.lb-close');
  var slides = [], idx = 0, lastFocus = null;

  function picture(img, cls) {
    return '<picture>' + (img.srcM ? '<source media="(max-width:768px)" srcset="' + esc(img.srcM) + '" />' : '') +
      '<img class="' + (cls || '') + '" src="' + esc(img.src) + '" alt="' + esc(img.alt) + '" width="' + img.w + '" height="' + img.h + '" decoding="async" /></picture>';
  }
  var ar = function (img) { return img.w && img.h ? img.w + ' / ' + img.h : '4 / 3'; };

  function show(i) {
    idx = (i + slides.length) % slides.length;
    var s = slides[idx];
    if (s.type === 'compare') {
      stage.innerHTML =
        '<div class="pf-media pf-compare" style="--ar:' + ar(s.after) + ';--pos:50%">' +
          picture(s.after, 'pf-after') + picture(s.before, 'pf-before') +
          '<span class="pf-tag pf-tag--before">Avant</span><span class="pf-tag pf-tag--after">Après</span>' +
          '<span class="pf-handle"><span class="pf-knob">' + ICON_SWAP + '</span></span>' +
          '<input class="pf-range" type="range" min="0" max="100" step="1" value="50" aria-label="Comparer avant et après" aria-valuetext="Moitié avant, moitié après" />' +
        '</div>';
      hint.innerHTML = ICON_SWAP + 'Faites glisser pour comparer';
      initCompare(stage.querySelector('.pf-compare'));
    } else {
      stage.innerHTML = '<div class="pf-media" style="--ar:' + ar(s.img) + '">' + picture(s.img) + '</div>';
      hint.textContent = s.img.alt || '';
    }
    var multi = slides.length > 1;
    prev.style.display = next.style.display = multi ? '' : 'none';
    count.textContent = multi ? (idx + 1) + ' / ' + slides.length : '';
    // Préchargement de la photo suivante
    var n = slides[(idx + 1) % slides.length];
    if (multi && n) new Image().src = (n.type === 'compare' ? n.after : n.img).src;
  }

  function initCompare(box) {
    var range = box.querySelector('.pf-range');
    var set = function (p) {
      p = Math.max(0, Math.min(100, p));
      box.style.setProperty('--pos', p + '%');
      range.value = Math.round(p);
      range.setAttribute('aria-valuetext', Math.round(p) + ' % avant, ' + (100 - Math.round(p)) + ' % après');
    };
    var fromEvent = function (e) { var r = box.getBoundingClientRect(); set((e.clientX - r.left) / r.width * 100); };
    box.addEventListener('pointerdown', function (e) {
      if (e.button > 0) return;
      box.setPointerCapture(e.pointerId);
      box.classList.add('is-dragging');
      fromEvent(e);
      range.focus({preventScroll: true});
    });
    box.addEventListener('pointermove', function (e) { if (box.classList.contains('is-dragging')) fromEvent(e); });
    var end = function () { box.classList.remove('is-dragging'); };
    box.addEventListener('pointerup', end);
    box.addEventListener('pointercancel', end);
    range.addEventListener('input', function () { set(+range.value); });
  }

  // Balayage horizontal pour changer de photo (pas sur le comparateur)
  var sx = null;
  stage.addEventListener('pointerdown', function (e) { sx = e.target.closest('.pf-compare') ? null : e.clientX; });
  stage.addEventListener('pointerup', function (e) {
    if (sx === null || slides.length < 2) return;
    var dx = e.clientX - sx; sx = null;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  });

  function open(el) {
    var d;
    try { d = JSON.parse(el.getAttribute('data-portfolio')); } catch (err) { return; }
    slides = [];
    if (d.before && d.after) slides.push({type: 'compare', before: d.before, after: d.after});
    if (d.main && !(d.after && d.after.src === d.main.src)) slides.push({type: 'photo', img: d.main});
    (d.photos || []).forEach(function (p) { slides.push({type: 'photo', img: p}); });
    if (!slides.length) return;
    $('.pf-title').textContent = d.title || '';
    $('.pf-meta').textContent = [d.city, d.description].filter(Boolean).join(' · ');
    lastFocus = el;
    show(0);
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }
  function close() {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    stage.innerHTML = '';
    if (lastFocus) lastFocus.focus();
  }

  items.forEach(function (el) {
    // Intercepte avant la lightbox existante (écouteur posé sur la grille parente).
    el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); open(el); });
    el.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault(); e.stopPropagation(); open(el);
    });
  });
  closeBtn.addEventListener('click', close);
  prev.addEventListener('click', function () { show(idx - 1); });
  next.addEventListener('click', function () { show(idx + 1); });
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.target.classList && e.target.classList.contains('pf-range')) return; // flèches = curseur
    if (e.key === 'ArrowLeft' && slides.length > 1) show(idx - 1);
    else if (e.key === 'ArrowRight' && slides.length > 1) show(idx + 1);
    else if (e.key === 'Tab') {
      // Le focus reste dans la fenêtre
      var f = Array.prototype.filter.call(modal.querySelectorAll('button, input'), function (n) { return n.style.display !== 'none' && n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
