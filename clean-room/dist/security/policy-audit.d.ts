import type { EnvironmentName } from "../kernel/config.js";
import type { PolicyDecision } from "./policy.js";
export interface PolicyDecisionAuditInput {
    readonly ownerId: string;
    readonly sessionId: string;
    readonly occurredAt: string;
    readonly action: string;
    readonly resourceOwnerId: string;
    readonly resourceProjectId?: string;
    readonly resourceCompanyId?: string;
    readonly resourceAccountId?: string;
    readonly resourceEnvironment?: EnvironmentName;
    readonly decision: PolicyDecision;
}
export interface PolicyDecisionAuditRecord extends PolicyDecisionAuditInput {
    readonly sequence: number;
}
export declare class PolicyDecisionAuditLedger {
    #private;
    append(input: PolicyDecisionAuditInput): PolicyDecisionAuditRecord;
    list(ownerId: string): readonly PolicyDecisionAuditRecord[];
}
