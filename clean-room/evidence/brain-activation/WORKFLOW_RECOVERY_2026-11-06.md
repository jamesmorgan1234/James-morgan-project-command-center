# Existing workflow recovery — November 6, 2026

The user specifically requested recovery of the chat titled Continue Execution Requirements. Two targeted Personal Context searches did not expose the full original transcript. Neither neighboring summaries nor the current chat are represented as that original transcript. No other chat was modified.

Authoritative repository recovery: branch `build/cc-unified-128-pc-readonly-isolated-20261105`, exact HEAD `b6393fdff14eb3c0600adfbda991c57c09a9acda`, file `clean-room/evidence/UNIFIED_128_PC_READONLY_ROUTING_QA_2026-11-05.md`. Its 21:35 EST preflight records 128 canonical identities, checkpoints, matching provider/worker links, an existing enabled PC worker, and one completed central inference. It explicitly says not to rebuild the worker. It also records zero enabled specialists, absent company provider scope, future-only deployed queue constraint, and staged/undeployed legacy routing and app changes. This confirms preserved working infrastructure and incomplete specialist connection; it does not establish which chat caused any regression.

Preserved workflow: phone/app command → authenticated saved conversation/turn → persistent Supabase queue → existing Windows PC worker/Ollama → hashed, scope-checked saved response → app readback. Company execution additionally requires actual authorized tools and a verified job executor. A source-attestation GitHub Actions run is not that executor.

Selectively recovered source, without modifying the original isolated branches:
- Earlier PC-to-app bridge from `4a423c63ecdb1454f7e3f99ee90836288e933cae`.
- Existing unified 128 Edge candidate, SQL candidate, rollback and PostgreSQL regression from `b6393fdff14eb3c0600adfbda991c57c09a9acda`; canonical app parser reused. No company Start/Continue, unrelated workflow, release, or CI changes copied wholesale.
- None of these candidates has been deployed by this activation task. The candidate still retains the existing active-before-first-probe bootstrap restriction; it is not a finished activation rollout.

Current Work browser was verified on the exact public repository using connected Edge navigation and DOM inspection. This does not bind browser automation to the background Windows worker. A browser-policy denial of edge://downloads prevented download-history inspection; no workaround was attempted and no worker credentials were accessed. Installed Windows worker client source/package is still unrecovered.
