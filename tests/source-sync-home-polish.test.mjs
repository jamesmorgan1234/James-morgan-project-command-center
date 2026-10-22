import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('source-health.js','utf8');
const sourceCss = fs.readFileSync('source-health.css','utf8');
const v6Art = fs.readFileSync('command-center-v6-art.css','utf8');
const completion = fs.readFileSync('command-center-agent-mode-completion.js','utf8');

assert.match(source,/from\('project_sources'\)/,'Source Health must read exact project_sources rows');
assert.match(source,/chat_title,required,direct_required,handoff_fallback_allowed,content_fallback_allowed/,'Source Health must load fallback metadata');
assert.match(source,/Agent can recover/,'Source Health must identify Agent-recoverable checkpoints');
assert.match(source,/Needs You/,'Source Health must identify genuine user-only gaps');
assert.match(source,/Recover with Agent/,'Source Health must offer direct one-tap Agent recovery');
assert.match(source,/command_center_agent_create_project_only_session/,'Source Health recovery must create a real project-locked Agent session');
assert.match(source,/Agent is already working on this project/,'Source Health must avoid competing Agent runs on the same project');
assert.match(sourceCss,/source-health-row\.can-recover/,'Recoverable sources need a distinct visual state');
assert.match(sourceCss,/source-health-row\.needs-you/,'Needs-You sources need a distinct visual state');
assert.match(sourceCss,/source-health-recover-btn\{[^}]*min-height:48px/s,'Recover control must use a phone-size touch target');

for(const forbidden of ['command-center-artwork-polish.css','command-center-approved-ui.css','command-center-mobile-first.css'])assert.ok(!completion.includes(forbidden),`Agent completion layer must not reintroduce discarded visual layer ${forbidden}`);
assert.match(v6Art,/\.stat-button\[data-view="all"\]/,'Projects home control needs dedicated V6 artwork');
assert.match(v6Art,/\.stat-button\[data-view="active"\]/,'Active home control needs dedicated V6 artwork');
assert.match(v6Art,/\.stat-button\[data-view="attention"\]/,'Next Up home control needs dedicated V6 artwork');
assert.match(v6Art,/\.hub-project-card\[data-open\^="kdp-"\]/,'Book project cards need dedicated V6 artwork');
assert.doesNotMatch(v6Art,/overflow-y\s*:\s*hidden/i,'V6 artwork must not disable vertical scrolling');
assert.doesNotMatch(v6Art,/touch-action\s*:\s*none/i,'V6 artwork must not disable touch scrolling');

console.log('source sync + single-owner V6 artwork QA passed');
