import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { verifyReference } from "./p15-1-repository-evidence.mjs";
import { expandPhaseManifest } from "./current-authority-lib.mjs";
import { currentReviewedMappings } from "./p15-1-current-reviewed-mappings.mjs";

/**
 * Local preflight for a reviewed mapping module.
 *
 * Runs the same checks the canonical assembler performs for reviewed rows -
 * canonical identity, phase membership, dependency category membership,
 * implementation anchors, named executable tests, evidence and duplicate
 * collisions - without waiting for a CI qualification cycle.
 *
 * usage: node scripts/p15-1-reviewed-mapping-preflight.mjs <mapping-module>
 */

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const target = process.argv[2];
if (!target) {
  console.error("usage: node scripts/p15-1-reviewed-mapping-preflight.mjs <mapping-module>");
  process.exit(2);
}

const resolvedTarget = isAbsolute(target)
  ? target
  : [resolve(process.cwd(), target), resolve(root, target)].find((candidate) => existsSync(candidate));
if (!resolvedTarget) throw new Error(`Mapping module not found: ${target}`);
const module_ = await import(pathToFileURL(resolvedTarget).href);
const exported = Object.entries(module_).find(([name, value]) => name.startsWith("reviewed") && typeof value === "function");
if (!exported) throw new Error("Mapping module must export a reviewed* function");
const rows = exported[1]();

const ledger = JSON.parse(readFileSync(resolve(root, "clean-room/evidence/category15-requirement-traceability.json"), "utf8"));
const byId = new Map(ledger.requirements.map((row) => [row.id, row]));
const manifest = JSON.parse(readFileSync(resolve(root, "roadmap/master-build-plan-owner-review/23_CURRENT_199_PHASE_MACHINE_MANIFEST.json"), "utf8"));
const phases = new Set(expandPhaseManifest(manifest).phaseIds);
const categories = new Set(manifest.categories.map((category) => category.id));

const errors = [];
const warnings = [];
const seen = new Set();

for (const row of rows) {
  const fail = (message) => errors.push({ id: row?.id ?? "UNKNOWN", message });
  if (!row?.id || !byId.has(row.id)) { fail("ID is not canonical"); continue; }
  if (seen.has(row.id)) fail("Duplicate mapping within module");
  seen.add(row.id);
  if (byId.get(row.id).truthState === "VERIFIED") warnings.push({ id: row.id, message: "Row is already VERIFIED in the current ledger" });

  if (!Array.isArray(row.owningPhases) || row.owningPhases.length === 0) fail("owningPhases required");
  else for (const phase of row.owningPhases) if (!phases.has(phase)) fail(`Unknown owning phase ${phase}`);

  if (!Array.isArray(row.dependencies) || row.dependencies.length === 0) fail("dependencies required");
  else for (const dependency of row.dependencies) if (!categories.has(dependency)) fail(`Unknown dependency category ${dependency}`);
  if (row.dependenciesVerified !== true) fail("dependenciesVerified must be true after review");

  if (!Array.isArray(row.applicableCompaniesOrCapabilities) || row.applicableCompaniesOrCapabilities.length === 0) fail("applicability required");
  if (!Array.isArray(row.implementationLocations) || row.implementationLocations.length === 0) fail("implementationLocations required");
  else for (const reference of row.implementationLocations) {
    try { verifyReference(root, reference); } catch (error) { fail(`implementation: ${error.message}`); }
  }

  for (const dimension of ["positive", "negative", "failurePath"]) {
    const test = row.tests?.[dimension];
    if (!test || test.applicable !== true) { fail(`${dimension} must be applicable`); continue; }
    if (!Array.isArray(test.references) || test.references.length === 0) { fail(`${dimension} references required`); continue; }
    for (const reference of test.references) {
      try { verifyReference(root, reference, { test: true }); } catch (error) { fail(`${dimension}: ${error.message}`); }
    }
  }

  if (!Array.isArray(row.evidence) || row.evidence.length === 0) fail("evidence required");
}

try {
  const aggregate = currentReviewedMappings(root);
  const unique = new Set(aggregate.map((row) => row.id));
  if (unique.size !== aggregate.length) errors.push({ id: "AGGREGATE", message: "Duplicate mapping across reviewed modules" });
} catch (error) {
  errors.push({ id: "AGGREGATE", message: error.message });
}

console.log(JSON.stringify({
  module: target,
  export: exported[0],
  rows: rows.length,
  errors,
  warnings,
  ok: errors.length === 0
}, null, 1));
if (errors.length > 0) process.exitCode = 1;
