import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  RoadmapDag,
  CheckpointStore,
  computeProgress,
  advanceFoundry,
  compileUltimateSpec,
  validatePrototypeFeedback,
  validateRecoveryPlan
} from "../dist/projects/index.js";

const ROOT = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, ROOT), "utf8");

test("P5.3 roadmap persistence enforces versioned dependencies, gates and verified-state recheck", async () => {
  const base = await read("../supabase/migrations/20261024132000_category5_roadmap_engine.sql");
  const fix = await read("../supabase/migrations/20261024132100_category5_roadmap_verification_gate_fix.sql");
  for (const marker of ["command_center_project_roadmaps", "command_center_project_roadmap_gates", "command_center_project_work_units", "dependency_ids", "gate_ids", "acceptance_criteria", "Roadmap dependency cycle detected"]) assert.match(base, new RegExp(marker));
  assert.match(fix, /p_new_status in \('ready','working','verified'\)/);
  assert.match(fix, /Work unit cannot advance past unmet dependencies or gates/);
  assert.match(fix, /p_new_status='verified' and w\.status not in \('ready','working'\)/);
});

test("P5.4 durable checkpoint requires exact roadmap/version/evidence/resume hash", async () => {
  const sql = await read("../supabase/migrations/20261024133000_category5_project_checkpoints.sql");
  for (const marker of ["roadmap_version", "exact_next_work_unit_id", "blocker", "required_environment", "owner_action", "verification_method", "evidence_refs", "resume_state_hash"]) assert.match(sql, new RegExp(marker));
  assert.match(sql, /Exact next work unit not found in roadmap version/);
  assert.match(sql, /Resume-state hash must be SHA-256 hex/);
  assert.doesNotMatch(sql, /grant (insert|update|delete|all) on table public\.command_center_project_checkpoints to authenticated/i);
});

test("P5.5 persistent progress stays N/A until denominator is trusted", async () => {
  const sql = await read("../supabase/migrations/20261024134000_category5_truthful_project_progress.sql");
  assert.match(sql, /denominator_trusted/);
  assert.match(sql, /'kind','na'/);
  assert.match(sql, /roadmap_denominator_untrusted/);
  assert.match(sql, /v_verified::numeric\/v_applicable::numeric/);
  assert.deepEqual(computeProgress({ denominatorTrusted: false, applicable: 10, verified: 10 }), { kind: "na", label: "N/A", reason: "untrusted_denominator" });
});

test("P5.9 detail registry is project-type/capability extensible without core surgery", async () => {
  const sql = await read("../supabase/migrations/20261024135000_category5_project_detail_registry.sql");
  assert.match(sql, /command_center_project_detail_sections/);
  assert.match(sql, /command_center_project_type_detail_sections/);
  assert.match(sql, /capability_key/);
  assert.match(sql, /command_center_project_bind_detail_section/);
});

test("P5.10 duplicate discovery records owner disposition without canonical mutation", async () => {
  const sql = await read("../supabase/migrations/20261024136000_category5_project_discovery.sql");
  assert.match(sql, /command_center_project_candidates/);
  assert.match(sql, /command_center_project_duplicate_signals/);
  assert.match(sql, /command_center_project_candidate_decisions/);
  assert.match(sql, /'merge','ignore','keep_separate','add','park','reject','research'/);
  assert.match(sql, /'canonical_mutation',false/);
  assert.doesNotMatch(sql, /update public\.command_center_project_profiles set/i);
});

test("P5.11 durable Foundry cannot skip stage or Agency owner authorization", async () => {
  const sql = await read("../supabase/migrations/20261024137000_category5_foundry_lifecycle.sql");
  assert.match(sql, /command_center_project_foundry_runs/);
  assert.match(sql, /command_center_project_foundry_transitions/);
  assert.match(sql, /Invalid Foundry transition/);
  assert.match(sql, /project-auth:agent-access/);
  assert.match(sql, /Project Agent access is not owner-authorized/);

  let state = { projectId: "p1", stage: "idea", specVersion: 1, requirementRefs: ["req:1"], decisionRefs: ["decision:1"], artifactRefs: [] };
  assert.throws(() => advanceFoundry(state, "architecture", "evidence:skip"));
  state = advanceFoundry(state, "research", "evidence:research");
  state = advanceFoundry(state, "ultimate_spec", "evidence:spec");
  state = advanceFoundry(state, "architecture", "evidence:architecture");
  state = advanceFoundry(state, "roadmap", "evidence:roadmap");
  state = advanceFoundry(state, "owner_authorization", "evidence:owner-gate");
  assert.throws(() => advanceFoundry(state, "agency_execution", "evidence:agency"));
  state = advanceFoundry(state, "agency_execution", "evidence:agency", "owner:authorize-agency");
  state = advanceFoundry(state, "evidence", "evidence:execution");
  state = advanceFoundry(state, "acceptance", "evidence:acceptance");
  assert.equal(state.stage, "acceptance");
  assert.equal(state.ownerAuthorizationRef, "owner:authorize-agency");
  assert.equal(state.requirementRefs[0], "req:1");
  assert.equal(state.decisionRefs[0], "decision:1");
});

test("P5.12 Ultimate Spec requires a populated domain playbook and closes every applicable dimension", async () => {
  const schema = await read("../supabase/migrations/20261024138000_category5_ultimate_spec.sql");
  const authoring = await read("../supabase/migrations/20261024138100_category5_spec_authoring_rpc.sql");
  for (const marker of ["command_center_spec_dimension_requirements", "matrix_group", "future_dormant", "assumption_refs", "unknown_refs", "command_center_project_compile_spec"]) assert.match(schema, new RegExp(marker));
  assert.match(schema, /playbook:no_required_dimensions/);
  assert.match(authoring, /command_center_project_register_spec_requirement/);
  assert.match(authoring, /command_center_project_start_spec/);
  assert.match(authoring, /command_center_project_set_spec_dimension/);
  assert.match(authoring, /Applicable unknown dimension requires an explicit unknown reference/);

  const compiled = compileUltimateSpec("p1", 1, [
    { key: "security", applicable: true, state: "addressed", evidenceRefs: ["test:security"] },
    { key: "monetization", applicable: true, state: "excluded_with_reason", evidenceRefs: [], exclusionReason: "No monetization by owner decision" },
    { key: "future_dormant", applicable: false, state: "unknown", evidenceRefs: [] }
  ]);
  assert.equal(compiled.complete, true);
  assert.deepEqual(compiled.unresolvedKeys, []);
});

test("P5.13 prototype feedback is lineage evidence and cannot silently override protected design", async () => {
  const sql = await read("../supabase/migrations/20261024139000_category5_prototype_lane.sql");
  assert.match(sql, /sensitivity='protected'/);
  assert.match(sql, /approval_state in \('approved','locked'\)/);
  assert.match(sql, /Protected visual design cannot be overridden by prototype feedback without owner authorization/);
  assert.match(sql, /'spec_mutation',false/);
  assert.match(sql, /'protected_asset_mutation',false/);

  const prototype = { id: "proto:1", projectId: "p1", specVersion: 1, requirementRefs: ["req:1"], protectedDesignAssetRefs: ["asset:locked"], artifactRef: "asset:prototype" };
  assert.throws(() => validatePrototypeFeedback(prototype, { id: "fb:1", prototypeId: "proto:1", requirementRefs: ["req:1"], decisionRef: "decision:1", changesProtectedDesign: true }));
  validatePrototypeFeedback(prototype, { id: "fb:2", prototypeId: "proto:1", requirementRefs: ["req:1"], decisionRef: "decision:2", changesProtectedDesign: true, protectedDesignOwnerAuthorizationRef: "owner:visual-change" });
});

test("P5.14 recovery preserves lineage/decisions/checkpoints and consumes fresh authorization for lifecycle changes", async () => {
  const recovery = await read("../supabase/migrations/20261024140000_category5_project_recovery.sql");
  const gate = await read("../supabase/migrations/20261024140100_category5_recovery_protected_gate.sql");
  assert.match(recovery, /Recovery plan must preserve lineage, decisions and evidence/);
  assert.match(recovery, /Archived project revival requires owner-governed reactivation/);
  assert.match(gate, /project\.recovery\.lifecycle/);
  assert.match(gate, /consume_action_authorization/);
  assert.match(gate, /drop function public\.command_center_project_apply_recovery_lifecycle\(text,text\[\],timestamptz\)/);
  assert.match(gate, /command_center_canonical_entity_versions/);
  assert.match(gate, /command_center_project_lineage_events/);

  assert.throws(() => validateRecoveryPlan({ projectId: "p1", mode: "archived_revival", lineageRefs: ["lineage:1"], assetRefs: [], decisionRefs: ["decision:1"], checkpointRefs: ["checkpoint:1"] }));
  validateRecoveryPlan({ projectId: "p1", mode: "archived_revival", lineageRefs: ["lineage:1"], assetRefs: [], decisionRefs: ["decision:1"], checkpointRefs: ["checkpoint:1"], ownerReactivationRef: "owner:reactivate" });
});

test("P5.3 in-memory DAG and P5.4 checkpoint models remain fail-closed", () => {
  const dag = new RoadmapDag();
  dag.add({ id: "w1", projectId: "p1", categoryId: "c1", phaseId: "p1", title: "First", dependencies: [], gates: [], acceptanceCriteria: ["done"], status: "verified", applicable: true, evidenceRefs: ["ev:1"] });
  dag.add({ id: "w2", projectId: "p1", categoryId: "c1", phaseId: "p2", title: "Second", dependencies: ["w1"], gates: ["gate:owner"], acceptanceCriteria: ["done"], status: "planned", applicable: true, evidenceRefs: [] });
  assert.equal(dag.readiness("w2", new Set()).ready, false);
  assert.equal(dag.readiness("w2", new Set(["gate:owner"])).ready, true);

  const checkpoints = new CheckpointStore();
  assert.throws(() => checkpoints.save({ id: "cp1", projectId: "p1", roadmapVersion: 1, createdAt: "2026-10-24T12:00:00Z", verificationMethod: "tests", evidenceRefs: [] }));
});
