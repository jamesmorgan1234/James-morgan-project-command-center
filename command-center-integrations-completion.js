(() => {
  let scheduled=false;
  function patch(){
    scheduled=false;
    const overview=document.querySelector('[data-brain-capability="Integrations"]');
    if(overview){const badge=overview.querySelector('.badge');if(badge)badge.textContent='100% · Complete';const spans=overview.querySelectorAll('.cc-brain-capability-foot > span');if(spans[1])spans[1].textContent='8 of 8 phases complete';}
    const detail=document.querySelector('[data-brain-capability-detail="Integrations"]');
    if(!detail)return;
    detail.querySelectorAll('.cc-brain-phase').forEach(row=>{row.classList.remove('planned','active');row.classList.add('complete');const bar=row.querySelector('.cc-brain-mini-track span');if(bar)bar.style.width='100%';const badge=row.querySelector('.badge');if(badge)badge.textContent='100% · Complete';});
    const pct=detail.querySelector('.cc-brain-capability-percent');if(pct)pct.textContent='100%';
    const kicker=detail.querySelector('.cc-brain-capability-kicker');if(kicker)kicker.textContent='8 of 8 phases complete';
    const current=detail.previousElementSibling;if(current?.matches?.('[data-cc-brain-current-toggle]')){const badge=current.querySelector('.badge');if(badge)badge.textContent='100% · Complete';const spans=current.querySelectorAll('.cc-brain-capability-foot > span');if(spans[1])spans[1].textContent='8 of 8 phases complete';}
    let mount=document.getElementById('ccIntegrationsMount'),created=false;if(!mount){mount=document.createElement('div');mount.id='ccIntegrationsMount';detail.appendChild(mount);created=true;}if(created)window.COMMAND_CENTER_INTEGRATIONS?.mount?.();
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(patch);}
  window.addEventListener('command-center:brain-capability-open',e=>{if(e.detail?.name==='Integrations')schedule();});
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('load',schedule,{once:true});schedule();
})();
