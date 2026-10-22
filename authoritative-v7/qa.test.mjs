import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = {
  html: await readFile(new URL('./index.html', import.meta.url), 'utf8'),
  app: await readFile(new URL('./app.js', import.meta.url), 'utf8'),
  data: await readFile(new URL('./data.js', import.meta.url), 'utf8'),
  config: await readFile(new URL('./config.js', import.meta.url), 'utf8'),
  theme: await readFile(new URL('./theme.css', import.meta.url), 'utf8'),
  layout: await readFile(new URL('./layout.css', import.meta.url), 'utf8')
};

const allRuntime = Object.values(files).join('\n');
const forbiddenLegacyRefs = [
  'command-center-v4',
  'command-center-v5',
  'command-center-v6',
  'command-center-approved-ui',
  'command-center-approved-nav',
  'command-center-authoritative-runtime',
  'startup-loader.js',
  '../app.js',
  '../styles.css',
  'command_center_agent_service_',
  'agent_sessions',
  'agent_steps',
  'agent_runner_controls'
];

test('clean room imports no legacy Command Center implementation', () => {
  for (const ref of forbiddenLegacyRefs) assert.equal(allRuntime.includes(ref), false, `legacy dependency found: ${ref}`);
});

test('viewport is locked while preserving vertical app scrolling', () => {
  assert.match(files.html, /minimum-scale=1,maximum-scale=1,user-scalable=no/);
  assert.doesNotMatch(files.theme, /body[^}]*overflow-y\s*:\s*hidden/i);
  assert.doesNotMatch(files.theme, /touch-action\s*:\s*none/i);
});

test('approved screenshot screens exist as distinct renderers', () => {
  for (const label of ['Projects','Active / Live','Next Up','Project Details','KDP PERFORMANCE','BOOKS IN SERIES','PUBLICATION STATUS']) {
    assert.ok(files.app.includes(label), `missing approved screen label: ${label}`);
  }
});

test('Agent owner controls are present', () => {
  for (const label of ['AUTO','Next Step','Until Work / Next Work Boundary','Manual Task','Project Checkpoint','Stop Agent']) {
    assert.ok(files.app.includes(label), `missing Agent control: ${label}`);
  }
});

test('clean client uses only cc7 data and Agent tables', () => {
  for (const table of ['cc7_owner_access','cc7_projects','cc7_metrics','cc7_activity','cc7_integrations','cc7_agent_controls','cc7_agent_runs','cc7_agent_tasks','cc7_agent_events','cc7_agent_approvals','cc7_agent_runner_heartbeat']) {
    assert.ok(files.data.includes(table), `missing clean data dependency: ${table}`);
  }
});

test('scope progress is fail-closed when unverified', () => {
  assert.match(files.app, /m\.verified !== true/);
  assert.match(files.app, /Scope unavailable/);
  assert.match(files.app, /N\/A/);
});

test('screenshot-first visual primitives are defined', () => {
  for (const cls of ['cc-card','cc-icon-frame','cc-progress','cc-live-row','cc-next-row','cc-hero','cc-metrics','cc-covers','cc-pub-grid']) {
    assert.ok(files.theme.includes(`.${cls}`) || files.layout.includes(`.${cls}`), `missing visual primitive: ${cls}`);
  }
});
