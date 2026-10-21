# Command Center Agent Mode optimization standard

This standard supplements `AGENT_MODE_STANDARD.md`. Its purpose is to maximize what Command Center/normal chat completes directly, minimize scarce Work usage, preserve $0/free-first operation, and make Agent Mode measurable, reversible, resumable, and resistant to unnecessary escalation.

## 1. Normal-Chat Exhaustion Gate

Work is not eligible merely because a task is difficult, tedious, long, repetitive, technical, repository-related, database-related, or browser-like.

Before any Work proposal, Agent Mode must prove the exact blocked operation cannot be completed by currently available normal-chat/Command Center capabilities.

The exhaustion check includes, when relevant:

- highest available normal-chat reasoning;
- web research and current-source verification;
- GitHub repository/branch/file/PR/workflow capabilities;
- Supabase/database/schema/RPC/Edge Function capabilities;
- connected apps/plugins/connectors;
- file retrieval and file transformation;
- document, PDF, spreadsheet, presentation, image, and code tools;
- image generation/editing where appropriate;
- browser-capable normal-chat tools when available;
- API/provider actions exposed through connected tools;
- local computation/testing/QA capabilities;
- existing Command Center Automation, Integrations, Analytics, Security, Deployment, and Brain capabilities.

`Work would be easier`, `Work is more convenient`, `this is a coding task`, `this may take a long time`, or `normal chat does not want to do it` are never valid Work-boundary reasons.

The valid boundary must be concrete, such as an account/session interaction, provider UI operation, local-machine-only operation, unsupported browser flow, or other capability that is genuinely unavailable in the current normal-chat environment.

## 2. Dynamic Capability Registry

Agent Mode maintains a current capability registry rather than assuming old limitations remain true.

For each capability, record:

- capability key;
- available environment (`normal_chat`, `work`, `external_tool`, `user_only`);
- connected tool/provider when applicable;
- read/write/action capability;
- account/session requirement;
- free/paid state;
- authorization requirement;
- last verified availability;
- known limitations.

If normal chat gains a capability that previously required Work, Agent Mode must route future matching work back to normal chat automatically.

No capability regression: old Work-routing decisions never become permanent merely because they were once necessary.

## 3. Smallest-Blocker Splitter

A larger task must be decomposed around the irreducible blocker.

Example:

- normal chat completes steps 1–17;
- step 18 requires an unavailable account-bound UI action;
- only step 18 is prepared for Work/user action;
- returned evidence is verified;
- normal chat resumes steps 19 onward.

Agent Mode must never hand the surrounding project, phase, book, build, or workflow to Work merely because one step is blocked.

## 4. Pre-Handoff Compression

Before a Work handoff, normal chat completes every preparatory action it can so Work spends usage executing rather than thinking/researching.

Prepare, when applicable:

- exact file(s);
- exact repository/branch/path;
- exact account/provider target;
- exact URLs/IDs;
- exact text/copy;
- exact values/settings;
- already-made decisions;
- validation criteria;
- exact allowed clicks/actions;
- forbidden actions;
- expected returned evidence;
- exact resume point after return.

The handoff should contain no research or reasoning that normal chat could have completed first.

## 5. Adjacent Micro-Task Bundling

Tiny Work-only actions may be bundled when all are:

- in the same account/session/provider context;
- already known before the handoff;
- low-risk;
- covered by the same authorization scope;
- cheaper/safer to perform together than by repeatedly reopening Work.

Unrelated projects, accounts, protected actions, or scope expansions must not be bundled merely to reduce handoff count.

## 6. Work Model Least-Sufficient Escalation

Current Work ladder:

1. `GPT-6 Luna High`
2. `GPT-6.1 Sol Light`
3. `GPT-6.1 Sol Medium`
4. `GPT-6 Astra Light`
5. `GPT-6 Astra Medium`

Model choice is based on the exact blocked operation, not project size, duration, prestige, urgency, or number of surrounding tasks.

A long click-heavy browser session may remain appropriate for Luna High. A short but genuinely difficult reasoning/debugging boundary may require a stronger rung.

Escalation requires a reason classification:

- `capability_insufficient` — stronger reasoning may help;
- `account_auth_required` — stronger model will not help;
- `captcha_or_mfa` — stronger model will not help;
- `permission_denied` — stronger model will not help;
- `provider_outage` — stronger model will not help;
- `missing_input` — resolve input, do not escalate model;
- `tool_unavailable` — route/reconnect/install; do not blindly escalate;
- `execution_complexity` — may justify next rung.

Agent Mode may escalate only when the failure reason indicates model capability is actually relevant.

## 7. Work Concurrency Guard and Queue

Default maximum active Agent Mode Work handoffs: **1**.

If additional projects hit Work-only blockers:

- keep progressing their normal-chat work;
- place blocked Work steps into the Work queue;
- deduplicate equivalent blockers;
- bundle compatible adjacent micro-tasks where appropriate;
- do not fan the portfolio into simultaneous Work sessions.

Additional concurrency requires a concrete benefit and explicit approval unless a future verified usage policy permits it.

The queue records priority, blocker, project, model proposal, approval state, and whether normal-chat work can continue independently.

## 8. Work Usage Uncertainty Rule

Until Command Center has a trustworthy account-wide Work usage source:

- total Work allowance = `N/A`;
- remaining Work allowance = `N/A`;
- percentage expected for a proposed handoff = `N/A`;
- usage by unrelated/manual chats = unknown.

Agent Mode may truthfully track only its own verified handoffs, selected model, duration, state, and project attribution.

Never convert that internal ledger into a fake account-wide percentage.

## 9. Work Return Contract

Every Work handoff must return a structured result containing:

- handoff/run ID;
- exact actions actually performed;
- exact actions not performed;
- success/failure per action;
- provider/account/repository/file IDs where relevant;
- screenshots/files/commit/PR/run IDs or other evidence where available;
- blockers encountered;
- unexpected changes;
- final verified/claimed state;
- exact recommended normal-chat resume point.

Work must not silently continue into later project steps outside the bounded handoff.

Normal chat verifies the returned evidence before the Agent Mode step can become `verified`.

## 10. Free Tool Discovery and Installation Policy

Command Center is **$0/free-first**.

Agent Mode may discover an additional tool/plugin/connector/library/application when it materially expands normal-chat capability or removes a recurring Work boundary.

Rules:

- prefer existing built-in/connected capabilities first;
- proposed tool must have a genuinely free usable path for the required function;
- no paid subscriptions, paid APIs, credits, trials requiring later payment, ads spend, or purchases without explicit authorization;
- never silently install software or connect an account where user approval is required;
- evaluate privacy/security and required permissions before recommending connection;
- prefer open-source/local/free-tier tools when they meet the requirement;
- do not add a tool solely because it exists;
- record what capability gap the tool solves;
- if installation is user/device-bound, Agent Mode prepares the smallest exact installation/connection instruction and resumes afterward.

A free tool that allows future work to stay in normal chat is preferable to repeated Work handoffs when it is safe and maintainable.

## 11. Tool Health and Fallback Registry

For each important tool/connector, Agent Mode tracks:

- connected/available/unavailable;
- authenticated/needs_auth;
- read/write/action scope;
- last successful use;
- error category;
- approved fallback.

A temporary tool failure should not automatically become a Work handoff. First try a safe approved normal-chat fallback or reconnect path when available.

## 12. Dry-Run / Shadow Mode

High-impact or newly introduced autonomous routines should support a dry-run mode before broad execution.

Dry-run produces:

- proposed steps;
- proposed tools;
- proposed protected boundaries;
- expected side effects;
- expected verification evidence;
- Work handoffs that would be required;
- project/asset impact radius.

Dry-run must not perform externally visible side effects.

Use one-before-many: validate one representative unit before scaling actions that affect money, reputation, publishing, deployment, accounts, communications, security, or scarce generation resources.

## 13. Impact-Radius Gate

Before side effects, classify the expected impact radius:

- `local_unit` — one internal/isolated unit;
- `single_project` — one project only;
- `multi_project` — multiple explicitly listed projects;
- `public_or_account` — external/public/account effect;
- `portfolio_wide` — broad Command Center effect.

Higher impact requires stronger verification/authorization and smaller initial execution batches.

Agent Mode may not infer portfolio-wide permission from a single-project goal.

## 14. Per-Project Autonomy Profiles

Projects may define an autonomy profile without weakening global protections.

Examples:

- `normal_chat_auto` — routine normal-chat work may proceed automatically;
- `work_ask` — every Work use asks first;
- `work_micro_auto` — only explicitly pre-authorized micro Work boundaries may run automatically if a future policy enables this;
- `publish_ask` — publishing always asks;
- `account_actions_ask` — account actions always ask;
- `generation_bounded` — use project-specific generation batch limits;
- `financial_protected` — money/spending always protected.

Newest explicit user instruction overrides a stored project profile.

## 15. Pause, Kill Switch, and Safe Stop

Every Agent Mode run supports:

- pause after current safe atomic operation;
- cancel before the next unstarted side effect;
- stop on unexpected scope expansion;
- stop on authorization mismatch;
- stop on repeated failure;
- stop on tool/provider integrity uncertainty;
- stop on resource/spend boundary;
- resume from the latest verified checkpoint.

Stopping must preserve verified completed work and must not roll back unrelated successful units unless rollback is explicitly required.

## 16. Dependency and Critical-Path Scheduling

For multi-step/multi-project work, Agent Mode should progress tasks that can advance in normal chat while another project is blocked.

Prioritize by:

- explicit user priority;
- dependency/critical path;
- unblock value;
- deadline when verified;
- risk;
- ability to make progress without protected resources;
- avoidance of duplicated work.

Do not idle the whole portfolio because one project waits on Work/account authorization.

## 17. Duplicate-Side-Effect Lock

Before any externally visible action, Agent Mode checks whether equivalent evidence already proves the action happened.

Protect against duplicate:

- emails/messages;
- posts/publications;
- payments/purchases;
- uploads;
- deployments;
- migrations;
- account changes;
- generation batches;
- Work handoffs;
- integration writes.

Idempotency/evidence keys are preferred whenever the underlying system supports them.

## 18. Verification Strength Levels

Verification evidence can be classified:

- `self_report_only` — insufficient for completion;
- `tool_result` — useful but may require downstream check;
- `canonical_record` — durable provider/database/repository evidence;
- `live_verified` — production/published/external state independently checked.

A roadmap gate specifies the minimum evidence strength required.

## 19. Efficiency Metrics

Agent Mode measures efficiency without turning metrics into arbitrary targets.

Useful metrics:

- total steps;
- normal-chat steps;
- Work handoffs;
- Work handoff rate;
- normal-chat completion rate;
- Work avoidance rate;
- average Work handoff scope class;
- handoffs by model rung;
- escalations by reason;
- duplicate actions prevented;
- resumed runs without redoing verified work;
- user interventions required;
- verification failures caught before advancement.

Example:

- total steps: 47
- normal-chat steps: 44
- Work steps: 3
- Work handoff rate: 6.3%

These are observational metrics. Agent Mode must not manipulate scope or hide required Work simply to improve a percentage.

## 20. Continuous Capability Re-evaluation

At reasonable checkpoints and after tool/plugin/platform changes, Agent Mode re-evaluates whether recurring blockers can now be handled in normal chat.

If a safe free tool or newly available normal-chat capability eliminates a Work boundary, update routing for future steps.

The optimization objective is:

**If normal chat can accomplish the result safely and correctly, normal chat must do it. Work is used only for the smallest irreducible capability gap.**
