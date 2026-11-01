import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { P15_2_EVIDENCE_PATH, computeInventoryDigest, validateSemanticEveryFileReview } from "../scripts/p15-2-repository-evidence.mjs";

const repositoryAuditSource = readFileSync("scripts/category15-repository-audit.mjs", "utf8");
const phaseGateSource = readFileSync("scripts/category15-phase-gate-audit.mjs", "utf8");
const semanticEvidencePath = P15_2_EVIDENCE_PATH;
const repoRoot = resolve(process.cwd(), "..");
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim();

function fixtureRepository(files) {
  const root = mkdtempSync(join(tmpdir(), "p15-2-fixture-"));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(resolve(root, path, ".."), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  const git = (...args) => execFileSync("git", args, { cwd: root });
  git("init", "-q");
  git("-c", "user.name=f", "-c", "user.email=f@example.com", "add", "-A");
  git("-c", "user.name=f", "-c", "user.email=f@example.com", "commit", "-q", "-m", "fixture");
  const sha = git("rev-parse", "HEAD").toString("utf8").trim();
  const reviewed = git("ls-files", "-z").toString("utf8").split("\0").filter(Boolean).sort();
  return { root, sha, reviewed };
}

test("Task 3 invariant: automated every-file scanning cannot itself close P15.2", () => {
  assert.match(repositoryAuditSource, /const automatedEveryFileScanComplete\s*=\s*reviews\.length\s*===\s*tracked\.length\s*&&\s*violations\.length\s*===\s*0/);
  assert.match(repositoryAuditSource, /let semanticEveryFileReviewComplete\s*=\s*false/);
  assert.match(repositoryAuditSource, /semanticEvidencePath\s*=\s*P15_2_EVIDENCE_PATH/);
  assert.match(repositoryAuditSource, /validateSemanticEveryFileReview\(semanticEvidence,\s*\{\s*repoRoot,\s*headSha,\s*evidencePath:\s*semanticEvidencePath\s*\}\)/);
});

test("Task 3 invariant: P15.2 is PARTIAL unless exact reviewed inventory evidence is complete", () => {
  assert.match(
    phaseGateSource,
    /semanticReviewVerified\s*=\s*repoAudit\.headSha\s*===\s*headSha\s*&&\s*repoAudit\.semanticEveryFileReviewComplete\s*===\s*true/
  );
  assert.match(
    phaseGateSource,
    /phases\["P15\.2"\]\s*=\s*semanticReviewVerified[\s\S]*?status:\s*"VERIFIED_COMPLETE"[\s\S]*?:[\s\S]{0,80}status:\s*"PARTIAL"/
  );
});

test("P15.2 evidence binds the exact reviewed inventory instead of a self-referential commit hash", () => {
  const fixture = fixtureRepository({
    "clean-room/src/active.ts": "export const active = true;\n",
    "clean-room/evidence/other.json": "{}\n"
  });
  try {
    const evidence = {
      schemaVersion: 1,
      phaseId: "P15.2",
      status: "VERIFIED_COMPLETE",
      gitSha: fixture.sha,
      reviewScope: "all-git-tracked-files",
      reviewedFileCount: fixture.reviewed.length,
      inventoryDigest: computeInventoryDigest(fixture.root, fixture.reviewed),
      evidence: ["clean-room/src/active.ts"],
      findings: [],
      reviews: fixture.reviewed.map((path) => ({ path }))
    };
    assert.equal(validateSemanticEveryFileReview(evidence, { repoRoot: fixture.root, headSha: fixture.sha }).valid, true);

    const missingRecord = structuredClone(evidence);
    missingRecord.reviews = missingRecord.reviews.slice(0, 1);
    missingRecord.reviewedFileCount = 1;
    assert.equal(validateSemanticEveryFileReview(missingRecord, { repoRoot: fixture.root, headSha: fixture.sha }).valid, false);

    const wrongDigest = structuredClone(evidence);
    wrongDigest.inventoryDigest = "f".repeat(64);
    assert.equal(validateSemanticEveryFileReview(wrongDigest, { repoRoot: fixture.root, headSha: fixture.sha }).valid, false);

    const withDefect = structuredClone(evidence);
    withDefect.findings = [{ severity: "defect", code: "unresolved_import" }];
    assert.equal(validateSemanticEveryFileReview(withDefect, { repoRoot: fixture.root, headSha: fixture.sha }).valid, false);

    const unknownCommit = structuredClone(evidence);
    unknownCommit.gitSha = "a".repeat(40);
    assert.equal(validateSemanticEveryFileReview(unknownCommit, { repoRoot: fixture.root, headSha: fixture.sha }).valid, false);

    const noReferences = structuredClone(evidence);
    noReferences.evidence = [];
    assert.equal(validateSemanticEveryFileReview(noReferences, { repoRoot: fixture.root, headSha: fixture.sha }).valid, false);

    // any later edit invalidates the reviewed inventory
    writeFileSync(join(fixture.root, "clean-room/src/active.ts"), "export const active = false;\n");
    assert.equal(validateSemanticEveryFileReview(evidence, { repoRoot: fixture.root, headSha: fixture.sha }).valid, false);
  } finally {
    rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("P15.2 live state is coupled to verified evidence instead of a hard-coded status", () => {
  const gate = spawnSync(process.execPath, ["scripts/category15-phase-gate-audit.mjs"], { cwd: process.cwd(), encoding: "utf8" });
  assert.equal(gate.status, 0, `phase status audit failed unexpectedly: ${gate.stderr || gate.stdout}`);
  const summary = JSON.parse(gate.stdout.trim().split("\n").filter(Boolean).at(-1));
  if (!existsSync(resolve(repoRoot, semanticEvidencePath))) {
    assert.equal(summary.p15_2, "PARTIAL");
    return;
  }
  const evidence = JSON.parse(readFileSync(resolve(repoRoot, semanticEvidencePath), "utf8"));
  const verification = validateSemanticEveryFileReview(evidence, { repoRoot, headSha });
  assert.equal(verification.valid, true, `committed P15.2 evidence must verify: ${JSON.stringify(verification.errors)}`);
  assert.equal(summary.p15_2, "VERIFIED_COMPLETE");
});
