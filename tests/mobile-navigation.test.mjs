import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mobile = readFileSync('mobile-accordion-polish.js', 'utf8');
const mobileCss = readFileSync('mobile-accordion-polish.css', 'utf8');
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

assert.match(mobileCss, /html\{[^}]*overflow-y:auto!important/, 'document root must remain vertically scrollable');
assert.match(mobileCss, /body\{[^}]*overflow-y:visible!important/, 'body must not become a locked nested scroll container');
assert.match(mobileCss, /touch-action:pan-y!important/, 'vertical touch panning must be explicitly allowed');
assert.match(mobileCss, /overscroll-behavior-y:auto!important/, 'system-bar hardening must not suppress Android vertical panning');

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
assert.ok(Number(cacheVersionMatch[1]) >= 43, 'service-worker cache must retain or advance past the V6 update version');
assert.match(sw, /mobile-accordion-polish\.js/, 'updated mobile navigation controller must be cached');
assert.match(sw, /url\.pathname\.endsWith\('\/mobile-accordion-polish\.js'\)/, 'mobile navigation controller must be network-first for clean updates');
assert.match(sw, /url\.pathname\.endsWith\('\/mobile-accordion-polish\.css'\)/, 'mobile scroll CSS must be network-first for clean updates');

console.log('Mobile accordion/back/system-bar/scroll QA passed.');
