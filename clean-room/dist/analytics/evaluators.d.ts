export type EvaluationEvidenceClass = "synthetic" | "replay" | "staging" | "simulation" | "shadow" | "canary" | "production" | "external" | "owner_verified";
export type EvaluationDecision = "better" | "worse" | "equivalent" | "insufficient_evidence";
export type OutcomeTruth = "observed" | "verified" | "calculated" | "synthetic";
export interface EvaluatorDefinition {
    readonly key: string;
    readonly version: number;
    readonly ownerRef: string;
    readonly purpose: string;
    readonly biasRisks: readonly string[];
    readonly requiredDataClasses: readonly string[];
    readonly prohibitedDataClasses: readonly string[];
    readonly applicableDomains: readonly string[];
    readonly applicableTaskClasses: readonly string[];
    readonly minimumEvidenceClasses: readonly EvaluationEvidenceClass[];
    readonly repeatCount: number;
    readonly minimumSampleCount: number;
    readonly minimumConfidence: number;
    readonly acceptanceAuthority: "command_center" | "owner";
    readonly calibrationEvidenceRefs: readonly string[];
    readonly active: boolean;
    readonly protocol?: EvaluatorProtocol;
}
export interface DecisionTimeSnapshot {
    readonly capturedAt: string;
    readonly candidateRef: string;
    readonly baselineRef: string;
    readonly evaluatorKey: string;
    readonly evaluatorVersion: number;
    readonly inputFingerprint: string;
    readonly environmentFingerprint: string;
    readonly constraintRefs: readonly string[];
    readonly evidenceRefs: readonly string[];
}
export interface EvaluationObservation {
    readonly runRef: string;
    readonly evidenceClass: EvaluationEvidenceClass;
    readonly sampleCount: number;
    readonly repeatIndex: number;
    readonly baselineScore: number;
    readonly candidateScore: number;
    readonly confidence: number;
    readonly sourceRefs: readonly string[];
    readonly synthetic: boolean;
}
export interface EvaluationResult {
    readonly evaluatorKey: string;
    readonly evaluatorVersion: number;
    readonly decision: EvaluationDecision;
    readonly calibratedConfidence: number;
    readonly meanDelta: number;
    readonly eligibleProductionEvidence: boolean;
    readonly acceptanceEligible: boolean;
    readonly evidenceClasses: readonly EvaluationEvidenceClass[];
    readonly evidenceRefs: readonly string[];
    readonly reasonCodes: readonly string[];
}
export interface ActualOutcomeRecord {
    readonly id: string;
    readonly evaluationRunRef: string;
    readonly candidateRef: string;
    readonly observedAt: string;
    readonly truth: OutcomeTruth;
    readonly metricKey: string;
    readonly value: number;
    readonly sourceRefs: readonly string[];
    readonly confounders: readonly string[];
    readonly causalAttribution: "none" | "possible" | "supported";
}
export declare function validateEvaluator(definition: EvaluatorDefinition): EvaluatorDefinition;
export declare class EvaluatorRegistry {
    #private;
    register(definition: EvaluatorDefinition): EvaluatorDefinition;
    get(key: string, version?: number): EvaluatorDefinition | undefined;
}
export declare function evaluateCandidate(definition: EvaluatorDefinition, snapshot: DecisionTimeSnapshot, observations: readonly EvaluationObservation[], context: {
    domain: string;
    taskClass: string;
    candidateOwnerRef: string;
    calibrationScore: number;
}): EvaluationResult;
export declare function validateActualOutcome(outcome: ActualOutcomeRecord): ActualOutcomeRecord;
import { type AnalyticsScope, type AnalyticsAccess } from './contracts.js';
export interface EvaluatorProtocol {
    readonly targetRef: string;
    readonly criterionRef: string;
    readonly benchmarkRef: string;
    readonly benchmarkVersion: number;
    readonly environment: string;
    readonly minimumDelta: number;
    readonly maximumDelta: number;
    readonly invalidationTriggers: readonly string[];
    readonly revalidateAfter: string;
}
export declare function scopedEvaluation(access: AnalyticsAccess, scope: AnalyticsScope, registry: EvaluatorRegistry, key: string, version: number, snapshot: DecisionTimeSnapshot, observations: readonly EvaluationObservation[], context: {
    domain: string;
    taskClass: string;
    dataClasses: readonly string[];
    candidateOwnerRef: string;
    calibrationScore: number;
    environment: string;
    benchmarkRef: string;
    benchmarkVersion: number;
    invalidated: boolean;
}): {
    sampleCount: number;
    meanDelta: number | null;
    reasonCodes: readonly string[];
    benchmarkRef: string;
    benchmarkVersion: number;
    environment: string;
    productionObserved: boolean;
    acceptanceEligible: boolean;
    requiresRecalibration: boolean;
    authorizationGranted: boolean;
    evaluatorKey: string;
    evaluatorVersion: number;
    decision: EvaluationDecision;
    calibratedConfidence: number;
    eligibleProductionEvidence: boolean;
    evidenceClasses: readonly EvaluationEvidenceClass[];
    evidenceRefs: readonly string[];
};
export interface EvaluatorStore {
    append(scope: AnalyticsScope, definition: EvaluatorDefinition, evidenceIds: readonly string[], expectedVersion: number | null): Promise<EvaluatorDefinition>;
}
export declare function registerDurableEvaluator(access: AnalyticsAccess, registry: EvaluatorRegistry, store: EvaluatorStore, scope: AnalyticsScope, definition: EvaluatorDefinition, evidenceIds: readonly string[]): Promise<EvaluatorDefinition>;
