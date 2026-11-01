export interface CanaryMetrics {
    readonly successRate: number;
    readonly verificationFailureRate: number;
    readonly protectedBoundaryViolationCount: number;
    readonly duplicateSideEffectCount: number;
}
export interface LegacyCanaryMetrics {
    readonly stableSuccessRate: number;
    readonly candidateSuccessRate: number;
    readonly stableVerificationFailureRate: number;
    readonly candidateVerificationFailureRate: number;
    readonly protectedBoundaryViolationCount: number;
    readonly duplicateSideEffectCount: number;
}
export interface CanaryDecision {
    readonly promote: boolean;
    readonly action: "promote" | "rollback";
    readonly reason: string;
}
export declare function evaluateCanary(stable: CanaryMetrics, candidate: CanaryMetrics, maxSuccessRegression?: number): CanaryDecision;
export declare function evaluateCanary(metrics: LegacyCanaryMetrics, maxSuccessRegression?: number): CanaryDecision;
