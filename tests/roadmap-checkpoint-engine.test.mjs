import fs from 'node:fs';
import assert from 'node:assert/strict';

const runtime=fs.readFileSync('roadmap-checkpoint-runtime.js','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const migration=fs.readFileSync('supabase/migrations/20261021_roadmap_lineage_opportunity_engine.sql','utf8');
const precision=fs.readFileSync('supabase/migrations/20261021_roadmap_progress_no_overstatement.sql','utf8');
const execution=fs.readFileSync('ROADMAP_EXECUTION_STANDARD.md','utf8');
const books=fs.readFileSync('BOOK_QA_GATES_STANDARD.md','utf8');
const lineage=fs.readFileSync('PROJECT_LINEAGE_OPPORTUNITY_STANDARD.md','utf8');
const globalRule=fs.readFileSync('GLOBAL_CHECKPOINT_RULE.txt','utf8');

assert.doesNotThrow(()=>new Function(runtime),'checkpoint runtime must parse');
assert.match(runtime,/roadmap\.current_progress_percent/);assert.match(runtime,/Math\.floor\(\(Number\(v\)\|\|0\)\*10\+Number\.EPSILON\)\/10/);assert.match(runtime,/Verified checkpoint roadmap/);
assert.match(cfg,/roadmap-checkpoint-runtime\.js\?v=1/);assert.match(cfg,/command-center-integrations-completion\.js\?v=1/);assert.match(cfg,/command-center-analytics-completion\.js\?v=1/);assert.match(cfg,/command-center-security-completion\.js\?v=1/);
assert.match(index,/app-config\.js\?v=24/);assert.match(index,/minimum-scale=1,maximum-scale=1,user-scalable=no/);assert.match(index,/cc-startup-repair-attempted-v63/);
assert.match(sw,/james-command-center-v68/);assert.match(sw,/roadmap-checkpoint-runtime\.js\?v=1/);assert.match(sw,/command-center-integrations-completion\.js\?v=1/);assert.match(sw,/command-center-analytics-completion\.js\?v=1/);assert.match(sw,/command-center-security-completion\.js\?v=1/);assert.match(sw,/url\.pathname\.endsWith\('\/roadmap-checkpoint-runtime\.js'\)/);
assert.match(migration,/create table if not exists public\.project_lineage_events/i);assert.match(migration,/create table if not exists public\.project_opportunities/i);assert.match(migration,/command_center_roadmap_progress_from_checkpoint/);assert.match(migration,/roadmap\.current_progress_percent/);assert.match(migration,/Roadmap unit not present in newest verified manifest/);assert.match(migration,/dependencies_satisfied/);assert.match(migration,/quality_gate_passed/);
assert.match(precision,/trunc\(\(completed_weight \* 100\.0\) \/ total_weight, 1\)/);assert.match(precision,/trunc\(\(phase_completed_weight\*100\.0\)\/phase_total_weight,1\)/);assert.match(precision,/64\.96% therefore displays\/stores as 64\.9%/);
for(const term of ['Idempotent continuation','Checkpoint ancestry','Resume contract','Scarce-resource protection','Reopen semantics','State and evidence are separate concepts'])assert.ok(execution.includes(term),`missing execution rule: ${term}`);
for(const term of ['Reader-promise alignment','Coloring-book colorability gate','Default working batch: 5','Hard maximum: 10','Cookbook recipe accuracy gate','Cookbook method/theme gate','Cookbook finished-dish image gate','Cookbook typography/layout gate'])assert.ok(books.includes(term),`missing book QA rule: ${term}`);
for(const term of ['Historical lineage','Source precedence','Mixed-chat extraction','Drift review','Scope branches','Canonical reconciliation baseline','Opportunity / Improvement queue','recommendations do not silently modify the canonical roadmap'])assert.ok(lineage.includes(term),`missing lineage rule: ${term}`);
assert.match(globalRule,/ROADMAP_EXECUTION_STANDARD\.md/);assert.match(globalRule,/BOOK_QA_GATES_STANDARD\.md/);assert.match(globalRule,/PROJECT_LINEAGE_OPPORTUNITY_STANDARD\.md/);
console.log('Roadmap checkpoint engine QA passed under Security release.');