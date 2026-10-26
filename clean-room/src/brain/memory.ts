import { parseTimestamp } from "../security/types.js";

export type MemoryKind = "fact" | "decision" | "rule" | "preference" | "goal" | "asset" | "history" | "owner_input";
export type MemorySensitivity = "internal" | "sensitive" | "protected" | "secret";
export type MemoryState = "current" | "superseded" | "expired";
export type MemoryLayer = "owner_system" | "ecosystem_validated" | "specialist_local" | "procedural" | "negative" | "quarantined" | "historical";

export interface BrainMemory<T> {
  readonly id: string;
  readonly ownerId: string;
  readonly projectId?: string;
  readonly kind: MemoryKind;
  readonly version: number;
  readonly state: MemoryState;
  readonly value: Readonly<T>;
  readonly confidence: number;
  readonly sensitivity: MemorySensitivity;
  readonly sourceRefs: readonly string[];
  readonly recordedAt: string;
  readonly retainUntil?: string;
  readonly supersedes?: string;
}

export interface LayeredMemoryMetadata {
  readonly memoryId: string;
  readonly memoryVersion: number;
  readonly layer: MemoryLayer;
  readonly companyId?: string;
  readonly brainId?: string;
  readonly taskClasses: readonly string[];
  readonly conditionRefs: readonly string[];
  readonly dependencyRefs: readonly string[];
  readonly methodRefs: readonly string[];
  readonly permissionRefs: readonly string[];
  readonly budgetRefs: readonly string[];
  readonly contradictionRefs: readonly string[];
  readonly operationalEligible: boolean;
  readonly expiresAt?: string;
  readonly revalidateAfter?: string;
  readonly invalidatedAt?: string;
  readonly invalidationEvidenceRefs: readonly string[];
}

function freezeMetadata(metadata: LayeredMemoryMetadata): LayeredMemoryMetadata {
  return Object.freeze({ ...metadata, taskClasses: Object.freeze([...metadata.taskClasses]), conditionRefs: Object.freeze([...metadata.conditionRefs]), dependencyRefs: Object.freeze([...metadata.dependencyRefs]), methodRefs: Object.freeze([...metadata.methodRefs]), permissionRefs: Object.freeze([...metadata.permissionRefs]), budgetRefs: Object.freeze([...metadata.budgetRefs]), contradictionRefs: Object.freeze([...metadata.contradictionRefs]), invalidationEvidenceRefs: Object.freeze([...metadata.invalidationEvidenceRefs]) });
}

export function validateLayeredMemoryMetadata(metadata: LayeredMemoryMetadata): LayeredMemoryMetadata {
  if (!metadata.memoryId.trim() || !Number.isInteger(metadata.memoryVersion) || metadata.memoryVersion < 1) throw new Error("Layered memory identity/version required");
  if (metadata.expiresAt) parseTimestamp(metadata.expiresAt, "expiresAt");
  if (metadata.revalidateAfter) parseTimestamp(metadata.revalidateAfter, "revalidateAfter");
  if (metadata.invalidatedAt) parseTimestamp(metadata.invalidatedAt, "invalidatedAt");
  if (metadata.invalidatedAt && metadata.invalidationEvidenceRefs.length === 0) throw new Error("Invalidated memory requires invalidation evidence");
  if ((metadata.layer === "quarantined" || metadata.layer === "historical") && metadata.operationalEligible) throw new Error("Quarantined/historical memory cannot be operationally eligible");
  return freezeMetadata(metadata);
}

export function memoryOperationalEligibility(memory: BrainMemory<unknown>, metadata: LayeredMemoryMetadata, request: { ownerId: string; projectId?: string; companyId?: string; taskClass: string; now: string }): { eligible: boolean; reason: string } {
  validateLayeredMemoryMetadata(metadata);
  const now = parseTimestamp(request.now, "now");
  if (memory.id !== metadata.memoryId || memory.version !== metadata.memoryVersion) return { eligible: false, reason: "version_mismatch" };
  if (memory.ownerId !== request.ownerId) return { eligible: false, reason: "owner_boundary" };
  if (memory.projectId !== undefined && memory.projectId !== request.projectId) return { eligible: false, reason: "project_boundary" };
  if (metadata.companyId !== undefined && metadata.companyId !== request.companyId) return { eligible: false, reason: "company_boundary" };
  if (memory.state !== "current") return { eligible: false, reason: `memory_${memory.state}` };
  if (!metadata.operationalEligible) return { eligible: false, reason: `layer_${metadata.layer}_nonoperational` };
  if (metadata.taskClasses.length > 0 && !metadata.taskClasses.includes(request.taskClass)) return { eligible: false, reason: "task_inapplicable" };
  if (memory.retainUntil && now >= parseTimestamp(memory.retainUntil, "retainUntil")) return { eligible: false, reason: "retention_expired" };
  if (metadata.expiresAt && now >= parseTimestamp(metadata.expiresAt, "expiresAt")) return { eligible: false, reason: "memory_expired" };
  if (metadata.revalidateAfter && now >= parseTimestamp(metadata.revalidateAfter, "revalidateAfter")) return { eligible: false, reason: "revalidation_due" };
  if (metadata.invalidatedAt) return { eligible: false, reason: "memory_invalidated" };
  if (metadata.contradictionRefs.length > 0) return { eligible: false, reason: "unresolved_contradiction" };
  return { eligible: true, reason: "eligible" };
}

export class BrainMemoryLedger<T> {
  readonly #items: BrainMemory<T>[] = [];
  readonly #metadata = new Map<string, LayeredMemoryMetadata>();

  append(memory: BrainMemory<T>): void {
    if (!memory.id.trim() || !memory.ownerId.trim() || !Number.isSafeInteger(memory.version) || memory.version < 1) throw new Error("Memory identity/version are required");
    if (memory.confidence < 0 || memory.confidence > 1 || !Number.isFinite(memory.confidence)) throw new Error("Memory confidence must be 0..1");
    if (memory.sourceRefs.length === 0) throw new Error("Memory requires provenance");
    parseTimestamp(memory.recordedAt, "recordedAt");
    if (memory.retainUntil) parseTimestamp(memory.retainUntil, "retainUntil");
    if (this.#items.some((item) => item.id === memory.id)) throw new Error(`Memory already exists: ${memory.id}`);
    if (memory.state === "current" && memory.supersedes) {
      const previousIndex = this.#items.findIndex((item) => item.id === memory.supersedes && item.state === "current");
      if (previousIndex < 0) throw new Error(`Superseded memory is not current or missing: ${memory.supersedes}`);
      const previous = this.#items[previousIndex];
      if (!previous || previous.ownerId !== memory.ownerId || previous.projectId !== memory.projectId || previous.kind !== memory.kind) throw new Error("Memory correction must stay within owner/project/kind boundary");
      this.#items[previousIndex] = Object.freeze({ ...previous, state: "superseded" as const });
    }
    this.#items.push(Object.freeze({ ...memory, sourceRefs: Object.freeze([...memory.sourceRefs]) }));
  }

  attachLayer(metadata: LayeredMemoryMetadata): void {
    const memory = this.#items.find((item) => item.id === metadata.memoryId && item.version === metadata.memoryVersion);
    if (!memory) throw new Error("Layer metadata must reference an exact existing memory version");
    if (this.#metadata.has(metadata.memoryId)) throw new Error("Layer metadata already attached");
    this.#metadata.set(metadata.memoryId, validateLayeredMemoryMetadata(metadata));
  }

  operational(request: { ownerId: string; projectId?: string; companyId?: string; taskClass: string; now: string }): readonly { memory: BrainMemory<T>; metadata: LayeredMemoryMetadata }[] {
    const eligible: { memory: BrainMemory<T>; metadata: LayeredMemoryMetadata }[] = [];
    for (const memory of this.#items) {
      const metadata = this.#metadata.get(memory.id); if (!metadata) continue;
      if (memoryOperationalEligibility(memory, metadata, request).eligible) eligible.push(Object.freeze({ memory, metadata }));
    }
    return Object.freeze(eligible);
  }

  current(ownerId: string, projectId?: string): readonly BrainMemory<T>[] { return Object.freeze(this.#items.filter((item) => item.ownerId === ownerId && item.state === "current" && (projectId === undefined || item.projectId === projectId))); }
  history(id: string): readonly BrainMemory<T>[] { return Object.freeze(this.#items.filter((item) => item.id === id || item.supersedes === id)); }
}
