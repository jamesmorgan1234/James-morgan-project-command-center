import { parseTimestamp } from "../security/types.js";

export type ProjectLineageKind = "created" | "renamed" | "mission_changed" | "alias_added" | "merged" | "superseded" | "forked" | "branched" | "reactivated" | "retired";

export interface ProjectLineageEvent {
  readonly id: string;
  readonly projectId: string;
  readonly kind: ProjectLineageKind;
  readonly occurredAt: string;
  readonly ownerDecisionRef?: string;
  readonly fromName?: string;
  readonly toName?: string;
  readonly fromMission?: string;
  readonly toMission?: string;
  readonly alias?: string;
  readonly relatedProjectId?: string;
  readonly evidenceRefs: readonly string[];
}

const OWNER_DECISION_KINDS = new Set<ProjectLineageKind>(["renamed", "mission_changed", "alias_added", "merged", "superseded", "forked", "branched", "reactivated", "retired"]);

export class ProjectLineageLedger {
  readonly #events: ProjectLineageEvent[] = [];
  readonly #ids = new Set<string>();

  append(event: ProjectLineageEvent): void {
    if (!event.id.trim() || !event.projectId.trim()) throw new Error("Lineage event identity is required");
    if (this.#ids.has(event.id)) throw new Error(`Lineage event already exists: ${event.id}`);
    parseTimestamp(event.occurredAt, "occurredAt");
    if (event.evidenceRefs.length === 0 || event.evidenceRefs.some((ref) => !ref.trim())) throw new Error("Lineage event requires nonblank evidence");
    if (new Set(event.evidenceRefs).size !== event.evidenceRefs.length) throw new Error("Lineage evidence must be unique");
    if (OWNER_DECISION_KINDS.has(event.kind) && !event.ownerDecisionRef?.trim()) throw new Error(`${event.kind} requires owner decision evidence`);
    if (event.kind === "renamed" && (!event.fromName?.trim() || !event.toName?.trim() || event.fromName === event.toName)) throw new Error("Rename requires distinct fromName and toName");
    if (event.kind === "mission_changed" && (!event.fromMission?.trim() || !event.toMission?.trim() || event.fromMission === event.toMission)) throw new Error("Mission change requires distinct fromMission and toMission");
    if (event.kind === "alias_added" && !event.alias?.trim()) throw new Error("Alias event requires alias");
    if (["merged", "superseded", "forked", "branched"].includes(event.kind) && (!event.relatedProjectId?.trim() || event.relatedProjectId === event.projectId)) throw new Error(`${event.kind} requires a different relatedProjectId`);
    this.#ids.add(event.id);
    this.#events.push(Object.freeze({ ...event, evidenceRefs: Object.freeze([...event.evidenceRefs]) }));
  }

  history(projectId: string): readonly ProjectLineageEvent[] { return Object.freeze(this.#events.filter((event) => event.projectId === projectId)); }

  currentName(projectId: string, originalName: string): string {
    let name = originalName;
    for (const event of this.#events.filter((candidate) => candidate.projectId === projectId && candidate.kind === "renamed")) {
      if (event.toName) name = event.toName;
    }
    return name;
  }

  currentMission(projectId: string, originalMission: string): string {
    let mission = originalMission;
    for (const event of this.#events.filter((candidate) => candidate.projectId === projectId && candidate.kind === "mission_changed")) {
      if (event.toMission) mission = event.toMission;
    }
    return mission;
  }

  aliases(projectId: string): readonly string[] {
    const values = this.#events
      .filter((event) => event.projectId === projectId && event.kind === "alias_added" && event.alias)
      .map((event) => event.alias as string);
    return Object.freeze([...new Set(values)]);
  }
}
