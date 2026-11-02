import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const source = await readFile(new URL("../scripts/build-browser.mjs", import.meta.url), "utf8");

function releaseExpression(text) {
  const match = text.match(/const releaseId = \(([^;]+)\)\.trim\(\);/);
  assert.ok(match, "build-browser must define a trim-normalized releaseId expression");
  return match[1];
}

function resolveReleaseId(env) {
  const expression = releaseExpression(source);
  return Function("process", `return (${expression});`)({ env }).trim();
}

test("Vercel Git commit SHA is the release-id fallback before local-unverified", () => {
  const sha = "0123456789abcdef0123456789abcdef01234567";
  assert.equal(resolveReleaseId({ VERCEL_GIT_COMMIT_SHA: sha }), sha);
});

test("explicit Command Center and GitHub release identities keep precedence", () => {
  assert.equal(resolveReleaseId({
    COMMAND_CENTER_RELEASE_ID: "explicit-release",
    GITHUB_SHA: "github-release",
    VERCEL_GIT_COMMIT_SHA: "vercel-release"
  }), "explicit-release");
  assert.equal(resolveReleaseId({
    GITHUB_SHA: "github-release",
    VERCEL_GIT_COMMIT_SHA: "vercel-release"
  }), "github-release");
});

test("local-unverified remains only the no-CI-identity fallback", () => {
  assert.equal(resolveReleaseId({}), "local-unverified");
});
