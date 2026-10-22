import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('command-center-approved-ui.js','utf8');
const css=fs.readFileSync('command-center-approved-ui.css','utf8');
const precision=fs.readFileSync('command-center-precise-progress.js','utf8');
const nav=fs.readFileSync('command-center-approved-nav.js','utf8');
const boundary=fs.readFileSync('command-center-work-boundary-mode.js','utf8');
const workUi=fs.readFileSync('command-center-work-approval-ui-v3.js','utf8');
const booksUi=fs.readFileSync('command-center-book-review-ui-v5.js','utf8');
const authorityCss=fs.readFileSync('command-center-authoritative-runtime.css','utf8');
const authorityJs=fs.readFileSync('command-center-authoritative-runtime.js','utf8');
const agentTruth=fs.readFileSync('command-center-agent-truth.js','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');

assert.match(js,/cc-approved-home-grid/,'Approved home surface must exist');
assert.match(js,/PROJECTS/,'Projects hero control must exist');
assert.match(js,/NEXT UP/,'Next Up hero control must exist');
assert.match(js,/REVENUE/,'Revenue must remain visible from home');
assert.match(js,/KDP PERFORMANCE/,'Book projects must use compact KDP performance cards');
assert.match(js,/BOOKS IN SERIES/,'Book mappings must render as their own series section');
assert.match(js,/PUBLICATION STATUS/,'Publication status must render as its own compact section');
assert.match(js,/KDP SNAPSHOT HISTORY/,'KDP snapshot history must remain available');
assert.match(css,/book-cover-atlas-v2\.webp/,'Approved book-cover atlas must power book tiles');
assert.match(js,/analytics_project_kpis/,'Approved UI must use verified KPI data');
assert.match(js,/project_opportunities/,'Approved UI must surface project opportunities');

assert.match(js,/data-cc-agent-mode="auto"/,'Auto Agent mode must exist');
assert.match(js,/data-cc-agent-mode="next"/,'Next Step Agent mode must exist');
assert.match(js,/data-cc-agent-mode="until-work"/,'Next Work Boundary Agent mode must exist');
assert.match(js,/data-cc-manual-toggle/,'Manual Agent mode must exist');
assert.match(js,/command_center_agent_create_project_only_session/,'Agent modes must create real project-locked sessions');
assert.match(js,/p_books_target:isBookProject\(project\)\?project\.name:null/,'Books Agent runs must remain explicitly targeted');
assert.match(js,/command_center_agent_pause/,'Agent Pause must control the real runtime');
assert.match(js,/command_center_agent_resume/,'Agent Resume must control the real runtime');
assert.match(js,/command_center_agent_cancel/,'Agent Stop must control the real runtime');

assert.match(boundary,/Next Work Boundary/,'User-facing Work boundary mode must be explicit');
assert.match(boundary,/durable verified checkpoint/,'Next Work Boundary must require a durable checkpoint');
assert.match(boundary,/exact current verified state/,'Boundary checkpoint must record exact current state');
assert.match(boundary,/exact next Work task/,'Boundary checkpoint must record the exact next Work task');
assert.match(boundary,/p_allow_work:false/,'Next Work Boundary must stop before Work execution');
assert.match(workUi,/Approve Work/,'Work boundary must expose an Approve Work control');
assert.match(workUi,/GPT-6 Luna High/,'Work ladder must start on Luna High');
assert.match(workUi,/GPT-6\.1 Sol Light/,'Work ladder must include Sol Light');
assert.match(workUi,/Approve Sol Medium for this step/,'Sol Medium must require exact-step approval');
assert.match(workUi,/command_center_agent_approve_work_ladder/,'Approve Work must use the durable ladder authorization');
assert.match(workUi,/command_center_agent_escalate_work_ladder/,'Eligible failure must use the guarded model escalation path');
assert.match(workUi,/command_center_agent_approve_sol_medium_step/,'Sol Medium must use exact-step approval');

assert.match(booksUi,/Approve Final/,'Books must retain owner final approval');
assert.match(booksUi,/Mark Published/,'Books must retain publication confirmation');
assert.match(booksUi,/PC REQUIRED/,'Books final PDF review must remain PC-required');

assert.match(js,/cc-approved-ring/,'Project cards and detail pages must use progress rings');
assert.match(precision,/completed_weight/,'Precise progress must derive from completed weighted scope');
assert.match(precision,/total_weight/,'Precise progress must derive from total weighted scope');
assert.match(precision,/toFixed\(1\)/,'Progress rings must show decimal precision');

assert.match(js,/ccApprovedAbout/,'Bottom About control must exist');
assert.match(js,/Advanced \/ system details/,'Advanced/system plumbing must be behind About');
assert.match(authorityCss,/#dashboard > :not\(#ccApprovedApp\)\{display:none!important\}/,'Normal mode must hide every legacy dashboard child');
assert.match(authorityCss,/#ccApprovedAbout\{[\s\S]*position:static!important/,'About must be a normal footer control');
assert.doesNotMatch(authorityCss,/#ccApprovedAbout\{[\s\S]*?position:fixed/,'About must never float over app content');
assert.match(authorityJs,/root\.appendChild\(about\)/,'About must be moved to the bottom of the approved app');
assert.match(agentTruth,/s\.status==='running'&&s\.started_at/,'Working must require a real started running step');
assert.match(agentTruth,/state='Queued'/,'Draft/non-running sessions must be labeled Queued');
assert.match(agentTruth,/verified\.length\/steps\.length/,'Agent percentage must derive from verified completed steps over planned steps');
assert.match(agentTruth,/toFixed\(1\)/,'Agent progress must display to one decimal place');

for(const code of [authorityJs,agentTruth,precision,booksUi,workUi])
  assert.doesNotMatch(code,/new MutationObserver\s*\(/,'Normal-use runtime must not use self-triggering global DOM observers');

assert.match(css,/--cc-orange:#ff6817/,'Approved orange identity must be explicit');
assert.match(css,/\.cc-approved-emblem/,'Artwork/emblem system must exist');
assert.match(css,/cc6-mountain\.webp/,'Project artwork must use approved Command Center art');
assert.match(css,/cc6-road\.webp/,'Next-step artwork must use approved Command Center art');
assert.match(css,/cc6-chart\.webp/,'Performance artwork must use approved Command Center art');
assert.doesNotMatch(js,/Open project <span>›<\/span>/,'Approved project cards must not show legacy chevron arrows');
assert.doesNotMatch(css,/touch-action\s*:\s*none/i,'Approved UI must preserve scrolling');
assert.doesNotMatch(css,/overflow-y\s*:\s*hidden/i,'Approved UI must preserve vertical scrolling');

assert.match(nav,/history\.back\(\)/,'On-screen Back must consume browser/app history like Android Back');
assert.match(nav,/stopImmediatePropagation/,'Approved Back must prevent legacy navigation handlers from firing too');

const core=cfg.slice(cfg.indexOf('window.COMMAND_CENTER_LOAD_ENHANCEMENTS'),cfg.indexOf('let advancedPromise'));
for(const asset of [
  'command-center-approved-ui.js?v=2',
  'command-center-precise-progress.js?v=3',
  'command-center-approved-nav.js?v=2',
  'command-center-authoritative-runtime.js?v=2',
  'command-center-agent-truth.js?v=2',
  'command-center-book-review-ui-v5.js?v=1',
  'command-center-work-approval-ui-v3.js?v=1'
]) assert.ok(core.includes(asset),`Normal startup must load ${asset}`);
for(const forbidden of ['command-center-v4.js','command-center-v6.js','source-health.js','command-center-brain-home.js','command-center-agent-home.js'])
  assert.ok(!core.includes(forbidden),`Normal startup must not load ${forbidden}`);

console.log('approved mobile app UX QA passed');
