import type { FinancialAccount, FinancialAccountPosition } from "./accounts.js";

export interface NetWorthSnapshot {
  readonly ownerId: string;
  readonly currency: string;
  readonly knownAssetsCents: number;
  readonly knownLiabilitiesCents: number;
  readonly knownNetWorthCents: number;
  readonly unknownAccountIds: readonly string[];
  readonly complete: boolean;
}

export interface FinancialPositionNetWorthSnapshot {
  readonly ownerId: string;
  readonly currency: string;
  readonly asOf: string;
  readonly verifiedAssetsCents: number;
  readonly verifiedLiabilitiesCents: number;
  readonly verifiedNetWorthCents: number;
  readonly verifiedAccountIds: readonly string[];
  readonly verifiedZeroAccountIds: readonly string[];
  readonly pendingAccountIds: readonly string[];
  readonly staleAccountIds: readonly string[];
  readonly unavailableAccountIds: readonly string[];
  readonly sourceDatesByAccount: Readonly<Record<string, string>>;
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

export function calculatePositionNetWorth(ownerId: string, positions: readonly FinancialAccountPosition[], currency = "USD", asOf = new Date().toISOString()): FinancialPositionNetWorthSnapshot {
  if (!ownerId.trim()) throw new Error("Net worth ownerId is required");
  if (!/^[A-Z]{3}$/.test(currency)) throw new Error("Net worth currency must be three uppercase letters");
  if (!Number.isFinite(Date.parse(asOf))) throw new Error("Net worth asOf must be an ISO-compatible timestamp");
  let assets = 0;
  let liabilities = 0;
  const verified: string[] = [];
  const verifiedZero: string[] = [];
  const pending: string[] = [];
  const stale: string[] = [];
  const unavailable: string[] = [];
  const sourceDates: Record<string, string> = {};
  const seen = new Set<string>();

  for (const position of positions.filter((candidate) => candidate.ownerId === ownerId)) {
    if (seen.has(position.accountId)) throw new Error(`Multiple current positions for financial account: ${position.accountId}`);
    seen.add(position.accountId);
    sourceDates[position.accountId] = position.valuationDate;
    if (position.value.state === "unavailable") { unavailable.push(position.accountId); continue; }
    if (position.value.currency !== currency) { unavailable.push(position.accountId); continue; }
    if (position.value.state === "pending") { pending.push(position.accountId); continue; }
    if (position.value.state === "stale") { stale.push(position.accountId); continue; }
    verified.push(position.accountId);
    if (position.value.cents === 0) verifiedZero.push(position.accountId);
    if (position.positionClass === "liability") liabilities += Math.abs(position.value.cents);
    else assets += position.value.cents;
  }

  return Object.freeze({
    ownerId,
    currency,
    asOf,
    verifiedAssetsCents: assets,
    verifiedLiabilitiesCents: liabilities,
    verifiedNetWorthCents: assets - liabilities,
    verifiedAccountIds: Object.freeze(verified),
    verifiedZeroAccountIds: Object.freeze(verifiedZero),
    pendingAccountIds: Object.freeze(pending),
    staleAccountIds: Object.freeze(stale),
    unavailableAccountIds: Object.freeze(unavailable),
    sourceDatesByAccount: Object.freeze(sourceDates),
    complete: pending.length === 0 && stale.length === 0 && unavailable.length === 0
  });
}
