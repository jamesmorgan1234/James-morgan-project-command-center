# Command Center — Historical Export Memory Migration & Project Recovery

Status: **OWNER-REVIEW ARCHITECTURE — RECONCILIATION REQUIRED BEFORE SPEC LOCK v2**

Purpose: convert the lessons from the complete historical ChatGPT export recovery into first-class Command Center requirements so projects, decisions, rules, requirements, assets, failures, and unfinished work do not disappear into chat history again.

This document is specification evidence only. It does not authorize reuse of legacy Command Center implementation code.

## Source-recovery context

The historical export currently available for reconciliation contains two conversation JSON parts with **132 top-level conversations** total. The recovery pass exposed an important product problem: the old operating model allowed valid project state, project lineage, decisions, generated artifacts, failure lessons, and even whole project candidates to exist only inside chat history instead of one durable canonical system.

The export also proves that project identity can evolve over time. Examples include:

- HireReady AI later becoming Torevi;
- ClipEmpire / ClipForge concepts evolving into VeloClip;
- later VeloClip scope drift that was explicitly corrected back toward the original autonomous-media mission;
- project work that existed outside the current project registry;
- project-specific automations that were embedded in ordinary conversations;
- generated source packages whose continued existence depended on the chat/file surface;
- different conversations containing newer decisions that superseded older requirements.

The rebuild must eliminate that failure class.

## Controlling recovery principle

**Historical conversation is evidence, not automatic current truth.**

Every imported fact must retain source lineage and be reconciled against:

1. James's newest explicit decision;
2. the current canonical project record;
3. verified live provider/repository/database state where applicable;
4. approved/protected assets;
5. current owner/global/project rules;
6. known supersession/rename/merge history.

A historical export may discover forgotten work, but it may not silently reactivate, publish, spend, deploy, merge, send, or create a live project without the applicable authority.

## Export / History Recovery subsystem

### ER-01 — Native export ingestion
Command Center must be able to ingest supported ChatGPT export packages or extracted conversation JSON without requiring manual one-chat-at-a-time recovery.

### ER-02 — Complete conversation inventory
Ingestion must inventory every conversation before classification, including conversation ID, title, timestamps, archive state where available, Project-folder/template ID, and source export identity.

### ER-03 — Full-message extraction
The recovery pipeline must process the complete message graph, not only titles, last messages, semantic-search hits, or chats already known to be projects.

### ER-04 — Branch/message graph awareness
Where an exported conversation contains branched message history, the importer must preserve graph/branch identity rather than flattening conflicting branches into false chronology.

### ER-05 — Artifact-reference recovery
The importer must capture file references, generated artifact names, repository references, deployment references, database/provider identifiers, screenshots/images, and other evidence links when present.

### ER-06 — Project-folder lineage
Project/template IDs from historical exports must be preserved so multiple conversations can be associated with the project container in which they originally lived.

### ER-07 — Standalone-project discovery
The importer must also find legitimate project/build work that never had a Project-folder ID.

### ER-08 — Forgotten-project detection
Command Center must identify candidate projects that appear historically substantive but are absent from the current canonical project registry.

### ER-09 — Rename detection
Historical names, current names, aliases, and owner-approved renames must be linked without creating duplicate projects.

### ER-10 — Merge/supersession detection
The system must distinguish a true separate project from a concept that was later merged into, superseded by, or restored back into another project.

### ER-11 — Project-state classification
Recovered project candidates must be classified using evidence-backed states such as ACTIVE, PAUSED, BLOCKED, COMPLETED, CLOSED, SUPERSEDED, MERGED, ABANDONED, CANDIDATE, or UNKNOWN.

### ER-12 — No silent activation
Historical recovery may create a review candidate, but it may not silently activate execution or change owner priority.

## Durable Brain memory and canonicalization

### ER-13 — Provenance on every recovered assertion
Recovered facts must carry source conversation ID, source message ID where available, timestamp, import batch, and confidence/evidence class.

### ER-14 — Fact versus proposal separation
The importer must distinguish owner decisions, assistant recommendations, brainstorms, tool results, generated examples, and verified external/live facts.

### ER-15 — Newer-owner-decision precedence
A newer explicit owner decision supersedes an older conflicting owner decision unless James later reopens it.

### ER-16 — Current-live-state precedence
For mutable external state, current verified live state outranks stale historical conversation claims.

### ER-17 — Conflict registry
Conflicting historical claims must remain visible until reconciled; the importer may not invent a compromise.

### ER-18 — Confidence tiers
Recovered information must have explicit confidence such as DIRECT_OWNER_DECISION, VERIFIED_TOOL_RESULT, PROTECTED_ASSET_EVIDENCE, ASSISTANT_PROPOSAL, INFERRED_LINEAGE, or UNKNOWN.

### ER-19 — Canonical decision ledger
Owner decisions that survive reconciliation must become durable canonical decisions rather than remaining chat-only context.

### ER-20 — Canonical rule ledger
Global/project operating rules recovered from history must be normalized into a governed rule ledger with effective dates and supersession links.

### ER-21 — Canonical artifact ledger
Important generated artifacts must have durable identity, location, version/checksum when available, provenance, approval state, and supersession state.

### ER-22 — Canonical checkpoint ledger
Recovered checkpoints must identify what was actually verified, what was only claimed, exact next action, blockers, and the evidence supporting the checkpoint.

### ER-23 — Requirements extraction
Historical product/build requirements that remain applicable must be candidates for canonical requirement reconciliation rather than existing only as prose in old chats.

### ER-24 — No assistant-proposal auto-promotion
An assistant's historical suggestion is not an owner-approved requirement merely because it was detailed.

## Privacy and compartmentalization

### ER-25 — Privacy classification before persistence
Imported historical content must be classified before it is copied into project/business/system knowledge.

### ER-26 — Private personal data isolation
Health, relationship, identity, financial, credential, and other private personal material must not leak into repositories, project specs, cross-project context packets, or worker prompts unless directly required and authorized for that purpose.

### ER-27 — System-lesson extraction without private copying
Command Center may extract a reusable system lesson from a private conversation without preserving unnecessary sensitive content in the system lesson.

### ER-28 — Project isolation
Historical data from one project may not contaminate another project's mutable state merely because both appeared in the same chat/export.

### ER-29 — Credential-secret exclusion
Secrets/tokens/passwords found in historical material must never be promoted into ordinary Brain memory or source control.

### ER-30 — User-visible provenance and correction
James must be able to inspect why Command Center believes a historical fact, correct it, merge it, supersede it, or mark it irrelevant.

## Recovery of lost work and artifacts

### ER-31 — Lost-artifact locator
When a historical chat references a generated file that is no longer available, Command Center must preserve the reference and attempt authorized source recovery instead of silently recreating it.

### ER-32 — Recreate only when evidence allows
If an original artifact cannot be recovered, recreation must be explicitly identified as reconstruction, not mislabeled as the original.

### ER-33 — Protected-asset preservation
Approved covers, designs, manuscripts, icons, contracts, or other protected work discovered through recovery must be preserved and never silently replaced.

### ER-34 — Historical build-package recovery
Repositories, ZIPs, source bundles, manifests, checksums, deployment IDs, and database migrations referenced by history should be linked to the relevant project lineage when recoverable.

### ER-35 — Project resurrection workflow
A forgotten but legitimate project can move from RECOVERED CANDIDATE to canonical project only through the normal owner-governed project lifecycle.

### ER-36 — Recovery completeness report
Every recovery/import must end with a machine-readable report covering processed conversations/messages, unresolved conflicts, candidate projects, missing artifacts, merged/superseded identities, and remaining unknowns.

## Historical lessons / Improvement system

James explicitly wants historical build failures to improve Command Center, but the actual retrospective improvement process should run only after the rebuilt Command Center is fully operational and can reason over verified current architecture.

The infrastructure for that future process must exist from the beginning.

### ER-37 — Build-history lesson registry
Command Center must maintain evidence-backed lessons from previous projects/builds.

### ER-38 — Failure-class taxonomy
The lesson system must support failure classes including scope drift, architecture drift, patch stacking, state loss, stale-cache/update failures, false completion claims, wrong sequencing, insufficient extensibility, owner-gate mistakes, tool/provider failure, handoff friction, lost artifacts, duplicate projects, project rename confusion, and unverified live state.

### ER-39 — Positive-pattern registry
It must also preserve successful patterns, not only failures.

### ER-40 — Evidence-required lesson promotion
A lesson must cite the project/run/build evidence that produced it; repeated assistant opinion alone is insufficient.

### ER-41 — Post-operational retrospective gate
The exhaustive beginning-to-end retrospective across historical projects is queued until Command Center is fully operational and verified, matching James's instruction.

### ER-42 — Improvement proposal, not self-mutation
Historical lessons may generate improvement proposals; they do not permit the Agency to silently rewrite protected architecture or policy.

### ER-43 — Regression-to-lesson linkage
If a future failure repeats a known lesson, Command Center should identify the recurrence and surface the missing/failed control.

### ER-44 — Lesson expiration/revalidation
Lessons dependent on provider behavior, law, platform rules, or architecture versions must be revalidated when conditions change.

## Project lineage and drift prevention

### ER-45 — Mission lineage
Every project must retain original mission, major mission changes, owner-approved pivots, and current mission.

### ER-46 — Scope-drift detection
Brain/Foundry must detect when implementation is moving materially away from the owner-approved mission and surface the divergence before it becomes a different product accidentally.

### ER-47 — 'New project' duplicate guard
Before recommending or creating a new project, Foundry must compare the proposed mission against existing/paused/superseded projects to avoid recreating an owner's original idea under a new name.

### ER-48 — Rename is not recreation
An owner-approved rename must preserve project identity, history, evidence, assets, and lineage.

### ER-49 — Clean rebuild versus project replacement
A clean rebuild of implementation does not automatically create a new project identity; the mission/project lineage survives while the software implementation can be replaced from scratch.

### ER-50 — Historical comparison view
James must be able to ask how a project changed from its original mission to the current mission and see the evidence-backed timeline.

## Automation and continuation recovery

### ER-51 — Conditional-resume lineage
Historical project automations such as external-reply watchers must be attached to the project/workflow they serve rather than becoming orphan automation records.

### ER-52 — Resume from verified checkpoint
A recovered automation or Agency job resumes only from a verified current checkpoint, never merely from the latest chat sentence.

### ER-53 — Boundary persistence
A job waiting for owner/login/provider action must retain its exact boundary and automatically become eligible to continue after the boundary is cleared, without forcing James to reconstruct context.

### ER-54 — No chat-session dependency
Long-running project state and execution eligibility must not depend on one specific chat session remaining alive.

## Recovered project candidate requiring canonical review

The export recovery surfaced **Morgan Shield / Morgan Privacy Vault** as substantive historical build work that is not represented by the same name in the current project registry.

Recovered evidence describes a personal-only privacy/spam-defense system with:

- Android call-screening behavior;
- Quiet and Strict unknown-caller modes;
- allow/block rules and call-decision history;
- encrypted local privacy/alias tracking;
- no-Internet local-vault design;
- a generated Android source package;
- a standalone encrypted privacy-vault artifact;
- a free build path toward an APK.

This remains a **RECOVERED PROJECT CANDIDATE** until canonical project-registry reconciliation determines whether James wants it restored, merged into a broader personal-security capability, or kept historical. Recovery does not authorize activation.

## Known lineage correction from export

The export also contains a strong architecture lesson around VeloClip: a later proposal attempted to create a separate autonomous-media-company project after VeloClip had drifted toward SaaS, and the historical discussion subsequently corrected that move by recognizing that the proposed 'new' project was substantially the original VeloClip mission. Command Center must therefore treat duplicate-project prevention and mission-lineage comparison as first-class Foundry behavior.

## Category impact

Primary impact:

- **C0** — historical source authority, import/reconciliation and Spec Lock evidence;
- **C1** — IDs, lineage, rule/decision/artifact/checkpoint ledgers;
- **C3** — canonical knowledge, provenance, import/export, privacy classification;
- **C5** — project discovery, rename/merge/supersession, checkpoint/project recovery;
- **C6** — Brain memory, conflict resolution, referent/history reasoning;
- **C7** — durable execution/boundary recovery independent of chat sessions;
- **C8** — automation/Needs Me continuation lineage;
- **C12** — recovered specialist/personal project classification;
- **C13** — build-history lessons, improvement evidence, drift analytics;
- **C14** — migration/recovery/portability and long-horizon history;
- **C15** — import/recovery completeness, privacy, provenance, lineage, and regression acceptance.

## Final acceptance obligations for this subsystem

Category 15 must prove at minimum:

1. a representative historical export can be ingested without topic filtering;
2. every conversation in the fixture is inventoried;
3. project-folder and standalone project candidates are both discovered;
4. renamed/merged/superseded project lineage is preserved without duplicates;
5. a newer owner decision wins over an older conflicting one;
6. mutable external state is not trusted from stale chat when live verification exists;
7. private content does not leak into project/repository context;
8. missing original artifacts remain explicitly missing/reconstruction-required rather than fabricated;
9. historical project candidates cannot self-activate;
10. recovered boundaries/checkpoints survive chat/session loss;
11. scope-drift and duplicate-project tests catch the VeloClip-style failure pattern;
12. the recovery produces a complete evidence/provenance report.

No final canonical requirement count is assigned by this document. Every ER control must be reconciled against the 5,825 baseline and the current 390-control Agency/Foundry review inventory before new canonical IDs are assigned.
