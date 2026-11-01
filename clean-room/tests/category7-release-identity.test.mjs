import test from "node:test";
import assert from "node:assert/strict";
import {
  compatibilityBridge,
  createReleaseCandidate,
  acceptReleaseCandidate,
  assertCandidateUnchanged,
  manifestDigest,
  verifyManifest,
  releaseProvenance,
  healthDiagnostics,
  diagnosticsVisible,
  releaseHealthScore,
  acceptanceState,
  assertNoTemporaryExceptions,
  everyFileAudit,
  dependencyAudit,
  deadCodeAudit
} from "../dist/deployment/index.js";

const T0 = "2026-10-31T10:00:00.000Z";
const files = { "index.html": "v1", "app.js": "v2" };
const diagnostics = {
  productionSha: "abc123",
  schemaVersion: "42",
  pwaCacheVersion: "cc-v7",
  moduleVersions: { home: "1.2.0", finance: "0.9.1" },
  brainPolicyVersion: "brain-3",
  agentPolicyVersion: "agent-2"
};

test("P7.2 compatibility bridge covers forward-only schema changes", () => {
  const bridge = compatibilityBridge({ fromVersion: 41, toVersion: 42, forwardOnly: true });
  assert.equal(bridge.bridgeRequired, true);
  assert.equal(bridge.direction, "expand_then_contract");
  assert.throws(() => compatibilityBridge({ fromVersion: 42, toVersion: 42, forwardOnly: true }), /advance the version/);
});

test("P7.2 release candidate identifier", () => {
  const candidate = createReleaseCandidate({ id: "rc-1", codeSha: "abc123", configFingerprint: "cfg-9" });
  assert.equal(candidate.id, "rc-1");
  assert.equal(candidate.acceptedAt, null);
  assert.throws(() => createReleaseCandidate({ id: " ", codeSha: "abc", configFingerprint: "cfg" }), /requires id/);
});

test("P7.2 accepted release candidate is immutable", () => {
  const candidate = createReleaseCandidate({ id: "rc-1", codeSha: "abc123", configFingerprint: "cfg-9" });
  const accepted = acceptReleaseCandidate(candidate, files, T0);
  assert.equal(accepted.manifestDigest, manifestDigest(files));
  assert.throws(() => assertCandidateUnchanged({ ...accepted, acceptedAt: null }, { codeSha: "abc123", configFingerprint: "cfg-9" }), /not been accepted/);
});

test("P7.2 code change after acceptance requires a new candidate", () => {
  const accepted = acceptReleaseCandidate(createReleaseCandidate({ id: "rc-1", codeSha: "abc123", configFingerprint: "cfg-9" }), files, T0);
  assert.doesNotThrow(() => assertCandidateUnchanged(accepted, { codeSha: "abc123", configFingerprint: "cfg-9" }));
  assert.throws(() => assertCandidateUnchanged(accepted, { codeSha: "def456", configFingerprint: "cfg-9" }), /new release candidate/);
});

test("P7.2 critical config change after acceptance requires a new candidate", () => {
  const accepted = acceptReleaseCandidate(createReleaseCandidate({ id: "rc-1", codeSha: "abc123", configFingerprint: "cfg-9" }), files, T0);
  assert.throws(() => assertCandidateUnchanged(accepted, { codeSha: "abc123", configFingerprint: "cfg-10" }), /Critical config changed/);
});

test("P7.2 release manifest is signed by hashes", () => {
  const digest = manifestDigest(files);
  assert.match(digest, /^sha256:[0-9a-f]{16}$/);
  assert.doesNotThrow(() => verifyManifest(files, digest));
  assert.throws(() => verifyManifest({ ...files, "app.js": "tampered" }, digest), /hash mismatch/);
  assert.throws(() => manifestDigest({}), /requires files/);
});

test("P7.2 CI run provenance is recorded", () => {
  const provenance = releaseProvenance({ ciRunId: "412", ciJobId: "77", deploymentRunId: "88", sourceSha: "abc123" });
  assert.equal(provenance.ciRunId, "412");
  assert.equal(provenance.ciJobId, "77");
  assert.throws(() => releaseProvenance({ ciRunId: " ", ciJobId: "77", deploymentRunId: "88", sourceSha: "abc" }), /requires ciRunId/);
});

test("P7.2 deployment run provenance is recorded", () => {
  const provenance = releaseProvenance({ ciRunId: "412", ciJobId: "77", deploymentRunId: "88", sourceSha: "abc123" });
  assert.equal(provenance.deploymentRunId, "88");
  assert.throws(() => releaseProvenance({ ciRunId: "1", ciJobId: "2", deploymentRunId: "", sourceSha: "abc" }), /requires deploymentRunId/);
});

test("P7.2 live version is diagnosable", () => {
  assert.equal(healthDiagnostics(diagnostics).productionSha, "abc123");
  assert.equal(diagnosticsVisible("health"), true);
});

test("P7.2 production SHA is retrievable from health diagnostics", () => {
  assert.equal(healthDiagnostics(diagnostics).productionSha, "abc123");
});

test("P7.2 schema version is retrievable", () => {
  assert.equal(healthDiagnostics(diagnostics).schemaVersion, "42");
});

test("P7.2 PWA cache version is retrievable", () => {
  assert.equal(healthDiagnostics(diagnostics).pwaCacheVersion, "cc-v7");
});

test("P7.2 module versions are retrievable", () => {
  assert.deepEqual(JSON.parse(healthDiagnostics(diagnostics).moduleVersions), { home: "1.2.0", finance: "0.9.1" });
});

test("P7.2 brain policy version is retrievable", () => {
  assert.equal(healthDiagnostics(diagnostics).brainPolicyVersion, "brain-3");
});

test("P7.2 agent policy version is retrievable", () => {
  assert.equal(healthDiagnostics(diagnostics).agentPolicyVersion, "agent-2");
});

test("P7.2 diagnostics do not clutter normal screens", () => {
  assert.equal(diagnosticsVisible("normal"), false);
});

test("P7.2 release health is composed from measured checks", () => {
  const health = releaseHealthScore([{ name: "smoke", passed: true }, { name: "schema", passed: false }, { name: "pwa", passed: true }]);
  assert.equal(health.score, 2 / 3);
  assert.equal(health.basis, "measured_checks");
  assert.equal(health.total, 3);
  assert.throws(() => releaseHealthScore([]), /measured checks/);
});

test("P7.2 owner visual acceptance is separate", () => {
  const state = acceptanceState({ technicalDeploymentComplete: true, ownerVisualAccepted: false, ownerBehavioralAccepted: true });
  assert.equal(state.technicalDeploymentComplete, true);
  assert.equal(state.ownerVisualAccepted, false);
  assert.equal(state.complete, false);
});

test("P7.2 owner behavioral acceptance is separate", () => {
  const state = acceptanceState({ technicalDeploymentComplete: true, ownerVisualAccepted: true, ownerBehavioralAccepted: false });
  assert.equal(state.ownerBehavioralAccepted, false);
  assert.equal(state.complete, false);
  assert.equal(acceptanceState({ technicalDeploymentComplete: true, ownerVisualAccepted: true, ownerBehavioralAccepted: true }).complete, true);
});

test("P7.2 no hidden temporary exceptions at acceptance", () => {
  assert.doesNotThrow(() => assertNoTemporaryExceptions([{ id: "vendor-pin", permanent: true }]));
  assert.throws(() => assertNoTemporaryExceptions([{ id: "skip-test", permanent: false }]), /Temporary exceptions present/);
});

test("P7.2 final every-file audit", () => {
  assert.equal(everyFileAudit([{ path: "a", reviewed: true }, { path: "b", reviewed: true }]).complete, true);
  const partial = everyFileAudit([{ path: "a", reviewed: true }, { path: "b", reviewed: false }]);
  assert.equal(partial.complete, false);
  assert.equal(partial.reviewed, 1);
});

test("P7.2 final dependency audit", () => {
  assert.deepEqual([...dependencyAudit([{ name: "react", allowed: true }]).unexpected], []);
  const audit = dependencyAudit([{ name: "react", allowed: true }, { name: "left-pad", allowed: false }]);
  assert.deepEqual([...audit.unexpected], ["left-pad"]);
  assert.equal(audit.complete, false);
});

test("P7.2 final dead-code audit", () => {
  assert.equal(deadCodeAudit([{ name: "used", referenced: true }]).complete, true);
  const audit = deadCodeAudit([{ name: "used", referenced: true }, { name: "orphan", referenced: false }]);
  assert.deepEqual([...audit.dead], ["orphan"]);
  assert.equal(audit.complete, false);
});
