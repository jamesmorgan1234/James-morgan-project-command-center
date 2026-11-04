import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../public/project-system.css', import.meta.url), 'utf8');
const browser = readFileSync(new URL('../src/runtime/browser.ts', import.meta.url), 'utf8');

test('Project navigation cards stay compact on phones without losing full-card navigation', () => {
  const mobile = css.split('/* Mobile Projects list: preserve compact navigation-card geometry.')[1];
  assert.ok(mobile, 'the protected mobile layout section must exist');
  assert.match(mobile, /@media\(max-width:699px\)/);
  assert.match(mobile, /\.project-row\.project-navigation-card\{grid-template-columns:48px minmax\(0,1fr\) 44px/);
  assert.match(mobile, /\.project-row\.project-navigation-card \.project-title\{[^}]*-webkit-line-clamp:2/);
  assert.match(mobile, /\.project-row\.project-navigation-card \.project-subtitle\{[^}]*-webkit-line-clamp:1/);
  assert.match(mobile, /\.project-row\.project-navigation-card \.project-meta,[\s\S]*?\.project-row\.project-navigation-card \.sync-note\{display:none\}/);
  assert.match(mobile, /\.project-row\.project-navigation-card \.progress-wrap\{gap:0\}/);
  assert.match(mobile, /@media\(max-width:360px\)/);
  assert.match(mobile, /\.project-row\.project-navigation-card\{grid-template-columns:48px minmax\(0,1fr\) 40px/);
  assert.match(browser, /bevelRouteCard\(projectHref\(project\), "project-row project-navigation-card"/);
  assert.match(browser, /row\.append\(projectIcon\(\), text, artPanel\(project\), progressRing\(project\)\)/);
});
