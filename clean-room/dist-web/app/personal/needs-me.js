const URGENCY_RANK = Object.freeze({ critical: 0, high: 1, normal: 2, low: 3 });
function uniqueNonBlank(values, label, requireOne = true) {
    if (requireOne && values.length === 0)
        throw new Error(`${label} requires at least one value`);
    const normalized = values.map((value) => value.trim());
    if (normalized.some((value) => !value) || new Set(normalized).size !== normalized.length)
        throw new Error(`${label} must be unique and nonblank`);
    return Object.freeze(normalized);
}
function scopedNeedKey(ownerId, needKey) { return `${ownerId}:${needKey}`; }
function timestamp(value, label) { if (!Number.isFinite(Date.parse(value)))
    throw new Error(`${label} must be a valid timestamp`); }
function validateNeed(need) {
    if (!need.id.trim() || !need.ownerId.trim() || !need.needKey.trim() || !need.title.trim() || !need.reason.trim() || !need.ownerAction.trim())
        throw new Error("Needs Me identity/key/title/reason/action are required");
    return Object.freeze({ ...need, unlockRefs: uniqueNonBlank(need.unlockRefs, "Needs Me unlock refs"), resumeRefs: uniqueNonBlank(need.resumeRefs, "Needs Me resume refs"), sourceRefs: uniqueNonBlank(need.sourceRefs, "Needs Me source refs") });
}
export class NeedsMeQueue {
    #needs = new Map();
    #resolutions = new Map();
    static rehydrate(snapshot) {
        if (snapshot.schemaVersion !== "cc-needs-me-v1")
            throw new Error("Unsupported Needs Me snapshot");
        const queue = new NeedsMeQueue();
        for (const need of snapshot.needs) {
            const valid = validateNeed(need);
            if (queue.#needs.has(valid.id))
                throw new Error(`Duplicate persisted Needs Me id: ${valid.id}`);
            queue.#needs.set(valid.id, valid);
        }
        for (const resolution of snapshot.resolutions) {
            if (!resolution.ownerId.trim() || !resolution.needKey.trim() || !resolution.resolvedNeedId.trim())
                throw new Error("Needs Me resolution identity is required");
            timestamp(resolution.resolvedAt, "Needs Me resolvedAt");
            const frozen = Object.freeze({ ...resolution, evidenceRefs: uniqueNonBlank(resolution.evidenceRefs, "Needs Me resolution evidence"), unlockRefs: uniqueNonBlank(resolution.unlockRefs, "Needs Me resolution unlock refs"), resumeRefs: uniqueNonBlank(resolution.resumeRefs, "Needs Me resolution resume refs") });
            const key = scopedNeedKey(frozen.ownerId, frozen.needKey);
            if (queue.#resolutions.has(key))
                throw new Error(`Duplicate persisted Needs Me resolution: ${key}`);
            queue.#resolutions.set(key, frozen);
        }
        return queue;
    }
    upsert(input) {
        const need = validateNeed(input);
        const scopeKey = scopedNeedKey(need.ownerId, need.needKey);
        if (this.#resolutions.has(scopeKey))
            return;
        const current = [...this.#needs.values()].find((candidate) => candidate.ownerId === need.ownerId && candidate.needKey === need.needKey && candidate.state !== "resolved");
        if (!current) {
            this.#needs.set(need.id, need);
            return;
        }
        if (current.ownerAction !== need.ownerAction || current.requiredEnvironment !== need.requiredEnvironment)
            throw new Error("Needs Me needKey collision has different owner action or environment");
        const urgency = URGENCY_RANK[need.urgency] < URGENCY_RANK[current.urgency] ? need.urgency : current.urgency;
        const merged = Object.freeze({ ...current, urgency, unlockRefs: Object.freeze([...new Set([...current.unlockRefs, ...need.unlockRefs])]), resumeRefs: Object.freeze([...new Set([...current.resumeRefs, ...need.resumeRefs])]), sourceRefs: Object.freeze([...new Set([...current.sourceRefs, ...need.sourceRefs])]) });
        this.#needs.set(current.id, merged);
    }
    resolve(id) {
        const current = this.#needs.get(id);
        if (!current)
            throw new Error(`Unknown Needs Me item: ${id}`);
        const updated = Object.freeze({ ...current, state: "resolved" });
        this.#needs.set(id, updated);
        return updated;
    }
    resolveByKey(ownerId, needKey, resolvedAt, evidenceRefs) {
        timestamp(resolvedAt, "Needs Me resolvedAt");
        const key = scopedNeedKey(ownerId, needKey);
        const prior = this.#resolutions.get(key);
        if (prior)
            return prior;
        const current = [...this.#needs.values()].find((candidate) => candidate.ownerId === ownerId && candidate.needKey === needKey && candidate.state !== "resolved");
        if (!current)
            throw new Error(`Unknown open Needs Me key: ${key}`);
        const resolution = Object.freeze({ ownerId, needKey, resolvedNeedId: current.id, resolvedAt, evidenceRefs: uniqueNonBlank(evidenceRefs, "Needs Me resolution evidence"), unlockRefs: Object.freeze([...current.unlockRefs]), resumeRefs: Object.freeze([...current.resumeRefs]) });
        this.#needs.set(current.id, Object.freeze({ ...current, state: "resolved" }));
        this.#resolutions.set(key, resolution);
        return resolution;
    }
    resolution(ownerId, needKey) { return this.#resolutions.get(scopedNeedKey(ownerId, needKey)); }
    open() { return Object.freeze([...this.#needs.values()].filter((need) => need.state !== "resolved" && !this.#resolutions.has(scopedNeedKey(need.ownerId, need.needKey))).sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || b.unlockRefs.length - a.unlockRefs.length)); }
    exportSnapshot() { return Object.freeze({ schemaVersion: "cc-needs-me-v1", needs: Object.freeze([...this.#needs.values()]), resolutions: Object.freeze([...this.#resolutions.values()]) }); }
}
//# sourceMappingURL=needs-me.js.map