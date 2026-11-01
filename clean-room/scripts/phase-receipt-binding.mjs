import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

/**
 * Exact-content binding for phase receipts.
 *
 * A receipt cannot contain the hash of the commit that contains it, so an
 * "evidence.gitSha === head" rule is unsatisfiable for committed receipts. A
 * receipt is instead bound to the exact source commit whose audited inputs it
 * names: every declared input must still hash to the recorded value, the input
 * list must be byte-identical, and the source commit must be a real ancestor of
 * the head under audit. Any later edit to an audited input invalidates it, which
 * keeps the receipt fail-closed rather than stale.
 */
export function computeInputsDigest(repoRoot, inputs) {
  const hash = createHash("sha256");
  for (const path of [...inputs].sort()) {
    const absolute = resolve(repoRoot, path);
    if (!existsSync(absolute)) return null;
    const digest = createHash("sha256").update(readFileSync(absolute)).digest("hex");
    hash.update(`${path}\0${digest}\n`);
  }
  return hash.digest("hex");
}

export function trackedSet(repoRoot) {
  try {
    return new Set(execFileSync("git", ["ls-files", "-z"], { cwd: repoRoot }).toString("utf8").split("\0").filter(Boolean));
  } catch {
    return new Set();
  }
}

export function isAncestor(repoRoot, ancestor, headSha) {
  if (!/^[a-f0-9]{40}$/.test(ancestor ?? "")) return false;
  if (ancestor === headSha) return true;
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", ancestor, headSha], { cwd: repoRoot, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function validateReceiptBinding(receipt, { repoRoot, headSha }) {
  if (!receipt || !Array.isArray(receipt.inputs) || receipt.inputs.length === 0) return false;
  if (typeof receipt.inputsDigest !== "string" || !/^[a-f0-9]{64}$/.test(receipt.inputsDigest)) return false;
  if (!isAncestor(repoRoot, receipt.gitSha, headSha)) return false;
  const tracked = trackedSet(repoRoot);
  if (!receipt.inputs.every((path) => typeof path === "string" && !path.startsWith("/") && !path.split("/").includes("..") && tracked.has(path))) return false;
  if (new Set(receipt.inputs).size !== receipt.inputs.length) return false;
  return computeInputsDigest(repoRoot, receipt.inputs) === receipt.inputsDigest;
}

export function buildPhaseReceipt({ phaseId, headSha, inputs, evidence, summary }) {
  const repoRoot = resolve(process.cwd(), "..");
  return {
    schemaVersion: 1,
    phaseId,
    status: "VERIFIED_COMPLETE",
    gitSha: headSha,
    inputs: [...inputs].sort(),
    inputsDigest: computeInputsDigest(repoRoot, inputs),
    evidence,
    summary
  };
}
