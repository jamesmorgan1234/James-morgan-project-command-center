import { type ExecutionScope } from "./scope.js";
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
export declare class OperationJournal {
    #private;
    prepare(record: OperationRecord): OperationRecord;
    transition(id: string, state: OperationState, updatedAt: string, details?: {
        readonly providerReceiptRef?: string;
        readonly errorCode?: string;
    }): OperationRecord;
    assertRetrySafe(id: string): void;
    get(id: string): OperationRecord | undefined;
}
export declare class DefinitiveSideEffectFailureError extends Error {
    readonly errorCode: string;
    constructor(errorCode: string, message?: string);
}
export declare class UnknownSideEffectOutcomeError extends Error {
    readonly errorCode: string;
    constructor(errorCode: string, message?: string);
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
export declare class ControlledSideEffectExecutor {
    #private;
    constructor(journal?: OperationJournal);
    get journal(): OperationJournal;
    execute<T>(request: ControlledSideEffectRequest<T>): Promise<ControlledSideEffectResult<T>>;
    reconcile(id: string, reconciledAt: string, providerReceiptRef: string): OperationRecord;
}
