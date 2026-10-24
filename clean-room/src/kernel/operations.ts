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
  failed: []
} as const satisfies Readonly<Record<OperationState, readonly OperationState[]>>;

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
    const dedupeKey = `${executionScopeKey(record.scope)}|${record.idempotencyKey}`;
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
