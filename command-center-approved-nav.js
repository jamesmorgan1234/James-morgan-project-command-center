(() => {
  if (window.COMMAND_CENTER_APPROVED_NAV) return;
  window.COMMAND_CENTER_APPROVED_NAV = { version: 2 };

  function ensureStyle(key, href) {
    let link = document.querySelector(`link[data-${key}]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.dataset[key] = '1';
      link.href = href;
    } else if (!String(link.getAttribute('href') || '').includes(href.split('?')[0])) {
      link.href = href;
    }
    document.head.appendChild(link);
    return link;
  }

  function enforceLockedVisualTail() {
    ensureStyle('commandCenterLockedVisualTail', './command-center-locked-visual-spec.css?v=2');
    ensureStyle('commandCenterLockedVisualFinalFix', './command-center-locked-visual-final.css?v=1');
  }

  enforceLockedVisualTail();
  window.addEventListener('load', () => setTimeout(enforceLockedVisualTail, 0), { once: true });
  window.addEventListener('command-center:advanced-ready', () => setTimeout(enforceLockedVisualTail, 0));

  document.addEventListener('click', event => {
    const back = event.target.closest('#ccApprovedApp [data-cc-back]');
    if (!back) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (history.state?.ccApproved) {
      history.back();
      return;
    }
    const projects = document.querySelector('#ccApprovedApp [data-cc-home="projects"]');
    if (projects) projects.click();
  }, true);
})();