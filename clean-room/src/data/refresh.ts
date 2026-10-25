import { parseTimestamp } from "../security/types.js";

export type CapabilityTruth = "verified_supported" | "verified_unsupported" | "unverified";

export interface EnumerationCapability {
  readonly enumerateAll: CapabilityTruth;
  readonly stableIds: CapabilityTruth;
  readonly updatedMetadata: CapabilityTruth;
  readonly revisionIds: CapabilityTruth;
  readonly contentHashes: CapabilityTruth;
  readonly deltaFetch: CapabilityTruth;
  readonly deletionDetection: CapabilityTruth;
  readonly stablePagination: CapabilityTruth;
}

export interface SourceFingerprint {
  readonly stableId: string;
  readonly updatedAt?: string;
  readonly revisionId?: string;
  readonly contentHash?: string;
  readonly messageCount?: number;
  readonly byteSize?: number;
  readonly title?: string;
}

export type RefreshClassification = "changed" | "unchanged" | "uncertain";

export function classifyRefresh(previous: SourceFingerprint | undefined, next: SourceFingerprint): RefreshClassification {
  if (!next.stableId.trim()) throw new Error("Fingerprint stableId is required");
  if (!previous) return "changed";
  if (previous.stableId !== next.stableId) throw new Error("Cannot classify different stable source ids");
  if (previous.contentHash && next.contentHash) return previous.contentHash === next.contentHash ? "unchanged" : "changed";
  if (previous.revisionId && next.revisionId) return previous.revisionId === next.revisionId ? "unchanged" : "changed";
  if (previous.messageCount !== undefined && next.messageCount !== undefined && previous.messageCount !== next.messageCount) return "changed";
  if (previous.updatedAt && next.updatedAt && previous.updatedAt !== next.updatedAt) return "changed";
  const strongComparable = previous.messageCount !== undefined && next.messageCount !== undefined && previous.updatedAt !== undefined && next.updatedAt !== undefined;
  if (strongComparable && previous.messageCount === next.messageCount && previous.updatedAt === next.updatedAt) return "unchanged";
  // Byte size or title equality alone is never sufficient to call content unchanged.
  return "uncertain";
}

export interface EnumerationPage {
  readonly cursor?: string;
  readonly nextCursor?: string;
  readonly stableIds: readonly string[];
  readonly consistencyToken?: string;
}

export type EnumerationStabilityReason =
  | "stable_complete"
  | "no_pages"
  | "pagination_stability_unverified"
  | "cursor_chain_changed"
  | "cursor_loop"
  | "duplicate_source_during_enumeration"
  | "enumeration_changed_during_pagination"
  | "enumeration_fingerprint_changed"
  | "not_terminal";

export interface EnumerationStabilityResult {
  readonly complete: boolean;
  readonly restartRequired: boolean;
  readonly reason: EnumerationStabilityReason;
  readonly enumeratedCount: number;
}

function normalizedOptionalToken(value: string | undefined, label: string): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.trim();
  if (!normalized) throw new Error(`${label} cannot be empty`);
  return normalized;
}

export function evaluateEnumerationStability(input: {
  readonly stablePagination: CapabilityTruth;
  readonly pages: readonly EnumerationPage[];
  readonly startFingerprint?: string;
  readonly endFingerprint?: string;
}): EnumerationStabilityResult {
  if (input.pages.length === 0) return Object.freeze({ complete: false, restartRequired: false, reason: "no_pages", enumeratedCount: 0 });

  const startFingerprint = normalizedOptionalToken(input.startFingerprint, "startFingerprint");
  const endFingerprint = normalizedOptionalToken(input.endFingerprint, "endFingerprint");
  if ((startFingerprint === undefined) !== (endFingerprint === undefined)) throw new Error("Enumeration fingerprints must provide both start and end values");
  if (startFingerprint !== undefined && startFingerprint !== endFingerprint) {
    return Object.freeze({ complete: false, restartRequired: true, reason: "enumeration_fingerprint_changed", enumeratedCount: 0 });
  }

  const seenIds = new Set<string>();
  const seenCursors = new Set<string>();
  let priorNextCursor: string | undefined;
  let consistencyToken: string | undefined;
  let allPagesHaveConsistencyToken = true;

  for (let index = 0; index < input.pages.length; index += 1) {
    const page = input.pages[index]!;
    const cursor = normalizedOptionalToken(page.cursor, `pages[${index}].cursor`);
    const nextCursor = normalizedOptionalToken(page.nextCursor, `pages[${index}].nextCursor`);
    const pageToken = normalizedOptionalToken(page.consistencyToken, `pages[${index}].consistencyToken`);

    if (index > 0 && cursor !== priorNextCursor) {
      return Object.freeze({ complete: false, restartRequired: true, reason: "cursor_chain_changed", enumeratedCount: seenIds.size });
    }
    if (cursor !== undefined) {
      if (seenCursors.has(cursor)) return Object.freeze({ complete: false, restartRequired: true, reason: "cursor_loop", enumeratedCount: seenIds.size });
      seenCursors.add(cursor);
    }
    if (nextCursor !== undefined && (nextCursor === cursor || seenCursors.has(nextCursor))) {
      return Object.freeze({ complete: false, restartRequired: true, reason: "cursor_loop", enumeratedCount: seenIds.size });
    }

    if (pageToken === undefined) {
      allPagesHaveConsistencyToken = false;
    } else if (consistencyToken === undefined) {
      consistencyToken = pageToken;
    } else if (pageToken !== consistencyToken) {
      return Object.freeze({ complete: false, restartRequired: true, reason: "enumeration_changed_during_pagination", enumeratedCount: seenIds.size });
    }

    const pageIds = new Set<string>();
    for (const rawId of page.stableIds) {
      const stableId = rawId.trim();
      if (!stableId) throw new Error(`pages[${index}].stableIds cannot contain empty ids`);
      if (pageIds.has(stableId) || seenIds.has(stableId)) {
        return Object.freeze({ complete: false, restartRequired: true, reason: "duplicate_source_during_enumeration", enumeratedCount: seenIds.size });
      }
      pageIds.add(stableId);
      seenIds.add(stableId);
    }
    priorNextCursor = nextCursor;
  }

  if (priorNextCursor !== undefined) {
    return Object.freeze({ complete: false, restartRequired: false, reason: "not_terminal", enumeratedCount: seenIds.size });
  }

  const multiPage = input.pages.length > 1;
  if (multiPage && input.stablePagination !== "verified_supported" && !allPagesHaveConsistencyToken) {
    return Object.freeze({ complete: false, restartRequired: false, reason: "pagination_stability_unverified", enumeratedCount: seenIds.size });
  }

  return Object.freeze({ complete: true, restartRequired: false, reason: "stable_complete", enumeratedCount: seenIds.size });
}

export interface RefreshLease {
  readonly sourceId: string;
  readonly holderId: string;
  readonly generation: number;
  readonly acquiredAt: string;
  readonly expiresAt: string;
}

export class RefreshLeaseManager {
  readonly #leases = new Map<string, RefreshLease>();
  readonly #generation = new Map<string, number>();

  acquire(sourceId: string, holderId: string, acquiredAt: string, expiresAt: string): RefreshLease {
    if (!sourceId.startsWith("source:") || !holderId.trim()) throw new Error("Refresh source/holder identity is required");
    const now = parseTimestamp(acquiredAt, "acquiredAt");
    const expiry = parseTimestamp(expiresAt, "expiresAt");
    if (expiry <= now) throw new Error("Refresh lease expiry must be after acquisition");
    const current = this.#leases.get(sourceId);
    if (current && now < parseTimestamp(current.expiresAt, "current.expiresAt")) throw new Error(`Source refresh already leased: ${sourceId}`);
    const generation = (this.#generation.get(sourceId) ?? 0) + 1;
    this.#generation.set(sourceId, generation);
    const lease = Object.freeze({ sourceId, holderId, generation, acquiredAt, expiresAt });
    this.#leases.set(sourceId, lease);
    return lease;
  }

  assertCommit(sourceId: string, holderId: string, generation: number, now: string): void {
    const lease = this.#leases.get(sourceId);
    if (!lease) throw new Error(`No refresh lease: ${sourceId}`);
    if (lease.holderId !== holderId || lease.generation !== generation) throw new Error("Stale refresh generation rejected");
    if (parseTimestamp(now, "now") >= parseTimestamp(lease.expiresAt, "expiresAt")) throw new Error("Expired refresh lease cannot commit");
  }
}

export type InventoryItemState = "readable" | "unreadable" | "tombstone";

export interface InventoryItem {
  readonly stableId: string;
  readonly state: InventoryItemState;
  readonly reason?: string;
}

export interface RefreshCoverage {
  readonly enumerationComplete: boolean;
  readonly expectedCount?: number;
  readonly items: readonly InventoryItem[];
}

export function evaluateCoverage(coverage: RefreshCoverage): Readonly<{ complete: boolean; readable: number; unreadable: number; tombstones: number; unaccounted: number }> {
  const unique = new Set(coverage.items.map((item) => item.stableId));
  if (unique.size !== coverage.items.length || coverage.items.some((item) => !item.stableId.trim())) throw new Error("Refresh inventory stable ids must be unique/non-empty");
  for (const item of coverage.items) if ((item.state === "unreadable" || item.state === "tombstone") && !item.reason?.trim()) throw new Error(`${item.state} inventory item requires reason`);
  const readable = coverage.items.filter((item) => item.state === "readable").length;
  const unreadable = coverage.items.filter((item) => item.state === "unreadable").length;
  const tombstones = coverage.items.filter((item) => item.state === "tombstone").length;
  const expected = coverage.expectedCount ?? coverage.items.length;
  const unaccounted = Math.max(0, expected - coverage.items.length);
  return Object.freeze({ complete: coverage.enumerationComplete && unaccounted === 0, readable, unreadable, tombstones, unaccounted });
}

export interface RefreshCandidate {
  readonly stableId: string;
  readonly classification: RefreshClassification;
  readonly updatedAt?: string;
  readonly lastCheckedAt?: string;
}

export function fairRefreshOrder(candidates: readonly RefreshCandidate[], oldItemEvery = 4): readonly RefreshCandidate[] {
  if (!Number.isSafeInteger(oldItemEvery) || oldItemEvery < 2) throw new Error("oldItemEvery must be an integer >= 2");
  const actionable = candidates.filter((item) => item.classification !== "unchanged");
  const newest = [...actionable].sort((a, b) => Date.parse(b.updatedAt ?? "1970-01-01T00:00:00Z") - Date.parse(a.updatedAt ?? "1970-01-01T00:00:00Z") || a.stableId.localeCompare(b.stableId));
  const oldestUnchecked = [...actionable].sort((a, b) => Date.parse(a.lastCheckedAt ?? "1970-01-01T00:00:00Z") - Date.parse(b.lastCheckedAt ?? "1970-01-01T00:00:00Z") || a.stableId.localeCompare(b.stableId));
  const output: RefreshCandidate[] = [];
  const used = new Set<string>();
  let newIndex = 0;
  let oldIndex = 0;
  while (output.length < actionable.length) {
    const useOld = output.length > 0 && (output.length + 1) % oldItemEvery === 0;
    const source = useOld ? oldestUnchecked : newest;
    let index = useOld ? oldIndex : newIndex;
    while (index < source.length && used.has(source[index]!.stableId)) index += 1;
    if (index >= source.length) {
      const fallback = useOld ? newest : oldestUnchecked;
      index = 0;
      while (index < fallback.length && used.has(fallback[index]!.stableId)) index += 1;
      if (index >= fallback.length) break;
      const chosen = fallback[index]!;
      used.add(chosen.stableId);
      output.push(chosen);
    } else {
      const chosen = source[index]!;
      used.add(chosen.stableId);
      output.push(chosen);
      if (useOld) oldIndex = index + 1; else newIndex = index + 1;
    }
  }
  return Object.freeze(output);
}
