import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ProjectWorkspaceStore } from "../dist/brain/workspace.js";

const migrationUrl = new URL("../../supabase/migrations/20261024145000_category6_project_conversation_workspace.sql", import.meta.url);

test("P6.8 durable project workspace is owner/project scoped, versioned, and resumable", async () => {
  const sql = await readFile(migrationUrl, "utf8");
  assert.match(sql, /command_center_brain_project_workspaces/);
  assert.match(sql, /command_center_brain_project_workspace_versions/);
  assert.match(sql, /Workspace version conflict/);
  assert.match(sql, /Workspace conversation scope mismatch/);
  assert.match(sql, /Workspace turn is outside owner\/project conversation scope/);
  assert.match(sql, /'resumable',true/);
  assert.match(sql, /for select to authenticated/);
  assert.doesNotMatch(sql, /grant\s+(insert|update|delete)\s+on\s+table\s+public\.command_center_brain_project_workspaces\s+to\s+authenticated/i);
});

test("P6.8 workspace resumes exact verified state across versions and rejects stale writes", () => {
  const store = new ProjectWorkspaceStore();
  store.save({ projectId: "cc", version: 1, specVersion: 5, turnIds: ["t1"], decisionRefs: ["d1"], blockerRefs: ["b1"], evidenceRefs: ["e1"], verifiedResultRefs: [], updatedAt: "2026-10-24T16:00:00Z" });
  store.save({ projectId: "cc", version: 2, specVersion: 5, turnIds: ["t1", "t2"], decisionRefs: ["d1", "d2"], executionRunId: "run-1", blockerRefs: [], evidenceRefs: ["e1", "e2"], verifiedResultRefs: ["vr1"], updatedAt: "2026-10-24T16:01:00Z" }, 1);
  assert.equal(store.get("cc").version, 2);
  assert.deepEqual(store.get("cc").verifiedResultRefs, ["vr1"]);
  assert.throws(() => store.save({ projectId: "cc", version: 3, specVersion: 5, turnIds: [], decisionRefs: [], blockerRefs: [], evidenceRefs: [], verifiedResultRefs: [], updatedAt: "2026-10-24T16:02:00Z" }, 1), /version conflict/);
});
