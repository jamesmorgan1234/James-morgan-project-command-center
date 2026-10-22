(() => {
  const cfg = window.COMMAND_CENTER_CONFIG || {};
  let client = null;
  let timer = null;
  let retryTimer = null;
  let rendering = null;

  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function getClient(){
    if(window.COMMAND_CENTER_SUPABASE) return window.COMMAND_CENTER_SUPABASE;
    if(client) return client;
    if(!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
    client = window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});
    return client;
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

  function scheduleRetry(){
    clearTimeout(retryTimer);
    retryTimer=setTimeout(()=>{if(document.visibilityState==='visible') render();},2500);
  }

  function recoveryState(source){
    const missing=/missing/i.test(String(source.last_recovery_status||'')) || String(source.last_recovery_method||'').toLowerCase()==='missing';
    if(!missing) return null;
    const handoff=Boolean(source.handoff_fallback_allowed);
    const content=Boolean(source.content_fallback_allowed);
    const direct=Boolean(source.direct_required);
    if(!direct && (handoff || content)){
      return {
        cls:'can-recover',
        label:'Agent can recover',
        method:handoff ? 'Use newest verified handoff/checkpoint' : 'Use available history/content checkpoint'
      };
    }
    return {
      cls:'needs-you',
      label:'Needs You',
      method:direct ? 'Direct source is required' : 'No verified fallback is available'
    };
  }

  async function doRender(){
    const panel=ensurePanel();
    if(!panel) return;
    const c=getClient();
    if(!c){showUnavailable('Command Center connection is still starting. Retrying automatically.');scheduleRetry();return;}
    let session;
    try{
      const sessionRes=await c.auth.getSession();
      session=sessionRes?.data?.session||null;
    }catch{
      showUnavailable('Command Center session could not be read. Retrying automatically.');
      scheduleRetry();
      return;
    }
    if(!session){panel.hidden=true;return;}
    panel.hidden=false;

    const [healthRes,projectsRes,sourcesRes]=await Promise.all([
      c.from('project_source_health_summary').select('project_id,required_sources,required_reconciled_sources,required_source_gaps,optional_source_gaps,last_source_check_at'),
      c.from('projects').select('id,name'),
      c.from('project_sources').select('project_id,source_role,chat_title,required,direct_required,handoff_fallback_allowed,content_fallback_allowed,last_recovery_status,last_recovery_method,last_recovered_at,last_gap').eq('active',true)
    ]);
    if(healthRes.error || projectsRes.error || sourcesRes.error){
      showUnavailable();
      scheduleRetry();
      return;
    }
    clearTimeout(retryTimer);

    const names=new Map((projectsRes.data||[]).map(p=>[p.id,p.name]));
    const healthRows=healthRes.data||[];
    const latest=healthRows.map(r=>r.last_source_check_at).filter(Boolean).sort().at(-1)||null;
    const unresolved=(sourcesRes.data||[])
      .map(source=>({source,state:recoveryState(source)}))
      .filter(x=>x.state)
      .sort((a,b)=>String(a.source.chat_title||'').localeCompare(String(b.source.chat_title||'')) || String(names.get(a.source.project_id)||a.source.project_id).localeCompare(String(names.get(b.source.project_id)||b.source.project_id)));
    const recoverable=unresolved.filter(x=>x.state.cls==='can-recover').length;
    const needsYou=unresolved.length-recoverable;

    const title=document.getElementById('sourceHealthTitle');
    const summary=document.getElementById('sourceHealthSummary');
    const badge=document.getElementById('sourceHealthBadge');
    const list=document.getElementById('sourceHealthProjects');

    if(title) title.textContent=unresolved.length ? `${unresolved.length} source checkpoint${unresolved.length===1?'':'s'} to reconcile` : 'All project sources reconciled';
    if(summary){
      summary.textContent=unresolved.length
        ? `${recoverable} Agent-recoverable • ${needsYou} need you • last source check ${formatTime(latest)}`
        : `No unresolved source checkpoints • last source check ${formatTime(latest)}`;
    }
    if(badge){
      badge.textContent=needsYou ? `${needsYou} need you` : unresolved.length ? 'Agent recoverable' : 'Healthy';
      badge.className=`badge ${needsYou?'attention':unresolved.length?'verified':'verified'}`;
    }

    if(!list) return;
    if(!unresolved.length){
      list.innerHTML='<div class="source-health-ok">Every tracked source has a verified checkpoint or accepted fallback.</div>';
      return;
    }

    list.innerHTML=`<div class="source-health-guidance">Start Agent Mode on the affected project. Agent will reconcile any source marked <strong>Agent can recover</strong>. Only rows marked <strong>Needs You</strong> require you to supply or open something.</div>`+
      unresolved.map(({source,state})=>{
        const project=names.get(source.project_id)||source.project_id;
        const role=String(source.source_role||'source').replaceAll('_',' ');
        return `<div class="source-health-row ${state.cls}">
          <span class="source-health-row-copy">
            <strong>${esc(source.chat_title||'Unnamed source')}</strong>
            <small>${esc(project)} • ${esc(role)}</small>
            <em>${esc(state.method)}</em>
          </span>
          <b>${esc(state.label)}</b>
        </div>`;
      }).join('');
  }

  function render(){
    if(rendering) return rendering;
    rendering=doRender().finally(()=>{rendering=null;});
    return rendering;
  }

  function schedule(ms=500){clearTimeout(timer);timer=setTimeout(render,ms);}
  document.addEventListener('commandcenter:audit-complete',()=>schedule(120));
  document.addEventListener('commandcenter:data-refresh-requested',()=>schedule(350));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule(450);});
  window.addEventListener('load',()=>{schedule(700);setTimeout(render,3000);},{once:true});
  const obs=new MutationObserver(()=>{if(document.getElementById('canonicalAuditPanel')&&!document.getElementById('sourceHealthPanel'))schedule(100);});
  obs.observe(document.documentElement,{childList:true,subtree:true});
})();
