import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);
const scriptSource = fileURLToPath(new URL("scripts/category15-release-artifact-audit.mjs", ROOT));
const distSource = fileURLToPath(new URL("dist-web/", ROOT));

function runAudit(directory) {
  const result = spawnSync(process.execPath, [join(directory, "scripts", "category15-release-artifact-audit.mjs")], { cwd: directory, encoding: "utf8" });
  let report = null;
  try { report = JSON.parse(result.stdout); } catch {}
  return { result, report };
}

async function withArtifactFixture(callback) {
  const directory = await mkdtemp(join(tmpdir(), "cc-artifact-audit-"));
  try {
    await mkdir(join(directory, "scripts"), { recursive: true });
    await cp(scriptSource, join(directory, "scripts", "category15-release-artifact-audit.mjs"));
    await cp(distSource, join(directory, "dist-web"), { recursive: true });
    return await callback(directory);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("Category 15 release artifact audit preserves clean-room runtime ownership and protected-asset fail-closed behavior", async () => {
  const source = await readFile(scriptSource, "utf8");
  assert.match(source, /expected exactly one release HTML entrypoint/);
  assert.match(source, /expected exactly one release service worker/);
  assert.match(source, /legacy runtime payload included/);
  assert.match(source, /manifest must not substitute icons while protected icon is unresolved/);
  assert.match(source, /assetManifestHash does not match artifact bytes/);
  assert.match(source, /buildHash does not match releaseId\/schema\/artifact manifest/);
  assert.match(source, /releaseCandidateReady/);
  assert.match(source, /REQUIRE_PROTECTED_ASSETS/);
});

test("Category 15 artifact identity is recomputed from actual release bytes and rejects well-formed digest substitution", async () => {
  await withArtifactFixture(async (directory) => {
    const out = join(directory, "dist-web");
    const browserPath = join(out, "app", "runtime", "browser.js");
    const releasePath = join(out, "release.json");
    const browserOriginal = await readFile(browserPath);
    const releaseOriginalText = await readFile(releasePath, "utf8");
    const releaseOriginal = JSON.parse(releaseOriginalText);

    const baseline = runAudit(directory);
    assert.equal(baseline.result.status, 0, baseline.result.stderr || baseline.result.stdout);
    assert.equal(baseline.report?.artifactStructurallyValid, true);

    await writeFile(browserPath, Buffer.concat([browserOriginal, Buffer.from("\n// adversarial artifact mutation\n")]));
    const changedAsset = runAudit(directory);
    assert.equal(changedAsset.result.status, 1);
    assert.ok(changedAsset.report?.structuralErrors.includes("release identity assetManifestHash does not match artifact bytes"));
    assert.ok(changedAsset.report?.structuralErrors.includes("release identity buildHash does not match releaseId/schema/artifact manifest"));
    await writeFile(browserPath, browserOriginal);

    await writeFile(releasePath, JSON.stringify({ ...releaseOriginal, assetManifestHash: "0".repeat(64) }, null, 2) + "\n");
    const manifestDigestSubstitution = runAudit(directory);
    assert.equal(manifestDigestSubstitution.result.status, 1);
    assert.ok(manifestDigestSubstitution.report?.structuralErrors.includes("release identity assetManifestHash does not match artifact bytes"));

    await writeFile(releasePath, JSON.stringify({ ...releaseOriginal, buildHash: "0".repeat(64) }, null, 2) + "\n");
    const buildDigestSubstitution = runAudit(directory);
    assert.equal(buildDigestSubstitution.result.status, 1);
    assert.ok(buildDigestSubstitution.report?.structuralErrors.includes("release identity buildHash does not match releaseId/schema/artifact manifest"));

    const { buildHash, ...missingBuildHash } = releaseOriginal;
    await writeFile(releasePath, JSON.stringify(missingBuildHash, null, 2) + "\n");
    const missingIdentity = runAudit(directory);
    assert.equal(missingIdentity.result.status, 1);
    assert.ok(missingIdentity.report?.structuralErrors.includes("release identity buildHash is not SHA-256"));

    await writeFile(releasePath, releaseOriginalText);
  });
});
