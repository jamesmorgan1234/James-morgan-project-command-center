# P9.7 — Protected financial actions

Status: COMPLETE for the authorized repository/static-migration, isolated-harness, and preview-build verification boundary.

Locked exit gate: “No financial action can move money from analysis alone or stale authorization. Protected financial actions require fresh authorization/verification with exact amount/provider scope.”

## Verified context

Repository: jamesmorgan1234/James-morgan-project-command-center
Branch: build/spec-lock-v2-clean-room
Verified implementation HEAD: df72eb363ed2a3f794d70dda654eabbee47b9a0b
Verified implementation tree: 461242687484ed56e6f76396c29ead58eb716767
Parent P9.6 certification HEAD: d7ee455674d489799ca8ba20e1c4dbc1899ce0f7

Files examined or changed:
- clean-room/src/finance/actions.ts
- clean-room/tests/p9-7-protected-financial-actions.test.mjs
- supabase/migrations/20261026105000_p9_7_protected_financial_actions.sql

This evidence file is the only certification artifact added after the P9.7 hardening commit.

## Concrete defects found and corrected

Focused adversarial review found two authorization gaps in the pre-hardening implementation:

1. Money-moving action kinds (`transfer`, `payment`, `trade`, `purchase`) could omit `amountCents` and still reach an authorized result if the rest of the envelope matched.
2. A fresh authorization grant could be timestamped before the exact action intent it purported to authorize.

The implementation was hardened so money-moving action kinds require an explicit positive safe-integer amount and a fresh authorization cannot predate the exact intent. Dedicated regression tests were added for both cases.

No unrelated finance phase, UI/design work, production configuration or provider integration was changed.

## Executed verification

Focused isolated-harness verification against the exact current P9.7 source/test/migration bytes:
- `tests/p9-7-protected-financial-actions.test.mjs` — 8 PASS, 0 FAIL.

Automatic existing Vercel preview verification for implementation commit `df72eb363ed2a3f794d70dda654eabbee47b9a0b`:
- Deployment: `dpl_J89vy9SvcroMBUjCUz8ncMLAAWU9`
- Target: preview only; no production promotion.
- Final state: READY.
- Full clean-room module suite: 1,335 PASS, 0 FAIL, 0 skipped, 0 cancelled.
- Dedicated P9.7 assertions in that build: 8 PASS.

No GitHub Actions workflow was manually dispatched.

## Exit-gate evidence

The dedicated P9.7 tests establish all of the following:

- Exact fresh one-time owner authorization enables only the exact financial action envelope it was issued for.
- Analysis, recommendations and automation outputs cannot authorize money movement.
- Stale, consumed, mismatched or replayed authorizations fail closed.
- Provider health must be available and immediately fresh.
- Authorization is bound across owner, action kind, provider, account scope, amount, intent hash and reference identity.
- Money-moving actions require explicit positive amount scope.
- Fresh authorization cannot predate the exact action intent.
- Durable protected-action records remain immutable, owner-scoped, one-time and receipt-backed.

The implementation therefore does not permit analysis alone, stale authorization, replayed authorization, amount omission, provider/account substitution or pre-intent authorization to produce money-moving authority.

## Static durable-storage/security review

The P9.7 migration defines immutable owner-scoped protected financial intent, authorization, attempt and receipt history. Static review and SQL-text tests verify one-time authorization/receipt linkage, owner isolation, RLS, authenticated access restrictions, fresh-passkey requirements and no silent mutation of historical protected-action records.

This certification does not claim executable database/RLS proof because the migration was not applied to a live or isolated database during this phase. It also does not certify a real banking/payment/trading provider side effect.

## Limits and protected boundaries

No real banking, payment, transfer, purchase, trade, credit or debt-payment action occurred. Main, production, production Supabase/auth and protected release assets were not modified. No merge, production deployment, publication, paid-service activation or spending occurred.

A preview build was allowed as part of normal build verification. Preview verification does not authorize promotion to production.

P9.8 and later phases were not started. Final post-evidence-commit HEAD/tree and any automatically triggered evidence-only preview status must be reported after refetch rather than embedded as an impossible self-referential commit identity here.
