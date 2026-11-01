import test from "node:test";
import assert from "node:assert/strict";
import {
  restoreRoute,
  androidBack,
  browserBack,
  nestedDetailBack,
  expandedSectionBack,
  rememberScroll,
  assertSoftNavigation,
  assertNoSharedMutableGlobals,
  assertSingleEventLoop,
  kernelVersion
} from "../dist/kernel/index.js";

const empty = { detailStack: [], expandedSections: [] };

test("P1.x route restoration after reload", () => {
  assert.equal(restoreRoute({ route: "/projects/p1" }, "/home"), "/projects/p1");
  assert.equal(restoreRoute(null, "/home"), "/home");
});

test("P1.x Android Back contract", () => {
  const withDetail = { detailStack: ["task:t1"], expandedSections: [] };
  assert.equal(androidBack(withDetail, true).action, "close_detail");
  assert.equal(androidBack(empty, true).action, "exit");
  assert.equal(androidBack(empty, false).action, "navigate");
});

test("P1.x Browser Back contract", () => {
  assert.deepEqual(browserBack(["/a", "/b"], 1), { route: "/a", index: 0 });
  assert.deepEqual(browserBack(["/a"], 0), { route: "/a", index: 0 });
  assert.throws(() => browserBack(["/a"], 3), /out of range/);
});

test("P1.x nested-detail Back contract", () => {
  assert.deepEqual(nestedDetailBack(["a", "b"]), { stack: ["a"], handled: true });
  assert.deepEqual(nestedDetailBack([]), { stack: [], handled: false });
});

test("P1.x expanded-section Back contract", () => {
  assert.deepEqual(expandedSectionBack(["x"]), { sections: [], handled: true });
  assert.deepEqual(expandedSectionBack([]), { sections: [], handled: false });
});

test("P1.x per-route scroll memory", () => {
  const store = rememberScroll({}, "/projects", 120);
  assert.equal(store["/projects"], 120);
  assert.equal(rememberScroll(store, "/finance", 0)["/projects"], 120);
  assert.throws(() => rememberScroll({}, "projects", 10), /absolute route/);
});

test("P1.x no whole-page reload during ordinary navigation", () => {
  assert.doesNotThrow(() => assertSoftNavigation({ fullPageReload: false }));
  assert.throws(() => assertSoftNavigation({ fullPageReload: true }), /must not reload/);
});

test("P1.x no global mutable variables shared between arbitrary modules", () => {
  assert.doesNotThrow(() => assertNoSharedMutableGlobals([]));
  assert.throws(() => assertNoSharedMutableGlobals(["window.appState"]), /Shared mutable globals/);
});

test("P1.x no competing event loops", () => {
  assert.doesNotThrow(() => assertSingleEventLoop(["main"]));
  assert.throws(() => assertSingleEventLoop(["main", "worker"]), /exactly one/);
});

test("P1.x Core Kernel version identifier", () => {
  assert.equal(kernelVersion("1.4.0"), "1.4.0");
  assert.throws(() => kernelVersion("v1"), /semantic/);
});
