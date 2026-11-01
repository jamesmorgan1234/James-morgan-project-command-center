import { parseTimestamp } from "../security/types.js";
export function validateMemoryRetention(input) {
    if (!input.memoryId.trim() || !input.reason.trim())
        throw new Error("Memory retention identity/reason are required");
    if (input.evidenceRefs.length === 0 || new Set(input.evidenceRefs).size !== input.evidenceRefs.length)
        throw new Error("Memory retention requires unique evidence");
    parseTimestamp(input.recordedAt, "recordedAt");
    if (input.expiresAt)
        parseTimestamp(input.expiresAt, "expiresAt");
    if (input.policy === "time_bounded" && !input.expiresAt)
        throw new Error("Time-bounded retention requires expiry");
    if (input.policy !== "time_bounded" && input.expiresAt)
        throw new Error("Only time-bounded retention may carry expiry");
    return Object.freeze({ ...input, evidenceRefs: Object.freeze([...input.evidenceRefs]) });
}
export function applyRetentionChange(current, change) {
    if (change.memoryId !== current.memoryId)
        throw new Error("Retention change must target current memory");
    if (change.previousPolicy !== undefined && change.previousPolicy !== current.policy)
        throw new Error("Retention change previous policy mismatch");
    if ((change.previousExpiresAt ?? undefined) !== (current.expiresAt ?? undefined))
        throw new Error("Retention change previous expiry mismatch");
    parseTimestamp(change.occurredAt, "occurredAt");
    return validateMemoryRetention({
        memoryId: current.memoryId,
        policy: change.newPolicy,
        ...(change.newExpiresAt ? { expiresAt: change.newExpiresAt } : {}),
        reason: change.reason,
        evidenceRefs: change.evidenceRefs,
        recordedAt: change.occurredAt
    });
}
//# sourceMappingURL=memory-governance.js.map