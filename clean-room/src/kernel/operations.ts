import { parseTimestamp } from "../security/types.js";
import { executionScopeKey, validateExecutionScope, type ExecutionScope } from "./scope.js";

export type OperationState = "prepared" | "dispatched" | "succeeded" | "failed" | "unknown" | "reconciled";

export interface OperationRecord {
  readonly id: string;
  readonly idempotencyKey: string;
  readonly intentBinding: string;
  readonly scope: ExecutionScope;
  readonly state: OperationState;
  readonly policyVersion: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly providerReceiptRef?: string;
  readonly errorCode?: string;
}

const ALLOWED = {
  prepared: ["dispatched", "failed"],
  dispatched: ["succeeded", "failed", "unknown"],
  unknown: ["reconciled", "succeeded", "failed"],
  reconciled: [],
  succeeded: [],
  failed: ["dispatched"]
} as const satisfies Readonly<Record<OperationState, readonly OperationState[]>>;

function operationDedupeKey(record: Pick<OperationRecord, "scope" | "idempotencyKey">): string {
  return `${executionScopeKey(record.scope)}|${record.idempotencyKey}`;
}

export class OperationJournal {
  readonly #records = new Map<string, OperationRecord>();
  readonly #dedupe = new Map<string, string>();

  prepare(record: OperationRecord): OperationRecord {
    validateExecutionScope(record.scope);
    if (!record.id.trim() || !record.idempotencyKey.trim() || !record.intentBinding.trim()) throw new Error("Operation identity, idempotencyKey, and intentBinding are required");
    if (!Number.isSafeInteger(record.policyVersion) || record.policyVersion < 1) throw new Error("Operation policyVersion must be positive");
    const created = parseTimestamp(record.createdAt, "createdAt");
    const updated = parseTimestamp(record.updatedAt, "updatedAt");
    if (updated < created) throw new Error("Operation updatedAt cannot predate createdAt");
    if (record.state !== "prepared") throw new Error("New operation must start prepared");

    const dedupeKey = operationDedupeKey(record);
    const existingById = this.#records.get(record.id);
    if (existingById) {
      if (operationDedupeKey(existingById) !== dedupeKey || existingById.intentBinding !== record.intentBinding) {
        throw new Error(`Operation id ${record.id} is already bound to a different side-effect intent`);
      }
      return existingById;
    }

    const existingId = this.#dedupe.get(dedupeKey);
    if (existingId) return this.#required(existingId);
    const frozen = Object.freeze({ ...record, scope: Object.freeze({ ...record.scope }) });
    this.#records.set(record.id, frozen);
    this.#dedupe.set(dedupeKey, record.id);
    return frozen;
  }

  transition(id: string, state: OperationState, updatedAt: string, details: { readonly providerReceiptRef?: string; readonly errorCode?: string } = {}): OperationRecord {
    const current = this.#required(id);
    const nextTime = parseTimestamp(updatedAt, "updatedAt");
    if (nextTime < parseTimestamp(current.updatedAt, "current.updatedAt")) throw new Error("Operation transition cannot move backward in time");
    if (!(ALLOWED[current.state] as readonly OperationState[]).includes(state)) throw new Error(`Invalid operation transition: ${current.state} -> ${state}`);
    const next = Object.freeze({ ...current, state, updatedAt, ...details });
    this.#records.set(id, next);
    return next;
  }

  assertRetrySafe(id: string): void {
    const current = this.#required(id);
    if (current.state === "dispatched") throw new Error("Dispatched operation is still in flight and must not be repeated");
    if (current.state === "unknown") throw new Error("Unknown external outcome must be reconciled before retry");
    if (current.state === "succeeded" || current.state === "reconciled") throw new Error("Completed operation must not be repeated");
  }

  get(id: string): OperationRecord | undefined { return this.#records.get(id); }

  #required(id: string): OperationRecord {
    const record = this.#records.get(id);
    if (!record) throw new Error(`Unknown operation: ${id}`);
    return record;
  }
}

export class DefinitiveSideEffectFailureError extends Error {
  constructor(readonly errorCode: string, message = errorCode) {
    super(message);
    this.name = "DefinitiveSideEffectFailureError";
    if (!errorCode.trim()) throw new Error("Definitive side-effect failure requires an error code");
  }
}

export class UnknownSideEffectOutcomeError extends Error {
  constructor(readonly errorCode: string, message = errorCode) {
    super(message);
    this.name = "UnknownSideEffectOutcomeError";
    if (!errorCode.trim()) throw new Error("Unknown side-effect outcome requires an error code");
  }
}

export interface SideEffectDispatchResult<T> {
  readonly value: T;
  readonly providerReceiptRef: string;
}

export interface ControlledSideEffectRequest<T> {
  readonly operation: OperationRecord;
  readonly dispatchedAt: string;
  readonly completedAt: string;
  readonly dispatch: () => Promise<SideEffectDispatchResult<T>> | SideEffectDispatchResult<T>;
}

export interface ControlledSideEffectResult<T> {
  readonly operation: OperationRecord;
  readonly value: T;
  readonly replayed: boolean;
}

/**
 * The single kernel path for important external side effects.
 *
 * Every dispatch is first bound to owner/project/account/environment scope,
 * intent, policy version and an idempotency key in OperationJournal. Duplicate
 * attempts are suppressed, uncertain outcomes fail closed until reconciliation,
 * and only explicit definitive failures are retryable.
 */
export class ControlledSideEffectExecutor {
  readonly #journal: OperationJournal;
  readonly #completed = new Map<string, ControlledSideEffectResult<unknown>>();

  constructor(journal = new OperationJournal()) {
    this.#journal = journal;
  }

  get journal(): OperationJournal { return this.#journal; }

  async execute<T>(request: ControlledSideEffectRequest<T>): Promise<ControlledSideEffectResult<T>> {
    const prepared = this.#journal.prepare(request.operation);
    const completed = this.#completed.get(prepared.id);
    if (completed) return Object.freeze({ ...(completed as ControlledSideEffectResult<T>), replayed: true });

    this.#journal.assertRetrySafe(prepared.id);
    this.#journal.transition(prepared.id, "dispatched", request.dispatchedAt);

    try {
      const result = await request.dispatch();
      if (!result.providerReceiptRef?.trim()) {
        throw new UnknownSideEffectOutcomeError("SIDE_EFFECT_RECEIPT_MISSING", "Side effect returned without a durable provider receipt");
      }
      const operation = this.#journal.transition(prepared.id, "succeeded", request.completedAt, { providerReceiptRef: result.providerReceiptRef });
      const receipt = Object.freeze({ operation, value: result.value, replayed: false });
      this.#completed.set(prepared.id, receipt as ControlledSideEffectResult<unknown>);
      return receipt;
    } catch (error) {
      if (error instanceof DefinitiveSideEffectFailureError) {
        this.#journal.transition(prepared.id, "failed", request.completedAt, { errorCode: error.errorCode });
        throw error;
      }
      const unknown = error instanceof UnknownSideEffectOutcomeError
        ? error
        : new UnknownSideEffectOutcomeError("SIDE_EFFECT_OUTCOME_UNKNOWN", error instanceof Error ? error.message : "Side-effect outcome is unknown");
      this.#journal.transition(prepared.id, "unknown", request.completedAt, { errorCode: unknown.errorCode });
      throw unknown;
    }
  }

  reconcile(id: string, reconciledAt: string, providerReceiptRef: string): OperationRecord {
    if (!providerReceiptRef.trim()) throw new Error("Reconciliation requires a durable provider receipt");
    const current = this.#journal.get(id);
    if (!current) throw new Error(`Unknown operation: ${id}`);
    if (current.state !== "unknown") throw new Error("Only an unknown side-effect outcome may be reconciled");
    return this.#journal.transition(id, "reconciled", reconciledAt, { providerReceiptRef });
  }
}
