import type { RuntimeProjectSnapshot } from "./snapshot.js";
export type RuntimeProjectGroupBy = "none" | "type" | "company" | "lifecycle" | "priority";
export interface RuntimeProjectFilter {
    readonly query?: string | undefined;
    readonly lifecycle?: string | undefined;
    readonly priority?: string | undefined;
    readonly typeKey?: string | undefined;
    readonly companyId?: string | undefined;
    readonly groupBy?: RuntimeProjectGroupBy | undefined;
}
export interface RuntimeProjectGroup {
    readonly key: string;
    readonly label: string;
    readonly projects: readonly RuntimeProjectSnapshot[];
}
export declare function projectFilterFromSearch(search: string): RuntimeProjectFilter;
export declare function filterRuntimeProjects(projects: readonly RuntimeProjectSnapshot[], filter: RuntimeProjectFilter): readonly RuntimeProjectSnapshot[];
export declare function groupRuntimeProjects(projects: readonly RuntimeProjectSnapshot[], groupBy?: RuntimeProjectGroupBy): readonly RuntimeProjectGroup[];
export declare function projectFacetValues(projects: readonly RuntimeProjectSnapshot[]): Readonly<{
    lifecycles: readonly string[];
    priorities: readonly string[];
    typeKeys: readonly string[];
    companyIds: readonly string[];
}>;
