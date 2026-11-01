import test from "node:test";
import assert from "node:assert/strict";
import {
  architectureDecisionRecord,
  assertDecisionHistory,
  defineRegistry,
  registerInto,
  registryLookup
} from "../dist/kernel/index.js";

function adr(overrides = {}) {
  return {
    id: "ADR-001",
    title: "Use an append-only ledger",
    context: "Audit history must survive edits",
    decision: "Append-only event ledger",
    consequences: ["More storage"],
    rationale: "Preserves protected history",
    ...overrides
  };
}

test("P1.x architecture decision records capture significant choices", () => {
  const record = architectureDecisionRecord(adr());
  assert.equal(record.id, "ADR-001");
  assert.throws(() => architectureDecisionRecord(adr({ id: "1" })), /ADR-nnn/);
  assert.throws(() => assertDecisionHistory([]), /At least one/);
});

test("P1.x decision rationale is preserved", () => {
  assert.throws(() => architectureDecisionRecord(adr({ rationale: " " })), /requires rationale/);
  assert.doesNotThrow(() => assertDecisionHistory([architectureDecisionRecord(adr())]));
});

test("P1.x screen registry", () => {
  const registry = defineRegistry("screen", [{ key: "home", description: "Home" }, { key: "finance", description: "Finance" }]);
  assert.equal(registryLookup("screen", registry, "home").description, "Home");
  assert.throws(() => defineRegistry("screen", [{ key: "home", description: "Home" }, { key: "home", description: "Again" }]), /Duplicate screen/);
});

test("P1.x home module registry", () => {
  const registry = defineRegistry("home module", [{ key: "needs_me", description: "Needs Me" }]);
  const extended = registerInto("home module", registry, { key: "agent", description: "Agent" });
  assert.equal(extended.length, 2);
  assert.throws(() => registerInto("home module", extended, { key: "agent", description: "Dup" }), /already registered/);
});

test("P1.x project detail section registry", () => {
  const registry = defineRegistry("project section", [{ key: "runs", description: "Runs" }, { key: "evidence", description: "Evidence" }]);
  assert.throws(() => registryLookup("project section", registry, "finance"), /Unknown project section/);
});

test("P1.x storage provider registry", () => {
  const registry = defineRegistry("storage provider", [{ key: "r2", description: "Object storage" }]);
  assert.equal(registry[0].key, "r2");
  assert.throws(() => defineRegistry("storage provider", []), /requires entries/);
});
