# P15.1 auth/privacy batch — semantic review, qualification pending

Start: ebc4216a47462d9046401204b94a7f688318edee, tree 55052349db31d5c56a7ccc768d4d4539d7f1c785. Existing 184 certified rows preserved. No new row is certified by this review document alone.

Exact selected range: CCR-01924 through CCR-01953 (30 rows). Canonical wording read from native authoritative inventory, not inferred from filenames.

| Rows | Semantic determination |
|---|---|
| CCR-01924 | Default public shell contains no private runtime rendering. Enabled owner access is required before canonical loading. Candidate supported. |
| CCR-01925 | Project-name sentinel absent from unauthenticated DOM, independent of route. Candidate supported. |
| CCR-01926 | Private book-title sentinel suppressed in disconnected surface payload. Candidate supported. |
| CCR-01927 | Private revenue sentinel suppressed. Candidate supported. |
| CCR-01928 | Private financial-data sentinel suppressed. Candidate supported. |
| CCR-01929 | Private project-status sentinel suppressed. Candidate supported. |
| CCR-01930 | Private Agent-activity sentinel suppressed. Candidate supported. |
| CCR-01931 | Private Brain-knowledge sentinel suppressed. Candidate supported. |
| CCR-01932 | Private owner-decision sentinel suppressed. Candidate supported. |
| CCR-01933 | Private metric sentinel suppressed. Candidate supported. |
| CCR-01934 | Sensitive connected-provider-name sentinel suppressed. Candidate supported. |
| CCR-01935 | Private document-name sentinel suppressed. Candidate supported. |
| CCR-01936 | Same public/authentication content for different project IDs and unrelated routes; no existence-specific result. Candidate supported. |
| CCR-01937 | Reproduced raw passkey error leak; fixed to allowlisted messages, including generic account-authorization failure. Candidate supported. |
| CCR-01938 | UNVERIFIED: DOM clearing does not prove all provider-owned/pending private in-memory state is cleared. |
| CCR-01939 | Synchronous DOM projection invalidation, no-store protected fetches, stale completion fence. Candidate supported, limited to practical existing projections. |
| CCR-01940 | UNVERIFIED: renderer generation protects new loads, but provider-level account-switch/in-flight session fencing needs exact proof. |
| CCR-01941 | Before any awaited load, previous DOM is removed; only current completion can render; errors and disconnected state show generic public shell. Candidate supported. |
| CCR-01942 | Actual worker fetch handlers tested online/offline with poisoned cache; protected paths never access cache. Candidate supported. |
| CCR-01943 | UNVERIFIED: no owner-authenticated local-data/vault read-path proof. Shell-cache exclusion alone does not establish the conditional future local-data contract. |
| CCR-01944 | UNVERIFIED: static shell allowlist is insufficient proof of explicit sensitive offline-data classification. |
| CCR-01945 | UNVERIFIED: stronger offline storage controls not demonstrated; no new private vault or storage authorization inferred. |
| CCR-01946 | UNVERIFIED: future vault separability needs an explicit storage boundary contract, not a new cache name alone. |
| CCR-01947 | UNVERIFIED: existing broker restore tests do not yet explicitly cover ordinary PWA reopen lifecycle for this row. |
| CCR-01948 | UNVERIFIED: session refresh/expiry code exists; exact expired-session-to-authentication UI lifecycle still needs direct proof. |
| CCR-01949 | UNVERIFIED: general thrown-load handling is improved; expiry-specific nonfrozen retry proof missing. |
| CCR-01950 | UNVERIFIED: generic disconnected recovery remains truthful but exact auth-provider-outage/degraded-state semantics need proof. |
| CCR-01951 | UNVERIFIED: concurrent authentication retry state requires direct duplicate-session proof. |
| CCR-01952 | UNVERIFIED: safe-draft preservation during authentication recovery not demonstrated. |
| CCR-01953 | Public brand/auth form and authenticated route rendering remain distinct. Candidate supported. |

18 candidate mappings; 12 rows deliberately left UNVERIFIED. CCR-01875 and CCR-01908 untouched. No N/A exclusion, no phase closure, no P15.2+ advancement.

Runtime changes are limited to fixed auth errors, synchronous sign-out DOM invalidation, sign-out fencing, current-generation rendering and fixed disconnected public shell. No database/auth policy or production changes. Before repair focused tests reproduced 1 PASS / 2 FAIL; these were not counted as passing. Guarded local module compilation passed; first repaired focused suite 5 PASS / 0 FAIL / 0 SKIP. Expanded generation test and full qualification follow in checkpoint.
