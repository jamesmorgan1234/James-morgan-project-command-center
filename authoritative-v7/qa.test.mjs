import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const files = {
  html: await readFile(new URL('./index.html', import.meta.url), 'utf8'),
  app: await readFile(new URL('./app.js', import.meta.url), 'utf8'),
  data: await readFile(new URL('./data.js', import.meta.url), 'utf8'),
  config: await readFile(new URL('./config.js', import.meta.url), 'utf8'),
  modules: await readFile(new URL('./control-modules.js', import.meta.url), 'utf8'),
  pwa: await readFile(new URL('./pwa.js', import.meta.url), 'utf8'),
  sw: await readFile(new URL('./service-worker.js', import.meta.url), 'utf8'),
  manifest: await readFile(new URL('./manifest.webmanifest', import.meta.url), 'utf8'),
  offline: await readFile(new URL('./offline.html', import.meta.url), 'utf8'),
  theme: await readFile(new URL('./theme.css', import.meta.url), 'utf8'),
  layout: await readFile(new URL('./layout.css', import.meta.url), 'utf8')
};

const allRuntime = Object.values(files).join('\n');
const forbiddenLegacyRefs = [
  'command-center-v4','command-center-v5','command-center-v6',
  'command-center-approved-ui','command-center-approved-nav','command-center-authoritative-runtime',
  'startup-loader.js','../app.js','../styles.css','command_center_agent_service_',
  'agent_sessions','agent_steps','agent_runner_controls'
];

test('clean room imports no legacy Command Center implementation',()=>{
  for(const ref of forbiddenLegacyRefs)assert.equal(allRuntime.includes(ref),false,`legacy dependency found: ${ref}`);
});

test('viewport is locked while preserving vertical app scrolling',()=>{
  assert.match(files.html,/minimum-scale=1,maximum-scale=1,user-scalable=no/);
  assert.doesNotMatch(files.theme,/body[^}]*overflow-y\s*:\s*hidden/i);
  assert.doesNotMatch(files.theme,/touch-action\s*:\s*none/i);
});

test('approved screenshot screens exist as distinct renderers',()=>{
  for(const label of ['Projects','Active / Live','Next Up','Project Details','KDP PERFORMANCE','BOOKS IN SERIES','PUBLICATION STATUS'])assert.ok(files.app.includes(label),`missing approved screen label: ${label}`);
});

test('Agent owner controls and explicit project selector are present',()=>{
  for(const label of ['AUTO','Next Step','Until Work / Next Work Boundary','Manual Task','Project Checkpoint','Stop Agent','ccAgentProjectSelector'])assert.ok(files.app.includes(label),`missing Agent control: ${label}`);
});

test('clean client uses cc7 data, modules, checkpoints, and Agent tables',()=>{
  for(const table of [
    'cc7_owner_access','cc7_projects','cc7_metrics','cc7_activity','cc7_integrations',
    'cc7_brain_items','cc7_brain_plans','cc7_brain_tasks','cc7_automations','cc7_notifications','cc7_integration_connections',
    'cc7_analytics_kpis','cc7_analytics_goals','cc7_analytics_anomalies','cc7_security_permissions','cc7_security_authorizations','cc7_security_alerts',
    'cc7_deployment_releases','cc7_deployment_checks','cc7_deployment_rollbacks',
    'cc7_agent_controls','cc7_agent_runs','cc7_agent_tasks','cc7_agent_events','cc7_agent_approvals','cc7_agent_checkpoints','cc7_agent_runner_heartbeat'
  ])assert.ok(files.data.includes(table),`missing clean data dependency: ${table}`);
});

test('all six control modules have real clean renderers',()=>{
  for(const view of ['brain','automation','integrations','analytics','security','deployment'])assert.ok(files.modules.includes(`view === '${view}'`),`missing control module renderer: ${view}`);
  for(const label of ['BRAIN OVERVIEW','AUTOMATION OVERVIEW','INTEGRATION OVERVIEW','ANALYTICS OVERVIEW','SECURITY OVERVIEW','DEPLOYMENT OVERVIEW'])assert.ok(files.modules.includes(label),`missing module section: ${label}`);
});

test('scope progress is fail-closed when unverified',()=>{
  assert.match(files.app,/m\.verified!==true/);
  assert.match(files.app,/Scope unavailable/);
  assert.match(files.app,/N\/A/);
});

test('screenshot-first visual primitives are defined',()=>{
  for(const cls of ['cc-card','cc-icon-frame','cc-progress','cc-live-row','cc-next-row','cc-hero','cc-metrics','cc-covers','cc-pub-grid'])assert.ok(files.theme.includes(`.${cls}`)||files.layout.includes(`.${cls}`),`missing visual primitive: ${cls}`);
});

test('clean PWA is isolated and fail-safe offline',()=>{
  const manifest=JSON.parse(files.manifest);
  assert.equal(manifest.scope,'./');
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.theme_color,'#000000');
  assert.ok(manifest.icons.some(i=>i.sizes==='512x512'&&i.src.includes('command-center-approved-icon-512.png')));
  assert.match(files.html,/\.\/manifest\.webmanifest\?v=1/);
  assert.match(files.html,/\.\/pwa\.js\?v=1/);
  assert.match(files.pwa,/authoritative-v7\/service-worker\.js/);
  assert.match(files.sw,/command-center-v7-clean-1/);
  assert.match(files.offline,/No cached screen is being presented as current/);
});
