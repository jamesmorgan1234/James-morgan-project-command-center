(() => {
  if(window.COMMAND_CENTER_AGENT_DEVICE_GUIDANCE)return;
  const ACTIVE=new Set(['draft','active','paused','blocked','needs_user_action','partially_completed']);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const labelFor=e=>e==='pc'?'PC REQUIRED':e==='phone'?'PHONE REQUIRED':e==='local_browser'?'LOCAL BROWSER REQUIRED':e==='any_device'?'USER ACTION REQUIRED':'USER ACTION REQUIRED';
  const detailFor=e=>e==='pc'?'This step must be completed from your computer.':e==='phone'?'This step must be completed from your phone.':e==='local_browser'?'This step needs your signed-in browser on your computer.':'This step needs your action, but either device can be used.';

  function requiredStep(st){
    const rows=st?.steps||[];
    const current=rows.find(x=>x.id===st?.session?.current_step_id);
    if(current?.route==='user_only'||current?.status==='needs_user_action')return current;
    return rows.find(x=>x.status==='needs_user_action')||null;
  }
  function banner(step){
    if(!step)return'';
    const env=String(step.required_environment||step.metadata?.required_environment||'any_device').toLowerCase();
    const instructions=step.user_action_instructions||step.metadata?.user_action_instructions||step.details||'Complete the required user-only action, then return to Command Center.';
    const resume=step.resume_after_user_action ?? step.metadata?.resume_after_user_action ?? true;
    return `<aside class="cc-agent-device-banner ${env==='pc'||env==='local_browser'?'pc':''}" data-agent-device-banner><div class="cc-agent-device-title">${esc(labelFor(env))}</div><div class="cc-agent-device-reason">${esc(detailFor(env))}</div><div class="cc-agent-device-instructions">${esc(instructions)}</div><div class="cc-agent-device-resume">${resume?'Agent Mode can resume from this checkpoint after the requirement is satisfied.':'Return to Command Center after completing this step; further authorization may still be required.'}</div></aside>`;
  }
  function mountBanner(host,st){
    if(!host)return;
    host.querySelector('[data-agent-device-banner]')?.remove();
    const step=requiredStep(st);if(!step)return;
    const html=banner(step);if(!html)return;
    const holder=document.createElement('div');holder.innerHTML=html;
    const anchor=host.querySelector('.cc-agent-kicker')?.parentElement===host?host.querySelector('.cc-agent-kicker'):host.firstElementChild;
    if(anchor)anchor.insertAdjacentElement('afterend',holder.firstElementChild);else host.prepend(holder.firstElementChild);
  }
  async function activeStatus(projectId=null){
    const api=window.COMMAND_CENTER_AGENT_MODE;if(!api?.listSessions||!api?.status)return null;
    const sessions=await api.listSessions(projectId);
    const chosen=sessions.find(x=>ACTIVE.has(x.status))||sessions[0];
    return chosen?await api.status(chosen.id):null;
  }
  async function refresh(){
    try{
      const api=window.COMMAND_CENTER_AGENT_MODE;if(!api)return;
      const projectPanel=document.getElementById('ccAgentProjectPanel');
      if(projectPanel){const projectId=projectPanel.dataset.projectId||document.querySelector('#projectGrid .project-card.selected')?.dataset.open||null;mountBanner(projectPanel,await activeStatus(projectId));}
      const brain=document.getElementById('ccAgentModeMount');if(brain)mountBanner(brain,await activeStatus(null));
    }catch(error){console.warn('Agent device guidance refresh failed',error);}
  }
  const observer=new MutationObserver(()=>{clearTimeout(observer._t);observer._t=setTimeout(refresh,80);});
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  window.addEventListener('load',()=>setTimeout(refresh,900),{once:true});
  const timer=setInterval(()=>{if(!document.hidden&&(document.getElementById('ccAgentProjectPanel')||document.getElementById('ccAgentModeMount')))refresh();},20000);
  window.COMMAND_CENTER_AGENT_DEVICE_GUIDANCE={refresh,destroy(){clearInterval(timer);observer.disconnect();}};
})();
