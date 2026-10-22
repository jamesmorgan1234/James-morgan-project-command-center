(() => {
  if (window.COMMAND_CENTER_APP_UX) return;
  window.COMMAND_CENTER_APP_UX = { version: 1 };

  const ACTIVE = new Set(['draft','active','paused','blocked','needs_user_action','partially_completed']);
  const TOOLS = ['normal_chat','research','files','github','supabase','automation','integration','analytics','security','deployment','work'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const client = () => window.COMMAND_CENTER_SUPABASE || null;
  let projectsCache = [];
  let projectsLoadedAt = 0;
  let renderBusy = false;
  let renderTimer = null;
  let aboutOpen = false;

  async function authUser() {
    const c = client();
    if (!c) return null;
    const { data: { session }, error } = await c.auth.getSession();
    if (error || !session?.user) return null;
    const gate = await c.rpc('is_command_center_authorized');
    return gate.error || !gate.data ? null : session.user;
  }

  async function rpc(name, args = {}) {
    const c = client(), user = await authUser();
    if (!c || !user) throw new Error('Authorized Command Center session required.');
    const { data, error } = await c.rpc(name, args);
    if (error) throw error;
    return data;
  }

  async function projects(force = false) {
    if (!force && projectsCache.length && Date.now() - projectsLoadedAt < 15000) return projectsCache;
    const c = client(), user = await authUser();
    if (!c || !user) return [];
    const { data, error } = await c.from('projects').select('id,name,category,status,verification,stage,next_action,blocker,last_verified').order('sort_order');
    if (error) throw error;
    projectsCache = data || [];
    projectsLoadedAt = Date.now();
    return projectsCache;
  }

  function currentTitle() {
    return document.querySelector('#detailPanel .detail-title')?.textContent?.trim() || '';
  }

  async function currentProject() {
    const rows = await projects();
    const selected = document.querySelector('#projectGrid .project-card.selected[data-open], #projectGrid .hub-project-card.selected[data-open]')?.dataset.open;
    if (selected) return rows.find(p => p.id === selected) || null;
    const title = currentTitle().toLowerCase();
    return rows.find(p => String(p.name || '').trim().toLowerCase() === title) || null;
  }

  function money(value) {
    return new Intl.NumberFormat(undefined, { style:'currency', currency:'USD', minimumFractionDigits:0, maximumFractionDigits:2 }).format(Number(value || 0));
  }

  function metricText(row) {
    if (!row) return 'N/A';
    if (row.value_numeric !== null && row.value_numeric !== undefined) {
      if (String(row.currency || '').toUpperCase() === 'USD' || String(row.unit || '').toUpperCase() === 'USD') return money(row.value_numeric);
      const n = Number(row.value_numeric);
      return Number.isFinite(n) ? new Intl.NumberFormat().format(n) : String(row.value_numeric);
    }
    return row.value_text || 'N/A';
  }

  function chooseKpis(rows) {
    const findKey = keys => keys.map(k => rows.find(r => r.metric_key === k)).find(Boolean) || null;
    const progress = findKey(['current_scope_progress_percent']);
    const revenue = findKey(['verified_revenue_usd','revenue_status','lifetime_revenue_status','mrr_status','kdp_royalties_status']);
    const audience = rows.find(r => /subscriber|customer/i.test(r.metric_key))
      || findKey(['sales_status','sale_count','verified_orders','orders','downloads_status','jobs_completed'])
      || rows.find(r => /sales|orders|downloads/i.test(r.metric_key));
    return [
      { label:'Progress', value: progress ? `${metricText(progress)}${String(progress.unit||'').toLowerCase()==='percent'?'%':''}` : 'N/A' },
      { label:'Revenue', value: revenue ? metricText(revenue) : 'N/A' },
      { label: audience?.label || 'Audience / Customers', value: audience ? metricText(audience) : 'N/A' }
    ];
  }

  async function loadProjectState(project) {
    const c = client(), user = await authUser();
    if (!c || !user) return { project, kpis:[], opportunities:[], sessions:[], agent:null };
    const [kpiRes, oppRes] = await Promise.all([
      c.from('analytics_project_kpis').select('metric_key,label,value_numeric,value_text,unit,currency,verified').eq('project_id', project.id).eq('verified', true),
      c.from('project_opportunities').select('id,title,category,status,rationale,expected_benefit,effort,monetary_cost,risk,updated_at').eq('project_id', project.id).order('updated_at', { ascending:false }).limit(4)
    ]);
    const sessions = await rpc('command_center_agent_list_sessions', { p_project_id: project.id }).catch(() => []);
    const activeSession = (sessions || []).find(s => ACTIVE.has(s.status)) || null;
    const agent = activeSession ? await rpc('command_center_agent_status', { p_session_id: activeSession.id }).catch(() => ({ session:activeSession, steps:[] })) : null;
    return { project, kpis:kpiRes.error ? [] : (kpiRes.data || []), opportunities:oppRes.error ? [] : (oppRes.data || []), sessions:sessions || [], agent };
  }

  function currentStep(agent) {
    const id = agent?.session?.current_step_id;
    return (agent?.steps || []).find(step => step.id === id) || null;
  }

  function agentState(data) {
    const session = data.agent?.session;
    if (!session) return null;
    const step = currentStep(data.agent);
    return {
      session,
      title: step?.title || session.exact_next_action || session.objective || 'Agent run queued',
      status: String(session.status || 'draft').replaceAll('_',' ')
    };
  }

  function modeObjective(mode, project, specific = '') {
    const next = project.next_action || 'determine and complete the next verified task';
    if (mode === 'next') return `Complete the exact recorded next task for ${project.name}: ${next}. Do not expand scope beyond this task except prerequisites required to verify completion. Preserve verified work and checkpoint the result.`;
    if (mode === 'until-work') return `Continue ${project.name} from the newest verified Command Center state using normal-chat and $0/free-first capabilities until the first genuine Work-only capability boundary. At that boundary, create the exact Work handoff/checkpoint and stop before Work execution.`;
    if (mode === 'specific') return `Complete this specific task for ${project.name}: ${specific}. Preserve verified work, stay inside this project, use normal chat first, and verify the result before advancing.`;
    if (mode === 'improve') return `Research ${project.name} from its newest verified state and identify the highest-value $0/free-first opportunities that could improve the build, product, revenue potential, user experience, reliability, or efficiency. Record useful opportunities in the project opportunity system. Do not expand scope into paid services or protected actions without stopping at the proper boundary.`;
    if (mode === 'opportunity') return specific;
    return `Continue ${project.name} automatically from the newest verified Command Center state. Execute all eligible work inside this project, use normal chat first, use bounded Work only when a genuine capability boundary requires it and existing Agent/Work gates allow it, checkpoint meaningful progress, preserve verified work, and stop only for completion or a genuine user/protected boundary.`;
  }

  async function createAgentRun(mode, data, specific = '') {
    if (data.agent?.session && ACTIVE.has(data.agent.session.status)) throw new Error('Agent already has an active run for this project. Pause or finish it before starting another mode.');
    if (mode === 'specific' && !String(specific).trim()) throw new Error('Enter the specific task first.');
    const project = data.project;
    const objective = modeObjective(mode, project, specific.trim());
    const isBooks = /book/i.test(project.category || '') || /^kdp-/.test(project.id || '');
    const allowWork = mode !== 'until-work' && mode !== 'improve';
    const sessionId = await rpc('command_center_agent_create_project_only_session', {
      p_objective: objective,
      p_project_id: project.id,
      p_success_criteria: [],
      p_excluded_scope: [],
      p_allowed_tool_categories: TOOLS,
      p_allow_work: allowWork,
      p_books_target: isBooks ? project.name : null,
      p_dry_run: false
    });
    return sessionId;
  }

  async function agentControl(action, sessionId) {
    const names = { pause:'command_center_agent_pause', resume:'command_center_agent_resume', cancel:'command_center_agent_cancel' };
    if (!names[action]) return;
    await rpc(names[action], { p_session_id: sessionId });
  }

  function renderOpportunities(data) {
    const open = (data.opportunities || []).filter(o => !/completed|dismissed|rejected/i.test(o.status || '')).slice(0, 2);
    if (!open.length) return `<div class="cc-appux-empty">No saved opportunities yet.</div><button class="cc-appux-small-action" type="button" data-appux-mode="improve">Find improvements</button>`;
    return open.map(o => `<article class="cc-appux-opportunity"><div><strong>${esc(o.title)}</strong><small>${esc(o.expected_benefit || o.rationale || 'Potential project improvement')}</small></div><button type="button" data-appux-opportunity="${esc(o.id)}">Run</button></article>`).join('') + `<button class="cc-appux-small-action" type="button" data-appux-mode="improve">Find more</button>`;
  }

  function renderAgent(data) {
    const state = agentState(data);
    if (state) {
      const canPause = state.session.status === 'active';
      const canResume = state.session.status === 'paused';
      return `<div class="cc-appux-agent-live"><span class="cc-appux-agent-dot"></span><div><small>Agent ${esc(state.status)}</small><strong>${esc(state.title)}</strong></div></div><div class="cc-appux-agent-live-actions">${canPause?'<button type="button" data-appux-agent-action="pause">Pause</button>':''}${canResume?'<button type="button" data-appux-agent-action="resume">Resume</button>':''}<button type="button" data-appux-agent-refresh>Refresh</button></div>`;
    }
    return `<div class="cc-appux-mode-grid">
      <button type="button" data-appux-mode="auto"><span>✦</span><strong>Auto</strong><small>Keep going safely</small></button>
      <button type="button" data-appux-mode="next"><span>▶</span><strong>Next Task</strong><small>Do only what’s next</small></button>
      <button type="button" data-appux-mode="until-work"><span>⇥</span><strong>Until Work</strong><small>Stop at Work boundary</small></button>
      <button type="button" data-appux-specific-toggle><span>⌁</span><strong>Specific</strong><small>Choose one task</small></button>
    </div><form class="cc-appux-specific" data-appux-specific-form hidden><textarea rows="2" placeholder="What exact task should Agent do?"></textarea><button type="submit">Start task</button></form>`;
  }

  function renderFocus(data) {
    const detail = document.getElementById('detailPanel');
    if (!detail || detail.hidden) return;
    let panel = detail.querySelector('#ccProjectFocusPanel');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'ccProjectFocusPanel';
      panel.className = 'cc-appux-project-focus';
      const toolbar = detail.querySelector(':scope > .hub-detail-toolbar');
      const head = detail.querySelector(':scope > .section-head');
      (toolbar || head)?.insertAdjacentElement('afterend', panel) || detail.prepend(panel);
    }
    detail.classList.add('cc-focus-ready');
    panel.dataset.projectId = data.project.id;
    const kpis = chooseKpis(data.kpis);
    panel.innerHTML = `<div class="cc-appux-status-row"><span class="cc-appux-status">${esc(data.project.status || 'Current')}</span><span>${esc(data.project.stage || data.project.verification || '')}</span></div>
      <section class="cc-appux-next"><small>Next step</small><strong>${esc(data.project.next_action || 'No next step recorded.')}</strong>${data.project.blocker?`<em>${esc(data.project.blocker)}</em>`:''}</section>
      <section class="cc-appux-kpis" aria-label="Key project metrics">${kpis.map(k=>`<div><small>${esc(k.label)}</small><strong>${esc(k.value)}</strong></div>`).join('')}</section>
      <section class="cc-appux-card cc-appux-agent"><div class="cc-appux-card-head"><div><small>AGENT</small><h3>What should Agent do?</h3></div><span class="cc-appux-agent-mark">✦</span></div>${renderAgent(data)}<div class="cc-appux-message" data-appux-message></div></section>
      <section class="cc-appux-card cc-appux-opportunities"><div class="cc-appux-card-head"><div><small>OPTIONAL</small><h3>Opportunities</h3></div><span>＋</span></div>${renderOpportunities(data)}</section>`;
    bindFocus(panel, data);
  }

  function setMessage(panel, text, error = false) {
    const el = panel.querySelector('[data-appux-message]');
    if (!el) return;
    el.textContent = text || '';
    el.classList.toggle('error', error);
  }

  function busyButton(button, on, label = 'Working…') {
    if (!button) return;
    if (on) { button.dataset.originalText = button.innerHTML; button.disabled = true; button.innerHTML = `<strong>${esc(label)}</strong>`; }
    else { button.disabled = false; if (button.dataset.originalText) button.innerHTML = button.dataset.originalText; }
  }

  function bindFocus(panel, data) {
    panel.querySelectorAll('[data-appux-mode]').forEach(button => button.addEventListener('click', async () => {
      busyButton(button, true);
      setMessage(panel, 'Starting Agent…');
      try {
        await createAgentRun(button.dataset.appuxMode, data);
        setMessage(panel, 'Agent is queued on this project.');
        await refreshProject(true);
      } catch (error) { setMessage(panel, error.message || String(error), true); busyButton(button, false); }
    }));
    panel.querySelector('[data-appux-specific-toggle]')?.addEventListener('click', () => {
      const form = panel.querySelector('[data-appux-specific-form]');
      form.hidden = !form.hidden;
      if (!form.hidden) form.querySelector('textarea')?.focus({ preventScroll:true });
    });
    panel.querySelector('[data-appux-specific-form]')?.addEventListener('submit', async event => {
      event.preventDefault();
      const form = event.currentTarget, button = form.querySelector('button'), value = form.querySelector('textarea')?.value || '';
      busyButton(button, true, 'Starting…');
      try {
        await createAgentRun('specific', data, value);
        setMessage(panel, 'Specific Agent task queued.');
        await refreshProject(true);
      } catch (error) { setMessage(panel, error.message || String(error), true); busyButton(button, false); }
    });
    panel.querySelectorAll('[data-appux-agent-action]').forEach(button => button.addEventListener('click', async () => {
      busyButton(button, true);
      try { await agentControl(button.dataset.appuxAgentAction, data.agent.session.id); await refreshProject(true); }
      catch (error) { setMessage(panel, error.message || String(error), true); busyButton(button, false); }
    }));
    panel.querySelector('[data-appux-agent-refresh]')?.addEventListener('click', () => refreshProject(true));
    panel.querySelectorAll('[data-appux-opportunity]').forEach(button => button.addEventListener('click', async () => {
      const opportunity = data.opportunities.find(o => o.id === button.dataset.appuxOpportunity);
      if (!opportunity) return;
      const task = `Evaluate and, if safe, free-first, and beneficial, execute this saved opportunity for ${data.project.name}: ${opportunity.title}. ${opportunity.rationale || opportunity.expected_benefit || ''}`;
      busyButton(button, true, 'Starting…');
      try { await createAgentRun('opportunity', data, task); await refreshProject(true); }
      catch (error) { setMessage(panel, error.message || String(error), true); busyButton(button, false); }
    }));
  }

  function polishHome() {
    const next = document.querySelector('#stats .stat-button[data-view="attention"]');
    if (next) {
      const label = next.querySelector('.label'), sub = next.querySelector('.stat-sub');
      if (label) label.textContent = 'Next Up';
      if (sub) sub.textContent = 'What needs you next';
    }
  }

  function ensureAbout() {
    if (document.getElementById('ccAboutBubble')) return;
    const button = document.createElement('button');
    button.id = 'ccAboutBubble';
    button.className = 'cc-about-bubble';
    button.type = 'button';
    button.innerHTML = '<span>ⓘ</span><strong>About</strong>';
    button.setAttribute('aria-label','Open About and advanced Command Center options');
    button.addEventListener('click', () => openAbout(true));
    document.body.appendChild(button);

    const backdrop = document.createElement('div');
    backdrop.id = 'ccAboutBackdrop';
    backdrop.className = 'cc-about-backdrop';
    backdrop.hidden = true;
    backdrop.innerHTML = `<section class="cc-about-sheet" role="dialog" aria-modal="true" aria-labelledby="ccAboutTitle"><div class="cc-about-handle"></div><div class="cc-about-head"><div><small>COMMAND CENTER</small><h2 id="ccAboutTitle">About & More</h2></div><button type="button" data-about-close aria-label="Close">×</button></div><div class="cc-about-actions"><button type="button" data-about-action="refresh"><span>↻</span><div><strong>Refresh data</strong><small>Sync current project state</small></div></button><button type="button" data-about-action="brain"><span>◉</span><div><strong>Command Center Brain</strong><small>Memory, planning and advanced tools</small></div></button><button type="button" data-about-action="agent"><span>✦</span><div><strong>Agent control</strong><small>All Agent runs and approvals</small></div></button><button type="button" data-about-action="advanced"><span>⌘</span><div><strong data-about-advanced-label>Show advanced details</strong><small>Sources, diagnostics and technical controls</small></div></button><button type="button" data-about-action="signout"><span>⇱</span><div><strong>Sign out</strong><small>Leave this private Command Center</small></div></button></div></section>`;
    backdrop.addEventListener('click', event => { if (event.target === backdrop) closeAbout(true); });
    backdrop.querySelector('[data-about-close]')?.addEventListener('click', () => closeAbout(true));
    backdrop.querySelectorAll('[data-about-action]').forEach(b => b.addEventListener('click', () => aboutAction(b.dataset.aboutAction)));
    document.body.appendChild(backdrop);
  }

  function updateAdvancedLabel() {
    const label = document.querySelector('[data-about-advanced-label]');
    if (label) label.textContent = document.body.classList.contains('cc-show-advanced') ? 'Hide advanced details' : 'Show advanced details';
  }

  function openAbout(push = true) {
    ensureAbout();
    const backdrop = document.getElementById('ccAboutBackdrop');
    if (!backdrop || aboutOpen) return;
    aboutOpen = true;
    updateAdvancedLabel();
    backdrop.hidden = false;
    requestAnimationFrame(() => backdrop.classList.add('open'));
    if (push) history.pushState({ ...history.state, ccAbout:true }, '', location.href);
  }

  function closeAbout(useHistory = false) {
    if (!aboutOpen) return;
    if (useHistory && history.state?.ccAbout) { history.back(); return; }
    aboutOpen = false;
    const backdrop = document.getElementById('ccAboutBackdrop');
    if (backdrop) { backdrop.classList.remove('open'); setTimeout(() => { if (!aboutOpen) backdrop.hidden = true; }, 180); }
  }

  function aboutAction(action) {
    if (action === 'advanced') {
      document.body.classList.toggle('cc-show-advanced');
      updateAdvancedLabel();
      schedule();
      return;
    }
    closeAbout(false);
    if (history.state?.ccAbout) history.back();
    setTimeout(() => {
      if (action === 'refresh') document.getElementById('refreshBtn')?.click();
      if (action === 'brain') document.getElementById('ccBrainHomeButton')?.click();
      if (action === 'agent') document.getElementById('ccAgentHomeButton')?.click();
      if (action === 'signout') document.getElementById('signOutBtn')?.click();
    }, 60);
  }

  async function refreshProject(force = false) {
    if (renderBusy) return;
    const detail = document.getElementById('detailPanel'), projectView = document.getElementById('projectView');
    if (!detail || detail.hidden || !projectView || projectView.hidden || !currentTitle()) return;
    renderBusy = true;
    try {
      const project = await currentProject();
      if (!project) return;
      const panel = detail.querySelector('#ccProjectFocusPanel');
      if (!force && panel?.dataset.projectId === project.id && Date.now() - Number(panel.dataset.renderedAt || 0) < 2500) return;
      const data = await loadProjectState(project);
      renderFocus(data);
      const fresh = detail.querySelector('#ccProjectFocusPanel');
      if (fresh) fresh.dataset.renderedAt = String(Date.now());
    } catch (error) {
      console.warn('Command Center app UX project render failed:', error);
    } finally { renderBusy = false; }
  }

  function schedule() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => { polishHome(); ensureAbout(); refreshProject(false); }, 90);
  }

  const observer = new MutationObserver(mutations => {
    const external = mutations.some(m => !m.target?.closest?.('#ccProjectFocusPanel,#ccAboutBackdrop,#ccAboutBubble'));
    if (external) schedule();
  });
  observer.observe(document.body, { childList:true, subtree:true, attributes:true, attributeFilter:['hidden','class'] });
  window.addEventListener('popstate', () => { if (aboutOpen && !history.state?.ccAbout) closeAbout(false); });
  window.addEventListener('visibilitychange', () => { if (!document.hidden) schedule(); });
  window.addEventListener('load', schedule, { once:true });
  window.COMMAND_CENTER_APP_UX.refresh = () => refreshProject(true);
  ensureAbout();
  schedule();
})();
