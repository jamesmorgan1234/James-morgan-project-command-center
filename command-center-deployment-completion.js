(() => {
  let scheduled=false;
  function patch(){
    scheduled=false;
    const overview=document.querySelector('[data-brain-capability="Deployment"]');
    if(overview){const badge=overview.querySelector('.badge');if(badge)badge.textContent='100% · Complete';const spans=overview.querySelectorAll('.cc-brain-capability-foot > span');if(spans[1])spans[1].textContent='7 of 7 phases complete';}
    const detail=document.querySelector('[data-brain-capability-detail="Deployment"]');
    if(!detail)return;
    detail.querySelectorAll('.cc-brain-phase').forEach(row=>{row.classList.remove('planned','active');row.classList.add('complete');const bar=row.querySelector('.cc-brain-mini-track span');if(bar)bar.style.width='100%';const badge=row.querySelector('.badge');if(badge)badge.textContent='100% · Complete';});
    const pct=detail.querySelector('.cc-brain-capability-percent');if(pct)pct.textContent='100%';
    const kicker=detail.querySelector('.cc-brain-capability-kicker');if(kicker)kicker.textContent='7 of 7 phases complete';
    const current=detail.previousElementSibling;if(current?.matches?.('[data-cc-brain-current-toggle]')){const badge=current.querySelector('.badge');if(badge)badge.textContent='100% · Complete';const spans=current.querySelectorAll('.cc-brain-capability-foot > span');if(spans[1])spans[1].textContent='7 of 7 phases complete';}
    let mount=document.getElementById('ccDeploymentMount'),created=false;if(!mount){mount=document.createElement('div');mount.id='ccDeploymentMount';detail.appendChild(mount);created=true;}if(created)window.COMMAND_CENTER_DEPLOYMENT?.mount?.();
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(patch);}
  window.addEventListener('command-center:brain-capability-open',e=>{if(e.detail?.name==='Deployment')schedule();});
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',schedule,{once:true});schedule();
})();
