import test from "node:test";
import assert from "node:assert/strict";
import { VersionedLedger } from "../dist/kernel/index.js";

const T1 = "2026-10-27T12:00:00.000Z";
const T2 = "2026-10-27T12:10:00.000Z";
const T3 = "2026-10-27T12:20:00.000Z";

function current(overrides = {}) {
  return {
    id: "rule-1",
    version: 1,
    scope: "global:execution",
    state: "current",
    sourceRef: "owner:instruction:1",
    effectiveAt: T1,
    precedence: 100,
    value: { normalChatFirst: true },
    ...overrides
  };
}

test("P1.6 governing authority fails closed while an explicit conflict remains unresolved", () => {
  const ledger = new VersionedLedger();
  ledger.append(current());
  ledger.recordConflict({
    id: "conflict-1",
    version: 2,
    scope: "global:execution",
    sourceRef: "owner:instruction:2",
    effectiveAt: T2,
    precedence: 110,
    conflictsWith: ["rule-1"],
    value: { normalChatFirst: false }
  });

  assert.equal(ledger.current("global:execution")?.id, "rule-1");
  assert.throws(() => ledger.governing("global:execution"), /Unresolved authority conflict blocks governing rule/);

  ledger.resolveConflict("conflict-1", {
    id: "rule-3",
    version: 3,
    scope: "global:execution",
    state: "current",
    sourceRef: "owner:resolution:3",
    effectiveAt: T3,
    precedence: 120,
    supersedes: "rule-1",
    resolutionReason: "Newest explicit owner decision retained normal-chat-first",
    value: { normalChatFirst: true }
  });
  assert.equal(ledger.governing("global:execution")?.id, "rule-3");
});

test("P1.6 newer governing entries cannot silently move their effective date backwards", () => {
  const ledger = new VersionedLedger();
  ledger.append(current({ effectiveAt: T2 }));
  assert.throws(() => ledger.append(current({
    id: "rule-2",
    version: 2,
    effectiveAt: T1,
    supersedes: "rule-1",
    sourceRef: "owner:instruction:2"
  })), /effectiveAt cannot move backward/);
  assert.equal(ledger.governing("global:execution")?.id, "rule-1");
});

test("P1.6 explicit revocation preserves source version reason and revocation lineage and leaves no governing rule", () => {
  const ledger = new VersionedLedger();
  ledger.append(current());
  const revoked = ledger.revokeCurrent({
    id: "rule-2-revocation",
    version: 2,
    scope: "global:execution",
    sourceRef: "owner:instruction:2",
    effectiveAt: T2,
    precedence: 110,
    supersedes: "rule-1",
    resolutionReason: "Owner explicitly revoked the prior rule",
    value: { normalChatFirst: false }
  });

  assert.equal(revoked.state, "revoked");
  assert.equal(revoked.supersedes, "rule-1");
  assert.equal(revoked.resolutionReason, "Owner explicitly revoked the prior rule");
  assert.equal(ledger.current("global:execution"), undefined);
  assert.equal(ledger.governing("global:execution"), undefined);

  const history = ledger.history("global:execution");
  assert.equal(history.length, 2);
  assert.equal(history[0].state, "revoked");
  assert.equal(history[0].revokedBy, "rule-2-revocation");
  assert.equal(history[1].id, "rule-2-revocation");
});

test("P1.6 revocation and ledger state validation fail closed on malformed or stale authority mutations", () => {
  const ledger = new VersionedLedger();
  ledger.append(current());
  assert.throws(() => ledger.append(current({ id: "bad-state", state: "mystery" })), /Invalid ledger state/);
  assert.throws(() => ledger.revokeCurrent({
    id: "bad-revocation",
    version: 2,
    scope: "global:execution",
    sourceRef: "owner:instruction:2",
    effectiveAt: T2,
    precedence: 110,
    supersedes: "wrong-rule",
    resolutionReason: "Explicit revocation",
    value: { normalChatFirst: false }
  }), /must explicitly supersede rule-1/);
  assert.throws(() => ledger.revokeCurrent({
    id: "bad-time",
    version: 2,
    scope: "global:execution",
    sourceRef: "owner:instruction:2",
    effectiveAt: "2026-10-26T00:00:00.000Z",
    precedence: 110,
    supersedes: "rule-1",
    resolutionReason: "Explicit revocation",
    value: { normalChatFirst: false }
  }), /effectiveAt cannot move backward/);
});
