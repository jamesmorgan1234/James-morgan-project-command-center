(() => {
  if (window.COMMAND_CENTER_ADVANCED_LAZY_LOADER) return;
  window.COMMAND_CENTER_ADVANCED_LAZY_LOADER = { version: 1 };

  let replaying = false;
  document.addEventListener('click', async event => {
    const button = event.target.closest?.('[data-cc-about-action="brain"],[data-cc-about-action="advanced"]');
    if (!button || replaying || window.COMMAND_CENTER_ADVANCED_READY) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    button.disabled = true;
    const previous = button.textContent;
    button.textContent = 'Loading…';

    try {
      if (typeof window.COMMAND_CENTER_LOAD_ADVANCED !== 'function') throw new Error('Advanced loader is unavailable.');
      await window.COMMAND_CENTER_LOAD_ADVANCED();
      replaying = true;
      button.disabled = false;
      button.textContent = previous;
      button.click();
    } catch (error) {
      button.disabled = false;
      button.textContent = previous;
      console.error('Command Center advanced load failed', error);
    } finally {
      replaying = false;
    }
  }, true);
})();