import fs from 'node:fs';
import assert from 'node:assert/strict';

const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
const html = fs.readFileSync('index.html', 'utf8');
const sw = fs.readFileSync('service-worker.js', 'utf8');
const standard = fs.readFileSync('PWA_UPDATE_STANDARD.md', 'utf8');

assert.equal(manifest.id, './', 'manifest id must stay stable');
assert.equal(manifest.start_url, './', 'start_url must stay stable');
assert.equal(manifest.scope, './', 'scope must stay stable');
assert.equal(manifest.display, 'standalone', 'standalone install identity must remain');

assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 2, 'manifest must expose launcher icons');
const anyIcon = manifest.icons.find(icon => icon.purpose === 'any');
const maskableIcon = manifest.icons.find(icon => icon.purpose === 'maskable');
assert.ok(anyIcon, 'an any-purpose icon is required');
assert.ok(maskableIcon, 'a maskable icon is required');
assert.notEqual(anyIcon.src, maskableIcon.src, 'any and maskable entries need distinct metadata URLs');
assert.match(anyIcon.src, /command-center-icon-v4\.svg\?icon=5-any$/, 'any icon URL must be explicitly versioned');
assert.match(maskableIcon.src, /command-center-icon-v4\.svg\?icon=5-maskable$/, 'maskable icon URL must be explicitly versioned');

assert.match(html, /rel="manifest" href="\.\/manifest\.webmanifest\?v=3"/, 'existing manifest link URL must stay stable');
assert.match(sw, /james-command-center-v41/, 'service-worker cache must be bumped for icon update release');
assert.ok(sw.includes("'./command-center-icon-v4.svg?icon=5-any'"), 'service worker must cache the current any icon URL');
assert.ok(sw.includes("'./command-center-icon-v4.svg?icon=5-maskable'"), 'service worker must cache the current maskable icon URL');
assert.match(sw, /url\.pathname\.endsWith\('\/manifest\.webmanifest'\)/, 'manifest fetch must use the network-first path');
assert.match(sw, /url\.pathname\.endsWith\('\/command-center-icon-v4\.svg'\)/, 'launcher icon fetch must use the network-first path');
assert.match(sw, /fetch\(e\.request,\{cache:'no-store'\}\)/, 'manifest/icon network-first path must bypass stale HTTP cache');

assert.match(standard, /Update Status: Not updatable/, 'standard must document legacy/unbound install limitation');
assert.match(standard, /cannot convert that already-installed Android package into an updatable bound WebAPK in place/, 'standard must not promise impossible in-place conversion');
assert.match(standard, /Future icon revisions must advance those URLs again/, 'standard must enforce future versioned icon URL changes');

console.log('PWA icon update pipeline QA passed.');
