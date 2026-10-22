(() => {
  if (window.__COMMAND_CENTER_LOCKED_VISUAL_LOADER) return;
  window.__COMMAND_CENTER_LOCKED_VISUAL_LOADER = true;
  if (!document.querySelector('link[data-command-center-locked-visual]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './command-center-locked-visual-spec.css?v=3';
    link.dataset.commandCenterLockedVisual = '1';
    document.head.appendChild(link);
  }
  if (!document.querySelector('script[data-command-center-locked-visual]')) {
    const script = document.createElement('script');
    script.src = './command-center-locked-visual-spec.js?v=2';
    script.async = false;
    script.dataset.commandCenterLockedVisual = '1';
    document.head.appendChild(script);
  }
})();
