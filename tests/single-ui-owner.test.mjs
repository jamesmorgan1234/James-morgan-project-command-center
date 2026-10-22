import fs from 'node:fs';
import assert from 'node:assert/strict';

const cfg=fs.readFileSync('app-config.js','utf8');
const completion=fs.readFileSync('command-center-agent-mode-completion.js','utf8');
const v6=fs.readFileSync('command-center-v6.js','utf8');

assert.match(cfg,/command-center-v6\.js\?v=1/,'V6 must remain the visible Command Center owner');
assert.match(cfg,/command-center-agent-auto-control\.js\?v=1/,'Agent Auto helper must load directly through the full-interface loader');
assert.match(cfg,/command-center-agent-mode-completion\.js\?v=3/,'Agent completion state patch must remain in the full-interface loader');

for(const forbidden of [
  'command-center-approved-ui.js',
  'command-center-approved-nav.js',
  'command-center-authoritative-runtime.js',
  'command-center-agent-truth.js',
  'command-center-mobile-first.css',
  'command-center-artwork-polish.css'
]) assert.ok(!completion.includes(forbidden),`Agent completion must never bootstrap discarded UI asset ${forbidden}`);

assert.doesNotMatch(completion,/document\.createElement\(['"]script['"]\)/,'Agent completion must not dynamically inject a second renderer');
assert.doesNotMatch(completion,/document\.createElement\(['"]link['"]\)/,'Agent completion must not dynamically inject a second visual layer');
assert.doesNotMatch(completion,/COMMAND_CENTER_AGENT_HOME\?\.destroy|COMMAND_CENTER_AGENT_MODE\?\.destroy/,'Agent completion must not tear down restored V6 Agent controllers');
assert.match(completion,/COMMAND_CENTER_AGENT_HOME\?\.refresh/,'Agent completion may refresh Agent state without replacing UI');
assert.match(v6,/Projects Earning/,'restored V6 home must remain intact');

console.log('Single authoritative V6 UI owner QA passed; Agent completion cannot re-bootstrap the discarded generic renderer.');
