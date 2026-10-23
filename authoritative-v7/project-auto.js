import { client, createAgentRun } from './data.js';

let busy=false;

function setButtonState(button,title,detail){
  if(!button)return;
  const strong=button.querySelector('strong');
  const span=button.querySelector('span');
  if(strong)strong.textContent=title;
  if(span)span.textContent=detail;
}

async function startProjectAuto(button){
  if(busy)return;
  const selector=document.getElementById('ccAgentProjectSelector');
  const projectId=selector?.value||'';
  if(!projectId){
    setButtonState(button,'Project Auto','Select one project above first.');
    setTimeout(()=>setButtonState(button,'Project Auto','Keep working only on the selected project until stopped, completed, or genuinely blocked.'),2200);
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
      .select('id,name,next_action')
      .eq('owner_id',ownerId)
      .eq('id',projectId)
      .maybeSingle();
    if(projectError)throw projectError;
    if(!project)throw new Error('Selected project was not found.');

    const objective=`[PROJECT AUTO] Continuously advance ${project.name} only. Stay locked to this project and never switch to another project. Continue through every eligible normal-chat step and use the existing Work approval ladder only when genuinely required. Stop only when the owner stops the run, the project is complete, or a genuine authorization, device, availability, safety, or other real blocker prevents further progress. Current next action: ${project.next_action||'N/A'}`;

    await createAgentRun({
      ownerId,
      projectId:project.id,
      objective,
      controlMode:'project_auto',
      booksTarget:project.name,
      allowWork:true
    });

    window.dispatchEvent(new CustomEvent('cc7:global-refresh'));
  }catch(error){
    setButtonState(button,'Project Auto',error?.message||String(error));
    setTimeout(()=>setButtonState(button,'Project Auto','Keep working only on the selected project until stopped, completed, or genuinely blocked.'),3500);
  }finally{
    busy=false;
    button.disabled=false;
  }
}

function install(){
  const selector=document.getElementById('ccAgentProjectSelector');
  if(!selector)return;
  const ownerControls=[...document.querySelectorAll('.cc-section')].find(section=>section.querySelector('.cc-section-title')?.textContent?.trim()==='OWNER CONTROLS');
  const controls=ownerControls?.querySelector('.cc-agent-controls');
  if(!controls||controls.querySelector('[data-project-auto]'))return;

  const button=document.createElement('button');
  button.className='cc-btn cc-control';
  button.type='button';
  button.dataset.projectAuto='true';
  button.innerHTML='<strong>Project Auto</strong><span>Keep working only on the selected project until stopped, completed, or genuinely blocked.</span>';
  button.addEventListener('click',()=>startProjectAuto(button));
  controls.prepend(button);
}

new MutationObserver(()=>install()).observe(document.documentElement,{childList:true,subtree:true});
install();
