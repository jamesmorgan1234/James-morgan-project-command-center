import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createCircuitBreaker,
  requestCircuitBreakerPermit,
  recordCircuitBreakerFailure,
  recordCircuitBreakerSuccess,
  createDeadLetter,
  manageDeadLetter
} from "../dist/agency/resilience.js";

const t0 = "2026-10-30T00:00:00.000Z";
const t1 = "2026-10-30T00:00:01.000Z";
const t2 = "2026-10-30T00:00:02.000Z";
const t7 = "2026-10-30T00:00:07.000Z";
const t8 = "2026-10-30T00:00:08.000Z";

function projectBreaker() {
  return createCircuitBreaker({
    breakerId: "breaker-project-alpha",
    scope: "project",
    scopeKey: "project-alpha",
    failureThreshold: 2,
    cooldownMs: 5000
  }, ["evidence:breaker-config"]);
}

test("P7 resilience project circuit breaker opens at threshold blocks during cooldown probes half-open and recovers", () => {
  let breaker = projectBreaker();
  breaker = recordCircuitBreakerFailure(breaker, t0, ["evidence:failure-1"]);
  assert.equal(breaker.state, "closed");
  assert.equal(breaker.failureCount, 1);

  breaker = recordCircuitBreakerFailure(breaker, t1, ["evidence:failure-2"]);
  assert.equal(breaker.state, "open");
  assert.equal(breaker.failureCount, 2);

  const blocked = requestCircuitBreakerPermit(breaker, t2, ["evidence:cooldown-check"]);
  assert.deepEqual({ allowed: blocked.allowed, reason: blocked.reason }, { allowed: false, reason: "cooldown" });
  assert.equal(blocked.breaker.version, breaker.version);

  const probe = requestCircuitBreakerPermit(breaker, t7, ["evidence:probe"]);
  assert.deepEqual({ allowed: probe.allowed, reason: probe.reason }, { allowed: true, reason: "half_open_probe" });
  assert.equal(probe.breaker.state, "half_open");

  const duplicateProbe = requestCircuitBreakerPermit(probe.breaker, t8, ["evidence:duplicate-probe"]);
  assert.deepEqual({ allowed: duplicateProbe.allowed, reason: duplicateProbe.reason }, { allowed: false, reason: "probe_in_flight" });

  breaker = recordCircuitBreakerSuccess(probe.breaker, t8, ["evidence:probe-success"]);
  assert.equal(breaker.state, "closed");
  assert.equal(breaker.failureCount, 0);
  assert.equal(breaker.openedAt, null);
  assert.equal(breaker.probeStartedAt, null);
});

test("P7 resilience failed half-open probe reopens and refreshes cooldown", () => {
  let breaker = projectBreaker();
  breaker = recordCircuitBreakerFailure(breaker, t0, ["evidence:f1"]);
  breaker = recordCircuitBreakerFailure(breaker, t1, ["evidence:f2"]);
  const probe = requestCircuitBreakerPermit(breaker, t7, ["evidence:probe"]);
  breaker = recordCircuitBreakerFailure(probe.breaker, t8, ["evidence:probe-failed"]);
  assert.equal(breaker.state, "open");
  assert.equal(breaker.openedAt, t8);
  assert.equal(breaker.probeStartedAt, null);
  assert.equal(requestCircuitBreakerPermit(breaker, "2026-10-30T00:00:10.000Z", ["evidence:still-cooling"]).allowed, false);
});

test("P7 resilience portfolio circuit breaker is independent from project breakers", () => {
  const project = projectBreaker();
  let portfolio = createCircuitBreaker({
    breakerId: "breaker-portfolio-main",
    scope: "portfolio",
    scopeKey: "portfolio-main",
    failureThreshold: 1,
    cooldownMs: 1000
  }, ["evidence:portfolio-config"]);
  portfolio = recordCircuitBreakerFailure(portfolio, t0, ["evidence:portfolio-failure"]);
  assert.equal(portfolio.state, "open");
  assert.equal(portfolio.scope, "portfolio");
  assert.equal(project.state, "closed");
  assert.equal(project.scope, "project");
});

test("P7 resilience invalid breaker configuration and unpermitted transitions fail closed", () => {
  assert.throws(() => createCircuitBreaker({ breakerId: "bad", scope: "project", scopeKey: "p", failureThreshold: 0, cooldownMs: 1000 }, ["e"]), /positive safe integer/);
  assert.throws(() => createCircuitBreaker({ breakerId: "bad", scope: "project", scopeKey: "p", failureThreshold: 1, cooldownMs: 0 }, ["e"]), /positive safe integer/);
  assert.throws(() => createCircuitBreaker({ breakerId: "bad", scope: "project", scopeKey: "p", failureThreshold: 1, cooldownMs: 1000 }, []), /requires evidence/);
  let breaker = createCircuitBreaker({ breakerId: "b", scope: "project", scopeKey: "p", failureThreshold: 1, cooldownMs: 1000 }, ["e:config"]);
  breaker = recordCircuitBreakerFailure(breaker, t0, ["e:failure"]);
  assert.throws(() => recordCircuitBreakerFailure(breaker, t1, ["e:unpermitted"]), /unpermitted failure/);
  assert.throws(() => recordCircuitBreakerSuccess(breaker, t1, ["e:false-success"]), /half-open probe/);
});

function deadLetterInput(overrides = {}) {
  return {
    deadLetterId: "dl-1",
    ownerId: "owner-1",
    projectId: "project-1",
    runId: "run-1",
    taskId: "task-1",
    disposition: "dead_letter",
    failureClass: "retry_exhausted",
    attemptCount: 3,
    reason: "retry budget exhausted",
    occurredAt: t0,
    evidenceRefs: ["evidence:retry-history", "evidence:last-failure"],
    ...overrides
  };
}

const exactScope = Object.freeze({ ownerId: "owner-1", projectId: "project-1", runId: "run-1", taskId: "task-1" });

test("P7 resilience exhausted and permanent failures enter dead-letter while blockers stay distinct", () => {
  const exhausted = createDeadLetter(deadLetterInput());
  assert.equal(exhausted.state, "dead_letter");
  assert.equal(exhausted.failureClass, "retry_exhausted");
  assert.equal(exhausted.taskCompletionAuthorized, false);

  const permanent = createDeadLetter(deadLetterInput({ deadLetterId: "dl-2", failureClass: "permanent_failure", reason: "permanent provider rejection" }));
  assert.equal(permanent.state, "dead_letter");

  const blocked = createDeadLetter(deadLetterInput({ deadLetterId: "dl-3", disposition: "blocked", failureClass: "blocked", reason: "owner input required" }));
  assert.equal(blocked.state, "blocked");
  assert.equal(blocked.taskCompletionAuthorized, false);

  assert.throws(() => createDeadLetter(deadLetterInput({ disposition: "dead_letter", failureClass: "blocked" })), /exhausted or permanent/);
  assert.throws(() => createDeadLetter(deadLetterInput({ disposition: "blocked", failureClass: "retry_exhausted" })), /blocked failure class/);
});

test("P7 resilience dead-letter requeue and resolution preserve history and never authorize completion", () => {
  const initial = createDeadLetter(deadLetterInput());
  const requeued = manageDeadLetter(initial, exactScope, "requeue", "verified retry preconditions restored", t1, ["evidence:requeue-review"]);
  assert.equal(requeued.state, "requeued");
  assert.equal(requeued.version, 2);
  assert.equal(requeued.transitions.length, 1);
  assert.equal(requeued.transitions[0].from, "dead_letter");
  assert.equal(requeued.transitions[0].to, "requeued");
  assert.equal(requeued.taskCompletionAuthorized, false);
  assert.ok(requeued.evidenceRefs.includes("evidence:retry-history"));
  assert.ok(requeued.evidenceRefs.includes("evidence:requeue-review"));

  const blocked = createDeadLetter(deadLetterInput({ deadLetterId: "dl-blocked", disposition: "blocked", failureClass: "blocked", reason: "missing owner input" }));
  const resolved = manageDeadLetter(blocked, exactScope, "resolve", "blocker evidence resolved; task remains separately governed", t1, ["evidence:blocker-resolution"]);
  assert.equal(resolved.state, "resolved");
  assert.equal(resolved.taskCompletionAuthorized, false);
  assert.equal(resolved.transitions[0].from, "blocked");
  assert.equal(resolved.transitions[0].to, "resolved");
});

test("P7 resilience dead-letter management rejects scope mismatch stale time and repeated transitions", () => {
  const initial = createDeadLetter(deadLetterInput());
  assert.throws(() => manageDeadLetter(initial, { ...exactScope, projectId: "other-project" }, "requeue", "wrong scope", t1, ["evidence:x"]), /scope mismatch/);
  assert.throws(() => manageDeadLetter(initial, exactScope, "requeue", "stale transition", "2026-10-29T23:59:59.000Z", ["evidence:stale"]), /cannot move backward/);
  const requeued = manageDeadLetter(initial, exactScope, "requeue", "valid requeue", t1, ["evidence:valid"]);
  assert.throws(() => manageDeadLetter(requeued, exactScope, "resolve", "cannot silently convert a requeued task", t2, ["evidence:again"]), /Only active dead-letter\/blocked records/);
});

test("P7 resilience durable migration is owner-scoped read-only and evidence-gated", async () => {
  const sql = await readFile(new URL("../../supabase/migrations/20261030030000_category7_circuit_breaker_dead_letter.sql", import.meta.url), "utf8");
  for (const required of [
    "command_center_agency_circuit_breakers",
    "command_center_agency_circuit_breaker_events",
    "command_center_agency_dead_letters",
    "command_center_agency_dead_letter_actions",
    "enable row level security",
    "grant select",
    "is_command_center_authorized()",
    "security definer",
    "half_open",
    "retry_exhausted",
    "permanent_failure",
    "requeued",
    "resolved"
  ]) assert.match(sql, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete|all)\s+on\s+table[^;]+to\s+authenticated/i);
});
