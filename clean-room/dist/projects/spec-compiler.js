export function compileUltimateSpec(projectId, specVersion, dimensions) {
    if (!projectId.trim() || !Number.isSafeInteger(specVersion) || specVersion < 1)
        throw new Error("Project id and positive spec version are required");
    const keys = new Set();
    const unresolved = [];
    for (const dimension of dimensions) {
        if (!dimension.key.trim() || keys.has(dimension.key))
            throw new Error(`Invalid or duplicate spec dimension: ${dimension.key}`);
        keys.add(dimension.key);
        if (!dimension.applicable)
            continue;
        if (dimension.state === "unknown")
            unresolved.push(dimension.key);
        if (dimension.state === "addressed" && dimension.evidenceRefs.length === 0)
            unresolved.push(dimension.key);
        if (dimension.state === "excluded_with_reason" && !dimension.exclusionReason?.trim())
            unresolved.push(dimension.key);
    }
    return Object.freeze({ projectId, specVersion, dimensions: Object.freeze([...dimensions]), complete: unresolved.length === 0, unresolvedKeys: Object.freeze([...new Set(unresolved)]) });
}
export const CORE_SPEC_DIMENSIONS = Object.freeze(["functional", "nonfunctional", "security", "privacy", "data", "operations", "recovery", "cost", "monetization", "maintenance", "testing", "accessibility", "future_dormant"]);
//# sourceMappingURL=spec-compiler.js.map