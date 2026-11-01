import test from "node:test";
import assert from "node:assert/strict";
import {
  KNOWLEDGE_OBJECT_TYPES,
  createKnowledgeObject,
  knowledgeFreshnessState,
  isBrainGenerated,
  isOwnerOriginated
} from "../dist/data/index.js";

const AT = "2026-10-31T12:00:00.000Z";

function base(type, overrides = {}) {
  return {
    id: `obj-${type}`,
    type,
    subjectRef: "subject-1",
    origin: "owner",
    value: "value",
    confidence: 0.8,
    sensitivity: "internal",
    shareability: "private",
    editableByOwner: true,
    externallyVerified: false,
    observedAt: AT,
    evidenceRefs: [],
    sourceRefs: ["evd:source-1"],
    ...overrides
  };
}

test("P3.2 the canonical knowledge object registry names all twelve required object types", () => {
  assert.deepEqual([...KNOWLEDGE_OBJECT_TYPES], ["fact", "rule", "decision", "preference", "goal", "idea", "hypothesis", "research_finding", "question", "unknown_gap", "contradiction", "owner_correction"]);
  assert.throws(() => createKnowledgeObject(base("untyped")), /Unsupported knowledge object type/);
});

test("P3.2 fact objects require provenance and a bounded confidence", () => {
  assert.doesNotThrow(() => createKnowledgeObject(base("fact")));
  assert.throws(() => createKnowledgeObject(base("fact", { sourceRefs: [] })), /requires provenance/);
  assert.throws(() => createKnowledgeObject(base("fact", { confidence: 1.2 })), /between 0 and 1/);
});

test("P3.2 rule objects carry applicability references without inventing scope", () => {
  const rule = createKnowledgeObject(base("rule", { value: "Require owner approval" }));
  assert.equal(rule.type, "rule");
  assert.equal(rule.value, "Require owner approval");
  assert.throws(() => createKnowledgeObject(base("rule", { value: null })), /require a value/);
});

test("P3.2 decision objects preserve owner authority", () => {
  const decision = createKnowledgeObject(base("decision", { sourceRefs: ["evd:owner-decision"] }));
  assert.equal(decision.origin, "owner");
  assert.equal(decision.editableByOwner, true);
  assert.throws(() => createKnowledgeObject(base("decision", { origin: "brain", editableByOwner: true })), /owner-originated/);
});

test("P3.2 preference objects stay owner-editable and scoped", () => {
  const preference = createKnowledgeObject(base("preference", { value: "compact density" }));
  assert.equal(preference.editableByOwner, true);
  assert.throws(() => createKnowledgeObject(base("preference", { origin: "brain", editableByOwner: true })), /owner-originated/);
});

test("P3.2 goal objects carry temporal validity and confidence", () => {
  const goal = createKnowledgeObject(base("goal", { validFrom: AT, validUntil: "2026-12-31T00:00:00.000Z" }));
  assert.equal(goal.validUntil, "2026-12-31T00:00:00.000Z");
  assert.throws(() => createKnowledgeObject(base("goal", { validFrom: "2026-12-31T00:00:00.000Z", validUntil: AT })), /cannot end before it begins/);
});

test("P3.2 idea objects cannot claim verified certainty", () => {
  assert.doesNotThrow(() => createKnowledgeObject(base("idea", { confidence: 0.4, value: "try a new hub" })));
  assert.throws(() => createKnowledgeObject(base("idea", { confidence: 1 })), /cannot claim certainty/);
});

test("P3.2 hypothesis objects carry confidence and freshness metadata", () => {
  const hypothesis = createKnowledgeObject(base("hypothesis", { confidence: 0.55, staleAfter: "2026-11-30T00:00:00.000Z" }));
  assert.equal(knowledgeFreshnessState(hypothesis, "2026-11-01T00:00:00.000Z"), "fresh");
  assert.throws(() => createKnowledgeObject(base("hypothesis", { confidence: 1 })), /cannot claim certainty/);
});

test("P3.2 research findings require external provenance and evidence", () => {
  assert.doesNotThrow(() => createKnowledgeObject(base("research_finding", { origin: "external", editableByOwner: false, evidenceRefs: ["evd:paper"] })));
  assert.throws(() => createKnowledgeObject(base("research_finding", { origin: "owner", evidenceRefs: ["evd:paper"] })), /external provenance/);
  assert.throws(() => createKnowledgeObject(base("research_finding", { origin: "external", editableByOwner: false })), /require evidence/);
});

test("P3.2 question objects remain open and never fabricate a value", () => {
  const question = createKnowledgeObject(base("question", { value: null, confidence: null, editableByOwner: false }));
  assert.equal(question.value, null);
  assert.throws(() => createKnowledgeObject(base("question", { value: "presumed answer" })), /cannot carry a fabricated value/);
});

test("P3.2 unknown gap objects never fabricate a value", () => {
  const gap = createKnowledgeObject(base("unknown_gap", { value: null, confidence: null, editableByOwner: false }));
  assert.equal(gap.value, null);
  assert.throws(() => createKnowledgeObject(base("unknown_gap", { value: 0 })), /cannot carry a fabricated value/);
});

test("P3.2 contradiction objects require at least two opposing references", () => {
  assert.doesNotThrow(() => createKnowledgeObject(base("contradiction", { value: null, confidence: 0.5, contradictionRefs: ["evd:a", "evd:b"] })));
  assert.throws(() => createKnowledgeObject(base("contradiction", { value: null, contradictionRefs: ["evd:a"] })), /at least two opposing references/);
});

test("P3.2 owner corrections must supersede an existing object", () => {
  assert.doesNotThrow(() => createKnowledgeObject(base("owner_correction", { supersedes: "obj-fact" })));
  assert.throws(() => createKnowledgeObject(base("owner_correction")), /must supersede an existing object/);
});

test("P3.2 project scope binds knowledge to an explicit project reference", () => {
  const scoped = createKnowledgeObject(base("fact", { subjectRef: "project:alpha" }));
  assert.equal(scoped.subjectRef, "project:alpha");
  assert.throws(() => createKnowledgeObject(base("fact", { subjectRef: " " })), /subject is required/);
});

test("P3.2 temporal validity is explicit and ordered", () => {
  assert.doesNotThrow(() => createKnowledgeObject(base("rule", { validFrom: AT, validUntil: "2026-11-30T00:00:00.000Z" })));
  assert.throws(() => createKnowledgeObject(base("rule", { validFrom: "not-a-date" })), /validFrom/);
});

test("P3.2 confidence is bounded and uncertain types never claim certainty", () => {
  assert.throws(() => createKnowledgeObject(base("fact", { confidence: -0.1 })), /between 0 and 1/);
  assert.throws(() => createKnowledgeObject(base("hypothesis", { confidence: 1 })), /cannot claim certainty/);
  assert.equal(createKnowledgeObject(base("fact", { confidence: 0 })).confidence, 0);
});

test("P3.2 freshness marks stale objects without hiding them", () => {
  const object = createKnowledgeObject(base("fact", { staleAfter: "2026-11-15T00:00:00.000Z" }));
  assert.equal(knowledgeFreshnessState(object, "2026-11-01T00:00:00.000Z"), "fresh");
  assert.equal(knowledgeFreshnessState(object, "2026-11-20T00:00:00.000Z"), "stale");
  assert.equal(knowledgeFreshnessState(createKnowledgeObject(base("fact")), AT), "unknown");
  assert.throws(() => createKnowledgeObject(base("fact", { staleAfter: AT })), /must follow observation/);
});

test("P3.2 sensitivity classification is mandatory and cannot be downgraded by sharing", () => {
  assert.throws(() => createKnowledgeObject(base("fact", { sensitivity: "secret-ish" })), /Unsupported knowledge sensitivity/);
  assert.throws(() => createKnowledgeObject(base("fact", { sensitivity: "protected", shareability: "internal" })), /cannot exceed sensitivity/);
  assert.doesNotThrow(() => createKnowledgeObject(base("fact", { sensitivity: "protected", shareability: "private" })));
});

test("P3.2 shareability never exceeds sensitivity", () => {
  assert.throws(() => createKnowledgeObject(base("fact", { sensitivity: "sensitive", shareability: "internal" })), /cannot exceed sensitivity/);
  assert.throws(() => createKnowledgeObject(base("fact", { sensitivity: "protected", shareability: "owner_shared" })), /cannot be protected/);
  assert.doesNotThrow(() => createKnowledgeObject(base("fact", { sensitivity: "internal", shareability: "internal" })));
});

test("P3.2 owner-editable flag is limited to owner-originated objects", () => {
  assert.equal(createKnowledgeObject(base("fact", { origin: "owner", editableByOwner: true })).editableByOwner, true);
  assert.throws(() => createKnowledgeObject(base("fact", { origin: "external", editableByOwner: true })), /owner-originated/);
});

test("P3.2 externally verified objects require external evidence", () => {
  assert.doesNotThrow(() => createKnowledgeObject(base("fact", { origin: "external", editableByOwner: false, externallyVerified: true, evidenceRefs: ["evd:ext"] })));
  assert.throws(() => createKnowledgeObject(base("fact", { origin: "owner", externallyVerified: true, evidenceRefs: ["evd:ext"] })), /external provenance and evidence/);
  assert.throws(() => createKnowledgeObject(base("fact", { origin: "external", editableByOwner: false, externallyVerified: true })), /external provenance and evidence/);
});

test("P3.2 origin distinguishes owner, brain and external sources", () => {
  assert.equal(isOwnerOriginated(createKnowledgeObject(base("fact", { origin: "owner" }))), true);
  assert.equal(isBrainGenerated(createKnowledgeObject(base("fact", { origin: "brain", editableByOwner: false }))), true);
  assert.equal(isBrainGenerated(createKnowledgeObject(base("fact", { origin: "external", editableByOwner: false }))), false);
});
