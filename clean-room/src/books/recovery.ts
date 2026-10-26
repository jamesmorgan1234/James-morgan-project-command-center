export interface RecoveredBookCandidate {
  readonly bookId: string;
  readonly projectId: string;
  readonly canonicalTitle: string;
  readonly sourceRefs: readonly string[];
  readonly artifactRefs: readonly string[];
  readonly missingArtifactKinds: readonly string[];
  readonly status: "active" | "dormant" | "archived";
}

export function validateBookRecovery(candidates: readonly RecoveredBookCandidate[]): Readonly<{ total: number; unresolved: number }> {
  const ids = new Set<string>();
  let unresolved = 0;
  for (const candidate of candidates) {
    if (ids.has(candidate.bookId)) throw new Error("duplicate recovered book identity");
    if (!candidate.bookId.trim() || !candidate.projectId.trim() || !candidate.canonicalTitle.trim() || candidate.sourceRefs.length === 0) throw new Error("recovered book requires identity and provenance");
    ids.add(candidate.bookId);
    if (candidate.missingArtifactKinds.length > 0) unresolved += 1;
  }
  return Object.freeze({ total: candidates.length, unresolved });
}

export type BookRecoveryStatus = "active" | "dormant" | "archived";
export type BookArtifactRecoveryState = "present" | "missing" | "recovered_original" | "reconstructed";

export interface EvidenceBackedRecoveredBook {
  readonly bookId: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly canonicalTitle: string;
  readonly aliases: readonly string[];
  readonly seriesRootId?: string | undefined;
  readonly seriesSequence?: number | undefined;
  readonly status: BookRecoveryStatus;
  readonly sourceRefs: readonly string[];
  readonly artifactRefs: readonly string[];
  readonly missingArtifactKinds: readonly string[];
  readonly continuityRefs: readonly string[];
  readonly recoveredAt: string;
}

export interface RecoveredBookArtifact {
  readonly id: string;
  readonly ownerId: string;
  readonly bookId: string;
  readonly kind: string;
  readonly state: BookArtifactRecoveryState;
  readonly artifactRef?: string | undefined;
  readonly contentHash?: string | undefined;
  readonly sourceRefs: readonly string[];
  readonly reconstructionRefs: readonly string[];
  readonly observedAt: string;
}

export interface BookArchiveTransition {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly bookId: string;
  readonly from: BookRecoveryStatus;
  readonly to: BookRecoveryStatus;
  readonly ownerActionRef: string;
  readonly observedAt: string;
}

export interface BookExportManifest {
  readonly id: string;
  readonly ownerId: string;
  readonly projectIds: readonly string[];
  readonly bookIds: readonly string[];
  readonly artifactIds: readonly string[];
  readonly providerKeys: readonly string[];
  readonly manifestHash: string;
  readonly sourceRefs: readonly string[];
  readonly createdAt: string;
}

export interface BookProviderMigrationRecord {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId: string;
  readonly bookId: string;
  readonly fromProviderKey: string;
  readonly toProviderKey: string;
  readonly state: "planned" | "exported" | "imported" | "verified" | "blocked";
  readonly exportManifestId: string;
  readonly evidenceRefs: readonly string[];
  readonly observedAt: string;
}

function recoveryTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}

function recoveryRefs(values: readonly string[], label: string, requireOne = true): readonly string[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank references`);
  const normalized = values.map((value) => value.trim());
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} cannot contain duplicates`);
  return Object.freeze(normalized);
}

export class BookRecoveryCatalog {
  readonly #books = new Map<string, EvidenceBackedRecoveredBook>();
  readonly #artifacts = new Map<string, RecoveredBookArtifact>();
  readonly #transitions: BookArchiveTransition[] = [];

  registerBook(book: EvidenceBackedRecoveredBook): EvidenceBackedRecoveredBook {
    if (!book.bookId.trim() || !book.ownerId.trim() || !book.projectId.trim() || !book.canonicalTitle.trim()) throw new Error("recovered book identity/owner/project/title are required");
    recoveryTimestamp(book.recoveredAt, "book recoveredAt");
    const aliases = recoveryRefs(book.aliases, "recovered book aliases", false);
    const sourceRefs = recoveryRefs(book.sourceRefs, "recovered book source refs");
    const artifactRefs = recoveryRefs(book.artifactRefs, "recovered book artifact refs", false);
    const missingArtifactKinds = recoveryRefs(book.missingArtifactKinds, "recovered book missing artifact kinds", false);
    const continuityRefs = recoveryRefs(book.continuityRefs, "recovered book continuity refs", false);
    if (book.seriesSequence !== undefined && (!Number.isSafeInteger(book.seriesSequence) || book.seriesSequence < 1 || !book.seriesRootId?.trim())) throw new Error("series sequence requires positive order and series root");
    const current = this.#books.get(book.bookId);
    if (current && (current.ownerId !== book.ownerId || current.projectId !== book.projectId || current.seriesRootId !== book.seriesRootId)) throw new Error("recovered book canonical lineage cannot be substituted");
    const frozen = Object.freeze({ ...book, aliases, sourceRefs, artifactRefs, missingArtifactKinds, continuityRefs });
    this.#books.set(book.bookId, frozen);
    return frozen;
  }

  registerArtifact(artifact: RecoveredBookArtifact): RecoveredBookArtifact {
    if (!artifact.id.trim() || !artifact.ownerId.trim() || !artifact.bookId.trim() || !artifact.kind.trim()) throw new Error("recovered artifact identity/owner/book/kind are required");
    recoveryTimestamp(artifact.observedAt, "recovered artifact observedAt");
    const book = this.#books.get(artifact.bookId);
    if (!book || book.ownerId !== artifact.ownerId) throw new Error("recovered artifact requires exact owner-scoped book");
    const sourceRefs = recoveryRefs(artifact.sourceRefs, "recovered artifact source refs");
    const reconstructionRefs = recoveryRefs(artifact.reconstructionRefs, "recovered artifact reconstruction refs", false);
    if (artifact.state === "missing" && (artifact.artifactRef !== undefined || artifact.contentHash !== undefined)) throw new Error("missing artifact cannot pretend to have file/hash evidence");
    if (artifact.state !== "missing" && (!artifact.artifactRef?.trim() || !artifact.contentHash?.trim())) throw new Error("present/recovered/reconstructed artifact requires file and hash evidence");
    if (artifact.state === "reconstructed" && reconstructionRefs.length === 0) throw new Error("reconstructed artifact requires reconstruction lineage");
    const prior = this.#artifacts.get(artifact.id);
    if (prior && (prior.ownerId !== artifact.ownerId || prior.bookId !== artifact.bookId || prior.kind !== artifact.kind)) throw new Error("recovered artifact lineage cannot be substituted");
    const frozen = Object.freeze({ ...artifact, sourceRefs, reconstructionRefs });
    this.#artifacts.set(artifact.id, frozen);
    return frozen;
  }

  transitionStatus(transition: BookArchiveTransition): EvidenceBackedRecoveredBook {
    if (!transition.id.trim() || !transition.ownerId.trim() || !transition.projectId.trim() || !transition.bookId.trim() || !transition.ownerActionRef.trim()) throw new Error("book archive transition requires explicit owner action and exact identity");
    recoveryTimestamp(transition.observedAt, "book archive transition observedAt");
    const book = this.#books.get(transition.bookId);
    if (!book || book.ownerId !== transition.ownerId || book.projectId !== transition.projectId || book.status !== transition.from) throw new Error("book archive transition does not match current canonical state");
    const allowed: Readonly<Record<BookRecoveryStatus, readonly BookRecoveryStatus[]>> = { active: ["dormant","archived"], dormant: ["active","archived"], archived: ["active","dormant"] };
    if (!allowed[transition.from].includes(transition.to)) throw new Error("invalid book archive/reactivation transition");
    this.#transitions.push(Object.freeze({ ...transition }));
    const updated = Object.freeze({ ...book, status: transition.to });
    this.#books.set(book.bookId, updated);
    return updated;
  }

  search(ownerId: string, query: string, limit = 50): readonly EvidenceBackedRecoveredBook[] {
    if (!query.trim()) throw new Error("book recovery search query is required");
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 1000) throw new Error("book recovery search limit is invalid");
    const needle = query.trim().toLowerCase();
    const result = [...this.#books.values()].filter((book) => book.ownerId === ownerId && [book.canonicalTitle, book.projectId, book.bookId, ...book.aliases].some((value) => value.toLowerCase().includes(needle))).sort((a,b) => a.canonicalTitle.localeCompare(b.canonicalTitle)).slice(0,limit);
    return Object.freeze(result);
  }

  validateSeriesContinuity(ownerId: string, seriesRootId: string): Readonly<{ pass: boolean; orderedBookIds: readonly string[]; missingSequences: readonly number[]; continuityComplete: boolean }> {
    const books = [...this.#books.values()].filter((book) => book.ownerId === ownerId && book.seriesRootId === seriesRootId).sort((a,b) => (a.seriesSequence ?? 0)-(b.seriesSequence ?? 0));
    const sequences = books.map((book) => book.seriesSequence).filter((value): value is number => value !== undefined);
    const max = sequences.length === 0 ? 0 : Math.max(...sequences);
    const missingSequences = Array.from({length:max},(_,index)=>index+1).filter((sequence)=>!sequences.includes(sequence));
    const continuityComplete = books.length > 0 && books.every((book) => book.continuityRefs.length > 0);
    return Object.freeze({ pass: books.length > 0 && missingSequences.length === 0 && continuityComplete, orderedBookIds: Object.freeze(books.map((book)=>book.bookId)), missingSequences: Object.freeze(missingSequences), continuityComplete });
  }

  unresolved(ownerId: string): readonly EvidenceBackedRecoveredBook[] {
    return Object.freeze([...this.#books.values()].filter((book) => book.ownerId === ownerId && book.missingArtifactKinds.length > 0));
  }

  list(ownerId: string): readonly EvidenceBackedRecoveredBook[] {
    return Object.freeze([...this.#books.values()].filter((book) => book.ownerId === ownerId));
  }
}

export function validateBookExportManifest(manifest: BookExportManifest): BookExportManifest {
  if (!manifest.id.trim() || !manifest.ownerId.trim() || !manifest.manifestHash.trim()) throw new Error("book export manifest identity/owner/hash are required");
  recoveryTimestamp(manifest.createdAt, "book export createdAt");
  const projectIds = recoveryRefs(manifest.projectIds, "book export project ids");
  const bookIds = recoveryRefs(manifest.bookIds, "book export book ids");
  const artifactIds = recoveryRefs(manifest.artifactIds, "book export artifact ids", false);
  const providerKeys = recoveryRefs(manifest.providerKeys, "book export provider keys", false);
  const sourceRefs = recoveryRefs(manifest.sourceRefs, "book export source refs");
  return Object.freeze({ ...manifest, projectIds, bookIds, artifactIds, providerKeys, sourceRefs });
}

export function validateBookProviderMigration(record: BookProviderMigrationRecord, manifests: readonly BookExportManifest[]): BookProviderMigrationRecord {
  if (!record.id.trim() || !record.ownerId.trim() || !record.projectId.trim() || !record.bookId.trim() || !record.fromProviderKey.trim() || !record.toProviderKey.trim() || record.fromProviderKey === record.toProviderKey) throw new Error("book provider migration requires distinct provider identities and exact scope");
  recoveryTimestamp(record.observedAt, "book provider migration observedAt");
  const evidenceRefs = recoveryRefs(record.evidenceRefs, "book provider migration evidence refs");
  const manifest = manifests.map(validateBookExportManifest).find((item) => item.id === record.exportManifestId && item.ownerId === record.ownerId);
  if (!manifest || !manifest.projectIds.includes(record.projectId) || !manifest.bookIds.includes(record.bookId)) throw new Error("book provider migration requires matching export manifest coverage");
  if (record.state === "verified" && !evidenceRefs.some((ref) => ref.includes("verify") || ref.includes("provider"))) throw new Error("verified provider migration requires verification evidence");
  return Object.freeze({ ...record, evidenceRefs });
}
