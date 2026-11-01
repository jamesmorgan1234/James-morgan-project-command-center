export interface TaskClaim {
    readonly taskId: string;
    readonly workerId: string;
    readonly fencingToken: number;
    readonly claimedAt: string;
    readonly expiresAt: string;
}
export declare class TaskClaimStore {
    #private;
    claim(taskId: string, workerId: string, claimedAt: string, expiresAt: string): TaskClaim;
    renew(taskId: string, workerId: string, fencingToken: number, now: string, expiresAt: string): TaskClaim;
    assertCommitAllowed(taskId: string, workerId: string, fencingToken: number, now: string): void;
    release(taskId: string, workerId: string, fencingToken: number, now: string): void;
    get(taskId: string): TaskClaim | undefined;
}
