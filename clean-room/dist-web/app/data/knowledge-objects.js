import { parseTimestamp } from "../security/types.js";
export const KNOWLEDGE_OBJECT_TYPES = Object.freeze([
    "fact", "rule", "decision", "preference", "goal", "idea", "hypothesis",
    "research_finding", "question", "unknown_gap", "contradiction", "owner_correction"
]);
const UNCERTAIN_TYPES = ["idea", "hypothesis", "question", "unknown_gap", "contradiction"];
const VALUELESS_TYPES = ["question", "unknown_gap", "contradiction"];
const CONFIDENCE_TYPES = ["fact", "rule", "decision", "preference", "goal", "hypothesis", "research_finding"];
function nonblank(value, label) {
    if (!value.trim())
        throw new Error(`${label} is required`);
}
export function createKnowledgeObject(input) {
    nonblank(input.id, "Knowledge object id");
    nonblank(input.subjectRef, "Knowledge object subject");
    if (!KNOWLEDGE_OBJECT_TYPES.includes(input.type))
        throw new Error("Unsupported knowledge object type");
    if (input.sourceRefs.length === 0 || input.sourceRefs.some((ref) => !ref.trim()))
        throw new Error("Knowledge object requires provenance");
    if (new Set(input.sourceRefs).size !== input.sourceRefs.length)
        throw new Error("Knowledge object provenance must be unique");
    if (VALUELESS_TYPES.includes(input.type) && input.value !== null)
        throw new Error(`${input.type} objects cannot carry a fabricated value`);
    if (!VALUELESS_TYPES.includes(input.type) && input.value === null)
        throw new Error(`${input.type} objects require a value`);
    if (CONFIDENCE_TYPES.includes(input.type)) {
        if (input.confidence === null || !Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1)
            throw new Error("Knowledge confidence must be between 0 and 1");
    }
    if (UNCERTAIN_TYPES.includes(input.type) && input.confidence === 1)
        throw new Error(`${input.type} objects cannot claim certainty`);
    if (input.type === "contradiction" && (input.contradictionRefs ?? []).length < 2)
        throw new Error("Contradiction objects require at least two opposing references");
    if (input.type === "owner_correction" && !input.supersedes?.trim())
        throw new Error("Owner corrections must supersede an existing object");
    if (input.type === "research_finding" && input.evidenceRefs.length === 0)
        throw new Error("Research findings require evidence");
    if (input.type === "research_finding" && input.origin !== "external")
        throw new Error("Research findings require external provenance");
    if (input.externallyVerified && (input.origin !== "external" || input.evidenceRefs.length === 0))
        throw new Error("Externally verified objects require external provenance and evidence");
    if (input.type === "fact" && input.origin === "owner" && input.externallyVerified)
        throw new Error("Owner-originated facts cannot self-declare external verification");
    if (input.editableByOwner && input.origin !== "owner")
        throw new Error("Only owner-originated objects are owner-editable");
    if (input.sensitivity !== "public" && input.sensitivity !== "internal" && input.sensitivity !== "sensitive" && input.sensitivity !== "protected")
        throw new Error("Unsupported knowledge sensitivity");
    if (input.shareability === "internal" && (input.sensitivity === "sensitive" || input.sensitivity === "protected"))
        throw new Error("Shareability cannot exceed sensitivity");
    if (input.shareability === "owner_shared" && input.sensitivity === "protected")
        throw new Error("Owner-shared objects cannot be protected");
    parseTimestamp(input.observedAt, "observedAt");
    if (input.validFrom !== undefined)
        parseTimestamp(input.validFrom, "validFrom");
    if (input.validUntil !== undefined)
        parseTimestamp(input.validUntil, "validUntil");
    if (input.staleAfter !== undefined)
        parseTimestamp(input.staleAfter, "staleAfter");
    if (input.validFrom !== undefined && input.validUntil !== undefined && Date.parse(input.validUntil) < Date.parse(input.validFrom))
        throw new Error("Knowledge validity cannot end before it begins");
    if (input.staleAfter !== undefined && Date.parse(input.staleAfter) <= Date.parse(input.observedAt))
        throw new Error("Knowledge staleAfter must follow observation");
    const frozen = Object.freeze({
        ...input,
        evidenceRefs: Object.freeze([...input.evidenceRefs]),
        sourceRefs: Object.freeze([...input.sourceRefs]),
        ...(input.contradictionRefs !== undefined ? { contradictionRefs: Object.freeze([...input.contradictionRefs]) } : {})
    });
    return frozen;
}
export function knowledgeFreshnessState(object, now) {
    const current = Date.parse(now);
    if (!Number.isFinite(current))
        throw new Error("Freshness requires a valid observation time");
    if (object.staleAfter === undefined)
        return "unknown";
    return current >= Date.parse(object.staleAfter) ? "stale" : "fresh";
}
export function isBrainGenerated(object) {
    return object.origin === "brain";
}
export function isOwnerOriginated(object) {
    return object.origin === "owner";
}
//# sourceMappingURL=knowledge-objects.js.map