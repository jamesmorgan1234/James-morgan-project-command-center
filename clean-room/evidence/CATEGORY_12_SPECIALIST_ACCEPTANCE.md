# Category 12 — Specialist isolation, lifecycle, composition, recovery, and future registration

Status: IMPLEMENTED FOR ISOLATED BRANCH VERIFICATION

## P12.8 acceptance scope

Category 12 specialists remain subordinate projections inside Command Center. A specialist may own its declared domain truth, but it may not override Command Center owner authority, expand its isolation class, silently change providers, or treat local learning as globally applicable truth.

The current specialist framework provides:

- explicit type registration, truth ownership, isolation class, provider capabilities, data/Brain/Agency contracts, project-detail surfaces, and source provenance;
- canonical projection checks that reject project-level truth-owner or isolation-class override;
- owner/project canonical-truth collision detection;
- exact-authorized rename, merge, activation, replacement, and archive lifecycle transitions;
- dormant/reactivation behavior gated by currently available required provider capabilities;
- provider-health assessments that isolate provider loss instead of rewriting canonical project truth;
- generic registration for future specialist types without hard-coded project identities;
- durable append-only lifecycle and provider-assessment evidence with owner-isolated RLS;
- recovery references and replacement/supersession lineage.

## Cross-Brain learning boundary

Specialist state, capability evidence, and outcomes may participate in the ecosystem intelligence pipeline only through the controlling PIF learning/promotion governance. Category 12 does not create a shortcut around applicability, provenance, confidence, privacy, isolation, transferability, evaluation, or Command Center authority. Domain success remains domain-scoped unless the governed promotion path separately proves broader applicability.

## Acceptance evidence

`clean-room/tests/p12-8-specialist-lifecycle-isolation.test.mjs` verifies future type registration, canonical truth collision rejection, exact lifecycle authorization, provider-gated reactivation, provider-loss containment, durable immutable recovery evidence, and canonical projection non-override rules.

Specialist profiles P12.2–P12.7 remain separate domain owners while using the shared framework. P12.8 composes those profiles without merging their private state or truth ownership.

Full verification requires the exact commit containing this evidence to pass the repository build/typecheck/test/audit workflow. Documentation alone is not runtime, CI, provider, production, or owner-acceptance evidence.
