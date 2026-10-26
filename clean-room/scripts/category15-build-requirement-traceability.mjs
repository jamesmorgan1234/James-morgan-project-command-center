import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const cleanRoom = process.cwd();
const repoRoot = resolve(cleanRoom, "..");
const write = process.argv.includes("--write");
const sourceArg = process.argv.find((value) => value.startsWith("--source-csv="));
const sourcePath = sourceArg?.slice("--source-csv=".length) || process.env.COMMAND_CENTER_RECOVERED_LEDGER_CSV || "";
const expectedCsvSha256 = "1437d1f88b514008f418c720118786c9ff1b5f3bd1cf8e9ee2b1aca3879169d2";

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i += 1; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ""; }
    else if (ch === '\n') { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
    else field += ch;
  }
  if (field.length || row.length) { row.push(field.replace(/\r$/, "")); rows.push(row); }
  return rows;
}

if (!sourcePath || !existsSync(sourcePath)) {
  console.error(JSON.stringify({ ok: false, code: "RECOVERED_LEDGER_CSV_REQUIRED", expectedSha256: expectedCsvSha256, hint: "Pass --source-csv=<path> or set COMMAND_CENTER_RECOVERED_LEDGER_CSV to the recovered original 04_MASTER_RECONCILED_REQUIREMENTS.csv." }));
  process.exit(2);
}

const csvBytes = readFileSync(sourcePath);
const csvSha256 = createHash("sha256").update(csvBytes).digest("hex");
if (csvSha256 !== expectedCsvSha256) throw new Error(`Recovered canonical CSV hash mismatch: ${csvSha256}`);
const parsed = parseCsv(csvBytes.toString("utf8").replace(/^\uFEFF/, ""));
const headers = parsed.shift();
const expectedHeaders = ["canonical_id","canonical_text","source_ids","source_files","source_kinds","architecture_branch","architecture_owner","classification","activation_prerequisites"];
if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) throw new Error("Recovered canonical CSV headers do not match authority");
if (parsed.length !== 5825) throw new Error(`Expected 5825 recovered rows, found ${parsed.length}`);

const baseline = parsed.map((values, index) => {
  const source = Object.fromEntries(headers.map((key, i) => [key, values[i] ?? ""]));
  const expectedId = `CCR-${String(index + 1).padStart(5, "0")}`;
  if (source.canonical_id !== expectedId) throw new Error(`Canonical ID continuity failure at ${expectedId}: ${source.canonical_id}`);
  return {
    id: source.canonical_id,
    requirement: source.canonical_text,
    authoritativeSource: `RECOVERED_ORIGINAL:04_MASTER_RECONCILED_REQUIREMENTS.csv#${source.canonical_id}`,
    sourceVersion: expectedCsvSha256,
    sourceIds: source.source_ids ? source.source_ids.split(" | ").filter(Boolean) : [],
    sourceFiles: source.source_files ? source.source_files.split(" | ").filter(Boolean) : [],
    sourceKinds: source.source_kinds ? source.source_kinds.split(" | ").filter(Boolean) : [],
    architectureBranch: source.architecture_branch,
    architectureOwner: source.architecture_owner,
    classification: source.classification,
    activationPrerequisites: source.activation_prerequisites,
    applicableCompaniesOrCapabilities: [],
    owningPhases: [],
    dependencies: [],
    implementationLocations: [],
    tests: [],
    evidence: [],
    truthState: "UNVERIFIED",
    blocker: "Requirement-level current implementation/test/evidence mapping has not yet been proven for this row."
  };
});

const rev3Path = resolve(repoRoot, "roadmap/master-build-plan-owner-review/Command_Center_Canonical_Owner_Additions_REV3.json");
const rev3 = JSON.parse(readFileSync(rev3Path, "utf8"));
if (rev3.baseline_canonical_requirement_total !== 5825 || rev3.new_canonical_requirement_count !== 27 || rev3.owner_review_canonical_requirement_total !== 5852) throw new Error("REV3 canonical totals are invalid");
const additions = rev3.requirements.map((item, index) => {
  const expectedId = `CCR-${String(5826 + index).padStart(5, "0")}`;
  if (item.id !== expectedId) throw new Error(`REV3 ID continuity failure at ${expectedId}`);
  return {
    id: item.id,
    requirement: item.requirement,
    authoritativeSource: `REV3:${rev3Path.split('/').pop()}#${item.id}`,
    sourceVersion: "current-repository-rev3",
    sourceIds: [item.id], sourceFiles: ["Command_Center_Canonical_Owner_Additions_REV3.json"], sourceKinds: ["owner_addition"],
    architectureBranch: `Category ${item.category}`, architectureOwner: "Current owner-review authority", classification: "OWNER ADDITION", activationPrerequisites: "",
    applicableCompaniesOrCapabilities: [], owningPhases: [], dependencies: [], implementationLocations: [], tests: [], evidence: [],
    truthState: "UNVERIFIED", blocker: "Requirement-level current implementation/test/evidence mapping has not yet been proven for this row."
  };
});

const requirements = [...baseline, ...additions];
const output = {
  schemaVersion: 1,
  status: "TRACEABILITY_SCAFFOLD_UNVERIFIED",
  canonicalRequirementCount: requirements.length,
  historicalBaselineCount: baseline.length,
  rev3Count: additions.length,
  recoveredOriginalCsvSha256: csvSha256,
  warning: "This file preserves every canonical requirement and its recovered source provenance. UNVERIFIED rows are not completion claims. P15.1 closes only after each row has current implementation/test/evidence truth or justified non-applicability.",
  requirements
};
if (write) writeFileSync(resolve(cleanRoom, "evidence/category15-requirement-traceability.json"), JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify({ ok: true, status: output.status, canonicalRequirementCount: requirements.length, firstId: requirements[0]?.id, lastId: requirements.at(-1)?.id, recoveredOriginalCsvSha256: csvSha256 }));
