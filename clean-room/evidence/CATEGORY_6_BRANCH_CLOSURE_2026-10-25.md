# Category 6 — Brain / AI Intelligence Ecosystem — Branch Closure

Date: 2026-10-25

Status: **BRANCH VERIFIED — P6.1–P6.15 IMPLEMENTED / PRODUCTION + LIVE-PROVIDER + PHYSICAL-DEVICE ACCEPTANCE NOT CLAIMED**

## Exact branch evidence

- implementation/evidence head: `029f9b88d4dea8a486a46f7ad1725cc6f585f0dd`
- exact-head GitHub Actions run: `40211675608`
- exact-head job: `121224029481`
- typecheck: passed
- legacy-runtime import gate: passed
- module tests: **568/568 passed**
- semantic repository audit: **1,150/1,150 tracked files reviewed**, zero secret findings, zero violations
- release-artifact audit: passed; one HTML entrypoint; one service worker; protected Command Center icon verified; zero structural errors; zero readiness blockers
- release-candidate audit: passed
- observed PWA lifecycle: passed install, same-session offline replay, waiting-worker activation, and two-cache rollback retention
- final Category 15 nonproduction phase gate: still deferred/fail-closed for separate historical-ledger, historical-diff, production/live, owner, and physical-device evidence boundaries; this is not a Category 6 regression

## Closure basis

The locked Category 6 roadmap contains fifteen phases, P6.1 through P6.15. Earlier `CATEGORY_6_BRAIN_FOUNDATION.md` evidence proved substantial durable foundations but explicitly did not constitute exact-head category closure. The current branch re-audit inspected the actual durable contracts, provider/routing seams, canonical memory/context/planning behavior, specialist boundaries, persistent conversation/workspace runtime, referent/steering/precedent rules, real browser voice controls, Improvements Center decision flow, provider-outage behavior, shipped owner-facing Brain route, PWA ownership, and adversarial guarantees. Real branch gaps were closed and the integrated branch was then verified on the exact evidence head above.

## Phase-by-phase branch disposition

### P6.1 — Brain core and permanent intelligence boundary — VERIFIED_BRANCH

Brain remains Command Center-owned intelligence rather than any single model/provider. Its durable perceive/context/plan/route/respond/learn evidence path consumes canonical data and keeps proposed/generated output separate from canonical/protected writes. Brain discussion or generation does not itself authorize side effects.

### P6.2 — AI provider and model routing — VERIFIED_BRANCH

Provider/model routing extends the canonical provider registry rather than creating a second authority. Capability, cost, privacy, latency, quality, health, quota, version evidence, local/self-hosted seams, free-first filtering, deterministic fallback ordering, and truthful degraded/unavailable states are represented and tested. Provider loss does not redefine Brain contracts.

### P6.3 — Durable memory and memory governance — VERIFIED_BRANCH

Structured memory supports facts, decisions, rules, preferences, goals, assets, history, owner inputs, constraints, instructions, unknowns, observations, and precedents with provenance, evidence, confidence, sensitivity, trust, contradiction, correction, supersession, and retention evidence. Corrections supersede rather than erase lineage.

### P6.4 — Context Builder — VERIFIED_BRANCH

Task context is selected from immutable owner/project snapshots with durable selection/omission evidence and explicit relevance, freshness, project, and sensitivity rules. Tests reject cross-project, stale, sensitive, low-relevance, and overflow context rather than dumping unrelated history.

### P6.5 — Planner, research, scenarios, and decision support — VERIFIED_BRANCH

Durable plans distinguish verified facts and owner decisions from assumptions, estimates, recommendations, and proposed actions. Evidence/confidence requirements prevent unsupported certainty, and plans remain proposals rather than execution authority.

### P6.6 — Specialist Brains and shared intelligence — VERIFIED_BRANCH

Meta/project/business/Books/Finance/Personal/custom specialist contracts are scoped and registry-driven. Reusable patterns preserve version, provenance, evidence, applicability, confidence, deprecation, and replacement lineage so specialization does not create cross-domain authority leakage.

### P6.7 — Natural conversational interface — VERIFIED_BRANCH

The shipped `/brain` route now uses a dedicated persistent conversation surface rather than the old generic summary renderer. Authenticated owner turns persist through governed RPCs, use canonical intent classification, support safe-text/reference-only truth states, and recognize protected-looking language as `protected_action_request` without granting or consuming execution authority.

### P6.8 — Durable project-specific conversation workspace — VERIFIED_BRANCH

Project conversations bind to optimistically versioned durable workspaces carrying spec version, conversation/turn IDs, decisions, execution-run reference, blockers, evidence, and verified-result references. New runtime sessions can reload canonical conversation/workspace state without relying on prior chat-session memory; cross-project references fail closed.

### P6.9 — Exact referent-to-execution snapshot — VERIFIED_BRANCH

Resolved/ambiguous/missing referents are durable evidence. Exact proposal/spec/action/decision/requirement versions are frozen before any downstream execution path, later edits cannot mutate the frozen snapshot, and ambiguity fails closed when material. Snapshot existence does not itself execute a protected action.

### P6.10 — Live conversational steering and safe replanning — VERIFIED_BRANCH

Pause/resume/reprioritize/change/redirect steering preserves unaffected verified output, invalidates only affected downstream work, and requires authorization recheck where scope changes could matter. Conversational steering cannot implicitly broaden authority.

### P6.11 — Owner-precedent similarity and decision reuse — VERIFIED_BRANCH

Precedent evaluation compares material project type, account, risk, cost, and action context and records why reuse applies or does not. Authorization is structurally non-inheritable; materially different cases cannot acquire prior authority by wording similarity.

### P6.12 — Voice interface on shared intent engine — VERIFIED_BRANCH

The shipped browser voice path now includes a replaceable adapter registry, explicit microphone-permission request, interim/final transcript handling, cancel, editable transcript review, and mandatory text fallback. Final speech never auto-submits. Voice flows through the same intent/security/project-context path as text, and denied/partial/cancelled input cannot bypass protected-action rules. `brain-view.js` and `browser-voice.js` are explicit PWA core assets.

### P6.13 — Recommendations, improvements, and self-audit — VERIFIED_BRANCH

The owner-facing Improvements Center loads canonical proposals with evidence/confidence and enforces `installs_automatically=false`. Governed decision RPCs persist immutable accept/reject evidence. Only an accepted proposal can create a structured scope request, and that conversion uses the proposal’s existing verified detail reference/hash; it does not directly rewrite or silently advance the roadmap.

### P6.14 — Local/no-cloud/no-AI graceful operation — VERIFIED_BRANCH

Deterministic project/checkpoint/decision/rule/Needs-Me truth/control remains independently operable when external AI is unavailable. Routing/outage state degrades truthfully and local/self-hosted/hybrid seams remain available without making external AI a prerequisite for canonical control.

### P6.15 — Brain safety, evaluation, and quality suite — VERIFIED_BRANCH

Adversarial coverage includes hallucination/unsupported certainty, provenance, stale or sensitive context, cross-project leakage, prompt-like protected instructions, provider disagreement/outage, free-first constraints, memory correction lineage, context overflow, referent ambiguity, steering authorization, precedent no-auth-inheritance, voice permission/finality, Improvements no-self-install, browser read-only persistence, and deterministic-core survival. Generated claims cannot promote themselves to verified canonical truth.

## Real branch defects closed during the re-audit

The Category 6 re-audit corrected implementation gaps rather than merely promoting the older foundation artifact:

1. the shipped `/brain` page was a generic summary instead of the required persistent conversation/project-workspace experience;
2. the managed owner runtime did not expose canonical Brain conversations/workspaces/improvements to the shipped UI;
3. protected-looking conversation input needed an explicit persisted request-only path that never acquired execution authority;
4. P6.12 had transcript validation but not an actual browser microphone/transcript/cancel/edit/permission/replaceable-adapter control seam;
5. the voice path now requires transcript review/edit and never auto-submits final speech;
6. P6.13 durable proposals existed but proposed→accepted/rejected was unreachable through a governed browser-safe mutation path;
7. owner improvement decisions now create immutable evidence in the same governed transaction as the state transition;
8. accepted improvement→structured-scope conversion is reachable without direct roadmap mutation;
9. new Brain/voice runtime modules were made explicit PWA core cache assets rather than depending on incidental same-session caching;
10. exact-optional typing and test-fetch-mock defects discovered by CI were corrected without weakening runtime/security invariants;
11. the temporary diagnostic duplicate test pass was removed after exposing the failing assertions, restoring one concise full-suite QA run.

## Protected / external boundaries intentionally not claimed

This Category 6 closure is branch implementation evidence. It does **not** claim:

- production `main` merge or deployment;
- production Supabase migration/application, production RLS execution, or production database mutation;
- live external/paid AI-provider credentials, inference quality, quota behavior, or routing acceptance;
- real production multi-device/session recovery or production provider-outage drills;
- physical Samsung/Android microphone or voice acceptance;
- final owner/device/Category 15 launch acceptance;
- authorization or execution of protected actions merely because Brain recognizes or discusses them;
- reconstruction/completeness of the unavailable original `CCR-00001–CCR-05825` final reconciled ledger.

The exact-head workflow failure is isolated to the deferred Category 15 gate. Its current failure includes the unavailable original canonical ledger and the shallow Actions checkout being unable to resolve the old frozen candidate revision for historical diff evidence. Those are not Category 6 implementation failures and must not be weakened merely to make the workflow green.

## Advancement decision

**P6.1–P6.15 are branch verified. Category 6 is closed for branch implementation and must not be reopened absent actual regression evidence.**

The next active dependency category is **Category 7 — The Agency / Multi-Agent Execution Platform**, containing the locked P7.1–P7.24 phases. Category 7 must now be audited against the actual current branch rather than the stale earlier “foundation only” label.