import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../command-center-authoritative-runtime.css', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../command-center-authoritative-runtime.js', import.meta.url), 'utf8');
const truth = readFileSync(new URL('../command-center-agent-truth.js', import.meta.url), 'utf8');

assert.match(css, /grid-template-areas:\s*"main main"\s*"status ring"/, 'mobile project hero must stack safely inside the phone viewport');
assert.match(css, /\.cc-approved-project-hero>div\{[\s\S]*?max-width:none!important/, 'mobile project hero content must not keep the old 78% width constraint');
assert.doesNotMatch(css, /overflow-x\s*:\s*hidden/i, 'overflow must be fixed structurally, not hidden globally');
assert.match(css, /#ccApprovedApp\.cc-approved-book-project \.cc-approved-page-head/, 'remaining mobile containment must be scoped to book project detail pages');
assert.match(css, /contain:inline-size/, 'book detail panels must use structural inline-size containment');
assert.match(runtime, /cc-approved-book-project/, 'runtime must mark only book project detail pages for the narrow overflow repair');

assert.match(css, /\.cc-approved-revenue-item/, 'Revenue rows must use the finished Command Center card treatment');
assert.match(runtime, /cc-approved-revenue-emblem/, 'Revenue rows must receive the matching visual emblem');

assert.match(runtime, /data-cc-agent-checkpoint/, 'Project Checkpoint Agent control must exist');
assert.match(runtime, /Project Checkpoint/, 'Project Checkpoint must have a clear visible label');
assert.match(runtime, /Tell me where this project stands/, 'Project Checkpoint must explain its purpose in plain language');
assert.match(runtime, /p_allow_work:\s*false/, 'Project Checkpoint must never authorize Work');
assert.match(runtime, /p_books_target:\s*\/book\|kdp\|coloring\|workbook/i, 'Project Checkpoint must supply the required named target for book projects');
assert.match(runtime, /STATUS REVIEW ONLY/, 'Project Checkpoint must be explicitly status-only');
assert.match(runtime, /do not execute project work/i, 'Project Checkpoint must not continue project execution');
assert.doesNotMatch(runtime, /CHECKPOINT_TOOLS\s*=\s*\[[^\]]*'work'/, 'Project Checkpoint tool set must exclude Work');

assert.match(runtime, /command_center_agent_tool_health/, 'Agent starts must verify the live runner before creating work');
assert.match(runtime, /RUNNER_STALE_MS/, 'Agent runner health must expire instead of trusting a stale heartbeat forever');
assert.match(runtime, /Agent runner is not active right now\. No run was created\./, 'runner-off state must fail closed without creating a dead queued run');
assert.match(runtime, /data-cc-agent-stop/, 'Agent home must expose a manual Stop Agent control');
assert.match(runtime, /command_center_agent_cancel/, 'Stop Agent must use the durable Agent cancellation RPC');
assert.match(runtime, /Choose the project you want to stop first\./, 'Stop Agent must not guess when more than one live run exists');

assert.match(truth, /let state='Starting'/, 'a lone not-yet-running Agent request must be Starting, not Queued');
assert.match(truth, /const hasWorking=stats\.some\(s=>s\.state==='Working'\)/, 'queue classification must depend on a genuinely working run');
assert.match(truth, /if\(hasWorking\)[\s\S]*?s\.state==='Starting'\)s\.state='Queued'/, 'Queued must only be assigned behind real active work');
assert.match(truth, /s\.status==='running'&&s\.started_at/, 'Working must require a real running step with started_at');
assert.match(truth, /safePct/, 'Agent card must show one-decimal verified progress while work is active');

console.log('Owner mobile feedback regression QA passed.');
