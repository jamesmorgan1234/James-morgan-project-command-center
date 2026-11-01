/**
 * Error taxonomy and quality gates.
 *
 * Explicitly classified errors with preserved causes and declared retryability
 * and user-action requirements; normalized provider, network, validation and
 * conflict errors; explicit async handling and a global capture; no blanket or
 * ignoring catches; and commit, review, complexity, nesting and typing gates.
 */
export type ErrorClass = "domain" | "provider" | "network" | "validation" | "conflict" | "unexpected";
export interface AppError {
    readonly errorClass: ErrorClass;
    readonly code: string;
    readonly message: string;
    readonly cause: unknown;
    readonly retryable: boolean;
    readonly requiresUserAction: boolean;
}
export interface FailureInput {
    readonly errorClass: ErrorClass;
    readonly code: string;
    readonly message: string;
    readonly cause?: unknown;
    readonly retryable: boolean;
    readonly requiresUserAction: boolean;
}
export declare function classifyFailure(input: FailureInput): AppError;
export declare function domainError(code: string, message: string): AppError;
export declare function normalizeProviderError(raw: {
    readonly status: number;
    readonly message: string;
}): AppError;
export declare function normalizeNetworkError(raw: {
    readonly timeout: boolean;
    readonly message: string;
}): AppError;
export declare function normalizeValidationError(raw: {
    readonly field: string;
    readonly message: string;
}): AppError;
export declare function normalizeConflictError(raw: {
    readonly resource: string;
}): AppError;
export type AsyncResult<T> = {
    readonly ok: true;
    readonly value: T;
} | {
    readonly ok: false;
    readonly error: AppError;
};
export declare function handleAsync<T>(operation: () => Promise<T>): Promise<AsyncResult<T>>;
export declare function assertNoUnhandledRejection(events: readonly string[]): void;
export declare function createGlobalErrorHandler(sink: {
    readonly capture: (error: AppError) => void;
}): (error: unknown) => void;
export declare function assertHandledLocally(kind: "expected" | "unexpected", handled: boolean): void;
export declare function assertCatchNotBlanket(info: {
    readonly logs: boolean;
    readonly rethrows: boolean;
}): void;
export declare function assertNotCatchAndIgnore(protectedOperation: boolean, ignored: boolean): void;
export declare function assertCommitMessage(message: string): void;
export declare function assertReviewChecklist(items: readonly string[]): void;
export declare function assertComplexity(metrics: {
    readonly cyclomatic: number;
    readonly lines: number;
}): void;
export declare function requireCriticalReview(score: number): "reviewed";
export declare function assertNestingDepth(depth: number): void;
export declare function assertStaticTyping(config: {
    readonly strict: boolean;
}): void;
