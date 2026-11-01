export type MemoryRetentionPolicy = "permanent" | "project_lifetime" | "time_bounded" | "owner_review" | "legal_hold";
export interface MemoryRetentionState {
    readonly memoryId: string;
    readonly policy: MemoryRetentionPolicy;
    readonly expiresAt?: string;
    readonly reason: string;
    readonly evidenceRefs: readonly string[];
    readonly recordedAt: string;
}
export interface MemoryRetentionChange {
    readonly memoryId: string;
    readonly previousPolicy?: MemoryRetentionPolicy;
    readonly newPolicy: MemoryRetentionPolicy;
    readonly previousExpiresAt?: string;
    readonly newExpiresAt?: string;
    readonly reason: string;
    readonly evidenceRefs: readonly string[];
    readonly occurredAt: string;
}
export declare function validateMemoryRetention(input: MemoryRetentionState): MemoryRetentionState;
export declare function applyRetentionChange(current: MemoryRetentionState, change: MemoryRetentionChange): MemoryRetentionState;
