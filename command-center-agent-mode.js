(() => {
  if(window.COMMAND_CENTER_AGENT_MODE)return;
  const DEFAULT_TOOLS=['normal_chat','research','files','github','supabase','automation','integration','analytics','security','deployment','work'];
  const ACTIVE_STATES=new Set(['draft','active','paused','blocked','needs_user_action','partially_completed']);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const text=v=>String(v??'').trim();
  const fmt=v=>{if(!v)return 'N/A';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString();};
  const pretty=v=>String(v||'N/A').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
  const client=()=>window.COMMAND_CENTER_SUPABASE||null;
  let projectMountToken='';
  let projectRefreshBusy=false;
  let brainRefreshBusy=false;
  let timer=null;

  async function authUser(){
    const c=client();if(!c)return null;
    const {data:{session},error}=await c.auth.getSession();if(error||!session?.user)return null;
    const gate=await c.rpc('is_command_center_authorized');
    return gate.error||!gate.data?null:session.user;
  }
  async function rpc(name,args={}){const c=client(),u=await authUser();if(!c||!u)throw new Error('Authorized Command Center session required.');const {data,error}=await c.rpc(name,args);if(error)throw error;return data;}
  async function projects(){const c=client(),u=await authUser();if(!c||!u)return[];const {data,error}=await c.from('projects').select('id,name,category,status,verification,sort_order').eq('owner_id',u.id).order('sort_order');if(error)throw error;return data||[];}
  async function projectMeta(id){const c=client(),u=await authUser();if(!c||!u)return null;const {data,error}=await c.from('projects').select('id,name,category,status,verification,next_action,last_verified').eq('owner_id',u.id).eq('id',id).single();if(error)throw error;return data;}
  async function listSessions(projectId=null){return await rpc('command_center_agent_list_sessions',{p_project_id:projectId||null})||[];}
  async function status(sessionId){return await rpc('command_center_agent_status',{p_session_id:sessionId});}

  function currentProjectId(){return document.querySelector('#projectGrid .project-card.selected')?.dataset.open||null;}
  function currentProjectName(){return document.querySelector('#detailPanel .detail-title')?.textContent?.trim()||'';}
  function statusClass(v){return ['active','completed','paused','blocked','needs_user_action','failed'].includes(v)?v:'';}
  function badge(v){return `<span class="cc-agent-badge ${statusClass(v)}">${esc(pretty(v))}</span>`;}
  function currentStep(st){const id=st?.session?.current_step_id;return (st?.steps||[]).find(x=>x.id===id)||null;}
  function nextQueuedStep(st){
    const cur=currentStep(st),rows=[...(st?.steps||[])].sort((a,b)=>(a.position??0)-(b.position??0));
    return rows.find(x=>x.status==='pending'&&x.id!==cur?.id)||null;
  }
  function mediumPending(st){return (st?.work_queue||[]).find(h=>h.model_rung==='GPT-6.1 Sol Medium'&&h.state==='proposed'&&h.approval_state==='required')||null;}
  function metricChips(st){const m=st?.metrics||{};return [
    `Steps ${m.verified_steps??0}/${m.total_steps??0}`,
    `Normal chat ${m.normal_chat_steps??0}`,
    `Work ${m.work_steps??0}`,
    `Luna ${m.luna_high_handoffs??0}`,
    `Sol Light ${m.sol_light_handoffs??0}`,
    `Sol Medium ${m.sol_medium_handoffs??0}`,
    `Work allowance ${m.work_allowance_remaining??'N/A'}`
  ].map(x=>`<span class="cc-agent-metric">${esc(x)}</span>`).join('');}
  function renderRunDetail(st,compact=false){
    if(!st?.session)return '<div class="cc-agent-empty">No Agent Mode run selected.</div>';
    const s=st.session,cur=currentStep(st),next=nextQueuedStep(st),medium=mediumPending(st),checkpoint=st.latest_checkpoint;
    const steps=compact?(st.steps||[]).slice(0,5):(st.steps||[]);
    const work=compact?(st.work_queue||[]).slice(0,4):(st.work_queue||[]);
    const breakers=(st.circuit_breakers||[]).filter(x=>x.status==='open');
    return `<div class="cc-agent-grid">
      <div class="cc-agent-stat"><span>Status</span><strong>${badge(s.status)}</strong></div>
      <div class="cc-agent-stat"><span>Scope</span><strong>${esc(s.scope_mode==='project_only'?'This Project Only':'Explicit Cross-Project')}</strong></div>
      <div class="cc-agent-stat"><span>Current project</span><strong>${esc(s.current_project_id||s.primary_project_id||'N/A')}</strong></div>
      <div class="cc-agent-stat"><span>Last checkpoint</span><strong>${esc(checkpoint?.created_at?fmt(checkpoint.created_at):'N/A')}</strong></div>
    </div>
    <div class="cc-agent-current"><small>Current task</small><strong>${esc(cur?.title||s.exact_next_action||'No task is currently running.')}</strong></div>
    <div class="cc-agent-current"><small>Next queued task</small><strong>${esc(next?.title||(!cur?s.exact_next_action:null)||'N/A')}</strong></div>
    ${medium?`<div class="cc-agent-current"><small>Approval required</small><strong>GPT-6.1 Sol Medium · ${esc((st.steps||[]).find(x=>x.id===medium.step_id)?.title||'Exact blocked step')}</strong><div class="cc-agent-actions"><button class="btn cc-agent-btn-medium" data-agent-approve-medium="${esc(medium.step_id)}">Approve Sol Medium</button></div></div>`:''}
    <div class="cc-agent-metrics">${metricChips(st)}</div>
    <div class="cc-agent-section"><div class="cc-agent-section-title">Steps</div><div class="cc-agent-step-list">${steps.length?steps.map(x=>`<div class="cc-agent-row"><strong>${esc(x.title)} ${badge(x.status)}</strong><small>${esc(pretty(x.route))}${x.model_rung?` · ${esc(x.model_rung)}`:''} · Verification ${esc(pretty(x.verification_required))}${x.failure_class?` · ${esc(pretty(x.failure_class))}`:''}</small></div>`).join(''):'<div class="cc-agent-empty">Agent runner has not prepared any steps yet.</div>'}</div></div>
    ${work.length?`<div class="cc-agent-section"><div class="cc-agent-section-title">Work queue</div><div class="cc-agent-work-list">${work.map(x=>`<div class="cc-agent-row"><strong>${esc(x.model_rung)} ${badge(x.state)}</strong><small>${esc(pretty(x.scope_class))} scope · ${esc(pretty(x.risk_class))} risk${x.failure_class?` · ${esc(pretty(x.failure_class))}`:''}</small></div>`).join('')}</div></div>`:''}
    ${breakers.length?`<div class="cc-agent-section"><div class="cc-agent-section-title">Circuit breakers</div><div class="cc-agent-breaker-list">${breakers.map(x=>`<div class="cc-agent-row"><strong>${esc(pretty(x.type))}</strong><small>${esc(x.reason)}</small></div>`).join('')}</div></div>`:''}`;
  }
  function controlButtons(st){
    const s=st?.session;if(!s)return'';
    const buttons=[];
    if(s.status==='draft'&&(st.steps||[]).length)buttons.push('<button class="btn cc-agent-btn-primary" data-agent-action="start">Start run</button>');
    if(s.status==='active')buttons.push('<button class="btn" data-agent-action="pause">Pause after safe action</button>');
    if(s.status==='paused')buttons.push('<button class="btn cc-agent-btn-primary" data-agent-action="resume">Resume</button>');
    if(!['completed','canceled','failed'].includes(s.status))buttons.push('<button class="btn cc-agent-danger" data-agent-action="cancel">Cancel unstarted work</button>');
    buttons.push('<button class="btn" data-agent-action="refresh">Refresh state</button>');
    return `<div class="cc-agent-actions">${buttons.join('')}</div>`;
  }
  function runnerNote(st){
    if(st?.session?.status==='draft'&&!(st.steps||[]).length)return '<div class="cc-agent-bridge-note">Run created and durably scoped. Execution bridge: <strong>N/A</strong>. The browser cannot fabricate a plan or execute ChatGPT tools; an authorized Agent runner must prepare the eligible steps before this run can start.</div>';
    return '<div class="cc-agent-bridge-note">State shown here comes from durable Agent Mode records, not the last screen you viewed.</div>';
  }

  async function createProjectRun(panel,project){
    const objective=text(panel.querySelector('[data-agent-objective]')?.value),booksTarget=text(panel.querySelector('[data-agent-books-target]')?.value),allowWork=!!panel.querySelector('[data-agent-allow-work]')?.checked,dryRun=!!panel.querySelector('[data-agent-dry-run]')?.checked;
    if(!objective)throw new Error('Enter the goal for this Agent Mode run.');
    if(/book/i.test(project.category||'')&&!booksTarget)throw new Error('Name the exact book, series, or Books scope Agent Mode is allowed to work on.');
    const sid=await rpc('command_center_agent_create_project_only_session',{
      p_objective:objective,p_project_id:project.id,p_success_criteria:[],p_excluded_scope:[],p_allowed_tool_categories:DEFAULT_TOOLS,p_allow_work:allowWork,p_books_target:booksTarget||null,p_dry_run:dryRun
    });
    panel.querySelector('[data-agent-objective]').value='';
    await refreshProjectPanel(project.id,sid);
  }
  async function act(sessionId,action,host){
    if(action==='refresh'){await refreshVisible();return;}
    const map={start:'command_center_agent_start_session',pause:'command_center_agent_pause',resume:'command_center_agent_resume',cancel:'command_center_agent_cancel'};
    if(!map[action])return;
    const msg=host?.querySelector('[data-agent-message]');if(msg){msg.textContent='Applying…';msg.classList.remove('error');}
    try{await rpc(map[action],{p_session_id:sessionId});if(msg)msg.textContent='State updated.';await refreshVisible();}
    catch(error){if(msg){msg.textContent=error.message||String(error);msg.classList.add('error');}else throw error;}
  }
  async function approveMedium(stepId,host){
    const msg=host?.querySelector('[data-agent-message]');if(msg){msg.textContent='Approving this exact Sol Medium step…';msg.classList.remove('error');}
    try{await rpc('command_center_agent_approve_sol_medium_step',{p_step_id:stepId,p_reason:'Owner approved Sol Medium from Command Center Agent Mode',p_expires_at:null});if(msg)msg.textContent='Sol Medium approved for this step only.';await refreshVisible();}
    catch(error){if(msg){msg.textContent=error.message||String(error);msg.classList.add('error');}else throw error;}
  }

  async function refreshProjectPanel(forceId=null,preferSession=null){
    if(projectRefreshBusy)return;projectRefreshBusy=true;
    try{
      const id=forceId||currentProjectId(),root=document.getElementById('detailPanel');
      if(!id||!root||root.hidden)return;
      const project=await projectMeta(id);if(!project)return;
      let panel=root.querySelector('#ccAgentProjectPanel');
      if(!panel||panel.dataset.projectId!==id){panel?.remove();panel=document.createElement('section');panel.id='ccAgentProjectPanel';panel.dataset.projectId=id;panel.className='block cc-agent-project-panel cc-project-detail-secondary';root.appendChild(panel);}
      const sessions=await listSessions(id);const chosen=preferSession||sessions.find(x=>ACTIVE_STATES.has(x.status))?.id||sessions[0]?.id||null;const st=chosen?await status(chosen):null;
      const books=/book/i.test(project.category||'');
      panel.innerHTML=`<div class="cc-agent-kicker">Agent Mode · This Project Only</div><h3>${esc(project.name)}</h3><p class="cc-agent-sub">Hard-lock Agent Mode to this project. It cannot switch to another project unless you create a different run.</p>
        ${st?`${renderRunDetail(st,true)}${controlButtons(st)}${runnerNote(st)}`:`<form class="cc-agent-form" data-agent-project-form><label>Goal<textarea data-agent-objective placeholder="What do you want Agent Mode to accomplish on this project?"></textarea></label>${books?'<label>Authorized Books target<input data-agent-books-target placeholder="Exact book, series, or Books scope"></label>':''}<label class="cc-agent-toggle"><input type="checkbox" data-agent-allow-work checked> Allow bounded Work only after normal-chat exhaustion</label><label class="cc-agent-toggle"><input type="checkbox" data-agent-dry-run> Dry run / shadow mode only</label><button class="btn cc-agent-btn-primary" type="submit">Turn on · This Project Only</button></form><div class="cc-agent-bridge-note">This creates a durable project-locked run. No historical or unrelated project state is modified.</div>`}
        <div class="cc-agent-status" data-agent-message></div>${sessions.length?`<div class="cc-agent-section"><div class="cc-agent-section-title">Run history</div><div class="cc-agent-run-list">${sessions.slice(0,6).map(x=>`<button class="cc-agent-run" type="button" data-agent-open-run="${esc(x.id)}"><span class="cc-agent-run-head"><strong>${esc(x.objective)}</strong>${badge(x.status)}</span><small>${esc(fmt(x.updated_at))} · ${esc(x.scope_mode==='project_only'?'This Project Only':'Cross-Project')}</small></button>`).join('')}</div></div>`:''}`;
      panel.querySelector('[data-agent-project-form]')?.addEventListener('submit',async e=>{e.preventDefault();const msg=panel.querySelector('[data-agent-message]');try{msg.textContent='Creating bounded Agent Mode run…';msg.classList.remove('error');await createProjectRun(panel,project);}catch(error){msg.textContent=error.message||String(error);msg.classList.add('error');}});
      panel.querySelectorAll('[data-agent-open-run]').forEach(b=>b.addEventListener('click',()=>refreshProjectPanel(id,b.dataset.agentOpenRun)));
      panel.querySelectorAll('[data-agent-action]').forEach(b=>b.addEventListener('click',()=>act(st.session.id,b.dataset.agentAction,panel)));
      panel.querySelectorAll('[data-agent-approve-medium]').forEach(b=>b.addEventListener('click',()=>approveMedium(b.dataset.agentApproveMedium,panel)));
      projectMountToken=id;
    }catch(error){const panel=document.getElementById('ccAgentProjectPanel');if(panel)panel.innerHTML=`<div class="cc-agent-status error">${esc(error.message||String(error))}</div>`;}
    finally{projectRefreshBusy=false;}
  }

  function injectCardButtons(){
    document.querySelectorAll('#projectGrid .project-card[data-open]').forEach(card=>{
      const actions=card.querySelector('.card-actions');if(!actions||actions.querySelector('[data-agent-project]'))return;
      const b=document.createElement('button');b.type='button';b.className='btn btn-small cc-agent-card-button';b.dataset.agentProject=card.dataset.open;b.textContent='Agent Mode';actions.appendChild(b);
    });
  }

  function selectedProjects(form){return [...form.querySelectorAll('[data-agent-project-check]:checked')].map(x=>x.value);}
  function renderBookTargets(form,rows){
    const host=form.querySelector('[data-agent-book-targets]');if(!host)return;
    const ids=new Set(selectedProjects(form));const books=rows.filter(p=>ids.has(p.id)&&/book/i.test(p.category||''));
    host.innerHTML=books.map(p=>`<label>${esc(p.name)} target<input data-agent-book-target="${esc(p.id)}" placeholder="Exact book, series, or Books scope"></label>`).join('');
  }
  async function createBrainRun(form,rows){
    const objective=text(form.elements.objective.value),ids=selectedProjects(form),allowWork=!!form.elements.allow_work.checked,dryRun=!!form.elements.dry_run.checked,lockOne=!!form.elements.project_only.checked;
    if(!objective)throw new Error('Enter the Agent Mode goal.');
    if(!ids.length)throw new Error('Select at least one project.');
    if(lockOne&&ids.length!==1)throw new Error('This Project Only requires exactly one selected project.');
    const booksTargets={};
    for(const p of rows.filter(x=>ids.includes(x.id)&&/book/i.test(x.category||''))){const v=text(form.querySelector(`[data-agent-book-target="${CSS.escape(p.id)}"]`)?.value);if(!v)throw new Error(`Name the exact Books target for ${p.name}.`);booksTargets[p.id]=v;}
    let sid;
    if(lockOne){sid=await rpc('command_center_agent_create_project_only_session',{p_objective:objective,p_project_id:ids[0],p_success_criteria:[],p_excluded_scope:[],p_allowed_tool_categories:DEFAULT_TOOLS,p_allow_work:allowWork,p_books_target:booksTargets[ids[0]]||null,p_dry_run:dryRun});}
    else{sid=await rpc('command_center_agent_create_session',{p_objective:objective,p_project_ids:ids,p_primary_project_id:ids[0],p_success_criteria:[],p_excluded_scope:[],p_permission_envelope:{allowed_tool_categories:DEFAULT_TOOLS,allow_work:allowWork},p_execution_policy:{work_concurrency:1,work_ceiling:'GPT-6.1 Sol Medium',astra_allowed:false,project_switch_mode:'explicit_only'},p_books_targets:booksTargets,p_dry_run:dryRun,p_scope_mode:'explicit_multi_project'});}
    return sid;
  }
  async function refreshBrain(preferSession=null){
    if(brainRefreshBusy)return;brainRefreshBusy=true;
    try{
      const detail=document.querySelector('[data-brain-capability-detail="Agent Mode"]');if(!detail)return;
      let mount=document.getElementById('ccAgentModeMount');if(!mount){mount=document.createElement('div');mount.id='ccAgentModeMount';detail.appendChild(mount);}
      const [rows,sessions]=await Promise.all([projects(),listSessions(null)]);const chosen=preferSession||sessions.find(x=>ACTIVE_STATES.has(x.status))?.id||sessions[0]?.id||null;const st=chosen?await status(chosen):null;
      mount.className='cc-agent-workspace';
      mount.innerHTML=`<div class="cc-agent-kicker">Agent Mode Workspace</div><h4>Bounded, auditable execution</h4><p class="cc-agent-sub">Create an explicit project scope, inspect durable current/next state, control the run, and approve Sol Medium only when the exact step requires it.</p>
      <div class="cc-agent-main-grid"><div><form class="cc-agent-form" data-agent-brain-form><label>Goal<textarea name="objective" placeholder="What outcome should Agent Mode accomplish?"></textarea></label><div class="cc-agent-project-chooser">${rows.map(p=>`<label class="cc-agent-project-option"><input type="checkbox" data-agent-project-check value="${esc(p.id)}"><span><strong>${esc(p.name)}</strong><small>${esc(p.category||'')}</small></span></label>`).join('')}</div><div class="cc-agent-book-targets" data-agent-book-targets></div><label class="cc-agent-toggle"><input type="checkbox" name="project_only"> This Project Only (hard lock; select exactly one)</label><label class="cc-agent-toggle"><input type="checkbox" name="allow_work" checked> Allow bounded Work after normal-chat exhaustion</label><label class="cc-agent-toggle"><input type="checkbox" name="dry_run"> Dry run / shadow mode</label><button class="btn cc-agent-btn-primary" type="submit">Create bounded Agent run</button></form><div class="cc-agent-status" data-agent-message></div></div><div>${st?`${renderRunDetail(st,false)}${controlButtons(st)}${runnerNote(st)}`:'<div class="cc-agent-empty">No Agent Mode runs yet.</div>'}</div></div>
      ${sessions.length?`<div class="cc-agent-section"><div class="cc-agent-section-title">Run history</div><div class="cc-agent-run-list">${sessions.slice(0,12).map(x=>`<button class="cc-agent-run" type="button" data-agent-open-run="${esc(x.id)}"><span class="cc-agent-run-head"><strong>${esc(x.objective)}</strong>${badge(x.status)}</span><small>${esc(fmt(x.updated_at))} · ${esc(x.scope_mode==='project_only'?'This Project Only':'Explicit Cross-Project')}</small></button>`).join('')}</div></div>`:''}`;
      const form=mount.querySelector('[data-agent-brain-form]');
      form?.querySelectorAll('[data-agent-project-check]').forEach(x=>x.addEventListener('change',()=>renderBookTargets(form,rows)));
      form?.addEventListener('submit',async e=>{e.preventDefault();const msg=mount.querySelector('[data-agent-message]');try{msg.textContent='Creating bounded Agent Mode run…';msg.classList.remove('error');const sid=await createBrainRun(form,rows);msg.textContent='Run created.';await refreshBrain(sid);}catch(error){msg.textContent=error.message||String(error);msg.classList.add('error');}});
      mount.querySelectorAll('[data-agent-open-run]').forEach(b=>b.addEventListener('click',()=>refreshBrain(b.dataset.agentOpenRun)));
      mount.querySelectorAll('[data-agent-action]').forEach(b=>b.addEventListener('click',()=>act(st.session.id,b.dataset.agentAction,mount)));
      mount.querySelectorAll('[data-agent-approve-medium]').forEach(b=>b.addEventListener('click',()=>approveMedium(b.dataset.agentApproveMedium,mount)));
    }catch(error){const mount=document.getElementById('ccAgentModeMount');if(mount)mount.innerHTML=`<div class="cc-agent-status error">${esc(error.message||String(error))}</div>`;}
    finally{brainRefreshBusy=false;}
  }

  async function refreshVisible(){
    injectCardButtons();
    if(document.querySelector('[data-brain-capability-detail="Agent Mode"]'))await refreshBrain();
    if(currentProjectId())await refreshProjectPanel();
  }
  function schedule(){requestAnimationFrame(()=>{injectCardButtons();const id=currentProjectId();if(id&&id!==projectMountToken)refreshProjectPanel(id);});}

  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-agent-project]');if(!b)return;
    e.preventDefault();e.stopPropagation();
    const card=b.closest('[data-open]');card?.click();
    setTimeout(()=>{refreshProjectPanel(b.dataset.agentProject).then(()=>document.getElementById('ccAgentProjectPanel')?.scrollIntoView({behavior:'smooth',block:'start'}));},80);
  },true);
  window.addEventListener('command-center:brain-capability-open',e=>{if(e.detail?.name==='Agent Mode')refreshBrain();});
  document.addEventListener('commandcenter:audit-complete',schedule);
  const observer=new MutationObserver(schedule);observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshVisible();});
  window.addEventListener('load',()=>{schedule();setTimeout(refreshVisible,600);},{once:true});
  timer=setInterval(()=>{if(!document.hidden&&(document.getElementById('ccAgentProjectPanel')||document.getElementById('ccAgentModeMount')))refreshVisible();},20000);

  window.COMMAND_CENTER_AGENT_MODE={refresh:refreshVisible,refreshProject:refreshProjectPanel,refreshBrain,listSessions,status,defaultTools:[...DEFAULT_TOOLS],destroy(){clearInterval(timer);observer.disconnect();}};
  schedule();
})();
