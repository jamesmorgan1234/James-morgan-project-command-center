# P15.1 design-system remaining evidence gaps after 298-qualified checkpoint

Qualified design-system rows in CCR-00226..CCR-00265 are recorded in the three tranche review/qualification documents and current reviewed mappings. The following rows remain UNVERIFIED because the inspected existing proof is insufficient for the exact canonical wording. These are parked gaps, not NOT_APPLICABLE dispositions and not permission to rewrite unrelated code.

- CCR-00227 — Exact approved screenshot measurements: one retrievable Projects reference has exact byte/dimension regression proof, but exact measurements for every registered approved screenshot authority are not established.
- CCR-00229 — Margin scale: no distinct centralized margin-scale contract and named executable proof was found; spacing tokens alone do not prove a margin scale.
- CCR-00230 — Typography scale: `COMMAND_CENTER_TYPE` exists, but the current exact visual fingerprint does not include typography values and no exact named executable regression for the full scale was found.
- CCR-00232 — Border scale: a central border width exists, but no multi-level border-scale contract/proof was found.
- CCR-00235 — Artwork safe areas: approved fixtures include artwork regions, but no explicit artwork safe-area geometry contract/test was found.
- CCR-00236 — Chevron safe area: owner-facing decorative chevrons are prohibited, but no positive chevron safe-area geometry contract exists for the exact requirement.
- CCR-00239 — Card height classes: Home equal-card height is proven, but no general card-height-class system was found.
- CCR-00241 — Screen-template system: four approved screen fixtures/derivation rules exist, but no explicit reusable screen-template registry/system was found that proves the broader wording.
- CCR-00242 — Section-template system: no explicit reusable section-template system and named proof was found.
- CCR-00246 — Book-cover template: the inspected UI design-system evidence does not establish a canonical book-cover template.
- CCR-00247 — Metric-card template: no explicit canonical metric-card template and named proof was found in the inspected UI contracts.
- CCR-00251 — Blocked-state template: the canonical shared primitive registry does not currently expose a `blocked_state` primitive.
- CCR-00252 — Offline-state template: an offline policy exists, but no canonical offline visual-state template primitive was established.
- CCR-00253 — No arbitrary component sizing: centralized geometry exists, but no exhaustive enforcement/lint/test proves all component sizing is token-governed.
- CCR-00254 — No local CSS overrides that undermine tokens: shared primitives and no-inline-style checks exist, but no exhaustive CSS rule proves absence of token-undermining local overrides.
- CCR-00255 — No giant unexplained vertical gaps: no named automated layout/gap assertion was found.
- CCR-00256 — No inconsistent tile sizes: Home tile equality is proven, but no exhaustive all-tile consistency proof was found.
- CCR-00257 — No random rounded SaaS cards: generic SaaS dashboard patterns are rejected and beveled geometry is protected, but no exact automated prohibition covers arbitrary rounded-card drift across all styles.
- CCR-00258 — No arbitrary blue UI elements outside semantic use: the palette contains blue/cyan support colors, but no semantic-use enforcement/lint was found across the UI.
- CCR-00259 — Component gallery showing canonical appearance: no component-gallery implementation and executable proof was found.
- CCR-00261 — Samsung/mobile-first target: phone-first behavior is proven, but no Samsung-specific target/profile evidence was found.
- CCR-00262 — Portrait-first layout: the approved reference viewport is portrait and a portrait assertion exists, but no exact named negative/failure-path test for landscape rejection was found in the inspected suite.
- CCR-00264 — No horizontal overflow: narrow-layout wrapping is tested, but no explicit whole-shell horizontal-overflow assertion was found.
- CCR-00265 — Native vertical scrolling: navigation owns scroll state, but no exact proof establishes native vertical scrolling across the shell.

Current durable ledger after the supported tranches: 5,852 canonical / 298 VERIFIED / 5,554 UNVERIFIED / 0 NOT_APPLICABLE / 0 structurally invalid; P15.1 remains open. No later phase advanced.
