(() => {
  if (window.COMMAND_CENTER_APPROVED_NAV) return;
  window.COMMAND_CENTER_APPROVED_NAV = { version: 4 };

  function ensureStyle(key, href) {
    let link = document.querySelector(`link[data-${key}]`);
    if (!link) {
      link = document.createElement('link');
      link.rel = 'stylesheet';
      link.dataset[key] = '1';
    }
    link.href = href;
    document.head.appendChild(link);
    return link;
  }

  function ensureScript(key, src) {
    let script = document.querySelector(`script[data-${key}]`);
    if (script) return script;
    script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset[key] = '1';
    document.body.appendChild(script);
    return script;
  }

  function enforceLockedVisualTail() {
    ensureStyle('commandCenterLockedVisualTail', './command-center-locked-visual-spec.css?v=3');
    ensureStyle('commandCenterLockedVisualFinalFix', './command-center-locked-visual-final.css?v=1');
  }

  function ensureControlSurface() {
    ensureStyle('commandCenterControlSurface', './command-center-control-surface.css?v=1');
    ensureScript('commandCenterControlSurface', './command-center-control-surface.js?v=1');
  }

  enforceLockedVisualTail();
  ensureControlSurface();
  window.addEventListener('load', () => { setTimeout(enforceLockedVisualTail, 0); setTimeout(ensureControlSurface, 0); }, { once: true });
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
    history.pushState({ccApproved:'home'},'',location.href);
    window.dispatchEvent(new PopStateEvent('popstate',{state:{ccApproved:'home'}}));
  }, true);
})();