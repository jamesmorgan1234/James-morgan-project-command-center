# Category 5 — Projects / Portfolio / Roadmap / Foundry — Branch Closure

Date: 2026-10-25

Status: **BRANCH VERIFIED — P5.1–P5.14 IMPLEMENTED / PRODUCTION + LIVE-PROVIDER + PHYSICAL-DEVICE ACCEPTANCE NOT CLAIMED**

## Exact branch evidence

- implementation/evidence head: `a83e227c565874e94650119069127d08ddcf6d45`
- exact-head GitHub Actions run: `40204117222`
- typecheck: passed
- module tests: **558/558 passed**
- semantic repository audit: **1,142/1,142 tracked files reviewed**, zero secret findings, zero violations
- release-artifact audit: passed; protected icon verified; zero structural errors; zero readiness blockers
- observed PWA lifecycle: passed install, same-session offline replay, waiting-worker activation, and two-cache rollback retention
- final Category 15 phase gate: still deferred/fail-closed for separate historical-ledger, historical-diff, production/live, owner, and physical-device evidence boundaries; this is not a Category 5 regression

## Closure basis

The locked Category 5 roadmap contains fourteen phases, P5.1 through P5.14. The older `CATEGORY_5_PROJECTS_FOUNDRY_FOUNDATION.md` was useful foundation evidence but was not sufficient for category closure. The current branch re-audit inspected the actual runtime, persistence contracts, owner-facing project surfaces, recovery semantics, Foundry/Ultimate-Spec flow, and scale behavior; corrected runtime/persistence parity gaps; removed generic mutation bypasses; made the shared project-room shell genuinely generic; and then verified the integrated branch on the exact evidence head above.

## Phase-by-phase branch disposition

### P5.1 — Project registry and generic project contract — VERIFIED_BRANCH

The project engine is registry-driven rather than project-name hard-coded. Project type registration owns capabilities and detail-section relationships. Canonical projects require identity, type, owner, name, mission, status, lifecycle, verification, priority, version, timestamps, and authorization flags. Referenced project types cannot be removed. Runtime validation now matches durable key/list constraints, and a generic replacement path cannot silently alter governed identity, type, mission, authorization, or protected lifecycle state.

### P5.2 — Project lineage / rename / merge / supersession — VERIFIED_BRANCH

Project lineage is explicit and evidence-backed. Rename/mission history preserves stable identity and aliases, durable lineage is append-only to browser roles, and current lineage replay is deterministic by event time even when historical events arrive out of insertion order. Governed identity/mission transitions cannot be bypassed through the generic registry replacement path.

### P5.3 — Roadmap / work-unit DAG — VERIFIED_BRANCH

The roadmap contract is versioned, dependency-aware, gate-aware, and fail-closed. Cycles/missing dependencies are rejected, satisfied gates require evidence, and verified-state advancement is rechecked against the current roadmap/version rather than inferred from presentation state.

### P5.4 — Checkpoints / resume / boundary persistence — VERIFIED_BRANCH

Checkpoints persist exact project, roadmap version, next work unit, verification method, evidence, owner/environment boundary, and resume-state identity. Runtime and durable persistence now agree that resume-state identity is SHA-256-shaped rather than merely nonblank. Stale or malformed checkpoint state fails closed instead of reconstructing progress from chat text.

### P5.5 — Truthful progress — VERIFIED_BRANCH

Project progress and Agency execution progress remain distinct. Project percentage is emitted only when its denominator is trusted; unknown denominator stays N/A/unknown rather than becoming a fabricated percentage or zero.

### P5.6 — Projects owner surface — VERIFIED_BRANCH

The shipped Projects surface consumes canonical project state and provides generic search/filter/group behavior without a fixed project-name list. Project metadata is rendered data-first, whole-card navigation follows the approved owner interaction rules, and the project registry has an explicit many-project scale proof rather than relying on an untested collection assumption.

### P5.7 — Active / Live — VERIFIED_BRANCH

Active / Live requires evidence-bearing, freshly claimed working execution. Lifecycle labels alone cannot make a project appear live. Stale or unclaimed activity is rejected.

### P5.8 — Next Up — VERIFIED_BRANCH

Next Up is derived from evidence-backed roadmap readiness, not merely a loose next-action string. Readiness without required evidence is rejected.

### P5.9 — Project Details / project rooms — VERIFIED_BRANCH

The shared project-room shell now renders universal project regions: Snapshot, Owner Inputs, History, Roadmap, Assets, Decisions, Integrations, Brain, Agency, Analytics, and Conversation. Cross-surface links are project-scoped. The shared detail registry is project-type/capability extensible without renderer surgery. Book-only Series / Publication Status regions are no longer hard-coded into every project; approved Books-specific visual authority remains preserved as a type-specific fixture/extension for the later Books category rather than contaminating the generic shell.

### P5.10 — Full project discovery / duplicate disposition — VERIFIED_BRANCH

Discovery records require nonblank unique provenance, represent duplicate/merge/keep/rename/ignore semantics explicitly, and do not silently mutate canonical project truth. Owner disposition is separate from discovery evidence. Historical completeness remains bounded by the source material actually available; no unavailable historical provider capability is fabricated.

### P5.11 — Project Foundry — VERIFIED_BRANCH

The durable Foundry enforces ordered progression through idea, research, Ultimate Spec, architecture, roadmap, owner authorization, Agency execution, verification, and operationalization semantics. It cannot skip required stages, and entry into Agency execution requires exact owner authorization rather than inferred approval.

### P5.12 — Universal Ultimate Spec — VERIFIED_BRANCH

Ultimate Spec closure requires a populated domain playbook and explicit treatment of every applicable dimension. A dimension must be addressed or explicitly excluded with evidence; missing dimensions cannot be counted as complete.

### P5.13 — Prototype / user-feel loop — VERIFIED_BRANCH

Prototype feedback is recorded as requirement-lineage evidence. It cannot silently overwrite protected design or approved authority, and material protected changes still require the applicable owner authorization boundary.

### P5.14 — Project recovery / merge / revival / rescue / scale — VERIFIED_BRANCH

Recovery preserves lineage, decisions, checkpoints, and evidence; lifecycle-sensitive revival/rescue operations consume fresh authorization rather than bypassing governance. Recovery/provenance references are nonblank and unique. The generic project registry is exercised at **2,048-project scale** without a fixed project list or project-engine rewrite.

## Important parity defects closed during the re-audit

The Category 5 re-audit found and corrected real branch defects rather than merely relabeling old foundation evidence:

1. checkpoint resume hashes were permissive in memory while durable SQL required SHA-256;
2. satisfied roadmap gates could be represented without evidence in the runtime model;
3. lineage current-state replay depended on append order instead of event time;
4. discovery/recovery provenance validators accepted values the durable layer rejected;
5. generic `ProjectRegistry.replace()` could bypass governed identity, mission, authorization, or protected lifecycle seams;
6. the in-memory project type registry could orphan existing projects by removing a referenced type;
7. the shared Project Detail registry omitted the locked Conversation region;
8. the shipped generic Project Detail renderer leaked book-specific Series / Publication Status assumptions into every project type;
9. older acceptance fixtures encoded pre-C5 contracts and were reconciled to the stricter canonical project/status/checkpoint rules rather than weakening those rules.

## Protected / external boundaries intentionally not claimed

This Category 5 closure is branch implementation evidence. It does **not** claim:

- production `main` merge or deployment;
- production Supabase migration, production RLS execution, or production database mutation;
- live external-provider execution or unavailable all-history provider enumeration;
- complete historical reconstruction beyond retrievable canonical source evidence;
- final production Brain/Agency provider execution, which belongs to later-category/live acceptance;
- final owner acceptance or physical Samsung/device acceptance;
- Category 15 final production/live/device release acceptance.

Category 5 proves the project/portfolio/roadmap/checkpoint/Foundry contracts, durable seams, owner-facing branch surfaces, governance, recovery behavior, and scale needed by later categories. Later categories may consume these contracts; they must not redefine them or weaken Command Center's top-level control authority.

## Advancement decision

**P5.1–P5.14 are branch verified. Category 5 is closed for branch implementation and must not be reopened absent actual regression evidence.**

The next active dependency category is **Category 6 — Brain / AI Intelligence Ecosystem**. Category 6 must be audited against its locked phases using the current branch rather than the stale earlier “foundation only” label.
