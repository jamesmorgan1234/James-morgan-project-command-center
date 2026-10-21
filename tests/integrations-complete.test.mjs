import fs from 'node:fs';
import assert from 'node:assert/strict';

const ui=fs.readFileSync('command-center-integrations.js','utf8');
const emailUi=fs.readFileSync('command-center-integrations-email.js','utf8');
const completion=fs.readFileSync('command-center-integrations-completion.js','utf8');
const css=fs.readFileSync('command-center-integrations.css','utf8');
const migration=fs.readFileSync('supabase/migrations/20261021_integrations_complete.sql','utf8');
const records=fs.readFileSync('supabase/migrations/20261021_integrations_normalized_records.sql','utf8');
const cryptoFix=fs.readFileSync('supabase/migrations/20261021_integrations_crypto_schema_fix.sql','utf8');
const scopeRouting=fs.readFileSync('supabase/migrations/20261021_integrations_scope_routing_fix.sql','utf8');
const bridge=fs.readFileSync('supabase/migrations/20261021_integrations_webhook_service_bridge.sql','utf8');
const edge=fs.readFileSync('supabase/functions/command-center-integration-webhook/index.ts','utf8');
const standard=fs.readFileSync('INTEGRATIONS_PROVIDER_STANDARD.md','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const html=fs.readFileSync('index.html','utf8');

assert.doesNotThrow(()=>new Function(ui));assert.doesNotThrow(()=>new Function(emailUi));assert.doesNotThrow(()=>new Function(completion));
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length);
for(const table of ['integration_connections','integration_permissions','integration_sync_runs','integration_source_events','integration_metrics','integration_write_requests','integration_webhook_endpoints','integration_health_events'])assert.ok(migration.includes(`public.${table}`));
assert.match(records,/create table if not exists public\.integration_records/);assert.match(records,/email\.message/);assert.match(records,/Full sensitive bodies are not stored by the generic normalizer/);assert.match(records,/integration_records_select_own/);
assert.match(migration,/One row per provider account\/profile\/channel\. Multiple rows for the same provider are expected and supported/);assert.doesNotMatch(migration,/unique\s*\(owner_id\s*,\s*provider_key\s*\)/i);assert.match(migration,/owner_id,provider_key,external_account_id/);
assert.match(migration,/social\.followers/);assert.match(migration,/social\.subscribers/);assert.match(migration,/revenue\.reported/);assert.match(migration,/content\.watch_time_seconds/);assert.match(migration,/scope_authorized/);assert.match(migration,/authorization_state<>'authorized'/);assert.match(migration,/configuration_preserved/);assert.match(migration,/idempotency_key/);assert.match(migration,/enable row level security/g);
assert.match(cryptoFix,/extensions\.gen_random_bytes/);assert.match(cryptoFix,/extensions\.digest/);assert.match(scopeRouting,/email_metadata/);assert.match(scopeRouting,/records/);assert.match(scopeRouting,/Required read scope is not authorized for this payload/);assert.match(scopeRouting,/payload_scopes_authorized/);assert.match(bridge,/to service_role/);assert.doesNotMatch(bridge,/to authenticated/);assert.match(edge,/x-command-center-webhook-secret/);assert.match(edge,/SHA-256/);assert.match(edge,/command_center_integration_webhook_ingest_service/);
for(const provider of ['YouTube','TikTok','Instagram','Facebook Page','Snapchat','Pinterest','X','Threads','Rumble','Dailymotion'])assert.ok(standard.includes(provider));
for(const provider of ['LinkedIn','Fanvue','Yahoo Mail','Gmail / Google Workspace','Microsoft Outlook / Microsoft 365','Proton Mail'])assert.ok(standard.includes(provider));
assert.match(standard,/A provider\/platform is not an account/);assert.match(standard,/Full email bodies and attachment content are more sensitive/);assert.match(standard,/Multiple company Gmail\/Outlook mailboxes must never be silently merged/);
assert.match(ui,/Account \/ channel label/);assert.match(ui,/Followers/);assert.match(ui,/Subscribers/);assert.match(ui,/Reported revenue/);assert.match(ui,/Unsupported values remain N\/A/);assert.match(ui,/command_center_integration_ingest/);assert.match(ui,/command_center_integration_check_health/);assert.match(ui,/command_center_integration_reconnect/);assert.match(ui,/command_center_integration_rotate_webhook_secret/);assert.match(ui,/command_center_integration_execute_write/);
assert.match(emailUi,/integration_records/);assert.match(emailUi,/Yahoo, Gmail, Outlook, Proton/);assert.match(emailUi,/email_metadata/);assert.match(emailUi,/email_content/);assert.match(emailUi,/Full body content requires an explicit deeper-content permission/);
assert.match(completion,/8 of 8 phases complete/);assert.match(completion,/ccIntegrationsMount/);
for(const asset of ['command-center-integrations.css?v=1','command-center-integrations.js?v=1','command-center-integrations-email.js?v=1','command-center-integrations-completion.js?v=1']){assert.ok(cfg.includes(asset));assert.ok(sw.includes(asset));}
assert.match(cfg,/command-center-analytics\.js\?v=1/);assert.match(cfg,/command-center-security\.js\?v=1/);assert.match(cfg,/command-center-deployment\.js\?v=1/,'Deployment release must preserve and extend Integrations');assert.match(sw,/james-command-center-v70/);assert.match(html,/app-config\.js\?v=26/);assert.match(html,/minimum-scale=1,maximum-scale=1,user-scalable=no/);assert.match(html,/cc-startup-repair-attempted-v63/);
console.log('Integrations QA preserved under Agent Mode release, including multi-account social and multi-mailbox email support.');