# Brain / Agency on-demand repair — incomplete, not released

Base verified directly from GitHub: 8a894534b39ceb8ca53f521d35d4d7ba03d1beb9.
Authorized branch: build/spec-lock-v2-clean-room.

Implemented locally:
- Project Start now calls an authenticated execution gateway instead of creating a manual draft.
- Brain composer requests a response after persisting the owner turn; an in-view retry retains the exact saved turn rather than duplicating it.
- Added a same-backend Edge Function gateway using existing owner-scoped provider/executor registries and canonical roadmap-readiness RPC.
- An accepted worker callback is insufficient: the gateway checks persisted run/task/claim and fresh heartbeat evidence.
- A Brain callback is insufficient: the response must be saved in the exact conversation/project and carry response-to evidence for the exact owner turn.
- No automatic retries, paid/unknown-cost routes, protected execution, arbitrary outbound credential forwarding, legacy imports, or schema mutations.

Validation so far: TypeScript typecheck and deployment build passed. 30 focused tests passed, zero failures, before final review. Exact final results must be rechecked after further edits.

## Unfinished / release blockers

No production repair is claimed. This gateway is a transport adapter, not an inference engine or a company-building worker. It must not be represented as either.
The last direct production read found zero provider registrations and zero executor registrations. Existing deployed functions were refresh and integration-webhook only.
No genuine inference response or company build has been verified.
No deployment, production database mutation, source promotion, chargeable API request, or spend occurred in this repair checkpoint.

The missing runnable adapters still need to be implemented/bound to genuinely available authorized free model/tool capacity. The gateway expects explicit owner-scoped capabilities brain.respond or project.execute and same-backend supabase-function references. This is not evidence that such adapters currently exist.
Before release: verify adapter idempotency under concurrent/retried requests, recovery after an uncertain callback, completed-before-response handling, native worker task/tool/evaluator behavior, Brain provider routing/privacy/cost evidence, live owner authentication, real invocation/persistence, and phone-width UI behavior.

The second five-company import remains paused. P15.17/P15.18 are excluded. Do not restart prior categories or treat this checkpoint as completion.
