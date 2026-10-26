import test from "node:test";
import assert from "node:assert/strict";
import { validateRuntimeConfig } from "../dist/kernel/index.js";

const base = {
  environment: "test",
  releaseId: "rel_compatibility-window",
  schemaVersion: 3,
  apiVersion: 4,
  compatibleSchema: { min: 2, max: 4 },
  compatibleApi: { min: 3, max: 5 },
  features: {}
};

test("P1 compatibility windows accept supported schema/API boundaries and reject versions outside either window", () => {
  assert.equal(validateRuntimeConfig({ ...base, schemaVersion: 2, apiVersion: 3 }).schemaVersion, 2);
  assert.equal(validateRuntimeConfig({ ...base, schemaVersion: 4, apiVersion: 5 }).apiVersion, 5);
  assert.throws(() => validateRuntimeConfig({ ...base, schemaVersion: 1 }), /outside compatibleSchema range/);
  assert.throws(() => validateRuntimeConfig({ ...base, schemaVersion: 5 }), /outside compatibleSchema range/);
  assert.throws(() => validateRuntimeConfig({ ...base, apiVersion: 2 }), /outside compatibleApi range/);
  assert.throws(() => validateRuntimeConfig({ ...base, apiVersion: 6 }), /outside compatibleApi range/);
});

test("P1 compatibility windows reject malformed ranges instead of widening them implicitly", () => {
  assert.throws(() => validateRuntimeConfig({ ...base, compatibleSchema: { min: 4, max: 3 } }), /Invalid compatibleSchema range/);
  assert.throws(() => validateRuntimeConfig({ ...base, compatibleApi: { min: 0, max: 5 } }), /Invalid compatibleApi range/);
});
