import { client, loadAgentState, loadSnapshot } from './data.js';

let agent=null;
let snapshot=null;
let busy=false;

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const isBook=p=>String(p?.id||'').startsWith('kdp-')||/book|kdp/i.test(String(p?.category||''));
const projectById=id=>(snapshot?.projects||[]).find(p=>p.id===id)||null;
const projectName=id=>projectById(id)?.name||(id?'Tracked project':'Portfolio');

function progressModel(){
  const tasks=agent?.tasks||[];
  const total=tasks.length;
  const verified=tasks.filter(t=>t.status==='verified').length;
  if(!total)return{percent:null,verified,total};
  return{percent:Math.max(0,Math.min(100,Math.round((verified/total)*100))),verified,total};
}

function activeMode(){
  const c=agent?.controls||{};
  if(c.project_auto_enabled)return{key:'project_auto',label:'PROJECT AUTO ON',projectId:c.project_auto_project_id||agent?.activeRun?.project_id||null};
  if(c.boundary_sweep_enabled)return{key:'boundary_sweep',label:'TO WORK BARRIERS ON',projectId:c.boundary_sweep_current_project_id||null};
  if(c.auto_enabled)return{key:'auto',label:'AGENT AUTO ON',projectId:agent?.activeRun?.project_id||null};
  return{key:'off',label:'AUTO OFF',projectId:null};
}

function runnerLabel(){
  const hb=agent?.heartbeat;
  if(!hb?.last_seen_at)return'Runner has not checked in yet';
  const age=Date.now()-new Date(hb.last_seen_at).getTime();
  if(!Number.isFinite(age)||age>90*60*1000)return'Runner waiting for its next hourly cycle';
  return`Runner ${hb.status||'ready'} · last check ${new Date(hb.last_seen_at).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`;
}

function runHumanState(){
  const run=agent?.activeRun;
  const mode=activeMode();
  if(!run){
    if(mode.key==='auto'||mode.key==='boundary_sweep')return'Waiting for the scheduled runner to claim the next eligible project.';
    if(mode.key==='project_auto')return`Waiting for the scheduled runner to claim ${projectName(mode.projectId)}.`;
    return'No Agent run is active.';
  }
  if(run.status==='queued')return'Waiting for the scheduled runner cycle. Nothing is being claimed as working yet.';
  if(run.status==='working')return'Working now.';
  if(run.status==='needs_user')return'Waiting for your required step. After you complete it, press Project Checkpoint to request verification and resume this same Project Auto run.';
  if(run.status==='blocked')return'Blocked. Complete the exact blocker below, then press Project Checkpoint to request re-verification.';
  if(run.status==='work_boundary')return'At a genuine Work boundary. No Work starts without the required exact approval.';
  if(run.status==='paused')return'Paused by owner.';
  return String(run.status||'Idle').replaceAll('_',' ');
}

function ensureProgress(host,home=false){
  if(!host)return;
  const p=progressModel();
  let box=host.querySelector('.cc-agent-progress-wrap');
  if(!box){
    box=document.createElement('div');
    box.className=`cc-agent-progress-wrap${home?' cc-agent-progress-home':''}`;
    host.appendChild(box);
  }
  const width=p.percent===null?0:p.percent;
  box.innerHTML=`<div class="cc-agent-progress-head"><strong>${p.percent===null?'N/A':`${p.percent}%`}</strong><span>${p.total?`${p.verified}/${p.total} verified steps`:'Plan not established yet'}</span></div><div class="cc-agent-progress-track" aria-label="Agent progress"><div class="cc-agent-progress-fill" style="width:${width}%"></div></div>`;
}

function applyHome(){
  const card=document.querySelector('button[data-nav="agent"]');
  if(!card)return;
  const mode=activeMode();
  const run=agent?.activeRun;
  const p=progressModel();
  const desc=card.querySelector('p');
  if(desc)desc.textContent=`${mode.label} · ${run?.status?run.status.replaceAll('_',' '):'idle'} · ${p.percent===null?'N/A':`${p.percent}%`}`;
  ensureProgress(card,true);
}

function applyAgent(){
  const screen=[...document.querySelectorAll('.cc-screen')].find(node=>node.querySelector('.cc-title')?.textContent?.trim()==='Agent');
  if(!screen)return;
  screen.classList.add('cc-agent-readable');
  const mode=activeMode();
  const run=agent?.activeRun;
  const strip=screen.querySelector('.cc-state-strip .cc-state-main');
  if(strip){
    const strong=strip.querySelector('strong');
    if(strong)strong.textContent=mode.projectId?`${mode.label} — ${projectName(mode.projectId)}`:mode.label;
    const spans=strip.querySelectorAll('span');
    if(spans[0])spans[0].textContent=runHumanState();
    if(spans[1])spans[1].textContent=runnerLabel();
  }

  const sections=[...screen.querySelectorAll('.cc-section')];
  const runSection=sections.find(s=>s.querySelector('.cc-section-title')?.textContent?.includes('CURRENT RUN'));
  if(runSection){
    const note=runSection.querySelector('.cc-section-note');
    if(note)note.textContent=run?({queued:'Waiting for runner',working:'Working',needs_user:'Needs you',blocked:'Blocked',work_boundary:'Work boundary',paused:'Paused'}[run.status]||String(run.status)):'Idle';
    ensureProgress(runSection,false);
    const current=(agent?.tasks||[]).find(t=>t.status==='working')||(agent?.tasks||[]).find(t=>t.status==='pending');
    let summary=runSection.querySelector('.cc-agent-human-summary');
    if(!summary){summary=document.createElement('div');summary.className='cc-agent-human-summary';runSection.insertBefore(summary,runSection.querySelector('.cc-agent-controls')||null);}
    if(run){
      const task=current?.title||run.exact_next_action||'Waiting for runner';
      const action=(run.status==='needs_user'||run.status==='blocked')?run.exact_next_action:'';
      summary.innerHTML=`<strong>${esc(task)}</strong><p>${esc(runHumanState())}</p>${action?`<div class="cc-agent-blocker"><b>${run.status==='blocked'?'BLOCKED':'ACTION REQUIRED'}</b><span>${esc(action)}</span></div>`:''}`;
      const descs=[...runSection.querySelectorAll(':scope > p.cc-desc')];
      descs.forEach(p=>p.hidden=true);
    }else summary.innerHTML='<strong>Idle</strong><p>No Agent run is active.</p>';
  }

  const selector=screen.querySelector('#ccAgentProjectSelector');
  if(selector&&snapshot){
    [...selector.options].forEach(opt=>{
      if(!opt.value)return;
      const project=projectById(opt.value);
      if(project?.agent_access_enabled===false)opt.remove();
      else if(isBook(project)&&!location.search.includes(`project=${encodeURIComponent(project.id)}`)&&agent?.activeRun?.project_id!==project.id)opt.remove();
    });
  }

  const projectAuto=screen.querySelector('[data-project-auto]');
  if(projectAuto){
    const strong=projectAuto.querySelector('strong');
    const span=projectAuto.querySelector('span');
    if(mode.key==='project_auto'){
      if(strong)strong.textContent=`Project Auto ON — ${projectName(mode.projectId)}`;
      if(span)span.textContent=runHumanState();
    }else{
      if(strong)strong.textContent='Project Auto';
      if(span)span.textContent='Run only the selected project. It starts on the next scheduled runner cycle and stays locked to that project until stopped, complete, or genuinely blocked.';
    }
  }
}

function apply(){applyHome();applyAgent();}

async function refresh(){
  if(busy)return;
  busy=true;
  try{
    const {data,error}=await client.auth.getSession();
    if(error)throw error;
    const ownerId=data.session?.user?.id;
    if(!ownerId)return;
    [agent,snapshot]=await Promise.all([loadAgentState(ownerId),loadSnapshot(ownerId)]);
    apply();
  }catch{}finally{busy=false;}
}

window.addEventListener('cc7:global-refresh',()=>setTimeout(refresh,50));
client.auth.onAuthStateChange(event=>{if(event==='SIGNED_IN')refresh();if(event==='SIGNED_OUT'){agent=null;snapshot=null;}});
new MutationObserver(()=>apply()).observe(document.documentElement,{childList:true,subtree:true});
setInterval(()=>{if(!document.hidden)refresh();},60000);
refresh();
