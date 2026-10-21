# Agent Mode — Books opt-in policy

Books are an **explicit-target-only** domain for Command Center Agent Mode.

Agent Mode must never autonomously create, expand, write, rewrite, generate covers for, produce interiors for, or publish books merely because Books projects exist or because other work is complete. It must not sit in a loop producing book after book, series after series, cookbook after cookbook, or coloring book after coloring book without a current explicit user instruction identifying the authorized target and scope.

## Default rule

**Books are excluded from autonomous Agent Mode execution unless the user explicitly selects a specific book, series, collection, cookbook, workbook, or clearly bounded Books task.**

Cross-project Agent Mode runs do not automatically include Books. A broad command such as “work on everything,” “continue all projects,” or “optimize the portfolio” must not be interpreted as authorization to generate or complete Books projects.

## Valid explicit Books commands

Examples of authorized Books targeting include:

- “Check this book and make sure it is ready for publication.”
- “Run final QC on Book 2.”
- “Complete this cookbook to my locked cookbook standard.”
- “Finish The Unfired World Book 3.”
- “Verify this coloring book against the approved Strange Worlds standard.”
- “Prepare this named workbook for publication.”
- “Complete this explicitly named trilogy/series.”

The exact named target and the scope implied by the user’s command define the Agent Mode boundary.

## Publication-readiness audit mode

When the user asks Agent Mode to check a book for publication readiness, the default behavior is **audit and repair only the named target**. Agent Mode must:

1. recover the newest verified checkpoint and approved/locked assets;
2. identify the book subtype and applicable canonical standards;
3. verify title/subtitle/cover/interior promise alignment;
4. verify humanization and natural reader-facing quality where applicable;
5. verify developmental, continuity, originality, line-edit/proof, and formatting gates where applicable;
6. verify subtype-specific gates such as coloring-book colorability/printability/uniqueness, workbook usability, or cookbook recipe/method/image/layout accuracy;
7. preserve locked canon, approved covers, approved interior assets, and already verified units;
8. repair only failed/incomplete units within the authorized target;
9. verify production files and metadata when those are part of the requested readiness scope;
10. report the exact remaining publishing/account-bound boundary instead of silently publishing unless publishing itself was explicitly authorized and all Deployment/Security gates permit it.

A book is not publication-ready merely because files exist.

## Completion mode

When the user explicitly says to complete a named book/cookbook/workbook/series, Agent Mode may perform the full normal-chat-capable production workflow for that named target, including writing, expansion, editing, humanization, factual/QC work, artwork/interior production, assembly, formatting, production files, metadata, and verification, subject to the existing project rules and protected boundaries.

For cookbooks, the user’s locked benchmark/expectation from the approved first cookbook and current cookbook standards must be used where applicable. Agent Mode must not substitute a generic cookbook standard merely because it is easier.

For series/trilogies, authorization to complete a specifically named series may cover the explicitly named series scope, but it does not authorize starting unrelated Books projects afterward.

## No self-generated book backlog

Agent Mode may identify a Books opportunity or note that a title is incomplete, but it must place that information in the appropriate opportunity/attention queue rather than automatically beginning production.

Agent Mode may not:

- invent new book titles and begin writing them;
- continue indefinitely to the next book after finishing the authorized target;
- treat an empty Agent queue as permission to make another book;
- use spare capacity as justification to create Books content;
- generate replacement covers/art for locked approved assets;
- reopen a published/closed book unless the user explicitly reopens it;
- consume scarce image/generation capacity on an unselected Books project.

## Normal chat and Work rule for Books

The global Agent Mode resource policy remains binding:

- normal chat performs every Books task it can, at the highest available normal-chat reasoning policy;
- Work is used only for the smallest genuine capability boundary normal chat cannot cross;
- Books are never handed wholesale to Work because publishing or one account-bound step requires Work;
- publishing/account-bound Work handoffs must be compressed to the smallest possible action and return immediately to normal chat afterward;
- Work model selection follows the least-sufficient-capability ladder and the Work-usage ledger rules.

## Existing Books standards remain controlling

This policy adds an **authorization boundary**; it does not replace any Books quality rule.

The following remain controlling where applicable:

- `BOOK_PROJECT_ROADMAP_STANDARD.md`
- `BOOK_QA_GATES_STANDARD.md`
- `DEPLOYMENT_STANDARD.md`
- current verified project checkpoints
- approved covers/assets/canon
- newest explicit user instructions

If this policy conflicts with a newer explicit user instruction for a specific named Books target, the newer explicit instruction controls that target only; it does not create blanket authorization for unrelated Books projects.
