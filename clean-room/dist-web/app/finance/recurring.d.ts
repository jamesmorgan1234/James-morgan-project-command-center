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
export declare function validateRecurringFlow(flow: RecurringFlow): void;
export declare function recurringTruthState(flow: RecurringFlow): "detected_candidate" | "confirmed_obligation" | "ended" | "dismissed";
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
export declare function createRecurringObligation(input: RecurringObligationInput): RecurringObligation;
export declare function applyRecurringObligationCorrection(current: RecurringObligation, correction: RecurringObligationCorrection): RecurringObligation;
export declare function buildRecurringObligationReminder(obligation: RecurringObligation, reminderId: string): RecurringObligationReminderIntent | undefined;
