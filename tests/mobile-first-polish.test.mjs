import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync('command-center-mobile-first.css','utf8');
const completion = readFileSync('command-center-agent-mode-completion.js','utf8');
const sw = readFileSync('service-worker.js','utf8');
const html = readFileSync('index.html','utf8');

assert.match(css, /@media\(max-width:760px\)/, 'mobile-first layer must target phone layouts');
assert.match(css, /--cc-touch:48px/, 'mobile interaction target must remain at least 48px');
assert.match(css, /\.stat-button[\s\S]*border:2px solid #ff6507!important[\s\S]*border-left-width:2px!important/, 'home cards must use an even orange frame rather than a heavy left rail');
assert.match(css, /hub-project-card[\s\S]*border:2px solid #ff5c00!important[\s\S]*border-left-width:2px!important/, 'project cards must use an even orange frame');
assert.match(css, /\.cc-exact-menu-icon[\s\S]*width:54px!important[\s\S]*height:54px!important/, 'project emblems must be resized for phone layouts');
assert.match(css, /\.cc-brain-capabilities\{grid-template-columns:1fr!important/, 'Brain controls must become one column on phones');
assert.match(css, /\.cc-agent-actions\{display:grid!important;grid-template-columns:1fr!important/, 'Agent controls must become thumb-friendly one-column actions');
assert.match(css, /\.cc62-books-strip\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/, 'Books tiles must reflow to two columns on phones');
assert.match(css, /#bookRevenuePanel \.book-revenue-primary\{grid-template-columns:1fr!important/, 'Book revenue KPIs must not squeeze three columns onto a phone');
assert.match(css, /input,[\s\S]*select,[\s\S]*textarea\{font-size:16px!important\}/, 'form controls must avoid mobile browser zoom-on-focus');
assert.doesNotMatch(css, /overflow-y\s*:/, 'visual polish must not redefine document vertical scrolling');
assert.doesNotMatch(css, /touch-action\s*:/, 'visual polish must not redefine touch gesture routing');
assert.doesNotMatch(css, /overscroll-behavior-y\s*:/, 'visual polish must not change Android overscroll behavior');

assert.match(completion, /command-center-mobile-first\.css\?v=1/, 'final-loaded Agent completion script must attach mobile polish');
assert.match(sw, /james-command-center-v70/, 'mobile polish must preserve the established Agent Mode PWA cache identity');
assert.ok(sw.includes("'./command-center-mobile-first.css?v=1'"), 'mobile polish must be pre-cached for installed use');
assert.match(sw, /url\.pathname\.endsWith\('\/command-center-mobile-first\.css'\)/, 'mobile polish must be a fresh asset');
assert.match(html, /user-scalable=no/, 'approved locked viewport must remain unchanged');
assert.match(html, /viewport-fit=cover/, 'safe-area edge-to-edge handling must remain intact');

console.log('Mobile-first polish QA passed.');
