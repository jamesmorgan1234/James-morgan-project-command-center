import { execFileSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "../..");
const WRITE = process.argv.includes("--write");
const fileList = execFileSync("git", ["ls-files", "-z"], { cwd: REPO, encoding: "utf8" }).split("\0").filter(Boolean).sort();
const imageExts = new Set([".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".gif"]);
const textExts = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".json", ".html", ".css", ".yml", ".yaml", ".md", ".txt", ".toml"]);
const secretPattern = /(sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|xoxb-[A-Za-z0-9-]{12,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)/g;
const historicalRuntimeNames = new Set(["app.js", "app-config.js", "app-integrity-repair.js", "index.html", "manifest.json", "manifest.webmanifest", "sw.js", "service-worker.js", "styles.css", "style.css"]);

function classify(path) {
  if (path.startsWith("clean-room/")) return "clean-room";
  if (path.startsWith("roadmap/")) return "roadmap-specification";
  if (path.startsWith(".github/")) return "workflow-ci";
  if (path.startsWith("supabase/")) return "backend-integration";
  if (path.startsWith("tests/") || path.startsWith("scripts/") || path.startsWith("tools/")) return "historical-tooling";
  const base = path.split("/").at(-1) ?? path;
  if (!path.includes("/") && historicalRuntimeNames.has(base)) return "historical-runtime-candidate";
  if (/^(src|public|assets|components|modules|lib|v\d+|legacy|archive)\//i.test(path)) return "historical-runtime-candidate";
  if (imageExts.has(extname(path).toLowerCase())) return "asset";
  if (/\.(md|txt)$/i.test(path)) return "standards-documentation";
  if (/^(package(?:-lock)?\.json|tsconfig.*\.json|vite\.config\.|webpack\.config\.|eslint\.|prettier\.)/.test(base)) return "tooling-configuration";
  return "other-reviewed";
}

const classifications = new Map();
for (const path of fileList) classifications.set(path, classify(path));
const counts = {};
for (const category of classifications.values()) counts[category] = (counts[category] ?? 0) + 1;
const historicalRuntimeCandidates = [...classifications].filter(([, category]) => category === "historical-runtime-candidate").map(([path]) => path);
const cleanRoomRuntimeEntrypoints = fileList.filter((path) => ["clean-room/public/index.html", "clean-room/public/sw.js", "clean-room/src/runtime/browser.ts"].includes(path));
const serviceWorkers = fileList.filter((path) => /(^|\/)(sw|service-worker)(?:\.[^.]+)?\.js$|(^|\/)sw\.js$/i.test(path));
const htmlEntrypoints = fileList.filter((path) => /(^|\/)index\.html$/i.test(path));
const secretPatternFindings = [];
for (const path of fileList.filter((candidate) => candidate.startsWith("clean-room/") && textExts.has(extname(candidate).toLowerCase()))) {
  const text = await readFile(resolve(REPO, path), "utf8").catch(() => "");
  secretPattern.lastIndex = 0;
  const matches = [...text.matchAll(secretPattern)].map((match) => match[0]);
  if (matches.length) secretPatternFindings.push({ path, matches: [...new Set(matches)].map(() => "REDACTED_SECRET_PATTERN") });
}
const requiredEntrypoints = ["clean-room/public/index.html", "clean-room/public/sw.js", "clean-room/src/runtime/browser.ts"];
const missingRequiredEntrypoints = requiredEntrypoints.filter((path) => !fileList.includes(path));
const report = Object.freeze({
  schemaVersion: "cc-category15-repository-audit-v1",
  trackedFileCount: fileList.length,
  classificationCounts: Object.freeze(counts),
  allTrackedFilesClassified: classifications.size === fileList.length,
  cleanRoomRuntimeEntrypoints: Object.freeze(cleanRoomRuntimeEntrypoints),
  historicalRuntimeCandidates: Object.freeze(historicalRuntimeCandidates),
  serviceWorkerCandidates: Object.freeze(serviceWorkers),
  htmlEntrypointCandidates: Object.freeze(htmlEntrypoints),
  missingRequiredEntrypoints: Object.freeze(missingRequiredEntrypoints),
  secretPatternFindings: Object.freeze(secretPatternFindings),
  semanticEveryFileReviewStillRequired: true
});
console.log(JSON.stringify(report, null, 2));
if (WRITE) await writeFile(resolve(REPO, "clean-room/category15-repository-audit.json"), `${JSON.stringify(report, null, 2)}\n`);
if (!report.allTrackedFilesClassified || missingRequiredEntrypoints.length || secretPatternFindings.length) process.exit(1);
