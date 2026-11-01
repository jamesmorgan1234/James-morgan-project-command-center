import type { SocialIdentityMapRecord } from "./identity.js";
export interface SocialAssetBinding {
    readonly mediaKind?: string;
    readonly durationSeconds?: number;
    readonly width?: number;
    readonly height?: number;
    readonly assetRef: string;
    readonly contentHash: string;
    readonly provenanceRefs: readonly string[];
    readonly rightsEvidenceRefs: readonly string[];
}
export interface SocialContentAsset {
    readonly id: string;
    readonly ownerId: string;
    readonly brandId: string;
    readonly companyId?: string;
    readonly projectId?: string;
    readonly assetRef: string;
    readonly contentHash: string;
    readonly mediaKind: string;
    readonly provenanceRefs: readonly string[];
    readonly rightsEvidenceRefs: readonly string[];
    readonly observedAt: string;
    readonly version: number;
}
export interface CanonicalSocialContent {
    readonly id: string;
    readonly ownerId: string;
    readonly brandId: string;
    readonly companyId?: string;
    readonly projectId?: string;
    readonly title?: string;
    readonly sourceAssetRefs: readonly string[];
    readonly provenanceRefs: readonly string[];
    readonly observedAt: string;
    readonly version: number;
}
export interface SocialDraftApprovalBinding {
    readonly approvalRef: string;
    readonly approverRef: string;
    readonly draftVersion: number;
    readonly intendedAccountId: string;
    readonly contentHash: string;
    readonly approvedAt: string;
    readonly evidenceRefs: readonly string[];
}
export interface SocialDraft {
    readonly companyId?: string;
    readonly projectId?: string;
    readonly platform?: string;
    readonly canonicalContentId?: string;
    readonly variantOfDraftId?: string;
    readonly disclosures?: readonly string[];
    readonly id: string;
    readonly ownerId: string;
    readonly brandId: string;
    readonly intendedAccountId: string;
    readonly version: number;
    readonly observedAt: string;
    readonly body: string;
    readonly contentHash: string;
    readonly sourceAssetRefs: readonly string[];
    readonly assetBindings: readonly SocialAssetBinding[];
    readonly rightsEvidenceRefs: readonly string[];
    readonly provenanceRefs: readonly string[];
    readonly approvalRefs: readonly string[];
    readonly approvalBindings: readonly SocialDraftApprovalBinding[];
    readonly sensitivityRank: number;
}
export interface SocialDraftContentRevision {
    readonly body: string;
    readonly contentHash: string;
    readonly observedAt: string;
    readonly sourceAssetRefs: readonly string[];
    readonly assetBindings: readonly SocialAssetBinding[];
    readonly rightsEvidenceRefs: readonly string[];
    readonly provenanceRefs: readonly string[];
    readonly sensitivityRank: number;
}
export interface SocialDraftTargetPreview {
    readonly draftId: string;
    readonly draftVersion: number;
    readonly ownerId: string;
    readonly entityId: string;
    readonly companyId?: string;
    readonly projectId?: string;
    readonly brandId: string;
    readonly platform: string;
    readonly accountId: string;
    readonly platformIdentityId: string;
    readonly displayName: string;
    readonly publishAuthorized: false;
}
export declare class SocialContentAssetRegistry {
    #private;
    register(asset: SocialContentAsset): SocialContentAsset;
    get(id: string): SocialContentAsset | undefined;
}
export declare class CanonicalSocialContentRegistry {
    #private;
    register(content: CanonicalSocialContent): CanonicalSocialContent;
    get(id: string): CanonicalSocialContent | undefined;
}
export declare function assertDraftPublishReady(draft: SocialDraft): void;
export declare function freezeSocialDraft(draft: SocialDraft): SocialDraft;
export declare class SocialDraftRegistry {
    #private;
    register(draft: SocialDraft): SocialDraft;
    history(id: string, ownerId: string): readonly SocialDraft[];
    requireExact(id: string, ownerId: string, brandId: string, intendedAccountId: string, version: number, contentHash: string): SocialDraft;
}
export declare function assertSocialDraftTarget(draft: SocialDraft, identity: SocialIdentityMapRecord): void;
export declare function previewSocialDraftTarget(draft: SocialDraft, identity: SocialIdentityMapRecord): SocialDraftTargetPreview;
export declare function cloneDraftForAccount(draft: SocialDraft, intendedAccountId: string): SocialDraft;
export declare function createPlatformVariant(draft: SocialDraft, identity: SocialIdentityMapRecord, input: Readonly<{
    id: string;
    body: string;
    contentHash: string;
    observedAt: string;
    disclosures?: readonly string[];
    sensitivityRank?: number;
}>): SocialDraft;
export declare function reviseDraftContent(draft: SocialDraft, revision: SocialDraftContentRevision): SocialDraft;
export declare function socialDraftContentHash(draft: SocialDraft): Promise<string>;
export declare function assertSocialDraftIntegrity(draft: SocialDraft): Promise<void>;
