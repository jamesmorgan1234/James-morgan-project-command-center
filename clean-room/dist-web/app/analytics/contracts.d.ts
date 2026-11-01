import { type EvidenceRecord } from '../kernel/evidence.js';
export interface AnalyticsScope {
    readonly ownerId: string;
    readonly companyId: string;
    readonly projectId: string;
    readonly brainId: string;
}
export type BenchmarkClass = 'synthetic' | 'replay' | 'simulation' | 'shadow' | 'canary' | 'staging' | 'production' | 'external' | 'owner_verified';
export declare const BENCHMARK_CLASSES: readonly BenchmarkClass[];
export interface AnalyticsAccess {
    readonly now: () => string;
    readonly authorize: (operation: 'read' | 'record' | 'export' | 'propose', scope: AnalyticsScope, reference: string) => boolean;
    readonly evidence: (id: string) => {
        readonly record: EvidenceRecord;
        readonly scope: AnalyticsScope;
        readonly expiresAt: string;
    } | undefined;
}
export declare function invariant(condition: unknown, reason: string): asserts condition;
export declare function timestamp(value: string): number;
export declare function version(n: number): void;
export declare function nonblank(s: string): void;
export declare function stringSet(a: readonly string[], required?: boolean): void;
export declare function bounded(n: number, min?: number, max?: number): void;
export declare function scoped(s: AnalyticsScope): void;
export declare function equalScope(a: AnalyticsScope, b: AnalyticsScope): boolean;
export declare function keys(o: object, allowed: readonly string[]): void;
export declare function immutable<T>(input: T): T;
export declare function canonicalAnalyticsJson(value: unknown): string;
export declare function analyticsDigest(value: unknown): Promise<string>;
export declare function authorizeAnalytics(access: AnalyticsAccess, operation: 'read' | 'record' | 'export' | 'propose', scope: AnalyticsScope, ref: string): void;
export declare function analyticsEvidence(access: AnalyticsAccess, scope: AnalyticsScope, ids: readonly string[]): void;
