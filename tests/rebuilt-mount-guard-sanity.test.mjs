import fs from 'node:fs';
import assert from 'node:assert/strict';

const startup=fs.readFileSync('startup-loader.js','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');

assert.doesNotMatch(startup,/command-center-approved-mount-guard\.js/,'obsolete mount watchdog must remain removed from startup');
assert.doesNotMatch(cfg,/command-center-approved-mount-guard\.js/,'obsolete mount watchdog must remain removed from normal interface');
assert.match(startup,/for \(const src of CORE_SCRIPTS\) await loadScript\(src, 7000\)/,'core startup must deterministically load its bounded script list');
assert.match(startup,/await window\.COMMAND_CENTER_LOAD_ENHANCEMENTS\?\.\(\)/,'full restored interface must load after core startup');
assert.match(cfg,/window\.COMMAND_CENTER_FULL_INTERFACE_READY = true/,'full-interface readiness must have an explicit completion signal');
assert.match(cfg,/command-center:full-interface-ready/,'restored capabilities must receive the full-interface ready event');

console.log('restored mount sanity QA passed without stripped-renderer watchdog');
