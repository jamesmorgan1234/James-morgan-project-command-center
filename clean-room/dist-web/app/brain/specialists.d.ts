import { type RegistryRecord } from "../kernel/registry.js";
/** C6 compatibility shape. PIF.3 canonical specialist authority is SpecialistModelContract below. */
export interface SpecialistBrainDefinition {
    readonly key: string;
    readonly version: number;
    readonly scope: "meta" | "project" | "business" | "books" | "finance" | "personal" | "custom";
    readonly capabilities: readonly string[];
    readonly allowedMemoryKinds: readonly string[];
}
export interface SharedPattern {
    readonly id: string;
    readonly version: number;
    readonly provenanceRefs: readonly string[];
    readonly applicableScopes: readonly string[];
    readonly deprecated: boolean;
}
export type SpecialistLifecycle = "active" | "suspended" | "retired";
export type SpecialistLearningEligibility = "none" | "local_only" | "promotion_candidate";
export type SpecialistExperimentStatus = "stable" | "experimental" | "control" | "candidate";
export type SpecialistHealth = "healthy" | "degraded" | "unavailable";
export type SpecialistVerificationState = "verified" | "owner_approved" | "experimental";
export type SpecialistResourceClass = "low" | "medium" | "high";
export type SpecialistCostClass = "free" | "paid" | "unknown";
export interface SpecialistModelAssignment {
    readonly providerKey: string;
    readonly modelId: string;
    readonly versionRef: string;
    readonly routeKey?: string;
}
export interface SpecialistModelContract extends RegistryRecord {
    readonly key: string;
    readonly version: number;
    readonly enabled: boolean;
    readonly controlPlane: "command_center";
    readonly domain: string;
    readonly subdomains: readonly string[];
    readonly supportedCompanyIds: readonly string[];
    readonly supportedProjectIds: readonly string[];
    readonly supportedWorkClasses: readonly string[];
    readonly strengths: readonly string[];
    readonly weaknesses: readonly string[];
    readonly capabilityKeys: readonly string[];
    readonly methodIds: readonly string[];
    readonly permissionKeys: readonly string[];
    readonly protectedActionBoundaries: readonly string[];
    readonly dataClasses: readonly string[];
    readonly toolKeys: readonly string[];
    readonly providerKeys: readonly string[];
    readonly modelAssignments: readonly SpecialistModelAssignment[];
    readonly dependencyVersionRefs: readonly string[];
    readonly calibrationScore: number;
    readonly evaluationEvidenceIds: readonly string[];
    readonly historicalAccuracy: number;
    readonly reliabilityScore: number;
    readonly latencyMs: number;
    readonly resourceClass: SpecialistResourceClass;
    readonly costClass: SpecialistCostClass;
    readonly failureModes: readonly string[];
    readonly degradedModes: readonly string[];
    readonly fallbackSpecialistIds: readonly string[];
    readonly delegationTargets: readonly string[];
    readonly learningEligibility: SpecialistLearningEligibility;
    readonly experimentStatus: SpecialistExperimentStatus;
    readonly health: SpecialistHealth;
    readonly lifecycle: SpecialistLifecycle;
    readonly rollbackEvidenceId: string;
    readonly provenanceEvidenceIds: readonly string[];
    readonly verificationState: SpecialistVerificationState;
    readonly revalidatedAt: string;
    readonly revalidateAfter: string;
}
export interface SpecialistControlAuthority {
    readonly actor: "owner" | "command_center" | "specialist";
    readonly specialistId?: string;
    readonly evidenceIds: readonly string[];
}
export interface SpecialistProjectionRequest {
    readonly specialistId: string;
    readonly specialistVersion: number;
    readonly companyId?: string;
    readonly projectId?: string;
    readonly workClasses: readonly string[];
    readonly dataClasses: readonly string[];
    readonly capabilityKeys: readonly string[];
    readonly permissionKeys: readonly string[];
}
export declare function validateSpecialistModel(model: SpecialistModelContract): void;
export declare function validateSpecialistProjection(model: SpecialistModelContract, projection: SpecialistProjectionRequest): void;
export declare class SpecialistBrainRegistry {
    #private;
    /** Legacy C6 registration retained for compatibility; it is not the PIF.3 canonical authority contract. */
    registerBrain(brain: SpecialistBrainDefinition): void;
    removeBrain(key: string): SpecialistBrainDefinition;
    registerModel(model: SpecialistModelContract, authority: SpecialistControlAuthority): void;
    replaceModel(model: SpecialistModelContract, expectedVersion: number, authority: SpecialistControlAuthority): void;
    suspendModel(key: string, expectedVersion: number, authority: SpecialistControlAuthority): SpecialistModelContract;
    retireModel(key: string, expectedVersion: number, authority: SpecialistControlAuthority): SpecialistModelContract;
    /** Atomic synchronous canonical batch for evidence-governed split/merge/evolution.
     * Validate every precondition before mutation; JavaScript cannot interleave these writes. */
    applyModelBatch(changes: readonly {
        readonly model: SpecialistModelContract;
        readonly expectedVersion: number | null;
    }[], authority: SpecialistControlAuthority): readonly SpecialistModelContract[];
    getModel(key: string): SpecialistModelContract | undefined;
    listModels(): readonly SpecialistModelContract[];
    validateProjection(projection: SpecialistProjectionRequest): void;
    registerPattern(pattern: SharedPattern): void;
    usablePatterns(scope: string): readonly SharedPattern[];
}
