import test from "node:test";
import assert from "node:assert/strict";
import {
  CANONICAL_TERMS,
  glossaryTerm,
  assertSharedVocabulary,
  defineTaxonomy,
  taxonomyLookup,
  assertTaxonomyComplete
} from "../dist/kernel/index.js";

test("P1.x terminology glossary defines one meaning per term", () => {
  assert.match(glossaryTerm("Checkpoint"), /verified resume pointer/);
  assert.equal(new Set(Object.values(CANONICAL_TERMS)).size, Object.values(CANONICAL_TERMS).length);
  assert.throws(() => glossaryTerm("Sprint"), /Unknown canonical term/);
});

test("P1.x canonical state vocabulary is shared across surfaces", () => {
  const vocabulary = { queued: "Queued", working: "Working", dropped: "Dropped" };
  assert.doesNotThrow(() => assertSharedVocabulary([vocabulary, { ...vocabulary }, { ...vocabulary }]));
  assert.throws(() => assertSharedVocabulary([vocabulary, { ...vocabulary, dropped: "Dismissed" }]), /must match across surfaces/);
});

test("P1.x canonical error taxonomy", () => {
  const taxonomy = defineTaxonomy("error", [
    { code: "provider_unavailable", description: "Provider could not be reached" },
    { code: "validation_failed", description: "Input failed validation" }
  ]);
  assert.equal(taxonomyLookup(taxonomy, "provider_unavailable").description, "Provider could not be reached");
  assert.throws(() => defineTaxonomy("error", [{ code: "Bad Code", description: "x" }]), /Invalid error code/);
});

test("P1.x canonical blocker taxonomy", () => {
  const taxonomy = defineTaxonomy("blocker", [
    { code: "capability_missing", description: "No executor advertises the capability" },
    { code: "owner_decision_required", description: "Owner must choose" }
  ]);
  assert.doesNotThrow(() => assertTaxonomyComplete(taxonomy, ["capability_missing", "owner_decision_required"]));
  assert.throws(() => assertTaxonomyComplete(taxonomy, ["resource_unavailable"]), /Missing blocker codes/);
});

test("P1.x canonical authorization taxonomy", () => {
  const taxonomy = defineTaxonomy("authorization", [
    { code: "authorized", description: "Fresh exact authorization present" },
    { code: "expired", description: "Authorization expired" }
  ]);
  assert.equal(taxonomyLookup(taxonomy, "expired").code, "expired");
  assert.throws(() => taxonomyLookup(taxonomy, "maybe"), /Unknown authorization code/);
});

test("P1.x canonical risk taxonomy", () => {
  const taxonomy = defineTaxonomy("risk", [
    { code: "low", description: "Reversible and local" },
    { code: "protected", description: "Requires elevated review" }
  ]);
  assert.throws(() => defineTaxonomy("risk", [{ code: "low", description: "a" }, { code: "low", description: "b" }]), /Duplicate risk code/);
});

test("P1.x canonical evidence taxonomy", () => {
  const taxonomy = defineTaxonomy("evidence", [
    { code: "observed", description: "Seen at runtime" },
    { code: "verified", description: "Independently confirmed" }
  ]);
  assert.equal(taxonomy.entries.length, 2);
  assert.throws(() => defineTaxonomy("evidence", []), /requires entries/);
});
