import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const app=await readFile(new URL('./app.js',import.meta.url),'utf8');
const js=await readFile(new URL('./refinement.js',import.meta.url),'utf8');
const css=await readFile(new URL('./refinement.css',import.meta.url),'utf8');
const rootHtml=await readFile(new URL('../index.html',import.meta.url),'utf8');
const isolatedHtml=await readFile(new URL('./index.html',import.meta.url),'utf8');
const visualFixture=await readFile(new URL('./visual-fixture.html',import.meta.url),'utf8');
const visualFixtureJs=await readFile(new URL('./visual-fixture.js',import.meta.url),'utf8');
const rootSw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
const isolatedSw=await readFile(new URL('./service-worker.js',import.meta.url),'utf8');
const roadmap=await readFile(new URL('../COMMAND_CENTER_PRODUCT_ROADMAP.md',import.meta.url),'utf8');
const rpcGrantMigration=await readFile(new URL('../supabase/migrations/20261023012400_cc7_agent_restrict_new_owner_rpcs.sql',import.meta.url),'utf8');

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

test('global refresh uses the in-app clean V7 state path and preserves scroll',()=>{
  assert.match(js,/CustomEvent\('cc7:global-refresh'\)/);
  assert.doesNotMatch(js,/location\.reload\(\)/);
  assert.doesNotMatch(js,/REFRESH_SCROLL_KEY/);
  assert.match(app,/addEventListener\('cc7:global-refresh'/);
  assert.match(app,/const refreshScrollY=window\.scrollY/);
  assert.match(app,/routeUrl\(state\.route\)===refreshRoute/);
  assert.match(app,/window\.scrollTo\(\{top:refreshScrollY,behavior:'instant'\}\)/);
});

test('refinement observer is idempotent instead of rewriting identical markup forever',()=>{
  assert.match(js,/if\(modeGrid\.innerHTML!==modeMarkup\)modeGrid\.innerHTML=modeMarkup/);
  assert.match(js,/if\(retry\.innerHTML!==retryMarkup\)retry\.innerHTML=retryMarkup/);
  assert.match(js,/enhancementQueued/);
  assert.match(js,/queueMicrotask/);
});

test('manual Work retry is bounded to approved Luna High and Sol Light rungs',()=>{
  assert.match(js,/Retry Luna High/);
  assert.match(js,/Retry Sol Light/);
  assert.doesNotMatch(js,/Retry Sol Medium/);
  assert.match(js,/cc7_agent_owner_retry_work_rung/);
  assert.match(js,/reconcile downstream state/);
});

test('approved Missing Hour atlas is truly unobstructed and uses locked slots 23 through 27',()=>{
  assert.match(css,/book-cover-atlas-v2\.webp/);
  for(const position of ['57.5%','60%','62.5%','65%','67.5%'])assert.ok(css.includes(position),`missing atlas position ${position}`);
  assert.match(css,/\.cc-covers \.cc-book \.cc-cover:before,\.cc-covers \.cc-book \.cc-cover:after\{display:none!important;content:none!important\}/);
  assert.match(css,/\.cc-book-num\{display:none!important\}/);
  for(let i=1;i<=5;i++)assert.ok(css.includes(`content:'BOOK ${i}'`),`missing external BOOK ${i} label`);
});

test('visual QA fixture uses exact Missing Hour titles and the same refinement styling',()=>{
  assert.match(visualFixture,/refinement\.css\?v=1/);
  for(const title of ['The Unlived Hour','The Dead Between Minutes','The House Outside Time','What the Town Forgot','The Hour That Remains']){
    assert.ok(visualFixtureJs.includes(title),`visual fixture missing exact approved title: ${title}`);
  }
  for(const stale of ['The Echo Reckoning','The Fractured Tomorrow','The Last Convergence','The Infinite Return']){
    assert.equal(visualFixtureJs.includes(stale),false,`stale sample title remains: ${stale}`);
  }
});

test('authoritative roadmap matches the locked two-mode and Work-ladder contract',()=>{
  for(const text of [
    'Agent Auto',
    'To Work Barriers',
    'mutually exclusive',
    'One project executes at a time',
    'Retry Luna High',
    'Retry Sol Light',
    'Sol Medium never auto-starts',
    'If the denominator is not trustworthy',
    'completely unobstructed',
    'medium difficulty',
    'first approved cookbook is the locked layout benchmark'
  ])assert.ok(roadmap.includes(text),`roadmap missing locked requirement: ${text}`);
  assert.equal(roadmap.includes('numbered corner badges'),false,'stale cover-overlay rule remains in roadmap');
});

test('new owner RPCs are not granted to anonymous callers',()=>{
  for(const fn of ['cc7_agent_owner_set_boundary_sweep(boolean)','cc7_agent_owner_retry_work_rung(uuid,text)']){
    assert.ok(rpcGrantMigration.includes('from public'));
    assert.ok(rpcGrantMigration.includes('from anon'));
    assert.ok(rpcGrantMigration.includes('to authenticated'));
    assert.ok(rpcGrantMigration.includes(fn),`missing grant restriction for ${fn}`);
  }
});

test('service workers cache refinement, final phone repair, and approved atlas with restored startup generations',()=>{
  assert.match(rootSw,/command-center-v7-root-10/);
  assert.match(isolatedSw,/command-center-v7-clean-14/);
  for(const asset of ['refinement.css?v=1','refinement.js?v=1','home-books-refinement.css?v=1','home-books-refinement.js?v=2','phone-layout-cover-fix.js?v=1','book-cover-atlas-v2.webp']){
    assert.ok(rootSw.includes(asset),`root service worker missing ${asset}`);
    assert.ok(isolatedSw.includes(asset),`isolated service worker missing ${asset}`);
  }
  for(const removed of ['startup-recovery.js?v=1','supabase-loader.js?v=1']){
    assert.equal(rootSw.includes(removed),false,`root service worker still caches ${removed}`);
    assert.equal(isolatedSw.includes(removed),false,`isolated service worker still caches ${removed}`);
  }
  for(const asset of ['book-ui-fixes.css?v=1','book-ui-fixes.js?v=1','publication-truth.js','agent-execution.js']){
    assert.ok(rootSw.includes(asset),`root service worker missing ${asset}`);
  }
});
