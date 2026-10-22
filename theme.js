// ============================================================
// theme.js — Bulletproof dark/light toggle
// ============================================================
(function () {
  const body   = document.body;
  const stored = localStorage.getItem('ak-theme');
  const colorThemes = ['ember', 'ocean', 'forest'];
  const storedColor = localStorage.getItem('ak-color-theme');

  // If something was stored, apply it; otherwise honour the class in HTML
  if (stored) {
    body.classList.remove('dark-mode', 'light-mode');
    body.classList.add(stored);
  }
  body.dataset.colorTheme = colorThemes.includes(storedColor) ? storedColor : 'ember';
  body.classList.toggle('glass-mode', localStorage.getItem('ak-glass-mode') === 'true');
  // At this point the class is guaranteed to be one of the two

  function setIcon() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    const isDark = body.classList.contains('dark-mode');
    btn.innerHTML = `<span class="theme-toggle-icon" aria-hidden="true">${isDark ? '☀' : '☾'}</span><span class="theme-toggle-label">${isDark ? 'Light' : 'Dark'}</span>`;
    btn.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
    btn.setAttribute('aria-pressed', String(isDark));
    btn.title = `Switch to ${isDark ? 'light' : 'dark'} theme`;
  }

  function syncAppearanceControls() {
    document.querySelectorAll('[data-color-theme]').forEach((btn) => {
      const selected = btn.dataset.colorTheme === body.dataset.colorTheme;
      btn.setAttribute('aria-pressed', String(selected));
      btn.classList.toggle('is-selected', selected);
    });
    document.querySelectorAll('#glassMode').forEach((input) => {
      input.checked = body.classList.contains('glass-mode');
    });
  }

  function setColorTheme(theme, persist = true) {
    if (!colorThemes.includes(theme)) return;
    body.dataset.colorTheme = theme;
    if (persist) localStorage.setItem('ak-color-theme', theme);
    syncAppearanceControls();
  }

  function setGlassMode(enabled, persist = true) {
    body.classList.toggle('glass-mode', enabled);
    if (persist) localStorage.setItem('ak-glass-mode', String(enabled));
    syncAppearanceControls();
  }

  // Wait for DOM so the button exists
  document.addEventListener('DOMContentLoaded', () => {
    setIcon();
    syncAppearanceControls();
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const isDark = body.classList.contains('dark-mode');
        body.classList.replace(
          isDark ? 'dark-mode' : 'light-mode',
          isDark ? 'light-mode' : 'dark-mode'
        );
        localStorage.setItem('ak-theme', body.classList.contains('dark-mode') ? 'dark-mode' : 'light-mode');
        setIcon();
      });
    }

    document.querySelectorAll('[data-color-theme]').forEach((paletteButton) => {
      paletteButton.addEventListener('click', () => setColorTheme(paletteButton.dataset.colorTheme));
    });
    document.querySelectorAll('#glassMode').forEach((input) => {
      input.addEventListener('change', () => setGlassMode(input.checked));
    });
  });

  window.addEventListener('storage', (event) => {
    if (event.key === 'ak-theme' && event.newValue) {
      body.classList.remove('dark-mode', 'light-mode');
      body.classList.add(event.newValue);
      setIcon();
    } else if (event.key === 'ak-color-theme') {
      setColorTheme(event.newValue || 'ember', false);
    } else if (event.key === 'ak-glass-mode') {
      setGlassMode(event.newValue === 'true', false);
    }
  });
})();