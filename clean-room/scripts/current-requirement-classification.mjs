const SCHEMA_VERSION = 1;
const STATUS = "CURRENT_REQUIREMENT_CLASSIFICATION_OVERLAY";

function requiredString(value, label) {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new Error(`${label} is required`);
  return normalized;
}

function uniqueNonEmpty(values, label) {
  if (!Array.isArray(values) || values.length === 0) throw new Error(`${label} must be a non-empty array`);
  const normalized = values.map((value) => requiredString(value, label));
  if (new Set(normalized).size !== normalized.length) throw new Error(`${label} must be unique`);
  return normalized;
}

function sameOrderedStrings(left, right) {
  return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => value === right[index]);
}

export function validateCurrentRequirementClassificationOverlay(document, options = {}) {
  if (!document || typeof document !== "object") throw new Error("current requirement classification overlay is required");
  if (document.schemaVersion !== SCHEMA_VERSION) throw new Error(`unsupported current requirement classification schema: ${document.schemaVersion}`);
  if (document.status !== STATUS) throw new Error(`invalid current requirement classification status: ${document.status}`);
  if (document.rules?.historicalSourceIsImmutable !== true || document.rules?.canonicalIdsAreImmutable !== true || document.rules?.sourceIdsAreImmutable !== true || document.rules?.effectiveClassificationOverridesHistoricalForCurrentConsumers !== true || document.rules?.historicalClassificationRemainsAuditable !== true) {
    throw new Error("current requirement classification immutability/effective-authority rules are incomplete");
  }
  const sourceAuthority = document.sourceAuthority ?? {};
  requiredString(sourceAuthority.canonicalJsonSha256, "sourceAuthority.canonicalJsonSha256");
  requiredString(sourceAuthority.canonicalCsvSha256, "sourceAuthority.canonicalCsvSha256");
  if (!Number.isSafeInteger(sourceAuthority.historicalBaselineCount) || sourceAuthority.historicalBaselineCount < 1) throw new Error("sourceAuthority.historicalBaselineCount must be a positive safe integer");
  if (options.canonicalJsonSha256 && sourceAuthority.canonicalJsonSha256 !== options.canonicalJsonSha256) throw new Error("current requirement classification JSON source authority mismatch");
  if (options.canonicalCsvSha256 && sourceAuthority.canonicalCsvSha256 !== options.canonicalCsvSha256) throw new Error("current requirement classification CSV source authority mismatch");
  if (options.historicalBaselineCount && sourceAuthority.historicalBaselineCount !== options.historicalBaselineCount) throw new Error("current requirement classification historical count mismatch");
  requiredString(document.currentAuthority?.roadmap, "currentAuthority.roadmap");
  requiredString(document.currentAuthority?.manifest, "currentAuthority.manifest");
  if (!Array.isArray(document.overrides)) throw new Error("current requirement classification overrides must be an array");
  const seen = new Set();
  for (const entry of document.overrides) {
    const id = requiredString(entry?.id, "override.id");
    if (!/^CCR-\d{5}$/.test(id)) throw new Error(`invalid canonical requirement ID in classification overlay: ${id}`);
    if (seen.has(id)) throw new Error(`duplicate current requirement classification override: ${id}`);
    seen.add(id);
    requiredString(entry.requirement, `${id}.requirement`);
    uniqueNonEmpty(entry.canonicalSourceIds, `${id}.canonicalSourceIds`);
    uniqueNonEmpty(entry.canonicalSourceFiles, `${id}.canonicalSourceFiles`);
    requiredString(entry.historicalArchitectureBranch, `${id}.historicalArchitectureBranch`);
    requiredString(entry.historicalArchitectureOwner, `${id}.historicalArchitectureOwner`);
    requiredString(entry.effectiveArchitectureBranch, `${id}.effectiveArchitectureBranch`);
    requiredString(entry.effectiveArchitectureOwner, `${id}.effectiveArchitectureOwner`);
    requiredString(entry.rationale, `${id}.rationale`);
    if (entry.historicalArchitectureBranch === entry.effectiveArchitectureBranch && entry.historicalArchitectureOwner === entry.effectiveArchitectureOwner) {
      throw new Error(`${id}: current classification override is a no-op`);
    }
  }
  return true;
}

export function indexCurrentRequirementClassificationOverrides(document) {
  validateCurrentRequirementClassificationOverlay(document);
  return new Map(document.overrides.map((entry) => [entry.id, entry]));
}

export function resolveCurrentRequirementClassification(historicalRow, document) {
  validateCurrentRequirementClassificationOverlay(document);
  const id = requiredString(historicalRow?.id ?? historicalRow?.canonical_id, "historicalRow.id");
  const entry = document.overrides.find((candidate) => candidate.id === id);
  const historicalBranch = requiredString(historicalRow?.architectureBranch ?? historicalRow?.architecture_branch, `${id}.historical architecture branch`);
  const historicalOwner = requiredString(historicalRow?.architectureOwner ?? historicalRow?.architecture_owner, `${id}.historical architecture owner`);
  if (!entry) {
    return Object.freeze({
      id,
      historicalArchitectureBranch: historicalBranch,
      historicalArchitectureOwner: historicalOwner,
      effectiveArchitectureBranch: historicalBranch,
      effectiveArchitectureOwner: historicalOwner,
      classificationSource: "historical-source"
    });
  }
  const requirement = String(historicalRow?.requirement ?? historicalRow?.canonical_text ?? "");
  const sourceIds = historicalRow?.sourceIds ?? historicalRow?.canonicalSourceIds ?? historicalRow?.source_ids ?? [];
  const sourceFiles = historicalRow?.sourceFiles ?? historicalRow?.canonicalSourceFiles ?? historicalRow?.source_files ?? [];
  if (requirement !== entry.requirement) throw new Error(`${id}: historical requirement text does not match current classification overlay anchor`);
  if (!sameOrderedStrings(sourceIds, entry.canonicalSourceIds)) throw new Error(`${id}: historical source IDs do not match current classification overlay anchor`);
  if (!sameOrderedStrings(sourceFiles, entry.canonicalSourceFiles)) throw new Error(`${id}: historical source files do not match current classification overlay anchor`);
  if (historicalBranch !== entry.historicalArchitectureBranch) throw new Error(`${id}: historical architecture branch does not match current classification overlay anchor`);
  if (historicalOwner !== entry.historicalArchitectureOwner) throw new Error(`${id}: historical architecture owner does not match current classification overlay anchor`);
  return Object.freeze({
    id,
    historicalArchitectureBranch: historicalBranch,
    historicalArchitectureOwner: historicalOwner,
    effectiveArchitectureBranch: entry.effectiveArchitectureBranch,
    effectiveArchitectureOwner: entry.effectiveArchitectureOwner,
    classificationSource: "current-authority-overlay"
  });
}

export function effectiveRequirementIdsForBranch(historicalBranchIds, branch, document) {
  validateCurrentRequirementClassificationOverlay(document);
  const target = requiredString(branch, "branch");
  const ids = new Set(historicalBranchIds);
  for (const entry of document.overrides) {
    const wasInTarget = entry.historicalArchitectureBranch === target;
    const isInTarget = entry.effectiveArchitectureBranch === target;
    if (wasInTarget && !isInTarget) ids.delete(entry.id);
    if (!wasInTarget && isInTarget) ids.add(entry.id);
  }
  return Object.freeze([...ids].sort());
}
