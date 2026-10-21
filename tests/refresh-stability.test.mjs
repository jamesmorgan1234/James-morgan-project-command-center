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
const mobile=fs.readFileSync('mobile-accordion-polish.js','utf8');
const mobileCss=fs.readFileSync('mobile-accordion-polish.css','utf8');
const consistency=fs.readFileSync('command-center-ui-consistency.js','utf8');
const accordions=fs.readFileSync('command-center-project-detail-accordions.js','utf8');
const context=fs.readFileSync('command-center-brain-context.js','utf8');

for(const [name,text] of [['refresh orchestrator',orchestrator],['exclusion sync',exclusions],['source health',health],['startup loader',loader],['app config',cfg],['app integrity repair',integrity],['mobile accordion',mobile],['UI consistency',consistency],['project detail accordions',accordions],['Brain Context Builder',context]]){
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
assert.match(loader,/mobile-accordion-polish\.js\?v=3/);
assert.match(cfg,/operating-order-exclusion\.js\?v=3/);
assert.match(cfg,/refresh-orchestrator\.js\?v=7/);
assert.match(cfg,/source-health\.js\?v=3/);
assert.match(cfg,/command-center-brain-home\.css\?v=4/);
assert.match(cfg,/app-integrity-repair\.js\?v=2/);
assert.match(cfg,/command-center-ui-consistency\.css\?v=1/);
assert.match(cfg,/command-center-ui-consistency\.js\?v=1/);
assert.match(cfg,/command-center-project-detail-accordions\.css\?v=1/);
assert.match(cfg,/command-center-project-detail-accordions\.js\?v=1/);
assert.match(cfg,/command-center-brain-context\.css\?v=1/);
assert.match(cfg,/command-center-brain-context\.js\?v=1/);
assert.match(cfg,/s\.async=false/,'enhancement scripts must preserve their intended order');
assert.doesNotMatch(cfg,/window\.addEventListener\('load'/,'enhancements must not race the core on window load');

assert.match(html,/app-config\.js\?v=18/,'self-healing bootstrap must request the Phase 3 config');
assert.match(html,/startup-loader\.js\?v=3/,'self-healing bootstrap must request the repaired startup loader');
assert.match(html,/navigator\.serviceWorker\.getRegistrations\(\)/,'broken local runtime must be recoverable without asking the user to clear site data');
assert.match(html,/key\.startsWith\('james-command-center-'\)/,'automatic repair must clear only Command Center caches');
assert.match(html,/command-center-startup-shell\.css\?v=1/,'critical approved startup shell must be local and immediately available');
assert.doesNotMatch(html,/<script[^>]+src="https:\/\//i,'fresh install must not block first paint on an external script');
assert.match(sw,/james-command-center-v61/,'Phase 3 must advance the installed-app cache');
assert.match(sw,/Promise\.allSettled\(STATIC\.map\(asset=>cache\.add\(asset\)\)\)/,'one optional cache failure must not abort worker installation');
assert.match(sw,/fetchWithTimeout\(e\.request,3500\)/,'navigation network refresh must be bounded');
assert.match(sw,/SUPABASE_CDNS=\[/,'service worker must recognize both secure runtime sources');
assert.match(sw,/caches\.match\(url\.href\)/,'installed app reopen must be able to reuse a successfully cached secure runtime');
assert.match(sw,/pathname\.endsWith\('\/startup-loader\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/operating-order-exclusion\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/refresh-orchestrator\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/source-health\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/app-integrity-repair\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/command-center-ui-consistency\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/command-center-ui-consistency\.css'\)/);
assert.match(sw,/pathname\.endsWith\('\/command-center-project-detail-accordions\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/command-center-project-detail-accordions\.css'\)/);
assert.match(sw,/pathname\.endsWith\('\/command-center-brain-context\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/command-center-brain-context\.css'\)/);
assert.match(sw,/if\(url\.origin!==self\.location\.origin\)return/,'Supabase API requests must remain outside the app-shell cache path');
const installBlock=sw.slice(sw.indexOf("self.addEventListener('install'"),sw.indexOf("self.addEventListener('activate'"));
assert.doesNotMatch(installBlock,/fetch\s*\(/,'service-worker install must never depend on a remote runtime');

assert.match(css,/Military-tech Refresh control/,'military-tech Refresh body must remain');
assert.match(css,/\.refresh-btn::before,[\s\S]*\.refresh-btn::after\{content:none!important;display:none!important\}/,'left emblem and right arrow decorations must both be removed');
assert.doesNotMatch(css,/content:'››'!important|content:'↻'!important/,'Refresh button must not reintroduce arrows or circular refresh glyphs');
assert.doesNotMatch(css,/linear-gradient\(#ffd38a,#ff6a00\)/,'left signal bars must be gone');

assert.match(v4,/wireSwipeDismiss\(\$\('canonicalAuditPanel'\)\)/,'legacy source audit swipe wiring may remain for compatibility');
assert.match(v4,/wireSwipeDismiss\(\$\('sourceHealthPanel'\)\)/,'legacy source health swipe wiring may remain for compatibility');
assert.match(integrity,/cloneNode\(true\)/,'integrity repair must replace legacy swipe listeners before installing the safe handler');
assert.doesNotMatch(integrity,/setPointerCapture/,'safe swipe repair must not capture vertical gestures');
assert.match(integrity,/touchAction='pan-y'/,'safe swipe cards must allow native vertical panning');
assert.match(integrity,/installPullToRefreshGuard/,'refresh prevention must be gesture-scoped instead of root-scroll CSS');
assert.doesNotMatch(mobile,/overscroll-behavior-y/,'mobile navigation must not alter the document overscroll model');
assert.doesNotMatch(mobileCss,/overflow-y\s*:|touch-action\s*:|overscroll-behavior-y\s*:/,'mobile shell CSS must leave native vertical scrolling alone');
assert.match(accordions,/history\.pushState/,'project section expansion must participate in Android Back history');
assert.match(accordions,/history\.back\(\)/,'same project section bubble must close through that same history');

console.log('Refresh/reload + self-healing startup + native-scroll + project-accordion + Phase 3 stability QA passed.');