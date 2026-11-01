import type { EnvironmentName } from "../kernel/config.js";
import type { ProtectedIntent } from "./intent.js";
import { PolicyEngine } from "./policy.js";
import { ProtectedAuthorizationRegistry } from "./protected-authorizations.js";
import { ProtectedActionGate } from "./protected-gate.js";
import type { AssuranceLevel, RiskClass } from "./types.js";
export declare const PROTECTED_ACTION_CLASSES: readonly ["money", "purchase", "publishing", "send", "merge_deploy", "destructive", "security", "credential", "legal", "protected_asset"];
export type ProtectedActionClass = (typeof PROTECTED_ACTION_CLASSES)[number];
export interface ProtectedActionDefinition {
    readonly action: string;
    readonly actionClass: ProtectedActionClass;
    readonly riskClass: Exclude<RiskClass, "low" | "medium">;
    readonly requiredScopes: readonly string[];
    readonly minimumAssurance: Extract<AssuranceLevel, "passkey_uv" | "fresh_passkey_uv">;
    readonly freshVerificationMaxAgeMs: number;
    readonly policyEpoch?: number;
}
export interface ProtectedSideEffectRequest<T> {
    readonly authorizationId: string;
    readonly action: string;
    readonly sessionId: string;
    readonly resourceOwnerId: string;
    readonly resourceProjectId?: string;
    readonly resourceCompanyId?: string;
    readonly resourceAccountId?: string;
    readonly resourceEnvironment?: EnvironmentName;
    readonly now: string;
    readonly intent: ProtectedIntent;
    readonly authorizationIntentBinding: string;
    readonly expectedPolicyEpoch?: number;
    readonly effect: () => T;
}
export declare class ProtectedActionCatalog {
    #private;
    register(definition: ProtectedActionDefinition): void;
    get(action: string): ProtectedActionDefinition | undefined;
    required(action: string): ProtectedActionDefinition;
    installPolicy(policy: PolicyEngine, action: string, version?: number): void;
}
export declare class ProtectedActionExecutor {
    private readonly catalog;
    private readonly gate;
    private readonly authorizations;
    constructor(catalog: ProtectedActionCatalog, gate: ProtectedActionGate, authorizations: ProtectedAuthorizationRegistry);
    execute<T>(request: ProtectedSideEffectRequest<T>): T;
}
