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
