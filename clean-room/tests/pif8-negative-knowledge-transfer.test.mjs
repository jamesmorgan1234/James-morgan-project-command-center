import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { assessTransfer, validateNegativeKnowledge } from "../dist/analytics/index.js";

const negative = {
  id: "negative:provider-timeout", version: 1, statement: "method fails under constrained provider regime", sourceRegime: { domain: "books", provider: "provider-a" }, contraindication: { provider: "provider-b", resourceClass: "low" }, failureSignature: "timeout-rate-high", recoveryLessons: ["use-local-fallback"], evidenceRefs: ["evd_failure"], evaluatorEvidenceRefs: ["evd_eval-failure"], active: true, invalidatedByEvidenceRefs: [], recordedAt: "2026-10-26T02:00:00Z", revalidateAfter: "2026-11-26T02:00:00Z"
};
const transfer = {
  id: "transfer:books-method", version: 1, sourceRef: "mth_book-editing", sourceRegime: { domain: "books", provider: "provider-a", resourceClass: "low" }, targetRegime: { domain: "books", provider: "provider-c", resourceClass: "low" }, similarityEvidenceRefs: ["evd_similarity"], applicabilityEvidenceRefs: ["evd_applicability"], evaluatorEvidenceRefs: ["evd_transfer-eval"], negativeKnowledgeRefs: ["negative:provider-timeout"], alternativeRefs: ["mth_book-editing-alt"], evidenceRefs: ["evd_transfer"], decidedAt: "2026-10-26T03:00:00Z", expiresAt: "2026-11-26T03:00:00Z"
};

test("PIF.8 similarity alone cannot qualify transfer", () => {
  const result = assessTransfer({ ...transfer, applicabilityEvidenceRefs: [], evaluatorEvidenceRefs: [] }, [negative], "2026-10-26T04:00:00Z");
  assert.equal(result.decision, "rejected"); assert.ok(result.reasonCodes.includes("similarity_alone_insufficient"));
});

test("PIF.8 known contraindication blocks otherwise attractive transfer", () => {
  const result = assessTransfer({ ...transfer, targetRegime: { domain: "books", provider: "provider-b", resourceClass: "low" } }, [negative], "2026-10-26T04:00:00Z");
  assert.equal(result.decision, "rejected"); assert.ok(result.reasonCodes.includes("known_contraindication")); assert.deepEqual(result.alternativeRefs, ["mth_book-editing-alt"]);
});

test("PIF.8 invalidated negative-knowledge evidence revokes dependent transfer", () => {
  const invalidated = validateNegativeKnowledge({ ...negative, active: false, invalidatedByEvidenceRefs: ["evd_invalidation"] });
  const result = assessTransfer(transfer, [invalidated], "2026-10-26T04:00:00Z");
  assert.equal(result.decision, "revoked"); assert.ok(result.reasonCodes.includes("dependent_evidence_invalidated"));
});

test("PIF.8 scoped evidence can qualify a transfer without making it global", () => {
  const result = assessTransfer(transfer, [negative], "2026-10-26T04:00:00Z");
  assert.equal(result.decision, "eligible"); assert.equal(result.targetRegime.provider, "provider-c");
});

test("PIF.8 durable schema versions negative knowledge and transfer/revocation decisions", () => {
  const sql = readFileSync(new URL("../../supabase/migrations/20261026033000_pif8_negative_knowledge_transfer.sql", import.meta.url), "utf8");
  assert.match(sql, /command_center_negative_knowledge/i); assert.match(sql, /command_center_negative_knowledge_versions/i); assert.match(sql, /command_center_transfer_assessments/i); assert.match(sql, /contraindication/i); assert.match(sql, /recovery_lessons/i); assert.match(sql, /invalidated_by_evidence_refs/i); assert.match(sql, /alternative_refs/i); assert.match(sql, /applicability_evidence_refs/i); assert.match(sql, /evaluator_evidence_refs/i);
});
