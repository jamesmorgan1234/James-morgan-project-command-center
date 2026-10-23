import { parseTimestamp } from "../security/types.js";

export type ProjectLineageKind = "created" | "renamed" | "merged" | "superseded" | "forked" | "branched" | "reactivated" | "retired";

export interface ProjectLineageEvent {
  readonly id: string;
  readonly projectId: string;
  readonly kind: ProjectLineageKind;
  readonly occurredAt: string;
  readonly ownerDecisionRef?: string;
  readonly fromName?: string;
  readonly toName?: string;
  readonly relatedProjectId?: string;
  readonly evidenceRefs: readonly string[];
}

export class ProjectLineageLedger {
  readonly #events: ProjectLineageEvent[] = [];
  readonly #ids = new Set<string>();

  append(event: ProjectLineageEvent): void {
    if (!event.id.trim() || !event.projectId.trim()) throw new Error("Lineage event identity is required");
    if (this.#ids.has(event.id)) throw new Error(`Lineage event already exists: ${event.id}`);
    parseTimestamp(event.occurredAt, "occurredAt");
    if (event.evidenceRefs.length === 0) throw new Error("Lineage event requires evidence");
    if (["renamed", "merged", "superseded", "reactivated", "retired"].includes(event.kind) && !event.ownerDecisionRef?.trim()) throw new Error(`${event.kind} requires owner decision evidence`);
    if (event.kind === "renamed" && (!event.fromName?.trim() || !event.toName?.trim())) throw new Error("Rename requires fromName and toName");
    if (["merged", "superseded", "forked", "branched"].includes(event.kind) && !event.relatedProjectId?.trim()) throw new Error(`${event.kind} requires relatedProjectId`);
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
}
