import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createAgencyContextPacket, assertContextFresh } from "../dist/agency/context.js";

const migrationUrl = new URL("../../supabase/migrations/20261024160000_category7_context_packets.sql", import.meta.url);

test("P7.7 durable context packet freezes full execution envelope and blocks stale/wrong-scope commit", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  for (const field of ["agent_generation","goal_ref","spec_version","owner_instruction_version","authorization_scope","checkpoint_id","dependency_output_refs","provider_evidence_refs","artifact_hashes","stale_after"]) assert.match(sql, new RegExp(field));
  assert.match(sql, /Wrong-project\/task context packet cannot commit/);
  assert.match(sql, /Stale Project Agent generation context cannot commit/);
  assert.match(sql, /Stale context packet requires revalidation/);
  assert.match(sql, /Context source exceeds sensitivity envelope/);
  assert.match(sql, /'immutable',true/);
});

test("P7.7 runtime packet rejects sensitivity overflow and stale use", () => {
  assert.throws(() => createAgencyContextPacket({ id: "p", runId: "r", taskId: "t", projectId: "proj", builtAt: "2026-10-24T16:00:00Z", staleAfter: "2026-10-24T16:10:00Z", maxSensitivityRank: 2, sourceRefs: [{ id: "s", version: 1, contentHash: "a".repeat(64), sensitivityRank: 3 }], artifactRefs: [], evidenceRefs: ["e"] }), /sensitivity envelope/);
  const packet = createAgencyContextPacket({ id: "p", runId: "r", taskId: "t", projectId: "proj", builtAt: "2026-10-24T16:00:00Z", staleAfter: "2026-10-24T16:10:00Z", maxSensitivityRank: 2, sourceRefs: [{ id: "s", version: 1, contentHash: "a".repeat(64), sensitivityRank: 2 }], artifactRefs: [], evidenceRefs: ["e"] });
  assert.doesNotThrow(() => assertContextFresh(packet, "2026-10-24T16:09:59Z"));
  assert.throws(() => assertContextFresh(packet, "2026-10-24T16:10:00Z"), /stale/);
});
