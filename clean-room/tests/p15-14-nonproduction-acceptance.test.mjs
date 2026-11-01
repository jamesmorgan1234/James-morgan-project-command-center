import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const EVIDENCE = "evidence/P15_14_NONPRODUCTION_ACCEPTANCE.json";
const evidence = JSON.parse(readFileSync(EVIDENCE, "utf8"));

test("P15.14 evidence records a fully verified nonproduction acceptance run", () => {
  assert.equal(evidence.schemaVersion, "cc-p15-14-nonproduction-acceptance-v1");
  assert.equal(evidence.verified, true);
  assert.equal(evidence.failedCheckCount, 0);
  assert.ok(evidence.checkCount >= 8, `expected at least 8 checks, observed ${evidence.checkCount}`);
  assert.match(evidence.headSha, /^[a-f0-9]{40}$/);
  assert.deepEqual(evidence.checks.filter((entry) => entry.passed !== true), []);
});

test("P15.14 composed nonproduction contracts actually asserted behaviour", () => {
  assert.ok(evidence.contractResults.tests >= 5, `expected at least 5 contract subtests, observed ${evidence.contractResults.tests}`);
  assert.equal(evidence.contractResults.fail, 0);
  assert.equal(evidence.contractResults.pass, evidence.contractResults.tests);
  assert.deepEqual([...evidence.contractSuites].sort(), [
    "tests/category15-nonproduction-contract-acceptance.test.mjs",
    "tests/owner-auth-proxy-routing.test.mjs"
  ]);
});

test("P15.14 real browser lifecycle proof is required, not source inspection", () => {
  assert.equal(evidence.browser.lifecycleVerified, true);
  assert.equal(typeof evidence.browser.binary, "string");
  assert.ok(evidence.browser.binary.length > 0, "a concrete browser binary must be named");
  assert.match(evidence.lifecycleTranscriptTail, /P15\.14 PWA lifecycle verified/);
  assert.match(evidence.lifecycleTranscriptTail, /install/);
  assert.match(evidence.lifecycleTranscriptTail, /offline cache replay/);
  assert.match(evidence.lifecycleTranscriptTail, /waiting-worker activation/);
  assert.match(evidence.lifecycleTranscriptTail, /two-cache rollback retention/);
});

test("P15.14 lifecycle gate fails closed when no browser exists", () => {
  const lifecycleSource = readFileSync("scripts/category15-pwa-lifecycle.mjs", "utf8");
  assert.ok(
    /if \(!chrome\) throw new Error\("No Chrome\/Chromium binary is available/.test(lifecycleSource),
    "lifecycle must refuse to run without a real browser instead of reporting a synthetic pass"
  );
  assert.ok(!/chrome.*\|\|\s*true/.test(lifecycleSource), "no silent browser fallback may exist");
});

test("P15.14 service-worker lifecycle contract keeps update and rollback semantics", () => {
  const sw = readFileSync("public/sw.js", "utf8");
  assert.ok(sw.includes('const CACHE_PREFIX = "command-center-shell:"'), "versioned shell cache prefix is required");
  assert.ok(sw.includes("ACTIVATE_UPDATE"), "explicit update activation message is required");
  assert.ok(sw.includes("knownGoodReleaseId") && sw.includes("fallbackReleaseId"), "known-good rollback state is required");
  assert.ok(sw.includes("RELEASE_ID"), "service worker must be release-identified");
});
