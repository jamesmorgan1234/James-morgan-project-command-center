/**
 * P15.2 — every-file repository audit.
 *
 * This is the semantic review pass over every tracked file, not a sample. It
 * classifies each file, inspects its content (parse validity, import/reference
 * resolution, workflow structure, secret material, generated payloads, dead
 * seams, test/workflow coherence), records a disposition per file, and refuses to
 * emit a VERIFIED_COMPLETE receipt while any genuine defect remains.
 *
 * Run with --write to emit clean-room/evidence/P15_2_SEMANTIC_EVERY_FILE_REVIEW.json.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import ts from "typescript";
import { execFileSync } from "node:child_process";
import {
  P15_2_EVIDENCE_PATH,
  computeInventoryDigest,
  fileDigest,
  trackedFiles
} from "./p15-2-repository-evidence.mjs";

const cleanRoom = process.cwd();
const repoRoot = resolve(cleanRoom, "..");
const write = process.argv.includes("--write");
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim();
const tracked = trackedFiles(repoRoot);
const trackedSet = new Set(tracked);

const ROLE_LEGEND = {
  ASRC: "active-clean-room-source",
  APUB: "active-clean-room-public",
  TEST: "verification-test",
  SCRP: "verification-tooling",
  EVID: "verification-evidence",
  CONF: "active-build-configuration",
  ASRV: "active-serverless-api",
  CIWF: "ci-workflow",
  RDMAP: "roadmap-authority-or-evidence",
  SBAS: "backend-integration",
  HIST: "historical-generation-excluded-from-release",
  HTST: "historical-test-generation-excluded",
  ROOTDOC: "repository-level-documentation",
  SUPP: "repository-support"
};

const roleRules = [
  [/^clean-room\/src\//, "ASRC"],
  [/^clean-room\/public\//, "APUB"],
  [/^clean-room\/tests\//, "TEST"],
  [/^clean-room\/scripts\//, "SCRP"],
  [/^clean-room\/evidence\//, "EVID"],
  [/^clean-room\/operations\/[^/]+\.md$/, "ROOTDOC"],
  [/^clean-room\/api\//, "ASRV"],
  [/^clean-room\/vercel\.json$/, "CONF"],
  [/^docs\//, "ROOTDOC"],
  [/^tests\//, "HTST"],
  [/^clean-room\/(?:package(?:-lock)?\.json|tsconfig[^/]*\.json|README\.md|\.gitignore)$/, "CONF"],
  [/^\.github\/workflows\/[^/]+\.ya?ml$/, "CIWF"],
  [/^roadmap\//, "RDMAP"],
  [/^supabase\//, "SBAS"],
  [/^rebuild-vnext\//, "HIST"],
  [/^authoritative-v7\//, "HIST"],
  [/^(?:app\.js|app-config\.js|app-integrity-repair\.js|index\.html|sw\.js|styles\.css|manifest\.webmanifest)$/, "HIST"],
  [/^ux-polish\.css\//, "HIST"],
  [/^\.(?:png|webp|jpe?g|svg)$/, "HIST"],
  [/^tests\/v\d/, "HIST"],
  [/^scripts\//, "SCRP"],
  [/^\.github\//, "SUPP"],
  [/^[^/]+\.(?:md|txt)$/, "ROOTDOC"],
  [/^[^/]+$/, "HIST"]
];

const GENERATED_SEGMENTS = /(^|\/)(?:dist|node_modules|coverage|\.next)(\/|$)/;
const GENERATED_SUFFIX = /\.(?:map|tsbuildinfo|log)$|(^|\/)\.DS_Store$/;

const secretPatterns = [
  { code: "openai_api_key", re: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g },
  { code: "github_token", re: /\bgh[pousr]_[A-Za-z0-9]{20,}\b/g },
  { code: "aws_access_key", re: /\bAKIA[0-9A-Z]{16}\b/g },
  { code: "private_key", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { code: "stripe_secret_key", re: /\bsk_live_[A-Za-z0-9]{16,}\b/g },
  { code: "supabase_service_role", re: /\bsbp_[A-Za-z0-9]{20,}\b/g },
  { code: "slack_token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g }
];

const codeExtensions = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx"]);
const textExtensions = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".json", ".md", ".txt", ".csv", ".yml", ".yaml", ".html", ".css", ".scss", ".sql", ".toml", ".xml", ".webmanifest", ".gitignore"]);
const legacyMarkers = ["../legacy", "/legacy/", "old-agent", "cc7_agent_", "/archive/"];
const branchGateWorkflows = new Set([".github/workflows/spec-lock-v2-clean-room-qa.yml", ".github/workflows/p15-1-requalify-reviewed-mappings.yml"]);
const historicalRootRuntime = new Set(["app.js", "app-config.js", "app-integrity-repair.js", "index.html", "styles.css", "manifest.webmanifest"]);

function roleFor(path) {
  for (const [pattern, role] of roleRules) if (pattern.test(path)) return role;
  return null;
}

function isText(path, buffer) {
  if (buffer.includes(0)) return false;
  return textExtensions.has(extname(path).toLowerCase()) || buffer.length < 262144;
}

function resolveSpecifier(fromPath, specifier) {
  const bare = specifier.replace(/[?#].*$/, "");
  const absolute = resolve(repoRoot, dirname(fromPath), bare);
  const base = absolute.startsWith(repoRoot + "/") ? absolute.slice(repoRoot.length + 1) : null;
  if (!base || base.startsWith("..")) return { ok: false, code: "specifier_outside_repository" };
  const bare2 = base.replace(/[?#].*$/, "");
  const candidates = [];
  if (/\/(?:dist)\//.test(`/${base}`) || base.startsWith("clean-room/dist/")) {
    const source = base.replace("/dist/", "/src/").replace(/\.js$/, ".ts");
    candidates.push(source, source.replace(/\.ts$/, "/index.ts"));
  }
  candidates.push(
    bare2,
    bare2.replace(/\.js$/, ".ts"),
    bare2.replace(/\.mjs$/, ".ts"),
    bare2.replace(/\.mjs$/, ".mts"),
    `${bare2}.ts`,
    `${bare2}.mjs`,
    `${bare2}.js`,
    `${bare2}.json`,
    `${bare2}/index.ts`,
    `${bare2}/index.mjs`,
    `${bare2}/index.js`
  );
  const hit = candidates.find((candidate) => trackedSet.has(candidate));
  return hit ? { ok: true, path: hit } : { ok: false, code: "unresolved_import" };
}

const findings = [];
const reviews = [];
const record = (severity, code, path, detail) => findings.push({ severity, code, path, detail });

/** Real module edges only: AST import/export/dynamic-import/require declarations. */
function moduleSpecifiers(path, text) {
  const sourceFile = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true);
  const specifiers = [];
  const literal = (node) => (node && ts.isStringLiteralLike(node) ? node.text : undefined);
  function visit(node) {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      const specifier = literal(node.moduleSpecifier);
      if (specifier) specifiers.push(specifier);
    } else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) {
      const specifier = literal(node.moduleReference.expression);
      if (specifier) specifiers.push(specifier);
    } else if (ts.isCallExpression(node)) {
      const dynamicImport = node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const requireCall = ts.isIdentifier(node.expression) && node.expression.text === "require";
      if (dynamicImport || requireCall) {
        const specifier = literal(node.arguments[0]);
        if (specifier) specifiers.push(specifier);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return specifiers;
}
const usesPattern = /^[ \t]*uses:\s*(\S+)/;
const pinnedRef = /@[a-f0-9]{40}$/;

const authorities = {
  "roadmap/master-build-plan-owner-review/23_CURRENT_199_PHASE_MACHINE_MANIFEST.json": "current-phase-manifest",
  "roadmap/master-build-plan-owner-review/17_SPECIFICATION_LOCK_V2_1.md": "specification-lock",
  "roadmap/master-build-plan-owner-review/24_AMENDMENT20_REQUIREMENT_OWNERSHIP.json": "amendment20-ownership",
  "roadmap/master-build-plan-owner-review/Command_Center_Canonical_Owner_Additions_REV3.json": "rev3-canonical-additions",
  "clean-room/scripts/category15-phase-gate-audit.mjs": "category15-phase-gate",
  "clean-room/scripts/category15-repository-audit.mjs": "category15-repository-gate",
  "clean-room/scripts/category15-requirement-traceability-validation.mjs": "p15.1-closure-validator",
  "clean-room/evidence/category15-requirement-traceability.json": "p15.1-closure-evidence"
};
for (const [path, authority] of Object.entries(authorities)) {
  if (!trackedSet.has(path)) record("defect", "required_authority_missing", path, `Required ${authority} file is absent`);
}

const canonicalAuthorityDeclarations = new Map();
for (const path of tracked) {
  // The evidence file cannot review or digest itself; it is verified by the
  // gate from the inventory of everything else.
  if (path === P15_2_EVIDENCE_PATH) continue;
  const absolute = resolve(repoRoot, path);
  if (!existsSync(absolute)) { record("defect", "tracked_file_missing", path, "Tracked file is absent from the working tree"); continue; }
  const bytes = readFileSync(absolute);
  const role = roleFor(path);
  if (!role) record("defect", "unclassified_role", path, "No disposition rule governs this file");
  const fileFindings = [];
  const before = findings.length;
  const text = isText(path, bytes) ? bytes.toString("utf8") : null;
  if (GENERATED_SEGMENTS.test(path)) record("defect", "forbidden_generated_payload", path, "Generated directory content is tracked in the repository");
  if (GENERATED_SUFFIX.test(path)) record("defect", "forbidden_build_artifact", path, "Build/cache artifact is tracked in the repository");
  if (/(?:^|\/)clean-room\/test\//.test(path) && /\.test\.(?:mjs|js)$/.test(path)) record("defect", "orphan_test_outside_mandatory_glob", path, "Test lives outside clean-room/tests/*.test.mjs and is never executed by any gate");
  if (historicalRootRuntime.has(path) && role === "HIST") record("notice", "historical_root_runtime_retained", path, "Pre-clean-room root runtime is retained for history; the release artifact gate forbids shipping it");
  if (text !== null) {
    for (const { code, re } of secretPatterns) {
      re.lastIndex = 0;
      for (const match of text.matchAll(re)) {
        const token = match[0].replace(/^[a-z]+[-_]/i, "");
        const body = token.slice(0, token.length);
        const placeholder = /^(?:\d+|x+|0+|\*+)$/i.test(body) || /(?:example|fixture|fake|placeholder|redacted|dummy|not-a-real|sample)/i.test(body);
        record(placeholder ? "notice" : "defect", "committed_secret", path, placeholder ? `Placeholder credential fixture matched ${code}` : `Secret-like material matched ${code}`);
      }
    }
    if (role === "ASRC" || role === "APUB") {
      for (const specifier of moduleSpecifiers(path, text)) {
        if (legacyMarkers.some((marker) => specifier.includes(marker))) {
          record("defect", "legacy_runtime_dependency", path, `Active clean-room file imports a legacy/archive module ${specifier}`);
        }
      }
    }
    const ext = extname(path).toLowerCase();
    if (ext === ".json") {
      try { JSON.parse(text); } catch (error) { record("defect", "invalid_json", path, String(error.message).slice(0, 120)); }
    }
    if (codeExtensions.has(ext)) {
      for (const specifier of moduleSpecifiers(path, text)) {
        if (!specifier.startsWith(".")) continue;
        const resolved = resolveSpecifier(path, specifier);
        if (!resolved.ok) record("defect", resolved.code, path, `Relative specifier ${specifier} does not resolve to a tracked module`);
      }
      if (role === "ASRC" && /\b(?:document\.write\s*\(|Object\.definePropert(?:y|ies)\s*\(\s*(?:Array|Object|String|Number|Promise|Window|Document|Element|HTMLElement|EventTarget|Node)\.prototype)/.test(text)) {
        record("defect", "band_aid_runtime_patch", path, "Active source patches native prototypes or writes documents directly");
      }
    }
    if (role === "CIWF") {
      const lines = text.split(/\r?\n/);
      if (!/^on:/m.test(text)) record("defect", "workflow_missing_trigger", path, "Workflow declares no trigger block");
      if (!/^jobs:/m.test(text)) record("defect", "workflow_missing_jobs", path, "Workflow declares no jobs block");
      if (/permissions:\s*write-all/.test(text)) record("defect", "workflow_write_all_permissions", path, "Workflow requests write-all permissions");
      for (const line of lines) {
        const match = line.match(usesPattern);
        if (!match) continue;
        if (!match[1].includes("@")) { record("defect", "workflow_action_unpinned", path, `Action ${match[1]} has no version reference`); continue; }
        if (!pinnedRef.test(match[1])) {
          const severity = branchGateWorkflows.has(path) ? "defect" : "notice";
          record(severity, "workflow_action_not_sha_pinned", path, `Action ${match[1]} is mutable`);
        }
      }
    }
    if (/^roadmap\//.test(path) && /canonicalRequirementCount"\s*:\s*\d+/.test(text)) {
      const match = text.match(/canonicalRequirementCount"\s*:\s*(\d+)/);
      const declaration = match?.[1];
      if (declaration) canonicalAuthorityDeclarations.set(path, declaration);
    }
  }
  for (let index = before; index < findings.length; index += 1) fileFindings.push(findings[index].code);
  reviews.push({
    path,
    role,
    disposition: role === "HIST" ? "retain-historical-excluded" : role === "EVID" || role === "RDMAP" ? "retain-authority-evidence" : "retain-active",
    sha256: fileDigest(bytes),
    bytes: bytes.length,
    contentKind: text === null ? "binary" : "text",
    findings: fileFindings
  });
}

const distinctAuthorityTotals = new Set([...canonicalAuthorityDeclarations.values()]);
if (canonicalAuthorityDeclarations.size > 1 && distinctAuthorityTotals.size > 1) {
  for (const [path, total] of canonicalAuthorityDeclarations) record("defect", "competing_canonical_authority", path, `Declares canonical requirement total ${total} while another authority declares a different total`);
}

const governanceTestGlob = tracked.filter((path) => /^clean-room\/tests\/[^/]+\.test\.mjs$/.test(path));
if (governanceTestGlob.length === 0) record("defect", "missing_test_glob", "clean-room/tests", "No mandatory test files exist");
for (const [path, authority] of Object.entries(authorities)) {
  if (!path.startsWith("clean-room/")) continue;
  const referencing = tracked.filter((other) => other.startsWith("clean-room/tests/") && readFileSync(resolve(repoRoot, other), "utf8").includes(path.split("/").pop()));
  if (referencing.length === 0 && path.endsWith(".mjs")) record("defect", "unreferenced_authority_seam", path, `No test exercises ${authority}`);
}

const byRole = {};
for (const review of reviews) byRole[review.role ?? "UNCLASSIFIED"] = (byRole[review.role ?? "UNCLASSIFIED"] ?? 0) + 1;
const directorySummary = [...new Set(reviews.map((review) => review.path.split("/").slice(0, 2).join("/")))].sort().map((directory) => {
  const files = reviews.filter((review) => review.path === directory || review.path.startsWith(`${directory}/`));
  return { directory, fileCount: files.length, roles: [...new Set(files.map((file) => file.role))].sort() };
});

const defects = findings.filter((finding) => finding.severity === "defect");
const notices = findings.filter((finding) => finding.severity === "notice");

const summary = {
  phaseId: "P15.2",
  trackedFileCount: tracked.length,
  reviewedFileCount: reviews.length,
  evidenceFileExcluded: trackedSet.has(P15_2_EVIDENCE_PATH),
  reviewScope: "all-git-tracked-files",
  roleLegend: ROLE_LEGEND,
  filesByRole: byRole,
  defectCount: defects.length,
  noticeCount: notices.length,
  directoryCount: directorySummary.length
};

if (write && defects.length === 0) {
  const reviewed = tracked.filter((path) => path !== P15_2_EVIDENCE_PATH);
  if (reviewed.length !== reviews.length) throw new Error(`review coverage mismatch: ${reviews.length} records for ${reviewed.length} files`);
  const evidence = {
    schemaVersion: 1,
    phaseId: "P15.2",
    status: "VERIFIED_COMPLETE",
    gitSha: headSha,
    reviewScope: "all-git-tracked-files",
    reviewedFileCount: reviewed.length,
    inventoryDigest: computeInventoryDigest(repoRoot, reviewed),
    generatedBy: "clean-room/scripts/p15-2-semantic-every-file-review.mjs",
    evidence: [
      "clean-room/scripts/p15-2-semantic-every-file-review.mjs",
      "clean-room/scripts/p15-2-repository-evidence.mjs",
      "clean-room/scripts/category15-repository-audit.mjs",
      "clean-room/scripts/category15-phase-gate-audit.mjs",
      "clean-room/tests/p15-2-semantic-every-file-review.test.mjs",
      "clean-room/tests/category15-p15-2-partial-preservation.test.mjs",
      ".github/workflows/spec-lock-v2-clean-room-qa.yml"
    ],
    summary,
    repairs: [
      { defect: "clean-room/test/category7-199-intelligence-integration.test.mjs", rootCause: "A live P7 acceptance suite lived outside clean-room/tests/*.test.mjs, so no gate executed it and its delegation assertion had drifted from the enforced error contract.", repair: "Relocated into the mandatory test glob with its assertion reconciled to the enforced amplification-blocked contract." },
      { defect: "semantic every-file evidence binding", rootCause: "The gate required evidence committed inside the very head it names, a self-referential condition that no commit can satisfy, so P15.2 could never close.", repair: "Binding replaced with an exact reviewed-inventory digest plus one-for-one per-file records, which rejects any later edit, addition or removal." }
    ],
    directorySummary,
    findings,
    reviews
  };
  writeFileSync(resolve(repoRoot, P15_2_EVIDENCE_PATH), `${JSON.stringify(evidence, null, 2)}\n`);
}

writeFileSync(resolve(cleanRoom, "p15-2-every-file-review.json"), `${JSON.stringify({ ...summary, findings, directorySummary, repairs: [] }, null, 2)}\n`);
console.log(JSON.stringify(summary));
if (defects.length > 0) {
  console.error(`P15.2 every-file review found ${defects.length} defect(s):`);
  for (const defect of defects.slice(0, 40)) console.error(`- ${defect.code} ${defect.path}: ${defect.detail}`);
  process.exit(1);
}
