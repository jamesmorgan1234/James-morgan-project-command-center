(() => {
  const $ = id => document.getElementById(id);
  let queued = false;
  let applying = false;

  function enforceInlineAccordion() {
    const stack = $('dashboardStack');
    const stats = $('stats');
    const shell = $('dashboardViewShell');
    if (!stack || !stats || !shell) return;
    stack.style.setProperty('display','flex','important');
    stack.style.setProperty('flex-direction','column','important');
    stats.style.setProperty('display','contents','important');
    const buttons = [...stats.querySelectorAll('.stat-button[data-view]')].filter(b => getComputedStyle(b).display !== 'none');
    buttons.forEach((button,index) => button.style.setProperty('order',String((index + 1) * 10),'important'));
    const view = shell.dataset.accordionUnder || stack.dataset.openView || '';
    const active = buttons.find(button => button.dataset.view === view && button.getAttribute('aria-expanded') === 'true');
    if (!active || shell.hidden) {
      shell.style.setProperty('order','999','important');
      return;
    }
    const activeOrder = Number.parseInt(active.style.order || '0',10) || 0;
    shell.style.setProperty('order',String(activeOrder + 1),'important');
  }

  function decorateNoticeCards() {
    const audit = document.querySelector('.canonical-audit');
    if (audit && !audit.querySelector('.cc62-notice-emblem')) {
      audit.insertAdjacentHTML('afterbegin','<span class="cc62-notice-emblem is-database" aria-hidden="true"><span></span></span>');
    }
    const health = document.querySelector('.source-health');
    if (health && !health.querySelector('.cc62-notice-emblem')) {
      health.insertAdjacentHTML('afterbegin','<span class="cc62-notice-emblem is-shield" aria-hidden="true"><span>✓</span></span>');
    }
  }

  function markProjectViews() {
    $('projectView')?.classList.add('cc62-project-view');
    $('detailPanel')?.classList.add('cc62-detail-panel');
    $('revenueView')?.classList.add('cc62-revenue-view');
    document.querySelectorAll('.books-subhub-active,.books-group-card,.performance-panel,.performance-card,.revenue-summary,.revenue-list,.revenue-card').forEach(el => el.classList.add('cc62-deep-orange'));
  }

  function lockBookSeriesPresentation() {
    const panel = $('bookRevenuePanel');
    if (!panel) return;
    panel.classList.add('cc62-kdp-performance');
    const list = panel.querySelector('.book-revenue-list');
    if (!list) return;
    list.classList.add('cc62-books-strip');
    [...list.querySelectorAll('.book-revenue-row')].forEach((row,index) => {
      row.classList.add('cc62-book-tile');
      row.style.setProperty('--cc62-book-index',String(index));
      const cover = row.querySelector('.cc6-book-cover');
      if (cover) {
        cover.setAttribute('role','img');
        const title = row.querySelector('.book-revenue-title')?.textContent?.trim() || `Book ${index + 1}`;
        cover.setAttribute('aria-label',`${title} book cover`);
      }
    });
  }

  function lockPublicationAndPipeline() {
    $('ccv4PublicationStatus')?.classList.add('cc62-publication-status');
    $('ccv4CapabilityPipeline')?.classList.add('cc62-capability-pipeline');
    $('kdpSnapshotPanel')?.classList.add('cc62-snapshot-panel');
    document.querySelectorAll('.cc6-tracking-panel,.ccv4-compact-block').forEach(el => el.classList.add('cc62-tracking'));
  }

  function removeVisibleInternalPlumbing() {
    const detail = $('detailPanel');
    if (!detail) return;
    detail.querySelectorAll('.block').forEach(block => {
      const h = (block.querySelector('h3')?.textContent || block.querySelector('summary b')?.textContent || '').trim().toLowerCase();
      if (['private kpis','current project state','next thing to do','blocker / integrity note','continue this project','update project information','recent updates'].some(x => h === x || h.includes(x))) {
        block.hidden = true;
        block.dataset.cc62Internal = 'hidden';
      }
    });
  }

  function keepExactIconEverywhere() {
    document.querySelectorAll('.brand-icon').forEach(img => {
      if (!img.src.includes('command-center-approved-icon-512.png')) img.src = './command-center-approved-icon-512.png?icon=6-ui';
    });
    document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]').forEach(link => {
      link.href = './command-center-approved-icon-512.png?icon=6-browser';
      if (link.rel === 'icon') link.type = 'image/png';
    });
  }

  function apply() {
    if (applying) return;
    applying = true;
    try {
      document.documentElement.dataset.commandCenterTheme = 'v6';
      document.documentElement.style.setProperty('background-color','#000000','important');
      document.body?.style.setProperty('background-color','#000000','important');
      const theme = document.querySelector('meta[name="theme-color"]');
      if (theme) theme.content = '#000000';
      keepExactIconEverywhere();
      enforceInlineAccordion();
      decorateNoticeCards();
      markProjectViews();
      lockBookSeriesPresentation();
      lockPublicationAndPipeline();
      removeVisibleInternalPlumbing();
    } finally {
      applying = false;
    }
  }

  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; apply(); });
  }

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class','aria-expanded','data-accordion-under']});
  document.addEventListener('click',() => { setTimeout(apply,0); setTimeout(apply,120); },true);
  window.addEventListener('load',() => { apply(); setTimeout(apply,180); setTimeout(apply,850); },{once:true});
  apply();
})();
