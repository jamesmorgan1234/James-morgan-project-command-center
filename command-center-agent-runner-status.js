(() => {
  if(window.COMMAND_CENTER_AGENT_RUNNER_STATUS)return;
  const client=()=>window.COMMAND_CENTER_SUPABASE||null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#039;'}[c]));
  let timer=null,busy=false;
  async function context(){
    const c=client();if(!c)return {rows:[],auto:null};
    const {data:{session},error}=await c.auth.getSession();if(error||!session?.user)return {rows:[],auto:null};
    const gate=await c.rpc('is_command_center_authorized');if(gate.error||!gate.data)return {rows:[],auto:null};
    const [health,auto]=await Promise.all([
      c.rpc('command_center_agent_tool_health'),
      c.rpc('command_center_agent_service_get_auto',{p_owner_id:session.user.id})
    ]);
    if(health.error)throw health.error;
    return {rows:health.data||[],auto:auto.error?null:!!auto.data};
  }
  function row(rows,key){return rows.find(x=>x.capability_key===key)||null;}
  function summary(r,auto){
    if(!r)return {label:'Background runner N/A',detail:'No verified normal-chat background runner heartbeat is available yet.',kind:'unknown'};
    const meta=r.metadata||{};
    if(r.availability==='available'){
      const cadence=meta.cadence||'hourly';
      const last=r.last_success_at?new Date(r.last_success_at).toLocaleString():'awaiting first run';
      if(auto===false)return {label:'Background runner ready · AUTO OFF',detail:`${cadence} heartbeat · Agent execution disabled by owner · last success ${last}`,kind:'off'};
      if(auto===true)return {label:'Background runner active · AUTO ON',detail:`${cadence} · eligible Agent execution allowed · last success ${last}`,kind:'ok'};
      return {label:'Background runner ready · AUTO N/A',detail:`${cadence} · owner AUTO state could not be verified · last success ${last}`,kind:'warn'};
    }
    if(r.availability==='degraded')return {label:'Background runner degraded',detail:r.error_class||r.approved_fallback||'Fallback routing is active.',kind:'warn'};
    return {label:'Background runner unavailable',detail:r.error_class||r.approved_fallback||'No verified execution path is active.',kind:'bad'};
  }
  function renderInto(host,s){
    if(!host)return;
    let box=host.querySelector('[data-agent-runner-status]');
    if(!box){box=document.createElement('div');box.dataset.agentRunnerStatus='1';box.className='cc-agent-bridge-note';const kicker=host.querySelector('.cc-agent-kicker');if(kicker)kicker.insertAdjacentElement('afterend',box);else host.prepend(box);}
    box.innerHTML=`<strong>${esc(s.label)}</strong><br><span>${esc(s.detail)}</span>`;
    box.dataset.state=s.kind;
    host.querySelectorAll('.cc-agent-bridge-note').forEach(n=>{if(n===box)return;if(/Execution bridge:\s*N\/A/i.test(n.textContent||'')){n.textContent=s.kind==='ok'?'Run is durably scoped. The background normal-chat runner may prepare and execute eligible steps while AUTO is ON.':s.kind==='off'?'Run is durably scoped. AUTO is OFF, so background Agent execution is stopped.':'Run is durably scoped. Background execution is not currently authorized or verified; use the runner status above.';}});
  }
  async function refresh(){if(busy)return;busy=true;try{const ctx=await context(),s=summary(row(ctx.rows,'background_runner'),ctx.auto);renderInto(document.getElementById('ccAgentProjectPanel'),s);renderInto(document.getElementById('ccAgentModeMount'),s);}catch(error){console.warn('Agent runner status refresh failed',error);}finally{busy=false;}}
  const observer=new MutationObserver(()=>{clearTimeout(observer._t);observer._t=setTimeout(refresh,100);});observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  window.addEventListener('load',()=>setTimeout(refresh,1000),{once:true});
  timer=setInterval(()=>{if(!document.hidden&&(document.getElementById('ccAgentProjectPanel')||document.getElementById('ccAgentModeMount')))refresh();},30000);
  window.COMMAND_CENTER_AGENT_RUNNER_STATUS={refresh,destroy(){clearInterval(timer);observer.disconnect();}};
})();