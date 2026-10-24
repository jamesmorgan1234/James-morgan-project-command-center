import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
const cleanRoom=process.cwd(); const repoRoot=resolve(cleanRoom,"..");
const writeReport=process.argv.includes("--write"); const requireNonproduction=process.argv.includes("--require-nonproduction"); const verifiedByPriorGates=process.argv.includes("--verified-by-prior-gates");
const roadmap=readFileSync(resolve(repoRoot,"roadmap/master-build-plan-owner-review/14_COMPLETE_188_PHASE_MASTER_BUILD_PLAN.md"),"utf8");
const spec=readFileSync(resolve(repoRoot,"roadmap/master-build-plan-owner-review/15_SPECIFICATION_LOCK_V2.md"),"utf8");
const rev3=JSON.parse(readFileSync(resolve(repoRoot,"roadmap/master-build-plan-owner-review/Command_Center_Canonical_Owner_Additions_REV3.json"),"utf8"));
function tracked(path){try{execFileSync("git",["ls-files","--error-unmatch",path],{cwd:repoRoot,stdio:"ignore"});return true;}catch{return false;}}
function phaseDefined(id){return roadmap.includes(`### ${id} `)||roadmap.includes(`### ${id} —`);} function allTracked(paths){return paths.every(tracked);}
const headSha=execFileSync("git",["rev-parse","HEAD"],{cwd:repoRoot}).toString("utf8").trim();
const exactHeadCiVerified=verifiedByPriorGates&&process.env.CI==="true"&&/^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA??"")&&process.env.GITHUB_SHA===headSha;
const presentStatus=exactHeadCiVerified?"VERIFIED_COMPLETE":"IMPLEMENTED_BUT_UNVERIFIED";
const expectedNew=Array.from({length:27},(_,i)=>`CCR-${String(5826+i).padStart(5,"0")}`);
const observedNew=Array.isArray(rev3.requirements)?rev3.requirements.map((item)=>item.id):[];
const canonicalTotalsValid=/5,852/.test(spec)&&/5,825/.test(spec)&&rev3.baseline_canonical_requirement_total===5825&&rev3.new_canonical_requirement_count===27&&rev3.owner_review_canonical_requirement_total===5852&&expectedNew.every((id,index)=>observedNew[index]===id);
const canonicalLedgerCandidates=["roadmap/master-build-plan-owner-review/02_MASTER_BUILD_PLAN_REQUIREMENT_LEDGER.md","roadmap/master-build-plan-owner-review/Command_Center_Canonical_Requirement_Registry.json","clean-room/evidence/category15-requirement-traceability.json"];
const canonicalLedgerPresent=canonicalLedgerCandidates.some(tracked);
const phases={"P15.1":canonicalLedgerPresent?{status:presentStatus,reason:"canonical individual traceability artifact present; exact-head gate state applied"}:{status:"BLOCKED_SOURCE_ARTIFACT",reason:"final reconciled CCR-00001–CCR-05825 individual canonical ledger/traceability matrix is not present; recovered raw registers cannot substitute for the final reconciled ledger"},"P15.2":{status:presentStatus,reason:exactHeadCiVerified?"semantic every-file audit passed on the exact CI head":"semantic every-file audit is enforced; exact-head CI must pass"}};
const requiredTests={"P15.3":["clean-room/tests/kernel-foundation.test.mjs","clean-room/tests/runtime-integration.test.mjs"],"P15.4":["clean-room/tests/security-foundation.test.mjs","clean-room/tests/finance-platform-foundation.test.mjs"],"P15.5":["clean-room/tests/ui-shell-foundation.test.mjs","clean-room/tests/runtime-visual-structure.test.mjs","clean-room/tests/route-state-closure.test.mjs"],"P15.6":["clean-room/tests/data-platform-recovery.test.mjs","clean-room/tests/recovery-scale-foundation.test.mjs"],"P15.7":["clean-room/tests/agency-foundation.test.mjs"],"P15.8":["clean-room/tests/agency-foundation.test.mjs"],"P15.9":["clean-room/tests/projects-foundation.test.mjs","clean-room/tests/agency-foundation.test.mjs"],"P15.10":["clean-room/tests/personal-ops-foundation.test.mjs","clean-room/tests/agency-foundation.test.mjs"],"P15.11":["clean-room/tests/recovery-scale-foundation.test.mjs","clean-room/tests/category15-release-artifact-audit.test.mjs"],"P15.12":["clean-room/tests/category15-performance-load-soak.test.mjs"]};
for(const [id,paths] of Object.entries(requiredTests)) phases[id]={status:allTracked(paths)&&phaseDefined(id)?presentStatus:"BLOCKED_IMPLEMENTATION",evidence:paths};
const exactIcon="clean-room/public/assets/command-center-approved-icon-512.png";
phases["P15.13"]={status:tracked(exactIcon)&&phaseDefined("P15.13")?presentStatus:"BLOCKED_PROTECTED_ASSET",evidence:[exactIcon,"clean-room/scripts/category15-release-artifact-audit.mjs","clean-room/scripts/build-browser.mjs"]};

const p1515DecisionPath="clean-room/evidence/P15_15_OWNER_DECISION.md";
const p1516RunbookPath="clean-room/evidence/P15_16_PRODUCTION_RUNBOOK.md";
const p1514HarnessNotePath="clean-room/evidence/P15_14_PWA_HARNESS_FLAKE_NOTE.md";
const p1514PreviewSha="39fb4ab2df17f5ad087e21917b7e2f1b3ede481b";
const p1514EvidencePaths=["clean-room/tests/category15-nonproduction-contract-acceptance.test.mjs","clean-room/scripts/category15-pwa-lifecycle.sh","clean-room/scripts/category15-pwa-lifecycle.mjs"];
const p1514AcceptanceTracked=allTracked(p1514EvidencePaths);
const pwaLifecycleVerified=process.env.CATEGORY15_PWA_LIFECYCLE_VERIFIED==="true";
let previewRuntimeUnchanged=false;
let changedSincePreview=[];
try {
  changedSincePreview=execFileSync("git",["diff","--name-only",`${p1514PreviewSha}..HEAD`],{cwd:repoRoot}).toString("utf8").split(/\r?\n/).filter(Boolean);
  const acceptanceOnly=new Set([".github/workflows/spec-lock-v2-clean-room-qa.yml","clean-room/scripts/category15-phase-gate-audit.mjs",...p1514EvidencePaths,p1514HarnessNotePath,p1515DecisionPath,p1516RunbookPath]);
  previewRuntimeUnchanged=changedSincePreview.length>0&&changedSincePreview.every((path)=>acceptanceOnly.has(path));
} catch { previewRuntimeUnchanged=false; }
const p1514Verified=phaseDefined("P15.14")&&exactHeadCiVerified&&p1514AcceptanceTracked&&pwaLifecycleVerified&&previewRuntimeUnchanged;
phases["P15.14"]={
  status:p1514Verified?"VERIFIED_COMPLETE":"PARTIAL",
  reason:p1514Verified?"The already-authorized Vercel Preview runtime at 39fb4ab2 was exercised across all 19 routes, and the exact evidence head changed only acceptance/release-gate infrastructure. Exact-head CI additionally executed isolated real module contracts plus an observed single-session Chrome PWA install/offline/update lifecycle. No production provider or production data was used.":"Preview/browser acceptance exists, but P15.14 remains partial until the isolated module-contract test and observed PWA lifecycle pass on an exact CI evidence head whose diff from the tested Preview runtime is acceptance-only.",
  verification:{testedGitSha:p1514PreviewSha,evidenceHead:headSha,deploymentId:"dpl_BfR5nzueza7PmcZYdLEsoB9usjjw",environment:"preview",dataMode:"explicit synthetic acceptance fixture plus isolated in-memory canonical contracts; no production data",routeCount:19,previewRuntimeUnchanged,pwaLifecycleVerified,changedSincePreview},
  evidence:["https://command-center-preview-ak1c2e863-crestven-holdings.vercel.app","https://github.com/jamesmorgan1234/James-morgan-project-command-center/actions/runs/40041318173",...p1514EvidencePaths,p1514HarnessNotePath],
  remainingBlockers:p1514Verified?[]:["Isolated canonical module/backend contract acceptance has not passed on the exact evidence head","Actual offline-cache replay and waiting-worker update activation have not passed on the exact evidence head"],
  productionReady:false
};

const p1515CandidateSha="e0a4ade6bbe26fbec1cc091c3818241b29ce1295";
let candidateEvidenceOnly=false;
let changedSinceCandidate=[];
try {
  changedSinceCandidate=execFileSync("git",["diff","--name-only",`${p1515CandidateSha}..HEAD`],{cwd:repoRoot}).toString("utf8").split(/\r?\n/).filter(Boolean);
  const allowedEvidenceOnly=new Set([p1515DecisionPath,p1516RunbookPath,p1514HarnessNotePath,"clean-room/scripts/category15-phase-gate-audit.mjs",...p1514EvidencePaths]);
  candidateEvidenceOnly=changedSinceCandidate.length>0&&changedSinceCandidate.every((path)=>allowedEvidenceOnly.has(path));
} catch { candidateEvidenceOnly=false; }
const p1515Verified=phaseDefined("P15.15")&&exactHeadCiVerified&&tracked(p1515DecisionPath)&&tracked(p1516RunbookPath)&&candidateEvidenceOnly&&p1514Verified;
phases["P15.15"]={
  status:p1515Verified?"VERIFIED_COMPLETE":"PARTIAL",
  reason:p1515Verified?"Owner directed continuation and explicitly stated P15.15 is not a stopping boundary. The exact candidate, current production Git baseline, evidence, change scope, rollback preconditions, known limitations, and the still-controlling no-production-mutation constraint are recorded. No production mutation occurred.":"P15.15 evidence/decision package must be tracked and verified on an exact CI evidence head whose diff from the frozen release candidate is evidence-only.",
  verification:{releaseCandidateSha:p1515CandidateSha,evidenceHead:headSha,currentProductionGitBaseline:"855a06b43d152df1bc3c7574cc3f584bf1b51892",candidateEvidenceOnly,changedSinceCandidate,productionMutationAuthorized:false},
  evidence:[p1515DecisionPath,p1516RunbookPath,"https://github.com/jamesmorgan1234/James-morgan-project-command-center/actions/runs/40042995928"]
};
phases["P15.16"]={status:"BLOCKED_OWNER_CONSTRAINT",reason:"P15.16 non-mutating preparation is complete, but the current owner instruction explicitly prohibits merge, production deployment, and production-data modification. Live production delivery/rollback identity must also be resolved from the actual serving platform before any future mutation.",evidence:[p1516RunbookPath],releaseCandidateSha:p1515CandidateSha};
phases["P15.17"]={status:"BLOCKED_DEPENDENCY",reason:"owner acceptance begins only after P15.16 production/live verification passes"};
phases["P15.18"]={status:"BLOCKED_DEPENDENCY",reason:"physical Samsung acceptance requires completed P15.16 live verification, P15.17 owner acceptance, and the real target device"};
const allCategory15DefinitionsPresent=Array.from({length:18},(_,i)=>`P15.${i+1}`).every(phaseDefined);
const nonproductionFailures=Object.entries(phases).filter(([id])=>{const n=Number(id.split(".")[1]);return n>=2&&n<=14;}).filter(([,v])=>!["IMPLEMENTED_BUT_UNVERIFIED","VERIFIED_COMPLETE"].includes(v.status));
const report={schemaVersion:4,verification:{headSha,exactHeadCiVerified},lockedCanonicalRequirementCount:5852,lockedBaselineRequirementCount:5825,lockedRev3RequirementCount:27,canonicalTotalsValid,allCategory15DefinitionsPresent,canonicalLedgerPresent,canonicalLedgerCandidates,phases};
if(writeReport) writeFileSync(resolve(cleanRoom,"category15-phase-status.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({headSha,exactHeadCiVerified,canonicalTotalsValid,allCategory15DefinitionsPresent,canonicalLedgerPresent,p15_1:phases["P15.1"].status,p15_2_through_13:exactHeadCiVerified?"VERIFIED_COMPLETE":"IMPLEMENTED_BUT_UNVERIFIED",p15_14:phases["P15.14"].status,p15_15:phases["P15.15"].status,p15_16:phases["P15.16"].status,pwaLifecycleVerified,previewRuntimeUnchanged,candidateEvidenceOnly,nonproductionFailureCount:nonproductionFailures.length}));
if(!canonicalTotalsValid||!allCategory15DefinitionsPresent||(requireNonproduction&&nonproductionFailures.length)) process.exit(1);
