import test from "node:test";
import assert from "node:assert/strict";
import {
  CommandCancelledError,
  CommandRuntime,
  WorkflowRuntime
} from "../dist/kernel/index.js";

function command(overrides = {}) {
  return {
    id: "cmd:one",
    type: "project.change",
    version: 1,
    correlationId: "corr:one",
    idempotencyKey: "idem:one",
    actor: "owner",
    payload: { value: 1 },
    ...overrides
  };
}

function event(input, overrides = {}) {
  return {
    id: `event:${input.id}`,
    type: "project.changed",
    version: 1,
    correlationId: input.correlationId,
    causationId: input.id,
    payload: input.payload,
    ...overrides
  };
}

test("P1.4 transaction boundary prevents partial event sequence inbox or outbox commits", () => {
  const runtime = new CommandRuntime();
  runtime.register("project.change", (input) => [
    event(input, { id: "event:valid" }),
    event(input, { id: "event:invalid", correlationId: "corr:wrong" })
  ]);

  assert.throws(() => runtime.execute(command()), /correlationId must match/);
  assert.equal(runtime.inboxHas("cmd:one"), false);
  assert.equal(runtime.pendingOutbox().length, 0);

  const clean = new CommandRuntime();
  clean.register("project.change", (input) => [event(input)]);
  const result = clean.execute(command());
  assert.equal(result[0].sequence, 1);
});

test("P1.4 retry inbox and transactional outbox semantics commit one result and replay safely", () => {
  const runtime = new CommandRuntime();
  let calls = 0;
  runtime.register("project.change", (input, context) => {
    calls += 1;
    if (context.attempt === 1) throw new Error("transient");
    return [event(input, { id: "event:committed" })];
  });

  const first = runtime.execute(command(), { transactionId: "tx:one", retry: { maxAttempts: 3 } });
  assert.equal(calls, 2);
  assert.equal(first[0].sequence, 1);
  assert.equal(runtime.inboxHas("cmd:one"), true);
  assert.equal(runtime.pendingOutbox().length, 1);
  assert.equal(runtime.pendingOutbox()[0].transactionId, "tx:one");

  const sameIdReplay = runtime.execute(command({ payload: { value: 999 } }));
  assert.strictEqual(sameIdReplay, first);
  const idempotencyReplay = runtime.execute(command({ id: "cmd:two", correlationId: "corr:two" }));
  assert.strictEqual(idempotencyReplay, first);
  assert.equal(calls, 2);
  assert.equal(runtime.inboxHas("cmd:two"), true);

  const published = runtime.acknowledgeOutbox("event:committed");
  assert.equal(published.published, true);
  assert.equal(runtime.pendingOutbox().length, 0);
});

test("P1.4 cancellation fails closed before handler execution and invokes terminal compensation hook", () => {
  const runtime = new CommandRuntime();
  let calls = 0;
  let compensated = 0;
  runtime.register("project.change", (input) => {
    calls += 1;
    return [event(input)];
  });

  assert.throws(() => runtime.execute(command(), {
    cancellation: { cancelled: true, reason: "owner cancelled" },
    retry: { maxAttempts: 3 },
    compensate: (_input, error) => {
      compensated += 1;
      assert.ok(error instanceof CommandCancelledError);
    }
  }), /Command cancelled: owner cancelled/);
  assert.equal(calls, 0);
  assert.equal(compensated, 1);
  assert.equal(runtime.pendingOutbox().length, 0);
});

test("P1.4 workflow runtime retries a step and compensates completed steps in reverse order after terminal failure", () => {
  const runtime = new WorkflowRuntime();
  const log = [];
  let secondAttempts = 0;

  assert.throws(() => runtime.execute({
    id: "workflow:one",
    correlationId: "corr:workflow",
    steps: [
      {
        key: "first",
        run: () => log.push("run:first"),
        compensate: () => log.push("compensate:first")
      },
      {
        key: "second",
        retry: { maxAttempts: 2 },
        run: (_context, attempt) => {
          secondAttempts += 1;
          log.push(`run:second:${attempt}`);
          if (attempt === 1) throw new Error("retry-me");
        },
        compensate: () => log.push("compensate:second")
      },
      {
        key: "third",
        run: () => {
          log.push("run:third");
          throw new Error("terminal");
        }
      }
    ]
  }, {}), /terminal/);

  assert.equal(secondAttempts, 2);
  assert.deepEqual(log, [
    "run:first",
    "run:second:1",
    "run:second:2",
    "run:third",
    "compensate:second",
    "compensate:first"
  ]);
});

test("P1.4 workflow state-machine validation rejects duplicate step identities", () => {
  const runtime = new WorkflowRuntime();
  assert.throws(() => runtime.execute({
    id: "workflow:duplicate",
    correlationId: "corr:duplicate",
    steps: [
      { key: "same", run: () => undefined },
      { key: "same", run: () => undefined }
    ]
  }, {}), /Duplicate workflow step key/);
});
