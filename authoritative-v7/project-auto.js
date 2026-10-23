import { client, createAgentRun, loadAgentState } from './data.js';

let busy=false;
let lastAgent=null;

function setButtonState(button,title,detail){
  if(!button)return;
  const strong=button.querySelector('strong');
  const span=button.querySelector('span');
  if(strong)strong.textContent=title;
  if(span)span.textContent=detail;
}

async function refreshState(){
  try{
    const {data:{session}}=await client.auth.getSession();
    const ownerId=session?.user?.id;
    if(!ownerId)return;
    lastAgent=await loadAgentState(ownerId);
    install();
  }catch{}
}

async function startProjectAuto(button){
  if(busy)return;
  const selector=document.getElementById('ccAgentProjectSelector');
  const projectId=selector?.value||'';
  if(!projectId){
    setButtonState(button,'Project Auto','Select one eligible project first. Books must be opened as an exact book target.');
    return;
  }

  if(lastAgent?.controls?.project_auto_enabled){
    setButtonState(button,'Project Auto ON','Use Stop Agent to stop the current Project Auto run without losing verified work.');
    return;
  }

  busy=true;
  button.disabled=true;
  setButtonState(button,'Project Auto','Starting selected project only…');
  try{
    const {data:{session},error:sessionError}=await client.auth.getSession();
    if(sessionError)throw sessionError;
    const ownerId=session?.user?.id;
    if(!ownerId)throw new Error('Owner session is required.');

    const {data:project,error:projectError}=await client
      .from('cc7_projects')
      .select('id,name,next_action,agent_access_enabled')
      .eq('owner_id',ownerId)
      .eq('id',projectId)
      .maybeSingle();
    if(projectError)throw projectError;
    if(!project)throw new Error('Selected project was not found.');
    if(project.agent_access_enabled===false)throw new Error('Agent access is disabled for this project.');

    const objective=`[PROJECT AUTO] Advance ${project.name} only from its verified current state. Stay locked to this project. Preserve verified work and stop only for owner stop, completion, or a genuine owner/device/authorization/safety/availability boundary. Current next action: ${project.next_action||'Reconcile current verified state and determine the next safe action.'}`;

    await createAgentRun({
      ownerId,
      projectId:project.id,
      objective,
      controlMode:'project_auto',
      booksTarget:project.name,
      allowWork:true
    });

    window.dispatchEvent(new CustomEvent('cc7:global-refresh'));
    setButtonState(button,`Project Auto ON — ${project.name}`,'Waiting for the scheduled runner cycle. This project stays locked until you stop it, it completes, or it reaches a genuine boundary.');
  }catch(error){
    setButtonState(button,'Project Auto',error?.message||String(error));
  }finally{
    busy=false;
    button.disabled=false;
    refreshState();
  }
}

function install(){
  const selector=document.getElementById('ccAgentProjectSelector');
  if(!selector)return;
  const ownerControls=[...document.querySelectorAll('.cc-section')].find(section=>section.querySelector('.cc-section-title')?.textContent?.trim()==='OWNER CONTROLS');
  const controls=ownerControls?.querySelector('.cc-agent-controls');
  if(!controls)return;

  let button=controls.querySelector('[data-project-auto]');
  if(!button){
    button=document.createElement('button');
    button.className='cc-btn cc-control';
    button.type='button';
    button.dataset.projectAuto='true';
    button.innerHTML='<strong>Project Auto</strong><span>Run only the selected project on the scheduled Agent runner. It will never jump to another project.</span>';
    button.addEventListener('click',()=>startProjectAuto(button));
    controls.prepend(button);
  }

  if(lastAgent?.controls?.project_auto_enabled){
    const projectId=lastAgent.controls.project_auto_project_id||lastAgent.activeRun?.project_id;
    const selected=[...selector.options].find(o=>o.value===projectId)?.textContent||'selected project';
    setButtonState(button,`Project Auto ON — ${selected}`,lastAgent.activeRun?.status==='working'?'Working now.':'Waiting/parked safely until the next eligible runner action.');
  }
}

window.addEventListener('cc7:global-refresh',()=>setTimeout(refreshState,50));
new MutationObserver(()=>install()).observe(document.documentElement,{childList:true,subtree:true});
client.auth.onAuthStateChange(event=>{if(event==='SIGNED_IN')refreshState();if(event==='SIGNED_OUT')lastAgent=null;});
install();
refreshState();
