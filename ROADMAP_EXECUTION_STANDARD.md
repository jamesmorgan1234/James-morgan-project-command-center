# Roadmap execution standard

This standard defines how Command Center executes, resumes, verifies, and measures roadmap work across software, businesses, books, content systems, and other tracked projects.

## State machine

Every independently recoverable roadmap unit uses an explicit execution state. Preferred states are:

- `pending`
- `in_progress`
- `produced` or `implemented`
- `qa_pending`
- `verified`
- `locked`
- `blocked`
- `reopened`
- `excluded`

Legacy `status = complete` plus `verified = true` remains compatible, but new roadmap manifests should prefer the more explicit state machine.

A unit counts as completed progress only when it is `verified` or `locked`, or when legacy completion is both complete and verified. Merely producing text, files, code, images, pages, migrations, or packages does not count as verified completion.

## Dependencies

Roadmap units may declare `depends_on` as stable unit IDs. A unit cannot become verified completion while a required dependency is incomplete, blocked, stale, or conflicted.

Dependencies must be evaluated from the latest verified checkpoint, never reconstructed from conversational memory when a checkpoint exists.

## Acceptance gates

Each roadmap unit may define `required_gates` and `passed_gates`. Examples include:

- quality
- humanization
- continuity
- originality
- accuracy
- theme_alignment
- colorability
- duplicate_check
- test
- security
- merge
- deploy
- live_verification
- publication_verification

A unit cannot become verified completion until every required gate passes.

## Idempotent continuation

`Continue`, `Complete Phase N`, `Complete <section>`, `Finish <project>`, and equivalent high-level commands are checkpoint-first and idempotent.

Before acting:

1. recover the latest verified checkpoint;
2. reconcile live state where a live source exists;
3. preserve verified/locked work;
4. locate the first incomplete authorized unit;
5. do not repeat an already verified side effect.

Running the same continuation command twice must not recreate approved assets, re-run already applied migrations, republish already published formats, resend completed communications, or redeploy merely because the command was repeated.

## Checkpoint ancestry

Meaningful checkpoints should include, where available:

- `checkpoint_id`
- `parent_checkpoint_id`
- `roadmap_revision`
- `known_good_checkpoint_id`
- `first_incomplete_unit_id`
- `next_action`
- relevant evidence and live identifiers

Checkpoint ancestry creates a recoverable history chain rather than a pile of unrelated summaries.

## Resume contract

Every meaningful checkpoint should contain a deterministic resume contract describing:

- current authorized scope;
- verified/locked work that must not be repeated;
- generated/implemented but unverified work;
- blockers;
- first incomplete unit;
- exact next valid action;
- actions explicitly forbidden on resume;
- scarce resources or external boundaries that must be protected.

A freeze, restart, or new chat never resets the roadmap by itself.

## Scarce-resource protection

Generation capacity, Canva/image credits, paid APIs, publishing actions, deployments, account actions, and other limited or high-impact resources are protected resources.

Use one-before-many or bounded-batch verification when the result can drift or consume scarce capacity. Scale only after the sampled unit/batch passes its acceptance gates.

## Scope changes and percentage integrity

Progress is a consequence of verified scope state, never a control target.

When meaningful new scope is accepted, update the denominator and record the scope-change reason. It is valid for progress to decrease after scope expands. Never manipulate weights to preserve a desired percentage.

Display verified progress to one decimal place when the calculation produces a fractional value, but never round upward into progress that has not actually been completed. Truncate downward to the displayed tenth: 64.96% displays as 64.9%, and 65% is not shown until the verified calculation is at least 65.0%. Whole values may display without `.0`.

## Reopen semantics

Verified/locked work remains complete unless an explicit new fact or user decision reopens that exact unit. Reopening one unit does not reopen unrelated verified units.

The checkpoint must preserve both the prior verified state and the reason for reopening.

## Evidence

State and evidence are separate concepts.

- State says what is complete/current.
- Evidence proves why that state is trusted.

Evidence may include file/version identifiers, hashes, approved assets, test results, commit/PR/deployment IDs, publication state, screenshots, live records, or other project-appropriate proof.

When evidence is insufficient, use `N/A`, `unverified`, `partial`, `stale`, or `conflicted` rather than fabricating certainty.