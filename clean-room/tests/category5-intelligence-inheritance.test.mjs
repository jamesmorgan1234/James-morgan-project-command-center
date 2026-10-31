import test from "node:test";
import assert from "node:assert/strict";
import {
  ProjectTypeRegistry,
  ProjectRegistry,
  validateProjectInheritancePlan,
  validateRecoveryPlan
} from "../dist/projects/index.js";

const T0 = "2026-10-30T20:00:00Z";

function project(id = "p1") {
  return {
    id,
    typeKey: "project-type:software",
    ownerId: "owner-1",
    companyId: "company-1",
    name: `Project ${id}`,
    mission: "Build governed project intelligence inheritance",
    lifecycle: "active",
    status: "building",
    verification: "verified",
    priority: "normal",
    version: 1,
    createdAt: T0,
    updatedAt: T0,
    agentAccessEnabled: false,
    portfolioAutoEnabled: false,
    protected: false
  };
}

function candidate(overrides = {}) {
  return {
    kind: "capability",
    canonicalRef: "capability:project-analysis",
    versionRef: "v1",
    inherit: true,
    applicability: "applicable",
    validation: "validated",
    applicabilityEvidenceRefs: ["evidence:applicability"],
    validationEvidenceRefs: ["evidence:validation"],
    ...overrides
  };
}

function plan(projectId = "p1", candidates = [candidate()]) {
  return {
    projectId,
    projectTypeKey: "project-type:software",
    companyId: "company-1",
    defaultInheritance: false,
    candidates
  };
}

function registry() {
  const types = new ProjectTypeRegistry();
  types.register({
    key: "project-type:software",
    version: 1,
    label: "Software",
    capabilities: ["build"],
    requiredDetailSections: ["snapshot"],
    domainPlaybookKey: "playbook:software"
  });
  return new ProjectRegistry(types);
}

test("P5.1 new project intelligence inheritance requires explicit applicability and validation", () => {
  const projects = registry();
  const inheritance = plan("p1", [
    candidate(),
    candidate({ kind: "method", canonicalRef: "method:alternate", versionRef: "v2", inherit: false, applicability: "unknown", validation: "unvalidated", applicabilityEvidenceRefs: [], validationEvidenceRefs: [] })
  ]);

  projects.create(project(), inheritance);
  assert.deepEqual(projects.inheritedIntelligence("p1").map((item) => item.canonicalRef), ["capability:project-analysis"]);

  assert.throws(() => validateProjectInheritancePlan({ ...inheritance, defaultInheritance: true }), /blind global defaults/);
  assert.throws(() => validateProjectInheritancePlan(plan("p2", [candidate({ applicability: "unknown" })])), /explicitly applicable/);
  assert.throws(() => validateProjectInheritancePlan(plan("p3", [candidate({ validation: "stale" })])), /must be validated/);
  assert.throws(() => projects.create(project("p4"), plan("p4", [candidate({ applicabilityEvidenceRefs: [] })])), /applicability evidence is required/);
  assert.throws(() => projects.create(project("p5"), { ...plan("p5"), companyId: "company-other" }), /company scope mismatch/);
});

test("P5.14 recovery revalidates prior inherited intelligence and may drop stale or inapplicable defaults", () => {
  const base = {
    projectId: "p1",
    mode: "rescue",
    lineageRefs: ["lineage:1"],
    assetRefs: [],
    decisionRefs: ["decision:1"],
    checkpointRefs: ["checkpoint:verified"],
    previousInheritedIntelligenceRefs: ["capability:project-analysis"]
  };

  assert.throws(() => validateRecoveryPlan(base), /requires explicit applicability revalidation/);

  const dropped = plan("p1", [candidate({ inherit: false, applicability: "not_applicable", validation: "stale", applicabilityEvidenceRefs: [], validationEvidenceRefs: [] })]);
  assert.doesNotThrow(() => validateRecoveryPlan({ ...base, inheritancePlan: dropped }));

  const omitted = plan("p1", [candidate({ canonicalRef: "method:different", kind: "method" })]);
  assert.throws(() => validateRecoveryPlan({ ...base, inheritancePlan: omitted }), /omitted prior intelligence/);

  const revalidated = plan("p1", [candidate()]);
  assert.doesNotThrow(() => validateRecoveryPlan({ ...base, inheritancePlan: revalidated }));
});
