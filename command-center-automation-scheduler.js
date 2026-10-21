(() => {
  const MOUNT_ID='ccAutomationSchedulerMount';
  const WEEKDAYS=[['0','Sun'],['1','Mon'],['2','Tue'],['3','Wed'],['4','Thu'],['5','Fri'],['6','Sat']];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmtDate=v=>{if(!v)return 'N/A';const d=new Date(v);return Number.isNaN(d.getTime())?'N/A':d.toLocaleString();};
  const browserTimezone=()=>{try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';}catch{return 'UTC';}};
  const state={schedules:[],dispatches:[],projects:[],openId:null,loading:false,message:''};

  function client(){return window.COMMAND_CENTER_SUPABASE||null;}
  async function ownerId(){const c=client();if(!c)throw new Error('Secure Command Center connection is unavailable.');const {data,error}=await c.auth.getUser();if(error||!data?.user?.id)throw error||new Error('Sign in to use Automation.');return data.user.id;}
  function normalizeWeekdays(values){return [...new Set((values||[]).map(Number).filter(n=>Number.isInteger(n)&&n>=0&&n<=6))].sort((a,b)=>a-b);}
  function normalizeSchedule(input={}){
    const kind=String(input.schedule_kind||'once');
    if(!['once','interval','daily','weekly'].includes(kind))throw new Error('Choose a valid schedule type.');
    const name=String(input.name||'').trim(),job_label=String(input.job_label||'').trim();
    if(!name)throw new Error('Schedule name is required.');if(!job_label)throw new Error('Choose what Command Center should schedule.');
    const out={name,job_label,schedule_kind:kind,project_id:input.project_id||null,timezone:String(input.timezone||browserTimezone()||'UTC'),schedule_at:null,interval_minutes:null,local_time:null,weekdays:[],max_runs:null,metadata:{scheduler_phase:1}};
    if(kind==='once'){
      if(!input.schedule_at)throw new Error('Choose the date and time.');const d=new Date(input.schedule_at);if(Number.isNaN(d.getTime()))throw new Error('Choose a valid date and time.');out.schedule_at=d.toISOString();
    }else if(kind==='interval'){
      const mins=Number(input.interval_minutes);if(!Number.isInteger(mins)||mins<5||mins>525600)throw new Error('Interval must be between 5 and 525600 minutes.');out.interval_minutes=mins;
    }else{
      const time=String(input.local_time||'').trim();if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))throw new Error('Choose a valid local time.');out.local_time=`${time}:00`;
      if(kind==='weekly'){out.weekdays=normalizeWeekdays(input.weekdays);if(!out.weekdays.length)throw new Error('Choose at least one weekday.');}
    }
    if(input.max_runs!==undefined&&input.max_runs!==null&&String(input.max_runs).trim()!==''){const max=Number(input.max_runs);if(!Number.isInteger(max)||max<1)throw new Error('Maximum runs must be a whole number greater than zero.');out.max_runs=max;}
    return out;
  }
  function scheduleSummary(s){
    if(s.schedule_kind==='once')return `Once · ${fmtDate(s.schedule_at)}`;
    if(s.schedule_kind==='interval')return `Every ${s.interval_minutes} minute${Number(s.interval_minutes)===1?'':'s'}`;
    if(s.schedule_kind==='daily')return `Daily · ${String(s.local_time||'').slice(0,5)} · ${s.timezone}`;
    const days=(s.weekdays||[]).map(n=>WEEKDAYS.find(([v])=>Number(v)===Number(n))?.[1]).filter(Boolean).join(', ');
    return `${days||'Weekly'} · ${String(s.local_time||'').slice(0,5)} · ${s.timezone}`;
  }
  function statusBadge(s){return `<span class="cc-auto-status ${esc(s.status)}">${esc(s.status)}</span>`;}
  function queuedCount(id){return state.dispatches.filter(d=>d.schedule_id===id&&d.status==='queued').length;}

  async function load(){
    const c=client();if(!c)return;state.loading=true;render();
    try{
      await ownerId();
      const [schedules,dispatches,projects]=await Promise.all([
        c.from('automation_schedules').select('*').order('created_at',{ascending:false}),
        c.from('automation_dispatch_queue').select('id,schedule_id,status,scheduled_for,created_at').order('created_at',{ascending:false}).limit(100),
        c.from('projects').select('id,name').order('name',{ascending:true})
      ]);
      if(schedules.error)throw schedules.error;if(dispatches.error)throw dispatches.error;if(projects.error)throw projects.error;
      state.schedules=schedules.data||[];state.dispatches=dispatches.data||[];state.projects=projects.data||[];state.message='';
    }catch(error){state.message=error?.message||'Scheduler data could not be loaded.';}finally{state.loading=false;render();}
  }
  async function createSchedule(input){
    const c=client(),owner_id=await ownerId(),payload=normalizeSchedule(input);const {data,error}=await c.from('automation_schedules').insert({...payload,owner_id,status:'active'}).select('*').single();if(error)throw error;await load();return data;
  }
  async function updateSchedule(id,patch){const c=client();await ownerId();const {data,error}=await c.from('automation_schedules').update(patch).eq('id',id).select('*').single();if(error)throw error;await load();return data;}
  async function setStatus(id,status){if(!['active','paused','archived'].includes(status))throw new Error('Unsupported scheduler status.');return updateSchedule(id,{status});}
  async function removeSchedule(id){const c=client();await ownerId();const {error}=await c.from('automation_schedules').delete().eq('id',id);if(error)throw error;if(state.openId===id)state.openId=null;await load();}

  function renderForm(){
    const projectOptions=state.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.name||p.id)}</option>`).join('');
    return `<form class="cc-auto-form" data-cc-auto-form>
      <div class="cc-auto-form-head"><div><strong>New schedule</strong><small>Server-side scheduling continues even when Command Center is closed.</small></div><button class="btn btn-primary" type="submit">Create</button></div>
      <label>Name<input name="name" required maxlength="120" placeholder="Daily priorities review"></label>
      <label>Command Center job<input name="job_label" required maxlength="240" placeholder="Review today's priorities"></label>
      <label>Project<select name="project_id"><option value="">No project</option>${projectOptions}</select></label>
      <label>Schedule<select name="schedule_kind" data-cc-auto-kind><option value="once">One time</option><option value="interval">Recurring interval</option><option value="daily">Daily</option><option value="weekly">Weekly</option></select></label>
      <div data-cc-auto-fields="once"><label>Date & time<input name="schedule_at" type="datetime-local"></label></div>
      <div data-cc-auto-fields="interval" hidden><label>Every how many minutes?<input name="interval_minutes" type="number" min="5" max="525600" value="60"></label></div>
      <div data-cc-auto-fields="daily" hidden><label>Local time<input name="local_time" type="time" value="08:00"></label></div>
      <div data-cc-auto-fields="weekly" hidden><label>Local time<input name="local_time_weekly" type="time" value="08:00"></label><div class="cc-auto-weekdays">${WEEKDAYS.map(([v,n])=>`<label><input type="checkbox" name="weekday" value="${v}">${n}</label>`).join('')}</div></div>
      <label>Maximum runs <span class="muted">(optional)</span><input name="max_runs" type="number" min="1" placeholder="No limit"></label>
      <div class="cc-auto-timezone">Timezone: <strong>${esc(browserTimezone())}</strong></div>
    </form>`;
  }
  function renderSchedule(s){
    const open=state.openId===s.id,queued=queuedCount(s.id),project=state.projects.find(p=>p.id===s.project_id);
    return `<article class="cc-auto-card ${open?'open':''}" data-cc-auto-card="${esc(s.id)}">
      <button type="button" class="cc-auto-card-toggle" data-cc-auto-toggle="${esc(s.id)}" aria-expanded="${open}"><span><strong>${esc(s.name)}</strong><small>${esc(scheduleSummary(s))}</small></span><span>${statusBadge(s)}<b>${open?'⌃':'›'}</b></span></button>
      ${open?`<div class="cc-auto-detail">
        <dl><div><dt>Job</dt><dd>${esc(s.job_label)}</dd></div><div><dt>Project</dt><dd>${esc(project?.name||'None')}</dd></div><div><dt>Next trigger</dt><dd>${fmtDate(s.next_run_at)}</dd></div><div><dt>Last trigger</dt><dd>${fmtDate(s.last_triggered_at)}</dd></div><div><dt>Triggers released</dt><dd>${Number(s.trigger_count||0)}</dd></div><div><dt>Queued triggers</dt><dd>${queued}</dd></div></dl>
        <p class="cc-auto-note">Scheduler Engine releases a verified due trigger. Later Automation phases can evaluate conditions, notify you, generate reports, or execute separately authorized actions.</p>
        <div class="cc-auto-actions">${s.status==='active'?`<button type="button" class="btn" data-cc-auto-status="paused" data-id="${esc(s.id)}">Pause</button>`:''}${['paused','completed'].includes(s.status)?`<button type="button" class="btn btn-primary" data-cc-auto-status="active" data-id="${esc(s.id)}">Activate</button>`:''}${s.status!=='archived'?`<button type="button" class="btn" data-cc-auto-status="archived" data-id="${esc(s.id)}">Archive</button>`:`<button type="button" class="btn btn-primary" data-cc-auto-status="paused" data-id="${esc(s.id)}">Restore paused</button>`}<button type="button" class="btn cc-auto-danger" data-cc-auto-delete="${esc(s.id)}">Delete</button></div>
      </div>`:''}
    </article>`;
  }
  function bind(root){
    const kind=root.querySelector('[data-cc-auto-kind]');const sync=()=>{root.querySelectorAll('[data-cc-auto-fields]').forEach(el=>el.hidden=el.dataset.ccAutoFields!==kind?.value);};kind?.addEventListener('change',sync);sync();
    root.querySelector('[data-cc-auto-form]')?.addEventListener('submit',async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),k=fd.get('schedule_kind');const input={name:fd.get('name'),job_label:fd.get('job_label'),project_id:fd.get('project_id')||null,schedule_kind:k,schedule_at:fd.get('schedule_at'),interval_minutes:fd.get('interval_minutes'),local_time:k==='weekly'?fd.get('local_time_weekly'):fd.get('local_time'),weekdays:fd.getAll('weekday'),max_runs:fd.get('max_runs'),timezone:browserTimezone()};try{state.message='Creating schedule…';render();await createSchedule(input);}catch(error){state.message=error?.message||'Schedule could not be created.';render();}});
    root.querySelectorAll('[data-cc-auto-toggle]').forEach(b=>b.addEventListener('click',()=>toggleSchedule(b.dataset.ccAutoToggle,true)));
    root.querySelectorAll('[data-cc-auto-status]').forEach(b=>b.addEventListener('click',async()=>{try{state.message='Saving…';render();await setStatus(b.dataset.id,b.dataset.ccAutoStatus);}catch(error){state.message=error?.message||'Schedule could not be updated.';render();}}));
    root.querySelectorAll('[data-cc-auto-delete]').forEach(b=>b.addEventListener('click',async()=>{if(!confirm('Delete this schedule and its queued trigger records?'))return;try{state.message='Deleting…';render();await removeSchedule(b.dataset.ccAutoDelete);}catch(error){state.message=error?.message||'Schedule could not be deleted.';render();}}));
    root.querySelector('[data-cc-auto-refresh]')?.addEventListener('click',load);
  }
  function render(){
    const root=document.getElementById(MOUNT_ID);if(!root)return;const active=state.schedules.filter(s=>s.status==='active').length,queued=state.dispatches.filter(d=>d.status==='queued').length;
    root.innerHTML=`<section class="cc-auto-scheduler"><div class="cc-auto-head"><div><span class="cc-auto-kicker">Automation · Phase 1</span><h4>Scheduler Engine</h4><p>Schedule a Command Center job for a date, time, interval, daily time, or selected weekdays.</p></div><span class="badge active">100% · Complete</span></div><div class="cc-auto-stats"><span><b>${state.schedules.length}</b> schedules</span><span><b>${active}</b> active</span><span><b>${queued}</b> queued triggers</span><button type="button" class="btn" data-cc-auto-refresh>Refresh</button></div>${state.message?`<div class="cc-auto-message">${esc(state.message)}</div>`:''}${state.loading?'<div class="cc-auto-loading">Loading Scheduler Engine…</div>':`${renderForm()}<div class="cc-auto-list">${state.schedules.length?state.schedules.map(renderSchedule).join(''):'<div class="cc-auto-empty">No schedules yet. Create one above when you are ready to automate a Command Center job.</div>'}</div>`}</section>`;bind(root);
  }
  function toggleSchedule(id,push=true){if(state.openId===id){if(push&&history.state?.ccAutomationSchedule===id){history.back();return;}state.openId=null;render();return;}state.openId=id;render();if(push)history.pushState({...history.state,ccAutomationSchedule:id},'',location.href);}
  function mount(){if(!document.getElementById(MOUNT_ID))return;render();load();}
  window.addEventListener('popstate',e=>{if(state.openId&&e.state?.ccAutomationSchedule!==state.openId){state.openId=null;render();}});
  window.addEventListener('command-center:brain-capability-open',e=>{if(e.detail?.name==='Automation')mount();});
  window.COMMAND_CENTER_AUTOMATION_SCHEDULER={load,createSchedule,updateSchedule,setStatus,removeSchedule,normalizeSchedule,normalizeWeekdays,scheduleSummary,mount,state};
  if(document.getElementById(MOUNT_ID))mount();
})();