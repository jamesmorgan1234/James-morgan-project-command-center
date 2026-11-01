import test from "node:test";
import assert from "node:assert/strict";
import { linkProject, assertUniqueRelationships, projectDependencies, bankReference } from "../dist/projects/relationships.js";

test("P1.x project dependencies", () => {
  assert.deepEqual([...projectDependencies({ a: ["b"], b: ["c"], c: [] }, "a")], ["b", "c"]);
  assert.throws(() => projectDependencies({ a: ["b"], b: ["a"] }, "a"), /cycle/);
});

test("P1.x project-to-domain relationships", () => {
  const link = linkProject("domain", "p1", "d1");
  assert.equal(link.kind, "domain");
  assert.throws(() => linkProject("domain", "p1", " "), /both identifiers/);
});

test("P1.x rule-to-project relationships", () => {
  assert.equal(linkProject("rule", "p1", "r1").targetId, "r1");
  assert.throws(() => linkProject("rules", "p1", "r1"), /Unknown relationship kind/);
});

test("P1.x decision-to-project relationships", () => {
  assert.equal(linkProject("decision", "p1", "ADR-001").kind, "decision");
});

test("P1.x agent-run-to-project relationships", () => {
  assert.equal(linkProject("agent_run", "p1", "run-9").kind, "agent_run");
});

test("P1.x recommendation-to-project relationships", () => {
  assert.equal(linkProject("recommendation", "p1", "rec-2").kind, "recommendation");
});

test("P1.x integration-to-project relationships", () => {
  const links = [linkProject("integration", "p1", "stripe"), linkProject("integration", "p1", "stripe")];
  assert.throws(() => assertUniqueRelationships(links), /Duplicate relationship/);
});

test("P1.x bank-reference relationships do not expose secrets", () => {
  const reference = bankReference("br_7f3a9c2e");
  assert.equal(reference.last4, "9c2e");
  assert.throws(() => bankReference("123456789012"), /opaque tokens/);
});
