(() => {
  if(window.COMMAND_CENTER_AGENT_RUNNER_STATUS)return;
  const client=()=>window.COMMAND_CENTER_SUPABASE||null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  let timer=null,busy=false;
  async function toolHealth(){
    const c=client();if(!c)return[];
    const {data:{session},error}=await c.auth.getSession();if(error||!session?.user)return[];
    const gate=await c.rpc('is_command_center_authorized');if(gate.error||!gate.data)return[];
    const res=await c.rpc('command_center_agent_tool_health');if(res.error)throw res.error;return res.data||[];
  }
  function row(rows,key){return rows.find(x=>x.capability_key===key)||null;}
  function summary(r){
    if(!r)return {label:'Background runner N/A',detail:'No verified normal-chat background runner heartbeat is available yet.',kind:'unknown'};
    const meta=r.metadata||{};
    if(r.availability==='available'){
      const cadence=meta.cadence||'hourly';
      const last=r.last_success_at?new Date(r.last_success_at).toLocaleString():'awaiting first run';
      return {label:'Background runner active',detail:`${cadence} · last success ${last}`,kind:'ok'};
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
    host.querySelectorAll('.cc-agent-bridge-note').forEach(n=>{if(n===box)return;if(/Execution bridge:\s*N\/A/i.test(n.textContent||'')){n.textContent=s.kind==='ok'?'Run is durably scoped. The background normal-chat runner will prepare and execute eligible steps on its polling cadence.':'Run is durably scoped. Background execution is not yet verified; use the runner status above.';}});
  }
  async function refresh(){if(busy)return;busy=true;try{const rows=await toolHealth(),s=summary(row(rows,'background_runner'));renderInto(document.getElementById('ccAgentProjectPanel'),s);renderInto(document.getElementById('ccAgentModeMount'),s);}catch(error){console.warn('Agent runner status refresh failed',error);}finally{busy=false;}}
  const observer=new MutationObserver(()=>{clearTimeout(observer._t);observer._t=setTimeout(refresh,100);});observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  window.addEventListener('load',()=>setTimeout(refresh,1000),{once:true});
  timer=setInterval(()=>{if(!document.hidden&&(document.getElementById('ccAgentProjectPanel')||document.getElementById('ccAgentModeMount')))refresh();},30000);
  window.COMMAND_CENTER_AGENT_RUNNER_STATUS={refresh,destroy(){clearInterval(timer);observer.disconnect();}};
})();
