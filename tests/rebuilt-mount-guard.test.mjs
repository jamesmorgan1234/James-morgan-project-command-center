import fs from 'node:fs';
import assert from 'node:assert/strict';

const startup=fs.readFileSync('startup-loader.js','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const projectHub=fs.readFileSync('project-hub.js','utf8');
const v6=fs.readFileSync('command-center-v6.js','utf8');

assert.doesNotThrow(()=>new Function(startup),'startup loader must parse');
assert.doesNotThrow(()=>new Function(projectHub),'project hub must parse');
assert.doesNotThrow(()=>new Function(v6),'V6 runtime must parse');

assert.doesNotMatch(startup,/command-center-approved-mount-guard\.js/,'broken stripped-renderer mount watchdog must stay out of startup');
assert.doesNotMatch(cfg,/command-center-approved-mount-guard\.js/,'broken mount watchdog must stay out of normal enhancements');
assert.match(startup,/project-hub\.js\?v=3/,'project hub must be a core startup script');
assert.match(startup,/mobile-accordion-polish\.js\?v=3/,'mobile navigation must be a core startup script');
assert.match(cfg,/command-center-v6\.js\?v=1/,'restored V6 renderer must load in normal interface');
assert.match(cfg,/command-center-v6-2\.js\?v=1/,'restored V6.2 detail layer must load in normal interface');
assert.match(projectHub,/project-card|hub-project-card|data-open/,'project hub must expose real project interaction targets');
assert.match(v6,/decorateStats|decorateProjectCards/,'V6 must decorate the actual project-hub surface rather than mount a replacement shell');

console.log('restored project-hub/V6 mount path QA passed; obsolete stripped watchdog remains removed');
