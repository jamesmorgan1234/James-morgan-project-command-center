import test from "node:test";
import assert from "node:assert/strict";
import {
  deriveRevenue,
  assertNoSampleData,
  screenshotReference,
  projectDisplayName,
  blockerText,
  assertProjectCountSupported
} from "../dist/finance/record-integrity.js";

test("P1.x revenue derives only from verified financial evidence", () => {
  assert.deepEqual(deriveRevenue([{ amount: 10.5, currency: "USD", verified: true }, { amount: 4.5, currency: "USD", verified: true }]), { total: 15, currency: "USD" });
  assert.throws(() => deriveRevenue([{ amount: 10, currency: "USD", verified: false }]), /verified financial evidence/);
});

test("P1.x screenshot sample data cannot enter live records", () => {
  assert.doesNotThrow(() => assertNoSampleData([{ source: "live" }]));
  assert.throws(() => assertNoSampleData([{ source: "screenshot" }]), /cannot enter live records/);
});

test("P1.x screenshot references are protected", () => {
  assert.equal(screenshotReference("evidence/screenshots/home-01.png").storageKey, "evidence/screenshots/home-01.png");
  assert.throws(() => screenshotReference("data:image/png;base64,AAAA"), /protected storage keys/);
});

test("P1.x long project names", () => {
  const long = projectDisplayName("A very long project name that will not fit in a list row", 20);
  assert.equal(long.display.length, 20);
  assert.ok(long.full.startsWith("A very long project"));
});

test("P1.x long blocker text", () => {
  assert.equal(blockerText("Short", 20), "Short");
  assert.equal(blockerText("x".repeat(30), 10).length, 10);
});

test("P1.x large project counts", () => {
  assert.doesNotThrow(() => assertProjectCountSupported(500));
  assert.throws(() => assertProjectCountSupported(20000), /paging/);
});
