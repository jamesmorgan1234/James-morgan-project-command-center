(() => {
  const STAT_SELECTOR = '.stat-button[data-view]';
  let openView = null;
  let statsObserver = null;
  let dashboardObserver = null;

  const $ = id => document.getElementById(id);

  function ensureStack() {
    const stats = $('stats');
    const shell = document.querySelector('.view-shell');
    if (!stats || !shell) return null;

    shell.id = shell.id || 'dashboardViewShell';

    let stack = $('dashboardStack');
    if (!stack) {
      stack = document.createElement('div');
      stack.id = 'dashboardStack';
      stack.className = 'dashboard-stack';
      stats.parentNode.insertBefore(stack, stats);
      stack.append(stats, shell);
    } else {
      if (stats.parentNode !== stack) stack.prepend(stats);
      if (shell.parentNode !== stack) stack.append(shell);
    }

    return { stack, stats, shell };
  }

  function applyLayout(view = openView) {
    const parts = ensureStack();
    if (!parts) return;

    const { stats, shell } = parts;
    const buttons = [...stats.querySelectorAll(STAT_SELECTOR)];

    buttons.forEach((button, index) => {
      const order = (index + 1) * 10;
      const isOpen = Boolean(view && button.dataset.view === view);
      button.style.order = String(order);
      button.setAttribute('aria-controls', shell.id);
      button.setAttribute('aria-expanded', String(isOpen));
      button.classList.toggle('is-open', isOpen);
    });

    if (!view) {
      shell.hidden = true;
      shell.style.order = '999';
      return;
    }

    const active = buttons.find(button => button.dataset.view === view);
    if (!active) {
      shell.hidden = true;
      shell.style.order = '999';
      return;
    }

    const activeOrder = Number(active.style.order || 0);
    shell.style.order = String(activeOrder + 1);
    shell.hidden = false;
  }

  function closeCurrentView() {
    openView = null;
    const back = $('backHomeBtn');
    if (back) back.click();
    requestAnimationFrame(() => applyLayout(null));
  }

  function onDocumentClick(event) {
    const tile = event.target.closest?.(STAT_SELECTOR);
    if (tile) {
      const view = tile.dataset.view;
      const shell = document.querySelector('.view-shell');
      const sameOpenView = openView === view && shell && !shell.hidden;

      if (sameOpenView) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeCurrentView();
        return;
      }

      openView = view;
      setTimeout(() => applyLayout(view), 0);
      return;
    }

    if (event.target.closest?.('[data-from-revenue="1"]')) {
      openView = 'all';
      setTimeout(() => applyLayout('all'), 0);
      return;
    }

    if (event.target.closest?.('#backHomeBtn')) {
      openView = null;
      setTimeout(() => applyLayout(null), 0);
    }
  }

  function lockViewportAndSystemTheme() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.prepend(viewport);
    }
    viewport.content = 'width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';

    let theme = document.querySelector('meta[name="theme-color"]');
    if (!theme) {
      theme = document.createElement('meta');
      theme.name = 'theme-color';
      document.head.appendChild(theme);
    }
    theme.content = '#020b1d';

    let scheme = document.querySelector('meta[name="color-scheme"]');
    if (!scheme) {
      scheme = document.createElement('meta');
      scheme.name = 'color-scheme';
      document.head.appendChild(scheme);
    }
    scheme.content = 'dark';
  }

  function init() {
    lockViewportAndSystemTheme();
    const parts = ensureStack();
    if (!parts) return;

    openView = null;
    applyLayout(null);

    document.addEventListener('click', onDocumentClick, true);

    statsObserver = new MutationObserver(() => applyLayout(openView));
    statsObserver.observe(parts.stats, { childList: true });

    const dashboard = $('dashboard');
    if (dashboard) {
      dashboardObserver = new MutationObserver(() => {
        if (dashboard.hidden) {
          openView = null;
          applyLayout(null);
        }
      });
      dashboardObserver.observe(dashboard, { attributes: true, attributeFilter: ['hidden'] });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
