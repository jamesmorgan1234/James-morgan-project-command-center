# P9.9 — Finance security, recovery, and evidence suite

Base: `bf822978a79aa9f60aa4c0aaa8273b94fe39acb6`, tree `f1b8db2f46f8e63b581e23a6276c3702e78454ca`. Branch: `build/spec-lock-v2-clean-room`.

Authority: Roadmap 14 P9.9, retained by Roadmap 22. Scope: provider errors, stale balances, partial sync, duplicates, account relink, compromised provider, restore, audit, protected-action rollback/uncertain outcomes. Gate: **Finance remains evidence-backed and fail-closed across failure/recovery.**

## Findings and repairs

1. Restore assessment formerly accepted generic verified evidence/healthy provider without requiring known-good snapshot hash, current authorization/revocation revalidation, immutable history preservation or missing-account checks. Added explicit restore validation; absent/failed checks reject. Added live-access restore preflight composing P9.8 and canonical AuthSessionStore; historical flags cannot override revoked sessions or missing current capability. Restore remains a preflight/assessment, never authority resurrection or a claim of applied live recovery. Updated the prior restore test fixture to supply the newly required secure contract; retained all original assertions.
2. Identical snapshot hash/time could label a changed account set a duplicate. Now contradictory identity is a manual conflict, duplicate/blank account identifiers reject. Relink cannot be certified with degraded/unavailable health. Unverified rejected recovery cannot claim canonical identity was proven preserved.
3. Existing uncertain-action assessment had no durable pre-dispatch replay fence. Added private atomic attempts and immutable outcome history, unique owner/intent/authorization/intent-hash fences, exact stored authorization and current finance capability checks, current provider health/consent/connection/credential/capability checks, and trusted exact receipt reconciliation. Reservation does **not** dispatch or return money-moving authority: `dispatchAllowed:false`. Repeated reservations return reconciliation-required or reject; neither permits redispatch. No rollback or retry follows merely from an assessment.
4. Nullable provider capability membership could yield SQL unknown instead of explicit permission. Changed to require `IS TRUE`; malformed null capabilities now deny.
5. Cross-phase compatibility review proved canonical C2 database inventory stores JWT AAL names (`aal2`), not TypeScript assurance labels. P9.8 initially denied legitimate canonical AAL2 sessions. The additive P9.9 migration replaces only the new finance row predicate to accept canonical AAL2 **alongside** the separately required trusted passkey finance capability. AAL1/owner membership alone still deny. No C2 authentication function or production auth changed. Explicit least-privilege service_role grants allow trusted classification/capability maintenance and reconciliation; application roles still cannot provision them. Scope classification is append-only, session/provider state supports revocation, attempt/outcome rows are immutable and not directly writable by service_role.
6. Added a sync batch gate: only complete exact expected pages/accounts with verified provenance/integrity, current freshness and current provider/access state can promote canonical current truth. Partial/interrupted/duplicate/missing pages, malformed timestamps, stale/future truth, conflicting or out-of-order snapshots and revoked access never promote. Last known data is retained rather than converted to verified zero.

## Files

Inspected: existing finance recovery/accounts/providers/net-worth/transaction-normalization/actions/isolation/access and all P9 migrations/tests; P9.1–P9.7 evidence; canonical C2 owner-session write path and protected gates; P9.8 PostgreSQL tests; local PGlite persistence API.

Changed: `src/finance/recovery.ts`, `index.ts`; new `src/finance/sync-recovery.ts`; existing `tests/p9-9-finance-recovery-evidence.test.mjs`; new `tests/p9-9-fault-injection.test.mjs`, `tests/p9-9-durable-attempts.test.mjs`, `tests/helpers/finance-postgres.mjs`; new `supabase/migrations/20261027221000_p9_9_durable_finance_attempts.sql`; this evidence.

## Executed proof and coverage

- Strict TypeScript and module compilation: PASS.
- Dedicated `node --test --test-reporter=spec clean-room/tests/p9-9-*.test.mjs`: **24 PASS / 0 FAIL / 0 skipped / 0 cancelled**, including parent/subtests, after all corrections.
- Adjacent `tests/p9-*.test.mjs tests/finance-*.test.mjs tests/category2-*.test.mjs tests/security-foundation.test.mjs tests/data-platform-recovery.test.mjs tests/recovery-scale-foundation.test.mjs`: **230 PASS / 0 FAIL / 0 skipped/cancelled** before the final SQL null-membership/AAL compatibility additions; all included again in final full suite.
- No-legacy and architecture checks: PASS.
- Final `npm run build`: module/browser build PASS; **1,364 PASS / 0 FAIL / 0 skipped / 0 cancelled**.
- Earlier iterations: focused 21, then 23, then 24 PASS; intermediate full runs 1,364 PASS / 0 FAIL. The final run above follows all changes. No failed assertion was removed or weakened. A separate minimal executable probe confirmed the AAL2 compatibility denial before correction.

| Seam | Concrete proof |
|---|---|
| Provider loss/timeout/degradation/malformed state | Unavailable/degraded/compromised/stale runtime state blocks reservations; partial/malformed/stale provider batch blocks promotion. No network timeout implementation or real provider is claimed. |
| Permission/consent/credential/capability loss | Disconnected/expired/revoked/consent-revoked/credential-expired/credential-revoked/missing and null capabilities reject before reservation. |
| Freshness/partial/duplicate/out-of-order/conflicting sync | Dedicated batch faults cannot promote; current snapshot retained; exact duplicate ignored, stale rejected, conflict manual. Same freshness gate applies to balance/liability/transaction snapshots. Existing P9.2/P9.3 tests retain stale/unknown/zero and pending/posted distinctions and raw lineage. |
| Account lifecycle | Existing P9.1 rebind tests rerun: canonical ID preserved, exact replay idempotent, alias history retained, duplicates/collisions/cross-owner/stale version/missing consent/scope reject, disconnect/degradation leaves account intact and grants no write authority. New relink tests reject identity substitution and unhealthy relink. Missing account blocks recovery. |
| Restore | Known-good snapshot/hash/current auth/current revocation/immutable history/missing-account checks; repeat preflight deterministic; live revoked session/missing capability cannot restore. Data recovery cannot rehydrate credentials/capabilities/attempt authority. |
| Dispatch uncertainty/restart/replay | Reservation committed before any dispatch contract; repeated SQL invocation and **dump/reopen of the PostgreSQL data directory in a new instance** retain replay fences. Missing receipts and uncertain/partial outcomes require reconciliation. New attempt ID or duplicate intent hash cannot bypass. |
| Failure/rollback | Transaction error rolls uncommitted reservation back, before any dispatch permission; committed pre-dispatch failure remains fenced. No financial reversal is simulated as rollback; post-dispatch uncertainty requires provider reconciliation and any compensating action needs a new exact owner authorization/intent. |
| Receipts/audit | Exact provider/account/amount/hash and authorization provenance are preserved; wrong/null receipt scope and missing terminal receipt reject. Trusted service_role reconciliation tested; ordinary application role cannot access/mint private attempts/outcomes. Events idempotent, collisions reject, terminal history immutable. Later contradictory evidence requires incident handling, not history rewriting. |

## Remaining deployment boundaries and operational contract

These are isolated repository/SQL/fault-injection proofs, with explicit Auth fixtures rather than hosted Supabase login. Provider runtime assertions must be populated only by a trusted server after verification; never trust provider/client claims as authorization. Future real dispatch adapters must atomically commit the reservation, use the exact stored action, revalidate current authorization/provider state immediately before dispatch, and reconcile every uncertain result against actual provider receipts. No such adapter or live money movement is enabled here. Attempts/outcomes are a security ledger and must never be rewound by data-only restore. A lost/untrusted ledger blocks financial dispatch until reconciled, not automatic rebuild from possibly old action grants. Retaining fences can require a new owner-authorized intent even after known failure; availability is subordinate to no duplicate money movement.

Recovery preflight acceptance is not proof that a production backup was restored; sync promotion decision is not a claim that a production scheduler/transport is installed. Hosted authentication, real provider signatures/receipts, provider-specific rollback, production restore and physical device acceptance remain protected later release/integration boundaries. No production acceptance is inferred from a preview.

## Category 9 checkpoint

P9.1–P9.7 evidence was reviewed, not rewritten: existing exit-gate certificates retained. Their dedicated tests rerun in the adjacent and final full suites. P9.1 canonical reconnect identity, P9.2 explicit financial truth states, P9.3 dedup/transfer/raw lineage, P9.4 recurrence vs obligation truth, P9.5 provider/model/date/isolation, P9.6 assumptions vs verified data/no promises, P9.7 fresh exact protected authorization, P9.8 capability/RLS isolation, P9.9 failure/recovery evidence are proven at their declared repository/isolated verification boundary. This does not certify live financial integrations or overall Category 15 readiness.

P9.8 remote preview status: Vercel success/completed for `bf822978a79aa9f60aa4c0aaa8273b94fe39acb6`. GitHub Actions run `40590024094`, job `122491542786`: authority/typecheck/core QA/PWA lifecycle PASS; separate Final Category 15 nonproduction phase gate FAIL; production live gate SKIPPED. Final P9.9 exact-head automatic checks must be recorded after publication; no full CI-green claim from local module tests.

Main, production, Supabase, production auth, protected release assets untouched. No real account connected, banking/payment/transfer/purchase/trading/credit/debt action, merge, production deployment/promotion, paid activation or spend. Category 10 not started. James Morgan retains final authority; Command Center remains top-level control plane; scoped subordinate isolation preserved.
