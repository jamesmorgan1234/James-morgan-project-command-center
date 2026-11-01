const PRIVACY_RANK = Object.freeze({ local: 0, private_remote: 1, remote: 2 });
function validateOptionalRefs(values, label) {
    if (values === undefined)
        return;
    if (values.some((value) => !value.trim()) || new Set(values).size !== values.length)
        throw new Error(`${label} must be unique and nonblank`);
}
function routeSupportsContext(route, request) {
    if (request.brainKey !== undefined && !(route.brainKeys ?? []).includes(request.brainKey))
        return false;
    if (request.methodId !== undefined && !(route.methodIds ?? []).includes(request.methodId))
        return false;
    if (request.toolKey !== undefined && !(route.toolKeys ?? []).includes(request.toolKey))
        return false;
    if ((request.requiredPolicyRefs ?? []).some((ref) => !(route.policyRefs ?? []).includes(ref)))
        return false;
    if (request.requireEvidence === true && (route.evidenceRefs ?? []).length === 0)
        return false;
    if (request.minimumCalibration !== undefined && (route.calibrationScore === undefined || route.calibrationScore < request.minimumCalibration))
        return false;
    return true;
}
function freezeRoute(route) {
    return Object.freeze({
        ...route,
        capabilities: Object.freeze([...route.capabilities]),
        ...(route.brainKeys !== undefined ? { brainKeys: Object.freeze([...route.brainKeys]) } : {}),
        ...(route.methodIds !== undefined ? { methodIds: Object.freeze([...route.methodIds]) } : {}),
        ...(route.toolKeys !== undefined ? { toolKeys: Object.freeze([...route.toolKeys]) } : {}),
        ...(route.policyRefs !== undefined ? { policyRefs: Object.freeze([...route.policyRefs]) } : {}),
        ...(route.evidenceRefs !== undefined ? { evidenceRefs: Object.freeze([...route.evidenceRefs]) } : {}),
        ...(route.fallbackRouteKeys !== undefined ? { fallbackRouteKeys: Object.freeze([...route.fallbackRouteKeys]) } : {})
    });
}
export class AiRouteRegistry {
    #routes = new Map();
    register(route) {
        if (!route.key.startsWith("ai-route:") || !route.providerKey.trim() || !route.modelId.trim() || !route.versionRef.trim())
            throw new Error("AI route identity/provider/model/version are required");
        if (!["local", "self_hosted", "remote", "hybrid"].includes(route.executionMode))
            throw new Error("AI route execution mode is invalid");
        if (!Number.isFinite(route.qualityRank) || !Number.isFinite(route.latencyRank))
            throw new Error("AI route ranks must be finite");
        if (route.contextWindowTokens !== undefined && route.contextWindowTokens !== "unknown" && (!Number.isSafeInteger(route.contextWindowTokens) || route.contextWindowTokens < 1))
            throw new Error("AI route context window must be a positive safe integer or unknown");
        if (route.calibrationScore !== undefined && (!Number.isFinite(route.calibrationScore) || route.calibrationScore < 0 || route.calibrationScore > 1))
            throw new Error("AI route calibration must be 0..1");
        validateOptionalRefs(route.brainKeys, "AI route brain keys");
        validateOptionalRefs(route.methodIds, "AI route method ids");
        validateOptionalRefs(route.toolKeys, "AI route tool keys");
        validateOptionalRefs(route.policyRefs, "AI route policy refs");
        validateOptionalRefs(route.evidenceRefs, "AI route evidence refs");
        validateOptionalRefs(route.fallbackRouteKeys, "AI route fallback keys");
        if ((route.fallbackRouteKeys ?? []).includes(route.key))
            throw new Error("AI route cannot fall back to itself");
        if (this.#routes.has(route.key))
            throw new Error(`AI route already exists: ${route.key}`);
        this.#routes.set(route.key, freezeRoute(route));
    }
    remove(key) {
        const route = this.#routes.get(key);
        if (!route)
            throw new Error(`Unknown AI route: ${key}`);
        this.#routes.delete(key);
        return route;
    }
    route(request) {
        if (request.minimumContextTokens !== undefined && (!Number.isSafeInteger(request.minimumContextTokens) || request.minimumContextTokens < 1))
            throw new Error("Minimum context tokens must be a positive safe integer");
        if (request.minimumCalibration !== undefined && (!Number.isFinite(request.minimumCalibration) || request.minimumCalibration < 0 || request.minimumCalibration > 1))
            throw new Error("Minimum calibration must be 0..1");
        validateOptionalRefs(request.requiredPolicyRefs, "Required routing policy refs");
        const eligible = [...this.#routes.values()].filter((route) => route.enabled && route.health !== "unavailable" && route.capabilities.includes(request.capability) && (request.allowPaid || route.cost !== "paid") && PRIVACY_RANK[route.privacy] <= PRIVACY_RANK[request.maxPrivacy] && route.quotaAvailable !== false && (request.minimumContextTokens === undefined || (typeof route.contextWindowTokens === "number" && route.contextWindowTokens >= request.minimumContextTokens)) && routeSupportsContext(route, request));
        eligible.sort((a, b) => request.preferQuality ? b.qualityRank - a.qualityRank || a.latencyRank - b.latencyRank : a.latencyRank - b.latencyRank || b.qualityRank - a.qualityRank);
        return eligible[0];
    }
    fallbackFor(routeKey, request) {
        const primary = this.#routes.get(routeKey);
        if (!primary)
            throw new Error(`Unknown AI route: ${routeKey}`);
        for (const fallbackKey of primary.fallbackRouteKeys ?? []) {
            const fallback = this.#routes.get(fallbackKey);
            if (!fallback)
                continue;
            const eligible = fallback.enabled && fallback.health !== "unavailable" && fallback.capabilities.includes(request.capability) && (request.allowPaid || fallback.cost !== "paid") && PRIVACY_RANK[fallback.privacy] <= PRIVACY_RANK[request.maxPrivacy] && fallback.quotaAvailable !== false && (request.minimumContextTokens === undefined || (typeof fallback.contextWindowTokens === "number" && fallback.contextWindowTokens >= request.minimumContextTokens)) && routeSupportsContext(fallback, request);
            if (eligible)
                return fallback;
        }
        return undefined;
    }
    list() { return Object.freeze([...this.#routes.values()]); }
}
//# sourceMappingURL=providers.js.map