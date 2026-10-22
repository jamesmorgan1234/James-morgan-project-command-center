import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css=readFileSync('command-center-mobile-first.css','utf8');
const completion=readFileSync('command-center-agent-mode-completion.js','utf8');
const cfg=readFileSync('app-config.js','utf8');
const sw=readFileSync('service-worker.js','utf8');
const html=readFileSync('index.html','utf8');

// Keep the prior mobile layer available only as compatibility/fallback; it must not own the approved V6 interface.
assert.match(css,/@media\(max-width:760px\)/);
assert.match(css,/--cc-touch:48px/,'fallback mobile controls retain accessible touch targets');
assert.doesNotMatch(css,/overflow-y\s*:/,'fallback polish must not redefine document vertical scrolling');
assert.doesNotMatch(css,/touch-action\s*:/,'fallback polish must not redefine touch gesture routing');
assert.doesNotMatch(css,/overscroll-behavior-y\s*:/,'fallback polish must not change Android overscroll behavior');
assert.doesNotMatch(cfg,/command-center-mobile-first\.css/,'legacy generic mobile visual override must not load in restored normal interface');
assert.match(cfg,/command-center-v6\.css\?v=1/,'approved V6 geometry must own normal interface');
assert.match(cfg,/command-center-exact-menus\.css\?v=1/,'exact-menu geometry must own normal interface');
assert.match(completion,/command-center-mobile-first\.css\?v=1/,'legacy completion fallback may retain compatibility asset reference');
assert.match(sw,/james-command-center-v74/,'fallback asset remains packaged under current PWA generation');
assert.ok(sw.includes("'./command-center-mobile-first.css?v=1'"),'fallback mobile asset remains available offline without becoming normal visual authority');
assert.match(sw,/url\.pathname\.endsWith\('\/command-center-mobile-first\.css'\)/,'fallback mobile asset remains network-fresh if explicitly requested');
assert.match(html,/user-scalable=no/,'approved locked viewport must remain unchanged');
assert.match(html,/viewport-fit=cover/,'safe-area edge-to-edge handling must remain intact');

console.log('Legacy mobile compatibility is quarantined; restored V6/exact-menu UI remains visual authority under PWA v74.');