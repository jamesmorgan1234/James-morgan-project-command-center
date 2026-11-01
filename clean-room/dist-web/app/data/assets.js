import { parseTimestamp } from "../security/types.js";
function assertHash(hash) {
    if (!/^[a-f0-9]{64}$/i.test(hash))
        throw new Error("Asset sha256 must contain exactly 64 hexadecimal characters");
}
function normalizeHash(hash) {
    assertHash(hash);
    return hash.toLowerCase();
}
function validateMediaType(mediaType) {
    if (mediaType === undefined)
        return;
    if (!/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/i.test(mediaType))
        throw new Error("Asset media type must be a canonical type/subtype value without parameters");
}
function validateMediaMetadata(mediaMetadata, mediaType) {
    if (mediaMetadata === undefined)
        return;
    if (mediaMetadata === null || typeof mediaMetadata !== "object" || Array.isArray(mediaMetadata))
        throw new Error("Asset media metadata must be an object");
    if (mediaType === undefined)
        throw new Error("Asset media metadata requires a media type");
    const values = [mediaMetadata.durationMs, mediaMetadata.widthPx, mediaMetadata.heightPx];
    if (values.every((value) => value === undefined))
        throw new Error("Asset media metadata requires duration or dimensions");
    if (values.some((value) => value !== undefined && (!Number.isSafeInteger(value) || value <= 0)))
        throw new Error("Asset media metadata values must be positive safe integers");
}
function validateArchiveManifest(archiveManifest, mediaType) {
    if (archiveManifest === undefined)
        return;
    if (archiveManifest === null || typeof archiveManifest !== "object" || Array.isArray(archiveManifest))
        throw new Error("Asset archive manifest must be an object");
    if (mediaType === undefined)
        throw new Error("Asset archive manifest requires a media type");
    if (!Array.isArray(archiveManifest.entries) || archiveManifest.entries.length === 0)
        throw new Error("Asset archive manifest requires at least one entry");
    const paths = new Set();
    for (const entry of archiveManifest.entries) {
        if (entry === null || typeof entry !== "object" || Array.isArray(entry) || typeof entry.path !== "string" || !entry.path.trim())
            throw new Error("Asset archive manifest entry path is required");
        if (entry.path.startsWith("/") || entry.path.includes("\\") || entry.path.split("/").some((part) => part === "" || part === "." || part === ".."))
            throw new Error("Asset archive manifest entry path must be a safe relative path");
        if (paths.has(entry.path))
            throw new Error(`Asset archive manifest contains duplicate path: ${entry.path}`);
        paths.add(entry.path);
        if (entry.sha256 !== undefined)
            assertHash(entry.sha256);
    }
}
function validateGeneration(generation) {
    if (generation === undefined)
        return;
    if (generation === null || typeof generation !== "object" || Array.isArray(generation))
        throw new Error("Asset generation provenance must be an object");
    const values = [generation.generatorRef, generation.toolRef, generation.providerRef];
    if (values.every((value) => value === undefined))
        throw new Error("Asset generation provenance requires a generator, tool, or provider reference");
    if (values.some((value) => value !== undefined && (typeof value !== "string" || !value.trim())))
        throw new Error("Asset generation provenance references must be nonblank");
}
function validateQa(qa) {
    if (qa === undefined)
        return;
    if (qa === null || typeof qa !== "object" || Array.isArray(qa))
        throw new Error("Asset QA receipt must be an object");
    if (!["passed", "failed"].includes(qa.status))
        throw new Error("Unsupported asset QA status");
    if (typeof qa.evidenceId !== "string" || !qa.evidenceId.trim())
        throw new Error("Asset QA status requires a nonblank evidence receipt id");
}
function freezeAsset(record) {
    return Object.freeze({
        ...record,
        ...(record.generation === undefined ? {} : { generation: Object.freeze({ ...record.generation }) }),
        ...(record.qa === undefined ? {} : { qa: Object.freeze({ ...record.qa }) }),
        ...(record.mediaMetadata === undefined ? {} : { mediaMetadata: Object.freeze({ ...record.mediaMetadata }) }),
        ...(record.archiveManifest === undefined ? {} : { archiveManifest: Object.freeze({ entries: Object.freeze(record.archiveManifest.entries.map((entry) => Object.freeze({ ...entry }))) }) })
    });
}
function validateAsset(record) {
    if (!record.id.trim() || !record.ownerId.trim() || !record.name.trim() || !record.sourceRef.trim())
        throw new Error("Asset identity/provenance fields are required");
    if (!["internal", "sensitive", "protected", "secret"].includes(record.sensitivity) || !["available", "missing", "reconstruction"].includes(record.originalState) || !["unreviewed", "approved", "locked"].includes(record.approvalState))
        throw new Error("Unsupported asset state");
    if (record.sha256 !== undefined)
        assertHash(record.sha256);
    if (record.originalState === "available" && !record.sha256)
        throw new Error("Available asset requires sha256 identity");
    if (record.projectId !== undefined && !record.projectId.trim())
        throw new Error("Asset project scope must be nonblank");
    if (record.originRequirementId !== undefined && !record.originRequirementId.trim())
        throw new Error("Asset originating requirement must be nonblank");
    if (record.originTaskId !== undefined && !record.originTaskId.trim())
        throw new Error("Asset originating task must be nonblank");
    validateMediaType(record.mediaType);
    validateMediaMetadata(record.mediaMetadata, record.mediaType);
    validateArchiveManifest(record.archiveManifest, record.mediaType);
    validateGeneration(record.generation);
    validateQa(record.qa);
    if (parseTimestamp(record.updatedAt, "updatedAt") < parseTimestamp(record.createdAt, "createdAt"))
        throw new Error("Asset update cannot predate creation");
}
export class AssetRegistry {
    #assets = new Map();
    #history = new Map();
    #sha256Index = new Map();
    register(record) {
        validateAsset(record);
        if (!record.id.trim() || !record.ownerId.trim() || !record.name.trim() || !record.sourceRef.trim())
            throw new Error("Asset identity/provenance fields are required");
        if (record.sha256)
            assertHash(record.sha256);
        if (record.originalState === "available" && !record.sha256)
            throw new Error("Available asset requires sha256 identity");
        if (!Number.isSafeInteger(record.version) || record.version !== 1)
            throw new Error("New asset must start at version 1");
        parseTimestamp(record.createdAt, "createdAt");
        parseTimestamp(record.updatedAt, "updatedAt");
        if (this.#assets.has(record.id))
            throw new Error(`Asset already exists: ${record.id}`);
        const stored = freezeAsset(record);
        this.#assets.set(record.id, stored);
        this.#history.set(record.id, Object.freeze([stored]));
        this.#indexHash(stored);
    }
    replace(record, expectedVersion, authorization) {
        validateAsset(record);
        const current = this.#required(record.id);
        if (parseTimestamp(record.updatedAt, "updatedAt") < parseTimestamp(current.updatedAt, "updatedAt"))
            throw new Error("Asset update time cannot move backwards");
        if (current.version !== expectedVersion || record.version !== current.version + 1)
            throw new Error(`Asset version conflict for ${record.id}`);
        if (current.ownerId !== record.ownerId || current.createdAt !== record.createdAt)
            throw new Error("Asset owner/creation identity cannot be rewritten");
        if ((current.projectId ?? null) !== (record.projectId ?? null))
            throw new Error("Asset project ownership cannot be silently rewritten");
        if (current.originRequirementId !== undefined && current.originRequirementId !== record.originRequirementId)
            throw new Error("Asset originating requirement cannot be silently rewritten");
        if (current.originTaskId !== undefined && current.originTaskId !== record.originTaskId)
            throw new Error("Asset originating task cannot be silently rewritten");
        if (current.generation !== undefined && (record.generation === undefined || current.generation.generatorRef !== record.generation.generatorRef || current.generation.toolRef !== record.generation.toolRef || current.generation.providerRef !== record.generation.providerRef))
            throw new Error("Asset generation provenance cannot be silently rewritten");
        if (record.sha256)
            assertHash(record.sha256);
        if (current.approvalState === "locked" && (authorization?.authorized !== true || typeof authorization?.ownerDecisionRef !== "string" || !authorization.ownerDecisionRef.trim()))
            throw new Error(`Locked asset replacement requires explicit owner decision: ${record.id}`);
        const stored = freezeAsset(record);
        const history = this.#history.get(record.id) ?? Object.freeze([current]);
        this.#deindexHash(current);
        this.#assets.set(record.id, stored);
        this.#history.set(record.id, Object.freeze([...history, stored]));
        this.#indexHash(stored);
    }
    get(id) { return this.#assets.get(id); }
    history(id) { return this.#history.get(id) ?? Object.freeze([]); }
    listProject(projectId) { return Object.freeze([...this.#assets.values()].filter((asset) => asset.projectId === projectId)); }
    findDuplicatesBySha256(sha256) {
        const ids = this.#sha256Index.get(normalizeHash(sha256));
        if (!ids || ids.size < 2)
            return Object.freeze([]);
        return Object.freeze([...ids].map((id) => this.#required(id)));
    }
    #indexHash(record) {
        if (!record.sha256)
            return;
        const hash = normalizeHash(record.sha256);
        const ids = this.#sha256Index.get(hash) ?? new Set();
        ids.add(record.id);
        this.#sha256Index.set(hash, ids);
    }
    #deindexHash(record) {
        if (!record.sha256)
            return;
        const hash = normalizeHash(record.sha256);
        const ids = this.#sha256Index.get(hash);
        if (!ids)
            return;
        ids.delete(record.id);
        if (ids.size === 0)
            this.#sha256Index.delete(hash);
    }
    #required(id) {
        const record = this.#assets.get(id);
        if (!record)
            throw new Error(`Unknown asset: ${id}`);
        return record;
    }
}
//# sourceMappingURL=assets.js.map