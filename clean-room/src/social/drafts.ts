import { assertSecretChannelSafe } from "../security/secret-channels.js";
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

function refs(values: readonly string[], label: string, requireOne = true): readonly string[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) {
    throw new Error(`${label} must contain nonblank references`);
  }
  const normalized = values.map((value) => value.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} cannot contain duplicate references`);
  return Object.freeze(normalized);
}

function optionalId(value: string | undefined, label: string): void {
  if (value !== undefined && !value.trim()) throw new Error(`${label} cannot be blank`);
}

function sameRefs(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value) => right.includes(value));
}

function timestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

function freezeAssetBinding(binding: SocialAssetBinding): SocialAssetBinding {
  if (binding.mediaKind !== undefined && !binding.mediaKind.trim()) throw new Error("asset media kind cannot be blank");
  for (const size of [binding.width, binding.height]) {
    if (size !== undefined && (!Number.isSafeInteger(size) || size <= 0)) throw new Error("asset dimensions must be positive integers");
  }
  if (binding.durationSeconds !== undefined && (!Number.isFinite(binding.durationSeconds) || binding.durationSeconds < 0)) {
    throw new Error("asset duration must be finite and nonnegative");
  }
  if (!binding.assetRef.trim() || !binding.contentHash.trim()) throw new Error("asset binding requires asset reference and content hash");
  return Object.freeze({
    ...binding,
    assetRef: binding.assetRef.trim(),
    contentHash: binding.contentHash.trim(),
    provenanceRefs: refs(binding.provenanceRefs, "asset provenance"),
    rightsEvidenceRefs: refs(binding.rightsEvidenceRefs, "asset rights evidence")
  });
}

function freezeApprovalBinding(binding: SocialDraftApprovalBinding): SocialDraftApprovalBinding {
  if (!binding.approvalRef.trim() || !binding.approverRef.trim() || !binding.intendedAccountId.trim() || !binding.contentHash.trim()) {
    throw new Error("approval binding requires approval, approver, account, and content-hash identity");
  }
  if (!Number.isSafeInteger(binding.draftVersion) || binding.draftVersion < 1) throw new Error("approval draft version must be positive");
  timestamp(binding.approvedAt, "approval approvedAt");
  return Object.freeze({
    ...binding,
    approvalRef: binding.approvalRef.trim(),
    approverRef: binding.approverRef.trim(),
    intendedAccountId: binding.intendedAccountId.trim(),
    contentHash: binding.contentHash.trim(),
    evidenceRefs: refs(binding.evidenceRefs, "approval evidence")
  });
}

function validateDraftRevision(draft: SocialDraft, requireApproval: boolean): void {
  if (!draft.id.trim() || !draft.ownerId.trim() || !draft.brandId.trim() || !draft.intendedAccountId.trim()) {
    throw new Error("draft identity and exact intended account are required");
  }
  if (!Number.isSafeInteger(draft.version) || draft.version < 1) throw new Error("draft version must be positive");
  assertSecretChannelSafe("brain_memory", draft);
  for (const [value, label] of [
    [draft.companyId, "companyId"],
    [draft.projectId, "projectId"],
    [draft.platform, "platform"],
    [draft.canonicalContentId, "canonicalContentId"],
    [draft.variantOfDraftId, "variantOfDraftId"]
  ] as const) optionalId(value, label);
  if (draft.variantOfDraftId && draft.variantOfDraftId === draft.id) throw new Error("draft cannot be a platform variant of itself");
  if (draft.variantOfDraftId && !draft.canonicalContentId) throw new Error("platform variant must link to canonical content");
  if (draft.disclosures) refs(draft.disclosures, "draft disclosures", false);

  const observedAt = timestamp(draft.observedAt, "draft observedAt");
  if (!draft.body.trim() || !draft.contentHash.trim()) throw new Error("draft body and content hash are required");
  if (!Number.isSafeInteger(draft.sensitivityRank) || draft.sensitivityRank < 0) throw new Error("draft sensitivity rank must be a nonnegative integer");

  const sourceAssetRefs = refs(draft.sourceAssetRefs, "source asset refs", false);
  const rightsEvidenceRefs = refs(draft.rightsEvidenceRefs, "draft rights evidence", sourceAssetRefs.length > 0);
  refs(draft.provenanceRefs, "draft provenance");

  if (!Array.isArray(draft.assetBindings) || draft.assetBindings.length !== sourceAssetRefs.length) {
    throw new Error("every source asset must have exactly one provenance/rights binding");
  }
  const assetBindings = draft.assetBindings.map(freezeAssetBinding);
  const boundAssetRefs = assetBindings.map((binding) => binding.assetRef);
  if (new Set(boundAssetRefs).size !== boundAssetRefs.length || !sameRefs(sourceAssetRefs, boundAssetRefs)) {
    throw new Error("source asset references must exactly match asset bindings");
  }
  const boundRights = [...new Set(assetBindings.flatMap((binding) => binding.rightsEvidenceRefs))];
  if (!sameRefs(rightsEvidenceRefs, boundRights)) throw new Error("draft rights evidence must be bound to the exact source assets");

  const approvalRefs = refs(draft.approvalRefs, "publication approval evidence", requireApproval);
  if (!Array.isArray(draft.approvalBindings) || draft.approvalBindings.length !== approvalRefs.length) {
    throw new Error("every approval reference must have an exact revision/account binding");
  }
  const approvalBindings = draft.approvalBindings.map(freezeApprovalBinding);
  const boundApprovalRefs = approvalBindings.map((binding) => binding.approvalRef);
  if (new Set(boundApprovalRefs).size !== boundApprovalRefs.length || !sameRefs(approvalRefs, boundApprovalRefs)) {
    throw new Error("approval references must exactly match approval bindings");
  }
  for (const approval of approvalBindings) {
    if (timestamp(approval.approvedAt, "approval approvedAt") < observedAt) {
      throw new Error("publication approval cannot predate the draft revision it approves");
    }
    if (
      approval.draftVersion !== draft.version ||
      approval.intendedAccountId !== draft.intendedAccountId ||
      approval.contentHash !== draft.contentHash
    ) {
      throw new Error("publication approval is not bound to this exact draft revision/content/account");
    }
  }
}

export class SocialContentAssetRegistry {
  readonly #current = new Map<string, SocialContentAsset>();

  register(asset: SocialContentAsset): SocialContentAsset {
    assertSecretChannelSafe("brain_memory", asset);
    if (!asset.id.trim() || !asset.ownerId.trim() || !asset.brandId.trim() || !asset.assetRef.trim() || !asset.contentHash.trim() || !asset.mediaKind.trim()) {
      throw new Error("social content asset requires stable identity, scope, media kind, and content hash");
    }
    optionalId(asset.companyId, "companyId");
    optionalId(asset.projectId, "projectId");
    if (!Number.isSafeInteger(asset.version) || asset.version < 1) throw new Error("social content asset version must be positive");
    timestamp(asset.observedAt, "social content asset observedAt");
    const provenanceRefs = refs(asset.provenanceRefs, "social content asset provenance");
    const rightsEvidenceRefs = refs(asset.rightsEvidenceRefs, "social content asset rights evidence");
    const current = this.#current.get(asset.id);
    if (current) {
      if (
        current.ownerId !== asset.ownerId ||
        current.brandId !== asset.brandId ||
        current.companyId !== asset.companyId ||
        current.projectId !== asset.projectId ||
        current.assetRef !== asset.assetRef
      ) {
        throw new Error("social content asset lineage cannot be silently substituted");
      }
      if (asset.version !== current.version + 1) throw new Error("social content asset version must advance exactly by one");
      if (Date.parse(asset.observedAt) < Date.parse(current.observedAt)) throw new Error("social content asset observation time cannot regress");
    } else if (asset.version !== 1) {
      throw new Error("initial social content asset version must be one");
    }
    const frozen = Object.freeze({ ...asset, provenanceRefs, rightsEvidenceRefs });
    this.#current.set(asset.id, frozen);
    return frozen;
  }

  get(id: string): SocialContentAsset | undefined { return this.#current.get(id); }
}

export class CanonicalSocialContentRegistry {
  readonly #current = new Map<string, CanonicalSocialContent>();

  register(content: CanonicalSocialContent): CanonicalSocialContent {
    assertSecretChannelSafe("brain_memory", content);
    if (!content.id.trim() || !content.ownerId.trim() || !content.brandId.trim()) throw new Error("canonical social content identity/scope are required");
    optionalId(content.companyId, "companyId");
    optionalId(content.projectId, "projectId");
    optionalId(content.title, "title");
    if (!Number.isSafeInteger(content.version) || content.version < 1) throw new Error("canonical social content version must be positive");
    timestamp(content.observedAt, "canonical social content observedAt");
    const sourceAssetRefs = refs(content.sourceAssetRefs, "canonical social content assets", false);
    const provenanceRefs = refs(content.provenanceRefs, "canonical social content provenance");
    const current = this.#current.get(content.id);
    if (current) {
      if (
        current.ownerId !== content.ownerId ||
        current.brandId !== content.brandId ||
        current.companyId !== content.companyId ||
        current.projectId !== content.projectId
      ) {
        throw new Error("canonical social content scope cannot be silently substituted");
      }
      if (content.version !== current.version + 1) throw new Error("canonical social content version must advance exactly by one");
      if (Date.parse(content.observedAt) < Date.parse(current.observedAt)) throw new Error("canonical social content observation time cannot regress");
    } else if (content.version !== 1) {
      throw new Error("initial canonical social content version must be one");
    }
    const frozen = Object.freeze({ ...content, sourceAssetRefs, provenanceRefs });
    this.#current.set(content.id, frozen);
    return frozen;
  }

  get(id: string): CanonicalSocialContent | undefined { return this.#current.get(id); }
}

export function assertDraftPublishReady(draft: SocialDraft): void {
  validateDraftRevision(draft, true);
}

export function freezeSocialDraft(draft: SocialDraft): SocialDraft {
  validateDraftRevision(draft, false);
  return Object.freeze({
    ...draft,
    ...(draft.disclosures ? { disclosures: Object.freeze([...draft.disclosures]) } : {}),
    sourceAssetRefs: Object.freeze([...draft.sourceAssetRefs]),
    assetBindings: Object.freeze(draft.assetBindings.map(freezeAssetBinding)),
    rightsEvidenceRefs: Object.freeze([...draft.rightsEvidenceRefs]),
    provenanceRefs: Object.freeze([...draft.provenanceRefs]),
    approvalRefs: Object.freeze([...draft.approvalRefs]),
    approvalBindings: Object.freeze(draft.approvalBindings.map(freezeApprovalBinding))
  });
}

export class SocialDraftRegistry {
  readonly #current = new Map<string, SocialDraft>();
  readonly #history = new Map<string, readonly SocialDraft[]>();

  register(draft: SocialDraft): SocialDraft {
    const current = this.#current.get(draft.id);
    if (current) {
      if (
        current.ownerId !== draft.ownerId ||
        current.brandId !== draft.brandId ||
        current.companyId !== draft.companyId ||
        current.projectId !== draft.projectId ||
        current.canonicalContentId !== draft.canonicalContentId
      ) {
        throw new Error("draft owner/brand/canonical-content lineage cannot be substituted");
      }
      if (Date.parse(draft.observedAt) < Date.parse(current.observedAt)) throw new Error("draft observation time cannot regress");
      if (draft.version !== current.version + 1) throw new Error("draft version must advance exactly by one");
    } else if (draft.version !== 1) {
      throw new Error("initial draft version must be one");
    }
    const frozen = freezeSocialDraft(draft);
    this.#current.set(draft.id, frozen);
    this.#history.set(draft.id, Object.freeze([...(this.#history.get(draft.id) ?? []), frozen]));
    return frozen;
  }

  history(id: string, ownerId: string): readonly SocialDraft[] {
    if (this.#current.get(id)?.ownerId !== ownerId) throw new Error("draft history owner mismatch");
    return this.#history.get(id) ?? Object.freeze([]);
  }

  requireExact(id: string, ownerId: string, brandId: string, intendedAccountId: string, version: number, contentHash: string): SocialDraft {
    const draft = this.#current.get(id);
    if (
      !draft ||
      draft.ownerId !== ownerId ||
      draft.brandId !== brandId ||
      draft.intendedAccountId !== intendedAccountId ||
      draft.version !== version ||
      draft.contentHash !== contentHash
    ) {
      throw new Error("exact approved social draft revision mismatch");
    }
    return draft;
  }
}

export function assertSocialDraftTarget(draft: SocialDraft, identity: SocialIdentityMapRecord): void {
  if (
    draft.ownerId !== identity.ownerId ||
    draft.brandId !== identity.brandId ||
    draft.intendedAccountId !== identity.accountIdentityId ||
    draft.companyId !== identity.companyId ||
    draft.projectId !== identity.projectId ||
    draft.platform !== identity.platform
  ) {
    throw new Error("draft canonical company/project/platform/account target mismatch");
  }
}

export function previewSocialDraftTarget(draft: SocialDraft, identity: SocialIdentityMapRecord): SocialDraftTargetPreview {
  assertSocialDraftTarget(draft, identity);
  return Object.freeze({
    draftId: draft.id,
    draftVersion: draft.version,
    ownerId: identity.ownerId,
    entityId: identity.entityId,
    ...(identity.companyId ? { companyId: identity.companyId } : {}),
    ...(identity.projectId ? { projectId: identity.projectId } : {}),
    brandId: identity.brandId,
    platform: identity.platform,
    accountId: identity.accountIdentityId,
    platformIdentityId: identity.platformIdentityId,
    displayName: identity.displayName,
    publishAuthorized: false as const
  });
}

export function cloneDraftForAccount(draft: SocialDraft, intendedAccountId: string): SocialDraft {
  if (!intendedAccountId.trim()) throw new Error("target account is required");
  const cloned: SocialDraft = {
    ...draft,
    intendedAccountId: intendedAccountId.trim(),
    variantOfDraftId: draft.id,
    version: draft.version + 1,
    approvalRefs: Object.freeze([]),
    approvalBindings: Object.freeze([]),
    sourceAssetRefs: Object.freeze([...draft.sourceAssetRefs]),
    assetBindings: Object.freeze(draft.assetBindings.map(freezeAssetBinding)),
    rightsEvidenceRefs: Object.freeze([...draft.rightsEvidenceRefs]),
    provenanceRefs: Object.freeze([...draft.provenanceRefs])
  };
  return freezeSocialDraft(cloned);
}

export function createPlatformVariant(
  draft: SocialDraft,
  identity: SocialIdentityMapRecord,
  input: Readonly<{
    id: string;
    body: string;
    contentHash: string;
    observedAt: string;
    disclosures?: readonly string[];
    sensitivityRank?: number;
  }>
): SocialDraft {
  if (!draft.canonicalContentId) throw new Error("platform variant requires canonical content linkage");
  if (!input.id.trim() || input.id === draft.id) throw new Error("platform variant requires a new stable draft identity");
  const variant: SocialDraft = {
    ...draft,
    id: input.id,
    platform: identity.platform,
    intendedAccountId: identity.accountIdentityId,
    companyId: identity.companyId,
    projectId: identity.projectId,
    variantOfDraftId: draft.id,
    body: input.body,
    contentHash: input.contentHash,
    observedAt: input.observedAt,
    version: 1,
    sensitivityRank: input.sensitivityRank ?? draft.sensitivityRank,
    ...(input.disclosures ? { disclosures: Object.freeze([...input.disclosures]) } : {}),
    approvalRefs: Object.freeze([]),
    approvalBindings: Object.freeze([])
  };
  assertSocialDraftTarget(variant, identity);
  return freezeSocialDraft(variant);
}

export function reviseDraftContent(draft: SocialDraft, revision: SocialDraftContentRevision): SocialDraft {
  const revised: SocialDraft = {
    ...draft,
    ...revision,
    version: draft.version + 1,
    approvalRefs: Object.freeze([]),
    approvalBindings: Object.freeze([])
  };
  return freezeSocialDraft(revised);
}

export async function socialDraftContentHash(draft: SocialDraft): Promise<string> {
  const content = JSON.stringify([
    draft.body,
    draft.canonicalContentId ?? null,
    draft.variantOfDraftId ?? null,
    draft.sourceAssetRefs,
    draft.assetBindings,
    draft.rightsEvidenceRefs,
    draft.provenanceRefs,
    draft.disclosures ?? [],
    draft.sensitivityRank,
    draft.companyId ?? null,
    draft.projectId ?? null,
    draft.platform ?? null,
    draft.intendedAccountId
  ]);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
  return "sha256:" + [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

export async function assertSocialDraftIntegrity(draft: SocialDraft): Promise<void> {
  assertDraftPublishReady(draft);
  if (draft.contentHash !== await socialDraftContentHash(draft)) throw new Error("social draft content integrity mismatch");
}
