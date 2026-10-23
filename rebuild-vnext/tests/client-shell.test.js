import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ClientShellState, publicShellModel } from '../src/client/shell.js';
import { truthfulValue } from '../src/client/view-state.js';

test('signed-out shell never exposes private data', () => {
  const state = new ClientShellState();
  const model = publicShellModel(state);
  assert.equal(model.privateDataVisible, false);
  assert.equal(model.subtitle, 'Secure owner sign in');
});

test('truthful values distinguish verified zero from unavailable', () => {
  assert.equal(truthfulValue({ value: 0, verified: true }), 0);
  assert.equal(truthfulValue({ value: null, verified: true }), 'N/A');
  assert.equal(truthfulValue({ value: 7, verified: false }), 'N/A');
});

test('html is private, noindex, phone-first shell', () => {
  const html = readFileSync(new URL('../web/index.html', import.meta.url), 'utf8');
  assert.match(html, /noindex,nofollow,noarchive/);
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /Secure owner sign in/);
  assert.doesNotMatch(html, /Missing Hour|Morgancommerce|VeloClip|revenue|credit score/i);
});

test('visual tokens enforce near-black orange-gold system and native vertical scroll', () => {
  const css = readFileSync(new URL('../web/styles.css', import.meta.url), 'utf8');
  assert.match(css, /--cc-bg:\s*#050505/);
  assert.match(css, /--cc-gold:\s*#ff9f1a/);
  assert.match(css, /overflow-x:\s*hidden/);
  assert.match(css, /overflow-y:\s*auto/);
  assert.match(css, /prefers-reduced-motion/);
});

test('PWA cache excludes API data and navigation is network-first with cached fallback', () => {
  const sw = readFileSync(new URL('../web/service-worker.js', import.meta.url), 'utf8');
  assert.match(sw, /event\.request\.mode === 'navigate'/);
  assert.match(sw, /fetch\(event\.request\)/);
  assert.match(sw, /caches\.match\('\.\/index\.html'\)/);
  assert.match(sw, /url\.pathname\.includes\('\/api\/'\)/);
});
