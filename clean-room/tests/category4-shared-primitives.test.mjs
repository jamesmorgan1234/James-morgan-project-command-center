import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  COMMAND_CENTER_PRIMITIVES,
  assertPrimitiveAccessibility,
  expansionState,
  dialogInteractionState,
  assertTooltipSupplemental,
  sharedPrimitiveClass
} from "../dist/ui/index.js";

const ROOT = new URL("../", import.meta.url);
async function source(path) { return readFile(new URL(path, ROOT), "utf8"); }

const REQUIRED_PRIMITIVES = [
  "card", "row", "status_pill", "progress", "expansion", "dialog", "button",
  "loader", "empty_state", "zero_state", "error_state", "tooltip"
];

test("P4.5 exposes one canonical contract for every locked shared primitive", () => {
  assert.deepEqual(Object.keys(COMMAND_CENTER_PRIMITIVES).sort(), [...REQUIRED_PRIMITIVES].sort());
  for (const primitive of Object.values(COMMAND_CENTER_PRIMITIVES)) {
    assert.equal(primitive.usesMachineryVisualLanguage, true);
    assert.equal(primitive.permitsDecorativeChevron, false);
    assert.equal(primitive.privateTruthPolicy, "canonical_or_safe_fixed_copy");
  }
  assert.equal(COMMAND_CENTER_PRIMITIVES.button.minimumTargetPx, 48);
  assert.equal(COMMAND_CENTER_PRIMITIVES.dialog.minimumTargetPx, 48);
  assert.equal(COMMAND_CENTER_PRIMITIVES.status_pill.interaction, "inform");
});

test("P4.5 interactive primitives fail closed on undersized, unnamed, color-only or decorative-chevron controls", () => {
  assert.doesNotThrow(() => assertPrimitiveAccessibility({ kind: "button", width: 48, height: 48, accessibleName: "Apply" }));
  assert.throws(() => assertPrimitiveAccessibility({ kind: "button", width: 47, height: 48, accessibleName: "Apply" }), /at least 48px/);
  assert.throws(() => assertPrimitiveAccessibility({ kind: "button", width: 48, height: 48 }), /accessible name/);
  assert.throws(() => assertPrimitiveAccessibility({ kind: "button", width: 48, height: 48, accessibleName: "Apply", colorOnlyState: true }), /color alone/);
  assert.throws(() => assertPrimitiveAccessibility({ kind: "button", width: 48, height: 48, accessibleName: "Apply", decorativeChevron: true }), /chevrons/);
});

test("P4.5 expansion, dialog and tooltip contracts preserve keyboard/accessibility semantics", () => {
  assert.deepEqual(expansionState(false), { expanded: false, ariaExpanded: "false" });
  assert.deepEqual(expansionState(true), { expanded: true, ariaExpanded: "true" });
  assert.deepEqual(dialogInteractionState(true), { open: true, focusContained: true, returnFocusRequired: true, escapeDismisses: true });
  assert.deepEqual(dialogInteractionState(false), { open: false, focusContained: false, returnFocusRequired: false, escapeDismisses: false });
  assert.doesNotThrow(() => assertTooltipSupplemental(false));
  assert.throws(() => assertTooltipSupplemental(true), /Essential information/);
});

test("P4.5 shared visual primitive classes are shipped once with reduced-motion and forced-colors support", async () => {
  const css = await source("public/primitive-system.css");
  const html = await source("public/index.html");
  const sw = await source("public/sw.js");
  for (const marker of [".cc-button", ".cc-input", ".cc-select", ".cc-loader", ".cc-state", ".cc-expansion", ".cc-dialog", ".cc-tooltip"]) assert.match(css, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css, /@media\(forced-colors:active\)/);
  assert.match(html, /\/primitive-system\.css/);
  assert.match(sw, /\/primitive-system\.css/);
  assert.equal(sharedPrimitiveClass("button"), "project-filter-button");
  assert.equal(sharedPrimitiveClass("dialog"), "cc-dialog");
});

test("P4.5 current screens reuse shared card/status/progress/state helpers instead of per-screen competing primitives", async () => {
  const browser = await source("src/runtime/browser.ts");
  assert.match(browser, /function bevelCard\(/);
  assert.match(browser, /function bevelRouteCard\(/);
  assert.match(browser, /function statusPill\(/);
  assert.match(browser, /function progressRing\(/);
  assert.match(browser, /function emptyState\(/);
  for (const screen of ["renderProjects", "renderActive", "renderNextUp", "renderProjectDetail", "renderHome", "renderCanonicalSurface"]) assert.match(browser, new RegExp(`function ${screen}\\(`));
  assert.doesNotMatch(browser, /document\.createElement\(["']style["']\)/);
  assert.doesNotMatch(browser, /style\.cssText\s*=/);
  assert.doesNotMatch(browser, /row-chevron/);
});
