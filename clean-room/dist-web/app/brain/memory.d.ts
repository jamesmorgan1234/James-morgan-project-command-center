export type MemoryKind = "fact" | "decision" | "rule" | "preference" | "goal" | "asset" | "history" | "owner_input";
export type MemorySensitivity = "internal" | "sensitive" | "protected" | "secret";
export type MemoryState = "current" | "superseded" | "expired";
export type MemoryLayer = "owner_system" | "ecosystem_validated" | "specialist_local" | "procedural" | "negative" | "quarantined" | "historical";
export interface BrainMemory<T> {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId?: string;
    readonly kind: MemoryKind;
    readonly version: number;
    readonly state: MemoryState;
    readonly value: Readonly<T>;
    readonly confidence: number;
    readonly sensitivity: MemorySensitivity;
    readonly sourceRefs: readonly string[];
    readonly recordedAt: string;
    readonly retainUntil?: string;
    readonly supersedes?: string;
}
export interface LayeredMemoryMetadata {
    readonly memoryId: string;
    readonly memoryVersion: number;
    readonly layer: MemoryLayer;
    readonly companyId?: string;
    readonly brainId?: string;
    readonly taskClasses: readonly string[];
    readonly conditionRefs: readonly string[];
    readonly dependencyRefs: readonly string[];
    readonly methodRefs: readonly string[];
    readonly permissionRefs: readonly string[];
    readonly budgetRefs: readonly string[];
    readonly contradictionRefs: readonly string[];
    readonly operationalEligible: boolean;
    readonly expiresAt?: string;
    readonly revalidateAfter?: string;
    readonly invalidatedAt?: string;
    readonly invalidationEvidenceRefs: readonly string[];
}
export declare function validateLayeredMemoryMetadata(metadata: LayeredMemoryMetadata): LayeredMemoryMetadata;
export declare function memoryOperationalEligibility(memory: BrainMemory<unknown>, metadata: LayeredMemoryMetadata, request: {
    ownerId: string;
    projectId?: string;
    companyId?: string;
    taskClass: string;
    now: string;
}): {
    eligible: boolean;
    reason: string;
};
export declare class BrainMemoryLedger<T> {
    #private;
    append(memory: BrainMemory<T>): void;
    attachLayer(metadata: LayeredMemoryMetadata): void;
    operational(request: {
        ownerId: string;
        projectId?: string;
        companyId?: string;
        taskClass: string;
        now: string;
    }): readonly {
        memory: BrainMemory<T>;
        metadata: LayeredMemoryMetadata;
    }[];
    current(ownerId: string, projectId?: string): readonly BrainMemory<T>[];
    history(id: string): readonly BrainMemory<T>[];
}
