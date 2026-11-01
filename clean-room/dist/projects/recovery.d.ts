import { type ProjectInheritancePlan } from "./inheritance.js";
export type ProjectRecoveryMode = "greenfield" | "clean_rebuild" | "rescue" | "migration" | "modernization" | "reality_reconstruction" | "archived_revival" | "retirement";
export interface ProjectRecoveryPlan {
    readonly projectId: string;
    readonly mode: ProjectRecoveryMode;
    readonly lineageRefs: readonly string[];
    readonly assetRefs: readonly string[];
    readonly decisionRefs: readonly string[];
    readonly checkpointRefs: readonly string[];
    readonly ownerReactivationRef?: string;
    readonly previousInheritedIntelligenceRefs?: readonly string[];
    readonly inheritancePlan?: ProjectInheritancePlan;
}
export declare function validateRecoveryPlan(plan: ProjectRecoveryPlan): void;
