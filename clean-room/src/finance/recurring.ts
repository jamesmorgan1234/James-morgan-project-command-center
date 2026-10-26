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

export type RecurringObligationStatus = "candidate" | "active" | "paused" | "overdue" | "ended" | "dismissed";
export type RecurringObligationTruth = "detected_candidate" | "confirmed_obligation" | "ended" | "dismissed";

export interface RecurringObligationInput {
  readonly id: string;
  readonly ownerId: string;
  readonly kind: RecurringFlowKind;
  readonly counterparty: string;
  readonly currency: string;
  readonly expectedAmountCents?: number | undefined;
  readonly expectedNextAt?: string | undefined;
  readonly cadenceRef?: string | undefined;
  readonly confidence: number;
  readonly detectionEvidenceRefs: readonly string[];
  readonly contractEvidenceRefs: readonly string[];
  readonly ownerConfirmationRef?: string | undefined;
  readonly status: RecurringObligationStatus;
  readonly observedAt: string;
  readonly correctionOf?: string | undefined;
}

export interface RecurringObligation extends RecurringObligationInput {
  readonly truth: RecurringObligationTruth;
  readonly protectedActionAuthorized: false;
}

export interface RecurringObligationCorrection {
  readonly id: string;
  readonly ownerId: string;
  readonly obligationId: string;
  readonly ownerDecisionRef: string;
  readonly observedAt: string;
  readonly expectedAmountCents?: number | undefined;
  readonly expectedNextAt?: string | undefined;
  readonly status?: RecurringObligationStatus | undefined;
  readonly evidenceRefs: readonly string[];
}

export interface RecurringObligationReminderIntent {
  readonly id: string;
  readonly ownerId: string;
  readonly obligationId: string;
  readonly dueAt: string;
  readonly reason: "upcoming_obligation" | "overdue_obligation";
  readonly evidenceRefs: readonly string[];
  readonly sendAuthorized: false;
  readonly protectedActionAuthorized: false;
}

function refs(values: readonly string[], label: string, requireOne = true): readonly string[] {
  if (!Array.isArray(values) || (requireOne && values.length === 0) || values.some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${label} must contain nonblank references`);
  return Object.freeze([...new Set(values.map((value) => value.trim()))]);
}

function obligationTruth(input: RecurringObligationInput): RecurringObligationTruth {
  if (input.status === "ended" || input.status === "dismissed") return input.status;
  return input.ownerConfirmationRef?.trim() || input.contractEvidenceRefs.length > 0 ? "confirmed_obligation" : "detected_candidate";
}

export function createRecurringObligation(input: RecurringObligationInput): RecurringObligation {
  if (!input.id.trim() || !input.ownerId.trim() || !input.counterparty.trim()) throw new Error("Recurring obligation identity/owner/counterparty are required");
  if (!/^[A-Z]{3}$/.test(input.currency)) throw new Error("Recurring obligation currency must be three uppercase letters");
  if (input.expectedAmountCents !== undefined && !Number.isSafeInteger(input.expectedAmountCents)) throw new Error("Recurring obligation amount must be safe integer cents");
  if (input.expectedNextAt !== undefined) parseTimestamp(input.expectedNextAt, "Recurring obligation expectedNextAt");
  if (input.cadenceRef !== undefined && !input.cadenceRef.trim()) throw new Error("Recurring obligation cadenceRef cannot be blank");
  if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) throw new Error("Recurring obligation confidence must be 0..1");
  parseTimestamp(input.observedAt, "Recurring obligation observedAt");
  const detectionEvidenceRefs = refs(input.detectionEvidenceRefs, "Recurring obligation detection evidence");
  const contractEvidenceRefs = refs(input.contractEvidenceRefs, "Recurring obligation contract evidence", false);
  if (input.ownerConfirmationRef !== undefined && !input.ownerConfirmationRef.trim()) throw new Error("Recurring obligation owner confirmation cannot be blank");
  if (input.correctionOf !== undefined && !input.correctionOf.trim()) throw new Error("Recurring obligation correction lineage cannot be blank");
  const truth = obligationTruth({ ...input, detectionEvidenceRefs, contractEvidenceRefs });
  if ((input.status === "active" || input.status === "overdue") && truth !== "confirmed_obligation") throw new Error("Detected recurrence cannot become an active obligation without contract evidence or owner confirmation");
  return Object.freeze({ ...input, detectionEvidenceRefs, contractEvidenceRefs, truth, protectedActionAuthorized: false as const });
}

export function applyRecurringObligationCorrection(current: RecurringObligation, correction: RecurringObligationCorrection): RecurringObligation {
  if (current.ownerId !== correction.ownerId || current.id !== correction.obligationId) throw new Error("Recurring obligation correction scope mismatch");
  if (!correction.id.trim() || !correction.ownerDecisionRef.trim()) throw new Error("Recurring obligation correction requires id and owner decision evidence");
  parseTimestamp(correction.observedAt, "Recurring obligation correction observedAt");
  if (Date.parse(correction.observedAt) < Date.parse(current.observedAt)) throw new Error("Recurring obligation correction cannot predate current truth");
  const evidenceRefs = refs(correction.evidenceRefs, "Recurring obligation correction evidence");
  return createRecurringObligation({
    ...current,
    expectedAmountCents: correction.expectedAmountCents ?? current.expectedAmountCents,
    expectedNextAt: correction.expectedNextAt ?? current.expectedNextAt,
    status: correction.status ?? current.status,
    ownerConfirmationRef: correction.ownerDecisionRef,
    observedAt: correction.observedAt,
    correctionOf: current.id,
    detectionEvidenceRefs: Object.freeze([...new Set([...current.detectionEvidenceRefs, ...evidenceRefs])]),
    contractEvidenceRefs: current.contractEvidenceRefs
  });
}

export function buildRecurringObligationReminder(obligation: RecurringObligation, reminderId: string): RecurringObligationReminderIntent | undefined {
  if (obligation.truth !== "confirmed_obligation" || !["active", "overdue"].includes(obligation.status) || !obligation.expectedNextAt) return undefined;
  if (!reminderId.trim()) throw new Error("Recurring obligation reminder id is required");
  return Object.freeze({
    id: reminderId,
    ownerId: obligation.ownerId,
    obligationId: obligation.id,
    dueAt: obligation.expectedNextAt,
    reason: obligation.status === "overdue" ? "overdue_obligation" : "upcoming_obligation",
    evidenceRefs: Object.freeze([...new Set([...obligation.detectionEvidenceRefs, ...obligation.contractEvidenceRefs, ...(obligation.ownerConfirmationRef ? [obligation.ownerConfirmationRef] : [])])]),
    sendAuthorized: false as const,
    protectedActionAuthorized: false as const
  });
}
