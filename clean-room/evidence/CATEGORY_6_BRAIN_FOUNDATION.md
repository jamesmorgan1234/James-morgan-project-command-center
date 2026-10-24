# Category 6 — Brain / AI Intelligence Ecosystem

Status: **IMPLEMENTED BUT EXACT-HEAD QA IN PROGRESS / PRODUCTION + PHYSICAL ACCEPTANCE NOT CLAIMED**

This evidence describes the isolated branch `build/spec-lock-v2-clean-room`. Category 6 migrations are branch artifacts; committing them does not prove they are applied to production Supabase. No production deployment, paid model use, external AI invocation, microphone permission exercise, Samsung acceptance, communication, purchase, or protected side effect is claimed by this file.

## Canonical phase reconciliation

The canonical roadmap defines P6.2 as AI provider/model routing and P6.3 as durable memory. Historical commit `9f498d507288bdb7300a5ed67cbc47f4e036aa8b` was named as P6.2 memory work, but its contents belong to P6.3. The code was preserved; the missing canonical P6.2 was implemented separately rather than rewriting history.

## Durable branch implementation

### P6.1 — Brain core / permanent intelligence boundary
- `supabase/migrations/20261024141000_category6_brain_decision_loop.sql`
- Durable perceive→context→plan→route→act→respond→learn decision evidence.
- Brain responses/proposals do not themselves authorize canonical/protected writes.

### P6.2 — AI provider/model routing
- `supabase/migrations/20261024141500_category6_ai_provider_routing.sql`
- `supabase/migrations/20261024152200_category6_ai_routing_deterministic_fallbacks.sql`
- Reuses the Category 3 canonical provider registry rather than creating competing provider authority.
- Model capability/cost/privacy/quality/latency/health/quota/execution-mode routing with version evidence and local/self-hosted seams.
- Free-first filtering and truthful unavailable/degraded outcomes.
- Primary and fallback candidates have deterministic policy ordering before fallback limiting.

### P6.3 — Durable memory and governance
- `supabase/migrations/20261024142000_category6_brain_memory.sql`
- `supabase/migrations/20261024142500_category6_memory_governance.sql`
- `clean-room/src/brain/memory-governance.ts`
- Full memory vocabulary includes facts, decisions, rules, preferences, goals, assets, history, owner inputs, constraints, instructions, unknowns, observations and precedents.
- Provenance/evidence/confidence/sensitivity/trust/contradiction/supersession lineage.
- Retention policy + append-only retention-change evidence.
- Corrections supersede rather than erase lineage.

### P6.4 — Context Builder
- `supabase/migrations/20261024143000_category6_context_builder_evidence.sql`
- Reuses immutable Category 3 context snapshots.
- Durable selection/omission evidence records relevance/freshness/project/sensitivity decisions.
- Selected sources must exist in the immutable owner/project snapshot.

### P6.5 — Planner / research / scenarios / decision support
- `supabase/migrations/20261024143500_category6_planner_decision_support.sql`
- Durable plans, claims and proposed actions.
- Verified facts/owner decisions require evidence; assumptions/estimates/recommendations require confidence.
- Plans remain proposals and do not consume protected authorization.

### P6.6 — Specialist Brains / shared intelligence
- `supabase/migrations/20261024144000_category6_specialist_brains.sql`
- Durable meta/project/business/books/finance/personal/custom specialist registry.
- Reusable shared patterns carry version, provenance, evidence, applicability, confidence, verification and deprecation/replacement lineage.

### P6.7 — Natural conversational interface
- `supabase/migrations/20261024144500_category6_conversation.sql`
- Persistent conversations/turns with Brain intent vocabulary and protected-action recognition.
- Redacted/reference-only content states supported.
- Structural invariant: conversation rows never authorize canonical writes.

### P6.8 — Durable project conversation workspace
- `supabase/migrations/20261024145000_category6_project_conversation_workspace.sql`
- Optimistically versioned project workspace retaining spec version, conversation/turn references, decisions, execution run, blockers, evidence and verified results.
- Cross-project conversation/turn references fail closed.

### P6.9 — Exact referent-to-execution snapshot
- `supabase/migrations/20261024145500_category6_execution_snapshots.sql`
- Durable resolved/ambiguous/missing referent evidence.
- Immutable proposal version/spec version/action/decision/requirement snapshot.
- Snapshot explicitly records `executed=false`; actual protected execution remains Category 2 gated.

### P6.10 — Live steering / replanning
- `supabase/migrations/20261024150000_category6_live_steering.sql`
- Pause/resume/reprioritize/change/redirect evidence.
- Preserved verified output cannot simultaneously be invalidated.
- Change/redirect/reprioritize structurally require authorization recheck.

### P6.11 — Owner precedent similarity
- `supabase/migrations/20261024150500_category6_owner_precedent.sql`
- Durable material-context comparison for project type/account/risk/cost/action.
- Structural invariant: `authorization_inherited=false`.

### P6.12 — Voice interface on shared intent engine
- `supabase/migrations/20261024151000_category6_voice_interface.sql`
- Replaceable voice adapter/session/transcript evidence.
- Text fallback is mandatory.
- Permission/availability/finality gates; partial/edited/cancelled input cannot carry final intent.
- Structural invariant: voice transcript rows never authorize canonical writes.

### P6.13 — Recommendations / Improvements Center
- `supabase/migrations/20261024151500_category6_improvements_center.sql`
- Evidence/confidence proposals.
- Structural invariant: `installs_automatically=false`.
- Accepted proposal can only become a structured scope request with owner-decision provenance; `roadmap_mutated=false`.

### P6.14 — Local/no-cloud/no-AI graceful operation
- `supabase/migrations/20261024152000_category6_ai_outage_graceful_operation.sql`
- Durable availability/outage evidence.
- Required deterministic core functions: project, checkpoint, decision, rule and Needs Me reads.
- Core truth/control status is computed independently of external AI availability.

### P6.15 — Brain adversarial / quality suite
- `clean-room/tests/category6-brain-adversarial.test.mjs`
- Covers unsupported certainty, stale/sensitive/cross-project context, prompt-like protected instructions, provider loss/free-first boundaries, memory correction lineage, context overflow, referent ambiguity, steering authorization recheck, precedent no-auth-inheritance, voice permission/finality, improvements no-self-install, AI outage, browser read-only persistence and structural no-side-effect invariants.

## Phase-specific regression tests added

- `clean-room/tests/category6-ai-provider-routing.test.mjs`
- `clean-room/tests/category6-memory-governance.test.mjs`
- `clean-room/tests/category6-context-builder-persistence.test.mjs`
- `clean-room/tests/category6-planner-persistence.test.mjs`
- `clean-room/tests/category6-specialist-brains-persistence.test.mjs`
- `clean-room/tests/category6-conversation-persistence.test.mjs`
- `clean-room/tests/category6-project-workspace-persistence.test.mjs`
- `clean-room/tests/category6-execution-snapshot-persistence.test.mjs`
- `clean-room/tests/category6-live-steering-persistence.test.mjs`
- `clean-room/tests/category6-owner-precedent-persistence.test.mjs`
- `clean-room/tests/category6-voice-interface-persistence.test.mjs`
- `clean-room/tests/category6-improvements-persistence.test.mjs`
- `clean-room/tests/category6-ai-outage-persistence.test.mjs`
- `clean-room/tests/category6-brain-adversarial.test.mjs`

Existing in-memory Brain contracts remain under `clean-room/src/brain/` and `clean-room/tests/brain-foundation.test.mjs`; durable migrations extend rather than replace those contracts.

## Security / persistence boundary

All new durable Category 6 evidence tables use RLS and owner-authorized SELECT for authenticated browser roles. Direct authenticated INSERT/UPDATE/DELETE grants are not used; mutation occurs through narrow authenticated RPCs. Category 6 conversation, planning, voice, precedent, steering and improvement layers do not consume protected-action authorization merely by discussing/proposing work. Actual protected side effects remain gated by Category 2.

## Current automated verification

Current implementation head before this evidence rewrite:
`6a81f605e52c7b5f15704528f5518c1895137000`

GitHub Actions workflow:
`.github/workflows/spec-lock-v2-clean-room-qa.yml`

Current exact-head run at evidence-write time:
- Run number: `200`
- Run ID: `40111894919`
- Status at evidence-write time: IN PROGRESS

Do not reinterpret this file as a passing exact-head QA claim until that run (or a newer run for the resulting evidence commit) has completed its mandatory core gate successfully.

## Not claimed / later acceptance boundaries

- Category 6 SQL is not claimed applied to production Supabase.
- No live paid/external AI routing-quality evaluation is claimed.
- No production model/provider credentials were changed.
- No live text UI/project-room owner acceptance is claimed.
- No microphone/Samsung physical acceptance is claimed; those remain later device/Category 15 boundaries.
- Category 7 Agency integration remains the next dependent category after Category 6 mandatory branch QA is green.
- Expected final Category 15 frozen-candidate failures must not be weakened merely because later Category 6 runtime/evidence changed.

Production/main, production Supabase, Edge Finder, protected assets and protected icon remain untouched by this Category 6 branch implementation.
