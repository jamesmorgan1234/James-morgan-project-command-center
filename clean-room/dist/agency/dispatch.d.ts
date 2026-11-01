import { TaskClaimStore, type TaskClaim } from "./leases.js";
/**
 * Owner command dispatch.
 *
 * Acceptance of a command is not an execution claim. A command is accepted, then
 * signalled for dispatch immediately, then explicitly claimed by a worker before
 * execution is allowed. The queue is snapshot/restore capable and ordered by
 * priority. Project locks reuse the fenced task-claim store so a lock is a lease.
 */
export type DispatchPriority = "critical" | "normal" | "low";
export interface OwnerCommand {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId?: string;
    readonly issuedAt: string;
    readonly priority: DispatchPriority;
}
export type DispatchState = "accepted" | "dispatched" | "claimed";
export interface DispatchRecord {
    readonly commandId: string;
    readonly ownerId: string;
    readonly projectId?: string;
    readonly priority: DispatchPriority;
    readonly acceptedAt: string;
    readonly dispatchedAt?: string;
    readonly executionClaimedAt?: string;
    readonly workerId?: string;
    readonly state: DispatchState;
}
export declare class DispatchQueue {
    #private;
    accept(command: OwnerCommand): DispatchRecord;
    signal(commandId: string): DispatchRecord;
    claim(commandId: string, workerId: string, claimedAt: string): DispatchRecord;
    assertExecutionAllowed(commandId: string): void;
    pending(): readonly DispatchRecord[];
    snapshot(): readonly DispatchRecord[];
    static restore(records: readonly DispatchRecord[]): DispatchQueue;
}
export declare function acquireProjectLock(store: TaskClaimStore, projectId: string, workerId: string, now: string, expiresAt: string): TaskClaim;
export declare function renewProjectLock(store: TaskClaimStore, projectId: string, workerId: string, fencingToken: number, now: string, expiresAt: string): TaskClaim;
