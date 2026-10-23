export interface SocialDraft {
  readonly id: string;
  readonly ownerId: string;
  readonly brandId: string;
  readonly intendedAccountId: string;
  readonly body: string;
  readonly sourceAssetRefs: readonly string[];
  readonly rightsEvidenceRefs: readonly string[];
  readonly provenanceRefs: readonly string[];
  readonly approvalRefs: readonly string[];
  readonly sensitivityRank: number;
}

export function assertDraftPublishReady(draft: SocialDraft): void {
  if (!draft.id.trim() || !draft.ownerId.trim() || !draft.brandId.trim() || !draft.intendedAccountId.trim()) throw new Error("draft identity and exact intended account are required");
  if (!draft.body.trim()) throw new Error("draft body is required");
  if (draft.sourceAssetRefs.length > 0 && draft.rightsEvidenceRefs.length === 0) throw new Error("asset rights evidence is required before publication");
  if (draft.provenanceRefs.length === 0) throw new Error("draft provenance is required");
  if (draft.approvalRefs.length === 0) throw new Error("publication approval evidence is required");
}

export function cloneDraftForAccount(draft: SocialDraft, intendedAccountId: string): SocialDraft {
  if (!intendedAccountId.trim()) throw new Error("target account is required");
  return Object.freeze({ ...draft, intendedAccountId, approvalRefs: Object.freeze([]), sourceAssetRefs: Object.freeze([...draft.sourceAssetRefs]), rightsEvidenceRefs: Object.freeze([...draft.rightsEvidenceRefs]), provenanceRefs: Object.freeze([...draft.provenanceRefs]) });
}
