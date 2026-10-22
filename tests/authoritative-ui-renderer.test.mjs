import fs from 'node:fs';
import assert from 'node:assert/strict';

const cfg=fs.readFileSync('app-config.js','utf8');
const approved=fs.readFileSync('command-center-approved-ui.js','utf8');
const authority=fs.readFileSync('command-center-authoritative-runtime.js','utf8');
const lazy=fs.readFileSync('command-center-advanced-lazy-loader.js','utf8');

const coreStart=cfg.indexOf('window.COMMAND_CENTER_LOAD_ENHANCEMENTS');
const advancedStart=cfg.indexOf('let advancedPromise');
const core=cfg.slice(coreStart,advancedStart);
const advanced=cfg.slice(advancedStart);

for(const asset of [
  'command-center-mobile-first.css?v=1',
  'command-center-artwork-polish.css?v=1',
  'command-center-approved-ui.css?v=2',
  'command-center-approved-ui.js?v=2',
  'command-center-precise-progress.js?v=3',
  'command-center-approved-nav.js?v=2',
  'command-center-work-boundary-mode.js?v=1',
  'command-center-authoritative-runtime.js?v=2',
  'command-center-agent-truth.js?v=2'
]) assert.ok(core.includes(asset),`approved normal surface must load directly: ${asset}`);

for(const legacy of ['command-center-v4.js','command-center-v6.js','source-health.js','command-center-brain-home.js','command-center-agent-home.js']){
  assert.ok(!core.includes(legacy),`legacy/admin renderer must not execute in normal startup: ${legacy}`);
  assert.ok(advanced.includes(legacy),`legacy/admin renderer must remain available only through Advanced: ${legacy}`);
}

assert.match(approved,/id='ccApprovedApp'|id="ccApprovedApp"|ccApprovedApp/,'approved renderer must own a dedicated app root');
assert.match(approved,/state\.legacy=false/,'approved renderer must make normal mode non-legacy');
assert.doesNotMatch(authority,/new MutationObserver\s*\(/,'authoritative normal renderer must not use global DOM mutation observers');
assert.match(lazy,/COMMAND_CENTER_LOAD_ADVANCED/,'legacy/admin stack must be explicitly lazy-loaded');
assert.match(lazy,/data-cc-about-action=\"brain\"/,'Brain opens through the lazy advanced boundary');
assert.match(lazy,/data-cc-about-action=\"advanced\"/,'Advanced opens through the lazy advanced boundary');

console.log('authoritative approved UI renderer QA passed');
