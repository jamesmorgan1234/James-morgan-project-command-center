(() => {
  const $ = id => document.getElementById(id);
  let scheduled = false;
  let applying = false;
  let guardedBrand = null;

  const norm = value => String(value || '').trim().toLowerCase();

  function headingText(block) {
    return norm(block?.querySelector('h3')?.textContent || block?.querySelector('summary b')?.textContent || '');
  }

  function currentProjectName() {
    return ($('detailPanel')?.querySelector('.detail-title')?.textContent || $('viewTitle')?.textContent || '').trim();
  }

  function moveSyncUnderRefresh() {
    const strip = $('refreshStrip');
    const sync = $('syncText');
    if (!strip || !sync) return;
    let dock = document.querySelector('.cc7-sync-dock');
    if (!dock) {
      dock = document.createElement('div');
      dock.className = 'cc7-sync-dock';
      strip.insertAdjacentElement('afterend', dock);
    }
    if (sync.parentElement !== dock) dock.appendChild(sync);
  }

  function decorateEarningsCard() {
    const card = document.querySelector('.stat-button[data-view="earning"]');
    if (!card) return;
    const label = card.querySelector('.label');
    const value = card.querySelector('.value');
    const sub = card.querySelector('.stat-sub');
    if (label) label.textContent = 'Project Earnings';
    if (!value) return;
    const source = `${sub?.textContent || ''} ${value.textContent || ''}`;
    const moneyMatch = source.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
    const numberMatch = String(value.textContent || '').replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);
    const amount = moneyMatch ? Number(moneyMatch[1].replace(/,/g,'')) : numberMatch ? Number(numberMatch[0]) : 0;
    value.textContent = Number.isFinite(amount) ? amount.toLocaleString(undefined,{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}) : '$0.00';
    card.dataset.cc7Earnings = '1';
  }

  function hidePersonalPerformance() {
    const name = norm(currentProjectName());
    const detail = $('detailPanel');
    if (!detail || detail.hidden) return;

    const performance = $('projectPerformancePanel');
    if (performance) {
      const shouldHide = name === 'edge finder' || name === 'command center' || name.includes('master project command center');
      performance.dataset.cc7Hidden = shouldHide ? 'true' : 'false';
    }

    detail.querySelectorAll('.block,.ccv4-compact-block,.cc6-tracking-panel').forEach(block => {
      const h = headingText(block);
      if (!h.includes('tracking integrations')) return;
      block.dataset.cc7Hidden = name === 'edge finder' ? 'true' : 'false';
    });
  }

  const missingHourOrder = new Map([
    ['the unlived hour',1],
    ['the dead between minutes',2],
    ['the house outside time',3],
    ['what the town forgot',4],
    ['the hour that remains',5]
  ]);

  function orderMissingHourBooks() {
    if (norm(currentProjectName()) !== 'the missing hour saga') return;
    const list = $('bookRevenuePanel')?.querySelector('.book-revenue-list');
    if (!list) return;
    const rows = [...list.querySelectorAll('.book-revenue-row')];
    const sorted = [...rows].sort((a,b) => {
      const at = norm(a.querySelector('.book-revenue-title')?.textContent);
      const bt = norm(b.querySelector('.book-revenue-title')?.textContent);
      return (missingHourOrder.get(at) || 999) - (missingHourOrder.get(bt) || 999);
    });
    const alreadySorted = rows.every((row,i) => row === sorted[i]);
    if (!alreadySorted) sorted.forEach(row => list.appendChild(row));
    sorted.forEach((row,i) => {
      const title = norm(row.querySelector('.book-revenue-title')?.textContent);
      const correct = missingHourOrder.get(title) || (i + 1);
      const cover = row.querySelector('.cc6-book-cover');
      if (cover) {
        cover.dataset.number = String(correct);
        cover.dataset.coverState = cover.classList.contains('has-approved-cover') ? 'approved' : 'awaiting-approved-asset';
        cover.setAttribute('aria-label',`Book ${correct}: ${row.querySelector('.book-revenue-title')?.textContent?.trim() || ''}`);
      }
    });
  }

  function removeDuplicateSnapshot() {
    const snapshot = $('kdpSnapshotPanel');
    if (snapshot) snapshot.dataset.cc7Hidden = 'true';
  }

  function ensureBrandGuard() {
    const img = document.querySelector('.brand-icon');
    if (!img) return;
    const wanted = './command-center-approved-icon-512.png?icon=7-ui';
    if (!img.getAttribute('src')?.includes('command-center-approved-icon-512.png')) img.setAttribute('src',wanted);
    if (guardedBrand === img) return;
    guardedBrand = img;
    new MutationObserver(() => {
      if (!img.getAttribute('src')?.includes('command-center-approved-icon-512.png')) img.setAttribute('src',wanted);
    }).observe(img,{attributes:true,attributeFilter:['src']});
  }

  function enforceThemeIdentity() {
    if (document.documentElement.dataset.commandCenterTheme !== 'v6') document.documentElement.dataset.commandCenterTheme = 'v6';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && meta.content !== '#000000') meta.content = '#000000';
    document.documentElement.style.setProperty('background-color','#000000','important');
    document.body?.style.setProperty('background-color','#000000','important');
    ensureBrandGuard();
  }

  function apply() {
    if (applying) return;
    applying = true;
    try {
      enforceThemeIdentity();
      moveSyncUnderRefresh();
      decorateEarningsCard();
      hidePersonalPerformance();
      orderMissingHourBooks();
      removeDuplicateSnapshot();
    } finally {
      applying = false;
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      apply();
    });
  }

  document.addEventListener('click', () => {
    setTimeout(schedule, 0);
    setTimeout(schedule, 120);
  }, true);

  const root = $('dashboard') || document.body;
  if (root) new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  new MutationObserver(() => {
    if (document.documentElement.dataset.commandCenterTheme !== 'v6') enforceThemeIdentity();
  }).observe(document.documentElement,{attributes:true,attributeFilter:['data-command-center-theme']});
  window.addEventListener('load',() => { apply(); setTimeout(apply,180); setTimeout(apply,700); },{once:true});
  apply();
})();
