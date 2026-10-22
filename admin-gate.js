(() => {
  const form = document.getElementById('captchaForm');
  const question = document.getElementById('captchaQuestion');
  const answer = document.getElementById('captchaAnswer');
  const status = document.getElementById('captchaStatus');
  const scene = document.getElementById('adminScene');
  const mascot = document.getElementById('mascot');
  let expectedAnswer;

  function createChallenge() {
    const first = Math.floor(Math.random() * 8) + 2;
    const second = Math.floor(Math.random() * 8) + 2;
    const add = Math.random() >= 0.5;
    const larger = Math.max(first, second);
    const smaller = Math.min(first, second);
    expectedAnswer = add ? first + second : larger - smaller;
    question.textContent = `${add ? first : larger} ${add ? '+' : '-'} ${add ? second : smaller} = ?`;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (Number(answer.value) !== expectedAnswer) {
      status.textContent = 'Not quite. Try this new calculation.';
      status.classList.add('is-error');
      answer.value = '';
      createChallenge();
      answer.focus();
      return;
    }

    localStorage.setItem('ak-admin-gate', 'passed');
    window.location.replace('admin.html');
  });

  scene.addEventListener('pointermove', (event) => {
    const bounds = mascot.getBoundingClientRect();
    const lookX = Math.max(-1, Math.min(1, (event.clientX - bounds.left - bounds.width / 2) / 180));
    const lookY = Math.max(-1, Math.min(1, (event.clientY - bounds.top - bounds.height / 2) / 180));
    mascot.style.setProperty('--look-x', `${lookX * 7}px`);
    mascot.style.setProperty('--look-y', `${lookY * 5}px`);
    mascot.style.setProperty('--tilt', `${lookX * 4}deg`);
  });
  scene.addEventListener('pointerleave', () => {
    mascot.style.setProperty('--look-x', '0px');
    mascot.style.setProperty('--look-y', '0px');
    mascot.style.setProperty('--tilt', '0deg');
  });

  createChallenge();
})();