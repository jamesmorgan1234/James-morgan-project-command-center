# Command Center checkpoint + current-scope progress standard

This file defines the canonical progress contract for Command Center.

## Goal

`Current scope` must describe the verified completion of the scope that is currently defined for a project. It must not be guessed from status wording such as `Live`, `Active`, `Blocked`, or `Publishing in progress`.

A project can move down in percentage when meaningful new scope is added. It moves up only when defined scope items are verified complete.

## Checkpoint freshness rule

A canonical project checkpoint is required whenever a meaningful verified project state changes, including:

- a scope item is added, removed, resized, completed, reopened, blocked, or unblocked;
- a material build, test, deployment, publication, account/integration, or verification milestone changes state;
- a blocker or next action materially changes;
- a verified KPI or other state used by Command Center changes.

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

Allowed active statuses are `pending`, `in_progress`, `blocked`, and `complete`. `excluded` removes an item from the denominator.

## Weighting

Weights represent relative current-scope size, not elapsed time:

- 1 = small bounded deliverable
- 2 = normal deliverable
- 4 = large feature / release / production unit
- 8 = major multi-part scope block

Use the smallest set of independently verifiable items that still represents the actual work. Do not manipulate weights to force a desired percentage.

## Calculation

Only active items count in total scope weight.

Only items with `status = complete` and `verified = true` count as completed weight.

Current scope percent = `completed verified weight / total active scope weight * 100`.

No partial credit is inferred for `in_progress` or `blocked` items.

## Freshness enforcement

If the newest verified checkpoint for a project does not contain a valid scope manifest, Command Center must not keep presenting an older percentage as current. The scope metric becomes unverified/stale and the UI must show `N/A` rather than a fabricated fallback percentage.

A Full Refresh must report a partial result when any tracked project lacks a current verified scope percentage, even if its canonical source rows otherwise reconcile successfully.

## Baseline rule

The initial baseline percentages are derived once from the verified current scope recorded when this standard is introduced. After that, checkpoint manifests control the percentages. Status-word heuristics are not authoritative progress measurements.
