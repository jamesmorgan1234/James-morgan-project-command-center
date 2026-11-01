import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { relative, resolve } from "node:path";

export const P15_2_EVIDENCE_PATH = "clean-room/evidence/P15_2_SEMANTIC_EVERY_FILE_REVIEW.json";

export const fileDigest = (bytes) => createHash("sha256").update(bytes).digest("hex");

export function trackedFiles(repoRoot) {
  return execFileSync("git", ["ls-files", "-z"], { cwd: repoRoot }).toString("utf8").split("\0").filter(Boolean).sort();
}

export function isAncestorCommit(repoRoot, ancestor, headSha) {
  if (!/^[a-f0-9]{40}$/.test(ancestor ?? "")) return false;
  if (ancestor === headSha) return true;
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, headSha], { cwd: repoRoot, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Digest over the exact reviewed inventory: sorted `path\0sha256` records.
 * The evidence file is excluded from its own inventory because a file cannot
 * contain a digest of itself.
 */
export function computeInventoryDigest(repoRoot, paths) {
  const sorted = [...paths].sort();
  const hash = createHash("sha256");
  for (const path of sorted) {
    const abs = resolve(repoRoot, path);
    const record = existsSync(abs) ? fileDigest(readFileSync(abs)) : "MISSING";
    hash.update(`${path}\0${record}\n`);
  }
  return hash.digest("hex");
}

/**
 * P15.2 exit-gate evidence is only valid when it is bound to the exact content
 * it reviewed: the reviewed inventory must be byte-identical to the current
 * tracked inventory (minus the evidence file itself), the count must match, the
 * per-file review records must line up one-for-one with the inventory, no defect
 * finding may remain, and the recorded source commit must be a real ancestor of
 * the current head. This is stricter than comparing commit hashes alone, because
 * it also rejects any later edit, addition or removal inside a commit.
 */
export function validateSemanticEveryFileReview(evidence, { repoRoot, headSha, evidencePath = P15_2_EVIDENCE_PATH } = {}) {
  const errors = [];
  const fail = (message) => errors.push({ id: "P15.2", message });
  if (!evidence) return { valid: false, errors: [{ id: "P15.2", message: "Missing semantic every-file review evidence" }], reviewedFileCount: 0, expectedFileCount: 0 };
  const currentHead = headSha ?? execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim();
  const reviewed = trackedFiles(repoRoot).filter((path) => path !== evidencePath);
  if (evidence.status !== "VERIFIED_COMPLETE") fail("Semantic every-file review is not VERIFIED_COMPLETE");
  if (evidence.phaseId !== "P15.2") fail("Evidence is not attributed to P15.2");
  if (!isAncestorCommit(repoRoot, evidence.gitSha, currentHead)) fail(`Evidence is not bound to a real ancestor commit: ${evidence.gitSha}`);
  if (!Number.isInteger(evidence.reviewedFileCount) || evidence.reviewedFileCount !== reviewed.length) fail(`Reviewed file count ${evidence.reviewedFileCount} != current tracked count ${reviewed.length}`);
  if (!Array.isArray(evidence.evidence) || evidence.evidence.length === 0) fail("Evidence has no supporting references");
  const findings = Array.isArray(evidence.findings) ? evidence.findings : [];
  if (findings.some((finding) => finding.severity === "defect")) fail("Unrepaired defect findings remain in the every-file review");
  const reviews = Array.isArray(evidence.reviews) ? evidence.reviews : [];
  if (reviews.length !== reviewed.length) fail(`Per-file review records ${reviews.length} != tracked inventory ${reviewed.length}`);
  else for (const [index, path] of reviewed.entries()) {
    if (reviews[index]?.path !== path) { fail(`Per-file review record ${index} does not match tracked inventory (${path})`); break; }
  }
  const digest = computeInventoryDigest(repoRoot, reviewed);
  if (evidence.inventoryDigest !== digest) fail("Reviewed inventory digest does not match the current repository content");
  return { valid: errors.length === 0, errors, reviewedFileCount: reviewed.length, expectedFileCount: reviewed.length, inventoryDigest: digest };
}

export function repoRelative(repoRoot, absolutePath) {
  return relative(repoRoot, absolutePath).split("\\").join("/");
}
