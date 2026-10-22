import fs from 'node:fs';
import assert from 'node:assert/strict';

const loader=fs.readFileSync('startup-loader.js','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const migration=fs.readFileSync('supabase/migrations/20261022_project_opportunities_owner_read_grant.sql','utf8');

assert.doesNotThrow(()=>new Function(loader),'startup loader must parse');
assert.doesNotThrow(()=>new Function(cfg),'app config must parse');
assert.match(migration,/grant select on public\.project_opportunities to authenticated/i,'authenticated owner-scoped opportunity reads must be granted');

// Recovery now belongs to secure startup/auth state, not the removed stripped-renderer mount watchdog.
assert.match(loader,/const CORE_SCRIPTS = \['\.\/app\.js\?v=10','\.\/project-hub\.js\?v=3','\.\/mobile-accordion-polish\.js\?v=3'\]/,'restored project-hub runtime must be the normal core startup path');
assert.match(loader,/await window\.COMMAND_CENTER_LOAD_ENHANCEMENTS\?\.\(\)/,'restored full interface must load after the authenticated core');
assert.match(loader,/armStateWatchdog\(\)/,'secure startup must retain a bounded state watchdog');
assert.match(loader,/\['authPanel','claimPanel','dashboard'\]/,'watchdog must recognize usable authenticated states rather than renderer-specific class names');
assert.match(loader,/10000/,'secure state watchdog must remain bounded');
assert.match(loader,/Retry secure startup/,'pre-core startup failures must expose retry');
assert.match(loader,/Reload Command Center/,'post-core startup failures must expose a clean reload');
assert.match(loader,/location\.reload\(\)/,'recovery must reload the real application rather than substitute fake UI');
assert.doesNotMatch(loader,/command-center-approved-mount-guard/,'broken stripped-renderer mount guard must not return');
assert.doesNotMatch(cfg,/command-center-approved-mount-guard/,'removed mount guard must not be reintroduced through enhancements');
assert.doesNotMatch(cfg,/command-center-approved-ui\.js/,'stripped renderer must not own normal startup');
assert.match(cfg,/command-center-v6\.js\?v=1/,'restored V6 renderer must be present');
assert.match(cfg,/command-center-exact-menus\.js\?v=1/,'exact menu renderer must be present');
assert.match(html,/Repair and reload Command Center/,'first-launch cache repair remains available');
assert.match(html,/navigator\.serviceWorker\.getRegistrations\(\)/,'cache repair must unregister a broken service worker when necessary');

console.log('Restored V6 startup/mount recovery QA passed without the broken stripped-renderer watchdog.');