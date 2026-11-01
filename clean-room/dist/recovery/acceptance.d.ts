export declare const REQUIRED_INTELLIGENCE_BACKUP_CLASSES: readonly ["canonical_data", "assets", "methods", "routing", "calibration", "promotions", "evaluators", "procedures", "specialists", "negative_knowledge", "revalidation", "canary_state"];
export type IntelligenceBackupClass = (typeof REQUIRED_INTELLIGENCE_BACKUP_CLASSES)[number];
export interface BackupReceipt {
    backupId: string;
    classes: readonly IntelligenceBackupClass[];
    encrypted: boolean;
    integrityVerified: boolean;
    retentionPolicyRef: string;
    keyStrategyRef: string;
    createdAt: string;
}
export declare function validateIntelligenceBackup(r: BackupReceipt): BackupReceipt;
export interface RestorableRecord {
    id: string;
    kind: string;
    state: "active" | "revoked" | "invalid" | "quarantined";
    privacyAllowed: boolean;
    policyAllowed: boolean;
    payloadRef: string;
}
export declare function restoreUnderCurrentPolicy(records: readonly RestorableRecord[]): Readonly<{
    restored: readonly RestorableRecord[];
    rejected: readonly string[];
}>;
export interface MigrationItem {
    id: string;
    sourceVersion: number;
    targetVersion: number;
    erased: boolean;
    historyRefs: readonly string[];
    identityRef: string;
}
export declare function dryRunMigration(items: readonly MigrationItem[], failAtId?: string): Readonly<{
    status: "rolled_back";
    migrated: readonly string[];
    rolledBack: readonly string[];
    erasurePreserved: boolean;
}> | Readonly<{
    status: "completed";
    migrated: readonly string[];
    rolledBack: readonly string[];
    erasurePreserved: true;
}>;
export interface ReplacementCandidate {
    kind: "provider" | "model" | "method" | "evaluator" | "ontology" | "dependency";
    candidateRef: string;
    available: boolean;
    costKnownFree: boolean;
    compatible: boolean;
    dependentRefs: readonly string[];
}
export declare function evaluateReplacement(c: ReplacementCandidate): Readonly<{
    activatable: boolean;
    reasons: readonly string[];
    invalidatedDependents: readonly string[];
}>;
export interface HistoricalInventory {
    processedRefs: readonly string[];
    conflicts: readonly string[];
    privacyExclusions: readonly string[];
    missingArtifacts: readonly string[];
    lineageRefs: readonly string[];
    originalCcrAvailable: boolean;
}
export declare function auditHistoricalRecovery(i: HistoricalInventory): Readonly<{
    processedCount: number;
    conflictCount: number;
    privacyExclusionCount: number;
    blockers: readonly string[];
    complete: boolean;
}>;
export interface ScaleWorkload {
    baselineUnits: number;
    multiplier: 10 | 100;
    accepted: number;
    backpressured: number;
    lost: number;
    resourceBudgetUnits: number;
    resourceUsedUnits: number;
}
export declare function validateScaleWorkload(w: ScaleWorkload): Readonly<{
    offered: number;
    pass: boolean;
    boundedBackpressure: boolean;
    noProcurementRequired: boolean;
}>;
export type ReactivationStage = "configure" | "connect" | "authorize" | "enable";
export interface DormantReactivation {
    ref: string;
    revalidated: boolean;
    obsolete: boolean;
    completedStages: readonly ReactivationStage[];
}
export declare function validateDormantReactivation(r: DormantReactivation): Readonly<{
    enabled: boolean;
    completedStages: readonly ReactivationStage[];
    ref: string;
    revalidated: boolean;
    obsolete: boolean;
}>;
export interface SyntheticTenantRecord {
    tenantRef: string;
    roleRef: string;
    privateDataRef: string;
}
export declare function validateSyntheticTenantBoundary(records: readonly SyntheticTenantRecord[], multiUserActivated: boolean): boolean;
export interface ForkAsset {
    ref: string;
    classification: "public" | "private" | "credential" | "owner_policy";
}
export declare function buildSyntheticPublicFork(assets: readonly ForkAsset[], publish: boolean): readonly string[];
export interface InterfaceSeam {
    id: string;
    usesCanonicalIntent: boolean;
    usesPolicy: boolean;
    usesCanonicalData: boolean;
    removable: boolean;
    productionActivated: boolean;
}
export declare function validateFutureInterfaceSeam(s: InterfaceSeam): boolean;
export type FailureKind = "db" | "network" | "worker" | "scheduler" | "provider" | "cache" | "resource";
export interface ChaosObservation {
    failure: FailureKind;
    syntheticOrCopiedData: boolean;
    stateProvenanceRef: string;
    versionRef: string;
    productionEgress: boolean;
    fenced: boolean;
    recovered: boolean;
    resumed: boolean;
    observedAt: string;
}
export declare function validateChaosDrill(o: ChaosObservation): Readonly<{
    pass: boolean;
    observed: true;
}>;
export interface LifecycleEvent {
    entityRef: string;
    action: "create" | "use" | "fail" | "recover" | "migrate" | "disable" | "remove";
    synthetic: boolean;
    outcomeClass: "simulation" | "observed";
    authorityRefs: readonly string[];
    dataRefs: readonly string[];
}
export declare function validateLongHorizonLifecycle(events: readonly LifecycleEvent[]): boolean;
