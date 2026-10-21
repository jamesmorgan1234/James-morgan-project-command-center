import fs from 'node:fs';
import assert from 'node:assert/strict';

const orchestrator=fs.readFileSync('refresh-orchestrator.js','utf8');
const exclusions=fs.readFileSync('operating-order-exclusion.js','utf8');
const health=fs.readFileSync('source-health.js','utf8');
const css=fs.readFileSync('command-center-brain-home.css','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const v4=fs.readFileSync('command-center-v4.js','utf8');

for(const [name,text] of [['refresh orchestrator',orchestrator],['exclusion sync',exclusions],['source health',health]]){
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

assert.match(cfg,/window\.COMMAND_CENTER_SUPABASE = client/,'the primary authenticated Supabase client must be shared with helper modules');
assert.match(cfg,/operating-order-exclusion\.js\?v=3/);
assert.match(cfg,/refresh-orchestrator\.js\?v=7/);
assert.match(cfg,/source-health\.js\?v=3/);
assert.match(cfg,/command-center-brain-home\.css\?v=4/);

assert.match(html,/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\.118\.0/,'startup client version must be pinned');
assert.match(html,/app-config\.js\?v=13/,'repair config version must load from the shell');
assert.match(sw,/james-command-center-v55/,'repair must advance the installed-app cache');
assert.match(sw,/SUPABASE_CDN='https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2\.118\.0'/,'service worker must cache the exact pinned startup client');
assert.match(sw,/caches\.match\(SUPABASE_CDN\)/,'installed app reopen must be able to reuse the cached startup client');
assert.match(sw,/pathname\.endsWith\('\/operating-order-exclusion\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/refresh-orchestrator\.js'\)/);
assert.match(sw,/pathname\.endsWith\('\/source-health\.js'\)/);
assert.match(sw,/if\(url\.origin!==self\.location\.origin\)return/,'Supabase API requests must remain outside the app-shell cache path');

assert.match(css,/Military-tech Refresh control/,'military-tech Refresh body must remain');
assert.match(css,/\.refresh-btn::before,[\s\S]*\.refresh-btn::after\{content:none!important;display:none!important\}/,'left emblem and right arrow decorations must both be removed');
assert.doesNotMatch(css,/content:'››'!important|content:'↻'!important/,'Refresh button must not reintroduce arrows or circular refresh glyphs');
assert.doesNotMatch(css,/linear-gradient\(#ffd38a,#ff6a00\)/,'left signal bars must be gone');

assert.match(v4,/wireSwipeDismiss\(\$\('canonicalAuditPanel'\)\)/,'source audit card must remain swipe-dismissable');
assert.match(v4,/wireSwipeDismiss\(\$\('sourceHealthPanel'\)\)/,'source health card must remain swipe-dismissable');
assert.match(v4,/touch-action|ccv4Swipe|pointerdown/,'swipe dismissal wiring must remain present');

console.log('Refresh/reload stability regression QA passed.');
