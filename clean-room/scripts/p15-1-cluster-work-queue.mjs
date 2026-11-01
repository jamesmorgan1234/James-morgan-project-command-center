import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Cluster-first work queue for the remaining P15.1 rows.
 *
 * Groups every UNVERIFIED canonical row by architecture owner (and its branch
 * breakdown) so batches follow the architecture instead of arbitrary ID ranges.
 * Read-only by default; --write persists the queue as a checkpoint.
 */

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ledgerPath = resolve(root, "clean-room/evidence/category15-requirement-traceability.json");
const document = JSON.parse(readFileSync(ledgerPath, "utf8"));
const rows = document.requirements ?? [];
const unverified = rows.filter((row) => row.truthState === "UNVERIFIED");
const verified = rows.filter((row) => row.truthState === "VERIFIED");

const byOwner = new Map();
for (const row of unverified) {
  const owner = row.architectureOwner ?? "UNASSIGNED";
  let cluster = byOwner.get(owner);
  if (!cluster) {
    cluster = { owner, unverified: 0, ids: [], branches: new Map(), samples: [] };
    byOwner.set(owner, cluster);
  }
  cluster.unverified += 1;
  cluster.ids.push(row.id);
  const branch = row.architectureBranch ?? "UNASSIGNED";
  cluster.branches.set(branch, (cluster.branches.get(branch) ?? 0) + 1);
  if (cluster.samples.length < 3) {
    cluster.samples.push(`${row.id}: ${String(row.requirement ?? "").replace(/\*\*/g, "").slice(0, 88)}`);
  }
}

const clusters = [...byOwner.values()]
  .map((cluster) => ({
    owner: cluster.owner,
    unverified: cluster.unverified,
    firstId: cluster.ids[0],
    lastId: cluster.ids.at(-1),
    branches: Object.fromEntries([...cluster.branches.entries()].sort((a, b) => b[1] - a[1])),
    samples: cluster.samples
  }))
  .sort((a, b) => b.unverified - a.unverified || a.owner.localeCompare(b.owner));

const report = {
  schemaVersion: "cc-p15.1-cluster-work-queue-v1",
  canonicalRows: rows.length,
  verified: verified.length,
  unverified: unverified.length,
  clusters
};

console.log(JSON.stringify({
  canonicalRows: report.canonicalRows,
  verified: report.verified,
  unverified: report.unverified,
  clusters: clusters.map(({ owner, unverified: count, firstId, lastId }) => ({ owner, unverified: count, firstId, lastId }))
}, null, 1));
for (const cluster of clusters) {
  console.log(`\n${cluster.owner} (${cluster.unverified}) ${cluster.firstId}..${cluster.lastId}`);
  for (const [branch, count] of Object.entries(cluster.branches)) console.log(`  ${count}  ${branch}`);
}

if (process.argv.includes("--write")) {
  writeFileSync(resolve(root, "clean-room/evidence/P15_1_REMAINING_CLUSTER_QUEUE.json"), `${JSON.stringify(report, null, 1)}\n`);
  console.log("\nWROTE clean-room/evidence/P15_1_REMAINING_CLUSTER_QUEUE.json");
}
