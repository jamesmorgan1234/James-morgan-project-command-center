export function validateBrainPlan(plan) {
    if (!plan.id.trim() || !plan.objective.trim())
        throw new Error("Plan id/objective are required");
    for (const claim of plan.claims) {
        if (!claim.id.trim() || !claim.statement.trim())
            throw new Error("Planning claim identity/statement are required");
        if (["verified_fact", "owner_decision"].includes(claim.class) && claim.evidenceRefs.length === 0)
            throw new Error(`${claim.class} requires evidence`);
        if (["assumption", "estimate", "recommendation"].includes(claim.class) && claim.confidence === undefined)
            throw new Error(`${claim.class} requires confidence`);
        if (claim.confidence !== undefined && (!Number.isFinite(claim.confidence) || claim.confidence < 0 || claim.confidence > 1))
            throw new Error("Claim confidence must be 0..1");
    }
}
function uniqueNonblank(values, label, requireOne = false) {
    const actual = values ?? [];
    if (requireOne && actual.length === 0)
        throw new Error(`${label} requires at least one value`);
    if (actual.some((value) => !value.trim()) || new Set(actual).size !== actual.length)
        throw new Error(`${label} must be unique and nonblank`);
    return Object.freeze([...actual]);
}
/**
 * P6.5 scenario truth contract. Observations, assumptions, simulations, counterfactuals,
 * and causal claims remain distinct so synthetic reasoning cannot masquerade as observed reality.
 */
export function validateScenarioAnalysis(analysis) {
    if (!analysis.id.trim() || !analysis.objective.trim() || analysis.statements.length === 0)
        throw new Error("Scenario analysis identity/objective/statements are required");
    const ids = new Set();
    const statements = analysis.statements.map((statement) => {
        if (!statement.id.trim() || !statement.statement.trim() || ids.has(statement.id))
            throw new Error("Scenario statements require distinct identity and text");
        ids.add(statement.id);
        const evidenceRefs = uniqueNonblank(statement.evidenceRefs, "Scenario evidence", statement.class === "observed_fact" || statement.class === "causal_claim");
        if (statement.confidence !== undefined && (!Number.isFinite(statement.confidence) || statement.confidence < 0 || statement.confidence > 1))
            throw new Error("Scenario confidence must be 0..1");
        if (statement.class !== "observed_fact" && statement.confidence === undefined)
            throw new Error(`${statement.class} requires explicit confidence`);
        const assumptions = uniqueNonblank(statement.assumptions, "Scenario assumptions", statement.class === "simulation" || statement.class === "counterfactual");
        const causalBasisRefs = uniqueNonblank(statement.causalBasisRefs, "Scenario causal basis", statement.class === "causal_claim");
        const sensitivity = Object.freeze((statement.sensitivity ?? []).map((item) => {
            if (!item.variable.trim() || !["increase", "decrease", "nonlinear", "unknown"].includes(item.direction))
                throw new Error("Scenario sensitivity requires variable and direction");
            if (item.magnitude !== undefined && !Number.isFinite(item.magnitude))
                throw new Error("Scenario sensitivity magnitude must be finite");
            return Object.freeze({ ...item });
        }));
        if ((statement.class === "simulation" || statement.class === "counterfactual") && sensitivity.length === 0)
            throw new Error(`${statement.class} requires sensitivity analysis`);
        if (statement.class !== "causal_claim" && causalBasisRefs.length > 0)
            throw new Error("Only causal claims may carry causal basis references");
        return Object.freeze({
            ...statement,
            evidenceRefs,
            ...(assumptions.length > 0 ? { assumptions } : {}),
            ...(sensitivity.length > 0 ? { sensitivity } : {}),
            ...(causalBasisRefs.length > 0 ? { causalBasisRefs } : {})
        });
    });
    return Object.freeze({ ...analysis, statements: Object.freeze(statements) });
}
//# sourceMappingURL=planning.js.map