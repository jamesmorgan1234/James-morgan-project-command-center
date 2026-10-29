# P15.1 automation/security review CCR-00543..00576

Parent88bb0d359c83ed13ce3022b8ef05f2ebec7088ff / tree363b846fd500ec00f3089f10313f349575a49ef0. Refetched before writes. Exact canonical wording inspected for34 rows.17 A existing proof candidates,16 B insufficient proof, existing VERIFIED CCR-00563 preserved. No runtime/test/schema/migration or actual automation/security/account/device change. Named owning source/tests and per-row bounded semantics in p15-1-reviewed-automation-security-mappings.mjs.

| A ID | Exact requirement | Direct existing proof |
| --- | --- | --- |
| CCR-00543 | Exact schedule state | Explicit scheduleRef and canonical scheduledFor occurrence timestamps persisted/snapshotted; no new scheduling engine claim. |
| CCR-00544 | Condition-watch state | Prior verified state, cadence/observations/backoff, verified false-to-true transition and stale/duplicate rejection. |
| CCR-00546 | Automation execution history | Started/completed/failed entries, evidence-backed terminal state, snapshot/restart retains occurrence reference. |
| CCR-00548 | Automation duplicate detection | Stable automation/scheduledFor key and duplicate reservation rejection survive rehydration. |
| CCR-00553 | Agent → Automation does not bypass authorization | Safe-action begin independently requires current unrevoked matching policy/revocation epochs; Agency reference is metadata, not authority. |
| CCR-00558 | Explicit owner authorization | Intent/session-bound protected authorization required, consumed once; absent/expired/revoked denies before synthetic effect. |
| CCR-00561 | No service secrets client-side | Secret-channel client_bundle rejection, service-only durable secret boundary and reference-only status. |
| CCR-00562 | Session validity checking | Active/live/expiry/lock/revocation checks plus unknown-session denied audit. |
| CCR-00565 | Protected Action Registry | Registered classes/scopes/risk/assurance/freshness and unregistered action denial. |
| CCR-00566 | Authorization expiration | Expired authorization cannot execute or consume effect. |
| CCR-00567 | Authorization scope | Exact owner/session/action/intent binding; mismatch/tampering denies. |
| CCR-00568 | Audit trail | Central allowed/denied policy decision exactly-once records with owner/resource/time. |
| CCR-00569 | Security alerts | Scoped alert/incident lifecycle, privacy-safe notifications, backwards time rejection. |
| CCR-00573 | Integration scopes | Capability/data scope and consent independent; missing scope denies rebind, reads do not grant writes. |
| CCR-00574 | Agent permissions | Exact project/fresh auth/provider health/credential scope protected preflight and negative cases. |
| CCR-00575 | Brain permissions | Intelligence envelope has no canonical write authority; model output cannot register protected authority. |
| CCR-00576 | External-content trust classification | Source trust/scoped identity explicit; historical/untrusted content cannot grant instruction authority. |

| B ID | Exact requirement | Exact missing proof |
| --- | --- | --- |
| CCR-00545 | Recurrence state | Schedule reference and recurring-task model exist; explicit automation recurrence-rule binding/interpretation proof not established. |
| CCR-00547 | Automation health | providerHealth field exists; comprehensive automation health lifecycle/projection/failed-run monitoring proof not established. |
| CCR-00549 | Automation dry run | Catch-up planning exists; exact automation dry-run permission/effect simulation contract not established. |
| CCR-00550 | Automation pause/resume | enabled flag exists; pause/resume preserving in-flight/history/next occurrence proof not established. |
| CCR-00551 | Automation permission envelope | Authority epochs/ref exist; exact automation/action/project-scope binding proof not established. |
| CCR-00552 | Automation → Agent handoff contract | Agency step reference/FK exists; complete handoff exchange/readiness/verification proof not established by reference storage alone. |
| CCR-00554 | No automation silently spends money | Protected policy/false authority fields exist; end-to-end unauthorized spend-attempt rejection through automation dispatch not established. |
| CCR-00555 | No fake continuous background behavior | No continuous scheduler claim made; explicit runtime status/capability truth acceptance proof not established. |
| CCR-00556 | Future trigger types register cleanly | Current scheduled/watch contracts exist; safe generic trigger registration/extension proof not established. |
| CCR-00557 | Least privilege everywhere | Selected central gates pass; universal module/RPC/table permission coverage not proven by this batch. |
| CCR-00559 | RLS for exposed data | Individual owner RLS tests exist; complete exposed-data inventory-to-RLS coverage proof not established. |
| CCR-00560 | Safe server function boundaries | Selected protected RPCs pass; complete server-function boundary coverage not established. |
| CCR-00564 | Optional free-first MFA | Passkey verification exists; exact optional free-first MFA configuration/recovery proof not established. No account settings changed. |
| CCR-00570 | Tamper-resistant protected history | Central audit/append-only contracts exist; comprehensive protected-history tamper rejection proof not established. |
| CCR-00571 | Permission Registry | Policy registry exists; explicit permission-entry lifecycle/schema/ownership proof not established. |
| CCR-00572 | Module permissions | Required-permission declarations exist; direct permission-to-module-execution enforcement proof not established in this batch. |

No C/absence claims where only incomplete proof established. Preserve CCR-00563 already VERIFIED and all earlier parked reasons. Guarded qualification required before candidates count. Same source a66d5acc98387bb88f710250e96e574ce0082811 / actual CI40787480238/job123164185374, two1630PASS/0FAIL/0SKIP; final open-phase gate fails, production skipped. No fresh runtime tests claimed. P15.1 remains open; P15.2 untouched. Next batch begins CCR-00577 authority/boundary requirements.
