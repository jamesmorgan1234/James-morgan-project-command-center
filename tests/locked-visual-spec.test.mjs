import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../command-center-locked-visual-spec.css', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../command-center-locked-visual-spec.js', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../command-center-approved-ui.js', import.meta.url), 'utf8');
const loader = readFileSync(new URL('../command-center-locked-visual-spec-loader.js', import.meta.url), 'utf8');
const startup = readFileSync(new URL('../startup-loader.js', import.meta.url), 'utf8');
const nav = readFileSync(new URL('../command-center-approved-nav.js', import.meta.url), 'utf8');

assert.match(ui, /version:\s*2/, 'approved UI must use the rebuilt screen renderer');
assert.match(ui, /function renderProjects\(/, 'Projects must have a dedicated renderer');
assert.match(ui, /function renderNext\(/, 'Next Up must have a dedicated renderer');
assert.match(ui, /function renderActive\(/, 'Active / Live must have a dedicated renderer');
assert.match(ui, /function renderRevenue\(/, 'Revenue must have a dedicated renderer');
assert.match(ui, /function renderProject\(/, 'Project detail must have a dedicated renderer');
assert.match(ui, /function renderAgentHome\(/, 'Agent must have a dedicated renderer');
assert.match(ui, /cc-screen-project-card/, 'Projects must render purpose-built project cards');
assert.match(ui, /cc-screen-next-card/, 'Next Up must render purpose-built queue cards');
assert.match(ui, /cc-screen-active-card/, 'Active / Live must render purpose-built active cards');
assert.match(ui, /cc-screen-revenue-row/, 'Revenue must render purpose-built revenue rows');
assert.match(ui, /Project Checkpoint/, 'six-button Agent set must preserve Project Checkpoint');
assert.match(ui, /Stop Agent/, 'six-button Agent set must preserve Stop Agent');
assert.match(ui, /Book \$\{index\+1\}/, 'Book 1, Book 2, etc. must be rendered above covers by the renderer itself');
assert.doesNotMatch(ui, /cc-approved-cover[^`]*<span>\$\{index\+1\}/, 'number badges must not be rendered over book covers');

assert.match(css, /clip-path:polygon\(3% 0,97% 0,100% 16%,100% 84%,97% 100%,3% 100%,0 84%,0 16%\)/, 'approved clipped sci-fi frame geometry must remain');
assert.match(css, /\.cc-screen-page-head[^{]*\{[\s\S]*?art-eclipse\.svg/, 'submenu header must use the approved eclipse artwork');
assert.match(css, /\.cc-screen-back[^{]*\{[\s\S]*?clip-path:polygon\(22% 0,78% 0/, 'back control must keep the approved octagonal geometry');
assert.match(css, /\.cc-screen-project-card\{[\s\S]*?min-height:120px/, 'Projects cards must remain compact');
assert.match(css, /\.cc-screen-next-card\{[\s\S]*?min-height:126px/, 'Next Up must have its own compact layout');
assert.match(css, /\.cc-screen-active-scope\{[\s\S]*?border-left:1px solid var\(--cc-orange\)/, 'Active / Live must retain a distinct right-side scope column');
assert.match(css, /\.cc-screen-kpi-grid\{[\s\S]*?grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/, 'book KDP performance must be 3 columns by 2 rows');
assert.match(css, /\.cc-screen-books\{[\s\S]*?grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/, 'five series books must fit across the phone');
assert.doesNotMatch(css, /\.cc-screen-books\{[^}]*overflow-x:auto/, 'Books in Series must not depend on horizontal scrolling');
assert.match(css, /\.cc-screen-publication\{[\s\S]*?grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/, 'publication formats must stay four across');
assert.match(css, /\.cc-screen-ring\{[\s\S]*?aspect-ratio:1\/1/, 'progress ring must be structurally constrained to a circle');
assert.match(css, /\.cc-screen-revenue-row\{[\s\S]*?grid-template-columns:minmax\(0,1fr\) auto/, 'Revenue rows must use a non-overlapping structural grid');
assert.match(css, /\.cc-screen-agent-modes\{[\s\S]*?grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/, 'Agent controls must use the compact two-column design');
assert.match(css, /body\.cc-approved-legacy-open \.panel/, 'deep/advanced screens must inherit the same material system');
assert.doesNotMatch(css, /overflow-y\s*:\s*hidden/i, 'native Android vertical scrolling must remain enabled');
assert.doesNotMatch(css, /touch-action\s*:\s*none/i, 'touch scrolling must not be disabled');

assert.match(runtime, /version:\s*2/, 'locked visual runtime must be a lightweight compatibility bridge');
assert.doesNotMatch(runtime, /MutationObserver/, 'visual runtime must not rewrite the DOM after render');
assert.doesNotMatch(runtime, /renderNextQueue|decorateProjectCards|addBookLabels/, 'old mutation-based visual correction functions must be removed');
assert.match(startup, /command-center-locked-visual-spec-loader\.js/, 'locked screen system must load during normal startup');
assert.match(loader, /command-center-locked-visual-spec\.css/, 'screen-system stylesheet must load');
assert.match(loader, /command-center-locked-visual-spec\.js/, 'compatibility runtime must load');
assert.match(nav, /command-center-locked-visual-spec\.css/, 'screen-system stylesheet must be re-appended after enhancement CSS');

console.log('Locked visual specification QA passed.');
