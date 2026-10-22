import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const schema=readFileSync('supabase/migrations/20261021_agent_mode.sql','utf8');
const hardening=readFileSync('supabase/migrations/20261021_agent_mode_trigger_privilege_hardening.sql','utf8');
const ui=readFileSync('command-center-agent-mode.js','utf8');
const completion=readFileSync('command-center-agent-mode-completion.js','utf8');
const cfg=readFileSync('app-config.js','utf8');
const sw=readFileSync('service-worker.js','utf8');
const html=readFileSync('index.html','utf8');
const standard=readFileSync('AGENT_MODE_STANDARD.md','utf8');
const workStandard=readFileSync('AGENT_MODE_WORK_STANDARD.md','utf8');
const retryStandard=readFileSync('AGENT_MODE_RETRY_STANDARD.md','utf8');
const booksStandard=readFileSync('AGENT_MODE_BOOKS_STANDARD.md','utf8');
const runnerStandard=readFileSync('AGENT_MODE_RUNNER_STANDARD.md','utf8');

for(const table of ['agent_sessions','agent_session_projects','agent_steps','agent_step_evidence','agent_checkpoints','agent_step_attempts','agent_work_handoffs','agent_work_queue','agent_circuit_breakers','agent_tool_registry','agent_run_events'])assert.match(schema,new RegExp(`create table if not exists public\\.${table}`,'i'),`missing ${table}`);
for(const fn of ['command_center_agent_create_project_only_session','command_center_agent_list_sessions','command_center_agent_status','command_center_agent_pause','command_center_agent_resume','command_center_agent_cancel','command_center_agent_approve_sol_medium_step','command_center_agent_start_work_handoff','command_center_agent_record_work_result'])assert.match(schema,new RegExp(fn),`missing ${fn}`);
assert.match(schema,/GPT-6 Luna High/);assert.match(schema,/GPT-6\.1 Sol Light/);assert.match(schema,/GPT-6\.1 Sol Medium/);assert.doesNotMatch(schema,/GPT-6 Astra/);
assert.match(schema,/capability_insufficient/);assert.match(schema,/execution_complexity/);assert.match(schema,/captcha_or_mfa/);assert.match(schema,/one-active-Work|concurrency limit is 1/i);
assert.match(hardening,/revoke execute on function public\.command_center_agent_set_updated_at\(\) from public, anon, authenticated/i);
assert.match(hardening,/grant execute on function public\.command_center_agent_set_updated_at\(\) to service_role/i);

assert.match(ui,/This Project Only/);
assert.match(ui,/Approve Sol Medium/);
assert.match(ui,/Execution bridge: <strong>N\/A<\/strong>/,'base UI must fail closed until verified runner health replaces N/A');
assert.match(ui,/Work allowance \$\{m\.work_allowance_remaining\?\?'N\/A'\}/,'unknown Work allowance must display N/A');
assert.match(ui,/command_center_agent_create_project_only_session/);
assert.match(ui,/command_center_agent_approve_sol_medium_step/);
assert.doesNotMatch(ui,/GPT-6 Astra/,'Agent UI must not expose Astra runtime options');
assert.match(completion,/8 of 8 phases complete/);
assert.match(completion,/100% · Complete/);

for(const asset of ['command-center-agent-mode.css?v=1','command-center-agent-mode.js?v=1','command-center-agent-device-guidance.css?v=1','command-center-agent-device-guidance.js?v=1','command-center-agent-runner-status.js?v=1','command-center-agent-home.css?v=1','command-center-agent-home.js?v=1','command-center-agent-mode-completion.js?v=2'])assert.ok(cfg.includes(asset),`app config missing ${asset}`);
for(const asset of ['./command-center-agent-mode.css?v=1','./command-center-agent-mode.js?v=1','./command-center-agent-device-guidance.css?v=1','./command-center-agent-device-guidance.js?v=1','./command-center-agent-runner-status.js?v=1','./command-center-agent-home.css?v=1','./command-center-agent-home.js?v=1','./command-center-agent-mode-completion.js?v=2','./app-config.js?v=27'])assert.ok(sw.includes(`'${asset}'`),`PWA cache missing ${asset}`);
for(const path of ['command-center-agent-mode.css','command-center-agent-mode.js','command-center-agent-device-guidance.css','command-center-agent-device-guidance.js','command-center-agent-runner-status.js','command-center-agent-home.css','command-center-agent-home.js','command-center-agent-mode-completion.js'])assert.ok(sw.includes(`pathname.endsWith('/${path}')`),`fresh Agent asset path missing ${path}`);
assert.match(sw,/james-command-center-v71/);
assert.match(sw,/fetch\(e\.request,\{cache:'no-store'\}\)/,'fresh Agent/app assets must use network-first refresh');
assert.match(html,/app-config\.js\?v=27/);
assert.match(html,/width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover/,'protected viewport must remain exact');
assert.match(html,/cc-startup-repair-attempted-v63/,'startup repair marker must remain protected');

for(const phrase of ['Sol Medium','Astra','normal chat','Books'])assert.ok(standard.toLowerCase().includes(phrase.toLowerCase()),`Agent standard missing ${phrase}`);
assert.match(workStandard,/GPT-6\.1 Sol Medium/);
assert.match(retryStandard,/Failure must produce information/i);
assert.match(booksStandard,/explicit/i);
assert.match(runnerStandard,/hourly/i);
assert.match(runnerStandard,/PC REQUIRED/);
assert.match(runnerStandard,/TinyFish Agent\/Browser are metered/);

console.log('Agent Mode release QA passed: all 8 phases, service runner, project locks, verification, Work ceiling, retry safety, device guidance, tool health, home Agent controls, completion patch, and PWA v71 release assets are present.');
