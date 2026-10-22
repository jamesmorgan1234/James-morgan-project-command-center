import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync('source-health.js','utf8');
const sourceCss = fs.readFileSync('source-health.css','utf8');
const artCss = fs.readFileSync('command-center-artwork-polish.css','utf8');
const completion = fs.readFileSync('command-center-agent-mode-completion.js','utf8');

assert.match(source,/from\('project_sources'\)/,'Source Health must read exact project_sources rows');
assert.match(source,/chat_title,required,direct_required,handoff_fallback_allowed,content_fallback_allowed/,'Source Health must load fallback metadata');
assert.match(source,/Agent can recover/,'Source Health must identify Agent-recoverable checkpoints');
assert.match(source,/Needs You/,'Source Health must identify genuine user-only gaps');
assert.match(source,/Start Agent Mode on the affected project/,'Source Health must tell the user how to reconcile recoverable sources');
assert.match(sourceCss,/source-health-row\.can-recover/,'Recoverable sources need a distinct visual state');
assert.match(sourceCss,/source-health-row\.needs-you/,'Needs-You sources need a distinct visual state');

assert.match(completion,/command-center-artwork-polish\.css\?v=1/,'Final completion layer must load artwork polish');
assert.match(artCss,/\.stat-button\[data-view="all"\]/,'Projects home control needs dedicated artwork');
assert.match(artCss,/\.stat-button\[data-view="attention"\]/,'Next Up home control needs dedicated artwork');
assert.match(artCss,/#ccAgentHomeButton/,'Agent home control needs dedicated artwork');
assert.match(artCss,/\.btn\{/,'Deeper standard actions must keep Command Center artwork');
assert.match(artCss,/\.cc-project-detail-toggle/,'Project detail controls must be visually integrated');
assert.match(artCss,/\.cc-agent-actions \.btn/,'Agent actions must keep artwork/depth');
assert.doesNotMatch(artCss,/overflow-y\s*:\s*hidden/i,'Artwork polish must not disable vertical scrolling');
assert.doesNotMatch(artCss,/touch-action\s*:\s*none/i,'Artwork polish must not disable touch scrolling');

console.log('source sync + artwork polish QA passed');
