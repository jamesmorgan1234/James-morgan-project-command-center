import test from "node:test";
import assert from "node:assert/strict";
import {
  planVersion, expandPlan, planDiff, percentageAfterExpansion,
  barrierSweep, rejectTimeBasedProgress, rejectStatusBasedProgress, progressExplanation
} from "../dist/projects/roadmap-progress.js";
import {
  assertTrustworthyPlan, taskWeight, linkProgressToEvidence, checkpointReverify,
  resumeSameRun, assertNoRunRecreation, assertNoProjectSwitch, smallestBlockedOperation
} from "../dist/projects/run-resume.js";
import {
  unitId, checkpointAncestry, firstIncomplete, reopenAffected,
  recordScopeExpansion, recalculatePercentage, projectTransition, sectionAdapter
} from "../dist/projects/roadmap-structure.js";

test("P1.x plan versioning", () => {
  assert.equal(planVersion(2), 2);
  assert.throws(() => planVersion(0), /positive integer/);
});

test("P1.x dynamic plan expansion", () => {
  assert.deepEqual([...expandPlan({ units: ["a"], version: 1 }, ["b"]).units], ["a", "b"]);
  assert.throws(() => expandPlan({ units: ["a"], version: 1 }, ["a"]), /duplicate/);
});

test("P1.x plan-diff history", () => {
  assert.deepEqual([...planDiff(["a"], ["a", "b"]).added], ["b"]);
});

test("P1.x plan expansion can decrease the percentage", () => {
  assert.equal(percentageAfterExpansion(50, 40), 40);
  assert.throws(() => percentageAfterExpansion(40, 50), /never inflate/);
});

test("P1.x barrier-sweep count and progress separate", () => {
  assert.deepEqual(barrierSweep(4, 1), { count: 4, done: 1, percentage: 25 });
  assert.throws(() => barrierSweep(2, 3), /consistent/);
});

test("P1.x no time-based fake progress", () => {
  assert.doesNotThrow(() => rejectTimeBasedProgress(0, 0));
  assert.throws(() => rejectTimeBasedProgress(1000, 10), /elapsed time/);
});

test("P1.x no status-based fake progress", () => {
  assert.doesNotThrow(() => rejectStatusBasedProgress(0));
  assert.throws(() => rejectStatusBasedProgress(40), /status alone/);
});

test("P1.x progress explanation available", () => {
  assert.equal(progressExplanation([{ id: "u1", done: false }]), "remaining:u1");
  assert.throws(() => progressExplanation([]), /requires units/);
});

test("P1.x verified tasks and trustworthy plan only", () => {
  assert.doesNotThrow(() => assertTrustworthyPlan({ tasks: [{ verified: true }] }));
  assert.throws(() => assertTrustworthyPlan({ tasks: [{ verified: false }] }), /verified tasks/);
});

test("P1.x task weights only where legitimately defined", () => {
  assert.equal(taskWeight({ weight: 3 }), 3);
  assert.throws(() => taskWeight({ weight: null }), /legitimately defined/);
});

test("P1.x roadmap progress linked to evidence", () => {
  assert.doesNotThrow(() => linkProgressToEvidence({ evidenceIds: ["e1"] }));
  assert.throws(() => linkProgressToEvidence({ evidenceIds: [] }), /link to evidence/);
});

test("P1.x checkpoint re-verifies downstream state", () => {
  assert.deepEqual([...checkpointReverify([{ id: "d1" }])], ["d1"]);
});

test("P1.x same run resumes after verification", () => {
  assert.deepEqual(resumeSameRun("r1", "t2"), { runId: "r1", resumeAt: "t2" });
  assert.throws(() => resumeSameRun(" ", "t2"), /requires a run/);
});

test("P1.x no run recreation after a blocker", () => {
  assert.doesNotThrow(() => assertNoRunRecreation("r1", "r1"));
  assert.throws(() => assertNoRunRecreation("r1", "r2"), /same run must resume/);
});

test("P1.x no project switching after a blocker", () => {
  assert.doesNotThrow(() => assertNoProjectSwitch("p1", "p1"));
  assert.throws(() => assertNoProjectSwitch("p1", "p2"), /No project switching/);
});

test("P1.x work task is the smallest useful blocked operation", () => {
  assert.equal(smallestBlockedOperation([{ id: "big", size: 9 }, { id: "small", size: 2 }]), "small");
});

test("P1.x stable roadmap-unit IDs", () => {
  assert.equal(unitId("RU", 1), "RU-001");
  assert.throws(() => unitId("RU", 0), /index must be positive/);
});

test("P1.x checkpoint ancestry", () => {
  assert.deepEqual([...checkpointAncestry(["c1"], "c2")], ["c1", "c2"]);
  assert.throws(() => checkpointAncestry(["c1"], "c1"), /cannot cycle/);
});

test("P1.x first-incomplete-unit pointer", () => {
  assert.equal(firstIncomplete([{ done: true }, { done: false }]), 1);
  assert.equal(firstIncomplete([{ done: true }]), 1);
});

test("P1.x reopen only affected units", () => {
  assert.deepEqual([...reopenAffected([{ id: "a", affected: true }, { id: "b", affected: false }])], ["a"]);
});

test("P1.x scope-expansion history", () => {
  assert.deepEqual([...recordScopeExpansion(["init"], "add unit")], ["init", "add unit"]);
  assert.throws(() => recordScopeExpansion(["init"], "init"), /append-only/);
});

test("P1.x percentage recalculation after scope change", () => {
  assert.equal(recalculatePercentage([{ done: true, weight: 1 }, { done: false, weight: 3 }]), 25);
});

test("P1.x project lifecycle state machine", () => {
  assert.equal(projectTransition("active", "block"), "blocked");
  assert.throws(() => projectTransition("complete", "start"), /Invalid project transition/);
});

test("P1.x project-detail-section adapters", () => {
  assert.equal(sectionAdapter("runs", ["runs", "evidence"]), "runs");
  assert.throws(() => sectionAdapter("finance", ["runs"]), /Unknown project-detail/);
});
