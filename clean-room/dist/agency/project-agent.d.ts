export interface ProjectAgentIdentity {
    readonly id: string;
    readonly ownerId: string;
    readonly projectId: string;
    readonly mission: string;
    readonly contextVersion: number;
    readonly policyVersion: number;
    readonly queueRef: string;
    readonly checkpointRef?: string;
    readonly state: "ready" | "working" | "blocked" | "paused" | "retired";
    readonly createdAt: string;
    readonly updatedAt: string;
}
export interface WorkerAssignment {
    readonly projectAgentId: string;
    readonly workerId: string;
    readonly assignmentId: string;
    readonly assignedAt: string;
    readonly leaseToken: number;
}
export declare class ProjectAgentRegistry {
    #private;
    register(agent: ProjectAgentIdentity): void;
    assign(assignment: WorkerAssignment): void;
    replaceWorker(projectAgentId: string, assignment: WorkerAssignment): void;
    get(id: string): ProjectAgentIdentity | undefined;
    assignment(id: string): WorkerAssignment | undefined;
}
export type ProjectAgentRuntimeState = "Ready" | "Working" | "Blocked" | "Paused" | "Retired";
export interface ProjectAgentState {
    readonly agentId: string;
    readonly projectId: string;
    readonly projectType: string;
    readonly mission: string;
    readonly state: ProjectAgentRuntimeState;
    readonly queueRefs: readonly string[];
    readonly checkpointRefs: readonly string[];
    readonly contextVersion: number;
    readonly policyVersion: number;
    readonly generation: number;
    readonly workerId?: string;
}
/**
 * Compatibility runtime store for the durable P7.1 Project Agent model.
 * The Project Agent identity/mission/checkpoint survives worker churn; worker
 * identity is a replaceable lease concern and never becomes the agent identity.
 */
export declare class ProjectAgentStore {
    #private;
    create(record: Omit<ProjectAgentState, "generation" | "workerId">): ProjectAgentState;
    get(projectId: string): ProjectAgentState;
    claimWorker(projectId: string, workerId: string): ProjectAgentState;
    releaseWorker(projectId: string, workerId: string): ProjectAgentState;
}
