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
    readonly rejected: readonly Readonly<{
        id: string;
        reason: string;
    }>[];
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
    readonly rejectedRecords: readonly Readonly<{
        id: string;
        reason: string;
    }>[];
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
export declare function dryRunPersonalRestore(bundle: PersonalBackupBundle, policy: PersonalRestorePolicy): PersonalRestoreDryRun;
export declare function planPersonalRecovery(snapshot: PersonalRecoverySnapshot, context: PersonalRecoveryContext): PersonalRecoveryPlan;
export declare function applyPersonalRecovery(snapshot: PersonalRecoverySnapshot, context: PersonalRecoveryContext): PersonalRecoveryApplication;
