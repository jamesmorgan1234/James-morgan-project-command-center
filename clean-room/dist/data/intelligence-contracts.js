import { assertIdentifierKind, parseIdentifier } from "../kernel/identifiers.js";
export const SHARED_INTELLIGENCE_CONTRACT_VERSION = 1;
export const SHARED_INTELLIGENCE_ONTOLOGY_ID = "mod_shared-intelligence";
export const SHARED_INTELLIGENCE_ONTOLOGY_VERSION = 1;
const TEMPORAL_LABELS = new Set(["current", "historical", "stale", "superseded"]);
const CAUSAL_LABELS = new Set(["not_claimed", "observed_association", "causal_hypothesis", "causal_supported"]);
const APPLICABILITY_KINDS = Object.freeze({
    domain: "domain",
    brain: "brain",
    company: "company",
    project: "project",
    task: "agencyTask",
    condition: "condition"
});
function assertNonBlankUnique(values, label) {
    if (values.length === 0)
        throw new Error(`${label} is required`);
    const normalized = values.map((value) => value.trim());
    if (normalized.some((value) => value.length === 0))
        throw new Error(`${label} cannot contain blank entries`);
    if (new Set(normalized).size !== normalized.length)
        throw new Error(`${label} entries must be unique`);
}
function assertTimestamp(value, label) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed))
        throw new Error(`Invalid ${label}: ${value}`);
    return parsed;
}
export function intelligenceScopeKey(applicability) {
    return applicability.scope === "global" ? "global" : `${applicability.scope}:${applicability.ref ?? ""}`;
}
function assertApplicability(applicability) {
    if (applicability.scope === "global") {
        if (applicability.ref !== undefined)
            throw new Error("Global applicability cannot carry a scoped reference");
        return;
    }
    if (!applicability.ref)
        throw new Error(`${applicability.scope} applicability requires a canonical reference`);
    assertIdentifierKind(applicability.ref, APPLICABILITY_KINDS[applicability.scope]);
}
function assertPrivacyBoundary(boundary, applicability) {
    if (!boundary.ownerId.trim())
        throw new Error("Privacy owner is required");
    if (applicability.scope === "global" && boundary.classification !== "ecosystem_shared") {
        throw new Error("Global intelligence must be explicitly ecosystem_shared");
    }
    switch (boundary.classification) {
        case "ecosystem_shared":
        case "owner_private":
        case "quarantined":
            if (boundary.scopeRef !== undefined)
                throw new Error(`${boundary.classification} cannot carry a privacy scope reference`);
            break;
        case "domain_shared":
            if (!boundary.scopeRef)
                throw new Error("domain_shared intelligence requires a domain scope reference");
            assertIdentifierKind(boundary.scopeRef, "domain");
            break;
        case "company_private":
            if (!boundary.scopeRef)
                throw new Error("company_private intelligence requires a company scope reference");
            assertIdentifierKind(boundary.scopeRef, "company");
            break;
        case "project_private":
            if (!boundary.scopeRef)
                throw new Error("project_private intelligence requires a project scope reference");
            assertIdentifierKind(boundary.scopeRef, "project");
            break;
        default: {
            const neverBoundary = boundary.classification;
            throw new Error(`Unsupported privacy classification: ${String(neverBoundary)}`);
        }
    }
    if (boundary.classification === "company_private" && applicability.scope === "company" && boundary.scopeRef !== applicability.ref) {
        throw new Error("Company-private intelligence cannot cross its applicability company");
    }
    if (boundary.classification === "project_private" && applicability.scope === "project" && boundary.scopeRef !== applicability.ref) {
        throw new Error("Project-private intelligence cannot cross its applicability project");
    }
}
export function validateSharedIntelligenceEnvelope(envelope, context) {
    if (envelope.contractVersion !== SHARED_INTELLIGENCE_CONTRACT_VERSION)
        throw new Error("Incompatible shared intelligence contract version");
    const expectedOntologyId = context.ontologyId ?? SHARED_INTELLIGENCE_ONTOLOGY_ID;
    if (envelope.ontology.id !== expectedOntologyId)
        throw new Error("Incompatible shared intelligence ontology");
    assertIdentifierKind(envelope.ontology.id, "module");
    if (!Number.isInteger(envelope.ontology.version) || envelope.ontology.version < 1)
        throw new Error("Invalid ontology version");
    const minimum = context.minimumOntologyVersion ?? SHARED_INTELLIGENCE_ONTOLOGY_VERSION;
    const maximum = context.maximumOntologyVersion ?? SHARED_INTELLIGENCE_ONTOLOGY_VERSION;
    if (envelope.ontology.version < minimum || envelope.ontology.version > maximum)
        throw new Error("Unsupported shared intelligence ontology version");
    if (!envelope.claim.id.trim())
        throw new Error("Shared intelligence claim identity is required");
    parseIdentifier(envelope.claim.subjectId);
    if (!Number.isInteger(envelope.claim.version) || envelope.claim.version < 1)
        throw new Error("Invalid shared intelligence claim version");
    if (!Number.isFinite(envelope.claim.confidence) || envelope.claim.confidence < 0 || envelope.claim.confidence > 1)
        throw new Error("Invalid shared intelligence confidence");
    assertNonBlankUnique(envelope.claim.sourceRefs, "Knowledge provenance");
    assertNonBlankUnique(envelope.evidenceIds, "Canonical evidence");
    for (const evidenceId of envelope.evidenceIds)
        assertIdentifierKind(evidenceId, "evidence");
    if (envelope.epistemicLabel !== envelope.claim.kind)
        throw new Error("Epistemic label must match the canonical knowledge kind");
    if (!TEMPORAL_LABELS.has(envelope.temporalLabel))
        throw new Error(`Invalid temporal label: ${String(envelope.temporalLabel)}`);
    if (!CAUSAL_LABELS.has(envelope.causalLabel))
        throw new Error(`Invalid causal label: ${String(envelope.causalLabel)}`);
    const observedAt = assertTimestamp(envelope.claim.observedAt, "observedAt");
    const recordedAt = assertTimestamp(envelope.claim.recordedAt, "recordedAt");
    if (recordedAt < observedAt)
        throw new Error("Shared intelligence cannot be recorded before it was observed");
    if (envelope.claim.state === "superseded" && envelope.temporalLabel !== "superseded")
        throw new Error("Superseded claims require the superseded temporal label");
    if (envelope.temporalLabel === "superseded" && envelope.claim.state !== "superseded")
        throw new Error("The superseded temporal label requires a superseded claim");
    if (envelope.temporalLabel === "historical" && envelope.claim.kind !== "historical")
        throw new Error("Historical temporal labels require historical knowledge");
    if (envelope.temporalLabel === "stale") {
        if (!envelope.claim.staleAfter)
            throw new Error("Stale intelligence requires staleAfter");
        const staleAfter = assertTimestamp(envelope.claim.staleAfter, "staleAfter");
        if (context.now !== undefined && assertTimestamp(context.now, "validation time") < staleAfter)
            throw new Error("Intelligence is not stale at the validation time");
    }
    assertApplicability(envelope.applicability);
    if (!context.ownerId.trim() || envelope.privacy.ownerId !== context.ownerId)
        throw new Error("Unauthorized intelligence owner scope");
    assertPrivacyBoundary(envelope.privacy, envelope.applicability);
    const scopeKey = intelligenceScopeKey(envelope.applicability);
    if (!context.authorizedScopeKeys.includes(scopeKey))
        throw new Error(`Unauthorized intelligence applicability scope: ${scopeKey}`);
    return envelope;
}
//# sourceMappingURL=intelligence-contracts.js.map