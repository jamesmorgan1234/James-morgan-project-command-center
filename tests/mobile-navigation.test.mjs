import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mobile=readFileSync('mobile-accordion-polish.js','utf8');
const mobileCss=readFileSync('mobile-accordion-polish.css','utf8');
const projectHub=readFileSync('project-hub.js','utf8');
const accordions=readFileSync('command-center-project-detail-accordions.js','utf8');
const accordionCss=readFileSync('command-center-project-detail-accordions.css','utf8');
const v6Js=readFileSync('command-center-v6.js','utf8');
const v6Css=readFileSync('command-center-v6.css','utf8');
const exactCss=readFileSync('command-center-exact-menus.css','utf8');
const cfg=readFileSync('app-config.js','utf8');
const sw=readFileSync('service-worker.js','utf8');
const html=readFileSync('index.html','utf8');
const manifest=readFileSync('manifest.webmanifest','utf8');

assert.match(html,/viewport-fit=cover/,'PWA must opt in to edge-to-edge handling');
assert.match(html,/width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no/,'viewport must remain locked against pinch zoom');
assert.match(html,/installTopEdgeRefreshGuard/,'startup shell must protect the top edge before enhancements load');
assert.match(html,/dy>10&&Math\.abs\(dy\)>Math\.abs\(dx\)\*1\.1\)event\.preventDefault/,'only a downward top-edge gesture may be prevented');

assert.match(mobile,/history\.pushState\(/,'in-app navigation must create browser history entries');
assert.match(mobile,/addEventListener\(['"]popstate['"]/,'Android/browser Back must restore prior state');
assert.match(mobile,/history\.back\(\)/,'Back controls must use browser history');
assert.match(mobile,/history\.scrollRestoration = 'manual'/,'navigation must own deterministic scroll restoration');
assert.match(mobile,/saveCurrentScroll/,'navigation must persist current scroll before entering a deeper screen');
assert.match(mobile,/window\.scrollTo\(/,'Back navigation must restore saved scroll position');
assert.match(mobile,/stopImmediatePropagation/,'Back/list toggles must suppress competing handlers when history owns the action');
assert.match(mobile,/safe-area-inset-bottom/,'system-bar hardening must respect the bottom safe area');
assert.match(mobile,/background-color:#000000!important/,'Android/system surfaces must remain black');
assert.doesNotMatch(mobile,/touch-action\s*:\s*none/i,'navigation runtime must never disable native touch panning');
assert.doesNotMatch(mobile,/overflow-y\s*:\s*hidden/i,'navigation runtime must never disable vertical document scrolling');
assert.doesNotMatch(mobile,/overscroll-behavior-y\s*:\s*none/i,'navigation runtime must not globally suppress vertical overscroll');
assert.doesNotMatch(mobileCss,/overflow-y\s*:/i,'restored mobile CSS must not create a forced vertical scroll container');
assert.doesNotMatch(mobileCss,/touch-action\s*:/i,'restored mobile CSS must not redefine root touch panning');
assert.doesNotMatch(mobileCss,/overscroll-behavior-y\s*:/i,'restored mobile CSS must not change Android document overscroll behavior');

// These assets live in the arrays before the enhancement function declaration, so validate the complete config source.
assert.match(cfg,/mobile-accordion-polish\.css\?v=4/,'normal full interface must load restored mobile navigation CSS');
assert.match(cfg,/mobile-accordion-polish\.js\?v=3/,'normal full interface must load restored mobile navigation controller');
assert.match(cfg,/command-center-v6\.js\?v=1/,'V6 interface must remain in normal startup');
assert.match(cfg,/command-center-exact-menus\.js\?v=1/,'exact approved menus must remain in normal startup');
assert.doesNotMatch(cfg,/command-center-mobile-first\.css/,'conflicting generic mobile visual override must not be reintroduced');
assert.doesNotMatch(cfg,/command-center-approved-nav\.js/,'stripped-renderer navigation shim must not replace restored navigation');
assert.match(html,/project-hub\.css\?v=2/,'project-hub CSS must preload to avoid generic-shell flash');
assert.match(html,/mobile-accordion-polish\.css\?v=4/,'mobile navigation CSS must preload');
assert.match(projectHub,/data-open|project-card/,'project hub must retain interactive project targets');

assert.match(accordions,/ccProjectDetailAccordion/,'project detail sections must own a history level');
assert.match(accordions,/history\.pushState/,'project detail opening must push history');
assert.match(accordions,/history\.back\(\)/,'project detail close must use history');
assert.match(accordions,/history\.replaceState/,'switching detail bubbles must not stack unnecessary history');
assert.match(accordionCss,/#backHomeBtn,[\s\S]*\.cc-brain-back\{display:none!important\}/,'redundant visual Back arrows remain hidden where physical/browser Back owns navigation');

assert.doesNotMatch(v6Css,/overflow-y\s*:\s*hidden/i,'V6 CSS must not disable vertical document scrolling');
assert.doesNotMatch(exactCss,/overflow-y\s*:\s*hidden/i,'exact-menu CSS must not disable vertical document scrolling');
assert.doesNotMatch(v6Css,/touch-action\s*:\s*none/i,'V6 CSS must not disable touch panning');
assert.match(v6Js,/meta\.content = '#000000'|setAttribute\('content','#000000'\)/,'V6 runtime must retain black system theme');
assert.match(v6Css,/html\[data-command-center-theme="v6"\][\s\S]*background:#000!important/,'V6 shell must remain black');

const parsedManifest=JSON.parse(manifest);
assert.equal(parsedManifest.display,'standalone','PWA must remain standalone; do not hide Android controls with fullscreen');
assert.equal(parsedManifest.theme_color,'#000000','manifest theme color must remain black');
assert.equal(parsedManifest.background_color,'#000000','manifest background must remain black');
assert.doesNotMatch(manifest,/"display"\s*:\s*"fullscreen"/,'must not force immersive/fullscreen mode');

const cacheVersionMatch=sw.match(/james-command-center-v(\d+)/);
assert.ok(cacheVersionMatch,'service-worker cache must remain explicitly versioned');
assert.ok(Number(cacheVersionMatch[1])>=74,'service-worker cache must include the restored-interface release');
for(const asset of ["'./project-hub.js?v=3'","'./mobile-accordion-polish.css?v=4'","'./mobile-accordion-polish.js?v=3'","'./command-center-v6.js?v=1'","'./command-center-exact-menus.js?v=1'"])assert.ok(sw.includes(asset),`installed-app cache missing ${asset}`);
for(const path of ['project-hub.js','mobile-accordion-polish.css','mobile-accordion-polish.js','command-center-v6.js','command-center-exact-menus.js'])assert.match(sw,new RegExp(`url\\.pathname\\.endsWith\\('\\/${path.replaceAll('.','\\.')}'\\)`),`restored navigation asset must be network-first: ${path}`);

console.log('Restored V6 mobile Back/native-scroll/PWA navigation QA passed.');