import fs from 'node:fs';
import assert from 'node:assert/strict';

const guard=fs.readFileSync('command-center-approved-mount-guard.js','utf8');
const startup=fs.readFileSync('startup-loader.js','utf8');

assert.doesNotThrow(()=>new Function(guard),'mount guard must parse');
assert.doesNotThrow(()=>new Function(startup),'startup loader must parse');

for(const selector of [
  '.cc-screen-home-grid',
  '.cc-screen-project-list',
  '.cc-screen-next-list',
  '.cc-screen-active-list',
  '.cc-screen-project-hero',
  '.cc-approved-agent-home',
  '.cc-screen-revenue-hero'
]) assert.ok(guard.includes(selector),`mount guard must recognize rebuilt screen ${selector}`);

assert.match(guard,/function hasMountedScreen\(root\)/,'mount detection must be centralized');
assert.match(guard,/command-center:approved-rendered/,'successful rebuilt render must stop the watchdog');
assert.match(startup,/command-center-approved-mount-guard\.js\?v=2/,'startup must bypass the cached v1 mount guard');

console.log('rebuilt renderer mount guard QA passed');
