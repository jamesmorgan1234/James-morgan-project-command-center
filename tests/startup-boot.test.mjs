import fs from 'node:fs';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const loader=fs.readFileSync('startup-loader.js','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');

assert.doesNotThrow(()=>new Function(loader),'startup loader must parse as JavaScript');
assert.doesNotThrow(()=>new Function(cfg),'app config must parse as JavaScript');

// The document itself must never wait on an external runtime before first paint.
assert.match(html,/script defer src="\.\/app-config\.js\?v=13"/,'local config must load directly from the app origin');
assert.match(html,/script defer src="\.\/startup-loader\.js\?v=1"/,'local startup loader must own boot');
assert.ok(html.indexOf('./app-config.js?v=13') < html.indexOf('./startup-loader.js?v=1'),'config must exist before the startup controller runs');
assert.doesNotMatch(html,/<script[^>]+src="https:\/\//i,'index.html must not block first paint on any external script');
assert.doesNotMatch(html,/<script[^>]+src="\.\/app\.js/i,'core app must be loaded by the resilient startup controller');
assert.doesNotMatch(html,/<script[^>]+src="\.\/project-hub\.js/i,'project hub must wait for secure core startup');

// The shell must become drawable before remote Supabase loading begins.
assert.match(loader,/revealShell\(\);\s*if \('serviceWorker' in navigator\)/,'local shell must be revealed before secure startup work');
assert.match(loader,/SUPABASE_SOURCES = \[[\s\S]*cdn\.jsdelivr\.net[\s\S]*unpkg\.com/,'startup must have two pinned Supabase delivery paths');
assert.match(loader,/loadScript\(src, 5500\)/,'each remote startup attempt must have a bounded timeout');
assert.match(loader,/Retry secure startup/,'a failed remote startup must expose a visible retry instead of an infinite splash');
assert.match(loader,/window\.COMMAND_CENTER_SUPABASE = client/,'the first authenticated client must remain the canonical shared client');
assert.match(loader,/for \(const src of CORE_SCRIPTS\) await loadScript/,'core controllers must load in order');
assert.match(loader,/window\.COMMAND_CENTER_LOAD_ENHANCEMENTS\?\.\(\)/,'enhancements must start only after core controllers are loaded');
assert.match(loader,/navigator\.serviceWorker\.register\('\.\/service-worker\.js'\)/,'service worker registration must not depend on Supabase startup succeeding');

// Enhancement modules must be gated and ordered, not raced from window.load.
assert.match(cfg,/window\.COMMAND_CENTER_LOAD_ENHANCEMENTS = \(\) =>/,'config must expose an explicit enhancement gate');
assert.doesNotMatch(cfg,/window\.addEventListener\('load'/,'enhancement modules must not race ahead on the window load event');
assert.match(cfg,/s\.async=false/,'dynamic enhancement scripts must preserve their declared execution order');

// Service-worker installation must use only local static assets; remote CDNs are runtime-cached after success.
assert.match(sw,/james-command-center-v56/,'first-launch repair must advance the app cache');
assert.ok(sw.includes("'./startup-loader.js?v=1'"),'startup loader must be available to the installed PWA');
assert.match(sw,/SUPABASE_CDNS=\[[\s\S]*cdn\.jsdelivr\.net[\s\S]*unpkg\.com/,'service worker must recognize both pinned secure runtime sources');
const installBlock=sw.slice(sw.indexOf("self.addEventListener('install'"),sw.indexOf("self.addEventListener('activate'"));
assert.doesNotMatch(installBlock,/fetch\s*\(/,'service-worker installation must never wait on an external network fetch');
assert.match(sw,/SUPABASE_CDNS\.includes\(url\.href\)/,'successful secure runtime downloads must be eligible for cache reuse');
assert.match(sw,/pathname\.endsWith\('\/startup-loader\.js'\)/,'startup loader must use the fresh local-asset path');

console.log('First-launch boot regression QA passed.');
