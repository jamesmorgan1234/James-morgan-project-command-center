import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const EVIDENCE = "evidence/P15_13_RELEASE_ARTIFACT_AUDIT.json";
const APPROVED_ICON = "public/assets/command-center-approved-icon-512.png";
const FROZEN_ICON_SHA256 = "fa48e34b6240ca37ad74492dec150cfebaed60aed404707f79b68b9b3157b7aa";
const evidence = JSON.parse(readFileSync(EVIDENCE, "utf8"));

test("P15.13 evidence records a fully verified exact-head release artifact", () => {
  assert.equal(evidence.schemaVersion, "cc-p15-13-release-artifact-audit-v1");
  assert.equal(evidence.verified, true);
  assert.equal(evidence.failedCheckCount, 0);
  assert.ok(evidence.checkCount >= 10, `expected at least 10 checks, observed ${evidence.checkCount}`);
  assert.match(evidence.headSha, /^[a-f0-9]{40}$/);
  assert.deepEqual(evidence.checks.filter((entry) => entry.passed !== true), []);
});

test("P15.13 evidence binds the artifact identity to the audited commit and immutable hashes", () => {
  const identity = evidence.releaseIdentity;
  assert.equal(identity.releaseId, evidence.headSha, "release id must be the audited commit, never local-unverified");
  assert.match(identity.buildHash, /^[a-f0-9]{64}$/);
  assert.match(identity.assetManifestHash, /^[a-f0-9]{64}$/);
  assert.equal(identity.schemaCompatibility, "cc-runtime-snapshot-v1");
  assert.notEqual(identity.releaseId, "local-unverified");
});

test("P15.13 protects the approved Command Center icon against substitution", () => {
  const auditSource = readFileSync("scripts/category15-release-artifact-audit.mjs", "utf8");
  assert.ok(auditSource.includes(FROZEN_ICON_SHA256), "artifact audit must pin the approved icon hash");
  const actual = createHash("sha256").update(readFileSync(APPROVED_ICON)).digest("hex");
  assert.equal(actual, FROZEN_ICON_SHA256, "approved icon bytes must match the frozen protected hash");
  assert.equal(evidence.protectedIcon.expectedSha256, FROZEN_ICON_SHA256);
  assert.equal(evidence.protectedIcon.state, "verified");
});

test("P15.13 release identity is injected from the build, not hardcoded in source", () => {
  const swSource = readFileSync("public/sw.js", "utf8");
  const entrySource = readFileSync("public/index.html", "utf8");
  assert.ok(swSource.includes("__COMMAND_CENTER_RELEASE_ID__"), "service worker keeps a build-time release placeholder");
  assert.ok(entrySource.includes("__COMMAND_CENTER_RELEASE_ID__"), "document head keeps a build-time release placeholder");
  const buildSource = readFileSync("scripts/build-browser.mjs", "utf8");
  assert.ok(buildSource.includes("COMMAND_CENTER_RELEASE_ID"), "build must accept an explicit immutable release identity");
  assert.ok(buildSource.includes("APPROVED_ICON_SHA256"), "build must refuse a substituted protected icon");
});

test("P15.13 ships a bounded artifact with no legacy runtime payload", () => {
  assert.ok(evidence.artifactFileCount > 0 && evidence.artifactFileCount < 5000, `unexpected artifact size ${evidence.artifactFileCount}`);
  const auditSource = readFileSync("scripts/category15-release-artifact-audit.mjs", "utf8");
  for (const forbidden of ["rebuild-vnext/", "legacy/", "archive/", "app-integrity-repair.js"]) {
    assert.ok(auditSource.includes(forbidden), `legacy payload guard must cover ${forbidden}`);
  }
});
