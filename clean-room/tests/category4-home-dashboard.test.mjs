import test from "node:test";
import assert from "node:assert/strict";
import {
  homeDestinations,
  assertPinnedDestinationsPreservePrimaryGrid,
  homeAgentModule,
  homeBarriers
} from "../dist/ui/index.js";

function destination(key, input = {}) {
  return homeDestinations(input).find((entry) => entry.key === key);
}

function run(overrides = {}) {
  return {
    projectTitle: "Project Alpha",
    taskTitle: "Repair ledger import",
    nextAction: "Approve the migration",
    state: "working",
    progressPercent: 42,
    progressVerified: true,
    workBoundary: "Repository work only",
    ...overrides
  };
}

test("P4.4 Home provides access to Personal Operations", () => {
  const entry = destination("personal");
  assert.equal(entry.route, "/personal");
  assert.equal(entry.enabled, true);
});

test("P4.4 Home provides access to Needs Me", () => {
  assert.equal(destination("needs_me").route, "/needs-me");
});

test("P4.4 Home provides access to Search", () => {
  assert.equal(destination("search").route, "/search");
});

test("P4.4 Home provides access to Notifications", () => {
  assert.equal(destination("notifications").route, "/notifications");
});

test("P4.4 Home provides Financial Command Center access only where enabled", () => {
  assert.equal(destination("finance").enabled, false);
  assert.equal(destination("finance", { financeEnabled: true }).enabled, true);
  assert.equal(destination("finance", { financeEnabled: true }).route, "/finance");
});

test("P4.4 pinned destinations do not disturb the approved primary grid", () => {
  const pinned = homeDestinations({ pinnedKeys: ["search", "notifications"] });
  assert.deepEqual(pinned.filter((entry) => entry.pinned).map((entry) => entry.key), ["search", "notifications"]);
  assert.doesNotThrow(() => assertPinnedDestinationsPreservePrimaryGrid(["projects", "active_live", "next_up", "owner_attention"]));
  assert.throws(() => assertPinnedDestinationsPreservePrimaryGrid(["projects", "search"]), /cannot replace the approved primary Home grid/);
  assert.throws(() => homeDestinations({ pinnedKeys: ["unknown"] }), /Unknown Home destination/);
});

test("P4.4 Home Agent module shows the current project for an active run", () => {
  assert.equal(homeAgentModule(run()).currentProject, "Project Alpha");
  assert.equal(homeAgentModule(null).currentProject, null);
});

test("P4.4 Home Agent module shows the current task where known", () => {
  assert.equal(homeAgentModule(run()).currentTask, "Repair ledger import");
  assert.equal(homeAgentModule(run({ taskTitle: null })).currentTask, null);
});

test("P4.4 Home Agent module shows the exact next action where known", () => {
  assert.equal(homeAgentModule(run()).nextAction, "Approve the migration");
  assert.equal(homeAgentModule(run({ nextAction: null })).nextAction, null);
});

test("P4.4 Home Agent module reports the real run state", () => {
  for (const [state, label] of [["queued", "Queued"], ["working", "Working"], ["needs_owner", "Needs Owner"], ["blocked", "Blocked"], ["executor_unavailable", "Executor Unavailable"]]) {
    const module = homeAgentModule(run({ state }));
    assert.equal(module.state, state);
    assert.equal(module.stateLabel, label);
  }
  assert.equal(homeAgentModule(null).state, null);
  assert.equal(homeAgentModule(null).stateLabel, "No active run");
  assert.throws(() => homeAgentModule(run({ state: "running" })), /Unsupported agent run state/);
});

test("P4.4 Home Agent module shows verified progress or N/A", () => {
  assert.equal(homeAgentModule(run()).progressLabel, "42% verified");
  assert.equal(homeAgentModule(run({ progressPercent: null })).progressLabel, "N/A");
  assert.equal(homeAgentModule(run({ progressPercent: null })).progressPercent, null);
  assert.throws(() => homeAgentModule(run({ progressPercent: 42, progressVerified: false })), /verified or N\/A/);
  assert.throws(() => homeAgentModule(run({ progressPercent: 120 })), /0\.\.100/);
});

test("P4.4 Home Agent module distinguishes Queued from Working", () => {
  assert.notEqual(homeAgentModule(run({ state: "queued" })).stateLabel, homeAgentModule(run({ state: "working" })).stateLabel);
  assert.equal(homeAgentModule(run({ state: "queued" })).stateLabel, "Queued");
  assert.equal(homeAgentModule(run({ state: "working" })).stateLabel, "Working");
});

test("P4.4 Home Agent module surfaces Needs Owner", () => {
  assert.equal(homeAgentModule(run({ state: "needs_owner" })).stateLabel, "Needs Owner");
});

test("P4.4 Home Agent module carries the work boundary", () => {
  assert.equal(homeAgentModule(run()).workBoundary, "Repository work only");
  assert.throws(() => homeAgentModule(run({ workBoundary: " " })), /work boundary/);
});

test("P4.4 Home Agent module surfaces Blocked", () => {
  assert.equal(homeAgentModule(run({ state: "blocked" })).stateLabel, "Blocked");
});

test("P4.4 Home Agent module surfaces Executor Unavailable", () => {
  assert.equal(homeAgentModule(run({ state: "executor_unavailable" })).stateLabel, "Executor Unavailable");
});

test("P4.4 Home Agent module opens the Agent surface", () => {
  assert.equal(homeAgentModule(run()).route, "/agent");
  assert.equal(homeAgentModule(null).route, "/agent");
  assert.equal(homeAgentModule(run()).title, "Agent");
});

test("P4.4 Home To Work Barriers shows the current locked project", () => {
  assert.equal(homeBarriers({ lockedProject: "Project Alpha", reviewedOrParkedCount: 2 }).lockedProjectLabel, "Project Alpha");
  assert.equal(homeBarriers({ reviewedOrParkedCount: 0 }).lockedProjectLabel, "No project locked");
  assert.throws(() => homeBarriers({ lockedProject: " ", reviewedOrParkedCount: 0 }), /cannot be blank/);
});

test("P4.4 Home To Work Barriers shows the reviewed or parked count", () => {
  assert.equal(homeBarriers({ reviewedOrParkedCount: 3 }).reviewedOrParkedLabel, "3 reviewed or parked");
  assert.throws(() => homeBarriers({ reviewedOrParkedCount: -1 }), /non-negative integer/);
});

test("P4.4 Home To Work Barriers never renders a fake percentage", () => {
  const barriers = homeBarriers({ lockedProject: "Project Alpha", reviewedOrParkedCount: 3 });
  assert.equal(barriers.percentage, null);
  assert.equal("percentage" in barriers, true);
});
