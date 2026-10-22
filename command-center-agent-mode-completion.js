(() => {
  let scheduled=false;

  function patch(){
    scheduled=false;

    const overview=document.querySelector('[data-brain-capability="Agent Mode"]');
    if(overview){
      const badge=overview.querySelector('.badge');
      if(badge) badge.textContent='100% · Complete';
      const spans=overview.querySelectorAll('.cc-brain-capability-foot > span');
      if(spans[1]) spans[1].textContent='8 of 8 phases complete';
    }

    const detail=document.querySelector('[data-brain-capability-detail="Agent Mode"]');
    if(detail){
      detail.querySelectorAll('.cc-brain-phase').forEach(row=>{
        row.classList.remove('planned','active');
        row.classList.add('complete');
        const bar=row.querySelector('.cc-brain-mini-track span');
        if(bar) bar.style.width='100%';
        const badge=row.querySelector('.badge');
        if(badge) badge.textContent='100% · Complete';
      });
      const pct=detail.querySelector('.cc-brain-capability-percent');
      if(pct) pct.textContent='100%';
      const kicker=detail.querySelector('.cc-brain-capability-kicker');
      if(kicker) kicker.textContent='8 of 8 phases complete';
      const current=detail.previousElementSibling;
      if(current?.matches?.('[data-cc-brain-current-toggle]')){
        const badge=current.querySelector('.badge');
        if(badge) badge.textContent='100% · Complete';
        const spans=current.querySelectorAll('.cc-brain-capability-foot > span');
        if(spans[1]) spans[1].textContent='8 of 8 phases complete';
      }
    }

    window.COMMAND_CENTER_AGENT_MODE?.refreshBrain?.();
    window.COMMAND_CENTER_AGENT_RUNNER_STATUS?.refresh?.();
    window.COMMAND_CENTER_AGENT_DEVICE_GUIDANCE?.refresh?.();
    window.COMMAND_CENTER_AGENT_AUTO_CONTROL?.refresh?.();
    window.COMMAND_CENTER_AGENT_HOME?.refresh?.();
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(patch);
  }

  window.addEventListener('command-center:brain-open',schedule);
  window.addEventListener('command-center:brain-capability-open',e=>{
    if(e.detail?.name==='Agent Mode') schedule();
  });
  window.addEventListener('command-center:full-interface-ready',schedule);
  window.addEventListener('visibilitychange',()=>{
    if(!document.hidden) schedule();
  });
  window.addEventListener('load',schedule,{once:true});
  schedule();
})();
