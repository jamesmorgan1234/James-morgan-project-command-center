import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const repositoryAuditSource = readFileSync("scripts/category15-repository-audit.mjs", "utf8");
const phaseGateSource = readFileSync("scripts/category15-phase-gate-audit.mjs", "utf8");
const semanticEvidencePath = "evidence/P15_2_SEMANTIC_EVERY_FILE_REVIEW.json";

test("Task 3 invariant: automated every-file scanning cannot itself close P15.2", () => {
  assert.match(repositoryAuditSource, /const automatedEveryFileScanComplete\s*=\s*reviews\.length\s*===\s*tracked\.length\s*&&\s*violations\.length\s*===\s*0/);
  assert.match(repositoryAuditSource, /let semanticEveryFileReviewComplete\s*=\s*false/);
  assert.match(repositoryAuditSource, /semanticEvidencePath\s*=\s*"clean-room\/evidence\/P15_2_SEMANTIC_EVERY_FILE_REVIEW\.json"/);
  assert.match(repositoryAuditSource, /semanticEvidence\.status\s*===\s*"VERIFIED_COMPLETE"/);
  assert.match(repositoryAuditSource, /semanticEvidence\.gitSha\s*===\s*headSha/);
  assert.match(repositoryAuditSource, /semanticEvidence\.reviewedFileCount\s*===\s*tracked\.length/);
  assert.match(repositoryAuditSource, /Array\.isArray\(semanticEvidence\.evidence\)\s*&&\s*semanticEvidence\.evidence\.length\s*>\s*0/);
});

test("Task 3 invariant: P15.2 is PARTIAL unless exact-head semantic every-file evidence is complete", () => {
  assert.match(
    phaseGateSource,
    /semanticReviewVerified\s*=\s*repoAudit\.headSha\s*===\s*headSha\s*&&\s*repoAudit\.semanticEveryFileReviewComplete\s*===\s*true/
  );
  assert.match(
    phaseGateSource,
    /phases\["P15\.2"\]\s*=\s*semanticReviewVerified[\s\S]*?status:\s*"VERIFIED_COMPLETE"[\s\S]*?:\s*\{\s*status:\s*"PARTIAL"/
  );
});

test("Task 3 current state: P15.2 stays PARTIAL while the semantic review evidence is absent", () => {
  if (existsSync(semanticEvidencePath)) return;

  const audit = spawnSync(process.execPath, ["scripts/category15-repository-audit.mjs", "--write"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
  assert.equal(audit.status, 0, `repository audit failed unexpectedly: ${audit.stderr || audit.stdout}`);
  const auditSummary = JSON.parse(audit.stdout.trim().split("\n").filter(Boolean).at(-1));
  assert.equal(auditSummary.semanticEveryFileReviewComplete, false);

  const gate = spawnSync(process.execPath, ["scripts/category15-phase-gate-audit.mjs"], {
    cwd: process.cwd(),
    encoding: "utf8"
  });
  assert.equal(gate.status, 0, `phase status audit failed unexpectedly: ${gate.stderr || gate.stdout}`);
  const gateSummary = JSON.parse(gate.stdout.trim().split("\n").filter(Boolean).at(-1));
  assert.equal(gateSummary.p15_2, "PARTIAL");
});
