import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  COMMAND_CENTER_COLORS,
  COMMAND_CENTER_GEOMETRY,
  COMMAND_CENTER_EFFECTS,
  APPROVED_SHARED_VISUAL_LANGUAGE,
  REJECTED_VISUAL_PATTERNS,
  APPROVED_SCREEN_FIXTURES,
  APPROVED_VISUAL_REFERENCES
} from "../dist/ui/index.js";

const ROOT = new URL("../", import.meta.url);
const APPROVED_PROJECTS_REFERENCE_SHA256 = "ccd2e2d89900b02de178fb90aa4e5aa843dd86ea3a3b8efbf2e9b4bb0633458f";
const APPROVED_VISUAL_CONTRACT_SHA256 = "92deb07a0ed9076f67b9cabda0f47366e8f5a3f9b34380ebda743e802e4663c1";

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, stable(child)]));
  return value;
}

function sha256(value) { return createHash("sha256").update(value).digest("hex"); }

test("P4.8 retrievable approved Projects visual asset remains byte-exact and dimension-exact", async () => {
  const bytes = await readFile(new URL("public/assets/approved-projects-visual-reference.png", ROOT));
  assert.equal(sha256(bytes), APPROVED_PROJECTS_REFERENCE_SHA256);
  assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.equal(bytes.readUInt32BE(16), 941);
  assert.equal(bytes.readUInt32BE(20), 1672);
});

test("P4.8 shared visual language, geometry and owner interaction rules have a deliberate regression fingerprint", () => {
  const contract = stable({
    colors: COMMAND_CENTER_COLORS,
    geometry: COMMAND_CENTER_GEOMETRY,
    effects: COMMAND_CENTER_EFFECTS,
    shared: APPROVED_SHARED_VISUAL_LANGUAGE,
    rejected: REJECTED_VISUAL_PATTERNS,
    fixtures: APPROVED_SCREEN_FIXTURES
  });
  assert.equal(sha256(JSON.stringify(contract)), APPROVED_VISUAL_CONTRACT_SHA256);
});

test("P4.8 all approved screenshot authorities remain registered without claiming unmapped identity", () => {
  assert.deepEqual(Object.keys(APPROVED_VISUAL_REFERENCES).sort(), ["active_live", "next_up", "project_detail_missing_hour", "projects"]);
  for (const reference of Object.values(APPROVED_VISUAL_REFERENCES)) {
    assert.equal(reference.authority, "owner_approved");
    assert.equal(reference.libraryStructuralMatch?.identityStatus, "structural_match_filename_unmapped");
  }
});
