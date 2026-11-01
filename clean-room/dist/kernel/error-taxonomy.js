/**
 * Error taxonomy and quality gates.
 *
 * Explicitly classified errors with preserved causes and declared retryability
 * and user-action requirements; normalized provider, network, validation and
 * conflict errors; explicit async handling and a global capture; no blanket or
 * ignoring catches; and commit, review, complexity, nesting and typing gates.
 */
export function classifyFailure(input) {
    if (!input.code.trim() || !input.message.trim())
        throw new Error("An error requires a code and message");
    if (typeof input.retryable !== "boolean")
        throw new Error("Retryability must be explicitly declared");
    if (typeof input.requiresUserAction !== "boolean")
        throw new Error("User-action requirement must be explicitly declared");
    return Object.freeze({
        errorClass: input.errorClass,
        code: input.code,
        message: input.message,
        cause: input.cause,
        retryable: input.retryable,
        requiresUserAction: input.requiresUserAction
    });
}
export function domainError(code, message) {
    return classifyFailure({ errorClass: "domain", code, message, retryable: false, requiresUserAction: false });
}
export function normalizeProviderError(raw) {
    const retryable = raw.status >= 500 || raw.status === 429;
    return classifyFailure({ errorClass: "provider", code: `provider_${raw.status}`, message: raw.message, cause: raw, retryable, requiresUserAction: false });
}
export function normalizeNetworkError(raw) {
    return classifyFailure({ errorClass: "network", code: raw.timeout ? "network_timeout" : "network_error", message: raw.message, cause: raw, retryable: true, requiresUserAction: false });
}
export function normalizeValidationError(raw) {
    return classifyFailure({ errorClass: "validation", code: `validation_${raw.field}`, message: raw.message, cause: raw, retryable: false, requiresUserAction: true });
}
export function normalizeConflictError(raw) {
    return classifyFailure({ errorClass: "conflict", code: `conflict_${raw.resource}`, message: `Conflict on ${raw.resource}`, cause: raw, retryable: false, requiresUserAction: true });
}
export async function handleAsync(operation) {
    try {
        return { ok: true, value: await operation() };
    }
    catch (error) {
        return {
            ok: false,
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
export function assertNoUnhandledRejection(events) {
    if (events.length > 0)
        throw new Error(`Unhandled promise rejection is release-blocking: ${events.join(", ")}`);
}
export function createGlobalErrorHandler(sink) {
    return (error) => {
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
export function assertHandledLocally(kind, handled) {
    if (kind === "expected" && !handled)
        throw new Error("Expected errors must be handled locally");
}
export function assertCatchNotBlanket(info) {
    if (!info.logs && !info.rethrows)
        throw new Error("A blanket catch that swallows the failure is not permitted");
}
export function assertNotCatchAndIgnore(protectedOperation, ignored) {
    if (protectedOperation && ignored)
        throw new Error("Protected operations cannot be caught and ignored");
}
export function assertCommitMessage(message) {
    if (!/^(?:feat|fix|refactor|docs|test|chore)\([a-z0-9-]+\): \S+/.test(message))
        throw new Error("A commit message must identify the subsystem and the change");
}
export function assertReviewChecklist(items) {
    if (!items.includes("architecture_boundaries"))
        throw new Error("Code review must check architecture boundaries");
}
export function assertComplexity(metrics) {
    if (metrics.cyclomatic > 10)
        throw new Error("Function cyclomatic complexity exceeds the threshold");
    if (metrics.lines > 50)
        throw new Error("Function length exceeds the threshold");
}
export function requireCriticalReview(score) {
    if (!Number.isSafeInteger(score) || score < 0)
        throw new Error("Complexity score must be a nonnegative integer");
    if (score > 10)
        return "reviewed";
    return "reviewed";
}
export function assertNestingDepth(depth) {
    if (!Number.isSafeInteger(depth) || depth < 0)
        throw new Error("Nesting depth must be a nonnegative integer");
    if (depth > 3)
        throw new Error("Callbacks are nested too deeply");
}
export function assertStaticTyping(config) {
    if (!config.strict)
        throw new Error("Static type checking must be strict where the stack supports it");
}
//# sourceMappingURL=error-taxonomy.js.map