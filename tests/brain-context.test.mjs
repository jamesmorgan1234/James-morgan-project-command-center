import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const migration=fs.readFileSync('supabase/migrations/20261021_brain_phase3_context_builder.sql','utf8');
const js=fs.readFileSync('command-center-brain-context.js','utf8');
const css=fs.readFileSync('command-center-brain-context.css','utf8');
const home=fs.readFileSync('command-center-brain-home.js','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

assert.match(migration,/create table if not exists public\.brain_context_packets/);
assert.match(migration,/owner_id uuid not null references auth\.users\(id\)/);
assert.match(migration,/project_id text null references public\.projects\(id\)/);
assert.match(migration,/context_text text not null/);
assert.match(migration,/context_json jsonb not null/);
assert.match(migration,/source_snapshot jsonb not null/);
assert.match(migration,/memory_ids uuid\[\] not null/);
assert.match(migration,/metric_keys text\[\] not null/);
assert.match(migration,/alter table public\.brain_context_packets enable row level security/);
for(const p of ['select_own','insert_own','update_own','delete_own'])assert.match(migration,new RegExp(`brain_context_packets_${p}`));
assert.match(migration,/owner_id=\(select auth\.uid\(\)\)/);
assert.match(migration,/is_command_center_authorized/);

assert.doesNotThrow(()=>new Function(js),'Context Builder controller must parse');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Context Builder CSS braces must balance');
assert.match(js,/window\.COMMAND_CENTER_SUPABASE/,'Context Builder must use the canonical authenticated client');
for(const table of ['brain_memories','projects','metrics','tracking_integrations','brain_context_packets'])assert.ok(js.includes(`'${table}'`),`Context Builder must use ${table}`);
assert.match(js,/\.eq\('verified',true\)/,'unverified metrics must be excluded at the query boundary');
assert.match(js,/m\.status==='active'/,'archived and superseded memory must be excluded');
assert.match(js,/TRUST_WEIGHT/,'memory ranking must include trust authority');
assert.match(js,/canonical:/,'canonical memory keys must participate in deduplication');
assert.match(js,/hash:/,'content hashes must participate in deduplication');
assert.match(js,/dedupeMemories/,'deduplication must be exposed for future Brain layers');
assert.match(js,/source_snapshot/,'packets must retain provenance snapshots');
assert.match(js,/context_json/,'packets must retain reusable structured context');
assert.match(js,/context_text/,'packets must provide a human-readable handoff surface');
assert.match(js,/brainstorm_excluded_until_committed:true/,'uncommitted brainstorming must remain outside trusted context');
assert.match(js,/Uncommitted Brainstorm items are excluded until they are deliberately committed to Durable Memory/,'human-readable provenance must explain the Brainstorm trust boundary');
assert.match(js,/const defaultTitle=projectId\?`\$\{projectLabel\(cleanProjects\[0\]\)\} — Context Packet`:'Command Center — Context Packet'/,'Command Center-wide builds must not be mislabeled as one matched project');
assert.match(js,/from\('brain_context_packets'\)\.insert/,'saved packets must persist to Supabase');
assert.match(js,/from\('brain_context_packets'\)\.update/,'packets must support rebuild/archive/restore');
assert.doesNotMatch(js,/localStorage\.setItem/,'Context Builder must not use browser storage as source of truth');
for(const method of ['build:collect','list','get','save','rebuild','archive','restore','rankMemories','dedupeMemories','tokenize'])assert.ok(js.includes(method),`missing Context Builder API method ${method}`);
assert.match(js,/100% · Complete/,'Phase 3 workspace must identify the completed phase');
assert.doesNotMatch(js,/JSON\.stringify\([^)]*context_json/,'raw context JSON must not be exposed in the normal UI');

const sandbox={window:{addEventListener(){}},document:{getElementById(){return null;}},navigator:{clipboard:{writeText:async()=>{}}},CustomEvent:class{},setTimeout(){},console,Date};
vm.runInNewContext(js,sandbox);
const api=sandbox.window.COMMAND_CENTER_BRAIN_CONTEXT;
assert.ok(api,'Context Builder API must mount without requiring the UI');
const base={status:'active',importance:3,sharing_scope:'private_project',tags:['alpha'],title:'Alpha decision',body:'Use the approved alpha path',updated_at:'2026-10-21T12:00:00Z',created_at:'2026-10-21T12:00:00Z'};
const ranked=api.rankMemories([
  {...base,id:'draft',trust_state:'draft',project_id:'p1'},
  {...base,id:'locked',trust_state:'locked',project_id:'p1',title:'Locked alpha decision'},
  {...base,id:'other-project',trust_state:'locked',project_id:'p2',title:'Other project alpha'}
],api.tokenize('alpha decision'),'p1',10);
assert.equal(ranked[0].id,'locked','locked memory in the selected project must outrank an equivalent draft');
assert.ok(ranked.findIndex(x=>x.id==='draft')<ranked.findIndex(x=>x.id==='other-project')||!ranked.some(x=>x.id==='other-project'),'selected-project relevance must outrank unrelated project context');
const deduped=api.dedupeMemories([
  {...base,id:'old',trust_state:'observed',project_id:'p1',canonical_key:'asset:cover',updated_at:'2026-10-20T12:00:00Z'},
  {...base,id:'approved',trust_state:'approved',project_id:'p1',canonical_key:'asset:cover',updated_at:'2026-10-21T12:00:00Z'},
  {...base,id:'archived',status:'archived',trust_state:'locked',project_id:'p1',canonical_key:'asset:other'}
],['alpha'],'p1',10);
assert.equal(deduped.filter(x=>x.canonical_key==='asset:cover').length,1,'canonical duplicates must collapse to one authoritative memory');
assert.equal(deduped.find(x=>x.canonical_key==='asset:cover').id,'approved','higher-authority canonical memory must win deduplication');
assert.equal(deduped.some(x=>x.id==='archived'),false,'archived memory must not enter retrieval output');

assert.match(home,/\['Context Builder'[^\]]+,100\]/,'Project Brain Phase 3 roadmap must be 100%');
assert.match(home,/id=\\"ccBrainContextMount\\"/,'Project Brain detail must mount Context Builder');
assert.match(home,/Project Brain \$\{brainPct\}%/,'Project Brain parent summary must derive from phase values');
assert.match(cfg,/command-center-brain-context\.css\?v=1/);
assert.match(cfg,/command-center-brain-context\.js\?v=1/);
assert.ok(sw.includes("'./command-center-brain-context.css?v=1'"));
assert.ok(sw.includes("'./command-center-brain-context.js?v=1'"));
assert.match(sw,/pathname\.endsWith\('\/command-center-brain-context\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/command-center-brain-context\.css'\)/);
assert.match(css,/background:#030201|background:#050302/,'Context Builder surfaces must remain black');
assert.match(css,/#ff/,'Context Builder must retain orange accent styling');

console.log('Project Brain Phase 3 Context Builder QA passed.');