import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const v6 = readFileSync(new URL('../command-center-v6.js', import.meta.url), 'utf8');
const v6Css = readFileSync(new URL('../command-center-v6.css', import.meta.url), 'utf8');
const v62Css = readFileSync(new URL('../command-center-v6-2.css', import.meta.url), 'utf8');
const exactJs = readFileSync(new URL('../command-center-exact-menus.js', import.meta.url), 'utf8');
const exactCss = readFileSync(new URL('../command-center-exact-menus.css', import.meta.url), 'utf8');
const coversCss = readFileSync(new URL('../command-center-book-covers.css', import.meta.url), 'utf8');
const agentHome = readFileSync(new URL('../command-center-agent-home.js', import.meta.url), 'utf8');
const sixModes = readFileSync(new URL('../command-center-agent-six-modes-v6.js', import.meta.url), 'utf8');
const cfg = readFileSync(new URL('../app-config.js', import.meta.url), 'utf8');
const startup = readFileSync(new URL('../startup-loader.js', import.meta.url), 'utf8');

for(const [name,code] of [['V6',v6],['exact menus',exactJs],['Agent home',agentHome],['Agent six modes',sixModes]])assert.doesNotThrow(()=>new Function(code),`${name} must parse`);

// Literal approved black/orange sci-fi composition.
assert.match(v6Css,/--cc6-line:#ff6507/,'approved orange identity must remain explicit');
assert.match(v6Css,/html\[data-command-center-theme="v6"\][\s\S]*background:#000!important/,'approved shell must remain black');
assert.match(v6Css,/\.stat-button\{[\s\S]*min-height:128px!important[\s\S]*border:2px solid #ff5d00!important/,'home buttons must keep the approved compact framed geometry');
assert.match(v6Css,/\.stat-button\{[\s\S]*clip-path:polygon\(3% 0,97% 0,100% 18%,100% 82%,97% 100%,3% 100%,0 82%,0 18%\)!important/,'home buttons must keep clipped sci-fi corners');
assert.match(v6Css,/\.cc6-stat-icon\{[\s\S]*clip-path:polygon\(22% 0,78% 0,100% 22%,100% 78%,78% 100%,22% 100%,0 78%,0 22%\)!important/,'home/menu icon capsules must keep octagonal geometry');
assert.match(v6Css,/#backHomeBtn\{[\s\S]*clip-path:polygon\(22% 0,78% 0,100% 22%,100% 78%,78% 100%,22% 100%,0 78%,0 22%\)!important/,'back control must keep approved octagonal geometry');
assert.match(v6Css,/\.hub-project-card\{[\s\S]*min-height:126px!important/,'project rows must remain compact');
assert.match(v6Css,/\.hub-project-card\{[\s\S]*border:2px solid #ff5d00!important/,'project rows must retain orange framing');
assert.match(v6,/art-mountain\.svg|art-road\.svg|art-chart\.svg|art-network\.svg/,'rows must retain integrated approved artwork families');
assert.match(v6,/cc6-project-ring/,'project rows must retain circular progress rings');

for(const [view,title,subtitle] of [
  ['all','Projects','Full portfolio of tracked projects'],
  ['active','Active / Live','Live projects in progress'],
  ['attention','Next Up','Priority queue']
]){
  assert.ok(v6.includes(title),`missing ${title} screen`);
  assert.ok(v6.includes(subtitle),`missing ${title} subtitle`);
}
assert.match(exactCss,/border:2px solid #ff5c00!important/,'exact menu treatment must retain two-pixel orange borders');

// Locked book-detail screenshot geometry.
assert.match(v62Css,/#bookRevenuePanel \.book-revenue-primary\{[\s\S]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/,'KDP performance must be 3 columns by 2 rows');
assert.match(v62Css,/\.cc62-books-strip\{[\s\S]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/,'five series covers must fit across the phone');
assert.doesNotMatch(v62Css,/\.cc62-books-strip\{[^}]*overflow-x:auto/,'Books in Series must not depend on horizontal scrolling');
assert.match(v62Css,/\.cc62-publication-status \.ccv4-pub-formats\{[\s\S]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/,'publication formats must remain four across');
assert.match(v62Css,/@media\(max-width:620px\)[\s\S]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/,'phone breakpoint must preserve compact KDP geometry');
assert.match(v62Css,/@media\(max-width:620px\)[\s\S]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/,'phone breakpoint must preserve five-across book geometry');
assert.match(v62Css,/@media\(max-width:620px\)[\s\S]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/,'phone breakpoint must preserve four-across publication geometry');
assert.match(coversCss,/\.cc7-approved-cover:before\{[\s\S]*display:none!important;[\s\S]*content:none!important/,'book numbers must not overlay cover artwork');

// Protected mobile behavior.
assert.doesNotMatch(v6Css,/overflow-y\s*:\s*hidden/i,'native Android vertical scrolling must remain enabled');
assert.doesNotMatch(exactCss,/overflow-y\s*:\s*hidden/i,'exact menu layer must not disable vertical scrolling');
assert.doesNotMatch(v6Css,/touch-action\s*:\s*none/i,'touch scrolling must remain enabled');

// Agent additions must live inside the same restored design, with truthful progress.
for(const label of ['Auto','Next Step','Until Work','Manual Task','Project Checkpoint','Stop Agent'])assert.ok(sixModes.includes(label),`missing Agent control ${label}`);
assert.match(agentHome,/s\.status==='draft'\)\{val\.textContent='Starting'/,'draft session must show Starting');
assert.match(agentHome,/`Working • \$\{pct\.toFixed\(1\)\}%`/,'running Agent home button must show verified one-decimal progress');

// Normal startup must load this restored authority and keep discarded renderer out.
for(const required of ['command-center-v6.css?v=1','command-center-v6-2.css?v=1','command-center-exact-menus.css?v=1','command-center-v6.js?v=1','command-center-v6-2.js?v=1','command-center-exact-menus.js?v=1'])assert.ok(cfg.includes(required),`missing restored visual asset ${required}`);
for(const forbidden of ['command-center-approved-ui.js','command-center-approved-nav.js','command-center-mobile-first.css'])assert.ok(!cfg.includes(forbidden),`discarded renderer/override must not regain visual authority: ${forbidden}`);
assert.match(startup,/project-hub\.js\?v=3/,'restored project hub must be part of core startup');
assert.match(startup,/mobile-accordion-polish\.js\?v=3/,'restored mobile navigation must be part of core startup');

console.log('Locked restored V6 visual specification QA passed.');
