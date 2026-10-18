(() => {
  const cfg = window.COMMAND_CENTER_CONFIG || {};
  const $ = id => document.getElementById(id);
  const app = $('app'), boot = $('boot');
  let supabase = null, session = null, authorized = false, routeVersion = 0;
  let projects = [], metrics = [], activity = [], selectedId = null, channel = null;
  let currentView = 'home';

  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const cls = s => { const x=String(s||'').toLowerCase(); if(x.includes('live'))return'live';if(x.includes('active'))return'active';if(x.includes('planning'))return'planning';if(x.includes('pause'))return'paused';if(x.includes('recover'))return'recovery';if(x.includes('verified'))return'verified';if(x.includes('mixed'))return'mixed';if(x.includes('blocked')||x.includes('unverified')||x.includes('attention')||x.includes('needs'))return'unverified';return''; };
  const fmtMoney = n => new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(n||0));
  const fmtDate = v => v ? new Date(v).toLocaleString() : '—';

  function show(el, yes=true){ if(el) el.hidden=!yes; }
  function setSync(text){ $('syncText').textContent=text; }
  function configReady(){ return cfg.supabaseUrl && cfg.supabaseAnonKey && !cfg.supabaseUrl.startsWith('__') && !cfg.supabaseAnonKey.startsWith('__'); }

  async function bootApp(){
    show(boot,false); show(app,true);
    if(!configReady()){
      show($('authPanel'),true);
      $('authPanel').innerHTML='<h2>Secure Command Center setup</h2><p class="muted">The private data backend is being connected. No project data is exposed in this public shell.</p>';
      return;
    }
    supabase = window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:true}});
    const {data:{session:s}}=await supabase.auth.getSession(); session=s;
    supabase.auth.onAuthStateChange((_e,s2)=>{ session=s2; route(); });
    await route();
  }

  async function route(){
    const version=++routeVersion;
    authorized=false;
    show($('dashboard'),false); show($('refreshStrip'),false); show($('appFooter'),false);
    projects=[]; metrics=[]; activity=[]; selectedId=null; currentView='home';
    for(const id of ['stats','projectGrid','detailPanel','activityList','revenueSummary','revenueList']) $(id)?.replaceChildren();
    cleanupRealtime();
    if(!session){
      authorized=false; projects=[]; metrics=[]; activity=[];
      show($('authPanel'),true); show($('claimPanel'),false); show($('dashboard'),false);
      setSync('Private data · sign in required'); return;
    }
    const {data,error}=await supabase.rpc('is_command_center_authorized');
    if(version!==routeVersion || !session) return;
    if(error){ show($('authPanel'),false); show($('claimPanel'),false); setSync('Authorization check failed'); return; }
    authorized=!!data;
    show($('authPanel'),false); show($('claimPanel'),!authorized); show($('dashboard'),authorized); show($('refreshStrip'),authorized); show($('appFooter'),true);
    if(authorized){ await refreshAll(); setupRealtime(); }
    else setSync('Signed in · setup code required');
  }

  async function refreshAll(){
    if(!authorized || !session) return;
    const version=routeVersion;
    setSync('Refreshing private data…');
    const [p,m,a]=await Promise.all([
      supabase.from('projects').select('*').order('sort_order'),
      supabase.from('metrics').select('*').order('updated_at',{ascending:false}),
      supabase.from('activity').select('*').order('happened_at',{ascending:false}).limit(100)
    ]);
    if(version!==routeVersion || !authorized || !session) return;
    const err=p.error||m.error||a.error;
    if(err){ setSync('Sync error · '+err.message); return; }
    projects=p.data||[]; metrics=m.data||[]; activity=a.data||[];
    if(selectedId && !projects.some(x=>x.id===selectedId)) selectedId=null;
    render(); setSync('Synced '+new Date().toLocaleTimeString());
  }

  function setupRealtime(){
    if(!supabase||channel) return;
    channel=supabase.channel('command-center-live')
      .on('postgres_changes',{event:'*',schema:'public',table:'projects'},()=>refreshAll())
      .on('postgres_changes',{event:'*',schema:'public',table:'metrics'},()=>refreshAll())
      .on('postgres_changes',{event:'*',schema:'public',table:'activity'},()=>refreshAll())
      .subscribe();
  }
  function cleanupRealtime(){ if(channel&&supabase){supabase.removeChannel(channel);channel=null;} }

  function projectMetrics(id){ return metrics.filter(m=>m.project_id===id); }
  function metricValue(m){ if(m.value_numeric!==null && m.value_numeric!==undefined){ if(m.unit==='USD') return fmtMoney(m.value_numeric); return `${m.value_numeric}${m.unit?` ${m.unit}`:''}`; } return m.value_text||'—'; }
  function revenueMetric(id){ return metrics.find(m=>m.project_id===id&&m.key==='verified_revenue_usd'&&m.verified&&m.value_numeric!==null); }
  function isAttention(p){ return p.attention===true || /needs|blocked|recovery|paused/i.test(p.status||'') || /needs|unverified/i.test(p.verification||''); }
  function isActive(p){ return /active|live/i.test(p.status||''); }
  function isEarning(p){ const m=revenueMetric(p.id); return !!m && Number(m.value_numeric||0)>0; }
  function verifiedRevenueTotal(){ return metrics.filter(m=>m.key==='verified_revenue_usd'&&m.verified&&m.value_numeric!==null).reduce((s,m)=>s+Number(m.value_numeric||0),0); }
  function hasRecordedRevenue(){ return metrics.some(m=>m.key==='verified_revenue_usd'&&m.verified&&m.value_numeric!==null); }

  function render(){ renderStats(); renderFilters(); renderActivity(); renderCurrentView(); }

  function renderStats(){
    const active=projects.filter(isActive).length;
    const att=projects.filter(isAttention).length;
    const money=verifiedRevenueTotal();
    const hasRevenue=hasRecordedRevenue();
    const earning=projects.filter(isEarning).length;
    const tiles=[
      {key:'all',label:'Projects',value:projects.length,sub:'Open full portfolio'},
      {key:'active',label:'Active / live',value:active,sub:'Open active projects'},
      {key:'attention',label:'Needs attention',value:att,sub:'Open action list'},
      {key:'revenue',label:'Verified revenue',value:hasRevenue?fmtMoney(money):'Not recorded',sub:'Open company breakdown'},
      {key:'earning',label:'Projects earning',value:earning,sub:hasRevenue?`Total ${fmtMoney(money)}`:'No verified revenue yet'}
    ];
    $('stats').innerHTML=tiles.map(t=>`<button class="stat stat-button" data-view="${t.key}" aria-label="${esc(t.label)}"><div class="label">${esc(t.label)}</div><div class="value">${esc(t.value)}</div><div class="stat-sub">${esc(t.sub)}</div></button>`).join('');
  }

  function renderFilters(){
    const sf=$('statusFilter'),cf=$('categoryFilter'); const sv=sf.value,cv=cf.value;
    const statuses=[...new Set(projects.map(p=>p.status).filter(Boolean))].sort();
    const cats=[...new Set(projects.map(p=>p.category).filter(Boolean))].sort();
    sf.innerHTML='<option value="all">All statuses</option>'+statuses.map(x=>`<option>${esc(x)}</option>`).join('');
    cf.innerHTML='<option value="all">All categories</option>'+cats.map(x=>`<option>${esc(x)}</option>`).join('');
    if(statuses.includes(sv))sf.value=sv; else sf.value='all';
    if(cats.includes(cv))cf.value=cv; else cf.value='all';
  }

  function viewMeta(){
    if(currentView==='active') return ['Active / live','Active projects','Projects currently marked active or live.'];
    if(currentView==='attention') return ['Needs attention','Needs attention','Projects with a blocker, recovery state, paused state, or another attention flag.'];
    if(currentView==='earning') return ['Revenue','Projects earning','Projects with verified positive revenue records.'];
    if(currentView==='revenue') return ['Revenue','Verified revenue breakdown','Verified revenue by project. Unrecorded values stay unrecorded.'];
    if(currentView==='all') return ['Projects','All projects','Search, filter, inspect, and continue any project.'];
    return ['Overview','Portfolio overview','Use the summary tiles above to open exactly what you want to work on.'];
  }

  function renderCurrentView(){
    const [eyebrow,title,desc]=viewMeta();
    $('viewEyebrow').textContent=eyebrow; $('viewTitle').textContent=title; $('viewDescription').textContent=desc;
    show($('backHomeBtn'),currentView!=='home');
    show($('homeView'),currentView==='home');
    show($('projectView'),['all','active','attention','earning'].includes(currentView));
    show($('revenueView'),currentView==='revenue');
    if(['all','active','attention','earning'].includes(currentView)) renderProjects();
    if(currentView==='revenue') renderRevenue();
  }

  function baseFilteredProjects(){
    const q=$('searchInput').value.trim().toLowerCase(), sf=$('statusFilter').value, cf=$('categoryFilter').value;
    return projects.filter(p=>{
      const hay=[p.name,p.category,p.status,p.verification,p.stage,p.next_action,p.blocker].join(' ').toLowerCase();
      return (sf==='all'||p.status===sf)&&(cf==='all'||p.category===cf)&&(!q||hay.includes(q));
    });
  }

  function filteredProjects(){
    let list=baseFilteredProjects();
    if(currentView==='active') list=list.filter(isActive);
    if(currentView==='attention') list=list.filter(isAttention);
    if(currentView==='earning') list=list.filter(isEarning);
    return list;
  }

  function renderProjects(){
    const list=filteredProjects();
    $('projectViewHeading').textContent=currentView==='attention'?'Needs attention':currentView==='active'?'Active / live projects':currentView==='earning'?'Projects earning':'Projects';
    $('projectCount').textContent=`${list.length} shown`;
    if(!selectedId || !list.some(x=>x.id===selectedId)) selectedId=list[0]?.id||null;
    $('projectGrid').innerHTML=list.map(p=>{
      const ms=projectMetrics(p.id).filter(m=>m.show_on_card).slice(0,3);
      return `<article class="project-card ${p.id===selectedId?'selected':''}" data-open="${esc(p.id)}" tabindex="0"><div class="section-head"><div><h3>${esc(p.name)}</h3><div class="muted">${esc(p.category||'')} · ${esc(p.stage||'')}</div></div><span class="badge ${cls(p.status)}">${esc(p.status||'')}</span></div><div class="project-meta"><span class="badge ${cls(p.verification)}">${esc(p.verification||'')}</span><span class="badge">Verified ${esc(p.last_verified||'—')}</span></div><div class="project-next"><strong>Next:</strong> ${esc(p.next_action||'—')}</div>${ms.length?`<div class="metric-row">${ms.map(m=>`<span class="metric-chip"><strong>${esc(metricValue(m))}</strong>${esc(m.label)}</span>`).join('')}</div>`:''}<div class="card-actions"><button class="btn btn-small" data-continue="${esc(p.id)}">Continue project</button></div></article>`;
    }).join('')||'<div class="muted empty-state">No projects match this view.</div>';
    renderDetail();
  }

  function recommendedEnvironment(p){
    const text=[p.status,p.stage,p.next_action,p.blocker].join(' ').toLowerCase();
    if(/work authorization|required work|work-only|production boundary.*work|switch to work|use work/.test(text)) return 'Work';
    return 'Normal Chat';
  }

  function buildContinuationPrompt(p){
    const env=recommendedEnvironment(p);
    const head=env==='Work'?`WORK EXECUTION PROMPT — ${p.name}`:`Continue ${p.name} from this exact Command Center state.`;
    const tail=env==='Work'
      ? `This project is at a recorded Work boundary. Execute only the Work-specific portion that normal Chat cannot complete. Preserve all verified work and return a precise handoff to normal Chat as soon as that boundary is crossed.`
      : `Continue automatically in normal Chat. Do all work that can genuinely be done there. Stop only for a real user authorization/login/payment requirement or a true Work-only capability boundary.`;
    return `${head}\n\nStatus: ${p.status||'—'}\nVerification: ${p.verification||'—'}\nStage: ${p.stage||'—'}\nNext action: ${p.next_action||'—'}\nBlocker / integrity note: ${p.blocker||'None recorded.'}\nLast verified: ${p.last_verified||'—'}\nSource status: ${p.source_status||'—'}\n\n${tail}\nDo not redo completed work. Do not invent unverified facts. Verify current state before external changes and preserve the $0/free-first rule.`;
  }

  function renderDetail(){
    const p=projects.find(x=>x.id===selectedId); if(!p){$('detailPanel').innerHTML='<div class="muted">Select a project.</div>';return;}
    const ms=projectMetrics(p.id); const acts=activity.filter(a=>a.project_id===p.id).slice(0,8); const env=recommendedEnvironment(p);
    $('detailPanel').innerHTML=`<div class="section-head"><div><div class="detail-title">${esc(p.name)}</div><div class="detail-sub">${esc(p.category||'')} · last verified ${esc(p.last_verified||'—')}</div></div><span class="badge ${cls(p.status)}">${esc(p.status||'')}</span></div><div class="project-meta"><span class="badge ${cls(p.verification)}">${esc(p.verification||'')}</span>${p.source_status?`<span class="badge source-badge">${esc(p.source_status)}</span>`:''}</div><div class="block"><h3>Next thing to do</h3><p>${esc(p.next_action||'—')}</p></div><div class="block"><h3>Blocker / integrity note</h3><p>${esc(p.blocker||'None recorded.')}</p></div><div class="block continuation-block" id="continuationBlock"><div class="section-head"><h3>Continue this project</h3><span class="badge ${env==='Work'?'attention':'active'}">${esc(env)}</span></div><p class="continuation-note">${env==='Work'?'This project is currently recorded at a genuine Work boundary.':'Use the dedicated project/series chat in normal Chat unless a genuine boundary appears.'}</p><textarea id="continuationPrompt" class="continuation-prompt" readonly></textarea><div class="continuation-actions"><button id="copyPromptBtn" class="btn btn-primary">Copy prompt</button><button id="openChatBtn" class="btn">Open ChatGPT</button></div><div id="copyMsg" class="message muted"></div></div><div class="block"><h3>Private KPIs</h3>${ms.length?`<div class="kpi-grid">${ms.map(m=>`<div class="kpi"><div class="k">${esc(m.label)}</div><div class="v">${esc(metricValue(m))}</div><div class="s">${m.verified?'Verified':'Unverified'} · ${esc(m.source||'manual')} · ${esc(fmtDate(m.updated_at))}</div></div>`).join('')}</div>`:'<div class="muted">No metrics recorded yet.</div>'}</div><div class="block"><h3>Recent updates</h3>${acts.length?`<div class="list">${acts.map(a=>`<div class="list-item"><strong>${esc(a.headline)}</strong><small>${esc(a.detail||'')} · ${esc(fmtDate(a.happened_at))}</small></div>`).join('')}</div>`:'<div class="muted">No recent updates recorded.</div>'}</div><button id="editProjectBtn" class="btn">Edit this project</button><div id="editHost"></div>`;
    $('continuationPrompt').value=buildContinuationPrompt(p);
    $('copyPromptBtn').onclick=()=>copyContinuationPrompt(p);
    $('openChatBtn').onclick=()=>window.open('https://chatgpt.com/','_blank','noopener');
    $('editProjectBtn').onclick=()=>renderEdit(p);
  }

  async function copyContinuationPrompt(p){
    const text=buildContinuationPrompt(p); let ok=false;
    try{ await navigator.clipboard.writeText(text); ok=true; }catch(_e){
      const ta=$('continuationPrompt'); ta.focus(); ta.select(); try{ok=document.execCommand('copy');}catch(_e2){}
    }
    $('copyMsg').textContent=ok?'Prompt copied. Open the dedicated project chat and paste it there.':'Copy failed. Select the prompt text manually.';
  }

  function renderEdit(p){
    $('editHost').innerHTML=`<div class="edit-form"><div class="row2"><label>Status<input id="eStatus" value="${esc(p.status||'')}"></label><label>Verification<input id="eVerify" value="${esc(p.verification||'')}"></label></div><label>Next action<textarea id="eNext" rows="3">${esc(p.next_action||'')}</textarea></label><label>Blocker<textarea id="eBlock" rows="3">${esc(p.blocker||'')}</textarea></label><button id="saveProjectBtn" class="btn btn-primary">Save private update</button><div id="editMsg" class="message"></div></div>`;
    $('saveProjectBtn').onclick=async()=>{
      const patch={status:$('eStatus').value.trim(),verification:$('eVerify').value.trim(),next_action:$('eNext').value.trim(),blocker:$('eBlock').value.trim(),updated_at:new Date().toISOString()};
      const {error}=await supabase.from('projects').update(patch).eq('id',p.id); $('editMsg').textContent=error?error.message:'Saved.'; if(!error)refreshAll();
    };
  }

  function renderRevenue(){
    const hasRevenue=hasRecordedRevenue(), total=verifiedRevenueTotal();
    $('revenueSummary').innerHTML=`<div><div class="eyebrow">Portfolio verified revenue</div><div class="revenue-total">${hasRevenue?esc(fmtMoney(total)):'Not recorded'}</div><p class="muted">Only records explicitly stored as verified revenue are counted. Deposits, balances due, estimates, or unverified sales are not included.</p></div>`;
    const rows=projects.map(p=>({p,m:revenueMetric(p.id)})).sort((a,b)=>Number(b.m?.value_numeric||-1)-Number(a.m?.value_numeric||-1));
    $('revenueList').innerHTML=rows.map(({p,m})=>`<div class="revenue-row"><div><strong>${esc(p.name)}</strong><div class="muted">${esc(p.category||'')}</div></div><div class="revenue-value ${m?'':'not-recorded'}">${m?esc(fmtMoney(m.value_numeric)):'Not recorded'}</div><button class="btn btn-small" data-open-revenue="${esc(p.id)}">Open project</button></div>`).join('');
  }

  function renderActivity(){
    $('activityList').innerHTML=activity.slice(0,18).map(a=>`<div class="list-item"><strong>${esc(a.headline)}</strong><small>${esc(a.detail||'')} · ${esc(a.project_id||'')} · ${esc(fmtDate(a.happened_at))}</small></div>`).join('')||'<div class="muted">No activity yet.</div>';
  }

  function setView(view){
    currentView=view;
    if(view==='home') selectedId=null;
    renderCurrentView();
    window.scrollTo({top:0,behavior:'smooth'});
  }

  document.addEventListener('click',e=>{
    const viewBtn=e.target.closest('[data-view]'); if(viewBtn){setView(viewBtn.dataset.view);return;}
    const cont=e.target.closest('[data-continue]'); if(cont){e.stopPropagation(); selectedId=cont.dataset.continue; if(currentView==='home'||currentView==='revenue')currentView='all'; renderCurrentView(); setTimeout(()=>$('continuationBlock')?.scrollIntoView({behavior:'smooth',block:'center'}),50);return;}
    const rev=e.target.closest('[data-open-revenue]'); if(rev){selectedId=rev.dataset.openRevenue; currentView='all'; renderCurrentView();return;}
    const card=e.target.closest('[data-open]'); if(card){selectedId=card.dataset.open;renderProjects();return;}
  });
  document.addEventListener('keydown',e=>{ const card=e.target.closest?.('[data-open]'); if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();selectedId=card.dataset.open;renderProjects();} });
  $('searchInput').addEventListener('input',renderProjects); $('statusFilter').addEventListener('change',renderProjects); $('categoryFilter').addEventListener('change',renderProjects);
  $('backHomeBtn').onclick=()=>setView('home');
  $('refreshBtn').onclick=()=>authorized&&refreshAll(); $('signOutBtn').onclick=()=>supabase?.auth.signOut();
  $('signInBtn').onclick=async()=>{ $('authMsg').textContent='Signing in…'; const {error}=await supabase.auth.signInWithPassword({email:$('emailInput').value.trim(),password:$('passwordInput').value}); $('authMsg').textContent=error?error.message:'Signed in.'; };
  $('signUpBtn').onclick=async()=>{ $('authMsg').textContent='Creating account…'; const {error}=await supabase.auth.signUp({email:$('emailInput').value.trim(),password:$('passwordInput').value}); $('authMsg').textContent=error?error.message:'Account created. If email confirmation is required, confirm it, then sign in.'; };
  $('claimBtn').onclick=async()=>{ $('claimMsg').textContent='Connecting…'; const {data,error}=await supabase.rpc('claim_command_center',{p_code:$('claimCode').value}); $('claimMsg').textContent=error?error.message:(data?'Connected. Loading…':'Invalid or already-used setup code.'); if(data)route(); };
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&authorized)refreshAll();}); setInterval(()=>{if(authorized)refreshAll();},Math.max(30000,Number(cfg.refreshMs||60000)));
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
  bootApp();
})();
