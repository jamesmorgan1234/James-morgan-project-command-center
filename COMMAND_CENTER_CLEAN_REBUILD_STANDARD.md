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

## Locked coloring-book Agent standard

For every coloring-book project, Command Center must treat the approved title and approved cover as a hard thematic contract for the interior. A coloring book may not receive a durable `PUBLISH READY` state merely because files exist or a previous generation pass completed.

The Agent must recover the current authoritative title, approved cover, interior/page set, page-count requirement, current checkpoint, and any locked project-specific rules before evaluating or changing the book. Approved cover art is protected and must not be regenerated, redrawn, substituted, or modified unless James explicitly reopens that exact asset.

Every final coloring page must be individually evaluated against all of these hard requirements:

1. **Theme match** — the page must clearly belong to the concept promised by the approved title and cover. Generic filler, unrelated imagery, or random abstract doodles are a failure even if the page is technically printable.
2. **Medium difficulty** — the page must be neither childishly simple nor excessively dense/overwhelming. Difficulty must be judged page by page, not inferred from the book as a whole.
3. **Human colorability** — a human must be able to realistically and enjoyably color the page. The image must contain understandable forms, usable open regions, clean enough line structure, and practical detail density. Visual complexity alone does not count as colorability.
4. **Print suitability** — the page must be structurally usable as a coloring-book page at the intended trim/layout, with no unusable muddy areas, broken/unclear line structure, accidental heavy black fill, or other defects that make normal coloring impractical.
5. **Book consistency** — the page must fit the book's overall difficulty, visual language, and subject matter closely enough that the interior feels intentionally curated rather than like unrelated generated images.

Each page must end in a durable QC classification such as `PASS — MEDIUM`, `TOO EASY`, `TOO COMPLEX`, `NOT HUMAN-COLORABLE`, `OFF THEME`, or another equally explicit failure state. Failed pages must be corrected or replaced and then re-audited. The Agent may not mark the book ready while any required final page remains failed, missing, duplicated where uniqueness is required, or unverified.

A final coloring-book verification pass must confirm at minimum:

- every required final coloring page is present;
- every required final coloring page passed medium-difficulty QC;
- every required final coloring page passed human-colorability QC;
- every required final coloring page matches the approved title/cover theme;
- the set is coherent and free of obvious filler/off-theme pages;
- the approved cover remains exact and protected;
- interior/title/cover alignment is verified;
- page order/count, front/back matter, sample/test-page requirements, trim/layout, and final KDP package are verified where applicable.

Only after those checks have verified evidence may the durable book state advance through readiness labels such as `THEME VERIFIED`, `MEDIUM DIFFICULTY VERIFIED`, `PAGE SET VERIFIED`, `INTERIOR READY`, and finally `PUBLISH READY`.

`PUBLISH READY` is a durable verification state. The Agent must record the authoritative files/assets or stable identifiers available to it, the completed QC checkpoint, and the verification time. On a later run it must first determine whether anything material changed. If nothing changed, it preserves the locked package and reports that no rework is required. If the manuscript/interior, page set, approved asset reference, metadata, or other readiness-critical input changed, the book must move to a truthful `RECHECK REQUIRED`-type state until the affected QC is rerun.

This standard applies whether James starts the Agent on one coloring-book project manually or the project is reached through a portfolio Agent mode. Project scope remains locked: the Agent may not mix pages, covers, rules, or approval state between coloring-book titles.

## Locked cookbook Agent standard

For every cookbook project, the first approved cookbook is the locked visual and production benchmark. Later cookbooks must preserve that same interior page system and overall visual architecture rather than inventing a new layout for each title.

The only intentional series-level visual variation is title-specific color identity: each cookbook may have its own approved spine color, and that exact spine color becomes the recurring interior banner color for that cookbook. Banner placement, typography hierarchy, spacing, image placement/style, ingredient and method structure, headers, footers/page numbers, and other recurring design elements must otherwise remain visually consistent with the first approved cookbook unless James explicitly reopens that design system.

The approved title and cover are a hard thematic contract for the recipe set. Every recipe included in the cookbook must belong to the food/category/style promised by that exact title and cover. Generic filler recipes, off-theme dishes, or recipes that do not fit the book's stated concept are failures even if they are individually usable.

Every recipe page must be individually audited against all of these hard requirements:

1. **Photo-to-recipe match** — the image must depict the actual recipe on that page. The visible dish, major ingredients, preparation style, toppings/garnishes, and overall finished result must reasonably agree with the recipe rather than showing generic or unrelated food imagery.
2. **Ingredient-method consistency** — every listed ingredient must be accounted for in the method where appropriate, and the method must not call for ingredients that are missing from the ingredient list.
3. **Recipe integrity** — quantities, units, temperatures, timing, yield/servings, equipment assumptions, sequence, and doneness cues must be internally coherent and practical for a normal home cook.
4. **Finished-dish consistency** — the written recipe, listed ingredients, method, and accompanying image must all describe the same dish. Contradictory sauces, proteins, sides, garnishes, cooking methods, or other material mismatches are failures.
5. **Human usability** — instructions must be understandable, naturally written, and complete enough for a person to cook the recipe without guessing at omitted critical steps.
6. **Theme match** — the recipe must fit the approved title/cover promise and the cookbook's intended category; visually attractive but off-theme recipes do not pass.
7. **Series-layout consistency** — the page must use the locked first-cookbook visual system, with only the approved title-specific spine/banner color variation.

A recipe or page that fails any of those checks must be corrected, replaced, or otherwise resolved and then re-audited before the cookbook may advance. The Agent may not mark a cookbook ready merely because the page count is complete or a PDF exists.

A final cookbook verification pass must confirm at minimum:

- every required recipe is present and belongs to the approved title/cover theme;
- every recipe's image matches that exact recipe;
- ingredients, quantities, method, timing, temperature, yield/servings, and finished-dish description are internally consistent;
- no method references missing ingredients and no material listed ingredient is silently unused without a legitimate reason;
- the interior uses the first approved cookbook's locked visual system consistently;
- the cookbook's approved spine color matches the recurring interior banner color;
- title, cover, recipe set, imagery, and interior presentation read as one coherent product;
- page order, front/back matter, trim/layout, images, metadata, and final KDP package are verified where applicable.

Only after those checks have verified evidence may the durable cookbook state advance through readiness labels such as `RECIPE SET VERIFIED`, `PHOTO MATCH VERIFIED`, `INTERIOR VERIFIED`, `COVER/THEME VERIFIED`, `FINAL QC VERIFIED`, and finally `PUBLISH READY`.

`PUBLISH READY` is a durable verification state. On later Agent runs, Command Center must first determine whether any readiness-critical recipe content, imagery, cover/title, layout asset, metadata, or package file changed. If nothing material changed, the Agent preserves the locked package and does not redo approved work. If anything material changed, the cookbook moves to a truthful `RECHECK REQUIRED`-type state until the affected QC is rerun.

This standard applies whether James starts the Agent on one cookbook manually or the project is reached through a portfolio Agent mode. Project scope remains locked: the Agent may not mix recipes, imagery, color systems, covers, or approval state between cookbook titles.

## Legacy isolation

During construction, the new implementation must live in a clearly isolated authoritative rebuild area and must not load legacy implementation files. When the new implementation reaches the cutover boundary, root startup/deployment files must be replaced so production loads only the new authoritative stack.

Legacy files and documents are classified during the every-file audit as:

- current authoritative V7
- verified data/protected asset
- reference only
- obsolete/conflicting
- removable after verified cutover

No legacy file or legacy requirement may remain an active runtime or planning dependency by accident.

### Legacy workflow quarantine

Legacy V4/V5/V6 and module-specific GitHub Actions workflows are historical implementation machinery, not V7 QA authority. They must not remain executable from `.github/workflows/` after the V7 cutover because they test superseded runtime assumptions and can generate false failures against the clean rebuild.

The historical workflow definitions remain recoverable through Git history and the protected fallback branch. The active `main` branch after V7 cutover should expose only the authoritative V7 QA workflow(s) needed for the clean architecture. A legacy workflow must never be reactivated unless James explicitly reopens that historical implementation path.

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
