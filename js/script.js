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

  /* ---------- Formulaire de devis multi-étapes ---------- */
  const dForm = document.getElementById('devisForm');
  if (dForm) {
    const wrap = dForm.closest('.devis-form-wrap');
    const dSteps = dForm.querySelectorAll('.devis-step');
    const dHeads = wrap.querySelectorAll('.ds-step');
    const dBar = document.getElementById('devisBar');
    const dBack = document.getElementById('devisBack');
    const dNext = document.getElementById('devisNext');
    const dSubmit = document.getElementById('devisSubmit');
    const dProjet = document.getElementById('projet');
    const dTotal = dSteps.length;
    let dCur = 0;

    function dRender() {
      dSteps.forEach(function (s, i) { s.classList.toggle('active', i === dCur); });
      dHeads.forEach(function (h, i) { h.classList.toggle('active', i === dCur); h.classList.toggle('done', i < dCur); });
      dBar.style.width = Math.round(((dCur + 1) / dTotal) * 100) + '%';
      dBack.hidden = dCur === 0;
      dNext.hidden = dCur === dTotal - 1;
      dSubmit.hidden = dCur !== dTotal - 1;
    }
    function dShake() { wrap.classList.add('shake'); setTimeout(function () { wrap.classList.remove('shake'); }, 430); }
    function dValid() {
      if (dCur === 1) {
        const nom = document.getElementById('nom'), tel = document.getElementById('tel');
        if (!nom.value.trim()) { nom.focus(); dShake(); return false; }
        if (!tel.value.trim()) { tel.focus(); dShake(); return false; }
      }
      return true;
    }
    dForm.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        dForm.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('selected'); });
        chip.classList.add('selected');
        dProjet.value = chip.dataset.val;
        dCur = 1; dRender();
      });
    });
    dNext.addEventListener('click', function () { if (dValid() && dCur < dTotal - 1) { dCur++; dRender(); } });
    dBack.addEventListener('click', function () { if (dCur > 0) { dCur--; dRender(); } });
    dForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!dValid()) return;
      dForm.style.display = 'none';
      wrap.querySelector('.devis-progress').style.display = 'none';
      wrap.querySelector('.devis-steps-head').style.display = 'none';
      document.getElementById('devisSuccess').hidden = false;
    });
    dRender();
  }

  /* ---------- Carrousel d'avis (hero) ---------- */
  const hrVp = document.getElementById('hrViewport');
  if (hrVp) {
    const hrSlides = hrVp.querySelectorAll('.hr-slide');
    const hrDots = document.getElementById('hrDots');
    let hrIdx = 0;
    hrSlides.forEach(function (_, i) {
      const d = document.createElement('button');
      d.className = 'hr-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Avis ' + (i + 1));
      d.addEventListener('click', function () { hrGo(i); });
      hrDots.appendChild(d);
    });
    const dotEls = hrDots.querySelectorAll('.hr-dot');
    function hrSync() { dotEls.forEach(function (d, i) { d.classList.toggle('active', i === hrIdx); }); }
    function hrGo(i) { hrIdx = i; hrVp.scrollTo({ left: i * hrVp.clientWidth, behavior: 'smooth' }); hrSync(); }
    function hrNext() { hrGo((hrIdx + 1) % hrSlides.length); }
    let hrScrollT;
    hrVp.addEventListener('scroll', function () {
      clearTimeout(hrScrollT);
      hrScrollT = setTimeout(function () { hrIdx = Math.round(hrVp.scrollLeft / hrVp.clientWidth); hrSync(); }, 90);
    }, { passive: true });
    let hrTimer = setInterval(hrNext, 4500);
    hrVp.addEventListener('pointerenter', function () { clearInterval(hrTimer); });
    hrVp.addEventListener('pointerdown', function () { clearInterval(hrTimer); });
    hrVp.addEventListener('pointerleave', function () { clearInterval(hrTimer); hrTimer = setInterval(hrNext, 4500); });
  }

  /* ---------- Éventail de prestations (fan carousel) ---------- */
  const fan = document.getElementById('fan');
  if (fan && window.gsap) {
    const fanCards = Array.prototype.slice.call(fan.querySelectorAll('.fan-card'));
    const FN = fanCards.length;
    const fanTitle = document.getElementById('fanTitle');
    const fanDesc = document.getElementById('fanDesc');
    const fanDotsWrap = document.getElementById('fanDots');
    const fanData = [
      { t: 'Fenêtres PVC & aluminium', d: 'Double vitrage sur-mesure, isolation thermique et phonique. Dépose et pose comprises.' },
      { t: 'Volets roulants solaires', d: 'Motorisés, autonomes, sans gros travaux ni câblage à tirer. Confort et sécurité au quotidien.' },
      { t: 'Stores bannes', d: 'Protection solaire pour vos terrasses et balcons. Toile, coloris et motorisation au choix.' },
      { t: "Portes d'entrée", d: 'Sécurité renforcée, isolation et style. Aluminium ou PVC, sur-mesure, adaptées à votre façade.' },
      { t: 'Garde-corps en verre', d: 'Verre sécurisé, fixations discrètes et finitions propres pour une vue dégagée.' },
      { t: 'Climatisation réversible', d: 'Installation et entretien de splits. Chaud l’hiver, frais l’été, toute l’année.' }
    ];
    const POS = [
      { rot: 0, sc: 1, x: 0, y: 0, z: 10 },
      { rot: 11, sc: 0.9, x: 11, y: 1.4, z: 5 },
      { rot: 21, sc: 0.78, x: 20, y: 4.6, z: 2 }
    ];
    const VISIBLE = 2;
    let fanCenter = 0;

    fanCards.forEach(function (_, i) {
      const d = document.createElement('button');
      d.className = 'fan-dot';
      d.setAttribute('aria-label', fanData[i].t);
      d.addEventListener('click', function () { fanGo(i); });
      fanDotsWrap.appendChild(d);
    });
    const fanDotEls = fanDotsWrap.querySelectorAll('.fan-dot');

    function fanMult() { const w = window.innerWidth; return w < 480 ? 0.34 : w < 640 ? 0.42 : w < 1024 ? 0.7 : 1; }

    function fanLayout(animate) {
      const m = fanMult();
      fanCards.forEach(function (card, i) {
        let off = i - fanCenter;
        if (off > FN / 2) off -= FN;
        if (off < -FN / 2) off += FN;
        const a = Math.abs(off);
        card.classList.toggle('is-center', off === 0);
        if (a > VISIBLE) {
          gsap.to(card, { opacity: 0, scale: 0.6, duration: animate ? 0.35 : 0, overwrite: 'auto' });
          gsap.set(card, { zIndex: 0, pointerEvents: 'none' });
          return;
        }
        const p = POS[a];
        const dir = off < 0 ? -1 : 1;
        gsap.to(card, {
          xPercent: -50, yPercent: -50,
          x: (p.x * dir * m) + 'rem', y: (p.y * m) + 'rem',
          rotation: p.rot * dir, scale: p.sc, opacity: 1,
          duration: animate ? 0.6 : 0, ease: 'power3.out', overwrite: 'auto'
        });
        gsap.set(card, { zIndex: p.z, pointerEvents: 'auto' });
      });
      fanTitle.textContent = fanData[fanCenter].t;
      fanDesc.textContent = fanData[fanCenter].d;
      fanDotEls.forEach(function (d, i) { d.classList.toggle('active', i === fanCenter); });
    }

    function fanGo(i) { fanCenter = ((i % FN) + FN) % FN; fanLayout(true); }

    document.getElementById('fanPrev').addEventListener('click', function () { fanGo(fanCenter - 1); });
    document.getElementById('fanNext').addEventListener('click', function () { fanGo(fanCenter + 1); });

    let fanDownX = null, fanDownY = null, fanMoved = false;
    fan.addEventListener('pointerdown', function (e) { fanDownX = e.clientX; fanDownY = e.clientY; fanMoved = false; });
    fan.addEventListener('pointermove', function (e) {
      if (fanDownX === null) return;
      const dx = e.clientX - fanDownX, dy = e.clientY - fanDownY;
      if (!fanMoved && Math.abs(dx) > 38 && Math.abs(dx) > Math.abs(dy)) {
        fanMoved = true;
        fanGo(fanCenter + (dx < 0 ? 1 : -1));
        fanDownX = null;
      }
    });
    fan.addEventListener('pointerup', function () { fanDownX = null; });
    fan.addEventListener('pointercancel', function () { fanDownX = null; });
    fanCards.forEach(function (card, i) {
      card.addEventListener('click', function () { if (!fanMoved && !card.classList.contains('is-center')) fanGo(i); });
    });

    fanLayout(false);
    let fanRT;
    window.addEventListener('resize', function () { clearTimeout(fanRT); fanRT = setTimeout(function () { fanLayout(false); }, 120); });
  }

  /* ---------- Carte zone d'intervention (Leaflet + OpenStreetMap) ---------- */
  const mapEl = document.getElementById('map');
  if (mapEl && window.L) {
    const center = [43.2965, 5.3698];
    const map = L.map('map', { scrollWheelZoom: false }).setView(center, 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(map);
    const circle = L.circle(center, { radius: 30000, color: '#E08A2E', weight: 2, fillColor: '#E08A2E', fillOpacity: 0.12 }).addTo(map);
    L.circleMarker(center, { radius: 7, color: '#fff', weight: 2, fillColor: '#122F4A', fillOpacity: 1 }).addTo(map).bindPopup('M13 Menuiseries · Marseille');
    map.fitBounds(circle.getBounds(), { padding: [24, 24] });
    setTimeout(function () { map.invalidateSize(); }, 250);
  }

  /* ---------- Carrousel d'avis ---------- */
  const revVp = document.getElementById('revViewport');
  if (revVp) {
    const revSlides = revVp.querySelectorAll('.rev-slide');
    const revDotsWrap = document.getElementById('revDots');
    let revIdx = 0;
    revSlides.forEach(function (_, i) {
      const d = document.createElement('button');
      d.className = 'rev-dot' + (i === 0 ? ' active' : '');
      d.setAttribute('aria-label', 'Avis ' + (i + 1));
      d.addEventListener('click', function () { revGo(i); });
      revDotsWrap.appendChild(d);
    });
    const revDots = revDotsWrap.querySelectorAll('.rev-dot');
    function revStep() { return revSlides.length > 1 ? revSlides[1].offsetLeft - revSlides[0].offsetLeft : revVp.clientWidth; }
    function revSync() { revDots.forEach(function (d, i) { d.classList.toggle('active', i === revIdx); }); }
    function revGo(i) { revIdx = ((i % revSlides.length) + revSlides.length) % revSlides.length; revVp.scrollTo({ left: revSlides[revIdx].offsetLeft, behavior: 'smooth' }); revSync(); }
    let revST;
    revVp.addEventListener('scroll', function () { clearTimeout(revST); revST = setTimeout(function () { revIdx = Math.round(revVp.scrollLeft / revStep()); revSync(); }, 90); }, { passive: true });
    document.getElementById('revPrev').addEventListener('click', function () { revGo(revIdx - 1); });
    document.getElementById('revNext').addEventListener('click', function () { revGo(revIdx + 1); });
    let revTimer = setInterval(function () { revGo(revIdx + 1); }, 6000);
    revVp.addEventListener('pointerenter', function () { clearInterval(revTimer); });
    revVp.addEventListener('pointerdown', function () { clearInterval(revTimer); });
  }
})();
