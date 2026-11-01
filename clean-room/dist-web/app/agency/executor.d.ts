/** Executor: task state machine, heartbeat, wake/result, real claim, locks and impact. */
export type TaskState = "pending" | "claimed" | "working" | "done" | "failed";
export type TaskEvent = "claim" | "start" | "finish" | "fail" | "reset";
export declare function taskTransition(state: TaskState, event: TaskEvent): TaskState;
export declare function heartbeat(lastSeen: string, now: string, timeoutMs: number): "alive" | "stale";
export declare function wakeContract(reason: string): string;
export declare function resultContract(result: {
    readonly taskId: string;
    readonly outcome: "done" | "failed";
}): string;
export declare function assertRealClaim(claim: {
    readonly executorId: string;
} | null): string;
export declare function assertObjectiveLock(change: {
    readonly objective: string;
}, locked: string): void;
export declare function impactRadius(scope: "task" | "project" | "company"): string;
