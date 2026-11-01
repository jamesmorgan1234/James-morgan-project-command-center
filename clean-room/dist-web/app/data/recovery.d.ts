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
export declare function rebuildProjection(events: readonly ProjectionEvent[]): ProjectionRebuildEvidence;
export declare function assertProviderReplacement(oldProvider: ProviderContract, replacement: ProviderContract, requiredCapabilities: readonly string[], freeFirst: boolean): void;
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
export declare function evaluateRestoreRevalidation(input: RestoreRevalidationInput): RestoreRevalidationDecision;
/**
 * Restore-specific projection rebuild. A backup/event stream does not become usable merely
 * because its event chain is internally valid: current authorization, privacy, key,
 * application, source, purpose, retention, and evidence truth must all be active first.
 * Restricted and denied decisions fail closed before any projection is produced.
 */
export declare function rebuildProjectionForRestore(events: readonly ProjectionEvent[], revalidation: RestoreRevalidationInput): RestoreProjectionResult;
