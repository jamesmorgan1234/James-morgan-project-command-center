import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";

const grounding = JSON.parse(
  fs.readFileSync(new URL("../evidence/P15_1_A00_REQUIREMENT_SOURCE_GROUNDING.json", import.meta.url), "utf8")
);
const traceability = JSON.parse(
  fs.readFileSync(new URL("../evidence/P15_1_A00_REQUIREMENT_TRACEABILITY.json", import.meta.url), "utf8")
);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function decodeRows(document) {
  const compressed = Buffer.from(document.payload.base64, "base64");
  assert.equal(sha256(compressed), document.payload.gzipSha256, "compressed payload hash");
  const decoded = gunzipSync(compressed);
  assert.equal(sha256(decoded), document.payload.decodedSha256, "decoded payload hash");
  return JSON.parse(decoded.toString("utf8"));
}

function validateRows(rows, document = grounding) {
  assert.equal(rows.length, document.canonicalIdCount, "row count");
  const ids = rows.map((row) => row[0]);
  assert.equal(new Set(ids).size, ids.length, "unique ids");
  assert.deepEqual(ids, traceability.canonicalIds, "canonical sequence");
  for (const row of rows) {
    const [id, requirement, sourceIds, sourceFiles, sourceKinds, classification, activationPrerequisites] = row;
    assert.match(id, /^CCR-\d{5}$/);
    assert.equal(typeof requirement, "string", id);
    assert.ok(requirement.trim().length > 0, `${id}: requirement`);
    assert.ok(Array.isArray(sourceIds) && sourceIds.length > 0, `${id}: source ids`);
    assert.ok(Array.isArray(sourceFiles) && sourceFiles.length > 0, `${id}: source files`);
    assert.ok(Array.isArray(sourceKinds) && sourceKinds.length > 0, `${id}: source kinds`);
    assert.equal(typeof classification, "string", id);
    assert.ok(classification.trim().length > 0, `${id}: classification`);
    assert.ok(Array.isArray(activationPrerequisites), `${id}: activation prerequisites`);
  }
  return true;
}

test("A00 canonical source grounding materializes all 489 requirements without promoting verification truth", () => {
  assert.equal(grounding.status, "A00_CANONICAL_SOURCE_GROUNDING_COMPLETE");
  assert.equal(grounding.scope, "HISTORICAL_A00_ONLY");
  assert.equal(grounding.canonicalIdCount, 489);
  assert.equal(grounding.sourceAuthority.sha256, "0df16348d2117b86f8cbe050dc7263e1f965009034c9715cd45f5f2e72b61a2e");
  assert.equal(grounding.truthBoundary.sourceGroundingComplete, true);
  assert.equal(grounding.truthBoundary.implementationVerificationImplied, false);
  assert.equal(grounding.truthBoundary.strictVerifiedCountAtCreation, 3);
  assert.equal(grounding.truthBoundary.strictUnverifiedCountAtCreation, 486);
  assert.equal(validateRows(decodeRows(grounding)), true);
});

test("A00 grounding rejects payload tampering", () => {
  const tampered = structuredClone(grounding);
  tampered.payload.base64 = `${tampered.payload.base64.slice(0, -2)}AA`;
  assert.throws(() => decodeRows(tampered), /compressed payload hash/);
});

test("A00 grounding rejects missing row-level source provenance", () => {
  const rows = decodeRows(grounding);
  const tamperedRows = structuredClone(rows);
  tamperedRows[0][2] = [];
  assert.throws(() => validateRows(tamperedRows), /source ids/);
});
