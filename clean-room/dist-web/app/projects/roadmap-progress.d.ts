/** Roadmap progress: plan versioning, expansion, diffs and honest percentages. */
export declare function planVersion(version: number): number;
export declare function expandPlan(plan: {
    readonly units: readonly string[];
    readonly version: number;
}, added: readonly string[]): {
    readonly units: readonly string[];
    readonly version: number;
};
export declare function planDiff(before: readonly string[], after: readonly string[]): {
    readonly added: readonly string[];
    readonly removed: readonly string[];
};
export declare function percentageAfterExpansion(before: number, after: number): number;
export declare function barrierSweep(count: number, done: number): {
    readonly count: number;
    readonly done: number;
    readonly percentage: number;
};
export declare function rejectTimeBasedProgress(elapsedMs: number, percentage: number): void;
export declare function rejectStatusBasedProgress(percentage: number): void;
export declare function progressExplanation(units: readonly {
    readonly id: string;
    readonly done: boolean;
}[]): string;
