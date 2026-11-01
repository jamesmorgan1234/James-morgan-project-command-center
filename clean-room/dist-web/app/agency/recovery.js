import { parseTimestamp } from "../security/types.js";
export function reapOrphan(assignment, now) {
    const expired = parseTimestamp(now, "now") >= parseTimestamp(assignment.leaseExpiresAt, "leaseExpiresAt");
    if (!expired)
        throw new Error("Cannot reap a live assignment");
    if (!assignment.checkpointRef.trim() || assignment.evidenceRefs.length === 0)
        throw new Error("Orphan recovery requires verified checkpoint and evidence");
    return Object.freeze({ taskId: assignment.taskId, reclaim: true, resumeFrom: assignment.checkpointRef });
}
/** Reclaims only an expired worker lease and preserves checkpoint/evidence truth. */
export function recoverExpiredAssignment(assignment, replacementWorkerId, now) {
    if (!assignment.taskId.trim() || !assignment.workerId.trim() || !replacementWorkerId.trim())
        throw new Error("Recovery task/worker identities are required");
    if (!Number.isSafeInteger(assignment.generation) || assignment.generation < 1)
        throw new Error("Recovery generation must be positive");
    if (!Number.isSafeInteger(assignment.fencingToken) || assignment.fencingToken < 1)
        throw new Error("Recovery fencingToken must be positive");
    parseTimestamp(assignment.claimedAt, "claimedAt");
    const nowMs = parseTimestamp(now, "now");
    const expiryMs = parseTimestamp(assignment.expiresAt, "expiresAt");
    if (nowMs < expiryMs)
        throw new Error("Assignment is not expired");
    if (!assignment.checkpointRef?.trim())
        throw new Error("Recovery requires checkpoint preservation");
    if (assignment.evidenceRefs.length === 0 || new Set(assignment.evidenceRefs).size !== assignment.evidenceRefs.length)
        throw new Error("Recovery requires unique evidence references");
    return Object.freeze({
        taskId: assignment.taskId,
        workerId: replacementWorkerId,
        generation: assignment.generation + 1,
        fencingToken: assignment.fencingToken + 1,
        claimedAt: now,
        checkpointRef: assignment.checkpointRef,
        evidenceRefs: Object.freeze([...assignment.evidenceRefs]),
        contextRevalidationRequired: true
    });
}
export function validateLeadFailover(failover) {
    if (failover.priorLeadId === failover.replacementLeadId)
        throw new Error("Lead failover requires replacement identity");
    if (!failover.missionRef.trim() || !failover.queueRef.trim() || !failover.checkpointRef.trim())
        throw new Error("Lead failover must preserve mission/queue/checkpoint");
}
//# sourceMappingURL=recovery.js.map