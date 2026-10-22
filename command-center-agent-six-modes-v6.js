(() => {
  if (window.COMMAND_CENTER_AGENT_SIX_MODES_V6) return;
  window.COMMAND_CENTER_AGENT_SIX_MODES_V6 = true;

  const TOOLS=['normal_chat','research','files','github','supabase','automation','integration','analytics','security','deployment','work'];
  const CHECKPOINT_TOOLS=['normal_chat','files','github','supabase','analytics'];
  const OPEN=new Set(['draft','active','paused','blocked','needs_user_action','partially_completed']);
  const STALE=90*60*1000;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  let timer=null;

  async function client(){
    const c=window.COMMAND_CENTER_SUPABASE;if(!c)throw new Error('Command Center connection unavailable.');
    const {data:{session},error}=await c.auth.getSession();if(error||!session?.user)throw new Error('Authorized Command Center session required.');
    const gate=await c.rpc('is_command_center_authorized');if(gate.error||!gate.data)throw new Error('Command Center authorization required.');
    return c;
  }
  async function runnerReady(c){
    const {data,error}=await c.rpc('command_center_agent_tool_health');if(error)throw error;
    const row=(data||[]).find(x=>x.capability_key==='background_runner');
    const t=row?.last_success_at?Date.parse(row.last_success_at):NaN;
    return row?.availability==='available'&&Number.isFinite(t)&&(Date.now()-t)<=STALE;
  }
  async function projects(c){const {data,error}=await c.from('projects').select('id,name,category,next_action,status,stage,verification,blocker,last_verified').order('sort_order');if(error)throw error;return data||[];}
  function modeObjective(mode,p,specific=''){
    const next=p.next_action||'determine and complete the next verified task';
    if(mode==='next')return`Complete the exact recorded next task for ${p.name}: ${next}. Stay inside this project, preserve verified work, and checkpoint the verified result.`;
    if(mode==='until-work')return`NEXT WORK BOUNDARY CHECKPOINT: Continue ${p.name} from the newest verified Command Center state using normal-chat and $0/free-first capabilities until the first genuine Work-only execution boundary. Preserve the exact verified checkpoint and stop before Work execution.`;
    if(mode==='manual')return`Complete this exact task for ${p.name}: ${specific}. Stay inside this project, use normal chat first, preserve verified work, and verify the result.`;
    if(mode==='checkpoint')return`STATUS REVIEW ONLY for ${p.name}. Read the newest verified Command Center project state and available checkpoints and explain where this project stands in plain language. Summarize: (1) verified complete work, (2) current stage and trustworthy progress if available, (3) remaining open work, (4) blockers or user action, and (5) the exact next step. Do not execute project work, change external systems or database records, deploy, publish, or start Work.`;
    return`Continue ${p.name} automatically from the newest verified Command Center state. Execute all eligible work inside this project, use normal chat first, use bounded Work only after a genuine capability boundary and existing gates, checkpoint meaningful progress, and stop only for completion or a genuine user/protected boundary.`;
  }
  async function createRun(p,mode,specific=''){
    if(mode==='manual'&&!specific.trim())throw new Error('Enter the exact task first.');
    const c=await client();if(!(await runnerReady(c)))throw new Error('Agent runner is not active right now. No run was created.');
    const checkpoint=mode==='checkpoint';
    const {data,error}=await c.rpc('command_center_agent_create_project_only_session',{
      p_objective:modeObjective(mode,p,specific.trim()),p_project_id:p.id,
      p_success_criteria:checkpoint?['Explain the newest verified project state in plain language.','Separate verified-complete work from open work and blockers.','State the exact next step without executing it.','Make no external, database, deployment, publishing, or Work changes.']:[],
      p_excluded_scope:checkpoint?['project execution','external changes','database changes','deployment','publishing','Work execution']:[],
      p_allowed_tool_categories:checkpoint?CHECKPOINT_TOOLS:TOOLS,
      p_allow_work:!checkpoint&&mode!=='until-work',
      p_books_target:/book|kdp|coloring|workbook/i.test(`${p.id} ${p.category||''} ${p.name}`)?p.name:null,
      p_dry_run:false
    });
    if(error)throw error;return data;
  }
  async function stopProject(projectId){
    const c=await client();const {data,error}=await c.rpc('command_center_agent_list_sessions',{p_project_id:projectId||null});if(error)throw error;
    const live=(data||[]).filter(x=>OPEN.has(x.status)).sort((a,b)=>new Date(b.updated_at||0)-new Date(a.updated_at||0));
    if(!live.length)throw new Error('No waiting or working Agent run exists for this project.');
    const {error:cancelError}=await c.rpc('command_center_agent_cancel',{p_session_id:live[0].id});if(cancelError)throw cancelError;
  }
  function buttons(){return `<div class="cc-v6-agent-six"><button data-v6-agent-mode="auto"><strong>Auto</strong><small>Keep going safely</small></button><button data-v6-agent-mode="next"><strong>Next Step</strong><small>Do exactly what is next</small></button><button data-v6-agent-mode="until-work"><strong>Until Work</strong><small>Stop at Work execution</small></button><button data-v6-agent-mode="manual"><strong>Manual Task</strong><small>Tell Agent one exact thing</small></button><button class="checkpoint" data-v6-agent-mode="checkpoint"><strong>Project Checkpoint</strong><small>Tell me where this project stands</small></button><button class="stop" data-v6-agent-stop><strong>Stop Agent</strong><small>Cancel a waiting or working run</small></button></div><form class="cc-v6-agent-manual" data-v6-agent-manual hidden><textarea rows="2" placeholder="What exact task should Agent do?"></textarea><button class="btn" type="submit">Start task</button></form><div class="cc-v6-agent-message" data-v6-agent-message></div>`;}
  async function projectById(id){const c=await client();const rows=await projects(c);return rows.find(x=>x.id===id)||null;}
  function currentProjectId(){return document.querySelector('#projectGrid .project-card.selected')?.dataset.open||document.querySelector('#ccAgentProjectPanel')?.dataset.projectId||null;}
  function message(host,text,error=false){const el=host.querySelector('[data-v6-agent-message]');if(el){el.textContent=text;el.classList.toggle('error',error);}}
  async function run(host,p,mode,specific=''){try{message(host,'Checking Agent runner…');await createRun(p,mode,specific);message(host,mode==='checkpoint'?'Checkpoint review requested.':'Agent run queued.');window.COMMAND_CENTER_AGENT_HOME?.refresh?.();}catch(e){message(host,e.message||String(e),true);}}
  function bind(host,p){
    host.querySelectorAll('[data-v6-agent-mode]').forEach(b=>b.addEventListener('click',()=>{const mode=b.dataset.v6AgentMode;if(mode==='manual'){const f=host.querySelector('[data-v6-agent-manual]');f.hidden=!f.hidden;if(!f.hidden)f.querySelector('textarea')?.focus();return;}run(host,p,mode);}));
    host.querySelector('[data-v6-agent-manual]')?.addEventListener('submit',e=>{e.preventDefault();run(host,p,'manual',e.currentTarget.querySelector('textarea')?.value||'');});
    host.querySelector('[data-v6-agent-stop]')?.addEventListener('click',async()=>{try{message(host,'Stopping Agent…');await stopProject(p.id);message(host,'Agent run canceled.');}catch(e){message(host,e.message||String(e),true);}});
  }
  async function mountProject(){
    const panel=document.getElementById('ccAgentProjectPanel');if(!panel||panel.querySelector('[data-v6-six-mounted]'))return;
    const id=currentProjectId();if(!id)return;const p=await projectById(id).catch(()=>null);if(!p)return;
    const section=document.createElement('section');section.className='cc-v6-agent-six-wrap';section.dataset.v6SixMounted='1';section.innerHTML='<div class="cc-v6-agent-six-title"><strong>Agent Quick Modes</strong><span>Six owner-approved controls</span></div>'+buttons();panel.prepend(section);bind(section,p);
  }
  async function mountHome(){
    const dash=document.getElementById('ccAgentHomeDashboard');if(!dash||dash.querySelector('[data-v6-six-home]'))return;
    const c=await client().catch(()=>null);if(!c)return;const rows=await projects(c).catch(()=>[]);
    const section=document.createElement('section');section.className='cc-v6-agent-six-wrap cc-v6-agent-six-home';section.dataset.v6SixHome='1';section.innerHTML=`<div class="cc-v6-agent-six-title"><strong>Agent Quick Modes</strong><span>Choose one project</span></div><label class="cc-v6-agent-project-select">Project<select data-v6-agent-project><option value="">Choose a project…</option>${rows.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label>${buttons()}`;
    const head=dash.querySelector('.cc-agent-home-head');head?.insertAdjacentElement('afterend',section);if(!head)dash.prepend(section);
    const getProject=()=>rows.find(p=>p.id===section.querySelector('[data-v6-agent-project]')?.value)||null;
    section.querySelectorAll('[data-v6-agent-mode]').forEach(b=>b.addEventListener('click',()=>{const p=getProject();if(!p){message(section,'Choose a project first.',true);return;}const mode=b.dataset.v6AgentMode;if(mode==='manual'){const f=section.querySelector('[data-v6-agent-manual]');f.hidden=!f.hidden;if(!f.hidden)f.querySelector('textarea')?.focus();return;}run(section,p,mode);}));
    section.querySelector('[data-v6-agent-manual]')?.addEventListener('submit',e=>{e.preventDefault();const p=getProject();if(!p){message(section,'Choose a project first.',true);return;}run(section,p,'manual',e.currentTarget.querySelector('textarea')?.value||'');});
    section.querySelector('[data-v6-agent-stop]')?.addEventListener('click',async()=>{const p=getProject();if(!p){message(section,'Choose a project first.',true);return;}try{message(section,'Stopping Agent…');await stopProject(p.id);message(section,'Agent run canceled.');}catch(e){message(section,e.message||String(e),true);}});
  }
  function mount(){mountProject();mountHome();}
  const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(mount,80);});observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('command-center:full-interface-ready',mount);
  window.addEventListener('visibilitychange',()=>{if(!document.hidden)mount();});
  setTimeout(mount,300);
})();