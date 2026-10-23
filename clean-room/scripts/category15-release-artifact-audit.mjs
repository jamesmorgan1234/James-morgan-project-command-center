import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT = join(ROOT, "dist-web");
const REQUIRE_PROTECTED_ASSETS = process.argv.includes("--require-protected-assets");
const APPROVED_ICON_PATH = "/assets/command-center-approved-icon-512.png";
const APPROVED_ICON_SHA256 = "fa48e34b6240ca37ad74492dec150cfebaed60aed404707f79b68b9b3157b7aa";
const secretPattern = /(sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|xoxb-[A-Za-z0-9-]{12,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/g;
const textExts = new Set([".js", ".mjs", ".cjs", ".json", ".html", ".css", ".webmanifest", ".txt"]);

async function exists(path) { try { await stat(path); return true; } catch { return false; } }
async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files.sort();
}
function webPath(path) { return `/${relative(OUT, path).replaceAll("\\", "/")}`; }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function isSha256(value) { return /^[a-f0-9]{64}$/i.test(value ?? ""); }

if (!await exists(OUT)) throw new Error("dist-web is missing; run the clean-room build before the artifact audit");
const files = await walk(OUT);
const webFiles = new Set(files.map(webPath));
const structuralErrors = [];
const readinessBlockers = [];
const required = ["/index.html", "/sw.js", "/manifest.webmanifest", "/release.json", "/pwa-assets.json", "/app.css", "/app/runtime/browser.js"];
for (const path of required) if (!webFiles.has(path)) structuralErrors.push(`missing required artifact ${path}`);

const htmlEntrypoints = [...webFiles].filter((path) => path.endsWith("/index.html") || path === "/index.html");
if (htmlEntrypoints.length !== 1 || htmlEntrypoints[0] !== "/index.html") structuralErrors.push(`expected exactly one release HTML entrypoint, found ${htmlEntrypoints.join(", ") || "none"}`);
const serviceWorkers = [...webFiles].filter((path) => /(^|\/)(sw|service-worker)\.js$/i.test(path));
if (serviceWorkers.length !== 1 || serviceWorkers[0] !== "/sw.js") structuralErrors.push(`expected exactly one release service worker, found ${serviceWorkers.join(", ") || "none"}`);
const forbiddenRuntimeSegments = ["rebuild-vnext/", "legacy/", "archive/", "app-integrity-repair.js", "/service-worker.js"];
for (const path of webFiles) if (forbiddenRuntimeSegments.some((segment) => path.includes(segment))) structuralErrors.push(`legacy runtime payload included: ${path}`);

const indexText = await readFile(join(OUT, "index.html"), "utf8");
const swText = await readFile(join(OUT, "sw.js"), "utf8");
for (const [name, text] of [["index.html", indexText], ["sw.js", swText]]) if (text.includes("__COMMAND_CENTER_RELEASE_ID__")) structuralErrors.push(`${name} contains an unreplaced release placeholder`);
for (const match of indexText.matchAll(/(?:src|href)="(\/[^"]+)"/g)) {
  const target = match[1];
  if (target === "/") continue;
  if (!webFiles.has(target)) structuralErrors.push(`index.html references missing artifact ${target}`);
}

const manifest = JSON.parse(await readFile(join(OUT, "manifest.webmanifest"), "utf8"));
if (manifest.start_url !== "/" || manifest.scope !== "/") structuralErrors.push("manifest start_url/scope must remain rooted at /");
for (const icon of Array.isArray(manifest.icons) ? manifest.icons : []) {
  if (!icon?.src || !webFiles.has(icon.src)) structuralErrors.push(`manifest references missing icon ${icon?.src ?? "<missing src>"}`);
}

const release = JSON.parse(await readFile(join(OUT, "release.json"), "utf8"));
if (!release.releaseId || typeof release.releaseId !== "string") structuralErrors.push("release identity is missing releaseId");
if (!isSha256(release.buildHash)) structuralErrors.push("release identity buildHash is not SHA-256");
if (!isSha256(release.assetManifestHash)) structuralErrors.push("release identity assetManifestHash is not SHA-256");
if (release.schemaCompatibility !== "cc-runtime-snapshot-v1") structuralErrors.push(`unexpected runtime schema compatibility ${release.schemaCompatibility}`);

const pwaAssets = JSON.parse(await readFile(join(OUT, "pwa-assets.json"), "utf8"));
if (pwaAssets.expectedSha256 !== APPROVED_ICON_SHA256) structuralErrors.push("protected icon expected hash changed");
if (pwaAssets.approvedIcon === "verified") {
  if (!webFiles.has(APPROVED_ICON_PATH)) structuralErrors.push("protected icon marked verified but missing from artifact");
  else {
    const actual = sha256(await readFile(join(OUT, APPROVED_ICON_PATH.slice(1))));
    if (actual !== APPROVED_ICON_SHA256) structuralErrors.push(`protected icon hash mismatch ${actual}`);
  }
  if (!Array.isArray(manifest.icons) || !manifest.icons.some((icon) => icon.src === APPROVED_ICON_PATH)) structuralErrors.push("verified protected icon is not wired into manifest");
} else {
  readinessBlockers.push(`exact approved Command Center icon is unresolved; required SHA-256 ${APPROVED_ICON_SHA256}`);
  if (Array.isArray(manifest.icons) && manifest.icons.length) structuralErrors.push("manifest must not substitute icons while protected icon is unresolved");
}
if (release.releaseId === "local-unverified") readinessBlockers.push("releaseId is local-unverified; a release candidate requires an immutable build identity");

const secretFindings = [];
for (const path of files.filter((candidate) => textExts.has(extname(candidate).toLowerCase()))) {
  const text = await readFile(path, "utf8").catch(() => "");
  secretPattern.lastIndex = 0;
  if (secretPattern.test(text)) secretFindings.push(webPath(path));
}
if (secretFindings.length) structuralErrors.push(`secret-like material found in release artifact: ${secretFindings.join(", ")}`);

const report = Object.freeze({
  schemaVersion: "cc-category15-release-artifact-audit-v1",
  artifactFileCount: files.length,
  htmlEntrypoints: Object.freeze(htmlEntrypoints),
  serviceWorkers: Object.freeze(serviceWorkers),
  protectedIcon: Object.freeze({ state: pwaAssets.approvedIcon, expectedSha256: APPROVED_ICON_SHA256 }),
  releaseIdentity: Object.freeze({ releaseId: release.releaseId, buildHash: release.buildHash, assetManifestHash: release.assetManifestHash, schemaCompatibility: release.schemaCompatibility }),
  structuralErrors: Object.freeze(structuralErrors),
  readinessBlockers: Object.freeze(readinessBlockers),
  artifactStructurallyValid: structuralErrors.length === 0,
  releaseCandidateReady: structuralErrors.length === 0 && readinessBlockers.length === 0
});
console.log(JSON.stringify(report, null, 2));
if (structuralErrors.length || (REQUIRE_PROTECTED_ASSETS && readinessBlockers.length)) process.exit(1);
