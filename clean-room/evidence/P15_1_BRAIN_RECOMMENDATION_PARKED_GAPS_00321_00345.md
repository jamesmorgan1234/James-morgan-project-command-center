# P15.1 Brain/recommendation parked gaps — CCR-00321..CCR-00345

Current qualified checkpoint entering this disposition: 5,852 canonical requirements / 328 VERIFIED / 5,524 UNVERIFIED / 0 NOT_APPLICABLE / 0 structurally invalid.

This file records only the six requirements in this cluster that remain deliberately UNVERIFIED after semantic review. It does not weaken, rewrite, waive, or reclassify any canonical requirement.

- `CCR-00324` — **Prompt/policy versioning.** Existing authority/policy epochs and versioned provider/model contracts do not yet directly prove a combined prompt-and-policy versioning contract. No requirement-specific executable proof was found in this pass.
- `CCR-00326` — **Portfolio-scoped context builder.** Project-scoped Brain context and portfolio analytics both exist, but no direct portfolio-context-builder contract/test was found. Analytics over a portfolio is not treated as equivalent to context construction.
- `CCR-00328` — **Facts separated from ideas.** Brain intent and planning taxonomies distinguish ideas/proposals from verified facts conceptually, but the current executable proof does not directly exercise a persisted fact-vs-idea separation invariant. This row is not promoted by semantic similarity alone.
- `CCR-00338` — **Recommendation deduplication.** Generic analytics/event deduplication exists, but no recommendation-identity deduplication contract/test was found. Generic event dedupe is not accepted as substitute proof.
- `CCR-00342` — **Recommendation cost classification.** Cost classes exist in routing/method governance and optimizer opportunity kinds include cost, but no direct recommendation-level cost-classification contract/test was found.
- `CCR-00344` — **Recommendation architecture placement.** Governance proposals are Command-Center controlled and architecture impact is explicit, but no direct contract/test records where each recommendation belongs in the target architecture. Impact references are not treated as architecture-placement proof.

All six rows remain `UNVERIFIED`. No runtime/schema implementation change is made here. Future work may close them through stronger existing evidence discovered later or a targeted implementation/test repair if a real gap is confirmed.
