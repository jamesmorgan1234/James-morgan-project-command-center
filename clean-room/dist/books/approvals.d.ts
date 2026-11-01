export type BookApprovalKind = "title" | "cover" | "manuscript" | "rollout";
export interface BookApproval {
    readonly id: string;
    readonly bookId: string;
    readonly kind: BookApprovalKind;
    readonly targetVersion: number;
    readonly approved: boolean;
    readonly ownerActionRef: string;
    readonly decidedAt: string;
    readonly supersedesApprovalId: string | null;
}
export declare class BookApprovalLedger {
    #private;
    record(entry: BookApproval): BookApproval;
    current(bookId: string, kind: BookApprovalKind): BookApproval | undefined;
}
export type BookApprovalDecision = "approve" | "reject" | "reopen";
export interface EvidenceBackedBookApproval {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly kind: BookApprovalKind;
    readonly targetVersion: number;
    readonly targetIdentityRef: string;
    readonly decision: BookApprovalDecision;
    readonly ownerActionRef: string;
    readonly explicitOwnerAction: true;
    readonly decidedAt: string;
    readonly supersedesApprovalId?: string | undefined;
    readonly sourceRefs: readonly string[];
}
export interface ProtectedBookChangeAuthorization {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly kind: BookApprovalKind;
    readonly fromVersion: number;
    readonly toVersion: number;
    readonly priorIdentityRef: string;
    readonly replacementIdentityRef: string;
    readonly ownerActionRef: string;
    readonly observedAt: string;
    readonly expiresAt: string;
}
export interface ProtectedBookChangeRequest {
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly kind: BookApprovalKind;
    readonly fromVersion: number;
    readonly toVersion: number;
    readonly priorIdentityRef: string;
    readonly replacementIdentityRef: string;
    readonly observedAt: string;
}
export declare class EvidenceBackedBookApprovalLedger {
    #private;
    record(entry: EvidenceBackedBookApproval): EvidenceBackedBookApproval;
    current(ownerId: string, projectId: string, bookId: string, kind: BookApprovalKind): EvidenceBackedBookApproval | undefined;
    requireApproved(ownerId: string, projectId: string, bookId: string, kind: BookApprovalKind, targetVersion: number, targetIdentityRef: string): EvidenceBackedBookApproval;
}
export declare function assertProtectedBookChangeAuthorized(request: ProtectedBookChangeRequest, authorization: ProtectedBookChangeAuthorization | undefined): void;
export declare function discussionCanChangeApprovedBookState(): false;
