(() => {
  const cfg = window.COMMAND_CENTER_CONFIG || {};
  const $ = id => document.getElementById(id);
  const app = $('app'), boot = $('boot');
  let supabase = null, session = null, authorized = false;
  let projects = [], metrics = [], activity = [], selectedId = null, channel = null;

  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const cls = s => { const x=String(s||'').toLowerCase(); if(x.includes('live'))return'live';if(x.includes('active'))return'active';if(x.includes('planning'))return'planning';if(x.includes('pause'))return'paused';if(x.includes('recover'))return'recovery';if(x.includes('verified'))return'verified';if(x.includes('mixed'))return'mixed';if(x.includes('unverified')||x.includes('attention'))return'unverified';return''; };
  const fmtMoney = n => new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',maximumFractionDigits:2}).format(Number(n||0));
  const fmtDate = v => v ? new Date(v).toLocaleString() : '—';

  function show(el, yes=true){ el.hidden=!yes; }
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
    cleanupRealtime();
    if(!session){
      authorized=false; projects=[]; metrics=[]; activity=[];
      show($('authPanel'),true); show($('claimPanel'),false); show($('dashboard'),false); show($('signOutBtn'),false);
      setSync('Private data · sign in required'); return;
    }
    show($('signOutBtn'),true);
    const {data,error}=await supabase.rpc('is_command_center_authorized');
    if(error){ setSync('Authorization check failed'); return; }
    authorized=!!data;
    show($('authPanel'),false); show($('claimPanel'),!authorized); show($('dashboard'),authorized);
    if(authorized){ await refreshAll(); setupRealtime(); }
    else setSync('Signed in · setup code required');
  }

  async function refreshAll(){
    setSync('Refreshing private data…');
    const [p,m,a]=await Promise.all([
      supabase.from('projects').select('*').order('sort_order'),
      supabase.from('metrics').select('*').order('updated_at',{ascending:false}),
      supabase.from('activity').select('*').order('happened_at',{ascending:false}).limit(100)
    ]);
    const err=p.error||m.error||a.error;
    if(err){ setSync('Sync error · '+err.message); return; }
    projects=p.data||[]; metrics=m.data||[]; activity=a.data||[];
    if(!selectedId || !projects.some(x=>x.id===selectedId)) selectedId=projects[0]?.id||null;
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
  function isAttention(p){ return p.attention===true || /needs|blocked|recovery|paused/i.test(p.status||'') || /needs|unverified/i.test(p.verification||''); }

  function render(){ renderStats(); renderFilters(); renderAttention(); renderProjects(); renderDetail(); renderActivity(); }
  function renderStats(){
    const active=projects.filter(p=>/active|live/i.test(p.status||'')).length;
    const att=projects.filter(isAttention).length;
    const money=metrics.filter(m=>m.key==='verified_revenue_usd'&&m.verified&&m.value_numeric!==null).reduce((s,m)=>s+Number(m.value_numeric||0),0);
    const earning=new Set(metrics.filter(m=>m.key==='verified_revenue_usd'&&m.verified&&Number(m.value_numeric||0)>0).map(m=>m.project_id)).size;
    $('stats').innerHTML=[
      ['Projects',projects.length],['Active / live',active],['Needs attention',att],['Verified revenue',fmtMoney(money)],['Projects earning',earning]
    ].map(([l,v])=>`<div class="stat"><div class="label">${esc(l)}</div><div class="value">${esc(v)}</div></div>`).join('');
  }
  function renderFilters(){
    const sf=$('statusFilter'),cf=$('categoryFilter'); const sv=sf.value,cv=cf.value;
    const statuses=[...new Set(projects.map(p=>p.status).filter(Boolean))].sort();
    const cats=[...new Set(projects.map(p=>p.category).filter(Boolean))].sort();
    sf.innerHTML='<option value="all">All statuses</option>'+statuses.map(x=>`<option>${esc(x)}</option>`).join('');
    cf.innerHTML='<option value="all">All categories</option>'+cats.map(x=>`<option>${esc(x)}</option>`).join('');
    if(statuses.includes(sv))sf.value=sv;if(cats.includes(cv))cf.value=cv;
  }
  function filteredProjects(){
    const q=$('searchInput').value.trim().toLowerCase(), sf=$('statusFilter').value, cf=$('categoryFilter').value;
    return projects.filter(p=>{
      const hay=[p.name,p.category,p.status,p.verification,p.stage,p.next_action,p.blocker].join(' ').toLowerCase();
      return (sf==='all'||p.status===sf)&&(cf==='all'||p.category===cf)&&(!q||hay.includes(q));
    });
  }
  function renderAttention(){
    const list=projects.filter(isAttention).sort((a,b)=>(a.sort_order??999)-(b.sort_order??999));
    $('attentionCount').textContent=list.length; $('attentionCount').className='badge '+(list.length?'attention':'verified');
    $('attentionList').innerHTML=list.length?list.map(p=>`<button class="project-card" data-open="${esc(p.id)}"><strong>${esc(p.name)}</strong><div class="project-next">${esc(p.next_action||p.blocker||'Review project')}</div></button>`).join(''):'<div class="muted">Nothing currently flagged.</div>';
  }
  function renderProjects(){
    const list=filteredProjects(); $('projectCount').textContent=`${list.length} shown`;
    $('projectGrid').innerHTML=list.map(p=>{
      const ms=projectMetrics(p.id).filter(m=>m.show_on_card).slice(0,3);
      return `<button class="project-card ${p.id===selectedId?'selected':''}" data-open="${esc(p.id)}"><div class="section-head"><div><h3>${esc(p.name)}</h3><div class="muted">${esc(p.category||'')} · ${esc(p.stage||'')}</div></div><span class="badge ${cls(p.status)}">${esc(p.status||'')}</span></div><div class="project-meta"><span class="badge ${cls(p.verification)}">${esc(p.verification||'')}</span><span class="badge">Verified ${esc(p.last_verified||'—')}</span></div><div class="project-next"><strong>Next:</strong> ${esc(p.next_action||'—')}</div>${ms.length?`<div class="metric-row">${ms.map(m=>`<span class="metric-chip"><strong>${esc(metricValue(m))}</strong>${esc(m.label)}</span>`).join('')}</div>`:''}</button>`;
    }).join('')||'<div class="muted">No projects match the filters.</div>';
  }
  function renderDetail(){
    const p=projects.find(x=>x.id===selectedId); if(!p){$('detailPanel').innerHTML='<div class="muted">Select a project.</div>';return;}
    const ms=projectMetrics(p.id); const acts=activity.filter(a=>a.project_id===p.id).slice(0,8);
    $('detailPanel').innerHTML=`<div class="section-head"><div><div class="detail-title">${esc(p.name)}</div><div class="detail-sub">${esc(p.category||'')} · last verified ${esc(p.last_verified||'—')}</div></div><span class="badge ${cls(p.status)}">${esc(p.status||'')}</span></div><div class="project-meta"><span class="badge ${cls(p.verification)}">${esc(p.verification||'')}</span>${p.source_status?`<span class="badge">${esc(p.source_status)}</span>`:''}</div><div class="block"><h3>Next thing to do</h3><p>${esc(p.next_action||'—')}</p></div><div class="block"><h3>Blocker / integrity note</h3><p>${esc(p.blocker||'None recorded.')}</p></div><div class="block"><h3>Private KPIs</h3>${ms.length?`<div class="kpi-grid">${ms.map(m=>`<div class="kpi"><div class="k">${esc(m.label)}</div><div class="v">${esc(metricValue(m))}</div><div class="s">${m.verified?'Verified':'Unverified'} · ${esc(m.source||'manual')} · ${esc(fmtDate(m.updated_at))}</div></div>`).join('')}</div>`:'<div class="muted">No metrics recorded yet.</div>'}</div><div class="block"><h3>Recent updates</h3>${acts.length?`<div class="list">${acts.map(a=>`<div class="list-item"><strong>${esc(a.headline)}</strong><small>${esc(a.detail||'')} · ${esc(fmtDate(a.happened_at))}</small></div>`).join('')}</div>`:'<div class="muted">No recent updates recorded.</div>'}</div><button id="editProjectBtn" class="btn">Edit this project</button><div id="editHost"></div>`;
    $('editProjectBtn').onclick=()=>renderEdit(p);
  }
  function renderEdit(p){
    $('editHost').innerHTML=`<div class="edit-form"><div class="row2"><label>Status<input id="eStatus" value="${esc(p.status||'')}"></label><label>Verification<input id="eVerify" value="${esc(p.verification||'')}"></label></div><label>Next action<textarea id="eNext" rows="3">${esc(p.next_action||'')}</textarea></label><label>Blocker<textarea id="eBlock" rows="3">${esc(p.blocker||'')}</textarea></label><button id="saveProjectBtn" class="btn btn-primary">Save private update</button><div id="editMsg" class="message"></div></div>`;
    $('saveProjectBtn').onclick=async()=>{
      const patch={status:$('eStatus').value.trim(),verification:$('eVerify').value.trim(),next_action:$('eNext').value.trim(),blocker:$('eBlock').value.trim(),updated_at:new Date().toISOString()};
      const {error}=await supabase.from('projects').update(patch).eq('id',p.id); $('editMsg').textContent=error?error.message:'Saved.'; if(!error)refreshAll();
    };
  }
  function renderActivity(){
    $('activityList').innerHTML=activity.slice(0,30).map(a=>`<div class="list-item"><strong>${esc(a.headline)}</strong><small>${esc(a.detail||'')} · ${esc(a.project_id||'')} · ${esc(fmtDate(a.happened_at))}</small></div>`).join('')||'<div class="muted">No activity yet.</div>';
  }

  document.addEventListener('click',e=>{ const b=e.target.closest('[data-open]'); if(b){selectedId=b.dataset.open;renderProjects();renderDetail();window.scrollTo({top:0,behavior:'smooth'});} });
  $('searchInput').addEventListener('input',renderProjects); $('statusFilter').addEventListener('change',renderProjects); $('categoryFilter').addEventListener('change',renderProjects);
  $('refreshBtn').onclick=()=>authorized&&refreshAll(); $('signOutBtn').onclick=()=>supabase?.auth.signOut();
  $('signInBtn').onclick=async()=>{ $('authMsg').textContent='Signing in…'; const {error}=await supabase.auth.signInWithPassword({email:$('emailInput').value.trim(),password:$('passwordInput').value}); $('authMsg').textContent=error?error.message:'Signed in.'; };
  $('signUpBtn').onclick=async()=>{ $('authMsg').textContent='Creating account…'; const {error}=await supabase.auth.signUp({email:$('emailInput').value.trim(),password:$('passwordInput').value}); $('authMsg').textContent=error?error.message:'Account created. If email confirmation is required, confirm it, then sign in.'; };
  $('claimBtn').onclick=async()=>{ $('claimMsg').textContent='Connecting…'; const {data,error}=await supabase.rpc('claim_command_center',{p_code:$('claimCode').value}); $('claimMsg').textContent=error?error.message:(data?'Connected. Loading…':'Invalid or already-used setup code.'); if(data)route(); };
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&authorized)refreshAll();}); setInterval(()=>{if(authorized)refreshAll();},Math.max(30000,Number(cfg.refreshMs||60000)));
  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));
  bootApp();
})();
