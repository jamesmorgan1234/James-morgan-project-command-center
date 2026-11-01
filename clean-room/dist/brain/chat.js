/** Brain surface: portfolio context, roadmap comparison, compliance scan and guarded routing. */
export function buildPortfolioContext(projects, scope) {
    if (!scope.trim())
        throw new Error("Context requires a portfolio scope");
    const ids = projects.filter((project) => project.scope === scope).map((project) => project.id);
    if (ids.length === 0)
        throw new Error("Portfolio-scoped context cannot be empty");
    return Object.freeze(ids);
}
export function roadmapComparison(planned, actual) {
    const delivered = new Set(actual);
    const onTrack = planned.filter((item) => delivered.has(item));
    const behind = planned.filter((item) => !delivered.has(item));
    return Object.freeze({ onTrack: Object.freeze(onTrack), behind: Object.freeze(behind) });
}
export function complianceScan(requirements) {
    if (requirements.length === 0)
        throw new Error("A compliance scan requires requirements");
    const missing = requirements.filter((requirement) => !requirement.met).map((requirement) => requirement.id);
    return Object.freeze({ met: requirements.length - missing.length, missing: Object.freeze(missing) });
}
export function routeProtectedAction(action, viaSecurity) {
    if (action.protected && !viaSecurity)
        throw new Error("Protected actions must route through Security");
    return viaSecurity ? "security" : "direct";
}
export function assertNoSuggestionBypass(path) {
    if (path.to === "agent" && !path.approved)
        throw new Error("No hidden suggestion-to-Agent bypass");
}
export function actionPreview(action) {
    if (action.consequential && !action.previewed)
        throw new Error("Consequential actions require a preview");
}
//# sourceMappingURL=chat.js.map