export interface ReliabilitySignal {
    readonly domain: string;
    readonly kind: "availability" | "latency" | "error_rate" | "queue_depth" | "retry_rate" | "provider_health" | "resource_saturation" | "cache_health" | "update_health";
    readonly severity: "ok" | "warning" | "critical";
    readonly value: number;
    readonly sourceRefs: readonly string[];
}
export declare function identifyReliabilityBottleneck(signals: readonly ReliabilitySignal[]): Readonly<{
    domain: string;
    severity: "warning" | "critical";
    reasons: readonly string[];
}> | null;
import { type AnalyticsAccess, type AnalyticsScope } from './contracts.js';
export interface ObservedReliabilitySignal extends Omit<ReliabilitySignal, 'value'> {
    readonly value: number | null;
    readonly scope: AnalyticsScope;
    readonly observedAt: string;
    readonly freshnessMs: number;
    readonly truth: 'observed' | 'estimated' | 'unknown';
    readonly dependencyVersionRef: string;
    readonly sloCandidateRef: string | null;
    readonly revalidateAfter: string;
}
export declare function scopedReliability(access: AnalyticsAccess, scope: AnalyticsScope, signals: readonly ObservedReliabilitySignal[]): {
    observed: ObservedReliabilitySignal[];
    inferred: ObservedReliabilitySignal[];
    unknown: string[];
    bottleneck: Readonly<{
        domain: string;
        severity: "warning" | "critical";
        reasons: readonly string[];
    }> | null;
    authorizationGranted: boolean;
};
export declare const ECOSYSTEM_HEALTH_SIGNALS: readonly ["calibration_drift", "contradiction_growth", "stale_memory_rate", "evaluator_coverage", "routing_regret", "fallback_rate", "verifier_rejection_rate", "repeated_failure_count", "overconfidence", "cross_specialist_disagreement", "transfer_success_rate", "quarantine_backlog", "architecture_drift", "negative_knowledge_recurrence"];
export declare function ecosystemHealth(access: AnalyticsAccess, scope: AnalyticsScope, inputs: readonly {
    key: typeof ECOSYSTEM_HEALTH_SIGNALS[number];
    numerator: number | null;
    denominator: number | null;
    observedAt: string;
    freshnessMs: number;
    evidenceIds: readonly string[];
}[]): {
    scope: AnalyticsScope;
    values: Record<string, {
        value: number | null;
        state: "known" | "unknown";
        evidenceIds: readonly string[];
    }>;
    authorizationGranted: boolean;
};
import { MetricRegistry, type MetricDefinition } from './metrics.js';
/** Static semantics only. No health observation is minted by registering these definitions. */
export declare function registerEcosystemHealthMetrics(registry: MetricRegistry): readonly MetricDefinition[];
