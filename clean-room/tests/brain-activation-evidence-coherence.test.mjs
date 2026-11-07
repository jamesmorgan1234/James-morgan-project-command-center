import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = (file) => JSON.parse(readFileSync(new URL('../evidence/brain-activation/' + file, import.meta.url), 'utf8'));
const current = load('current-activation-results.json');
const binding = load('execution-binding-verification.json');
const artifact = load('completed-artifact-job-verification.json');
const diagnostic = load('completed-diagnostic-verification.json');
const sha256 = /^[a-f0-9]{64}$/;
const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;

test('current checkpoint does not erase 128 canonical native Windows artifact proofs', () => {
  assert.equal(artifact.total, 128);
  assert.equal(artifact.completed, 128);
  assert.equal(artifact.independentlyVerified, 128);
  assert.equal(artifact.queued, 0);
  assert.equal(artifact.claimed, 0);
  assert.equal(artifact.uncertain, 0);
  assert.equal(artifact.invalidCompleted.length, 0);
  assert.equal(artifact.rows.length, 128);
  assert.equal(current.verifiedSpecialistArtifactJobs, 128);
  assert.equal(current.artifactJobQueuePending, 0);
  assert.equal(current.artifactJobQueueUncertain, 0);
  assert.equal(current.installedArtifactClientLiveVerified, true);
  assert.equal(binding.supersedingEvidenceReconciliation.independentlyVerifiedArtifactJobs, 128);
  assert.equal(current.evidenceReconciliation.independentlyVerifiedArtifactJobs, 128);
  assert.equal(current.evidenceReconciliation.connectedWorkerClientContract, 'cc-pc-tools-v1');
  assert.doesNotMatch(current.remainingExecutionBoundary, /implements read-only inference only/i);
  assert.doesNotMatch(binding.remainingExecutionBoundary, /implements read-only inference only/i);
});
test('each specialist proof is independently bound to exactly one registered project and company', () => {
  assert.equal(current.rows.length, 128);
  assert.equal(new Set(current.rows.map(row => row.projectId)).size, 128);
  const byProject = new Map(artifact.rows.map(row => [row.project_id, row]));
  assert.equal(byProject.size, 128);
  for (const brain of current.rows) {
    const proof = byProject.get(brain.projectId);
    assert.ok(proof, 'missing artifact receipt: ' + brain.projectId);
    assert.equal(proof.project_id, brain.projectId);
    assert.equal(proof.company_id, brain.companyId);
    assert.equal(proof.brain_version, brain.brainVersion);
    assert.equal(proof.proof_verified, true);
    assert.equal(proof.state, 'completed');
    assert.match(proof.commit_id, uuid);
    assert.match(proof.output_hash, sha256);
    assert.equal(brain.artifactJobLiveVerified, true);
    assert.equal(brain.installedArtifactClientLiveVerified, true);
    assert.equal(brain.liveDiagnosticVerified, true);
  }
});
test('artifact and model verification never masquerade as full general operational activation', () => {
  assert.equal(current.registered, 128);
  assert.equal(current.verifiedSpecialistDiagnosticConnections, 128);
  assert.equal(current.contextReadsVerified, 128);
  assert.equal(current.wrongOwnerAndWorkerDenials, 256);
  assert.equal(current.fullOperationalActivation, false);
  assert.equal(current.operational, 0);
  assert.equal(current.verifiedSpecialistToolConnections, 0);
  assert.equal(binding.fullOperationalActivation, false);
  assert.equal(binding.enabled, 0);
  assert.equal(binding.specialist_tool_bindings, 0);
  assert.equal(current.evidenceReconciliation.fullGeneralToolOperationVerified, false);
  assert.equal(current.evidenceReconciliation.persistentSpecialistDelegationTargetsConfigured, 0);
  assert.equal(current.evidenceReconciliation.commandCenterRemainsControlPlane, true);
  assert.equal(diagnostic.proof.independentlyVerified, 128);
  assert.equal(diagnostic.access.exactProjectContextsRead, 128);
  assert.equal(diagnostic.access.wrongOwnerAndWorkerDenials, 256);
});
