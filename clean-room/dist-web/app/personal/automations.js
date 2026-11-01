import { parseTimestamp } from "../security/types.js";
function validateAutomation(automation) {
    if (!automation.id.trim() || !automation.ownerId.trim() || !automation.scheduleRef.trim())
        throw new Error("Automation identity/owner/schedule are required");
    return Object.freeze({ ...automation });
}
function assertCurrentAuthority(snapshot, now) {
    if (!snapshot.authorizationRef.trim())
        throw new Error("Automation authorization reference is required");
    const issued = parseTimestamp(snapshot.issuedAt, "authorization issuedAt"), expires = parseTimestamp(snapshot.expiresAt, "authorization expiresAt"), current = parseTimestamp(now, "automation now");
    if (expires <= issued || current < issued || current >= expires)
        throw new Error("Automation authorization is not currently valid");
    if (snapshot.revoked)
        throw new Error("Automation authorization is revoked");
    if (snapshot.policyEpoch !== snapshot.currentPolicyEpoch || snapshot.revocationEpoch !== snapshot.currentRevocationEpoch)
        throw new Error("Automation authorization authority state is stale");
}
export function planAutomationCatchUp(scheduledFor, completedOccurrenceKeys, maxCatchUp) {
    if (!Number.isSafeInteger(maxCatchUp) || maxCatchUp < 0)
        throw new Error("Automation maxCatchUp must be a non-negative integer");
    const completed = new Set(completedOccurrenceKeys);
    const unique = [...new Set(scheduledFor)];
    for (const item of unique)
        parseTimestamp(item, "scheduledFor");
    return Object.freeze(unique.sort().filter((item) => !completed.has(item)).slice(0, maxCatchUp));
}
export class AutomationRegistry {
    #automations = new Map();
    #executions = new Map();
    static rehydrate(snapshot) {
        if (snapshot.schemaVersion !== "cc-automation-registry-v1")
            throw new Error("Unsupported automation registry snapshot");
        const registry = new AutomationRegistry();
        for (const automation of snapshot.automations)
            registry.register(automation);
        for (const execution of snapshot.executions) {
            if (!registry.#automations.has(execution.automationId))
                throw new Error(`Persisted automation execution references unknown automation: ${execution.automationId}`);
            parseTimestamp(execution.scheduledFor, "scheduledFor");
            parseTimestamp(execution.startedAt, "startedAt");
            if (execution.state !== "started" && execution.evidenceRefs.length === 0)
                throw new Error("Persisted finished automation execution requires evidence");
            const key = `${execution.automationId}:${execution.scheduledFor}`;
            if (registry.#executions.has(key))
                throw new Error(`Duplicate persisted scheduled execution: ${key}`);
            registry.#executions.set(key, Object.freeze({ ...execution, evidenceRefs: Object.freeze([...execution.evidenceRefs]) }));
        }
        return registry;
    }
    register(input) {
        const automation = validateAutomation(input);
        if (this.#automations.has(automation.id))
            throw new Error(`Automation already exists: ${automation.id}`);
        this.#automations.set(automation.id, automation);
    }
    begin(automationId, scheduledFor, startedAt, authority, agencyExecutionRef) {
        const automation = this.#automations.get(automationId);
        if (!automation || !automation.enabled)
            throw new Error(`Automation unavailable: ${automationId}`);
        if (automation.providerHealth === "unavailable")
            throw new Error("Automation provider unavailable");
        parseTimestamp(scheduledFor, "scheduledFor");
        parseTimestamp(startedAt, "startedAt");
        if (automation.actionPolicy === "safe_action") {
            if (!authority)
                throw new Error("Safe-action automation requires current authorization");
            assertCurrentAuthority(authority, startedAt);
        }
        if (agencyExecutionRef !== undefined && !agencyExecutionRef.trim())
            throw new Error("Automation Agency execution reference must be nonblank when supplied");
        const key = `${automationId}:${scheduledFor}`;
        if (this.#executions.has(key))
            throw new Error(`Duplicate scheduled execution blocked: ${key}`);
        this.#executions.set(key, Object.freeze({ automationId, scheduledFor, startedAt, state: "started", evidenceRefs: Object.freeze([]), ...(authority ? { authorityRef: authority.authorizationRef } : {}), ...(agencyExecutionRef ? { agencyExecutionRef } : {}) }));
        return key;
    }
    finish(executionKey, state, evidenceRefs) {
        const current = this.#executions.get(executionKey);
        if (!current)
            throw new Error(`Unknown automation execution: ${executionKey}`);
        if (current.state !== "started")
            throw new Error("Automation execution is already terminal");
        const evidence = [...new Set(evidenceRefs.map((ref) => ref.trim()))];
        if (evidence.length === 0 || evidence.some((ref) => !ref))
            throw new Error("Automation completion/failure requires evidence");
        this.#executions.set(executionKey, Object.freeze({ ...current, state, evidenceRefs: Object.freeze(evidence) }));
    }
    execution(executionKey) { return this.#executions.get(executionKey); }
    exportSnapshot() { return Object.freeze({ schemaVersion: "cc-automation-registry-v1", automations: Object.freeze([...this.#automations.values()]), executions: Object.freeze([...this.#executions.values()]) }); }
}
//# sourceMappingURL=automations.js.map