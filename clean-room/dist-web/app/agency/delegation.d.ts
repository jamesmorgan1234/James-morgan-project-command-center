import type { AdmissionPolicy } from "../kernel/admission.js";
import type { EnvironmentName } from "../kernel/config.js";
export interface DelegationEnvelope {
    readonly parentTaskId: string;
    readonly childTaskId: string;
    readonly depth: number;
    readonly parentScopes: readonly string[];
    readonly childScopes: readonly string[];
    readonly capability: string;
}
export declare function validateDelegation(envelope: DelegationEnvelope, maxDepth: number, currentFanOut: number, maxFanOut: number): void;
export interface DelegationScope {
    readonly ownerId: string;
    readonly companyId?: string;
    readonly projectId: string;
    readonly accountId?: string;
    readonly environment: EnvironmentName;
}
export interface DelegatedAuthorityEnvelope extends DelegationEnvelope {
    readonly controllingOrchestrator: "command-center";
    readonly parentSubjectId: string;
    readonly childSubjectId: string;
    readonly parentScope: DelegationScope;
    readonly childScope: DelegationScope;
    readonly parentAdmission: AdmissionPolicy;
    readonly childAdmission: AdmissionPolicy;
    readonly parentResourceLimits: Readonly<Record<string, number>>;
    readonly childResourceLimits: Readonly<Record<string, number>>;
    readonly policyVersion: string;
    readonly currentPolicyVersion: string;
    readonly issuedAt: string;
    readonly expiresAt: string;
    readonly revoked: boolean;
    readonly evidenceRefs: readonly string[];
}
export declare function validateDelegatedAuthority(envelope: DelegatedAuthorityEnvelope, maxDepth: number, currentFanOut: number, maxFanOut: number, now: string): void;
