import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const v6Css = readFileSync(new URL('../command-center-v6.css', import.meta.url), 'utf8');
const v62Css = readFileSync(new URL('../command-center-v6-2.css', import.meta.url), 'utf8');
const mobile = readFileSync(new URL('../mobile-accordion-polish.js', import.meta.url), 'utf8');
const sixModes = readFileSync(new URL('../command-center-agent-six-modes-v6.js', import.meta.url), 'utf8');
const agentHome = readFileSync(new URL('../command-center-agent-home.js', import.meta.url), 'utf8');
const coversCss = readFileSync(new URL('../command-center-book-covers.css', import.meta.url), 'utf8');

assert.match(v6Css,/\.hub-project-card\{[\s\S]*min-height:126px!important/,'project rows must remain compact on the phone');
assert.doesNotMatch(v6Css,/overflow-y\s*:\s*hidden/i,'overflow must be fixed structurally, not by disabling vertical scrolling');
assert.doesNotMatch(v6Css,/touch-action\s*:\s*none/i,'native touch panning must remain available');
assert.match(v62Css,/#bookRevenuePanel \.book-revenue-primary\{[\s\S]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/,'book KDP performance must remain three across');
assert.match(v62Css,/\.cc62-books-strip\{[\s\S]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/,'all five series books must fit across');
assert.match(v62Css,/\.cc62-publication-status \.ccv4-pub-formats\{[\s\S]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)!important/,'publication formats must remain four across');
assert.match(coversCss,/\.cc7-approved-cover:before\{[\s\S]*display:none!important;[\s\S]*content:none!important/,'number badges must not cover approved cover art');

assert.match(mobile,/history\.pushState/,'opening deeper app state must create history');
assert.match(mobile,/history\.back\(\)/,'physical/browser Back must return deepest-first');
assert.match(mobile,/history\.scrollRestoration = 'manual'/,'scroll restoration must remain deterministic');
assert.match(mobile,/saveCurrentScroll/,'current scroll must be saved before deeper navigation');
assert.match(mobile,/window\.scrollTo\(/,'saved scroll position must restore on return');

assert.match(sixModes,/data-v6-agent-mode="checkpoint"/,'Project Checkpoint control must exist');
assert.match(sixModes,/Project Checkpoint/,'Project Checkpoint must have a clear visible label');
assert.match(sixModes,/Tell me where this project stands/,'Project Checkpoint must explain its purpose in plain language');
assert.match(sixModes,/p_allow_work:!checkpoint&&mode!=='until-work'/,'Project Checkpoint and Until Work must not authorize Work execution');
assert.match(sixModes,/p_books_target:\/book\|kdp\|coloring\|workbook/i,'book Agent requests must carry their explicit book target');
assert.match(sixModes,/STATUS REVIEW ONLY/,'Project Checkpoint must be status-only');
assert.match(sixModes,/Do not execute project work/i,'Project Checkpoint must not continue project execution');
assert.doesNotMatch(sixModes,/CHECKPOINT_TOOLS=\[[^\]]*'work'/,'Project Checkpoint tool set must exclude Work');

assert.match(sixModes,/command_center_agent_tool_health/,'Agent starts must verify the runner before creating work');
assert.match(sixModes,/STALE=90\*60\*1000/,'runner health must expire rather than trusting a stale heartbeat');
assert.match(sixModes,/Agent runner is not active right now\. No run was created\./,'runner-off state must fail closed');
assert.match(sixModes,/data-v6-agent-stop/,'Agent controls must expose Stop Agent');
assert.match(sixModes,/command_center_agent_cancel/,'Stop Agent must use durable cancellation');

assert.match(agentHome,/s\.status==='draft'\)\{val\.textContent='Starting'/,'not-yet-planned Agent request must be Starting, not fake 0.0%');
assert.match(agentHome,/pct===null\?'Working':`Working • \$\{pct\.toFixed\(1\)\}%`/,'working state must show verified percentage when a plan exists');
assert.match(agentHome,/verified\/total/,'Agent percentage must derive from verified completed steps over total planned steps');
assert.match(agentHome,/val\.textContent='Paused'/,'Paused must display truthfully');
assert.match(agentHome,/val\.textContent='Blocked'/,'Blocked must display truthfully');
assert.match(agentHome,/val\.textContent='Needs You'/,'Needs You must display truthfully');

console.log('Owner mobile feedback regression QA passed on restored V6 interface.');
