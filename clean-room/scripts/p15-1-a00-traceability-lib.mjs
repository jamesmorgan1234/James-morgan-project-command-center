import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { effectiveRequirementIdsForBranch, validateCurrentRequirementClassificationOverlay } from "./current-requirement-classification.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const cleanRoom = resolve(here, "..");
const repoRoot = resolve(cleanRoom, "..");
const basePath = resolve(cleanRoom, "evidence/P15_1_A00_REQUIREMENT_TRACEABILITY.json");
const fragmentDirectory = resolve(cleanRoom, "evidence/a00-traceability-overrides");
const currentClassificationPath = resolve(repoRoot, "roadmap/master-build-plan-owner-review/25_CURRENT_REQUIREMENT_CLASSIFICATION_OVERRIDES.json");
const recoveredAuthorityPath = resolve(cleanRoom, "evidence/P15_1_RECOVERED_ORIGINAL_LEDGER_AUTHORITY.json");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function validateA00TraceabilityFragmentFiles(fileNames) {
  const ordinals = new Map();
  for (const file of fileNames) {
    const match = /^(\d{3})-[a-z0-9][a-z0-9-]*\.json$/.exec(file);
    if (!match) throw new Error(`Invalid A00 traceability fragment filename: ${file}`);
    const ordinal = match[1];
    if (ordinals.has(ordinal)) {
      throw new Error(`Duplicate A00 traceability fragment ordinal ${ordinal}: ${ordinals.get(ordinal)} vs ${file}`);
    }
    ordinals.set(ordinal, file);
  }
  return true;
}

export function assertA00OverrideWritable(id, provenance, file) {
  if (provenance.has(id)) {
    throw new Error(`A00 traceability override collision for ${id}: ${provenance.get(id)} vs ${file}`);
  }
  return true;
}

export function loadA00TraceabilityFragments() {
  const entries = readdirSync(fragmentDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && extname(entry.name) === ".json")
    .sort((a, b) => a.name.localeCompare(b.name));

  validateA00TraceabilityFragmentFiles(entries.map((entry) => entry.name));

  return entries.map((entry) => ({ file: entry.name, document: readJson(resolve(fragmentDirectory, entry.name)) }));
}

export function resolveA00Traceability() {
  const base = readJson(basePath);
  const recoveredAuthority = readJson(recoveredAuthorityPath);
  const currentClassificationOverlay = readJson(currentClassificationPath);
  validateCurrentRequirementClassificationOverlay(currentClassificationOverlay, {
    canonicalJsonSha256: recoveredAuthority.canonicalJson.sha256,
    canonicalCsvSha256: recoveredAuthority.canonicalCsv.sha256,
    historicalBaselineCount: recoveredAuthority.canonicalJson.rowCount
  });
  const currentEffectiveCanonicalIds = effectiveRequirementIdsForBranch(base.canonicalIds, "A00", currentClassificationOverlay);
  const rowOverrides = { ...base.effectiveRowModel.rowOverrides };
  const provenance = new Map(Object.keys(rowOverrides).map((id) => [id, "P15_1_A00_REQUIREMENT_TRACEABILITY.json"]));
  const fragments = loadA00TraceabilityFragments();

  for (const { file, document } of fragments) {
    if (document.schemaVersion !== "cc-p15.1-a00-traceability-override-fragment-v1") {
      throw new Error(`Unsupported A00 traceability fragment schema: ${file}`);
    }
    if (document.scope !== "HISTORICAL_A00_ONLY") throw new Error(`A00 fragment scope mismatch: ${file}`);
    for (const [id, row] of Object.entries(document.rowOverrides ?? {})) {
      if (!base.canonicalIds.includes(id)) throw new Error(`A00 fragment contains non-canonical ID ${id}: ${file}`);
      assertA00OverrideWritable(id, provenance, file);
      rowOverrides[id] = row;
      provenance.set(id, file);
    }
  }

  const resolvedRows = base.canonicalIds.map((id) => ({
    id,
    ...base.effectiveRowModel.rowDefaults,
    ...(rowOverrides[id] ?? {})
  }));
  const verified = resolvedRows.filter((row) => row.truthState === "VERIFIED").length;
  const notApplicable = resolvedRows.filter((row) => row.truthState === "NOT_APPLICABLE").length;
  const unverified = resolvedRows.length - verified - notApplicable;

  return {
    ...base,
    effectiveRowModel: { ...base.effectiveRowModel, rowOverrides },
    closureSummary: { total: resolvedRows.length, verified, unverified, notApplicable },
    resolvedRows,
    overrideProvenance: Object.fromEntries(provenance),
    traceabilityFragments: fragments.map(({ file }) => `clean-room/evidence/a00-traceability-overrides/${file}`),
    currentEffectiveClassification: {
      authority: "roadmap/master-build-plan-owner-review/25_CURRENT_REQUIREMENT_CLASSIFICATION_OVERRIDES.json",
      branch: "A00",
      canonicalIdCount: currentEffectiveCanonicalIds.length,
      canonicalIds: currentEffectiveCanonicalIds,
      historicalCanonicalIdCount: base.canonicalIds.length,
      historicalScopePreserved: true
    }
  };
}

export function assertStrictVerifiedA00Row(id, row) {
  if (row.truthState !== "VERIFIED") throw new Error(`${id}: truthState must be VERIFIED`);
  if (!String(row.requirement ?? "").trim()) throw new Error(`${id}: requirement missing`);
  if (!Array.isArray(row.canonicalSourceIds) || row.canonicalSourceIds.length === 0) throw new Error(`${id}: canonical source IDs missing`);
  if (!Array.isArray(row.canonicalSourceFiles) || row.canonicalSourceFiles.length === 0) throw new Error(`${id}: canonical source files missing`);
  if (!String(row.classification ?? "").trim()) throw new Error(`${id}: classification missing`);
  if (!Array.isArray(row.applicableCompaniesOrCapabilities) || row.applicableCompaniesOrCapabilities.length === 0) throw new Error(`${id}: applicability missing`);
  if (!Array.isArray(row.owningPhases) || row.owningPhases.length === 0) throw new Error(`${id}: owning phase missing`);
  if (row.dependenciesVerified !== true) throw new Error(`${id}: dependencies are not verified`);
  if (!Array.isArray(row.implementationLocations) || row.implementationLocations.length === 0) throw new Error(`${id}: implementation locations missing`);
  for (const dimension of ["positive", "negative", "failurePath"]) {
    const testDimension = row.tests?.[dimension];
    if (testDimension?.applicable !== true || !Array.isArray(testDimension.references) || testDimension.references.length === 0) {
      throw new Error(`${id}: ${dimension} test evidence missing`);
    }
  }
  if (!Array.isArray(row.evidence) || row.evidence.length === 0) throw new Error(`${id}: evidence missing`);
  if (!/^git:[a-f0-9]{40}; ci:[0-9]+$/.test(String(row.evidenceVersion ?? ""))) throw new Error(`${id}: evidenceVersion invalid`);
  if (!String(row.evidenceEnvironment ?? "").includes("build/spec-lock-v2-clean-room")) throw new Error(`${id}: evidence environment missing isolated branch`);
  if (row.blocker !== null) throw new Error(`${id}: verified row still has blocker`);
  return true;
}
