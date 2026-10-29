import test from "node:test";
import assert from "node:assert/strict";
import { DerivedArtifactRegistry } from "../dist/data/index.js";

const T0 = "2026-10-29T13:05:00Z";

function canonical() {
  return {
    id: "derived:p15-1-sensitivity",
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
    legalHold: false
  };
}

function registration(overrides = {}) {
  return {
    artifactId: "artifact:p15-1-sensitivity",
    ownerId: "owner-1",
    derivedId: "derived:p15-1-sensitivity",
    kind: "summary",
    sourceSensitivities: ["internal", "protected", "sensitive"],
    createdAt: T0,
    updatedAt: T0,
    ...overrides
  };
}

function ownerDowngrade(overrides = {}) {
  return {
    authorized: true,
    requestedBy: "owner",
    ownerDecisionRef: "decision:p15-1-derived-downgrade",
    policyRef: "policy:derived-sensitivity-downgrade",
    receiptRef: "receipt:p15-1-derived-downgrade",
    fromSensitivity: "protected",
    toSensitivity: "sensitive",
    ...overrides
  };
}

test("P15.1 RG-022 derived outputs inherit the strictest source sensitivity", () => {
  const registry = new DerivedArtifactRegistry();
  const artifact = registry.register(registration(), canonical());

  assert.equal(artifact.sourceSensitivity, "protected");
  assert.equal(artifact.sensitivity, "protected");
  assert.equal(artifact.sensitivityDecisionRef, undefined);
  assert.equal(Object.isFrozen(artifact), true);
});

test("P15.1 RG-022 more restrictive derived classification needs no downgrade authority", () => {
  const registry = new DerivedArtifactRegistry();
  const artifact = registry.register(registration({
    sourceSensitivities: ["sensitive"],
    requestedSensitivity: "secret"
  }), canonical());

  assert.equal(artifact.sourceSensitivity, "sensitive");
  assert.equal(artifact.sensitivity, "secret");
});

test("P15.1 RG-022 derived sensitivity downgrade is denied without explicit owner evidence", () => {
  const registry = new DerivedArtifactRegistry();
  assert.throws(
    () => registry.register(registration({ requestedSensitivity: "internal" }), canonical()),
    /requires explicit owner authorization/
  );
});

test("P15.1 RG-022 model or system cannot authorize a derived sensitivity downgrade", () => {
  const registry = new DerivedArtifactRegistry();
  assert.throws(
    () => registry.register(registration({
      requestedSensitivity: "sensitive",
      downgradeAuthorization: ownerDowngrade({ requestedBy: "model" })
    }), canonical()),
    /Model\/system-requested sensitivity downgrade is forbidden/
  );
});

test("P15.1 RG-022 owner-authorized downgrade leaves immutable decision evidence", () => {
  const registry = new DerivedArtifactRegistry();
  const artifact = registry.register(registration({
    requestedSensitivity: "sensitive",
    downgradeAuthorization: ownerDowngrade()
  }), canonical());

  assert.equal(artifact.sourceSensitivity, "protected");
  assert.equal(artifact.sensitivity, "sensitive");
  assert.equal(artifact.sensitivityDecisionRef, "receipt:p15-1-derived-downgrade");
  assert.equal(Object.isFrozen(artifact), true);
  assert.throws(() => {
    artifact.sensitivity = "internal";
  }, TypeError);
});

test("P15.1 RG-022 mismatched downgrade evidence is rejected", () => {
  const registry = new DerivedArtifactRegistry();
  assert.throws(
    () => registry.register(registration({
      requestedSensitivity: "sensitive",
      downgradeAuthorization: ownerDowngrade({ fromSensitivity: "secret" })
    }), canonical()),
    /authorization does not match the requested transition/
  );
});

test("P15.1 RG-022 legacy unclassified derived registrations fail closed to secret", () => {
  const registry = new DerivedArtifactRegistry();
  const input = registration();
  delete input.sourceSensitivities;
  const artifact = registry.register(input, canonical());

  assert.equal(artifact.sourceSensitivity, "secret");
  assert.equal(artifact.sensitivity, "secret");
});

test("P15.1 RG-022 explicit empty source classification is rejected", () => {
  const registry = new DerivedArtifactRegistry();
  assert.throws(
    () => registry.register(registration({ sourceSensitivities: [] }), canonical()),
    /requires source sensitivity classifications/
  );
});
