import fs from 'node:fs';
import assert from 'node:assert/strict';

const guard=fs.readFileSync('command-center-approved-mount-guard.js','utf8');
assert.match(guard,/if \(hasMountedScreen\(root\) && !force\) return true/,'watchdog must accept an already-mounted rebuilt screen');
assert.match(guard,/const mounted = hasMountedScreen\(root\)/,'retry must use the same rebuilt screen detector');
assert.doesNotMatch(guard,/const realContent = root\.querySelector/,'stale legacy-only mount selector must be removed');
console.log('rebuilt mount guard retry sanity QA passed');
