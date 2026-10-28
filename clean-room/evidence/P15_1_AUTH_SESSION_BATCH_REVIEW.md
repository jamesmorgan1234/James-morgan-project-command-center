# P15.1 selected auth/privacy batch — session continuation

Continues only the unfinished rows of CCR-01924..01953. Existing 18 public-shell mappings preserved. Four additional candidates, not certified by this document: CCR-01947, CCR-01948, CCR-01949, CCR-01951.

Reproduced genuine gaps:
- Concurrent authentication loads: baseline 3 PASS / 2 FAIL; two prompts/two establishments and failed-flight duplication.
- Fresh-document broker restore: zero expiry was interpreted as absent, so the existing restore marker never reached the broker; new direct browser-provider test failed before repair.
- Hung expired refresh: focused test timed out/cancelled after 1,000ms; no pass claimed. Fetch headers or JSON body could stall indefinitely.
- Canonical source portability: Windows native generator emitted absolute host paths for 27 REV3 refs; Linux checkpoint CI 40750066972 / job 123034097765 failed 1609 PASS / 1 FAIL. Focused Windows portability regression also failed before repair. The source decoder now uses node:path basename; original requirement text/source digests remain unchanged. Regenerate through the assembler, never patch generated rows manually.

Repairs: a shared session-establishment promise cleared on success and rejection; zero numeric expiry reaches refresh but does not authorize data; bounded JSON request deadline includes fetch and body parsing, aborts where supported, and ignores late results; canonical host-independent source filename.

Verification: module build/strict TypeScript PASS. Initial direct browser test fixture missed the ambient document used by scheduled browser controls, causing an after-test ReferenceError; fixed the fixture lifetime and awaited scheduled callbacks, with no product assertion weakened. Focused auth/broker/privacy/provider suite passed 24 tests before adding the final late-result/configuration regression; final session suite 9 PASS / 0 FAIL / 0 SKIP. Portability regression and final exact-source qualification recorded in checkpoint.

Remaining selected rows: CCR-01938 full private in-memory clearing; CCR-01940 account-switch/in-flight provider fencing; CCR-01943 owner-authenticated protected local-data reads; CCR-01944 explicit sensitive offline classification; CCR-01945 stronger offline storage controls; CCR-01946 future vault boundary; CCR-01950 explicit truthful auth-provider degraded-state semantics (existing disconnected fallback is not asserted equivalent); CCR-01952 safe-draft retention. Keep all eight UNVERIFIED until row-specific proof. No N/A exclusions.

No production Supabase/authentication, main, protected asset or deployment changes; no costs, trials, paid activation or external messages. No P15.2+ advancement.
