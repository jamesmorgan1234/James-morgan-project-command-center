import type { EnvironmentName } from "../kernel/config.js";
import { type AssuranceLevel, type RiskClass, type SecuritySubject } from "./types.js";
export interface PolicyRule {
    readonly action: string;
    readonly version: number;
    readonly enabled: boolean;
    readonly riskClass: RiskClass;
    readonly requiredScopes: readonly string[];
    readonly minimumAssurance: AssuranceLevel;
    readonly freshVerificationMaxAgeMs?: number;
    readonly ownerOnly: boolean;
    readonly allowProjectWildcard: boolean;
    readonly policyEpoch?: number;
}
export interface PolicyRequest {
    readonly action: string;
    readonly subject: SecuritySubject;
    readonly resourceOwnerId: string;
    readonly resourceProjectId?: string;
    readonly resourceCompanyId?: string;
    readonly resourceAccountId?: string;
    readonly resourceEnvironment?: EnvironmentName;
    readonly now: string;
    readonly policyAvailable?: boolean;
    readonly revocationStateFresh?: boolean;
    readonly expectedPolicyEpoch?: number;
}
export interface PolicyDecision {
    readonly allowed: boolean;
    readonly action: string;
    readonly riskClass: RiskClass;
    readonly reason: string;
    readonly ruleVersion?: number;
    readonly policyEpoch?: number;
}
export declare class PolicyEngine {
    #private;
    register(rule: PolicyRule): void;
    replace(rule: PolicyRule, expectedVersion: number): void;
    evaluate(request: PolicyRequest): PolicyDecision;
    failClosed(action: string, reason: string): PolicyDecision;
    assertAllowed(request: PolicyRequest): PolicyDecision;
}
