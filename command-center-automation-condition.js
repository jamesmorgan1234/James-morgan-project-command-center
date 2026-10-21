(() => {
  const MOUNT_ID='ccAutomationConditionMount';
  const PROJECT_FIELDS=[
    ['status','Status'],['verification','Verification'],['stage','Stage'],['next_action','Next action'],
    ['blocker','Blocker'],['attention','Attention'],['source_status','Source status']
  ];
  const OPERATORS=[
    ['eq','equals'],['neq','does not equal'],['gt','greater than'],['gte','at least'],
    ['lt','less than'],['lte','at most'],['contains','contains'],['not_contains','does not contain'],
    ['is_empty','is empty'],['not_empty','is not empty']
  ];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmtDate=v=>{if(!v)return 'N/A';const d=new Date(v);return Number.isNaN(d.getTime())?'N/A':d.toLocaleString();};
  const state={
    conditions:[],evaluations:[],projects:[],metrics:[],schedules:[],openId:null,loading:false,message:'',
    draft:{name:'',project_id:'',match_mode:'all',rules:[{source:'metric',subject:'',operator:'gte',expected:''}]}
  };

  function client(){return window.COMMAND_CENTER_SUPABASE||null;}
  async function ownerId(){const c=client();if(!c)throw new Error('Secure Command Center connection is unavailable.');const {data,error}=await c.auth.getUser();if(error||!data?.user?.id)throw error||new Error('Sign in to use Automation.');return data.user.id;}
  function normalizeExpected(value,operator){
    if(['is_empty','not_empty'].includes(operator))return null;
    const text=String(value??'').trim();
    if(!text)throw new Error('Enter a comparison value.');
    if(['gt','gte','lt','lte'].includes(operator)){const n=Number(text);if(!Number.isFinite(n))throw new Error('Numeric comparisons need a valid number.');return n;}
    if(/^(true|false)$/i.test(text))return text.toLowerCase()==='true';
    return text;
  }
  function normalizeClause(input={}){
    const source=String(input.source||'').trim(),operator=String(input.operator||'').trim();
    if(!['metric','project'].includes(source))throw new Error('Choose a valid condition source.');
    if(!OPERATORS.some(([v])=>v===operator))throw new Error('Choose a valid condition operator.');
    const expected=normalizeExpected(input.expected,operator);
    if(source==='metric'){
      const key=String(input.key||input.subject||'').trim();if(!key)throw new Error('Choose a verified metric.');
      return {source:'metric',key,operator,...(!['is_empty','not_empty'].includes(operator)?{expected}:{})};
    }
    const field=String(input.field||input.subject||'').trim();if(!PROJECT_FIELDS.some(([v])=>v===field))throw new Error('Choose a valid project field.');
    return {source:'project',field,operator,...(!['is_empty','not_empty'].includes(operator)?{expected}:{})};
  }
  function normalizeCondition(input={}){
    const name=String(input.name||'').trim(),project_id=String(input.project_id||'').trim(),match_mode=String(input.match_mode||'all').trim();
    if(!name)throw new Error('Condition name is required.');if(!project_id)throw new Error('Choose a project.');if(!['all','any'].includes(match_mode))throw new Error('Choose ALL or ANY.');
    const raw=Array.isArray(input.clauses)?input.clauses:[];if(raw.length<1||raw.length>10)throw new Error('A condition needs between 1 and 10 rules.');
    return {name,project_id,match_mode,clauses:raw.map(normalizeClause),metadata:{condition_evaluator_phase:2}};
  }
  function projectName(id){return state.projects.find(p=>p.id===id)?.name||id||'N/A';}
  function operatorLabel(op){return OPERATORS.find(([v])=>v===op)?.[1]||op;}
  function clauseSummary(rule){
    const subject=rule.source==='metric'?rule.key:(PROJECT_FIELDS.find(([v])=>v===rule.field)?.[1]||rule.field);
    const op=operatorLabel(rule.operator);return `${subject} ${op}${['is_empty','not_empty'].includes(rule.operator)?'':` ${String(rule.expected)}`}`;
  }
  function resultBadge(value){const v=String(value||'never');return `<span class="cc-cond-result ${esc(v)}">${esc(v==='never'?'Not evaluated':v)}</span>`;}
  function linkedSchedules(id){return state.schedules.filter(s=>s.condition_id===id);}
  function latestEvaluation(id){return state.evaluations.find(e=>e.condition_id===id)||null;}

  async function load(){
    const c=client();if(!c)return;state.loading=true;render();
    try{
      await ownerId();
      const [conditions,evaluations,projects,metrics,schedules]=await Promise.all([
        c.from('automation_conditions').select('*').order('created_at',{ascending:false}),
        c.from('automation_condition_evaluations').select('id,condition_id,dispatch_id,result_state,result_boolean,evaluated_at').order('evaluated_at',{ascending:false}).limit(150),
        c.from('projects').select('id,name').order('name',{ascending:true}),
        c.from('metrics').select('project_id,key,label,value_numeric,value_text,unit,verified,updated_at').eq('verified',true).order('updated_at',{ascending:false}),
        c.from('automation_schedules').select('id,name,project_id,condition_id,status,next_run_at').order('created_at',{ascending:false})
      ]);
      for(const r of [conditions,evaluations,projects,metrics,schedules])if(r.error)throw r.error;
      state.conditions=conditions.data||[];state.evaluations=evaluations.data||[];state.projects=projects.data||[];state.metrics=metrics.data||[];state.schedules=schedules.data||[];state.message='';
      if(!state.draft.project_id&&state.projects[0])state.draft.project_id=state.projects[0].id;
    }catch(error){state.message=error?.message||'Condition Evaluator data could not be loaded.';}finally{state.loading=false;render();}
  }
  async function createCondition(input){
    const c=client(),owner_id=await ownerId(),payload=normalizeCondition(input);
    const {data,error}=await c.from('automation_conditions').insert({...payload,owner_id,status:'active'}).select('*').single();if(error)throw error;await load();return data;
  }
  async function updateCondition(id,patch){const c=client();await ownerId();const {data,error}=await c.from('automation_conditions').update(patch).eq('id',id).select('*').single();if(error)throw error;await load();return data;}
  async function setStatus(id,status){if(!['active','paused','archived'].includes(status))throw new Error('Unsupported condition status.');return updateCondition(id,{status});}
  async function removeCondition(id){const c=client();await ownerId();const {error}=await c.from('automation_conditions').delete().eq('id',id);if(error)throw error;if(state.openId===id)state.openId=null;await load();}
  async function evaluateNow(id){
    const c=client();await ownerId();const {data,error}=await c.rpc('command_center_evaluate_condition',{p_condition_id:id});if(error)throw error;await load();return Array.isArray(data)?data[0]:data;
  }
  async function linkSchedule(scheduleId,conditionId){
    const c=client();await ownerId();const {error}=await c.from('automation_schedules').update({condition_id:conditionId||null}).eq('id',scheduleId);if(error)throw error;await load();window.COMMAND_CENTER_AUTOMATION_SCHEDULER?.load?.();
  }

  function readDraft(root){
    const form=root.querySelector('[data-cc-cond-form]');if(!form)return;
    state.draft.name=form.elements.name?.value||'';
    state.draft.project_id=form.elements.project_id?.value||'';
    state.draft.match_mode=form.elements.match_mode?.value||'all';
    state.draft.rules=[...root.querySelectorAll('[data-cc-cond-rule]')].map(row=>({
      source:row.querySelector('[data-source]')?.value||'metric',
      subject:row.querySelector('[data-subject]')?.value||'',
      operator:row.querySelector('[data-operator]')?.value||'eq',
      expected:row.querySelector('[data-expected]')?.value||''
    }));
  }
  function metricHints(){
    return state.metrics.map(m=>`<option value="${esc(m.key)}">${esc(m.label||m.key)} · ${esc(projectName(m.project_id))}</option>`).join('');
  }
  function ruleRow(rule,index){
    const empty=['is_empty','not_empty'].includes(rule.operator);
    const subject=rule.source==='project'
      ?`<select data-subject>${PROJECT_FIELDS.map(([v,n])=>`<option value="${v}" ${rule.subject===v?'selected':''}>${esc(n)}</option>`).join('')}</select>`
      :`<input data-subject list="ccCondMetricKeys" value="${esc(rule.subject)}" placeholder="verified metric key">`;
    return `<div class="cc-cond-rule" data-cc-cond-rule="${index}">
      <label>Source<select data-source><option value="metric" ${rule.source==='metric'?'selected':''}>Verified metric</option><option value="project" ${rule.source==='project'?'selected':''}>Project field</option></select></label>
      <label>Field / metric${subject}</label>
      <label>Operator<select data-operator>${OPERATORS.map(([v,n])=>`<option value="${v}" ${rule.operator===v?'selected':''}>${esc(n)}</option>`).join('')}</select></label>
      <label data-expected-wrap ${empty?'hidden':''}>Value<input data-expected value="${esc(rule.expected)}" placeholder="comparison value"></label>
      ${state.draft.rules.length>1?`<button type="button" class="btn cc-cond-remove-rule" data-remove-rule="${index}">Remove rule</button>`:''}
    </div>`;
  }
  function renderForm(){
    return `<form class="cc-cond-form" data-cc-cond-form>
      <div class="cc-cond-form-head"><div><strong>New condition</strong><small>Conditions read current Command Center data and only decide pass, block, or unavailable.</small></div><button class="btn btn-primary" type="submit">Save condition</button></div>
      <label>Name<input name="name" required maxlength="120" value="${esc(state.draft.name)}" placeholder="Only continue when revenue is at least 100"></label>
      <label>Project<select name="project_id" required>${state.projects.map(p=>`<option value="${esc(p.id)}" ${state.draft.project_id===p.id?'selected':''}>${esc(p.name||p.id)}</option>`).join('')}</select></label>
      <label>Match<select name="match_mode"><option value="all" ${state.draft.match_mode==='all'?'selected':''}>ALL rules</option><option value="any" ${state.draft.match_mode==='any'?'selected':''}>ANY rule</option></select></label>
      <datalist id="ccCondMetricKeys">${metricHints()}</datalist>
      <div class="cc-cond-rules">${state.draft.rules.map(ruleRow).join('')}</div>
      <button type="button" class="btn" data-add-rule ${state.draft.rules.length>=10?'disabled':''}>Add rule</button>
    </form>`;
  }
  function scheduleLinkControls(c){
    const available=state.schedules.filter(s=>s.project_id===c.project_id&&s.condition_id!==c.id&&s.status!=='archived');
    const linked=linkedSchedules(c.id);
    return `<div class="cc-cond-links"><strong>Scheduled triggers</strong>
      ${linked.length?linked.map(s=>`<div class="cc-cond-link-row"><span>${esc(s.name)} <small>${esc(s.status)}</small></span><button type="button" class="btn" data-unlink-schedule="${esc(s.id)}">Remove condition</button></div>`).join(''):'<p class="muted">No schedules use this condition yet.</p>'}
      ${available.length?`<div class="cc-cond-attach"><select data-attach-select><option value="">Choose schedule</option>${available.map(s=>`<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}</select><button type="button" class="btn btn-primary" data-attach-condition="${esc(c.id)}">Attach</button></div>`:''}
    </div>`;
  }
  function renderCondition(c){
    const open=state.openId===c.id,project=projectName(c.project_id),latest=latestEvaluation(c.id);
    return `<article class="cc-cond-card ${open?'open':''}" data-cc-cond-card="${esc(c.id)}">
      <button type="button" class="cc-cond-card-toggle" data-cc-cond-toggle="${esc(c.id)}" aria-expanded="${open}"><span><strong>${esc(c.name)}</strong><small>${esc(project)} · ${esc(c.match_mode.toUpperCase())}</small></span><span>${resultBadge(c.last_result)}<b>${open?'⌃':'›'}</b></span></button>
      ${open?`<div class="cc-cond-detail">
        <div class="cc-cond-rules-readonly">${(c.clauses||[]).map(r=>`<div>${esc(clauseSummary(r))}</div>`).join('')}</div>
        <dl><div><dt>Status</dt><dd>${esc(c.status)}</dd></div><div><dt>Last result</dt><dd>${esc(c.last_result)}</dd></div><div><dt>Last evaluated</dt><dd>${fmtDate(c.last_evaluated_at)}</dd></div><div><dt>Evaluations</dt><dd>${Number(c.evaluation_count||0)}</dd></div><div><dt>Latest evaluation</dt><dd>${latest?`${esc(latest.result_state)} · ${fmtDate(latest.evaluated_at)}`:'N/A'}</dd></div></dl>
        <p class="cc-cond-note">The evaluator only decides whether the condition is true. It does not send notifications, generate reports, or execute actions.</p>
        ${scheduleLinkControls(c)}
        <div class="cc-cond-actions"><button type="button" class="btn btn-primary" data-evaluate="${esc(c.id)}">Evaluate now</button>${c.status==='active'?`<button type="button" class="btn" data-status="paused" data-id="${esc(c.id)}">Pause</button>`:''}${c.status==='paused'?`<button type="button" class="btn btn-primary" data-status="active" data-id="${esc(c.id)}">Activate</button>`:''}${c.status!=='archived'?`<button type="button" class="btn" data-status="archived" data-id="${esc(c.id)}">Archive</button>`:`<button type="button" class="btn btn-primary" data-status="paused" data-id="${esc(c.id)}">Restore paused</button>`}<button type="button" class="btn cc-cond-danger" data-delete="${esc(c.id)}">Delete</button></div>
      </div>`:''}
    </article>`;
  }

  function bind(root){
    root.querySelectorAll('[data-source]').forEach(select=>select.addEventListener('change',()=>{readDraft(root);render();}));
    root.querySelectorAll('[data-operator]').forEach(select=>select.addEventListener('change',()=>{readDraft(root);render();}));
    root.querySelector('[data-add-rule]')?.addEventListener('click',()=>{readDraft(root);if(state.draft.rules.length<10)state.draft.rules.push({source:'metric',subject:'',operator:'eq',expected:''});render();});
    root.querySelectorAll('[data-remove-rule]').forEach(b=>b.addEventListener('click',()=>{readDraft(root);state.draft.rules.splice(Number(b.dataset.removeRule),1);if(!state.draft.rules.length)state.draft.rules.push({source:'metric',subject:'',operator:'eq',expected:''});render();}));
    root.querySelector('[data-cc-cond-form]')?.addEventListener('submit',async e=>{e.preventDefault();readDraft(root);const clauses=state.draft.rules.map(r=>r.source==='metric'?{source:r.source,key:r.subject,operator:r.operator,expected:r.expected}:{source:r.source,field:r.subject,operator:r.operator,expected:r.expected});try{state.message='Saving condition…';render();await createCondition({...state.draft,clauses});state.draft={name:'',project_id:state.projects[0]?.id||'',match_mode:'all',rules:[{source:'metric',subject:'',operator:'gte',expected:''}]};await load();}catch(error){state.message=error?.message||'Condition could not be saved.';render();}});
    root.querySelectorAll('[data-cc-cond-toggle]').forEach(b=>b.addEventListener('click',()=>toggleCondition(b.dataset.ccCondToggle,true)));
    root.querySelectorAll('[data-evaluate]').forEach(b=>b.addEventListener('click',async()=>{try{state.message='Evaluating condition…';render();const result=await evaluateNow(b.dataset.evaluate);state.message=`Condition result: ${result?.result_state||'unavailable'}`;render();}catch(error){state.message=error?.message||'Condition could not be evaluated.';render();}}));
    root.querySelectorAll('[data-status]').forEach(b=>b.addEventListener('click',async()=>{try{state.message='Saving…';render();await setStatus(b.dataset.id,b.dataset.status);}catch(error){state.message=error?.message||'Condition could not be updated.';render();}}));
    root.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('Delete this condition? Linked schedules will keep running without it.'))return;try{state.message='Deleting…';render();await removeCondition(b.dataset.delete);}catch(error){state.message=error?.message||'Condition could not be deleted.';render();}}));
    root.querySelectorAll('[data-attach-condition]').forEach(b=>b.addEventListener('click',async()=>{const select=b.closest('.cc-cond-attach')?.querySelector('[data-attach-select]');if(!select?.value)return;try{state.message='Attaching condition…';render();await linkSchedule(select.value,b.dataset.attachCondition);}catch(error){state.message=error?.message||'Condition could not be attached.';render();}}));
    root.querySelectorAll('[data-unlink-schedule]').forEach(b=>b.addEventListener('click',async()=>{try{state.message='Removing condition…';render();await linkSchedule(b.dataset.unlinkSchedule,null);}catch(error){state.message=error?.message||'Condition could not be removed from the schedule.';render();}}));
    root.querySelector('[data-refresh]')?.addEventListener('click',load);
  }
  function render(){
    const root=document.getElementById(MOUNT_ID);if(!root)return;const active=state.conditions.filter(c=>c.status==='active').length,passing=state.conditions.filter(c=>c.last_result==='true').length;
    root.innerHTML=`<section class="cc-cond"><div class="cc-cond-head"><div><span class="cc-cond-kicker">Automation · Phase 2</span><h4>Condition Evaluator</h4><p>Save owner-scoped rules against verified metrics or current project state, then decide whether a scheduled trigger passes.</p></div><span class="badge active">100% · Complete</span></div><div class="cc-cond-stats"><span><b>${state.conditions.length}</b> conditions</span><span><b>${active}</b> active</span><span><b>${passing}</b> currently true</span><button type="button" class="btn" data-refresh>Refresh</button></div>${state.message?`<div class="cc-cond-message">${esc(state.message)}</div>`:''}${state.loading?'<div class="cc-cond-loading">Loading Condition Evaluator…</div>':`${renderForm()}<div class="cc-cond-list">${state.conditions.length?state.conditions.map(renderCondition).join(''):'<div class="cc-cond-empty">No saved conditions yet. Add one when a scheduled trigger should depend on Command Center data.</div>'}</div>`}</section>`;bind(root);
  }
  function toggleCondition(id,push=true){if(state.openId===id){if(push&&history.state?.ccAutomationCondition===id){history.back();return;}state.openId=null;render();return;}state.openId=id;render();if(push)history.pushState({...history.state,ccAutomationCondition:id},'',location.href);}
  function mount(){if(!document.getElementById(MOUNT_ID))return;render();load();}
  window.addEventListener('popstate',e=>{if(state.openId&&e.state?.ccAutomationCondition!==state.openId){state.openId=null;render();}});
  window.addEventListener('command-center:brain-capability-open',e=>{if(e.detail?.name==='Automation')mount();});
  window.COMMAND_CENTER_AUTOMATION_CONDITION={load,createCondition,updateCondition,setStatus,removeCondition,evaluateNow,linkSchedule,normalizeCondition,normalizeClause,mount,state};
  if(document.getElementById(MOUNT_ID))mount();
})();