# P11.6 — Publication Evidence and KDP State — Repair and Certification Evidence

Scope/exit gate: publication state must be tracked per exact book/edition/format/provider/listing with provider receipts, timestamps, errors/corrections, uncertainty and immutable history; `live` is true only with provider evidence. Test orders, local files, draft uploads, or local success never establish publication/revenue.

Inspected: `clean-room/src/books/publication.ts`, `clean-room/tests/p11-6-book-publication.test.mjs`, `supabase/migrations/20261026121000_p11_6_book_publication.sql`, current roadmap P11.6.

Inherited implementation `1fa64de214129edd4420ebd6d972cc5e638aeb7a` already enforced receipt-backed submitted/review/live truth, publication identity, fail-closed transitions, blocked evidence, immutable SQL, and test-order exclusion. Current roadmap gap: inherited state vocabulary lacked not-prepared/prepared/upload-ready/changes-required/rejected/approved/unpublished/archived/superseded and did not key lifecycle by edition/provider listing or preserve correction/uncertainty/last-verified fields.

Repair: added `publication-lifecycle.ts`, focused lifecycle tests, and repository-only migration `20261027234000_p11_6_publication_lifecycle.sql`; exported through Books index. Lifecycle begins `not_prepared`, requires exact supersession and legal transitions, protects provider listing identity, requires provider listing/receipt for provider-confirmed review states, and requires listing + receipt + publication ref + provider timestamp + evidence for `live`. Blocked/changes-required/rejected require error/correction evidence.

Nonclaims/boundaries: no KDP account access, upload, submission, provider receipt fabrication, publication, production migration, sale/revenue claim, protected asset change, or Category 12 work occurred.

Entering checkpoint: `b903241cd939e9c3f215a6738218fa0e5b4d365f`, tree `81febce8ba799503ea2663528989508be4cfb9d4`. Fresh exact-head verification is required after commit; Category 15 remains separately owned.
