# P11.4 — Metadata, Formats, Pricing, and Rollout — Repair and Certification Evidence

## Roadmap scope
Version descriptions, keywords/categories, title/subtitle/author/edition/reference metadata, trim/bleed/print specs, Kindle/print/collection formats, KDP Select rollout order, pricing recommendations versus approvals, package manifests, and exact file-to-format mappings.

## Locked exit gate
Metadata/package state is versioned and rollout respects owner-locked order.

## Files inspected
- `clean-room/src/books/metadata.ts`
- `clean-room/tests/p11-4-book-metadata-rollout.test.mjs`
- `supabase/migrations/20261026119000_p11_4_book_metadata_rollout.sql`

## Existing implementation preserved
P11.4 implementation commit: `04496f9a5ab647422199fa98d212341f7d68e7d3` (`p11.4: version book metadata pricing and locked rollout`). Existing rollout validation, KDP Select format constraints, package readiness, recommendation evidence, and owner-locked order matching remain unchanged.

## Gap proven in current roadmap
The inherited package model did not explicitly carry canonical title, subtitle, edition, author identity/display byline, ISBN/reference identity, print-specification identity, approved-price lineage, or exact canonical file-to-format mapping. Those omissions were narrower than the current locked P11.4 scope.

## Repair
Added an additive publication-metadata detail contract rather than rewriting the stable rollout owner:
- `clean-room/src/books/publication-metadata.ts`
- `clean-room/tests/p11-4-book-publication-metadata-details.test.mjs`
- `supabase/migrations/20261027233200_p11_4_book_publication_metadata_details.sql`
- exported through `clean-room/src/books/index.ts`

The repair adds:
- default byline constant `James Morgan` while allowing explicit title-specific pen-name identity;
- title, subtitle, edition, author identity/display name, optional ISBN/reference;
- trim size, bleed, and print-specification reference;
- declared publishing formats and exact one-to-one canonical file mappings with file hash and asset version;
- package manifest reference;
- separate recommended and approved price states;
- explicit recommendation evidence for recommendations and explicit approval evidence for approved prices;
- immutable owner-scoped durable history.

## Focused tests added
The new focused test proves:
- title/subtitle/edition/author/ISBN/print/package/file mapping state;
- James Morgan remains the default byline while explicit pen names remain supported;
- recommendations never become approvals implicitly;
- approved prices require explicit approval lineage;
- every declared format has exactly one canonical file mapping;
- durable SQL history contains the new detail fields and owner-scoped immutability controls.

The inherited P11.4 test continues to prove versioned package state, contiguous locked rollout order, KDP Select restrictions, owner-locked plan matching, package-readiness blockers, pricing evidence, and cross-owner/project rejection.

## Protected boundaries
This commit only adds repository code/tests/a migration file. It does not apply any migration to production, publish any title, change a KDP account/listing, change approved rollout decisions, replace assets, spend money, or start Category 12.

## Checkpoint entering repair
- HEAD: `82634b94540afbec4592ed1ef047ee50d67dde69`
- tree: `0cefde30dad098432b5fbcc48a60473e57f082b2`

Fresh push QA is required for this executable repair before P11.5 certification proceeds.
