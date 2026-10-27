import test from "node:test";
import assert from "node:assert/strict";
import {
  IDENTIFIER_SCHEMA_VERSION,
  ID_PREFIXES,
  P1_1_REQUIRED_IDENTIFIER_KINDS,
  LIFECYCLE_VOCABULARY_VERSION,
  LINEAGE_STATES,
  P1_1_REQUIRED_LIFECYCLE_VOCABULARIES,
  assertIdentifierKind,
  assertState,
  createIdentifier,
  parseIdentifier,
  validateIdentifierSchema,
  validateLifecycleVocabularySchema
} from "../dist/kernel/index.js";

const expectedP11Kinds = [
  "requirement",
  "project",
  "module",
  "capability",
  "command",
  "event",
  "workflow",
  "agencyRun",
  "agencyJob",
  "evidence",
  "asset",
  "provider",
  "release",
  "decision",
  "rule",
  "lineage"
];

test("P1.1 canonical identifier schema covers every roadmap-required identity with unique deterministic typed prefixes", () => {
  assert.equal(IDENTIFIER_SCHEMA_VERSION, 1);
  assert.equal(validateIdentifierSchema(), true);
  assert.deepEqual([...P1_1_REQUIRED_IDENTIFIER_KINDS], expectedP11Kinds);
  assert.equal(new Set(Object.values(ID_PREFIXES)).size, Object.values(ID_PREFIXES).length);

  for (const kind of expectedP11Kinds) {
    const first = createIdentifier(kind, "  Contract-One  ");
    const second = createIdentifier(kind, "contract-one");
    assert.equal(first, second, kind);
    const parsed = parseIdentifier(first);
    assert.equal(parsed.kind, kind, kind);
    assert.equal(parsed.token, "contract-one", kind);
    assert.equal(assertIdentifierKind(first, kind), first, kind);
  }

  assert.equal(createIdentifier("lineage", "project-history"), "lin_project-history");
});

test("P1.1 canonical identifier schema fails closed on unknown kinds prefixes tokens and wrong-kind assertions", () => {
  assert.throws(() => createIdentifier("mystery", "one"), /Unknown identifier kind/);
  assert.throws(() => parseIdentifier("zzz_one"), /Unknown identifier prefix/);
  assert.throws(() => createIdentifier("project", "bad token!"), /Invalid identifier token/);
  assert.throws(() => assertIdentifierKind("lin_history", "project"), /expected project/);
});

test("P1.1 lifecycle vocabulary schema covers every roadmap-required state domain including lineages", () => {
  assert.equal(LIFECYCLE_VOCABULARY_VERSION, 1);
  assert.equal(validateLifecycleVocabularySchema(), true);
  assert.deepEqual(Object.keys(P1_1_REQUIRED_LIFECYCLE_VOCABULARIES), expectedP11Kinds);
  assert.deepEqual(LINEAGE_STATES, ["recorded", "verified", "superseded", "invalidated"]);

  for (const [label, vocabulary] of Object.entries(P1_1_REQUIRED_LIFECYCLE_VOCABULARIES)) {
    assert.ok(vocabulary.length > 0, label);
    assert.equal(new Set(vocabulary).size, vocabulary.length, label);
    assert.equal(assertState(vocabulary[0], vocabulary, label), vocabulary[0], label);
    assert.throws(() => assertState("__unknown__", vocabulary, label), new RegExp(`Invalid ${label} state`));
  }
});
