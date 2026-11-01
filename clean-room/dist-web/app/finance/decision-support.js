function refs(values, label, requireOne = false) {
    if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim()))
        throw new Error(`${label} must contain nonblank references`);
    return Object.freeze([...new Set(values.map((value) => value.trim()))]);
}
function safeCents(value, label) {
    if (!Number.isSafeInteger(value))
        throw new Error(`${label} must use safe integer cents`);
}
export function evaluateFinancialDecisionScenario(input) {
    if (!input.id.trim() || !input.ownerId.trim() || !input.name.trim())
        throw new Error("Financial decision scenario identity/owner/name are required");
    if (!/^[A-Z]{3}$/.test(input.currency))
        throw new Error("Financial decision scenario currency must be three uppercase letters");
    if (!Number.isFinite(Date.parse(input.observedAt)))
        throw new Error("Financial decision scenario observedAt must be an ISO-compatible timestamp");
    if (!Array.isArray(input.inputs) || input.inputs.length === 0)
        throw new Error("Financial decision scenario requires inputs");
    const verified = [];
    const assumptions = [];
    const evidence = new Set();
    const assumptionRefs = new Set();
    const seen = new Set();
    let resulting = 0;
    let low = 0;
    let high = 0;
    for (const item of input.inputs) {
        if (!item.key.trim() || seen.has(item.key))
            throw new Error(`Financial decision input key must be nonblank and unique: ${item.key}`);
        seen.add(item.key);
        safeCents(item.cents, `Financial decision input ${item.key}`);
        const itemRefs = refs(item.evidenceRefs, `Financial decision input evidence ${item.key}`, item.source === "verified_current");
        resulting += item.cents;
        if (item.source === "verified_current") {
            verified.push(item.key);
            itemRefs.forEach((ref) => evidence.add(ref));
            low += item.cents;
            high += item.cents;
            if (item.sensitivity !== undefined)
                throw new Error(`Verified current input cannot carry sensitivity assumption: ${item.key}`);
        }
        else {
            assumptions.push(item.key);
            itemRefs.forEach((ref) => assumptionRefs.add(ref));
            if (!item.sensitivity) {
                low += item.cents;
                high += item.cents;
            }
            else {
                safeCents(item.sensitivity.lowCents, `Sensitivity low ${item.key}`);
                safeCents(item.sensitivity.highCents, `Sensitivity high ${item.key}`);
                if (item.sensitivity.lowCents > item.sensitivity.highCents)
                    throw new Error(`Sensitivity range is inverted: ${item.key}`);
                if (item.cents < item.sensitivity.lowCents || item.cents > item.sensitivity.highCents)
                    throw new Error(`Scenario point is outside sensitivity range: ${item.key}`);
                low += item.sensitivity.lowCents;
                high += item.sensitivity.highCents;
            }
        }
    }
    return Object.freeze({
        id: input.id,
        ownerId: input.ownerId,
        name: input.name,
        currency: input.currency,
        resultingCents: resulting,
        lowSensitivityCents: low,
        highSensitivityCents: high,
        verifiedInputKeys: Object.freeze(verified),
        assumptionKeys: Object.freeze(assumptions),
        evidenceRefs: Object.freeze([...evidence]),
        assumptionRefs: Object.freeze([...assumptionRefs]),
        goalRefs: refs(input.goalRefs, "Financial decision goalRefs"),
        budgetRefs: refs(input.budgetRefs, "Financial decision budgetRefs"),
        debtRefs: refs(input.debtRefs, "Financial decision debtRefs"),
        cashflowRefs: refs(input.cashflowRefs, "Financial decision cashflowRefs"),
        scoreForecast: null,
        outcomePromise: false,
        protectedActionAuthorized: false
    });
}
export function buildFinancialDecisionRecommendation(title, rationale, scenario, additionalEvidenceRefs = []) {
    if (!title.trim() || !rationale.trim())
        throw new Error("Financial recommendation requires title and rationale");
    const evidenceRefs = Object.freeze([...new Set([...scenario.evidenceRefs, ...refs(additionalEvidenceRefs, "Financial recommendation evidence")])]);
    if (evidenceRefs.length === 0)
        throw new Error("Financial recommendation requires verified evidence");
    return Object.freeze({ title, rationale, evidenceRefs, assumptionRefs: scenario.assumptionRefs, scenarioRef: scenario.id, scoreForecast: null, outcomePromise: false, protectedActionAuthorized: false });
}
//# sourceMappingURL=decision-support.js.map