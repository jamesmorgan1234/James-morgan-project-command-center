# P9.6 — Goals, debt, scenarios, and decision support

Status: COMPLETE for the authorized repository/static-migration and local-test verification boundary.

Locked exit gate: “Scenario outputs must separate assumptions from verified current data and must not promise score/outcome changes.”

## Verified context

Repository: jamesmorgan1234/James-morgan-project-command-center
Branch: build/spec-lock-v2-clean-room
Verified base HEAD: 05e83ea6978732042bf804d15c30188c4c77fd02
Verified base tree: 65573b34f9780df1a08b7f15b6cb3f4bdffe4a61

Files examined:
- clean-room/src/finance/decision-support.ts
- clean-room/tests/p9-6-goals-debt-scenarios.test.mjs
- supabase/migrations/20261026104000_p9_6_goals_debt_scenarios.sql
- clean-room/tests/finance-platform-foundation.test.mjs

Only this evidence file was added. No implementation, test or migration correction was required by the focused verification.

## Executed verification

Commands run from clean-room using the existing package configuration:
1. `npm run typecheck` — PASS.
2. `npm run build:modules` — PASS.
3. `node --test --test-reporter=spec tests/p9-6-goals-debt-scenarios.test.mjs` — 6 PASS, 0 FAIL, 0 skipped, 0 cancelled.
4. `node --test --test-reporter=spec tests/finance-platform-foundation.test.mjs` — 5 PASS, 0 FAIL, 0 skipped, 0 cancelled.

No broad suite or manually dispatched GitHub Actions run was used.

## Exit-gate evidence

The dedicated tests establish separate verifiedInputKeys/assumptionKeys and evidenceRefs/assumptionRefs. Verified-current inputs require evidence and reject sensitivity assumptions. Owner/model assumptions remain assumptions; conditional arithmetic and low/high sensitivity calculations retain that distinction and reject inverted ranges or a point outside its declared range.

Goal, budget, debt and cashflow references remain visible. Recommendations require verified evidence and retain scenario/evidence/assumption references. Scenario and recommendation outputs explicitly retain scoreForecast:null, outcomePromise:false and protectedActionAuthorized:false. Outputs provide conditional calculations, not credit-score forecasts, approval/rate/lender guarantees, payoff guarantees or action authorization.

The adjacent regression file verifies the existing scenario assumption/current-data separation plus finance read/write isolation and related provider/cashflow boundaries.

## Static durable-storage/security review

The migration defines command_center_finance_decision_scenario_history and command_center_finance_decision_recommendation_history. Scenario history retains verified/assumption keys and references, low/high sensitivity cents, goal/budget/debt/cashflow lineage and observation time. The range constraint bounds resulting_cents. Both tables prohibit non-null score forecasts and true outcome promises or protected-action authorization.

Owner/event primary keys and scenario/observation uniqueness preserve scoped history identity. The immutable-history trigger rejects UPDATE and DELETE. Both tables enable RLS, revoke broad access, and grant authenticated SELECT/INSERT only; their SELECT/INSERT policies require owner_id=auth.uid() and is_command_center_authorized(), with INSERT also retaining the no-forecast/no-promise/no-action predicates.

## Limits and protected boundaries

Migration validation here is static repository review and the dedicated SQL-text assertion test; no database migration or executable database/RLS test was run. This record does not certify production application, real provider data, independent authenticity/freshness of caller-supplied evidence, live authorization, financial outcomes or release readiness.

No real banking, payment, transfer, trading, credit or debt-payment action occurred. Main, production, production Supabase/auth and protected release assets were not modified. No deployment, merge, publish, paid-service activation or spending occurred. P9.7–P9.9 and other categories were not worked.

No reliable Work usage percentage was exposed; the 8% reserve was not independently measured. Final post-commit HEAD/tree must be reported after refetch, without embedding an impossible self-referential commit identity here.
