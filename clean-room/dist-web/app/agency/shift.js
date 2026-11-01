import { parseTimestamp } from "../security/types.js";
export function inspectShift(workers, now, stallAfterMs) {
    const nowMs = parseTimestamp(now, "now");
    const incidents = [];
    for (const worker of workers) {
        const heartbeat = parseTimestamp(worker.lastHeartbeatAt, "lastHeartbeatAt");
        if (worker.state === "working" && nowMs - heartbeat > stallAfterMs) {
            incidents.push(Object.freeze({ workerId: worker.workerId, taskId: worker.taskId, kind: "stalled", ownerAttentionRequired: false }));
            continue;
        }
        if (worker.state === "failed") {
            incidents.push(Object.freeze({ workerId: worker.workerId, taskId: worker.taskId, kind: "failed", ownerAttentionRequired: false }));
            continue;
        }
        if (worker.state === "blocked") {
            incidents.push(Object.freeze({ workerId: worker.workerId, taskId: worker.taskId, kind: "blocked", ownerAttentionRequired: true }));
        }
    }
    return Object.freeze(incidents);
}
export function inspectShiftManager(input, now, stallAfterMs) {
    if (!Number.isSafeInteger(input.queueDepth) || input.queueDepth < 0 || !Number.isSafeInteger(input.queueCapacity) || input.queueCapacity < 1)
        throw new Error("Shift Manager queue depth/capacity are invalid");
    if (!Number.isFinite(input.resourcePressure) || input.resourcePressure < 0 || input.resourcePressure > 1)
        throw new Error("Shift Manager resource pressure must be between 0 and 1");
    if (!Number.isSafeInteger(stallAfterMs) || stallAfterMs < 1)
        throw new Error("Shift Manager stall threshold must be positive");
    const explicitOwnerBoundaries = new Set(input.ownerBoundaryTaskIds.map((id) => id.trim()));
    if (explicitOwnerBoundaries.has(""))
        throw new Error("Shift Manager owner-boundary task ids must be nonblank");
    const faultTaskIds = new Set();
    const recoverableFaultTaskIds = [];
    const ownerBoundaryFaultTaskIds = [];
    for (const fault of input.coordinationFaults) {
        if (!fault.taskId.trim() || !fault.kind.trim() || faultTaskIds.has(fault.taskId))
            throw new Error("Shift Manager coordination faults require unique nonblank task identity/kind");
        faultTaskIds.add(fault.taskId);
        if (fault.ownerBoundaryRequired)
            ownerBoundaryFaultTaskIds.push(fault.taskId);
        else
            recoverableFaultTaskIds.push(fault.taskId);
    }
    const incidents = inspectShift(input.workers, now, stallAfterMs).map((incident) => Object.freeze({
        ...incident,
        ownerAttentionRequired: explicitOwnerBoundaries.has(incident.taskId)
    }));
    const ownerBoundaryTaskIds = [...new Set([...explicitOwnerBoundaries, ...ownerBoundaryFaultTaskIds])].sort();
    const safeHandoffTaskIds = incidents.filter((incident) => incident.kind === "stalled" || incident.kind === "failed").map((incident) => incident.taskId).sort();
    const queuePressure = Math.min(1, input.queueDepth / input.queueCapacity);
    const containmentRequired = queuePressure >= 1 || input.resourcePressure >= 0.9 || safeHandoffTaskIds.length > 0 || input.coordinationFaults.length > 0;
    return Object.freeze({
        incidents: Object.freeze(incidents),
        queuePressure,
        resourcePressure: input.resourcePressure,
        containmentRequired,
        safeHandoffTaskIds: Object.freeze(safeHandoffTaskIds),
        recoverableFaultTaskIds: Object.freeze(recoverableFaultTaskIds.sort()),
        ownerBoundaryTaskIds: Object.freeze(ownerBoundaryTaskIds)
    });
}
//# sourceMappingURL=shift.js.map