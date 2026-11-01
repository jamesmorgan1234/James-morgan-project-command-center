export type FinancialDecisionInputSource = "verified_current" | "owner_assumption" | "model_assumption";
export interface FinancialDecisionInput {
    readonly key: string;
    readonly cents: number;
    readonly source: FinancialDecisionInputSource;
    readonly evidenceRefs: readonly string[];
    readonly sensitivity?: Readonly<{
        lowCents: number;
        highCents: number;
    }> | undefined;
}
export interface FinancialDecisionScenarioInput {
    readonly id: string;
    readonly ownerId: string;
    readonly name: string;
    readonly currency: string;
    readonly goalRefs: readonly string[];
    readonly budgetRefs: readonly string[];
    readonly debtRefs: readonly string[];
    readonly cashflowRefs: readonly string[];
    readonly inputs: readonly FinancialDecisionInput[];
    readonly observedAt: string;
}
export interface FinancialDecisionScenarioResult {
    readonly id: string;
    readonly ownerId: string;
    readonly name: string;
    readonly currency: string;
    readonly resultingCents: number;
    readonly lowSensitivityCents: number;
    readonly highSensitivityCents: number;
    readonly verifiedInputKeys: readonly string[];
    readonly assumptionKeys: readonly string[];
    readonly evidenceRefs: readonly string[];
    readonly assumptionRefs: readonly string[];
    readonly goalRefs: readonly string[];
    readonly budgetRefs: readonly string[];
    readonly debtRefs: readonly string[];
    readonly cashflowRefs: readonly string[];
    readonly scoreForecast: null;
    readonly outcomePromise: false;
    readonly protectedActionAuthorized: false;
}
export interface FinancialDecisionRecommendation {
    readonly title: string;
    readonly rationale: string;
    readonly evidenceRefs: readonly string[];
    readonly assumptionRefs: readonly string[];
    readonly scenarioRef: string;
    readonly scoreForecast: null;
    readonly outcomePromise: false;
    readonly protectedActionAuthorized: false;
}
export declare function evaluateFinancialDecisionScenario(input: FinancialDecisionScenarioInput): FinancialDecisionScenarioResult;
export declare function buildFinancialDecisionRecommendation(title: string, rationale: string, scenario: FinancialDecisionScenarioResult, additionalEvidenceRefs?: readonly string[]): FinancialDecisionRecommendation;
