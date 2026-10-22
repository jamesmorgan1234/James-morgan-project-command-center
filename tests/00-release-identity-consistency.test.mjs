import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const dir='tests';
const stale=[];
for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.test.mjs')&&n!=='00-release-identity-consistency.test.mjs')){
  const text=fs.readFileSync(path.join(dir,name),'utf8');
  const hits=[];
  for(const old of [26,27]){
    if(text.includes(`app-config.js\\?v=${old}`)||text.includes(`app-config.js?v=${old}`))hits.push(`app-config v${old}`);
  }
  if(text.includes('james-command-center-v70'))hits.push('PWA cache v70');
  if(hits.length)stale.push(`${name}: ${hits.join(', ')}`);
}
assert.deepEqual(stale,[],`Obsolete Command Center release pins remain:\n${stale.join('\n')}`);
console.log('Release identity consistency QA passed: tests align on app-config v28 / PWA cache v71.');
