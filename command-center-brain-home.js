(() => {
  const ROADMAPS = {
    'Project Brain': {symbol:'◉',description:'Persistent memory, context, planning and ChatGPT handoff infrastructure.',phases:[
      ['Durable Memory','Persist owner-scoped, project-aware memory across reloads and devices.'],
      ['Brainstorm Workspace','Capture and organize ideas before they become committed work.'],
      ['Context Builder','Assemble relevant memory and verified project state into a reusable context packet.'],
      ['Task Queue / Planner','Turn goals and context into an ordered, trackable execution queue.'],
      ['ChatGPT Handoff Loop','Send prepared context and tasks into the ChatGPT workflow and receive verified results back.']
    ]},
    'Automation': {symbol:'↻',description:'Scheduled and conditional Command Center work.',phases:[
      ['Scheduler Engine','Run a defined Command Center job at a date, time, or recurring cadence.'],
      ['Condition Evaluator','Evaluate a saved condition and decide whether its trigger is true.'],
      ['Notification Delivery','Deliver a Command Center alert when a configured trigger fires.'],
      ['Recurring Report Jobs','Generate a saved report automatically on its configured schedule.'],
      ['Action Queue Runner','Execute pre-authorized routine actions from a controlled queue.'],
      ['Cross-Project Workflow Chains','Run dependent automation steps across more than one project.'],
      ['Run History','Persist the result and status of every automation execution.'],
      ['Failure Recovery','Safely retry or resume a failed automation run without duplicating completed work.']
    ]},
    'Integrations': {symbol:'⌁',description:'Connected services, permissions and synchronized external data.',phases:[
      ['Connection Registry','Maintain one canonical registry of connected providers, accounts and connection states.'],
      ['Permission & Scope Mapping','Record exactly what data and actions each connection is allowed to use.'],
      ['Read Sync','Pull authorized source data into Command Center.'],
      ['Data Normalization','Map provider-specific fields into Command Center canonical data structures.'],
      ['Connection Health','Detect stale, expired or broken integrations.'],
      ['Write Actions','Send an explicitly authorized change back to a connected service.'],
      ['Webhook / Realtime Intake','Accept supported push updates from connected services.'],
      ['Reconnect & Recovery','Restore an expired or broken integration without losing its configuration.']
    ]},
    'Analytics': {symbol:'▥',description:'Verified metrics, rollups, history and operational signals.',phases:[
      ['Metric Catalog','Define canonical metric names, units, verification state and source rules.'],
      ['Project KPI Views','Show verified KPIs for one project in a dedicated analytics view.'],
      ['Portfolio Rollups','Aggregate compatible verified metrics across projects.'],
      ['Time-Series History','Persist metric history so changes can be measured over time.'],
      ['Trend Comparison','Compare current and historical performance without inventing missing data.'],
      ['Goal Tracking','Store targets and measure verified progress toward them.'],
      ['Anomaly Detection','Flag meaningful verified metric changes that fall outside expected patterns.']
    ]},
    'Security': {symbol:'⬡',description:'Identity, permissions, protected execution and auditability.',phases:[
      ['Identity & Session Controls','Define and enforce who may enter Command Center and how sessions are handled.'],
      ['Row-Level Data Isolation','Verify that private records remain isolated to the authorized owner.'],
      ['Permission Registry','Maintain a canonical map of permissions for users, tools and connections.'],
      ['Action Authorization Gates','Require the correct approval before protected or high-impact actions execute.'],
      ['Secrets Isolation','Keep credentials and secret material out of public client code and normal UI.'],
      ['Audit Trail','Persist who or what performed each protected Command Center action.'],
      ['Security Alerts','Surface meaningful authentication, permission or integrity failures.'],
      ['Access Revocation & Recovery','Revoke compromised access and restore a safe authorized state.']
    ]},
    'Deployment': {symbol:'▲',description:'Release, validation, health, versioning and rollback controls.',phases:[
      ['Release Manifest','Record the exact files, versions and intended production scope for a release.'],
      ['Pre-Deploy Validation','Run the required checks before a production release can proceed.'],
      ['Deployment Pipeline','Publish an authorized release through one controlled deployment path.'],
      ['Post-Deploy Health Check','Verify the exact deployed version and its critical live behaviors.'],
      ['Version History','Maintain a durable history of released production versions.'],
      ['Rollback','Restore the last known-good production release through a controlled path.'],
      ['PWA Update Control','Coordinate service-worker and installed-app updates without breaking identity or launch behavior.']
    ]},
    'Agent Mode': {symbol:'✦',description:'Verified autonomous execution after prerequisite capabilities are ready.',phases:[
      ['Agent Session Model','Create a bounded agent run with an explicit goal, scope and owner.'],
      ['Goal Intake','Convert a user-approved objective into a structured agent objective.'],
      ['Step Executor','Execute one approved plan step at a time through supported tools.'],
      ['Tool Permission Gate','Block tool actions that fall outside the run’s explicit permissions.'],
      ['Verification Gate','Verify each completed step before the agent advances.'],
      ['Checkpoint & Resume','Persist agent state so a run can safely resume after interruption.'],
      ['Failure Recovery','Detect a failed step and recover without silently skipping or duplicating work.'],
      ['Cross-Project Agent Runs','Allow one authorized agent run to coordinate verified work across multiple projects.']
    ]}
  };
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  let brainOpen=false;
  let capabilityOpen=null;
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

  function renderCapability(name){
    const item=ROADMAPS[name];
    return `<button type="button" class="cc-brain-capability cc-brain-capability-button" data-brain-capability="${esc(name)}" aria-label="Open ${esc(name)} roadmap"><span class="cc-cap-icon" aria-hidden="true">${esc(item.symbol)}</span><strong>${esc(name)}</strong><small>${esc(item.description)}</small><span class="cc-brain-capability-foot"><span class="badge planning">0% · Planned</span><span>${item.phases.length} phases</span><span class="cc-cap-open" aria-hidden="true">›</span></span></button>`;
  }

  function renderPhase([name,description],index){
    return `<article class="cc-brain-phase planned"><span class="cc-brain-phase-number">Phase ${index+1}</span><div class="cc-brain-phase-copy"><strong>${esc(name)}</strong><p>${esc(description)}</p></div><span class="badge planning">Planned</span></article>`;
  }

  function renderOverview(){
    const body=document.querySelector('#ccBrainHomeRoadmap [data-brain-roadmap-body]');
    if(!body) return;
    capabilityOpen=null;
    body.innerHTML=`<div class="cc-brain-capabilities">${Object.keys(ROADMAPS).map(renderCapability).join('')}</div>`;
    body.querySelectorAll('[data-brain-capability]').forEach(button=>button.addEventListener('click',()=>openCapability(button.dataset.brainCapability,true)));
  }

  function renderCapabilityDetail(name){
    const body=document.querySelector('#ccBrainHomeRoadmap [data-brain-roadmap-body]');
    const item=ROADMAPS[name];
    if(!body||!item) return;
    capabilityOpen=name;
    body.innerHTML=`<button type="button" class="cc-brain-back cc-brain-capability-back" data-cc-brain-capability-back>‹ All capabilities</button><section class="cc-brain-capability-detail" data-brain-capability-detail="${esc(name)}"><div class="cc-brain-capability-detail-head"><span class="cc-cap-icon" aria-hidden="true">${esc(item.symbol)}</span><div><div class="cc-brain-capability-kicker">0 of ${item.phases.length} phases complete</div><h4>${esc(name)}</h4><p>${esc(item.description)}</p></div><span class="cc-brain-capability-percent">0%</span></div><div class="cc-brain-phase-list">${item.phases.map(renderPhase).join('')}</div></section>`;
    body.querySelector('[data-cc-brain-capability-back]')?.addEventListener('click',()=>closeCapability(true));
    $('ccBrainHomeRoadmap')?.scrollIntoView({block:'start'});
  }

  function openCapability(name,pushHistory){
    if(!ROADMAPS[name]) return;
    renderCapabilityDetail(name);
    if(pushHistory) history.pushState({...history.state,ccCommandCenterBrainCapability:name},'',location.href);
  }

  function closeCapability(useHistory){
    if(!capabilityOpen) return;
    if(useHistory && history.state?.ccCommandCenterBrainCapability){history.back();return;}
    renderOverview();
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
    restore={shellHidden:shell.hidden,statsHidden:stats.hidden,homeHidden:home?.hidden,projectHidden:project?.hidden,revenueHidden:revenue?.hidden,title:title?.textContent||'',description:description?.textContent||''};
    brainOpen=true;
    capabilityOpen=null;
    stats.hidden=true;
    shell.hidden=false;
    if(home) home.hidden=true;
    if(project) project.hidden=true;
    if(revenue) revenue.hidden=true;
    $('ccBrainHomeRoadmap')?.remove();
    const section=document.createElement('section');
    section.id='ccBrainHomeRoadmap';
    section.className='cc-brain-roadmap';
    section.innerHTML=`<button type="button" class="cc-brain-back" data-cc-brain-home-back>‹ Home</button><div class="cc-brain-roadmap-head"><span class="cc-exact-menu-icon"><span><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 11c-5-3-10 1-9 6-5 1-6 8-2 11-2 5 3 10 8 8 2 5 9 4 10-1V15c0-4-4-7-7-4zm10 0c5-3 10 1 9 6 5 1 6 8 2 11 2 5-3 10-8 8-2 5-9 4-10-1V15c0-4 4-7 7-4z" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg></span></span><h3>Command Center Brain</h3><p>Open any capability to see every implementation phase. Each phase is intentionally narrow enough to build and verify independently.</p></div><div data-brain-roadmap-body></div>`;
    shell.insertBefore(section,home||project||revenue||null);
    section.querySelector('[data-cc-brain-home-back]')?.addEventListener('click',()=>closeBrain(true));
    renderOverview();
    if(title) title.textContent='Command Center Brain';
    if(description) description.textContent='Capability roadmap · open a capability to view every phase';
    section.scrollIntoView({block:'start'});
    ensureHomeButton();
    if(pushHistory) history.pushState({...history.state,ccCommandCenterBrainHome:true},'',location.href);
  }

  function closeBrain(useHistory){
    if(!brainOpen) return;
    if(capabilityOpen){closeCapability(useHistory);return;}
    if(useHistory && history.state?.ccCommandCenterBrainHome){history.back();return;}
    brainOpen=false;
    capabilityOpen=null;
    $('ccBrainHomeRoadmap')?.remove();
    const shell=$('dashboardViewShell');
    const stats=$('stats');
    const home=$('homeView');
    const project=$('projectView');
    const revenue=$('revenueView');
    const title=$('viewTitle');
    const description=$('viewDescription');
    if(restore){if(shell) shell.hidden=restore.shellHidden;if(stats) stats.hidden=restore.statsHidden;if(home&&restore.homeHidden!==undefined) home.hidden=restore.homeHidden;if(project&&restore.projectHidden!==undefined) project.hidden=restore.projectHidden;if(revenue&&restore.revenueHidden!==undefined) revenue.hidden=restore.revenueHidden;if(title) title.textContent=restore.title;if(description) description.textContent=restore.description;}
    restore=null;
    ensureHomeButton();
  }

  window.addEventListener('popstate',()=>{if(capabilityOpen){closeCapability(false);return;}if(brainOpen)closeBrain(false);});
  const stats=$('stats');
  if(stats) new MutationObserver(ensureHomeButton).observe(stats,{childList:true,subtree:false});
  const shell=$('dashboardViewShell');
  if(shell) new MutationObserver(ensureHomeButton).observe(shell,{attributes:true,subtree:true,attributeFilter:['hidden','data-cc6-under']});
  window.addEventListener('load',()=>{ensureHomeButton();setTimeout(ensureHomeButton,250);setTimeout(ensureHomeButton,900);},{once:true});
  ensureHomeButton();
})();
