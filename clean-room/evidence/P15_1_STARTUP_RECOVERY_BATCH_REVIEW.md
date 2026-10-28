# P15.1 startup/recovery review: CCR-01954..CCR-01985

Start: acf1100b5eec02889c436c9d0f7d4c2d3396ff33 / ed759614cca3cec1c6c4dd8689e07da3fdad390b. Existing ledger: 206 VERIFIED / 5646 UNVERIFIED / 0 N/A / 0 invalid, still open. Canonical wording read directly from the current inventory.

| Requirement | Evidence determination |
|---|---|
| CCR-01954 shell-first | Supported: public bootstrap HTML precedes gated module entry. |
| CCR-01955 shell before optional services | Supported: fixed non-private bootstrap exists without external services; private rendering remains auth-gated. |
| CCR-01956 auth initialization timeout | Supported: existing 8000ms provider JSON deadline covers fetch and body; interactive credential entry remains user-controlled. |
| CCR-01957 data initialization timeout | Supported: new global 15000ms startup deadline and renderer fence prevent stalled/late data initialization from committing. Unabortable read-only work is fenced, not falsely claimed cancelled. |
| CCR-01958 optional module timeout | UNVERIFIED: no proven per-optional-module initialization deadline/containment. |
| CCR-01959 hung startup detection | Supported: actual coordinator and shipped runtime watchdog tested with controlled timer host. |
| CCR-01960 Recovery instead of infinite splash | Supported: watchdog transitions to Recovery once; late completion cannot replace it. |
| CCR-01961 classifiable bootstrap failure | Supported: fixed config/schema/release/general codes and fail-closed unknown normalization. |
| CCR-01962 separate auth bootstrap class | UNVERIFIED: separate auth failure class is not currently wired through startup. |
| CCR-01963 separate database bootstrap class | UNVERIFIED: general Recovery code does not prove this distinct class. |
| CCR-01964 separate module bootstrap class | UNVERIFIED: distinct module failure classification missing. |
| CCR-01965 separate cache mismatch class | UNVERIFIED: distinct PWA-cache mismatch classification missing. |
| CCR-01966 configuration mismatch class | Supported: existing classifier and startup contract rejection tests. |
| CCR-01967 retryable vs nonretryable | UNVERIFIED: Recovery plan currently allows retry generally without this distinction. |
| CCR-01968 failed-layer-only retry | UNVERIFIED: current control reloads startup globally. |
| CCR-01969 optional failure avoids full restart | UNVERIFIED: some provider failures degrade locally, but evidence does not establish every optional module boundary. |
| CCR-01970 required kernel failure blocks in Recovery | Supported: configuration/schema validation precedes runtime import; required bootstrap timeout fences private readiness. |
| CCR-01971 minimal Recovery dependencies | Supported: Recovery renderer has one kernel import and executes without optional services. |
| CCR-01972 no Brain dependency | Supported: actual Recovery rendering works with no Brain service/module. |
| CCR-01973 no Agent dependency | Supported: actual Recovery rendering works with no Agent service/module. |
| CCR-01974 no Analytics dependency | Supported: actual Recovery rendering works with no Analytics service/module. |
| CCR-01975 no optional integrations dependency | Supported: actual Recovery rendering/retry needs no integrations; worker discovery is bounded and optional. |
| CCR-01976 installed version shown | UNVERIFIED: current Recovery UI does not show installed release identity. |
| CCR-01977 known-good version shown | UNVERIFIED: availability/control exists but version identity is not displayed. |
| CCR-01978 network availability shown | UNVERIFIED: current Recovery UI lacks explicit network diagnostic. |
| CCR-01979 auth reachability shown | UNVERIFIED: no current observed auth-reachability diagnostic displayed. |
| CCR-01980 backend reachability shown | UNVERIFIED: no current observed backend-reachability diagnostic displayed. |
| CCR-01981 safe retry | Supported: actual minimal Recovery button invokes reload without a protected effect or owner-data write. |
| CCR-01982 safe cache refresh | UNVERIFIED: explicit appropriate shell-cache-refresh control absent. |
| CCR-01983 known-good rollback | Supported: actual control uses existing query/restore protocol and reloads only after success; worker protocol test verifies protected traffic stays network-only. |
| CCR-01984 preserve owner data | Supported: retry/restore operate only on startup/shell protocol; injected owner data remains unchanged and worker fallback excludes protected APIs. |
| CCR-01985 private diagnostics | Supported: fixed allowlisted codes/messages; raw/unknown/private runtime values normalize without rendering private details. |

18 candidate mappings, 14 explicit gaps. No promotion from adjacency or broad passing tests. No N/A exclusions. Gaps are recorded for later targeted repair and do not stall unrelated evidence review.

Current coherent repairs: startup watchdog, stale-generation/late-render fence, bootstrap marker while waiting, worker readiness deadline, and unknown diagnostic normalization. Baseline watchdog regressions 0 PASS / 2 FAIL. Worker readiness regression 1 PASS / 1 FAIL with minimal-render test; repaired tests passed. A new fixture initially had a syntax error and was corrected; that failure was not counted as evidence. Final strict module build PASS; focused startup/privacy/recovery suite 25 PASS / 0 FAIL / 0 SKIP; architecture/legacy/scoped diff checks PASS. Exact-source CI and guarded qualification must precede new certification.

Next review uses existing proof first. Keep separate implementation gaps and larger mapping-only qualification groups where repository-native source bindings permit. Do not skip semantic review or weaken gates to increase counts. No P15.2+ advancement; no production/main/Supabase/auth policy/protected release asset changes; no spending or external communications.
