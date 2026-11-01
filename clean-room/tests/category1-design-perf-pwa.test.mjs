import test from "node:test";
import assert from "node:assert/strict";
import {
  designToken, spacingScale, glowScale, bevelGeometry,
  iconFrame, progressRing, statusPill, homeTileHeight
} from "../dist/design/geometry.js";
import {
  navigationBudget, renderBudget, queryBudget, requestBudget,
  listStrategy, page, assertNoNPlusOne, invalidateCache
} from "../dist/perf/budgets.js";
import {
  manifestId, scopeStrategy, staleDataIndicator, offlineStateSeparated,
  updateFailureHandling, detectStaleClient, healthDiagnostics, blackSystemSurface
} from "../dist/shell/pwa.js";

test("P1.x design tokens as code", () => {
  assert.deepEqual(designToken("space-4", 16), { name: "space-4", value: 16 });
  assert.throws(() => designToken("Space4", 16), /kebab-case/);
});

test("P1.x spacing scale", () => {
  assert.deepEqual([...spacingScale([4, 8, 12, 16])], [4, 8, 12, 16]);
  assert.throws(() => spacingScale([4, 8, 8]), /ascending/);
});

test("P1.x glow scale", () => {
  assert.deepEqual([...glowScale([0, 4, 8])], [0, 4, 8]);
  assert.throws(() => glowScale([4, 8]), /starts at zero/);
});

test("P1.x bevel geometry scale", () => {
  assert.deepEqual(bevelGeometry(8, 4), { inset: 8, depth: 4 });
  assert.throws(() => bevelGeometry(4, 8), /cannot exceed/);
});

test("P1.x icon-frame geometry", () => {
  assert.equal(iconFrame(24).radius, 3);
  assert.throws(() => iconFrame(18), /approved size/);
});

test("P1.x progress-ring geometry", () => {
  assert.ok(progressRing(20, 4).circumference > 100);
  assert.throws(() => progressRing(20, 12), /half its radius/);
});

test("P1.x status-pill geometry", () => {
  assert.equal(statusPill("Blocked", 100).height, 24);
  assert.throws(() => statusPill("Blocked", 10), /fit its label/);
});

test("P1.x home tile height locked uniformly", () => {
  assert.equal(homeTileHeight([96, 96, 96]), 96);
  assert.throws(() => homeTileHeight([96, 104]), /locked uniformly/);
});

test("P1.x navigation performance budget", () => {
  assert.doesNotThrow(() => navigationBudget(200));
  assert.throws(() => navigationBudget(500), /Navigation budget exceeded/);
});

test("P1.x screen-render performance budget", () => {
  assert.doesNotThrow(() => renderBudget(80));
  assert.throws(() => renderBudget(150), /Screen render budget exceeded/);
});

test("P1.x data-query budget", () => {
  assert.doesNotThrow(() => queryBudget(100));
  assert.throws(() => queryBudget(400), /Data query budget exceeded/);
});

test("P1.x maximum unnecessary network requests", () => {
  assert.doesNotThrow(() => requestBudget(5));
  assert.throws(() => requestBudget(20), /exceed the maximum/);
});

test("P1.x large-list virtualization", () => {
  assert.equal(listStrategy(200), "virtualized");
  assert.throws(() => listStrategy(2000), /require virtualization/);
});

test("P1.x pagination", () => {
  assert.equal(page([1, 2, 3, 4, 5], 2, 0).length, 2);
  assert.throws(() => page([1, 2, 3, 4, 5], 2, 3), /out of range/);
});

test("P1.x avoid N+1 data queries", () => {
  assert.doesNotThrow(() => assertNoNPlusOne(1, 10));
  assert.throws(() => assertNoNPlusOne(10, 10), /N\+1/);
});

test("P1.x cache invalidation rules", () => {
  assert.equal(invalidateCache("projects", { projects: "on-write" }), "on-write");
  assert.throws(() => invalidateCache("finance", { projects: "on-write" }), /No cache invalidation rule/);
});

test("P1.x stable manifest ID", () => {
  assert.equal(manifestId("/app"), "/app");
  assert.throws(() => manifestId("app"), /application-relative/);
});

test("P1.x stable scope and start URL strategy", () => {
  assert.equal(scopeStrategy("/app/", "/app/home").startUrl, "/app/home");
  assert.throws(() => scopeStrategy("/app/", "/other"), /within the stable scope/);
});

test("P1.x stale-data indicator", () => {
  const fresh = staleDataIndicator("2026-10-31T10:00:00.000Z", "2026-10-31T10:00:10.000Z", 30000);
  assert.equal(fresh.stale, false);
  assert.equal(staleDataIndicator("2026-10-31T10:00:00.000Z", "2026-10-31T10:05:00.000Z", 30000).stale, true);
});

test("P1.x offline state separated from live state", () => {
  assert.equal(offlineStateSeparated("offline"), "offline");
  assert.throws(() => offlineStateSeparated("stale"), /live or offline/);
});

test("P1.x update failure handling", () => {
  assert.equal(updateFailureHandling(1), "retry");
  assert.throws(() => updateFailureHandling(4), /retries exceeded/);
});

test("P1.x stale-client compatibility detection", () => {
  assert.equal(detectStaleClient("a1", "a1"), "current");
  assert.equal(detectStaleClient("a1", "b2"), "stale");
});

test("P1.x PWA health diagnostics", () => {
  assert.equal(healthDiagnostics({ manifest: true, serviceWorker: false, cache: "warm" }).healthy, false);
  assert.throws(() => healthDiagnostics({ manifest: true, serviceWorker: true, cache: " " }), /cache state/);
});

test("P1.x black Android system surfaces", () => {
  assert.equal(blackSystemSurface("#000000"), "#000000");
  assert.throws(() => blackSystemSurface("#111111"), /must be black/);
});
