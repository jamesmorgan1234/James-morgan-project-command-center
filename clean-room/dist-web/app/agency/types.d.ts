export type AgencyRunState = "draft" | "queued" | "working" | "blocked" | "needs_user" | "paused" | "completed" | "stopped" | "failed";
export type AgencyTaskState = "pending" | "ready" | "claimed" | "working" | "blocked" | "needs_user" | "work_boundary" | "verified" | "skipped" | "stopped" | "failed";
export type AgencyRisk = "low" | "medium" | "high" | "critical";
export type AgencyEnvironment = "normal_chat" | "work" | "user" | "deterministic";
export interface AgencyRun {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly controlMode: "project_auto" | "agent_auto" | "next_step" | "until_work" | "to_work_barriers" | "manual_task";
    readonly objective: string;
    readonly state: AgencyRunState;
    readonly authorizationRef: string;
    readonly generation: number;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly stopRequested: boolean;
    readonly pauseRequested: boolean;
}
export interface AgencyTask {
    readonly id: string;
    readonly runId: string;
    readonly projectId: string;
    readonly title: string;
    readonly state: AgencyTaskState;
    readonly dependencyIds: readonly string[];
    readonly capability: string;
    readonly risk: AgencyRisk;
    readonly preferredEnvironment: AgencyEnvironment;
    readonly evidenceRefs: readonly string[];
    readonly idempotencyKey: string;
    readonly blocker?: string;
}
export declare function transitionRun(run: AgencyRun, to: AgencyRunState, at: string): AgencyRun;
