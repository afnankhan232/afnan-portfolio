// ============================================================
// particles.js — Cinematic Particle Network
// Interactive particles with connecting lines, mouse reactivity,
// depth layers, and theme-aware colors
// ============================================================
(function () {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const DARK_COLORS  = ['#ff6b35', '#ff375f', '#bf5af2', '#f7c948', '#ffd700', '#ff8c61', '#38bdf8'];
  const LIGHT_COLORS = ['#e85d04', '#c1121f', '#7b2d8b', '#d4a017', '#b8860b', '#ff8c61', '#0077b6'];
  const COUNT = 80;
  const LINE_DIST = 140;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W, H, particles = [], stars = [];
  let mouseX = -1000, mouseY = -1000;
  let frame = 0;

  function isDark() {
    return document.body.classList.contains('dark-mode');
  }
  function getColors() {
    return isDark() ? DARK_COLORS : LIGHT_COLORS;
  }

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    stars = Array.from({ length: 64 }, () => ({
      x: rand(0, W),
      y: rand(0, H),
      radius: rand(0.7, 1.65),
      phase: rand(0, Math.PI * 2),
      speed: rand(0.012, 0.035),
    }));
  }

  function rand(a, b) { return Math.random() * (b - a) + a; }

  function createParticle(scattered) {
    const colors = getColors();
    return {
      x:     rand(0, W),
      y:     scattered ? rand(0, H) : H + rand(5, 50),
      r:     rand(0.6, 2.5),
      vx:    rand(-0.3, 0.3),
      vy:    rand(-0.5, -0.08),
      life:  rand(0.4, 1),
      decay: rand(0.0006, 0.0018),
      alpha: rand(0.2, 0.65),
      col:   colors[Math.floor(Math.random() * colors.length)],
      depth: rand(0.3, 1), // depth layer for parallax
    };
  }

  function init() {
    particles = Array.from({ length: COUNT }, () => createParticle(true));
  }

  function drawStars() {
    const color = isDark() ? '#fff8e8' : '#101014';
    stars.forEach((star) => {
      const twinkle = reducedMotion ? 0.52 : 0.2 + (Math.sin(frame * star.speed + star.phase) + 1) * 0.22;
      ctx.save();
      ctx.globalAlpha = twinkle;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
      if (twinkle > 0.38) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.65;
        ctx.beginPath();
        ctx.moveTo(star.x - star.radius * 3, star.y);
        ctx.lineTo(star.x + star.radius * 3, star.y);
        ctx.moveTo(star.x, star.y - star.radius * 3);
        ctx.lineTo(star.x, star.y + star.radius * 3);
        ctx.stroke();
      }
      ctx.restore();
    });
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    frame += reducedMotion ? 0 : 1;
    drawStars();

    // Gradient links and traveling pulses make the network feel active.
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < LINE_DIST) {
          const opacity = (1 - dist / LINE_DIST) * 0.2 * particles[i].alpha * particles[j].alpha;
          const hue = (frame * 0.35 + i * 13 + j * 7) % 360;
          const gradient = ctx.createLinearGradient(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
          gradient.addColorStop(0, `hsla(${hue}, 88%, 68%, 0.9)`);
          gradient.addColorStop(1, `hsla(${(hue + 64) % 360}, 92%, 72%, 0.82)`);
          ctx.save();
          ctx.globalAlpha = opacity;
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          const phase = (frame * 0.008 + i * 0.17 + j * 0.11) % 1;
          ctx.globalAlpha = opacity * 3.5;
          ctx.fillStyle = `hsl(${hue}, 96%, ${isDark() ? 78 : 45}%)`;
          ctx.beginPath();
          ctx.arc(particles[i].x + dx * phase, particles[i].y + dy * phase, 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // Update and draw particles
    particles.forEach((p, i) => {
      // Mouse repulsion
      const mdx = p.x - mouseX;
      const mdy = p.y - mouseY;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist > 0 && mdist < 120) {
        const force = (120 - mdist) / 120;
        p.x += (mdx / mdist) * force * 1.5;
        p.y += (mdy / mdist) * force * 1.5;
      }

      if (!reducedMotion) {
        p.x += p.vx * p.depth;
        p.y += p.vy * p.depth;
        p.life -= p.decay;
      }

      if (!reducedMotion && (p.y < -10 || p.life <= 0 || p.x < -20 || p.x > W + 20)) {
        particles[i] = createParticle(false);
        return;
      }

      ctx.save();
      ctx.globalAlpha = p.alpha * Math.max(p.life, 0);
      ctx.fillStyle = p.col;
      ctx.shadowBlur = 12 * p.depth;
      ctx.shadowColor = p.col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.depth, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    requestAnimationFrame(loop);
  }

  // Mouse tracking
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  window.addEventListener('mouseleave', () => {
    mouseX = -1000;
    mouseY = -1000;
  });

  window.addEventListener('resize', () => { resize(); init(); }, { passive: true });
  function initCursor() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const cursor = document.createElement('div');
    const rocket = document.createElement('span');
    const fins = document.createElement('span');
    const flame = document.createElement('span');
    cursor.className = 'rocket-cursor';
    rocket.className = 'rocket-pointer';
    fins.className = 'rocket-fins';
    flame.className = 'rocket-flame';
    rocket.append(fins, flame);
    cursor.setAttribute('aria-hidden', 'true');
    cursor.append(rocket);
    document.body.append(cursor);
    let targetX = -100;
    let targetY = -100;
    let previousX = null;
    let previousY = null;
    let lastSmokeAt = 0;
    let currentAngle = 45;
    let targetAngle = 45;
    let angleFrame = 0;

    function animateAngle() {
      const delta = ((targetAngle - currentAngle + 540) % 360) - 180;
      if (Math.abs(delta) < 0.35) {
        currentAngle = targetAngle;
        rocket.style.setProperty('--rocket-angle', `${currentAngle}deg`);
        angleFrame = 0;
        return;
      }
      currentAngle += delta * 0.24;
      rocket.style.setProperty('--rocket-angle', `${currentAngle}deg`);
      angleFrame = requestAnimationFrame(animateAngle);
    }

    function emitSmoke(x, y, dx, dy) {
      const distance = Math.hypot(dx, dy);
      if (distance < 0.5) return;
      const puff = document.createElement('span');
      const drift = 16 + Math.random() * 18;
      puff.className = 'rocket-smoke';
      puff.setAttribute('aria-hidden', 'true');
      puff.style.left = `${x - (dx / distance) * 12}px`;
      puff.style.top = `${y - (dy / distance) * 12}px`;
      puff.style.setProperty('--smoke-dx', `${-(dx / distance) * drift + (Math.random() - 0.5) * 10}px`);
      puff.style.setProperty('--smoke-dy', `${-(dy / distance) * drift + (Math.random() - 0.5) * 10}px`);
      puff.style.setProperty('--smoke-size', `${5 + Math.random() * 7}px`);
      document.body.append(puff);
      puff.addEventListener('animationend', () => puff.remove(), { once: true });
    }

    window.addEventListener('pointermove', (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
      document.body.classList.add('has-custom-cursor');
      cursor.style.transform = `translate3d(${targetX}px, ${targetY}px, 0)`;
      const dx = previousX === null ? 0 : targetX - previousX;
      const dy = previousY === null ? 0 : targetY - previousY;
      const distance = Math.hypot(dx, dy);
      if (distance > 4) {
        targetAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
        if (!angleFrame) angleFrame = requestAnimationFrame(animateAngle);
      }
      const now = performance.now();
      if (!reducedMotion && distance > 4 && now - lastSmokeAt > 34) {
        emitSmoke(targetX, targetY, dx, dy);
        lastSmokeAt = now;
      }
      previousX = targetX;
      previousY = targetY;
      document.body.classList.toggle('rocket-hovering', Boolean(event.target.closest?.('a, button, [role="button"], input, textarea, select')));
    }, { passive: true });
    window.addEventListener('pointerdown', () => document.body.classList.add('rocket-pressed'));
    window.addEventListener('pointerup', () => document.body.classList.remove('rocket-pressed'));
    window.addEventListener('blur', () => document.body.classList.remove('rocket-hovering', 'rocket-pressed'));
  }

  resize();
  init();
  initCursor();
  loop();
})();
