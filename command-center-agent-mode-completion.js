(() => {
  const mobileHref='./command-center-mobile-first.css?v=1';
  if(!document.querySelector('link[data-command-center-mobile-first]')){
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=mobileHref;
    link.dataset.commandCenterMobileFirst='1';
    document.head.appendChild(link);
  }
  let scheduled=false;
  function patch(){
    scheduled=false;
    const overview=document.querySelector('[data-brain-capability="Agent Mode"]');
    if(overview){const badge=overview.querySelector('.badge');if(badge)badge.textContent='100% · Complete';const spans=overview.querySelectorAll('.cc-brain-capability-foot > span');if(spans[1])spans[1].textContent='8 of 8 phases complete';}
    const detail=document.querySelector('[data-brain-capability-detail="Agent Mode"]');
    if(!detail)return;
    detail.querySelectorAll('.cc-brain-phase').forEach(row=>{row.classList.remove('planned','active');row.classList.add('complete');const bar=row.querySelector('.cc-brain-mini-track span');if(bar)bar.style.width='100%';const badge=row.querySelector('.badge');if(badge)badge.textContent='100% · Complete';});
    const pct=detail.querySelector('.cc-brain-capability-percent');if(pct)pct.textContent='100%';
    const kicker=detail.querySelector('.cc-brain-capability-kicker');if(kicker)kicker.textContent='8 of 8 phases complete';
    const current=detail.previousElementSibling;if(current?.matches?.('[data-cc-brain-current-toggle]')){const badge=current.querySelector('.badge');if(badge)badge.textContent='100% · Complete';const spans=current.querySelectorAll('.cc-brain-capability-foot > span');if(spans[1])spans[1].textContent='8 of 8 phases complete';}
    window.COMMAND_CENTER_AGENT_MODE?.refreshBrain?.();
    window.COMMAND_CENTER_AGENT_RUNNER_STATUS?.refresh?.();
    window.COMMAND_CENTER_AGENT_DEVICE_GUIDANCE?.refresh?.();
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(patch);}
  window.addEventListener('command-center:brain-capability-open',e=>{if(e.detail?.name==='Agent Mode')schedule();});
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',schedule,{once:true});schedule();
})();
