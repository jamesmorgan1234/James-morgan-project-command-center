import test from "node:test";
import assert from "node:assert/strict";
import { CommandRuntime } from "../dist/kernel/index.js";

function command({ id, type = "project.rename", key = "same-request", name = "Torevi" }) {
  return {
    id,
    type,
    version: 1,
    correlationId: `corr:${id}`,
    idempotencyKey: key,
    actor: "owner",
    payload: { name }
  };
}

test("P1.4 command idempotency replays the first exact type/key result without a second handler side effect", () => {
  const runtime = new CommandRuntime();
  let calls = 0;
  runtime.register("project.rename", (input) => {
    calls += 1;
    return [{ id: `draft-${calls}`, type: "project.renamed", version: 1, correlationId: input.correlationId, causationId: input.id, payload: input.payload }];
  });

  const first = runtime.execute(command({ id: "cmd-1" }));
  const duplicate = runtime.execute(command({ id: "cmd-2", name: "Changed duplicate payload" }));

  assert.strictEqual(duplicate, first);
  assert.equal(calls, 1);
  assert.equal(runtime.latestSequence, 1);
  assert.equal(first[0].causationId, "cmd-1");
  assert.deepEqual(first[0].payload, { name: "Torevi" });
});

test("P1.4 deduplication scope includes command type so unrelated operations cannot collide on one idempotency key", () => {
  const runtime = new CommandRuntime();
  const calls = [];
  runtime.register("project.rename", (input) => {
    calls.push(input.type);
    return [{ id: "rename", type: "project.renamed", version: 1, correlationId: input.correlationId, causationId: input.id, payload: input.payload }];
  });
  runtime.register("project.archive", (input) => {
    calls.push(input.type);
    return [{ id: "archive", type: "project.archived", version: 1, correlationId: input.correlationId, causationId: input.id, payload: input.payload }];
  });

  const rename = runtime.execute(command({ id: "cmd-rename", type: "project.rename", key: "shared" }));
  const archive = runtime.execute(command({ id: "cmd-archive", type: "project.archive", key: "shared" }));

  assert.deepEqual(calls, ["project.rename", "project.archive"]);
  assert.equal(rename[0].sequence, 1);
  assert.equal(archive[0].sequence, 2);
  assert.notStrictEqual(rename, archive);
});

test("P1.4 command runtime fails closed for unknown command types without consuming event sequence or dedupe state", () => {
  const runtime = new CommandRuntime();
  assert.throws(() => runtime.execute(command({ id: "cmd-unknown", type: "project.unknown", key: "unknown-key" })), /No command handler registered/);
  assert.equal(runtime.latestSequence, 0);

  runtime.register("project.unknown", (input) => [{ id: "known-after-register", type: "project.known", version: 1, correlationId: input.correlationId, causationId: input.id, payload: input.payload }]);
  const accepted = runtime.execute(command({ id: "cmd-known", type: "project.unknown", key: "unknown-key" }));
  assert.equal(accepted[0].sequence, 1);
  assert.equal(accepted[0].causationId, "cmd-known");
});

test("P1.4 commands without an idempotency key execute independently instead of being silently deduplicated", () => {
  const runtime = new CommandRuntime();
  let calls = 0;
  runtime.register("project.rename", (input) => {
    calls += 1;
    return [{ id: `draft-${calls}`, type: "project.renamed", version: 1, correlationId: input.correlationId, causationId: input.id, payload: input.payload }];
  });

  const first = runtime.execute({ ...command({ id: "cmd-free-1" }), idempotencyKey: undefined });
  const second = runtime.execute({ ...command({ id: "cmd-free-2" }), idempotencyKey: undefined });
  assert.equal(calls, 2);
  assert.equal(first[0].sequence, 1);
  assert.equal(second[0].sequence, 2);
});
