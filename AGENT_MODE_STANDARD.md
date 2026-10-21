# Command Center Agent Mode standard

Agent Mode is bounded, auditable execution over already completed Command Center capabilities. It does not create a competing execution system and it does not weaken project, Security, Deployment, publishing, account, quality, checkpoint, or protected-action gates.

Where older Agent Mode drafts conflict with this file, the newest explicit James Morgan instruction controls.

## Eight Agent Mode phases

1. **Agent Session Model** — create an owner-scoped run with an explicit goal, project scope, permission envelope, execution policy, and durable state.
2. **Goal Intake** — convert a user-approved objective into a structured objective without silently expanding scope.
3. **Step Executor** — execute one eligible step at a time through already-supported Command Center execution paths.
4. **Tool Permission Gate** — block every tool/action outside the run’s explicit permissions, project scope, or protected boundaries.
5. **Verification Gate** — require real downstream evidence that a step succeeded before it counts complete or the agent advances.
6. **Checkpoint & Resume** — persist exact run/step state, evidence, blockers, permissions, Work state, and the next resumable action.
7. **Failure Recovery** — retry/resume only the failed or incomplete unit and never duplicate a verified side effect.
8. **Cross-Project Agent Runs** — coordinate multiple explicitly selected projects while preserving each project’s independent checkpoints, locks, permissions, and quality gates.

## Core execution loop

Agent Mode follows:

**latest verified checkpoint → reconcile live state → identify first incomplete eligible unit → execute through an allowed capability → verify real evidence → checkpoint → continue**

Running `continue` twice must be idempotent. Verified work is never redone merely because a chat, tool session, or previous attempt ended.

## Normal-chat exhaustion gate

The default route is:

**normal chat / native Command Center capabilities first → smallest genuine capability boundary → bounded Work only when irreducible → verify → return to normal chat**

Before routing anything to Work, Agent Mode must establish that the exact blocked operation cannot currently be completed by available normal-chat/Command Center capabilities, including when relevant:

- highest available normal-chat reasoning;
- GitHub;
- Supabase/database/schema/RPC/Edge Functions;
- files;
- web research/current-source verification;
- connected apps/plugins/connectors;
- provider APIs exposed through available tools;
- normal-chat browser-capable tools;
- documents, spreadsheets, PDFs, presentations, and image tools;
- computation/testing/QA;
- Project Brain, Automation, Integrations, Analytics, Security, and Deployment;
- any safe installed genuinely free tool.

`Work would be easier`, `this is coding`, `this is tedious`, `this may take a long time`, or `the surrounding project is large` are not valid Work-boundary reasons.

The Work boundary is the **smallest independently useful blocked operation**. If steps 1–17 are normal-chat-capable and step 18 is Work-only, normal chat completes 1–17, only step 18 goes to Work, returned evidence is verified, and normal chat resumes at step 19.

## Normal-chat reasoning policy

For substantive Agent Mode execution in normal chat, use the highest available reasoning. This is an execution policy, not a claim that Command Center can silently change a ChatGPT model/reasoning selector that the product does not expose programmatically.

Reasoning level never overrides authorization or protected boundaries.

## Work is scarce and the account-wide meter is unavailable

Agent Mode must conserve shared Work usage aggressively.

Until a trustworthy account-wide product source is connected:

- total Work allowance = `N/A`;
- remaining Work allowance = `N/A`;
- usage by unrelated/manual chats = unknown;
- predicted percentage cost = `N/A`.

Agent Mode may track only what it initiated. Its Work ledger is not an OpenAI billing meter.

## Current allowed Agent Mode Work ladder — hard ceiling

The only allowed Agent Mode Work rungs are:

1. `GPT-6 Luna High`
2. `GPT-6.1 Sol Light`
3. `GPT-6.1 Sol Medium`

`GPT-6.1 Sol Medium` is the absolute Agent Mode Work ceiling.

`GPT-6 Astra Light`, `GPT-6 Astra Medium`, and anything stronger than Sol Medium are prohibited inside Agent Mode. Astra may only be used later as a separate manual user-requested review outside Agent Mode.

If Sol Medium is insufficient, Agent Mode stops, checkpoints the blocker, preserves verified work, and reports the unresolved capability/reasoning gap. It must not silently escalate above the ceiling.

## Scope class, model rung, and risk are independent

For each Work-only boundary classify separately:

- `scope_class`: `micro`, `small`, `moderate`, `substantial`;
- `model_rung`: `Luna High`, `Sol Light`, `Sol Medium`;
- risk class;
- impact radius.

Duration or project importance does not determine model rung. A long mechanical task can remain Luna High; a small reasoning-heavy blocker can require Sol Medium.

### Luna High — broadest automatic bounded envelope

Use for mechanical low-risk Work-only operations such as clicking/navigation, routine forms, uploading already-prepared files, copying prepared text, entering verified values, repetitive provider/account UI operations, and mechanical checking.

When scope is explicit, risk is low, and no protected boundary is crossed, Agent Mode may automatically execute bounded `micro`, `small`, or `moderate` Luna High batches without asking after every click.

### Sol Light — bounded automatic reasoning envelope

Use when a Work-only operation needs modest interpretation, branching, or troubleshooting beyond mechanical execution.

Bounded low-risk `small`/`moderate` Sol Light batches may run automatically when the objective, account/provider, allowed actions, verification criteria, and stop conditions are explicit.

### Sol Medium — approval-required fallback ceiling

Use only when the smallest genuine Work-only blocker requires nontrivial reasoning beyond Luna High/Sol Light.

Before first Agent Mode Sol Medium use for that blocker, explicit user approval is required. Agent Mode must first determine whether the blocker can be split so most work stays in normal chat/Luna/Sol Light.

If Sol Medium fails, stop and block the step unless a materially changed state later justifies a new user-authorized attempt.

## Work concurrency and queue

Default maximum active Agent Mode Work handoffs is **1**.

Other projects may continue all possible normal-chat work while Work-only blockers are queued. Equivalent blockers should be deduplicated. Compatible adjacent low-risk steps may be bundled only when they share the same authorized account/session/provider context and do not broaden scope.

## Pre-handoff compression

Before any Work handoff, normal chat prepares everything it can, including as applicable:

- exact files;
- repository/branch/path;
- IDs/URLs/account/provider;
- exact text/values;
- decisions already made;
- allowed actions/clicks;
- forbidden actions;
- expected evidence;
- exact resume point.

Work should execute, not re-research work normal chat could have completed first.

## Protected boundaries override model cost

Low-cost Work does not make a high-risk action safe.

Even Luna High must stop at protected boundaries such as:

- spending, purchases, subscriptions, credits, paid APIs, ads, or paid trials;
- legal acceptance/attestations;
- MFA/CAPTCHA/identity verification/security recovery;
- password/credential changes;
- security/permission escalation;
- destructive or irreversible operations;
- unexpected account ownership decisions;
- locked asset replacement;
- unexpected scope expansion;
- publishing or production actions outside an already-authorized high-level unit;
- Books work outside explicit named Books authorization.

Risk can shrink the execution envelope; it can never enlarge it.

## Work handoff ledger

Record at minimum:

- agent session;
- step;
- project;
- capability-boundary reason;
- selected model rung;
- scope class;
- risk class;
- bounded instructions;
- approval state;
- start/end timestamps when known;
- state: `proposed`, `approved`, `in_progress`, `returned`, `verified`, `failed`, `blocked`, `canceled`;
- returned evidence;
- failure classification;
- retry fingerprint;
- retry count;
- whether state materially changed before retry;
- whether normal-chat execution resumed.

## Retry circuit breaker

`AGENT_MODE_RETRY_CIRCUIT_BREAKER_STANDARD.md` is mandatory runtime policy.

Failure must produce information. The same failed operation in the same state may not simply run again because another attempt might work.

At most one automatic retry is allowed for a genuinely transient failure. Later attempts require materially changed state. Failure must be classified before retrying. Model escalation is allowed only when reasoning capability is relevant, and never above Sol Medium.

Two meaningful failed attempts on the same operation normally block the step. A later verified state change may reopen it.

Repeated Work failures across projects that indicate a shared systemic problem must trigger a portfolio-level Work circuit breaker so Command Center does not burn shared Work allowance across multiple projects with the same failing pattern.

## Duplicate-side-effect lock

Before externally visible actions or retries, reconcile canonical evidence to determine whether the intended side effect already happened.

Protect against duplicate sends/messages, posts/publications, payments/purchases, uploads, deployments, migrations, account changes, generation batches, Work handoffs, and Integration writes. Use idempotency/evidence keys where possible.

## Verification gate

A step is not complete because an executor returned success text.

Verification strength levels are:

- `self_report_only` — insufficient for completion;
- `tool_result`;
- `canonical_record`;
- `live_verified`.

Use the strength appropriate to the action. Canonical/live evidence may include database state, Git commit/PR/workflow/deployment, provider record, published artifact, approved file hash, Automation/Integration/Security evidence, or a verified checkpoint.

If evidence does not prove completion, the step remains incomplete (`verification_pending`, `blocked`, `failed`, or another accurate state).

## Durable checkpoint and resume

A checkpoint records:

- objective;
- project scope;
- current/first-incomplete step;
- verified step IDs;
- failed/blocked step IDs;
- permission envelope;
- Work ledger state;
- retry/circuit-breaker state;
- known-good checkpoint references;
- verification evidence;
- exact next valid action;
- forbidden actions on resume.

On interruption, recover the latest Agent checkpoint, reconcile real downstream state, preserve completed side effects, and resume from the first incomplete unit. Never restart an entire run solely because the chat ended or froze.

## Pause / kill switch

Agent Mode supports:

- pause after the current safe atomic action;
- stop before the next unstarted side effect;
- stop on unexpected scope expansion;
- stop on authorization mismatch;
- stop on repeated failure;
- stop on provider/tool integrity uncertainty;
- stop on protected resource/spend boundary;
- resume from the latest verified checkpoint.

Stopping does not discard already-verified work.

## Cross-project runs

Cross-project execution requires an explicit project list. Cross-project orchestration changes scheduling only; it does not merge project truth or authorization.

Each included project retains its own checkpoint, verified state, protected assets, permissions, rules, and quality gates. One project is normally the primary execution lane until complete or genuinely blocked. A Work microstep alone is not a reason to switch projects.

## Books are explicit-target-only

`AGENT_MODE_BOOKS_POLICY.md` remains mandatory. Agent Mode must never interpret broad portfolio language as permission to create or process every Books project.

Books work requires an explicitly named book, series, collection, cookbook, workbook, or bounded Books task. Existing humanization, continuity, originality, canon, formatting, cover/interior alignment, subtype-specific QA, and locked-asset rules remain mandatory. A book is not publishable merely because files exist.

## No fake autonomy

If an external capability is unavailable, disconnected, unauthorized, blocked by user-only interaction, or cannot be verified, Agent Mode records the real blocker. It must not claim an account connected, step ran, message sent, book published, deployment completed, or other side effect occurred without corresponding evidence.
