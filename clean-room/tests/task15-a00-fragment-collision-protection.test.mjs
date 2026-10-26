import test from "node:test";
import assert from "node:assert/strict";
import {
  assertA00OverrideWritable,
  loadA00TraceabilityFragments,
  resolveA00Traceability,
  validateA00TraceabilityFragmentFiles
} from "../scripts/p15-1-a00-traceability-lib.mjs";

test("Task 15: current A00 fragment inventory has unique ordinals and no requirement overwrite collisions", () => {
  const fragments = loadA00TraceabilityFragments();
  const files = fragments.map(({ file }) => file);

  assert.ok(files.length > 0, "A00 override inventory must not be empty");
  assert.equal(validateA00TraceabilityFragmentFiles(files), true);

  const ordinals = files.map((file) => file.slice(0, 3));
  assert.equal(new Set(ordinals).size, ordinals.length, "A00 fragment ordinal prefixes must remain unique");

  const seenRequirementIds = new Map();
  for (const { file, document } of fragments) {
    for (const id of Object.keys(document.rowOverrides ?? {})) {
      assert.equal(
        seenRequirementIds.has(id),
        false,
        `requirement ${id} is duplicated by ${seenRequirementIds.get(id)} and ${file}`
      );
      seenRequirementIds.set(id, file);
    }
  }

  const resolved = resolveA00Traceability();
  for (const [id, file] of seenRequirementIds) {
    assert.equal(
      resolved.overrideProvenance[id],
      file,
      `live resolver provenance must identify exactly one owning fragment for ${id}`
    );
  }
});

test("Task 15: duplicate fragment ordinals fail closed", () => {
  assert.throws(
    () => validateA00TraceabilityFragmentFiles(["013-existing.json", "013-conflict.json"]),
    /Duplicate A00 traceability fragment ordinal 013/
  );
  assert.throws(
    () => validateA00TraceabilityFragmentFiles(["not-numbered.json"]),
    /Invalid A00 traceability fragment filename/
  );
});

test("Task 15: already-owned A00 requirement IDs cannot be overwritten", () => {
  const provenance = new Map([["CCR-00002", "001-existing.json"]]);
  assert.throws(
    () => assertA00OverrideWritable("CCR-00002", provenance, "014-new.json"),
    /A00 traceability override collision for CCR-00002/
  );
  assert.equal(assertA00OverrideWritable("CCR-99999", provenance, "014-new.json"), true);
});
