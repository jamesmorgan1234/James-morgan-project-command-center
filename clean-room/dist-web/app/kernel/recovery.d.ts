import type { EvidenceRecord } from "./evidence.js";
export type StartupMode = "normal" | "recovery";
export interface StartupAssessment {
    readonly configValid: boolean;
    readonly schemaCompatible: boolean;
    readonly releaseCompatible: boolean;
    readonly knownGoodReleaseAvailable: boolean;
}
export interface StartupDecision {
    readonly mode: StartupMode;
    readonly reason: string;
    readonly rollbackAvailable: boolean;
}
export type ControlPlaneState = "healthy" | "degraded" | "unavailable";
export interface LegacyRecoveryAuthorizationHint {
    readonly id: string;
    readonly scope: string;
    readonly expiresAt: string;
    readonly singleUse: boolean;
}
export interface ProtectedRecoveryAssessment {
    readonly policyState: ControlPlaneState;
    readonly revocationStateFresh: boolean;
    readonly protectedEffectRequested: boolean;
    /** Historical/advisory input only. A caller-supplied object never authorizes a protected effect. */
    readonly recoveryAuthorization?: LegacyRecoveryAuthorizationHint;
    readonly now: string;
}
export interface ProtectedRecoveryDecision {
    readonly allowed: boolean;
    readonly reason: string;
    readonly recoveryOnly: boolean;
    readonly authorizationId?: string;
    readonly operationId?: string;
}
export interface RecoveryAuthorizationGrant {
    readonly id: string;
    readonly issuerId: string;
    readonly subjectId: string;
    readonly action: string;
    readonly resourceId: string;
    readonly scope: string;
    readonly environment: string;
    readonly operationId: string;
    readonly issuedAt: string;
    readonly expiresAt: string;
    readonly singleUse: true;
    readonly revokedAt?: string;
}
export interface RecoveryAuthorizationIssueInput {
    readonly id: string;
    readonly issuerId: string;
    readonly subjectId: string;
    readonly action: string;
    readonly resourceId: string;
    readonly scope: string;
    readonly environment: string;
    readonly operationId: string;
    readonly issuedAt: string;
    readonly expiresAt: string;
}
export interface RecoveryAuthorizationConsumeInput {
    readonly authorizationId: string;
    readonly subjectId: string;
    readonly action: string;
    readonly resourceId: string;
    readonly scope: string;
    readonly environment: string;
    readonly operationId: string;
    readonly now: string;
}
export interface RecoveryIssuerVerification {
    readonly issuerId: string;
    readonly subjectId: string;
    readonly action: string;
    readonly resourceId: string;
    readonly scope: string;
    readonly environment: string;
    readonly operationId: string;
}
export type RecoveryIssuerVerifier = (input: RecoveryIssuerVerification) => boolean;
export type RecoveryEvidenceSink = (evidence: EvidenceRecord) => void;
export declare class RecoveryAuthorizationStore {
    #private;
    constructor(input: {
        readonly verifyIssuer: RecoveryIssuerVerifier;
        readonly evidenceSink?: RecoveryEvidenceSink;
    });
    issue(input: RecoveryAuthorizationIssueInput): RecoveryAuthorizationGrant;
    revoke(id: string, revokedAt: string): RecoveryAuthorizationGrant;
    get(id: string): RecoveryAuthorizationGrant | undefined;
    consumed(id: string): boolean;
    consume(input: RecoveryAuthorizationConsumeInput): RecoveryAuthorizationGrant;
}
export declare function decideStartup(assessment: StartupAssessment): StartupDecision;
/**
 * Advisory recovery classification only. It deliberately cannot authorize a protected effect from a caller-supplied object.
 * Use authorizeProtectedRecovery() at the trusted effect boundary.
 */
export declare function evaluateProtectedRecovery(assessment: ProtectedRecoveryAssessment): ProtectedRecoveryDecision;
export declare function authorizeProtectedRecovery(store: RecoveryAuthorizationStore, input: RecoveryAuthorizationConsumeInput & {
    readonly policyState: ControlPlaneState;
    readonly revocationStateFresh: boolean;
    readonly protectedEffectRequested: boolean;
}): ProtectedRecoveryDecision;
export type RecoveryFailureCode = "invalid_configuration" | "schema_incompatible" | "release_incompatible" | "startup_failed";
export interface RecoveryDiagnostic {
    readonly code: RecoveryFailureCode;
    readonly privacySafe: true;
    readonly ownerStateMutationAllowed: false;
}
export interface RecoveryShellPlan {
    readonly mode: "recovery";
    readonly reason: RecoveryFailureCode;
    readonly message: string;
    readonly retryAllowed: true;
    readonly knownGoodFallbackAvailable: boolean;
    readonly privateDataAllowed: false;
    readonly diagnostic: RecoveryDiagnostic;
}
export declare function classifyRecoveryFailure(error: unknown): RecoveryFailureCode;
export declare function createRecoveryShellPlan(reason: RecoveryFailureCode, knownGoodFallbackAvailable: boolean): RecoveryShellPlan;
export declare class RecoveryRetryBudget {
    #private;
    constructor(maximumAttempts?: number);
    get attempts(): number;
    get remaining(): number;
    consume(): number;
}
