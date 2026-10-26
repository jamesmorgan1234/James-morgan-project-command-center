export type NeedEnvironment = "pc" | "phone" | "local_browser" | "any_device";
export type NeedUrgency = "critical" | "high" | "normal" | "low";

const URGENCY_RANK: Readonly<Record<NeedUrgency, number>> = Object.freeze({ critical: 0, high: 1, normal: 2, low: 3 });

export interface OwnerNeed {
  readonly id: string;
  readonly ownerId: string;
  readonly needKey: string;
  readonly title: string;
  readonly reason: string;
  readonly urgency: NeedUrgency;
  readonly requiredEnvironment: NeedEnvironment;
  readonly ownerAction: string;
  readonly unlockRefs: readonly string[];
  readonly resumeRefs: readonly string[];
  readonly sourceRefs: readonly string[];
  readonly state: "open" | "acknowledged" | "resolved";
}

export interface NeedResolution {
  readonly ownerId: string;
  readonly needKey: string;
  readonly resolvedNeedId: string;
  readonly resolvedAt: string;
  readonly evidenceRefs: readonly string[];
  readonly unlockRefs: readonly string[];
  readonly resumeRefs: readonly string[];
}

export interface NeedsMeSnapshot {
  readonly schemaVersion: "cc-needs-me-v1";
  readonly needs: readonly OwnerNeed[];
  readonly resolutions: readonly NeedResolution[];
}

function uniqueNonBlank(values: readonly string[], label: string, requireOne = true): readonly string[] {
  if (requireOne && values.length === 0) throw new Error(`${label} requires at least one value`);
  const normalized = values.map((value) => value.trim());
  if (normalized.some((value) => !value) || new Set(normalized).size !== normalized.length) throw new Error(`${label} must be unique and nonblank`);
  return Object.freeze(normalized);
}

function scopedNeedKey(ownerId: string, needKey: string): string { return `${ownerId}:${needKey}`; }
function timestamp(value: string, label: string): void { if (!Number.isFinite(Date.parse(value))) throw new Error(`${label} must be a valid timestamp`); }

function validateNeed(need: OwnerNeed): OwnerNeed {
  if (!need.id.trim() || !need.ownerId.trim() || !need.needKey.trim() || !need.title.trim() || !need.reason.trim() || !need.ownerAction.trim()) throw new Error("Needs Me identity/key/title/reason/action are required");
  return Object.freeze({ ...need, unlockRefs: uniqueNonBlank(need.unlockRefs, "Needs Me unlock refs"), resumeRefs: uniqueNonBlank(need.resumeRefs, "Needs Me resume refs"), sourceRefs: uniqueNonBlank(need.sourceRefs, "Needs Me source refs") });
}

export class NeedsMeQueue {
  readonly #needs = new Map<string, OwnerNeed>();
  readonly #resolutions = new Map<string, NeedResolution>();

  static rehydrate(snapshot: NeedsMeSnapshot): NeedsMeQueue {
    if (snapshot.schemaVersion !== "cc-needs-me-v1") throw new Error("Unsupported Needs Me snapshot");
    const queue = new NeedsMeQueue();
    for (const need of snapshot.needs) {
      const valid = validateNeed(need);
      if (queue.#needs.has(valid.id)) throw new Error(`Duplicate persisted Needs Me id: ${valid.id}`);
      queue.#needs.set(valid.id, valid);
    }
    for (const resolution of snapshot.resolutions) {
      if (!resolution.ownerId.trim() || !resolution.needKey.trim() || !resolution.resolvedNeedId.trim()) throw new Error("Needs Me resolution identity is required");
      timestamp(resolution.resolvedAt, "Needs Me resolvedAt");
      const frozen = Object.freeze({ ...resolution, evidenceRefs: uniqueNonBlank(resolution.evidenceRefs, "Needs Me resolution evidence"), unlockRefs: uniqueNonBlank(resolution.unlockRefs, "Needs Me resolution unlock refs"), resumeRefs: uniqueNonBlank(resolution.resumeRefs, "Needs Me resolution resume refs") });
      const key = scopedNeedKey(frozen.ownerId, frozen.needKey);
      if (queue.#resolutions.has(key)) throw new Error(`Duplicate persisted Needs Me resolution: ${key}`);
      queue.#resolutions.set(key, frozen);
    }
    return queue;
  }

  upsert(input: OwnerNeed): void {
    const need = validateNeed(input);
    const scopeKey = scopedNeedKey(need.ownerId, need.needKey);
    if (this.#resolutions.has(scopeKey)) return;
    const current = [...this.#needs.values()].find((candidate) => candidate.ownerId === need.ownerId && candidate.needKey === need.needKey && candidate.state !== "resolved");
    if (!current) { this.#needs.set(need.id, need); return; }
    if (current.ownerAction !== need.ownerAction || current.requiredEnvironment !== need.requiredEnvironment) throw new Error("Needs Me needKey collision has different owner action or environment");
    const urgency = URGENCY_RANK[need.urgency] < URGENCY_RANK[current.urgency] ? need.urgency : current.urgency;
    const merged = Object.freeze({ ...current, urgency, unlockRefs: Object.freeze([...new Set([...current.unlockRefs, ...need.unlockRefs])]), resumeRefs: Object.freeze([...new Set([...current.resumeRefs, ...need.resumeRefs])]), sourceRefs: Object.freeze([...new Set([...current.sourceRefs, ...need.sourceRefs])]) });
    this.#needs.set(current.id, merged);
  }

  resolve(id: string): OwnerNeed {
    const current = this.#needs.get(id);
    if (!current) throw new Error(`Unknown Needs Me item: ${id}`);
    const updated = Object.freeze({ ...current, state: "resolved" as const });
    this.#needs.set(id, updated);
    return updated;
  }

  resolveByKey(ownerId: string, needKey: string, resolvedAt: string, evidenceRefs: readonly string[]): NeedResolution {
    timestamp(resolvedAt, "Needs Me resolvedAt");
    const key = scopedNeedKey(ownerId, needKey);
    const prior = this.#resolutions.get(key);
    if (prior) return prior;
    const current = [...this.#needs.values()].find((candidate) => candidate.ownerId === ownerId && candidate.needKey === needKey && candidate.state !== "resolved");
    if (!current) throw new Error(`Unknown open Needs Me key: ${key}`);
    const resolution = Object.freeze({ ownerId, needKey, resolvedNeedId: current.id, resolvedAt, evidenceRefs: uniqueNonBlank(evidenceRefs, "Needs Me resolution evidence"), unlockRefs: Object.freeze([...current.unlockRefs]), resumeRefs: Object.freeze([...current.resumeRefs]) });
    this.#needs.set(current.id, Object.freeze({ ...current, state: "resolved" as const }));
    this.#resolutions.set(key, resolution);
    return resolution;
  }

  resolution(ownerId: string, needKey: string): NeedResolution | undefined { return this.#resolutions.get(scopedNeedKey(ownerId, needKey)); }
  open(): readonly OwnerNeed[] { return Object.freeze([...this.#needs.values()].filter((need) => need.state !== "resolved" && !this.#resolutions.has(scopedNeedKey(need.ownerId, need.needKey))).sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || b.unlockRefs.length - a.unlockRefs.length)); }
  exportSnapshot(): NeedsMeSnapshot { return Object.freeze({ schemaVersion: "cc-needs-me-v1", needs: Object.freeze([...this.#needs.values()]), resolutions: Object.freeze([...this.#resolutions.values()]) }); }
}
