import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mobile = readFileSync('mobile-accordion-polish.js', 'utf8');
const mobileCss = readFileSync('mobile-accordion-polish.css', 'utf8');
const integrity = readFileSync('app-integrity-repair.js', 'utf8');
const accordions = readFileSync('command-center-project-detail-accordions.js','utf8');
const accordionCss = readFileSync('command-center-project-detail-accordions.css','utf8');
const v6Js = readFileSync('command-center-v6.js', 'utf8');
const v6Css = readFileSync('command-center-v6.css', 'utf8');
const sw = readFileSync('service-worker.js', 'utf8');
const html = readFileSync('index.html', 'utf8');
const manifest = readFileSync('manifest.webmanifest', 'utf8');

assert.match(mobile, /history\.pushState\(/, 'in-app navigation must create browser-history entries');
assert.match(mobile, /addEventListener\(['"]popstate['"]/, 'Android/browser Back must restore prior in-app state');
assert.match(mobile, /history\.back\(\)/, 'in-app Back controls must use the same history stack');
assert.match(mobile, /scrollY/, 'navigation state must preserve scroll position');
assert.match(mobile, /window\.scrollTo\(/, 'Back navigation must restore saved scroll position');
assert.match(mobile, /kind === ['"]detail['"]/, 'project detail must be a distinct navigation depth');
assert.match(mobile, /kind === ['"]home['"]/, 'dashboard must be the navigation root');

assert.match(mobile, /stats\.style\.setProperty\('display', 'contents', 'important'\)/, 'stat buttons must participate directly in the accordion flex order');
assert.match(mobile, /shell\.style\.setProperty\('order', String\(activeOrder \+ 1\), 'important'\)/, 'opened submenu must be ordered immediately under the active home tile');
assert.match(mobile, /shell\.dataset\.accordionUnder = view/, 'opened shell must record which home tile it belongs under');
assert.match(mobileCss, /\.dashboard-stack\{display:flex!important;flex-direction:column!important/, 'dashboard accordion must use a forced column flex layout');
assert.match(mobileCss, /\.dashboard-stack>\.stats\{display:contents!important\}/, 'stats wrapper must not trap the submenu at the bottom');

assert.match(accordions,/ccProjectDetailAccordion/,'project detail sections must own a history level');
assert.match(accordions,/ccProjectDetailAccordionBase/,'project detail sections must preserve a Back landing state');
assert.match(accordions,/history\.pushState/,'opening a project detail section must push history');
assert.match(accordions,/history\.back\(\)/,'tapping the same open project detail bubble must close through history');
assert.match(accordions,/history\.replaceState/,'switching detail bubbles must not stack unnecessary history levels');
assert.match(mobile,/ccProjectDetailAccordion/,'global mobile navigation must leave project detail history to its owner');
assert.match(mobile,/ccProjectDetailAccordionBase/,'global mobile navigation must not navigate away when a detail bubble closes');
assert.match(accordionCss,/#backHomeBtn,[\s\S]*\.cc-brain-back\{display:none!important\}/,'redundant visual Back arrows must not remain visible');

assert.doesNotMatch(mobileCss, /overflow-y\s*:/, 'mobile CSS must not create or force a document vertical scroll container');
assert.doesNotMatch(mobileCss, /touch-action\s*:/, 'mobile CSS must not redefine root touch panning');
assert.doesNotMatch(mobileCss, /overscroll-behavior-y\s*:/, 'mobile CSS must not change Android document overscroll behavior');
assert.doesNotMatch(mobile, /overscroll-behavior-y/, 'mobile controller must not inject a root overscroll rule');
assert.match(integrity, /installPullToRefreshGuard/, 'pull-to-refresh prevention must be gesture scoped');
assert.match(integrity, /dy>10&&Math\.abs\(dy\)>Math\.abs\(dx\)\*1\.1\)event\.preventDefault/, 'only a downward gesture that begins at the top may be prevented');
assert.match(html, /installTopEdgeRefreshGuard/, 'startup shell must protect the top edge before enhancements load');
assert.match(html, /mobile-accordion-polish\.css\?v=4/, 'the installed shell must request the native-scroll mobile CSS');
assert.ok(sw.includes("'./mobile-accordion-polish.css?v=4'"), 'the native-scroll mobile CSS must ship in the installed-app cache');
assert.ok(sw.includes("'./mobile-accordion-polish.js?v=3'"), 'the repaired mobile navigation controller must ship in the installed-app cache');

assert.match(html, /viewport-fit=cover/, 'PWA must opt in to standards-based edge-to-edge handling');
assert.equal(JSON.parse(manifest).display, 'standalone', 'PWA must remain standalone; do not hide Android controls with fullscreen');
assert.equal(JSON.parse(manifest).theme_color, '#000000', 'manifest theme color must use the approved black system theme');
assert.equal(JSON.parse(manifest).background_color, '#000000', 'manifest background must use the approved black system theme');
assert.match(mobile, /theme\.content = '#000000'/, 'mobile controller must keep the runtime theme meta black');
assert.match(mobileCss, /background-color:#000000!important/, 'mobile shell/safe-area background must remain black');
assert.match(v6Js, /setAttribute\('content','#000000'\)|meta\.content = '#000000'/, 'V6 must retain a black runtime system theme');
assert.match(v6Css, /html\[data-command-center-theme="v6"\][\s\S]*background:#000!important/, 'V6 shell must remain black at every navigation depth');
assert.match(mobile, /safe-area-inset-bottom/, 'page must paint/pad the safe-area region when Chrome exposes it');
assert.doesNotMatch(manifest, /"display"\s*:\s*"fullscreen"/, 'must not force immersive/fullscreen to hide Android system navigation');

const cacheVersionMatch = sw.match(/james-command-center-v(\d+)/);
assert.ok(cacheVersionMatch, 'service-worker cache must remain explicitly versioned');
assert.ok(Number(cacheVersionMatch[1]) >= 60, 'service-worker cache must include the project accordion release');
assert.match(sw, /url\.pathname\.endsWith\('\/mobile-accordion-polish\.js'\)/, 'mobile navigation controller must remain in the fresh-asset set');
assert.match(sw, /url\.pathname\.endsWith\('\/mobile-accordion-polish\.css'\)/, 'mobile CSS must remain in the fresh-asset set');
assert.match(sw, /url\.pathname\.endsWith\('\/command-center-project-detail-accordions\.js'\)/, 'project accordion controller must remain in the fresh-asset set');

console.log('Mobile accordion/back/system-bar/native-scroll/project-detail/top-edge-refresh QA passed.');