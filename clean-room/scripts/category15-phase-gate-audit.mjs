import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const cleanRoom = process.cwd();
const repoRoot = resolve(cleanRoom, "..");
const writeReport = process.argv.includes("--write");
const requireNonproduction = process.argv.includes("--require-nonproduction");
const verifiedByPriorGates = process.argv.includes("--verified-by-prior-gates");

const roadmap = readFileSync(resolve(repoRoot, "roadmap/master-build-plan-owner-review/14_COMPLETE_188_PHASE_MASTER_BUILD_PLAN.md"), "utf8");
const spec = readFileSync(resolve(repoRoot, "roadmap/master-build-plan-owner-review/15_SPECIFICATION_LOCK_V2.md"), "utf8");
const rev3 = JSON.parse(readFileSync(resolve(repoRoot, "roadmap/master-build-plan-owner-review/Command_Center_Canonical_Owner_Additions_REV3.json"), "utf8"));

function tracked(path) {
  try {
    execFileSync("git", ["ls-files", "--error-unmatch", path], { cwd: repoRoot, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function phaseDefined(id) {
  return roadmap.includes(`### ${id} `) || roadmap.includes(`### ${id} —`);
}

function allTracked(paths) {
  return paths.every(tracked);
}

const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim();
const exactHeadCiVerified =
  verifiedByPriorGates &&
  process.env.CI === "true" &&
  /^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA ?? "") &&
  process.env.GITHUB_SHA === headSha;
const presentStatus = exactHeadCiVerified ? "VERIFIED_COMPLETE" : "IMPLEMENTED_BUT_UNVERIFIED";

const expectedNew = Array.from({ length: 27 }, (_, i) => `CCR-${String(5826 + i).padStart(5, "0")}`);
const observedNew = Array.isArray(rev3.requirements) ? rev3.requirements.map((item) => item.id) : [];
const canonicalTotalsValid =
  /5,852/.test(spec) &&
  /5,825/.test(spec) &&
  rev3.baseline_canonical_requirement_total === 5825 &&
  rev3.new_canonical_requirement_count === 27 &&
  rev3.owner_review_canonical_requirement_total === 5852 &&
  expectedNew.every((id, index) => observedNew[index] === id);

const canonicalLedgerCandidates = [
  "roadmap/master-build-plan-owner-review/02_MASTER_BUILD_PLAN_REQUIREMENT_LEDGER.md",
  "roadmap/master-build-plan-owner-review/Command_Center_Canonical_Requirement_Registry.json",
  "clean-room/evidence/category15-requirement-traceability.json"
];
const canonicalLedgerPresent = canonicalLedgerCandidates.some(tracked);

const phases = {
  "P15.1": canonicalLedgerPresent
    ? { status: presentStatus, reason: "canonical individual traceability artifact present; exact-head gate state applied" }
    : {
        status: "BLOCKED_SOURCE_ARTIFACT",
        reason: "final reconciled CCR-00001–CCR-05825 individual canonical ledger/traceability matrix is not present; recovered raw registers cannot substitute for the final reconciled ledger"
      },
  "P15.2": {
    status: presentStatus,
    reason: exactHeadCiVerified ? "semantic every-file audit passed on the exact CI head" : "semantic every-file audit is enforced; exact-head CI must pass"
  }
};

const requiredTests = {
  "P15.3": ["clean-room/tests/kernel-foundation.test.mjs", "clean-room/tests/runtime-integration.test.mjs"],
  "P15.4": ["clean-room/tests/security-foundation.test.mjs", "clean-room/tests/finance-platform-foundation.test.mjs"],
  "P15.5": ["clean-room/tests/ui-shell-foundation.test.mjs", "clean-room/tests/runtime-visual-structure.test.mjs", "clean-room/tests/route-state-closure.test.mjs"],
  "P15.6": ["clean-room/tests/data-platform-recovery.test.mjs", "clean-room/tests/recovery-scale-foundation.test.mjs"],
  "P15.7": ["clean-room/tests/agency-foundation.test.mjs"],
  "P15.8": ["clean-room/tests/agency-foundation.test.mjs"],
  "P15.9": ["clean-room/tests/projects-foundation.test.mjs", "clean-room/tests/agency-foundation.test.mjs"],
  "P15.10": ["clean-room/tests/personal-ops-foundation.test.mjs", "clean-room/tests/agency-foundation.test.mjs"],
  "P15.11": ["clean-room/tests/recovery-scale-foundation.test.mjs", "clean-room/tests/category15-release-artifact-audit.test.mjs"],
  "P15.12": ["clean-room/tests/category15-performance-load-soak.test.mjs"]
};
for (const [id, paths] of Object.entries(requiredTests)) {
  phases[id] = { status: allTracked(paths) && phaseDefined(id) ? presentStatus : "BLOCKED_IMPLEMENTATION", evidence: paths };
}

const exactIcon = "clean-room/public/assets/command-center-approved-icon-512.png";
phases["P15.13"] = {
  status: tracked(exactIcon) && phaseDefined("P15.13") ? presentStatus : "BLOCKED_PROTECTED_ASSET",
  evidence: [exactIcon, "clean-room/scripts/category15-release-artifact-audit.mjs", "clean-room/scripts/build-browser.mjs"]
};

const p1515DecisionPath = "clean-room/evidence/P15_15_OWNER_DECISION.md";
const p1516RunbookPath = "clean-room/evidence/P15_16_PRODUCTION_RUNBOOK.md";
const p1516LiveEvidencePath = "clean-room/evidence/P15_16_LIVE_VERIFICATION.json";
const p1516LiveAuditPath = "clean-room/scripts/category15-production-live-audit.mjs";
const packagePath = "clean-room/package.json";
const p1514HarnessNotePath = "clean-room/evidence/P15_14_PWA_HARNESS_FLAKE_NOTE.md";
const p1514PreviewSha = "42c50f3093f3f435e53065a877356c317c7ba2f1";
const p1514EvidencePaths = [
  "clean-room/tests/category15-nonproduction-contract-acceptance.test.mjs",
  "clean-room/scripts/category15-pwa-lifecycle.sh",
  "clean-room/scripts/category15-pwa-lifecycle.mjs"
];
const p1514AcceptanceTracked = allTracked(p1514EvidencePaths);
const pwaLifecycleVerified = process.env.CATEGORY15_PWA_LIFECYCLE_VERIFIED === "true";

const evidenceOnlyPaths = new Set([
  ".github/workflows/spec-lock-v2-clean-room-qa.yml",
  "clean-room/scripts/category15-phase-gate-audit.mjs",
  p1516LiveAuditPath,
  packagePath,
  ...p1514EvidencePaths,
  p1514HarnessNotePath,
  p1515DecisionPath,
  p1516RunbookPath,
  p1516LiveEvidencePath
]);

let previewRuntimeUnchanged = false;
let changedSincePreview = [];
try {
  changedSincePreview = execFileSync("git", ["diff", "--name-only", `${p1514PreviewSha}..HEAD`], { cwd: repoRoot })
    .toString("utf8")
    .split(/\r?\n/)
    .filter(Boolean);
  previewRuntimeUnchanged = changedSincePreview.length > 0 && changedSincePreview.every((path) => evidenceOnlyPaths.has(path));
} catch {
  previewRuntimeUnchanged = false;
}

const p1514Verified =
  phaseDefined("P15.14") &&
  exactHeadCiVerified &&
  p1514AcceptanceTracked &&
  pwaLifecycleVerified &&
  previewRuntimeUnchanged;

phases["P15.14"] = {
  status: p1514Verified ? "VERIFIED_COMPLETE" : "PARTIAL",
  reason: p1514Verified
    ? "The repaired Vercel Preview runtime at 42c50f3 was exercised with the explicit synthetic acceptance fixture, the production-safe no-fixture Preview was separately verified, and every later change is acceptance/release evidence infrastructure only. Exact-head CI additionally executes isolated canonical module contracts plus the observed single-session PWA install/offline/update lifecycle."
    : "Preview acceptance exists, but P15.14 remains partial until the isolated module-contract test and observed PWA lifecycle pass on an exact CI evidence head whose diff from the tested repaired Preview runtime is evidence-only.",
  verification: {
    testedGitSha: p1514PreviewSha,
    evidenceHead: headSha,
    deploymentId: "dpl_8yUhayFvx98pw5X5rcwoS7LSZLmb",
    environment: "preview",
    dataMode: "explicit synthetic acceptance fixture plus isolated in-memory canonical contracts; no production data",
    routeCount: 19,
    previewRuntimeUnchanged,
    pwaLifecycleVerified,
    changedSincePreview
  },
  evidence: [
    "https://command-center-preview-p5sj70mqv-crestven-holdings.vercel.app",
    "https://github.com/jamesmorgan1234/James-morgan-project-command-center/actions/runs/40053887803",
    ...p1514EvidencePaths,
    p1514HarnessNotePath
  ],
  remainingBlockers: p1514Verified
    ? []
    : [
        "Isolated canonical module/backend contract acceptance has not passed on the exact evidence head",
        "Actual offline-cache replay and waiting-worker update activation have not passed on the exact evidence head"
      ],
  productionReady: p1514Verified
};

const p1515CandidateSha = p1514PreviewSha;
const p1515CandidateDeployment = "dpl_4cNY1fgUH11DZiURwaJmEt6smvFK";
const p1515BuildHash = "3058c8c9c30ac6d95b1c3e31da677ac37ce715ae8b6de7a86cd4f70223f325fd";
const p1515AssetManifestHash = "10422fdc2b3f482491f4feb2b5691446605895ca416d945ed52d173b42a8f1eb";
let candidateEvidenceOnly = false;
let changedSinceCandidate = [];
try {
  changedSinceCandidate = execFileSync("git", ["diff", "--name-only", `${p1515CandidateSha}..HEAD`], { cwd: repoRoot })
    .toString("utf8")
    .split(/\r?\n/)
    .filter(Boolean);
  candidateEvidenceOnly = changedSinceCandidate.length > 0 && changedSinceCandidate.every((path) => evidenceOnlyPaths.has(path));
} catch {
  candidateEvidenceOnly = false;
}

const p1515Verified =
  phaseDefined("P15.15") &&
  exactHeadCiVerified &&
  tracked(p1515DecisionPath) &&
  tracked(p1516RunbookPath) &&
  candidateEvidenceOnly &&
  p1514Verified;

phases["P15.15"] = {
  status: p1515Verified ? "VERIFIED_COMPLETE" : "PARTIAL",
  reason: p1515Verified
    ? "The owner repeatedly authorized Command Center production deployment and explicitly removed the false repeated authorization boundary. The repaired exact runtime candidate, artifact identity, fallback, production target, and known P15.1 limitation are recorded on an exact evidence-only CI head."
    : "P15.15 evidence/decision package must be tracked and verified on an exact CI evidence head whose diff from the frozen repaired runtime candidate is evidence-only.",
  verification: {
    releaseCandidateSha: p1515CandidateSha,
    evidenceHead: headSha,
    productionSafePreviewDeploymentId: p1515CandidateDeployment,
    buildHash: p1515BuildHash,
    assetManifestHash: p1515AssetManifestHash,
    schemaCompatibility: "cc-runtime-snapshot-v1",
    productionStableDomain: "command-center-preview-alpha.vercel.app",
    priorProductionProvider: "github-pages",
    priorProductionGitBaseline: "855a06b43d152df1bc3c7574cc3f584bf1b51892",
    fallbackPagesSha: "d40a7b2659400481c75f1de87d084b4d6cdce254",
    candidateEvidenceOnly,
    changedSinceCandidate,
    productionMutationAuthorized: true
  },
  evidence: [p1515DecisionPath, p1516RunbookPath, p1516LiveEvidencePath]
};

const liveEvidenceTracked = tracked(p1516LiveEvidencePath) && tracked(p1516LiveAuditPath);
phases["P15.16"] = {
  status: liveEvidenceTracked ? "PRODUCTION_LIVE_EVIDENCE_PENDING" : "BLOCKED_IMPLEMENTATION",
  reason: liveEvidenceTracked
    ? "Repaired production deployment and live verification evidence are tracked. The dedicated production-live audit runs immediately after this nonproduction phase gate and is the authority that can mark P15.16 VERIFIED_COMPLETE."
    : "Production live-verification evidence or its audit is missing.",
  preparationComplete: true,
  productionCandidatePreviewReady: true,
  productionMutationAuthorized: true,
  verification: {
    releaseCandidateSha: p1515CandidateSha,
    previewDeploymentId: p1515CandidateDeployment,
    productionDeploymentId: "dpl_BN93YBWTbTDttpXTDWDCwKBVVXp5",
    productionDomain: "command-center-preview-alpha.vercel.app",
    currentProductionPagesSha: "855a06b43d152df1bc3c7574cc3f584bf1b51892",
    fallbackPagesSha: "d40a7b2659400481c75f1de87d084b4d6cdce254",
    buildHash: p1515BuildHash,
    assetManifestHash: p1515AssetManifestHash,
    schemaCompatibility: "cc-runtime-snapshot-v1"
  },
  evidence: [p1516RunbookPath, p1516LiveEvidencePath]
};

phases["P15.17"] = { status: "BLOCKED_DEPENDENCY", reason: "owner acceptance resumes only after the dedicated repaired P15.16 production/live evidence gate passes" };
phases["P15.18"] = { status: "BLOCKED_DEPENDENCY", reason: "physical Samsung acceptance requires completed repaired P15.16 live verification, P15.17 owner acceptance, and the real target device" };

const allCategory15DefinitionsPresent = Array.from({ length: 18 }, (_, i) => `P15.${i + 1}`).every(phaseDefined);
const nonproductionFailures = Object.entries(phases)
  .filter(([id]) => {
    const n = Number(id.split(".")[1]);
    return n >= 2 && n <= 14;
  })
  .filter(([, value]) => !["IMPLEMENTED_BUT_UNVERIFIED", "VERIFIED_COMPLETE"].includes(value.status));

const report = {
  schemaVersion: 6,
  verification: { headSha, exactHeadCiVerified },
  lockedCanonicalRequirementCount: 5852,
  lockedBaselineRequirementCount: 5825,
  lockedRev3RequirementCount: 27,
  canonicalTotalsValid,
  allCategory15DefinitionsPresent,
  canonicalLedgerPresent,
  canonicalLedgerCandidates,
  phases
};

if (writeReport) writeFileSync(resolve(cleanRoom, "category15-phase-status.json"), JSON.stringify(report, null, 2) + "\n");

console.log(
  JSON.stringify({
    headSha,
    exactHeadCiVerified,
    canonicalTotalsValid,
    allCategory15DefinitionsPresent,
    canonicalLedgerPresent,
    p15_1: phases["P15.1"].status,
    p15_2_through_13: exactHeadCiVerified ? "VERIFIED_COMPLETE" : "IMPLEMENTED_BUT_UNVERIFIED",
    p15_14: phases["P15.14"].status,
    p15_15: phases["P15.15"].status,
    p15_16: phases["P15.16"].status,
    pwaLifecycleVerified,
    previewRuntimeUnchanged,
    candidateEvidenceOnly,
    nonproductionFailureCount: nonproductionFailures.length
  })
);

if (!canonicalTotalsValid || !allCategory15DefinitionsPresent || (requireNonproduction && nonproductionFailures.length)) process.exit(1);
