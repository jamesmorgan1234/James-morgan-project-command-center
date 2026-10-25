import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { HomeModuleRegistry } from "../dist/ui/home.js";
import { buildHomeModuleGrid, createCoreHomeModuleRegistry } from "../dist/runtime/home-modules.js";
import { createFixtureRuntimeSnapshot } from "../dist/runtime/snapshot.js";
import { known } from "../dist/data/canonical.js";

const ROOT = new URL("../", import.meta.url);
async function source(path) { return readFile(new URL(path, ROOT), "utf8"); }

function context() {
  const snapshot = createFixtureRuntimeSnapshot({
    projects: Object.freeze([]),
    surfaces: Object.freeze([{ key: "needs-me", label: "Needs Me", availability: "available", summary: known("Nothing currently requires owner action."), evidence: Object.freeze([]) }])
  });
  return { snapshot, activeCount: 0, nextCount: 0 };
}

test("P4.4 core Home catalog is registry-driven and preserves approved one-column hierarchy", () => {
  const grid = buildHomeModuleGrid(context());
  assert.equal(grid.columns, 1);
  assert.equal(grid.equalCardHeight, true);
  assert.deepEqual(grid.modules.map((module) => module.key), ["projects", "active_live", "next_up", "owner_attention"]);
  assert.equal(grid.modules.find((module) => module.key === "projects")?.verifiedCount, 0);
  assert.equal(grid.modules.find((module) => module.key === "owner_attention")?.supportingText, "Nothing currently requires owner action.");
});

test("P4.4 a future Home tile registers without changing registry or renderer internals", () => {
  const extension = {
    key: "future-capability",
    title: "Future Capability",
    route: "/future-capability",
    resolve: () => ({ verifiedCount: 3, supportingText: "Three verified items." })
  };
  const grid = buildHomeModuleGrid(context(), [extension]);
  assert.deepEqual(grid.modules.map((module) => module.key), ["projects", "active_live", "next_up", "owner_attention", "future-capability"]);
  assert.equal(grid.modules.at(-1)?.verifiedCount, 3);
});

test("P4.4 registry rejects duplicate or invalid registrations and supports removal", () => {
  const registry = new HomeModuleRegistry();
  const registration = { key: "one", title: "One", route: "/one", resolve: () => ({ supportingText: "One" }) };
  registry.register(registration);
  assert.throws(() => registry.register(registration), /Duplicate Home module registration/);
  assert.throws(() => registry.register({ key: "bad", title: "Bad", route: "relative", resolve: () => ({ supportingText: "Bad" }) }), /Invalid Home module/);
  assert.equal(registry.remove("one")?.key, "one");
  assert.equal(registry.list().length, 0);
});

test("P4.4 browser Home rendering is data-driven over the grid and contains no module-key rendering switch", async () => {
  const browser = await source("src/runtime/browser.ts");
  const start = browser.indexOf("function renderHome(");
  const end = browser.indexOf("function renderCanonicalSurface", start);
  const body = browser.slice(start, end);
  assert.match(body, /for \(const module of grid\.modules\)/);
  assert.doesNotMatch(body, /switch\s*\(module\.key\)/);
  assert.doesNotMatch(body, /if\s*\(module\.key\s*===/);
});

test("P4.4 disconnected Home registry keeps counts unavailable instead of inventing zero", () => {
  const base = context().snapshot;
  const disconnected = Object.freeze({
    ...base,
    connection: Object.freeze({ ...base.connection, state: "disconnected", message: "Disconnected" })
  });
  const grid = createCoreHomeModuleRegistry().build({ snapshot: disconnected, activeCount: 0, nextCount: 0 });
  assert.equal(grid.modules.find((module) => module.key === "projects")?.verifiedCount, undefined);
  assert.match(grid.modules.find((module) => module.key === "projects")?.supportingText ?? "", /unavailable/);
});
