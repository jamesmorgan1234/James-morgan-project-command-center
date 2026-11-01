export interface ScenarioInput {
    readonly key: string;
    readonly cents: number;
    readonly source: "verified_current" | "owner_assumption" | "model_assumption";
    readonly evidenceRefs: readonly string[];
}
export interface FinancialScenarioResult {
    readonly name: string;
    readonly resultingCents: number;
    readonly assumptionKeys: readonly string[];
    readonly verifiedInputKeys: readonly string[];
    readonly outcomePromise: false;
}
export declare function calculateAdditiveScenario(name: string, inputs: readonly ScenarioInput[]): FinancialScenarioResult;
