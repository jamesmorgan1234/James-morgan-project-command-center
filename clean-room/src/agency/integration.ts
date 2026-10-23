export interface IntegrationCandidate {
  readonly taskId: string;
  readonly artifactKey: string;
  readonly version: number;
  readonly contentHash: string;
  readonly verificationRefs: readonly string[];
}

export interface IntegrationDecision {
  readonly acceptedTaskIds: readonly string[];
  readonly conflicts: readonly string[];
}

export function arbitrateIntegration(candidates: readonly IntegrationCandidate[]): IntegrationDecision {
  const byArtifact = new Map<string, IntegrationCandidate[]>();
  for (const candidate of candidates) {
    if (candidate.verificationRefs.length === 0) throw new Error(`Integration candidate lacks verification: ${candidate.taskId}`);
    const list = byArtifact.get(candidate.artifactKey) ?? [];
    list.push(candidate);
    byArtifact.set(candidate.artifactKey, list);
  }
  const accepted: string[] = [];
  const conflicts: string[] = [];
  for (const [artifactKey, list] of byArtifact) {
    const hashes = new Set(list.map((candidate) => `${candidate.version}:${candidate.contentHash}`));
    if (hashes.size > 1) conflicts.push(artifactKey); else accepted.push(...list.map((candidate) => candidate.taskId));
  }
  return Object.freeze({ acceptedTaskIds: Object.freeze(accepted), conflicts: Object.freeze(conflicts) });
}
