import fs from 'node:fs';
import assert from 'node:assert/strict';

const ui=fs.readFileSync('command-center-analytics.js','utf8');
const completion=fs.readFileSync('command-center-analytics-completion.js','utf8');
const css=fs.readFileSync('command-center-analytics.css','utf8');
const migration=fs.readFileSync('supabase/migrations/20261021_analytics_complete.sql','utf8');
const triggerFix=fs.readFileSync('supabase/migrations/20261021_analytics_trigger_insert_fix.sql','utf8');
const clockFix=fs.readFileSync('supabase/migrations/20261021_analytics_history_clock_fix.sql','utf8');
const standard=fs.readFileSync('ANALYTICS_STANDARD.md','utf8');
const cfg=fs.readFileSync('app-config.js','utf8');
const sw=fs.readFileSync('service-worker.js','utf8');
const html=fs.readFileSync('index.html','utf8');

assert.doesNotThrow(()=>new Function(ui),'Analytics UI must parse');
assert.doesNotThrow(()=>new Function(completion),'Analytics completion patch must parse');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Analytics CSS braces must balance');

for(const table of ['analytics_metric_catalog','analytics_metric_history','analytics_goals','analytics_anomalies']){
  assert.match(migration,new RegExp(`create table if not exists public\\.${table}`,'i'),`missing ${table}`);
  assert.match(migration,new RegExp(`alter table public\\.${table} enable row level security`,'i'),`${table} must use RLS`);
  assert.match(migration,new RegExp(`revoke all on public\\.${table} from anon,authenticated`,'i'),`${table} must explicitly revoke implicit browser grants`);
}
for(const view of ['analytics_metric_series','analytics_latest_by_source','analytics_project_kpis','analytics_portfolio_rollups','analytics_goal_progress'])assert.match(migration,new RegExp(`view public\\.${view} with \\(security_invoker=true\\)`,'i'),`${view} must be a security-invoker view`);
assert.match(migration,/grant select,update on public\.analytics_metric_catalog to authenticated/);
assert.match(migration,/grant select on public\.analytics_metric_history to authenticated/);
assert.match(migration,/grant select,insert,update,delete on public\.analytics_goals to authenticated/);
assert.match(migration,/grant select,update on public\.analytics_anomalies to authenticated/);
assert.match(migration,/command_center_private\.analytics_ensure_catalog/,'real metrics must auto-register in the catalog');
assert.match(migration,/analytics_capture_legacy_metric/,'legacy verified KPI changes must be captured into history');
assert.match(clockFix,/clock_timestamp\(\)/,'multiple verified changes in one transaction must receive distinct observation times');
assert.match(triggerFix,/if tg_op='INSERT' then/,'INSERT triggers must not depend on OLD');
assert.match(migration,/rollup_method text not null default 'latest'.*sum.*average.*latest.*none/s,'catalog must define conservative rollup methods');
assert.match(migration,/group by s\.owner_id,s\.metric_key,s\.unit,s\.currency/,'portfolio rollups must keep unit and currency compatibility boundaries');
assert.match(migration,/scope_kind text not null check \(scope_kind in \('project','portfolio'\)\)/,'goals must support project and portfolio scope');
assert.match(migration,/anomaly_threshold_percent is null or anomaly_threshold_percent > 0/,'anomaly thresholds must be explicit and positive');
assert.match(migration,/c\.anomaly_threshold_percent is not null and c\.anomaly_threshold_percent>0/,'anomaly scans must ignore unconfigured metrics');
assert.match(migration,/b\.value_numeric<>0/,'undefined percentage changes from zero baselines must not create anomalies');
assert.match(migration,/on conflict\(owner_id,source_key,metric_key,observed_at\) do nothing/,'anomaly scans must be idempotent');
assert.match(migration,/if u is null or not public\.is_command_center_authorized\(\) then raise exception 'Unauthorized'/,'public anomaly RPC must authorize the caller');
assert.match(migration,/revoke all on function public\.command_center_analytics_scan_anomalies\(text\) from public,anon,authenticated/);
assert.doesNotMatch(migration,/values\s*\([^;]*qa\.analytics/i,'migration must not seed QA metric observations');

for(const phase of ['Metric Catalog','Project KPI Views','Portfolio Rollups','Time-Series History','Trend Comparison','Goal Tracking','Anomaly Detection'])assert.ok(ui.includes(phase),`Analytics UI missing ${phase}`);
assert.match(completion,/7 of 7 phases complete/,'Analytics capability must expose exactly seven completed phases');
assert.match(completion,/ccAnalyticsMount/,'Analytics capability must mount its workspace');
assert.match(ui,/analytics_metric_catalog/);assert.match(ui,/analytics_project_kpis/);assert.match(ui,/analytics_portfolio_rollups/);assert.match(ui,/analytics_metric_series/);assert.match(ui,/analytics_goal_progress/);assert.match(ui,/analytics_anomalies/);
assert.match(ui,/COMMAND_CENTER_SUPABASE/,'Analytics must reuse the canonical authenticated client');
assert.match(ui,/no interpolation/i,'history must disclose its no-interpolation rule');
assert.match(ui,/not a forecast/i,'trend comparison must not masquerade as forecasting');
assert.doesNotMatch(ui,/service_role|secret_key|OPENAI_API_KEY|sk-[A-Za-z0-9]/,'Analytics browser code must not contain privileged credentials');

for(const term of ['Different currencies are never silently combined','No interpolation, forecasting or synthetic missing points','An anomaly is a review signal, not a diagnosis'])assert.ok(standard.includes(term),`Analytics standard missing: ${term}`);
for(const asset of ['command-center-analytics.css?v=1','command-center-analytics.js?v=1','command-center-analytics-completion.js?v=1']){
  assert.ok(cfg.includes(asset),`app config missing ${asset}`);
  assert.ok(sw.includes(`'./${asset}'`),`PWA cache missing ${asset}`);
  assert.ok(sw.includes(`pathname.endsWith('/${asset.split('?')[0]}')`),`fresh-asset list missing ${asset}`);
}
assert.match(html,/loadLocal\('\.\/app-config\.js\?v=23',6000\)/,'Analytics release must load app-config v23');
assert.match(sw,/james-command-center-v67/,'Analytics release must use PWA cache v67');
assert.ok(sw.includes("'./app-config.js?v=23'"));
assert.match(html,/minimum-scale=1,maximum-scale=1,user-scalable=no/,'protected viewport lock must remain intact');
assert.match(html,/cc-startup-repair-attempted-v63/,'protected startup-repair marker must remain unchanged');

console.log('Analytics seven-phase completion QA passed.');