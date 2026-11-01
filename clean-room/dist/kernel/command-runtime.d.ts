export interface CommandEnvelope<T = unknown> {
    readonly id: string;
    readonly type: string;
    readonly version: number;
    readonly correlationId: string;
    readonly causationId?: string;
    readonly idempotencyKey?: string;
    readonly actor: string;
    readonly projectId?: string;
    readonly payload: T;
}
export interface EventEnvelope<T = unknown> {
    readonly id: string;
    readonly type: string;
    readonly version: number;
    readonly sequence: number;
    readonly correlationId: string;
    readonly causationId: string;
    readonly payload: T;
}
export interface CancellationSignal {
    readonly cancelled: boolean;
    readonly reason?: string;
}
export interface RetryPolicy {
    readonly maxAttempts: number;
    readonly shouldRetry?: (error: unknown, attempt: number) => boolean;
}
export interface CommandExecutionContext {
    readonly attempt: number;
    readonly transactionId: string;
    readonly cancellation?: CancellationSignal;
}
export interface CommandExecutionOptions {
    readonly transactionId?: string;
    readonly cancellation?: CancellationSignal;
    readonly retry?: RetryPolicy;
    readonly compensate?: (command: CommandEnvelope, error: unknown, attempts: number) => void;
}
export interface OutboxRecord {
    readonly event: EventEnvelope;
    readonly transactionId: string;
    readonly published: boolean;
}
export type CommandHandler<T = unknown> = (command: CommandEnvelope<T>, context: CommandExecutionContext) => readonly Omit<EventEnvelope, "sequence">[];
export declare class CommandCancelledError extends Error {
    readonly reason: string | undefined;
    constructor(reason?: string);
}
export declare function assertCommandEnvelope(command: CommandEnvelope): CommandEnvelope;
export declare class CommandRuntime {
    #private;
    register(type: string, handler: CommandHandler): void;
    registeredTypes(): readonly string[];
    execute(command: CommandEnvelope, options?: CommandExecutionOptions): readonly EventEnvelope[];
    inboxHas(commandId: string): boolean;
    pendingOutbox(): readonly OutboxRecord[];
    acknowledgeOutbox(eventId: string): OutboxRecord;
}
export interface Transition<S extends string> {
    readonly from: S;
    readonly event: string;
    readonly to: S;
}
export declare class StateMachine<S extends string> {
    #private;
    constructor(transitions: readonly Transition<S>[]);
    next(current: S, event: string): S;
}
export interface WorkflowStep<TContext> {
    readonly key: string;
    readonly run: (context: TContext, attempt: number) => void;
    readonly retry?: RetryPolicy;
    readonly compensate?: (context: TContext, cause: unknown) => void;
}
export interface WorkflowDefinition<TContext> {
    readonly id: string;
    readonly correlationId: string;
    readonly steps: readonly WorkflowStep<TContext>[];
}
export interface WorkflowExecutionResult {
    readonly workflowId: string;
    readonly correlationId: string;
    readonly completedSteps: readonly string[];
}
export declare class WorkflowRuntime {
    execute<TContext>(workflow: WorkflowDefinition<TContext>, context: TContext, cancellation?: CancellationSignal): WorkflowExecutionResult;
}
