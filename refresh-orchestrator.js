(() => {
  const cfg = window.COMMAND_CENTER_CONFIG || {};
  const $ = id => document.getElementById(id);
  let client = null;
  let pollTimer = null;
  let activeRequestId = null;
  let reloading = false;

  const ACTIVE = new Set(['pending', 'processing']);
  const TERMINAL = new Set(['completed', 'partial', 'failed']);

  async function getClient() {
    if (client) return client;
    if (!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
    client = window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});
    return client;
  }

  function ensurePanel() {
    const strip = $('refreshStrip');
    if (!strip) return null;
    let panel = $('canonicalAuditPanel');
    if (panel) return panel;
    strip.insertAdjacentHTML('afterend', `
      <section id="canonicalAuditPanel" class="canonical-audit" hidden aria-live="polite">
        <div class="canonical-audit-head">
          <div><div class="canonical-audit-kicker">CANONICAL SOURCE AUDIT</div><strong id="canonicalAuditTitle">Ready</strong></div>
          <span id="canonicalAuditBadge" class="badge">Ready</span>
        </div>
        <div id="canonicalAuditDetail" class="canonical-audit-detail">Master/Work source reconciliation is ready.</div>
        <div class="canonical-audit-track" aria-hidden="true"><span id="canonicalAuditFill"></span></div>
        <div id="canonicalAuditProgress" class="canonical-audit-progress"></div>
      </section>`);
    return $('canonicalAuditPanel');
  }

  function setButton(text, disabled=false) {
    const btn=$('refreshBtn');
    if(!btn) return;
    btn.textContent=text;
    btn.disabled=disabled;
    btn.classList.toggle('refreshing',disabled);
  }

  function recoveryInfo(row) {
    const snap=row?.source_snapshot&&typeof row.source_snapshot==='object'?row.source_snapshot:{};
    const sources=Array.isArray(snap.sources)?snap.sources:[];
    const gaps=Array.isArray(snap.gaps)?snap.gaps:(Array.isArray(snap.exact_source_gaps)?snap.exact_source_gaps:[]);
    const counts={exact:0,alias:0,content_status_block:0,handoff:0,master_no_newer_work:0,missing:0};
    for(const source of sources){
      const method=String(source?.method||'').toLowerCase();
      if(Object.prototype.hasOwnProperty.call(counts,method)) counts[method]+=1;
    }
    return {sources,gaps,counts};
  }

  function recoverySummary(row) {
    const info=recoveryInfo(row);
    if(!info.sources.length) return '';
    return [
      `${info.counts.exact} exact`,
      `${info.counts.alias} alias`,
      `${info.counts.content_status_block} status block`,
      `${info.counts.handoff} handoff`,
      `${info.counts.master_no_newer_work} no-newer-Work`,
      `${info.counts.missing} missing`
    ].join(' • ');
  }

  function showState(row) {
    const panel=ensurePanel();
    if(!panel||!row) return;
    panel.hidden=false;
    const title=$('canonicalAuditTitle'),detail=$('canonicalAuditDetail'),badge=$('canonicalAuditBadge'),progress=$('canonicalAuditProgress'),fill=$('canonicalAuditFill');
    const total=Number(row.projects_total||0),checked=Number(row.projects_checked||0);
    const pct=total>0?Math.max(2,Math.min(100,Math.round((checked/total)*100))):(row.status==='completed'?100:8);
    const recovery=recoveryInfo(row),sourceSummary=recoverySummary(row);
    if(fill) fill.style.width=`${pct}%`;
    if(progress) progress.textContent=total>0?`${checked} of ${total} tracked projects reconciled`:'Waiting for the private ChatGPT audit worker';

    if(row.status==='pending'){
      if(title) title.textContent='Full Refresh queued';
      if(detail) detail.textContent='The private audit request is waiting for the ChatGPT-side worker. You can leave this page; the request remains saved.';
      if(badge){badge.textContent='Queued';badge.className='badge attention';}
      setButton('Audit queued…',true); return;
    }
    if(row.status==='processing'){
      if(title) title.textContent='Reconciling Master + Work sources';
      if(detail) detail.textContent=row.summary||'Checking exact titles, approved title variants, canonical status blocks, newer Work execution, and verified handoffs.';
      if(badge){badge.textContent='Auditing';badge.className='badge active';}
      if(progress&&sourceSummary) progress.textContent=`${checked} of ${total} tracked projects reconciled • ${sourceSummary}`;
      setButton('Auditing…',true); return;
    }
    if(row.status==='completed'){
      if(title) title.textContent='Full Refresh complete';
      const base=row.summary||'Canonical sources were reconciled and verified project data was written to the Command Center.';
      if(detail) detail.textContent=sourceSummary?`${base} Source recovery: ${sourceSummary}.`:base;
      if(badge){badge.textContent='Complete';badge.className='badge verified';}
      if(fill) fill.style.width='100%';
      if(progress) progress.textContent=sourceSummary||`${checked} of ${total} tracked projects reconciled`;
      setButton('Refresh complete ✓',false); return;
    }
    if(row.status==='partial'){
      if(title) title.textContent='Refresh completed with gaps';
      const base=row.summary||row.error||'Some canonical sources could not be verified. Existing verified data was preserved.';
      const firstGap=recovery.gaps[0]?` First gap: ${recovery.gaps[0]}`:'';
      if(detail) detail.textContent=`${base}${firstGap}`;
      if(badge){badge.textContent='Partial';badge.className='badge attention';}
      if(progress) progress.textContent=sourceSummary||`${checked} of ${total} tracked projects reconciled`;
      setButton('Refresh again',false); return;
    }
    if(row.status==='failed'){
      if(title) title.textContent='Refresh could not complete';
      if(detail) detail.textContent=row.error||'The private audit worker could not complete this request. No unverified state was written.';
      if(badge){badge.textContent='Failed';badge.className='badge unverified';}
      setButton('Retry Refresh',false);
    }
  }

  async function latestRequest(){
    const c=await getClient(); if(!c) return null;
    const {data:sessionData}=await c.auth.getSession(); const user=sessionData?.session?.user; if(!user) return null;
    const {data,error}=await c.from('refresh_requests').select('*').eq('owner_id',user.id).order('requested_at',{ascending:false}).limit(1).maybeSingle();
    return error?null:(data||null);
  }

  async function activeRequest(){
    const c=await getClient(); if(!c) return null;
    const {data:sessionData}=await c.auth.getSession(); const user=sessionData?.session?.user; if(!user) return null;
    const {data,error}=await c.from('refresh_requests').select('*').eq('owner_id',user.id).in('status',['pending','processing']).order('requested_at',{ascending:false}).limit(1).maybeSingle();
    return error?null:(data||null);
  }

  async function createRequest(){
    const c=await getClient(); if(!c) throw new Error('Command Center data connection unavailable.');
    const {data:sessionData}=await c.auth.getSession(); const user=sessionData?.session?.user; if(!user) throw new Error('Sign in is required.');
    const existing=await activeRequest(); if(existing) return existing;
    const {data:sourceRows}=await c.from('project_sources').select('project_id').eq('owner_id',user.id).eq('active',true);
    const total=new Set((sourceRows||[]).map(x=>x.project_id)).size||null;
    const {data,error}=await c.from('refresh_requests').insert({owner_id:user.id,status:'pending',projects_total:total,projects_checked:0}).select('*').single();
    if(error) throw error; return data;
  }

  function stopPolling(){if(pollTimer)clearInterval(pollTimer);pollTimer=null;}
  async function pollOnce(){
    if(!activeRequestId)return;
    const c=await getClient(); if(!c)return;
    const {data,error}=await c.from('refresh_requests').select('*').eq('id',activeRequestId).maybeSingle();
    if(error||!data)return;
    showState(data);
    if(TERMINAL.has(data.status)){
      stopPolling();activeRequestId=null;
      if(data.status==='completed'&&!reloading){reloading=true;setTimeout(()=>window.location.reload(),1400);}
    }
  }
  function startPolling(row){if(!row?.id)return;activeRequestId=row.id;showState(row);stopPolling();pollTimer=setInterval(pollOnce,15000);setTimeout(pollOnce,1200);}

  async function handleRefresh(e){
    const btn=e.target.closest('#refreshBtn'); if(!btn)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();if(btn.disabled)return;
    setButton('Starting full audit…',true);
    try{const row=await createRequest();startPolling(row);}catch(err){
      const panel=ensurePanel();if(panel)panel.hidden=false;
      if($('canonicalAuditTitle'))$('canonicalAuditTitle').textContent='Could not start Refresh';
      if($('canonicalAuditDetail'))$('canonicalAuditDetail').textContent=err?.message||'The audit request could not be created.';
      if($('canonicalAuditBadge')){$('canonicalAuditBadge').textContent='Failed';$('canonicalAuditBadge').className='badge unverified';}
      setButton('Retry Refresh',false);
    }
  }

  async function restoreState(){const row=await latestRequest();if(!row)return;const age=Date.now()-new Date(row.requested_at).getTime();if(ACTIVE.has(row.status))startPolling(row);else if(age<6*60*60*1000)showState(row);}
  document.addEventListener('click',handleRefresh,true);
  window.addEventListener('load',()=>{ensurePanel();setTimeout(restoreState,350);},{once:true});
})();
