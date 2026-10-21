# Command Center Agent Mode optimization standard

This standard supplements `AGENT_MODE_STANDARD.md`. Its purpose is to maximize what Command Center/normal chat completes directly, minimize scarce Work usage, preserve $0/free-first operation, and make Agent Mode measurable, reversible, resumable, and resistant to unnecessary escalation.

The newest explicit James Morgan instruction controls over older drafts.

## 1. Normal-Chat Exhaustion Gate

Work is not eligible merely because a task is difficult, tedious, long, repetitive, technical, repository-related, database-related, or browser-like.

Before any Work handoff, Agent Mode must prove the exact blocked operation cannot be completed by currently available normal-chat/Command Center capabilities, including when relevant:

- highest available normal-chat reasoning;
- web research/current-source verification;
- GitHub repository/branch/file/PR/workflow capabilities;
- Supabase/database/schema/RPC/Edge Function capabilities;
- connected apps/plugins/connectors;
- file retrieval/transformation;
- document, PDF, spreadsheet, presentation, image, and code tools;
- browser-capable normal-chat tools;
- provider APIs exposed through available tools;
- local computation/testing/QA;
- Project Brain, Automation, Integrations, Analytics, Security, and Deployment.

`Work would be easier`, `this is coding`, `this is tedious`, or `this may take a long time` are never valid reasons.

## 2. Dynamic Capability Registry

Agent Mode maintains a current capability/tool-health registry. Track:

- capability key;
- available environment (`normal_chat`, `work`, `external_tool`, `user_only`);
- provider/tool;
- available/unavailable;
- authenticated/needs_auth;
- read/write/action capability;
- free/paid state;
- authorization requirement;
- last successful use;
- error classification;
- approved fallback;
- last verified availability.

If normal chat gains a capability that previously required Work, future matching work moves back to normal chat. No old limitation becomes permanent merely because it once existed.

## 3. Smallest-Blocker Splitter

A larger task must be decomposed around the irreducible blocker.

If steps 1–17 are normal-chat-capable, step 18 is Work-only, and 19–30 return to normal chat, then normal chat completes 1–17, only step 18 goes to Work, evidence is verified, and normal chat resumes at 19.

Never hand the surrounding project, phase, book, build, or workflow to Work because one operation is blocked.

## 4. Pre-Handoff Compression

Before Work, normal chat prepares everything it can:

- exact files;
- repository/branch/path;
- account/provider/URL/IDs;
- exact copy/text/values/settings;
- decisions already made;
- allowed actions/clicks;
- forbidden actions;
- validation criteria;
- expected returned evidence;
- exact resume point.

Work should execute rather than research/reason about things normal chat could have prepared.

## 5. Adjacent Low-Risk Bundling

Compatible Work-only actions may be bundled only when they are in the same account/session/provider context, already known, low-risk, inside the same explicit authorization, and safer/more efficient together than repeated handoffs.

Do not bundle unrelated projects, accounts, protected actions, or scope expansions.

## 6. Work Model Least-Sufficient Escalation — hard ceiling

Allowed Agent Mode Work ladder:

1. `GPT-6 Luna High`
2. `GPT-6.1 Sol Light`
3. `GPT-6.1 Sol Medium`

`GPT-6.1 Sol Medium` is the absolute Agent Mode ceiling.

`GPT-6 Astra Light`, `GPT-6 Astra Medium`, and anything stronger are prohibited inside Agent Mode. Astra is reserved only for a separate manual user-requested review outside Agent Mode.

Model choice is based on the exact blocked operation, not project size, duration, importance, urgency, or surrounding workload.

### Luna High

Use for mechanical/simple browser execution, navigation, uploads of prepared files, entering verified values, copying prepared text, routine forms, repetitive provider/account UI steps, and mechanical checks.

When bounded and low-risk, `micro`, `small`, and `moderate` Luna High batches may run automatically without asking after every click.

### Sol Light

Use when a Work-only operation needs modest interpretation, branching, or troubleshooting.

Bounded low-risk `small`/`moderate` Sol Light batches may run automatically when exact scope, allowed actions, account/provider, verification criteria, and stop conditions are explicit.

### Sol Medium

Use only for the smallest genuine Work-only blocker requiring nontrivial reasoning beyond Luna/Sol Light.

First Agent Mode use of Sol Medium for that blocker requires explicit user approval. Before requesting it, split the blocker if possible so most work remains in normal chat/Luna/Sol Light.

If Sol Medium fails, block the step. Do not escalate to Astra.

Escalation is allowed only when failure classification shows reasoning capability is relevant, such as `capability_insufficient` or justified `execution_complexity`.

Never escalate for MFA/CAPTCHA, missing credentials/input, permission denial, provider outage, account ownership/legal/security decisions, rate limits, or unsupported tool state.

## 7. Work Concurrency Guard and Queue

Default maximum active Agent Mode Work handoffs: **1**.

If other projects hit Work-only blockers:

- continue all possible normal-chat work;
- queue blocked Work steps;
- deduplicate equivalent blockers;
- bundle compatible adjacent low-risk work only within the same authorized context;
- do not fan unrelated projects into Work concurrently.

The queue records project, step, priority, blocker, proposed model rung, scope/risk class, approval state, retry/circuit-breaker state, and whether normal-chat work can continue independently.

## 8. Work Usage Uncertainty Rule

Until Command Center has a trustworthy account-wide Work usage source:

- total Work allowance = `N/A`;
- remaining Work allowance = `N/A`;
- predicted percentage cost = `N/A`;
- usage by unrelated/manual chats = unknown.

Agent Mode may truthfully track only its own verified handoffs, model rung, timestamps when known, state, and project attribution. Never convert that internal ledger into a fake account-wide percentage.

## 9. Work Return Contract

Every Work handoff should return structured evidence containing:

- handoff/run ID;
- actions actually performed;
- actions not performed;
- success/failure per action;
- provider/account/repository/file IDs when relevant;
- screenshots/files/commit/PR/run IDs or other evidence when available;
- blockers;
- failure classification;
- unexpected changes;
- exact normal-chat resume point.

Normal chat verifies returned evidence before a step can become `verified`.

## 10. Free Tool Discovery and Installation Policy

Command Center remains **$0/free-first**.

Agent Mode may recommend/use an additional free tool/plugin/connector/library/application only when it materially expands normal-chat capability or removes a recurring Work blocker.

Prefer built-in tools, already-connected tools, open-source tools, and genuinely free usable tiers. Do not buy, subscribe, start paid trials, use paid API credits, spend money, silently install software, or silently connect accounts.

If user/device installation or account authorization is required, isolate that narrow boundary and resume afterward.

## 11. Tool Health and Fallback Registry

Temporary tool failure does not automatically become Work. Try safe normal-chat fallback/reconnect routes first.

If a newly available tool means something no longer needs Work, future routing must return to normal chat.

## 12. Dry-Run / Shadow Mode

High-impact or newly introduced autonomous routines should support dry-run/shadow mode.

Dry run shows proposed steps, tools, Work steps/model rungs, protected boundaries, expected side effects, expected evidence, and impact radius. It performs no externally visible side effect.

Use one-before-many for money, reputation, publishing, deployment, accounts, communications, security, analytics, or other high-impact areas.

## 13. Impact-Radius Gate

Classify impact before side effects:

- `local_unit`;
- `single_project`;
- `multi_project`;
- `public_or_account`;
- `portfolio_wide`.

Larger impact requires stronger authorization/verification and smaller initial batches. Single-project authorization never silently becomes portfolio authorization.

## 14. Per-Project Autonomy Profiles

Projects may define an autonomy profile without weakening global protections. Profiles may narrow Work or protected-action execution, but may not raise the Sol Medium ceiling or bypass global gates.

Examples include:

- `normal_chat_auto`;
- `work_luna_bounded_auto`;
- `work_sol_light_bounded_auto`;
- `work_sol_medium_approval`;
- `publish_ask`;
- `account_actions_ask`;
- `generation_bounded`;
- `financial_protected`.

Newest explicit user instruction overrides a stored profile.

## 15. Pause, Kill Switch, and Safe Stop

Every run supports:

- pause after current safe atomic action;
- cancel before the next unstarted side effect;
- stop on unexpected scope expansion;
- stop on authorization mismatch;
- stop on repeated failure;
- stop on provider/tool integrity uncertainty;
- stop on protected resource/spend boundary;
- resume from latest verified checkpoint.

Stopping preserves verified completed work.

## 16. Dependency and Critical-Path Scheduling

Normally maintain one primary execution lane at a time:

**Project A → progress until complete or genuinely blocked → checkpoint → continue same project.**

A Work microstep alone is not a reason to switch projects. Switch only when the current project remains genuinely blocked by user approval/action, MFA/CAPTCHA, account login, provider outage, unavailable dependency, unresolved external response, Work outside the automatic envelope, or another real blocker.

When blocked, checkpoint exactly and continue eligible work on another explicitly authorized project rather than idling.

## 17. Duplicate-Side-Effect Lock

Before externally visible actions, check whether equivalent canonical evidence already proves the action happened.

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
- Integration writes.

Use idempotency/evidence keys when available.

## 18. Verification Strength Levels

Evidence strength:

- `self_report_only` — insufficient;
- `tool_result`;
- `canonical_record`;
- `live_verified`.

A step’s gate specifies the minimum appropriate strength. If evidence cannot prove completion, the step remains incomplete.

## 19. Retry Circuit Breaker and No-Progress Watchdog

`AGENT_MODE_RETRY_CIRCUIT_BREAKER_STANDARD.md` is mandatory.

The same failed operation in the same state may not simply run again. At most one automatic retry is permitted for a genuinely transient failure. Later attempts require materially changed state. Failure must be classified before retrying.

Two meaningful failed attempts on the same operation normally block the step. State change can reopen it.

Repeated Work failures across projects that indicate a shared systemic problem pause new Work handoffs for the affected capability/provider while normal-chat work continues.

Failure must produce information. If the next attempt has no new information or changed state, the retry is forbidden.

## 20. Efficiency Metrics and Continuous Re-evaluation

Measure efficiency without gaming percentages:

- total steps;
- normal-chat steps;
- Work steps/handoffs;
- Work handoff rate;
- Work avoidance rate;
- model distribution;
- escalations and reason;
- duplicate actions prevented;
- retries prevented by circuit breaker;
- resumed runs without redoing verified work;
- user interventions;
- verification failures caught before advancement.

These are observational metrics, not arbitrary targets. Never hide genuinely required Work to improve a percentage.

At checkpoints and after tool/platform changes, re-evaluate whether recurring blockers can now be handled in normal chat.

The governing objective is:

**If normal chat can accomplish the result safely and correctly, normal chat must do it. Work is used only for the smallest irreducible capability gap, with the least-sufficient allowed model and the broadest safe bounded envelope.**
