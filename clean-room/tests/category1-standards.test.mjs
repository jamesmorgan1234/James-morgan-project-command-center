import test from "node:test";
import assert from "node:assert/strict";
import {
  assertSharedUtility,
  assertNaming,
  assertStableFolders,
  assertNoPrivateImport,
  assertNoCrossModuleSelector,
  assertScopedCss,
  assertTokenSource,
  assertInlineStyle,
  assertControlledStyleApi,
  assertTokenValue,
  assertNoDuplicates,
  assertNoDuplicateStatusColors,
  assertNoDuplicateLabels
} from "../dist/kernel/index.js";

test("P1.x shared utilities are limited to shared primitives", () => {
  assert.doesNotThrow(() => assertSharedUtility({ name: "clamp", kind: "primitive" }));
});

test("P1.x domain logic is not dumped into generic utilities", () => {
  assert.throws(() => assertSharedUtility({ name: "calculateRunway", kind: "domain" }), /Domain logic/);
});

test("P1.x naming conventions are consistent", () => {
  assert.doesNotThrow(() => assertNaming("loadProject", "camelCase"));
  assert.throws(() => assertNaming("load_project", "camelCase"), /does not follow camelCase/);
});

test("P1.x folder structure is stable", () => {
  assert.doesNotThrow(() => assertStableFolders(["src/a", "src/b"], ["src/b", "src/a"]));
  assert.throws(() => assertStableFolders(["src/a"], ["src/a", "src/b"]), /diverged/);
});

test("P1.x private internals are not imported cross-module", () => {
  assert.doesNotThrow(() => assertNoPrivateImport("src/modules/projects/api.js"));
  assert.throws(() => assertNoPrivateImport("src/modules/projects/internal/state.js"), /Private internals/);
});

test("P1.x no CSS selector reaches into another module", () => {
  assert.doesNotThrow(() => assertNoCrossModuleSelector('[data-module="home"] .title', "home"));
  assert.throws(() => assertNoCrossModuleSelector('[data-module="home"] [data-module="finance"] .row', "home"), /another module/);
});

test("P1.x CSS is scoped", () => {
  assert.doesNotThrow(() => assertScopedCss('[data-module="home"] .title'));
  assert.throws(() => assertScopedCss(".title"), /must be scoped/);
});

test("P1.x design tokens are centralized", () => {
  assert.doesNotThrow(() => assertTokenSource("token"));
  assert.throws(() => assertTokenSource("inline"), /centralized tokens/);
});

test("P1.x inline styles are only deliberate dynamic values", () => {
  assert.doesNotThrow(() => assertInlineStyle({ dynamic: true }));
  assert.throws(() => assertInlineStyle({ dynamic: false }), /deliberate dynamic values/);
});

test("P1.x dynamic styles pass through controlled APIs", () => {
  assert.doesNotThrow(() => assertControlledStyleApi({ viaApi: true }));
  assert.throws(() => assertControlledStyleApi({ viaApi: false }), /controlled component API/);
});

test("P1.x no magic z-index values", () => {
  assert.doesNotThrow(() => assertTokenValue("z-index", 30, [10, 20, 30]));
  assert.throws(() => assertTokenValue("z-index", 9999, [10, 20, 30]), /z-index value must come from tokens/);
});

test("P1.x no magic spacing values", () => {
  assert.doesNotThrow(() => assertTokenValue("spacing", 16, [4, 8, 16]));
  assert.throws(() => assertTokenValue("spacing", 13, [4, 8, 16]), /spacing value must come from tokens/);
});

test("P1.x no duplicated color literals", () => {
  assert.doesNotThrow(() => assertNoDuplicates("color literal", ["#111", "#222"]));
  assert.throws(() => assertNoDuplicates("color literal", ["#111", "#111"]), /Duplicated color literal/);
});

test("P1.x no duplicated breakpoints", () => {
  assert.throws(() => assertNoDuplicates("breakpoint", ["640", "640"]), /Duplicated breakpoint/);
});

test("P1.x no duplicated status colors", () => {
  assert.doesNotThrow(() => assertNoDuplicateStatusColors([{ status: "active", color: "green" }, { status: "paused", color: "amber" }]));
  assert.throws(() => assertNoDuplicateStatusColors([{ status: "active", color: "green" }, { status: "done", color: "green" }]), /Duplicated status color/);
});

test("P1.x no duplicated transition timings", () => {
  assert.throws(() => assertNoDuplicates("transition timing", ["150ms", "150ms"]), /Duplicated transition timing/);
});

test("P1.x no duplicated Agent state labels", () => {
  assert.doesNotThrow(() => assertNoDuplicateLabels("agent", [{ key: "queued", value: "Queued" }, { key: "working", value: "Working" }]));
  assert.throws(() => assertNoDuplicateLabels("agent", [{ key: "a", value: "Working" }, { key: "b", value: "Working" }]), /Duplicated agent state label/);
});

test("P1.x no duplicated project state labels", () => {
  assert.throws(() => assertNoDuplicateLabels("project", [{ key: "x", value: "Active" }, { key: "y", value: "Active" }]), /Duplicated project state label/);
});
