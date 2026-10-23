import {client,loadSnapshot,createAgentRun} from './data.js';
import {projectPublicationDisplay} from './publication-truth.js';

const BOOK_ATLAS_URL="./authoritative-v7/assets/book-cover-atlas-v2.webp";
const STATUS_CLASSES=['live','ready','planning','queued','blocked','active-rebuild','publishing','agent-review','owner-review','needs-publishing'];
let ownerId=null;
let snapshot=null;
let queued=false;
let runBusy=false;

function toast(message,error=false){
  const host=document.getElementById('ccToastHost');
  if(!host)return;
  const node=document.createElement('div');
  node.className=`cc-toast${error?' cc-error':''}`;
  node.textContent=message;
  host.appendChild(node);
  setTimeout(()=>node.remove(),3600);
}

function isKdp(project){
  return Boolean(project)&&(String(project.category||'').toLowerCase().includes('kdp')||String(project.id||'').startsWith('kdp-'));
}

function projectForStatusPill(pill){
  const explicit=pill.closest('[data-open-project]')?.dataset.openProject||pill.closest('[data-project-id]')?.dataset.projectId;
  if(explicit)return (snapshot?.projects||[]).find(project=>project.id===explicit)||null;
  const screen=pill.closest('.cc-screen');
  const title=screen?.querySelector('.cc-title')?.textContent?.trim();
  if(!title)return null;
  return (snapshot?.projects||[]).find(project=>project.name===title)||null;
}

function applyPublicationBadges(){
  if(!snapshot)return;
  for(const pill of document.querySelectorAll('.cc-status')){
    const project=projectForStatusPill(pill);
    if(!isKdp(project))continue;
    const display=projectPublicationDisplay(project,snapshot.metrics||[]);
    if(!display)continue;
    pill.classList.remove(...STATUS_CLASSES);
    if(display.cls)pill.classList.add(display.cls);
    pill.textContent=display.label;
  }
}

function applyApprovedCoverPaths(){
  for(const cover of document.querySelectorAll('.cc-v7-approved-cover:not(.is-missing)')){
    const current=cover.style.backgroundImage||'';
    if(!current||current.includes('book-cover-atlas-v2.webp'))cover.style.backgroundImage=`url('${BOOK_ATLAS_URL}')`;
  }
}

function apply(){
  applyApprovedCoverPaths();
  applyPublicationBadges();
}

function schedule(){
  if(queued)return;
  queued=true;
  queueMicrotask(()=>{queued=false;apply();});
}

async function refresh(){
  const {data,error}=await client.auth.getSession();
  if(error)throw error;
  ownerId=data.session?.user?.id||null;
  if(!ownerId){snapshot=null;return;}
  snapshot=await loadSnapshot(ownerId);
  apply();
}

function selectedProject(){
  const id=document.getElementById('ccAgentProjectSelector')?.value||null;
  return (snapshot?.projects||[]).find(project=>project.id===id)||null;
}

function needsPrePublishReview(project){
  if(!isKdp(project))return false;
  return projectPublicationDisplay(project,snapshot?.metrics||[])?.label==='Agent Review Needed';
}

async function queuePrePublishReview(button,project,mode){
  if(runBusy)return;
  runBusy=true;
  button.disabled=true;
  try{
    const objective=`[PRE-PUBLISH BOOK REVIEW] Review and verify ${project.name} from its newest verified state. Inspect the exact approved/locked production package and all available canonical book records for cover correctness, interior/final-file integrity, formatting, metadata, publication mapping, and required book QA. Complete every correction that normal ChatGPT/Agent can perform without Work. Do not publish, upload to KDP, submit anything, spend money, open Work, or bypass James Morgan's owner PC review gate. Project Checkpoint alone does not satisfy this review. If every normal-chat requirement is verified, finish at the owner PC review boundary and record the project as Agent verified. If a real blocker remains, preserve verified work and report the exact blocker and next action.`;
    await createAgentRun({ownerId,projectId:project.id,objective,controlMode:mode,booksTarget:project.name,allowWork:false});
    window.dispatchEvent(new CustomEvent('cc7:global-refresh'));
    toast(`${project.name} pre-publish Agent review queued. Work and publishing remain locked.`);
  }catch(error){
    toast(error?.message||String(error),true);
  }finally{
    button.disabled=false;
    runBusy=false;
  }
}

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-agent-create]');
  if(!button)return;
  const mode=button.dataset.agentCreate;
  if(mode!=='next_step'&&mode!=='until_work')return;
  const project=selectedProject();
  if(!needsPrePublishReview(project))return;
  event.preventDefault();
  event.stopImmediatePropagation();
  queuePrePublishReview(button,project,mode);
},true);

new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
client.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT'){ownerId=null;snapshot=null;return;}
  if(event==='SIGNED_IN'&&session?.user?.id!==ownerId)refresh().catch(()=>{});
});
window.addEventListener('cc7:global-refresh',()=>setTimeout(()=>refresh().catch(()=>{}),0));
refresh().catch(()=>{});
