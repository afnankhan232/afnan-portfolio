// ============================================================
// ui.js — Cinematic Immersive UI System
//
// Scroll-driven parallax, book-opening reveals, depth effects,
// smooth navbar, counters, typed text, 3D tilt, magnetic buttons,
// skill bar animation, and scroll progress indicator.
// ============================================================

/* ---- SCROLL REVEAL — IntersectionObserver with stagger ---- */
function initReveal() {
  const revealVisible = () => {
    document.querySelectorAll('.reveal:not(.active), .reveal-left:not(.active), .reveal-right:not(.active)').forEach((element) => {
      const bounds = element.getBoundingClientRect();
      if (bounds.top < window.innerHeight && bounds.bottom > 0) element.classList.add('active');
    });
  };
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('active');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach((el) => io.observe(el));
  window.addEventListener('scroll', revealVisible, { passive: true });
  window.addEventListener('resize', revealVisible);
  requestAnimationFrame(revealVisible);
}

/* ---- PARALLAX DEPTH LAYERS ---- */
function initParallax() {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const heroLeft = hero.querySelector('.hero-left');
  const heroRight = hero.querySelector('.hero-right');
  const orb1 = hero.querySelector('.hero-orb-1');
  const orb2 = hero.querySelector('.hero-orb-2');

  // Smooth parallax on scroll — creates depth like descending into the globe
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrollY = window.scrollY;
      const heroH = hero.offsetHeight;
      const progress = Math.min(scrollY / heroH, 1); // 0→1 through hero

      if (heroLeft) {
        heroLeft.style.transform = `translateY(${scrollY * 0.15}px) scale(${1 - progress * 0.05})`;
        heroLeft.style.opacity = 1 - progress * 0.8;
      }
      if (heroRight) {
        // Globe zooms in slightly as you scroll — "descending into" effect
        heroRight.style.transform = `translateY(${scrollY * -0.08}px) scale(${1 + progress * 0.15})`;
        heroRight.style.opacity = 1 - progress * 0.5;
      }
      if (orb1) orb1.style.transform = `translateY(${scrollY * -0.2}px) scale(${1 + progress * 0.3})`;
      if (orb2) orb2.style.transform = `translateY(${scrollY * 0.12}px)`;

      ticking = false;
    });
  }, { passive: true });
}

/* ---- COUNTER ANIMATION ---- */
function initCounters() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = +el.dataset.target;
        let cur = 0;
        const duration = 2000; // ms
        const startTime = performance.now();

        function update(now) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          // Ease out cubic for satisfying deceleration
          const eased = 1 - Math.pow(1 - progress, 3);
          cur = Math.floor(target * eased);
          el.textContent = cur;
          if (progress < 1) requestAnimationFrame(update);
          else el.textContent = target;
        }
        requestAnimationFrame(update);
        io.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );
  document.querySelectorAll('.counter').forEach((c) => io.observe(c));
}

/* ---- TYPED LINE ---- */
function initTyped() {
  const el = document.getElementById('typedText');
  if (!el) return;
  const phrases = [
    'building intelligent systems',
    'automating enterprise workflows',
    'training ML models @ scale',
    'shipping to production',
    'architecting AI backends',
  ];
  let pi = 0, ci = 0, del = false;
  function type() {
    const p = phrases[pi];
    el.textContent = del ? p.slice(0, ci - 1) : p.slice(0, ci + 1);
    del ? ci-- : ci++;
    if (!del && ci === p.length) { del = true; setTimeout(type, 1800); return; }
    if (del && ci === 0) { del = false; pi = (pi + 1) % phrases.length; }
    setTimeout(type, del ? 38 : 62);
  }
  type();
}

/* ---- SMART NAVBAR — Auto-hide on scroll down, show on scroll up ---- */
function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  let lastY = 0;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;

      // Add/remove scrolled class for shadow
      nav.classList.toggle('nav-scrolled', y > 60);

      // Smart hide: hide on scroll down (past 200px), show on scroll up
      if (y > 200 && y > lastY + 10) {
        nav.classList.add('nav-hidden');
      } else if (y < lastY - 5) {
        nav.classList.remove('nav-hidden');
      }

      // Background opacity
      const dark = document.body.classList.contains('dark-mode');
      nav.style.background = y > 60
        ? (dark ? 'rgba(9,9,11,0.95)' : 'rgba(254,252,248,0.96)')
        : '';

      lastY = y;
      ticking = false;
    });
  }, { passive: true });
}

/* ---- 3D TILT (cards) — perspective depth effect ---- */
function initTilt() {
  document.querySelectorAll('.tilt-card, .project-card, .exp-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateZ(8px) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(() => { card.style.transition = ''; }, 600);
    });
  });
}

/* ---- MAGNETIC BUTTONS ---- */
function initMagnetic() {
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * 0.22}px,${y * 0.22}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

/* ---- SKILL BARS ---- */
function initSkillBars() {
  const fills = document.querySelectorAll('.sb-fill');
  if (!fills.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        fills.forEach((f, i) => {
          // Stagger each bar animation
          setTimeout(() => {
            f.style.width = f.dataset.w + '%';
          }, i * 150);
        });
        io.disconnect();
      });
    },
    { threshold: 0.3 }
  );
  io.observe(document.getElementById('skillBars') || fills[0]);
}

/* ---- ACTIVE NAV LINK ---- */
function initActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar nav a').forEach((a) => {
    a.classList.toggle('active', a.getAttribute('href') === path);
  });
}

/* ---- SCROLL PROGRESS INDICATOR ---- */
function initScrollProgress() {
  const bar = document.createElement('div');
  bar.id = 'scrollProgress';
  bar.style.cssText =
    'position:fixed;top:0;left:0;height:3px;z-index:10000;' +
    'background:linear-gradient(90deg,#ff375f,#bf5af2,#ff6b35);' +
    'width:0;transition:none;pointer-events:none;border-radius:0 2px 2px 0;';
  document.body.appendChild(bar);

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width = progress + '%';
  }, { passive: true });
}

/* ---- SMOOTH SECTION DEPTH — sections get subtle scale on scroll ---- */
function initSectionDepth() {
  const sections = document.querySelectorAll('.section-pad, .resume-section, .contact-section');
  if (!sections.length) return;

  const revealVisible = () => {
    sections.forEach((section) => {
      if (section.style.opacity === '1') return;
      const bounds = section.getBoundingClientRect();
      if (bounds.top < window.innerHeight && bounds.bottom > 0) {
        section.style.opacity = '1';
        section.style.transform = 'translateY(0) scale(1)';
      }
    });
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0) scale(1)';
        }
      });
    },
    { threshold: 0.05 }
  );
  sections.forEach((s) => {
    s.style.opacity = '0';
    s.style.transform = 'translateY(30px) scale(0.99)';
    s.style.transition = 'opacity 1s cubic-bezier(0.16, 1, 0.3, 1), transform 1s cubic-bezier(0.16, 1, 0.3, 1)';
    io.observe(s);
  });
  window.addEventListener('scroll', revealVisible, { passive: true });
  window.addEventListener('resize', revealVisible);
  requestAnimationFrame(revealVisible);
}

/* ---- VISITOR IP, APPROXIMATE LOCATION, AND LOCAL TIME ---- */
function initVisitorReadout() {
  const ipElement = document.getElementById('visitorIp');
  const locationElement = document.getElementById('visitorLocation');
  const timeElement = document.getElementById('visitorTime');
  if (!ipElement || !locationElement || !timeElement) return;

  let timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const updateTime = () => {
    const now = new Date();
    timeElement.dateTime = now.toISOString();
    timeElement.textContent = new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone,
      timeZoneName: 'short',
    }).format(now);
  };
  updateTime();
  const clockInterval = window.setInterval(updateTime, 30000);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 6500);

  fetch('https://ipapi.co/json/', {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal: controller.signal,
  })
    .then((response) => {
      if (!response.ok) throw new Error('IP lookup unavailable');
      return response.json();
    })
    .then((data) => {
      if (data.error) throw new Error('IP lookup unavailable');
      ipElement.textContent = data.ip || 'Unavailable';
      const locationParts = [data.city, data.region, data.country_name].filter(Boolean);
      locationElement.textContent = locationParts.length ? locationParts.join(', ') : 'Location unavailable';
      locationElement.title = 'Approximate location based on public IP';
      if (data.timezone) timeZone = data.timezone;
      updateTime();
    })
    .catch(() => {
      ipElement.textContent = 'Unavailable';
      locationElement.textContent = 'IP location unavailable';
    })
    .finally(() => window.clearTimeout(timeout));

  window.addEventListener('pagehide', () => {
    controller.abort();
    window.clearInterval(clockInterval);
  }, { once: true });
}

/* ---- INIT ALL ---- */
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initCounters();
  initTyped();
  initNavbar();
  initParallax();
  initTilt();
  initMagnetic();
  initSkillBars();
  initActiveNav();
  initScrollProgress();
  initSectionDepth();
  initVisitorReadout();

  // Hero auto-reveal with delay for cinematic effect
  const heroLeft = document.querySelector('.hero-left');
  if (heroLeft) setTimeout(() => heroLeft.classList.add('active'), 400);

  // Page hero auto-reveal
  const pageHero = document.querySelector('.page-hero');
  if (pageHero) {
    pageHero.style.opacity = '0';
    pageHero.style.transform = 'translateY(20px)';
    pageHero.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    setTimeout(() => {
      pageHero.style.opacity = '1';
      pageHero.style.transform = 'none';
    }, 200);
  }
});