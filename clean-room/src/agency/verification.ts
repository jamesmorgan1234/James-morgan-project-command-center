import type { AgencyRisk } from "./types.js";

export interface VerificationRequest {
  readonly taskId: string;
  readonly executorId: string;
  readonly verifierId: string;
  readonly risk: AgencyRisk;
  readonly evidenceRefs: readonly string[];
}

export function validateIndependentVerification(request: VerificationRequest): void {
  if (request.evidenceRefs.length === 0) throw new Error("Verification requires evidence");
  if (["high", "critical"].includes(request.risk) && request.executorId === request.verifierId) throw new Error("High-risk task requires independent verifier");
}

export interface VerificationDecision {
  readonly accepted: boolean;
  readonly verifierId: string;
  readonly reason: string;
  readonly evidenceRefs: readonly string[];
}
