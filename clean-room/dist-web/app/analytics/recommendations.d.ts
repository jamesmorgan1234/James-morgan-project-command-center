export type RecommendationStatus = "proposed" | "accepted" | "rejected" | "parked" | "implemented" | "measured";
export interface RecommendationRecord {
    readonly id: string;
    readonly projectId: string | null;
    readonly evidenceRefs: readonly string[];
    readonly confidence: number;
    readonly expectedBenefit: string;
    readonly successCriteria: readonly string[];
    readonly status: RecommendationStatus;
    readonly implementationAuthorized: boolean;
    readonly actualOutcomeRefs: readonly string[];
}
export declare function validateRecommendation(record: RecommendationRecord): RecommendationRecord;
import { type ActualOutcomeRecord, type DecisionTimeSnapshot } from './evaluators.js';
import { type AnalyticsScope, type AnalyticsAccess, type BenchmarkClass } from './contracts.js';
export interface PredictionOutcome {
    readonly id: string;
    readonly scope: AnalyticsScope;
    readonly recommendation: RecommendationRecord;
    readonly snapshot: DecisionTimeSnapshot;
    readonly predictedValue: number;
    readonly predictedConfidence: number;
    readonly actual: ActualOutcomeRecord;
    readonly unit: string;
    readonly actualUnit: string;
    readonly metricVersion: number;
    readonly actualMetricVersion: number;
    readonly benchmarkClass: BenchmarkClass;
    readonly processCriteria: readonly {
        id: string;
        passed: boolean;
        evidenceIds: readonly string[];
    }[];
    readonly controllableFactors: readonly string[];
    readonly externalFactors: readonly string[];
    readonly confounders: readonly string[];
    readonly resultingLessonRef: string | null;
    readonly evidenceIds: readonly string[];
}
export declare function analyzeDecisionOutcome(access: AnalyticsAccess, input: PredictionOutcome): {
    id: string;
    scope: AnalyticsScope;
    recommendationId: string;
    snapshot: DecisionTimeSnapshot;
    metricKey: string;
    metricVersion: number;
    unit: string;
    actualOutcomeRef: string;
    predictedValue: number;
    predictionError: number;
    confidence: number;
    processQuality: number | null;
    outcomeValue: number;
    benchmarkClass: BenchmarkClass;
    confounders: string[];
    causalAttribution: "none" | "possible" | "supported";
    controllableFactors: readonly string[];
    externalFactors: readonly string[];
    resultingLessonRef: string | null;
    globallyApplicable: boolean;
    authorizationGranted: boolean;
};
export interface TransferEffectInput {
    readonly decisionId: string;
    readonly scope: AnalyticsScope;
    readonly sourceBrainId: string;
    readonly recipientBrainId: string;
    readonly sourceMethodVersionRef: string;
    readonly before: number | null;
    readonly after: number | null;
    readonly direction: 'higher' | 'lower';
    readonly baselineAt: string;
    readonly afterAt: string;
    readonly unit: string;
    readonly baselineUnit: string;
    readonly benchmarkClass: BenchmarkClass;
    readonly baselineBenchmarkClass: BenchmarkClass;
    readonly confounders: readonly string[];
    readonly evidenceIds: readonly string[];
}
export declare function measureTransferEffect(access: AnalyticsAccess, input: TransferEffectInput): {
    delta: number | null;
    result: string;
    causalClaim: boolean;
    globalPromotionAllowed: boolean;
    authorizationGranted: boolean;
    decisionId: string;
    scope: AnalyticsScope;
    sourceBrainId: string;
    recipientBrainId: string;
    sourceMethodVersionRef: string;
    before: number | null;
    after: number | null;
    direction: "higher" | "lower";
    baselineAt: string;
    afterAt: string;
    unit: string;
    baselineUnit: string;
    benchmarkClass: BenchmarkClass;
    baselineBenchmarkClass: BenchmarkClass;
    confounders: readonly string[];
    evidenceIds: readonly string[];
};
export interface CalibrationObservation {
    readonly id: string;
    readonly predicted: number;
    readonly actual: 0 | 1;
    readonly predictedAt: string;
    readonly observedAt: string;
    readonly benchmarkClass: BenchmarkClass;
    readonly evidenceIds: readonly string[];
}
export declare function calibrationReport(access: AnalyticsAccess, scope: AnalyticsScope, observations: readonly CalibrationObservation[], minimumSamples: number, baselineBrier?: number | null): {
    state: string;
    sampleCount: number;
    brier: null;
    calibrationGap: null;
    drift: null;
} | {
    state: string;
    sampleCount: number;
    brier: number;
    calibrationGap: number;
    drift: number | null;
};
