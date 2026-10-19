import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const mobile = readFileSync('mobile-accordion-polish.js', 'utf8');
const mobileCss = readFileSync('mobile-accordion-polish.css', 'utf8');
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
assert.match(html, /<meta name="theme-color" content="#020b1d">/, 'document theme color must remain dark');
assert.equal(JSON.parse(manifest).display, 'standalone', 'PWA must remain standalone; do not hide Android controls with fullscreen');
assert.equal(JSON.parse(manifest).theme_color, '#020b1d', 'manifest theme color must remain dark');
assert.equal(JSON.parse(manifest).background_color, '#020b1d', 'manifest background must remain dark');
assert.match(mobile, /safe-area-inset-bottom/, 'page must paint/pad the safe-area region when Chrome exposes it');
assert.match(mobile, /background-color:#020b1d/, 'system-bar-adjacent page background must stay dark');
assert.doesNotMatch(manifest, /"display"\s*:\s*"fullscreen"/, 'must not force immersive/fullscreen to hide Android system navigation');

assert.match(sw, /james-command-center-v38/, 'service-worker cache version must advance for the scroll hotfix');
assert.match(sw, /mobile-accordion-polish\.js/, 'updated mobile navigation controller must be cached');
assert.match(sw, /url\.pathname\.endsWith\('\/mobile-accordion-polish\.js'\)/, 'mobile navigation controller must be network-first for clean updates');
assert.match(sw, /url\.pathname\.endsWith\('\/mobile-accordion-polish\.css'\)/, 'mobile scroll CSS must be network-first for clean updates');

console.log('Mobile navigation/system-bar/scroll QA passed.');
