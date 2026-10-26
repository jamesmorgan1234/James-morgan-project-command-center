import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildA00CandidateMap } from "./p15-1-a00-grounded-candidate-map.mjs";
import { resolveA00Traceability } from "./p15-1-a00-traceability-lib.mjs";

function normalizeLimit(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
    throw new Error("A00 unresolved report limit must be an integer from 1 to 100");
  }
  return parsed;
}

function candidatePriority(row) {
  const implementationScore = row.candidateMapping.implementationCandidates[0]?.lexicalScore ?? 0;
  const testScore = row.candidateMapping.testCandidates[0]?.lexicalScore ?? 0;
  return row.candidateMapping.implementationCandidates.length > 0 && row.candidateMapping.testCandidates.length > 0
    ? Math.min(implementationScore, testScore)
    : 0;
}

export function buildA00UnresolvedProgressReport({ limit = 15 } = {}) {
  const boundedLimit = normalizeLimit(limit);
  const candidateMap = buildA00CandidateMap();
  const traceability = resolveA00Traceability();
  const resolvedById = new Map(traceability.resolvedRows.map((row) => [row.id, row]));

  const unresolved = candidateMap.rows
    .filter((row) => {
      const current = resolvedById.get(row.id);
      if (!current) throw new Error(`A00 candidate row ${row.id} is absent from resolved traceability`);
      return current.truthState !== "VERIFIED" && current.truthState !== "NOT_APPLICABLE";
    })
    .map((row) => ({
      id: row.id,
      requirement: row.requirement,
      canonicalSourceIds: row.canonicalSourceIds,
      canonicalSourceFiles: row.canonicalSourceFiles,
      canonicalSourceKinds: row.canonicalSourceKinds,
      classification: row.classification,
      activationPrerequisites: row.activationPrerequisites,
      candidatePriorityScore: candidatePriority(row),
      candidateMapping: row.candidateMapping
    }))
    .sort((a, b) =>
      b.candidatePriorityScore - a.candidatePriorityScore ||
      a.id.localeCompare(b.id)
    );

  if (unresolved.length !== traceability.closureSummary.unverified) {
    throw new Error(
      `A00 unresolved report mismatch: source-grounded=${unresolved.length}, traceability=${traceability.closureSummary.unverified}`
    );
  }

  return {
    schemaVersion: "cc-p15.1-a00-unresolved-progress-report-v1",
    status: "SOURCE_GROUNDED_CANDIDATE_DISCOVERY_ONLY",
    scope: "HISTORICAL_A00_ONLY",
    repositoryHead: candidateMap.repositoryHead,
    sourceAuthority: candidateMap.sourceAuthority,
    sourceGroundingDecodedSha256: candidateMap.sourceGroundingDecodedSha256,
    closureSummary: traceability.closureSummary,
    traceabilityFragments: traceability.traceabilityFragments,
    semanticTruthBoundary: {
      candidateSimilarityIsNotVerification: true,
      noTruthStatePromotion: true,
      reportDoesNotCloseRequirements: true
    },
    unresolvedCandidateCount: unresolved.length,
    emittedCandidateCount: Math.min(boundedLimit, unresolved.length),
    candidates: unresolved.slice(0, boundedLimit)
  };
}

function cliLimit(argv) {
  const token = argv.find((value) => value.startsWith("--limit="));
  return token ? normalizeLimit(token.slice("--limit=".length)) : 15;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = buildA00UnresolvedProgressReport({ limit: cliLimit(process.argv.slice(2)) });
  console.log(JSON.stringify(report, null, 2));
}
