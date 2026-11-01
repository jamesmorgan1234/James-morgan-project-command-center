import test from "node:test";
import assert from "node:assert/strict";
import { blockedStatus, ExecutionHistory } from "../dist/agency/index.js";

const T0 = "2026-10-31T10:00:00.000Z";
const T1 = "2026-10-31T10:05:00.000Z";
const T2 = "2026-10-31T10:10:00.000Z";

test("P7.2 agent surfaces cannot safely continue instead of guessing", () => {
  const status = blockedStatus("cannot_safely_continue", "Ambiguous state; refusing to guess", { task: "t1" });
  assert.equal(status.reason, "cannot_safely_continue");
  assert.equal(status.requiresOwner, true);
  assert.equal(status.detail.task, "t1");
  assert.throws(() => blockedStatus("cannot_safely_continue", " "), /requires a message/);
});

test("P7.2 agent surfaces capability missing instead of inventing execution", () => {
  const status = blockedStatus("capability_missing", "No executor advertises reports.export");
  assert.equal(status.reason, "capability_missing");
  assert.equal(status.requiresOwner, false);
});

test("P7.2 agent surfaces verification impossible distinctly", () => {
  const status = blockedStatus("verification_impossible", "No verification path for this side effect");
  assert.equal(status.reason, "verification_impossible");
  assert.notEqual(status.reason, "cannot_safely_continue");
});

test("P7.2 agent surfaces authorization expired", () => {
  const status = blockedStatus("authorization_expired", "Owner authorization expired", { expiredAt: T0 });
  assert.equal(status.reason, "authorization_expired");
  assert.equal(status.requiresOwner, true);
});

test("P7.2 agent surfaces state changed since plan", () => {
  const status = blockedStatus("state_changed_since_plan", "Project state moved past the plan");
  assert.equal(status.reason, "state_changed_since_plan");
  assert.equal(status.requiresOwner, false);
});

test("P7.2 agent surfaces project rule conflict", () => {
  const status = blockedStatus("project_rule_conflict", "Plan violates the project budget rule");
  assert.equal(status.reason, "project_rule_conflict");
  assert.equal(status.requiresOwner, true);
});

test("P7.2 agent surfaces resource unavailable", () => {
  const status = blockedStatus("resource_unavailable", "Repository mirror is unavailable");
  assert.equal(status.reason, "resource_unavailable");
  assert.equal(status.requiresOwner, false);
});

test("P7.2 agent surfaces owner decision required", () => {
  const status = blockedStatus("owner_decision_required", "Two viable options; owner must choose");
  assert.equal(status.reason, "owner_decision_required");
  assert.equal(status.requiresOwner, true);
});

test("P7.2 agent surfaces external provider required", () => {
  const status = blockedStatus("external_provider_required", "Publishing requires a connected provider");
  assert.equal(status.reason, "external_provider_required");
  assert.equal(status.requiresOwner, true);
});

test("P7.2 agent surfaces future capability recommended", () => {
  const status = blockedStatus("future_capability_recommended", "This needs the reporting capability");
  assert.equal(status.reason, "future_capability_recommended");
  assert.equal(status.requiresOwner, true);
});

test("P7.2 execution history is queryable by project and run", () => {
  const history = new ExecutionHistory();
  history.record({ projectId: "p1", runKey: "r1", taskKey: "t1", at: T1, outcome: "started", code: "start", detail: "" });
  history.record({ projectId: "p1", runKey: "r1", taskKey: "t1", at: T2, outcome: "failed", code: "executor_error", detail: "timeout" });
  history.record({ projectId: "p2", runKey: "r2", taskKey: "t2", at: T1, outcome: "started", code: "start", detail: "" });
  assert.equal(history.query({ projectId: "p1" }).length, 2);
  assert.equal(history.query({ projectId: "p1", runKey: "r1" }).length, 2);
  assert.equal(history.query({ runKey: "r1" })[0].code, "start");
  assert.throws(() => history.query({}), /requires a project or run/);
});

test("P7.2 execution history supports root-cause analysis", () => {
  const history = new ExecutionHistory();
  history.record({ projectId: "p1", runKey: "r1", taskKey: "t1", at: T0, outcome: "started", code: "start", detail: "" });
  history.record({ projectId: "p1", runKey: "r1", taskKey: "t1", at: T1, outcome: "blocked", code: "capability_missing", detail: "no executor" });
  history.record({ projectId: "p1", runKey: "r1", taskKey: "t1", at: T2, outcome: "failed", code: "cascade", detail: "" });
  const cause = history.rootCause("p1", "r1");
  assert.equal(cause.code, "capability_missing");
  assert.equal(history.rootCause("p2", "r2"), null);
});
