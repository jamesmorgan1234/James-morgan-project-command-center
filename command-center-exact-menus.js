(() => {
  const cfg = window.COMMAND_CENTER_CONFIG || {};
  const $ = id => document.getElementById(id);
  let scheduled = false;
  let brainOpen = false;
  let metricsClient = null;
  let metricMap = new Map();
  let metricsLoadedFor = '';

  const CAPABILITIES = [
    ['Project Brain','Durable Memory → Brainstorm Workspace → Context Builder → Task Queue / Planner → ChatGPT Handoff Loop.','◉'],
    ['Automation','Checks, alerts and scheduled jobs.','↻'],
    ['Integrations','Connected services and data sources.','⌁'],
    ['Analytics','Verified performance, progress and operational reporting.','▥'],
    ['Security','Permissions, safeguards and protected execution controls.','⬡'],
    ['Deployment','Release, hosting, update and rollback controls.','▲'],
    ['Agent Mode','Verified autonomous execution after prerequisite capabilities are complete.','✦']
  ];

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
  const normalize = value => String(value || '').toLowerCase();

  function under() {
    return $('dashboardViewShell')?.dataset?.cc6Under || '';
  }

  function iconSvg(title) {
    const text = normalize(title);
    if (/book|kdp|cook|color|saga|world|crown|pier|hour/.test(text)) return '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 10c7-2 12 0 16 4v25c-4-4-9-6-16-4zm32 0c-7-2-12 0-16 4v25c4-4 9-6 16-4z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>';
    if (/brain|ai|agent/.test(text)) return '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 11c-5-3-10 1-9 6-5 1-6 8-2 11-2 5 3 10 8 8 2 5 9 4 10-1V15c0-4-4-7-7-4zm10 0c5-3 10 1 9 6 5 1 6 8 2 11 2 5-3 10-8 8-2 5-9 4-10-1V15c0-4 4-7 7-4z" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
    if (/analytic|market|revenue|performance/.test(text)) return '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 39V27h7v12zm12 0V18h7v21zm12 0V9h7v30z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>';
    if (/content|document|pipeline|workbook/.test(text)) return '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M13 7h15l8 8v26H13zM28 7v9h8M18 24h13M18 30h13M18 36h9" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/></svg>';
    if (/community|social|people|fan/.test(text)) return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="11" cy="20" r="4" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="37" cy="20" r="4" fill="none" stroke="currentColor" stroke-width="3"/><path d="M14 40c0-8 4-13 10-13s10 5 10 13M3 39c0-7 3-11 8-11 2 0 4 1 5 2M45 39c0-7-3-11-8-11-2 0-4 1-5 2" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
    if (/data|database|infrastructure/.test(text)) return '<svg viewBox="0 0 48 48" aria-hidden="true"><ellipse cx="24" cy="11" rx="14" ry="6" fill="none" stroke="currentColor" stroke-width="3"/><path d="M10 11v11c0 3 6 6 14 6s14-3 14-6V11M10 22v11c0 3 6 6 14 6s14-3 14-6V22" fill="none" stroke="currentColor" stroke-width="3"/></svg>';
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 8l4 5 7-1 1 7 6 3-3 6 3 6-6 3-1 7-7-1-4 5-4-5-7 1-1-7-6-3 3-6-3-6 6-3 1-7 7 1z" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="24" cy="28" r="6" fill="none" stroke="currentColor" stroke-width="3"/></svg>';
  }

  function artFor(title) {
    const text = normalize(title);
    if (/brain|ai|agent/.test(text)) return "url('./art-brain.svg')";
    if (/analytic|revenue|performance|market/.test(text)) return "url('./art-chart.svg')";
    if (/content|pipeline/.test(text)) return "url('./art-road.svg')";
    if (/community|social|network/.test(text)) return "url('./art-network.svg')";
    if (/website|web|design/.test(text)) return "url('./art-castle.svg')";
    if (/blocked|marketing/.test(text)) return "url('./art-mountain-red.svg')";
    if (/data|database|infrastructure|deploy/.test(text)) return "url('./art-mountain.svg')";
    return "url('./art-eclipse.svg')";
  }

  function ensureIcon(card, title) {
    let icon = card.querySelector('.cc-exact-menu-icon,.cc6-project-icon');
    if (!icon) {
      icon = document.createElement('span');
      icon.innerHTML = `<span>${iconSvg(title)}</span>`;
      card.prepend(icon);
    } else if (!icon.querySelector('span') && !icon.querySelector('svg')) {
      icon.innerHTML = `<span>${iconSvg(title)}</span>`;
    } else if (icon.querySelector('svg') && !icon.querySelector(':scope > span')) {
      icon.innerHTML = `<span>${icon.innerHTML}</span>`;
    }
    icon.classList.add('cc-exact-menu-icon');
    return icon;
  }

  function ensureApprovedIconRefs() {
    const brand = document.querySelector('.brand-icon');
    if (brand && !String(brand.getAttribute('src') || '').includes('icon=7-ui')) brand.setAttribute('src','./command-center-approved-icon-512.png?icon=7-ui');
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && !String(favicon.getAttribute('href') || '').includes('icon=7-browser')) favicon.setAttribute('href','./command-center-approved-icon-512.png?icon=7-browser');
    const apple = document.querySelector('link[rel="apple-touch-icon"]');
    if (apple && !String(apple.getAttribute('href') || '').includes('icon=7-apple')) apple.setAttribute('href','./command-center-approved-icon-512.png?icon=7-apple');
  }

  function valueForStat(view) {
    return document.querySelector(`.stat-button[data-view="${view}"] .value`)?.textContent?.trim() || '0';
  }

  function ensureProjectsSummary() {
    const listPanel = document.querySelector('#projectView .project-list-panel');
    if (!listPanel || under() !== 'all') {
      $('ccExactProjectSummary')?.remove();
      return;
    }
    let summary = $('ccExactProjectSummary');
    if (!summary) {
      summary = document.createElement('div');
      summary.id = 'ccExactProjectSummary';
      summary.className = 'cc-exact-project-summary';
      const grid = $('projectGrid');
      listPanel.insertBefore(summary, grid || null);
    }
    const total = valueForStat('all');
    const active = valueForStat('active');
    const next = valueForStat('attention');
    summary.innerHTML = `<span class="cc-exact-menu-icon"><span>${iconSvg('projects folder')}</span></span><strong class="cc-exact-summary-number">${esc(total)}</strong><span class="cc-exact-summary-copy"><strong>Total Projects</strong><span>${esc(active)} active / live • ${esc(next)} next up</span></span>`;
  }

  function nextCopyFrom(card) {
    return card.querySelector('.hub-project-next strong')?.textContent?.trim() || 'Next capability step is not recorded.';
  }

  function decorateHubCards() {
    const view = under();
    if (view !== 'all' && view !== 'attention') return;
    document.querySelectorAll('#projectGrid .hub-project-card').forEach(card => {
      if (card.dataset.ccBrainOpen !== undefined) return;
      const title = card.querySelector('.hub-project-name')?.textContent?.trim() || '';
      if (!title) return;
      card.style.setProperty('--cc-exact-art', artFor(title));
      ensureIcon(card, title);
      card.querySelector('.hub-project-name')?.classList.add('cc-exact-menu-name');
      if (view === 'attention') {
        let copy = card.querySelector('.cc-exact-next-copy');
        if (!copy) {
          copy = document.createElement('div');
          copy.className = 'cc-exact-menu-copy cc-exact-next-copy';
          card.querySelector('.hub-project-head')?.insertAdjacentElement('afterend', copy);
        }
        copy.textContent = nextCopyFrom(card);
      } else {
        card.querySelector('.cc-exact-next-copy')?.remove();
      }
    });
  }

  async function loadVerifiedScopeMetrics(cards) {
    const ids = [...cards].map(card => card.dataset.open).filter(Boolean).sort();
    const signature = ids.join('|');
    if (!ids.length || signature === metricsLoadedFor) return;
    metricsLoadedFor = signature;
    try {
      if (!metricsClient) {
        if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return;
        metricsClient = window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});
      }
      const {data:sessionData} = await metricsClient.auth.getSession();
      if (!sessionData?.session) return;
      const {data,error} = await metricsClient.from('metrics').select('project_id,key,value_numeric,verified').eq('key','current_scope_progress_percent').in('project_id',ids);
      if (error) throw error;
      metricMap = new Map((data || []).filter(m => m.verified && m.value_numeric !== null && m.value_numeric !== undefined).map(m => [m.project_id,Math.max(0,Math.min(100,Math.round(Number(m.value_numeric) || 0)))]));
    } catch (error) {
      console.warn('Exact menu scope metric read failed:', error);
      metricMap = new Map();
    }
  }

  async function decorateActiveCards() {
    if (under() !== 'active') return;
    const cards = [...document.querySelectorAll('#projectGrid .project-card[data-open]')];
    await loadVerifiedScopeMetrics(cards);
    if (under() !== 'active') return;
    for (const card of cards) {
      const title = card.querySelector('h3')?.textContent?.trim() || '';
      if (!title) continue;
      card.style.setProperty('--cc-exact-art', artFor(title));
      ensureIcon(card,title);
      const scope = metricMap.get(card.dataset.open);
      let box = card.querySelector('.cc-exact-active-scope');
      if (!box) {
        box = document.createElement('div');
        box.className = 'cc-exact-active-scope';
        card.append(box);
      }
      box.innerHTML = `<strong>${scope === undefined ? 'N/A' : `${scope}%`}</strong><span>Scope</span>`;
    }
  }

  function brainCardHtml() {
    return `<button type="button" class="hub-project-card cc-brain-card" data-cc-brain-open aria-label="Open Command Center Brain roadmap" style="--cc-exact-art:url('./art-brain.svg')">
      <span class="cc-exact-menu-icon"><span>${iconSvg('Command Center Brain')}</span></span>
      <div class="hub-project-head">
        <div class="hub-project-name-wrap"><div class="hub-project-name cc-exact-menu-name">Command Center Brain</div></div>
        <span class="badge planning">Planned</span>
      </div>
      <div class="cc-exact-menu-copy cc-exact-next-copy">Command Center capabilities, upgrades, integrations and autonomy roadmap.</div>
    </button>`;
  }

  function ensureBrainFirst() {
    if (under() !== 'attention' || brainOpen) return;
    const grid = $('projectGrid');
    if (!grid) return;
    const existing = grid.querySelector('[data-cc-brain-open]');
    if (existing && grid.firstElementChild === existing) return;
    existing?.remove();
    grid.insertAdjacentHTML('afterbegin', brainCardHtml());
  }

  function renderBrainRoadmap(pushHistory = true) {
    const projectView = $('projectView');
    const listPanel = projectView?.querySelector('.project-list-panel');
    const detail = $('detailPanel');
    if (!projectView || !listPanel || under() !== 'attention') return;
    brainOpen = true;
    listPanel.hidden = true;
    if (detail) detail.hidden = true;
    $('ccBrainRoadmap')?.remove();
    const section = document.createElement('section');
    section.id = 'ccBrainRoadmap';
    section.className = 'cc-brain-roadmap';
    section.innerHTML = `<button type="button" class="cc-brain-back" data-cc-brain-back>‹ Next Up</button>
      <div class="cc-brain-roadmap-head">
        <span class="cc-exact-menu-icon"><span>${iconSvg('Command Center Brain')}</span></span>
        <h3>Command Center Brain</h3>
        <p>What Command Center itself will be able to do, and what still needs to be built, connected, upgraded or verified.</p>
      </div>
      <div class="cc-brain-capabilities">${CAPABILITIES.map(([name,description,symbol]) => `<article class="cc-brain-capability"><span class="cc-cap-icon">${esc(symbol)}</span><strong>${esc(name)}</strong><small>${esc(description)}</small><span class="badge planning">0% · Planned</span></article>`).join('')}</div>`;
    projectView.insertBefore(section, projectView.querySelector('.project-view-grid') || null);
    if ($('viewTitle')) $('viewTitle').textContent = 'Command Center Brain';
    if ($('viewDescription')) $('viewDescription').textContent = 'Command Center capability roadmap';
    projectView.scrollIntoView({block:'start'});
    if (pushHistory) history.pushState({...history.state,ccCommandCenterBrain:true},'',location.href);
  }

  function closeBrain(useHistory = true) {
    if (!brainOpen) return;
    if (useHistory && history.state?.ccCommandCenterBrain) {
      history.back();
      return;
    }
    brainOpen = false;
    $('ccBrainRoadmap')?.remove();
    const projectView = $('projectView');
    const listPanel = projectView?.querySelector('.project-list-panel');
    const detail = $('detailPanel');
    if (listPanel) listPanel.hidden = false;
    if (detail) detail.hidden = true;
    if ($('viewTitle')) $('viewTitle').textContent = 'Next Up';
    if ($('viewDescription')) $('viewDescription').textContent = 'Priority queue';
    ensureBrainFirst();
    applyExactMenus();
  }

  function applyExactMenus() {
    if (brainOpen && under() !== 'attention') {
      brainOpen = false;
      $('ccBrainRoadmap')?.remove();
    }
    ensureApprovedIconRefs();
    ensureProjectsSummary();
    decorateHubCards();
    ensureBrainFirst();
    decorateActiveCards();
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      applyExactMenus();
    });
  }

  document.addEventListener('click', event => {
    const open = event.target.closest('[data-cc-brain-open]');
    if (open) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      renderBrainRoadmap(true);
      return;
    }
    const back = event.target.closest('[data-cc-brain-back]');
    if (back) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      closeBrain(true);
    }
  },true);

  window.addEventListener('popstate', () => {
    if (brainOpen && !history.state?.ccCommandCenterBrain) closeBrain(false);
  });

  const shell = $('dashboardViewShell');
  const root = $('projectView') || document.documentElement;
  if (shell) new MutationObserver(schedule).observe(shell,{attributes:true,attributeFilter:['data-cc6-under','hidden']});
  if (root) new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  window.addEventListener('load',() => { schedule(); setTimeout(schedule,250); setTimeout(schedule,900); },{once:true});
  schedule();
})();
