/**
 * Cutover discipline.
 *
 * A full replacement built off production, cut over all at once, from a staging
 * environment that matches production, with locked release order, a checklist,
 * a dry run, a smoke test, a change freeze and a protected production branch.
 */
export interface CutoverOrder {
    readonly frontend: number;
    readonly serviceWorker: number;
    readonly featureFlags: number;
    readonly validation: number;
}
export interface CutoverPlan {
    readonly fullReplacement: boolean;
    readonly partialCutover: boolean;
    readonly stagingMatchesProduction: boolean;
    readonly productionDataReadOnlyInStaging: boolean;
    readonly syntheticFixtures: boolean;
    readonly checklist: readonly string[];
    readonly dryRunCompleted: boolean;
    readonly expectedDurationMinutes: number;
    readonly order: CutoverOrder;
    readonly smokeTest: readonly string[];
    readonly featureExpansionAllowed: boolean;
    readonly changeFreeze: boolean;
    readonly productionBranchProtected: boolean;
}
export declare function validateCutoverPlan(plan: CutoverPlan): CutoverPlan;
export declare function assertDependenciesFresh(verifiedAt: string, cutoverAt: string, maximumAgeMinutes?: number): void;
