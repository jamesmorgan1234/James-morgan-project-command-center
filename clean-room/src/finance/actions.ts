export type FinancialActionKind = "transfer" | "payment" | "trade" | "open_account" | "close_account" | "change_autopay" | "cancel_subscription" | "purchase" | "account_change";

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

export function assertFinancialActionAuthorized(intent: FinancialActionIntent): void {
  if (!intent.id.trim() || !intent.ownerId.trim() || !intent.exactOwnerAuthorizationRef.trim()) throw new Error("Financial action requires exact owner authorization evidence");
  if (intent.accountRefs.length === 0) throw new Error("Financial action requires scoped account references");
  if (!intent.providerHealthVerified) throw new Error("Financial provider health must be verified immediately before action");
  if (!intent.duplicateSideEffectChecked) throw new Error("Financial duplicate-side-effect reconciliation is required");
  if (intent.amountCents !== undefined && (!Number.isSafeInteger(intent.amountCents) || intent.amountCents <= 0)) throw new Error("Financial action amount must be positive safe cents");
}

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

function time(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label} must be an ISO-compatible timestamp`);
  return parsed;
}
function sameRefs(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && [...left].sort().every((value, index) => value === [...right].sort()[index]);
}

export function authorizeFinancialActionExecution(intent: ScopedFinancialActionIntent, grant: FinancialActionAuthorizationGrant, context: FinancialActionExecutionContext): FinancialActionExecutionEnvelope {
  assertFinancialActionAuthorized(intent);
  if (!intent.providerKey.startsWith("finance-provider:") || !intent.intentHash.trim()) throw new Error("Financial action requires provider and exact intent hash");
  const createdAt = time(intent.createdAt, "Financial action createdAt");
  const now = time(context.now, "Financial action execution now");
  const authorizedAt = time(grant.authorizedAt, "Financial authorization authorizedAt");
  const expiresAt = time(grant.expiresAt, "Financial authorization expiresAt");
  const healthAt = time(context.providerHealthObservedAt, "Financial provider health observedAt");
  if (!Number.isSafeInteger(context.maxProviderHealthAgeMs) || context.maxProviderHealthAgeMs < 0) throw new Error("Financial provider health age policy is invalid");
  if (createdAt > now || authorizedAt > now) throw new Error("Financial action/authorization cannot originate in the future");
  if (expiresAt <= now) throw new Error("Financial authorization is stale or expired");
  if (authorizedAt > expiresAt) throw new Error("Financial authorization lifetime is invalid");
  if (grant.consumed) throw new Error("Financial one-time authorization has already been consumed");
  if (grant.ownerId !== intent.ownerId || grant.actionKind !== intent.kind || grant.providerKey !== intent.providerKey || grant.intentHash !== intent.intentHash || !sameRefs(grant.accountRefs, intent.accountRefs) || grant.amountCents !== intent.amountCents) throw new Error("Financial authorization scope does not exactly match action intent");
  if (grant.authorizationRef !== intent.exactOwnerAuthorizationRef) throw new Error("Financial authorization reference does not match exact owner authorization evidence");
  if (grant.assurance !== "fresh_passkey_uv" || grant.oneTime !== true) throw new Error("Financial action requires fresh one-time passkey authorization");
  if (grant.evidenceRefs.length === 0 || grant.evidenceRefs.some((ref) => !ref.trim())) throw new Error("Financial authorization evidence is required");
  if (context.providerHealth !== "available" || now - healthAt > context.maxProviderHealthAgeMs || healthAt > now) throw new Error("Financial provider health is unavailable, degraded, stale, or invalid");
  if (!context.duplicateSideEffectChecked || !intent.duplicateSideEffectChecked) throw new Error("Financial duplicate-side-effect reconciliation is required");
  if (context.priorExecutionRefs.length > 0) throw new Error("Financial action already has execution evidence");
  if (intent.source !== "owner_request") throw new Error("Analysis, recommendation, or automation cannot itself authorize money movement");
  return Object.freeze({
    intentId: intent.id, ownerId: intent.ownerId, actionKind: intent.kind, providerKey: intent.providerKey,
    accountRefs: Object.freeze([...intent.accountRefs]), amountCents: intent.amountCents, authorizationRef: grant.authorizationRef,
    intentHash: intent.intentHash, executionAuthorized: true as const, oneTime: true as const, protectedActionAuthorized: true as const,
    evidenceRefs: Object.freeze([...grant.evidenceRefs])
  });
}
