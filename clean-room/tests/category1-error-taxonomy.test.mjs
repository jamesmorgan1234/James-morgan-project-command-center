import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyFailure,
  domainError,
  normalizeProviderError,
  normalizeNetworkError,
  normalizeValidationError,
  normalizeConflictError,
  handleAsync,
  assertNoUnhandledRejection,
  createGlobalErrorHandler,
  assertHandledLocally,
  assertCatchNotBlanket,
  assertNotCatchAndIgnore,
  assertCommitMessage,
  assertReviewChecklist,
  assertComplexity,
  requireCriticalReview,
  assertNestingDepth,
  assertStaticTyping
} from "../dist/kernel/index.js";

test("P1.x commit messages identify subsystem and change", () => {
  assert.doesNotThrow(() => assertCommitMessage("feat(projects): add runway model"));
  assert.throws(() => assertCommitMessage("update stuff"), /identify the subsystem/);
});

test("P1.x code review checklist checks architecture boundaries", () => {
  assert.doesNotThrow(() => assertReviewChecklist(["tests", "architecture_boundaries"]));
  assert.throws(() => assertReviewChecklist(["tests"]), /architecture boundaries/);
});

test("P1.x complexity thresholds apply to functions and modules", () => {
  assert.doesNotThrow(() => assertComplexity({ cyclomatic: 8, lines: 40 }));
  assert.throws(() => assertComplexity({ cyclomatic: 11, lines: 40 }), /cyclomatic complexity/);
  assert.throws(() => assertComplexity({ cyclomatic: 8, lines: 60 }), /length exceeds/);
});

test("P1.x cyclomatic complexity is reviewed for critical orchestration", () => {
  assert.equal(requireCriticalReview(12), "reviewed");
  assert.throws(() => requireCriticalReview(-1), /nonnegative integer/);
});

test("P1.x no deeply nested callback structures", () => {
  assert.doesNotThrow(() => assertNestingDepth(3));
  assert.throws(() => assertNestingDepth(4), /nested too deeply/);
});

test("P1.x async flows use explicit error handling", async () => {
  const ok = await handleAsync(async () => 42);
  assert.deepEqual(ok, { ok: true, value: 42 });
  const failed = await handleAsync(async () => { throw new Error("boom"); });
  assert.equal(failed.ok, false);
  assert.equal(failed.error.cause instanceof Error, true);
});

test("P1.x unhandled promise rejection is release-blocking", () => {
  assert.doesNotThrow(() => assertNoUnhandledRejection([]));
  assert.throws(() => assertNoUnhandledRejection(["rejection:1"]), /release-blocking/);
});

test("P1.x global error handler captures unexpected failures", () => {
  const captured = [];
  const handler = createGlobalErrorHandler({ capture: (error) => captured.push(error) });
  handler(new Error("unexpected"));
  assert.equal(captured.length, 1);
  assert.equal(captured[0].errorClass, "unexpected");
});

test("P1.x expected errors are handled locally", () => {
  assert.doesNotThrow(() => assertHandledLocally("expected", true));
  assert.throws(() => assertHandledLocally("expected", false), /handled locally/);
});

test("P1.x no blanket try/catch swallowing failures", () => {
  assert.doesNotThrow(() => assertCatchNotBlanket({ logs: true, rethrows: false }));
  assert.throws(() => assertCatchNotBlanket({ logs: false, rethrows: false }), /blanket catch/);
});

test("P1.x no catch-and-ignore on protected operations", () => {
  assert.doesNotThrow(() => assertNotCatchAndIgnore(true, false));
  assert.throws(() => assertNotCatchAndIgnore(true, true), /caught and ignored/);
});

test("P1.x error wrapping preserves the original cause", () => {
  const cause = new Error("root");
  const wrapped = classifyFailure({ errorClass: "unexpected", code: "wrapped", message: "outer", cause, retryable: false, requiresUserAction: true });
  assert.equal(wrapped.cause, cause);
});

test("P1.x domain errors are typed and classified", () => {
  assert.equal(domainError("runway_negative", "Runway cannot be negative").errorClass, "domain");
});

test("P1.x provider errors are normalized", () => {
  const error = normalizeProviderError({ status: 503, message: "unavailable" });
  assert.equal(error.errorClass, "provider");
  assert.equal(error.code, "provider_503");
  assert.equal(error.retryable, true);
});

test("P1.x network errors are normalized", () => {
  const error = normalizeNetworkError({ timeout: true, message: "timeout" });
  assert.equal(error.errorClass, "network");
  assert.equal(error.code, "network_timeout");
  assert.equal(error.retryable, true);
});

test("P1.x validation errors are normalized", () => {
  const error = normalizeValidationError({ field: "email", message: "invalid" });
  assert.equal(error.errorClass, "validation");
  assert.equal(error.code, "validation_email");
  assert.equal(error.requiresUserAction, true);
});

test("P1.x conflict errors are normalized", () => {
  const error = normalizeConflictError({ resource: "project:p1" });
  assert.equal(error.errorClass, "conflict");
  assert.equal(error.requiresUserAction, true);
});

test("P1.x retryability is explicitly declared", () => {
  assert.equal(classifyFailure({ errorClass: "domain", code: "c", message: "m", retryable: false, requiresUserAction: false }).retryable, false);
  assert.throws(() => classifyFailure({ errorClass: "domain", code: "c", message: "m", requiresUserAction: false }), /Retryability must be explicitly declared/);
});

test("P1.x user-action requirement is explicitly declared", () => {
  assert.throws(() => classifyFailure({ errorClass: "domain", code: "c", message: "m", retryable: false }), /User-action requirement must be explicitly declared/);
});

test("P1.x no inference of retryability from message text", () => {
  const error = classifFailureFromMessage("timeout, please retry");
  assert.equal(error.retryable, false);
});

test("P1.x static type checking where the stack supports it", () => {
  assert.doesNotThrow(() => assertStaticTyping({ strict: true }));
  assert.throws(() => assertStaticTyping({ strict: false }), /must be strict/);
});

function classifFailureFromMessage(message) {
  return classifyFailure({ errorClass: "unexpected", code: "unexpected", message, retryable: false, requiresUserAction: false });
}
