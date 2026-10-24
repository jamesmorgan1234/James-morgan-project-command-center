import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { activeLiveView, nextUpView } from "../dist/projects/index.js";

const ROOT = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, ROOT), "utf8");

const project = Object.freeze({
  id: "p1", typeKey: "project-type:test", ownerId: "owner", name: "Test", mission: "Mission",
  lifecycle: "active", verification: "verified", priority: "high", version: 1,
  createdAt: "2026-10-24T12:00:00Z", updatedAt: "2026-10-24T12:00:00Z",
  agentAccessEnabled: true, portfolioAutoEnabled: false, protected: false
});

test("P5.7 browser requires evidence-bearing live execution instead of lifecycle status", async () => {
  const source = await read("src/runtime/browser.ts");
  const active = source.match(/function activeProjects\([\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(active, /project\.liveExecution/);
  assert.match(active, /lastHeartbeatAt/);
  assert.match(active, /LIVE_EXECUTION_STALE_AFTER_MS/);
  assert.match(active, /executorClaimed === true/);
  assert.match(active, /evidence\.length > 0/);
  assert.doesNotMatch(active, /\["active", "live"\]\.includes\(project\.lifecycle\.value\)/);
});

test("P5.8 browser requires evidence-bearing roadmap readiness instead of a loose next action", async () => {
  const source = await read("src/runtime/browser.ts");
  const next = source.match(/function nextProjects\([\s\S]*?\n\}/)?.[0] ?? "";
  assert.match(next, /project\.nextWorkReadiness/);
  assert.match(next, /evidence\.length > 0/);
  assert.match(next, /priorityRank/);
  assert.doesNotMatch(next, /filter\(\(project\) => project\.nextAction\.state === "known"\)/);
});

test("P5.7 selector rejects stale or unclaimed activity", () => {
  const now = "2026-10-24T12:10:00Z";
  const activities = [
    { projectId: "p1", runId: "r1", taskId: "t1", status: "working", executorClaimed: false, lastHeartbeatAt: "2026-10-24T12:09:30Z" },
    { projectId: "p1", runId: "r2", taskId: "t2", status: "working", executorClaimed: true, lastHeartbeatAt: "2026-10-24T12:00:00Z" }
  ];
  assert.equal(activeLiveView([project], activities, now).length, 0);
  const verified = activeLiveView([project], [{ projectId: "p1", runId: "r3", taskId: "t3", status: "working", executorClaimed: true, lastHeartbeatAt: "2026-10-24T12:09:30Z" }], now);
  assert.equal(verified.length, 1);
  assert.equal(verified[0].activity.runId, "r3");
});

test("P5.8 selector rejects readiness without evidence", () => {
  const notReady = nextUpView([{ project, workUnitId: "w1", title: "Work", readiness: { ready: true, unmetDependencies: [], unmetGates: [] }, priorityRank: 1, evidenceRefs: [] }]);
  assert.equal(notReady.length, 0);
  const ready = nextUpView([{ project, workUnitId: "w1", title: "Work", readiness: { ready: true, unmetDependencies: [], unmetGates: [] }, priorityRank: 1, evidenceRefs: ["gate:evidence"] }]);
  assert.equal(ready.length, 1);
});
