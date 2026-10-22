const safeText=value=>String(value??'');
const fmtMoney=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value||0));
const statusLabel=project=>{
  const raw=safeText(project?.status).trim(),s=raw.toLowerCase();
  if(s.includes('blocked'))return'Blocked';
  if(s.includes('paused'))return'Paused';
  if(s.includes('published')||s.includes('live'))return'Live';
  if((s.includes('complete')||s.includes('ready'))&&!s.includes('progress'))return'Ready';
  if(s.includes('planning')||s.includes('unverified'))return'Planning';
  if(/active|rebuild|progress|publishing|writing/.test(s))return'In Progress';
  return raw||'Tracked';
};
const isActive=project=>{
  const s=safeText(project?.status).toLowerCase();
  return !s.includes('paused')&&!s.includes('blocked')&&/(active|live|progress|publishing|writing|rebuild)/.test(s);
};

function metricFor(snapshot,projectId,key){return (snapshot?.metrics||[]).find(m=>m.project_id===projectId&&m.key===key)||null;}
function verifiedScope(snapshot,project){
  const m=metricFor(snapshot,project.id,'current_scope_progress_percent');
  return m?.verified===true&&m.value_numeric!==null&&m.value_numeric!==undefined?Number(m.value_numeric):null;
}
function verifiedRevenue(snapshot,project){
  const m=metricFor(snapshot,project.id,'verified_revenue_usd');
  return m?.verified===true&&m.value_numeric!==null&&m.value_numeric!==undefined?Number(m.value_numeric):null;
}
function metricCell(icon,value,label,{iconSvg,esc}){
  const iconHtml=iconSvg&&/^[a-z]+$/.test(icon)?iconSvg(icon):esc(icon);
  return`<div class="cc-metric"><div class="cc-mini-icon">${iconHtml}</div><div><strong>${esc(value)}</strong><span>${esc(label)}</span></div></div>`;
}
function infoCard(title,text,icon,{iconSvg,esc}){
  return`<div class="cc-card cc-row-link" role="group"><div class="cc-mini-icon">${iconSvg(icon)}</div><div><h3>${esc(title)}</h3><p>${esc(text||'N/A')}</p></div></div>`;
}

export function renderPortfolioOverview(snapshot,helpers){
  const {header,iconSvg,esc}=helpers;
  const projects=snapshot?.projects||[];
  const active=projects.filter(isActive).length;
  const planning=projects.filter(p=>statusLabel(p)==='Planning').length;
  const blocked=projects.filter(p=>statusLabel(p)==='Blocked').length;
  const attention=projects.filter(p=>p.attention===true).length;
  const scopeValues=projects.map(p=>verifiedScope(snapshot,p));
  const verifiedScopeCount=scopeValues.filter(v=>v!==null).length;
  const revenueValues=projects.map(p=>verifiedRevenue(snapshot,p));
  const verifiedRevenueValues=revenueValues.filter(v=>v!==null);
  const verifiedRevenueTotal=verifiedRevenueValues.reduce((sum,v)=>sum+v,0);
  const integrations=(snapshot?.integrations||[]).length;
  const attentionProjects=projects.filter(p=>p.attention===true||p.blocker).sort((a,b)=>Number(b.attention)-Number(a.attention)||(a.sort_order??999999)-(b.sort_order??999999));
  const recent=(snapshot?.activity||[]).filter(a=>projects.some(p=>p.id===a.project_id)).slice(0,12);
  return`<section class="cc-screen">${header('Portfolio Overview','Verified portfolio state')}<div class="cc-stack"><div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title"><div class="cc-mini-icon">${iconSvg('folder')}</div>PORTFOLIO STATE</div><span class="cc-section-note">Clean V7 data</span></div><div class="cc-metrics">${metricCell('#',projects.length,'Tracked projects',helpers)}${metricCell('folder',active,'Active / live',helpers)}${metricCell('brain',attention,'Attention',helpers)}${metricCell('chart',verifiedScopeCount,'Verified scope records',helpers)}${metricCell('$',verifiedRevenueValues.length?fmtMoney(verifiedRevenueTotal):'N/A','Verified revenue total',helpers)}${metricCell('tag',integrations,'Tracked integrations',helpers)}</div></div><div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title">STATUS MIX</div><span class="cc-section-note">Current project records</span></div><div class="cc-metrics">${metricCell('folder',active,'Active / live',helpers)}${metricCell('brain',planning,'Planning',helpers)}${metricCell('!',blocked,'Blocked',helpers)}</div></div><div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title">NEEDS ATTENTION</div><span class="cc-section-note">${attentionProjects.length} projects</span></div>${attentionProjects.length?attentionProjects.map(p=>`<button class="cc-module-item cc-overview-link" type="button" data-open-project="${esc(p.id)}"><strong>${esc(p.name)}</strong><p>${esc(p.blocker||p.next_action||'Attention is flagged; no explanatory text is recorded.')}</p><small>${esc(statusLabel(p))}</small></button>`).join(''):'<div class="cc-empty">No projects are currently flagged for attention.</div>'}</div><div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title">RECENT VERIFIED ACTIVITY</div><span class="cc-section-note">Latest records</span></div>${recent.length?recent.map(a=>`<div class="cc-module-item"><strong>${esc(a.headline||'Project activity')}</strong><p>${esc(a.detail||projectNameFrom(projects,a.project_id))}</p><small>${esc(a.happened_at||'Time unavailable')}</small></div>`).join(''):'<div class="cc-empty">No recent clean activity records are available.</div>'}</div></div></section>`;
}

function projectNameFrom(projects,id){return projects.find(p=>p.id===id)?.name||'Tracked project';}

export function renderProjectSnapshot(project,snapshot,helpers){
  const {header,iconSvg,esc,statusPill}=helpers;
  if(!project)return`<section class="cc-screen">${header('Project Snapshot','Project not found')}<div class="cc-card cc-empty">This project is not present in V7.</div></section>`;
  const scope=verifiedScope(snapshot,project);
  const revenue=verifiedRevenue(snapshot,project);
  const integrations=(snapshot?.integrations||[]).filter(i=>i.project_id===project.id);
  const activity=(snapshot?.activity||[]).filter(a=>a.project_id===project.id).slice(0,12);
  return`<section class="cc-screen">${header(project.name,'Project Snapshot')}<div class="cc-stack"><div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title"><div class="cc-mini-icon">${iconSvg('grid')}</div>CURRENT VERIFIED STATE</div>${statusPill(project)}</div><div class="cc-metrics">${metricCell('%',scope===null?'N/A':`${scope}%`,'Current scope',helpers)}${metricCell('$',revenue===null?'N/A':fmtMoney(revenue),'Verified revenue',helpers)}${metricCell('tag',integrations.length,'Tracked integrations',helpers)}</div></div>${infoCard('Next Action',project.next_action||'No verified next action recorded.','doc',helpers)}${infoCard('Blocker / Integrity',project.blocker||'No blocker recorded.','gear',helpers)}${infoCard('Verification',project.verification||'No verification summary recorded.','grid',helpers)}<button class="cc-card cc-row-link" type="button" data-detail-view="tracking-integrations" data-project-id="${esc(project.id)}"><div class="cc-mini-icon">${iconSvg('tag')}</div><div><h3>Tracking Integrations</h3><p>${integrations.length} tracked integration records</p></div><div class="cc-chevron">›</div></button><button class="cc-card cc-row-link" type="button" data-open-agent="${esc(project.id)}"><div class="cc-mini-icon">${iconSvg('brain')}</div><div><h3>Agent Controls</h3><p>Open the clean Agent controls for this exact project.</p></div><div class="cc-chevron">›</div></button><div class="cc-card cc-section"><div class="cc-section-head"><div class="cc-section-title">RECENT ACTIVITY</div><span class="cc-section-note">${activity.length} records</span></div>${activity.length?activity.map(a=>`<div class="cc-module-item"><strong>${esc(a.headline||'Project activity')}</strong><p>${esc(a.detail||'No detail recorded.')}</p><small>${esc(a.happened_at||'Time unavailable')}</small></div>`).join(''):'<div class="cc-empty">No recent activity records are available.</div>'}</div></div></section>`;
}
