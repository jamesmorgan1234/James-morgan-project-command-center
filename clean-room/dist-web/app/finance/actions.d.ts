export declare const FINANCIAL_ACTION_KINDS: readonly ["transfer", "payment", "trade", "open_account", "close_account", "change_autopay", "cancel_subscription", "purchase", "account_change"];
export type FinancialActionKind = (typeof FINANCIAL_ACTION_KINDS)[number];
export interface FinancialActionIntent {
    readonly id: string;
    readonly ownerId: string;
    readonly kind: FinancialActionKind;
    readonly accountRefs: readonly string[];
    readonly amountCents?: number;
    readonly exactOwnerAuthorizationRef: string;
    readonly providerHealthVerified: boolean;
    readonly duplicateSideEffectChecked: boolean;
}
export declare function assertFinancialActionAuthorized(intent: FinancialActionIntent): void;
export interface ScopedFinancialActionIntent extends FinancialActionIntent {
    readonly providerKey: string;
    readonly intentHash: string;
    readonly createdAt: string;
    readonly source: "owner_request" | "analysis" | "recommendation" | "automation";
}
export interface FinancialActionAuthorizationGrant {
    readonly authorizationRef: string;
    readonly ownerId: string;
    readonly actionKind: FinancialActionKind;
    readonly providerKey: string;
    readonly accountRefs: readonly string[];
    readonly amountCents?: number | undefined;
    readonly intentHash: string;
    readonly authorizedAt: string;
    readonly expiresAt: string;
    readonly assurance: "fresh_passkey_uv";
    readonly oneTime: true;
    readonly consumed: boolean;
    readonly evidenceRefs: readonly string[];
}
export interface FinancialActionExecutionContext {
    readonly now: string;
    readonly providerHealth: "available" | "degraded" | "unavailable";
    readonly providerHealthObservedAt: string;
    readonly maxProviderHealthAgeMs: number;
    readonly duplicateSideEffectChecked: boolean;
    readonly priorExecutionRefs: readonly string[];
}
export interface FinancialActionExecutionEnvelope {
    readonly intentId: string;
    readonly ownerId: string;
    readonly actionKind: FinancialActionKind;
    readonly providerKey: string;
    readonly accountRefs: readonly string[];
    readonly amountCents?: number | undefined;
    readonly authorizationRef: string;
    readonly intentHash: string;
    readonly executionAuthorized: true;
    readonly oneTime: true;
    readonly protectedActionAuthorized: true;
    readonly evidenceRefs: readonly string[];
}
export declare function authorizeFinancialActionExecution(intent: ScopedFinancialActionIntent, grant: FinancialActionAuthorizationGrant, context: FinancialActionExecutionContext): FinancialActionExecutionEnvelope;
