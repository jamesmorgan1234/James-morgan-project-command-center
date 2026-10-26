export type PersonalRecoveryRecordKind = "data" | "occurrence_history" | "execution_history" | "receipt_history" | "effect_history" | "authority";
export type PersonalRecoveryProviderHealth = "available" | "degraded" | "unavailable";
export type PersonalRecoveryConnectivity = "online" | "offline" | "stale";
export type PersonalRecoveryMode = "ready" | "deferred" | "rejected" | "already_applied";

export interface PersonalBackupRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly domain: string;
  readonly projectId?: string;
  readonly sensitivityRank: number;
  readonly contentHash: string;
  readonly provenanceRefs: readonly string[];
  readonly kind?: PersonalRecoveryRecordKind;
  readonly authorityRef?: string;
}

export interface PersonalBackupBundle {
  readonly id: string;
  readonly ownerId: string;
  readonly records: readonly PersonalBackupRecord[];
}

export interface PersonalRestorePolicy {
  readonly ownerId: string;
  readonly allowedDomains: readonly string[];
  readonly maxSensitivityRank: number;
}

export interface PersonalRestoreDryRun {
  readonly acceptedIds: readonly string[];
  readonly rejected: readonly Readonly<{ id: string; reason: string }>[];
}

export interface PersonalRecoverySnapshot {
  readonly schemaVersion: "cc-personal-recovery-v1";
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly domain: string;
  readonly createdAt: string;
  readonly sensitivityRank: number;
  readonly integrityHash: string;
  readonly provenanceRefs: readonly string[];
  readonly records: readonly PersonalBackupRecord[];
  readonly completedOccurrenceKeys: readonly string[];
  readonly executionRefs: readonly string[];
  readonly receiptRefs: readonly string[];
  readonly completedEffectKeys: readonly string[];
}

export interface AppliedPersonalRecoverySnapshot {
  readonly id: string;
  readonly integrityHash: string;
}

export interface PersonalRecoveryContext {
  readonly ownerId: string;
  readonly projectId: string;
  readonly domain: string;
  readonly now: string;
  readonly maxSensitivityRank: number;
  readonly trustedIntegrityHash: string;
  readonly providerHealth: PersonalRecoveryProviderHealth;
  readonly connectivity: PersonalRecoveryConnectivity;
  readonly maxSnapshotAgeMs: number;
  readonly currentAuthorizationRefs: readonly string[];
  readonly revokedAuthorizationRefs: readonly string[];
  readonly appliedSnapshots?: readonly AppliedPersonalRecoverySnapshot[];
}

export interface PersonalRecoveryPlan {
  readonly snapshotId: string;
  readonly mode: PersonalRecoveryMode;
  readonly canApply: boolean;
  readonly reason: string;
  readonly acceptedRecordIds: readonly string[];
  readonly rejectedRecords: readonly Readonly<{ id: string; reason: string }>[];
  readonly completedOccurrenceKeys: readonly string[];
  readonly executionRefs: readonly string[];
  readonly receiptRefs: readonly string[];
  readonly completedEffectKeys: readonly string[];
  readonly protectedActionAuthorized: false;
}

export interface PersonalRecoveryApplication {
  readonly snapshotId: string;
  readonly integrityHash: string;
  readonly appliedRecordIds: readonly string[];
  readonly completedOccurrenceKeys: readonly string[];
  readonly executionRefs: readonly string[];
  readonly receiptRefs: readonly string[];
  readonly completedEffectKeys: readonly string[];
  readonly replayableCompletedKeys: readonly [];
  readonly protectedActionAuthorized: false;
}

function nonblank(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function validTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}
function uniqueNonblank(values: unknown, label: string): readonly string[] {
  if (!Array.isArray(values) || values.some((value: unknown) => !nonblank(value))) throw new Error(`${label} must contain only nonblank references`);
  return Object.freeze([...new Set((values as string[]).map((value) => value.trim()))]);
}
function emptyPlan(snapshotId: string, mode: PersonalRecoveryMode, reason: string): PersonalRecoveryPlan {
  return Object.freeze({ snapshotId, mode, canApply: false, reason, acceptedRecordIds: Object.freeze([]), rejectedRecords: Object.freeze([]), completedOccurrenceKeys: Object.freeze([]), executionRefs: Object.freeze([]), receiptRefs: Object.freeze([]), completedEffectKeys: Object.freeze([]), protectedActionAuthorized: false });
}

export function dryRunPersonalRestore(bundle: PersonalBackupBundle, policy: PersonalRestorePolicy): PersonalRestoreDryRun {
  const accepted: string[] = [];
  const rejected: Readonly<{ id: string; reason: string }>[] = [];
  const domains = new Set(policy.allowedDomains);
  for (const record of bundle.records) {
    if (bundle.ownerId !== policy.ownerId || record.ownerId !== policy.ownerId) { rejected.push(Object.freeze({ id: record.id, reason: "owner_boundary_mismatch" })); continue; }
    if (!domains.has(record.domain)) { rejected.push(Object.freeze({ id: record.id, reason: "domain_not_authorized" })); continue; }
    if (record.sensitivityRank > policy.maxSensitivityRank) { rejected.push(Object.freeze({ id: record.id, reason: "sensitivity_boundary" })); continue; }
    if (!record.contentHash.trim() || record.provenanceRefs.length === 0) { rejected.push(Object.freeze({ id: record.id, reason: "missing_integrity_or_provenance" })); continue; }
    accepted.push(record.id);
  }
  return Object.freeze({ acceptedIds: Object.freeze(accepted), rejected: Object.freeze(rejected) });
}

export function planPersonalRecovery(snapshot: PersonalRecoverySnapshot, context: PersonalRecoveryContext): PersonalRecoveryPlan {
  const snapshotId = nonblank(snapshot?.id) ? snapshot.id.trim() : "invalid-snapshot";
  if (!snapshot || snapshot.schemaVersion !== "cc-personal-recovery-v1") return emptyPlan(snapshotId, "rejected", "unsupported_snapshot_schema");
  if (!nonblank(snapshot.id) || !nonblank(snapshot.ownerId) || !nonblank(snapshot.projectId) || !nonblank(snapshot.domain)) return emptyPlan(snapshotId, "rejected", "malformed_snapshot_identity");
  if (!nonblank(snapshot.integrityHash) || !Array.isArray(snapshot.provenanceRefs) || snapshot.provenanceRefs.length === 0 || snapshot.provenanceRefs.some((ref: unknown) => !nonblank(ref))) return emptyPlan(snapshotId, "rejected", "missing_integrity_or_provenance");
  if (!nonblank(context.trustedIntegrityHash) || snapshot.integrityHash !== context.trustedIntegrityHash) return emptyPlan(snapshotId, "rejected", "integrity_mismatch");
  if (snapshot.ownerId !== context.ownerId) return emptyPlan(snapshotId, "rejected", "owner_boundary_mismatch");
  if (snapshot.projectId !== context.projectId) return emptyPlan(snapshotId, "rejected", "project_boundary_mismatch");
  if (snapshot.domain !== context.domain) return emptyPlan(snapshotId, "rejected", "domain_boundary_mismatch");
  if (!Number.isFinite(snapshot.sensitivityRank) || snapshot.sensitivityRank < 0 || snapshot.sensitivityRank > context.maxSensitivityRank) return emptyPlan(snapshotId, "rejected", "sensitivity_boundary");
  if (!Number.isSafeInteger(context.maxSnapshotAgeMs) || context.maxSnapshotAgeMs < 0) return emptyPlan(snapshotId, "rejected", "invalid_recovery_age_policy");

  let createdAt: number;
  let now: number;
  try { createdAt = validTimestamp(snapshot.createdAt, "snapshot createdAt"); now = validTimestamp(context.now, "recovery now"); }
  catch { return emptyPlan(snapshotId, "rejected", "malformed_snapshot_timestamp"); }
  if (createdAt > now) return emptyPlan(snapshotId, "rejected", "snapshot_from_future");
  if (now - createdAt > context.maxSnapshotAgeMs) return emptyPlan(snapshotId, "deferred", "stale_state");
  if (context.connectivity === "offline") return emptyPlan(snapshotId, "deferred", "offline");
  if (context.connectivity === "stale") return emptyPlan(snapshotId, "deferred", "stale_state");
  if (context.providerHealth === "unavailable") return emptyPlan(snapshotId, "deferred", "provider_unavailable");
  if (context.providerHealth === "degraded") return emptyPlan(snapshotId, "deferred", "provider_degraded");

  const prior = context.appliedSnapshots?.find((item) => item.id === snapshot.id);
  if (prior) {
    if (prior.integrityHash !== snapshot.integrityHash) return emptyPlan(snapshotId, "rejected", "snapshot_identity_integrity_collision");
    return emptyPlan(snapshotId, "already_applied", "recovery_already_applied");
  }

  const currentAuthorities = new Set(uniqueNonblank(context.currentAuthorizationRefs, "currentAuthorizationRefs"));
  const revokedAuthorities = new Set(uniqueNonblank(context.revokedAuthorizationRefs, "revokedAuthorizationRefs"));
  let completedOccurrenceKeys: readonly string[];
  let executionRefs: readonly string[];
  let receiptRefs: readonly string[];
  let completedEffectKeys: readonly string[];
  try {
    completedOccurrenceKeys = uniqueNonblank(snapshot.completedOccurrenceKeys, "completedOccurrenceKeys");
    executionRefs = uniqueNonblank(snapshot.executionRefs, "executionRefs");
    receiptRefs = uniqueNonblank(snapshot.receiptRefs, "receiptRefs");
    completedEffectKeys = uniqueNonblank(snapshot.completedEffectKeys, "completedEffectKeys");
  } catch { return emptyPlan(snapshotId, "rejected", "malformed_recovery_history"); }

  if (!Array.isArray(snapshot.records)) return emptyPlan(snapshotId, "rejected", "malformed_snapshot_records");
  const accepted: string[] = [];
  const rejected: Readonly<{ id: string; reason: string }>[] = [];
  const seen = new Set<string>();
  for (const record of snapshot.records) {
    const id = nonblank(record?.id) ? record.id.trim() : "invalid-record";
    let reason: string | undefined;
    if (!nonblank(record?.id) || seen.has(id)) reason = seen.has(id) ? "duplicate_record_id" : "malformed_record_identity";
    else if (record.ownerId !== context.ownerId) reason = "owner_boundary_mismatch";
    else if (record.projectId !== undefined && record.projectId !== context.projectId) reason = "project_boundary_mismatch";
    else if (record.domain !== context.domain) reason = "domain_boundary_mismatch";
    else if (!Number.isFinite(record.sensitivityRank) || record.sensitivityRank < 0 || record.sensitivityRank > context.maxSensitivityRank) reason = "sensitivity_boundary";
    else if (!nonblank(record.contentHash) || !Array.isArray(record.provenanceRefs) || record.provenanceRefs.length === 0 || record.provenanceRefs.some((ref: unknown) => !nonblank(ref))) reason = "missing_integrity_or_provenance";
    else if (record.kind === "authority") reason = "authority_not_restorable";
    else if (record.authorityRef !== undefined && (!nonblank(record.authorityRef) || revokedAuthorities.has(record.authorityRef) || !currentAuthorities.has(record.authorityRef))) reason = "authority_not_current";
    if (reason) rejected.push(Object.freeze({ id, reason })); else accepted.push(id);
    if (nonblank(record?.id)) seen.add(id);
  }
  if (rejected.length > 0) return Object.freeze({ snapshotId, mode: "rejected", canApply: false, reason: "snapshot_record_rejected", acceptedRecordIds: Object.freeze(accepted), rejectedRecords: Object.freeze(rejected), completedOccurrenceKeys, executionRefs, receiptRefs, completedEffectKeys, protectedActionAuthorized: false });
  return Object.freeze({ snapshotId, mode: "ready", canApply: true, reason: "ready", acceptedRecordIds: Object.freeze(accepted), rejectedRecords: Object.freeze([]), completedOccurrenceKeys, executionRefs, receiptRefs, completedEffectKeys, protectedActionAuthorized: false });
}

export function applyPersonalRecovery(snapshot: PersonalRecoverySnapshot, context: PersonalRecoveryContext): PersonalRecoveryApplication {
  const plan = planPersonalRecovery(snapshot, context);
  if (!plan.canApply) throw new Error(`Personal recovery cannot apply: ${plan.reason}`);
  return Object.freeze({ snapshotId: snapshot.id, integrityHash: snapshot.integrityHash, appliedRecordIds: plan.acceptedRecordIds, completedOccurrenceKeys: plan.completedOccurrenceKeys, executionRefs: plan.executionRefs, receiptRefs: plan.receiptRefs, completedEffectKeys: plan.completedEffectKeys, replayableCompletedKeys: Object.freeze([]) as readonly [], protectedActionAuthorized: false });
}
