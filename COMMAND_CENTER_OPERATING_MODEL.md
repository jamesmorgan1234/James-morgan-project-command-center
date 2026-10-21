# Command Center operating model

This is the core execution contract for Command Center projects.

## Source of truth

Every tracked project must have a defined roadmap and a latest verified checkpoint. The latest verified checkpoint, reconciled against the live source when a live source exists, is the authoritative resume point.

Do not reconstruct completed work from memory when a verified checkpoint or live source can establish current state.

## Complete [roadmap section]

When the user instructs `Complete <roadmap section>`, recover the latest verified state, preserve all verified completed work, locate the first incomplete roadmap unit, and continue sequentially through the remaining units in that section.

For a fully authorized roadmap section, normal completion includes implementation/production, testing, legitimate fixes, required QA, merge, deploy/publish when applicable, production/live verification, and final checkpointing. Do not pause merely for a redundant ceremonial merge authorization once the roadmap section itself was explicitly authorized.

This does not bypass genuine protected boundaries such as spending, legal acceptance, destructive or irreversible actions, account/security authorization, or a materially different scope/architecture decision.

## Checkpoint cadence

Create or update a verified checkpoint whenever a meaningful stable state is reached, especially:

- after a roadmap phase or independently recoverable work unit completes;
- after a meaningful QA gate passes;
- immediately before merge/publish/deploy;
- immediately after merge;
- after deploy/publish and live verification;
- after a significant fix that would be costly to reconstruct;
- before moving into the next phase of a long multi-phase run.

A checkpoint must identify what is complete, what is locked, what is still incomplete, verification state, relevant commit/PR/deployment/publication identifiers when applicable, and the exact next resumable unit.

## Recovery rule

On interruption, freeze, new chat, or later continuation:

1. Recover the latest verified checkpoint.
2. Reconcile it against live state when a live source exists.
3. Preserve every verified completed/approved/locked unit.
4. Resume from the first incomplete unit.
5. Never restart a phase solely because the prior conversation ended.

If a regression is discovered, compare against the most recent known-good pre-change and post-change checkpoints before deciding on a repair or rollback.

## Progress rule

Progress percentages are calculated from defined roadmap scope and verified checkpoint state. They are never guessed from elapsed time, activity level, status wording, or intuition.

A project may legitimately decrease in percentage when meaningful new scope is added. A unit contributes completion only when its required verification/quality gate has passed.

When a current verified checkpoint cannot support a defensible percentage, display `N/A` rather than an invented number.

## Roadmap contract

A checkpoint may carry a `state_json.roadmap` manifest describing the project-specific roadmap. The roadmap should use stable IDs and the smallest practical independently verifiable units.

Recommended shape:

    {
      "roadmap": {
        "contract_version": 1,
        "template": "project-type-specific-template",
        "revision": "project-specific-revision",
        "categories": [
          {
            "id": "category-id",
            "label": "Category",
            "weight": 1,
            "phases": [
              {
                "id": "phase-id",
                "label": "Phase",
                "weight": 1,
                "status": "pending",
                "verified": false,
                "quality_gate_passed": false,
                "work_units": []
              }
            ]
          }
        ]
      }
    }

Allowed active statuses are `pending`, `in_progress`, `blocked`, and `complete`. `excluded` removes a unit from the denominator. A unit marked complete does not count as verified completion unless every required gate for that unit has passed.

## Approved/locked work

Approved or verified assets, files, decisions, pages, batches, manuscripts, packages, releases, or other deliverables become locked recovery inputs unless the user explicitly reopens them. Recovery must continue after locked work rather than regenerate or replace it.

## Checkpoint-first refresh

Command Center Refresh should reconcile the newest verified checkpoint state and calculate current roadmap/category/phase/project progress from it. The UI may present the useful result, but raw checkpoint JSON, source plumbing, and internal recovery metadata remain hidden from the normal user interface.
