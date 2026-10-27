import { parseTimestamp } from "../security/types.js";
import type { MoneyValue } from "./money.js";
import type { FinancialProviderAdapter } from "./providers.js";
import { assertSecretChannelSafe } from "../security/secret-channels.js";

export interface FinancialProviderBinding {
  readonly providerKey: string;
  readonly externalAccountId: string;
  readonly accountVersion: number;
  readonly sourceRef: string;
}

export interface FinancialProviderRebind {
  readonly operationId: string;
  readonly accountId: string;
  readonly ownerId: string;
  readonly expectedVersion: number;
  readonly provider: FinancialProviderAdapter;
  readonly externalAccountId: string;
  readonly requiredReadScope: string;
  readonly consentRef: string;
  readonly sourceRef: string;
}

export interface FinancialProviderRebindReceipt {
  readonly accountId: string;
  readonly accountVersion: number;
  readonly operationId: string;
  readonly protectedActionAuthorized: false;
}

function bindingKey(provider: string, externalId: string): string { return JSON.stringify([provider, externalId]); }

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
  readonly #bindings = new Map<string, readonly FinancialProviderBinding[]>();
  readonly #rebinds = new Map<string, Readonly<{ fingerprint: string; receipt: FinancialProviderRebindReceipt }>>();

  register(account: FinancialAccount): void {
    if (!account.id.trim() || !account.ownerId.trim() || !account.providerKey.trim() || !account.externalAccountId.trim() || !account.displayName.trim() || !account.sourceRef.trim()) throw new Error("Financial account identity/provider/provenance fields are required");
    if (!Number.isSafeInteger(account.version) || account.version !== 1) throw new Error("New financial account must start at version 1");
    parseTimestamp(account.balanceAsOf, "balanceAsOf");
    const providerKey = bindingKey(account.providerKey, account.externalAccountId);
    if (this.#accounts.has(account.id) || this.#providerExternal.has(providerKey)) throw new Error("Duplicate financial account identity");
    this.#accounts.set(account.id, Object.freeze({ ...account }));
    this.#providerExternal.set(providerKey, account.id);
    this.#bindings.set(account.id, Object.freeze([Object.freeze({ providerKey: account.providerKey, externalAccountId: account.externalAccountId, accountVersion: 1, sourceRef: account.sourceRef })]));
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
  /** Metadata-only identity repair. It neither changes provider consent/scopes nor authorizes effects. */
  rebindProvider(input: FinancialProviderRebind): FinancialProviderRebindReceipt {
    const current = this.#accounts.get(input.accountId);
    if (!current || current.ownerId !== input.ownerId) throw new Error("Financial rebind account/owner mismatch");
    const metadata = { operationId: input.operationId, accountId: input.accountId, ownerId: input.ownerId, providerKey: input.provider.key, externalAccountId: input.externalAccountId, requiredReadScope: input.requiredReadScope, consentRef: input.consentRef, sourceRef: input.sourceRef };
    if (Object.values(metadata).some((value) => typeof value !== "string" || !value.trim())) throw new Error("Financial rebind requires explicit identity, consent, scope and provenance");
    assertSecretChannelSafe("note", metadata);
    const fingerprint = JSON.stringify([metadata, input.expectedVersion]);
    const operationKey = JSON.stringify([input.ownerId, input.operationId]);
    const prior = this.#rebinds.get(operationKey);
    if (prior) {
      if (prior.fingerprint !== fingerprint) throw new Error("Financial rebind operation identity collision");
      return prior.receipt;
    }
    if (current.version !== input.expectedVersion || !Number.isSafeInteger(current.version + 1)) throw new Error("Financial rebind version conflict");
    const provider = input.provider;
    if (!provider.key.startsWith("finance-provider:") || !provider.enabled || provider.connectionState !== "connected" || provider.consentState !== "granted" || provider.health !== "available" || !provider.capabilities.includes("accounts.read") || !provider.dataScopes.includes(input.requiredReadScope)) throw new Error("Financial rebind requires an available explicitly consented read connection and scope");
    const targetKey = bindingKey(provider.key, input.externalAccountId);
    const bound = this.#providerExternal.get(targetKey);
    if (bound !== undefined && bound !== current.id) throw new Error("Financial provider identity collision");
    const version = current.version + 1;
    const next = Object.freeze({ ...current, providerKey: provider.key, externalAccountId: input.externalAccountId, version });
    const binding = Object.freeze({ providerKey: provider.key, externalAccountId: input.externalAccountId, accountVersion: version, sourceRef: input.sourceRef });
    const receipt = Object.freeze({ accountId: current.id, accountVersion: version, operationId: input.operationId, protectedActionAuthorized: false as const });
    // Retain historical aliases so neither an old nor a new binding can create a second account.
    this.#providerExternal.set(targetKey, current.id);
    this.#accounts.set(current.id, next);
    this.#bindings.set(current.id, Object.freeze([...(this.#bindings.get(current.id) ?? []), binding]));
    this.#rebinds.set(operationKey, Object.freeze({ fingerprint, receipt }));
    return receipt;
  }
  providerLineage(id: string): readonly FinancialProviderBinding[] { return this.#bindings.get(id) ?? Object.freeze([]); }
  list(ownerId: string): readonly FinancialAccount[] { return Object.freeze([...this.#accounts.values()].filter((account) => account.ownerId === ownerId)); }
}
