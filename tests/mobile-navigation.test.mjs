import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mobile = readFileSync('mobile-accordion-polish.js', 'utf8');
const mobileCss = readFileSync('mobile-accordion-polish.css', 'utf8');
const v5Js = readFileSync('command-center-v5.js', 'utf8');
const v5Css = [1,2,3,4,5,6].map(n=>readFileSync(`command-center-v5-${n}.css`,'utf8')).join('\n');
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

assert.match(mobileCss, /html\{[^}]*overflow-y:auto!important/, 'document root must remain vertically scrollable');
assert.match(mobileCss, /body\{[^}]*overflow-y:visible!important/, 'body must not become a locked nested scroll container');
assert.match(mobileCss, /touch-action:pan-y!important/, 'vertical touch panning must be explicitly allowed');
assert.match(mobileCss, /overscroll-behavior-y:auto!important/, 'system-bar hardening must not suppress Android vertical panning');

assert.match(html, /viewport-fit=cover/, 'PWA must opt in to standards-based edge-to-edge handling');
assert.equal(JSON.parse(manifest).display, 'standalone', 'PWA must remain standalone; do not hide Android controls with fullscreen');
assert.equal(JSON.parse(manifest).theme_color, '#000000', 'manifest theme color must use the V5 black system theme');
assert.equal(JSON.parse(manifest).background_color, '#000000', 'manifest background must use the V5 black system theme');
assert.match(v5Js, /setAttribute\('content','#000000'\)/, 'V5 must set the runtime theme meta to black');
assert.match(v5Css, /body::after\{background:#000!important\}/, 'V5 must repaint the exposed safe-area/system-bar edge black');
assert.match(mobile, /safe-area-inset-bottom/, 'page must paint/pad the safe-area region when Chrome exposes it');
assert.doesNotMatch(manifest, /"display"\s*:\s*"fullscreen"/, 'must not force immersive/fullscreen to hide Android system navigation');

const cacheVersionMatch = sw.match(/james-command-center-v(\d+)/);
assert.ok(cacheVersionMatch, 'service-worker cache must remain explicitly versioned');
assert.ok(Number(cacheVersionMatch[1]) >= 38, 'service-worker cache must retain or advance past the verified scroll-hotfix version');
assert.match(sw, /mobile-accordion-polish\.js/, 'updated mobile navigation controller must be cached');
assert.match(sw, /url\.pathname\.endsWith\('\/mobile-accordion-polish\.js'\)/, 'mobile navigation controller must be network-first for clean updates');
assert.match(sw, /url\.pathname\.endsWith\('\/mobile-accordion-polish\.css'\)/, 'mobile scroll CSS must be network-first for clean updates');

console.log('Mobile navigation/system-bar/scroll QA passed.');
