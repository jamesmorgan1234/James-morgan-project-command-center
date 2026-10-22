(() => {
  const cfg = window.COMMAND_CENTER_CONFIG || {};
  const AGENT_TOOLS=['normal_chat','research','files','github','supabase','automation','integration','analytics','security','deployment','work'];
  const ACTIVE_STATES=new Set(['draft','active','paused','blocked','needs_user_action','partially_completed']);
  let client = null;
  let timer = null;
  let retryTimer = null;
  let rendering = null;
  const queued = new Set();

  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]));

  function getClient(){
    if(window.COMMAND_CENTER_SUPABASE) return window.COMMAND_CENTER_SUPABASE;
    if(client) return client;
    if(!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
    client = window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});
    return client;
  }

  async function authorized(){
    const c=getClient(); if(!c) return null;
    const {data:{session},error}=await c.auth.getSession();
    if(error||!session?.user) return null;
    const gate=await c.rpc('is_command_center_authorized');
    return gate.error||!gate.data?null:session.user;
  }

  function ensurePanel(){
    let panel=document.getElementById('sourceHealthPanel');
    if(panel) return panel;
    const anchor=document.getElementById('canonicalAuditPanel') || document.getElementById('refreshStrip');
    if(!anchor) return null;
    anchor.insertAdjacentHTML('afterend',`<section id="sourceHealthPanel" class="source-health" aria-live="polite">
      <div class="source-health-head">
        <div><div class="source-health-kicker">SOURCE HEALTH</div><strong id="sourceHealthTitle">Checking project sources…</strong></div>
        <span id="sourceHealthBadge" class="badge">Checking</span>
      </div>
      <div id="sourceHealthSummary" class="source-health-summary">Reading the latest Master, Work, handoff, and history checkpoints.</div>
      <div id="sourceHealthProjects" class="source-health-projects"></div>
    </section>`);
    return document.getElementById('sourceHealthPanel');
  }

  function formatTime(v){
    if(!v) return 'Not checked yet';
    const d=new Date(v);
    if(Number.isNaN(d.getTime())) return 'Not checked yet';
    return d.toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
  }

  function showUnavailable(message='The latest source-health detail could not be loaded.'){
    const title=document.getElementById('sourceHealthTitle');
    const summary=document.getElementById('sourceHealthSummary');
    const badge=document.getElementById('sourceHealthBadge');
    if(title) title.textContent='Source health unavailable';
    if(summary) summary.textContent=message;
    if(badge){badge.textContent='Unavailable';badge.className='badge unverified';}
  }

  function scheduleRetry(){ clearTimeout(retryTimer); retryTimer=setTimeout(()=>{if(document.visibilityState==='visible') render();},2500); }

  function recoveryState(source){
    const missing=/missing/i.test(String(source.last_recovery_status||'')) || String(source.last_recovery_method||'').toLowerCase()==='missing';
    if(!missing) return null;
    const handoff=Boolean(source.handoff_fallback_allowed);
    const content=Boolean(source.content_fallback_allowed);
    const direct=Boolean(source.direct_required);
    if(!direct && (handoff || content)) return {cls:'can-recover',label:'Agent can recover',method:handoff?'Use newest verified handoff/checkpoint':'Use available history/content checkpoint'};
    return {cls:'needs-you',label:'Needs You',method:direct?'Direct source is required':'No verified fallback is available'};
  }

  function sourceKey(source){ return `${source.project_id}::${source.chat_title||source.source_role||'source'}`; }

  async function startRecovery(source,project,button){
    const c=getClient(),user=await authorized();
    if(!c||!user) throw new Error('Authorized Command Center session required.');
    const key=sourceKey(source);
    button.disabled=true; button.textContent='Checking Agent…'; button.classList.add('is-working');

    const sessionsRes=await c.rpc('command_center_agent_list_sessions',{p_project_id:source.project_id});
    if(sessionsRes.error) throw sessionsRes.error;
    const active=(sessionsRes.data||[]).find(s=>ACTIVE_STATES.has(String(s.status||'')));
    if(active){
      button.textContent='Agent is already working on this project';
      button.classList.remove('is-working');
      button.classList.add('is-active');
      return;
    }

    const fallback=source.handoff_fallback_allowed?'newest verified handoff/checkpoint':'available history/content checkpoint';
    const objective=`Recover and reconcile the missing Command Center source checkpoint for ${project.name}. Source/chat: ${source.chat_title||'Unnamed source'}. Source role: ${String(source.source_role||'source').replaceAll('_',' ')}. Use the configured ${fallback}; do not require the unavailable direct chat unless the fallback proves insufficient. Preserve the newest verified project state as the protected anchor, classify any recovered crossover work by its actual project, update the canonical source/checkpoint records, verify the reconciliation, and stop if genuine user input is required.${source.last_gap?` Recorded gap: ${source.last_gap}`:''}`;
    const isBooks=/book|kdp|coloring|workbook/i.test(`${project.category||''} ${project.name||''}`) || /^kdp-/.test(source.project_id||'');
    const create=await c.rpc('command_center_agent_create_project_only_session',{
      p_objective:objective,
      p_project_id:source.project_id,
      p_success_criteria:[],
      p_excluded_scope:[],
      p_allowed_tool_categories:AGENT_TOOLS,
      p_allow_work:false,
      p_books_target:isBooks?project.name:null,
      p_dry_run:false
    });
    if(create.error) throw create.error;
    queued.add(key);
    button.textContent='Recovery queued';
    button.classList.remove('is-working');
    button.classList.add('is-queued');
    window.dispatchEvent(new CustomEvent('command-center:source-recovery-queued',{detail:{projectId:source.project_id,chatTitle:source.chat_title,sessionId:create.data}}));
  }

  function bindRecoveryButtons(list,sourceMap,projectMap){
    list.querySelectorAll('[data-source-recover]').forEach(button=>button.addEventListener('click',async()=>{
      const key=button.dataset.sourceRecover;
      const source=sourceMap.get(key),project=source?projectMap.get(source.project_id):null;
      if(!source||!project) return;
      try{await startRecovery(source,project,button);}catch(error){button.disabled=false;button.classList.remove('is-working');button.textContent='Try recovery again';button.title=error?.message||String(error);}
    }));
  }

  async function doRender(){
    const panel=ensurePanel(); if(!panel) return;
    const c=getClient();
    if(!c){showUnavailable('Command Center connection is still starting. Retrying automatically.');scheduleRetry();return;}
    let session;
    try{const sessionRes=await c.auth.getSession();session=sessionRes?.data?.session||null;}catch{showUnavailable('Command Center session could not be read. Retrying automatically.');scheduleRetry();return;}
    if(!session){panel.hidden=true;return;}
    panel.hidden=false;

    const [healthRes,projectsRes,sourcesRes]=await Promise.all([
      c.from('project_source_health_summary').select('project_id,required_sources,required_reconciled_sources,required_source_gaps,optional_source_gaps,last_source_check_at'),
      c.from('projects').select('id,name,category'),
      c.from('project_sources').select('project_id,source_role,chat_title,required,direct_required,handoff_fallback_allowed,content_fallback_allowed,last_recovery_status,last_recovery_method,last_recovered_at,last_gap').eq('active',true)
    ]);
    if(healthRes.error || projectsRes.error || sourcesRes.error){showUnavailable();scheduleRetry();return;}
    clearTimeout(retryTimer);

    const projectMap=new Map((projectsRes.data||[]).map(p=>[p.id,p]));
    const healthRows=healthRes.data||[];
    const latest=healthRows.map(r=>r.last_source_check_at).filter(Boolean).sort().at(-1)||null;
    const unresolved=(sourcesRes.data||[]).map(source=>({source,state:recoveryState(source)})).filter(x=>x.state)
      .sort((a,b)=>String(a.source.chat_title||'').localeCompare(String(b.source.chat_title||'')) || String(projectMap.get(a.source.project_id)?.name||a.source.project_id).localeCompare(String(projectMap.get(b.source.project_id)?.name||b.source.project_id)));
    const recoverable=unresolved.filter(x=>x.state.cls==='can-recover').length;
    const needsYou=unresolved.length-recoverable;

    const title=document.getElementById('sourceHealthTitle'),summary=document.getElementById('sourceHealthSummary'),badge=document.getElementById('sourceHealthBadge'),list=document.getElementById('sourceHealthProjects');
    if(title) title.textContent=unresolved.length?`${unresolved.length} source checkpoint${unresolved.length===1?'':'s'} to reconcile`:'All project sources reconciled';
    if(summary) summary.textContent=unresolved.length?`${recoverable} Agent-recoverable • ${needsYou} need you • last source check ${formatTime(latest)}`:`No unresolved source checkpoints • last source check ${formatTime(latest)}`;
    if(badge){badge.textContent=needsYou?`${needsYou} need you`:unresolved.length?'Agent recoverable':'Healthy';badge.className=`badge ${needsYou?'attention':'verified'}`;}
    if(!list) return;
    if(!unresolved.length){list.innerHTML='<div class="source-health-ok">Every tracked source has a verified checkpoint or accepted fallback.</div>';return;}

    const sourceMap=new Map();
    list.innerHTML=`<div class="source-health-guidance">Tap <strong>Recover with Agent</strong> on any recoverable source. Command Center will start the correct project-locked recovery run for you.</div>`+
      unresolved.map(({source,state})=>{
        const project=projectMap.get(source.project_id)||{id:source.project_id,name:source.project_id,category:''};
        const role=String(source.source_role||'source').replaceAll('_',' '),key=sourceKey(source);sourceMap.set(key,source);
        const action=state.cls==='can-recover'
          ? `<button type="button" class="source-health-recover-btn${queued.has(key)?' is-queued':''}" data-source-recover="${esc(key)}"${queued.has(key)?' disabled':''}>${queued.has(key)?'Recovery queued':'Recover with Agent'}</button>`
          : `<b class="source-health-needs-you">${esc(state.label)}</b>`;
        return `<div class="source-health-row ${state.cls}"><span class="source-health-row-copy"><strong>${esc(source.chat_title||'Unnamed source')}</strong><small>${esc(project.name)} • ${esc(role)}</small><em>${esc(state.method)}</em></span>${action}</div>`;
      }).join('');
    bindRecoveryButtons(list,sourceMap,projectMap);
  }

  function render(){if(rendering)return rendering;rendering=doRender().finally(()=>{rendering=null;});return rendering;}
  function schedule(ms=500){clearTimeout(timer);timer=setTimeout(render,ms);}
  document.addEventListener('commandcenter:audit-complete',()=>schedule(120));
  document.addEventListener('commandcenter:data-refresh-requested',()=>schedule(350));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule(450);});
  window.addEventListener('load',()=>{schedule(700);setTimeout(render,3000);},{once:true});
  const obs=new MutationObserver(()=>{if(document.getElementById('canonicalAuditPanel')&&!document.getElementById('sourceHealthPanel'))schedule(100);});
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
