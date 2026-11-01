export const FINANCIAL_ACTION_KINDS = ["transfer", "payment", "trade", "open_account", "close_account", "change_autopay", "cancel_subscription", "purchase", "account_change"];
const AMOUNT_SCOPED_FINANCIAL_ACTIONS = ["transfer", "payment", "trade", "purchase"];
export function assertFinancialActionAuthorized(intent) {
    if (!FINANCIAL_ACTION_KINDS.includes(intent.kind))
        throw new Error("Unknown financial action kind");
    if (!intent.id.trim() || !intent.ownerId.trim() || !intent.exactOwnerAuthorizationRef.trim())
        throw new Error("Financial action requires exact owner authorization evidence");
    if (intent.accountRefs.length === 0 || intent.accountRefs.some(ref => !ref.trim()) || new Set(intent.accountRefs).size !== intent.accountRefs.length)
        throw new Error("Financial action requires scoped account references");
    if (intent.providerHealthVerified !== true)
        throw new Error("Financial provider health must be verified immediately before action");
    if (intent.duplicateSideEffectChecked !== true)
        throw new Error("Financial duplicate-side-effect reconciliation is required");
    if (AMOUNT_SCOPED_FINANCIAL_ACTIONS.includes(intent.kind) && intent.amountCents === undefined)
        throw new Error("Money-moving financial action requires exact amount scope");
    if (intent.amountCents !== undefined && (!Number.isSafeInteger(intent.amountCents) || intent.amountCents <= 0))
        throw new Error("Financial action amount must be positive safe cents");
}
function time(value, label) {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed))
        throw new Error(`${label} must be an ISO-compatible timestamp`);
    return parsed;
}
function sameRefs(left, right) {
    return left.length === right.length && [...left].sort().every((value, index) => value === [...right].sort()[index]);
}
export function authorizeFinancialActionExecution(intent, grant, context) {
    assertFinancialActionAuthorized(intent);
    if (!intent.providerKey.startsWith("finance-provider:") || !intent.providerKey.slice("finance-provider:".length).trim() || !intent.intentHash.trim())
        throw new Error("Financial action requires provider and exact intent hash");
    const createdAt = time(intent.createdAt, "Financial action createdAt");
    const now = time(context.now, "Financial action execution now");
    const authorizedAt = time(grant.authorizedAt, "Financial authorization authorizedAt");
    const expiresAt = time(grant.expiresAt, "Financial authorization expiresAt");
    const healthAt = time(context.providerHealthObservedAt, "Financial provider health observedAt");
    if (!Number.isSafeInteger(context.maxProviderHealthAgeMs) || context.maxProviderHealthAgeMs < 0)
        throw new Error("Financial provider health age policy is invalid");
    if (createdAt > now || authorizedAt > now)
        throw new Error("Financial action/authorization cannot originate in the future");
    if (authorizedAt < createdAt)
        throw new Error("Financial authorization cannot predate its exact action intent");
    if (expiresAt <= now)
        throw new Error("Financial authorization is stale or expired");
    if (authorizedAt > expiresAt)
        throw new Error("Financial authorization lifetime is invalid");
    if (grant.consumed === true)
        throw new Error("Financial one-time authorization has already been consumed");
    if (grant.consumed !== false)
        throw new Error("Financial authorization consumption state is unknown");
    if (grant.ownerId !== intent.ownerId || grant.actionKind !== intent.kind || grant.providerKey !== intent.providerKey || grant.intentHash !== intent.intentHash || !sameRefs(grant.accountRefs, intent.accountRefs) || grant.amountCents !== intent.amountCents)
        throw new Error("Financial authorization scope does not exactly match action intent");
    if (grant.authorizationRef !== intent.exactOwnerAuthorizationRef)
        throw new Error("Financial authorization reference does not match exact owner authorization evidence");
    if (grant.assurance !== "fresh_passkey_uv" || grant.oneTime !== true)
        throw new Error("Financial action requires fresh one-time passkey authorization");
    if (grant.evidenceRefs.length === 0 || grant.evidenceRefs.some((ref) => !ref.trim()) || new Set(grant.evidenceRefs).size !== grant.evidenceRefs.length)
        throw new Error("Financial authorization evidence is required");
    if (context.providerHealth !== "available" || now - healthAt > context.maxProviderHealthAgeMs || healthAt > now)
        throw new Error("Financial provider health is unavailable, degraded, stale, or invalid");
    if (context.duplicateSideEffectChecked !== true || intent.duplicateSideEffectChecked !== true)
        throw new Error("Financial duplicate-side-effect reconciliation is required");
    if (context.priorExecutionRefs.length > 0)
        throw new Error("Financial action already has execution evidence");
    if (intent.source !== "owner_request")
        throw new Error("Analysis, recommendation, or automation cannot itself authorize money movement");
    return Object.freeze({
        intentId: intent.id, ownerId: intent.ownerId, actionKind: intent.kind, providerKey: intent.providerKey,
        accountRefs: Object.freeze([...intent.accountRefs]), amountCents: intent.amountCents, authorizationRef: grant.authorizationRef,
        intentHash: intent.intentHash, executionAuthorized: true, oneTime: true, protectedActionAuthorized: true,
        evidenceRefs: Object.freeze([...grant.evidenceRefs])
    });
}
//# sourceMappingURL=actions.js.map