export interface AgencyAnalyticsSample {
    readonly projectId: string;
    readonly workerId: string;
    readonly claimLatencyMs: number;
    readonly leaseLosses: number;
    readonly staleWriteBlocks: number;
    readonly conflicts: number;
    readonly verifierRejects: number;
    readonly steals: number;
    readonly queueDepth: number;
    readonly resourceUnits: number;
    readonly sensitiveTaskContentIncluded: boolean;
}
export declare function summarizeAgency(samples: readonly AgencyAnalyticsSample[]): Readonly<{
    workers: number;
    averageClaimLatencyMs: number;
    leaseLosses: number;
    staleWriteBlocks: number;
    conflicts: number;
    verifierRejects: number;
    queueDepth: number;
    resourceUnits: number;
}>;
import { type AnalyticsAccess, type AnalyticsScope, type BenchmarkClass } from './contracts.js';
import type { DecisionTimeSnapshot } from './evaluators.js';
export interface AgencyTelemetry extends AgencyAnalyticsSample {
    readonly id: string;
    readonly benchmarkClass: BenchmarkClass;
    readonly workerState?: "working" | "idle" | "degraded" | "unknown";
    readonly leadState?: "working" | "idle" | "degraded" | "unknown";
    readonly freshnessMs?: number;
    readonly scope: AnalyticsScope;
    readonly queueId: string;
    readonly leadId: string;
    readonly observedAt: string;
    readonly evidenceIds: readonly string[];
    readonly queueAgeMs: number;
    readonly utilization: number;
    readonly taskDurationMs: number;
    readonly retries: number;
    readonly fairWaitRounds: number;
    readonly backpressure: boolean;
    readonly failovers: number;
    readonly budgetCents: number | null;
}
export declare function scopedAgencyAnalytics(access: AnalyticsAccess, scope: AnalyticsScope, samples: readonly AgencyTelemetry[]): {
    state: string;
    queueDepth: null;
    workers: null;
    authorizationGranted: boolean;
} | {
    state: string;
    benchmarkClass: BenchmarkClass;
    workerStates: {
        [k: string]: "unknown" | "degraded" | "working" | "idle";
    };
    leadStates: {
        [k: string]: "unknown" | "degraded" | "working" | "idle";
    };
    steals: number;
    failovers: number;
    meanTaskDurationMs: number;
    queueDepth: number;
    queueAgeMs: number;
    retries: number;
    utilization: number;
    fairnessMaxWaitRounds: number;
    backpressuredQueues: number;
    budgetCents: number | null;
    authorizationGranted: boolean;
    workers: number;
    averageClaimLatencyMs: number;
    leaseLosses: number;
    staleWriteBlocks: number;
    conflicts: number;
    verifierRejects: number;
    resourceUnits: number;
};
export interface RoutingAlternative {
    readonly routeRef: string;
    readonly utilityUnit: string;
    readonly utilityVersionRef: string;
    readonly availableAt: string;
    readonly expectedUtility: number | null;
    readonly measuredUtility: number | null;
    readonly measuredAt: string | null;
    readonly inputFingerprint: string;
    readonly environmentFingerprint: string;
    readonly benchmarkClass: BenchmarkClass;
}
export declare function routingRegret(access: AnalyticsAccess, scope: AnalyticsScope, snapshot: DecisionTimeSnapshot, alternatives: readonly RoutingAlternative[], evidenceIds: readonly string[]): {
    scope: AnalyticsScope;
    selectedRouteRef: string;
    decisionTimeAlternativeRefs: string[];
    predictedRegret: number | null;
    benchmarkRegret: number | null;
    causalClaim: boolean;
    limitations: string[];
    authorizationGranted: boolean;
};
