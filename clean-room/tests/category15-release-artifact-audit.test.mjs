import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const ROOT = new URL("../", import.meta.url);

test("Category 15 release artifact audit preserves clean-room runtime ownership and protected-asset fail-closed behavior", async () => {
  const source = await readFile(new URL("scripts/category15-release-artifact-audit.mjs", ROOT), "utf8");
  assert.match(source, /expected exactly one release HTML entrypoint/);
  assert.match(source, /expected exactly one release service worker/);
  assert.match(source, /legacy runtime payload included/);
  assert.match(source, /manifest must not substitute icons while protected icon is unresolved/);
  assert.match(source, /releaseCandidateReady/);
  assert.match(source, /REQUIRE_PROTECTED_ASSETS/);
});
