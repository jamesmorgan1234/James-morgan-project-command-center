import fs from 'node:fs';
import assert from 'node:assert/strict';

const source=fs.readFileSync('source-health.js','utf8');
const sourceCss=fs.readFileSync('source-health.css','utf8');
const startup=fs.readFileSync('startup-loader.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const appConfig=fs.readFileSync('app-config.js','utf8');
const completion=fs.readFileSync('command-center-agent-mode-completion.js','utf8');
const bookGuard=fs.readFileSync('command-center-book-review-guard.js','utf8');
const bookUi=fs.readFileSync('command-center-book-review-ui-v5.js','utf8');
const bookCss=fs.readFileSync('command-center-book-review-ui.css','utf8');
const workBoundary=fs.readFileSync('command-center-work-boundary-mode.js','utf8');
const workUi=fs.readFileSync('command-center-work-approval-ui-v3.js','utf8');
const workCss=fs.readFileSync('command-center-work-approval-ui.css','utf8');

assert.match(source,/Recover with Agent/,'Source Health must expose one-tap Agent recovery');
assert.match(source,/command_center_agent_create_project_only_session/,'Source recovery must create a real project-locked Agent session');
assert.match(source,/Agent is already working on this project/,'Source recovery must not create competing project runs');
assert.match(sourceCss,/min-height:48px/,'Source recovery must use phone-size touch targets');

assert.match(sw,/james-command-center-v74/,'PWA cache generation must match restored-interface v74');
assert.match(sw,/fetchWithTimeout\(e\.request,3500\)/,'Navigation must prefer fresh network content');
assert.match(sw,/if\(freshAsset\)\{[\s\S]*fetch\(e\.request,\{cache:'no-store'\}\)/,'Fresh app/code assets must prefer the network before cached fallback');
assert.match(sw,/cache:'no-store'/,'Network-first fetches must bypass stale HTTP cache');
assert.match(sw,/keys\.filter\(key=>key\.startsWith\('james-command-center-'\)&&key!==CACHE\)/,'Old Command Center caches must be purged on activation');
assert.match(startup,/register\('\.\/service-worker\.js',\{updateViaCache:'none'\}\)/,'Canonical service-worker path must bypass update cache');
assert.match(startup,/controllerchange/,'New service worker takeover must be detected');
assert.match(startup,/location\.reload\(\)/,'Controlled app must reload once after the new service worker takes control');
assert.match(startup,/cc-sw-v74-reloaded/,'Controlled reload marker must match the v74 generation');

for(const asset of ['source-health.js?v=4','command-center-agent-auto-control.js?v=1','command-center-agent-mode-completion.js?v=4','command-center-book-review-ui-v5.js?v=1','command-center-work-approval-ui-v3.js?v=1'])assert.match(appConfig,new RegExp(asset.replaceAll('.','\\.').replace('?','\\?')),`restored full interface missing ${asset}`);
assert.doesNotMatch(appConfig,/let advancedPromise/,'restored interface must not split critical recovery/Agent controls into a hidden Advanced-only loader');
for(const forbidden of ['command-center-approved-ui.js','command-center-approved-nav.js','command-center-authoritative-runtime.js','command-center-agent-truth.js','command-center-mobile-first.css'])assert.ok(!completion.includes(forbidden),`Agent completion layer must not bootstrap discarded UI asset ${forbidden}`);
assert.doesNotMatch(completion,/\.destroy\?\.\(\)/,'Agent completion layer must not destroy the restored V6 Agent controllers');
assert.match(completion,/COMMAND_CENTER_AGENT_AUTO_CONTROL\?\.refresh/,'Agent completion layer must still synchronize Auto state');
assert.match(completion,/COMMAND_CENTER_AGENT_HOME\?\.refresh/,'Agent completion layer must still synchronize the home Agent status');

assert.match(bookGuard,/BOOKS OWNER REVIEW GATE/,'Books Agent sessions must carry the owner review gate');
assert.match(bookUi,/PC REQUIRED/,'Books review card must clearly require PC review');
assert.match(bookUi,/Approve Final/,'Books review card must expose owner final approval');
assert.match(bookUi,/Approved Final · Publish Queue/,'Approved Final must mean queued for rollout, not published');
assert.match(bookUi,/Mark Published/,'Approved books must expose a separate Mark Published action');
assert.match(bookUi,/command_center_book_review_approve/,'Approve Final must persist through the review RPC');
assert.match(bookUi,/command_center_book_review_needs_changes/,'Needs Changes must persist owner feedback');
assert.match(bookUi,/command_center_book_mark_published/,'Publication confirmation must use the dedicated backend RPC');
assert.match(bookUi,/This does not submit anything to KDP/,'Mark Published must never imply it publishes to KDP');
assert.match(bookCss,/cc-book-publish-queue/,'Publication queue needs a dedicated visual state');
assert.doesNotMatch(bookUi,/new MutationObserver\s*\(/,'Books review must not use a global mutation remount loop');

assert.match(workBoundary,/Next Work Boundary/,'Agent must expose the renamed Work boundary mode');
assert.match(workBoundary,/NEXT WORK BOUNDARY CHECKPOINT/,'Work boundary session must carry a durable checkpoint contract');
assert.match(workUi,/Approve Work/,'Work boundary must expose owner approval');
assert.match(workUi,/GPT-6 Luna High/,'Work ladder must start at Luna High');
assert.match(workUi,/GPT-6\.1 Sol Light/,'Work ladder must include Sol Light');
assert.match(workUi,/Approve Sol Medium for this step/,'Sol Medium must remain exact-step approval only');
assert.match(workUi,/No purchase, credits, subscription, or paid upgrade is authorized/,'Work approval must not authorize spending');
assert.match(workCss,/min-height:48px/,'Work approval control must use phone-size touch targets');
assert.doesNotMatch(workUi,/new MutationObserver\s*\(/,'Work approval must not use a global mutation remount loop');

console.log('source recovery + PWA v74 + single-owner Agent UI + Books review + Work ladder QA passed');
