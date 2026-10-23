import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const rootHtml=await readFile(new URL('../index.html',import.meta.url),'utf8');
const isolatedHtml=await readFile(new URL('./index.html',import.meta.url),'utf8');
const rootManifest=JSON.parse(await readFile(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
const rootSw=await readFile(new URL('../service-worker.js',import.meta.url),'utf8');
const rootPwa=await readFile(new URL('./root-pwa.js',import.meta.url),'utf8');
const feedback=await readFile(new URL('./interaction-feedback.js',import.meta.url),'utf8');

const forbiddenRootRuntime=[
  'app-config.js','startup-loader.js','../app.js','styles.css?v=',
  'command-center-v4','command-center-v5','command-center-v6',
  'command-center-approved-ui','command-center-approved-nav',
  'command-center-authoritative-runtime','command-center-agent-mode.js'
];

test('production root shell is clean V7 only',()=>{
  assert.match(rootHtml,/data-command-center-runtime="v7-clean"/);
  assert.match(rootHtml,/\.\/authoritative-v7\/interaction-feedback\.js\?v=1/);
  assert.match(rootHtml,/\.\/authoritative-v7\/app\.js\?v=4/);
  assert.match(rootHtml,/\.\/authoritative-v7\/refinement\.js\?v=1/);
  assert.match(rootHtml,/\.\/authoritative-v7\/refinement\.css\?v=1/);
  assert.match(rootHtml,/\.\/authoritative-v7\/book-ui-fixes\.js\?v=1/);
  assert.match(rootHtml,/\.\/authoritative-v7\/book-ui-fixes\.css\?v=1/);
  assert.match(rootHtml,/\.\/authoritative-v7\/home-books-refinement\.js\?v=2/);
  assert.match(rootHtml,/\.\/authoritative-v7\/home-books-refinement\.css\?v=1/);
  assert.match(rootHtml,/\.\/authoritative-v7\/phone-layout-cover-fix\.js\?v=1/);
  assert.match(rootHtml,/\.\/authoritative-v7\/root-pwa\.js\?v=1/);
  assert.ok(rootHtml.indexOf('home-books-refinement.js?v=2')<rootHtml.indexOf('phone-layout-cover-fix.js?v=1'));
  for(const ref of forbiddenRootRuntime)assert.equal(rootHtml.includes(ref),false,`legacy root runtime reference found: ${ref}`);
});

test('V7 shells honor the HTML hidden state over component display rules',()=>{
  for(const html of [rootHtml,isolatedHtml]){
    assert.match(html,/\[hidden\]\{display:none!important\}/);
    assert.match(html,/id="ccBoot" class="cc-boot"/);
    assert.match(html,/id="ccApp" class="cc-app" hidden/);
    assert.match(html,/cc7-startup-inline-recovery-v2/);
    assert.match(html,/Recovering Command Center…/);
  }
});

test('root manifest is clean standalone V7 identity',()=>{
  assert.equal(rootManifest.id,'./');
  assert.equal(rootManifest.start_url,'./');
  assert.equal(rootManifest.scope,'./');
  assert.equal(rootManifest.display,'standalone');
  assert.equal(rootManifest.background_color,'#000000');
  assert.equal(rootManifest.theme_color,'#000000');
  assert.ok(rootManifest.icons.some(i=>i.sizes==='192x192'&&i.src.includes('command-center-approved-icon-192.png?cc7-root=2')));
  assert.ok(rootManifest.icons.some(i=>i.sizes==='512x512'&&i.purpose==='any'&&i.src.includes('command-center-approved-icon-512.png?cc7-root=2')));
  assert.ok(rootManifest.icons.some(i=>i.sizes==='512x512'&&i.purpose==='maskable'&&i.src.includes('cc7-root=2-maskable')));
});

test('root service worker takes over old caches and caches only V7 runtime',()=>{
  assert.match(rootSw,/command-center-v7-root-8/);
  assert.match(rootSw,/key\.startsWith\('james-command-center-'\)/);
  assert.match(rootSw,/key\.startsWith\('command-center-v7-clean-'\)/);
  assert.match(rootSw,/key\.startsWith\('command-center-v7-root-'\)/);
  for(const asset of [
    './authoritative-v7/interaction-feedback.js?v=1',
    './authoritative-v7/app.js?v=4',
    './authoritative-v7/refinement.js?v=1',
    './authoritative-v7/refinement.css?v=1',
    './authoritative-v7/book-ui-fixes.js?v=1',
    './authoritative-v7/book-ui-fixes.css?v=1',
    './authoritative-v7/publication-truth.js',
    './authoritative-v7/agent-execution.js',
    './authoritative-v7/home-books-refinement.js?v=2',
    './authoritative-v7/home-books-refinement.css?v=1',
    './authoritative-v7/phone-layout-cover-fix.js?v=1',
    './authoritative-v7/startup-recovery.js?v=1',
    './authoritative-v7/supabase-loader.js?v=1',
    './authoritative-v7/data.js',
    './authoritative-v7/control-modules.js',
    './authoritative-v7/overview-screens.js',
    './authoritative-v7/root-pwa.js?v=1',
    './authoritative-v7/offline.html',
    './authoritative-v7/assets/book-cover-atlas-v2.webp'
  ])assert.ok(rootSw.includes(asset),`missing root V7 cache asset: ${asset}`);
  for(const ref of ['app-config.js','startup-loader.js','command-center-v4.js','command-center-v6.js','command-center-agent-mode.js'])assert.equal(rootSw.includes(ref),false,`legacy asset cached by root V7 service worker: ${ref}`);
});

test('root PWA owns root-scoped worker and manual scroll restoration',()=>{
  assert.match(rootPwa,/history\.scrollRestoration='manual'/);
  assert.match(rootPwa,/register\('\.\/service-worker\.js',\{scope:'\.\/'/);
  assert.match(rootPwa,/updateViaCache:'none'/);
});

test('owner actions show immediate visible feedback',()=>{
  assert.match(feedback,/data-agent-create="project_checkpoint"/);
  assert.match(feedback,/Checking…/);
  assert.match(feedback,/aria-busy/);
  assert.match(feedback,/button\.disabled=true/);
  assert.match(feedback,/RESTORE_MS=30000/);
  for(const label of ['Refreshing…','Pausing…','Resuming…','Stopping…'])assert.ok(feedback.includes(label),`missing owner feedback label: ${label}`);
});
