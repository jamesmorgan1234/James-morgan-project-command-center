import {client,loadSnapshot,createAgentRun} from './data.js';
import {executeAgentRun} from './agent-execution.js';
import {projectPublicationDisplay} from './publication-truth.js';

const BOOK_ATLAS_URL="./authoritative-v7/assets/book-cover-atlas-v2.webp";
const STATUS_CLASSES=['live','ready','planning','queued','blocked','active-rebuild','publishing','agent-review','owner-review','needs-publishing','needs-changes'];
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

async function runPrePublishReview(button,project,mode){
  if(runBusy)return;
  runBusy=true;
  button.disabled=true;
  try{
    const objective=`[PRE-PUBLISH BOOK REVIEW] Verify ${project.name} from its newest verified Command Center state before publishing. Check the canonical production-complete record, verified book mapping, publication truth, approved-cover/final-package verification records, series counts where applicable, and all recorded pre-publish gates. Use any accessible verified evidence, but do not claim visual inspection of a PDF/package that this runner cannot access. Visual inspection of the exact final package is reserved for James Morgan on his computer. Project Checkpoint alone does not satisfy this review. Do not publish, upload to KDP, submit anything, spend money, open Work, or bypass the owner PC review gate. If canonical verification passes, stop at the protected owner PC review boundary. If evidence is missing or conflicting, fail closed and report the exact blocker.`;
    const run=await createAgentRun({ownerId,projectId:project.id,objective,controlMode:mode,booksTarget:project.name,allowWork:false});
    const result=await executeAgentRun(run.id);
    window.dispatchEvent(new CustomEvent('cc7:global-refresh'));
    if(result?.outcome==='needs_owner_pc_review')toast(`${project.name} Agent verification passed. PC review is now required before publishing.`);
    else if(result?.outcome==='blocked')toast(`${project.name} Agent review stopped on a verification gap. Open Agent for the exact blocker.`,true);
    else toast(`${project.name} Agent review updated.`);
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
  runPrePublishReview(button,project,mode);
},true);

new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
client.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT'){ownerId=null;snapshot=null;return;}
  if(event==='SIGNED_IN'&&session?.user?.id!==ownerId)refresh().catch(()=>{});
});
window.addEventListener('cc7:global-refresh',()=>setTimeout(()=>refresh().catch(()=>{}),0));
refresh().catch(()=>{});
