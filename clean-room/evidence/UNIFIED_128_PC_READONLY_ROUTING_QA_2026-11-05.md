# Unified 128 Specialist-Brain PC Read-Only Routing — Isolated QA Evidence

**Date:** November 5, 2026 (America/New_York)  
**Source branch:** `build/cc-unified-128-pc-readonly-isolated-20261105`  
**Base commit:** `4a423c63ecdb1454f7e3f99ee90836288e933cae` (existing draft preview branch)  
**Environment:** isolated GitHub branch + existing free Vercel **preview only**.  
**Production release/Edge deployment:** NOT AUTHORIZED HERE; NOT PERFORMED.  
**New spending, paid models, tool privileges, company actions:** NONE.

## Scope and verified state

- 117 future-company specialist rows and 11 existing-business specialist rows in live `command_center_specialist_brains` = **128 total**. Plus 1 separately implemented COMMAND CENTER central Brain = **129 identities**.
- All 128 project/company/Brain identity chains pass exact canonical matching (117 numbered identities, 11 legacy protected identities).
- All 128 specialist registrations have a provider key but **0 specialist rows enabled**, **0 company-provider scope enabled**, and **0 company-scoped completions**.
- 117/128 roadmap checkpoints exist, all for future-company projects; the 11 protected legacy businesses require verified existing-roadmap/checkpoint reconciliation.
- Existing MarginCraftTools Brain registration version 2 preserves the 19-role/46-phase design evidence. Dedicated runtime remains unverified.
- Provider currently has `brain.respond.read_only` for owner-central/local inference. It **does not** carry `company-brain-read-only`; do not conflate provider mapping with executable access.
- Company 014's company build remains paused. Nothing here permits resumption.

## Staged changes (preview only)

1. `supabase/functions/command-center-pc-worker/index.ts` — candidate copied from live v3 gateway, with canonical future or legacy project-ID parsing and exact profile/specialist verification. Claimed company requests additionally require `specialistLiveVerified`.
2. `clean-room/patches/cc-unified-128-pc-readonly-routing-CANDIDATE.sql` — staged, unexecuted SQL candidate extending the existing `cc_pc_scope` check and the **current live definitions** of `command_center_pc_enqueue_inference` and `command_center_pc_claim_service`. Retains authenticated owner turn, exact conversation/turn scope, unique request identity, worker registration, provider `company-brain-read-only` scope, free cost, verified+active+enabled specialist, and RLS protections. It is **NOT an applied Supabase migration**.
3. `clean-room/src/runtime/owner-security-provider.ts` — canonical app-side project parser and read-only specialist availability derived from exact owner-protected identity, project/company match, roadmap checkpoint, verified specialist and provider, and matching live worker. Specialist telemetry faults cannot erase central Brain history or central PC telemetry.
4. `clean-room/src/runtime/brain-view.ts` — verified specialist messages queue to local PC read-only inference; no fallback to general execution or external company operations when that route is missing.
5. `clean-room/tests/unified-128-pc-readonly-routing.test.mjs` and `clean-room/tests/pc-app-bridge-source-contract.test.mjs` — source and pure-parser regression tests for both company-ID classes and rejection conditions.

## QA performed and evidence limitations

- Current live DB: **128/128 canonical identity matches**; **0** company provider scopes, **0** enabled specialist records, **0** requests admitted under live-ready gates, **117** recorded roadmap checkpoints (future companies only) / **11** missing legacy checkpoints. Checkpoint presence alone does not prove any task completed.
- Staged Deno scope parser evaluated against **128 positive identifiers** (001–117 + exact 11 legacy) and **11 invalid identifiers**, all correctly accepted/rejected.
- Staged source reviewed for owner turn authorization, company/project binding, provider scope, exact worker, disabled state, checkpoint, and unsafe execution fallback.
- GitHub exact-head staged changes are isolated to gateway candidate, SQL candidate, app parser/readiness/queue, and two test files.
- Existing **Vercel preview build** returned **READY** at commit `120c7204523a416fdb5be0fdeb08c33ffdec824e`. That preview result **is not** evidence of production deployment, end-to-end specialist inference, or running the full standalone Node test suite.
- The two staged source-contract suites were fetched from this isolated branch and their assertions executed in an isolated JavaScript runtime: **16 passing / 0 failing checks**. This validates pure scope functions and source contracts, **not** a full Node/TypeScript end-to-end integration run.
- The end-to-end database/gateway integration and full Node test suite **have not been run on the staged branch in an independently deployed integration environment**. No false PASS is claimed.

## Before operational promotion

1. Run exact-branch Node tests (including full repository regression), independent TypeScript check, and SQL syntax/migration dry-run on an isolated copy/transaction that cannot affect live traffic.
2. Preserve old production Edge function v3 and exact database function definitions/constraint; document rollback order and source hashes.
3. Obtain separate owner authorization for the specific production gateway/DB release; no prior P15 candidate authorization is permission for this different change.
4. Deploy the exact tested candidate atomically through the approved release path, with rollback.
5. Reconcile project-specific roadmap/checkpoints for 11 legacy businesses, without resetting any company state or inventing progress.
6. Establish company-only `brain.respond.read_only` provider scope **after** verified policy, no-spend, identity, and negative-gate tests; do not grant tools or operational autonomy by default.
7. Run owner-authorized read-only pilot with real worker model response, exact canonical hash/turn receipt and independent wrong-project/paid/action-denial tests.
8. Only after that may a specialist independently move to `verified` + `enabled`. Assign actual tools later by business-specific capability/role, with exact account and owner permissions.
9. Record proof in central checkpoints and only then report operational readiness, not merely registry/provider mapping.

**State: isolated preview candidate staged and source-checked; live specialist inference still disabled.**
