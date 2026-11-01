import test from "node:test";
import assert from "node:assert/strict";
import {
  scrollRestorationOwner,
  globalStateCoordinator,
  errorBoundaryRoot,
  startupTransition,
  sessionTransition,
  applicationReady,
  classifyModule,
  startupOrder,
  runStartup,
  startModuleWithin,
  assertNotStuckLoading,
  parseDeepLink
} from "../dist/kernel/index.js";

const T0 = "2026-10-31T10:00:00.000Z";

function modules(overrides = {}) {
  const base = [
    { key: "kernel", core: true, order: 1, start: () => "ready" },
    { key: "projects", core: true, order: 2, start: () => "ready" },
    { key: "optional-voice", core: false, order: 3, start: () => "ready" }
  ];
  return base.map((module) => ({ ...module, ...(overrides[module.key] ?? {}) }));
}

test("P1.x exactly one scroll-restoration owner", () => {
  assert.equal(scrollRestorationOwner(["router"]), "router");
  assert.throws(() => scrollRestorationOwner([]), /Exactly one/);
  assert.throws(() => scrollRestorationOwner(["a", "b"]), /Exactly one/);
});

test("P1.x exactly one global application-state coordinator", () => {
  assert.equal(globalStateCoordinator(["store"]), "store");
  assert.throws(() => globalStateCoordinator(["store", "store2"]), /Exactly one/);
});

test("P1.x exactly one error boundary hierarchy", () => {
  assert.equal(errorBoundaryRoot(["root-boundary"]), "root-boundary");
  assert.throws(() => errorBoundaryRoot([]), /Exactly one/);
});

test("P1.x explicit startup state machine", () => {
  assert.equal(startupTransition("idle", "start"), "starting");
  assert.equal(startupTransition("starting", "core_ready"), "ready");
  assert.equal(startupTransition("starting", "core_failed"), "failed");
  assert.equal(startupTransition("starting", "optional_failed"), "starting");
  assert.throws(() => startupTransition("idle", "core_ready"), /Invalid startup transition/);
});

test("P1.x explicit authenticated-session state machine", () => {
  assert.equal(sessionTransition("anonymous", "authenticate"), "authenticating");
  assert.equal(sessionTransition("authenticating", "success"), "authenticated");
  assert.equal(sessionTransition("authenticated", "sign_out"), "signed_out");
  assert.throws(() => sessionTransition("anonymous", "success"), /Invalid session transition/);
});

test("P1.x explicit application-readiness state", () => {
  assert.equal(applicationReady({ kernel: "ready", projects: "ready" }), true);
  assert.equal(applicationReady({ kernel: "ready", projects: "starting" }), false);
  assert.equal(applicationReady({}), false);
});

test("P1.x core versus optional module distinction", () => {
  assert.equal(classifyModule({ core: true }), "core");
  assert.equal(classifyModule({ core: false }), "optional");
});

test("P1.x optional modules cannot block startup", () => {
  const result = runStartup(modules({ "optional-voice": { start: () => "failed" } }));
  assert.equal(result.state, "ready");
  assert.deepEqual([...result.skipped], ["optional-voice"]);
});

test("P1.x deterministic startup ordering", () => {
  assert.deepEqual([...startupOrder(modules())], ["kernel", "projects", "optional-voice"]);
  assert.throws(() => startupOrder(modules({ projects: { order: 1 } })), /Duplicate startup order/);
});

test("P1.x startup timeout and failure handling", async () => {
  await assert.doesNotReject(() => startModuleWithin(Promise.resolve("ok"), 1000));
  await assert.rejects(() => startModuleWithin(new Promise(() => {}), 10), /Startup timed out/);
  const failed = runStartup(modules({ projects: { start: () => "failed" } }));
  assert.equal(failed.state, "failed");
  assert.equal(failed.failedCore, "projects");
});

test("P1.x no infinite loading state", () => {
  assert.doesNotThrow(() => assertNotStuckLoading(T0, "2026-10-31T10:00:30.000Z", 60000));
  assert.throws(() => assertNotStuckLoading(T0, "2026-10-31T10:02:00.000Z", 60000), /infinite loading/);
});

test("P1.x Safe Mode disables optional modules", () => {
  const result = runStartup(modules(), true);
  assert.equal(result.state, "safe_mode");
  assert.deepEqual([...result.started], ["kernel", "projects"]);
  assert.deepEqual([...result.skipped], ["optional-voice"]);
});

test("P1.x deep-link support", () => {
  assert.deepEqual(parseDeepLink("/projects/p1?tab=runs"), { path: "/projects/p1", params: { tab: "runs" } });
  assert.throws(() => parseDeepLink("https://example.com/projects"), /application-relative/);
  assert.throws(() => parseDeepLink("projects"), /application-relative/);
});
