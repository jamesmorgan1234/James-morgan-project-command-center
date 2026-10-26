import test from "node:test";
import assert from "node:assert/strict";
import { CommandRuntime, assertCommandEnvelope } from "../dist/kernel/index.js";

function command(id, type, payload = {}) {
  return { id, type, version: 1, correlationId: `corr:${id}`, actor: "owner", payload };
}

function eventFrom(input, type) {
  return [{ id: `evt:${input.id}`, type, version: 1, correlationId: input.correlationId, causationId: input.id, payload: input.payload }];
}

test("P1 universal command surface routes multiple registered action families through one typed runtime", () => {
  const runtime = new CommandRuntime();
  runtime.register("project.rename", (input) => eventFrom(input, "project.renamed"));
  runtime.register("book.archive", (input) => eventFrom(input, "book.archived"));
  runtime.register("provider.refresh", (input) => eventFrom(input, "provider.refreshed"));

  assert.deepEqual(runtime.registeredTypes(), ["book.archive", "project.rename", "provider.refresh"]);
  assert.equal(runtime.execute(command("cmd-project", "project.rename", { name: "Alpha" }))[0].type, "project.renamed");
  assert.equal(runtime.execute(command("cmd-book", "book.archive", { bookId: "book:1" }))[0].type, "book.archived");
  assert.equal(runtime.execute(command("cmd-provider", "provider.refresh", { provider: "github" }))[0].type, "provider.refreshed");
});

test("P1 universal command surface fails closed on malformed commands and unknown action types", () => {
  const runtime = new CommandRuntime();
  runtime.register("project.rename", (input) => eventFrom(input, "project.renamed"));

  assert.throws(() => assertCommandEnvelope({ ...command("", "project.rename"), id: "" }), /command id is required/);
  assert.throws(() => runtime.execute({ ...command("cmd-empty-actor", "project.rename"), actor: "" }), /command actor is required/);
  assert.throws(() => runtime.execute({ ...command("cmd-empty-key", "project.rename"), idempotencyKey: "" }), /command idempotencyKey is required/);
  assert.throws(() => runtime.execute(command("cmd-unknown", "unknown.action")), /No command handler registered/);
});

test("P1 universal command surface rejects handler output that breaks correlation or causation lineage", () => {
  const badCorrelation = new CommandRuntime();
  badCorrelation.register("bad.correlation", (input) => [{ id: "evt:bad-corr", type: "bad.done", version: 1, correlationId: "wrong", causationId: input.id, payload: {} }]);
  assert.throws(() => badCorrelation.execute(command("cmd-corr", "bad.correlation")), /correlationId must match/);

  const badCausation = new CommandRuntime();
  badCausation.register("bad.causation", (input) => [{ id: "evt:bad-cause", type: "bad.done", version: 1, correlationId: input.correlationId, causationId: "wrong", payload: {} }]);
  assert.throws(() => badCausation.execute(command("cmd-cause", "bad.causation")), /causationId must match/);
});
