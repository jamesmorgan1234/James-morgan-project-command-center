const WATCH_KINDS = new Set(["condition", "event", "webhook", "project_state"]);
function timestamp(value, label) { const parsed = Date.parse(value); if (!Number.isFinite(parsed))
    throw new Error(`${label} must be a valid timestamp`); return parsed; }
function normalizeWatchKind(value, label) {
    const normalized = value ?? "condition";
    if (!WATCH_KINDS.has(normalized))
        throw new Error(`${label} must be condition, event, webhook, or project_state`);
    return normalized;
}
export function nextWatchBackoffUntil(failedAt, consecutiveFailures, baseSeconds = 60, maxSeconds = 3600) {
    const failed = timestamp(failedAt, "Watch failure time");
    if (!Number.isSafeInteger(consecutiveFailures) || consecutiveFailures < 1)
        throw new Error("Watch consecutiveFailures must be positive");
    if (!Number.isFinite(baseSeconds) || baseSeconds <= 0 || !Number.isFinite(maxSeconds) || maxSeconds < baseSeconds)
        throw new Error("Watch backoff bounds are invalid");
    const seconds = Math.min(maxSeconds, baseSeconds * (2 ** Math.min(consecutiveFailures - 1, 30)));
    return new Date(failed + seconds * 1000).toISOString();
}
export function evaluateWatch(watch, observation) {
    if (observation.watchId !== watch.id)
        throw new Error("Watch observation identity mismatch");
    const watchKind = normalizeWatchKind(watch.watchKind, "Watch kind");
    const observationKind = normalizeWatchKind(observation.watchKind ?? watchKind, "Watch observation kind");
    if (observationKind !== watchKind)
        throw new Error("Watch observation kind mismatch");
    if (observation.observationId !== undefined && !observation.observationId.trim())
        throw new Error("Watch observationId must be nonblank when supplied");
    if (observation.observedAt !== undefined)
        timestamp(observation.observedAt, "Watch observedAt");
    if (watch.lastVerifiedObservedAt !== undefined)
        timestamp(watch.lastVerifiedObservedAt, "Watch lastVerifiedObservedAt");
    if (watch.backoffUntil !== undefined)
        timestamp(watch.backoffUntil, "Watch backoffUntil");
    if (observation.observationId && watch.lastObservationId === observation.observationId)
        return Object.freeze({ fire: false, reason: "duplicate_observation", protectedActionAuthorized: false });
    if (observation.observedAt && watch.lastVerifiedObservedAt && timestamp(observation.observedAt, "Watch observedAt") <= timestamp(watch.lastVerifiedObservedAt, "Watch lastVerifiedObservedAt"))
        return Object.freeze({ fire: false, reason: "stale_observation", protectedActionAuthorized: false });
    if (observation.observedAt && watch.backoffUntil && timestamp(observation.observedAt, "Watch observedAt") < timestamp(watch.backoffUntil, "Watch backoffUntil"))
        return Object.freeze({ fire: false, reason: "backoff_active", protectedActionAuthorized: false });
    if (!observation.verified || observation.sourceRefs.length === 0 || observation.sourceRefs.some((ref) => !ref.trim()))
        return Object.freeze({ fire: false, reason: "unverified_observation", protectedActionAuthorized: false });
    if (watch.priorVerifiedState || !observation.conditionMet)
        return Object.freeze({ fire: false, reason: "no_verified_false_to_true_transition", protectedActionAuthorized: false });
    return Object.freeze({ fire: true, reason: "verified_condition_transition", protectedActionAuthorized: false });
}
//# sourceMappingURL=watches.js.map