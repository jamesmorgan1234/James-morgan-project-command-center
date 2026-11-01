export declare const PROTECTED_ACTIONS: readonly ["spend_money", "purchase", "publish", "send_external_communication", "merge", "deploy_production", "destructive_delete", "change_security", "manage_credentials", "change_protected_asset", "accept_legal_terms"];
export declare const NON_PROTECTED_ACTIONS: readonly ["read", "analyze", "draft", "local_reversible_write"];
export type ProtectedAction = (typeof PROTECTED_ACTIONS)[number];
export type NonProtectedAction = (typeof NON_PROTECTED_ACTIONS)[number];
export type ActionClass = ProtectedAction | NonProtectedAction;
export type InstructionState = "current" | "stale" | "conflicting";
export type ExecutionSurface = "normal_chat" | "work";
export interface AuthorizationSnapshot {
    readonly ownerId: string;
    readonly action: ActionClass;
    readonly projectId?: string;
    readonly accountId?: string;
    readonly resourceId?: string;
    readonly authorizedAt: string;
    readonly expiresAt?: string;
}
export interface GovernanceContext {
    readonly ownerId: string;
    readonly authorityOwnerId?: string;
    readonly newestInstructionAllows: boolean;
    readonly instructionState?: InstructionState;
    readonly freeFirst: boolean;
    readonly introducesCost: boolean;
    readonly action: ActionClass;
    readonly projectId?: string;
    readonly accountId?: string;
    readonly resourceId?: string;
    readonly executionSurface?: ExecutionSurface;
    readonly normalChatAvailable?: boolean;
    readonly authorization?: AuthorizationSnapshot;
    readonly now: string;
}
export interface GovernanceDecision {
    readonly allowed: boolean;
    readonly reason: string;
    readonly protected: boolean;
}
export declare function evaluateGovernance(context: GovernanceContext): GovernanceDecision;
export declare class GovernanceDeniedError extends Error {
    readonly decision: GovernanceDecision;
    constructor(decision: GovernanceDecision);
}
export declare class GovernanceGate {
    evaluate(context: GovernanceContext): GovernanceDecision;
    assertAllowed(context: GovernanceContext): GovernanceDecision;
    execute<T>(context: GovernanceContext, operation: () => T): T;
}
