import fs from 'node:fs';
import assert from 'node:assert/strict';

const migration=fs.readFileSync('supabase/migrations/20261021_brain_phase1_durable_memory.sql','utf8');
const js=fs.readFileSync('command-center-brain-memory.js','utf8');
const css=fs.readFileSync('command-center-brain-memory.css','utf8');
const home=fs.readFileSync('command-center-brain-home.js','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const html=fs.readFileSync('index.html','utf8');

assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Durable Memory stylesheet braces must balance');
assert.ok(js.length>7000,'Durable Memory controller unexpectedly small');

assert.match(migration,/create table if not exists public\.brain_memories/);
assert.match(migration,/owner_id uuid not null references auth\.users\(id\) on delete cascade/);
assert.match(migration,/project_id text null references public\.projects\(id\) on delete set null/);
assert.match(migration,/alter table public\.brain_memories enable row level security/);
assert.match(migration,/brain_memories_select_own/);
assert.match(migration,/brain_memories_insert_own/);
assert.match(migration,/brain_memories_update_own/);
assert.match(migration,/brain_memories_delete_own/);
assert.match(migration,/owner_id = \(select auth\.uid\(\)\)/);
assert.match(migration,/select public\.is_command_center_authorized\(\)/);
assert.match(migration,/revoke all on table public\.brain_memories from anon/);
assert.match(migration,/grant select, insert, update, delete on table public\.brain_memories to authenticated/);
assert.match(migration,/brain_memories_owner_updated_idx/);
assert.match(migration,/brain_memories_owner_status_idx/);
assert.match(migration,/brain_memories_owner_project_idx/);
assert.match(migration,/brain_memories_tags_gin_idx/);
assert.match(migration,/execute function public\.command_center_set_updated_at\(\)/);

assert.match(js,/from\('brain_memories'\)\.select/,'Durable Memory must read from Supabase');
assert.match(js,/from\('brain_memories'\)\.insert/,'Durable Memory must persist new memories in Supabase');
assert.match(js,/from\('brain_memories'\)\.update/,'Durable Memory must edit/archive/restore through Supabase');
assert.doesNotMatch(js,/from\('brain_memories'\)\.delete/,'Phase 1 UI/API must archive instead of destructively deleting memory');
assert.doesNotMatch(js,/localStorage\.setItem|sessionStorage\.setItem/,'Durable Memory must not use browser-only storage as its source of truth');
assert.match(js,/\.eq\('owner_id',user\.id\)/,'memory queries must explicitly filter to the signed-in owner');
assert.match(js,/is_command_center_authorized/,'memory access must require Command Center authorization');
assert.match(js,/status:'archived'/,'archive must be a durable status change');
assert.match(js,/status:'active',archived_at:null/,'restore must reactivate an archived memory');
assert.match(js,/async function search\(/,'Durable Memory must expose search for later Brain phases');
for(const method of ['list','remember','update','archive','restore','search']) assert.match(js,new RegExp(`COMMAND_CENTER_BRAIN_MEMORY[\\s\\S]*${method}`),`public Brain memory API missing ${method}`);
for(const type of ['decision','fact','preference','constraint','checkpoint','reference','note']) assert.ok(js.includes(`'${type}'`),`missing durable memory type ${type}`);
assert.match(js,/Memory Vault/,'Phase 1 must expose a usable memory UI');
assert.match(js,/Search durable memory/,'Phase 1 must expose memory search');
assert.match(js,/Add memory/,'Phase 1 must expose memory creation');
assert.doesNotMatch(js,/m\.metadata\}/,'raw metadata JSON must not be rendered in the normal UI');

assert.match(home,/Durable Memory ✓ → Brainstorm Workspace → Context Builder → Task Queue \/ Planner → ChatGPT Handoff Loop/);
assert.match(home,/phaseOne\?'20% · Phase 1 complete':'0% · Planned'/,'Project Brain must be exactly 20% after Phase 1 while other lanes remain planned');
assert.match(home,/id="ccBrainMemoryMount"/,'Brain roadmap must provide the Durable Memory mount point');
assert.match(home,/command-center:brain-open/,'Brain opening must notify the memory module');

assert.match(cfg,/command-center-brain-home\.js\?v=3/);
assert.match(cfg,/command-center-brain-memory\.css\?v=1/);
assert.match(cfg,/command-center-brain-memory\.js\?v=1/);
assert.ok(cfg.indexOf('command-center-brain-memory.css?v=1')>cfg.indexOf('command-center-brain-home.css?v=3'),'Durable Memory styles must load after Brain shell styles');
assert.ok(cfg.indexOf('command-center-brain-memory.js?v=1')>cfg.indexOf('command-center-brain-home.js?v=3'),'Durable Memory controller must load after Brain shell controller');
assert.match(html,/app-config\.js\?v=13/);
assert.match(sw,/james-command-center-v55/);
for(const asset of ['./command-center-brain-home.js?v=3','./command-center-brain-memory.css?v=1','./command-center-brain-memory.js?v=1','./app-config.js?v=13']) assert.ok(sw.includes(`'${asset}'`),`${asset} must ship in the PWA cache`);
assert.match(sw,/pathname\.endsWith\('\/command-center-brain-memory\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/command-center-brain-memory\.css'\)/);

console.log('Project Brain Phase 1 Durable Memory QA passed.');
