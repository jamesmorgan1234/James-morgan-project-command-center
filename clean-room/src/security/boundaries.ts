import type { EnvironmentName } from "../kernel/config.js";

export type BoundaryOperation = "read" | "write";

export interface DataBoundary {
  readonly ownerId: string;
  readonly projectId?: string;
  readonly companyId?: string;
  readonly businessId?: string;
  readonly accountId?: string;
  readonly environment?: EnvironmentName;
  readonly sensitivity: "internal" | "sensitive" | "protected" | "secret";
}

export interface BoundaryGrant {
  readonly ownerId: string;
  readonly projectIds: readonly string[];
  readonly businessIds: readonly string[];
  readonly companyIds?: readonly string[];
  readonly accountIds?: readonly string[];
  readonly environments?: readonly EnvironmentName[];
  readonly operations?: readonly BoundaryOperation[];
}

export interface BoundaryDecision {
  readonly allowed: boolean;
  readonly reason: string;
}

export function evaluateDataBoundary(grant: BoundaryGrant, boundary: DataBoundary, operation: BoundaryOperation = "read"): BoundaryDecision {
  const operations = grant.operations ?? ["read"];
  if (!operations.includes(operation)) return Object.freeze({ allowed: false, reason: "operation_not_granted" });
  if (grant.ownerId !== boundary.ownerId) return Object.freeze({ allowed: false, reason: "owner_boundary_mismatch" });
  if (boundary.projectId && !grant.projectIds.includes(boundary.projectId)) return Object.freeze({ allowed: false, reason: "project_boundary_mismatch" });
  if (boundary.companyId && !(grant.companyIds ?? []).includes(boundary.companyId)) return Object.freeze({ allowed: false, reason: "company_boundary_mismatch" });
  if (boundary.businessId && !grant.businessIds.includes(boundary.businessId)) return Object.freeze({ allowed: false, reason: "business_boundary_mismatch" });
  if (boundary.accountId && !(grant.accountIds ?? []).includes(boundary.accountId)) return Object.freeze({ allowed: false, reason: "account_boundary_mismatch" });
  if (boundary.environment && !(grant.environments ?? []).includes(boundary.environment)) return Object.freeze({ allowed: false, reason: "environment_boundary_mismatch" });
  return Object.freeze({ allowed: true, reason: "allowed" });
}

export function assertDataBoundary(grant: BoundaryGrant, boundary: DataBoundary, operation: BoundaryOperation = "read"): void {
  const decision = evaluateDataBoundary(grant, boundary, operation);
  if (!decision.allowed) throw new Error(`Data boundary denied: ${decision.reason}`);
}
