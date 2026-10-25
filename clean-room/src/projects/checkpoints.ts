import { parseTimestamp } from "../security/types.js";

export interface ProjectCheckpoint {
  readonly id: string;
  readonly projectId: string;
  readonly roadmapVersion: number;
  readonly createdAt: string;
  readonly exactNextWorkUnitId?: string;
  readonly blocker?: string;
  readonly requiredEnvironment?: "pc" | "phone" | "local_browser" | "any_device";
  readonly ownerAction?: string;
  readonly verificationMethod: string;
  readonly evidenceRefs: readonly string[];
  readonly resumeStateHash: string;
}

const SHA256_HEX = /^[0-9a-f]{64}$/i;

export class ProjectCheckpointStore {
  readonly #byProject = new Map<string, ProjectCheckpoint[]>();

  append(checkpoint: ProjectCheckpoint): void {
    if (!checkpoint.id.trim() || !checkpoint.projectId.trim() || !checkpoint.verificationMethod.trim() || !checkpoint.resumeStateHash.trim()) throw new Error("Checkpoint identity/verification/resume hash are required");
    if (!SHA256_HEX.test(checkpoint.resumeStateHash)) throw new Error("Checkpoint resume-state hash must be SHA-256 hex");
    if (!Number.isSafeInteger(checkpoint.roadmapVersion) || checkpoint.roadmapVersion < 1) throw new Error("Checkpoint roadmap version must be positive");
    parseTimestamp(checkpoint.createdAt, "createdAt");
    if (checkpoint.evidenceRefs.length === 0) throw new Error("Checkpoint requires evidence");
    if (checkpoint.ownerAction && !checkpoint.requiredEnvironment) throw new Error("Owner action requires requiredEnvironment");
    const existing = this.#byProject.get(checkpoint.projectId) ?? [];
    if (existing.some((item) => item.id === checkpoint.id)) throw new Error(`Checkpoint already exists: ${checkpoint.id}`);
    existing.push(Object.freeze({ ...checkpoint, evidenceRefs: Object.freeze([...checkpoint.evidenceRefs]) }));
    this.#byProject.set(checkpoint.projectId, existing);
  }

  latest(projectId: string): ProjectCheckpoint | undefined {
    const items = this.#byProject.get(projectId);
    return items?.[items.length - 1];
  }

  history(projectId: string): readonly ProjectCheckpoint[] { return Object.freeze([...(this.#byProject.get(projectId) ?? [])]); }
}
