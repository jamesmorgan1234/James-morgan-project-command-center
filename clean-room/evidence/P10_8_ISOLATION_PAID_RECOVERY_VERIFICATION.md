# P10.8 — Cross-company isolation, paid actions, and recovery

Authority: Roadmap 14 P10.8 / Roadmap 22. Exit: **One brand/account compromise cannot leak or mutate another; paid actions remain blocked without exact approval.** Base `608f7973418fd85ba801c7f2358f4bc58a3f9f66`, tree `46a1088dc67878bd959356433f32bacf5863cb7b`. Authorized branch `build/spec-lock-v2-clean-room`.

Status: COMPLETE for the authorized repository/isolated-database verification boundary. Exact-head external checks and preview limitations are reported in the final return handoff.

## Defects and repairs

Existing social RLS enforced owner membership, not company/project/account capability. Added private server-issued per-session/account capabilities and RESTRICTIVE read/insert policies on every current social table, intersecting existing owner policies. Requires actual Auth session and unrevoked canonical C2 owner-session inventory, current owner authorization, passkey-backed capability, fresh verification/expiry, explicit table permission, exact canonical brand/company/project/account, no revocation/containment; writes additionally require fresh passkey assurance and explicit write. Canonical C2 database AAL2 names are honored, but AAL2 alone grants no social capability. Companion publish/asset rows resolve their account through their canonical parent. Accountless shared configuration rows default deny to ordinary clients and require trusted scoped server access; there is no global-owner bypass. Service credentials remain only in trusted server composition, never providers/domain Agents.

Added SocialAccessBoundary using existing C2 live sessions/policies and trusted lookups; context is minimized to allowed classes and canonical target metadata, excluding credential material, aliases and authorization references. Wrong owner/company/project/account, missing/expired/contained/revoked/read-only capability, insufficient assurance or forbidden data class deny. Protected publish/send remain separate exact-authority gates; read/write never grants either.

Paid DTOs and a reference/boolean formerly permitted an allowed result. Legacy paid assertion now rejects metadata-only permission. Canonical paid assessment requires current exact C2 owner-verified grant/session/policy and owner/company/project/account/action/amount/currency binding, current freshness and bounded budget. Even a valid assessment returns protectedActionAuthorized=false; it does not execute or enable spending. Tests use synthetic owner grants, never real approval or money. No paid SDK endpoint is enabled here. Ordinary clients cannot mint paid-assessment history.

Restore has explicit schema v1, trusted known-good SHA-256, exact current account/underlying identity/provenance, current write authorization revalidated after hashing, allowed data-only record kinds and uniqueness. Credentials/capabilities/publish/send/reservation/outcome authority cannot be imported. Output is repeatable staging-only, never restored authority or replay permission. Current revocation remains effective after database dump/reopen. Immutable private reservation/evidence history is never rewound by data restoration.

Final regression/coverage corrections: runtime social surface reader now checks an actual read-time clock and explicitly configured required scope, not token/reference presence or a frozen observation timestamp; healthy fixture supplies that evidence. Scoped inbox follow-up reuses existing NeedsMeQueue under current SocialAccessBoundary and copies no external text into owner instructions; repeat is idempotent, wrong-brand follow-up denies and no send authority results. Every attachment is checked against profile format/dimension/duration rules, including later attachments; finite measured metadata is retained immutably with the draft asset revision and missing legacy measurements stay unknown. Analytics source taxonomy defaults to unknown when absent rather than manufacturing provider-reported origin; its branch-only migration/model/test were corrected without applying any database migration externally.

## Files and verification

Changed: src/social/access.ts (new), recovery.ts, index.ts, analytics.ts, drafts.ts, protected-publishing.ts; src/runtime/surface-readers.ts; tests/helpers/social-postgres.mjs; tests/p10-8-boundary-hardening.test.mjs (new), p10-8-postgres-isolation.test.mjs (new), p10-8-social-recovery-isolation.test.mjs, p10-7-analytics-hardening.test.mjs, p10-5-publish-hardening.test.mjs, runtime-surface-readers.test.mjs; migrations/20261027234000_p10_8_account_capability_isolation.sql (new), 20261027233000_p10_7_truthful_analytics.sql (unknown taxonomy correction); this evidence.

Inspected current recovery/isolation/paid contracts, all P10 schemas/tests/evidence, live-action gates and C2 session/policy/grant interfaces; existing Needs Me interface and runtime surface reader only as directly affected dependencies. No Category 9 or 15 repair and no Category 11 work.

- Strict TypeScript and module compilation: PASS.
- P10.8 + P10.5/P10.6/social adjacent suites: 43 PASS / 0 FAIL before the final runtime/follow-up additions.
- P10.8/runtime/Needs Me seam: 23 PASS / 0 FAIL / 0 skipped/cancelled after follow-up integration.
- Final P10.7/P10.8/runtime truth/scope seam: 28 PASS / 0 FAIL / 0 skipped/cancelled.
- All Category 10 tests before final attachment checks: 81 PASS / 0 FAIL / 0 skipped/cancelled. Final Category 10 test count is 83, all executed in the final full suite; attachment/P10.8 seam additionally passed 29 / 0 FAIL.
- Social/P10/C2/security/Agency regressions: 213 PASS / 0 FAIL / 0 skipped/cancelled before final runtime/follow-up changes; included again in final full suite.
- No-legacy/architecture checks: PASS.
- Final `npm --prefix clean-room run build`: **module/browser build PASS; 1,406 PASS / 0 FAIL / 0 skipped / 0 cancelled**.
- `git diff --check`: PASS.

Executable PostgreSQL tests run all eight baseline and eight hardening migrations, real RLS and invoker views. They prove owner membership alone cannot read/provision capabilities; one company cannot read/mutate another; owner/session/company/project/table substitution, expiry/revocation/containment deny; every social table has restrictive policies; current capability reads only its canonical identity; revoked owner session survives dump/reopen and cannot be revived by an application-role write. Auth functions are explicit fixtures, not hosted Supabase authentication proof; service_role fixture explicitly models its server-only BYPASSRLS property, never application-role access.

Intermediate verification failures were repaired, not hidden: initial P10.8 fixture reset left its mock authorization false and a role active after a failed assertion; an attempted fixture correction had a quoting syntax error; corrected both while retaining all assertions. First full build: 1,401 PASS / 1 FAIL in runtime-surface-readers due unforwarded connection freshness/health contract. Corrected runtime clock/scope forwarding and its fixture, added staleness regression: full build 1,403 PASS / 0 FAIL. Follow-up integration: 1,404 PASS / 0 FAIL. Final run above follows unknown-source and all-attachment validation/storage corrections. No security assertion removed or weakened.

## Category 10 exit-gate register

| Phase | Dedicated final tests | Gate evidence |
|---|---:|---|
| P10.1 | 10 | Canonical account/brand/company/project/platform immutable binding, explicit history/aliases/supersession, SQL cross-version substitution rejected. |
| P10.2 | 8 | Both current/compatibility liveness require verified credential/provider health, scopes and clock; canonical provider account verified; loss/reconnect explicit. |
| P10.3 | 10 | Exact asset rights/provenance/revision/account approval, sealed actual content, canonical target and retained history; drafts are not authority. |
| P10.4 | 8 | Versioned profiles/adapters enforce declared constraints and reject unsupported/deprecated rules; core workflow unchanged by profile updates. |
| P10.5 | 12 | Current C2 owner grant plus durable unique reservation, no reprepare reset, uncertainty/restart cannot redispatch, exact receipts and explicit schedule/cancel. |
| P10.6 | 9 | Every inbound payload is untrusted data; whitelisted immutable identity, safe triage/reply/context and separate C2 one-time send reservation. Scoped follow-up regression is additionally in P10.8. |
| P10.7 | 9 | Observed freshness, zero vs unknown/partial/conflict, independent non-test outcome evidence, causal estimates separated, no invented revenue. |
| P10.8 | 17 | Actual account-scoped RLS/containment, metadata cannot grant paid authority, current revocation and data-only restore, minimized context/follow-up. |

All eight gates are proven at the stated repository/isolated-SQL/fault-injection boundary. The roadmap's 106 coverage figure is authority metadata, not a claim that this task independently closed every Category 15 traceability row.

## Protected assets, previews and limits

No real account connected, content published, message sent, ads/boosts/trials/purchases activated or money spent. Main, production, production Supabase/auth, protected release assets and deployment configuration untouched. No merge, force-push, production deploy/promotion. James Morgan retains final authority; Command Center remains the permanent top-level control plane and all subordinate data/capabilities remain scoped.

No production schema application, live OAuth/provider transport, real provider receipt/revenue, production backup restore or physical-device acceptance is claimed. Actual server adapters must load canonical records, enforce these boundaries and durable reservations, and never trust client-generated gate decisions. Legacy/unclassified rows default deny rather than infer scope; explicit reviewed append-only correction is required. Recovery rollback is containment/revocation and retained evidence, not dropping policies or replay fences.

Exact-head automatic GitHub/Vercel results must be recorded after publishing this commit. Existing Category 15 traceability/owner-release gates remain separate and may fail; they were not weakened. Render connector had no selected/owner-confirmed workspace; no Render deployment or configuration change was attempted. No paid preview retry/upgrade. Final return reports exact preview limitations and live head/tree. Category 11 not started.
