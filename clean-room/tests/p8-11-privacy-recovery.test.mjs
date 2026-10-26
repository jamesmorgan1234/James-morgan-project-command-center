import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { applyPersonalRecovery, dryRunPersonalRestore, planPersonalRecovery } from "../dist/personal/recovery.js";
import { resolveCalendarLocalTime } from "../dist/personal/calendar.js";
import { routeNotifications } from "../dist/personal/notifications.js";

const snapshot = {
  schemaVersion: "cc-personal-recovery-v1",
  id: "backup-1",
  ownerId: "owner-1",
  projectId: "personal-core",
  domain: "personal-ops",
  createdAt: "2026-10-26T15:00:00Z",
  sensitivityRank: 2,
  integrityHash: "sha256:trusted",
  provenanceRefs: ["backup:manifest", "device:trusted"],
  records: [
    { id: "task-1", ownerId: "owner-1", projectId: "personal-core", domain: "personal-ops", sensitivityRank: 2, contentHash: "sha256:record", provenanceRefs: ["task:event"], kind: "data", authorityRef: "auth-current" },
    { id: "receipt-history", ownerId: "owner-1", projectId: "personal-core", domain: "personal-ops", sensitivityRank: 1, contentHash: "sha256:receipt", provenanceRefs: ["agency:receipt"], kind: "receipt_history" }
  ],
  completedOccurrenceKeys: ["automation-1:2026-10-26T14:00:00Z"],
  executionRefs: ["agency-execution:1"],
  receiptRefs: ["agency-receipt:1"],
  completedEffectKeys: ["effect:sent-reminder:1"]
};
const context = {
  ownerId: "owner-1", projectId: "personal-core", domain: "personal-ops",
  now: "2026-10-26T15:30:00Z", maxSensitivityRank: 2,
  trustedIntegrityHash: "sha256:trusted", providerHealth: "available", connectivity: "online",
  maxSnapshotAgeMs: 24 * 60 * 60 * 1000,
  currentAuthorizationRefs: ["auth-current"], revokedAuthorizationRefs: ["auth-revoked"]
};

test("P8.11 restore dry-run preserves completed histories and never grants replay/action authority", () => {
  const plan = planPersonalRecovery(snapshot, context);
  assert.equal(plan.mode, "ready");
  assert.equal(plan.canApply, true);
  assert.equal(plan.protectedActionAuthorized, false);
  assert.deepEqual(plan.completedOccurrenceKeys, snapshot.completedOccurrenceKeys);
  assert.deepEqual(plan.executionRefs, snapshot.executionRefs);
  assert.deepEqual(plan.receiptRefs, snapshot.receiptRefs);
  assert.deepEqual(plan.completedEffectKeys, snapshot.completedEffectKeys);
  const applied = applyPersonalRecovery(snapshot, context);
  assert.deepEqual(applied.replayableCompletedKeys, []);
  assert.equal(applied.protectedActionAuthorized, false);
});

test("P8.11 owner/project/domain/sensitivity/integrity/provenance boundaries fail closed", () => {
  assert.equal(planPersonalRecovery(snapshot, { ...context, ownerId: "owner-2" }).reason, "owner_boundary_mismatch");
  assert.equal(planPersonalRecovery(snapshot, { ...context, projectId: "other" }).reason, "project_boundary_mismatch");
  assert.equal(planPersonalRecovery(snapshot, { ...context, domain: "finance" }).reason, "domain_boundary_mismatch");
  assert.equal(planPersonalRecovery(snapshot, { ...context, maxSensitivityRank: 1 }).reason, "sensitivity_boundary");
  assert.equal(planPersonalRecovery(snapshot, { ...context, trustedIntegrityHash: "sha256:wrong" }).reason, "integrity_mismatch");
  assert.equal(planPersonalRecovery({ ...snapshot, provenanceRefs: [] }, context).reason, "missing_integrity_or_provenance");
  const contaminated = { ...snapshot, records: [...snapshot.records, { id: "foreign", ownerId: "owner-1", projectId: "other", domain: "finance", sensitivityRank: 0, contentHash: "x", provenanceRefs: ["x"] }] };
  const contaminatedPlan = planPersonalRecovery(contaminated, context);
  assert.equal(contaminatedPlan.canApply, false);
  assert.match(contaminatedPlan.rejectedRecords.map((item) => item.reason).join(","), /(project|domain)_boundary_mismatch/);
});

test("P8.11 historical, revoked, expired/stale, or embedded authority cannot resurrect", () => {
  const revoked = { ...snapshot, records: [{ ...snapshot.records[0], authorityRef: "auth-revoked" }] };
  assert.equal(planPersonalRecovery(revoked, context).rejectedRecords[0].reason, "authority_not_current");
  const expired = { ...snapshot, records: [{ ...snapshot.records[0], authorityRef: "auth-expired" }] };
  assert.equal(planPersonalRecovery(expired, context).rejectedRecords[0].reason, "authority_not_current");
  const embedded = { ...snapshot, records: [{ ...snapshot.records[0], kind: "authority" }] };
  assert.equal(planPersonalRecovery(embedded, context).rejectedRecords[0].reason, "authority_not_restorable");
});

test("P8.11 provider loss, offline/stale state, time boundaries, and rollback idempotency defer safely", () => {
  assert.equal(planPersonalRecovery(snapshot, { ...context, providerHealth: "unavailable" }).reason, "provider_unavailable");
  assert.equal(planPersonalRecovery(snapshot, { ...context, providerHealth: "degraded" }).reason, "provider_degraded");
  assert.equal(planPersonalRecovery(snapshot, { ...context, connectivity: "offline" }).reason, "offline");
  assert.equal(planPersonalRecovery(snapshot, { ...context, connectivity: "stale" }).reason, "stale_state");
  assert.equal(planPersonalRecovery(snapshot, { ...context, now: "2026-10-28T15:30:00Z" }).reason, "stale_state");
  assert.equal(planPersonalRecovery(snapshot, { ...context, now: "2026-10-26T14:59:59Z" }).reason, "snapshot_from_future");
  assert.equal(planPersonalRecovery(snapshot, { ...context, appliedSnapshots: [{ id: "backup-1", integrityHash: "sha256:trusted" }] }).mode, "already_applied");
  assert.equal(planPersonalRecovery(snapshot, { ...context, appliedSnapshots: [{ id: "backup-1", integrityHash: "sha256:different" }] }).reason, "snapshot_identity_integrity_collision");
});

test("P8.11 malformed/unsupported snapshots fail closed and legacy record dry-run remains bounded", () => {
  assert.equal(planPersonalRecovery({ ...snapshot, schemaVersion: "future-version" }, context).reason, "unsupported_snapshot_schema");
  assert.equal(planPersonalRecovery({ ...snapshot, createdAt: "not-a-time" }, context).reason, "malformed_snapshot_timestamp");
  assert.equal(planPersonalRecovery({ ...snapshot, receiptRefs: [""] }, context).reason, "malformed_recovery_history");
  const legacy = dryRunPersonalRestore({ id: "legacy", ownerId: "owner-1", records: snapshot.records }, { ownerId: "owner-1", allowedDomains: ["personal-ops"], maxSensitivityRank: 2 });
  assert.deepEqual(legacy.acceptedIds, ["task-1", "receipt-history"]);
});

test("P8.11 DST skipped/repeated civil times remain explicit across recovery boundaries", () => {
  assert.throws(() => resolveCalendarLocalTime({ localDateTime: "2026-03-08T02:30:00", timeZone: "America/New_York", disambiguation: "reject" }), /DST skipped time/);
  const earlier = resolveCalendarLocalTime({ localDateTime: "2026-11-01T01:30:00", timeZone: "America/New_York", disambiguation: "earlier" });
  const later = resolveCalendarLocalTime({ localDateTime: "2026-11-01T01:30:00", timeZone: "America/New_York", disambiguation: "later" });
  assert.equal(earlier.ambiguity, "repeated");
  assert.equal(later.ambiguity, "repeated");
  assert.notEqual(earlier.instant, later.instant);
});

test("P8.11 notification sensitivity remains minimized after recovery", () => {
  const routed = routeNotifications([{ id: "n1", ownerId: "owner-1", dedupeKey: "medical", severity: "high", title: "Sensitive title", body: "Sensitive body", sensitivityRank: 3, deepLink: "/private", sourceRefs: ["restore:backup-1"] }], { channel: "push", enabled: true, maxSensitivityRank: 1, quiet: false });
  assert.equal(routed[0].minimized, true);
  assert.equal(routed[0].title, "Command Center needs your attention");
  assert.equal(routed[0].body, "Open Command Center to view the protected details.");
  assert.equal(routed[0].deepLink, undefined);
});

test("P8.11 durable schema stores immutable provenance/history with owner-scoped RLS and no action authority", () => {
  const sql = readFileSync(new URL("../supabase/migrations/20261026094000_p8_11_personal_privacy_recovery.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_personal_recovery_snapshots/i);
  assert.match(sql, /integrity_hash text not null/i);
  assert.match(sql, /provenance_refs text\[\] not null/i);
  assert.match(sql, /completed_occurrence_keys text\[\]/i);
  assert.match(sql, /execution_refs text\[\]/i);
  assert.match(sql, /receipt_refs text\[\]/i);
  assert.match(sql, /completed_effect_keys text\[\]/i);
  assert.match(sql, /protected_action_authorized boolean not null default false check \(protected_action_authorized = false\)/i);
  assert.match(sql, /foreign key\(owner_id,snapshot_id,project_id,domain\)/i);
  assert.match(sql, /where mode='applied'/i);
  assert.match(sql, /history is immutable/i);
  assert.match(sql, /is_command_center_authorized/i);
});
