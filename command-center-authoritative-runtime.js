(() => {
  if (window.COMMAND_CENTER_AUTHORITATIVE_RUNTIME?.version >= 3) return;
  const api = window.COMMAND_CENTER_AUTHORITATIVE_RUNTIME = { version: 3 };
  let timer = null;

  const CHECKPOINT_TOOLS = ['normal_chat','files','github','supabase','analytics'];

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

  function enforce(){
    if (document.body.classList.contains('cc-approved-legacy-open')) return;
    const dashboard = document.getElementById('dashboard');
    const root = document.getElementById('ccApprovedApp');
    if (!dashboard || !root) return;
    dashboard.hidden = false;
    root.hidden = false;
    const about = document.getElementById('ccApprovedAbout');
    if (about && about.parentElement !== root) root.appendChild(about);
    addCheckpointButtons();
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
      if (message) message.textContent = 'Reading the newest verified project checkpoint…';
      const client = await authorizedClient();
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
      if (message) message.textContent = 'Checkpoint review queued. Agent will explain where the project stands without continuing the work.';
      setTimeout(() => window.COMMAND_CENTER_APPROVED_UI?.refresh?.(), 250);
    } catch (error) {
      if (message) message.textContent = error?.message || String(error);
    } finally {
      button.disabled = false;
    }
  }

  document.addEventListener('click', event => {
    const checkpoint = event.target.closest?.('[data-cc-agent-checkpoint]');
    if (checkpoint) {
      event.preventDefault();
      event.stopPropagation();
      startCheckpoint(checkpoint);
      return;
    }
    if (event.target.closest?.('[data-cc-home],[data-cc-project],[data-cc-back],[data-cc-about-close]')) {
      schedule(100);
      followRender();
    }
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
})();
