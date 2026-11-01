export type ProtectedBookApprovalKind = "title" | "subtitle" | "cover" | "artwork" | "manuscript" | "interior" | "metadata" | "pricing" | "format" | "rollout" | "complete_series_cover" | "package" | "protected_asset";
export type ProtectedBookApprovalState = "proposed" | "draft" | "reviewed" | "approved" | "locked" | "reopened" | "superseded" | "rejected";
export interface ProtectedBookApprovalStateEvent {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly kind: ProtectedBookApprovalKind;
    readonly targetVersion: number;
    readonly targetIdentityRef: string;
    readonly state: ProtectedBookApprovalState;
    readonly explicitOwnerAction: boolean;
    readonly ownerActionRef?: string | undefined;
    readonly supersedesEventId?: string | undefined;
    readonly sourceRefs: readonly string[];
    readonly observedAt: string;
}
export declare class ProtectedBookApprovalStateLedger {
    #private;
    record(event: ProtectedBookApprovalStateEvent): ProtectedBookApprovalStateEvent;
    current(ownerId: string, projectId: string, bookId: string, kind: ProtectedBookApprovalKind): ProtectedBookApprovalStateEvent | undefined;
    requireLocked(ownerId: string, projectId: string, bookId: string, kind: ProtectedBookApprovalKind, targetVersion: number, targetIdentityRef: string): ProtectedBookApprovalStateEvent;
    history(ownerId: string, projectId: string, bookId: string, kind?: ProtectedBookApprovalKind): readonly ProtectedBookApprovalStateEvent[];
}
export declare function discussionCanChangeProtectedBookApprovalState(): false;
