import { parseTimestamp } from "../security/types.js";

export type RecurringFlowKind = "income" | "bill" | "subscription" | "debt_payment" | "transfer" | "other";

export interface RecurringFlow {
  readonly id: string;
  readonly ownerId: string;
  readonly kind: RecurringFlowKind;
  readonly merchantOrCounterparty: string;
  readonly expectedAmountCents?: number;
  readonly expectedNextAt?: string;
  readonly confidence: number;
  readonly evidenceRefs: readonly string[];
  readonly ownerConfirmed: boolean;
  readonly contractEvidence: boolean;
  readonly state: "candidate" | "active" | "ended" | "dismissed";
}

export function validateRecurringFlow(flow: RecurringFlow): void {
  if (!flow.id.trim() || !flow.ownerId.trim() || !flow.merchantOrCounterparty.trim()) throw new Error("Recurring flow identity/owner/counterparty are required");
  if (!Number.isFinite(flow.confidence) || flow.confidence < 0 || flow.confidence > 1) throw new Error("Recurring confidence must be 0..1");
  if (flow.evidenceRefs.length === 0) throw new Error("Recurring flow requires evidence");
  if (flow.expectedAmountCents !== undefined && !Number.isSafeInteger(flow.expectedAmountCents)) throw new Error("Expected recurring amount must be safe cents");
  if (flow.expectedNextAt) parseTimestamp(flow.expectedNextAt, "expectedNextAt");
}

export function recurringTruthState(flow: RecurringFlow): "detected_candidate" | "confirmed_obligation" | "ended" | "dismissed" {
  validateRecurringFlow(flow);
  if (flow.state === "ended" || flow.state === "dismissed") return flow.state;
  if (flow.ownerConfirmed || flow.contractEvidence) return "confirmed_obligation";
  return "detected_candidate";
}
