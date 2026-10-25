import test from "node:test";
import assert from "node:assert/strict";
import { DerivedLifecycleRegistry } from "../dist/data/index.js";

const T0 = "2026-10-25T00:00:00Z";
const T1 = "2026-10-25T00:01:00Z";
const T2 = "2026-10-25T00:02:00Z";
const T3 = "2026-10-25T00:03:00Z";
const provenance = [{ observationId: "observation:o1", sourceId: "source:s1", contentHash: "h1" }];

function record(id, overrides = {}) {
  return {
    id,
    ownerId: "owner-1",
    companyId: "company-101",
    projectId: "project-101",
    purpose: "project_context",
    retentionClass: "derived_context",
    state: "active",
    provenance,
    createdAt: T0,
    updatedAt: T0,
    legalHold: false,
    ...overrides
  };
}

test("legal hold placement requires a reason and release requires explicit authorization evidence", () => {
  const registry = new DerivedLifecycleRegistry();
  registry.register(record("derived:d1"));
  assert.throws(() => registry.placeLegalHold("derived:d1", T1, ""));
  const held = registry.placeLegalHold("derived:d1", T1, "owner preservation request");
  assert.equal(held.legalHold, true);
  assert.equal(held.holdReason, "owner preservation request");
  assert.throws(() => registry.releaseLegalHold("derived:d1", T2, "", "release approved"));
  const released = registry.releaseLegalHold("derived:d1", T2, "authorization:hold-release-1", "owner approved release");
  assert.equal(released.legalHold, false);
  assert.equal(released.state, "active");
  assert.equal(released.holdReleasedAt, T2);
  assert.equal(released.holdReleaseAuthorizationRef, "authorization:hold-release-1");
  assert.equal(released.holdReleaseReason, "owner approved release");
});

test("hold precedence prevents invalidated derived data from being resurrected after release", () => {
  const registry = new DerivedLifecycleRegistry();
  registry.register(record("derived:d2", { legalHold: true }));
  const [restricted] = registry.invalidateByObservation("observation:o1", T1, "upstream_retracted");
  assert.equal(restricted.state, "restricted");
  assert.equal(restricted.legalHold, true);
  assert.match(restricted.restrictionReason, /^legal_hold:/);

  const released = registry.releaseLegalHold("derived:d2", T3, "authorization:hold-release-2", "hold no longer required");
  assert.equal(released.legalHold, false);
  assert.equal(released.state, "deleted");
  assert.match(released.restrictionReason, /^hold_released_after_invalidated:/);
  assert.throws(() => registry.placeLegalHold("derived:d2", T3, "cannot resurrect deleted data"));
});
