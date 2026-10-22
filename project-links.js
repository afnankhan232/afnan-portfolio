(() => {
  if (typeof window.watchPortfolioSettings !== 'function') return;
  const projectCards = [...document.querySelectorAll('[data-project-id]')];

  function safeUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch {
      return '';
    }
  }

  function updateCardLink(card, url, title) {
    if (card.tagName === 'A') {
      if (url) card.href = url;
      else card.removeAttribute('href');
      if (title) card.setAttribute('aria-label', `Open ${title} in a new tab`);
      return;
    }

    if (url) {
      card.setAttribute('role', 'link');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Open ${title || 'project'} in a new tab`);
      if (!card.dataset.linkHandlerReady) {
        card.addEventListener('click', () => {
          if (card.dataset.projectUrl) window.open(card.dataset.projectUrl, '_blank', 'noopener,noreferrer');
        });
        card.addEventListener('keydown', (event) => {
          if ((event.key === 'Enter' || event.key === ' ') && card.dataset.projectUrl) {
            event.preventDefault();
            window.open(card.dataset.projectUrl, '_blank', 'noopener,noreferrer');
          }
        });
        card.dataset.linkHandlerReady = 'true';
      }
      card.dataset.projectUrl = url;
      let cue = card.querySelector('.project-card-link');
      if (!cue) {
        cue = document.createElement('span');
        cue.className = 'project-card-link';
        card.append(cue);
      }
      cue.textContent = title ? `Open ${title} ` : 'Open project ';
      const icon = document.createElement('span');
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = '\u2197';
      cue.append(icon);
      return;
    }

    card.removeAttribute('role');
    card.removeAttribute('tabindex');
    card.removeAttribute('aria-label');
    delete card.dataset.projectUrl;
    card.querySelector('.project-card-link')?.remove();
  }

  window.watchPortfolioSettings((settings) => {
    const projects = settings.projects || {};
    projectCards.forEach((card) => {
      const saved = projects[card.dataset.projectId];
      const values = saved && typeof saved === 'object' ? saved : {};
      const title = typeof values.title === 'string' ? values.title.trim() : '';
      const description = typeof values.description === 'string' ? values.description.trim() : '';
      const titleNode = card.querySelector('h3');
      const descriptionNode = card.querySelector('p');
      if (title && titleNode) titleNode.textContent = title;
      if (description && descriptionNode) descriptionNode.textContent = description;

      if (Array.isArray(values.technologies)) {
        const tagRow = card.querySelector('.tag-row');
        if (tagRow) {
          const tags = values.technologies
            .filter((tag) => typeof tag === 'string' && tag.trim())
            .map((tag) => {
              const element = document.createElement('span');
              element.className = 'tag';
              element.textContent = tag.trim();
              return element;
            });
          tagRow.replaceChildren(...tags);
        }
      }

      const savedUrl = typeof saved === 'string' ? saved : values.url;
      const url = safeUrl(savedUrl || '') || (saved === undefined ? safeUrl(card.getAttribute('href') || '') : '');
      updateCardLink(card, url, title || titleNode?.textContent || 'project');
    });
  });
})();
