(() => {
  const styles=[
    ['./command-center-mobile-first.css?v=1','commandCenterMobileFirst'],
    ['./command-center-artwork-polish.css?v=1','commandCenterArtworkPolish'],
    ['./command-center-approved-ui.css?v=2','commandCenterApprovedUi']
  ];
  styles.forEach(([href,key])=>{
    const selector=`link[data-${key.replace(/[A-Z]/g,m=>`-${m.toLowerCase()}`)}]`;
    if(document.querySelector(selector)) return;
    const link=document.createElement('link');
    link.rel='stylesheet';
    link.href=href;
    link.dataset[key]='1';
    document.head.appendChild(link);
  });
  const scripts=[
    ['./command-center-approved-ui.js?v=2','commandCenterApprovedUi'],
    ['./command-center-precise-progress.js?v=2','commandCenterPreciseProgress'],
    ['./command-center-approved-nav.js?v=2','commandCenterApprovedNav']
  ];
  scripts.forEach(([src,key])=>{
    const selector=`script[data-${key.replace(/[A-Z]/g,m=>`-${m.toLowerCase()}`)}]`;
    if(document.querySelector(selector)) return;
    const script=document.createElement('script');
    script.src=src;
    script.async=false;
    script.dataset[key]='1';
    document.body.appendChild(script);
  });

  let scheduled=false;
  function patch(){
    scheduled=false;
    const overview=document.querySelector('[data-brain-capability="Agent Mode"]');
    if(overview){const badge=overview.querySelector('.badge');if(badge)badge.textContent='100% · Complete';const spans=overview.querySelectorAll('.cc-brain-capability-foot > span');if(spans[1])spans[1].textContent='8 of 8 phases complete';}
    const detail=document.querySelector('[data-brain-capability-detail="Agent Mode"]');
    if(detail){
      detail.querySelectorAll('.cc-brain-phase').forEach(row=>{row.classList.remove('planned','active');row.classList.add('complete');const bar=row.querySelector('.cc-brain-mini-track span');if(bar)bar.style.width='100%';const badge=row.querySelector('.badge');if(badge)badge.textContent='100% · Complete';});
      const pct=detail.querySelector('.cc-brain-capability-percent');if(pct)pct.textContent='100%';
      const kicker=detail.querySelector('.cc-brain-capability-kicker');if(kicker)kicker.textContent='8 of 8 phases complete';
      const current=detail.previousElementSibling;if(current?.matches?.('[data-cc-brain-current-toggle]')){const badge=current.querySelector('.badge');if(badge)badge.textContent='100% · Complete';const spans=current.querySelectorAll('.cc-brain-capability-foot > span');if(spans[1])spans[1].textContent='8 of 8 phases complete';}
    }
    window.COMMAND_CENTER_AGENT_MODE?.refreshBrain?.();
    window.COMMAND_CENTER_AGENT_RUNNER_STATUS?.refresh?.();
    window.COMMAND_CENTER_AGENT_DEVICE_GUIDANCE?.refresh?.();
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(patch);}
  window.addEventListener('command-center:brain-open',schedule);
  window.addEventListener('command-center:brain-capability-open',e=>{if(e.detail?.name==='Agent Mode')schedule();});
  window.addEventListener('load',schedule,{once:true});

  const retireLegacyControllers=()=>{
    if(!window.COMMAND_CENTER_APPROVED_UI)return setTimeout(retireLegacyControllers,80);
    window.COMMAND_CENTER_AGENT_HOME?.destroy?.();
    window.COMMAND_CENTER_AGENT_MODE?.destroy?.();
  };
  setTimeout(retireLegacyControllers,120);
  schedule();
})();