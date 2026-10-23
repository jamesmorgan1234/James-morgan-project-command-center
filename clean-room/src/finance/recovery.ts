import { parseTimestamp } from "../security/types.js";

export interface FinancialProviderSnapshot {
  readonly providerKey: string;
  readonly ownerId: string;
  readonly capturedAt: string;
  readonly contentHash: string;
  readonly accountIds: readonly string[];
}

export type FinancialReconciliationDecision = "accept_newer" | "duplicate" | "reject_stale" | "manual_conflict";

export function reconcileFinancialSnapshot(current: FinancialProviderSnapshot | undefined, incoming: FinancialProviderSnapshot): FinancialReconciliationDecision {
  if (!incoming.providerKey.trim() || !incoming.ownerId.trim() || !incoming.contentHash.trim()) throw new Error("Financial provider snapshot identity/hash are required");
  const incomingAt = parseTimestamp(incoming.capturedAt, "incoming.capturedAt");
  if (!current) return "accept_newer";
  if (current.providerKey !== incoming.providerKey || current.ownerId !== incoming.ownerId) throw new Error("Financial provider snapshot scope mismatch");
  const currentAt = parseTimestamp(current.capturedAt, "current.capturedAt");
  if (incomingAt < currentAt) return "reject_stale";
  if (incomingAt === currentAt && incoming.contentHash === current.contentHash) return "duplicate";
  if (incomingAt === currentAt && incoming.contentHash !== current.contentHash) return "manual_conflict";
  return "accept_newer";
}
