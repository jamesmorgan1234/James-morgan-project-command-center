export interface CashflowTransaction {
  readonly id: string;
  readonly amountCents: number;
  readonly postingState: "pending" | "posted";
  readonly transferGroupId?: string;
  readonly accountId: string;
}

export interface CashflowTotals {
  readonly postedExternalInflowCents: number;
  readonly postedExternalOutflowCents: number;
  readonly pendingExternalInflowCents: number;
  readonly pendingExternalOutflowCents: number;
  readonly excludedInternalTransferCount: number;
}

export function summarizeCashflowFlows(transactions: readonly CashflowTransaction[]): CashflowTotals {
  const transferGroups = new Map<string, CashflowTransaction[]>();
  for (const transaction of transactions) if (transaction.transferGroupId) transferGroups.set(transaction.transferGroupId, [...(transferGroups.get(transaction.transferGroupId) ?? []), transaction]);
  const internalIds = new Set<string>();
  for (const group of transferGroups.values()) {
    const sum = group.reduce((total, transaction) => total + transaction.amountCents, 0);
    const accounts = new Set(group.map((transaction) => transaction.accountId));
    if (sum === 0 && accounts.size > 1) for (const transaction of group) internalIds.add(transaction.id);
  }
  let postedIn = 0, postedOut = 0, pendingIn = 0, pendingOut = 0;
  for (const transaction of transactions) {
    if (!Number.isSafeInteger(transaction.amountCents)) throw new Error("Cashflow amount must be safe cents");
    if (internalIds.has(transaction.id)) continue;
    if (transaction.postingState === "posted" && transaction.amountCents >= 0) postedIn += transaction.amountCents;
    else if (transaction.postingState === "posted") postedOut += Math.abs(transaction.amountCents);
    else if (transaction.amountCents >= 0) pendingIn += transaction.amountCents;
    else pendingOut += Math.abs(transaction.amountCents);
  }
  return Object.freeze({ postedExternalInflowCents: postedIn, postedExternalOutflowCents: postedOut, pendingExternalInflowCents: pendingIn, pendingExternalOutflowCents: pendingOut, excludedInternalTransferCount: internalIds.size });
}
