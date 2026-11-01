import { parseTimestamp } from "../security/types.js";
export function validateCreditScoreFact(fact) {
    if (!fact.provider.trim() || !fact.model.trim() || !fact.sourceRef.trim())
        throw new Error("Credit fact provider/model/source are required");
    if (!Number.isSafeInteger(fact.score) || fact.score < 0 || fact.score > 1000)
        throw new Error("Credit score value is outside supported factual bounds");
    parseTimestamp(`${fact.reportDate}T00:00:00Z`, "reportDate");
}
export function recommendFromFactors(title, rationale, factors) {
    if (!title.trim() || !rationale.trim() || factors.length === 0)
        throw new Error("Credit recommendation requires title/rationale/factor evidence");
    return Object.freeze({ title, rationale, factorRefs: Object.freeze(factors.map((factor) => factor.evidenceRef)), scoreForecast: null });
}
function nonblank(value, label) {
    const normalized = value.trim();
    if (!normalized)
        throw new Error(`${label} is required`);
    return normalized;
}
function refs(values, label) {
    if (!Array.isArray(values) || values.length === 0 || values.some((value) => typeof value !== "string" || !value.trim()))
        throw new Error(`${label} must contain nonblank references`);
    return Object.freeze([...new Set(values.map((value) => value.trim()))]);
}
function validateIdentity(identity) {
    nonblank(identity.provider, "Credit provider");
    nonblank(identity.model, "Credit model");
    nonblank(identity.reportId, "Credit report id");
    parseTimestamp(`${identity.reportDate}T00:00:00Z`, "Credit report date");
}
function sameIdentity(left, right) {
    return left.provider === right.provider && left.model === right.model && left.reportDate === right.reportDate && left.reportId === right.reportId;
}
export function calculateCreditUtilizationBasisPoints(balanceCents, creditLimitCents) {
    if (balanceCents === undefined || creditLimitCents === undefined || creditLimitCents <= 0)
        return undefined;
    if (!Number.isSafeInteger(balanceCents) || !Number.isSafeInteger(creditLimitCents))
        throw new Error("Credit utilization requires safe integer cents");
    return Math.round((Math.max(0, balanceCents) * 10000) / creditLimitCents);
}
export function createCanonicalCreditScoreFact(input) {
    validateIdentity(input);
    nonblank(input.ownerId, "Credit ownerId");
    parseTimestamp(input.observedAt, "Credit score observedAt");
    if (!Number.isSafeInteger(input.score) || input.score < 0 || input.score > 1000)
        throw new Error("Credit score value is outside supported factual bounds");
    return Object.freeze({ ...input, sourceRefs: refs(input.sourceRefs, "Credit score sourceRefs"), protectedActionAuthorized: false });
}
export function createCanonicalCreditFactor(input) {
    validateIdentity(input);
    nonblank(input.ownerId, "Credit factor ownerId");
    nonblank(input.key, "Credit factor key");
    parseTimestamp(input.observedAt, "Credit factor observedAt");
    return Object.freeze({ ...input, evidenceRefs: refs(input.evidenceRefs, "Credit factor evidenceRefs"), protectedActionAuthorized: false });
}
export function createCreditReportAccount(input) {
    validateIdentity(input);
    nonblank(input.ownerId, "Credit account ownerId");
    nonblank(input.accountRef, "Credit account ref");
    nonblank(input.creditorName, "Credit creditor name");
    parseTimestamp(input.observedAt, "Credit account observedAt");
    if (input.balanceCents !== undefined && !Number.isSafeInteger(input.balanceCents))
        throw new Error("Credit balance must be safe integer cents");
    if (input.creditLimitCents !== undefined && (!Number.isSafeInteger(input.creditLimitCents) || input.creditLimitCents < 0))
        throw new Error("Credit limit must be nonnegative safe integer cents");
    const calculated = calculateCreditUtilizationBasisPoints(input.balanceCents, input.creditLimitCents);
    if (input.utilizationBasisPoints !== undefined && input.utilizationBasisPoints !== calculated)
        throw new Error("Credit utilization must match balance/limit truth");
    return Object.freeze({ ...input, utilizationBasisPoints: calculated, evidenceRefs: refs(input.evidenceRefs, "Credit account evidenceRefs"), protectedActionAuthorized: false });
}
export function createCreditReportSnapshot(input) {
    validateIdentity(input);
    nonblank(input.ownerId, "Credit snapshot ownerId");
    parseTimestamp(input.observedAt, "Credit snapshot observedAt");
    const assertChild = (child) => {
        if (child.ownerId !== input.ownerId || !sameIdentity(child, input))
            throw new Error("Credit report child identity mismatch");
    };
    input.scoreFacts.forEach(assertChild);
    input.factors.forEach(assertChild);
    input.accounts.forEach(assertChild);
    return Object.freeze({
        ...input,
        scoreFacts: Object.freeze([...input.scoreFacts]),
        factors: Object.freeze([...input.factors]),
        accounts: Object.freeze([...input.accounts]),
        sourceRefs: refs(input.sourceRefs, "Credit snapshot sourceRefs"),
        protectedActionAuthorized: false
    });
}
export function assertCreditDataIsolation(context) {
    if (context.ownerId !== context.subjectOwnerId)
        throw new Error("Credit owner boundary mismatch");
    if (context.contextDomain !== "finance:credit")
        throw new Error("Credit data cannot enter unrelated context domain");
    if (!context.scopes.includes("finance:credit:read"))
        throw new Error("Credit read scope missing");
}
export function assessCreditRefresh(report, now, maxAgeMs) {
    validateIdentity(report);
    const nowMs = parseTimestamp(now, "Credit refresh now");
    const observedMs = parseTimestamp(report.observedAt, "Credit refresh observedAt");
    if (!Number.isSafeInteger(maxAgeMs) || maxAgeMs < 0)
        throw new Error("Credit refresh maxAgeMs must be nonnegative safe integer");
    if (observedMs > nowMs)
        throw new Error("Credit report observation cannot be in the future");
    if (report.refreshState === "pending" || report.refreshState === "unavailable")
        return report.refreshState;
    return nowMs - observedMs > maxAgeMs ? "stale" : "fresh";
}
//# sourceMappingURL=credit.js.map