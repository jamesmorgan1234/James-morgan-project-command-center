import type { FinancialAccount } from "./accounts.js";

export interface NetWorthSnapshot {
  readonly ownerId: string;
  readonly currency: string;
  readonly knownAssetsCents: number;
  readonly knownLiabilitiesCents: number;
  readonly knownNetWorthCents: number;
  readonly unknownAccountIds: readonly string[];
  readonly complete: boolean;
}

export function calculateNetWorth(ownerId: string, accounts: readonly FinancialAccount[], currency = "USD"): NetWorthSnapshot {
  let assets = 0;
  let liabilities = 0;
  const unknown: string[] = [];
  for (const account of accounts.filter((candidate) => candidate.ownerId === ownerId)) {
    if (account.balance.state === "unknown") { unknown.push(account.id); continue; }
    if (account.balance.currency !== currency) { unknown.push(account.id); continue; }
    if (account.liability) liabilities += Math.abs(account.balance.cents); else assets += account.balance.cents;
  }
  return Object.freeze({ ownerId, currency, knownAssetsCents: assets, knownLiabilitiesCents: liabilities, knownNetWorthCents: assets - liabilities, unknownAccountIds: Object.freeze(unknown), complete: unknown.length === 0 });
}
