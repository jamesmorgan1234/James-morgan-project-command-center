(() => {
  const cfg = window.COMMAND_CENTER_CONFIG || {};
  const $ = id => document.getElementById(id);
  let hubClient = null;
  let hubMode = null;
  let loadingPromise = null;
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
    const s = [p.status, p.stage, p.blocker].join(' ').toLowerCase();
    if (/published|live/.test(p.status || '') && !/rebuild|needs|blocked/.test(s)) return 'green';
    if (/blocked|needs attention|recovery/.test(s)) return 'red';
    if (/rebuild|in progress|active/.test(s)) return 'blue';
    if (/waiting|planning|paused/.test(s)) return 'amber';
    return 'purple';
  }

  function projectByName(name) {
    const needle = String(name || '').trim().toLowerCase();
    return cache.projects.find(p => String(p.name || '').trim().toLowerCase() === needle) || null;
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

  function hubCard(p) {
    const progress = progressFor(p);
    const tone = toneFor(p);
    return `<button class="hub-project-card tone-${tone}" data-open="${esc(p.id)}" type="button" aria-label="Open ${esc(p.name)}">
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
    view.classList.remove('project-hub-list', 'project-hub-detail');
    const grid = $('projectGrid');
    if (grid) grid.classList.remove('hub-grid');
    const detail = $('detailPanel');
    if (detail) detail.classList.remove('hub-detail-panel');
    const listPanel = view.querySelector('.project-list-panel');
    if (listPanel) listPanel.hidden = false;
    if (detail) detail.hidden = false;
  }

  function renderHubList() {
    if (hubMode !== 'list') return;
    const view = $('projectView');
    const grid = $('projectGrid');
    const detail = $('detailPanel');
    const listPanel = view?.querySelector('.project-list-panel');
    if (!view || view.hidden || !grid || !detail || !listPanel) return;

    view.classList.add('project-hub-list');
    view.classList.remove('project-hub-detail');
    grid.classList.add('hub-grid');
    detail.classList.remove('hub-detail-panel');
    listPanel.hidden = false;
    detail.hidden = true;
    if ($('viewTitle')) $('viewTitle').textContent = 'All projects';

    const markup = cache.projects.map(hubCard).join('') || '<div class="muted empty-state">No projects are currently recorded.</div>';
    if (!grid.firstElementChild?.classList.contains('hub-project-card') || grid.childElementCount !== cache.projects.length) {
      grid.innerHTML = markup;
    }
  }

  function currentDetailProject() {
    const title = $('detailPanel')?.querySelector('.detail-title')?.textContent || '';
    return projectByName(title);
  }

  function enhanceDetail() {
    if (hubMode !== 'detail') return;
    const view = $('projectView');
    const detail = $('detailPanel');
    const listPanel = view?.querySelector('.project-list-panel');
    if (!view || view.hidden || !detail || !listPanel) return;
    const p = currentDetailProject();
    if (!p) return;

    view.classList.remove('project-hub-list');
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
      <button class="btn btn-ghost hub-back-btn" type="button" data-hub-back>‹ All projects</button>
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

  async function openHubList() {
    hubMode = 'list';
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
    hubMode = 'detail';
    try {
      await loadHubData(false);
      enhanceDetail();
    } catch (error) {
      console.warn('Project detail enhancement failed:', error);
    }
  }

  function scheduleReapply() {
    setTimeout(() => {
      if (hubMode === 'list') {
        if (!$('projectGrid')?.firstElementChild?.classList.contains('hub-project-card')) renderHubList();
      } else if (hubMode === 'detail') {
        if (!$('detailPanel')?.querySelector('.hub-detail-toolbar')) enhanceDetail();
      }
    }, 0);
  }

  document.addEventListener('click', e => {
    const back = e.target.closest('[data-hub-back]');
    if (back) {
      e.preventDefault();
      e.stopPropagation();
      hubMode = 'list';
      renderHubList();
      $('projectView')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const viewButton = e.target.closest('[data-view]');
    if (viewButton) {
      if (viewButton.dataset.view === 'all') setTimeout(openHubList, 0);
      else {
        hubMode = null;
        setTimeout(cleanupHubClasses, 0);
      }
      return;
    }

    const projectOpen = e.target.closest('#projectView [data-open]');
    if (projectOpen && hubMode === 'list') {
      hubMode = 'detail';
      setTimeout(openHubDetail, 0);
      return;
    }

    if (projectOpen) {
      setTimeout(() => {
        const title = String($('viewTitle')?.textContent || '').trim().toLowerCase();
        if (title === 'all projects') openHubDetail();
      }, 0);
      return;
    }

    const continueBtn = e.target.closest('#projectView [data-continue]');
    if (continueBtn && hubMode === 'list') {
      hubMode = 'detail';
      setTimeout(openHubDetail, 0);
    }
  });

  const projectView = $('projectView');
  if (projectView) {
    const observer = new MutationObserver(scheduleReapply);
    observer.observe(projectView, { childList: true, subtree: true });
  }

  $('refreshBtn')?.addEventListener('click', () => {
    if (!hubMode) return;
    setTimeout(async () => {
      try {
        await loadHubData(true);
        if (hubMode === 'list') renderHubList();
        if (hubMode === 'detail') enhanceDetail();
      } catch (_) {}
    }, 350);
  });
})();
