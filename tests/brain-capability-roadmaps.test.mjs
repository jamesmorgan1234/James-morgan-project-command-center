import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('command-center-brain-home.js','utf8');
const css=fs.readFileSync('command-center-brain-roadmaps.css','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'roadmap stylesheet braces must balance');

const expected={
  'Project Brain':5,
  'Automation':8,
  'Integrations':8,
  'Analytics':7,
  'Security':8,
  'Deployment':7,
  'Agent Mode':8
};
for(const [name,count] of Object.entries(expected)){
  assert.ok(js.includes(`'${name}'`),`missing capability ${name}`);
  const start=js.indexOf(`'${name}'`);
  const next=Object.keys(expected).map(n=>js.indexOf(`'${n}'`,start+1)).filter(i=>i>start).sort((a,b)=>a-b)[0]??js.indexOf('const $=',start);
  const block=js.slice(start,next);
  assert.equal((block.match(/\['[^']+','[^']+'\]/g)||[]).length,count,`${name} must have exactly ${count} phases`);
}

for(const phase of [
  'Durable Memory','Brainstorm Workspace','Context Builder','Task Queue / Planner','ChatGPT Handoff Loop',
  'Scheduler Engine','Condition Evaluator','Notification Delivery','Recurring Report Jobs','Action Queue Runner','Cross-Project Workflow Chains','Run History','Failure Recovery',
  'Connection Registry','Permission & Scope Mapping','Read Sync','Data Normalization','Connection Health','Write Actions','Webhook / Realtime Intake','Reconnect & Recovery',
  'Metric Catalog','Project KPI Views','Portfolio Rollups','Time-Series History','Trend Comparison','Goal Tracking','Anomaly Detection',
  'Identity & Session Controls','Row-Level Data Isolation','Permission Registry','Action Authorization Gates','Secrets Isolation','Audit Trail','Security Alerts','Access Revocation & Recovery',
  'Release Manifest','Pre-Deploy Validation','Deployment Pipeline','Post-Deploy Health Check','Version History','Rollback','PWA Update Control',
  'Agent Session Model','Goal Intake','Step Executor','Tool Permission Gate','Verification Gate','Checkpoint & Resume','Cross-Project Agent Runs'
]) assert.ok(js.includes(phase),`missing roadmap phase: ${phase}`);

assert.match(js,/0% · Planned/,'capability cards must remain 0% until phases are truly implemented');
assert.match(js,/badge planning">Planned/,'every roadmap phase must visibly start Planned');
assert.doesNotMatch(js,/20% · Phase 1 complete/,'roadmap-only release must not falsely mark Project Brain Phase 1 complete');
assert.match(js,/data-brain-capability/,'capability cards must be clickable');
assert.match(js,/data-brain-capability-detail/,'clicking a capability must open its phase detail');
assert.match(js,/ccCommandCenterBrainCapability/,'capability drill-down must own browser history state');
assert.match(js,/popstate/,'Android/browser Back must close capability detail before leaving Brain');
assert.match(js,/‹ All capabilities/,'capability detail must have a visible return control');
assert.match(cfg,/command-center-brain-roadmaps\.css\?v=1/);
assert.match(cfg,/command-center-brain-home\.js\?v=2/);
assert.ok(sw.includes("'./command-center-brain-roadmaps.css?v=1'"),'roadmap stylesheet must ship in the installed PWA');
assert.match(sw,/pathname\.endsWith\('\/command-center-brain-roadmaps\.css'\)/,'roadmap stylesheet must refresh network-first');

console.log('Command Center Brain capability roadmap QA passed.');
