export interface FinancialProviderSnapshot {
    readonly providerKey: string;
    readonly ownerId: string;
    readonly capturedAt: string;
    readonly contentHash: string;
    readonly accountIds: readonly string[];
}
export type FinancialReconciliationDecision = "accept_newer" | "duplicate" | "reject_stale" | "manual_conflict";
export declare function reconcileFinancialSnapshot(current: FinancialProviderSnapshot | undefined, incoming: FinancialProviderSnapshot): FinancialReconciliationDecision;
export type FinancialRecoveryIncidentKind = "provider_error" | "stale_balance" | "partial_sync" | "duplicate" | "account_relink" | "compromised_provider" | "restore" | "protected_action_uncertain" | "protected_action_rollback";
export type FinancialRecoveryDisposition = "accept" | "defer" | "reject" | "manual_review";
export interface FinancialRestoreValidation {
    readonly knownGoodSnapshotRef: string;
    readonly backupHashVerified: boolean;
    readonly currentAuthorizationRevalidated: boolean;
    readonly currentRevocationsRevalidated: boolean;
    readonly immutableHistoryPreserved: boolean;
    readonly missingAccountRefs: readonly string[];
}
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
    readonly restoreValidation?: FinancialRestoreValidation;
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
export declare function assessFinancialRecovery(input: FinancialRecoveryEvidenceInput): FinancialRecoveryAssessment;
/** Trusted server restore preflight: historical authorization is never authoritative. */
export declare function assessFinancialRestoreWithLiveAccess(boundary: import("./access.js").FinancialAccessBoundary, sessionId: string, resource: import("./access.js").FinancialResourceScope, now: string, input: FinancialRecoveryEvidenceInput): FinancialRecoveryAssessment;
