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

export class NeedsMeQueue {
  readonly #needs = new Map<string, OwnerNeed>();

  upsert(need: OwnerNeed): void {
    if (!need.id.trim() || !need.ownerId.trim() || !need.needKey.trim() || !need.title.trim() || !need.ownerAction.trim()) throw new Error("Needs Me identity/key/title/action are required");
    if (need.unlockRefs.length === 0 || need.resumeRefs.length === 0 || need.sourceRefs.length === 0) throw new Error("Needs Me item requires unlock/resume/source lineage");
    const current = [...this.#needs.values()].find((candidate) => candidate.ownerId === need.ownerId && candidate.needKey === need.needKey && candidate.state !== "resolved");
    if (!current) { this.#needs.set(need.id, Object.freeze({ ...need, unlockRefs: Object.freeze([...need.unlockRefs]), resumeRefs: Object.freeze([...need.resumeRefs]), sourceRefs: Object.freeze([...need.sourceRefs]) })); return; }
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

  open(): readonly OwnerNeed[] { return Object.freeze([...this.#needs.values()].filter((need) => need.state !== "resolved").sort((a, b) => URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency] || b.unlockRefs.length - a.unlockRefs.length)); }
}
