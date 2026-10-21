import fs from 'node:fs';
import assert from 'node:assert/strict';

const css=fs.readFileSync('command-center-exact-menus.css','utf8');
const js=fs.readFileSync('command-center-exact-menus.js','utf8');
const earningsCss=fs.readFileSync('command-center-earnings.css','utf8');
const earningsJs=fs.readFileSync('command-center-earnings.js','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const covers=fs.readFileSync('command-center-book-covers.css','utf8');

assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'exact-menu stylesheet braces must balance');
assert.equal((earningsCss.match(/\{/g)||[]).length,(earningsCss.match(/\}/g)||[]).length,'earnings stylesheet braces must balance');
assert.ok(js.length>4000,'exact-menu controller unexpectedly small');
assert.ok(earningsJs.length>1000,'earnings controller unexpectedly small');
assert.match(cfg,/command-center-exact-menus\.css\?v=1/);
assert.match(cfg,/command-center-exact-menus\.js\?v=1/);
assert.match(cfg,/command-center-earnings\.css\?v=1/);
assert.match(cfg,/command-center-earnings\.js\?v=1/);
assert.ok(cfg.indexOf('command-center-exact-menus.css?v=1')>cfg.indexOf('command-center-v6-2.css?v=1'),'exact menu CSS must load after V6.2');
assert.ok(cfg.indexOf('command-center-exact-menus.js?v=1')>cfg.indexOf('command-center-v6-2.js?v=1'),'exact menu controller must load after V6.2');
assert.ok(cfg.indexOf('command-center-exact-menus.css?v=1')>cfg.indexOf('command-center-book-covers.css?v=2'),'exact menu CSS must load after book-cover layer');
assert.ok(cfg.indexOf('command-center-earnings.css?v=1')>cfg.indexOf('command-center-exact-menus.css?v=1'),'earnings CSS must load last');
assert.ok(cfg.indexOf('command-center-earnings.js?v=1')>cfg.indexOf('command-center-exact-menus.js?v=1'),'earnings controller must load last');
assert.match(html,/app-config\.js\?v=10/);
assert.match(sw,/james-command-center-v50/);
assert.ok(sw.includes("'./command-center-exact-menus.css?v=1'"));
assert.ok(sw.includes("'./command-center-exact-menus.js?v=1'"));
assert.ok(sw.includes("'./command-center-earnings.css?v=1'"));
assert.ok(sw.includes("'./command-center-earnings.js?v=1'"));
assert.match(sw,/pathname\.endsWith\('\/command-center-exact-menus\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/command-center-exact-menus\.css'\)/);
assert.match(sw,/pathname\.endsWith\('\/command-center-earnings\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/command-center-earnings\.css'\)/);

for(const view of ['all','active','attention']) assert.ok(css.includes(`data-cc6-under="${view}"`),`missing exact menu styling for ${view}`);
assert.match(css,/border:2px solid #ff5c00!important/,'menu cards must keep the thin orange frame');
assert.match(css,/background:linear-gradient\(90deg,#090705/,'menu cards must remain black/orange rather than blue');
assert.match(css,/\.cc-exact-menu-icon/,'left octagonal emblem must exist');
assert.match(css,/\.cc-exact-project-summary/,'Projects total summary must exist');
assert.match(css,/\.cc-exact-active-scope/,'Active / Live scope column must exist');
assert.match(css,/\.cc-exact-next-copy/,'Next Up next-action copy must exist');
assert.match(css,/\.cc-brain-roadmap/,'Command Center Brain roadmap styles must exist');
assert.match(css,/\.cc-brain-capabilities/,'Command Center Brain capability list must exist');

assert.match(js,/insertAdjacentHTML\('afterbegin', brainCardHtml\(\)\)/,'Command Center Brain must be inserted first in Next Up');
assert.match(js,/Command Center Brain/);
for(const capability of ['Project Brain','Automation','Integrations','Analytics','Security','Deployment','Agent Mode']) assert.ok(js.includes(capability),`missing Command Center Brain capability: ${capability}`);
for(const milestone of ['Durable Memory','Brainstorm Workspace','Context Builder','Task Queue / Planner','ChatGPT Handoff Loop']) assert.ok(js.includes(milestone),`missing Project Brain roadmap milestone: ${milestone}`);
assert.ok(js.includes('0% · Planned'),'unbuilt Command Center capability lanes must visibly remain 0% planned');
assert.match(js,/history\.pushState/,'Brain roadmap must participate in browser/Android history');
assert.match(js,/popstate/,'Brain roadmap must respond to Back navigation');

assert.match(js,/\.from\('metrics'\)\.select/,'Active / Live scope must read verified metrics rather than invent percentages');
assert.doesNotMatch(js,/\.insert\s*\(/,'exact menu layer must not write database rows');
assert.doesNotMatch(js,/\.update\s*\(/,'exact menu layer must not update database rows');
assert.doesNotMatch(js,/\.upsert\s*\(/,'exact menu layer must not upsert database rows');
assert.doesNotMatch(js,/\.delete\s*\(/,'exact menu layer must not delete database rows');
assert.match(js,/value_numeric/);
assert.match(js,/verified/);
assert.match(js,/scope === undefined \? 'N\/A'/,'unavailable scope must display N/A instead of an invented number');

assert.match(earningsCss,/min-height:256px!important/,'Project Earnings must be about twice normal tile height');
assert.match(earningsCss,/white-space:nowrap!important/,'Project Earnings title must stay on one line');
assert.match(earningsCss,/\.cc-earnings-cash-mark/,'Project Earnings must include a real-money visual');
assert.match(earningsJs,/Project Earnings/);
assert.match(earningsJs,/money \|\| 'N\/A'/,'unavailable revenue must show N/A rather than fabricated zero');
assert.match(earningsJs,/\^\\\$0\\\.00\\s\+tracked\$/,'legacy unintegrated $0.00 placeholder must be treated as unavailable, not verified revenue');
assert.match(earningsJs,/minimumFractionDigits:2,maximumFractionDigits:2/,'verified money, including zero, must render with two decimal places');
assert.match(earningsJs,/project.*earning verified revenue/,'verified project count remains visible');

assert.match(js,/icon=7-ui/);
assert.match(js,/icon=7-browser/);
assert.match(js,/icon=7-apple/);
assert.match(covers,/\.cc7-approved-cover:before\{[\s\S]*display:none!important;[\s\S]*content:none!important/,'redundant orange cover-number square must stay removed');

console.log('Exact Command Center menu, Brain roadmap, and Project Earnings QA passed.');
