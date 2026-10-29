import test from "node:test";
import assert from "node:assert/strict";
import { BrainMemoryLedger } from "../dist/brain/index.js";

const T0 = "2026-10-29T12:00:00Z";
const syntheticApiSecret = "sk-" + "12345678901234567890";

function baseMemory(overrides = {}) {
  return {
    id: "m1",
    ownerId: "owner-1",
    projectId: "cc",
    kind: "fact",
    version: 1,
    state: "current",
    value: { note: "safe" },
    confidence: 1,
    sensitivity: "internal",
    sourceRefs: ["source-1"],
    recordedAt: T0,
    ...overrides
  };
}

test("P15.1 Brain memory rejects secret-like nested material without mutating lineage", () => {
  const ledger = new BrainMemoryLedger();
  ledger.append(baseMemory());

  assert.throws(() => ledger.append(baseMemory({
    id: "m2",
    version: 2,
    supersedes: "m1",
    sourceRefs: ["source-2"],
    recordedAt: "2026-10-29T12:01:00Z",
    value: { nested: [{ message: syntheticApiSecret }] }
  })), /Secret-like material/);

  assert.deepEqual(ledger.current("owner-1", "cc").map((item) => item.id), ["m1"]);
  assert.equal(ledger.history("m1").length, 1);
  assert.equal(ledger.history("m1")[0].state, "current");
});

test("P15.1 Brain memory accepts reference-only values and snapshots them before caller mutation", () => {
  const ledger = new BrainMemoryLedger();
  const value = {
    credentialRef: "sec_transactional_email",
    details: { note: "safe", tags: ["alpha"] }
  };

  ledger.append(baseMemory({ value }));

  value.details.note = syntheticApiSecret;
  value.details.tags.push(syntheticApiSecret);

  const stored = ledger.current("owner-1", "cc")[0];
  assert.deepEqual(stored.value, {
    credentialRef: "sec_transactional_email",
    details: { note: "safe", tags: ["alpha"] }
  });
  assert.notEqual(stored.value, value);
  assert.equal(Object.isFrozen(stored.value), true);
  assert.equal(Object.isFrozen(stored.value.details), true);
  assert.equal(Object.isFrozen(stored.value.details.tags), true);
});

test("P15.1 Brain memory secret guard preserves valid supersession behavior", () => {
  const ledger = new BrainMemoryLedger();
  ledger.append(baseMemory({ value: { credentialRef: "sec_transactional_email", note: "first" } }));
  ledger.append(baseMemory({
    id: "m2",
    version: 2,
    supersedes: "m1",
    sourceRefs: ["source-2"],
    recordedAt: "2026-10-29T12:02:00Z",
    value: { credentialRef: "sec_transactional_email", note: "replacement" }
  }));

  assert.deepEqual(ledger.current("owner-1", "cc").map((item) => item.id), ["m2"]);
  assert.equal(ledger.history("m1")[0].state, "superseded");
  assert.equal(ledger.history("m1")[1].id, "m2");
});
