import { client, loadSnapshot, createAgentRun } from './data.js';

let ownerId=null;
let snapshot=null;
let queued=false;
let independentRunBusy=false;

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const normalize=value=>String(value||'').normalize('NFKD').toLowerCase().replace(/[’‘]/g,"'").replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();
const safeJson=value=>{try{return typeof value==='string'?JSON.parse(value):(value||null);}catch{return null;}};
const approvedAtlasUrl=new URL('./assets/book-cover-atlas-v2.webp',import.meta.url).href;

const atlasTitles=[
  'Strange Worlds','Dreambeast Atlas','Rooms Beyond Geometry','Fungal Realms','Neon Dreadscapes','Electric Eden','Cities That Dream','Cathedral of Impossible Things','Celestial Oddities','Mechanical Dreams',
  'Daily Progress Planner','A Stronger You','Simple Budgeting Workbook','Take Control of Your Money','Garage Door Business Blueprint',
  'Pieces I Never Got Back','A Calmer Mind','Broken But Still Here','Moving Forward Anyway','The Alpha Mindset',
  'The Map Beneath the Tide','The Kingdom Under Black Water','The Crown of the Drowned',
  'The Unlived Hour','The Dead Between Minutes','The House Outside Time','What the Town Forgot','The Hour That Remains',
  'The Ferris Wheel Between Us','Kiss Me in the Haunted House',"The Summer We Don't Leave",
  'The Empire Beneath the Glaze','The Shards Between Kingdoms','The Earth After Firing',
  'Repeat Button','Air Fryer Favorites','Air Fryer Favorites Made Easy','Comfort Food Favorites','Home Cooking Made Simple','Slow Cooker Comforts','Sweet Creations'
];
const atlas=new Map(atlasTitles.map((title,index)=>[normalize(title),index]));
for(const [title,index] of [
  ['Melted Cosmos: Strange Worlds',0],
  ['Electric Eden: Psychedelic Gardens Beyond Reality',5],
  ['Cities That Dream: Surreal Worlds to Color',6],
  ['Cathedral of Impossible Things: Strange Architecture to Color',7],
  ['Celestial Oddities: Cosmic Creatures and Alien Worlds',8],
  ['Mechanical Dreams: Surreal Machines, Clockwork Worlds & Impossible Devices',9],
  ['The Summer We Don’t Leave',30]
])atlas.set(normalize(title),index);

/* Only true series/collections belong here. Workbooks and standalone books are individual projects. */
const projectManifest={
  'kdp-melted-cosmos':[
    'Melted Cosmos: Strange Worlds','Dreambeast Atlas','Rooms Beyond Geometry','Fungal Realms','Neon Dreadscapes','Electric Eden: Psychedelic Gardens Beyond Reality','Cities That Dream: Surreal Worlds to Color','Cathedral of Impossible Things: Strange Architecture to Color','Celestial Oddities: Cosmic Creatures and Alien Worlds','Mechanical Dreams: Surreal Machines, Clockwork Worlds & Impossible Devices'
  ],
  'kdp-drowned-crown':['The Map Beneath the Tide','The Kingdom Under Black Water','The Crown of the Drowned'],
  'kdp-glasswing-pier':['The Ferris Wheel Between Us','Kiss Me in the Haunted House','The Summer We Don’t Leave'],
  'kdp-unfired-world':['The Empire Beneath the Glaze','The Shards Between Kingdoms','The Earth After Firing']
};
const orderedSeries=new Set(Object.keys(projectManifest));

function projectByVisibleTitle(){
  const screen=[...document.querySelectorAll('.cc-screen')].find(node=>node.querySelector('.cc-subtitle')?.textContent?.trim()==='Project Details');
  if(!screen)return null;
  const title=screen.querySelector('.cc-title')?.textContent?.trim();
  if(!title)return null;
  const project=(snapshot?.projects||[]).find(p=>p.name===title);
  return project?{screen,project}:null;
}

function verifiedBookRows(projectId){
  return (snapshot?.metrics||[])
    .filter(m=>m.project_id===projectId&&m.verified===true&&m.key?.startsWith('bookmap.')&&m.key?.endsWith('.metadata'))
    .map(m=>safeJson(m.value_text))
    .filter(row=>row&&row.title);
}

function isIndependentBookProject(project){
  const source=String(project?.source_status||'').toLowerCase();
  const category=String(project?.category||'').toLowerCase();
  return source.includes('independent workbook project')||source.includes('independent standalone book project')||category.includes('— workbook')||category.includes('— standalone book');
}

function booksForProject(projectId){
  const verified=verifiedBookRows(projectId);
  const byTitle=new Map(verified.map(row=>[normalize(row.title),row]));
  const preferred=projectManifest[projectId]||[];
  let rows=[];
  if(preferred.length){
    for(const title of preferred){
      const row=byTitle.get(normalize(title));
      if(row)rows.push(row);
      else if(projectId==='kdp-drowned-crown')rows.push({title,owner_locked_cover:true});
    }
    const already=new Set(rows.map(row=>normalize(row.title)));
    rows.push(...verified.filter(row=>!already.has(normalize(row.title))));
  }else rows=verified;
  if(rows.some(row=>Number.isFinite(Number(row.series_order))))rows.sort((a,b)=>(Number(a.series_order)||999)-(Number(b.series_order)||999));
  return rows;
}

function atlasIndex(title){
  const key=normalize(title);
  if(atlas.has(key))return atlas.get(key);
  for(const [known,index] of atlas){if(key===known||key.endsWith(` ${known}`)||known.endsWith(` ${key}`))return index;}
  return null;
}

function coverMarkup(book){
  const index=atlasIndex(book.title);
  if(index===null)return `<div class="cc-v7-approved-cover is-missing" role="img" aria-label="Approved cover asset unavailable">Approved cover<br>asset unavailable</div>`;
  const x=(index/40)*100;
  return `<div class="cc-v7-approved-cover" role="img" aria-label="${esc(book.title)} approved cover" style="background-image:url('${esc(approvedAtlasUrl)}');background-position-x:${x}%"></div>`;
}

function gridClass(count){if(count===1)return'cols-1';if(count===3||count===6)return'cols-3';return'cols-5';}
function sectionLabel(projectId,count){
  if(projectId==='kdp-melted-cosmos')return['BOOKS IN COLLECTION',`${count} books`];
  if(orderedSeries.has(projectId))return['BOOKS IN SERIES',`${count} books`];
  return['BOOK',`${count} title`];
}

function renderBooksSection(projectId,books){
  const [heading,note]=sectionLabel(projectId,books.length);
  const sequence=orderedSeries.has(projectId);
  const cards=books.map((book,index)=>{
    const number=Number(book.series_order)||index+1;
    const status=book.publication_status||'';
    return `<div class="cc-v7-book-tile">${coverMarkup(book)}${sequence?`<div class="cc-v7-book-sequence">BOOK ${esc(number)}</div>`:''}<div class="cc-v7-book-title">${esc(book.title)}</div>${status?`<div class="cc-v7-book-status">${esc(status)}</div>`:''}</div>`;
  }).join('');
  return `<div class="cc-card cc-section cc-v7-books-section" data-cc7-book-project="${esc(projectId)}"><div class="cc-section-head"><div class="cc-section-title"><div class="cc-mini-icon" aria-hidden="true">▤</div>${heading}</div><span class="cc-section-note">${esc(note)}</span></div><div class="cc-v7-book-grid ${gridClass(books.length)}">${cards}</div></div>`;
}

function enhanceBookProject(){
  const current=projectByVisibleTitle();
  if(!current)return;
  const {screen,project}=current;
  if(!String(project.category||'').toLowerCase().includes('kdp')&&!String(project.id||'').startsWith('kdp-'))return;
  if(project.id==='kdp-missing-hour')return;
  if(screen.querySelector(`[data-cc7-book-project="${CSS.escape(project.id)}"]`))return;
  const books=booksForProject(project.id);
  if(!books.length)return;
  const stack=screen.querySelector('.cc-stack');
  if(!stack)return;
  const shell=document.createElement('div');
  shell.innerHTML=renderBooksSection(project.id,books);
  const section=shell.firstElementChild;
  const performance=[...stack.children].find(node=>node.classList?.contains('cc-section'));
  if(performance)performance.insertAdjacentElement('afterend',section);
  else stack.insertBefore(section,stack.children[1]||null);
}

function toast(message,error=false){
  const host=document.getElementById('ccToastHost');
  if(!host)return;
  const node=document.createElement('div');
  node.className=`cc-toast${error?' cc-error':''}`;
  node.textContent=message;
  host.appendChild(node);
  setTimeout(()=>node.remove(),3600);
}

async function dispatchIndependentBookRun(button,project){
  if(independentRunBusy)return;
  independentRunBusy=true;
  button.disabled=true;
  try{
    const mode=button.dataset.agentCreate;
    let objective;
    if(mode==='next_step')objective=project.next_action||prompt('What exact next step should Agent run?');
    else if(mode==='until_work')objective=`Advance ${project.name} from its verified current state through normal-chat work until the first genuine Work-only boundary. Current next action: ${project.next_action||'N/A'}`;
    else objective=prompt('Enter the exact manual task for Agent.');
    if(!objective)return;
    await createAgentRun({ownerId,projectId:project.id,objective,controlMode:mode,booksTarget:project.name,allowWork:mode==='until_work'});
    window.dispatchEvent(new CustomEvent('cc7:global-refresh'));
    toast(`${project.name} Agent run queued with this exact book locked as the target.`);
  }catch(error){toast(error?.message||String(error),true);}finally{button.disabled=false;independentRunBusy=false;}
}

function apply(){enhanceBookProject();}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;apply();});}

async function refresh(){
  const {data,error}=await client.auth.getSession();
  if(error)throw error;
  ownerId=data.session?.user?.id||null;
  if(!ownerId){snapshot=null;return;}
  snapshot=await loadSnapshot(ownerId);
  apply();
}

document.addEventListener('click',event=>{
  const button=event.target.closest('[data-agent-create]');
  if(!button||button.dataset.agentCreate==='project_checkpoint')return;
  const projectId=document.getElementById('ccAgentProjectSelector')?.value||null;
  const project=(snapshot?.projects||[]).find(p=>p.id===projectId);
  if(!project||!isIndependentBookProject(project))return;
  event.preventDefault();
  event.stopImmediatePropagation();
  dispatchIndependentBookRun(button,project);
},true);

new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
client.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT'){ownerId=null;snapshot=null;return;}
  if(event==='SIGNED_IN'&&session?.user?.id!==ownerId)refresh().catch(()=>{});
});
window.addEventListener('cc7:global-refresh',()=>setTimeout(()=>refresh().catch(()=>{}),0));
refresh().catch(()=>{});
