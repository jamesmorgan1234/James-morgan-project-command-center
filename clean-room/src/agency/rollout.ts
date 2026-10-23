export interface CanaryMetrics {
  readonly successRate: number;
  readonly verificationFailureRate: number;
  readonly protectedBoundaryViolationCount: number;
  readonly duplicateSideEffectCount: number;
}

export interface CanaryDecision {
  readonly promote: boolean;
  readonly reason: string;
}

export function evaluateCanary(stable: CanaryMetrics, candidate: CanaryMetrics, maxSuccessRegression = 0.02): CanaryDecision {
  if (candidate.protectedBoundaryViolationCount > 0) return Object.freeze({ promote: false, reason: "protected_boundary_violation" });
  if (candidate.duplicateSideEffectCount > 0) return Object.freeze({ promote: false, reason: "duplicate_side_effect" });
  if (candidate.successRate < stable.successRate - maxSuccessRegression) return Object.freeze({ promote: false, reason: "success_rate_regression" });
  if (candidate.verificationFailureRate > stable.verificationFailureRate) return Object.freeze({ promote: false, reason: "verification_regression" });
  return Object.freeze({ promote: true, reason: "candidate_within_safe_thresholds" });
}
