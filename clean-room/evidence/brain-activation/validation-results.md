# Brain activation validation

Status: final full-suite run PASSED. No production or specialist activation acceptance is claimed.

- TypeScript typecheck: passed.
- Module and browser build: passed.
- Focused activation / PC adapter / PostgreSQL / gateway / existing worker / claims / specialist suites: 106 passed, 0 failed (before separating the two additional gateway cases into their own file).
- Focused every-file / phase-gate / new gateway recheck: 9 passed, 0 failed after staging the new source, regenerating the actual inventory review, and running the existing authority/repository audits.
- Initial broad run: 2,514 passed, 2 failed. New imports were initially untracked and preliminary frontend edits invalidated stored source qualifications. Those unnecessary frontend edits were removed; existing saved-turn retry behavior already handles pending responses. The actual inventory review and local audit outputs were refreshed. No test, source-bound proof, or release check was weakened.
- Isolated PostgreSQL replay: 9 passed, 0 failed after fixing a recovery-export delimiter (pg_get_functiondef omits command terminators). This replay uses fixture roles and is not live authentication evidence.
- Live central inference: request 3ba37fbd-5ffe-4f17-9d6f-5575d90ab84a completed on the existing PC. Response says 19+23=42; saved output and exact SHA256/response links verified. 0 live specialist executions verified.
- Production inventory and ACL/RLS metadata were read directly. No deployment, schema change, permission grant, or hosted Task invocation occurred.

Final full command: `node --test --test-concurrency=1 --test-reporter=spec tests/*.test.mjs`. Result: **2,531 tests passed; 0 failed; 0 skipped; 0 cancelled; 0 todo**, duration 194,328.256253 ms, exit code 0. Existing authority audit: 199 phases, 45 Amendment-20 sections, 520 atomic requirements, 34 capability families, zero errors. Repository audit: 2,230 tracked/scanned files, zero secret findings and violations. Legacy exclusion and architecture checks passed. The original 5,852-row source-bound requirement evidence was preserved and validates with zero repository-evidence errors. P15.17 and P15.18 remain excluded.

Final live read at 2026-11-06 03:42:40 UTC: 128 specialists, 0 enabled/active, 7 stopped runs, 0 other runs, 0 active Agency claims, 0 pending inference requests, worker online, diagnostic completed. No operational specialist count was inflated.

An inventory review is regenerated after this final evidence write. This changes the evidence file count but does not rerun or represent new runtime behavior. Branch CI status, once saved, must be checked at its exact commit; local success is not a production release or owner/device acceptance.
