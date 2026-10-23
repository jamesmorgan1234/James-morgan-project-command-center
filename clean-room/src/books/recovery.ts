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
