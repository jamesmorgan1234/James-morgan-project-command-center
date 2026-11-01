import type { IntelligenceApplicability, IntelligencePrivacyBoundary } from "./intelligence-contracts.js";
export type LearningValidationState = "submitted" | "validated" | "contradicted" | "stale" | "invalid" | "retracted";
export type PromotionClass = "GLOBAL" | "DOMAIN" | "BRAIN" | "TASK" | "CONDITION" | "EXPERIMENTAL" | "QUARANTINED" | "REJECTED" | "ALTERNATIVE" | "DEPRECATED";
export type PromotionLifecycle = "classified" | "promoted" | "quarantined" | "rejected" | "alternative" | "deprecated" | "retracted";
export interface LearningMetric {
    readonly key: string;
    readonly baseline: number;
    readonly measured: number;
    readonly unit: string;
}
export interface LearningPacket {
    readonly id: string;
    readonly version: number;
    readonly sourceBrainId: string;
    readonly sourceSystemRef: string;
    readonly sourceCompanyId?: string;
    readonly sourceProjectId?: string;
    readonly sourceRunId?: string;
    readonly sourceTaskId?: string;
    readonly sourceMethodId: string;
    readonly sourceMethodVersion: number;
    readonly sourceCapabilityKey: string;
    readonly observedAt: string;
    readonly taskClass: string;
    readonly domainId: string;
    readonly conditionIds: readonly string[];
    readonly constraints: readonly string[];
    readonly discovery: string;
    readonly action: string;
    readonly evidenceIds: readonly string[];
    readonly sourceRefs: readonly string[];
    readonly sampleCount: number;
    readonly metrics: readonly LearningMetric[];
    readonly outcome: string;
    readonly successCriteria: readonly string[];
    readonly failureCriteria: readonly string[];
    readonly confidence: number;
    readonly calibration: number;
    readonly reproducibility: number;
    readonly causalConfidence: number;
    readonly confounders: readonly string[];
    readonly limitations: readonly string[];
    readonly failureConditions: readonly string[];
    readonly prerequisites: readonly string[];
    readonly requiredTools: readonly string[];
    readonly requiredDataClasses: readonly string[];
    readonly resourceImplications: readonly string[];
    readonly latencyImplications: readonly string[];
    readonly financialImplications: readonly string[];
    readonly privacy: IntelligencePrivacyBoundary;
    readonly securityImplications: readonly string[];
    readonly applicableSystems: readonly string[];
    readonly transferabilityHypothesis: string;
    readonly proposedScope: IntelligenceApplicability;
    readonly proposedPromotionClass: PromotionClass;
    readonly validationState: LearningValidationState;
    readonly freshUntil: string;
    readonly revalidateAfter: string;
    readonly negativeKnowledge: readonly string[];
    readonly recoveryLesson: readonly string[];
    readonly rollbackEvidenceId: string;
    readonly retractionEvidenceIds: readonly string[];
    readonly provenanceEvidenceIds: readonly string[];
}
export interface PromotionReadiness {
    readonly epistemicsReady: boolean;
    readonly evaluatorReady: boolean;
    readonly negativeKnowledgeReady: boolean;
    readonly traceReady: boolean;
    readonly recoveryReady: boolean;
}
export interface PromotionDecision {
    readonly id: string;
    readonly version: number;
    readonly packetId: string;
    readonly packetVersion: number;
    readonly classification: PromotionClass;
    readonly lifecycle: PromotionLifecycle;
    readonly applicability: IntelligenceApplicability;
    readonly evidenceIds: readonly string[];
    readonly validatorRefs: readonly string[];
    readonly reasonCodes: readonly string[];
    readonly decidedAt: string;
    readonly expiresAt: string;
    readonly rollbackEvidenceId: string;
    readonly executablePolicy: false;
}
export declare function validateLearningPacket(packet: LearningPacket, now: string): LearningPacket;
export declare class LearningPromotionGovernor {
    #private;
    submit(packet: LearningPacket, now: string): LearningPacket;
    decide(packetId: string, promotionId: string, readiness: PromotionReadiness, validatorRefs: readonly string[], now: string): PromotionDecision;
    retract(promotionId: string, evidenceId: string, now: string): PromotionDecision;
    latest(packetId: string): LearningPacket | undefined;
    latestDecision(promotionId: string): PromotionDecision | undefined;
}
