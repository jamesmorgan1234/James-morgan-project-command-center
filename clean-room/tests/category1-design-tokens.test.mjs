import test from "node:test";
import assert from "node:assert/strict";
import { defineScale, cardHeightClass, assertTokenValue, assertNoGiantGap } from "../dist/design/tokens.js";

test("P1.x margin scale", () => {
  assert.deepEqual([...defineScale("margin", [8, 16, 24])], [8, 16, 24]);
  assert.throws(() => defineScale("margin", [16, 8]), /ascend/);
});

test("P1.x typography scale", () => {
  assert.deepEqual([...defineScale("typography", [12, 14, 16, 20, 24])], [12, 14, 16, 20, 24]);
  assert.throws(() => defineScale("typography", []), /requires steps/);
});

test("P1.x border scale", () => {
  assert.deepEqual([...defineScale("border", [1, 2, 4])], [1, 2, 4]);
  assert.throws(() => defineScale("border", [0]), /positive/);
});

test("P1.x card height classes", () => {
  assert.equal(cardHeightClass(80), "compact");
  assert.equal(cardHeightClass(120), "standard");
  assert.equal(cardHeightClass(200), "tall");
  assert.throws(() => cardHeightClass(0), /positive/);
});

test("P1.x no arbitrary component sizing", () => {
  assert.doesNotThrow(() => assertTokenValue(16, [8, 16, 24]));
  assert.throws(() => assertTokenValue(13, [8, 16, 24]), /Arbitrary component sizing/);
});

test("P1.x no giant unexplained vertical gaps", () => {
  assert.doesNotThrow(() => assertNoGiantGap(32, 64));
  assert.throws(() => assertNoGiantGap(200, 64), /giant unexplained/);
});
