import { parseTimestamp } from "../security/types.js";
export class ProjectAgentRegistry {
    #agents = new Map();
    #assignments = new Map();
    register(agent) {
        if (!agent.id.trim() || !agent.projectId.trim() || !agent.mission.trim() || !agent.queueRef.trim())
            throw new Error("Project Agent identity/mission/queue are required");
        parseTimestamp(agent.createdAt, "createdAt");
        parseTimestamp(agent.updatedAt, "updatedAt");
        if (this.#agents.has(agent.id))
            throw new Error(`Project Agent already exists: ${agent.id}`);
        this.#agents.set(agent.id, Object.freeze({ ...agent }));
    }
    assign(assignment) {
        if (!this.#agents.has(assignment.projectAgentId))
            throw new Error(`Unknown Project Agent: ${assignment.projectAgentId}`);
        parseTimestamp(assignment.assignedAt, "assignedAt");
        if (!Number.isSafeInteger(assignment.leaseToken) || assignment.leaseToken < 1)
            throw new Error("Assignment leaseToken must be positive");
        this.#assignments.set(assignment.projectAgentId, Object.freeze({ ...assignment }));
    }
    replaceWorker(projectAgentId, assignment) {
        const agent = this.#agents.get(projectAgentId);
        if (!agent)
            throw new Error(`Unknown Project Agent: ${projectAgentId}`);
        const current = this.#assignments.get(projectAgentId);
        if (current && assignment.leaseToken <= current.leaseToken)
            throw new Error("Worker replacement must advance lease token");
        this.assign(assignment);
    }
    get(id) { return this.#agents.get(id); }
    assignment(id) { return this.#assignments.get(id); }
}
function validateState(record) {
    if (!record.agentId.trim() || !record.projectId.trim() || !record.projectType.trim() || !record.mission.trim())
        throw new Error("Project Agent state identity/type/mission are required");
    if (!Number.isSafeInteger(record.contextVersion) || record.contextVersion < 1)
        throw new Error("Project Agent contextVersion must be positive");
    if (!Number.isSafeInteger(record.policyVersion) || record.policyVersion < 1)
        throw new Error("Project Agent policyVersion must be positive");
    if (record.generation !== undefined && (!Number.isSafeInteger(record.generation) || record.generation < 1))
        throw new Error("Project Agent generation must be positive");
    if (record.queueRefs.length === 0 || record.checkpointRefs.length === 0)
        throw new Error("Project Agent state requires queue and checkpoint references");
    if (new Set(record.queueRefs).size !== record.queueRefs.length || new Set(record.checkpointRefs).size !== record.checkpointRefs.length)
        throw new Error("Project Agent queue/checkpoint references must be unique");
}
/**
 * Compatibility runtime store for the durable P7.1 Project Agent model.
 * The Project Agent identity/mission/checkpoint survives worker churn; worker
 * identity is a replaceable lease concern and never becomes the agent identity.
 */
export class ProjectAgentStore {
    #records = new Map();
    create(record) {
        validateState(record);
        if (this.#records.has(record.projectId))
            throw new Error(`Project Agent already exists for project: ${record.projectId}`);
        if ([...this.#records.values()].some((existing) => existing.agentId === record.agentId))
            throw new Error(`Project Agent id already exists: ${record.agentId}`);
        const created = Object.freeze({
            ...record,
            queueRefs: Object.freeze([...record.queueRefs]),
            checkpointRefs: Object.freeze([...record.checkpointRefs]),
            generation: 1
        });
        this.#records.set(record.projectId, created);
        return created;
    }
    get(projectId) {
        const record = this.#records.get(projectId);
        if (!record)
            throw new Error(`Unknown Project Agent project: ${projectId}`);
        return record;
    }
    claimWorker(projectId, workerId) {
        if (!workerId.trim())
            throw new Error("Project Agent workerId is required");
        const current = this.get(projectId);
        if (current.workerId && current.workerId !== workerId)
            throw new Error(`Project Agent already claimed by worker: ${current.workerId}`);
        if (current.workerId === workerId)
            return current;
        const updated = Object.freeze({ ...current, workerId, generation: current.generation + 1 });
        this.#records.set(projectId, updated);
        return updated;
    }
    releaseWorker(projectId, workerId) {
        const current = this.get(projectId);
        if (!current.workerId)
            return current;
        if (current.workerId !== workerId)
            throw new Error("Project Agent worker release identity mismatch");
        const { workerId: _workerId, ...rest } = current;
        const updated = Object.freeze({ ...rest, generation: current.generation + 1 });
        this.#records.set(projectId, updated);
        return updated;
    }
}
//# sourceMappingURL=project-agent.js.map