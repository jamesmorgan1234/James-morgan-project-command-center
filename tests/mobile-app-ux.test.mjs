import fs from 'node:fs';
import assert from 'node:assert/strict';

const v6=fs.readFileSync('command-center-v6.js','utf8');
const v6Css=fs.readFileSync('command-center-v6.css','utf8');
const v62=fs.readFileSync('command-center-v6-2.js','utf8');
const v62Css=fs.readFileSync('command-center-v6-2.css','utf8');
const exactJs=fs.readFileSync('command-center-exact-menus.js','utf8');
const exactCss=fs.readFileSync('command-center-exact-menus.css','utf8');
const mobile=fs.readFileSync('mobile-accordion-polish.js','utf8');
const coversCss=fs.readFileSync('command-center-book-covers.css','utf8');
const agentHome=fs.readFileSync('command-center-agent-home.js','utf8');
const sixModes=fs.readFileSync('command-center-agent-six-modes-v6.js','utf8');
const boundary=fs.readFileSync('command-center-work-boundary-mode.js','utf8');
const workUi=fs.readFileSync('command-center-work-approval-ui-v3.js','utf8');
const booksUi=fs.readFileSync('command-center-book-review-ui-v5.js','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const index=fs.readFileSync('index.html','utf8');

for(const [name,code] of [['V6',v6],['V6.2',v62],['exact menus',exactJs],['mobile navigation',mobile],['Agent home',agentHome],['six Agent modes',sixModes],['Work boundary',boundary],['Work approval',workUi],['Books review',booksUi]])
  assert.doesNotThrow(()=>new Function(code),`${name} must parse`);

// Home and portfolio navigation must remain the approved compact V6 experience.
for(const phrase of ['Projects','Active / Live','Next Up','Projects Earning'])assert.ok(v6.includes(phrase),`V6 home/menu missing ${phrase}`);
assert.match(v6,/Full portfolio of tracked projects/,'Projects screen subtitle must remain approved');
assert.match(v6,/Live projects in progress/,'Active screen subtitle must remain approved');
assert.match(v6,/Priority queue/,'Next Up subtitle must remain approved');
assert.match(v6,/cc6-project-icon/,'project rows must retain glowing icon capsules');
assert.match(v6,/cc6-project-ring/,'project rows must retain progress rings');
assert.match(v6,/art-mountain\.svg|art-road\.svg|art-chart\.svg|art-network\.svg/,'project rows must retain integrated artwork families');
assert.match(exactCss,/border:2px solid #ff5c00!important/,'approved orange two-pixel card framing must remain');

// Locked book-detail geometry: exactly the compact layout James approved.
assert.match(v62Css,/#bookRevenuePanel \.book-revenue-primary\{[\s\S]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/,'KDP performance must be 3 columns');
assert.match(v62Css,/\.cc62-books-strip\{[\s\S]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/,'five books must fit across');
assert.match(v62Css,/\.cc62-publication-status \.ccv4-pub-formats\{[\s\S]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/,'publication status must be four across');
assert.match(v62Css,/@media\(max-width:620px\)[\s\S]*book-revenue-primary\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/,'phone breakpoint must preserve 3-column KDP layout');
assert.match(v62Css,/@media\(max-width:620px\)[\s\S]*cc62-books-strip\{grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/,'phone breakpoint must preserve five-across book covers');
assert.match(v62Css,/@media\(max-width:620px\)[\s\S]*ccv4-pub-formats\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/,'phone breakpoint must preserve four-across publication status');
assert.match(coversCss,/\.cc7-approved-cover:before\{[\s\S]*display:none!important;[\s\S]*content:none!important/,'cover artwork must not have number badges over it');
assert.match(v6,/Books in Series/,'book detail must retain Books in Series section');

// Agent quick controls and truthful percentage belong in the restored interface.
for(const label of ['Auto','Next Step','Until Work','Manual Task','Project Checkpoint','Stop Agent'])assert.ok(sixModes.includes(label),`Agent quick controls missing ${label}`);
assert.match(sixModes,/command_center_agent_create_project_only_session/,'Agent modes must create real project-locked sessions');
assert.match(sixModes,/p_allow_work:!checkpoint&&mode!=='until-work'/,'Checkpoint and Until Work must preserve Work boundaries');
assert.match(agentHome,/s\.status==='draft'\)\{val\.textContent='Starting'/,'draft run must show Starting instead of fake 0.0%');
assert.match(agentHome,/`Working • \$\{pct\.toFixed\(1\)\}%`/,'running Agent home button must show live verified percentage');
assert.match(agentHome,/verified\/total/,'Agent percentage must use verified steps over total planned steps');

// Protected mobile behavior.
assert.match(index,/minimum-scale=1,maximum-scale=1,user-scalable=no/,'viewport must remain locked against pinch zoom');
assert.match(index,/viewport-fit=cover/,'safe area handling must remain enabled');
assert.match(mobile,/history\.pushState/,'deep navigation must push browser history');
assert.match(mobile,/history\.back\(\)/,'physical/browser Back must remain authoritative');
assert.match(mobile,/history\.scrollRestoration = 'manual'/,'scroll restoration must remain deterministic');
assert.match(mobile,/window\.scrollTo\(/,'saved scroll position must restore');
assert.doesNotMatch(v6Css,/overflow-y\s*:\s*hidden/i,'V6 must not disable vertical scrolling');
assert.doesNotMatch(exactCss,/overflow-y\s*:\s*hidden/i,'exact menus must not disable vertical scrolling');
assert.doesNotMatch(v6Css,/touch-action\s*:\s*none/i,'V6 must not disable native touch panning');

// Books and Work owner boundaries remain intact.
assert.match(booksUi,/Approve Final/);
assert.match(booksUi,/Mark Published/);
assert.match(booksUi,/PC REQUIRED/);
assert.match(boundary,/Next Work Boundary/);
assert.match(boundary,/p_allow_work:false/);
assert.match(workUi,/GPT-6 Luna High/);
assert.match(workUi,/GPT-6\.1 Sol Light/);
assert.match(workUi,/Approve Sol Medium for this step/);
assert.match(workUi,/command_center_agent_approve_sol_medium_step/);

// Restored interface, not the stripped replacement, is the normal visual authority.
for(const required of ['command-center-v6.css?v=1','command-center-v6-2.css?v=1','command-center-v6.js?v=1','command-center-v6-2.js?v=1','command-center-exact-menus.css?v=1','command-center-exact-menus.js?v=1','command-center-agent-home.js?v=1','command-center-agent-six-modes-v6.js?v=1'])
  assert.ok(cfg.includes(required),`normal startup must load ${required}`);
for(const forbidden of ['command-center-approved-ui.js','command-center-approved-nav.js','command-center-mobile-first.css'])
  assert.ok(!cfg.includes(forbidden),`discarded/conflicting visual authority must stay out of normal startup: ${forbidden}`);

console.log('restored approved V6 mobile app UX QA passed');
