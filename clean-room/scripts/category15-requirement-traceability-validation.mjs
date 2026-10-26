const EXPECTED_REQUIREMENT_COUNT = 5852;

const nonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const arrayOfNonEmptyStrings = (value) => Array.isArray(value) && value.every(nonEmptyString);
const nullableString = (value) => value === null || typeof value === "string";

function validateTestDimension(value, { allowUnknown = false } = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (!Array.isArray(value.references) || !arrayOfNonEmptyStrings(value.references)) return false;
  if (!nullableString(value.justification)) return false;
  if (allowUnknown && value.applicable === null) return value.references.length === 0 && !nonEmptyString(value.justification);
  if (typeof value.applicable !== "boolean") return false;
  if (value.applicable) return value.references.length > 0 && !nonEmptyString(value.justification);
  return value.references.length === 0 && nonEmptyString(value.justification);
}

function validateTests(value, options) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return ["positive", "negative", "failurePath"].every((key) => validateTestDimension(value[key], options));
}

function validateStructureRow(row, expectedId) {
  if (!(row && typeof row === "object" && !Array.isArray(row)
    && row.id === expectedId
    && nonEmptyString(row.requirement)
    && nonEmptyString(row.authoritativeSource)
    && nonEmptyString(row.sourceVersion)
    && Array.isArray(row.applicableCompaniesOrCapabilities)
    && arrayOfNonEmptyStrings(row.applicableCompaniesOrCapabilities)
    && Array.isArray(row.owningPhases)
    && arrayOfNonEmptyStrings(row.owningPhases)
    && Array.isArray(row.dependencies)
    && arrayOfNonEmptyStrings(row.dependencies)
    && typeof row.dependenciesVerified === "boolean"
    && Array.isArray(row.implementationLocations)
    && arrayOfNonEmptyStrings(row.implementationLocations)
    && validateTests(row.tests, { allowUnknown: true })
    && Array.isArray(row.evidence)
    && arrayOfNonEmptyStrings(row.evidence)
    && typeof row.evidenceVersion === "string"
    && typeof row.evidenceEnvironment === "string"
    && ["UNVERIFIED", "VERIFIED", "NOT_APPLICABLE"].includes(row.truthState)
    && nullableString(row.blocker)
    && nullableString(row.justification))) return false;

  if (row.truthState === "UNVERIFIED") return nonEmptyString(row.blocker) && !nonEmptyString(row.justification);
  if (row.truthState === "VERIFIED") return !nonEmptyString(row.blocker) && !nonEmptyString(row.justification);
  return !nonEmptyString(row.blocker) && nonEmptyString(row.justification);
}

function validateClosedRow(row) {
  const commonClosure = row.applicableCompaniesOrCapabilities.length > 0
    && row.owningPhases.length > 0
    && row.dependenciesVerified === true
    && validateTests(row.tests)
    && row.evidence.length > 0
    && nonEmptyString(row.evidenceVersion)
    && nonEmptyString(row.evidenceEnvironment)
    && !nonEmptyString(row.blocker);

  if (!commonClosure) return false;
  if (row.truthState === "VERIFIED") return row.implementationLocations.length > 0 && !nonEmptyString(row.justification);
  if (row.truthState === "NOT_APPLICABLE") return nonEmptyString(row.justification);
  return false;
}

export function validateRequirementTraceability(traceability, { expectedCount = EXPECTED_REQUIREMENT_COUNT } = {}) {
  const rows = Array.isArray(traceability?.requirements) ? traceability.requirements : [];
  const metadataValid = traceability?.schemaVersion >= 2
    && traceability?.status === "P15_1_REQUIREMENT_CLOSURE"
    && traceability?.generatedFromAuthoritativeSource === true
    && traceability?.canonicalRequirementCount === expectedCount
    && (expectedCount !== EXPECTED_REQUIREMENT_COUNT || (
      traceability?.historicalBaselineCount === 5825
      && traceability?.rev3Count === 27
      && traceability?.recoveredOriginalCsvSha256 === "1437d1f88b514008f418c720118786c9ff1b5f3bd1cf8e9ee2b1aca3879169d2"
    ));

  let verifiedCount = 0;
  let notApplicableCount = 0;
  let unverifiedCount = 0;
  let structurallyInvalidRowCount = 0;
  let closureInvalidRowCount = 0;

  rows.forEach((row, index) => {
    const expectedId = `CCR-${String(index + 1).padStart(5, "0")}`;
    const structureValid = validateStructureRow(row, expectedId);
    if (!structureValid) {
      structurallyInvalidRowCount += 1;
      closureInvalidRowCount += 1;
      return;
    }
    if (row.truthState === "VERIFIED") verifiedCount += 1;
    else if (row.truthState === "NOT_APPLICABLE") notApplicableCount += 1;
    else unverifiedCount += 1;
    if (!validateClosedRow(row)) closureInvalidRowCount += 1;
  });

  const structureValid = metadataValid && rows.length === expectedCount && structurallyInvalidRowCount === 0;
  const closureComplete = structureValid
    && unverifiedCount === 0
    && closureInvalidRowCount === 0
    && verifiedCount + notApplicableCount === expectedCount;

  return {
    structureValid,
    closureComplete,
    metadataValid,
    rowCount: rows.length,
    verifiedCount,
    notApplicableCount,
    unverifiedCount,
    structurallyInvalidRowCount,
    closureInvalidRowCount
  };
}
