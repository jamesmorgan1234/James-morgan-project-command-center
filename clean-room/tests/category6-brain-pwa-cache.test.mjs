import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const ROOT = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, ROOT), "utf8");
}

test("P6.7/P6.12 Brain conversation and voice runtime are explicit offline shell assets", async () => {
  const sw = await source("public/sw.js");
  assert.match(sw, /"\/app\/runtime\/brain-view\.js"/);
  assert.match(sw, /"\/app\/runtime\/browser-voice\.js"/);
  const core = sw.match(/const CORE = \[[^\]]+\]/s)?.[0] ?? "";
  assert.match(core, /brain-view\.js/);
  assert.match(core, /browser-voice\.js/);
  assert.match(sw, /await cache\.addAll\(CORE\)/);
  assert.match(sw, /records\.slice\(2\)/);
});
