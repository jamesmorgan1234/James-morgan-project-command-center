/**
 * Agent run coordination.
 *
 * One active run per project, one active lane per portfolio, deduplication of
 * runs/tasks/equivalent work, stop and pause precedence, plan revalidation when
 * owner scope, rules, tool availability or providers change, and executor
 * compatibility checks before a claim.
 */
export type PendingCommandKind = "start" | "stop" | "pause";
export interface PendingCommand {
    readonly id: string;
    readonly kind: PendingCommandKind;
    readonly runKey: string;
    readonly taskKey: string;
    readonly workFingerprint: string;
    readonly issuedAt: string;
}
export type CommandDisposition = "accepted" | "duplicate_run" | "duplicate_task" | "equivalent_work";
export interface CommandDecision {
    readonly id: string;
    readonly disposition: CommandDisposition;
    readonly duplicateOf: string | null;
}
export declare class RunCoordinator {
    #private;
    accept(command: PendingCommand): CommandDecision;
    /** Coalesces pending starts that represent the same work, keeping the earliest. */
    coalesce(): readonly PendingCommand[];
    /** Stop outranks pause; pause outranks the next queued start. */
    next(): PendingCommand | null;
    startRun(projectId: string, runKey: string, lane?: string | null): void;
    finishRun(projectId: string, lane?: string | null): void;
}
export type RevalidationReason = "scope_changed" | "rule_changed" | "tool_availability_changed" | "provider_disconnected" | "none";
export interface PlanStamp {
    readonly scopeVersion: string;
    readonly ruleVersion: string;
    readonly toolAvailabilityVersion: string;
    readonly providerConnected: boolean;
}
export declare function planRevalidation(stamp: PlanStamp, current: PlanStamp): RevalidationReason;
export interface ExecutorContract {
    readonly key: string;
    readonly capabilityVersion: number;
    readonly permissionVersion: number;
    readonly capabilityKeys: readonly string[];
    readonly toolHealth: Readonly<Record<string, "healthy" | "degraded" | "unavailable">>;
}
export declare function assertExecutorCompatible(executor: ExecutorContract, required: {
    capabilityKeys: readonly string[];
    capabilityVersion: number;
    permissionVersion: number;
}): void;
export declare function toolHealthSnapshotAtStart(executor: ExecutorContract, requiredTools: readonly string[]): Readonly<Record<string, string>>;
export declare function assertFreshOwnerRule(ruleVersionAtPlan: string, currentRuleVersion: string): void;
