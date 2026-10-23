export interface DataBoundary {
  readonly ownerId: string;
  readonly projectId?: string;
  readonly businessId?: string;
  readonly sensitivity: "internal" | "sensitive" | "protected" | "secret";
}

export interface BoundaryGrant {
  readonly ownerId: string;
  readonly projectIds: readonly string[];
  readonly businessIds: readonly string[];
}

export interface BoundaryDecision {
  readonly allowed: boolean;
  readonly reason: string;
}

export function evaluateDataBoundary(grant: BoundaryGrant, boundary: DataBoundary): BoundaryDecision {
  if (grant.ownerId !== boundary.ownerId) return Object.freeze({ allowed: false, reason: "owner_boundary_mismatch" });
  if (boundary.projectId && !grant.projectIds.includes(boundary.projectId)) return Object.freeze({ allowed: false, reason: "project_boundary_mismatch" });
  if (boundary.businessId && !grant.businessIds.includes(boundary.businessId)) return Object.freeze({ allowed: false, reason: "business_boundary_mismatch" });
  return Object.freeze({ allowed: true, reason: "allowed" });
}

export function assertDataBoundary(grant: BoundaryGrant, boundary: DataBoundary): void {
  const decision = evaluateDataBoundary(grant, boundary);
  if (!decision.allowed) throw new Error(`Data boundary denied: ${decision.reason}`);
}
