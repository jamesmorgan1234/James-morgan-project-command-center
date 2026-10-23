export type FinancialActionKind = "transfer" | "payment" | "trade" | "open_account" | "close_account" | "change_autopay";

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
