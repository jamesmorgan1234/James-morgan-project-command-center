# CATEGORY 7 R4 — DURABLE AUTHENTICATED PROVIDER CALLBACK CLOSURE — 2026-10-26

Status: **VERIFIED_BRANCH / PRODUCTION UNTOUCHED**

## Scope

This evidence closes the R4 callback-hardening seam at isolated-branch scope. It does not claim production database mutation, live-provider delivery, production deployment, or physical-device acceptance.

Repository: `jamesmorgan1234/James-morgan-project-command-center`  
Branch: `build/spec-lock-v2-clean-room`

## Exact implementation lineage

- R4 implementation commit: `69acadcbad1bab74f2983492f65d8e9f927f5225` — `category7: harden durable authenticated callbacks`
- Strict TypeScript correction: `3fab1469beea451184e3fee640eacd8143c239f2` — `category7: satisfy strict callback key-window typing`
- Retrofit regression alignment: `808856796ba9b3f27fd38513a9b4f2a6b8dfe21f` — `tests: align webhook retrofit with durable callback contract`
- Exact accepted R4 head: `808856796ba9b3f27fd38513a9b4f2a6b8dfe21f`
- Exact accepted R4 tree: `8cce5c9caa253f18f37f8bd7f013a55acd64fde3`

## Implemented callback guarantees

### 1. Authenticated metadata binding

`clean-room/src/security/webhooks.ts` now defines canonical callback signing version `cc-webhook-v1` and verifies the signature over one canonical envelope containing:

- binding version;
- provider identity;
- provider event identity;
- account identity;
- optional company identity;
- environment;
- occurred-at and received-at timestamps;
- signing-key reference;
- optional provider sequence;
- exact provider payload bytes as supplied by the provider adapter.

The verifier no longer authenticates only the provider payload while trusting callback metadata separately.

### 2. Explicit bounded signing-key lifecycle

The callback contract replaces a bare active-key list with explicit key windows containing `notBefore`, `notAfter`, and optional `revokedAt` timestamps. Receipt must fall inside the allowed interval and before revocation. Ambiguous duplicate key-window definitions fail closed.

### 3. Durable deduplication and ordering

Process-local `Set` / `Map` replay and sequence authority was removed from `WebhookAcceptanceGate`. Successful authentication now explicitly requires durable persistence before deduplication or cursor advancement can be authoritative.

`supabase/migrations/20261025210000_category7_durable_provider_callback_hardening.sql` extends the existing canonical `command_center_agency_side_effect_inbox`; it does not create a parallel webhook queue or callback store.

The authenticated inbox path:

- serializes each owner/provider/account stream with an advisory transaction lock;
- performs durable provider-event identity collision checks;
- performs durable duplicate detection;
- compares provider sequence against durable inbox history;
- marks lower sequences `out_of_order` rather than regressing state;
- persists authenticated binding/hash/key-window evidence with the event.

### 4. No legacy unauthenticated write bypass

Authenticated execution is removed from the old unbound inbox-recording RPC. The new authenticated RPC is the accepted callback write path. Applying an inbox event now fails closed unless the event carries the `cc-webhook-v1` authenticated binding evidence.

Historical legacy rows remain readable but are not silently promoted into newly authenticated callback evidence.

### 5. Unknown/lost callback truth remains reconciliation-based

The pre-existing canonical `command_center_agency_mark_stale_dispatched_unknown` and `command_center_agency_reconcile_unknown_side_effect` path remains authoritative for uncertain external effects. Reconciliation requires evidence and supports explicit `no_effect` / `succeeded` resolution. R4 does not manufacture success when callback delivery is absent or uncertain.

## Verification history

### First implementation-head run

GitHub Actions run `40252177797` correctly failed TypeScript strictness because `noUncheckedIndexedAccess` required an explicit guard for the selected key window. The gate was not weakened; the code was corrected.

### Second run

GitHub Actions run `40252262977` passed authority audit and typecheck but correctly exposed one stale regression test that still expected the retired `activeKeyRefs` + process-memory replay contract. The test was updated to assert the stronger bounded-key-window + durable-persistence contract rather than restoring insecure behavior.

### Accepted exact-head run

GitHub Actions run `40252404222` at exact head `808856796ba9b3f27fd38513a9b4f2a6b8dfe21f` proves:

- current-authority audit: PASS;
- current phase count: `199`;
- Amendment 20 sections: `45`;
- Amendment 20 atomic requirements: `520`;
- PIF mapped capability families: `34`;
- typecheck: PASS;
- no-legacy-import check: PASS;
- repository automated scan: `1168 / 1168` tracked files, zero secret findings, zero violations;
- build: PASS;
- release-artifact audit: PASS;
- module test suite: PASS;
- protected-asset release-candidate audit: PASS;
- observed PWA lifecycle: PASS;
- release artifact: `665` files, one HTML entrypoint, one service worker, protected icon verified, zero structural errors/readiness blockers;
- exact release identity: head `808856796ba9b3f27fd38513a9b4f2a6b8dfe21f`, build hash `1dab3327336da2f4a10fce486af81b089d165c43d638921cf530e63e664f3f9f`, asset-manifest hash `b2d56dbb92552260d46ed6bc81c92190b51dcc4a885351d67f214e6666fd9a20`.

## Preserved final-gate truth

The workflow remains red only at the intentionally strict final Category 15 nonproduction gate. Exact-head output records:

- P15.1 `BLOCKED_SOURCE_ARTIFACT` because the original CCR-00001–CCR-05825 ledger remains unavailable;
- P15.2 `PARTIAL` because semantic every-file review still needs a separate exact-head receipt;
- P15.3–P15.14 remain implemented-but-unverified until their required receipts exist;
- P15.15 `BLOCKED_OWNER_AUTHORIZATION` for an exact current production candidate;
- P15.16–P15.18 remain dependency-blocked.

Those later final-acceptance gates were not weakened or reclassified to make R4 green.

## External/protected boundaries preserved

R4 does **not** establish:

- production Supabase migration application;
- live provider signing-key configuration;
- live provider callback delivery/replay behavior;
- production deployment;
- production-side reconciliation;
- owner acceptance or physical-device acceptance.

Those remain later protected/external gates.

## R4 disposition

**R4 durable authenticated callback persistence is VERIFIED_BRANCH and accepted for dependency progression.**

Next seam: **R5 evidence reconciliation**, followed by **PIF.1 shared intelligence contracts / ontology**.
