import {
  client, getSession, signIn, signOut, isAuthorized,
  loadSnapshot, loadControlModules, loadAgentState,
  setAuto, createAgentRun, createProjectCheckpoint, requestPause, requestResume, requestStop,
  resolveApproval, subscribe
} from './data.js';
import { renderControlModule } from './control-modules.js';

const bootEl = document.getElementById('ccBoot');
const appEl = document.getElementById('ccApp');
const toastHost = document.getElementById('ccToastHost');

const state = {
  session: null,
  ownerId: null,
  snapshot: null,
  modules: null,
  agent: null,
  route: { view: 'home', projectId: null },
  unsubscribe: null,
  refreshTimer: null,
  realtimeTimer: null,
  scroll: new Map(),
  busy: false
};

const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const clamp = (n,min,max) => Math.max(min,Math.min(max,Number(n)||0));
const fmtMoney = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n||0));
const safeJson = value => { try { return typeof value === 'string' ? JSON.parse(value) : (value || null); } catch { return null; } };

function toast(message,error=false){
  const node=document.createElement('div');
  node.className=`cc-toast${error?' cc-error':''}`;
  node.textContent=message;
  toastHost.appendChild(node);
  setTimeout(()=>node.remove(),3600);
}

function projectMetrics(projectId){return (state.snapshot?.metrics||[]).filter(m=>m.project_id===projectId);}
function metric(projectId,key){return projectMetrics(projectId).find(m=>m.key===key)||null;}
function projectById(id){return (state.snapshot?.projects||[]).find(p=>p.id===id)||null;}
function projectName(id){return projectById(id)?.name||(id?'Tracked project':'Portfolio');}

function scopeInfo(project){
  const m=metric(project.id,'current_scope_progress_percent');
  if(!m||m.verified!==true||m.value_numeric===null||m.value_numeric===undefined)return{value:null,fraction:'N/A',verified:false};
  const meta=safeJson(m.value_text)||{};
  const completed=Number(meta.completed_weight),total=Number(meta.total_weight);
  return{value:clamp(m.value_numeric,0,100),fraction:Number.isFinite(completed)&&Number.isFinite(total)&&total>0?`${completed} / ${total}`:'Verified scope',verified:true};
}

function revenueInfo(project){
  const m=metric(project.id,'verified_revenue_usd');
  if(!m||m.verified!==true||m.value_numeric===null||m.value_numeric===undefined)return{value:null,label:'N/A'};
  return{value:Number(m.value_numeric),label:fmtMoney(m.value_numeric)};
}

function statusModel(project){
  const raw=String(project.status||'').trim(),s=raw.toLowerCase();
  if(s.includes('blocked'))return{label:'Blocked',cls:'blocked'};
  if(s.includes('paused'))return{label:'Paused',cls:'queued'};
  if(s.includes('published')||s.includes('live'))return{label:'Live',cls:'live'};
  if((s.includes('complete')||s.includes('ready'))&&!s.includes('progress'))return{label:'Ready',cls:'ready'};
  if(s.includes('planning')||s.includes('unverified'))return{label:'Planning',cls:'planning'};
  if(s.includes('active')||s.includes('rebuild')||s.includes('progress')||s.includes('publishing')||s.includes('writing'))return{label:'In Progress',cls:''};
  return{label:raw||'Tracked',cls:'queued'};
}
function isActiveProject(project){
  const s=String(project.status||'').toLowerCase();
  if(s.includes('paused')||s.includes('blocked'))return false;
  return/(active|live|progress|publishing|writing|rebuild)/.test(s);
}
function nextUpProjects(){
  return [...(state.snapshot?.projects||[])].filter(p=>p.attention||p.next_action).sort((a,b)=>Number(b.attention)-Number(a.attention)||(a.sort_order??999999)-(b.sort_order??999999));
}

function iconName(project){
  const text=`${project.name} ${project.category}`.toLowerCase();
  if(/book|kdp|hour|trilogy/.test(text))return'book';
  if(/ai|velo/.test(text))return'brain';
  if(/analytics|finance/.test(text))return'chart';
  if(/commerce|store|margin/.test(text))return'box';
  if(text.includes('coupon'))return'tag';
  if(text.includes('garage'))return'gear';
  if(/movie|content/.test(text))return'doc';
  if(/job|torevi/.test(text))return'people';
  if(text.includes('command center'))return'grid';
  return'folder';
}

function iconSvg(name){
  const common='viewBox="0 0 48 48" width="44" height="44" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const paths={
    book:'<path d="M7 10h12c4 0 6 2 6 6v23c0-4-2-6-6-6H7z"/><path d="M41 10H29c-4 0-6 2-6 6v23c0-4 2-6 6-6h12z"/>',
    brain:'<path d="M19 9c-5-3-10 1-9 6-5 1-6 8-2 11-3 5 1 11 7 10 1 5 8 5 10 1V14c0-5-3-7-6-5Z"/><path d="M29 9c5-3 10 1 9 6 5 1 6 8 2 11 3 5-1 11-7 10-1 5-8 5-10 1V14c0-5 3-7 6-5Z"/>',
    chart:'<path d="M9 38V27h7v11M21 38V19h7v19M33 38V10h7v28"/>',
    box:'<path d="m24 5 16 8-16 8-16-8 16-8Z"/><path d="m8 13 16 8 16-8v20l-16 8-16-8V13Z"/><path d="M24 21v20"/>',
    tag:'<path d="M8 10v14l16 16 16-16-16-16H10a2 2 0 0 0-2 2Z"/><circle cx="17" cy="17" r="3"/>',
    gear:'<circle cx="24" cy="24" r="7"/><path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.5 10.5l4.5 4.5M33 33l4.5 4.5M37.5 10.5 33 15M15 33l-4.5 4.5"/>',
    doc:'<path d="M12 6h17l8 8v28H12z"/><path d="M29 6v9h8M18 23h13M18 30h13"/>',
    people:'<circle cx="18" cy="17" r="6"/><circle cx="33" cy="19" r="5"/><path d="M7 39c1-8 6-12 12-12s11 4 12 12M29 29c7-1 12 3 13 10"/>',
    grid:'<rect x="7" y="7" width="14" height="14"/><rect x="27" y="7" width="14" height="14"/><rect x="7" y="27" width="14" height="14"/><rect x="27" y="27" width="14" height="14"/>',
    folder:'<path d="M5 13h14l4 5h20l-5 22H9z"/><path d="M5 13v-3h14l4 5h16v3"/>'
  };
  return`<svg ${common}>${paths[name]||paths.folder}</svg>`;
}
function artClass(project){
  const options=['planet','neural','bars','road','network'];
  const seed=[...String(project.id||project.name||'')].reduce((sum,c)=>sum+c.charCodeAt(0),0);
  return options[seed%options.length];
}

function header(title,subtitle,back=true){
  return`<header class="cc-header">${back?'<button class="cc-back" type="button" data-action="back" aria-label="Back"><span>‹</span></button>':`<div class="cc-icon-frame" aria-hidden="true"><div class="cc-icon">${iconSvg('grid')}</div></div>`}<div class="cc-title-wrap"><h1 class="cc-title">${esc(title)}</h1><p class="cc-subtitle">${esc(subtitle)}</p></div></header><div class="cc-rule"></div>`;
}
function statusPill(project){const s=statusModel(project);return`<span class="cc-status ${esc(s.cls)}">${esc(s.label)}</span>`;}
function moduleButton(route,title,subtitle,icon){return`<button class="cc-card cc-module" type="button" data-nav="${esc(route)}"><div class="cc-mini-icon">${iconSvg(icon)}</div><div><strong>${esc(title)}</strong><div class="cc-desc">${esc(subtitle)}</div></div><div class="cc-chevron" style="font-size:30px">›</div></button>`;}

function projectRow(project){
  const scope=scopeInfo(project);
  const progress=scope.value===null?`<div><div class="cc-progress" style="--p:0;--ring:#556575"><strong>N/A</strong></div><div class="cc-progress-meta">Scope unavailable</div></div>`:`<div><div class="cc-progress" style="--p:${scope.value};--ring:${scope.value>=90?'#00e989':'#ffb21b'}"><strong>${scope.value}%</strong></div><div class="cc-progress-meta">${esc(scope.fraction)}</div></div>`;
  return`<button class="cc-card cc-project-row" type="button" data-open-project="${esc(project.id)}"><div class="cc-icon-frame"><div class="cc-icon">${iconSvg(iconName(project))}</div></div><div class="cc-copy"><h2 class="cc-name">${esc(project.name)}</h2><p class="cc-desc">${esc(project.stage||project.category||'Tracked project')}</p>${statusPill(project)}</div>${progress}<div class="cc-chevron">›</div><div class="cc-art ${artClass(project)}"></div></button>`;
}
function liveRow(project){
  const scope=scopeInfo(project),sync=project.last_verified?`Verified ${project.last_verified}`:'Verification date N/A';
  return`<button class="cc-card cc-live-row" type="button" data-open-project="${esc(project.id)}"><div class="cc-icon-frame"><div class="cc-icon">${iconSvg(iconName(project))}</div></div><div class="cc-copy"><h2 class="cc-name">${esc(project.name)}</h2>${statusPill(project)}<p class="cc-desc" style="margin-top:10px">${esc(project.next_action||'No verified next action recorded.')}</p></div><div class="cc-scope"><strong>${scope.value===null?'N/A':`${scope.value}%`}</strong><span>Scope</span><div class="cc-live-secondary">${esc(sync)}</div></div><div class="cc-chevron">›</div><div class="cc-art ${artClass(project)}"></div></button>`;
}
function nextRow(project){return`<button class="cc-card cc-next-row" type="button" data-open-project="${esc(project.id)}"><div class="cc-icon-frame"><div class="cc-icon">${iconSvg(iconName(project))}</div></div><div class="cc-copy"><h2 class="cc-name">${esc(project.name)}</h2>${statusPill(project)}<p class="cc-desc" style="margin-top:10px">${esc(project.next_action||'No verified next action recorded.')}</p></div><div class="cc-chevron">›</div><div class="cc-art ${artClass(project)}"></div></button>`;}

function homeScreen(){
  const projects=state.snapshot?.projects||[],active=projects.filter(isActiveProject).length,next=nextUpProjects().length;
  const revenueRows=projects.map(revenueInfo).filter(r=>r.value!==null),verifiedRevenue=revenueRows.reduce((sum,r)=>sum+r.value,0);
  const agentState=state.agent?.activeRun?.status?state.agent.activeRun.status.replaceAll('_',' '):'Idle',auto=state.agent?.controls?.auto_enabled===true;
  return`<section class="cc-screen">${header('Command Center','Projects • Progress • Priorities • Performance',false)}<div class="cc-state-strip cc-card"><div class="cc-state-main"><strong>Agent ${esc(agentState)}</strong><span>${auto?'AUTO ON · eligible clean-runner work may advance':'AUTO OFF · no background Agent execution'}</span></div><button class="cc-toggle" type="button" data-action="toggle-auto" aria-pressed="${auto}"></button></div><div class="cc-home-grid"><button class="cc-card cc-home-card" data-nav="projects"><div class="cc-art planet"></div><h2>Projects</h2><p>${projects.length} tracked</p></button><button class="cc-card cc-home-card" data-nav="next"><div class="cc-art road"></div><h2>Next Up</h2><p>${next} queued actions</p></button><button class="cc-card cc-home-card" data-nav="agent"><div class="cc-art neural"></div><h2>Agent</h2><p>${auto?'AUTO ON':'AUTO OFF'} · ${esc(agentState)}</p></button><button class="cc-card cc-home-card" data-nav="revenue"><div class="cc-art bars"></div><h2>Revenue</h2><p>${revenueRows.length?fmtMoney(verifiedRevenue):'N/A'} verified</p></button></div><div class="cc-module-grid">${moduleButton('brain','Brain','Durable project context','brain')}${moduleButton('automation','Automation','Schedules and watches','gear')}${moduleButton('integrations','Integrations','Connected sources','tag')}${moduleButton('analytics','Analytics','Verified performance','chart')}${moduleButton('security','Security','Owner gates','grid')}${moduleButton('deployment','Deployment','Release state','doc')}</div><div class="cc-module-grid">${moduleButton('active','Active / Live',`${active} currently active`,'folder')}${moduleButton('about','About / Advanced','System details','grid')}</div></section>`;
}
function projectsScreen(){
  const projects=state.snapshot?.projects||[],live=projects.filter(isActiveProject).length,planning=projects.filter(p=>statusModel(p).label==='Planning').length;
  return`<section class="cc-screen">${header('Projects','Full portfolio of tracked projects')}<div class="cc-stack"><div class="cc-card cc-summary"><div class="cc-icon-frame"><div class="cc-icon">${iconSvg('folder')}</div></div><div class="cc-summary-count">${projects.length}</div><div class="cc-divider"></div><div class="cc-summary-copy"><strong>TOTAL PROJECTS</strong><span>${live} active/live • ${planning} planning • ${projects.filter(p=>p.attention).length} attention</span></div><div class="cc-chevron">›</div><div class="cc-art planet"></div></div>${projects.map(projectRow).join('')||'<div class="cc-card cc-empty">No tracked projects.</div>'}</div></section>`;
}
function activeScreen(){const list=(state.snapshot?.projects||[]).filter(isActiveProject);return`<section class="cc-screen">${header('Active / Live','Live projects in progress')}<div class="cc-stack">${list.map(liveRow).join('')||'<div class="cc-card cc-empty">No projects are currently marked active/live.</div>'}</div></section>`;}
function nextScreen(){const list=nextUpProjects();return`<section class="cc-screen">${header('Next Up','Priority queue')}<div class="cc-stack">${list.map(nextRow).join('')||'<div class="cc-card cc-empty">No verified next actions are queued.</div>'}</div></section>`;}
function revenueScreen(){
  const rows=(state.snapshot?.projects||[]).map(p=>({project:p,revenue:revenueInfo(p)})),verified=rows.filter(x=>x.revenue.value!==null),total=verified.reduce((s,x)=>s+x.revenue.value,0);
  return`<section class="cc-screen">${header('Revenue','Verified revenue only')}<div class="cc-stack"><div class="cc-card cc-summary"><div class="cc-icon-frame"><div class="cc-icon">$</div></div><div class="cc-summary-count" style="font-size:2rem">${verified.length?fmtMoney(total):'N/A'}</div><div class="cc-divider"></div><div class="cc-summary-copy"><strong>VERIFIED TOTAL</strong><span>${verified.length} projects with verified revenue records</span></div><div class="cc-chevron">›</div><div class="cc-art bars"></div></div>${rows.map(({project,revenue})=>`<button class="cc-card cc-next-row" data-open-project="${esc(project.id)}"><div class="cc-icon-frame"><div class="cc-icon">${iconSvg(iconName(project))}</div></div><div class="cc-copy"><h2 class="cc-name">${esc(project.name)}</h2><p class="cc-desc">${revenue.value===null?'Revenue source unavailable or unverified':revenue.value===0?'Verified real revenue: zero':'Verified revenue recorded'}</p></div><div class="cc-money">${esc(revenue.label)}</div><div class="cc-chevron">›</div></button>`).join('')}</div></section>`;
}

function kdpBookMap(projectId){return projectMetrics(projectId).filter(m=>m.verified===true&&m.key.startsWith('bookmap.')&&m.key.endsWith('.metadata')).map(m=>safeJson(m.value_text)).filter(Boolean).sort((a,b)=>Number(a.series_order||999)-Number(b.series_order||999));}
function kdpSnapshots(projectId){return projectMetrics(projectId).filter(m=>m.verified===true&&m.key.startsWith('kdp_snapshot.')).sort((a,b)=>String(b.key).localeCompare(String(a.key)));}
function kdpSnapshot(projectId){return kdpSnapshots(projectId)[0]||null;}
function formatMetricValue(m){if(!m||m.verified!==true)return'N/A';if(m.value_numeric!==null&&m.value_numeric!==undefined)return m.unit==='USD'?fmtMoney(m.value_numeric):`${m.value_numeric}${m.unit==='percent'?'%':''}`;return m.value_text||'N/A';}
function publicationCard(label,count,total){const complete=total>0&&count===total;return`<div class="cc-pub"><div>${esc(label)}</div><b>${count} / ${total||'N/A'}</b><span style="color:${complete?'#00e989':'#aeb9c6'}">${complete?'Published':'Verified current state'}</span></div>`;}
function infoRow(title,subtitle,icon){return`<div class="cc-card cc-row-link" role="group"><div class="cc-mini-icon">${iconSvg(icon)}</div><div><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></div></div>`;}
function detailLink(title,subtitle,icon,view,projectId){return`<button class="cc-card cc-row-link" type="button" data-detail-view="${esc(view)}" data-project-id="${esc(projectId)}"><div class="cc-mini-icon">${iconSvg(icon)}</div><div><h3>${esc(title)}</h3><p>${esc(subtitle)}</p></div><div class="cc-chevron">›</div></button>`;}
function agentLink(projectId){return`<button class="cc-card cc-row-link" type="button" data-open-agent="${esc(projectId)}"><div class="cc-mini-icon">${iconSvg('brain')}</div><div><h3>Agent Controls</h3><p>Open the clean Agent controls for this project</p></div><div class="cc-chevron">›</div></button>`;}

function missingHourDetail(project){
  const scope=scopeInfo(project),books=kdpBookMap(project.id),snap=safeJson(kdpSnapshot(project.id)?.value_text)||{},totalBooks=Number(metric(project.id,'series_books')?.value_numeric??books.length)||books.length;
  const performance=[['$',formatMetricValue(metric(project.id,'verified_revenue_usd')),'Verified revenue'],['▥',formatMetricValue(metric(project.id,'kdp_royalties_status')),'Royalties'],['♛',formatMetricValue(metric(project.id,'ku_royalties_status')),'KDP Select royalties'],['□',formatMetricValue(metric(project.id,'sales_status')),'Book sales'],['▤',snap.kenp??'N/A','Pages read'],['≡',scope.value===null?'N/A':`${scope.value}%`,'Current scope']];
  const counts={kindle:books.filter(b=>b.formats?.kindle==='live').length,select:books.filter(b=>b.kdp_select==='enrolled').length,paperback:books.filter(b=>b.formats?.paperback==='live').length,hardcover:books.filter(b=>b.formats?.hardcover==='live').length};
  const integrations=(state.snapshot?.integrations||[]).filter(i=>i.project_id===project.id);
  return`<section class="cc-screen">${header(project.name,'Project Details')}<div class="cc-stack"><div class="cc-card cc-hero"><div class="cc-hero-cover"></div><div class="cc-hero-copy"><div class="cc-hero-kicker">SCIENCE FICTION SERIES</div><h2>${esc(project.name)}</h2><p>${esc(project.stage||project.verification||'')}</p><div class="cc-meta">${totalBooks} books • KDP • verified ${esc(project.last_verified||'N/A')}</div></div><div class="cc-hero-side">${statusPill(project)}<div class="cc-chevron">›</div></div><div class="cc-art planet"></div></div><div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title"><div class="cc-mini-icon">${iconSvg('chart')}</div>KDP PERFORMANCE</div><span class="cc-section-note">Verified data</span></div><div class="cc-metrics">${performance.map(([i,v,l])=>`<div class="cc-metric"><div class="cc-mini-icon">${esc(i)}</div><div><strong>${esc(v)}</strong><span>${esc(l)}</span></div></div>`).join('')}</div></div><div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title"><div class="cc-mini-icon">${iconSvg('book')}</div>BOOKS IN SERIES</div><span class="cc-section-note">${books.length||totalBooks} books</span></div><div class="cc-covers">${books.map((b,i)=>`<div class="cc-book"><div class="cc-cover"><span class="cc-book-num">${esc(b.series_order||i+1)}</span></div><div class="cc-book-name">${esc(b.title||`Book ${i+1}`)}</div></div>`).join('')||'<div class="cc-empty">Book map unavailable.</div>'}</div></div><div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title"><div class="cc-mini-icon">${iconSvg('doc')}</div>PUBLICATION STATUS</div></div><div class="cc-pub-grid">${publicationCard('Kindle eBook',counts.kindle,totalBooks)}${publicationCard('KDP Select',counts.select,totalBooks)}${publicationCard('Paperback',counts.paperback,totalBooks)}${publicationCard('Hardcover',counts.hardcover,totalBooks)}</div></div>${detailLink('KDP Snapshot History',kdpSnapshot(project.id)?.verified?`Latest verified snapshot: ${kdpSnapshot(project.id).key.replace('kdp_snapshot.','')}`:'No verified KDP snapshot available','chart','kdp-history',project.id)}${detailLink('Tracking Integrations',`${integrations.length} tracked integration records`,'tag','tracking-integrations',project.id)}${infoRow('Next Action',project.next_action||'No verified next action recorded','doc')}${agentLink(project.id)}</div></section>`;
}

function genericProjectDetail(project){
  const scope=scopeInfo(project),revenue=revenueInfo(project),ints=(state.snapshot?.integrations||[]).filter(i=>i.project_id===project.id);
  return`<section class="cc-screen">${header(project.name,'Project Details')}<div class="cc-stack"><div class="cc-card cc-hero"><div class="cc-hero-cover"></div><div class="cc-hero-copy"><div class="cc-hero-kicker">${esc(project.category||'PROJECT')}</div><h2>${esc(project.name)}</h2><p>${esc(project.stage||project.verification||'')}</p><div class="cc-meta">Last verified ${esc(project.last_verified||'N/A')}</div></div><div class="cc-hero-side">${statusPill(project)}<div class="cc-chevron">›</div></div><div class="cc-art ${artClass(project)}"></div></div><div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title"><div class="cc-mini-icon">${iconSvg('chart')}</div>PROJECT PERFORMANCE</div></div><div class="cc-metrics"><div class="cc-metric"><div class="cc-mini-icon">%</div><div><strong>${scope.value===null?'N/A':`${scope.value}%`}</strong><span>Current scope</span></div></div><div class="cc-metric"><div class="cc-mini-icon">$</div><div><strong>${esc(revenue.label)}</strong><span>Verified revenue</span></div></div><div class="cc-metric"><div class="cc-mini-icon">${iconSvg('tag')}</div><div><strong>${ints.length}</strong><span>Integrations</span></div></div></div></div>${infoRow('Next Action',project.next_action||'No verified next action recorded','doc')}${infoRow('Blocker / Integrity',project.blocker||'No blocker recorded','gear')}${infoRow('Verification',project.verification||'No verification summary recorded','grid')}${detailLink('Tracking Integrations',`${ints.length} tracked integration records`,'tag','tracking-integrations',project.id)}${agentLink(project.id)}</div></section>`;
}
function projectScreen(projectId){const project=projectById(projectId);if(!project)return`<section class="cc-screen">${header('Project','Not found')}<div class="cc-card cc-empty">This project is not present in the clean data model.</div></section>`;return project.id==='kdp-missing-hour'?missingHourDetail(project):genericProjectDetail(project);}

function kdpHistoryScreen(projectId){
  const project=projectById(projectId),snapshots=kdpSnapshots(projectId);
  if(!project)return`<section class="cc-screen">${header('KDP Snapshot History','Project not found')}<div class="cc-card cc-empty">This project is not present in V7.</div></section>`;
  return`<section class="cc-screen">${header('KDP Snapshot History',project.name)}<div class="cc-stack">${snapshots.length?snapshots.map(m=>{const s=safeJson(m.value_text)||{};return`<div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title"><div class="cc-mini-icon">${iconSvg('chart')}</div>${esc(m.key.replace('kdp_snapshot.',''))}</div><span class="cc-section-note">Verified</span></div><div class="cc-metrics"><div class="cc-metric"><div class="cc-mini-icon">#</div><div><strong>${esc(s.orders??'N/A')}</strong><span>Orders</span></div></div><div class="cc-metric"><div class="cc-mini-icon">$</div><div><strong>${s.royalties_usd===0||s.royalties_usd?esc(fmtMoney(s.royalties_usd)):'N/A'}</strong><span>Royalties</span></div></div><div class="cc-metric"><div class="cc-mini-icon">▤</div><div><strong>${esc(s.kenp??'N/A')}</strong><span>KENP pages</span></div></div></div><div class="cc-module-item" style="margin-top:10px"><strong>${esc(s.period_start||'N/A')} → ${esc(s.period_end||'N/A')}</strong><p>${esc(s.scope||m.label||'Verified KDP snapshot')}</p><small>${esc(m.source||'Verified source recorded')}</small></div></div>`;}).join(''):'<div class="cc-card cc-empty">No verified KDP snapshots are available.</div>'}</div></section>`;
}

function trackingIntegrationsScreen(projectId){
  const project=projectById(projectId),items=(state.snapshot?.integrations||[]).filter(i=>i.project_id===projectId);
  if(!project)return`<section class="cc-screen">${header('Tracking Integrations','Project not found')}<div class="cc-card cc-empty">This project is not present in V7.</div></section>`;
  return`<section class="cc-screen">${header('Tracking Integrations',project.name)}<div class="cc-stack">${items.length?items.map(i=>`<div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title"><div class="cc-mini-icon">${iconSvg('tag')}</div>${esc(i.provider||'Integration')}</div><span class="cc-section-note">${esc(i.status||'Unknown')}</span></div><div class="cc-module-item"><strong>${esc(i.metric_label||i.metric_key||'Tracked source')}</strong><p>${esc(i.integration_mode||'Mode unavailable')} • ${i.requires_user_authorization?'Owner authorization required':'No owner authorization currently required'}</p><small>${esc(i.last_checked_at?`Last checked ${i.last_checked_at}`:'No verified check time')}</small></div>${i.next_step?`<div class="cc-module-item" style="margin-top:10px"><strong>Next source action</strong><p>${esc(i.next_step)}</p></div>`:''}</div>`).join(''):'<div class="cc-card cc-empty">No tracked integration records are available for this project.</div>'}</div></section>`;
}

function agentStatusLabel(agent){if(!agent?.heartbeat)return'Runner offline / not yet verified';const age=Date.now()-new Date(agent.heartbeat.last_seen_at).getTime();if(!Number.isFinite(age)||age>90*60*1000)return'Runner heartbeat stale';return`Runner ${agent.heartbeat.status}`;}
function agentAction(action,title,desc,disabled=false){return`<button class="cc-btn cc-control" type="button" data-agent-action="${esc(action)}" ${disabled?'disabled':''}><strong>${esc(title)}</strong><span>${esc(desc)}</span></button>`;}
function agentControl(mode,title,desc){return`<button class="cc-btn cc-control" type="button" data-agent-create="${esc(mode)}"><strong>${esc(title)}</strong><span>${esc(desc)}</span></button>`;}
function agentScreen(projectId=null){
  const a=state.agent||{},controls=a.controls||{auto_enabled:false,runner_state:'idle'},run=a.activeRun||null;
  const selectedProject=projectId||run?.project_id||'';
  const currentTask=(a.tasks||[]).find(t=>t.status==='working')||(a.tasks||[]).find(t=>t.status==='pending')||null;
  const verified=(a.tasks||[]).filter(t=>t.status==='verified').length,total=(a.tasks||[]).length,checkpoint=a.checkpoints?.[0]||a.latestCheckpoint||null;
  const options=(state.snapshot?.projects||[]).map(p=>`<option value="${esc(p.id)}" ${p.id===selectedProject?'selected':''}>${esc(p.name)}</option>`).join('');
  return`<section class="cc-screen">${header('Agent','Owner-controlled execution')}<div class="cc-stack"><div class="cc-state-strip cc-card"><div class="cc-state-main"><strong>AUTO ${controls.auto_enabled?'ON':'OFF'}</strong><span>${controls.auto_enabled?'Clean runner may advance eligible queued work.':'No background Agent execution is authorized.'}</span><span>${esc(agentStatusLabel(a))}</span></div><button class="cc-toggle" type="button" data-action="toggle-auto" aria-pressed="${controls.auto_enabled===true}"></button></div><div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title">AGENT SCOPE</div><span class="cc-section-note">Explicit owner target</span></div><label class="cc-field">Project<select id="ccAgentProjectSelector"><option value="">Portfolio / all tracked projects</option>${options}</select></label><p class="cc-desc" style="margin-top:8px">Execution runs are locked to the selected project. Project Checkpoint is read-only and may review the selected project or the full portfolio instantly.</p></div><div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title"><div class="cc-mini-icon">${iconSvg('brain')}</div>CURRENT RUN</div><span class="cc-section-note">${run?esc(run.status):'Idle'}</span></div>${run?`<div class="cc-metrics"><div class="cc-metric"><div class="cc-mini-icon">${iconSvg('folder')}</div><div><strong>${esc(projectName(run.project_id))}</strong><span>Project</span></div></div><div class="cc-metric"><div class="cc-mini-icon">${iconSvg('doc')}</div><div><strong>${verified}/${total||0}</strong><span>Verified steps</span></div></div><div class="cc-metric"><div class="cc-mini-icon">›</div><div><strong>${esc(currentTask?.title||run.exact_next_action||'Awaiting clean runner')}</strong><span>Current / next task</span></div></div></div><p class="cc-desc" style="margin-top:12px">${esc(run.objective)}</p><div class="cc-agent-controls" style="margin-top:12px">${run.pause_requested?agentAction('resume','Resume','Allow the clean runner to continue.'):agentAction('pause','Pause','Stop before the next unstarted side effect.')}${agentAction('stop','Stop Agent','Preserve verified work and stop unstarted work.')}</div>`:'<div class="cc-empty">No clean Agent run is active.</div>'}</div>${checkpoint?`<div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title"><div class="cc-mini-icon">${iconSvg('doc')}</div>LATEST CHECKPOINT</div><span class="cc-section-note">${esc(checkpoint.created_at||'')}</span></div><div class="cc-module-item"><strong>${esc(checkpoint.project_id?projectName(checkpoint.project_id):'Portfolio')}</strong><p>${esc(checkpoint.summary)}</p><small>${esc(checkpoint.exact_next_action||'No next action recorded')}</small></div></div>`:''}<div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title">OWNER CONTROLS</div><span class="cc-section-note">Fresh V7 execution path</span></div><div class="cc-agent-controls">${agentControl('next_step','Next Step','Run exactly the next verified project step.')}${agentControl('until_work','Until Work / Next Work Boundary','Advance in normal chat until the first genuine Work-only boundary.')}${agentControl('manual_task','Manual Task','Run one exact task you specify.')}${agentControl('project_checkpoint','Project Checkpoint','Instant status review only. No execution or side effects.')}${agentAction('stop','Stop Agent','Stop the current run without discarding verified work.',!run)}${agentAction('refresh','Refresh','Reload the clean Agent state now.')}</div></div>${(a.approvals||[]).filter(x=>x.state==='required').map(ap=>`<div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title">APPROVAL REQUIRED</div><span class="cc-section-note">${esc(ap.approval_type)}</span></div><p class="cc-desc">${esc(ap.reason||'Exact-step approval required.')}</p><div class="cc-agent-controls" style="margin-top:12px"><button class="cc-btn primary" data-approval="${esc(ap.id)}" data-approved="true">Approve exact step</button><button class="cc-btn" data-approval="${esc(ap.id)}" data-approved="false">Decline</button></div></div>`).join('')}</div></section>`;
}

function moduleScreen(view){
  const meta={brain:['Brain','Project memory, plans, tasks, and context'],automation:['Automation','Schedules, conditions, workflows, and notifications'],integrations:['Integrations','Connected services and tracked source requirements'],analytics:['Analytics','Verified project and portfolio performance'],security:['Security','Permissions, approvals, and alerts'],deployment:['Deployment','Releases, checks, and rollback state'],about:['About / Advanced','Clean-room Command Center V7']};
  const [title,subtitle]=meta[view]||['Command Center','Module'];
  const body=renderControlModule(view,state.modules,state.snapshot?.projects||[],state.snapshot?.integrations||[]);
  return`<section class="cc-screen">${header(title,subtitle)}<div class="cc-stack">${body}</div></section>`;
}

function parseRoute(){const q=new URLSearchParams(location.search);return{view:q.get('view')||'home',projectId:q.get('project')||null};}
function routeUrl(route){const q=new URLSearchParams();if(route.view&&route.view!=='home')q.set('view',route.view);if(route.projectId)q.set('project',route.projectId);return`${location.pathname}${q.toString()?`?${q}`:''}`;}
function navigate(view,projectId=null,replace=false){state.scroll.set(routeUrl(state.route),window.scrollY);state.route={view,projectId};const url=routeUrl(state.route);if(replace)history.replaceState(state.route,'',url);else history.pushState(state.route,'',url);render();requestAnimationFrame(()=>window.scrollTo({top:state.scroll.get(url)||0,behavior:'instant'}));}

function render(){
  if(!state.session){renderLogin();return;}
  const r=state.route;
  let html;
  if(r.view==='home')html=homeScreen();
  else if(r.view==='projects')html=projectsScreen();
  else if(r.view==='active')html=activeScreen();
  else if(r.view==='next')html=nextScreen();
  else if(r.view==='revenue')html=revenueScreen();
  else if(r.view==='project')html=projectScreen(r.projectId);
  else if(r.view==='kdp-history')html=kdpHistoryScreen(r.projectId);
  else if(r.view==='tracking-integrations')html=trackingIntegrationsScreen(r.projectId);
  else if(r.view==='agent')html=agentScreen(r.projectId);
  else html=moduleScreen(r.view);
  appEl.innerHTML=html;appEl.hidden=false;bootEl.hidden=true;
}
function renderLogin(message=''){bootEl.hidden=true;appEl.hidden=false;appEl.innerHTML=`<section class="cc-login"><div class="cc-card cc-login-card"><h1>Command Center</h1><p class="cc-desc">Secure owner sign in</p><form class="cc-form" id="ccLogin"><label>Email<input name="email" type="email" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button class="cc-btn primary" type="submit">Sign in</button>${message?`<div class="cc-error">${esc(message)}</div>`:''}</form></div></section>`;}

async function refreshAll(silent=false){
  if(!state.ownerId||state.busy)return;
  state.busy=true;
  try{
    const [snapshot,modules,agent]=await Promise.all([loadSnapshot(state.ownerId),loadControlModules(state.ownerId),loadAgentState(state.ownerId)]);
    state.snapshot=snapshot;state.modules=modules;state.agent=agent;render();if(!silent)toast('Command Center refreshed.');
  }catch(error){toast(error?.message||'Refresh failed.',true);}finally{state.busy=false;}
}

async function handleAgentCreate(button){
  const mode=button.dataset.agentCreate;
  const projectId=document.getElementById('ccAgentProjectSelector')?.value||state.route.projectId||null;
  const project=projectId?projectById(projectId):null;
  if(mode==='project_checkpoint'){
    const result=await createProjectCheckpoint(state.ownerId,projectId);
    await refreshAll(true);
    toast(`${project?.name||'Portfolio'} checkpoint complete.`);
    return result;
  }
  let objective;
  if(mode==='next_step')objective=project?.next_action||prompt('What exact next step should Agent run?');
  else if(mode==='until_work')objective=project?`Advance ${project.name} from its verified current state through normal-chat work until the first genuine Work-only boundary. Current next action: ${project.next_action||'N/A'}`:prompt('What exact project/task should Agent advance until the next genuine Work boundary?');
  else objective=prompt('Enter the exact manual task for Agent.');
  if(!objective)return;
  const booksTarget=project&&/book|kdp/i.test(project.category||'')?prompt('Exact allowed Books target (required for Books Agent work):',project.name):null;
  if(project&&/book|kdp/i.test(project.category||'')&&!booksTarget){toast('Books Agent work requires an exact target.',true);return;}
  await createAgentRun({ownerId:state.ownerId,projectId,objective,controlMode:mode,booksTarget,allowWork:mode==='until_work'});
  await refreshAll(true);
  toast('Clean Agent run queued. It will not be shown as working until the V7 runner actually claims it.');
}

async function handleAction(target){
  if(target.closest('[data-action="back"]')){if(history.length>1)history.back();else navigate('home',null,true);return;}
  const nav=target.closest('[data-nav]');if(nav){navigate(nav.dataset.nav);return;}
  const detail=target.closest('[data-detail-view]');if(detail){navigate(detail.dataset.detailView,detail.dataset.projectId||null);return;}
  const open=target.closest('[data-open-project]');if(open){navigate('project',open.dataset.openProject);return;}
  const openAgent=target.closest('[data-open-agent]');if(openAgent){navigate('agent',openAgent.dataset.openAgent);return;}
  const toggle=target.closest('[data-action="toggle-auto"]');if(toggle){const next=!(state.agent?.controls?.auto_enabled===true);await setAuto(state.ownerId,next);await refreshAll(true);toast(`AUTO ${next?'ON':'OFF'} verified in the clean control table.`);return;}
  const create=target.closest('[data-agent-create]');if(create){await handleAgentCreate(create);return;}
  const agentButton=target.closest('[data-agent-action]');if(agentButton){const action=agentButton.dataset.agentAction,run=state.agent?.activeRun;if(action==='refresh'){await refreshAll();return;}if(!run)return;if(action==='pause')await requestPause(state.ownerId,run.id);if(action==='resume')await requestResume(state.ownerId,run.id);if(action==='stop')await requestStop(state.ownerId,run.id);await refreshAll(true);toast(action==='stop'?'Agent stopped. Verified work remains preserved.':`${action} request saved.`);return;}
  const approval=target.closest('[data-approval]');if(approval){await resolveApproval(state.ownerId,approval.dataset.approval,approval.dataset.approved==='true');await refreshAll(true);toast('Exact-step approval state updated.');}
}

appEl.addEventListener('click',event=>handleAction(event.target).catch(error=>toast(error?.message||String(error),true)));
appEl.addEventListener('submit',event=>{if(event.target.id!=='ccLogin')return;event.preventDefault();const form=new FormData(event.target);signIn(form.get('email'),form.get('password')).then(async session=>{if(!session)throw new Error('Sign in did not return a session.');await enterSession(session);}).catch(error=>renderLogin(error?.message||'Sign in failed.'));});
window.addEventListener('popstate',()=>{state.route=parseRoute();render();requestAnimationFrame(()=>window.scrollTo({top:state.scroll.get(routeUrl(state.route))||0,behavior:'instant'}));});

async function enterSession(session){
  state.session=session;state.ownerId=session.user.id;
  if(!(await isAuthorized(state.ownerId))){await signOut().catch(()=>{});state.session=null;state.ownerId=null;renderLogin('This account is not enabled for the clean Command Center.');return;}
  state.route=parseRoute();
  const [snapshot,modules,agent]=await Promise.all([loadSnapshot(state.ownerId),loadControlModules(state.ownerId),loadAgentState(state.ownerId)]);
  state.snapshot=snapshot;state.modules=modules;state.agent=agent;
  state.unsubscribe?.();state.unsubscribe=subscribe(state.ownerId,()=>{clearTimeout(state.realtimeTimer);state.realtimeTimer=setTimeout(()=>refreshAll(true),250);});
  clearInterval(state.refreshTimer);state.refreshTimer=setInterval(()=>{if(!document.hidden)refreshAll(true);},60000);
  history.replaceState(state.route,'',routeUrl(state.route));render();
}
async function boot(){try{const session=await getSession();if(!session){renderLogin();return;}await enterSession(session);}catch(error){bootEl.textContent=`Command Center startup failed: ${error?.message||String(error)}`;}}
client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'){state.unsubscribe?.();state.unsubscribe=null;state.session=null;state.ownerId=null;state.snapshot=null;state.modules=null;state.agent=null;renderLogin();}else if(event==='SIGNED_IN'&&session&&session.user.id!==state.ownerId){enterSession(session).catch(error=>renderLogin(error?.message||'Session load failed.'));}});
boot();
