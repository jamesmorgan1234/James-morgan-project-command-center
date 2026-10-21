(() => {
  const TYPES=['decision','fact','preference','constraint','checkpoint','reference','note'];
  const ORIGINS=['manual','system','project','chat','import'];
  const cfg=window.COMMAND_CENTER_CONFIG||{};
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]));
  const normTags=value=>[...new Set((Array.isArray(value)?value:String(value||'').split(',')).map(x=>String(x).trim().toLowerCase()).filter(Boolean))].slice(0,20);
  let client=null;
  let state={memories:[],projects:[],mounted:null,editingId:null,query:'',project:'all',type:'all',showArchived:false,busy:false};

  function getClient(){
    if(client) return client;
    if(!window.supabase?.createClient||!cfg.supabaseUrl||!cfg.supabaseAnonKey) return null;
    client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey,{auth:{persistSession:true,autoRefreshToken:false,detectSessionInUrl:false}});
    return client;
  }

  async function getAuthorizedUser(){
    const db=getClient();
    if(!db) return null;
    const {data:{session},error}=await db.auth.getSession();
    if(error||!session?.user) return null;
    const auth=await db.rpc('is_command_center_authorized');
    if(auth.error||!auth.data) return null;
    return session.user;
  }

  function cleanInput(input={}){
    const memory_type=TYPES.includes(input.memory_type)?input.memory_type:'note';
    const origin=ORIGINS.includes(input.origin)?input.origin:'manual';
    return {
      project_id:input.project_id||null,
      memory_type,
      title:String(input.title||'').trim().slice(0,160),
      body:String(input.body||'').trim(),
      tags:normTags(input.tags),
      importance:Math.min(5,Math.max(1,Number(input.importance)||3)),
      origin,
      metadata:input.metadata&&typeof input.metadata==='object'&&!Array.isArray(input.metadata)?input.metadata:{},
      status:input.status==='archived'?'archived':'active',
      archived_at:input.status==='archived'?(input.archived_at||new Date().toISOString()):null
    };
  }

  async function list(options={}){
    const db=getClient(),user=await getAuthorizedUser();
    if(!db||!user) throw new Error('Durable Memory requires an authorized Command Center session.');
    let q=db.from('brain_memories').select('*').eq('owner_id',user.id).order('updated_at',{ascending:false}).limit(options.limit||500);
    if(options.projectId) q=q.eq('project_id',options.projectId);
    if(!options.includeArchived) q=q.eq('status','active');
    if(options.type&&TYPES.includes(options.type)) q=q.eq('memory_type',options.type);
    const {data,error}=await q;
    if(error) throw error;
    let rows=data||[];
    const text=String(options.query||'').trim().toLowerCase();
    if(text) rows=rows.filter(m=>[m.title,m.body,...(m.tags||[])].join(' ').toLowerCase().includes(text));
    return rows;
  }

  async function remember(input={}){
    const db=getClient(),user=await getAuthorizedUser();
    if(!db||!user) throw new Error('Durable Memory requires an authorized Command Center session.');
    const row=cleanInput(input);
    if(!row.title) throw new Error('Memory title is required.');
    row.owner_id=user.id;
    const {data,error}=await db.from('brain_memories').insert(row).select('*').single();
    if(error) throw error;
    return data;
  }

  async function update(id,patch={}){
    const db=getClient(),user=await getAuthorizedUser();
    if(!db||!user) throw new Error('Durable Memory requires an authorized Command Center session.');
    const allowed=cleanInput({...patch,status:patch.status||'active'});
    delete allowed.owner_id;
    if(!allowed.title) throw new Error('Memory title is required.');
    const {data,error}=await db.from('brain_memories').update(allowed).eq('id',id).eq('owner_id',user.id).select('*').single();
    if(error) throw error;
    return data;
  }

  async function archive(id){
    const db=getClient(),user=await getAuthorizedUser();
    if(!db||!user) throw new Error('Durable Memory requires an authorized Command Center session.');
    const {data,error}=await db.from('brain_memories').update({status:'archived',archived_at:new Date().toISOString()}).eq('id',id).eq('owner_id',user.id).select('*').single();
    if(error) throw error;
    return data;
  }

  async function restore(id){
    const db=getClient(),user=await getAuthorizedUser();
    if(!db||!user) throw new Error('Durable Memory requires an authorized Command Center session.');
    const {data,error}=await db.from('brain_memories').update({status:'active',archived_at:null}).eq('id',id).eq('owner_id',user.id).select('*').single();
    if(error) throw error;
    return data;
  }

  async function search(query,options={}){ return list({...options,query}); }

  window.COMMAND_CENTER_BRAIN_MEMORY=Object.freeze({list,remember,update,archive,restore,search,types:[...TYPES]});

  function projectName(id){ return id?state.projects.find(p=>p.id===id)?.name||'Project':'Command Center'; }
  function setStatus(text,error=false){
    const el=state.mounted?.querySelector('[data-memory-status]');
    if(!el) return;
    el.textContent=text||'';
    el.classList.toggle('error',!!error);
  }

  function filtered(){
    const q=state.query.trim().toLowerCase();
    return state.memories.filter(m=>{
      if(!state.showArchived&&m.status==='archived') return false;
      if(state.project!=='all'&&String(m.project_id||'global')!==state.project) return false;
      if(state.type!=='all'&&m.memory_type!==state.type) return false;
      if(q&&![m.title,m.body,...(m.tags||[])].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function renderList(){
    const listEl=state.mounted?.querySelector('[data-memory-list]');
    if(!listEl) return;
    const rows=filtered();
    if(!rows.length){
      listEl.innerHTML='<div class="cc-memory-empty">No durable memories match this view.</div>';
      return;
    }
    listEl.innerHTML=rows.map(m=>`<article class="cc-memory-card ${m.status==='archived'?'archived':''}" data-memory-id="${esc(m.id)}">
      <div class="cc-memory-card-head"><div><div class="cc-memory-meta"><span class="cc-memory-pill">${esc(m.memory_type)}</span><span>${esc(projectName(m.project_id))}</span><span>Updated ${esc(new Date(m.updated_at).toLocaleString())}</span>${m.status==='archived'?'<span>Archived</span>':''}</div><h5>${esc(m.title)}</h5></div></div>
      ${m.body?`<p>${esc(m.body)}</p>`:''}
      ${(m.tags||[]).length?`<div class="cc-memory-tags">${m.tags.map(t=>`<span class="cc-memory-tag">#${esc(t)}</span>`).join('')}</div>`:''}
      <div class="cc-memory-card-actions">${m.status==='archived'?`<button type="button" data-memory-restore="${esc(m.id)}">Restore</button>`:`<button type="button" data-memory-edit="${esc(m.id)}">Edit</button><button type="button" data-memory-archive="${esc(m.id)}">Archive</button>`}</div>
    </article>`).join('');
  }

  function projectOptions(){ return '<option value="">Command Center-wide</option>'+state.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join(''); }
  function filterProjectOptions(){ return '<option value="all">All scopes</option><option value="global">Command Center-wide</option>'+state.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join(''); }

  function resetForm(){
    state.editingId=null;
    const form=state.mounted?.querySelector('[data-memory-form]');
    if(!form) return;
    form.reset();
    form.querySelector('[name="memory_type"]').value='note';
    form.querySelector('[name="importance"]').value='3';
    form.querySelector('[data-memory-save]').textContent='Save memory';
    form.hidden=true;
  }

  function openForm(memory=null){
    const form=state.mounted?.querySelector('[data-memory-form]');
    if(!form) return;
    form.hidden=false;
    state.editingId=memory?.id||null;
    form.querySelector('[name="project_id"]').value=memory?.project_id||'';
    form.querySelector('[name="memory_type"]').value=memory?.memory_type||'note';
    form.querySelector('[name="title"]').value=memory?.title||'';
    form.querySelector('[name="body"]').value=memory?.body||'';
    form.querySelector('[name="tags"]').value=(memory?.tags||[]).join(', ');
    form.querySelector('[name="importance"]').value=String(memory?.importance||3);
    form.querySelector('[data-memory-save]').textContent=memory?'Update memory':'Save memory';
    form.querySelector('[name="title"]').focus();
  }

  async function reload(){
    const db=getClient(),user=await getAuthorizedUser();
    if(!db||!user){ setStatus('Durable Memory is available after authorized sign-in.',true); return; }
    setStatus('Loading durable memory…');
    const [m,p]=await Promise.all([
      db.from('brain_memories').select('*').eq('owner_id',user.id).order('updated_at',{ascending:false}).limit(500),
      db.from('projects').select('id,name,sort_order').eq('owner_id',user.id).order('sort_order')
    ]);
    const error=m.error||p.error;
    if(error){ setStatus('Memory sync error · '+error.message,true); return; }
    state.memories=m.data||[];
    state.projects=p.data||[];
    const projectFilter=state.mounted.querySelector('[data-memory-project-filter]');
    const projectInput=state.mounted.querySelector('[name="project_id"]');
    if(projectFilter){ const value=projectFilter.value||state.project; projectFilter.innerHTML=filterProjectOptions(); projectFilter.value=[...projectFilter.options].some(o=>o.value===value)?value:'all'; state.project=projectFilter.value; }
    if(projectInput){ const value=projectInput.value; projectInput.innerHTML=projectOptions(); if([...projectInput.options].some(o=>o.value===value)) projectInput.value=value; }
    renderList();
    const active=state.memories.filter(x=>x.status==='active').length;
    const archived=state.memories.length-active;
    setStatus(`${active} active memor${active===1?'y':'ies'}${archived?` · ${archived} archived`:''} · persisted in Command Center`);
  }

  async function saveForm(form){
    if(state.busy) return;
    state.busy=true;
    const save=form.querySelector('[data-memory-save]');
    save.disabled=true;
    setStatus(state.editingId?'Updating memory…':'Saving memory…');
    try{
      const input={
        project_id:form.elements.project_id.value||null,
        memory_type:form.elements.memory_type.value,
        title:form.elements.title.value,
        body:form.elements.body.value,
        tags:form.elements.tags.value,
        importance:Number(form.elements.importance.value)||3,
        origin:'manual',
        metadata:{}
      };
      if(state.editingId) await update(state.editingId,input); else await remember(input);
      resetForm();
      await reload();
    }catch(error){ setStatus(error?.message||'Memory save failed.',true); }
    finally{state.busy=false;save.disabled=false;}
  }

  function wire(){
    const root=state.mounted;
    root.addEventListener('input',e=>{
      if(e.target.matches('[data-memory-search]')){state.query=e.target.value;renderList();}
    });
    root.addEventListener('change',e=>{
      if(e.target.matches('[data-memory-project-filter]')){state.project=e.target.value;renderList();}
      if(e.target.matches('[data-memory-type-filter]')){state.type=e.target.value;renderList();}
      if(e.target.matches('[data-memory-show-archived]')){state.showArchived=e.target.checked;renderList();}
    });
    root.addEventListener('submit',e=>{if(e.target.matches('[data-memory-form]')){e.preventDefault();saveForm(e.target);}});
    root.addEventListener('click',async e=>{
      const add=e.target.closest('[data-memory-new]'); if(add){openForm();return;}
      const cancel=e.target.closest('[data-memory-cancel]'); if(cancel){resetForm();return;}
      const edit=e.target.closest('[data-memory-edit]'); if(edit){openForm(state.memories.find(m=>m.id===edit.dataset.memoryEdit));return;}
      const archiveBtn=e.target.closest('[data-memory-archive]');
      if(archiveBtn){try{setStatus('Archiving memory…');await archive(archiveBtn.dataset.memoryArchive);await reload();}catch(error){setStatus(error?.message||'Archive failed.',true);}return;}
      const restoreBtn=e.target.closest('[data-memory-restore]');
      if(restoreBtn){try{setStatus('Restoring memory…');await restore(restoreBtn.dataset.memoryRestore);await reload();}catch(error){setStatus(error?.message||'Restore failed.',true);}return;}
    });
  }

  function mount(){
    const host=document.getElementById('ccBrainMemoryMount');
    if(!host||host===state.mounted) return;
    state.mounted=host;
    host.innerHTML=`<section class="cc-brain-memory-panel" aria-label="Durable Memory">
      <div class="cc-brain-memory-head"><div><div class="cc-brain-memory-kicker">Phase 1 · Durable Memory</div><h4>Memory Vault</h4><p>Persistent Command Center memory that survives reloads and devices. Save decisions, facts, preferences, constraints, checkpoints and references here for future Brain phases to reuse.</p></div><span class="cc-brain-memory-progress">20% · Phase 1 complete</span></div>
      <div class="cc-memory-toolbar"><input type="search" data-memory-search placeholder="Search durable memory…" aria-label="Search durable memory"><select data-memory-project-filter aria-label="Filter memory by project">${filterProjectOptions()}</select><select data-memory-type-filter aria-label="Filter memory by type"><option value="all">All types</option>${TYPES.map(t=>`<option value="${t}">${t[0].toUpperCase()+t.slice(1)}</option>`).join('')}</select><button type="button" class="cc-memory-add-btn" data-memory-new>+ Add memory</button></div>
      <label class="cc-memory-archive-toggle"><input type="checkbox" data-memory-show-archived> Show archived memories</label>
      <form class="cc-memory-form" data-memory-form hidden><div class="cc-memory-form-grid"><label>Scope<select name="project_id">${projectOptions()}</select></label><label>Type<select name="memory_type">${TYPES.map(t=>`<option value="${t}">${t[0].toUpperCase()+t.slice(1)}</option>`).join('')}</select></label><label>Importance<select name="importance"><option value="1">1 · Low</option><option value="2">2</option><option value="3" selected>3 · Normal</option><option value="4">4</option><option value="5">5 · Critical</option></select></label><label class="cc-memory-wide">Title<input name="title" maxlength="160" required placeholder="What should Command Center remember?"></label><label class="cc-memory-wide">Details<textarea name="body" maxlength="8000" placeholder="Persistent details, decision, constraint, or context…"></textarea></label><label class="cc-memory-wide">Tags<input name="tags" maxlength="400" placeholder="Comma-separated tags"></label></div><div class="cc-memory-form-actions"><button type="button" data-memory-cancel>Cancel</button><button type="submit" class="primary" data-memory-save>Save memory</button></div></form>
      <div class="cc-memory-status" data-memory-status></div><div class="cc-memory-list" data-memory-list></div>
    </section>`;
    wire();
    reload();
  }

  window.addEventListener('command-center:brain-open',()=>setTimeout(mount,0));
  const observer=new MutationObserver(()=>mount());
  observer.observe(document.documentElement,{childList:true,subtree:true});
  mount();
})();
