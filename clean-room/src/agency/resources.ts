import { parseTimestamp } from "../security/types.js";

export type ResourceClaimMode = "shared" | "exclusive";

export interface ResourceRequest {
  readonly resourceKey: string;
  readonly mode: ResourceClaimMode;
}

export interface ResourceClaim {
  readonly ownerKey: string;
  readonly resourceKey: string;
  readonly mode: ResourceClaimMode;
}

export class ResourceClaimManager {
  readonly #claims = new Map<string, ResourceClaim[]>();

  claim(ownerKey: string, requests: readonly ResourceRequest[]): readonly ResourceClaim[] {
    const ordered = [...requests].sort((a, b) => a.resourceKey.localeCompare(b.resourceKey));
    if (new Set(ordered.map((request) => request.resourceKey)).size !== ordered.length) throw new Error("Resource request bundle cannot contain duplicate keys");
    for (const request of ordered) {
      const existing = this.#claims.get(request.resourceKey) ?? [];
      if (existing.some((claim) => claim.ownerKey !== ownerKey && (claim.mode === "exclusive" || request.mode === "exclusive"))) throw new Error(`Resource conflict: ${request.resourceKey}`);
    }
    const created: ResourceClaim[] = [];
    for (const request of ordered) {
      const claim = Object.freeze({ ownerKey, resourceKey: request.resourceKey, mode: request.mode });
      const existing = this.#claims.get(request.resourceKey) ?? [];
      this.#claims.set(request.resourceKey, [...existing, claim]);
      created.push(claim);
    }
    return Object.freeze(created);
  }

  releaseOwner(ownerKey: string): void {
    for (const [key, claims] of this.#claims) {
      const remaining = claims.filter((claim) => claim.ownerKey !== ownerKey);
      if (remaining.length === 0) this.#claims.delete(key); else this.#claims.set(key, remaining);
    }
  }
}

export interface LeasedResourceClaim extends ResourceClaim {
  readonly claimId: string;
  readonly generation: number;
  readonly acquiredAt: string;
  readonly expiresAt: string;
  readonly evidenceRefs: readonly string[];
  readonly releasedAt?: string;
}

export interface ResourceRecoveryEvent {
  readonly claimId: string;
  readonly resourceKey: string;
  readonly priorOwnerKey: string;
  readonly generation: number;
  readonly recoveredAt: string;
  readonly evidenceRefs: readonly string[];
}

export function recoverExpiredResourceClaims(claims: readonly LeasedResourceClaim[], now: string, evidenceRefs: readonly string[]): Readonly<{ claims: readonly LeasedResourceClaim[]; events: readonly ResourceRecoveryEvent[] }> {
  const nowMs = parseTimestamp(now, "now");
  if (evidenceRefs.length === 0 || new Set(evidenceRefs).size !== evidenceRefs.length || evidenceRefs.some((ref) => !ref.trim())) throw new Error("Resource recovery requires unique evidence references");
  const events: ResourceRecoveryEvent[] = [];
  const next = claims.map((claim) => {
    if (!claim.claimId.trim() || !claim.ownerKey.trim() || !claim.resourceKey.trim() || !Number.isSafeInteger(claim.generation) || claim.generation < 1) throw new Error("Invalid leased resource claim");
    const acquiredMs = parseTimestamp(claim.acquiredAt, "claim.acquiredAt");
    const expiresMs = parseTimestamp(claim.expiresAt, "claim.expiresAt");
    if (expiresMs <= acquiredMs) throw new Error("Resource claim expiry must follow acquisition");
    if (claim.evidenceRefs.length === 0) throw new Error("Resource claim requires evidence");
    if (claim.releasedAt || expiresMs > nowMs) return Object.freeze({ ...claim, evidenceRefs: Object.freeze([...claim.evidenceRefs]) });
    events.push(Object.freeze({ claimId: claim.claimId, resourceKey: claim.resourceKey, priorOwnerKey: claim.ownerKey, generation: claim.generation, recoveredAt: now, evidenceRefs: Object.freeze([...evidenceRefs]) }));
    return Object.freeze({ ...claim, evidenceRefs: Object.freeze([...claim.evidenceRefs]), releasedAt: now });
  });
  events.sort((a, b) => a.resourceKey.localeCompare(b.resourceKey) || a.claimId.localeCompare(b.claimId));
  return Object.freeze({ claims: Object.freeze(next), events: Object.freeze(events) });
}
