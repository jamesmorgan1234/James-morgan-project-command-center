export function assertSpecialistIsolation(records) {
    const canonical = new Map();
    for (const record of records) {
        if (!record.projectId.trim() || !record.truthOwner.trim() || !record.canonicalRef.trim() || record.sourceRefs.length === 0)
            throw new Error("specialist state requires identity/provenance");
        const prior = canonical.get(record.canonicalRef);
        if (prior && (prior.projectId !== record.projectId || prior.truthOwner !== record.truthOwner))
            throw new Error("specialist truth ownership collision");
        canonical.set(record.canonicalRef, record);
    }
}
export function canReactivate(profile, availableProviderCapabilities) {
    return profile.contract.providerCapabilities.every((capability) => availableProviderCapabilities.includes(capability));
}
export function renameSpecialist(profile, displayName) {
    if (!displayName.trim())
        throw new Error("display name required");
    return Object.freeze({ ...profile, displayName });
}
//# sourceMappingURL=isolation.js.map