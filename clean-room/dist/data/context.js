import { immutableJson } from "./canonical.js";
const SENSITIVITY_RANK = Object.freeze({ internal: 0, sensitive: 1, protected: 2, secret: 3 });
export function createContextSnapshot(input) {
    const now = Date.parse(input.createdAt);
    if (!["internal", "sensitive", "protected"].includes(input.maxSensitivity))
        throw new Error("Context exchange forbids secret or unsupported sensitivity ceilings");
    if (!Number.isFinite(now) || !input.id.trim() || !input.ownerId.trim() || !input.projectId.trim())
        throw new Error("Context identity and creation timestamp are required");
    if (input.requiredContractVersion !== undefined && (!Number.isSafeInteger(input.requiredContractVersion) || input.requiredContractVersion < 1))
        throw new Error("Context required contract version must be positive");
    if (input.minimumConfidence !== undefined && (!Number.isFinite(input.minimumConfidence) || input.minimumConfidence < 0 || input.minimumConfidence > 1))
        throw new Error("Context minimum confidence must be between 0 and 1");
    if (input.authorizedAuthorityRefs !== undefined && (input.authorizedAuthorityRefs.some((ref) => !ref.trim()) || new Set(input.authorizedAuthorityRefs).size !== input.authorizedAuthorityRefs.length))
        throw new Error("Context authority refs must be unique and nonblank");
    if (input.requiredApplicabilityRefs !== undefined && (input.requiredApplicabilityRefs.some((ref) => !ref.trim()) || new Set(input.requiredApplicabilityRefs).size !== input.requiredApplicabilityRefs.length))
        throw new Error("Context applicability refs must be unique and nonblank");
    if (new Set(input.sources.map((source) => source.id)).size !== input.sources.length)
        throw new Error("Context source identities must be unique");
    const allowed = input.sources.filter((source) => {
        if (source.ownerId !== input.ownerId)
            return false;
        if (source.projectId && source.projectId !== input.projectId)
            return false;
        if (source.companyId && source.companyId !== input.companyId)
            return false;
        if (source.accountId && source.accountId !== input.accountId)
            return false;
        if (source.environment && source.environment !== input.environment)
            return false;
        if (source.purpose && (!input.purpose || !source.purpose.includes(input.purpose)))
            return false;
        if (!source.id.trim() || !source.sourceRef.trim() || !Number.isSafeInteger(source.version) || source.version < 1)
            return false;
        if (source.contractVersion !== undefined && (!Number.isSafeInteger(source.contractVersion) || source.contractVersion < 1))
            return false;
        if (input.requiredContractVersion !== undefined && source.contractVersion !== input.requiredContractVersion)
            return false;
        if (source.authorityRef !== undefined && !source.authorityRef.trim())
            return false;
        if (input.authorizedAuthorityRefs !== undefined && (!source.authorityRef || !input.authorizedAuthorityRefs.includes(source.authorityRef)))
            return false;
        if (source.confidence !== undefined && (!Number.isFinite(source.confidence) || source.confidence < 0 || source.confidence > 1))
            return false;
        if (input.minimumConfidence !== undefined && (source.confidence === undefined || source.confidence < input.minimumConfidence))
            return false;
        if (source.lifecycle !== undefined && source.lifecycle !== "active")
            return false;
        if (source.entityId !== undefined && input.entityId !== undefined && source.entityId !== input.entityId)
            return false;
        if (source.subsystemId !== undefined && input.subsystemId !== undefined && source.subsystemId !== input.subsystemId)
            return false;
        if (source.applicabilityRefs !== undefined && (source.applicabilityRefs.some((ref) => !ref.trim()) || new Set(source.applicabilityRefs).size !== source.applicabilityRefs.length))
            return false;
        if (input.requiredApplicabilityRefs !== undefined && !input.requiredApplicabilityRefs.every((ref) => source.applicabilityRefs?.includes(ref)))
            return false;
        if (source.lineageRefs !== undefined && (source.lineageRefs.some((ref) => !ref.trim()) || new Set(source.lineageRefs).size !== source.lineageRefs.length))
            return false;
        if (source.retracted)
            return false;
        if (source.staleAfter !== undefined && (!Number.isFinite(Date.parse(source.staleAfter)) || now >= Date.parse(source.staleAfter)))
            return false;
        return SENSITIVITY_RANK[source.sensitivity] <= SENSITIVITY_RANK[input.maxSensitivity];
    }).map((source) => Object.freeze({
        ...source,
        ...(source.purpose !== undefined ? { purpose: Object.freeze([...source.purpose]) } : {}),
        ...(source.applicabilityRefs !== undefined ? { applicabilityRefs: Object.freeze([...source.applicabilityRefs]) } : {}),
        ...(source.lineageRefs !== undefined ? { lineageRefs: Object.freeze([...source.lineageRefs]) } : {}),
        value: immutableJson(source.value)
    }));
    return Object.freeze({
        id: input.id,
        ownerId: input.ownerId,
        projectId: input.projectId,
        createdAt: input.createdAt,
        maxSensitivity: input.maxSensitivity,
        ...(input.entityId !== undefined ? { entityId: input.entityId } : {}),
        ...(input.subsystemId !== undefined ? { subsystemId: input.subsystemId } : {}),
        ...(input.requiredContractVersion !== undefined ? { contractVersion: input.requiredContractVersion } : {}),
        sourceIds: Object.freeze(allowed.map((source) => source.id)),
        sources: Object.freeze(allowed)
    });
}
//# sourceMappingURL=context.js.map