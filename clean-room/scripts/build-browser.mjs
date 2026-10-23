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
const APPROVED_ICON_SHA256 = "fa48e34b6240ca37ad74492dec150cfebaed60aed404707f79b68b9b3157";
const releaseId = (process.env.COMMAND_CENTER_RELEASE_ID || process.env.GITHUB_SHA || "local-unverified").trim();
const schemaCompatibility = "cc-runtime-snapshot-v1";

async function exists(path) { try { await stat(path); return true; } catch { return false; } }
function sha256(content) { return createHash("sha256").update(content).digest("hex"); }

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
  await writeFile(file, text.replaceAll("__COMMAND_CENTER_RELEASE_ID__", releaseId));
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

const files = (await walk(OUT)).filter((path) => !path.endsWith("release.json") && !path.endsWith("pwa-assets.json"));
const assetManifest = [];
for (const path of files) {
  const bytes = await readFile(path);
  assetManifest.push({ path: `/${relative(OUT, path).replaceAll("\\\\", "/")}`, sha256: sha256(bytes), bytes: bytes.length });
}
const assetManifestHash = sha256(JSON.stringify(assetManifest));
const buildHash = sha256(`${releaseId}:${schemaCompatibility}:${assetManifestHash}`);
const identity = Object.freeze({ releaseId, buildHash, assetManifestHash, schemaCompatibility });
await writeFile(join(OUT, "release.json"), `${JSON.stringify(identity, null, 2)}\n`);
await writeFile(join(OUT, "pwa-assets.json"), `${JSON.stringify({ approvedIcon, expectedSha256: APPROVED_ICON_SHA256 }, null, 2)}\n`);
