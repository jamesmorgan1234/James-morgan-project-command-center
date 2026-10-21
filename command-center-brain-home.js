(() => {
  const CAPABILITIES = [
    ['Project Brain','Durable Memory → Brainstorm Workspace → Context Builder → Task Queue / Planner → ChatGPT Handoff Loop.','◉'],
    ['Automation','Checks, alerts and scheduled jobs.','↻'],
    ['Integrations','Connected services and data sources.','⌁'],
    ['Analytics','Verified performance, progress and operational reporting.','▥'],
    ['Security','Permissions, safeguards and protected execution controls.','⬡'],
    ['Deployment','Release, hosting, update and rollback controls.','▲'],
    ['Agent Mode','Verified autonomous execution after prerequisite capabilities are complete.','✦']
  ];
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  let brainOpen=false;
  let restore=null;

  function isHomeOverview(){
    const project=$('projectView');
    const revenue=$('revenueView');
    return !brainOpen && (!project || project.hidden) && (!revenue || revenue.hidden);
  }

  function ensureHomeButton(){
    const stats=$('stats');
    if(!stats) return;
    let button=$('ccBrainHomeButton');
    if(!button){
      button=document.createElement('button');
      button.id='ccBrainHomeButton';
      button.type='button';
      button.className='stat stat-button cc-brain-home-button';
      button.setAttribute('aria-label','Open Command Center Brain roadmap');
      button.innerHTML='<span class="cc-brain-home-icon" aria-hidden="true"><span><svg viewBox="0 0 48 48"><path d="M12 39c7-3 7-9 9-15s4-11 15-15" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M18 37l-4 3 5 1M31 11l5-3-1 5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 31l3-2M27 23l3-2M31 16l3-2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg></span></span><div class="value">Command Center Brain</div>';
      button.addEventListener('click',()=>openBrain(true));
    }
    button.style.setProperty('order','40','important');
    const earning=stats.querySelector('.stat-button[data-view="earning"]');
    if(earning && button.nextElementSibling!==earning) stats.insertBefore(button,earning);
    else if(!button.isConnected) stats.appendChild(button);
    button.hidden=!isHomeOverview();
  }

  function renderCapability([name,description,symbol]){
    return `<article class="cc-brain-capability"><span class="cc-cap-icon">${esc(symbol)}</span><strong>${esc(name)}</strong><small>${esc(description)}</small><span class="badge planning">0% · Planned</span></article>`;
  }

  function openBrain(pushHistory){
    if(brainOpen) return;
    const shell=$('dashboardViewShell');
    const stats=$('stats');
    if(!shell||!stats) return;
    const home=$('homeView');
    const project=$('projectView');
    const revenue=$('revenueView');
    const title=$('viewTitle');
    const description=$('viewDescription');
    restore={
      shellHidden:shell.hidden,
      statsHidden:stats.hidden,
      homeHidden:home?.hidden,
      projectHidden:project?.hidden,
      revenueHidden:revenue?.hidden,
      title:title?.textContent||'',
      description:description?.textContent||''
    };
    brainOpen=true;
    stats.hidden=true;
    shell.hidden=false;
    if(home) home.hidden=true;
    if(project) project.hidden=true;
    if(revenue) revenue.hidden=true;
    $('ccBrainHomeRoadmap')?.remove();
    const section=document.createElement('section');
    section.id='ccBrainHomeRoadmap';
    section.className='cc-brain-roadmap';
    section.innerHTML=`<button type="button" class="cc-brain-back" data-cc-brain-home-back>‹ Home</button>
      <div class="cc-brain-roadmap-head">
        <span class="cc-exact-menu-icon"><span><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 11c-5-3-10 1-9 6-5 1-6 8-2 11-2 5 3 10 8 8 2 5 9 4 10-1V15c0-4-4-7-7-4zm10 0c5-3 10 1 9 6 5 1 6 8 2 11 2 5-3 10-8 8-2 5-9 4-10-1V15c0-4 4-7 7-4z" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></span></span>
        <h3>Command Center Brain</h3>
        <p>What Command Center itself will be able to do, and what still needs to be built, connected, upgraded or verified.</p>
      </div>
      <div class="cc-brain-capabilities">${CAPABILITIES.map(renderCapability).join('')}</div>`;
    shell.insertBefore(section,home||project||revenue||null);
    section.querySelector('[data-cc-brain-home-back]')?.addEventListener('click',()=>closeBrain(true));
    if(title) title.textContent='Command Center Brain';
    if(description) description.textContent='Command Center capability roadmap';
    section.scrollIntoView({block:'start'});
    ensureHomeButton();
    if(pushHistory) history.pushState({...history.state,ccCommandCenterBrainHome:true},'',location.href);
  }

  function closeBrain(useHistory){
    if(!brainOpen) return;
    if(useHistory && history.state?.ccCommandCenterBrainHome){
      history.back();
      return;
    }
    brainOpen=false;
    $('ccBrainHomeRoadmap')?.remove();
    const shell=$('dashboardViewShell');
    const stats=$('stats');
    const home=$('homeView');
    const project=$('projectView');
    const revenue=$('revenueView');
    const title=$('viewTitle');
    const description=$('viewDescription');
    if(restore){
      if(shell) shell.hidden=restore.shellHidden;
      if(stats) stats.hidden=restore.statsHidden;
      if(home && restore.homeHidden!==undefined) home.hidden=restore.homeHidden;
      if(project && restore.projectHidden!==undefined) project.hidden=restore.projectHidden;
      if(revenue && restore.revenueHidden!==undefined) revenue.hidden=restore.revenueHidden;
      if(title) title.textContent=restore.title;
      if(description) description.textContent=restore.description;
    }
    restore=null;
    ensureHomeButton();
  }

  window.addEventListener('popstate',()=>{if(brainOpen) closeBrain(false);});
  const stats=$('stats');
  if(stats) new MutationObserver(ensureHomeButton).observe(stats,{childList:true,subtree:false});
  const shell=$('dashboardViewShell');
  if(shell) new MutationObserver(ensureHomeButton).observe(shell,{attributes:true,subtree:true,attributeFilter:['hidden','data-cc6-under']});
  window.addEventListener('load',()=>{ensureHomeButton();setTimeout(ensureHomeButton,250);setTimeout(ensureHomeButton,900);},{once:true});
  ensureHomeButton();
})();
