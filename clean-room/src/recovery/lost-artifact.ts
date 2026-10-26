export type OriginalRecoveryOutcome = "found" | "not_found" | "blocked";

export interface OriginalRecoveryAttempt {
  readonly candidateRef: string;
  readonly outcome: OriginalRecoveryOutcome;
  readonly evidenceRef: string;
  readonly recoveredOriginalRef?: string;
}

export interface ReconstructionRecord {
  readonly label: "RECONSTRUCTION";
  readonly artifactRef: string;
  readonly sourceRefs: readonly string[];
  readonly evidenceRefs: readonly string[];
}

export interface LostArtifactRecoveryPlan {
  readonly missingArtifactRef: string;
  readonly originalSourceCandidates: readonly string[];
  readonly authorizedCandidateRefs: readonly string[];
  readonly attempts: readonly OriginalRecoveryAttempt[];
  readonly reconstruction?: ReconstructionRecord;
}

export type LostArtifactRecoveryDecision =
  | { readonly status: "original_recovered"; readonly originalRef: string; readonly evidenceRefs: readonly string[] }
  | { readonly status: "awaiting_authorization"; readonly remainingCandidateRefs: readonly string[] }
  | { readonly status: "original_search_required"; readonly remainingCandidateRefs: readonly string[] }
  | { readonly status: "recovery_blocked"; readonly blockedCandidateRefs: readonly string[] }
  | { readonly status: "original_exhausted" }
  | { readonly status: "reconstruction_allowed"; readonly reconstruction: ReconstructionRecord };

function unique(values: readonly string[], label: string, allowEmpty = false): readonly string[] {
  const normalized = values.map((value) => value.trim());
  if ((!allowEmpty && normalized.length === 0) || normalized.some((value) => !value) || new Set(normalized).size !== normalized.length) throw new Error(`${label} must be unique and nonblank`);
  return Object.freeze(normalized);
}

export function evaluateOriginalFirstRecovery(plan: LostArtifactRecoveryPlan): LostArtifactRecoveryDecision {
  if (!plan.missingArtifactRef.trim()) throw new Error("missing artifact reference required");
  const candidates = unique(plan.originalSourceCandidates, "original source candidates");
  const authorized = unique(plan.authorizedCandidateRefs, "authorized candidate refs", true);
  for (const ref of authorized) if (!candidates.includes(ref)) throw new Error(`authorized original candidate is not declared: ${ref}`);

  const attempted = new Set<string>();
  for (const attempt of plan.attempts) {
    if (!candidates.includes(attempt.candidateRef)) throw new Error(`recovery attempt is not a declared original candidate: ${attempt.candidateRef}`);
    if (!authorized.includes(attempt.candidateRef)) throw new Error(`unauthorized original-source recovery attempt: ${attempt.candidateRef}`);
    if (attempted.has(attempt.candidateRef)) throw new Error(`duplicate original-source recovery attempt: ${attempt.candidateRef}`);
    attempted.add(attempt.candidateRef);
    if (!attempt.evidenceRef.trim()) throw new Error("original-source recovery attempt requires evidence");
    if (attempt.outcome === "found") {
      if (!attempt.recoveredOriginalRef?.trim()) throw new Error("found original requires recovered original reference");
      return Object.freeze({ status: "original_recovered", originalRef: attempt.recoveredOriginalRef.trim(), evidenceRefs: Object.freeze([attempt.evidenceRef.trim()]) });
    }
    if (attempt.recoveredOriginalRef !== undefined) throw new Error("non-found original attempt cannot claim a recovered original reference");
  }

  const unauthorized = candidates.filter((ref) => !authorized.includes(ref));
  if (unauthorized.length > 0) {
    if (plan.reconstruction !== undefined) throw new Error("reconstruction cannot begin while original-source authorization is unresolved");
    return Object.freeze({ status: "awaiting_authorization", remainingCandidateRefs: Object.freeze(unauthorized) });
  }

  const unattempted = candidates.filter((ref) => !attempted.has(ref));
  if (unattempted.length > 0) {
    if (plan.reconstruction !== undefined) throw new Error("reconstruction cannot begin before authorized original-source recovery is exhausted");
    return Object.freeze({ status: "original_search_required", remainingCandidateRefs: Object.freeze(unattempted) });
  }

  const blocked = plan.attempts.filter((attempt) => attempt.outcome === "blocked").map((attempt) => attempt.candidateRef);
  if (blocked.length > 0) {
    if (plan.reconstruction !== undefined) throw new Error("reconstruction cannot bypass a blocked original-source recovery path");
    return Object.freeze({ status: "recovery_blocked", blockedCandidateRefs: Object.freeze(blocked) });
  }

  if (plan.reconstruction === undefined) return Object.freeze({ status: "original_exhausted" });
  if (plan.reconstruction.label !== "RECONSTRUCTION") throw new Error("reconstructed artifact must be explicitly labeled RECONSTRUCTION");
  if (!plan.reconstruction.artifactRef.trim() || plan.reconstruction.artifactRef === plan.missingArtifactRef) throw new Error("reconstruction must use a distinct nonblank artifact reference");
  const reconstruction = Object.freeze({
    ...plan.reconstruction,
    sourceRefs: unique(plan.reconstruction.sourceRefs, "reconstruction source refs"),
    evidenceRefs: unique(plan.reconstruction.evidenceRefs, "reconstruction evidence refs")
  });
  return Object.freeze({ status: "reconstruction_allowed", reconstruction });
}
