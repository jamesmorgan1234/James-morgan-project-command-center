(() => {
  const cfg = window.COMMAND_CENTER_CONFIG || {};
  const $ = id => document.getElementById(id);
  let hubClient = null;
  let hubMode = null;
  let loadingPromise = null;
  let refreshing = false;
  let cache = { projects: [], metrics: [], activity: [] };

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const cls = s => {
    const x = String(s || '').toLowerCase();
    if (x.includes('live')) return 'live';
    if (x.includes('active')) return 'active';
    if (x.includes('planning')) return 'planning';
    if (x.includes('pause')) return 'paused';
    if (x.includes('recover')) return 'recovery';
    if (x.includes('verified')) return 'verified';
    if (x.includes('mixed')) return 'mixed';
    if (x.includes('blocked') || x.includes('unverified') || x.includes('attention') || x.includes('needs')) return 'unverified';
    return '';
  };
  const clamp = n => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  function isListMode() { return hubMode === 'all-list' || hubMode === 'attention-list'; }
  function isDetailMode() { return hubMode === 'all-detail' || hubMode === 'attention-detail'; }
  function hubScope() { return String(hubMode || '').startsWith('attention') ? 'attention' : 'all'; }

  function isAttention(p) {
    return p.attention === true || /needs|blocked|recovery|paused/i.test(p.status || '') || /needs|unverified/i.test(p.verification || '');
  }

  function projectMetrics(id) {
    return cache.metrics.filter(m => m.project_id === id);
  }

  function progressFor(p) {
    const explicit = projectMetrics(p.id).find(m =>
      ['current_scope_progress_percent', 'scope_progress_percent', 'completion_percent'].includes(m.key) &&
      m.verified && m.value_numeric !== null && m.value_numeric !== undefined
    );
    if (explicit) return { pct: clamp(explicit.value_numeric), basis: 'Verified current-scope progress', verified: true };

    const status = String(p.status || '').toLowerCase();
    const stage = String(p.stage || '').toLowerCase();
    const next = String(p.next_action || '').toLowerCase();
    const blocker = String(p.blocker || '').toLowerCase();
    const text = [status, stage, next, blocker].join(' ');
    let pct = 45;

    if (/published\s*\/\s*live|published and live/.test(status)) pct = 100;
    else if (status === 'live' && /no build blocker|operational private command center/.test(text)) pct = 100;
    else if (/production complete/.test(status)) pct = 92;
    else if (/publishing in progress/.test(status)) pct = 88;
    else if (/ready for production boundary/.test(status)) pct = 78;
    else if (/blocked/.test(status) && /local build tested|release path blocked|before release|production has not changed/.test(text)) pct = 80;
    else if (/active rebuild/.test(status)) pct = 60;
    else if (/rebuild in progress/.test(status)) pct = 54;
    else if (/mixed/.test(status)) pct = 55;
    else if (/in progress/.test(status)) pct = 50;
    else if (/infrastructure active/.test(status)) pct = 58;
    else if (/active/.test(status)) pct = 68;
    else if (/build state needs current verification/.test(status)) pct = 42;
    else if (/needs current verification/.test(status)) pct = 38;
    else if (/waiting on external response/.test(status)) pct = 45;
    else if (/planning/.test(status)) pct = 22;
    else if (/paused/.test(status)) pct = 35;

    return { pct, basis: 'Estimated from the current verified status', verified: false };
  }

  function toneFor(p) {
    const status = String(p.status || '').toLowerCase();
    const s = [p.status, p.stage, p.blocker].join(' ').toLowerCase();
    if (/published|live/.test(status) && !/rebuild|needs|blocked/.test(s)) return 'green';
    if (/blocked|needs attention|recovery/.test(s)) return 'red';
    if (/rebuild|in progress|active/.test(s)) return 'blue';
    if (/waiting|planning|paused/.test(s)) return 'amber';
    return 'purple';
  }

  function projectByName(name) {
    const needle = String(name || '').trim().toLowerCase();
    return cache.projects.find(p => String(p.name || '').trim().toLowerCase() === needle) || null;
  }

  function projectsForScope(scope) {
    const ordered = [...cache.projects].sort((a, b) => (Number(a.sort_order) || 999999) - (Number(b.sort_order) || 999999));
    return scope === 'attention' ? ordered.filter(isAttention) : ordered;
  }

  async function ensureClient() {
    if (hubClient) return hubClient;
    if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
    hubClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: false, detectSessionInUrl: false }
    });
    return hubClient;
  }

  async function loadHubData(force = false) {
    if (!force && cache.projects.length) return cache;
    if (loadingPromise) return loadingPromise;
    loadingPromise = (async () => {
      const client = await ensureClient();
      if (!client) throw new Error('Project data connection unavailable.');
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData?.session) throw new Error('Sign in is required to load projects.');
      const [p, m, a] = await Promise.all([
        client.from('projects').select('*').order('sort_order'),
        client.from('metrics').select('*').order('updated_at', { ascending: false }),
        client.from('activity').select('*').order('happened_at', { ascending: false }).limit(100)
      ]);
      const error = p.error || m.error || a.error;
      if (error) throw error;
      cache = { projects: p.data || [], metrics: m.data || [], activity: a.data || [] };
      return cache;
    })().finally(() => { loadingPromise = null; });
    return loadingPromise;
  }

  function hubCard(p, { topPriority = false } = {}) {
    const progress = progressFor(p);
    const tone = toneFor(p);
    return `<button class="hub-project-card tone-${tone}${topPriority ? ' is-top-priority' : ''}" data-open="${esc(p.id)}" type="button" aria-label="Open ${esc(p.name)}">
      ${topPriority ? '<div class="hub-priority-ribbon"><span>★</span> Top priority</div>' : ''}
      <div class="hub-project-head">
        <div class="hub-project-name-wrap">
          <div class="hub-project-name">${esc(p.name)}</div>
          <div class="hub-project-stage">${esc(p.stage || p.category || 'Current project scope')}</div>
        </div>
        <span class="badge ${cls(p.status)}">${esc(p.status || 'Status not recorded')}</span>
      </div>
      <div class="hub-progress-head"><span>Current scope</span><strong>${progress.pct}%</strong></div>
      <div class="hub-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.pct}" aria-label="${esc(p.name)} current scope progress">
        <span class="hub-progress-fill" style="width:${progress.pct}%"></span>
      </div>
      <div class="hub-progress-basis">${esc(progress.basis)}</div>
      <div class="hub-project-next"><span>Next</span><strong>${esc(p.next_action || 'Next action not recorded')}</strong></div>
      <div class="hub-project-open">Open project <span>›</span></div>
    </button>`;
  }

  function cleanupHubClasses() {
    const view = $('projectView');
    if (!view) return;
    view.classList.remove('project-hub-list', 'project-hub-detail', 'attention-hub-list');
    const grid = $('projectGrid');
    if (grid) grid.classList.remove('hub-grid');
    const detail = $('detailPanel');
    if (detail) detail.classList.remove('hub-detail-panel');
    const listPanel = view.querySelector('.project-list-panel');
    if (listPanel) listPanel.hidden = false;
    if (detail) detail.hidden = false;
  }

  function renderHubList() {
    if (!isListMode()) return;
    const scope = hubScope();
    const view = $('projectView');
    const grid = $('projectGrid');
    const detail = $('detailPanel');
    const listPanel = view?.querySelector('.project-list-panel');
    if (!view || view.hidden || !grid || !detail || !listPanel) return;

    const list = projectsForScope(scope);
    view.classList.add('project-hub-list');
    view.classList.toggle('attention-hub-list', scope === 'attention');
    view.classList.remove('project-hub-detail');
    grid.classList.add('hub-grid');
    detail.classList.remove('hub-detail-panel');
    listPanel.hidden = false;
    detail.hidden = true;
    if ($('viewTitle')) $('viewTitle').textContent = scope === 'attention' ? 'Needs attention' : 'All projects';

    grid.innerHTML = list.map((p, index) => hubCard(p, { topPriority: scope === 'attention' && index === 0 })).join('') ||
      `<div class="muted empty-state">${scope === 'attention' ? 'Nothing currently needs attention.' : 'No projects are currently recorded.'}</div>`;
  }

  function currentDetailProject() {
    const title = $('detailPanel')?.querySelector('.detail-title')?.textContent || '';
    return projectByName(title);
  }

  function enhanceDetail() {
    if (!isDetailMode()) return;
    const scope = hubScope();
    const view = $('projectView');
    const detail = $('detailPanel');
    const listPanel = view?.querySelector('.project-list-panel');
    if (!view || view.hidden || !detail || !listPanel) return;
    const p = currentDetailProject();
    if (!p) return;

    view.classList.remove('project-hub-list', 'attention-hub-list');
    view.classList.add('project-hub-detail');
    listPanel.hidden = true;
    detail.hidden = false;
    detail.classList.add('hub-detail-panel');
    if ($('viewTitle')) $('viewTitle').textContent = p.name;

    const progress = progressFor(p);
    const tone = toneFor(p);
    detail.classList.remove('tone-blue', 'tone-red', 'tone-green', 'tone-amber', 'tone-purple');
    detail.classList.add(`tone-${tone}`);

    detail.querySelectorAll('.hub-detail-toolbar,.hub-current-state').forEach(el => el.remove());
    detail.insertAdjacentHTML('afterbegin', `<div class="hub-detail-toolbar">
      <button class="btn btn-ghost hub-back-btn" type="button" data-hub-back>‹ ${scope === 'attention' ? 'Needs attention' : 'All projects'}</button>
      <div class="hub-detail-progress">
        <div class="hub-progress-head"><span>Current scope</span><strong>${progress.pct}%</strong></div>
        <div class="hub-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.pct}"><span class="hub-progress-fill" style="width:${progress.pct}%"></span></div>
        <div class="hub-progress-basis">${esc(progress.basis)}</div>
      </div>
    </div>`);

    const meta = detail.querySelector('.project-meta');
    if (meta) {
      meta.insertAdjacentHTML('afterend', `<div class="block hub-current-state">
        <h3>Current project state</h3>
        <p><strong>Stage:</strong> ${esc(p.stage || '—')}</p>
        <p><strong>Verification:</strong> ${esc(p.verification || '—')}</p>
        ${p.source_status ? `<p><strong>Source status:</strong> ${esc(p.source_status)}</p>` : ''}
      </div>`);
    }
  }

  async function openHubList(scope = 'all') {
    hubMode = `${scope}-list`;
    try {
      await loadHubData(true);
      renderHubList();
    } catch (error) {
      console.warn('Project hub data refresh failed:', error);
      hubMode = null;
      cleanupHubClasses();
    }
  }

  async function openHubDetail() {
    try {
      await loadHubData(false);
      enhanceDetail();
    } catch (error) {
      console.warn('Project detail enhancement failed:', error);
    }
  }

  function scheduleReapply() {
    setTimeout(() => {
      if (isListMode()) {
        if (!$('projectGrid')?.firstElementChild?.classList.contains('hub-project-card')) renderHubList();
      } else if (isDetailMode()) {
        if (!$('detailPanel')?.querySelector('.hub-detail-toolbar')) enhanceDetail();
      }
    }, 0);
  }

  function ensureRefreshVisual() {
    const strip = $('refreshStrip');
    const btn = $('refreshBtn');
    if (!strip || !btn || $('refreshVisual')) return;
    strip.insertAdjacentHTML('beforeend', `<div id="refreshVisual" class="refresh-visual" hidden aria-live="polite">
      <div class="refresh-visual-row">
        <span id="refreshVisualIcon" class="refresh-spinner" aria-hidden="true"></span>
        <div class="refresh-visual-copy">
          <strong id="refreshStatusTitle">Refreshing…</strong>
          <small id="refreshStatusDetail">Synchronizing current Command Center data.</small>
        </div>
      </div>
      <div class="refresh-motion-track" aria-hidden="true"><span></span></div>
    </div>`);
  }

  function startRefreshVisual() {
    ensureRefreshVisual();
    const btn = $('refreshBtn');
    const visual = $('refreshVisual');
    const icon = $('refreshVisualIcon');
    if (!btn || !visual) return;
    refreshing = true;
    btn.disabled = true;
    btn.classList.add('refreshing');
    btn.textContent = 'Refreshing…';
    visual.hidden = false;
    visual.classList.remove('is-complete', 'is-error');
    if (icon) icon.className = 'refresh-spinner';
    if ($('refreshStatusTitle')) $('refreshStatusTitle').textContent = 'Refreshing Command Center…';
    if ($('refreshStatusDetail')) $('refreshStatusDetail').textContent = 'Synchronizing current project data. Full chat-by-chat audit will activate after the canonical chat setup is finished.';
  }

  function finishRefreshVisual(ok = true) {
    const btn = $('refreshBtn');
    const visual = $('refreshVisual');
    const icon = $('refreshVisualIcon');
    if (!btn || !visual) return;
    refreshing = false;
    btn.disabled = false;
    btn.classList.remove('refreshing');
    btn.textContent = ok ? 'Refresh complete ✓' : 'Refresh failed — retry';
    visual.hidden = false;
    visual.classList.toggle('is-complete', ok);
    visual.classList.toggle('is-error', !ok);
    if (icon) icon.className = ok ? 'refresh-check' : 'refresh-error-icon';
    if ($('refreshStatusTitle')) $('refreshStatusTitle').textContent = ok ? 'Refresh complete' : 'Refresh could not complete';
    if ($('refreshStatusDetail')) $('refreshStatusDetail').textContent = ok ? 'Current Command Center project data is synchronized.' : 'The current project data could not be fully synchronized. Try Refresh again.';
    setTimeout(() => {
      if (!refreshing && btn) btn.textContent = 'Refresh now';
    }, 2200);
    setTimeout(() => {
      if (!refreshing && visual) visual.hidden = true;
    }, 5200);
  }

  async function waitForBaseRefresh() {
    const start = Date.now();
    while (Date.now() - start < 15000) {
      const text = String($('syncText')?.textContent || '');
      if (/sync error/i.test(text)) throw new Error(text);
      if (/^synced\s/i.test(text)) return text;
      await delay(100);
    }
    return String($('syncText')?.textContent || '');
  }

  document.addEventListener('click', e => {
    const eventPath = typeof e.composedPath === 'function' ? e.composedPath() : [];
    const back = e.target.closest('[data-hub-back]');
    if (back) {
      e.preventDefault();
      e.stopPropagation();
      const scope = hubScope();
      hubMode = `${scope}-list`;
      renderHubList();
      $('projectView')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const viewButton = e.target.closest('[data-view]');
    if (viewButton) {
      if (viewButton.dataset.view === 'all') setTimeout(() => openHubList('all'), 0);
      else if (viewButton.dataset.view === 'attention') setTimeout(() => openHubList('attention'), 0);
      else {
        hubMode = null;
        setTimeout(cleanupHubClasses, 0);
      }
      return;
    }

    const projectView = $('projectView');
    const pathOpen = eventPath.find(node => node?.dataset?.open);
    const projectOpen = projectView && eventPath.includes(projectView) ? pathOpen : null;
    if (projectOpen && isListMode()) {
      const scope = hubScope();
      hubMode = `${scope}-detail`;
      setTimeout(openHubDetail, 0);
      return;
    }

    if (projectOpen && isDetailMode()) {
      setTimeout(openHubDetail, 0);
      return;
    }

    const pathContinue = eventPath.find(node => node?.dataset?.continue);
    if (pathContinue && projectView && eventPath.includes(projectView) && isListMode()) {
      const scope = hubScope();
      hubMode = `${scope}-detail`;
      setTimeout(openHubDetail, 0);
    }
  });

  const projectView = $('projectView');
  if (projectView) {
    const observer = new MutationObserver(scheduleReapply);
    observer.observe(projectView, { childList: true, subtree: true });
  }

  ensureRefreshVisual();
  $('refreshBtn')?.addEventListener('click', async () => {
    if (refreshing) return;
    startRefreshVisual();
    try {
      await Promise.all([delay(650), loadHubData(true), waitForBaseRefresh()]);
      if (isListMode()) renderHubList();
      if (isDetailMode()) enhanceDetail();
      finishRefreshVisual(true);
    } catch (error) {
      console.warn('Command Center refresh visual detected a refresh problem:', error);
      finishRefreshVisual(false);
    }
  });
})();
