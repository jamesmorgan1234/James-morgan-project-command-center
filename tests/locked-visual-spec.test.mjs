import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../command-center-locked-visual-spec.css', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../command-center-locked-visual-spec.js', import.meta.url), 'utf8');
const loader = readFileSync(new URL('../command-center-locked-visual-spec-loader.js', import.meta.url), 'utf8');
const startup = readFileSync(new URL('../startup-loader.js', import.meta.url), 'utf8');

assert.match(startup, /command-center-locked-visual-spec-loader\.js\?v=1/, 'locked visual system must load during normal startup');
assert.match(loader, /command-center-locked-visual-spec\.css\?v=1/, 'locked visual stylesheet must be loaded');
assert.match(loader, /command-center-locked-visual-spec\.js\?v=1/, 'locked visual runtime must be loaded');

assert.match(css, /clip-path:polygon\(3% 0,97% 0,100% 16%,100% 84%,97% 100%,3% 100%,0 84%,0 16%\)/, 'approved clipped sci-fi card geometry must be retained');
assert.match(css, /\.cc-approved-page-head[^{]*\{[\s\S]*?art-eclipse\.svg/, 'submenu header must use the approved eclipse header artwork');
assert.match(css, /\.cc-approved-back[^{]*\{[\s\S]*?clip-path:polygon\(22% 0,78% 0/, 'back control must use the approved octagonal geometry');
assert.match(css, /\.cc-approved-project-card[^{]*\{[\s\S]*?min-height:118px/, 'Projects cards must stay compact');
assert.match(css, /data-cc-locked-view="next"[\s\S]*?\.cc-approved-ring\{display:none!important\}/, 'Next Up must not reuse the Projects progress-ring layout');
assert.match(runtime, /renderNextQueue/, 'Next Up must render the real next-action queue');
assert.match(runtime, /next_action/, 'Next Up must use recorded next actions');

assert.match(runtime, /openActive/, 'Active \/ Live must have its own dedicated screen');
assert.match(runtime, /Live projects in progress/, 'Active \/ Live must preserve the approved screen purpose');
assert.match(css, /\.cc-locked-active-scope/, 'Active \/ Live must use the distinct right-side scope column');
assert.match(css, /border-left:1px solid #ff6500/, 'Active \/ Live scope column must retain its visual divider');

assert.match(css, /\.cc-approved-kpi-grid\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/, 'book KDP performance must be 3 columns by 2 rows on phone');
assert.match(css, /\.cc-approved-books\{[^}]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/, 'five series books must fit across the phone');
assert.doesNotMatch(css, /\.cc-approved-books\{[^}]*overflow-x:auto/, 'Books in Series must not rely on horizontal clipping/scrolling');
assert.match(css, /\.cc-approved-publication\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/, 'publication formats must stay four across');
assert.match(css, /\.cc-approved-cover>span\{display:none!important\}/, 'old numbered cover badges must not appear over artwork');
assert.match(runtime, /Book \$\{index\+1\}/, 'Book 1, Book 2, etc. labels must be added above covers');
assert.match(runtime, /tile\.querySelector\('\.cc-approved-cover>span'\)\?\.remove\(\)/, 'number badge node must be removed, not merely relied on cosmetically');

assert.match(css, /\.cc-approved-project-hero:before\{[\s\S]*?background-image:radial-gradient/, 'project hero must use a bounded glow instead of the giant eclipse disk');
assert.doesNotMatch(css, /\.cc-approved-project-hero:before\{[^}]*cc6-eclipse\.webp/, 'giant eclipse disk must not return to project hero');

assert.match(runtime, /Project Checkpoint/i, 'locked visual runtime must preserve Project Checkpoint integration');
assert.match(runtime, /data-cc-agent-stop/, 'locked visual runtime must preserve Stop Agent');
assert.match(runtime, /group\.appendChild\(stop\)/, 'Agent home must keep Stop Agent with the six-button control set');
assert.match(css, /\.cc-approved-agent-modes\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/, 'Agent controls must use the approved compact two-column system');

assert.doesNotMatch(css, /overflow-y\s*:\s*hidden/i, 'locked visual system must not break native Android vertical scrolling');
assert.doesNotMatch(css, /touch-action\s*:\s*none/i, 'locked visual system must not disable touch scrolling');
assert.match(css, /body\.cc-approved-legacy-open \.panel/, 'deep and advanced screens must inherit the same visual language');

console.log('Locked visual specification QA passed.');