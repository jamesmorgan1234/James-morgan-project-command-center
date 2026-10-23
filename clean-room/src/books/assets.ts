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
