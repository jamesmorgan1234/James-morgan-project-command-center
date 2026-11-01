import { parseTimestamp } from "../security/types.js";
function validateObservation(record) {
    if (!record.id.startsWith("observation:") || !record.sourceId.startsWith("source:") || !record.contentHash.trim())
        throw new Error("Observation id/source/contentHash are required");
    if (!Number.isSafeInteger(record.sequence) || record.sequence < 1)
        throw new Error("Observation sequence must be positive");
    parseTimestamp(record.observedAt, "observation.observedAt");
    parseTimestamp(record.effectiveAt, "observation.effectiveAt");
    parseTimestamp(record.ingestedAt, "observation.ingestedAt");
    if ((record.state === "corrected" || record.state === "retracted" || record.state === "tombstone") && !record.reason?.trim())
        throw new Error(`${record.state} observation requires a reason`);
}
export class ProvenanceLedger {
    #records = [];
    append(record) {
        validateObservation(record);
        if (this.#records.some((item) => item.id === record.id))
            throw new Error(`Observation already exists: ${record.id}`);
        const sourceHistory = this.#records.filter((item) => item.sourceId === record.sourceId);
        const prior = sourceHistory.at(-1);
        if (!prior) {
            if (record.sequence !== 1 || record.supersedes !== undefined)
                throw new Error("First source observation must start at sequence 1 without supersedes");
        }
        else {
            if (record.sequence !== prior.sequence + 1)
                throw new Error(`Observation sequence gap for ${record.sourceId}`);
            if (record.supersedes !== prior.id)
                throw new Error(`Observation must explicitly supersede ${prior.id}`);
            const index = this.#records.findIndex((item) => item.id === prior.id);
            if (index >= 0 && prior.state === "current")
                this.#records[index] = Object.freeze({ ...prior, state: "superseded" });
        }
        const frozen = Object.freeze({ ...record });
        this.#records.push(frozen);
        return frozen;
    }
    current(sourceId) {
        const latest = this.latest(sourceId);
        if (!latest || latest.state === "retracted" || latest.state === "tombstone" || latest.state === "superseded")
            return undefined;
        return latest;
    }
    latest(sourceId) {
        return [...this.#records].reverse().find((record) => record.sourceId === sourceId);
    }
    history(sourceId) {
        return Object.freeze(this.#records.filter((record) => record.sourceId === sourceId));
    }
}
export function assertProvenanceRefs(refs) {
    if (refs.length === 0)
        throw new Error("Derived or canonical claims require provenance references");
    const keys = refs.map((ref) => `${ref.observationId}|${ref.sourceId}|${ref.contentHash}`);
    if (new Set(keys).size !== keys.length)
        throw new Error("Provenance references must be unique");
    for (const ref of refs)
        if (!ref.observationId.startsWith("observation:") || !ref.sourceId.startsWith("source:") || !ref.contentHash.trim())
            throw new Error("Invalid provenance reference");
    return Object.freeze(refs.map((ref) => Object.freeze({ ...ref })));
}
//# sourceMappingURL=provenance.js.map