# Command Center — Clean Rebuild Standard

Status: **LOCKED / CONTROLLING**

James Morgan has explicitly required Command Center to be rebuilt from the beginning all the way through. This is a clean-room rebuild, not a repair, patch, refactor, migration of old UI layers, or reuse of prior implementation code.

## Controlling rule

**No existing Command Center implementation code is trusted as a build dependency.**

The new Command Center must not copy, import, wrap, extend, inherit, or depend on the existing V4/V5/V6 UI layers, approved-ui layers, runtime patches, bootstrap repair code, legacy navigation, legacy CSS, legacy component markup, legacy Agent front-end, legacy Agent runner implementation, or other historical implementation modules.

Existing repository code may be inspected only to recover factual requirements, identify data sources, locate verified historical behavior, and ensure the rebuild does not forget a legitimate capability. A requirement discovered in legacy code must be reimplemented independently from the authoritative specifications.

## What may be preserved

Only the following may carry forward as source truth:

1. James Morgan's newest explicit requirements and operating rules.
2. The approved screenshots recorded in `COMMAND_CENTER_APPROVED_VISUAL_SPEC.md`.
3. Explicitly approved/locked artwork, including the approved launcher artwork.
4. Verified live project/business data that belongs to James and is still current.
5. Verified external/account state where preserving that state is required and safe.
6. Published standards and roadmap requirements, after contradictions are resolved against James's newest instructions.

Preserving data does **not** authorize reusing the code that previously displayed, manipulated, or executed against that data.

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

The old Agent UI and old Agent runner behavior are not accepted as working implementation merely because tables, RPCs, controls, or status records exist.

The rebuilt Agent must be proven end-to-end for every visible control:

**owner control → front-end handler → authenticated backend command → durable state transition → eligible runner/executor receives state → allowed work actually executes → evidence is recorded → UI reflects the verified result**

A control is not considered functional unless this entire chain is verified.

Required owner controls include at minimum:

1. Auto
2. Next Step
3. Until Work / Next Work Boundary
4. Manual Task
5. Project Checkpoint
6. Stop Agent

Existing pause/resume, Work approval, exact-step Sol Medium approval, project scoping, Books target protection, duplicate-side-effect protection, retry/circuit-breaker rules, security gates, and $0/free-first restrictions remain functional requirements but must be newly implemented.

## Legacy isolation

During construction, the new implementation must live in a clearly isolated authoritative rebuild area and must not load legacy implementation files. When the new implementation reaches the cutover boundary, root startup/deployment files must be replaced so production loads only the new authoritative stack.

Legacy files are then classified during the every-file audit as:

- reference only
- obsolete/conflicting
- protected asset/data
- removable after verified cutover

No legacy file may remain an active runtime dependency by accident.

## Verification rule

Every phase is verified before the next phase is treated as complete. Final acceptance requires:

- complete every-file audit
- complete visible-control audit
- complete data-truth audit
- complete Agent end-to-end control verification
- Android/PWA verification
- full regression QA
- production deployment verification
- James Morgan's physical-phone visual acceptance

Until James physically accepts the visual result, the rebuild may be called technically deployed/ready for owner acceptance, but not visually complete.
