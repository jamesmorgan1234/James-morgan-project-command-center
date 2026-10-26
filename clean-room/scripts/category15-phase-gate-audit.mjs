import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { expandPhaseManifest, validateEvidenceReceipt } from "./current-authority-lib.mjs";

const cleanRoom = process.cwd();
const repoRoot = resolve(cleanRoom, "..");
const writeReport = process.argv.includes("--write");
const requireNonproduction = process.argv.includes("--require-nonproduction");
const verifiedByPriorGates = process.argv.includes("--verified-by-prior-gates");
const read = (path) => readFileSync(resolve(repoRoot, path), "utf8");
const tracked = (path) => {
  try { execFileSync("git", ["ls-files", "--error-unmatch", path], { cwd: repoRoot, stdio: "ignore" }); return true; }
  catch { return false; }
};
const allTracked = (paths) => paths.every(tracked);
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim();
const exactHeadCiVerified = verifiedByPriorGates && process.env.CI === "true" && /^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA ?? "") && process.env.GITHUB_SHA === headSha;

const manifest = JSON.parse(read("roadmap/master-build-plan-owner-review/23_CURRENT_199_PHASE_MACHINE_MANIFEST.json"));
const { phaseIds } = expandPhaseManifest(manifest);
const phaseSet = new Set(phaseIds);
const spec = read("roadmap/master-build-plan-owner-review/17_SPECIFICATION_LOCK_V2_1.md");
const rev3 = JSON.parse(read("roadmap/master-build-plan-owner-review/Command_Center_Canonical_Owner_Additions_REV3.json"));
const expectedNew = Array.from({ length: 27 }, (_, i) => `CCR-${String(5826 + i).padStart(5, "0")}`);
const observedNew = Array.isArray(rev3.requirements) ? rev3.requirements.map((item) => item.id) : [];
const canonicalTotalsValid = /5,852/.test(spec) && /5,825/.test(spec) && rev3.baseline_canonical_requirement_total === 5825 && rev3.new_canonical_requirement_count === 27 && rev3.owner_review_canonical_requirement_total === 5852 && expectedNew.every((id, index) => observedNew[index] === id);
const allCategory15DefinitionsPresent = Array.from({ length: 18 }, (_, i) => `P15.${i + 1}`).every((id) => phaseSet.has(id));

const authorityAuditPath = "clean-room/current-authority-audit.json";
let authorityAuditVerified = false;
if (existsSync(resolve(repoRoot, authorityAuditPath))) {
  try {
    const audit = JSON.parse(read(authorityAuditPath));
    authorityAuditVerified = audit.ok === true && audit.headSha === headSha && audit.currentPhaseCount === 199 && audit.amendment20SectionCount === 45 && audit.pifMappedCapabilityFamilyCount === 34;
  } catch { authorityAuditVerified = false; }
}

function loadReceipt(id) {
  const path = `clean-room/evidence/phase-receipts/${id.replaceAll(".", "_")}.json`;
  if (!tracked(path) || !existsSync(resolve(repoRoot, path))) return { path, receipt: null, valid: false };
  try {
    const receipt = JSON.parse(read(path));
    return { path, receipt, valid: validateEvidenceReceipt(receipt, { phaseId: id, headSha }) };
  } catch { return { path, receipt: null, valid: false }; }
}

const historicalLedgerCandidates = [
  "roadmap/master-build-plan-owner-review/02_MASTER_BUILD_PLAN_REQUIREMENT_LEDGER.md",
  "roadmap/master-build-plan-owner-review/Command_Center_Canonical_Requirement_Registry.json",
  "clean-room/evidence/category15-requirement-traceability.json"
];
const originalHistoricalLedgerRecovered = false;
const ownerReconciledReplacementPath = "clean-room/evidence/P15_1_OWNER_RECONCILED_REQUIREMENT_AUTHORITY.json";
let ownerReconciledReplacementValid = false;
if (tracked(ownerReconciledReplacementPath) && existsSync(resolve(repoRoot, ownerReconciledReplacementPath))) {
  try {
    const replacement = JSON.parse(read(ownerReconciledReplacementPath));
    ownerReconciledReplacementValid = replacement.status === "OWNER_RECONCILED_AUTHORITY" && replacement.gitSha === headSha && Array.isArray(replacement.evidence) && replacement.evidence.length > 0;
  } catch { ownerReconciledReplacementValid = false; }
}
const canonicalRequirementAuthoritySatisfied = originalHistoricalLedgerRecovered || ownerReconciledReplacementValid;

const phases = {};
phases["P15.1"] = canonicalRequirementAuthoritySatisfied
  ? { status: "VERIFIED_COMPLETE", reason: "Original reconciled historical ledger or explicit owner-reconciled provenance-preserving replacement is bound to this exact head." }
  : { status: "BLOCKED_SOURCE_ARTIFACT", reason: "Original CCR-00001–CCR-05825 ledger remains unavailable and no exact-head owner-reconciled replacement authority is present. Raw registers/file presence cannot substitute." };

const repositoryAuditPath = "clean-room/category15-repository-audit.json";
let semanticReviewVerified = false;
if (existsSync(resolve(repoRoot, repositoryAuditPath))) {
  try {
    const repoAudit = JSON.parse(read(repositoryAuditPath));
    semanticReviewVerified = repoAudit.headSha === headSha && repoAudit.semanticEveryFileReviewComplete === true;
  } catch { semanticReviewVerified = false; }
}
phases["P15.2"] = semanticReviewVerified
  ? { status: "VERIFIED_COMPLETE", reason: "Separately evidenced semantic every-file review is bound to this exact head." }
  : { status: "PARTIAL", reason: "Automated all-file scanning may pass, but semantic every-file review requires a separate exact-head evidence receipt." };

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
  "P15.12": ["clean-room/tests/category15-performance-load-soak.test.mjs"],
  "P15.13": ["clean-room/scripts/category15-release-artifact-audit.mjs", "clean-room/scripts/build-browser.mjs", "clean-room/public/assets/command-center-approved-icon-512.png"],
  "P15.14": ["clean-room/tests/category15-nonproduction-contract-acceptance.test.mjs", "clean-room/tests/owner-auth-proxy-routing.test.mjs", "clean-room/scripts/category15-pwa-lifecycle.mjs"]
};

for (const [id, paths] of Object.entries(requiredTests)) {
  const receipt = loadReceipt(id);
  const foundationsPresent = allTracked(paths) && phaseSet.has(id);
  phases[id] = receipt.valid
    ? { status: "VERIFIED_COMPLETE", reason: "Exact-head semantic/effect evidence receipt validates the full current phase gate.", evidence: [receipt.path, ...paths] }
    : { status: foundationsPresent ? "IMPLEMENTED_BUT_UNVERIFIED" : "BLOCKED_IMPLEMENTATION", reason: foundationsPresent ? "Required foundation/test artifacts are tracked, but tracked-file presence and exact-head CI alone do not prove the full semantic/effect gate." : "Required implementation/test artifacts are missing.", evidence: paths, requiredReceipt: receipt.path };
}

const historicalCandidate = {
  releaseCandidateSha: "9b6d136447def58ad8a4df3f05261f7bd6b7ef80",
  previewDeploymentId: "dpl_9GTPfksYY5En25ne6XdxFbRTQDHW",
  buildHash: "72918429817b12957178f4685f84b6a67ac895d5972517e1dc5b4969cdf301f3",
  assetManifestHash: "b9a76bb84da35231ac7dfc72d430b8372becaf27158dfa3a1fd1e352f00eb2a7",
  status: "HISTORICAL_EVIDENCE_ONLY",
  note: "This frozen historical candidate and its historical owner decision are not authorization for a materially different future candidate."
};

const currentCandidateManifestPath = "clean-room/evidence/CURRENT_RELEASE_CANDIDATE.json";
const currentOwnerDecisionPath = "clean-room/evidence/CURRENT_PRODUCTION_AUTHORIZATION.json";
let currentCandidate = null;
let currentProductionAuthorizationValid = false;
if (tracked(currentCandidateManifestPath) && existsSync(resolve(repoRoot, currentCandidateManifestPath))) {
  try { currentCandidate = JSON.parse(read(currentCandidateManifestPath)); } catch { currentCandidate = null; }
}
if (tracked(currentOwnerDecisionPath) && existsSync(resolve(repoRoot, currentOwnerDecisionPath)) && currentCandidate) {
  try {
    const decision = JSON.parse(read(currentOwnerDecisionPath));
    currentProductionAuthorizationValid = decision.status === "AUTHORIZED" && decision.releaseCandidateSha === currentCandidate.gitSha && decision.releaseCandidateManifestHash === currentCandidate.manifestHash && decision.operationId === currentCandidate.productionOperationId;
  } catch { currentProductionAuthorizationValid = false; }
}
phases["P15.15"] = currentProductionAuthorizationValid
  ? { status: "VERIFIED_COMPLETE", reason: "Current owner authorization is bound to the exact current candidate and production operation.", evidence: [currentCandidateManifestPath, currentOwnerDecisionPath] }
  : { status: "BLOCKED_OWNER_AUTHORIZATION", reason: "No current exact-candidate production authorization is established. Historical authorization is retained only as historical evidence.", historicalCandidate };

phases["P15.16"] = { status: "BLOCKED_DEPENDENCY", reason: "Production deployment/live verification requires a verified current P15.15 authorization for the exact current candidate." };
phases["P15.17"] = { status: "BLOCKED_DEPENDENCY", reason: "Owner acceptance requires completed current production/live verification." };
phases["P15.18"] = { status: "BLOCKED_DEPENDENCY", reason: "Physical Samsung acceptance requires current live verification, owner acceptance, and the real device." };

const nonproductionFailures = Object.entries(phases)
  .filter(([id]) => { const n = Number(id.split(".")[1]); return n >= 2 && n <= 14; })
  .filter(([, value]) => value.status !== "VERIFIED_COMPLETE");

const report = {
  schemaVersion: 8,
  verification: { headSha, exactHeadCiVerified, authorityAuditVerified },
  currentPhaseCount: phaseIds.length,
  lockedCanonicalRequirementCount: 5852,
  lockedBaselineRequirementCount: 5825,
  lockedRev3RequirementCount: 27,
  canonicalTotalsValid,
  allCategory15DefinitionsPresent,
  historicalLedgerCandidates,
  canonicalRequirementAuthoritySatisfied,
  historicalCandidate,
  currentCandidateManifestPath,
  currentOwnerDecisionPath,
  phases
};
if (writeReport) writeFileSync(resolve(cleanRoom, "category15-phase-status.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ headSha, exactHeadCiVerified, authorityAuditVerified, canonicalTotalsValid, currentPhaseCount: phaseIds.length, p15_1: phases["P15.1"].status, p15_2: phases["P15.2"].status, p15_3_through_14_unverified_count: nonproductionFailures.length, p15_15: phases["P15.15"].status, p15_16: phases["P15.16"].status }));
if (!canonicalTotalsValid || !allCategory15DefinitionsPresent || !authorityAuditVerified || (requireNonproduction && nonproductionFailures.length)) process.exit(1);
