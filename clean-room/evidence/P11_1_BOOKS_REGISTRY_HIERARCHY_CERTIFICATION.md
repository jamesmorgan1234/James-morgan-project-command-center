# P11.1 — Books Registry and Hierarchy — Certification Evidence

## Roadmap scope
Model author identity, standalone/series/trilogy/collection/umbrella relationships, canonical titles/order, formats, project links, and extensible book types without renderer surgery.

## Locked exit gate
Known books render the correct hierarchy and future book types register without renderer edits.

## Authoritative sources inspected
- `roadmap/master-build-plan-owner-review/22_COMPLETE_199_PHASE_CURRENT_MASTER_ROADMAP_AUDIT_CANDIDATE.md`
- `roadmap/master-build-plan-owner-review/14_COMPLETE_188_PHASE_MASTER_BUILD_PLAN.md`
- current owner continuation instruction for Category 11

## Files inspected
- `clean-room/src/books/registry.ts`
- `clean-room/src/books/runtime-catalog.ts`
- `clean-room/src/books/recovery.ts`
- `clean-room/src/projects/registry.ts`
- `clean-room/tests/p11-1-books-registry.test.mjs`
- `supabase/migrations/20261026116000_p11_1_books_registry.sql`

## Existing implementation preserved
P11.1 implementation commit: `e1171a7667a68ed4919fccbcda15324e68ad5c0c` (`p11.1: harden books registry hierarchy and extensibility`).

The current implementation provides:
- canonical book IDs and project IDs;
- owner-scoped author identity with aliases/pen-name-capable identity records;
- canonical title and versioned registry evidence;
- standalone, series, trilogy, collection, and umbrella relationships;
- work/container roles, parent-child hierarchy, positive sequence validation, duplicate-sequence rejection, cycle rejection, and trilogy cardinality/order constraints;
- Kindle, paperback, hardcover, and digital-other formats;
- extensible book-type registration with stable renderer keys and per-type allowed relationship kinds;
- fail-closed unknown author/type/parent handling;
- owner/project/author/type/role/relationship/parent lineage protection against silent substitution;
- immutable durable SQL history with owner-scoped RLS;
- known runtime book catalog entries for current book projects;
- alias-aware recovery/search contracts in the Books recovery layer.

## Cross-phase ownership inspected
The Category 11 roadmap intentionally separates hierarchy from later metadata, approval, and recovery concerns. Subtitle/edition and full publishing metadata belong to P11.4; protected approval/change state belongs to P11.5; recovered aliases/historical continuity belong to P11.10. P11.1 does not duplicate those core owners.

## Actual gaps / defects found
No hierarchy-specific defect requiring a P11.1 rewrite was proven at the current branch checkpoint. A current-roadmap metadata coverage gap was identified for title/subtitle/edition packaging; it is carried forward as a P11.4 repair seam rather than duplicated into the hierarchy owner.

The existing Books registry stores a required nonblank `projectId` and immutable project lineage. Canonical project existence remains owned by Category 5 `ProjectRegistry`; P11.1 does not create a second project owner.

## Focused proof
`clean-room/tests/p11-1-books-registry.test.mjs` proves:
- known trilogy hierarchy and canonical order;
- expected formats;
- future book-type registration and renderer-key resolution without renderer edits;
- trilogy overflow, duplicate ordering, and invalid parent-role rejection;
- canonical lineage substitution/version regression rejection;
- immutable owner-scoped durable SQL schema.

## Regression / exact-head state
Starting certification checkpoint:
- HEAD: `703702f5c706ff065c14a3025326bd9176bc4cca`
- tree: `ca76d1cf01050d48d4fad7dd179dd3e6282a1e9b`
- inherited full clean-room verification at that checkpoint: 1,406 PASS / 0 FAIL / 0 skipped / 0 cancelled.
- Vercel commit status at the checkpoint: SUCCESS / deployment completed.

This evidence commit is intentionally documentation-only. Its push triggers the existing `Spec Lock v2 Clean Room QA` workflow because `clean-room/**` changed. Post-commit workflow results are verified from GitHub before P11.2 certification proceeds.

## Limitations / non-claims
- No real book was published or submitted.
- No KDP account interaction occurred.
- No approved cover, manuscript, interior, or rollout was changed.
- No production Supabase/auth change occurred.
- No Category 12 work was started by this certification pass.
- P11.1 certification does not claim P11.4 metadata repair complete.

## Protected boundaries
`main`, production, production Supabase/auth, protected release assets, actual KDP publication, paid services, and Category 12 remain untouched.
