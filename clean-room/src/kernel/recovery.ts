export type StartupMode = "normal" | "recovery";

export interface StartupAssessment {
  readonly configValid: boolean;
  readonly schemaCompatible: boolean;
  readonly releaseCompatible: boolean;
  readonly knownGoodReleaseAvailable: boolean;
}

export interface StartupDecision {
  readonly mode: StartupMode;
  readonly reason: string;
  readonly rollbackAvailable: boolean;
}

export type ControlPlaneState = "healthy" | "degraded" | "unavailable";

export interface ProtectedRecoveryAssessment {
  readonly policyState: ControlPlaneState;
  readonly revocationStateFresh: boolean;
  readonly protectedEffectRequested: boolean;
  readonly recoveryAuthorization?: Readonly<{
    id: string;
    scope: string;
    expiresAt: string;
    singleUse: boolean;
  }>;
  readonly now: string;
}

export interface ProtectedRecoveryDecision {
  readonly allowed: boolean;
  readonly reason: string;
  readonly recoveryOnly: boolean;
}

export function decideStartup(assessment: StartupAssessment): StartupDecision {
  if (!assessment.configValid) return { mode: "recovery", reason: "invalid_configuration", rollbackAvailable: assessment.knownGoodReleaseAvailable };
  if (!assessment.schemaCompatible) return { mode: "recovery", reason: "schema_incompatible", rollbackAvailable: assessment.knownGoodReleaseAvailable };
  if (!assessment.releaseCompatible) return { mode: "recovery", reason: "release_incompatible", rollbackAvailable: assessment.knownGoodReleaseAvailable };
  return { mode: "normal", reason: "startup_checks_passed", rollbackAvailable: assessment.knownGoodReleaseAvailable };
}

export function evaluateProtectedRecovery(assessment: ProtectedRecoveryAssessment): ProtectedRecoveryDecision {
  if (!assessment.protectedEffectRequested) return Object.freeze({ allowed: true, reason: "non_protected_recovery_action", recoveryOnly: true });
  if (assessment.policyState === "healthy" && assessment.revocationStateFresh) return Object.freeze({ allowed: false, reason: "use_normal_policy_path", recoveryOnly: true });
  const authorization = assessment.recoveryAuthorization;
  if (!authorization) return Object.freeze({ allowed: false, reason: "recovery_authorization_required", recoveryOnly: true });
  if (!authorization.id.trim() || !authorization.scope.trim() || !authorization.singleUse) return Object.freeze({ allowed: false, reason: "invalid_recovery_authorization", recoveryOnly: true });
  const now = Date.parse(assessment.now);
  const expiry = Date.parse(authorization.expiresAt);
  if (!Number.isFinite(now) || !Number.isFinite(expiry) || now >= expiry) return Object.freeze({ allowed: false, reason: "recovery_authorization_expired", recoveryOnly: true });
  return Object.freeze({ allowed: true, reason: "constrained_recovery_authorized", recoveryOnly: true });
}
