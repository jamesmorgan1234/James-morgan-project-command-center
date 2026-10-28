# P15.1 design-system existing-proof review — tranche 2

Reviewed against exact canonical wording and existing shipped implementation/tests. No runtime, CSS, schema, migration, protected asset, production or deployment change is part of this review.

Supported for guarded qualification:
- CCR-00237 — Progress-ring geometry: centralized `COMMAND_CENTER_GEOMETRY` diameter/stroke values plus approved fixture and visual regression proof.
- CCR-00238 — Status-pill geometry: centralized standard/compact heights plus approved fixture proof.
- CCR-00240 — Home tile height locked uniformly: `createHomeGrid` hard-locks `equalCardHeight: true`; executable Home registry test asserts it.
- CCR-00243 — Project-row template: Projects fixture + distinct `renderProjects` runtime structure.
- CCR-00244 — Active-row template: Active / Live fixture + distinct `renderActive` runtime structure.
- CCR-00245 — Next-Up-row template: Next Up fixture + distinct `renderNextUp` runtime structure and no decorative-chevron contract.
- CCR-00260 — Visual regression suite: dedicated executable suite protects exact approved asset bytes/dimensions, visual-contract fingerprint and approved screenshot-authority registration.

These seven rows are mapping candidates only until guarded assembly completes with repository evidence valid and zero qualification errors.

Other rows in CCR-00226..CCR-00265 remain UNVERIFIED unless separately mapped and qualified. No adjacency or keyword-only promotion is permitted.
