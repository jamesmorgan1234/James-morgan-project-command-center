import type { EnvironmentName } from "./config.js";
export type EvidenceStrength = "self_report_only" | "recorded" | "tool_result" | "canonical_record" | "live_verified";
export interface EvidenceRecord {
    readonly id: string;
    readonly subjectId: string;
    readonly strength: EvidenceStrength;
    readonly sourceRef: string;
    readonly recordedAt: string;
    readonly verified: boolean;
    readonly codeRef?: string;
    readonly configDigest?: string;
    readonly schemaVersion?: number;
    readonly environment?: EnvironmentName;
    readonly testRef?: string;
    readonly scopeRef?: string;
}
export interface RequirementClosureRecord {
    readonly requirementId: string;
    readonly authoritativeSource: string;
    readonly capabilityKey: string;
    readonly owningPhase: string;
    readonly dependencyIds: readonly string[];
    readonly implementationRefs: readonly string[];
    readonly positiveTestRefs: readonly string[];
    readonly negativeTestRefs: readonly string[];
    readonly failureTestRefs: readonly string[];
    readonly evidenceIds: readonly string[];
    readonly truthState: "planned" | "implemented_unverified" | "verified" | "blocked" | "not_applicable";
    readonly blockerOrNonApplicabilityReason?: string;
}
export interface Checkpoint {
    readonly id: string;
    readonly subjectId: string;
    readonly summary: string;
    readonly exactNextAction: string;
    readonly evidenceIds: readonly string[];
    readonly createdAt: string;
}
export declare function validateEvidenceRecord(record: EvidenceRecord): EvidenceRecord;
export declare function evidenceMeets(record: EvidenceRecord, minimum: EvidenceStrength): boolean;
export declare function assertCompletionEvidence(records: readonly EvidenceRecord[], subjectId: string, minimum: EvidenceStrength): void;
export declare function validateRequirementClosure(record: RequirementClosureRecord): RequirementClosureRecord;
export declare function createCheckpoint(checkpoint: Checkpoint): Checkpoint;
export declare function selectLastVerifiedCheckpoint(checkpoints: readonly Checkpoint[], evidenceRecords: readonly EvidenceRecord[], subjectId: string, minimum: EvidenceStrength): Checkpoint | undefined;
