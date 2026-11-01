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
export declare function evaluateDataBoundary(grant: BoundaryGrant, boundary: DataBoundary, operation?: BoundaryOperation): BoundaryDecision;
export declare function assertDataBoundary(grant: BoundaryGrant, boundary: DataBoundary, operation?: BoundaryOperation): void;
