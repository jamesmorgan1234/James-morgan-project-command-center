(() => {
  const apply = () => {
    const tile = document.querySelector('.stat-button[data-view="attention"]');
    if (tile) {
      const label = tile.querySelector('.label');
      const sub = tile.querySelector('.stat-sub');
      if (label && label.textContent !== 'Next Up') label.textContent = 'Next Up';
      if (sub && sub.textContent !== 'Highest-priority moves') sub.textContent = 'Highest-priority moves';
      tile.setAttribute('aria-label', 'Next Up');
    }

    const projectView = document.getElementById('projectView');
    const inNextUp = projectView && !projectView.hidden && projectView.classList.contains('attention-hub-list');
    if (inNextUp) {
      const title = document.getElementById('viewTitle');
      const heading = document.getElementById('projectViewHeading');
      if (title && title.textContent !== 'Next Up') title.textContent = 'Next Up';
      if (heading && heading.textContent !== 'Next Up') heading.textContent = 'Next Up';
    }

    const back = projectView?.querySelector('[data-hub-back]');
    if (back && /needs attention/i.test(back.textContent || '')) {
      back.textContent = '‹ Next Up';
    }
  };

  apply();

  const observer = new MutationObserver(() => queueMicrotask(apply));
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });

  document.addEventListener('click', e => {
    if (e.target.closest('[data-view="attention"]') || e.target.closest('[data-hub-back]')) {
      setTimeout(apply, 0);
      setTimeout(apply, 120);
    }
  });
})();
