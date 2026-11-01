export type ProjectInheritanceKind = "capability" | "control" | "evaluation" | "method";
export type ProjectInheritanceApplicability = "applicable" | "not_applicable" | "unknown";
export type ProjectInheritanceValidation = "validated" | "unvalidated" | "stale" | "conflicting";
export interface ProjectInheritanceCandidate {
    readonly kind: ProjectInheritanceKind;
    readonly canonicalRef: string;
    readonly versionRef: string;
    readonly inherit: boolean;
    readonly applicability: ProjectInheritanceApplicability;
    readonly validation: ProjectInheritanceValidation;
    readonly applicabilityEvidenceRefs: readonly string[];
    readonly validationEvidenceRefs: readonly string[];
}
export interface ProjectInheritancePlan {
    readonly projectId: string;
    readonly projectTypeKey: string;
    readonly companyId?: string;
    readonly defaultInheritance: false;
    readonly candidates: readonly ProjectInheritanceCandidate[];
}
export declare function validateProjectInheritancePlan(plan: ProjectInheritancePlan): void;
export declare function assertProjectInheritanceTarget(plan: ProjectInheritancePlan, target: {
    readonly id: string;
    readonly typeKey: string;
    readonly companyId?: string;
}): void;
export declare function inheritedProjectIntelligence(plan: ProjectInheritancePlan): readonly ProjectInheritanceCandidate[];
