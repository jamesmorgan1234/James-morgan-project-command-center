# P11.2 — Protected Manuscript, Cover, Interior, and Asset Lineage — Certification Evidence

## Roadmap scope
Track canonical manuscript/cover/interior/art/package file identities, versions, hashes, approvals, source versus reconstruction status, protected assets, replacement authority, format derivatives, and recovery lineage without silent substitution.

## Locked exit gate
Approved assets cannot be silently replaced and the authoritative file is explainable.

## Files inspected
- `clean-room/src/books/assets.ts`
- `clean-room/src/books/recovery.ts`
- `clean-room/tests/p11-2-book-assets.test.mjs`
- `supabase/migrations/20261026117000_p11_2_book_assets.sql`

## Existing implementation preserved
P11.2 implementation commit: `bdb6cb9f4738cc470c8d2c933cff467a24568f93` (`p11.2: protect book asset lineage and replacement authority`).

The evidence-backed asset ledger provides canonical owner/project/book/kind identities; exact file references and hashes; monotonic versions; original, recovered-original, and reconstruction origins; source and reconstruction lineage; approval evidence; protected and authoritative flags; exact owner/book/kind/prior-hash/replacement-hash authorization; expiration checks; history; and an authority explanation that identifies the exact authoritative file/hash/provenance.

Recovery contracts separately preserve missing, recovered-original, reconstructed, and present asset states and forbid a missing asset from pretending to have file/hash evidence. Reconstructed artifacts require explicit reconstruction lineage.

## Focused proof inspected
`clean-room/tests/p11-2-book-assets.test.mjs` proves:
- authoritative protected asset explanation by exact file/hash/provenance/approval;
- silent protected-asset replacement rejection;
- exact replacement authorization binding and expiration;
- reconstruction cannot masquerade as an original;
- immutable owner-scoped SQL evidence with content hashes, approval refs, reconstruction refs, and protected replacement authorization.

## Actual gaps / defects found
No P11.2 defect was proven against the current locked gate. No implementation rewrite was required.

## Regression basis
The inherited P11.2 implementation and focused test were already included in the verified Category 10 checkpoint full clean-room run: 1,406 PASS / 0 FAIL / 0 skipped / 0 cancelled at `703702f5c706ff065c14a3025326bd9176bc4cca`. P11.1 certification changed documentation only, so P11.2 executable state remains byte-identical to that verified baseline.

## Limitations / non-claims
- No approved cover, manuscript, interior, artwork, or package was replaced.
- No actual file was reconstructed or declared original by this certification pass.
- No KDP/provider action occurred.
- No production Supabase/auth change occurred.
- No Category 12 work was started.

## Checkpoint entering P11.2
- HEAD: `ea3e56528b3c47d9548d9bbcf0a7da7991550950`
- tree: `6c4e56c2b531dd8f28be8df6c12d7b64c62b193d`

This evidence-only commit uses `[skip ci]` to avoid consuming another redundant full workflow for unchanged executable code. Actual later code repairs receive fresh CI.
