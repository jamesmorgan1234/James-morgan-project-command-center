import { assuranceAtLeast } from "../security/types.js";
export function assertFinancialReadIsolation(envelope) {
    if (!envelope.ownerId.trim() || !envelope.subjectOwnerId.trim())
        throw new Error("Finance owner identity is required");
    if (envelope.ownerId !== envelope.subjectOwnerId)
        throw new Error("Finance owner boundary mismatch");
    if (!assuranceAtLeast(envelope.assurance, "passkey_uv"))
        throw new Error("Finance access requires passkey user verification or stronger");
    if (!envelope.scopes.includes("finance:read"))
        throw new Error("Finance read scope missing");
    if (envelope.contextDomain !== "finance")
        throw new Error("Finance data cannot be injected into unrelated context domain by default");
    if ((envelope.companyId ?? null) !== (envelope.resourceCompanyId ?? null))
        throw new Error("Finance company/personal isolation boundary mismatch");
    if (envelope.credentialRef !== undefined && !envelope.credentialRef.trim())
        throw new Error("Credential reference cannot be blank");
}
export function assertFinancialWriteIsolation(envelope) {
    assertFinancialReadIsolation(envelope);
    if (!envelope.scopes.includes("finance:write"))
        throw new Error("Finance write scope missing");
    if (!assuranceAtLeast(envelope.assurance, "fresh_passkey_uv"))
        throw new Error("Finance write requires fresh passkey verification");
}
function classes(values, label) {
    if (!Array.isArray(values) || values.some((value) => typeof value !== "string" || !value.trim()))
        throw new Error(`${label} contains an invalid data class`);
    return Object.freeze([...new Set(values.map((value) => value.trim()))]);
}
export function evaluateFinancialDataAccess(envelope, request) {
    assertFinancialReadIsolation(envelope);
    if (!["normal", "non_financial_compromise", "finance_containment"].includes(request.incidentState))
        throw new Error("Unknown finance incident state");
    if (!request.auditRef.trim())
        throw new Error("Finance access requires immutable audit reference");
    if (request.incidentState === "non_financial_compromise" && !envelope.scopes.includes("finance:incident:isolated-read"))
        throw new Error("Compromised non-financial domain is contained from finance data");
    if (request.incidentState === "finance_containment") {
        if (!assuranceAtLeast(envelope.assurance, "fresh_passkey_uv") || !envelope.scopes.includes("finance:incident:contained-read"))
            throw new Error("Finance containment requires fresh verified incident-read scope");
    }
    const requested = classes(request.requestedDataClasses, "Requested finance data classes");
    const allowed = new Set(classes(request.allowedDataClasses, "Allowed finance data classes"));
    const minimized = requested.filter((item) => allowed.has(item));
    if (minimized.length === 0)
        throw new Error("Finance context minimization produced no authorized data classes");
    return Object.freeze({
        allowed: true,
        dataClasses: Object.freeze(minimized),
        auditRef: request.auditRef,
        incidentState: request.incidentState,
        secretsExposed: false,
        credentialRefsExposed: Object.freeze([]),
        protectedActionAuthorized: false
    });
}
//# sourceMappingURL=isolation.js.map