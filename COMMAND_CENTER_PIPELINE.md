# Command Center Capability Pipeline

Status: **current capability map for the clean-room Command Center rebuild**

This file no longer represents Project Brain, Automation, Integrations, Analytics, or Agent as hypothetical `0%` future lanes. Those capabilities already have real standards, data models, and/or verified implementation history. The authoritative V7 rebuild is reimplementing their user-facing and execution paths from scratch under `COMMAND_CENTER_CLEAN_REBUILD_STANDARD.md` rather than treating them as future placeholders.

## Rules

- Never display a capability percentage unless a current verified scope definition supports it.
- Missing, stale, or unverified capability progress is `N/A`, not `0%` and not a recycled historical percentage.
- Capability presence and capability completion are different facts.
- Existing verified business/project data may be preserved, but legacy Command Center implementation code is not reused by the authoritative V7 runtime.
- Every visible capability must have real current behavior, a truthful blocked/unavailable state, or remain hidden until implemented.
- Internal checkpoint/source/reconciliation plumbing stays out of the normal owner interface unless James explicitly opens an Advanced/admin path.

## Current core capabilities

### Project Brain
Current capability domain: durable project context, memories, plans, brainstorms, task/planner state, source truth, recovery context, roadmaps, and handoff preparation.

Authoritative V7 requirement: rebuild the Brain surface and its data/actions on the clean-room stack. Do not surface stale raw source metadata or internal checkpoint plumbing in normal screens.

### Automation
Current capability domain: scheduled work, condition watches, notifications, completion state, pause/disable controls, and owner-visible automation status.

Authoritative V7 requirement: expose only real automations and their true state. AUTO for Agent is a separate owner execution gate and must default/fail closed to OFF.

### Integrations
Current capability domain: verified connected-service state, provider/source health, missing-connection state, and authorized data paths.

Authoritative V7 requirement: show useful connection status without exposing secrets or backend plumbing. Missing/unverified integrations must stay truthful.

### Analytics
Current capability domain: verified KPIs, progress, revenue, source freshness, project/portfolio performance, time-series/trends where supported, goals, and anomaly detection.

Authoritative V7 requirement: no invented values. Verified zero is shown as zero; unavailable or stale data is `N/A`.

### Agent
Current capability domain: owner-controlled execution with AUTO, project scope, bounded runs/tasks, checkpoints, approvals, pause/resume/stop, Work boundaries, evidence, retry/circuit-breaker behavior, and runner truth.

Authoritative V7 requirement: the Agent is being rebuilt end-to-end on the clean `cc7_` model. A control is not considered functional unless the full chain is verified: owner input → authenticated state change → runner claim → real execution → evidence → durable result → truthful UI reflection.

Required owner controls include:
1. Auto
2. Next Step
3. Until Work / Next Work Boundary
4. Manual Task
5. Project Checkpoint
6. Stop Agent

Pause/resume and exact-step approval behavior remains part of the current requirement set.

## Context-specific capability domains

### Publishing / Books / KDP
Current capability domain includes project/book detail, series state, format/publication state, KDP Select state, review/approval workflow, rollout sequencing, performance snapshots, and tracking integrations where verified.

### Commerce Operations
Current capability domain includes catalog, sourcing, pricing, margin, inventory/order readiness, fulfillment, and related verified metrics/integrations where supported.

### Content Engine
Current capability domain includes media/content project status, capture/generation/editing/publishing workflow state, scheduling, and performance feedback where supported.

## User-facing principle

Command Center should show decisions, status, money, progress, owner controls, next actions, blockers, and useful verified performance. It should not expose raw JSON, private checkpoint plumbing, source-recovery mechanics, internal IDs, or implementation diagnostics in the normal mobile interface.
