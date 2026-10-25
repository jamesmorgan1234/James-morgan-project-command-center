import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationUrl = new URL(
  "../../supabase/migrations/20261025014500_category7_side_effect_outbox_inbox.sql",
  import.meta.url
);
const migration = () => readFile(migrationUrl, "utf8");

test("A06.4 persists side-effect intent in a durable owner-scoped outbox before dispatch", async () => {
  const sql = await migration();
  assert.match(sql, /create table if not exists public\.command_center_agency_side_effect_outbox/i);
  assert.match(sql, /unique\(owner_id,idempotency_key\)/i);
  assert.match(sql, /foreign key\(owner_id,project_id,run_id\) references public\.command_center_agency_runs/i);
  assert.match(sql, /command_center_agency_prepare_side_effect/i);
  assert.match(sql, /values\([^;]*'prepared'/is);
  assert.match(sql, /Idempotency key reuse with modified side-effect intent/);
  assert.match(sql, /'duplicate',true/);
});

test("side-effect claims are atomic, fenced, and exclude dispatched or unknown effects from retry", async () => {
  const sql = await migration();
  assert.match(sql, /for update skip locked limit 1/i);
  assert.match(sql, /state in \('prepared','failed_no_effect','reconciled_no_effect'\)/i);
  assert.match(sql, /or \(state='claimed' and claim_expires_at<=p_now\)/i);
  assert.doesNotMatch(sql, /state in \([^)]*'dispatched'[^)]*\)[^;]*for update skip locked limit 1/is);
  assert.doesNotMatch(sql, /state in \([^)]*'unknown'[^)]*\)[^;]*for update skip locked limit 1/is);
  assert.match(sql, /v_next_generation:=e\.dispatch_generation\+1/);
  assert.match(sql, /dispatch_generation=v_next_generation/);
});

test("dispatch is generation-bound and records external-effect possibility before any retry can occur", async () => {
  const sql = await migration();
  assert.match(sql, /command_center_agency_mark_side_effect_dispatched/);
  assert.match(sql, /e\.state<>'claimed' or e\.dispatch_generation<>p_expected_generation or e\.claimed_by<>btrim\(p_worker_ref\)/);
  assert.match(sql, /set state='dispatched',external_effect_possible=true/);
  assert.match(sql, /'state','dispatched'[^;]*'retry_allowed',false/is);
  assert.match(sql, /Side-effect dispatch claim\/generation conflict/);
});

test("unknown external outcomes must reconcile to no-effect or succeeded before retry", async () => {
  const sql = await migration();
  assert.match(sql, /p_outcome not in \('succeeded','failed_no_effect','unknown'\)/);
  assert.match(sql, /state='dispatched' and last_dispatched_at<=p_dispatched_before/);
  assert.match(sql, /set state='unknown'/);
  assert.match(sql, /Only unknown side effects may be reconciled/);
  assert.match(sql, /p_resolution not in \('no_effect','succeeded'\)/);
  assert.match(sql, /case when p_resolution='no_effect' then 'reconciled_no_effect' else 'reconciled_succeeded' end/);
  assert.match(sql, /'retry_allowed',p_resolution='no_effect'/);
});

test("provider inbox deduplicates stable event identity and rejects changed payload scope or effect binding", async () => {
  const sql = await migration();
  assert.match(sql, /create table if not exists public\.command_center_agency_side_effect_inbox/i);
  assert.match(sql, /unique\(owner_id,provider_key,account_id,provider_event_id\)/i);
  assert.match(sql, /Provider event identity collision with modified payload\/scope\/effect/);
  assert.match(sql, /i\.effect_id is distinct from p_effect_id/);
  assert.match(sql, /'duplicate',true,'apply_allowed',false/);
});

test("provider sequence regression is retained as out-of-order rather than auto-applied", async () => {
  const sql = await migration();
  assert.match(sql, /select max\(provider_sequence\) into v_max_sequence/i);
  assert.match(sql, /p_provider_sequence<v_max_sequence then v_state:='out_of_order'/);
  assert.match(sql, /'apply_allowed',v_state='received'/);
  assert.match(sql, /if i\.state<>'received' then raise exception 'Inbox event is not eligible for application'/);
});

test("inbox application is idempotent and scoped to an owner project effect", async () => {
  const sql = await migration();
  assert.match(sql, /if i\.state='applied' then return jsonb_build_object\('inbox_id',i\.inbox_id,'state','applied','duplicate_apply',true\)/);
  assert.match(sql, /where owner_id=u and project_id=i\.project_id and effect_id=p_effect_id/);
  assert.match(sql, /set state='applied'/);
  assert.match(sql, /Inbox application requires evidence/);
});

test("side-effect tables are authenticated read-only and mutations remain RPC-gated", async () => {
  const sql = await migration();
  assert.match(sql, /revoke all on table public\.%I from public,anon,authenticated/i);
  assert.match(sql, /grant select on table public\.%I to authenticated/i);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)\s+on\s+table\s+public\.command_center_agency_side_effect_(outbox|inbox|events)\s+to\s+authenticated/i);
  assert.match(sql, /grant execute on function public\.command_center_agency_prepare_side_effect\(text,text,text,text,text,text,text,text,text,text,text,text,text\[],timestamptz\) to authenticated/i);
  assert.match(sql, /grant execute on function public\.command_center_agency_reconcile_unknown_side_effect/i);
  assert.match(sql, /grant execute on function public\.command_center_agency_record_side_effect_inbox/i);
});