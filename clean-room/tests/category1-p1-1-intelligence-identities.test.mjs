import test from "node:test";
import assert from "node:assert/strict";
import {
  P1_1_INTELLIGENCE_IDENTITY_VERSION,
  P1_1_INTELLIGENCE_IDENTITY_SCHEMAS,
  P1_1_INTELLIGENCE_STATE_VOCABULARIES,
  validateIntelligenceIdentitySchema,
  validateIntelligenceIdentity,
  intelligenceIdentityKey
} from "../dist/kernel/index.js";

const fixtures = {
  specialist: { id: "brn_specialist-one", state: "active" },
  method: { id: "mth_method-one", state: "experimental" },
  learningPacket: { id: "lrn_packet-one", state: "submitted" },
  promotion: { id: "prm_promotion-one", state: "classified" },
  evaluator: { id: "evaluator:quality-one", state: "active" },
  ontologyVersion: { id: "mod_shared-intelligence", state: "current" },
  procedure: { id: "mth_procedure-one", state: "experimental" },
  intelligenceState: { id: "ast_intelligence-state-one", state: "recorded" }
};
const identity = (kind, overrides = {}) => ({ schemaVersion: 1, kind, ...fixtures[kind], version: 1, ...overrides });

test("P1.1 current intelligence identity schema covers every Roadmap-22 added domain without replacing existing IDs", () => {
  assert.equal(P1_1_INTELLIGENCE_IDENTITY_VERSION, 1);
  assert.equal(validateIntelligenceIdentitySchema(), true);
  assert.deepEqual(Object.keys(P1_1_INTELLIGENCE_IDENTITY_SCHEMAS), Object.keys(fixtures));
  assert.deepEqual(Object.keys(P1_1_INTELLIGENCE_STATE_VOCABULARIES), Object.keys(fixtures));
  for (const kind of Object.keys(fixtures)) {
    const input = identity(kind);
    assert.deepEqual(validateIntelligenceIdentity(input), input);
    assert.equal(validateIntelligenceIdentity({ ...input, version: 2 }).id, input.id);
    assert.equal(intelligenceIdentityKey(input), intelligenceIdentityKey({ ...input }));
    assert.notEqual(intelligenceIdentityKey(input), intelligenceIdentityKey({ ...input, version: 2 }));
  }
});

test("P1.1 intelligence vocabularies accept every declared state and reject unknown states without coercion", () => {
  for (const [kind, states] of Object.entries(P1_1_INTELLIGENCE_STATE_VOCABULARIES)) {
    assert.ok(states.length > 0);
    assert.equal(new Set(states).size, states.length);
    for (const state of states) assert.equal(validateIntelligenceIdentity(identity(kind, { state })).state, state);
    for (const state of ["__unknown__", "", null, false, 0]) {
      assert.throws(() => validateIntelligenceIdentity(identity(kind, { state })), /state/);
    }
  }
});

test("P1.1 intelligence identities fail closed for wrong kinds malformed IDs schemas and unsafe versions", () => {
  for (const kind of Object.keys(fixtures)) {
    assert.throws(() => validateIntelligenceIdentity(identity(kind, { id: "prj_wrong-kind" })), /identity|expected/);
    for (const id of ["", " ", "bad identity", null]) assert.throws(() => validateIntelligenceIdentity(identity(kind, { id })));
    for (const version of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, "1", null]) {
      assert.throws(() => validateIntelligenceIdentity(identity(kind, { version })), /version/);
    }
    assert.throws(() => validateIntelligenceIdentity(identity(kind, { schemaVersion: 2 })), /schema/);
    assert.throws(() => validateIntelligenceIdentity(identity(kind, { authorizationGranted: true })), /field/);
  }
  for (const kind of ["missing", "toString", "__proto__"]) assert.throws(() => validateIntelligenceIdentity(identity("method", { kind })), /kind/);
});

test("P1.1 existing specialist method procedure ontology and evaluator reference formats remain byte-stable", () => {
  assert.equal(validateIntelligenceIdentity(identity("specialist")).id, "brn_specialist-one");
  assert.equal(validateIntelligenceIdentity(identity("procedure", { id: "mth_method-one" })).id, fixtures.method.id);
  assert.equal(validateIntelligenceIdentity(identity("ontologyVersion", { version: 2 })).id, "mod_shared-intelligence");
  assert.equal(validateIntelligenceIdentity(identity("evaluator")).id, "evaluator:quality-one");
  assert.equal(validateIntelligenceIdentity(identity("intelligenceState", { id: "chk_snapshot-one" })).id, "chk_snapshot-one");
  assert.throws(() => validateIntelligenceIdentity(identity("evaluator", { id: "evaluator:" })), /identity/);
  assert.throws(() => validateIntelligenceIdentity(identity("evaluator", { id: "evaluator:quality one" })), /identity/);
  assert.throws(() => validateIntelligenceIdentity(identity("evaluator", { id: " evaluator:quality-one" })), /identity/);
  assert.notEqual(intelligenceIdentityKey(identity("method")), intelligenceIdentityKey(identity("procedure", { id: fixtures.method.id })));
});

test("P1.1 intelligence identity snapshots and schema catalogs cannot be changed by callers", () => {
  const input = identity("method");
  const validated = validateIntelligenceIdentity(input);
  input.id = "mth_other";
  assert.equal(validated.id, "mth_method-one");
  assert.throws(() => { validated.id = "mth_changed"; }, TypeError);
  for (const kind of Object.keys(fixtures)) {
    assert.ok(Object.isFrozen(P1_1_INTELLIGENCE_IDENTITY_SCHEMAS[kind]));
    assert.ok(Object.isFrozen(P1_1_INTELLIGENCE_STATE_VOCABULARIES[kind]));
    assert.throws(() => { P1_1_INTELLIGENCE_STATE_VOCABULARIES[kind].push("invented"); }, TypeError);
  }
});
