import test from "node:test";
import assert from "node:assert/strict";
import {
  BookRegistry,
  BookAssetLedger,
  evaluateBookQa,
  validateMetadata,
  validateRollout,
  BookApprovalLedger,
  validatePublication,
  countsAsSale,
  PublishingProviderRegistry,
  reconcileBookMetrics,
  DEFAULT_BOOK_EXECUTION_POLICY,
  assertBookExecutionAllowed,
  validateBookRecovery
} from "../dist/books/index.js";

test("Books registry preserves hierarchy and future book types register without renderer changes", () => {
  const registry = new BookRegistry();
  registry.registerBookType("fiction");
  registry.registerBookType("workbook");
  registry.registerAuthor({ id: "author-1", displayName: "Author", sourceRefs: ["owner"] });
  registry.registerBook({ id: "series-1", projectId: "p1", authorId: "author-1", canonicalTitle: "Series", relationshipKind: "series", parentBookId: null, sequence: null, formats: ["kindle"], bookType: "fiction", version: 1 });
  registry.registerBook({ id: "book-1", projectId: "p1", authorId: "author-1", canonicalTitle: "Book One", relationshipKind: "standalone", parentBookId: "series-1", sequence: 1, formats: ["kindle", "paperback"], bookType: "fiction", version: 1 });
  assert.deepEqual(registry.hierarchy("series-1").map((book) => book.id), ["series-1", "book-1"]);
  assert.throws(() => registry.registerBook({ id: "bad", projectId: "p", authorId: "author-1", canonicalTitle: "Bad", relationshipKind: "standalone", parentBookId: null, sequence: null, formats: [], bookType: "unknown", version: 1 }));
});

test("protected approved book assets cannot be silently substituted", () => {
  const ledger = new BookAssetLedger();
  ledger.put({ id: "cover-v1", bookId: "book-1", kind: "cover", version: 1, contentHash: "hash-a", origin: "original", sourceRefs: ["approved-file"], approved: true, approvalRef: "owner-approval", protected: true });
  assert.throws(() => ledger.put({ id: "cover-v2", bookId: "book-1", kind: "cover", version: 2, contentHash: "hash-b", origin: "reconstruction", sourceRefs: ["new"], approved: false, approvalRef: null, protected: true }));
  assert.doesNotThrow(() => ledger.put({ id: "cover-v2", bookId: "book-1", kind: "cover", version: 2, contentHash: "hash-b", origin: "reconstruction", sourceRefs: ["new"], approved: false, approvalRef: null, protected: true }, "explicit-owner-reopen"));
});

test("subtype QA blocks advancement on missing or failed required evidence", () => {
  const profile = { key: "cookbook", requirements: [{ key: "originality", required: true }, { key: "interior_uniformity", required: true }] };
  assert.equal(evaluateBookQa(profile, [{ requirementKey: "originality", passed: true, evidenceRefs: ["qc"] }]).pass, false);
  assert.equal(evaluateBookQa(profile, [{ requirementKey: "originality", passed: true, evidenceRefs: ["qc"] }, { requirementKey: "interior_uniformity", passed: true, evidenceRefs: ["qc2"] }]).pass, true);
});

test("metadata/package state is versioned and rollout preserves locked order", () => {
  const metadata = validateMetadata({ bookId: "book-1", version: 2, description: "Description", keywords: ["a"], categories: ["b"], trimRef: "6x9", bleed: false, packageManifestHash: "manifest", sourceRefs: ["package"] });
  assert.equal(metadata.version, 2);
  assert.deepEqual(validateRollout([{ order: 2, format: "paperback", kdpSelect: false }, { order: 1, format: "kindle", kdpSelect: true }]).map((step) => step.order), [1, 2]);
});

test("owner approvals require explicit action evidence and supersession lineage", () => {
  const ledger = new BookApprovalLedger();
  ledger.record({ id: "a1", bookId: "book-1", kind: "cover", targetVersion: 1, approved: true, ownerActionRef: "owner-message", decidedAt: "2026-10-23T18:00:00Z", supersedesApprovalId: null });
  ledger.record({ id: "a2", bookId: "book-1", kind: "cover", targetVersion: 2, approved: false, ownerActionRef: "owner-reopen", decidedAt: "2026-10-23T19:00:00Z", supersedesApprovalId: "a1" });
  assert.equal(ledger.current("book-1", "cover").id, "a2");
});

test("publication/live requires provider evidence and test orders never count as sales", () => {
  assert.throws(() => validatePublication({ id: "pub", bookId: "book-1", format: "kindle", providerKey: "kdp", state: "live", providerReceiptRef: null, observedAt: "2026-10-23T18:00:00Z", sourceRefs: ["provider"], testOrder: false }));
  const live = validatePublication({ id: "pub2", bookId: "book-1", format: "kindle", providerKey: "kdp", state: "live", providerReceiptRef: "receipt", observedAt: "2026-10-23T18:00:00Z", sourceRefs: ["provider"], testOrder: true });
  assert.equal(countsAsSale(live), false);
});

test("publishing providers are replaceable and expose truthful Work boundaries", () => {
  const providers = new PublishingProviderRegistry();
  providers.register({ key: "kdp", version: 1, health: "available", capabilities: ["upload"], boundary: "work_required", sourceRef: "provider-contract" });
  assert.equal(providers.route("upload").boundary, "work_required");
});

test("book performance keeps projected/confirmed/settled truth and dedupes IDs", () => {
  const metrics = reconcileBookMetrics([{ id: "m1", bookId: "book-1", format: "kindle", metric: "royalties", value: 12, currency: "USD", truth: "confirmed", sourceRef: "kdp", observedAt: "2026-10-23T18:00:00Z" }, { id: "m1", bookId: "book-1", format: "kindle", metric: "royalties", value: 12, currency: "USD", truth: "confirmed", sourceRef: "kdp", observedAt: "2026-10-23T18:00:00Z" }]);
  assert.equal(metrics.length, 1);
  assert.equal(metrics[0].truth, "confirmed");
});

test("Books remain excluded from portfolio Agent Auto and Work remains publishing-only", () => {
  assert.equal(DEFAULT_BOOK_EXECUTION_POLICY.portfolioAgentAutoAllowed, false);
  assert.throws(() => assertBookExecutionAllowed(DEFAULT_BOOK_EXECUTION_POLICY, "writing", "portfolio_agent"));
  assert.doesNotThrow(() => assertBookExecutionAllowed(DEFAULT_BOOK_EXECUTION_POLICY, "writing", "normal_chat"));
  assert.throws(() => assertBookExecutionAllowed(DEFAULT_BOOK_EXECUTION_POLICY, "writing", "work"));
  assert.doesNotThrow(() => assertBookExecutionAllowed(DEFAULT_BOOK_EXECUTION_POLICY, "submission", "work"));
});

test("Books recovery scales with provenance and unresolved missing assets stay explicit", () => {
  const result = validateBookRecovery([{ bookId: "b1", projectId: "p", canonicalTitle: "One", sourceRefs: ["old-chat"], artifactRefs: ["manuscript"], missingArtifactKinds: ["cover"], status: "active" }, { bookId: "b2", projectId: "p", canonicalTitle: "Two", sourceRefs: ["old-chat"], artifactRefs: [], missingArtifactKinds: [], status: "dormant" }]);
  assert.deepEqual(result, { total: 2, unresolved: 1 });
});
