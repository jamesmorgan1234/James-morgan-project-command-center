# Category 4 — Branch Closure Evidence

**Date:** 2026-10-25  
**Scope:** Category 4 branch implementation only  
**Branch:** `build/spec-lock-v2-clean-room`  
**Implementation head proved:** `9949cf7ac1fdaf29691cdb91ac2658beafd1fd60`  
**Exact-head GitHub Actions run:** `40186073201`  
**Status:** **BRANCH VERIFIED — P4.1–P4.8 IMPLEMENTED / PRODUCTION + PHYSICAL-DEVICE ACCEPTANCE NOT CLAIMED**

## Controlling distinction

This record closes the Category 4 branch-side implementation and verification seam. It does **not** claim production deployment, live production provider/auth acceptance, physical Samsung/Android acceptance, or final Category 15 launch acceptance.

Category 4 is therefore not a reason to stop the normal dependency-order build. Category 5 becomes the next branch audit/closure target while the protected production/device boundaries remain deferred.

## Exact-head proof

GitHub Actions run `40186073201` executed against exact implementation head `9949cf7ac1fdaf29691cdb91ac2658beafd1fd60` and proved:

- TypeScript typecheck: **passed**;
- module suite: **543 passed / 0 failed / 0 skipped / 0 cancelled**;
- semantic every-file repository audit: **1,139 / 1,139 tracked files reviewed**;
- repository secret findings: **0**;
- repository semantic violations: **0**;
- build: **passed**;
- release-artifact audit: **passed**;
- protected Command Center icon: **verified**;
- release artifact structural errors: **0**;
- release readiness blockers: **0**;
- observed PWA lifecycle: **passed** for install, same-session offline cache replay, waiting-worker activation, and two-cache rollback retention.

The overall workflow remained red only because the separate deferred Category 15 final phase gate failed closed. Its current known historical-evidence defect is the shallow Actions checkout being unable to resolve the frozen historical revision range `9b6d136447def58ad8a4df3f05261f7bd6b7ef80..HEAD`. That failure does not invalidate the successful Category 4 exact-head gates and must not be “fixed” by weakening Category 15.

## P4.1 — Visual authority, design system, routes, fixtures

**Branch status: VERIFIED.**

The branch preserves the approved black/orange/gold beveled phone-first Command Center visual language while making visual authority explicit rather than treating old filenames or unmapped historical assets as proof of identity.

Verified branch behaviors include:

- canonical design-token alignment between source contracts and shipped CSS;
- approved screenshot/reference authority remains registered;
- unseen screens derive from the approved visual system rather than introducing a competing design system;
- route registry ownership remains explicit and deterministic;
- visual fixtures preserve approved structures under the current owner interaction rules.

The retrievable approved Projects reference asset is locked by exact evidence:

- SHA-256: `ccd2e2d89900b02de178fb90aa4e5aa843dd86ea3a3b8efbf2e9b4bb0633458f`;
- dimensions: **941 × 1672**.

No false byte-identity claim is made for approved screenshot authorities whose original bytes are not mapped/retrievable.

## P4.2 — Application shell, startup, auth/module loading boundary

**Branch status: VERIFIED.**

Implemented and verified:

- one rendered application tree;
- fixed, non-private bootstrap state before runtime initialization;
- `BrowserStartupCoordinator` generation fencing so only the current startup generation can commit ready state;
- private data remains disallowed while loading, degraded, or failed;
- a failed generation cannot later resurrect itself as ready;
- error and unhandled-rejection handling renders fixed privacy-safe failure copy instead of exception payloads/stacks/private data;
- owner/session runtime remains behind the existing managed owner-provider/Auth boundary;
- startup boundary is part of the offline shell.

Primary branch implementation:

- `clean-room/src/runtime/browser-startup.ts`
- `clean-room/src/runtime/browser-startup-runtime.ts`
- `clean-room/public/index.html`
- `clean-room/public/sw.js`
- `clean-room/tests/category4-startup-boundary.test.mjs`

## P4.3 — Deterministic browser navigation/history/scroll ownership

**Branch status: VERIFIED.**

Implemented and verified:

- one browser navigation coordinator owns Command Center history and scroll restoration;
- `history.scrollRestoration` is manually owned;
- route plus query state is captured deterministically;
- outgoing scroll is captured before route pushes and back transitions;
- new targets begin at the top;
- popstate restoration accepts only matching Command Center-owned history state;
- malformed/foreign history state fails closed;
- no-history fallback remains deterministic;
- navigation runtime is installed before the browser renderer and is included in the offline shell cache.

Primary branch implementation:

- `clean-room/src/runtime/browser-navigation.ts`
- `clean-room/src/runtime/browser-navigation-runtime.ts`
- `clean-room/tests/category4-browser-navigation.test.mjs`
- `clean-room/tests/category4-browser-navigation-runtime.test.mjs`

## P4.4 — Extensible Home registry and equal hierarchy

**Branch status: VERIFIED.**

Implemented and verified:

- Home keeps the approved one-column equal-card hierarchy rather than a generic dashboard-card hierarchy;
- Home modules are registry-driven;
- future Home modules can register without renderer surgery;
- shipped `createHomeGrid()` consumes registered extension modules automatically;
- browser rendering iterates the returned module collection and does not require module-key switch logic;
- duplicate/invalid registrations fail closed;
- disconnected counts remain unavailable instead of becoming fabricated zeroes.

Primary branch implementation:

- `clean-room/src/runtime/home-modules.ts`
- `clean-room/src/ui/home.ts`
- `clean-room/tests/category4-home-registry.test.mjs`

## P4.5 — Shared primitives and interaction consistency

**Branch status: VERIFIED.**

The branch now carries one canonical contract for the locked shared primitive system:

- card;
- row;
- status pill;
- progress;
- expansion;
- dialog;
- button;
- loader;
- empty state;
- zero state;
- error state;
- tooltip.

Canonical interaction/accessibility requirements include:

- minimum 48px interactive targets;
- accessible naming;
- no color-only state communication;
- no decorative navigation chevrons;
- keyboard/focus semantics for expansion/dialog/tooltip behavior;
- privacy-safe state copy rules;
- shared focus-visible behavior;
- reduced-motion and forced-colors support.

Primary branch implementation:

- `clean-room/src/ui/primitives.ts`
- `clean-room/src/ui/index.ts`
- `clean-room/public/primitive-system.css`
- `clean-room/tests/category4-shared-primitives.test.mjs`

## P4.6 — PWA/update lifecycle

**Branch status: VERIFIED.**

The existing PWA/update system remains intact and the new Category 4 runtimes are part of the shipped/offline shell.

Verified behavior includes:

- service worker does not cache protected API/Auth GET responses;
- bounded shell caching;
- immutable release-candidate identity;
- explicit update activation;
- known-good rollback retention;
- startup/navigation runtime modules are cached as shell assets;
- observed lifecycle proof passed install, offline replay, waiting-worker activation and two-cache rollback retention on the exact implementation head.

## P4.7 — Device adaptation and accessibility

**Branch status: VERIFIED.**

Implemented and verified:

- device classification spans `compact_phone`, `phone`, `tablet`, and `desktop`;
- canonical touch gate requires both minimum 48px geometry and accessible naming;
- browser zoom remains available;
- safe-area insets are supported;
- global visible focus treatment exists;
- reduced-motion behavior fails toward less motion;
- high-contrast and forced-colors adaptations apply to the real card/navigation/status system;
- narrow layouts wrap state/content instead of relying on fixed text boxes;
- purely decorative artwork is suppressed where required for forced-colors readability.

Primary branch evidence:

- `clean-room/public/primitive-system.css`
- `clean-room/tests/category4-accessibility-device-adaptation.test.mjs`

## P4.8 — Visual regression and approved-reference protection

**Branch status: VERIFIED.**

The branch now has deliberate visual regression evidence instead of relying on visual memory alone.

Verified protections include:

- exact approved Projects reference asset hash and dimensions;
- a stable visual-language/geometry/owner-interaction contract fingerprint:
  `92deb07a0ed9076f67b9cabda0f47366e8f5a3f9b34380ebda743e802e4663c1`;
- all four approved screenshot authorities remain registered;
- unmapped references are not falsely labeled byte-identical;
- Project Detail renders the required structural regions and carries phone-first styling.

Primary evidence:

- `clean-room/tests/category4-visual-regression.test.mjs`
- `clean-room/tests/runtime-visual-structure.test.mjs`
- `clean-room/tests/ui-shell-foundation.test.mjs`

## Owner visual-interaction corrections now locked branch-side

The Category 4 audit found and corrected stale owner-facing interaction assumptions.

Current branch rule:

1. navigational project/card surfaces are whole-card clickable;
2. owner-facing navigation does **not** show decorative arrows/chevrons unless James Morgan explicitly reauthorizes them;
3. title-only links are not the sole navigation target;
4. card/grid geometry no longer reserves chevron columns;
5. keyboard focus remains visible on the full-card route target.

Relevant implementation/evidence includes:

- `clean-room/src/ui/visual-references.ts`
- `clean-room/src/ui/fixtures.ts`
- `clean-room/src/runtime/browser.ts`
- `clean-room/public/project-system.css`
- `clean-room/tests/runtime-visual-structure.test.mjs`
- `clean-room/tests/ui-shell-foundation.test.mjs`

## Protected/external boundaries intentionally not claimed

This Category 4 branch closure does **not** prove or authorize:

- production merge, promotion, or deployment;
- production Supabase mutation;
- live production provider/Auth acceptance;
- final owner acceptance on the physical Samsung/Android target device;
- physical-device pixel-by-pixel acceptance of every approved screen;
- final Category 15 launch acceptance.

Those remain later protected acceptance layers. They are not reasons to reopen already verified P4.1–P4.8 branch implementation unless regression evidence appears.

## Category 4 closure decision

**P4.1–P4.8 are branch implemented and branch verified.**

Category 5 is now the current branch audit/closure target. The build must continue automatically through the remaining authorized dependency order rather than stopping at this closure record.
