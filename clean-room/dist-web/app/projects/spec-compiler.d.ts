export type SpecDimensionState = "addressed" | "excluded_with_reason" | "unknown";
export interface SpecDimension {
    readonly key: string;
    readonly applicable: boolean;
    readonly state: SpecDimensionState;
    readonly evidenceRefs: readonly string[];
    readonly exclusionReason?: string;
}
export interface UltimateSpecCompilation {
    readonly projectId: string;
    readonly specVersion: number;
    readonly dimensions: readonly SpecDimension[];
    readonly complete: boolean;
    readonly unresolvedKeys: readonly string[];
}
export declare function compileUltimateSpec(projectId: string, specVersion: number, dimensions: readonly SpecDimension[]): UltimateSpecCompilation;
export declare const CORE_SPEC_DIMENSIONS: readonly ["functional", "nonfunctional", "security", "privacy", "data", "operations", "recovery", "cost", "monetization", "maintenance", "testing", "accessibility", "future_dormant"];
