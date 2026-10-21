import fs from 'node:fs';
import assert from 'node:assert/strict';

const ui=fs.readFileSync('command-center-agent-mode.js','utf8');
const css=fs.readFileSync('command-center-agent-mode.css','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const brain=fs.readFileSync('command-center-brain-home.js','utf8');
const standard=fs.readFileSync('AGENT_MODE_STANDARD.md','utf8');
const workStandard=fs.readFileSync('AGENT_MODE_WORK_ENVELOPE_STANDARD.md','utf8');
const retryStandard=fs.readFileSync('AGENT_MODE_RETRY_CIRCUIT_BREAKER_STANDARD.md','utf8');
const booksStandard=fs.readFileSync('AGENT_MODE_BOOKS_POLICY.md','utf8');
const schema=fs.readFileSync('supabase/migrations/20261021224000_agent_mode_schema.sql','utf8');
const core=fs.readFileSync('supabase/migrations/20261021224100_agent_mode_core_rpcs.sql','utf8');
const work=fs.readFileSync('supabase/migrations/20261021224200_agent_mode_work_rpcs.sql','utf8');
const controls=fs.readFileSync('supabase/migrations/20261021224300_agent_mode_project_controls.sql','utf8');
const aliasFix=fs.readFileSync('supabase/migrations/20261021224400_agent_mode_create_session_alias_fix.sql','utf8');
const workHardening=fs.readFileSync('supabase/migrations/20261021224500_agent_mode_work_execution_gate_hardening.sql','utf8');
const browserHardening=fs.readFileSync('supabase/migrations/20261021224600_agent_mode_browser_boundary_hardening.sql','utf8');
const fkIndexes=fs.readFileSync('supabase/migrations/20261021224700_agent_mode_fk_indexes.sql','utf8');

assert.doesNotThrow(()=>new Function(ui),'Agent Mode UI must parse');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Agent Mode CSS braces must balance');

for(const table of ['agent_sessions','agent_session_projects','agent_steps','agent_step_evidence','agent_checkpoints','agent_step_attempts','agent_work_handoffs','agent_work_queue','agent_circuit_breakers','agent_tool_registry','agent_run_events']){
  assert.match(schema,new RegExp(`create table if not exists public\\.${table}`,'i'),`missing ${table}`);
  assert.match(schema,new RegExp(`alter table public\\.${table} enable row level security`,'i'),`${table} must use RLS`);
}
assert.doesNotMatch(schema,/grant\s+(?:select|insert|update|delete).*agent_.*to authenticated/i,'browser roles must not receive raw Agent table access');
assert.match(browserHardening,/agent_owner_select_agent_sessions/,'owner RLS policies must be installed');
assert.match(browserHardening,/revoke execute on function public\.command_center_agent_record_work_result.*from authenticated/is,'browser must not fabricate Work results');
assert.match(browserHardening,/revoke execute on function public\.command_center_agent_confirm_evidence.*from authenticated/is,'browser must not confirm executor evidence');
assert.match(browserHardening,/grant execute on function public\.command_center_agent_record_work_result.*to service_role/is,'service runtime must retain executor access');

for(const phrase of ['GPT-6 Luna High','GPT-6.1 Sol Light','GPT-6.1 Sol Medium'])assert.ok((work+workHardening+controls).includes(phrase),`missing allowed model ${phrase}`);
assert.doesNotMatch(work,/GPT-6 Astra (?:Light|Medium)/,'Astra must not be accepted in Agent Work runtime');
assert.doesNotMatch(workHardening,/GPT-6 Astra (?:Light|Medium)/,'Astra must not be accepted by hardened Work start');
assert.match(core,/Invalid or prohibited Work model rung/,'server-side model validation required');
assert.match(work,/Normal-chat exhaustion gate has not passed/,'normal-chat exhaustion gate required');
assert.match(work,/Agent Mode Work concurrency limit is 1/,'Work concurrency guard required');
assert.match(work,/Identical blind retry is forbidden/,'blind retry must be blocked');
assert.match(work,/Transient automatic retry budget is exhausted/,'transient retry limit required');
assert.match(work,/Duplicate side effect prevented/,'duplicate side-effect lock required');
assert.match(work,/capability_insufficient/);
assert.match(work,/execution_complexity/);
assert.match(workHardening,/Dependencies are not verified/,'Work must re-check dependencies');
assert.match(workHardening,/Dry-run session cannot begin a side effect/,'Work must enforce dry-run side-effect lock');

assert.match(controls,/project_switch_mode','this_project_only/,'project-only execution policy must be hard locked');
assert.match(controls,/array\[p_project_id\]/,'project-only session must contain exactly the named project');
assert.match(controls,/approval_scope','this_step_only/,'Sol Medium approval must be exact-step only');
assert.match(controls,/agent_mode_work_sol_medium/,'Sol Medium approval must use Security authorization');
assert.match(aliasFix,/proj record/,'session alias-shadow fix must be retained');
assert.match(fkIndexes,/agent_sessions_current_step_fk/);
assert.match(fkIndexes,/agent_sessions_latest_checkpoint_fk/);

for(const label of ['Agent Session Model','Goal Intake','Step Executor','Tool Permission Gate','Verification Gate','Checkpoint & Resume','Failure Recovery','Cross-Project Agent Runs'])assert.ok(brain.includes(label),`Agent roadmap missing ${label}`);
assert.match(ui,/This Project Only/);
assert.match(ui,/Approve Sol Medium/);
assert.match(ui,/Execution bridge: <strong>N\/A<\/strong>/,'UI must not pretend an unavailable executor bridge is connected');
assert.match(ui,/Work allowance \$\{m\.work_allowance_remaining\?\?'N\/A'\}/,'unknown Work allowance must display N/A');
assert.match(ui,/command_center_agent_create_project_only_session/);
assert.match(ui,/command_center_agent_approve_sol_medium_step/);
assert.doesNotMatch(ui,/GPT-6 Astra/,'Agent UI must not expose Astra runtime options');

for(const asset of ['command-center-agent-mode.css?v=1','command-center-agent-mode.js?v=1'])assert.ok(cfg.includes(asset),`app config missing ${asset}`);
assert.match(html,/width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover/,'protected viewport must remain exact');
assert.match(html,/cc-startup-repair-attempted-v63/,'startup repair marker must remain protected');

for(const phrase of ['Sol Medium','Astra','normal chat','Books'])assert.ok(standard.toLowerCase().includes(phrase.toLowerCase()),`Agent standard missing ${phrase}`);
assert.match(workStandard,/GPT-6\.1 Sol Medium/);
assert.match(retryStandard,/Failure must produce information/i);
assert.match(booksStandard,/explicit/i);

console.log('Agent Mode runtime QA passed: scope, permissions, verification, Work ceiling, retry safety, project-only controls, and UI protections are present.');
