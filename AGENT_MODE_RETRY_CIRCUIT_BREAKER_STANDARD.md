# Command Center Agent Mode retry circuit breaker standard

This standard supplements `AGENT_MODE_STANDARD.md`, `AGENT_MODE_OPTIMIZATION_STANDARD.md`, `AGENT_MODE_MICRO_WORK_POLICY.md`, and `AGENT_MODE_WORK_ENVELOPE_STANDARD.md`.

Its purpose is to prevent Agent Mode from wasting Work usage or time by repeating the same failing operation without new information, while preserving safe recovery from genuinely transient failures.

## Core rule

**Failure must produce information. If the next attempt has no new information, changed state, corrected input, justified route change, or meaningful recovery action, the retry is forbidden.**

Agent Mode must never loop on the same command merely because another attempt might work.

## Attempt fingerprint

Every Work or external side-effect attempt receives a durable attempt fingerprint derived from, at minimum:

- agent session ID;
- project ID;
- agent step ID;
- provider/account/tool target;
- action/tool key;
- normalized input/payload hash;
- target resource ID/URL/path when applicable;
- selected Work model rung when Work is used;
- relevant capability/tool state;
- relevant authorization state.

Equivalent attempts with the same effective state are treated as the same attempt class.

## Identical retry prohibition

A failed attempt may not be automatically repeated with the same fingerprint unless the failure is explicitly classified as transient and the retry occurs after a real cooldown/recovery event.

`Try again`, `maybe it will work this time`, `the previous run stopped`, or `the task is important` are not valid retry reasons.

## Failure classification

Every failed or blocked step must be classified before another attempt is allowed.

Supported categories include:

- `transient_network` — temporary network/request failure;
- `provider_timeout` — provider timed out or returned temporary service failure;
- `provider_outage` — provider is unavailable;
- `rate_limited` — provider/tool rate limit encountered;
- `session_expired` — account/session needs refresh/re-authentication;
- `captcha_or_mfa` — user/security interaction required;
- `permission_denied` — authorization/scope is insufficient;
- `missing_input` — required information/file/value is absent;
- `invalid_input` — submitted input is malformed/incorrect;
- `tool_unavailable` — required tool/connector is unavailable;
- `capability_insufficient` — selected model/tool genuinely lacked needed capability;
- `execution_complexity` — route/model may need a justified upgrade;
- `target_changed` — page/resource/provider state changed unexpectedly;
- `verification_failed` — action claimed success but canonical evidence did not prove it;
- `duplicate_prevented` — equivalent side effect already exists;
- `unknown` — cause not yet understood.

Unknown failures do not qualify for repeated automatic retries until more evidence is gathered.

## Per-step Work retry budget

The default Work retry budget is deliberately small.

### GPT-6 Luna High

- one original attempt;
- at most one justified automatic retry when the failure is transient or the state materially changed;
- additional attempts require a route/state change or reclassification.

### GPT-6.1 Sol Light

- one attempt after the step has been reclassified as requiring more interpretation/capability;
- no repeated blind Sol Light retries.

### GPT-6.1 Sol Medium

- absolute Agent Mode Work ceiling;
- first use requires the applicable approval policy;
- no automatic repeated Medium attempts;
- if Sol Medium fails, the step becomes blocked unless the user explicitly authorizes a materially changed attempt.

### Higher Work models

Agent Mode may not use Work models above GPT-6.1 Sol Medium.

## Model escalation rule

Model escalation is permitted only when the failure category shows that reasoning/model capability is relevant.

May justify escalation:

- `capability_insufficient`;
- `execution_complexity` when evidence supports it.

Must not justify escalation:

- MFA/CAPTCHA;
- expired/missing credentials;
- permission denial;
- provider outage;
- rate limit;
- missing/invalid input;
- user/legal/account decision;
- unsupported tool state;
- duplicate-prevented action.

A stronger model must never be used as a generic retry mechanism.

## State-change requirement

After a non-transient failure, the next attempt must include at least one meaningful change, such as:

- corrected input;
- refreshed session;
- newly granted scope/permission;
- changed provider/tool route;
- resolved outage/rate-limit condition;
- changed target state;
- new evidence narrowing the failure cause;
- justified model rung change;
- user-supplied missing information;
- safe alternate execution path.

If none exists, the step remains blocked.

## Provider cooldown and backoff

Transient provider/network failures must use bounded backoff rather than rapid retry loops.

Rules:

- no immediate repeated clicking/request storm;
- honor explicit provider retry-after information when available;
- use increasing cooldowns for repeated transient failures;
- stop automatic retries after the per-step retry budget is exhausted;
- provider outage or rate-limit state should place the step into waiting/blocked state rather than consuming Work continuously.

## No-progress detector

Agent Mode detects logical loops even when individual actions technically succeed.

A run is considered to be making no meaningful progress when repeated cycles produce no change in:

- verified completed step count;
- blocker resolution;
- canonical provider/database/repository state;
- evidence strength;
- next valid action;
- dependency state.

If the same plan/step sequence repeats without measurable state improvement, Agent Mode stops the loop, checkpoints, classifies the blocker, and either chooses a materially different valid route or marks the step blocked.

Normal-chat reasoning may continue to diagnose the blocker, but externally visible retries remain gated by this standard.

## Duplicate side-effect protection

Before every retry, Agent Mode checks canonical evidence for whether the intended side effect already happened despite an error/timeout.

This is mandatory for actions such as:

- emails/messages;
- uploads;
- posts/publications;
- payments/purchases;
- account changes;
- migrations;
- deployments;
- generation batches;
- integration writes;
- Work handoffs.

If evidence shows the action already occurred, the retry is forbidden and the existing result is reconciled instead.

## Per-project failure breaker

If two meaningful attempts on the same blocked operation fail without resolving the blocker, Agent Mode must stop automatic execution of that step and mark it `blocked` or `needs_user_action`.

The project may continue on independent normal-chat work when available. It must not repeatedly consume Work on the blocked operation.

## Portfolio-wide Work failure watchdog

Agent Mode tracks recent Work failures across all active agent sessions.

If repeated Work failures suggest a shared problem such as provider outage, connector failure, expired account session, broken browser environment, or systemic tool issue, Agent Mode temporarily stops launching new Work handoffs for the affected capability/provider.

During the pause it should:

- continue unrelated normal-chat work;
- queue affected Work-only blockers;
- identify the shared failure cause;
- avoid escalating model strength merely because several projects are affected;
- resume only when the underlying condition changes or the user explicitly directs otherwise.

## Run exit criteria

Every Agent Mode run must have explicit terminal states and may not run indefinitely simply because more tasks exist.

Valid terminal states include:

- `completed` — authorized goal fully verified;
- `partially_completed` — verified progress made but remaining authorized work is blocked;
- `blocked` — no valid next action exists without new state/user input;
- `needs_user_action` — explicit user/account/legal/security action required;
- `paused` — intentionally paused at a safe checkpoint;
- `canceled` — user canceled the run;
- `failed` — bounded recovery exhausted without a safe continuation path.

A run must stop when its authorized objective is complete. It may not invent follow-on work merely to remain active.

## Cross-project scheduling after a breaker

A circuit breaker on one project does not freeze the entire portfolio.

Agent Mode may checkpoint the blocked project and continue eligible normal-chat work on another explicitly authorized project. When the blocked condition later changes, it may return to the first project and resume from the exact first incomplete unit.

Books remain governed by `AGENT_MODE_BOOKS_POLICY.md` and are never pulled into the queue automatically.

## Audit and efficiency metrics

Record at minimum:

- attempt fingerprint;
- attempt number;
- model/tool used;
- failure classification;
- whether state changed before retry;
- retry reason;
- backoff/cooldown applied;
- circuit-breaker activation;
- duplicate side effect prevented;
- final resolution;
- whether Work usage was avoided because a retry was blocked.

These records exist to improve routing and prevent repeated waste, not to fabricate account-wide Work usage percentages.

## Governing objective

**Agent Mode retries only when the next attempt is meaningfully different or a verified transient condition justifies one bounded retry. It never consumes scarce Work allowance by repeating the same failed command without new information.**
