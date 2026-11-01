import { parseTimestamp } from "../security/types.js";
export function assertSideEffectAllowed(gate) {
    if (gate.projectLockToken !== gate.expectedProjectLockToken)
        throw new Error("Project lock is stale before side effect");
    if (gate.stopOrPauseRequested)
        throw new Error("Stop or pause requested before side effect");
}
export function reserveSideEffect(key, reserved) {
    if (!key.trim())
        throw new Error("Side-effect reservation requires a key");
    if (reserved.has(key))
        throw new Error(`Side effect already reserved: ${key}`);
    reserved.add(key);
}
export function verifySideEffect(observed, expected) {
    if (!expected.trim())
        throw new Error("Side-effect verification requires an expectation");
    if (observed !== expected)
        throw new Error(`Post-side-effect verification failed: expected ${expected}`);
    return observed;
}
export function writeCheckpoint(state, createdAt) {
    if (!state.taskKey.trim())
        throw new Error("Checkpoint requires a task key");
    if (!state.stable)
        throw new Error("Checkpoint requires a meaningful stable state");
    if (!Number.isSafeInteger(state.stateVersion) || state.stateVersion < 1)
        throw new Error("Checkpoint requires a positive state version");
    parseTimestamp(createdAt, "createdAt");
    return Object.freeze({ taskKey: state.taskKey, stateVersion: state.stateVersion, createdAt });
}
export function selectNextTask(ready, checkpoint) {
    if (checkpoint === null)
        throw new Error("Next task requires a checkpoint where checkpointing applies");
    const next = ready[0];
    if (next === undefined)
        throw new Error("No ready task to select");
    return next;
}
export function assertAdvanceable(evidence) {
    if (evidence.ambiguous)
        throw new Error("Task advancement refused on ambiguous evidence");
}
export function assertSkipAllowed(policy) {
    if (policy !== "explicit_allow")
        throw new Error("Automatic task skip requires an explicit policy");
}
export function recordTaskOutcome(taskKey, outcome, reason) {
    if (!taskKey.trim())
        throw new Error("Outcome requires a task key");
    if (!reason.trim())
        throw new Error(`A ${outcome} task requires a recorded reason`);
    return Object.freeze({ taskKey, outcome, reason });
}
function fnv1a(input) {
    let hash = 0x811c9dc5;
    for (let index = 0; index < input.length; index += 1) {
        hash ^= input.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
}
export function retryFingerprint(kind, parts) {
    if (parts.length === 0 || parts.some((part) => !part.trim()))
        throw new Error("Retry fingerprint requires nonblank parts");
    return `${kind}:${fnv1a(`${kind}\u0000${parts.join("\u0000")}`)}`;
}
export function groupSystemicFailures(fingerprints, minimumOccurrences = 2) {
    const counts = new Map();
    for (const fingerprint of fingerprints)
        counts.set(fingerprint, (counts.get(fingerprint) ?? 0) + 1);
    const groups = [];
    for (const [fingerprint, occurrences] of counts)
        if (occurrences >= minimumOccurrences)
            groups.push(Object.freeze({ fingerprint, occurrences }));
    return Object.freeze(groups.sort((a, b) => b.occurrences - a.occurrences || a.fingerprint.localeCompare(b.fingerprint)));
}
export class CircuitBreaker {
    #threshold;
    #cooldownMs;
    #failures = 0;
    #openedAt = null;
    constructor(threshold, cooldownMs) {
        if (!Number.isSafeInteger(threshold) || threshold < 1)
            throw new Error("Circuit-breaker threshold must be a positive integer");
        if (!Number.isSafeInteger(cooldownMs) || cooldownMs < 0)
            throw new Error("Circuit-breaker cooldown must be a nonnegative integer");
        this.#threshold = threshold;
        this.#cooldownMs = cooldownMs;
    }
    get failures() { return this.#failures; }
    get open() { return this.#openedAt !== null; }
    recordFailure(now) {
        this.#failures += 1;
        if (this.#failures >= this.#threshold)
            this.#openedAt = now.getTime();
    }
    canProceed(now) {
        if (this.#openedAt === null)
            return true;
        return now.getTime() - this.#openedAt >= this.#cooldownMs;
    }
    recordSuccess() { this.#failures = 0; this.#openedAt = null; }
    manualReset() { this.#failures = 0; this.#openedAt = null; }
}
export class QuarantineRegistry {
    #failures = new Map();
    #quarantined = new Set();
    recordFailure(key, threshold) {
        if (!key.trim())
            throw new Error("Quarantine key must be nonblank");
        if (!Number.isSafeInteger(threshold) || threshold < 1)
            throw new Error("Quarantine threshold must be a positive integer");
        const next = (this.#failures.get(key) ?? 0) + 1;
        this.#failures.set(key, next);
        if (next >= threshold) {
            this.#quarantined.add(key);
            return true;
        }
        return false;
    }
    isQuarantined(key) { return this.#quarantined.has(key); }
    assertAvailable(key) {
        if (this.isQuarantined(key))
            throw new Error(`Quarantined: ${key}`);
    }
    clear(key) { this.#failures.delete(key); this.#quarantined.delete(key); }
}
//# sourceMappingURL=failure-policy.js.map