(() => {
  if (window.COMMAND_CENTER_AUTHORITATIVE_RUNTIME?.version >= 4) return;
  const api = window.COMMAND_CENTER_AUTHORITATIVE_RUNTIME = { version: 4 };
  let timer = null;

  const CHECKPOINT_TOOLS = ['normal_chat','files','github','supabase','analytics'];
  const OPEN_SESSION_STATES = new Set(['draft','active','paused','blocked','needs_user_action','partially_completed']);
  const RUNNER_STALE_MS = 90 * 60 * 1000;

  function statusMessage(button){
    return button.closest('.cc-approved-agent-home')?.querySelector('#ccApprovedAgentHomeMsg')
      || button.closest('.cc-approved-agent')?.querySelector('[data-cc-agent-message]')
      || document.querySelector('#ccApprovedAgentHomeMsg,[data-cc-agent-message]');
  }

  function addCheckpointButtons(){
    if (document.body.classList.contains('cc-approved-legacy-open')) return;
    document.querySelectorAll('#ccApprovedApp .cc-approved-agent-modes').forEach(group => {
      if (group.querySelector('[data-cc-agent-checkpoint]')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cc-approved-agent-checkpoint';
      button.dataset.ccAgentCheckpoint = '1';
      button.innerHTML = '<strong>Project Checkpoint</strong><small>Tell me where this project stands</small>';
      group.appendChild(button);
    });
  }

  function addStopControls(){
    if (document.body.classList.contains('cc-approved-legacy-open')) return;
    document.querySelectorAll('#ccApprovedApp .cc-approved-agent-home').forEach(host => {
      if (host.querySelector('[data-cc-agent-stop]')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cc-approved-agent-stop';
      button.dataset.ccAgentStop = '1';
      button.innerHTML = '<strong>Stop Agent</strong><small>Cancel a waiting or working run</small>';
      const message = host.querySelector('#ccApprovedAgentHomeMsg');
      if (message) message.insertAdjacentElement('beforebegin', button);
      else host.appendChild(button);
    });
  }

  function decorateRevenue(){
    document.querySelectorAll('#ccApprovedApp .cc-approved-revenue-list > button').forEach(button => {
      button.classList.add('cc-approved-revenue-item');
      if (button.querySelector('.cc-approved-revenue-emblem')) return;
      const emblem = document.createElement('span');
      emblem.className = 'cc-approved-emblem cc-approved-revenue-emblem';
      emblem.setAttribute('aria-hidden','true');
      emblem.textContent = '$';
      button.prepend(emblem);
    });
  }

  function markBookProject(root){
    root.classList.toggle('cc-approved-book-project', !!root.querySelector('.cc-approved-project-hero.art-eclipse'));
  }

  function enforce(){
    if (document.body.classList.contains('cc-approved-legacy-open')) return;
    const dashboard = document.getElementById('dashboard');
    const root = document.getElementById('ccApprovedApp');
    if (!dashboard || !root) return;
    dashboard.hidden = false;
    root.hidden = false;
    const about = document.getElementById('ccApprovedAbout');
    if (about && about.parentElement !== root) root.appendChild(about);
    markBookProject(root);
    addCheckpointButtons();
    addStopControls();
    decorateRevenue();
  }

  function schedule(delay=0){
    clearTimeout(timer);
    timer = setTimeout(() => requestAnimationFrame(enforce), delay);
  }

  function followRender(){
    [100,320,760].forEach(delay => setTimeout(() => requestAnimationFrame(enforce), delay));
  }

  async function authorizedClient(){
    const client = window.COMMAND_CENTER_SUPABASE;
    if (!client) throw new Error('Command Center is not connected yet.');
    const { data:{ session }, error:sessionError } = await client.auth.getSession();
    if (sessionError || !session?.user) throw new Error('Authorized Command Center session required.');
    const gate = await client.rpc('is_command_center_authorized');
    if (gate.error || !gate.data) throw new Error('Authorized Command Center session required.');
    return client;
  }

  async function runnerHealth(client){
    const { data, error } = await client.rpc('command_center_agent_tool_health');
    if (error) throw error;
    const row = (data || []).find(item => item.capability_key === 'background_runner') || null;
    const lastSuccess = row?.last_success_at ? Date.parse(row.last_success_at) : NaN;
    const fresh = Number.isFinite(lastSuccess) && (Date.now() - lastSuccess) <= RUNNER_STALE_MS;
    return {
      ready: row?.availability === 'available' && fresh,
      row,
      fresh
    };
  }

  async function requireLiveRunner(button){
    const message = statusMessage(button);
    const client = await authorizedClient();
    const health = await runnerHealth(client);
    if (!health.ready) {
      if (message) message.textContent = 'Agent runner is not active right now. No run was created.';
      throw new Error('Agent runner is not active right now. No run was created.');
    }
    return client;
  }

  async function projectIdForCheckpoint(button, client){
    const home = button.closest('.cc-approved-agent-home');
    if (home) {
      const id = home.querySelector('#ccApprovedAgentProject')?.value || '';
      if (!id) throw new Error('Choose a project first.');
      return id;
    }
    const root = button.closest('#ccApprovedApp');
    const name = root?.querySelector('.cc-approved-project-hero > div > span > strong')?.textContent?.trim() || '';
    if (!name) throw new Error('Open a project first.');
    const { data, error } = await client.from('projects').select('id,name').eq('name',name).limit(2);
    if (error) throw error;
    if (!data?.length) throw new Error('That project could not be matched to its verified record.');
    if (data.length > 1) throw new Error('More than one project has this name. Open it from Projects and try again.');
    return data[0].id;
  }

  async function startCheckpoint(button){
    const message = statusMessage(button);
    try {
      button.disabled = true;
      if (message) message.textContent = 'Checking Agent runner…';
      const client = await requireLiveRunner(button);
      if (message) message.textContent = 'Reading the newest verified project checkpoint…';
      const projectId = await projectIdForCheckpoint(button, client);
      const { data:project, error:projectError } = await client.from('projects')
        .select('id,name,category,next_action,status,stage,verification,blocker,last_verified')
        .eq('id',projectId).single();
      if (projectError) throw projectError;
      const objective = `STATUS REVIEW ONLY for ${project.name}. Read the newest verified Command Center project state and available checkpoints, reconcile where this project currently stands, and explain it in plain language for James. Summarize: (1) what is verified complete, (2) the current stage and trustworthy progress if available, (3) what remains open, (4) any real blocker or user action needed, and (5) the exact next step. Do not execute project work, do not change external systems or database records, do not deploy or publish, do not start Work, and do not treat this review as authorization for any side effect. Avoid raw JSON, internal checkpoint plumbing, IDs, or technical metadata unless it is necessary to explain a blocker.`;
      const args = {
        p_objective: objective,
        p_project_id: projectId,
        p_success_criteria: [
          'Explain the newest verified project state in plain language.',
          'Separate verified-complete work from open work and blockers.',
          'State the exact next step without executing it.',
          'Make no external, database, deployment, publishing, or Work changes.'
        ],
        p_excluded_scope: ['project execution','external changes','database changes','deployment','publishing','Work execution'],
        p_allowed_tool_categories: CHECKPOINT_TOOLS,
        p_allow_work: false,
        p_books_target: /book|kdp|coloring|workbook/i.test(`${project.id} ${project.category || ''} ${project.name}`) ? project.name : null,
        p_dry_run: false
      };
      const { error } = await client.rpc('command_center_agent_create_project_only_session', args);
      if (error) throw error;
      if (message) message.textContent = 'Checkpoint review requested. Agent is starting this project review.';
      setTimeout(() => window.COMMAND_CENTER_APPROVED_UI?.refresh?.(), 250);
      setTimeout(() => window.COMMAND_CENTER_AGENT_TRUTH?.refresh?.(), 450);
    } catch (error) {
      if (message && !/runner is not active/i.test(message.textContent || '')) message.textContent = error?.message || String(error);
    } finally {
      button.disabled = false;
    }
  }

  async function stopAgent(button){
    const message = statusMessage(button);
    try {
      button.disabled = true;
      if (message) message.textContent = 'Checking current Agent work…';
      const client = await authorizedClient();
      const { data:rows, error } = await client.rpc('command_center_agent_list_sessions',{p_project_id:null});
      if (error) throw error;
      let live = (rows || []).filter(row => OPEN_SESSION_STATES.has(row.status));
      const home = button.closest('.cc-approved-agent-home');
      const selectedProject = home?.querySelector('#ccApprovedAgentProject')?.value || '';
      if (selectedProject) live = live.filter(row => (row.current_project_id || row.primary_project_id) === selectedProject);
      if (!live.length) {
        if (message) message.textContent = selectedProject ? 'No waiting or working Agent run exists for that project.' : 'No waiting or working Agent run exists.';
        return;
      }
      if (!selectedProject && live.length > 1) {
        if (message) message.textContent = 'Choose the project you want to stop first.';
        return;
      }
      const priority = { active:0, needs_user_action:1, blocked:2, partially_completed:3, paused:4, draft:5 };
      live.sort((a,b) => (priority[a.status] ?? 99) - (priority[b.status] ?? 99) || new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
      const target = live[0];
      const { data:result, error:cancelError } = await client.rpc('command_center_agent_cancel',{p_session_id:target.id});
      if (cancelError) throw cancelError;
      if (message) message.textContent = result?.waiting_for_atomic_action
        ? 'Stop requested. Agent will stop after the current safe action.'
        : 'Agent run canceled.';
      setTimeout(() => window.COMMAND_CENTER_APPROVED_UI?.refresh?.(), 200);
      setTimeout(() => window.COMMAND_CENTER_AGENT_TRUTH?.refresh?.(), 350);
    } catch (error) {
      if (message) message.textContent = error?.message || String(error);
    } finally {
      button.disabled = false;
    }
  }

  async function gateAndReplay(button){
    const message = statusMessage(button);
    try {
      button.disabled = true;
      if (message) message.textContent = 'Checking Agent runner…';
      await requireLiveRunner(button);
      button.dataset.ccRunnerGatePass = '1';
      button.disabled = false;
      button.click();
    } catch (error) {
      if (message && !/runner is not active/i.test(message.textContent || '')) message.textContent = error?.message || String(error);
    } finally {
      delete button.dataset.ccRunnerGatePass;
      button.disabled = false;
    }
  }

  async function gateAndReplayForm(form){
    const button = form.querySelector('button[type="submit"]') || form;
    const message = statusMessage(button);
    try {
      if (button instanceof HTMLButtonElement) button.disabled = true;
      if (message) message.textContent = 'Checking Agent runner…';
      await requireLiveRunner(button);
      form.dataset.ccRunnerGatePass = '1';
      if (button instanceof HTMLButtonElement) button.disabled = false;
      form.requestSubmit();
    } catch (error) {
      if (message && !/runner is not active/i.test(message.textContent || '')) message.textContent = error?.message || String(error);
    } finally {
      delete form.dataset.ccRunnerGatePass;
      if (button instanceof HTMLButtonElement) button.disabled = false;
    }
  }

  document.addEventListener('click', event => {
    const checkpoint = event.target.closest?.('[data-cc-agent-checkpoint]');
    if (checkpoint) {
      event.preventDefault();
      event.stopImmediatePropagation();
      startCheckpoint(checkpoint);
      return;
    }

    const stop = event.target.closest?.('[data-cc-agent-stop]');
    if (stop) {
      event.preventDefault();
      event.stopImmediatePropagation();
      stopAgent(stop);
      return;
    }

    const mode = event.target.closest?.('[data-cc-agent-mode],[data-cc-agent-home-mode]');
    if (mode && !mode.dataset.ccRunnerGatePass) {
      const requestedMode = mode.dataset.ccAgentHomeMode || mode.dataset.ccAgentMode || '';
      if (requestedMode !== 'manual') {
        event.preventDefault();
        event.stopImmediatePropagation();
        gateAndReplay(mode);
        return;
      }
    }

    if (event.target.closest?.('[data-cc-home],[data-cc-project],[data-cc-back],[data-cc-about-close]')) {
      schedule(100);
      followRender();
    }
  }, true);

  document.addEventListener('submit', event => {
    const form = event.target.closest?.('.cc-approved-manual[data-cc-manual-form],#ccApprovedAgentHomeManual');
    if (!form || form.dataset.ccRunnerGatePass) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    gateAndReplayForm(form);
  }, true);

  window.addEventListener('load', () => { schedule(120); followRender(); }, { once: true });
  window.addEventListener('popstate', () => { schedule(80); followRender(); });
  window.addEventListener('visibilitychange', () => { if (!document.hidden) { schedule(60); followRender(); } });
  window.addEventListener('command-center:client-ready', () => { schedule(60); followRender(); });
  window.addEventListener('command-center:approved-rendered', () => schedule(0));
  [250,700,1400].forEach(ms => setTimeout(() => schedule(0), ms));

  api.enforce = enforce;
  api.refresh = () => schedule(0);
  api.startCheckpoint = startCheckpoint;
  api.stopAgent = stopAgent;
})();
