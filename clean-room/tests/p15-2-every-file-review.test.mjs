import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(process.cwd(), "..");
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: repoRoot }).toString("utf8").split("\0").filter(Boolean);
const review = spawnSync(process.execPath, ["scripts/p15-2-semantic-every-file-review.mjs"], { cwd: process.cwd(), encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

test("P15.2 every-file review accounts for every tracked file and reports no defect", () => {
  assert.equal(review.status, 0, `every-file review reported defects:\n${review.stderr || review.stdout}`);
  const summary = JSON.parse(review.stdout.trim().split("\n").filter(Boolean).at(-1));
  assert.equal(summary.phaseId, "P15.2");
  assert.equal(summary.reviewScope, "all-git-tracked-files");
  assert.equal(summary.trackedFileCount, tracked.length);
  // The evidence verdict cannot review or digest itself, so it is excluded from
  // its own inventory; every other tracked file must be accounted for.
  assert.equal(summary.reviewedFileCount, tracked.length - 1);
  assert.equal(summary.evidenceFileExcluded, true);
  assert.equal(summary.defectCount, 0);
  assert.ok(summary.directoryCount > 0);
  for (const [role, count] of Object.entries(summary.filesByRole)) {
    assert.ok(Object.hasOwn(summary.roleLegend, role), `unknown role ${role}`);
    assert.ok(count > 0, `role ${role} has no files`);
  }
  assert.equal(Object.values(summary.filesByRole).reduce((total, count) => total + count, 0), tracked.length - 1);
});

test("P15.2 committed evidence reviews exactly the tracked inventory", () => {
  const evidencePath = "clean-room/evidence/P15_2_SEMANTIC_EVERY_FILE_REVIEW.json";
  if (!existsSync(resolve(repoRoot, evidencePath))) return;
  const evidence = JSON.parse(readFileSync(resolve(repoRoot, evidencePath), "utf8"));
  const reviewed = tracked.filter((path) => path !== evidencePath);
  assert.equal(evidence.status, "VERIFIED_COMPLETE");
  assert.equal(evidence.phaseId, "P15.2");
  assert.equal(evidence.reviewedFileCount, reviewed.length);
  assert.equal(evidence.reviews.length, reviewed.length);
  assert.equal(evidence.findings.filter((finding) => finding.severity === "defect").length, 0);
  for (const [index, path] of reviewed.entries()) assert.equal(evidence.reviews[index].path, path);
});

test("P15.2 review detects the defect classes it claims to detect", () => {
  const source = readFileSync("scripts/p15-2-semantic-every-file-review.mjs", "utf8");
  for (const code of [
    "unresolved_import",
    "invalid_json",
    "committed_secret",
    "forbidden_generated_payload",
    "forbidden_build_artifact",
    "orphan_test_outside_mandatory_glob",
    "legacy_runtime_dependency",
    "band_aid_runtime_patch",
    "workflow_action_not_sha_pinned",
    "workflow_missing_trigger",
    "workflow_missing_jobs",
    "required_authority_missing",
    "unclassified_role",
    "tracked_file_missing",
    "competing_canonical_authority"
  ]) {
    assert.ok(source.includes(`"${code}"`), `review does not implement ${code}`);
  }
  assert.match(source, /for \(const \[path, authority\] of Object\.entries\(authorities\)\)/);
});
