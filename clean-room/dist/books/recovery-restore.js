function uniq(values, label, required = false) { if (!Array.isArray(values) || (required && values.length === 0) || values.some(v => typeof v !== "string" || !v.trim()))
    throw new Error(`${label} must contain nonblank references`); const n = values.map(v => v.trim()); if (new Set(n).size !== n.length)
    throw new Error(`${label} cannot contain duplicates`); return Object.freeze(n); }
export function validateBookRestoreManifest(m, currentSchemaVersion) { if (!m.id.trim() || !m.ownerId.trim() || !m.exportManifestId.trim() || !Number.isSafeInteger(m.schemaVersion) || m.schemaVersion < 1 || !Number.isFinite(Date.parse(m.restoredAt)))
    throw new Error("book restore identity/version/time required"); if (!Number.isSafeInteger(currentSchemaVersion) || currentSchemaVersion < 1)
    throw new Error("current restore schema version invalid"); if (m.schemaVersion !== currentSchemaVersion && !m.compatibleSchemaVersions.includes(currentSchemaVersion))
    throw new Error("book restore schema version is incompatible"); const bookIds = uniq(m.bookIds, "restore book ids", true), artifactIds = uniq(m.artifactIds, "restore artifact ids"), publicationStateRefs = uniq(m.publicationStateRefs, "restore publication refs"), approvalStateRefs = uniq(m.approvalStateRefs, "restore approval refs"), protectedAssetIds = uniq(m.protectedAssetIds, "restore protected assets"), supersededStateRefs = uniq(m.supersededStateRefs, "restore superseded states"), revokedAuthorityRefs = uniq(m.revokedAuthorityRefs, "restore revoked authorities"), providerMigrationRefs = uniq(m.providerMigrationRefs, "restore provider migrations"), historicalSourceRefs = uniq(m.historicalSourceRefs, "restore historical sources", true), conflictRefs = uniq(m.conflictRefs, "restore conflicts"); if (m.conflictState === "requires_owner_resolution" && conflictRefs.length === 0)
    throw new Error("unresolved restore conflict requires evidence"); if (m.conflictState === "none" && conflictRefs.length > 0)
    throw new Error("conflict-free restore cannot carry unresolved conflict refs"); return Object.freeze({ ...m, bookIds, artifactIds, publicationStateRefs, approvalStateRefs, protectedAssetIds, supersededStateRefs, revokedAuthorityRefs, providerMigrationRefs, historicalSourceRefs, conflictRefs, compatibleSchemaVersions: Object.freeze([...m.compatibleSchemaVersions]) }); }
export function assertRestoreDoesNotResurrectAuthority(m, candidateStateRefs, candidateAuthorityRefs) { const v = validateBookRestoreManifest(m, m.schemaVersion); for (const ref of candidateStateRefs)
    if (v.supersededStateRefs.includes(ref))
        throw new Error("restore cannot resurrect superseded state"); for (const ref of candidateAuthorityRefs)
    if (v.revokedAuthorityRefs.includes(ref))
        throw new Error("restore cannot resurrect revoked authority"); }
export function historicalRecoveryIsCurrentTruthByDefault() { return false; }
//# sourceMappingURL=recovery-restore.js.map