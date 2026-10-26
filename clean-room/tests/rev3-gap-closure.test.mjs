import test from "node:test";
import assert from "node:assert/strict";
import {
  createAgencyExecutionContextPacket,
  detectCoordinationFaults,
  coordinationRecoveryDisposition,
  replayAgencyWorkloadFixture,
  validateLogicalLeadAssignment,
  handoffLogicalLead,
  failoverLogicalLead
} from "../dist/agency/index.js";
import { advanceFoundry } from "../dist/projects/index.js";
import {
  evaluateOriginalFirstRecovery,
  validateRecoveryCompletenessReport,
  recoveryCompletenessReportComplete
} from "../dist/recovery/index.js";

const H = (char) => char.repeat(64);

test("CCR-05830 full execution context freezes owner rules, protected assets, tools, scopes, dependencies, acceptance and authorization snapshot", () => {
  const packet = createAgencyExecutionContextPacket({
    id: "packet-1", runId: "run-1", taskId: "task-1", projectId: "project-1",
    builtAt: "2026-10-26T12:00:00Z", staleAfter: "2026-10-26T12:10:00Z", maxSensitivityRank: 2,
    sourceRefs: [{ id: "source:spec", version: 4, contentHash: H("a"), sensitivityRank: 2 }],
    artifactRefs: ["artifact:working"], evidenceRefs: ["evidence:packet"], missionRef: "mission:build",
    ownerRuleRefs: ["owner-rule:newest"], protectedAssetRefs: ["asset:approved-icon"], allowedToolRefs: ["tool:github"],
    readScopes: ["repo:read"], writeScopes: ["repo:branch:build/spec-lock-v2-clean-room"], dependencyRefs: ["dependency:verified"],
    acceptanceCriteriaRefs: ["acceptance:tests-pass"], authorizationSnapshotRef: "authorization:snapshot:4"
  });
  assert.equal(packet.authorizationSnapshotRef, "authorization:snapshot:4");
  assert.deepEqual(packet.allowedToolRefs, ["tool:github"]);
  assert.deepEqual(packet.writeScopes, ["repo:branch:build/spec-lock-v2-clean-room"]);
  assert.throws(() => createAgencyExecutionContextPacket({ ...packet, allowedToolRefs: [] }), /allowed tools/);
});

test("CCR-05831 coordination monitor detects deadlock, livelock, priority inversion, orphaned and no-progress work without escalating ordinary faults to owner", () => {
  const now = "2026-10-26T12:10:00Z";
  const base = { previousProgressToken: "p0", progressToken: "p1", lastProgressAt: "2026-10-26T12:09:55Z", lastHeartbeatAt: "2026-10-26T12:09:59Z", workerId: "w", claimExpiresAt: "2026-10-26T12:20:00Z" };
  const faults = detectCoordinationFaults([
    { ...base, taskId: "dead-a", state: "blocked", priority: 1, waitingOnTaskIds: ["dead-b"] },
    { ...base, taskId: "dead-b", state: "blocked", priority: 1, waitingOnTaskIds: ["dead-a"] },
    { ...base, taskId: "live", state: "working", priority: 1, waitingOnTaskIds: [], progressToken: "same", previousProgressToken: "same", lastProgressAt: "2026-10-26T12:00:00Z" },
    { ...base, taskId: "high", state: "blocked", priority: 1, waitingOnTaskIds: ["low"] },
    { ...base, taskId: "low", state: "working", priority: 9, waitingOnTaskIds: [] },
    { ...base, taskId: "orphan", state: "working", priority: 3, waitingOnTaskIds: [], workerId: "", claimExpiresAt: "2026-10-26T12:09:00Z" },
    { ...base, taskId: "stuck", state: "working", priority: 3, waitingOnTaskIds: [], progressToken: "new", previousProgressToken: "old", lastProgressAt: "2026-10-26T12:00:00Z", lastHeartbeatAt: "2026-10-26T12:00:00Z" }
  ], now, 60000);
  const kinds = new Set(faults.map((fault) => fault.kind));
  for (const kind of ["deadlock", "livelock", "priority_inversion", "orphaned", "no_progress"]) assert.equal(kinds.has(kind), true, kind);
  assert.equal(coordinationRecoveryDisposition(false), "recover");
  assert.equal(coordinationRecoveryDisposition(true), "escalate_owner");
});

test("CCR-05833 workload replay covers scheduler, dispatch, claim, retry, conflict, barrier and recovery with protected side effects disabled", () => {
  const kinds = ["scheduler", "dispatch", "claim", "retry", "conflict", "barrier", "recovery"];
  const events = kinds.map((kind, index) => ({ sequence: index + 1, kind, inputHash: H(String((index + 1) % 10)), outputHash: H(String((index + 2) % 10)), chosenValue: `choice-${kind}` }));
  const result = replayAgencyWorkloadFixture(events);
  assert.equal(result.matchedRepresentativeClasses, true);
  assert.equal(result.protectedSideEffectsExecuted, false);
  assert.equal(result.transcript.length, 7);
  const withoutClaim = events.filter((event) => event.kind !== "claim").map((event, index) => ({ ...event, sequence: index + 1 }));
  assert.throws(() => replayAgencyWorkloadFixture(withoutClaim), /claim/);
});

test("CCR-05835 and CCR-05846 logical lead registry shape supports all scopes and preserves mission, authority, decisions, evidence, dependencies and next action across handoff/failover", () => {
  for (const scopeKind of ["portfolio", "project", "department", "mission"]) {
    const assignment = validateLogicalLeadAssignment({
      assignmentId: `lead-assignment:${scopeKind}`, scopeKind, scopeId: `${scopeKind}:1`, mission: "complete verified work",
      capabilities: ["build"], authorityEnvelope: ["repo:isolated-branch"], currentHolder: "lead:a", handoffState: "stable",
      evidenceRefs: ["evidence:assignment"], decisionRefs: ["decision:owner"], dependencyRefs: ["dependency:phase"], nextAction: "resume exact next verified task", version: 1
    });
    const handed = handoffLogicalLead(assignment, "lead:b", "evidence:handoff");
    const failed = failoverLogicalLead(handed, "lead:c", "evidence:failover");
    assert.equal(failed.scopeKind, scopeKind);
    assert.equal(failed.mission, assignment.mission);
    assert.deepEqual(failed.authorityEnvelope, assignment.authorityEnvelope);
    assert.deepEqual(failed.decisionRefs, assignment.decisionRefs);
    assert.deepEqual(failed.dependencyRefs, assignment.dependencyRefs);
    assert.equal(failed.nextAction, assignment.nextAction);
    assert.equal(failed.currentHolder, "lead:c");
    assert.equal(failed.handoffState, "failed_over");
  }
});

test("CCR-05843 governed Foundry lifecycle reaches post-launch only through acceptance", () => {
  let state = { projectId: "p", stage: "idea", specVersion: 1, requirementRefs: ["r"], decisionRefs: [], artifactRefs: [] };
  for (const next of ["research", "ultimate_spec", "architecture", "roadmap", "owner_authorization"]) state = advanceFoundry(state, next, `e:${next}`);
  state = advanceFoundry(state, "agency_execution", "e:execution", "owner:authorized-snapshot");
  state = advanceFoundry(state, "evidence", "e:evidence");
  state = advanceFoundry(state, "acceptance", "e:acceptance");
  state = advanceFoundry(state, "post_launch", "e:post-launch");
  assert.equal(state.stage, "post_launch");
  assert.throws(() => advanceFoundry({ projectId: "p2", stage: "roadmap", specVersion: 1, requirementRefs: [], decisionRefs: [], artifactRefs: [] }, "post_launch", "bad"), /Invalid Foundry transition/);
});

test("CCR-05851 lost-artifact recovery exhausts authorized originals before explicitly labeled reconstruction", () => {
  const base = { missingArtifactRef: "missing:original", originalSourceCandidates: ["drive:original", "library:original"], authorizedCandidateRefs: ["drive:original", "library:original"] };
  assert.equal(evaluateOriginalFirstRecovery({ ...base, attempts: [{ candidateRef: "drive:original", outcome: "not_found", evidenceRef: "e:drive" }] }).status, "original_search_required");
  const exhausted = { ...base, attempts: [
    { candidateRef: "drive:original", outcome: "not_found", evidenceRef: "e:drive" },
    { candidateRef: "library:original", outcome: "not_found", evidenceRef: "e:library" }
  ] };
  assert.equal(evaluateOriginalFirstRecovery(exhausted).status, "original_exhausted");
  assert.equal(evaluateOriginalFirstRecovery({ ...exhausted, reconstruction: { label: "RECONSTRUCTION", artifactRef: "reconstruction:v1", sourceRefs: ["source:raw"], evidenceRefs: ["e:rebuild"] } }).status, "reconstruction_allowed");
  assert.throws(() => evaluateOriginalFirstRecovery({ ...base, authorizedCandidateRefs: ["drive:original"], attempts: [], reconstruction: { label: "RECONSTRUCTION", artifactRef: "reconstruction:v1", sourceRefs: ["source:raw"], evidenceRefs: ["e"] } }), /authorization is unresolved/);
});

test("CCR-05852 completeness report explicitly covers scope, conflicts, projects, missing artifacts, rename/merge/supersession lineage, privacy, unknowns and evidence", () => {
  const report = validateRecoveryCompletenessReport({
    sourceSetId: "export:1", expectedConversations: 2, processedConversations: 2, messageNodes: 20, branchPoints: 2, projectContainers: 1,
    candidateProjects: ["project:a"], conflicts: ["conflict:branch"], privacyExclusions: ["privacy:redacted"], missingArtifacts: ["artifact:missing"], unresolvedUnknowns: [], sourceRefs: ["source:export"],
    renameLineage: ["rename:a:b"], mergeLineage: ["merge:c:d"], supersessionLineage: ["supersede:e:f"], recoveryEvidenceRefs: ["evidence:report"],
    coverage: { sourceScopeProcessed: true, unresolvedConflicts: true, candidateProjects: true, missingArtifacts: true, renameLineage: true, mergeLineage: true, supersessionLineage: true, privacyExclusions: true, unresolvedUnknowns: true, recoveryEvidence: true }
  });
  assert.equal(recoveryCompletenessReportComplete(report), true);
  assert.throws(() => validateRecoveryCompletenessReport({ ...report, coverage: { ...report.coverage, mergeLineage: false } }), /cover every required dimension/);
});
