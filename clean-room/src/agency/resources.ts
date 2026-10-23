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
