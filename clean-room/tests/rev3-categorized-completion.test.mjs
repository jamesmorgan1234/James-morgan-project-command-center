import test from "node:test";
import assert from "node:assert/strict";
import {
  SchedulerControlPlane,
  createAgencyExecutionContextPacket,
  replayChoices,
  evaluateCanary,
  canAct,
  assertAutonomyCannotExpandScope
} from "../dist/agency/index.js";
import {
  evaluateOwnerPrecedent,
  resolveReferent,
  freezeExecutionSnapshot,
  applySteering
} from "../dist/brain/index.js";
import { validatePrototypeFeedback } from "../dist/projects/index.js";

const H = (char) => char.repeat(64);

test("CCR-05827 Agency control-plane leadership is singular, fenced, expiring and safely reacquirable", () => {
  const plane = new SchedulerControlPlane();
  const first = plane.acquire("leader:a", "2026-10-26T12:00:00Z", "2026-10-26T12:01:00Z");
  assert.doesNotThrow(() => plane.assertLeader("leader:a", first.fencingToken, "2026-10-26T12:00:30Z"));
  assert.throws(() => plane.acquire("leader:b", "2026-10-26T12:00:40Z", "2026-10-26T12:02:00Z"), /already held/);
  const second = plane.acquire("leader:b", "2026-10-26T12:01:00Z", "2026-10-26T12:02:00Z");
  assert.equal(second.fencingToken > first.fencingToken, true);
  assert.throws(() => plane.assertLeader("leader:a", first.fencingToken, "2026-10-26T12:01:01Z"), /mismatch/);
  assert.throws(() => plane.assertLeader("leader:b", second.fencingToken, "2026-10-26T12:02:00Z"), /expired/);
});

test("CCR-05830 immutable Agency context packet requires bounded tools/scope and rejects incomplete execution envelopes", () => {
  const packet = createAgencyExecutionContextPacket({
    id: "packet:1", runId: "run:1", taskId: "task:1", projectId: "project:1",
    builtAt: "2026-10-26T12:00:00Z", staleAfter: "2026-10-26T12:10:00Z", maxSensitivityRank: 2,
    sourceRefs: [{ id: "source:spec", version: 1, contentHash: H("a"), sensitivityRank: 2 }],
    artifactRefs: ["artifact:working"], evidenceRefs: ["evidence:packet"], missionRef: "mission:build",
    ownerRuleRefs: ["owner-rule:newest"], protectedAssetRefs: ["asset:approved"], allowedToolRefs: ["tool:github"],
    readScopes: ["repo:read"], writeScopes: ["repo:branch:isolated"], dependencyRefs: ["dependency:p15"],
    acceptanceCriteriaRefs: ["acceptance:tests"], authorizationSnapshotRef: "authorization:snapshot:1"
  });
  assert.equal(packet.taskId, "task:1");
  assert.deepEqual(packet.writeScopes, ["repo:branch:isolated"]);
  assert.throws(() => createAgencyExecutionContextPacket({ ...packet, allowedToolRefs: [] }), /allowed tools/);
  assert.deepEqual(createAgencyExecutionContextPacket({ ...packet, writeScopes: [] }).writeScopes, []);
});

test("CCR-05832 deterministic orchestration replay preserves ordered recorded choices and rejects incomplete record identity", () => {
  const choices = [
    { sequence: 1, kind: "scheduler", inputHash: "in1", outputHash: "out1", chosenValue: "leader:a" },
    { sequence: 2, kind: "policy", inputHash: "in2", outputHash: "out2", chosenValue: "deny-by-default" },
    { sequence: 3, kind: "random", inputHash: "in3", outputHash: "out3", chosenValue: "seed:17" }
  ];
  assert.deepEqual(replayChoices(choices), ["leader:a", "deny-by-default", "seed:17"]);
  assert.throws(() => replayChoices([{ ...choices[0], sequence: 2 }]), /sequence gap/);
  assert.throws(() => replayChoices([{ ...choices[0], inputHash: "" }]), /input\/output hash/);
});

test("CCR-05834 canary/shadow Agency rollout promotes only safe candidates and rolls back regressions or unsafe effects", () => {
  const stable = { successRate: 0.98, verificationFailureRate: 0.01, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 0 };
  assert.deepEqual(evaluateCanary(stable, { successRate: 0.98, verificationFailureRate: 0.01, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 0 }, 0.02), { promote: true, action: "promote", reason: "candidate_within_safe_thresholds" });
  assert.equal(evaluateCanary(stable, { ...stable, protectedBoundaryViolationCount: 1 }, 0.02).action, "rollback");
  assert.equal(evaluateCanary(stable, { ...stable, duplicateSideEffectCount: 1 }, 0.02).action, "rollback");
  assert.equal(evaluateCanary(stable, { ...stable, successRate: 0.80 }, 0.02).action, "rollback");
  assert.equal(evaluateCanary(stable, { ...stable, verificationFailureRate: 0.02 }, 0.02).action, "rollback");
  assert.throws(() => evaluateCanary(stable, { ...stable }, -1), /non-negative/);
});

test("CCR-05837 autonomy levels remain explicit and cannot bypass protected action or scope boundaries", () => {
  assert.equal(canAct("observe", "recommend", false), false);
  assert.equal(canAct("propose", "recommend", false), true);
  assert.equal(canAct("prepare", "defaultable", false), true);
  assert.equal(canAct("execute", "self_decidable", false), true);
  assert.equal(canAct("continuous", "protected", false), false);
  assert.equal(canAct("continuous", "protected", true), true);
  assert.equal(canAct("continuous", "prohibited", true), false);
  assert.doesNotThrow(() => assertAutonomyCannotExpandScope(["repo:read", "repo:isolated-write"], ["repo:read"]));
  assert.throws(() => assertAutonomyCannotExpandScope(["repo:read"], ["repo:production-write"]), /cannot amplify authority/);
});

test("CCR-05839 owner precedent is bounded to same material context and never carries authorization", () => {
  const context = { projectType: "software", accountScope: "repo:cc", riskClass: "medium", costClass: "zero", actionClass: "isolated-build" };
  const precedent = { decisionRef: "decision:1", context, reusableAsDefault: true, grantsAuthorization: true };
  const same = evaluateOwnerPrecedent(precedent, context);
  assert.equal(same.applies, true);
  assert.equal(same.authorizationInherited, false);
  const changed = evaluateOwnerPrecedent(precedent, { ...context, costClass: "paid" });
  assert.equal(changed.applies, false);
  assert.match(changed.reason, /costClass/);
  assert.equal(changed.authorizationInherited, false);
  assert.equal(evaluateOwnerPrecedent({ ...precedent, reusableAsDefault: false }, context).applies, false);
});

test("CCR-05840 conversational authorization resolves exact referent and freezes immutable proposal version", () => {
  const proposal = { id: "proposal:7", projectId: "project:cc", version: 7, title: "Exact isolated build", decisionRefs: ["decision:7"], requirementRefs: ["CCR-05840"], actionRefs: ["action:isolated-build"] };
  const resolved = resolveReferent("go ahead with that", proposal, [proposal]);
  const snapshot = freezeExecutionSnapshot(resolved, "authorization:7", "snapshot:7");
  assert.equal(snapshot.proposalId, proposal.id);
  assert.equal(snapshot.proposalVersion, 7);
  assert.deepEqual(snapshot.actionRefs, ["action:isolated-build"]);
  assert.throws(() => resolveReferent("go ahead with that", undefined, [proposal]), /ambiguous/);
  assert.throws(() => freezeExecutionSnapshot({ ...proposal, actionRefs: [] }, "authorization:7", "snapshot:bad"), /at least one action/);
});

test("CCR-05841 live conversational steering preserves unaffected verified work, invalidates dependents and requires reauthorization for material change", () => {
  const units = [
    { id: "done", dependencyIds: [], verified: true, authorizationScope: ["repo:read"] },
    { id: "target", dependencyIds: [], verified: false, authorizationScope: ["repo:isolated-write"] },
    { id: "dependent", dependencyIds: ["target"], verified: false, authorizationScope: ["repo:isolated-write"] }
  ];
  const changed = applySteering("change", ["target"], units);
  assert.deepEqual(changed.preservedVerifiedIds, ["done"]);
  assert.deepEqual(changed.invalidatedIds, ["target", "dependent"]);
  assert.equal(changed.requiresAuthorizationRecheck, true);
  const paused = applySteering("pause", [], units);
  assert.equal(paused.requiresAuthorizationRecheck, false);
  assert.deepEqual(paused.preservedVerifiedIds, ["done"]);
});

test("CCR-05844 prototype/usability lane preserves authoritative requirement lineage and protected visual assets", () => {
  const prototype = { id: "prototype:1", projectId: "project:cc", specVersion: 3, requirementRefs: ["CCR-05844"], protectedDesignAssetRefs: ["asset:approved-ui"], artifactRef: "artifact:wireframe" };
  assert.doesNotThrow(() => validatePrototypeFeedback(prototype, { id: "feedback:1", prototypeId: prototype.id, requirementRefs: ["CCR-05844"], decisionRef: "decision:feedback", changesProtectedDesign: false }));
  assert.throws(() => validatePrototypeFeedback(prototype, { id: "feedback:2", prototypeId: prototype.id, requirementRefs: ["CCR-99999"], decisionRef: "decision:feedback", changesProtectedDesign: false }), /outside prototype lineage/);
  assert.throws(() => validatePrototypeFeedback(prototype, { id: "feedback:3", prototypeId: prototype.id, requirementRefs: ["CCR-05844"], decisionRef: "decision:feedback", changesProtectedDesign: true }), /owner authorization/);
  assert.doesNotThrow(() => validatePrototypeFeedback(prototype, { id: "feedback:4", prototypeId: prototype.id, requirementRefs: ["CCR-05844"], decisionRef: "decision:feedback", changesProtectedDesign: true, protectedDesignOwnerAuthorizationRef: "owner:authorized-change" }));
});
