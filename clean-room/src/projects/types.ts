import { parseTimestamp } from "../security/types.js";

export type ProjectLifecycle = "candidate" | "active" | "paused" | "blocked" | "completed" | "archived" | "superseded";
export type ProjectPriority = "critical" | "high" | "normal" | "low";
export type ProjectVerification = "verified" | "implemented_unverified" | "partial" | "blocked" | "unknown";

export interface ProjectRecord {
  readonly id: string;
  readonly typeKey: string;
  readonly ownerId: string;
  readonly companyId?: string;
  readonly name: string;
  readonly mission: string;
  readonly lifecycle: ProjectLifecycle;
  readonly verification: ProjectVerification;
  readonly priority: ProjectPriority;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly agentAccessEnabled: boolean;
  readonly portfolioAutoEnabled: boolean;
  readonly protected: boolean;
}

export interface ProjectTypeDefinition {
  readonly key: string;
  readonly version: number;
  readonly label: string;
  readonly capabilities: readonly string[];
  readonly requiredDetailSections: readonly string[];
  readonly domainPlaybookKey: string;
}

export function assertProjectRecord(project: ProjectRecord): void {
  if (!project.id.trim() || !project.typeKey.startsWith("project-type:") || !project.ownerId.trim() || !project.name.trim() || !project.mission.trim()) throw new Error("Project identity/type/owner/name/mission are required");
  if (!Number.isSafeInteger(project.version) || project.version < 1) throw new Error("Project version must be a positive safe integer");
  const created = parseTimestamp(project.createdAt, "createdAt");
  const updated = parseTimestamp(project.updatedAt, "updatedAt");
  if (updated < created) throw new Error("Project updatedAt cannot predate createdAt");
}
