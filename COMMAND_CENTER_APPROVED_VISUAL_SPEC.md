# Command Center — Approved Visual Specification

Status: **LOCKED VISUAL REFERENCE**

This document records the exact approved mobile screenshots supplied by James Morgan for the authoritative Command Center rebuild. These screenshots are literal visual specifications, not inspiration. Where an older written visual description conflicts with these screenshots, the screenshot controls the visual result. Functional, data-truth, security, navigation, and project rules still control behavior.

## Source image identity

All four approved screenshots are 864 × 1536 portrait images.

| Screen | Source file | SHA-256 |
| --- | --- | --- |
| Active / Live | `3369.png` | `037f915a9afcae35ff072fa887486c603986da8eca552854a7243323cf7ca88d` |
| Project Detail — The Missing Hour Saga | `3370.png` | `2d81e1fc5bff0b510e916e36904df61c41afa750d541cfa092cff7ece767f77a` |
| Projects | `3372.png` | `dd11f7d2e22bd11f2e0d329677deb7cc3e9e9920b336aabe2d70905d10ec5b1b` |
| Next Up | `3373.png` | `2044601627c18cad42f61479f14f8f2107f5e181c5be6d7223d7f4e28794ad60` |

The source screenshots are external visual references supplied in chat. Their filenames and hashes are recorded here so future rebuild work can verify which approved images this specification was derived from.

## Global visual system visible in all four screenshots

- Phone-first portrait layout with the content extending naturally vertically.
- Near-black background with subtle sci-fi linework, sparks, atmospheric orange light, and planetary / landscape imagery.
- Bright orange-gold illuminated borders with a hot core plus softer outer glow.
- Strong angular / clipped sci-fi card geometry; borders are not ordinary rounded rectangles.
- Orange-gold is the dominant interaction/accent color; cyan/blue, green, yellow, gray-blue, and red are reserved for semantic state.
- White primary headings with warm highlight/glow.
- Muted blue-gray secondary text.
- Dense information hierarchy with very little dead space.
- Large octagonal or multi-bevel back control at upper left.
- Repeating left icon modules use layered glowing octagonal/circular machinery frames, not generic icon circles.
- Repeating right navigation affordance is a bright orange-gold chevron.
- Illustrative artwork is integrated inside cards rather than placed in detached image boxes.
- Cards have black-to-transparent internal gradients so text remains readable over artwork.
- Status pills are compact, outlined, and color-coded with a luminous dot.
- Screen backgrounds and cards visually belong to one continuous sci-fi control system.
- No generic admin-dashboard white/gray panels, no large empty gutters, no plain form look.

## Header pattern

The approved screens use a shared top composition:

- Phone/system status bar remains visible above the app content.
- Large multi-bevel back button on the left.
- Main title to the right of the back button.
- One-line subtitle directly under the title.
- Upper-right background artwork uses the glowing orange planet/network motif without competing with the title.
- A thin orange horizontal light line separates the header from primary content on some screens.

## Screen: Projects

Title: `Projects`
Subtitle: `Full portfolio of tracked projects`

### Portfolio summary card

- Full-width beveled card immediately below the header.
- Large folder icon module at left.
- Large project count (`18` in the reference) beside a thin vertical divider.
- Uppercase label `TOTAL PROJECTS`.
- Compact portfolio breakdown line below the label.
- Integrated landscape artwork across the right half.
- Large right chevron.

### Project row structure

Every row is a compact, full-width beveled card with four visual zones:

1. **Left icon module** — glowing layered icon machinery.
2. **Center-left text** — project title, short subtitle, semantic status pill.
3. **Center-right artwork** — integrated thematic illustration fading behind information.
4. **Right progress/navigation zone** — compact circular progress ring where applicable, fraction/detail beneath, and a right chevron at the outer edge.

The progress ring is intentionally small and circular. It must never stretch into an oval or become a dominant hero element.

Reference rows demonstrate distinct semantic states such as `In Progress`, `Planning`, `Live`, `Queued`, `Active Rebuild`, and `Blocked`. Those exact reference values are not authority to fabricate live production state.

## Screen: Active / Live

Title: `Active / Live`
Subtitle: `Live projects in progress`

This is a distinct screen/layout, not a Projects filter clone.

### Active row structure

Each card contains:

- Large left icon module.
- Project title and semantic status pill in the center-left area.
- Exact next-action sentence under the status.
- Thin vertical divider before the scope/status column.
- Compact right-side scope percentage and `Scope` label.
- Secondary live/sync metric under scope, such as sync recency or active count.
- Integrated themed artwork on the right, behind but not obscuring the information.
- Large outer-right chevron.

Unlike the Projects screen, the reference Active / Live cards do **not** use circular progress rings. Scope is rendered as large text in a dedicated column.

## Screen: Next Up

Title: `Next Up`
Subtitle: `Priority queue`

This is an action-priority interface, not a progress dashboard.

### Priority row structure

Each row contains:

- Large left icon module.
- Project title.
- Semantic status pill.
- Exact next-action sentence below.
- Integrated project artwork filling the right/center-right area.
- Large right chevron.

No project progress ring is present in the approved screenshot. Do not add one unless James explicitly changes the visual specification.

The artwork is more prominent than on the Projects screen and shares horizontal space with the text through controlled gradients.

## Screen: Project Detail — The Missing Hour Saga

Title: `The Missing Hour Saga`
Subtitle: `Project Details`

### Hero card

- Large beveled card below the header.
- Square/portrait project artwork at left inside an orange illuminated frame.
- Upper metadata label in orange uppercase (`SCIENCE FICTION SERIES` in the reference).
- Large project title.
- Two-to-three-line project description.
- Compact metadata row beneath description.
- Green `Active` status pill at upper right.
- Large thematic eclipse/landscape artwork integrated at right.
- Right chevron.

### KDP Performance section

- Beveled section card with section-title icon at upper left.
- Title `KDP PERFORMANCE`.
- Compact timeframe control/label at upper right.
- Six metric cells arranged exactly as a **3-column × 2-row** grid on phone.
- Each metric cell includes a small illuminated icon module, a large value, and a compact label.
- Metric values must be verified live data or truthful `N/A` / verified zero; the screenshot values are layout examples only.

### Books in Series section

- Section title and count in header row.
- Five covers fit across the phone width in a single row in the approved reference.
- Each cover has a thin warm border and a small numbered corner badge (`1` through `5`) in the approved screenshot.
- Book title text sits below each cover.
- Do not replace the approved numbered-corner-badge treatment with a different older prose description unless James explicitly reopens it.

### Publication Status section

- Four publication-format cards fit across one row on phone.
- Reference formats: Kindle eBook, KDP Select, Paperback, Hardcover.
- Each format card contains its format icon/branding, completion fraction, state text, and green completion indicator where applicable.
- Publication state is factual: file existence is not approval; approval is not publication; Command Center must not imply a KDP action occurred when it did not.

### KDP Snapshot History row

- Compact full-width beveled row.
- Small left section icon.
- Title and one-line explanatory text.
- Integrated mountain/chart artwork on right.
- Right chevron.

### Tracking Integrations row

- Compact full-width beveled row.
- Left link/integration icon.
- Title and one-line supporting text.
- Compact provider/status icons across the right half separated by thin vertical dividers.
- Right chevron.

## Geometry / density requirements

- Match the screenshots' compact vertical rhythm; do not increase card height simply to make implementation easier.
- Maintain the narrow internal gutters visible in the references.
- Keep icon modules vertically centered with their row content.
- Keep outer margins narrow and consistent.
- Use clipped/beveled corners consistently at section and row level.
- Preserve the strong illuminated outer edge without allowing glow to blur text or merge adjacent cards.
- Avoid overlap between titles, status pills, artwork, metrics, and chevrons at the target phone viewport.
- Preserve native vertical scrolling; do not lock body scrolling to achieve screenshot matching.

## Data truth boundary

The screenshots lock visual structure, geometry, hierarchy, color language, and artwork treatment. They do **not** authorize production data values shown in the examples. Live Command Center values must come from verified current sources. If data is unavailable, show the correct truthful fallback such as `N/A`, `Starting`, or another defined state instead of inventing a value.

## Architecture boundary

These screenshots are to be implemented by the new authoritative single-owner renderer/navigation/visual system. Historical V4/V5/V6/approved UI layers may be inspected for feature/data wiring evidence, but must not become the structural rendering foundation of the rebuild. Feature modules may provide data and actions; they must not bootstrap competing shells.
