export type NeedEnvironment = "pc" | "phone" | "local_browser" | "any_device";
export type NeedUrgency = "critical" | "high" | "normal" | "low";
export interface OwnerNeed {
    readonly id: string;
    readonly ownerId: string;
    readonly needKey: string;
    readonly title: string;
    readonly reason: string;
    readonly urgency: NeedUrgency;
    readonly requiredEnvironment: NeedEnvironment;
    readonly ownerAction: string;
    readonly unlockRefs: readonly string[];
    readonly resumeRefs: readonly string[];
    readonly sourceRefs: readonly string[];
    readonly state: "open" | "acknowledged" | "resolved";
}
export interface NeedResolution {
    readonly ownerId: string;
    readonly needKey: string;
    readonly resolvedNeedId: string;
    readonly resolvedAt: string;
    readonly evidenceRefs: readonly string[];
    readonly unlockRefs: readonly string[];
    readonly resumeRefs: readonly string[];
}
export interface NeedsMeSnapshot {
    readonly schemaVersion: "cc-needs-me-v1";
    readonly needs: readonly OwnerNeed[];
    readonly resolutions: readonly NeedResolution[];
}
export declare class NeedsMeQueue {
    #private;
    static rehydrate(snapshot: NeedsMeSnapshot): NeedsMeQueue;
    upsert(input: OwnerNeed): void;
    resolve(id: string): OwnerNeed;
    resolveByKey(ownerId: string, needKey: string, resolvedAt: string, evidenceRefs: readonly string[]): NeedResolution;
    resolution(ownerId: string, needKey: string): NeedResolution | undefined;
    open(): readonly OwnerNeed[];
    exportSnapshot(): NeedsMeSnapshot;
}
