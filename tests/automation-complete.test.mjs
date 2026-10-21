import fs from 'node:fs';
import assert from 'node:assert/strict';

const sql=fs.readFileSync('supabase/migrations/20261021_automation_phases4_8_completion.sql','utf8');
const ui=fs.readFileSync('command-center-automation-advanced.js','utf8');
const completion=fs.readFileSync('command-center-automation-completion.js','utf8');
const css=fs.readFileSync('command-center-automation-advanced.css','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const index=fs.readFileSync('index.html','utf8');

assert.doesNotThrow(()=>new Function(ui),'advanced Automation UI must parse');
assert.doesNotThrow(()=>new Function(completion),'Automation completion UI must parse');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'advanced Automation CSS braces must balance');

for(const table of [
  'automation_report_definitions','automation_report_runs','automation_action_definitions','automation_action_executions',
  'automation_workflows','automation_workflow_steps','automation_workflow_runs','automation_workflow_step_runs',
  'automation_runs','automation_run_events'
]){
  assert.match(sql,new RegExp(`create table if not exists public\\.${table}`,'i'),`missing ${table}`);
  assert.match(sql,new RegExp(`alter table public\\.${table} enable row level security`,'i'),`${table} must enable RLS`);
}

assert.match(sql,/create schema if not exists command_center_private/,'privileged execution must use a private schema');
assert.match(sql,/revoke all on schema command_center_private from public, anon, authenticated/,'browser roles must not receive private schema access');
assert.match(sql,/revoke all on all functions in schema command_center_private from public,anon,authenticated/,'private functions must not be browser-callable');
assert.match(sql,/grant execute on all functions in schema command_center_private to postgres,service_role/,'private executors must be limited to trusted server roles');

for(const kind of ['notification','report','action','workflow'])assert.ok(sql.includes(`'${kind}'`),`missing automation job kind ${kind}`);
assert.match(sql,/add column if not exists max_attempts integer not null default 3/,'bounded retries must be part of schedules/dispatches');
assert.match(sql,/idempotency_key text not null/,'runs must carry durable idempotency keys');
assert.match(sql,/unique\(owner_id,idempotency_key\)/,'side-effect records must be idempotent by owner');
assert.match(sql,/authorization_state text not null default 'draft'/,'actions must default to unauthorized draft state');
assert.match(sql,/a\.status<>'active' or a\.authorization_state<>'authorized'/,'runner must reject unauthorized actions');

for(const fn of [
  'generate_report','execute_action','execute_workflow','execute_run','dispatch_to_run','queue_manual','log_run_event','ensure_dispatch_notification'
])assert.match(sql,new RegExp(`command_center_private\\.${fn}`),`missing private executor ${fn}`);
for(const fn of ['command_center_queue_report','command_center_queue_action','command_center_queue_workflow','command_center_retry_automation_run','command_center_automation_recovery_tick'])assert.match(sql,new RegExp(`public\\.${fn}`),`missing public/server automation entrypoint ${fn}`);
assert.match(sql,/command-center-automation-recovery/,'failure recovery cron heartbeat must be installed');
assert.match(sql,/\* \* \* \* \*/,'recovery heartbeat must use bounded once-per-minute scheduling');
assert.match(sql,/for update skip locked/,'concurrent scheduler/recovery workers must use skip-locked claiming');
assert.match(sql,/least\(3600,60\*\(2\^greatest\(v_attempt-1,0\)\)::integer\)/,'failure recovery must use bounded exponential backoff');
assert.match(sql,/if found and sr\.status='succeeded' then/,'workflow retries must preserve already-successful steps');
assert.match(sql,/resume_state=jsonb_build_object/,'workflow execution must persist resumable state');
assert.match(sql,/automation_run_events/,'run transitions must be durably recorded');
assert.match(sql,/on conflict\(owner_id,idempotency_key\)/,'report/action/notification retry paths must suppress duplicate side effects');

assert.doesNotMatch(sql,/insert into public\.automation_(report_definitions|action_definitions|workflows|schedules)\s*\([^)]*\)\s*values\s*\([^)]*'QA'/i,'migration must not seed fake user automation data');
assert.doesNotMatch(sql,/OPENAI_API_KEY|service_role_key|sk-[A-Za-z0-9]/,'automation completion must not add paid/secret client dependencies');

for(const label of ['Recurring Report Jobs','Action Queue Runner','Cross-Project Workflow Chains','Run History','Failure Recovery'])assert.ok(ui.includes(label),`advanced Automation UI missing ${label}`);
for(const rpc of ['command_center_queue_report','command_center_queue_action','command_center_queue_workflow','command_center_retry_automation_run'])assert.ok(ui.includes(rpc),`advanced Automation UI missing ${rpc}`);
assert.match(ui,/authorization_state:f\.get\('authorize'\)\?'authorized':'draft'/,'routine actions require explicit authorization when created');
assert.match(ui,/COMMAND_CENTER_SUPABASE/,'advanced Automation must reuse the canonical authenticated client');
assert.doesNotMatch(ui,/service_role|secret_key|OPENAI_API_KEY/,'browser Automation UI must not contain privileged credentials');
assert.match(completion,/8 of 8 phases complete/,'roadmap must show all eight Automation phases complete');
assert.match(completion,/let mount=document\.getElementById\('ccAutomationAdvancedMount'\),created=false/,'advanced workspace mount must be creation-aware');
assert.match(completion,/if\(created\)window\.COMMAND_CENTER_AUTOMATION_ADVANCED\?\.mount\?\.\(\)/,'advanced workspace must not remount on every DOM mutation');

for(const asset of ['command-center-automation-advanced.css?v=1','command-center-automation-advanced.js?v=1','command-center-automation-completion.js?v=1']){
  assert.ok(cfg.includes(asset),`app config missing ${asset}`);
  assert.ok(sw.includes(`'./${asset}'`),`service worker missing ${asset}`);
  assert.ok(sw.includes(`pathname.endsWith('/${asset.split('?')[0]}')`),`service worker fresh-asset list missing ${asset}`);
}

assert.match(index,/minimum-scale=1,maximum-scale=1,user-scalable=no/,'protected viewport lock must remain intact');
assert.match(index,/cc-startup-repair-attempted-v63/,'protected startup repair marker must remain unchanged');
assert.match(sw,/james-command-center-v65/,'Automation completion must not churn the already-approved PWA cache identity without need');

console.log('Automation Phases 4–8 completion QA passed.');
