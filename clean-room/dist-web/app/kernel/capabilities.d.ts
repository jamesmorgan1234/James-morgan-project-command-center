import { type RegistryRecord } from "./registry.js";
export type CapabilityMaturity = "local" | "cross_company_evidence" | "portfolio_candidate" | "portfolio_proven" | "critical_shared_proven";
export type CapabilityProofStatus = "verified" | "rejected" | "stale" | "unknown";
export type CapabilityProofResult = "passed" | "failed" | "inapplicable" | "unknown";
export interface CapabilityProofReceipt {
    readonly id: string;
    readonly evidenceId: string;
    readonly capabilityKey: string;
    readonly capabilityVersion: number;
    readonly methodVersion: string;
    readonly companyId: string;
    readonly independenceKey: string;
    readonly applicability: readonly string[];
    readonly result: CapabilityProofResult;
    readonly status: CapabilityProofStatus;
}
export type CapabilityProofResolver = (proofId: string) => CapabilityProofReceipt | undefined;
export interface CapabilityContract extends RegistryRecord {
    readonly inputVersion: number;
    readonly outputVersion: number;
    readonly compatibleInputVersions: readonly number[];
    readonly compatibleOutputVersions: readonly number[];
    readonly maturity: CapabilityMaturity;
    /** Compatibility/display metadata only. Never qualifies maturity by itself. */
    readonly proofCompanyIds?: readonly string[];
    /** Canonical evidence-backed proof receipts used to qualify non-local maturity. */
    readonly proofEvidenceIds?: readonly string[];
    readonly criticalEvidenceId?: string;
    readonly criticalShared: boolean;
    readonly securityClass: "internal" | "sensitive" | "protected" | "secret";
    readonly canPin: boolean;
    readonly canFork: boolean;
}
export declare function validateCapabilityContract(contract: CapabilityContract, proofResolver?: CapabilityProofResolver): readonly CapabilityProofReceipt[];
export declare class CapabilityRegistry {
    #private;
    constructor(options?: {
        readonly proofResolver?: CapabilityProofResolver;
    });
    register(contract: CapabilityContract): void;
    replace(contract: CapabilityContract, expectedVersion: number): void;
    get(key: string): CapabilityContract | undefined;
    list(): readonly CapabilityContract[];
    has(key: string): boolean;
    enable(key: string, expectedVersion: number, nextVersion: number): CapabilityContract;
    disable(key: string, expectedVersion: number, nextVersion: number): CapabilityContract;
    unregister(key: string, expectedVersion: number): CapabilityContract;
    assertCompatible(key: string, inputVersion: number, outputVersion: number): CapabilityContract;
}
