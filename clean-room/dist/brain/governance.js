/** Brain governance: versioning, fact/idea separation and owner authority. */
export function promptVersion(version) {
    if (!/^v\d+\.\d+$/.test(version))
        throw new Error("Prompt and policy versions must be explicit");
    return version;
}
export function classifyStatement(statement) {
    if (!statement.text.trim())
        throw new Error("A statement requires text");
    return statement.kind;
}
export function assertNoSilentArchitectureMutation(change) {
    if (!change.approved)
        throw new Error("The Brain cannot silently mutate production architecture");
}
export function assertNoSilentOwnerDecision(decision) {
    if (!decision.ownerApproved)
        throw new Error("The Brain cannot silently create canonical owner decisions");
}
export function classifyAmbiguity(text) {
    if (!text.trim())
        throw new Error("A statement requires text");
    return /\bmaybe\b|\?|either\b/i.test(text) ? "ambiguous" : "clear";
}
export function rulesBeforeRecommendations(steps) {
    const firstRecommendation = steps.indexOf("recommend");
    const firstRule = steps.indexOf("rules");
    if (firstRule < 0)
        throw new Error("Brain rules must be evaluated");
    if (firstRecommendation >= 0 && firstRecommendation < firstRule)
        throw new Error("Brain rules must be evaluated before recommendations");
    return Object.freeze([...steps]);
}
export function ownerOverride(request) {
    return request.owner ? "allowed" : "refused";
}
//# sourceMappingURL=governance.js.map