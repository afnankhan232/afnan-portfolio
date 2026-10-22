(() => {
  if (typeof window.watchPortfolioSettings !== 'function') return;

  window.watchPortfolioSettings((settings) => {
    if (!settings.resume || typeof settings.resume !== 'object') return;
    const resume = settings.resume;

    document.querySelectorAll('[data-resume-content]').forEach((element) => {
      const value = resume[element.dataset.resumeContent];
      if (typeof value === 'string') element.textContent = value;
    });

    document.querySelectorAll('[data-resume-skill]').forEach((fill) => {
      const rawValue = resume[fill.dataset.resumeSkill];
      const percentage = Number(rawValue);
      if (!Number.isInteger(percentage) || percentage < 0 || percentage > 100) return;
      fill.dataset.w = String(percentage);
      fill.setAttribute('aria-valuenow', String(percentage));
      fill.style.width = `${percentage}%`;
    });

    const name = resume.name;
    const role = resume.role;
    if (typeof name === 'string' && typeof role === 'string') {
      document.title = `${name} | ${role}`;
    }
  });
})();
