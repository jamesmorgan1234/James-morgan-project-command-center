import test from "node:test";
import assert from "node:assert/strict";
import {
  projectRow, activeRow, nextUpRow, loadingStateTemplate,
  emptyStateTemplate, errorStateTemplate, visualRegressionSuite, safeAreaHandling
} from "../dist/shell/row-templates.js";
import {
  splitEntrypoints, lazyOptionalModule, lazyArtwork,
  optimizedImage, incrementalBatch, shouldPrefetch
} from "../dist/perf/loading.js";
import {
  assertIndexed, assertBackpressure, rateLimit,
  assertCheapWork, navigationStrategy, launcherArt
} from "../dist/perf/data.js";

test("P1.x project-row template", () => {
  assert.equal(projectRow("Alpha", "on_track").kind, "project");
  assert.throws(() => projectRow("Alpha", " "), /requires a status/);
});

test("P1.x active-row template", () => {
  assert.equal(activeRow("Alpha", "blocked").kind, "active");
  assert.throws(() => activeRow("Alpha", ""), /focus reason/);
});

test("P1.x Next-Up-row template", () => {
  assert.equal(nextUpRow("Alpha", 2).meta, "rank:2");
  assert.throws(() => nextUpRow("Alpha", 0), /positive rank/);
});

test("P1.x loading-state template", () => {
  assert.equal(loadingStateTemplate("Loading", 3), "Loading:3");
  assert.throws(() => loadingStateTemplate("Loading", 0), /skeleton rows/);
});

test("P1.x empty-state template", () => {
  assert.equal(emptyStateTemplate("No projects", "Create"), "Create");
  assert.throws(() => emptyStateTemplate("No projects", " "), /message and an action/);
});

test("P1.x error-state template", () => {
  assert.equal(errorStateTemplate("Failed", true), "retry");
  assert.throws(() => errorStateTemplate(" ", true), /requires a message/);
});

test("P1.x visual regression suite", () => {
  assert.equal(visualRegressionSuite(["home", "finance"]).length, 2);
  assert.throws(() => visualRegressionSuite(["home", "home"]), /unique/);
});

test("P1.x safe-area handling", () => {
  assert.doesNotThrow(() => safeAreaHandling({ top: 24, bottom: 16 }));
  assert.throws(() => safeAreaHandling({ top: -1, bottom: 16 }), /nonnegative/);
});

test("P1.x code splitting", () => {
  assert.equal(splitEntrypoints(["/home"])["/home"] !== undefined, true);
  assert.throws(() => splitEntrypoints(["home"]), /absolute/);
});

test("P1.x lazy optional-module loading", () => {
  assert.equal(lazyOptionalModule("voice", false), "lazy:voice");
  assert.throws(() => lazyOptionalModule("kernel", true), /Core modules cannot/);
});

test("P1.x lazy artwork loading", () => {
  assert.equal(lazyArtwork("art/home.webp"), "art/home.webp");
  assert.throws(() => lazyArtwork("data:image/png;base64,AA"), /lazily from a file/);
});

test("P1.x image optimization", () => {
  assert.equal(optimizedImage({ width: 320, format: "webp" }, 320).format, "webp");
  assert.throws(() => optimizedImage({ width: 2000, format: "webp" }, 320), /twice their display width/);
});

test("P1.x incremental loading", () => {
  assert.deepEqual(incrementalBatch(10, 4), { items: 4, nextCursor: 4 });
  assert.deepEqual(incrementalBatch(10, 4, 8), { items: 2, nextCursor: null });
});

test("P1.x prefetch only when beneficial", () => {
  assert.equal(shouldPrefetch({ likely: true, costKb: 40 }), true);
  assert.equal(shouldPrefetch({ likely: true, costKb: 400 }), false);
});

test("P1.x database indexes based on actual query paths", () => {
  assert.doesNotThrow(() => assertIndexed(["projectId"], [["projectId", "createdAt"]]));
  assert.throws(() => assertIndexed(["projectId", "status"], [["projectId"]]), /matching index/);
});

test("P1.x backpressure for high-volume events", () => {
  assert.doesNotThrow(() => assertBackpressure(50, 100));
  assert.throws(() => assertBackpressure(500, 100), /Backpressure/);
});

test("P1.x rate limiting for expensive actions", () => {
  assert.equal(rateLimit(1, 5), "allow");
  assert.equal(rateLimit(5, 5), "throttle");
});

test("P1.x mobile battery and CPU awareness", () => {
  assert.doesNotThrow(() => assertCheapWork({ batteryPct: 80, cpuPct: 20 }));
  assert.throws(() => assertCheapWork({ batteryPct: 5, cpuPct: 20 }), /battery and CPU/);
});

test("P1.x navigation network-first", () => {
  assert.equal(navigationStrategy(true), "network-first");
  assert.equal(navigationStrategy(false), "cache-first");
});

test("P1.x exact approved launcher art", () => {
  assert.equal(launcherArt({ size: 512, hash: "abcdef12" }).size, 512);
  assert.throws(() => launcherArt({ size: 300, hash: "abcdef12" }), /approved sizes/);
});
