import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const webhookUrl = new URL("../src/security/webhooks.ts", import.meta.url);
const baseMigrationUrl = new URL("../../supabase/migrations/20261025014500_category7_side_effect_outbox_inbox.sql", import.meta.url);
const hardeningMigrationUrl = new URL("../../supabase/migrations/20261025210000_category7_durable_provider_callback_hardening.sql", import.meta.url);

test("R4 callback signature binds provider bytes and callback metadata in one canonical envelope", async () => {
  const source = await readFile(webhookUrl, "utf8");
  const canonicalStart = source.indexOf("export function canonicalWebhookSignedPayload");
  const gateStart = source.indexOf("export class WebhookAcceptanceGate");
  assert.ok(canonicalStart >= 0 && gateStart > canonicalStart);
  const canonical = source.slice(canonicalStart, gateStart);
  const gate = source.slice(gateStart);

  assert.match(canonical, /WEBHOOK_BINDING_VERSION/);
  assert.match(canonical, /envelope\.providerKey/);
  assert.match(canonical, /envelope\.eventId/);
  assert.match(canonical, /envelope\.accountId/);
  assert.match(canonical, /envelope\.companyId/);
  assert.match(canonical, /envelope\.environment/);
  assert.match(canonical, /envelope\.occurredAt/);
  assert.match(canonical, /envelope\.receivedAt/);
  assert.match(canonical, /envelope\.keyRef/);
  assert.match(canonical, /envelope\.sequence/);
  assert.match(canonical, /envelope\.signedPayload/);
  assert.match(gate, /canonicalWebhookSignedPayload\(envelope\)/);
  assert.match(gate, /this\.verifySignature\(envelope\.keyRef, canonicalSignedPayload, envelope\.signature\)/);
  assert.doesNotMatch(gate, /verifySignature\(envelope\.keyRef, envelope\.signedPayload/);
});

test("R4 callback key rotation and revocation are explicitly time bounded", async () => {
  const source = await readFile(webhookUrl, "utf8");
  assert.match(source, /interface WebhookKeyWindow/);
  assert.match(source, /readonly notBefore: string/);
  assert.match(source, /readonly notAfter: string/);
  assert.match(source, /readonly revokedAt\?: string/);
  assert.match(source, /notAfter <= notBefore/);
  assert.match(source, /received < notBefore \|\| received >= notAfter/);
  assert.match(source, /received >= revokedAt/);
  assert.match(source, /callback_key_revoked/);
  assert.doesNotMatch(source, /readonly activeKeyRefs/);
});

test("R4 process memory is not authoritative for callback dedupe or ordering", async () => {
  const source = await readFile(webhookUrl, "utf8");
  assert.doesNotMatch(source, /#seen\s*=/);
  assert.doesNotMatch(source, /#latestSequence\s*=/);
  assert.doesNotMatch(source, /new Set<string>/);
  assert.doesNotMatch(source, /new Map<string, number>/);
  assert.match(source, /durablePersistenceRequired: true/);
  assert.match(source, /advancesAuthoritativeCursor: false/);
  assert.match(source, /accepted_requires_durable_persistence/);
});

test("R4 hardening extends the canonical Category 7 inbox instead of creating a parallel callback queue", async () => {
  const sql = await readFile(hardeningMigrationUrl, "utf8");
  assert.match(sql, /alter table public\.command_center_agency_side_effect_inbox/);
  assert.match(sql, /command_center_agency_record_authenticated_side_effect_inbox/);
  assert.doesNotMatch(sql, /create table/i);
  assert.doesNotMatch(sql, /create\s+table[\s\S]*(callback|webhook)/i);
  assert.match(sql, /callback_binding_version='cc-webhook-v1'/);
  assert.match(sql, /callback_binding_hash ~ '\^\[a-f0-9\]\{64\}\$'/);
});

test("R4 durable inbox serializes provider/account streams and survives process restart", async () => {
  const sql = await readFile(hardeningMigrationUrl, "utf8");
  const functionStart = sql.indexOf("create or replace function public.command_center_agency_record_authenticated_side_effect_inbox");
  assert.ok(functionStart >= 0);
  const fn = sql.slice(functionStart);
  assert.match(fn, /pg_advisory_xact_lock/);
  assert.match(fn, /hashtextextended/);
  assert.match(fn, /from public\.command_center_agency_side_effect_inbox/);
  assert.match(fn, /select max\(provider_sequence\)/);
  assert.match(fn, /v_state:='out_of_order'/);
  assert.match(fn, /insert into public\.command_center_agency_side_effect_inbox/);
  assert.match(fn, /'durable',true/);
});

test("R4 duplicate identity collision checks authenticated semantic metadata", async () => {
  const sql = await readFile(hardeningMigrationUrl, "utf8");
  assert.match(sql, /i\.provider_event_hash<>p_provider_event_hash/);
  assert.match(sql, /i\.project_id<>btrim\(p_project_id\)/);
  assert.match(sql, /i\.environment<>p_environment/);
  assert.match(sql, /i\.effect_id is distinct from p_effect_id/);
  assert.match(sql, /i\.company_id is distinct from/);
  assert.match(sql, /i\.provider_sequence is distinct from p_provider_sequence/);
  assert.match(sql, /i\.callback_occurred_at is distinct from p_callback_occurred_at/);
  assert.match(sql, /modified authenticated payload\/scope\/metadata/);
});

test("R4 retires the unbound authenticated write path and refuses unbound application", async () => {
  const sql = await readFile(hardeningMigrationUrl, "utf8");
  assert.match(sql, /revoke execute on function public\.command_center_agency_record_side_effect_inbox[\s\S]*from authenticated/);
  assert.match(sql, /grant execute on function public\.command_center_agency_record_authenticated_side_effect_inbox[\s\S]*to authenticated/);
  assert.match(sql, /i\.callback_binding_version<>'cc-webhook-v1'/);
  assert.match(sql, /Inbox event lacks authenticated callback binding/);
});

test("R4 lost or uncertain external effects reconcile from evidence instead of fabricated success", async () => {
  const base = await readFile(baseMigrationUrl, "utf8");
  const hardening = await readFile(hardeningMigrationUrl, "utf8");
  assert.match(base, /command_center_agency_mark_stale_dispatched_unknown/);
  assert.match(base, /command_center_agency_reconcile_unknown_side_effect/);
  assert.match(base, /p_resolution not in \('no_effect','succeeded'\)/);
  assert.match(base, /Side-effect reconciliation requires evidence/);
  assert.match(hardening, /callback loss\/uncertainty never implies success/i);
  assert.doesNotMatch(hardening, /set\s+state='succeeded'/i);
});
