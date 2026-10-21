import fs from 'node:fs';
import assert from 'node:assert/strict';

const runtime=fs.readFileSync('roadmap-checkpoint-runtime.js','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const migration=fs.readFileSync('supabase/migrations/20261021_roadmap_lineage_opportunity_engine.sql','utf8');
const execution=fs.readFileSync('ROADMAP_EXECUTION_STANDARD.md','utf8');
const books=fs.readFileSync('BOOK_QA_GATES_STANDARD.md','utf8');
const lineage=fs.readFileSync('PROJECT_LINEAGE_OPPORTUNITY_STANDARD.md','utf8');
const globalRule=fs.readFileSync('GLOBAL_CHECKPOINT_RULE.txt','utf8');

assert.doesNotThrow(()=>new Function(runtime),'checkpoint runtime must parse');
assert.match(runtime,/roadmap\.current_progress_percent/);
assert.match(runtime,/Math\.round\(\(Number\(v\)\|\|0\)\*10\)\/10/,'runtime must retain one-decimal precision');
assert.match(runtime,/Verified checkpoint roadmap/);
assert.match(cfg,/roadmap-checkpoint-runtime\.js\?v=1/);
assert.match(index,/app-config\.js\?v=21/);
assert.match(index,/minimum-scale=1,maximum-scale=1,user-scalable=no/,'protected fixed viewport must remain intact');
assert.match(index,/cc-startup-repair-attempted-v63/,'protected startup repair marker must remain unchanged');
assert.match(sw,/james-command-center-v65/);
assert.match(sw,/roadmap-checkpoint-runtime\.js\?v=1/);
assert.match(sw,/url\.pathname\.endsWith\('\/roadmap-checkpoint-runtime\.js'\)/);

assert.match(migration,/create table if not exists public\.project_lineage_events/i);
assert.match(migration,/create table if not exists public\.project_opportunities/i);
assert.match(migration,/command_center_roadmap_progress_from_checkpoint/);
assert.match(migration,/round\(\(completed_weight \* 100\.0\) \/ total_weight, 1\)/,'scope progress must preserve one decimal');
assert.match(migration,/roadmap\.current_progress_percent/);
assert.match(migration,/Roadmap unit not present in newest verified manifest/,'removed roadmap units must become stale');
assert.match(migration,/dependencies_satisfied/,'dependency gate must participate in verified progress');
assert.match(migration,/quality_gate_passed/,'quality gate must participate in verified progress');

for(const term of ['Idempotent continuation','Checkpoint ancestry','Resume contract','Scarce-resource protection','Reopen semantics','State and evidence are separate concepts'])assert.ok(execution.includes(term),`missing execution rule: ${term}`);
for(const term of ['Reader-promise alignment','Coloring-book colorability gate','Default working batch: 5','Hard maximum: 10','Cookbook recipe accuracy gate','Cookbook method/theme gate','Cookbook finished-dish image gate','Cookbook typography/layout gate'])assert.ok(books.includes(term),`missing book QA rule: ${term}`);
for(const term of ['Historical lineage','Source precedence','Mixed-chat extraction','Drift review','Scope branches','Canonical reconciliation baseline','Opportunity / Improvement queue','recommendations do not silently modify the canonical roadmap'])assert.ok(lineage.includes(term),`missing lineage rule: ${term}`);
assert.match(globalRule,/ROADMAP_EXECUTION_STANDARD\.md/);
assert.match(globalRule,/BOOK_QA_GATES_STANDARD\.md/);
assert.match(globalRule,/PROJECT_LINEAGE_OPPORTUNITY_STANDARD\.md/);

console.log('Roadmap checkpoint engine QA passed.');
