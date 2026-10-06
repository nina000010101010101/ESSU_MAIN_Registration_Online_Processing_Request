/* ESSU ROPS landing page animations
   Self-contained: this file injects its own CSS, so no <style> edits are needed.
   Load it at the end of <body>:  <script src="landingpage.js"></script> */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 0. inject animation CSS ---------- */
  const css = `
  @keyframes fadeUp    { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
  @keyframes fadeRight { from { opacity: 0; transform: translateX(44px); } to { opacity: 1; transform: none; } }
  @keyframes fadeDown  { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: none; } }
  @keyframes floatY    { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
  @keyframes pop       { 0% { transform: scale(.4); opacity: 0; } 70% { transform: scale(1.12); } 100% { transform: scale(1); opacity: 1; } }
  @keyframes pulseRing { 0% { box-shadow: 0 0 0 0 rgba(240,205,108,.55); } 100% { box-shadow: 0 0 0 14px rgba(240,205,108,0); } }
  @keyframes drift     { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,30px) scale(1.15); } }

  body > div.bg-forest-900 { animation: fadeDown .7s cubic-bezier(.22,1,.36,1) backwards; }

  #home > div { position: relative; z-index: 1; }
  #home::before {
    content: ""; position: absolute; top: -140px; right: -120px; width: 520px; height: 520px;
    border-radius: 50%; background: radial-gradient(circle, rgba(227,181,63,.22), transparent 65%);
    filter: blur(20px); animation: drift 14s ease-in-out infinite; z-index: 0; pointer-events: none;
  }
  #home .grid > div:first-child > * { animation: fadeUp .8s cubic-bezier(.22,1,.36,1) backwards; }
  #home .grid > div:first-child > *:nth-child(1) { animation-delay: .15s; }
  #home .grid > div:first-child > *:nth-child(2) { animation-delay: .30s; }
  #home .grid > div:first-child > *:nth-child(3) { animation-delay: .45s; }
  #home .grid > div:first-child > *:nth-child(4) { animation-delay: .60s; }
  #home .grid > div:first-child > *:nth-child(5) { animation-delay: .75s; }
  #home .grid > div:last-child {
    animation: fadeRight .9s cubic-bezier(.22,1,.36,1) .35s backwards,
               floatY 6s ease-in-out 1.4s infinite;
  }

  #home .grid > div:last-child > div:not(:first-child) { transition: background .5s, transform .5s; border-radius: 12px; }
  #home .grid > div:last-child > div.row-active { background: rgba(240,205,108,.09); transform: translateX(6px); }
  #home .grid > div:last-child > div.row-active > div:first-child { animation: pulseRing 1.4s ease-out infinite; }

  .reveal-init { opacity: 0; }
  .reveal-in   { animation: fadeUp .75s cubic-bezier(.22,1,.36,1) backwards; }
  .process-step.reveal-in > div:first-child { animation: pop .6s cubic-bezier(.22,1,.36,1) .25s backwards; }

  details[open] > p { animation: fadeUp .35s ease; }

  .sticky.top-0 { transition: box-shadow .3s; }
  .sticky.top-0.is-scrolled { box-shadow: 0 10px 24px -14px rgba(0,0,0,.55); }
  .sticky.top-0 ul a { position: relative; }
  .sticky.top-0 ul a::after {
    content: ""; position: absolute; left: 0; bottom: -2px; width: 100%; height: 2px; background: #f0cd6c;
    transform: scaleX(0); transform-origin: left; transition: transform .3s ease;
  }
  .sticky.top-0 ul a:hover::after { transform: scaleX(1); }

  a.bg-gradient-to-b { position: relative; overflow: hidden; }
  a.bg-gradient-to-b::after {
    content: ""; position: absolute; top: 0; left: -80%; width: 50%; height: 100%;
    background: linear-gradient(100deg, transparent, rgba(255,255,255,.55), transparent);
    transform: skewX(-20deg);
  }
  a.bg-gradient-to-b:hover::after { left: 130%; transition: left .7s ease; }

  #webLogo, #schoolLogo, #bagongPilipinasLogo, #transparencyLogo { transition: transform .35s ease; }
  #webLogo:hover, #schoolLogo:hover, #bagongPilipinasLogo:hover, #transparencyLogo:hover { transform: scale(1.1) rotate(-4deg); }
  #services .grid > div > div:first-child { transition: transform .35s ease; }
  #services .grid > div:hover > div:first-child { transform: scale(1.12) rotate(-6deg); }

  #scrollBar { position: fixed; top: 0; left: 0; height: 3px; width: 0; z-index: 60;
    background: linear-gradient(90deg, #c99a2e, #f0cd6c); }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; transition: none !important; }
    .reveal-init { opacity: 1 !important; }
  }`;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- 1. scroll progress bar + nav shadow ---------- */
  const bar = document.createElement('div');
  bar.id = 'scrollBar';
  document.body.appendChild(bar);
  const nav = document.querySelector('.sticky.top-0');
  function onScroll() {
    const h = document.documentElement;
    const pct = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    bar.style.width = (pct * 100) + '%';
    if (nav) nav.classList.toggle('is-scrolled', h.scrollTop > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- 2. count-up numbers (98%, 14, 10+, ...) ---------- */
  function countUp(el) {
    const m = el.textContent.trim().match(/^(\d+)(\+|%)?$/);
    if (!m || reduce) return;
    const end = parseInt(m[1], 10), suffix = m[2] || '', dur = 1400, t0 = performance.now();
    (function tick(t) {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }
  const cIO = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { countUp(e.target); cIO.unobserve(e.target); } });
  }, { threshold: 0.6 });
  document.querySelectorAll('#home strong, #about strong').forEach(c => cIO.observe(c));

  /* ---------- 3. status card: cycle the active row ---------- */
  const card = document.querySelector('#home .grid > div:last-child');
  if (card && !reduce) {
    const rows = Array.from(card.children).slice(1);
    let i = 0;
    rows[0].classList.add('row-active');
    setInterval(() => {
      rows[i].classList.remove('row-active');
      i = (i + 1) % rows.length;
      rows[i].classList.add('row-active');
    }, 2000);
  }

  /* ---------- 4. scroll reveal with stagger ---------- */
  if (reduce) return;
  const groups = [
    '#services > div > div:first-child > *', '#services .grid > div',
    '#about > div > div:first-child > *',    '#about > div > div:last-child > div > div',
    '#process > div > div > div:first-child > *', '.process-step',
    '#faq > div > div:first-child > *',      '#faq details',
    '#contact .grid > div',                  'footer > div > *'
  ];
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.remove('reveal-init');
      e.target.classList.add('reveal-in');
      io.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  groups.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal-init');
      el.style.animationDelay = (i * 0.1) + 's';
      io.observe(el);
    });
  });
})();


/* ============================================================
   MORE ANIMATIONS (part 2), same file, no HTML changes needed
   ============================================================ */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = `
  @keyframes shimmer  { to { background-position: -200% center; } }
  @keyframes lineGrow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes ripple   { to { transform: scale(4); opacity: 0; } }
  @keyframes nudge    { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }

  /* shimmering gold headline */
  #home h1 span {
    background: linear-gradient(90deg, #c99a2e, #f0cd6c, #fff3c4, #f0cd6c, #c99a2e);
    background-size: 200% auto; -webkit-background-clip: text; background-clip: text;
    color: transparent; -webkit-text-fill-color: transparent; animation: shimmer 4s linear infinite;
  }

  /* process connector lines draw themselves */
  .process-step.reveal-in:not(:last-child)::after { transform-origin: left; animation: lineGrow .9s ease .5s backwards; }

  /* about: ticks pop, stat cards lift */
  #about li.reveal-in > span { animation: pop .5s cubic-bezier(.22,1,.36,1) .3s backwards; }
  #about .grid > div { transition: transform .3s ease, background .3s ease; }
  #about .grid > div:hover { transform: translateY(-5px) scale(1.03); background: rgba(255,255,255,.11); }

  /* service cards: gold top bar + link nudge */
  #services .grid > div { position: relative; overflow: hidden; }
  #services .grid > div::before { content: ""; position: absolute; top: 0; left: 0; width: 100%; height: 3px;
    background: linear-gradient(90deg, #c99a2e, #f0cd6c); transform: scaleX(0); transform-origin: left; transition: transform .4s ease; }
  #services .grid > div:hover::before { transform: scaleX(1); }
  #services a { transition: transform .25s ease, color .2s; }
  #services a:hover { transform: translateX(6px); }

  /* FAQ hover + open glow */
  #faq details { transition: border-color .3s, box-shadow .3s, transform .3s; }
  #faq details:hover { border-color: #e3b53f; transform: translateX(4px); }
  #faq details[open] { border-color: #e3b53f; box-shadow: 0 14px 30px -20px rgba(201,154,46,.6); }

  /* button click ripple */
  .ripple { position: absolute; border-radius: 50%; background: rgba(255,255,255,.55);
    transform: scale(0); animation: ripple .6s ease-out; pointer-events: none; }

  /* active nav link (scroll-spy) */
  .sticky.top-0 ul a.nav-active { color: #f0cd6c; }
  .sticky.top-0 ul a.nav-active::after { transform: scaleX(1); }

  /* back-to-top button */
  #toTop { position: fixed; right: 22px; bottom: 22px; width: 46px; height: 46px; border-radius: 50%; border: 0;
    background: linear-gradient(#f0cd6c, #c99a2e); color: #231802; cursor: pointer; z-index: 55;
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transform: translateY(20px) scale(.8); pointer-events: none;
    transition: opacity .35s, transform .35s; box-shadow: 0 10px 22px -8px rgba(0,0,0,.5); }
  #toTop.show { opacity: 1; transform: none; pointer-events: auto; }
  #toTop.show:hover { transform: translateY(-4px); }
  #toTop svg { animation: nudge 1.6s ease-in-out infinite; }`;
  const s = document.createElement('style');
  s.textContent = css;
  document.head.appendChild(s);

  /* back-to-top button (works even with reduced motion) */
  const btn = document.createElement('button');
  btn.id = 'toTop';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 15l6-6 6 6" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(btn);
  window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 500), { passive: true });

  /* scroll-spy: highlight the nav link of the section you're viewing */
  const links = Array.from(document.querySelectorAll('.sticky.top-0 > div:first-child > ul a'));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(a => a.classList.toggle('nav-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('#home, #services, #about, #process, #faq, #contact').forEach(sec => spy.observe(sec));

  if (reduce) return;

  /* 3D tilt on service cards that follows the cursor */
  document.querySelectorAll('#services .grid > div').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'perspective(800px) rotateX(' + (-y * 8) + 'deg) rotateY(' + (x * 8) + 'deg) translateY(-3px)';
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

  /* ripple on gold buttons */
  document.querySelectorAll('a.bg-gradient-to-b').forEach(b => {
    b.addEventListener('click', (e) => {
      const r = b.getBoundingClientRect();
      const d = Math.max(r.width, r.height);
      const dot = document.createElement('span');
      dot.className = 'ripple';
      dot.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px;';
      b.appendChild(dot);
      setTimeout(() => dot.remove(), 650);
    });
  });
})();


/* ============================================================
   PAGE TRANSITION (part 3): curtain wipe when tapping Login / Sign Up
   ============================================================ */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const N = 7; /* number of curtain panels */

  const s = document.createElement('style');
  s.textContent = `
  @keyframes ptRise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
  @keyframes ptLine { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @keyframes ptGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(240,205,108,.45); } 50% { box-shadow: 0 0 0 16px rgba(240,205,108,0); } }

  #pageTransition { position: fixed; inset: 0; z-index: 9999; visibility: hidden; pointer-events: none; overflow: hidden; }
  #pageTransition.show { visibility: visible; pointer-events: auto; }
  #pageTransition .layer { position: absolute; inset: 0; display: flex; }
  #pageTransition .panel { flex: 1; height: 100%; transform: translateY(101%);
    transition: transform .65s cubic-bezier(.76,0,.24,1); }
  #pageTransition .gold .panel   { background: linear-gradient(180deg, #f0cd6c, #c99a2e); }
  #pageTransition .forest .panel { background: linear-gradient(180deg, #153a27, #0b2116); margin-left: -1px; }
  #pageTransition.show .panel { transform: translateY(0); }

  #pageTransition .content { position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center; padding: 24px; }
  #pageTransition .content > * { opacity: 0; }
  #pageTransition.show .content > * { animation: ptRise .6s cubic-bezier(.22,1,.36,1) forwards; }
  #pageTransition .crest { width: 92px; height: 92px; border-radius: 50%; overflow: hidden; margin-bottom: 20px;
    background: #153a27; border: 2px solid #e3b53f; display: flex; align-items: center; justify-content: center; }
  #pageTransition .crest img { width: 100%; height: 100%; object-fit: contain; }
  #pageTransition .crest span { color: #f0cd6c; font: 700 18px Poppins, sans-serif; }
  #pageTransition.show .crest  { animation: ptRise .6s cubic-bezier(.22,1,.36,1) .85s forwards, ptGlow 1.6s ease-in-out 1.4s infinite; }
  #pageTransition .title { color: #fff; font: 700 22px Poppins, sans-serif; margin: 0 0 6px; }
  #pageTransition .line  { width: 120px; height: 2px; background: #e3b53f; margin: 12px 0; transform-origin: center; }
  #pageTransition.show .line { animation: ptLine .7s ease 1.1s forwards; opacity: 1; transform: scaleX(0); }
  #pageTransition .msg   { color: #f0cd6c; font: 500 15px Inter, sans-serif; letter-spacing: .04em; margin: 0; }
  #pageTransition.show .title { animation-delay: 1s; }
  #pageTransition.show .msg   { animation-delay: 1.2s; }`;
  document.head.appendChild(s);

  const overlay = document.createElement('div');
  overlay.id = 'pageTransition';
  const build = (extra) => {
    let h = '';
    for (let i = 0; i < N; i++) h += '<div class="panel" style="transition-delay:' + (i * 0.06 + extra) + 's"></div>';
    return h;
  };
  overlay.innerHTML =
    '<div class="layer gold">' + build(0) + '</div>' +
    '<div class="layer forest">' + build(0.14) + '</div>' +
    '<div class="content">' +
      '<div class="crest"><img src="./img/logo2.png" alt="" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'block\';"><span style="display:none">ESSU</span></div>' +
      '<h2 class="title">Eastern Samar State University</h2>' +
      '<div class="line"></div>' +
      '<p class="msg"></p>' +
    '</div>';
  document.body.appendChild(overlay);
  const msg = overlay.querySelector('.msg');

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href="login.html"], a[href="register.html"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();

    msg.textContent = a.getAttribute('href') === 'register.html' ? "Let's get you started" : 'Welcome back';
    overlay.classList.add('show');
    setTimeout(() => { window.location.href = a.href; }, reduce ? 300 : 1900);
  });

  /* coming back with the browser's Back button: reset the screen */
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) overlay.classList.remove('show');
  });
})();


/* ============================================================
   FAQ (part 4): all questions start closed; opening one closes the others
   ============================================================ */
(function () {
  const items = Array.from(document.querySelectorAll('#faq details'));
  items.forEach(d => d.removeAttribute('open'));
  items.forEach(d => d.addEventListener('toggle', () => {
    if (!d.open) return;
    items.forEach(o => { if (o !== d) o.removeAttribute('open'); });
  }));
})();