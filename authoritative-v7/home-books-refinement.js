import { client, loadSnapshot } from './data.js';

let ownerId=null;
let snapshot=null;
let queued=false;

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const normalize=value=>String(value||'').normalize('NFKD').toLowerCase().replace(/[’‘]/g,"'").replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();
const safeJson=value=>{try{return typeof value==='string'?JSON.parse(value):(value||null);}catch{return null;}};

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

const projectManifest={
  'kdp-melted-cosmos':[
    'Melted Cosmos: Strange Worlds','Dreambeast Atlas','Rooms Beyond Geometry','Fungal Realms','Neon Dreadscapes','Electric Eden: Psychedelic Gardens Beyond Reality','Cities That Dream: Surreal Worlds to Color','Cathedral of Impossible Things: Strange Architecture to Color','Celestial Oddities: Cosmic Creatures and Alien Worlds','Mechanical Dreams: Surreal Machines, Clockwork Worlds & Impossible Devices'
  ],
  'kdp-workbooks':['Daily Progress Planner','A Stronger You','Simple Budgeting Workbook','Take Control of Your Money','Garage Door Business Blueprint'],
  'kdp-drowned-crown':['The Map Beneath the Tide','The Kingdom Under Black Water','The Crown of the Drowned'],
  'kdp-glasswing-pier':['The Ferris Wheel Between Us','Kiss Me in the Haunted House','The Summer We Don’t Leave'],
  'kdp-unfired-world':['The Empire Beneath the Glaze','The Shards Between Kingdoms','The Earth After Firing'],
  'kdp-repeat-button':['Repeat Button'],
  'kdp-standalones':['Pieces I Never Got Back','A Calmer Mind','Broken But Still Here','Moving Forward Anyway','The Alpha Mindset','The Last Hour I Trusted You']
};
const orderedSeries=new Set(['kdp-melted-cosmos','kdp-drowned-crown','kdp-glasswing-pier','kdp-unfired-world']);

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
  if(rows.some(row=>Number.isFinite(Number(row.series_order)))){
    rows.sort((a,b)=>(Number(a.series_order)||999)-(Number(b.series_order)||999));
  }
  return rows;
}

function atlasIndex(title){
  const key=normalize(title);
  if(atlas.has(key))return atlas.get(key);
  for(const [known,index] of atlas){
    if(key===known||key.endsWith(` ${known}`)||known.endsWith(` ${key}`))return index;
  }
  return null;
}

function coverMarkup(book){
  if(normalize(book.title)===normalize('The Last Hour I Trusted You')){
    return `<div class="cc-v7-approved-cover is-missing" role="img" aria-label="${esc(book.title)} approved cover protected; display mirror pending">Approved cover protected<br>display mirror pending</div>`;
  }
  const index=atlasIndex(book.title);
  if(index===null)return `<div class="cc-v7-approved-cover is-missing" role="img" aria-label="Approved cover asset unavailable">Approved cover<br>asset unavailable</div>`;
  const x=(index/40)*100;
  return `<div class="cc-v7-approved-cover" role="img" aria-label="${esc(book.title)} approved cover" style="background-image:url('./assets/book-cover-atlas-v2.webp');background-position-x:${x}%"></div>`;
}

function gridClass(count){if(count===1)return'cols-1';if(count===3||count===6)return'cols-3';return'cols-5';}
function sectionLabel(projectId,count){
  if(projectId==='kdp-melted-cosmos')return['BOOKS IN COLLECTION',`${count} books`];
  if(orderedSeries.has(projectId))return['BOOKS IN SERIES',`${count} books`];
  if(projectId==='kdp-workbooks')return['WORKBOOKS',`${count} titles`];
  if(projectId==='kdp-standalones')return['BOOKS / TITLES',`${count} titles`];
  return[count===1?'BOOK':'BOOKS / TITLES',`${count} ${count===1?'title':'titles'}`];
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

new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true});
client.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT'){ownerId=null;snapshot=null;return;}
  if(event==='SIGNED_IN'&&session?.user?.id!==ownerId)refresh().catch(()=>{});
});
window.addEventListener('cc7:global-refresh',()=>setTimeout(()=>refresh().catch(()=>{}),0));
refresh().catch(()=>{});
