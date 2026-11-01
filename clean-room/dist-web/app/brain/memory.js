import { immutableJson } from "../data/canonical.js";
import { assertSecretChannelSafe } from "../security/secret-channels.js";
import { parseTimestamp } from "../security/types.js";
function freezeMetadata(metadata) {
    return Object.freeze({ ...metadata, taskClasses: Object.freeze([...metadata.taskClasses]), conditionRefs: Object.freeze([...metadata.conditionRefs]), dependencyRefs: Object.freeze([...metadata.dependencyRefs]), methodRefs: Object.freeze([...metadata.methodRefs]), permissionRefs: Object.freeze([...metadata.permissionRefs]), budgetRefs: Object.freeze([...metadata.budgetRefs]), contradictionRefs: Object.freeze([...metadata.contradictionRefs]), invalidationEvidenceRefs: Object.freeze([...metadata.invalidationEvidenceRefs]) });
}
export function validateLayeredMemoryMetadata(metadata) {
    if (!metadata.memoryId.trim() || !Number.isInteger(metadata.memoryVersion) || metadata.memoryVersion < 1)
        throw new Error("Layered memory identity/version required");
    if (metadata.expiresAt)
        parseTimestamp(metadata.expiresAt, "expiresAt");
    if (metadata.revalidateAfter)
        parseTimestamp(metadata.revalidateAfter, "revalidateAfter");
    if (metadata.invalidatedAt)
        parseTimestamp(metadata.invalidatedAt, "invalidatedAt");
    if (metadata.invalidatedAt && metadata.invalidationEvidenceRefs.length === 0)
        throw new Error("Invalidated memory requires invalidation evidence");
    if ((metadata.layer === "quarantined" || metadata.layer === "historical") && metadata.operationalEligible)
        throw new Error("Quarantined/historical memory cannot be operationally eligible");
    return freezeMetadata(metadata);
}
export function memoryOperationalEligibility(memory, metadata, request) {
    validateLayeredMemoryMetadata(metadata);
    const now = parseTimestamp(request.now, "now");
    if (memory.id !== metadata.memoryId || memory.version !== metadata.memoryVersion)
        return { eligible: false, reason: "version_mismatch" };
    if (memory.ownerId !== request.ownerId)
        return { eligible: false, reason: "owner_boundary" };
    if (memory.projectId !== undefined && memory.projectId !== request.projectId)
        return { eligible: false, reason: "project_boundary" };
    if (metadata.companyId !== undefined && metadata.companyId !== request.companyId)
        return { eligible: false, reason: "company_boundary" };
    if (memory.state !== "current")
        return { eligible: false, reason: `memory_${memory.state}` };
    if (!metadata.operationalEligible)
        return { eligible: false, reason: `layer_${metadata.layer}_nonoperational` };
    if (metadata.taskClasses.length > 0 && !metadata.taskClasses.includes(request.taskClass))
        return { eligible: false, reason: "task_inapplicable" };
    if (memory.retainUntil && now >= parseTimestamp(memory.retainUntil, "retainUntil"))
        return { eligible: false, reason: "retention_expired" };
    if (metadata.expiresAt && now >= parseTimestamp(metadata.expiresAt, "expiresAt"))
        return { eligible: false, reason: "memory_expired" };
    if (metadata.revalidateAfter && now >= parseTimestamp(metadata.revalidateAfter, "revalidateAfter"))
        return { eligible: false, reason: "revalidation_due" };
    if (metadata.invalidatedAt)
        return { eligible: false, reason: "memory_invalidated" };
    if (metadata.contradictionRefs.length > 0)
        return { eligible: false, reason: "unresolved_contradiction" };
    return { eligible: true, reason: "eligible" };
}
export class BrainMemoryLedger {
    #items = [];
    #metadata = new Map();
    append(memory) {
        if (!memory.id.trim() || !memory.ownerId.trim() || !Number.isSafeInteger(memory.version) || memory.version < 1)
            throw new Error("Memory identity/version are required");
        if (memory.confidence < 0 || memory.confidence > 1 || !Number.isFinite(memory.confidence))
            throw new Error("Memory confidence must be 0..1");
        if (memory.sourceRefs.length === 0)
            throw new Error("Memory requires provenance");
        parseTimestamp(memory.recordedAt, "recordedAt");
        if (memory.retainUntil)
            parseTimestamp(memory.retainUntil, "retainUntil");
        if (this.#items.some((item) => item.id === memory.id))
            throw new Error(`Memory already exists: ${memory.id}`);
        const valueSnapshot = immutableJson(memory.value);
        assertSecretChannelSafe("brain_memory", valueSnapshot);
        if (memory.state === "current" && memory.supersedes) {
            const previousIndex = this.#items.findIndex((item) => item.id === memory.supersedes && item.state === "current");
            if (previousIndex < 0)
                throw new Error(`Superseded memory is not current or missing: ${memory.supersedes}`);
            const previous = this.#items[previousIndex];
            if (!previous || previous.ownerId !== memory.ownerId || previous.projectId !== memory.projectId || previous.kind !== memory.kind)
                throw new Error("Memory correction must stay within owner/project/kind boundary");
            this.#items[previousIndex] = Object.freeze({ ...previous, state: "superseded" });
        }
        this.#items.push(Object.freeze({ ...memory, value: valueSnapshot, sourceRefs: Object.freeze([...memory.sourceRefs]) }));
    }
    attachLayer(metadata) {
        const memory = this.#items.find((item) => item.id === metadata.memoryId && item.version === metadata.memoryVersion);
        if (!memory)
            throw new Error("Layer metadata must reference an exact existing memory version");
        if (this.#metadata.has(metadata.memoryId))
            throw new Error("Layer metadata already attached");
        this.#metadata.set(metadata.memoryId, validateLayeredMemoryMetadata(metadata));
    }
    operational(request) {
        const eligible = [];
        for (const memory of this.#items) {
            const metadata = this.#metadata.get(memory.id);
            if (!metadata)
                continue;
            if (memoryOperationalEligibility(memory, metadata, request).eligible)
                eligible.push(Object.freeze({ memory, metadata }));
        }
        return Object.freeze(eligible);
    }
    current(ownerId, projectId) { return Object.freeze(this.#items.filter((item) => item.ownerId === ownerId && item.state === "current" && (projectId === undefined || item.projectId === projectId))); }
    history(id) { return Object.freeze(this.#items.filter((item) => item.id === id || item.supersedes === id)); }
}
//# sourceMappingURL=memory.js.map