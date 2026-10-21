# Book project roadmap + recovery standard

This standard applies to dedicated book, series, trilogy, coloring-book, workbook, and cookbook project chats. The dedicated ALL-CAPS project chat is the canonical project lane for that title/series unless the user explicitly changes the source.

## Core rule

For books, `complete` means publishable-quality work has passed the required quality, continuity, asset, packaging, and verification gates. Merely generating pages/files does not make a roadmap unit complete.

## Quality over completion speed

Quality is mandatory and outranks speed, batch size, or nominal percentage.

Written books must read like intentional human-authored work. Required gates include, as applicable:

- natural, specific prose rather than generic AI phrasing;
- engaging pacing and scene progression;
- believable emotion and character behavior;
- natural dialogue with distinct voices;
- continuity of plot, chronology, relationships, setting, rules, and established facts;
- no repetitive exposition, filler, templated transitions, or redundant summaries;
- no unexplained tone/voice drift;
- no plagiarism or recycled generic content;
- final editing/QC appropriate to the book type.

A unit that exists but fails these gates remains `in_progress` or `blocked`, not complete.

Cookbooks additionally require coherent title/cover/interior alignment, consistent recipe structure and formatting, useful instructions, and a uniform visual/layout system.

Coloring books/workbooks additionally require page-level visual and structural consistency, correct promised page counts, usable page composition, and conformity with the approved cover/interior system.

## Generation-protection rule

Generation capacity is a limited resource. Never regenerate a verified or approved asset merely because the conversation restarted or a tool lost context.

For image-heavy projects:

- generate one correct unit or a deliberately bounded small batch before scaling when output-mode drift is possible;
- verify individual-page output when individual pages are required;
- reject collage/contact-sheet/multi-panel output when the locked specification requires one page per asset;
- detect duplicate or near-duplicate outputs before accepting a batch;
- record completed asset IDs/ranges and the next required asset in the checkpoint;
- once verified/approved, lock the asset or batch and resume after it;
- do not spend additional generation credits recreating locked work unless the user explicitly reopens it.

## Canonical checkpoint contents

A meaningful book checkpoint should preserve, as applicable:

- project/series title and author identity;
- book number/title and project type;
- locked plot/content scope and promises;
- approved cover and other protected art references;
- approved interior/page/layout system;
- trim size, format targets, page-count requirements, and sample/preview rules when defined;
- manuscript/chapter/recipe/page/batch completion inventory;
- exact approved/verified asset ranges;
- files/packages already produced;
- QC gates passed or still pending;
- publishing state by format;
- blockers;
- exact next resumable unit.

The checkpoint must distinguish `complete`, `generated but unverified`, `needs revision`, `pending`, and `locked/approved` rather than collapsing them into one status.

## Resume behavior

On continuation, recover the latest verified checkpoint and resume from the first incomplete unit. Never restart the entire book, phase, page set, recipe set, chapter set, or artwork batch solely because a chat froze or a new conversation was created.

Example: if pages 1-30 are verified/locked and pages 31-40 are pending, resume at page 31. Do not regenerate pages 1-30.

## Roadmap templates

### Prose novel / standalone

1. Story Definition & Locked Canon
2. Manuscript / Expansion
3. Developmental + Humanization Pass
4. Line Edit / Proof / Continuity QC
5. Cover + Interior Design
6. Production Files
7. Metadata + Pricing
8. Publishing + Live Verification

### Trilogy / series

Track each book independently through the applicable roadmap, plus series-level units for canon continuity, rollout order, collection/box-set packaging when applicable, series metadata, and final series verification.

Series percentage derives from verified weighted book-level and series-level units; it is not an average of guessed book percentages.

### Coloring book / art-heavy book

1. Book Identity + Approved Cover
2. Interior Art System + Output Rules
3. Page Production by explicit ranges/batches
4. Interior Assembly + Page Count
5. Duplicate / Composition / Theme QC
6. Production Files
7. Metadata + Pricing
8. Publishing + Live Verification

### Workbook

1. Book Identity + Learning/Use Goal
2. Content / Exercises
3. Interior System + Usability
4. Page Production / Assembly
5. Humanization + Accuracy + Usability QC
6. Cover + Production Files
7. Metadata + Pricing
8. Publishing + Live Verification

### Cookbook

1. Concept + Audience + Book Promise
2. Recipe/Content Inventory
3. Recipe Drafting + Humanization
4. Consistency / Usefulness / Accuracy QC
5. Approved Visual + Interior System
6. Interior Assembly + Uniformity QC
7. Cover + Production Files
8. Metadata + Pricing
9. Publishing + Live Verification

## Progress calculation

Use stable roadmap units and weights that reflect actual remaining scope. Only units that are complete and verified, including required quality gates, count toward completion.

Do not award progress simply because a generation call ran, text was produced, an image exists, or a file was exported.

If scope expands materially, update the roadmap denominator and allow the displayed percentage to move down accurately.

## Protected approved work

User-approved covers, locked manuscripts, approved interiors, accepted batches/pages, established canon, and final packages are protected assets. They must not be replaced, redrawn, regenerated, rewritten, or reopened unless the user explicitly authorizes that exact change.
