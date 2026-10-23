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

export function decideStartup(assessment: StartupAssessment): StartupDecision {
  if (!assessment.configValid) return { mode: "recovery", reason: "invalid_configuration", rollbackAvailable: assessment.knownGoodReleaseAvailable };
  if (!assessment.schemaCompatible) return { mode: "recovery", reason: "schema_incompatible", rollbackAvailable: assessment.knownGoodReleaseAvailable };
  if (!assessment.releaseCompatible) return { mode: "recovery", reason: "release_incompatible", rollbackAvailable: assessment.knownGoodReleaseAvailable };
  return { mode: "normal", reason: "startup_checks_passed", rollbackAvailable: assessment.knownGoodReleaseAvailable };
}
