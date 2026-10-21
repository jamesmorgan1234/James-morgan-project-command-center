# Book QA gates standard

This standard supplements `BOOK_PROJECT_ROADMAP_STANDARD.md` and applies to all tracked book projects.

## Reader-promise alignment

The title, subtitle, approved cover art, series identity, and stated concept define the promise made to the reader. Interior content must match that promise unless the user explicitly changes the concept.

This is a hard completion gate.

Examples:

- A crockpot/slow-cooker cookbook must contain crockpot/slow-cooker recipes. Recipes whose required primary method is oven-only, skillet-only, grill-only, or otherwise incompatible fail thematic-scope QC unless the actual presented recipe has a legitimate crockpot method.
- A coloring book interior must visually and thematically belong to the world/theme promised by its approved cover and title. Attractive but off-theme pages fail QC.
- A workbook's exercises, examples, tone, and visual system must support the use-case promised by the title and cover.
- A novel/series cover and metadata must accurately represent the genre, tone, and story delivered. If a protected approved asset conflicts with the manuscript, flag the conflict rather than silently replacing either side.

No book can be marked complete while a material title/cover/interior mismatch remains unresolved.

## Human-authored quality gate

Written content must read as intentional human-authored work. Required checks include natural prose, engaging pacing, believable emotion, distinct dialogue, continuity, no repetitive AI phrasing, no filler, no generic exposition, no unexplained voice drift, and final editing/QC appropriate to the book type.

## Coloring-book colorability gate

The locked default for adult coloring books is medium adult-coloring complexity, refined toward practical real-world coloring rather than maximum digital intricacy.

Pages must provide:

- medium-to-detailed adult complexity without becoming exhausting or microscopic;
- larger usable enclosed coloring areas;
- clean separation between regions;
- crisp black line art on white;
- minimal unnecessary solid-black fill;
- no excessive micro-patterns, visual noise, blur, muddy linework, or tiny impossible spaces;
- a nearly full-page composition with a small consistent no-bleed safety margin when that is the project standard;
- a design that is enjoyable and realistically colorable on paper.

A page that looks impressive digitally but is impractical for a human to color fails QC and must be replaced or simplified before it can be locked.

For Melted Cosmos and similar adult coloring projects, preserve the established medium-detail/cleaner-open-zone standard unless the user explicitly changes that title's difficulty.

## Coloring-book generation protection

- Default working batch: 5 images/pages.
- Hard maximum: 10 images/pages in one generation batch.
- Verify each batch before continuing.
- If drift, duplication, collage behavior, or instability appears, reduce the next batch size.
- Reject collages/contact sheets when individual pages are required.
- Check uniqueness, theme alignment, colorability, printability, page-fill, margins, and line quality before locking a batch.
- Never regenerate a verified/locked batch because a chat froze or restarted.

## Cookbook recipe accuracy gate

A cookbook recipe is not complete merely because text exists.

Verify title, ingredients, quantities, ratios, timing, temperature, method, yield/servings, notes, and internal consistency. Where external verification is appropriate, compare multiple credible independent sources, prefer authoritative culinary/cultural/food-safety sources, identify consensus, investigate meaningful outliers, and distinguish legitimate regional/stylistic variants from mistakes.

Do not treat hundreds of copied/scraped versions of one source as independent evidence. The goal is an original, humanized, technically sound recipe faithful to the intended dish—not copied consensus text.

## Cookbook method/theme gate

Cooking method must match the book promise. If the book is dedicated to a defined method or appliance, recipes must actually use that method/appliance as presented.

## Cookbook finished-dish image gate

The finished-food image must visibly match the actual recipe and expected result. Reject generic or materially different food, impossible garnish/ingredients, contradictory cooking state, wrong vessel when material, or presentation inconsistent with the written recipe.

Images must be appetizing, professional, and publication-quality.

## Cookbook typography/layout gate

Each page must be readable at physical-book size and follow the locked visual system. Reject:

- abnormally tiny type;
- huge dead zones;
- cramped overflow;
- arbitrary scaling;
- elements outside safe margins;
- inconsistent heading hierarchy;
- inconsistent banner placement, recurring layout, image placement, page numbering, spacing, or visual rhythm.

When a verified completed cookbook is designated as the benchmark, recover its actual files/screenshots and use its typography, page density, image treatment, structure, and polish as the comparison standard rather than reconstructing the benchmark from memory.

## Page/recipe-level recovery

For image-heavy books and cookbooks, checkpoints must identify exact page/recipe/batch ranges that are verified/locked, produced but unverified, needing revision, or pending.

Recovery resumes at the first unit that has not passed every required gate. Previously verified units are protected unless explicitly reopened.