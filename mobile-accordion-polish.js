(() => {
  const STAT_SELECTOR = '.stat-button[data-view]';
  const NAV_MARKER = 'command-center-nav-v1';
  let openView = null;
  let statsObserver = null;
  let dashboardObserver = null;
  let restoringHistory = false;

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

  function navState(kind = 'home', view = 'home', projectId = null, scrollY = 0) {
    return {
      ccNav: NAV_MARKER,
      kind,
      view,
      projectId,
      scrollY: Math.max(0, Math.round(Number(scrollY) || 0))
    };
  }

  function isOurState(state = history.state) {
    return state?.ccNav === NAV_MARKER;
  }

  function saveCurrentScroll() {
    const state = history.state;
    if (!isOurState(state)) return;
    history.replaceState({ ...state, scrollY: Math.max(0, Math.round(window.scrollY || 0)) }, '');
  }

  function pushNavigation(kind, view, projectId = null) {
    saveCurrentScroll();
    history.pushState(navState(kind, view, projectId, 0), '');
  }

  function waitForElement(selector, timeoutMs = 1600) {
    return new Promise(resolve => {
      const existing = document.querySelector(selector);
      if (existing) return resolve(existing);
      const started = performance.now();
      const timer = setInterval(() => {
        const found = document.querySelector(selector);
        if (found || performance.now() - started >= timeoutMs) {
          clearInterval(timer);
          resolve(found || null);
        }
      }, 30);
    });
  }

  async function restoreNavigation(state) {
    if (!isOurState(state)) return;
    restoringHistory = true;
    try {
      if (state.kind === 'home' || state.view === 'home') {
        openView = null;
        const back = $('backHomeBtn');
        if (back) back.click();
        requestAnimationFrame(() => applyLayout(null));
      } else {
        openView = state.view;
        const tile = document.querySelector(`${STAT_SELECTOR}[data-view="${CSS.escape(state.view)}"]`);
        if (tile) tile.click();
        requestAnimationFrame(() => applyLayout(state.view));

        if (state.kind === 'detail' && state.projectId) {
          const escapedId = CSS.escape(state.projectId);
          const hubCard = await waitForElement(`.hub-project-card[data-open="${escapedId}"]`, 900);
          const target = hubCard || document.querySelector(`[data-open="${escapedId}"],[data-continue="${escapedId}"]`);
          if (target) target.click();
        }
      }

      setTimeout(() => {
        window.scrollTo({ top: Math.max(0, Number(state.scrollY) || 0), left: 0, behavior: 'auto' });
      }, state.kind === 'detail' ? 140 : 70);
    } finally {
      setTimeout(() => { restoringHistory = false; }, 180);
    }
  }

  function closeViaHistoryOrFallback() {
    if (isOurState(history.state) && history.state.kind !== 'home') {
      history.back();
      return;
    }
    openView = null;
    const back = $('backHomeBtn');
    if (back) back.click();
    requestAnimationFrame(() => applyLayout(null));
  }

  function onDocumentClick(event) {
    const tile = event.target.closest?.(STAT_SELECTOR);
    if (tile) {
      const view = tile.dataset.view;

      if (restoringHistory) {
        openView = view;
        setTimeout(() => applyLayout(view), 0);
        return;
      }

      const shell = document.querySelector('.view-shell');
      const sameOpenView = openView === view && shell && !shell.hidden;

      if (sameOpenView) {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeViaHistoryOrFallback();
        return;
      }

      pushNavigation('list', view, null);
      openView = view;
      setTimeout(() => applyLayout(view), 0);
      return;
    }

    const hubBack = event.target.closest?.('[data-hub-back]');
    if (hubBack && !restoringHistory) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (isOurState(history.state) && history.state.kind === 'detail') history.back();
      return;
    }

    const projectTarget = event.target.closest?.('[data-open],[data-continue]');
    if (projectTarget) {
      const projectId = projectTarget.dataset.open || projectTarget.dataset.continue;
      const fromRevenue = Boolean(event.target.closest?.('[data-from-revenue="1"]'));
      const destinationView = fromRevenue ? 'all' : (openView || history.state?.view || 'all');

      if (restoringHistory) {
        openView = destinationView;
        setTimeout(() => applyLayout(destinationView), 0);
        return;
      }

      pushNavigation('detail', destinationView, projectId);
      openView = destinationView;
      setTimeout(() => applyLayout(destinationView), 0);
      return;
    }

    if (event.target.closest?.('#backHomeBtn')) {
      if (restoringHistory) {
        openView = null;
        setTimeout(() => applyLayout(null), 0);
        return;
      }
      if (isOurState(history.state) && history.state.kind !== 'home') {
        event.preventDefault();
        event.stopImmediatePropagation();
        history.back();
        return;
      }
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

    document.documentElement.style.backgroundColor = '#020b1d';
    document.documentElement.style.colorScheme = 'dark';
    if (document.body) document.body.style.backgroundColor = '#020b1d';

    if (!document.getElementById('systemBarHardening')) {
      const style = document.createElement('style');
      style.id = 'systemBarHardening';
      style.textContent = `
        html,body{background-color:#020b1d!important;color-scheme:dark!important}
        body{overscroll-behavior-y:none}
        #app{padding-bottom:max(20px,env(safe-area-inset-bottom))!important}
        body::after{content:"";position:fixed;left:0;right:0;bottom:0;height:env(safe-area-inset-bottom);background:#020b1d;pointer-events:none;z-index:2147483646}
      `;
      document.head.appendChild(style);
    }
  }

  function initHistory() {
    history.scrollRestoration = 'manual';
    history.replaceState(navState('home', 'home', null, window.scrollY), '');
    window.addEventListener('popstate', event => {
      if (!isOurState(event.state)) return;
      restoreNavigation(event.state);
    });
  }

  function init() {
    lockViewportAndSystemTheme();
    initHistory();
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
