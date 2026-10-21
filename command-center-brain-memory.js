(() => {
  const TYPES=['decision','fact','preference','constraint','checkpoint','reference','note','approved_asset','reusable_implementation'];
  const TRUST=['draft','observed','verified','approved','locked'];
  const SHARING=['private_project','command_center_shared'];
  const PATCH=['project_id','memory_type','title','body','tags','importance','origin','trust_state','source_ref','source_observed_at','canonical_key','content_hash','sharing_scope','promoted_at','supersedes_id','metadata'];
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const tags=v=>[...new Set((Array.isArray(v)?v:String(v||'').split(',')).map(x=>String(x).trim().toLowerCase()).filter(Boolean))].slice(0,30);
  let state={host:null,rows:[],projects:[],editing:null,q:'',project:'all',type:'all',trust:'all',archived:false,busy:false};

  function db(){return window.COMMAND_CENTER_SUPABASE||null;}
  async function authUser(){
    const c=db(); if(!c)return null;
    const {data:{session},error}=await c.auth.getSession(); if(error||!session?.user)return null;
    const gate=await c.rpc('is_command_center_authorized'); if(gate.error||!gate.data)return null;
    return session.user;
  }
  function normalize(k,v){
    if(k==='project_id'||k==='supersedes_id')return v||null;
    if(k==='memory_type')return TYPES.includes(v)?v:'note';
    if(k==='title')return String(v||'').trim().slice(0,160);
    if(k==='body'||k==='source_ref'||k==='canonical_key'||k==='content_hash')return String(v||'').trim()||null;
    if(k==='tags')return tags(v);
    if(k==='importance')return Math.min(5,Math.max(1,Number(v)||3));
    if(k==='origin')return String(v||'manual');
    if(k==='trust_state')return TRUST.includes(v)?v:'observed';
    if(k==='sharing_scope')return SHARING.includes(v)?v:'private_project';
    if(k==='source_observed_at'||k==='promoted_at')return v||null;
    if(k==='metadata')return v&&typeof v==='object'&&!Array.isArray(v)?v:{};
    return v;
  }
  function clean(input={},partial=false){
    const out={};
    for(const k of PATCH){
      if(partial&&!Object.prototype.hasOwnProperty.call(input,k))continue;
      if(!partial&&['origin','trust_state','sharing_scope','metadata'].includes(k)&&!Object.prototype.hasOwnProperty.call(input,k)){
        out[k]=normalize(k,k==='origin'?'manual':k==='trust_state'?'observed':k==='sharing_scope'?'private_project':{});continue;
      }
      if(Object.prototype.hasOwnProperty.call(input,k))out[k]=normalize(k,input[k]);
    }
    return out;
  }
  async function list(options={}){
    const c=db(),user=await authUser(); if(!c||!user)throw new Error('Durable Memory requires an authorized Command Center session.');
    let q=c.from('brain_memories').select('*').eq('owner_id',user.id).order('updated_at',{ascending:false}).limit(options.limit||500);
    if(!options.includeArchived)q=q.eq('status','active');
    if(options.projectId)q=q.eq('project_id',options.projectId);
    if(options.type&&TYPES.includes(options.type))q=q.eq('memory_type',options.type);
    if(options.trust&&TRUST.includes(options.trust))q=q.eq('trust_state',options.trust);
    const {data,error}=await q;if(error)throw error;
    const text=String(options.query||'').trim().toLowerCase();
    return !text?(data||[]):(data||[]).filter(m=>[m.title,m.body,m.source_ref,m.canonical_key,...(m.tags||[])].join(' ').toLowerCase().includes(text));
  }
  async function remember(input={}){
    const c=db(),user=await authUser(); if(!c||!user)throw new Error('Durable Memory requires an authorized Command Center session.');
    const row=clean(input); if(!row.title)throw new Error('Memory title is required.'); row.owner_id=user.id; row.status='active'; row.archived_at=null;
    const {data,error}=await c.from('brain_memories').insert(row).select('*').single();if(error)throw error;return data;
  }
  async function update(id,patch={}){
    const c=db(),user=await authUser(); if(!c||!user)throw new Error('Durable Memory requires an authorized Command Center session.');
    const row=clean(patch,true); if(Object.prototype.hasOwnProperty.call(row,'title')&&!row.title)throw new Error('Memory title is required.'); if(!Object.keys(row).length)throw new Error('No memory fields supplied.');
    const {data,error}=await c.from('brain_memories').update(row).eq('id',id).eq('owner_id',user.id).select('*').single();if(error)throw error;return data;
  }
  async function archive(id){const c=db(),user=await authUser();if(!c||!user)throw new Error('Not authorized.');const {data,error}=await c.from('brain_memories').update({status:'archived',archived_at:new Date().toISOString()}).eq('id',id).eq('owner_id',user.id).select('*').single();if(error)throw error;return data;}
  async function restore(id){const c=db(),user=await authUser();if(!c||!user)throw new Error('Not authorized.');const {data,error}=await c.from('brain_memories').update({status:'active',archived_at:null}).eq('id',id).eq('owner_id',user.id).select('*').single();if(error)throw error;return data;}
  async function supersede(id,replacement={}){
    const old=(await list({includeArchived:true,limit:500})).find(x=>x.id===id);if(!old)throw new Error('Memory not found.');
    const fresh=await remember({...old,...replacement,supersedes_id:id,status:undefined,archived_at:undefined,owner_id:undefined,id:undefined,created_at:undefined,updated_at:undefined});
    const c=db(),user=await authUser();const {error}=await c.from('brain_memories').update({status:'superseded',archived_at:new Date().toISOString()}).eq('id',id).eq('owner_id',user.id);if(error)throw error;return fresh;
  }
  async function search(query,options={}){return list({...options,query});}
  window.COMMAND_CENTER_BRAIN_MEMORY=Object.freeze({list,remember,update,archive,restore,supersede,search,types:[...TYPES],trustStates:[...TRUST],sharingScopes:[...SHARING]});

  function projectName(id){return id?state.projects.find(p=>p.id===id)?.name||'Project':'Command Center-wide';}
  function status(text,error=false){const el=state.host?.querySelector('[data-memory-status]');if(el){el.textContent=text||'';el.classList.toggle('error',!!error);}}
  function filtered(){const q=state.q.trim().toLowerCase();return state.rows.filter(m=>{if(!state.archived&&m.status!=='active')return false;if(state.project!=='all'&&String(m.project_id||'global')!==state.project)return false;if(state.type!=='all'&&m.memory_type!==state.type)return false;if(state.trust!=='all'&&m.trust_state!==state.trust)return false;return !q||[m.title,m.body,m.source_ref,m.canonical_key,...(m.tags||[])].join(' ').toLowerCase().includes(q);});}
  function renderList(){const box=state.host?.querySelector('[data-memory-list]');if(!box)return;const rows=filtered();box.innerHTML=rows.length?rows.map(m=>`<article class="cc-memory-card ${m.status!=='active'?'archived':''}" data-memory-id="${esc(m.id)}"><div class="cc-memory-meta"><span class="cc-memory-pill">${esc(m.memory_type)}</span><span class="cc-memory-pill trust">${esc(m.trust_state)}</span><span>${esc(projectName(m.project_id))}</span><span>${esc(m.sharing_scope==='command_center_shared'?'Shared intelligence':'Private project')}</span>${m.status!=='active'?`<span>${esc(m.status)}</span>`:''}</div><h5>${esc(m.title)}</h5>${m.body?`<p>${esc(m.body)}</p>`:''}${m.source_ref?`<small class="cc-memory-source">Source: ${esc(m.source_ref)}</small>`:''}${(m.tags||[]).length?`<div class="cc-memory-tags">${m.tags.map(t=>`<span>#${esc(t)}</span>`).join('')}</div>`:''}<div class="cc-memory-actions">${m.status==='active'?`<button data-memory-edit="${esc(m.id)}">Edit</button><button data-memory-archive="${esc(m.id)}">Archive</button>`:`<button data-memory-restore="${esc(m.id)}">Restore</button>`}</div></article>`).join(''):'<div class="cc-memory-empty">No durable memories match this view.</div>';}
  function projectOptions(filter=false){return `${filter?'<option value="all">All scopes</option><option value="global">Command Center-wide</option>':'<option value="">Command Center-wide</option>'}${state.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}`;}
  function resetForm(){state.editing=null;const f=state.host?.querySelector('[data-memory-form]');if(!f)return;f.reset();f.hidden=true;f.elements.memory_type.value='note';f.elements.importance.value='3';f.elements.trust_state.value='observed';f.elements.sharing_scope.value='private_project';f.querySelector('[data-memory-save]').textContent='Save memory';}
  function openForm(m=null){const f=state.host?.querySelector('[data-memory-form]');if(!f)return;f.hidden=false;state.editing=m?.id||null;for(const k of ['project_id','memory_type','title','body','importance','trust_state','source_ref','canonical_key','sharing_scope'])if(f.elements[k])f.elements[k].value=k==='project_id'?(m?.project_id||''):k==='tags'?(m?.tags||[]).join(', '):(m?.[k]??'');f.elements.tags.value=(m?.tags||[]).join(', ');f.querySelector('[data-memory-save]').textContent=m?'Update memory':'Save memory';f.elements.title.focus();}
  async function reload(){const c=db(),user=await authUser();if(!c||!user){status('Durable Memory is available after authorized sign-in.',true);return;}status('Loading durable memory…');const [m,p]=await Promise.all([c.from('brain_memories').select('*').eq('owner_id',user.id).order('updated_at',{ascending:false}).limit(500),c.from('projects').select('id,name,sort_order').eq('owner_id',user.id).order('sort_order')]);const error=m.error||p.error;if(error){status('Memory sync error · '+error.message,true);return;}state.rows=m.data||[];state.projects=p.data||[];const pf=state.host.querySelector('[data-memory-project-filter]'),pi=state.host.querySelector('[name="project_id"]');if(pf){const v=pf.value||state.project;pf.innerHTML=projectOptions(true);pf.value=[...pf.options].some(o=>o.value===v)?v:'all';state.project=pf.value;}if(pi){const v=pi.value;pi.innerHTML=projectOptions(false);if([...pi.options].some(o=>o.value===v))pi.value=v;}renderList();status(`${state.rows.filter(x=>x.status==='active').length} active memories · Supabase persisted`);}
  async function save(f){if(state.busy)return;state.busy=true;const b=f.querySelector('[data-memory-save]');b.disabled=true;try{const input={project_id:f.elements.project_id.value||null,memory_type:f.elements.memory_type.value,title:f.elements.title.value,body:f.elements.body.value,tags:f.elements.tags.value,importance:Number(f.elements.importance.value)||3,origin:'manual',trust_state:f.elements.trust_state.value,source_ref:f.elements.source_ref.value,canonical_key:f.elements.canonical_key.value,sharing_scope:f.elements.sharing_scope.value,metadata:{}};state.editing?await update(state.editing,input):await remember(input);resetForm();await reload();}catch(e){status(e?.message||'Memory save failed.',true);}finally{state.busy=false;b.disabled=false;}}
  function wire(){const r=state.host;r.addEventListener('input',e=>{if(e.target.matches('[data-memory-search]')){state.q=e.target.value;renderList();}});r.addEventListener('change',e=>{if(e.target.matches('[data-memory-project-filter]'))state.project=e.target.value;if(e.target.matches('[data-memory-type-filter]'))state.type=e.target.value;if(e.target.matches('[data-memory-trust-filter]'))state.trust=e.target.value;if(e.target.matches('[data-memory-show-archived]'))state.archived=e.target.checked;renderList();});r.addEventListener('submit',e=>{if(e.target.matches('[data-memory-form]')){e.preventDefault();save(e.target);}});r.addEventListener('click',async e=>{const add=e.target.closest('[data-memory-new]');if(add){openForm();return;}if(e.target.closest('[data-memory-cancel]')){resetForm();return;}const edit=e.target.closest('[data-memory-edit]');if(edit){openForm(state.rows.find(x=>x.id===edit.dataset.memoryEdit));return;}const a=e.target.closest('[data-memory-archive]');if(a){try{await archive(a.dataset.memoryArchive);await reload();}catch(err){status(err.message,true);}return;}const rr=e.target.closest('[data-memory-restore]');if(rr){try{await restore(rr.dataset.memoryRestore);await reload();}catch(err){status(err.message,true);}}});}
  function mount(){const host=document.getElementById('ccBrainMemoryMount');if(!host||host===state.host)return;state.host=host;host.innerHTML=`<section class="cc-brain-memory-panel"><div class="cc-brain-tool-head"><div><span>Phase 1 · Durable Memory</span><h4>Memory Vault</h4><p>Persistent, owner-scoped memory with project scope, provenance, trust, canonical relationships, approved assets and shared-intelligence foundations.</p></div><b>100% · Complete</b></div><div class="cc-memory-toolbar"><input data-memory-search type="search" placeholder="Search durable memory…"><select data-memory-project-filter>${projectOptions(true)}</select><select data-memory-type-filter><option value="all">All types</option>${TYPES.map(x=>`<option value="${x}">${esc(x)}</option>`).join('')}</select><select data-memory-trust-filter><option value="all">All trust states</option>${TRUST.map(x=>`<option value="${x}">${esc(x)}</option>`).join('')}</select><button data-memory-new>+ Add memory</button></div><label class="cc-memory-toggle"><input type="checkbox" data-memory-show-archived> Show archived / superseded</label><form data-memory-form hidden><div class="cc-memory-form-grid"><label>Scope<select name="project_id">${projectOptions(false)}</select></label><label>Type<select name="memory_type">${TYPES.map(x=>`<option value="${x}">${esc(x)}</option>`).join('')}</select></label><label>Trust<select name="trust_state">${TRUST.map(x=>`<option value="${x}">${esc(x)}</option>`).join('')}</select></label><label>Sharing<select name="sharing_scope"><option value="private_project">Private project</option><option value="command_center_shared">Command Center shared</option></select></label><label>Importance<select name="importance">${[1,2,3,4,5].map(x=>`<option value="${x}">${x}</option>`).join('')}</select></label><label class="wide">Title<input name="title" maxlength="160" required></label><label class="wide">Memory<textarea name="body"></textarea></label><label class="wide">Tags<input name="tags" placeholder="comma, separated"></label><label>Source reference<input name="source_ref"></label><label>Canonical key<input name="canonical_key"></label></div><div class="cc-memory-form-actions"><button type="button" data-memory-cancel>Cancel</button><button class="primary" data-memory-save>Save memory</button></div></form><div class="cc-memory-status" data-memory-status></div><div class="cc-memory-list" data-memory-list></div></section>`;wire();reload();}
  window.addEventListener('command-center:brain-open',()=>setTimeout(mount,0));
  window.addEventListener('command-center:brain-capability-open',e=>{if(e.detail?.name==='Project Brain')setTimeout(mount,0);});
  if(document.getElementById('ccBrainMemoryMount'))mount();
})();
