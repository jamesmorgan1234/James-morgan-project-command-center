import test from "node:test";
import assert from "node:assert/strict";
import {
  assertCompletionEvidence,
  createCheckpoint,
  evidenceMeets,
  validateEvidenceRecord,
  validateRequirementClosure
} from "../dist/kernel/index.js";

function evidence(overrides = {}) {
  return {
    id: "ev-1",
    subjectId: "phase:P1.7",
    strength: "tool_result",
    sourceRef: "ci:run-1",
    recordedAt: "2026-10-26T15:00:00.000Z",
    verified: true,
    schemaVersion: 1,
    ...overrides
  };
}

function closure(overrides = {}) {
  return {
    requirementId: "CCR-test",
    authoritativeSource: "04_MASTER_RECONCILED_REQUIREMENTS.json",
    capabilityKey: "evidence-verification",
    owningPhase: "P1.7",
    dependencyIds: ["C0"],
    implementationRefs: ["clean-room/src/kernel/evidence.ts#validateRequirementClosure"],
    positiveTestRefs: ["positive"],
    negativeTestRefs: ["negative"],
    failureTestRefs: ["failure"],
    evidenceIds: ["ev-1"],
    truthState: "verified",
    ...overrides
  };
}

test("P1.7 evidence validation admits grounded records and rejects malformed truth inputs", () => {
  const valid = validateEvidenceRecord(evidence());
  assert.equal(valid.verified, true);
  assert.equal(evidenceMeets(valid, "tool_result"), true);
  assert.equal(evidenceMeets(valid, "canonical_record"), false);
  assert.equal(evidenceMeets(evidence({ verified: false }), "recorded"), false);
  assert.equal(evidenceMeets(evidence({ sourceRef: "" }), "recorded"), false);
  assert.equal(evidenceMeets(evidence({ recordedAt: "not-a-date" }), "recorded"), false);
  assert.throws(() => validateEvidenceRecord(evidence({ id: " " })), /Evidence id is required/);
  assert.throws(() => validateEvidenceRecord(evidence({ sourceRef: " " })), /Evidence sourceRef is required/);
  assert.throws(() => validateEvidenceRecord(evidence({ recordedAt: "bad" })), /valid timestamp/);
  assert.throws(() => validateEvidenceRecord(evidence({ schemaVersion: 0 })), /positive integer/);
  assert.throws(() => validateEvidenceRecord(evidence({ testRef: " " })), /Evidence testRef is required/);
});

test("P1.7 completion claims require verified evidence of sufficient strength instead of attractive status text", () => {
  assert.doesNotThrow(() => assertCompletionEvidence([evidence()], "phase:P1.7", "tool_result"));
  assert.throws(() => assertCompletionEvidence([evidence({ verified: false })], "phase:P1.7", "recorded"), /Completion evidence missing/);
  assert.throws(() => assertCompletionEvidence([evidence({ strength: "recorded" })], "phase:P1.7", "tool_result"), /Completion evidence missing/);
  assert.throws(() => assertCompletionEvidence([evidence({ sourceRef: "" })], "phase:P1.7", "recorded"), /Completion evidence missing/);
  assert.throws(() => assertCompletionEvidence([evidence({ subjectId: "phase:other" })], "phase:P1.7", "recorded"), /Completion evidence missing/);
  assert.throws(() => assertCompletionEvidence([evidence()], " ", "recorded"), /Completion subjectId is required/);
});

test("P1.7 verified requirement closure requires implementation plus positive negative failure-path tests and evidence", () => {
  const valid = validateRequirementClosure(closure());
  assert.equal(valid.truthState, "verified");
  assert.ok(Object.isFrozen(valid));
  assert.ok(Object.isFrozen(valid.implementationRefs));

  for (const [field, value] of [
    ["implementationRefs", []],
    ["positiveTestRefs", []],
    ["negativeTestRefs", []],
    ["failureTestRefs", []],
    ["evidenceIds", []]
  ]) {
    assert.throws(() => validateRequirementClosure(closure({ [field]: value })), /Verified requirement requires/);
  }
});

test("P1.7 closure truth states preserve implemented-but-unverified and require explicit blocked or not-applicable reasons", () => {
  const implemented = validateRequirementClosure(closure({
    truthState: "implemented_unverified",
    positiveTestRefs: [],
    negativeTestRefs: [],
    failureTestRefs: [],
    evidenceIds: []
  }));
  assert.equal(implemented.truthState, "implemented_unverified");

  assert.throws(() => validateRequirementClosure(closure({ truthState: "blocked", blockerOrNonApplicabilityReason: " " })), /needs a reason/);
  assert.throws(() => validateRequirementClosure(closure({ truthState: "not_applicable" })), /needs a reason/);
  assert.equal(validateRequirementClosure(closure({ truthState: "blocked", blockerOrNonApplicabilityReason: "provider unavailable" })).truthState, "blocked");
  assert.equal(validateRequirementClosure(closure({ truthState: "not_applicable", blockerOrNonApplicabilityReason: "capability excluded by scope" })).truthState, "not_applicable");
});

test("P1.7 requirement closure rejects blank and duplicate traceability references", () => {
  assert.throws(() => validateRequirementClosure(closure({ implementationRefs: [" "] })), /blank references/);
  assert.throws(() => validateRequirementClosure(closure({ positiveTestRefs: ["same", "same"] })), /duplicate references/);
  assert.throws(() => validateRequirementClosure(closure({ evidenceIds: ["ev-1", "ev-1"] })), /duplicate references/);
  assert.throws(() => validateRequirementClosure(closure({ requirementId: " " })), /requirementId is required/);
});

test("P1.7 checkpoints are deterministic verified resume pointers with valid identity timestamp and evidence references", () => {
  const checkpoint = createCheckpoint({
    id: "cp-1",
    subjectId: "phase:P1.7",
    summary: "Verification state captured",
    exactNextAction: "Run the next strict traceability cluster",
    evidenceIds: ["ev-1"],
    createdAt: "2026-10-26T15:00:00.000Z"
  });
  assert.ok(Object.isFrozen(checkpoint));
  assert.ok(Object.isFrozen(checkpoint.evidenceIds));
  assert.throws(() => createCheckpoint({ ...checkpoint, id: " " }), /Checkpoint id is required/);
  assert.throws(() => createCheckpoint({ ...checkpoint, subjectId: " " }), /Checkpoint subjectId is required/);
  assert.throws(() => createCheckpoint({ ...checkpoint, summary: " " }), /Checkpoint summary is required/);
  assert.throws(() => createCheckpoint({ ...checkpoint, exactNextAction: " " }), /Checkpoint exactNextAction is required/);
  assert.throws(() => createCheckpoint({ ...checkpoint, createdAt: "bad" }), /valid timestamp/);
  assert.throws(() => createCheckpoint({ ...checkpoint, evidenceIds: [] }), /must reference evidence/);
  assert.throws(() => createCheckpoint({ ...checkpoint, evidenceIds: ["ev-1", "ev-1"] }), /duplicate references/);
  assert.throws(() => createCheckpoint({ ...checkpoint, evidenceIds: [" "] }), /blank references/);
});
