(() => {
  const $ = id => document.getElementById(id);
  let applying = false;
  let scheduled = false;
  let openView = '';

  const ICONS = {
    folder:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linejoin="round"><path d="M5 14h14l4-5h20v29H5z"/><path d="M5 18h38"/></svg>',
    play:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3"><path d="M16 10l23 14-23 14z" fill="currentColor" stroke="none"/></svg>',
    calendar:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3"><rect x="7" y="10" width="34" height="31" rx="2"/><path d="M14 5v10M34 5v10M7 19h34"/><circle cx="16" cy="27" r="1.6" fill="currentColor"/><circle cx="24" cy="27" r="1.6" fill="currentColor"/><circle cx="32" cy="27" r="1.6" fill="currentColor"/><circle cx="16" cy="34" r="1.6" fill="currentColor"/><circle cx="24" cy="34" r="1.6" fill="currentColor"/></svg>',
    dollar:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M30 13c-2-2-5-3-8-3-5 0-9 3-9 7 0 10 20 5 20 15 0 4-4 7-10 7-4 0-8-1-11-4M23 5v38"/></svg>',
    book:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M24 13c-4-5-10-7-17-7v31c7 0 13 2 17 6zM24 13c4-5 10-7 17-7v31c-7 0-13 2-17 6z"/></svg>',
    brain:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"><path d="M20 8a7 7 0 00-12 5v2a7 7 0 00-2 12 7 7 0 006 12 7 7 0 008 1V8zM28 8a7 7 0 0112 5v2a7 7 0 012 12 7 7 0 01-6 12 7 7 0 01-8 1V8z"/><path d="M14 17c4 0 6 2 6 6M12 31c4 0 6-2 8-5M34 17c-4 0-6 2-6 6M36 31c-4 0-6-2-8-5"/></svg>',
    chart:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3"><path d="M8 39V27h8v12M20 39V18h8v21M32 39V9h8v30"/></svg>',
    doc:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M11 5h18l8 8v30H11z"/><path d="M29 5v9h8M17 23h14M17 30h14M17 37h10"/></svg>',
    people:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.8"><circle cx="24" cy="15" r="6"/><circle cx="10" cy="19" r="4"/><circle cx="38" cy="19" r="4"/><path d="M14 40v-6c0-6 4-10 10-10s10 4 10 10v6M3 40v-5c0-5 3-8 8-8M45 40v-5c0-5-3-8-8-8"/></svg>',
    gear:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.8"><circle cx="24" cy="24" r="7"/><path d="M24 5v5M24 38v5M5 24h5M38 24h5M10.5 10.5l3.5 3.5M34 34l3.5 3.5M37.5 10.5L34 14M14 34l-3.5 3.5"/><circle cx="24" cy="24" r="15"/></svg>',
    database:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3"><ellipse cx="24" cy="10" rx="15" ry="6"/><path d="M9 10v11c0 3 7 6 15 6s15-3 15-6V10M9 21v11c0 3 7 6 15 6s15-3 15-6V21"/></svg>',
    megaphone:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M8 19v11h8l19 9V10l-19 9zM16 30l3 11h7l-4-9M39 18l5-4M39 31l5 4"/></svg>',
    link:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"><path d="M19 30l-4 4a8 8 0 01-11-11l8-8a8 8 0 0111 0M29 18l4-4a8 8 0 0111 11l-8 8a8 8 0 01-11 0M16 32l16-16"/></svg>',
    shield:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3"><path d="M24 5l16 6v11c0 11-6 18-16 22C14 40 8 33 8 22V11z"/><path d="M17 24l5 5 10-11"/></svg>'
  };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const norm = s => String(s || '').trim().toLowerCase();

  function iconFrame(key, cls='cc6-project-icon') {
    return `<span class="${cls}" aria-hidden="true"><span>${ICONS[key] || ICONS.gear}</span></span>`;
  }

  function setTheme() {
    document.documentElement.dataset.commandCenterTheme = 'v6';
    document.documentElement.style.backgroundColor = '#000000';
    document.body?.style.setProperty('background-color','#000000','important');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = '#000000';
    const brand = document.querySelector('.brand-icon');
    if (brand && !brand.src.includes('command-center-approved-icon-512.png')) brand.src = './command-center-approved-icon-512.png?icon=6-ui';
    document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]').forEach(link => {
      link.href = './command-center-approved-icon-512.png?icon=6-browser';
      if (link.rel === 'icon') link.type = 'image/png';
    });
  }

  function statIcon(view) {
    return view === 'all' ? 'folder' : view === 'active' ? 'play' : view === 'attention' ? 'calendar' : 'dollar';
  }

  function decorateStats() {
    const stats = $('stats');
    if (!stats) return;
    stats.querySelector('[data-view="revenue"]')?.remove();
    const labels = {
      all:['Projects','Open full portfolio'],
      active:['Active / Live','Open active projects'],
      attention:['Next Up','Highest-priority moves'],
      earning:['Projects Earning','Tracked projects earning money']
    };
    const orderMap = {all:10,active:20,attention:30,earning:40};
    stats.querySelectorAll('.stat-button[data-view]').forEach(btn => {
      const view = btn.dataset.view;
      if (!(view in labels)) return;
      btn.style.order = String(orderMap[view]);
      const label = btn.querySelector('.label');
      const sub = btn.querySelector('.stat-sub');
      if (label) label.textContent = labels[view][0];
      if (sub && view !== 'earning') sub.textContent = labels[view][1];
      if (sub && view === 'earning' && /not yet integrated/i.test(sub.textContent)) sub.textContent = '$0.00 tracked';
      if (!btn.querySelector('.cc6-stat-icon')) btn.insertAdjacentHTML('afterbegin', iconFrame(statIcon(view),'cc6-stat-icon'));
    });
    placeOpenShell(openView);
  }

  function placeOpenShell(view) {
    const shell = $('dashboardViewShell');
    if (!shell) return;
    const map = {all:11,active:21,attention:31,earning:41};
    shell.style.order = String(map[view] || 99);
    shell.dataset.cc6Under = view || '';
  }

  function viewCopy(view) {
    return view === 'all' ? ['Projects','Full portfolio of tracked projects'] :
      view === 'active' ? ['Active / Live','Live projects in progress'] :
      view === 'attention' ? ['Next Up','Priority queue'] :
      view === 'earning' ? ['Projects Earning','Projects with tracked revenue'] : null;
  }

  function decorateViewHeader() {
    const copy = viewCopy(openView);
    if (!copy) return;
    const title = $('viewTitle');
    const desc = $('viewDescription');
    const back = $('backHomeBtn');
    if (title) title.textContent = copy[0];
    if (desc) desc.textContent = copy[1];
    if (back) {
      back.hidden = false;
      back.textContent = 'Back';
      back.setAttribute('aria-label','Back to Command Center overview');
      back.title = 'Back';
    }
  }

  function projectIconKey(card) {
    const text = norm(`${card.dataset.open || ''} ${card.textContent || ''}`);
    if (/kdp-|book|trilogy|series|cookbook|workbook|coloring/.test(text)) return 'book';
    if (/command center|brain| ai |agent|system/.test(` ${text} `)) return 'brain';
    if (/analytics|metric|data visual|performance/.test(text)) return 'chart';
    if (/content|video|clip|media|document/.test(text)) return 'doc';
    if (/community|fan|social/.test(text)) return 'people';
    if (/database|infrastructure|supabase|data layer/.test(text)) return 'database';
    if (/marketing|outreach|launch/.test(text)) return 'megaphone';
    if (/security/.test(text)) return 'shield';
    return 'gear';
  }

  function artForCard(card, i) {
    const text = norm(`${card.dataset.open || ''} ${card.textContent || ''}`);
    if (/kdp-|book|trilogy|series/.test(text)) return './art-eclipse.svg';
    if (/brain| ai |agent/.test(` ${text} `)) return './art-brain.svg';
    if (/analytics|performance|revenue/.test(text)) return './art-chart.svg';
    if (/content|clip|video|media/.test(text)) return './art-road.svg';
    if (/community|social|fan/.test(text)) return './art-network.svg';
    if (/database|infrastructure/.test(text)) return './art-castle.svg';
    if (/marketing|blocked/.test(text)) return './art-mountain-red.svg';
    return ['./art-mountain.svg','./art-road.svg','./art-network.svg','./art-chart.svg'][i % 4];
  }

  function decorateProjectCards() {
    const cards = [...document.querySelectorAll('#projectGrid .hub-project-card[data-open]')];
    cards.forEach((card,i) => {
      card.style.setProperty('--cc6-art',`url('${artForCard(card,i)}')`);
      if (!card.querySelector('.cc6-project-icon')) card.insertAdjacentHTML('afterbegin', iconFrame(projectIconKey(card)));
      const progressText = card.querySelector('.hub-progress-head strong')?.textContent?.trim() || 'N/A';
      const m = progressText.match(/(\d{1,3})\s*%/);
      const pct = m ? Math.max(0,Math.min(100,Number(m[1]))) : null;
      let ring = card.querySelector('.cc6-project-ring');
      if (!ring) {
        ring = document.createElement('span');
        ring.className = 'cc6-project-ring';
        card.appendChild(ring);
      }
      ring.classList.toggle('is-na',pct === null);
      ring.style.setProperty('--cc6-pct',String(pct ?? 0));
      ring.innerHTML = `<b>${pct === null ? 'N/A' : `${pct}%`}</b>`;
      ring.setAttribute('aria-label',`${card.querySelector('.hub-project-name')?.textContent || 'Project'} progress: ${pct === null ? 'not available' : `${pct} percent`}`);
    });
  }

  function hideInternalBlocks() {
    const detail = $('detailPanel');
    if (!detail) return;
    const hiddenHeadings = [
      'private kpis','current project state','next thing to do','blocker / integrity note','continue this project',
      'update project information','recent updates','source metadata','checkpoint mechanics'
    ];
    detail.querySelectorAll('.block').forEach(block => {
      const h = norm(block.querySelector('h3')?.textContent || block.querySelector('summary b')?.textContent || '');
      const internal = hiddenHeadings.some(x => h === x || h.includes(x));
      if (internal) {
        block.hidden = true;
        block.dataset.cc6Internal = 'hidden';
      }
    });
    detail.querySelectorAll('[data-ccv4-internal="hidden"]').forEach(el => {
      el.hidden = true; el.dataset.cc6Internal = 'hidden';
    });
  }

  function decorateDetailHero() {
    const detail = $('detailPanel');
    if (!detail || detail.hidden) return;
    const section = [...detail.children].find(el => el.classList?.contains('section-head'));
    if (!section) return;
    section.classList.add('cc6-detail-hero');
  }

  function bookCoverArt(index) {
    return [
      './art-eclipse.svg','./art-mountain.svg','./art-castle.svg','./art-mountain-red.svg','./art-network.svg',
      './art-road.svg','./art-brain.svg','./art-chart.svg'
    ][index % 8];
  }

  function decorateBooksInSeries() {
    const panel = $('bookRevenuePanel');
    if (!panel) return;
    const list = panel.querySelector('.book-revenue-list');
    if (!list) return;
    if (!list.previousElementSibling?.classList?.contains('cc6-books-heading')) {
      const count = list.querySelectorAll('.book-revenue-row').length;
      list.insertAdjacentHTML('beforebegin',`<div class="cc6-books-heading"><strong>Books in Series</strong><span>${count} book${count === 1 ? '' : 's'}</span></div>`);
    }
    [...list.querySelectorAll('.book-revenue-row')].forEach((row,i) => {
      const wrap = row.querySelector('.book-revenue-title-wrap');
      const title = row.querySelector('.book-revenue-title')?.textContent?.trim() || `Book ${i+1}`;
      if (wrap && !wrap.querySelector('.cc6-book-cover')) {
        const cover = document.createElement('div');
        cover.className = 'cc6-book-cover';
        cover.dataset.number = String(i+1);
        cover.style.setProperty('--cc6-cover-art',`url('${bookCoverArt(i)}')`);
        cover.innerHTML = `<b>${esc(title)}</b>`;
        wrap.prepend(cover);
      }
    });
    const primary = panel.querySelector('.book-revenue-primary');
    if (primary && !primary.querySelector('.cc6-scope-cell')) {
      const pctText = document.querySelector('.hub-detail-progress .hub-progress-head strong')?.textContent?.trim();
      if (pctText) {
        const span = document.createElement('span');
        span.className = 'cc6-scope-cell';
        span.innerHTML = `<small>Current scope</small><strong>${esc(pctText)}</strong>`;
        primary.appendChild(span);
      }
    }
  }

  function compactTracking() {
    const detail = $('detailPanel');
    if (!detail) return;
    detail.querySelectorAll('.block').forEach(block => {
      const h = norm(block.querySelector('h3')?.textContent || block.querySelector('summary b')?.textContent || '');
      if (h.includes('tracking integrations')) block.classList.add('cc6-tracking-panel');
    });
  }

  function decoratePipeline() {
    const panel = $('ccv4CapabilityPipeline');
    if (!panel) return;
    panel.querySelectorAll('.ccv4-pipeline-item').forEach(item => {
      const key = item.dataset.capability || '';
      const icon = item.querySelector('.ccv4-pipeline-icon');
      const map = { 'project-brain':'brain','publishing':'book','automation':'gear','integrations':'link','analytics':'chart','security':'shield','deployment':'gear','agent-mode':'brain','commerce-operations':'database','content-engine':'doc' };
      if (icon && !icon.dataset.cc6Svg) {
        icon.innerHTML = ICONS[map[key] || 'gear'];
        icon.dataset.cc6Svg = '1';
      }
    });
  }

  function removeNoticeXs() {
    document.querySelectorAll('.canonical-audit button,.source-health button').forEach(btn => {
      const t = norm(btn.textContent || btn.getAttribute('aria-label'));
      if (t === '×' || t === 'x' || t.includes('dismiss') || t.includes('close')) btn.remove();
    });
  }

  function applyAll() {
    if (applying) return;
    applying = true;
    try {
      setTheme();
      decorateStats();
      decorateViewHeader();
      decorateProjectCards();
      decorateDetailHero();
      hideInternalBlocks();
      decorateBooksInSeries();
      compactTracking();
      decoratePipeline();
      removeNoticeXs();
    } finally { applying = false; }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; applyAll(); });
  }

  document.addEventListener('click', e => {
    const tile = e.target.closest('.stat-button[data-view]');
    if (tile) {
      openView = tile.dataset.view || '';
      placeOpenShell(openView);
      setTimeout(schedule,0); setTimeout(schedule,100);
      return;
    }
    if (e.target.closest('#backHomeBtn')) {
      openView = '';
      setTimeout(schedule,0);
      return;
    }
  }, true);

  const observer = new MutationObserver(schedule);
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});
  window.addEventListener('load',() => { applyAll(); setTimeout(applyAll,180); setTimeout(applyAll,700); },{once:true});
  applyAll();
})();
