import fs from 'node:fs';
import assert from 'node:assert/strict';

const cfg=fs.readFileSync('app-config.js','utf8');
const approved=fs.readFileSync('command-center-approved-ui.js','utf8');
const completion=fs.readFileSync('command-center-agent-mode-completion.js','utf8');

for(const asset of [
  'command-center-mobile-first.css?v=1',
  'command-center-artwork-polish.css?v=1',
  'command-center-approved-ui.css?v=2',
  'command-center-approved-ui.js?v=2',
  'command-center-precise-progress.js?v=2',
  'command-center-approved-nav.js?v=2',
  'command-center-work-boundary-mode.js?v=1'
]) assert.ok(cfg.includes(asset),`approved surface must load directly from app-config: ${asset}`);

assert.ok(cfg.indexOf('command-center-approved-ui.js?v=2') < cfg.indexOf('command-center-v4.js?v=1'),'approved UI must load before V4 legacy renderer');
assert.ok(cfg.indexOf('command-center-approved-ui.js?v=2') < cfg.indexOf('command-center-v6.js?v=1'),'approved UI must load before V6 legacy renderer');
assert.match(approved,/id='ccApprovedApp'|id="ccApprovedApp"|ccApprovedApp/,'approved renderer must own a dedicated app root');
assert.match(approved,/state\.legacy=false/,'approved renderer must make normal mode non-legacy');
assert.match(completion,/COMMAND_CENTER_AGENT_HOME\?\.destroy/,'legacy Agent home controller must be retired after approved UI is active');
assert.match(completion,/COMMAND_CENTER_AGENT_MODE\?\.destroy/,'legacy Agent detail controller must be retired after approved UI is active');

console.log('authoritative approved UI renderer QA passed');
