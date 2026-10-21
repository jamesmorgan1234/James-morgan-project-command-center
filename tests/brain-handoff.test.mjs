import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const migration=fs.readFileSync('supabase/migrations/20261021_brain_phase5_chatgpt_handoff.sql','utf8');
const js=fs.readFileSync('command-center-brain-handoff.js','utf8');
const css=fs.readFileSync('command-center-brain-handoff.css','utf8');
const home=fs.readFileSync('command-center-brain-home.js','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

assert.match(migration,/create table if not exists public\.brain_handoffs/);
for(const phrase of ["owner_id uuid not null references auth.users(id)","context_packet_id uuid null references public.brain_context_packets(id)","plan_id uuid null references public.brain_plans(id)","task_ids uuid[] not null default '{}'::uuid[]","destination text not null default 'chatgpt'","status text not null default 'draft'","alter table public.brain_handoffs enable row level security","brain_handoffs_set_updated_at","is_command_center_authorized"])assert.ok(migration.includes(phrase));
for(const s of ['draft','sent','returned','verified','archived'])assert.ok(migration.includes(`'${s}'`));
assert.doesNotThrow(()=>new Function(js));assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
assert.match(js,/window\.COMMAND_CENTER_SUPABASE/);for(const table of ['projects','brain_context_packets','brain_plans','brain_tasks','brain_handoffs'])assert.ok(js.includes(`from('${table}')`));
for(const method of ['load','resolveSelection','buildHandoffText','createHandoff','updateDraft','markSent','saveReturn','verifyReturn','applyVerifiedTasks','saveVerifiedMemory','archive','restore','copyText','openChatGPT','mount','refresh'])assert.ok(js.includes(method));
assert.match(js,/Do not claim an external action happened unless it was actually performed and verifiable/);assert.match(js,/Verify the returned result before applying task completion/);assert.match(js,/Verify the returned result before saving it to Durable Memory/);assert.match(js,/history\.back\(\)/);assert.doesNotMatch(js,/localStorage\.setItem/);assert.doesNotMatch(js,/setInterval\(/);
assert.match(css,/background:#030201|background:#050302|background:#080503/);assert.doesNotMatch(css,/#071a36|#0a2347|#0a2146|#081a38|#0a2147/);
const sandbox={window:{addEventListener(){},COMMAND_CENTER_SUPABASE:null},document:{getElementById(){return null;},createElement(){return {style:{},setAttribute(){},select(){},remove(){}};},body:{appendChild(){}}},history:{state:null,pushState(){},back(){}},location:{href:'https://example.test/'},navigator:{},confirm(){return false;},prompt(){return null;},CustomEvent:class{},FormData:class{},setTimeout(){},console,Date};
vm.runInNewContext(js,sandbox);assert.ok(sandbox.window.COMMAND_CENTER_BRAIN_HANDOFF);assert.throws(()=>sandbox.window.COMMAND_CENTER_BRAIN_HANDOFF.buildHandoffText({title:'Test',request:'Do work'}),/Choose a context packet, plan, or task/);
assert.match(home,/\['Durable Memory'[^\]]+,100\]/);assert.match(home,/\['Task Queue \/ Planner'[^\]]+,100\]/);assert.match(home,/\['ChatGPT Handoff Loop'[^\]]+,100\]/);assert.match(home,/ccBrainHandoffMount/);assert.match(home,/Project Brain \$\{brainPct\}%/);
assert.match(cfg,/command-center-brain-handoff\.js\?v=1/);assert.match(cfg,/command-center-integrations\.js\?v=1/);assert.match(html,/app-config\.js\?v=22/);assert.match(html,/cc-startup-repair-attempted-v63/);assert.match(sw,/james-command-center-v66/);assert.ok(sw.includes("'./app-config.js?v=22'"));assert.ok(sw.includes("'./command-center-brain-handoff.js?v=1'"));assert.ok(sw.includes("'./command-center-integrations.js?v=1'"));assert.ok(sw.includes("'./roadmap-checkpoint-runtime.js?v=1'"));
console.log('Project Brain Phase 5 handoff QA preserved under Integrations release.');
