import { client, loadSnapshot } from './data.js';

let snapshot=null;
let loading=false;
let customRendering=false;

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const isBook=project=>String(project?.id||'').startsWith('kdp-')||String(project?.category||'').toLowerCase().includes('amazon books');
const isHidden=project=>String(project?.source_status||'').startsWith('filing_only_hidden');
const isSeries=project=>/(trilogy|saga|series|collection)/i.test(String(project?.name||''));
const agentAllowed=project=>project?.agent_access_enabled!==false;
const visibleBooks=()=>((snapshot?.projects)||[]).filter(p=>isBook(p)&&!isHidden(p));
const projectById=id=>((snapshot?.projects)||[]).find(p=>p.id===id)||null;
const sorted=list=>[...list].sort((a,b)=>(a.sort_order??999999)-(b.sort_order??999999)||String(a.name).localeCompare(String(b.name)));

const bookIcon=`<svg viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10h12c4 0 6 2 6 6v23c0-4-2-6-6-6H7z"/><path d="M41 10H29c-4 0-6 2-6 6v23c0-4 2-6 6-6h12z"/></svg>`;

function row({title,subtitle,status='',openProject=null,booksHub=false,individualHub=false}){
  const attrs=openProject?`data-open-project="${esc(openProject)}"`:booksHub?'data-books-hub="true"':individualHub?'data-individual-books-hub="true"':'';
  return `<button class="cc-card cc-project-row" type="button" ${attrs}><div class="cc-icon-frame"><div class="cc-icon">${bookIcon}</div></div><div class="cc-copy"><h2 class="cc-name">${esc(title)}</h2><p class="cc-desc">${esc(subtitle)}</p>${status?`<span class="cc-status queued">${esc(status)}</span>`:''}</div><div class="cc-chevron">›</div></button>`;
}

function header(title,subtitle){
  return `<header class="cc-header"><button class="cc-back" type="button" data-action="back" aria-label="Back"><span>‹</span></button><div class="cc-title-wrap"><h1 class="cc-title">${esc(title)}</h1><p class="cc-subtitle">${esc(subtitle)}</p></div></header><div class="cc-rule"></div>`;
}

function pushCustom(view){
  const q=new URLSearchParams(location.search);
  q.set('view',view);
  q.delete('project');
  history.pushState({view},'',`${location.pathname}?${q}`);
  renderCustomRoute(true);
}

function renderBooksHub(){
  const app=document.getElementById('ccApp');
  if(!app)return;
  const books=visibleBooks();
  const series=sorted(books.filter(isSeries));
  const individuals=sorted(books.filter(p=>!isSeries(p)));
  app.hidden=false;
  app.dataset.ccBooksView='books-hub';
  app.innerHTML=`<section class="cc-screen cc-books-screen">${header('Books','Series, trilogies, collections, and individual books')}<div class="cc-stack">${series.map(p=>row({title:p.name,subtitle:p.stage||p.status||'Tracked book project',status:'Manual Agent only',openProject:p.id})).join('')}${row({title:'Individual Books',subtitle:`${individuals.length} independently tracked titles`,status:'Open to choose a title',individualHub:true})}</div></section>`;
}

function renderIndividuals(){
  const app=document.getElementById('ccApp');
  if(!app)return;
  const individuals=sorted(visibleBooks().filter(p=>!isSeries(p)));
  app.hidden=false;
  app.dataset.ccBooksView='books-individual';
  app.innerHTML=`<section class="cc-screen cc-books-screen">${header('Individual Books','Open one exact title to view it or start Project Auto manually')}<div class="cc-stack">${individuals.map(p=>row({title:p.name,subtitle:p.stage||p.status||'Tracked individual book',status:'Manual Agent only',openProject:p.id})).join('')||'<div class="cc-card cc-empty">No individual books are currently tracked.</div>'}</div></section>`;
}

function renderCustomRoute(force=false){
  if(customRendering)return;
  const view=new URLSearchParams(location.search).get('view');
  if(!['books-hub','books-individual'].includes(view))return;
  const app=document.getElementById('ccApp');
  if(!force&&app?.dataset?.ccBooksView===view)return;
  customRendering=true;
  try{view==='books-hub'?renderBooksHub():renderIndividuals();}finally{customRendering=false;}
}

function enhanceProjects(){
  const screen=[...document.querySelectorAll('.cc-screen')].find(node=>node.querySelector('.cc-title')?.textContent?.trim()==='Projects');
  if(!screen)return;
  const stack=screen.querySelector('.cc-stack');
  if(!stack)return;
  const books=visibleBooks();
  const bookIds=new Set(books.map(p=>p.id));
  let firstBookRow=null;
  stack.querySelectorAll('[data-open-project]').forEach(button=>{
    if(bookIds.has(button.dataset.openProject)){
      if(!firstBookRow)firstBookRow=button;
      button.remove();
    }
  });
  if(!stack.querySelector('[data-books-hub]')&&books.length){
    const card=document.createElement('div');
    card.innerHTML=row({title:'Books',subtitle:`${books.length} tracked titles and book projects`,status:'Open book library',booksHub:true});
    const button=card.firstElementChild;
    const summary=stack.querySelector('.cc-summary');
    if(summary?.nextSibling)stack.insertBefore(button,summary.nextSibling);else if(summary)stack.appendChild(button);else stack.prepend(button);
  }
}

function enhanceAgentSelector(){
  const screen=[...document.querySelectorAll('.cc-screen')].find(node=>node.querySelector('.cc-title')?.textContent?.trim()==='Agent');
  const selector=screen?.querySelector('#ccAgentProjectSelector');
  if(!selector)return;
  const current=selector.value||new URLSearchParams(location.search).get('project')||'';
  const currentProject=projectById(current);
  const nonBooks=sorted((snapshot?.projects||[]).filter(p=>!isBook(p)&&!isHidden(p)&&agentAllowed(p)));
  const opts=['<option value="">Portfolio / eligible non-book projects</option>'];
  opts.push(...nonBooks.map(p=>`<option value="${esc(p.id)}" ${p.id===current?'selected':''}>${esc(p.name)}</option>`));
  if(currentProject&&isBook(currentProject)&&!isHidden(currentProject)&&agentAllowed(currentProject)){
    opts.push(`<optgroup label="Book — manual only"><option value="${esc(currentProject.id)}" selected>${esc(currentProject.name)}</option></optgroup>`);
  }
  const next=opts.join('');
  if(selector.innerHTML!==next)selector.innerHTML=next;
  screen.classList.add('cc-agent-readable');
}

function apply(){
  renderCustomRoute();
  if(!snapshot)return;
  enhanceProjects();
  enhanceAgentSelector();
}

async function refreshSnapshot(){
  if(loading)return;
  loading=true;
  try{
    const {data,error}=await client.auth.getSession();
    if(error)throw error;
    const ownerId=data.session?.user?.id;
    if(!ownerId)return;
    snapshot=await loadSnapshot(ownerId);
    apply();
  }catch{}finally{loading=false;}
}

document.addEventListener('click',event=>{
  const books=event.target.closest('[data-books-hub]');
  if(books){event.preventDefault();event.stopPropagation();pushCustom('books-hub');return;}
  const individuals=event.target.closest('[data-individual-books-hub]');
  if(individuals){event.preventDefault();event.stopPropagation();pushCustom('books-individual');}
},true);

window.addEventListener('popstate',()=>setTimeout(()=>renderCustomRoute(true),0));
window.addEventListener('cc7:global-refresh',()=>refreshSnapshot());
new MutationObserver(()=>apply()).observe(document.documentElement,{childList:true,subtree:true});
client.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN')refreshSnapshot();if(event==='SIGNED_OUT'){snapshot=null;}});
refreshSnapshot();
apply();
