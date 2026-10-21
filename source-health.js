(() => {
  const cfg = window.COMMAND_CENTER_CONFIG || {};
  let client = null;
  let timer = null;
  let retryTimer = null;
  let rendering = null;

  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]));

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
        <div><div class="source-health-kicker">SOURCE HEALTH</div><strong id="sourceHealthTitle">Checking canonical sources…</strong></div>
        <span id="sourceHealthBadge" class="badge">Checking</span>
      </div>
      <div id="sourceHealthSummary" class="source-health-summary">Reading the latest persisted Master/Work checkpoint state.</div>
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

  function showUnavailable(message='The latest persisted canonical-source health summary could not be loaded.'){
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

    const [healthRes,projectsRes]=await Promise.all([
      c.from('project_source_health_summary').select('project_id,active_sources,required_sources,required_reconciled_sources,required_source_gaps,optional_source_gaps,last_source_check_at,recovery_methods'),
      c.from('projects').select('id,name')
    ]);
    if(healthRes.error){
      showUnavailable();
      scheduleRetry();
      return;
    }
    clearTimeout(retryTimer);

    const names=new Map((projectsRes.data||[]).map(p=>[p.id,p.name]));
    const rows=healthRes.data||[];
    const totals=rows.reduce((a,r)=>{
      a.required+=Number(r.required_sources||0);
      a.reconciled+=Number(r.required_reconciled_sources||0);
      a.gaps+=Number(r.required_source_gaps||0);
      return a;
    },{required:0,reconciled:0,gaps:0});
    const latest=rows.map(r=>r.last_source_check_at).filter(Boolean).sort().at(-1)||null;
    const title=document.getElementById('sourceHealthTitle');
    const summary=document.getElementById('sourceHealthSummary');
    const badge=document.getElementById('sourceHealthBadge');
    const list=document.getElementById('sourceHealthProjects');
    if(title) title.textContent=totals.gaps===0 && totals.required>0?'All required sources reconciled':'Canonical-source recovery status';
    if(summary) summary.textContent=`${totals.reconciled} of ${totals.required} required sources reconciled • ${totals.gaps} required gaps • last source check ${formatTime(latest)}`;
    if(badge){badge.textContent=totals.gaps===0?'Healthy':`${totals.gaps} gaps`;badge.className=`badge ${totals.gaps===0?'verified':'attention'}`;}

    const gaps=rows.filter(r=>Number(r.required_source_gaps||0)>0)
      .sort((a,b)=>Number(b.required_source_gaps||0)-Number(a.required_source_gaps||0) || String(names.get(a.project_id)||a.project_id).localeCompare(String(names.get(b.project_id)||b.project_id)));
    if(!list) return;
    if(!gaps.length){
      list.innerHTML='<div class="source-health-ok">Every required canonical source has a verified persisted checkpoint.</div>';
      return;
    }
    const shown=gaps.slice(0,6);
    list.innerHTML=shown.map(r=>`<div class="source-health-row"><span><strong>${esc(names.get(r.project_id)||r.project_id)}</strong><small>${esc(r.recovery_methods||'No successful recovery method yet')}</small></span><b>${Number(r.required_source_gaps||0)} gap${Number(r.required_source_gaps||0)===1?'':'s'}</b></div>`).join('') + (gaps.length>shown.length?`<div class="source-health-more">+${gaps.length-shown.length} more project${gaps.length-shown.length===1?'':'s'} with required source gaps</div>`:'');
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
