import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const cleanRoom = process.cwd();
const repoRoot = resolve(cleanRoom, "..");
const evidencePath = resolve(cleanRoom, "evidence/P15_16_LIVE_VERIFICATION.json");
const acceptanceRunbookPath = resolve(cleanRoom, "evidence/P15_16_PRODUCTION_RUNBOOK.md");
const statusPath = resolve(cleanRoom, "category15-phase-status.json");
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim();
const exactHeadCiVerified = process.env.CI === "true" && /^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA ?? "") && process.env.GITHUB_SHA === headSha;

if (!existsSync(evidencePath)) throw new Error("P15.16 live-verification evidence is missing");
if (!existsSync(acceptanceRunbookPath)) throw new Error("P15.16/P15.17/P15.18 acceptance runbook evidence is missing");
const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));

const expected = {
  deploymentId: "dpl_4bEW1KDjxYd2qEu719VNCFv9wcDL",
  stableDomain: "https://command-center-preview-alpha.vercel.app",
  releaseId: "ba6993dbf16ab3c371c6a3d7b71a3963361d6f8b",
  buildHash: "db5445b04e1def7f8b7a65a2cb043d700ab15eeab3697c2546acbc5aa02d843e",
  assetManifestHash: "e4f0b3f2651b9cddb174abf25c5ae18f7d602020dbfbde3acc1f5eb8ae7c6338",
  schemaCompatibility: "cc-runtime-snapshot-v1",
  mainSha: "855a06b43d152df1bc3c7574cc3f584bf1b51892"
};

const currentAuthorization = evidence.authorization?.currentEvidenceRebindAuthorization;
const checks = {
  phase: evidence.phase === "P15.16",
  status: evidence.status === "VERIFIED_COMPLETE",
  target: evidence.production?.target === "production",
  ready: evidence.production?.readyState === "READY",
  deploymentId: evidence.production?.deploymentId === expected.deploymentId,
  productionSourceSha: evidence.production?.sourceSha === expected.releaseId,
  stableDomain: evidence.production?.stableDomain === expected.stableDomain,
  releaseId: evidence.releaseIdentity?.releaseId === expected.releaseId,
  sourceSha: evidence.releaseIdentity?.sourceSha === expected.releaseId,
  buildHash: evidence.releaseIdentity?.buildHash === expected.buildHash,
  assetManifestHash: evidence.releaseIdentity?.assetManifestHash === expected.assetManifestHash,
  schemaCompatibility: evidence.releaseIdentity?.schemaCompatibility === expected.schemaCompatibility,
  currentAuthorization: currentAuthorization?.status === "AUTHORIZED"
    && currentAuthorization?.authorizedBy === "James Morgan"
    && currentAuthorization?.deploymentId === expected.deploymentId
    && currentAuthorization?.sourceSha === expected.releaseId,
  noSupabaseMutationAuthorized: currentAuthorization?.constraints?.supabaseMutationAuthorized === false,
  noSpendingAuthorized: currentAuthorization?.constraints?.spendingAuthorized === false,
  p15_17NotAuthorized: currentAuthorization?.constraints?.p15_17Authorized === false,
  p15_18NotAuthorized: currentAuthorization?.constraints?.p15_18Authorized === false,
  releaseJsonMatched: evidence.liveChecks?.releaseJsonMatched === true,
  htmlReleaseMetaMatched: evidence.liveChecks?.htmlReleaseMetaMatched === true,
  authProxyRule: evidence.liveChecks?.authProxyRulePresentInDeployedSource === true,
  authProxyRegression: evidence.liveChecks?.authProxyRoutingRegressionPassed === true,
  directRestRegression: evidence.liveChecks?.privateRestDirectRoutingRegressionPassed === true,
  manifestServed: evidence.liveChecks?.manifestServed === true,
  approvedManifestIcon: evidence.liveChecks?.approvedManifestIconPathMatched === true,
  serviceWorkerServed: evidence.liveChecks?.serviceWorkerServed === true,
  serviceWorkerReleaseId: evidence.liveChecks?.serviceWorkerReleaseIdMatched === true,
  routeContract: evidence.liveChecks?.declaredRouteCount === 19 && evidence.liveChecks?.exactHeadRouteContractPassed === true && Array.isArray(evidence.routes) && evidence.routes.length === 19,
  liveRouteSpotChecks: evidence.liveChecks?.liveRouteShellSpotCheckCount === 19 && Array.isArray(evidence.liveChecks?.liveRouteShellSpotChecks) && evidence.liveChecks.liveRouteShellSpotChecks.length === 19,
  runtimeErrors: evidence.liveChecks?.runtimeErrorsObserved === 0,
  noSyntheticRuntime: evidence.liveChecks?.syntheticPreviewRuntimePresent === false,
  noProductionDataMutation: evidence.liveChecks?.productionDataMutationRequired === false
    && evidence.liveChecks?.productionDataModified === false
    && evidence.verificationScope?.supabaseMutationPerformed === false,
  noPaidAction: evidence.verificationScope?.paidActionPerformed === false,
  p15_17NotStarted: evidence.verificationScope?.p15_17Started === false,
  p15_18NotStarted: evidence.verificationScope?.p15_18Started === false,
  fallbackMain: evidence.fallback?.mainSha === expected.mainSha,
  p15_1Visible: typeof evidence.knownBlockers?.["P15.1"] === "string" && evidence.knownBlockers["P15.1"].includes("BLOCKED_SOURCE_ARTIFACT")
};

const failedChecks = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
if (failedChecks.length) {
  console.error(JSON.stringify({ phase: "P15.16", status: "FAILED_EVIDENCE_AUDIT", failedChecks }));
  process.exit(1);
}

if (!existsSync(statusPath)) throw new Error("category15-phase-status.json must be generated by the prior Category 15 gate before the production-live audit");
const status = JSON.parse(readFileSync(statusPath, "utf8"));
const p1515Verified = status.phases?.["P15.15"]?.status === "VERIFIED_COMPLETE";
if (process.env.CI === "true" && (!exactHeadCiVerified || !p1515Verified)) {
  console.error(JSON.stringify({ phase: "P15.16", status: "FAILED_EXACT_HEAD_GATE", exactHeadCiVerified, p1515Verified }));
  process.exit(1);
}

status.phases["P15.16"] = {
  status: exactHeadCiVerified && p1515Verified ? "VERIFIED_COMPLETE" : "IMPLEMENTED_BUT_UNVERIFIED",
  reason: "The authorized exact-head clean-room runtime is deployed to Vercel production and verified live against the release/build/asset/schema identity. The same-origin owner-Auth proxy and direct private-REST boundary remain regression-tested, all 19 declared live routes serve the exact production shell, the synthetic Preview fixture is absent, manifest and service worker are live, the recent Vercel runtime-error scan is clear, GitHub main remains unchanged, and no production-data mutation or paid action was performed. P15.17 owner acceptance and P15.18 physical-device acceptance were not started.",
  verification: evidence
};
status.phases["P15.17"] = {
  status: "READY_OWNER_ACCEPTANCE",
  reason: "The currently deployed candidate addresses the Samsung sign-in transport failure with a same-origin Auth path. Owner acceptance remains real evidence required by the roadmap, not permission to continue and not a phrase gate. James should retry the stable production URL in Chrome before installing; a success advances acceptance, while any failure reopens the Auth defect.",
  preparationComplete: true,
  permissionToContinueRequired: false,
  exactPhraseRequired: false,
  evidence: ["clean-room/evidence/P15_16_PRODUCTION_RUNBOOK.md", "clean-room/evidence/P15_16_LIVE_VERIFICATION.json"]
};
status.phases["P15.18"] = {
  status: "PREPARED_PENDING_OWNER_AND_DEVICE_EVIDENCE",
  reason: "All non-device Samsung acceptance preparation is complete. Formal P15.18 execution remains dependent on P15.17 owner acceptance and the real target Samsung device; login/passkey/fingerprint/update/offline/navigation/visual evidence cannot be self-certified by CI.",
  preparationComplete: true,
  executionStarted: false,
  requiresPhysicalSamsung: true,
  exactPhraseRequired: false,
  evidence: ["clean-room/evidence/P15_16_PRODUCTION_RUNBOOK.md"]
};
writeFileSync(statusPath, JSON.stringify(status, null, 2) + "\n");

console.log(JSON.stringify({
  headSha,
  exactHeadCiVerified,
  p15_16: status.phases["P15.16"].status,
  p15_17: status.phases["P15.17"].status,
  p15_17_preparationComplete: status.phases["P15.17"].preparationComplete,
  p15_17_permissionToContinueRequired: status.phases["P15.17"].permissionToContinueRequired,
  p15_18: status.phases["P15.18"].status,
  p15_18_preparationComplete: status.phases["P15.18"].preparationComplete,
  p15_1: status.phases?.["P15.1"]?.status,
  productionDeploymentId: expected.deploymentId,
  productionReleaseId: expected.releaseId,
  runtimeErrorsObserved: 0
}));
