import test from "node:test";
import assert from "node:assert/strict";
import {
  assessModule,
  assertNotGiantFile,
  assertDomainBoundary,
  classifyFunction,
  assertSideEffectsIsolated,
  assertNoHiddenSingleton,
  initializeApp,
  teardownApp,
  assertNoImportTimeDom,
  assertNoImportSideEffects,
  detectCycles,
  assertNoCycles,
  detectDeadCode,
  detectUnusedExports,
  detectDuplicateUtilities
} from "../dist/kernel/index.js";

test("P1.x modules are small and cohesive", () => {
  assert.equal(assessModule({ path: "a.ts", lines: 120, exports: 4, responsibilities: 1, domain: "projects" }).cohesive, true);
  const mixed = assessModule({ path: "b.ts", lines: 120, exports: 4, responsibilities: 3, domain: "projects" });
  assert.equal(mixed.cohesive, false);
  assert.deepEqual([...mixed.reasons], ["multiple_responsibilities"]);
});

test("P1.x no giant all-purpose application file", () => {
  assert.doesNotThrow(() => assertNotGiantFile(499));
  assert.throws(() => assertNotGiantFile(501), /must not exceed 500 lines/);
});

test("P1.x domain boundaries are clear", () => {
  assert.doesNotThrow(() => assertDomainBoundary("projects", "projects"));
  assert.doesNotThrow(() => assertDomainBoundary("projects", "shared"));
  assert.throws(() => assertDomainBoundary("projects", "finance"), /Cross-domain import/);
});

test("P1.x domain functions are pure where possible", () => {
  assert.equal(classifyFunction({ sideEffects: false }), "pure");
  assert.equal(classifyFunction({ sideEffects: true }), "effectful");
});

test("P1.x side effects are isolated", () => {
  assert.doesNotThrow(() => assertSideEffectsIsolated("domain", []));
  assert.doesNotThrow(() => assertSideEffectsIsolated("adapter", ["fetch"]));
  assert.throws(() => assertSideEffectsIsolated("domain", ["fetch"]), /must not perform side effects/);
});

test("P1.x no hidden singleton state", () => {
  assert.doesNotThrow(() => assertNoHiddenSingleton({ global: false, deliberateService: false }));
  assert.doesNotThrow(() => assertNoHiddenSingleton({ global: true, deliberateService: true }));
  assert.throws(() => assertNoHiddenSingleton({ global: true, deliberateService: false }), /Hidden singleton/);
});

test("P1.x initialization is explicit", () => {
  let ran = false;
  initializeApp({ initialize: () => { ran = true; } });
  assert.equal(ran, true);
  assert.throws(() => initializeApp({}), /must be explicit/);
});

test("P1.x teardown is explicit", () => {
  let ran = false;
  teardownApp({ destroy: () => { ran = true; } });
  assert.equal(ran, true);
  assert.throws(() => teardownApp({}), /must be explicit/);
});

test("P1.x modules do not require DOM at import", () => {
  assert.doesNotThrow(() => assertNoImportTimeDom({ touchesDomAtImport: false }));
  assert.throws(() => assertNoImportTimeDom({ touchesDomAtImport: true }), /must not require the DOM/);
});

test("P1.x importing a module has no side effects", () => {
  assert.doesNotThrow(() => assertNoImportSideEffects({ designated: false, sideEffects: [] }));
  assert.doesNotThrow(() => assertNoImportSideEffects({ designated: true, sideEffects: ["register"] }));
  assert.throws(() => assertNoImportSideEffects({ designated: false, sideEffects: ["register"] }), /must not cause side effects/);
});

test("P1.x no circular imports", () => {
  assert.deepEqual([...detectCycles({ a: ["b"], b: ["c"], c: [] })], []);
  const cycles = detectCycles({ a: ["b"], b: ["a"] });
  assert.equal(cycles.length, 1);
  assert.deepEqual([...cycles[0]], ["a", "b", "a"]);
  assert.throws(() => assertNoCycles({ a: ["b"], b: ["a"] }), /Circular import detected/);
});

test("P1.x dead code is detected", () => {
  assert.deepEqual([...detectDeadCode([{ name: "used", referenced: true }, { name: "orphan", referenced: false }])], ["orphan"]);
});

test("P1.x unused exports are detected", () => {
  assert.deepEqual([...detectUnusedExports(["a", "b", "c"], ["a", "c"])], ["b"]);
});

test("P1.x duplicate utilities are detected", () => {
  const duplicates = detectDuplicateUtilities([
    { name: "formatDate", fingerprint: "f1" },
    { name: "formatDay", fingerprint: "f1" },
    { name: "unique", fingerprint: "f2" }
  ]);
  assert.equal(duplicates.length, 1);
  assert.deepEqual([...duplicates[0]], ["formatDate", "formatDay"]);
});
