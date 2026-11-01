/**
 * Blocked-state surface and execution history.
 *
 * An agent must be able to say exactly why it stopped instead of guessing, and
 * its execution history must be queryable by project and run for root-cause
 * analysis.
 */
export type BlockedReason = "cannot_safely_continue" | "capability_missing" | "verification_impossible" | "authorization_expired" | "state_changed_since_plan" | "project_rule_conflict" | "resource_unavailable" | "owner_decision_required" | "external_provider_required" | "future_capability_recommended";
export interface BlockedStatus {
    readonly reason: BlockedReason;
    readonly message: string;
    readonly detail: Readonly<Record<string, string>>;
    readonly requiresOwner: boolean;
}
export declare function blockedStatus(reason: BlockedReason, message: string, detail?: Readonly<Record<string, string>>): BlockedStatus;
export type ExecutionOutcome = "started" | "succeeded" | "failed" | "blocked";
export interface ExecutionEvent {
    readonly projectId: string;
    readonly runKey: string;
    readonly taskKey: string;
    readonly at: string;
    readonly outcome: ExecutionOutcome;
    readonly code: string;
    readonly detail: string;
}
export declare class ExecutionHistory {
    #private;
    record(event: ExecutionEvent): void;
    query(filter: {
        projectId?: string;
        runKey?: string;
    }): readonly ExecutionEvent[];
    rootCause(projectId: string, runKey: string): ExecutionEvent | null;
}
