import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const loader=fs.readFileSync('startup-loader.js','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

assert.doesNotThrow(()=>new Function(loader));
assert.doesNotThrow(()=>new Function(cfg));
const inlineScripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.ok(inlineScripts.length>=1,'startup bootstrap must be inline');
for(const code of inlineScripts)assert.doesNotThrow(()=>new Function(code));

assert.match(html,/__COMMAND_CENTER_BOOTSTRAP_STARTED=true/);
assert.match(html,/loadLocal\('\.\/app-config\.js\?v=30',6000\)/);
assert.match(html,/loadLocal\('\.\/startup-loader\.js\?v=7',6000\)/);
assert.ok(html.indexOf('./app-config.js?v=30')<html.indexOf('./startup-loader.js?v=7'));
assert.match(html,/cc-startup-repair-attempted-v65/);
assert.match(html,/project-hub\.css\?v=2/,'restored project-hub CSS must preload');
assert.match(html,/mobile-accordion-polish\.css\?v=4/,'restored mobile deep-menu CSS must preload');
assert.match(html,/navigator\.serviceWorker\.getRegistrations\(\)/);
assert.match(html,/key\.startsWith\('james-command-center-'\)/);
assert.match(html,/Repair and reload Command Center/);
assert.doesNotMatch(html,/<script[^>]+src="https:\/\//i,'external runtime scripts must not bypass the controlled loader');

assert.match(loader,/__COMMAND_CENTER_STARTUP_RUNTIME_ACTIVE/);
assert.match(loader,/SUPABASE_SOURCES = \[[\s\S]*cdn\.jsdelivr\.net[\s\S]*unpkg\.com/);
assert.match(loader,/window\.COMMAND_CENTER_SUPABASE = client/);
assert.match(loader,/primaryClientCreated && window\.COMMAND_CENTER_SUPABASE/);
const coreScripts=loader.match(/const CORE_SCRIPTS = \[([^\]]*)\]/s)?.[1]||'';
assert.match(coreScripts,/app\.js\?v=10/);
assert.match(coreScripts,/project-hub\.js\?v=3/,'original project hub must own normal project rendering');
assert.match(coreScripts,/mobile-accordion-polish\.js\?v=3/,'mobile deep-menu behavior must be part of normal startup');
assert.doesNotMatch(coreScripts,/command-center-approved-mount-guard|command-center-locked-visual-spec-loader/,'stripped renderer recovery layer must not own normal startup');
assert.match(loader,/await window\.COMMAND_CENTER_LOAD_ENHANCEMENTS\?\.\(\)/);
assert.match(loader,/navigator\.serviceWorker\.register\('\.\/service-worker\.js',\{updateViaCache:'none'\}\)/);
assert.match(loader,/cc-sw-v74-reloaded/);

assert.match(cfg,/window\.COMMAND_CENTER_LOAD_ENHANCEMENTS = \(\) =>/);
assert.match(cfg,/window\.COMMAND_CENTER_LOAD_ADVANCED = \(\) => window\.COMMAND_CENTER_LOAD_ENHANCEMENTS\(\)/);
assert.doesNotMatch(cfg,/window\.addEventListener\('load'/);
assert.match(cfg,/script\.async = false|script\.async=false/);
for(const asset of [
  'project-hub.css?v=2','mobile-accordion-polish.css?v=4',
  'command-center-v6.css?v=1','command-center-v6.js?v=1',
  'command-center-v6-2.css?v=1','command-center-v6-2.js?v=1',
  'command-center-exact-menus.css?v=1','command-center-exact-menus.js?v=1',
  'command-center-brain-home.js?v=5','command-center-agent-home.js?v=1',
  'command-center-agent-mode.js?v=1','command-center-agent-six-modes-v6.js?v=1',
  'command-center-book-review-ui-v5.js?v=1','command-center-work-approval-ui-v3.js?v=1',
  'command-center-integrations.js?v=1','command-center-analytics.js?v=1','command-center-security.js?v=1','command-center-deployment.js?v=1'
])assert.ok(cfg.includes(asset),`restored normal startup missing ${asset}`);
for(const forbidden of ['command-center-approved-ui.js','command-center-authoritative-runtime.js','command-center-agent-truth.js','command-center-locked-visual-spec-loader.js'])assert.ok(!cfg.includes(forbidden),`stripped renderer layer must not replace restored interface: ${forbidden}`);

assert.match(sw,/james-command-center-v74/);
for(const asset of [
  "'./startup-loader.js?v=7'","'./app-config.js?v=30'",
  "'./project-hub.js?v=3'","'./command-center-v6.js?v=1'","'./command-center-v6-2.js?v=1'",
  "'./command-center-exact-menus.js?v=1'","'./command-center-agent-six-modes-v6.js?v=1'",
  "'./command-center-agent-six-modes-v6.css?v=1'","'./command-center-approved-icon-512.png?icon=9-approved-any'"
])assert.ok(sw.includes(asset),`PWA static release missing ${asset}`);
assert.match(sw,/Promise\.allSettled\(STATIC\.map\(asset=>cache\.add\(asset\)\)\)/);
assert.match(sw,/fetchWithTimeout\(e\.request,3500\)/);
assert.match(sw,/fetch\(e\.request,\{cache:'no-store'\}\)/,'fresh same-origin code must prefer network before cache fallback');
const install=sw.slice(sw.indexOf("self.addEventListener('install'"),sw.indexOf("self.addEventListener('activate'"));
assert.doesNotMatch(install,/fetch\s*\(/,'service worker install should not couple activation to live fetch completion');

console.log('Self-healing first-launch + v74 PWA takeover + restored full V6 interface boot QA passed.');