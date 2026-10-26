import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const cleanRoom = resolve(here, "..");
const repoRoot = resolve(cleanRoom, "..");
const sourcePath = resolve(cleanRoom, "evidence/P15_1_A00_REQUIREMENT_SOURCE_GROUNDING.json");
const outputPath = resolve(cleanRoom, "evidence/P15_1_A00_IMPLEMENTATION_CANDIDATE_MAP.generated.json");
const textExtensions = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".json", ".md", ".txt", ".csv", ".yml", ".yaml", ".html", ".css", ".scss", ".sql", ".toml", ".xml", ".webmanifest"]);
const stopwords = new Set(["about","after","again","against","also","and","are","because","been","before","being","between","both","but","can","cannot","could","does","doing","each","from","have","into","itself","more","must","not","only","other","our","out","over","same","should","such","than","that","the","their","them","then","there","these","they","this","those","through","under","until","very","was","were","what","when","where","which","while","with","within","without","would"]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function decodeSourceGrounding() {
  const document = JSON.parse(readFileSync(sourcePath, "utf8"));
  const compressed = Buffer.from(document.payload.base64, "base64");
  if (sha256(compressed) !== document.payload.gzipSha256) throw new Error("A00 grounding gzip hash mismatch");
  const decoded = gunzipSync(compressed);
  if (sha256(decoded) !== document.payload.decodedSha256) throw new Error("A00 grounding decoded hash mismatch");
  const rawRows = JSON.parse(decoded.toString("utf8"));
  const columns = document.payload.columns;
  const rows = rawRows.map((values) => Object.fromEntries(columns.map((column, index) => [column, values[index]])));
  if (rows.length !== 489 || document.canonicalIdCount !== 489) throw new Error(`Expected 489 A00 rows, got ${rows.length}`);
  return { document, rows };
}

function tokenize(value) {
  return [...new Set(String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !stopwords.has(token)))];
}

function fileRole(path) {
  if (path.startsWith("clean-room/tests/")) return "test";
  if (path.startsWith("roadmap/")) return "roadmap";
  if (path.startsWith("clean-room/src/")) return "implementation";
  if (path.startsWith("clean-room/public/")) return "implementation";
  if (path.startsWith("supabase/")) return "implementation";
  if (path.startsWith("clean-room/scripts/")) return "verification-tooling";
  if (path.startsWith(".github/")) return "ci";
  if (path.startsWith("clean-room/evidence/")) return "evidence";
  if (/^[A-Z0-9_ -]+\.(?:md|txt)$/.test(path)) return "governance-standard";
  return "support";
}

function candidateScore(requirementTokens, requirementNormalized, corpusText, corpusTokens) {
  if (!requirementTokens.length) return 0;
  let overlap = 0;
  for (const token of requirementTokens) if (corpusTokens.has(token)) overlap += 1;
  const ratio = overlap / requirementTokens.length;
  const exact = requirementNormalized.length >= 12 && corpusText.includes(requirementNormalized) ? 1 : 0;
  const coverageBonus = overlap >= Math.min(3, requirementTokens.length) ? 0.08 : 0;
  return Math.min(1, ratio + exact * 0.35 + coverageBonus);
}

function prepareCorpus() {
  const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: repoRoot }).toString("utf8").split("\0").filter(Boolean).sort();
  const corpus = [];
  for (const path of tracked) {
    const abs = resolve(repoRoot, path);
    if (!existsSync(abs)) continue;
    const bytes = readFileSync(abs);
    if (bytes.length > 768000 || bytes.includes(0)) continue;
    if (!textExtensions.has(extname(path).toLowerCase()) && bytes.length > 160000) continue;
    const text = bytes.toString("utf8").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
    corpus.push({ path, role: fileRole(path), text, tokens: new Set(tokenize(text)), sha256: sha256(bytes) });
  }
  return { tracked, corpus };
}

function rankCandidates(row, corpus, allowedRoles, limit) {
  const requirementNormalized = String(row.requirement).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  const requirementTokens = tokenize(row.requirement);
  return corpus
    .filter((item) => allowedRoles.has(item.role))
    .map((item) => ({ item, score: candidateScore(requirementTokens, requirementNormalized, item.text, item.tokens) }))
    .filter(({ score }) => score >= 0.42)
    .sort((a, b) => b.score - a.score || a.item.path.localeCompare(b.item.path))
    .slice(0, limit)
    .map(({ item, score }) => ({ path: item.path, fileSha256: item.sha256, lexicalScore: Number(score.toFixed(4)), role: item.role }));
}

export function buildA00CandidateMap() {
  const { document, rows } = decodeSourceGrounding();
  const { tracked, corpus } = prepareCorpus();
  const mappedRows = rows.map((row) => {
    const implementationCandidates = rankCandidates(row, corpus, new Set(["implementation", "verification-tooling", "governance-standard"]), 8);
    const testCandidates = rankCandidates(row, corpus, new Set(["test"]), 8);
    const roadmapCandidates = rankCandidates(row, corpus, new Set(["roadmap"]), 8);
    const evidenceCandidates = rankCandidates(row, corpus, new Set(["evidence", "ci"]), 5);
    return {
      id: row.id,
      requirement: row.requirement,
      canonicalSourceIds: row.canonicalSourceIds,
      canonicalSourceFiles: row.canonicalSourceFiles,
      canonicalSourceKinds: row.canonicalSourceKinds,
      classification: row.classification,
      activationPrerequisites: row.activationPrerequisites,
      candidateMapping: { implementationCandidates, testCandidates, roadmapCandidates, evidenceCandidates },
      truthState: "UNVERIFIED",
      blocker: implementationCandidates.length && testCandidates.length
        ? "Candidate implementation/test locations are grounded by repository content similarity but still require semantic phase/dependency/test/evidence verification before promotion."
        : "No sufficient implementation/test candidate pair was established by conservative repository-content matching; semantic mapping remains required."
    };
  });
  const summary = {
    total: mappedRows.length,
    withImplementationCandidates: mappedRows.filter((row) => row.candidateMapping.implementationCandidates.length).length,
    withTestCandidates: mappedRows.filter((row) => row.candidateMapping.testCandidates.length).length,
    withRoadmapCandidates: mappedRows.filter((row) => row.candidateMapping.roadmapCandidates.length).length,
    withImplementationAndTestCandidates: mappedRows.filter((row) => row.candidateMapping.implementationCandidates.length && row.candidateMapping.testCandidates.length).length,
    verified: 0,
    unverified: mappedRows.length
  };
  return {
    schemaVersion: "cc-p15.1-a00-grounded-candidate-map-v1",
    status: "CANDIDATE_MAPPING_ONLY_NOT_VERIFICATION",
    scope: "HISTORICAL_A00_ONLY",
    sourceAuthority: document.sourceAuthority,
    sourceGroundingArtifact: "clean-room/evidence/P15_1_A00_REQUIREMENT_SOURCE_GROUNDING.json",
    sourceGroundingDecodedSha256: document.payload.decodedSha256,
    repositoryHead: execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim(),
    trackedFileCount: tracked.length,
    semanticTruthBoundary: {
      candidateSimilarityIsNotVerification: true,
      noTruthStatePromotion: true,
      requiredPromotionInputs: ["owning phase", "dependencies", "implementation location", "positive test", "negative test", "failure-path test", "versioned environment evidence"]
    },
    summary,
    rows: mappedRows
  };
}

export function validateCandidateMap(report) {
  if (report.status !== "CANDIDATE_MAPPING_ONLY_NOT_VERIFICATION") throw new Error("candidate-map status must remain non-verifying");
  if (report.rows.length !== 489 || report.summary.total !== 489) throw new Error("candidate-map row count mismatch");
  if (new Set(report.rows.map((row) => row.id)).size !== 489) throw new Error("candidate-map IDs must be unique");
  if (report.rows.some((row) => row.truthState !== "UNVERIFIED" || !row.blocker)) throw new Error("candidate-map cannot promote truth state");
  if (report.summary.verified !== 0 || report.summary.unverified !== 489) throw new Error("candidate-map summary cannot imply closure");
  return true;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = buildA00CandidateMap();
  validateCandidateMap(report);
  if (process.argv.includes("--write")) writeFileSync(outputPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({
    status: report.status,
    repositoryHead: report.repositoryHead,
    trackedFileCount: report.trackedFileCount,
    ...report.summary
  }));
}
