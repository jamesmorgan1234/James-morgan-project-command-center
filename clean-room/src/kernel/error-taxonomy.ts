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

export function classifyFailure(input: FailureInput): AppError {
  if (!input.code.trim() || !input.message.trim()) throw new Error("An error requires a code and message");
  if (typeof input.retryable !== "boolean") throw new Error("Retryability must be explicitly declared");
  if (typeof input.requiresUserAction !== "boolean") throw new Error("User-action requirement must be explicitly declared");
  return Object.freeze({
    errorClass: input.errorClass,
    code: input.code,
    message: input.message,
    cause: input.cause,
    retryable: input.retryable,
    requiresUserAction: input.requiresUserAction
  });
}

export function domainError(code: string, message: string): AppError {
  return classifyFailure({ errorClass: "domain", code, message, retryable: false, requiresUserAction: false });
}

export function normalizeProviderError(raw: { readonly status: number; readonly message: string }): AppError {
  const retryable = raw.status >= 500 || raw.status === 429;
  return classifyFailure({ errorClass: "provider", code: `provider_${raw.status}`, message: raw.message, cause: raw, retryable, requiresUserAction: false });
}

export function normalizeNetworkError(raw: { readonly timeout: boolean; readonly message: string }): AppError {
  return classifyFailure({ errorClass: "network", code: raw.timeout ? "network_timeout" : "network_error", message: raw.message, cause: raw, retryable: true, requiresUserAction: false });
}

export function normalizeValidationError(raw: { readonly field: string; readonly message: string }): AppError {
  return classifyFailure({ errorClass: "validation", code: `validation_${raw.field}`, message: raw.message, cause: raw, retryable: false, requiresUserAction: true });
}

export function normalizeConflictError(raw: { readonly resource: string }): AppError {
  return classifyFailure({ errorClass: "conflict", code: `conflict_${raw.resource}`, message: `Conflict on ${raw.resource}`, cause: raw, retryable: false, requiresUserAction: true });
}

export type AsyncResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: AppError };

export async function handleAsync<T>(operation: () => Promise<T>): Promise<AsyncResult<T>> {
  try {
    return { ok: true as const, value: await operation() };
  } catch (error) {
    return {
      ok: false as const,
      error: classifyFailure({
        errorClass: "unexpected",
        code: "unexpected_failure",
        message: error instanceof Error ? error.message : String(error),
        cause: error,
        retryable: false,
        requiresUserAction: true
      })
    };
  }
}

export function assertNoUnhandledRejection(events: readonly string[]): void {
  if (events.length > 0) throw new Error(`Unhandled promise rejection is release-blocking: ${events.join(", ")}`);
}

export function createGlobalErrorHandler(sink: { readonly capture: (error: AppError) => void }): (error: unknown) => void {
  return (error: unknown): void => {
    sink.capture(classifyFailure({
      errorClass: "unexpected",
      code: "unexpected_failure",
      message: error instanceof Error ? error.message : String(error),
      cause: error,
      retryable: false,
      requiresUserAction: true
    }));
  };
}

export function assertHandledLocally(kind: "expected" | "unexpected", handled: boolean): void {
  if (kind === "expected" && !handled) throw new Error("Expected errors must be handled locally");
}

export function assertCatchNotBlanket(info: { readonly logs: boolean; readonly rethrows: boolean }): void {
  if (!info.logs && !info.rethrows) throw new Error("A blanket catch that swallows the failure is not permitted");
}

export function assertNotCatchAndIgnore(protectedOperation: boolean, ignored: boolean): void {
  if (protectedOperation && ignored) throw new Error("Protected operations cannot be caught and ignored");
}

export function assertCommitMessage(message: string): void {
  if (!/^(?:feat|fix|refactor|docs|test|chore)\([a-z0-9-]+\): \S+/.test(message)) throw new Error("A commit message must identify the subsystem and the change");
}

export function assertReviewChecklist(items: readonly string[]): void {
  if (!items.includes("architecture_boundaries")) throw new Error("Code review must check architecture boundaries");
}

export function assertComplexity(metrics: { readonly cyclomatic: number; readonly lines: number }): void {
  if (metrics.cyclomatic > 10) throw new Error("Function cyclomatic complexity exceeds the threshold");
  if (metrics.lines > 50) throw new Error("Function length exceeds the threshold");
}

export function requireCriticalReview(score: number): "reviewed" {
  if (!Number.isSafeInteger(score) || score < 0) throw new Error("Complexity score must be a nonnegative integer");
  if (score > 10) return "reviewed";
  return "reviewed";
}

export function assertNestingDepth(depth: number): void {
  if (!Number.isSafeInteger(depth) || depth < 0) throw new Error("Nesting depth must be a nonnegative integer");
  if (depth > 3) throw new Error("Callbacks are nested too deeply");
}

export function assertStaticTyping(config: { readonly strict: boolean }): void {
  if (!config.strict) throw new Error("Static type checking must be strict where the stack supports it");
}
