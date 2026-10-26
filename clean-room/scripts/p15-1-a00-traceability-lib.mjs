import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const cleanRoom = resolve(here, "..");
const basePath = resolve(cleanRoom, "evidence/P15_1_A00_REQUIREMENT_TRACEABILITY.json");
const fragmentDirectory = resolve(cleanRoom, "evidence/a00-traceability-overrides");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function loadA00TraceabilityFragments() {
  return readdirSync(fragmentDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && extname(entry.name) === ".json")
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => ({ file: entry.name, document: readJson(resolve(fragmentDirectory, entry.name)) }));
}

export function resolveA00Traceability() {
  const base = readJson(basePath);
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
      if (provenance.has(id)) throw new Error(`A00 traceability override collision for ${id}: ${provenance.get(id)} vs ${file}`);
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
    traceabilityFragments: fragments.map(({ file }) => `clean-room/evidence/a00-traceability-overrides/${file}`)
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
