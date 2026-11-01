export interface BookQaRequirement {
    readonly key: string;
    readonly required: boolean;
}
export interface BookQaEvidence {
    readonly requirementKey: string;
    readonly passed: boolean;
    readonly evidenceRefs: readonly string[];
}
export interface BookSubtypeProfile {
    readonly key: string;
    readonly requirements: readonly BookQaRequirement[];
}
export declare function evaluateBookQa(profile: BookSubtypeProfile, evidence: readonly BookQaEvidence[]): Readonly<{
    pass: boolean;
    missing: readonly string[];
    failed: readonly string[];
}>;
export type BookProductionSubtype = "fiction" | "nonfiction" | "cookbook" | "workbook" | "coloring" | "activity";
export type BookQualityGateKind = "editing" | "continuity" | "originality" | "image" | "interior" | "format";
export interface BookSubtypeQualityGate {
    readonly key: string;
    readonly kind: BookQualityGateKind;
    readonly required: boolean;
    readonly description: string;
}
export interface EvidenceBackedBookSubtypeProfile {
    readonly key: string;
    readonly ownerId: string;
    readonly subtype: BookProductionSubtype;
    readonly version: number;
    readonly gates: readonly BookSubtypeQualityGate[];
    readonly sourceRefs: readonly string[];
    readonly observedAt: string;
}
export interface EvidenceBackedBookQaEvidence {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly profileKey: string;
    readonly profileVersion: number;
    readonly requirementKey: string;
    readonly passed: boolean;
    readonly evidenceRefs: readonly string[];
    readonly artifactRefs: readonly string[];
    readonly evaluatorRef: string;
    readonly observedAt: string;
}
export interface BookQaAssessment {
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly profileKey: string;
    readonly profileVersion: number;
    readonly pass: boolean;
    readonly mayAdvance: boolean;
    readonly missing: readonly string[];
    readonly failed: readonly string[];
    readonly evidenceIds: readonly string[];
}
export declare function validateSubtypeProfile(profile: EvidenceBackedBookSubtypeProfile): EvidenceBackedBookSubtypeProfile;
export declare function validateBookQaEvidence(evidence: EvidenceBackedBookQaEvidence, profile: EvidenceBackedBookSubtypeProfile): EvidenceBackedBookQaEvidence;
export declare function assessBookProductionQa(profile: EvidenceBackedBookSubtypeProfile, evidence: readonly EvidenceBackedBookQaEvidence[], ownerId: string, projectId: string, bookId: string): BookQaAssessment;
export declare function assertBookProductionMayAdvance(assessment: BookQaAssessment): void;
export declare function defaultBookSubtypeProfile(ownerId: string, subtype: BookProductionSubtype, version: number, sourceRefs: readonly string[], observedAt: string): EvidenceBackedBookSubtypeProfile;
