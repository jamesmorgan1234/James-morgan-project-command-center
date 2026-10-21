(() => {
  const cfg = window.COMMAND_CENTER_CONFIG || {};
  let client = null;
  let metrics = [];
  let projects = [];
  let loading = null;
  let timer = null;
  const openByProject = new Map();

  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const tenth = v => Math.max(0,Math.min(100,Math.round((Number(v)||0)*10)/10));
  const pctLabel = v => Number.isInteger(v) ? String(v) : Number(v).toFixed(1);
  const meta = m => { try { return JSON.parse(m?.value_text || '{}'); } catch { return {}; } };

  async function db(){
    if(client) return client;
    if(window.COMMAND_CENTER_SUPABASE) return (client=window.COMMAND_CENTER_SUPABASE);
    if(!window.supabase || !cfg.supabaseUrl || !cfg.supabaseAnonKey) return null;
    client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});
    return client;
  }

  async function load(force=false){
    if(loading) return loading;
    if(!force && projects.length) return {projects,metrics};
    loading=(async()=>{
      const c=await db(); if(!c) return {projects,metrics};
      const {data:{session}}=await c.auth.getSession(); if(!session) return {projects,metrics};
      const [p,m]=await Promise.all([
        c.from('projects').select('id,name,category,status,stage,verification').order('sort_order'),
        c.from('metrics').select('project_id,key,label,value_numeric,value_text,unit,verified,source,updated_at').order('updated_at',{ascending:false})
      ]);
      if(!p.error) projects=p.data||[];
      if(!m.error) metrics=m.data||[];
      return {projects,metrics};
    })().finally(()=>loading=null);
    return loading;
  }

  function metric(projectId,key){return metrics.find(m=>m.project_id===projectId&&m.key===key&&m.verified===true&&m.value_numeric!==null&&m.value_numeric!==undefined)||null;}
  function preferredProgress(projectId){return metric(projectId,'roadmap.current_progress_percent')||metric(projectId,'current_scope_progress_percent');}

  function applyProgress(el,m){
    if(!el||!m) return;
    const p=tenth(m.value_numeric),label=`${pctLabel(p)}%`;
    const strong=el.querySelector('.hub-progress-head strong'); if(strong) strong.textContent=label;
    const bar=el.querySelector('.hub-progress-fill'); if(bar) bar.style.width=`${p}%`;
    const track=el.querySelector('.hub-progress-track'); if(track){track.setAttribute('aria-valuenow',String(p));track.removeAttribute('aria-valuetext');}
    const basis=el.querySelector('.hub-progress-basis'); if(basis) basis.textContent=m.key==='roadmap.current_progress_percent'?'Verified checkpoint roadmap':'Verified weighted current scope';
  }

  function refreshProgressDisplays(){
    document.querySelectorAll('.hub-project-card[data-open]').forEach(card=>applyProgress(card,preferredProgress(card.dataset.open)));
    const title=document.querySelector('#detailPanel .detail-title')?.textContent?.trim();
    const p=projects.find(x=>String(x.name||'').trim()===title);
    if(p) applyProgress(document.querySelector('#detailPanel .hub-detail-toolbar'),preferredProgress(p.id));
  }

  function roadmapData(projectId){
    const current=metric(projectId,'roadmap.current_progress_percent');
    if(!current) return null;
    const cats=metrics.filter(m=>m.project_id===projectId&&m.verified===true&&/^roadmap\.[^.]+\.progress_percent$/.test(m.key)&&m.key!=='roadmap.current_progress_percent')
      .map(m=>({m,meta:meta(m)})).sort((a,b)=>(a.meta.category_order||999)-(b.meta.category_order||999));
    if(!cats.length) return null;
    return {current,cats:cats.map(c=>{
      const id=c.meta.category_id||c.m.key.split('.')[1];
      const phases=metrics.filter(m=>m.project_id===projectId&&m.verified===true&&m.key.startsWith(`roadmap.${id}.`)&&/^roadmap\.[^.]+\.[^.]+\.progress_percent$/.test(m.key))
        .map(m=>({m,meta:meta(m)})).sort((a,b)=>(a.meta.phase_order||999)-(b.meta.phase_order||999));
      return {id,label:c.meta.category_label||c.m.label||id,progress:tenth(c.m.value_numeric),phases};
    })};
  }

  function badge(p){return `<span class="cc-project-roadmap-pct">${pctLabel(p)}% · ${p===100?'Complete':p===0?'Planned':'In Progress'}</span>`;}

  function renderRoadmap(){
    const panel=document.getElementById('ccProjectRoadmap'); if(!panel) return;
    const projectId=panel.dataset.projectId; if(!projectId) return;
    const data=roadmapData(projectId); if(!data) return;
    const project=projects.find(p=>p.id===projectId);
    const open=openByProject.get(projectId)||null;
    const sig=[projectId,data.current.value_numeric,...data.cats.flatMap(c=>[c.id,c.progress,...c.phases.map(p=>`${p.meta.phase_id||p.m.key}:${p.m.value_numeric}`)])].join('|');
    if(panel.dataset.checkpointRuntimeSignature===sig) return;
    panel.dataset.checkpointRuntimeSignature=sig;
    panel.dataset.checkpointRuntime='1';
    panel.innerHTML=`<div class="cc-project-roadmap-head"><div><span>PROJECT ROADMAP</span><h3>${esc(project?.name||projectId)}</h3><p>Checkpoint-derived verified roadmap. Progress reflects only verified units that passed required gates; missing or stale checkpoint data remains N/A.</p></div><b>${data.cats.length} categories</b></div><div class="cc-project-roadmap-list">${data.cats.map(c=>{
      const isOpen=open===c.id;
      return `<section class="cc-project-roadmap-category ${isOpen?'is-open':''}" data-checkpoint-roadmap-category="${esc(c.id)}"><button type="button" class="cc-project-roadmap-category-button" aria-expanded="${isOpen}"><span class="cc-project-roadmap-icon">◆</span><span><strong>${esc(c.label)}</strong><small>${c.phases.length} phases</small></span>${badge(c.progress)}<b>${isOpen?'⌃':'›'}</b></button><div class="cc-project-roadmap-phases" ${isOpen?'':'hidden'}>${c.phases.map((p,i)=>{const v=tenth(p.m.value_numeric);return `<article class="cc-project-roadmap-phase"><span>Phase ${i+1}</span><div><strong>${esc(p.meta.phase_label||p.m.label||p.meta.phase_id||'Phase')}</strong><div class="cc-project-roadmap-track"><i style="width:${v}%"></i></div></div>${badge(v)}</article>`;}).join('')}</div></section>`;
    }).join('')}</div>`;
    panel.querySelectorAll('[data-checkpoint-roadmap-category] > button').forEach(btn=>btn.addEventListener('click',()=>{
      const section=btn.closest('[data-checkpoint-roadmap-category]'),key=section?.dataset.checkpointRoadmapCategory;
      if(!key) return;
      const current=openByProject.get(projectId)||null;
      if(current===key){
        openByProject.delete(projectId);
        if(history.state?.ccCheckpointRoadmapCategory===key){history.back();return;}
      }else{
        openByProject.set(projectId,key);
        history.pushState({...history.state,ccCheckpointRoadmapCategory:key},'',location.href);
      }
      panel.dataset.checkpointRuntimeSignature=''; renderRoadmap();
    }));
  }

  function apply(){refreshProgressDisplays();renderRoadmap();}
  function schedule(force=false){clearTimeout(timer);timer=setTimeout(async()=>{await load(force);apply();},50);}

  window.addEventListener('popstate',e=>{
    const panel=document.getElementById('ccProjectRoadmap'),projectId=panel?.dataset.projectId;
    if(projectId && openByProject.has(projectId) && !e.state?.ccCheckpointRoadmapCategory){openByProject.delete(projectId);if(panel)panel.dataset.checkpointRuntimeSignature='';schedule(false);}
  });
  document.addEventListener('commandcenter:audit-complete',()=>schedule(true));
  document.addEventListener('click',e=>{if(e.target.closest('#refreshBtn'))setTimeout(()=>schedule(true),900);else if(e.target.closest('[data-open],[data-view],[data-books-group],[data-books-back],[data-hub-back]'))setTimeout(()=>schedule(false),80);});
  const root=document.getElementById('projectView')||document.body;
  new MutationObserver(m=>{if(m.every(x=>x.target.closest?.('#ccProjectRoadmap')))return;schedule(false);}).observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  window.addEventListener('load',()=>schedule(true),{once:true});
  schedule(true);
})();
