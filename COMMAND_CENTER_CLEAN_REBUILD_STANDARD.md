# Command Center — Clean Rebuild Standard

Status: **LOCKED / CONTROLLING**

James Morgan has explicitly required Command Center to be rebuilt from the beginning all the way through. This is a clean-room rebuild, not a repair, patch, refactor, migration of old UI layers, or reuse of prior implementation code or stale requirement documents.

## Controlling rule

**No existing Command Center implementation code, historical roadmap, historical specification, or legacy behavior description is trusted as a build dependency or authority by default.**

The new Command Center must not copy, import, wrap, extend, inherit, or depend on the existing V4/V5/V6 UI layers, approved-ui layers, runtime patches, bootstrap repair code, legacy navigation, legacy CSS, legacy component markup, legacy Agent front-end, legacy Agent runner implementation, or other historical implementation modules.

Historical roadmaps, standards, continuation prompts, screenshots, notes, and requirement documents may contain stale or contradictory behavior. They may be inspected only as evidence of ideas/capabilities that might still matter. They do not control V7 unless the requirement is re-derived and reconciled against James's newest explicit instructions, the approved screenshot specification, and verified current state.

Existing repository code and documents may be inspected only to recover factual requirements, identify data sources, locate verified historical behavior, and ensure the rebuild does not forget a legitimate capability. Anything recovered from legacy material must be revalidated before inclusion and then reimplemented independently in the authoritative V7 roadmap/runtime.

## What may be preserved

Only the following may carry forward as source truth:

1. James Morgan's newest explicit requirements and operating rules.
2. The approved screenshots recorded in `COMMAND_CENTER_APPROVED_VISUAL_SPEC.md`.
3. The current authoritative V7 product roadmap after reconciliation with items 1–2.
4. Explicitly approved/locked artwork, including the approved launcher artwork.
5. Verified live project/business data that belongs to James and is still current.
6. Verified external/account state where preserving that state is required and safe.

Everything else is reference-only until revalidated.

Preserving data does **not** authorize reusing the code, roadmap logic, assumptions, percentages, behaviors, or UI architecture that previously displayed, manipulated, or executed against that data.

## Re-derivation rule

For every V7 feature/control/screen:

1. Start from James's newest explicit instruction.
2. Apply the approved screenshot when that screen/visual exists.
3. Apply current global/project safety and authorization rules.
4. Verify current live data/external state where the feature depends on it.
5. Independently define the V7 behavior in `COMMAND_CENTER_PRODUCT_ROADMAP.md`.
6. Implement the behavior from scratch in the V7 runtime/backend.
7. Verify the result end-to-end.

If an old document conflicts at any step, the old document loses and must be corrected or classified obsolete so it cannot silently steer later work.

## New implementation boundary

The authoritative rebuild must be newly written and must own, from scratch:

- application shell
- startup/bootstrap
- authentication/session integration
- renderer
- route/navigation system
- Android Back integration
- scroll restoration
- visual system
- responsive/mobile layout
- Projects
- Active / Live
- Next Up
- Revenue
- project detail
- Books/KDP detail
- Agent owner controls
- Agent execution/state path
- Brain
- Automation
- Integrations
- Analytics
- Security
- Deployment
- Refresh/reconciliation presentation
- PWA lifecycle
- service worker/cache strategy
- offline/recovery experience
- QA tests
- release verification

## Agent-specific clean-room rule

The old Agent UI and old Agent runner behavior are not accepted as working implementation merely because tables, RPCs, controls, roadmap wording, or status records exist.

The rebuilt Agent must be proven end-to-end for every visible execution control:

**owner control → front-end handler → authenticated backend command → durable state transition → eligible runner/executor receives fresh state → allowed work actually executes → evidence is recorded → UI reflects the verified result**

Controls that are intentionally non-executing (for example Project Checkpoint and Refresh) must have their own direct V7 owner path and must not be routed through the background runner merely because an older roadmap did so.

Required owner controls include at minimum:

1. Auto
2. Next Step
3. Until Work / Next Work Boundary
4. Manual Task
5. Project Checkpoint
6. Stop Agent

Existing pause/resume, Work approval, exact-step Sol Medium approval, project scoping, Books target protection, duplicate-side-effect protection, retry/circuit-breaker rules, security gates, and $0/free-first restrictions remain product requirements only where they have been reconciled into the current V7 roadmap; their legacy implementations are not reusable.

## Legacy isolation

During construction, the new implementation must live in a clearly isolated authoritative rebuild area and must not load legacy implementation files. When the new implementation reaches the cutover boundary, root startup/deployment files must be replaced so production loads only the new authoritative stack.

Legacy files and documents are classified during the every-file audit as:

- current authoritative V7
- verified data/protected asset
- reference only
- obsolete/conflicting
- removable after verified cutover

No legacy file or legacy requirement may remain an active runtime or planning dependency by accident.

## Verification rule

Every phase is verified before the next phase is treated as complete. Final acceptance requires:

- complete every-file audit, including roadmap/spec classification
- complete visible-control audit
- complete data-truth audit
- complete Agent end-to-end control verification
- Android/PWA verification
- full regression QA
- production deployment verification
- James Morgan's physical-phone visual acceptance

Until James physically accepts the visual result, the rebuild may be called technically deployed/ready for owner acceptance, but not visually complete.
