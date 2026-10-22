import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const dir='tests';
const stale=[];
for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.test.mjs')&&n!=='00-release-identity-consistency.test.mjs')){
  const text=fs.readFileSync(path.join(dir,name),'utf8');
  const hits=[];
  for(const old of [26,27,28,29]){
    if(text.includes(`app-config.js\\?v=${old}`)||text.includes(`app-config.js?v=${old}`))hits.push(`app-config v${old}`);
  }
  for(const old of [70,71,72,73]){
    if(text.includes(`james-command-center-v${old}`))hits.push(`PWA cache v${old}`);
  }
  if(hits.length)stale.push(`${name}: ${hits.join(', ')}`);
}
assert.deepEqual(stale,[],`Obsolete Command Center release pins remain:\n${stale.join('\n')}`);
const index=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
assert.match(index,/app-config\.js\?v=30/);
assert.match(index,/startup-loader\.js\?v=7/);
assert.match(sw,/james-command-center-v74/);
console.log('Release identity consistency QA passed: app-config v30 / startup v7 / PWA cache v74.');