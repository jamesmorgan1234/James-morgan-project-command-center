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

## P12.8 canonical authorization repair

`SpecialistLifecycleRegistry.assertAuthorization()` now calls the existing P1.1
`assertIdentifierKind(reference, "evidence")` from `kernel/identifiers.ts` and
rejects surrounding whitespace without normalization. The evidence ID contract is
`^evd_[a-z0-9]+(?:-[a-z0-9]+)*$`, also established by PIF.1 SQL and P12.3.
Canonical syntax does not establish evidence existence, consent, a live grant,
or authority beyond the existing exact owner/project/action/target checks.

The additive branch-only migration
`20261028010000_p12_8_canonical_authorization_evidence.sql` applies that same
contract to authorization references in both existing lifecycle history tables.
The action-bearing project history additionally requires non-null authorization
for rename, merge, activate, replace and archive. Registration and other
nonprotected events may retain null authorization. Immutable evidence, RLS,
privileges and owner authorization policies are preserved. The migration is
transactional: invalid existing references block installation without rewriting
history. Any real database rollout/reconciliation remains separately authorized;
no production migration was performed.

Verification commands executed on this repair:

- `npm run build:modules`: PASS.
- `node --test --test-reporter=spec tests/p12-8-*.test.mjs`: 16 PASS, 0 FAIL,
  0 skipped. Includes all five protected transitions, canonical positives,
  arbitrary/malformed/wrong-kind/blank/whitespace references, unchanged state on
  rejection, scope/action/target mismatch, existing lifecycle/provider behavior,
  real isolated PostgreSQL enforcement of both history surfaces, immutability,
  and atomic migration failure on invalid existing history.
- `npm run typecheck`, `npm run check:legacy`, `npm run check:architecture`,
  `npm run audit:authority`, `npm run audit:repository`: PASS. These audits are
  repository checks, not production certification or a semantic every-file audit.
- `npm run build`: module/browser builds PASS; 1446 tests PASS, 0 FAIL.
- `npm run audit:artifact`: structurally valid; local candidate identity remains
  `local-unverified`. `npm run audit:release-candidate` correctly blocked that
  local artifact (no immutable release identity). Exact committed-head CI must
  supply its actual commit identity and verify the workflow before certification.

One initial PostgreSQL test assertion failed because the pre-existing nonblank
constraint rejected blank values before the new canonical constraint. The test
now checks that exact existing constraint for blanks; enforcement was not weakened.
Positive fixtures formerly using `rename:1`, `merge:1`, `activate:1`, `replace:1`
and `auth:<action>` were changed to canonical evidence IDs, with explicit negative
regressions retaining those invalid forms.

The P12.8 functional repair has isolated runtime/database evidence. This record
does not certify an unobserved CI result, every Amendment-20 cross-Brain capability,
Category 12 closure, provider/live operation, or later release/owner acceptance.
Category 12 contains P12.1–P12.8; its newest roadmap P12.8 also includes governed
learning, transferability, capability inheritance, lifecycle, collaboration,
composition, procedure learning and Ecosystem Intelligence Compiler interoperability
(Roadmap 22, distributed ownership section). Narrow evidence-format tests alone
cannot close that expanded coverage or supersede an unmet workflow gate.
