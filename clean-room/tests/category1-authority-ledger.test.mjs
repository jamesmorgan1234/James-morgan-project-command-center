import test from "node:test";
import assert from "node:assert/strict";
import { VersionedLedger } from "../dist/kernel/index.js";

const T1 = "2026-10-26T12:20:00Z";
const T2 = "2026-10-26T12:21:00Z";
const T3 = "2026-10-26T12:22:00Z";

test("P1.6 rule ledger persists ID, scope, source, version, effective date, precedence, and explicit supersession lineage", () => {
  const ledger = new VersionedLedger();
  const first = ledger.append({
    id: "rul_free-first-v1",
    version: 1,
    scope: "global:spend",
    state: "current",
    sourceRef: "owner:instruction:001",
    effectiveAt: T1,
    precedence: 100,
    value: { freeFirst: true }
  });
  assert.equal(first.id, "rul_free-first-v1");
  assert.equal(first.scope, "global:spend");
  assert.equal(first.sourceRef, "owner:instruction:001");
  assert.equal(first.version, 1);
  assert.equal(first.effectiveAt, T1);
  assert.equal(first.precedence, 100);

  assert.throws(() => ledger.append({
    id: "rul_free-first-v2-bad",
    version: 2,
    scope: "global:spend",
    state: "current",
    sourceRef: "owner:instruction:002",
    effectiveAt: T2,
    precedence: 100,
    value: { freeFirst: false }
  }), /explicitly supersede/);

  const second = ledger.append({
    id: "rul_free-first-v2",
    version: 2,
    scope: "global:spend",
    state: "current",
    sourceRef: "owner:instruction:002",
    effectiveAt: T2,
    precedence: 110,
    supersedes: first.id,
    value: { freeFirst: false }
  });
  assert.equal(ledger.current("global:spend")?.id, second.id);
  assert.equal(ledger.history("global:spend")[0].state, "superseded");
  assert.equal(ledger.history("global:spend")[1].supersedes, first.id);
});

test("P1.6 rule precedence cannot silently decrease while advancing the current rule", () => {
  const ledger = new VersionedLedger();
  ledger.append({ id: "rul_one", version: 1, scope: "project:alpha", state: "current", sourceRef: "owner:a", effectiveAt: T1, precedence: 50, value: { enabled: true } });
  assert.throws(() => ledger.append({ id: "rul_two", version: 2, scope: "project:alpha", state: "current", sourceRef: "owner:b", effectiveAt: T2, precedence: 49, supersedes: "rul_one", value: { enabled: false } }), /precedence cannot decrease/);
  assert.equal(ledger.current("project:alpha")?.id, "rul_one");
});

test("P1.6 conflict detection records an explicit unresolved-conflict state and fails closed on bad lineage", () => {
  const ledger = new VersionedLedger();
  ledger.append({ id: "rul_current", version: 1, scope: "global:work", state: "current", sourceRef: "owner:old", effectiveAt: T1, precedence: 80, value: { implicitWork: false } });

  assert.throws(() => ledger.recordConflict({ id: "cnf_missing", version: 1, scope: "global:work", sourceRef: "owner:new", effectiveAt: T2, precedence: 90, conflictsWith: ["rul_unknown"], value: { implicitWork: true } }), /Unknown conflict reference/);
  assert.throws(() => ledger.recordConflict({ id: "cnf_duplicate", version: 1, scope: "global:work", sourceRef: "owner:new", effectiveAt: T2, precedence: 90, conflictsWith: ["rul_current", "rul_current"], value: { implicitWork: true } }), /must be unique/);

  const conflict = ledger.recordConflict({ id: "cnf_work", version: 2, scope: "global:work", sourceRef: "owner:new", effectiveAt: T2, precedence: 90, conflictsWith: ["rul_current"], value: { implicitWork: true } });
  assert.equal(conflict.state, "unresolved_conflict");
  assert.deepEqual(conflict.conflictsWith, ["rul_current"]);
  assert.equal(ledger.current("global:work")?.id, "rul_current");
  assert.equal(ledger.unresolvedConflicts("global:work").length, 1);
});

test("P1.6 conflict resolution is explicit, auditable, scoped, and cannot bypass current-rule supersession", () => {
  const ledger = new VersionedLedger();
  ledger.append({ id: "rul_current", version: 1, scope: "global:work", state: "current", sourceRef: "owner:old", effectiveAt: T1, precedence: 80, value: { implicitWork: false } });
  ledger.recordConflict({ id: "cnf_work", version: 2, scope: "global:work", sourceRef: "owner:new", effectiveAt: T2, precedence: 90, conflictsWith: ["rul_current"], value: { implicitWork: true } });

  assert.throws(() => ledger.resolveConflict("cnf_work", { id: "rul_bad_resolution", version: 3, scope: "global:work", state: "current", sourceRef: "owner:resolution", effectiveAt: T3, precedence: 100, supersedes: "rul_current", value: { implicitWork: false } }), /requires resolutionReason/);
  assert.throws(() => ledger.resolveConflict("cnf_work", { id: "rul_wrong_scope", version: 3, scope: "project:other", state: "current", sourceRef: "owner:resolution", effectiveAt: T3, precedence: 100, resolutionReason: "owner chose old rule", value: { implicitWork: false } }), /scope mismatch/);

  const resolved = ledger.resolveConflict("cnf_work", { id: "rul_resolution", version: 3, scope: "global:work", state: "current", sourceRef: "owner:resolution", effectiveAt: T3, precedence: 100, supersedes: "rul_current", resolutionReason: "owner explicitly retained the no-implicit-Work rule", value: { implicitWork: false } });
  assert.equal(resolved.id, "rul_resolution");
  assert.equal(ledger.current("global:work")?.id, "rul_resolution");
  assert.equal(ledger.unresolvedConflicts("global:work").length, 0);
  const conflictHistory = ledger.history("global:work").find((entry) => entry.id === "cnf_work");
  assert.equal(conflictHistory?.state, "superseded");
  assert.equal(conflictHistory?.resolvedBy, "rul_resolution");
});

test("P1.6 ledger rejects malformed rule metadata before it enters authority history", () => {
  const ledger = new VersionedLedger();
  const base = { version: 1, scope: "global", state: "current", sourceRef: "owner:source", effectiveAt: T1, precedence: 1, value: { enabled: true } };
  assert.throws(() => ledger.append({ ...base, id: "" }), /id is required/);
  assert.throws(() => ledger.append({ ...base, id: "rul_bad_scope", scope: " " }), /scope is required/);
  assert.throws(() => ledger.append({ ...base, id: "rul_bad_source", sourceRef: "" }), /sourceRef is required/);
  assert.throws(() => ledger.append({ ...base, id: "rul_bad_time", effectiveAt: "not-a-time" }), /effectiveAt/);
  assert.throws(() => ledger.append({ ...base, id: "rul_bad_version", version: 0 }), /version/);
  assert.throws(() => ledger.append({ ...base, id: "rul_bad_precedence", precedence: -1 }), /precedence/);
});
