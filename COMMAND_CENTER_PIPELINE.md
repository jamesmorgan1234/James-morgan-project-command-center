# Command Center Capability Pipeline

Command Center V4 exposes future capability lanes now so they can be selected and built one at a time later without redesigning the project control room.

## Rules

- A visible `0%` means the capability is intentionally planned but not started.
- Pipeline percentages do **not** count toward a project's verified current-scope progress until that capability is formally activated and given a defensible completion definition.
- Never invent a non-zero completion value.
- Existing backend/private tracking may support a capability without being shown in the normal user interface.
- Each capability button must retain a short plan describing what it is intended to become.
- Capabilities are modular. Building one does not require building the rest.

## Core lanes

### Project Brain — 0%
Planned project-specific intelligence layer for reusable context, goals, rules, decisions, notes, brainstorms, blockers, next actions, history, and prompt/context packaging. Later phases may connect model reasoning, but V4 does not add paid model/API usage or autonomous actions.

### Automation — 0%
Planned orchestration layer for recurring checks, scheduled jobs, event/condition triggers, queues, retries, and verified handoffs between supported project systems.

### Integrations — 0%
Planned capability layer for connecting authorized project services and exposing only useful connection state to the user while keeping credentials, reconciliation mechanics, and source plumbing hidden.

### Analytics — 0%
Planned decision layer that turns verified project data into useful trends, alerts, comparisons, and recommended areas to inspect without duplicating raw metrics throughout the UI.

### Agent Mode — 0%
Long-term controlled execution layer. It will only be activated after the Project Brain, planning, permission, action, verification, and audit foundations exist. V4 does not claim autonomous-agent capability.

## Context-specific lanes

### Publishing — 0% (book/KDP projects)
Future workflow tooling for publication readiness, format state, KDP Select state, submission sequencing, and publication verification.

### Commerce Operations — 0% (store/commerce projects)
Future workflow tooling for catalog, sourcing, order, pricing, margin, fulfillment, and merchandising actions.

### Content Engine — 0% (media/content projects)
Future workflow tooling for capture, generation/editing, publishing, scheduling, and performance feedback loops.

## User-facing principle

Show decisions, status, money, progress, and actions. Keep internal checkpoint mechanics, reconciliation details, private KPIs, source metadata, and other backend plumbing available to the system but out of the normal interface unless the user explicitly needs it.
