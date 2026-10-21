import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const migration=fs.readFileSync('supabase/migrations/20261021_automation_phase1_scheduler_engine.sql','utf8');
const js=fs.readFileSync('command-center-automation-scheduler.js','utf8');
const css=fs.readFileSync('command-center-automation-scheduler.css','utf8');
const home=fs.readFileSync('command-center-brain-home.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

for(const table of ['automation_schedules','automation_dispatch_queue'])assert.match(migration,new RegExp(`create table if not exists public\\.${table}`));
for(const phrase of ['create extension if not exists pg_cron','command_center_scheduler_next_run','command_center_prepare_automation_schedule','command_center_scheduler_tick','for update skip locked',"cron.schedule('command-center-scheduler-tick','* * * * *'",'security definer','unique(schedule_id,scheduled_for)','is_command_center_authorized'])assert.ok(migration.includes(phrase),`missing Scheduler Engine schema control: ${phrase}`);
for(const p of ['automation_schedules_select_own','automation_schedules_insert_own','automation_schedules_update_own','automation_schedules_delete_own','automation_dispatch_select_own'])assert.ok(migration.includes(p),`missing scheduler RLS policy ${p}`);
assert.doesNotMatch(migration,/create policy automation_dispatch_(insert|update|delete)/,'client must not forge or mutate scheduler dispatch records');
assert.match(migration,/revoke all on public\.automation_dispatch_queue from anon, authenticated/);
assert.match(migration,/grant select on public\.automation_dispatch_queue to authenticated/);
assert.match(migration,/schedule_kind in \('once','interval','daily','weekly'\)/);
assert.match(migration,/interval_minutes between 5 and 525600/);
assert.match(migration,/weekdays <@ array\[0,1,2,3,4,5,6\]/);
assert.match(migration,/status in \('active','paused','completed','archived'\)/);
assert.match(migration,/status in \('queued','claimed','completed','skipped','failed'\)/);
assert.match(migration,/revoke all on function public\.command_center_scheduler_tick/,'authenticated clients must not invoke the privileged heartbeat');

assert.doesNotThrow(()=>new Function(js),'Scheduler Engine controller must parse');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Scheduler Engine CSS braces must balance');
assert.match(js,/window\.COMMAND_CENTER_SUPABASE/,'scheduler must reuse the canonical authenticated client');
assert.match(js,/from\('automation_schedules'\)/);assert.match(js,/from\('automation_dispatch_queue'\)/);assert.match(js,/from\('projects'\)/);
assert.match(js,/Intl\.DateTimeFormat\(\)\.resolvedOptions\(\)\.timeZone/,'scheduler must preserve the device timezone for local recurring schedules');
assert.match(js,/history\.pushState\(\{\.\.\.history\.state,ccAutomationSchedule:id\}/,'schedule detail must own a Back-history level');
assert.match(js,/history\.back\(\)/,'same open schedule bubble must close through history');
assert.match(js,/Server-side scheduling continues even when Command Center is closed/);
assert.match(js,/Later Automation phases can evaluate conditions, notify you, generate reports, or execute separately authorized actions/,'Phase 1 copy must preserve its original scope boundary');
assert.doesNotMatch(js,/localStorage\.setItem|sessionStorage\.setItem/,'scheduler persistence must not use browser storage as source of truth');
assert.doesNotMatch(js,/JSON\.stringify\(/,'normal Scheduler Engine UI must not expose raw JSON');

const sandbox={window:{addEventListener(){},COMMAND_CENTER_SUPABASE:null},document:{getElementById(){return null;}},history:{state:null,pushState(){},back(){}},location:{href:'https://example.test/'},Intl,Date,confirm(){return false;},FormData:class{},console};
vm.runInNewContext(js,sandbox);
const api=sandbox.window.COMMAND_CENTER_AUTOMATION_SCHEDULER;assert.ok(api,'Scheduler Engine API must mount without the UI');
const once=api.normalizeSchedule({name:'  Launch review ',job_label:' Check launch ',schedule_kind:'once',schedule_at:'2027-01-02T12:30',timezone:'UTC'});assert.equal(once.name,'Launch review');assert.equal(once.job_label,'Check launch');assert.equal(once.schedule_kind,'once');assert.ok(once.schedule_at.endsWith('Z'));
const interval=api.normalizeSchedule({name:'Hourly check',job_label:'Review priorities',schedule_kind:'interval',interval_minutes:'60',timezone:'UTC',max_runs:'3'});assert.equal(interval.interval_minutes,60);assert.equal(interval.max_runs,3);assert.throws(()=>api.normalizeSchedule({name:'Too fast',job_label:'Check',schedule_kind:'interval',interval_minutes:'4',timezone:'UTC'}),/between 5 and 525600/);
const weekly=api.normalizeSchedule({name:'Weekly review',job_label:'Review plan',schedule_kind:'weekly',local_time:'08:15',weekdays:['1','3','1','6'],timezone:'UTC'});assert.deepEqual(Array.from(weekly.weekdays),[1,3,6]);assert.equal(weekly.local_time,'08:15:00');assert.throws(()=>api.normalizeSchedule({name:'No days',job_label:'Review',schedule_kind:'weekly',local_time:'08:00',weekdays:[],timezone:'UTC'}),/at least one weekday/);

assert.match(home,/\['Scheduler Engine'[^\]]+,100\]/,'Automation Phase 1 must remain 100%');
assert.match(home,/\['Condition Evaluator'[^\]]+,100\]/,'Automation Phase 2 must remain 100%');
assert.match(home,/\['Notification Delivery'[^\]]+,100\]/,'Automation Phase 3 must be 100% without regressing Scheduler Engine');
for(const future of ['Recurring Report Jobs','Action Queue Runner','Cross-Project Workflow Chains','Run History','Failure Recovery'])assert.match(home,new RegExp(`\\['${future.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}'[^\\]]+,0\\]`),`${future} must remain planned`);
assert.match(home,/ccAutomationSchedulerMount/,'Automation detail must mount Scheduler Engine');
assert.match(home,/command-center-automation-scheduler\.css\?v=1/);assert.match(home,/command-center-automation-scheduler\.js\?v=1/);
assert.ok(sw.includes("'./command-center-automation-scheduler.css?v=1'"));assert.ok(sw.includes("'./command-center-automation-scheduler.js?v=1'"));assert.match(sw,/pathname\.endsWith\('\/command-center-automation-scheduler\.js'\)/);assert.match(sw,/pathname\.endsWith\('\/command-center-automation-scheduler\.css'\)/);
assert.match(css,/background:linear-gradient\(180deg,#080503,#030303\)!important/,'scheduler surfaces must stay black');assert.match(css,/#ff6208/,'scheduler must retain orange Command Center accents');assert.doesNotMatch(css,/#071a36|#0a2347|#0a2146|#081a38|#0a2147/,'Scheduler Engine must not reintroduce legacy blue structural surfaces');

console.log('Automation Phase 1 Scheduler Engine regression QA passed with Phases 2-3 integrated.');
