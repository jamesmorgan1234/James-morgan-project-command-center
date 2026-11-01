export type WorkUnitStatus = "planned" | "ready" | "working" | "blocked" | "verified" | "skipped";
export interface RoadmapWorkUnit {
    readonly id: string;
    readonly categoryId: string;
    readonly phaseId: string;
    readonly title: string;
    readonly status: WorkUnitStatus;
    readonly applicable: boolean;
    readonly dependencyIds: readonly string[];
    readonly gateIds: readonly string[];
    readonly acceptanceCriteria: readonly string[];
}
export interface RoadmapGate {
    readonly id: string;
    readonly satisfied: boolean;
    readonly evidenceRefs: readonly string[];
}
export interface ProjectRoadmap {
    readonly projectId: string;
    readonly version: number;
    readonly workUnits: readonly RoadmapWorkUnit[];
    readonly gates: readonly RoadmapGate[];
}
export interface WorkReadiness {
    readonly ready: boolean;
    readonly unmetDependencies: readonly string[];
    readonly unmetGates: readonly string[];
}
export declare function validateRoadmap(roadmap: ProjectRoadmap): void;
export declare function workReadiness(roadmap: ProjectRoadmap, workUnitId: string): WorkReadiness;
