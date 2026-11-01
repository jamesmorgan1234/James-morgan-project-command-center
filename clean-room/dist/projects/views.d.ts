import type { ProjectRecord, ProjectLifecycle, ProjectPriority, ProjectVerification } from "./types.js";
import type { ProjectProgress } from "./progress.js";
import type { WorkReadiness } from "./roadmap.js";
export interface ProjectListItem {
    readonly project: ProjectRecord;
    readonly progress: ProjectProgress;
    readonly nextAction?: string;
}
export interface ProjectViewFilter {
    readonly query?: string;
    readonly lifecycle?: readonly ProjectLifecycle[];
    readonly priorities?: readonly ProjectPriority[];
    readonly verification?: readonly ProjectVerification[];
    readonly typeKeys?: readonly string[];
    readonly companyIds?: readonly string[];
    readonly includeArchived?: boolean;
}
export declare function projectsView(items: readonly ProjectListItem[], filter?: ProjectViewFilter): readonly ProjectListItem[];
export type ProjectGroupKey = "type" | "company" | "lifecycle" | "priority";
export interface ProjectGroup {
    readonly key: string;
    readonly items: readonly ProjectListItem[];
}
export declare function groupProjects(items: readonly ProjectListItem[], groupBy: ProjectGroupKey): readonly ProjectGroup[];
export interface ExecutorActivity {
    readonly projectId: string;
    readonly runId: string;
    readonly taskId: string;
    readonly status: "queued" | "working" | "blocked" | "completed" | "stopped";
    readonly executorClaimed: boolean;
    readonly lastHeartbeatAt?: string;
    readonly currentTaskTitle?: string;
    readonly blocker?: string;
}
export interface ActiveProjectItem {
    readonly project: ProjectRecord;
    readonly activity: ExecutorActivity;
}
export declare function activeLiveView(projects: readonly ProjectRecord[], activities: readonly ExecutorActivity[], now: string, staleAfterMs?: number): readonly ActiveProjectItem[];
export interface NextUpCandidate {
    readonly project: ProjectRecord;
    readonly workUnitId: string;
    readonly title: string;
    readonly readiness: WorkReadiness;
    readonly priorityRank: number;
    readonly evidenceRefs: readonly string[];
}
export declare function nextUpView(candidates: readonly NextUpCandidate[]): readonly NextUpCandidate[];
