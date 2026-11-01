import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * P15.14 — nonproduction contract acceptance + real PWA lifecycle proof.
 *
 * Runs the composed nonproduction contract suite, the owner-auth proxy routing
 * suite, and the real headless-browser service-worker lifecycle (install,
 * same-session offline replay, waiting-worker activation, two-cache retention).
 * Fails closed when no browser binary is available instead of reporting a pass.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const CLEAN_ROOM = resolve(HERE, "..");
const REPO_ROOT = resolve(CLEAN_ROOM, "..");
const WRITE = process.argv.includes("--write");
const EVIDENCE_PATH = "clean-room/evidence/P15_14_NONPRODUCTION_ACCEPTANCE.json";
const CONTRACT_SUITES = [
  "tests/category15-nonproduction-contract-acceptance.test.mjs",
  "tests/owner-auth-proxy-routing.test.mjs"
];
const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  resolve(REPO_ROOT, ".tools/chrome-headless-shell-linux64/chrome-headless-shell")
].filter(Boolean);

const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT }).toString("utf8").trim();
const checks = [];
function check(name, passed, detail) {
  checks.push({ name, passed: Boolean(passed), ...(detail === undefined ? {} : { detail }) });
}

function runTap(files) {
  const result = spawnSync(process.execPath, ["--test", "--test-concurrency=1", "--test-reporter=tap", ...files], {
    cwd: CLEAN_ROOM,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const count = (label) => Number(new RegExp(`^# ${label} (\\d+)$`, "m").exec(output)?.[1] ?? -1);
  const failures = output.split(/\r?\n/).filter((line) => line.startsWith("not ok ")).map((line) => line.slice(0, 200));
  return { exit: result.status ?? 1, tests: count("tests"), pass: count("pass"), fail: count("fail"), failures, output: output.slice(-4000) };
}

const contract = runTap(CONTRACT_SUITES);
check("nonproduction contract suites execute and exit zero", contract.exit === 0, { exit: contract.exit });
check("nonproduction contract suites report no failing tests", contract.fail === 0 && contract.failures.length === 0, contract.failures);
check("nonproduction contract suites actually ran assertions", contract.tests >= 5 && contract.pass === contract.tests, { tests: contract.tests, pass: contract.pass });

const browser = CHROME_CANDIDATES.find((candidate) => existsSync(candidate)) ?? null;
check("a real browser binary is available for lifecycle acceptance", browser !== null, browser ?? CHROME_CANDIDATES);

let lifecycle = { exit: 1, output: "not executed", verifiedLine: false };
if (browser) {
  const result = spawnSync(process.execPath, ["scripts/category15-pwa-lifecycle.mjs"], {
    cwd: CLEAN_ROOM,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, CHROME_BIN: browser },
    timeout: 240000
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  lifecycle = {
    exit: result.status ?? 1,
    output: output.slice(-6000),
    verifiedLine: output.includes("P15.14 PWA lifecycle verified: install, same-session offline cache replay, waiting-worker activation, two-cache rollback retention")
  };
}
check("real browser service-worker lifecycle exits zero", lifecycle.exit === 0, { exit: lifecycle.exit });
check("browser proof covers install, offline replay, explicit activation and two-cache retention", lifecycle.verifiedLine === true, lifecycle.output.slice(-600));

const serviceWorkerText = readFileSync(join(CLEAN_ROOM, "public/sw.js"), "utf8");
check("service worker keeps the versioned shell cache prefix", serviceWorkerText.includes('const CACHE_PREFIX = "command-center-shell:"'));
check("service worker retains an explicit activate-update message contract", serviceWorkerText.includes('"ACTIVATE_UPDATE"'));
check("service worker keeps a known-good rollback path", /knownGoodReleaseId/.test(serviceWorkerText) && /fallbackReleaseId/.test(serviceWorkerText));

const failures = checks.filter((entry) => !entry.passed);
const report = Object.freeze({
  schemaVersion: "cc-p15-14-nonproduction-acceptance-v1",
  headSha,
  contractSuites: Object.freeze(CONTRACT_SUITES),
  contractResults: Object.freeze({ tests: contract.tests, pass: contract.pass, fail: contract.fail }),
  browser: Object.freeze({ binary: browser, lifecycleVerified: lifecycle.verifiedLine === true }),
  lifecycleTranscriptTail: lifecycle.output.slice(-1500),
  checks: Object.freeze(checks),
  checkCount: checks.length,
  failedCheckCount: failures.length,
  verified: failures.length === 0
});

if (WRITE) writeFileSync(join(REPO_ROOT, EVIDENCE_PATH), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...report, lifecycleTranscriptTail: undefined }, null, 2));
if (!report.verified) {
  console.error(`P15.14 nonproduction acceptance failed ${failures.length}/${checks.length} checks`);
  process.exit(1);
}
