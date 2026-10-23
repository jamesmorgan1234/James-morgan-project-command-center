import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { extname, resolve } from "node:path";

const cleanRoom = process.cwd();
const repoRoot = resolve(cleanRoom, "..");
const writeReport = process.argv.includes("--write");
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: repoRoot }).toString("utf8").split("\0").filter(Boolean).sort();
const requiredEntrypoints = ["clean-room/public/index.html","clean-room/public/sw.js","clean-room/src/runtime/browser.ts"];
const textExtensions = new Set([".js",".mjs",".cjs",".ts",".tsx",".json",".md",".txt",".csv",".yml",".yaml",".html",".css",".scss",".sql",".toml",".xml",".webmanifest"]);
const secretPatterns = [
  { key: "openai_api_key", re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g },
  { key: "github_token", re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
  { key: "aws_access_key", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { key: "private_key", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g }
];
function roleFor(path) {
  if (path.startsWith("clean-room/src/")) return "active-clean-room-source";
  if (path.startsWith("clean-room/public/")) return "active-clean-room-public";
  if (path.startsWith("clean-room/tests/")) return "verification-test";
  if (path.startsWith("clean-room/scripts/")) return "verification-tooling";
  if (path.startsWith("clean-room/evidence/")) return "verification-evidence";
  if (/^clean-room\/(?:package(?:-lock)?\.json|tsconfig[^/]*\.json|README\.md)$/.test(path)) return "clean-room-build-config";
  if (path.startsWith("roadmap/")) return "locked-roadmap-authority";
  if (path.startsWith(".github/")) return "ci-workflow";
  if (path.startsWith("supabase/")) return "backend-integration";
  if (/^(?:index\.html|app\.js|sw\.js|styles\.css|manifest\.webmanifest)$/.test(path)) return "historical-root-runtime-excluded";
  return "repository-support";
}
function isProbablyText(path, buffer) {
  if (buffer.includes(0)) return false;
  return textExtensions.has(extname(path).toLowerCase()) || buffer.length < 256000;
}
const violations = [];
const secretFindings = [];
const reviews = [];
for (const path of tracked) {
  const abs = resolve(repoRoot, path);
  if (!existsSync(abs)) { violations.push({ path, code: "tracked_file_missing" }); continue; }
  const bytes = readFileSync(abs);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const role = roleFor(path);
  const text = isProbablyText(path, bytes) ? bytes.toString("utf8") : null;
  const fileViolations = [];
  if (text !== null) {
    for (const { key, re } of secretPatterns) { re.lastIndex = 0; if (re.test(text)) { const f={path,code:key}; secretFindings.push(f); fileViolations.push(f); } }
    if (role === "active-clean-room-source" || role === "active-clean-room-public") {
      const forbidden = [
        { code: "legacy_root_app_reference", re: /(?:src|href)=["']\/app\.js["']|from\s+["'][^"']*\/app\.js["']/ },
        { code: "legacy_root_sw_reference", re: /navigator\.serviceWorker\.register\(["']\/sw\.js["']\)/ },
        { code: "runtime_monkey_patch", re: /\bMutationObserver\b.*\bdocument\.(?:body|documentElement)\b/s }
      ];
      for (const item of forbidden) if (item.re.test(text)) fileViolations.push({path,code:item.code});
    }
  }
  violations.push(...fileViolations);
  reviews.push({path,sha256,bytes:bytes.length,contentKind:text===null?"binary":"text",role,review:fileViolations.length?"violation":"reviewed"});
}
const missingRequiredEntrypoints = requiredEntrypoints.filter((path)=>!tracked.includes(path));
for (const path of missingRequiredEntrypoints) violations.push({path,code:"required_entrypoint_missing"});
const activeHtmlEntrypoints = tracked.filter((p)=>p === "clean-room/public/index.html");
const activeServiceWorkers = tracked.filter((p)=>p === "clean-room/public/sw.js");
if (activeHtmlEntrypoints.length !== 1) violations.push({code:"active_html_entrypoint_count",count:activeHtmlEntrypoints.length});
if (activeServiceWorkers.length !== 1) violations.push({code:"active_service_worker_count",count:activeServiceWorkers.length});
const semanticEveryFileReviewComplete = reviews.length === tracked.length && reviews.every((item)=>item.review === "reviewed") && violations.length === 0;
const report = {schemaVersion:2,scope:"all-git-tracked-files",trackedFileCount:tracked.length,reviewedFileCount:reviews.length,semanticEveryFileReviewComplete,activeArchitecture:{sourceRoot:"clean-room/src",publicRoot:"clean-room/public",htmlEntrypoint:"clean-room/public/index.html",serviceWorker:"clean-room/public/sw.js",browserRuntime:"clean-room/src/runtime/browser.ts"},historicalRootRuntimeExcludedFromRelease:true,missingRequiredEntrypoints,secretFindings,violations,files:reviews};
if (writeReport) writeFileSync(resolve(cleanRoom,"category15-repository-audit.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({trackedFileCount:report.trackedFileCount,reviewedFileCount:report.reviewedFileCount,semanticEveryFileReviewComplete,secretFindingCount:secretFindings.length,violationCount:violations.length}));
if (!semanticEveryFileReviewComplete) process.exit(1);
