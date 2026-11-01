/**
 * Home dashboard access and the Agent module.
 *
 * Home exposes the owner's destinations without disturbing the approved primary
 * one-column grid, and the Agent module reports real run state: queued, working,
 * needs owner, blocked or executor unavailable, with verified progress or N/A.
 * Barrier counts are counts, never invented percentages.
 */
export type HomeDestinationKey = "personal" | "needs_me" | "search" | "notifications" | "finance";
export interface HomeDestination {
    readonly key: HomeDestinationKey;
    readonly title: string;
    readonly route: string;
    readonly enabled: boolean;
    readonly pinned: boolean;
}
export declare function homeDestinations(input?: {
    financeEnabled?: boolean;
    pinnedKeys?: readonly HomeDestinationKey[];
}): readonly HomeDestination[];
export declare function assertPinnedDestinationsPreservePrimaryGrid(primaryModuleKeys: readonly string[]): void;
export type AgentRunState = "queued" | "working" | "needs_owner" | "blocked" | "executor_unavailable";
export interface AgentRunSummary {
    readonly projectTitle: string | null;
    readonly taskTitle: string | null;
    readonly nextAction: string | null;
    readonly state: AgentRunState;
    readonly progressPercent: number | null;
    readonly progressVerified: boolean;
    readonly workBoundary: string;
}
export interface HomeAgentModule {
    readonly title: "Agent";
    readonly route: "/agent";
    readonly currentProject: string | null;
    readonly currentTask: string | null;
    readonly nextAction: string | null;
    readonly state: AgentRunState | null;
    readonly stateLabel: string;
    readonly progressPercent: number | null;
    readonly progressLabel: string;
    readonly workBoundary: string;
}
export declare function homeAgentModule(run: AgentRunSummary | null): HomeAgentModule;
export interface HomeBarriers {
    readonly lockedProject: string | null;
    readonly reviewedOrParkedCount: number;
    readonly percentage: null;
    readonly lockedProjectLabel: string;
    readonly reviewedOrParkedLabel: string;
}
export declare function homeBarriers(input: {
    lockedProject?: string | null;
    reviewedOrParkedCount: number;
}): HomeBarriers;
