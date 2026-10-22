import fs from 'node:fs';
import assert from 'node:assert/strict';

const cfg=fs.readFileSync('app-config.js','utf8');
const v6=fs.readFileSync('command-center-v6.js','utf8');
const exact=fs.readFileSync('command-center-exact-menus.js','utf8');
const brain=fs.readFileSync('command-center-brain-home.js','utf8');
const agentHome=fs.readFileSync('command-center-agent-home.js','utf8');
const mobileFallback=fs.readFileSync('command-center-mobile-first.css','utf8');

for(const asset of [
  'project-hub.css?v=2','mobile-accordion-polish.css?v=4',
  'command-center-v6.css?v=1','command-center-v6.js?v=1',
  'command-center-v6-2.css?v=1','command-center-v6-2.js?v=1',
  'command-center-v6-art.css?v=1',
  'command-center-exact-menus.css?v=1','command-center-exact-menus.js?v=1',
  'command-center-earnings.css?v=1','command-center-earnings.js?v=2',
  'command-center-brain-home.css?v=4','command-center-brain-home.js?v=5',
  'command-center-agent-home.css?v=1','command-center-agent-home.js?v=1',
  'command-center-agent-six-modes-v6.css?v=1','command-center-agent-six-modes-v6.js?v=1'
])assert.ok(cfg.includes(asset),`restored authoritative surface missing ${asset}`);

for(const removed of [
  'command-center-approved-ui.js',
  'command-center-approved-nav.js',
  'command-center-authoritative-runtime.js',
  'command-center-agent-truth.js',
  'command-center-locked-visual-spec-loader.js',
  'command-center-mobile-first.css'
])assert.ok(!cfg.includes(removed),`discarded stripped/generic layer must not own normal startup: ${removed}`);

assert.match(v6,/Projects/);
assert.match(v6,/Active \/ Live/);
assert.match(v6,/Next Up/);
assert.match(v6,/Projects Earning/);
assert.match(exact,/Total Projects/);
assert.match(exact,/Priority queue/);
assert.match(exact,/decorateActiveCards\(\)/,'exact menu layer must decorate the Active screen');
assert.match(exact,/cc-exact-active-scope/,'Active screen must retain its right-side scope column');
assert.match(exact,/under\(\) !== 'active'/,'Active decorations must remain scoped to the Active view');
for(const capability of ['Project Brain','Automation','Integrations','Analytics','Security','Deployment','Agent Mode'])assert.ok(brain.includes(capability),`restored interface missing ${capability}`);
assert.match(agentHome,/Agent Control/);
assert.match(agentHome,/Working • \$\{pct\.toFixed\(1\)\}%/,'Agent home must expose real running progress');

// The old generic mobile stylesheet may stay in the repository/cache for fallback compatibility,
// but it must not become visual authority because it changes approved screenshot geometry.
assert.match(mobileFallback,/\.cc62-books-strip\{grid-template-columns:repeat\(2/,'legacy file still contains incompatible two-column book fallback, proving why it cannot own normal rendering');
assert.doesNotMatch(cfg,/command-center-mobile-first\.css/);

assert.match(cfg,/window\.COMMAND_CENTER_LOAD_ADVANCED = \(\) => window\.COMMAND_CENTER_LOAD_ENHANCEMENTS\(\)/,'Advanced entry must reuse the same full restored capability stack instead of a second renderer');
assert.doesNotMatch(cfg,/let advancedPromise/,'no hidden second rendering architecture may remain');

console.log('Restored V6 + exact-menu architecture is the authoritative Command Center UI contract.');
