import { parseTimestamp } from "../security/types.js";

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

export class ProjectAgentRegistry {
  readonly #agents = new Map<string, ProjectAgentIdentity>();
  readonly #assignments = new Map<string, WorkerAssignment>();

  register(agent: ProjectAgentIdentity): void {
    if (!agent.id.trim() || !agent.projectId.trim() || !agent.mission.trim() || !agent.queueRef.trim()) throw new Error("Project Agent identity/mission/queue are required");
    parseTimestamp(agent.createdAt, "createdAt");
    parseTimestamp(agent.updatedAt, "updatedAt");
    if (this.#agents.has(agent.id)) throw new Error(`Project Agent already exists: ${agent.id}`);
    this.#agents.set(agent.id, Object.freeze({ ...agent }));
  }

  assign(assignment: WorkerAssignment): void {
    if (!this.#agents.has(assignment.projectAgentId)) throw new Error(`Unknown Project Agent: ${assignment.projectAgentId}`);
    parseTimestamp(assignment.assignedAt, "assignedAt");
    if (!Number.isSafeInteger(assignment.leaseToken) || assignment.leaseToken < 1) throw new Error("Assignment leaseToken must be positive");
    this.#assignments.set(assignment.projectAgentId, Object.freeze({ ...assignment }));
  }

  replaceWorker(projectAgentId: string, assignment: WorkerAssignment): void {
    const agent = this.#agents.get(projectAgentId);
    if (!agent) throw new Error(`Unknown Project Agent: ${projectAgentId}`);
    const current = this.#assignments.get(projectAgentId);
    if (current && assignment.leaseToken <= current.leaseToken) throw new Error("Worker replacement must advance lease token");
    this.assign(assignment);
  }

  get(id: string): ProjectAgentIdentity | undefined { return this.#agents.get(id); }
  assignment(id: string): WorkerAssignment | undefined { return this.#assignments.get(id); }
}
