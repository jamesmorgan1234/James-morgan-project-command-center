import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const migration=fs.readFileSync('supabase/migrations/20261021_automation_phase2_condition_evaluator.sql','utf8');
const js=fs.readFileSync('command-center-automation-condition.js','utf8');
const css=fs.readFileSync('command-center-automation-condition.css','utf8');
const home=fs.readFileSync('command-center-brain-home.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

for(const table of ['automation_conditions','automation_condition_evaluations'])assert.match(migration,new RegExp(`create table if not exists public\\.${table}`));
for(const phrase of ['command_center_prepare_automation_condition','command_center_condition_compare','command_center_evaluate_condition_internal','command_center_evaluate_condition','command_center_evaluate_dispatch_condition','automation_dispatch_evaluate_condition',"condition_state in ('not_required','pending','passed','blocked','unavailable','error')",'is_command_center_authorized'])assert.ok(migration.includes(phrase),`missing Condition Evaluator schema control: ${phrase}`);
for(const p of ['automation_conditions_select_own','automation_conditions_insert_own','automation_conditions_update_own','automation_conditions_delete_own','automation_condition_evaluations_select_own'])assert.ok(migration.includes(p),`missing Condition Evaluator RLS policy ${p}`);
assert.doesNotMatch(migration,/create policy automation_condition_evaluations_(insert|update|delete)/,'client must not forge evaluation records');
assert.match(migration,/revoke all on public\.automation_condition_evaluations from anon, authenticated/);
assert.match(migration,/grant select on public\.automation_condition_evaluations to authenticated/);
assert.match(migration,/m\.verified is true/,'metric conditions must use verified metrics only');
assert.match(migration,/v_source not in \('metric','project'\)/);
assert.match(migration,/v_field not in \('status','verification','stage','next_action','blocker','attention','source_status'\)/);
assert.match(migration,/match_mode in \('all','any'\)/);
assert.match(migration,/jsonb_array_length\(clauses\) between 1 and 10/);
assert.match(migration,/Schedule and condition must use the same project/);
assert.match(migration,/case when r\.condition_id is null then 'not_required' else 'pending' end/,'scheduler must mark conditional dispatches pending');
assert.match(migration,/perform public\.command_center_evaluate_condition_internal\(new\.condition_id,new\.id\)/,'dispatch insert must evaluate an attached condition');
assert.match(migration,/when 'true' then 'passed'/);assert.match(migration,/when 'false' then 'blocked'/);
assert.doesNotMatch(migration,/http|net\.http|pg_net/i,'Condition Evaluator must not call external services');
assert.match(migration,/revoke all on function public\.command_center_evaluate_condition_internal/,'internal evaluator must not be callable by normal clients');
assert.match(migration,/grant execute on function public\.command_center_evaluate_condition\(uuid\) to authenticated/,'owner must be able to manually evaluate a saved condition');

assert.doesNotThrow(()=>new Function(js),'Condition Evaluator controller must parse');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Condition Evaluator CSS braces must balance');
assert.match(js,/window\.COMMAND_CENTER_SUPABASE/,'Condition Evaluator must reuse the canonical authenticated client');
for(const source of ["from('automation_conditions')","from('automation_condition_evaluations')","from('metrics')","from('projects')","from('automation_schedules')"])assert.ok(js.includes(source),`missing data source ${source}`);
assert.match(js,/\.eq\('verified',true\)/,'Condition Evaluator UI must only offer verified metrics');
assert.match(js,/rpc\('command_center_evaluate_condition'/,'manual evaluation must use the protected database evaluator');
assert.match(js,/history\.pushState\(\{\.\.\.history\.state,ccAutomationCondition:id\}/,'condition detail must own a Back-history level');
assert.match(js,/history\.back\(\)/,'same open condition bubble must close through history');
assert.match(js,/does not send notifications, generate reports, or execute actions/,'Phase 2 must not pretend later automation phases exist');
assert.doesNotMatch(js,/localStorage\.setItem|sessionStorage\.setItem/,'condition persistence must not use browser storage as source of truth');
assert.doesNotMatch(js,/JSON\.stringify\(/,'normal Condition Evaluator UI must not expose raw JSON');

const sandbox={window:{addEventListener(){},COMMAND_CENTER_SUPABASE:null},document:{getElementById(){return null;}},history:{state:null,pushState(){},back(){}},location:{href:'https://example.test/'},Date,confirm(){return false;},FormData:class{},console};
vm.runInNewContext(js,sandbox);
const api=sandbox.window.COMMAND_CENTER_AUTOMATION_CONDITION;assert.ok(api,'Condition Evaluator API must mount without the UI');
const metric=api.normalizeClause({source:'metric',key:'revenue.monthly',operator:'gte',expected:'100'});assert.equal(metric.source,'metric');assert.equal(metric.key,'revenue.monthly');assert.equal(metric.expected,100);
const project=api.normalizeClause({source:'project',field:'status',operator:'eq',expected:'Live'});assert.equal(project.field,'status');assert.equal(project.expected,'Live');
const empty=api.normalizeClause({source:'project',field:'blocker',operator:'is_empty',expected:''});assert.equal('expected' in empty,false);
assert.throws(()=>api.normalizeClause({source:'metric',key:'',operator:'eq',expected:'x'}),/verified metric/);
assert.throws(()=>api.normalizeClause({source:'project',field:'made_up',operator:'eq',expected:'x'}),/valid project field/);
const condition=api.normalizeCondition({name:' Ready to publish ',project_id:'project-1',match_mode:'all',clauses:[{source:'project',field:'status',operator:'eq',expected:'Live'},{source:'metric',key:'sales',operator:'gt',expected:'0'}]});assert.equal(condition.name,'Ready to publish');assert.equal(condition.project_id,'project-1');assert.equal(condition.clauses.length,2);
assert.throws(()=>api.normalizeCondition({name:'No project',project_id:'',match_mode:'all',clauses:[{source:'project',field:'status',operator:'eq',expected:'Live'}]}),/Choose a project/);

assert.match(home,/\['Scheduler Engine'[^\]]+,100\]/,'Automation Phase 1 must remain 100%');
assert.match(home,/\['Condition Evaluator'[^\]]+,100\]/,'Automation Phase 2 must be 100%');
for(const future of ['Notification Delivery','Recurring Report Jobs','Action Queue Runner','Cross-Project Workflow Chains','Run History','Failure Recovery'])assert.match(home,new RegExp(`\\['${future.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}'[^\\]]+,0\\]`),`${future} must remain planned`);
assert.match(home,/ccAutomationSchedulerMount/);assert.match(home,/ccAutomationConditionMount/);
assert.match(home,/command-center-automation-condition\.css\?v=1/);assert.match(home,/command-center-automation-condition\.js\?v=1/);
assert.ok(sw.includes("'./command-center-automation-condition.css?v=1'"));assert.ok(sw.includes("'./command-center-automation-condition.js?v=1'"));
assert.match(sw,/pathname\.endsWith\('\/command-center-automation-condition\.js'\)/);assert.match(sw,/pathname\.endsWith\('\/command-center-automation-condition\.css'\)/);
assert.match(css,/background:linear-gradient\(180deg,#080503,#030303\)!important/,'Condition Evaluator surfaces must stay black');
assert.match(css,/#ff6208/,'Condition Evaluator must retain orange Command Center accents');
assert.doesNotMatch(css,/#071a36|#0a2347|#0a2146|#081a38|#0a2147/,'Condition Evaluator must not reintroduce legacy blue structural surfaces');

console.log('Automation Phase 2 Condition Evaluator schema, trust boundary, scheduler integration, UI, Back behavior, and PWA QA passed.');
