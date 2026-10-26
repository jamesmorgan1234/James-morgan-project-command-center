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

export class BookAssetLedger {
  readonly #current = new Map<string, BookAssetVersion>();
  readonly #history: BookAssetVersion[] = [];

  put(asset: BookAssetVersion, replacementAuthorizationRef: string | null = null): BookAssetVersion {
    if (!asset.id.trim() || !asset.bookId.trim() || !asset.contentHash.trim() || asset.sourceRefs.length === 0 || asset.version < 1) throw new Error("book asset identity/hash/provenance required");
    if (asset.approved && !asset.approvalRef?.trim()) throw new Error("approved asset requires approval evidence");
    const key = `${asset.bookId}:${asset.kind}`;
    const prior = this.#current.get(key);
    if (prior && asset.version <= prior.version) throw new Error("asset version must advance");
    if (prior?.protected && prior.contentHash !== asset.contentHash && !replacementAuthorizationRef?.trim()) throw new Error("protected approved asset cannot be silently replaced");
    const frozen = Object.freeze({ ...asset, sourceRefs: Object.freeze([...asset.sourceRefs]) });
    this.#current.set(key, frozen);
    this.#history.push(frozen);
    return frozen;
  }

  current(bookId: string, kind: BookAssetKind): BookAssetVersion | undefined {
    return this.#current.get(`${bookId}:${kind}`);
  }

  history(bookId: string): readonly BookAssetVersion[] {
    return Object.freeze(this.#history.filter((asset) => asset.bookId === bookId));
  }
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

function assetTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

function assetRefs(values: readonly string[], label: string, requireOne = true): readonly string[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank references`);
  const normalized = values.map((value) => value.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} cannot contain duplicates`);
  return Object.freeze(normalized);
}

export class EvidenceBackedBookAssetLedger {
  readonly #current = new Map<string, EvidenceBackedBookAssetVersion>();
  readonly #history: EvidenceBackedBookAssetVersion[] = [];

  record(asset: EvidenceBackedBookAssetVersion, authorization?: ProtectedBookAssetReplacementAuthorization): EvidenceBackedBookAssetVersion {
    if (!asset.assetIdentityId.trim() || !asset.ownerId.trim() || !asset.projectId.trim() || !asset.bookId.trim() || !asset.fileRef.trim() || !asset.contentHash.trim() || !asset.authorityBasisRef.trim()) throw new Error("book asset identity/owner/project/book/file/hash/authority basis are required");
    if (!Number.isSafeInteger(asset.version) || asset.version < 1) throw new Error("book asset version must be positive");
    assetTimestamp(asset.observedAt, "book asset observedAt");
    const sourceRefs = assetRefs(asset.sourceRefs, "book asset source refs");
    const reconstructionRefs = assetRefs(asset.reconstructionRefs, "book asset reconstruction refs", false);
    if (asset.origin === "reconstruction" && reconstructionRefs.length === 0) throw new Error("reconstructed book asset requires reconstruction lineage");
    if (asset.origin !== "reconstruction" && reconstructionRefs.length > 0) throw new Error("only reconstructed assets may carry reconstruction lineage");
    if (asset.approved && !asset.approvalRef?.trim()) throw new Error("approved book asset requires explicit approval evidence");
    if (asset.protected && !asset.approved) throw new Error("protected book asset must be approved");
    if (asset.authoritative && asset.protected && !asset.approvalRef?.trim()) throw new Error("protected authoritative asset requires owner approval evidence");

    const key = `${asset.ownerId}:${asset.bookId}:${asset.kind}`;
    const prior = this.#current.get(key);
    if (prior) {
      if (asset.assetIdentityId !== prior.assetIdentityId || asset.projectId !== prior.projectId) throw new Error("canonical book asset lineage cannot be silently substituted");
      if (asset.version <= prior.version) throw new Error("book asset version must advance");
      if (prior.protected && prior.contentHash !== asset.contentHash) this.assertReplacementAuthorization(prior, asset, authorization);
    }
    const frozen = Object.freeze({ ...asset, sourceRefs, reconstructionRefs });
    this.#current.set(key, frozen);
    this.#history.push(frozen);
    return frozen;
  }

  current(ownerId: string, bookId: string, kind: EvidenceBackedBookAssetKind): EvidenceBackedBookAssetVersion | undefined {
    return this.#current.get(`${ownerId}:${bookId}:${kind}`);
  }

  history(ownerId: string, bookId: string): readonly EvidenceBackedBookAssetVersion[] {
    return Object.freeze(this.#history.filter((asset) => asset.ownerId === ownerId && asset.bookId === bookId));
  }

  explainAuthority(ownerId: string, bookId: string, kind: EvidenceBackedBookAssetKind): BookAssetAuthorityExplanation {
    const asset = this.current(ownerId, bookId, kind);
    if (!asset) throw new Error("authoritative book asset is unavailable");
    return Object.freeze({ assetIdentityId: asset.assetIdentityId, bookId: asset.bookId, kind: asset.kind, version: asset.version, fileRef: asset.fileRef, contentHash: asset.contentHash, origin: asset.origin, approved: asset.approved, protected: asset.protected, authoritative: asset.authoritative, authorityBasisRef: asset.authorityBasisRef, approvalRef: asset.approvalRef, sourceRefs: asset.sourceRefs, reconstructionRefs: asset.reconstructionRefs });
  }

  private assertReplacementAuthorization(prior: EvidenceBackedBookAssetVersion, replacement: EvidenceBackedBookAssetVersion, authorization: ProtectedBookAssetReplacementAuthorization | undefined): void {
    if (!authorization) throw new Error("protected approved asset cannot be silently replaced");
    const now = assetTimestamp(replacement.observedAt, "replacement observedAt");
    const observedAt = assetTimestamp(authorization.observedAt, "replacement authorization observedAt");
    const expiresAt = assetTimestamp(authorization.expiresAt, "replacement authorization expiresAt");
    if (!authorization.authorizationRef.trim() || authorization.ownerId !== replacement.ownerId || authorization.bookId !== replacement.bookId || authorization.kind !== replacement.kind || authorization.priorContentHash !== prior.contentHash || authorization.replacementContentHash !== replacement.contentHash) throw new Error("protected asset replacement authorization must bind exact owner/book/kind/prior/replacement hashes");
    if (observedAt > now || expiresAt <= now || expiresAt <= observedAt) throw new Error("protected asset replacement authorization must be current and unexpired");
  }
}
