import { parseTimestamp } from "../security/types.js";
import type { MoneyValue } from "./money.js";

export type FinancialAccountType = "checking" | "savings" | "cash" | "credit_card" | "loan" | "mortgage" | "investment" | "retirement" | "other";

export interface FinancialAccount {
  readonly id: string;
  readonly ownerId: string;
  readonly providerKey: string;
  readonly externalAccountId: string;
  readonly displayName: string;
  readonly type: FinancialAccountType;
  readonly balance: MoneyValue;
  readonly balanceAsOf: string;
  readonly liability: boolean;
  readonly sourceRef: string;
  readonly version: number;
}

export type FinancialAccountOwnership = "sole" | "joint" | "authorized_user" | "custodial" | "external";
export type FinancialPositionClass = "asset" | "liability";
export type FinancialPositionValue =
  | Readonly<{ state: "verified" | "pending" | "stale"; cents: number; currency: string }>
  | Readonly<{ state: "unavailable"; reason: string }>;
export type FinancialPositionReconciliationDecision = "accept_newer" | "duplicate" | "reject_stale" | "manual_conflict";

export interface FinancialAccountPosition {
  readonly id: string;
  readonly ownerId: string;
  readonly accountId: string;
  readonly providerKey: string;
  readonly externalAccountId: string;
  readonly accountType: FinancialAccountType;
  readonly accountCurrency: string;
  readonly ownership: FinancialAccountOwnership;
  readonly positionClass: FinancialPositionClass;
  readonly value: FinancialPositionValue;
  readonly valuationDate: string;
  readonly observedAt: string;
  readonly provenanceRefs: readonly string[];
  readonly protectedActionAuthorized: false;
}

function validatePositionValue(value: FinancialPositionValue, accountCurrency: string): void {
  if (!/^[A-Z]{3}$/.test(accountCurrency)) throw new Error("Financial account currency must be three uppercase letters");
  if (value.state === "unavailable") {
    if (!value.reason.trim()) throw new Error("Unavailable financial position requires a reason");
    return;
  }
  if (!Number.isSafeInteger(value.cents)) throw new Error("Financial position amount must be safe integer cents");
  if (!/^[A-Z]{3}$/.test(value.currency)) throw new Error("Financial position currency must be three uppercase letters");
  if (value.currency !== accountCurrency) throw new Error("Financial position currency must match canonical account currency");
}

export function createFinancialAccountPosition(input: Omit<FinancialAccountPosition, "protectedActionAuthorized">): FinancialAccountPosition {
  if (!input.id.trim() || !input.ownerId.trim() || !input.accountId.trim() || !input.providerKey.startsWith("finance-provider:") || !input.externalAccountId.trim()) throw new Error("Financial account position identity is required");
  parseTimestamp(input.valuationDate, "Financial position valuationDate");
  parseTimestamp(input.observedAt, "Financial position observedAt");
  if (Date.parse(input.valuationDate) > Date.parse(input.observedAt)) throw new Error("Financial position valuation date cannot be after observation");
  if (!Array.isArray(input.provenanceRefs) || input.provenanceRefs.length === 0 || input.provenanceRefs.some((ref) => !ref.trim())) throw new Error("Financial position provenance is required");
  validatePositionValue(input.value, input.accountCurrency);
  return Object.freeze({
    ...input,
    provenanceRefs: Object.freeze([...new Set(input.provenanceRefs.map((ref) => ref.trim()))]),
    value: Object.freeze({ ...input.value }),
    protectedActionAuthorized: false as const
  });
}

function samePositionTruth(left: FinancialAccountPosition, right: FinancialAccountPosition): boolean {
  if (left.valuationDate !== right.valuationDate || left.accountCurrency !== right.accountCurrency || left.ownership !== right.ownership || left.positionClass !== right.positionClass || left.accountType !== right.accountType) return false;
  if (left.value.state !== right.value.state) return false;
  if (left.value.state === "unavailable" || right.value.state === "unavailable") return left.value.state === "unavailable" && right.value.state === "unavailable" && left.value.reason === right.value.reason;
  return left.value.cents === right.value.cents && left.value.currency === right.value.currency;
}

export function reconcileFinancialAccountPosition(current: FinancialAccountPosition | undefined, incoming: FinancialAccountPosition): FinancialPositionReconciliationDecision {
  if (!current) return "accept_newer";
  if (current.ownerId !== incoming.ownerId || current.accountId !== incoming.accountId || current.providerKey !== incoming.providerKey || current.externalAccountId !== incoming.externalAccountId) throw new Error("Financial account position scope mismatch");
  const currentObserved = parseTimestamp(current.observedAt, "Current financial position observedAt");
  const incomingObserved = parseTimestamp(incoming.observedAt, "Incoming financial position observedAt");
  if (incomingObserved < currentObserved) return "reject_stale";
  if (incomingObserved === currentObserved) return samePositionTruth(current, incoming) ? "duplicate" : "manual_conflict";
  return "accept_newer";
}

export class FinancialAccountRegistry {
  readonly #accounts = new Map<string, FinancialAccount>();
  readonly #providerExternal = new Map<string, string>();

  register(account: FinancialAccount): void {
    if (!account.id.trim() || !account.ownerId.trim() || !account.providerKey.trim() || !account.externalAccountId.trim() || !account.displayName.trim() || !account.sourceRef.trim()) throw new Error("Financial account identity/provider/provenance fields are required");
    if (!Number.isSafeInteger(account.version) || account.version !== 1) throw new Error("New financial account must start at version 1");
    parseTimestamp(account.balanceAsOf, "balanceAsOf");
    const providerKey = `${account.providerKey}:${account.externalAccountId}`;
    if (this.#accounts.has(account.id) || this.#providerExternal.has(providerKey)) throw new Error("Duplicate financial account identity");
    this.#accounts.set(account.id, Object.freeze({ ...account }));
    this.#providerExternal.set(providerKey, account.id);
  }

  replace(account: FinancialAccount, expectedVersion: number): void {
    const current = this.#accounts.get(account.id);
    if (!current) throw new Error(`Unknown financial account: ${account.id}`);
    if (current.version !== expectedVersion || account.version !== current.version + 1) throw new Error(`Financial account version conflict: ${account.id}`);
    if (current.ownerId !== account.ownerId || current.providerKey !== account.providerKey || current.externalAccountId !== account.externalAccountId) throw new Error("Financial account canonical identity cannot be rewritten");
    parseTimestamp(account.balanceAsOf, "balanceAsOf");
    this.#accounts.set(account.id, Object.freeze({ ...account }));
  }

  get(id: string): FinancialAccount | undefined { return this.#accounts.get(id); }
  list(ownerId: string): readonly FinancialAccount[] { return Object.freeze([...this.#accounts.values()].filter((account) => account.ownerId === ownerId)); }
}
