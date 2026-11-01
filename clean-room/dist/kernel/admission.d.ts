export interface AdmissionPolicy {
    readonly monetaryBudgetCents: number;
    readonly maxConcurrent: number;
    readonly maxQueueDepth: number;
    readonly maxRetries: number;
    readonly maxRuntimeMs: number;
}
export interface AdmissionRequest {
    readonly estimatedCostCents?: number;
    readonly pricingKnown: boolean;
    readonly currentConcurrent: number;
    readonly queueDepth: number;
    readonly retryCount: number;
    readonly requestedRuntimeMs: number;
}
export interface AdmissionDecision {
    readonly allowed: boolean;
    readonly reason: string;
}
export declare function validateAdmissionPolicy(policy: AdmissionPolicy): void;
export declare function evaluateAdmission(policy: AdmissionPolicy, request: AdmissionRequest): AdmissionDecision;
export declare function zeroBudgetPolicy(overrides: Omit<AdmissionPolicy, "monetaryBudgetCents">): AdmissionPolicy;
