(() => {
  const PLAN_STATUSES=['draft','active','paused','completed','archived'];
  const TASK_STATUSES=['backlog','ready','in_progress','blocked','done','archived'];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const norm=v=>String(v??'').toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const clampPriority=v=>Math.max(1,Math.min(5,Number(v)||3));
  const isoOrNull=v=>{if(!v)return null;const d=new Date(v);return Number.isNaN(d.getTime())?null:d.toISOString();};
  const fmtDate=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleDateString();};
  let state={host:null,projects:[],contexts:[],plans:[],tasks:[],openPlanId:null,query:'',project:'all',status:'active',showArchived:false,busy:false};

  function db(){return window.COMMAND_CENTER_SUPABASE||null;}
  async function authUser(){
    const c=db();if(!c)return null;
    const {data:{session},error}=await c.auth.getSession();if(error||!session?.user)return null;
    const gate=await c.rpc('is_command_center_authorized');
    return gate.error||!gate.data?null:session.user;
  }
  function planTasks(planId,includeArchived=false){return state.tasks.filter(t=>t.plan_id===planId&&(includeArchived||t.status!=='archived'));}
  function planProgress(planId){
    const rows=planTasks(planId).filter(t=>t.status!=='archived');
    const done=rows.filter(t=>t.status==='done').length;
    return {done,total:rows.length,pct:rows.length?Math.round(done*100/rows.length):0};
  }
  function taskSort(a,b){
    const order={in_progress:0,ready:1,backlog:2,blocked:3,done:4,archived:5};
    return (Number(a.sort_order)||0)-(Number(b.sort_order)||0)||(order[a.status]??9)-(order[b.status]??9)||(Number(b.priority)||3)-(Number(a.priority)||3)||String(a.created_at||'').localeCompare(String(b.created_at||''));
  }
  function projectName(id){return state.projects.find(p=>p.id===id)?.name||'Command Center-wide';}
  function contextName(id){return state.contexts.find(c=>c.id===id)?.title||'No context packet';}
  function activePlanStatus(p){return p.status!=='archived'&&p.archived_at==null;}
  function deriveGroundedTasks(packet){
    if(!packet)return [];
    const j=packet.context_json||{},out=[],seen=new Set();
    const add=(title,details,source,type)=>{
      const clean=String(title||'').trim();if(!clean)return;
      const key=norm(clean);if(!key||seen.has(key))return;seen.add(key);
      out.push({title:clean.slice(0,220),details:String(details||'').trim(),source_ref:source||`context:${packet.id}`,metadata:{planner_seed:'context',planner_seed_type:type,context_packet_id:packet.id}});
    };
    for(const p of (j.projects||[])){
      if(p.next_action)add(p.next_action,`Verified next action from ${p.name||'project state'}.`,p.source_ref||`context:${packet.id}`,'project_next_action');
      if(p.blocker)add(`Resolve blocker: ${p.blocker}`,`Blocker recorded for ${p.name||'project state'}.`,p.source_ref||`context:${packet.id}`,'project_blocker');
    }
    for(const x of (j.tracking_integrations||[]))if(x.next_step)add(x.next_step,`Tracking integration next step for ${x.project_name||x.metric_label||'project tracking'}.`,x.source_ref||`context:${packet.id}`,'tracking_next_step');
    return out;
  }
  function duplicateSeedKeys(planId){
    return new Set(planTasks(planId,true).map(t=>norm(t.title)));
  }

  async function load(){
    const c=db(),u=await authUser();if(!c||!u)throw new Error('Task Queue / Planner requires an authorized Command Center session.');
    const [pr,ctx,plans,tasks]=await Promise.all([
      c.from('projects').select('id,name,category,status,verification,sort_order').eq('owner_id',u.id).order('sort_order'),
      c.from('brain_context_packets').select('id,project_id,title,purpose,query_text,context_json,source_snapshot,status,updated_at').eq('owner_id',u.id).eq('status','active').order('updated_at',{ascending:false}).limit(200),
      c.from('brain_plans').select('*').eq('owner_id',u.id).order('updated_at',{ascending:false}).limit(300),
      c.from('brain_tasks').select('*').eq('owner_id',u.id).order('sort_order').order('created_at').limit(1000)
    ]);
    const err=pr.error||ctx.error||plans.error||tasks.error;if(err)throw err;
    state.projects=pr.data||[];state.contexts=ctx.data||[];state.plans=plans.data||[];state.tasks=tasks.data||[];
    return {projects:state.projects,contexts:state.contexts,plans:state.plans,tasks:state.tasks};
  }
  async function createPlan(input={}){
    const c=db(),u=await authUser();if(!c||!u)throw new Error('Not authorized.');
    const title=String(input.title||'').trim();if(!title)throw new Error('Plan title is required.');
    const row={owner_id:u.id,project_id:input.project_id||null,context_packet_id:input.context_packet_id||null,title:title.slice(0,220),objective:String(input.objective||'').trim(),status:PLAN_STATUSES.includes(input.status)?input.status:'draft',priority:clampPriority(input.priority),target_date:input.target_date||null,source_ref:input.source_ref||null,metadata:input.metadata||{}};
    const {data,error}=await c.from('brain_plans').insert(row).select('*').single();if(error)throw error;return data;
  }
  async function updatePlan(id,patch={}){
    const c=db(),u=await authUser();if(!c||!u)throw new Error('Not authorized.');
    const allowed={};
    for(const key of ['project_id','context_packet_id','title','objective','target_date','source_ref','metadata'])if(key in patch)allowed[key]=patch[key]||null;
    if('priority' in patch)allowed.priority=clampPriority(patch.priority);
    if('status' in patch&&PLAN_STATUSES.includes(patch.status)){allowed.status=patch.status;allowed.completed_at=patch.status==='completed'?new Date().toISOString():null;allowed.archived_at=patch.status==='archived'?new Date().toISOString():null;}
    const {data,error}=await c.from('brain_plans').update(allowed).eq('id',id).eq('owner_id',u.id).select('*').single();if(error)throw error;return data;
  }
  async function createTask(input={}){
    const c=db(),u=await authUser();if(!c||!u)throw new Error('Not authorized.');
    const title=String(input.title||'').trim();if(!title)throw new Error('Task title is required.');
    const siblings=state.tasks.filter(t=>t.plan_id===(input.plan_id||null)&&t.status!=='archived');
    const nextOrder=siblings.length?Math.max(...siblings.map(t=>Number(t.sort_order)||0))+10:10;
    const row={owner_id:u.id,plan_id:input.plan_id||null,project_id:input.project_id||null,context_packet_id:input.context_packet_id||null,parent_id:input.parent_id||null,title:title.slice(0,220),details:String(input.details||'').trim(),status:TASK_STATUSES.includes(input.status)?input.status:'backlog',priority:clampPriority(input.priority),sort_order:Number.isInteger(Number(input.sort_order))?Math.max(0,Number(input.sort_order)):nextOrder,due_at:isoOrNull(input.due_at),source_ref:input.source_ref||null,metadata:input.metadata||{}};
    const {data,error}=await c.from('brain_tasks').insert(row).select('*').single();if(error)throw error;return data;
  }
  async function updateTask(id,patch={}){
    const c=db(),u=await authUser();if(!c||!u)throw new Error('Not authorized.');
    const allowed={};
    for(const key of ['plan_id','project_id','context_packet_id','parent_id','title','details','source_ref','metadata'])if(key in patch)allowed[key]=patch[key]||null;
    if('priority' in patch)allowed.priority=clampPriority(patch.priority);
    if('sort_order' in patch)allowed.sort_order=Math.max(0,Number(patch.sort_order)||0);
    if('due_at' in patch)allowed.due_at=isoOrNull(patch.due_at);
    if('status' in patch&&TASK_STATUSES.includes(patch.status)){allowed.status=patch.status;allowed.completed_at=patch.status==='done'?new Date().toISOString():null;allowed.archived_at=patch.status==='archived'?new Date().toISOString():null;}
    const {data,error}=await c.from('brain_tasks').update(allowed).eq('id',id).eq('owner_id',u.id).select('*').single();if(error)throw error;return data;
  }
  async function moveTask(id,direction){
    const task=state.tasks.find(t=>t.id===id);if(!task)return null;
    const rows=planTasks(task.plan_id).sort(taskSort),i=rows.findIndex(t=>t.id===id),j=direction==='up'?i-1:i+1;if(i<0||j<0||j>=rows.length)return task;
    const a=rows[i],b=rows[j],ao=Number(a.sort_order)||i*10,bo=Number(b.sort_order)||j*10;
    await updateTask(a.id,{sort_order:bo});await updateTask(b.id,{sort_order:ao});return true;
  }
  async function seedPlanFromContext(planId){
    const plan=state.plans.find(p=>p.id===planId);if(!plan?.context_packet_id)return [];
    const packet=state.contexts.find(c=>c.id===plan.context_packet_id);if(!packet)return [];
    const existing=duplicateSeedKeys(planId),grounded=deriveGroundedTasks(packet).filter(t=>!existing.has(norm(t.title)));
    const made=[];for(const seed of grounded){made.push(await createTask({...seed,plan_id:plan.id,project_id:plan.project_id||packet.project_id||null,context_packet_id:packet.id,status:'backlog',priority:plan.priority}));}
    return made;
  }

  function status(text,error=false){const el=state.host?.querySelector('[data-planner-status]');if(el){el.textContent=text||'';el.classList.toggle('error',!!error);}}
  function optionProjects(includeAll=false){return `${includeAll?'<option value="all">All projects</option>':'<option value="">Command Center-wide</option>'}${state.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}`;}
  function optionContexts(){return `<option value="">No context packet</option>${state.contexts.map(c=>`<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('')}`;}
  function taskBadge(s){return String(s||'backlog').replaceAll('_',' ');}
  function filteredPlans(){
    let rows=state.plans.filter(p=>state.showArchived||p.status!=='archived');
    if(state.project!=='all')rows=rows.filter(p=>String(p.project_id||'global')===state.project);
    if(state.status!=='all')rows=rows.filter(p=>state.status==='active'?activePlanStatus(p):p.status===state.status);
    const q=norm(state.query);if(q)rows=rows.filter(p=>norm(`${p.title} ${p.objective} ${projectName(p.project_id)}`).includes(q));
    return rows.sort((a,b)=>(Number(b.priority)||3)-(Number(a.priority)||3)||String(b.updated_at||'').localeCompare(String(a.updated_at||'')));
  }
  function renderTask(t,plan){
    return `<article class="cc-planner-task status-${esc(t.status)}" data-task-id="${esc(t.id)}"><div class="cc-planner-task-main"><div class="cc-planner-task-title"><strong>${esc(t.title)}</strong><span class="cc-planner-pill">${esc(taskBadge(t.status))}</span><span class="cc-planner-pill priority">P${esc(t.priority)}</span></div>${t.details?`<p>${esc(t.details)}</p>`:''}<div class="cc-planner-meta"><span>Due ${esc(fmtDate(t.due_at))}</span>${t.parent_id?'<span>Dependent task</span>':''}${t.source_ref?'<span>Source linked</span>':''}</div></div><div class="cc-planner-task-actions"><button data-task-move="up" title="Move up">↑</button><button data-task-move="down" title="Move down">↓</button><select data-task-status>${TASK_STATUSES.filter(s=>s!=='archived').map(s=>`<option value="${s}" ${s===t.status?'selected':''}>${taskBadge(s)}</option>`).join('')}</select><button data-task-edit>Edit</button><button data-task-archive>Archive</button></div></article>`;
  }
  function renderPlan(p){
    const progress=planProgress(p.id),tasks=planTasks(p.id).sort(taskSort),open=state.openPlanId===p.id;
    return `<section class="cc-planner-plan ${open?'open':''}" data-plan-id="${esc(p.id)}"><button type="button" class="cc-planner-plan-toggle" data-plan-toggle aria-expanded="${open?'true':'false'}"><span><strong>${esc(p.title)}</strong><small>${esc(projectName(p.project_id))} · ${esc(p.status)} · Priority ${esc(p.priority)}</small></span><span class="cc-planner-progress"><b>${progress.pct}%</b><small>${progress.done}/${progress.total} tasks done</small></span><span class="cc-planner-chevron">${open?'⌃':'›'}</span></button>${open?`<div class="cc-planner-plan-body"><div class="cc-planner-objective"><span>Objective</span><p>${esc(p.objective||'No objective recorded yet.')}</p><div class="cc-planner-meta"><span>Context: ${esc(contextName(p.context_packet_id))}</span><span>Target: ${esc(p.target_date||'—')}</span></div></div><div class="cc-planner-plan-actions"><button data-plan-add-task>Add task</button>${p.context_packet_id?'<button data-plan-seed>Seed from verified context</button>':''}<button data-plan-edit>Edit plan</button>${p.status==='archived'?'<button data-plan-restore>Restore</button>':'<button data-plan-archive>Archive plan</button>'}</div><form class="cc-planner-task-form" data-task-form hidden><div class="cc-planner-form-grid"><label class="wide">Task title<input name="title" maxlength="220" required></label><label class="wide">Details<textarea name="details" rows="3"></textarea></label><label>Status<select name="status">${TASK_STATUSES.filter(s=>s!=='archived').map(s=>`<option value="${s}">${taskBadge(s)}</option>`).join('')}</select></label><label>Priority<select name="priority">${[5,4,3,2,1].map(n=>`<option value="${n}" ${n===p.priority?'selected':''}>${n}</option>`).join('')}</select></label><label>Due<input name="due_at" type="datetime-local"></label></div><div class="cc-planner-form-actions"><button type="button" data-task-cancel>Cancel</button><button class="primary" type="submit">Save task</button></div></form><div class="cc-planner-queue">${tasks.length?tasks.map(t=>renderTask(t,p)).join(''):'<div class="cc-memory-empty">No tasks yet. Add a task or seed grounded next actions from the linked Context Builder packet.</div>'}</div></div>`:''}</section>`;
  }
  function render(){
    if(!state.host)return;
    const list=state.host.querySelector('[data-planner-list]');if(list)list.innerHTML=filteredPlans().map(renderPlan).join('')||'<div class="cc-memory-empty">No plans match this view.</div>';
    bindDynamic();
  }
  function fillPlanForm(plan=null){
    const form=state.host?.querySelector('[data-plan-form]');if(!form)return;
    form.dataset.editId=plan?.id||'';form.hidden=false;
    form.elements.title.value=plan?.title||'';form.elements.objective.value=plan?.objective||'';form.elements.project_id.value=plan?.project_id||'';form.elements.context_packet_id.value=plan?.context_packet_id||'';form.elements.status.value=plan?.status==='archived'?'draft':(plan?.status||'draft');form.elements.priority.value=String(plan?.priority||3);form.elements.target_date.value=plan?.target_date||'';
    form.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  async function refresh(message='Planner refreshed.'){
    state.busy=true;status('Loading planner…');try{await load();render();status(message);}catch(e){status(e?.message||'Planner load failed.',true);}finally{state.busy=false;}
  }
  function closeOpenPlan(useHistory=true){
    if(!state.openPlanId)return;
    if(useHistory&&history.state?.ccBrainPlannerPlan){history.back();return;}
    state.openPlanId=null;render();
  }
  function openPlan(id,push=true){
    if(state.openPlanId===id){closeOpenPlan(push);return;}
    state.openPlanId=id;render();
    if(push)history.pushState({...history.state,ccBrainPlannerPlan:id},'',location.href);
  }
  function bindDynamic(){
    state.host?.querySelectorAll('[data-plan-id]').forEach(section=>{
      const id=section.dataset.planId,plan=state.plans.find(p=>p.id===id);if(!plan)return;
      section.querySelector('[data-plan-toggle]')?.addEventListener('click',()=>openPlan(id,true));
      section.querySelector('[data-plan-add-task]')?.addEventListener('click',()=>{const f=section.querySelector('[data-task-form]');if(f)f.hidden=false;});
      section.querySelector('[data-task-cancel]')?.addEventListener('click',()=>{const f=section.querySelector('[data-task-form]');if(f){f.hidden=true;f.reset();}});
      section.querySelector('[data-task-form]')?.addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,fd=new FormData(f);try{status('Saving task…');await createTask({plan_id:plan.id,project_id:plan.project_id,context_packet_id:plan.context_packet_id,title:fd.get('title'),details:fd.get('details'),status:fd.get('status'),priority:fd.get('priority'),due_at:fd.get('due_at')});f.reset();f.hidden=true;await refresh('Task saved.');}catch(err){status(err?.message||'Task save failed.',true);}});
      section.querySelector('[data-plan-seed]')?.addEventListener('click',async()=>{const packet=state.contexts.find(c=>c.id===plan.context_packet_id),candidate=deriveGroundedTasks(packet).filter(t=>!duplicateSeedKeys(plan.id).has(norm(t.title)));if(!candidate.length){status('No new grounded next actions were found in this context packet.');return;}if(!confirm(`Create ${candidate.length} grounded task${candidate.length===1?'':'s'} from this verified context packet?`))return;try{status('Seeding grounded tasks…');const made=await seedPlanFromContext(plan.id);await refresh(`${made.length} grounded task${made.length===1?'':'s'} added.`);}catch(err){status(err?.message||'Context seeding failed.',true);}});
      section.querySelector('[data-plan-edit]')?.addEventListener('click',()=>fillPlanForm(plan));
      section.querySelector('[data-plan-archive]')?.addEventListener('click',async()=>{if(!confirm('Archive this plan? Its tasks stay attached and can be restored later.'))return;try{await updatePlan(plan.id,{status:'archived'});state.openPlanId=null;await refresh('Plan archived.');}catch(e){status(e?.message||'Archive failed.',true);}});
      section.querySelector('[data-plan-restore]')?.addEventListener('click',async()=>{try{await updatePlan(plan.id,{status:'draft'});await refresh('Plan restored.');}catch(e){status(e?.message||'Restore failed.',true);}});
      section.querySelectorAll('[data-task-id]').forEach(card=>{const tid=card.dataset.taskId,task=state.tasks.find(t=>t.id===tid);if(!task)return;
        card.querySelector('[data-task-status]')?.addEventListener('change',async e=>{try{await updateTask(tid,{status:e.target.value});await refresh('Task status updated.');}catch(err){status(err?.message||'Task update failed.',true);}});
        card.querySelectorAll('[data-task-move]').forEach(b=>b.addEventListener('click',async()=>{try{await moveTask(tid,b.dataset.taskMove);await refresh('Queue order updated.');}catch(err){status(err?.message||'Reorder failed.',true);}}));
        card.querySelector('[data-task-archive]')?.addEventListener('click',async()=>{if(!confirm('Archive this task?'))return;try{await updateTask(tid,{status:'archived'});await refresh('Task archived.');}catch(err){status(err?.message||'Archive failed.',true);}});
        card.querySelector('[data-task-edit]')?.addEventListener('click',async()=>{const title=prompt('Task title',task.title);if(title===null)return;const details=prompt('Task details',task.details||'');if(details===null)return;try{await updateTask(tid,{title,details});await refresh('Task updated.');}catch(err){status(err?.message||'Task update failed.',true);}});
      });
    });
  }
  async function mount(){
    const host=document.getElementById('ccBrainPlannerMount');if(!host)return;state.host=host;
    host.innerHTML=`<section class="cc-brain-memory-panel cc-brain-planner-panel"><div class="cc-brain-tool-head"><div><span>Phase 4 workspace</span><h4>Task Queue / Planner</h4><p>Turn goals and trusted Context Builder packets into ordered, persistent execution queues. Progress is derived only from saved task state.</p></div><b>100% · Complete</b></div><div class="cc-planner-toolbar"><input data-planner-search type="search" placeholder="Search plans…"><select data-planner-project></select><select data-planner-status><option value="active">Active + draft</option><option value="all">All statuses</option>${PLAN_STATUSES.filter(s=>!['archived'].includes(s)).map(s=>`<option value="${s}">${s}</option>`).join('')}</select><button data-planner-new>New plan</button></div><label class="cc-memory-toggle"><input data-planner-archived type="checkbox"> Show archived plans</label><form data-plan-form hidden><div class="cc-planner-form-grid"><label class="wide">Plan title<input name="title" maxlength="220" required></label><label class="wide">Objective<textarea name="objective" rows="3"></textarea></label><label>Project<select name="project_id"></select></label><label>Context packet<select name="context_packet_id"></select></label><label>Status<select name="status">${PLAN_STATUSES.filter(s=>s!=='archived').map(s=>`<option value="${s}">${s}</option>`).join('')}</select></label><label>Priority<select name="priority">${[5,4,3,2,1].map(n=>`<option value="${n}" ${n===3?'selected':''}>${n}</option>`).join('')}</select></label><label>Target date<input name="target_date" type="date"></label></div><div class="cc-planner-form-actions"><button type="button" data-plan-cancel>Cancel</button><button class="primary" type="submit">Save plan</button></div></form><div class="cc-memory-status" data-planner-status></div><div class="cc-planner-list" data-planner-list></div></section>`;
    try{await load();}catch(e){status(e?.message||'Planner load failed.',true);return;}
    host.querySelector('[data-planner-project]').innerHTML=optionProjects(true);host.querySelector('[data-plan-form] [name="project_id"]').innerHTML=optionProjects(false);host.querySelector('[data-plan-form] [name="context_packet_id"]').innerHTML=optionContexts();
    host.querySelector('[data-planner-search]').addEventListener('input',e=>{state.query=e.target.value;render();});
    host.querySelector('[data-planner-project]').addEventListener('change',e=>{state.project=e.target.value;render();});
    host.querySelector('[data-planner-status]').addEventListener('change',e=>{state.status=e.target.value;render();});
    host.querySelector('[data-planner-archived]').addEventListener('change',e=>{state.showArchived=e.target.checked;render();});
    host.querySelector('[data-planner-new]').addEventListener('click',()=>fillPlanForm());
    host.querySelector('[data-plan-cancel]').addEventListener('click',()=>{const f=host.querySelector('[data-plan-form]');f.hidden=true;f.reset();f.dataset.editId='';});
    host.querySelector('[data-plan-form]').addEventListener('submit',async e=>{e.preventDefault();const f=e.currentTarget,fd=new FormData(f),payload={title:fd.get('title'),objective:fd.get('objective'),project_id:fd.get('project_id')||null,context_packet_id:fd.get('context_packet_id')||null,status:fd.get('status'),priority:fd.get('priority'),target_date:fd.get('target_date')||null};try{status('Saving plan…');if(f.dataset.editId)await updatePlan(f.dataset.editId,payload);else await createPlan(payload);f.hidden=true;f.reset();f.dataset.editId='';await refresh('Plan saved.');}catch(err){status(err?.message||'Plan save failed.',true);}});
    render();status('Planner ready.');
  }

  window.COMMAND_CENTER_BRAIN_PLANNER={load,createPlan,updatePlan,createTask,updateTask,moveTask,seedPlanFromContext,deriveGroundedTasks,planProgress,taskSort,mount,refresh};
  window.addEventListener('command-center:brain-capability-open',e=>{if(e.detail?.name==='Project Brain')setTimeout(mount,0);});
  window.addEventListener('command-center:brain-planner-refresh',()=>refresh());
  window.addEventListener('popstate',e=>{if(state.openPlanId&&!e.state?.ccBrainPlannerPlan){state.openPlanId=null;render();}});
  if(document.getElementById('ccBrainPlannerMount'))mount();
})();