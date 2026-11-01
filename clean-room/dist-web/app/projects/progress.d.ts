import type { ProjectRoadmap } from "./roadmap.js";
export type ProjectProgress = Readonly<{
    kind: "percent";
    verified: number;
    applicable: number;
    percent: number;
    roadmapVersion: number;
}> | Readonly<{
    kind: "na";
    label: "N/A";
    reason: string;
    roadmapVersion: number;
}>;
export declare function calculateProjectProgress(roadmap: ProjectRoadmap, denominatorTrusted: boolean): ProjectProgress;
export interface AgencyRunProgress {
    readonly runId: string;
    readonly completedDurableTasks: number;
    readonly plannedDurableTasks?: number;
}
export declare function calculateAgencyProgress(run: AgencyRunProgress): Readonly<{
    kind: "percent";
    percent: number;
} | {
    kind: "na";
    label: "N/A";
}>;
