# Command Center — Authoritative V7 Product Roadmap

Status: **AUTHORITATIVE CURRENT ROADMAP**

This is the controlling V7 product/behavior roadmap. James Morgan’s newest explicit instructions override older conflicting wording. The approved screenshots recorded in `COMMAND_CENTER_APPROVED_VISUAL_SPEC.md` remain literal visual specifications. `COMMAND_CENTER_CLEAN_REBUILD_STANDARD.md` controls clean-room construction and protected Books QC rules.

## 1. Product purpose and global truth rules

Command Center is James Morgan’s private owner-controlled control plane for projects, progress, priorities, verified performance, project memory, automation, integrations, analytics, security, deployment, and Agent execution.

Locked rules:

- V7 is clean-room only. V4/V5/V6 and legacy Agent/runtime code are reference evidence only, never runtime/build material.
- Normal Chat is the default execution brain.
- $0/free-first. No purchases, subscriptions, trials, paid APIs, ads, credits, usage billing, or paid infrastructure without exact authorization.
- No protected public/account action is implied by a general Agent mode. Publishing, deployment, merge, communications, legal acceptance, security changes, and spending keep their own authorization boundaries.
- No invented percentages, revenue, completion, publication state, integrations, approvals, Work availability, or model execution.
- Verified zero is zero. Missing/unverified data is `N/A` or another truthful defined state.
- One project executes at a time. Portfolio-wide Agent work is sequential, never parallel or interleaved.
- Approved/protected assets remain exact unless James explicitly reopens them.
- Raw IDs, JSON, checkpoint plumbing, source metadata, private KPIs, and other backend internals stay out of normal owner UI.

## 2. Mobile/PWA experience

The visual language is near-black, orange/gold sci-fi machinery, clipped/angular cards, glowing white titles, muted blue-gray support text, integrated atmospheric art, semantic status pills, large orange/gold chevrons, and dense phone-first hierarchy.

Required behavior:

- portrait-first installed PWA;
- pinch zoom locked while native vertical scrolling remains intact;
- no horizontal overflow;
- black Android/system surfaces;
- safe-area spacing;
- physical/browser Back traverses app history deepest-first;
- per-screen scroll restoration owned once by V7 routing;
- stale service-worker caches replaced cleanly;
- offline mode never presents stale live data as current;
- exact approved launcher artwork remains protected.

### 2.1 Global Refresh

Global Refresh is a read/reconcile utility, not an execution control.

It must:

- reread clean V7 projects, metrics, modules, Agent state, and current screen data;
- stay on the current route;
- preserve current scroll position;
- avoid page reload when the in-app V7 data path is available;
- never create a run, checkpoint, Work request, source sync, or project execution;
- never change Agent Auto or To Work Barriers;
- never impersonate KDP/provider ingestion. Source sync is separate.

Pull/swipe-to-refresh is not reintroduced.

## 3. Home

Home uses a uniform two-column card system.

Top row:

1. **Agent Auto**
2. **To Work Barriers**

Then:

- Projects | Next Up
- Agent | Revenue
- Brain | Automation
- Integrations | Analytics
- Security | Deployment
- Active / Live | About / Advanced

The two Agent-mode cards are equal visual peers to the rest of the grid, show truthful ON/OFF state, and are mutually exclusive.

### 3.1 Home Agent status/progress

When a run exists, the Home Agent card shows where verified:

- exact current project;
- current task or exact next action;
- truthful run state;
- Agent-run progress percentage.

Agent-run progress is separate from project-scope progress. It is based only on durable planned tasks: verified completed tasks divided by the current trustworthy planned task count. It never rises because time passed. If the denominator is not trustworthy, show `N/A`. If verified scope expands and tasks are added, the percentage may truthfully decrease.

For To Work Barriers, Home also shows the locked current project and reviewed/parked project count. That is a count, not a substitute percentage.

## 4. Projects / Portfolio Overview

Projects follows the approved screenshot literally:

- title/subtitle;
- portfolio summary card;
- truthful project count/status mix;
- integrated landscape artwork;
- project rows with machinery icon, title, stage, status pill, artwork, verified-scope ring where available, fraction/detail, chevron.

Rules:

- tapping a project opens Project Details;
- summary chevron opens Portfolio Overview;
- unverified scope is `N/A` / `Scope unavailable`;
- no screenshot sample percentage enters production data.

Portfolio Overview shows verified portfolio state only: project count, Active/Live count, attention count, verified scope coverage, verified revenue, tracked integrations, status mix, projects needing attention, and recent verified activity.

## 5. Active / Live

Distinct approved screen. Each row contains machinery icon, title, semantic pill, exact next action, divider, large Scope value, secondary verified live/sync information, integrated art, and chevron. No circular progress rings. Chevron opens Project Details.

## 6. Next Up

Approved priority-queue screen with compact rows: machinery icon, title, semantic pill, exact next action, integrated artwork, chevron. No progress rings. Priority comes from verified state/attention rules, never invented ranking.

## 7. Revenue

- verified portfolio revenue only;
- project-level verified revenue;
- `$0.00` when verified zero;
- `N/A` when missing/unverified;
- test orders/transactions never count as real revenue;
- project rows open Project Details;
- revenue summary chevron opens Analytics.

## 8. Project Details

Every project has a clean V7 detail screen. Hero chevron opens Project Snapshot.

Generic detail supports, where real data exists:

- identity/status hero;
- verified scope;
- verified revenue;
- integration state;
- exact next action;
- blocker/integrity state;
- verification summary;
- Tracking Integrations;
- exact-project Agent Controls.

Informational rows are not fake buttons.

### 8.1 Project Snapshot

Shows only verified selected-project state: status, scope, revenue, integrations, exact next action, blocker/integrity, verification summary, recent activity, Tracking Integrations, and project-scoped Agent entry. No raw backend plumbing.

### 8.2 The Missing Hour Saga detail

The approved screenshot plus James’s newer cover instruction controls this screen.

Required:

- approved hero composition;
- KDP PERFORMANCE 3×2 phone grid;
- five exact approved series covers in one row at approved reference geometry;
- cover artwork completely unobstructed;
- `BOOK 1` through `BOOK 5` outside the artwork;
- exact title under/with each external book label;
- no badge, number, overlay, tint, synthetic art, redraw, or replacement covering approved cover bytes;
- publication status for Kindle eBook, KDP Select, Paperback, Hardcover;
- real KDP Snapshot History screen;
- real Tracking Integrations screen;
- exact next action;
- project-scoped Agent controls.

Publication truth:

- file existence ≠ approval;
- approval ≠ publication;
- publication requires verified evidence;
- screenshot sample metrics never become production facts.

## 9. Agent owner controls

Visible controls:

- Agent Auto;
- To Work Barriers;
- Next Step;
- Until Work / Next Work Boundary;
- Manual Task;
- Project Checkpoint;
- Stop Agent;
- context-dependent Pause/Resume/Refresh;
- exact Work approval;
- Retry Luna High when eligible;
- Retry Sol Light when eligible;
- exact Sol Medium approval when required;
- decline approval.

There is no generic global Start Work toggle.

### 9.1 Automatic-mode gate

Agent Auto and To Work Barriers are mutually exclusive. Enabling one atomically turns the other OFF. Both default OFF.

**Automatic modes OFF means no autonomous project selection or autonomous portfolio execution.**

When both modes are OFF and there is no explicit owner-dispatched bounded run:

- the scheduler may wake only to read the gate;
- zero Agent execution occurs;
- no run/task is created or claimed;
- no runner heartbeat is written;
- no Agent notification is emitted.

When both modes are OFF but James explicitly presses **Next Step**, **Until Work / Next Work Boundary**, or **Manual Task**, that creates one bounded owner-dispatched run. The runner may execute only that exact run even though automatic modes remain OFF.

For an explicit owner-dispatched run with automatic modes OFF:

- project/objective/control mode remain hard-locked;
- it may not select another project afterward;
- it may not create unrelated work;
- heartbeat is allowed only while that explicit run is eligible/being processed;
- completion, parking, stop, blocker, or needs-owner state ends that execution path unless James explicitly resumes or dispatches another run.

Project Checkpoint is direct/read-only and never needs the background runner.

A control-row update alone can never display Working. Working requires a real runner claim/execution state.

### 9.2 Agent Auto

Regular unattended mode.

- one project/run at a time;
- fresh controls/run reread before every new task and immediately before every external side effect;
- autonomous project selection stops when Auto turns OFF;
- an already-existing explicit owner-dispatched bounded run is not autonomous and may continue within its exact scope while Auto is OFF unless paused/stopped or it reaches its defined boundary;
- Work is allowed only through the exact ladder below;
- Auto ON is never blanket Work/spending/publishing/deployment/merge/communication/legal/security permission.

### 9.3 To Work Barriers

Sequential portfolio sweep.

For each eligible project:

1. lock exactly one project;
2. recover/reconcile current authoritative state;
3. perform all safe normal-chat-capable work;
4. stop at the first genuine Work-only boundary;
5. checkpoint and park it;
6. move to the next eligible project.

Rules:

- never two projects at once;
- never enter Work, even if a Work approval already exists;
- never mix files/pages/rules/evidence between projects;
- verified ready/complete projects are reconciled/parked without unnecessary rework;
- needs-owner/blocked projects are checkpointed and skipped so the sweep can continue;
- completed/skipped project IDs are persisted;
- current sweep project is persisted;
- after every eligible project is reviewed/parked, To Work Barriers turns itself OFF and preserves its result.

### 9.4 Next Step

- owner-triggered bounded run;
- can execute with both automatic modes OFF because James explicitly dispatched it;
- exactly one verified next action;
- remains queued until actually claimed;
- after completion/parking/stopping with automatic modes OFF, runner does not choose another project.

### 9.5 Until Work / Next Work Boundary

- owner-triggered bounded run;
- can execute with both automatic modes OFF;
- performs normal-chat-capable work only;
- stops at first genuine Work-only boundary;
- creates one exact Work approval request there;
- **never enters Work for that run**, even if Agent Auto is ON or approval later exists;
- after parking, automatic modes OFF means no next-project selection.

### 9.6 Manual Task

- owner supplies one exact objective;
- can execute with both automatic modes OFF;
- hard-locked to exact project/objective;
- Books/KDP requires exact Books target;
- same Work ladder applies if the task legitimately reaches Work and is not an Until Work run;
- after completion/parking/stopping with automatic modes OFF, no autonomous follow-on project.

### 9.7 Project Checkpoint

Immediate direct status-only operation:

- works with automatic modes OFF or ON;
- no project side effects;
- no Books target required;
- no hourly-runner wait;
- selected project or whole portfolio;
- snapshots current clean V7 project/metric/integration/activity state;
- writes completed checkpoint audit record;
- leaves unrelated active run intact;
- UI shows Checking → Complete.

### 9.8 Pause / Resume / Stop

Pause stops before the next unstarted action and preserves verified work. Resume is owner-controlled and terminal/stopped runs cannot resume.

Stop is atomic: marks run stopped, stops unstarted tasks, preserves verified work, records stop evidence/checkpoint, and clears active-run pointer where appropriate. It does not rely on the hourly runner to eventually notice.

### 9.9 Agent Refresh

Read-only clean Agent-state reload. No work creation/execution and no automatic-mode changes.

### 9.10 Work ladder

Work is capability-bound, not convenience-bound. Normal Chat performs everything it can first.

For Agent Auto and eligible manually selected runs:

**Normal Chat → genuine Work boundary → exact owner Approve Work for that exact task → GPT-6 Luna High → at most one automatic transient retry → GPT-6.1 Sol Light only after genuine capability/complexity failure → at most one automatic transient retry → STOP; GPT-6.1 Sol Medium requires a separate exact owner approval.**

Locked rules:

- approval applies only to exact bounded Work task;
- Luna High always first;
- one Luna High automatic retry maximum, transient provider/network/browser/connection only;
- reconcile downstream state before retry so a side effect cannot duplicate;
- provider/connection failure never triggers model escalation;
- genuine `capability_insufficient` or `execution_complexity` may escalate Luna High → Sol Light without another approval for same task;
- one Sol Light transient automatic retry maximum after reconciliation;
- genuine Sol Light capability/complexity failure creates exact Sol Medium approval and stops;
- Sol Medium never auto-starts and never auto-retries;
- Sol Medium is absolute ceiling;
- Astra prohibited;
- Work approval never authorizes spending, paid credits/subscriptions, or unrelated protected actions;
- Until Work runs never enter Work.

### 9.11 Manual Work retry

After a Luna High or Sol Light transient failure exhausts its one automatic retry, the owner may request:

- Retry Luna High;
- Retry Sol Light.

Only for the same already-approved exact task. Downstream state must be reconciled first. Scope cannot broaden. Connectivity failure does not require reapproving the exact Work task. There is no Retry Sol Medium path.

## 10. Agent status/progress/readiness truth

Recognized states:

- Idle;
- Queued;
- Working;
- Paused;
- Needs Owner;
- Work Boundary;
- Blocked;
- Completed;
- Stopped;
- Failed.

UI may show where verified: selected/current project, objective, current/next task, run progress, verified step count, latest checkpoint, runner health, active automatic mode, barrier-sweep current project/count, owner action, pending approval.

Hard invariant: one project at a time; no evidence/rules/files reused across projects.

Durable readiness states (`PUBLISH READY`, `DEPLOY READY`, `LAUNCH READY`, `WORK BOUNDARY`, `NEEDS OWNER`, `BLOCKED`, `COMPLETE`, `RECHECK REQUIRED`) require evidence. Preserve authoritative artifacts/file identifiers, checksums where available, QC checkpoint, verification time, and exact next protected boundary. Material changes force truthful recheck; no-change runs preserve approved work instead of redoing it.

## 11. Books Agent standard

Normal Chat does all writing, rewriting, humanization, developmental editing, line editing, continuity, expansion/compression, repetition cleanup, artwork/interior/package production, formatting, metadata, and QC it can. Work remains for genuine publishing/account/browser-bound steps unless James explicitly changes that rule.

Before touching an unpublished book, recover the authoritative manuscript/interior, exact approved cover, title/author/series metadata, locked decisions, prior QC, package files, and newest checkpoint. Do not recreate approved work merely because recovery takes effort.

Prose production uses multi-pass structure/development, humanization/voice, character/dialogue where applicable, expansion/compression, continuity, repetition, line editing, cold final read, package/metadata QC, final verification.

Coloring-book and cookbook hard standards in `COMMAND_CENTER_CLEAN_REBUILD_STANDARD.md` are controlling:

- every coloring page must match approved title/cover theme, be human-colorable, medium difficulty, print-suitable, consistent, individually QC-classified, and all failures corrected/rechecked before PUBLISH READY;
- first approved cookbook is the locked layout benchmark; later cookbook approved spine color becomes recurring banner color; every recipe must match theme; every photo must depict actual recipe; ingredients/quantities/method/timing/temperature/yield/finished dish must be coherent before PUBLISH READY.

## 12. Brain / Automation / Integrations / Analytics / Security / Deployment

### Brain

Durable project context, owner-locked rules, memories/context, brainstorms, plans, tasks, handoff builder, roadmaps, source truth/recovery context. Normal UI surfaces useful owner decisions, not raw plumbing.

### Automation

Schedules, condition watches, notifications, active/paused/disabled/completed state, truthful next scheduled behavior, no autonomous spending. Agent automatic modes are distinct from general automations. UI must not imply continuous real-time background execution when scheduler cadence is hourly.

### Integrations

Provider/service state, freshness, missing connection state, authorization need, project Tracking Integrations drill-down. No secrets/credentials in UI.

### Analytics

Verified KPIs, scope progress, revenue, project/portfolio performance, freshness, real trends, goals/anomalies where supported. Never infer missing metrics.

### Security

Owner access, permission envelopes, protected boundaries, pending approvals, Work/Sol approvals, alerts, fail-closed defaults. Client owner RPCs reject unauthenticated use and are not anonymously executable.

### Deployment

Release state, QA, hosting/deployment state, verified production SHA, rollback/recovery, release checks. Never claim deployment without provider evidence.

## 13. Visible-control contract

Every visible interactive control must:

1. have a real handler;
2. reach clean V7 data/action path only;
3. have a defined success state;
4. show errors truthfully;
5. explain unavailable/disabled state;
6. never exist as fake decorative interaction;
7. keep Refresh/Checkpoint/navigation out of background execution;
8. use chevrons only for real navigation;
9. make approved screenshot chevrons real where shown;
10. keep Agent Auto and To Work Barriers mutually exclusive;
11. keep retry controls within the same exact approved task.

## 14. Data/progress truth

- `current_scope_progress_percent` displays only from current verified V7 metric.
- No historical fallback percentages.
- Scope expansion may truthfully lower percentage.
- Project state, project-scope percentage, Agent-run percentage, and barrier-sweep count are separate concepts.
- If Agent run denominator is not trustworthy, show `N/A`.
- Hardcoded screenshot sample values never leak into production.

## 15. Clean-room implementation boundary

Allowed source truth:

- newest owner instructions;
- approved screenshots;
- approved launcher art;
- exact approved/protected assets such as approved book covers;
- current global/project rules;
- verified project/business data;
- verified factual historical evidence.

Forbidden runtime building material:

- old renderer/app shell/CSS/bootstrap;
- old Agent implementation;
- legacy runner RPCs/tables;
- competing service-worker stacks.

Exact approved historical asset bytes may be recovered without reusing the legacy runtime that once displayed them.

## 16. QA/release sequence

1. Clean-room architecture isolation.
2. Home/global shell.
3. Projects/Portfolio Overview.
4. Active / Live.
5. Next Up.
6. Revenue/Analytics drill-down.
7. Generic Project Details/Project Snapshot.
8. Missing Hour detail with exact covers, KDP history, Tracking Integrations.
9. Agent owner controls and mutually exclusive automatic modes.
10. Sequential To Work Barriers and truthful Home Agent status/progress.
11. Work ladder and bounded/manual retries.
12. Brain/Automation/Integrations/Analytics/Security/Deployment.
13. Android/PWA navigation, Back, scroll restoration, safe areas, offline/update, global Refresh.
14. Visible-button/chevron audit.
15. Data/progress truth audit.
16. Security advisor review for new backend functions/privileges.
17. Screenshot visual QA at approved 864×1536 reference geometry.
18. Complete every-file repository audit.
19. Fix defects.
20. Repeat complete every-file audit.
21. Pre-merge QA.
22. Pull request.
23. Production merge only after fresh exact owner merge authorization.
24. Pages deployment verification.
25. Production SHA verification.
26. Physical Android owner inspection.
27. Owner cache/site-data cleanup and reinstall if required after production verification.

## 17. Definition of done

Automated green tests alone are insufficient.

Completion requires:

- approved screenshot screens reproduce approved visual system closely enough for physical-phone owner acceptance;
- all intended screens/drill-downs reachable;
- all visible controls/chevrons real;
- exact Missing Hour approved covers unobstructed with external book labels;
- Agent Auto and To Work Barriers mutually exclusive and default OFF;
- automatic modes OFF produce zero autonomous work;
- explicit owner-dispatched Next Step / Until Work / Manual Task can execute while automatic modes remain OFF but cannot trigger autonomous follow-on work;
- To Work Barriers is one-project-at-a-time, never enters Work, parks projects durably, turns itself OFF at sweep completion;
- Home Agent shows actual project/task/state and truthful run percentage or N/A;
- Project Checkpoint immediate/read-only;
- Stop atomic;
- queued controls stay queued until claimed;
- Work ladder begins Luna High and obeys bounded retry/escalation; Sol Medium never auto-starts/retries;
- readiness evidence-backed and material changes cause recheck;
- progress/revenue/publication/integration truth preserved;
- Android Back/scroll correct;
- global Refresh in-app, route/scroll preserving, execution-free;
- PWA/cache/offline correct;
- approved launcher exact;
- owner RPCs not anonymously executable;
- final every-file audit has no unknown/unclassified implementation file and only approved V7 authority;
- deployed production SHA verified;
- final physical-phone visual acceptance by James.
