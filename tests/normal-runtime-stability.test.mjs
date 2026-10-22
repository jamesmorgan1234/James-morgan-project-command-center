import fs from 'node:fs';
import assert from 'node:assert/strict';

const cfg=fs.readFileSync('app-config.js','utf8');
const index=fs.readFileSync('index.html','utf8');
const startup=fs.readFileSync('startup-loader.js','utf8');
const mobile=fs.readFileSync('mobile-accordion-polish.js','utf8');
const v6=fs.readFileSync('command-center-v6.js','utf8');
const v62=fs.readFileSync('command-center-v6-2.js','utf8');
const exact=fs.readFileSync('command-center-exact-menus.js','utf8');
const agentMode=fs.readFileSync('command-center-agent-mode.js','utf8');
const agentHome=fs.readFileSync('command-center-agent-home.js','utf8');
const sixModes=fs.readFileSync('command-center-agent-six-modes-v6.js','utf8');
const books=fs.readFileSync('command-center-book-review-ui-v5.js','utf8');
const work=fs.readFileSync('command-center-work-approval-ui-v3.js','utf8');

// The approved application is one full interface stack. Advanced is an alias, not a second hidden renderer.
assert.match(cfg,/window\.COMMAND_CENTER_LOAD_ENHANCEMENTS\s*=\s*\(\)\s*=>/,'full interface enhancement loader must exist');
assert.match(cfg,/window\.COMMAND_CENTER_LOAD_ADVANCED\s*=\s*\(\)\s*=>\s*window\.COMMAND_CENTER_LOAD_ENHANCEMENTS\(\)/,'Advanced must reuse the same full interface rather than switch renderers');

for(const required of [
  'project-hub.css?v=2','mobile-accordion-polish.css?v=4','command-center-v6.css?v=1','command-center-v6-2.css?v=1',
  'command-center-exact-menus.css?v=1','command-center-book-covers.css?v=2','command-center-brain-home.css?v=4',
  'command-center-agent-mode.css?v=1','command-center-agent-home.css?v=1','command-center-agent-six-modes-v6.css?v=1',
  'command-center-v6.js?v=1','command-center-v6-2.js?v=1','command-center-exact-menus.js?v=1',
  'command-center-book-covers.js?v=2','command-center-brain-home.js?v=5','command-center-agent-mode.js?v=1',
  'command-center-agent-home.js?v=1','command-center-agent-six-modes-v6.js?v=1',
  'command-center-book-review-ui-v5.js?v=1','command-center-work-approval-ui-v3.js?v=1'
]) assert.ok(cfg.includes(required),`Restored normal startup must include ${required}`);

// The stripped replacement renderer and its watchdog must not regain authority.
for(const forbidden of ['command-center-approved-ui.js','command-center-approved-nav.js','command-center-approved-mount-guard.js','command-center-mobile-first.css'])
  assert.ok(!cfg.includes(forbidden),`Restored normal startup must not load stripped/conflicting asset ${forbidden}`);
assert.doesNotMatch(startup,/command-center-approved-mount-guard\.js/,'startup must not reintroduce the broken stripped-renderer watchdog');

const coreScripts=startup.match(/const CORE_SCRIPTS = \[([^\]]*)\]/s)?.[1]||'';
assert.match(coreScripts,/app\.js\?v=10/,'base auth/data app must remain a startup dependency');
assert.match(coreScripts,/project-hub\.js\?v=3/,'project hub must mount before the enhancement stack');
assert.match(coreScripts,/mobile-accordion-polish\.js\?v=3/,'mobile Back/scroll controller must remain core startup behavior');

assert.match(index,/project-hub\.css\?v=2/,'project-hub CSS must preload');
assert.match(index,/mobile-accordion-polish\.css\?v=4/,'mobile navigation CSS must preload');
assert.match(index,/minimum-scale=1,maximum-scale=1,user-scalable=no/,'locked viewport must remain intact');

for(const [name,code] of [['mobile navigation',mobile],['V6',v6],['V6.2',v62],['exact menus',exact],['Agent Mode',agentMode],['Agent home',agentHome],['six-mode controls',sixModes],['Books review',books],['Work approval',work]])
  assert.doesNotThrow(()=>new Function(code),`${name} runtime must parse`);

assert.match(mobile,/history\.pushState/,'mobile navigation must create browser history entries');
assert.match(mobile,/history\.back\(\)/,'physical/browser Back path must remain available');
assert.match(mobile,/history\.scrollRestoration = 'manual'/,'scroll restoration must remain deterministic');
assert.match(mobile,/window\.scrollTo\(/,'saved scroll position must be restored');

assert.match(agentHome,/progressPercent\(/,'Agent home must compute run progress');
assert.match(agentHome,/verified\/total/,'Agent home progress must use verified steps over total planned steps');
assert.match(agentHome,/s\.status==='draft'\)\{val\.textContent='Starting'/,'draft/no-plan Agent state must display Starting rather than fake 0.0%');
assert.match(agentHome,/`Working • \$\{pct\.toFixed\(1\)\}%`/,'running Agent home button must show one-decimal verified percentage');
for(const label of ['Auto','Next Step','Until Work','Manual Task','Project Checkpoint','Stop Agent'])assert.ok(sixModes.includes(label),`Agent control missing ${label}`);

assert.match(books,/Approve Final/,'Books owner approval remains available');
assert.match(books,/Mark Published/,'Books publication confirmation remains available');
assert.match(books,/PC REQUIRED/,'Books owner review remains a PC-required boundary');
assert.match(work,/GPT-6 Luna High/,'Work ladder still starts with Luna High');
assert.match(work,/GPT-6\.1 Sol Light/,'Work ladder still includes Sol Light');
assert.match(work,/GPT-6\.1 Sol Medium/,'Work ladder still caps at Sol Medium');
assert.match(work,/command_center_agent_approve_sol_medium_step/,'Sol Medium exact-step approval remains enforced');

console.log('restored full-interface runtime stability QA passed');
