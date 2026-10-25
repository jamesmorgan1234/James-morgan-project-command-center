import test from "node:test";
import assert from "node:assert/strict";
import { DERIVED_ARTIFACT_KINDS, DerivedArtifactRegistry, DerivedLifecycleRegistry } from "../dist/data/index.js";

const T0 = "2026-10-25T08:40:00Z";
const T1 = "2026-10-25T08:41:00Z";
const T2 = "2026-10-25T08:42:00Z";

function canonical(overrides = {}) {
  return {
    id: "derived:root-1",
    ownerId: "owner-1",
    purpose: "command_center_context",
    retentionClass: "standard",
    state: "active",
    provenance: [
      { observationId: "observation:o1", sourceId: "source:s1", contentHash: "hash-o1" },
      { observationId: "observation:o2", sourceId: "source:s2", contentHash: "hash-o2" }
    ],
    createdAt: T0,
    updatedAt: T0,
    legalHold: false,
    ...overrides
  };
}

function registration(kind, index = 0) {
  return {
    artifactId: `artifact:${kind}-${index}`,
    ownerId: "owner-1",
    derivedId: "derived:root-1",
    kind,
    createdAt: T0,
    updatedAt: T0
  };
}

test("all A08 derivative classes register only through active canonical derived provenance", () => {
  assert.deepEqual([...DERIVED_ARTIFACT_KINDS], ["summary", "memory", "index", "vector", "export", "metric", "recommendation"]);
  const registry = new DerivedArtifactRegistry();
  const root = canonical();
  for (const [index, kind] of DERIVED_ARTIFACT_KINDS.entries()) {
    const artifact = registry.register(registration(kind, index), root);
    assert.equal(artifact.kind, kind);
    assert.equal(artifact.state, "active");
    assert.deepEqual(artifact.provenance, root.provenance);
    assert.notEqual(artifact.provenance, root.provenance);
  }
});

test("artifact registration rejects mismatched owner/derived identity, inactive canonical state and unsupported classes", () => {
  const registry = new DerivedArtifactRegistry();
  const root = canonical();
  assert.throws(() => registry.register({ ...registration("summary"), ownerId: "owner-2" }, root), /bind its canonical owner/);
  assert.throws(() => registry.register({ ...registration("summary"), derivedId: "derived:other" }, root), /bind its canonical owner/);
  assert.throws(() => registry.register(registration("summary"), canonical({ state: "restricted" })), /only be registered from an active canonical/);
  assert.throws(() => registry.register({ ...registration("summary"), kind: "cache" }, root), /Unsupported derived artifact kind/);
});

test("source correction/retraction invalidation propagates canonical deletion across summaries memories indexes vectors exports metrics and recommendations", () => {
  const lifecycle = new DerivedLifecycleRegistry();
  const root = lifecycle.register(canonical());
  const artifacts = new DerivedArtifactRegistry();
  for (const [index, kind] of DERIVED_ARTIFACT_KINDS.entries()) artifacts.register(registration(kind, index), root);

  const [deleted] = lifecycle.invalidateByObservation("observation:o1", T1, "source_retracted");
  assert.equal(deleted.state, "deleted");
  const changed = artifacts.syncCanonical(deleted, T1, "source_retracted");
  assert.equal(changed.length, DERIVED_ARTIFACT_KINDS.length);
  assert.deepEqual(new Set(changed.map((item) => item.state)), new Set(["deleted"]));
  assert.deepEqual(new Set(changed.map((item) => item.kind)), new Set(DERIVED_ARTIFACT_KINDS));
  for (const artifact of changed) assert.deepEqual(artifact.provenance, root.provenance);
});

test("legal hold converts invalidated canonical derivatives and every dependent artifact to restricted without erasing lineage", () => {
  const lifecycle = new DerivedLifecycleRegistry();
  lifecycle.register(canonical());
  const held = lifecycle.placeLegalHold("derived:root-1", T1, "litigation_hold");
  const artifacts = new DerivedArtifactRegistry();
  for (const [index, kind] of DERIVED_ARTIFACT_KINDS.entries()) artifacts.register(registration(kind, index), canonical());

  const [restricted] = lifecycle.invalidateByObservation("observation:o2", T2, "source_corrected");
  assert.equal(restricted.state, "restricted");
  const changed = artifacts.syncCanonical(restricted, T2, "source_corrected_under_hold");
  assert.equal(changed.length, DERIVED_ARTIFACT_KINDS.length);
  for (const artifact of changed) {
    assert.equal(artifact.state, "restricted");
    assert.equal(artifact.restrictionReason, "source_corrected_under_hold");
    assert.deepEqual(artifact.provenance, held.provenance);
  }
});

test("restricted/deleted artifacts are never silently reactivated when canonical state later appears active", () => {
  const artifacts = new DerivedArtifactRegistry();
  const root = canonical();
  artifacts.register(registration("summary"), root);
  artifacts.syncCanonical(canonical({ state: "restricted", updatedAt: T1, restrictionReason: "privacy" }), T1, "privacy");
  assert.equal(artifacts.get("artifact:summary-0").state, "restricted");
  assert.deepEqual(artifacts.syncCanonical(canonical({ state: "active", updatedAt: T2 }), T2, "restore_attempt"), []);
  assert.equal(artifacts.get("artifact:summary-0").state, "restricted");

  const deletedRegistry = new DerivedArtifactRegistry();
  deletedRegistry.register(registration("index"), root);
  deletedRegistry.syncCanonical(canonical({ state: "deleted", updatedAt: T1, restrictionReason: "retracted" }), T1, "retracted");
  assert.deepEqual(deletedRegistry.syncCanonical(canonical({ state: "active", updatedAt: T2 }), T2, "restore_attempt"), []);
  assert.equal(deletedRegistry.get("artifact:index-0").state, "deleted");
});

test("artifact use requires active canonical state, active artifact state and present payload", () => {
  const root = canonical();
  const artifacts = new DerivedArtifactRegistry();
  artifacts.register(registration("export"), root);
  assert.equal(artifacts.assertUsable("artifact:export-0", root, "present").state, "active");
  assert.throws(() => artifacts.assertUsable("artifact:export-0", root, "restricted"), /payload is not usable: restricted/);
  assert.throws(() => artifacts.assertUsable("artifact:export-0", root, "erased"), /payload is not usable: erased/);
  assert.throws(() => artifacts.assertUsable("artifact:export-0", canonical({ state: "restricted" }), "present"), /Canonical derived record is not active/);
});

test("artifact use fails closed when canonical provenance diverges from the registration snapshot", () => {
  const root = canonical();
  const artifacts = new DerivedArtifactRegistry();
  artifacts.register(registration("vector"), root);
  const diverged = canonical({ provenance: [{ observationId: "observation:o3", sourceId: "source:s3", contentHash: "hash-o3" }], updatedAt: T1 });
  assert.throws(() => artifacts.assertUsable("artifact:vector-0", diverged, "present"), /provenance no longer matches canonical provenance/);
});

test("duplicate artifact identity is rejected and listing remains scoped to canonical derived id", () => {
  const root = canonical();
  const artifacts = new DerivedArtifactRegistry();
  artifacts.register(registration("metric"), root);
  assert.throws(() => artifacts.register(registration("metric"), root), /already exists/);
  assert.deepEqual(artifacts.listByDerived("derived:root-1").map((item) => item.kind), ["metric"]);
  assert.deepEqual(artifacts.listByDerived("derived:other"), []);
});
