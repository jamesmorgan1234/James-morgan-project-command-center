# Category 4 — Application Shell / Visual / PWA / Device

Status: P4.1–P4.8 BRANCH IMPLEMENTED / EXACT-HEAD CORE QA VERIFIED / RENDERED + PHYSICAL OWNER ACCEPTANCE NOT YET CLAIMED

## Authority

- owner-approved legacy visual references: `3369(5).png` Active / Live; `3370(4).png` The Missing Hour Saga detail; `3372(6).png` Projects; `3373(5).png` Next Up
- repository visual-reference registry: `clean-room/src/ui/visual-references.ts`
- structural approved-screen fixtures: `clean-room/src/ui/fixtures.ts`
- canonical measurable visual tokens: `clean-room/src/ui/design-tokens.ts`
- shared visual authority: phone-first near-black sci-fi system, orange/gold illuminated machinery, white headings, muted blue-gray support text, clipped/beveled geometry, semantic pills, approved hierarchy/card/progress/icon language
- generic SaaS/admin visual treatment is explicitly rejected

Current Library renders are recorded only as `structural_match_filename_unmapped`; they are not falsely claimed to prove historical filename/byte identity. During the 2026-10-24 phone/computer reconciliation, the Project Detail historical screenshot bytes were not retrievable from current Project/Library search, so no pixel-identical claim is made from unavailable bytes. The locked structural fixture remains the branch authority for the required Project Detail regions.

## P4.1 — Approved visual design system

Implemented and verified branch-side:

- phone-first reference viewport and design tokens
- canonical `orangeCore` / runtime `--cc-orange` value: `#ff6a00`
- canonical 16px bevel geometry
- canonical 48px primary interactive target
- shared near-black/orange/gold machinery language and truthful semantic status palette
- approved/rejected visual authority registry

Reconciliation finding: an older `runtime-visual-structure.test.mjs` assertion expected `#ff7900`, but `design-tokens.ts` has defined `orangeCore: #ff6a00` since its original Category 4 foundation commit and the runtime CSS/new contract test use the same value. The stale assertion was corrected; implementation was not changed to satisfy stale evidence.

## P4.2 — Application shell and startup

Implemented and verified branch-side:

- one browser root renderer/startup path
- explicit shell states and canonical runtime provider
- authentication/session integration remains separate from visual rendering
- private runtime does not fall through to a generic public shell
- phone-first layout

## P4.3 — Routing, Back, history, and scroll ownership

Implemented and verified branch-side:

- explicit declared route registry
- browser route resolution fails closed for unknown/unmapped routes
- one navigation/history owner
- nested Project Detail route
- browser Back control uses history when available and safe Home fallback otherwise
- no silent unknown-route → Home substitution

## P4.4 — Home control system

Actual browser runtime now follows the canonical Home contract:

1. Projects
2. Active / Live
3. Next Up
4. Needs Me

The primary Home hierarchy is one column with equal-height cards. Verified counts are shown only when canonical runtime truth is connected; unavailable counts remain unavailable rather than being converted to zero. Generic Agency/Release dashboard cards are not substituted for the locked Home hierarchy.

## P4.5 — Shared components and interaction primitives

Implemented branch-side through shared runtime helpers/contracts for:

- beveled cards
- status pills
- progress rings
- shared empty/unavailable states
- route links/navigation controls
- shared headings/support text
- truthful unknown/N/A handling

Screens do not introduce a second visual system.

## P4.6 — PWA install, offline, and reliable update lifecycle

Implemented and exact-head QA verified:

- protected manifest/icon identity preserved
- bounded shell/static caching
- `/api/*`, `/__cc_auth__/*`, and `/auth/*` are network-only/no-store and cannot enter the offline shell cache
- two-phase PWA update/activation behavior
- compatibility/release evidence gates
- observed PWA lifecycle QA passes on the current runtime branch

Protected icon remains:

`clean-room/public/assets/command-center-approved-icon-512.png`

No protected icon bytes were changed by Category 4 reconciliation.

## P4.7 — Accessibility and device adaptation

Implemented and automated branch tests verify:

- 48×48 minimum interactive target contract
- focus-visible treatment
- reduced-motion behavior
- safe-area-aware fixed bottom navigation
- responsive phone/tablet/desktop geometry rules
- portrait-first shell behavior

Physical Samsung installation/device acceptance is not claimed here; controlling roadmap policy reserves owner/Samsung acceptance for Category 15.

## P4.8 — Visual and interaction regression system

Implemented and exact-head core QA verified:

- approved Projects, Active / Live, Next Up, and Project Detail remain distinct runtime structures
- canonical runtime/CSS token contract test
- offline/accessibility regression contract
- owner-approved structural fixtures
- Project Detail regression test now requires all locked structural regions:
  - project hero
  - performance grid
  - series strip
  - publication status
  - history row
  - integrations row
- Project Detail runtime uses verified `progressPercent`, `stage`, `priority`, `needsMeCount`, and `recentActivity` where available
- series/publication/integration regions remain visible but explicitly report unavailable state because the current runtime snapshot does not expose verified values for those domains
- no values are fabricated merely to resemble the historical screenshot

Files added/updated during the final P4.8 reconciliation include:

- `clean-room/tests/category4-project-detail-structure.test.mjs`
- `clean-room/src/runtime/browser.ts`
- `clean-room/public/app.css`
- `clean-room/tests/runtime-visual-structure.test.mjs`

## Exact-head automated evidence

GitHub Actions workflow: `.github/workflows/spec-lock-v2-clean-room-qa.yml`

Run: `40105646138` / workflow run #161

Head: `78a96eca04f2b765df4c798d0d2d7f6227bf0c78`

Results:

- Typecheck: PASS
- Category 15 exact-head core QA and release gates: PASS
- P15.14 observed PWA lifecycle: PASS
- Final Category 15 nonproduction phase gate: EXPECTED FAIL because the frozen Category 15 release-candidate/evidence-only condition correctly rejects later Category 2–4 runtime changes
- Production live evidence gate: skipped after that expected nonproduction candidate failure

The final Category 15 candidate gate must not be weakened or rewritten to hide runtime changes. A later release-candidate cycle must deliberately re-freeze evidence after Categories 0–14 are complete and authorized.

## Acceptance boundary still not claimed

Category 4 branch implementation and automated gates are verified, but this file does not claim:

- unavailable historical screenshot bytes were recovered
- pixel-identical rendered comparison against an unavailable historical Project Detail image
- physical Samsung install/update/reload/Back/scroll/accessibility acceptance
- production deployment or live production validation of this branch

Those owner/production/device acceptance activities remain subject to the later Category 15 gates and explicit authorization.

## Production safety

No production merge, deployment, provider mutation, production Supabase migration, secret change, paid action, or protected-asset replacement was performed by this Category 4 reconciliation.
