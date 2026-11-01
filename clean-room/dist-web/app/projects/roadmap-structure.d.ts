/** Roadmap structure: stable IDs, ancestry, first-incomplete pointer and lifecycle. */
export declare function unitId(prefix: string, index: number): string;
export declare function checkpointAncestry(ancestry: readonly string[], child: string): readonly string[];
export declare function firstIncomplete(units: readonly {
    readonly done: boolean;
}[]): number;
export declare function reopenAffected(units: readonly {
    readonly id: string;
    readonly affected: boolean;
}[]): readonly string[];
export declare function recordScopeExpansion(history: readonly string[], entry: string): readonly string[];
export declare function recalculatePercentage(units: readonly {
    readonly done: boolean;
    readonly weight: number;
}[]): number;
export type ProjectState = "planned" | "active" | "blocked" | "complete";
export type ProjectEvent = "start" | "block" | "unblock" | "finish";
export declare function projectTransition(state: ProjectState, event: ProjectEvent): ProjectState;
export declare function sectionAdapter(kind: string, allowed: readonly string[]): string;
