# 129 — R4 DURABLE CALLBACK / R5 EVIDENCE RECONCILIATION — 2026-10-26

Status: **CURRENT RECONCILIATION DELTA / NO CONTROL-COUNT INFLATION**

## Authority and purpose

This file is a narrow evidence reconciliation after the Category 7 R4 durable authenticated callback hardening. It supplements `127_POST_AUDIT_133_IMPLEMENTATION_EVIDENCE_MAP.md` and `128_POST_AUDIT_133_IMPLEMENTATION_EVIDENCE_RECONCILIATION_2026-10-25.md` where callback evidence has changed.

The accepted requirements remain defined by `125_POST_AUDIT_133_CONTROL_REGISTER.md`. This delta does not alter control definitions, phase count, production authorization, or protected/external acceptance boundaries.

## Evidence basis

- Repository: `jamesmorgan1234/James-morgan-project-command-center`
- Branch: `build/spec-lock-v2-clean-room`
- R4 accepted implementation head: `808856796ba9b3f27fd38513a9b4f2a6b8dfe21f`
- R4 accepted implementation tree: `8cce5c9caa253f18f37f8bd7f013a55acd64fde3`
- Exact-head QA run: `40252404222`
- R4 closure evidence: `clean-room/evidence/CATEGORY_7_R4_DURABLE_AUTHENTICATED_CALLBACK_CLOSURE_2026-10-26.md`
- Runtime security contract: `clean-room/src/security/webhooks.ts`
- Durable callback migration: `supabase/migrations/20261025210000_category7_durable_provider_callback_hardening.sql`
- R4 dedicated tests: `clean-room/tests/category7-durable-provider-callback-hardening.test.mjs`
- Updated post-audit regression coverage: `clean-room/tests/post-audit-retrofit.test.mjs`

## Reconciliation totals

R4 materially strengthens existing verified callback controls but does **not** create evidence for a previously PARTIAL/UNVERIFIED control that is sufficient to change its truth state.

Therefore the exact current 133-control totals remain:

- Total accepted controls: **133**
- VERIFIED_BRANCH: **62**
- PARTIAL: **61**
- UNVERIFIED: **9**
- BLOCKED_EXTERNAL: **1**

This is intentional. Evidence reconciliation must not convert stronger proof for an already-verified branch control into artificial count progress.

## Updated callback-related control evidence

| Control | Current truth state | R5 reconciled evidence | Remaining dependency / blocker |
|---|---|---|---|
| A06.4 — Connect durable outbox/inbox and deduplication | **VERIFIED_BRANCH** | Existing canonical Category 7 outbox/inbox is now explicitly the only callback persistence fabric. `WebhookAcceptanceGate` defers replay truth to durable persistence; the new authenticated inbox RPC serializes owner/provider/account streams, performs durable duplicate identity checks and persists authenticated binding evidence. Legacy unbound authenticated write execution is revoked. Exact-head core QA and module tests passed in run `40252404222`. | Production migration and real-provider delivery remain external/protected acceptance. |
| A06.5 — Reconcile unknown external effects before retries | **VERIFIED_BRANCH** | R4 preserves the canonical stale-dispatched→unknown→evidence-backed reconciliation path and explicitly forbids callback loss/uncertainty from implying success. Dedicated R4 tests assert the existing reconciliation contract remains authoritative. | Real provider receipt/state reconciliation remains later external acceptance. |
| A06.7 — Duplicate/out-of-order provider events without repeated/regressive effects | **VERIFIED_BRANCH** | Replay/order authority moved out of process memory and into the durable inbox. Per-stream advisory transaction locking prevents concurrent deliveries racing the cursor; durable max-sequence checks classify lower events `out_of_order`; same event IDs with modified authenticated semantic metadata are rejected as collisions. | Live-provider duplicate/reorder behavior remains external. |
| A15.7 — Verify webhook/provider sender, signature, timestamp, event identity and replay window | **VERIFIED_BRANCH** | `cc-webhook-v1` cryptographically binds provider bytes with provider/event/account/company/environment/timing/key/sequence metadata. Cross-account/environment mismatch, stale/future callbacks, invalid signatures and invalid signing windows fail closed. Durable persistence is mandatory before replay/order truth advances. | Live-provider sender/signature acceptance remains external. |
| A15.8 — Signing-secret rotation with explicit overlapping validity windows and no unauthenticated fallback | **VERIFIED_BRANCH** | **Supersedes the stale 127 wording that cited `activeKeyRefs`.** R4 now uses explicit `WebhookKeyWindow` records with `notBefore`, `notAfter`, optional `revokedAt`, bounded overlap support, rejection outside validity/revocation, ambiguous-window rejection, and no unauthenticated callback fallback. The old unbound authenticated inbox write path is revoked. | Production provider key configuration/rotation drill remains later protected acceptance. |

## Controls intentionally not upgraded

- **A06.1 remains PARTIAL.** R4 provides a stronger canonical durable callback persistence contract, but production/deployed authoritative runtime adapter execution is still not accepted.
- **A13.5 remains PARTIAL.** Callback skew boundaries are branch-proven, but the broader scheduler/effective-policy clock-skew requirement is not closed by R4.
- **A15.9 remains PARTIAL.** Callback key revocation timing is stronger, but the full credential issue/expiry/rotation/revocation + dependent-service-impact workflow is broader than this seam.
- **A16.2 remains VERIFIED_BRANCH with no count change.** R4 strengthens in-flight uncertainty evidence but does not alter its truth state.

## Exact-head verification truth

Run `40252404222` at R4 head passed:

- current authority/phase/Amendment-20 validation;
- typecheck;
- no-legacy-import gate;
- automated repository scan (`1168 / 1168`, zero secret findings, zero violations);
- build;
- release-artifact audit;
- complete module-test step;
- protected-asset release-candidate audit;
- observed PWA lifecycle.

The final Category 15 nonproduction phase gate remained red for its independently preserved upstream/source/receipt/owner-authorization dependencies. Production evidence was correctly skipped. No gate was weakened.

## Non-fabrication and protection rules

- Do not claim production Supabase migration application from branch SQL.
- Do not claim a real provider signed or delivered an R4 callback.
- Do not convert branch tests into production/provider/device acceptance.
- Do not rewrite the unavailable original CCR-00001–CCR-05825 ledger.
- Do not weaken final Category 15 gates to remove an expected red state.
- Do not restore `activeKeyRefs` or process-memory replay authority as a compatibility shortcut.

## R5 disposition

**R5 evidence reconciliation is complete for the R4 seam with no truth-count inflation.**

Dependency progression may continue to **PIF.1 — shared intelligence contracts / ontology** while all external/protected final acceptance boundaries remain preserved.
