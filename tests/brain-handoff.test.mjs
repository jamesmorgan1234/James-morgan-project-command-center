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
for(const phrase of ["owner_id uuid not null references auth.users(id)","context_packet_id uuid null references public.brain_context_packets(id)","plan_id uuid null references public.brain_plans(id)","task_ids uuid[] not null default '{}'::uuid[]","destination text not null default 'chatgpt'","status text not null default 'draft'","alter table public.brain_handoffs enable row level security","brain_handoffs_set_updated_at","is_command_center_authorized"])assert.ok(migration.includes(phrase),`missing Phase 5 schema control: ${phrase}`);
for(const s of ['draft','sent','returned','verified','archived'])assert.ok(migration.includes(`'${s}'`),`missing handoff status ${s}`);
for(const p of ['brain_handoffs_select_own','brain_handoffs_insert_own','brain_handoffs_update_own','brain_handoffs_delete_own'])assert.ok(migration.includes(p),`missing owner RLS policy ${p}`);
assert.match(migration,/using gin\(task_ids\)/);

assert.doesNotThrow(()=>new Function(js),'Phase 5 handoff controller must parse');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Phase 5 CSS braces must balance');
assert.match(js,/window\.COMMAND_CENTER_SUPABASE/,'handoff loop must use canonical authenticated client');
for(const table of ['projects','brain_context_packets','brain_plans','brain_tasks','brain_handoffs'])assert.ok(js.includes(`from('${table}')`),`handoff loop must use ${table}`);
for(const method of ['load','resolveSelection','buildHandoffText','createHandoff','updateDraft','markSent','saveReturn','verifyReturn','applyVerifiedTasks','saveVerifiedMemory','archive','restore','copyText','openChatGPT','mount','refresh'])assert.ok(js.includes(method),`missing handoff API method ${method}`);
assert.match(js,/COMMAND CENTER → CHATGPT HANDOFF/);
assert.match(js,/RETURN INSTRUCTIONS/);
assert.match(js,/Do not claim an external action happened unless it was actually performed and verifiable/);
assert.match(js,/if\(h\?\.status!=='verified'\)throw new Error\('Verify the returned result before applying task completion\.'/,'task application must be gated by explicit verification');
assert.match(js,/if\(h\?\.status!=='verified'\|\|!h\.response_text\)throw new Error\('Verify the returned result before saving it to Durable Memory\.'/,'memory promotion must require a verified result');
assert.match(js,/confirm\('Confirm that you reviewed this returned result and accept it as verified\?'\)/,'verification must be an explicit user action');
assert.match(js,/confirm\('Mark the linked tasks as done based on this verified result\?'\)/,'task completion must require a separate explicit user action');
assert.match(js,/confirm\('Save this verified returned result into Durable Memory\?'\)/,'memory promotion must require a separate explicit user action');
assert.match(js,/window\.open\('https:\/\/chatgpt\.com\/'/,'ChatGPT opening must be user-triggered through the handoff workspace');
assert.match(js,/ccBrainHandoffId/,'open handoff cards must own a browser/Android Back history level');
assert.match(js,/history\.back\(\)/,'same open handoff bubble must close through history');
assert.doesNotMatch(js,/localStorage\.setItem/,'handoffs must not use local browser storage as source of truth');
assert.doesNotMatch(js,/setInterval\(/,'Phase 5 must not silently poll or auto-send handoffs');
assert.match(css,/background:#030201|background:#050302|background:#080503/,'Phase 5 surfaces must remain black');
assert.match(css,/#ff/,'Phase 5 must retain orange accents');
assert.doesNotMatch(css,/#071a36|#0a2347|#0a2146|#081a38|#0a2147/,'Phase 5 must not reintroduce blue structural surfaces');

const sandbox={window:{addEventListener(){},COMMAND_CENTER_SUPABASE:null},document:{getElementById(){return null;},createElement(){return {style:{},setAttribute(){},select(){},remove(){}};},body:{appendChild(){}}},history:{state:null,pushState(){},back(){}},location:{href:'https://example.test/'},navigator:{},confirm(){return false;},prompt(){return null;},CustomEvent:class{},FormData:class{},setTimeout(){},console,Date};
vm.runInNewContext(js,sandbox);
assert.ok(sandbox.window.COMMAND_CENTER_BRAIN_HANDOFF,'Phase 5 API must mount without creating data');
assert.throws(()=>sandbox.window.COMMAND_CENTER_BRAIN_HANDOFF.buildHandoffText({title:'Test',request:'Do work'}),/Choose a context packet, plan, or task/,'handoff builder must reject ungrounded work');

assert.match(home,/\['Durable Memory'[^\]]+,100\]/);
assert.match(home,/\['Brainstorm Workspace'[^\]]+,100\]/);
assert.match(home,/\['Context Builder'[^\]]+,100\]/);
assert.match(home,/\['Task Queue \/ Planner'[^\]]+,100\]/);
assert.match(home,/\['ChatGPT Handoff Loop'[^\]]+,100\]/,'Project Brain Phase 5 roadmap must be 100%');
assert.match(home,/ccBrainHandoffMount/,'Project Brain detail must mount Phase 5');
assert.match(home,/Project Brain \$\{brainPct\}%/,'Project Brain percentage must still derive from phase values');
assert.match(cfg,/command-center-brain-home\.js\?v=5/);
assert.match(cfg,/command-center-brain-handoff\.css\?v=1/);assert.match(cfg,/command-center-brain-handoff\.js\?v=1/);
assert.match(html,/app-config\.js\?v=20/);assert.match(html,/cc-startup-repair-attempted-v63/);
assert.match(sw,/james-command-center-v63/);assert.ok(sw.includes("'./app-config.js?v=20'"));assert.ok(sw.includes("'./command-center-brain-home.js?v=5'"));assert.ok(sw.includes("'./command-center-brain-handoff.css?v=1'"));assert.ok(sw.includes("'./command-center-brain-handoff.js?v=1'"));assert.match(sw,/pathname\.endsWith\('\/command-center-brain-handoff\.js'\)/);assert.match(sw,/pathname\.endsWith\('\/command-center-brain-handoff\.css'\)/);

console.log('Project Brain Phase 5 ChatGPT Handoff Loop QA passed.');
