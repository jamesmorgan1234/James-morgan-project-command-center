import fs from 'node:fs';
import assert from 'node:assert/strict';

const orchestrator=fs.readFileSync('refresh-orchestrator.js','utf8');
const exclusions=fs.readFileSync('operating-order-exclusion.js','utf8');
const health=fs.readFileSync('source-health.js','utf8');
const css=fs.readFileSync('command-center-brain-home.css','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const loader=fs.readFileSync('startup-loader.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const v4=fs.readFileSync('command-center-v4.js','utf8');
const integrity=fs.readFileSync('app-integrity-repair.js','utf8');

for(const [name,text] of [['refresh orchestrator',orchestrator],['exclusion sync',exclusions],['source health',health],['startup loader',loader],['app config',cfg],['app integrity repair',integrity]]){
  assert.doesNotThrow(()=>new Function(text),`${name} must parse as JavaScript`);
}

assert.doesNotMatch(orchestrator,/window\.location\.reload|location\.reload\s*\(/,'successful source audit must never tear down the working app with a forced page reload');
assert.match(orchestrator,/commandcenter:audit-complete/,'audit completion event must remain available');
assert.match(orchestrator,/commandcenter:data-refresh-requested/,'audit completion must request an in-place data refresh');
assert.match(orchestrator,/window\.COMMAND_CENTER_SUPABASE/,'refresh orchestration must prefer the canonical authenticated client');

const observerBlock=exclusions.slice(exclusions.indexOf('const observer = new MutationObserver'),exclusions.indexOf("window.addEventListener('load'"));
assert.match(observerBlock,/scheduleScrub/,'DOM mutations may still reapply local exclusion presentation');
assert.doesNotMatch(observerBlock,/syncExclusions/,'DOM mutations must never trigger database reads');
assert.match(exclusions,/setInterval\(syncExclusions/,'exclusion data may refresh on a bounded interval');
assert.match(exclusions,/commandcenter:audit-complete/,'exclusion data must refresh after a completed source audit');
assert.match(exclusions,/window\.COMMAND_CENTER_SUPABASE/,'exclusion sync must reuse the canonical client when available');

assert.match(health,/scheduleRetry/,'Source Health must retry transient failures automatically');
assert.match(health,/2500/,'Source Health retry must be bounded rather than a tight loop');
assert.match(health,/commandcenter:data-refresh-requested/,'Source Health must refresh after the in-place audit refresh signal');
assert.match(health,/window\.COMMAND_CENTER_SUPABASE/,'Source Health must reuse the canonical client when available');

assert.match(loader,/window\.COMMAND_CENTER_SUPABASE = client/,'startup must expose the primary authenticated Supabase client to helper modules');
assert.match(loader,/primaryClientCreated && window\.COMMAND_CENTER_SUPABASE/,'later same-backend client requests must reuse the canonical client');
assert.match(loader,/Retry secure startup/,'startup failures must be visible and retryable');
assert.match(loader,/COMMAND_CENTER_LOAD_ENHANCEMENTS/,'enhancements must wait until core startup is available');
assert.match(cfg,/operating-order-exclusion\.js\?v=3/);
assert.match(cfg,/refresh-orchestrator\.js\?v=7/);
assert.match(cfg,/source-health\.js\?v=3/);
assert.match(cfg,/command-center-brain-home\.css\?v=4/);
assert.match(cfg,/s\.async=false/,'enhancement scripts must preserve their intended order');
assert.doesNotMatch(cfg,/window\.addEventListener\('load'/,'enhancements must not race the core on window load');

assert.match(html,/app-config\.js\?v=14/,'combined repair config must load from the local shell');
assert.match(html,/startup-loader\.js\?v=2/,'resilient startup loader must load from the local shell');
assert.match(html,/command-center-startup-shell\.css\?v=1/,'critical approved startup shell must be local and immediately available');
assert.doesNotMatch(html,/<script[^>]+src="https:\/\//i,'fresh install must not block first paint on an external script');
assert.match(sw,/james-command-center-v57/,'combined repair must advance the installed-app cache');
assert.match(sw,/SUPABASE_CDNS=\[/,'service worker must recognize both secure runtime sources');
assert.match(sw,/caches\.match\(url\.href\)/,'installed app reopen must be able to reuse a successfully cached startup runtime');
assert.match(sw,/pathname\.endsWith\('\/startup-loader\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/operating-order-exclusion\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/refresh-orchestrator\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/source-health\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/app-integrity-repair\.js'\)/);
assert.match(sw,/if\(url\.origin!==self\.location\.origin\)return/,'Supabase API requests must remain outside the app-shell cache path');
const installBlock=sw.slice(sw.indexOf("self.addEventListener('install'"),sw.indexOf("self.addEventListener('activate'"));
assert.doesNotMatch(installBlock,/fetch\s*\(/,'service-worker install must never depend on the remote Supabase runtime');

assert.match(css,/Military-tech Refresh control/,'military-tech Refresh body must remain');
assert.match(css,/\.refresh-btn::before,[\s\S]*\.refresh-btn::after\{content:none!important;display:none!important\}/,'left emblem and right arrow decorations must both be removed');
assert.doesNotMatch(css,/content:'››'!important|content:'↻'!important/,'Refresh button must not reintroduce arrows or circular refresh glyphs');
assert.doesNotMatch(css,/linear-gradient\(#ffd38a,#ff6a00\)/,'left signal bars must be gone');

assert.match(v4,/wireSwipeDismiss\(\$\('canonicalAuditPanel'\)\)/,'legacy source audit swipe wiring may remain for compatibility');
assert.match(v4,/wireSwipeDismiss\(\$\('sourceHealthPanel'\)\)/,'legacy source health swipe wiring may remain for compatibility');
assert.match(integrity,/cloneNode\(true\)/,'integrity repair must replace legacy swipe listeners before installing the safe handler');
assert.doesNotMatch(integrity,/setPointerCapture/,'safe swipe repair must not capture vertical gestures');
assert.match(integrity,/touchAction='pan-y'/,'safe swipe repair must preserve native vertical panning');
assert.match(integrity,/overscroll-behavior-y','contain'/,'pull-to-refresh must stay contained without using scroll-locking none');

console.log('Refresh/reload + first-launch + vertical-scroll stability regression QA passed.');
