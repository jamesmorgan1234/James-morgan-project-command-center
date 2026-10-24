import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createImprovementProposal } from "../dist/brain/improvements.js";

const migrationUrl = new URL("../../supabase/migrations/20261024151500_category6_improvements_center.sql", import.meta.url);

test("P6.13 durable Improvements Center never self-installs or silently mutates roadmap", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_brain_improvement_proposals/);
  assert.match(sql, /installs_automatically boolean not null default false check \(installs_automatically=false\)/);
  assert.match(sql, /command_center_brain_improvement_scope_requests/);
  assert.match(sql, /roadmap_mutated boolean not null default false check \(roadmap_mutated=false\)/);
  assert.match(sql, /Only an explicitly accepted improvement can become a scope request/);
  assert.match(sql, /owner_decision_ref/);
  assert.doesNotMatch(sql, /command_center_roadmap_(create|update|advance)/i);
});

test("P6.13 runtime improvement proposals require evidence/confidence and never install automatically", () => {
  const proposal = createImprovementProposal({ id: "imp-1", area: "security", title: "Add replay corpus", evidenceRefs: ["audit:1"], confidence: 0.9 });
  assert.equal(proposal.installsAutomatically, false);
  assert.throws(() => createImprovementProposal({ id: "imp-2", area: "quality", title: "No evidence", evidenceRefs: [], confidence: 0.9 }), /evidence/);
  assert.throws(() => createImprovementProposal({ id: "imp-3", area: "quality", title: "Bad confidence", evidenceRefs: ["e"], confidence: 2 }), /0\.\.1/);
});
