(() => {
  if (window.COMMAND_CENTER_APPROVED_UI) return;
  window.COMMAND_CENTER_APPROVED_UI = { version: 1 };

  const TOOLS = ['normal_chat','research','files','github','supabase','automation','integration','analytics','security','deployment','work'];
  const ACTIVE = new Set(['draft','active','paused','blocked','needs_user_action','partially_completed']);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const fmtMoney = value => new Intl.NumberFormat(undefined,{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2}).format(Number(value || 0));
  const fmtNum = value => new Intl.NumberFormat().format(Number(value || 0));
  const pretty = value => String(value || 'N/A').replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
  const client = () => window.COMMAND_CENTER_SUPABASE || null;
  const state = { projects:[], kpis:[], opportunities:[], route:'home', projectId:null, legacy:false, loading:false, loadedAt:0, timer:null };

  const coverIndexes = new Map([
    ['Strange Worlds',0],['Dreambeast Atlas',1],['Rooms Beyond Geometry',2],['Fungal Realms',3],['Neon Dreadscapes',4],['Electric Eden',5],['Cities That Dream',6],['Cathedral of Impossible Things',7],['Celestial Oddities',8],['Mechanical Dreams',9],
    ['Daily Progress Planner',10],['A Stronger You',11],['Simple Budgeting Workbook',12],['Take Control of Your Money',13],['Garage Door Business Blueprint',14],
    ['Pieces I Never Got Back',15],['A Calmer Mind',16],['Broken But Still Here',17],['Moving Forward Anyway',18],['The Alpha Mindset',19],
    ['The Map Beneath the Tide',20],['The Kingdom Under Black Water',21],['The Crown of the Drowned',22],
    ['The Unlived Hour',23],['The Dead Between Minutes',24],['The House Outside Time',25],['What the Town Forgot',26],['The Hour That Remains',27],
    ['The Ferris Wheel Between Us',28],['Kiss Me in the Haunted House',29],["The Summer We Don't Leave",30],
    ['The Empire Beneath the Glaze',31],['The Shards Between Kingdoms',32],['The Earth After Firing',33],['Repeat Button',34]
  ]);

  function normalizeTitle(value){ return String(value||'').replace(/[’]/g,"'").trim(); }
  function coverIndex(title){
    const clean = normalizeTitle(title);
    if (coverIndexes.has(clean)) return coverIndexes.get(clean);
    for (const [known,index] of coverIndexes) if (clean.includes(known) || known.includes(clean)) return index;
    return null;
  }
  function coverStyle(title){ const index=coverIndex(title); if(index===null)return''; return `--cc-cover-x:${(index/40)*100}%`; }

  async function authUser(){
    const c=client(); if(!c)return null;
    const {data:{session},error}=await c.auth.getSession(); if(error||!session?.user)return null;
    const gate=await c.rpc('is_command_center_authorized'); return gate.error||!gate.data?null:session.user;
  }
  async function rpc(name,args={}){ const c=client(),user=await authUser(); if(!c||!user)throw new Error('Authorized Command Center session required.'); const {data,error}=await c.rpc(name,args); if(error)throw error; return data; }

  async function load(force=false){
    if(state.loading)return;
    if(!force && state.projects.length && Date.now()-state.loadedAt<15000)return;
    const c=client(),user=await authUser(); if(!c||!user)return;
    state.loading=true;
    try{
      const [p,k,o]=await Promise.all([
        c.from('projects').select('*').order('sort_order'),
        c.from('analytics_project_kpis').select('project_id,metric_key,label,unit,currency,value_numeric,value_text,observed_at,verified').eq('verified',true),
        c.from('project_opportunities').select('id,project_id,title,category,status,rationale,expected_benefit,effort,monetary_cost,risk,updated_at').order('updated_at',{ascending:false})
      ]);
      const error=p.error||k.error||o.error; if(error)throw error;
      state.projects=p.data||[]; state.kpis=k.data||[]; state.opportunities=o.data||[]; state.loadedAt=Date.now();
    } finally { state.loading=false; }
  }

  function projectKpis(id){ return state.kpis.filter(row=>row.project_id===id); }
  function metric(id,key){ return projectKpis(id).find(row=>row.metric_key===key)||null; }
  function metricText(row){
    if(!row)return'N/A';
    if(row.value_numeric!==null&&row.value_numeric!==undefined){
      if(String(row.currency||row.unit||'').toUpperCase()==='USD')return fmtMoney(row.value_numeric);
      return fmtNum(row.value_numeric);
    }
    return row.value_text||'N/A';
  }
  function progress(project){ const row=metric(project.id,'current_scope_progress_percent'); return row&&row.value_numeric!==null?Math.max(0,Math.min(100,Math.round(Number(row.value_numeric)||0))):null; }
  function verifiedRevenue(project){ const row=metric(project.id,'verified_revenue_usd'); return row&&row.value_numeric!==null?Number(row.value_numeric):null; }
  function isAttention(project){ return project.attention===true || /blocked|needs|recovery|paused/i.test(`${project.status||''} ${project.verification||''} ${project.blocker||''}`); }
  function isBookProject(project){ return /^kdp-/.test(project.id||'') || /book|kdp|coloring|workbook/i.test(`${project.category||''} ${project.name||''}`); }
  function artClass(project){
    const s=`${project.id} ${project.name} ${project.category}`.toLowerCase();
    if(/book|kdp|color|workbook/.test(s))return'art-eclipse';
    if(/agent|ai|velo|revo|edge|data|command/.test(s))return'art-network';
    if(/shop|commerce|coupon|margin|garage/.test(s))return'art-road';
    if(/fanvue|creator|social|content/.test(s))return'art-chart';
    return'art-mountain';
  }
  function statusTone(project){
    const s=`${project.status||''} ${project.verification||''}`.toLowerCase();
    if(/blocked|needs|recovery/.test(s))return'red'; if(/live|published|complete/.test(s))return'green'; if(/active|progress|rebuild/.test(s))return'amber'; return'orange';
  }

  function ensureRoot(){
    const dashboard=document.getElementById('dashboard'); if(!dashboard)return null;
    let root=document.getElementById('ccApprovedApp');
    if(!root){ root=document.createElement('section'); root.id='ccApprovedApp'; root.className='cc-approved-app'; dashboard.appendChild(root); }
    document.body.classList.toggle('cc-approved-legacy-open',state.legacy);
    return root;
  }

  function appHeader(title,subtitle,back){ return `<div class="cc-approved-page-head">${back?'<button class="cc-approved-back" type="button" data-cc-back aria-label="Back">‹</button>':''}<div><h2>${esc(title)}</h2>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div></div>`; }
  function emblem(type='folder'){ const icons={folder:'▱',calendar:'▦',agent:'✦',money:'$',book:'▥',chart:'▥',status:'✓',idea:'＋'}; return `<span class="cc-approved-emblem" aria-hidden="true">${icons[type]||'✦'}</span>`; }
  function heroButton(action,type,value,label,sub,art){ return `<button type="button" class="cc-approved-hero ${art}" data-cc-home="${action}">${emblem(type)}<span class="cc-approved-hero-copy"><strong>${esc(value)}</strong><b>${esc(label)}</b>${sub?`<small>${esc(sub)}</small>`:''}</span></button>`; }

  async function agentSummary(){
    try{ const rows=await rpc('command_center_agent_list_sessions',{p_project_id:null})||[]; const active=rows.filter(x=>ACTIVE.has(x.status)); const needs=active.filter(x=>/needs_user_action|blocked/.test(x.status||'')); return needs.length?{value:'Needs You',sub:`${needs.length} run${needs.length===1?'':'s'} waiting`}:active.length?{value:'Working',sub:`${active.length} active run${active.length===1?'':'s'}`}:{value:'Idle',sub:'Ready when you are'}; }
    catch{return{value:'Idle',sub:'Ready when you are'};}
  }

  async function renderHome(root){
    const nextCount=state.projects.filter(p=>p.next_action).length;
    const totalRevenue=state.projects.reduce((sum,p)=>sum+(verifiedRevenue(p)||0),0);
    root.innerHTML=`<div class="cc-approved-home-grid">
      ${heroButton('projects','folder',state.projects.length,'PROJECTS','Full portfolio','art-mountain')}
      ${heroButton('next','calendar',nextCount,'NEXT UP','What needs action','art-road')}
      ${heroButton('agent','agent','Idle','AGENT','Ready when you are','art-network')}
      ${heroButton('revenue','money',fmtMoney(totalRevenue),'REVENUE','Verified project earnings','art-chart')}
    </div>`;
    const summary=await agentSummary(); const card=root.querySelector('[data-cc-home="agent"]'); if(card){card.querySelector('strong').textContent=summary.value;card.querySelector('small').textContent=summary.sub;}
  }

  function ring(pct){ const label=pct===null?'N/A':`${pct}%`; const angle=pct===null?0:pct*3.6; return `<span class="cc-approved-ring" style="--cc-pct:${angle}deg"><b>${label}</b></span>`; }
  function projectCard(project){ const pct=progress(project); return `<button type="button" class="cc-approved-project-card ${artClass(project)}" data-cc-project="${esc(project.id)}">
    ${emblem(isBookProject(project)?'book':'folder')}
    <span class="cc-approved-project-copy"><strong>${esc(project.name)}</strong><small>${esc(project.stage||project.category||'Current project')}</small><span class="cc-approved-status tone-${statusTone(project)}">${esc(project.status||'Current')}</span></span>
    ${ring(pct)}
  </button>`; }

  function renderProjects(root,attention=false){ const list=attention?state.projects.filter(isAttention):state.projects; root.innerHTML=`${appHeader(attention?'Next Up':'Projects',attention?'Projects that need action now':'Full portfolio of tracked projects',true)}<div class="cc-approved-total">${emblem('folder')}<strong>${list.length}</strong><span>${attention?'NEED ACTION':'TOTAL PROJECTS'}</span></div><div class="cc-approved-project-list">${list.map(projectCard).join('')||'<div class="cc-approved-empty">Nothing needs attention right now.</div>'}</div>`; }

  function latestSnapshot(project){
    const rows=projectKpis(project.id).filter(r=>String(r.metric_key).startsWith('kdp_snapshot.')).sort((a,b)=>String(b.metric_key).localeCompare(String(a.metric_key)));
    if(!rows.length)return null; try{return JSON.parse(rows[0].value_text||'{}');}catch{return null;}
  }
  function bookMappings(project){
    return projectKpis(project.id).filter(r=>/^bookmap\..+\.metadata$/.test(r.metric_key)).map(r=>{try{return JSON.parse(r.value_text||'{}')}catch{return null}}).filter(Boolean).sort((a,b)=>(a.series_order||99)-(b.series_order||99)||String(a.title||'').localeCompare(String(b.title||'')));
  }
  function pubCount(books,key,value){ return books.filter(b=>String(key==='kdp_select'?b.kdp_select:b.formats?.[key]||'').toLowerCase()===value).length; }
  function coverTile(book,index){ const style=coverStyle(book.title); return `<div class="cc-approved-book"><div class="cc-approved-cover${style?' has-cover':''}" ${style?`style="${style}"`:''}><span>${index+1}</span></div><small>${esc(book.title||`Book ${index+1}`)}</small></div>`; }

  function generalKpis(project){
    const rows=projectKpis(project.id),pct=progress(project),rev=verifiedRevenue(project);
    const audience=rows.find(r=>/subscriber|customer|sales_status|orders|downloads|fans/i.test(r.metric_key));
    const extra=rows.find(r=>r!==audience && !/current_scope_progress_percent|verified_revenue_usd|bookmap|kdp_snapshot/.test(r.metric_key) && r.value_numeric!==null);
    return [
      ['Progress',pct===null?'N/A':`${pct}%`],['Verified revenue',rev===null?'N/A':fmtMoney(rev)],
      [audience?.label||'Audience / customers',audience?metricText(audience):'N/A'],[extra?.label||'Current scope',extra?metricText(extra):project.stage||'N/A']
    ];
  }

  function renderPerformance(project){
    if(isBookProject(project)){
      const snap=latestSnapshot(project),pct=progress(project),rev=verifiedRevenue(project),roy=metric(project.id,'kdp_royalties_status'),ku=metric(project.id,'ku_royalties_status'),sales=metric(project.id,'sales_status');
      const items=[['Verified revenue',rev===null?'N/A':fmtMoney(rev),'money'],['Royalties',roy?metricText(roy):'N/A','chart'],['KDP Select',ku?metricText(ku):'N/A','status'],['Book sales',sales?metricText(sales):'N/A','book'],['Pages read',snap?.kenp!==undefined?fmtNum(snap.kenp):'N/A','book'],['Current scope',pct===null?'N/A':`${pct}%`,'status']];
      return `<section class="cc-approved-section"><div class="cc-approved-section-title">${emblem('chart')}<strong>KDP PERFORMANCE</strong><span>Verified</span></div><div class="cc-approved-kpi-grid">${items.map(([label,value,type])=>`<div>${emblem(type)}<strong>${esc(value)}</strong><small>${esc(label)}</small></div>`).join('')}</div></section>`;
    }
    const items=generalKpis(project); return `<section class="cc-approved-section"><div class="cc-approved-section-title">${emblem('chart')}<strong>PERFORMANCE</strong><span>Verified</span></div><div class="cc-approved-kpi-grid cc-approved-kpi-grid-4">${items.map(([label,value])=>`<div><strong>${esc(value)}</strong><small>${esc(label)}</small></div>`).join('')}</div></section>`;
  }

  function renderBooks(project){
    const books=bookMappings(project); if(!books.length)return'';
    return `<section class="cc-approved-section"><div class="cc-approved-section-title">${emblem('book')}<strong>BOOKS IN SERIES</strong><span>${books.length} books</span></div><div class="cc-approved-books">${books.map(coverTile).join('')}</div></section>`;
  }

  function renderPublication(project){
    const books=bookMappings(project); if(!books.length)return''; const total=books.length;
    const cells=[['Kindle eBook',pubCount(books,'kindle','live'),total],['KDP Select',pubCount(books,'kdp_select','enrolled'),total],['Paperback',pubCount(books,'paperback','live'),total],['Hardcover',pubCount(books,'hardcover','live'),total]];
    return `<section class="cc-approved-section"><div class="cc-approved-section-title">${emblem('status')}<strong>PUBLICATION STATUS</strong></div><div class="cc-approved-publication">${cells.map(([label,count,den])=>`<div><small>${esc(label)}</small><strong>${count} / ${den}</strong><span>${count===den?'Published':'Current'}</span></div>`).join('')}</div></section>`;
  }

  function renderSnapshot(project){ const snap=latestSnapshot(project); if(!snap)return''; return `<section class="cc-approved-section cc-approved-collapsible"><button type="button" class="cc-approved-section-toggle" data-cc-toggle="snapshot">${emblem('chart')}<span><strong>KDP SNAPSHOT HISTORY</strong><small>${esc(snap.checked_at||'Latest verified snapshot')}</small></span></button><div class="cc-approved-collapse" data-cc-collapse="snapshot" hidden><div class="cc-approved-snapshot-grid"><div><small>Orders</small><strong>${esc(fmtNum(snap.orders||0))}</strong></div><div><small>Royalties</small><strong>${esc(fmtMoney(snap.royalties_usd||0))}</strong></div><div><small>KENP</small><strong>${esc(fmtNum(snap.kenp||0))}</strong></div><div><small>Report window</small><strong>${esc(`${snap.period_start||'—'} → ${snap.period_end||'—'}`)}</strong></div></div></div></section>`; }

  function opportunitySection(project){
    const rows=state.opportunities.filter(o=>o.project_id===project.id&&!/completed|dismissed|rejected/i.test(o.status||'')).slice(0,2);
    return `<section class="cc-approved-section"><div class="cc-approved-section-title">${emblem('idea')}<strong>OPPORTUNITIES</strong><span>Optional improvements</span></div>${rows.length?`<div class="cc-approved-opps">${rows.map(o=>`<div><strong>${esc(o.title)}</strong><small>${esc(o.expected_benefit||o.rationale||'Potential improvement')}</small><button type="button" data-cc-run-opportunity="${esc(o.id)}">Run with Agent</button></div>`).join('')}</div>`:'<div class="cc-approved-empty">No saved opportunities yet.</div>'}<button class="cc-approved-inline-action" type="button" data-cc-agent-mode="improve">Find improvements</button></section>`;
  }

  function modeObjective(mode,project,specific=''){
    const next=project.next_action||'determine and complete the next verified task';
    if(mode==='next')return`Complete the exact recorded next task for ${project.name}: ${next}. Stay inside this project, preserve verified work, and checkpoint the verified result.`;
    if(mode==='until-work')return`Continue ${project.name} from the newest verified Command Center state using normal-chat and $0/free-first capabilities until the first genuine Work-only execution boundary. Prepare the exact Work handoff/checkpoint and stop before Work execution.`;
    if(mode==='manual')return`Complete this exact task for ${project.name}: ${specific}. Stay inside this project, use normal chat first, preserve verified work, and verify the result.`;
    if(mode==='improve')return`Research ${project.name} from its newest verified state and identify the highest-value $0/free-first opportunities that could improve the build, product, revenue potential, user experience, reliability, or efficiency. Record useful opportunities and do not cross protected boundaries.`;
    return`Continue ${project.name} automatically from the newest verified Command Center state. Execute all eligible work inside this project, use normal chat first, use bounded Work only after a genuine capability boundary and existing gates, checkpoint meaningful progress, and stop only for completion or a genuine user/protected boundary.`;
  }
  async function activeAgent(project){ const rows=await rpc('command_center_agent_list_sessions',{p_project_id:project.id})||[]; const s=rows.find(x=>ACTIVE.has(x.status))||null; if(!s)return null; return await rpc('command_center_agent_status',{p_session_id:s.id}).catch(()=>({session:s,steps:[]})); }
  async function createRun(project,mode,specific=''){
    if(mode==='manual'&&!specific.trim())throw new Error('Enter the exact task first.');
    const objective=modeObjective(mode,project,specific.trim()); const allowWork=mode!=='until-work'&&mode!=='improve';
    return await rpc('command_center_agent_create_project_only_session',{p_objective:objective,p_project_id:project.id,p_success_criteria:[],p_excluded_scope:[],p_allowed_tool_categories:TOOLS,p_allow_work:allowWork,p_books_target:isBookProject(project)?project.name:null,p_dry_run:false});
  }
  async function agentAction(action,id){ const map={pause:'command_center_agent_pause',resume:'command_center_agent_resume',stop:'command_center_agent_cancel'}; if(!map[action])return; await rpc(map[action],{p_session_id:id}); }

  async function renderAgent(project){
    const agent=await activeAgent(project); if(agent?.session){ const s=agent.session,step=(agent.steps||[]).find(x=>x.id===s.current_step_id); return `<section class="cc-approved-section cc-approved-agent"><div class="cc-approved-section-title">${emblem('agent')}<strong>AGENT</strong><span>${esc(pretty(s.status))}</span></div><div class="cc-approved-agent-current"><small>Current task</small><strong>${esc(step?.title||s.exact_next_action||s.objective||'Agent run queued')}</strong></div><div class="cc-approved-agent-controls">${s.status==='active'?'<button type="button" data-cc-agent-action="pause">Pause</button>':''}${s.status==='paused'?'<button type="button" data-cc-agent-action="resume">Resume</button>':''}<button type="button" data-cc-agent-action="stop">Stop</button><button type="button" data-cc-agent-refresh>Refresh</button></div><div class="cc-approved-message" data-cc-agent-message></div></section>`; }
    return `<section class="cc-approved-section cc-approved-agent"><div class="cc-approved-section-title">${emblem('agent')}<strong>AGENT</strong><span>Ready</span></div><div class="cc-approved-agent-modes"><button type="button" data-cc-agent-mode="auto"><strong>Auto</strong><small>Keep going safely</small></button><button type="button" data-cc-agent-mode="next"><strong>Next Step</strong><small>Do exactly what is next</small></button><button type="button" data-cc-agent-mode="until-work"><strong>Until Work</strong><small>Stop at Work execution</small></button><button type="button" data-cc-manual-toggle><strong>Manual Task</strong><small>Tell Agent one exact thing</small></button></div><form class="cc-approved-manual" data-cc-manual-form hidden><textarea rows="2" placeholder="What exact task should Agent do?"></textarea><button type="submit">Start task</button></form><div class="cc-approved-message" data-cc-agent-message></div></section>`;
  }

  async function renderProject(root,project){
    const pct=progress(project); root.innerHTML=`${appHeader(project.name,'Project Details',true)}<section class="cc-approved-project-hero ${artClass(project)}"><div>${emblem(isBookProject(project)?'book':'folder')}<span><small>${esc(project.category||'PROJECT')}</small><strong>${esc(project.name)}</strong><p>${esc(project.stage||project.verification||'Current verified project state')}</p></span></div><span class="cc-approved-status tone-${statusTone(project)}">${esc(project.status||'Current')}</span>${pct!==null?ring(pct):''}</section>${renderPerformance(project)}${renderBooks(project)}${renderPublication(project)}${renderSnapshot(project)}<div id="ccApprovedAgentMount"></div>${opportunitySection(project)}<section class="cc-approved-next"><small>NEXT STEP</small><strong>${esc(project.next_action||'No next step recorded.')}</strong>${project.blocker?`<p>${esc(project.blocker)}</p>`:''}</section>`;
    const mount=root.querySelector('#ccApprovedAgentMount'); if(mount)mount.innerHTML=await renderAgent(project); bindProject(root,project);
  }

  function bindProject(root,project){
    root.querySelectorAll('[data-cc-toggle]').forEach(button=>button.addEventListener('click',()=>{const key=button.dataset.ccToggle,panel=root.querySelector(`[data-cc-collapse="${CSS.escape(key)}"]`); if(panel)panel.hidden=!panel.hidden;}));
    root.querySelector('[data-cc-manual-toggle]')?.addEventListener('click',()=>{const form=root.querySelector('[data-cc-manual-form]'); if(form){form.hidden=!form.hidden;if(!form.hidden)form.querySelector('textarea')?.focus({preventScroll:true});}});
    root.querySelector('[data-cc-manual-form]')?.addEventListener('submit',async e=>{e.preventDefault();const text=e.currentTarget.querySelector('textarea')?.value||'';await runMode(root,project,'manual',text);});
    root.querySelectorAll('[data-cc-agent-mode]').forEach(button=>button.addEventListener('click',()=>runMode(root,project,button.dataset.ccAgentMode)));
    root.querySelectorAll('[data-cc-agent-action]').forEach(button=>button.addEventListener('click',async()=>{const msg=root.querySelector('[data-cc-agent-message]');try{const agent=await activeAgent(project);if(!agent?.session)return;button.disabled=true;if(msg)msg.textContent='Applying…';await agentAction(button.dataset.ccAgentAction,agent.session.id);await render();}catch(error){if(msg)msg.textContent=error.message||String(error);button.disabled=false;}}));
    root.querySelector('[data-cc-agent-refresh]')?.addEventListener('click',()=>render());
    root.querySelectorAll('[data-cc-run-opportunity]').forEach(button=>button.addEventListener('click',async()=>{const opp=state.opportunities.find(o=>o.id===button.dataset.ccRunOpportunity);if(!opp)return;await runMode(root,project,'manual',`Evaluate and, if safe and beneficial, execute this saved opportunity: ${opp.title}. ${opp.expected_benefit||opp.rationale||''}`);}));
  }
  async function runMode(root,project,mode,specific=''){ const msg=root.querySelector('[data-cc-agent-message]'); try{if(msg)msg.textContent='Starting Agent…';await createRun(project,mode,specific);if(msg)msg.textContent='Agent run queued.';await render();}catch(error){if(msg)msg.textContent=error.message||String(error);} }

  async function renderAgentHome(root){
    const rows=await rpc('command_center_agent_list_sessions',{p_project_id:null}).catch(()=>[])||[]; const active=rows.filter(x=>ACTIVE.has(x.status));
    root.innerHTML=`${appHeader('Agent','Choose a project and tell Agent how far to go.',true)}<section class="cc-approved-section cc-approved-agent-home"><div class="cc-approved-section-title">${emblem('agent')}<strong>AGENT CONTROL</strong><span>${active.length?`${active.length} active`:'Idle'}</span></div><label class="cc-approved-select-label">Project<select id="ccApprovedAgentProject"><option value="">Choose a project…</option>${state.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}</select></label><div class="cc-approved-agent-modes"><button type="button" data-cc-agent-home-mode="auto"><strong>Auto</strong><small>Keep going safely</small></button><button type="button" data-cc-agent-home-mode="next"><strong>Next Step</strong><small>Do what comes next</small></button><button type="button" data-cc-agent-home-mode="until-work"><strong>Until Work</strong><small>Stop at Work execution</small></button><button type="button" data-cc-agent-home-mode="manual"><strong>Manual Task</strong><small>One exact task</small></button></div><form class="cc-approved-manual" id="ccApprovedAgentHomeManual" hidden><textarea rows="2" placeholder="What exact task should Agent do?"></textarea><button type="submit">Start task</button></form><div class="cc-approved-message" id="ccApprovedAgentHomeMsg"></div></section>${active.length?`<section class="cc-approved-section"><div class="cc-approved-section-title"><strong>ACTIVE RUNS</strong></div><div class="cc-approved-active-runs">${active.slice(0,8).map(s=>`<button type="button" data-cc-active-project="${esc(s.current_project_id||s.primary_project_id||'')}"><strong>${esc(s.objective||'Agent run')}</strong><small>${esc(pretty(s.status))}</small></button>`).join('')}</div></section>`:''}`;
    bindAgentHome(root);
  }
  function selectedAgentProject(){ const id=document.getElementById('ccApprovedAgentProject')?.value; return state.projects.find(p=>p.id===id)||null; }
  function bindAgentHome(root){
    root.querySelectorAll('[data-cc-agent-home-mode]').forEach(button=>button.addEventListener('click',async()=>{const project=selectedAgentProject(),msg=root.querySelector('#ccApprovedAgentHomeMsg');if(!project){msg.textContent='Choose a project first.';return;}const mode=button.dataset.ccAgentHomeMode;if(mode==='manual'){root.querySelector('#ccApprovedAgentHomeManual').hidden=false;root.querySelector('#ccApprovedAgentHomeManual textarea')?.focus();return;}try{button.disabled=true;msg.textContent='Starting Agent…';await createRun(project,mode);state.projectId=project.id;state.route='project';history.pushState({ccApproved:'project',projectId:project.id},'',location.href);await render();}catch(error){msg.textContent=error.message||String(error);button.disabled=false;}}));
    root.querySelector('#ccApprovedAgentHomeManual')?.addEventListener('submit',async e=>{e.preventDefault();const project=selectedAgentProject(),msg=root.querySelector('#ccApprovedAgentHomeMsg');if(!project){msg.textContent='Choose a project first.';return;}try{await createRun(project,'manual',e.currentTarget.querySelector('textarea')?.value||'');state.projectId=project.id;state.route='project';history.pushState({ccApproved:'project',projectId:project.id},'',location.href);await render();}catch(error){msg.textContent=error.message||String(error);}});
    root.querySelectorAll('[data-cc-active-project]').forEach(button=>button.addEventListener('click',()=>openProject(button.dataset.ccActiveProject)));
  }

  function renderRevenue(root){ const rows=state.projects.map(p=>({p,value:verifiedRevenue(p)}));const total=rows.reduce((s,x)=>s+(x.value||0),0);root.innerHTML=`${appHeader('Revenue','Verified project earnings',true)}<section class="cc-approved-revenue-hero">${emblem('money')}<small>VERIFIED REVENUE</small><strong>${fmtMoney(total)}</strong></section><div class="cc-approved-revenue-list">${rows.map(x=>`<button type="button" data-cc-project="${esc(x.p.id)}"><span><strong>${esc(x.p.name)}</strong><small>${esc(x.p.category||'Project')}</small></span><b>${x.value===null?'N/A':fmtMoney(x.value)}</b></button>`).join('')}</div>`; }

  function ensureAbout(){
    let b=document.getElementById('ccApprovedAbout'); if(b)return;
    b=document.createElement('button');b.id='ccApprovedAbout';b.type='button';b.className='cc-approved-about';b.textContent='ⓘ  About';document.body.appendChild(b);b.addEventListener('click',openAbout);
  }
  function openAbout(){ document.getElementById('ccApprovedAboutSheet')?.remove();const sheet=document.createElement('div');sheet.id='ccApprovedAboutSheet';sheet.className='cc-approved-about-sheet';sheet.innerHTML=`<button type="button" class="cc-approved-about-backdrop" data-cc-about-close aria-label="Close"></button><section><div class="cc-approved-about-head"><strong>About & More</strong><button type="button" data-cc-about-close>×</button></div><button type="button" data-cc-about-action="refresh">Refresh data</button><button type="button" data-cc-about-action="brain">Command Center Brain</button><button type="button" data-cc-about-action="advanced">Advanced / system details</button><button type="button" data-cc-about-action="signout">Sign out</button></section>`;document.body.appendChild(sheet);sheet.querySelectorAll('[data-cc-about-close]').forEach(x=>x.addEventListener('click',()=>sheet.remove()));sheet.querySelectorAll('[data-cc-about-action]').forEach(x=>x.addEventListener('click',()=>aboutAction(x.dataset.ccAboutAction,sheet))); }
  async function aboutAction(action,sheet){
    if(action==='refresh'){await load(true);await render();sheet.remove();return;}
    if(action==='signout'){document.getElementById('signOutBtn')?.click();sheet.remove();return;}
    if(action==='brain'||action==='advanced'){state.legacy=true;ensureRoot();document.body.classList.add('cc-approved-legacy-open');sheet.remove();setTimeout(()=>{if(action==='brain')document.getElementById('ccBrainHomeButton')?.click();},80);}
  }

  function openProject(id){ if(!id)return;state.projectId=id;state.route='project';history.pushState({ccApproved:'project',projectId:id},'',location.href);render(); }
  function routeBack(){ if(state.route==='project'){state.route='projects';state.projectId=null;}else state.route='home';render(); }
  function bindGlobal(root){
    root.querySelectorAll('[data-cc-home]').forEach(b=>b.addEventListener('click',()=>{state.route=b.dataset.ccHome;state.projectId=null;history.pushState({ccApproved:state.route},'',location.href);render();}));
    root.querySelectorAll('[data-cc-project]').forEach(b=>b.addEventListener('click',()=>openProject(b.dataset.ccProject)));
    root.querySelectorAll('[data-cc-back]').forEach(b=>b.addEventListener('click',routeBack));
  }

  async function render(){
    const dashboard=document.getElementById('dashboard'); if(!dashboard||dashboard.hidden)return;
    await load(false);const root=ensureRoot();if(!root)return;state.legacy=false;document.body.classList.remove('cc-approved-legacy-open');
    if(state.route==='projects')renderProjects(root,false);
    else if(state.route==='next')renderProjects(root,true);
    else if(state.route==='agent')await renderAgentHome(root);
    else if(state.route==='revenue')renderRevenue(root);
    else if(state.route==='project'){const p=state.projects.find(x=>x.id===state.projectId);if(p)await renderProject(root,p);else{state.route='projects';renderProjects(root,false);}}
    else await renderHome(root);
    bindGlobal(root);ensureAbout();
  }

  function interceptLegacyAgent(){ document.addEventListener('click',event=>{const button=event.target.closest('#ccAgentHomeButton');if(!button||state.legacy)return;event.preventDefault();event.stopImmediatePropagation();state.route='agent';history.pushState({ccApproved:'agent'},'',location.href);render();},true); }
  function watchDashboard(){ const dash=document.getElementById('dashboard');if(!dash)return;const observer=new MutationObserver(()=>{if(!dash.hidden&&!state.legacy)render();});observer.observe(dash,{attributes:true,attributeFilter:['hidden']}); }

  window.addEventListener('popstate',event=>{if(state.legacy){state.legacy=false;document.body.classList.remove('cc-approved-legacy-open');render();return;}const r=event.state?.ccApproved;if(r){state.route=r;state.projectId=event.state?.projectId||null;}else{state.route='home';state.projectId=null;}render();});
  window.addEventListener('visibilitychange',()=>{if(!document.hidden&&!state.legacy){load(true).then(render).catch(()=>{});}});
  interceptLegacyAgent();watchDashboard();ensureAbout();setTimeout(render,250);clearInterval(state.timer);state.timer=setInterval(()=>{if(!document.hidden&&!state.legacy)load(true).then(render).catch(()=>{});},60000);
  window.COMMAND_CENTER_APPROVED_UI.refresh=()=>load(true).then(render);
})();