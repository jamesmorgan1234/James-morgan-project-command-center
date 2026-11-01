import { MetricRegistry } from './metrics.js';
import { type AnalyticsAccess, type AnalyticsScope, type BenchmarkClass } from './contracts.js';
export type AnalyticsRecordKind = 'metric' | 'health' | 'trace' | 'outcome' | 'lesson' | 'security' | 'governance' | 'evaluation';
export interface AnalyticsRecordInput {
    readonly id: string;
    readonly version: number;
    readonly scope: AnalyticsScope;
    readonly kind: AnalyticsRecordKind;
    readonly occurredAt: string;
    readonly expiresAt: string;
    readonly temporalLabel: 'current' | 'historical';
    readonly retentionClass: 'short' | 'standard' | 'long';
    readonly benchmarkClass: BenchmarkClass;
    readonly evidenceIds: readonly string[];
    readonly payload: Readonly<Record<string, unknown>>;
}
export interface DurableAnalyticsRecord extends AnalyticsRecordInput {
    readonly digest: string;
    readonly recordedAt: string;
}
export interface AnalyticsRecordView extends DurableAnalyticsRecord {
    readonly sourceEvidenceState: "current_verified" | "invalidated_or_stale";
    readonly viewTemporalLabel: "current" | "historical";
}
export interface AnalyticsStore {
    append(record: DurableAnalyticsRecord): Promise<DurableAnalyticsRecord>;
    read(scope: AnalyticsScope, kind: AnalyticsRecordKind, now: string): Promise<readonly DurableAnalyticsRecord[]>;
}
export declare function analyticsSourceDigest(input: AnalyticsRecordInput): Promise<string>;
export declare function metadataOnly(value: unknown): void;
/** One durable boundary over existing C13 owners; sources must provide a current canonical
 * receipt binding exact identity/version/scope/benchmark/payload. Analytics cannot self-verify input. */
export declare class AnalyticsRepository {
    private readonly access;
    private readonly metrics;
    private readonly store;
    constructor(access: AnalyticsAccess, metrics: MetricRegistry, store: AnalyticsStore);
    private validate;
    record(value: AnalyticsRecordInput): Promise<DurableAnalyticsRecord>;
    metricViews(scope: AnalyticsScope): Promise<({
        sourceEvidenceState: "current_verified";
        metricKey: string;
        version: number;
        meaning: string;
        unit: string;
        sourceEvidenceIds: readonly string[];
        observedAt: string;
        freshnessMs: number;
        temporalState: string;
        state: import("./metrics.js").ObservationState;
        value: number | null;
        historicalValue: number | null;
        truth: import("./metrics.js").MetricTruth;
    } | {
        value: null;
        historicalValue: number | null;
        state: string;
        temporalState: string;
        sourceEvidenceState: "current_verified" | "invalidated_or_stale";
        metricKey: string;
        version: number;
        meaning: string;
        unit: string;
        sourceEvidenceIds: readonly string[];
        observedAt: string;
        freshnessMs: number;
        truth: import("./metrics.js").MetricTruth;
    })[]>;
    read(scope: AnalyticsScope, kind: AnalyticsRecordKind, operation?: 'read' | 'export'): Promise<readonly AnalyticsRecordView[]>;
}
export declare class PostgresAnalyticsStore implements AnalyticsStore {
    private readonly query;
    constructor(query: (sql: string, params: unknown[]) => Promise<{
        rows: Record<string, unknown>[];
    }>);
    append(record: DurableAnalyticsRecord): Promise<DurableAnalyticsRecord>;
    read(scope: AnalyticsScope, kind: AnalyticsRecordKind, now: string): Promise<readonly DurableAnalyticsRecord[]>;
}
import type { EvaluatorDefinition, EvaluatorStore } from './evaluators.js';
export declare class PostgresEvaluatorStore implements EvaluatorStore {
    private readonly query;
    constructor(query: (sql: string, params: unknown[]) => Promise<{
        rows: Record<string, unknown>[];
    }>);
    append(scope: AnalyticsScope, definition: EvaluatorDefinition, evidenceIds: readonly string[], expectedVersion: number | null): Promise<EvaluatorDefinition>;
}
