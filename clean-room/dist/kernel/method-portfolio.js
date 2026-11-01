import { assertIdentifierKind } from "./identifiers.js";
import { Registry } from "./registry.js";
const PRIVACY_RANK = Object.freeze({ local: 0, private_remote: 1, remote: 2 });
const SENSITIVITY_RANK = Object.freeze({ internal: 0, sensitive: 1, protected: 2, secret: 3 });
const RESOURCE_RANK = Object.freeze({ low: 0, medium: 1, high: 2 });
function assertUniqueNonBlank(values, label, requireOne = false) {
    if (requireOne && values.length === 0)
        throw new Error(`${label} requires at least one value`);
    const normalized = values.map((value) => value.trim());
    if (normalized.some((value) => !value))
        throw new Error(`${label} cannot contain blank values`);
    if (new Set(normalized).size !== normalized.length)
        throw new Error(`${label} must be unique`);
}
function assertScore(value, label) {
    if (!Number.isFinite(value) || value < 0 || value > 1)
        throw new Error(`${label} must be between 0 and 1`);
}
function parseTime(value, label) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed))
        throw new Error(`Invalid ${label}: ${value}`);
    return parsed;
}
function assertEvidenceIds(values, label, requireOne = false) {
    assertUniqueNonBlank(values, label, requireOne);
    for (const id of values)
        assertIdentifierKind(id, "evidence");
}
export function validateCapabilityMethodContract(method) {
    assertIdentifierKind(method.key, "method");
    if (!method.capabilityKey.startsWith("capability:") || !method.capabilityKey.slice("capability:".length).trim())
        throw new Error("Method capabilityKey must identify an existing capability contract");
    if (!method.implementationVersionRef.trim())
        throw new Error("Method implementationVersionRef is required");
    assertUniqueNonBlank(method.applicabilityScopeKeys, `${method.key}.applicabilityScopeKeys`, true);
    assertUniqueNonBlank(method.contraindications, `${method.key}.contraindications`);
    assertUniqueNonBlank(method.prerequisites, `${method.key}.prerequisites`);
    assertScore(method.qualityScore, `${method.key}.qualityScore`);
    assertScore(method.calibrationScore, `${method.key}.calibrationScore`);
    assertScore(method.securityAssurance, `${method.key}.securityAssurance`);
    assertScore(method.reliabilityScore, `${method.key}.reliabilityScore`);
    if (!Number.isSafeInteger(method.latencyMs) || method.latencyMs < 0)
        throw new Error(`${method.key}.latencyMs must be a non-negative safe integer`);
    assertEvidenceIds(method.benchmarkEvidenceIds, `${method.key}.benchmarkEvidenceIds`, true);
    assertEvidenceIds(method.outcomeEvidenceIds, `${method.key}.outcomeEvidenceIds`, method.lifecycle === "active");
    assertEvidenceIds(method.provenanceEvidenceIds, `${method.key}.provenanceEvidenceIds`, true);
    assertIdentifierKind(method.rollbackEvidenceId, "evidence");
    assertUniqueNonBlank(method.fallbackMethodIds, `${method.key}.fallbackMethodIds`);
    for (const fallbackId of method.fallbackMethodIds) {
        assertIdentifierKind(fallbackId, "method");
        if (fallbackId === method.key)
            throw new Error("A method cannot fall back to itself");
    }
    const revalidatedAt = parseTime(method.revalidatedAt, `${method.key}.revalidatedAt`);
    const revalidateAfter = parseTime(method.revalidateAfter, `${method.key}.revalidateAfter`);
    if (revalidateAfter <= revalidatedAt)
        throw new Error("Method revalidation window must advance");
    if ((method.lifecycle === "deprecated" || method.lifecycle === "retired") && method.enabled)
        throw new Error("Deprecated or retired methods cannot remain enabled");
}
function frozenMethod(method) {
    return Object.freeze({
        ...method,
        applicabilityScopeKeys: Object.freeze([...method.applicabilityScopeKeys]),
        contraindications: Object.freeze([...method.contraindications]),
        prerequisites: Object.freeze([...method.prerequisites]),
        benchmarkEvidenceIds: Object.freeze([...method.benchmarkEvidenceIds]),
        outcomeEvidenceIds: Object.freeze([...method.outcomeEvidenceIds]),
        provenanceEvidenceIds: Object.freeze([...method.provenanceEvidenceIds]),
        fallbackMethodIds: Object.freeze([...method.fallbackMethodIds])
    });
}
function isEligible(method, request) {
    if (!method.enabled || method.capabilityKey !== request.capabilityKey)
        return false;
    if (method.lifecycle === "retired" || method.lifecycle === "deprecated")
        return false;
    if (method.lifecycle === "experimental" && !request.allowExperimental)
        return false;
    if (method.costClass === "paid" && !request.allowPaid)
        return false;
    if (PRIVACY_RANK[method.privacyClass] > PRIVACY_RANK[request.maxPrivacy])
        return false;
    if (SENSITIVITY_RANK[request.dataSensitivity] > SENSITIVITY_RANK[method.maxDataSensitivity])
        return false;
    if (RESOURCE_RANK[method.resourceClass] > RESOURCE_RANK[request.maxResourceClass])
        return false;
    if (parseTime(request.now, "routing now") > parseTime(method.revalidateAfter, `${method.key}.revalidateAfter`))
        return false;
    if (!method.applicabilityScopeKeys.includes("global") && !method.applicabilityScopeKeys.some((scope) => request.scopeKeys.includes(scope)))
        return false;
    if (method.contraindications.some((condition) => request.conditions.includes(condition)))
        return false;
    if (method.prerequisites.some((prerequisite) => !request.availablePrerequisites.includes(prerequisite)))
        return false;
    return true;
}
function balancedScore(method) {
    const latencyPenalty = Math.min(method.latencyMs / 10000, 1);
    return method.qualityScore * 0.35 + method.calibrationScore * 0.2 + method.reliabilityScore * 0.3 + method.securityAssurance * 0.15 - latencyPenalty * 0.1;
}
function compareMethods(a, b, optimization) {
    if (optimization === "quality")
        return b.qualityScore - a.qualityScore || b.calibrationScore - a.calibrationScore || b.reliabilityScore - a.reliabilityScore || a.latencyMs - b.latencyMs || a.key.localeCompare(b.key);
    if (optimization === "latency")
        return a.latencyMs - b.latencyMs || b.reliabilityScore - a.reliabilityScore || b.qualityScore - a.qualityScore || a.key.localeCompare(b.key);
    if (optimization === "reliability")
        return b.reliabilityScore - a.reliabilityScore || b.calibrationScore - a.calibrationScore || b.qualityScore - a.qualityScore || a.key.localeCompare(b.key);
    return balancedScore(b) - balancedScore(a) || a.key.localeCompare(b.key);
}
export class CapabilityMethodPortfolio {
    #registry = new Registry();
    register(method) {
        validateCapabilityMethodContract(method);
        this.#registry.register(frozenMethod(method));
    }
    replace(method, expectedVersion) {
        validateCapabilityMethodContract(method);
        this.#registry.replace(frozenMethod(method), expectedVersion);
    }
    get(methodId) { return this.#registry.get(methodId); }
    list() { return this.#registry.list(); }
    methodsFor(capabilityKey) {
        return Object.freeze(this.#registry.list().filter((method) => method.capabilityKey === capabilityKey));
    }
    route(request) {
        const eligible = this.methodsFor(request.capabilityKey).filter((method) => isEligible(method, request));
        eligible.sort((a, b) => compareMethods(a, b, request.optimization));
        return eligible[0];
    }
    fallbackFor(methodId, request) {
        const current = this.#registry.get(methodId);
        if (!current)
            throw new Error(`Unknown method: ${methodId}`);
        const eligible = current.fallbackMethodIds
            .map((id) => this.#registry.get(id))
            .filter((method) => method !== undefined && isEligible(method, request));
        eligible.sort((a, b) => compareMethods(a, b, request.optimization));
        return eligible[0];
    }
}
//# sourceMappingURL=method-portfolio.js.map