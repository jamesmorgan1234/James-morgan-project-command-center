import fs from 'node:fs';
import assert from 'node:assert/strict';

const cfg=fs.readFileSync('app-config.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const startup=fs.readFileSync('startup-loader.js','utf8');
const authority=fs.readFileSync('command-center-authoritative-runtime.js','utf8');
const authorityCss=fs.readFileSync('command-center-authoritative-runtime.css','utf8');
const agent=fs.readFileSync('command-center-agent-truth.js','utf8');
const precise=fs.readFileSync('command-center-precise-progress.js','utf8');
const boundary=fs.readFileSync('command-center-work-boundary-mode.js','utf8');
const books=fs.readFileSync('command-center-book-review-ui-v5.js','utf8');
const work=fs.readFileSync('command-center-work-approval-ui-v3.js','utf8');
const lazy=fs.readFileSync('command-center-advanced-lazy-loader.js','utf8');

const coreStart=cfg.indexOf('window.COMMAND_CENTER_LOAD_ENHANCEMENTS');
const advancedStart=cfg.indexOf('let advancedPromise');
assert.ok(coreStart>=0&&advancedStart>coreStart,'Core and advanced loaders must be separate');
const core=cfg.slice(coreStart,advancedStart);
const advanced=cfg.slice(advancedStart);

for(const required of [
  'command-center-approved-ui.js?v=3',
  'command-center-precise-progress.js?v=3',
  'command-center-approved-nav.js?v=2',
  'command-center-work-boundary-mode.js?v=1',
  'command-center-authoritative-runtime.js?v=2',
  'command-center-agent-truth.js?v=2',
  'command-center-book-review-ui-v5.js?v=1',
  'command-center-work-approval-ui-v3.js?v=1',
  'command-center-advanced-lazy-loader.js?v=1'
]) assert.ok(core.includes(required),`Normal startup must include ${required}`);

for(const forbidden of [
  'project-hub.js','project-hub.css','mobile-accordion-polish.js','mobile-accordion-polish.css',
  'books-hub.js','books-revenue.js','performance-hub.js','refresh-orchestrator.js','source-health.js',
  'command-center-v4.js','command-center-v4.css','command-center-v6.js','command-center-v6.css','command-center-v6-2.js','command-center-v6-2.css',
  'command-center-brain-home.js','command-center-brain-home.css','command-center-agent-home.js','command-center-agent-mode.js',
  'command-center-analytics.js','command-center-security.js','command-center-deployment.js','command-center-exact-menus.js'
]) assert.ok(!core.includes(forbidden),`Normal startup must not execute or style legacy/admin asset ${forbidden}`);

assert.doesNotMatch(index,/project-hub\.css|mobile-accordion-polish\.css/,'index.html must not preload legacy project/mobile styles');
const coreScripts=startup.match(/const CORE_SCRIPTS = \[([^\]]*)\]/s)?.[1]||'';
assert.match(coreScripts,/app\.js\?v=10/,'Base auth/data app must remain a startup dependency');
assert.doesNotMatch(coreScripts,/project-hub|mobile-accordion/,'Startup loader must not execute legacy project/mobile controllers');

for(const advancedAsset of ['project-hub.js','mobile-accordion-polish.js','command-center-v4.js','command-center-v6.js','source-health.js','command-center-brain-home.js'])
  assert.ok(advanced.includes(advancedAsset),`Advanced loader must retain ${advancedAsset}`);

assert.match(lazy,/COMMAND_CENTER_LOAD_ADVANCED/,'About Brain/Advanced must lazy-load the advanced stack');
assert.match(lazy,/data-cc-about-action=\"brain\"/,'Brain action must be intercepted before legacy load');
assert.match(lazy,/data-cc-about-action=\"advanced\"/,'Advanced action must be intercepted before legacy load');

for(const [name,code] of [['authority',authority],['agent',agent],['precise',precise],['boundary',boundary],['books',books],['work',work]])
  assert.doesNotMatch(code,/new MutationObserver\s*\(/,`${name} normal-use runtime must not use global DOM mutation observers`);

assert.match(authorityCss,/#dashboard > :not\(#ccApprovedApp\)\{display:none!important\}/,'Only approved app may be visible in normal dashboard mode');
assert.match(authorityCss,/#refreshStrip/,'Legacy refresh strip must be hidden in normal mode');
assert.match(authorityCss,/#appFooter/,'Legacy sign-out footer must be hidden in normal mode');
assert.match(authorityCss,/#syncText/,'Legacy sync plumbing must be hidden in normal mode');
assert.match(authorityCss,/#ccApprovedAbout\{[\s\S]*position:static!important/,'About must remain in document flow at the bottom');
assert.doesNotMatch(authorityCss,/#ccApprovedAbout\{[\s\S]*?position:fixed/,'About must never float');

assert.match(agent,/s\.status==='running'&&s\.started_at/,'Working requires an actually started running step');
assert.match(agent,/state='Queued'/,'Draft/non-running Agent state must be Queued');
assert.match(agent,/verified\.length\/steps\.length/,'Agent progress must use verified steps over planned steps');
assert.match(agent,/toFixed\(1\)/,'Agent progress must be decimal-precise');
assert.match(precise,/completed_weight/,'Project progress must use completed weighted scope');
assert.match(precise,/total_weight/,'Project progress must use total weighted scope');
assert.match(precise,/toFixed\(1\)/,'Project progress must render one decimal place');

assert.match(books,/Approve Final/,'Books owner approval remains available');
assert.match(books,/Mark Published/,'Books publication confirmation remains available');
assert.match(books,/PC REQUIRED/,'Books owner review remains a PC-required boundary');
assert.doesNotMatch(books,/Agent is already working on this project/,'Queued/draft sessions must not be falsely called working');
assert.match(work,/GPT-6 Luna High/,'Work ladder still starts with Luna High');
assert.match(work,/GPT-6\.1 Sol Light/,'Work ladder still includes Sol Light');
assert.match(work,/GPT-6\.1 Sol Medium/,'Work ladder still caps at Sol Medium');
assert.match(work,/command_center_agent_approve_sol_medium_step/,'Sol Medium exact-step approval remains enforced');

console.log('normal runtime stability QA passed');
