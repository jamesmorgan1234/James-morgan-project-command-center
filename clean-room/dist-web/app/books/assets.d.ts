export type BookAssetKind = "manuscript" | "cover" | "interior" | "metadata" | "package";
export type AssetOrigin = "original" | "recovered_original" | "reconstruction";
export interface BookAssetVersion {
    readonly id: string;
    readonly bookId: string;
    readonly kind: BookAssetKind;
    readonly version: number;
    readonly contentHash: string;
    readonly origin: AssetOrigin;
    readonly sourceRefs: readonly string[];
    readonly approved: boolean;
    readonly approvalRef: string | null;
    readonly protected: boolean;
}
export declare class BookAssetLedger {
    #private;
    put(asset: BookAssetVersion, replacementAuthorizationRef?: string | null): BookAssetVersion;
    current(bookId: string, kind: BookAssetKind): BookAssetVersion | undefined;
    history(bookId: string): readonly BookAssetVersion[];
}
export type EvidenceBackedBookAssetKind = BookAssetKind | "cover_front" | "cover_wrap" | "illustration" | "worksheet" | "source_art";
export interface EvidenceBackedBookAssetVersion {
    readonly assetIdentityId: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly bookId: string;
    readonly kind: EvidenceBackedBookAssetKind;
    readonly version: number;
    readonly fileRef: string;
    readonly contentHash: string;
    readonly origin: AssetOrigin;
    readonly sourceRefs: readonly string[];
    readonly reconstructionRefs: readonly string[];
    readonly approved: boolean;
    readonly approvalRef?: string | undefined;
    readonly protected: boolean;
    readonly authoritative: boolean;
    readonly authorityBasisRef: string;
    readonly observedAt: string;
}
export interface ProtectedBookAssetReplacementAuthorization {
    readonly authorizationRef: string;
    readonly ownerId: string;
    readonly bookId: string;
    readonly kind: EvidenceBackedBookAssetKind;
    readonly priorContentHash: string;
    readonly replacementContentHash: string;
    readonly observedAt: string;
    readonly expiresAt: string;
}
export interface BookAssetAuthorityExplanation {
    readonly assetIdentityId: string;
    readonly bookId: string;
    readonly kind: EvidenceBackedBookAssetKind;
    readonly version: number;
    readonly fileRef: string;
    readonly contentHash: string;
    readonly origin: AssetOrigin;
    readonly approved: boolean;
    readonly protected: boolean;
    readonly authoritative: boolean;
    readonly authorityBasisRef: string;
    readonly approvalRef?: string | undefined;
    readonly sourceRefs: readonly string[];
    readonly reconstructionRefs: readonly string[];
}
export declare class EvidenceBackedBookAssetLedger {
    #private;
    record(asset: EvidenceBackedBookAssetVersion, authorization?: ProtectedBookAssetReplacementAuthorization): EvidenceBackedBookAssetVersion;
    current(ownerId: string, bookId: string, kind: EvidenceBackedBookAssetKind): EvidenceBackedBookAssetVersion | undefined;
    history(ownerId: string, bookId: string): readonly EvidenceBackedBookAssetVersion[];
    explainAuthority(ownerId: string, bookId: string, kind: EvidenceBackedBookAssetKind): BookAssetAuthorityExplanation;
    private assertReplacementAuthorization;
}
