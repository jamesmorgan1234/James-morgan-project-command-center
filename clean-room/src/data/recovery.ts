import { parseTimestamp } from "../security/types.js";
import type { ProviderContract } from "./providers.js";
import type { DerivedPayloadState } from "./privacy.js";

export interface ProjectionEvent {
  readonly sequence: number;
  readonly eventId: string;
  readonly payloadHash: string;
}

export interface ProjectionRebuildEvidence {
  readonly eventCount: number;
  readonly firstSequence: number;
  readonly lastSequence: number;
  readonly hashChain: string;
}

export function rebuildProjection(events: readonly ProjectionEvent[]): ProjectionRebuildEvidence {
  if (events.length === 0) return Object.freeze({ eventCount: 0, firstSequence: 0, lastSequence: 0, hashChain: "" });
  let expected = 1;
  const ids = new Set<string>();
  const chain: string[] = [];
  for (const event of events) {
    if (!event.eventId.trim()) throw new Error("Projection event identity is required");
    if (event.sequence !== expected) throw new Error(`Projection sequence gap: expected ${expected}, received ${event.sequence}`);
    if (ids.has(event.eventId)) throw new Error(`Duplicate projection event: ${event.eventId}`);
    if (!event.payloadHash.trim()) throw new Error(`Projection event requires payload hash: ${event.eventId}`);
    ids.add(event.eventId);
    chain.push(`${event.sequence}:${event.eventId}:${event.payloadHash}`);
    expected += 1;
  }
  return Object.freeze({ eventCount: events.length, firstSequence: 1, lastSequence: events.length, hashChain: chain.join("|") });
}

export function assertProviderReplacement(oldProvider: ProviderContract, replacement: ProviderContract, requiredCapabilities: readonly string[], freeFirst: boolean): void {
  for (const capability of requiredCapabilities) if (!replacement.capabilities.includes(capability)) throw new Error(`Replacement provider missing capability: ${capability}`);
  if (!replacement.enabled || replacement.health === "unavailable" || replacement.health === "unconfigured") throw new Error("Replacement provider is not operationally eligible");
  if (freeFirst && replacement.cost !== "free") throw new Error("Paid or unknown-cost replacement violates free-first without owner authorization");
  if (replacement.key === oldProvider.key && replacement.version <= oldProvider.version) throw new Error("Same provider replacement must advance version");
}

export type RestoreAuthorizationState = "active" | "revoked" | "missing";
export type RestorePrivacyState = "allowed" | "restricted" | "deleted";
export type RestoreKeyState = "active" | "decrypt_only" | "revoked" | "missing";
export type RestoreApplicationState = "valid" | "invalid" | "unknown";
export type RestoreSourceLifecycle = "active" | "degraded" | "unavailable" | "tombstoned";
export type RestoreDecisionStatus = "active" | "restricted" | "denied";
export type RestoreCompleteness = "unknown" | "partial" | "complete";
export type RestoreTrust = "unrated" | "low" | "medium" | "high" | "authoritative";
export type RestoreReachability = "unknown" | "reachable" | "degraded" | "unreachable";

export interface RestoreReliability {
  readonly successRate?: number;
  readonly sampleSize?: number;
  readonly lastFailureAt?: string;
}

export interface RestoreRevalidationInput {
  readonly now: string;
  readonly authorizationState: RestoreAuthorizationState;
  readonly authorizationRef?: string;
  readonly authorizationExpiresAt?: string;
  readonly authorizationPolicyEpoch?: number;
  readonly currentPolicyEpoch: number;
  readonly privacyState: RestorePrivacyState;
  readonly keyState: RestoreKeyState;
  readonly applicationState: RestoreApplicationState;
  readonly sourceLifecycle: RestoreSourceLifecycle;
  readonly payloadState: DerivedPayloadState;
  readonly purposeAllowed: boolean;
  readonly retentionAllowed: boolean;
  readonly evidenceRefs: readonly string[];
  readonly sourceFreshUntil?: string;
  readonly sourceCompleteness?: RestoreCompleteness;
  readonly sourceTrust?: RestoreTrust;
  readonly sourceReachability?: RestoreReachability;
  readonly sourceReliability?: RestoreReliability;
  readonly obligationRefs?: readonly string[];
  readonly revalidationTriggers?: readonly string[];
}

export interface RestoreRevalidationDecision {
  readonly status: RestoreDecisionStatus;
  readonly reason: string;
  readonly evaluatedAt: string;
  readonly currentPolicyEpoch: number;
  readonly evidenceRefs: readonly string[];
  readonly obligationRefs?: readonly string[];
  readonly revalidationTriggers?: readonly string[];
}

export interface RestoreProjectionResult {
  readonly decision: RestoreRevalidationDecision;
  readonly projection: ProjectionRebuildEvidence;
}

function restoreDecision(input: RestoreRevalidationInput, status: RestoreDecisionStatus, reason: string, evidenceRefs: readonly string[]): RestoreRevalidationDecision {
  return Object.freeze({
    status,
    reason,
    evaluatedAt: input.now,
    currentPolicyEpoch: input.currentPolicyEpoch,
    evidenceRefs: Object.freeze([...evidenceRefs]),
    obligationRefs: input.obligationRefs === undefined ? undefined : Object.freeze([...input.obligationRefs]),
    revalidationTriggers: input.revalidationTriggers === undefined ? undefined : Object.freeze([...input.revalidationTriggers])
  });
}

export function evaluateRestoreRevalidation(input: RestoreRevalidationInput): RestoreRevalidationDecision {
  const now = parseTimestamp(input.now, "restore.now");
  if (!Number.isInteger(input.currentPolicyEpoch) || input.currentPolicyEpoch < 0) throw new Error("restore.currentPolicyEpoch must be a non-negative integer");

  const evidenceRefs = input.evidenceRefs.map((ref) => ref.trim());
  if (evidenceRefs.length === 0 || evidenceRefs.some((ref) => ref.length === 0) || new Set(evidenceRefs).size !== evidenceRefs.length) {
    return restoreDecision(input, "denied", "restore_evidence_missing_or_invalid", evidenceRefs.filter(Boolean));
  }
  if (input.obligationRefs !== undefined && (input.obligationRefs.some((ref) => !ref.trim()) || new Set(input.obligationRefs).size !== input.obligationRefs.length)) return restoreDecision(input, "denied", "restore_obligation_refs_invalid", evidenceRefs);
  if (input.revalidationTriggers !== undefined && (input.revalidationTriggers.some((ref) => !ref.trim()) || new Set(input.revalidationTriggers).size !== input.revalidationTriggers.length)) return restoreDecision(input, "denied", "restore_revalidation_triggers_invalid", evidenceRefs);
  if (input.sourceCompleteness !== undefined && !["unknown", "partial", "complete"].includes(input.sourceCompleteness)) return restoreDecision(input, "denied", "restore_source_completeness_invalid", evidenceRefs);
  if (input.sourceTrust !== undefined && !["unrated", "low", "medium", "high", "authoritative"].includes(input.sourceTrust)) return restoreDecision(input, "denied", "restore_source_trust_invalid", evidenceRefs);
  if (input.sourceReachability !== undefined && !["unknown", "reachable", "degraded", "unreachable"].includes(input.sourceReachability)) return restoreDecision(input, "denied", "restore_source_reachability_invalid", evidenceRefs);
  if (input.sourceReliability !== undefined) {
    if (input.sourceReliability.successRate !== undefined && (!Number.isFinite(input.sourceReliability.successRate) || input.sourceReliability.successRate < 0 || input.sourceReliability.successRate > 1)) return restoreDecision(input, "denied", "restore_source_reliability_invalid", evidenceRefs);
    if (input.sourceReliability.sampleSize !== undefined && (!Number.isSafeInteger(input.sourceReliability.sampleSize) || input.sourceReliability.sampleSize < 0)) return restoreDecision(input, "denied", "restore_source_reliability_invalid", evidenceRefs);
    if (input.sourceReliability.lastFailureAt !== undefined) parseTimestamp(input.sourceReliability.lastFailureAt, "restore.sourceReliability.lastFailureAt");
  }
  if (input.sourceFreshUntil !== undefined && parseTimestamp(input.sourceFreshUntil, "restore.sourceFreshUntil") <= now) return restoreDecision(input, "restricted", "restore_source_stale", evidenceRefs);

  if (input.authorizationState !== "active") return restoreDecision(input, "denied", `authorization_${input.authorizationState}`, evidenceRefs);
  if (!input.authorizationRef?.trim()) return restoreDecision(input, "denied", "authorization_reference_missing", evidenceRefs);
  if (input.authorizationExpiresAt === undefined) return restoreDecision(input, "denied", "authorization_expiry_missing", evidenceRefs);
  const expiresAt = parseTimestamp(input.authorizationExpiresAt, "restore.authorizationExpiresAt");
  if (expiresAt <= now) return restoreDecision(input, "denied", "authorization_expired", evidenceRefs);
  if (!Number.isInteger(input.authorizationPolicyEpoch) || (input.authorizationPolicyEpoch ?? -1) < 0) return restoreDecision(input, "denied", "authorization_policy_epoch_missing", evidenceRefs);
  if (input.authorizationPolicyEpoch !== input.currentPolicyEpoch) return restoreDecision(input, "denied", "authorization_policy_epoch_stale", evidenceRefs);

  if (input.applicationState !== "valid") return restoreDecision(input, "denied", `application_state_${input.applicationState}`, evidenceRefs);
  if (input.privacyState === "deleted") return restoreDecision(input, "denied", "privacy_deleted", evidenceRefs);
  if (input.payloadState === "erased") return restoreDecision(input, "denied", "payload_erased", evidenceRefs);
  if (input.keyState === "revoked" || input.keyState === "missing") return restoreDecision(input, "denied", `key_${input.keyState}`, evidenceRefs);
  if (input.sourceLifecycle === "tombstoned") return restoreDecision(input, "denied", "source_tombstoned", evidenceRefs);
  if (!input.purposeAllowed) return restoreDecision(input, "denied", "purpose_no_longer_allowed", evidenceRefs);
  if (!input.retentionAllowed) return restoreDecision(input, "denied", "retention_no_longer_allowed", evidenceRefs);

  if (input.privacyState === "restricted") return restoreDecision(input, "restricted", "privacy_restricted", evidenceRefs);
  if (input.payloadState === "restricted") return restoreDecision(input, "restricted", "payload_restricted", evidenceRefs);
  if (input.keyState === "decrypt_only") return restoreDecision(input, "restricted", "key_decrypt_only", evidenceRefs);
  if (input.sourceLifecycle === "degraded" || input.sourceLifecycle === "unavailable") return restoreDecision(input, "restricted", `source_${input.sourceLifecycle}`, evidenceRefs);
  if (input.sourceReachability === "degraded" || input.sourceReachability === "unreachable") return restoreDecision(input, "restricted", `source_reachability_${input.sourceReachability}`, evidenceRefs);
  if (input.sourceCompleteness === "unknown" || input.sourceCompleteness === "partial") return restoreDecision(input, "restricted", `source_completeness_${input.sourceCompleteness}`, evidenceRefs);

  return restoreDecision(input, "active", "current_authority_and_privacy_revalidated", evidenceRefs);
}

/**
 * Restore-specific projection rebuild. A backup/event stream does not become usable merely
 * because its event chain is internally valid: current authorization, privacy, key,
 * application, source, purpose, retention, and evidence truth must all be active first.
 * Restricted and denied decisions fail closed before any projection is produced.
 */
export function rebuildProjectionForRestore(events: readonly ProjectionEvent[], revalidation: RestoreRevalidationInput): RestoreProjectionResult {
  const decision = evaluateRestoreRevalidation(revalidation);
  if (decision.status !== "active") throw new Error(`Restore ${decision.status}: ${decision.reason}`);
  return Object.freeze({ decision, projection: rebuildProjection(events) });
}
