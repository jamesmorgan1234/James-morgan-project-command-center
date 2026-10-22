# Command Center — Authoritative V7 Product Roadmap

Status: **AUTHORITATIVE CURRENT ROADMAP**

This roadmap is the single product/behavior checklist for the clean-room Command Center V7 rebuild. It replaces older roadmap wording where conflicts exist. The approved screenshots recorded in `COMMAND_CENTER_APPROVED_VISUAL_SPEC.md` are literal visual specifications. This roadmap controls product behavior, owner controls, data truth, navigation, execution, and completion criteria.

## 1. Product purpose

Command Center is James Morgan's private owner-controlled control plane for projects, progress, priorities, verified performance, project memory, automation, integrations, analytics, security, deployment, and Agent execution.

Core rules:

- Clean-room V7 implementation only. Do not use V4/V5/V6/approved legacy UI or Agent implementation as runtime building material.
- Normal Chat is the default execution brain.
- AUTO defaults and fails closed to OFF.
- AUTO OFF means **zero background Agent execution** and **zero Agent runner heartbeat writes**.
- No purchases, subscriptions, trials, paid APIs, ads, credits, usage billing, or paid infrastructure without exact owner authorization.
- No public publishing, deployment, merge, communication, legal acceptance, account-security change, or other protected side effect without the applicable authorization boundary.
- No invented percentages, revenue, progress, publication status, integrations, permissions, or completion.
- Verified zero is shown as zero. Missing or unverified data is shown as `N/A` or another truthful defined state.
- Internal IDs, raw JSON, source plumbing, private checkpoint mechanics, and backend diagnostics remain out of the normal owner UI.

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

## 3. Home

The primary Home layout contains four top-level cards:

1. **Projects** — complete tracked portfolio.
2. **Next Up** — current priority/action queue.
3. **Agent** — owner-controlled Agent execution surface.
4. **Revenue** — verified revenue only.

Directly beneath those cards are the six control modules:

- Brain
- Automation
- Integrations
- Analytics
- Security
- Deployment

Additional owner-facing navigation may include:

- Active / Live
- About / Advanced

Home must surface truthful Agent state and AUTO state without implying work is running when it is merely queued.

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
- no progress ring may display a guessed or stale percentage;
- unverified scope displays `N/A` / `Scope unavailable`;
- project count and status mix come from current clean V7 data.

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

Priority must derive from verified project state/attention rules. Do not fabricate ranking.

## 7. Revenue screen

Required behavior:

- verified portfolio revenue total only;
- project-by-project verified revenue;
- verified zero displayed as `$0.00`;
- unverified/missing revenue displayed as `N/A`;
- test orders and test transactions never count as real revenue;
- tapping a project opens its Project Details.

## 8. Project Details

All projects receive a clean V7 detail screen with truthful project-specific information.

### 8.1 Generic Project Details

Required sections where supported:

- hero identity/status card;
- verified current scope;
- verified revenue;
- integration count/state;
- exact next action;
- blocker/integrity state;
- verification summary;
- direct Agent Controls entry for that exact project.

### 8.2 The Missing Hour Saga / Books detail

Visual source: approved `The Missing Hour Saga — Project Details` screenshot.

Required sections:

- hero with project/cover artwork, category kicker, title, description/stage, metadata, status pill, integrated eclipse/landscape art, chevron;
- `KDP PERFORMANCE` section with a phone 3×2 metric grid;
- `BOOKS IN SERIES` section with five covers across one row in the approved reference and numbered corner badges;
- `PUBLICATION STATUS` with Kindle eBook, KDP Select, Paperback, Hardcover across one row where viewport permits the approved reference geometry;
- `KDP SNAPSHOT HISTORY` row;
- `TRACKING INTEGRATIONS` row;
- exact next action;
- direct Agent Controls entry.

Books/publication truth rules:

- file existence is not approval;
- approval is not publication;
- publication must not be implied without verified evidence;
- screenshot metrics are visual examples only and never production data authority.

## 9. Agent — owner controls

The clean V7 Agent surface must expose these owner controls:

1. **AUTO**
2. **Next Step**
3. **Until Work / Next Work Boundary**
4. **Manual Task**
5. **Project Checkpoint**
6. **Stop Agent**

Context-dependent controls additionally include:

- Pause
- Resume
- Refresh
- exact Work approval
- exact Sol Medium approval where the Work ladder reaches that rung
- decline approval

### 9.1 AUTO

AUTO is a background-execution gate, separate from run existence.

**AUTO OFF**:

- background runner may wake on its scheduler only long enough to read the V7 control gate;
- it must perform zero Agent execution;
- it must create/claim/advance zero runs or tasks;
- it must write no runner heartbeat;
- it must issue no notification;
- manual owner controls remain available.

**AUTO ON**:

- the scheduled runner may process eligible queued/working V7 runs;
- one primary run at a time;
- fresh control/run state must be re-read before each new task and immediately before each external side effect;
- stopping, pausing, or turning AUTO OFF outranks stale runner state.

### 9.2 Next Step

- owner-triggered;
- creates a bounded V7 run for exactly the next verified project action;
- the run remains `queued` until the execution runner actually claims it;
- UI must never display `Working` merely because the run exists.

### 9.3 Until Work / Next Work Boundary

- owner-triggered;
- advances normal-chat-capable work within the selected project scope;
- stops at the first genuine Work-only boundary;
- creates an exact Work approval request at that boundary;
- does not enter Work automatically.

### 9.4 Manual Task

- owner provides one exact objective;
- the run may do only that bounded objective;
- Books/KDP execution requires an exact Books target.

### 9.5 Project Checkpoint

Project Checkpoint is **not background execution**.

Required behavior:

- owner-triggered immediate action;
- works with AUTO either OFF or ON;
- does not wait for the hourly runner;
- performs no project side effects;
- does not require a Books target;
- snapshots the selected project's current clean V7 state, verified metrics, integration state, and recent activity, or the whole portfolio when no project is selected;
- writes a completed checkpoint audit record;
- leaves any unrelated active run pointer/state unchanged;
- returns the completed checkpoint to the UI immediately under normal database/network conditions.

UI states should visibly communicate `Checking` / `Complete` rather than implying background work.

### 9.6 Pause

- stops before the next unstarted action/side effect;
- preserves verified completed work;
- does not rewind already verified work.

### 9.7 Resume

- resumes an eligible paused run;
- terminal/stopped runs cannot be resumed.

### 9.8 Stop Agent

- immediate atomic V7 operation;
- marks the run stopped;
- stops all unstarted tasks;
- preserves verified work;
- writes stop evidence/checkpoint;
- clears the active-run pointer when appropriate;
- must not rely on the hourly runner eventually noticing a passive flag.

### 9.9 Refresh

- reloads clean current Agent state now;
- does not create or execute work.

### 9.10 Approvals / Work ladder

- Work is capability-bound, not convenience-bound;
- normal chat first;
- GPT-6 Luna High → GPT-6.1 Sol Light → GPT-6.1 Sol Medium exact-step approval;
- Astra prohibited;
- Sol Medium is the ceiling;
- approval applies only to the exact requested step;
- approval does not authorize unrelated work or spending.

## 10. Agent status truth

Agent UI must distinguish these states clearly:

- Idle
- Queued
- Working
- Paused
- Needs User
- Work Boundary
- Blocked
- Completed
- Stopped
- Failed

The interface must show, where available:

- selected/current project;
- objective;
- current/next task;
- verified step count;
- latest checkpoint;
- runner health;
- AUTO state;
- user-required action;
- pending approval.

A database control-row update alone cannot produce `Working`. Working requires real runner claim/execution state.

## 11. Brain

Required capability surface:

- durable project context;
- memories/context items;
- brainstorm workspace;
- project plans;
- tasks/planner state;
- handoff builder;
- project roadmaps;
- source truth / recovery context.

Normal UI should surface useful owner decisions and summaries, not raw source plumbing.

## 12. Automation

Required capability surface:

- schedules;
- condition watches;
- notifications;
- active/paused/disabled state;
- completion state;
- truthful next scheduled behavior;
- no autonomous spending.

Agent AUTO is separate from general Automation schedules.

## 13. Integrations

Required capability surface:

- connected service/provider state;
- source health/freshness;
- missing connection state;
- owner authorization requirement where applicable;
- no secrets or backend credentials in the UI.

## 14. Analytics

Required capability surface:

- verified KPIs;
- current scope progress;
- verified revenue;
- project/portfolio performance;
- source freshness;
- trends/time series where real data exists;
- goals and anomaly state where supported.

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

## 18. Data truth / progress

- `current_scope_progress_percent` is displayed only when its current V7 metric is verified.
- No fallback to old historical percentages.
- A new scope expansion may legitimately lower a percentage because the denominator changed.
- Project state and scope percentage are separate concepts.
- No hardcoded screenshot sample values may leak into production screens.

## 19. Clean-room implementation boundary

Allowed inputs:

- approved screenshots;
- approved launcher artwork;
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

## 20. QA and release sequence

1. Clean-room architecture isolation.
2. Home and global shell.
3. Projects.
4. Active / Live.
5. Next Up.
6. Revenue.
7. Generic Project Details.
8. Books / Missing Hour detail.
9. Agent owner controls and atomic backend actions.
10. Brain / Automation / Integrations / Analytics / Security / Deployment.
11. Android/PWA navigation, Back, scroll restoration, safe areas, offline/update behavior.
12. Visible-button audit.
13. Data-truth audit.
14. Screenshot-by-screenshot visual QA at approved 864×1536 reference geometry.
15. First complete every-file repository audit.
16. Fix all defects found.
17. Second complete every-file repository audit.
18. Pre-merge QA.
19. Pull request / merge only after the authorized rebuild chain is satisfied.
20. GitHub Pages deployment verification.
21. Production SHA verification.
22. Physical Android owner inspection.

## 21. Definition of done

Command Center V7 is not complete merely because automated tests are green.

Completion requires:

- the approved screens visually reproduce the approved design system closely enough to pass owner physical-phone inspection;
- all intended screens/modules are reachable;
- every visible button is real and correctly wired;
- AUTO OFF produces no background Agent work;
- Project Checkpoint completes immediately without waiting for the hourly runner;
- Stop is immediate and atomic;
- execution controls remain queued until actually claimed;
- progress/revenue/publication/integration data remains truthful;
- Android Back and scroll restoration behave correctly;
- PWA identity/cache/offline behavior is correct;
- approved launcher artwork is exact;
- the final every-file audit reports no unknown/unclassified implementation file;
- the deployed production SHA is verified;
- James completes the final physical-phone visual acceptance.
