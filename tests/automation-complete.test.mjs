import fs from 'node:fs';
import assert from 'node:assert/strict';

const sql=fs.readFileSync('supabase/migrations/20261021_automation_phases4_8_completion.sql','utf8');
const indexes=fs.readFileSync('supabase/migrations/20261021_automation_phases4_8_fk_indexes.sql','utf8');
const resume=fs.readFileSync('supabase/migrations/20261021_automation_phases4_8_resume_fix.sql','utf8');
const ui=fs.readFileSync('command-center-automation-advanced.js','utf8');
const completion=fs.readFileSync('command-center-automation-completion.js','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const index=fs.readFileSync('index.html','utf8');

assert.doesNotThrow(()=>new Function(ui));assert.doesNotThrow(()=>new Function(completion));
for(const table of ['automation_report_definitions','automation_report_runs','automation_action_definitions','automation_action_executions','automation_workflows','automation_workflow_steps','automation_workflow_runs','automation_workflow_step_runs','automation_runs','automation_run_events']){assert.match(sql,new RegExp(`create table if not exists public\\.${table}`,'i'));assert.match(sql,new RegExp(`alter table public\\.${table} enable row level security`,'i'));}
assert.match(sql,/create schema if not exists command_center_private/);assert.match(sql,/revoke all on schema command_center_private from public, anon, authenticated/);assert.match(sql,/grant execute on all functions in schema command_center_private to postgres,service_role/);
for(const kind of ['notification','report','action','workflow'])assert.ok(sql.includes(`'${kind}'`));
assert.match(sql,/authorization_state text not null default 'draft'/);assert.match(sql,/a\.status<>'active' or a\.authorization_state<>'authorized'/);assert.match(sql,/idempotency_key text not null/);assert.match(sql,/for update skip locked/);assert.match(sql,/automation_run_events/);assert.match(sql,/on conflict\(owner_id,idempotency_key\)/);
assert.match(resume,/Returned execution failures are handled without raising through the root/);assert.match(resume,/v_result:=command_center_private\.execute_workflow/);assert.doesNotMatch(resume,/raise exception '%'\s*,\s*coalesce\(v_result->>'error'/);
for(const requiredIndex of ['automation_schedules_project_fk_idx','automation_conditions_project_fk_idx','automation_notifications_project_fk_idx','automation_report_definitions_project_fk_idx','automation_action_definitions_project_fk_idx','automation_runs_project_fk_idx','automation_workflow_runs_workflow_fk_idx'])assert.ok(indexes.includes(requiredIndex));
for(const label of ['Recurring Report Jobs','Action Queue Runner','Cross-Project Workflow Chains','Run History','Failure Recovery'])assert.ok(ui.includes(label));
for(const rpc of ['command_center_queue_report','command_center_queue_action','command_center_queue_workflow','command_center_retry_automation_run'])assert.ok(ui.includes(rpc));
assert.match(completion,/8 of 8 phases complete/);assert.match(completion,/ccAutomationAdvancedMount/);
for(const asset of ['command-center-automation-advanced.css?v=1','command-center-automation-advanced.js?v=1','command-center-automation-completion.js?v=1']){assert.ok(cfg.includes(asset));assert.ok(sw.includes(`'./${asset}'`));assert.ok(sw.includes(`pathname.endsWith('/${asset.split('?')[0]}')`));}
assert.match(cfg,/command-center-integrations\.js\?v=1/);assert.match(cfg,/command-center-analytics\.js\?v=1/);assert.match(cfg,/command-center-security\.js\?v=1/);assert.match(cfg,/command-center-deployment\.js\?v=1/,'Deployment release must preserve Automation while extending the app');
assert.match(index,/minimum-scale=1,maximum-scale=1,user-scalable=no/);assert.match(index,/cc-startup-repair-attempted-v64/);assert.match(sw,/james-command-center-v73/,'Automation must remain intact under the current Command Center release cache');
console.log('Automation Phases 4–8 completion QA preserved under current Command Center release.');
