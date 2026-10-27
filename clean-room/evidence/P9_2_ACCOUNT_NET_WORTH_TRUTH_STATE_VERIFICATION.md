# P9.2 Account / Net-Worth Truth-State Verification

Date: 2026-10-27

## Scope

P9.2 only: verify that account/net-worth views distinguish source date, pending, unavailable, and verified zero without collapsing unknown financial state into zero.

## Verified implementation

`clean-room/src/finance/accounts.ts` defines financial position values as distinct `verified`, `pending`, `stale`, or `unavailable` states. `unavailable` carries an explicit reason and cannot carry a fabricated numeric balance. Every financial account position carries a `valuationDate`, provenance, owner/account/provider identity, and `protectedActionAuthorized: false`.

`clean-room/src/finance/net-worth.ts` preserves those states in `calculatePositionNetWorth`:

- verified positions alone contribute to verified asset/liability/net-worth totals;
- a verified numeric zero is recorded separately in `verifiedZeroAccountIds`;
- pending positions are recorded in `pendingAccountIds` and excluded from verified totals;
- unavailable positions are recorded in `unavailableAccountIds` and excluded from verified totals;
- stale positions are recorded separately in `staleAccountIds`;
- each account's source/valuation date is preserved in `sourceDatesByAccount`;
- `complete` is false while pending, stale, or unavailable positions remain.

## Deterministic proof

Commit `9a61fc6e635476461df862d17f254206de5d3827` added only:

`clean-room/tests/p9-2-net-worth-truth-states.test.mjs`

The test proves in one snapshot that:

1. verified zero remains an explicitly verified account and is separately identifiable as zero;
2. pending value does not enter verified totals;
3. unavailable value does not enter verified totals;
4. source dates remain independently attached to all three account states;
5. the snapshot remains incomplete while pending/unavailable state exists.

Exact-head Spec Lock v2 Clean Room QA for commit `9a61fc6e635476461df862d17f254206de5d3827` passed TypeScript typecheck and the `Category 15 exact-head core QA and release gates` step. That step runs `npm run build` and `npm run test:modules`; `test:modules` runs `node --test --test-reporter=spec tests/*.test.mjs`, so the P9.2 test was included and passed.

## P9.2 exit gate

PASS: account/net-worth views distinguish source date, pending, unavailable, and verified zero. No unknown/pending/unavailable amount is silently converted into verified `$0`.

## Non-claims / protected boundaries

This checkpoint does not certify live financial-provider production integration, real banking/payment/transfer/trading operations, or Category 15 completion. It makes no production, Supabase, authentication, deployment, `main`, or P9.3 change.
