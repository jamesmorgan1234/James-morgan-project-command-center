import fs from 'node:fs';
import assert from 'node:assert/strict';

const ui=fs.readFileSync('command-center-integrations.js','utf8');
const completion=fs.readFileSync('command-center-integrations-completion.js','utf8');
const css=fs.readFileSync('command-center-integrations.css','utf8');
const migration=fs.readFileSync('supabase/migrations/20261021_integrations_complete.sql','utf8');
const bridge=fs.readFileSync('supabase/migrations/20261021_integrations_webhook_service_bridge.sql','utf8');
const edge=fs.readFileSync('supabase/functions/command-center-integration-webhook/index.ts','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const html=fs.readFileSync('index.html','utf8');

assert.doesNotThrow(()=>new Function(ui),'Integrations UI must parse');
assert.doesNotThrow(()=>new Function(completion),'Integrations completion patch must parse');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Integrations CSS braces must balance');

for(const table of ['integration_connections','integration_permissions','integration_sync_runs','integration_source_events','integration_metrics','integration_write_requests','integration_webhook_endpoints','integration_health_events'])assert.ok(migration.includes(`public.${table}`),`missing ${table}`);
assert.match(migration,/One row per provider account\/profile\/channel\. Multiple rows for the same provider are expected and supported/,'schema must explicitly support multiple accounts per provider');
assert.doesNotMatch(migration,/unique\s*\(owner_id\s*,\s*provider_key\s*\)/i,'provider key alone must never force one-account-per-platform');
assert.match(migration,/owner_id,provider_key,external_account_id/,'external account identity must be unique only when known');
assert.match(migration,/social\.followers/);
assert.match(migration,/social\.subscribers/);
assert.match(migration,/revenue\.reported/);
assert.match(migration,/content\.watch_time_seconds/);
assert.match(migration,/scope_authorized/,'read/write operations must be permission-gated');
assert.match(migration,/authorization_state<>'authorized'/,'writes must require explicit authorization');
assert.match(migration,/configuration_preserved/,'reconnect must preserve connection configuration');
assert.match(migration,/idempotency_key/,'sync and writes must be idempotent');
assert.match(migration,/enable row level security/g,'integration tables must use RLS');
assert.match(bridge,/to service_role/,'webhook service bridge must be service-role only');
assert.doesNotMatch(bridge,/to authenticated/,'webhook service bridge must not be browser-callable');
assert.match(edge,/x-command-center-webhook-secret/,'public webhook must authenticate with a per-connection secret');
assert.match(edge,/SHA-256/,'webhook secret must be hashed before database comparison');
assert.match(edge,/command_center_integration_webhook_ingest_service/);

assert.match(ui,/Account \/ channel label/,'UI must model account/channel separately from provider');
assert.match(ui,/Followers/);
assert.match(ui,/Subscribers/);
assert.match(ui,/Reported revenue/);
assert.match(ui,/Unsupported values remain N\/A/);
assert.match(ui,/command_center_integration_ingest/);
assert.match(ui,/command_center_integration_check_health/);
assert.match(ui,/command_center_integration_reconnect/);
assert.match(ui,/command_center_integration_rotate_webhook_secret/);
assert.match(ui,/command_center_integration_execute_write/);
assert.match(completion,/8 of 8 phases complete/);
assert.match(completion,/ccIntegrationsMount/);
assert.match(cfg,/command-center-integrations\.css\?v=1/);
assert.match(cfg,/command-center-integrations\.js\?v=1/);
assert.match(cfg,/command-center-integrations-completion\.js\?v=1/);
assert.match(sw,/james-command-center-v66/);
for(const asset of ['command-center-integrations.css?v=1','command-center-integrations.js?v=1','command-center-integrations-completion.js?v=1'])assert.ok(sw.includes(asset),`PWA cache missing ${asset}`);
assert.match(html,/app-config\.js\?v=22/);
assert.match(html,/minimum-scale=1,maximum-scale=1,user-scalable=no/,'protected viewport must remain fixed');
assert.match(html,/cc-startup-repair-attempted-v63/,'protected startup-repair marker must remain unchanged');

console.log('Integrations complete QA passed.');
