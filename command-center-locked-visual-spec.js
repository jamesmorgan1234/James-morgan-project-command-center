(() => {
  if (window.COMMAND_CENTER_LOCKED_VISUAL_SPEC?.version >= 1) return;
  const api = window.COMMAND_CENTER_LOCKED_VISUAL_SPEC = { version: 1 };
  let observer = null;
  let timer = null;
  let cache = { projects: [], progress: new Map(), fetchedAt: 0 };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]));
  const normalize = value => String(value || '').toLowerCase();

  function root(){ return document.getElementById('ccApprovedApp'); }
  function pageTitle(){ return root()?.querySelector('.cc-approved-page-head h2')?.textContent?.trim() || ''; }
  function currentView(){
    const r = root(); if (!r) return '';
    if (r.querySelector('.cc-approved-home-grid')) return 'home';
    if (r.querySelector('.cc-approved-project-hero')) return 'project';
    const title = pageTitle().toLowerCase();
    if (title === 'projects') return 'projects';
    if (title === 'next up') return 'next';
    if (title === 'agent') return 'agent';
    if (title === 'revenue') return 'revenue';
    if (title === 'active / live') return 'active';
    return title ? 'deep' : 'home';
  }
  function setView(view){
    const r=root(); if(!r)return;
    r.dataset.ccLockedView=view;
    document.body.dataset.ccLockedView=view;
  }

  function iconArt(title){
    const text=normalize(title);
    if(/book|kdp|cook|color|saga|world|crown|pier|hour/.test(text))return "url('./art-eclipse.svg')";
    if(/brain|ai|agent/.test(text))return "url('./art-brain.svg')";
    if(/analytic|revenue|performance|market/.test(text))return "url('./art-chart.svg')";
    if(/content|pipeline/.test(text))return "url('./art-road.svg')";
    if(/community|social|network/.test(text))return "url('./art-network.svg')";
    if(/website|web|design/.test(text))return "url('./art-castle.svg')";
    if(/blocked|marketing/.test(text))return "url('./art-mountain-red.svg')";
    return "url('./art-mountain.svg')";
  }

  async function authorizedClient(){
    const c=window.COMMAND_CENTER_SUPABASE;if(!c)return null;
    const {data:{session},error}=await c.auth.getSession();if(error||!session?.user)return null;
    const gate=await c.rpc('is_command_center_authorized');if(gate.error||!gate.data)return null;
    return c;
  }
  function precise(row){
    if(!row)return null;
    try{const meta=JSON.parse(row.value_text||'{}');const done=Number(meta.completed_weight),total=Number(meta.total_weight);if(Number.isFinite(done)&&Number.isFinite(total)&&total>0)return{pct:Math.max(0,Math.min(100,(done/total)*100)),done,total};}catch{}
    const n=Number(row.value_numeric);return Number.isFinite(n)?{pct:Math.max(0,Math.min(100,n)),done:null,total:null}:null;
  }
  async function refreshData(force=false){
    if(!force && cache.fetchedAt && Date.now()-cache.fetchedAt<15000)return cache;
    const c=await authorizedClient();if(!c)return cache;
    const [p,m]=await Promise.all([
      c.from('projects').select('id,name,category,status,stage,next_action,verification,blocker,last_verified,sort_order').order('sort_order'),
      c.from('analytics_project_kpis').select('project_id,metric_key,value_numeric,value_text,verified').eq('metric_key','current_scope_progress_percent').eq('verified',true)
    ]);
    if(!p.error)cache.projects=p.data||[];
    if(!m.error)cache.progress=new Map((m.data||[]).map(row=>[row.project_id,row]));
    cache.fetchedAt=Date.now();return cache;
  }

  function decorateArt(){
    root()?.querySelectorAll('.cc-approved-project-card[data-cc-project]').forEach(card=>{
      const title=card.querySelector('.cc-approved-project-copy>strong')?.textContent||'';
      card.style.setProperty('--cc-lock-art',iconArt(title));
    });
  }
  function decorateSummary(){
    const r=root();if(!r||currentView()!=='projects')return;
    const total=r.querySelector('.cc-approved-total');if(!total)return;
    const active=cache.projects.filter(p=>/active|live|progress/i.test(p.status||'')).length;
    const planning=cache.projects.filter(p=>/planning/i.test(p.status||'')).length;
    let sub=total.querySelector('.cc-locked-summary-sub');
    const label=total.querySelector(':scope > span:not(.cc-approved-emblem)');
    if(label&&!sub){sub=document.createElement('small');sub.className='cc-locked-summary-sub';label.appendChild(sub);}
    if(sub)sub.textContent=`${active} active / live • ${planning} planning`;
    if(!total.querySelector('.cc-locked-active-link')){
      const b=document.createElement('button');b.type='button';b.className='cc-locked-active-link';b.dataset.ccLockedActive='1';b.textContent='ACTIVE / LIVE';total.appendChild(b);
    }
  }
  function nextCard(p){
    return `<button type="button" class="cc-approved-project-card" data-cc-locked-project="${esc(p.id)}" style="--cc-lock-art:${iconArt(p.name)}"><span class="cc-approved-emblem" aria-hidden="true">${emblemFor(p)}</span><span class="cc-approved-project-copy"><strong>${esc(p.name)}</strong><span class="cc-approved-status ${statusTone(p.status)}">${esc(p.status||'Current')}</span><span class="cc-locked-next-copy">${esc(p.next_action||'No next step recorded.')}</span></span></button>`;
  }
  function renderNextQueue(){
    const r=root();if(!r||currentView()!=='next')return;
    const list=r.querySelector('.cc-approved-project-list');if(!list)return;
    const rows=cache.projects.filter(p=>String(p.next_action||'').trim());
    const sig=rows.map(p=>`${p.id}:${p.status}:${p.next_action}`).join('|');
    if(list.dataset.ccLockedSignature===sig)return;
    list.dataset.ccLockedSignature=sig;
    list.innerHTML=rows.map(nextCard).join('')||'<div class="cc-approved-empty">Nothing is queued next right now.</div>';
  }

  function decorateProjectCards(){
    const r=root();if(!r)return;
    const view=currentView();
    if(view!=='projects'&&view!=='next')return;
    r.querySelectorAll('.cc-approved-project-card[data-cc-project],.cc-approved-project-card[data-cc-locked-project]').forEach(card=>{
      const id=card.dataset.ccProject||card.dataset.ccLockedProject;
      const p=cache.projects.find(x=>x.id===id);
      card.style.setProperty('--cc-lock-art',iconArt(p?.name||card.textContent));
      if(view==='projects'){
        card.querySelector('.cc-locked-next-copy')?.remove();
        let basis=card.querySelector('.cc-locked-project-basis');
        if(!basis){basis=document.createElement('small');basis.className='cc-locked-project-basis';card.appendChild(basis);}
        const pr=precise(cache.progress.get(id));
        basis.textContent=pr?.done!==null&&pr?.done!==undefined&&pr?.total!==null&&pr?.total!==undefined?`${pr.done} / ${pr.total} scope`:'Verified scope';
      }
    });
  }

  function addBookLabels(){
    root()?.querySelectorAll('.cc-approved-books .cc-approved-book').forEach((tile,index)=>{
      tile.querySelector('.cc-approved-cover>span')?.remove();
      let label=tile.querySelector('.cc-approved-book-label');
      if(!label){label=document.createElement('strong');label.className='cc-approved-book-label';tile.prepend(label);}
      label.textContent=`Book ${index+1}`;
    });
  }

  function ensureSixAgentButtons(){
    const r=root();if(!r)return;
    r.querySelectorAll('.cc-approved-agent-modes').forEach(group=>{
      const names=[...group.querySelectorAll('button strong')].map(x=>x.textContent.trim().toLowerCase());
      const host=group.closest('.cc-approved-agent-home,.cc-approved-agent');
      if(!names.includes('project checkpoint')&&!group.querySelector('[data-cc-agent-checkpoint]')) window.COMMAND_CENTER_AUTHORITATIVE_RUNTIME?.refresh?.();
      if(host?.classList.contains('cc-approved-agent-home')&&!host.querySelector('[data-cc-agent-stop]')) window.COMMAND_CENTER_AUTHORITATIVE_RUNTIME?.refresh?.();
      const stop=host?.querySelector('[data-cc-agent-stop]');if(host?.classList.contains('cc-approved-agent-home')&&stop&&stop.parentElement!==group)group.appendChild(stop);
    });
  }

  function statusTone(status){
    const s=normalize(status);if(/blocked|needs|recovery/.test(s))return'tone-red';if(/live|ready|complete|published/.test(s))return'tone-green';if(/planning/.test(s))return'tone-blue';return'tone-amber';
  }
  function emblemFor(p){
    const t=normalize(`${p.name} ${p.category}`);if(/book|kdp|color|workbook|saga/.test(t))return'▥';if(/brain|ai|agent/.test(t))return'✦';if(/analytic/.test(t))return'▥';if(/content/.test(t))return'▤';if(/community/.test(t))return'◉';if(/data/.test(t))return'▥';return'▱';
  }
  function activeCard(p){
    const pr=precise(cache.progress.get(p.id));const pct=pr?`${pr.pct.toFixed(1)}%`:'N/A';
    const freshness=p.last_verified?`Verified ${p.last_verified}`:'Verified state';
    return `<button type="button" class="cc-locked-active-card" data-cc-locked-project="${esc(p.id)}" style="--cc-lock-art:${iconArt(p.name)}"><span class="cc-approved-emblem" aria-hidden="true">${emblemFor(p)}</span><span class="cc-locked-active-main"><strong>${esc(p.name)}</strong><span class="cc-approved-status ${statusTone(p.status)}">${esc(p.status||'Current')}</span><small class="cc-locked-active-next">${esc(p.next_action||'No next step recorded.')}</small></span><span class="cc-locked-active-scope"><strong>${esc(pct)}</strong><span>Scope</span><small>${esc(freshness)}</small></span></button>`;
  }
  async function openActive(push=true){
    await refreshData(true);const r=root();if(!r)return;
    const active=cache.projects.filter(p=>/active|live|progress/i.test(p.status||''));
    r.innerHTML=`<div class="cc-approved-page-head"><button class="cc-approved-back" type="button" data-cc-locked-active-back aria-label="Back">‹</button><div><h2>Active / Live</h2><p>Live projects in progress</p></div></div><div class="cc-locked-active-list">${active.map(activeCard).join('')||'<div class="cc-approved-empty">No active projects right now.</div>'}</div>`;
    setView('active');
    if(push)history.pushState({ccApproved:'projects',ccLocked:'active'},'',location.href);
  }
  function backToProjects(){
    const state={ccApproved:'projects'};history.pushState(state,'',location.href);window.dispatchEvent(new PopStateEvent('popstate',{state}));
  }
  function openProject(id){
    if(!id)return;const state={ccApproved:'project',projectId:id};history.pushState(state,'',location.href);window.dispatchEvent(new PopStateEvent('popstate',{state}));
  }

  async function apply(){
    const r=root();if(!r||document.body.classList.contains('cc-approved-legacy-open'))return;
    const view=currentView();setView(view);
    await refreshData(false);
    renderNextQueue();decorateArt();decorateSummary();decorateProjectCards();addBookLabels();ensureSixAgentButtons();
  }
  function schedule(delay=30){clearTimeout(timer);timer=setTimeout(()=>requestAnimationFrame(()=>apply().catch(()=>{})),delay);}

  document.addEventListener('click',event=>{
    const active=event.target.closest?.('[data-cc-locked-active]');if(active){event.preventDefault();event.stopImmediatePropagation();openActive(true);return;}
    const back=event.target.closest?.('[data-cc-locked-active-back]');if(back){event.preventDefault();event.stopImmediatePropagation();if(history.state?.ccLocked==='active')history.back();else backToProjects();return;}
    const project=event.target.closest?.('[data-cc-locked-project]');if(project){event.preventDefault();event.stopImmediatePropagation();openProject(project.dataset.ccLockedProject);return;}
    if(event.target.closest?.('[data-cc-home],[data-cc-project],[data-cc-back],[data-cc-toggle]'))schedule(80);
  },true);
  window.addEventListener('popstate',event=>{
    if(event.state?.ccLocked==='active'){setTimeout(()=>openActive(false),120);return;}
    schedule(90);
  });
  window.addEventListener('visibilitychange',()=>{if(!document.hidden){refreshData(true).then(()=>schedule(0));}});
  window.addEventListener('command-center:client-ready',()=>schedule(50));
  window.addEventListener('command-center:approved-rendered',()=>schedule(0));
  window.addEventListener('load',()=>schedule(100),{once:true});
  observer=new MutationObserver(()=>schedule(40));observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});
  [250,700,1400].forEach(ms=>setTimeout(()=>schedule(0),ms));
  api.refresh=()=>refreshData(true).then(()=>schedule(0));api.openActive=openActive;
})();