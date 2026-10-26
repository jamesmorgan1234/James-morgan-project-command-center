import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SpecialistBrainRegistry } from "../dist/brain/index.js";
import { SpecialistRegistry } from "../dist/specialists/index.js";

const authority = { actor: "command_center", evidenceIds: ["evd_owner-directive"] };

function model(overrides = {}) {
  return {
    key: "brn_books",
    version: 1,
    enabled: true,
    controlPlane: "command_center",
    domain: "books",
    subdomains: ["publishing"],
    supportedCompanyIds: ["company-books"],
    supportedProjectIds: ["book-1"],
    supportedWorkClasses: ["manuscript"],
    strengths: ["editing"],
    weaknesses: ["live-market-data"],
    capabilityKeys: ["book-context"],
    methodIds: ["mth_book-editing"],
    permissionKeys: ["draft.read"],
    protectedActionBoundaries: ["publishing_requires_owner"],
    dataClasses: ["manuscript"],
    toolKeys: ["document"],
    providerKeys: ["local"],
    modelAssignments: [{ providerKey: "local", modelId: "local-model", versionRef: "v1" }],
    dependencyVersionRefs: ["pif2@1"],
    calibrationScore: 0.9,
    evaluationEvidenceIds: ["evd_specialist-eval"],
    historicalAccuracy: 0.9,
    reliabilityScore: 0.95,
    latencyMs: 500,
    resourceClass: "low",
    costClass: "free",
    failureModes: ["provider_unavailable"],
    degradedModes: ["local_only"],
    fallbackSpecialistIds: [],
    delegationTargets: [],
    learningEligibility: "local_only",
    experimentStatus: "stable",
    health: "healthy",
    lifecycle: "active",
    rollbackEvidenceId: "evd_specialist-rollback",
    provenanceEvidenceIds: ["evd_specialist-provenance"],
    verificationState: "verified",
    revalidatedAt: "2026-10-26T01:00:00Z",
    revalidateAfter: "2026-11-26T01:00:00Z",
    ...overrides
  };
}

test("PIF.3 canonical specialist registry keeps Command Center permanently in control", () => {
  const registry = new SpecialistBrainRegistry();
  registry.registerModel(model(), authority);
  assert.equal(registry.getModel("brn_books").controlPlane, "command_center");
  assert.throws(() => registry.registerModel(model({ key: "brn_media" }), { actor: "specialist", specialistId: "brn_media", evidenceIds: ["evd_self-request"] }), /cannot mutate|self-promote|authority/i);
  assert.throws(() => registry.registerModel(model({ key: "brn_bad-control", controlPlane: "specialist" }), authority), /Command Center/i);
});

test("PIF.3 project projections cannot expand canonical project, data, capability, or permission authority", () => {
  const brains = new SpecialistBrainRegistry();
  const canonical = model();
  brains.registerModel(canonical, authority);
  const projects = new SpecialistRegistry();
  projects.registerType("books");
  const base = { projectId: "book-1", typeKey: "books", displayName: "Book One", contract: { key: "books", truthOwner: "specialist:books", dataDomains: ["manuscript"], brainCapabilities: ["book-context"], agencyCapabilities: [], projectDetailSections: ["overview"], metricKeys: [], providerCapabilities: ["draft.read"], isolationClass: "specialist:books" }, sourceRefs: ["owner"], active: true, specialistId: "brn_books", specialistVersion: 1, companyId: "company-books", workClasses: ["manuscript"], dataClasses: ["manuscript"], capabilityKeys: ["book-context"], permissionKeys: ["draft.read"] };
  projects.registerCanonical(base, canonical);
  assert.equal(projects.get("book-1").specialistId, "brn_books");
  const other = new SpecialistRegistry(); other.registerType("books");
  assert.throws(() => other.registerCanonical({ ...base, projectId: "book-2" }, canonical), /unrelated project scope/i);
  assert.throws(() => { const r = new SpecialistRegistry(); r.registerType("books"); r.registerCanonical({ ...base, dataClasses: ["private-other-company"] }, canonical); }, /data classes exceeds/i);
});

test("PIF.3 suspension and retirement are versioned control-plane actions", () => {
  const registry = new SpecialistBrainRegistry();
  registry.registerModel(model(), authority);
  assert.equal(registry.suspendModel("brn_books", 1, authority).version, 2);
  assert.throws(() => registry.suspendModel("brn_books", 1, authority), /version/i);
  assert.equal(registry.retireModel("brn_books", 2, authority).learningEligibility, "none");
});

test("PIF.3 durable schema extends the existing C6 specialist Brain owner instead of creating a competing identity table", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026010000_pif3_specialist_model_registry.sql", import.meta.url), "utf8");
  assert.match(sql, /alter table public\.command_center_specialist_brains/i);
  assert.match(sql, /specialist_id/i);
  assert.match(sql, /control_plane/i);
  assert.match(sql, /supported_company_ids/i);
  assert.match(sql, /supported_project_ids/i);
  assert.match(sql, /protected_action_boundaries/i);
  assert.match(sql, /model_assignments/i);
  assert.match(sql, /evaluation_evidence_ids/i);
  assert.match(sql, /fallback_specialist_ids/i);
  assert.match(sql, /learning_eligibility/i);
  assert.match(sql, /rollback_evidence_id/i);
  assert.match(sql, /command_center_specialist_brain_versions/i);
  assert.match(sql, /command_center_register_specialist_model/i);
  assert.match(sql, /command_center_set_specialist_lifecycle/i);
  assert.doesNotMatch(sql, /create table if not exists public\.command_center_specialist_models/i);
  assert.match(sql, /revoke all on table public\.command_center_specialist_brain_versions from public,anon,authenticated/i);
});
