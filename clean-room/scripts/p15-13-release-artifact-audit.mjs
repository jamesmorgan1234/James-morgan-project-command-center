import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * P15.13 — release-artifact audit.
 *
 * Fails closed unless the shipped browser build is a real, internally
 * consistent release artifact whose immutable identity is the audited commit,
 * whose protected Command Center icon is the approved byte-identical asset, and
 * whose structure carries exactly one HTML entrypoint and one service worker.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const CLEAN_ROOM = resolve(HERE, "..");
const REPO_ROOT = resolve(CLEAN_ROOM, "..");
const OUT = join(CLEAN_ROOM, "dist-web");
const WRITE = process.argv.includes("--write");
const EVIDENCE_PATH = "clean-room/evidence/P15_13_RELEASE_ARTIFACT_AUDIT.json";
const APPROVED_ICON = "clean-room/public/assets/command-center-approved-icon-512.png";
const APPROVED_ICON_SHA256 = "fa48e34b6240ca37ad74492dec150cfebaed60aed404707f79b68b9b3157b7aa";

const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT }).toString("utf8").trim();
const checks = [];
function check(name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), ...(detail === undefined ? {} : { detail }) });
}
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function isSha256(value) { return typeof value === "string" && /^[a-f0-9]{64}$/.test(value); }
function readJson(path) { return JSON.parse(readFileSync(path, "utf8")); }

if (!existsSync(OUT) || !statSync(OUT).isDirectory()) {
  throw new Error("dist-web is missing; run `COMMAND_CENTER_RELEASE_ID=$(git rev-parse HEAD) npm run build:browser` before the P15.13 audit");
}

let auditStdout = "";
let auditExit = 0;
try {
  auditStdout = execFileSync(process.execPath, ["scripts/category15-release-artifact-audit.mjs", "--require-protected-assets"], {
    cwd: CLEAN_ROOM,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  });
} catch (error) {
  auditExit = typeof error.status === "number" ? error.status : 1;
  auditStdout = `${error.stdout ?? ""}${error.stderr ?? ""}`;
}

let audit = null;
try { audit = JSON.parse(auditStdout); } catch { audit = null; }

check("artifact audit executes and exits zero under --require-protected-assets", auditExit === 0 && audit !== null, { exit: auditExit });
check("artifact audit reports a structurally valid release", audit?.artifactStructurallyValid === true, audit?.structuralErrors ?? "no report");
check("artifact audit reports no readiness blockers", Array.isArray(audit?.readinessBlockers) && audit.readinessBlockers.length === 0, audit?.readinessBlockers);
check("release candidate is ready", audit?.releaseCandidateReady === true);
check("protected Command Center icon is the approved asset", audit?.protectedIcon?.state === "verified" && audit?.protectedIcon?.expectedSha256 === APPROVED_ICON_SHA256, audit?.protectedIcon);
check("exactly one HTML entrypoint at /index.html", Array.isArray(audit?.htmlEntrypoints) && audit.htmlEntrypoints.length === 1 && audit.htmlEntrypoints[0] === "/index.html", audit?.htmlEntrypoints);
check("exactly one service worker at /sw.js", Array.isArray(audit?.serviceWorkers) && audit.serviceWorkers.length === 1 && audit.serviceWorkers[0] === "/sw.js", audit?.serviceWorkers);

const iconBytes = readFileSync(join(REPO_ROOT, APPROVED_ICON));
const iconActual = sha256(iconBytes);
check("approved icon bytes hash to the frozen protected hash", iconActual === APPROVED_ICON_SHA256, iconActual);

const releasePath = join(OUT, "release.json");
const pwaAssetsPath = join(OUT, "pwa-assets.json");
const manifestPath = join(OUT, "manifest.webmanifest");
const indexText = readFileSync(join(OUT, "index.html"), "utf8");
const swText = readFileSync(join(OUT, "sw.js"), "utf8");
const release = existsSync(releasePath) ? readJson(releasePath) : null;
const pwaAssets = existsSync(pwaAssetsPath) ? readJson(pwaAssetsPath) : null;
const manifest = existsSync(manifestPath) ? readJson(manifestPath) : null;

check("release identity is present", release !== null && typeof release.releaseId === "string" && release.releaseId.length > 0, release?.releaseId);
check("release identity is the immutable audited commit", release?.releaseId === headSha, { releaseId: release?.releaseId, headSha });
check("release build hash and asset manifest hash are SHA-256", isSha256(release?.buildHash) && isSha256(release?.assetManifestHash), release);
check("runtime schema compatibility is the frozen snapshot schema", release?.schemaCompatibility === "cc-runtime-snapshot-v1", release?.schemaCompatibility);
check("service worker embeds the audited release id", swText.includes(`const RELEASE_ID = "${headSha}"`), headSha);
check("document head advertises the audited release id", indexText.includes(`content="${headSha}"`), headSha);
check("no unreplaced release placeholders remain", !indexText.includes("__COMMAND_CENTER_RELEASE_ID__") && !swText.includes("__COMMAND_CENTER_RELEASE_ID__"));
check("protected icon is marked verified in the built assets manifest", pwaAssets?.approvedIcon === "verified" && pwaAssets?.expectedSha256 === APPROVED_ICON_SHA256, pwaAssets);
check("manifest wires the approved protected icon and stays rooted", manifest?.start_url === "/" && manifest?.scope === "/" && Array.isArray(manifest?.icons) && manifest.icons.some((icon) => icon.src === "/assets/command-center-approved-icon-512.png"), manifest?.icons);
check("release artifact contains a bounded number of shipped files", Number.isInteger(audit?.artifactFileCount) && audit.artifactFileCount > 0 && audit.artifactFileCount < 5000, audit?.artifactFileCount);

const failures = checks.filter((entry) => !entry.passed);
const report = Object.freeze({
  schemaVersion: "cc-p15-13-release-artifact-audit-v1",
  headSha,
  releaseIdentity: Object.freeze({
    releaseId: release?.releaseId ?? null,
    buildHash: release?.buildHash ?? null,
    assetManifestHash: release?.assetManifestHash ?? null,
    schemaCompatibility: release?.schemaCompatibility ?? null
  }),
  artifactFileCount: audit?.artifactFileCount ?? 0,
  protectedIcon: Object.freeze({ state: pwaAssets?.approvedIcon ?? "missing", expectedSha256: APPROVED_ICON_SHA256 }),
  checks: Object.freeze(checks),
  checkCount: checks.length,
  failedCheckCount: failures.length,
  verified: failures.length === 0
});

if (WRITE) writeFileSync(join(REPO_ROOT, EVIDENCE_PATH), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
if (!report.verified) {
  console.error(`P15.13 release-artifact audit failed ${failures.length}/${checks.length} checks`);
  process.exit(1);
}
