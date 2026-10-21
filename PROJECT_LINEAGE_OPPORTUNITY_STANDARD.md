# Project lineage and opportunity standard

This standard defines how Command Center preserves project history, resolves scope drift, and captures useful opportunities without allowing old or accidental work to silently override the current project.

## Two truths: history and current state

Command Center must preserve both:

1. what happened historically; and
2. what is currently canonical.

Historical events must not compete with the latest verified canonical checkpoint for execution priority.

## Historical lineage

A project lineage may record:

- original concept / project creation;
- requirements and user decisions;
- scope additions/removals;
- architecture changes;
- approved assets;
- completed phases;
- abandoned approaches;
- regressions and repairs;
- publishing/deployment events;
- scope drift;
- user corrections;
- renamed/restructured projects;
- current canonical baseline.

Historical event states may include `current`, `superseded`, `replaced`, `abandoned`, `corrected`, `reopened`, and `parked`.

Do not delete useful history merely because it is no longer current.

## Source precedence

When historical sources conflict, use this precedence unless the user explicitly changes it:

1. newest explicit user instruction;
2. verified live/production/published state;
3. newest verified canonical project checkpoint;
4. dedicated canonical project chat/source;
5. older or mixed conversations;
6. assistant suggestions, assumptions, or unverified plans.

An assistant suggestion never silently overrides a user decision.

## Mixed-chat extraction

Old mixed/jumbled chats may contribute evidence or historical events to multiple projects. The mixed chat itself does not become the canonical source merely because it contains relevant information.

Extract project-specific decisions/events and attach them to the correct project lineage.

## Drift review

Scope drift is not automatically bad and is never automatically deleted.

When drift is discovered, record:

- original intent;
- how/when the drift occurred;
- what was built or changed;
- why it conflicts with or differs from current scope;
- useful capabilities discovered;
- current code/data impact;
- cost/risk of keeping it;
- cost/risk of removing it;
- possible future value.

Classify the result as one of:

- `keep_current_scope`
- `park_future_expansion`
- `remove_cleanup_candidate`
- `research_more`

Removal or destructive cleanup requires the applicable authorization; drift discovery alone never authorizes deletion.

## Scope branches

A useful drift path can be preserved as a named scope branch/opportunity even when it is not part of current execution scope.

Example: a personal tool may have historically drifted toward a multi-user commercial platform. The personal tool can remain current while the multi-user capability is parked as a future commercial expansion branch.

Parked branches do not reduce the current roadmap percentage unless the user explicitly accepts them into active scope.

## Canonical reconciliation baseline

After a full historical audit, create a verified Canonical Reconciliation Baseline containing:

- reconciled current requirements;
- protected assets;
- verified completed work;
- superseded/conflicting history;
- unresolved historical conflicts;
- parked scope branches;
- exact current roadmap;
- exact first incomplete unit.

Future work builds incrementally from that baseline. Do not redo the complete historical audit on every continuation.

## Uncertainty

If available evidence cannot resolve a historical conflict, do not guess. Use states such as:

- `unresolved_historical_conflict`
- `source_not_recovered`
- `partial`
- `stale`

A later verified source or explicit user decision may resolve the conflict.

## Opportunity / Improvement queue

The Brain may identify optional opportunities from verified current state, historical drift, completed work, unused capabilities, limitations, or newly available integrations.

Opportunity categories may include:

- quality
- efficiency
- reliability
- automation
- cost savings
- user experience
- security
- revenue
- future product expansion

Each opportunity should capture, where known:

- idea/title;
- why it matters;
- expected benefit;
- effort;
- monetary/resource cost;
- risk;
- dependencies;
- existing work that can be reused;
- recommendation/evidence;
- originating history event or scope branch.

Opportunity states:

- `candidate`
- `research`
- `parked`
- `accepted`
- `rejected`
- `implemented`

## Scope safety

The Brain may discover and recommend opportunities, but recommendations do not silently modify the canonical roadmap.

A project that is verified complete remains complete while optional opportunities are merely candidates/parked. Only an explicitly accepted opportunity becomes active roadmap scope and changes the denominator.

## Post-completion review

After a major roadmap section or project is verified complete, the Brain may run an optional improvement review and surface useful opportunities. It must clearly distinguish optional improvements from unfinished required scope.