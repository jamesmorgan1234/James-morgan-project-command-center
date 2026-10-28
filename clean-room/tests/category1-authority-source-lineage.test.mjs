import test from "node:test";
import assert from "node:assert/strict";
import {
  AuthoritySourceRegistry,
  CORE_AUTHORITY_SOURCE_TYPES,
  GovernedTruthStore,
  RequirementLineageRegistry
} from "../dist/kernel/index.js";

const T1 = "2026-10-28T16:00:00Z";
const T2 = "2026-10-28T16:01:00Z";

function sources() {
  const registry = new AuthoritySourceRegistry();
  registry.registerSource({ id: "src_owner", type: "OWNER_INSTRUCTION", version: 1, active: true, locator: "owner:instruction:1", observedAt: T1 });
  registry.registerSource({ id: "src_provider", type: "VERIFIED_LIVE_PROVIDER_STATE", version: 1, active: true, locator: "provider:a/state", observedAt: T1 });
  registry.registerSource({ id: "src_repo", type: "VERIFIED_REPOSITORY_STATE", version: 1, active: true, locator: "repo:a/path", observedAt: T1 });
  registry.registerSource({ id: "src_db", type: "VERIFIED_DATABASE_STATE", version: 1, active: true, locator: "db:schema_v1/table", observedAt: T1 });
  return registry;
}

test("P15.1 A00 authority source registry proves CCR-01875 through CCR-01880 with explicit registered authority identities", () => {
  const registry = sources();
  assert.deepEqual(registry.registeredTypes().map((entry) => entry.type), CORE_AUTHORITY_SOURCE_TYPES);
  assert.equal(registry.requireSource("src_owner").type, "OWNER_INSTRUCTION");
  assert.equal(registry.requireSource("src_provider").type, "VERIFIED_LIVE_PROVIDER_STATE");
  assert.equal(registry.requireSource("src_repo").type, "VERIFIED_REPOSITORY_STATE");
  assert.equal(registry.requireSource("src_db").type, "VERIFIED_DATABASE_STATE");
  const fact = registry.recordFact({ id: "fact_branch_head", sourceId: "src_repo", value: "abc123" });
  assert.equal(fact.sourceId, "src_repo");
  assert.equal(registry.fact("fact_branch_head")?.value, "abc123");
});

test("P15.1 A00 authority sources fail closed on unknown types, missing identity, inactive sources, and non-advancing revisions", () => {
  const registry = sources();
  assert.throws(() => registry.registerSource({ id: "src_unknown", type: "UNKNOWN", version: 1, active: true, locator: "x" }), /not registered/);
  assert.throws(() => registry.recordFact({ id: "fact_missing", sourceId: "missing", value: true }), /Unknown authority source/);
  registry.registerSource({ id: "src_inactive", type: "VERIFIED_REPOSITORY_STATE", version: 1, active: false, locator: "repo:old" });
  assert.throws(() => registry.recordFact({ id: "fact_inactive", sourceId: "src_inactive", value: true }), /inactive/);
  assert.throws(() => registry.reviseSource("src_repo", { version: 1, active: true, locator: "repo:new", observedAt: T2 }), /advance version/);
  assert.equal(registry.requireSource("src_repo").locator, "repo:a/path");
});

test("P15.1 A00 owner requirements and truth dimensions prove CCR-01886 through CCR-01892 without implicit override or fabrication", () => {
  const registry = sources();
  const requirements = new RequirementLineageRegistry(registry);
  requirements.registerOwnerRequirement({ id: "req_old", sourceId: "src_owner", statement: "Keep free-first controls." });
  requirements.registerOwnerRequirement({ id: "req_new", sourceId: "src_owner", statement: "Keep normal chat first." });
  assert.deepEqual(requirements.active().map((entry) => entry.id).sort(), ["req_new", "req_old"]);

  const truth = new GovernedTruthStore();
  truth.create("project:alpha", { desired: "enabled" });
  assert.equal(truth.get("project:alpha")?.actual, undefined);
  truth.update("project:alpha", "actual", "disabled");
  truth.update("project:alpha", "planned", "plan-v1");
  truth.update("project:alpha", "implemented", "build-v1");
  truth.update("project:alpha", "verified", "qa-v1");
  truth.update("project:alpha", "ownerAccepted", "accepted-v1");
  const state = truth.get("project:alpha");
  assert.equal(state?.desired, "enabled");
  assert.equal(state?.actual, "disabled");
  assert.equal(state?.planned, "plan-v1");
  assert.equal(state?.implemented, "build-v1");
  assert.equal(state?.verified, "qa-v1");
  assert.equal(state?.ownerAccepted, "accepted-v1");
});

test("P15.1 A00 owner and live truth separation rejects invalid state mutation while preserving last valid state", () => {
  const truth = new GovernedTruthStore();
  truth.create("project:alpha", { desired: "enabled", actual: "disabled" });
  assert.throws(() => truth.update("project:alpha", "invented", "bad"), /Unknown governed truth dimension/);
  assert.deepEqual(truth.get("project:alpha"), { desired: "enabled", actual: "disabled" });
  assert.throws(() => truth.update("missing", "actual", "bad"), /Unknown governed state/);
});

test("P15.1 A00 stable source identity proves CCR-01901 CCR-01902 and CCR-01905 across provider repository and schema relocation", () => {
  const registry = sources();
  registry.recordFact({ id: "fact_provider", sourceId: "src_provider", value: "healthy" });
  registry.recordFact({ id: "fact_repo", sourceId: "src_repo", value: "head-1" });
  registry.recordFact({ id: "fact_db", sourceId: "src_db", value: "schema-1" });
  registry.reviseSource("src_provider", { version: 2, active: true, locator: "provider:b/state", observedAt: T2 });
  registry.reviseSource("src_repo", { version: 2, active: true, locator: "repo:b/reorganized/path", observedAt: T2 });
  registry.reviseSource("src_db", { version: 2, active: true, locator: "db:schema_v2/new_table", observedAt: T2 });
  assert.equal(registry.fact("fact_provider")?.sourceId, "src_provider");
  assert.equal(registry.fact("fact_repo")?.sourceId, "src_repo");
  assert.equal(registry.fact("fact_db")?.sourceId, "src_db");
  assert.deepEqual(registry.sourceHistory("src_provider").map((entry) => entry.locator), ["provider:a/state", "provider:b/state"]);
  assert.deepEqual(registry.sourceHistory("src_repo").map((entry) => entry.locator), ["repo:a/path", "repo:b/reorganized/path"]);
  assert.deepEqual(registry.sourceHistory("src_db").map((entry) => entry.locator), ["db:schema_v1/table", "db:schema_v2/new_table"]);
});

test("P15.1 A00 requirement lineage proves CCR-01907 through CCR-01912 while preserving original owner intent and source linkage", () => {
  const registry = sources();
  const requirements = new RequirementLineageRegistry(registry);
  const parent = requirements.registerOwnerRequirement({ id: "req_parent", sourceId: "src_owner", statement: "Preserve exact owner intent across derived requirements." });
  const normalized = requirements.normalize("req_parent", "Preserve owner intent for all derived requirements.", parent.originalOwnerStatement);
  assert.equal(normalized.originalOwnerStatement, parent.originalOwnerStatement);
  assert.equal(normalized.sourceId, "src_owner");

  const childA = requirements.deriveRequirement({ id: "req_child_a", sourceId: "src_owner", statement: "Child A", parentRequirementIds: ["req_parent"] });
  const childB = requirements.deriveRequirement({ id: "req_child_b", sourceId: "src_owner", statement: "Child B", parentRequirementIds: ["req_parent"] });
  assert.deepEqual(childA.parentRequirementIds, ["req_parent"]);
  assert.deepEqual(childB.parentRequirementIds, ["req_parent"]);
  assert.equal(requirements.require("req_parent").originalOwnerStatement, "Preserve exact owner intent across derived requirements.");
  assert.equal(requirements.require("req_parent").state, "active");
});

test("P15.1 A00 requirement lineage fails closed on intent-changing normalization, missing parents, and source-statement replacement", () => {
  const registry = sources();
  const requirements = new RequirementLineageRegistry(registry);
  requirements.registerOwnerRequirement({ id: "req_parent", sourceId: "src_owner", statement: "Never fabricate owner intent." });
  assert.throws(() => requirements.normalize("req_parent", "Changed wording", "Different owner statement"), /intent basis mismatch/);
  assert.throws(() => requirements.deriveRequirement({ id: "req_bad", sourceId: "src_owner", statement: "Bad child", parentRequirementIds: [] }), /at least one parent/);
  assert.throws(() => requirements.deriveRequirement({ id: "req_bad2", sourceId: "src_owner", statement: "Bad child", parentRequirementIds: ["missing"] }), /Unknown parent/);
  assert.equal(requirements.require("req_parent").originalOwnerStatement, "Never fabricate owner intent.");
  assert.equal(requirements.history("req_parent").length, 1);
});
