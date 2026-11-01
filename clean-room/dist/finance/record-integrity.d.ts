/**
 * Record integrity: revenue only from verified evidence, no sample data in
 * live records, protected screenshot references, and bounded text and counts.
 */
export interface RevenueEntry {
    readonly amount: number;
    readonly currency: string;
    readonly verified: boolean;
}
export declare function deriveRevenue(entries: readonly RevenueEntry[]): {
    readonly total: number;
    readonly currency: string;
};
export interface RecordSource {
    readonly source: "live" | "sample" | "screenshot";
}
export declare function assertNoSampleData(records: readonly RecordSource[]): void;
export declare function screenshotReference(storageKey: string): {
    readonly storageKey: string;
};
export declare function projectDisplayName(name: string, limit?: number): {
    readonly display: string;
    readonly full: string;
};
export declare function blockerText(text: string, limit?: number): string;
export declare function assertProjectCountSupported(count: number, pageSize?: number): void;
