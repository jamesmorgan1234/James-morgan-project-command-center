import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createImprovementProposal, SelfImprovementGovernor, assertImprovementRestoreCurrent } from "../dist/brain/index.js";

const T0 = "2026-10-26T06:00:00Z";
const T1 = "2026-10-26T06:05:00Z";
const T2 = "2026-10-26T06:10:00Z";
const T3 = "2026-10-26T06:15:00Z";
const T4 = "2026-10-26T06:20:00Z";
const T5 = "2026-10-26T06:25:00Z";
const T6 = "2026-10-26T06:30:00Z";
const T7 = "2026-10-26T06:35:00Z";
const T8 = "2026-10-26T06:40:00Z";
const T9 = "2026-10-26T06:45:00Z";
const T10 = "2026-10-26T06:50:00Z";
const T11 = "2026-10-26T06:55:00Z";
const T12 = "2026-10-26T07:00:00Z";

function proposal(id = "improvement:router-v2") {
  return createImprovementProposal({ id, area: "quality", title: "Improve contextual routing", evidenceRefs: ["evd_proposal"], confidence: 0.9 });
}

function plan(id = "improvement:router-v2") {
  return { proposalId: id, applicabilityRefs: ["dom_command-center"], requestedPermissionRefs: ["permission:read-routing"], minimumEffectConfidence: 0.8, maximumCanaryFraction: 0.1, rollbackCheckpointRef: "chk_router-v1", evidenceRefs: ["evd_plan"] };
}

function authority(now = T6, overrides = {}) {
  return { policyEpoch: 7, revocationEpoch: 4, invalidatedLearningRefs: [], revokedAuthorizationRefs: [], now, ...overrides };
}

function evaluation(overrides = {}) {
  return { evaluatorRef: "evaluator:routing", evaluatorVersion: 3, acceptanceEligible: true, calibratedConfidence: 0.92, effectsCertain: true, evidenceRefs: ["evd_evaluation"], evaluatedAt: T4, ...overrides };
}

function baseline(overrides = {}) {
  return { baselineRef: "baseline:routing-v1", acceptanceFingerprint: "sha256:acceptance-v1", lockedAt: T5, evidenceRefs: ["evd_baseline"], ...overrides };
}

function authorization(id = "improvement:router-v2", overrides = {}) {
  return { id: "auth:improvement-router-v2", proposalId: id, issuerRef: "command-center", policyEpoch: 7, revocationEpoch: 4, permissionRefs: ["permission:read-routing"], maximumCanaryFraction: 0.1, issuedAt: T5, expiresAt: "2026-10-27T06:25:00Z", evidenceRefs: ["evd_authorization"], ...overrides };
}

function snapshot(id = "improvement:router-v2", overrides = {}) {
  return { id: "snapshot:improvement-router-v2", proposalId: id, capturedAt: T6, policyEpoch: 7, revocationEpoch: 4, exactVersionRefs: ["mth_router@2", "evaluator:routing@3", "mod_shared-intelligence@1"], learningRefs: ["lrn_router-win"], permissionRefs: ["permission:read-routing"], traceRef: "trace:router-v2", baselineRef: "baseline:routing-v1", acceptanceFingerprint: "sha256:acceptance-v1", rollbackCheckpointRef: "chk_router-v1", evidenceRefs: ["evd_snapshot"], ...overrides };
}

function prepareToBaseline(id = "improvement:router-v2") {
  const governor = new SelfImprovementGovernor();
  governor.register(proposal(id), plan(id), "command-center", T0);
  governor.validateEvidence(id, 1, ["evd_validated"], "validator:pif10", T1);
  governor.confirmScope(id, 2, ["dom_command-center"], ["permission:read-routing"], "command-center", T2, ["evd_scope"]);
  governor.assessRisk(id, 3, "moderate", "command-center", T3, ["evd_risk"]);
  governor.recordEvaluation(id, 4, evaluation(), "evaluator:routing");
  governor.lockBaseline(id, 5, baseline(), "command-center");
  return governor;
}

function prepareAuthorized(id = "improvement:router-v2", auth = authority()) {
  const governor = prepareToBaseline(id);
  governor.authorize(id, 6, authorization(id), snapshot(id), auth, "command-center");
  return governor;
}

function prepareCanary(id = "improvement:router-v2") {
  const governor = prepareAuthorized(id, authority(T6));
  governor.beginShadow(id, 7, authority(T7), "command-center", ["evd_shadow"]);
  governor.beginCanary(id, 8, 0.05,
    { successRate: 0.95, verificationFailureRate: 0.02, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 0 },
    { successRate: 0.97, verificationFailureRate: 0.01, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 0 },
    authority(T8), "command-center", ["evd_canary"]);
  return governor;
}

function restore(overrides = {}) {
  return {
    now: T6,
    authorizationState: "active",
    authorizationRef: "auth:restore-current",
    authorizationExpiresAt: "2026-10-27T06:00:00Z",
    authorizationPolicyEpoch: 7,
    currentPolicyEpoch: 7,
    privacyState: "allowed",
    keyState: "active",
    applicationState: "valid",
    sourceLifecycle: "active",
    payloadState: "present",
    purposeAllowed: true,
    retentionAllowed: true,
    evidenceRefs: ["evd_restore"],
    ...overrides
  };
}

test("PIF.10 acceptance criteria tampering fails closed after baseline lock", () => {
  const governor = prepareCanary();
  assert.throws(() => governor.verify("improvement:router-v2", 9, "sha256:tampered", 0.93, true, true, authority(T9), "verifier:pif10", ["evd_verify"]), /acceptance criteria were tampered/i);
  assert.equal(governor.get("improvement:router-v2")?.stage, "canary");
});

test("PIF.10 permission expansion cannot be smuggled into authorization or monitoring", () => {
  const governor = prepareToBaseline();
  assert.throws(() => governor.authorize("improvement:router-v2", 6, authorization("improvement:router-v2", { permissionRefs: ["permission:read-routing", "permission:write-production"] }), snapshot(), authority(T6), "command-center"), /expands permissions/i);
  assert.equal(governor.get("improvement:router-v2")?.stage, "baseline_locked");
});

test("PIF.10 stale restore is blocked by current policy/revocation revalidation", () => {
  assert.throws(() => assertImprovementRestoreCurrent(snapshot(), authority(T6), restore({ authorizationPolicyEpoch: 6 })), /restore blocked: authorization_policy_epoch_stale/i);
  assert.throws(() => assertImprovementRestoreCurrent(snapshot(), authority(T6, { revocationEpoch: 5 }), restore()), /revocation state is stale/i);
});

test("PIF.10 invalidated learning cannot drive rollout or promotion", () => {
  const governor = prepareAuthorized();
  assert.throws(() => governor.beginShadow("improvement:router-v2", 7, authority(T7, { invalidatedLearningRefs: ["lrn_router-win"] }), "command-center", ["evd_shadow"]), /invalidated learning/i);
  assert.equal(governor.get("improvement:router-v2")?.stage, "authorized");
});

test("PIF.10 uncertain effects and insufficient evaluator acceptance fail closed", () => {
  const governor = prepareCanary();
  assert.throws(() => governor.verify("improvement:router-v2", 9, "sha256:acceptance-v1", 0.93, false, true, authority(T9), "verifier:pif10", ["evd_verify"]), /effects are uncertain/i);
  assert.throws(() => governor.verify("improvement:router-v2", 9, "sha256:acceptance-v1", 0.93, true, false, authority(T9), "verifier:pif10", ["evd_verify"]), /not acceptance eligible/i);
});

test("PIF.10 governed safe path requires explicit authorization, limited rollout, verification, monitoring, rollback and lesson", () => {
  const governor = prepareCanary();
  governor.verify("improvement:router-v2", 9, "sha256:acceptance-v1", 0.93, true, true, authority(T9), "verifier:pif10", ["evd_verify"]);
  governor.promote("improvement:router-v2", 10, authority(T10), "command-center", ["evd_promote"]);
  governor.monitor("improvement:router-v2", 11, { id: "monitor:1", proposalId: "improvement:router-v2", observedAt: T11, healthy: true, effectConfidence: 0.9, permissionRefs: ["permission:read-routing"], acceptanceFingerprint: "sha256:acceptance-v1", evidenceRefs: ["evd_monitor"] }, authority(T11), "command-center");
  governor.rollback("improvement:router-v2", 12, "chk_router-v1", authority(T12), "command-center", ["evd_rollback"]);
  const final = governor.recordLesson("improvement:router-v2", 13, ["lesson:rollback-kept-routing-safe"], "command-center", "2026-10-26T07:05:00Z", ["evd_lesson"]);
  assert.equal(final.stage, "lesson_recorded");
  assert.equal(final.version, 14);
  assert.equal(final.transitions.length, 14);
  assert.deepEqual(final.transitions.map((item) => item.sequence), Array.from({ length: 14 }, (_, index) => index + 1));
  assert.equal(final.proposal.installsAutomatically, false);
});

test("PIF.10 limited rollout blocks unsafe canary and permission/boundary regressions", () => {
  const governor = prepareAuthorized();
  governor.beginShadow("improvement:router-v2", 7, authority(T7), "command-center", ["evd_shadow"]);
  assert.throws(() => governor.beginCanary("improvement:router-v2", 8, 0.2,
    { successRate: 0.95, verificationFailureRate: 0.02, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 0 },
    { successRate: 0.97, verificationFailureRate: 0.01, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 0 },
    authority(T8), "command-center", ["evd_canary"]), /exceeds authorized limited rollout/i);
  assert.throws(() => governor.beginCanary("improvement:router-v2", 8, 0.05,
    { successRate: 0.95, verificationFailureRate: 0.02, protectedBoundaryViolationCount: 0, duplicateSideEffectCount: 0 },
    { successRate: 0.97, verificationFailureRate: 0.01, protectedBoundaryViolationCount: 1, duplicateSideEffectCount: 0 },
    authority(T8), "command-center", ["evd_canary"]), /canary failed closed: protected_boundary_violation/i);
});

test("PIF.10 durable schema keeps immutable transitions and current-authority snapshots without auto-install", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026036000_pif10_improvement_recovery.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_improvement_governance/i);
  assert.match(sql, /command_center_improvement_transitions/i);
  assert.match(sql, /command_center_improvement_snapshots/i);
  assert.match(sql, /policy_epoch/i);
  assert.match(sql, /revocation_epoch/i);
  assert.match(sql, /acceptance_fingerprint/i);
  assert.match(sql, /permission_refs/i);
  assert.match(sql, /rollback_checkpoint_ref/i);
  assert.match(sql, /invalidated_learning_refs/i);
  assert.match(sql, /command_center_improvement_monitoring/i);
  assert.doesNotMatch(sql, /installs_automatically\s+boolean\s+not\s+null\s+default\s+true/i);
});
