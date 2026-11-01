import { type AnalyticsScope } from "./contracts.js";
export type MetricTruth = "verified" | "calculated" | "estimated";
export type MissingSemantics = "unknown" | "not_applicable";
export interface MetricDefinition {
    readonly key: string;
    readonly version?: number;
    readonly semantics?: MetricSemantics;
    readonly domain: string;
    readonly owner: string;
    readonly sourceKind: string;
    readonly formulaRef: string | null;
    readonly freshnessMs: number;
    readonly truth: MetricTruth;
    readonly format: string;
    readonly zeroMeaning: string;
    readonly missingMeaning: MissingSemantics;
}
export interface MetricValue {
    readonly metricKey: string;
    readonly value: number | null;
    readonly observedAt: string;
    readonly sourceRefs: readonly string[];
    readonly truth: MetricTruth;
}
export declare class MetricRegistry {
    #private;
    register(definition: MetricDefinition): MetricDefinition;
    registerVersion(definition: MetricDefinition, expectedVersion: number): MetricDefinition;
    get(key: string, exactVersion?: number): MetricDefinition;
    list(): readonly MetricDefinition[];
}
export declare function validateMetricValue(registry: MetricRegistry, value: MetricValue, nowMs: number): MetricValue;
export interface MetricSemantics {
    readonly definition: string;
    readonly applicabilityScopeKeys: readonly string[];
    readonly unit: string;
    readonly dataType: 'integer' | 'number';
    readonly aggregation: 'sum' | 'mean' | 'last' | 'ratio' | 'count';
    readonly direction: 'higher' | 'lower' | 'neutral';
    readonly min: number | null;
    readonly max: number | null;
    readonly numeratorRef: string | null;
    readonly denominatorRef: string | null;
    readonly windowMs: number;
    readonly timeBasis: 'event_time';
    readonly eventTimeField: string;
    readonly processingTimeField: string;
    readonly calibration: 'not_applicable' | 'probability';
    readonly privacy: 'project_private';
    readonly causalLimitation: 'correlational';
    readonly dependencyVersionRefs: readonly string[];
    readonly lifecycle: 'active' | 'deprecated';
    readonly supersedesVersion: number | null;
    readonly validationState: 'verified';
    readonly metricClass: string;
}
export type ObservationState = 'known' | 'unknown' | 'not_applicable' | 'absent' | 'deleted' | 'stale' | 'conflicting';
export interface SemanticMetricObservation {
    readonly id: string;
    readonly metricKey: string;
    readonly metricVersion: number;
    readonly scope: AnalyticsScope;
    readonly unit: string;
    readonly windowStart: string;
    readonly windowEnd: string;
    readonly occurredAt: string;
    readonly receivedAt: string;
    readonly state: ObservationState;
    readonly value: number | null;
    readonly truth: MetricTruth;
    readonly uncertainty: number | null;
    readonly confidence: number | null;
    readonly evidenceIds: readonly string[];
    readonly benchmarkClass: import('./contracts.js').BenchmarkClass;
}
export declare function validateMetricSemantics(s: MetricSemantics): void;
export declare function validateSemanticObservation(registry: MetricRegistry, o: SemanticMetricObservation, now: string, historical?: boolean): SemanticMetricObservation;
export declare function aggregateSemanticObservations(registry: MetricRegistry, observations: readonly SemanticMetricObservation[], now: string, historical?: boolean): {
    value: null;
    state: "unknown";
    truth: "calculated";
    reason: string;
    evidenceIds: string[];
} | {
    value: number;
    state: "known";
    truth: "calculated";
    reason: string;
    evidenceIds: string[];
};
export declare function semanticRatio(numerator: number | null, denominator: number | null): {
    state: "unknown";
    value: null;
} | {
    state: "known";
    value: number;
};
export declare function semanticMetricView(registry: MetricRegistry, observation: SemanticMetricObservation, now: string): {
    metricKey: string;
    version: number;
    meaning: string;
    unit: string;
    sourceEvidenceIds: readonly string[];
    observedAt: string;
    freshnessMs: number;
    temporalState: string;
    state: ObservationState;
    value: number | null;
    historicalValue: number | null;
    truth: MetricTruth;
};
