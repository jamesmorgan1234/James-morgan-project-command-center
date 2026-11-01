import test from "node:test";
import assert from "node:assert/strict";
import {
  artworkSafeArea, chevronSafeArea, screenTemplate, sectionTemplate,
  blockedStateTemplate, offlineStateTemplate, componentGallery
} from "../dist/design/templates.js";
import {
  assertNoLocalOverride, assertConsistentTileSizes, assertNoRoundedSaaSCards,
  assertSemanticColor, assertNoHorizontalOverflow, assertNativeScrolling,
  assertControlsAboveSystemUi, assertSingleTruthSystem, assertSameContracts
} from "../dist/design/layout-compliance.js";
import { assertMobileTarget, assertPortrait, exactMeasurements, assertStartupBudget } from "../dist/design/targets.js";

test("P1.x artwork safe areas", () => {
  assert.deepEqual(artworkSafeArea({ top: 24, right: 16, bottom: 24, left: 16 }), { top: 24, right: 16, bottom: 24, left: 16 });
  assert.throws(() => artworkSafeArea({ top: -1, right: 0, bottom: 0, left: 0 }), /nonnegative/);
});

test("P1.x chevron safe area", () => {
  assert.equal(chevronSafeArea(12).clear, 24);
  assert.throws(() => chevronSafeArea(0), /positive/);
});

test("P1.x screen-template system", () => {
  const screen = screenTemplate("home", ["header", "needs_me", "activity"]);
  assert.equal(screen.sections.length, 3);
  assert.throws(() => screenTemplate("home", ["header", "header"]), /unique/);
});

test("P1.x section-template system", () => {
  assert.equal(sectionTemplate("list", ["list", "detail"]), "list");
  assert.throws(() => sectionTemplate("carousel", ["list", "detail"]), /Unknown section template/);
});

test("P1.x blocked-state template", () => {
  assert.equal(blockedStateTemplate("awaiting approval", "Review").tone, "blocked");
  assert.throws(() => blockedStateTemplate("awaiting approval", " "), /requires an action/);
});

test("P1.x offline-state template", () => {
  assert.equal(offlineStateTemplate("2026-10-31T10:00:00.000Z").tone, "offline");
  assert.throws(() => offlineStateTemplate("not-a-date"), /valid sync timestamp/);
});

test("P1.x component gallery shows canonical appearance", () => {
  assert.equal(componentGallery(["button", "card"]).length, 2);
  assert.throws(() => componentGallery(["card", "card"]), /unique/);
});

test("P1.x no local CSS overrides that undermine tokens", () => {
  assert.doesNotThrow(() => assertNoLocalOverride([]));
  assert.throws(() => assertNoLocalOverride(["margin: 7px"]), /Local CSS overrides/);
});

test("P1.x no inconsistent tile sizes", () => {
  assert.doesNotThrow(() => assertConsistentTileSizes([96, 96]));
  assert.throws(() => assertConsistentTileSizes([96, 104]), /Inconsistent tile sizes/);
});

test("P1.x no random rounded SaaS cards", () => {
  assert.doesNotThrow(() => assertNoRoundedSaaSCards(2, 4));
  assert.throws(() => assertNoRoundedSaaSCards(16, 4), /Rounded SaaS cards/);
});

test("P1.x no arbitrary blue UI elements", () => {
  assert.doesNotThrow(() => assertSemanticColor("#111111", ["#111111", "#C9A227"]));
  assert.throws(() => assertSemanticColor("#3B82F6", ["#111111", "#C9A227"]), /Arbitrary colour/);
});

test("P1.x no horizontal overflow", () => {
  assert.doesNotThrow(() => assertNoHorizontalOverflow(360, 360));
  assert.throws(() => assertNoHorizontalOverflow(400, 360), /Horizontal overflow/);
});

test("P1.x native vertical scrolling", () => {
  assert.doesNotThrow(() => assertNativeScrolling({ native: true }));
  assert.throws(() => assertNativeScrolling({ native: false }), /native vertical/);
});

test("P1.x no controls underneath Android system UI", () => {
  assert.doesNotThrow(() => assertControlsAboveSystemUi(700, 800, 48));
  assert.throws(() => assertControlsAboveSystemUi(780, 800, 48), /underneath Android system UI/);
});

test("P1.x no separate mobile and desktop truth systems", () => {
  assert.doesNotThrow(() => assertSingleTruthSystem(["shared"]));
  assert.throws(() => assertSingleTruthSystem(["mobile", "desktop"]), /exactly one truth system/);
});

test("P1.x same data and contracts regardless of presentation size", () => {
  assert.doesNotThrow(() => assertSameContracts({ mobile: "v1", desktop: "v1" }));
  assert.throws(() => assertSameContracts({ mobile: "v1", desktop: "v2" }), /same contracts/);
});

test("P1.x Samsung mobile-first target", () => {
  assert.doesNotThrow(() => assertMobileTarget({ width: 360, height: 780 }));
  assert.throws(() => assertMobileTarget({ width: 1440, height: 900 }), /Samsung-class/);
});

test("P1.x portrait-first layout", () => {
  assert.doesNotThrow(() => assertPortrait("portrait"));
  assert.throws(() => assertPortrait("landscape"), /portrait-first/);
});

test("P1.x exact approved screenshot measurements", () => {
  assert.equal(exactMeasurements([{ x: 16, y: 24, w: 328, h: 96 }]).length, 1);
  assert.throws(() => exactMeasurements([{ x: 16.5, y: 24, w: 328, h: 96 }]), /exact integers/);
});

test("P1.x startup performance budget", () => {
  assert.doesNotThrow(() => assertStartupBudget(800, 1500));
  assert.throws(() => assertStartupBudget(2000, 1500), /budget exceeded/);
});
