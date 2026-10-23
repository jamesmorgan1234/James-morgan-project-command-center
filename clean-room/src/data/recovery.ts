import type { ProviderContract } from "./providers.js";

export interface ProjectionEvent {
  readonly sequence: number;
  readonly eventId: string;
  readonly payloadHash: string;
}

export interface ProjectionRebuildEvidence {
  readonly eventCount: number;
  readonly firstSequence: number;
  readonly lastSequence: number;
  readonly hashChain: string;
}

export function rebuildProjection(events: readonly ProjectionEvent[]): ProjectionRebuildEvidence {
  if (events.length === 0) return Object.freeze({ eventCount: 0, firstSequence: 0, lastSequence: 0, hashChain: "" });
  let expected = 1;
  const ids = new Set<string>();
  const chain: string[] = [];
  for (const event of events) {
    if (event.sequence !== expected) throw new Error(`Projection sequence gap: expected ${expected}, received ${event.sequence}`);
    if (ids.has(event.eventId)) throw new Error(`Duplicate projection event: ${event.eventId}`);
    if (!event.payloadHash.trim()) throw new Error(`Projection event requires payload hash: ${event.eventId}`);
    ids.add(event.eventId);
    chain.push(`${event.sequence}:${event.eventId}:${event.payloadHash}`);
    expected += 1;
  }
  return Object.freeze({ eventCount: events.length, firstSequence: 1, lastSequence: events.length, hashChain: chain.join("|") });
}

export function assertProviderReplacement(oldProvider: ProviderContract, replacement: ProviderContract, requiredCapabilities: readonly string[], freeFirst: boolean): void {
  for (const capability of requiredCapabilities) if (!replacement.capabilities.includes(capability)) throw new Error(`Replacement provider missing capability: ${capability}`);
  if (!replacement.enabled || replacement.health === "unavailable" || replacement.health === "unconfigured") throw new Error("Replacement provider is not operationally eligible");
  if (freeFirst && replacement.cost === "paid") throw new Error("Paid replacement violates free-first without owner authorization");
  if (replacement.key === oldProvider.key && replacement.version <= oldProvider.version) throw new Error("Same provider replacement must advance version");
}
