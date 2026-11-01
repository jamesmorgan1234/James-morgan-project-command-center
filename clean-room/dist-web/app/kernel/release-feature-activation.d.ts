import { type EvidenceRecord } from "./evidence.js";
import { SafeFeatureFlags, type FeatureFlagRecord } from "./resilience.js";
export interface DeploymentHealthEvidence extends EvidenceRecord {
    readonly candidateId: string;
    readonly deploymentId: string;
    readonly health: "healthy" | "degraded" | "failed";
    readonly validUntil: string;
}
export interface ReleaseFeatureActivationRequest {
    readonly candidateId: string;
    readonly deploymentId: string;
    readonly scopeRef: string;
    readonly now: string;
}
export declare class ReleaseFeatureActivationGate {
    #private;
    constructor(flags: SafeFeatureFlags);
    enable(record: FeatureFlagRecord, expectedVersion: number, evidence: DeploymentHealthEvidence | undefined, request: ReleaseFeatureActivationRequest): void;
}
