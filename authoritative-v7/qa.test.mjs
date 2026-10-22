import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const files = {
  html: await readFile(new URL('./index.html', import.meta.url), 'utf8'),
  app: await readFile(new URL('./app.js', import.meta.url), 'utf8'),
  data: await readFile(new URL('./data.js', import.meta.url), 'utf8'),
  config: await readFile(new URL('./config.js', import.meta.url), 'utf8'),
  modules: await readFile(new URL('./control-modules.js', import.meta.url), 'utf8'),
  overview: await readFile(new URL('./overview-screens.js', import.meta.url), 'utf8'),
  pwa: await readFile(new URL('./pwa.js', import.meta.url), 'utf8'),
  sw: await readFile(new URL('./service-worker.js', import.meta.url), 'utf8'),
  manifest: await readFile(new URL('./manifest.webmanifest', import.meta.url), 'utf8'),
  offline: await readFile(new URL('./offline.html', import.meta.url), 'utf8'),
  theme: await readFile(new URL('./theme.css', import.meta.url), 'utf8'),
  layout: await readFile(new URL('./layout.css', import.meta.url), 'utf8'),
  artwork: await readFile(new URL('./artwork.css', import.meta.url), 'utf8')
};
const approvedIcon512=await readFile(new URL('../command-center-approved-icon-512.png',import.meta.url));
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

test('approved screenshot chevrons have real V7 destinations',()=>{
  assert.match(files.app,/data-nav="portfolio-overview"/);
  assert.match(files.app,/data-nav="analytics"/);
  assert.match(files.app,/data-detail-view="project-snapshot"/);
  assert.ok(files.app.includes("r.view==='portfolio-overview'"));
  assert.ok(files.app.includes("r.view==='project-snapshot'"));
  assert.ok(files.overview.includes('Portfolio Overview'));
  assert.ok(files.overview.includes('Project Snapshot'));
  assert.ok(files.overview.includes('data-open-project'));
  assert.ok(files.overview.includes('data-open-agent'));
});

test('approved detail chevron rows navigate to real V7 sub-screens',()=>{
  for(const route of ['kdp-history','tracking-integrations'])assert.ok(files.app.includes(`'${route}'`),`missing project detail route: ${route}`);
  assert.ok(files.app.includes('function kdpHistoryScreen('));
  assert.ok(files.app.includes('function trackingIntegrationsScreen('));
  assert.match(files.app,/data-detail-view="\$\{esc\(view\)\}"/);
  assert.match(files.app,/const detail=target\.closest\('\[data-detail-view\]'\)/);
  assert.ok(files.app.includes("detailLink('KDP Snapshot History'"));
  assert.ok(files.app.includes("detailLink('Tracking Integrations'"));
});

test('informational project rows are not fake buttons',()=>{
  assert.match(files.app,/function infoRow\([\s\S]*?<div class="cc-card cc-row-link" role="group">/);
  assert.ok(files.app.includes("infoRow('Next Action'"));
  assert.ok(files.app.includes("infoRow('Blocker / Integrity'"));
  assert.ok(files.app.includes("infoRow('Verification'"));
});

test('detail navigation text stays above card artwork',()=>{
  assert.match(files.layout,/\.cc-row-link>div\{position:relative;z-index:2\}/);
  assert.match(files.layout,/button\.cc-row-link\{appearance:none;width:100%;color:#fff;text-align:left;cursor:pointer\}/);
});

test('Agent owner controls and explicit project selector are present',()=>{
  for(const label of ['AUTO','Next Step','Until Work / Next Work Boundary','Manual Task','Project Checkpoint','Stop Agent','ccAgentProjectSelector'])assert.ok(files.app.includes(label),`missing Agent control: ${label}`);
});

test('Agent owner controls use only atomic V7 owner RPC actions',()=>{
  for(const rpc of [
    'cc7_agent_owner_set_auto',
    'cc7_agent_owner_create_run',
    'cc7_agent_owner_project_checkpoint',
    'cc7_agent_owner_pause_run',
    'cc7_agent_owner_resume_run',
    'cc7_agent_owner_stop_run',
    'cc7_agent_owner_resolve_approval'
  ])assert.ok(files.data.includes(`client.rpc('${rpc}'`),`missing atomic V7 Agent RPC wiring: ${rpc}`);
  assert.doesNotMatch(files.data,/client\.from\('cc7_agent_runs'\)\.insert/);
  assert.doesNotMatch(files.data,/client\.from\('cc7_agent_runs'\)\.update/);
  assert.doesNotMatch(files.data,/client\.from\('cc7_agent_controls'\)\.update/);
  assert.doesNotMatch(files.data,/client\.from\('cc7_agent_approvals'\)\.update/);
});

test('Project Checkpoint is immediate and does not queue worker execution',()=>{
  assert.ok(files.data.includes('createProjectCheckpoint('));
  assert.ok(files.app.includes('createProjectCheckpoint(state.ownerId,projectId)'));
  assert.match(files.app,/if\(mode==='project_checkpoint'\)[\s\S]*?createProjectCheckpoint\(state\.ownerId,projectId\)[\s\S]*?checkpoint complete/);
  assert.match(files.app,/Instant status review only\. No execution or side effects\./);
  assert.ok(files.data.includes('latestCheckpoint'));
});

test('Agent UI dispatches owner controls through the V7 data layer',()=>{
  for(const fn of ['setAuto','createAgentRun','createProjectCheckpoint','requestPause','requestResume','requestStop','resolveApproval'])assert.ok(files.app.includes(`${fn}(`),`Agent UI is not wired to ${fn}`);
  for(const mode of ['next_step','until_work','manual_task','project_checkpoint'])assert.ok(files.app.includes(`'${mode}'`),`missing Agent control mode: ${mode}`);
  assert.match(files.app,/data-action="toggle-auto"/);
  assert.match(files.app,/data-agent-action="\$\{esc\(action\)\}"/);
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
  assert.match(files.overview,/m\?\.verified===true/);
});

test('screenshot-first visual primitives are defined',()=>{
  for(const cls of ['cc-card','cc-icon-frame','cc-progress','cc-live-row','cc-next-row','cc-hero','cc-metrics','cc-covers','cc-pub-grid'])assert.ok(files.theme.includes(`.${cls}`)||files.layout.includes(`.${cls}`),`missing visual primitive: ${cls}`);
});

test('fresh V7 atmospheric artwork is loaded and isolated',()=>{
  assert.match(files.html,/\.\/artwork\.css\?v=4/);
  for(const asset of ['header-planet.svg','landscape-eclipse.svg','neural-globe.svg','analytics-grid.svg','road-mountains.svg','network-globe.svg','time-portal.svg','server-racks.svg','merch-cases.svg','city-spires.svg','mobile-horizon.svg']){
    assert.ok(files.artwork.includes(asset)||files.sw.includes(asset),`missing clean artwork asset: ${asset}`);
  }
});

test('Android navigation has one scroll-restoration owner',()=>{
  assert.match(files.pwa,/history\.scrollRestoration='manual'/);
  assert.match(files.app,/addEventListener\('popstate'/);
  assert.match(files.app,/state\.scroll\.get\(routeUrl\(state\.route\)\)/);
});

test('clean PWA is isolated and fail-safe offline',()=>{
  const manifest=JSON.parse(files.manifest);
  assert.equal(manifest.scope,'./');
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.theme_color,'#000000');
  assert.ok(manifest.icons.some(i=>i.sizes==='512x512'&&i.src.includes('command-center-approved-icon-512.png')));
  assert.match(files.html,/\.\/manifest\.webmanifest\?v=4/);
  assert.match(files.html,/\.\/pwa\.js\?v=4/);
  assert.match(files.pwa,/authoritative-v7\/service-worker\.js/);
  assert.match(files.sw,/command-center-v7-clean-7/);
  assert.match(files.sw,/\.\/overview-screens\.js/);
  assert.match(files.offline,/No cached screen is being presented as current/);
});

test('protected approved 512 launcher artwork is exact',()=>{
  const hash=createHash('sha256').update(approvedIcon512).digest('hex');
  assert.equal(hash,'fa48e34b6240ca37ad74492dec150cfebaed60aed404707f79b68b9b3157b7aa');
});