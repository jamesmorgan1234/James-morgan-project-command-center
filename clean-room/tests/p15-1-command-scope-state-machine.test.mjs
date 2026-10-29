import test from "node:test";
import assert from "node:assert/strict";
import { CommandRuntime, StateMachine } from "../dist/kernel/index.js";

function command({ id, actor, projectId, key, correlationId }) {
  return {
    id,
    type: "project.rename",
    version: 1,
    correlationId,
    idempotencyKey: key,
    actor,
    projectId,
    payload: { name: `${actor}:${projectId}` }
  };
}

test("P15.1 command idempotency replay is isolated by actor/project namespace", () => {
  const runtime = new CommandRuntime();
  let calls = 0;
  runtime.register("project.rename", (input) => {
    calls += 1;
    return [{
      id: `event:${input.actor}:${input.projectId}:${calls}`,
      type: "project.renamed",
      version: 1,
      correlationId: input.correlationId,
      causationId: input.id,
      payload: input.payload
    }];
  });

  const first = runtime.execute(command({ id: "cmd-a", actor: "owner-a", projectId: "project-a", key: "shared", correlationId: "corr-a" }));
  const second = runtime.execute(command({ id: "cmd-b", actor: "owner-b", projectId: "project-b", key: "shared", correlationId: "corr-b" }));

  assert.equal(calls, 2);
  assert.notStrictEqual(second, first);
  assert.equal(first[0].correlationId, "corr-a");
  assert.equal(second[0].correlationId, "corr-b");
  assert.equal(second[0].causationId, "cmd-b");
});

test("P15.1 command inbox replay does not cross actor/project namespace for the same command id", () => {
  const runtime = new CommandRuntime();
  let calls = 0;
  runtime.register("project.rename", (input) => {
    calls += 1;
    return [{
      id: `event:${input.actor}:${input.projectId}:${calls}`,
      type: "project.renamed",
      version: 1,
      correlationId: input.correlationId,
      causationId: input.id,
      payload: input.payload
    }];
  });

  const first = runtime.execute({ ...command({ id: "cmd-shared", actor: "owner-a", projectId: "project-a", key: undefined, correlationId: "corr-a" }), idempotencyKey: undefined });
  const second = runtime.execute({ ...command({ id: "cmd-shared", actor: "owner-b", projectId: "project-b", key: undefined, correlationId: "corr-b" }), idempotencyKey: undefined });

  assert.equal(calls, 2);
  assert.notStrictEqual(second, first);
  assert.equal(first[0].correlationId, "corr-a");
  assert.equal(second[0].correlationId, "corr-b");
});

test("P15.1 command replay remains first-result-wins within the same actor/project namespace", () => {
  const runtime = new CommandRuntime();
  let calls = 0;
  runtime.register("project.rename", (input) => {
    calls += 1;
    return [{
      id: `event:${calls}`,
      type: "project.renamed",
      version: 1,
      correlationId: input.correlationId,
      causationId: input.id,
      payload: input.payload
    }];
  });

  const first = runtime.execute(command({ id: "cmd-1", actor: "owner", projectId: "project", key: "same", correlationId: "corr-1" }));
  const replay = runtime.execute(command({ id: "cmd-2", actor: "owner", projectId: "project", key: "same", correlationId: "corr-2" }));

  assert.strictEqual(replay, first);
  assert.equal(calls, 1);
  assert.equal(replay[0].correlationId, "corr-1");
  assert.equal(replay[0].causationId, "cmd-1");
});

test("P15.1 StateMachine rejects conflicting and duplicate transition definitions", () => {
  assert.throws(() => new StateMachine([
    { from: "open", event: "close", to: "closed" },
    { from: "open", event: "close", to: "archived" }
  ]), /Conflicting state transition/);

  assert.throws(() => new StateMachine([
    { from: "open", event: "close", to: "closed" },
    { from: "open", event: "close", to: "closed" }
  ]), /Duplicate state transition/);
});

test("P15.1 StateMachine snapshots transition definitions against caller mutation", () => {
  const transition = { from: "open", event: "close", to: "closed" };
  const transitions = [transition];
  const machine = new StateMachine(transitions);

  transition.to = "archived";
  transitions.push({ from: "closed", event: "archive", to: "archived" });

  assert.equal(machine.next("open", "close"), "closed");
  assert.throws(() => machine.next("closed", "archive"), /Invalid state transition/);
});
