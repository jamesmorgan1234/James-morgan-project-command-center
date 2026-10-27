# P11.3 — Production and Subtype QA Workflows — Certification Evidence

## Roadmap scope
Subtype-aware QA for fiction, nonfiction, cookbook, workbook, coloring, activity, and future profiles, including editing, continuity, originality, images, interior, format, and evidence gates.

## Locked exit gate
A subtype fixture cannot advance while required quality gates fail.

## Files inspected
- `clean-room/src/books/qa.ts`
- `clean-room/tests/p11-3-book-qa.test.mjs`
- `supabase/migrations/20261026118000_p11_3_book_qa.sql`

## Existing implementation preserved
P11.3 implementation commit: `7542f8fc0be46bd958ac33045f006e9fc31e8c46` (`p11.3: enforce subtype production QA and fail-closed advancement`).

The current implementation uses versioned subtype profiles and registry-like gate definitions rather than a renderer-sized conditional tree. It supports fiction, nonfiction, cookbook, workbook, coloring, and activity profiles; requires core editing/originality/interior/format gates; requires continuity for fiction/nonfiction and workbook progression; requires image QA for cookbook/coloring/activity; binds evidence to exact owner/profile/version/requirement; selects the latest evidence per requirement; and refuses advancement whenever required evidence is missing or failed.

The gate abstraction can register additional profile keys/gates without changing assessment logic. Detailed project-specific requirements such as recipe structure, answer keys, trim/bleed, previews, manuscript completeness, humanization, plagiarism/originality checks, and page-system checks are represented as evidence-backed gate keys within subtype profiles rather than hard-coded branches.

## Focused proof inspected
`clean-room/tests/p11-3-book-qa.test.mjs` proves:
- fiction requires editing, continuity, originality, interior, and format before advancement;
- cookbook/coloring/activity require image QA and fail closed when image evidence is missing;
- failed required evidence blocks advancement even when all gates have evidence;
- evidence must bind the exact owner-scoped profile version and known requirement;
- stale passing evidence cannot bypass a newer failing result;
- durable QA history is immutable and owner scoped.

## Actual gaps / defects found
No P11.3 defect was proven against the locked advancement gate. No production manuscript or actual book is marked QC-approved by this platform certification.

## Regression basis
The P11.3 implementation/test were included in the verified Category 10 checkpoint full clean-room run: 1,406 PASS / 0 FAIL / 0 skipped / 0 cancelled. Changes since that executable baseline through P11.2 certification are evidence-only.

## Limitations / non-claims
- Synthetic QA fixtures do not certify any actual manuscript/book.
- No real plagiarism-service/provider call was made.
- No approved book asset was changed.
- No real publishing action occurred.
- No Category 12 work was started.

## Checkpoint entering P11.3
- HEAD: `38ec292bf3c8bfcebb3421655fcbd5f5cc5854bf`
- tree: `6e72e7e56dcf77e4eb44f67a2a35e6033512b755`

This evidence-only commit uses `[skip ci]`; actual code repair in later phases receives fresh CI.
