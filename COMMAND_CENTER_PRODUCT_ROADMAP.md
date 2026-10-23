# Command Center — Authoritative V7 Product Roadmap

Status: **AUTHORITATIVE CURRENT ROADMAP**

This roadmap is the single product/behavior checklist for the clean-room Command Center V7 rebuild. It replaces older roadmap wording where conflicts exist. The approved screenshots recorded in `COMMAND_CENTER_APPROVED_VISUAL_SPEC.md` are literal visual specifications. This roadmap controls product behavior, owner controls, data truth, navigation, execution, and completion criteria.

## 1. Product purpose

Command Center is James Morgan's private owner-controlled control plane for projects, progress, priorities, verified performance, project memory, automation, integrations, analytics, security, deployment, and Agent execution.

Core rules:

- Clean-room V7 implementation only. Do not use V4/V5/V6/approved legacy UI or Agent implementation as runtime building material.
- Normal Chat is the default execution brain.
- Both automatic Agent modes default and fail closed to OFF.
- When both **Agent Auto** and **To Work Barriers** are OFF, background Agent execution is zero and the background runner writes no heartbeat.
- Automatic Agent modes are mutually exclusive. They may never both be ON.
- One project executes at a time. Portfolio-wide Agent behavior is sequential, never parallel or interleaved.
- No purchases, subscriptions, trials, paid APIs, ads, credits, usage billing, or paid infrastructure without exact owner authorization.
- No public publishing, deployment, merge, communication, legal acceptance, account-security change, or other protected side effect without the applicable authorization boundary.
- No invented percentages, revenue, progress, publication status, integrations, permissions, completion, Work availability, or model execution.
- Verified zero is shown as zero. Missing or unverified data is shown as `N/A` or another truthful defined state.
- Internal IDs, raw JSON, source plumbing, private checkpoint mechanics, and backend diagnostics remain out of the normal owner UI.
- Approved/protected assets remain exact unless James explicitly reopens them.

## 2. Global mobile experience

The approved screenshots define the visual system:

- near-black sci-fi control-surface background;
- orange/gold illuminated clipped geometry;
- compact dense mobile spacing;
- glowing octagonal/circular icon machinery;
- integrated project artwork inside cards;
- white glowing primary titles and blue-gray supporting text;
- semantic status pills with luminous dots;
- large orange/gold chevrons;
- no generic admin-panel appearance;
- no excessive rounded cards or dead space.

Mobile behavior requirements:

- portrait-first installed-PWA experience;
- viewport locked against pinch zoom;
- native vertical scrolling preserved;
- no horizontal overflow;
- Android/system surfaces remain black;
- safe-area spacing preserved;
- browser/physical Back traverses the app history deepest-first;
- per-screen scroll position is restored exactly once by the V7 router;
- service-worker updates must replace stale V7 caches cleanly;
- offline mode must never present stale live data as current;
- approved launcher artwork remains exact and protected.

### 2.1 Global Refresh

A global owner Refresh control is available without reintroducing pull/swipe-to-refresh.

Required behavior:

- rereads current clean V7 state only;
- does not create a run, checkpoint, Work request, source sync, or any project execution;
- never turns on either Agent automatic mode;
- preserves the current route and scroll position;
- may visibly indicate refresh activity;
- KDP/provider/source ingestion remains a separate action and must never be fabricated by Refresh.

## 3. Home

Home uses a uniform two-column card system. The first row is reserved for the two Agent operating modes:

1. **Agent Auto** — regular unattended Agent mode.
2. **To Work Barriers** — sequential portfolio sweep that advances each eligible project through normal-chat-safe work to its next genuine Work-only boundary and parks it there.

These two mode cards:

- are equal visual peers to the rest of the Home card system;
- are mutually exclusive;
- show truthful ON/OFF state;
- may use stronger glow/indicator treatment when active;
- never imply execution merely because a mode is armed.

The primary Home navigation then contains:

- **Projects** — complete tracked portfolio;
- **Next Up** — current priority/action queue;
- **Agent** — owner-controlled Agent execution surface;
- **Revenue** — verified revenue only;
- Brain;
- Automation;
- Integrations;
- Analytics;
- Security;
- Deployment;
- Active / Live;
- About / Advanced.

### 3.1 Home Agent card truth

When an Agent run exists, the Home **Agent** card must show, where verified:

- exact current project;
- current task or exact next action;
- truthful run state;
- Agent-run progress percentage.

Agent-run progress is separate from project-scope progress. It is derived only from durable planned run tasks: verified completed tasks divided by the current trustworthy planned task count. It never advances because time passed. If a trustworthy denominator does not exist, Home shows `N/A` rather than inventing a percentage. If verified scope expands and planned tasks are added, the run percentage may truthfully decrease.

State presentation includes:

- Working → project + task + verified run percentage where available;
- Work Boundary → waiting for exact Work approval;
- Needs Owner → owner action required;
- Paused → paused state and retained verified run progress;
- Completed → verified complete;
- Idle → normal Agent state.

For **To Work Barriers**, Home also surfaces the currently locked project and portfolio sweep progress such as reviewed/parked project count. That count is a project-count status, not a fabricated percentage.

## 4. Projects screen

Visual source: approved `Projects` screenshot.

Required structure:

- title `Projects`;
- subtitle `Full portfolio of tracked projects`;
- full-width portfolio summary card;
- large project count;
- truthful portfolio status breakdown;
- integrated landscape artwork;
- project rows with left machinery icon, project title, subtitle/stage, status pill, integrated artwork, compact circular verified-scope ring where data is verified, fraction/detail beneath, and outer chevron.

Behavior:

- tapping a project opens Project Details;
- the portfolio-summary chevron is real and opens **Portfolio Overview**;
- no progress ring may display a guessed or stale percentage;
- unverified scope displays `N/A` / `Scope unavailable`;
- project count and status mix come from current clean V7 data.

### 4.1 Portfolio Overview

Portfolio Overview is the real destination behind the Projects summary card shown with a chevron.

It presents verified clean V7 portfolio state only, including where available:

- tracked project count;
- Active / Live count;
- attention count;
- verified scope-record coverage;
- verified revenue total;
- tracked integration count;
- status mix;
- projects needing attention, each linking to its Project Details;
- recent verified activity.

No portfolio value may be inferred from screenshot sample data or stale legacy baselines.

## 5. Active / Live screen

Visual source: approved `Active / Live` screenshot.

This is a distinct screen, not merely the Projects screen with rows hidden.

Each row requires:

- left machinery icon;
- title;
- semantic status pill;
- exact current next-action sentence;
- vertical divider;
- large scope value plus `Scope` label;
- secondary verified live/sync information;
- integrated artwork;
- outer chevron.

No circular progress ring is used on this screen.

The outer chevron opens the selected Project Details.

## 6. Next Up screen

Visual source: approved `Next Up` screenshot.

Required structure:

- title `Next Up`;
- subtitle `Priority queue`;
- compact priority rows;
- left machinery icon;
- title;
- semantic status pill;
- exact next-action sentence;
- integrated artwork;
- outer chevron.

No progress rings.

Priority must derive from verified project state/attention rules. Do not fabricate ranking. The row chevron opens the selected Project Details.

## 7. Revenue screen

Required behavior:

- verified portfolio revenue total only;
- project-by-project verified revenue;
- verified zero displayed as `$0.00`;
- unverified/missing revenue displayed as `N/A`;
- test orders and test transactions never count as real revenue;
- tapping a project opens its Project Details;
- the summary-card chevron is real and opens the verified **Analytics** module for deeper portfolio performance.

## 8. Project Details

All projects receive a clean V7 detail screen with truthful project-specific information.

The project hero is interactive because the approved composition includes a navigation chevron. Tapping it opens **Project Snapshot** for that exact project.

### 8.1 Generic Project Details

Required sections where supported:

- hero identity/status card;
- verified current scope;
- verified revenue;
- integration count/state;
- exact next action;
- blocker/integrity state;
- verification summary;
- real Tracking Integrations entry;
- direct Agent Controls entry for that exact project.

Rows that are only informational, such as Next Action, Blocker / Integrity, or Verification, render as informational cards rather than fake buttons or decorative chevrons.

### 8.2 Project Snapshot

Project Snapshot is the real destination behind a project hero chevron.

It presents the selected project's current verified clean V7 state, including where available:

- status;
- current verified scope;
- verified revenue;
- tracked integration count;
- exact next action;
- blocker/integrity state;
- verification summary;
- Tracking Integrations entry;
- direct Agent Controls entry;
- recent project activity.

Project Snapshot must not expose raw IDs, raw JSON, internal checkpoint plumbing, or legacy data structures.

### 8.3 The Missing Hour Saga / Books detail

Visual source: approved `The Missing Hour Saga — Project Details` screenshot, refined by James's newer explicit approved-cover instruction.

Required sections:

- hero with project/cover artwork, category kicker, title, description/stage, metadata, status pill, integrated eclipse/landscape art, chevron;
- `KDP PERFORMANCE` section with a phone 3×2 metric grid;
- `BOOKS IN SERIES` section with five exact approved covers across one row in the approved reference;
- each approved cover remains completely unobstructed;
- series labels such as `BOOK 1` are outside the approved cover art, followed by the book title;
- no number, badge, overlay, tint, redraw, replacement, or synthetic artwork may cover or alter the exact approved cover;
- `PUBLICATION STATUS` with Kindle eBook, KDP Select, Paperback, Hardcover across one row where viewport permits the approved reference geometry;
- `KDP SNAPSHOT HISTORY` row;
- `TRACKING INTEGRATIONS` row;
- exact next action;
- direct Agent Controls entry.

The approved chevron rows are functional:

- **KDP Snapshot History** opens a real V7 snapshot-history screen showing verified snapshot periods and metrics only.
- **Tracking Integrations** opens a real V7 project-integration screen showing current provider records, source mode, authorization requirement, check freshness, and next source action where recorded.
- the hero chevron opens Project Snapshot.

Books/publication truth rules:

- file existence is not approval;
- approval is not publication;
- publication must not be implied without verified evidence;
- screenshot metrics are visual examples only and never production data authority;
- approved book covers remain protected assets.

## 9. Agent — owner controls

The clean V7 Agent surface exposes these owner controls:

1. **Agent Auto** automatic mode;
2. **To Work Barriers** automatic mode;
3. **Next Step**;
4. **Until Work / Next Work Boundary**;
5. **Manual Task**;
6. **Project Checkpoint**;
7. **Stop Agent**.

Context-dependent controls additionally include:

- Pause;
- Resume;
- Refresh;
- exact Work approval;
- `Retry Luna High` for the same already-approved Work task when eligible;
- `Retry Sol Light` for the same already-approved Work task when eligible;
- exact Sol Medium approval where the Work ladder reaches that rung;
- decline approval.

There is no generic global `Start Work` toggle.

### 9.1 Automatic-mode gate

**Agent Auto** and **To Work Barriers** are mutually exclusive. Enabling either turns the other off atomically. Both default OFF.

When both are OFF:

- the background runner may wake on its scheduler only long enough to read the clean V7 control gate;
- it performs zero Agent execution;
- it creates/claims/advances zero runs or tasks;
- it writes no runner heartbeat;
- it issues no Agent notification;
- manual owner controls remain available.

A database control-row update alone cannot produce `Working`. Working requires a real runner claim/execution state.

### 9.2 Agent Auto

Agent Auto is regular unattended execution, still bounded by all owner authorization rules.

Required behavior:

- one primary project/run at a time;
- fresh control/run state reread before every new task and immediately before every external side effect;
- stopping, pausing, or turning Agent Auto OFF outranks stale runner state;
- may continue beyond normal-chat work only through the exact Work ladder in §9.11;
- Agent Auto ON is not blanket Work, spending, publishing, deployment, merge, communication, legal, or security authorization.

### 9.3 To Work Barriers

To Work Barriers is a portfolio sweep, not parallel execution.

Required behavior:

- strictly one project at a time;
- locks one current project before doing any execution;
- advances that project through all safe normal-chat-capable work until the first genuine Work-only boundary;
- writes a durable checkpoint and parks the project;
- never enters Work itself, even if a Work approval happens to exist;
- then selects the next eligible project;
- does not mix project rules, files, pages, evidence, approvals, or actions;
- projects already in a verified ready/complete state are reconciled and parked without unnecessary rework;
- a project that needs James or is genuinely blocked is checkpointed and parked as skipped/needs-owner so other eligible projects can continue;
- when every eligible project is reviewed/parked, the mode turns itself OFF and preserves the sweep result.

### 9.4 Next Step

- owner-triggered;
- creates a bounded V7 run for exactly the next verified project action;
- the run remains `queued` until the execution runner actually claims it;
- UI must never display `Working` merely because the run exists.

### 9.5 Until Work / Next Work Boundary

- owner-triggered;
- advances normal-chat-capable work within the selected project scope;
- stops at the first genuine Work-only boundary;
- creates an exact Work approval request at that boundary;
- does not enter Work automatically, even if Agent Auto is otherwise enabled.

### 9.6 Manual Task

- owner provides one exact objective;
- the run may do only that bounded objective;
- Books/KDP execution requires an exact Books target;
- the same Work ladder and retry rules apply to a manually selected project when it legitimately reaches Work.

### 9.7 Project Checkpoint

Project Checkpoint is **not background execution**.

Required behavior:

- owner-triggered immediate action;
- works with both automatic modes OFF or ON;
- does not wait for the hourly runner;
- performs no project side effects;
- does not require a Books target;
- snapshots the selected project's current clean V7 state, verified metrics, integration state, and recent activity, or the whole portfolio when no project is selected;
- writes a completed checkpoint audit record;
- leaves any unrelated active run pointer/state unchanged;
- returns the completed checkpoint to the UI immediately under normal database/network conditions.

UI states visibly communicate `Checking` / `Complete` rather than implying background work.

### 9.8 Pause / Resume

Pause:

- stops before the next unstarted action/side effect;
- preserves verified completed work;
- does not rewind already verified work.

Resume:

- resumes an eligible paused run;
- terminal/stopped runs cannot be resumed.

### 9.9 Stop Agent

- immediate atomic V7 operation;
- marks the run stopped;
- stops all unstarted tasks;
- preserves verified work;
- writes stop evidence/checkpoint;
- clears the active-run pointer when appropriate;
- must not rely on the hourly runner eventually noticing a passive flag.

### 9.10 Refresh

Agent Refresh:

- reloads clean current Agent state now;
- does not create or execute work;
- does not alter automatic-mode gates.

### 9.11 Approvals / Work ladder

Work is capability-bound, not convenience-bound. Normal chat performs all work it can first.

The exact ladder for Agent Auto and manually selected project runs is:

**Normal Chat → genuine Work boundary → exact owner `Approve Work` for that exact task → GPT-6 Luna High → at most one automatic transient retry → GPT-6.1 Sol Light only after a genuine capability/complexity failure → at most one automatic transient retry → STOP; GPT-6.1 Sol Medium requires a separate exact owner approval.**

Rules:

- initial Work approval applies only to the exact bounded task;
- Luna High is always the first Work rung;
- one Luna High automatic retry maximum, only for a genuine transient provider/network/browser/connection failure and only after downstream reconciliation confirms the previous attempt did not already succeed;
- provider/connection failure is never a capability failure and never triggers model escalation;
- genuine `capability_insufficient` or `execution_complexity` failure may escalate Luna High → Sol Light without a second owner approval for the same exact task;
- one Sol Light automatic retry maximum under the same transient-only/reconciliation rule;
- if Sol Light then fails for genuine capability/complexity reasons, create a separate exact Sol Medium approval and stop;
- Sol Medium never auto-starts, never auto-retries, and is the absolute ceiling;
- Astra is prohibited;
- never exceed Sol Medium;
- Work approval does not authorize spending, paid credits/subscriptions, unrelated Work, or any other protected boundary.

### 9.12 Manual Work retry

When the single automatic retry on Luna High or Sol Light has been exhausted because of a verified transient provider/network/browser/connection problem, the owner may use:

- **Retry Luna High**;
- **Retry Sol Light**.

These controls:

- apply only to the same already-approved exact Work task;
- do not broaden project/task scope;
- do not require reapproval merely because connectivity failed;
- require downstream reconciliation before execution to prevent duplicate side effects;
- preserve prior evidence and the exact task identity;
- are unavailable for Sol Medium.

## 10. Agent status, project locking, and progress truth

Agent UI distinguishes these states clearly:

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

The interface shows, where available:

- selected/current project;
- objective;
- current/next task;
- truthful Agent-run progress;
- verified step count;
- latest checkpoint;
- runner health;
- active automatic mode;
- To Work Barriers current project and reviewed/parked count;
- user-required action;
- pending approval.

One-project execution is a hard invariant: no two projects execute concurrently and no task evidence from one project may be reused for another.

Agent-run progress is derived only from durable planned tasks and verified task completion. If the denominator is not trustworthy, it is `N/A`. Project-scope progress remains a separate metric.

## 10.1 Durable readiness states

Readiness labels such as:

- `PUBLISH READY`;
- `DEPLOY READY`;
- `LAUNCH READY`;
- `WORK BOUNDARY`;
- `NEEDS OWNER`;
- `BLOCKED`;
- `COMPLETE`;
- `RECHECK REQUIRED`

are evidence-backed durable states rather than temporary status messages.

A readiness checkpoint should preserve available authoritative artifact/file identifiers, checksums where available, completed QC evidence, verification time, and exact next protected boundary. On later runs, the Agent first checks whether a readiness-critical input materially changed. If nothing changed, approved/verified work remains locked and is not redone merely for activity. If something material changed, affected readiness moves truthfully to `RECHECK REQUIRED` until the necessary QC is rerun.

## 10.2 Books execution standard

For unpublished Books projects, normal chat performs writing, rewriting, humanization, developmental editing, line editing, continuity, expansion/compression, repetition cleanup, artwork/interior/package production, formatting, metadata, and QC that it can. Work remains reserved for genuine publishing/account/browser-bound steps unless James explicitly changes that rule.

Before editing, the Agent recovers the authoritative current manuscript/interior, exact approved cover, title/author/series metadata, locked decisions, prior QC, package files, and newest checkpoint. It does not recreate or replace approved work because it is inconvenient to recover.

For prose books, the expected multi-pass process includes developmental/structure, humanization/voice, character/dialogue where applicable, expansion/compression, continuity, repetition, line editing, cold final read, package/metadata QC, and final verification.

The detailed locked coloring-book and cookbook standards in `COMMAND_CENTER_CLEAN_REBUILD_STANDARD.md` are controlling requirements for those book types and must be retrieved from clean Command Center Brain/project context during Agent execution.

Coloring-book hard minimum: every final page individually matches the exact approved title/cover theme, is genuinely human-colorable, passes medium difficulty, is print-suitable, and fits the book consistently before `PUBLISH READY`.

Cookbook hard minimum: the first approved cookbook remains the layout benchmark; later books preserve that page architecture, with each approved spine color becoming that title's recurring interior banner color. Every recipe must fit the approved title/cover theme, every photo must match the actual recipe, and ingredients/quantities/method/timing/temperature/yield/finished dish must be coherent before `PUBLISH READY`.

## 11. Brain

Required capability surface:

- durable project context;
- owner-locked rules and context items;
- memories/context items;
- brainstorm workspace;
- project plans;
- tasks/planner state;
- handoff builder;
- project roadmaps;
- source truth / recovery context.

Normal UI surfaces useful owner decisions and summaries, not raw source plumbing.

## 12. Automation

Required capability surface:

- schedules;
- condition watches;
- notifications;
- active/paused/disabled state;
- completion state;
- truthful next scheduled behavior;
- no autonomous spending.

Agent automatic modes are separate from general Automation schedules.

The current background Agent scheduler may run only as frequently as the platform actually supports. The UI must not imply a continuous real-time background loop if execution is scheduler-bound.

## 13. Integrations

Required capability surface:

- connected service/provider state;
- source health/freshness;
- missing connection state;
- owner authorization requirement where applicable;
- project-specific Tracking Integrations drill-down;
- no secrets or backend credentials in the UI.

## 14. Analytics

Required capability surface:

- verified KPIs;
- current scope progress;
- verified revenue;
- project/portfolio performance;
- source freshness;
- trends/time series where real data exists;
- goals and anomaly state where supported;
- Revenue summary drill-down.

Never infer missing metrics from unrelated data.

## 15. Security

Required capability surface:

- owner access state;
- permission envelopes;
- protected-action boundaries;
- pending authorizations;
- Work/Sol approval requirements;
- security alerts;
- fail-closed defaults.

Owner-control RPCs exposed to the client must reject unauthenticated callers and must not grant anonymous execution privileges.

## 16. Deployment

Required capability surface:

- release state;
- QA state;
- hosting/deployment state;
- current production SHA when verified;
- rollback/recovery state;
- release checks;
- no claim of deployment without real provider evidence.

## 17. Visible-control contract

Every visible interactive control must satisfy all of the following:

1. It has a real handler.
2. The handler reaches the clean V7 data/action path only.
3. The action has a defined success state.
4. Errors are visible and truthful.
5. Disabled/unavailable actions explain why.
6. No button exists solely as visual decoration unless it is explicitly non-interactive.
7. A control that performs no project execution (Refresh, Project Checkpoint, navigation) must not be routed through the background execution runner.
8. A visible chevron means navigation. If no navigation exists, the chevron must be removed and the row rendered as informational-only.
9. Approved screenshot chevrons are implemented as real navigation wherever the screenshot presents the element as an actionable row/card.
10. Automatic-mode controls are mutually exclusive and their visible state must match durable backend state.
11. A retry control may never silently broaden the exact approved task.

## 18. Data truth / progress

- `current_scope_progress_percent` is displayed only when its current V7 metric is verified.
- No fallback to old historical percentages.
- A new scope expansion may legitimately lower a percentage because the denominator changed.
- Project state and scope percentage are separate concepts.
- Agent-run progress is also separate and may be shown only from a trustworthy planned-task denominator.
- If Agent-run progress cannot be calculated truthfully, show `N/A` rather than a guessed value.
- To Work Barriers reviewed-project count is a count, not a substitute for project-scope or Agent-run percentage.
- No hardcoded screenshot sample values may leak into production screens.

## 19. Clean-room implementation boundary

Allowed inputs:

- approved screenshots;
- approved launcher artwork;
- other exact approved/protected assets such as approved book covers;
- current project/global rules;
- verified project data;
- verified requirements and factual historical evidence.

Not allowed as V7 runtime building material:

- old renderer code;
- old app shell;
- old CSS architecture;
- old startup/bootstrap code;
- old Agent implementation;
- old runner RPCs/tables;
- old competing service-worker/runtime stacks.

Approved historical asset bytes may be recovered exactly where James has explicitly preserved/approved that asset; this does not authorize reuse of the old runtime that once displayed it.

## 20. QA and release sequence

1. Clean-room architecture isolation.
2. Home and global shell.
3. Projects and Portfolio Overview.
4. Active / Live.
5. Next Up.
6. Revenue and Analytics drill-down.
7. Generic Project Details and Project Snapshot.
8. Books / Missing Hour detail, exact approved cover restoration, KDP Snapshot History, and Tracking Integrations.
9. Agent owner controls, mutually exclusive automatic modes, and atomic backend actions.
10. Sequential To Work Barriers behavior and truthful Home Agent progress/status.
11. Work approval ladder and bounded retry/manual retry behavior.
12. Brain / Automation / Integrations / Analytics / Security / Deployment.
13. Android/PWA navigation, Back, scroll restoration, safe areas, offline/update behavior, and safe global Refresh.
14. Visible-button and visible-chevron audit.
15. Data-truth and progress-truth audit.
16. Security advisor review for new backend functions and privileges.
17. Screenshot-by-screenshot visual QA at approved 864×1536 reference geometry.
18. First complete every-file repository audit.
19. Fix all defects found.
20. Second complete every-file repository audit, including roadmap/spec authority classification.
21. Pre-merge QA.
22. Pull request / merge only after the authorized rebuild chain is satisfied.
23. GitHub Pages deployment verification.
24. Production SHA verification.
25. Physical Android owner inspection.
26. After production is verified, perform owner Android cache/site-data cleanup and uninstall/reinstall if needed so the fresh V7 PWA takes over without old installed-app state.

## 21. Definition of done

Command Center V7 is not complete merely because automated tests are green.

Completion requires:

- the approved screens visually reproduce the approved design system closely enough to pass owner physical-phone inspection;
- all intended screens/modules and screenshot-driven drill-downs are reachable;
- every visible button and navigation chevron is real and correctly wired;
- exact approved Missing Hour covers are unobstructed and not replaced by synthetic art;
- Agent Auto and To Work Barriers are mutually exclusive and both fail closed to OFF;
- both automatic modes OFF produce zero background Agent work and zero background-runner heartbeat writes;
- To Work Barriers processes one project at a time, never enters Work, parks each project durably, and turns itself OFF when the sweep is exhausted;
- Agent Home status displays the actual current project/task/state and only a truthful Agent-run percentage or `N/A`;
- Project Checkpoint completes immediately without waiting for the hourly runner;
- Stop is immediate and atomic;
- execution controls remain queued until actually claimed;
- exact Work approval begins at Luna High; retries/escalation obey the bounded ladder; Sol Medium never auto-starts or auto-retries;
- readiness states are evidence-backed and material changes force appropriate recheck rather than silent stale readiness;
- progress/revenue/publication/integration data remains truthful;
- Android Back and scroll restoration behave correctly;
- global Refresh preserves route/scroll and performs no execution;
- PWA identity/cache/offline behavior is correct;
- approved launcher artwork is exact;
- new owner RPCs are not anonymously executable;
- the final every-file audit reports no unknown/unclassified implementation file and exactly the approved V7 authority set;
- the deployed production SHA is verified;
- James performs the final clean Android install/cache reset sequence after production verification;
- James completes the final physical-phone visual acceptance.
