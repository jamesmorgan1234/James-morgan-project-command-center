import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mobile = readFileSync('mobile-accordion-polish.js', 'utf8');
const mobileCss = readFileSync('mobile-accordion-polish.css', 'utf8');
const approvedNav = readFileSync('command-center-approved-nav.js','utf8');
const approvedCss = readFileSync('command-center-mobile-first.css','utf8');
const authorityCss = readFileSync('command-center-authoritative-runtime.css','utf8');
const integrity = readFileSync('app-integrity-repair.js', 'utf8');
const accordions = readFileSync('command-center-project-detail-accordions.js','utf8');
const accordionCss = readFileSync('command-center-project-detail-accordions.css','utf8');
const v6Js = readFileSync('command-center-v6.js', 'utf8');
const v6Css = readFileSync('command-center-v6.css', 'utf8');
const cfg = readFileSync('app-config.js','utf8');
const sw = readFileSync('service-worker.js', 'utf8');
const html = readFileSync('index.html', 'utf8');
const manifest = readFileSync('manifest.webmanifest', 'utf8');

// Normal-use navigation belongs to the approved app, not the legacy accordion controller.
assert.match(approvedNav,/history\.back\(\)/,'approved in-app Back must use browser history');
assert.match(approvedNav,/stopImmediatePropagation/,'approved Back must suppress competing legacy click handlers');
assert.match(html,/viewport-fit=cover/,'PWA must opt in to edge-to-edge handling');
assert.match(html,/width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no/,'viewport must remain locked against pinch zoom');
assert.match(html,/installTopEdgeRefreshGuard/,'startup shell must protect the top edge before enhancements load');
assert.match(html,/dy>10&&Math\.abs\(dy\)>Math\.abs\(dx\)\*1\.1\)event\.preventDefault/,'only a downward top-edge gesture may be prevented');
assert.doesNotMatch(approvedCss,/overflow-y\s*:\s*hidden/i,'approved mobile CSS must preserve vertical scrolling');
assert.doesNotMatch(approvedCss,/touch-action\s*:\s*none/i,'approved mobile CSS must preserve native touch panning');
assert.doesNotMatch(approvedCss,/overscroll-behavior-y\s*:\s*none/i,'approved mobile CSS must not disable document scrolling');
assert.match(approvedCss,/safe-area-inset-bottom/,'approved mobile surface must respect the bottom safe area');
assert.match(approvedCss,/--cc-touch:48px/,'approved mobile surface must retain 48px touch targets');
assert.match(authorityCss,/#ccApprovedAbout\{[\s\S]*position:static!important/,'About must remain in document flow and never cover navigation');

const core=cfg.slice(cfg.indexOf('window.COMMAND_CENTER_LOAD_ENHANCEMENTS'),cfg.indexOf('let advancedPromise'));
const advanced=cfg.slice(cfg.indexOf('let advancedPromise'));
assert.match(core,/command-center-mobile-first\.css\?v=1/,'normal runtime must load the approved native-scroll mobile CSS');
assert.match(core,/command-center-approved-nav\.js\?v=2/,'normal runtime must load approved Back navigation');
assert.doesNotMatch(core,/mobile-accordion-polish\.js|mobile-accordion-polish\.css/,'legacy mobile accordion must not execute or style normal mode');
assert.match(advanced,/mobile-accordion-polish\.js\?v=3/,'legacy accordion controller must remain available in Advanced');
assert.match(advanced,/mobile-accordion-polish\.css\?v=4/,'legacy accordion CSS must remain available in Advanced');

// Legacy/Advanced navigation remains protected when Advanced is explicitly opened.
assert.match(mobile, /history\.pushState\(/, 'advanced in-app navigation must still create history entries');
assert.match(mobile, /addEventListener\(['"]popstate['"]/, 'advanced Android/browser Back must restore prior state');
assert.match(mobile, /history\.back\(\)/, 'advanced Back controls must use the history stack');
assert.match(mobile, /scrollY/, 'advanced navigation must preserve scroll position');
assert.match(mobile, /window\.scrollTo\(/, 'advanced Back navigation must restore saved scroll position');
assert.match(accordions,/ccProjectDetailAccordion/,'advanced project detail sections must own a history level');
assert.match(accordions,/history\.pushState/,'advanced project detail opening must push history');
assert.match(accordions,/history\.back\(\)/,'advanced project detail close must use history');
assert.match(accordions,/history\.replaceState/,'switching advanced detail bubbles must not stack unnecessary history');
assert.match(accordionCss,/#backHomeBtn,[\s\S]*\.cc-brain-back\{display:none!important\}/,'redundant visual Back arrows must remain hidden in Advanced');

assert.doesNotMatch(mobileCss, /overflow-y\s*:/, 'legacy mobile CSS must not create a forced vertical scroll container when Advanced loads');
assert.doesNotMatch(mobileCss, /touch-action\s*:/, 'legacy mobile CSS must not redefine root touch panning');
assert.doesNotMatch(mobileCss, /overscroll-behavior-y\s*:/, 'legacy mobile CSS must not change Android document overscroll behavior');
assert.doesNotMatch(mobile, /overscroll-behavior-y/, 'legacy mobile controller must not inject a root overscroll rule');
assert.match(integrity, /installPullToRefreshGuard/, 'advanced integrity repair must retain gesture-scoped pull-to-refresh prevention');

assert.equal(JSON.parse(manifest).display, 'standalone', 'PWA must remain standalone; do not hide Android controls with fullscreen');
assert.equal(JSON.parse(manifest).theme_color, '#000000', 'manifest theme color must remain black');
assert.equal(JSON.parse(manifest).background_color, '#000000', 'manifest background must remain black');
assert.match(v6Js, /setAttribute\('content','#000000'\)|meta\.content = '#000000'/, 'Advanced V6 must retain a black runtime system theme');
assert.match(v6Css, /html\[data-command-center-theme="v6"\][\s\S]*background:#000!important/, 'Advanced V6 shell must remain black');
assert.doesNotMatch(manifest, /"display"\s*:\s*"fullscreen"/, 'must not force immersive/fullscreen mode');

const cacheVersionMatch = sw.match(/james-command-center-v(\d+)/);
assert.ok(cacheVersionMatch, 'service-worker cache must remain explicitly versioned');
assert.ok(Number(cacheVersionMatch[1]) >= 72, 'service-worker cache must include the stable-runtime release');
assert.ok(sw.includes("'./command-center-mobile-first.css?v=1'"), 'approved mobile CSS must ship in the installed-app cache');
assert.ok(sw.includes("'./command-center-approved-nav.js?v=2'"), 'approved navigation must ship in the installed-app cache');
assert.ok(sw.includes("'./mobile-accordion-polish.css?v=4'"), 'advanced mobile CSS must remain available offline');
assert.ok(sw.includes("'./mobile-accordion-polish.js?v=3'"), 'advanced mobile controller must remain available offline');
assert.match(sw, /url\.pathname\.endsWith\('\/command-center-approved-nav\.js'\)/, 'approved navigation must be network-first/fresh');
assert.match(sw, /url\.pathname\.endsWith\('\/command-center-mobile-first\.css'\)/, 'approved mobile CSS must be network-first/fresh');

console.log('Approved mobile Back/native-scroll/PWA + lazy Advanced navigation QA passed.');
