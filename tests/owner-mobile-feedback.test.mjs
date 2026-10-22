import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../command-center-authoritative-runtime.css', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('../command-center-authoritative-runtime.js', import.meta.url), 'utf8');

assert.match(css, /grid-template-areas:\s*"main main"\s*"status ring"/, 'mobile project hero must stack safely inside the phone viewport');
assert.match(css, /\.cc-approved-project-hero>div\{[\s\S]*?max-width:none!important/, 'mobile project hero content must not keep the old 78% width constraint');
assert.doesNotMatch(css, /overflow-x\s*:\s*hidden/i, 'overflow must be fixed structurally, not hidden globally');

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

console.log('Owner mobile feedback regression QA passed.');
