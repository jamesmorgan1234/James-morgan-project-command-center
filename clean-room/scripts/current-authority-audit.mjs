import {assertCurrentArchitectureAuthority} from './p15-1-current-architecture-authority.mjs';
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertAcyclic,
  assertResumeState,
  categoryDependencies,
  deriveAtomicRequirements,
  expandPhaseManifest,
  extractAmendmentSections,
  extractRoadmapPhaseIds,
  validateSectionCoverage
} from "./current-authority-lib.mjs";
import { validateCurrentRequirementClassificationOverlay } from "./current-requirement-classification.mjs";

const cleanRoom = process.cwd();
const repoRoot = resolve(cleanRoom, "..");
const writeReport = process.argv.includes("--write");
const read = (path) => readFileSync(resolve(repoRoot, path), "utf8");
const readJson = (path) => JSON.parse(read(path));
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim();

const manifestPath = "roadmap/master-build-plan-owner-review/23_CURRENT_199_PHASE_MACHINE_MANIFEST.json";
const ownershipPath = "roadmap/master-build-plan-owner-review/24_AMENDMENT20_REQUIREMENT_OWNERSHIP.json";
const classificationOverlayPath = "roadmap/master-build-plan-owner-review/25_CURRENT_REQUIREMENT_CLASSIFICATION_OVERRIDES.json";
const recoveredAuthorityPath = "clean-room/evidence/P15_1_RECOVERED_ORIGINAL_LEDGER_AUTHORITY.json";
const roadmap22Path = "roadmap/master-build-plan-owner-review/22_COMPLETE_199_PHASE_CURRENT_MASTER_ROADMAP_AUDIT_CANDIDATE.md";
const roadmap14Path = "roadmap/master-build-plan-owner-review/14_COMPLETE_188_PHASE_MASTER_BUILD_PLAN.md";
const amendment20Path = "roadmap/master-build-plan-owner-review/20_ECOSYSTEM_INTELLIGENCE_CONTINUOUS_LEARNING_ARCHITECTURE_AMENDMENT.md";
const pointerPath = "roadmap/portfolio-future-architecture/124_CURRENT_AUTHORITY_AND_RESUME_POINTER.md";
const familyPath = "roadmap/portfolio-future-architecture/126_34_FAMILY_POST_AUDIT_COVERAGE_CROSSWALK.md";

const errors = [];
const check = (label, fn) => {
  try { return fn(); }
  catch (error) { errors.push({ label, message: error instanceof Error ? error.message : String(error) }); return null; }
};

const manifest = readJson(manifestPath);
const ownership = readJson(ownershipPath);
const recoveredAuthority = readJson(recoveredAuthorityPath);
const classificationOverlay = readJson(classificationOverlayPath);
const classificationOverlayValid = check("current-requirement-classification-overlay", () => validateCurrentRequirementClassificationOverlay(classificationOverlay, {
  canonicalJsonSha256: recoveredAuthority.canonicalJson.sha256,
  canonicalCsvSha256: recoveredAuthority.canonicalCsv.sha256,
  historicalBaselineCount: recoveredAuthority.canonicalJson.rowCount
}));
if (classificationOverlayValid) {
  const ccr1 = classificationOverlay.overrides.find((entry) => entry.id === "CCR-00001");
  if (!ccr1) errors.push({ label: "current-requirement-classification-overlay", message: "CCR-00001 current classification correction is missing" });
  else if (ccr1.historicalArchitectureBranch !== "A06" || ccr1.effectiveArchitectureBranch !== "A00" || ccr1.canonicalSourceIds?.[0] !== "F-0001") {
    errors.push({ label: "current-requirement-classification-overlay", message: "CCR-00001 classification correction does not preserve the historical A06/F-0001 anchor and effective A00 authority" });
  }
}
check("single-current-architecture-authority", () => assertCurrentArchitectureAuthority(manifest, classificationOverlay));
const expanded = check("phase-manifest", () => expandPhaseManifest(manifest));

if (expanded) {
  check("category-dag", () => assertAcyclic(manifest.categories.map((c) => c.id), categoryDependencies(manifest), "category DAG"));
  check("pif-dag", () => assertAcyclic(Object.keys(manifest.pif.edges), manifest.pif.edges, "PIF DAG"));
  const pifOrder = manifest.pif.executionOrder ?? [];
  const positions = new Map(pifOrder.map((id, index) => [id, index]));
  for (const [id, deps] of Object.entries(manifest.pif.edges ?? {})) {
    for (const dep of deps) if ((positions.get(dep) ?? Infinity) >= (positions.get(id) ?? -1)) errors.push({ label: "pif-order", message: `${dep} must precede ${id}` });
  }

  const currentRoadmapIds = extractRoadmapPhaseIds(read(roadmap22Path));
  const currentSet = new Set(currentRoadmapIds);
  if (currentSet.size !== 199) errors.push({ label: "roadmap22", message: `Roadmap 22 unique manifest IDs ${currentSet.size} != 199` });
  for (const id of expanded.phaseIds) if (!currentSet.has(id)) errors.push({ label: "roadmap22", message: `manifest phase ${id} missing from Roadmap 22` });

  const historicalText = read(roadmap14Path);
  const historicalIds = [...historicalText.matchAll(/^###\s+(P\d+\.\d+)\s+/gm)].map((m) => m[1]);
  const historicalSet = new Set(historicalIds);
  if (historicalSet.size !== 188) errors.push({ label: "historical-preservation", message: `historical unique phase IDs ${historicalSet.size} != 188` });
  for (const id of historicalSet) if (!expanded.categoryByPhase.has(id)) errors.push({ label: "historical-preservation", message: `historical phase ${id} missing from current manifest` });

  const expectedAdditions = ["P0.11", ...Array.from({ length: 10 }, (_, i) => `PIF.${i + 1}`)];
  const additions = expanded.phaseIds.filter((id) => !historicalSet.has(id));
  if (JSON.stringify(additions.sort()) !== JSON.stringify(expectedAdditions.sort())) errors.push({ label: "additions", message: `unexpected current additions: ${additions.join(", ")}` });
}

const amendmentText = read(amendment20Path);
const sections = extractAmendmentSections(amendmentText);
check("amendment20-sections", () => validateSectionCoverage(sections, ownership));
const atomicRequirements = [];
for (const section of sections) {
  const mapping = ownership.sections?.[String(section.number)];
  const atoms = deriveAtomicRequirements(section);
  if (atoms.length === 0) errors.push({ label: "atomic-requirements", message: `section ${section.number} produced no atomic requirements` });
  for (const atom of atoms) {
    for (const owner of mapping?.owners ?? []) {
      if (expanded && !expanded.categoryByPhase.has(owner)) errors.push({ label: "ownership", message: `${atom.id} owner ${owner} is not a current phase` });
    }
    atomicRequirements.push({ ...atom, section: section.number, sectionTitle: section.title, owners: mapping?.owners ?? [], testClasses: mapping?.testClasses ?? [] });
  }
}

const familyText = read(familyPath);
const additiveMarker = "## Ecosystem-intelligence additive mapping (PIF)";
const additive = familyText.includes(additiveMarker) ? familyText.slice(familyText.indexOf(additiveMarker)) : "";
const familyNumbers = [...additive.matchAll(/^\|\s*(\d+)\./gm)].map((m) => Number(m[1]));
const uniqueFamilyNumbers = new Set(familyNumbers);
if (uniqueFamilyNumbers.size !== 34 || [...Array(34)].some((_, i) => !uniqueFamilyNumbers.has(i + 1))) errors.push({ label: "34-family-pif-crosswalk", message: "PIF additive mapping must contain exactly families 1-34" });

check("resume-state", () => assertResumeState(read(pointerPath)));
if (!manifest.supersession?.phaseCount || !manifest.supersession?.resumeState || !manifest.supersession?.historicalIds) errors.push({ label: "supersession", message: "machine manifest lacks required supersession fields" });

const report = {
  schemaVersion: 1,
  headSha,
  ok: errors.length === 0,
  currentPhaseCount: expanded?.phaseIds.length ?? null,
  categoryCount: manifest.categories?.length ?? null,
  pifExecutionOrder: manifest.pif?.executionOrder ?? [],
  amendment20SectionCount: sections.length,
  amendment20AtomicRequirementCount: atomicRequirements.length,
  amendment20AtomicRequirements: atomicRequirements,
  pifMappedCapabilityFamilyCount: uniqueFamilyNumbers.size,
  currentRequirementClassificationOverrideCount: classificationOverlay.overrides?.length ?? 0,
  errors
};

if (writeReport) writeFileSync(resolve(cleanRoom, "current-authority-audit.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ headSha, ok: report.ok, currentPhaseCount: report.currentPhaseCount, amendment20SectionCount: report.amendment20SectionCount, amendment20AtomicRequirementCount: report.amendment20AtomicRequirementCount, pifMappedCapabilityFamilyCount: report.pifMappedCapabilityFamilyCount, currentRequirementClassificationOverrideCount: report.currentRequirementClassificationOverrideCount, errorCount: errors.length }));
if (!report.ok) process.exit(1);
