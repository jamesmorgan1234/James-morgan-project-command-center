export type ClaimClass = "verified_fact" | "owner_decision" | "assumption" | "estimate" | "recommendation";
export interface PlanningClaim {
    readonly id: string;
    readonly class: ClaimClass;
    readonly statement: string;
    readonly evidenceRefs: readonly string[];
    readonly confidence?: number;
}
export interface BrainPlan {
    readonly id: string;
    readonly projectId?: string;
    readonly objective: string;
    readonly claims: readonly PlanningClaim[];
    readonly proposedActions: readonly string[];
    readonly requiresOwnerDecision: boolean;
}
export declare function validateBrainPlan(plan: BrainPlan): void;
export type ScenarioTruthClass = "observed_fact" | "assumption" | "simulation" | "counterfactual" | "causal_claim";
export type SensitivityDirection = "increase" | "decrease" | "nonlinear" | "unknown";
export interface ScenarioSensitivity {
    readonly variable: string;
    readonly direction: SensitivityDirection;
    readonly magnitude?: number;
}
export interface ScenarioStatement {
    readonly id: string;
    readonly class: ScenarioTruthClass;
    readonly statement: string;
    readonly evidenceRefs: readonly string[];
    readonly confidence?: number;
    readonly assumptions?: readonly string[];
    readonly sensitivity?: readonly ScenarioSensitivity[];
    readonly causalBasisRefs?: readonly string[];
}
export interface ScenarioAnalysis {
    readonly id: string;
    readonly objective: string;
    readonly statements: readonly ScenarioStatement[];
}
/**
 * P6.5 scenario truth contract. Observations, assumptions, simulations, counterfactuals,
 * and causal claims remain distinct so synthetic reasoning cannot masquerade as observed reality.
 */
export declare function validateScenarioAnalysis(analysis: ScenarioAnalysis): ScenarioAnalysis;
