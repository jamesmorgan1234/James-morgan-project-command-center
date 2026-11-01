export function arbitrateIntegration(candidates) {
    const byArtifact = new Map();
    for (const candidate of candidates) {
        if (candidate.verificationRefs.length === 0)
            throw new Error(`Integration candidate lacks verification: ${candidate.taskId}`);
        const list = byArtifact.get(candidate.artifactKey) ?? [];
        list.push(candidate);
        byArtifact.set(candidate.artifactKey, list);
    }
    const accepted = [];
    const conflicts = [];
    for (const [artifactKey, list] of byArtifact) {
        const hashes = new Set(list.map((candidate) => `${candidate.version}:${candidate.contentHash}`));
        if (hashes.size > 1)
            conflicts.push(artifactKey);
        else
            accepted.push(...list.map((candidate) => candidate.taskId));
    }
    return Object.freeze({ acceptedTaskIds: Object.freeze(accepted), conflicts: Object.freeze(conflicts) });
}
//# sourceMappingURL=integration.js.map