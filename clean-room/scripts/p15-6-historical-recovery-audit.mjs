/**
 * P15.6 — historical import, lineage, privacy and lost-artifact acceptance.
 *
 * Authority (roadmap P15.6): run a representative export fixture through
 * CCR-05847–CCR-05852 — standalone/container candidates, renames/merges/
 * supersession, owner precedence, live-state precedence, privacy exclusion and
 * missing-artifact paths. Exit gate: every fixture conversation is inventoried,
 * no secret/private leakage or autoactivation occurs, and the completeness
 * report is exact.
 *
 * Every suite runs against the real compiled implementation (dist/data,
 * dist/recovery) with the real recovery access/evidence contracts. Exit code 0
 * only when every suite passes. --write emits the phase receipt bound to the
 * exact source commit and audited inputs.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildHistoricalLineageIndex,
  stageChatExport,
  validateConversationGraph
} from "../dist/data/index.js";
import {
  auditStagedHistoricalRecovery,
  evaluateOriginalFirstRecovery,
  recoveryComplete,
  recoveryDigest,
  validateRecoveryCompletenessReport,
  validateRecoveryReport
} from "../dist/recovery/index.js";
import { buildPhaseReceipt } from "./phase-receipt-binding.mjs";

const cleanRoom = process.cwd();
const repoRoot = resolve(cleanRoom, "..");
const write = process.argv.includes("--write");
const headSha = execFileSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).toString("utf8").trim();

const NOW = "2026-11-01T00:00:00.000Z";
const SCOPE = Object.freeze({ ownerId: "11111111-1111-4111-8111-111111111111", companyId: "cmp_recovery", projectId: "prj_recovery", environment: "test" });

const results = [];
const expect = (condition, message) => { if (!condition) throw new Error(message); };
const expectThrow = (run, pattern, message) => {
  try {
    run();
  } catch (error) {
    expect(pattern.test(String(error.message)), `${message}: unexpected error "${error.message}"`);
    return;
  }
  throw new Error(`${message}: expected a rejection but the operation succeeded`);
};
const suite = (id, description, requirementIds, body) => {
  const checks = [];
  const check = (name, run) => {
    try { run(); checks.push({ name, passed: true }); }
    catch (error) { checks.push({ name, passed: false, error: error.message }); }
  };
  body(check);
  const failed = checks.filter((entry) => !entry.passed);
  results.push({ id, description, requirementIds, passed: failed.length === 0, checks });
};

const RAW_EXPORT = Object.freeze([
  Object.freeze({
    id: "c1",
    title: "Alpha build",
    conversation_template_id: "project:alpha",
    mapping: {
      a: { id: "a", parent: null, children: ["b", "c"], message: null },
      b: { id: "b", parent: "a", children: [], message: { id: "m-b", author: { role: "user" }, content: { parts: ["branch B evidence"] } } },
      c: { id: "c", parent: "a", children: [], message: { id: "m-c", author: { role: "assistant" }, content: { parts: ["redact branch C private"] } } }
    }
  }),
  Object.freeze({
    id: "c2",
    title: "Standalone",
    mapping: { only: { id: "only", parent: null, children: [], message: { id: "m-only", author: { role: "user" }, content: { parts: ["standalone evidence"] } } } }
  }),
  Object.freeze({
    id: "c3",
    title: "Beta build",
    conversation_template_id: "project:beta",
    mapping: {
      r: { id: "r", parent: null, children: ["x", "y"], message: null },
      x: { id: "x", parent: "r", children: [], message: { content: { parts: ["beta branch one"] } } },
      y: { id: "y", parent: "r", children: [], message: { content: { parts: ["beta branch two"] } } }
    }
  })
]);

const contentPolicy = (text) => (text.startsWith("redact") ? "redact" : "keep");
const EXPECTED = Object.freeze({ conversations: 3, nodes: 7, branches: 2, containers: 2, redacted: 1 });

function stage() {
  return stageChatExport(RAW_EXPORT, "historical:fixture", contentPolicy);
}

function accessState() {
  const state = { now: NOW, allowed: true, evidenceValid: true };
  const access = {
    now: () => state.now,
    authorize: () => state.allowed,
    evidence: (id) => ({ record: { id, subjectId: "recovery:fixture", strength: "canonical_record", sourceRef: "isolated:synthetic", recordedAt: "2026-10-31T00:00:00.000Z", verified: state.evidenceValid }, scope: SCOPE, expiresAt: "2026-12-01T00:00:00.000Z" })
  };
  return { state, access };
}

function report(overrides = {}) {
  return {
    sourceSetId: "historical:fixture",
    expectedConversations: EXPECTED.conversations,
    processedConversations: EXPECTED.conversations,
    messageNodes: EXPECTED.nodes,
    branchPoints: EXPECTED.branches,
    projectContainers: EXPECTED.containers,
    candidateProjects: ["candidate:alpha", "candidate:beta"],
    conflicts: [],
    privacyExclusions: ["c1:c"],
    missingArtifacts: ["missing:cover-image"],
    unresolvedUnknowns: [],
    sourceRefs: ["export:synthetic"],
    renameLineage: ["rename:old-alpha"],
    mergeLineage: ["merge:alpha-beta"],
    supersessionLineage: ["supersedes:previous-import"],
    recoveryEvidenceRefs: ["evd_import"],
    coverage: Object.fromEntries(["sourceScopeProcessed", "unresolvedConflicts", "candidateProjects", "missingArtifacts", "renameLineage", "mergeLineage", "supersessionLineage", "privacyExclusions", "unresolvedUnknowns", "recoveryEvidence"].map((key) => [key, true])),
    ...overrides
  };
}

async function auditFixture(staged = stage(), overrides = {}) {
  const { access } = accessState();
  const manifest = {
    id: "historical:fixture",
    scope: SCOPE,
    expectedConversationIds: ["c1", "c2", "c3"],
    expectedStageDigest: await recoveryDigest(staged),
    sourceRefs: ["export:synthetic"],
    evidenceIds: ["evd_import"],
    ...(overrides.manifest ?? {})
  };
  return auditStagedHistoricalRecovery(access, manifest, staged, report(overrides.report));
}

suite("import-adapter-and-provenance", "CCR-05847 — safe staged ingestion with batch identity, validation and provenance", ["CCR-05847"], (check) => {
  check("representative export stages every conversation under one batch identity", () => {
    const staged = stage();
    expect(staged.batchId === "historical:fixture", "batch identity must be preserved");
    expect(staged.conversationCount === EXPECTED.conversations, `expected ${EXPECTED.conversations} conversations`);
    expect(staged.conversations.map((conversation) => conversation.conversationId).join(",") === "c1,c2,c3", "conversation identity must be preserved");
    expect(staged.nodeCount === EXPECTED.nodes, `expected ${EXPECTED.nodes} message nodes`);
  });
  check("invalid exports are rejected before any canonical write", () => {
    expectThrow(() => stageChatExport(RAW_EXPORT, "  ", contentPolicy), /batch id/i, "blank batch identity must be rejected");
    expectThrow(() => stageChatExport({ conversations: [] }, "batch", contentPolicy), /array/i, "non-array export must be rejected");
    expectThrow(() => stageChatExport([{ title: "No id", mapping: {} }], "batch", contentPolicy), /id is required/i, "conversation without id must be rejected");
    expectThrow(() => stageChatExport([...RAW_EXPORT, RAW_EXPORT[0]], "batch", contentPolicy), /duplicate/i, "duplicate conversation identity must be rejected");
    expectThrow(() => stageChatExport([{ id: "t1", title: "Only title" }], "batch", contentPolicy), /mapping is required/i, "a title-only conversation must not be accepted");
    expectThrow(() => stageChatExport(RAW_EXPORT, "batch", () => "publish"), /unsupported/i, "unknown content decisions must be rejected");
  });
  check("provenance is bound to the exact staged source, not caller claims", async () => {
    const staged = stage();
    expect((await recoveryDigest(staged)) === (await recoveryDigest(stage())), "stage digest must be deterministic");
  });
});

suite("complete-message-graph", "CCR-05848 — the complete available message graph is imported, not titles or final messages", ["CCR-05848"], (check) => {
  check("every mapping node is inventoried including empty structural roots", () => {
    const staged = stage();
    const ids = staged.conversations.flatMap((conversation) => conversation.nodes.map((node) => node.id));
    expect(ids.sort().join(",") === ["a", "b", "c", "only", "r", "x", "y"].join(","), `unexpected node inventory: ${ids}`);
    const roots = staged.conversations.flatMap((conversation) => conversation.nodes).filter((node) => node.contentState === "none");
    expect(roots.length === 2, "empty structural roots must be retained rather than dropped");
    expect(staged.conversations[0].nodes.find((node) => node.id === "b").text === "branch B evidence", "message text must be retained");
  });
  check("branch text is never flattened into a single fabricated chronology", () => {
    const staged = stage();
    const alpha = staged.conversations[0].nodes;
    expect(alpha.find((node) => node.id === "b").parent === "a" && alpha.find((node) => node.id === "c").parent === "a", "both branches must keep the shared parent");
    expect(alpha.filter((node) => node.children.length === 0).length === 2, "both branches must remain distinct leaves");
  });
});

suite("branch-aware-lineage", "CCR-05849 — divergent branches keep their lineage and invalid graphs are rejected", ["CCR-05849"], (check) => {
  check("graph validation reports the real branch point and accepts the fixture", () => {
    const [alpha] = stage().conversations;
    const graph = validateConversationGraph(alpha);
    expect(graph.valid === true, `fixture graph must be valid: ${graph.errors.join(",")}`);
    expect(graph.branchPoints.join(",") === "a", `expected branch point a, got ${graph.branchPoints}`);
  });
  check("missing parents, cycles, duplicate children and mismatched links are rejected", () => {
    const node = (id, parent, children) => ({ id, parent, children, contentState: "none" });
    const conversation = (nodes) => ({ conversationId: "c", title: "t", nodes });
    const cases = {
      missing_parent: conversation([node("a", null, ["b"]), node("b", "zzz", [])]),
      cycle: conversation([node("a", "b", ["b"]), node("b", "a", ["a"])]),
      duplicate_children: conversation([node("a", null, ["b", "b"]), node("b", "a", [])]),
      parent_child_mismatch: conversation([node("a", null, ["c"]), node("b", "a", []), node("c", "a", [])])
    };
    for (const [name, fixture] of Object.entries(cases)) {
      const graph = validateConversationGraph(fixture);
      expect(graph.valid === false && graph.errors.length > 0, `${name} must be rejected`);
    }
  });
});

suite("container-identity-lineage", "CCR-05850 — container identity is preserved as lineage, never as canonical truth", ["CCR-05850"], (check) => {
  check("containers group conversations by their historical template identity", () => {
    const lineage = buildHistoricalLineageIndex(stage().conversations);
    expect(lineage.containers.length === EXPECTED.containers, `expected ${EXPECTED.containers} containers`);
    const alpha = lineage.containers.find((container) => container.templateId === "project:alpha");
    expect(alpha && alpha.conversationIds.join(",") === "c1", "alpha container must retain its conversation lineage");
    expect(lineage.standaloneConversationIds.join(",") === "c2", "standalone conversations must remain standalone");
  });
  check("container membership never becomes a current canonical project claim", () => {
    const staged = stage();
    for (const conversation of staged.conversations) {
      for (const key of ["projectId", "canonicalProjectId", "status", "active", "activated"]) expect(!Object.hasOwn(conversation, key), `staged conversation must not claim ${key}`);
    }
    for (const container of buildHistoricalLineageIndex(staged.conversations).containers) expect(Object.keys(container).sort().join(",") === "conversationIds,templateId", "container entries must be lineage evidence only");
  });
});

suite("lost-artifact-original-first", "CCR-05851 — missing artifacts keep their reference and originals are tried before reconstruction", ["CCR-05851"], (check) => {
  check("original recovery is attempted before any reconstruction", () => {
    const base = { missingArtifactRef: "artifact:cover", originalSourceCandidates: ["orig:a", "orig:b"], authorizedCandidateRefs: ["orig:a", "orig:b"] };
    expect(evaluateOriginalFirstRecovery({ ...base, attempts: [{ candidateRef: "orig:a", outcome: "found", evidenceRef: "evd:found", recoveredOriginalRef: "artifact:cover-original" }] }).status === "original_recovered", "a found original must win");
    expect(evaluateOriginalFirstRecovery({ ...base, attempts: [] }).status === "original_search_required", "unattempted originals must require search");
    expect(evaluateOriginalFirstRecovery({ ...base, authorizedCandidateRefs: ["orig:a"], attempts: [] }).status === "awaiting_authorization", "unauthorized originals must await authorization");
    expect(evaluateOriginalFirstRecovery({ ...base, attempts: [{ candidateRef: "orig:a", outcome: "blocked", evidenceRef: "evd:blocked" }, { candidateRef: "orig:b", outcome: "blocked", evidenceRef: "evd:blocked-b" }] }).status === "recovery_blocked", "blocked originals must stay blocked");
    expect(evaluateOriginalFirstRecovery({ ...base, attempts: [{ candidateRef: "orig:a", outcome: "not_found", evidenceRef: "evd:a" }, { candidateRef: "orig:b", outcome: "not_found", evidenceRef: "evd:b" }] }).status === "original_exhausted", "exhausted originals must stop at exhausted");
  });
  check("reconstruction is allowed only after exhaustion, is labelled, and cannot masquerade as the original", () => {
    const exhausted = { missingArtifactRef: "artifact:cover", originalSourceCandidates: ["orig:a"], authorizedCandidateRefs: ["orig:a"], attempts: [{ candidateRef: "orig:a", outcome: "not_found", evidenceRef: "evd:a" }] };
    const reconstruction = { label: "RECONSTRUCTION", artifactRef: "artifact:cover-reconstruction", sourceRefs: ["export:synthetic"], evidenceRefs: ["evd:recon"] };
    const decision = evaluateOriginalFirstRecovery({ ...exhausted, reconstruction });
    expect(decision.status === "reconstruction_allowed", "exhausted originals may allow labelled reconstruction");
    expect(decision.reconstruction.label === "RECONSTRUCTION", "reconstruction must be labelled");
    expect(decision.reconstruction.artifactRef !== "artifact:cover", "reconstruction must not reuse the original reference");
    expectThrow(() => evaluateOriginalFirstRecovery({ ...exhausted, reconstruction: { ...reconstruction, label: "ORIGINAL" } }), /label(?:l)?ed RECONSTRUCTION/i, "unlabelled reconstruction must be rejected");
    expectThrow(() => evaluateOriginalFirstRecovery({ ...exhausted, reconstruction: { ...reconstruction, artifactRef: "artifact:cover" } }), /distinct/i, "reconstruction must use a distinct reference");
    expectThrow(() => evaluateOriginalFirstRecovery({ ...exhausted, authorizedCandidateRefs: ["orig:a"], originalSourceCandidates: ["orig:a", "orig:b"], reconstruction }), /authorization is unresolved|exhaust/i, "reconstruction cannot start before authorized originals are tried");
    expectThrow(() => evaluateOriginalFirstRecovery({ ...exhausted, attempts: [{ candidateRef: "orig:a", outcome: "not_found", evidenceRef: "evd:a" }], reconstruction, authorizedCandidateRefs: [] }), /authoriz/i, "reconstruction cannot begin while authorization is unresolved");
  });
  check("unauthorized, duplicated and dishonest attempts are rejected", () => {
    const base = { missingArtifactRef: "artifact:cover", originalSourceCandidates: ["orig:a"], authorizedCandidateRefs: ["orig:a"] };
    expectThrow(() => evaluateOriginalFirstRecovery({ ...base, attempts: [{ candidateRef: "orig:z", outcome: "found", evidenceRef: "evd:z", recoveredOriginalRef: "artifact:z" }] }), /declared/i, "undeclared candidates must be rejected");
    expectThrow(() => evaluateOriginalFirstRecovery({ ...base, attempts: [{ candidateRef: "orig:a", outcome: "not_found", evidenceRef: "evd:a" }, { candidateRef: "orig:a", outcome: "not_found", evidenceRef: "evd:b" }] }), /duplicate/i, "duplicate attempts must be rejected");
    expectThrow(() => evaluateOriginalFirstRecovery({ ...base, attempts: [{ candidateRef: "orig:a", outcome: "not_found", evidenceRef: "evd:a", recoveredOriginalRef: "artifact:fake" }] }), /cannot claim/i, "a failed attempt cannot claim an original");
    expectThrow(() => evaluateOriginalFirstRecovery({ ...base, attempts: [{ candidateRef: "orig:a", outcome: "found", evidenceRef: "evd:a" }] }), /recovered original/i, "a found original requires its reference");
  });
});

suite("completeness-report-exactness", "CCR-05852 — the completeness report matches the staged graph exactly", ["CCR-05852"], (check) => {
  check("the audited report matches the real staged graph and keeps missing artifacts open", async () => {
    const result = await auditFixture();
    expect(result.processedScopeComplete === true, "complete scope must be reported as complete");
    expect(result.allArtifactsRecovered === false, "missing artifacts must not be reported as recovered");
    expect(JSON.stringify(result.summary) === JSON.stringify({ conversations: EXPECTED.conversations, nodes: EXPECTED.nodes, branches: EXPECTED.branches, containers: EXPECTED.containers, redacted: EXPECTED.redacted }), `unexpected summary ${JSON.stringify(result.summary)}`);
    expect(result.unresolved.includes("missing:cover-image"), "missing artifacts must stay unresolved");
    expect(result.authorityGranted === false, "an import audit must never grant canonical authority");
  });
  check("forged counts, hidden privacy exclusions and wrong provenance are rejected", async () => {
    for (const forged of [
      { messageNodes: 6 },
      { branchPoints: 1 },
      { projectContainers: 1 },
      { processedConversations: 2 },
      { privacyExclusions: [] },
      { sourceRefs: ["export:other"] },
      { coverage: {} }
    ]) {
      let rejected = false;
      try { await auditFixture(stage(), { report: forged }); } catch { rejected = true; }
      expect(rejected, `forged report ${JSON.stringify(forged)} must be rejected`);
    }
  });
  check("scope, digest, access and evidence failures fail closed", async () => {
    const cases = [
      { manifest: { expectedConversationIds: ["c1", "c2"] } },
      { manifest: { expectedStageDigest: "0".repeat(64) } }
    ];
    for (const { manifest } of cases) {
      let rejected = false;
      try { await auditFixture(stage(), { manifest }); } catch { rejected = true; }
      expect(rejected, `manifest override ${JSON.stringify(manifest)} must be rejected`);
    }
    const { state, access } = accessState();
    const staged = stage();
    const manifest = { id: "historical:fixture", scope: SCOPE, expectedConversationIds: ["c1", "c2", "c3"], expectedStageDigest: await recoveryDigest(staged), sourceRefs: ["export:synthetic"], evidenceIds: ["evd_import"] };
    state.allowed = false;
    let denied = false;
    try { await auditStagedHistoricalRecovery(access, manifest, staged, report()); } catch { denied = true; }
    expect(denied, "denied recovery access must be rejected");
    state.allowed = true;
    state.evidenceValid = false;
    let invalidEvidence = false;
    try { await auditStagedHistoricalRecovery(access, manifest, staged, report()); } catch { invalidEvidence = true; }
    expect(invalidEvidence, "invalid recovery evidence must be rejected");
  });
  check("completeness requires every declared dimension and exact counts", () => {
    const valid = validateRecoveryCompletenessReport(report());
    expect(recoveryComplete(valid) === true, "an exact report must be complete");
    expect(recoveryComplete({ ...valid, processedConversations: valid.expectedConversations - 1 }) === false, "incomplete scope must not be complete");
    expect(recoveryComplete({ ...valid, unresolvedUnknowns: ["unknown:creator"] }) === false, "unresolved unknowns must block completeness");
    expectThrow(() => validateRecoveryCompletenessReport({ ...valid, coverage: { ...valid.coverage, renameLineage: false } }), /coverage|dimension/i, "a missing coverage dimension must be rejected");
    expectThrow(() => validateRecoveryCompletenessReport({ ...valid, recoveryEvidenceRefs: [] }), /evidence/i, "recovery evidence is mandatory");
    expectThrow(() => validateRecoveryReport({ ...valid, processedConversations: valid.expectedConversations + 1 }), /invalid/i, "processing more than the source scope is invalid");
  });
});

suite("privacy-exclusion-and-determinism", "Secrets and private content never leak and recovery is deterministic", ["CCR-05847", "CCR-05852"], (check) => {
  check("private branch content is excluded from the stage and from the report", async () => {
    const staged = stage();
    const result = await auditFixture(staged);
    const serializedStage = JSON.stringify(staged);
    const serializedReport = JSON.stringify(result);
    for (const secret of ["redact branch C private"]) {
      expect(!serializedStage.includes(secret), "private content must not survive staging");
      expect(!serializedReport.includes(secret), "private content must not leak into the report");
    }
    const redactedNode = staged.conversations[0].nodes.find((node) => node.id === "c");
    expect(redactedNode.contentState === "redact" && redactedNode.text === undefined, "redacted nodes must keep their identity without content");
    expect(staged.redactedNodeCount === EXPECTED.redacted, "redaction count must be exact");
  });
  check("credential-shaped content is never staged as plaintext", () => {
    const synthetic = ["Bearer", `p15-6-${"a".repeat(24)}`].join(" ");
    let staged;
    try {
      staged = stageChatExport([{ id: "c9", title: "Secret", mapping: { m: { id: "m", parent: null, children: [], message: { content: { parts: [synthetic] } } } } }], "historical:secret", () => "keep");
    } catch {
      return;
    }
    expect(!JSON.stringify(staged).includes(synthetic), "credential-shaped content must never be staged as plaintext");
    expect(staged.redactedNodeCount >= 1, "credential-shaped content must be redacted");
  });
  check("recovery output is deterministic for the same source", async () => {
    const first = await auditFixture();
    const second = await auditFixture();
    expect(JSON.stringify(first) === JSON.stringify(second), "identical sources must produce identical recovery output");
    expect(JSON.stringify(stage()) === JSON.stringify(stage()), "staging must be deterministic");
  });
});

const failedSuites = results.filter((entry) => !entry.passed);
const summary = {
  phaseId: "P15.6",
  suiteCount: results.length,
  checkCount: results.reduce((total, entry) => total + entry.checks.length, 0),
  failedSuiteCount: failedSuites.length,
  failedCheckCount: results.reduce((total, entry) => total + entry.checks.filter((check) => !check.passed).length, 0),
  requirementIds: [...new Set(results.flatMap((entry) => entry.requirementIds))].sort(),
  conversations: EXPECTED.conversations,
  messageNodes: EXPECTED.nodes,
  branchPoints: EXPECTED.branches,
  containers: EXPECTED.containers,
  redactedNodes: EXPECTED.redacted,
  suites: results
};

if (write) {
  const receipt = buildPhaseReceipt({
    phaseId: "P15.6",
    headSha,
    inputs: [
      "clean-room/scripts/p15-6-historical-recovery-audit.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs",
      "clean-room/src/data/historical-export.ts",
      "clean-room/src/data/historical-lineage.ts",
      "clean-room/src/data/privacy.ts",
      "clean-room/src/recovery/contracts.ts",
      "clean-room/src/recovery/historical-report.ts",
      "clean-room/src/recovery/lost-artifact.ts",
      "clean-room/src/recovery/acceptance.ts",
      "clean-room/tests/data-platform-recovery.test.mjs",
      "clean-room/tests/recovery-scale-foundation.test.mjs",
      "clean-room/tests/p15-6-historical-recovery-audit.test.mjs"
    ],
    evidence: [
      "clean-room/scripts/p15-6-historical-recovery-audit.mjs",
      "clean-room/tests/p15-6-historical-recovery-audit.test.mjs",
      "clean-room/tests/data-platform-recovery.test.mjs",
      "clean-room/tests/recovery-scale-foundation.test.mjs",
      "clean-room/tests/p14-5-historical-completeness.test.mjs",
      "clean-room/scripts/phase-receipt-binding.mjs"
    ],
    summary
  });
  writeFileSync(resolve(repoRoot, "clean-room/evidence/phase-receipts/P15_6.json"), JSON.stringify(receipt, null, 2) + "\n");
  console.log(JSON.stringify({ wrote: "clean-room/evidence/phase-receipts/P15_6.json", inputsDigest: receipt.inputsDigest }));
}

console.log(JSON.stringify(summary));
if (failedSuites.length > 0) {
  for (const entry of failedSuites) for (const check of entry.checks.filter((item) => !item.passed)) console.error(`${entry.id} :: ${check.name} :: ${check.error}`);
  process.exit(1);
}
