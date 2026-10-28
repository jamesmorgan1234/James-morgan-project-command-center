# P15.1 design-system existing-proof review — tranche 1

Source branch was refetched before review. Canonical wording was recovered read-only for `CCR-00226` through `CCR-00265` by GitHub Actions run `40765062015` / job `123086876293`. This tranche semantically reviews only `CCR-00226` through `CCR-00235`. No runtime/test/schema/production/protected-asset change is made here.

## Supported by existing implementation and named executable proof

- `CCR-00226` — **Design tokens as code.** `clean-room/src/ui/design-tokens.ts` defines frozen color, geometry, typography and effect token objects plus reference viewport/scaling helpers. `category4-visual-regression.test.mjs :: P4.8 shared visual language, geometry and owner interaction rules have a deliberate regression fingerprint` fingerprints the shipped token-backed visual contract; `ui-shell-foundation.test.mjs :: unseen screens derive from the four approved screens instead of switching design systems` rejects a competing design system.
- `CCR-00228` — **Spacing scale.** `COMMAND_CENTER_GEOMETRY` centralizes `outerInset` and `cardGap`; the P4.8 visual-contract regression fingerprint includes the full geometry object, so those spacing tokens are source-bound rather than ad hoc per-screen values.
- `CCR-00231` — **Glow scale.** `COMMAND_CENTER_EFFECTS` defines `borderGlowPx` and `hotGlowPx`; the P4.8 visual-contract regression fingerprint includes the full effects object.
- `CCR-00233` — **Bevel geometry scale.** `COMMAND_CENTER_GEOMETRY` centralizes `cardRadius` and `clippedCorner`; P4.8 fingerprints the full geometry contract and `runtime-visual-structure.test.mjs :: browser visual shell uses the locked beveled phone-first control-system geometry` verifies clipped/beveled shipped structure.
- `CCR-00234` — **Icon-frame geometry.** `COMMAND_CENTER_GEOMETRY` centralizes `iconFrameSize` and `iconInnerSize`; P4.8 fingerprints the geometry contract and `ui-shell-foundation.test.mjs :: visual fixtures preserve approved structures under the current owner card rules` verifies approved project/active/next-up fixture structures that include the icon-frame language.

## Reviewed but intentionally left UNVERIFIED

- `CCR-00227` — **Exact approved screenshot measurements.** The approved Projects reference is byte- and dimension-exact (`941x1672`) and the reference viewport is explicit, but equivalent exact dimensions are not presently proven for every registered approved screenshot authority. Do not promote from one reference.
- `CCR-00229` — **Margin scale.** Existing geometry has an outer inset, but no distinct margin-scale contract with sufficient semantic proof was found.
- `CCR-00230` — **Typography scale.** `COMMAND_CENTER_TYPE` exists with hero/screen/card/section/body/support/label values, but the currently named visual-regression fingerprint does not include that object and no direct exact-value executable proof was found in this review. Keep unverified rather than treating source presence alone as certification.
- `CCR-00232` — **Border scale.** A centralized `borderWidth` token exists, but the requirement calls for a scale and no multi-level border-scale contract was proven.
- `CCR-00235` — **Artwork safe areas.** Approved screen fixtures and right-side art rules exist, but no explicit artwork safe-area geometry/contract was found.

Tranche result: **5 supported / 5 unresolved**. These are review decisions only until guarded assembly and qualification persist the supported mappings. Existing 282-row qualified ledger remains the last certified total until that occurs.
