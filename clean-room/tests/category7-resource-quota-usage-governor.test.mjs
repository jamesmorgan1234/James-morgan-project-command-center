import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const governorUrl = new URL(
  "../../supabase/migrations/20261025020000_category7_resource_quota_usage_governor.sql",
  import.meta.url
);
const hardeningUrl = new URL(
  "../../supabase/migrations/20261025020100_category7_resource_quota_usage_reconciliation_hardening.sql",
  import.meta.url
);
const governor = () => readFile(governorUrl, "utf8");
const hardening = () => readFile(hardeningUrl, "utf8");

test("A10 governor uses exact integer micro-USD accounting and durable owner-scoped buckets", async () => {
  const sql = await governor();
  assert.ok(sql.includes("integer micro-USD"));
  assert.match(sql, /cost_limit_microusd bigint not null default 0/i);
  assert.match(sql, /reserved_cost_microusd bigint not null default 0/i);
  assert.match(sql, /consumed_cost_microusd bigint not null default 0/i);
  assert.match(sql, /unique\(owner_id,project_id,company_id,account_id,environment,provider_key,resource_kind,period_key\)/i);
  assert.doesNotMatch(sql, /double precision|real\s+not null/i);
});

test("A10.1/A10.2 default to zero budget and deny unknown pricing", async () => {
  const sql = await governor();
  assert.match(sql, /unit_limit bigint not null default 0/i);
  assert.match(sql, /cost_limit_microusd bigint not null default 0/i);
  assert.match(sql, /unknown_pricing_policy text not null default 'deny'/i);
  assert.match(sql, /values\([^;]*,0,0,'deny','active',1,/is);
  assert.match(sql, /if p_estimated_cost_microusd is null then raise exception 'Unknown pricing denied'/i);
});

test("positive monetary quota requires explicit paid-budget authorization evidence", async () => {
  const sql = await governor();
  assert.match(sql, /cost_limit_microusd=0 or length\(btrim\(coalesce\(paid_budget_authorization_ref,''\)\)\)>0/i);
  assert.match(sql, /if p_cost_limit_microusd>0 and coalesce\(btrim\(p_paid_budget_authorization_ref\),''\)='' then raise exception 'Positive monetary quota requires exact paid-budget authorization evidence'/i);
});

test("A10.3 reservations serialize a provider-specific bucket and atomically account reserved capacity", async () => {
  const sql = await governor();
  assert.match(sql, /pg_advisory_xact_lock\(command_center_private\.c7_quota_lock_key/i);
  assert.match(sql, /provider_key\) and resource_kind=btrim\(p_resource_kind\) and period_key=btrim\(p_period_key\) for update/i);
  assert.match(sql, /p_requested_units > b\.unit_limit-b\.consumed_units-b\.reserved_units/i);
  assert.match(sql, /p_estimated_cost_microusd > b\.cost_limit_microusd-b\.consumed_cost_microusd-b\.reserved_cost_microusd/i);
  assert.match(sql, /set reserved_units=reserved_units\+p_requested_units,reserved_cost_microusd=reserved_cost_microusd\+p_estimated_cost_microusd/i);
});

test("quota reservation is idempotent and rejects changed intent or scope", async () => {
  const sql = await governor();
  assert.match(sql, /unique\(owner_id,idempotency_key\)/i);
  assert.match(sql, /Quota idempotency key reuse with modified intent or scope/i);
  assert.match(sql, /'duplicate',true/i);
  assert.match(sql, /r\.intent_hash<>p_intent_hash/i);
  assert.match(sql, /b\.provider_key<>btrim\(p_provider_key\)/i);
});

test("fallback providers cannot share another provider's quota reservation", async () => {
  const sql = await governor();
  assert.match(sql, /c7_quota_lock_key\(u,btrim\(p_project_id\),v_company,v_account,p_environment,btrim\(p_provider_key\),btrim\(p_resource_kind\),btrim\(p_period_key\)\)/i);
  assert.match(sql, /b\.provider_key<>btrim\(p_provider_key\)/i);
  assert.match(sql, /unique\(owner_id,project_id,company_id,account_id,environment,provider_key,resource_kind,period_key\)/i);
});

test("release expiry and settlement are generation-bound and return reserved capacity exactly once", async () => {
  const sql = await governor();
  assert.match(sql, /r\.state<>'reserved' or r\.generation<>p_expected_generation/i);
  assert.match(sql, /reserved_units=reserved_units-r\.requested_units,reserved_cost_microusd=reserved_cost_microusd-r\.estimated_cost_microusd/i);
  assert.match(sql, /set state=v_state,generation=generation\+1/i);
  assert.match(sql, /state='expired',generation=generation\+1/i);
  assert.match(sql, /state='settled_pending_receipt',generation=generation\+1/i);
});

test("unexpected actual usage is recorded truthfully and breaches the bucket instead of disappearing", async () => {
  const sql = await governor();
  assert.match(sql, /consumed_units=consumed_units\+p_actual_units,consumed_cost_microusd=consumed_cost_microusd\+p_actual_cost_microusd/i);
  assert.match(sql, /state=case when v_breached then 'breached' else state end/i);
  assert.match(sql, /if b\.state<>'active' then raise exception 'Quota bucket is not active'/i);
  assert.match(sql, /provider_reconciliation_required',true/i);
});

test("A10.5 provider usage receipts have stable dedupe identity and reject changed receipt payloads", async () => {
  const sql = await governor();
  assert.match(sql, /create table if not exists public\.command_center_provider_usage_receipts/i);
  assert.match(sql, /unique\(owner_id,provider_key,account_id,environment,provider_receipt_id\)/i);
  assert.match(sql, /Provider usage receipt identity collision with modified payload or reservation/i);
  assert.match(sql, /Provider usage receipt must report known non-negative usage and cost/i);
});

test("A10.5 reconciliation aggregates provider receipts and only matched truth becomes reconciled", async () => {
  const sql = await governor();
  assert.match(sql, /sum\(reported_units\)/i);
  assert.match(sql, /sum\(reported_cost_microusd\)/i);
  assert.match(sql, /v_state:='matched'/i);
  assert.match(sql, /v_state:='provider_higher'/i);
  assert.match(sql, /v_state:='internal_higher'/i);
  assert.match(sql, /v_state:='mixed_mismatch'/i);
  assert.match(sql, /if v_state='matched' then[\s\S]*set state='reconciled'/i);
});

test("late nonduplicate receipts reopen reconciliation while duplicates do not", async () => {
  const sql = await hardening();
  assert.match(sql, /v_reopened boolean:=false/i);
  assert.match(sql, /if found then[\s\S]*'reconciliation_reopened',false/is);
  assert.match(sql, /if r\.state='reconciled' then[\s\S]*v_reopened:=true[\s\S]*set state='settled_pending_receipt',generation=generation\+1,reconciled_at=null/is);
  assert.match(sql, /'reconciliation_reopened',v_reopened/i);
});

test("unchanged repeated matched reconciliation is idempotent", async () => {
  const sql = await hardening();
  assert.match(sql, /if r\.state='reconciled' then[\s\S]*x\.state<>'matched'[\s\S]*'duplicate_reconciliation',true/is);
  const duplicateBranch = sql.match(/if r\.state='reconciled' then[\s\S]*?end if;/i)?.[0] ?? "";
  assert.doesNotMatch(duplicateBranch, /generation=generation\+1/i);
});

test("reports and release gates fail closed on open usage mismatch or breached quota", async () => {
  const sql = await governor();
  assert.match(sql, /r\.state in \('reserved','settled_pending_receipt'\)/i);
  assert.match(sql, /x\.state<>'matched'/i);
  assert.match(sql, /state='breached'/i);
  assert.match(sql, /'eligible',v_open=0 and v_mismatch=0 and v_breached=0/i);
  assert.match(sql, /Provider usage reconciliation is incomplete or breached/i);
});

test("quota and usage tables are authenticated read-only; mutations remain RPC-gated", async () => {
  const sql = await governor();
  assert.match(sql, /revoke all on table public\.%I from public,anon,authenticated/i);
  assert.match(sql, /grant select on table public\.%I to authenticated/i);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)\s+on\s+table\s+public\.command_center_(resource|provider)_/i);
  assert.match(sql, /grant execute on function public\.command_center_resource_reserve_quota/i);
  assert.match(sql, /grant execute on function public\.command_center_resource_assert_usage_reconciled/i);
});