import type { AgencyRisk } from "./types.js";
export interface VerificationRequest {
    readonly taskId: string;
    readonly executorId: string;
    readonly verifierId: string;
    readonly risk: AgencyRisk;
    readonly evidenceRefs: readonly string[];
}
export declare function validateIndependentVerification(request: VerificationRequest): void;
export interface VerificationDecision {
    readonly accepted: boolean;
    readonly verifierId: string;
    readonly reason: string;
    readonly evidenceRefs: readonly string[];
}
