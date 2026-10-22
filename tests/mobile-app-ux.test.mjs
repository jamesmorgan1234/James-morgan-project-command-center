import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('command-center-approved-ui.js','utf8');
const css=fs.readFileSync('command-center-approved-ui.css','utf8');
const precision=fs.readFileSync('command-center-precise-progress.js','utf8');
const nav=fs.readFileSync('command-center-approved-nav.js','utf8');
const loader=fs.readFileSync('command-center-agent-mode-completion.js','utf8');
const boundary=fs.readFileSync('command-center-work-boundary-mode.js','utf8');
const workUi=fs.readFileSync('command-center-work-approval-ui.js','utf8');
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
assert.match(js,/data-cc-agent-mode="until-work"/,'Work-boundary Agent mode must exist');
assert.match(js,/data-cc-manual-toggle/,'Manual Agent mode must exist');
assert.match(js,/command_center_agent_create_project_only_session/,'Agent modes must create real project-locked sessions');
assert.match(js,/p_books_target:isBookProject\(project\)\?project\.name:null/,'Books Agent runs must remain explicitly targeted');
assert.match(js,/p_allow_work:allowWork/,'Agent modes must preserve Work gating');
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
assert.match(workUi,/command_center_agent_approve_sol_medium_step/,'Sol Medium must use the existing protected approval RPC');

assert.match(js,/cc-approved-ring/,'Project cards and detail pages must use progress rings');
assert.match(precision,/completed_weight/,'Precise progress must derive from completed weighted scope');
assert.match(precision,/total_weight/,'Precise progress must derive from total weighted scope');
assert.match(precision,/toFixed\(1\)/,'Progress rings must show decimal precision');
assert.doesNotMatch(precision,/Math\.round\(Number\(row\.value_numeric\)/,'Progress must not round verified KPI values to whole numbers');

assert.match(js,/ccApprovedAbout/,'Bottom About control must exist');
assert.match(js,/Advanced \/ system details/,'Advanced/system plumbing must be behind About');
assert.match(css,/body:has\(#ccApprovedApp\):not\(\.cc-approved-legacy-open\)/,'Legacy dashboard must be hidden while approved app surface is active');
assert.match(css,/body\.cc-approved-legacy-open #ccApprovedApp/,'Advanced mode must explicitly reveal the legacy/admin surface');

assert.match(css,/--cc-orange:#ff6817/,'Approved orange identity must be explicit');
assert.match(css,/\.cc-approved-emblem/,'Artwork/emblem system must exist');
assert.match(css,/cc6-mountain\.webp/,'Project artwork must use approved Command Center art');
assert.match(css,/cc6-road\.webp/,'Next-step artwork must use approved Command Center art');
assert.match(css,/cc6-chart\.webp/,'Performance artwork must use approved Command Center art');
assert.doesNotMatch(js,/Open project <span>›<\/span>/,'Approved project cards must not show legacy chevron arrows');
assert.doesNotMatch(css,/background[^;]*#0[0-9a-f]{2}ff/i,'Approved controls must not use fallback bright-blue backgrounds');
assert.doesNotMatch(css,/touch-action\s*:\s*none/i,'Approved UI must preserve scrolling');
assert.doesNotMatch(css,/overflow-y\s*:\s*hidden/i,'Approved UI must preserve vertical scrolling');

assert.match(nav,/history\.back\(\)/,'On-screen Back must consume browser/app history like Android Back');
assert.match(nav,/stopImmediatePropagation/,'Approved Back must prevent legacy navigation handlers from firing too');

// Critical production invariant: the approved app must be a direct enhancement,
// not something that only appears if a later Agent completion script injects it.
for (const asset of [
  "command-center-mobile-first.css?v=1",
  "command-center-artwork-polish.css?v=1",
  "command-center-approved-ui.css?v=2",
  "command-center-approved-ui.js?v=2",
  "command-center-precise-progress.js?v=2",
  "command-center-approved-nav.js?v=2",
  "command-center-work-boundary-mode.js?v=1"
]) assert.ok(cfg.includes(asset),`app-config must directly load ${asset}`);
assert.ok(cfg.indexOf("command-center-approved-ui.js?v=2") < cfg.indexOf("command-center-v4.js?v=1"),'Approved UI must load before legacy V4 renderer');
assert.ok(cfg.indexOf("command-center-approved-ui.js?v=2") < cfg.indexOf("command-center-v6.js?v=1"),'Approved UI must load before legacy V6 renderer');

assert.match(loader,/command-center-approved-ui\.css\?v=2/,'Completion layer may retain duplicate-safe approved UI fallback');
assert.match(loader,/command-center-approved-ui\.js\?v=2/,'Completion layer may retain duplicate-safe approved UI fallback');
assert.match(loader,/command-center-precise-progress\.js\?v=2/,'Completion fallback must retain precise progress layer');
assert.match(loader,/command-center-approved-nav\.js\?v=2/,'Completion fallback must retain approved navigation guard');
assert.match(loader,/command-center-work-boundary-mode\.js\?v=1/,'Completion fallback must retain Next Work Boundary mode');
assert.doesNotMatch(loader,/command-center-app-ux\.js\?v=1/,'Old focused UX controller must no longer load');
assert.match(loader,/COMMAND_CENTER_AGENT_HOME\?\.destroy/,'Old Agent home observer must be retired');
assert.match(loader,/COMMAND_CENTER_AGENT_MODE\?\.destroy/,'Old Agent detail observer must be retired');

console.log('approved mobile app UX QA passed');
