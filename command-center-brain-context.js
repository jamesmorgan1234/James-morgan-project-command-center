(() => {
  const TRUST_WEIGHT={draft:10,observed:22,verified:42,approved:58,locked:72};
  const STOP=new Set(['the','and','for','with','that','this','from','into','about','what','when','where','which','have','has','are','was','were','will','would','should','could','your','you','our','its','not','but','all','any','how','why','who']);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
  const norm=v=>String(v??'').toLowerCase().replace(/[^a-z0-9$%._-]+/g,' ').replace(/\s+/g,' ').trim();
  const uniq=a=>[...new Set(a.filter(Boolean))];
  const tokenize=(...values)=>uniq(values.flatMap(v=>norm(v).split(' ')).filter(x=>x.length>1&&!STOP.has(x))).slice(0,80);
  const has=(text,t)=>norm(text).includes(t);
  const fmtDate=v=>{if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?String(v):d.toLocaleString();};
  const projectLabel=p=>p?.name||'Command Center-wide';
  const metricValue=m=>m.value_numeric!==null&&m.value_numeric!==undefined?`${m.value_numeric}${m.unit?` ${m.unit}`:''}`:(m.value_text||'N/A');
  let state={host:null,projects:[],saved:[],draft:null,busy:false,showArchived:false,savedProject:'all'};

  function db(){return window.COMMAND_CENTER_SUPABASE||null;}
  async function authUser(){const c=db();if(!c)return null;const {data:{session},error}=await c.auth.getSession();if(error||!session?.user)return null;const gate=await c.rpc('is_command_center_authorized');return gate.error||!gate.data?null:session.user;}

  function projectScore(p,tokens){
    if(!tokens.length)return (p.attention?12:0)+Math.max(0,20-(Number(p.sort_order)||20));
    const title=norm(p.name),body=norm([p.category,p.status,p.verification,p.stage,p.next_action,p.blocker,p.source_status].join(' '));
    let score=p.attention?10:0;
    for(const t of tokens){if(title.includes(t))score+=18;if(body.includes(t))score+=5;}
    if(norm(p.verification).includes('verified'))score+=8;
    return score;
  }

  function memoryScore(m,tokens,projectId){
    let score=(TRUST_WEIGHT[m.trust_state]||0)+(Math.min(5,Math.max(1,Number(m.importance)||3))*5);
    if(projectId&&m.project_id===projectId)score+=38;
    else if(!m.project_id)score+=10;
    if(m.sharing_scope==='command_center_shared')score+=9;
    const title=norm(m.title),body=norm(m.body),source=norm(m.source_ref),tags=(m.tags||[]).map(norm);
    for(const t of tokens){if(title.includes(t))score+=16;if(tags.some(x=>x.includes(t)))score+=12;if(body.includes(t))score+=4;if(source.includes(t))score+=2;}
    const age=Date.now()-new Date(m.updated_at||m.created_at||0).getTime();
    if(Number.isFinite(age)&&age>=0){if(age<7*864e5)score+=5;else if(age<30*864e5)score+=3;}
    return score;
  }

  function memoryKey(m){return m.canonical_key?`canonical:${norm(m.canonical_key)}`:m.content_hash?`hash:${norm(m.content_hash)}`:`content:${norm(m.title)}|${norm(m.body).slice(0,260)}`;}
  function rankMemories(rows=[],tokens=[],projectId=null,limit=16){
    const scoped=rows.filter(m=>m.status==='active'&&(!projectId||m.project_id===projectId||!m.project_id||m.sharing_scope==='command_center_shared'));
    const best=new Map();
    for(const m of scoped){const scored={...m,__score:memoryScore(m,tokens,projectId)};const key=memoryKey(m);const prior=best.get(key);if(!prior||scored.__score>prior.__score||(scored.__score===prior.__score&&String(scored.updated_at)>String(prior.updated_at)))best.set(key,scored);}
    return [...best.values()].sort((a,b)=>b.__score-a.__score||String(b.updated_at).localeCompare(String(a.updated_at))).slice(0,Math.max(1,Math.min(40,Number(limit)||16)));
  }
  const dedupeMemories=(rows=[],tokens=[],projectId=null,limit=16)=>rankMemories(rows,tokens,projectId,limit);

  function selectedProjects(projects,tokens,projectId){
    if(projectId)return projects.filter(p=>p.id===projectId).slice(0,1);
    return projects.map(p=>({...p,__score:projectScore(p,tokens)})).sort((a,b)=>b.__score-a.__score||(Number(a.sort_order)||0)-(Number(b.sort_order)||0)).slice(0,6);
  }
  function maxUpdated(rows=[]){const values=rows.map(x=>new Date(x.updated_at||x.created_at||0).getTime()).filter(Number.isFinite);return values.length?new Date(Math.max(...values)).toISOString():null;}
  function trustCounts(rows){return rows.reduce((a,m)=>{a[m.trust_state]=(a[m.trust_state]||0)+1;return a;},{});}

  function contextText(packet){
    const j=packet.context_json,projects=j.projects||[],memories=j.memories||[],metrics=j.verified_metrics||[],integrations=j.tracking_integrations||[];
    const lines=['COMMAND CENTER CONTEXT PACKET',`Title: ${packet.title}`,`Purpose: ${packet.purpose||'General context'}`,`Query: ${packet.query_text||'No specific query'}`,`Scope: ${packet.project_id?(projects[0]?.name||packet.project_id):'Command Center-wide'}`,''];
    lines.push('PROJECT STATE');
    if(!projects.length)lines.push('- No project state matched this context.');
    for(const p of projects){lines.push(`- ${p.name}: ${p.status||'N/A'} · ${p.verification||'N/A'} · ${p.stage||'N/A'}`);if(p.next_action)lines.push(`  Next: ${p.next_action}`);if(p.blocker)lines.push(`  Blocker / integrity note: ${p.blocker}`);if(p.last_verified)lines.push(`  Last verified: ${p.last_verified}`);}
    lines.push('','VERIFIED METRICS');
    if(!metrics.length)lines.push('- No verified metrics matched this context.');
    for(const m of metrics)lines.push(`- ${m.project_name} · ${m.label}: ${metricValue(m)}${m.source?` · source ${m.source}`:''}`);
    lines.push('','DURABLE MEMORY — AUTHORITY + RELEVANCE RANKED');
    if(!memories.length)lines.push('- No durable memories matched this context.');
    for(const m of memories){lines.push(`- [${String(m.trust_state||'observed').toUpperCase()}] ${m.title}${m.body?`: ${m.body}`:''}`);if(m.source_ref)lines.push(`  Source: ${m.source_ref}`);}
    lines.push('','TRACKING INTEGRATIONS');
    if(!integrations.length)lines.push('- No tracking integrations matched this context.');
    for(const x of integrations)lines.push(`- ${x.project_name} · ${x.metric_label}: ${x.status} · ${x.provider}${x.next_step?` · next ${x.next_step}`:''}`);
    lines.push('','PROVENANCE',`- Built ${j.generated_at}.`,`- ${memories.length} memory item(s), ${metrics.length} verified metric(s), ${projects.length} project state record(s), ${integrations.length} tracking integration record(s).`,'- Unverified metrics are excluded. Superseded/archived memories are excluded. Canonical/hash/content duplicates are collapsed before ranking.');
    return lines.join('\n');
  }

  async function collect(options={}){
    const c=db(),u=await authUser();if(!c||!u)throw new Error('Context Builder requires an authorized Command Center session.');
    const projectId=options.projectId||null,purpose=String(options.purpose||'').trim(),query=String(options.query||'').trim(),tokens=tokenize(purpose,query);
    const [pr,mem,met,intg]=await Promise.all([
      c.from('projects').select('id,name,category,status,verification,stage,next_action,blocker,attention,sort_order,last_verified,source_status,updated_at').eq('owner_id',u.id).order('sort_order'),
      c.from('brain_memories').select('id,project_id,memory_type,title,body,tags,importance,origin,trust_state,source_ref,source_observed_at,canonical_key,content_hash,sharing_scope,metadata,status,created_at,updated_at').eq('owner_id',u.id).eq('status','active').order('updated_at',{ascending:false}).limit(500),
      c.from('metrics').select('id,project_id,key,label,value_numeric,value_text,unit,verified,source,updated_at').eq('owner_id',u.id).eq('verified',true).order('updated_at',{ascending:false}).limit(500),
      c.from('tracking_integrations').select('id,project_id,metric_key,metric_label,provider,status,integration_mode,requires_user_authorization,next_step,last_checked_at,updated_at').eq('owner_id',u.id).order('updated_at',{ascending:false}).limit(500)
    ]);
    const err=pr.error||mem.error||met.error||intg.error;if(err)throw err;
    const projects=pr.data||[],selected=selectedProjects(projects,tokens,projectId),projectIds=new Set(selected.map(p=>p.id));
    const ranked=rankMemories(mem.data||[],tokens,projectId,options.memoryLimit||16);
    const metrics=(met.data||[]).filter(m=>projectIds.has(m.project_id)).map(m=>({...m,project_name:projects.find(p=>p.id===m.project_id)?.name||m.project_id}));
    const integrations=(intg.data||[]).filter(x=>projectIds.has(x.project_id)).map(x=>({...x,project_name:projects.find(p=>p.id===x.project_id)?.name||x.project_id}));
    const cleanProjects=selected.map(({__score,...p})=>p);
    const cleanMemories=ranked.map(({__score,...m})=>m);
    const generatedAt=new Date().toISOString();
    const title=String(options.title||'').trim()||`${projectLabel(cleanProjects[0])} — Context Packet`;
    const context_json={schema_version:1,generated_at:generatedAt,purpose,query_text:query,scope:{project_id:projectId,project_ids:cleanProjects.map(p=>p.id)},projects:cleanProjects,verified_metrics:metrics,memories:cleanMemories,tracking_integrations:integrations,ranking:{trust_weight:{...TRUST_WEIGHT},memory_limit:Math.max(1,Math.min(40,Number(options.memoryLimit)||16)),query_tokens:tokens}};
    const source_snapshot={generated_at:generatedAt,project_ids:cleanProjects.map(p=>p.id),counts:{projects:cleanProjects.length,memories:cleanMemories.length,verified_metrics:metrics.length,tracking_integrations:integrations.length},memory_trust:trustCounts(cleanMemories),latest_updates:{projects:maxUpdated(cleanProjects),memories:maxUpdated(cleanMemories),metrics:maxUpdated(metrics),tracking_integrations:maxUpdated(integrations)},rules:{verified_metrics_only:true,active_memories_only:true,deduplicated_memories:true,authority_ranked:true}};
    const packet={project_id:projectId,title,purpose,query_text:query,context_json,source_snapshot,memory_ids:cleanMemories.map(m=>m.id),metric_keys:uniq(metrics.map(m=>`${m.project_id}.${m.key}`)),build_version:1,status:'active',archived_at:null};
    packet.context_text=contextText(packet);
    return packet;
  }

  async function list(options={}){const c=db(),u=await authUser();if(!c||!u)throw new Error('Not authorized.');let q=c.from('brain_context_packets').select('*').eq('owner_id',u.id).order('updated_at',{ascending:false}).limit(options.limit||200);if(!options.includeArchived)q=q.eq('status','active');if(options.projectId)q=q.eq('project_id',options.projectId);const {data,error}=await q;if(error)throw error;return data||[];}
  async function get(id){const c=db(),u=await authUser();if(!c||!u)throw new Error('Not authorized.');const {data,error}=await c.from('brain_context_packets').select('*').eq('id',id).eq('owner_id',u.id).single();if(error)throw error;return data;}
  async function save(packet={}){const c=db(),u=await authUser();if(!c||!u)throw new Error('Not authorized.');if(!String(packet.context_text||'').trim())throw new Error('Build context before saving.');const row={owner_id:u.id,project_id:packet.project_id||null,title:String(packet.title||'Context Packet').trim().slice(0,180),purpose:String(packet.purpose||'').trim(),query_text:String(packet.query_text||'').trim(),context_text:String(packet.context_text||''),context_json:packet.context_json||{},source_snapshot:packet.source_snapshot||{},memory_ids:Array.isArray(packet.memory_ids)?packet.memory_ids:[],metric_keys:Array.isArray(packet.metric_keys)?packet.metric_keys:[],build_version:Math.max(1,Number(packet.build_version)||1),status:'active',archived_at:null};const {data,error}=await c.from('brain_context_packets').insert(row).select('*').single();if(error)throw error;return data;}
  async function rebuild(id,options={}){const old=await get(id),fresh=await collect({projectId:options.projectId??old.project_id,title:options.title??old.title,purpose:options.purpose??old.purpose,query:options.query??old.query_text,memoryLimit:options.memoryLimit||old.context_json?.ranking?.memory_limit||16});const c=db(),u=await authUser();const patch={...fresh,build_version:(Number(old.build_version)||1)+1,status:'active',archived_at:null};const {data,error}=await c.from('brain_context_packets').update(patch).eq('id',id).eq('owner_id',u.id).select('*').single();if(error)throw error;return data;}
  async function archive(id){const c=db(),u=await authUser();if(!c||!u)throw new Error('Not authorized.');const {data,error}=await c.from('brain_context_packets').update({status:'archived',archived_at:new Date().toISOString()}).eq('id',id).eq('owner_id',u.id).select('*').single();if(error)throw error;return data;}
  async function restore(id){const c=db(),u=await authUser();if(!c||!u)throw new Error('Not authorized.');const {data,error}=await c.from('brain_context_packets').update({status:'active',archived_at:null}).eq('id',id).eq('owner_id',u.id).select('*').single();if(error)throw error;return data;}

  function status(text,error=false){const el=state.host?.querySelector('[data-context-status]');if(el){el.textContent=text||'';el.classList.toggle('error',!!error);}}
  function projectOptions(filter=false){return `${filter?'<option value="all">All scopes</option>':'<option value="">Command Center-wide</option>'}${state.projects.map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('')}`;}
  function packetCounts(p){const c=p.source_snapshot?.counts||{};return `${c.memories??p.memory_ids?.length??0} memories · ${c.verified_metrics??p.metric_keys?.length??0} verified metrics · ${c.projects??0} project records`;}
  function preview(p){const box=state.host?.querySelector('[data-context-preview]'),actions=state.host?.querySelector('[data-context-draft-actions]');if(!box||!actions)return;if(!p){box.innerHTML='<div class="cc-memory-empty">Build or open a context packet to preview it here.</div>';actions.hidden=true;return;}box.innerHTML=`<div class="cc-context-preview-head"><div><strong>${esc(p.title)}</strong><small>${esc(packetCounts(p))}</small></div><span>v${esc(p.build_version||1)}</span></div><pre>${esc(p.context_text||'')}</pre>`;actions.hidden=false;}
  function renderSaved(){const box=state.host?.querySelector('[data-context-saved]');if(!box)return;let rows=state.saved.filter(x=>state.showArchived||x.status==='active');if(state.savedProject!=='all')rows=rows.filter(x=>String(x.project_id||'global')===state.savedProject);box.innerHTML=rows.length?rows.map(p=>`<article class="cc-context-card ${p.status==='archived'?'archived':''}" data-context-id="${esc(p.id)}"><div class="cc-memory-meta"><span class="cc-memory-pill">Context packet</span><span class="cc-memory-pill trust">v${esc(p.build_version)}</span><span>${esc(p.project_id?(state.projects.find(x=>x.id===p.project_id)?.name||p.project_id):'Command Center-wide')}</span>${p.status==='archived'?'<span>archived</span>':''}</div><h5>${esc(p.title)}</h5><p>${esc(p.purpose||'General context')}</p><small>${esc(packetCounts(p))} · updated ${esc(fmtDate(p.updated_at))}</small><div class="cc-memory-actions"><button data-context-open="${esc(p.id)}">Open</button>${p.status==='active'?`<button data-context-rebuild="${esc(p.id)}">Rebuild</button><button data-context-copy="${esc(p.id)}">Copy</button><button data-context-archive="${esc(p.id)}">Archive</button>`:`<button data-context-restore="${esc(p.id)}">Restore</button>`}</div></article>`).join(''):'<div class="cc-memory-empty">No saved context packets match this view.</div>';}
  async function reload(){const c=db(),u=await authUser();if(!c||!u){status('Context Builder is available after authorized sign-in.',true);return;}status('Loading Context Builder…');const [p,s]=await Promise.all([c.from('projects').select('id,name,sort_order').eq('owner_id',u.id).order('sort_order'),c.from('brain_context_packets').select('*').eq('owner_id',u.id).order('updated_at',{ascending:false}).limit(200)]);const err=p.error||s.error;if(err){status('Context sync error · '+err.message,true);return;}state.projects=p.data||[];state.saved=s.data||[];const ps=state.host.querySelector('[name="project_id"]'),pf=state.host.querySelector('[data-context-project-filter]');if(ps){const v=ps.value;ps.innerHTML=projectOptions(false);if([...ps.options].some(o=>o.value===v))ps.value=v;}if(pf){const v=pf.value||state.savedProject;pf.innerHTML='<option value="all">All saved scopes</option><option value="global">Command Center-wide</option>'+state.projects.map(x=>`<option value="${esc(x.id)}">${esc(x.name)}</option>`).join('');pf.value=[...pf.options].some(o=>o.value===v)?v:'all';state.savedProject=pf.value;}renderSaved();status(`${state.saved.filter(x=>x.status==='active').length} active context packet(s) · source of truth: Supabase`);}
  async function copyText(text){if(!text)throw new Error('No context to copy.');await navigator.clipboard.writeText(text);}
  function formOptions(){const f=state.host?.querySelector('[data-context-form]');return {projectId:f?.elements.project_id.value||null,title:f?.elements.title.value||'',purpose:f?.elements.purpose.value||'',query:f?.elements.query_text.value||'',memoryLimit:Number(f?.elements.memory_limit.value)||16};}
  async function buildFromForm(){if(state.busy)return;state.busy=true;status('Building context from durable memory and verified project state…');try{state.draft=await collect(formOptions());preview(state.draft);status(`Context built · ${packetCounts(state.draft)} · not saved yet`);}catch(e){status(e?.message||'Context build failed.',true);}finally{state.busy=false;}}
  async function saveDraft(){if(!state.draft)return;state.busy=true;try{const saved=await save(state.draft);state.draft=saved;await reload();preview(saved);status('Context packet saved.');window.dispatchEvent(new CustomEvent('command-center:brain-context-saved',{detail:{id:saved.id,project_id:saved.project_id}}));}catch(e){status(e?.message||'Context save failed.',true);}finally{state.busy=false;}}
  function wire(){const r=state.host;r.addEventListener('submit',e=>{if(e.target.matches('[data-context-form]')){e.preventDefault();buildFromForm();}});r.addEventListener('change',e=>{if(e.target.matches('[data-context-project-filter]')){state.savedProject=e.target.value;renderSaved();}if(e.target.matches('[data-context-show-archived]')){state.showArchived=e.target.checked;renderSaved();}});r.addEventListener('click',async e=>{try{if(e.target.closest('[data-context-save-draft]')){await saveDraft();return;}if(e.target.closest('[data-context-copy-draft]')){await copyText(state.draft?.context_text);status('Context copied.');return;}const open=e.target.closest('[data-context-open]');if(open){state.draft=state.saved.find(x=>x.id===open.dataset.contextOpen)||await get(open.dataset.contextOpen);preview(state.draft);status('Saved context opened.');return;}const rb=e.target.closest('[data-context-rebuild]');if(rb){state.busy=true;status('Rebuilding saved context from current trusted sources…');const next=await rebuild(rb.dataset.contextRebuild);state.draft=next;await reload();preview(next);status(`Rebuilt to v${next.build_version}.`);state.busy=false;return;}const cp=e.target.closest('[data-context-copy]');if(cp){const p=state.saved.find(x=>x.id===cp.dataset.contextCopy)||await get(cp.dataset.contextCopy);await copyText(p.context_text);status('Saved context copied.');return;}const ar=e.target.closest('[data-context-archive]');if(ar){await archive(ar.dataset.contextArchive);await reload();status('Context archived.');return;}const rr=e.target.closest('[data-context-restore]');if(rr){await restore(rr.dataset.contextRestore);await reload();status('Context restored.');}}catch(err){state.busy=false;status(err?.message||'Context action failed.',true);}});}
  function mount(){const host=document.getElementById('ccBrainContextMount');if(!host||host===state.host)return;state.host=host;host.innerHTML=`<section class="cc-brain-memory-panel cc-context-panel"><div class="cc-brain-tool-head"><div><span>Phase 3 · Context Builder</span><h4>Context Builder</h4><p>Retrieves the most relevant durable memory and current verified project state, ranks by authority + relevance, removes duplicate canonical content, and assembles a reusable context packet for planning, handoff and future agents.</p></div><b>100% · Complete</b></div><form data-context-form class="cc-context-form"><div class="cc-memory-form-grid"><label>Scope<select name="project_id">${projectOptions(false)}</select></label><label>Memory depth<select name="memory_limit"><option value="8">Focused · 8</option><option value="16" selected>Balanced · 16</option><option value="24">Deep · 24</option><option value="40">Maximum · 40</option></select></label><label class="wide">Packet title<input name="title" maxlength="180" placeholder="Optional — generated if blank"></label><label class="wide">Purpose<input name="purpose" maxlength="300" placeholder="What are you trying to decide, plan, or continue?"></label><label class="wide">Context query<textarea name="query_text" placeholder="Describe what the Brain should retrieve and focus on…"></textarea></label></div><div class="cc-memory-form-actions"><button class="primary" type="submit">Build context</button></div></form><div class="cc-memory-status" data-context-status></div><div class="cc-context-draft-actions" data-context-draft-actions hidden><button data-context-copy-draft>Copy context</button><button class="primary" data-context-save-draft>Save packet</button></div><div class="cc-context-preview" data-context-preview><div class="cc-memory-empty">Build or open a context packet to preview it here.</div></div><div class="cc-context-saved-head"><div><h5>Saved context packets</h5><p>Reusable snapshots retain provenance and can be rebuilt against current trusted sources.</p></div><div><select data-context-project-filter><option value="all">All saved scopes</option></select><label><input type="checkbox" data-context-show-archived> Archived</label></div></div><div class="cc-memory-list" data-context-saved></div></section>`;wire();reload();}

  window.COMMAND_CENTER_BRAIN_CONTEXT=Object.freeze({build:collect,list,get,save,rebuild,archive,restore,rankMemories,dedupeMemories,tokenize});
  window.addEventListener('command-center:brain-open',()=>setTimeout(mount,0));
  window.addEventListener('command-center:brain-capability-open',e=>{if(e.detail?.name==='Project Brain')setTimeout(mount,0);});
  window.addEventListener('command-center:brain-context-refresh',()=>reload());
  if(document.getElementById('ccBrainContextMount'))mount();
})();
