import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const css=await readFile(new URL('./home-books-refinement.css',import.meta.url),'utf8');
const uiFixCss=await readFile(new URL('./book-ui-fixes.css',import.meta.url),'utf8');
const js=await readFile(new URL('./home-books-refinement.js',import.meta.url),'utf8');
const phoneFix=await readFile(new URL('./phone-layout-cover-fix.js',import.meta.url),'utf8');
const data=await readFile(new URL('./data.js',import.meta.url),'utf8');
const root=await readFile(new URL('../index.html',import.meta.url),'utf8');
const isolated=await readFile(new URL('./index.html',import.meta.url),'utf8');
const rootSw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
const isolatedSw=await readFile(new URL('./service-worker.js',import.meta.url),'utf8');
const migration=await readFile(new URL('../supabase/migrations/20261023_individual_books_verified_scope_and_wording.sql',import.meta.url),'utf8');

test('Home tiles have one fallback footprint plus the final adaptive phone fitter',()=>{
  assert.match(css,/\.cc-agent-mode-card,\.cc-home-card,\.cc-module\{height:74px!important;min-height:74px!important;max-height:74px!important\}/);
  assert.match(uiFixCss,/\.cc-agent-mode-card,\.cc-home-card,\.cc-module\{[\s\S]*height:86px!important;[\s\S]*min-height:86px!important;[\s\S]*max-height:86px!important/);
  assert.match(css,/\.cc-agent-mode-grid,\.cc-home-grid,\.cc-module-grid\{gap:6px!important/);
  assert.match(phoneFix,/window\.visualViewport/);
  assert.match(phoneFix,/targetHomeBottom/);
  assert.match(phoneFix,/for\(let attempt=0;attempt<7;attempt\+=1\)/);
  assert.match(phoneFix,/void cards\[cards\.length-1\]\.offsetHeight/);
  assert.match(phoneFix,/Math\.max\(50,Math\.min\(108/);
});

test('all Home control families carry V7 atmospheric graphics',()=>{
  for(const asset of ['neural-globe.svg','road-mountains.svg','server-racks.svg','network-globe.svg','analytics-grid.svg','city-spires.svg','landscape-eclipse.svg','mobile-horizon.svg'])assert.ok(css.includes(asset),`missing Home artwork ${asset}`);
  for(const route of ['brain','automation','integrations','analytics','security','deployment','active','about'])assert.ok(css.includes(`[data-nav="${route}"]`),`missing module art route ${route}`);
});

test('only true series or collections have grouped cover manifests',()=>{
  for(const id of ['kdp-melted-cosmos','kdp-drowned-crown','kdp-glasswing-pier','kdp-unfired-world'])assert.ok(js.includes(`'${id}'`),`missing ${id}`);
  assert.doesNotMatch(js,/'kdp-workbooks'\s*:/);
  assert.doesNotMatch(js,/'kdp-standalones'\s*:/);
});

test('approved cover atlas resolves module-relatively and final guard uses the same protected atlas',()=>{
  assert.match(js,/new URL\('\.\/assets\/book-cover-atlas-v2\.webp',import\.meta\.url\)\.href/);
  assert.match(js,/background-image:url\('\$\{esc\(approvedAtlasUrl\)\}'\)/);
  assert.match(phoneFix,/new URL\('\.\/assets\/book-cover-atlas-v2\.webp',import\.meta\.url\)\.href/);
  assert.match(phoneFix,/\.cc-v7-approved-cover:not\(\.is-missing\)/);
  assert.doesNotMatch(js,/background-image:url\('\.\/assets\/book-cover-atlas-v2\.webp'\)/);
});

test('individual workbooks and standalone books auto-lock their own Agent target',()=>{
  assert.match(js,/independent workbook project/);
  assert.match(js,/independent standalone book project/);
  assert.match(js,/booksTarget:project\.name/);
});

test('Individual Books wording and verified inherited scope are source controlled',()=>{
  assert.match(migration,/Individual Books organizational umbrella/);
  assert.match(migration,/not a series, collection, or bundle/);
  assert.match(migration,/current_scope_progress_percent/);
  assert.match(migration,/66\.6/);
  assert.match(migration,/'completed_weight',2/);
  assert.match(migration,/'total_weight',3/);
});

test('filing-only umbrella rows are excluded from loaded projects',()=>{
  assert.match(data,/!String\(p\.source_status \|\| ''\)\.startsWith\('filing_only_hidden'\)/);
});

test('Missing Hour approved benchmark is not replaced',()=>{
  assert.match(js,/project\.id==='kdp-missing-hour'\)return/);
});

test('Drowned Crown can render owner-locked approved covers without fabricated status',()=>{
  assert.match(js,/projectId==='kdp-drowned-crown'\)rows\.push\(\{title,owner_locked_cover:true\}\)/);
  assert.doesNotMatch(js,/owner_locked_cover:true[^\n]+publication_status/);
});

test('both V7 entrypoints load v2 book renderer first and final repair afterward',()=>{
  for(const text of [root,isolated]){
    assert.match(text,/home-books-refinement\.css\?v=1/);
    assert.match(text,/home-books-refinement\.js\?v=2/);
    assert.match(text,/phone-layout-cover-fix\.js\?v=1/);
    assert.match(text,/cc7-startup-inline-recovery-v2/);
    assert.ok(text.indexOf('home-books-refinement.js?v=2')<text.indexOf('phone-layout-cover-fix.js?v=1'));
  }
  assert.match(rootSw,/command-center-v7-root-8/);
  assert.match(isolatedSw,/command-center-v7-clean-12/);
  for(const text of [rootSw,isolatedSw]){
    assert.match(text,/home-books-refinement\.js\?v=2/);
    assert.match(text,/phone-layout-cover-fix\.js\?v=1/);
    assert.match(text,/startup-recovery\.js\?v=1/);
    assert.match(text,/supabase-loader\.js\?v=1/);
    assert.match(text,/book-cover-atlas-v2\.webp/);
  }
});
