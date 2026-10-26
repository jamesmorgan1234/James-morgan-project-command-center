import { parseTimestamp } from "../security/types.js";

export interface FinancialProviderSnapshot {
  readonly providerKey: string;
  readonly ownerId: string;
  readonly capturedAt: string;
  readonly contentHash: string;
  readonly accountIds: readonly string[];
}

export type FinancialReconciliationDecision = "accept_newer" | "duplicate" | "reject_stale" | "manual_conflict";

export function reconcileFinancialSnapshot(current: FinancialProviderSnapshot | undefined, incoming: FinancialProviderSnapshot): FinancialReconciliationDecision {
  if (!incoming.providerKey.trim() || !incoming.ownerId.trim() || !incoming.contentHash.trim()) throw new Error("Financial provider snapshot identity/hash are required");
  const incomingAt = parseTimestamp(incoming.capturedAt, "incoming.capturedAt");
  if (!current) return "accept_newer";
  if (current.providerKey !== incoming.providerKey || current.ownerId !== incoming.ownerId) throw new Error("Financial provider snapshot scope mismatch");
  const currentAt = parseTimestamp(current.capturedAt, "current.capturedAt");
  if (incomingAt < currentAt) return "reject_stale";
  if (incomingAt === currentAt && incoming.contentHash === current.contentHash) return "duplicate";
  if (incomingAt === currentAt && incoming.contentHash !== current.contentHash) return "manual_conflict";
  return "accept_newer";
}

export type FinancialRecoveryIncidentKind = "provider_error" | "stale_balance" | "partial_sync" | "duplicate" | "account_relink" | "compromised_provider" | "restore" | "protected_action_uncertain" | "protected_action_rollback";
export type FinancialRecoveryDisposition = "accept" | "defer" | "reject" | "manual_review";

export interface FinancialRecoveryEvidenceInput {
  readonly id: string;
  readonly ownerId: string;
  readonly providerKey: string;
  readonly incidentKind: FinancialRecoveryIncidentKind;
  readonly observedAt: string;
  readonly evidenceRefs: readonly string[];
  readonly auditRef: string;
  readonly integrityVerified: boolean;
  readonly provenanceVerified: boolean;
  readonly providerHealth: "available" | "degraded" | "unavailable" | "compromised";
  readonly canonicalAccountRefs: readonly string[];
  readonly relinkedAccountRefs?: readonly string[] | undefined;
  readonly priorExecutionRefs: readonly string[];
  readonly receiptRefs: readonly string[];
}

export interface FinancialRecoveryAssessment {
  readonly id: string;
  readonly incidentKind: FinancialRecoveryIncidentKind;
  readonly disposition: FinancialRecoveryDisposition;
  readonly reason: string;
  readonly evidenceRefs: readonly string[];
  readonly auditRef: string;
  readonly canonicalIdentityPreserved: boolean;
  readonly actionReplayAllowed: false;
  readonly rollbackAuthorized: false;
  readonly failClosed: true;
  readonly protectedActionAuthorized: false;
}

function refs(values: readonly string[], label: string, requireOne = true): readonly string[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank references`);
  return Object.freeze([...new Set(values.map((value) => value.trim()))]);
}
function sameSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const r = new Set(right);
  return left.every((item) => r.has(item));
}

export function assessFinancialRecovery(input: FinancialRecoveryEvidenceInput): FinancialRecoveryAssessment {
  if (!input.id.trim() || !input.ownerId.trim() || !input.providerKey.startsWith("finance-provider:") || !input.auditRef.trim()) throw new Error("Finance recovery identity/provider/audit evidence is required");
  parseTimestamp(input.observedAt, "Finance recovery observedAt");
  const evidenceRefs = refs(input.evidenceRefs, "Finance recovery evidence");
  const canonical = refs(input.canonicalAccountRefs, "Finance canonical account refs", input.incidentKind === "account_relink");
  const priorExecutionRefs = refs(input.priorExecutionRefs, "Finance prior execution refs", false);
  const receiptRefs = refs(input.receiptRefs, "Finance receipt refs", false);

  let disposition: FinancialRecoveryDisposition = "manual_review";
  let reason = "manual_reconciliation_required";
  let canonicalIdentityPreserved = true;

  if (!input.integrityVerified || !input.provenanceVerified) { disposition = "reject"; reason = "integrity_or_provenance_unverified"; }
  else if (input.providerHealth === "compromised" || input.incidentKind === "compromised_provider") { disposition = "reject"; reason = "provider_compromised"; }
  else if (input.incidentKind === "provider_error") { disposition = "defer"; reason = "provider_error"; }
  else if (input.incidentKind === "stale_balance") { disposition = "reject"; reason = "stale_balance"; }
  else if (input.incidentKind === "partial_sync") { disposition = "defer"; reason = "partial_sync"; }
  else if (input.incidentKind === "duplicate") { disposition = "reject"; reason = "duplicate_evidence"; }
  else if (input.incidentKind === "account_relink") {
    const relinked = refs(input.relinkedAccountRefs ?? [], "Finance relinked account refs");
    canonicalIdentityPreserved = sameSet(canonical, relinked);
    disposition = canonicalIdentityPreserved ? "accept" : "manual_review";
    reason = canonicalIdentityPreserved ? "canonical_identity_preserved" : "relink_identity_conflict";
  } else if (input.incidentKind === "restore") {
    if (input.providerHealth !== "available") { disposition = "defer"; reason = "restore_provider_not_available"; }
    else { disposition = "accept"; reason = "restore_evidence_verified"; }
  } else if (input.incidentKind === "protected_action_uncertain") {
    disposition = "manual_review";
    reason = priorExecutionRefs.length > 0 || receiptRefs.length > 0 ? "uncertain_outcome_requires_receipt_reconciliation" : "uncertain_outcome_requires_provider_reconciliation";
  } else if (input.incidentKind === "protected_action_rollback") {
    disposition = "manual_review";
    reason = "rollback_requires_new_exact_owner_authorization";
  }

  return Object.freeze({ id: input.id, incidentKind: input.incidentKind, disposition, reason, evidenceRefs, auditRef: input.auditRef, canonicalIdentityPreserved, actionReplayAllowed: false as const, rollbackAuthorized: false as const, failClosed: true as const, protectedActionAuthorized: false as const });
}
