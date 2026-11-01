export interface TraceEvent {
    readonly traceId: string;
    readonly correlationId: string;
    readonly component: string;
    readonly action: string;
    readonly at: string;
    readonly evidenceRefs: readonly string[];
    readonly fields: Readonly<Record<string, string>>;
}
export declare function redactFields(fields: Readonly<Record<string, string>>): Readonly<Record<string, string>>;
export declare class TraceLedger {
    #private;
    append(event: TraceEvent): TraceEvent;
    trace(traceId: string): readonly TraceEvent[];
}
import { type AnalyticsScope, type AnalyticsAccess } from './contracts.js';
export declare const LEARNING_TRACE_STAGES: readonly ["request", "context", "policy", "router", "specialist", "method", "tool", "evidence", "verifier", "state", "outcome", "learning", "promotion"];
export type AnalyticsTraceStage = typeof LEARNING_TRACE_STAGES[number] | 'provider' | 'transfer' | 'procedure' | 'rollback' | 'metric';
export interface ScopedTraceEvent {
    readonly id: string;
    readonly version: number;
    readonly scope: AnalyticsScope;
    readonly traceId: string;
    readonly correlationId: string;
    readonly stage: AnalyticsTraceStage;
    readonly parentId: string | null;
    readonly parentVersion: number | null;
    readonly subjectRef: string;
    readonly subjectVersion: number;
    readonly occurredAt: string;
    readonly receivedAt: string;
    readonly expiresAt: string;
    readonly evidenceIds: readonly string[];
    readonly fields: Readonly<{
        code?: string;
        durationMs?: number;
        count?: number;
    }>;
}
/** Scoped extension over the existing PIF.9 trace owner. Raw legacy traces cannot read these records. */
export declare class ScopedAnalyticsTrace {
    #private;
    private readonly access;
    constructor(access: AnalyticsAccess);
    append(input: ScopedTraceEvent): ScopedTraceEvent;
    read(scope: AnalyticsScope, traceId: string): readonly ScopedTraceEvent[];
    complete(scope: AnalyticsScope, traceId: string): boolean;
}
