# Command Center checkpoint + current-scope progress standard

This file defines the canonical progress contract for Command Center. `COMMAND_CENTER_OPERATING_MODEL.md` and `ROADMAP_EXECUTION_STANDARD.md` define the execution/resume contract, and project-type standards such as `BOOK_PROJECT_ROADMAP_STANDARD.md` plus `BOOK_QA_GATES_STANDARD.md` define additional completion gates.

## Goal

`Current scope` must describe the verified completion of the scope that is currently defined for a project. It must not be guessed from status wording such as `Live`, `Active`, `Blocked`, or `Publishing in progress`.

A project can move down in percentage when meaningful new scope is added. It moves up only when defined scope items are verified complete.

## Checkpoint freshness rule

A canonical project checkpoint is required whenever a meaningful verified project state changes, including:

- a scope item is added, removed, resized, completed, reopened, blocked, or unblocked;
- a roadmap phase or independently recoverable work unit changes verified state;
- an approved/locked asset or batch changes state;
- a material build, test, deployment, publication, account/integration, or verification milestone changes state;
- a blocker or exact next resumable action materially changes;
- a verified KPI or other state used by Command Center changes.

Long-running work should checkpoint at meaningful recovery boundaries, especially after a phase/work unit, after meaningful QA, immediately before merge/publish/deploy, immediately after merge, and after deploy/publish plus live verification.

Do not write a new checkpoint for conversational chatter, repeated summaries, or tiny actions that do not change verified project state.

## Scope manifest

A verified checkpoint that changes project state should include a complete `state_json.scope` manifest, not a partial delta.

Example shape:

    {
      "scope": {
        "contract_version": 1,
        "revision": "project-specific revision id",
        "items": [
          {
            "id": "stable-item-id",
            "label": "Independently verifiable deliverable",
            "weight": 2,
            "status": "complete",
            "verified": true,
            "active": true
          }
        ]
      }
    }

Allowed active scope statuses are `pending`, `in_progress`, `blocked`, and `complete`. `excluded` removes an item from the denominator.

## Roadmap manifest

When a project has a defined roadmap, the checkpoint should also include the complete current `state_json.roadmap` manifest. Roadmap categories, phases, and work units use stable IDs so a later chat can recover the exact first incomplete unit without recreating completed work.

Canonical shape:

    {
      "roadmap": {
        "contract_version": 1,
        "template": "project-type-or-project-specific-template",
        "revision": "roadmap-revision-id",
        "categories": [
          {
            "id": "category-id",
            "label": "Category",
            "weight": 1,
            "phases": [
              {
                "id": "phase-id",
                "label": "Phase",
                "weight": 2,
                "state": "in_progress",
                "active": true,
                "depends_on": [],
                "required_gates": ["quality"],
                "work_units": [
                  {
                    "id": "stable-work-unit-id",
                    "label": "Recoverable unit",
                    "weight": 1,
                    "state": "verified",
                    "verified": true,
                    "quality_gate_passed": true,
                    "dependencies_satisfied": true
                  }
                ]
              }
            ]
          }
        ]
      }
    }

New roadmap manifests should use the state model in `ROADMAP_EXECUTION_STANDARD.md`. Legacy `status = complete` plus `verified = true` remains compatible.

A roadmap unit may include project-specific gates such as humanization, continuity, accuracy, theme alignment, colorability, duplicate checks, live verification, publication verification, approval/lock state, and exact asset/page/chapter/recipe ranges. A unit only contributes verified completion after every gate required by that project type has passed.

Approved/locked work must remain identifiable in the checkpoint. Recovery must continue after it unless the user explicitly reopens it.

## Recovery pointer

A meaningful checkpoint should make recovery deterministic. It should identify, as applicable:

- `checkpoint_id` and parent/known-good checkpoint references where available;
- the latest verified completed unit;
- protected/approved/locked units and assets;
- generated/implemented-but-unverified work;
- the first incomplete unit;
- the exact next resumable action;
- actions forbidden on resume;
- relevant commit, PR, deployment, publication, package, or asset identifiers;
- the most recent known-good pre-change/post-change references when applicable.

A freeze, interruption, or new chat is not a reason to reset a phase.

## Weighting

Weights represent relative current-scope size, not elapsed time. Use positive values consistently. Typical guidance is:

- 1 = small bounded deliverable
- 2 = normal deliverable
- 3–4 = large feature / release / production unit
- 5–8 = major multi-part scope block

Use the smallest set of independently verifiable items that still represents the actual work. Do not manipulate weights to force a desired percentage.

## Calculation

Only active items count in total scope weight.

Only items with `status = complete` and `verified = true` count as completed scope weight. When a project-type standard requires additional gates, those gates must also pass before the item can be verified complete.

Current scope percent = `completed verified weight / total active scope weight * 100`.

Roadmap phase/category/project percentages are calculated from their verified weighted units using the same principle. Parent percentages must use the exact child completion fractions before display precision is applied; do not compound rounding from child display values.

Do not snap percentages to coarse 10% buckets. For display, preserve one decimal place without ever overstating completion: truncate downward to the displayed tenth. Example: a verified calculation of 64.96% displays as 64.9%; 65% is not displayed until the verified calculation is at least 65.0%.

No partial credit is inferred for `in_progress` or `blocked` items unless the roadmap explicitly defines smaller independently verifiable work units that have themselves completed.

## Freshness enforcement

If the newest verified checkpoint for a project does not contain a valid scope manifest, Command Center must not keep presenting an older percentage as current. The scope metric becomes unverified/stale and the UI must show `N/A` rather than a fabricated fallback percentage.

Likewise, if a displayed roadmap/category/phase percentage cannot be reconciled to the newest verified roadmap checkpoint, show `N/A` rather than an older or guessed value.

A Full Refresh must report a partial result when any tracked project lacks a current verified scope percentage, even if its canonical source rows otherwise reconcile successfully.

## Baseline rule

The initial baseline percentages are derived once from the verified current scope recorded when this standard is introduced. After that, checkpoint manifests control the percentages. Status-word heuristics are not authoritative progress measurements.