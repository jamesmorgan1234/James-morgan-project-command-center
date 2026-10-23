import { client, loadAgentState, loadSnapshot } from './data.js';

const transientFailures=new Set(['transient_network','provider_timeout','connection_error','provider_unavailable']);
let ownerId=null;
let agent=null;
let snapshot=null;
let realtimeChannel=null;
let refreshTimer=null;
let applying=false;
let enhancementQueued=false;

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const unique=values=>[...new Set((values||[]).filter(Boolean))];

function toast(message,error=false){
  const host=document.getElementById('ccToastHost');
  if(!host)return;
  const node=document.createElement('div');
  node.className=`cc-toast${error?' cc-error':''}`;
  node.textContent=message;
  host.appendChild(node);
  setTimeout(()=>node.remove(),3600);
}

async function getOwner(){
  const {data,error}=await client.auth.getSession();
  if(error)throw error;
  return data.session?.user?.id||null;
}

async function refreshTruth({quiet=true}={}){
  if(applying)return;
  const id=ownerId||await getOwner();
  if(!id)return;
  ownerId=id;
  applying=true;
  try{
    const [nextAgent,nextSnapshot]=await Promise.all([loadAgentState(id),loadSnapshot(id)]);
    agent=nextAgent;
    snapshot=nextSnapshot;
    applyEnhancements();
    if(!quiet)toast('Command Center state refreshed.');
  }catch(error){
    if(!quiet)toast(error?.message||'Refresh failed.',true);
  }finally{
    applying=false;
  }
}

function projectName(projectId){
  if(!projectId)return'Portfolio';
  return (snapshot?.projects||[]).find(p=>p.id===projectId)?.name||'Selected project';
}

function activeTask(){
  const tasks=agent?.tasks||[];
  return tasks.find(t=>t.status==='working')||tasks.find(t=>t.status==='pending')||null;
}

function runProgress(){
  const run=agent?.activeRun;
  if(!run)return null;
  if(run.status==='completed')return 100;
  const tasks=(agent?.tasks||[]).filter(t=>!['stopped','skipped'].includes(t.status));
  if(!tasks.length)return null;
  const verified=tasks.filter(t=>t.status==='verified').length;
  return Math.max(0,Math.min(100,Math.round((verified/tasks.length)*100)));
}

function runStateText(){
  const run=agent?.activeRun;
  if(!run)return'Idle';
  const map={queued:'Queued',working:'Working',paused:'Paused',needs_user:'Needs Owner',work_boundary:'Work Boundary',blocked:'Blocked',completed:'Completed',stopped:'Stopped',failed:'Failed'};
  return map[run.status]||String(run.status||'Idle').replaceAll('_',' ');
}

function homeAgentSummary(){
  const run=agent?.activeRun;
  const controls=agent?.controls||{};
  if(!run){
    if(controls.boundary_sweep_enabled)return{line:'Portfolio sweep armed',detail:'Waiting for the next eligible project',percent:null};
    if(controls.auto_enabled)return{line:'AUTO ON',detail:'Waiting for eligible work',percent:null};
    return{line:'AUTO OFF',detail:'No background Agent execution',percent:null};
  }
  const task=activeTask();
  const percent=runProgress();
  return{
    line:`${projectName(run.project_id)} · ${runStateText()}`,
    detail:task?.title||run.exact_next_action||run.objective||'Awaiting verified next action',
    percent
  };
}

function modeCard(kind,title,on,headline,detail){
  return`<button class="cc-card cc-home-card cc-agent-mode-card ${on?'is-on':''}" type="button" data-cc7-mode="${kind}" aria-pressed="${on}"><div class="cc-mode-led" aria-hidden="true"></div><h2>${esc(title)}</h2><p class="cc-mode-state">${on?'ON':'OFF'} · ${esc(headline)}</p><small>${esc(detail)}</small></button>`;
}

function barrierSummary(){
  const controls=agent?.controls||{};
  const done=unique([...(controls.boundary_sweep_completed_project_ids||[]),...(controls.boundary_sweep_skipped_project_ids||[])]);
  const total=(snapshot?.projects||[]).length;
  const current=controls.boundary_sweep_current_project_id?projectName(controls.boundary_sweep_current_project_id):null;
  return{
    headline:current||`${done.length} of ${total||0} reviewed`,
    detail:current?`${done.length} of ${total||0} portfolio projects parked/reviewed`:'Sequential: one project at a time to its next Work boundary'
  };
}

function enhanceHome(){
  const homeGrid=document.querySelector('.cc-screen .cc-home-grid');
  if(!homeGrid)return;
  const oldStrip=homeGrid.parentElement?.querySelector(':scope > .cc-state-strip');
  if(oldStrip&&!oldStrip.hidden)oldStrip.hidden=true;

  let modeGrid=homeGrid.parentElement?.querySelector(':scope > .cc-agent-mode-grid');
  if(!modeGrid){
    modeGrid=document.createElement('div');
    modeGrid.className='cc-agent-mode-grid';
    homeGrid.parentElement.insertBefore(modeGrid,homeGrid);
  }
  const controls=agent?.controls||{};
  const summary=homeAgentSummary();
  const barrier=barrierSummary();
  const autoHeadline=agent?.activeRun?projectName(agent.activeRun.project_id):summary.line;
  const autoDetail=agent?.activeRun?(activeTask()?.title||runStateText()):'Regular unattended Agent mode';
  const modeMarkup=
    modeCard('auto','Agent Auto',controls.auto_enabled===true,autoHeadline,autoDetail)+
    modeCard('barriers','To Work Barriers',controls.boundary_sweep_enabled===true,barrier.headline,barrier.detail);
  if(modeGrid.innerHTML!==modeMarkup)modeGrid.innerHTML=modeMarkup;

  const agentCard=homeGrid.querySelector('[data-nav="agent"]');
  if(agentCard){
    const p=agentCard.querySelector('p');
    const progressText=summary.percent===null?`${summary.line} · N/A run progress`:`${summary.line} · ${summary.percent}% run`;
    if(p&&p.textContent!==progressText)p.textContent=progressText;
    let detail=agentCard.querySelector('.cc-agent-card-task');
    if(!detail){detail=document.createElement('small');detail.className='cc-agent-card-task';agentCard.appendChild(detail);}
    if(detail.textContent!==summary.detail)detail.textContent=summary.detail;
    agentCard.classList.toggle('is-working',agent?.activeRun?.status==='working');
  }
}

function enhanceHeader(){
  document.querySelectorAll('.cc-screen .cc-header').forEach(header=>{
    if(header.querySelector('.cc-global-refresh'))return;
    const button=document.createElement('button');
    button.type='button';
    button.className='cc-global-refresh';
    button.dataset.cc7GlobalRefresh='true';
    button.title='Refresh current Command Center state';
    button.setAttribute('aria-label','Refresh current Command Center state');
    button.textContent='↻';
    header.appendChild(button);
  });
}

function enhanceAgent(){
  const screen=[...document.querySelectorAll('.cc-screen')].find(node=>node.querySelector('.cc-title')?.textContent?.trim()==='Agent');
  if(!screen)return;
  const controls=agent?.controls||{};
  const strip=screen.querySelector('.cc-state-strip .cc-state-main');
  if(strip){
    const extra=strip.querySelector('.cc-mode-truth')||document.createElement('span');
    extra.className='cc-mode-truth';
    const modeTruth=controls.boundary_sweep_enabled?'TO WORK BARRIERS ON · sequential one-project lock active':controls.auto_enabled?'AGENT AUTO ON · barrier sweep OFF':'Both automatic modes are OFF';
    if(extra.textContent!==modeTruth)extra.textContent=modeTruth;
    if(!extra.parentElement)strip.appendChild(extra);
  }

  if(!screen.querySelector('.cc-work-ladder-note')){
    const ownerControls=[...screen.querySelectorAll('.cc-section')].find(section=>section.textContent?.includes('OWNER CONTROLS'));
    if(ownerControls){
      const note=document.createElement('div');
      note.className='cc-work-ladder-note';
      note.textContent='Work ladder: exact Approve Work → Luna High → one transient retry → Sol Light after genuine capability/complexity failure → one transient retry. Sol Medium always requires a separate exact owner approval.';
      ownerControls.appendChild(note);
    }
  }

  const failedWork=(agent?.tasks||[]).find(t=>t.route==='work'&&transientFailures.has(String(t.failure_class||'').toLowerCase()));
  const alreadyApproved=failedWork&&(agent?.approvals||[]).some(a=>a.state==='approved'&&(a.task_id===failedWork.id||!a.task_id)&&['work','work_ladder'].includes(a.approval_type));
  let retry=screen.querySelector('.cc-work-retry-panel');
  if(failedWork&&alreadyApproved){
    if(!retry){
      retry=document.createElement('div');
      retry.className='cc-card cc-section cc-work-retry-panel';
      screen.querySelector('.cc-stack')?.appendChild(retry);
    }
    const retryMarkup=`<div class="cc-section-head"><div class="cc-section-title">WORK RETRY</div><span class="cc-section-note">Same approved task only</span></div><p class="cc-desc">The prior attempt failed for a transient provider/connection reason. Before execution, the runner must reconcile downstream state so a retry cannot duplicate a side effect.</p><div class="cc-agent-controls" style="margin-top:10px"><button class="cc-btn cc-control" type="button" data-cc7-retry-rung="luna_high" data-task-id="${esc(failedWork.id)}"><strong>Retry Luna High</strong><span>Same exact approved Work task</span></button><button class="cc-btn cc-control" type="button" data-cc7-retry-rung="sol_light" data-task-id="${esc(failedWork.id)}"><strong>Retry Sol Light</strong><span>Same exact approved Work task</span></button></div>`;
    if(retry.innerHTML!==retryMarkup)retry.innerHTML=retryMarkup;
  }else if(retry){retry.remove();}
}

function applyEnhancements(){
  enhanceHeader();
  enhanceHome();
  enhanceAgent();
}

function scheduleEnhancements(){
  if(enhancementQueued)return;
  enhancementQueued=true;
  queueMicrotask(()=>{
    enhancementQueued=false;
    applyEnhancements();
  });
}

async function toggleMode(kind,button){
  if(!ownerId)ownerId=await getOwner();
  if(!ownerId)throw new Error('Owner session is required.');
  button.disabled=true;
  button.setAttribute('aria-busy','true');
  try{
    if(kind==='auto'){
      const next=!(agent?.controls?.auto_enabled===true);
      const {data,error}=await client.rpc('cc7_agent_owner_set_auto',{p_enabled:next});
      if(error)throw error;
      if(!data?.ok)throw new Error('Agent Auto update did not verify.');
      toast(`Agent Auto ${next?'ON':'OFF'}.`);
    }else{
      const next=!(agent?.controls?.boundary_sweep_enabled===true);
      const {data,error}=await client.rpc('cc7_agent_owner_set_boundary_sweep',{p_enabled:next});
      if(error)throw error;
      if(!data?.ok)throw new Error('To Work Barriers update did not verify.');
      toast(next?'To Work Barriers ON — projects will be processed sequentially, one at a time.':'To Work Barriers OFF.');
    }
    await refreshTruth();
  }finally{
    button.disabled=false;
    button.removeAttribute('aria-busy');
  }
}

async function retryRung(button){
  if(!ownerId)ownerId=await getOwner();
  if(!ownerId)throw new Error('Owner session is required.');
  const taskId=button.dataset.taskId;
  const rung=button.dataset.cc7RetryRung;
  button.disabled=true;
  button.setAttribute('aria-busy','true');
  try{
    const {data,error}=await client.rpc('cc7_agent_owner_retry_work_rung',{p_task_id:taskId,p_rung:rung});
    if(error)throw error;
    if(!data?.ok)throw new Error('Work retry request did not verify.');
    await refreshTruth();
    toast(`${rung==='luna_high'?'Luna High':'Sol Light'} retry queued for the same approved Work task.`);
  }finally{
    button.disabled=false;
    button.removeAttribute('aria-busy');
  }
}

function globalRefresh(button){
  button?.setAttribute('aria-busy','true');
  window.dispatchEvent(new CustomEvent('cc7:global-refresh'));
  setTimeout(()=>button?.removeAttribute('aria-busy'),700);
}

document.addEventListener('click',event=>{
  const mode=event.target.closest('[data-cc7-mode]');
  if(mode){event.preventDefault();event.stopPropagation();toggleMode(mode.dataset.cc7Mode,mode).catch(error=>toast(error?.message||String(error),true));return;}
  const retry=event.target.closest('[data-cc7-retry-rung]');
  if(retry){event.preventDefault();event.stopPropagation();retryRung(retry).catch(error=>toast(error?.message||String(error),true));return;}
  const refresh=event.target.closest('[data-cc7-global-refresh]');
  if(refresh){event.preventDefault();event.stopPropagation();globalRefresh(refresh);}
},true);

const observer=new MutationObserver(()=>scheduleEnhancements());
observer.observe(document.documentElement,{subtree:true,childList:true});

async function startRealtime(){
  ownerId=await getOwner();
  if(!ownerId){applyEnhancements();return;}
  await refreshTruth();
  realtimeChannel=client.channel(`cc7-refinement-${ownerId}`);
  for(const table of ['cc7_agent_controls','cc7_agent_runs','cc7_agent_tasks','cc7_agent_approvals']){
    realtimeChannel.on('postgres_changes',{event:'*',schema:'public',table,filter:`owner_id=eq.${ownerId}`},()=>setTimeout(()=>refreshTruth(),120));
  }
  realtimeChannel.subscribe();
  clearInterval(refreshTimer);
  refreshTimer=setInterval(()=>{if(!document.hidden)refreshTruth();},15000);
}

client.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT'){
    ownerId=null;agent=null;snapshot=null;
    if(realtimeChannel){client.removeChannel(realtimeChannel);realtimeChannel=null;}
    applyEnhancements();
  }else if(event==='SIGNED_IN'&&session?.user?.id!==ownerId){
    if(realtimeChannel){client.removeChannel(realtimeChannel);realtimeChannel=null;}
    startRealtime().catch(()=>{});
  }
});

startRealtime().catch(()=>applyEnhancements());
applyEnhancements();
