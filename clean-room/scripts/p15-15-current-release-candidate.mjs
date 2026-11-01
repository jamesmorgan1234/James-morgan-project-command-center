import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * P15.15 — current release-candidate manifest preparation (NO authorization).
 *
 * Writes clean-room/evidence/CURRENT_RELEASE_CANDIDATE.json, the exact candidate
 * identity the existing P15.15 gate reads. This script never creates
 * CURRENT_PRODUCTION_AUTHORIZATION.json: authorization is James's explicit
 * owner decision, not something repository tooling may self-issue.
 *
 * The manifest distinguishes:
 *   - gitSha: the commit whose application source produced the built artifact
 *   - evidenceCommit: the commit that carries this manifest (evidence-only)
 * so an evidence-only commit is never confused with the tested candidate.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const CLEAN_ROOM = resolve(HERE, "..");
const REPO_ROOT = resolve(CLEAN_ROOM, "..");
const EVIDENCE_PATH = "clean-room/evidence/CURRENT_RELEASE_CANDIDATE.json";
const SWEEP_EVIDENCE_PATH = "clean-room/evidence/WHOLE_SYSTEM_FINAL_VERIFICATION.json";
const P13_EVIDENCE_PATH = "clean-room/evidence/P15_13_RELEASE_ARTIFACT_AUDIT.json";
const P14_EVIDENCE_PATH = "clean-room/evidence/P15_14_NONPRODUCTION_ACCEPTANCE.json";
const RELEASE_JSON = process.env.CANDIDATE_DIST ? join(resolve(CLEAN_ROOM, process.env.CANDIDATE_DIST), "release.json") : join(CLEAN_ROOM, "dist-web", "release.json");
const WRITE = process.argv.includes("--write");

const read = (path) => readFileSync(resolve(REPO_ROOT, path), "utf8");
const readJson = (path) => JSON.parse(read(path));
const head = () => execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT }).toString("utf8").trim();
const isSha256 = (value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);

if (!existsSync(RELEASE_JSON)) throw new Error(`Missing built release identity at ${RELEASE_JSON}; build the candidate artifact first`);
const release = JSON.parse(readFileSync(RELEASE_JSON, "utf8"));
for (const field of ["releaseId", "buildHash", "assetManifestHash", "schemaCompatibility"]) {
  if (!release[field]) throw new Error(`Built release identity is missing ${field}`);
}
if (!isSha256(release.buildHash) || !isSha256(release.assetManifestHash)) throw new Error("Release identity hashes are not SHA-256");

const candidateSha = release.releaseId;
if (!/^[a-f0-9]{40}$/.test(candidateSha)) throw new Error(`Candidate release identity is not an immutable commit: ${candidateSha}`);
execFileSync("git", ["cat-file", "-e", `${candidateSha}^{commit}`], { cwd: REPO_ROOT, stdio: "ignore" });
const currentHead = head();

const commitsAfter = execFileSync("git", ["rev-list", "--reverse", `${candidateSha}..${currentHead}`], { cwd: REPO_ROOT })
  .toString("utf8").split("\n").map((line) => line.trim()).filter(Boolean);
const commitSubjects = commitsAfter.map((sha) => ({ sha, subject: execFileSync("git", ["log", "-1", "--format=%s", sha], { cwd: REPO_ROOT }).toString("utf8").trim() }));
if (commitsAfter.length > 0) {
  const nonEvidence = commitSubjects.filter(({ sha }) => {
    const changed = execFileSync("git", ["diff-tree", "--no-commit-id", "--name-only", "-r", sha], { cwd: REPO_ROOT }).toString("utf8").split("\n").filter(Boolean);
    return changed.some((path) => path.startsWith("clean-room/src/") || path.startsWith("clean-room/public/"));
  });
  if (nonEvidence.length > 0) {
    throw new Error(`Application source changed after the built candidate ${candidateSha}: ${nonEvidence.map((entry) => `${entry.sha} ${entry.subject}`).join("; ")}`);
  }
}

const sweep = existsSync(resolve(REPO_ROOT, SWEEP_EVIDENCE_PATH)) ? readJson(SWEEP_EVIDENCE_PATH) : null;
const p13 = existsSync(resolve(REPO_ROOT, P13_EVIDENCE_PATH)) ? readJson(P13_EVIDENCE_PATH) : null;
const p14 = existsSync(resolve(REPO_ROOT, P14_EVIDENCE_PATH)) ? readJson(P14_EVIDENCE_PATH) : null;

const productionOperationId = `cc-production-release:${candidateSha}:${release.buildHash}`;
const body = {
  schemaVersion: "cc-current-release-candidate-v1",
  status: "CANDIDATE_PREPARED_AUTHORIZATION_REQUIRED",
  generatedAt: new Date().toISOString(),
  gitSha: candidateSha,
  releaseIdentity: {
    releaseId: release.releaseId,
    buildHash: release.buildHash,
    assetManifestHash: release.assetManifestHash,
    schemaCompatibility: release.schemaCompatibility
  },
  productionOperationId,
  candidateArtifact: {
    buildCommand: "COMMAND_CENTER_RELEASE_ID=<candidate sha> npm run build:modules && COMMAND_CENTER_RELEASE_ID=<candidate sha> npm run build:browser",
    environment: "development",
    syntheticPreviewData: false,
    note: "The candidate identity is the exact artifact built from the tested application source with no synthetic preview data."
  },
  sourceBinding: {
    applicationSourceRoots: ["clean-room/src", "clean-room/public"],
    testedCandidateIsApplicationSourceCommit: true,
    evidenceCommitsAfterCandidate: commitSubjects,
    evidenceOnlyCommitsDoNotRedefineCandidate: true
  },
  renderedAcceptance: sweep
    ? {
        evidencePath: SWEEP_EVIDENCE_PATH,
        evidenceCommitBound: false,
        driver: sweep.harness?.driver ?? null,
        browser: sweep.harness?.browser ?? null,
        viewports: sweep.viewports ?? [],
        routeCount: sweep.routeCount ?? 0,
        observationCount: sweep.observationCount ?? 0,
        defectCount: sweep.defectCount ?? null,
        syntheticPreviewData: true,
        note: "Route rendering used the synthetic preview acceptance artifact derived from the same application source commit; the candidate artifact itself carries no synthetic runtime data."
      }
    : null,
  priorPhaseEvidence: {
    releaseArtifactAudit: p13 ? { path: P13_EVIDENCE_PATH, headSha: p13.headSha, checkCount: p13.checkCount, failedCheckCount: p13.failedCheckCount, verified: p13.verified } : null,
    nonproductionAcceptance: p14 ? { path: P14_EVIDENCE_PATH, checkCount: p14.checkCount, failedCheckCount: p14.failedCheckCount } : null,
    note: "P15.13/P15.14 receipts are bound to their own audited commits and are preserved, not restated as this candidate's audits."
  },
  ownerAuthorization: {
    required: true,
    granted: false,
    ownerDecisionPath: "clean-room/evidence/CURRENT_PRODUCTION_AUTHORIZATION.json",
    requiredOwnerDecisionFields: { status: "AUTHORIZED", releaseCandidateSha: candidateSha, releaseCandidateManifestHash: "<manifestHash below>", operationId: productionOperationId },
    note: "No owner authorization exists. This manifest only identifies the exact candidate and the exact production operation that would require James's explicit authorization."
  },
  production: {
    deployed: false,
    mergeToMainPerformed: false,
    protectedAssetsChanged: false,
    note: "Production, main, production Supabase/auth and protected release assets remain untouched."
  }
};

const manifestHash = createHash("sha256").update(JSON.stringify(body)).digest("hex");
const manifest = { ...body, manifestHash };
if (WRITE) writeFileSync(resolve(REPO_ROOT, EVIDENCE_PATH), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  path: EVIDENCE_PATH,
  gitSha: manifest.gitSha,
  manifestHash,
  buildHash: manifest.releaseIdentity.buildHash,
  assetManifestHash: manifest.releaseIdentity.assetManifestHash,
  releaseId: manifest.releaseIdentity.releaseId,
  schemaCompatibility: manifest.releaseIdentity.schemaCompatibility,
  productionOperationId,
  evidenceCommitsAfterCandidate: commitsAfter,
  rendered: manifest.renderedAcceptance ? { routeCount: manifest.renderedAcceptance.routeCount, observationCount: manifest.renderedAcceptance.observationCount, defectCount: manifest.renderedAcceptance.defectCount } : null
}, null, 2));
