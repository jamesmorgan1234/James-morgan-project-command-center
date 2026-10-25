import { parseTimestamp } from "../security/types.js";

export type ObservationState = "current" | "superseded" | "corrected" | "retracted" | "tombstone";

export interface SourceObservation {
  readonly id: string;
  readonly sourceId: string;
  readonly sequence: number;
  readonly contentHash: string;
  readonly state: ObservationState;
  readonly observedAt: string;
  readonly effectiveAt: string;
  readonly ingestedAt: string;
  readonly supersedes?: string;
  readonly reason?: string;
  readonly providerRevisionId?: string;
}

function validateObservation(record: SourceObservation): void {
  if (!record.id.startsWith("observation:") || !record.sourceId.startsWith("source:") || !record.contentHash.trim()) throw new Error("Observation id/source/contentHash are required");
  if (!Number.isSafeInteger(record.sequence) || record.sequence < 1) throw new Error("Observation sequence must be positive");
  parseTimestamp(record.observedAt, "observation.observedAt");
  parseTimestamp(record.effectiveAt, "observation.effectiveAt");
  parseTimestamp(record.ingestedAt, "observation.ingestedAt");
  if ((record.state === "corrected" || record.state === "retracted" || record.state === "tombstone") && !record.reason?.trim()) throw new Error(`${record.state} observation requires a reason`);
}

export class ProvenanceLedger {
  readonly #records: SourceObservation[] = [];

  append(record: SourceObservation): SourceObservation {
    validateObservation(record);
    if (this.#records.some((item) => item.id === record.id)) throw new Error(`Observation already exists: ${record.id}`);
    const sourceHistory = this.#records.filter((item) => item.sourceId === record.sourceId);
    const prior = sourceHistory.at(-1);
    if (!prior) {
      if (record.sequence !== 1 || record.supersedes !== undefined) throw new Error("First source observation must start at sequence 1 without supersedes");
    } else {
      if (record.sequence !== prior.sequence + 1) throw new Error(`Observation sequence gap for ${record.sourceId}`);
      if (record.supersedes !== prior.id) throw new Error(`Observation must explicitly supersede ${prior.id}`);
      const index = this.#records.findIndex((item) => item.id === prior.id);
      if (index >= 0 && prior.state === "current") this.#records[index] = Object.freeze({ ...prior, state: "superseded" as const });
    }
    const frozen = Object.freeze({ ...record });
    this.#records.push(frozen);
    return frozen;
  }

  current(sourceId: string): SourceObservation | undefined {
    const latest = this.latest(sourceId);
    if (!latest || latest.state === "retracted" || latest.state === "tombstone" || latest.state === "superseded") return undefined;
    return latest;
  }

  latest(sourceId: string): SourceObservation | undefined {
    return [...this.#records].reverse().find((record) => record.sourceId === sourceId);
  }

  history(sourceId: string): readonly SourceObservation[] {
    return Object.freeze(this.#records.filter((record) => record.sourceId === sourceId));
  }
}

export interface ProvenanceRef {
  readonly observationId: string;
  readonly sourceId: string;
  readonly contentHash: string;
}

export function assertProvenanceRefs(refs: readonly ProvenanceRef[]): readonly ProvenanceRef[] {
  if (refs.length === 0) throw new Error("Derived or canonical claims require provenance references");
  const keys = refs.map((ref) => `${ref.observationId}|${ref.sourceId}|${ref.contentHash}`);
  if (new Set(keys).size !== keys.length) throw new Error("Provenance references must be unique");
  for (const ref of refs) if (!ref.observationId.startsWith("observation:") || !ref.sourceId.startsWith("source:") || !ref.contentHash.trim()) throw new Error("Invalid provenance reference");
  return Object.freeze(refs.map((ref) => Object.freeze({ ...ref })));
}
