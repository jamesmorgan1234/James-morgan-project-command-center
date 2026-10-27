import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const PUBLIC = join(ROOT, "public");
const DIST = join(ROOT, "dist");
const OUT = join(ROOT, "dist-web");
const APPROVED_ICON = join(PUBLIC, "assets", "command-center-approved-icon-512.png");
const APPROVED_ICON_SHA256 = "fa48e34b6240ca37ad74492dec150cfebaed60aed404707f79b68b9b3157b7aa";
const releaseId = (process.env.COMMAND_CENTER_RELEASE_ID || process.env.GITHUB_SHA || "local-unverified").trim();
const schemaCompatibility = "cc-runtime-snapshot-v1";
const previewAcceptance = process.env.COMMAND_CENTER_PREVIEW_ACCEPTANCE === "1";
const VALID_ENVIRONMENTS = new Set(["development", "test", "preview", "staging", "production"]);
const requestedEnvironment = (process.env.COMMAND_CENTER_ENVIRONMENT || "").trim();
const vercelEnvironment = (process.env.VERCEL_ENV || "").trim();
const environment = requestedEnvironment || (vercelEnvironment === "production" ? "production" : vercelEnvironment === "preview" ? "preview" : "development");
if (!VALID_ENVIRONMENTS.has(environment)) throw new Error(`Invalid Command Center build environment: ${environment}`);
if (previewAcceptance && process.env.VERCEL_ENV !== "preview") {
  throw new Error("Synthetic acceptance data is restricted to Vercel Preview builds");
}

async function exists(path) { try { await stat(path); return true; } catch { return false; } }
function sha256(content) { return createHash("sha256").update(content).digest("hex"); }

const runtimeConfigurationIdentity = Object.freeze({
  configVersion: 1,
  environment,
  schemaVersion: 1,
  apiVersion: 1,
  compatibleSchema: Object.freeze({ min: 1, max: 1 }),
  compatibleApi: Object.freeze({ min: 1, max: 1 }),
  features: Object.freeze({}),
  backendEnvironment: "production"
});
const configurationDigest = sha256(JSON.stringify(runtimeConfigurationIdentity));

async function walk(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(path));
    else result.push(path);
  }
  return result.sort();
}

await rm(OUT, { recursive: true, force: true });
await mkdir(join(OUT, "app"), { recursive: true });
await cp(DIST, join(OUT, "app"), { recursive: true });
await cp(PUBLIC, OUT, { recursive: true });

for (const file of [join(OUT, "index.html"), join(OUT, "sw.js")]) {
  const text = await readFile(file, "utf8");
  await writeFile(file, text
    .replaceAll("__COMMAND_CENTER_RELEASE_ID__", releaseId)
    .replaceAll("__COMMAND_CENTER_ENVIRONMENT__", environment)
    .replaceAll("__COMMAND_CENTER_CONFIG_DIGEST__", configurationDigest));
}

const manifestPath = join(OUT, "manifest.webmanifest");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
let approvedIcon = "missing";
if (await exists(APPROVED_ICON)) {
  const iconBytes = await readFile(APPROVED_ICON);
  const actual = sha256(iconBytes);
  if (actual !== APPROVED_ICON_SHA256) throw new Error(`Protected Command Center icon hash mismatch: ${actual}`);
  approvedIcon = "verified";
  manifest.icons = [{ src: "/assets/command-center-approved-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" }];
} else {
  manifest.icons = [];
}
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

if (previewAcceptance) {
  const { ProjectRegistry, ProjectTypeRegistry } = await import("../dist/projects/registry.js");
  const { ProjectCheckpointStore } = await import("../dist/projects/checkpoints.js");
  const { NeedsMeQueue } = await import("../dist/personal/needs-me.js");
  const { assembleCanonicalRuntimeSnapshot } = await import("../dist/runtime/assembly.js");
  const types = new ProjectTypeRegistry();
  types.register({ key: "project-type:acceptance", version: 1, label: "Synthetic acceptance", capabilities: [], requiredDetailSections: ["roadmap"], domainPlaybookKey: "playbook:acceptance" });
  const projects = new ProjectRegistry(types);
  const checkpoints = new ProjectCheckpointStore();
  const observedAt = "2026-10-23T00:00:00Z";
  const definitions = [
    ["fixture-critical", "[TEST] Critical rendering path", "critical", "active"],
    ["fixture-normal", "[TEST] Normal rendering path", "normal", "active"],
    ["fixture-low", "[TEST] Low rendering path", "low", "candidate"]
  ];
  for (const [id, name, priority, lifecycle] of definitions) {
    projects.create({ id, typeKey: "project-type:acceptance", ownerId: "synthetic-owner", name, mission: "Synthetic preview record <fixture & evidence>; no real business data.", lifecycle, verification: "partial", priority, version: 1, createdAt: observedAt, updatedAt: observedAt, agentAccessEnabled: false, portfolioAutoEnabled: false, protected: true });
    checkpoints.append({ id: id + "-checkpoint", projectId: id, roadmapVersion: 1, createdAt: observedAt, exactNextWorkUnitId: id + "-next", verificationMethod: "synthetic browser acceptance", evidenceRefs: ["synthetic:p15.14"], resumeStateHash: "synthetic-only" });
  }
  const roadmap = { projectId: "fixture-critical", version: 1, workUnits: [
    { id: "fixture-a", categoryId: "fixture", phaseId: "1", title: "Synthetic verified unit", status: "verified", applicable: true, dependencyIds: [], gateIds: [], acceptanceCriteria: ["fixture only"] },
    { id: "fixture-b", categoryId: "fixture", phaseId: "1", title: "Synthetic pending unit", status: "ready", applicable: true, dependencyIds: [], gateIds: [], acceptanceCriteria: ["fixture only"] }
  ], gates: [] };
  const snapshot = assembleCanonicalRuntimeSnapshot({ providerId: "runtime:synthetic-preview-acceptance", sourceRef: "synthetic:p15.14", observedAt, projects, checkpoints, needsMe: new NeedsMeQueue(), roadmaps: new Map([["fixture-critical", { roadmap, denominatorTrusted: true }]]), ownerDisplayName: "SYNTHETIC ACCEPTANCE FIXTURE", releaseId });
  const fixture = { ...snapshot, connection: { ...snapshot.connection, message: "SYNTHETIC PREVIEW DATA — rendering tests only. No live accounts, real metrics, or execution connection." } };
  await mkdir(join(OUT, "__preview__"), { recursive: true });
  await writeFile(join(OUT, "__preview__", "runtime.json"), JSON.stringify(fixture, null, 2) + "\n");
  const entryPath = join(OUT, "index.html");
  const entry = await readFile(entryPath, "utf8");
  await writeFile(entryPath, entry.replace("</head>", '  <meta name="command-center-runtime-endpoint" content="/__preview__/runtime.json">\n</head>'));
}

const files = (await walk(OUT)).filter((path) => !path.endsWith("release.json") && !path.endsWith("pwa-assets.json"));
const assetManifest = [];
for (const path of files) {
  const bytes = await readFile(path);
  assetManifest.push({ path: `/${relative(OUT, path).replaceAll("\\", "/")}`, sha256: sha256(bytes), bytes: bytes.length });
}
const assetManifestHash = sha256(JSON.stringify(assetManifest));
const buildHash = sha256(`${releaseId}:${schemaCompatibility}:${assetManifestHash}`);
const identity = Object.freeze({ releaseId, buildHash, assetManifestHash, schemaCompatibility });
await writeFile(join(OUT, "release.json"), `${JSON.stringify(identity, null, 2)}\n`);
await writeFile(join(OUT, "pwa-assets.json"), `${JSON.stringify({ approvedIcon, expectedSha256: APPROVED_ICON_SHA256 }, null, 2)}\n`);
