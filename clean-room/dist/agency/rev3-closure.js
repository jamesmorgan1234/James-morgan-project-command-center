import { parseTimestamp } from "../security/types.js";
function freezeStrings(values, label, allowEmpty = false) {
    const normalized = values.map((value) => value.trim());
    if ((!allowEmpty && normalized.length === 0) || normalized.some((value) => !value) || new Set(normalized).size !== normalized.length)
        throw new Error(`${label} must be unique and nonblank`);
    return Object.freeze(normalized);
}
function cycleFrom(start, graph) {
    const path = [];
    const position = new Map();
    let current = start;
    while (true) {
        const seen = position.get(current);
        if (seen !== undefined)
            return Object.freeze(path.slice(seen));
        position.set(current, path.length);
        path.push(current);
        const next = graph.get(current)?.[0];
        if (!next)
            return null;
        current = next;
    }
}
export function detectCoordinationFaults(observations, now, noProgressAfterMs) {
    if (!Number.isSafeInteger(noProgressAfterMs) || noProgressAfterMs < 1)
        throw new Error("coordination no-progress threshold must be positive");
    const nowMs = parseTimestamp(now, "now");
    const byId = new Map();
    for (const observation of observations) {
        if (!observation.taskId.trim() || byId.has(observation.taskId))
            throw new Error("coordination task identity must be unique and nonblank");
        freezeStrings(observation.waitingOnTaskIds, "coordination wait refs", true);
        parseTimestamp(observation.lastProgressAt, "lastProgressAt");
        parseTimestamp(observation.lastHeartbeatAt, "lastHeartbeatAt");
        parseTimestamp(observation.claimExpiresAt, "claimExpiresAt");
        byId.set(observation.taskId, observation);
    }
    const faults = [];
    const emittedDeadlock = new Set();
    const graph = new Map();
    for (const observation of observations) {
        if (observation.state === "blocked")
            graph.set(observation.taskId, observation.waitingOnTaskIds.filter((id) => byId.has(id)));
    }
    for (const taskId of [...graph.keys()].sort()) {
        const cycle = cycleFrom(taskId, graph);
        if (!cycle || cycle.length < 2)
            continue;
        const normalized = [...cycle].sort();
        const key = normalized.join("|");
        if (emittedDeadlock.has(key))
            continue;
        emittedDeadlock.add(key);
        faults.push(Object.freeze({ taskId: normalized[0], kind: "deadlock", relatedTaskIds: Object.freeze(normalized), reason: "cyclic_wait_dependency" }));
    }
    for (const observation of [...observations].sort((a, b) => a.taskId.localeCompare(b.taskId))) {
        if ((observation.state === "working" || observation.state === "blocked") && (!observation.workerId.trim() || parseTimestamp(observation.claimExpiresAt, "claimExpiresAt") <= nowMs)) {
            faults.push(Object.freeze({ taskId: observation.taskId, kind: "orphaned", relatedTaskIds: Object.freeze([]), reason: "missing_or_expired_worker_claim" }));
        }
        if (observation.state === "working" && nowMs - parseTimestamp(observation.lastProgressAt, "lastProgressAt") >= noProgressAfterMs) {
            const heartbeatAge = nowMs - parseTimestamp(observation.lastHeartbeatAt, "lastHeartbeatAt");
            const sameProgress = observation.progressToken.trim() !== "" && observation.progressToken === observation.previousProgressToken;
            const kind = sameProgress && heartbeatAge < noProgressAfterMs ? "livelock" : "no_progress";
            faults.push(Object.freeze({ taskId: observation.taskId, kind, relatedTaskIds: Object.freeze([]), reason: kind === "livelock" ? "active_heartbeat_without_progress" : "progress_deadline_exceeded" }));
        }
        if (observation.state === "blocked") {
            const lowerPriorityBlockers = observation.waitingOnTaskIds.filter((id) => {
                const blocker = byId.get(id);
                return blocker !== undefined && blocker.state !== "completed" && blocker.priority > observation.priority;
            });
            if (lowerPriorityBlockers.length > 0)
                faults.push(Object.freeze({ taskId: observation.taskId, kind: "priority_inversion", relatedTaskIds: Object.freeze([...lowerPriorityBlockers].sort()), reason: "higher_priority_task_waits_on_lower_priority_work" }));
        }
    }
    return Object.freeze(faults);
}
export function coordinationRecoveryDisposition(ownerBoundaryRequired) {
    return ownerBoundaryRequired ? "escalate_owner" : "recover";
}
const REQUIRED_WORKLOAD_REPLAY_KINDS = Object.freeze(["scheduler", "dispatch", "claim", "retry", "conflict", "barrier", "recovery"]);
export function replayAgencyWorkloadFixture(events) {
    const kinds = new Set();
    events.forEach((event, index) => {
        if (event.sequence !== index + 1)
            throw new Error(`workload replay sequence gap at ${index + 1}`);
        if (!/^[a-f0-9]{64}$/.test(event.inputHash) || !/^[a-f0-9]{64}$/.test(event.outputHash) || !event.chosenValue.trim())
            throw new Error("workload replay event requires stable hashes and chosen value");
        kinds.add(event.kind);
    });
    for (const kind of REQUIRED_WORKLOAD_REPLAY_KINDS)
        if (!kinds.has(kind))
            throw new Error(`workload replay representative class missing: ${kind}`);
    return Object.freeze({ matchedRepresentativeClasses: true, transcript: Object.freeze(events.map((event) => `${event.kind}:${event.chosenValue}`)), protectedSideEffectsExecuted: false });
}
export function validateLogicalLeadAssignment(assignment) {
    if (!assignment.assignmentId.trim() || !assignment.scopeId.trim() || !assignment.mission.trim() || !assignment.currentHolder.trim() || !assignment.nextAction.trim() || !Number.isSafeInteger(assignment.version) || assignment.version < 1)
        throw new Error("logical lead assignment identity/mission/holder/next action/version required");
    return Object.freeze({
        ...assignment,
        capabilities: freezeStrings(assignment.capabilities, "logical lead capabilities"),
        authorityEnvelope: freezeStrings(assignment.authorityEnvelope, "logical lead authority"),
        evidenceRefs: freezeStrings(assignment.evidenceRefs, "logical lead evidence"),
        decisionRefs: freezeStrings(assignment.decisionRefs, "logical lead decisions", true),
        dependencyRefs: freezeStrings(assignment.dependencyRefs, "logical lead dependencies", true)
    });
}
function transitionLogicalLead(assignment, replacementHolder, evidenceRef, handoffState) {
    const current = validateLogicalLeadAssignment(assignment);
    if (!replacementHolder.trim() || replacementHolder === current.currentHolder)
        throw new Error("logical lead replacement holder must be distinct and nonblank");
    if (!evidenceRef.trim())
        throw new Error("logical lead transition requires evidence");
    return validateLogicalLeadAssignment({ ...current, currentHolder: replacementHolder.trim(), handoffState, evidenceRefs: [...current.evidenceRefs, evidenceRef.trim()], version: current.version + 1 });
}
export function handoffLogicalLead(assignment, replacementHolder, evidenceRef) {
    return transitionLogicalLead(assignment, replacementHolder, evidenceRef, "handed_off");
}
export function failoverLogicalLead(assignment, replacementHolder, evidenceRef) {
    return transitionLogicalLead(assignment, replacementHolder, evidenceRef, "failed_over");
}
//# sourceMappingURL=rev3-closure.js.map