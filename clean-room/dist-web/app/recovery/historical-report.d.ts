export interface HistoricalRecoveryReport {
    readonly sourceSetId: string;
    readonly expectedConversations: number;
    readonly processedConversations: number;
    readonly messageNodes: number;
    readonly branchPoints: number;
    readonly projectContainers: number;
    readonly candidateProjects: readonly string[];
    readonly conflicts: readonly string[];
    readonly privacyExclusions: readonly string[];
    readonly missingArtifacts: readonly string[];
    readonly unresolvedUnknowns: readonly string[];
    readonly sourceRefs: readonly string[];
}
export interface HistoricalRecoveryCoverage {
    readonly sourceScopeProcessed: true;
    readonly unresolvedConflicts: true;
    readonly candidateProjects: true;
    readonly missingArtifacts: true;
    readonly renameLineage: true;
    readonly mergeLineage: true;
    readonly supersessionLineage: true;
    readonly privacyExclusions: true;
    readonly unresolvedUnknowns: true;
    readonly recoveryEvidence: true;
}
export interface HistoricalRecoveryCompletenessReport extends HistoricalRecoveryReport {
    readonly renameLineage: readonly string[];
    readonly mergeLineage: readonly string[];
    readonly supersessionLineage: readonly string[];
    readonly recoveryEvidenceRefs: readonly string[];
    readonly coverage: HistoricalRecoveryCoverage;
}
export declare function recoveryComplete(report: HistoricalRecoveryReport): boolean;
export declare function validateRecoveryReport(report: HistoricalRecoveryReport): HistoricalRecoveryReport;
export declare function validateRecoveryCompletenessReport(report: HistoricalRecoveryCompletenessReport): HistoricalRecoveryCompletenessReport;
export declare function recoveryCompletenessReportComplete(report: HistoricalRecoveryCompletenessReport): boolean;
import type { HistoricalImportStage } from '../data/historical-export.js';
import { type RecoveryAccess, type RecoveryScope } from './contracts.js';
export interface HistoricalRecoveryManifest {
    readonly id: string;
    readonly scope: RecoveryScope;
    readonly expectedConversationIds: readonly string[];
    readonly expectedStageDigest: string;
    readonly sourceRefs: readonly string[];
    readonly evidenceIds: readonly string[];
}
/** CCR-05852 report matches the actual staged graph, rather than caller-supplied counts. */
export declare function auditStagedHistoricalRecovery(a: RecoveryAccess, m: HistoricalRecoveryManifest, stage: HistoricalImportStage, report: HistoricalRecoveryCompletenessReport): Promise<{
    schemaVersion: number;
    requirementId: string;
    scope: RecoveryScope;
    sourceSetId: string;
    stageDigest: string;
    processedScopeComplete: boolean;
    allArtifactsRecovered: boolean;
    unresolved: string[];
    originalVsReconstruction: string;
    report: HistoricalRecoveryCompletenessReport;
    summary: {
        conversations: number;
        nodes: number;
        branches: number;
        containers: number;
        redacted: number;
    };
    productionImported: boolean;
    authorityGranted: boolean;
}>;
