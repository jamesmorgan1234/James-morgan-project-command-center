export type RevenueTruth = "projected" | "confirmed" | "settled";
export interface BookPerformanceMetric {
    readonly id: string;
    readonly bookId: string;
    readonly format: string;
    readonly metric: "sales" | "royalties" | "returns" | "read_through";
    readonly value: number;
    readonly currency: string | null;
    readonly truth: RevenueTruth;
    readonly sourceRef: string;
    readonly observedAt: string;
}
export declare function reconcileBookMetrics(metrics: readonly BookPerformanceMetric[]): readonly BookPerformanceMetric[];
export interface EvidenceBackedBookPerformanceMetric {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly format: string;
    readonly metric: "sales" | "royalties" | "returns" | "read_through";
    readonly value: number;
    readonly currency?: string | undefined;
    readonly truth: RevenueTruth;
    readonly periodStart: string;
    readonly periodEnd: string;
    readonly observedAt: string;
    readonly sourceRefs: readonly string[];
    readonly providerRecordRef: string;
    readonly settlementRef?: string | undefined;
}
export interface BookPerformanceReconciliation {
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly format: string;
    readonly metric: EvidenceBackedBookPerformanceMetric["metric"];
    readonly projected: number;
    readonly confirmed: number;
    readonly settled: number;
    readonly currency?: string | undefined;
    readonly latestObservedAt: string;
    readonly metricIds: readonly string[];
}
export interface BookPerformanceSummary {
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly confirmedSales: number;
    readonly confirmedReturns: number;
    readonly settledRoyalties: number;
    readonly royaltyCurrency?: string | undefined;
    readonly projectedRoyaltyMetricIds: readonly string[];
    readonly confirmedMetricIds: readonly string[];
    readonly settledMetricIds: readonly string[];
}
export declare function validateEvidenceBackedBookMetric(metric: EvidenceBackedBookPerformanceMetric): EvidenceBackedBookPerformanceMetric;
export declare function reconcileEvidenceBackedBookMetrics(metrics: readonly EvidenceBackedBookPerformanceMetric[]): readonly BookPerformanceReconciliation[];
export declare function summarizeBookPerformance(metrics: readonly EvidenceBackedBookPerformanceMetric[], ownerId: string, projectId: string, bookId: string): BookPerformanceSummary;
