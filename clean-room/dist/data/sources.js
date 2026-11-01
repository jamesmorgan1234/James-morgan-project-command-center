import { parseTimestamp } from "../security/types.js";
const TRUST_RANK = Object.freeze({
    untrusted_external: 0,
    historical_evidence: 1,
    verified_provider: 2,
    owner_authoritative: 3
});
function nonEmptyOptional(value, label) {
    if (value !== undefined && !value.trim())
        throw new Error(`${label} cannot be empty`);
}
export function validateSourceIdentity(source) {
    if (!["owner_authoritative", "verified_provider", "historical_evidence", "untrusted_external"].includes(source.trust) || !["data_only", "owner_statement_candidate"].includes(source.instructionPolicy) || !["active", "degraded", "unavailable", "tombstoned"].includes(source.lifecycle) || !["internal", "sensitive", "protected", "secret"].includes(source.sensitivity))
        throw new Error("Unsupported source contract state");
    if (source.scope.environment !== undefined && !["development", "test", "staging", "production"].includes(source.scope.environment))
        throw new Error("Unsupported source environment");
    if (!source.id.startsWith("source:"))
        throw new Error(`Source id must start with source:: ${source.id}`);
    if (!source.providerKey.startsWith("provider:"))
        throw new Error(`Source providerKey must start with provider:: ${source.providerKey}`);
    if (!source.sourceType.trim() || !source.externalStableId.trim() || !source.scope.ownerId.trim() || !source.retentionClass.trim())
        throw new Error("Source type/stable-id/owner/retention are required");
    nonEmptyOptional(source.scope.companyId, "source.companyId");
    nonEmptyOptional(source.scope.projectId, "source.projectId");
    nonEmptyOptional(source.scope.accountId, "source.accountId");
    if (!Number.isSafeInteger(source.version) || source.version < 1)
        throw new Error("Source version must be a positive safe integer");
    const created = parseTimestamp(source.createdAt, "source.createdAt");
    const updated = parseTimestamp(source.updatedAt, "source.updatedAt");
    if (updated < created)
        throw new Error("Source updatedAt cannot predate createdAt");
    if (source.purpose.length === 0 || new Set(source.purpose).size !== source.purpose.length || source.purpose.some((item) => !item.trim()))
        throw new Error("Source purpose must contain unique non-empty values");
    if (source.trust === "untrusted_external" && source.instructionPolicy !== "data_only")
        throw new Error("Untrusted external source content must remain data-only");
    if (source.trust === "historical_evidence" && source.instructionPolicy !== "data_only")
        throw new Error("Historical source content is evidence, not current instruction authority");
    return Object.freeze({ ...source, scope: Object.freeze({ ...source.scope }), purpose: Object.freeze([...source.purpose]) });
}
function sourceUniqueKey(source) {
    return JSON.stringify([source.providerKey, source.sourceType, source.externalStableId, source.scope.ownerId, source.scope.companyId ?? null, source.scope.projectId ?? null, source.scope.accountId ?? null, source.scope.environment ?? null]);
}
export class SourceRegistry {
    #byId = new Map();
    #identityKeys = new Map();
    register(source) {
        const validated = validateSourceIdentity(source);
        if (this.#byId.has(validated.id))
            throw new Error(`Source already exists: ${validated.id}`);
        const identityKey = sourceUniqueKey(validated);
        if (this.#identityKeys.has(identityKey))
            throw new Error(`Stable source identity already registered: ${identityKey}`);
        this.#byId.set(validated.id, validated);
        this.#identityKeys.set(identityKey, validated.id);
        return validated;
    }
    replace(source, expectedVersion) {
        const validated = validateSourceIdentity(source);
        const current = this.#required(validated.id);
        if (current.version !== expectedVersion)
            throw new Error(`Source version conflict: ${validated.id}`);
        if (validated.version !== current.version + 1)
            throw new Error("Source replacement must advance exactly one version");
        if (sourceUniqueKey(validated) !== sourceUniqueKey(current))
            throw new Error("Stable source identity/scope cannot be silently rewritten");
        this.#byId.set(validated.id, validated);
        return validated;
    }
    get(id) { return this.#byId.get(id); }
    list() { return Object.freeze([...this.#byId.values()]); }
    #required(id) {
        const source = this.#byId.get(id);
        if (!source)
            throw new Error(`Unknown source: ${id}`);
        return source;
    }
}
export function compareSourceAuthority(left, right) {
    if (left.scope.ownerId !== right.scope.ownerId || left.scope.companyId !== right.scope.companyId || left.scope.projectId !== right.scope.projectId || left.scope.accountId !== right.scope.accountId || left.scope.environment !== right.scope.environment) {
        return Object.freeze({ action: "abstain_conflict", reason: "different_scope_cannot_be_ranked" });
    }
    const leftRank = TRUST_RANK[left.trust];
    const rightRank = TRUST_RANK[right.trust];
    if (leftRank > rightRank)
        return Object.freeze({ action: "prefer_left", reason: "higher_source_authority" });
    if (rightRank > leftRank)
        return Object.freeze({ action: "prefer_right", reason: "higher_source_authority" });
    return Object.freeze({ action: "abstain_conflict", reason: "equal_authority_requires_evidence_resolution" });
}
//# sourceMappingURL=sources.js.map