(() => {
  const MOUNT='ccDeploymentMount';
  const state={loading:false,message:'',manifest:null,status:null,releases:[],validations:[],health:[],rollbacks:[]};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmt=v=>{if(!v)return 'N/A';const d=new Date(v);return Number.isNaN(d.getTime())?'N/A':d.toLocaleString();};
  const short=v=>v?String(v).slice(0,12):'N/A';
  const client=()=>window.COMMAND_CENTER_SUPABASE||null;
  async function getUser(){const c=client();if(!c)throw new Error('Secure Command Center connection unavailable.');const {data,error}=await c.auth.getUser();if(error||!data?.user?.id)throw error||new Error('Sign in to use Deployment.');return data.user;}
  async function load(){const c=client();if(!c)return;state.loading=true;render();try{
    await getUser();
    const manifestRequest=fetch('./deployment-release-manifest.json?v=1',{cache:'no-store'}).then(async r=>{if(!r.ok)throw new Error('Release manifest unavailable.');return r.json();});
    const [manifest,status,releases,validations,health,rollbacks]=await Promise.all([
      manifestRequest,
      c.rpc('command_center_deployment_status'),
      c.from('deployment_releases').select('*').order('created_at',{ascending:false}).limit(30),
      c.from('deployment_validations').select('*').order('checked_at',{ascending:false}).limit(200),
      c.from('deployment_health_checks').select('*').order('checked_at',{ascending:false}).limit(200),
      c.from('deployment_rollbacks').select('*').order('created_at',{ascending:false}).limit(50)
    ]);
    const err=status.error||releases.error||validations.error||health.error||rollbacks.error;if(err)throw err;
    state.manifest=manifest;state.status=status.data||null;state.releases=releases.data||[];state.validations=validations.data||[];state.health=health.data||[];state.rollbacks=rollbacks.data||[];state.message='';
  }catch(e){state.message=e?.message||'Deployment state could not be loaded.';}finally{state.loading=false;render();}}
  function phase(n,title,copy,body){return `<section class="cc-deploy-phase"><div class="cc-deploy-phase-head"><div><span>Deployment · Phase ${n}</span><h4>${esc(title)}</h4><p>${esc(copy)}</p></div><span class="badge active">100% · Complete</span></div>${body}</section>`;}
  function stat(label,value){return `<div class="cc-deploy-stat"><b>${esc(value)}</b><span>${esc(label)}</span></div>`;}
  function currentRelease(){return state.releases[0]||null;}
  function releaseRows(){return state.releases.map(r=>`<article><div class="cc-deploy-row"><strong>${esc(r.release_key)}</strong><span class="cc-deploy-pill ${esc(r.status)}">${esc(r.status)}${r.known_good?' · known good':''}</span></div><div class="cc-deploy-meta">${esc(r.provider)} · ${esc(r.branch)} · <span class="cc-deploy-code">${esc(short(r.source_commit))}</span> · app-config v${esc(r.app_config_version)} · cache v${esc(r.pwa_cache_version)} · verified ${esc(fmt(r.verified_at))}</div></article>`).join('')||'<div class="cc-deploy-message">No verified release record has been written yet. Deployment history records only real externally verified releases.</div>';}
  function checkRows(items){return items.map(x=>`<div><span>${esc(x.check_key)}</span><span class="cc-deploy-pill ${esc(x.status)}">${esc(x.status)}</span></div>`).join('')||'<div><span>No verified evidence recorded yet.</span><span>N/A</span></div>';}
  function rollbackRows(){return state.rollbacks.map(r=>`<article><div class="cc-deploy-row"><strong>Rollback ${esc(r.status)}</strong><span class="cc-deploy-pill ${esc(r.status)}">${esc(r.status)}</span></div><div class="cc-deploy-meta">Branch ${esc(r.rollback_branch||'N/A')} · PR ${esc(r.pull_request_number||'N/A')} · ${esc(r.reason||'No reason recorded')} · ${esc(fmt(r.created_at))}</div></article>`).join('')||'<div class="cc-deploy-message">No rollback has been requested. The manual rollback workflow prepares a reviewable PR and never merges itself.</div>';}
  function body(){const m=state.manifest||{};const s=state.status||{};const current=currentRelease();const required=Array.isArray(m.required_qa)?m.required_qa:[];const currentValidations=current?state.validations.filter(x=>x.release_id===current.id):[];const currentHealth=current?state.health.filter(x=>x.release_id===current.id):[];return `
${phase(1,'Release Manifest','The production contract records release identity, required QA, protected assets, and rollback rules.',`<div class="cc-deploy-grid">${stat('Production branch',m.production_branch||'N/A')}${stat('Host',m.hosting_provider||'N/A')}${stat('App-config target',m.release_identity?`v${m.release_identity.app_config_version}`:'N/A')}${stat('PWA cache target',m.release_identity?`v${m.release_identity.pwa_cache_version}`:'N/A')}${stat('Required QA suites',required.length||'N/A')}</div><div class="cc-deploy-message">Project-specific release gates are also fail-closed. Books must pass their verified humanization, editing, alignment, formatting, and subtype QC gates before publishing can be considered deployment-ready.</div>`)}
${phase(2,'Pre-Deploy Validation','Required regression suites and project-specific acceptance gates must pass on one exact release state.',`<div class="cc-deploy-grid">${stat('Recorded validation checks',s.validation_total??0)}${stat('Passed validation checks',s.validation_passed??0)}${stat('Manifest-required suites',required.length||0)}</div><div class="cc-deploy-checks">${required.map(x=>`<div><span>${esc(x)}</span><span>Required</span></div>`).join('')}</div>`)}
${phase(3,'Deployment Pipeline','Command Center production uses one controlled path: feature branch → PR → exact-head QA → main → GitHub Pages.',`<div class="cc-deploy-grid">${stat('Pipeline','GitHub Pages from main')}${stat('Direct production push','Blocked by standard')}${stat('Automatic rollback merge','Never')}</div><div class="cc-deploy-message">A high-level authorized completion command may carry the whole logical release through merge/deploy/verification. Otherwise protected-boundary authorization still applies.</div>`)}
${phase(4,'Post-Deploy Health Check','Deployment is complete only after the exact production version and protected live behaviors are verified.',`<div class="cc-deploy-grid">${stat('Current release',s.release_key||'N/A')}${stat('Commit',short(s.source_commit))}${stat('Pages run',s.pages_run_number||'N/A')}${stat('Health checks passed',`${s.health_passed??0} / ${s.health_total??0}`)}</div><div class="cc-deploy-checks">${checkRows(currentHealth)}</div>`)}
${phase(5,'Version History','Verified releases retain exact commit, release identity, provider run, validation, and health evidence.',`<div class="cc-deploy-list">${releaseRows()}</div>`)}
${phase(6,'Rollback','Rollback restores a known-good historical tree onto a new branch and opens a PR for normal QA and review.',`<div class="cc-deploy-grid">${stat('Rollback records',s.rollback_records??0)}${stat('Workflow','Prepare rollback PR')}${stat('Direct main change','Never')}</div><div class="cc-deploy-list">${rollbackRows()}</div>`)}
${phase(7,'PWA Update Control','Installed-app updates advance release identity while preserving launcher art, startup recovery, viewport lock, scrolling, Back behavior, and offline recovery.',`<div class="cc-deploy-grid">${stat('Manifest app-config',m.release_identity?`v${m.release_identity.app_config_version}`:'N/A')}${stat('Manifest cache',m.release_identity?`v${m.release_identity.pwa_cache_version}`:'N/A')}${stat('Startup repair',m.release_identity?.startup_repair_marker||'N/A')}${stat('Approved PWA identity',m.protected_contracts?.pwa_identity_preserved?'Preserved':'N/A')}</div>`)}
${current?`<section class="cc-deploy-phase"><div class="cc-deploy-phase-head"><div><span>Current verified release evidence</span><h4>${esc(current.release_key)}</h4><p>Exact validation and health evidence recorded for the latest release.</p></div><span class="cc-deploy-pill ${esc(current.status)}">${esc(current.status)}</span></div><div class="cc-deploy-checks">${checkRows(currentValidations)}</div></section>`:''}`;}
  function render(){const root=document.getElementById(MOUNT);if(!root)return;root.innerHTML=`<div class="cc-deploy-workspace">${state.message?`<div class="cc-deploy-message">${esc(state.message)}</div>`:''}${state.loading?'<div class="cc-deploy-loading">Loading Deployment…</div>':body()}</div>`;}
  function mount(){if(!document.getElementById(MOUNT))return;load();}
  window.COMMAND_CENTER_DEPLOYMENT={mount,load};
  window.addEventListener('command-center:brain-capability-open',e=>{if(e.detail?.name==='Deployment')setTimeout(mount,0);});
  document.addEventListener('commandcenter:data-refresh-requested',()=>{if(document.getElementById(MOUNT))load();});
  mount();
})();
