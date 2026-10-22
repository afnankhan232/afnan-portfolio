(() => {
  const track = document.getElementById('wipCarouselTrack');
  const cards = [...document.querySelectorAll('.wip-project-card')];
  const arrows = [...document.querySelectorAll('[data-carousel-direction]')];
  const filters = [...document.querySelectorAll('[data-status-filter]')];
  const detail = document.getElementById('wipProjectDetail');
  const stage = document.getElementById('wipProjectStage');
  const name = document.getElementById('wipProjectName');
  const description = document.getElementById('wipProjectDescription');
  const tags = document.getElementById('wipProjectTags');
  const dots = document.getElementById('wipCarouselDots');
  const count = document.getElementById('wipProjectCount');
  if (!track || !cards.length || !detail || !dots || !count) return;

  let currentIndex = 0;
  let activeFilter = 'all';
  let animationTimer;
  let touchStartY = null;
  let suppressCardClickUntil = 0;

  function visibleCards() {
    return cards.filter((card) => activeFilter === 'all' || card.dataset.status === activeFilter);
  }

  function setDetails(card) {
    detail.classList.remove('is-changing');
    void detail.offsetWidth;
    detail.classList.add('is-changing');
    window.clearTimeout(animationTimer);
    animationTimer = window.setTimeout(() => detail.classList.remove('is-changing'), 380);

    stage.textContent = card.dataset.stage.toUpperCase();
    name.textContent = card.querySelector('h3').textContent;
    description.textContent = card.querySelector('p').textContent;
    tags.replaceChildren();
    card.dataset.tags.split('|').forEach((tag) => {
      const pill = document.createElement('span');
      pill.className = 'wip-tag';
      pill.textContent = tag;
      tags.append(pill);
    });
  }

  function render() {
    const visible = visibleCards();
    const selectedIndex = visible.indexOf(cards[currentIndex]);
    if (selectedIndex < 0) currentIndex = cards.indexOf(visible[0]);
    const center = visible.indexOf(cards[currentIndex]);

    cards.forEach((card) => {
      card.classList.remove('center', 'up-1', 'up-2', 'down-1', 'down-2', 'hidden');
      const visibleIndex = visible.indexOf(card);
      if (visibleIndex < 0) {
        card.classList.add('hidden');
        card.setAttribute('aria-hidden', 'true');
        card.tabIndex = -1;
        return;
      }

      const offset = (visibleIndex - center + visible.length) % visible.length;
      if (offset === 0) card.classList.add('center');
      else if (offset === 1) card.classList.add('down-1');
      else if (offset === 2) card.classList.add('down-2');
      else if (offset === visible.length - 1) card.classList.add('up-1');
      else if (offset === visible.length - 2) card.classList.add('up-2');
      else card.classList.add('hidden');
      card.setAttribute('aria-hidden', String(offset > 2 && offset < visible.length - 2));
      card.tabIndex = card.classList.contains('hidden') ? -1 : 0;
    });

    const selected = cards[currentIndex];
    setDetails(selected);
    count.textContent = `${String(center + 1).padStart(2, '0')} / ${String(visible.length).padStart(2, '0')} PROJECTS`;
    dots.replaceChildren();
    visible.forEach((card, position) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = `wip-dot${card === selected ? ' is-active' : ''}`;
      dot.setAttribute('aria-label', `Show ${card.querySelector('h3').textContent}`);
      dot.setAttribute('aria-current', String(card === selected));
      dot.addEventListener('click', () => {
        currentIndex = cards.indexOf(card);
        render();
      });
      dots.append(dot);
    });
  }

  function move(direction) {
    const visible = visibleCards();
    if (visible.length < 2) return;
    const position = visible.indexOf(cards[currentIndex]);
    currentIndex = cards.indexOf(visible[(position + direction + visible.length) % visible.length]);
    render();
  }

  arrows.forEach((button) => {
    button.addEventListener('click', () => move(Number(button.dataset.carouselDirection)));
  });

  cards.forEach((card, index) => {
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Show project: ${card.querySelector('h3').textContent}`);
    card.addEventListener('click', () => {
      if (performance.now() < suppressCardClickUntil) return;
      currentIndex = index;
      render();
    });
    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      currentIndex = index;
      render();
    });
  });

  filters.forEach((button) => {
    button.addEventListener('click', () => {
      activeFilter = button.dataset.statusFilter;
      filters.forEach((filterButton) => {
        const active = filterButton === button;
        filterButton.classList.toggle('is-active', active);
        filterButton.setAttribute('aria-pressed', String(active));
      });
      if (!visibleCards().some((card) => cards.indexOf(card) === currentIndex)) {
        currentIndex = cards.indexOf(visibleCards()[0]);
      }
      render();
    });
  });

  track.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowLeft'].includes(event.key)) {
      event.preventDefault();
      move(-1);
    } else if (['ArrowDown', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
      move(1);
    }
  });

  track.addEventListener('pointerdown', (event) => {
    touchStartY = event.clientY;
  });
  track.addEventListener('pointerup', (event) => {
    if (touchStartY === null) return;
    const difference = touchStartY - event.clientY;
    if (Math.abs(difference) > 45) {
      suppressCardClickUntil = performance.now() + 450;
      move(difference > 0 ? 1 : -1);
    }
    touchStartY = null;
  });
  track.addEventListener('pointercancel', () => { touchStartY = null; });

  render();
})();
