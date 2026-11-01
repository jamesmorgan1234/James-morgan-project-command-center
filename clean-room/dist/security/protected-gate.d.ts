import type { EnvironmentName } from "../kernel/config.js";
import { AuthSessionStore } from "./auth.js";
import { DeviceRegistry } from "./devices.js";
import { type ProtectedIntent } from "./intent.js";
import { PolicyDecisionAuditLedger } from "./policy-audit.js";
import { PolicyEngine, type PolicyDecision } from "./policy.js";
export interface ProtectedActionRequest {
    readonly sessionId: string;
    readonly action: string;
    readonly resourceOwnerId: string;
    readonly resourceProjectId?: string;
    readonly resourceCompanyId?: string;
    readonly resourceAccountId?: string;
    readonly resourceEnvironment?: EnvironmentName;
    readonly now: string;
    readonly policyAvailable?: boolean;
    readonly revocationStateFresh?: boolean;
    readonly expectedPolicyEpoch?: number;
    readonly intent?: ProtectedIntent;
    readonly authorizationIntentBinding?: string;
}
export declare class ProtectedActionGate {
    #private;
    private readonly sessions;
    private readonly policies;
    private readonly devices;
    private readonly decisions;
    constructor(sessions: AuthSessionStore, policies: PolicyEngine, devices: DeviceRegistry, decisions?: PolicyDecisionAuditLedger);
    authorize(request: ProtectedActionRequest): PolicyDecision;
}
