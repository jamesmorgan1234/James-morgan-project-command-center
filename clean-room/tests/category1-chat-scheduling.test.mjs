import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPortfolioContext, roadmapComparison, complianceScan,
  routeProtectedAction, assertNoSuggestionBypass, actionPreview
} from "../dist/brain/chat.js";
import {
  schedulerRole, assertInstalledDeviceAcceptance, assertNoForcedImmersive,
  controlModeLock, assertExternalVerification, resumePoint
} from "../dist/agency/scheduling.js";

test("P1.x portfolio-scoped context builder", () => {
  assert.deepEqual([...buildPortfolioContext([{ id: "p1", scope: "owner" }], "owner")], ["p1"]);
  assert.throws(() => buildPortfolioContext([{ id: "p1", scope: "owner" }], "other"), /cannot be empty/);
});

test("P1.x roadmap-to-reality comparison", () => {
  const result = roadmapComparison(["a", "b"], ["a"]);
  assert.deepEqual([...result.onTrack], ["a"]);
  assert.deepEqual([...result.behind], ["b"]);
});

test("P1.x requirements compliance scanner", () => {
  const result = complianceScan([{ id: "r1", met: true }, { id: "r2", met: false }]);
  assert.equal(result.met, 1);
  assert.deepEqual([...result.missing], ["r2"]);
});

test("P1.x protected actions routed through Security", () => {
  assert.equal(routeProtectedAction({ protected: true }, true), "security");
  assert.throws(() => routeProtectedAction({ protected: true }, false), /route through Security/);
});

test("P1.x no hidden suggestion-to-Agent bypass", () => {
  assert.doesNotThrow(() => assertNoSuggestionBypass({ to: "agent", approved: true }));
  assert.throws(() => assertNoSuggestionBypass({ to: "agent", approved: false }), /bypass/);
});

test("P1.x Brain action previews where consequences matter", () => {
  assert.doesNotThrow(() => actionPreview({ consequential: true, previewed: true }));
  assert.throws(() => actionPreview({ consequential: true, previewed: false }), /require a preview/);
});

test("P1.x scheduler as continuation and fallback", () => {
  assert.equal(schedulerRole("continuation"), "continuation");
  assert.throws(() => schedulerRole("sole"), /not the sole trigger/);
});

test("P1.x physical installed-device acceptance", () => {
  assert.doesNotThrow(() => assertInstalledDeviceAcceptance({ physicalDevice: true }));
  assert.throws(() => assertInstalledDeviceAcceptance({ physicalDevice: false }), /Physical installed-device/);
});

test("P1.x no forced immersive mode", () => {
  assert.doesNotThrow(() => assertNoForcedImmersive("default"));
  assert.throws(() => assertNoForcedImmersive("immersive"), /cannot be forced/);
});

test("P1.x control-mode hard lock", () => {
  assert.doesNotThrow(() => controlModeLock("owner", "owner"));
  assert.throws(() => controlModeLock("agent", "owner"), /hard locked/);
});

test("P1.x executor self-report insufficient with external verification", () => {
  assert.doesNotThrow(() => assertExternalVerification({ verified: true }, true));
  assert.throws(() => assertExternalVerification({ verified: false }, true), /self-report is insufficient/);
});

test("P1.x resume from first incomplete task", () => {
  assert.equal(resumePoint([{ done: true }, { done: false }]), 1);
  assert.equal(resumePoint([{ done: true }]), 1);
});
