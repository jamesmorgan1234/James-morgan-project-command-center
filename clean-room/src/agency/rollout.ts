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

function decision(promote: boolean, reason: string): CanaryDecision {
  return Object.freeze({ promote, action: promote ? "promote" : "rollback", reason });
}

function evaluate(stable: CanaryMetrics, candidate: CanaryMetrics, maxSuccessRegression: number): CanaryDecision {
  if (!Number.isFinite(maxSuccessRegression) || maxSuccessRegression < 0) throw new Error("maxSuccessRegression must be non-negative");
  if (candidate.protectedBoundaryViolationCount > 0) return decision(false, "protected_boundary_violation");
  if (candidate.duplicateSideEffectCount > 0) return decision(false, "duplicate_side_effect");
  if (candidate.successRate < stable.successRate - maxSuccessRegression) return decision(false, "success_rate_regression");
  if (candidate.verificationFailureRate > stable.verificationFailureRate) return decision(false, "verification_regression");
  return decision(true, "candidate_within_safe_thresholds");
}

export function evaluateCanary(stable: CanaryMetrics, candidate: CanaryMetrics, maxSuccessRegression?: number): CanaryDecision;
export function evaluateCanary(metrics: LegacyCanaryMetrics, maxSuccessRegression?: number): CanaryDecision;
export function evaluateCanary(stableOrLegacy: CanaryMetrics | LegacyCanaryMetrics, candidateOrRegression?: CanaryMetrics | number, maybeRegression = 0.02): CanaryDecision {
  if ("stableSuccessRate" in stableOrLegacy) {
    const regression = typeof candidateOrRegression === "number" ? candidateOrRegression : 0.02;
    const stable: CanaryMetrics = {
      successRate: stableOrLegacy.stableSuccessRate,
      verificationFailureRate: stableOrLegacy.stableVerificationFailureRate,
      protectedBoundaryViolationCount: 0,
      duplicateSideEffectCount: 0
    };
    const candidate: CanaryMetrics = {
      successRate: stableOrLegacy.candidateSuccessRate,
      verificationFailureRate: stableOrLegacy.candidateVerificationFailureRate,
      protectedBoundaryViolationCount: stableOrLegacy.protectedBoundaryViolationCount,
      duplicateSideEffectCount: stableOrLegacy.duplicateSideEffectCount
    };
    return evaluate(stable, candidate, regression);
  }
  if (!candidateOrRegression || typeof candidateOrRegression === "number") throw new Error("Candidate canary metrics are required");
  return evaluate(stableOrLegacy, candidateOrRegression, maybeRegression);
}
