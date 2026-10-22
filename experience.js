(() => {
  const entries = [...document.querySelectorAll('[data-career-category]')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const counter = document.getElementById('timelineCount');

  function applyFilter(filter) {
    let visibleCount = 0;
    entries.forEach((entry) => {
      const visible = filter === 'all' || entry.dataset.careerCategory === filter;
      entry.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    filters.forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    counter.textContent = `${visibleCount} ${visibleCount === 1 ? 'milestone' : 'milestones'}`;
  }

  filters.forEach((button) => {
    button.addEventListener('click', () => applyFilter(button.dataset.filter));
  });
})();
