import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const js=await readFile(new URL('./refinement.js',import.meta.url),'utf8');
const css=await readFile(new URL('./refinement.css',import.meta.url),'utf8');
const rootHtml=await readFile(new URL('../index.html',import.meta.url),'utf8');
const isolatedHtml=await readFile(new URL('./index.html',import.meta.url),'utf8');
const rootSw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
const isolatedSw=await readFile(new URL('./service-worker.js',import.meta.url),'utf8');

for(const [name,html] of [['root',rootHtml],['isolated',isolatedHtml]]){
  test(`${name} shell loads V7 refinement layer`,()=>{
    assert.match(html,/refinement\.css\?v=1/);
    assert.match(html,/refinement\.js\?v=1/);
  });
}

test('Home Agent modes are mutually exclusive backend controls',()=>{
  assert.match(js,/cc7_agent_owner_set_auto/);
  assert.match(js,/cc7_agent_owner_set_boundary_sweep/);
  assert.match(js,/Agent Auto/);
  assert.match(js,/To Work Barriers/);
  assert.match(js,/Sequential: one project at a time/);
});

test('Home Agent progress fails truthful when denominator is unavailable',()=>{
  assert.match(js,/if\(!tasks\.length\)return null/);
  assert.match(js,/N\/A run progress/);
  assert.match(js,/verified\/tasks\.length/);
});

test('global refresh preserves route and scroll before reloading state',()=>{
  assert.match(js,/REFRESH_SCROLL_KEY/);
  assert.match(js,/location\.pathname/);
  assert.match(js,/window\.scrollY/);
  assert.match(js,/location\.reload\(\)/);
  assert.match(js,/window\.scrollTo/);
});

test('manual Work retry is bounded to approved Luna High and Sol Light rungs',()=>{
  assert.match(js,/Retry Luna High/);
  assert.match(js,/Retry Sol Light/);
  assert.doesNotMatch(js,/Retry Sol Medium/);
  assert.match(js,/cc7_agent_owner_retry_work_rung/);
  assert.match(js,/reconcile downstream state/);
});

test('approved Missing Hour atlas is unobstructed and uses locked slots 23 through 27',()=>{
  assert.match(css,/book-cover-atlas-v2\.webp/);
  for(const position of ['57.5%','60%','62.5%','65%','67.5%'])assert.ok(css.includes(position),`missing atlas position ${position}`);
  assert.match(css,/\.cc-book-num\{display:none!important\}/);
  for(let i=1;i<=5;i++)assert.ok(css.includes(`content:'BOOK ${i}'`),`missing external BOOK ${i} label`);
});

test('service workers cache refinement and approved atlas with new generations',()=>{
  assert.match(rootSw,/command-center-v7-root-3/);
  assert.match(isolatedSw,/command-center-v7-clean-8/);
  for(const asset of ['refinement.css?v=1','refinement.js?v=1','book-cover-atlas-v2.webp']){
    assert.ok(rootSw.includes(asset),`root service worker missing ${asset}`);
    assert.ok(isolatedSw.includes(asset),`isolated service worker missing ${asset}`);
  }
});
