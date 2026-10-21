import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const migration=fs.readFileSync('supabase/migrations/20261021_brain_phase4_task_planner.sql','utf8');
const js=fs.readFileSync('command-center-brain-planner.js','utf8');
const css=fs.readFileSync('command-center-brain-planner.css','utf8');
const home=fs.readFileSync('command-center-brain-home.js','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

for(const table of ['brain_plans','brain_tasks'])assert.match(migration,new RegExp(`create table if not exists public\\.${table}`));
for(const phrase of ["owner_id uuid not null references auth.users(id)","context_packet_id uuid null references public.brain_context_packets(id)","alter table public.brain_plans enable row level security","alter table public.brain_tasks enable row level security","is_command_center_authorized","brain_plans_set_updated_at","brain_tasks_set_updated_at"])assert.ok(migration.includes(phrase),`missing Phase 4 schema control: ${phrase}`);
for(const p of ['brain_plans_select_own','brain_plans_insert_own','brain_plans_update_own','brain_plans_delete_own','brain_tasks_select_own','brain_tasks_insert_own','brain_tasks_update_own','brain_tasks_delete_own'])assert.ok(migration.includes(p),`missing owner RLS policy ${p}`);
assert.match(migration,/status in \('draft','active','paused','completed','archived'\)/);
assert.match(migration,/status in \('backlog','ready','in_progress','blocked','done','archived'\)/);
assert.match(migration,/priority between 1 and 5/);
assert.match(migration,/sort_order >= 0/);

assert.doesNotThrow(()=>new Function(js),'Phase 4 planner controller must parse');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Phase 4 planner CSS braces must balance');
assert.match(js,/window\.COMMAND_CENTER_SUPABASE/,'planner must use canonical authenticated client');
assert.match(js,/from\('brain_plans'\)/);assert.match(js,/from\('brain_tasks'\)/);assert.match(js,/from\('brain_context_packets'\)/);assert.match(js,/from\('projects'\)/);
assert.match(js,/deriveGroundedTasks/,'planner must derive grounded work from Context Builder packets');
assert.match(js,/project_next_action/);assert.match(js,/project_blocker/);assert.match(js,/tracking_next_step/);
assert.match(js,/duplicateSeedKeys/,'context task seeding must deduplicate existing queue items');
assert.match(js,/confirm\(`Create \$\{candidate\.length\} grounded task/,'multi-task context seeding must require an explicit user action');
assert.match(js,/saved Context Builder packet/,'context-derived tasks must not be mislabeled as independently verified facts');
assert.match(js,/\['draft','active'\]\.includes\(p\.status\)/,'Active + draft filter must exclude paused/completed plans');
assert.match(js,/history\.pushState\(\{\.\.\.history\.state,ccBrainPlannerPlan:id\}/,'open plan must own a Back-history level');
assert.match(js,/history\.back\(\)/,'same open plan bubble must close through history');
assert.match(js,/Progress is derived only from saved task state/,'planner must state the non-invented progress rule');
assert.doesNotMatch(js,/localStorage\.setItem/,'planner must not use browser storage as source of truth');
assert.doesNotMatch(js,/JSON\.stringify\(/,'raw planner JSON must not be exposed in the normal UI');
for(const method of ['load','createPlan','updatePlan','createTask','updateTask','moveTask','seedPlanFromContext','deriveGroundedTasks','planProgress','taskSort','normalizePlanPatch','normalizeTaskPatch','resolveContextScope','mount','refresh'])assert.ok(js.includes(method),`missing planner API method ${method}`);

const sandbox={window:{addEventListener(){}},document:{getElementById(){return null;}},history:{state:null,pushState(){},back(){}},location:{href:'https://example.test/'},confirm(){return false;},prompt(){return null;},CustomEvent:class{},FormData:class{},setTimeout(){},console,Date};
vm.runInNewContext(js,sandbox);
const api=sandbox.window.COMMAND_CENTER_BRAIN_PLANNER;assert.ok(api,'Phase 4 API must mount without the UI');
const packet={id:'ctx-1',context_json:{projects:[{name:'Alpha',next_action:'Verify launch checklist',blocker:'Waiting on approval'}],tracking_integrations:[{project_name:'Alpha',next_step:'Connect revenue source'}]}};
const derived=api.deriveGroundedTasks(packet);assert.equal(derived.length,3);assert.deepEqual(Array.from(derived,t=>t.metadata.planner_seed_type),['project_next_action','project_blocker','tracking_next_step']);assert.ok(derived.every(t=>t.metadata.context_packet_id==='ctx-1'));
const dup=api.deriveGroundedTasks({id:'ctx-2',context_json:{projects:[{next_action:'Do Thing'},{next_action:'do thing'}]}});assert.equal(dup.length,1,'grounded context task derivation must deduplicate equivalent work');
const ordered=[{sort_order:20,status:'backlog',priority:5,created_at:'2026-01-01'},{sort_order:10,status:'blocked',priority:1,created_at:'2026-01-01'}].sort(api.taskSort);assert.equal(ordered[0].sort_order,10,'explicit queue order must outrank task status/priority');
const normalizedPlan=api.normalizePlanPatch({title:'  Alpha plan  ',objective:'   ',project_id:'',metadata:null});assert.equal(normalizedPlan.title,'Alpha plan');assert.equal(normalizedPlan.objective,'','blank plan objective must remain empty text, never NULL');assert.equal(normalizedPlan.project_id,null);assert.deepEqual(Object.assign({},normalizedPlan.metadata),{});assert.throws(()=>api.normalizePlanPatch({title:'   '}),/Plan title is required/);
const normalizedTask=api.normalizeTaskPatch({title:'  First task  ',details:'   ',source_ref:'',metadata:null});assert.equal(normalizedTask.title,'First task');assert.equal(normalizedTask.details,'','blank task details must remain empty text, never NULL');assert.equal(normalizedTask.source_ref,null);assert.deepEqual(Object.assign({},normalizedTask.metadata),{});assert.throws(()=>api.normalizeTaskPatch({title:''}),/Task title is required/);

assert.match(home,/\['Task Queue \/ Planner'[^\]]+,100\]/,'Project Brain Phase 4 roadmap must be 100%');
assert.match(home,/ccBrainPlannerMount/,'Project Brain detail must mount Phase 4 planner');
assert.match(home,/e\.state\?\.ccCommandCenterBrainCapability===capabilityOpen/,'Brain Back handler must preserve nested planner history');
assert.match(home,/\['ChatGPT Handoff Loop'[^\]]+,100\]/,'Phase 5 must now be complete without regressing Phase 4');
assert.match(cfg,/command-center-brain-planner\.css\?v=1/);assert.match(cfg,/command-center-brain-planner\.js\?v=1/);
assert.ok(sw.includes("'./command-center-brain-planner.css?v=1'"));assert.ok(sw.includes("'./command-center-brain-planner.js?v=1'"));
assert.match(sw,/pathname\.endsWith\('\/command-center-brain-planner\.js'\)/);assert.match(sw,/pathname\.endsWith\('\/command-center-brain-planner\.css'\)/);
assert.match(css,/background:#050302|background:#070504|background:#080503/,'planner surfaces must remain black');assert.match(css,/#ff/,'planner must retain orange accents');
console.log('Project Brain Phase 4 Task Queue / Planner QA passed with Phase 5 integrated.');