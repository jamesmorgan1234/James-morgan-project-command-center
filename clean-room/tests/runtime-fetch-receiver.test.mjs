import assert from "node:assert/strict";
import { test } from "node:test";
import { HttpRuntimeSnapshotProvider } from "../dist/runtime/provider.js";
import { createFixtureRuntimeSnapshot } from "../dist/runtime/snapshot.js";

test("default HTTP provider preserves the browser fetch invocation contract", async (context) => {
  const fetchMock = context.mock.method(globalThis, "fetch", function () {
    if (this !== undefined && this !== globalThis) throw new TypeError("Illegal invocation");
    return Promise.resolve(Response.json(createFixtureRuntimeSnapshot()));
  });
  const snapshot = await new HttpRuntimeSnapshotProvider({ endpoint: "/synthetic-no-network" }).load();
  assert.equal(fetchMock.mock.callCount(), 1);
  assert.equal(snapshot.connection.state, "connected");
});
