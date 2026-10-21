import fs from 'node:fs';
import assert from 'node:assert/strict';

const js=fs.readFileSync('command-center-project-detail-accordions.js','utf8');
const css=fs.readFileSync('command-center-project-detail-accordions.css','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const mobile=fs.readFileSync('mobile-accordion-polish.js','utf8');
const brain=fs.readFileSync('command-center-brain-home.js','utf8');

assert.doesNotThrow(()=>new Function(js),'project-detail accordion controller must parse');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'project-detail accordion CSS braces must balance');

for(const label of ['Project Roadmap','Lifetime Performance','Tracking Integrations'])assert.ok(js.includes(label),`missing project primary section: ${label}`);
assert.match(css,/data-cc-detail-section="roadmap"\]\{order:10!important\}/,'Project Roadmap must be first');
assert.match(css,/data-cc-detail-section="performance"\]\{order:20!important\}/,'Lifetime Performance must be second');
assert.match(css,/data-cc-detail-section="tracking"\]\{order:30!important\}/,'Tracking Integrations must be third');

assert.match(js,/let openKey=null/,'project primary sections must start collapsed');
assert.match(js,/body\.hidden=!isOpen/,'only the selected section body may be expanded');
assert.match(js,/if\(openKey===key\)/,'same section bubble must act as a toggle');
assert.match(js,/history\.back\(\)/,'same open bubble must close through browser\/Android Back history');
assert.match(js,/history\.pushState/,'opening a section must create a Back depth');
assert.match(js,/history\.replaceState/,'switching open project sections must not pile up unnecessary history');
assert.match(js,/ccProjectRoadmapCategory/,'closing the Roadmap bubble must account for a nested roadmap category');

assert.match(mobile,/ccProjectDetailAccordion/,'mobile navigation must yield detail-section history to the project accordion controller');
assert.match(mobile,/ccProjectDetailAccordionBase/,'mobile navigation must preserve the section-collapse landing state');
assert.match(css,/#backHomeBtn,[\s\S]*\.cc-brain-back\{display:none!important\}/,'redundant Back buttons must not be visible when bubble\/phone Back controls exist');
assert.match(css,/background:linear-gradient\(180deg,#080503,#030303\)!important/,'project section bubbles must stay black, not blue');
assert.match(css,/border-left:4px solid #ff6208!important/,'project section bubbles must retain the orange Command Center accent');

assert.ok(cfg.indexOf('command-center-project-detail-accordions.css?v=1')>cfg.indexOf('command-center-ui-consistency.css?v=1'),'accordion CSS must load after final surface normalization');
assert.ok(cfg.indexOf('command-center-project-detail-accordions.js?v=1')>cfg.indexOf('command-center-ui-consistency.js?v=1'),'accordion behavior must load after the existing UI consistency repair');

assert.match(brain,/\['Context Builder'[^\]]+,0\]/,'this app-only repair must not claim Project Brain Phase 3 complete');
assert.match(brain,/\['Task Queue \/ Planner'[^\]]+,0\]/,'this app-only repair must not claim Project Brain Phase 4 complete');
assert.match(brain,/\['ChatGPT Handoff Loop'[^\]]+,0\]/,'this app-only repair must not claim Project Brain Phase 5 complete');

console.log('Project detail accordion ordering/toggle/Back/no-blue app QA passed.');